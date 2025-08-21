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
  insertSwimmersRegistrySchema,
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
    // Calculate age as of December 31st, 2025 for 2025/26 swimming season
    const referenceDate = new Date(2025, 11, 31); // December 31st, 2025
    
    // Check if date is valid
    if (isNaN(birthDate.getTime())) {
      console.warn(`Invalid date of birth: ${dateOfBirth}`);
      return 0;
    }
    
    let age = referenceDate.getFullYear() - birthDate.getFullYear();
    const monthDiff = referenceDate.getMonth() - birthDate.getMonth();
    
    // Adjust if birthday hasn't occurred by December 31st, 2025
    if (monthDiff < 0 || (monthDiff === 0 && referenceDate.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return Math.max(0, age); // Ensure non-negative age
  } catch (error) {
    console.warn(`Error calculating age from date of birth: ${dateOfBirth}`, error);
    return 0;
  }
}

// Generate custom event list from saved custom events
function generateCustomEventList(customEventsJson: string): any[] {
  try {
    const customEvents = JSON.parse(customEventsJson);
    return customEvents;
  } catch (error) {
    console.error('Error parsing custom events JSON:', error);
    return [];
  }
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

      let csvContent = req.file.buffer.toString('utf-8');
      const lines = csvContent.split('\n').filter(line => line.trim());
      
      if (lines.length === 0) {
        return res.status(400).json({ message: "Empty CSV file" });
      }

      // Check CSV format and convert if needed
      const headerLine = lines[0];
      const isNewFormat = headerLine.includes('First Name') && headerLine.includes('ASA No') && headerLine.includes('LC Time') && headerLine.includes('SC Time');
      
      if (isNewFormat) {
        console.log("Detected new CSV format - converting to legacy format...");
        
        // Create temporary input file
        const tempInputPath = path.join(process.cwd(), `temp_input_${Date.now()}.csv`);
        const tempOutputPath = path.join(process.cwd(), `temp_output_${Date.now()}.csv`);
        
        try {
          // Write original CSV to temp file
          fs.writeFileSync(tempInputPath, csvContent);
          
          // Run conversion script
          await new Promise<void>((resolve, reject) => {
            const pythonProcess = spawn('python3', ['enhanced_convert_csv_format_optimized.py', tempInputPath, tempOutputPath], {
              cwd: process.cwd(),
              stdio: ['pipe', 'pipe', 'pipe']
            });

            let stdout = '';
            let stderr = '';

            pythonProcess.stdout.on('data', (data) => {
              stdout += data.toString();
            });

            pythonProcess.stderr.on('data', (data) => {
              stderr += data.toString();
            });

            pythonProcess.on('close', (code) => {
              if (code === 0) {
                console.log('CSV conversion completed successfully');
                resolve();
              } else {
                console.error(`CSV conversion failed with code ${code}`);
                console.error('Error output:', stderr);
                reject(new Error(`CSV conversion failed: ${stderr}`));
              }
            });
          });
          
          // Read converted CSV content
          if (fs.existsSync(tempOutputPath)) {
            csvContent = fs.readFileSync(tempOutputPath, 'utf-8');
            console.log("Successfully converted CSV to legacy format");
          } else {
            throw new Error("Conversion output file not found");
          }
          
        } finally {
          // Clean up temp files
          if (fs.existsSync(tempInputPath)) {
            fs.unlinkSync(tempInputPath);
          }
          if (fs.existsSync(tempOutputPath)) {
            fs.unlinkSync(tempOutputPath);
          }
        }
      }

      // Parse converted/original CSV content
      const processedLines = csvContent.split('\n').filter(line => line.trim());

      // Clear existing team data
      await storage.clearSwimmers(teamId);
      await storage.clearSwimmerTimes(teamId);

      // Skip header row
      const dataLines = processedLines.slice(1);
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
      const countyTimesToCreate = [];
      
      for (const line of dataLines) {
        const data = parseCSVLine(line);
        if (data.length >= 6) {
          const [event, time, ageCategory, course, timeType, gender] = data;
          
          const timeInSeconds = convertTimeToSeconds(time);
          
          countyTimesToCreate.push({
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

      // Batch create all county times
      await storage.createCountyTimesBatch(countyTimesToCreate);

      res.json({ 
        message: "County times loaded successfully",
        recordCount: countyTimesToCreate.length
      });
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

  // Update swimmer availability by team and swimmer ID
  app.patch("/api/swimmers/:teamId/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const teamId = parseInt(req.params.teamId);
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

  // Update swimmer availability (legacy route for backwards compatibility)
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

  // Swimmers Registry Management Routes
  app.get("/api/swimmers-registry", async (req, res) => {
    try {
      const swimmers = await storage.getSwimmersRegistry();
      res.json(swimmers);
    } catch (error) {
      console.error("Failed to fetch swimmers registry:", error);
      res.status(500).json({ message: "Failed to fetch swimmers registry" });
    }
  });

  app.post("/api/swimmers-registry", async (req, res) => {
    try {
      const validatedData = insertSwimmersRegistrySchema.parse(req.body);
      const swimmer = await storage.createSwimmerRegistryEntry(validatedData);
      res.json(swimmer);
    } catch (error) {
      console.error("Failed to create swimmer registry entry:", error);
      res.status(500).json({ message: "Failed to create swimmer registry entry" });
    }
  });

  app.delete("/api/swimmers-registry/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteSwimmerRegistryEntry(id);
      res.json({ message: "Swimmer registry entry deleted successfully" });
    } catch (error) {
      console.error("Failed to delete swimmer registry entry:", error);
      res.status(500).json({ message: "Failed to delete swimmer registry entry" });
    }
  });

  app.post("/api/swimmers-registry/import", async (req, res) => {
    try {
      const { swimmers } = req.body;
      if (!Array.isArray(swimmers)) {
        return res.status(400).json({ message: "Swimmers data must be an array" });
      }

      let imported = 0;
      let skipped = 0;

      for (const swimmerData of swimmers) {
        try {
          const validatedData = insertSwimmersRegistrySchema.parse(swimmerData);
          await storage.createSwimmerRegistryEntry(validatedData);
          imported++;
        } catch (error) {
          console.warn(`Skipping swimmer ${swimmerData.firstName} ${swimmerData.lastName}:`, error instanceof Error ? error.message : String(error));
          skipped++;
        }
      }

      res.json({ 
        message: "Import completed",
        imported,
        skipped,
        total: swimmers.length
      });
    } catch (error) {
      console.error("Failed to import swimmers:", error);
      res.status(500).json({ message: "Failed to import swimmers" });
    }
  });

  app.get("/api/swimmers-registry/gender/:asaNo", async (req, res) => {
    try {
      const asaNo = req.params.asaNo;
      const swimmer = await storage.getSwimmerRegistryByAsaNo(asaNo);
      
      if (!swimmer) {
        return res.status(404).json({ message: "Swimmer not found" });
      }
      
      res.json({ gender: swimmer.gender });
    } catch (error) {
      console.error("Failed to get swimmer gender:", error);
      res.status(500).json({ message: "Failed to get swimmer gender" });
    }
  });

  // Bulk gender lookup for performance optimization
  app.post("/api/swimmers-registry/gender/bulk", async (req, res) => {
    try {
      const { asaNumbers } = req.body;
      
      if (!asaNumbers || !Array.isArray(asaNumbers)) {
        return res.status(400).json({ message: "asaNumbers array is required" });
      }
      
      const genders: { [asaNo: string]: string } = {};
      
      // Perform bulk lookup with a single database query
      const swimmers = await storage.getSwimmersRegistryByAsaNos(asaNumbers);
      
      swimmers.forEach(swimmer => {
        genders[swimmer.asaNo] = swimmer.gender;
      });
      
      res.json({ genders });
    } catch (error) {
      console.error("Failed to get bulk swimmer genders:", error);
      res.status(500).json({ message: "Failed to get bulk swimmer genders" });
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

  // Get relay assignments for a team
  app.get("/api/relay-assignments/:teamId", async (req, res) => {
    try {
      const teamId = parseInt(req.params.teamId);
      const assignments = await storage.getRelayAssignments(teamId);
      res.json(assignments);
    } catch (error) {
      console.error("Error getting relay assignments:", error);
      res.status(500).json({ error: "Failed to get relay assignments" });
    }
  });

  // Clear relay assignments for a team
  app.delete("/api/relay-assignments/team/:teamId", async (req, res) => {
    try {
      const teamId = parseInt(req.params.teamId);
      await storage.clearRelayAssignments(teamId);
      res.json({ message: "Relay assignments cleared successfully" });
    } catch (error) {
      console.error("Error clearing relay assignments:", error);
      res.status(500).json({ error: "Failed to clear relay assignments" });
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
      
      // Clear only non-pre-assigned assignments - preserve user's manual pre-assignments
      await storage.clearNonPreAssignedEventAssignments(teamId);
      await storage.clearNonPreAssignedRelayAssignments(teamId);
      
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
            calculateAgeFromDateOfBirth(swimmer.dateOfBirth) || '',
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
          
          // Clear previous optimization results for this team
          await storage.clearOptimizationResults(teamId);
          
          // Generate a session ID for this optimization run
          const sessionId = `team_${teamId}_${Date.now()}`;
          
          // Save individual event results to database
          for (const individualResult of results.individual) {
            await storage.createOptimizationResult({
              teamId,
              sessionId,
              resultType: 'individual',
              event: individualResult.event,
              swimmers: JSON.stringify({
                swimmer: individualResult.swimmer,
                time: individualResult.time,
                index: individualResult.index,
                status: individualResult.status
              }),
              totalTime: individualResult.time,
              createdAt: new Date().toISOString()
            });
          }
          
          // Save relay event results to database
          for (const relayResult of results.relay) {
            await storage.createOptimizationResult({
              teamId,
              sessionId,
              resultType: 'relay',
              event: relayResult.relay,
              swimmers: JSON.stringify({
                swimmers: relayResult.swimmers,
                totalTime: relayResult.totalTime
              }),
              totalTime: relayResult.totalTime,
              createdAt: new Date().toISOString()
            });
          }
          
          console.log(`BACKEND: Saved ${results.individual.length} individual and ${results.relay.length} relay results to database`);
          
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

  // Route for saving custom team events
  app.post("/api/teams/:id/events", async (req, res) => {
    try {
      const teamId = parseInt(req.params.id);
      const { events } = req.body;
      
      // Clear existing events for this team
      await storage.clearTeamEvents(teamId);
      
      // Insert new events
      const teamEvents = events.map((event: any) => ({
        teamId,
        event: event.event,
        ageCategory: event.ageCategory,
        gender: event.gender,
        isRelay: event.isRelay
      }));
      
      await storage.createTeamEventsBatch(teamEvents);
      
      res.json({ message: "Events saved successfully", count: events.length });
    } catch (error) {
      console.error("Error saving team events:", error);
      res.status(500).json({ message: "Failed to save team events" });
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

  // Get latest optimization results for a team (without session ID)
  app.get("/api/teams/:teamId/optimization-results", async (req, res) => {
    try {
      const teamId = parseInt(req.params.teamId);
      const results = await storage.getOptimizationResultsByTeam(teamId);
      
      // Transform database results back to frontend format
      const individual = results
        .filter(r => r.resultType === 'individual')
        .map(r => {
          const swimmers = JSON.parse(r.swimmers);
          return {
            event: r.event,
            swimmer: swimmers.swimmer,
            time: swimmers.time,
            index: swimmers.index,
            status: swimmers.status
          };
        });
        
      const relay = results
        .filter(r => r.resultType === 'relay')
        .map(r => {
          const swimmers = JSON.parse(r.swimmers);
          return {
            relay: r.event,
            totalTime: swimmers.totalTime,
            swimmers: swimmers.swimmers
          };
        });
        
      // Calculate stats
      const stats = {
        qualifyingTimes: individual.filter(r => r.status === 'QT').length,
        averageIndex: individual.length > 0 ? individual.reduce((acc, r) => acc + (r.index || 0), 0) / individual.length : 0,
        relayTeams: relay.length,
        totalEvents: individual.length + relay.length
      };
      
      res.json({ individual, relay, stats });
    } catch (error) {
      console.error("Error fetching team optimization results:", error);
      res.status(500).json({ message: "Failed to fetch optimization results" });
    }
  });

  return createServer(app);
}