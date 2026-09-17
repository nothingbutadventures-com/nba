"use client";

import React, { useState, useEffect, useMemo } from "react";
import { api } from "@/lib/api";
import CreateHotelModal from "@/components/CreateHotelModal";

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
import Skeleton from "@mui/material/Skeleton";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogActions from "@mui/material/DialogActions";

// Material UI Icons
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import HotelRoundedIcon from "@mui/icons-material/HotelRounded";
import PlaceOutlinedIcon from "@mui/icons-material/PlaceOutlined";
import PublicRoundedIcon from "@mui/icons-material/PublicRounded";
import ClearRoundedIcon from "@mui/icons-material/ClearRounded";

interface Hotel {
  _id: string;
  name: string;
  location: string;
  destination?: {
    _id: string;
    name: string;
  } | string;
  privateRoomPrice: number;
  sharedRoomPrice: number;
  image?: string;
  isActive: boolean;
}

export default function HotelsPage() {
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedHotel, setSelectedHotel] = useState<Hotel | undefined>(undefined);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);

  // Pagination (Matching tours-management)
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Delete Confirmation Dialog
  const [deleteConfirm, setDeleteConfirm] = useState<{
    open: boolean;
    hotelId: string;
    hotelName: string;
  }>({
    open: false,
    hotelId: "",
    hotelName: "",
  });

  // Toast Notification
  const [toast, setToast] = useState<{
    open: boolean;
    message: string;
    severity: "success" | "error" | "info";
  }>({
    open: false,
    message: "",
    severity: "success",
  });

  useEffect(() => {
    fetchHotels();
  }, []);

  const fetchHotels = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${api.baseURL}/hotels`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      if (data.status === "success") {
        setHotels(data.data.hotels || []);
      }
    } catch (err) {
      console.error("Error fetching hotels:", err);
      setToast({ open: true, message: "Failed to load hotels catalog.", severity: "error" });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchHotels();
  };

  const handleOpenCreateModal = () => {
    setSelectedHotel(undefined);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (hotel: Hotel) => {
    setSelectedHotel(hotel);
    setIsModalOpen(true);
  };

  const handleHotelSaved = () => {
    fetchHotels();
    setToast({
      open: true,
      message: selectedHotel ? "Hotel updated successfully." : "New hotel created successfully.",
      severity: "success",
    });
  };

  const confirmDelete = (hotelId: string, hotelName: string) => {
    setDeleteConfirm({
      open: true,
      hotelId,
      hotelName,
    });
  };

  const handleExecuteDelete = async () => {
    const { hotelId } = deleteConfirm;
    if (!hotelId) return;

    try {
      setDeleteLoading(hotelId);
      const token = localStorage.getItem("token");
      const res = await fetch(`${api.baseURL}/hotels/${hotelId}`, {
        method: "DELETE",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (res.status === 204 || res.ok) {
        setHotels((prev) => prev.filter((h) => h._id !== hotelId));
        setToast({ open: true, message: "Hotel deleted successfully.", severity: "success" });
      } else {
        const data = await res.json();
        setToast({ open: true, message: `Failed to delete: ${data.message}`, severity: "error" });
      }
    } catch (error) {
      console.error("Error deleting hotel:", error);
      setToast({ open: true, message: "Failed to delete hotel.", severity: "error" });
    } finally {
      setDeleteLoading(null);
      setDeleteConfirm({ open: false, hotelId: "", hotelName: "" });
    }
  };

  const handleToggleActive = async (hotel: Hotel) => {
    try {
      const token = localStorage.getItem("token");
      const nextStatus = !hotel.isActive;
      const res = await fetch(`${api.baseURL}/hotels/${hotel._id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ isActive: nextStatus }),
      });

      if (res.ok) {
        setHotels((prev) =>
          prev.map((h) => (h._id === hotel._id ? { ...h, isActive: nextStatus } : h))
        );
        setToast({
          open: true,
          message: `${hotel.name} is now ${nextStatus ? "active" : "inactive"}.`,
          severity: "info",
        });
      }
    } catch (err) {
      console.error("Error toggling active status:", err);
      setToast({ open: true, message: "Could not update hotel status.", severity: "error" });
    }
  };

  // Filtered Hotels
  const filteredHotels = useMemo(() => {
    return hotels.filter((h) => {
      const q = searchQuery.toLowerCase().trim();
      const countryName =
        typeof h.destination === "object" ? h.destination?.name?.toLowerCase() || "" : "";
      const matchesSearch =
        !q ||
        h.name.toLowerCase().includes(q) ||
        h.location.toLowerCase().includes(q) ||
        countryName.includes(q);

      if (!matchesSearch) return false;

      if (statusFilter === "active" && !h.isActive) return false;
      if (statusFilter === "inactive" && h.isActive) return false;

      return true;
    });
  }, [hotels, searchQuery, statusFilter]);

  const paginatedHotels = filteredHotels.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  return (
    <Box sx={{ p: { xs: 2, sm: 3 }, bgcolor: "#f8fafc", minHeight: "100%" }}>
      {/* ======================================================== */}
      {/* 1. Top Header: Matching /admin & /tours-management */}
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
            Hotels Management
          </Typography>
          <Typography variant="body2" sx={{ color: "#64748b", fontSize: "0.8125rem", mt: 0.25 }}>
            Manage pre & post-trip extra accommodations, nightly room tariffs, and destination pairings ({hotels.length} total)
          </Typography>
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Tooltip title="Refresh hotels catalog" arrow>
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
            variant="contained"
            size="small"
            startIcon={<AddRoundedIcon sx={{ fontSize: 16 }} />}
            onClick={handleOpenCreateModal}
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
            Add Hotel
          </Button>
        </Box>
      </Box>

      {/* ======================================================== */}
      {/* 2. Filter and Search Bar: Pure MUI Matching tours-management */}
      {/* ======================================================== */}
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
          placeholder="Search by hotel name, city, or destination..."
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

        {/* Status Filter Chips: Matching tours-management */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
          <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 600, mr: 0.5 }}>
            Filter:
          </Typography>
          {[
            { label: "All Hotels", value: "all" },
            { label: "Active", value: "active" },
            { label: "Inactive", value: "inactive" },
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

      {/* ======================================================== */}
      {/* 3. Main Hotels Table: Exact same UI as tours-management */}
      {/* ======================================================== */}
      <Paper sx={{ borderRadius: "6px", border: "1px solid #e2e8f0", overflow: "hidden" }}>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Hotel</TableCell>
                <TableCell>Location</TableCell>
                <TableCell>Country / Destination</TableCell>
                <TableCell>Private Room</TableCell>
                <TableCell>Shared Room</TableCell>
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
                    <TableCell><Skeleton width={90} height={20} /></TableCell>
                    <TableCell><Skeleton width={70} height={20} /></TableCell>
                    <TableCell><Skeleton width={70} height={20} /></TableCell>
                    <TableCell><Skeleton width={60} height={20} /></TableCell>
                    <TableCell align="right"><Skeleton width={60} height={28} sx={{ ml: "auto" }} /></TableCell>
                  </TableRow>
                ))
              ) : paginatedHotels.length > 0 ? (
                paginatedHotels.map((hotel) => {
                  const countryName =
                    typeof hotel.destination === "object"
                      ? hotel.destination?.name
                      : "Assigned";

                  return (
                    <TableRow key={hotel._id} hover>
                      {/* Hotel Name & Thumbnail */}
                      <TableCell sx={{ py: 1.5 }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                          {hotel.image ? (
                            <Box
                              component="img"
                              src={hotel.image}
                              alt={hotel.name}
                              sx={{
                                width: 34,
                                height: 34,
                                borderRadius: "6px",
                                objectFit: "cover",
                                border: "1px solid #e2e8f0",
                                flexShrink: 0,
                              }}
                            />
                          ) : (
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
                              <HotelRoundedIcon sx={{ fontSize: 18 }} />
                            </Avatar>
                          )}
                          <Box sx={{ minWidth: 0 }}>
                            <Typography
                              variant="body2"
                              sx={{
                                fontWeight: 600,
                                color: "#0f172a",
                                fontSize: "0.84rem",
                              }}
                            >
                              {hotel.name}
                            </Typography>
                            <Typography
                              variant="caption"
                              noWrap
                              sx={{ color: "#64748b", display: "block", maxWidth: { xs: 180, sm: 260, md: 340 }, fontSize: "0.725rem", mt: 0.25 }}
                            >
                              Extra pre/post trip accommodation
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>

                      {/* Location */}
                      <TableCell>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                          <PlaceOutlinedIcon sx={{ fontSize: 15, color: "#64748b" }} />
                          <Typography variant="body2" sx={{ fontSize: "0.8125rem", color: "#334155" }}>
                            {hotel.location}
                          </Typography>
                        </Box>
                      </TableCell>

                      {/* Destination / Country */}
                      <TableCell>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                          <PublicRoundedIcon sx={{ fontSize: 15, color: "#64748b" }} />
                          <Typography variant="body2" sx={{ fontSize: "0.8125rem", color: "#334155" }}>
                            {countryName}
                          </Typography>
                        </Box>
                      </TableCell>

                      {/* Private Room Price */}
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 700, fontSize: "0.84rem", color: "#0f172a" }}>
                          ${hotel.privateRoomPrice}
                          <Typography component="span" variant="caption" sx={{ color: "#64748b", fontWeight: 400, ml: 0.5, fontSize: "0.725rem" }}>
                            / night
                          </Typography>
                        </Typography>
                      </TableCell>

                      {/* Shared Room Price */}
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 700, fontSize: "0.84rem", color: "#0f172a" }}>
                          ${hotel.sharedRoomPrice}
                          <Typography component="span" variant="caption" sx={{ color: "#64748b", fontWeight: 400, ml: 0.5, fontSize: "0.725rem" }}>
                            / night
                          </Typography>
                        </Typography>
                      </TableCell>

                      {/* Status */}
                      <TableCell>
                        <Tooltip title={`Click to mark as ${hotel.isActive ? "Inactive" : "Active"}`} arrow>
                          <Chip
                            label={hotel.isActive !== false ? "Active" : "Inactive"}
                            size="small"
                            variant="outlined"
                            color={hotel.isActive !== false ? "success" : "default"}
                            onClick={() => handleToggleActive(hotel)}
                            sx={{
                              height: 20,
                              fontSize: "0.68rem",
                              fontWeight: 600,
                              borderRadius: "4px",
                              cursor: "pointer",
                            }}
                          />
                        </Tooltip>
                      </TableCell>

                      {/* Actions */}
                      <TableCell align="right">
                        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 0.5 }}>
                          <Tooltip title="Edit Hotel" arrow>
                            <IconButton
                              size="small"
                              onClick={() => handleOpenEditModal(hotel)}
                              sx={{ color: "#64748b", p: 0.5, borderRadius: "4px", "&:hover": { color: "#2563eb", bgcolor: "#eff6ff" } }}
                            >
                              <EditRoundedIcon sx={{ fontSize: 16 }} />
                            </IconButton>
                          </Tooltip>

                          <Tooltip title="Delete Hotel" arrow>
                            <IconButton
                              size="small"
                              onClick={() => confirmDelete(hotel._id, hotel.name)}
                              sx={{ color: "#64748b", p: 0.5, borderRadius: "4px", "&:hover": { color: "#ef4444", bgcolor: "#fee2e2" } }}
                            >
                              <DeleteOutlineRoundedIcon sx={{ fontSize: 16 }} />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={7} sx={{ textAlign: "center", py: 6, bgcolor: "#ffffff" }}>
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
                      <HotelRoundedIcon />
                    </Avatar>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, color: "#0f172a", mb: 0.5 }}>
                      {searchQuery ? "No matching hotels found" : "No hotels in catalog yet"}
                    </Typography>
                    <Typography variant="body2" sx={{ color: "#64748b", mb: 2, fontSize: "0.8125rem" }}>
                      {searchQuery
                        ? "Try clearing filters or adjusting your search keywords."
                        : "Get started by adding your first accommodation option."}
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
                        size="small"
                        variant="contained"
                        startIcon={<AddRoundedIcon sx={{ fontSize: 16 }} />}
                        onClick={handleOpenCreateModal}
                        sx={{ bgcolor: "#0f172a", borderRadius: "4px", textTransform: "none", fontSize: "0.75rem" }}
                      >
                        Add Hotel
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Table Pagination: Pure Material UI */}
        {filteredHotels.length > 0 && (
          <TablePagination
            rowsPerPageOptions={[5, 10, 25, 50]}
            component="div"
            count={filteredHotels.length}
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

      {/* ======================================================== */}
      {/* 4. Create / Edit Hotel Modal (Material UI) */}
      {/* ======================================================== */}
      <CreateHotelModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreated={handleHotelSaved}
        hotelData={selectedHotel}
      />

      {/* ======================================================== */}
      {/* 5. Delete Confirmation Modal (Pure Material UI Dialog) */}
      {/* ======================================================== */}
      <Dialog
        open={deleteConfirm.open}
        onClose={() => {
          if (!deleteLoading) setDeleteConfirm({ open: false, hotelId: "", hotelName: "" });
        }}
        maxWidth="xs"
        fullWidth
        slotProps={{
          paper: { sx: { borderRadius: "6px", p: 0.5 } },
        }}
      >
        <DialogTitle sx={{ fontWeight: 700, color: "#0f172a", fontSize: "1rem" }}>
          Confirm Hotel Deletion
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ color: "#64748b", fontSize: "0.8125rem" }}>
            Are you sure you want to delete <strong>{deleteConfirm.hotelName}</strong>? This action will permanently remove the accommodation and cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            size="small"
            onClick={() => setDeleteConfirm({ open: false, hotelId: "", hotelName: "" })}
            disabled={Boolean(deleteLoading)}
            sx={{ color: "#64748b", textTransform: "none", fontSize: "0.8125rem" }}
          >
            Cancel
          </Button>
          <Button
            size="small"
            color="error"
            variant="contained"
            onClick={handleExecuteDelete}
            disabled={Boolean(deleteLoading)}
            sx={{ textTransform: "none", fontSize: "0.8125rem", borderRadius: "4px" }}
          >
            {deleteLoading ? "Deleting..." : "Delete Hotel"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ======================================================== */}
      {/* 6. Toast Snackbar Notification */}
      {/* ======================================================== */}
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
          sx={{ width: "100%", borderRadius: "6px", fontWeight: 500 }}
        >
          {toast.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
