import dns from 'node:dns';
import { MongoClient, ObjectId } from 'mongodb';

// Optional: some networks (e.g. phone hotspots) give Node a DNS reply it cannot read ("querySrv EBADRESP").
// Setting DNS_SERVERS=8.8.8.8,1.1.1.1 in .env.local makes Node use those public DNS servers instead.
if (process.env.DNS_SERVERS) {
  const list = process.env.DNS_SERVERS.split(',').map((s) => s.trim()).filter(Boolean);
  if (list.length) dns.setServers(list);
}

const globalRef = globalThis;
if (!globalRef._aarMongo) globalRef._aarMongo = { promise: null, indexed: false };
const state = globalRef._aarMongo;

export async function getDb() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI is not set. Add it to .env.local (or to Vercel > Settings > Environment Variables).');
  }
  if (!state.promise) {
    state.promise = new MongoClient(uri, { serverSelectionTimeoutMS: 8000 })
      .connect()
      .catch((e) => {
        state.promise = null;
        throw new Error('Cannot connect to MongoDB: ' + e.message);
      });
  }
  const client = await state.promise;
  const db = client.db(process.env.MONGODB_DB || 'annual_attendance');
  if (!state.indexed) {
    await Promise.all([
      db.collection('users').createIndex({ username: 1 }, { unique: true }),
      db.collection('assignments').createIndex({ staffId: 1, shiftId: 1, date: 1 }, { unique: true }),
      db.collection('assignments').createIndex({ date: 1 }),
      db.collection('leaves').createIndex({ from: 1, to: 1 }),
      db.collection('leaves').createIndex({ staffId: 1 }),
    ]);
    state.indexed = true;
  }
  return db;
}

export class HttpError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}

export function oid(id) {
  if (!ObjectId.isValid(id)) throw new HttpError('Invalid id', 400);
  return new ObjectId(id);
}

// Turn a MongoDB document into a plain JSON object with "id"
export function ser(doc) {
  if (!doc) return doc;
  const { _id, passwordHash, ...rest } = doc;
  return { id: String(_id), ...rest };
}

export const DEFAULT_SETTINGS = {
  maxConcurrent: 3,
  quota: 45,
  departments: [
    'Emergency', 'ICU', 'OPD', 'Surgery', 'Pediatrics', 'Maternity',
    'Laboratory', 'Radiology', 'Pharmacy', 'Administration',
  ],
};

export async function getSettings(db) {
  const doc = await db.collection('settings').findOne({ _id: 'main' });
  return { ...DEFAULT_SETTINGS, ...(doc || {}), _id: undefined };
}

export const DEFAULT_SHIFTS = [
  { name: 'Morning', start: '06:00', end: '14:00', color: '#f59e0b' },
  { name: 'Evening', start: '14:00', end: '22:00', color: '#ef476f' },
  { name: 'Night', start: '22:00', end: '06:00', color: '#6d4aff' },
];
