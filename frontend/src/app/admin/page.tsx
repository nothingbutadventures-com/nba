"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { api } from "@/lib/api";

// Material UI Components
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import Button from "@mui/material/Button";
import Avatar from "@mui/material/Avatar";
import Paper from "@mui/material/Paper";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import Skeleton from "@mui/material/Skeleton";

// Material UI Icons
import TourRoundedIcon from "@mui/icons-material/TourRounded";
import PeopleAltRoundedIcon from "@mui/icons-material/PeopleAltRounded";
import CalendarMonthRoundedIcon from "@mui/icons-material/CalendarMonthRounded";
import AttachMoneyRoundedIcon from "@mui/icons-material/AttachMoneyRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import PublicRoundedIcon from "@mui/icons-material/PublicRounded";
import ConfirmationNumberRoundedIcon from "@mui/icons-material/ConfirmationNumberRounded";
import OpenInNewRoundedIcon from "@mui/icons-material/OpenInNewRounded";

interface TourItem {
  _id: string;
  name: string;
  price?: number;
  duration?: number;
  slug?: string;
  isActive?: boolean;
}

interface BookingItem {
  _id: string;
  user?: { name?: string; email?: string };
  tour?: { name?: string; price?: number };
  totalPrice?: number;
  status?: string;
  createdAt?: string;
}

const parseNumeric = (val: any): number => {
  if (!val) return 0;
  if (typeof val === "number") return isNaN(val) ? 0 : val;
  if (typeof val === "string") {
    const n = parseFloat(val.replace(/[^0-9.-]+/g, ""));
    return isNaN(n) ? 0 : n;
  }
  if (typeof val === "object") {
    if (typeof val.amount === "number") return val.amount;
    if (typeof val.totalPrice === "number") return val.totalPrice;
    if (typeof val.bookingAmount === "number") return val.bookingAmount;
    if (val.amount) return parseNumeric(val.amount);
    if (val.totalPrice) return parseNumeric(val.totalPrice);
  }
  return 0;
};

const getBookingDisplayPrice = (b: any): string => {
  const num = parseNumeric(b?.totalPrice) || parseNumeric(b?.price) || parseNumeric(b?.tour?.price) || 0;
  return `$${num.toLocaleString()}`;
};

