"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import ImagePickerModal from "@/components/ImagePickerModal";

// Material UI Components
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Paper from "@mui/material/Paper";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import CircularProgress from "@mui/material/CircularProgress";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import Tooltip from "@mui/material/Tooltip";
import Divider from "@mui/material/Divider";
import Skeleton from "@mui/material/Skeleton";

// Material UI Icons
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import SaveRoundedIcon from "@mui/icons-material/SaveRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import CloudUploadOutlinedIcon from "@mui/icons-material/CloudUploadOutlined";
import ParkOutlinedIcon from "@mui/icons-material/ParkOutlined";
import HelpOutlineRoundedIcon from "@mui/icons-material/HelpOutlineRounded";
import ImageOutlinedIcon from "@mui/icons-material/ImageOutlined";

interface Continent {
  _id: string;
  id: string;
  name: string;
  countries: Country[];
}

interface Country {
  _id: string;
  id: string;
  name: string;
  code: string;
  destinations?: Destination[];
}

interface Destination {
  _id: string;
  id: string;
  name: string;
  description?: string;
}

interface FaqItem {
  question: string;
  answer: string;
}

function PlantingLocationForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("id");
  const countryQueryId = searchParams.get("countryId");

  const [countries, setCountries] = useState<Country[]>([]);
  const [destinations, setDestinations] = useState<Destination[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isImagePickerOpen, setIsImagePickerOpen] = useState(false);

  // Form State
  const [selectedCountryId, setSelectedCountryId] = useState("");
  const [selectedDestinationName, setSelectedDestinationName] = useState("");
  const [plantSpeciesString, setPlantSpeciesString] = useState("");
  const [description, setDescription] = useState("");
  const [faqs, setFaqs] = useState<FaqItem[]>([]);
  const [gallery, setGallery] = useState<string[]>([]);

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
    fetchContinentsAndFormData();
  }, []);

  const fetchContinentsAndFormData = async () => {
    try {
      setLoading(true);
      const resContinents = await fetch(`${api.baseURL}/continents`);
      const dataContinents = await resContinents.json();

      let allCountries: Country[] = [];
      if (dataContinents.status === "success" && dataContinents.data.continents) {
        dataContinents.data.continents.forEach((cont: Continent) => {
          if (cont.countries) {
            allCountries = [...allCountries, ...cont.countries];
          }
        });
        setCountries(allCountries);
      }

      if (editId) {
        const resLocation = await fetch(`${api.baseURL}/planting-locations/${editId}`);
        const dataLocation = await resLocation.json();

        if (dataLocation.status === "success" && dataLocation.data.plantingLocation) {
          const loc = dataLocation.data.plantingLocation;
          const countryId = typeof loc.country === "object" ? loc.country._id : loc.country;
          setSelectedCountryId(countryId || "");
          setSelectedDestinationName(loc.locationName || "");
          setPlantSpeciesString((loc.plantSpecies || []).join(", "));
          setDescription(loc.description || "");
          setFaqs(loc.faqs || []);
          setGallery(loc.gallery || []);

          if (countryId) {
            const matchedCountry = allCountries.find(
              (c) => c._id === countryId || c.id === countryId
            );
            if (matchedCountry) {
              setDestinations(matchedCountry.destinations || []);
            }
          }
        }
      } else if (countryQueryId) {
        setSelectedCountryId(countryQueryId);
        const matchedCountry = allCountries.find(
          (c) => c._id === countryQueryId || c.id === countryQueryId
        );
        if (matchedCountry) {
          setDestinations(matchedCountry.destinations || []);
        }
      }
    } catch (err) {
      console.error("Error loading form data:", err);
      setToast({ open: true, message: "Failed to load planting location data.", severity: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleCountryChange = (countryId: string) => {
    setSelectedCountryId(countryId);
    setSelectedDestinationName("");

    const matchedCountry = countries.find((c) => c._id === countryId || c.id === countryId);
    if (matchedCountry) {
      setDestinations(matchedCountry.destinations || []);
    } else {
      setDestinations([]);
    }
  };

  // FAQ handlers
  const handleAddFaq = () => {
    setFaqs((prev) => [...prev, { question: "", answer: "" }]);
  };

  const handleRemoveFaq = (index: number) => {
    setFaqs((prev) => prev.filter((_, i) => i !== index));
  };

  const handleFaqChange = (index: number, field: keyof FaqItem, value: string) => {
    setFaqs((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  };

  // Gallery handlers
  const handleImageSelect = (urls: string[]) => {
    setGallery((prev) => {
      const next = [...prev];
      urls.forEach((url) => {
        if (!next.includes(url)) next.push(url);
      });
      return next;
    });
  };

  const handleRemoveGalleryImage = (index: number) => {
    setGallery((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedCountryId) {
      setToast({ open: true, message: "Please select a country", severity: "error" });
      return;
    }
    if (!selectedDestinationName) {
      setToast({ open: true, message: "Please select a location destination", severity: "error" });
      return;
    }

    const plantSpecies = plantSpeciesString
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    const matchedDest = destinations.find((d) => d.name === selectedDestinationName);
    const destinationId = matchedDest ? matchedDest._id || matchedDest.id : undefined;
    const cleanFaqs = faqs.filter((faq) => faq.question.trim() && faq.answer.trim());

    const payload = {
      country: selectedCountryId,
      locationName: selectedDestinationName,
      destinationId,
      plantSpecies,
      description,
      faqs: cleanFaqs,
      gallery,
    };

    try {
      setSaving(true);
      const token = localStorage.getItem("token");
      const url = editId
        ? `${api.baseURL}/planting-locations/${editId}`
        : `${api.baseURL}/planting-locations`;
      const method = editId ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.status === "success") {
        router.push("/admin/planting-locations");
      } else {
        setToast({
          open: true,
          message: data.message || "Error saving planting location",
          severity: "error",
        });
      }
    } catch (err) {
      console.error("Error saving planting location:", err);
      setToast({ open: true, message: "Network error saving location.", severity: "error" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ p: { xs: 2, sm: 3 }, bgcolor: "#f8fafc", minHeight: "100vh" }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
          <Skeleton variant="text" width={240} height={36} />
          <Skeleton variant="rounded" width={100} height={34} sx={{ borderRadius: "6px" }} />
        </Box>
        <Paper variant="outlined" sx={{ p: 3, borderRadius: "8px" }}>
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} variant="rounded" height={60} sx={{ mb: 2, borderRadius: "6px" }} />
          ))}
        </Paper>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, sm: 3 }, bgcolor: "#f8fafc", minHeight: "100vh", pb: 10 }}>
      {/* Header Bar */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Button
            component={Link}
            href="/admin/planting-locations"
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
              "&:hover": { borderColor: "#0f172a", color: "#0f172a", bgcolor: "#f8fafc" },
            }}
          >
            Back
          </Button>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700, color: "#0f172a", fontSize: "1.25rem", lineHeight: 1.2 }}>
              {editId ? "Edit Planting Location" : "Add Planting Location"}
            </Typography>
            <Typography variant="body2" sx={{ color: "#64748b", fontSize: "0.8125rem", mt: 0.25 }}>
              Configure reforestation site metadata, location pairing, and native tree species
            </Typography>
          </Box>
        </Box>

        <Button
          onClick={handleSubmit}
          disabled={saving || !selectedCountryId || !selectedDestinationName}
          variant="contained"
          size="small"
          startIcon={
            saving ? (
              <CircularProgress size={16} sx={{ color: "#ffffff" }} />
            ) : (
              <SaveRoundedIcon sx={{ fontSize: 16 }} />
            )
          }
          sx={{
            bgcolor: "#0f172a",
            color: "#ffffff",
            fontSize: "0.8125rem",
            fontWeight: 600,
            borderRadius: "6px",
            px: 2,
            height: 34,
            textTransform: "none",
            "&:hover": { bgcolor: "#1e293b" },
          }}
        >
          {saving ? "Saving..." : editId ? "Save Changes" : "Create Location"}
        </Button>
      </Box>

      {/* Main Form Container */}
      <Box sx={{ maxWidth: 860, mx: "auto", display: "flex", flexDirection: "column", gap: 3 }}>
        {/* 1. Core Pairing Details */}
        <Paper
          variant="outlined"
          sx={{
            p: 3,
            borderRadius: "8px",
            borderColor: "#e2e8f0",
            bgcolor: "#ffffff",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
            <ParkOutlinedIcon sx={{ color: "#059669", fontSize: 20 }} />
            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: "#0f172a" }}>
              Geographic Pairing
            </Typography>
          </Box>
          <Divider sx={{ mb: 2.5 }} />

          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2.5 }}>
            {/* Country Selector */}
            <TextField
              select
              label="Country / Destination Group"
              required
              fullWidth
              size="small"
              value={selectedCountryId}
              onChange={(e) => handleCountryChange(e.target.value)}
              disabled={Boolean(editId)}
              slotProps={{ inputLabel: { shrink: true } }}
            >
              <MenuItem value="">-- Select Country --</MenuItem>
              {countries.map((c) => (
                <MenuItem key={c._id || c.id} value={c._id || c.id}>
                  {c.name} ({c.code})
                </MenuItem>
              ))}
            </TextField>

            {/* Destination Selector */}
            <TextField
              select
              label="Planting Location / Destination"
              required
              fullWidth
              size="small"
              disabled={!selectedCountryId || destinations.length === 0}
              value={selectedDestinationName}
              onChange={(e) => setSelectedDestinationName(e.target.value)}
              helperText={
                !selectedCountryId
                  ? "Select a country first"
                  : destinations.length === 0
                  ? "No destinations registered for this country. Add one in Destination Management."
                  : undefined
              }
              slotProps={{ inputLabel: { shrink: true } }}
            >
              <MenuItem value="">-- Select Location Reference --</MenuItem>
              {destinations.map((d) => (
                <MenuItem key={d._id || d.id} value={d.name}>
                  {d.name}
                </MenuItem>
              ))}
            </TextField>
          </Box>
        </Paper>

        {/* 2. Flora & Species Metadata */}
        <Paper
          variant="outlined"
          sx={{
            p: 3,
            borderRadius: "8px",
            borderColor: "#e2e8f0",
            bgcolor: "#ffffff",
          }}
        >
          <Typography variant="subtitle1" sx={{ fontWeight: 700, color: "#0f172a", mb: 0.5 }}>
            Reforestation & Botanical Specifications
          </Typography>
          <Typography variant="caption" sx={{ color: "#64748b", display: "block", mb: 2 }}>
            Specify the native species of trees and flora planted in this sanctuary
          </Typography>
          <Divider sx={{ mb: 2.5 }} />

          <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
            <TextField
              label="Plant / Tree Species"
              required
              fullWidth
              size="small"
              placeholder="e.g. Acacia, Mahogany, Cedar, Baobab"
              value={plantSpeciesString}
              onChange={(e) => setPlantSpeciesString(e.target.value)}
              helperText="Enter species names separated by commas"
              slotProps={{ inputLabel: { shrink: true } }}
            />

            <TextField
              label="Planting Project Description"
              multiline
              rows={4}
              fullWidth
              size="small"
              placeholder="Tell users about the reforestation initiative, conservation impact, soil conditions, and ecological benefits..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
            />
          </Box>
        </Paper>

        {/* 3. Media & Sanctuary Gallery */}
        <Paper
          variant="outlined"
          sx={{
            p: 3,
            borderRadius: "8px",
            borderColor: "#e2e8f0",
            bgcolor: "#ffffff",
          }}
        >
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <ImageOutlinedIcon sx={{ color: "#0284c7", fontSize: 20 }} />
              <Typography variant="subtitle1" sx={{ fontWeight: 700, color: "#0f172a" }}>
                Gallery & Visuals
              </Typography>
            </Box>
            <Button
              size="small"
              variant="outlined"
              startIcon={<CloudUploadOutlinedIcon sx={{ fontSize: 16 }} />}
              onClick={() => setIsImagePickerOpen(true)}
              sx={{
                borderRadius: "6px",
                textTransform: "none",
                fontWeight: 600,
                fontSize: "0.75rem",
                color: "#0f172a",
                borderColor: "#cbd5e1",
              }}
            >
              Select from Media
            </Button>
          </Box>
          <Divider sx={{ mb: 2.5 }} />

          {gallery.length > 0 ? (
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "repeat(2, 1fr)", sm: "repeat(4, 1fr)" },
                gap: 2,
              }}
            >
              {gallery.map((url, index) => (
                <Box
                  key={index}
                  sx={{
                    position: "relative",
                    borderRadius: "6px",
                    overflow: "hidden",
                    height: 110,
                    border: "1px solid #e2e8f0",
                    "&:hover .remove-btn": { opacity: 1 },
                  }}
                >
                  <Box
                    component="img"
                    src={url}
                    alt={`Gallery ${index + 1}`}
                    sx={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                  <IconButton
                    size="small"
                    className="remove-btn"
                    onClick={() => handleRemoveGalleryImage(index)}
                    sx={{
                      position: "absolute",
                      top: 4,
                      right: 4,
                      bgcolor: "rgba(239, 68, 68, 0.9)",
                      color: "#ffffff",
                      opacity: 0,
                      transition: "opacity 0.2s",
                      p: 0.5,
                      "&:hover": { bgcolor: "#dc2626" },
                    }}
                  >
                    <DeleteOutlineRoundedIcon sx={{ fontSize: 14 }} />
                  </IconButton>
                </Box>
              ))}
            </Box>
          ) : (
            <Paper
              variant="outlined"
              sx={{
                borderStyle: "dashed",
                borderColor: "#cbd5e1",
                p: 4,
                textAlign: "center",
                borderRadius: "6px",
                bgcolor: "#f8fafc",
              }}
            >
              <Typography variant="body2" sx={{ color: "#64748b", fontSize: "0.8125rem" }}>
                No sanctuary photos added to the gallery yet. Click &quot;Select from Media&quot; to pick images.
              </Typography>
            </Paper>
          )}
        </Paper>

        {/* 4. Frequently Asked Questions (FAQs) */}
        <Paper
          variant="outlined"
          sx={{
            p: 3,
            borderRadius: "8px",
            borderColor: "#e2e8f0",
            bgcolor: "#ffffff",
          }}
        >
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <HelpOutlineRoundedIcon sx={{ color: "#8b5cf6", fontSize: 20 }} />
              <Typography variant="subtitle1" sx={{ fontWeight: 700, color: "#0f172a" }}>
                Frequently Asked Questions
              </Typography>
            </Box>
            <Button
              size="small"
              variant="outlined"
              startIcon={<AddRoundedIcon sx={{ fontSize: 16 }} />}
              onClick={handleAddFaq}
              sx={{
                borderRadius: "6px",
                textTransform: "none",
                fontWeight: 600,
                fontSize: "0.75rem",
                color: "#0f172a",
                borderColor: "#cbd5e1",
              }}
            >
              Add FAQ
            </Button>
          </Box>
          <Divider sx={{ mb: 2.5 }} />

          {faqs.length > 0 ? (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {faqs.map((faq, index) => (
                <Paper
                  key={index}
                  variant="outlined"
                  sx={{
                    p: 2,
                    borderRadius: "6px",
                    bgcolor: "#f8fafc",
                    borderColor: "#e2e8f0",
                  }}
                >
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1.5 }}>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: "#475569", textTransform: "uppercase" }}>
                      FAQ #{index + 1}
                    </Typography>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleRemoveFaq(index)}
                      sx={{ p: 0.5 }}
                    >
                      <DeleteOutlineRoundedIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                  </Box>

                  <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                    <TextField
                      label="Question"
                      size="small"
                      fullWidth
                      placeholder="e.g. When are the trees planted?"
                      value={faq.question}
                      onChange={(e) => handleFaqChange(index, "question", e.target.value)}
                      slotProps={{ inputLabel: { shrink: true } }}
                    />
                    <TextField
                      label="Answer"
                      multiline
                      rows={2}
                      size="small"
                      fullWidth
                      placeholder="Detailed explanation..."
                      value={faq.answer}
                      onChange={(e) => handleFaqChange(index, "answer", e.target.value)}
                      slotProps={{ inputLabel: { shrink: true } }}
                    />
                  </Box>
                </Paper>
              ))}
            </Box>
          ) : (
            <Typography variant="body2" sx={{ color: "#64748b", fontSize: "0.8125rem", fontStyle: "italic" }}>
              No FAQs added yet. Click &quot;Add FAQ&quot; to provide extra information to travelers.
            </Typography>
          )}
        </Paper>
      </Box>

      {/* Image Picker Modal */}
      <ImagePickerModal
        isOpen={isImagePickerOpen}
        onClose={() => setIsImagePickerOpen(false)}
        onSelect={handleImageSelect}
        multiple={true}
        folder="planting-locations"
      />

      {/* Toast Notification */}
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

export default function Page() {
  return (
    <Suspense
      fallback={
        <Box sx={{ p: 4, textAlign: "center" }}>
          <CircularProgress size={24} sx={{ color: "#0f172a" }} />
        </Box>
      }
    >
      <PlantingLocationForm />
    </Suspense>
  );
}
