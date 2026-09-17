const Tour = require("../models/Tour");
const Country = require("../models/Country");
const APIFeatures = require("../utils/apiFeatures");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/AppError");

const getAllTours = catchAsync(async (req, res, next) => {
  // Build query
  const features = new APIFeatures(Tour.find({ isActive: true }), req.query)
    .filter()
    .sort()
    .limitFields()
    .paginate();

  // Execute query
  const tours = await features.query
    .populate("country", "name slug")
    .populate("startDates.adventureLeader", "name email avatar phone nationality role");

  // Get total count for pagination
  const total = await Tour.countDocuments({ isActive: true });

  res.status(200).json({
    status: "success",
    results: tours.length,
    total,
    data: {
      tours,
    },
  });
});

const getTour = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  let query = { isActive: true };

  // Check if the parameter is a valid ObjectId (24 character hex string)
  const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(id);

  if (isValidObjectId) {
    // If it's a valid ObjectId, check _id, slug and tourCode
    query.$or = [{ _id: id }, { slug: id }, { tourCode: id }];
  } else {
    // If it's not a valid ObjectId, check both slug and tourCode
    query.$or = [{ slug: id }, { tourCode: id }];
  }

  const tour = await Tour.findOne(query)
    .populate({
      path: "country",
      populate: {
        path: "continent",
        select: "name slug",
      },
    })
    .populate({
      path: "reviews",
      match: { isVisible: true, moderationStatus: "approved" },
      select: "rating title comment user createdAt wouldRecommend",
      populate: {
        path: "user",
        select: "name avatar",
      },
    })
    .populate("itinerary.activities")
    .populate("itinerary.optionalActivities")
    .populate("plantingLocation")
    .populate("hotel")
    .populate("preTripHotel")
    .populate("postTripHotel")
    .populate({
      path: "affiliates",
      populate: {
        path: "user",
        select: "name email avatar",
      },
    });

  if (!tour) {
    return next(new AppError("No tour found with that ID", 404));
  }

  res.status(200).json({
    status: "success",
    data: {
      tour,
    },
  });
});

const getToursByCountry = catchAsync(async (req, res, next) => {
  // Find country first
  const country = await Country.findOne({
    $or: [{ _id: req.params.countryId }, { slug: req.params.countryId }],
  });

  if (!country) {
    return next(new AppError("No country found with that ID", 404));
  }

  // Build query for tours in this country
  const features = new APIFeatures(
    Tour.find({ country: country._id, isActive: true }),
    req.query,
  )
    .filter()
    .sort()
    .limitFields()
    .paginate();

  const tours = await features.query.populate("country", "name slug");
  const total = await Tour.countDocuments({
    country: country._id,
    isActive: true,
  });

  res.status(200).json({
    status: "success",
    results: tours.length,
    total,
    country: {
      _id: country._id,
      name: country.name,
      slug: country.slug,
      description: country.description,
    },
    data: {
      tours,
    },
  });
});

const getFeaturedTours = catchAsync(async (req, res, next) => {
  const tours = await Tour.find({ isFeatured: true, isActive: true })
    .sort("-ratingsAverage -ratingsQuantity")
    .limit(10)
    .populate("country", "name slug")
    .select(
      "name slug summary price ratingsAverage ratingsQuantity duration images",
    );

  res.status(200).json({
    status: "success",
    results: tours.length,
    data: {
      tours,
    },
  });
});

const getPopularTours = catchAsync(async (req, res, next) => {
  const tours = await Tour.getPopularTours(10);

  res.status(200).json({
    status: "success",
    results: tours.length,
    data: {
      tours,
    },
  });
});

