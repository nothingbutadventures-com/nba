const mongoose = require("mongoose");
const Tour = require("../models/Tour");
const Booking = require("../models/Booking");
const TourExecution = require("../models/TourExecution");
const Affiliate = require("../models/Affiliate");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/AppError");

// Helper to format date to YYYY-MM-DD
function formatDateString(dateVal) {
  if (!dateVal) return "";
  try {
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return "";
    return d.toISOString().split("T")[0];
  } catch {
    return "";
  }
}

// Helper to build sanitized daily progress for a tour, ensuring each day only has its actual unique activities
function buildSanitizedDailyProgress(tourItinerary, existingProgress = []) {
  const existingDayMap = new Map();
  if (Array.isArray(existingProgress)) {
    existingProgress.forEach((dp) => {
      existingDayMap.set(dp.dayNumber, dp);
    });
  }

  return (tourItinerary || []).map((dayItem) => {
    const dayActivities = [];
    const seenActivityIds = new Set();
    const existingDay = existingDayMap.get(dayItem.day);
    const existingActMap = new Map();

    if (existingDay && Array.isArray(existingDay.activities)) {
      existingDay.activities.forEach((act) => {
        existingActMap.set(act.activityId, act);
      });
    }

    // 1. Regular / included activities for this day
    if (dayItem.activities && Array.isArray(dayItem.activities)) {
      dayItem.activities.forEach((act, actIdx) => {
        if (act && typeof act === "object") {
          const actId = act._id ? act._id.toString() : `act-${dayItem.day}-${actIdx}`;
          if (!seenActivityIds.has(actId)) {
            seenActivityIds.add(actId);
            const prev = existingActMap.get(actId);
            dayActivities.push({
              activityId: actId,
              title: act.title || act.name || `Activity ${actIdx + 1}`,
              duration: act.duration || "",
              location: act.location || "",
              placeName: act.placeName || "",
              status: prev?.status || "upcoming",
              startedAt: prev?.startedAt || null,
              completedAt: prev?.completedAt || null,
              notes: prev?.notes || "",
            });
          }
        }
      });
    }

    // 2. Optional activities for this day (only if not already added)
    if (dayItem.optionalActivities && Array.isArray(dayItem.optionalActivities)) {
      dayItem.optionalActivities.forEach((act, actIdx) => {
        if (act && typeof act === "object") {
          const actId = act._id ? act._id.toString() : `opt-${dayItem.day}-${actIdx}`;
          if (!seenActivityIds.has(actId)) {
            seenActivityIds.add(actId);
            const prev = existingActMap.get(actId);
            dayActivities.push({
              activityId: actId,
              title: `${act.title || act.name || "Optional Activity"} (Optional)`,
              duration: act.duration || "",
              location: act.location || "",
              placeName: act.placeName || "",
              status: prev?.status || "upcoming",
              startedAt: prev?.startedAt || null,
              completedAt: prev?.completedAt || null,
              notes: prev?.notes || "",
            });
          }
        }
      });
    }

    // 3. Fallback if day has no specific activities configured
    if (dayActivities.length === 0) {
      const defaultId = `day-${dayItem.day}-main`;
      const prev = existingActMap.get(defaultId);
      dayActivities.push({
        activityId: defaultId,
        title: dayItem.title ? `${dayItem.title} Schedule` : `Day ${dayItem.day} Schedule`,
        duration: "Full Day",
        location: dayItem.title || "",
        placeName: "",
        status: prev?.status || "upcoming",
        startedAt: prev?.startedAt || null,
        completedAt: prev?.completedAt || null,
        notes: prev?.notes || "",
      });
    }

    return {
      dayNumber: dayItem.day,
      status: existingDay?.status || "not_started",
      activities: dayActivities,
      notes: existingDay?.notes || "",
    };
  });
}

/**
 * GET /api/v1/tour-execution/:tourId
 * Fetch live tour execution data (travelers roster, attendance, day activities)
 */
