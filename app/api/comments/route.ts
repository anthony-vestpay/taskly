import { Prisma } from '@prisma/client';
import { NextResponse } from 'next/server';
import { db } from '../../../lib/db';

export async function GET(request: Request) {
  const taskId = new URL(request.url).searchParams.get('taskId');
  if (!taskId) return NextResponse.json({ error: 'taskId is required' }, { status: 400 });
  try {
    const comments = await db.comment.findMany({ where: { taskId }, orderBy: { createdAt: 'asc' } });
    return NextResponse.json(comments);
  } catch (error) {
    console.error('Could not load comments', error);
    return NextResponse.json({ error: 'Could not load comments' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: 'Request body must be valid JSON' }, { status: 400 }); }
  const taskId = typeof body.taskId === 'string' ? body.taskId : '';
  const text = typeof body.body === 'string' ? body.body.trim() : '';
  const author = typeof body.author === 'string' && body.author.trim() ? body.author.trim() : 'JD';
  if (!taskId) return NextResponse.json({ error: 'taskId is required' }, { status: 400 });
  if (!text) return NextResponse.json({ error: 'Comment cannot be empty' }, { status: 400 });
  try {
    const comment = await db.comment.create({ data: { taskId, body: text, author } });
    return NextResponse.json(comment, { status: 201 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    console.error('Could not create comment', error);
    return NextResponse.json({ error: 'Could not create comment' }, { status: 500 });
  }
}
