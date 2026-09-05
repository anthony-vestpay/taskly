import { NextResponse } from 'next/server';
import { getCollections, serialize, toObjectId } from '../../../lib/db';

export async function GET(request: Request) {
  const taskId = toObjectId(new URL(request.url).searchParams.get('taskId') ?? '');
  if (!taskId) return NextResponse.json({ error: 'taskId is required' }, { status: 400 });

  try {
    const { comments, users } = await getCollections();
    const results = await comments.find({ taskId }).sort({ createdAt: 1 }).toArray();
    const authorIds = [...new Map(results.map(comment => [comment.authorId.toHexString(), comment.authorId])).values()];
    const authors = await users.find({ _id: { $in: authorIds } }).toArray();
    const authorsById = new Map(authors.map(author => [author._id.toHexString(), serialize(author)]));
    return NextResponse.json(results.map(comment => ({ ...serialize(comment), author: authorsById.get(comment.authorId.toHexString()) } )));
  } catch (error) {
    console.error('Could not load comments', error);
    return NextResponse.json({ error: 'Could not load comments' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: 'Request body must be valid JSON' }, { status: 400 }); }

  const taskId = toObjectId(typeof body.taskId === 'string' ? body.taskId : '');
  const authorId = toObjectId(typeof body.authorId === 'string' ? body.authorId : '');
  const text = typeof body.body === 'string' ? body.body.trim() : '';
  if (!taskId) return NextResponse.json({ error: 'taskId is required' }, { status: 400 });
  if (!text) return NextResponse.json({ error: 'Comment cannot be empty' }, { status: 400 });
  if (!authorId) return NextResponse.json({ error: 'authorId is required' }, { status: 400 });

  try {
    const { comments, tasks, users } = await getCollections();
    const [task, author] = await Promise.all([tasks.findOne({ _id: taskId }), users.findOne({ _id: authorId })]);
    if (!task) return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    if (!author) return NextResponse.json({ error: 'Author not found' }, { status: 400 });

    const comment = { taskId, authorId, body: text, createdAt: new Date() };
    const result = await comments.insertOne(comment);
    return NextResponse.json({ ...serialize({ _id: result.insertedId, ...comment }), author: serialize(author) }, { status: 201 });
  } catch (error) {
    console.error('Could not create comment', error);
    return NextResponse.json({ error: 'Could not create comment' }, { status: 500 });
  }
}
