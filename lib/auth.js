import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { getDb, HttpError, ser } from './mongodb';
import { ObjectId } from 'mongodb';

const COOKIE = 'aar_session';
const MAX_AGE = 60 * 60 * 24 * 7; // 7 days

function secret() {
  const s = process.env.JWT_SECRET;
  if (!s || s.length < 16) {
    throw new Error('JWT_SECRET is missing or too short. Set a long random value in .env.local / Vercel.');
  }
  return new TextEncoder().encode(s);
}

export async function startSession(userId) {
  const token = await new SignJWT({ uid: String(userId) })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secret());
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: MAX_AGE,
  });
}

export async function endSession() {
  (await cookies()).set(COOKIE, '', { httpOnly: true, path: '/', maxAge: 0 });
}

// Returns the signed-in admin (with id) or null
export async function getSession() {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    const db = await getDb();
    const u = await db.collection('users').findOne({ _id: new ObjectId(payload.uid) });
    return u ? ser(u) : null;
  } catch {
    return null;
  }
}

export const json = (data, status = 200) => NextResponse.json(data, { status });
export const fail = (message, status = 400) => NextResponse.json({ error: message }, { status });

// Wrap a route so any thrown error becomes a clean JSON response
export function handler(fn) {
  return async (req, ctx) => {
    try {
      return await fn(req, ctx);
    } catch (e) {
      if (e instanceof HttpError) return fail(e.message, e.status);
      if (e && e.code === 11000) return fail('That record already exists.', 409);
      console.error(e);
      return fail(e.message || 'Server error', 500);
    }
  };
}

// Require a signed-in admin. { main: true } requires the Main Admin.
export async function requireUser({ main = false } = {}) {
  const u = await getSession();
  if (!u) throw new HttpError('Please sign in.', 401);
  if (main && u.role !== 'main') throw new HttpError('Only the Main Admin can do this.', 403);
  return u;
}

export async function body(req) {
  try {
    return await req.json();
  } catch {
    throw new HttpError('Invalid request body');
  }
}

export const clean = (v, max = 120) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
