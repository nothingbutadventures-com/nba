"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { api } from "@/lib/api";
import AdminThemeProvider from "./AdminThemeProvider";

// Material UI Components
import Box from "@mui/material/Box";
import Drawer from "@mui/material/Drawer";
import List from "@mui/material/List";
import Typography from "@mui/material/Typography";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Avatar from "@mui/material/Avatar";
import Tooltip from "@mui/material/Tooltip";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import Skeleton from "@mui/material/Skeleton";
import Breadcrumbs from "@mui/material/Breadcrumbs";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useTheme } from "@mui/material/styles";

// Material UI Icons
import DashboardRoundedIcon from "@mui/icons-material/DashboardRounded";
import TourRoundedIcon from "@mui/icons-material/TourRounded";
import PublicRoundedIcon from "@mui/icons-material/PublicRounded";
import HotelRoundedIcon from "@mui/icons-material/HotelRounded";
import ParkRoundedIcon from "@mui/icons-material/ParkRounded";
import LuggageRoundedIcon from "@mui/icons-material/LuggageRounded";
import FavoriteRoundedIcon from "@mui/icons-material/FavoriteRounded";
import FitnessCenterRoundedIcon from "@mui/icons-material/FitnessCenterRounded";
import AltRouteRoundedIcon from "@mui/icons-material/AltRouteRounded";
import PercentRoundedIcon from "@mui/icons-material/PercentRounded";
import ConfirmationNumberRoundedIcon from "@mui/icons-material/ConfirmationNumberRounded";
import HandshakeRoundedIcon from "@mui/icons-material/HandshakeRounded";
import PeopleAltRoundedIcon from "@mui/icons-material/PeopleAltRounded";
import CalendarMonthRoundedIcon from "@mui/icons-material/CalendarMonthRounded";
import EventBusyRoundedIcon from "@mui/icons-material/EventBusyRounded";
import StarRateRoundedIcon from "@mui/icons-material/StarRateRounded";
import QuestionAnswerRoundedIcon from "@mui/icons-material/QuestionAnswerRounded";
import ExploreRoundedIcon from "@mui/icons-material/ExploreRounded";
import WorkRoundedIcon from "@mui/icons-material/WorkRounded";
import SettingsRoundedIcon from "@mui/icons-material/SettingsRounded";
import MenuRoundedIcon from "@mui/icons-material/MenuRounded";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import LaunchRoundedIcon from "@mui/icons-material/LaunchRounded";
import PersonRoundedIcon from "@mui/icons-material/PersonRounded";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import ChevronLeftRoundedIcon from "@mui/icons-material/ChevronLeftRounded";

const DRAWER_WIDTH = 250;
const DRAWER_COLLAPSED_WIDTH = 68;
const HEADER_HEIGHT = 56;

interface User {
  name: string;
  email: string;
  role: string;
}

interface MenuItemType {
  name: string;
  href: string;
  icon: React.ReactNode;
}

const menuItems: MenuItemType[] = [
  { name: "Dashboard", href: "/admin", icon: <DashboardRoundedIcon fontSize="small" /> },
  { name: "Tours", href: "/admin/tours-management", icon: <TourRoundedIcon fontSize="small" /> },
  { name: "Destination", href: "/admin/location", icon: <PublicRoundedIcon fontSize="small" /> },
  { name: "Hotels", href: "/admin/hotels", icon: <HotelRoundedIcon fontSize="small" /> },
  { name: "Planting Locations", href: "/admin/planting-locations", icon: <ParkRoundedIcon fontSize="small" /> },
  { name: "Travel Style", href: "/admin/travel-styles", icon: <LuggageRoundedIcon fontSize="small" /> },
  { name: "Interests", href: "/admin/interests", icon: <FavoriteRoundedIcon fontSize="small" /> },
  { name: "Physical Rating", href: "/admin/physical-ratings", icon: <FitnessCenterRoundedIcon fontSize="small" /> },
  { name: "Trip Type", href: "/admin/trip-types", icon: <AltRouteRoundedIcon fontSize="small" /> },
  { name: "Discounts", href: "/admin/discounts", icon: <PercentRoundedIcon fontSize="small" /> },
  { name: "Promo Codes", href: "/admin/promo-codes", icon: <ConfirmationNumberRoundedIcon fontSize="small" /> },
  { name: "Affiliates", href: "/admin/affiliates", icon: <HandshakeRoundedIcon fontSize="small" /> },
  { name: "Users", href: "/admin/users", icon: <PeopleAltRoundedIcon fontSize="small" /> },
  { name: "Bookings", href: "/admin/bookings", icon: <CalendarMonthRoundedIcon fontSize="small" /> },
  { name: "Cancellations", href: "/admin/cancellations", icon: <EventBusyRoundedIcon fontSize="small" /> },
  { name: "Reviews", href: "/admin/reviews", icon: <StarRateRoundedIcon fontSize="small" /> },
  { name: "Queries", href: "/admin/queries", icon: <QuestionAnswerRoundedIcon fontSize="small" /> },
  { name: "Activities", href: "/admin/activities", icon: <ExploreRoundedIcon fontSize="small" /> },
  { name: "Careers", href: "/admin/careers", icon: <WorkRoundedIcon fontSize="small" /> },
  { name: "Settings", href: "/admin/settings", icon: <SettingsRoundedIcon fontSize="small" /> },
];