exports.getTourExecution = catchAsync(async (req, res, next) => {
  const { tourId } = req.params;
  let { departureDate } = req.query;

  // 1. Fetch tour details with populated itinerary activities & startDates
  const tour = await Tour.findById(tourId)
    .populate("country", "name slug")
    .populate("startDates.adventureLeader", "name email avatar phone role")
    .populate({
      path: "itinerary.activities",
      select: "title description duration location placeName price isFree",
    })
    .populate({
      path: "itinerary.optionalActivities",
      select: "title description duration location placeName price isFree",
    });

  if (!tour) {
    return next(new AppError("Tour not found", 404));
  }

  // 2. Authorization check: Admin, assigned Adventure Leader, or assigned affiliate
  if (req.user.role !== "admin") {
    const isAssignedLeader =
      (tour.adventureLeaders &&
        tour.adventureLeaders.some(
          (leadId) => leadId.toString() === req.user.id.toString(),
        )) ||
      (tour.startDates &&
        tour.startDates.some(
          (sd) =>
            sd.adventureLeader &&
            (sd.adventureLeader._id?.toString() || sd.adventureLeader.toString()) ===
              req.user.id.toString(),
        ));

    let isAssignedAffiliate = false;
    const affiliate = await Affiliate.findOne({ user: req.user.id });
    if (affiliate && tour.affiliates) {
      isAssignedAffiliate = tour.affiliates.some(
        (affId) => affId.toString() === affiliate._id.toString(),
      );
    }

    const isLeaderRole = [
      "adventure_leader",
      "guide",
      "leader",
      "partner",
    ].includes(req.user.role);

    if (!isAssignedLeader && !isAssignedAffiliate && !isLeaderRole) {
      return next(
        new AppError(
          "You are not assigned as an Adventure Leader or guide for this tour",
          403,
        ),
      );
    }
  }

  // 3. Fetch all active bookings for this tour
  const bookings = await Booking.find({
    tour: tourId,
    status: { $ne: "cancelled" },
  })
    .populate("user", "name email phone")
    .lean();

  // 4. Build available departure dates list with traveler counts
  const availableDepartureDates = (tour.startDates || [])
    .filter((sd) => sd.startDate && sd.isActive !== false)
    .map((sd) => {
      const dStr = formatDateString(sd.startDate);
      const dateBookings = bookings.filter(
        (b) => formatDateString(b.startDate) === dStr,
      );
      let count = 0;
      dateBookings.forEach((b) => {
        count += b.travelers && b.travelers.length > 0 ? b.travelers.length : 1;
      });

      return {
        _id: sd._id ? sd._id.toString() : "",
        date: dStr,
        endDate: formatDateString(sd.endDate),
        availableSpots: sd.availableSpots || tour.maxGroupSize || 10,
        travelersCount: count,
        bookingsCount: dateBookings.length,
        discount: sd.discount || "",
        adventureLeader: sd.adventureLeader || null,
      };
    });

  // Include any dates from bookings that aren't in tour.startDates
  bookings.forEach((b) => {
    const bDate = formatDateString(b.startDate);
    if (bDate && !availableDepartureDates.some((d) => d.date === bDate)) {
      const dateBookings = bookings.filter(
        (item) => formatDateString(item.startDate) === bDate,
      );
      let count = 0;
      dateBookings.forEach((item) => {
        count +=
          item.travelers && item.travelers.length > 0
            ? item.travelers.length
            : 1;
      });
      availableDepartureDates.push({
        date: bDate,
        endDate: "",
        availableSpots: tour.maxGroupSize || 10,
        travelersCount: count,
        bookingsCount: dateBookings.length,
        discount: "",
      });
    }
  });

  // Sort departure dates chronologically
  availableDepartureDates.sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );

  // For Adventure Leaders / Guides (non-admin), ONLY include dates where this leader is assigned
  let filteredDepartureDates = availableDepartureDates;
  if (req.user.role !== "admin") {
    filteredDepartureDates = availableDepartureDates.filter((sd) => {
      if (!sd.adventureLeader) return false;
      const leadId = sd.adventureLeader._id
        ? sd.adventureLeader._id.toString()
        : sd.adventureLeader.toString();
      return leadId === req.user.id.toString();
    });
  }

  if (!departureDate) {
    if (filteredDepartureDates.length > 0) {
      departureDate = filteredDepartureDates[0].date;
    } else {
      departureDate = new Date().toISOString().split("T")[0];
    }
  } else if (req.user.role !== "admin" && filteredDepartureDates.length > 0) {
    if (!filteredDepartureDates.some((d) => d.date === departureDate)) {
      departureDate = filteredDepartureDates[0].date;
    }
  }

  // Filter bookings strictly by departure date
  const matchedBookings = bookings.filter((b) => {
    const bDate = formatDateString(b.startDate);
    return bDate === departureDate;
  });

  // 5. Extract travelers from matched bookings
  const extractedTravelers = [];
  matchedBookings.forEach((b) => {
    const bookingRef =
      b.bookingReference || b._id.toString().slice(-6).toUpperCase();
    const roomPref = b.specialRequests?.roomPreference || "Standard";
    const dietary = b.specialRequests?.dietary || [];

    if (b.travelers && Array.isArray(b.travelers) && b.travelers.length > 0) {
      b.travelers.forEach((t, idx) => {
        extractedTravelers.push({
          booking: b._id,
          travelerId: t._id ? t._id.toString() : `${b._id}-${idx}`,
          firstName: t.firstName || "Traveler",
          lastName: t.lastName || `#${idx + 1}`,
          email: t.email || b.user?.email || "",
          phone: t.phone || b.user?.phone || "",
          emergencyContact: t.emergencyContact || null,
          roomPreference: roomPref,
          dietary: dietary,
          bookingRef: bookingRef,
        });
      });
    } else if (b.user) {
      const nameParts = (b.user.name || "Guest Traveler").split(" ");
      extractedTravelers.push({
        booking: b._id,
        travelerId: `${b._id}-lead`,
        firstName: nameParts[0] || "Guest",
        lastName: nameParts.slice(1).join(" ") || "Traveler",
        email: b.user.email || "",
        phone: b.user.phone || "",
        emergencyContact: null,
        roomPreference: roomPref,
        dietary: dietary,
        bookingRef: bookingRef,
      });
    }
  });

  // 6. Find or create TourExecution document
  let execution = await TourExecution.findOne({
    tour: tourId,
    departureDate: departureDate,
  });

  if (!execution) {
    // Build initial dailyProgress from tour itinerary with deduplicated activities
    const initialProgress = buildSanitizedDailyProgress(tour.itinerary);

    // Build initial attendance records
    const initialAttendance = extractedTravelers.map((t) => ({
      booking: t.booking,
      travelerId: t.travelerId,
      firstName: t.firstName,
      lastName: t.lastName,
      email: t.email,
      phone: t.phone,
      emergencyContact: t.emergencyContact,
      roomPreference: t.roomPreference,
      dietary: t.dietary,
      status: "pending",
      notes: "",
    }));

    execution = await TourExecution.create({
      tour: tourId,
      departureDate: departureDate,
      currentDay: 1,
      attendance: initialAttendance,
      dailyProgress: initialProgress,
    });
  } else {
    // Execution exists: sync attendance strictly to matched bookings and sanitize dailyProgress
    const existingAttMap = new Map();
    (execution.attendance || []).forEach((att) => {
      existingAttMap.set(att.travelerId, att);
    });

    execution.attendance = extractedTravelers.map((t) => {
      const prev = existingAttMap.get(t.travelerId);
      return {
        booking: t.booking,
        travelerId: t.travelerId,
        firstName: t.firstName,
        lastName: t.lastName,
        email: t.email,
        phone: t.phone,
        emergencyContact: t.emergencyContact,
        roomPreference: t.roomPreference,
        dietary: t.dietary,
        status: prev?.status || "pending",
        checkInTime: prev?.checkInTime || null,
        notes: prev?.notes || "",
        bookingRef: t.bookingRef,
      };
    });

    // Sanitize dailyProgress to eliminate duplicate activities and reflect true daily itinerary
    execution.dailyProgress = buildSanitizedDailyProgress(
      tour.itinerary,
      execution.dailyProgress
    );

    await execution.save();
  }

  // 7. Calculate real-time summary statistics
  const totalTravelers = execution.attendance.length;
  const presentCount = execution.attendance.filter(
    (a) => a.status === "present",
  ).length;
  const absentCount = execution.attendance.filter(
    (a) => a.status === "absent",
  ).length;
  const pendingCount = execution.attendance.filter(
    (a) => a.status === "pending" || !a.status,
  ).length;
  const lateCount = execution.attendance.filter(
    (a) => a.status === "late",
  ).length;

  let totalActivities = 0;
  let completedActivities = 0;
  let inProgressActivities = 0;

  execution.dailyProgress.forEach((dp) => {
    (dp.activities || []).forEach((act) => {
      totalActivities++;
      if (act.status === "completed") completedActivities++;
      if (act.status === "in_progress") inProgressActivities++;
    });
  });

  res.status(200).json({
    status: "success",
    data: {
      tour: {
        _id: tour._id,
        name: tour.name,
        tourCode: tour.tourCode,
        slug: tour.slug,
        duration: tour.duration,
        country: tour.country,
        summary: tour.summary,
        itinerary: tour.itinerary,
      },
      departureDate,
      availableDepartureDates: filteredDepartureDates,
      execution: {
        _id: execution._id,
        currentDay: execution.currentDay || 1,
        attendance: execution.attendance,
        dailyProgress: execution.dailyProgress,
        updatedAt: execution.updatedAt,
      },
      stats: {
        totalTravelers,
        presentCount,
        absentCount,
        pendingCount,
        lateCount,
        totalActivities,
        completedActivities,
        inProgressActivities,
      },
    },
  });
});

