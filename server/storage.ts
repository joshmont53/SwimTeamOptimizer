import { 
  type Swimmer, 
  type InsertSwimmer, 
  type SwimmerTime, 
  type InsertSwimmerTime,
  type CountyTime,
  type InsertCountyTime,
  type EventAssignment,
  type InsertEventAssignment,
  type RelayAssignment,
  type InsertRelayAssignment,
  type OptimizationResult,
  type InsertOptimizationResult,
  type Team,
  type InsertTeam,
  type TeamEvent,
  type InsertTeamEvent
} from "@shared/schema";

export interface IStorage {
  // Swimmer operations
  getSwimmers(): Promise<Swimmer[]>;
  getSwimmer(id: number): Promise<Swimmer | undefined>;
  createSwimmer(swimmer: InsertSwimmer): Promise<Swimmer>;
  updateSwimmer(id: number, updates: Partial<InsertSwimmer>): Promise<Swimmer | undefined>;
  clearSwimmers(): Promise<void>;

  // Swimmer times operations
  getSwimmerTimes(): Promise<SwimmerTime[]>;
  getSwimmerTimesBySwimmerId(swimmerId: number): Promise<SwimmerTime[]>;
  createSwimmerTime(time: InsertSwimmerTime): Promise<SwimmerTime>;
  clearSwimmerTimes(): Promise<void>;

  // County times operations
  getCountyTimes(): Promise<CountyTime[]>;
  createCountyTime(time: InsertCountyTime): Promise<CountyTime>;
  clearCountyTimes(): Promise<void>;

  // Event assignments operations
  getEventAssignments(): Promise<EventAssignment[]>;
  createEventAssignment(assignment: InsertEventAssignment): Promise<EventAssignment>;
  updateEventAssignment(id: number, updates: Partial<InsertEventAssignment>): Promise<EventAssignment | undefined>;
  clearEventAssignments(): Promise<void>;

  // Relay assignments operations
  getRelayAssignments(): Promise<RelayAssignment[]>;
  createRelayAssignment(assignment: InsertRelayAssignment): Promise<RelayAssignment>;
  updateRelayAssignment(id: number, updates: Partial<InsertRelayAssignment>): Promise<RelayAssignment | undefined>;
  clearRelayAssignments(): Promise<void>;

  // Optimization results operations
  getOptimizationResults(sessionId: string): Promise<OptimizationResult[]>;
  createOptimizationResult(result: InsertOptimizationResult): Promise<OptimizationResult>;
  clearOptimizationResults(): Promise<void>;

  // Team operations
  getTeams(): Promise<Team[]>;
  getTeam(id: number): Promise<Team | undefined>;
  createTeam(team: InsertTeam): Promise<Team>;
  updateTeam(id: number, updates: Partial<InsertTeam>): Promise<Team | undefined>;
  deleteTeam(id: number): Promise<void>;

  // Team events operations
  getTeamEvents(teamId: number): Promise<TeamEvent[]>;
  createTeamEvent(event: InsertTeamEvent): Promise<TeamEvent>;
  clearTeamEvents(teamId: number): Promise<void>;
}

export class MemStorage implements IStorage {
  private swimmers: Map<number, Swimmer>;
  private swimmerTimes: Map<number, SwimmerTime>;
  private countyTimes: Map<number, CountyTime>;
  private eventAssignments: Map<number, EventAssignment>;
  private relayAssignments: Map<number, RelayAssignment>;
  private optimizationResults: Map<number, OptimizationResult>;
  private teams: Map<number, Team>;
  private teamEvents: Map<number, TeamEvent>;
  private currentId: number;

  constructor() {
    this.swimmers = new Map();
    this.swimmerTimes = new Map();
    this.countyTimes = new Map();
    this.eventAssignments = new Map();
    this.relayAssignments = new Map();
    this.optimizationResults = new Map();
    this.teams = new Map();
    this.teamEvents = new Map();
    this.currentId = 1;
  }

  // Swimmer operations
  async getSwimmers(): Promise<Swimmer[]> {
    return Array.from(this.swimmers.values());
  }

  async getSwimmer(id: number): Promise<Swimmer | undefined> {
    return this.swimmers.get(id);
  }

  async createSwimmer(insertSwimmer: InsertSwimmer): Promise<Swimmer> {
    const id = this.currentId++;
    const swimmer: Swimmer = { 
      ...insertSwimmer, 
      id,
      gender: insertSwimmer.gender ?? null,
      isAvailable: insertSwimmer.isAvailable ?? true
    };
    this.swimmers.set(id, swimmer);
    return swimmer;
  }

  async updateSwimmer(id: number, updates: Partial<InsertSwimmer>): Promise<Swimmer | undefined> {
    const swimmer = this.swimmers.get(id);
    if (!swimmer) return undefined;
    
    const updated = { ...swimmer, ...updates };
    this.swimmers.set(id, updated);
    return updated;
  }

  async clearSwimmers(): Promise<void> {
    this.swimmers.clear();
  }

  // Swimmer times operations
  async getSwimmerTimes(): Promise<SwimmerTime[]> {
    return Array.from(this.swimmerTimes.values());
  }

  async getSwimmerTimesBySwimmerId(swimmerId: number): Promise<SwimmerTime[]> {
    return Array.from(this.swimmerTimes.values()).filter(time => time.swimmerId === swimmerId);
  }

