import mongoose from "mongoose";

/**
 * Prefer a dedicated local DB for tests (reliable on this machine).
 * Override with TEST_MONGO_URI if needed.
 * Falls back to mongodb-memory-server only when explicitly requested.
 */
const DEFAULT_TEST_URI =
  process.env.TEST_MONGO_URI ||
  `mongodb://127.0.0.1:27017/${process.env.TEST_MONGO_DB || "codetrack_test"}`;

let memoryServer = null;

export async function connectTestDb() {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection.client.s.url;
  }

  if (process.env.USE_MEMORY_MONGO === "1") {
    const { MongoMemoryServer } = await import("mongodb-memory-server");
    memoryServer = await MongoMemoryServer.create({
      instance: { launchTimeout: 60_000 },
    });
    const uri = memoryServer.getUri();
    await mongoose.connect(uri);
    return uri;
  }

  await mongoose.connect(DEFAULT_TEST_URI);
  return DEFAULT_TEST_URI;
}

export async function clearTestDb() {
  if (mongoose.connection.readyState !== 1) return;
  const collections = mongoose.connection.collections;
  for (const key of Object.keys(collections)) {
    await collections[key].deleteMany({});
  }
}

export async function disconnectTestDb() {
  if (mongoose.connection.readyState !== 0) {
    // Drop the dedicated test DB so leftovers never pollute other envs
    try {
      if (String(mongoose.connection.name || "").startsWith("codetrack_test")) {
        await mongoose.connection.dropDatabase();
      }
    } catch {
      /* ignore */
    }
    await mongoose.disconnect();
  }
  if (memoryServer) {
    await memoryServer.stop();
    memoryServer = null;
  }
}
