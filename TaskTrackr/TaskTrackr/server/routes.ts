import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { insertStoreSchema, insertRatingSchema } from "@shared/schema";
import { comparePasswords, hashPassword } from './utils';

function isAdmin(req: Request, res: Response, next: Function) {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ message: "Admin access required" });
  }
  next();
}

function isStoreOwner(req: Request, res: Response, next: Function) {
  if (req.user?.role !== "store_owner") {
    return res.status(403).json({ message: "Store owner access required" });
  }
  next();
}

export async function registerRoutes(app: Express): Promise<Server> {
  setupAuth(app);

  // Admin routes
  app.get("/api/admin/stats", isAdmin, async (req, res) => {
    const [users, stores, ratings] = await Promise.all([
      storage.getTotalUsers(),
      storage.getTotalStores(),
      storage.getTotalRatings(),
    ]);
    res.json({ users, stores, ratings });
  });

  app.get("/api/admin/users", isAdmin, async (req, res) => {
    const users = await storage.getAllUsers();
    res.json(users);
  });

  app.post("/api/admin/stores", isAdmin, async (req, res) => {
    const validated = insertStoreSchema.parse(req.body);
    const store = await storage.createStore(validated);
    res.status(201).json(store);
  });

  app.delete("/api/admin/stores/:id", isAdmin, async (req, res) => {
    await storage.deleteStore(parseInt(req.params.id));
    res.sendStatus(204);
  });

  app.patch("/api/admin/users/:id/role", isAdmin, async (req, res) => {
    const { role } = req.body;
    if (!['user', 'store_owner', 'admin'].includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }
    const user = await storage.updateUserRole(parseInt(req.params.id), role);
    res.json(user);
  });

  // Store routes
  app.get("/api/stores", async (req, res) => {
    const stores = await storage.getAllStores();
    res.json(stores);
  });

  app.get("/api/stores/:id/ratings", async (req, res) => {
    const ratings = await storage.getRatingsByStore(parseInt(req.params.id));
    res.json(ratings);
  });

  // Store owner routes
  app.get("/api/owner/stores", isStoreOwner, async (req, res) => {
    const stores = await storage.getStoresByOwner(req.user!.id);
    res.json(stores);
  });

  // Rating routes
  app.post("/api/ratings", async (req, res) => {
    if (!req.user) return res.sendStatus(401);

    const validated = insertRatingSchema.parse({
      ...req.body,
      userId: req.user.id,
    });

    const rating = await storage.createRating(validated);
    res.status(201).json(rating);
  });

  app.patch("/api/ratings/:id", async (req, res) => {
    if (!req.user) return res.sendStatus(401);

    const rating = parseInt(req.body.rating);
    if (rating < 1 || rating > 5) {
      return res.status(400).json({ message: "Rating must be between 1 and 5" });
    }

    const updatedRating = await storage.updateRating(parseInt(req.params.id), rating);
    res.json(updatedRating);
  });

  // Add this route after the existing rating routes
  app.get("/api/ratings", async (req, res) => {
    const ratings = await storage.getRatingsByUser(req.user?.id || 0);
    res.json(ratings);
  });

  app.post("/api/user/password", async (req, res) => {
    if (!req.user) return res.sendStatus(401);

    const { currentPassword, newPassword } = req.body;
    const user = await storage.getUser(req.user.id);

    if (!user || !(await comparePasswords(currentPassword, user.password))) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }

    const hashedPassword = await hashPassword(newPassword);
    const updatedUser = await storage.updateUserPassword(req.user.id, hashedPassword);
    res.json(updatedUser);
  });

  const httpServer = createServer(app);
  return httpServer;
}