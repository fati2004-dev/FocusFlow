import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Box, Typography, Card, CardContent, Chip,
  Button, Grid, Alert, Avatar, alpha,
} from '@mui/material';
import {
  Flame, Brain, CheckCircle, TrendingUp,
  Target, ArrowUpRight, ArrowDownRight,
  RefreshCw, Wifi, WifiOff, Calendar,
  Award, Zap, Clock, BarChart3,
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip as ReTooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';

// ─── Mock Data (Static, No Backend Needed) ───────────────────────────────────
const MOCK_FOCUS_STATS = {
  totalSessions: 42,
  totalFocusTime: 3840, // minutes -> 64 hours
  currentStreak: 8,
  longestStreak: 14,
  dailyStats: {
    [new Date(Date.now() - 6 * 86400000).toDateString()]: 3,
    [new Date(Date.now() - 5 * 86400000).toDateString()]: 2,
    [new Date(Date.now() - 4 * 86400000).toDateString()]: 5,
    [new Date(Date.now() - 3 * 86400000).toDateString()]: 4,
    [new Date(Date.now() - 2 * 86400000).toDateString()]: 6,
    [new Date(Date.now() - 1 * 86400000).toDateString()]: 7,
    [new Date().toDateString()]: 4,
  },
};

const MOCK_TASKS = [
  { id: '1', title: 'Design system update', completed: true, priority: 'high' },
  { id: '2', title: 'User research synthesis', completed: true, priority: 'high' },
  { id: '3', title: 'Implement auth flow', completed: true, priority: 'medium' },
  { id: '4', title: 'Write documentation', completed: false, priority: 'high' },
  { id: '5', title: 'Code review', completed: false, priority: 'medium' },
  { id: '6', title: 'Team sync prep', completed: false, priority: 'low' },
  { id: '7', title: 'Analytics dashboard', completed: false, priority: 'high' },
  { id: '8', title: 'Bug fixes', completed: false, priority: 'medium' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function buildChartData(dailyStats, timeRange) {
  const today = new Date();
  const days = timeRange === 'week' ? 7 : 30;
  return Array.from({ length: days }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (days - 1 - i));
    const key = d.toDateString();
    return {
      name: timeRange === 'week'
        ? d.toLocaleDateString('en-US', { weekday: 'short' })
        : `${d.getMonth() + 1}/${d.getDate()}`,
      sessions: dailyStats[key] || 0,
    };
  });
}

// ─── Animation Variants ───────────────────────────────────────────────────────
const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] },
});

const scaleIn = (delay = 0) => ({
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
  transition: { duration: 0.4, delay, ease: 'easeOut' },
});

