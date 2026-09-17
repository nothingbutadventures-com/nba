"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Box,
  Button,
  IconButton,
  Chip,
  Avatar,
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TableContainer,
  Tabs,
  Tab,
  Divider,
  Tooltip,
  LinearProgress,
  CircularProgress,
  TextField,
  Alert,
} from "@mui/material";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import CalendarTodayRoundedIcon from "@mui/icons-material/CalendarTodayRounded";
import PeopleOutlineRoundedIcon from "@mui/icons-material/PeopleOutlineRounded";
import AttachMoneyRoundedIcon from "@mui/icons-material/AttachMoneyRounded";
import CreditCardRoundedIcon from "@mui/icons-material/CreditCardRounded";
import AccessTimeRoundedIcon from "@mui/icons-material/AccessTimeRounded";
import PlaceOutlinedIcon from "@mui/icons-material/PlaceOutlined";
import PersonOutlineRoundedIcon from "@mui/icons-material/PersonOutlineRounded";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import PhoneOutlinedIcon from "@mui/icons-material/PhoneOutlined";
import BadgeOutlinedIcon from "@mui/icons-material/BadgeOutlined";
import CheckCircleOutlineRoundedIcon from "@mui/icons-material/CheckCircleOutlineRounded";
import CancelOutlinedIcon from "@mui/icons-material/CancelOutlined";
import EventAvailableRoundedIcon from "@mui/icons-material/EventAvailableRounded";
import { api } from "@/lib/api";

interface AdminBookingDetailsDialogProps {
  booking: any;
  open: boolean;
  onClose: () => void;
  onBookingUpdated?: () => void;
}