  async createSwimmerTime(insertTime: InsertSwimmerTime): Promise<SwimmerTime> {
    const id = this.currentId++;
    const time: SwimmerTime = { 
      ...insertTime, 
      id,
      countyQualify: insertTime.countyQualify ?? null
    };
    this.swimmerTimes.set(id, time);
    return time;
  }

  async clearSwimmerTimes(): Promise<void> {
    this.swimmerTimes.clear();
  }

  // County times operations
  async getCountyTimes(): Promise<CountyTime[]> {
    return Array.from(this.countyTimes.values());
  }

  async createCountyTime(insertTime: InsertCountyTime): Promise<CountyTime> {
    const id = this.currentId++;
    const time: CountyTime = { ...insertTime, id };
    this.countyTimes.set(id, time);
    return time;
  }

  async clearCountyTimes(): Promise<void> {
    this.countyTimes.clear();
  }

  // Event assignments operations
  async getEventAssignments(): Promise<EventAssignment[]> {
    return Array.from(this.eventAssignments.values());
  }

  async createEventAssignment(insertAssignment: InsertEventAssignment): Promise<EventAssignment> {
    const id = this.currentId++;
    const assignment: EventAssignment = { 
      ...insertAssignment, 
      id,
      swimmerId: insertAssignment.swimmerId ?? null,
      isPreAssigned: insertAssignment.isPreAssigned ?? false
    };
    this.eventAssignments.set(id, assignment);
    return assignment;
  }

  async updateEventAssignment(id: number, updates: Partial<InsertEventAssignment>): Promise<EventAssignment | undefined> {
    const assignment = this.eventAssignments.get(id);
    if (!assignment) return undefined;
    
    const updated = { ...assignment, ...updates };
    this.eventAssignments.set(id, updated);
    return updated;
  }

  async clearEventAssignments(): Promise<void> {
    this.eventAssignments.clear();
  }

  // Relay assignments operations
  async getRelayAssignments(): Promise<RelayAssignment[]> {
    return Array.from(this.relayAssignments.values());
  }

  async createRelayAssignment(insertAssignment: InsertRelayAssignment): Promise<RelayAssignment> {
    const id = this.currentId++;
    const assignment: RelayAssignment = { 
      ...insertAssignment, 
      id,
      swimmerId: insertAssignment.swimmerId ?? null,
      stroke: insertAssignment.stroke ?? null,
      isPreAssigned: insertAssignment.isPreAssigned ?? false
    };
    this.relayAssignments.set(id, assignment);
    return assignment;
  }

  async updateRelayAssignment(id: number, updates: Partial<InsertRelayAssignment>): Promise<RelayAssignment | undefined> {
    const assignment = this.relayAssignments.get(id);
    if (!assignment) return undefined;
    
    const updated = { ...assignment, ...updates };
    this.relayAssignments.set(id, updated);
    return updated;
  }

  async clearRelayAssignments(): Promise<void> {
    this.relayAssignments.clear();
  }

  // Optimization results operations
  async getOptimizationResults(sessionId: string): Promise<OptimizationResult[]> {
    return Array.from(this.optimizationResults.values()).filter(result => result.sessionId === sessionId);
  }

  async createOptimizationResult(insertResult: InsertOptimizationResult): Promise<OptimizationResult> {
    const id = this.currentId++;
    const result: OptimizationResult = { 
      ...insertResult, 
      id,
      teamId: insertResult.teamId ?? null,
      totalTime: insertResult.totalTime ?? null
    };
    this.optimizationResults.set(id, result);
    return result;
  }

  async clearOptimizationResults(): Promise<void> {
    this.optimizationResults.clear();
  }

  // Team operations
  async getTeams(): Promise<Team[]> {
    return Array.from(this.teams.values()).sort((a, b) => 
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }

  async getTeam(id: number): Promise<Team | undefined> {
    return this.teams.get(id);
  }

  async createTeam(insertTeam: InsertTeam): Promise<Team> {
    const id = this.currentId++;
    const now = new Date().toISOString();
    const team: Team = { 
      ...insertTeam, 
      id,
      createdAt: now,
      updatedAt: now,
      isComplete: insertTeam.isComplete ?? false,
      maxIndividualEvents: insertTeam.maxIndividualEvents ?? null
    };
    this.teams.set(id, team);
    return team;
  }

  async updateTeam(id: number, updates: Partial<InsertTeam>): Promise<Team | undefined> {
    const team = this.teams.get(id);
    if (!team) return undefined;
    
    const updated = { 
      ...team, 
      ...updates, 
      updatedAt: new Date().toISOString() 
    };
    this.teams.set(id, updated);
    return updated;
  }

  async deleteTeam(id: number): Promise<void> {
    this.teams.delete(id);
    // Also clean up related team events
    Array.from(this.teamEvents.values())
      .filter(event => event.teamId === id)
      .forEach(event => this.teamEvents.delete(event.id));
  }

  // Team events operations
  async getTeamEvents(teamId: number): Promise<TeamEvent[]> {
    return Array.from(this.teamEvents.values()).filter(event => event.teamId === teamId);
  }

  async createTeamEvent(insertEvent: InsertTeamEvent): Promise<TeamEvent> {
    const id = this.currentId++;
    const event: TeamEvent = { 
      ...insertEvent, 
      id,
      isRelay: insertEvent.isRelay ?? false
    };
    this.teamEvents.set(id, event);
    return event;
  }

  async clearTeamEvents(teamId: number): Promise<void> {
    Array.from(this.teamEvents.entries())
      .filter(([, event]) => event.teamId === teamId)
      .forEach(([id]) => this.teamEvents.delete(id));
  }
}

export const storage = new MemStorage();
