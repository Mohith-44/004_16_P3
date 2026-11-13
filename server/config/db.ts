import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { seedDatabaseIfEmpty } from '../utils/seedData.ts';

let memoryServer: MongoMemoryServer | null = null;
let isConnected = false;
let connectPromise: Promise<void> | null = null;

async function startInMemoryMongo(): Promise<string> {
  if (!memoryServer) {
    memoryServer = await MongoMemoryServer.create({
      instance: {
        dbName: 'hospital_ward_dispatcher',
      },
    });
  }
  return memoryServer.getUri();
}

export async function connectDatabase(): Promise<void> {
  if (isConnected && mongoose.connection.readyState === 1) {
    return;
  }
  if (connectPromise) {
    return connectPromise;
  }

  connectPromise = (async () => {
    const externalUri = process.env.MONGODB_URI?.trim();
    let connectedExternal = false;

    mongoose.set('strictQuery', true);

    if (externalUri) {
      try {
        console.log('[Database] Attempting connection to configured MONGODB_URI...');
        await mongoose.connect(externalUri, {
          serverSelectionTimeoutMS: 5000,
          connectTimeoutMS: 5000,
        });
        connectedExternal = true;
        console.log('[Database] Connected to external MongoDB via MONGODB_URI.');
      } catch (err) {
        const reason = err instanceof Error ? err.message : String(err);
        console.warn(
          `[Database] Could not connect to MONGODB_URI (${reason}). ` +
            'If using MongoDB Atlas, ensure Network Access allows 0.0.0.0/0 for cloud preview IPs. ' +
            'Falling back to local in-memory MongoDB server so the app remains operational.'
        );
        try {
          await mongoose.disconnect();
        } catch {
          // ignore cleanup error
        }
      }
    }

    if (!connectedExternal) {
      console.log('[Database] Starting in-memory MongoDB server...');
      const localUri = await startInMemoryMongo();
      await mongoose.connect(localUri);
      console.log('[Database] Connected to in-memory MongoDB.');
    }

    isConnected = true;
    await seedDatabaseIfEmpty();
  })().catch((err) => {
    connectPromise = null;
    throw err;
  });

  return connectPromise;
}

export async function disconnectDatabase(): Promise<void> {
  await mongoose.disconnect();
  if (memoryServer) {
    await memoryServer.stop();
    memoryServer = null;
  }
  isConnected = false;
  connectPromise = null;
}
