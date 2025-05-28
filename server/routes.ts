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
    try {
      console.log("Event assignment request body:", req.body);
      const validatedData = insertEventAssignmentSchema.parse(req.body);
      console.log("Validated assignment data:", validatedData);
      const assignment = await storage.createEventAssignment(validatedData);
      console.log("Assignment created successfully:", assignment);
      res.json(assignment);
    } catch (error) {
      console.error("Error creating event assignment:", error);
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

  // Create event assignment
  app.post("/api/event-assignments", async (req, res) => {
    try {
      const validatedData = insertEventAssignmentSchema.parse(req.body);
      const assignment = await storage.createEventAssignment(validatedData);
      res.json(assignment);
    } catch (error) {
      res.status(500).json({ message: "Failed to create event assignment" });
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
    
    try {
      // Use fixed file names in the script directory
      const scriptDir = path.join(process.cwd(), 'server');
      const memberPbsPath = path.join(scriptDir, 'member_pbs.csv');
      const countyTimesPath = path.join(scriptDir, 'county_times_cleaned.csv');
      const preAssignmentsPath = path.join(scriptDir, 'pre_assignments.json');

      // Get pre-assignments from storage first, then clear all assignments
      const eventAssignments = await storage.getEventAssignments();
      const relayAssignments = await storage.getRelayAssignments();
      
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
      
      // Clear all assignments - the Python script will regenerate everything
      await storage.clearEventAssignments();
      await storage.clearRelayAssignments();
      
      fs.writeFileSync(preAssignmentsPath, JSON.stringify(preAssignments, null, 2));
      console.log('Pre-assignments saved to file:', preAssignments);

      // Export swimmer data to CSV
      const swimmers = await storage.getSwimmers();
      const availableSwimmers = swimmers.filter(s => s.isAvailable);
      const swimmerTimes = await storage.getSwimmerTimes();
      
      let csvContent = 'First_Name,Last_Name,ASA_No,Date_of_Birth,Meet,Date,Event,SC_Time,Course,Gender,AgeTime,County_QT,Count_CT,County_Qualify,time_in_seconds\n';
      
      for (const time of swimmerTimes) {
        const swimmer = availableSwimmers.find(s => s.id === time.swimmerId);
        if (swimmer) {
          csvContent += `${swimmer.firstName},${swimmer.lastName},${swimmer.asaNo},${swimmer.dateOfBirth},${time.meet},${time.date},${time.event},${time.time},${time.course},${swimmer.gender},${swimmer.age},,,${time.countyQualify || 'No'},${time.timeInSeconds}\n`;
        }
      }
      
      fs.writeFileSync(memberPbsPath, csvContent);

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
          return res.status(500).json({ message: 'Optimization failed', error: errorOutput });
        }

        try {
          const results = JSON.parse(output);
          res.json(results);
        } catch (parseError) {
          console.error('Failed to parse optimization results:', parseError);
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