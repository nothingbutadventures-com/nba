"use client";

import React, { useState, useEffect, useMemo } from "react";
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
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogActions from "@mui/material/DialogActions";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import Skeleton from "@mui/material/Skeleton";

// Material UI Icons
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import ClearRoundedIcon from "@mui/icons-material/ClearRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import PublicRoundedIcon from "@mui/icons-material/PublicRounded";
import KeyboardArrowRightRoundedIcon from "@mui/icons-material/KeyboardArrowRightRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import CloudUploadOutlinedIcon from "@mui/icons-material/CloudUploadOutlined";
import LocationOnOutlinedIcon from "@mui/icons-material/LocationOnOutlined";
import FlagOutlinedIcon from "@mui/icons-material/FlagOutlined";
import UnfoldMoreRoundedIcon from "@mui/icons-material/UnfoldMoreRounded";
import UnfoldLessRoundedIcon from "@mui/icons-material/UnfoldLessRounded";

// --- Types ---
interface Continent {
  id: string;
  _id: string;
  name: string;
  slug: string;
  icon?: string;
  image?: string;
  description?: string;
  countries: Country[];
}

interface Country {
  id: string;
  _id: string;
  name: string;
  code: string;
  image?: string;
  continent: string;
  currency?: {
    code: string;
    name: string;
    symbol: string;
  };
  destinations?: Destination[];
}

interface Destination {
  id: string;
  _id: string;
  name: string;
  slug?: string;
  description?: string;
  image?: string;
  isActive?: boolean;
}

