"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { api } from "@/lib/api";

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
import FlagOutlinedIcon from "@mui/icons-material/FlagOutlined";
import ParkOutlinedIcon from "@mui/icons-material/ParkOutlined";
import ForestOutlinedIcon from "@mui/icons-material/ForestOutlined";
import UnfoldMoreRoundedIcon from "@mui/icons-material/UnfoldMoreRounded";
import UnfoldLessRoundedIcon from "@mui/icons-material/UnfoldLessRounded";

interface Continent {
  id: string;
  _id: string;
  name: string;
  slug?: string;
  image?: string;
  countries: Country[];
}

interface Country {
  id: string;
  _id: string;
  name: string;
  code: string;
  image?: string;
  destinations?: Destination[];
}

interface Destination {
  id: string;
  _id: string;
  name: string;
  description?: string;
}

interface PlantingLocation {
  _id: string;
  id: string;
  country:
    | {
        _id: string;
        name: string;
      }
    | string;
  locationName: string;
  destinationId?: string;
  plantSpecies: string[];
}

export default function PlantingLocationsPage() {
  const [continents, setContinents] = useState<Continent[]>([]);
  const [plantingLocations, setPlantingLocations] = useState<PlantingLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Expandable sets
  const [expandedContinents, setExpandedContinents] = useState<Set<string>>(new Set());
  const [expandedCountries, setExpandedCountries] = useState<Set<string>>(new Set());

  // Delete Confirmation Dialog State
  const [deleteConfirm, setDeleteConfirm] = useState<{
    open: boolean;
    locationId: string;
    locationName: string;
  }>({
    open: false,
    locationId: "",
    locationName: "",
  });
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Snackbar Toast
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
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setRefreshing(true);
      const [resContinents, resPlantings] = await Promise.all([
        fetch(`${api.baseURL}/continents`),
        fetch(`${api.baseURL}/planting-locations`),
      ]);

      const dataContinents = await resContinents.json();
      const dataPlantings = await resPlantings.json();

      if (dataContinents.status === "success") {
        setContinents(dataContinents.data.continents || []);
      }
      if (dataPlantings.status === "success") {
        setPlantingLocations(dataPlantings.data.plantingLocations || []);
      }
    } catch (err) {
      console.error("Error fetching planting data:", err);
      setToast({ open: true, message: "Failed to load planting locations.", severity: "error" });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const getCountryKey = (country: Country) => country.id || country._id;

  const toggleContinent = (id: string) => {
    setExpandedContinents((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleCountry = (id: string) => {
    setExpandedCountries((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const expandAll = () => {
    const allConts = new Set<string>();
    const allCountries = new Set<string>();
    continents.forEach((c) => {
      allConts.add(c._id || c.id);
      (c.countries || []).forEach((country) => {
        allCountries.add(getCountryKey(country));
      });
    });
    setExpandedContinents(allConts);
    setExpandedCountries(allCountries);
  };

  const collapseAll = () => {
    setExpandedContinents(new Set());
    setExpandedCountries(new Set());
  };

  const confirmDelete = (locationId: string, locationName: string) => {
    setDeleteConfirm({
      open: true,
      locationId,
      locationName,
    });
  };

  const handleExecuteDelete = async () => {
    const { locationId, locationName } = deleteConfirm;
    if (!locationId) return;
    setDeleteLoading(true);

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${api.baseURL}/planting-locations/${locationId}`, {
        method: "DELETE",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (res.ok || res.status === 204) {
        setPlantingLocations((prev) => prev.filter((item) => item._id !== locationId));
        setToast({
          open: true,
          message: `Planting location "${locationName}" deleted successfully.`,
          severity: "success",
        });
      } else {
        const errorData = await res.json().catch(() => null);
        setToast({
          open: true,
          message: `Error deleting location: ${errorData?.message || "Server error"}`,
          severity: "error",
        });
      }
    } catch (err) {
      console.error("Error deleting planting location:", err);
      setToast({ open: true, message: "Failed to delete planting location.", severity: "error" });
    } finally {
      setDeleteLoading(false);
      setDeleteConfirm({ open: false, locationId: "", locationName: "" });
    }
  };

  // Hierarchy statistics
  const stats = useMemo(() => {
    let totalCountries = 0;
    continents.forEach((c) => {
      totalCountries += c.countries?.length || 0;
    });
    return {
      continents: continents.length,
      countries: totalCountries,
      plantingSites: plantingLocations.length,
    };
  }, [continents, plantingLocations]);

  // Filtered Continents & auto-expansion on search
  const filteredContinents = useMemo(() => {
    if (!searchQuery.trim()) return continents;
    const q = searchQuery.toLowerCase().trim();

    return continents
      .map((continent) => {
        const continentMatches = continent.name.toLowerCase().includes(q);

        const matchingCountries = (continent.countries || [])
          .map((country) => {
            const countryKey = getCountryKey(country);
            const countryMatches =
              country.name.toLowerCase().includes(q) ||
              (country.code && country.code.toLowerCase().includes(q));

            const countryPlantings = plantingLocations.filter((pl) => {
              const plCountryId = typeof pl.country === "object" ? pl.country._id : pl.country;
              if (plCountryId !== countryKey) return false;
              if (countryMatches) return true;
              const matchesName = pl.locationName.toLowerCase().includes(q);
              const matchesSpecies = (pl.plantSpecies || []).some((s) => s.toLowerCase().includes(q));
              return matchesName || matchesSpecies;
            });

            if (countryMatches || countryPlantings.length > 0) {
              return country;
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
  }, [continents, plantingLocations, searchQuery]);

  // Auto-expand search results
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
      {/* 1. Top Header: Exact same style as tours-management & location */}
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
            Planting Locations
          </Typography>
          <Typography variant="body2" sx={{ color: "#64748b", fontSize: "0.8125rem", mt: 0.25 }}>
            Manage reforestation sites and native tree species where adventure trees are planted ({stats.continents} continents, {stats.countries} countries, {stats.plantingSites} planting sites)
          </Typography>
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Tooltip title="Refresh planting locations" arrow>
            <IconButton
              size="small"
              onClick={fetchData}
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
            href="/admin/planting-locations/new"
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
            Add Planting Location
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
          placeholder="Search continent, country, location name, or species..."
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
            icon={<ForestOutlinedIcon sx={{ fontSize: "14px !important", color: "#059669" }} />}
            label={`Planting Sites (${stats.plantingSites})`}
            size="small"
            sx={{
              borderRadius: "4px",
              fontSize: "0.75rem",
              fontWeight: 600,
              bgcolor: "#ecfdf5",
              color: "#059669",
              border: "1px solid #a7f3d0",
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
      {/* 3. Main Expandable Hierarchy Table: Exact UI as /admin/location */}
      {/* ======================================================== */}
      <Paper sx={{ borderRadius: "6px", border: "1px solid #e2e8f0", overflow: "hidden" }}>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Region / Planting Location</TableCell>
                <TableCell>Level</TableCell>
                <TableCell>Identifier / Code</TableCell>
                <TableCell>Tree Species / Sites</TableCell>
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
                    <TableCell><Skeleton width={110} height={20} /></TableCell>
                    <TableCell align="right"><Skeleton width={80} height={28} sx={{ ml: "auto" }} /></TableCell>
                  </TableRow>
                ))
              ) : filteredContinents.length > 0 ? (
                filteredContinents.map((continent) => {
                  const contId = continent._id || continent.id;
                  const isContinentExpanded = expandedContinents.has(contId);
                  const countryCount = continent.countries?.length || 0;

                  // Count total planting locations in this continent
                  const continentPlantingCount = plantingLocations.filter((pl) => {
                    const plCountryId = typeof pl.country === "object" ? pl.country._id : pl.country;
                    return (continent.countries || []).some((c) => getCountryKey(c) === plCountryId);
                  }).length;

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
                                Continental Geography
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

                        {/* Slug / Code */}
                        <TableCell>
                          <Chip
                            label={continent.slug || "continent"}
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

                        {/* Sub-Entities Count */}
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 600, fontSize: "0.8125rem", color: "#334155" }}>
                            {countryCount} Countries ·{" "}
                            <Typography
                              component="span"
                              variant="body2"
                              sx={{ fontWeight: 600, color: continentPlantingCount > 0 ? "#059669" : "#64748b" }}
                            >
                              {continentPlantingCount} Sites
                            </Typography>
                          </Typography>
                        </TableCell>

                        {/* Actions */}
                        <TableCell align="right">
                          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 0.5 }}>
                            <Button
                              component={Link}
                              href="/admin/planting-locations/new"
                              size="small"
                              startIcon={<AddRoundedIcon sx={{ fontSize: 14 }} />}
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
                              Add Site
                            </Button>
                          </Box>
                        </TableCell>
                      </TableRow>

                      {/* ======================================== */}
                      {/* LEVEL 1: Countries (When continent is expanded) */}
                      {/* ======================================== */}
                      {isContinentExpanded && (
                        continent.countries && continent.countries.length > 0 ? (
                          continent.countries.map((country) => {
                            const countryKey = getCountryKey(country);
                            const isCountryExpanded = expandedCountries.has(countryKey);
                            const countryPlantings = plantingLocations.filter((pl) => {
                              const plCountryId = typeof pl.country === "object" ? pl.country._id : pl.country;
                              return plCountryId === countryKey;
                            });

                            return (
                              <React.Fragment key={countryKey}>
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
                                        onClick={() => toggleCountry(countryKey)}
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

                                  {/* Sites Count */}
                                  <TableCell>
                                    <Typography
                                      variant="caption"
                                      sx={{
                                        fontSize: "0.75rem",
                                        fontWeight: 600,
                                        color: countryPlantings.length > 0 ? "#059669" : "#64748b",
                                      }}
                                    >
                                      {countryPlantings.length} Planting {countryPlantings.length === 1 ? "Site" : "Sites"}
                                    </Typography>
                                  </TableCell>

                                  {/* Actions */}
                                  <TableCell align="right">
                                    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 0.5 }}>
                                      <Tooltip title={`Add Planting Site in ${country.name}`} arrow>
                                        <Button
                                          component={Link}
                                          href={`/admin/planting-locations/new?countryId=${countryKey}`}
                                          size="small"
                                          startIcon={<AddRoundedIcon sx={{ fontSize: 13 }} />}
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
                                          Add Site
                                        </Button>
                                      </Tooltip>
                                    </Box>
                                  </TableCell>
                                </TableRow>

                                {/* ======================================== */}
                                {/* LEVEL 2: Planting Locations (When country is expanded) */}
                                {/* ======================================== */}
                                {isCountryExpanded && (
                                  countryPlantings.length > 0 ? (
                                    countryPlantings.map((planting) => {
                                      return (
                                        <TableRow
                                          key={planting._id}
                                          hover
                                          sx={{
                                            bgcolor: "#f8fafc",
                                            "& td": { borderBottom: "1px solid #f1f5f9" },
                                          }}
                                        >
                                          {/* Planting Location with 2-level indent */}
                                          <TableCell sx={{ py: 1 }}>
                                            <Box sx={{ display: "flex", alignItems: "center", gap: 1, pl: 7.5 }}>
                                              <ParkOutlinedIcon sx={{ fontSize: 15, color: "#059669" }} />
                                              <Box sx={{ minWidth: 0 }}>
                                                <Typography
                                                  variant="body2"
                                                  sx={{
                                                    fontWeight: 600,
                                                    color: "#0f172a",
                                                    fontSize: "0.8rem",
                                                  }}
                                                >
                                                  {planting.locationName}
                                                </Typography>
                                              </Box>
                                            </Box>
                                          </TableCell>

                                          {/* Level Chip */}
                                          <TableCell>
                                            <Chip
                                              label="Planting Site"
                                              size="small"
                                              sx={{
                                                height: 18,
                                                fontSize: "0.63rem",
                                                fontWeight: 600,
                                                borderRadius: "3px",
                                                bgcolor: "#ecfdf5",
                                                color: "#059669",
                                                border: "1px solid #a7f3d0",
                                              }}
                                            />
                                          </TableCell>

                                          {/* Code / Identifier */}
                                          <TableCell>
                                            <Typography variant="caption" sx={{ color: "#94a3b8", fontSize: "0.7rem" }}>
                                              {planting.destinationId ? `Dest: ${planting.destinationId}` : "Regional Reserve"}
                                            </Typography>
                                          </TableCell>

                                          {/* Tree Species Chips */}
                                          <TableCell>
                                            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, alignItems: "center" }}>
                                              {planting.plantSpecies && planting.plantSpecies.length > 0 ? (
                                                planting.plantSpecies.map((species, i) => (
                                                  <Chip
                                                    key={i}
                                                    label={species}
                                                    size="small"
                                                    variant="outlined"
                                                    color="success"
                                                    sx={{
                                                      height: 18,
                                                      fontSize: "0.65rem",
                                                      fontWeight: 500,
                                                      borderRadius: "3px",
                                                    }}
                                                  />
                                                ))
                                              ) : (
                                                <Typography variant="caption" sx={{ color: "#94a3b8", fontSize: "0.7rem" }}>
                                                  No species listed
                                                </Typography>
                                              )}
                                            </Box>
                                          </TableCell>

                                          {/* Actions */}
                                          <TableCell align="right">
                                            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 0.5 }}>
                                              <Tooltip title="Edit Planting Site" arrow>
                                                <IconButton
                                                  component={Link}
                                                  href={`/admin/planting-locations/new?id=${planting._id}`}
                                                  size="small"
                                                  sx={{ color: "#64748b", p: 0.5, borderRadius: "4px", "&:hover": { color: "#2563eb", bgcolor: "#eff6ff" } }}
                                                >
                                                  <EditRoundedIcon sx={{ fontSize: 14 }} />
                                                </IconButton>
                                              </Tooltip>

                                              <Tooltip title="Delete Planting Site" arrow>
                                                <IconButton
                                                  size="small"
                                                  onClick={() => confirmDelete(planting._id, planting.locationName)}
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
                                            No planting locations added for {country.name} yet.
                                          </Typography>
                                          <Button
                                            component={Link}
                                            href={`/admin/planting-locations/new?countryId=${countryKey}`}
                                            size="small"
                                            sx={{ textTransform: "none", fontSize: "0.7rem", fontWeight: 600, py: 0, color: "#0f172a" }}
                                          >
                                            + Add Location
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
                              <Typography variant="caption" sx={{ color: "#94a3b8", fontSize: "0.75rem" }}>
                                No countries registered in this continent.
                              </Typography>
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
                      <ForestOutlinedIcon />
                    </Avatar>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, color: "#0f172a", mb: 0.5 }}>
                      {searchQuery ? "No matching planting locations found" : "No planting locations in catalog yet"}
                    </Typography>
                    <Typography variant="body2" sx={{ color: "#64748b", mb: 2, fontSize: "0.8125rem" }}>
                      {searchQuery
                        ? "Try clearing filters or adjusting your search keywords."
                        : "Get started by adding your first reforestation site."}
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
                        component={Link}
                        href="/admin/planting-locations/new"
                        size="small"
                        variant="contained"
                        startIcon={<AddRoundedIcon sx={{ fontSize: 16 }} />}
                        sx={{ bgcolor: "#0f172a", borderRadius: "4px", textTransform: "none", fontSize: "0.75rem" }}
                      >
                        Add Planting Location
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
      {/* 4. Delete Confirmation Dialog (Material UI) */}
      {/* ======================================================== */}
      <Dialog
        open={deleteConfirm.open}
        onClose={() => {
          if (!deleteLoading) setDeleteConfirm({ open: false, locationId: "", locationName: "" });
        }}
        maxWidth="xs"
        fullWidth
        slotProps={{
          paper: { sx: { borderRadius: "6px", p: 0.5 } },
        }}
      >
        <DialogTitle sx={{ fontWeight: 700, color: "#0f172a", fontSize: "1rem" }}>
          Confirm Location Deletion
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ color: "#64748b", fontSize: "0.8125rem" }}>
            Are you sure you want to delete planting location <strong>&ldquo;{deleteConfirm.locationName}&rdquo;</strong>? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            size="small"
            onClick={() => setDeleteConfirm({ open: false, locationId: "", locationName: "" })}
            disabled={deleteLoading}
            sx={{ color: "#64748b", textTransform: "none", fontSize: "0.8125rem" }}
          >
            Cancel
          </Button>
          <Button
            size="small"
            color="error"
            variant="contained"
            onClick={handleExecuteDelete}
            disabled={deleteLoading}
            sx={{ textTransform: "none", fontSize: "0.8125rem", borderRadius: "4px" }}
          >
            {deleteLoading ? "Deleting..." : "Delete Location"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ======================================================== */}
      {/* 5. Notification Toast (Material UI) */}
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
