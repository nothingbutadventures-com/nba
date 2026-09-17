const mongoose = require("mongoose");

const tourExecutionSchema = new mongoose.Schema(
  {
    tour: {
      type: mongoose.Schema.ObjectId,
      ref: "Tour",
      required: [true, "Tour execution must belong to a tour"],
      index: true,
    },
    departureDate: {
      type: String, // format YYYY-MM-DD
      required: [true, "Tour execution must have a departure date string"],
      index: true,
    },
    affiliate: {
      type: mongoose.Schema.ObjectId,
      ref: "Affiliate",
    },
    currentDay: {
      type: Number,
      default: 1,
    },
    // Attendance record for each traveler
    attendance: [
      {
        booking: {
          type: mongoose.Schema.ObjectId,
          ref: "Booking",
        },
        travelerId: {
          type: String,
          required: true,
        },
        firstName: {
          type: String,
          default: "",
        },
        lastName: {
          type: String,
          default: "",
        },
        email: {
          type: String,
          default: "",
        },
        phone: {
          type: String,
          default: "",
        },
        emergencyContact: {
          name: String,
          phone: String,
          relationship: String,
        },
        roomPreference: String,
        dietary: [String],
        status: {
          type: String,
          enum: ["pending", "present", "absent", "late"],
          default: "pending",
        },
        checkInTime: {
          type: Date,
        },
        notes: {
          type: String,
          default: "",
        },
      },
    ],
    // Day-by-day activity tracking
    dailyProgress: [
      {
        dayNumber: {
          type: Number,
          required: true,
        },
        status: {
          type: String,
          enum: ["not_started", "in_progress", "completed"],
          default: "not_started",
        },
        activities: [
          {
            activityId: {
              type: String,
              required: true,
            },
            title: {
              type: String,
              required: true,
            },
            duration: String,
            location: String,
            placeName: String,
            status: {
              type: String,
              enum: ["upcoming", "in_progress", "completed", "skipped", "delayed"],
              default: "upcoming",
            },
            startedAt: Date,
            completedAt: Date,
            notes: {
              type: String,
              default: "",
            },
          },
        ],
        notes: {
          type: String,
          default: "",
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Ensure one execution record per tour & departureDate
tourExecutionSchema.index({ tour: 1, departureDate: 1 }, { unique: true });

module.exports = mongoose.model("TourExecution", tourExecutionSchema);
