"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import Image from "next/image";
import AdminBookingDetailsDialog from "@/components/AdminBookingDetailsDialog";

// Material UI Components
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Paper from "@mui/material/Paper";
import OutlinedInput from "@mui/material/OutlinedInput";
import InputAdornment from "@mui/material/InputAdornment";
import Chip from "@mui/material/Chip";
import Avatar from "@mui/material/Avatar";
import Tooltip from "@mui/material/Tooltip";
import Table from "@mui/material/Table";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TableCell from "@mui/material/TableCell";
import TableBody from "@mui/material/TableBody";
import TableContainer from "@mui/material/TableContainer";
import TablePagination from "@mui/material/TablePagination";
import CircularProgress from "@mui/material/CircularProgress";
import Skeleton from "@mui/material/Skeleton";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Divider from "@mui/material/Divider";

// Material UI Icons
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import ClearRoundedIcon from "@mui/icons-material/ClearRounded";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import CalendarTodayRoundedIcon from "@mui/icons-material/CalendarTodayRounded";
import PersonRoundedIcon from "@mui/icons-material/PersonRounded";
import PublicRoundedIcon from "@mui/icons-material/PublicRounded";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import ShieldOutlinedIcon from "@mui/icons-material/ShieldOutlined";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import CancelRoundedIcon from "@mui/icons-material/CancelRounded";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import PersonAddAlt1RoundedIcon from "@mui/icons-material/PersonAddAlt1Rounded";
import ExploreOutlinedIcon from "@mui/icons-material/ExploreOutlined";
import LaunchRoundedIcon from "@mui/icons-material/LaunchRounded";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import PeopleOutlineRoundedIcon from "@mui/icons-material/PeopleOutlineRounded";
import AttachMoneyRoundedIcon from "@mui/icons-material/AttachMoneyRounded";
import AccessTimeRoundedIcon from "@mui/icons-material/AccessTimeRounded";

interface AdventureLeaderItem {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
  phone?: string;
  role?: string;
  nationality?: string;
}

interface Tour {
  _id: string;
  name: string;
  slug: string;
  tourCode: string;
  summary: string;
  price: {
    amount: number;
    currency: string;
  };
  duration: {
    days: number;
    nights: number;
  };
  country: {
    _id: string;
    name: string;
  };
  images: Array<{
    url: string;
    caption: string;
    isPrimary: boolean;
  }>;
  startDates: Array<{
    _id: string;
    startDate: string;
    endDate: string;
    availableSpots: number;
    isActive: boolean;
    discount?: string;
    adventureLeader?: {
      _id: string;
      name: string;
      email: string;
      avatar?: string;
      phone?: string;
      role?: string;
    } | null;
  }>;
}

interface Booking {
  _id: string;
  tour: {
    _id: string;
    name: string;
    slug: string;
    tourCode: string;
    images?: any[];
    duration?: any;
    location?: any;
  };
  user: {
    _id: string;
    name: string;
    email: string;
    phone?: string;
    avatar?: string;
    nationality?: string;
  };
  startDate: string;
  numberOfTravelers: number;
  travelers: Array<{
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    dateOfBirth?: string;
    nationality?: string;
    passportNumber?: string;
    specialRequests?: string;
  }>;
  price: {
    basePrice: number;
    discountAmount: number;
    taxes: number;
    totalPrice: number;
    currency: string;
  };
  payment: {
    method: string;
    status: string;
    transactions: any[];
  };
  status: string;
  bookingReference: string;
  specialRequests?: {
    dietary: string[];
    accessibility: string;
    roomPreference: string;
    other: string;
  };
  createdAt: string;
}

interface HoldSpace {
  _id: string;
  user: {
    name: string;
    email: string;
  };
  startDate: string;
  expiresAt: string;
  status: "active" | "expired" | "released" | "converted";
  tour: string;
}

