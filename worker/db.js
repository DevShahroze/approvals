import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "..", ".env.local") });
dotenv.config({ path: path.join(__dirname, "..", ".env") });

export async function connectWorkerDB() {
  if (!process.env.MONGODB_URI) {
    throw new Error("MONGODB_URI required for worker");
  }
  if (mongoose.connection.readyState === 1) return mongoose.connection;
  return mongoose.connect(process.env.MONGODB_URI);
}
