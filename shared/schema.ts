// IMPORTANT: This file was recovered via checkpoint rollback on January 8, 2026
// Prefer local (HEAD) version over remote changes unless upstream contains critical fixes
// Reviewed and resolved manually - do not blindly overwrite in future merges


import { sql } from "drizzle-orm";
import {
  doublePrecision,
  index,
  integer,
  jsonb,
  pgTable,
  serial,
  timestamp,
  text,
  varchar,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User type enum values
export const userTypes = ["Admin", "Engineer", "Operator"] as const;
export type UserType = typeof userTypes[number];

// User storage table - email is used as the username/login identifier
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: varchar("username").unique().notNull(), // Stores email address as username
  hashedPassword: varchar("hashed_password").notNull(),
  email: varchar("email").unique().notNull(), // Email is mandatory and used for login
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  userType: varchar("user_type").default("Operator"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

// Process Tags table for input variables and alarm setpoints
export const processTags = pgTable("process_tags", {
  id: serial("id").primaryKey(),
  tagName: varchar("tag_name", { length: 100 }).notNull(),
  description: text("description"),
  area: varchar("area", { length: 100 }),
  loopType: varchar("loop_type", { length: 100 }),
  pvUnit: varchar("pv_unit", { length: 50 }),
  rangeLow: varchar("range_low", { length: 50 }),
  rangeHigh: varchar("range_high", { length: 50 }),
  typicalSp: varchar("typical_sp", { length: 50 }),
  alarmHH: varchar("alarm_hh", { length: 50 }),
  alarmH: varchar("alarm_h", { length: 50 }),
  alarmL: varchar("alarm_l", { length: 50 }),
  alarmLL: varchar("alarm_ll", { length: 50 }),
  controlMode: varchar("control_mode", { length: 50 }),
  controllerOutputTo: varchar("controller_output_to", { length: 100 }),
  setpointSource: varchar("setpoint_source", { length: 100 }),
  cascadeMaster: varchar("cascade_master", { length: 100 }),
  failPosition: varchar("fail_position", { length: 50 }),
  interlocksPermissives: text("interlocks_permissives"),
  keyNarrativeSummary: text("key_narrative_summary"),
  onHold: varchar("on_hold", { length: 50 }),
  page: integer("page"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertProcessTagSchema = createInsertSchema(processTags).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertProcessTag = z.infer<typeof insertProcessTagSchema>;
export type ProcessTag = typeof processTags.$inferSelect;

// Catalyst Parameters table
export const catalystParameters = pgTable("catalyst_parameters", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).unique().notNull(),
  cesiumPromoted: varchar("cesium_promoted", { length: 10 }).notNull(),
  shape: varchar("shape", { length: 50 }).notNull(),
  voidFraction: varchar("void_fraction", { length: 20 }).notNull(),
  activityFresh: varchar("activity_fresh", { length: 20 }).notNull(),
  ignitionTempC: varchar("ignition_temp_c", { length: 20 }).notNull(),
  operatingTempC: varchar("operating_temp_c", { length: 20 }).notNull(),
  diameterMm: varchar("diameter_mm", { length: 20 }).notNull(),
  sphericity: varchar("sphericity", { length: 20 }).notNull(),
  bulkDensityKgM3: varchar("bulk_density_kg_m3", { length: 20 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertCatalystParameterSchema = createInsertSchema(catalystParameters).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// API request validation schema for catalyst parameters (with numeric values)
export const catalystParameterApiSchema = z.object({
  cesiumPromoted: z.boolean(),
  shape: z.string().min(1, "Shape is required"),
  voidFraction: z.number().finite("Must be a valid number"),
  activityFresh: z.number().finite("Must be a valid number"),
  ignitionTempC: z.number().finite("Must be a valid number"),
  operatingTempC: z.number().finite("Must be a valid number"),
  diameterMm: z.number().finite("Must be a valid number"),
  sphericity: z.number().finite("Must be a valid number"),
  bulkDensityKgM3: z.number().finite("Must be a valid number"),
});

export type CatalystParameterApiInput = z.infer<typeof catalystParameterApiSchema>;
export type InsertCatalystParameter = z.infer<typeof insertCatalystParameterSchema>;
export type CatalystParameter = typeof catalystParameters.$inferSelect;

// Converter Cases table - stores saved simulation configurations with JSONB parameters
export const converterCases = pgTable("converter_cases", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  // All simulation parameters stored as flexible JSONB
  parameters: jsonb("parameters").notNull(),
  // Timestamps
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// TypeScript interface for the JSONB parameters structure
export interface ConverterCaseParameters {
  // Gas Composition
  so2Percent: string;
  so3Percent: string;
  o2Percent: string;
  co2Percent: string;
  n2Percent: string;
  pBarr: string;
  ipatSo3Removal: string;
  // Process Inputs
  plantRate: string;
  pass1InletVelocity: string;
  converterDiameter: string;
  pass1InletTemp: string;
  pass2InletTemp: string;
  pass3InletTemp: string;
  pass4InletTemp: string;
  pass1InletPres: string;
  pass2InletPres: string;
  pass3InletPres: string;
  pass4InletPres: string;
  // Catalyst Configuration - Pass 1
  pass1Type1: string;
  pass1Liters1: string;
  pass1Activity1: string;
  pass1Type2?: string;
  pass1Liters2?: string;
  pass1Activity2?: string;
  // Catalyst Configuration - Pass 2
  pass2Type1: string;
  pass2Liters1: string;
  pass2Activity1: string;
  // Catalyst Configuration - Pass 3
  pass3Type1: string;
  pass3Liters1: string;
  pass3Activity1: string;
  // Catalyst Configuration - Pass 4
  pass4Type1: string;
  pass4Liters1: string;
  pass4Activity1: string;
  pass4Type2?: string;
  pass4Liters2?: string;
  pass4Activity2?: string;
}

// Zod schema for validating case parameters
export const converterCaseParametersSchema = z.object({
  so2Percent: z.string(),
  so3Percent: z.string(),
  o2Percent: z.string(),
  co2Percent: z.string(),
  n2Percent: z.string(),
  pBarr: z.string(),
  ipatSo3Removal: z.string(),
  plantRate: z.string(),
  pass1InletVelocity: z.string(),
  converterDiameter: z.string(),
  pass1InletTemp: z.string(),
  pass2InletTemp: z.string(),
  pass3InletTemp: z.string(),
  pass4InletTemp: z.string(),
  pass1InletPres: z.string(),
  pass2InletPres: z.string(),
  pass3InletPres: z.string(),
  pass4InletPres: z.string(),
  pass1Type1: z.string(),
  pass1Liters1: z.string(),
  pass1Activity1: z.string(),
  pass1Type2: z.string().optional(),
  pass1Liters2: z.string().optional(),
  pass1Activity2: z.string().optional(),
  pass2Type1: z.string(),
  pass2Liters1: z.string(),
  pass2Activity1: z.string(),
  pass3Type1: z.string(),
  pass3Liters1: z.string(),
  pass3Activity1: z.string(),
  pass4Type1: z.string(),
  pass4Liters1: z.string(),
  pass4Activity1: z.string(),
  pass4Type2: z.string().optional(),
  pass4Liters2: z.string().optional(),
  pass4Activity2: z.string().optional(),
});

export const insertConverterCaseSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional().nullable(),
  parameters: converterCaseParametersSchema,
});

export type InsertConverterCase = z.infer<typeof insertConverterCaseSchema>;
export type ConverterCase = typeof converterCases.$inferSelect;

// Process Variables table for initial simulation conditions (with dynamic cases as JSONB)
export const processVariables = pgTable("process_variables", {
  id: serial("id").primaryKey(),
  count: varchar("count", { length: 10 }).notNull(),
  tag: varchar("tag", { length: 100 }).notNull(),
  description: varchar("description", { length: 200 }).notNull(),
  cases: jsonb("cases").notNull().default({}),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertProcessVariableSchema = createInsertSchema(processVariables).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertProcessVariable = z.infer<typeof insertProcessVariableSchema>;
export type ProcessVariable = typeof processVariables.$inferSelect;

// Case Columns table for process variable case metadata
export const processVariableCaseColumns = pgTable("process_variable_case_columns", {
  id: serial("id").primaryKey(),
  caseId: varchar("case_id", { length: 50 }).notNull().unique(),
  name: varchar("name", { length: 100 }).notNull(),
  description: varchar("description", { length: 200 }).notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertProcessVariableCaseColumnSchema = createInsertSchema(processVariableCaseColumns).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertProcessVariableCaseColumn = z.infer<typeof insertProcessVariableCaseColumnSchema>;
export type ProcessVariableCaseColumn = typeof processVariableCaseColumns.$inferSelect;

// Setpoint Variables table for initial simulation setpoints (with dynamic cases as JSONB)
export const setpointVariables = pgTable("setpoint_variables", {
  id: serial("id").primaryKey(),
  count: varchar("count", { length: 10 }).notNull(),
  tag: varchar("tag", { length: 100 }).notNull(),
  description: varchar("description", { length: 200 }).notNull(),
  cases: jsonb("cases").notNull().default({}),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertSetpointVariableSchema = createInsertSchema(setpointVariables).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertSetpointVariable = z.infer<typeof insertSetpointVariableSchema>;
export type SetpointVariable = typeof setpointVariables.$inferSelect;

// Case Columns table for setpoint variable case metadata
export const setpointCaseColumns = pgTable("setpoint_case_columns", {
  id: serial("id").primaryKey(),
  caseId: varchar("case_id", { length: 50 }).notNull().unique(),
  name: varchar("name", { length: 100 }).notNull(),
  description: varchar("description", { length: 200 }).notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertSetpointCaseColumnSchema = createInsertSchema(setpointCaseColumns).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertSetpointCaseColumn = z.infer<typeof insertSetpointCaseColumnSchema>;
export type SetpointCaseColumn = typeof setpointCaseColumns.$inferSelect;

// Sulfur Process Nodes table - stores simulation output data at key process locations
export const sulfurProcessNodes = pgTable("sulfur_process_nodes", {
  id: serial("id").primaryKey(),
  simulationType: varchar("simulation_type", { length: 20 }).notNull(), // "static" or "dynamic"
  tagId: varchar("tag_id", { length: 50 }).notNull(), // e.g., "1540-PI-2600"
  description: varchar("description", { length: 100 }).notNull(), // e.g., "Sulfur Pump Outlet"
  pressurePsia: varchar("pressure_psia", { length: 50 }).notNull(),
  tempF: varchar("temp_f", { length: 50 }).notNull(),
  flowGpm: varchar("flow_gpm", { length: 50 }).notNull(),
  mTotalKlbHr: varchar("m_total_klb_hr", { length: 50 }).notNull(),
  xSulfur: varchar("x_sulfur", { length: 50 }).notNull(),
  xH2o: varchar("x_h2o", { length: 50 }).notNull(),
  xH2so4: varchar("x_h2so4", { length: 50 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertSulfurProcessNodeSchema = createInsertSchema(sulfurProcessNodes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertSulfurProcessNode = z.infer<typeof insertSulfurProcessNodeSchema>;
export type SulfurProcessNode = typeof sulfurProcessNodes.$inferSelect;

// Weather/Psychrometric schemas
export const weatherRequestSchema = z.object({
  zipCode: z.string().min(5, "ZIP code required"),
  countryCode: z.string().default("US"),
});

export const weatherHistoryRequestSchema = weatherRequestSchema.extend({
  daysBack: z.coerce.number().min(1).max(30).default(7),
});

export type WeatherRequest = z.infer<typeof weatherRequestSchema>;
export type WeatherHistoryRequest = z.infer<typeof weatherHistoryRequestSchema>;

export interface WeatherConditions {
  temperature: number;       // Celsius
  humidity: number;          // Percent
  pressure: number;          // hPa
  dewPoint: number;          // Celsius
  windSpeed: number;         // m/s
  windDeg: number;           // degrees
  clouds: number;            // percent
  visibility: number;        // meters
  description: string;
  icon: string;
  timestamp: number;         // Unix timestamp
}

export interface PsychrometricData {
  conditions: WeatherConditions;
  psychrometrics: {
    humidityRatio: number;
    specificEnthalpy: number;
    vaporPressureKpa: number;
    saturationPressureKpa: number;
    dewPointC: number;
    wetBulbC: number;
    specificVolume: number;
    densityKgM3: number;
  };
  location: {
    name: string;
    lat: number;
    lon: number;
    zipCode: string;
    country: string;
  };
  cached: boolean;
  fetchedAt: string;
}

// Homescreen Layout table - stores icon positions for the DeltaV HomeScreen
export const homescreenLayout = pgTable("homescreen_layout", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  screenId: text("screen_id").notNull(),
  elementId: text("element_id").notNull(),
  positionX: doublePrecision("position_x").notNull(),
  positionY: doublePrecision("position_y").notNull(),
  width: doublePrecision("width").notNull(),
  height: doublePrecision("height").notNull(),
  rotation: integer("rotation").default(0),
  viewScreen: text("view_screen"), // For dynamically added elements - which view they belong to (L1, L2, L3, L4, etc.)
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertHomescreenLayoutSchema = createInsertSchema(homescreenLayout).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertHomescreenLayout = z.infer<typeof insertHomescreenLayoutSchema>;
export type HomescreenLayout = typeof homescreenLayout.$inferSelect;

// Controller Configs table - stores faceplate controller configurations
export const controllerConfigs = pgTable("controller_configs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  controllerId: text("controller_id").notNull().unique(),
  config: jsonb("config").notNull(),
  data: jsonb("data"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertControllerConfigSchema = createInsertSchema(controllerConfigs).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertControllerConfig = z.infer<typeof insertControllerConfigSchema>;
export type ControllerConfig = typeof controllerConfigs.$inferSelect;

// Screen Layouts table - stores the entire flow canvas layout as JSON
export const screenLayouts = pgTable("screen_layouts", {
  id: varchar("id").primaryKey(), // The screen ID (e.g. "L1", "L2", etc.)
  data: jsonb("data").notNull(), // Stores { nodes, edges, nodeMap }
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertScreenLayoutSchema = createInsertSchema(screenLayouts).omit({
  createdAt: true,
  updatedAt: true,
});

export type InsertScreenLayout = z.infer<typeof insertScreenLayoutSchema>;
export type ScreenLayout = typeof screenLayouts.$inferSelect;
