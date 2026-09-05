import { NextResponse } from 'next/server';
import { ensureIndexes, getCollections, serialize, type TaskPriority, type TaskStatus } from '../../../lib/db';

const statuses = new Set<TaskStatus>(['TODO', 'IN_PROGRESS', 'TEST', 'DEPLOYED', 'COMPLETE']);
const priorities = new Set<TaskPriority>(['LOW', 'MEDIUM', 'HIGH']);

export async function GET() {
  try {
    await ensureIndexes();
    const { tasks } = await getCollections();
    const results = await tasks.find({}).sort({ status: 1, position: 1 }).toArray();
    return NextResponse.json(results.map(serialize));
  } catch (error) {
    console.error('Could not load tasks', error);
    return NextResponse.json({ error: 'Database unavailable' }, { status: 503 });
  }
}

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: 'Request body must be valid JSON' }, { status: 400 }); }

  const title = typeof body.title === 'string' ? body.title.trim() : '';
  const status = typeof body.status === 'string' && statuses.has(body.status as TaskStatus) ? body.status as TaskStatus : 'TODO';
  const priority = typeof body.priority === 'string' && priorities.has(body.priority as TaskPriority) ? body.priority as TaskPriority : 'MEDIUM';
  if (!title) return NextResponse.json({ error: 'Title is required' }, { status: 400 });

  try {
    await ensureIndexes();
    const { tasks } = await getCollections();
    const position = await tasks.countDocuments({ status });
    const now = new Date();
    const task = {
      title,
      details: typeof body.details === 'string' && body.details.trim() ? body.details.trim() : null,
      status,
      priority,
      dueDate: typeof body.dueDate === 'string' && body.dueDate ? new Date(body.dueDate) : null,
      position,
      createdAt: now,
      updatedAt: now,
    };
    const result = await tasks.insertOne(task);
    return NextResponse.json(serialize({ _id: result.insertedId, ...task }), { status: 201 });
  } catch (error) {
    console.error('Could not create task', error);
    return NextResponse.json({ error: 'Could not create task' }, { status: 500 });
  }
}
