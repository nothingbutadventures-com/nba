"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { uploadCountryImage } from "@/lib/firebase";
import { api } from "@/lib/api";
import CreateActivityModal from "@/components/CreateActivityModal";
import ImagePickerModal from "@/components/ImagePickerModal";

// Material UI Components
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Paper from "@mui/material/Paper";
import TextField from "@mui/material/TextField";
import CircularProgress from "@mui/material/CircularProgress";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import Tooltip from "@mui/material/Tooltip";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
import Chip from "@mui/material/Chip";
import InputAdornment from "@mui/material/InputAdornment";
import Skeleton from "@mui/material/Skeleton";

// Material UI Icons
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import SaveRoundedIcon from "@mui/icons-material/SaveRounded";
import CloudUploadOutlinedIcon from "@mui/icons-material/CloudUploadOutlined";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import OndemandVideoRoundedIcon from "@mui/icons-material/OndemandVideoRounded";
import HelpOutlineRoundedIcon from "@mui/icons-material/HelpOutlineRounded";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import ArticleOutlinedIcon from "@mui/icons-material/ArticleOutlined";
import ExploreOutlinedIcon from "@mui/icons-material/ExploreOutlined";

// --- Types ---
interface Country {
  _id: string;
  id: string;
  name: string;
  code: string;
  description?: string;
  videoUrl?: string;
  currency: {
    code: string;
    name: string;
    symbol: string;
  };
  travelRequirements?: {
    visaRequired: boolean;
    visaOnArrival: boolean;
    eVisa: boolean;
  };
  faqSection?: {
    title?: string;
    subtitle?: string;
    items?: Array<{
      question: string;
      answer?: string;
    }>;
  };
  bestTime?: {
    title?: string;
    subtitle?: string;
  };
  bestTimeInsights?: {
    mostPopularTime?: string;
    budgetFriendly?: string;
    favouriteSeason?: string;
    culturallySignificantTimes?: string;
  };
  needToKnow?: {
    title?: string;
    subtitle?: string;
    timeZone?: string;
    climate?: string;
    currency?: string;
    transportation?: string;
    localCuisine?: string;
    languagesSpoken?: string;
  };
  localActivities?: Array<string | ActivityOption>;
  travelStoryBlogs?: Array<string | BlogOption>;
  image: string;
}

interface ActivityOption {
  _id: string;
  title: string;
  slug?: string;
  description?: string;
  coverImage?: string;
}

interface BlogOption {
  _id: string;
  title: string;
  slug: string;
  excerpt?: string;
  featuredImage?: {
    url: string;
  };
}

