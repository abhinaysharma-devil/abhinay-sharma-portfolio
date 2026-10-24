import { MongoClient, Db } from 'mongodb';

let client: MongoClient | null = null;
let clientPromise: Promise<MongoClient> | null = null;

export function getMongoUri(): string | undefined {
  return (
    process.env.MONGODB_URI ||
    process.env.MONGO_URI ||
    process.env.MONGO_URL ||
    process.env.VITE_MONGODB_URI
  );
}

export function isMongoConfigured(): boolean {
  const uri = getMongoUri();
  return Boolean(uri && uri.trim().length > 0 && !uri.includes('<username>'));
}

export async function getMongoClient(): Promise<MongoClient | null> {
  const uri = getMongoUri();
  if (!uri || !isMongoConfigured()) {
    return null;
  }

  if (client) {
    return client;
  }

  if (!clientPromise) {
    clientPromise = MongoClient.connect(uri, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000,
    }).then((connectedClient) => {
      client = connectedClient;
      return connectedClient;
    }).catch((err) => {
      clientPromise = null;
      console.warn('[MongoDB] Connection error:', err.message);
      return null as any;
    });
  }

  return clientPromise;
}

export async function getDatabase(): Promise<Db | null> {
  try {
    const mongoClient = await getMongoClient();
    if (!mongoClient) return null;
    return mongoClient.db();
  } catch (err: any) {
    console.warn('[MongoDB] Failed to retrieve database:', err.message);
    return null;
  }
}

export async function testMongoConnection(): Promise<{ connected: boolean; message: string }> {
  const uri = getMongoUri();
  if (!uri || !isMongoConfigured()) {
    return {
      connected: false,
      message: 'MongoDB URI is not configured yet. Using temporary in-memory storage.',
    };
  }

  try {
    const db = await getDatabase();
    if (!db) {
      return {
        connected: false,
        message: 'Could not connect to MongoDB. Check credentials or network access.',
      };
    }
    await db.command({ ping: 1 });
    return { connected: true, message: 'Connected to MongoDB successfully' };
  } catch (err: any) {
    return { connected: false, message: `MongoDB error: ${err.message}` };
  }
}
