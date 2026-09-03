import { NextResponse } from 'next/server';
import { db } from '../../../lib/db';

export async function GET() {
  try { return NextResponse.json(await db.task.findMany({ orderBy: [{ status: 'asc' }, { position: 'asc' }] })); }
  catch { return NextResponse.json({ error: 'Database unavailable' }, { status: 503 }); }
}

export async function POST(request: Request) {
  const body = await request.json();
  if (!body.title?.trim()) return NextResponse.json({ error: 'Title is required' }, { status: 400 });
  try {
    const count = await db.task.count({ where: { status: body.status ?? 'TODO' } });
    const task = await db.task.create({ data: { title: body.title.trim(), details: body.details || null, status: body.status ?? 'TODO', priority: body.priority ?? 'MEDIUM', dueDate: body.dueDate ? new Date(body.dueDate) : null, position: count } });
    return NextResponse.json(task, { status: 201 });
  } catch { return NextResponse.json({ error: 'Could not create task' }, { status: 500 }); }
}
