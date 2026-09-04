import { NextResponse } from 'next/server';
import { db } from '../../../lib/db';

export async function GET() {
  try {
    const users = await db.user.findMany({ orderBy: { createdAt: 'asc' } });
    return NextResponse.json(users);
  } catch (error) {
    console.error('Could not load users', error);
    return NextResponse.json({ error: 'Could not load users' }, { status: 500 });
  }
}