const searchTours = catchAsync(async (req, res, next) => {
  const { q, country, duration, priceMin, priceMax, difficulty, travelStyle, interests } =
    req.query;

  const query = { isActive: true };

  // Text search
  if (q) {
    query.$text = { $search: q };
  }

  // Country filter
  if (country) {
    const countryDoc = await Country.findOne({
      $or: [{ _id: country }, { slug: country }],
    });
    if (countryDoc) {
      query.country = countryDoc._id;
    }
  }

  // Duration filter
  if (duration) {
    const [min, max] = duration.split("-").map(Number);
    query["duration.days"] = { $gte: min, $lte: max };
  }

  // Price filter
  if (priceMin || priceMax) {
    query["price.amount"] = {};
    if (priceMin) query["price.amount"].$gte = Number(priceMin);
    if (priceMax) query["price.amount"].$lte = Number(priceMax);
  }

  // Difficulty filter
  if (difficulty) {
    query.difficulty = difficulty;
  }

  // Travel style filter
  if (travelStyle) {
    query.travelStyle = travelStyle;
  }

  // Interests filter
  if (interests) {
    query.interests = interests;
  } else if (req.query.interest) {
    query.interests = req.query.interest;
  }

  const features = new APIFeatures(Tour.find(query), req.query)
    .sort()
    .limitFields()
    .paginate();

  const tours = await features.query.populate("country", "name slug");
  const total = await Tour.countDocuments(query);

  res.status(200).json({
    status: "success",
    results: tours.length,
    total,
    data: {
      tours,
    },
  });
});

const checkTourAvailability = catchAsync(async (req, res, next) => {
  const { tourId, date } = req.params;

  const tour = await Tour.findById(tourId);
  if (!tour) {
    return next(new AppError("Tour not found", 404));
  }

  const availability = tour.checkAvailability(date);

  res.status(200).json({
    status: "success",
    data: {
      available: !!availability,
      availability,
    },
  });
});

const getTourStats = catchAsync(async (req, res, next) => {
  const stats = await Tour.aggregate([
    {
      $match: { isActive: true },
    },
    {
      $group: {
        _id: "$difficulty",
        numTours: { $sum: 1 },
        avgRating: { $avg: "$ratingsAverage" },
        avgPrice: { $avg: "$price.amount" },
        minPrice: { $min: "$price.amount" },
        maxPrice: { $max: "$price.amount" },
      },
    },
    { $sort: { avgPrice: 1 } },
  ]);

  res.status(200).json({
    status: "success",
    data: {
      stats,
    },
  });
});

// Admin only routes
const createTour = catchAsync(async (req, res, next) => {
  const newTour = await Tour.create(req.body);

  res.status(201).json({
    status: "success",
    data: {
      tour: newTour,
    },
  });
});

const updateTour = catchAsync(async (req, res, next) => {
  const tour = await Tour.findById(req.params.id);

  if (!tour) {
    return next(new AppError("No tour found with that ID", 404));
  }

  // Update fields from req.body
  Object.keys(req.body).forEach((key) => {
    tour[key] = req.body[key];
  });

  // Explicitly mark startDates as modified if they are present in the update
  if (req.body.startDates) {
    tour.markModified("startDates");
  }

  await tour.save({ runValidators: true });

  res.status(200).json({
    status: "success",
    data: {
      tour,
    },
  });
});

const deleteTour = catchAsync(async (req, res, next) => {
  const tour = await Tour.findByIdAndDelete(req.params.id);

  if (!tour) {
    return next(new AppError("No tour found with that ID", 404));
  }

  res.status(204).json({
    status: "success",
    data: null,
  });
});

