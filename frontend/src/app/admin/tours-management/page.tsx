"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { api } from "@/lib/api";

// Material UI Components
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TablePagination from "@mui/material/TablePagination";
import Chip from "@mui/material/Chip";
import Avatar from "@mui/material/Avatar";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import OutlinedInput from "@mui/material/OutlinedInput";
import InputAdornment from "@mui/material/InputAdornment";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogActions from "@mui/material/DialogActions";
import Skeleton from "@mui/material/Skeleton";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import Stack from "@mui/material/Stack";
import CircularProgress from "@mui/material/CircularProgress";

// Material UI Icons
import TourRoundedIcon from "@mui/icons-material/TourRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import ClearRoundedIcon from "@mui/icons-material/ClearRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import LaunchRoundedIcon from "@mui/icons-material/LaunchRounded";
import PublicRoundedIcon from "@mui/icons-material/PublicRounded";
import AccessTimeRoundedIcon from "@mui/icons-material/AccessTimeRounded";
import StarRoundedIcon from "@mui/icons-material/StarRounded";

interface Tour {
  _id: string;
  name: string;
  slug: string;
  tourCode?: string;
  summary?: string;
  price?: any;
  duration?: any;
  difficulty?: string;
  country?: {
    _id?: string;
    name?: string;
  };
  isActive?: boolean;
  isFeatured?: boolean;
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
    if (val.amount) return parseNumeric(val.amount);
    if (val.totalPrice) return parseNumeric(val.totalPrice);
  }
  return 0;
};

const formatTourPrice = (priceVal: any): string => {
  const num = parseNumeric(priceVal);
  return num > 0 ? `$${num.toLocaleString()}` : "—";
};

const formatTourDuration = (durationVal: any): string => {
  if (!durationVal) return "—";
  if (typeof durationVal === "number") return `${durationVal} Days`;
  if (typeof durationVal === "object") {
    const days = durationVal.days || 0;
    const nights = durationVal.nights || 0;
    if (days && nights) return `${days}D / ${nights}N`;
    if (days) return `${days} Days`;
  }
  return String(durationVal);
};

