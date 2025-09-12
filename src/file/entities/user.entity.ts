import type { ObjectId } from 'mongodb';

export const USERS_COLLECTION = 'users';

export interface User {
  _id?: ObjectId;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  birthDate?: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
