import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Box, Typography, Button, IconButton, Chip, LinearProgress, CircularProgress } from '@mui/material';
import { Sparkles, Clock, CheckCircle2, Circle, Play, Pause, RotateCcw, Flame, Target, Zap, ArrowRight, Plus, Wifi, WifiOff, TrendingUp, Brain } from 'lucide-react';

// ─── API ──────────────────────────────────────────────────────────────────────
const API_BASE = 'http://localhost:8000';
const api = {
  async health() { try { const r = await fetch(`${API_BASE}/health`, { signal: AbortSignal.timeout(2000) }); return r.ok; } catch { return false; } },
  async getDashboard() { try { const r = await fetch(`${API_BASE}/dashboard`); if (r.ok) return r.json(); } catch {} return null; },
  async updateTask(id, task) { try { await fetch(`${API_BASE}/tasks/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(task) }); } catch {} },
};

const loadTasks = () => { try { const s = localStorage.getItem('focusflow_tasks'); return s ? JSON.parse(s) : []; } catch { return []; } };
const loadStats = () => { try { const s = localStorage.getItem('focusflow_focus_stats'); return s ? JSON.parse(s) : { totalSessions: 0, totalFocusTime: 0, currentStreak: 0 }; } catch { return { totalSessions: 0, totalFocusTime: 0, currentStreak: 0 }; } };
const saveTasks = (t) => localStorage.setItem('focusflow_tasks', JSON.stringify(t));

const fadeUp = (delay = 0) => ({ initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.4, delay, ease: [0.22, 1, 0.36, 1] } });
const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

const SAMPLE_TASKS = [
  { id: 1, title: 'Finish project proposal', time: '5:00 PM', priority: 'high', completed: false, focus: true },
  { id: 2, title: 'Review Chapter 2', time: 'Tomorrow', priority: 'medium', completed: false, focus: false },
  { id: 3, title: 'Team sync meeting', time: '2:00 PM', priority: 'high', completed: true, focus: false },
  { id: 4, title: 'Update documentation', time: 'No deadline', priority: 'low', completed: false, focus: false },
];

// ─── Component ────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const [pomodoroTime, setPomodoroTime] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [mode, setMode] = useState('work');
  const [tasks, setTasks] = useState([]);
  const [focusStats, setFocusStats] = useState({ totalSessions: 0, totalFocusTime: 0, currentStreak: 0 });
  const [backendOnline, setBackendOnline] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.health().then(alive => {
      setBackendOnline(alive);
      if (alive) {
        api.getDashboard().then(data => {
          if (data) {
            if (data.tasks) setTasks(data.tasks);
            if (data.focusStats) setFocusStats(data.focusStats);
          } else initLocal();
          setLoading(false);
        });
      } else { initLocal(); setLoading(false); }
    });
  }, []);

  const initLocal = () => {
    const local = loadTasks();
    setTasks(local.length ? local : SAMPLE_TASKS);
    if (!local.length) saveTasks(SAMPLE_TASKS);
    setFocusStats(loadStats());
  };

  useEffect(() => {
    if (!isActive) return;
    if (pomodoroTime === 0) { setIsActive(false); setMode(m => m === 'work' ? 'break' : 'work'); setPomodoroTime(mode === 'work' ? 5 * 60 : 25 * 60); return; }
    const id = setInterval(() => setPomodoroTime(p => p - 1), 1000);
    return () => clearInterval(id);
  }, [isActive, pomodoroTime, mode]);

  const toggleTask = async (id) => {
    const updated = tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t);
    setTasks(updated); saveTasks(updated);
    if (backendOnline) await api.updateTask(id, updated.find(t => t.id === id));
  };

  const done = tasks.filter(t => t.completed).length;
  const progress = tasks.length > 0 ? (done / tasks.length) * 100 : 0;
  const totalSecs = mode === 'work' ? 25 * 60 : 5 * 60;
  const pct = pomodoroTime / totalSecs;
  const R = 54, circ = 2 * Math.PI * R;
  const timerColor = mode === 'work' ? '#6366F1' : '#10B981';
  const today = new Date();
  const hour = today.getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <Box sx={{ position: 'relative', maxWidth: 1280, pb: 4 }}>
      <Box sx={{ position: 'fixed', inset: 0, background: 'radial-gradient(ellipse 70% 50% at 50% -5%, rgba(99,102,241,0.07) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />
      <Box sx={{ position: 'relative', zIndex: 1 }}>

        {/* Header */}
        <motion.div {...fadeUp(0)}>
          <Box sx={{ mb: 5, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 2 }}>
            <Box>
              <Typography sx={{ fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#6366F1', mb: 0.5 }}>
                {today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              </Typography>
              <Typography sx={{ fontSize: 'clamp(1.6rem,3.5vw,2.2rem)', fontWeight: 900, letterSpacing: '-0.04em', color: 'text.primary', fontFamily: '"DM Mono", monospace', lineHeight: 1.1 }}>
                {greeting}, Alex 👋
              </Typography>
              <Typography sx={{ color: 'text.secondary', mt: 0.75, fontSize: '0.88rem' }}>
                You have <Box component="span" sx={{ color: '#6366F1', fontWeight: 700 }}>{tasks.length - done} tasks</Box> left today.
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 1.5, py: 0.6, borderRadius: '9px', bgcolor: backendOnline ? 'rgba(16,185,129,0.1)' : 'rgba(100,116,139,0.1)', border: `1px solid ${backendOnline ? '#10B98133' : '#64748B33'}` }}>
              {backendOnline === null ? <CircularProgress size={10} /> : backendOnline ? <Wifi size={12} color="#10B981" /> : <WifiOff size={12} color="#94A3B8" />}
              <Typography sx={{ fontSize: '0.65rem', fontWeight: 600, color: backendOnline ? '#10B981' : '#94A3B8' }}>{backendOnline === null ? '...' : backendOnline ? 'Live' : 'Local'}</Typography>
            </Box>
          </Box>
        </motion.div>

        {/* Main grid */}
        <Box sx={{ display: 'flex', gap: 3, flexDirection: { xs: 'column', lg: 'row' }, alignItems: 'flex-start' }}>

          {/* ── LEFT: Tasks ── */}
          <Box sx={{ flex: 1.6, minWidth: 0 }}>

            {/* Progress card */}
            <motion.div {...fadeUp(0.08)}>
              <Box sx={{ borderRadius: '20px', border: '1px solid', borderColor: 'rgba(99,102,241,0.12)', bgcolor: 'background.paper', backdropFilter: 'blur(12px)', p: 3, mb: 2.5 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography sx={{ fontWeight: 700, fontSize: '0.88rem', color: 'text.primary' }}>Daily Progress</Typography>
                  <Box sx={{ px: 1.5, py: 0.35, borderRadius: '99px', bgcolor: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)' }}>
                    <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#6366F1', fontFamily: 'monospace' }}>{done} / {tasks.length}</Typography>
                  </Box>
                </Box>
                <Box sx={{ position: 'relative', height: 8, borderRadius: '99px', bgcolor: 'rgba(99,102,241,0.08)', overflow: 'hidden' }}>
                  <motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                    style={{ position: 'absolute', left: 0, top: 0, bottom: 0, borderRadius: '99px', background: 'linear-gradient(90deg, #6366F1, #818CF8)' }} />
                </Box>
                <Typography sx={{ fontSize: '0.72rem', color: 'text.secondary', mt: 1 }}>
                  {progress === 100 ? '🎉 All done! Incredible work today.' : `${Math.round(progress)}% complete — keep going!`}
                </Typography>
              </Box>
            </motion.div>

            {/* Task list */}
            <motion.div {...fadeUp(0.14)}>
              <Box sx={{ borderRadius: '20px', border: '1px solid', borderColor: 'rgba(99,102,241,0.12)', bgcolor: 'background.paper', backdropFilter: 'blur(12px)', overflow: 'hidden' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 3, py: 2.25, borderBottom: '1px solid', borderColor: 'rgba(99,102,241,0.08)' }}>
                  <Typography sx={{ fontWeight: 700, fontSize: '0.9rem', color: 'text.primary' }}>Today's Tasks</Typography>
                  <Button size="small" startIcon={<Plus size={13} />}
                    sx={{ color: '#6366F1', fontWeight: 700, fontSize: '0.75rem', bgcolor: 'rgba(99,102,241,0.08)', px: 1.5, borderRadius: '8px', textTransform: 'none', '&:hover': { bgcolor: 'rgba(99,102,241,0.15)' } }}>
                    Add Task
                  </Button>
                </Box>
                <Box sx={{ px: 1.5, py: 1 }}>
                  <AnimatePresence>
                    {(loading ? SAMPLE_TASKS : tasks).map((task, i) => (
                      <motion.div key={task.id} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                        <Box onClick={() => toggleTask(task.id)} sx={{
                          display: 'flex', alignItems: 'center', gap: 2, px: 2, py: 1.75, borderRadius: '14px', cursor: 'pointer',
                          opacity: task.completed ? 0.5 : 1, transition: 'all 0.2s',
                          '&:hover': { bgcolor: 'rgba(99,102,241,0.05)' },
                        }}>
                          <Box sx={{ color: task.completed ? '#10B981' : 'rgba(99,102,241,0.3)', transition: 'color 0.2s', '&:hover': { color: '#10B981' }, flexShrink: 0 }}>
                            {task.completed ? <CheckCircle2 size={20} /> : <Circle size={20} strokeWidth={1.5} />}
                          </Box>
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography sx={{ fontWeight: task.priority === 'high' ? 600 : 400, textDecoration: task.completed ? 'line-through' : 'none', color: 'text.primary', fontSize: '0.88rem', mb: 0.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {task.title}
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <Clock size={10} color="#94A3B8" />
                              <Typography sx={{ fontSize: '0.68rem', color: 'text.secondary' }}>{task.time}</Typography>
                            </Box>
                          </Box>
                          {task.priority === 'high' && !task.completed && (
                            <Chip label="High" size="small" sx={{ height: 19, fontSize: '0.62rem', fontWeight: 700, bgcolor: 'rgba(239,68,68,0.1)', color: '#EF4444', border: '1px solid rgba(239,68,68,0.2)' }} />
                          )}
                          {task.focus && !task.completed && (
                            <Chip label="Focus" size="small" sx={{ height: 19, fontSize: '0.62rem', fontWeight: 700, bgcolor: 'rgba(99,102,241,0.1)', color: '#6366F1', border: '1px solid rgba(99,102,241,0.2)', cursor: 'pointer' }} />
                          )}
                        </Box>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </Box>
              </Box>
            </motion.div>

            {/* Stat cards */}
            <Box sx={{ display: 'flex', gap: 2, mt: 2.5, flexWrap: 'wrap' }}>
              {[
                { v: focusStats.totalSessions || 0, l: 'Total sessions', icon: Brain, c: '#6366F1' },
                { v: `${Math.floor((focusStats.totalFocusTime || 0) / 60)}h`, l: 'Focus time', icon: Zap, c: '#8B5CF6' },
                { v: `${focusStats.currentStreak || 0}🔥`, l: 'Day streak', icon: Flame, c: '#F59E0B' },
              ].map(({ v, l, icon: Icon, c }) => (
                <motion.div key={l} {...fadeUp(0.35)} style={{ flex: 1 }}>
                  <Box sx={{ borderRadius: '18px', p: 2.5, bgcolor: 'background.paper', border: '1px solid', borderColor: 'rgba(99,102,241,0.1)', backdropFilter: 'blur(12px)', transition: 'transform 0.2s', '&:hover': { transform: 'translateY(-2px)' } }}>
                    <Box sx={{ p: 1, borderRadius: '10px', bgcolor: `${c}14`, display: 'inline-flex', mb: 1.25 }}><Icon size={16} color={c} /></Box>
                    <Typography sx={{ fontSize: '1.6rem', fontWeight: 800, color: c, fontFamily: 'monospace', lineHeight: 1 }}>{v}</Typography>
                    <Typography sx={{ fontSize: '0.65rem', fontWeight: 600, color: 'text.secondary', mt: 0.25, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{l}</Typography>
                  </Box>
                </motion.div>
              ))}
            </Box>
          </Box>

          {/* ── RIGHT: Timer + Coach ── */}
          <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2.5, minWidth: 280 }}>

            {/* Pomodoro */}
            <motion.div {...fadeUp(0.18)}>
              <Box sx={{
                background: 'linear-gradient(145deg, #0F172A 0%, #1E293B 100%)',
                borderRadius: '24px', p: 3.5, textAlign: 'center', position: 'relative', overflow: 'hidden',
                border: `1px solid ${timerColor}22`,
                boxShadow: `0 0 40px -10px ${timerColor}44`,
                transition: 'border-color 0.4s, box-shadow 0.4s',
              }}>
                <Box sx={{ position: 'absolute', top: -40, right: -40, width: 160, height: 160, borderRadius: '50%', background: `radial-gradient(circle, ${timerColor}18 0%, transparent 70%)`, transition: 'background 0.4s' }} />

                <Typography sx={{ fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.15em', color: timerColor, textTransform: 'uppercase', mb: 2 }}>
                  {mode === 'work' ? '⚡ Focus Session' : '☕ Break Time'}
                </Typography>

                {/* SVG ring */}
                <Box sx={{ position: 'relative', display: 'inline-flex', mb: 2.5 }}>
                  <svg width={150} height={150} style={{ transform: 'rotate(-90deg)' }}>
                    <circle cx={75} cy={75} r={R} fill="none" stroke={`${timerColor}18`} strokeWidth={9} />
                    <circle cx={75} cy={75} r={R} fill="none" stroke={timerColor} strokeWidth={9} strokeLinecap="round"
                      strokeDasharray={`${circ * pct} ${circ}`}
                      style={{ transition: 'stroke-dasharray 0.6s ease, stroke 0.4s ease', filter: `drop-shadow(0 0 6px ${timerColor}88)` }} />
                  </svg>
                  <Box sx={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    <Typography sx={{ fontSize: '1.9rem', fontWeight: 900, fontFamily: '"DM Mono", monospace', color: 'white', letterSpacing: '-0.02em', lineHeight: 1 }}>
                      {fmt(pomodoroTime)}
                    </Typography>
                    <Typography sx={{ fontSize: '0.6rem', color: timerColor, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', mt: 0.25 }}>
                      {mode === 'work' ? 'Focus' : 'Break'}
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1.25, mb: 2.5 }}>
                  <motion.div whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.94 }}>
                    <IconButton onClick={() => setIsActive(a => !a)} sx={{
                      bgcolor: timerColor, color: 'white', width: 46, height: 46,
                      boxShadow: `0 6px 20px -4px ${timerColor}66`,
                      '&:hover': { bgcolor: timerColor, opacity: 0.9 }, transition: 'background 0.3s',
                    }}>
                      {isActive ? <Pause size={20} /> : <Play size={20} />}
                    </IconButton>
                  </motion.div>
                  <IconButton onClick={() => { setIsActive(false); setPomodoroTime(mode === 'work' ? 25 * 60 : 5 * 60); }}
                    sx={{ bgcolor: 'rgba(255,255,255,0.06)', color: '#64748B', width: 46, height: 46, '&:hover': { bgcolor: 'rgba(255,255,255,0.1)', color: '#94A3B8' } }}>
                    <RotateCcw size={18} />
                  </IconButton>
                </Box>

                <Box sx={{ display: 'inline-flex', gap: 0.75 }}>
                  {['work', 'break'].map(m => (
                    <Button key={m} size="small" onClick={() => { setMode(m); setPomodoroTime(m === 'work' ? 25 * 60 : 5 * 60); setIsActive(false); }}
                      sx={{ textTransform: 'capitalize', fontWeight: 700, fontSize: '0.72rem', borderRadius: '8px', px: 1.75,
                        color: mode === m ? 'white' : '#475569',
                        bgcolor: mode === m ? (m === 'work' ? '#6366F1' : '#10B981') : 'transparent',
                        '&:hover': { bgcolor: mode === m ? (m === 'work' ? '#4F46E5' : '#059669') : 'rgba(255,255,255,0.06)' },
                        transition: 'all 0.2s',
                      }}>
                      {m === 'work' ? 'Work' : 'Break'}
                    </Button>
                  ))}
                </Box>
              </Box>
            </motion.div>

            {/* AI Coach card */}
            <motion.div {...fadeUp(0.26)}>
              <Box sx={{ borderRadius: '20px', border: '1px solid', borderColor: 'rgba(99,102,241,0.12)', bgcolor: 'background.paper', backdropFilter: 'blur(12px)', p: 2.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, mb: 1.75 }}>
                  <Box sx={{ p: 1, borderRadius: '10px', bgcolor: 'rgba(99,102,241,0.1)', display: 'inline-flex' }}>
                    <Sparkles size={15} color="#6366F1" />
                  </Box>
                  <Typography sx={{ fontWeight: 700, fontSize: '0.82rem', color: '#6366F1', letterSpacing: '0.02em' }}>Coach Moment</Typography>
                </Box>
                <Typography sx={{ fontSize: '0.84rem', color: 'text.primary', lineHeight: 1.7, mb: 2, fontStyle: 'italic', color: 'text.secondary' }}>
                  "The secret to getting ahead is getting started. Break your biggest task into 5-minute chunks."
                </Typography>
                <Button size="small" endIcon={<ArrowRight size={13} />}
                  sx={{ color: '#6366F1', fontWeight: 700, fontSize: '0.78rem', p: 0, textTransform: 'none', '&:hover': { bgcolor: 'transparent', opacity: 0.75 } }}>
                  Talk to Coach
                </Button>
              </Box>
            </motion.div>

            {/* Quick stats */}
            <motion.div {...fadeUp(0.32)}>
              <Box sx={{ borderRadius: '20px', border: '1px solid', borderColor: 'rgba(99,102,241,0.12)', bgcolor: 'background.paper', backdropFilter: 'blur(12px)', p: 2.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, mb: 2 }}>
                  <Box sx={{ p: 1, borderRadius: '10px', bgcolor: 'rgba(16,185,129,0.1)', display: 'inline-flex' }}>
                    <TrendingUp size={15} color="#10B981" />
                  </Box>
                  <Typography sx={{ fontWeight: 700, fontSize: '0.82rem', color: '#10B981' }}>Quick Stats</Typography>
                </Box>
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
                  {[
                    { v: `${tasks.filter(t => t.priority === 'high' && !t.completed).length}`, l: 'High priority', c: '#EF4444' },
                    { v: `${tasks.filter(t => !t.completed).length}`, l: 'Pending', c: '#F59E0B' },
                    { v: `${done}`, l: 'Completed', c: '#10B981' },
                    { v: `${Math.round(progress)}%`, l: 'Done rate', c: '#6366F1' },
                  ].map(({ v, l, c }) => (
                    <Box key={l} sx={{ p: 1.5, borderRadius: '12px', bgcolor: `${c}0d`, border: `1px solid ${c}20`, textAlign: 'center' }}>
                      <Typography sx={{ fontSize: '1.3rem', fontWeight: 800, color: c, fontFamily: 'monospace', lineHeight: 1 }}>{v}</Typography>
                      <Typography sx={{ fontSize: '0.62rem', fontWeight: 600, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.05em', mt: 0.2 }}>{l}</Typography>
                    </Box>
                  ))}
                </Box>
              </Box>
            </motion.div>

          </Box>
        </Box>
      </Box>
    </Box>
  );
}