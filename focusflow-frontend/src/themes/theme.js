import { createTheme } from '@mui/material/styles';

// Light Theme - Clean Blue
export const lightTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#2563EB', // Clean primary blue
      light: '#3B82F6',
      dark: '#1E40AF',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#10B981', // Subtle green for success only
      light: '#34D399',
      dark: '#059669',
    },
    background: {
      default: '#F9FAFB',
      paper: '#FFFFFF',
    },
    text: {
      primary: '#1F2937',
      secondary: '#6B7280',
    },
    divider: '#E5E7EB',
  },
  typography: {
    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    h4: {
      fontWeight: 600,
      fontSize: '1.875rem',
      letterSpacing: '-0.02em',
    },
    h5: {
      fontWeight: 600,
      fontSize: '1.5rem',
      letterSpacing: '-0.01em',
    },
    h6: {
      fontWeight: 500,
      fontSize: '1.125rem',
    },
    body1: {
      fontSize: '0.9375rem',
      lineHeight: 1.5,
    },
    button: {
      textTransform: 'none',
      fontWeight: 500,
    },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: '8px 20px',
          boxShadow: 'none',
          '&:hover': {
            boxShadow: 'none',
          },
        },
        contained: {
          backgroundColor: '#2563EB',
          '&:hover': {
            backgroundColor: '#1E40AF',
          },
        },
        outlined: {
          borderColor: '#E5E7EB',
          color: '#1F2937',
          '&:hover': {
            borderColor: '#2563EB',
            backgroundColor: '#EFF6FF',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          border: '1px solid #E5E7EB',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: 'none',
          borderBottom: '1px solid #E5E7EB',
          backgroundColor: '#FFFFFF',
        },
      },
    },
  },
});

// Dark Theme - Clean Blue Dark
export const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#3B82F6',
      light: '#60A5FA',
      dark: '#2563EB',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#10B981',
      light: '#34D399',
      dark: '#059669',
    },
    background: {
      default: '#0F172A',
      paper: '#1E293B',
    },
    text: {
      primary: '#F1F5F9',
      secondary: '#94A3B8',
    },
    divider: '#334155',
  },
  typography: {
    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    h4: {
      fontWeight: 600,
      letterSpacing: '-0.02em',
    },
    h5: {
      fontWeight: 600,
      letterSpacing: '-0.01em',
    },
    button: {
      textTransform: 'none',
      fontWeight: 500,
    },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          boxShadow: 'none',
        },
        contained: {
          backgroundColor: '#3B82F6',
          '&:hover': {
            backgroundColor: '#2563EB',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          backgroundColor: '#1E293B',
          border: '1px solid #334155',
          boxShadow: 'none',
        },
      },
    },
  },
});