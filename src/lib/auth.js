import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { JWT_SECRET, ADMIN_JWT_SECRET } from '../config.js';

const SALT_ROUNDS = 10;

export async function hashPassword(password) {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function comparePassword(password, hashedPassword) {
  return bcrypt.compare(password, hashedPassword);
}

export function createToken(userId) {
  return jwt.sign({ sub: userId }, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

export function createAdminToken() {
  return jwt.sign({ sub: 'admin', role: 'admin' }, ADMIN_JWT_SECRET, { expiresIn: '7d' });
}

export function verifyAdminToken(token) {
  return jwt.verify(token, ADMIN_JWT_SECRET);
}
