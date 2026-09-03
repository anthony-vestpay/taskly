import { Prisma } from '@prisma/client';
import { NextResponse } from 'next/server';
import { db } from '../../../../lib/db';

const statuses = new Set(['TODO', 'IN_PROGRESS', 'TEST', 'DEPLOYED', 'COMPLETE']);
const priorities = new Set(['LOW', 'MEDIUM', 'HIGH']);

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let body: Record<string, unknown>;

  try { body = await request.json(); }
  catch { return NextResponse.json({ error: 'Request body must be valid JSON' }, { status: 400 }); }

  if (body.status !== undefined && (typeof body.status !== 'string' || !statuses.has(body.status))) return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
  if (body.priority !== undefined && (typeof body.priority !== 'string' || !priorities.has(body.priority))) return NextResponse.json({ error: 'Invalid priority' }, { status: 400 });
  if (body.title !== undefined && (typeof body.title !== 'string' || !body.title.trim())) return NextResponse.json({ error: 'Title is required' }, { status: 400 });

  const data = {
    ...(typeof body.title === 'string' && { title: body.title.trim() }),
    ...(body.details !== undefined && { details: typeof body.details === 'string' && body.details ? body.details : null }),
    ...(typeof body.status === 'string' && { status: body.status }),
    ...(typeof body.priority === 'string' && { priority: body.priority }),
    ...(body.dueDate !== undefined && { dueDate: typeof body.dueDate === 'string' && body.dueDate ? new Date(body.dueDate) : null }),
  };

  try { return NextResponse.json(await db.task.update({ where: { id }, data })); }
  catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    console.error('Could not update task', error);
    return NextResponse.json({ error: 'Could not update task' }, { status: 500 });
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try { await db.task.delete({ where: { id: (await params).id } }); return new NextResponse(null, { status: 204 }); }
  catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    return NextResponse.json({ error: 'Could not delete task' }, { status: 500 });
  }
}
