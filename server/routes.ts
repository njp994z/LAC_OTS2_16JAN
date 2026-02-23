// IMPORTANT: This file was recovered via checkpoint rollback on January 8, 2026
// Prefer local (HEAD) version over remote changes unless upstream contains critical fixes
// Reviewed and resolved manually - do not blindly overwrite in future merges

import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { spawn } from "child_process";
import path from "path";
import fs from "fs";
import archiver from "archiver";
import rateLimit from "express-rate-limit";
import { storage } from "./storage";
import { hashPassword, comparePassword, validatePassword, validateUsername } from "./passwordUtils";
import OpenAI from "openai";
import { calculateReactorFlow, calculateGasFlowFromPlantRate } from "../shared/reactor-calculations";
import { sessionWS } from "./websocket";
import { getCurrentPsychrometrics, getHistoricalPsychrometrics, isWeatherServiceConfigured, WeatherServiceError } from "./services/weatherService";
import { weatherRequestSchema, weatherHistoryRequestSchema, catalystParameterApiSchema, insertConverterCaseSchema } from "../shared/schema";

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  message: { message: "Too many requests from this IP, please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { message: "Too many login attempts, please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
});

declare module "express-session" {
  interface SessionData {
    userId?: string;
  }
}

function isAuthenticated(req: Request, res: Response, next: NextFunction) {
  if (req.session && req.session.userId) {
    return next();
  }
  res.status(401).json({ message: "Unauthorized" });
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Controller Configs API
  app.get('/api/controller-configs/:controllerId', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { controllerId } = req.params;
      const config = await storage.getControllerConfig(controllerId);
      if (!config) {
        return res.status(404).json({ message: "Controller configuration not found" });
      }
      res.json(config);
    } catch (error) {
      console.error("Error fetching controller config:", error);
      res.status(500).json({ message: "Failed to fetch controller config" });
    }
  });

  app.post('/api/controller-configs', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { controllerId, config, data } = req.body;
      if (!controllerId || !config) {
        return res.status(400).json({ message: "controllerId and config are required" });
      }
      const updated = await storage.upsertControllerConfig(controllerId, config, data);
      res.json(updated);
    } catch (error) {
      console.error("Error upserting controller config:", error);
      res.status(500).json({ message: "Failed to save controller config" });
    }
  });

  const httpServer = createServer(app);

  // Initialize WebSocket server for real-time session broadcasting
  sessionWS.initialize(httpServer);

  app.use('/api/login', authLimiter);
  app.use('/api/register', authLimiter);

  app.use('/api/', apiLimiter);

  app.post('/api/register', async (req: Request, res: Response) => {
    try {
      const { email, password, firstName, lastName } = req.body;

      // Email is required and used as username
      if (!email || typeof email !== 'string') {
        return res.status(400).json({ message: "Email is required" });
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ message: "Please enter a valid email address" });
      }

      const passwordValidation = validatePassword(password);
      if (!passwordValidation.valid) {
        return res.status(400).json({ message: passwordValidation.error });
      }

      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "An account with this email already exists" });
      }

      const hashedPassword = await hashPassword(password);
      const user = await storage.createUser({
        username: email, // Use email as username
        hashedPassword,
        email,
        firstName,
        lastName,
      });

      req.session.regenerate((err) => {
        if (err) {
          console.error("Session regeneration error:", err);
          return res.status(500).json({ message: "Failed to create session" });
        }

        req.session.userId = user.id;

        req.session.save((saveErr) => {
          if (saveErr) {
            console.error("Session save error:", saveErr);
            return res.status(500).json({ message: "Failed to save session" });
          }

          const { hashedPassword: _, ...userWithoutPassword } = user;
          res.status(201).json(userWithoutPassword);
        });
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ message: "Failed to register user" });
    }
  });

  app.post('/api/login', async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }

      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      const isValid = await comparePassword(password, user.hashedPassword);
      if (!isValid) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      req.session.regenerate((err) => {
        if (err) {
          console.error("Session regeneration error:", err);
          return res.status(500).json({ message: "Failed to create session" });
        }

        req.session.userId = user.id;

        req.session.save((saveErr) => {
          if (saveErr) {
            console.error("Session save error:", saveErr);
            return res.status(500).json({ message: "Failed to save session" });
          }

          const { hashedPassword: _, ...userWithoutPassword } = user;
          res.json(userWithoutPassword);
        });
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Failed to login" });
    }
  });

  app.post('/api/logout', async (req: Request, res: Response) => {
    req.session.destroy((err) => {
      if (err) {
        console.error("Logout error:", err);
        return res.status(500).json({ message: "Failed to logout" });
      }
      res.clearCookie('connect.sid');
      res.json({ message: "Logged out successfully" });
    });
  });

  app.get('/api/auth/user', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId!;
      const user = await storage.getUser(userId);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const { hashedPassword: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Admin API endpoints for user management
  app.get('/api/admin/users', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const users = await storage.getAllUsers();
      const usersWithoutPasswords = users.map(user => {
        const { hashedPassword: _, ...userWithoutPassword } = user;
        return userWithoutPassword;
      });
      res.json(usersWithoutPasswords);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.post('/api/admin/users/:userId/reset-password', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const { newPassword } = req.body;

      if (!newPassword) {
        return res.status(400).json({ message: "New password is required" });
      }

      const passwordValidation = validatePassword(newPassword);
      if (!passwordValidation.valid) {
        return res.status(400).json({ message: passwordValidation.error });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const hashedPassword = await hashPassword(newPassword);
      const updatedUser = await storage.updateUserPassword(userId, hashedPassword);

      if (!updatedUser) {
        return res.status(500).json({ message: "Failed to update password" });
      }

      const { hashedPassword: _, ...userWithoutPassword } = updatedUser;
      res.json({ message: "Password reset successfully", user: userWithoutPassword });
    } catch (error) {
      console.error("Error resetting password:", error);
      res.status(500).json({ message: "Failed to reset password" });
    }
  });

  app.post('/api/admin/users', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { email, password, firstName, lastName } = req.body;

      // Email is required and used as username
      if (!email || typeof email !== 'string') {
        return res.status(400).json({ message: "Email is required" });
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ message: "Please enter a valid email address" });
      }

      const passwordValidation = validatePassword(password);
      if (!passwordValidation.valid) {
        return res.status(400).json({ message: passwordValidation.error });
      }

      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "An account with this email already exists" });
      }

      const hashedPassword = await hashPassword(password);
      const user = await storage.createUser({
        username: email, // Use email as username
        hashedPassword,
        email,
        firstName,
        lastName,
      });

      const { hashedPassword: _, ...userWithoutPassword } = user;
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      console.error("Error creating user:", error);
      res.status(500).json({ message: "Failed to create user" });
    }
  });

  app.patch('/api/admin/users/:userId/type', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const { userType } = req.body;

      const validTypes = ["Admin", "Engineer", "Operator"];
      if (!userType || !validTypes.includes(userType)) {
        return res.status(400).json({ message: "Invalid user type. Must be Admin, Engineer, or Operator" });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const updatedUser = await storage.updateUserType(userId, userType);
      if (!updatedUser) {
        return res.status(500).json({ message: "Failed to update user type" });
      }

      const { hashedPassword: _, ...userWithoutPassword } = updatedUser;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Error updating user type:", error);
      res.status(500).json({ message: "Failed to update user type" });
    }
  });

  app.delete('/api/admin/users/:userId', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const currentUserId = req.session.userId;

      if (userId === currentUserId) {
        return res.status(400).json({ message: "Cannot delete your own account" });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      await storage.deleteUser(userId);
      res.json({ message: "User deleted successfully" });
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ message: "Failed to delete user" });
    }
  });

  // Process Tags API endpoints - all require authentication
  app.get('/api/process-tags', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const tags = await storage.getAllProcessTags();
      res.json(tags);
    } catch (error) {
      console.error("Error fetching process tags:", error);
      res.status(500).json({ message: "Failed to fetch process tags" });
    }
  });

  app.get('/api/process-tags/:id', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid tag ID" });
      }
      const tag = await storage.getProcessTag(id);
      if (!tag) {
        return res.status(404).json({ message: "Tag not found" });
      }
      res.json(tag);
    } catch (error) {
      console.error("Error fetching process tag:", error);
      res.status(500).json({ message: "Failed to fetch process tag" });
    }
  });

  // Helper to normalize empty strings to null and parse page as number
  const normalizeTagData = (data: any) => {
    const normalized: any = {};
    for (const [key, value] of Object.entries(data)) {
      if (value === '' || value === undefined) {
        normalized[key] = null;
      } else if (key === 'page' && value !== null) {
        const parsed = parseInt(String(value));
        normalized[key] = isNaN(parsed) ? null : parsed;
      } else {
        normalized[key] = value;
      }
    }
    return normalized;
  };

  app.post('/api/process-tags', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const normalizedData = normalizeTagData(req.body);
      const tag = await storage.createProcessTag(normalizedData);
      res.status(201).json(tag);
    } catch (error) {
      console.error("Error creating process tag:", error);
      res.status(500).json({ message: "Failed to create process tag" });
    }
  });

  app.post('/api/process-tags/bulk', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { tags } = req.body;
      if (!Array.isArray(tags)) {
        return res.status(400).json({ message: "Tags must be an array" });
      }
      const normalizedTags = tags.map(normalizeTagData);
      const createdTags = await storage.createManyProcessTags(normalizedTags);
      res.status(201).json(createdTags);
    } catch (error) {
      console.error("Error creating process tags:", error);
      res.status(500).json({ message: "Failed to create process tags" });
    }
  });

  app.patch('/api/process-tags/:id', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid tag ID" });
      }
      const normalizedData = normalizeTagData(req.body);
      const updated = await storage.updateProcessTag(id, normalizedData);
      if (!updated) {
        return res.status(404).json({ message: "Tag not found" });
      }
      res.json(updated);
    } catch (error) {
      console.error("Error updating process tag:", error);
      res.status(500).json({ message: "Failed to update process tag" });
    }
  });

  app.delete('/api/process-tags/:id', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid tag ID" });
      }
      await storage.deleteProcessTag(id);
      res.json({ message: "Tag deleted successfully" });
    } catch (error) {
      console.error("Error deleting process tag:", error);
      res.status(500).json({ message: "Failed to delete process tag" });
    }
  });

  app.delete('/api/process-tags', isAuthenticated, async (req: Request, res: Response) => {
    try {
      await storage.deleteAllProcessTags();
      res.json({ message: "All tags deleted successfully" });
    } catch (error) {
      console.error("Error deleting all process tags:", error);
      res.status(500).json({ message: "Failed to delete all process tags" });
    }
  });

  // Seed process tags from CSV data
  app.post('/api/process-tags/seed', isAuthenticated, async (req: Request, res: Response) => {
    try {
      // Check if tags already exist
      const existingTags = await storage.getAllProcessTags();
      if (existingTags.length > 0) {
        return res.status(400).json({ message: "Tags already exist. Delete existing tags first to reseed." });
      }

      // Complete process tags data - 60 rows from CSV with Yes/No on hold values
      const tags = [
        // Safety Showers - Group Alarms (Pages 20-25)
        { tagName: "1500-F-4244", description: "AREA 1510 GROUP SAFETY SHOWER ALARM", area: "Safety Showers", loopType: "Digital Input", pvUnit: "-", rangeLow: "0", rangeHigh: "1", typicalSp: null, alarmHH: null, alarmH: null, alarmL: null, alarmLL: null, controlMode: "None", controllerOutputTo: "None", setpointSource: "None", cascadeMaster: "None", failPosition: "None", interlocksPermissives: "Group alarm from multiple safety shower flow switches", keyNarrativeSummary: null, onHold: "No", page: 20 },
        { tagName: "1500-F-4240", description: "AREA 1520 GROUP SAFETY SHOWER ALARM", area: "Safety Showers", loopType: "Digital Input", pvUnit: "-", rangeLow: "0", rangeHigh: "1", typicalSp: null, alarmHH: null, alarmH: null, alarmL: null, alarmLL: null, controlMode: "None", controllerOutputTo: "None", setpointSource: "None", cascadeMaster: "None", failPosition: "None", interlocksPermissives: "Group alarm from multiple safety shower flow switches", keyNarrativeSummary: null, onHold: "No", page: 21 },
        { tagName: "1500-F-4242", description: "AREA 1530 GROUP SAFETY SHOWER ALARM", area: "Safety Showers", loopType: "Digital Input", pvUnit: "-", rangeLow: "0", rangeHigh: "1", typicalSp: null, alarmHH: null, alarmH: null, alarmL: null, alarmLL: null, controlMode: "None", controllerOutputTo: "None", setpointSource: "None", cascadeMaster: "None", failPosition: "None", interlocksPermissives: "Group alarm from multiple safety shower flow switches", keyNarrativeSummary: null, onHold: "No", page: 22 },
        { tagName: "1500-F-4042", description: "AREA 1540 GROUP SAFETY SHOWER ALARM", area: "Safety Showers", loopType: "Digital Input", pvUnit: "-", rangeLow: "0", rangeHigh: "1", typicalSp: null, alarmHH: null, alarmH: null, alarmL: null, alarmLL: null, controlMode: "None", controllerOutputTo: "None", setpointSource: "None", cascadeMaster: "None", failPosition: "None", interlocksPermissives: "Group alarm from multiple safety shower flow switches", keyNarrativeSummary: null, onHold: "No", page: 23 },
        { tagName: "1500-F-4044", description: "AREA 1560 GROUP SAFETY SHOWER ALARM", area: "Safety Showers", loopType: "Digital Input", pvUnit: "-", rangeLow: "0", rangeHigh: "1", typicalSp: null, alarmHH: null, alarmH: null, alarmL: null, alarmLL: null, controlMode: "None", controllerOutputTo: "None", setpointSource: "None", cascadeMaster: "None", failPosition: "None", interlocksPermissives: "Group alarm from multiple safety shower flow switches", keyNarrativeSummary: null, onHold: "No", page: 24 },
        { tagName: "1500-F-4040", description: "AREA 1570 GROUP SAFETY SHOWER ALARM", area: "Safety Showers", loopType: "Digital Input", pvUnit: "-", rangeLow: "0", rangeHigh: "1", typicalSp: null, alarmHH: null, alarmH: null, alarmL: null, alarmLL: null, controlMode: "None", controllerOutputTo: "None", setpointSource: "None", cascadeMaster: "None", failPosition: "None", interlocksPermissives: "Group alarm from multiple safety shower flow switches", keyNarrativeSummary: null, onHold: "No", page: 25 },
        // Safety Showers - Individual (Pages 26-57)
        { tagName: "1500-F-4002", description: "TG BUILDING SAFETY SHOWER (NEAR WATER TREATMENT CHEM DOSING)", area: "Safety Showers", loopType: "Digital Input", pvUnit: "-", rangeLow: "0", rangeHigh: "1", typicalSp: null, alarmHH: null, alarmH: null, alarmL: null, alarmLL: null, controlMode: "None", controllerOutputTo: "None", setpointSource: "None", cascadeMaster: "None", failPosition: "None", interlocksPermissives: "Individual safety shower activation alarm", keyNarrativeSummary: null, onHold: "No", page: 26 },
        { tagName: "1500-F-4004", description: "TG BUILDING SAFETY SHOWER (AUX. BOILER CHEMICAL DOSING)", area: "Safety Showers", loopType: "Digital Input", pvUnit: "-", rangeLow: "0", rangeHigh: "1", typicalSp: null, alarmHH: null, alarmH: null, alarmL: null, alarmLL: null, controlMode: "None", controllerOutputTo: "None", setpointSource: "None", cascadeMaster: "None", failPosition: "None", interlocksPermissives: "Individual safety shower activation alarm", keyNarrativeSummary: null, onHold: "No", page: 27 },
        { tagName: "1500-F-4006", description: "ACC DEAERATOR (AT GRADE) SAFETY SHOWER", area: "Safety Showers", loopType: "Digital Input", pvUnit: "-", rangeLow: "0", rangeHigh: "1", typicalSp: null, alarmHH: null, alarmH: null, alarmL: null, alarmLL: null, controlMode: "None", controllerOutputTo: "None", setpointSource: "None", cascadeMaster: "None", failPosition: "None", interlocksPermissives: "Individual safety shower activation alarm", keyNarrativeSummary: null, onHold: "No", page: 28 },
        { tagName: "1500-F-4008", description: "CONV SH/ECON AREA (GRADE) SAFETY SHOWER", area: "Safety Showers", loopType: "Digital Input", pvUnit: "-", rangeLow: "0", rangeHigh: "1", typicalSp: null, alarmHH: null, alarmH: null, alarmL: null, alarmLL: null, controlMode: "None", controllerOutputTo: "None", setpointSource: "None", cascadeMaster: "None", failPosition: "None", interlocksPermissives: "Individual safety shower activation alarm", keyNarrativeSummary: null, onHold: "No", page: 29 },
        { tagName: "1500-F-4010", description: "MAIN COMPRESSOR AREA (AT GRADE) SAFETY SHOWER", area: "Safety Showers", loopType: "Digital Input", pvUnit: "-", rangeLow: "0", rangeHigh: "1", typicalSp: null, alarmHH: null, alarmH: null, alarmL: null, alarmLL: null, controlMode: "None", controllerOutputTo: "None", setpointSource: "None", cascadeMaster: "None", failPosition: "None", interlocksPermissives: "Individual safety shower activation alarm", keyNarrativeSummary: null, onHold: "No", page: 30 },
        { tagName: "1500-F-4012", description: "SULFUR FURNACE (AT GRADE) SAFETY SHOWER", area: "Safety Showers", loopType: "Digital Input", pvUnit: "-", rangeLow: "0", rangeHigh: "1", typicalSp: null, alarmHH: null, alarmH: null, alarmL: null, alarmLL: null, controlMode: "None", controllerOutputTo: "None", setpointSource: "None", cascadeMaster: "None", failPosition: "None", interlocksPermissives: "Individual safety shower activation alarm", keyNarrativeSummary: null, onHold: "No", page: 31 },
        { tagName: "1500-F-4014", description: "DEAREATOR (AT GRADE) SAFETY SHOWER", area: "Safety Showers", loopType: "Digital Input", pvUnit: "-", rangeLow: "0", rangeHigh: "1", typicalSp: null, alarmHH: null, alarmH: null, alarmL: null, alarmLL: null, controlMode: "None", controllerOutputTo: "None", setpointSource: "None", cascadeMaster: "None", failPosition: "None", interlocksPermissives: "Individual safety shower activation alarm", keyNarrativeSummary: null, onHold: "No", page: 32 },
        { tagName: "1500-F-4016", description: "COOLING TOWER (AT CHEMICAL DOSING) SAFETY SHOWER", area: "Safety Showers", loopType: "Digital Input", pvUnit: "-", rangeLow: "0", rangeHigh: "1", typicalSp: null, alarmHH: null, alarmH: null, alarmL: null, alarmLL: null, controlMode: "None", controllerOutputTo: "None", setpointSource: "None", cascadeMaster: "None", failPosition: "None", interlocksPermissives: "Individual safety shower activation alarm", keyNarrativeSummary: null, onHold: "No", page: 33 },
        { tagName: "1500-F-4026", description: "ACID STORAGE (AT PUMPS) SAFETY SHOWER", area: "Safety Showers", loopType: "Digital Input", pvUnit: "-", rangeLow: "0", rangeHigh: "1", typicalSp: null, alarmHH: null, alarmH: null, alarmL: null, alarmLL: null, controlMode: "None", controllerOutputTo: "None", setpointSource: "None", cascadeMaster: "None", failPosition: "None", interlocksPermissives: "Individual safety shower activation alarm", keyNarrativeSummary: null, onHold: "No", page: 34 },
        { tagName: "1500-F-4028", description: "ACID STORAGE (AT RECIRC. PUMPS) SAFETY SHOWER", area: "Safety Showers", loopType: "Digital Input", pvUnit: "-", rangeLow: "0", rangeHigh: "1", typicalSp: null, alarmHH: null, alarmH: null, alarmL: null, alarmLL: null, controlMode: "None", controllerOutputTo: "None", setpointSource: "None", cascadeMaster: "None", failPosition: "None", interlocksPermissives: "Individual safety shower activation alarm", keyNarrativeSummary: null, onHold: "No", page: 35 },
        { tagName: "1500-F-4030", description: "ACID LOADING (AT PLATFORM) SAFETY SHOWER", area: "Safety Showers", loopType: "Digital Input", pvUnit: "-", rangeLow: "0", rangeHigh: "1", typicalSp: null, alarmHH: null, alarmH: null, alarmL: null, alarmLL: null, controlMode: "None", controllerOutputTo: "None", setpointSource: "None", cascadeMaster: "None", failPosition: "None", interlocksPermissives: "Individual safety shower activation alarm", keyNarrativeSummary: null, onHold: "No", page: 36 },
        { tagName: "1500-F-4032", description: "ACID LOADING (AT GRADE) SAFETY SHOWER", area: "Safety Showers", loopType: "Digital Input", pvUnit: "-", rangeLow: "0", rangeHigh: "1", typicalSp: null, alarmHH: null, alarmH: null, alarmL: null, alarmLL: null, controlMode: "None", controllerOutputTo: "None", setpointSource: "None", cascadeMaster: "None", failPosition: "None", interlocksPermissives: "Individual safety shower activation alarm", keyNarrativeSummary: null, onHold: "No", page: 37 },
        { tagName: "1500-F-4200", description: "EFFLUENT NEUTRALIZATION SAFETY SHOWER", area: "Safety Showers", loopType: "Digital Input", pvUnit: "-", rangeLow: "0", rangeHigh: "1", typicalSp: null, alarmHH: null, alarmH: null, alarmL: null, alarmLL: null, controlMode: "None", controllerOutputTo: "None", setpointSource: "None", cascadeMaster: "None", failPosition: "None", interlocksPermissives: "Individual safety shower activation alarm", keyNarrativeSummary: null, onHold: "No", page: 38 },
        { tagName: "1500-F-4202", description: "COMBINATION PUMP TANK (ON PLATFORM) SAFETY SHOWER", area: "Safety Showers", loopType: "Digital Input", pvUnit: "-", rangeLow: "0", rangeHigh: "1", typicalSp: null, alarmHH: null, alarmH: null, alarmL: null, alarmLL: null, controlMode: "None", controllerOutputTo: "None", setpointSource: "None", cascadeMaster: "None", failPosition: "None", interlocksPermissives: "Individual safety shower activation alarm", keyNarrativeSummary: null, onHold: "No", page: 39 },
        { tagName: "1500-F-4204", description: "ACID COOLER (AT GRADE) SAFETY SHOWER", area: "Safety Showers", loopType: "Digital Input", pvUnit: "-", rangeLow: "0", rangeHigh: "1", typicalSp: null, alarmHH: null, alarmH: null, alarmL: null, alarmLL: null, controlMode: "None", controllerOutputTo: "None", setpointSource: "None", cascadeMaster: "None", failPosition: "None", interlocksPermissives: "Individual safety shower activation alarm", keyNarrativeSummary: null, onHold: "No", page: 40 },
        { tagName: "1500-F-4206", description: "DRYING TOWER (AT GRADE) SAFETY SHOWER", area: "Safety Showers", loopType: "Digital Input", pvUnit: "-", rangeLow: "0", rangeHigh: "1", typicalSp: null, alarmHH: null, alarmH: null, alarmL: null, alarmLL: null, controlMode: "None", controllerOutputTo: "None", setpointSource: "None", cascadeMaster: "None", failPosition: "None", interlocksPermissives: "Individual safety shower activation alarm", keyNarrativeSummary: null, onHold: "No", page: 41 },
        { tagName: "1500-F-4208", description: "FINAL TOWER (AT TUBESHEET) SAFETY SHOWER", area: "Safety Showers", loopType: "Digital Input", pvUnit: "-", rangeLow: "0", rangeHigh: "1", typicalSp: null, alarmHH: null, alarmH: null, alarmL: null, alarmLL: null, controlMode: "None", controllerOutputTo: "None", setpointSource: "None", cascadeMaster: "None", failPosition: "None", interlocksPermissives: "Individual safety shower activation alarm", keyNarrativeSummary: null, onHold: "No", page: 42 },
        { tagName: "1500-F-4210", description: "DRYING TOWER (TUBESHEET) SAFETY SHOWER", area: "Safety Showers", loopType: "Digital Input", pvUnit: "-", rangeLow: "0", rangeHigh: "1", typicalSp: null, alarmHH: null, alarmH: null, alarmL: null, alarmLL: null, controlMode: "None", controllerOutputTo: "None", setpointSource: "None", cascadeMaster: "None", failPosition: "None", interlocksPermissives: "Individual safety shower activation alarm", keyNarrativeSummary: null, onHold: "No", page: 43 },
        { tagName: "1500-F-4212", description: "FINAL TOWER (AT PLATFORM) SAFETY SHOWER", area: "Safety Showers", loopType: "Digital Input", pvUnit: "-", rangeLow: "0", rangeHigh: "1", typicalSp: null, alarmHH: null, alarmH: null, alarmL: null, alarmLL: null, controlMode: "None", controllerOutputTo: "None", setpointSource: "None", cascadeMaster: "None", failPosition: "None", interlocksPermissives: "Individual safety shower activation alarm", keyNarrativeSummary: null, onHold: "No", page: 44 },
        { tagName: "1500-F-4214", description: "FINAL TOWER (AT PLATFORM) SAFETY SHOWER", area: "Safety Showers", loopType: "Digital Input", pvUnit: "-", rangeLow: "0", rangeHigh: "1", typicalSp: null, alarmHH: null, alarmH: null, alarmL: null, alarmLL: null, controlMode: "None", controllerOutputTo: "None", setpointSource: "None", cascadeMaster: "None", failPosition: "None", interlocksPermissives: "Individual safety shower activation alarm", keyNarrativeSummary: null, onHold: "No", page: 45 },
        { tagName: "1500-F-4215", description: "INTERPASS TOWER (DISTRIBUTOR) SAFETY SHOWER", area: "Safety Showers", loopType: "Digital Input", pvUnit: "-", rangeLow: "0", rangeHigh: "1", typicalSp: null, alarmHH: null, alarmH: null, alarmL: null, alarmLL: null, controlMode: "None", controllerOutputTo: "None", setpointSource: "None", cascadeMaster: "None", failPosition: "None", interlocksPermissives: "Individual safety shower activation alarm", keyNarrativeSummary: null, onHold: "No", page: 46 },
        { tagName: "1500-F-4216", description: "INTERPASS TOWER (AT GRADE) SAFETY SHOWER", area: "Safety Showers", loopType: "Digital Input", pvUnit: "-", rangeLow: "0", rangeHigh: "1", typicalSp: null, alarmHH: null, alarmH: null, alarmL: null, alarmLL: null, controlMode: "None", controllerOutputTo: "None", setpointSource: "None", cascadeMaster: "None", failPosition: "None", interlocksPermissives: "Individual safety shower activation alarm", keyNarrativeSummary: null, onHold: "No", page: 47 },
        { tagName: "1500-F-4220", description: "INTERPASS TOWER (DISTRIBUTOR) SAFETY SHOWER", area: "Safety Showers", loopType: "Digital Input", pvUnit: "-", rangeLow: "0", rangeHigh: "1", typicalSp: null, alarmHH: null, alarmH: null, alarmL: null, alarmLL: null, controlMode: "None", controllerOutputTo: "None", setpointSource: "None", cascadeMaster: "None", failPosition: "None", interlocksPermissives: "Individual safety shower activation alarm", keyNarrativeSummary: null, onHold: "No", page: 48 },
        { tagName: "1500-F-4217", description: "DRYING TOWER (AT PLATFORM) SAFETY SHOWER", area: "Safety Showers", loopType: "Digital Input", pvUnit: "-", rangeLow: "0", rangeHigh: "1", typicalSp: null, alarmHH: null, alarmH: null, alarmL: null, alarmLL: null, controlMode: "None", controllerOutputTo: "None", setpointSource: "None", cascadeMaster: "None", failPosition: "None", interlocksPermissives: "Individual safety shower activation alarm", keyNarrativeSummary: null, onHold: "No", page: 49 },
        { tagName: "1500-F-4224", description: "INTERPASS TOWER (AT TUBESHEET) SAFETY SHOWER", area: "Safety Showers", loopType: "Digital Input", pvUnit: "-", rangeLow: "0", rangeHigh: "1", typicalSp: null, alarmHH: null, alarmH: null, alarmL: null, alarmLL: null, controlMode: "None", controllerOutputTo: "None", setpointSource: "None", cascadeMaster: "None", failPosition: "None", interlocksPermissives: "Individual safety shower activation alarm", keyNarrativeSummary: null, onHold: "No", page: 50 },
        { tagName: "1500-F-4230", description: "PUMP TANK/STRONG ACID COOLER AREA (AT GRADE) SAFETY SHOWER", area: "Safety Showers", loopType: "Digital Input", pvUnit: "-", rangeLow: "0", rangeHigh: "1", typicalSp: null, alarmHH: null, alarmH: null, alarmL: null, alarmLL: null, controlMode: "None", controllerOutputTo: "None", setpointSource: "None", cascadeMaster: "None", failPosition: "None", interlocksPermissives: "Individual safety shower activation alarm", keyNarrativeSummary: null, onHold: "No", page: 51 },
        { tagName: "1500-F-4232", description: "INSIDE LAB SAFETY SHOWER", area: "Safety Showers", loopType: "Digital Input", pvUnit: "-", rangeLow: "0", rangeHigh: "1", typicalSp: null, alarmHH: null, alarmH: null, alarmL: null, alarmLL: null, controlMode: "None", controllerOutputTo: "None", setpointSource: "None", cascadeMaster: "None", failPosition: "None", interlocksPermissives: "Individual safety shower activation alarm", keyNarrativeSummary: null, onHold: "No", page: 52 },
        { tagName: "1500-F-4234", description: "TAIL GAS SCRUBBER (AT GRADE) SAFETY SHOWER", area: "Safety Showers", loopType: "Digital Input", pvUnit: "-", rangeLow: "0", rangeHigh: "1", typicalSp: null, alarmHH: null, alarmH: null, alarmL: null, alarmLL: null, controlMode: "None", controllerOutputTo: "None", setpointSource: "None", cascadeMaster: "None", failPosition: "None", interlocksPermissives: "Individual safety shower activation alarm", keyNarrativeSummary: null, onHold: "No", page: 53 },
        { tagName: "1500-F-4238", description: "SULFUR VAPOR SCRUBBER (AT PUMPS) SAFETY SHOWER", area: "Safety Showers", loopType: "Digital Input", pvUnit: "-", rangeLow: "0", rangeHigh: "1", typicalSp: null, alarmHH: null, alarmH: null, alarmL: null, alarmLL: null, controlMode: "None", controllerOutputTo: "None", setpointSource: "None", cascadeMaster: "None", failPosition: "None", interlocksPermissives: "Individual safety shower activation alarm", keyNarrativeSummary: null, onHold: "No", page: 54 },
        { tagName: "1500-F-4237", description: "SULFUR UNLOADING (NEAR TRUCKS) SAFETY SHOWER", area: "Safety Showers", loopType: "Digital Input", pvUnit: "-", rangeLow: "0", rangeHigh: "1", typicalSp: null, alarmHH: null, alarmH: null, alarmL: null, alarmLL: null, controlMode: "None", controllerOutputTo: "None", setpointSource: "None", cascadeMaster: "None", failPosition: "None", interlocksPermissives: "Individual safety shower activation alarm", keyNarrativeSummary: null, onHold: "No", page: 55 },
        { tagName: "1500-F-4236", description: "CAUSTIC STORAGE (AT TRUCKS) SAFETY SHOWER", area: "Safety Showers", loopType: "Digital Input", pvUnit: "-", rangeLow: "0", rangeHigh: "1", typicalSp: null, alarmHH: null, alarmH: null, alarmL: null, alarmLL: null, controlMode: "None", controllerOutputTo: "None", setpointSource: "None", cascadeMaster: "None", failPosition: "None", interlocksPermissives: "Individual safety shower activation alarm", keyNarrativeSummary: null, onHold: "No", page: 56 },
        { tagName: "1500-F-4235", description: "CAUSTIC STORAGE (AT PUMPS) SAFETY SHOWER", area: "Safety Showers", loopType: "Digital Input", pvUnit: "-", rangeLow: "0", rangeHigh: "1", typicalSp: null, alarmHH: null, alarmH: null, alarmL: null, alarmLL: null, controlMode: "None", controllerOutputTo: "None", setpointSource: "None", cascadeMaster: "None", failPosition: "None", interlocksPermissives: "Individual safety shower activation alarm", keyNarrativeSummary: null, onHold: "No", page: 57 },
        // Startup Burner and Aux Boiler (Pages 58-59)
        { tagName: "1500-F-9802", description: "PROPANE TO STARTUP BURNER", area: "Startup Burner", loopType: "Flow", pvUnit: "t/h", rangeLow: "0", rangeHigh: "10", typicalSp: "Operator", alarmHH: "8", alarmH: "6", alarmL: null, alarmLL: null, controlMode: "Auto/Man", controllerOutputTo: "FV-9802", setpointSource: "Operator", cascadeMaster: "None", failPosition: "Fail Close", interlocksPermissives: "Permissive: Burner management system healthy", keyNarrativeSummary: "Flow control to startup propane burner", onHold: "No", page: 58 },
        { tagName: "1500-F-9805", description: "PROPANE TO AUX BOILER", area: "Aux Boiler", loopType: "Flow", pvUnit: "t/h", rangeLow: "0", rangeHigh: "5", typicalSp: "Operator", alarmHH: "4", alarmH: "3", alarmL: null, alarmLL: null, controlMode: "Auto/Man", controllerOutputTo: "FV-9805", setpointSource: "Operator", cascadeMaster: "None", failPosition: "Fail Close", interlocksPermissives: "Permissive: Aux boiler in service", keyNarrativeSummary: "Propane flow to auxiliary boiler package", onHold: "No", page: 59 },
        // Sulfur Handling (Pages 60-79)
        { tagName: "1510-H-1003A", description: "SULFUR UNLOADING PUMP", area: "Sulfur Handling", loopType: "Pump Control", pvUnit: "-", rangeLow: "0", rangeHigh: "1", typicalSp: null, alarmHH: null, alarmH: null, alarmL: null, alarmLL: null, controlMode: "Auto/Man", controllerOutputTo: "HS-1003A", setpointSource: "Operator", cascadeMaster: "None", failPosition: "-", interlocksPermissives: "Start/stop + auto-start on high pit level", keyNarrativeSummary: "Lead sulfur unloading pump", onHold: "No", page: 60 },
        { tagName: "1510-H-1003B", description: "SULFUR UNLOADING PUMP (STANDBY)", area: "Sulfur Handling", loopType: "Pump Control", pvUnit: "-", rangeLow: "0", rangeHigh: "1", typicalSp: null, alarmHH: null, alarmH: null, alarmL: null, alarmLL: null, controlMode: "Auto/Man", controllerOutputTo: "HS-1003B", setpointSource: "Operator", cascadeMaster: "None", failPosition: "-", interlocksPermissives: "Standby pump with auto-start on lead fail", keyNarrativeSummary: "Standby sulfur unloading pump", onHold: "No", page: 61 },
        { tagName: "1510-H-1004A", description: "SULFUR FEED PUMP", area: "Sulfur Handling", loopType: "Pump Control", pvUnit: "-", rangeLow: "0", rangeHigh: "1", typicalSp: null, alarmHH: null, alarmH: null, alarmL: null, alarmLL: null, controlMode: "Auto/Man", controllerOutputTo: "HS-1004A", setpointSource: "Operator", cascadeMaster: "None", failPosition: "-", interlocksPermissives: "Lead sulfur feed pump to burner", keyNarrativeSummary: "Lead sulfur feed pump", onHold: "No", page: 62 },
        { tagName: "1510-H-1004B", description: "SULFUR FEED PUMP (STANDBY)", area: "Sulfur Handling", loopType: "Pump Control", pvUnit: "-", rangeLow: "0", rangeHigh: "1", typicalSp: null, alarmHH: null, alarmH: null, alarmL: null, alarmLL: null, controlMode: "Auto/Man", controllerOutputTo: "HS-1004B", setpointSource: "Operator", cascadeMaster: "None", failPosition: "-", interlocksPermissives: "Standby sulfur feed pump", keyNarrativeSummary: "Standby sulfur feed pump", onHold: "No", page: 63 },
        { tagName: "1510-A-1021", description: "SULFUR UNLOADING PIT SO2 MONITOR", area: "Sulfur Handling", loopType: "Analyzer", pvUnit: "ppm", rangeLow: "0", rangeHigh: "100", typicalSp: "Operator", alarmHH: "80", alarmH: "60", alarmL: null, alarmLL: null, controlMode: "Indication", controllerOutputTo: "AIC-1021", setpointSource: "None", cascadeMaster: "None", failPosition: "None", interlocksPermissives: "SO2 concentration monitor with alarms", keyNarrativeSummary: null, onHold: "No", page: 64 },
        { tagName: "1510-T-1020", description: "SULFUR PIT VENT TO VAPOR SCRUBBER TEMPERATURE", area: "Sulfur Handling", loopType: "Temperature", pvUnit: "°C", rangeLow: "-20", rangeHigh: "100", typicalSp: "Ambient", alarmHH: "90", alarmH: "80", alarmL: null, alarmLL: null, controlMode: "Indication", controllerOutputTo: "TIC-1020", setpointSource: "None", cascadeMaster: "None", failPosition: "None", interlocksPermissives: "Vent temperature indication", keyNarrativeSummary: null, onHold: "No", page: 65 },
        { tagName: "1510-T-1008", description: "SULFUR UNLOADING PIT TEMPERATURE", area: "Sulfur Handling", loopType: "Temperature", pvUnit: "°C", rangeLow: "100", rangeHigh: "150", typicalSp: "135", alarmHH: "145", alarmH: "140", alarmL: "120", alarmLL: "115", controlMode: "Indication", controllerOutputTo: "TIC-1008", setpointSource: "None", cascadeMaster: "None", failPosition: "None", interlocksPermissives: "Pit temperature with high/low alarms", keyNarrativeSummary: null, onHold: "No", page: 66 },
        { tagName: "1510-L-1007", description: "SULFUR UNLOADING PIT LEVEL", area: "Sulfur Handling", loopType: "Level", pvUnit: "%", rangeLow: "0", rangeHigh: "100", typicalSp: "50", alarmHH: "90", alarmH: "80", alarmL: "20", alarmLL: "10", controlMode: "Auto", controllerOutputTo: "LIC-1007 to pump start", setpointSource: "Operator", cascadeMaster: "None", failPosition: "Fail Close", interlocksPermissives: "Level control triggers pump auto-start", keyNarrativeSummary: null, onHold: "No", page: 67 },
        { tagName: "1510-A-1019", description: "SULFUR UNLOADING PIT H2S AREA MONITOR", area: "Sulfur Handling", loopType: "Analyzer", pvUnit: "ppm", rangeLow: "0", rangeHigh: "50", typicalSp: "Operator", alarmHH: "40", alarmH: "30", alarmL: null, alarmLL: null, controlMode: "Indication", controllerOutputTo: "AIC-1019", setpointSource: "None", cascadeMaster: "None", failPosition: "None", interlocksPermissives: "H2S area monitor with evacuation alarm", keyNarrativeSummary: null, onHold: "No", page: 69 },
        { tagName: "1510-A-1012", description: "SULFUR UNLOADING PIT H2S AREA MONITOR", area: "Sulfur Handling", loopType: "Analyzer", pvUnit: "ppm", rangeLow: "0", rangeHigh: "50", typicalSp: "Operator", alarmHH: "40", alarmH: "30", alarmL: null, alarmLL: null, controlMode: "Indication", controllerOutputTo: "AIC-1012", setpointSource: "None", cascadeMaster: "None", failPosition: "None", interlocksPermissives: "Redundant H2S area monitor", keyNarrativeSummary: null, onHold: "No", page: 70 },
        { tagName: "1510-P-1013", description: "STRAINER DIFFERENTIAL PRESS ON SULFUR FEED PUMPS LINE", area: "Sulfur Handling", loopType: "Pressure", pvUnit: "kPa", rangeLow: "0", rangeHigh: "50", typicalSp: "10", alarmHH: "40", alarmH: "30", alarmL: null, alarmLL: null, controlMode: "Indication", controllerOutputTo: "PIC-1013", setpointSource: "None", cascadeMaster: "None", failPosition: "None", interlocksPermissives: "Strainer DP alarm for maintenance", keyNarrativeSummary: null, onHold: "No", page: 71 },
        { tagName: "1510-X-1118A", description: "SULFUR UNLOADING AREA HIGH LEVEL ALARM", area: "Sulfur Handling", loopType: "Digital Input", pvUnit: "-", rangeLow: "0", rangeHigh: "1", typicalSp: null, alarmHH: null, alarmH: null, alarmL: null, alarmLL: null, controlMode: "None", controllerOutputTo: "None", setpointSource: "None", cascadeMaster: "None", failPosition: "None", interlocksPermissives: "High level alarm from float switch", keyNarrativeSummary: null, onHold: "No", page: 72 },
        { tagName: "1510-X-1100", description: "SULFUR UNLOADING TRUCK GROUND SWITCH", area: "Sulfur Handling", loopType: "Digital Input", pvUnit: "-", rangeLow: "0", rangeHigh: "1", typicalSp: null, alarmHH: null, alarmH: null, alarmL: null, alarmLL: null, controlMode: "None", controllerOutputTo: "None", setpointSource: "None", cascadeMaster: "None", failPosition: "None", interlocksPermissives: "Interlock for truck unloading - must be grounded", keyNarrativeSummary: null, onHold: "No", page: 73 },
        { tagName: "1510-X-1101", description: "SULFUR UNLOADING TRUCK GROUND SWITCH", area: "Sulfur Handling", loopType: "Digital Input", pvUnit: "-", rangeLow: "0", rangeHigh: "1", typicalSp: null, alarmHH: null, alarmH: null, alarmL: null, alarmLL: null, controlMode: "None", controllerOutputTo: "None", setpointSource: "None", cascadeMaster: "None", failPosition: "None", interlocksPermissives: "Redundant ground switch interlock", keyNarrativeSummary: null, onHold: "No", page: 74 },
        // Sulfur Storage (Pages 75-78)
        { tagName: "1510-L-1201", description: "LIQUID SULFUR STORAGE TANK LEVEL", area: "Sulfur Storage", loopType: "Level", pvUnit: "m", rangeLow: "0", rangeHigh: "15", typicalSp: "8", alarmHH: "14", alarmH: "12", alarmL: "2", alarmLL: "1", controlMode: "Indication", controllerOutputTo: "LIC-1201", setpointSource: "None", cascadeMaster: "None", failPosition: "None", interlocksPermissives: "Storage tank level with overfill protection", keyNarrativeSummary: null, onHold: "No", page: 75 },
        { tagName: "1510-L-1202", description: "LIQUID SULFUR STORAGE TANK LEVEL", area: "Sulfur Storage", loopType: "Level", pvUnit: "m", rangeLow: "0", rangeHigh: "15", typicalSp: "8", alarmHH: "14", alarmH: "12", alarmL: "2", alarmLL: "1", controlMode: "Indication", controllerOutputTo: "LIC-1202", setpointSource: "None", cascadeMaster: "None", failPosition: "None", interlocksPermissives: "Redundant level transmitter", keyNarrativeSummary: null, onHold: "No", page: 76 },
        { tagName: "1510-T-1205", description: "SULFUR STORAGE TANK VENT TEMPERATURE", area: "Sulfur Storage", loopType: "Temperature", pvUnit: "°C", rangeLow: "120", rangeHigh: "160", typicalSp: "135", alarmHH: "150", alarmH: "145", alarmL: "125", alarmLL: "120", controlMode: "Indication", controllerOutputTo: "TIC-1205", setpointSource: "None", cascadeMaster: "None", failPosition: "None", interlocksPermissives: "Vent temp for sulfur vaporization alarm", keyNarrativeSummary: null, onHold: "No", page: 77 },
        { tagName: "1510-A-1206", description: "LIQUID SULFUR STORAGE TANK SO2", area: "Sulfur Storage", loopType: "Analyzer", pvUnit: "ppm", rangeLow: "0", rangeHigh: "100", typicalSp: "Operator", alarmHH: "80", alarmH: "60", alarmL: null, alarmLL: null, controlMode: "Indication", controllerOutputTo: "AIC-1206", setpointSource: "None", cascadeMaster: "None", failPosition: "None", interlocksPermissives: "SO2 in headspace monitor", keyNarrativeSummary: null, onHold: "No", page: 78 },
        { tagName: "1510-A-1502", description: "SULFUR VAPOR SCRUBBER INLET", area: "Sulfur Handling", loopType: "Analyzer", pvUnit: "%", rangeLow: "0", rangeHigh: "100", typicalSp: "98", alarmHH: "99.5", alarmH: "99", alarmL: "97.5", alarmLL: "97", controlMode: "Indication", controllerOutputTo: "AIC-1502", setpointSource: "None", cascadeMaster: "None", failPosition: "None", interlocksPermissives: "Scrubber inlet gas composition", keyNarrativeSummary: null, onHold: "No", page: 79 },
      ];

      const createdTags = await storage.createManyProcessTags(tags);
      res.status(201).json({ message: `Successfully seeded ${createdTags.length} process tags`, count: createdTags.length });
    } catch (error) {
      console.error("Error seeding process tags:", error);
      res.status(500).json({ message: "Failed to seed process tags" });
    }
  });

  app.post('/api/chat', async (req: Request, res: Response) => {
    try {
      const { message } = req.body;

      if (!message || typeof message !== 'string') {
        return res.status(400).json({ message: "Message is required" });
      }

      const openai = new OpenAI({
        apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
        baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
      });

      const systemPrompt = `You are an AI assistant for Lithium Americas' Operator Training Simulator (OTS) system. You help users understand:

CONFIDENTIAL INFORMATION (Internal Site Knowledge):
- Static Simulation Demo: Interactive heat and material balance calculator for sulfur burning process
- Dynamic Simulation Demo: Real-time PID controller system with dual controls and temperature alarm interlocks
- 11 Training Experiences: Static Sim, Dynamic Sim, Profit Maximizer, ESD Trainer, OTS Learning Hub, Daily Operations Playbook, Maintenance Mastery, Capital Projects Accelerator, Safety First Academy, Document Vault, Technology Deep Dive
- Process Details: Sulfur burning section with compressor control (0-6000 RPM) and sulfur flow (0-150 GPM)
- Outputs: Electrical Power (MW), SO₂%, Furnace Outlet Temperature, Acid Production (metric ton/day)
- Safety Features: Two-level temperature alarm system with automated safety interlocks
- Authentication: Username/password system for full access

PUBLIC DOMAIN INFORMATION:
You can also answer general questions about:
- Sulfuric acid production processes
- Process engineering and operator training
- Industrial safety and emergency shutdown systems
- PID controllers and process control systems

Be professional, concise, and helpful. If asked about features not yet implemented, mention they are "Coming Soon".`;

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: message }
        ],
        temperature: 0.7,
        max_tokens: 500,
      });

      const reply = completion.choices[0]?.message?.content || "I'm sorry, I couldn't generate a response.";

      res.json({ reply });
    } catch (error) {
      console.error("Chat error:", error);
      res.status(500).json({ message: "Failed to process chat message" });
    }
  });

  // Monte Carlo Simulation endpoint
  app.post('/api/monte-carlo', async (req: Request, res: Response) => {
    try {
      const {
        sulfurFlow,
        blowerRPM,
        pass1Temp,
        pass2Temp,
        pass3Temp,
        pass4Temp,
        numberOfSamples,
        priceType,
        productionType,
        commodities
      } = req.body;

      // Validate required fields
      if (!sulfurFlow || !blowerRPM || !numberOfSamples || !commodities || !Array.isArray(commodities)) {
        return res.status(400).json({ message: "Missing or invalid required parameters" });
      }

      // Validate and parse sample count
      const samples = parseInt(numberOfSamples);
      if (isNaN(samples) || samples <= 0 || samples > 100000) {
        return res.status(400).json({ message: "Number of samples must be between 1 and 100,000" });
      }

      // Validate process input ranges
      const validateRange = (range: any, name: string) => {
        if (!range || typeof range !== 'object') {
          return `Invalid ${name} range`;
        }
        const min = parseFloat(range.min);
        const max = parseFloat(range.max);
        if (isNaN(min) || isNaN(max) || min >= max) {
          return `Invalid ${name} range values`;
        }
        return null;
      };

      const rangeErrors = [
        validateRange(sulfurFlow, "sulfur flow"),
        validateRange(blowerRPM, "blower RPM"),
        validateRange(pass1Temp, "pass 1 temp"),
        validateRange(pass2Temp, "pass 2 temp"),
        validateRange(pass3Temp, "pass 3 temp"),
        validateRange(pass4Temp, "pass 4 temp"),
      ].filter(Boolean);

      if (rangeErrors.length > 0) {
        return res.status(400).json({ message: rangeErrors[0] });
      }

      // Validate commodities
      if (commodities.length < 4) {
        return res.status(400).json({ message: "At least 4 commodity prices required" });
      }

      for (const commodity of commodities) {
        const min = parseFloat(commodity.rangeMin);
        const max = parseFloat(commodity.rangeMax);
        if (isNaN(min) || isNaN(max) || min < 0 || max < min) {
          return res.status(400).json({ message: `Invalid commodity price range for ${commodity.name}` });
        }
      }

      // Helper function to generate random value with distribution
      const generateRandom = (min: number, max: number, distribution: string): number => {
        const random = Math.random();
        const range = max - min;

        if (distribution === "Left-Skew") {
          // Left skew: more values toward lower end
          return min + range * Math.pow(random, 2);
        } else if (distribution === "Right-Skew") {
          // Right skew: more values toward upper end
          return min + range * (1 - Math.pow(1 - random, 2));
        } else {
          // Normal distribution approximation (Box-Muller transform simplified)
          const u1 = Math.random();
          const u2 = Math.random();
          const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
          // Map to 0-1 range with mean at 0.5
          const normalized = 0.5 + z0 * 0.15;
          return min + range * Math.max(0, Math.min(1, normalized));
        }
      };

      // Run Monte Carlo simulation
      const profits: number[] = [];
      const acidProductions: number[] = [];
      const powerGenerations: number[] = [];

      for (let i = 0; i < samples; i++) {
        // Sample process inputs
        const sulfurFlowSample = generateRandom(parseFloat(sulfurFlow.min), parseFloat(sulfurFlow.max), "Normal");
        const blowerRPMSample = generateRandom(parseFloat(blowerRPM.min), parseFloat(blowerRPM.max), "Normal");

        // Calculate acid production (simplified model based on sulfur flow)
        const acidProduction = sulfurFlowSample * 2.5; // STPD
        acidProductions.push(acidProduction);

        // Calculate power generation (simplified model based on blower RPM)
        const powerGen = (blowerRPMSample / 1000) * 1.2; // MWh/Day
        powerGenerations.push(powerGen);

        // Calculate revenues
        const sulfuricPrice = generateRandom(
          parseFloat(commodities[0].rangeMin),
          parseFloat(commodities[0].rangeMax),
          commodities[0].distribution
        );
        const powerPrice = generateRandom(
          parseFloat(commodities[2].rangeMin),
          parseFloat(commodities[2].rangeMax),
          commodities[2].distribution
        );

        const acidRevenue = acidProduction * sulfuricPrice;
        const powerRevenue = powerGen * powerPrice;

        // Calculate costs
        const sulfurPrice = generateRandom(
          parseFloat(commodities[1].rangeMin),
          parseFloat(commodities[1].rangeMax),
          commodities[1].distribution
        );
        const causticPrice = generateRandom(
          parseFloat(commodities[3].rangeMin),
          parseFloat(commodities[3].rangeMax),
          commodities[3].distribution
        );

        const sulfurCost = sulfurFlowSample * 0.95 * sulfurPrice;
        const parasiticPowerCost = powerGen * 0.15 * powerPrice;
        const causticCost = acidProduction * 0.02 * causticPrice;
        const lpSteamCost = 50;
        const makeupWaterCost = 20;
        const effluentCost = 15;

        const totalCosts = sulfurCost + parasiticPowerCost + causticCost + lpSteamCost + makeupWaterCost + effluentCost;
        const profit = acidRevenue + powerRevenue - totalCosts;
        profits.push(profit);
      }

      // Calculate statistics
      const calculateStats = (data: number[]) => {
        const sorted = [...data].sort((a, b) => a - b);
        const mean = data.reduce((a, b) => a + b, 0) / data.length;
        const variance = data.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / data.length;
        const stdDev = Math.sqrt(variance);
        const conf5Index = Math.floor(data.length * 0.05);
        const conf95Index = Math.floor(data.length * 0.95);

        return {
          mean,
          stdDev,
          conf5: sorted[conf5Index],
          conf95: sorted[conf95Index],
        };
      };

      const profitStats = calculateStats(profits);
      const acidProdStats = calculateStats(acidProductions);
      const powerGenStats = calculateStats(powerGenerations);

      // Generate profit distribution histogram data
      const bins = 50;
      const minProfit = Math.min(...profits);
      const maxProfit = Math.max(...profits);
      const binWidth = (maxProfit - minProfit) / bins;

      let distributionData: { x: number; y: number }[] = [];

      // Guard against zero-width ranges
      if (binWidth > 0) {
        const histogram = Array(bins).fill(0);

        profits.forEach(profit => {
          const binIndex = Math.min(Math.floor((profit - minProfit) / binWidth), bins - 1);
          histogram[binIndex]++;
        });

        distributionData = histogram.map((count, index) => ({
          x: minProfit + (index + 0.5) * binWidth,
          y: count
        }));
      } else {
        // All values are the same - return single bin
        distributionData = [{ x: minProfit, y: profits.length }];
      }

      res.json({
        numberOfSamples: samples,
        profit: {
          mean: profitStats.mean,
          stdDev: profitStats.stdDev,
          conf5: profitStats.conf5,
          conf95: profitStats.conf95,
          distribution: distributionData
        },
        acidProduction: {
          mean: acidProdStats.mean,
          stdDev: acidProdStats.stdDev,
          conf5: acidProdStats.conf5,
          conf95: acidProdStats.conf95
        },
        powerGeneration: {
          mean: powerGenStats.mean,
          stdDev: powerGenStats.stdDev,
          conf5: powerGenStats.conf5,
          conf95: powerGenStats.conf95
        }
      });
    } catch (error) {
      console.error("Monte Carlo simulation error:", error);
      res.status(500).json({ message: "Failed to run Monte Carlo simulation" });
    }
  });

  // ===== HELPER: Call Python RK4 Solver =====
  async function runPythonRK4Simulation(inputData: any): Promise<any> {
    return new Promise((resolve, reject) => {
      const pythonScriptPath = path.join(process.cwd(), 'server', 'python', 'main.py');
      const pythonProcess = spawn('python3', [pythonScriptPath], {
        cwd: path.join(process.cwd(), 'server', 'python'),
      });

      let stdout = '';
      let stderr = '';

      pythonProcess.stdin.write(JSON.stringify(inputData));
      pythonProcess.stdin.end();

      pythonProcess.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      pythonProcess.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      pythonProcess.on('close', (code) => {
        if (code !== 0) {
          console.error('Python RK4 solver error:', stderr);
          reject(new Error(`Python process exited with code ${code}: ${stderr}`));
          return;
        }

        try {
          const result = JSON.parse(stdout);
          resolve(result);
        } catch (parseError) {
          console.error('Failed to parse Python output:', stdout);
          reject(new Error('Failed to parse simulation results'));
        }
      });

      pythonProcess.on('error', (err) => {
        console.error('Failed to start Python process:', err);
        reject(err);
      });
    });
  }

  // Catalytic Reactor Simulation endpoint
  app.post('/api/catalytic-reactor-simulation', async (req: Request, res: Response) => {
    try {
      const { gasComposition, processInputs, catalystConfig, sessionId } = req.body;

      // Validate required fields
      if (!gasComposition || !processInputs || !catalystConfig) {
        return res.status(400).json({ message: "Missing required simulation parameters" });
      }

      // Extract gas composition data
      const {
        so2Percent = 0,
        so3Percent = 0,
        o2Percent = 0,
        co2Percent = 0,
        n2Percent = 0,
        pBarr = 0,
        ipatSo3Removal = 0
      } = gasComposition;

      // Extract process inputs
      const {
        plantRate = 0,
        pass1InletVelocity = 0,
        converterDiameter = 42.0,
        pass1InletTemp = 0,
        pass2InletTemp = 0,
        pass3InletTemp = 0,
        pass4InletTemp = 0,
        pass1InletPres = 0,
        pass2InletPres = 0,
        pass3InletPres = 0,
        pass4InletPres = 0
      } = processInputs;

      // ===== Call Python RK4 Solver for accurate kinetics =====
      const pythonInput = {
        pass1Type1: catalystConfig.pass1Type1 || "MECS GR330",
        pass1Liters1: parseFloat(catalystConfig.pass1Liters1) || 12.0,
        pass1Activity1: parseFloat(catalystConfig.pass1Activity1) || 100.0,
        pass1Type2: catalystConfig.pass1Type2 || "MECS GR330",
        pass1Liters2: parseFloat(catalystConfig.pass1Liters2) || 24.0,
        pass1Activity2: parseFloat(catalystConfig.pass1Activity2) || 100.0,
        pass2Type1: catalystConfig.pass2Type1 || "MECS Super Gear XLP-310",
        pass2Liters1: parseFloat(catalystConfig.pass2Liters1) || 40.0,
        pass2Activity1: parseFloat(catalystConfig.pass2Activity1) || 100.0,
        pass3Type1: catalystConfig.pass3Type1 || "MECS Super Gear XLP-310",
        pass3Liters1: parseFloat(catalystConfig.pass3Liters1) || 45.0,
        pass3Activity1: parseFloat(catalystConfig.pass3Activity1) || 100.0,
        pass4Type1: catalystConfig.pass4Type1 || "MECS Super Gear XLP-310",
        pass4Liters1: parseFloat(catalystConfig.pass4Liters1) || 25.0,
        pass4Activity1: parseFloat(catalystConfig.pass4Activity1) || 100.0,
        pass4Type2: catalystConfig.pass4Type2 || "MECS GR330",
        pass4Liters2: parseFloat(catalystConfig.pass4Liters2) || 40.0,
        pass4Activity2: parseFloat(catalystConfig.pass4Activity2) || 100.0,
        so2Percent: so2Percent,
        so3Percent: so3Percent,
        o2Percent: o2Percent,
        co2Percent: co2Percent,
        n2Percent: n2Percent,
        pBarr: pBarr,
        ipatSo3Removal: ipatSo3Removal,
        plantRate: plantRate,
        pass1InletVelocity: pass1InletVelocity,
        converterDiameter: 42.0,
        pass1InletTemp: pass1InletTemp,
        pass2InletTemp: pass2InletTemp,
        pass3InletTemp: pass3InletTemp,
        pass4InletTemp: pass4InletTemp,
        pass1InletPres: pass1InletPres,
        pass2InletPres: pass2InletPres,
        pass3InletPres: pass3InletPres,
        pass4InletPres: pass4InletPres,
      };

      let pythonResults: any = null;
      try {
        pythonResults = await runPythonRK4Simulation(pythonInput);
        console.log('Python RK4 simulation completed successfully');
      } catch (err) {
        console.error('Python RK4 simulation failed, falling back to simplified model:', err);
      }

      // Extract catalyst loading ratios (L/STPD) from catalystConfig
      // Pass 1 Type 2 defaults to 0 (single layer unless explicitly enabled)
      // Pass 4 Type 2 defaults to 40 (dual layer is typical for Pass 4)
      const catalystRatios = [
        parseFloat(catalystConfig.pass1Liters1) || 35.0,
        parseFloat(catalystConfig.pass1Liters2) || 0,  // Pass 1 is single layer by default
        parseFloat(catalystConfig.pass2Liters1) || 40.0,
        0, // Pass 2 Type B (not used in current config)
        parseFloat(catalystConfig.pass3Liters1) || 45.0,
        0, // Pass 3 Type B (not used in current config)
        parseFloat(catalystConfig.pass4Liters1) || 35.0,
        parseFloat(catalystConfig.pass4Liters2) || 40.0  // Pass 4 is dual layer
      ];

      // Calculate catalyst loading matrix using the converted TypeScript function
      const calculateCatalystLoading = (plantRateSTPD: number, ratios: number[]) => {
        if (ratios.length !== 8) throw new Error("Exactly 8 ratios required");

        const matrix = Array(4).fill(null).map(() => [0, 0, 0]);

        for (let passIdx = 0; passIdx < 4; passIdx++) {
          matrix[passIdx][0] = ratios[passIdx * 2] || 0;
          matrix[passIdx][1] = ratios[passIdx * 2 + 1] || 0;
          matrix[passIdx][2] = matrix[passIdx][0] + matrix[passIdx][1];
        }

        const litersMatrix = matrix.map(row =>
          row.map(val => Math.round(val * plantRateSTPD * 10) / 10)
        );

        const totalA = litersMatrix.reduce((sum, row) => sum + row[0], 0);
        const totalB = litersMatrix.reduce((sum, row) => sum + row[1], 0);
        const grandTotal = totalA + totalB;

        const resultMatrix = [...litersMatrix, [totalA, totalB, grandTotal]];

        return {
          matrix: resultMatrix,
          totalLiters: grandTotal,
          totalRatio: Number(ratios.reduce((a, b) => a + b, 0).toFixed(3))
        };
      };

      const catalystLoadingResult = calculateCatalystLoading(plantRate, catalystRatios);

      // ===== Extract pass results from Python RK4 solver =====
      // segmentResults has 6 segments: Pass1-L1, Pass1-L2, Pass2, Pass3, Pass4-L1, Pass4-L2
      // Map them to pass-level results
      interface SegmentResult {
        name: string;
        Tin_C: number;
        Tout_C: number;
        Xin_pct: number;
        Xout_pct: number;
        z: number[];
        T_C: number[];
        X_pct: number[];
        Xeq_pct: number[];
      }

      // Build pass results from segment results
      const getPassResults = (segmentResults: SegmentResult[]) => {
        // Pass 1: segments 0 (L1) + 1 (L2)
        const pass1L1 = segmentResults.find(s => s.name === 'Pass1-L1');
        const pass1L2 = segmentResults.find(s => s.name === 'Pass1-L2');
        const pass2 = segmentResults.find(s => s.name === 'Pass2');
        const pass3 = segmentResults.find(s => s.name === 'Pass3');
        const pass4L1 = segmentResults.find(s => s.name === 'Pass4-L1');
        const pass4L2 = segmentResults.find(s => s.name === 'Pass4-L2');

        return {
          pass1: {
            inletTemp: pass1L1?.Tin_C || pass1InletTemp,
            outletTemp: pass1L2?.Tout_C || (pass1L1?.Tout_C || pass1InletTemp + 100),
            inletConversion: 0,
            outletConversion: pass1L2?.Xout_pct || (pass1L1?.Xout_pct || 65),
            T_profile: [...(pass1L1?.T_C || []), ...(pass1L2?.T_C || [])],
            X_profile: [...(pass1L1?.X_pct || []), ...(pass1L2?.X_pct || [])],
          },
          pass2: {
            inletTemp: pass2?.Tin_C || pass2InletTemp,
            outletTemp: pass2?.Tout_C || pass2InletTemp + 50,
            inletConversion: pass1L2?.Xout_pct || 65,
            outletConversion: pass2?.Xout_pct || 85,
            T_profile: pass2?.T_C || [],
            X_profile: pass2?.X_pct || [],
          },
          pass3: {
            inletTemp: pass3?.Tin_C || pass3InletTemp,
            outletTemp: pass3?.Tout_C || pass3InletTemp + 30,
            inletConversion: pass2?.Xout_pct || 85,
            outletConversion: pass3?.Xout_pct || 95,
            T_profile: pass3?.T_C || [],
            X_profile: pass3?.X_pct || [],
          },
          pass4: {
            inletTemp: pass4L1?.Tin_C || pass4InletTemp,
            outletTemp: pass4L2?.Tout_C || (pass4L1?.Tout_C || pass4InletTemp + 20),
            inletConversion: pass3?.Xout_pct || 95,
            outletConversion: pass4L2?.Xout_pct || (pass4L1?.Xout_pct || 99.5),
            T_profile: [...(pass4L1?.T_C || []), ...(pass4L2?.T_C || [])],
            X_profile: [...(pass4L1?.X_pct || []), ...(pass4L2?.X_pct || [])],
          }
        };
      };

      const passResults = pythonResults?.segmentResults
        ? getPassResults(pythonResults.segmentResults)
        : null;

      // Pass configuration - ensure all values are numbers
      const passes = [
        { temp: pass1InletTemp, activity: parseFloat(catalystConfig.pass1Activity1) || 100, volume: parseFloat(catalystConfig.pass1Liters1) || 35 },
        { temp: pass2InletTemp, activity: parseFloat(catalystConfig.pass2Activity1) || 100, volume: parseFloat(catalystConfig.pass2Liters1) || 40 },
        { temp: pass3InletTemp, activity: parseFloat(catalystConfig.pass3Activity1) || 100, volume: parseFloat(catalystConfig.pass3Liters1) || 45 },
        { temp: pass4InletTemp, activity: parseFloat(catalystConfig.pass4Activity1) || 100, volume: parseFloat(catalystConfig.pass4Liters1) || 50 }
      ];

      // Use Python RK4 results for pass conversions if available
      const passConversions: any = {};
      let overallConversion = 0;

      if (passResults) {
        // Use accurate Python RK4 results
        const passKeys = ['pass1', 'pass2', 'pass3', 'pass4'] as const;
        passKeys.forEach((key, index) => {
          const passNumber = index + 1;
          const pr = passResults[key];
          passConversions[`pass${passNumber}`] = {
            conversion: (pr.outletConversion - pr.inletConversion).toFixed(2),
            overall: pr.outletConversion.toFixed(2),
            equilibrium: "99.80" // Placeholder, could be extracted from Python
          };
        });
        overallConversion = passResults.pass4.outletConversion;
      } else {
        // Fallback to simplified heuristic model
        let currentSO2 = so2Percent;
        passes.forEach((pass, index) => {
          const passNumber = index + 1;
          // Simplified conversion model
          const equilibrium = Math.min(99.8, 65 + (pass.temp - 380) * 0.15);
          const baseConversion = equilibrium * (pass.activity / 100) * 0.85;
          const passFactors = [1.0, 0.92, 0.88, 0.75];
          const conversion = Math.min(equilibrium, baseConversion * passFactors[passNumber - 1]);

          const so2Converted = currentSO2 * (conversion / 100);
          currentSO2 -= so2Converted;
          overallConversion = ((so2Percent - currentSO2) / so2Percent) * 100;

          passConversions[`pass${passNumber}`] = {
            conversion: conversion.toFixed(2),
            overall: overallConversion.toFixed(2),
            equilibrium: equilibrium.toFixed(2)
          };
        });
      }

      // Calculate converter diameter using proper flow calculations
      // First, calculate gas flow in Nm³/h from plant rate
      const gasFlowNm3h = calculateGasFlowFromPlantRate(plantRate, so2Percent);

      // Calculate reactor flow and diameter
      const reactorFlowResult = calculateReactorFlow({
        gasFlowNm3h,
        temperatureC: pass1InletTemp,
        pressureInWC: pass1InletPres,
        pBarometricAtm: pBarr,
        targetVelocityFPM: pass1InletVelocity
      });

      const converterDiameterFt = reactorFlowResult.reactorDiameterFt || 0;
      const converterDiameterM = reactorFlowResult.reactorDiameterM || 0;

      // Calculate pressure drops (simplified Ergun equation approximation)
      const calculatePressureDrop = (velocity: number, volume: number, inletPres: number): { inWC: number; mmWC: number } => {
        const dpInWC = (velocity / 100) * (volume / 40) * 1.5;
        const dpMmWC = dpInWC * 25.4;
        return {
          inWC: parseFloat(dpInWC.toFixed(2)),
          mmWC: parseFloat(dpMmWC.toFixed(1))
        };
      };

      const pressureDrops: any = {};
      passes.forEach((pass, index) => {
        const passNumber = index + 1;
        const velocity = pass1InletVelocity * (1 - index * 0.05); // Velocity decreases slightly each pass
        pressureDrops[`pass${passNumber}`] = calculatePressureDrop(velocity, pass.volume, [pass1InletPres, pass2InletPres, pass3InletPres, pass4InletPres][index]);
      });

      // Calculate volumes (catalyst loading already provided)
      const volumes: any = {};
      let totalVolume = 0;
      passes.forEach((pass, index) => {
        const passNumber = index + 1;
        volumes[`pass${passNumber}`] = pass.volume.toFixed(1);
        totalVolume += pass.volume;
      });
      volumes.total = totalVolume.toFixed(1);

      // Calculate bed depth profiles for each pass (0%, 25%, 50%, 75%, 100%)
      const bedDepthPercentages = [0, 25, 50, 75, 100];
      const passInletTemps = [pass1InletTemp, pass2InletTemp, pass3InletTemp, pass4InletTemp];
      const passInletPresArr = [pass1InletPres, pass2InletPres, pass3InletPres, pass4InletPres];

      // Calculate bed depth using proper geometry: Depth = Volume / (π/4 × Diameter²)
      // Volume in liters, diameter in feet. 1 liter = 0.0353147 cubic feet
      const estimateBedDepthFt = (volumeLiters: number, diameterFt: number): number => {
        const volumeFt3 = volumeLiters * 0.0353147;  // Convert liters to cubic feet
        const crossSectionFt2 = (Math.PI / 4) * diameterFt * diameterFt;  // π/4 × D²
        return volumeFt3 / crossSectionFt2;  // Depth = Volume / Cross-sectional Area
      };

      // Extract inlet compositions from Python RK4 results (which now include IPAT SO3 removal)
      interface ExtendedSegmentResult extends SegmentResult {
        y_inlet?: { SO2: number; SO3: number; O2: number; N2: number; CO2: number };
        ipat_data?: { applied_after_pass: number; so3_removal_pct: number; y_before: any; y_after: any };
      }

      const getPassInletComposition = (passNumber: number, segmentResults: ExtendedSegmentResult[] | null): { so2: number; o2: number } | null => {
        if (!segmentResults) return null;

        // Map pass number to first segment of that pass
        const segmentNames: Record<number, string> = { 1: 'Pass1-L1', 2: 'Pass2', 3: 'Pass3', 4: 'Pass4-L1' };
        const segName = segmentNames[passNumber];
        const seg = segmentResults.find(s => s.name === segName);

        if (seg?.y_inlet) {
          // Convert from mole fraction to percent
          return {
            so2: seg.y_inlet.SO2 * 100,
            o2: seg.y_inlet.O2 * 100
          };
        }
        return null;
      };

      // Calculate profiles for each pass using Python RK4 results when available
      const passProfiles: any = {};
      let passInletSO2 = so2Percent;
      let passInletO2 = o2Percent || 11.0;

      const passKeys = ['pass1', 'pass2', 'pass3', 'pass4'] as const;

      // Get actual catalyst volumes in liters from the loading matrix (not the L/STPD ratios)
      const passVolumesLiters = [
        catalystLoadingResult.matrix[0][2],  // Pass 1 total liters
        catalystLoadingResult.matrix[1][2],  // Pass 2 total liters
        catalystLoadingResult.matrix[2][2],  // Pass 3 total liters
        catalystLoadingResult.matrix[3][2],  // Pass 4 total liters
      ];

      passes.forEach((pass, index) => {
        const passNumber = index + 1;
        const passKey = passKeys[index];
        const inletTemp = passInletTemps[index];
        const inletPres = passInletPresArr[index];
        const baseVelocity = pass1InletVelocity * (1 - index * 0.05);
        // Use actual catalyst volume in liters from matrix, not L/STPD ratio
        const passVolumeLiters = passVolumesLiters[index];
        const bedTotalDepthFt = estimateBedDepthFt(passVolumeLiters, converterDiameter);

        // Get temperature and conversion data from Python RK4 results if available
        const pythonPass = passResults ? passResults[passKey] : null;
        const hasRK4Data = pythonPass && pythonPass.T_profile && pythonPass.T_profile.length > 0;

        // Get pass-level conversion from passConversions
        const passConv = parseFloat(passConversions[`pass${passNumber}`]?.conversion || "50");

        // Get inlet composition from Python RK4 results (includes IPAT SO3 removal)
        const rk4InletComp = getPassInletComposition(passNumber, pythonResults?.segmentResults as ExtendedSegmentResult[] || null);
        if (rk4InletComp) {
          // Use Python RK4 inlet composition (includes IPAT adjustment for Pass 4)
          passInletSO2 = rk4InletComp.so2;
          passInletO2 = rk4InletComp.o2;
        }

        const profileData: any[] = [];

        bedDepthPercentages.forEach((depthPercent, depthIdx) => {
          const fraction = depthPercent / 100;

          let temperature: number;
          let overallConvAtPoint: number;
          let bedConversion: number;

          if (hasRK4Data) {
            // Use Python RK4 profile data - interpolate at the depth percentage
            const profileLen = pythonPass.T_profile.length;
            const profileIdx = Math.min(Math.floor(fraction * (profileLen - 1)), profileLen - 1);

            temperature = pythonPass.T_profile[profileIdx];

            // X_profile is already in percentage (overall conversion)
            overallConvAtPoint = pythonPass.X_profile[profileIdx];

            // Per-pass bed conversion = what fraction of SO2 entering this pass was converted
            // Formula: (overall_at_point - inlet_overall) / (1 - inlet_overall/100) * 100
            const inletConv = pythonPass.inletConversion;
            if (inletConv >= 100) {
              bedConversion = 0; // No SO2 left to convert
            } else {
              bedConversion = ((overallConvAtPoint - inletConv) / (100 - inletConv)) * 100;
              // Clamp to [0, 100] to handle floating-point noise
              bedConversion = Math.max(0, Math.min(100, bedConversion));
            }
          } else {
            // Fallback: sigmoidal profile with simplified temp rise
            const conversionFraction = fraction === 0 ? 0 : (1 - Math.exp(-3 * fraction)) / (1 - Math.exp(-3));
            bedConversion = passConv * conversionFraction;

            // Use proper adiabatic temperature rise formula: ~200-230°C for ~70% conversion in Pass 1
            // ΔT = (−ΔHrxn × ySO2_inlet × ΔX) / Cp_mix
            // Approximate: ~3°C per 1% conversion for typical converter gas
            const tempRisePerPercent = 3.0;
            const tempRise = bedConversion * tempRisePerPercent;
            temperature = inletTemp + tempRise;

            // Overall conversion at this point
            const so2ConvertedInBed = passInletSO2 * (bedConversion / 100);
            const so2AtPoint = passInletSO2 - so2ConvertedInBed;
            overallConvAtPoint = ((so2Percent - so2AtPoint) / so2Percent) * 100;
          }

          // Calculate other properties using the correct inlet values (with IPAT adjustment)
          const so2ConvertedInBed = passInletSO2 * (bedConversion / 100);
          const so2AtPoint = passInletSO2 - so2ConvertedInBed;
          const o2Consumed = so2ConvertedInBed * 0.5;
          const o2AtPoint = Math.max(0, passInletO2 - o2Consumed);

          const pressureDropTotal = pressureDrops[`pass${passNumber}`]?.inWC || 1.0;
          const pressureAtPoint = inletPres - (pressureDropTotal * fraction);
          const bedDepthFt = bedTotalDepthFt * fraction;
          const velocityAtPoint = baseVelocity * (1 + fraction * 0.02);

          profileData.push({
            depthPercent,
            temperature: parseFloat(temperature.toFixed(1)),
            overallConversion: parseFloat(overallConvAtPoint.toFixed(2)),
            bedConversion: parseFloat(bedConversion.toFixed(2)),
            pressure: parseFloat(pressureAtPoint.toFixed(2)),
            bedDepthFt: parseFloat(bedDepthFt.toFixed(1)),
            so2Percent: parseFloat(so2AtPoint.toFixed(2)),
            o2Percent: parseFloat(o2AtPoint.toFixed(2)),
            velocity: parseFloat(velocityAtPoint.toFixed(1))
          });
        });

        passProfiles[`pass${passNumber}`] = profileData;

        // Update inlet values for next pass (only if not using RK4 data)
        if (!rk4InletComp) {
          const so2ConvertedThisPass = passInletSO2 * (passConv / 100);
          passInletSO2 -= so2ConvertedThisPass;
          passInletO2 -= so2ConvertedThisPass * 0.5;
          passInletO2 = Math.max(0, passInletO2);
        }
      });

      // ========================================
      // EMISSIONS CALCULATIONS (per user equations)
      // ========================================
      // Constants
      const MW_SO2 = 64.066; // lb/lbmol (molecular weight of SO2)

      // Input mole fractions (convert from percent to fraction)
      const y_SO2 = so2Percent / 100;   // e.g., 0.113
      const y_SO3 = so3Percent / 100;   // e.g., 0.002
      const y_O2 = o2Percent / 100;     // e.g., 0.095

      // Overall conversion (fraction)
      const X_Overall = overallConversion / 100; // e.g., 0.9985

      // Calculate initial total flow F_FT_o (lbmol/hr) from plant rate
      // 1 STPD H2SO4 = 2000 lb/day / 98 lb/lbmol = 20.408 lbmol H2SO4/day
      // Each lbmol SO2 produces 1 lbmol H2SO4, so we need 20.408 lbmol SO2/day per STPD
      // Per hour: 20.408 / 24 = 0.8503 lbmol SO2/hr per STPD
      const SO2_lbmol_hr_per_STPD = (2000 / 98) / 24; // ~0.8503
      const F_SO2_o = plantRate * SO2_lbmol_hr_per_STPD; // lbmol/hr SO2 in

      // Total flow calculated from SO2 flow and inlet mole fraction
      const F_FT_o = y_SO2 > 0 ? F_SO2_o / y_SO2 : 0; // lbmol/hr total

      // Component flows at inlet (lbmol/hr)
      const F_SO3_o = y_SO3 * F_FT_o;
      const F_O2_o = y_O2 * F_FT_o;

      // Flows removed via reaction (lbmol/hr)
      const F_SO2_rem = F_SO2_o * X_Overall; // SO2 converted
      const F_SO3_rem = F_SO3_o;              // SO3 at inlet (passes through or gets absorbed)
      const F_O2_rem = F_SO2_o * X_Overall * 0.5; // O2 consumed (stoichiometry: SO2 + 0.5 O2 -> SO3)

      // Final flows (lbmol/hr) - clamped to zero to prevent negative values if X_Overall rounds above 1.0
      const F_FT_f = Math.max(0, F_FT_o - F_SO2_rem - F_SO3_rem - F_O2_rem); // Total exit flow
      const F_SO2_f = Math.max(0, F_SO2_o - F_SO2_rem); // Unreacted SO2 exit flow

      // Mass flow of SO2 in exit (lb/day)
      const m_SO2_f_lb_day = F_SO2_f * MW_SO2 * 24; // lbmol/hr * lb/lbmol * hr/day

      // OUTPUT 1: Emissions (lb SO2 / ST Acid) = m_SO2_f / Plant Rate
      const emissionsLbSO2ST = plantRate > 0 ? (m_SO2_f_lb_day / plantRate).toFixed(2) : "0.00";

      // OUTPUT 2: Emissions (Kg SO2 / MT Acid) = (m_SO2_f / 2.2046) / (Plant Rate * 1.1023)
      // This is the industry-standard formula as specified by the user
      // - m_SO2_f / 2.2046 converts lb to kg (1 lb = 0.4536 kg, 1 kg = 2.2046 lb)
      // - The factor 1.1023 is the formula constant from the user's specification
      const m_SO2_f_kg_day = m_SO2_f_lb_day / 2.2046;
      const emissionsKgSO2MT = plantRate > 0 ? (m_SO2_f_kg_day / (plantRate * 1.1023)).toFixed(2) : "0.00";

      // OUTPUT 3: Emissions (ppmv SO2) = (F_SO2_f / F_FT_f) * 1,000,000
      const emissionsPpmv = F_FT_f > 0 ? Math.round((F_SO2_f / F_FT_f) * 1000000).toString() : "0";

      // Build simulation results
      const results = {
        emissions: {
          lbSO2ST: emissionsLbSO2ST,
          kgSO2MT: emissionsKgSO2MT,
          ppmv: emissionsPpmv
        },
        converterDiameter: {
          ft: converterDiameterFt.toFixed(2),
          m: converterDiameterM.toFixed(2)
        },
        reactorFlow: {
          gasFlowNm3h,
          volumetricFlowACFM: reactorFlowResult.volumetricFlowACFM,
          scfmDry: reactorFlowResult.scfmDry,
          pressureAtm: reactorFlowResult.pressureAtm,
          temperatureR: reactorFlowResult.temperatureR
        },
        passConversions,
        pressureDrops,
        volumes,
        passProfiles,
        catalystLoadings: {
          matrix: catalystLoadingResult.matrix,
          totalLiters: catalystLoadingResult.totalLiters,
          totalRatio: catalystLoadingResult.totalRatio
        }
      };

      // Broadcast results to all connected tabs in the session
      if (sessionId) {
        sessionWS.broadcastToSession(sessionId, 'SIMULATION_RESULTS', {
          simulationType: 'catalytic-reactor',
          results,
          inputs: { gasComposition, processInputs, catalystConfig }
        });
      }

      // Return simulation results
      res.json(results);
    } catch (error) {
      console.error("Catalytic reactor simulation error:", error);
      res.status(500).json({ message: "Failed to run catalytic reactor simulation" });
    }
  });

  // ===== X-T DIAGRAM ENDPOINT (Python RK4 Solver) =====

  app.post('/api/catalytic-reactor-xt-diagram', async (req: Request, res: Response) => {
    try {
      const inputData = req.body;

      // Spawn Python process to run the simulation
      const pythonScriptPath = path.join(process.cwd(), 'server', 'python', 'main.py');
      const pythonProcess = spawn('python3', [pythonScriptPath], {
        cwd: path.join(process.cwd(), 'server', 'python'),
      });

      let stdout = '';
      let stderr = '';

      // Send input data as JSON to stdin
      pythonProcess.stdin.write(JSON.stringify(inputData));
      pythonProcess.stdin.end();

      pythonProcess.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      pythonProcess.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      pythonProcess.on('close', (code) => {
        if (code !== 0) {
          console.error('Python process error:', stderr);
          return res.status(500).json({
            success: false,
            error: 'Python simulation failed',
            details: stderr
          });
        }

        try {
          const result = JSON.parse(stdout);
          res.json(result);
        } catch (parseError) {
          console.error('Failed to parse Python output:', stdout, parseError);
          res.status(500).json({
            success: false,
            error: 'Failed to parse simulation results'
          });
        }
      });

      pythonProcess.on('error', (err) => {
        console.error('Failed to start Python process:', err);
        res.status(500).json({
          success: false,
          error: 'Failed to start simulation process'
        });
      });

    } catch (error) {
      console.error('X-T diagram simulation error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to run X-T diagram simulation'
      });
    }
  });

  // ===== CATALYST PARAMETERS ENDPOINTS =====

  // Save catalyst parameters
  app.post('/api/catalyst-parameters', async (req: Request, res: Response) => {
    try {
      const catalysts = req.body;

      if (!catalysts || typeof catalysts !== 'object') {
        return res.status(400).json({ message: "Invalid catalyst data" });
      }

      const paramsToSave = [];
      const errors: string[] = [];

      for (const [name, data] of Object.entries(catalysts)) {
        // Validate using shared Zod schema
        const validation = catalystParameterApiSchema.safeParse(data);

        if (!validation.success) {
          // Collect all errors for this catalyst
          for (const issue of validation.error.issues) {
            errors.push(`${name}: ${issue.path.join('.')} - ${issue.message}`);
          }
        } else {
          // Validation passed - convert to storage format
          const validated = validation.data;
          paramsToSave.push({
            name,
            cesiumPromoted: validated.cesiumPromoted ? "Yes" : "No",
            shape: validated.shape,
            voidFraction: String(validated.voidFraction),
            activityFresh: String(validated.activityFresh),
            ignitionTempC: String(validated.ignitionTempC),
            operatingTempC: String(validated.operatingTempC),
            diameterMm: String(validated.diameterMm),
            sphericity: String(validated.sphericity),
            bulkDensityKgM3: String(validated.bulkDensityKgM3),
          });
        }
      }

      if (errors.length > 0) {
        return res.status(400).json({
          message: "Validation failed",
          errors
        });
      }

      const savedParams = await storage.upsertManyCatalystParameters(paramsToSave);

      res.json({
        success: true,
        message: "Catalyst parameters saved successfully",
        count: savedParams.length
      });
    } catch (error) {
      console.error("Catalyst parameters save error:", error);
      res.status(500).json({ message: "Failed to save catalyst parameters" });
    }
  });

  // Get all catalyst parameters
  app.get('/api/catalyst-parameters', async (req: Request, res: Response) => {
    try {
      const params = await storage.getAllCatalystParameters();
      res.json(params);
    } catch (error) {
      console.error("Catalyst parameters fetch error:", error);
      res.status(500).json({ message: "Failed to fetch catalyst parameters" });
    }
  });

  // ===== CONVERTER CASES ENDPOINTS =====

  // Get all converter cases
  app.get('/api/converter-cases', async (req: Request, res: Response) => {
    try {
      const cases = await storage.getAllConverterCases();
      res.json(cases);
    } catch (error) {
      console.error("Converter cases fetch error:", error);
      res.status(500).json({ message: "Failed to fetch converter cases" });
    }
  });

  // Get single converter case
  app.get('/api/converter-cases/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid case ID" });
      }
      const caseData = await storage.getConverterCase(id);
      if (!caseData) {
        return res.status(404).json({ message: "Case not found" });
      }
      res.json(caseData);
    } catch (error) {
      console.error("Converter case fetch error:", error);
      res.status(500).json({ message: "Failed to fetch converter case" });
    }
  });

  // Create converter case
  app.post('/api/converter-cases', async (req: Request, res: Response) => {
    try {
      const validation = insertConverterCaseSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          message: "Validation failed",
          errors: validation.error.errors,
        });
      }
      const newCase = await storage.createConverterCase(validation.data);
      res.status(201).json(newCase);
    } catch (error) {
      console.error("Converter case create error:", error);
      res.status(500).json({ message: "Failed to create converter case" });
    }
  });

  // Update converter case
  app.patch('/api/converter-cases/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid case ID" });
      }
      const validation = insertConverterCaseSchema.partial().safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          message: "Validation failed",
          errors: validation.error.errors,
        });
      }
      const updated = await storage.updateConverterCase(id, validation.data);
      if (!updated) {
        return res.status(404).json({ message: "Case not found" });
      }
      res.json(updated);
    } catch (error) {
      console.error("Converter case update error:", error);
      res.status(500).json({ message: "Failed to update converter case" });
    }
  });

  // Delete converter case
  app.delete('/api/converter-cases/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid case ID" });
      }
      await storage.deleteConverterCase(id);
      res.json({ success: true, message: "Case deleted" });
    } catch (error) {
      console.error("Converter case delete error:", error);
      res.status(500).json({ message: "Failed to delete converter case" });
    }
  });

  // ===== PROCESS VARIABLES ENDPOINTS =====

  // Get all process variables and case columns
  app.get('/api/process-variables', async (req: Request, res: Response) => {
    try {
      const vars = await storage.getAllProcessVariables();
      const cases = await storage.getAllProcessVariableCaseColumns();

      // Default case columns if none exist
      const defaultCases = [
        { caseId: "case1", name: "Case 1", description: "PV_2480 STPD - Clean", sortOrder: 0 },
        { caseId: "case2", name: "Case 2", description: "PV_2480 STPD - Dirty", sortOrder: 1 },
        { caseId: "case3", name: "Case 3", description: "1240 STPD – Summer – Clean – 50% Turndown", sortOrder: 2 },
        { caseId: "case4", name: "Case 4", description: "Start-Up: Summer – Clean", sortOrder: 3 },
      ];

      // Transform cases for frontend format
      const casesForFrontend = (cases.length > 0 ? cases : defaultCases).map(c => ({
        id: c.caseId,
        name: c.name,
        description: c.description,
      }));

      // Transform variables - ensure cases is a proper object
      const varsForFrontend = vars.map(v => ({
        count: v.count,
        tag: v.tag,
        description: v.description,
        cases: typeof v.cases === 'object' && v.cases !== null ? v.cases : {},
      }));

      res.json({ variables: varsForFrontend, cases: casesForFrontend });
    } catch (error) {
      console.error("Process variables fetch error:", error);
      res.status(500).json({ message: "Failed to fetch process variables" });
    }
  });

  // Save all process variables and case columns (replace all)
  app.post('/api/process-variables', async (req: Request, res: Response) => {
    try {
      const { variables, cases } = req.body;

      if (!Array.isArray(variables)) {
        return res.status(400).json({ message: "Variables must be an array" });
      }

      // Sanitize and save variables with dynamic cases
      const sanitizedVars = variables.map((v: any) => ({
        count: String(v.count || ''),
        tag: String(v.tag || ''),
        description: String(v.description || ''),
        cases: typeof v.cases === 'object' && v.cases !== null ? v.cases : {},
      }));
      const savedVars = await storage.upsertProcessVariables(sanitizedVars);

      // Save case columns if provided
      if (Array.isArray(cases) && cases.length > 0) {
        const sanitizedCases = cases.map((c: any, index: number) => ({
          caseId: String(c.id || c.caseId || ''),
          name: String(c.name || ''),
          description: String(c.description || ''),
          sortOrder: index,
        }));
        await storage.upsertProcessVariableCaseColumns(sanitizedCases);
      }

      res.json({ success: true, count: savedVars.length });
    } catch (error) {
      console.error("Process variables save error:", error);
      res.status(500).json({ message: "Failed to save process variables" });
    }
  });

  // Get all setpoint variables and case columns
  app.get('/api/setpoint-variables', async (req: Request, res: Response) => {
    try {
      const vars = await storage.getAllSetpointVariables();
      const cases = await storage.getAllSetpointCaseColumns();

      // Default case columns if none exist
      const defaultCases = [
        { caseId: "case1", name: "Case 1", description: "SP_2480 STPD - Clean", sortOrder: 0 },
        { caseId: "case2", name: "Case 2", description: "SP_2480 STPD - Dirty", sortOrder: 1 },
        { caseId: "case3", name: "Case 3", description: "1240 STPD – Summer – Clean – 50% Turndown", sortOrder: 2 },
        { caseId: "case4", name: "Case 4", description: "Start-Up: Summer – Clean", sortOrder: 3 },
      ];

      // Transform cases for frontend format
      const casesForFrontend = (cases.length > 0 ? cases : defaultCases).map(c => ({
        id: c.caseId,
        name: c.name,
        description: c.description,
      }));

      // Transform variables - ensure cases is a proper object
      const varsForFrontend = vars.map(v => ({
        count: v.count,
        tag: v.tag,
        description: v.description,
        cases: typeof v.cases === 'object' && v.cases !== null ? v.cases : {},
      }));

      res.json({ variables: varsForFrontend, cases: casesForFrontend });
    } catch (error) {
      console.error("Setpoint variables fetch error:", error);
      res.status(500).json({ message: "Failed to fetch setpoint variables" });
    }
  });

  // Save all setpoint variables and case columns (replace all)
  app.post('/api/setpoint-variables', async (req: Request, res: Response) => {
    try {
      const { variables, cases } = req.body;

      if (!Array.isArray(variables)) {
        return res.status(400).json({ message: "Variables must be an array" });
      }

      // Sanitize and save variables with dynamic cases
      const sanitizedVars = variables.map((v: any) => ({
        count: String(v.count || ''),
        tag: String(v.tag || ''),
        description: String(v.description || ''),
        cases: typeof v.cases === 'object' && v.cases !== null ? v.cases : {},
      }));
      const savedVars = await storage.upsertSetpointVariables(sanitizedVars);

      // Save case columns if provided
      if (Array.isArray(cases) && cases.length > 0) {
        const sanitizedCases = cases.map((c: any, index: number) => ({
          caseId: String(c.id || c.caseId || ''),
          name: String(c.name || ''),
          description: String(c.description || ''),
          sortOrder: index,
        }));
        await storage.upsertSetpointCaseColumns(sanitizedCases);
      }

      res.json({ success: true, count: savedVars.length });
    } catch (error) {
      console.error("Setpoint variables save error:", error);
      res.status(500).json({ message: "Failed to save setpoint variables" });
    }
  });

  // ===== PSYCHROMETRIC / WEATHER ENDPOINTS =====

  // Check if weather service is configured
  app.get('/api/psychrometrics/status', async (req: Request, res: Response) => {
    res.json({
      configured: isWeatherServiceConfigured(),
      message: isWeatherServiceConfigured()
        ? 'Weather service is ready'
        : 'OpenWeather API key not configured. Please set OPENWEATHER_API_KEY environment variable.'
    });
  });

  // Get current psychrometric data for a location
  app.get('/api/psychrometrics/current', async (req: Request, res: Response) => {
    try {
      const { zipCode, countryCode } = req.query;

      // Validate request
      const validation = weatherRequestSchema.safeParse({
        zipCode: zipCode as string,
        countryCode: (countryCode as string) || 'US',
      });

      if (!validation.success) {
        return res.status(400).json({
          message: 'Invalid request',
          errors: validation.error.errors,
        });
      }

      const data = await getCurrentPsychrometrics(
        validation.data.zipCode,
        validation.data.countryCode
      );

      res.json(data);
    } catch (error) {
      console.error('Psychrometrics API error:', error);

      if (error instanceof WeatherServiceError) {
        return res.status(error.statusCode).json({
          message: error.message
        });
      }

      res.status(500).json({
        message: 'Failed to fetch psychrometric data'
      });
    }
  });

  // Get historical psychrometric data (ERA5 archive)
  app.get('/api/psychrometrics/history', async (req: Request, res: Response) => {
    try {
      const { zipCode, countryCode, daysBack } = req.query;

      const validation = weatherHistoryRequestSchema.safeParse({
        zipCode: zipCode as string,
        countryCode: (countryCode as string) || 'US',
        daysBack: daysBack ? parseInt(daysBack as string) : 7,
      });

      if (!validation.success) {
        return res.status(400).json({
          message: 'Invalid request',
          errors: validation.error.errors,
        });
      }

      const data = await getHistoricalPsychrometrics(
        validation.data.zipCode,
        validation.data.countryCode,
        validation.data.daysBack
      );

      res.json(data);
    } catch (error) {
      console.error('Historical psychrometrics API error:', error);

      if (error instanceof WeatherServiceError) {
        return res.status(error.statusCode).json({
          message: error.message
        });
      }

      res.status(500).json({
        message: 'Failed to fetch historical data'
      });
    }
  });

  // Material Balance: Streams 1-4 calculation
  app.get('/api/material-balance/streams-1-4', async (req: Request, res: Response) => {
    try {
      const { case: caseNum = '1', zipCode = '89414', countryCode = 'US' } = req.query;
      const parsedCase = parseInt(caseNum as string);
      if (isNaN(parsedCase) || parsedCase < 1 || parsedCase > 4) {
        return res.status(400).json({ message: 'Invalid case number. Must be 1, 2, 3, or 4.' });
      }
      const whichCase = parsedCase as 1 | 2 | 3 | 4;

      // Load process variables from database and transform to PvRow format
      const rawProcessVariables = await storage.getAllProcessVariables();
      const processVariables = rawProcessVariables.map(pv => ({
        count: pv.count,
        tag: pv.tag,
        description: pv.description,
        cases: (typeof pv.cases === 'object' && pv.cases !== null ? pv.cases : {}) as Record<string, string>,
      }));

      // Check if we need realtime data by looking for "Realtime" in the selected case
      let psychroData = null;
      const caseKey = `case${whichCase}`;
      const needsRealtime = processVariables.some((pv) => {
        const cellValue = (pv.cases[caseKey] || '').toLowerCase();
        return cellValue.includes('realtime');
      });

      if (needsRealtime) {
        try {
          psychroData = await getCurrentPsychrometrics(zipCode as string, countryCode as string);
        } catch (err) {
          console.warn('Failed to fetch realtime psychrometrics, using defaults:', err);
        }
      }

      // Resolve realtime values in process variables
      const { resolveRealtimePV, extractPvValues } = await import('./realtime/resolveProcessVariables');
      const resolvedPVs = await resolveRealtimePV({
        processVariables,
        whichCase,
        psychroData,
      });

      // Extract the values we need for stream calculations
      const pvValues = extractPvValues(resolvedPVs, whichCase);

      // Determine plant condition from case description
      const plantCondition = whichCase === 2 || whichCase === 4 ? 'dirty' : 'clean';

      // Call Python calculator
      const pythonInput = {
        ambient_pressure_atm: pvValues.ambientPressure_atm,
        ambient_temperature_F: pvValues.ambientTemperature_F,
        ambient_moisture_gr_lb: pvValues.ambientMoisture_grLb,
        main_comp_rpm_pct: pvValues.mainCompRpm_pct,
        filter_dp_inwc: pvValues.filterDp_inwc,
        plant_condition: plantCondition,
      };

      const pythonScriptPath = path.join(process.cwd(), 'server', 'python', 'streams_1_to_4.py');

      const result = await new Promise<any>((resolve, reject) => {
        const pythonProcess = spawn('python3', [pythonScriptPath, JSON.stringify(pythonInput)]);

        let stdout = '';
        let stderr = '';

        pythonProcess.stdout.on('data', (data: Buffer) => {
          stdout += data.toString();
        });

        pythonProcess.stderr.on('data', (data: Buffer) => {
          stderr += data.toString();
        });

        pythonProcess.on('close', (code: number) => {
          if (code !== 0) {
            reject(new Error(`Python process exited with code ${code}: ${stderr}`));
          } else {
            try {
              resolve(JSON.parse(stdout));
            } catch (e) {
              reject(new Error(`Failed to parse Python output: ${stdout}`));
            }
          }
        });
      });

      res.json({
        streams: result,
        inputs: pythonInput,
        resolvedPVs: resolvedPVs.slice(0, 4), // Return first 4 PVs for debugging
      });

    } catch (error) {
      console.error('Material balance streams 1-4 error:', error);
      res.status(500).json({
        message: 'Failed to calculate streams 1-4',
        error: error instanceof Error ? error.message : String(error),
      });
    }
  });

  // Main Compressor Simulation endpoint
  app.post('/api/compressor-simulation', async (req: Request, res: Response) => {
    try {
      const { rpm_percent, temp, barometricPressure, plant_condition, inlet_pressure_inwc } = req.body;

      // Validate required fields
      if (rpm_percent === undefined || temp === undefined || barometricPressure === undefined) {
        return res.status(400).json({ message: "Missing required compressor input parameters" });
      }

      const rpmPercentVal = parseFloat(rpm_percent);
      const tempVal = parseFloat(temp);
      const baroVal = parseFloat(barometricPressure);
      const inletPressureVal = inlet_pressure_inwc !== undefined ? parseFloat(inlet_pressure_inwc) : -3.0;

      // Validate numeric inputs
      if (isNaN(rpmPercentVal) || isNaN(tempVal) || isNaN(baroVal)) {
        return res.status(400).json({ message: "All inputs must be valid numbers" });
      }

      // Validate plant condition
      const validConditions = ["clean", "dirty"];
      const condition = validConditions.includes(plant_condition) ? plant_condition : "clean";

      // Prepare input for Python script
      const pythonInput = {
        rpm_percent: rpmPercentVal,
        temp: tempVal,
        barometricPressure: baroVal,
        plant_condition: condition,
        inlet_pressure_inwc: inletPressureVal
      };

      // Run Python compressor calculator
      const pythonScriptPath = path.join(import.meta.dirname, 'python', 'compressor_calculator.py');

      const result = await new Promise<any>((resolve, reject) => {
        const pythonProcess = spawn('python3', [pythonScriptPath]);

        let stdout = '';
        let stderr = '';

        pythonProcess.stdin.write(JSON.stringify(pythonInput));
        pythonProcess.stdin.end();

        pythonProcess.stdout.on('data', (data) => {
          stdout += data.toString();
        });

        pythonProcess.stderr.on('data', (data) => {
          stderr += data.toString();
        });

        pythonProcess.on('close', (code) => {
          if (code !== 0) {
            console.error('Python compressor calculator error:', stderr);
            reject(new Error(`Python process exited with code ${code}: ${stderr}`));
            return;
          }

          try {
            const result = JSON.parse(stdout);
            resolve(result);
          } catch (parseError) {
            console.error('Failed to parse Python output:', stdout);
            reject(new Error('Failed to parse compressor simulation results'));
          }
        });

        pythonProcess.on('error', (err) => {
          console.error('Failed to start Python process:', err);
          reject(err);
        });
      });

      if (!result.success) {
        return res.status(500).json({ message: result.error || "Compressor simulation failed" });
      }

      res.json(result);
    } catch (error) {
      console.error('Compressor simulation error:', error);
      res.status(500).json({
        message: error instanceof Error ? error.message : "Compressor simulation failed"
      });
    }
  });

  // Sulfur Furnace Simulation endpoint
  app.post('/api/sulfur-furnace-simulation', async (req: Request, res: Response) => {
    try {
      const { air_scfm, sulfur_klb_hr, sulfur_temp_f, mode, time_step_seconds, previous_temp } = req.body;

      // Validate required fields
      if (air_scfm === undefined || sulfur_klb_hr === undefined) {
        return res.status(400).json({ message: "Missing required furnace input parameters" });
      }

      const airVal = parseFloat(air_scfm);
      const sulfurVal = parseFloat(sulfur_klb_hr);
      const sulfurTempVal = parseFloat(sulfur_temp_f) || 275.0;
      const timeStepVal = parseFloat(time_step_seconds) || 60.0;
      const prevTempVal = parseFloat(previous_temp) || 2000.0;

      // Validate numeric inputs
      if (isNaN(airVal) || isNaN(sulfurVal)) {
        return res.status(400).json({ message: "All inputs must be valid numbers" });
      }

      // Validate mode
      const validModes = ["static", "dynamic"];
      const simMode = validModes.includes(mode?.toLowerCase()) ? mode.toLowerCase() : "static";

      // Prepare input for Python script
      const pythonInput = {
        air_scfm: airVal,
        sulfur_klb_hr: sulfurVal,
        sulfur_temp_f: sulfurTempVal,
        mode: simMode,
        time_step_seconds: timeStepVal,
        previous_temp: prevTempVal
      };

      // Run Python sulfur furnace calculator
      const pythonScriptPath = path.join(import.meta.dirname, 'python', 'sulfur_furnace_calc.py');

      const result = await new Promise<any>((resolve, reject) => {
        const pythonProcess = spawn('python3', [pythonScriptPath]);

        let stdout = '';
        let stderr = '';

        pythonProcess.stdin.write(JSON.stringify(pythonInput));
        pythonProcess.stdin.end();

        pythonProcess.stdout.on('data', (data) => {
          stdout += data.toString();
        });

        pythonProcess.stderr.on('data', (data) => {
          stderr += data.toString();
        });

        pythonProcess.on('close', (code) => {
          if (code !== 0) {
            console.error('Python sulfur furnace calculator error:', stderr);
            reject(new Error(`Python process exited with code ${code}: ${stderr}`));
            return;
          }

          try {
            const result = JSON.parse(stdout);
            resolve(result);
          } catch (parseError) {
            console.error('Failed to parse Python output:', stdout);
            reject(new Error('Failed to parse sulfur furnace simulation results'));
          }
        });

        pythonProcess.on('error', (err) => {
          console.error('Failed to start Python process:', err);
          reject(err);
        });
      });

      if (!result.success) {
        return res.status(500).json({ message: result.error || "Sulfur furnace simulation failed" });
      }

      res.json(result);
    } catch (error) {
      console.error('Sulfur furnace simulation error:', error);
      res.status(500).json({
        message: error instanceof Error ? error.message : "Sulfur furnace simulation failed"
      });
    }
  });

  // Download compressor codes (Python and TypeScript)
  app.get('/api/download/compressor-codes', async (req: Request, res: Response) => {
    try {
      const pythonPath = path.join(import.meta.dirname, 'python', 'compressor_calculator.py');
      const tsxPath = path.join(import.meta.dirname, '..', 'client', 'src', 'pages', 'unit-operation', 'main-compressor.tsx');

      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', 'attachment; filename=compressor-codes.zip');

      const archive = archiver('zip', { zlib: { level: 9 } });
      archive.pipe(res);

      if (fs.existsSync(pythonPath)) {
        archive.file(pythonPath, { name: 'compressor_calculator.py' });
      }
      if (fs.existsSync(tsxPath)) {
        archive.file(tsxPath, { name: 'main-compressor.tsx' });
      }

      await archive.finalize();
    } catch (error) {
      console.error('Download error:', error);
      res.status(500).json({ message: 'Failed to create download archive' });
    }
  });

  // Drying Tower Circuit Hydraulic Simulation
  app.post('/api/drying-tower-simulation', async (req: Request, res: Response) => {
    try {
      const { fcv_pos, tcv_pos, acid_flow_final, cooler_k, pump_a, pump_b, pump_c,
        elevation_diff, pipe_dp, cv_fcv_max, cv_tcv_max, fluid_sg, pump_inlet_head,
        fcv_profile, bypass_profile, fcv_params, bypass_params } = req.body;

      // Validate required fields
      if (fcv_pos === undefined || tcv_pos === undefined || acid_flow_final === undefined ||
        cooler_k === undefined || pump_a === undefined || pump_b === undefined ||
        pump_c === undefined || elevation_diff === undefined || pipe_dp === undefined ||
        cv_fcv_max === undefined || cv_tcv_max === undefined || fluid_sg === undefined) {
        return res.status(400).json({ message: "Missing required hydraulic input parameters" });
      }

      // Prepare input for Python script
      const pythonInput = {
        fcv_pos: parseFloat(fcv_pos),
        tcv_pos: parseFloat(tcv_pos),
        acid_flow_final: parseFloat(acid_flow_final),
        cooler_k: parseFloat(cooler_k),
        pump_a: parseFloat(pump_a),
        pump_b: parseFloat(pump_b),
        pump_c: parseFloat(pump_c),
        elevation_diff: parseFloat(elevation_diff),
        pipe_dp: parseFloat(pipe_dp),
        cv_fcv_max: parseFloat(cv_fcv_max),
        cv_tcv_max: parseFloat(cv_tcv_max),
        fluid_sg: parseFloat(fluid_sg),
        pump_inlet_head: pump_inlet_head !== undefined ? parseFloat(pump_inlet_head) : 2.0,
        fcv_profile: fcv_profile || 'equal_percentage',
        bypass_profile: bypass_profile || 'equal_percentage',
        fcv_params: fcv_params || { a: 100, b: 0.5 },
        bypass_params: bypass_params || { a: 100, b: 0.5 }
      };

      // Validate numeric inputs (skip string fields)
      const numericFields = ['fcv_pos', 'tcv_pos', 'acid_flow_final', 'cooler_k', 'pump_a',
        'pump_b', 'pump_c', 'elevation_diff', 'pipe_dp', 'cv_fcv_max',
        'cv_tcv_max', 'fluid_sg', 'pump_inlet_head'];
      for (const key of numericFields) {
        const val = (pythonInput as Record<string, any>)[key];
        if (typeof val === 'number' && isNaN(val)) {
          return res.status(400).json({ message: `${key} must be a valid number` });
        }
      }

      // Run Python drying tower solver
      const pythonScriptPath = path.join(import.meta.dirname, 'python', 'drying_tower_solver.py');

      const result = await new Promise<any>((resolve, reject) => {
        const pythonProcess = spawn('python3', [pythonScriptPath]);

        let stdout = '';
        let stderr = '';

        pythonProcess.stdin.write(JSON.stringify(pythonInput));
        pythonProcess.stdin.end();

        pythonProcess.stdout.on('data', (data) => {
          stdout += data.toString();
        });

        pythonProcess.stderr.on('data', (data) => {
          stderr += data.toString();
        });

        pythonProcess.on('close', (code) => {
          if (code !== 0) {
            console.error('Python drying tower solver error:', stderr);
            reject(new Error(`Python process exited with code ${code}: ${stderr}`));
            return;
          }

          try {
            const result = JSON.parse(stdout);
            resolve(result);
          } catch (parseError) {
            console.error('Failed to parse Python output:', stdout);
            reject(new Error('Failed to parse drying tower simulation results'));
          }
        });

        pythonProcess.on('error', (err) => {
          console.error('Failed to start Python process:', err);
          reject(err);
        });
      });

      if (!result.success) {
        return res.status(500).json({ message: result.error || "Drying tower simulation failed" });
      }

      res.json(result);
    } catch (error) {
      console.error('Drying tower simulation error:', error);
      res.status(500).json({
        message: error instanceof Error ? error.message : "Drying tower simulation failed"
      });
    }
  });

  // Drying Tower Mass Balance Calculation endpoint
  app.post('/api/drying-tower-calc', async (req: Request, res: Response) => {
    try {
      const pythonInput = req.body;

      // Validate required fields
      if (pythonInput.x_H2SO4_AD0 === undefined || pythonInput.Flow_AD0 === undefined) {
        return res.status(400).json({ message: "Missing required drying tower input parameters" });
      }

      // Run Python drying tower calculator
      const pythonScriptPath = path.join(import.meta.dirname, 'python', 'drying_tower_calc.py');

      const result = await new Promise<any>((resolve, reject) => {
        const pythonProcess = spawn('python3', [pythonScriptPath]);

        let stdout = '';
        let stderr = '';

        pythonProcess.stdin.write(JSON.stringify(pythonInput));
        pythonProcess.stdin.end();

        pythonProcess.stdout.on('data', (data) => {
          stdout += data.toString();
        });

        pythonProcess.stderr.on('data', (data) => {
          stderr += data.toString();
        });

        pythonProcess.on('close', (code) => {
          if (code !== 0) {
            console.error('Python drying tower calculator error:', stderr);
            reject(new Error(`Python process exited with code ${code}: ${stderr}`));
            return;
          }

          try {
            const result = JSON.parse(stdout);
            resolve(result);
          } catch (parseError) {
            console.error('Failed to parse Python output:', stdout);
            reject(new Error('Failed to parse drying tower calculation results'));
          }
        });

        pythonProcess.on('error', (err) => {
          console.error('Failed to start Python process:', err);
          reject(err);
        });
      });

      if (result.error) {
        return res.status(500).json({ message: result.error });
      }

      res.json(result);
    } catch (error) {
      console.error('Drying tower calculation error:', error);
      res.status(500).json({
        message: error instanceof Error ? error.message : "Drying tower calculation failed"
      });
    }
  });

  // IPAT (Interpass Absorption Tower) Calculation endpoint
  app.post('/api/ipat-calc', async (req: Request, res: Response) => {
    try {
      const pythonInput = req.body;

      // Validate required fields
      if (pythonInput.x_H2SO4_AI0 === undefined || pythonInput.Flow_AI0 === undefined) {
        return res.status(400).json({ message: "Missing required IPAT input parameters" });
      }

      // Run Python IPAT calculator
      const pythonScriptPath = path.join(import.meta.dirname, 'python', 'ipat_calc.py');

      const result = await new Promise<any>((resolve, reject) => {
        const pythonProcess = spawn('python3', [pythonScriptPath]);

        let stdout = '';
        let stderr = '';

        pythonProcess.stdin.write(JSON.stringify(pythonInput));
        pythonProcess.stdin.end();

        pythonProcess.stdout.on('data', (data) => {
          stdout += data.toString();
        });

        pythonProcess.stderr.on('data', (data) => {
          stderr += data.toString();
        });

        pythonProcess.on('close', (code) => {
          if (code !== 0) {
            console.error('Python IPAT calculator error:', stderr);
            reject(new Error(`Python process exited with code ${code}: ${stderr}`));
            return;
          }

          try {
            const result = JSON.parse(stdout);
            resolve(result);
          } catch (parseError) {
            console.error('Failed to parse Python output:', stdout);
            reject(new Error('Failed to parse IPAT calculation results'));
          }
        });

        pythonProcess.on('error', (err) => {
          console.error('Failed to start Python process:', err);
          reject(err);
        });
      });

      if (result.error) {
        return res.status(500).json({ message: result.error });
      }

      res.json(result);
    } catch (error) {
      console.error('IPAT calculation error:', error);
      res.status(500).json({
        message: error instanceof Error ? error.message : "IPAT calculation failed"
      });
    }
  });

  // FAT (Final Absorption Tower) Calculation endpoint
  app.post('/api/fat-calc', async (req: Request, res: Response) => {
    try {
      const pythonInput = req.body;

      // Validate required fields
      if (pythonInput.x_H2SO4_AF0 === undefined || pythonInput.Flow_AF0 === undefined) {
        return res.status(400).json({ message: "Missing required FAT input parameters" });
      }

      // Run Python FAT calculator
      const pythonScriptPath = path.join(import.meta.dirname, 'python', 'fat_calc.py');

      const result = await new Promise<any>((resolve, reject) => {
        const pythonProcess = spawn('python3', [pythonScriptPath]);

        let stdout = '';
        let stderr = '';

        pythonProcess.stdin.write(JSON.stringify(pythonInput));
        pythonProcess.stdin.end();

        pythonProcess.stdout.on('data', (data) => {
          stdout += data.toString();
        });

        pythonProcess.stderr.on('data', (data) => {
          stderr += data.toString();
        });

        pythonProcess.on('close', (code) => {
          if (code !== 0) {
            console.error('Python FAT calculator error:', stderr);
            reject(new Error(`Python process exited with code ${code}: ${stderr}`));
            return;
          }

          try {
            const result = JSON.parse(stdout);
            resolve(result);
          } catch (parseError) {
            console.error('Failed to parse Python output:', stdout);
            reject(new Error('Failed to parse FAT calculation results'));
          }
        });

        pythonProcess.on('error', (err) => {
          console.error('Failed to start Python process:', err);
          reject(err);
        });
      });

      if (result.error) {
        return res.status(500).json({ message: result.error });
      }

      res.json(result);
    } catch (error) {
      console.error('FAT calculation error:', error);
      res.status(500).json({
        message: error instanceof Error ? error.message : "FAT calculation failed"
      });
    }
  });

  // Converter Pass Simulation endpoint (Single pass SO2 oxidation)
  app.post('/api/converter-pass-simulation', async (req: Request, res: Response) => {
    try {
      const pythonInput = req.body;

      // Validate required fields
      if (pythonInput.inlet_T_C === undefined || pythonInput.inlet_so2_pct === undefined) {
        return res.status(400).json({ message: "Missing required converter pass input parameters" });
      }

      // Run Python pass solver
      const pythonScriptPath = path.join(import.meta.dirname, 'python', 'rk_solver.py');

      const result = await new Promise<any>((resolve, reject) => {
        const pythonProcess = spawn('python3', [pythonScriptPath]);

        let stdout = '';
        let stderr = '';

        pythonProcess.stdin.write(JSON.stringify(pythonInput));
        pythonProcess.stdin.end();

        pythonProcess.stdout.on('data', (data) => {
          stdout += data.toString();
        });

        pythonProcess.stderr.on('data', (data) => {
          stderr += data.toString();
        });

        pythonProcess.on('close', (code) => {
          if (code !== 0) {
            console.error('Python pass solver error:', stderr);
            reject(new Error(`Python process exited with code ${code}: ${stderr}`));
            return;
          }

          try {
            const result = JSON.parse(stdout);
            resolve(result);
          } catch (parseError) {
            console.error('Failed to parse Python output:', stdout);
            reject(new Error('Failed to parse converter pass simulation results'));
          }
        });

        pythonProcess.on('error', (err) => {
          console.error('Failed to start Python process:', err);
          reject(err);
        });
      });

      if (!result.success) {
        return res.status(500).json({ message: result.error || "Simulation failed" });
      }

      res.json(result);
    } catch (error) {
      console.error('Converter pass simulation error:', error);
      res.status(500).json({
        message: error instanceof Error ? error.message : "Converter pass simulation failed"
      });
    }
  });

  // Sulfur Control Hydraulics - Static endpoint
  app.post('/api/sulfur-control/static', async (req: Request, res: Response) => {
    try {
      const { flow_gpm, pit_level_ft, valve_profile_type, R_value } = req.body;

      if (flow_gpm === undefined || pit_level_ft === undefined) {
        return res.status(400).json({ message: "Missing required parameters: flow_gpm, pit_level_ft" });
      }

      const pythonInput = {
        flow_gpm: parseFloat(flow_gpm),
        pit_level_ft: parseFloat(pit_level_ft),
        valve_profile_type: valve_profile_type || 'equal_percentage',
        R_value: parseFloat(R_value) || 124.0
      };

      const pythonScriptPath = path.join(import.meta.dirname, 'python', 'sulfur_static_solver.py');

      const result = await new Promise<any>((resolve, reject) => {
        const pythonProcess = spawn('python3', [pythonScriptPath]);

        let stdout = '';
        let stderr = '';

        pythonProcess.stdin.write(JSON.stringify(pythonInput));
        pythonProcess.stdin.end();

        pythonProcess.stdout.on('data', (data) => {
          stdout += data.toString();
        });

        pythonProcess.stderr.on('data', (data) => {
          stderr += data.toString();
        });

        pythonProcess.on('close', (code) => {
          if (code !== 0) {
            console.error('Python sulfur static solver error:', stderr);
            reject(new Error(`Python process exited with code ${code}: ${stderr}`));
            return;
          }

          try {
            const result = JSON.parse(stdout);
            resolve(result);
          } catch (parseError) {
            console.error('Failed to parse Python output:', stdout);
            reject(new Error('Failed to parse sulfur static simulation results'));
          }
        });

        pythonProcess.on('error', (err) => {
          console.error('Failed to start Python process:', err);
          reject(err);
        });
      });

      if (result.status === "error") {
        return res.status(400).json({ message: result.message || "Sulfur static simulation failed" });
      }

      res.json(result);
    } catch (error) {
      console.error('Sulfur static simulation error:', error);
      res.status(500).json({
        message: error instanceof Error ? error.message : "Sulfur static simulation failed"
      });
    }
  });

  // Sulfur Control Hydraulics - Dynamic endpoint (step or reset)
  app.post('/api/sulfur-control/dynamic', async (req: Request, res: Response) => {
    try {
      const { action, state, setpoint_gpm, pit_level_ft, kp, ki, tau_valve, tau_flow, dt } = req.body;

      const pythonInput: any = {
        action: action || 'step'
      };

      if (action !== 'reset') {
        pythonInput.state = state || {};
        pythonInput.setpoint_gpm = setpoint_gpm !== undefined ? parseFloat(setpoint_gpm) : 81.35;
        pythonInput.pit_level_ft = pit_level_ft !== undefined ? parseFloat(pit_level_ft) : 7.0;
        pythonInput.kp = kp !== undefined ? parseFloat(kp) : 1.2;
        pythonInput.ki = ki !== undefined ? parseFloat(ki) : 0.15;
        pythonInput.tau_valve = tau_valve !== undefined ? parseFloat(tau_valve) : 8.0;
        pythonInput.tau_flow = tau_flow !== undefined ? parseFloat(tau_flow) : 4.0;
        pythonInput.dt = dt !== undefined ? parseFloat(dt) : 0.5;
      }

      const pythonScriptPath = path.join(import.meta.dirname, 'python', 'sulfur_dynamic_solver.py');

      const result = await new Promise<any>((resolve, reject) => {
        const pythonProcess = spawn('python3', [pythonScriptPath]);

        let stdout = '';
        let stderr = '';

        pythonProcess.stdin.write(JSON.stringify(pythonInput));
        pythonProcess.stdin.end();

        pythonProcess.stdout.on('data', (data) => {
          stdout += data.toString();
        });

        pythonProcess.stderr.on('data', (data) => {
          stderr += data.toString();
        });

        pythonProcess.on('close', (code) => {
          if (code !== 0) {
            console.error('Python sulfur dynamic solver error:', stderr);
            reject(new Error(`Python process exited with code ${code}: ${stderr}`));
            return;
          }

          try {
            const result = JSON.parse(stdout);
            resolve(result);
          } catch (parseError) {
            console.error('Failed to parse Python output:', stdout);
            reject(new Error('Failed to parse sulfur dynamic simulation results'));
          }
        });

        pythonProcess.on('error', (err) => {
          console.error('Failed to start Python process:', err);
          reject(err);
        });
      });

      if (result.status === "error") {
        return res.status(400).json({ message: result.message || "Sulfur dynamic simulation failed" });
      }

      res.json(result);
    } catch (error) {
      console.error('Sulfur dynamic simulation error:', error);
      res.status(500).json({
        message: error instanceof Error ? error.message : "Sulfur dynamic simulation failed"
      });
    }
  });

  // ===== SULFUR PROCESS NODES ENDPOINTS =====

  // Get sulfur process nodes by simulation type
  app.get('/api/sulfur-process-nodes/:simulationType', async (req: Request, res: Response) => {
    try {
      const { simulationType } = req.params;
      if (!['static', 'dynamic'].includes(simulationType)) {
        return res.status(400).json({ message: "Invalid simulation type. Must be 'static' or 'dynamic'" });
      }
      const nodes = await storage.getSulfurProcessNodes(simulationType);
      res.json({ nodes });
    } catch (error) {
      console.error("Sulfur process nodes fetch error:", error);
      res.status(500).json({ message: "Failed to fetch sulfur process nodes" });
    }
  });

  // Save sulfur process nodes for a simulation type
  app.post('/api/sulfur-process-nodes', async (req: Request, res: Response) => {
    try {
      const { simulationType, nodes } = req.body;
      if (!simulationType || !['static', 'dynamic'].includes(simulationType)) {
        return res.status(400).json({ message: "Invalid simulation type. Must be 'static' or 'dynamic'" });
      }
      if (!Array.isArray(nodes)) {
        return res.status(400).json({ message: "Nodes must be an array" });
      }
      // Sanitize input - only keep required fields
      const sanitizedNodes = nodes.map((n: any) => ({
        simulationType: String(simulationType),
        tagId: String(n.tagId || ''),
        description: String(n.description || ''),
        pressurePsia: String(n.pressurePsia || '0'),
        tempF: String(n.tempF || '275'),
        flowGpm: String(n.flowGpm || '0'),
        mTotalKlbHr: String(n.mTotalKlbHr || '0'),
        xSulfur: String(n.xSulfur || '1.0'),
        xH2o: String(n.xH2o || '0.00'),
        xH2so4: String(n.xH2so4 || '0.00'),
      }));
      const saved = await storage.upsertSulfurProcessNodes(simulationType, sanitizedNodes);
      res.json({ success: true, count: saved.length });
    } catch (error) {
      console.error("Sulfur process nodes save error:", error);
      res.status(500).json({ message: "Failed to save sulfur process nodes" });
    }
  });

  // ===== HOMESCREEN LAYOUT ENDPOINTS =====

  // Get homescreen layout positions for a screen
  app.get('/api/homescreen-layout/:screenId', async (req: Request, res: Response) => {
    try {
      const { screenId } = req.params;
      const layouts = await storage.getHomescreenLayout(screenId);
      res.json({ layouts });
    } catch (error) {
      console.error("Homescreen layout fetch error:", error);
      res.status(500).json({ message: "Failed to fetch homescreen layout" });
    }
  });

  // Save/update homescreen layout positions
  app.put('/api/homescreen-layout/:screenId', async (req: Request, res: Response) => {
    try {
      const { screenId } = req.params;
      const { layouts } = req.body;
      if (!Array.isArray(layouts)) {
        return res.status(400).json({ message: "Layouts must be an array" });
      }
      const saved = await storage.upsertHomescreenLayout(screenId, layouts);
      res.json({ success: true, count: saved.length });
    } catch (error) {
      console.error("Homescreen layout save error:", error);
      res.status(500).json({ message: "Failed to save homescreen layout" });
    }
  });

  // ===== Controller Config Endpoints =====

  // Get all controller configs
  app.get('/api/controller-configs', async (req: Request, res: Response) => {
    try {
      const configs = await storage.getAllControllerConfigs();
      res.json(configs);
    } catch (error) {
      console.error("Get controller configs error:", error);
      res.status(500).json({ message: "Failed to get controller configs" });
    }
  });

  // Get a specific controller config by controllerId
  app.get('/api/controller-configs/:controllerId', async (req: Request, res: Response) => {
    try {
      const { controllerId } = req.params;
      const config = await storage.getControllerConfig(controllerId);
      if (!config) {
        return res.status(404).json({ message: "Controller config not found" });
      }
      res.json(config);
    } catch (error) {
      console.error("Get controller config error:", error);
      res.status(500).json({ message: "Failed to get controller config" });
    }
  });

  // Save or update a controller config
  app.post('/api/controller-configs/:controllerId', async (req: Request, res: Response) => {
    try {
      const { controllerId } = req.params;
      const { config, data } = req.body;

      if (!controllerId || typeof controllerId !== 'string') {
        return res.status(400).json({ message: "Valid controllerId is required" });
      }

      if (!config || typeof config !== 'object') {
        return res.status(400).json({ message: "Config object is required" });
      }

      // Basic validation of config structure
      if (config.TAGNAME !== undefined && typeof config.TAGNAME !== 'string') {
        return res.status(400).json({ message: "Invalid config: TAGNAME must be a string" });
      }

      const saved = await storage.upsertControllerConfig(controllerId, config, data);
      res.json(saved);
    } catch (error) {
      console.error("Save controller config error:", error);
      res.status(500).json({ message: "Failed to save controller config" });
    }
  });

  // Jug Valve & WHB Hot-side Simulation
  app.post('/api/jug-valve-simulation', async (req: Request, res: Response) => {
    try {
      const {
        furnace_outlet_scfm_dry,
        furnace_outlet_so2,
        furnace_outlet_so3,
        furnace_outlet_o2,
        furnace_outlet_n2,
        furnace_outlet_temp_f,
        furnace_outlet_press_inwc,
        jug_open_pct,
        positioner_open_pct,
        cv_max,
        u_value,
        whb_area,
        baro_psia
      } = req.body;

      if (jug_open_pct === undefined || positioner_open_pct === undefined) {
        return res.status(400).json({ message: "Missing required valve opening percentages" });
      }

      const jugOpenVal = parseFloat(jug_open_pct);
      const posOpenVal = parseFloat(positioner_open_pct);

      if (isNaN(jugOpenVal) || isNaN(posOpenVal)) {
        return res.status(400).json({ message: "Valve opening percentages must be valid numbers" });
      }

      if (jugOpenVal < 0 || jugOpenVal > 100 || posOpenVal < 0 || posOpenVal > 100) {
        return res.status(400).json({ message: "Valve opening percentages must be between 0 and 100" });
      }

      const pythonInput = {
        furnace_outlet_scfm_dry: parseFloat(furnace_outlet_scfm_dry) || 109697,
        furnace_outlet_so2: parseFloat(furnace_outlet_so2) || 12401,
        furnace_outlet_so3: parseFloat(furnace_outlet_so3) || 227,
        furnace_outlet_o2: parseFloat(furnace_outlet_o2) || 10261,
        furnace_outlet_n2: parseFloat(furnace_outlet_n2) || 86808,
        furnace_outlet_temp_f: parseFloat(furnace_outlet_temp_f) || 2080,
        furnace_outlet_press_inwc: parseFloat(furnace_outlet_press_inwc) || 196,
        jug_open_pct: jugOpenVal,
        positioner_open_pct: posOpenVal,
        cv_max: parseFloat(cv_max) || 12500,
        u_value: parseFloat(u_value) || 16.0,
        whb_area: parseFloat(whb_area) || 9800,
        baro_psia: parseFloat(baro_psia) || 14.3
      };

      const pythonScriptPath = path.join(import.meta.dirname, 'python', 'jug_valve_calc.py');
      const pythonProcess = spawn('python3', [pythonScriptPath]);

      let stdout = '';
      let stderr = '';

      pythonProcess.stdout.on('data', (data) => { stdout += data.toString(); });
      pythonProcess.stderr.on('data', (data) => { stderr += data.toString(); });

      pythonProcess.stdin.write(JSON.stringify(pythonInput));
      pythonProcess.stdin.end();

      pythonProcess.on('close', (code) => {
        if (code !== 0) {
          console.error('Jug valve Python error:', stderr);
          return res.status(500).json({ message: 'Calculation failed', error: stderr });
        }

        try {
          const results = JSON.parse(stdout);
          res.json(results);
        } catch (parseError) {
          console.error('Parse error:', parseError);
          res.status(500).json({ message: 'Failed to parse simulation results' });
        }
      });

      pythonProcess.on('error', (error) => {
        console.error('Python process error:', error);
        res.status(500).json({ message: 'Failed to run Python script' });
      });
    } catch (error) {
      console.error('Jug valve simulation error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Inlet Air Filter Simulation endpoint
  app.post('/api/inlet-air-filter-simulation', async (req: Request, res: Response) => {
    try {
      const { dryAirFlow, humidity, inletTemp, filterDp, barometric } = req.body;

      const pythonInput = {
        dryAirFlow: parseFloat(dryAirFlow) || 87000,
        humidity: parseFloat(humidity) || 11.1,
        inletTemp: parseFloat(inletTemp) || 38,
        filterDp: parseFloat(filterDp) || 3,
        barometric: parseFloat(barometric) || 1.001
      };

      const pythonScriptPath = path.join(import.meta.dirname, 'python', 'inlet_air_filter_calc.py');
      const pythonProcess = spawn('python3', [pythonScriptPath, JSON.stringify(pythonInput)]);

      let stdout = '';
      let stderr = '';

      pythonProcess.stdout.on('data', (data) => { stdout += data.toString(); });
      pythonProcess.stderr.on('data', (data) => { stderr += data.toString(); });

      pythonProcess.on('close', (code) => {
        if (code !== 0) {
          console.error('Inlet air filter Python error:', stderr);
          return res.status(500).json({ message: 'Calculation failed', error: stderr });
        }

        try {
          const results = JSON.parse(stdout);
          res.json(results);
        } catch (parseError) {
          console.error('Parse error:', parseError);
          res.status(500).json({ message: 'Failed to parse simulation results' });
        }
      });

      pythonProcess.on('error', (error) => {
        console.error('Python process error:', error);
        res.status(500).json({ message: 'Failed to run Python script' });
      });
    } catch (error) {
      console.error('Inlet air filter simulation error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // GUI code view/download endpoint for specific modules (TSX files)
  app.get('/api/gui-code/:module', (req: Request, res: Response) => {
    const { module } = req.params;
    const { action = 'view' } = req.query;

    // Map module names to TSX GUI files
    const moduleFileMap: Record<string, string> = {
      'process-gas': 'client/src/delta-v/pages/pfd/PFD5001ProcessGas.tsx',
      'compressor': 'client/src/delta-v/pages/unit-operations/compressor.tsx',
      'drying-tower': 'client/src/delta-v/pages/unit-operations/drying-tower.tsx',
      'inlet-air-filter': 'client/src/delta-v/pages/unit-operations/inlet-air-filter.tsx',
      'catalyst': 'client/src/delta-v/pages/unit-operations/catalytic-converter.tsx',
    };

    const relativePath = moduleFileMap[module];
    if (!relativePath) {
      return res.status(404).json({ message: 'Module not found' });
    }

    const filePath = path.join(process.cwd(), relativePath);
    const filename = path.basename(relativePath);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'File not found' });
    }

    if (action === 'download') {
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Type', 'text/plain');
      res.sendFile(filePath);
    } else {
      // View action - return as plain text
      res.setHeader('Content-Type', 'text/plain');
      res.sendFile(filePath);
    }
  });

  // Python code view/download endpoint for specific modules
  app.get('/api/python-code/:module', (req: Request, res: Response) => {
    const { module } = req.params;
    const { action = 'view' } = req.query;

    // Map module names to Python files
    const moduleFileMap: Record<string, string> = {
      'process-gas': 'static_simulator.py',
      'compressor': 'compressor_calculator.py',
      'sulfur-furnace': 'sulfur_furnace_calc.py',
      'drying-tower': 'drying_tower_calc.py',
      'inlet-air-filter': 'inlet_air_filter_calc.py',
      'catalyst': 'pass_solver.py',
    };

    const filename = moduleFileMap[module];
    if (!filename) {
      return res.status(404).json({ message: 'Module not found' });
    }

    const filePath = path.join(process.cwd(), 'server', 'python', filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'File not found' });
    }

    if (action === 'download') {
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Type', 'text/x-python');
      res.sendFile(filePath);
    } else {
      // View action - return as plain text
      res.setHeader('Content-Type', 'text/plain');
      res.sendFile(filePath);
    }
  });

  // Python file download endpoint
  app.get('/api/download-python/:filename', (req: Request, res: Response) => {
    const { filename } = req.params;

    // Whitelist of allowed Python files for security
    const allowedFiles = [
      'drying_tower_calc.py',
      'drying_tower_solver.py',
      'compressor_calculator.py',
      'compressor_gui.py',
      'sulfur_furnace_calc.py',
      'rk_solver.py',
      'ipat_calc.py',
      'fat_calc.py',
      'jug_valve_calc.py',
      'catalyst_database.py',
      'pass_solver.py',
      'sulfur_static_solver.py',
      'sulfur_dynamic_solver.py',
      'inlet_air_filter_calc.py',
      'inlet_air_filter_gui.py',
      'static_simulator.py'
    ];

    if (!allowedFiles.includes(filename)) {
      return res.status(404).json({ message: 'File not found' });
    }

    const filePath = path.join(process.cwd(), 'server', 'python', filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'File not found' });
    }

    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', 'text/x-python');
    res.sendFile(filePath);
  });

  return httpServer;
}
