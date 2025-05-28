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
} from "../shared/schema";
import path from "path";
import fs from "fs";
import { spawn } from "child_process";

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

  // Clear all data
  app.post("/api/clear", async (req, res) => {
    try {
      await storage.clearSwimmers();
      await storage.clearSwimmerTimes();
      await storage.clearCountyTimes();
      await storage.clearEventAssignments();
      await storage.clearRelayAssignments();
      await storage.clearOptimizationResults();
      res.json({ message: "All data cleared successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to clear data" });
    }
  });

  // Upload CSV
  app.post("/api/upload-csv", upload.single("file"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const csvContent = req.file.buffer.toString('utf-8');
      const lines = csvContent.split('\n').filter(line => line.trim());
      
      if (lines.length === 0) {
        return res.status(400).json({ message: "Empty CSV file" });
      }

      // Clear existing data
      await storage.clearSwimmers();
      await storage.clearSwimmerTimes();

      // Skip header row
      const dataLines = lines.slice(1);
      const swimmers = new Map();
      
      for (const line of dataLines) {
        const data = parseCSVLine(line);
        if (data.length < 15) continue;
        
        const [firstName, lastName, asaNo, dateOfBirth, meet, date, event, time, course, gender, age, , , countyQualify, timeInSecondsStr] = data;
        
        if (!firstName || !lastName || !asaNo) continue;

        const swimmerId = `${firstName}_${lastName}_${asaNo}`;
        
        if (!swimmers.has(swimmerId)) {
          const swimmer = await storage.createSwimmer({
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            asaNo: asaNo.trim(),
            dateOfBirth: dateOfBirth.trim(),
            gender: gender.trim(),
            age: parseInt(age) || 0,
            isAvailable: true
          });
          swimmers.set(swimmerId, swimmer);
        }
        
        const swimmer = swimmers.get(swimmerId);
        if (swimmer && time && time.trim() !== '') {
          const timeInSeconds = timeInSecondsStr ? parseFloat(timeInSecondsStr) : convertTimeToSeconds(time);
          
          await storage.createSwimmerTime({
            swimmerId: swimmer.id,
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

      const swimmerCount = swimmers.size;
      const timeCount = await storage.getSwimmerTimes();
      
      res.json({ 
        message: "CSV uploaded successfully", 
        swimmers: swimmerCount,
        times: timeCount.length
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

  // Get swimmers
  app.get("/api/swimmers", async (req, res) => {
    try {
      const swimmers = await storage.getSwimmers();
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
  app.post("/api/event-assignments", async (req, res) => {
    console.log("ASSIGNMENT API: Called with body:", JSON.stringify(req.body));
    
    try {
      const validatedData = insertEventAssignmentSchema.parse(req.body);
      console.log("ASSIGNMENT API: Validation passed");
      
      const assignment = await storage.createEventAssignment(validatedData);
      console.log("ASSIGNMENT API: Created assignment with ID:", assignment.id);
      
      // Immediately verify it's stored
      const allAssignments = await storage.getEventAssignments();
      console.log("ASSIGNMENT API: Total assignments after save:", allAssignments.length);
      
      res.json(assignment);
    } catch (error) {
      console.error("ASSIGNMENT API ERROR:", error);
      res.status(500).json({ error: "Failed to create event assignment", details: String(error) });
    }
  });

  app.get("/api/event-assignments", async (req, res) => {
    try {
      const assignments = await storage.getEventAssignments();
      res.json(assignments);
    } catch (error) {
      console.error("Error getting event assignments:", error);
      res.status(500).json({ error: "Failed to get event assignments" });
    }
  });

  // Get events
  app.get("/api/events", async (req, res) => {
    try {
      const events = {
        individual: [
          { event: "50m Freestyle", ageCategory: 11, gender: "M" },
          { event: "50m Freestyle", ageCategory: 11, gender: "F" },
          { event: "100m Freestyle", ageCategory: 16, gender: "M" },
          { event: "100m Freestyle", ageCategory: 16, gender: "F" },
          { event: "50m Backstroke", ageCategory: 13, gender: "M" },
          { event: "50m Backstroke", ageCategory: 13, gender: "F" },
          { event: "100m Backstroke", ageCategory: 16, gender: "M" },
          { event: "100m Backstroke", ageCategory: 16, gender: "F" },
          { event: "50m Breaststroke", ageCategory: 13, gender: "M" },
          { event: "50m Breaststroke", ageCategory: 13, gender: "F" },
          { event: "100m Breaststroke", ageCategory: 16, gender: "M" },
          { event: "100m Breaststroke", ageCategory: 16, gender: "F" },
          { event: "50m Butterfly", ageCategory: 13, gender: "M" },
          { event: "50m Butterfly", ageCategory: 13, gender: "F" },
          { event: "100m Butterfly", ageCategory: 16, gender: "M" },
          { event: "100m Butterfly", ageCategory: 16, gender: "F" },
          { event: "200m Individual Medley", ageCategory: 16, gender: "M" },
          { event: "200m Individual Medley", ageCategory: 16, gender: "F" }
        ],
        relay: [
          { relayName: "4x50m Freestyle", ageCategory: 13, gender: "M" },
          { relayName: "4x50m Freestyle", ageCategory: 13, gender: "F" },
          { relayName: "4x50m Medley", ageCategory: 13, gender: "M" },
          { relayName: "4x50m Medley", ageCategory: 13, gender: "F" },
          { relayName: "4x100m Freestyle", ageCategory: 16, gender: "M" },
          { relayName: "4x100m Freestyle", ageCategory: 16, gender: "F" },
          { relayName: "4x100m Medley", ageCategory: 16, gender: "M" },
          { relayName: "4x100m Medley", ageCategory: 16, gender: "F" }
        ]
      };
      
      res.json(events);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch events" });
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

  // Run optimization
  app.post("/api/optimize", async (req, res) => {
    console.log('Optimization endpoint called');
    
    // Check assignments in storage when optimization starts
    const testAssignments = await storage.getEventAssignments();
    console.log('OPTIMIZE DEBUG: Assignments in storage:', testAssignments.length);
    if (testAssignments.length > 0) {
      console.log('OPTIMIZE DEBUG: First assignment:', JSON.stringify(testAssignments[0], null, 2));
    }
    
    try {
      // Use fixed file names in the script directory
      const scriptDir = path.join(process.cwd(), 'server');
      const memberPbsPath = path.join(scriptDir, 'member_pbs.csv');
      const countyTimesPath = path.join(scriptDir, 'county_times_cleaned.csv');
      const preAssignmentsPath = path.join(scriptDir, 'pre_assignments.json');

      // Get pre-assignments from storage BEFORE clearing anything
      const eventAssignments = await storage.getEventAssignments();
      const relayAssignments = await storage.getRelayAssignments();
      
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
      const allSwimmers = await storage.getSwimmers();
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
      await storage.clearEventAssignments();
      await storage.clearRelayAssignments();
      
      fs.writeFileSync(preAssignmentsPath, JSON.stringify(preAssignments, null, 2));
      console.log('Pre-assignments saved to file:', preAssignments);

      // Export swimmer data to CSV - ALL SWIMMERS WITH AVAILABILITY STATUS
      const swimmerTimes = await storage.getSwimmerTimes();
      
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

  return createServer(app);
}