/**
 * PATCH /api/v1/tour-execution/:tourId/attendance
 * Update attendance for one or all travelers on a tour departure
 */
exports.updateAttendance = catchAsync(async (req, res, next) => {
  const { tourId } = req.params;
  const { departureDate, travelerId, status, notes, markAll } = req.body;

  if (!departureDate) {
    return next(new AppError("departureDate is required", 400));
  }

  let execution = await TourExecution.findOne({
    tour: tourId,
    departureDate: departureDate,
  });

  if (!execution) {
    return next(
      new AppError(
        "Tour execution record not found. Please load the tour first.",
        404,
      ),
    );
  }

  const now = new Date();

  if (markAll) {
    // Bulk mark all travelers
    execution.attendance.forEach((att) => {
      att.status = markAll;
      if (markAll === "present") {
        att.checkInTime = now;
      }
    });
  } else if (travelerId) {
    // Single traveler update
    const record = execution.attendance.find(
      (a) => a.travelerId === travelerId,
    );
    if (!record) {
      return next(new AppError("Traveler not found in attendance roster", 404));
    }

    if (status) {
      record.status = status;
      if (status === "present" && !record.checkInTime) {
        record.checkInTime = now;
      }
    }
    if (notes !== undefined) {
      record.notes = notes;
    }
  }

  await execution.save();

  res.status(200).json({
    status: "success",
    message: "Attendance updated successfully",
    data: {
      attendance: execution.attendance,
    },
  });
});

