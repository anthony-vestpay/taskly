import { MongoClient, ObjectId, type Document, type WithId } from 'mongodb';

const uri = process.env.MONGODB_URI;
if (!uri) throw new Error('MONGODB_URI is required');

const databaseName = process.env.MONGODB_DB ?? 'taskly';
const globalForMongo = globalThis as typeof globalThis & { mongoClientPromise?: Promise<MongoClient> };

const clientPromise = globalForMongo.mongoClientPromise ?? new MongoClient(uri).connect();
if (process.env.NODE_ENV !== 'production') globalForMongo.mongoClientPromise = clientPromise;

export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'TEST' | 'DEPLOYED' | 'COMPLETE';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH';

export type TaskDocument = Document & {
  title: string;
  details?: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: Date | null;
  position: number;
  createdAt: Date;
  updatedAt: Date;
};

export type UserDocument = Document & {
  name: string;
  initials: string;
  color: string;
  createdAt: Date;
};

export type CommentDocument = Document & {
  body: string;
  taskId: ObjectId;
  authorId: ObjectId;
  createdAt: Date;
};

export async function getDatabase() {
  return (await clientPromise).db(databaseName);
}

export async function getCollections() {
  const database = await getDatabase();
  return {
    tasks: database.collection<TaskDocument>('tasks'),
    users: database.collection<UserDocument>('users'),
    comments: database.collection<CommentDocument>('comments'),
  };
}

export function toObjectId(value: string) {
  return ObjectId.isValid(value) ? new ObjectId(value) : null;
}

export function serialize<T extends Document>(document: WithId<T>) {
  const { _id, ...fields } = document;
  return { id: _id.toHexString(), ...fields };
}

export async function ensureIndexes() {
  const { tasks, users, comments } = await getCollections();
  await Promise.all([
    tasks.createIndex({ status: 1, position: 1 }),
    users.createIndex({ createdAt: 1 }),
    comments.createIndex({ taskId: 1, createdAt: 1 }),
  ]);
}

export async function ensureDefaultUsers() {
  const { users } = await getCollections();
  if (await users.countDocuments({})) return;

  const createdAt = new Date();
  await users.insertMany([
    { name: 'Jordan Davis', initials: 'JD', color: '#46588f', createdAt },
    { name: 'Alex Chen', initials: 'AC', color: '#48a88a', createdAt },
    { name: 'Sam Ibarra', initials: 'SI', color: '#b37b26', createdAt },
  ]);
}
