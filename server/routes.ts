import { Express } from "express";
import { createServer, Server } from "http";
import multer from "multer";
import { storage } from "./storage";
import {
  insertSwimmerSchema,
  insertSwimmerTimeSchema,
  insertCountyTimeSchema,
  insertEventAssignmentSchema,
  insertRelayAssignmentSchema,
  type InsertSwimmer,
  type InsertSwimmerTime,
} from "../shared/schema";
import path from "path";
import fs from "fs";
import { spawn } from "child_process";
import { COMPETITION_TYPES, CUSTOM_COMPETITION_CONFIG, type CompetitionType } from "@shared/constants";

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current.trim());
  return result;
}

function calculateAgeFromDateOfBirth(dateOfBirth: string): number {
  try {
    // Parse date in YYYY-MM-DD format
    const birthDate = new Date(dateOfBirth);
    const today = new Date();
    
    // Check if date is valid
    if (isNaN(birthDate.getTime())) {
      console.warn(`Invalid date of birth: ${dateOfBirth}`);
      return 0;
    }
    
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    // Adjust if birthday hasn't occurred this year yet
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return Math.max(0, age); // Ensure non-negative age
  } catch (error) {
    console.warn(`Error calculating age from date of birth: ${dateOfBirth}`, error);
    return 0;
  }
}

// Generate custom event list from selected events
function generateCustomEventList(customEvents: {individual: string[], relay: string[]}): any[] {
  const events = [];
  
  // Process individual events
  for (const eventKey of customEvents.individual) {
    const eventConfig = CUSTOM_COMPETITION_CONFIG.individualEvents.find(e => e.key === eventKey);
    if (eventConfig) {
      for (const ageCategory of eventConfig.ageCategories) {
        for (const gender of eventConfig.genders) {
          events.push({
            event: eventConfig.event,
            ageCategory,
            gender,
            isRelay: false
          });
        }
      }
    }
  }
  
  // Process relay events
  for (const relayKey of customEvents.relay) {
    const relayConfig = CUSTOM_COMPETITION_CONFIG.relayEvents.find(r => r.key === relayKey);
    if (relayConfig) {
      for (const ageCategory of relayConfig.ageCategories) {
        for (const gender of relayConfig.genders) {
          events.push({
            event: relayConfig.relayName,
            ageCategory,
            gender,
            isRelay: true
          });
        }
      }
    }
  }
  
  return events;
}

function convertTimeToSeconds(timeStr: string): number {
  if (!timeStr || timeStr.trim() === '') return 0;
  
  const parts = timeStr.trim().split(':');
  let totalSeconds = 0;
  
  if (parts.length === 3) {
    // HH:MM:SS.MS format
    totalSeconds += parseInt(parts[0]) * 3600; // hours
    totalSeconds += parseInt(parts[1]) * 60;   // minutes
    totalSeconds += parseFloat(parts[2]);      // seconds
  } else if (parts.length === 2) {
    // MM:SS.MS format
    totalSeconds += parseInt(parts[0]) * 60;   // minutes
    totalSeconds += parseFloat(parts[1]);      // seconds
  } else {
    // Just seconds
    totalSeconds = parseFloat(timeStr);
  }
  
  return totalSeconds;
}

