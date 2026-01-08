// IMPORTANT: This file was recovered via checkpoint rollback on January 8, 2026
// Prefer local (HEAD) version over remote changes unless upstream contains critical fixes
// Reviewed and resolved manually - do not blindly overwrite in future merges


import { users, processTags, catalystParameters, converterCases, processVariables, sulfurProcessNodes, homescreenLayout, type User, type UpsertUser, type UserType, type ProcessTag, type InsertProcessTag, type CatalystParameter, type InsertCatalystParameter, type ConverterCase, type InsertConverterCase, type ProcessVariable, type InsertProcessVariable, type SulfurProcessNode, type InsertSulfurProcessNode, type HomescreenLayout, type InsertHomescreenLayout } from "@shared/schema";
import { db } from "./db";
import { eq, desc, and } from "drizzle-orm";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: UpsertUser): Promise<User>;
  upsertUser(user: UpsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;
  updateUserPassword(userId: string, hashedPassword: string): Promise<User | undefined>;
  updateUserType(userId: string, userType: UserType): Promise<User | undefined>;
  deleteUser(userId: string): Promise<boolean>;
  
  // Process Tags
  getAllProcessTags(): Promise<ProcessTag[]>;
  getProcessTag(id: number): Promise<ProcessTag | undefined>;
  createProcessTag(tag: InsertProcessTag): Promise<ProcessTag>;
  createManyProcessTags(tags: InsertProcessTag[]): Promise<ProcessTag[]>;
  updateProcessTag(id: number, tag: Partial<InsertProcessTag>): Promise<ProcessTag | undefined>;
  deleteProcessTag(id: number): Promise<boolean>;
  deleteAllProcessTags(): Promise<boolean>;
  
  // Catalyst Parameters
  getAllCatalystParameters(): Promise<CatalystParameter[]>;
  getCatalystParameterByName(name: string): Promise<CatalystParameter | undefined>;
  upsertCatalystParameter(param: InsertCatalystParameter): Promise<CatalystParameter>;
  upsertManyCatalystParameters(params: InsertCatalystParameter[]): Promise<CatalystParameter[]>;
  
  // Converter Cases
  getAllConverterCases(): Promise<ConverterCase[]>;
  getConverterCase(id: number): Promise<ConverterCase | undefined>;
  createConverterCase(caseData: InsertConverterCase): Promise<ConverterCase>;
  updateConverterCase(id: number, caseData: Partial<InsertConverterCase>): Promise<ConverterCase | undefined>;
  deleteConverterCase(id: number): Promise<boolean>;
  
  // Process Variables
  getAllProcessVariables(): Promise<ProcessVariable[]>;
  upsertProcessVariables(vars: InsertProcessVariable[]): Promise<ProcessVariable[]>;
  
  // Sulfur Process Nodes
  getSulfurProcessNodes(simulationType: string): Promise<SulfurProcessNode[]>;
  upsertSulfurProcessNodes(simulationType: string, nodes: InsertSulfurProcessNode[]): Promise<SulfurProcessNode[]>;
  
  // Homescreen Layout
  getHomescreenLayout(screenId: string): Promise<HomescreenLayout[]>;
  upsertHomescreenLayout(screenId: string, layouts: Partial<InsertHomescreenLayout>[]): Promise<HomescreenLayout[]>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .returning();
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    const allUsers = await db.select().from(users);
    return allUsers;
  }

  async updateUserPassword(userId: string, hashedPassword: string): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ hashedPassword, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async updateUserType(userId: string, userType: UserType): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ userType, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async deleteUser(userId: string): Promise<boolean> {
    const result = await db.delete(users).where(eq(users.id, userId));
    return true;
  }

  // Process Tags methods
  async getAllProcessTags(): Promise<ProcessTag[]> {
    return await db.select().from(processTags);
  }

  async getProcessTag(id: number): Promise<ProcessTag | undefined> {
    const [tag] = await db.select().from(processTags).where(eq(processTags.id, id));
    return tag;
  }

  async createProcessTag(tag: InsertProcessTag): Promise<ProcessTag> {
    const [newTag] = await db.insert(processTags).values(tag).returning();
    return newTag;
  }

  async createManyProcessTags(tags: InsertProcessTag[]): Promise<ProcessTag[]> {
    if (tags.length === 0) return [];
    const newTags = await db.insert(processTags).values(tags).returning();
    return newTags;
  }

  async updateProcessTag(id: number, tag: Partial<InsertProcessTag>): Promise<ProcessTag | undefined> {
    const [updated] = await db
      .update(processTags)
      .set({ ...tag, updatedAt: new Date() })
      .where(eq(processTags.id, id))
      .returning();
    return updated;
  }

  async deleteProcessTag(id: number): Promise<boolean> {
    await db.delete(processTags).where(eq(processTags.id, id));
    return true;
  }

  async deleteAllProcessTags(): Promise<boolean> {
    await db.delete(processTags);
    return true;
  }

  // Catalyst Parameters methods
  async getAllCatalystParameters(): Promise<CatalystParameter[]> {
    return await db.select().from(catalystParameters);
  }

  async getCatalystParameterByName(name: string): Promise<CatalystParameter | undefined> {
    const [param] = await db.select().from(catalystParameters).where(eq(catalystParameters.name, name));
    return param;
  }

  async upsertCatalystParameter(param: InsertCatalystParameter): Promise<CatalystParameter> {
    const [result] = await db
      .insert(catalystParameters)
      .values(param)
      .onConflictDoUpdate({
        target: catalystParameters.name,
        set: {
          ...param,
          updatedAt: new Date(),
        },
      })
      .returning();
    return result;
  }

  async upsertManyCatalystParameters(params: InsertCatalystParameter[]): Promise<CatalystParameter[]> {
    const results: CatalystParameter[] = [];
    for (const param of params) {
      const result = await this.upsertCatalystParameter(param);
      results.push(result);
    }
    return results;
  }

  // Converter Cases methods
  async getAllConverterCases(): Promise<ConverterCase[]> {
    return await db.select().from(converterCases).orderBy(desc(converterCases.createdAt));
  }

  async getConverterCase(id: number): Promise<ConverterCase | undefined> {
    const [caseData] = await db.select().from(converterCases).where(eq(converterCases.id, id));
    return caseData;
  }

  async createConverterCase(caseData: InsertConverterCase): Promise<ConverterCase> {
    const [result] = await db.insert(converterCases).values(caseData).returning();
    return result;
  }

  async updateConverterCase(id: number, caseData: Partial<InsertConverterCase>): Promise<ConverterCase | undefined> {
    const [updated] = await db
      .update(converterCases)
      .set({ ...caseData, updatedAt: new Date() })
      .where(eq(converterCases.id, id))
      .returning();
    return updated;
  }

  async deleteConverterCase(id: number): Promise<boolean> {
    await db.delete(converterCases).where(eq(converterCases.id, id));
    return true;
  }

  // Process Variables methods
  async getAllProcessVariables(): Promise<ProcessVariable[]> {
    return await db.select().from(processVariables);
  }

  async upsertProcessVariables(vars: InsertProcessVariable[]): Promise<ProcessVariable[]> {
    // Delete all existing and insert new (simple replace strategy)
    await db.delete(processVariables);
    if (vars.length === 0) return [];
    const results = await db.insert(processVariables).values(vars).returning();
    return results;
  }

  // Sulfur Process Nodes methods
  async getSulfurProcessNodes(simulationType: string): Promise<SulfurProcessNode[]> {
    return await db.select().from(sulfurProcessNodes).where(eq(sulfurProcessNodes.simulationType, simulationType));
  }

  async upsertSulfurProcessNodes(simulationType: string, nodes: InsertSulfurProcessNode[]): Promise<SulfurProcessNode[]> {
    // Delete existing nodes for this simulation type and insert new
    await db.delete(sulfurProcessNodes).where(eq(sulfurProcessNodes.simulationType, simulationType));
    if (nodes.length === 0) return [];
    const results = await db.insert(sulfurProcessNodes).values(nodes).returning();
    return results;
  }

  // Homescreen Layout methods
  async getHomescreenLayout(screenId: string): Promise<HomescreenLayout[]> {
    return await db.select().from(homescreenLayout).where(eq(homescreenLayout.screenId, screenId));
  }

  async upsertHomescreenLayout(screenId: string, layouts: Partial<InsertHomescreenLayout>[]): Promise<HomescreenLayout[]> {
    // For each layout item, update if exists or insert new
    const results: HomescreenLayout[] = [];
    for (const layout of layouts) {
      // Find existing by screenId and elementId
      const existing = await db.select().from(homescreenLayout)
        .where(and(
          eq(homescreenLayout.screenId, screenId),
          eq(homescreenLayout.elementId, layout.elementId || '')
        ));
      
      if (existing.length > 0) {
        // Update existing
        const [updated] = await db.update(homescreenLayout)
          .set({
            positionX: layout.positionX ?? 0,
            positionY: layout.positionY ?? 0,
            width: layout.width ?? 100,
            height: layout.height ?? 100,
            rotation: layout.rotation ?? 0,
            updatedAt: new Date(),
          })
          .where(eq(homescreenLayout.id, existing[0].id))
          .returning();
        results.push(updated);
      } else {
        // Insert new
        const [inserted] = await db.insert(homescreenLayout)
          .values({
            screenId,
            elementId: layout.elementId || '',
            positionX: layout.positionX ?? 0,
            positionY: layout.positionY ?? 0,
            width: layout.width ?? 100,
            height: layout.height ?? 100,
            rotation: layout.rotation ?? 0,
          })
          .returning();
        results.push(inserted);
      }
    }
    return results;
  }
}

export const storage = new DatabaseStorage();
