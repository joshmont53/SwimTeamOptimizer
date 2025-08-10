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
  type InsertTeamEvent,
  swimmers,
  swimmerTimes,
  countyTimes,
  eventAssignments,
  relayAssignments,
  optimizationResults,
  teams,
  teamEvents
} from "@shared/schema";
import { db } from "./db";
import { eq, and } from "drizzle-orm";

export interface IStorage {
  // Swimmer operations (team-specific)
  getSwimmers(teamId?: number): Promise<Swimmer[]>;
  getSwimmer(id: number): Promise<Swimmer | undefined>;
  createSwimmer(swimmer: InsertSwimmer): Promise<Swimmer>;
  updateSwimmer(id: number, updates: Partial<InsertSwimmer>): Promise<Swimmer | undefined>;
  clearSwimmers(teamId?: number): Promise<void>;

  // Swimmer times operations (team-specific)
  getSwimmerTimes(teamId?: number): Promise<SwimmerTime[]>;
  getSwimmerTimesBySwimmerId(swimmerId: number): Promise<SwimmerTime[]>;
  createSwimmerTime(time: InsertSwimmerTime): Promise<SwimmerTime>;
  clearSwimmerTimes(teamId?: number): Promise<void>;

  // County times operations
  getCountyTimes(): Promise<CountyTime[]>;
  createCountyTime(time: InsertCountyTime): Promise<CountyTime>;
  clearCountyTimes(): Promise<void>;

  // Event assignments operations (team-specific)
  getEventAssignments(teamId?: number): Promise<EventAssignment[]>;
  createEventAssignment(assignment: InsertEventAssignment): Promise<EventAssignment>;
  updateEventAssignment(id: number, updates: Partial<InsertEventAssignment>): Promise<EventAssignment | undefined>;
  clearEventAssignments(teamId?: number): Promise<void>;

  // Relay assignments operations (team-specific)
  getRelayAssignments(teamId?: number): Promise<RelayAssignment[]>;
  createRelayAssignment(assignment: InsertRelayAssignment): Promise<RelayAssignment>;
  updateRelayAssignment(id: number, updates: Partial<InsertRelayAssignment>): Promise<RelayAssignment | undefined>;
  clearRelayAssignments(teamId?: number): Promise<void>;

  // Optimization results operations (team-specific)
  getOptimizationResults(sessionId: string, teamId?: number): Promise<OptimizationResult[]>;
  createOptimizationResult(result: InsertOptimizationResult): Promise<OptimizationResult>;
  clearOptimizationResults(teamId?: number): Promise<void>;

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



export class DatabaseStorage implements IStorage {
  // Swimmer operations (team-specific)
  async getSwimmers(teamId?: number): Promise<Swimmer[]> {
    if (teamId) {
      return await db.select().from(swimmers).where(eq(swimmers.teamId, teamId));
    }
    return await db.select().from(swimmers);
  }

  async getSwimmer(id: number): Promise<Swimmer | undefined> {
    const [swimmer] = await db.select().from(swimmers).where(eq(swimmers.id, id));
    return swimmer || undefined;
  }

  async createSwimmer(insertSwimmer: InsertSwimmer): Promise<Swimmer> {
    const [swimmer] = await db.insert(swimmers).values(insertSwimmer).returning();
    return swimmer;
  }

  async updateSwimmer(id: number, updates: Partial<InsertSwimmer>): Promise<Swimmer | undefined> {
    const [swimmer] = await db.update(swimmers).set(updates).where(eq(swimmers.id, id)).returning();
    return swimmer || undefined;
  }

  async clearSwimmers(teamId?: number): Promise<void> {
    if (teamId) {
      await db.delete(swimmers).where(eq(swimmers.teamId, teamId));
    } else {
      await db.delete(swimmers);
    }
  }

  // Swimmer times operations (team-specific)
  async getSwimmerTimes(teamId?: number): Promise<SwimmerTime[]> {
    if (teamId) {
      return await db.select().from(swimmerTimes).where(eq(swimmerTimes.teamId, teamId));
    }
    return await db.select().from(swimmerTimes);
  }

  async getSwimmerTimesBySwimmerId(swimmerId: number): Promise<SwimmerTime[]> {
    return await db.select().from(swimmerTimes).where(eq(swimmerTimes.swimmerId, swimmerId));
  }

  async createSwimmerTime(insertTime: InsertSwimmerTime): Promise<SwimmerTime> {
    const [time] = await db.insert(swimmerTimes).values(insertTime).returning();
    return time;
  }

  async clearSwimmerTimes(teamId?: number): Promise<void> {
    if (teamId) {
      await db.delete(swimmerTimes).where(eq(swimmerTimes.teamId, teamId));
    } else {
      await db.delete(swimmerTimes);
    }
  }

  // County times operations
  async getCountyTimes(): Promise<CountyTime[]> {
    return await db.select().from(countyTimes);
  }

  async createCountyTime(insertTime: InsertCountyTime): Promise<CountyTime> {
    const [time] = await db.insert(countyTimes).values(insertTime).returning();
    return time;
  }

