const express = require("express");
const {
  getTourExecution,
  updateAttendance,
  updateActivityStatus,
} = require("../controllers/tourExecutionController");
const { protect, restrictTo } = require("../middleware/auth");

const router = express.Router();

// All tour execution operations are protected and accessible to Adventure Leaders, guides, affiliates, partners, and admins
router.use(protect);
router.use(
  restrictTo(
    "adventure_leader",
    "guide",
    "leader",
    "affiliate",
    "partner",
    "admin"
  )
);

router.get("/:tourId", getTourExecution);
router.patch("/:tourId/attendance", updateAttendance);
router.patch("/:tourId/activity", updateActivityStatus);

module.exports = router;
