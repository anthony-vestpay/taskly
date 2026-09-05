import { NextResponse } from 'next/server';
import { ensureDefaultUsers, ensureIndexes, getCollections, serialize } from '../../../lib/db';

export async function GET() {
  try {
    await ensureIndexes();
    await ensureDefaultUsers();
    const { users } = await getCollections();
    const results = await users.find({}).sort({ createdAt: 1 }).toArray();
    return NextResponse.json(results.map(serialize));
  } catch (error) {
    console.error('Could not load users', error);
    return NextResponse.json({ error: 'Could not load users' }, { status: 500 });
  }
}
