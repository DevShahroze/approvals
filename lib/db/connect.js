import mongoose from "mongoose";
import { isMongoConfigured } from "@/lib/env";

const globalForMongoose = global;

let cached = globalForMongoose.mongoose;

if (!cached) {
  cached = globalForMongoose.mongoose = { conn: null, promise: null };
}

export async function connectDB() {
  if (!isMongoConfigured()) {
    throw new Error("MONGODB_URI is not configured");
  }

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = { bufferCommands: false };
    cached.promise = mongoose.connect(process.env.MONGODB_URI, opts).then((m) => m);
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export async function pingDB() {
  if (!isMongoConfigured()) {
    return { configured: false, connected: false };
  }
  try {
    await connectDB();
    return { configured: true, connected: mongoose.connection.readyState === 1 };
  } catch {
    return { configured: true, connected: false };
  }
}