export default function ToursManagementPage() {
  const [tours, setTours] = useState<Tour[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive" | "featured">("all");

  // Pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Delete Dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [tourToDelete, setTourToDelete] = useState<{ id: string; name: string } | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Feedback Snackbar
  const [toast, setToast] = useState<{ open: boolean; message: string; severity: "success" | "error" }>({
    open: false,
    message: "",
    severity: "success",
  });

  useEffect(() => {
    fetchTours();
  }, []);

  const fetchTours = async () => {
    setRefreshing(true);
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const response = await fetch(`${api.baseURL}/tours`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (response.ok) {
        const data = await response.json();
        setTours(data.data?.tours || []);
      }
    } catch (error) {
      console.error("Error fetching tours:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleOpenDeleteDialog = (tour: Tour) => {
    setTourToDelete({ id: tour._id, name: tour.name });
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!tourToDelete) return;
    setDeleteLoading(true);

    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const response = await fetch(`${api.baseURL}/tours/${tourToDelete.id}`, {
        method: "DELETE",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (response.ok) {
        setTours((prev) => prev.filter((t) => t._id !== tourToDelete.id));
        setToast({ open: true, message: `Tour "${tourToDelete.name}" deleted successfully!`, severity: "success" });
        setDeleteDialogOpen(false);
      } else {
        const errData = await response.json().catch(() => null);
        setToast({ open: true, message: errData?.message || "Failed to delete tour.", severity: "error" });
      }
    } catch (error) {
      console.error("Error deleting tour:", error);
      setToast({ open: true, message: "Network error occurred while deleting tour.", severity: "error" });
    } finally {
      setDeleteLoading(false);
    }
  };

  const filteredTours = useMemo(() => {
    return tours.filter((tour) => {
      const matchesSearch =
        tour.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tour.tourCode?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tour.country?.name?.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      if (statusFilter === "active") return tour.isActive === true;
      if (statusFilter === "inactive") return tour.isActive === false;
      if (statusFilter === "featured") return tour.isFeatured === true;
      return true;
    });
  }, [tours, searchQuery, statusFilter]);

  const paginatedTours = useMemo(() => {
    const startIndex = page * rowsPerPage;
    return filteredTours.slice(startIndex, startIndex + rowsPerPage);
  }, [filteredTours, page, rowsPerPage]);

  return (
    <Box sx={{ p: { xs: 2, sm: 3 }, bgcolor: "#f8fafc", minHeight: "100%" }}>
      {/* Top Header: Matching /admin layout structure */}
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
            Tours Management
          </Typography>
          <Typography variant="body2" sx={{ color: "#64748b", fontSize: "0.8125rem", mt: 0.25 }}>
            Manage adventure catalog, itineraries, departures, and inventory pricing ({tours.length} total tours)
          </Typography>
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Tooltip title="Refresh tours list" arrow>
            <IconButton
              size="small"
              onClick={fetchTours}
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
              px: 1.75,
              height: 32,
              "&:hover": { bgcolor: "#1e293b" },
            }}
          >
            Create Tour
          </Button>
        </Box>
      </Box>

      {/* Filter and Search Bar: Pure MUI */}
      <Paper
        sx={{
          p: 1.5,
          mb: 2.5,
          borderRadius: "6px",
          border: "1px solid #e2e8f0",
          bgcolor: "#ffffff",
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          alignItems: { xs: "stretch", md: "center" },
          justifyContent: "space-between",
          gap: 1.5,
        }}
      >
        <OutlinedInput
          size="small"
          placeholder="Search by tour name, code, or destination..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setPage(0);
          }}
          startAdornment={
            <InputAdornment position="start">
              <SearchRoundedIcon fontSize="small" sx={{ color: "#94a3b8" }} />
            </InputAdornment>
          }
          endAdornment={
            searchQuery ? (
              <InputAdornment position="end">
                <IconButton
                  size="small"
                  onClick={() => setSearchQuery("")}
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

        {/* Status Filter Chips */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
          <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 600, mr: 0.5 }}>
            Filter:
          </Typography>
          {[
            { label: "All Tours", value: "all" },
            { label: "Active", value: "active" },
            { label: "Inactive", value: "inactive" },
            { label: "Featured", value: "featured" },
          ].map((tab) => (
            <Chip
              key={tab.value}
              label={tab.label}
              size="small"
              onClick={() => {
                setStatusFilter(tab.value as any);
                setPage(0);
              }}
              variant={statusFilter === tab.value ? "filled" : "outlined"}
              sx={{
                borderRadius: "4px",
                fontSize: "0.75rem",
                fontWeight: 600,
                cursor: "pointer",
                bgcolor: statusFilter === tab.value ? "#0f172a" : "transparent",
                color: statusFilter === tab.value ? "#ffffff" : "#475569",
                borderColor: statusFilter === tab.value ? "#0f172a" : "#e2e8f0",
                "&:hover": {
                  bgcolor: statusFilter === tab.value ? "#1e293b" : "#f1f5f9",
                },
              }}
            />
          ))}
        </Box>
      </Paper>

      {/* Main Tours Table */}
      <Paper sx={{ borderRadius: "6px", border: "1px solid #e2e8f0", overflow: "hidden" }}>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Tour Package</TableCell>
                <TableCell>Destination</TableCell>
                <TableCell>Duration</TableCell>
                <TableCell>Base Price</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                [...Array(6)].map((_, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                        <Skeleton variant="rounded" width={34} height={34} sx={{ borderRadius: "6px" }} />
                        <Box sx={{ flex: 1 }}>
                          <Skeleton width="70%" height={20} />
                          <Skeleton width="40%" height={16} />
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell><Skeleton width={80} height={20} /></TableCell>
                    <TableCell><Skeleton width={60} height={20} /></TableCell>
                    <TableCell><Skeleton width={60} height={20} /></TableCell>
                    <TableCell><Skeleton width={70} height={20} /></TableCell>
                    <TableCell align="right"><Skeleton width={60} height={28} sx={{ ml: "auto" }} /></TableCell>
                  </TableRow>
                ))
              ) : paginatedTours.length > 0 ? (
                paginatedTours.map((tour) => (
                  <TableRow key={tour._id} hover>
                    {/* Tour Name & Code */}
                    <TableCell sx={{ py: 1.5 }}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                        <Avatar
                          sx={{
                            width: 34,
                            height: 34,
                            borderRadius: "6px",
                            bgcolor: "#f1f5f9",
                            color: "#0f172a",
                            border: "1px solid #e2e8f0",
                          }}
                        >
                          <TourRoundedIcon sx={{ fontSize: 18 }} />
                        </Avatar>
                        <Box sx={{ minWidth: 0 }}>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                            <Link
                              href={`/trips/${tour.slug}/${tour.tourCode || ""}`}
                              target="_blank"
                              style={{ textDecoration: "none", color: "inherit" }}
                            >
                              <Typography
                                variant="body2"
                                sx={{
                                  fontWeight: 600,
                                  color: "#0f172a",
                                  fontSize: "0.84rem",
                                  "&:hover": { color: "#2563eb", textDecoration: "underline" },
                                }}
                              >
                                {tour.name}
                              </Typography>
                            </Link>
                            {tour.tourCode && (
                              <Chip
                                label={tour.tourCode}
                                size="small"
                                sx={{ height: 18, fontSize: "0.65rem", fontWeight: 700, borderRadius: "3px", bgcolor: "#f1f5f9", color: "#475569" }}
                              />
                            )}
                          </Box>
                          {tour.summary && (
                            <Typography
                              variant="caption"
                              noWrap
                              sx={{ color: "#64748b", display: "block", maxWidth: { xs: 200, sm: 320, md: 420 }, fontSize: "0.725rem", mt: 0.25 }}
                            >
                              {tour.summary}
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    </TableCell>

                    {/* Destination / Country */}
                    <TableCell>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                        <PublicRoundedIcon sx={{ fontSize: 15, color: "#64748b" }} />
                        <Typography variant="body2" sx={{ fontSize: "0.8125rem", color: "#334155" }}>
                          {tour.country?.name || "Global"}
                        </Typography>
                      </Box>
                    </TableCell>

                    {/* Duration */}
                    <TableCell>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                        <AccessTimeRoundedIcon sx={{ fontSize: 15, color: "#64748b" }} />
                        <Typography variant="body2" sx={{ fontSize: "0.8125rem", color: "#334155" }}>
                          {formatTourDuration(tour.duration)}
                        </Typography>
                      </Box>
                    </TableCell>

                    {/* Base Price */}
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 700, fontSize: "0.84rem", color: "#0f172a" }}>
                        {formatTourPrice(tour.price)}
                      </Typography>
                    </TableCell>

                    {/* Status & Featured */}
                    <TableCell>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, flexWrap: "wrap" }}>
                        <Chip
                          label={tour.isActive !== false ? "Active" : "Inactive"}
                          size="small"
                          variant="outlined"
                          color={tour.isActive !== false ? "success" : "default"}
                          sx={{ height: 20, fontSize: "0.68rem", fontWeight: 600, borderRadius: "4px" }}
                        />
                        {tour.isFeatured && (
                          <Chip
                            icon={<StarRoundedIcon sx={{ fontSize: "13px !important" }} />}
                            label="Featured"
                            size="small"
                            variant="outlined"
                            color="warning"
                            sx={{ height: 20, fontSize: "0.68rem", fontWeight: 600, borderRadius: "4px" }}
                          />
                        )}
                      </Box>
                    </TableCell>

                    {/* Actions */}
                    <TableCell align="right">
                      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 0.5 }}>
                        <Tooltip title="View Live Tour" arrow>
                          <IconButton
                            component={Link}
                            href={`/trips/${tour.slug}/${tour.tourCode || ""}`}
                            target="_blank"
                            size="small"
                            sx={{ color: "#64748b", p: 0.5, borderRadius: "4px", "&:hover": { color: "#0f172a", bgcolor: "#f1f5f9" } }}
                          >
                            <LaunchRoundedIcon sx={{ fontSize: 16 }} />
                          </IconButton>
                        </Tooltip>

                        <Tooltip title="Edit Tour" arrow>
                          <IconButton
                            component={Link}
                            href={`/admin/tours-management/${tour._id}/edit`}
                            size="small"
                            sx={{ color: "#64748b", p: 0.5, borderRadius: "4px", "&:hover": { color: "#2563eb", bgcolor: "#eff6ff" } }}
                          >
                            <EditRoundedIcon sx={{ fontSize: 16 }} />
                          </IconButton>
                        </Tooltip>

                        <Tooltip title="Delete Tour" arrow>
                          <IconButton
                            size="small"
                            onClick={() => handleOpenDeleteDialog(tour)}
                            sx={{ color: "#64748b", p: 0.5, borderRadius: "4px", "&:hover": { color: "#ef4444", bgcolor: "#fee2e2" } }}
                          >
                            <DeleteOutlineRoundedIcon sx={{ fontSize: 16 }} />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} sx={{ textAlign: "center", py: 6, bgcolor: "#ffffff" }}>
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
                      <TourRoundedIcon />
                    </Avatar>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, color: "#0f172a", mb: 0.5 }}>
                      {searchQuery ? "No matching tours found" : "No tours in catalog yet"}
                    </Typography>
                    <Typography variant="body2" sx={{ color: "#64748b", mb: 2, fontSize: "0.8125rem" }}>
                      {searchQuery
                        ? "Try clearing filters or adjusting your search keywords."
                        : "Get started by adding your first adventure tour package."}
                    </Typography>
                    {searchQuery ? (
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => {
                          setSearchQuery("");
                          setStatusFilter("all");
                        }}
                        sx={{ borderRadius: "4px", textTransform: "none", fontSize: "0.75rem" }}
                      >
                        Clear Filters
                      </Button>
                    ) : (
                      <Button
                        component={Link}
                        href="/admin/tours-management/create"
                        size="small"
                        variant="contained"
                        startIcon={<AddRoundedIcon sx={{ fontSize: 16 }} />}
                        sx={{ bgcolor: "#0f172a", borderRadius: "4px", textTransform: "none", fontSize: "0.75rem" }}
                      >
                        Create Tour
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Table Pagination: Pure Material UI */}
        {filteredTours.length > 0 && (
          <TablePagination
            rowsPerPageOptions={[5, 10, 25, 50]}
            component="div"
            count={filteredTours.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={(_, newPage) => setPage(newPage)}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(parseInt(e.target.value, 10));
              setPage(0);
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

      {/* Delete Confirmation Modal (Pure Material UI Dialog) */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => {
          if (!deleteLoading) setDeleteDialogOpen(false);
        }}
        maxWidth="xs"
        fullWidth
        slotProps={{ paper: { sx: { p: 1, borderRadius: "6px" } } }}
      >
        <DialogTitle sx={{ fontWeight: 700, fontSize: "1.05rem", pb: 1, color: "#0f172a" }}>
          Delete Tour Package
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ color: "#64748b", fontSize: "0.875rem" }}>
            Are you sure you want to delete <strong>"{tourToDelete?.name}"</strong>? This will permanently remove the
            tour, itineraries, and departures from the platform.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => setDeleteDialogOpen(false)}
            variant="outlined"
            disabled={deleteLoading}
            sx={{ borderRadius: "4px", fontSize: "0.8125rem" }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirmDelete}
            variant="contained"
            color="error"
            disabled={deleteLoading}
            startIcon={deleteLoading ? <CircularProgress size={14} color="inherit" /> : null}
            sx={{ borderRadius: "4px", fontSize: "0.8125rem" }}
          >
            {deleteLoading ? "Deleting..." : "Delete Tour"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Action Notification Toast */}
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
          sx={{ borderRadius: "6px", fontSize: "0.8125rem" }}
        >
          {toast.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