/**
 * PATCH /api/v1/tour-execution/:tourId/activity
 * Update status of an activity for a given day
 */
exports.updateActivityStatus = catchAsync(async (req, res, next) => {
  const { tourId } = req.params;
  const { departureDate, dayNumber, activityId, status, notes, setCurrentDay } =
    req.body;

  if (!departureDate) {
    return next(new AppError("departureDate is required", 400));
  }

  let execution = await TourExecution.findOne({
    tour: tourId,
    departureDate: departureDate,
  });

  if (!execution) {
    return next(new AppError("Tour execution record not found", 404));
  }

  if (setCurrentDay) {
    execution.currentDay = Number(setCurrentDay);
  }

  if (dayNumber !== undefined && activityId) {
    const dayProgress = execution.dailyProgress.find(
      (dp) => dp.dayNumber === Number(dayNumber),
    );

    if (!dayProgress) {
      return next(new AppError(`Day ${dayNumber} progress not found`, 404));
    }

    const activity = dayProgress.activities.find(
      (act) => act.activityId === activityId,
    );

    if (!activity) {
      return next(new AppError("Activity not found in day schedule", 404));
    }

    const now = new Date();
    if (status) {
      activity.status = status;
      if (status === "in_progress") {
        activity.startedAt = now;
        dayProgress.status = "in_progress";
      } else if (status === "completed") {
        activity.completedAt = now;

        // If all activities in day are completed, mark day completed
        const allCompleted = dayProgress.activities.every(
          (a) => a.status === "completed" || a.status === "skipped",
        );
        if (allCompleted) {
          dayProgress.status = "completed";
        }
      }
    }

    if (notes !== undefined) {
      activity.notes = notes;
    }
  }

  await execution.save();

  res.status(200).json({
    status: "success",
    message: "Activity status updated successfully",
    data: {
      dailyProgress: execution.dailyProgress,
      currentDay: execution.currentDay,
    },
  });
});