const getMyAssignedTours = catchAsync(async (req, res, next) => {
  const Affiliate = require("../models/Affiliate");

  let queryFilter = {};

  if (req.user.role === "admin") {
    if (req.query.leaderId) {
      queryFilter = {
        $or: [
          { adventureLeaders: req.query.leaderId },
          { "startDates.adventureLeader": req.query.leaderId },
        ],
      };
    } else if (req.query.affiliateId) {
      queryFilter = { affiliates: req.query.affiliateId };
    }
  } else {
    // For Adventure Leaders / Guides / Affiliates:
    const affiliate = await Affiliate.findOne({ user: req.user.id });
    const orConditions = [
      { adventureLeaders: req.user.id },
      { "startDates.adventureLeader": req.user.id },
    ];
    if (affiliate) {
      orConditions.push({ affiliates: affiliate._id });
    }
    queryFilter = { $or: orConditions };
  }

  const features = new APIFeatures(Tour.find(queryFilter), req.query)
    .filter()
    .sort()
    .limitFields()
    .paginate();

  const tours = await features.query
    .populate("country", "name slug")
    .populate("travelStyle", "name slug")
    .populate("adventureLeaders", "name email avatar phone nationality role")
    .populate("startDates.adventureLeader", "name email avatar phone nationality role")
    .populate({
      path: "affiliates",
      populate: { path: "user", select: "name email avatar" },
    });

  const total = await Tour.countDocuments(queryFilter);

  let resultTours = tours;
  if (req.user.role !== "admin") {
    resultTours = tours.map((t) => {
      const tObj = t.toObject ? t.toObject() : t;
      tObj.startDates = (tObj.startDates || []).filter((sd) => {
        if (!sd.adventureLeader) return false;
        const leadId = sd.adventureLeader._id
          ? sd.adventureLeader._id.toString()
          : sd.adventureLeader.toString();
        return leadId === req.user.id.toString();
      });
      return tObj;
    });
  }

  res.status(200).json({
    status: "success",
    results: resultTours.length,
    total,
    data: {
      tours: resultTours,
    },
  });
});

const assignDepartureLeader = catchAsync(async (req, res, next) => {
  const { tourId, departureId } = req.params;
  const { leaderId } = req.body;

  const tour = await Tour.findById(tourId);
  if (!tour) {
    return next(new AppError("Tour not found", 404));
  }

  // Find departure by _id or by matching startDate string
  const departure = (tour.startDates || []).find((d) => {
    if (d._id && d._id.toString() === departureId) return true;
    if (d.startDate) {
      const dStr = new Date(d.startDate).toISOString().split("T")[0];
      const matchStr = departureId.includes("T") ? departureId.split("T")[0] : departureId;
      return dStr === matchStr;
    }
    return false;
  });

  if (!departure) {
    return next(new AppError("Departure date not found in this tour", 404));
  }

  departure.adventureLeader = leaderId || null;

  // If assigning a leader, also ensure they are in tour.adventureLeaders for permissions
  if (leaderId) {
    const leaderExists = (tour.adventureLeaders || []).some(
      (id) => id.toString() === leaderId.toString()
    );
    if (!leaderExists) {
      tour.adventureLeaders.push(leaderId);
    }
  }

  await tour.save();

  const updatedTour = await Tour.findById(tourId)
    .populate("country", "name slug")
    .populate("travelStyle", "name slug")
    .populate("startDates.adventureLeader", "name email avatar phone nationality role")
    .populate("adventureLeaders", "name email avatar phone nationality role");

  res.status(200).json({
    status: "success",
    message: leaderId
      ? "Adventure leader assigned to departure"
      : "Adventure leader removed from departure",
    data: {
      tour: updatedTour,
      departure: updatedTour.startDates.find((d) => d._id.toString() === departure._id.toString()),
    },
  });
});

const getAdventureLeaders = catchAsync(async (req, res, next) => {
  const User = require("../models/User");
  const leaders = await User.find({
    role: { $in: ["adventure_leader", "guide", "leader", "partner"] },
  })
    .select("name email avatar phone nationality role")
    .sort("name")
    .lean();

  res.status(200).json({
    status: "success",
    results: leaders.length,
    data: {
      leaders,
    },
  });
});

module.exports = {
  getAllTours,
  getTour,
  getToursByCountry,
  getFeaturedTours,
  getPopularTours,
  searchTours,
  checkTourAvailability,
  getTourStats,
  createTour,
  updateTour,
  deleteTour,
  getMyAssignedTours,
  assignDepartureLeader,
  getAdventureLeaders,
};
