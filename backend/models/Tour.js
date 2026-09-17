const mongoose = require("mongoose");
const slugify = require("slugify");

const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "A tour must have a name"],

      trim: true,
      maxlength: [200, "Tour name cannot exceed 200 characters"],
    },
    slug: {
      type: String,
      unique: true,
    },
    tourCode: {
      type: String,
      unique: true,
      uppercase: true,
      trim: true,
    },
    country: {
      type: mongoose.Schema.ObjectId,
      ref: "Country",
    },
    summary: {
      type: String,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    descriptionImage: {
      type: String,
      trim: true,
    },
    itineraryMapImage: {
      type: String,
      trim: true,
    },
    duration: {
      days: {
        type: Number,
        min: [1, "Duration must be at least 1 day"],
      },
      nights: {
        type: Number,
        default: 0,
      },
    },
    maxGroupSize: {
      type: Number,
      min: [1, "Group size must be at least 1"],
      max: [50, "Group size cannot exceed 50"],
    },

    physicalRating: {
      level: {
        type: Number,
        min: 1,
        max: 5,
      },
      description: String,
    },
    price: {
      amount: {
        type: Number,
      },
      currency: {
        type: String,
        default: "USD",
      },

      bookingType: {
        type: String,
        enum: ["Percentage", "Amount"],
        default: "Percentage",
      },
      bookingPercentage: {
        type: Number,
        default: 20,
        min: [0, "Booking percentage cannot be negative"],
        max: [100, "Booking percentage cannot exceed 100%"],
      },
      bookingAmount: {
        type: Number,
        default: 0,
        min: [0, "Booking amount cannot be negative"],
      },
      ownRoomPrice: {
        type: Number,
        default: 0,
        min: [0, "Own room price cannot be negative"],
      },
    },
    exemptFromLifetimeDeposit: {
      type: Boolean,
      default: false,
    },
    ratingsAverage: {
      type: Number,
      default: 0,
      min: [0, "Rating must be at least 0"],
      max: [5, "Rating cannot exceed 5"],
      set: (val) => Math.round(val * 10) / 10,
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
    images: [
      {
        url: {
          type: String,
        },
        caption: {
          type: String,
          trim: true,
        },
        isPrimary: {
          type: Boolean,
          default: false,
        },
      },
    ],
    startDates: [
      {
        startDate: {
          type: Date,
        },
        endDate: {
          type: Date,
        },
        availableSpots: {
          type: Number,
        },
        discount: {
          type: String,
          trim: true,
        },
        isActive: {
          type: Boolean,
          default: true,
        },
        adventureLeader: {
          type: mongoose.Schema.ObjectId,
          ref: "User",
        },
      },
    ],
    ownRoomAvailable: {
      type: Boolean,
      default: false,
    },
    itinerary: [
      {
        day: {
          type: Number,
        },
        title: {
          type: String,
          trim: true,
        },
        description: {
          type: String,
          trim: true,
        },
        importantNote: {
          type: String,
          trim: true,
        },

        activities: [
          {
            type: mongoose.Schema.ObjectId,
            ref: "Activity",
          },
        ],
        optionalActivities: [
          {
            type: mongoose.Schema.ObjectId,
            ref: "Activity",
          },
        ],
        accommodations: [
          {
            name: {
              type: String,
              trim: true,
            },
            type: {
              type: String,
              enum: ["Hotel", "Lounge", "Cottage", "Guestroom", "Camp"],
            },
            rating: {
              type: Number,
              min: 1,
              max: 5,
            },
            description: String,
          },
        ],
        meals: {
          breakfast: {
            type: Boolean,
            default: false,
          },
          lunch: {
            type: Boolean,
            default: false,
          },
          dinner: {
            type: Boolean,
            default: false,
          },
        },
        transport: [
          {
            type: {
              type: String,
              enum: [
                "bus",
                "car",
                "plane",
                "train",
                "boat",
                "walking",
                "cycling",
              ],
            },
            description: String,
            duration: String,
          },
        ],
        images: [String],
      },
    ],
    inclusions: {
      accommodation: {
        type: String,
        trim: true,
      },
      meals: [String],
      transport: [String],
      activities: [String],
      guides: {
        type: String,
        trim: true,
      },
      other: [String],
    },
    exclusions: [String],
    hotel: {
      type: mongoose.Schema.ObjectId,
      ref: "Hotel",
    },
    preTripHotel: {
      type: mongoose.Schema.ObjectId,
      ref: "Hotel",
    },
    postTripHotel: {
      type: mongoose.Schema.ObjectId,
      ref: "Hotel",
    },
    travelStyle: {
      type: String,
      trim: true,
    },
    interests: {
      type: [String],
      default: [],
    },
    tripType: {
      type: String,
      trim: true,
    },
    serviceLevel: {
      type: String,
      enum: ["Standard", "Comfort", "Premium", "Luxury"],
    },

    ageRequirement: {
      min: {
        type: Number,
        default: 0,
      },
      max: {
        type: Number,
        default: 99,
      },
      description: String,
    },
    wifiAvailable: {
      type: Boolean,
      default: false,
    },
    specialMoments: [
      {
        type: {
          type: String,
          enum: [
            "Welcome Moment",
            "We Day",
            "N-Day",
            "Me Day",
            "Dinner Party",
            "Good Karma Moment",
          ],
        },
        title: String,
        description: String,
        location: String,
      },
    ],
    highlights: [String],
    location: {
      startCity: {
        type: String,
        trim: true,
      },
      endCity: {
        type: String,
        trim: true,
      },
      visitedCities: [String],
      coordinates: [
        {
          latitude: Number,
          longitude: Number,
          name: String,
        },
      ],
    },
    guides: [
      {
        name: String,
        specialty: String,
        experience: Number,
        languages: [String],
        bio: String,
        image: String,
      },
    ],
    faqs: [
      {
        question: {
          type: String,
          trim: true,
        },
        answer: {
          type: String,
          trim: true,
        },
      },
    ],
    additionalInfo: {
      packingList: [String],
      healthSafety: String,
      weatherInfo: String,
      cultureInfo: String,
      tipping: String,
      visa: String,
      insurance: String,
    },
    beforeYouBook: {
      isTourForMe: { type: mongoose.Schema.Types.Mixed },
      visaInformation: { type: mongoose.Schema.Types.Mixed },
      accommodation: { type: mongoose.Schema.Types.Mixed },
      joiningPoint: { type: mongoose.Schema.Types.Mixed }
    },
    tags: [String],
    whatsIncluded: {
      type: String,
      trim: true,
    },
    transportation: {
      type: String,
      trim: true,
    },
    staffExperts: {
      type: String,
      trim: true,
    },
    meals: {
      type: String,
      trim: true,
    },
    accommodation: {
      type: String,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    plantingLocation: {
      type: mongoose.Schema.ObjectId,
      ref: "PlantingLocation",
    },
    treesPlanted: {
      type: Number,
      default: 0,
    },
    adventureLeaders: [
      {
        type: mongoose.Schema.ObjectId,
        ref: "User",
      },
    ],
    affiliates: [
      {
        type: mongoose.Schema.ObjectId,
        ref: "Affiliate",
      },
    ],
    seo: {
      metaTitle: String,
      metaDescription: String,
      keywords: [String],
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// Indexes (slug already indexed via unique constraint)
tourSchema.index({ country: 1 });
tourSchema.index({ price: 1 });
tourSchema.index({ ratingsAverage: -1 });
tourSchema.index({ startDates: 1 });
tourSchema.index({ isActive: 1 });
tourSchema.index({ isFeatured: -1 });
tourSchema.index({ travelStyle: 1 });
tourSchema.index({ adventureLeaders: 1 });
tourSchema.index({ affiliates: 1 });

tourSchema.index({ "duration.days": 1 });

// Compound indexes
tourSchema.index({ country: 1, isActive: 1 });
tourSchema.index({ ratingsAverage: -1, ratingsQuantity: -1 });
tourSchema.index({ price: 1, ratingsAverage: -1 });

// Virtual populate for reviews
tourSchema.virtual("reviews", {
  ref: "Review",
  foreignField: "tour",
  localField: "_id",
});

// Virtual for discounted price
tourSchema.virtual("discountedPrice").get(function () {
  // Calculate based on the current date, finding the best discount available?
  // For now, let's return the base price as the discounted price logic is moved to specific dates.
  return this.price.amount;
  return this.price.amount;
});

// Virtual for duration text
tourSchema.virtual("durationText").get(function () {
  const days = this.duration.days;
  const nights = this.duration.nights;
  return `${days} Day${days > 1 ? "s" : ""}, ${nights} Night${nights > 1 ? "s" : ""}`;
});

// Pre-save middleware to create slug and tourCode
tourSchema.pre("save", async function (next) {
  if (this.isModified("name") || this.isNew) {
    this.slug = slugify(this.name, { lower: true, strict: true });
  }

  if (!this.tourCode) {
    const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

    let unique = false;
    let code = "";

    while (!unique) {
      code = "";
      for (let i = 0; i < 5; i++) {
        code += letters.charAt(Math.floor(Math.random() * letters.length));
      }

      // Check if code exists
      const existingTour = await mongoose.models.Tour.findOne({ tourCode: code });
      if (!existingTour) {
        unique = true;
      }
    }
    this.tourCode = code;
  }
  next();
});

// Pre-save middleware to calculate nights from days
tourSchema.pre("save", function (next) {
  if (this.isModified("duration.days") || this.isNew) {
    this.duration.nights = Math.max(0, this.duration.days - 1);
  }
  next();
});

// Static method to get tour stats
tourSchema.statics.getTourStats = async function (countryId) {
  const stats = await this.aggregate([
    { $match: { country: countryId, isActive: true } },
    {
      $group: {
        _id: null,
        numTours: { $sum: 1 },
        avgRating: { $avg: "$ratingsAverage" },
        avgPrice: { $avg: "$price.amount" },
        minPrice: { $min: "$price.amount" },
        maxPrice: { $max: "$price.amount" },
        totalReviews: { $sum: "$ratingsQuantity" },
      },
    },
  ]);

  return stats.length > 0 ? stats[0] : null;
};

// Static method to get popular tours
tourSchema.statics.getPopularTours = async function (limit = 10) {
  return this.find({ isActive: true })
    .sort({ ratingsAverage: -1, ratingsQuantity: -1 })
    .limit(limit)
    .populate("country", "name slug")
    .select(
      "name slug summary price ratingsAverage ratingsQuantity duration images",
    );
};

// Instance method to check availability for a date
tourSchema.methods.checkAvailability = function (date) {
  const startDate = this.startDates.find(
    (sd) =>
      sd.startDate.toDateString() === new Date(date).toDateString() &&
      sd.isActive &&
      sd.availableSpots > 0,
  );
  return startDate || null;
};

// Update country statistics after tour save
tourSchema.post("save", async function () {
  const Country = mongoose.model("Country");
  await Country.findByIdAndUpdate(this.country, {
    $inc: { "statistics.totalTours": 1 },
  });
});

const Tour = mongoose.model("Tour", tourSchema);

module.exports = Tour;
