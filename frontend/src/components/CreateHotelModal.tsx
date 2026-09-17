"use client";

import React, { useState, useEffect } from "react";
import { api } from "@/lib/api";
import ImagePickerModal from "./ImagePickerModal";

// Material UI Components
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import CircularProgress from "@mui/material/CircularProgress";
import InputAdornment from "@mui/material/InputAdornment";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import Paper from "@mui/material/Paper";

// Material UI Icons
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import CloudUploadOutlinedIcon from "@mui/icons-material/CloudUploadOutlined";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import HotelRoundedIcon from "@mui/icons-material/HotelRounded";

interface CreateHotelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (hotel: any) => void;
  /** The country ID (destination) already selected on the tour */
  destinationId?: string;
  /** Optional hotel data to populate for editing */
  hotelData?: any;
}

export default function CreateHotelModal({
  isOpen,
  onClose,
  onCreated,
  destinationId,
  hotelData,
}: CreateHotelModalProps) {
  const [submitting, setSubmitting] = useState(false);
  const [selectedCountryId, setSelectedCountryId] = useState(destinationId || "");
  const [countries, setCountries] = useState<any[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<any>(null);
  const [loadingDestinations, setLoadingDestinations] = useState(false);
  const [showImagePicker, setShowImagePicker] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    location: "",
    privateRoomPrice: "",
    sharedRoomPrice: "",
    image: "",
  });

  const [toast, setToast] = useState<{ open: boolean; message: string; severity: "error" | "success" }>({
    open: false,
    message: "",
    severity: "error",
  });

  useEffect(() => {
    if (isOpen) {
      if (hotelData) {
        setFormData({
          name: hotelData.name || "",
          location: hotelData.location || "",
          privateRoomPrice: hotelData.privateRoomPrice?.toString() || "",
          sharedRoomPrice: hotelData.sharedRoomPrice?.toString() || "",
          image: hotelData.image || "",
        });
        setSelectedCountryId(hotelData.destination?._id || hotelData.destination || "");
      } else {
        setFormData({
          name: "",
          location: "",
          privateRoomPrice: "",
          sharedRoomPrice: "",
          image: "",
        });
        setSelectedCountryId(destinationId || "");
      }
    }
  }, [isOpen, hotelData, destinationId]);

  useEffect(() => {
    // If not provided, fetch all countries to let user select one
    if (isOpen) {
      const token = localStorage.getItem("token");
      fetch(`${api.baseURL}/countries`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.status === "success" && data.data.countries) {
            setCountries(data.data.countries);
          }
        })
        .catch((err) => console.error("Error fetching countries:", err));
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && selectedCountryId) {
      setLoadingDestinations(true);
      const token = localStorage.getItem("token");
      fetch(`${api.baseURL}/countries/${selectedCountryId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.status === "success" && data.data.country) {
            setSelectedCountry(data.data.country);
          }
        })
        .catch((err) => console.error("Error fetching country details:", err))
        .finally(() => setLoadingDestinations(false));
    } else {
      setSelectedCountry(null);
    }
  }, [isOpen, selectedCountryId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCountryId) {
      setToast({ open: true, message: "Please select a destination country", severity: "error" });
      return;
    }

    const parsedPrivatePrice = Number(formData.privateRoomPrice);
    const parsedSharedPrice = Number(formData.sharedRoomPrice);

    if (Number.isNaN(parsedPrivatePrice) || parsedPrivatePrice < 0) {
      setToast({ open: true, message: "Please enter a valid private room price", severity: "error" });
      return;
    }
    if (Number.isNaN(parsedSharedPrice) || parsedSharedPrice < 0) {
      setToast({ open: true, message: "Please enter a valid shared room price", severity: "error" });
      return;
    }

    setSubmitting(true);

    try {
      const token = localStorage.getItem("token");

      const payload: any = {
        ...formData,
        destination: selectedCountryId,
        privateRoomPrice: parsedPrivatePrice,
        sharedRoomPrice: parsedSharedPrice,
      };

      const url = hotelData
        ? `${api.baseURL}${api.endpoints.hotels.update(hotelData._id)}`
        : `${api.baseURL}${api.endpoints.hotels.create}`;

      const method = hotelData ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const data = await response.json();
        onCreated(data.data.hotel || data.data);
        onClose();
      } else {
        const data = await response.json();
        setToast({ open: true, message: data.message || "Failed to save hotel", severity: "error" });
      }
    } catch (error) {
      console.error("Error submitting hotel:", error);
      setToast({ open: true, message: "Network error submitting hotel", severity: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Dialog
        open={isOpen}
        onClose={onClose}
        fullWidth
        maxWidth="sm"
        slotProps={{
          paper: { sx: { borderRadius: "8px", p: 0.5 } },
        }}
      >
        <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", pb: 1 }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, color: "#0f172a", fontSize: "1.05rem" }}>
              {hotelData ? "Edit Hotel" : "Create New Hotel"}
            </Typography>
            <Typography variant="caption" sx={{ color: "#64748b" }}>
              Configure extra accommodation details and night rates
            </Typography>
          </Box>
          <IconButton size="small" onClick={onClose} sx={{ color: "#64748b" }}>
            <CloseRoundedIcon fontSize="small" />
          </IconButton>
        </DialogTitle>

        <form onSubmit={handleSubmit}>
          <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2.5, pt: 1.5 }}>
            {/* Hotel Name */}
            <TextField
              label="Hotel Name"
              required
              fullWidth
              size="small"
              placeholder="e.g. Grand Palace Hotel"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              slotProps={{ inputLabel: { shrink: true } }}
            />

            {/* Country Selection (Only if destinationId is not predefined) */}
            {!destinationId && (
              <TextField
                select
                label="Destination Country"
                required
                fullWidth
                size="small"
                value={selectedCountryId}
                onChange={(e) => {
                  setSelectedCountryId(e.target.value);
                  setFormData((prev) => ({ ...prev, location: "" }));
                }}
                slotProps={{ inputLabel: { shrink: true } }}
              >
                <MenuItem value="">Select Country</MenuItem>
                {countries.map((c) => (
                  <MenuItem key={c._id} value={c._id}>
                    {c.name}
                  </MenuItem>
                ))}
              </TextField>
            )}

            {/* Location (City / Stopover) */}
            <TextField
              select
              label="Location (City / Destination)"
              required
              fullWidth
              size="small"
              disabled={loadingDestinations || !selectedCountryId}
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              helperText={
                loadingDestinations
                  ? "Loading destinations..."
                  : !selectedCountryId
                  ? "Please select a country first"
                  : selectedCountry?.destinations?.length === 0
                  ? `No cities/destinations registered for ${selectedCountry?.name || "this country"}.`
                  : undefined
              }
              slotProps={{ inputLabel: { shrink: true } }}
            >
              <MenuItem value="">Select Location</MenuItem>
              {selectedCountry?.destinations?.map((d: any) => (
                <MenuItem key={d._id || d.name} value={d.name}>
                  {d.name}
                </MenuItem>
              ))}
            </TextField>

            {/* Pricing (Private & Shared Room) */}
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2 }}>
              <TextField
                label="Private Room Price (USD)"
                type="number"
                required
                size="small"
                placeholder="120"
                value={formData.privateRoomPrice}
                onChange={(e) => setFormData({ ...formData, privateRoomPrice: e.target.value })}
                slotProps={{
                  inputLabel: { shrink: true },
                  input: {
                    startAdornment: <InputAdornment position="start">$</InputAdornment>,
                    endAdornment: <InputAdornment position="end">/night</InputAdornment>,
                  },
                }}
              />
              <TextField
                label="Shared Room Price (USD)"
                type="number"
                required
                size="small"
                placeholder="60"
                value={formData.sharedRoomPrice}
                onChange={(e) => setFormData({ ...formData, sharedRoomPrice: e.target.value })}
                slotProps={{
                  inputLabel: { shrink: true },
                  input: {
                    startAdornment: <InputAdornment position="start">$</InputAdornment>,
                    endAdornment: <InputAdornment position="end">/night</InputAdornment>,
                  },
                }}
              />
            </Box>

            {/* Hotel Image */}
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 600, color: "#334155", mb: 1, fontSize: "0.8125rem" }}>
                Hotel Cover Photo
              </Typography>
              <Paper
                variant="outlined"
                sx={{
                  borderStyle: "dashed",
                  borderColor: formData.image ? "#cbd5e1" : "#cbd5e1",
                  borderRadius: "8px",
                  p: 2,
                  bgcolor: "#f8fafc",
                  textAlign: "center",
                  position: "relative",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  minHeight: 120,
                  overflow: "hidden",
                }}
              >
                {formData.image ? (
                  <Box sx={{ width: "100%", display: "flex", alignItems: "center", gap: 2 }}>
                    <Box
                      component="img"
                      src={formData.image}
                      alt="Hotel preview"
                      sx={{
                        width: 100,
                        height: 70,
                        borderRadius: "6px",
                        objectFit: "cover",
                        border: "1px solid #e2e8f0",
                      }}
                    />
                    <Box sx={{ flex: 1, textAlign: "left" }}>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: "#0f172a", fontSize: "0.8125rem" }}>
                        Selected Image
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{
                          color: "#64748b",
                          display: "block",
                          maxWidth: 240,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {formData.image}
                      </Typography>
                      <Box sx={{ display: "flex", gap: 1, mt: 1 }}>
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => setShowImagePicker(true)}
                          sx={{
                            borderRadius: "6px",
                            textTransform: "none",
                            fontSize: "0.75rem",
                            py: 0.25,
                            color: "#0f172a",
                            borderColor: "#cbd5e1",
                          }}
                        >
                          Change
                        </Button>
                        <Button
                          size="small"
                          color="error"
                          onClick={() => setFormData({ ...formData, image: "" })}
                          sx={{ textTransform: "none", fontSize: "0.75rem", py: 0.25 }}
                        >
                          Remove
                        </Button>
                      </Box>
                    </Box>
                  </Box>
                ) : (
                  <Box
                    onClick={() => setShowImagePicker(true)}
                    sx={{
                      cursor: "pointer",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: 0.75,
                      py: 1,
                      width: "100%",
                    }}
                  >
                    <CloudUploadOutlinedIcon sx={{ fontSize: 32, color: "#94a3b8" }} />
                    <Typography variant="body2" sx={{ fontWeight: 600, color: "#0f172a", fontSize: "0.8125rem" }}>
                      Select or upload hotel image
                    </Typography>
                    <Typography variant="caption" sx={{ color: "#64748b" }}>
                      Supports PNG, JPG, WebP from media library
                    </Typography>
                  </Box>
                )}
              </Paper>
            </Box>
          </DialogContent>

          <DialogActions sx={{ px: 3, pb: 2.5, pt: 1.5, borderTop: "1px solid #f1f5f9" }}>
            <Button
              type="button"
              variant="outlined"
              size="small"
              onClick={onClose}
              sx={{
                borderRadius: "6px",
                textTransform: "none",
                fontWeight: 600,
                color: "#64748b",
                borderColor: "#cbd5e1",
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              variant="contained"
              size="small"
              sx={{
                borderRadius: "6px",
                textTransform: "none",
                fontWeight: 600,
                bgcolor: "#0f172a",
                "&:hover": { bgcolor: "#1e293b" },
              }}
            >
              {submitting ? "Saving..." : hotelData ? "Save Changes" : "Create Hotel"}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Image Picker Modal */}
      <ImagePickerModal
        isOpen={showImagePicker}
        onClose={() => setShowImagePicker(false)}
        onSelect={(urls: string[]) => {
          if (urls.length > 0) {
            setFormData((prev) => ({ ...prev, image: urls[0] }));
          }
          setShowImagePicker(false);
        }}
        multiple={false}
        folder="hotel-images"
      />

      {/* Toast Alert */}
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
    </>
  );
}