export async function registerRoutes(app: Express): Promise<Server> {
  const upload = multer({ storage: multer.memoryStorage() });

  // Clear team-specific data
  app.post("/api/clear/:teamId", async (req, res) => {
    try {
      const teamId = parseInt(req.params.teamId);
      await storage.clearSwimmers(teamId);
      await storage.clearSwimmerTimes(teamId);
      await storage.clearEventAssignments(teamId);
      await storage.clearRelayAssignments(teamId);
      await storage.clearOptimizationResults(teamId);
      await storage.clearTeamEvents(teamId);
      res.json({ message: "Team data cleared successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to clear team data" });
    }
  });

  // Upload CSV for a specific team
  app.post("/api/upload-csv/:teamId", upload.single("file"), async (req, res) => {
    try {
      const teamId = parseInt(req.params.teamId);
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const csvContent = req.file.buffer.toString('utf-8');
      const lines = csvContent.split('\n').filter(line => line.trim());
      
      if (lines.length === 0) {
        return res.status(400).json({ message: "Empty CSV file" });
      }

      // Clear existing team data
      await storage.clearSwimmers(teamId);
      await storage.clearSwimmerTimes(teamId);

      // Skip header row
      const dataLines = lines.slice(1);
      const swimmersToCreate: InsertSwimmer[] = [];
      const timesToCreate: InsertSwimmerTime[] = [];
      const swimmerMap = new Map<string, number>(); // Track swimmer IDs by key
      
      // First pass: collect unique swimmers
      for (const line of dataLines) {
        const data = parseCSVLine(line);
        if (data.length < 15) continue;
        
        const [firstName, lastName, asaNo, dateOfBirth, meet, date, event, time, course, gender, age, , , countyQualify, timeInSecondsStr] = data;
        
        if (!firstName || !lastName || !asaNo) continue;

        const swimmerId = `${firstName}_${lastName}_${asaNo}`;
        
        if (!swimmerMap.has(swimmerId)) {
          // Calculate age from date of birth instead of using CSV age column
          const calculatedAge = calculateAgeFromDateOfBirth(dateOfBirth.trim());
          

          
          swimmersToCreate.push({
            teamId,
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            asaNo: asaNo.trim(),
            dateOfBirth: dateOfBirth.trim(),
            gender: gender.trim(),
            age: calculatedAge,
            isAvailable: true
          });
          swimmerMap.set(swimmerId, swimmersToCreate.length - 1); // Store index for now
        }
      }

      // Batch create swimmers
      const createdSwimmers = await storage.createSwimmersBatch(swimmersToCreate);
      
      // Update swimmer map with actual IDs
      createdSwimmers.forEach((swimmer, index) => {
        const key = `${swimmer.firstName}_${swimmer.lastName}_${swimmer.asaNo}`;
        swimmerMap.set(key, swimmer.id);
      });

      // Second pass: collect times
      for (const line of dataLines) {
        const data = parseCSVLine(line);
        if (data.length < 15) continue;
        
        const [firstName, lastName, asaNo, dateOfBirth, meet, date, event, time, course, gender, age, , , countyQualify, timeInSecondsStr] = data;
        
        if (!firstName || !lastName || !asaNo || !time || time.trim() === '') continue;

        const swimmerId = `${firstName}_${lastName}_${asaNo}`;
        const dbSwimmerId = swimmerMap.get(swimmerId);
        
        if (dbSwimmerId) {
          const timeInSeconds = timeInSecondsStr ? parseFloat(timeInSecondsStr) : convertTimeToSeconds(time);
          
          timesToCreate.push({
            teamId,
            swimmerId: dbSwimmerId,
            event: event.trim(),
            course: course.trim(),
            time: time.trim(),
            timeInSeconds,
            meet: meet.trim(),
            date: date.trim(),
            countyQualify: countyQualify && countyQualify.trim() !== '' ? countyQualify.trim() : null
          });
        }
      }

      // Batch create times
      await storage.createSwimmerTimesBatch(timesToCreate);

      // Update team progress
      await storage.updateTeam(teamId, { 
        currentStep: 2,  // Move to squad selection step
      });

      const swimmerCount = createdSwimmers.length;
      const timeCount = timesToCreate.length;
      
      res.json({ 
        message: "CSV uploaded successfully", 
        swimmerCount,
        recordCount: timeCount
      });
    } catch (error) {
      console.error("CSV upload error:", error);
      res.status(500).json({ message: "Failed to upload CSV" });
    }
  });

  // Load county times
  app.post("/api/load-county-times", async (req, res) => {
    try {
      await storage.clearCountyTimes();
      
      const countyTimesPath = path.join(process.cwd(), 'attached_assets', 'county_times_cleaned.csv');
      
      if (!fs.existsSync(countyTimesPath)) {
        return res.status(404).json({ message: "County times file not found" });
      }

      const csvContent = fs.readFileSync(countyTimesPath, 'utf-8');
      const lines = csvContent.split('\n').filter(line => line.trim());
      
      // Skip header row
      const dataLines = lines.slice(1);
      
      for (const line of dataLines) {
        const data = parseCSVLine(line);
        if (data.length >= 6) {
          const [event, time, ageCategory, course, timeType, gender] = data;
          
          const timeInSeconds = convertTimeToSeconds(time);
          
          await storage.createCountyTime({
            event: event.trim(),
            time: time.trim(),
            ageCategory: parseInt(ageCategory),
            course: course.trim(),
            timeType: timeType.trim(),
            gender: gender.trim(),
            timeInSeconds
          });
        }
      }

      res.json({ message: "County times loaded successfully" });
    } catch (error) {
      console.error("County times loading error:", error);
      res.status(500).json({ message: "Failed to load county times" });
    }
  });

  // Get swimmers for a specific team
  app.get("/api/swimmers/:teamId", async (req, res) => {
    try {
      const teamId = parseInt(req.params.teamId);
      const swimmers = await storage.getSwimmers(teamId);
      res.json(swimmers);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch swimmers" });
    }
  });

  // Update swimmer availability
  app.patch("/api/swimmers/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { isAvailable } = req.body;
      
      const swimmer = await storage.updateSwimmer(id, { isAvailable });
      
      if (!swimmer) {
        return res.status(404).json({ message: "Swimmer not found" });
      }
      
      res.json(swimmer);
    } catch (error) {
      res.status(500).json({ message: "Failed to update swimmer" });
    }
  });

  // Event assignments endpoints
  app.post("/api/event-assignments/:teamId", async (req, res) => {
    console.log("ASSIGNMENT API: Called with body:", JSON.stringify(req.body));
    
    try {
      const teamId = parseInt(req.params.teamId);
      const validatedData = insertEventAssignmentSchema.parse({ ...req.body, teamId });
      console.log("ASSIGNMENT API: Validation passed");
      
      const assignment = await storage.createEventAssignment(validatedData);
      console.log("ASSIGNMENT API: Created assignment with ID:", assignment.id);
      
      // Immediately verify it's stored
      const allAssignments = await storage.getEventAssignments(teamId);
      console.log("ASSIGNMENT API: Total assignments after save:", allAssignments.length);
      
      res.json(assignment);
    } catch (error) {
      console.error("ASSIGNMENT API ERROR:", error);
      res.status(500).json({ error: "Failed to create event assignment", details: String(error) });
    }
  });

  app.get("/api/event-assignments/:teamId", async (req, res) => {
    try {
      const teamId = parseInt(req.params.teamId);
      const assignments = await storage.getEventAssignments(teamId);
      res.json(assignments);
    } catch (error) {
      console.error("Error getting event assignments:", error);
      res.status(500).json({ error: "Failed to get event assignments" });
    }
  });





  // Create relay assignment
  app.post("/api/relay-assignments", async (req, res) => {
    try {
      const validatedData = insertRelayAssignmentSchema.parse(req.body);
      const assignment = await storage.createRelayAssignment(validatedData);
      res.json(assignment);
    } catch (error) {
      console.error("Relay assignment error:", error);
      res.status(500).json({ message: "Failed to create relay assignment", error: String(error) });
    }
  });

  // Run optimization for a specific team
  app.post("/api/optimize/:teamId", async (req, res) => {
    const teamId = parseInt(req.params.teamId);
    console.log(`Optimization endpoint called for team ${teamId}`);
    
    // Check assignments in storage when optimization starts
    const testAssignments = await storage.getEventAssignments(teamId);
    console.log('OPTIMIZE DEBUG: Assignments in storage:', testAssignments.length);
    if (testAssignments.length > 0) {
      console.log('OPTIMIZE DEBUG: First assignment:', JSON.stringify(testAssignments[0], null, 2));
    }
    
    try {
      // Get team details and events
      const team = await storage.getTeam(teamId);
      if (!team) {
        return res.status(404).json({ message: "Team not found" });
      }
      
      const teamEvents = await storage.getTeamEvents(teamId);
      
      // Use fixed file names in the script directory
      const scriptDir = path.join(process.cwd(), 'server');
      const memberPbsPath = path.join(scriptDir, 'member_pbs.csv');
      const countyTimesPath = path.join(scriptDir, 'county_times_cleaned.csv');
      const preAssignmentsPath = path.join(scriptDir, 'pre_assignments.json');
      const eventListPath = path.join(scriptDir, 'event_list.json');
      const configPath = path.join(scriptDir, 'optimization_config.json');

      // Get pre-assignments from storage BEFORE clearing anything
      const eventAssignments = await storage.getEventAssignments(teamId);
      const relayAssignments = await storage.getRelayAssignments(teamId);
      
      console.log('Raw event assignments from storage:', eventAssignments);
      
      const preAssignments = {
        individual: eventAssignments.filter(a => a.isPreAssigned).map(a => ({
          event: a.event,
          ageCategory: a.ageCategory,
          gender: a.gender,
          swimmerId: a.swimmerId
        })),
        relay: relayAssignments.filter(a => a.isPreAssigned).map(a => ({
          relayName: a.relayName,
          ageCategory: a.ageCategory,
          gender: a.gender,
          position: a.position,
          stroke: a.stroke,
          swimmerId: a.swimmerId
        }))
      };
      
      console.log('BACKEND: Pre-assignments created for Python script:', JSON.stringify(preAssignments, null, 2));
      console.log(`BACKEND: Found ${preAssignments.individual.length} individual pre-assignments`);
      
      // Validate swimmer IDs exist in available swimmers
      const allSwimmers = await storage.getSwimmers(teamId);
      const availableSwimmersForValidation = allSwimmers.filter(s => s.isAvailable);
      
      for (const assignment of preAssignments.individual) {
        const swimmer = availableSwimmersForValidation.find(s => s.asaNo === assignment.swimmerId);
        if (swimmer) {
          console.log(`BACKEND: Validated pre-assignment - ${swimmer.firstName} ${swimmer.lastName} (ASA: ${assignment.swimmerId}) -> ${assignment.event} ${assignment.ageCategory} ${assignment.gender}`);
        } else {
          console.log(`BACKEND: WARNING - Pre-assignment references unknown swimmer ASA: ${assignment.swimmerId}`);
        }
      }
      
      // Clear all assignments - the Python script will regenerate everything
      await storage.clearEventAssignments(teamId);
      await storage.clearRelayAssignments(teamId);
      
      // Generate event list for Python optimizer (ALL events - individual AND relay)
      const allEvents = teamEvents.map(e => [e.event, e.ageCategory, e.gender]);
      
      // Generate optimization configuration
      const optimizationConfig = {
        maxIndividualEvents: team.maxIndividualEvents || 2,
        competitionType: team.competitionType,
        totalEvents: teamEvents.length,
        individualEvents: teamEvents.filter(e => !e.isRelay).length,
        relayEvents: teamEvents.filter(e => e.isRelay).length
      };
      
      console.log(`BACKEND: Generated event list with ${allEvents.length} total events (${teamEvents.filter(e => !e.isRelay).length} individual, ${teamEvents.filter(e => e.isRelay).length} relay) for ${team.competitionType}`);
      console.log(`BACKEND: Max individual events per swimmer: ${optimizationConfig.maxIndividualEvents}`);
      
      // Save files for Python optimizer
      fs.writeFileSync(preAssignmentsPath, JSON.stringify(preAssignments, null, 2));
      fs.writeFileSync(eventListPath, JSON.stringify(allEvents, null, 2));
      fs.writeFileSync(configPath, JSON.stringify(optimizationConfig, null, 2));
      
      console.log('Pre-assignments saved to file:', preAssignments);
      console.log('Event list saved for optimizer:', allEvents.slice(0, 5), '...');

      // Export swimmer data to CSV - ALL SWIMMERS WITH AVAILABILITY STATUS
      const swimmerTimes = await storage.getSwimmerTimes(teamId);
      
      // First, let's make sure we have some available swimmers
      console.log(`BACKEND: About to process ${swimmerTimes.length} swimmer times for ${allSwimmers.length} swimmers`);
      
      console.log(`BACKEND: Total swimmers: ${allSwimmers.length}, Total swim times: ${swimmerTimes.length}`);
      
      // Debug swimmer availability states
      const availableCount = allSwimmers.filter(s => s.isAvailable).length;
      const unavailableCount = allSwimmers.length - availableCount;
      console.log(`BACKEND: Available swimmers: ${availableCount}, Unavailable swimmers: ${unavailableCount}`);
      
      let csvContent = 'First_Name,Last_Name,ASA_No,Date_of_Birth,Meet,Date,Event,SC_Time,Course,Gender,AgeTime,County_QT,Count_CT,County_Qualify,time_in_seconds,isAvailable\n';
      console.log(`BACKEND: CSV Header has ${csvContent.trim().split(',').length} columns`);
      
      let csvRowCount = 0;
      for (const time of swimmerTimes) {
        const swimmer = allSwimmers.find(s => s.id === time.swimmerId);
        if (swimmer) {
          csvRowCount++;
          const availabilityStatus = swimmer.isAvailable ? 'true' : 'false';
          
          // Build CSV row with explicit column mapping - ensuring no undefined values
          const csvRow = [
            swimmer.firstName || '',
            swimmer.lastName || '',
            swimmer.asaNo || '',
            swimmer.dateOfBirth || '',
            time.meet || '',
            time.date || '',
            time.event || '',
            time.time || '',
            time.course || '',
            swimmer.gender || '',
            swimmer.age || '',
            '', // County_QT (empty)
            '', // Count_CT (empty)
            time.countyQualify || 'No',
            time.timeInSeconds || '',
            availabilityStatus
          ];
          
          const csvRowString = csvRow.join(',');
          
          if (csvRowCount <= 3) { // Log first 3 rows for debugging
            console.log(`BACKEND: Row ${csvRowCount} - Swimmer ${swimmer.firstName} ${swimmer.lastName} (Available: ${swimmer.isAvailable})`);
            console.log(`BACKEND: CSV row has ${csvRow.length} columns: ${csvRowString}`);
          }
          
          csvContent += csvRowString + '\n';
        }
      }
      
      console.log(`BACKEND: Generated CSV with ${csvRowCount} data rows`);
      
      fs.writeFileSync(memberPbsPath, csvContent);
      
      // Debug: Check what was actually written
      const writtenContent = fs.readFileSync(memberPbsPath, 'utf8');
      const lines = writtenContent.split('\n');
      console.log(`BACKEND: CSV file written with ${lines.length} lines total`);
      console.log(`BACKEND: Header line: ${lines[0]}`);
      if (lines.length > 1) {
        console.log(`BACKEND: First data line: ${lines[1]}`);
        console.log(`BACKEND: First data line has ${lines[1].split(',').length} columns`);
      }

      // Export county times to CSV
      const countyTimes = await storage.getCountyTimes();
      let countyTimesContent = 'Event,Time,Age Category,Course,Time Type,Gender\n';
      
      for (const time of countyTimes) {
        countyTimesContent += `${time.event},${time.time},${time.ageCategory},${time.course},${time.timeType},${time.gender}\n`;
      }
      
      fs.writeFileSync(countyTimesPath, countyTimesContent);

      console.log('Files created successfully, running Python script...');

      // Run Python optimization script
      const pythonScript = path.join(process.cwd(), 'server', 'optimizer.py');
      const python = spawn('python3', [pythonScript], {
        cwd: scriptDir
      });

      let output = '';
      let errorOutput = '';

      python.stdout.on('data', (data) => {
        output += data.toString();
      });

      python.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      python.on('close', async (code) => {
        // Show Python debugging output
        if (output) {
          console.log('PYTHON STDOUT:');
          console.log(output);
        }
        if (errorOutput) {
          console.log('PYTHON STDERR:');
          console.log(errorOutput);
        }
        
        console.log(`PYTHON SCRIPT: Exited with code ${code}`);

        // Try to read debug log file
        try {
          const debugLogPath = path.join(scriptDir, 'debug.log');
          if (fs.existsSync(debugLogPath)) {
            const debugContent = fs.readFileSync(debugLogPath, 'utf8');
            console.log('PYTHON DEBUG LOG:');
            console.log(debugContent);
            fs.unlinkSync(debugLogPath); // Clean up
          }
        } catch (e) {
          console.log('No debug log found');
        }

        // Clean up temp files
        try {
          fs.unlinkSync(memberPbsPath);
          fs.unlinkSync(countyTimesPath);
          fs.unlinkSync(preAssignmentsPath);
        } catch (e) {
          console.log('Error cleaning up temp files:', e);
        }

        if (code !== 0) {
          console.error('Python script error:', errorOutput);
          
          // Try to parse error output as JSON first (early exit case)
          try {
            const errorResult = JSON.parse(output);
            if (errorResult.error) {
              console.log('PYTHON: Handled error response:', errorResult.error);
              return res.json(errorResult); // Return the structured error response
            }
          } catch (parseError) {
            // Not JSON, treat as regular error
            console.log('PYTHON: Non-JSON error output');
          }
          
          return res.status(500).json({ message: 'Optimization failed', error: errorOutput });
        }

        try {
          const results = JSON.parse(output);
          console.log('PYTHON: Optimization completed successfully');
          
          // Update team status to "selected" and current step to results (4)
          await storage.updateTeam(teamId, { 
            status: "selected",
            currentStep: 4
          });
          
          res.json(results);
        } catch (parseError) {
          console.error('Failed to parse optimization results:', parseError);
          console.error('Raw output was:', output);
          res.status(500).json({ message: 'Failed to parse optimization results' });
        }
      });

    } catch (error) {
      console.error('Optimization error:', error);
      res.status(500).json({ message: 'Optimization failed', error: String(error) });
    }
  });

  // Team management routes
  app.get("/api/teams", async (req, res) => {
    try {
      const teams = await storage.getTeams();
      res.json(teams);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch teams" });
    }
  });

  app.get("/api/teams/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const team = await storage.getTeam(id);
      if (!team) {
        return res.status(404).json({ message: "Team not found" });
      }
      res.json(team);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch team" });
    }
  });

  // Get team events
  app.get("/api/teams/:teamId/events", async (req, res) => {
    try {
      const teamId = parseInt(req.params.teamId);
      const events = await storage.getTeamEvents(teamId);
      
      // Convert to the format expected by frontend
      const individual = events
        .filter(e => !e.isRelay)
        .map(e => ({
          event: e.event,
          ageCategory: e.ageCategory,
          gender: e.gender === 'Male' ? 'M' : e.gender === 'Female' ? 'F' : e.gender
        }));
        
      const relay = events
        .filter(e => e.isRelay)
        .map(e => ({
          event: e.event,  // Changed from relayName to event for consistency
          ageCategory: e.ageCategory,
          gender: e.gender === 'Male' ? 'M' : e.gender === 'Female' ? 'F' : e.gender
        }));
      
      res.json({ individual, relay });
    } catch (error) {
      console.error("Error fetching team events:", error);
      res.status(500).json({ message: "Failed to fetch team events" });
    }
  });

  app.post("/api/teams", async (req, res) => {
    try {
      // Handle both direct team creation and custom team creation with events
      const { team, customEvents } = req.body.team ? req.body : { team: req.body, customEvents: null };
      
      const createdTeam = await storage.createTeam({
        ...team,
        status: "in_progress",
        currentStep: 1
      });
      
      let events = [];
      
      if (createdTeam.competitionType === COMPETITION_TYPES.CUSTOM && customEvents) {
        // For custom competitions with selected events, generate the event list
        events = generateCustomEventList(customEvents);
        console.log(`BACKEND: Creating custom competition with ${events.length} events`);
      } else {
        // Use predefined events for Arena League and County Relays
        const { getEventListForCompetition } = await import("@shared/constants");
        events = getEventListForCompetition(createdTeam.competitionType as CompetitionType);
        console.log(`BACKEND: Creating ${createdTeam.competitionType} competition with ${events.length} events`);
      }
      
      if (events.length > 0) {
        const teamEvents = events.map(event => ({
          teamId: createdTeam.id,
          event: event.event,
          ageCategory: event.ageCategory,
          gender: event.gender,
          isRelay: event.isRelay
        }));
        
        await storage.createTeamEventsBatch(teamEvents);
      }
      
      res.json(createdTeam);
    } catch (error) {
      console.error("Team creation error:", error);
      res.status(500).json({ message: "Failed to create team", error: String(error) });
    }
  });

  app.patch("/api/teams/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const team = await storage.updateTeam(id, req.body);
      if (!team) {
        return res.status(404).json({ message: "Team not found" });
      }
      res.json(team);
    } catch (error) {
      res.status(500).json({ message: "Failed to update team" });
    }
  });

  app.delete("/api/teams/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteTeam(id);
      res.json({ message: "Team deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete team" });
    }
  });

  app.get("/api/teams/:id/events", async (req, res) => {
    try {
      const teamId = parseInt(req.params.id);
      const events = await storage.getTeamEvents(teamId);
      res.json(events);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch team events" });
    }
  });

  app.post("/api/teams/:id/events", async (req, res) => {
    try {
      const teamId = parseInt(req.params.id);
      const event = await storage.createTeamEvent({
        ...req.body,
        teamId
      });
      res.json(event);
    } catch (error) {
      res.status(500).json({ message: "Failed to create team event" });
    }
  });

  // Get optimization results for a team
  app.get("/api/optimization-results/:teamId/:sessionId", async (req, res) => {
    try {
      const teamId = parseInt(req.params.teamId);
      const sessionId = req.params.sessionId;
      const results = await storage.getOptimizationResults(sessionId, teamId);
      res.json(results);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch optimization results" });
    }
  });

  return createServer(app);
}