export default function LocationPage() {
  const [continents, setContinents] = useState<Continent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Track expanded items (sets allow multi-expand hierarchy)
  const [expandedContinents, setExpandedContinents] = useState<Set<string>>(new Set());
  const [expandedCountries, setExpandedCountries] = useState<Set<string>>(new Set());

  // Modals
  const [isContinentModalOpen, setIsContinentModalOpen] = useState(false);
  const [isCountryModalOpen, setIsCountryModalOpen] = useState(false);
  const [isDestinationModalOpen, setIsDestinationModalOpen] = useState(false);
  const [selectedContinentId, setSelectedContinentId] = useState<string | null>(null);
  const [selectedCountryId, setSelectedCountryId] = useState<string | null>(null);
  const [editingDestinationId, setEditingDestinationId] = useState<string | null>(null);

  // Form State
  const [newContinentName, setNewContinentName] = useState("");
  const [newContinentIcon, setNewContinentIcon] = useState("");
  const [showContinentIconPicker, setShowContinentIconPicker] = useState(false);
  const [submittingModal, setSubmittingModal] = useState(false);

  const [newCountryData, setNewCountryData] = useState({
    name: "",
    code: "",
    description: "",
    shortDescription: "",
    currencyCode: "",
    currencyName: "",
    currencySymbol: "",
  });

  const [newDestinationData, setNewDestinationData] = useState({
    name: "",
    description: "",
  });

  // Confirm Dialog State
  const [deleteConfirm, setDeleteConfirm] = useState<{
    open: boolean;
    title: string;
    message: string;
    onConfirm: () => Promise<void>;
  }>({
    open: false,
    title: "",
    message: "",
    onConfirm: async () => {},
  });

  // Snackbar Toast
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: "success" | "error" | "info";
  }>({
    open: false,
    message: "",
    severity: "success",
  });

  useEffect(() => {
    fetchContinents();
  }, []);

  const fetchContinents = async () => {
    setRefreshing(true);
    try {
      const res = await fetch(`${api.baseURL}/continents`);
      const data = await res.json();
      if (data.status === "success") {
        setContinents(data.data.continents || []);
      }
    } catch (err) {
      console.error("Error fetching continents:", err);
      setSnackbar({ open: true, message: "Failed to load continents.", severity: "error" });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const getCountryKey = (country: Country) => country.id || country._id;
  const getDestinationKey = (destination: Destination) => destination.id || destination._id;

  const updateCountryInState = (updatedCountry: Country) => {
    const countryId = getCountryKey(updatedCountry);
    setContinents((prev) =>
      prev.map((continent) => ({
        ...continent,
        countries: (continent.countries || []).map((country) =>
          getCountryKey(country) === countryId ? { ...country, ...updatedCountry } : country
        ),
      }))
    );
  };

  const persistCountryDestinations = async (countryId: string, destinations: Destination[]) => {
    try {
      const res = await fetch(`${api.baseURL}/countries/${countryId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ destinations }),
        credentials: "include",
      });

      const data = await res.json();
      if (data.status === "success") {
        updateCountryInState(data.data.country);
        return true;
      }
      setSnackbar({ open: true, message: data.message || "Error saving destination", severity: "error" });
      return false;
    } catch (err) {
      console.error("Error saving destination:", err);
      setSnackbar({ open: true, message: "Failed to save destination.", severity: "error" });
      return false;
    }
  };

  const handleCreateContinent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContinentName.trim()) return;
    setSubmittingModal(true);

    try {
      const res = await fetch(`${api.baseURL}/continents`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newContinentName.trim(),
          icon: newContinentIcon.trim() || undefined,
        }),
        credentials: "include",
      });
      const data = await res.json();
      if (data.status === "success") {
        setNewContinentName("");
        setNewContinentIcon("");
        setIsContinentModalOpen(false);
        setSnackbar({ open: true, message: "Continent created successfully!", severity: "success" });
        fetchContinents();
      } else {
        setSnackbar({ open: true, message: data.message || "Error creating continent", severity: "error" });
      }
    } catch (err) {
      console.error("Error creating continent:", err);
      setSnackbar({ open: true, message: "Network error creating continent.", severity: "error" });
    } finally {
      setSubmittingModal(false);
    }
  };

  const handleCreateCountry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedContinentId || !newCountryData.name.trim()) return;
    setSubmittingModal(true);

    const payload = {
      name: newCountryData.name.trim(),
      code: newCountryData.code?.trim() || undefined,
      continent: selectedContinentId,
      description: newCountryData.description,
      shortDescription: newCountryData.shortDescription,
      currency: {
        code: newCountryData.currencyCode,
        name: newCountryData.currencyName,
        symbol: newCountryData.currencySymbol,
      },
      image: "",
      language: [],
      timezone: [],
      travelRequirements: {},
      statistics: {
        totalTours: 0,
        averageRating: 0,
        totalReviews: 0,
        popularityScore: 0,
      },
      seo: {},
    };

    try {
      const res = await fetch(`${api.baseURL}/countries`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        credentials: "include",
      });
      const data = await res.json();
      if (data.status === "success") {
        setNewCountryData({
          name: "",
          code: "",
          description: "",
          shortDescription: "",
          currencyCode: "",
          currencyName: "",
          currencySymbol: "",
        });
        setIsCountryModalOpen(false);
        setSnackbar({ open: true, message: "Country created successfully!", severity: "success" });
        // Automatically expand the continent where the country was added
        setExpandedContinents((prev) => new Set([...prev, selectedContinentId]));
        fetchContinents();
      } else {
        setSnackbar({ open: true, message: data.message || "Error creating country", severity: "error" });
      }
    } catch (err) {
      console.error("Error creating country:", err);
      setSnackbar({ open: true, message: "Network error creating country.", severity: "error" });
    } finally {
      setSubmittingModal(false);
    }
  };

  const toggleContinent = (id: string) => {
    setExpandedContinents((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleCountry = (id: string) => {
    setExpandedCountries((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const expandAll = () => {
    const allContinentIds = new Set<string>();
    const allCountryIds = new Set<string>();
    continents.forEach((c) => {
      allContinentIds.add(c._id || c.id);
      (c.countries || []).forEach((country) => {
        allCountryIds.add(getCountryKey(country));
      });
    });
    setExpandedContinents(allContinentIds);
    setExpandedCountries(allCountryIds);
  };

  const collapseAll = () => {
    setExpandedContinents(new Set());
    setExpandedCountries(new Set());
  };

  const openAddCountryModal = (continentId: string) => {
    setSelectedContinentId(continentId);
    setIsCountryModalOpen(true);
  };

  const openAddDestinationModal = (countryId: string) => {
    setSelectedCountryId(countryId);
    setEditingDestinationId(null);
    setNewDestinationData({ name: "", description: "" });
    setIsDestinationModalOpen(true);
  };

  const openEditDestinationModal = (countryId: string, dest: Destination) => {
    setSelectedCountryId(countryId);
    setEditingDestinationId(getDestinationKey(dest));
    setNewDestinationData({
      name: dest.name,
      description: dest.description || "",
    });
    setIsDestinationModalOpen(true);
  };

  const closeDestinationModal = () => {
    setIsDestinationModalOpen(false);
    setEditingDestinationId(null);
    setNewDestinationData({ name: "", description: "" });
  };

  const handleSaveDestination = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCountryId || !newDestinationData.name.trim()) return;
    setSubmittingModal(true);

    let currentCountry: Country | undefined;
    for (const c of continents) {
      currentCountry = (c.countries || []).find((country) => getCountryKey(country) === selectedCountryId);
      if (currentCountry) break;
    }

    if (!currentCountry) {
      setSubmittingModal(false);
      return;
    }

    let updatedDestinations = [...(currentCountry.destinations || [])];

    if (editingDestinationId) {
      updatedDestinations = updatedDestinations.map((d) =>
        getDestinationKey(d) === editingDestinationId
          ? { ...d, name: newDestinationData.name.trim(), description: newDestinationData.description?.trim() }
          : d
      );
    } else {
      const newDest: any = {
        name: newDestinationData.name.trim(),
        description: newDestinationData.description?.trim(),
      };
      updatedDestinations.push(newDest);
    }

    const success = await persistCountryDestinations(selectedCountryId, updatedDestinations);
    setSubmittingModal(false);
    if (success) {
      setSnackbar({
        open: true,
        message: editingDestinationId ? "Destination updated successfully!" : "Destination added successfully!",
        severity: "success",
      });
      // Automatically expand country
      setExpandedCountries((prev) => new Set([...prev, selectedCountryId]));
      closeDestinationModal();
    }
  };

  const triggerDeleteDestination = (countryId: string, destToDelete: Destination) => {
    setDeleteConfirm({
      open: true,
      title: "Delete Destination",
      message: `Are you sure you want to delete "${destToDelete.name}"? This action cannot be undone.`,
      onConfirm: async () => {
        let currentCountry: Country | undefined;
        for (const c of continents) {
          currentCountry = (c.countries || []).find((country) => getCountryKey(country) === countryId);
          if (currentCountry) break;
        }
        if (!currentCountry) return;

        const updatedDestinations = (currentCountry.destinations || []).filter(
          (d) => getDestinationKey(d) !== getDestinationKey(destToDelete)
        );

        const success = await persistCountryDestinations(countryId, updatedDestinations);
        if (success) {
          setSnackbar({ open: true, message: `Destination "${destToDelete.name}" deleted.`, severity: "success" });
        }
        setDeleteConfirm((prev) => ({ ...prev, open: false }));
      },
    });
  };

  const triggerDeleteCountry = (continentId: string, countryId: string, countryName: string) => {
    setDeleteConfirm({
      open: true,
      title: "Delete Country",
      message: `Are you sure you want to delete country "${countryName}"? This will permanently delete all destinations within it.`,
      onConfirm: async () => {
        try {
          const res = await fetch(`${api.baseURL}/countries/${countryId}`, {
            method: "DELETE",
            credentials: "include",
          });

          if (res.status === 204) {
            setContinents((prev) =>
              prev.map((c) =>
                c.id === continentId || c._id === continentId
                  ? { ...c, countries: (c.countries || []).filter((country) => getCountryKey(country) !== countryId) }
                  : c
              )
            );
            setSnackbar({ open: true, message: `Country "${countryName}" deleted successfully.`, severity: "success" });
          } else {
            const data = await res.json().catch(() => null);
            setSnackbar({ open: true, message: data?.message || "Failed to delete country.", severity: "error" });
          }
        } catch (err) {
          console.error("Error deleting country:", err);
          setSnackbar({ open: true, message: "Network error while deleting country.", severity: "error" });
        } finally {
          setDeleteConfirm((prev) => ({ ...prev, open: false }));
        }
      },
    });
  };

  const triggerDeleteContinent = (continentId: string, continentName: string) => {
    setDeleteConfirm({
      open: true,
      title: "Delete Continent",
      message: `Are you sure you want to delete continent "${continentName}"? This will delete all countries and destinations inside it.`,
      onConfirm: async () => {
        try {
          const res = await fetch(`${api.baseURL}/continents/${continentId}`, {
            method: "DELETE",
            credentials: "include",
          });

          if (res.status === 204) {
            setContinents((prev) => prev.filter((c) => c.id !== continentId && c._id !== continentId));
            setSnackbar({ open: true, message: `Continent "${continentName}" deleted successfully.`, severity: "success" });
          } else {
            const data = await res.json().catch(() => null);
            setSnackbar({ open: true, message: data?.message || "Failed to delete continent.", severity: "error" });
          }
        } catch (err) {
          console.error("Error deleting continent:", err);
          setSnackbar({ open: true, message: "Network error while deleting continent.", severity: "error" });
        } finally {
          setDeleteConfirm((prev) => ({ ...prev, open: false }));
        }
      },
    });
  };

  // Hierarchy statistics
  const stats = useMemo(() => {
    let totalCountries = 0;
    let totalDestinations = 0;

    continents.forEach((continent) => {
      totalCountries += continent.countries?.length || 0;
      (continent.countries || []).forEach((country) => {
        totalDestinations += country.destinations?.length || 0;
      });
    });

    return {
      continents: continents.length,
      countries: totalCountries,
      destinations: totalDestinations,
    };
  }, [continents]);

  // Filtering
  const filteredContinents = useMemo(() => {
    if (!searchQuery.trim()) return continents;
    const q = searchQuery.toLowerCase().trim();

    return continents
      .map((continent) => {
        const continentMatches = continent.name.toLowerCase().includes(q) || continent.slug.toLowerCase().includes(q);

        const matchingCountries = (continent.countries || [])
          .map((country) => {
            const countryMatches =
              country.name.toLowerCase().includes(q) || country.code.toLowerCase().includes(q);

            const matchingDestinations = (country.destinations || []).filter(
              (dest) =>
                dest.name.toLowerCase().includes(q) ||
                (dest.description && dest.description.toLowerCase().includes(q))
            );

            if (countryMatches || matchingDestinations.length > 0) {
              return {
                ...country,
                destinations: countryMatches ? country.destinations : matchingDestinations,
              };
            }
            return null;
          })
          .filter(Boolean) as Country[];

        if (continentMatches || matchingCountries.length > 0) {
          return {
            ...continent,
            countries: continentMatches ? continent.countries : matchingCountries,
          };
        }
        return null;
      })
      .filter(Boolean) as Continent[];
  }, [continents, searchQuery]);

  // If searching, auto-expand results
  useEffect(() => {
    if (searchQuery.trim()) {
      const contIds = new Set<string>();
      const countryIds = new Set<string>();
      filteredContinents.forEach((c) => {
        contIds.add(c._id || c.id);
        (c.countries || []).forEach((country) => {
          countryIds.add(getCountryKey(country));
        });
      });
      setExpandedContinents(contIds);
      setExpandedCountries(countryIds);
    }
  }, [searchQuery, filteredContinents]);

  const areAllExpanded =
    continents.length > 0 &&
    expandedContinents.size >= continents.length &&
    expandedCountries.size >= stats.countries;

  return (
    <Box sx={{ p: { xs: 2, sm: 3 }, bgcolor: "#f8fafc", minHeight: "100%" }}>
      {/* ======================================================== */}
      {/* 1. Top Header: Exact same style as tours-management */}
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
            Destination Management
          </Typography>
          <Typography variant="body2" sx={{ color: "#64748b", fontSize: "0.8125rem", mt: 0.25 }}>
            Configure hierarchical geography: continents → countries → destinations ({stats.continents} continents, {stats.countries} countries, {stats.destinations} destinations)
          </Typography>
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Tooltip title="Refresh geography catalog" arrow>
            <IconButton
              size="small"
              onClick={fetchContinents}
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
            onClick={() => setIsContinentModalOpen(true)}
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
            Add Continent
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
          placeholder="Search continent, country, or destination..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
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

        {/* Hierarchy Stats and Expand/Collapse Toggle */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
          <Chip
            label={`Continents (${stats.continents})`}
            size="small"
            sx={{
              borderRadius: "4px",
              fontSize: "0.75rem",
              fontWeight: 600,
              bgcolor: "#f1f5f9",
              color: "#0f172a",
              border: "1px solid #e2e8f0",
            }}
          />
          <Chip
            label={`Countries (${stats.countries})`}
            size="small"
            sx={{
              borderRadius: "4px",
              fontSize: "0.75rem",
              fontWeight: 600,
              bgcolor: "#f1f5f9",
              color: "#0f172a",
              border: "1px solid #e2e8f0",
            }}
          />
          <Chip
            label={`Destinations (${stats.destinations})`}
            size="small"
            sx={{
              borderRadius: "4px",
              fontSize: "0.75rem",
              fontWeight: 600,
              bgcolor: "#f1f5f9",
              color: "#0f172a",
              border: "1px solid #e2e8f0",
            }}
          />

          <Button
            size="small"
            variant="outlined"
            startIcon={
              areAllExpanded ? (
                <UnfoldLessRoundedIcon sx={{ fontSize: 16 }} />
              ) : (
                <UnfoldMoreRoundedIcon sx={{ fontSize: 16 }} />
              )
            }
            onClick={areAllExpanded ? collapseAll : expandAll}
            sx={{
              borderRadius: "4px",
              textTransform: "none",
              fontSize: "0.75rem",
              color: "#475569",
              borderColor: "#e2e8f0",
              height: 24,
              py: 0,
              px: 1,
              "&:hover": { bgcolor: "#f8fafc", borderColor: "#cbd5e1", color: "#0f172a" },
            }}
          >
            {areAllExpanded ? "Collapse All" : "Expand All"}
          </Button>
        </Box>
      </Paper>

      {/* ======================================================== */}
      {/* 3. Main Expandable Hierarchy Table: Exact UI as tours-management */}
      {/* ======================================================== */}
      <Paper sx={{ borderRadius: "6px", border: "1px solid #e2e8f0", overflow: "hidden" }}>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Region / Geography</TableCell>
                <TableCell>Level</TableCell>
                <TableCell>Code / Slug</TableCell>
                <TableCell>Sub-Entities</TableCell>
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
                    <TableCell><Skeleton width={70} height={20} /></TableCell>
                    <TableCell><Skeleton width={80} height={20} /></TableCell>
                    <TableCell><Skeleton width={90} height={20} /></TableCell>
                    <TableCell align="right"><Skeleton width={80} height={28} sx={{ ml: "auto" }} /></TableCell>
                  </TableRow>
                ))
              ) : filteredContinents.length > 0 ? (
                filteredContinents.map((continent) => {
                  const contId = continent._id || continent.id;
                  const isContinentExpanded = expandedContinents.has(contId);
                  const countryCount = continent.countries?.length || 0;

                  return (
                    <React.Fragment key={contId}>
                      {/* ======================================== */}
                      {/* LEVEL 0: Continent Row */}
                      {/* ======================================== */}
                      <TableRow
                        hover
                        sx={{
                          bgcolor: isContinentExpanded ? "#f8fafc" : "#ffffff",
                          "& td": { borderBottom: isContinentExpanded ? "1px solid #e2e8f0" : undefined },
                        }}
                      >
                        {/* Name & Chevron */}
                        <TableCell sx={{ py: 1.5 }}>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            <IconButton
                              size="small"
                              onClick={() => toggleContinent(contId)}
                              sx={{
                                color: "#64748b",
                                p: 0.5,
                                borderRadius: "4px",
                                transform: isContinentExpanded ? "rotate(90deg)" : "none",
                                transition: "transform 0.2s ease-in-out",
                                "&:hover": { bgcolor: "#f1f5f9", color: "#0f172a" },
                              }}
                            >
                              <KeyboardArrowRightRoundedIcon fontSize="small" />
                            </IconButton>

                            {continent.icon ? (
                              <Box
                                component="img"
                                src={continent.icon}
                                alt={continent.name}
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
                                <PublicRoundedIcon sx={{ fontSize: 18 }} />
                              </Avatar>
                            )}

                            <Box sx={{ minWidth: 0 }}>
                              <Typography
                                variant="body2"
                                sx={{
                                  fontWeight: 700,
                                  color: "#0f172a",
                                  fontSize: "0.85rem",
                                }}
                              >
                                {continent.name}
                              </Typography>
                              <Typography
                                variant="caption"
                                noWrap
                                sx={{ color: "#64748b", display: "block", fontSize: "0.725rem", mt: 0.25 }}
                              >
                                Continental Region
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>

                        {/* Level Chip */}
                        <TableCell>
                          <Chip
                            label="Continent"
                            size="small"
                            sx={{
                              height: 20,
                              fontSize: "0.68rem",
                              fontWeight: 600,
                              borderRadius: "4px",
                              bgcolor: "#f1f5f9",
                              color: "#0f172a",
                              border: "1px solid #e2e8f0",
                            }}
                          />
                        </TableCell>

                        {/* Slug */}
                        <TableCell>
                          <Chip
                            label={continent.slug}
                            size="small"
                            variant="outlined"
                            sx={{
                              height: 20,
                              fontSize: "0.68rem",
                              fontWeight: 500,
                              borderRadius: "4px",
                              borderColor: "#e2e8f0",
                              color: "#475569",
                            }}
                          />
                        </TableCell>

                        {/* Sub-entities */}
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 600, fontSize: "0.8125rem", color: "#334155" }}>
                            {countryCount} {countryCount === 1 ? "Country" : "Countries"}
                          </Typography>
                        </TableCell>

                        {/* Actions */}
                        <TableCell align="right">
                          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 0.5 }}>
                            <Tooltip title="Add Country to Continent" arrow>
                              <Button
                                size="small"
                                startIcon={<AddRoundedIcon sx={{ fontSize: 14 }} />}
                                onClick={() => openAddCountryModal(contId)}
                                sx={{
                                  textTransform: "none",
                                  fontSize: "0.75rem",
                                  fontWeight: 600,
                                  py: 0.25,
                                  px: 1,
                                  borderRadius: "4px",
                                  color: "#0f172a",
                                  border: "1px solid #e2e8f0",
                                  bgcolor: "#ffffff",
                                  "&:hover": { bgcolor: "#f8fafc", borderColor: "#cbd5e1" },
                                }}
                              >
                                Add Country
                              </Button>
                            </Tooltip>

                            <Tooltip title="Edit Continent Details" arrow>
                              <IconButton
                                component={Link}
                                href={`/admin/location/continent/${contId}`}
                                size="small"
                                sx={{ color: "#64748b", p: 0.5, borderRadius: "4px", "&:hover": { color: "#2563eb", bgcolor: "#eff6ff" } }}
                              >
                                <EditRoundedIcon sx={{ fontSize: 16 }} />
                              </IconButton>
                            </Tooltip>

                            <Tooltip title="Delete Continent" arrow>
                              <IconButton
                                size="small"
                                onClick={() => triggerDeleteContinent(contId, continent.name)}
                                sx={{ color: "#64748b", p: 0.5, borderRadius: "4px", "&:hover": { color: "#ef4444", bgcolor: "#fee2e2" } }}
                              >
                                <DeleteOutlineRoundedIcon sx={{ fontSize: 16 }} />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </TableCell>
                      </TableRow>

                      {/* ======================================== */}
                      {/* LEVEL 1: Countries (When continent is expanded) */}
                      {/* ======================================== */}
                      {isContinentExpanded && (
                        continent.countries && continent.countries.length > 0 ? (
                          continent.countries.map((country) => {
                            const countryId = getCountryKey(country);
                            const isCountryExpanded = expandedCountries.has(countryId);
                            const destCount = country.destinations?.length || 0;

                            return (
                              <React.Fragment key={countryId}>
                                <TableRow
                                  hover
                                  sx={{
                                    bgcolor: "#fcfcfd",
                                    "& td": { borderBottom: "1px solid #f1f5f9" },
                                  }}
                                >
                                  {/* Country Name with 1-level indent */}
                                  <TableCell sx={{ py: 1.25 }}>
                                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, pl: 3.5 }}>
                                      <IconButton
                                        size="small"
                                        onClick={() => toggleCountry(countryId)}
                                        sx={{
                                          color: "#94a3b8",
                                          p: 0.5,
                                          borderRadius: "4px",
                                          transform: isCountryExpanded ? "rotate(90deg)" : "none",
                                          transition: "transform 0.2s ease-in-out",
                                          "&:hover": { bgcolor: "#f1f5f9", color: "#0f172a" },
                                        }}
                                      >
                                        <KeyboardArrowRightRoundedIcon sx={{ fontSize: 17 }} />
                                      </IconButton>

                                      <Avatar
                                        sx={{
                                          width: 28,
                                          height: 28,
                                          borderRadius: "4px",
                                          bgcolor: "#f1f5f9",
                                          color: "#0284c7",
                                          border: "1px solid #e2e8f0",
                                          fontSize: "0.75rem",
                                        }}
                                      >
                                        <FlagOutlinedIcon sx={{ fontSize: 15 }} />
                                      </Avatar>

                                      <Box sx={{ minWidth: 0 }}>
                                        <Typography
                                          variant="body2"
                                          sx={{
                                            fontWeight: 600,
                                            color: "#1e293b",
                                            fontSize: "0.8125rem",
                                          }}
                                        >
                                          {country.name}
                                        </Typography>
                                        {country.currency?.code && (
                                          <Typography
                                            variant="caption"
                                            noWrap
                                            sx={{ color: "#94a3b8", display: "block", fontSize: "0.7rem" }}
                                          >
                                            Currency: {country.currency.code} ({country.currency.symbol || "$"})
                                          </Typography>
                                        )}
                                      </Box>
                                    </Box>
                                  </TableCell>

                                  {/* Level Chip */}
                                  <TableCell>
                                    <Chip
                                      label="Country"
                                      size="small"
                                      variant="outlined"
                                      color="primary"
                                      sx={{
                                        height: 18,
                                        fontSize: "0.65rem",
                                        fontWeight: 600,
                                        borderRadius: "3px",
                                      }}
                                    />
                                  </TableCell>

                                  {/* Code */}
                                  <TableCell>
                                    <Chip
                                      label={country.code || "—"}
                                      size="small"
                                      sx={{
                                        height: 18,
                                        fontSize: "0.65rem",
                                        fontWeight: 700,
                                        borderRadius: "3px",
                                        bgcolor: "#f1f5f9",
                                        color: "#475569",
                                      }}
                                    />
                                  </TableCell>

                                  {/* Destinations Count */}
                                  <TableCell>
                                    <Typography variant="caption" sx={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 500 }}>
                                      {destCount} {destCount === 1 ? "Destination" : "Destinations"}
                                    </Typography>
                                  </TableCell>

                                  {/* Actions */}
                                  <TableCell align="right">
                                    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 0.5 }}>
                                      <Tooltip title="Add Destination / Stopover" arrow>
                                        <Button
                                          size="small"
                                          startIcon={<AddRoundedIcon sx={{ fontSize: 13 }} />}
                                          onClick={() => openAddDestinationModal(countryId)}
                                          sx={{
                                            textTransform: "none",
                                            fontSize: "0.7rem",
                                            fontWeight: 600,
                                            py: 0.15,
                                            px: 0.75,
                                            borderRadius: "3px",
                                            color: "#475569",
                                            border: "1px solid #e2e8f0",
                                            bgcolor: "#ffffff",
                                            "&:hover": { bgcolor: "#f8fafc", color: "#0f172a" },
                                          }}
                                        >
                                          Add Dest
                                        </Button>
                                      </Tooltip>

                                      <Tooltip title="Edit Country Details" arrow>
                                        <IconButton
                                          component={Link}
                                          href={`/admin/location/country/${countryId}`}
                                          size="small"
                                          sx={{ color: "#64748b", p: 0.5, borderRadius: "4px", "&:hover": { color: "#2563eb", bgcolor: "#eff6ff" } }}
                                        >
                                          <EditRoundedIcon sx={{ fontSize: 15 }} />
                                        </IconButton>
                                      </Tooltip>

                                      <Tooltip title="Delete Country" arrow>
                                        <IconButton
                                          size="small"
                                          onClick={() => triggerDeleteCountry(contId, countryId, country.name)}
                                          sx={{ color: "#64748b", p: 0.5, borderRadius: "4px", "&:hover": { color: "#ef4444", bgcolor: "#fee2e2" } }}
                                        >
                                          <DeleteOutlineRoundedIcon sx={{ fontSize: 15 }} />
                                        </IconButton>
                                      </Tooltip>
                                    </Box>
                                  </TableCell>
                                </TableRow>

                                {/* ======================================== */}
                                {/* LEVEL 2: Destinations (When country is expanded) */}
                                {/* ======================================== */}
                                {isCountryExpanded && (
                                  country.destinations && country.destinations.length > 0 ? (
                                    country.destinations.map((dest) => {
                                      const destKey = getDestinationKey(dest);

                                      return (
                                        <TableRow
                                          key={destKey}
                                          hover
                                          sx={{
                                            bgcolor: "#f8fafc",
                                            "& td": { borderBottom: "1px solid #f1f5f9" },
                                          }}
                                        >
                                          {/* Destination with 2-level indent */}
                                          <TableCell sx={{ py: 1 }}>
                                            <Box sx={{ display: "flex", alignItems: "center", gap: 1, pl: 7.5 }}>
                                              <LocationOnOutlinedIcon sx={{ fontSize: 14, color: "#94a3b8" }} />
                                              <Box sx={{ minWidth: 0 }}>
                                                <Typography
                                                  variant="body2"
                                                  sx={{
                                                    fontWeight: 500,
                                                    color: "#334155",
                                                    fontSize: "0.78rem",
                                                  }}
                                                >
                                                  {dest.name}
                                                </Typography>
                                                {dest.description && (
                                                  <Typography
                                                    variant="caption"
                                                    noWrap
                                                    sx={{ color: "#94a3b8", display: "block", fontSize: "0.68rem", maxWidth: 280 }}
                                                  >
                                                    {dest.description}
                                                  </Typography>
                                                )}
                                              </Box>
                                            </Box>
                                          </TableCell>

                                          {/* Level Chip */}
                                          <TableCell>
                                            <Chip
                                              label="Destination"
                                              size="small"
                                              variant="outlined"
                                              sx={{
                                                height: 18,
                                                fontSize: "0.63rem",
                                                fontWeight: 500,
                                                borderRadius: "3px",
                                                borderColor: "#cbd5e1",
                                                color: "#64748b",
                                              }}
                                            />
                                          </TableCell>

                                          {/* Slug */}
                                          <TableCell>
                                            <Typography variant="caption" sx={{ color: "#94a3b8", fontSize: "0.7rem" }}>
                                              {dest.slug || "—"}
                                            </Typography>
                                          </TableCell>

                                          {/* Category */}
                                          <TableCell>
                                            <Typography variant="caption" sx={{ color: "#64748b", fontSize: "0.7rem" }}>
                                              Regional Stopover
                                            </Typography>
                                          </TableCell>

                                          {/* Actions */}
                                          <TableCell align="right">
                                            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 0.5 }}>
                                              <Tooltip title="Edit Destination" arrow>
                                                <IconButton
                                                  size="small"
                                                  onClick={() => openEditDestinationModal(countryId, dest)}
                                                  sx={{ color: "#64748b", p: 0.5, borderRadius: "4px", "&:hover": { color: "#2563eb", bgcolor: "#eff6ff" } }}
                                                >
                                                  <EditRoundedIcon sx={{ fontSize: 14 }} />
                                                </IconButton>
                                              </Tooltip>

                                              <Tooltip title="Delete Destination" arrow>
                                                <IconButton
                                                  size="small"
                                                  onClick={() => triggerDeleteDestination(countryId, dest)}
                                                  sx={{ color: "#64748b", p: 0.5, borderRadius: "4px", "&:hover": { color: "#ef4444", bgcolor: "#fee2e2" } }}
                                                >
                                                  <DeleteOutlineRoundedIcon sx={{ fontSize: 14 }} />
                                                </IconButton>
                                              </Tooltip>
                                            </Box>
                                          </TableCell>
                                        </TableRow>
                                      );
                                    })
                                  ) : (
                                    <TableRow sx={{ bgcolor: "#f8fafc" }}>
                                      <TableCell colSpan={5} sx={{ py: 1.5, pl: 8 }}>
                                        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                                          <Typography variant="caption" sx={{ color: "#94a3b8", fontSize: "0.75rem" }}>
                                            No destinations registered under {country.name} yet.
                                          </Typography>
                                          <Button
                                            size="small"
                                            onClick={() => openAddDestinationModal(countryId)}
                                            sx={{ textTransform: "none", fontSize: "0.7rem", fontWeight: 600, py: 0, color: "#0f172a" }}
                                          >
                                            + Add Destination
                                          </Button>
                                        </Box>
                                      </TableCell>
                                    </TableRow>
                                  )
                                )}
                              </React.Fragment>
                            );
                          })
                        ) : (
                          <TableRow sx={{ bgcolor: "#fcfcfd" }}>
                            <TableCell colSpan={5} sx={{ py: 1.5, pl: 4 }}>
                              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                                <Typography variant="caption" sx={{ color: "#94a3b8", fontSize: "0.75rem" }}>
                                  No countries registered under {continent.name} yet.
                                </Typography>
                                <Button
                                  size="small"
                                  onClick={() => openAddCountryModal(contId)}
                                  sx={{ textTransform: "none", fontSize: "0.7rem", fontWeight: 600, py: 0, color: "#0f172a" }}
                                >
                                  + Add Country
                                </Button>
                              </Box>
                            </TableCell>
                          </TableRow>
                        )
                      )}
                    </React.Fragment>
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
                      <PublicRoundedIcon />
                    </Avatar>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, color: "#0f172a", mb: 0.5 }}>
                      {searchQuery ? "No matching locations found" : "No continents in catalog yet"}
                    </Typography>
                    <Typography variant="body2" sx={{ color: "#64748b", mb: 2, fontSize: "0.8125rem" }}>
                      {searchQuery
                        ? "Try clearing filters or adjusting your search keywords."
                        : "Get started by adding your first continental region."}
                    </Typography>
                    {searchQuery ? (
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => setSearchQuery("")}
                        sx={{ borderRadius: "4px", textTransform: "none", fontSize: "0.75rem" }}
                      >
                        Clear Search
                      </Button>
                    ) : (
                      <Button
                        size="small"
                        variant="contained"
                        startIcon={<AddRoundedIcon sx={{ fontSize: 16 }} />}
                        onClick={() => setIsContinentModalOpen(true)}
                        sx={{ bgcolor: "#0f172a", borderRadius: "4px", textTransform: "none", fontSize: "0.75rem" }}
                      >
                        Add Continent
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* ======================================================== */}
      {/* 4. Modals (Add Continent, Add Country, Add/Edit Destination) */}
      {/* ======================================================== */}

      {/* Add Continent Dialog */}
      <Dialog
        open={isContinentModalOpen}
        onClose={() => {
          setIsContinentModalOpen(false);
          setNewContinentIcon("");
        }}
        fullWidth
        maxWidth="xs"
        slotProps={{
          paper: { sx: { borderRadius: "6px", p: 0.5 } },
        }}
      >
        <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", pb: 1 }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, color: "#0f172a", fontSize: "1.05rem" }}>
              Add New Continent
            </Typography>
            <Typography variant="caption" sx={{ color: "#64748b" }}>
              Define top-level regional geography
            </Typography>
          </Box>
          <IconButton
            size="small"
            onClick={() => {
              setIsContinentModalOpen(false);
              setNewContinentIcon("");
            }}
            sx={{ color: "#64748b" }}
          >
            <CloseRoundedIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <form onSubmit={handleCreateContinent}>
          <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2.5, pt: 1.5 }}>
            <TextField
              label="Continent Name"
              required
              fullWidth
              size="small"
              placeholder="e.g. Europe"
              value={newContinentName}
              onChange={(e) => setNewContinentName(e.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
            />

            <Box>
              <Typography variant="body2" sx={{ fontWeight: 600, color: "#334155", mb: 1, fontSize: "0.8125rem" }}>
                Continent Icon (Optional)
              </Typography>
              <Paper
                variant="outlined"
                sx={{
                  p: 1.5,
                  borderRadius: "6px",
                  bgcolor: "#f8fafc",
                  display: "flex",
                  alignItems: "center",
                  gap: 2,
                }}
              >
                {newContinentIcon ? (
                  <Box
                    component="img"
                    src={newContinentIcon}
                    alt="Icon preview"
                    sx={{ width: 44, height: 44, borderRadius: "6px", objectFit: "cover", border: "1px solid #cbd5e1" }}
                  />
                ) : (
                  <Box
                    sx={{
                      width: 44,
                      height: 44,
                      borderRadius: "6px",
                      bgcolor: "#e2e8f0",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#64748b",
                    }}
                  >
                    <PublicRoundedIcon fontSize="small" />
                  </Box>
                )}
                <Box sx={{ flex: 1 }}>
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<CloudUploadOutlinedIcon sx={{ fontSize: 16 }} />}
                    onClick={() => setShowContinentIconPicker(true)}
                    sx={{
                      borderRadius: "6px",
                      textTransform: "none",
                      fontWeight: 600,
                      fontSize: "0.75rem",
                      color: "#0f172a",
                      borderColor: "#cbd5e1",
                    }}
                  >
                    Select / Upload Icon
                  </Button>
                </Box>
              </Paper>
            </Box>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2.5, pt: 1 }}>
            <Button
              type="button"
              variant="outlined"
              size="small"
              onClick={() => {
                setIsContinentModalOpen(false);
                setNewContinentIcon("");
              }}
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
              disabled={submittingModal || !newContinentName.trim()}
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
              {submittingModal ? "Creating..." : "Create Continent"}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Add Country Dialog */}
      <Dialog
        open={isCountryModalOpen}
        onClose={() => setIsCountryModalOpen(false)}
        fullWidth
        maxWidth="sm"
        slotProps={{
          paper: { sx: { borderRadius: "6px", p: 0.5 } },
        }}
      >
        <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", pb: 1 }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, color: "#0f172a", fontSize: "1.05rem" }}>
              Add Country
            </Typography>
            <Typography variant="caption" sx={{ color: "#64748b" }}>
              Register country profile and destination metadata
            </Typography>
          </Box>
          <IconButton size="small" onClick={() => setIsCountryModalOpen(false)} sx={{ color: "#64748b" }}>
            <CloseRoundedIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <form onSubmit={handleCreateCountry}>
          <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2.5, pt: 1.5 }}>
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "2fr 1fr" }, gap: 2 }}>
              <TextField
                label="Country Name"
                required
                fullWidth
                size="small"
                placeholder="e.g. Japan"
                value={newCountryData.name}
                onChange={(e) => setNewCountryData({ ...newCountryData, name: e.target.value })}
                slotProps={{ inputLabel: { shrink: true } }}
              />
              <TextField
                label="ISO Code"
                fullWidth
                size="small"
                placeholder="JP"
                value={newCountryData.code}
                onChange={(e) => setNewCountryData({ ...newCountryData, code: e.target.value.toUpperCase() })}
                slotProps={{
                  inputLabel: { shrink: true },
                  htmlInput: { maxLength: 3 },
                }}
              />
            </Box>

            <TextField
              label="Short Description"
              fullWidth
              size="small"
              placeholder="Land of the Rising Sun..."
              value={newCountryData.shortDescription}
              onChange={(e) => setNewCountryData({ ...newCountryData, shortDescription: e.target.value })}
              slotProps={{ inputLabel: { shrink: true } }}
            />

            <Box>
              <Typography variant="body2" sx={{ fontWeight: 600, color: "#334155", mb: 1, fontSize: "0.8125rem" }}>
                Currency Details (Optional)
              </Typography>
              <Box sx={{ display: "grid", gridTemplateColumns: "1fr 2fr 1fr", gap: 1.5 }}>
                <TextField
                  label="Code"
                  size="small"
                  placeholder="JPY"
                  value={newCountryData.currencyCode}
                  onChange={(e) => setNewCountryData({ ...newCountryData, currencyCode: e.target.value.toUpperCase() })}
                  slotProps={{ inputLabel: { shrink: true } }}
                />
                <TextField
                  label="Currency Name"
                  size="small"
                  placeholder="Japanese Yen"
                  value={newCountryData.currencyName}
                  onChange={(e) => setNewCountryData({ ...newCountryData, currencyName: e.target.value })}
                  slotProps={{ inputLabel: { shrink: true } }}
                />
                <TextField
                  label="Symbol"
                  size="small"
                  placeholder="¥"
                  value={newCountryData.currencySymbol}
                  onChange={(e) => setNewCountryData({ ...newCountryData, currencySymbol: e.target.value })}
                  slotProps={{ inputLabel: { shrink: true } }}
                />
              </Box>
            </Box>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2.5, pt: 1 }}>
            <Button
              type="button"
              variant="outlined"
              size="small"
              onClick={() => setIsCountryModalOpen(false)}
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
              disabled={submittingModal || !newCountryData.name.trim()}
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
              {submittingModal ? "Creating..." : "Create Country"}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Add / Edit Destination Dialog */}
      <Dialog
        open={isDestinationModalOpen}
        onClose={closeDestinationModal}
        fullWidth
        maxWidth="sm"
        slotProps={{
          paper: { sx: { borderRadius: "6px", p: 0.5 } },
        }}
      >
        <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", pb: 1 }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, color: "#0f172a", fontSize: "1.05rem" }}>
              {editingDestinationId ? "Edit Destination" : "Add Destination"}
            </Typography>
            <Typography variant="caption" sx={{ color: "#64748b" }}>
              Regional hub, stopover, or city center
            </Typography>
          </Box>
          <IconButton size="small" onClick={closeDestinationModal} sx={{ color: "#64748b" }}>
            <CloseRoundedIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <form onSubmit={handleSaveDestination}>
          <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2.5, pt: 1.5 }}>
            <TextField
              label="Destination / City Name"
              required
              fullWidth
              size="small"
              placeholder="e.g. Kyoto"
              value={newDestinationData.name}
              onChange={(e) => setNewDestinationData({ ...newDestinationData, name: e.target.value })}
              slotProps={{ inputLabel: { shrink: true } }}
            />

            <TextField
              label="Description (Optional)"
              multiline
              rows={3}
              fullWidth
              size="small"
              placeholder="Short note or highlights about this destination..."
              value={newDestinationData.description}
              onChange={(e) => setNewDestinationData({ ...newDestinationData, description: e.target.value })}
              slotProps={{ inputLabel: { shrink: true } }}
            />
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2.5, pt: 1 }}>
            <Button
              type="button"
              variant="outlined"
              size="small"
              onClick={closeDestinationModal}
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
              disabled={submittingModal || !newDestinationData.name.trim()}
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
              {submittingModal ? "Saving..." : editingDestinationId ? "Save Destination" : "Create Destination"}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteConfirm.open}
        onClose={() => setDeleteConfirm((prev) => ({ ...prev, open: false }))}
        fullWidth
        maxWidth="xs"
        slotProps={{ paper: { sx: { borderRadius: "6px", p: 0.5 } } }}
      >
        <DialogTitle sx={{ fontWeight: 700, color: "#0f172a", fontSize: "1rem" }}>
          {deleteConfirm.title}
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ color: "#64748b", fontSize: "0.8125rem" }}>
            {deleteConfirm.message}
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            size="small"
            onClick={() => setDeleteConfirm((prev) => ({ ...prev, open: false }))}
            sx={{
              color: "#64748b",
              textTransform: "none",
              fontSize: "0.8125rem",
            }}
          >
            Cancel
          </Button>
          <Button
            size="small"
            variant="contained"
            color="error"
            onClick={deleteConfirm.onConfirm}
            sx={{
              borderRadius: "4px",
              textTransform: "none",
              fontSize: "0.8125rem",
            }}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Icon Picker Modal */}
      <ImagePickerModal
        isOpen={showContinentIconPicker}
        onClose={() => setShowContinentIconPicker(false)}
        onSelect={(urls: string[]) => {
          if (urls.length > 0) setNewContinentIcon(urls[0]);
          setShowContinentIconPicker(false);
        }}
        multiple={false}
        folder="continent-icons"
      />

      {/* Notification Toast */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: "100%", borderRadius: "6px" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