const getTourDisplayPrice = (t: any): string => {
  const num = parseNumeric(t?.price);
  return num > 0 ? `$${num.toLocaleString()}` : "—";
};

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [toursCount, setToursCount] = useState<number>(0);
  const [usersCount, setUsersCount] = useState<number>(0);
  const [bookingsCount, setBookingsCount] = useState<number>(0);
  const [revenue, setRevenue] = useState<number>(0);

  const [recentTours, setRecentTours] = useState<TourItem[]>([]);
  const [recentBookings, setRecentBookings] = useState<BookingItem[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setRefreshing(true);
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const authHeader: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};

      // 1. Fetch tours
      const toursRes = await fetch(`${api.baseURL}/tours`).catch(() => null);
      if (toursRes && toursRes.ok) {
        const toursJson = await toursRes.json();
        const toursList = toursJson?.data?.tours || [];
        setToursCount(toursList.length);
        setRecentTours(toursList.slice(0, 5));
      }

      // 2. Fetch users
      if (token) {
        const usersRes = await fetch(`${api.baseURL}/users?limit=1`, { headers: authHeader }).catch(() => null);
        if (usersRes && usersRes.ok) {
          const usersJson = await usersRes.json();
          setUsersCount(usersJson?.total || usersJson?.results || 0);
        }

        // 3. Fetch bookings
        const bookingsRes = await fetch(`${api.baseURL}/bookings?limit=5&sort=-createdAt`, { headers: authHeader }).catch(() => null);
        if (bookingsRes && bookingsRes.ok) {
          const bookingsJson = await bookingsRes.json();
          const list = bookingsJson?.data?.bookings || [];
          setBookingsCount(bookingsJson?.total || list.length);
          setRecentBookings(list);

          const totalRev = list.reduce((acc: number, b: any) => {
            return acc + (parseNumeric(b.totalPrice) || parseNumeric(b.price) || parseNumeric(b.tour?.price) || 0);
          }, 0);
          setRevenue(totalRev);
        }
      }
    } catch (err) {
      console.error("Dashboard fetch error:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const currentDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <Box sx={{ p: { xs: 2, sm: 3 }, bgcolor: "#f8fafc", minHeight: "100%" }}>
      {/* Top Banner: Minimal, high-level overview */}
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          justifyContent: "space-between",
          alignItems: { xs: "flex-start", sm: "center" },
          gap: 1.5,
          mb: 2.5,
        }}
      >
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, color: "#0f172a", fontSize: "1.25rem", lineHeight: 1.2 }}>
            Operations Overview
          </Typography>
          <Typography variant="body2" sx={{ color: "#64748b", fontSize: "0.8125rem", mt: 0.25 }}>
            {currentDate} • Platform activity and core operational metrics
          </Typography>
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Tooltip title="Refresh data" arrow>
            <IconButton
              size="small"
              onClick={fetchDashboardData}
              disabled={refreshing}
              sx={{
                border: "1px solid #e2e8f0",
                bgcolor: "#ffffff",
                borderRadius: "6px",
                p: 0.75,
                color: "#64748b",
                "&:hover": { bgcolor: "#f8fafc", color: "#0f172a" },
              }}
            >
              <RefreshRoundedIcon
                fontSize="small"
                sx={{
                  transform: refreshing ? "rotate(180deg)" : "none",
                  transition: "transform 0.4s ease",
                }}
              />
            </IconButton>
          </Tooltip>

          <Button
            component={Link}
            href="/admin/tours-management/create"
            variant="contained"
            size="small"
            startIcon={<AddRoundedIcon sx={{ fontSize: 16 }} />}
            sx={{
              bgcolor: "#0f172a",
              color: "#ffffff",
              fontSize: "0.8125rem",
              borderRadius: "6px",
              px: 1.5,
              height: 32,
              "&:hover": { bgcolor: "#1e293b" },
            }}
          >
            Add Tour
          </Button>
        </Box>
      </Box>

      {/* 4 Sleek Primary Metric Cards */}
      <Grid container spacing={2} sx={{ mb: 2.5 }}>
        {/* Total Tours */}
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <Card sx={{ p: 2, borderRadius: "6px", border: "1px solid #e2e8f0", bgcolor: "#ffffff" }}>
            <CardContent sx={{ p: 0, "&:last-child": { pb: 0 } }}>
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1.25 }}>
                <Typography variant="caption" sx={{ fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.04em", fontSize: "0.725rem" }}>
                  Active Tours
                </Typography>
                <Box sx={{ width: 30, height: 30, borderRadius: "6px", bgcolor: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <TourRoundedIcon sx={{ fontSize: 18, color: "#0f172a" }} />
                </Box>
              </Box>
              <Box sx={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
                {loading ? (
                  <Skeleton width={40} height={32} />
                ) : (
                  <Typography variant="h5" sx={{ fontWeight: 700, color: "#0f172a", fontSize: "1.5rem" }}>
                    {toursCount}
                  </Typography>
                )}
                <Chip label="Catalog" size="small" variant="outlined" sx={{ height: 20, fontSize: "0.68rem", fontWeight: 600, borderRadius: "4px" }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Total Users */}
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <Card sx={{ p: 2, borderRadius: "6px", border: "1px solid #e2e8f0", bgcolor: "#ffffff" }}>
            <CardContent sx={{ p: 0, "&:last-child": { pb: 0 } }}>
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1.25 }}>
                <Typography variant="caption" sx={{ fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.04em", fontSize: "0.725rem" }}>
                  Registered Users
                </Typography>
                <Box sx={{ width: 30, height: 30, borderRadius: "6px", bgcolor: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <PeopleAltRoundedIcon sx={{ fontSize: 18, color: "#0284c7" }} />
                </Box>
              </Box>
              <Box sx={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
                {loading ? (
                  <Skeleton width={40} height={32} />
                ) : (
                  <Typography variant="h5" sx={{ fontWeight: 700, color: "#0f172a", fontSize: "1.5rem" }}>
                    {usersCount > 0 ? usersCount : "—"}
                  </Typography>
                )}
                <Chip label="Verified" color="info" size="small" variant="outlined" sx={{ height: 20, fontSize: "0.68rem", fontWeight: 600, borderRadius: "4px" }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Total Bookings */}
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <Card sx={{ p: 2, borderRadius: "6px", border: "1px solid #e2e8f0", bgcolor: "#ffffff" }}>
            <CardContent sx={{ p: 0, "&:last-child": { pb: 0 } }}>
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1.25 }}>
                <Typography variant="caption" sx={{ fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.04em", fontSize: "0.725rem" }}>
                  Total Bookings
                </Typography>
                <Box sx={{ width: 30, height: 30, borderRadius: "6px", bgcolor: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <CalendarMonthRoundedIcon sx={{ fontSize: 18, color: "#d97706" }} />
                </Box>
              </Box>
              <Box sx={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
                {loading ? (
                  <Skeleton width={40} height={32} />
                ) : (
                  <Typography variant="h5" sx={{ fontWeight: 700, color: "#0f172a", fontSize: "1.5rem" }}>
                    {bookingsCount > 0 ? bookingsCount : "—"}
                  </Typography>
                )}
                <Chip label="Orders" color="warning" size="small" variant="outlined" sx={{ height: 20, fontSize: "0.68rem", fontWeight: 600, borderRadius: "4px" }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Gross Revenue */}
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <Card sx={{ p: 2, borderRadius: "6px", border: "1px solid #e2e8f0", bgcolor: "#ffffff" }}>
            <CardContent sx={{ p: 0, "&:last-child": { pb: 0 } }}>
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1.25 }}>
                <Typography variant="caption" sx={{ fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.04em", fontSize: "0.725rem" }}>
                  Gross Revenue
                </Typography>
                <Box sx={{ width: 30, height: 30, borderRadius: "6px", bgcolor: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <AttachMoneyRoundedIcon sx={{ fontSize: 18, color: "#059669" }} />
                </Box>
              </Box>
              <Box sx={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
                {loading ? (
                  <Skeleton width={60} height={32} />
                ) : (
                  <Typography variant="h5" sx={{ fontWeight: 700, color: "#0f172a", fontSize: "1.5rem" }}>
                    ${revenue.toLocaleString()}
                  </Typography>
                )}
                <Chip label="YTD" color="success" size="small" variant="outlined" sx={{ height: 20, fontSize: "0.68rem", fontWeight: 600, borderRadius: "4px" }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Main Content Grid: Tables & Management */}
      <Grid container spacing={2.5}>
        {/* Left Column: Recent Bookings or Tours Table */}
        <Grid size={{ xs: 12, lg: 7 }}>
          <Paper sx={{ borderRadius: "6px", border: "1px solid #e2e8f0", overflow: "hidden" }}>
            <Box
              sx={{
                px: 2,
                py: 1.5,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                borderBottom: "1px solid #e2e8f0",
                bgcolor: "#ffffff",
              }}
            >
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#0f172a", fontSize: "0.875rem" }}>
                  Recent Bookings
                </Typography>
                <Typography variant="caption" sx={{ color: "#64748b" }}>
                  Latest customer orders and reservations
                </Typography>
              </Box>
              <Button
                component={Link}
                href="/admin/bookings"
                size="small"
                variant="outlined"
                sx={{
                  fontSize: "0.75rem",
                  py: 0.25,
                  px: 1,
                  height: 28,
                  borderRadius: "4px",
                  borderColor: "#e2e8f0",
                  color: "#334155",
                }}
              >
                View All
              </Button>
            </Box>

            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Customer</TableCell>
                    <TableCell>Tour Experience</TableCell>
                    <TableCell>Amount</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading ? (
                    [...Array(3)].map((_, i) => (
                      <TableRow key={i}>
                        <TableCell><Skeleton width={120} height={20} /></TableCell>
                        <TableCell><Skeleton width={140} height={20} /></TableCell>
                        <TableCell><Skeleton width={60} height={20} /></TableCell>
                        <TableCell><Skeleton width={70} height={20} /></TableCell>
                      </TableRow>
                    ))
                  ) : recentBookings.length > 0 ? (
                    recentBookings.map((b) => (
                      <TableRow key={b._id} hover>
                        <TableCell>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            <Avatar
                              sx={{
                                width: 24,
                                height: 24,
                                fontSize: "0.65rem",
                                fontWeight: 700,
                                bgcolor: "#f1f5f9",
                                color: "#0f172a",
                                borderRadius: "4px",
                              }}
                            >
                              {b.user?.name ? b.user.name.charAt(0).toUpperCase() : "U"}
                            </Avatar>
                            <Box>
                              <Typography variant="body2" sx={{ fontWeight: 600, fontSize: "0.8125rem", color: "#0f172a" }}>
                                {b.user?.name || "Customer"}
                              </Typography>
                              <Typography variant="caption" sx={{ color: "#94a3b8", fontSize: "0.7rem", display: "block" }}>
                                {b.user?.email}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontSize: "0.8125rem", color: "#334155" }}>
                            {b.tour?.name || "Adventure Tour"}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 600, fontSize: "0.8125rem", color: "#0f172a" }}>
                            {getBookingDisplayPrice(b)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={b.status || "Confirmed"}
                            size="small"
                            variant="outlined"
                            color={b.status === "cancelled" ? "error" : b.status === "pending" ? "warning" : "success"}
                            sx={{ height: 20, fontSize: "0.68rem", fontWeight: 600, borderRadius: "4px" }}
                          />
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} sx={{ textAlign: "center", py: 4, color: "#64748b" }}>
                        <Typography variant="body2" sx={{ fontSize: "0.8125rem", color: "#64748b" }}>
                          No reservations recorded yet.
                        </Typography>
                        <Button
                          component={Link}
                          href="/admin/bookings"
                          size="small"
                          sx={{ mt: 1, fontSize: "0.75rem", textTransform: "none" }}
                        >
                          Go to Bookings Manager
                        </Button>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>

        {/* Right Column: Live Inventory Catalog & Quick Jump */}
        <Grid size={{ xs: 12, lg: 5 }}>
          {/* Active Tours Catalog */}
          <Paper sx={{ borderRadius: "6px", border: "1px solid #e2e8f0", overflow: "hidden", mb: 2.5 }}>
            <Box
              sx={{
                px: 2,
                py: 1.5,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                borderBottom: "1px solid #e2e8f0",
                bgcolor: "#ffffff",
              }}
            >
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#0f172a", fontSize: "0.875rem" }}>
                  Tour Catalog ({toursCount})
                </Typography>
                <Typography variant="caption" sx={{ color: "#64748b" }}>
                  Active adventure packages
                </Typography>
              </Box>
              <Button
                component={Link}
                href="/admin/tours-management"
                size="small"
                variant="outlined"
                sx={{
                  fontSize: "0.75rem",
                  py: 0.25,
                  px: 1,
                  height: 28,
                  borderRadius: "4px",
                  borderColor: "#e2e8f0",
                  color: "#334155",
                }}
              >
                Manage
              </Button>
            </Box>

            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Package</TableCell>
                    <TableCell>Duration</TableCell>
                    <TableCell align="right">Price</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading ? (
                    [...Array(3)].map((_, i) => (
                      <TableRow key={i}>
                        <TableCell><Skeleton width={140} height={20} /></TableCell>
                        <TableCell><Skeleton width={50} height={20} /></TableCell>
                        <TableCell align="right"><Skeleton width={50} height={20} /></TableCell>
                      </TableRow>
                    ))
                  ) : recentTours.length > 0 ? (
                    recentTours.map((t) => (
                      <TableRow key={t._id} hover>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 600, fontSize: "0.8125rem", color: "#0f172a" }}>
                            {t.name}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="caption" sx={{ color: "#64748b" }}>
                            {t.duration ? `${t.duration} Days` : "Multi-day"}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" sx={{ fontWeight: 700, fontSize: "0.8125rem", color: "#0f172a" }}>
                            {getTourDisplayPrice(t)}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={3} sx={{ textAlign: "center", py: 3, color: "#64748b" }}>
                        No tours found in catalog.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>

          {/* Quick Shortcuts */}
          <Paper sx={{ p: 2, borderRadius: "6px", border: "1px solid #e2e8f0", bgcolor: "#ffffff" }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#0f172a", fontSize: "0.8125rem", mb: 1.5 }}>
              Core Controls
            </Typography>
            <Grid container spacing={1}>
              {[
                { title: "Destinations", href: "/admin/location", icon: <PublicRoundedIcon sx={{ fontSize: 16 }} /> },
                { title: "Promo Codes", href: "/admin/promo-codes", icon: <ConfirmationNumberRoundedIcon sx={{ fontSize: 16 }} /> },
                { title: "Users List", href: "/admin/users", icon: <PeopleAltRoundedIcon sx={{ fontSize: 16 }} /> },
                { title: "Platform Settings", href: "/admin/settings", icon: <OpenInNewRoundedIcon sx={{ fontSize: 16 }} /> },
              ].map((link, idx) => (
                <Grid key={idx} size={{ xs: 6 }}>
                  <Button
                    component={Link}
                    href={link.href}
                    variant="outlined"
                    fullWidth
                    startIcon={link.icon}
                    sx={{
                      justifyContent: "flex-start",
                      borderColor: "#e2e8f0",
                      color: "#334155",
                      fontSize: "0.75rem",
                      py: 0.75,
                      px: 1.25,
                      borderRadius: "6px",
                      "&:hover": { borderColor: "#cbd5e1", bgcolor: "#f8fafc" },
                    }}
                  >
                    {link.title}
                  </Button>
                </Grid>
              ))}
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
