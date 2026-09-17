"use client";

import React, { useState } from "react";
import CreateHotelModal from "./CreateHotelModal";

// Material UI Components
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import OutlinedInput from "@mui/material/OutlinedInput";
import InputAdornment from "@mui/material/InputAdornment";
import Paper from "@mui/material/Paper";

// Material UI Icons
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import ClearRoundedIcon from "@mui/icons-material/ClearRounded";
import HotelRoundedIcon from "@mui/icons-material/HotelRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import PlaceOutlinedIcon from "@mui/icons-material/PlaceOutlined";

interface Hotel {
  _id: string;
  name: string;
  location: string;
  privateRoomPrice: number;
  sharedRoomPrice: number;
  image?: string;
  isActive: boolean;
}

interface SearchHotelModalProps {
  isOpen: boolean;
  onClose: () => void;
  hotels: Hotel[];
  onSelect: (hotelId: string) => void;
  countryId: string;
  onRefresh: () => void;
  title: string;
}

export default function SearchHotelModal({
  isOpen,
  onClose,
  hotels,
  onSelect,
  countryId,
  onRefresh,
  title,
}: SearchHotelModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);

  const filteredHotels = hotels.filter(
    (h) =>
      h.isActive &&
      (h.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        h.location.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleHotelCreated = (newHotel: any) => {
    onRefresh();
    if (newHotel && newHotel._id) {
      onSelect(newHotel._id);
    }
    setShowCreateModal(false);
    onClose();
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
              {title}
            </Typography>
            <Typography variant="caption" sx={{ color: "#64748b" }}>
              Select or search from registered extra accommodations
            </Typography>
          </Box>
          <IconButton size="small" onClick={onClose} sx={{ color: "#64748b" }}>
            <CloseRoundedIcon fontSize="small" />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ p: 2, display: "flex", flexDirection: "column", gap: 2 }}>
          {/* Search Box */}
          <OutlinedInput
            size="small"
            fullWidth
            placeholder="Search by hotel name or city..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            startAdornment={
              <InputAdornment position="start">
                <SearchRoundedIcon sx={{ color: "#94a3b8", fontSize: 18 }} />
              </InputAdornment>
            }
            endAdornment={
              searchQuery ? (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => setSearchQuery("")} sx={{ p: 0.5 }}>
                    <ClearRoundedIcon sx={{ fontSize: 16, color: "#94a3b8" }} />
                  </IconButton>
                </InputAdornment>
              ) : null
            }
            sx={{
              borderRadius: "6px",
              fontSize: "0.8125rem",
              bgcolor: "#f8fafc",
              "& fieldset": { borderColor: "#cbd5e1" },
              "&:hover fieldset": { borderColor: "#94a3b8" },
              "&.Mui-focused fieldset": { borderColor: "#0f172a" },
            }}
          />

          {/* Hotels List */}
          <Box
            sx={{
              maxHeight: 360,
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
              gap: 1.25,
              pr: 0.5,
            }}
          >
            {filteredHotels.length > 0 ? (
              filteredHotels.map((hotel) => (
                <Paper
                  key={hotel._id}
                  variant="outlined"
                  onClick={() => {
                    onSelect(hotel._id);
                    onClose();
                  }}
                  sx={{
                    p: 1.5,
                    borderRadius: "6px",
                    borderColor: "#e2e8f0",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    cursor: "pointer",
                    transition: "all 0.15s ease-in-out",
                    "&:hover": {
                      borderColor: "#0f172a",
                      bgcolor: "#f8fafc",
                      transform: "translateY(-1px)",
                    },
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                    {hotel.image ? (
                      <Box
                        component="img"
                        src={hotel.image}
                        alt={hotel.name}
                        sx={{
                          width: 42,
                          height: 42,
                          borderRadius: "6px",
                          objectFit: "cover",
                          border: "1px solid #e2e8f0",
                        }}
                      />
                    ) : (
                      <Box
                        sx={{
                          width: 42,
                          height: 42,
                          borderRadius: "6px",
                          bgcolor: "#f1f5f9",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "#64748b",
                          border: "1px solid #e2e8f0",
                        }}
                      >
                        <HotelRoundedIcon fontSize="small" />
                      </Box>
                    )}
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: "#0f172a", fontSize: "0.875rem" }}>
                        {hotel.name}
                      </Typography>
                      <Typography variant="caption" sx={{ color: "#64748b", display: "flex", alignItems: "center", gap: 0.5 }}>
                        <PlaceOutlinedIcon sx={{ fontSize: 13 }} />
                        {hotel.location}
                      </Typography>
                    </Box>
                  </Box>

                  <Box sx={{ textAlign: "right" }}>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: "#0f172a", fontSize: "0.8125rem" }}>
                      ${hotel.privateRoomPrice}
                      <Typography component="span" variant="caption" sx={{ color: "#64748b", fontWeight: 400, ml: 0.5 }}>
                        / night
                      </Typography>
                    </Typography>
                    <Typography variant="caption" sx={{ color: "#64748b", fontSize: "0.75rem", display: "block" }}>
                      Shared: ${hotel.sharedRoomPrice}
                    </Typography>
                  </Box>
                </Paper>
              ))
            ) : (
              <Box sx={{ py: 6, textAlign: "center" }}>
                <Typography variant="body2" sx={{ color: "#64748b", fontSize: "0.875rem" }}>
                  No active hotels found for this region.
                </Typography>
              </Box>
            )}
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2.5, pt: 1.5, borderTop: "1px solid #f1f5f9", justifyContent: "space-between" }}>
          <Button
            size="small"
            color="error"
            onClick={() => {
              onSelect("");
              onClose();
            }}
            sx={{
              textTransform: "none",
              fontWeight: 600,
              fontSize: "0.8125rem",
            }}
          >
            Clear Selection
          </Button>

          <Button
            size="small"
            variant="contained"
            startIcon={<AddRoundedIcon sx={{ fontSize: 16 }} />}
            onClick={() => setShowCreateModal(true)}
            sx={{
              borderRadius: "6px",
              textTransform: "none",
              fontWeight: 600,
              fontSize: "0.8125rem",
              bgcolor: "#0f172a",
              "&:hover": { bgcolor: "#1e293b" },
            }}
          >
            Create New Hotel
          </Button>
        </DialogActions>
      </Dialog>

      {showCreateModal && (
        <CreateHotelModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onCreated={handleHotelCreated}
          destinationId={countryId}
        />
      )}
    </>
  );
}
