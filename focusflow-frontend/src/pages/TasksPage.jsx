import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Box, Typography, Button, IconButton, Chip, TextField,
  InputAdornment, Dialog, DialogTitle, DialogContent, DialogActions,
  Select, FormControl, InputLabel, MenuItem, CircularProgress, Tooltip,
} from '@mui/material';
import {
  Plus, Search, CheckCircle, Circle, Trash2, Edit2,
  ChevronRight, ChevronDown, X, Calendar, Wifi, WifiOff,
  Flag, FolderOpen,
} from 'lucide-react';
import { useDropzone } from 'react-dropzone';

// ─── API ──────────────────────────────────────────────────────────────────────
const API_BASE = 'http://localhost:8000';
const api = {
  async health() { try { const r = await fetch(`${API_BASE}/health`, { signal: AbortSignal.timeout(2000) }); return r.ok; } catch { return false; } },
  async getTasks() { try { const r = await fetch(`${API_BASE}/tasks`); if (r.ok) return r.json(); } catch {} return null; },
  async createTask(task) { try { const r = await fetch(`${API_BASE}/tasks`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(task) }); if (r.ok) return r.json(); } catch {} return null; },
  async updateTask(id, task) { try { const r = await fetch(`${API_BASE}/tasks/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(task) }); if (r.ok) return r.json(); } catch {} return null; },
  async deleteTask(id) { try { await fetch(`${API_BASE}/tasks/${id}`, { method: 'DELETE' }); } catch {} },
};

// ─── localStorage ─────────────────────────────────────────────────────────────
const save = (t) => localStorage.setItem('focusflow_tasks', JSON.stringify(t));
const load = () => { try { const s = localStorage.getItem('focusflow_tasks'); return s ? JSON.parse(s) : []; } catch { return []; } };

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fadeUp = (delay = 0) => ({ initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.4, delay, ease: [0.22, 1, 0.36, 1] } });

const PRIORITY = {
  high:   { bg: 'rgba(239,68,68,0.1)',   color: '#EF4444', dot: '#EF4444' },
  medium: { bg: 'rgba(245,158,11,0.1)',  color: '#F59E0B', dot: '#F59E0B' },
  low:    { bg: 'rgba(16,185,129,0.1)',  color: '#10B981', dot: '#10B981' },
};

const SAMPLE = [
  { id: 1, title: 'Finish project proposal', description: 'Complete intro and methodology', priority: 'high', dueDate: '2024-03-25', category: 'Work', completed: false, createdAt: new Date().toISOString(), subtasks: [{ id: 11, title: 'Write intro', completed: true }, { id: 12, title: 'Research methodology', completed: false }] },
  { id: 2, title: 'Review Chapter 2', description: 'Read and take notes', priority: 'medium', dueDate: '2024-03-26', category: 'Study', completed: false, createdAt: new Date().toISOString(), subtasks: [] },
  { id: 3, title: 'Team sync meeting', description: 'Weekly alignment call', priority: 'high', dueDate: '2024-03-24', category: 'Work', completed: true, createdAt: new Date().toISOString(), subtasks: [] },
];

// ─── Task Row ────────────────────────────────────────────────────────────────
function TaskRow({ task, index, darkMode, onToggle, onEdit, onDelete, onToggleSub, expanded, onExpand }) {
  const p = PRIORITY[task.priority] || PRIORITY.low;
  const subDone = task.subtasks?.filter(s => s.completed).length || 0;
  const subTotal = task.subtasks?.length || 0;
  const subPct = subTotal > 0 ? (subDone / subTotal) * 100 : 0;
  const isOverdue = task.dueDate && !task.completed && new Date(task.dueDate) < new Date();

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -30, scale: 0.97 }}
      transition={{ delay: index * 0.04, ease: [0.22, 1, 0.36, 1] }}
    >
      <Box sx={{
        borderRadius: '16px',
        border: `1px solid ${darkMode ? 'rgba(99,102,241,0.12)' : 'rgba(99,102,241,0.09)'}`,
        bgcolor: darkMode ? 'rgba(15,23,42,0.85)' : '#fff',
        backdropFilter: 'blur(12px)',
        overflow: 'hidden',
        opacity: task.completed ? 0.6 : 1,
        transition: 'opacity 0.3s, box-shadow 0.2s',
        '&:hover': { boxShadow: `0 4px 24px -8px ${darkMode ? 'rgba(99,102,241,0.2)' : 'rgba(99,102,241,0.15)'}` },
      }}>
        {/* Priority accent bar */}
        <Box sx={{ height: 2, background: `linear-gradient(90deg, ${p.color}, ${p.color}44)` }} />

        <Box sx={{ display: 'flex', alignItems: 'flex-start', p: 2.5, gap: 1.5 }}>
          {/* Check */}
          <Box onClick={() => onToggle(task.id)} sx={{ mt: 0.25, cursor: 'pointer', flexShrink: 0, color: task.completed ? '#10B981' : (darkMode ? '#334155' : '#CBD5E1'), '&:hover': { color: '#10B981' }, transition: 'color 0.2s' }}>
            {task.completed ? <CheckCircle size={20} /> : <Circle size={20} />}
          </Box>

          {/* Content */}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap', mb: 0.5 }}>
              <Typography sx={{ fontWeight: 600, fontSize: '0.9rem', textDecoration: task.completed ? 'line-through' : 'none', color: task.completed ? (darkMode ? '#475569' : '#94A3B8') : (darkMode ? '#F8FAFC' : '#0F172A') }}>
                {task.title}
              </Typography>
              <Chip label={task.priority} size="small" sx={{ height: 19, fontSize: '0.62rem', fontWeight: 700, bgcolor: p.bg, color: p.color, border: `1px solid ${p.color}33` }} />
              {task.category && <Chip label={task.category} size="small" variant="outlined" sx={{ height: 19, fontSize: '0.62rem', borderColor: darkMode ? 'rgba(99,102,241,0.2)' : 'rgba(99,102,241,0.15)', color: '#6366F1' }} />}
              {isOverdue && <Chip label="Overdue" size="small" sx={{ height: 19, fontSize: '0.62rem', fontWeight: 700, bgcolor: 'rgba(239,68,68,0.1)', color: '#EF4444' }} />}
            </Box>
            {task.description && <Typography sx={{ fontSize: '0.78rem', color: darkMode ? '#475569' : '#94A3B8', mb: 0.75 }}>{task.description}</Typography>}
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
              {task.dueDate && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Calendar size={11} color={isOverdue ? '#EF4444' : (darkMode ? '#475569' : '#CBD5E1')} />
                  <Typography sx={{ fontSize: '0.68rem', color: isOverdue ? '#EF4444' : (darkMode ? '#475569' : '#94A3B8') }}>
                    {new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </Typography>
                </Box>
              )}
              {subTotal > 0 && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                  <Box sx={{ width: 40, height: 3, borderRadius: '99px', bgcolor: darkMode ? 'rgba(99,102,241,0.15)' : 'rgba(99,102,241,0.1)', overflow: 'hidden' }}>
                    <Box sx={{ width: `${subPct}%`, height: '100%', bgcolor: '#6366F1', borderRadius: '99px' }} />
                  </Box>
                  <Typography sx={{ fontSize: '0.65rem', color: darkMode ? '#475569' : '#94A3B8', fontWeight: 600 }}>{subDone}/{subTotal}</Typography>
                </Box>
              )}
            </Box>
          </Box>

          {/* Actions */}
          <Box sx={{ display: 'flex', gap: 0.5, flexShrink: 0 }}>
            <Tooltip title="Edit">
              <IconButton size="small" onClick={() => onEdit(task)} sx={{ color: darkMode ? '#475569' : '#CBD5E1', '&:hover': { color: '#6366F1', bgcolor: 'rgba(99,102,241,0.1)' } }}>
                <Edit2 size={14} />
              </IconButton>
            </Tooltip>
            <Tooltip title="Delete">
              <IconButton size="small" onClick={() => onDelete(task.id)} sx={{ color: darkMode ? '#475569' : '#CBD5E1', '&:hover': { color: '#EF4444', bgcolor: 'rgba(239,68,68,0.1)' } }}>
                <Trash2 size={14} />
              </IconButton>
            </Tooltip>
            {subTotal > 0 && (
              <IconButton size="small" onClick={() => onExpand(task.id)} sx={{ color: darkMode ? '#475569' : '#CBD5E1' }}>
                {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </IconButton>
            )}
          </Box>
        </Box>

        {/* Subtasks */}
        <AnimatePresence>
          {expanded && subTotal > 0 && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}>
              <Box sx={{ pl: 5.5, pr: 2.5, pb: 2, borderTop: `1px solid ${darkMode ? 'rgba(99,102,241,0.1)' : 'rgba(99,102,241,0.07)'}`, bgcolor: darkMode ? 'rgba(99,102,241,0.03)' : 'rgba(99,102,241,0.02)', pt: 1.5 }}>
                {task.subtasks.map(sub => (
                  <Box key={sub.id} onClick={() => onToggleSub(task.id, sub.id)} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 0.75, cursor: 'pointer', borderRadius: '8px', px: 1, '&:hover': { bgcolor: darkMode ? 'rgba(99,102,241,0.06)' : 'rgba(99,102,241,0.04)' } }}>
                    <Box sx={{ color: sub.completed ? '#10B981' : (darkMode ? '#334155' : '#CBD5E1'), '&:hover': { color: '#10B981' } }}>
                      {sub.completed ? <CheckCircle size={15} /> : <Circle size={15} />}
                    </Box>
                    <Typography sx={{ fontSize: '0.8rem', textDecoration: sub.completed ? 'line-through' : 'none', color: sub.completed ? (darkMode ? '#475569' : '#94A3B8') : (darkMode ? '#CBD5E1' : '#374151') }}>
                      {sub.title}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </motion.div>
          )}
        </AnimatePresence>
      </Box>
    </motion.div>
  );
}

// ─── Task Form ────────────────────────────────────────────────────────────────
function TaskForm({ open, onClose, onSave, editingTask, darkMode }) {
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [priority, setPriority] = useState('medium');
  const [dueDate, setDueDate] = useState('');
  const [category, setCategory] = useState('');
  const [subtasks, setSubtasks] = useState([]);
  const [newSub, setNewSub] = useState('');

  useEffect(() => {
    if (editingTask) { setTitle(editingTask.title || ''); setDesc(editingTask.description || ''); setPriority(editingTask.priority || 'medium'); setDueDate(editingTask.dueDate || ''); setCategory(editingTask.category || ''); setSubtasks(editingTask.subtasks || []); }
    else { setTitle(''); setDesc(''); setPriority('medium'); setDueDate(''); setCategory(''); setSubtasks([]); }
  }, [editingTask, open]);

  const addSub = () => { if (newSub.trim()) { setSubtasks(p => [...p, { id: Date.now(), title: newSub.trim(), completed: false }]); setNewSub(''); } };

  const inputSx = { '& .MuiOutlinedInput-root': { borderRadius: '12px', fontSize: '0.88rem', bgcolor: darkMode ? 'rgba(99,102,241,0.04)' : 'rgba(99,102,241,0.02)', '& fieldset': { borderColor: darkMode ? 'rgba(99,102,241,0.2)' : 'rgba(99,102,241,0.15)' }, '&:hover fieldset': { borderColor: 'rgba(99,102,241,0.4)' }, '&.Mui-focused fieldset': { borderColor: '#6366F1' } }, '& .MuiInputLabel-root.Mui-focused': { color: '#6366F1' } };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth
      PaperProps={{ sx: { borderRadius: '20px', bgcolor: darkMode ? '#0F172A' : '#fff', border: `1px solid ${darkMode ? 'rgba(99,102,241,0.2)' : 'rgba(99,102,241,0.12)'}`, backgroundImage: 'none' } }}>
      <DialogTitle sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography sx={{ fontWeight: 800, fontFamily: 'monospace', fontSize: '1.05rem', color: darkMode ? '#F8FAFC' : '#0F172A' }}>
            {editingTask ? 'Edit Task' : 'New Task'}
          </Typography>
          <IconButton onClick={onClose} size="small" sx={{ color: darkMode ? '#475569' : '#94A3B8' }}><X size={16} /></IconButton>
        </Box>
      </DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '12px !important' }}>
        <TextField label="Task title" fullWidth value={title} onChange={e => setTitle(e.target.value)} required sx={inputSx} />
        <TextField label="Description" fullWidth multiline rows={2} value={desc} onChange={e => setDesc(e.target.value)} sx={inputSx} />
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <FormControl fullWidth sx={inputSx}>
            <InputLabel>Priority</InputLabel>
            <Select value={priority} onChange={e => setPriority(e.target.value)} label="Priority" sx={{ borderRadius: '12px' }}>
              <MenuItem value="high">🔴 High</MenuItem>
              <MenuItem value="medium">🟡 Medium</MenuItem>
              <MenuItem value="low">🟢 Low</MenuItem>
            </Select>
          </FormControl>
          <TextField label="Due date" type="date" fullWidth value={dueDate} onChange={e => setDueDate(e.target.value)} InputLabelProps={{ shrink: true }} sx={inputSx} />
        </Box>
        <TextField label="Category" fullWidth value={category} onChange={e => setCategory(e.target.value)} placeholder="Work, Study, Personal…" sx={inputSx} />
        <Box>
          <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#6366F1', mb: 1 }}>Subtasks</Typography>
          <Box sx={{ display: 'flex', gap: 1, mb: 1.5 }}>
            <TextField size="small" fullWidth placeholder="Add subtask…" value={newSub} onChange={e => setNewSub(e.target.value)} onKeyDown={e => e.key === 'Enter' && addSub()} sx={{ ...inputSx, '& .MuiOutlinedInput-root': { ...inputSx['& .MuiOutlinedInput-root'], fontSize: '0.82rem' } }} />
            <Button onClick={addSub} variant="outlined" size="small" sx={{ borderRadius: '10px', borderColor: 'rgba(99,102,241,0.3)', color: '#6366F1', textTransform: 'none', fontWeight: 700, whiteSpace: 'nowrap', '&:hover': { borderColor: '#6366F1', bgcolor: 'rgba(99,102,241,0.08)' } }}>Add</Button>
          </Box>
          {subtasks.map(sub => (
            <Box key={sub.id} sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 0.5, px: 1, borderRadius: '8px', bgcolor: darkMode ? 'rgba(99,102,241,0.05)' : 'rgba(99,102,241,0.03)', mb: 0.5 }}>
              <Circle size={12} color="#6366F1" />
              <Typography sx={{ flex: 1, fontSize: '0.8rem', color: darkMode ? '#CBD5E1' : '#374151' }}>{sub.title}</Typography>
              <IconButton size="small" onClick={() => setSubtasks(p => p.filter(s => s.id !== sub.id))} sx={{ color: darkMode ? '#334155' : '#CBD5E1', '&:hover': { color: '#EF4444' }, p: 0.25 }}><X size={12} /></IconButton>
            </Box>
          ))}
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: 2, gap: 1 }}>
        <Button onClick={onClose} sx={{ textTransform: 'none', color: darkMode ? '#475569' : '#94A3B8', borderRadius: '10px' }}>Cancel</Button>
        <Button onClick={() => { if (!title.trim()) return; onSave({ title, description: desc, priority, dueDate, category, subtasks, completed: editingTask?.completed || false }); onClose(); }} disabled={!title.trim()} variant="contained"
          sx={{ bgcolor: '#6366F1', borderRadius: '10px', textTransform: 'none', fontWeight: 700, boxShadow: '0 4px 12px rgba(99,102,241,0.3)', '&:hover': { bgcolor: '#4F46E5' }, '&:disabled': { bgcolor: darkMode ? '#1E293B' : '#E2E8F0' } }}>
          {editingTask ? 'Save Changes' : 'Create Task'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function TasksPage({ darkMode }) {
  const [tasks, setTasks] = useState([]);
  const [search, setSearch] = useState('');
  const [filterPriority, setFilterPriority] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [expanded, setExpanded] = useState({});
  const [backendOnline, setBackendOnline] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.health().then(alive => {
      setBackendOnline(alive);
      if (alive) {
        api.getTasks().then(t => { if (t) { setTasks(t); save(t); } else { const local = load(); setTasks(local.length ? local : SAMPLE); } setLoading(false); });
      } else {
        const local = load();
        setTasks(local.length ? local : SAMPLE);
        if (!load().length) save(SAMPLE);
        setLoading(false);
      }
    });
  }, []);

  useEffect(() => { if (tasks.length) save(tasks); }, [tasks]);

  const toggle = async (id) => {
    const updated = tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t);
    setTasks(updated);
    const task = updated.find(t => t.id === id);
    if (backendOnline) await api.updateTask(id, task);
  };

  const toggleSub = (tid, sid) => setTasks(tasks.map(t => t.id === tid ? { ...t, subtasks: t.subtasks.map(s => s.id === sid ? { ...s, completed: !s.completed } : s) } : t));

  const del = async (id) => {
    setTasks(tasks.filter(t => t.id !== id));
    if (backendOnline) await api.deleteTask(id);
  };

  const saveTask = async (data) => {
    if (editing) {
      const updated = tasks.map(t => t.id === editing.id ? { ...data, id: t.id, createdAt: t.createdAt } : t);
      setTasks(updated);
      if (backendOnline) await api.updateTask(editing.id, { ...data, id: editing.id });
    } else {
      const newT = { ...data, id: Date.now(), createdAt: new Date().toISOString() };
      if (backendOnline) { const created = await api.createTask(newT); if (created) { setTasks(p => [created, ...p]); return; } }
      setTasks(p => [newT, ...p]);
    }
    setEditing(null);
  };

  const filtered = tasks.filter(t => {
    const ms = t.title.toLowerCase().includes(search.toLowerCase()) || t.description?.toLowerCase().includes(search.toLowerCase());
    const mp = filterPriority === 'all' || t.priority === filterPriority;
    const mst = filterStatus === 'all' || (filterStatus === 'completed' ? t.completed : !t.completed);
    return ms && mp && mst;
  });

  const stats = { total: tasks.length, done: tasks.filter(t => t.completed).length, high: tasks.filter(t => t.priority === 'high' && !t.completed).length };
  const inputSx = { '& .MuiOutlinedInput-root': { borderRadius: '12px', fontSize: '0.85rem', bgcolor: darkMode ? 'rgba(99,102,241,0.04)' : 'rgba(99,102,241,0.02)', '& fieldset': { borderColor: darkMode ? 'rgba(99,102,241,0.15)' : 'rgba(99,102,241,0.12)' }, '&:hover fieldset': { borderColor: 'rgba(99,102,241,0.35)' }, '&.Mui-focused fieldset': { borderColor: '#6366F1' } }, '& .MuiInputLabel-root.Mui-focused': { color: '#6366F1' } };

  return (
    <Box sx={{ position: 'relative', pb: 4 }}>
      <Box sx={{ position: 'fixed', inset: 0, background: darkMode ? 'radial-gradient(ellipse 70% 50% at 50% -5%, rgba(99,102,241,0.08) 0%, transparent 70%)' : 'radial-gradient(ellipse 70% 50% at 50% -5%, rgba(37,99,235,0.04) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />
      <Box sx={{ position: 'relative', zIndex: 1 }}>

        {/* Header */}
        <motion.div {...fadeUp(0)}>
          <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 2 }}>
            <Box>
              <Typography sx={{ fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#6366F1', mb: 0.75 }}>Task Manager</Typography>
              <Typography sx={{ fontSize: 'clamp(1.8rem,4vw,2.4rem)', fontWeight: 900, letterSpacing: '-0.04em', color: darkMode ? '#F8FAFC' : '#0F172A', fontFamily: '"DM Mono", monospace', lineHeight: 1 }}>Tasks</Typography>
              <Typography sx={{ color: darkMode ? '#475569' : '#94A3B8', mt: 0.75, fontSize: '0.88rem' }}>Manage, break down, and complete your goals.</Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, px: 1.5, py: 0.6, borderRadius: '9px', bgcolor: backendOnline ? 'rgba(16,185,129,0.1)' : 'rgba(100,116,139,0.1)', border: `1px solid ${backendOnline ? '#10B98133' : '#64748B33'}` }}>
                {backendOnline === null ? <CircularProgress size={10} /> : backendOnline ? <Wifi size={12} color="#10B981" /> : <WifiOff size={12} color="#94A3B8" />}
                <Typography sx={{ fontSize: '0.65rem', fontWeight: 600, color: backendOnline ? '#10B981' : '#94A3B8' }}>{backendOnline === null ? '...' : backendOnline ? 'Synced' : 'Local'}</Typography>
              </Box>
              <Button onClick={() => { setEditing(null); setFormOpen(true); }} startIcon={<Plus size={16} />} variant="contained"
                sx={{ bgcolor: '#6366F1', borderRadius: '12px', textTransform: 'none', fontWeight: 700, boxShadow: '0 4px 12px rgba(99,102,241,0.3)', '&:hover': { bgcolor: '#4F46E5' }, px: 2.5 }}>
                New Task
              </Button>
            </Box>
          </Box>
        </motion.div>

        {/* Stats */}
        <motion.div {...fadeUp(0.08)}>
          <Box sx={{ display: 'flex', gap: 2, mb: 3.5, flexWrap: 'wrap' }}>
            {[
              { v: stats.total, l: 'Total', c: '#6366F1', bg: 'rgba(99,102,241,0.1)' },
              { v: stats.done, l: 'Done', c: '#10B981', bg: 'rgba(16,185,129,0.1)' },
              { v: stats.high, l: 'High Priority', c: '#EF4444', bg: 'rgba(239,68,68,0.1)' },
              { v: `${stats.total > 0 ? Math.round((stats.done / stats.total) * 100) : 0}%`, l: 'Complete', c: '#F59E0B', bg: 'rgba(245,158,11,0.1)' },
            ].map(({ v, l, c, bg }) => (
              <Box key={l} sx={{ borderRadius: '16px', p: 2, bgcolor: darkMode ? 'rgba(15,23,42,0.85)' : '#fff', border: `1px solid ${darkMode ? 'rgba(99,102,241,0.12)' : 'rgba(99,102,241,0.09)'}`, backdropFilter: 'blur(12px)', minWidth: 100 }}>
                <Typography sx={{ fontSize: '1.8rem', fontWeight: 800, color: c, fontFamily: 'monospace', lineHeight: 1 }}>{v}</Typography>
                <Typography sx={{ fontSize: '0.65rem', fontWeight: 600, color: darkMode ? '#475569' : '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.06em', mt: 0.25 }}>{l}</Typography>
              </Box>
            ))}
          </Box>
        </motion.div>

        {/* Filters */}
        <motion.div {...fadeUp(0.14)}>
          <Box sx={{ display: 'flex', gap: 1.5, mb: 3, flexWrap: 'wrap', alignItems: 'center' }}>
            <TextField placeholder="Search tasks…" size="small" value={search} onChange={e => setSearch(e.target.value)} sx={{ flex: 1, minWidth: 200, ...inputSx }}
              InputProps={{ startAdornment: <InputAdornment position="start"><Search size={15} color="#6366F1" /></InputAdornment> }} />
            <FormControl size="small" sx={{ minWidth: 110, ...inputSx }}>
              <InputLabel>Priority</InputLabel>
              <Select value={filterPriority} onChange={e => setFilterPriority(e.target.value)} label="Priority" sx={{ borderRadius: '12px' }}>
                <MenuItem value="all">All</MenuItem>
                <MenuItem value="high">High</MenuItem>
                <MenuItem value="medium">Medium</MenuItem>
                <MenuItem value="low">Low</MenuItem>
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 110, ...inputSx }}>
              <InputLabel>Status</InputLabel>
              <Select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} label="Status" sx={{ borderRadius: '12px' }}>
                <MenuItem value="all">All</MenuItem>
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="completed">Done</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </motion.div>

        {/* Task list */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress sx={{ color: '#6366F1' }} /></Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            <AnimatePresence>
              {filtered.map((task, i) => (
                <TaskRow key={task.id} task={task} index={i} darkMode={darkMode}
                  onToggle={toggle} onEdit={t => { setEditing(t); setFormOpen(true); }} onDelete={del}
                  onToggleSub={toggleSub} expanded={!!expanded[task.id]} onExpand={id => setExpanded(p => ({ ...p, [id]: !p[id] }))} />
              ))}
            </AnimatePresence>

            {filtered.length === 0 && (
              <motion.div {...fadeUp(0)}>
                <Box sx={{ textAlign: 'center', py: 8, borderRadius: '20px', border: `1px dashed ${darkMode ? 'rgba(99,102,241,0.2)' : 'rgba(99,102,241,0.15)'}` }}>
                  <Typography sx={{ fontSize: '2rem', mb: 1 }}>✨</Typography>
                  <Typography sx={{ color: darkMode ? '#475569' : '#94A3B8', mb: 2, fontSize: '0.9rem' }}>
                    {search ? 'No tasks match your search.' : 'No tasks yet. Create your first one!'}
                  </Typography>
                  <Button onClick={() => setFormOpen(true)} startIcon={<Plus size={16} />} variant="outlined"
                    sx={{ borderColor: 'rgba(99,102,241,0.3)', color: '#6366F1', borderRadius: '10px', textTransform: 'none', fontWeight: 700, '&:hover': { borderColor: '#6366F1', bgcolor: 'rgba(99,102,241,0.08)' } }}>
                    Create Task
                  </Button>
                </Box>
              </motion.div>
            )}
          </Box>
        )}
      </Box>

      <TaskForm open={formOpen} onClose={() => { setFormOpen(false); setEditing(null); }} onSave={saveTask} editingTask={editing} darkMode={darkMode} />
    </Box>
  );
}