export default function AdminBookingDetailsDialog({
  booking,
  open,
  onClose,
  onBookingUpdated,
}: AdminBookingDetailsDialogProps) {
  const [activeTab, setActiveTab] = useState(0);
  const [cancelling, setCancelling] = useState(false);
  const [showCancelPrompt, setShowCancelPrompt] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelError, setCancelError] = useState("");
  const [updatedBooking, setUpdatedBooking] = useState<any>(null);

  // Sync state whenever booking or open state changes
  React.useEffect(() => {
    setUpdatedBooking(null);
    setShowCancelPrompt(false);
    setCancelReason("");
    setCancelError("");
    setActiveTab(0);
  }, [booking, open]);

  const currentBooking = updatedBooking || booking;

  if (!open || !currentBooking) return null;

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  const formatDateTime = (dateString?: string) => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateString;
    }
  };

  const isConfirmed = currentBooking.status === "confirmed";
  const isCancelled = currentBooking.status === "cancelled";
  const isPaid = currentBooking.payment?.status === "paid";
  const isPartial = currentBooking.payment?.status === "partially_paid";

  const primaryImage =
    currentBooking.tour?.images?.find((img: any) => img.isPrimary)?.url ||
    currentBooking.tour?.images?.[0]?.url;

  const handleAdminCancel = async () => {
    setCancelling(true);
    setCancelError("");
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${api.baseURL}/bookings/${currentBooking._id}/cancel`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ reason: cancelReason || "Cancelled by administrator" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to cancel booking");

      if (data.data?.booking) {
        setUpdatedBooking(data.data.booking);
      } else {
        setUpdatedBooking({ ...currentBooking, status: "cancelled" });
      }
      setShowCancelPrompt(false);
      if (onBookingUpdated) onBookingUpdated();
    } catch (err: any) {
      console.error("Cancel Error:", err);
      setCancelError(err.message || "Error cancelling reservation");
    } finally {
      setCancelling(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      sx={{ zIndex: 1400 }}
      slotProps={{
        backdrop: {
          sx: { zIndex: 1400 },
        },
        paper: {
          sx: {
            zIndex: 1401,
            borderRadius: "6px",
            border: "1px solid #e2e8f0",
            bgcolor: "#ffffff",
          },
        },
      }}
    >
      {/* 1. Header */}
      <DialogTitle
        sx={{
          p: 2,
          pb: 1.5,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          borderBottom: "1px solid #f1f5f9",
        }}
      >
        <Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap", mb: 0.5 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, color: "#0f172a", fontSize: "1.1rem" }}>
              Booking #{currentBooking.bookingReference}
            </Typography>
            <Chip
              label={currentBooking.status}
              size="small"
              variant="outlined"
              color={isConfirmed ? "success" : isCancelled ? "error" : "warning"}
              sx={{ height: 20, fontSize: "0.68rem", fontWeight: 700, textTransform: "capitalize", borderRadius: "4px" }}
            />
            <Chip
              label={currentBooking.payment?.status ? `Payment: ${currentBooking.payment.status}` : "Payment: Pending"}
              size="small"
              variant="outlined"
              color={isPaid ? "success" : isPartial ? "info" : "warning"}
              sx={{ height: 20, fontSize: "0.68rem", fontWeight: 600, textTransform: "capitalize", borderRadius: "4px" }}
            />
          </Box>
          <Typography variant="caption" sx={{ color: "#64748b", fontSize: "0.75rem" }}>
            Reserved on {formatDateTime(currentBooking.createdAt)} • Booked by {currentBooking.user?.name || "Guest"} ({currentBooking.user?.email || "No email"})
          </Typography>
        </Box>

        <IconButton size="small" onClick={onClose} sx={{ color: "#64748b" }}>
          <CloseRoundedIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: { xs: 1.5, sm: 2.5 } }}>
        {/* 2. Top Tour Package Snapshot Card */}
        <Paper
          variant="outlined"
          sx={{
            p: 2,
            mb: 2.5,
            borderRadius: "6px",
            border: "1px solid #e2e8f0",
            bgcolor: "#f8fafc",
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            alignItems: { xs: "flex-start", sm: "center" },
            gap: 2,
          }}
        >
          {primaryImage ? (
            <Box
              component="img"
              src={primaryImage}
              alt={currentBooking.tour?.name}
              sx={{
                width: 68,
                height: 68,
                borderRadius: "6px",
                objectFit: "cover",
                border: "1px solid #e2e8f0",
                flexShrink: 0,
              }}
            />
          ) : (
            <Avatar
              variant="rounded"
              sx={{
                width: 68,
                height: 68,
                borderRadius: "6px",
                bgcolor: "#0f172a",
                color: "#ffffff",
                fontWeight: 700,
                fontSize: "1.2rem",
                flexShrink: 0,
              }}
            >
              {currentBooking.tour?.name?.[0] || "T"}
            </Avatar>
          )}

          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap", mb: 0.5 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, color: "#0f172a", fontSize: "0.95rem" }} noWrap>
                {currentBooking.tour?.name || "Custom Itinerary"}
              </Typography>
              {currentBooking.tour?.tourCode && (
                <Chip
                  label={currentBooking.tour.tourCode}
                  size="small"
                  sx={{ height: 18, fontSize: "0.65rem", fontWeight: 700, borderRadius: "3px", bgcolor: "#e2e8f0" }}
                />
              )}
            </Box>

            <Box sx={{ display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap", color: "#64748b", fontSize: "0.75rem" }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                <CalendarTodayRoundedIcon sx={{ fontSize: 13 }} />
                <span>Starts {formatDate(currentBooking.startDate)}</span>
              </Box>

              {currentBooking.tour?.duration && (
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                  <AccessTimeRoundedIcon sx={{ fontSize: 13 }} />
                  <span>
                    {currentBooking.tour.duration.days || 1} Days / {currentBooking.tour.duration.nights || 0} Nights
                  </span>
                </Box>
              )}

              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                <PeopleOutlineRoundedIcon sx={{ fontSize: 14 }} />
                <span>{currentBooking.numberOfTravelers} {currentBooking.numberOfTravelers === 1 ? "Traveler" : "Travelers"}</span>
              </Box>

              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                <AttachMoneyRoundedIcon sx={{ fontSize: 14 }} />
                <span style={{ fontWeight: 700, color: "#0f172a" }}>
                  ${currentBooking.price?.totalPrice?.toLocaleString() || 0} {currentBooking.price?.currency || "USD"}
                </span>
              </Box>
            </Box>
          </Box>
        </Paper>

        {/* 3. Navigation Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: "#e2e8f0", mb: 2 }}>
          <Tabs
            value={activeTab}
            onChange={(_, val) => setActiveTab(val)}
            textColor="inherit"
            sx={{
              minHeight: 36,
              "& .MuiTab-root": {
                minHeight: 36,
                fontSize: "0.8125rem",
                fontWeight: 600,
                textTransform: "none",
                py: 0.5,
                px: 2,
                color: "#64748b",
                "&.Mui-selected": { color: "#0f172a", fontWeight: 700 },
              },
              "& .MuiTabs-indicator": { bgcolor: "#0f172a" },
            }}
          >
            <Tab label={`Travelers (${currentBooking.travelers?.length || 1})`} />
            <Tab label="Financials & Pricing" />
            <Tab label="Customer & Special Requests" />
          </Tabs>
        </Box>

        {/* ======================================================== */}
        {/* TAB 0: TRAVELERS */}
        {/* ======================================================== */}
        {activeTab === 0 && (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
            {(currentBooking.travelers || []).map((traveler: any, idx: number) => (
              <Paper
                key={idx}
                variant="outlined"
                sx={{
                  p: 1.75,
                  borderRadius: "6px",
                  border: "1px solid #e2e8f0",
                  bgcolor: "#ffffff",
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Avatar
                      sx={{
                        width: 28,
                        height: 28,
                        bgcolor: idx === 0 ? "#0f172a" : "#e2e8f0",
                        color: idx === 0 ? "#ffffff" : "#475569",
                        fontSize: "0.75rem",
                        fontWeight: 700,
                      }}
                    >
                      {traveler.firstName?.[0] || idx + 1}
                    </Avatar>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: "#0f172a", fontSize: "0.875rem" }}>
                      {traveler.firstName} {traveler.lastName}
                    </Typography>
                    {idx === 0 && (
                      <Chip
                        label="Lead Passenger"
                        size="small"
                        sx={{ height: 18, fontSize: "0.625rem", fontWeight: 700, bgcolor: "#f1f5f9", color: "#475569" }}
                      />
                    )}
                  </Box>
                  {traveler.nationality && (
                    <Chip
                      label={traveler.nationality}
                      size="small"
                      variant="outlined"
                      sx={{ height: 18, fontSize: "0.65rem", borderRadius: "3px" }}
                    />
                  )}
                </Box>

                <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 1, fontSize: "0.75rem", color: "#475569", mt: 1 }}>
                  {traveler.email && (
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                      <EmailOutlinedIcon sx={{ fontSize: 14, color: "#94a3b8" }} />
                      <span>{traveler.email}</span>
                    </Box>
                  )}
                  {traveler.phone && (
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                      <PhoneOutlinedIcon sx={{ fontSize: 14, color: "#94a3b8" }} />
                      <span>{traveler.phone}</span>
                    </Box>
                  )}
                  {traveler.dateOfBirth && (
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                      <EventAvailableRoundedIcon sx={{ fontSize: 14, color: "#94a3b8" }} />
                      <span>Born: {formatDate(traveler.dateOfBirth)}</span>
                    </Box>
                  )}
                  {traveler.passportNumber && (
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                      <BadgeOutlinedIcon sx={{ fontSize: 14, color: "#94a3b8" }} />
                      <span>Passport: {traveler.passportNumber}</span>
                    </Box>
                  )}
                </Box>

                {traveler.specialRequests && (
                  <Box sx={{ mt: 1.5, p: 1, bgcolor: "#f8fafc", borderRadius: "4px", border: "1px solid #f1f5f9" }}>
                    <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 600, display: "block" }}>
                      Traveler Notes:
                    </Typography>
                    <Typography variant="caption" sx={{ color: "#334155" }}>
                      {traveler.specialRequests}
                    </Typography>
                  </Box>
                )}
              </Paper>
            ))}
          </Box>
        )}

        {/* ======================================================== */}
        {/* TAB 1: FINANCIALS & PRICING */}
        {/* ======================================================== */}
        {activeTab === 1 && (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <Paper variant="outlined" sx={{ p: 2, borderRadius: "6px", border: "1px solid #e2e8f0" }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#0f172a", mb: 1.5 }}>
                Price Breakdown
              </Typography>

              <Box sx={{ display: "flex", flexDirection: "column", gap: 1, fontSize: "0.8125rem" }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", color: "#475569" }}>
                  <span>Base Tour Package ({currentBooking.numberOfTravelers} × ${currentBooking.price?.basePrice || 0})</span>
                  <span>${((currentBooking.price?.basePrice || 0) * (currentBooking.numberOfTravelers || 1)).toLocaleString()}</span>
                </Box>

                {Boolean(currentBooking.price?.discountAmount) && (
                  <Box sx={{ display: "flex", justifyContent: "space-between", color: "#059669" }}>
                    <span>Discount Applied</span>
                    <span>-${currentBooking.price?.discountAmount?.toLocaleString()}</span>
                  </Box>
                )}

                {Boolean(currentBooking.price?.taxes) && (
                  <Box sx={{ display: "flex", justifyContent: "space-between", color: "#475569" }}>
                    <span>Taxes & Regulatory Fees</span>
                    <span>${currentBooking.price?.taxes?.toLocaleString()}</span>
                  </Box>
                )}

                <Divider sx={{ my: 0.5 }} />

                <Box sx={{ display: "flex", justifyContent: "space-between", fontWeight: 700, color: "#0f172a", fontSize: "0.95rem" }}>
                  <span>Total Gross Amount</span>
                  <span>${currentBooking.price?.totalPrice?.toLocaleString() || 0} {currentBooking.price?.currency || "USD"}</span>
                </Box>
              </Box>
            </Paper>

            {/* Transactions Log */}
            <Paper variant="outlined" sx={{ borderRadius: "6px", border: "1px solid #e2e8f0", overflow: "hidden" }}>
              <Box sx={{ p: 1.5, bgcolor: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#0f172a" }}>
                  Payment Transactions
                </Typography>
              </Box>

              {currentBooking.payment?.transactions && currentBooking.payment.transactions.length > 0 ? (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Transaction ID</TableCell>
                        <TableCell>Date</TableCell>
                        <TableCell>Amount</TableCell>
                        <TableCell>Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {currentBooking.payment.transactions.map((tx: any, idx: number) => (
                        <TableRow key={idx}>
                          <TableCell sx={{ fontSize: "0.75rem", fontFamily: "monospace", color: "#334155" }}>
                            {tx.transactionId || "N/A"}
                          </TableCell>
                          <TableCell sx={{ fontSize: "0.75rem", color: "#64748b" }}>
                            {formatDateTime(tx.paymentDate || tx.createdAt)}
                          </TableCell>
                          <TableCell sx={{ fontSize: "0.75rem", fontWeight: 600, color: "#0f172a" }}>
                            ${tx.amount?.toLocaleString()} {tx.currency || "USD"}
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={tx.status || "Completed"}
                              size="small"
                              variant="outlined"
                              color={tx.status === "completed" || tx.status === "success" ? "success" : "default"}
                              sx={{ height: 18, fontSize: "0.625rem", borderRadius: "3px" }}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Box sx={{ p: 2.5, textAlign: "center" }}>
                  <Typography variant="caption" sx={{ color: "#64748b" }}>
                    No recorded transaction records found for this booking.
                  </Typography>
                </Box>
              )}
            </Paper>

            {/* Installment Plan (if applicable) */}
            {currentBooking.installmentPlan?.isActive && (
              <Paper variant="outlined" sx={{ p: 2, borderRadius: "6px", border: "1px solid #e2e8f0" }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#0f172a" }}>
                    Installment Financing Plan
                  </Typography>
                  <Chip
                    label={currentBooking.installmentPlan.frequency || "Monthly"}
                    size="small"
                    sx={{ height: 18, fontSize: "0.65rem", fontWeight: 600 }}
                  />
                </Box>

                <Box sx={{ display: "flex", justifyContent: "space-between", color: "#64748b", fontSize: "0.75rem", mb: 1 }}>
                  <span>Down Payment: ${currentBooking.installmentPlan.depositAmount || 0}</span>
                  <span>Installments: {currentBooking.installmentPlan.numberOfInstallments}</span>
                  <span>Monthly: ${currentBooking.installmentPlan.installmentAmount || 0}</span>
                </Box>
              </Paper>
            )}
          </Box>
        )}

        {/* ======================================================== */}
        {/* TAB 2: CUSTOMER & SPECIAL REQUESTS */}
        {/* ======================================================== */}
        {activeTab === 2 && (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <Paper variant="outlined" sx={{ p: 2, borderRadius: "6px", border: "1px solid #e2e8f0" }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#0f172a", mb: 1.5 }}>
                Account Information
              </Typography>
              <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 1.5, fontSize: "0.8125rem" }}>
                <Box>
                  <Typography variant="caption" sx={{ color: "#64748b", display: "block" }}>Full Name</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: "#0f172a" }}>{currentBooking.user?.name || "Guest"}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ color: "#64748b", display: "block" }}>Email Address</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: "#0f172a" }}>{currentBooking.user?.email || "N/A"}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ color: "#64748b", display: "block" }}>Contact Phone</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: "#0f172a" }}>{currentBooking.user?.phone || "N/A"}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ color: "#64748b", display: "block" }}>User Account ID</Typography>
                  <Typography variant="body2" sx={{ fontFamily: "monospace", fontSize: "0.75rem", color: "#64748b" }}>
                    {currentBooking.user?._id || "N/A"}
                  </Typography>
                </Box>
              </Box>
            </Paper>

            <Paper variant="outlined" sx={{ p: 2, borderRadius: "6px", border: "1px solid #e2e8f0" }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#0f172a", mb: 1.5 }}>
                Special Requests & Preferences
              </Typography>

              <Box sx={{ display: "flex", flexDirection: "column", gap: 1.25, fontSize: "0.8125rem" }}>
                <Box>
                  <Typography variant="caption" sx={{ color: "#64748b", display: "block", fontWeight: 600 }}>Dietary Needs</Typography>
                  <Typography variant="body2" sx={{ color: "#334155" }}>
                    {currentBooking.specialRequests?.dietary?.length
                      ? currentBooking.specialRequests.dietary.join(", ")
                      : "None specified"}
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="caption" sx={{ color: "#64748b", display: "block", fontWeight: 600 }}>Accessibility Requirements</Typography>
                  <Typography variant="body2" sx={{ color: "#334155" }}>
                    {currentBooking.specialRequests?.accessibility || "None specified"}
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="caption" sx={{ color: "#64748b", display: "block", fontWeight: 600 }}>Room Preference</Typography>
                  <Typography variant="body2" sx={{ color: "#334155" }}>
                    {currentBooking.specialRequests?.roomPreference || "Standard accommodation"}
                  </Typography>
                </Box>

                {currentBooking.specialRequests?.other && (
                  <Box>
                    <Typography variant="caption" sx={{ color: "#64748b", display: "block", fontWeight: 600 }}>Other Notes</Typography>
                    <Typography variant="body2" sx={{ color: "#334155" }}>
                      {currentBooking.specialRequests.other}
                    </Typography>
                  </Box>
                )}
              </Box>
            </Paper>
          </Box>
        )}

        {/* Cancel Prompt Area */}
        {showCancelPrompt && (
          <Paper
            variant="outlined"
            sx={{
              p: 2,
              mt: 2,
              borderRadius: "6px",
              border: "1px solid #fecaca",
              bgcolor: "#fef2f2",
            }}
          >
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#991b1b", mb: 1 }}>
              Confirm Reservation Cancellation
            </Typography>
            <Typography variant="body2" sx={{ color: "#7f1d1d", fontSize: "0.8125rem", mb: 1.5 }}>
              Are you sure you want to cancel booking #{currentBooking.bookingReference}? This will update the reservation status to Cancelled and adjust the departure inventory.
            </Typography>

            <TextField
              size="small"
              fullWidth
              placeholder="Reason for cancellation (optional)"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              sx={{ mb: 1.5, bgcolor: "#ffffff" }}
            />

            {cancelError && (
              <Alert severity="error" sx={{ mb: 1.5, py: 0.5, fontSize: "0.75rem" }}>
                {cancelError}
              </Alert>
            )}

            <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1 }}>
              <Button
                size="small"
                onClick={() => setShowCancelPrompt(false)}
                disabled={cancelling}
                sx={{ textTransform: "none", fontSize: "0.75rem" }}
              >
                Never Mind
              </Button>
              <Button
                size="small"
                variant="contained"
                color="error"
                onClick={handleAdminCancel}
                disabled={cancelling}
                sx={{ textTransform: "none", fontSize: "0.75rem" }}
              >
                {cancelling ? "Cancelling..." : "Confirm Cancellation"}
              </Button>
            </Box>
          </Paper>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2, pt: 1, borderTop: "1px solid #f1f5f9", justifyContent: "space-between" }}>
        <Box>
          {!isCancelled && !showCancelPrompt && (
            <Button
              size="small"
              color="error"
              onClick={() => setShowCancelPrompt(true)}
              sx={{ textTransform: "none", fontSize: "0.75rem" }}
            >
              Cancel Reservation
            </Button>
          )}
        </Box>

        <Button
          size="small"
          variant="outlined"
          onClick={onClose}
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
  );
}