export default function BookingsManagementPage() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeView, setActiveView] = useState<"users" | "tours">("users");
  const [tours, setTours] = useState<Tour[]>([]);
  const [allBookings, setAllBookings] = useState<Booking[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  // Filters for Users View
  const [usersStatusFilter, setUsersStatusFilter] = useState("all");
  const [usersPaymentFilter, setUsersPaymentFilter] = useState("all");
  const [usersMethodFilter, setUsersMethodFilter] = useState("all");
  const [usersTravelersFilter, setUsersTravelersFilter] = useState("all");
  const [usersAmountFilter, setUsersAmountFilter] = useState("all");
  const [usersDepartureWindowFilter, setUsersDepartureWindowFilter] = useState("all");
  const [usersNationalityFilter, setUsersNationalityFilter] = useState("all");

  // Filters for Tours View
  const [toursDestinationFilter, setToursDestinationFilter] = useState("all");
  const [toursAvailabilityFilter, setToursAvailabilityFilter] = useState("all");
  const [toursPriceFilter, setToursPriceFilter] = useState("all");
  const [toursDurationFilter, setToursDurationFilter] = useState("all");
  const [toursDeparturesFilter, setToursDeparturesFilter] = useState("all");

  // Pagination
  const [usersPage, setUsersPage] = useState(0);
  const [usersRowsPerPage, setUsersRowsPerPage] = useState(20);
  const [toursPage, setToursPage] = useState(0);
  const [toursRowsPerPage, setToursRowsPerPage] = useState(20);

  // Modals
  const [selectedTour, setSelectedTour] = useState<Tour | null>(null);
  const [isDatesModalOpen, setIsDatesModalOpen] = useState(false);

  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [isBookingsModalOpen, setIsBookingsModalOpen] = useState(false);
  const [bookingsTableType, setBookingsTableType] = useState<"bookings" | "holds">("bookings");

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [holds, setHolds] = useState<HoldSpace[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(false);

  const [selectedBookingDetails, setSelectedBookingDetails] = useState<any | null>(null);

  // Adventure Leader Assignment
  const [isAssignLeaderModalOpen, setIsAssignLeaderModalOpen] = useState(false);
  const [assigningDeparture, setAssigningDeparture] = useState<{
    tourId: string;
    departure: any;
  } | null>(null);
  const [availableLeaders, setAvailableLeaders] = useState<AdventureLeaderItem[]>([]);
  const [loadingLeaders, setLoadingLeaders] = useState(false);
  const [leaderSearchTerm, setLeaderSearchTerm] = useState("");
  const [selectedLeaderIdForAssign, setSelectedLeaderIdForAssign] = useState<string | null>(null);
  const [savingLeaderAssignment, setSavingLeaderAssignment] = useState(false);

  // Docs Verification
  const [docsModalBooking, setDocsModalBooking] = useState<any | null>(null);
  const [docsActiveTab, setDocsActiveTab] = useState(0);
  const [togglingDoc, setTogglingDoc] = useState<string | null>(null);

  // Toast
  const [toast, setToast] = useState<{
    open: boolean;
    message: string;
    severity: "success" | "error" | "info";
  }>({
    open: false,
    message: "",
    severity: "success",
  });

  const handleToggleVerification = async (bookingId: string, travelerIndex: number, docType: string) => {
    const key = `${travelerIndex}-${docType}`;
    setTogglingDoc(key);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${api.baseURL}${api.endpoints.bookings.toggleDocVerification(bookingId)}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ travelerIndex, docType }),
      });
      const data = await res.json();
      if (res.ok) {
        setDocsModalBooking(data.data.booking);
        setAllBookings((prev) =>
          prev.map((b) => (b._id === bookingId ? { ...b, ...data.data.booking } : b))
        );
        setToast({ open: true, message: "Document verification status updated.", severity: "success" });
      }
    } catch (err) {
      console.error("Toggle verification failed:", err);
      setToast({ open: true, message: "Failed to toggle document status.", severity: "error" });
    } finally {
      setTogglingDoc(null);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    setUsersPage(0);
  }, [
    searchTerm,
    usersStatusFilter,
    usersPaymentFilter,
    usersMethodFilter,
    usersTravelersFilter,
    usersAmountFilter,
    usersDepartureWindowFilter,
    usersNationalityFilter,
  ]);

  useEffect(() => {
    setToursPage(0);
  }, [
    searchTerm,
    toursDestinationFilter,
    toursAvailabilityFilter,
    toursPriceFilter,
    toursDurationFilter,
    toursDeparturesFilter,
  ]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      await Promise.all([fetchTours(), fetchAllBookings()]);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([fetchTours(), fetchAllBookings()]);
      setToast({ open: true, message: "Bookings and tours refreshed.", severity: "success" });
    } finally {
      setRefreshing(false);
    }
  };

  const fetchTours = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${api.baseURL}/tours`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setTours(data.data.tours || []);
      }
    } catch (error) {
      console.error("Error fetching tours:", error);
    }
  };

  const fetchAllBookings = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${api.baseURL}/bookings`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setAllBookings(data.data.bookings || []);
      }
    } catch (error) {
      console.error("Error fetching bookings:", error);
    }
  };

  const fetchBookingsForDate = async (tourId: string, date: string) => {
    try {
      setLoadingBookings(true);
      const token = localStorage.getItem("token");
      const response = await fetch(`${api.baseURL}/bookings?tour=${tourId}&startDate=${date}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setBookings(data.data.bookings || []);
      }
    } catch (error) {
      console.error("Error fetching bookings:", error);
    } finally {
      setLoadingBookings(false);
    }
  };

  const fetchHoldsForDate = async (tourId: string, date: string) => {
    try {
      setLoadingBookings(true);
      const token = localStorage.getItem("token");
      const response = await fetch(`${api.baseURL}/hold-spaces?tour=${tourId}&startDate=${date}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setHolds(data.data.holds || []);
      }
    } catch (error) {
      console.error("Error fetching holds:", error);
    } finally {
      setLoadingBookings(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const handleTourClick = (tour: Tour) => {
    setSelectedTour(tour);
    setIsDatesModalOpen(true);
  };

  const handleViewBookings = (date: string) => {
    if (!selectedTour) return;
    setSelectedDate(date);
    setBookingsTableType("bookings");
    setIsBookingsModalOpen(true);
    fetchBookingsForDate(selectedTour._id, date);
  };

  const handleViewHolds = (date: string) => {
    if (!selectedTour) return;
    setSelectedDate(date);
    setBookingsTableType("holds");
    setIsBookingsModalOpen(true);
    fetchHoldsForDate(selectedTour._id, date);
  };

  const fetchAvailableLeaders = async () => {
    setLoadingLeaders(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${api.baseURL}/tours/adventure-leaders`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setAvailableLeaders(data.data?.leaders || []);
      }
    } catch (e) {
      console.error("Error fetching leaders:", e);
    } finally {
      setLoadingLeaders(false);
    }
  };

  const handleOpenAssignLeader = (departure: any) => {
    if (!selectedTour) return;
    setAssigningDeparture({ tourId: selectedTour._id, departure });
    const currentLeaderId =
      departure.adventureLeader?._id ||
      (typeof departure.adventureLeader === "string" ? departure.adventureLeader : null);
    setSelectedLeaderIdForAssign(currentLeaderId);
    setLeaderSearchTerm("");
    setIsAssignLeaderModalOpen(true);
    fetchAvailableLeaders();
  };

  const handleSaveLeaderAssignment = async (leaderIdToAssign: string | null) => {
    if (!selectedTour || !assigningDeparture) return;
    setSavingLeaderAssignment(true);
    try {
      const token = localStorage.getItem("token");
      const depId = assigningDeparture.departure._id || assigningDeparture.departure.startDate;
      const res = await fetch(
        `${api.baseURL}/tours/${selectedTour._id}/departures/${depId}/leader`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ leaderId: leaderIdToAssign }),
        }
      );

      if (res.ok) {
        const json = await res.json();
        const updatedDeparture = json.data?.departure;
        const chosenLeaderObj = leaderIdToAssign
          ? availableLeaders.find((l) => l._id === leaderIdToAssign) ||
            updatedDeparture?.adventureLeader ||
            null
          : null;

        // Update selectedTour in place
        setSelectedTour((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            startDates: prev.startDates.map((sd) => {
              const isMatch =
                (sd._id && sd._id === assigningDeparture.departure._id) ||
                sd.startDate === assigningDeparture.departure.startDate;
              if (isMatch) {
                return {
                  ...sd,
                  adventureLeader: chosenLeaderObj,
                };
              }
              return sd;
            }),
          };
        });

        // Update tours in place
        setTours((prevTours) =>
          prevTours.map((t) => {
            if (t._id === selectedTour._id) {
              return {
                ...t,
                startDates: t.startDates.map((sd) => {
                  const isMatch =
                    (sd._id && sd._id === assigningDeparture.departure._id) ||
                    sd.startDate === assigningDeparture.departure.startDate;
                  if (isMatch) {
                    return {
                      ...sd,
                      adventureLeader: chosenLeaderObj,
                    };
                  }
                  return sd;
                }),
              };
            }
            return t;
          })
        );

        setIsAssignLeaderModalOpen(false);
        setAssigningDeparture(null);
        setToast({ open: true, message: "Adventure Leader assignment updated.", severity: "success" });
      } else {
        const err = await res.json();
        setToast({ open: true, message: err.message || "Failed to update Adventure Leader", severity: "error" });
      }
    } catch (error) {
      console.error("Error updating leader:", error);
      setToast({ open: true, message: "Network error updating leader", severity: "error" });
    } finally {
      setSavingLeaderAssignment(false);
    }
  };

  // Filter options
  const nationalityOptions = Array.from(
    new Set(
      allBookings
        .map((b) => b.user?.nationality)
        .filter((n): n is string => typeof n === "string" && n.trim() !== "")
    )
  ).sort();

  const destinationOptions = Array.from(
    new Set(
      tours
        .map((t) => t.country?.name)
        .filter((name): name is string => typeof name === "string" && name.trim() !== "")
    )
  ).sort();

  const paymentMethodOptions = Array.from(
    new Set(
      allBookings
        .map((b) => b.payment?.method)
        .filter((m): m is string => typeof m === "string" && m.trim() !== "")
    )
  ).sort();

  // Filter Users Bookings
  const filteredUsersBookings = allBookings.filter((booking) => {
    const query = searchTerm.toLowerCase().trim();
    const matchesSearch =
      !query ||
      (booking.user?.name || "").toLowerCase().includes(query) ||
      (booking.user?.email || "").toLowerCase().includes(query) ||
      (booking.bookingReference || "").toLowerCase().includes(query) ||
      (booking.tour?.name || "").toLowerCase().includes(query);

    const matchesStatus =
      usersStatusFilter === "all" || (booking.status || "").toLowerCase() === usersStatusFilter;

    const matchesPayment =
      usersPaymentFilter === "all" || (booking.payment?.status || "").toLowerCase() === usersPaymentFilter;

    const matchesPaymentMethod =
      usersMethodFilter === "all" ||
      (booking.payment?.method || "").toLowerCase() === usersMethodFilter;

    const groupSize = booking.numberOfTravelers || 1;
    const matchesTravelers =
      usersTravelersFilter === "all" ||
      (usersTravelersFilter === "solo" && groupSize === 1) ||
      (usersTravelersFilter === "small-group" && groupSize >= 2 && groupSize <= 4) ||
      (usersTravelersFilter === "large-group" && groupSize >= 5);

    const totalPrice = booking.price?.totalPrice || 0;
    const matchesAmount =
      usersAmountFilter === "all" ||
      (usersAmountFilter === "budget" && totalPrice < 1000) ||
      (usersAmountFilter === "mid" && totalPrice >= 1000 && totalPrice <= 2500) ||
      (usersAmountFilter === "premium" && totalPrice > 2500);

    const now = new Date();
    const departureDate = new Date(booking.startDate);
    const in30Days = new Date();
    in30Days.setDate(in30Days.getDate() + 30);
    const in90Days = new Date();
    in90Days.setDate(in90Days.getDate() + 90);
    const matchesDepartureWindow =
      usersDepartureWindowFilter === "all" ||
      (usersDepartureWindowFilter === "upcoming-30" && departureDate >= now && departureDate <= in30Days) ||
      (usersDepartureWindowFilter === "upcoming-90" && departureDate >= now && departureDate <= in90Days) ||
      (usersDepartureWindowFilter === "past" && departureDate < now) ||
      (usersDepartureWindowFilter === "this-year" && departureDate.getFullYear() === now.getFullYear());

    const matchesNationality =
      usersNationalityFilter === "all" ||
      (booking.user?.nationality || "") === usersNationalityFilter;

    return (
      matchesSearch &&
      matchesStatus &&
      matchesPayment &&
      matchesPaymentMethod &&
      matchesTravelers &&
      matchesAmount &&
      matchesDepartureWindow &&
      matchesNationality
    );
  });

  // Filter Tours View
  const filteredTours = tours.filter((tour) => {
    const query = searchTerm.toLowerCase().trim();
    const matchesSearch =
      !query ||
      tour.name.toLowerCase().includes(query) ||
      tour.tourCode.toLowerCase().includes(query);

    const matchesDestination =
      toursDestinationFilter === "all" || tour.country?.name === toursDestinationFilter;

    const hasAvailableSpots = tour.startDates.some(
      (date) => date.availableSpots > 0 && date.isActive
    );
    const isSoldOut = tour.startDates.every(
      (date) => date.availableSpots === 0 || !date.isActive
    );
    const nearlyFull = tour.startDates.some(
      (date) => date.availableSpots > 0 && date.availableSpots <= 3 && date.isActive
    );

    const matchesAvailability =
      toursAvailabilityFilter === "all" ||
      (toursAvailabilityFilter === "available" && hasAvailableSpots) ||
      (toursAvailabilityFilter === "soldout" && isSoldOut) ||
      (toursAvailabilityFilter === "nearly-full" && nearlyFull);

    const amount = tour.price.amount;
    const matchesPrice =
      toursPriceFilter === "all" ||
      (toursPriceFilter === "low" && amount < 1000) ||
      (toursPriceFilter === "mid" && amount >= 1000 && amount <= 3000) ||
      (toursPriceFilter === "high" && amount > 3000);

    const days = tour.duration.days;
    const matchesDuration =
      toursDurationFilter === "all" ||
      (toursDurationFilter === "short" && days <= 5) ||
      (toursDurationFilter === "medium" && days >= 6 && days <= 10) ||
      (toursDurationFilter === "long" && days >= 11);

    const now = new Date();
    const in30Days = new Date();
    in30Days.setDate(in30Days.getDate() + 30);

    const upcoming30DaysDeparture = tour.startDates.some((date) => {
      const depDate = new Date(date.startDate);
      return depDate >= now && depDate <= in30Days && date.isActive;
    });

    const matchesDepartures =
      toursDeparturesFilter === "all" ||
      (toursDeparturesFilter === "none" && tour.startDates.length === 0) ||
      (toursDeparturesFilter === "few" && tour.startDates.length >= 1 && tour.startDates.length <= 3) ||
      (toursDeparturesFilter === "many" && tour.startDates.length >= 4) ||
      (toursDeparturesFilter === "upcoming-30" && upcoming30DaysDeparture);

    return (
      matchesSearch &&
      matchesDestination &&
      matchesAvailability &&
      matchesPrice &&
      matchesDuration &&
      matchesDepartures
    );
  });

  const paginatedUsersBookings = filteredUsersBookings.slice(
    usersPage * usersRowsPerPage,
    usersPage * usersRowsPerPage + usersRowsPerPage
  );

  const paginatedTours = filteredTours.slice(
    toursPage * toursRowsPerPage,
    toursPage * toursRowsPerPage + toursRowsPerPage
  );

  if (loading) {
    return (
      <Box sx={{ p: { xs: 2, sm: 3 }, bgcolor: "#f8fafc", minHeight: "100%" }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2.5 }}>
          <Box>
            <Skeleton variant="text" width={220} height={32} />
            <Skeleton variant="text" width={340} height={20} />
          </Box>
          <Skeleton variant="rounded" width={80} height={32} sx={{ borderRadius: "6px" }} />
        </Box>
        <Paper sx={{ p: 2, mb: 2.5, borderRadius: "6px", border: "1px solid #e2e8f0" }}>
          <Skeleton variant="rounded" height={40} sx={{ borderRadius: "6px" }} />
        </Paper>
        <Paper sx={{ borderRadius: "6px", border: "1px solid #e2e8f0", overflow: "hidden" }}>
          {[...Array(6)].map((_, i) => (
            <Box key={i} sx={{ p: 2, borderBottom: "1px solid #f1f5f9", display: "flex", gap: 2 }}>
              <Skeleton variant="rounded" width={34} height={34} sx={{ borderRadius: "6px" }} />
              <Skeleton variant="text" width="20%" height={24} />
              <Skeleton variant="text" width="30%" height={24} />
              <Skeleton variant="text" width="15%" height={24} />
            </Box>
          ))}
        </Paper>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, sm: 3 }, bgcolor: "#f8fafc", minHeight: "100%" }}>
      {/* ======================================================== */}
      {/* 1. Header: Matching /admin/tours-management style */}
      {/* ======================================================== */}
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
            Bookings Management
          </Typography>
          <Typography variant="body2" sx={{ color: "#64748b", fontSize: "0.8125rem", mt: 0.25 }}>
            Manage reservations, tour departures, guest documents, and leader assignments ({allBookings.length} bookings, {tours.length} tours)
          </Typography>
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Tooltip title="Refresh bookings & catalog" arrow>
            <IconButton
              size="small"
              onClick={handleRefresh}
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
            href="/admin"
            variant="outlined"
            size="small"
            startIcon={<ArrowBackRoundedIcon sx={{ fontSize: 16 }} />}
            sx={{
              borderRadius: "6px",
              textTransform: "none",
              fontWeight: 600,
              fontSize: "0.8125rem",
              color: "#475569",
              borderColor: "#cbd5e1",
              bgcolor: "#ffffff",
              height: 32,
              "&:hover": { borderColor: "#0f172a", color: "#0f172a", bgcolor: "#f8fafc" },
            }}
          >
            Back to Dashboard
          </Button>
        </Box>
      </Box>

      {/* ======================================================== */}
      {/* 2. View Switcher & Search / Filter Controls */}
      {/* ======================================================== */}
      <Paper
        sx={{
          p: 1.5,
          mb: 2.5,
          borderRadius: "6px",
          border: "1px solid #e2e8f0",
          bgcolor: "#ffffff",
          display: "flex",
          flexDirection: "column",
          gap: 1.5,
        }}
      >
        {/* Top Control Row: View Mode Chips & Search Input */}
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", md: "row" },
            justifyContent: "space-between",
            alignItems: { xs: "stretch", md: "center" },
            gap: 1.5,
          }}
        >
          {/* View Mode Chips */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Chip
              label={`Users View (${allBookings.length})`}
              size="small"
              onClick={() => setActiveView("users")}
              variant={activeView === "users" ? "filled" : "outlined"}
              sx={{
                borderRadius: "4px",
                fontSize: "0.75rem",
                fontWeight: 600,
                cursor: "pointer",
                bgcolor: activeView === "users" ? "#0f172a" : "transparent",
                color: activeView === "users" ? "#ffffff" : "#475569",
                borderColor: activeView === "users" ? "#0f172a" : "#e2e8f0",
                "&:hover": {
                  bgcolor: activeView === "users" ? "#1e293b" : "#f1f5f9",
                },
              }}
            />
            <Chip
              label={`Tours View (${tours.length})`}
              size="small"
              onClick={() => setActiveView("tours")}
              variant={activeView === "tours" ? "filled" : "outlined"}
              sx={{
                borderRadius: "4px",
                fontSize: "0.75rem",
                fontWeight: 600,
                cursor: "pointer",
                bgcolor: activeView === "tours" ? "#0f172a" : "transparent",
                color: activeView === "tours" ? "#ffffff" : "#475569",
                borderColor: activeView === "tours" ? "#0f172a" : "#e2e8f0",
                "&:hover": {
                  bgcolor: activeView === "tours" ? "#1e293b" : "#f1f5f9",
                },
              }}
            />
          </Box>

          {/* Search Box */}
          <OutlinedInput
            size="small"
            placeholder={
              activeView === "users"
                ? "Search user, email, booking ref, or tour..."
                : "Search tour package or country..."
            }
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            startAdornment={
              <InputAdornment position="start">
                <SearchRoundedIcon fontSize="small" sx={{ color: "#94a3b8" }} />
              </InputAdornment>
            }
            endAdornment={
              searchTerm ? (
                <InputAdornment position="end">
                  <IconButton
                    size="small"
                    onClick={() => setSearchTerm("")}
                    edge="end"
                    sx={{ p: 0.25, color: "#94a3b8" }}
                  >
                    <ClearRoundedIcon fontSize="small" />
                  </IconButton>
                </InputAdornment>
              ) : null
            }
            sx={{
              width: { xs: "100%", md: 360 },
              borderRadius: "6px",
              fontSize: "0.8125rem",
              bgcolor: "#f8fafc",
              "& .MuiOutlinedInput-notchedOutline": { borderColor: "#e2e8f0" },
            }}
          />
        </Box>

        <Divider sx={{ my: 0.25 }} />

        {/* Filters Row */}
        {activeView === "users" ? (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
            <FormControl size="small" sx={{ minWidth: 140 }}>
              <InputLabel sx={{ fontSize: "0.75rem" }}>Booking Status</InputLabel>
              <Select
                label="Booking Status"
                value={usersStatusFilter}
                onChange={(e) => setUsersStatusFilter(e.target.value)}
                sx={{ fontSize: "0.75rem", borderRadius: "4px" }}
              >
                <MenuItem value="all" sx={{ fontSize: "0.75rem" }}>All Statuses</MenuItem>
                <MenuItem value="confirmed" sx={{ fontSize: "0.75rem" }}>Confirmed</MenuItem>
                <MenuItem value="pending" sx={{ fontSize: "0.75rem" }}>Pending</MenuItem>
                <MenuItem value="cancelled" sx={{ fontSize: "0.75rem" }}>Cancelled</MenuItem>
                <MenuItem value="completed" sx={{ fontSize: "0.75rem" }}>Completed</MenuItem>
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 140 }}>
              <InputLabel sx={{ fontSize: "0.75rem" }}>Payment Status</InputLabel>
              <Select
                label="Payment Status"
                value={usersPaymentFilter}
                onChange={(e) => setUsersPaymentFilter(e.target.value)}
                sx={{ fontSize: "0.75rem", borderRadius: "4px" }}
              >
                <MenuItem value="all" sx={{ fontSize: "0.75rem" }}>All Payments</MenuItem>
                <MenuItem value="paid" sx={{ fontSize: "0.75rem" }}>Paid</MenuItem>
                <MenuItem value="pending" sx={{ fontSize: "0.75rem" }}>Pending</MenuItem>
                <MenuItem value="failed" sx={{ fontSize: "0.75rem" }}>Failed</MenuItem>
                <MenuItem value="refunded" sx={{ fontSize: "0.75rem" }}>Refunded</MenuItem>
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 130 }}>
              <InputLabel sx={{ fontSize: "0.75rem" }}>Group Size</InputLabel>
              <Select
                label="Group Size"
                value={usersTravelersFilter}
                onChange={(e) => setUsersTravelersFilter(e.target.value)}
                sx={{ fontSize: "0.75rem", borderRadius: "4px" }}
              >
                <MenuItem value="all" sx={{ fontSize: "0.75rem" }}>All Groups</MenuItem>
                <MenuItem value="solo" sx={{ fontSize: "0.75rem" }}>Solo (1)</MenuItem>
                <MenuItem value="small-group" sx={{ fontSize: "0.75rem" }}>Small (2-4)</MenuItem>
                <MenuItem value="large-group" sx={{ fontSize: "0.75rem" }}>Large (5+)</MenuItem>
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 140 }}>
              <InputLabel sx={{ fontSize: "0.75rem" }}>Departure Window</InputLabel>
              <Select
                label="Departure Window"
                value={usersDepartureWindowFilter}
                onChange={(e) => setUsersDepartureWindowFilter(e.target.value)}
                sx={{ fontSize: "0.75rem", borderRadius: "4px" }}
              >
                <MenuItem value="all" sx={{ fontSize: "0.75rem" }}>All Windows</MenuItem>
                <MenuItem value="upcoming-30" sx={{ fontSize: "0.75rem" }}>In 30 Days</MenuItem>
                <MenuItem value="upcoming-90" sx={{ fontSize: "0.75rem" }}>In 90 Days</MenuItem>
                <MenuItem value="past" sx={{ fontSize: "0.75rem" }}>Past</MenuItem>
                <MenuItem value="this-year" sx={{ fontSize: "0.75rem" }}>This Year</MenuItem>
              </Select>
            </FormControl>

            {(usersStatusFilter !== "all" ||
              usersPaymentFilter !== "all" ||
              usersTravelersFilter !== "all" ||
              usersDepartureWindowFilter !== "all" ||
              usersMethodFilter !== "all" ||
              usersAmountFilter !== "all" ||
              usersNationalityFilter !== "all" ||
              searchTerm) && (
              <Button
                size="small"
                onClick={() => {
                  setUsersStatusFilter("all");
                  setUsersPaymentFilter("all");
                  setUsersMethodFilter("all");
                  setUsersTravelersFilter("all");
                  setUsersAmountFilter("all");
                  setUsersDepartureWindowFilter("all");
                  setUsersNationalityFilter("all");
                  setSearchTerm("");
                }}
                sx={{
                  fontSize: "0.75rem",
                  textTransform: "none",
                  color: "#64748b",
                  "&:hover": { color: "#0f172a" },
                }}
              >
                Reset Filters
              </Button>
            )}
          </Box>
        ) : (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
            <FormControl size="small" sx={{ minWidth: 140 }}>
              <InputLabel sx={{ fontSize: "0.75rem" }}>Destination</InputLabel>
              <Select
                label="Destination"
                value={toursDestinationFilter}
                onChange={(e) => setToursDestinationFilter(e.target.value)}
                sx={{ fontSize: "0.75rem", borderRadius: "4px" }}
              >
                <MenuItem value="all" sx={{ fontSize: "0.75rem" }}>All Destinations</MenuItem>
                {destinationOptions.map((dest) => (
                  <MenuItem key={dest} value={dest} sx={{ fontSize: "0.75rem" }}>
                    {dest}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 140 }}>
              <InputLabel sx={{ fontSize: "0.75rem" }}>Availability</InputLabel>
              <Select
                label="Availability"
                value={toursAvailabilityFilter}
                onChange={(e) => setToursAvailabilityFilter(e.target.value)}
                sx={{ fontSize: "0.75rem", borderRadius: "4px" }}
              >
                <MenuItem value="all" sx={{ fontSize: "0.75rem" }}>All Availability</MenuItem>
                <MenuItem value="available" sx={{ fontSize: "0.75rem" }}>Available Spots</MenuItem>
                <MenuItem value="nearly-full" sx={{ fontSize: "0.75rem" }}>Nearly Full</MenuItem>
                <MenuItem value="soldout" sx={{ fontSize: "0.75rem" }}>Sold Out</MenuItem>
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 130 }}>
              <InputLabel sx={{ fontSize: "0.75rem" }}>Duration</InputLabel>
              <Select
                label="Duration"
                value={toursDurationFilter}
                onChange={(e) => setToursDurationFilter(e.target.value)}
                sx={{ fontSize: "0.75rem", borderRadius: "4px" }}
              >
                <MenuItem value="all" sx={{ fontSize: "0.75rem" }}>All Durations</MenuItem>
                <MenuItem value="short" sx={{ fontSize: "0.75rem" }}>Short (1-5 days)</MenuItem>
                <MenuItem value="medium" sx={{ fontSize: "0.75rem" }}>Medium (6-10 days)</MenuItem>
                <MenuItem value="long" sx={{ fontSize: "0.75rem" }}>Long (11+ days)</MenuItem>
              </Select>
            </FormControl>

            {(toursDestinationFilter !== "all" ||
              toursAvailabilityFilter !== "all" ||
              toursDurationFilter !== "all" ||
              toursPriceFilter !== "all" ||
              toursDeparturesFilter !== "all" ||
              searchTerm) && (
              <Button
                size="small"
                onClick={() => {
                  setToursDestinationFilter("all");
                  setToursAvailabilityFilter("all");
                  setToursPriceFilter("all");
                  setToursDurationFilter("all");
                  setToursDeparturesFilter("all");
                  setSearchTerm("");
                }}
                sx={{
                  fontSize: "0.75rem",
                  textTransform: "none",
                  color: "#64748b",
                  "&:hover": { color: "#0f172a" },
                }}
              >
                Reset Filters
              </Button>
            )}
          </Box>
        )}
      </Paper>

      {/* ======================================================== */}
      {/* 3. Main Data Tables: Pure Material UI */}
      {/* ======================================================== */}
      {activeView === "users" ? (
        <Paper sx={{ borderRadius: "6px", border: "1px solid #e2e8f0", overflow: "hidden" }}>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>User / Guest</TableCell>
                  <TableCell>Booking Ref</TableCell>
                  <TableCell>Tour Package</TableCell>
                  <TableCell>Departure Date</TableCell>
                  <TableCell>Travelers</TableCell>
                  <TableCell>Amount</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Documents</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {paginatedUsersBookings.length > 0 ? (
                  paginatedUsersBookings.map((booking) => {
                    const isConfirmed = booking.status === "confirmed";
                    const isCancelled = booking.status === "cancelled";
                    const docsSubmitted = Boolean((booking as any).documentsSubmitted);
                    const docsVerified = Boolean((booking as any).documentsVerified);

                    return (
                      <TableRow key={booking._id} hover>
                        {/* Guest User */}
                        <TableCell sx={{ py: 1.5 }}>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
                            <Avatar
                              sx={{
                                width: 30,
                                height: 30,
                                borderRadius: "6px",
                                bgcolor: "#f1f5f9",
                                color: "#0f172a",
                                fontSize: "0.75rem",
                                fontWeight: 700,
                                border: "1px solid #e2e8f0",
                              }}
                            >
                              {booking.user?.name?.[0]?.toUpperCase() || "G"}
                            </Avatar>
                            <Box sx={{ minWidth: 0 }}>
                              <Typography
                                variant="body2"
                                sx={{
                                  fontWeight: 600,
                                  color: "#0f172a",
                                  fontSize: "0.84rem",
                                }}
                              >
                                {booking.user?.name || "Anonymous Guest"}
                              </Typography>
                              <Typography
                                variant="caption"
                                noWrap
                                sx={{ color: "#64748b", display: "block", fontSize: "0.725rem" }}
                              >
                                {booking.user?.email || "No email"}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>

                        {/* Booking Ref */}
                        <TableCell>
                          <Chip
                            label={`#${booking.bookingReference}`}
                            size="small"
                            sx={{
                              height: 20,
                              fontSize: "0.68rem",
                              fontWeight: 700,
                              borderRadius: "4px",
                              bgcolor: "#f1f5f9",
                              color: "#475569",
                              border: "1px solid #e2e8f0",
                            }}
                          />
                        </TableCell>

                        {/* Tour Name */}
                        <TableCell>
                          <Typography
                            variant="body2"
                            sx={{
                              fontSize: "0.8125rem",
                              color: "#334155",
                              fontWeight: 600,
                              maxWidth: 180,
                            }}
                            noWrap
                          >
                            {booking.tour?.name || "Custom Itinerary"}
                          </Typography>
                        </TableCell>

                        {/* Departure Date */}
                        <TableCell>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                            <CalendarTodayRoundedIcon sx={{ fontSize: 13, color: "#64748b" }} />
                            <Typography variant="body2" sx={{ fontSize: "0.8125rem", color: "#334155" }}>
                              {formatDate(booking.startDate)}
                            </Typography>
                          </Box>
                        </TableCell>

                        {/* Travelers */}
                        <TableCell>
                          <Typography variant="body2" sx={{ fontSize: "0.8125rem", color: "#334155", fontWeight: 500 }}>
                            {booking.numberOfTravelers} {booking.numberOfTravelers === 1 ? "guest" : "guests"}
                          </Typography>
                        </TableCell>

                        {/* Total Amount */}
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 700, fontSize: "0.84rem", color: "#0f172a" }}>
                            ${booking.price?.totalPrice ?? 0}
                          </Typography>
                        </TableCell>

                        {/* Booking Status */}
                        <TableCell>
                          <Chip
                            label={booking.status}
                            size="small"
                            variant="outlined"
                            color={isConfirmed ? "success" : isCancelled ? "error" : "warning"}
                            sx={{
                              height: 20,
                              fontSize: "0.68rem",
                              fontWeight: 600,
                              borderRadius: "4px",
                              textTransform: "capitalize",
                            }}
                          />
                        </TableCell>

                        {/* Documents */}
                        <TableCell>
                          {docsSubmitted ? (
                            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                              <Chip
                                label={docsVerified ? "Verified" : "Pending"}
                                size="small"
                                variant="outlined"
                                color={docsVerified ? "success" : "warning"}
                                sx={{
                                  height: 18,
                                  fontSize: "0.625rem",
                                  fontWeight: 600,
                                  borderRadius: "3px",
                                }}
                              />
                              <Tooltip title="Verify documents" arrow>
                                <IconButton
                                  size="small"
                                  onClick={() => {
                                    setDocsModalBooking(booking);
                                    setDocsActiveTab(0);
                                  }}
                                  sx={{
                                    p: 0.25,
                                    color: "#7c3aed",
                                    "&:hover": { bgcolor: "#f5f3ff" },
                                  }}
                                >
                                  <DescriptionOutlinedIcon sx={{ fontSize: 16 }} />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          ) : (
                            <Typography variant="caption" sx={{ color: "#94a3b8" }}>
                              —
                            </Typography>
                          )}
                        </TableCell>

                        {/* Actions */}
                        <TableCell align="right">
                          <Tooltip title="View Complete Reservation Profile" arrow>
                            <IconButton
                              size="small"
                              onClick={() => setSelectedBookingDetails(booking)}
                              sx={{
                                color: "#64748b",
                                p: 0.5,
                                borderRadius: "4px",
                                "&:hover": { color: "#0f172a", bgcolor: "#f1f5f9" },
                              }}
                            >
                              <VisibilityRoundedIcon sx={{ fontSize: 16 }} />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={9} sx={{ textAlign: "center", py: 6, bgcolor: "#ffffff" }}>
                      <Avatar
                        sx={{
                          width: 44,
                          height: 44,
                          mx: "auto",
                          mb: 1.5,
                          bgcolor: "#f1f5f9",
                          color: "#64748b",
                          borderRadius: "6px",
                        }}
                      >
                        <PersonRoundedIcon />
                      </Avatar>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600, color: "#0f172a", mb: 0.5 }}>
                        {searchTerm ? "No matching bookings found" : "No guest reservations recorded yet"}
                      </Typography>
                      <Typography variant="body2" sx={{ color: "#64748b", mb: 2, fontSize: "0.8125rem" }}>
                        Try clearing active filters or searching with a different guest name or booking reference.
                      </Typography>
                      {searchTerm && (
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => setSearchTerm("")}
                          sx={{ borderRadius: "4px", textTransform: "none", fontSize: "0.75rem" }}
                        >
                          Clear Search
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {filteredUsersBookings.length > 0 && (
            <TablePagination
              rowsPerPageOptions={[10, 20, 50]}
              component="div"
              count={filteredUsersBookings.length}
              rowsPerPage={usersRowsPerPage}
              page={usersPage}
              onPageChange={(_, newPage) => setUsersPage(newPage)}
              onRowsPerPageChange={(e) => {
                setUsersRowsPerPage(parseInt(e.target.value, 10));
                setUsersPage(0);
              }}
              sx={{
                borderTop: "1px solid #e2e8f0",
                "& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows": {
                  fontSize: "0.8125rem",
                  color: "#64748b",
                },
              }}
            />
          )}
        </Paper>
      ) : (
        /* ======================================================== */
        /* Tours View Table */
        /* ======================================================== */
        <Paper sx={{ borderRadius: "6px", border: "1px solid #e2e8f0", overflow: "hidden" }}>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Tour Package</TableCell>
                  <TableCell>Destination / Country</TableCell>
                  <TableCell>Active Departures</TableCell>
                  <TableCell>Base Price</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {paginatedTours.length > 0 ? (
                  paginatedTours.map((tour) => {
                    const primaryImg =
                      tour.images?.find((img) => img.isPrimary)?.url ||
                      tour.images?.[0]?.url ||
                      "/placeholder-tour.jpg";

                    return (
                      <TableRow key={tour._id} hover>
                        {/* Tour Name & Thumbnail */}
                        <TableCell sx={{ py: 1.5 }}>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                            <Box
                              component="img"
                              src={primaryImg}
                              alt={tour.name}
                              sx={{
                                width: 34,
                                height: 34,
                                borderRadius: "6px",
                                objectFit: "cover",
                                border: "1px solid #e2e8f0",
                                flexShrink: 0,
                              }}
                            />
                            <Box sx={{ minWidth: 0 }}>
                              <Typography
                                variant="body2"
                                sx={{
                                  fontWeight: 600,
                                  color: "#0f172a",
                                  fontSize: "0.84rem",
                                }}
                              >
                                {tour.name}
                              </Typography>
                              <Typography
                                variant="caption"
                                noWrap
                                sx={{ color: "#64748b", display: "block", fontSize: "0.725rem", mt: 0.25 }}
                              >
                                {tour.tourCode}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>

                        {/* Country */}
                        <TableCell>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                            <PublicRoundedIcon sx={{ fontSize: 15, color: "#64748b" }} />
                            <Typography variant="body2" sx={{ fontSize: "0.8125rem", color: "#334155" }}>
                              {tour.country?.name || "Global"}
                            </Typography>
                          </Box>
                        </TableCell>

                        {/* Departures count */}
                        <TableCell>
                          <Chip
                            label={`${tour.startDates.length} Departures`}
                            size="small"
                            variant="outlined"
                            sx={{
                              height: 20,
                              fontSize: "0.68rem",
                              fontWeight: 600,
                              borderRadius: "4px",
                              borderColor: "#cbd5e1",
                              color: "#334155",
                            }}
                          />
                        </TableCell>

                        {/* Base Price */}
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 700, fontSize: "0.84rem", color: "#0f172a" }}>
                            ${tour.price?.amount || 0}
                          </Typography>
                        </TableCell>

                        {/* Actions */}
                        <TableCell align="right">
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => handleTourClick(tour)}
                            sx={{
                              borderRadius: "4px",
                              textTransform: "none",
                              fontSize: "0.75rem",
                              fontWeight: 600,
                              color: "#0f172a",
                              borderColor: "#cbd5e1",
                              py: 0.25,
                              px: 1.25,
                              "&:hover": { borderColor: "#0f172a", bgcolor: "#f8fafc" },
                            }}
                          >
                            View Departures
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} sx={{ textAlign: "center", py: 6, bgcolor: "#ffffff" }}>
                      <Avatar
                        sx={{
                          width: 44,
                          height: 44,
                          mx: "auto",
                          mb: 1.5,
                          bgcolor: "#f1f5f9",
                          color: "#64748b",
                          borderRadius: "6px",
                        }}
                      >
                        <ExploreOutlinedIcon />
                      </Avatar>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600, color: "#0f172a", mb: 0.5 }}>
                        No tour packages found
                      </Typography>
                      <Typography variant="body2" sx={{ color: "#64748b", mb: 2, fontSize: "0.8125rem" }}>
                        Try clearing active filters or searching with a different tour name.
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {filteredTours.length > 0 && (
            <TablePagination
              rowsPerPageOptions={[10, 20, 50]}
              component="div"
              count={filteredTours.length}
              rowsPerPage={toursRowsPerPage}
              page={toursPage}
              onPageChange={(_, newPage) => setToursPage(newPage)}
              onRowsPerPageChange={(e) => {
                setToursRowsPerPage(parseInt(e.target.value, 10));
                setToursPage(0);
              }}
              sx={{
                borderTop: "1px solid #e2e8f0",
                "& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows": {
                  fontSize: "0.8125rem",
                  color: "#64748b",
                },
              }}
            />
          )}
        </Paper>
      )}

      {/* ======================================================== */}
      {/* 4. Modal 1: Tour Departures List (Material UI Dialog) */}
      {/* ======================================================== */}
      <Dialog
        open={isDatesModalOpen && Boolean(selectedTour)}
        onClose={() => setIsDatesModalOpen(false)}
        maxWidth="md"
        fullWidth
        slotProps={{
          paper: { sx: { borderRadius: "6px", p: 0.5 } },
        }}
      >
        <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", pb: 1 }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, color: "#0f172a", fontSize: "1.05rem" }}>
              {selectedTour?.name}
            </Typography>
            <Typography variant="caption" sx={{ color: "#64748b" }}>
              Select a departure date to inspect guest bookings, holds, and field leader assignments
            </Typography>
          </Box>
          <IconButton size="small" onClick={() => setIsDatesModalOpen(false)} sx={{ color: "#64748b" }}>
            <CloseRoundedIcon fontSize="small" />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ p: 0 }}>
          <TableContainer sx={{ maxHeight: 420 }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell>Departure Window</TableCell>
                  <TableCell>Capacity & Spots</TableCell>
                  <TableCell>Tariff</TableCell>
                  <TableCell>Adventure Leader</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {selectedTour?.startDates
                  ?.slice()
                  .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
                  .map((date, idx) => {
                    const isSoldOut = date.availableSpots === 0 || !date.isActive;

                    return (
                      <TableRow key={idx} hover>
                        <TableCell sx={{ py: 1.25 }}>
                          <Typography variant="body2" sx={{ fontWeight: 600, color: "#0f172a", fontSize: "0.8125rem" }}>
                            {formatDate(date.startDate)}
                          </Typography>
                          <Typography variant="caption" sx={{ color: "#64748b", fontSize: "0.7rem" }}>
                            Ends: {formatDate(date.endDate)}
                          </Typography>
                        </TableCell>

                        <TableCell>
                          <Chip
                            label={isSoldOut ? "Sold Out" : `${date.availableSpots} remaining`}
                            size="small"
                            variant="outlined"
                            color={isSoldOut ? "error" : "success"}
                            sx={{ height: 18, fontSize: "0.65rem", fontWeight: 600, borderRadius: "3px" }}
                          />
                        </TableCell>

                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 600, color: "#0f172a", fontSize: "0.8125rem" }}>
                            ${selectedTour.price?.amount}
                          </Typography>
                          {date.discount && (
                            <Typography variant="caption" sx={{ color: "#059669", fontSize: "0.68rem", fontWeight: 600 }}>
                              Discount Active
                            </Typography>
                          )}
                        </TableCell>

                        <TableCell>
                          {date.adventureLeader ? (
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                              <Avatar
                                sx={{
                                  width: 26,
                                  height: 26,
                                  fontSize: "0.7rem",
                                  bgcolor: "#f3e8ff",
                                  color: "#7e22ce",
                                  fontWeight: 700,
                                }}
                              >
                                {date.adventureLeader.name?.[0]?.toUpperCase() || "L"}
                              </Avatar>
                              <Box sx={{ minWidth: 0 }}>
                                <Typography variant="caption" sx={{ fontWeight: 600, color: "#0f172a", display: "block" }}>
                                  {date.adventureLeader.name}
                                </Typography>
                                <Typography variant="caption" sx={{ color: "#64748b", fontSize: "0.65rem" }} noWrap>
                                  {date.adventureLeader.email}
                                </Typography>
                              </Box>
                              <Button
                                size="small"
                                onClick={() => handleOpenAssignLeader(date)}
                                sx={{ textTransform: "none", fontSize: "0.68rem", py: 0, px: 0.5, ml: 0.5, minWidth: 0 }}
                              >
                                Change
                              </Button>
                            </Box>
                          ) : (
                            <Button
                              size="small"
                              variant="outlined"
                              startIcon={<PersonAddAlt1RoundedIcon sx={{ fontSize: 13 }} />}
                              onClick={() => handleOpenAssignLeader(date)}
                              sx={{
                                borderRadius: "4px",
                                textTransform: "none",
                                fontSize: "0.7rem",
                                py: 0.25,
                                px: 1,
                                color: "#475569",
                                borderColor: "#cbd5e1",
                              }}
                            >
                              Assign
                            </Button>
                          )}
                        </TableCell>

                        <TableCell align="right">
                          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 1 }}>
                            <Button
                              size="small"
                              variant="outlined"
                              onClick={() => handleViewHolds(date.startDate)}
                              sx={{
                                borderRadius: "4px",
                                textTransform: "none",
                                fontSize: "0.7rem",
                                py: 0.25,
                                px: 1,
                                color: "#475569",
                                borderColor: "#cbd5e1",
                              }}
                            >
                              Holds
                            </Button>
                            <Button
                              size="small"
                              variant="contained"
                              onClick={() => handleViewBookings(date.startDate)}
                              sx={{
                                borderRadius: "4px",
                                textTransform: "none",
                                fontSize: "0.7rem",
                                py: 0.25,
                                px: 1,
                                bgcolor: "#0f172a",
                                "&:hover": { bgcolor: "#1e293b" },
                              }}
                            >
                              Bookings
                            </Button>
                          </Box>
                        </TableCell>
                      </TableRow>
                    );
                  })}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
      </Dialog>

      {/* ======================================================== */}
      {/* 5. Modal 2: Bookings or Holds List for Departure Date */}
      {/* ======================================================== */}
      <Dialog
        open={isBookingsModalOpen && Boolean(selectedDate)}
        onClose={() => setIsBookingsModalOpen(false)}
        maxWidth="lg"
        fullWidth
        slotProps={{
          paper: { sx: { borderRadius: "6px", p: 0.5, bgcolor: "#ffffff" } },
        }}
      >
        <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", pb: 1, borderBottom: "1px solid #f1f5f9" }}>
          <Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap", mb: 0.25 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, color: "#0f172a", fontSize: "1.05rem" }}>
                {selectedTour?.name}
              </Typography>
              {selectedDate && (
                <Chip
                  label={formatDate(selectedDate)}
                  size="small"
                  sx={{ height: 20, fontSize: "0.68rem", fontWeight: 700, bgcolor: "#0f172a", color: "#ffffff", borderRadius: "4px" }}
                />
              )}
            </Box>
            <Typography variant="caption" sx={{ color: "#64748b", fontSize: "0.75rem" }}>
              Passenger manifest and inventory status for this departure date
            </Typography>
          </Box>
          <IconButton size="small" onClick={() => setIsBookingsModalOpen(false)} sx={{ color: "#64748b" }}>
            <CloseRoundedIcon fontSize="small" />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ p: { xs: 1.5, sm: 2.5 } }}>
          {/* Quick Metrics Bar */}
          <Box sx={{ display: "flex", gap: 1.5, mb: 2, flexWrap: "wrap" }}>
            <Paper
              variant="outlined"
              sx={{
                px: 1.5,
                py: 1,
                borderRadius: "6px",
                border: "1px solid #e2e8f0",
                bgcolor: "#f8fafc",
                display: "flex",
                alignItems: "center",
                gap: 1.25,
                flex: "1 1 180px",
              }}
            >
              <Avatar sx={{ width: 32, height: 32, bgcolor: "#0f172a", color: "#ffffff", borderRadius: "6px" }}>
                <PeopleOutlineRoundedIcon sx={{ fontSize: 18 }} />
              </Avatar>
              <Box>
                <Typography variant="caption" sx={{ color: "#64748b", display: "block", fontSize: "0.68rem", fontWeight: 600 }}>
                  Confirmed Guests
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 700, color: "#0f172a", fontSize: "0.95rem" }}>
                  {bookings.reduce((sum, b) => sum + (b.numberOfTravelers || 1), 0)} passengers
                </Typography>
              </Box>
            </Paper>

            <Paper
              variant="outlined"
              sx={{
                px: 1.5,
                py: 1,
                borderRadius: "6px",
                border: "1px solid #e2e8f0",
                bgcolor: "#f8fafc",
                display: "flex",
                alignItems: "center",
                gap: 1.25,
                flex: "1 1 180px",
              }}
            >
              <Avatar sx={{ width: 32, height: 32, bgcolor: "#f1f5f9", color: "#0f172a", borderRadius: "6px", border: "1px solid #e2e8f0" }}>
                <AttachMoneyRoundedIcon sx={{ fontSize: 18 }} />
              </Avatar>
              <Box>
                <Typography variant="caption" sx={{ color: "#64748b", display: "block", fontSize: "0.68rem", fontWeight: 600 }}>
                  Departure Gross Revenue
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 700, color: "#0f172a", fontSize: "0.95rem" }}>
                  ${bookings.reduce((sum, b) => sum + (b.price?.totalPrice || 0), 0).toLocaleString()}
                </Typography>
              </Box>
            </Paper>

            <Paper
              variant="outlined"
              sx={{
                px: 1.5,
                py: 1,
                borderRadius: "6px",
                border: "1px solid #e2e8f0",
                bgcolor: "#f8fafc",
                display: "flex",
                alignItems: "center",
                gap: 1.25,
                flex: "1 1 180px",
              }}
            >
              <Avatar sx={{ width: 32, height: 32, bgcolor: "#fffbeb", color: "#b45309", borderRadius: "6px", border: "1px solid #fde68a" }}>
                <AccessTimeRoundedIcon sx={{ fontSize: 18 }} />
              </Avatar>
              <Box>
                <Typography variant="caption" sx={{ color: "#64748b", display: "block", fontSize: "0.68rem", fontWeight: 600 }}>
                  Active Hold Spaces
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 700, color: "#0f172a", fontSize: "0.95rem" }}>
                  {holds.length} spaces
                </Typography>
              </Box>
            </Paper>
          </Box>

          {/* View Mode Chips */}
          <Box sx={{ display: "flex", gap: 1, mb: 1.5 }}>
            <Chip
              label={`Confirmed Bookings (${bookings.length})`}
              size="small"
              onClick={() => setBookingsTableType("bookings")}
              variant={bookingsTableType === "bookings" ? "filled" : "outlined"}
              sx={{
                borderRadius: "4px",
                fontSize: "0.75rem",
                fontWeight: 600,
                cursor: "pointer",
                bgcolor: bookingsTableType === "bookings" ? "#0f172a" : "transparent",
                color: bookingsTableType === "bookings" ? "#ffffff" : "#475569",
                borderColor: bookingsTableType === "bookings" ? "#0f172a" : "#e2e8f0",
                "&:hover": {
                  bgcolor: bookingsTableType === "bookings" ? "#1e293b" : "#f1f5f9",
                },
              }}
            />
            <Chip
              label={`Active Holds (${holds.length})`}
              size="small"
              onClick={() => setBookingsTableType("holds")}
              variant={bookingsTableType === "holds" ? "filled" : "outlined"}
              sx={{
                borderRadius: "4px",
                fontSize: "0.75rem",
                fontWeight: 600,
                cursor: "pointer",
                bgcolor: bookingsTableType === "holds" ? "#0f172a" : "transparent",
                color: bookingsTableType === "holds" ? "#ffffff" : "#475569",
                borderColor: bookingsTableType === "holds" ? "#0f172a" : "#e2e8f0",
                "&:hover": {
                  bgcolor: bookingsTableType === "holds" ? "#1e293b" : "#f1f5f9",
                },
              }}
            />
          </Box>

          {loadingBookings ? (
            <Box sx={{ py: 8, textAlign: "center" }}>
              <CircularProgress size={24} sx={{ color: "#0f172a" }} />
              <Typography variant="caption" sx={{ display: "block", mt: 1, color: "#64748b" }}>
                Gathering reservation records...
              </Typography>
            </Box>
          ) : bookingsTableType === "bookings" ? (
            bookings.length > 0 ? (
              <TableContainer sx={{ border: "1px solid #e2e8f0", borderRadius: "6px" }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Guest / Lead Traveler</TableCell>
                      <TableCell>Booking Ref</TableCell>
                      <TableCell>Travelers</TableCell>
                      <TableCell>Amount</TableCell>
                      <TableCell>Payment</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {bookings.map((b) => (
                      <TableRow key={b._id} hover>
                        {/* Guest / Lead Traveler */}
                        <TableCell>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            <Avatar
                              sx={{
                                width: 28,
                                height: 28,
                                fontSize: "0.75rem",
                                fontWeight: 700,
                                bgcolor: "#0f172a",
                                color: "#ffffff",
                              }}
                            >
                              {b.user?.name?.[0]?.toUpperCase() || "G"}
                            </Avatar>
                            <Box sx={{ minWidth: 0 }}>
                              <Typography variant="body2" sx={{ fontWeight: 600, fontSize: "0.8125rem", color: "#0f172a" }}>
                                {b.user?.name || "Guest"}
                              </Typography>
                              <Typography variant="caption" sx={{ color: "#64748b", fontSize: "0.7rem", display: "block" }}>
                                {b.user?.email || "No email"}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>

                        {/* Booking Ref */}
                        <TableCell>
                          <Chip
                            label={`#${b.bookingReference}`}
                            size="small"
                            sx={{
                              height: 20,
                              fontSize: "0.68rem",
                              fontWeight: 700,
                              borderRadius: "4px",
                              bgcolor: "#f1f5f9",
                              color: "#475569",
                              border: "1px solid #e2e8f0",
                            }}
                          />
                        </TableCell>

                        {/* Travelers */}
                        <TableCell>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                            <PeopleOutlineRoundedIcon sx={{ fontSize: 13, color: "#64748b" }} />
                            <Typography variant="body2" sx={{ fontSize: "0.8125rem", color: "#334155", fontWeight: 500 }}>
                              {b.numberOfTravelers} {b.numberOfTravelers === 1 ? "guest" : "guests"}
                            </Typography>
                          </Box>
                        </TableCell>

                        {/* Amount */}
                        <TableCell sx={{ fontWeight: 700, fontSize: "0.84rem", color: "#0f172a" }}>
                          ${b.price?.totalPrice?.toLocaleString() || 0}
                        </TableCell>

                        {/* Payment */}
                        <TableCell>
                          <Chip
                            label={b.payment?.status || "Pending"}
                            size="small"
                            variant="outlined"
                            color={b.payment?.status === "paid" ? "success" : b.payment?.status === "failed" ? "error" : "warning"}
                            sx={{ height: 18, fontSize: "0.65rem", fontWeight: 600, borderRadius: "3px", textTransform: "capitalize" }}
                          />
                        </TableCell>

                        {/* Status */}
                        <TableCell>
                          <Chip
                            label={b.status}
                            size="small"
                            variant="outlined"
                            color={b.status === "confirmed" ? "success" : b.status === "cancelled" ? "error" : "warning"}
                            sx={{ height: 18, fontSize: "0.65rem", fontWeight: 600, borderRadius: "3px", textTransform: "capitalize" }}
                          />
                        </TableCell>

                        {/* Actions */}
                        <TableCell align="right">
                          <Tooltip title="View Complete Reservation Profile" arrow>
                            <IconButton
                              size="small"
                              onClick={() => {
                                const tourData =
                                  typeof b.tour === "object" && b.tour?.name ? b.tour : selectedTour || b.tour;
                                setSelectedBookingDetails({ ...b, tour: tourData });
                              }}
                              sx={{
                                color: "#64748b",
                                p: 0.5,
                                borderRadius: "4px",
                                "&:hover": { color: "#0f172a", bgcolor: "#f1f5f9" },
                              }}
                            >
                              <VisibilityRoundedIcon sx={{ fontSize: 16 }} />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Box sx={{ py: 6, textAlign: "center" }}>
                <Typography variant="body2" sx={{ color: "#64748b" }}>
                  No guest reservations recorded for this departure date.
                </Typography>
              </Box>
            )
          ) : (
            holds.length > 0 ? (
              <TableContainer sx={{ border: "1px solid #e2e8f0", borderRadius: "6px" }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Guest</TableCell>
                      <TableCell>Email</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Expires At</TableCell>
                      <TableCell>Held On</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {holds.map((h) => (
                      <TableRow key={h._id} hover>
                        <TableCell sx={{ fontWeight: 600, fontSize: "0.8125rem", color: "#0f172a" }}>
                          {h.user?.name}
                        </TableCell>
                        <TableCell sx={{ fontSize: "0.8125rem", color: "#64748b" }}>
                          {h.user?.email}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={h.status}
                            size="small"
                            variant="outlined"
                            color={h.status === "active" ? "warning" : "default"}
                            sx={{ height: 18, fontSize: "0.65rem", fontWeight: 600, borderRadius: "3px" }}
                          />
                        </TableCell>
                        <TableCell sx={{ fontSize: "0.75rem", color: "#64748b" }}>
                          {new Date(h.expiresAt).toLocaleString()}
                        </TableCell>
                        <TableCell sx={{ fontSize: "0.75rem", color: "#64748b" }}>
                          {new Date(h.startDate).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Box sx={{ py: 6, textAlign: "center" }}>
                <Typography variant="body2" sx={{ color: "#64748b" }}>
                  No active hold spaces for this departure date.
                </Typography>
              </Box>
            )
          )}
        </DialogContent>

        <DialogActions sx={{ p: 2, pt: 1, borderTop: "1px solid #f1f5f9" }}>
          <Button
            size="small"
            variant="outlined"
            onClick={() => setIsBookingsModalOpen(false)}
            sx={{
              borderRadius: "4px",
              textTransform: "none",
              fontSize: "0.8125rem",
              color: "#475569",
              borderColor: "#cbd5e1",
            }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* ======================================================== */}
      {/* 6. Modal 3: Assign Adventure Leader (Material UI Dialog) */}
      {/* ======================================================== */}
      <Dialog
        open={isAssignLeaderModalOpen && Boolean(assigningDeparture)}
        onClose={() => {
          if (!savingLeaderAssignment) setIsAssignLeaderModalOpen(false);
        }}
        maxWidth="sm"
        fullWidth
        slotProps={{
          paper: { sx: { borderRadius: "6px", p: 0.5 } },
        }}
      >
        <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", pb: 1 }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, color: "#0f172a", fontSize: "1.05rem" }}>
              Assign Adventure Leader
            </Typography>
            <Typography variant="caption" sx={{ color: "#64748b" }}>
              {selectedTour?.name} • Departure: {assigningDeparture?.departure?.startDate ? formatDate(assigningDeparture.departure.startDate) : ""}
            </Typography>
          </Box>
          <IconButton
            size="small"
            onClick={() => {
              if (!savingLeaderAssignment) setIsAssignLeaderModalOpen(false);
            }}
            sx={{ color: "#64748b" }}
          >
            <CloseRoundedIcon fontSize="small" />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
          <Typography variant="body2" sx={{ color: "#475569", fontSize: "0.8125rem" }}>
            Select a verified team member or field guide to lead this departure date. They will be granted permissions to take roll call attendance and manage live tour updates.
          </Typography>

          <OutlinedInput
            size="small"
            fullWidth
            placeholder="Search leader by name or email..."
            value={leaderSearchTerm}
            onChange={(e) => setLeaderSearchTerm(e.target.value)}
            startAdornment={
              <InputAdornment position="start">
                <SearchRoundedIcon fontSize="small" sx={{ color: "#94a3b8" }} />
              </InputAdornment>
            }
            sx={{ borderRadius: "6px", fontSize: "0.8125rem" }}
          />

          <Box sx={{ maxHeight: 260, overflowY: "auto", display: "flex", flexDirection: "column", gap: 1 }}>
            {loadingLeaders ? (
              <Box sx={{ py: 4, textAlign: "center" }}>
                <CircularProgress size={20} sx={{ color: "#0f172a" }} />
                <Typography variant="caption" sx={{ display: "block", mt: 1, color: "#64748b" }}>
                  Loading adventure leaders...
                </Typography>
              </Box>
            ) : (
              availableLeaders
                .filter(
                  (l) =>
                    l.name?.toLowerCase().includes(leaderSearchTerm.toLowerCase()) ||
                    l.email?.toLowerCase().includes(leaderSearchTerm.toLowerCase())
                )
                .map((leader) => {
                  const isSelected = selectedLeaderIdForAssign === leader._id;

                  return (
                    <Paper
                      key={leader._id}
                      variant="outlined"
                      onClick={() => setSelectedLeaderIdForAssign(leader._id)}
                      sx={{
                        p: 1.5,
                        borderRadius: "6px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        cursor: "pointer",
                        borderColor: isSelected ? "#0f172a" : "#e2e8f0",
                        bgcolor: isSelected ? "#f8fafc" : "#ffffff",
                        "&:hover": { borderColor: "#0f172a", bgcolor: "#f8fafc" },
                      }}
                    >
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                        <Avatar
                          sx={{
                            width: 32,
                            height: 32,
                            bgcolor: "#f3e8ff",
                            color: "#7e22ce",
                            fontWeight: 700,
                            fontSize: "0.75rem",
                          }}
                        >
                          {leader.name?.[0]?.toUpperCase() || "L"}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 600, color: "#0f172a", fontSize: "0.8125rem" }}>
                            {leader.name}
                          </Typography>
                          <Typography variant="caption" sx={{ color: "#64748b", fontSize: "0.7rem" }}>
                            {leader.email}
                          </Typography>
                        </Box>
                      </Box>

                      {isSelected && (
                        <CheckCircleRoundedIcon sx={{ fontSize: 18, color: "#0f172a" }} />
                      )}
                    </Paper>
                  );
                })
            )}
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2, justifyContent: "space-between" }}>
          {assigningDeparture?.departure?.adventureLeader ? (
            <Button
              size="small"
              color="error"
              onClick={() => handleSaveLeaderAssignment(null)}
              disabled={savingLeaderAssignment}
              sx={{ textTransform: "none", fontSize: "0.75rem", fontWeight: 600 }}
            >
              Remove Leader
            </Button>
          ) : (
            <Box />
          )}

          <Box sx={{ display: "flex", gap: 1 }}>
            <Button
              size="small"
              onClick={() => setIsAssignLeaderModalOpen(false)}
              disabled={savingLeaderAssignment}
              sx={{ textTransform: "none", color: "#64748b", fontSize: "0.8125rem" }}
            >
              Cancel
            </Button>
            <Button
              size="small"
              variant="contained"
              onClick={() => handleSaveLeaderAssignment(selectedLeaderIdForAssign)}
              disabled={savingLeaderAssignment || !selectedLeaderIdForAssign}
              sx={{
                bgcolor: "#0f172a",
                borderRadius: "4px",
                textTransform: "none",
                fontSize: "0.8125rem",
                "&:hover": { bgcolor: "#1e293b" },
              }}
            >
              {savingLeaderAssignment ? "Saving..." : "Confirm Assignment"}
            </Button>
          </Box>
        </DialogActions>
      </Dialog>

      {/* ======================================================== */}
      {/* 7. Modal 4: Document Verification (Material UI Dialog) */}
      {/* ======================================================== */}
      <Dialog
        open={Boolean(docsModalBooking)}
        onClose={() => setDocsModalBooking(null)}
        maxWidth="md"
        fullWidth
        slotProps={{
          paper: { sx: { borderRadius: "6px", p: 0.5 } },
        }}
      >
        <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", pb: 1 }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, color: "#0f172a", fontSize: "1.05rem" }}>
              Travel Document Verification
            </Typography>
            <Typography variant="caption" sx={{ color: "#64748b" }}>
              #{docsModalBooking?.bookingReference} • {docsModalBooking?.tour?.name || "Tour Package"}
            </Typography>
          </Box>
          <IconButton size="small" onClick={() => setDocsModalBooking(null)} sx={{ color: "#64748b" }}>
            <CloseRoundedIcon fontSize="small" />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ p: 2 }}>
          {/* Passenger Tabs */}
          <Tabs
            value={docsActiveTab}
            onChange={(_, val) => setDocsActiveTab(val)}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              borderBottom: "1px solid #e2e8f0",
              mb: 2.5,
              "& .MuiTab-root": {
                textTransform: "none",
                fontSize: "0.8125rem",
                fontWeight: 600,
                minHeight: 40,
              },
            }}
          >
            {(docsModalBooking?.travelers || []).map((t: any, i: number) => (
              <Tab
                key={i}
                label={`${t.firstName} ${t.lastName}`}
                iconPosition="start"
                icon={
                  <Avatar
                    sx={{
                      width: 20,
                      height: 20,
                      fontSize: "0.65rem",
                      bgcolor: i === 0 ? "#0f172a" : "#0284c7",
                    }}
                  >
                    {t.firstName?.[0]?.toUpperCase() || "T"}
                  </Avatar>
                }
              />
            ))}
          </Tabs>

          {/* Document Type Cards */}
          {(() => {
            const travelerDoc = docsModalBooking?.travelerDocuments?.find(
              (d: any) => d.travelerIndex === docsActiveTab
            );

            if (!travelerDoc) {
              return (
                <Box sx={{ py: 6, textAlign: "center" }}>
                  <Typography variant="body2" sx={{ color: "#64748b" }}>
                    No travel documents submitted for this passenger yet.
                  </Typography>
                </Box>
              );
            }

            const docTypes = [
              { key: "passport", label: "Passport Document", icon: "🛂" },
              { key: "visa", label: "Visa / Entry Permit", icon: "📋" },
              { key: "medicalCertificate", label: "Medical / Vaccination Record", icon: "💉" },
              { key: "insurance", label: "Travel Insurance Policy", icon: "🛡️" },
            ];

            return (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                {docTypes.map((dt) => {
                  const doc = travelerDoc[dt.key];
                  if (!doc || !doc.url) return null;
                  const isToggling = togglingDoc === `${docsActiveTab}-${dt.key}`;

                  return (
                    <Paper
                      key={dt.key}
                      variant="outlined"
                      sx={{
                        p: 2,
                        borderRadius: "6px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        bgcolor: doc.verified ? "#f0fdf4" : "#ffffff",
                        borderColor: doc.verified ? "#bbf7d0" : "#e2e8f0",
                      }}
                    >
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                        <Typography variant="h6" sx={{ fontSize: "1.25rem" }}>
                          {dt.icon}
                        </Typography>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 600, color: "#0f172a", fontSize: "0.8125rem" }}>
                            {dt.label}
                          </Typography>
                          <Typography variant="caption" sx={{ color: "#64748b", display: "block" }}>
                            {doc.fileName}
                          </Typography>
                        </Box>
                      </Box>

                      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                        <Button
                          component="a"
                          href={doc.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          size="small"
                          startIcon={<LaunchRoundedIcon sx={{ fontSize: 14 }} />}
                          sx={{ textTransform: "none", fontSize: "0.75rem", color: "#64748b" }}
                        >
                          View File
                        </Button>

                        <Button
                          size="small"
                          variant="outlined"
                          color={doc.verified ? "success" : "inherit"}
                          disabled={isToggling}
                          onClick={() => handleToggleVerification(docsModalBooking._id, docsActiveTab, dt.key)}
                          startIcon={
                            isToggling ? (
                              <CircularProgress size={12} />
                            ) : doc.verified ? (
                              <CheckCircleRoundedIcon sx={{ fontSize: 14 }} />
                            ) : (
                              <CancelRoundedIcon sx={{ fontSize: 14 }} />
                            )
                          }
                          sx={{
                            borderRadius: "4px",
                            textTransform: "none",
                            fontSize: "0.75rem",
                            fontWeight: 600,
                            py: 0.25,
                            px: 1,
                          }}
                        >
                          {doc.verified ? "Verified" : "Mark Verified"}
                        </Button>
                      </Box>
                    </Paper>
                  );
                })}
              </Box>
            );
          })()}
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            size="small"
            onClick={() => setDocsModalBooking(null)}
            sx={{ textTransform: "none", color: "#64748b", fontSize: "0.8125rem" }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Reservation Details Dialog (Pure Material UI) */}
      {Boolean(selectedBookingDetails) && (
        <AdminBookingDetailsDialog
          open={Boolean(selectedBookingDetails)}
          booking={selectedBookingDetails}
          onClose={() => setSelectedBookingDetails(null)}
          onBookingUpdated={() => {
            fetchAllBookings();
            if (selectedDate && selectedTour) {
              fetchBookingsForDate(selectedTour._id, selectedDate);
            }
          }}
        />
      )}

      {/* Toast Feedback */}
      <Snackbar
        open={toast.open}
        autoHideDuration={4000}
        onClose={() => setToast((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          onClose={() => setToast((prev) => ({ ...prev, open: false }))}
          severity={toast.severity}
          variant="filled"
          sx={{ width: "100%", borderRadius: "6px" }}
        >
          {toast.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
