import React, { useState, useMemo } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Box } from '@mui/material';

import Sidebar from './components/layout/Sidebar';
import Dashboard from './pages/Dashboard';
import TasksPage from './pages/TasksPage';
import DocumentsPage from './pages/DocumentsPage';
import FocusPage from './pages/FocusPage';
import AnalyticsPage from './pages/AnalyticsPage';
import CoachPage from './pages/CoachPage';
import { lightTheme, darkTheme } from './themes/theme';

function App() {
  const [darkMode, setDarkMode] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const toggleDarkMode = () => setDarkMode(!darkMode);
  const toggleSidebarCollapse = () => setSidebarCollapsed(!sidebarCollapsed);

  const theme = useMemo(() => (darkMode ? darkTheme : lightTheme), [darkMode]);

  const sidebarWidth = sidebarCollapsed ? 80 : 260;

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Box sx={{ 
          display: 'flex', 
          minHeight: '100vh', 
          width: '100vw', 
          maxWidth: '100vw', 
          overflow: 'hidden' 
        }}>
          <Sidebar 
            darkMode={darkMode} 
            toggleDarkMode={toggleDarkMode}
            collapsed={sidebarCollapsed}
            toggleCollapse={toggleSidebarCollapse}
          />
          <Box
            component="main"
            sx={{
              flex: 1,
              minHeight: '100vh',
              backgroundColor: 'background.default',
              overflowX: 'auto',
            }}
          >
            <Box sx={{ 
              p: { xs: 2, md: 4 },
              width: '100%',
            }}>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/tasks" element={<TasksPage darkMode={darkMode} />} />
                <Route path="/documents" element={<DocumentsPage darkMode={darkMode} />} />
                <Route path="/focus" element={<FocusPage darkMode={darkMode} />} />
                <Route path="/analytics" element={<AnalyticsPage darkMode={darkMode} />} />
                <Route path="/coach" element={<CoachPage darkMode={darkMode} />} />
              </Routes>
            </Box>
          </Box>
        </Box>
      </Router>
    </ThemeProvider>
  );
}

export default App;