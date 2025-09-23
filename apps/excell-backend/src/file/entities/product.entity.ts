import type { ObjectId } from 'mongodb';

export const PRODUCTS_COLLECTION = 'products';

export interface Product {
  _id?: ObjectId;
  name: string;
  sku: string;
  price: number;
  category: string;
  stock: number;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}