  async clearCountyTimes(): Promise<void> {
    await db.delete(countyTimes);
  }

  // Event assignments operations (team-specific)
  async getEventAssignments(teamId?: number): Promise<EventAssignment[]> {
    if (teamId) {
      return await db.select().from(eventAssignments).where(eq(eventAssignments.teamId, teamId));
    }
    return await db.select().from(eventAssignments);
  }

  async createEventAssignment(insertAssignment: InsertEventAssignment): Promise<EventAssignment> {
    const [assignment] = await db.insert(eventAssignments).values(insertAssignment).returning();
    return assignment;
  }

  async updateEventAssignment(id: number, updates: Partial<InsertEventAssignment>): Promise<EventAssignment | undefined> {
    const [assignment] = await db.update(eventAssignments).set(updates).where(eq(eventAssignments.id, id)).returning();
    return assignment || undefined;
  }

  async clearEventAssignments(teamId?: number): Promise<void> {
    if (teamId) {
      await db.delete(eventAssignments).where(eq(eventAssignments.teamId, teamId));
    } else {
      await db.delete(eventAssignments);
    }
  }

  // Relay assignments operations (team-specific)
  async getRelayAssignments(teamId?: number): Promise<RelayAssignment[]> {
    if (teamId) {
      return await db.select().from(relayAssignments).where(eq(relayAssignments.teamId, teamId));
    }
    return await db.select().from(relayAssignments);
  }

  async createRelayAssignment(insertAssignment: InsertRelayAssignment): Promise<RelayAssignment> {
    const [assignment] = await db.insert(relayAssignments).values(insertAssignment).returning();
    return assignment;
  }

  async updateRelayAssignment(id: number, updates: Partial<InsertRelayAssignment>): Promise<RelayAssignment | undefined> {
    const [assignment] = await db.update(relayAssignments).set(updates).where(eq(relayAssignments.id, id)).returning();
    return assignment || undefined;
  }

  async clearRelayAssignments(teamId?: number): Promise<void> {
    if (teamId) {
      await db.delete(relayAssignments).where(eq(relayAssignments.teamId, teamId));
    } else {
      await db.delete(relayAssignments);
    }
  }

  // Optimization results operations (team-specific)
  async getOptimizationResults(sessionId: string, teamId?: number): Promise<OptimizationResult[]> {
    if (teamId) {
      return await db.select().from(optimizationResults)
        .where(and(eq(optimizationResults.sessionId, sessionId), eq(optimizationResults.teamId, teamId)));
    }
    return await db.select().from(optimizationResults).where(eq(optimizationResults.sessionId, sessionId));
  }

  async createOptimizationResult(insertResult: InsertOptimizationResult): Promise<OptimizationResult> {
    const [result] = await db.insert(optimizationResults).values(insertResult).returning();
    return result;
  }

  async clearOptimizationResults(teamId?: number): Promise<void> {
    if (teamId) {
      await db.delete(optimizationResults).where(eq(optimizationResults.teamId, teamId));
    } else {
      await db.delete(optimizationResults);
    }
  }

  // Team operations
  async getTeams(): Promise<Team[]> {
    return await db.select().from(teams).orderBy(teams.updatedAt);
  }

  async getTeam(id: number): Promise<Team | undefined> {
    const [team] = await db.select().from(teams).where(eq(teams.id, id));
    return team || undefined;
  }

  async createTeam(insertTeam: InsertTeam): Promise<Team> {
    const now = new Date().toISOString();
    const [team] = await db.insert(teams).values({
      ...insertTeam,
      createdAt: now,
      updatedAt: now
    }).returning();
    return team;
  }

  async updateTeam(id: number, updates: Partial<InsertTeam>): Promise<Team | undefined> {
    const [team] = await db.update(teams).set({
      ...updates,
      updatedAt: new Date().toISOString()
    }).where(eq(teams.id, id)).returning();
    return team || undefined;
  }

  async deleteTeam(id: number): Promise<void> {
    // Delete all related data first
    await Promise.all([
      this.clearSwimmers(id),
      this.clearSwimmerTimes(id),
      this.clearEventAssignments(id),
      this.clearRelayAssignments(id),
      this.clearOptimizationResults(id),
      this.clearTeamEvents(id)
    ]);
    // Then delete the team
    await db.delete(teams).where(eq(teams.id, id));
  }

  // Team events operations
  async getTeamEvents(teamId: number): Promise<TeamEvent[]> {
    return await db.select().from(teamEvents).where(eq(teamEvents.teamId, teamId));
  }

  async createTeamEvent(insertEvent: InsertTeamEvent): Promise<TeamEvent> {
    const [event] = await db.insert(teamEvents).values(insertEvent).returning();
    return event;
  }

  async clearTeamEvents(teamId: number): Promise<void> {
    await db.delete(teamEvents).where(eq(teamEvents.teamId, teamId));
  }
}

export const storage = new DatabaseStorage();
