import { MongoClient, type Db } from 'mongodb';
import { PRODUCTS_COLLECTION } from '../file/entities/product.entity';
import { USERS_COLLECTION } from '../file/entities/user.entity';
import { LOGS_COLLECTION } from '../logging/entities/log-entry.entity';

async function dropCollection(db: Db, name: string): Promise<void> {
  const exists = await db.listCollections({ name }).hasNext();
  if (exists) {
    await db.collection(name).drop();
    console.log(`Dropped collection: ${name}`);
  } else {
    console.log(`Collection ${name} does not exist, skipping...`);
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

    console.log('Starting to drop all collections...');

    // Drop all collections
    await dropCollection(db, USERS_COLLECTION);
    await dropCollection(db, PRODUCTS_COLLECTION);
    await dropCollection(db, LOGS_COLLECTION);

    console.log('All collections dropped successfully.');
  } finally {
    await client.close();
  }
}

run().catch((error) => {
  console.error('Drop collections failed:', error);
  process.exit(1);
});
