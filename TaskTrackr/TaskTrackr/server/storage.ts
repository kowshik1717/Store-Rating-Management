import { InsertUser, InsertStore, InsertRating, User, Store, Rating, userRoles } from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";
import { hashPassword } from "./utils";

const MemoryStore = createMemoryStore(session);

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;
  updateUserRole(userId: number, role: string): Promise<User>;
  updateUserPassword(userId: number, newPassword: string): Promise<User>;

  // Store operations
  createStore(store: InsertStore): Promise<Store>;
  getStore(id: number): Promise<Store | undefined>;
  getAllStores(): Promise<Store[]>;
  getStoresByOwner(ownerId: number): Promise<Store[]>;
  deleteStore(id: number): Promise<void>;

  // Rating operations
  createRating(rating: InsertRating): Promise<Rating>;
  updateRating(id: number, rating: number): Promise<Rating>;
  getRatingsByStore(storeId: number): Promise<Rating[]>;
  getRatingsByUser(userId: number): Promise<Rating[]>;

  // Stats
  getTotalUsers(): Promise<number>;
  getTotalStores(): Promise<number>;
  getTotalRatings(): Promise<number>;

  sessionStore: session.Store;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private stores: Map<number, Store>;
  private ratings: Map<number, Rating>;
  private currentIds: { users: number; stores: number; ratings: number };
  sessionStore: session.Store;

  constructor() {
    this.users = new Map();
    this.stores = new Map();
    this.ratings = new Map();
    this.currentIds = { users: 1, stores: 1, ratings: 1 };
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000, // 24 hours
    });

    // Immediately initialize admin
    this.createInitialAdmin();
  }

  private async createInitialAdmin() {
    try {
      const adminPassword = await hashPassword("Admin@123"); // Strong default password
      const adminUser: User = {
        id: 1,
        name: "Admin User",
        email: "admin@store-ratings.com",
        password: adminPassword,
        address: "System Address",
        role: "admin"
      };
      this.users.set(adminUser.id, adminUser);
      console.log('Created default admin user:', { 
        ...adminUser, 
        password: '***',
        hashedPassword: adminPassword.substring(0, 10) + '...' 
      });
    } catch (error) {
      console.error('Failed to create admin user:', error);
      throw error;
    }
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(email: string): Promise<User | undefined> {
    console.log('Looking for user with email:', email);
    console.log('Current users:', Array.from(this.users.values()).map(u => ({ ...u, password: '***' })));
    return Array.from(this.users.values()).find(
      user => user.email.toLowerCase() === email.toLowerCase()
    );
  }

  async createUser(user: InsertUser): Promise<User> {
    const id = this.currentIds.users++;
    const role = userRoles.includes(user.role as any) ? user.role : 'user';
    const newUser = { 
      id,
      name: user.name,
      email: user.email.toLowerCase(), // Store email in lowercase
      password: user.password,
      address: user.address,
      role
    };
    this.users.set(id, newUser);
    console.log('Created user:', { ...newUser, password: '***' });
    return newUser;
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async updateUserRole(userId: number, role: string): Promise<User> {
    const user = this.users.get(userId);
    if (!user) throw new Error("User not found");
    if (!userRoles.includes(role as any)) {
      throw new Error("Invalid role");
    }

    const updatedUser = { ...user, role: role as typeof userRoles[number] };
    this.users.set(userId, updatedUser);
    return updatedUser;
  }

  async updateUserPassword(userId: number, newPassword: string): Promise<User> {
    const user = this.users.get(userId);
    if (!user) throw new Error("User not found");

    const updatedUser = { ...user, password: newPassword };
    this.users.set(userId, updatedUser);
    return updatedUser;
  }

  async createStore(store: InsertStore): Promise<Store> {
    const id = this.currentIds.stores++;
    const newStore = { ...store, id, ownerId: store.ownerId ?? null };
    this.stores.set(id, newStore);
    return newStore;
  }

  async getStore(id: number): Promise<Store | undefined> {
    return this.stores.get(id);
  }

  async getAllStores(): Promise<Store[]> {
    return Array.from(this.stores.values());
  }

  async getStoresByOwner(ownerId: number): Promise<Store[]> {
    return Array.from(this.stores.values()).filter(store => store.ownerId === ownerId);
  }

  async deleteStore(id: number): Promise<void> {
    this.stores.delete(id);
    // Also delete associated ratings
    this.ratings = new Map(
      Array.from(this.ratings.entries()).filter(([_, rating]) => rating.storeId !== id)
    );
  }

  async createRating(rating: InsertRating): Promise<Rating> {
    const id = this.currentIds.ratings++;
    const newRating = { ...rating, id, userId: rating.userId ?? null, storeId: rating.storeId ?? null };
    this.ratings.set(id, newRating);
    return newRating;
  }

  async updateRating(id: number, rating: number): Promise<Rating> {
    const existingRating = this.ratings.get(id);
    if (!existingRating) throw new Error("Rating not found");
    const updatedRating = { ...existingRating, rating };
    this.ratings.set(id, updatedRating);
    return updatedRating;
  }

  async getRatingsByStore(storeId: number): Promise<Rating[]> {
    return Array.from(this.ratings.values()).filter(rating => rating.storeId === storeId);
  }

  async getRatingsByUser(userId: number): Promise<Rating[]> {
    return Array.from(this.ratings.values()).filter(rating => rating.userId === userId);
  }

  async getTotalUsers(): Promise<number> {
    return this.users.size;
  }

  async getTotalStores(): Promise<number> {
    return this.stores.size;
  }

  async getTotalRatings(): Promise<number> {
    return this.ratings.size;
  }
}

export const storage = new MemStorage();