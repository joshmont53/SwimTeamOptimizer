import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertSwimmerSchema, insertEventAssignmentSchema, insertRelayAssignmentSchema } from "@shared/schema";
import multer from "multer";
import { spawn } from "child_process";
import path from "path";
import fs from "fs";

const upload = multer({ dest: 'uploads/' });

function parseCSVLine(line: string): string[] {
  const result = [];
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
  if (!timeStr || timeStr.trim() === '') {
    return 0;
  }

  const parts = timeStr.trim().split(':');

  if (parts.length === 3) {
    const hours = parseInt(parts[0]);
    const minutes = parseInt(parts[1]);
    const secondsPart = parts[2];
    
    if (secondsPart.includes('.')) {
      const [seconds, hundredths] = secondsPart.split('.');
      return hours * 3600 + minutes * 60 + parseInt(seconds) + parseInt(hundredths.padEnd(2, '0')) / 100;
    } else {
      return hours * 3600 + minutes * 60 + parseInt(secondsPart);
    }
  } else if (parts.length === 2) {
    const minutes = parseInt(parts[0]);
    const secondsPart = parts[1];
    
    if (secondsPart.includes('.')) {
      const [seconds, hundredths] = secondsPart.split('.');
      return minutes * 60 + parseInt(seconds) + parseInt(hundredths.padEnd(2, '0')) / 100;
    } else {
      return minutes * 60 + parseInt(secondsPart);
    }
  }
  
  return 0;
}

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Upload CSV file and parse data
  app.post("/api/upload-csv", upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const filePath = req.file.path;
      const content = fs.readFileSync(filePath, 'utf-8');
      const lines = content.split('\n').filter(line => line.trim());
      
      if (lines.length === 0) {
        return res.status(400).json({ message: "Empty file" });
      }

      // Clear existing data
      await storage.clearSwimmers();
      await storage.clearSwimmerTimes();

      // Parse header
      const header = parseCSVLine(lines[0]);
      const swimmerMap = new Map<string, number>();

      // Process each line
      for (let i = 1; i < lines.length; i++) {
        const data = parseCSVLine(lines[i]);
        
        if (data.length < 15) continue;

        const firstName = data[0];
        const lastName = data[1];
        const asaNo = data[2];
        const dateOfBirth = data[3];
        const meet = data[4];
        const meetDate = data[5];
        const event = data[6];
        const scTime = data[7];
        const course = data[8];
        const gender = data[9] || null;
        const age = parseInt(data[10]) || 0;
        const countyQualify = data[13];
        const timeInSeconds = parseFloat(data[14]) || 0;

        const swimmerKey = `${firstName}_${lastName}_${asaNo}`;
        
        // Create swimmer if not exists
        if (!swimmerMap.has(swimmerKey)) {
          const swimmer = await storage.createSwimmer({
            firstName,
            lastName,
            asaNo,
            dateOfBirth,
            gender,
            age,
            isAvailable: true
          });
          swimmerMap.set(swimmerKey, swimmer.id);
        }

        const swimmerId = swimmerMap.get(swimmerKey)!;

        // Create swimmer time
        await storage.createSwimmerTime({
          swimmerId,
          event,
          course,
          time: scTime,
          timeInSeconds,
          meet,
          date: meetDate,
          countyQualify
        });
      }

      // Clean up uploaded file
      fs.unlinkSync(filePath);

      const swimmers = await storage.getSwimmers();
      res.json({ 
        message: "CSV uploaded successfully", 
        swimmerCount: swimmers.length,
        recordCount: lines.length - 1
      });

    } catch (error) {
      console.error("CSV upload error:", error);
      res.status(500).json({ message: "Failed to process CSV file" });
    }
  });

  // Load county times from CSV
  app.post("/api/load-county-times", async (req, res) => {
    try {
      const countyTimesPath = path.join(process.cwd(), 'attached_assets', 'county_times_cleaned.csv');
      
      if (!fs.existsSync(countyTimesPath)) {
        return res.status(404).json({ message: "County times file not found" });
      }

      const content = fs.readFileSync(countyTimesPath, 'utf-8');
      const lines = content.split('\n').filter(line => line.trim());
      
      await storage.clearCountyTimes();

      for (let i = 1; i < lines.length; i++) {
        const data = parseCSVLine(lines[i]);
        
        if (data.length < 6) continue;

        const event = data[0];
        const time = data[1];
        const ageCategory = parseInt(data[2]) || 0;
        const course = data[3];
        const timeType = data[4];
        const gender = data[5];

        await storage.createCountyTime({
          event,
          time,
          timeInSeconds: convertTimeToSeconds(time),
          ageCategory,
          course,
          timeType,
          gender
        });
      }

      const countyTimes = await storage.getCountyTimes();
      res.json({ 
        message: "County times loaded successfully",
        count: countyTimes.length
      });

    } catch (error) {
      console.error("County times load error:", error);
      res.status(500).json({ message: "Failed to load county times" });
    }
  });

  // Get all swimmers
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

  // Get swimmer times with swimmer info
  app.get("/api/swimmer-times", async (req, res) => {
    try {
      const swimmers = await storage.getSwimmers();
      const times = await storage.getSwimmerTimes();
      
      const swimmerTimesWithInfo = times.map(time => {
        const swimmer = swimmers.find(s => s.id === time.swimmerId);
        return {
          ...time,
          swimmer
        };
      });
      
      res.json(swimmerTimesWithInfo);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch swimmer times" });
    }
  });

  // Get available events for assignment
  app.get("/api/events", async (req, res) => {
    try {
      const eventList = [
        { event: '50m Freestyle', ageCategory: 11, gender: 'Male' },
        { event: '50m Backstroke', ageCategory: 11, gender: 'Male' },
        { event: '50m Breaststroke', ageCategory: 11, gender: 'Male' },
        { event: '50m Butterfly', ageCategory: 11, gender: 'Male' },
        { event: '50m Freestyle', ageCategory: 11, gender: 'Female' },
        { event: '50m Backstroke', ageCategory: 11, gender: 'Female' },
        { event: '50m Breaststroke', ageCategory: 11, gender: 'Female' },
        { event: '50m Butterfly', ageCategory: 11, gender: 'Female' },
        { event: '100m Freestyle', ageCategory: 13, gender: 'Male' },
        { event: '100m Backstroke', ageCategory: 13, gender: 'Male' },
        { event: '100m Breaststroke', ageCategory: 13, gender: 'Male' },
        { event: '100m Butterfly', ageCategory: 13, gender: 'Male' },
        { event: '100m Freestyle', ageCategory: 13, gender: 'Female' },
        { event: '100m Backstroke', ageCategory: 13, gender: 'Female' },
        { event: '100m Breaststroke', ageCategory: 13, gender: 'Female' },
        { event: '100m Butterfly', ageCategory: 13, gender: 'Female' },
        { event: '100m Freestyle', ageCategory: 15, gender: 'Male' },
        { event: '100m Backstroke', ageCategory: 15, gender: 'Male' },
        { event: '100m Breaststroke', ageCategory: 15, gender: 'Male' },
        { event: '100m Butterfly', ageCategory: 15, gender: 'Male' },
        { event: '100m Freestyle', ageCategory: 15, gender: 'Female' },
        { event: '100m Backstroke', ageCategory: 15, gender: 'Female' },
        { event: '100m Breaststroke', ageCategory: 15, gender: 'Female' },
        { event: '100m Butterfly', ageCategory: 15, gender: 'Female' },
        { event: '100m Freestyle', ageCategory: 16, gender: 'Male' },
        { event: '100m Backstroke', ageCategory: 16, gender: 'Male' },
        { event: '100m Breaststroke', ageCategory: 16, gender: 'Male' },
        { event: '100m Butterfly', ageCategory: 16, gender: 'Male' },
        { event: '200m Individual Medley', ageCategory: 16, gender: 'Male' },
        { event: '100m Freestyle', ageCategory: 16, gender: 'Female' },
        { event: '100m Backstroke', ageCategory: 16, gender: 'Female' },
        { event: '100m Breaststroke', ageCategory: 16, gender: 'Female' },
        { event: '100m Butterfly', ageCategory: 16, gender: 'Female' },
        { event: '200m Individual Medley', ageCategory: 16, gender: 'Female' }
      ];

      const relayEvents = [
        { relayName: '4x50m Freestyle Relay', ageCategory: 11, gender: 'Male' },
        { relayName: '4x50m Freestyle Relay', ageCategory: 11, gender: 'Female' },
        { relayName: '4x50m Medley Relay', ageCategory: 11, gender: 'Male' },
        { relayName: '4x50m Medley Relay', ageCategory: 11, gender: 'Female' },
        { relayName: '4x50m Freestyle Relay', ageCategory: 13, gender: 'Male' },
        { relayName: '4x50m Freestyle Relay', ageCategory: 13, gender: 'Female' },
        { relayName: '4x50m Medley Relay', ageCategory: 13, gender: 'Male' },
        { relayName: '4x50m Medley Relay', ageCategory: 13, gender: 'Female' },
        { relayName: '4x50m Freestyle Relay', ageCategory: 15, gender: 'Male' },
        { relayName: '4x50m Freestyle Relay', ageCategory: 15, gender: 'Female' },
        { relayName: '4x50m Medley Relay', ageCategory: 15, gender: 'Male' },
        { relayName: '4x50m Medley Relay', ageCategory: 15, gender: 'Female' },
        { relayName: '4x50m Freestyle Relay', ageCategory: 16, gender: 'Male' },
        { relayName: '4x50m Freestyle Relay', ageCategory: 16, gender: 'Female' },
        { relayName: '4x50m Medley Relay', ageCategory: 16, gender: 'Male' },
        { relayName: '4x50m Medley Relay', ageCategory: 16, gender: 'Female' }
      ];

      res.json({ individual: eventList, relay: relayEvents });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch events" });
    }
  });

  // Create or update event assignment
  app.post("/api/event-assignments", async (req, res) => {
    try {
      const validatedData = insertEventAssignmentSchema.parse(req.body);
      const assignment = await storage.createEventAssignment(validatedData);
      res.json(assignment);
    } catch (error) {
      res.status(500).json({ message: "Failed to create event assignment" });
    }
  });

  // Create or update relay assignment
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

  // Get event assignments
  app.get("/api/event-assignments", async (req, res) => {
    try {
      const assignments = await storage.getEventAssignments();
      res.json(assignments);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch event assignments" });
    }
  });

  // Get relay assignments
  app.get("/api/relay-assignments", async (req, res) => {
    try {
      const assignments = await storage.getRelayAssignments();
      res.json(assignments);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch relay assignments" });
    }
  });

  // Run optimization
  app.post("/api/optimize", async (req, res) => {
    try {
      // Generate temporary files for the Python script
      const sessionId = Date.now().toString();
      const tempDir = path.join(process.cwd(), 'temp');
      
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir);
      }

      const memberPbsPath = path.join(tempDir, `member_pbs_${sessionId}.csv`);
      const countyTimesPath = path.join(tempDir, `county_times_${sessionId}.csv`);
      const preAssignmentsPath = path.join(tempDir, `pre_assignments_${sessionId}.json`);

      // Get pre-assignments
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

      fs.writeFileSync(preAssignmentsPath, JSON.stringify(preAssignments));

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

      // Run Python optimization script
      const pythonScript = path.join(process.cwd(), 'server', 'optimizer.py');
      const python = spawn('python3', [pythonScript, memberPbsPath, countyTimesPath, preAssignmentsPath], {
        cwd: process.cwd()
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
          // Parse the Python script output
          const results = JSON.parse(output);
          
          // Clear previous results
          await storage.clearOptimizationResults();

          // Store results
          for (const result of results.individual) {
            await storage.createOptimizationResult({
              sessionId,
              resultType: 'individual',
              event: result.event,
              swimmers: JSON.stringify([result.swimmer]),
              totalTime: result.time,
              createdAt: new Date().toISOString()
            });
          }

          for (const result of results.relay) {
            await storage.createOptimizationResult({
              sessionId,
              resultType: 'relay',
              event: result.relay,
              swimmers: JSON.stringify(result.swimmers),
              totalTime: result.totalTime,
              createdAt: new Date().toISOString()
            });
          }

          res.json(results);
        } catch (parseError) {
          console.error('Failed to parse optimization results:', parseError);
          res.status(500).json({ message: 'Failed to parse optimization results' });
        }
      });

    } catch (error) {
      console.error('Optimization error:', error);
      res.status(500).json({ message: 'Failed to run optimization' });
    }
  });

  // Get optimization results
  app.get("/api/optimization-results/:sessionId", async (req, res) => {
    try {
      const { sessionId } = req.params;
      const results = await storage.getOptimizationResults(sessionId);
      res.json(results);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch optimization results" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
