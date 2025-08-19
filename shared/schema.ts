import { pgTable, text, serial, integer, boolean, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const swimmers = pgTable("swimmers", {
  id: serial("id").primaryKey(),
  teamId: integer("team_id"), // Link swimmers to teams
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  asaNo: text("asa_no").notNull(),
  dateOfBirth: text("date_of_birth").notNull(),
  gender: text("gender"),
  age: integer("age").notNull(),
  isAvailable: boolean("is_available").notNull().default(true),
});

export const swimmerTimes = pgTable("swimmer_times", {
  id: serial("id").primaryKey(),
  teamId: integer("team_id"), // Link swimmer times to teams
  swimmerId: integer("swimmer_id").notNull(),
  event: text("event").notNull(),
  course: text("course").notNull(),
  time: text("time").notNull(),
  timeInSeconds: real("time_in_seconds").notNull(),
  meet: text("meet").notNull(),
  date: text("date").notNull(),
  countyQualify: text("county_qualify"),
});

export const countyTimes = pgTable("county_times", {
  id: serial("id").primaryKey(),
  event: text("event").notNull(),
  time: text("time").notNull(),
  timeInSeconds: real("time_in_seconds").notNull(),
  ageCategory: integer("age_category").notNull(),
  course: text("course").notNull(),
  timeType: text("time_type").notNull(),
  gender: text("gender").notNull(),
});

export const eventAssignments = pgTable("event_assignments", {
  id: serial("id").primaryKey(),
  teamId: integer("team_id"), // Link event assignments to teams
  event: text("event").notNull(),
  ageCategory: integer("age_category").notNull(),
  gender: text("gender").notNull(),
  swimmerId: text("swimmer_id"),
  isPreAssigned: boolean("is_pre_assigned").notNull().default(false),
});

export const relayAssignments = pgTable("relay_assignments", {
  id: serial("id").primaryKey(),
  teamId: integer("team_id"), // Link relay assignments to teams
  relayName: text("relay_name").notNull(),
  ageCategory: integer("age_category").notNull(),
  gender: text("gender").notNull(),
  position: integer("position").notNull(), // 1-4 for relay positions
  stroke: text("stroke"), // for medley relays
  swimmerId: text("swimmer_id"), // Use ASA number (text) for consistency with eventAssignments
  isPreAssigned: boolean("is_pre_assigned").notNull().default(false),
});

export const teams = pgTable("teams", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  competitionType: text("competition_type").notNull(), // 'arena_league', 'county_relays', 'custom'
  maxIndividualEvents: integer("max_individual_events"), // null means no limit
  status: text("status").notNull().default("in_progress"), // 'in_progress', 'selected'
  currentStep: integer("current_step").notNull().default(0), // 0=team_selection, 1=file_upload, 1.5=event_builder(custom only), 2=squad_selection, 3=event_assignment, 4=results
  customEvents: text("custom_events"), // JSON string of custom events for custom competitions
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const teamEvents = pgTable("team_events", {
  id: serial("id").primaryKey(),
  teamId: integer("team_id").notNull(),
  event: text("event").notNull(),
  ageCategory: integer("age_category").notNull(),
  gender: text("gender").notNull(),
  isRelay: boolean("is_relay").notNull().default(false),
});

export const optimizationResults = pgTable("optimization_results", {
  id: serial("id").primaryKey(),
  teamId: integer("team_id"), // Link results to a team
  sessionId: text("session_id").notNull(),
  resultType: text("result_type").notNull(), // 'individual' or 'relay'
  event: text("event").notNull(),
  swimmers: text("swimmers").notNull(), // JSON string
  totalTime: text("total_time"),
  createdAt: text("created_at").notNull(),
});

export const insertSwimmerSchema = createInsertSchema(swimmers).omit({
  id: true,
});

export const insertSwimmerTimeSchema = createInsertSchema(swimmerTimes).omit({
  id: true,
});

export const insertCountyTimeSchema = createInsertSchema(countyTimes).omit({
  id: true,
});

export const insertEventAssignmentSchema = createInsertSchema(eventAssignments).omit({
  id: true,
});

export const insertRelayAssignmentSchema = createInsertSchema(relayAssignments).omit({
  id: true,
});

export const insertOptimizationResultSchema = createInsertSchema(optimizationResults).omit({
  id: true,
});

export const insertTeamSchema = createInsertSchema(teams).omit({
  id: true,
});

export const insertTeamEventSchema = createInsertSchema(teamEvents).omit({
  id: true,
});

export type Swimmer = typeof swimmers.$inferSelect;
export type InsertSwimmer = z.infer<typeof insertSwimmerSchema>;
export type SwimmerTime = typeof swimmerTimes.$inferSelect;
export type InsertSwimmerTime = z.infer<typeof insertSwimmerTimeSchema>;
export type CountyTime = typeof countyTimes.$inferSelect;
export type InsertCountyTime = z.infer<typeof insertCountyTimeSchema>;
export type EventAssignment = typeof eventAssignments.$inferSelect;
export type InsertEventAssignment = z.infer<typeof insertEventAssignmentSchema>;
export type RelayAssignment = typeof relayAssignments.$inferSelect;
export type InsertRelayAssignment = z.infer<typeof insertRelayAssignmentSchema>;
export type OptimizationResult = typeof optimizationResults.$inferSelect;
export type InsertOptimizationResult = z.infer<typeof insertOptimizationResultSchema>;
export type Team = typeof teams.$inferSelect;
export type InsertTeam = z.infer<typeof insertTeamSchema>;
export type TeamEvent = typeof teamEvents.$inferSelect;
export type InsertTeamEvent = z.infer<typeof insertTeamEventSchema>;
