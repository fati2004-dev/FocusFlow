import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Box,
  Typography,
  Button,
  IconButton,
  Slider,
  Chip,
  Card,
  CardContent,
  LinearProgress,
  Tooltip,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Switch,
  FormControlLabel,
} from '@mui/material';
import {
  Play,
  Pause,
  RotateCcw,
  SkipForward,
  Volume2,
  VolumeX,
  Bell,
  BellOff,
  Moon,
  Sun,
  Coffee,
  Brain,
  TrendingUp,
  Calendar,
  Clock,
  CheckCircle,
  Target,
  Zap,
  Shield,
  Eye,
  EyeOff,
  Settings,
} from 'lucide-react';

// Save/load from localStorage
const saveFocusStats = (stats) => {
  localStorage.setItem('focusflow_focus_stats', JSON.stringify(stats));
};

const loadFocusStats = () => {
  const saved = localStorage.getItem('focusflow_focus_stats');
  if (saved) {
    return JSON.parse(saved);
  }
  return {
    totalSessions: 0,
    totalFocusTime: 0,
    currentStreak: 0,
    longestStreak: 0,
    dailyStats: {},
  };
};

function FocusPage({ darkMode }) {
  // Timer state
  const [mode, setMode] = useState('pomodoro'); // pomodoro, shortBreak, longBreak
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [sessionsCompleted, setSessionsCompleted] = useState(0);
  const [selectedTask, setSelectedTask] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [distractionMode, setDistractionMode] = useState(false);
  
  // Stats
  const [focusStats, setFocusStats] = useState(loadFocusStats());
  
  // Custom durations
  const [customTimes, setCustomTimes] = useState({
    pomodoro: 25,
    shortBreak: 5,
    longBreak: 15,
  });

  // Timer configurations
  const timerConfig = {
    pomodoro: { label: 'Focus', duration: customTimes.pomodoro * 60, icon: <Brain size={20} />, color: '#2563EB' },
    shortBreak: { label: 'Short Break', duration: customTimes.shortBreak * 60, icon: <Coffee size={20} />, color: '#10B981' },
    longBreak: { label: 'Long Break', duration: customTimes.longBreak * 60, icon: <Moon size={20} />, color: '#8B5CF6' },
  };

  // Sample tasks (would connect to your tasks page)
  const availableTasks = [
    { id: 1, title: 'Finish project proposal', priority: 'high' },
    { id: 2, title: 'Review Chapter 2', priority: 'medium' },
    { id: 3, title: 'Study for exam', priority: 'high' },
  ];

  // Timer logic
  useEffect(() => {
    let interval = null;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isActive) {
      handleTimerComplete();
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft]);

  const handleTimerComplete = () => {
    setIsActive(false);
    
    // Play sound if enabled
    if (soundEnabled) {
      const audio = new Audio('https://actions.google.com/sounds/4434242-1h0t1.mp3');
      audio.play().catch(e => console.log('Audio play failed'));
    }
    
    // Send notification if enabled
    if (notificationsEnabled && Notification.permission === 'granted') {
      new Notification('FocusFlow', {
        body: mode === 'pomodoro' ? 'Focus session complete! Time for a break.' : 'Break is over! Ready to focus?',
        icon: '/favicon.ico',
      });
    }
    
    if (mode === 'pomodoro') {
      const newSessions = sessionsCompleted + 1;
      setSessionsCompleted(newSessions);
      
      // Update stats
      const today = new Date().toDateString();
      const updatedStats = { ...focusStats };
      updatedStats.totalSessions += 1;
      updatedStats.totalFocusTime += timerConfig.pomodoro.duration / 60;
      updatedStats.dailyStats[today] = (updatedStats.dailyStats[today] || 0) + 1;
      
      // Update streak
      const yesterday = new Date(Date.now() - 86400000).toDateString();
      if (updatedStats.dailyStats[yesterday]) {
        updatedStats.currentStreak += 1;
      } else {
        updatedStats.currentStreak = 1;
      }
      updatedStats.longestStreak = Math.max(updatedStats.longestStreak, updatedStats.currentStreak);
      
      setFocusStats(updatedStats);
      saveFocusStats(updatedStats);
      
      // Auto switch to break after 4 pomodoros
      if ((newSessions) % 4 === 0) {
        setMode('longBreak');
        setTimeLeft(timerConfig.longBreak.duration);
      } else {
        setMode('shortBreak');
        setTimeLeft(timerConfig.shortBreak.duration);
      }
    } else {
      // Break completed, switch back to focus
      setMode('pomodoro');
      setTimeLeft(timerConfig.pomodoro.duration);
    }
  };

  const handleModeChange = (newMode) => {
    if (isActive) setIsActive(false);
    setMode(newMode);
    setTimeLeft(timerConfig[newMode].duration);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getProgress = () => {
    const total = timerConfig[mode].duration;
    return ((total - timeLeft) / total) * 100;
  };

  // Request notification permission
  useEffect(() => {
    if (notificationsEnabled && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, [notificationsEnabled]);

  // Get weekly stats for chart
  const getWeeklyStats = () => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const today = new Date();
    const dayOfWeek = today.getDay();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1));
    
    return days.map((day, index) => {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + index);
      const dateStr = date.toDateString();
      return {
        day,
        sessions: focusStats.dailyStats[dateStr] || 0,
        fullDate: dateStr,
      };
    });
  };

  const weeklyStats = getWeeklyStats();
  const maxSessions = Math.max(...weeklyStats.map(w => w.sessions), 1);

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography
          variant="h4"
          sx={{
            fontWeight: 700,
            mb: 1,
            color: 'text.primary',
          }}
        >
          Focus Mode
        </Typography>
        <Typography variant="body1" sx={{ color: 'text.secondary' }}>
          Stay focused with Pomodoro timer and track your productivity.
        </Typography>
      </Box>

      {/* Main Timer Section */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', lg: 'row' },
          gap: 4,
          mb: 4,
        }}
      >
        {/* Timer Card */}
        <Box sx={{ flex: 1.5 }}>
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', damping: 20 }}
          >
            <Card
              sx={{
                borderRadius: 4,
                background: darkMode 
                  ? 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)'
                  : 'linear-gradient(135deg, #FFFFFF 0%, #F9FAFB 100%)',
                border: '1px solid',
                borderColor: 'divider',
                textAlign: 'center',
                p: 4,
              }}
            >
              {/* Mode Selector */}
              <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, mb: 4 }}>
                {Object.entries(timerConfig).map(([key, config]) => (
                  <Button
                    key={key}
                    variant={mode === key ? 'contained' : 'text'}
                    onClick={() => handleModeChange(key)}
                    startIcon={config.icon}
                    sx={{
                      textTransform: 'none',
                      borderRadius: 2,
                      bgcolor: mode === key ? config.color : 'transparent',
                      color: mode === key ? 'white' : 'text.secondary',
                      '&:hover': {
                        bgcolor: mode === key ? config.color : darkMode ? '#334155' : '#F3F4F6',
                      },
                    }}
                  >
                    {config.label}
                  </Button>
                ))}
              </Box>

              {/* Timer Display */}
              <Box sx={{ position: 'relative', display: 'inline-block', mb: 4 }}>
                <Box
                  sx={{
                    position: 'relative',
                    width: { xs: 250, md: 300 },
                    height: { xs: 250, md: 300 },
                    mx: 'auto',
                  }}
                >
                  <svg width="100%" height="100%" viewBox="0 0 120 120">
                    <circle
                      cx="60"
                      cy="60"
                      r="54"
                      fill="none"
                      stroke={darkMode ? '#334155' : '#E5E7EB'}
                      strokeWidth="8"
                    />
                    <circle
                      cx="60"
                      cy="60"
                      r="54"
                      fill="none"
                      stroke={timerConfig[mode].color}
                      strokeWidth="8"
                      strokeLinecap="round"
                      strokeDasharray={`${2 * Math.PI * 54}`}
                      strokeDashoffset={`${2 * Math.PI * 54 * (1 - getProgress() / 100)}`}
                      transform="rotate(-90 60 60)"
                      style={{ transition: 'stroke-dashoffset 0.3s ease' }}
                    />
                  </svg>
                  <Box
                    sx={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      textAlign: 'center',
                    }}
                  >
                    <Typography
                      variant="h1"
                      sx={{
                        fontSize: { xs: '2.5rem', md: '3rem' },
                        fontWeight: 700,
                        fontFamily: 'monospace',
                        letterSpacing: 2,
                      }}
                    >
                      {formatTime(timeLeft)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {mode === 'pomodoro' ? 'Focus Session' : 'Break Time'}
                    </Typography>
                  </Box>
                </Box>
              </Box>

              {/* Timer Controls */}
              <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mb: 3 }}>
                <IconButton
                  onClick={() => setIsActive(!isActive)}
                  sx={{
                    bgcolor: timerConfig[mode].color,
                    color: 'white',
                    width: 56,
                    height: 56,
                    '&:hover': { bgcolor: timerConfig[mode].color, opacity: 0.9 },
                  }}
                >
                  {isActive ? <Pause size={28} /> : <Play size={28} />}
                </IconButton>
                <IconButton
                  onClick={() => {
                    setIsActive(false);
                    setTimeLeft(timerConfig[mode].duration);
                  }}
                  sx={{
                    bgcolor: darkMode ? '#334155' : '#F3F4F6',
                    width: 56,
                    height: 56,
                  }}
                >
                  <RotateCcw size={24} />
                </IconButton>
                <IconButton
                  onClick={() => setShowSettings(true)}
                  sx={{
                    bgcolor: darkMode ? '#334155' : '#F3F4F6',
                    width: 56,
                    height: 56,
                  }}
                >
                  <Settings size={24} />
                </IconButton>
              </Box>

              {/* Session Counter */}
              <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
                <Chip
                  icon={<Brain size={14} />}
                  label={`${sessionsCompleted} sessions today`}
                  sx={{ bgcolor: darkMode ? '#334155' : '#F3F4F6' }}
                />
                <Chip
                  icon={<Target size={14} />}
                  label={`${4 - (sessionsCompleted % 4)} until long break`}
                  sx={{ bgcolor: darkMode ? '#334155' : '#F3F4F6' }}
                />
              </Box>
            </Card>
          </motion.div>
        </Box>

        {/* Right Panel - Task & Stats */}
        <Box sx={{ flex: 1 }}>
          {/* Selected Task */}
          <Card sx={{ borderRadius: 3, mb: 3, border: '1px solid', borderColor: 'divider' }}>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                Current Focus Task
              </Typography>
              {selectedTask ? (
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="body1" fontWeight={500}>
                      {selectedTask.title}
                    </Typography>
                    <Chip
                      label={selectedTask.priority}
                      size="small"
                      sx={{ mt: 0.5, height: 20, fontSize: '0.7rem' }}
                    />
                  </Box>
                  <IconButton size="small" onClick={() => setSelectedTask(null)}>
                    <EyeOff size={16} />
                  </IconButton>
                </Box>
              ) : (
                <Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Select a task to focus on
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {availableTasks.map(task => (
                      <Chip
                        key={task.id}
                        label={task.title}
                        onClick={() => setSelectedTask(task)}
                        sx={{ cursor: 'pointer' }}
                      />
                    ))}
                  </Box>
                </Box>
              )}
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card sx={{ borderRadius: 3, mb: 3, border: '1px solid', borderColor: 'divider' }}>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2 }}>
                Today's Progress
              </Typography>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 4 }}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" fontWeight={700} color="#2563EB">
                    {sessionsCompleted}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">Sessions</Typography>
                </Box>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" fontWeight={700} color="#10B981">
                    {Math.floor(sessionsCompleted * (customTimes.pomodoro / 60))}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">Hours</Typography>
                </Box>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" fontWeight={700} color="#F59E0B">
                    {focusStats.currentStreak}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">Day Streak</Typography>
                </Box>
              </Box>

              {/* Weekly Chart */}
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2 }}>
                This Week
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, justifyContent: 'space-between' }}>
                {weeklyStats.map((stat, index) => (
                  <Box key={index} sx={{ textAlign: 'center', flex: 1 }}>
                    <Box
                      sx={{
                        height: `${(stat.sessions / maxSessions) * 80}px`,
                        width: '100%',
                        bgcolor: stat.sessions > 0 ? '#2563EB' : darkMode ? '#334155' : '#E5E7EB',
                        borderRadius: 1,
                        mb: 1,
                        transition: 'height 0.3s ease',
                      }}
                    />
                    <Typography variant="caption" color="text.secondary">
                      {stat.day}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>

          {/* Distraction Blocker */}
          <Card sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Shield size={18} color="#8B5CF6" />
                  <Typography variant="subtitle2">Distraction Blocker</Typography>
                </Box>
                <Switch
                  checked={distractionMode}
                  onChange={() => setDistractionMode(!distractionMode)}
                  sx={{
                    '& .MuiSwitch-switchBase.Mui-checked': { color: '#8B5CF6' },
                    '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: '#8B5CF6' },
                  }}
                />
              </Box>
              {distractionMode ? (
                <>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Blocked sites: Twitter, Instagram, YouTube, Reddit
                  </Typography>
                  <Button size="small" variant="outlined" sx={{ textTransform: 'none' }}>
                    Manage Blocked Sites
                  </Button>
                </>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  Enable distraction blocker to stay focused during work sessions
                </Typography>
              )}
            </CardContent>
          </Card>
        </Box>
      </Box>

      {/* Motivation Quote */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card
          sx={{
            borderRadius: 3,
            bgcolor: '#EFF6FF',
            border: '1px solid #DBEAFE',
            textAlign: 'center',
            py: 3,
          }}
        >
          <Typography variant="body1" sx={{ color: '#1F2937', fontStyle: 'italic', mb: 1 }}>
            "The secret of getting ahead is getting started. The secret of getting started is breaking your complex overwhelming tasks into small manageable tasks, and then starting on the first one."
          </Typography>
          <Typography variant="caption" sx={{ color: '#2563EB' }}>
            — Mark Twain
          </Typography>
        </Card>
      </motion.div>

      {/* Settings Dialog */}
      <Dialog
        open={showSettings}
        onClose={() => setShowSettings(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 3, bgcolor: darkMode ? '#1E293B' : '#FFFFFF' },
        }}
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" fontWeight={600}>Focus Settings</Typography>
            <IconButton onClick={() => setShowSettings(false)} size="small">
              <RotateCcw size={18} />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>Pomodoro Duration (minutes)</Typography>
              <Slider
                value={customTimes.pomodoro}
                onChange={(_, val) => setCustomTimes(prev => ({ ...prev, pomodoro: val }))}
                min={15}
                max={60}
                step={5}
                valueLabelDisplay="auto"
                sx={{ color: '#2563EB' }}
              />
            </Box>
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>Short Break (minutes)</Typography>
              <Slider
                value={customTimes.shortBreak}
                onChange={(_, val) => setCustomTimes(prev => ({ ...prev, shortBreak: val }))}
                min={3}
                max={15}
                step={1}
                valueLabelDisplay="auto"
                sx={{ color: '#10B981' }}
              />
            </Box>
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>Long Break (minutes)</Typography>
              <Slider
                value={customTimes.longBreak}
                onChange={(_, val) => setCustomTimes(prev => ({ ...prev, longBreak: val }))}
                min={10}
                max={30}
                step={5}
                valueLabelDisplay="auto"
                sx={{ color: '#8B5CF6' }}
              />
            </Box>
            <Box sx={{ borderTop: '1px solid', borderColor: 'divider', pt: 2 }}>
              <FormControlLabel
                control={<Switch checked={soundEnabled} onChange={() => setSoundEnabled(!soundEnabled)} />}
                label="Enable sound notifications"
              />
              <FormControlLabel
                control={<Switch checked={notificationsEnabled} onChange={() => setNotificationsEnabled(!notificationsEnabled)} />}
                label="Enable browser notifications"
              />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowSettings(false)} variant="contained" sx={{ bgcolor: '#2563EB', textTransform: 'none' }}>
            Done
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default FocusPage;