function AdminLayoutSkeleton() {
  return (
    <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "background.default" }}>
      <Box
        sx={{
          width: DRAWER_WIDTH,
          bgcolor: "background.paper",
          borderRight: "1px solid #e2e8f0",
          p: 2,
          display: { xs: "none", md: "block" },
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 3, px: 1, height: HEADER_HEIGHT, boxSizing: "border-box" }}>
          <Skeleton variant="rounded" width={28} height={28} sx={{ borderRadius: "6px" }} />
          <Skeleton variant="text" width={100} height={22} />
        </Box>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1, px: 1 }}>
          {[...Array(10)].map((_, i) => (
            <Box key={i} sx={{ display: "flex", alignItems: "center", gap: 1.5, py: 0.5 }}>
              <Skeleton variant="rounded" width={20} height={20} sx={{ borderRadius: "4px" }} />
              <Skeleton variant="text" width={110} height={20} />
            </Box>
          ))}
        </Box>
      </Box>

      <Box sx={{ flexGrow: 1, display: "flex", flexDirection: "column" }}>
        <Box
          sx={{
            height: HEADER_HEIGHT,
            borderBottom: "1px solid #e2e8f0",
            bgcolor: "background.paper",
            px: 3,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            boxSizing: "border-box",
          }}
        >
          <Skeleton variant="text" width={140} height={24} />
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Skeleton variant="rounded" width={80} height={30} sx={{ borderRadius: "4px" }} />
            <Skeleton variant="circular" width={28} height={28} />
          </Box>
        </Box>
        <Box sx={{ p: 3 }}>
          <Skeleton variant="rounded" height={160} sx={{ borderRadius: "6px", mb: 3 }} />
          <Skeleton variant="rounded" height={320} sx={{ borderRadius: "6px" }} />
        </Box>
      </Box>
    </Box>
  );
}

