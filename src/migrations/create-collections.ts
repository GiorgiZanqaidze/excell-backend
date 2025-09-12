import { MongoClient, type Db } from 'mongodb';
import { USERS_COLLECTION } from '../file/entities/user.entity';
import { PRODUCTS_COLLECTION } from '../file/entities/product.entity';

async function ensureCollection(db: Db, name: string): Promise<void> {
  const exists = await db.listCollections({ name }).hasNext();
  if (!exists) {
    await db.createCollection(name);

    console.log(`Created collection: ${name}`);
  }
}

async function run(): Promise<void> {
  const uri =
    process.env.MONGO_URI ||
    `mongodb://${process.env.MONGO_HOST ?? 'localhost'}:${
      process.env.MONGO_PORT ?? 27017
    }`;
  const dbName = process.env.MONGO_DB ?? 'excell_backend';

  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db(dbName);

    // Ensure collections exist
    await ensureCollection(db, USERS_COLLECTION);
    await ensureCollection(db, PRODUCTS_COLLECTION);

    // Create indexes (idempotent)
    await db
      .collection(USERS_COLLECTION)
      .createIndex({ email: 1 }, { unique: true });
    await db.collection(USERS_COLLECTION).createIndex({ createdAt: -1 });

    await db
      .collection(PRODUCTS_COLLECTION)
      .createIndex({ sku: 1 }, { unique: true });
    await db.collection(PRODUCTS_COLLECTION).createIndex({ createdAt: -1 });

    console.log('Migration completed successfully.');
  } finally {
    await client.close();
  }
}

run().catch((error) => {
  console.error('Migration failed:', error);
  process.exit(1);
});
