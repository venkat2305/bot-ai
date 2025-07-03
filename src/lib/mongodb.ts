import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI as string | undefined;

if (!MONGODB_URI) {
  throw new Error(
    'Please define the MONGODB_URI environment variable inside .env.local'
  );
}

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development. This prevents connections from growing exponentially
 * during API Route usage.
 */
interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

let cached = (global as any).mongoose as MongooseCache | undefined;

if (!cached) {
  cached = { conn: null, promise: null };
  (global as any).mongoose = cached;
}

async function dbConnect() {
  if (cached!.conn) {
    return cached!.conn;
  }

  if (!cached!.promise) {
    const opts = {
      bufferCommands: false,
    };

    cached!.promise = mongoose
      .connect(MONGODB_URI as string, opts)
      .then((mongoose) => {
      return mongoose;
    });
  }
  cached!.conn = await cached!.promise;
  return cached!.conn;
}

export default dbConnect; 