import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Box,
  Typography,
  Switch,
  Avatar,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  LayoutGrid,
  CheckSquare,
  FileText,
  Timer,
  BarChart3,
  MessageCircle,
  Sun,
  Moon,
  User,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

const navItems = [
  { text: 'Dashboard', icon: LayoutGrid, path: '/' },
  { text: 'Tasks', icon: CheckSquare, path: '/tasks' },
  { text: 'Documents', icon: FileText, path: '/documents' },
  { text: 'Focus', icon: Timer, path: '/focus' },
  { text: 'Analytics', icon: BarChart3, path: '/analytics' },
  { text: 'Coach', icon: MessageCircle, path: '/coach', badge: 'AI' },
];

function Sidebar({ darkMode, toggleDarkMode, collapsed, toggleCollapse }) {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <motion.div
      animate={{ width: collapsed ? 80 : 260 }}
      transition={{ duration: 0.2, ease: 'easeInOut' }}
      style={{
  width: collapsed ? 80 : 260,
  height: '100vh',
  backgroundColor: darkMode ? '#1E293B' : '#FFFFFF',
  borderRight: `1px solid ${darkMode ? '#334155' : '#E5E7EB'}`,
  overflow: 'hidden',
  flexShrink: 0,
}}
    >
      <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* Logo + Collapse Button */}
        <Box
          sx={{
            p: collapsed ? 2 : 3,
            display: 'flex',
            alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'space-between',
            borderBottom: `1px solid ${darkMode ? '#334155' : '#E5E7EB'}`,
          }}
        >
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{ display: 'flex', alignItems: 'center', gap: 8 }}
            >
              <Box
                sx={{
                  width: 32,
                  height: 32,
                  borderRadius: 2,
                  background: 'linear-gradient(135deg, #2563EB 0%, #1E40AF 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Typography sx={{ fontSize: 18 }}>🧠</Typography>
              </Box>
              <Typography
                sx={{
                  fontWeight: 700,
                  fontSize: '1.1rem',
                  color: darkMode ? '#F1F5F9' : '#1F2937',
                  letterSpacing: '-0.02em',
                }}
              >
                FocusFlow
              </Typography>
            </motion.div>
          )}
          {collapsed && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              style={{
                width: 32,
                height: 32,
                borderRadius: 2,
                background: 'linear-gradient(135deg, #2563EB 0%, #1E40AF 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Typography sx={{ fontSize: 18 }}>🧠</Typography>
            </motion.div>
          )}
          <IconButton
            onClick={toggleCollapse}
            size="small"
            sx={{
              color: darkMode ? '#94A3B8' : '#6B7280',
              '&:hover': { bgcolor: darkMode ? '#334155' : '#F3F4F6' },
            }}
          >
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </IconButton>
        </Box>

        {/* Navigation */}
        <Box sx={{ flex: 1, px: collapsed ? 1 : 2, py: 3 }}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Tooltip title={collapsed ? item.text : ''} placement="right" key={item.text}>
                <motion.div whileHover={{ x: 4 }} transition={{ duration: 0.1 }}>
                  <Box
                    onClick={() => navigate(item.path)}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: collapsed ? 'center' : 'flex-start',
                      gap: collapsed ? 0 : 3,
                      px: collapsed ? 0 : 2,
                      py: 1.5,
                      mb: 0.5,
                      borderRadius: 2,
                      cursor: 'pointer',
                      backgroundColor: isActive
                        ? darkMode
                          ? '#3B82F6'
                          : '#2563EB'
                        : 'transparent',
                      color: isActive
                        ? 'white'
                        : darkMode
                        ? '#94A3B8'
                        : '#6B7280',
                      '&:hover': {
                        backgroundColor: isActive
                          ? darkMode
                            ? '#2563EB'
                            : '#1E40AF'
                          : darkMode
                          ? '#334155'
                          : '#F3F4F6',
                      },
                    }}
                  >
                    <Icon size={20} />
                    {!collapsed && (
                      <Typography
                        sx={{
                          fontSize: '0.875rem',
                          fontWeight: isActive ? 500 : 400,
                          flex: 1,
                        }}
                      >
                        {item.text}
                      </Typography>
                    )}
                    {!collapsed && item.badge && (
                      <Box
                        sx={{
                          bgcolor: isActive ? 'rgba(255,255,255,0.2)' : '#DBEAFE',
                          px: 1,
                          py: 0.25,
                          borderRadius: 1,
                        }}
                      >
                        <Typography
                          sx={{
                            fontSize: 10,
                            fontWeight: 500,
                            color: isActive ? 'white' : '#2563EB',
                          }}
                        >
                          {item.badge}
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </motion.div>
              </Tooltip>
            );
          })}
        </Box>

        {/* Bottom Section */}
        <Box sx={{ p: collapsed ? 1 : 2, borderTop: `1px solid ${darkMode ? '#334155' : '#E5E7EB'}` }}>
          {/* Dark Mode Toggle */}
          <Tooltip title={collapsed ? 'Dark Mode' : ''} placement="right">
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: collapsed ? 'center' : 'space-between',
                py: 1.5,
                px: collapsed ? 0 : 2,
                borderRadius: 2,
                cursor: 'pointer',
                '&:hover': { bgcolor: darkMode ? '#334155' : '#F3F4F6' },
              }}
            >
              {!collapsed && (
                <>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    {darkMode ? <Moon size={18} /> : <Sun size={18} />}
                    <Typography variant="body2">Dark Mode</Typography>
                  </Box>
                  <Switch
                    checked={darkMode}
                    onChange={toggleDarkMode}
                    size="small"
                    sx={{
                      '& .MuiSwitch-switchBase.Mui-checked': { color: '#2563EB' },
                      '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: '#2563EB' },
                    }}
                  />
                </>
              )}
              {collapsed && (
                <IconButton onClick={toggleDarkMode} size="small">
                  {darkMode ? <Moon size={18} /> : <Sun size={18} />}
                </IconButton>
              )}
            </Box>
          </Tooltip>

          {/* User Profile */}
          <Tooltip title={collapsed ? 'Profile' : ''} placement="right">
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: collapsed ? 'center' : 'flex-start',
                gap: 2,
                mt: 1,
                py: 1.5,
                px: collapsed ? 0 : 2,
                borderRadius: 2,
                cursor: 'pointer',
                '&:hover': { bgcolor: darkMode ? '#334155' : '#F3F4F6' },
              }}
            >
              <Avatar sx={{ width: 32, height: 32, bgcolor: '#EFF6FF' }}>
                <User size={16} color="#2563EB" />
              </Avatar>
              {!collapsed && (
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body2" fontWeight={500}>
                    Alex Morgan
                  </Typography>
                  <Typography variant="caption" sx={{ color: darkMode ? '#94A3B8' : '#6B7280' }}>
                    alex@focusflow.com
                  </Typography>
                </Box>
              )}
              {!collapsed && <LogOut size={16} color="#6B7280" />}
            </Box>
          </Tooltip>
        </Box>
      </Box>
    </motion.div>
  );
}

export default Sidebar;