// ─── Main Analytics Page ──────────────────────────────────────────────────────
export default function AnalyticsPage({ darkMode = true }) {
  const [timeRange, setTimeRange] = useState('week');
  const [focusStats] = useState(MOCK_FOCUS_STATS);
  const [tasks] = useState(MOCK_TASKS);
  const [backendOnline, setBackendOnline] = useState(false);
  const [loading, setLoading] = useState(false);

  // Simulate refresh (just for UI feedback)
  const handleRefresh = useCallback(() => {
    setLoading(true);
    setTimeout(() => setLoading(false), 800);
  }, []);

  // ── Derived values ─────────────────────────────────────────────────────────
  const chartData = buildChartData(focusStats.dailyStats ?? {}, timeRange);
  const completedTasks = tasks.filter(t => t.completed).length;
  const totalTasks = tasks.length;
  const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
  const totalFocusHours = Math.floor((focusStats.totalFocusTime ?? 0) / 60);
  const remainingMinutes = (focusStats.totalFocusTime ?? 0) % 60;

  const last7 = chartData.slice(-7).reduce((s, d) => s + d.sessions, 0);
  const prev7 = chartData.slice(-14, -7).reduce((s, d) => s + d.sessions, 0);
  const trend = prev7 > 0 ? ((last7 - prev7) / prev7) * 100 : 12.5;

  const priorityData = [
    { name: 'High', value: tasks.filter(t => t.priority === 'high' && !t.completed).length, color: '#FF3B5C' },
    { name: 'Medium', value: tasks.filter(t => t.priority === 'medium' && !t.completed).length, color: '#FFB341' },
    { name: 'Low', value: tasks.filter(t => t.priority === 'low' && !t.completed).length, color: '#00D26A' },
    { name: 'Done', value: completedTasks, color: '#6366F1' },
  ].filter(d => d.value > 0);

  const statsCards = [
    {
      title: 'Focus Time', value: `${totalFocusHours}h ${remainingMinutes}m`,
      sub: `${focusStats.totalSessions ?? 0} total sessions`,
      icon: <Brain size={20} strokeWidth={1.8} />, color: '#6366F1', glow: 'rgba(99,102,241,0.4)',
      gradient: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
    },
    {
      title: 'Tasks Done', value: `${completedTasks}`,
      sub: `${totalTasks - completedTasks} remaining`,
      icon: <CheckCircle size={20} strokeWidth={1.8} />, color: '#00D26A', glow: 'rgba(0,210,106,0.3)',
      gradient: 'linear-gradient(135deg, #00D26A 0%, #10B981 100%)',
    },
    {
      title: 'Current Streak', value: `${focusStats.currentStreak ?? 0}d`,
      sub: `Best: ${focusStats.longestStreak ?? 0} days`,
      icon: <Flame size={20} strokeWidth={1.8} />, color: '#FFB341', glow: 'rgba(255,179,65,0.3)',
      gradient: 'linear-gradient(135deg, #FFB341 0%, #F59E0B 100%)',
    },
    {
      title: 'Completion Rate', value: `${Math.round(completionRate)}%`,
      sub: 'of all tasks', icon: <Target size={20} strokeWidth={1.8} />,
      color: trend >= 0 ? '#00D26A' : '#FF3B5C',
      glow: trend >= 0 ? 'rgba(0,210,106,0.3)' : 'rgba(255,59,92,0.3)',
      badge: `${trend > 0 ? '+' : ''}${Math.round(Math.abs(trend))}%`,
      badgeUp: trend >= 0,
      gradient: trend >= 0 
        ? 'linear-gradient(135deg, #00D26A 0%, #10B981 100%)'
        : 'linear-gradient(135deg, #FF3B5C 0%, #EF4444 100%)',
    },
  ];

  // Theme-aware colors
  const bgGradient = darkMode
    ? 'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(99,102,241,0.12) 0%, rgba(15,23,42,0) 70%)'
    : 'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(99,102,241,0.08) 0%, rgba(255,255,255,0) 70%)';
  
  const cardBg = darkMode ? 'rgba(18, 25, 45, 0.75)' : 'rgba(255,255,255,0.85)';
  const cardBorder = darkMode ? 'rgba(99,102,241,0.15)' : 'rgba(99,102,241,0.12)';
  const gridColor = darkMode ? 'rgba(99,102,241,0.08)' : 'rgba(37,99,235,0.06)';
  const textPrimary = darkMode ? '#F1F5F9' : '#0F172A';
  const textSecondary = darkMode ? '#94A3B8' : '#64748B';

  return (
    <Box sx={{
      minHeight: '100vh',
      background: darkMode ? '#0B1120' : '#F8FAFE',
      position: 'relative',
      pb: 8,
      px: { xs: 2, sm: 3, md: 4 },
    }}>
      {/* Ambient Background */}
      <Box sx={{
        position: 'fixed',
        inset: 0,
        background: bgGradient,
        pointerEvents: 'none',
        zIndex: 0,
      }} />
      
      {/* Subtle grid pattern */}
      <Box sx={{
        position: 'fixed',
        inset: 0,
        backgroundImage: darkMode 
          ? 'radial-gradient(circle at 1px 1px, rgba(99,102,241,0.03) 1px, transparent 1px)'
          : 'radial-gradient(circle at 1px 1px, rgba(0,0,0,0.02) 1px, transparent 1px)',
        backgroundSize: '40px 40px',
        pointerEvents: 'none',
        zIndex: 0,
      }} />

      <Box sx={{ position: 'relative', zIndex: 1, maxWidth: '1400px', mx: 'auto' }}>

        {/* ── Header Section ── */}
        <motion.div {...fadeUp(0)}>
          <Box sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            flexWrap: 'wrap',
            gap: 2,
            mb: 5,
            pt: 3,
          }}>
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Box sx={{
                  p: 0.75,
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <BarChart3 size={18} color="white" />
                </Box>
                <Typography sx={{
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: '#6366F1',
                }}>
                  Insights Dashboard
                </Typography>
              </Box>
              <Typography sx={{
                fontSize: { xs: '2rem', sm: '2.5rem', md: '3rem' },
                fontWeight: 900,
                letterSpacing: '-0.03em',
                lineHeight: 1.2,
                background: 'linear-gradient(135deg, #F1F5F9 0%, #CBD5E1 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                color: textPrimary,
                mb: 0.5,
              }}>
                Analytics
              </Typography>
              <Typography sx={{ color: textSecondary, fontSize: '0.9rem' }}>
                Track your focus, tasks, and momentum over time.
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              {/* Status Badge */}
              <Box sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                px: 2,
                py: 0.75,
                borderRadius: '40px',
                bgcolor: backendOnline === false ? alpha('#FF3B5C', 0.12) : alpha('#00D26A', 0.08),
                border: `1px solid ${backendOnline === false ? alpha('#FF3B5C', 0.2) : alpha('#00D26A', 0.2)}`,
              }}>
                {backendOnline
                  ? <Wifi size={12} color="#00D26A" />
                  : <WifiOff size={12} color="#FF3B5C" />}
                <Typography sx={{
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  color: backendOnline ? '#00D26A' : '#FF3B5C',
                }}>
                  {backendOnline ? 'Live Sync' : ' Mode'}
                </Typography>
              </Box>

              <Button
                onClick={handleRefresh}
                disabled={loading}
                size="small"
                startIcon={<RefreshCw size={14} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />}
                sx={{
                  textTransform: 'none',
                  borderRadius: '40px',
                  px: 2.5,
                  py: 0.75,
                  bgcolor: alpha('#6366F1', 0.1),
                  color: '#6366F1',
                  border: `1px solid ${alpha('#6366F1', 0.2)}`,
                  fontWeight: 600,
                  fontSize: '0.75rem',
                  backdropFilter: 'blur(4px)',
                  '&:hover': {
                    bgcolor: alpha('#6366F1', 0.2),
                  },
                }}
              >
                Refresh
              </Button>
            </Box>
          </Box>
        </motion.div>

        {/* Demo Mode Alert */}
        {!backendOnline && (
          <motion.div {...fadeUp(0.05)}>
            <Alert
              icon={<Zap size={16} />}
              severity="info"
              sx={{
                mb: 4,
                borderRadius: '20px',
                border: `1px solid ${alpha('#6366F1', 0.2)}`,
                bgcolor: alpha('#6366F1', 0.05),
                backdropFilter: 'blur(8px)',
                '& .MuiAlert-message': { width: '100%' },
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                <Typography sx={{ fontSize: '0.8rem', fontWeight: 500 }}>
                 
                </Typography>
                <Chip
                  label="Data Active"
                  size="small"
                  sx={{
                    bgcolor: alpha('#6366F1', 0.15),
                    color: '#6366F1',
                    fontSize: '0.7rem',
                    fontWeight: 600,
                    borderRadius: '20px',
                  }}
                />
              </Box>
            </Alert>
          </motion.div>
        )}

        {/* ── Stat Cards Grid (Full width, no right space) ── */}
        <Grid container spacing={2.5} sx={{ mb: 5 }}>
          {statsCards.map((stat, i) => (
            <Grid item xs={12} sm={6} md={3} key={i}>
              <motion.div {...fadeUp(0.1 + i * 0.05)} style={{ height: '100%' }}>
                <Card sx={{
                  borderRadius: '28px',
                  border: `1px solid ${cardBorder}`,
                  bgcolor: cardBg,
                  backdropFilter: 'blur(16px)',
                  overflow: 'hidden',
                  position: 'relative',
                  height: '100%',
                  transition: 'all 0.3s cubic-bezier(0.2, 0, 0, 1)',
                  '&:hover': {
                    transform: 'translateY(-6px)',
                    borderColor: alpha(stat.color, 0.3),
                    boxShadow: `0 20px 35px -12px ${stat.glow}`,
                  },
                }}>
                  {/* Glow overlay */}
                  <Box sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '4px',
                    background: stat.gradient,
                  }} />
                  
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2.5 }}>
                      <Avatar sx={{
                        width: 44,
                        height: 44,
                        background: `linear-gradient(135deg, ${alpha(stat.color, 0.15)} 0%, ${alpha(stat.color, 0.05)} 100%)`,
                        color: stat.color,
                        borderRadius: '16px',
                      }}>
                        {stat.icon}
                      </Avatar>
                      {stat.badge && (
                        <Chip
                          label={stat.badge}
                          size="small"
                          icon={stat.badgeUp ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                          sx={{
                            height: 24,
                            fontSize: '0.65rem',
                            fontWeight: 700,
                            bgcolor: stat.badgeUp ? alpha('#00D26A', 0.12) : alpha('#FF3B5C', 0.12),
                            color: stat.badgeUp ? '#00D26A' : '#FF3B5C',
                            borderRadius: '20px',
                            '& .MuiChip-icon': { marginLeft: '4px', marginRight: '-2px' },
                          }}
                        />
                      )}
                    </Box>

                    <Typography sx={{
                      fontSize: '2.2rem',
                      fontWeight: 800,
                      letterSpacing: '-0.02em',
                      color: textPrimary,
                      fontFamily: "'Inter', monospace",
                      mb: 0.5,
                    }}>
                      {stat.value}
                    </Typography>
                    <Typography sx={{
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      color: stat.color,
                      mb: 0.25,
                    }}>
                      {stat.title}
                    </Typography>
                    <Typography variant="caption" sx={{ color: textSecondary }}>
                      {stat.sub}
                    </Typography>
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>
          ))}
        </Grid>

        {/* ── Charts Row ── */}
        <Grid container spacing={2.5} sx={{ mb: 5 }}>

          {/* Area Chart */}
          <Grid item xs={12} md={7}>
            <motion.div {...fadeUp(0.3)}>
              <Card sx={{
                borderRadius: '28px',
                border: `1px solid ${cardBorder}`,
                bgcolor: cardBg,
                backdropFilter: 'blur(16px)',
                overflow: 'hidden',
              }}>
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    flexWrap: 'wrap',
                    gap: 2,
                    mb: 3,
                  }}>
                    <Box>
                      <Typography sx={{
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        color: '#6366F1',
                        textTransform: 'uppercase',
                        letterSpacing: '0.08em',
                        mb: 0.5,
                      }}>
                        Focus Sessions
                      </Typography>
                      <Typography sx={{
                        fontSize: '1.8rem',
                        fontWeight: 800,
                        letterSpacing: '-0.02em',
                        color: textPrimary,
                        fontFamily: "'Inter', monospace",
                      }}>
                        {last7}
                        <Typography component="span" sx={{ fontSize: '0.8rem', color: textSecondary, ml: 1, fontWeight: 500 }}>
                          this {timeRange}
                        </Typography>
                      </Typography>
                    </Box>

                    <Box sx={{
                      display: 'flex',
                      gap: 0.5,
                      p: 0.5,
                      borderRadius: '40px',
                      bgcolor: darkMode ? alpha('#6366F1', 0.08) : alpha('#6366F1', 0.05),
                      border: `1px solid ${cardBorder}`,
                    }}>
                      {['week', 'month'].map(r => (
                        <Button
                          key={r}
                          onClick={() => setTimeRange(r)}
                          disableElevation
                          sx={{
                            px: 2.5,
                            py: 0.75,
                            borderRadius: '32px',
                            textTransform: 'none',
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            bgcolor: timeRange === r ? '#6366F1' : 'transparent',
                            color: timeRange === r ? 'white' : textSecondary,
                            transition: 'all 0.2s',
                            '&:hover': {
                              bgcolor: timeRange === r ? '#4F46E5' : alpha('#6366F1', 0.1),
                            },
                          }}
                        >
                          {r.charAt(0).toUpperCase() + r.slice(1)}
                        </Button>
                      ))}
                    </Box>
                  </Box>

                  <ResponsiveContainer width="100%" height={260}>
                    <AreaChart data={chartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="sessionGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#6366F1" stopOpacity={0.4} />
                          <stop offset="100%" stopColor="#6366F1" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="4 4" stroke={gridColor} vertical={false} />
                      <XAxis
                        dataKey="name"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: textSecondary, fontSize: 11, fontWeight: 500 }}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: textSecondary, fontSize: 11 }}
                        allowDecimals={false}
                      />
                      <ReTooltip
                        content={({ active, payload }) => {
                          if (!active || !payload?.length) return null;
                          return (
                            <Box sx={{
                              bgcolor: darkMode ? '#1E293B' : '#FFFFFF',
                              px: 1.5,
                              py: 1,
                              borderRadius: '12px',
                              border: `1px solid ${alpha('#6366F1', 0.2)}`,
                              boxShadow: '0 8px 20px rgba(0,0,0,0.15)',
                            }}>
                              <Typography sx={{ fontSize: '0.65rem', color: '#6366F1', fontWeight: 700 }}>
                                {payload[0].payload.name}
                              </Typography>
                              <Typography sx={{ fontSize: '1.2rem', fontWeight: 800, color: textPrimary }}>
                                {payload[0].value} sessions
                              </Typography>
                            </Box>
                          );
                        }}
                        cursor={{ stroke: '#6366F1', strokeWidth: 1.5, strokeDasharray: '4 4' }}
                      />
                      <Area
                        type="monotone"
                        dataKey="sessions"
                        stroke="#6366F1"
                        strokeWidth={2.5}
                        fill="url(#sessionGradient)"
                        dot={{ fill: '#6366F1', r: 3, strokeWidth: 0 }}
                        activeDot={{ r: 6, fill: '#6366F1', stroke: '#fff', strokeWidth: 2 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>

          {/* Pie Chart */}
          <Grid item xs={12} md={5}>
            <motion.div {...fadeUp(0.35)} style={{ height: '100%' }}>
              <Card sx={{
                borderRadius: '28px',
                height: '100%',
                border: `1px solid ${cardBorder}`,
                bgcolor: cardBg,
                backdropFilter: 'blur(16px)',
              }}>
                <CardContent sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <Box sx={{ mb: 2 }}>
                    <Typography sx={{
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      color: '#6366F1',
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                      mb: 0.5,
                    }}>
                      Task Distribution
                    </Typography>
                    <Typography sx={{
                      fontSize: '1.8rem',
                      fontWeight: 800,
                      letterSpacing: '-0.02em',
                      color: textPrimary,
                      fontFamily: "'Inter', monospace",
                    }}>
                      {totalTasks}
                      <Typography component="span" sx={{ fontSize: '0.8rem', color: textSecondary, ml: 1, fontWeight: 500 }}>
                        total tasks
                      </Typography>
                    </Typography>
                  </Box>

                  {priorityData.length > 0 ? (
                    <>
                      <ResponsiveContainer width="100%" height={200}>
                        <PieChart>
                          <Pie
                            data={priorityData}
                            cx="50%"
                            cy="50%"
                            innerRadius="45%"
                            outerRadius="70%"
                            paddingAngle={3}
                            dataKey="value"
                            stroke="none"
                          >
                            {priorityData.map((entry, idx) => (
                              <Cell key={idx} fill={entry.color} />
                            ))}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                      <Box sx={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: 2,
                        justifyContent: 'center',
                        mt: 2,
                      }}>
                        {priorityData.map((item, idx) => (
                          <Box key={idx} sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                            <Box sx={{
                              width: 10,
                              height: 10,
                              borderRadius: '3px',
                              bgcolor: item.color,
                            }} />
                            <Typography sx={{ fontSize: '0.7rem', color: textSecondary, fontWeight: 600 }}>
                              {item.name}
                              <Typography component="span" sx={{ color: textPrimary, fontWeight: 800, ml: 0.5 }}>
                                {item.value}
                              </Typography>
                            </Typography>
                          </Box>
                        ))}
                      </Box>
                    </>
                  ) : (
                    <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Typography sx={{ color: textSecondary }}>No tasks available</Typography>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </Grid>
        </Grid>

        {/* ── Trend + Streak Row ── */}
        <Grid container spacing={2.5} sx={{ mb: 5 }}>

          {/* Weekly Trend Card */}
          <Grid item xs={12} md={6}>
            <motion.div {...fadeUp(0.45)}>
              <Card sx={{
                borderRadius: '28px',
                border: `1px solid ${cardBorder}`,
                bgcolor: cardBg,
                backdropFilter: 'blur(16px)',
                overflow: 'hidden',
              }}>
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
                    <Avatar sx={{
                      width: 40,
                      height: 40,
                      bgcolor: alpha('#6366F1', 0.1),
                      borderRadius: '14px',
                    }}>
                      <TrendingUp size={18} color="#6366F1" />
                    </Avatar>
                    <Box>
                      <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: textSecondary }}>
                        Performance Trend
                      </Typography>
                      <Typography sx={{ fontSize: '0.8rem', fontWeight: 600, color: textPrimary }}>
                        Week over week comparison
                      </Typography>
                    </Box>
                  </Box>

                  <Typography sx={{
                    fontSize: '3rem',
                    fontWeight: 900,
                    lineHeight: 1,
                    letterSpacing: '-0.03em',
                    fontFamily: "'Inter', monospace",
                    color: trend >= 0 ? '#00D26A' : '#FF3B5C',
                    mb: 1,
                  }}>
                    {trend > 0 ? '+' : ''}{Math.round(trend)}%
                  </Typography>
                  <Typography sx={{ fontSize: '0.8rem', color: textSecondary, mb: 3 }}>
                    {trend >= 0 ? '↑ Increased focus activity compared to last week' : '↓ Slightly lower focus activity this week'}
                  </Typography>

                  <Box sx={{ position: 'relative', height: 8, borderRadius: '20px', bgcolor: alpha('#6366F1', 0.1), overflow: 'hidden' }}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(Math.abs(trend), 100)}%` }}
                      transition={{ duration: 1, delay: 0.5, ease: 'easeOut' }}
                      style={{
                        height: '100%',
                        borderRadius: '20px',
                        background: trend >= 0
                          ? 'linear-gradient(90deg, #00D26A, #10B981)'
                          : 'linear-gradient(90deg, #FF3B5C, #EF4444)',
                      }}
                    />
                  </Box>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>

          {/* Streak Card */}
          <Grid item xs={12} md={6}>
            <motion.div {...fadeUp(0.5)}>
              <Card sx={{
                borderRadius: '28px',
                border: `1px solid ${alpha('#FFB341', 0.2)}`,
                background: darkMode
                  ? 'linear-gradient(135deg, rgba(255,179,65,0.08) 0%, rgba(15,23,42,0.9) 100%)'
                  : 'linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%)',
                backdropFilter: 'blur(16px)',
                position: 'relative',
                overflow: 'hidden',
              }}>
                <Box sx={{
                  position: 'absolute',
                  top: -30,
                  right: -30,
                  width: 140,
                  height: 140,
                  borderRadius: '50%',
                  background: 'radial-gradient(circle, rgba(255,179,65,0.15) 0%, transparent 70%)',
                }} />
                
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
                    <Box>
                      <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#FFB341' }}>
                        Current Streak
                      </Typography>
                      <Typography sx={{
                        fontSize: '3rem',
                        fontWeight: 900,
                        letterSpacing: '-0.03em',
                        fontFamily: "'Inter', monospace",
                        color: '#FFB341',
                        lineHeight: 1,
                        mt: 0.5,
                      }}>
                        {focusStats.currentStreak}d
                      </Typography>
                      <Typography sx={{ fontSize: '0.7rem', color: alpha('#FFB341', 0.7), mt: 0.5 }}>
                        Best: {focusStats.longestStreak} days
                      </Typography>
                    </Box>
                    <motion.div
                      animate={{ scale: [1, 1.08, 1], rotate: [0, -3, 3, 0] }}
                      transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
                    >
                      <Flame size={48} color="#FFB341" strokeWidth={1.5} />
                    </motion.div>
                  </Box>

                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {Array.from({ length: 7 }, (_, i) => {
                      const active = i < (focusStats.currentStreak % 7) || (focusStats.currentStreak >= 7 && i < 7);
                      return (
                        <motion.div
                          key={i}
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: 0.6 + i * 0.05, type: 'spring', stiffness: 300 }}
                        >
                          <Box sx={{
                            width: { xs: 32, sm: 38 },
                            height: { xs: 32, sm: 38 },
                            borderRadius: '14px',
                            bgcolor: active ? '#FFB341' : alpha('#FFB341', 0.15),
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.2s',
                            border: active ? 'none' : `1px solid ${alpha('#FFB341', 0.2)}`,
                          }}>
                            <Typography sx={{
                              fontSize: '0.7rem',
                              fontWeight: 800,
                              color: active ? '#0B1120' : '#FFB341',
                            }}>
                              {i + 1}
                            </Typography>
                          </Box>
                        </motion.div>
                      );
                    })}
                  </Box>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>
        </Grid>

        {/* ── Motivational Banner ── */}
        <motion.div {...scaleIn(0.55)}>
          <Box sx={{
            borderRadius: '28px',
            p: { xs: 3, sm: 4 },
            background: darkMode
              ? `linear-gradient(135deg, ${alpha('#6366F1', 0.08)} 0%, ${alpha('#8B5CF6', 0.04)} 100%)`
              : `linear-gradient(135deg, ${alpha('#6366F1', 0.04)} 0%, ${alpha('#8B5CF6', 0.02)} 100%)`,
            border: `1px solid ${alpha('#6366F1', 0.15)}`,
            textAlign: 'center',
          }}>
            <Typography sx={{
              fontSize: '0.85rem',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              color: '#6366F1',
              mb: 1.5,
            }}>
              Weekly Insight
            </Typography>
            <Typography sx={{
              fontSize: { xs: '1rem', sm: '1.2rem' },
              fontStyle: 'italic',
              color: textPrimary,
              fontWeight: 500,
              maxWidth: '600px',
              mx: 'auto',
              lineHeight: 1.5,
            }}>
              "The secret of getting ahead is getting started. You're {focusStats.currentStreak} days strong — keep the momentum!"
            </Typography>
            <Box sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 0.5,
              mt: 2,
            }}>
              <Calendar size={12} color={textSecondary} />
              <Typography sx={{ fontSize: '0.65rem', color: textSecondary }}>
                Last updated just now
              </Typography>
            </Box>
          </Box>
        </motion.div>

        {/* Keyframes for spin animation */}
        <style>
          {`
            @keyframes spin {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }
          `}
        </style>
      </Box>
    </Box>
  );
}