export default function EditCountryPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [country, setCountry] = useState<Country | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form State
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [currency, setCurrency] = useState({ code: "", name: "", symbol: "" });
  const [visaRequired, setVisaRequired] = useState(true);
  const [image, setImage] = useState("");
  const [description, setDescription] = useState("");
  const [videoUrl, setVideoUrl] = useState("");

  // FAQ
  const [faqTitle, setFaqTitle] = useState("FAQ");
  const [faqSubtitle, setFaqSubtitle] = useState(
    "Everything you need to know before your journey - from booking to what to pack."
  );
  const [faqItems, setFaqItems] = useState<Array<{ question: string; answer: string }>>([]);

  // Best Time
  const [bestTimeTitle, setBestTimeTitle] = useState("");
  const [bestTimeSubtitle, setBestTimeSubtitle] = useState("");
  const [mostPopularTimeDescription, setMostPopularTimeDescription] = useState("");
  const [budgetFriendlyDescription, setBudgetFriendlyDescription] = useState("");
  const [favouriteSeasonDescription, setFavouriteSeasonDescription] = useState("");
  const [culturallySignificantTimesDescription, setCulturallySignificantTimesDescription] = useState("");

  // Need to Know
  const [needToKnowTitle, setNeedToKnowTitle] = useState("");
  const [needToKnowSubtitle, setNeedToKnowSubtitle] = useState("");
  const [needToKnowTimeZone, setNeedToKnowTimeZone] = useState("");
  const [needToKnowClimate, setNeedToKnowClimate] = useState("");
  const [needToKnowCurrency, setNeedToKnowCurrency] = useState("");
  const [needToKnowTransportation, setNeedToKnowTransportation] = useState("");
  const [needToKnowLocalCuisine, setNeedToKnowLocalCuisine] = useState("");
  const [needToKnowLanguagesSpoken, setNeedToKnowLanguagesSpoken] = useState("");

  // Activities & Blogs
  const [allActivities, setAllActivities] = useState<ActivityOption[]>([]);
  const [activitySearch, setActivitySearch] = useState("");
  const [selectedActivityIds, setSelectedActivityIds] = useState<string[]>([]);
  const [activitiesLoading, setActivitiesLoading] = useState(true);

  const [allBlogs, setAllBlogs] = useState<BlogOption[]>([]);
  const [travelStoryBlogSearch, setTravelStoryBlogSearch] = useState("");
  const [selectedTravelStoryBlogIds, setSelectedTravelStoryBlogIds] = useState<string[]>([]);
  const [blogsLoading, setBlogsLoading] = useState(true);

  // Modals
  const [showCreateActivityModal, setShowCreateActivityModal] = useState(false);
  const [showImagePicker, setShowImagePicker] = useState(false);

  // Toast
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: "success" | "error" | "info";
  }>({
    open: false,
    message: "",
    severity: "success",
  });

  const handleActivityCreated = (newActivity: any) => {
    setAllActivities((prev) => [newActivity, ...prev]);
    setSelectedActivityIds((prev) => [...prev, String(newActivity._id)]);
  };

  useEffect(() => {
    if (id) {
      fetchCountry();
      fetchActivities();
      fetchBlogs();
    }
  }, [id]);

  const fetchCountry = async () => {
    try {
      const res = await fetch(`${api.baseURL}/countries/${id}`, {
        credentials: "include",
      });
      const data = await res.json();
      if (data.status === "success") {
        const c = data.data.country;
        setCountry(c);
        setName(c.name || "");
        setCode(c.code || "");
        setCurrency(c.currency || { code: "", name: "", symbol: "" });
        setVisaRequired(c.travelRequirements?.visaRequired ?? true);
        setImage(c.image || "");
        setDescription(c.description || "");
        setVideoUrl(c.videoUrl || "");
        setFaqTitle(c.faqSection?.title || "FAQ");
        setFaqSubtitle(
          c.faqSection?.subtitle ||
            "Everything you need to know before your journey - from booking to what to pack."
        );
        if (Array.isArray(c.faqSection?.items) && c.faqSection?.items.length > 0) {
          setFaqItems(
            c.faqSection.items.map((item: { question?: string; answer?: string }) => ({
              question: item.question || "",
              answer: item.answer || "",
            }))
          );
        } else {
          setFaqItems([]);
        }
        setBestTimeTitle(c.bestTime?.title || "");
        setBestTimeSubtitle(c.bestTime?.subtitle || "");
        setMostPopularTimeDescription(c.bestTimeInsights?.mostPopularTime || "");
        setBudgetFriendlyDescription(c.bestTimeInsights?.budgetFriendly || "");
        setFavouriteSeasonDescription(c.bestTimeInsights?.favouriteSeason || "");
        setCulturallySignificantTimesDescription(c.bestTimeInsights?.culturallySignificantTimes || "");
        setNeedToKnowTitle(c.needToKnow?.title || "");
        setNeedToKnowSubtitle(c.needToKnow?.subtitle || "");
        setNeedToKnowTimeZone(c.needToKnow?.timeZone || "");
        setNeedToKnowClimate(c.needToKnow?.climate || "");
        setNeedToKnowCurrency(c.needToKnow?.currency || "");
        setNeedToKnowTransportation(c.needToKnow?.transportation || "");
        setNeedToKnowLocalCuisine(c.needToKnow?.localCuisine || "");
        setNeedToKnowLanguagesSpoken(c.needToKnow?.languagesSpoken || "");
        setSelectedActivityIds(
          (c.localActivities || []).map((activity: string | ActivityOption) =>
            typeof activity === "string" ? String(activity) : String(activity._id)
          )
        );
        setSelectedTravelStoryBlogIds(
          (c.travelStoryBlogs || []).map((blog: string | BlogOption) =>
            typeof blog === "string" ? String(blog) : String(blog._id)
          )
        );
      } else {
        setSnackbar({ open: true, message: data.message || "Failed to load country.", severity: "error" });
      }
    } catch (err) {
      console.error("Error fetching country:", err);
      setSnackbar({ open: true, message: "Network error loading country.", severity: "error" });
    } finally {
      setLoading(false);
    }
  };

  const fetchActivities = async () => {
    if (!id) return;
    try {
      setActivitiesLoading(true);
      const res = await fetch(`${api.baseURL}/activities?destination=${id}&limit=500`, {
        credentials: "include",
      });
      const data = await res.json();
      if (data.status === "success") {
        setAllActivities(data.data.activities || []);
      }
    } catch (err) {
      console.error("Error fetching activities:", err);
    } finally {
      setActivitiesLoading(false);
    }
  };

  const fetchBlogs = async () => {
    try {
      setBlogsLoading(true);
      const res = await fetch(`${api.baseURL}/blogs?limit=200`, {
        credentials: "include",
      });
      const data = await res.json();
      if (data.status === "success") {
        setAllBlogs(data.data.blogs || []);
      }
    } catch (err) {
      console.error("Error fetching blogs:", err);
    } finally {
      setBlogsLoading(false);
    }
  };

  const toggleActivitySelection = (activityId: string) => {
    const normalizedId = String(activityId);
    setSelectedActivityIds((prev) =>
      prev.includes(normalizedId) ? prev.filter((i) => i !== normalizedId) : [...prev, normalizedId]
    );
  };

  const toggleTravelStoryBlogSelection = (blogId: string) => {
    const normalizedId = String(blogId);
    setSelectedTravelStoryBlogIds((prev) =>
      prev.includes(normalizedId) ? prev.filter((i) => i !== normalizedId) : [...prev, normalizedId]
    );
  };

  const updateFaqItem = (index: number, field: "question" | "answer", value: string) => {
    setFaqItems((prev) => prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)));
  };

  const addFaqItem = () => {
    setFaqItems((prev) => [...prev, { question: "", answer: "" }]);
  };

  const removeFaqItem = (index: number) => {
    setFaqItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!name.trim()) {
      setSnackbar({ open: true, message: "Country name is required.", severity: "error" });
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: name.trim(),
        code: code.trim().toUpperCase(),
        currency,
        travelRequirements: { visaRequired },
        description: description.trim(),
        videoUrl: videoUrl.trim(),
        faqSection: {
          title: faqTitle.trim(),
          subtitle: faqSubtitle.trim(),
          items: faqItems.filter((item) => item.question.trim() !== ""),
        },
        bestTime: {
          title: bestTimeTitle.trim(),
          subtitle: bestTimeSubtitle.trim(),
        },
        bestTimeInsights: {
          mostPopularTime: mostPopularTimeDescription.trim(),
          budgetFriendly: budgetFriendlyDescription.trim(),
          favouriteSeason: favouriteSeasonDescription.trim(),
          culturallySignificantTimes: culturallySignificantTimesDescription.trim(),
        },
        needToKnow: {
          title: needToKnowTitle.trim(),
          subtitle: needToKnowSubtitle.trim(),
          timeZone: needToKnowTimeZone.trim(),
          climate: needToKnowClimate.trim(),
          currency: needToKnowCurrency.trim(),
          transportation: needToKnowTransportation.trim(),
          localCuisine: needToKnowLocalCuisine.trim(),
          languagesSpoken: needToKnowLanguagesSpoken.trim(),
        },
        image,
        localActivities: selectedActivityIds,
        travelStoryBlogs: selectedTravelStoryBlogIds,
      };

      const res = await fetch(`${api.baseURL}/countries/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        credentials: "include",
      });
      const data = await res.json();
      if (data.status === "success") {
        setSnackbar({ open: true, message: "Country profile saved successfully!", severity: "success" });
        router.refresh();
      } else {
        setSnackbar({ open: true, message: data.message || "Error saving country.", severity: "error" });
      }
    } catch (err) {
      console.error("Save error:", err);
      setSnackbar({ open: true, message: "Network error while saving changes.", severity: "error" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ p: { xs: 2, sm: 3 }, bgcolor: "#f8fafc", minHeight: "100vh" }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Skeleton variant="rounded" width={32} height={32} sx={{ borderRadius: "6px" }} />
            <Box>
              <Skeleton variant="text" width={180} height={28} />
              <Skeleton variant="text" width={240} height={18} />
            </Box>
          </Box>
          <Skeleton variant="rounded" width={120} height={36} sx={{ borderRadius: "6px" }} />
        </Box>
        <Paper elevation={0} sx={{ p: 4, borderRadius: "6px", border: "1px solid #e2e8f0", bgcolor: "#ffffff", mb: 3 }}>
          <Skeleton variant="rectangular" height={140} sx={{ borderRadius: "6px", mb: 2 }} />
          <Skeleton variant="rectangular" height={100} sx={{ borderRadius: "6px" }} />
        </Paper>
      </Box>
    );
  }

  if (!country) {
    return (
      <Box sx={{ p: 6, textAlign: "center", bgcolor: "#f8fafc", minHeight: "100vh" }}>
        <Typography variant="h6" sx={{ color: "#0f172a", fontWeight: 600, mb: 1 }}>
          Country Not Found
        </Typography>
        <Typography variant="body2" sx={{ color: "#64748b", mb: 3 }}>
          The requested country could not be found or has been removed.
        </Typography>
        <Button
          component={Link}
          href="/admin/location"
          variant="outlined"
          size="small"
          startIcon={<ArrowBackRoundedIcon sx={{ fontSize: 16 }} />}
          sx={{ borderRadius: "6px", textTransform: "none", fontWeight: 600 }}
        >
          Back to Destinations
        </Button>
      </Box>
    );
  }

  const filteredActivities = allActivities.filter((activity) => {
    const q = activitySearch.trim().toLowerCase();
    if (!q) return true;
    return activity.title.toLowerCase().includes(q) || (activity.slug || "").toLowerCase().includes(q);
  });

  const selectedActivities = allActivities.filter((activity) =>
    selectedActivityIds.includes(String(activity._id))
  );

  const filteredTravelStoryBlogs = allBlogs.filter((blog) => {
    const q = travelStoryBlogSearch.trim().toLowerCase();
    if (!q) return true;
    return blog.title.toLowerCase().includes(q) || blog.slug.toLowerCase().includes(q);
  });

  const selectedTravelStoryBlogs = allBlogs.filter((blog) =>
    selectedTravelStoryBlogIds.includes(String(blog._id))
  );

  return (
    <Box sx={{ p: { xs: 2, sm: 3 }, bgcolor: "#f8fafc", minHeight: "100vh", pb: 10 }}>
      {/* Top Header */}
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          justifyContent: "space-between",
          alignItems: { xs: "flex-start", sm: "center" },
          gap: 1.5,
          mb: 3,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Tooltip title="Back to Destinations" arrow>
            <IconButton
              component={Link}
              href="/admin/location"
              size="small"
              sx={{
                border: "1px solid #e2e8f0",
                bgcolor: "#ffffff",
                borderRadius: "6px",
                p: 0.75,
                color: "#64748b",
                "&:hover": { bgcolor: "#f8fafc", color: "#0f172a", borderColor: "#cbd5e1" },
              }}
            >
              <ArrowBackRoundedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700, color: "#0f172a", fontSize: "1.25rem", lineHeight: 1.2 }}>
              Edit Country Details
            </Typography>
            <Typography variant="body2" sx={{ color: "#64748b", fontSize: "0.8125rem", mt: 0.25 }}>
              Configure geography, activities, seasonality, need-to-know, and FAQs for {country.name}
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Button
            component={Link}
            href="/admin/location"
            variant="outlined"
            size="small"
            sx={{
              borderRadius: "6px",
              textTransform: "none",
              fontWeight: 500,
              fontSize: "0.8125rem",
              color: "#64748b",
              borderColor: "#e2e8f0",
              height: 32,
              "&:hover": { borderColor: "#cbd5e1", bgcolor: "#ffffff" },
            }}
          >
            Cancel
          </Button>

          <Button
            onClick={handleSave}
            disabled={saving}
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
              borderRadius: "6px",
              px: 2,
              height: 32,
              textTransform: "none",
              fontWeight: 600,
              boxShadow: "none",
              "&:hover": { bgcolor: "#1e293b", boxShadow: "none" },
            }}
          >
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </Box>
      </Box>

      {/* Main Content Sections */}
      <Box sx={{ display: "flex", flexDirection: "column", gap: 3, maxWidth: 1100 }}>
        {/* 1. General Info Card */}
        <Paper
          elevation={0}
          sx={{
            p: { xs: 2.5, md: 3.5 },
            borderRadius: "6px",
            border: "1px solid #e2e8f0",
            bgcolor: "#ffffff",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
            <InfoOutlinedIcon sx={{ fontSize: 18, color: "#64748b" }} />
            <Typography variant="subtitle1" sx={{ fontWeight: 600, color: "#0f172a" }}>
              General Information
            </Typography>
          </Box>
          <Typography variant="body2" sx={{ color: "#64748b", mb: 3, fontSize: "0.8125rem" }}>
            Primary destination name, international ISO identifier, and travel requirement policies.
          </Typography>

          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "2fr 1fr" }, gap: 2.5, mb: 3 }}>
            <TextField
              label="Country / Destination Name"
              required
              fullWidth
              size="small"
              value={name}
              onChange={(e) => setName(e.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
            />
            <TextField
              label="Country Code (ISO)"
              fullWidth
              size="small"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="e.g. JP"
              slotProps={{
                inputLabel: { shrink: true },
                htmlInput: { maxLength: 3 },
              }}
            />
          </Box>

          <TextField
            label="Overview Description"
            multiline
            rows={4}
            fullWidth
            size="small"
            placeholder="Describe this country's landscapes, cultural highlights, and traveler appeal..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            slotProps={{ inputLabel: { shrink: true } }}
            sx={{ mb: 2 }}
          />

          <FormControlLabel
            control={
              <Checkbox
                checked={visaRequired}
                onChange={(e) => setVisaRequired(e.target.checked)}
                size="small"
                sx={{ color: "#0f172a", "&.Mui-checked": { color: "#0f172a" } }}
              />
            }
            label={
              <Typography variant="body2" sx={{ color: "#334155", fontWeight: 500 }}>
                Visa required for international tourists
              </Typography>
            }
          />
        </Paper>

        {/* 2. Cover Image Card */}
        <Paper
          elevation={0}
          sx={{
            p: { xs: 2.5, md: 3.5 },
            borderRadius: "6px",
            border: "1px solid #e2e8f0",
            bgcolor: "#ffffff",
          }}
        >
          <Typography variant="subtitle1" sx={{ fontWeight: 600, color: "#0f172a", mb: 0.5 }}>
            Cover Banner Image
          </Typography>
          <Typography variant="body2" sx={{ color: "#64748b", mb: 2.5, fontSize: "0.8125rem" }}>
            High-resolution landscape photo featured at the top of the destination portal.
          </Typography>

          {image ? (
            <Box
              sx={{
                width: "100%",
                maxWidth: 600,
                aspectRatio: "16 / 9",
                borderRadius: "6px",
                border: "1px solid #e2e8f0",
                overflow: "hidden",
                position: "relative",
                bgcolor: "#f8fafc",
                "&:hover .remove-btn": { opacity: 1 },
              }}
            >
              <img src={image} alt="Country cover" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              <Box
                className="remove-btn"
                sx={{
                  position: "absolute",
                  top: 8,
                  right: 8,
                  opacity: 0,
                  transition: "opacity 0.15s ease",
                }}
              >
                <IconButton
                  size="small"
                  onClick={() => setImage("")}
                  sx={{
                    bgcolor: "rgba(15,23,42,0.8)",
                    color: "#ffffff",
                    "&:hover": { bgcolor: "#ef4444" },
                  }}
                >
                  <DeleteOutlineRoundedIcon fontSize="small" />
                </IconButton>
              </Box>
            </Box>
          ) : (
            <Paper
              variant="outlined"
              onClick={() => setShowImagePicker(true)}
              sx={{
                maxWidth: 600,
                height: 180,
                borderStyle: "dashed",
                borderColor: "#cbd5e1",
                bgcolor: "#f8fafc",
                borderRadius: "6px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                gap: 1,
                "&:hover": { borderColor: "#0f172a", bgcolor: "#f1f5f9" },
                transition: "all 0.15s ease",
              }}
            >
              <CloudUploadOutlinedIcon sx={{ fontSize: 32, color: "#64748b" }} />
              <Typography variant="body2" sx={{ fontWeight: 600, color: "#334155", fontSize: "0.8125rem" }}>
                Select Cover Image
              </Typography>
              <Typography variant="caption" sx={{ color: "#94a3b8" }}>
                Click to choose from media library
              </Typography>
            </Paper>
          )}

          {image && (
            <Button
              type="button"
              variant="outlined"
              size="small"
              onClick={() => setShowImagePicker(true)}
              sx={{
                mt: 2,
                borderRadius: "6px",
                textTransform: "none",
                fontWeight: 600,
                fontSize: "0.75rem",
                color: "#334155",
                borderColor: "#cbd5e1",
              }}
            >
              Change Cover Image
            </Button>
          )}
        </Paper>

        {/* 3. Popular Activities ("Get to Know Activities") */}
        <Paper
          elevation={0}
          sx={{
            p: { xs: 2.5, md: 3.5 },
            borderRadius: "6px",
            border: "1px solid #e2e8f0",
            bgcolor: "#ffffff",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
            <ExploreOutlinedIcon sx={{ fontSize: 18, color: "#64748b" }} />
            <Typography variant="subtitle1" sx={{ fontWeight: 600, color: "#0f172a" }}>
              Get to Know Activities
            </Typography>
          </Box>
          <Typography variant="body2" sx={{ color: "#64748b", mb: 2.5, fontSize: "0.8125rem" }}>
            Select activities to feature on the {name || country.name} destination page.
          </Typography>

          <Box sx={{ display: "flex", gap: 1.5, mb: 2 }}>
            <TextField
              size="small"
              fullWidth
              placeholder="Search activities by title or slug..."
              value={activitySearch}
              onChange={(e) => setActivitySearch(e.target.value)}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchRoundedIcon sx={{ fontSize: 18, color: "#94a3b8" }} />
                    </InputAdornment>
                  ),
                },
              }}
            />
            <Button
              type="button"
              variant="outlined"
              size="small"
              startIcon={<AddRoundedIcon sx={{ fontSize: 16 }} />}
              onClick={() => setShowCreateActivityModal(true)}
              sx={{
                whiteSpace: "nowrap",
                borderRadius: "6px",
                textTransform: "none",
                fontWeight: 600,
                color: "#0f172a",
                borderColor: "#cbd5e1",
                height: 38,
                "&:hover": { borderColor: "#0f172a", bgcolor: "#f8fafc" },
              }}
            >
              Create Activity
            </Button>
          </Box>

          <Paper
            variant="outlined"
            sx={{
              maxHeight: 280,
              overflowY: "auto",
              borderColor: "#e2e8f0",
              borderRadius: "6px",
              bgcolor: "#f8fafc",
              mb: 3,
            }}
          >
            {activitiesLoading ? (
              <Box sx={{ p: 3, textAlign: "center" }}>
                <CircularProgress size={20} sx={{ color: "#64748b", mb: 1 }} />
                <Typography variant="caption" sx={{ color: "#64748b", display: "block" }}>
                  Loading activities catalog...
                </Typography>
              </Box>
            ) : filteredActivities.length === 0 ? (
              <Box sx={{ p: 3, textAlign: "center" }}>
                <Typography variant="caption" sx={{ color: "#64748b" }}>
                  No activities found for this query.
                </Typography>
              </Box>
            ) : (
              filteredActivities.map((activity) => (
                <Box
                  key={activity._id}
                  onClick={() => toggleActivitySelection(activity._id)}
                  sx={{
                    px: 2,
                    py: 1.25,
                    display: "flex",
                    alignItems: "center",
                    gap: 1.5,
                    cursor: "pointer",
                    borderBottom: "1px solid #e2e8f0",
                    bgcolor: selectedActivityIds.includes(String(activity._id)) ? "#ffffff" : "transparent",
                    "&:hover": { bgcolor: "#ffffff" },
                    transition: "background-color 0.15s ease",
                  }}
                >
                  <Checkbox
                    checked={selectedActivityIds.includes(String(activity._id))}
                    size="small"
                    sx={{ p: 0.5, color: "#0f172a", "&.Mui-checked": { color: "#0f172a" } }}
                  />
                  {activity.coverImage ? (
                    <img
                      src={activity.coverImage}
                      alt={activity.title}
                      style={{ width: 44, height: 32, objectFit: "cover", borderRadius: 4, border: "1px solid #e2e8f0" }}
                    />
                  ) : (
                    <Box sx={{ width: 44, height: 32, borderRadius: 1, bgcolor: "#e2e8f0" }} />
                  )}
                  <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: "#0f172a", fontSize: "0.8125rem" }} noWrap>
                      {activity.title}
                    </Typography>
                    <Typography variant="caption" sx={{ color: "#64748b", fontSize: "0.6875rem" }} noWrap>
                      /{activity.slug || "activity"}
                    </Typography>
                  </Box>
                </Box>
              ))
            )}
          </Paper>

          {/* Selected Activities Badges / List */}
          <Typography variant="subtitle2" sx={{ fontWeight: 600, color: "#334155", mb: 1 }}>
            Selected Activities ({selectedActivities.length})
          </Typography>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
            {selectedActivities.length === 0 ? (
              <Typography variant="caption" sx={{ color: "#94a3b8" }}>
                No activities selected yet. Check items in the list above to include.
              </Typography>
            ) : (
              selectedActivities.map((act) => (
                <Chip
                  key={act._id}
                  label={act.title}
                  size="small"
                  onDelete={() => toggleActivitySelection(act._id)}
                  sx={{
                    borderRadius: "6px",
                    fontWeight: 500,
                    fontSize: "0.75rem",
                    bgcolor: "#f1f5f9",
                    color: "#334155",
                    border: "1px solid #e2e8f0",
                  }}
                />
              ))
            )}
          </Box>
        </Paper>

        {/* 4. Best Time & Seasonality Card */}
        <Paper
          elevation={0}
          sx={{
            p: { xs: 2.5, md: 3.5 },
            borderRadius: "6px",
            border: "1px solid #e2e8f0",
            bgcolor: "#ffffff",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
            <CalendarMonthOutlinedIcon sx={{ fontSize: 18, color: "#64748b" }} />
            <Typography variant="subtitle1" sx={{ fontWeight: 600, color: "#0f172a" }}>
              Best Time to Visit
            </Typography>
          </Box>
          <Typography variant="body2" sx={{ color: "#64748b", mb: 3, fontSize: "0.8125rem" }}>
            Seasonal travel guidance and weather recommendations for travelers.
          </Typography>

          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2, mb: 3 }}>
            <TextField
              label="Section Heading"
              size="small"
              fullWidth
              placeholder="Best Time to Travel"
              value={bestTimeTitle}
              onChange={(e) => setBestTimeTitle(e.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
            />
            <TextField
              label="Section Subheading"
              size="small"
              fullWidth
              placeholder="e.g. Best seasons to visit India"
              value={bestTimeSubtitle}
              onChange={(e) => setBestTimeSubtitle(e.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
            />
          </Box>

          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2.5 }}>
            <TextField
              label="Most Popular Time"
              size="small"
              fullWidth
              placeholder="Peak season for the best weather and experiences"
              value={mostPopularTimeDescription}
              onChange={(e) => setMostPopularTimeDescription(e.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
            />
            <TextField
              label="Budget Friendly Period"
              size="small"
              fullWidth
              placeholder="Travel in shoulder months for better value"
              value={budgetFriendlyDescription}
              onChange={(e) => setBudgetFriendlyDescription(e.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
            />
            <TextField
              label="Favourite Season"
              size="small"
              fullWidth
              placeholder="A local favorite for festivals and landscapes"
              value={favouriteSeasonDescription}
              onChange={(e) => setFavouriteSeasonDescription(e.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
            />
            <TextField
              label="Culturally Significant Times"
              size="small"
              fullWidth
              placeholder="Ideal period to witness local traditions"
              value={culturallySignificantTimesDescription}
              onChange={(e) => setCulturallySignificantTimesDescription(e.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
            />
          </Box>
        </Paper>

        {/* 5. Destination Video Card */}
        <Paper
          elevation={0}
          sx={{
            p: { xs: 2.5, md: 3.5 },
            borderRadius: "6px",
            border: "1px solid #e2e8f0",
            bgcolor: "#ffffff",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
            <OndemandVideoRoundedIcon sx={{ fontSize: 18, color: "#64748b" }} />
            <Typography variant="subtitle1" sx={{ fontWeight: 600, color: "#0f172a" }}>
              Destination Video
            </Typography>
          </Box>
          <Typography variant="body2" sx={{ color: "#64748b", mb: 2.5, fontSize: "0.8125rem" }}>
            Add an embedded YouTube or Vimeo video URL preview for this destination.
          </Typography>

          <TextField
            label="Video URL"
            type="url"
            fullWidth
            size="small"
            placeholder="https://www.youtube.com/watch?v=..."
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            slotProps={{ inputLabel: { shrink: true } }}
          />
        </Paper>

        {/* 6. Need to Know (Glance Facts) Card */}
        <Paper
          elevation={0}
          sx={{
            p: { xs: 2.5, md: 3.5 },
            borderRadius: "6px",
            border: "1px solid #e2e8f0",
            bgcolor: "#ffffff",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
            <InfoOutlinedIcon sx={{ fontSize: 18, color: "#64748b" }} />
            <Typography variant="subtitle1" sx={{ fontWeight: 600, color: "#0f172a" }}>
              Need to Know Facts
            </Typography>
          </Box>
          <Typography variant="body2" sx={{ color: "#64748b", mb: 3, fontSize: "0.8125rem" }}>
            Fast-reference traveler facts displayed below the video section on the frontend.
          </Typography>

          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2, mb: 3 }}>
            <TextField
              label="Section Heading"
              size="small"
              fullWidth
              placeholder="India at a Glance"
              value={needToKnowTitle}
              onChange={(e) => setNeedToKnowTitle(e.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
            />
            <TextField
              label="Section Subheading"
              size="small"
              fullWidth
              placeholder="Need to Know"
              value={needToKnowSubtitle}
              onChange={(e) => setNeedToKnowSubtitle(e.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
            />
          </Box>

          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" }, gap: 2.5 }}>
            <TextField
              label="Time Zone"
              size="small"
              fullWidth
              placeholder="e.g. UTC +05:30"
              value={needToKnowTimeZone}
              onChange={(e) => setNeedToKnowTimeZone(e.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
            />
            <TextField
              label="Climate"
              size="small"
              fullWidth
              placeholder="e.g. Tropical / Alpine"
              value={needToKnowClimate}
              onChange={(e) => setNeedToKnowClimate(e.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
            />
            <TextField
              label="Currency"
              size="small"
              fullWidth
              placeholder="e.g. INR (₹)"
              value={needToKnowCurrency}
              onChange={(e) => setNeedToKnowCurrency(e.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
            />
            <TextField
              label="Transportation"
              size="small"
              fullWidth
              placeholder="e.g. Trains, domestic flights, private cars"
              value={needToKnowTransportation}
              onChange={(e) => setNeedToKnowTransportation(e.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
            />
            <TextField
              label="Local Cuisine"
              size="small"
              fullWidth
              placeholder="e.g. Spiced curries, street snacks, biryani"
              value={needToKnowLocalCuisine}
              onChange={(e) => setNeedToKnowLocalCuisine(e.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
            />
            <TextField
              label="Languages Spoken"
              size="small"
              fullWidth
              placeholder="e.g. Hindi, English, Regional"
              value={needToKnowLanguagesSpoken}
              onChange={(e) => setNeedToKnowLanguagesSpoken(e.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
            />
          </Box>
        </Paper>

        {/* 7. Travel Story Blogs Card */}
        <Paper
          elevation={0}
          sx={{
            p: { xs: 2.5, md: 3.5 },
            borderRadius: "6px",
            border: "1px solid #e2e8f0",
            bgcolor: "#ffffff",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
            <ArticleOutlinedIcon sx={{ fontSize: 18, color: "#64748b" }} />
            <Typography variant="subtitle1" sx={{ fontWeight: 600, color: "#0f172a" }}>
              Travel Story Blogs
            </Typography>
          </Box>
          <Typography variant="body2" sx={{ color: "#64748b", mb: 2.5, fontSize: "0.8125rem" }}>
            Link published editorial stories and journal articles to this country page.
          </Typography>

          <TextField
            size="small"
            fullWidth
            placeholder="Search blogs by title or slug..."
            value={travelStoryBlogSearch}
            onChange={(e) => setTravelStoryBlogSearch(e.target.value)}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchRoundedIcon sx={{ fontSize: 18, color: "#94a3b8" }} />
                  </InputAdornment>
                ),
              },
            }}
            sx={{ mb: 2 }}
          />

          <Paper
            variant="outlined"
            sx={{
              maxHeight: 260,
              overflowY: "auto",
              borderColor: "#e2e8f0",
              borderRadius: "6px",
              bgcolor: "#f8fafc",
              mb: 3,
            }}
          >
            {blogsLoading ? (
              <Box sx={{ p: 3, textAlign: "center" }}>
                <CircularProgress size={20} sx={{ color: "#64748b", mb: 1 }} />
                <Typography variant="caption" sx={{ color: "#64748b", display: "block" }}>
                  Loading blogs...
                </Typography>
              </Box>
            ) : filteredTravelStoryBlogs.length === 0 ? (
              <Box sx={{ p: 3, textAlign: "center" }}>
                <Typography variant="caption" sx={{ color: "#64748b" }}>
                  No blogs found.
                </Typography>
              </Box>
            ) : (
              filteredTravelStoryBlogs.map((blog) => (
                <Box
                  key={blog._id}
                  onClick={() => toggleTravelStoryBlogSelection(blog._id)}
                  sx={{
                    px: 2,
                    py: 1.25,
                    display: "flex",
                    alignItems: "center",
                    gap: 1.5,
                    cursor: "pointer",
                    borderBottom: "1px solid #e2e8f0",
                    bgcolor: selectedTravelStoryBlogIds.includes(String(blog._id)) ? "#ffffff" : "transparent",
                    "&:hover": { bgcolor: "#ffffff" },
                    transition: "background-color 0.15s ease",
                  }}
                >
                  <Checkbox
                    checked={selectedTravelStoryBlogIds.includes(String(blog._id))}
                    size="small"
                    sx={{ p: 0.5, color: "#0f172a", "&.Mui-checked": { color: "#0f172a" } }}
                  />
                  {blog.featuredImage?.url ? (
                    <img
                      src={blog.featuredImage.url}
                      alt={blog.title}
                      style={{ width: 44, height: 32, objectFit: "cover", borderRadius: 4, border: "1px solid #e2e8f0" }}
                    />
                  ) : (
                    <Box sx={{ width: 44, height: 32, borderRadius: 1, bgcolor: "#e2e8f0" }} />
                  )}
                  <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: "#0f172a", fontSize: "0.8125rem" }} noWrap>
                      {blog.title}
                    </Typography>
                    <Typography variant="caption" sx={{ color: "#64748b", fontSize: "0.6875rem" }} noWrap>
                      /{blog.slug}
                    </Typography>
                  </Box>
                </Box>
              ))
            )}
          </Paper>

          {/* Selected Blogs List */}
          <Typography variant="subtitle2" sx={{ fontWeight: 600, color: "#334155", mb: 1 }}>
            Selected Blogs ({selectedTravelStoryBlogs.length})
          </Typography>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
            {selectedTravelStoryBlogs.length === 0 ? (
              <Typography variant="caption" sx={{ color: "#94a3b8" }}>
                No travel story blogs linked yet.
              </Typography>
            ) : (
              selectedTravelStoryBlogs.map((b) => (
                <Chip
                  key={b._id}
                  label={b.title}
                  size="small"
                  onDelete={() => toggleTravelStoryBlogSelection(b._id)}
                  sx={{
                    borderRadius: "6px",
                    fontWeight: 500,
                    fontSize: "0.75rem",
                    bgcolor: "#f1f5f9",
                    color: "#334155",
                    border: "1px solid #e2e8f0",
                  }}
                />
              ))
            )}
          </Box>
        </Paper>

        {/* 8. FAQ Section Card */}
        <Paper
          elevation={0}
          sx={{
            p: { xs: 2.5, md: 3.5 },
            borderRadius: "6px",
            border: "1px solid #e2e8f0",
            bgcolor: "#ffffff",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
            <HelpOutlineRoundedIcon sx={{ fontSize: 18, color: "#64748b" }} />
            <Typography variant="subtitle1" sx={{ fontWeight: 600, color: "#0f172a" }}>
              Frequently Asked Questions (FAQ)
            </Typography>
          </Box>
          <Typography variant="body2" sx={{ color: "#64748b", mb: 3, fontSize: "0.8125rem" }}>
            Provide common destination inquiries and travel advisories.
          </Typography>

          <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5, mb: 3 }}>
            <TextField
              label="FAQ Section Title"
              size="small"
              fullWidth
              value={faqTitle}
              onChange={(e) => setFaqTitle(e.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
            />
            <TextField
              label="FAQ Section Subtitle"
              multiline
              rows={2}
              size="small"
              fullWidth
              value={faqSubtitle}
              onChange={(e) => setFaqSubtitle(e.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
            />
          </Box>

          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mb: 3 }}>
            {faqItems.length === 0 ? (
              <Box
                sx={{
                  p: 4,
                  textAlign: "center",
                  border: "1px dashed #cbd5e1",
                  borderRadius: "6px",
                  bgcolor: "#f8fafc",
                }}
              >
                <Typography variant="body2" sx={{ color: "#64748b" }}>
                  No FAQ questions configured yet. Click &quot;Add FAQ Item&quot; below.
                </Typography>
              </Box>
            ) : (
              faqItems.map((item, index) => (
                <Paper
                  key={index}
                  variant="outlined"
                  sx={{
                    p: 2.5,
                    borderRadius: "6px",
                    borderColor: "#e2e8f0",
                    bgcolor: "#ffffff",
                  }}
                >
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, color: "#334155" }}>
                      FAQ #{index + 1}
                    </Typography>
                    <Button
                      size="small"
                      color="error"
                      startIcon={<DeleteOutlineRoundedIcon sx={{ fontSize: 16 }} />}
                      onClick={() => removeFaqItem(index)}
                      sx={{ textTransform: "none", fontWeight: 600, fontSize: "0.75rem" }}
                    >
                      Remove
                    </Button>
                  </Box>

                  <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    <TextField
                      label="Question"
                      size="small"
                      fullWidth
                      placeholder="e.g. When is the best time to visit?"
                      value={item.question}
                      onChange={(e) => updateFaqItem(index, "question", e.target.value)}
                      slotProps={{ inputLabel: { shrink: true } }}
                    />
                    <TextField
                      label="Answer"
                      multiline
                      rows={3}
                      size="small"
                      fullWidth
                      placeholder="Detailed response..."
                      value={item.answer}
                      onChange={(e) => updateFaqItem(index, "answer", e.target.value)}
                      slotProps={{ inputLabel: { shrink: true } }}
                    />
                  </Box>
                </Paper>
              ))
            )}
          </Box>

          <Button
            type="button"
            variant="outlined"
            size="small"
            startIcon={<AddRoundedIcon sx={{ fontSize: 16 }} />}
            onClick={addFaqItem}
            sx={{
              borderRadius: "6px",
              textTransform: "none",
              fontWeight: 600,
              fontSize: "0.8125rem",
              color: "#0f172a",
              borderColor: "#cbd5e1",
              "&:hover": { borderColor: "#0f172a", bgcolor: "#f8fafc" },
            }}
          >
            Add FAQ Item
          </Button>
        </Paper>
      </Box>

      {/* Modals */}
      {showCreateActivityModal && (
        <CreateActivityModal
          isOpen={showCreateActivityModal}
          onClose={() => setShowCreateActivityModal(false)}
          destinationId={id}
          locationTags={name || (country && country.name) ? [name || country.name] : []}
          onCreated={handleActivityCreated}
        />
      )}

      <ImagePickerModal
        isOpen={showImagePicker}
        onClose={() => setShowImagePicker(false)}
        onSelect={(urls: string[]) => {
          if (urls.length > 0) setImage(urls[0]);
          setShowImagePicker(false);
        }}
        multiple={false}
        folder="country-images"
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
          sx={{ width: "100%", borderRadius: "6px", fontWeight: 500 }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
