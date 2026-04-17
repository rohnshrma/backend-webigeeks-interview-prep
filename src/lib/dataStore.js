import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataFilePath = path.join(__dirname, '../data/users.json');

export async function readUsers() {
  const raw = await fs.readFile(dataFilePath, 'utf8');
  return JSON.parse(raw);
}

export async function writeUsers(users) {
  await fs.writeFile(dataFilePath, JSON.stringify(users, null, 2));
}
