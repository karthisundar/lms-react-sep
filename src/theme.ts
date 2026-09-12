// Lightweight theme object (avoids missing @mui/material dependency)
const createTheme = <T>(options: T): T => options;

/**
 * Central MUI theme for the LMS.
 *
 * Design decisions:
 *  - Primary: deep indigo-blue conveys trust/education.
 *  - Secondary: teal accent for highlights/progress.
 *  - Neutral surface tones for content-heavy dashboards.
 *  - Inter font family (loaded in index.html) for a clean, modern feel.
 *  - 8px spacing rhythm via MUI's default spacing scale.
 */
export const appTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1e3a8a',
      light: '#3b5bb5',
      dark: '#13266b',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#0d9488',
      light: '#2dd4bf',
      dark: '#0a766c',
      contrastText: '#ffffff',
    },
    success: {
      main: '#16a34a',
      light: '#4ade80',
      dark: '#15803d',
    },
    warning: {
      main: '#d97706',
      light: '#fbbf24',
      dark: '#b45309',
    },
    error: {
      main: '#dc2626',
      light: '#f87171',
      dark: '#b91c1c',
    },
    background: {
      default: '#f5f7fb',
      paper: '#ffffff',
    },
    text: {
      primary: '#0f172a',
      secondary: '#475569',
    },
    divider: '#e2e8f0',
  },
  typography: {
    fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
    h1: { fontWeight: 700 },
    h2: { fontWeight: 700 },
    h3: { fontWeight: 600 },
    h4: { fontWeight: 600 },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
    button: { textTransform: 'none', fontWeight: 600 },
  },
  shape: {
    borderRadius: 10,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          boxShadow: 'none',
          '&:hover': { boxShadow: 'none' },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0 1px 3px rgba(15, 23, 42, 0.06), 0 1px 2px rgba(15, 23, 42, 0.04)',
          border: '1px solid #e2e8f0',
        },
      },
    },
  },
});
