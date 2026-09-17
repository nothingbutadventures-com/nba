import { createTheme, alpha } from "@mui/material/styles";

export const adminTheme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#0f172a", // Slate 900
      light: "#1e293b",
      dark: "#020617",
      contrastText: "#ffffff",
    },
    secondary: {
      main: "#2563eb", // Blue 600
      light: "#3b82f6",
      dark: "#1d4ed8",
      contrastText: "#ffffff",
    },
    success: {
      main: "#10b981",
      light: "#ecfdf5",
      dark: "#047857",
      contrastText: "#ffffff",
    },
    warning: {
      main: "#f59e0b",
      light: "#fffbeb",
      dark: "#b45309",
      contrastText: "#ffffff",
    },
    error: {
      main: "#ef4444",
      light: "#fef2f2",
      dark: "#b91c1c",
      contrastText: "#ffffff",
    },
    info: {
      main: "#0284c7",
      light: "#f0f9ff",
      dark: "#0369a1",
      contrastText: "#ffffff",
    },
    background: {
      default: "#f8fafc", // Slate 50
      paper: "#ffffff",
    },
    text: {
      primary: "#0f172a", // Slate 900
      secondary: "#64748b", // Slate 500
      disabled: "#94a3b8",
    },
    divider: "#e2e8f0",
  },
  typography: {
    fontFamily: [
      "var(--font-outfit)",
      "-apple-system",
      "BlinkMacSystemFont",
      '"Segoe UI"',
      "Roboto",
      '"Helvetica Neue"',
      "Arial",
      "sans-serif",
    ].join(","),
    h1: {
      fontWeight: 700,
      fontSize: "2rem",
      lineHeight: 1.25,
      letterSpacing: "-0.02em",
    },
    h2: {
      fontWeight: 700,
      fontSize: "1.75rem",
      lineHeight: 1.25,
      letterSpacing: "-0.02em",
    },
    h3: {
      fontWeight: 600,
      fontSize: "1.375rem",
      lineHeight: 1.3,
      letterSpacing: "-0.01em",
    },
    h4: {
      fontWeight: 600,
      fontSize: "1.2rem",
      lineHeight: 1.35,
    },
    h5: {
      fontWeight: 600,
      fontSize: "1.05rem",
      lineHeight: 1.4,
    },
    h6: {
      fontWeight: 600,
      fontSize: "0.925rem",
      lineHeight: 1.45,
    },
    subtitle1: {
      fontSize: "0.875rem",
      lineHeight: 1.5,
      fontWeight: 500,
    },
    subtitle2: {
      fontSize: "0.8125rem",
      lineHeight: 1.5,
      fontWeight: 600,
    },
    body1: {
      fontSize: "0.875rem",
      lineHeight: 1.5,
    },
    body2: {
      fontSize: "0.8125rem",
      lineHeight: 1.5,
    },
    button: {
      textTransform: "none",
      fontWeight: 600,
      fontSize: "0.8125rem",
    },
    caption: {
      fontSize: "0.75rem",
      lineHeight: 1.4,
      color: "#64748b",
    },
  },
  shape: {
    borderRadius: 6,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: "#f8fafc",
          color: "#0f172a",
        },
      },
    },
    MuiToolbar: {
      styleOverrides: {
        root: {
          minHeight: "56px !important",
          height: 56,
          "@media (min-width: 600px)": {
            minHeight: "56px !important",
            height: 56,
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          height: 56,
          minHeight: 56,
          borderRadius: "0 !important",
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          borderRadius: "0 !important",
        },
      },
    },
    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },
      styleOverrides: {
        root: {
          borderRadius: 6,
          padding: "6px 14px",
          fontWeight: 600,
          fontSize: "0.8125rem",
          transition: "all 0.15s ease-in-out",
        },
        contained: {
          backgroundColor: "#0f172a",
          color: "#ffffff",
          "&:hover": {
            backgroundColor: "#1e293b",
          },
        },
        outlined: {
          borderColor: "#cbd5e1",
          color: "#334155",
          "&:hover": {
            borderColor: "#94a3b8",
            backgroundColor: "#f8fafc",
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
          borderRadius: 6,
        },
        elevation0: {
          border: "1px solid #e2e8f0",
        },
        elevation1: {
          boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.04)",
          border: "1px solid #e2e8f0",
          borderRadius: 6,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          border: "1px solid #e2e8f0",
          boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.04)",
          backgroundImage: "none",
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          margin: "1px 6px",
          padding: "7px 10px",
          transition: "all 0.12s ease-in-out",
          "&.Mui-selected": {
            backgroundColor: "#f1f5f9",
            color: "#0f172a",
            fontWeight: 600,
            "& .MuiListItemIcon-root": {
              color: "#0f172a",
            },
            "&:hover": {
              backgroundColor: "#e2e8f0",
            },
          },
          "&:hover": {
            backgroundColor: "#f8fafc",
            color: "#0f172a",
            "& .MuiListItemIcon-root": {
              color: "#0f172a",
            },
          },
        },
      },
    },
    MuiListItemIcon: {
      styleOverrides: {
        root: {
          minWidth: 32,
          color: "#64748b",
          transition: "color 0.12s ease-in-out",
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 600,
          borderRadius: 6,
          fontSize: "0.75rem",
        },
        sizeSmall: {
          height: 22,
          fontSize: "0.7rem",
          borderRadius: 4,
        },
      },
    },
    MuiTableContainer: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          border: "1px solid #e2e8f0",
        },
      },
    },
    MuiTable: {
      styleOverrides: {
        root: {
          borderCollapse: "separate",
        },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          backgroundColor: "#f8fafc",
          "& .MuiTableCell-head": {
            color: "#475569",
            fontWeight: 600,
            fontSize: "0.75rem",
            textTransform: "uppercase",
            letterSpacing: "0.04em",
            borderBottom: "1px solid #e2e8f0",
            padding: "10px 14px",
          },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottom: "1px solid #f1f5f9",
          padding: "10px 14px",
          fontSize: "0.8125rem",
          color: "#1e293b",
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          "&:hover": {
            backgroundColor: "#f8fafc",
          },
          "&:last-child .MuiTableCell-root": {
            borderBottom: "none",
          },
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          backgroundColor: "#ffffff",
          "& .MuiOutlinedInput-notchedOutline": {
            borderColor: "#e2e8f0",
          },
          "&:hover .MuiOutlinedInput-notchedOutline": {
            borderColor: "#cbd5e1",
          },
          "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
            borderColor: "#0f172a",
            borderWidth: "1.5px",
          },
        },
        input: {
          padding: "8px 12px",
          fontSize: "0.8125rem",
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 8,
          boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.05)",
          border: "1px solid #e2e8f0",
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: "#0f172a",
          fontSize: "0.725rem",
          borderRadius: 4,
          padding: "4px 8px",
        },
        arrow: {
          color: "#0f172a",
        },
      },
    },
  },
});
