'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Plus, Search, SlidersHorizontal, MoreHorizontal, CalendarDays, X, Sparkles, MessageCircle, Send } from 'lucide-react';

type Status = 'TODO' | 'IN_PROGRESS' | 'TEST' | 'DEPLOYED' | 'COMPLETE';
type Priority = 'LOW' | 'MEDIUM' | 'HIGH';
type Task = { id: string; title: string; details?: string | null; status: Status; priority: Priority; dueDate?: string | null };
type User = { id: string; name: string; initials: string; color: string };
type Comment = { id: string; body: string; author: User; createdAt: string };
const columns: { key: Status; label: string; color: string }[] = [
  { key: 'TODO', label: 'Todo', color: '#7c6cf2' }, { key: 'IN_PROGRESS', label: 'In progress', color: '#eea33a' }, { key: 'TEST', label: 'Test', color: '#48a88a' }, { key: 'DEPLOYED', label: 'Deployed', color: '#4a8dd8' }, { key: 'COMPLETE', label: 'Complete', color: '#9ca3af' }
];
const initial: Task[] = [];

export default function Home() {
  const [tasks, setTasks] = useState<Task[]>(initial);
  const [isLoading, setIsLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState<Status | null>(null);
  const [modal, setModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<Status | null>(null);
  const draggedTaskId = useRef<string | null>(null);
  const [comments, setComments] = useState<Record<string, Comment[]>>({});
  const [commentTask, setCommentTask] = useState<Task | null>(null);
  const [commentDraft, setCommentDraft] = useState('');
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentSubmitting, setCommentSubmitting] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [currentUserId, setCurrentUserId] = useState('');
  const currentUser = users.find(u => u.id === currentUserId);

  useEffect(() => {
    fetch('/api/tasks')
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (Array.isArray(data)) setTasks(data); })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    fetch('/api/users')
      .then(r => r.ok ? r.json() : [])
      .then((data: User[]) => {
        if (!Array.isArray(data)) return;
        setUsers(data);
        const stored = localStorage.getItem('currentUserId');
        setCurrentUserId(data.some(u => u.id === stored) ? stored! : (data[0]?.id ?? ''));
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (currentUserId) localStorage.setItem('currentUserId', currentUserId);
  }, [currentUserId]);
  const visible = useMemo(() => tasks.filter(t => !query || t.title.toLowerCase().includes(query.toLowerCase())), [tasks, query]);

  async function addTask(e: React.FormEvent) {
    e.preventDefault(); if (!newTitle.trim()) return;
    const optimistic = { id: crypto.randomUUID(), title: newTitle.trim(), status: active ?? 'TODO', priority: 'MEDIUM' as Priority };
    setTasks(v => [...v, optimistic]); setNewTitle(''); setModal(false);
    try { const r = await fetch('/api/tasks', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ title: optimistic.title, status: optimistic.status }) }); if (r.ok) { const saved = await r.json(); setTasks(v => v.map(t => t.id === optimistic.id ? saved : t)); } } catch {}
  }

  async function move(id: string, status: Status) {
    const previous = tasks.find(task => task.id === id)?.status;
    if (!previous || previous === status) return;
    setTasks(v => v.map(t => t.id === id ? {...t, status} : t));
    try {
      const response = await fetch(`/api/tasks/${id}`, { method: 'PATCH', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ status }) });
      if (!response.ok) throw new Error('Could not save status');
    } catch { setTasks(v => v.map(t => t.id === id ? {...t, status: previous} : t)); }
  }

  function clearDragState() {
    draggedTaskId.current = null;
    setDraggedId(null);
    setDropTarget(null);
  }
  function handleDragStart(event: React.DragEvent<HTMLElement>, id: string) {
    draggedTaskId.current = id;
    setDraggedId(id);
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', id);
  }
  function handleDrop(event: React.DragEvent<HTMLDivElement>, status: Status) {
    event.preventDefault();
    event.stopPropagation();
    const id = draggedTaskId.current || event.dataTransfer.getData('text/plain');
    if (id) void move(id, status);
    clearDragState();
  }

  async function openComments(task: Task) {
    setCommentTask(task);
    setCommentDraft('');
    setCommentsLoading(true);
    try {
      const response = await fetch(`/api/comments?taskId=${encodeURIComponent(task.id)}`);
      if (!response.ok) throw new Error('Could not load comments');
      const data = await response.json();
      if (Array.isArray(data)) setComments(current => ({ ...current, [task.id]: data }));
    } catch {} finally { setCommentsLoading(false); }
  }

  async function addComment(event: React.FormEvent) {
    event.preventDefault();
    if (!commentTask || !commentDraft.trim() || commentSubmitting || !currentUserId) return;
    setCommentSubmitting(true);
    try {
      const response = await fetch('/api/comments', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ taskId: commentTask.id, body: commentDraft.trim(), authorId: currentUserId }) });
      if (!response.ok) throw new Error('Could not create comment');
      const comment = await response.json();
      setComments(current => ({ ...current, [commentTask.id]: [...(current[commentTask.id] ?? []), comment] }));
      setCommentDraft('');
    } catch {} finally { setCommentSubmitting(false); }
  }

  return <main className="shell"><header className="topbar"><div className="brand"><div className="brandmark"><Sparkles size={16}/></div><span>taskly</span></div><div className="workspace"><div className="avatar">JD</div><span>Jordan's workspace</span><span className="chevron">⌄</span></div><div className="top-actions"><button className="icon-button"><span className="help">?</span></button><select className="user-switcher" value={currentUserId} onChange={e => setCurrentUserId(e.target.value)} style={currentUser ? { background: currentUser.color } : undefined} aria-label="Current user">{users.map(u => <option key={u.id} value={u.id}>{u.initials} — {u.name}</option>)}</select></div></header>
    <section className="hero"><div><div className="eyebrow">PROJECT / PRODUCT</div><h1>Product launch <span>✦</span></h1><p>Keep the momentum going. Small steps, shipped well.</p></div><div className="hero-actions"><button className="secondary"><SlidersHorizontal size={15}/> Filter</button><button className="primary" onClick={() => {setActive(null); setModal(true)}}><Plus size={16}/> Add task</button></div></section>
    <div className="toolbar"><div className="search"><Search size={16}/><input placeholder="Search tasks..." value={query} onChange={e => setQuery(e.target.value)}/>{query && <button onClick={() => setQuery('')}><X size={14}/></button>}</div><div className="view-meta"><span className="dot green"></span> All changes saved <span className="divider"></span><span>{tasks.length} tasks</span></div></div>
    <section className="board">{columns.map(col => <div className={`column ${dropTarget === col.key ? 'column-drop-target' : ''}`} key={col.key} onDragOver={e => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; if (dropTarget !== col.key) setDropTarget(col.key); }} onDrop={e => handleDrop(e, col.key)}>
      <div className="column-head"><div className="column-title"><span className="status-dot" style={{background:col.color}}></span><span>{col.label}</span><span className="count">{visible.filter(t=>t.status===col.key).length}</span></div><button className="more"><MoreHorizontal size={17}/></button></div>
      <div className="cards" onDragOver={e => e.preventDefault()} onDrop={e => handleDrop(e, col.key)}>{isLoading ? <div className="cards-loading">Loading tasks…</div> : visible.filter(t=>t.status===col.key).map(task => <article className="card" key={task.id} draggable onDragStart={e => handleDragStart(e, task.id)} onDragEnd={clearDragState} style={draggedId === task.id ? { opacity: .45, transform: 'rotate(1deg)' } : undefined}>
        <div className="card-top"><span className={`priority ${task.priority.toLowerCase()}`}>{task.priority === 'HIGH' ? 'High' : task.priority === 'MEDIUM' ? 'Medium' : 'Low'}</span><button className="more"><MoreHorizontal size={16}/></button></div><h3>{task.title}</h3>{task.details && <p>{task.details}</p>}<div className="card-foot">{task.dueDate ? <span className="due"><CalendarDays size={13}/> {new Date(task.dueDate).toLocaleDateString('en-US',{month:'short',day:'numeric'})}</span> : <span></span>}<div className="card-tools"><button className="comment-trigger" onClick={event => { event.preventDefault(); event.stopPropagation(); void openComments(task); }} aria-label={`Comment on ${task.title}`}><MessageCircle size={13}/> {comments[task.id]?.length ?? 0}</button><select value={task.status} onChange={e => void move(task.id, e.target.value as Status)} aria-label={`Move ${task.title}`}><option value="TODO">Todo</option><option value="IN_PROGRESS">In progress</option><option value="TEST">Test</option><option value="DEPLOYED">Deployed</option><option value="COMPLETE">Complete</option></select></div></div>
      </article>)}</div><button className="add-column-task" onClick={() => {setActive(col.key); setModal(true)}}><Plus size={15}/> Add task</button></div>)}</section>
    {modal && <div className="modal-backdrop" onClick={() => setModal(false)}><form className="modal" onSubmit={addTask} onClick={e=>e.stopPropagation()}><div className="modal-head"><div><span className="eyebrow">NEW TASK</span><h2>What needs doing?</h2></div><button type="button" className="close" onClick={()=>setModal(false)}><X size={18}/></button></div><input autoFocus value={newTitle} onChange={e=>setNewTitle(e.target.value)} placeholder="e.g. Prepare launch checklist"/><div className="modal-actions"><button type="button" className="secondary" onClick={()=>setModal(false)}>Cancel</button><button className="primary" type="submit"><Plus size={16}/> Create task</button></div></form></div>}
    {commentTask && <div className="modal-backdrop" onClick={() => { setCommentTask(null); setCommentDraft(''); }}><section className="comments-modal" onClick={e => e.stopPropagation()}><div className="modal-head"><div><span className="eyebrow">COMMENTS</span><h2>{commentTask.title}</h2></div><button type="button" className="close" onClick={() => { setCommentTask(null); setCommentDraft(''); }}><X size={18}/></button></div><div className="comment-list">{commentsLoading ? <div className="empty-comments"><p>Loading comments…</p></div> : (comments[commentTask.id] ?? []).length === 0 ? <div className="empty-comments"><MessageCircle size={20}/><p>No comments yet</p><span>Start the conversation about this task.</span></div> : comments[commentTask.id].map(comment => <article className="comment" key={comment.id}><div className="comment-avatar" style={{ background: comment.author.color }}>{comment.author.initials}</div><div><div className="comment-meta"><strong>{comment.author.name}</strong><span>{new Date(comment.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span></div><p>{comment.body}</p></div></article>)}</div><form className="comment-form" onSubmit={addComment}><textarea autoFocus value={commentDraft} onChange={e => setCommentDraft(e.target.value)} placeholder="Write a comment…" rows={3}/><button className="primary" type="submit" disabled={!commentDraft.trim() || commentSubmitting}><Send size={14}/> {commentSubmitting ? 'Posting…' : 'Comment'}</button></form></section></div>}
  </main>;
}
