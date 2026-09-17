"use client";

import Box from "@mui/material/Box";
import Skeleton from "@mui/material/Skeleton";
import Grid from "@mui/material/Grid";

export default function AdminLoading() {
  return (
    <Box sx={{ p: { xs: 2.5, sm: 4 } }}>
      {/* Header skeleton */}
      <Box sx={{ mb: 4 }}>
        <Skeleton variant="text" width={180} height={36} />
        <Skeleton variant="text" width={280} height={20} />
      </Box>

      {/* Stats Cards Skeleton */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {[1, 2, 3, 4].map((i) => (
          <Grid key={i} size={{ xs: 12, sm: 6, lg: 3 }}>
            <Box
              sx={{
                p: 3,
                bgcolor: "background.paper",
                borderRadius: 3,
                border: "1px solid",
                borderColor: "divider",
              }}
            >
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                <Skeleton variant="rounded" width={40} height={40} />
                <Skeleton variant="rounded" width={55} height={22} />
              </Box>
              <Skeleton variant="text" width={80} height={36} sx={{ mb: 0.5 }} />
              <Skeleton variant="text" width={120} height={18} />
            </Box>
          </Grid>
        ))}
      </Grid>

      {/* Content Skeleton */}
      <Box sx={{ mb: 4 }}>
        <Skeleton variant="text" width={140} height={28} sx={{ mb: 2 }} />
        <Grid container spacing={3}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Grid key={i} size={{ xs: 12, sm: 6, md: 4 }}>
              <Box
                sx={{
                  p: 2.5,
                  bgcolor: "background.paper",
                  borderRadius: 3,
                  border: "1px solid",
                  borderColor: "divider",
                  display: "flex",
                  gap: 2,
                  alignItems: "center",
                }}
              >
                <Skeleton variant="rounded" width={48} height={48} />
                <Box sx={{ flex: 1 }}>
                  <Skeleton variant="text" width="60%" height={22} sx={{ mb: 0.5 }} />
                  <Skeleton variant="text" width="90%" height={16} />
                </Box>
              </Box>
            </Grid>
          ))}
        </Grid>
      </Box>
    </Box>
  );
}
