import mongooseModule from "mongoose";

const MONGODB_URI = process.env.NEXT_PUBLIC_MONGODB_URI as string;

if (!MONGODB_URI) {
  throw new Error(
    "Please define the NEXT_PUBLIC_MONGODB_URI environment variable in .env.local",
  );
}

type MongooseCache = {
  conn: typeof mongooseModule | null;
  promise: Promise<typeof mongooseModule> | null;
};

declare global {
  // eslint-disable-next-line no-var
  var _mongooseCache: MongooseCache | undefined;
}

let cached: MongooseCache;
if (!global._mongooseCache) {
  global._mongooseCache = { conn: null, promise: null };
}
cached = global._mongooseCache;

async function dbConnect() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = (async () => {
      const mongooseInstance = await mongooseModule.connect(MONGODB_URI, {
        bufferCommands: false,
      });
      console.log("✅ Connected to MongoDB");
      return mongooseInstance;
    })();
  }

  cached.conn = await cached.promise;
  return cached.conn;
}

export default dbConnect;