function AdminLayoutContent({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const [userMenuAnchor, setUserMenuAnchor] = useState<null | HTMLElement>(null);
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/auth/login");
        return;
      }

      const response = await fetch(`${api.baseURL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        router.push("/auth/login");
        return;
      }

      const data = await response.json();

      if (data.data?.user?.role !== "admin") {
        router.push("/dashboard");
        return;
      }

      setUser(data.data.user);
    } catch {
      router.push("/auth/login");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setLogoutDialogOpen(false);
    setUserMenuAnchor(null);
    router.push("/auth/login");
  };

  const isActiveRoute = (href: string) => {
    if (href === "/admin") {
      return pathname === "/admin";
    }
    return pathname?.startsWith(href);
  };

  const currentSection = menuItems.find((item) => isActiveRoute(item.href))?.name || "Dashboard";

  const getBreadcrumbs = () => {
    const crumbs: { label: string; href?: string }[] = [{ label: "Admin", href: "/admin" }];

    if (pathname === "/admin") {
      crumbs.push({ label: "Dashboard" });
      return crumbs;
    }

    const currentMenuItem = menuItems.find((item) => item.href !== "/admin" && pathname?.startsWith(item.href));

    if (currentMenuItem) {
      if (pathname === currentMenuItem.href) {
        crumbs.push({ label: currentMenuItem.name });
      } else {
        crumbs.push({ label: currentMenuItem.name, href: currentMenuItem.href });
        if (pathname === `${currentMenuItem.href}/create`) {
          crumbs.push({ label: `Create ${currentMenuItem.name.replace(/s$/, "")}` });
        } else if (pathname?.endsWith("/edit")) {
          crumbs.push({ label: `Edit ${currentMenuItem.name.replace(/s$/, "")}` });
        } else if (pathname?.startsWith("/admin/location/continent/")) {
          crumbs.push({ label: "Edit Continent" });
        } else if (pathname?.startsWith("/admin/location/country/")) {
          crumbs.push({ label: "Edit Country" });
        } else {
          const subPath = pathname.replace(currentMenuItem.href, "").replace(/^\//, "");
          const formattedSubPath = subPath
            .split("/")
            .filter(Boolean)
            .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
            .join(" ");
          crumbs.push({ label: formattedSubPath || "Details" });
        }
      }
    } else {
      crumbs.push({ label: currentSection });
    }

    return crumbs;
  };

  const currentDrawerWidth = sidebarCollapsed ? DRAWER_COLLAPSED_WIDTH : DRAWER_WIDTH;

  if (loading) {
    return <AdminLayoutSkeleton />;
  }

  const drawerContent = (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        bgcolor: "#ffffff",
      }}
    >
      {/* Brand Header: Exactly HEADER_HEIGHT, vertically centered */}
      <Box
        sx={{
          height: `${HEADER_HEIGHT}px`,
          minHeight: `${HEADER_HEIGHT}px`,
          maxHeight: `${HEADER_HEIGHT}px`,
          boxSizing: "border-box",
          px: sidebarCollapsed ? 1 : 2,
          display: "flex",
          alignItems: "center",
          justifyContent: sidebarCollapsed ? "center" : "space-between",
          borderBottom: "1px solid #e2e8f0",
        }}
      >
        <Link
          href="/admin"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            textDecoration: "none",
            color: "inherit",
          }}
        >
          <Box
            sx={{
              width: 30,
              height: 30,
              borderRadius: "6px",
              bgcolor: "#0f172a",
              color: "#ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 800,
              fontSize: "0.875rem",
              flexShrink: 0,
            }}
          >
            A
          </Box>
          {!sidebarCollapsed && (
            <Typography
              variant="subtitle2"
              sx={{
                fontWeight: 700,
                color: "#0f172a",
                fontSize: "0.875rem",
                lineHeight: 1,
                whiteSpace: "nowrap",
              }}
            >
              Admin Panel
            </Typography>
          )}
        </Link>

        {!isMobile && !sidebarCollapsed && (
          <Tooltip title="Collapse sidebar" arrow placement="right">
            <IconButton
              size="small"
              onClick={() => setSidebarCollapsed(true)}
              sx={{
                color: "#64748b",
                p: 0.5,
                borderRadius: "4px",
                "&:hover": { bgcolor: "#f1f5f9", color: "#0f172a" },
              }}
            >
              <ChevronLeftRoundedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
      </Box>

      {/* Expand button when collapsed */}
      {!isMobile && sidebarCollapsed && (
        <Box sx={{ display: "flex", justifyContent: "center", py: 1, borderBottom: "1px solid #f1f5f9" }}>
          <Tooltip title="Expand sidebar" arrow placement="right">
            <IconButton
              size="small"
              onClick={() => setSidebarCollapsed(false)}
              sx={{
                color: "#64748b",
                p: 0.5,
                borderRadius: "4px",
                "&:hover": { bgcolor: "#f1f5f9", color: "#0f172a" },
              }}
            >
              <ChevronRightRoundedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      )}

      {/* Navigation List */}
      <Box
        component="nav"
        sx={{
          flexGrow: 1,
          overflowY: "auto",
          overflowX: "hidden",
          py: 1,
          px: 0.5,
          "&::-webkit-scrollbar": {
            width: "3px",
          },
          "&::-webkit-scrollbar-thumb": {
            bgcolor: "#cbd5e1",
            borderRadius: "3px",
          },
        }}
      >
        <List disablePadding>
          {menuItems.map((item) => {
            const active = isActiveRoute(item.href);
            const button = (
              <ListItem key={item.name} disablePadding sx={{ display: "block", mb: 0.25 }}>
                <ListItemButton
                  component={Link}
                  href={item.href}
                  selected={active}
                  onClick={() => {
                    if (isMobile) setMobileOpen(false);
                  }}
                  sx={{
                    minHeight: 38,
                    justifyContent: sidebarCollapsed ? "center" : "initial",
                    px: sidebarCollapsed ? 1 : 1.5,
                    borderRadius: "6px",
                    bgcolor: active ? "#f1f5f9" : "transparent",
                    color: active ? "#0f172a" : "#475569",
                    fontWeight: active ? 600 : 500,
                    "&:hover": {
                      bgcolor: active ? "#e2e8f0" : "#f8fafc",
                      color: "#0f172a",
                    },
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: 0,
                      mr: sidebarCollapsed ? 0 : 1.5,
                      justifyContent: "center",
                      color: active ? "#0f172a" : "#64748b",
                    }}
                  >
                    {item.icon}
                  </ListItemIcon>
                  {!sidebarCollapsed && (
                    <ListItemText
                      primary={
                        <Typography
                          variant="body2"
                          sx={{
                            fontSize: "0.8125rem",
                            fontWeight: active ? 600 : 500,
                            color: active ? "#0f172a" : "#334155",
                            lineHeight: 1,
                          }}
                        >
                          {item.name}
                        </Typography>
                      }
                    />
                  )}
                </ListItemButton>
              </ListItem>
            );

            return sidebarCollapsed ? (
              <Tooltip key={item.name} title={item.name} placement="right" arrow>
                {button}
              </Tooltip>
            ) : (
              button
            );
          })}

          <Divider sx={{ my: 1, mx: 1, borderColor: "#e2e8f0" }} />

          {/* Leave Admin Link */}
          <ListItem disablePadding sx={{ display: "block" }}>
            <ListItemButton
              component={Link}
              href="/dashboard"
              sx={{
                minHeight: 38,
                justifyContent: sidebarCollapsed ? "center" : "initial",
                px: sidebarCollapsed ? 1 : 1.5,
                borderRadius: "6px",
                color: "#64748b",
                "&:hover": {
                  bgcolor: "#f8fafc",
                  color: "#0f172a",
                },
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: 0,
                  mr: sidebarCollapsed ? 0 : 1.5,
                  justifyContent: "center",
                  color: "#64748b",
                }}
              >
                <ArrowBackRoundedIcon fontSize="small" />
              </ListItemIcon>
              {!sidebarCollapsed && (
                <ListItemText
                  primary={
                    <Typography variant="body2" sx={{ fontSize: "0.8125rem", fontWeight: 500, color: "#64748b", lineHeight: 1 }}>
                      Leave Admin
                    </Typography>
                  }
                />
              )}
            </ListItemButton>
          </ListItem>
        </List>
      </Box>

      {/* User Section at Bottom */}
      <Box
        sx={{
          p: sidebarCollapsed ? 1 : 1.5,
          borderTop: "1px solid #e2e8f0",
          bgcolor: "#ffffff",
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: sidebarCollapsed ? "center" : "space-between",
            gap: 1,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, minWidth: 0 }}>
            <Avatar
              sx={{
                width: 32,
                height: 32,
                bgcolor: "#f1f5f9",
                color: "#0f172a",
                fontWeight: 700,
                fontSize: "0.8125rem",
                border: "1px solid #e2e8f0",
                borderRadius: "6px",
              }}
            >
              {user?.name ? user.name.charAt(0).toUpperCase() : <PersonRoundedIcon fontSize="small" />}
            </Avatar>
            {!sidebarCollapsed && (
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="subtitle2" noWrap sx={{ fontWeight: 600, color: "#0f172a", fontSize: "0.8125rem", lineHeight: 1.2 }}>
                  {user?.name || "Admin User"}
                </Typography>
                <Typography variant="caption" noWrap sx={{ display: "block", color: "#64748b", fontSize: "0.7rem", mt: 0.25 }}>
                  {user?.email || "Administrator"}
                </Typography>
              </Box>
            )}
          </Box>

          {!sidebarCollapsed && (
            <Tooltip title="Sign Out" arrow>
              <IconButton
                size="small"
                onClick={() => setLogoutDialogOpen(true)}
                sx={{
                  color: "#64748b",
                  borderRadius: "4px",
                  p: 0.5,
                  "&:hover": { color: "#ef4444", bgcolor: "#fee2e2" },
                }}
              >
                <LogoutRoundedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "#f8fafc" }}>
      {/* Desktop Sidebar: True Sibling to Main Column (Zero Subpixel Glitch) */}
      {!isMobile && (
        <Box
          component="aside"
          sx={{
            width: currentDrawerWidth,
            flexShrink: 0,
            height: "100vh",
            position: "sticky",
            top: 0,
            zIndex: 10,
            borderRight: "1px solid #e2e8f0",
            bgcolor: "#ffffff",
            boxSizing: "border-box",
            transition: theme.transitions.create("width", {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.enteringScreen,
            }),
          }}
        >
          {drawerContent}
        </Box>
      )}

      {/* Mobile Drawer */}
      {isMobile && (
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{
            "& .MuiDrawer-paper": {
              boxSizing: "border-box",
              width: DRAWER_WIDTH,
              borderRight: "1px solid #e2e8f0",
              borderRadius: "0 !important",
            },
          }}
        >
          {drawerContent}
        </Drawer>
      )}

      {/* Main Content Column */}
      <Box
        sx={{
          flexGrow: 1,
          minWidth: 0,
          display: "flex",
          flexDirection: "column",
          minHeight: "100vh",
          bgcolor: "#f8fafc",
        }}
      >
        {/* Top Header: Sticky header aligned perfectly with sidebar */}
        <Box
          component="header"
          sx={{
            height: `${HEADER_HEIGHT}px`,
            minHeight: `${HEADER_HEIGHT}px`,
            maxHeight: `${HEADER_HEIGHT}px`,
            boxSizing: "border-box",
            borderBottom: "1px solid #e2e8f0",
            bgcolor: "#ffffff",
            position: "sticky",
            top: 0,
            zIndex: 5,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            px: { xs: 2, sm: 3 },
          }}
        >
          {/* Left: Hamburger on mobile + Breadcrumbs on exact same horizontal line */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            {isMobile && (
              <IconButton
                edge="start"
                onClick={() => setMobileOpen(!mobileOpen)}
                sx={{ color: "#0f172a", p: 0.5 }}
              >
                <MenuRoundedIcon fontSize="small" />
              </IconButton>
            )}

            <Breadcrumbs
              separator={<ChevronRightRoundedIcon sx={{ fontSize: 13, color: "#94a3b8" }} />}
              aria-label="breadcrumb"
            >
              {getBreadcrumbs().map((crumb, idx, arr) => {
                const isLast = idx === arr.length - 1;
                if (isLast || !crumb.href) {
                  return (
                    <Typography
                      key={idx}
                      variant="body2"
                      sx={{
                        color: "#0f172a",
                        fontWeight: 600,
                        fontSize: "0.8125rem",
                        lineHeight: 1,
                      }}
                    >
                      {crumb.label}
                    </Typography>
                  );
                }
                return (
                  <Link key={idx} href={crumb.href} style={{ textDecoration: "none" }}>
                    <Typography
                      variant="body2"
                      sx={{
                        color: "#64748b",
                        fontSize: "0.8125rem",
                        fontWeight: 500,
                        lineHeight: 1,
                        "&:hover": { color: "#0f172a" },
                      }}
                    >
                      {crumb.label}
                    </Typography>
                  </Link>
                );
              })}
            </Breadcrumbs>
          </Box>

          {/* Right: Actions */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
            <Button
              component={Link}
              href="/"
              target="_blank"
              variant="outlined"
              size="small"
              startIcon={<LaunchRoundedIcon sx={{ fontSize: 14 }} />}
              sx={{
                display: { xs: "none", sm: "inline-flex" },
                borderColor: "#e2e8f0",
                color: "#334155",
                fontSize: "0.775rem",
                height: 30,
                borderRadius: "4px",
                "&:hover": {
                  borderColor: "#cbd5e1",
                  bgcolor: "#f8fafc",
                },
              }}
            >
              View Site
            </Button>

            {/* Profile trigger */}
            <Tooltip title="Account menu" arrow>
              <IconButton
                onClick={(e) => setUserMenuAnchor(e.currentTarget)}
                size="small"
                sx={{
                  p: 0.25,
                  borderRadius: "4px",
                  border: "1px solid #e2e8f0",
                  "&:hover": { borderColor: "#cbd5e1" },
                }}
              >
                <Avatar
                  sx={{
                    width: 26,
                    height: 26,
                    bgcolor: "#0f172a",
                    color: "#ffffff",
                    fontWeight: 700,
                    fontSize: "0.75rem",
                    borderRadius: "4px",
                  }}
                >
                  {user?.name ? user.name.charAt(0).toUpperCase() : "A"}
                </Avatar>
              </IconButton>
            </Tooltip>

            {/* Profile Dropdown */}
            <Menu
              anchorEl={userMenuAnchor}
              open={Boolean(userMenuAnchor)}
              onClose={() => setUserMenuAnchor(null)}
              transformOrigin={{ horizontal: "right", vertical: "top" }}
              anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
              slotProps={{
                paper: {
                  elevation: 2,
                  sx: {
                    minWidth: 190,
                    p: 0.5,
                    mt: 1,
                    borderRadius: "6px",
                    border: "1px solid #e2e8f0",
                  },
                },
              }}
            >
              <Box sx={{ px: 1.5, py: 1 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, fontSize: "0.8125rem" }}>
                  {user?.name}
                </Typography>
                <Typography variant="caption" sx={{ color: "#64748b" }}>
                  {user?.email}
                </Typography>
              </Box>
              <Divider sx={{ my: 0.5, borderColor: "#f1f5f9" }} />
              <MenuItem
                component={Link}
                href="/admin/settings"
                onClick={() => setUserMenuAnchor(null)}
                sx={{ borderRadius: "4px", fontSize: "0.8125rem", py: 0.75 }}
              >
                <ListItemIcon sx={{ minWidth: 28 }}>
                  <SettingsRoundedIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText primary={<Typography variant="body2" sx={{ fontSize: "0.8125rem" }}>Settings</Typography>} />
              </MenuItem>
              <MenuItem
                component={Link}
                href="/dashboard"
                onClick={() => setUserMenuAnchor(null)}
                sx={{ borderRadius: "4px", fontSize: "0.8125rem", py: 0.75 }}
              >
                <ListItemIcon sx={{ minWidth: 28 }}>
                  <ArrowBackRoundedIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText primary={<Typography variant="body2" sx={{ fontSize: "0.8125rem" }}>User Dashboard</Typography>} />
              </MenuItem>
              <Divider sx={{ my: 0.5, borderColor: "#f1f5f9" }} />
              <MenuItem
                onClick={() => {
                  setUserMenuAnchor(null);
                  setLogoutDialogOpen(true);
                }}
                sx={{ borderRadius: "4px", fontSize: "0.8125rem", py: 0.75, color: "error.main" }}
              >
                <ListItemIcon sx={{ minWidth: 28, color: "error.main" }}>
                  <LogoutRoundedIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Typography variant="body2" sx={{ fontSize: "0.8125rem", fontWeight: 600, color: "error.main" }}>
                      Logout
                    </Typography>
                  }
                />
              </MenuItem>
            </Menu>
          </Box>
        </Box>

        {/* Content Area */}
        <Box component="main" sx={{ flexGrow: 1 }}>
          {children}
        </Box>
      </Box>

      {/* Sign Out Confirmation Dialog */}
      <Dialog
        open={logoutDialogOpen}
        onClose={() => setLogoutDialogOpen(false)}
        maxWidth="xs"
        fullWidth
        slotProps={{ paper: { sx: { p: 1, borderRadius: "6px" } } }}
      >
        <DialogTitle sx={{ fontWeight: 700, pb: 1, fontSize: "1rem" }}>Confirm Sign Out</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ color: "#64748b", fontSize: "0.875rem" }}>
            Are you sure you want to sign out of the administrative panel?
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setLogoutDialogOpen(false)} variant="outlined">
            Cancel
          </Button>
          <Button onClick={handleLogout} variant="contained" color="error">
            Sign Out
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminThemeProvider>
      <AdminLayoutContent>{children}</AdminLayoutContent>
    </AdminThemeProvider>
  );
}
