"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import ImageExtension from "@tiptap/extension-image";
import LinkExtension from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import TextAlign from "@tiptap/extension-text-align";
import Underline from "@tiptap/extension-underline";
import Highlight from "@tiptap/extension-highlight";
import { uploadContinentImage } from "@/lib/firebase";
import { api } from "@/lib/api";
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
import Divider from "@mui/material/Divider";
import Skeleton from "@mui/material/Skeleton";

// Material UI Icons
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import SaveRoundedIcon from "@mui/icons-material/SaveRounded";
import CloudUploadOutlinedIcon from "@mui/icons-material/CloudUploadOutlined";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import FormatBoldRoundedIcon from "@mui/icons-material/FormatBoldRounded";
import FormatItalicRoundedIcon from "@mui/icons-material/FormatItalicRounded";
import FormatListBulletedRoundedIcon from "@mui/icons-material/FormatListBulletedRounded";
import ImageOutlinedIcon from "@mui/icons-material/ImageOutlined";

interface Continent {
  _id: string;
  id: string;
  name: string;
  slug: string;
  icon?: string;
  image?: string;
  description?: string;
}

export default function EditContinentPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [continent, setContinent] = useState<Continent | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form State
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("");
  const [image, setImage] = useState("");
  const [uploadingEditorImage, setUploadingEditorImage] = useState(false);
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [showIconPicker, setShowIconPicker] = useState(false);

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

  // TipTap Editor
  const editor = useEditor({
    extensions: [
      StarterKit,
      ImageExtension.configure({
        HTMLAttributes: {
          class: "rounded-md max-w-full h-auto mx-auto shadow-md my-4",
        },
      }),
      LinkExtension.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-zinc-900 font-semibold hover:underline decoration-zinc-900",
        },
      }),
      Placeholder.configure({
        placeholder: "Describe this continent... (History, Geography, Culture, Highlights)",
      }),
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      Underline,
      Highlight.configure({
        multicolor: true,
      }),
    ],
    content: "",
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: "prose prose-sm sm:prose max-w-none focus:outline-none min-h-[260px] p-4 text-slate-800",
      },
    },
  });

  useEffect(() => {
    if (id) fetchContinent();
  }, [id]);

  const fetchContinent = async () => {
    try {
      const res = await fetch(`${api.baseURL}/continents/${id}`, {
        credentials: "include",
      });
      const data = await res.json();
      if (data.status === "success") {
        const cont = data.data.continent;
        setContinent(cont);
        setName(cont.name || "");
        setIcon(cont.icon || "");
        setImage(cont.image || "");
        editor?.commands.setContent(cont.description || "");
      } else {
        setSnackbar({ open: true, message: data.message || "Failed to load continent.", severity: "error" });
      }
    } catch (err) {
      console.error("Error fetching continent:", err);
      setSnackbar({ open: true, message: "Network error loading continent.", severity: "error" });
    } finally {
      setLoading(false);
    }
  };

  const uploadImageToSupabase = async (file: File): Promise<string | null> => {
    try {
      return await uploadContinentImage(file);
    } catch (error) {
      console.error("Upload error:", error);
      setSnackbar({ open: true, message: "Failed to upload image file.", severity: "error" });
      return null;
    }
  };

  const handleEditorImageUpload = useCallback(async () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file || !editor) return;

      setUploadingEditorImage(true);
      const url = await uploadImageToSupabase(file);
      if (url) {
        editor.chain().focus().setImage({ src: url }).run();
      }
      setUploadingEditorImage(false);
    };
    input.click();
  }, [editor, id]);

  const handleSave = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!name.trim()) {
      setSnackbar({ open: true, message: "Continent name is required.", severity: "error" });
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`${api.baseURL}/continents/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          icon: icon.trim() || undefined,
          image: image.trim() || undefined,
          description: editor?.getHTML() || "",
        }),
        credentials: "include",
      });
      const data = await res.json();
      if (data.status === "success") {
        setSnackbar({ open: true, message: "Continent saved successfully!", severity: "success" });
        router.refresh();
      } else {
        setSnackbar({ open: true, message: data.message || "Error saving continent.", severity: "error" });
      }
    } catch (err) {
      console.error("Save error:", err);
      setSnackbar({ open: true, message: "Network error while saving continent.", severity: "error" });
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
              <Skeleton variant="text" width={160} height={28} />
              <Skeleton variant="text" width={220} height={18} />
            </Box>
          </Box>
          <Skeleton variant="rounded" width={120} height={36} sx={{ borderRadius: "6px" }} />
        </Box>
        <Paper elevation={0} sx={{ p: 4, borderRadius: "6px", border: "1px solid #e2e8f0", bgcolor: "#ffffff", mb: 3 }}>
          <Skeleton variant="rectangular" height={100} sx={{ borderRadius: "6px", mb: 2 }} />
          <Skeleton variant="rectangular" height={100} sx={{ borderRadius: "6px" }} />
        </Paper>
      </Box>
    );
  }

  if (!continent) {
    return (
      <Box sx={{ p: 6, textAlign: "center", bgcolor: "#f8fafc", minHeight: "100vh" }}>
        <Typography variant="h6" sx={{ color: "#0f172a", fontWeight: 600, mb: 1 }}>
          Continent Not Found
        </Typography>
        <Typography variant="body2" sx={{ color: "#64748b", mb: 3 }}>
          The requested continent could not be found or has been deleted.
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

  return (
    <Box sx={{ p: { xs: 2, sm: 3 }, bgcolor: "#f8fafc", minHeight: "100vh", pb: 8 }}>
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
              Edit Continent
            </Typography>
            <Typography variant="body2" sx={{ color: "#64748b", fontSize: "0.8125rem", mt: 0.25 }}>
              Update profile details, icons, and descriptive editorial for {continent.name}
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

      {/* Main Form Content */}
      <Box sx={{ display: "flex", flexDirection: "column", gap: 3, maxWidth: 1100 }}>
        {/* Basic Information Card */}
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
            Basic Information
          </Typography>
          <Typography variant="body2" sx={{ color: "#64748b", mb: 3, fontSize: "0.8125rem" }}>
            Configure primary continent identification, iconography, and cover image.
          </Typography>

          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 3.5 }}>
            {/* Left Column: Continent Name & Icon */}
            <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
              <TextField
                label="Continent Name"
                required
                fullWidth
                size="small"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Asia"
                slotProps={{ inputLabel: { shrink: true } }}
              />

              <Box>
                <Typography variant="caption" sx={{ fontWeight: 600, color: "#334155", display: "block", mb: 1 }}>
                  Continent Icon
                </Typography>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1.5 }}>
                  {icon ? (
                    <Box
                      sx={{
                        width: 52,
                        height: 52,
                        borderRadius: "6px",
                        border: "1px solid #e2e8f0",
                        bgcolor: "#f8fafc",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        overflow: "hidden",
                        position: "relative",
                        flexShrink: 0,
                        "&:hover .remove-btn": { opacity: 1 },
                      }}
                    >
                      <img
                        src={icon}
                        alt="Icon preview"
                        style={{ width: "100%", height: "100%", objectFit: "contain", padding: 6 }}
                      />
                      <IconButton
                        className="remove-btn"
                        size="small"
                        onClick={() => setIcon("")}
                        sx={{
                          position: "absolute",
                          inset: 0,
                          bgcolor: "rgba(15,23,42,0.75)",
                          color: "#ffffff",
                          borderRadius: 0,
                          opacity: 0,
                          transition: "opacity 0.15s ease",
                          "&:hover": { bgcolor: "rgba(239,68,68,0.85)" },
                        }}
                      >
                        <DeleteOutlineRoundedIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  ) : null}

                  <Button
                    type="button"
                    variant="outlined"
                    size="small"
                    startIcon={<CloudUploadOutlinedIcon sx={{ fontSize: 16 }} />}
                    onClick={() => setShowIconPicker(true)}
                    sx={{
                      borderRadius: "6px",
                      textTransform: "none",
                      fontWeight: 600,
                      fontSize: "0.8125rem",
                      color: "#334155",
                      borderColor: "#cbd5e1",
                      "&:hover": { borderColor: "#94a3b8", bgcolor: "#f8fafc" },
                    }}
                  >
                    {icon ? "Change Icon" : "Select / Upload Icon"}
                  </Button>
                </Box>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Or paste icon image URL..."
                  value={icon}
                  onChange={(e) => setIcon(e.target.value)}
                  slotProps={{
                    input: { sx: { fontSize: "0.75rem" } },
                  }}
                />
              </Box>
            </Box>

            {/* Right Column: Cover Image */}
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
              <Typography variant="caption" sx={{ fontWeight: 600, color: "#334155", display: "block" }}>
                Cover Image
              </Typography>
              {image ? (
                <Box
                  sx={{
                    width: "100%",
                    height: 160,
                    borderRadius: "6px",
                    border: "1px solid #e2e8f0",
                    overflow: "hidden",
                    position: "relative",
                    bgcolor: "#f8fafc",
                    "&:hover .remove-btn": { opacity: 1 },
                  }}
                >
                  <img src={image} alt="Continent cover" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
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
                    height: 160,
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
                    Recommended 1200 x 600 px banner
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
                    alignSelf: "flex-start",
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
            </Box>
          </Box>
        </Paper>

        {/* Content & Editorial Description Card */}
        <Paper
          elevation={0}
          sx={{
            borderRadius: "6px",
            border: "1px solid #e2e8f0",
            bgcolor: "#ffffff",
            overflow: "hidden",
          }}
        >
          {/* Editor Header Toolbar */}
          <Box
            sx={{
              px: 2.5,
              py: 1.5,
              borderBottom: "1px solid #e2e8f0",
              bgcolor: "#f8fafc",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 1.5,
            }}
          >
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, color: "#0f172a" }}>
                Editorial Description
              </Typography>
              <Typography variant="caption" sx={{ color: "#64748b" }}>
                Rich-text overview rendered on continent landing pages
              </Typography>
            </Box>

            <Paper
              elevation={0}
              sx={{
                display: "flex",
                alignItems: "center",
                border: "1px solid #e2e8f0",
                borderRadius: "6px",
                p: 0.5,
                gap: 0.5,
                bgcolor: "#ffffff",
              }}
            >
              <IconButton
                size="small"
                onClick={() => editor?.chain().focus().toggleBold().run()}
                sx={{
                  borderRadius: "4px",
                  p: 0.5,
                  color: editor?.isActive("bold") ? "#0f172a" : "#64748b",
                  bgcolor: editor?.isActive("bold") ? "#e2e8f0" : "transparent",
                }}
              >
                <FormatBoldRoundedIcon fontSize="small" />
              </IconButton>

              <IconButton
                size="small"
                onClick={() => editor?.chain().focus().toggleItalic().run()}
                sx={{
                  borderRadius: "4px",
                  p: 0.5,
                  color: editor?.isActive("italic") ? "#0f172a" : "#64748b",
                  bgcolor: editor?.isActive("italic") ? "#e2e8f0" : "transparent",
                }}
              >
                <FormatItalicRoundedIcon fontSize="small" />
              </IconButton>

              <Divider orientation="vertical" flexItem sx={{ mx: 0.25 }} />

              <Button
                size="small"
                onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
                sx={{
                  minWidth: 28,
                  height: 28,
                  p: 0,
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  borderRadius: "4px",
                  color: editor?.isActive("heading", { level: 2 }) ? "#0f172a" : "#64748b",
                  bgcolor: editor?.isActive("heading", { level: 2 }) ? "#e2e8f0" : "transparent",
                }}
              >
                H2
              </Button>

              <Button
                size="small"
                onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}
                sx={{
                  minWidth: 28,
                  height: 28,
                  p: 0,
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  borderRadius: "4px",
                  color: editor?.isActive("heading", { level: 3 }) ? "#0f172a" : "#64748b",
                  bgcolor: editor?.isActive("heading", { level: 3 }) ? "#e2e8f0" : "transparent",
                }}
              >
                H3
              </Button>

              <Divider orientation="vertical" flexItem sx={{ mx: 0.25 }} />

              <IconButton
                size="small"
                onClick={() => editor?.chain().focus().toggleBulletList().run()}
                sx={{
                  borderRadius: "4px",
                  p: 0.5,
                  color: editor?.isActive("bulletList") ? "#0f172a" : "#64748b",
                  bgcolor: editor?.isActive("bulletList") ? "#e2e8f0" : "transparent",
                }}
              >
                <FormatListBulletedRoundedIcon fontSize="small" />
              </IconButton>

              <Tooltip title="Upload Image into Content" arrow>
                <span>
                  <IconButton
                    size="small"
                    onClick={handleEditorImageUpload}
                    disabled={uploadingEditorImage}
                    sx={{
                      borderRadius: "4px",
                      p: 0.5,
                      color: "#64748b",
                    }}
                  >
                    {uploadingEditorImage ? (
                      <CircularProgress size={16} />
                    ) : (
                      <ImageOutlinedIcon fontSize="small" />
                    )}
                  </IconButton>
                </span>
              </Tooltip>
            </Paper>
          </Box>

          {/* TipTap Editor Body */}
          <Box sx={{ minHeight: 280 }}>
            <EditorContent editor={editor} />
          </Box>
        </Paper>
      </Box>

      {/* Image Picker Modals */}
      <ImagePickerModal
        isOpen={showImagePicker}
        onClose={() => setShowImagePicker(false)}
        onSelect={(urls: string[]) => {
          if (urls.length > 0) setImage(urls[0]);
          setShowImagePicker(false);
        }}
        multiple={false}
        folder="continent-images"
      />

      <ImagePickerModal
        isOpen={showIconPicker}
        onClose={() => setShowIconPicker(false)}
        onSelect={(urls: string[]) => {
          if (urls.length > 0) setIcon(urls[0]);
          setShowIconPicker(false);
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
          sx={{ width: "100%", borderRadius: "6px", fontWeight: 500 }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
