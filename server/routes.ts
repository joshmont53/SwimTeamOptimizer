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
    
    // Return a simple test response first
    return res.json({
      individual: [
        { event: "Test Event", swimmer: "Test Swimmer", time: "1:00.00" }
      ],
      relay: [],
      stats: { qualifyingTimes: 0, averageIndex: 0, relayTeams: 0, totalEvents: 1 }
    });
  });

  return createServer(app);
}