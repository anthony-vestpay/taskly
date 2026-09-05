import { NextResponse } from 'next/server';
import { getCollections, serialize, toObjectId, type TaskPriority, type TaskStatus } from '../../../../lib/db';

const statuses = new Set<TaskStatus>(['TODO', 'IN_PROGRESS', 'TEST', 'DEPLOYED', 'COMPLETE']);
const priorities = new Set<TaskPriority>(['LOW', 'MEDIUM', 'HIGH']);

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const id = toObjectId((await params).id);
  if (!id) return NextResponse.json({ error: 'Task not found' }, { status: 404 });

  let body: Record<string, unknown>;
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: 'Request body must be valid JSON' }, { status: 400 }); }

  if (body.status !== undefined && (typeof body.status !== 'string' || !statuses.has(body.status as TaskStatus))) return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
  if (body.priority !== undefined && (typeof body.priority !== 'string' || !priorities.has(body.priority as TaskPriority))) return NextResponse.json({ error: 'Invalid priority' }, { status: 400 });
  if (body.title !== undefined && (typeof body.title !== 'string' || !body.title.trim())) return NextResponse.json({ error: 'Title is required' }, { status: 400 });

  const updates = {
    ...(typeof body.title === 'string' && { title: body.title.trim() }),
    ...(body.details !== undefined && { details: typeof body.details === 'string' && body.details.trim() ? body.details.trim() : null }),
    ...(typeof body.status === 'string' && { status: body.status as TaskStatus }),
    ...(typeof body.priority === 'string' && { priority: body.priority as TaskPriority }),
    ...(body.dueDate !== undefined && { dueDate: typeof body.dueDate === 'string' && body.dueDate ? new Date(body.dueDate) : null }),
    updatedAt: new Date(),
  };

  try {
    const { tasks } = await getCollections();
    const result = await tasks.findOneAndUpdate({ _id: id }, { $set: updates }, { returnDocument: 'after' });
    if (!result) return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    return NextResponse.json(serialize(result));
  } catch (error) {
    console.error('Could not update task', error);
    return NextResponse.json({ error: 'Could not update task' }, { status: 500 });
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const id = toObjectId((await params).id);
  if (!id) return NextResponse.json({ error: 'Task not found' }, { status: 404 });

  try {
    const { tasks, comments } = await getCollections();
    const result = await tasks.deleteOne({ _id: id });
    if (!result.deletedCount) return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    await comments.deleteMany({ taskId: id });
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Could not delete task', error);
    return NextResponse.json({ error: 'Could not delete task' }, { status: 500 });
  }
}
