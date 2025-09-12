import { MongoClient } from 'mongodb';
import { USERS_COLLECTION, type User } from '../file/entities/user.entity';
import {
  PRODUCTS_COLLECTION,
  type Product,
} from '../file/entities/product.entity';

function buildUsers(): User[] {
  const now = new Date();
  return [
    {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      phone: '+995555123456',
      birthDate: new Date('1990-01-01'),
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'jane.smith@example.com',
      phone: '+995555789012',
      birthDate: new Date('1985-05-15'),
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      firstName: 'Michael',
      lastName: 'Johnson',
      email: 'michael.johnson@example.com',
      phone: '+995555222333',
      birthDate: new Date('1992-03-10'),
      isActive: false,
      createdAt: now,
      updatedAt: now,
    },
    {
      firstName: 'Emily',
      lastName: 'Brown',
      email: 'emily.brown@example.com',
      phone: '+995555444555',
      birthDate: new Date('1995-07-22'),
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      firstName: 'David',
      lastName: 'Wilson',
      email: 'david.wilson@example.com',
      phone: '+995555666777',
      birthDate: new Date('1988-11-30'),
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
  ];
}

function buildProducts(): Product[] {
  const now = new Date();
  return [
    {
      name: 'Laptop Computer',
      sku: 'LAP-001',
      price: 999.99,
      category: 'Electronics',
      stock: 50,
      description: 'High-performance laptop for professionals',
      createdAt: now,
      updatedAt: now,
    },
    {
      name: 'Wireless Mouse',
      sku: 'MOU-001',
      price: 29.99,
      category: 'Accessories',
      stock: 100,
      description: 'Ergonomic wireless mouse',
      createdAt: now,
      updatedAt: now,
    },
    {
      name: 'Mechanical Keyboard',
      sku: 'KEY-001',
      price: 79.99,
      category: 'Accessories',
      stock: 70,
      description: 'Backlit mechanical keyboard with blue switches',
      createdAt: now,
      updatedAt: now,
    },
    {
      name: '4K Monitor',
      sku: 'MON-001',
      price: 399.99,
      category: 'Electronics',
      stock: 25,
      description: '27-inch 4K UHD monitor',
      createdAt: now,
      updatedAt: now,
    },
    {
      name: 'USB-C Dock',
      sku: 'DOC-001',
      price: 59.99,
      category: 'Accessories',
      stock: 80,
      description: 'Multi-port USB-C docking station',
      createdAt: now,
      updatedAt: now,
    },
  ];
}

async function run(): Promise<void> {
  const uri =
    process.env.MONGO_URI ||
    `mongodb://${process.env.MONGO_HOST ?? 'localhost'}:${
      process.env.MONGO_PORT ?? 27017
    }`;
  const dbName = process.env.MONGO_DB ?? 'excell_backend';

  const client = new MongoClient(uri);
  await client.connect();
  try {
    const db = client.db(dbName);

    // Users
    const usersCol = db.collection<User>(USERS_COLLECTION);
    const usersCount = await usersCol.countDocuments();
    if (usersCount === 0) {
      await usersCol.insertMany(buildUsers(), { ordered: true });
      console.log('Seeded users collection with 5 documents.');
    } else {
      console.log(
        `Users collection already has ${usersCount} documents. Skipping.`,
      );
    }

    // Products
    const productsCol = db.collection<Product>(PRODUCTS_COLLECTION);
    const productsCount = await productsCol.countDocuments();
    if (productsCount === 0) {
      await productsCol.insertMany(buildProducts(), { ordered: true });
      console.log('Seeded products collection with 5 documents.');
    } else {
      console.log(
        `Products collection already has ${productsCount} documents. Skipping.`,
      );
    }

    console.log('Seeding completed successfully.');
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

run();
