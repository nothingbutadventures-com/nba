const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const compression = require("compression");
const rateLimit = require("express-rate-limit");
const mongoSanitize = require("express-mongo-sanitize");
const xss = require("xss-clean");
const hpp = require("hpp");
const cookieParser = require("cookie-parser");

const connectDB = require("./config/database");
const globalErrorHandler = require("./middleware/errorHandler");
const AppError = require("./utils/AppError");
const logger = require("./utils/logger");

// Route imports
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const countryRoutes = require("./routes/countryRoutes");
const tourRoutes = require("./routes/tourRoutes");
const bookingRoutes = require("./routes/bookingRoutes");
const reviewRoutes = require("./routes/reviewRoutes");
const blogRoutes = require("./routes/blogRoutes");
const continentRoutes = require("./routes/continentRoutes");
const travelStyleRoutes = require("./routes/travelStyleRoutes");
const interestRoutes = require("./routes/interestRoutes");
const physicalRatingRoutes = require("./routes/physicalRatingRoutes");
const tripTypeRoutes = require("./routes/tripTypeRoutes");
const discountRoutes = require("./routes/discountRoutes");
const holdSpaceRoutes = require("./routes/holdSpaceRoutes");
const queryRoutes = require("./routes/queryRoutes");
const promoCodeRoutes = require("./routes/promoCodeRoutes");
const activityRoutes = require("./routes/activityRoutes");
const plantingLocationRoutes = require("./routes/plantingLocationRoutes");
const installmentRoutes = require("./routes/installmentRoutes");
const hotelRoutes = require("./routes/hotelRoutes");
const lifetimeDepositRoutes = require("./routes/lifetimeDepositRoutes");
const jobRoutes = require("./routes/jobRoutes");
const affiliateRoutes = require("./routes/affiliateRoutes");
const tourExecutionRoutes = require("./routes/tourExecutionRoutes");


// Load environment variables
require("dotenv").config();

const app = express();

// Connect to MongoDB
connectDB();

// Trust proxy for rate limiting
app.set("trust proxy", 1);

// Global middleware
app.use(helmet()); // Security headers
app.use(compression()); // Compress responses

// Rate limiting
const limiter = rateLimit({
  max: process.env.MAX_REQUESTS_PER_HOUR || 100,
  windowMs: 60 * 60 * 1000, // 1 hour
  message: "Too many requests from this IP, please try again in an hour!",
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api", limiter);

// CORS configuration
app.use(
  cors({
    origin: [
      "https://nothingbutadventures.com",
      "https://www.nothingbutadventures.com",
      "http://localhost:3000",
      ...(process.env.CLIENT_URL ? [process.env.CLIENT_URL] : [])
    ],
    credentials: true,
  }),
);

// Logging
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());

// Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// Data sanitization against XSS
app.use(xss());

// Prevent parameter pollution
app.use(
  hpp({
    whitelist: [
      "duration",
      "ratingsQuantity",
      "ratingsAverage",
      "maxGroupSize",
      "difficulty",
      "price",
    ],
  }),
);

// Root route for testing
app.get("/", (req, res) => {
  res.send("API is running...");
});

// Health check route
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "success",
    message: "Nextrip API is running!",
    timestamp: new Date().toISOString(),
  });
});

// API routes
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/countries", countryRoutes);
app.use("/api/v1/tours", tourRoutes);
app.use("/api/v1/bookings", bookingRoutes);
app.use("/api/v1/reviews", reviewRoutes);
app.use("/api/v1/blogs", blogRoutes);
app.use("/api/v1/continents", continentRoutes);
app.use("/api/v1/travel-styles", travelStyleRoutes);
app.use("/api/v1/interests", interestRoutes);
app.use("/api/v1/physical-ratings", physicalRatingRoutes);
app.use("/api/v1/trip-types", tripTypeRoutes);
app.use("/api/v1/discounts", discountRoutes);
app.use("/api/v1/hold-spaces", holdSpaceRoutes);
app.use("/api/v1/queries", queryRoutes);
app.use("/api/v1/promo-codes", promoCodeRoutes);
app.use("/api/v1/activities", activityRoutes);
app.use("/api/v1/planting-locations", plantingLocationRoutes);
app.use("/api/v1/installments", installmentRoutes);
app.use("/api/v1/hotels", hotelRoutes);
app.use("/api/v1/lifetime-deposits", lifetimeDepositRoutes);
app.use("/api/v1/jobs", jobRoutes);
app.use("/api/v1/affiliates", affiliateRoutes);
app.use("/api/v1/tour-execution", tourExecutionRoutes);


// Handle undefined routes
app.all("*", (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// Global error handling middleware
app.use(globalErrorHandler);

const PORT = process.env.PORT || 3001;

if (require.main === module) {
  const server = app.listen(PORT, () => {
    logger.info(
      `Server running in ${process.env.NODE_ENV} mode on port ${PORT}`,
    );
    console.log(`🚀 Server running on http://localhost:${PORT}`);

    // Start installment deadline checker (runs every 6 hours)
    const { checkInstallmentDeadlines } = require("./controllers/installmentController");
    const SIX_HOURS = 6 * 60 * 60 * 1000;
    // Run once on startup (after 30 seconds to let DB connect)
    setTimeout(() => checkInstallmentDeadlines().catch(console.error), 30000);
    // Then every 6 hours
    setInterval(() => checkInstallmentDeadlines().catch(console.error), SIX_HOURS);
    console.log("⏰ Installment deadline checker scheduled (every 6 hours)");

    // Start hold space deadline checker (runs every 15 minutes)
    const { checkHoldSpaceDeadlines } = require("./controllers/holdSpaceController");
    const FIFTEEN_MINUTES = 15 * 60 * 1000;
    // Run once on startup (after 45 seconds to let DB connect)
    setTimeout(() => checkHoldSpaceDeadlines().catch(console.error), 45000);
    // Then every 15 minutes
    setInterval(() => checkHoldSpaceDeadlines().catch(console.error), FIFTEEN_MINUTES);
    console.log("⏰ Hold space deadline checker scheduled (every 15 minutes)");

    // Start abandoned checkout checker (runs every 15 minutes)
    const { checkAbandonedCheckouts } = require("./controllers/bookingController");
    // Run once on startup (after 60 seconds to let DB connect)
    setTimeout(() => checkAbandonedCheckouts().catch(console.error), 60000);
    // Then every 15 minutes
    setInterval(() => checkAbandonedCheckouts().catch(console.error), FIFTEEN_MINUTES);
    console.log("⏰ Abandoned checkout checker scheduled (every 15 minutes)");
  });

  process.on("unhandledRejection", (err, promise) => {
    logger.error("Unhandled Rejection at:", promise, "reason:", err);
    console.log("UNHANDLED REJECTION! 💥 Shutting down...");
    server.close(() => {
      process.exit(1);
    });
  });
} else {
  // Firebase Cloud Functions export with performance optimizations
  const { onRequest } = require("firebase-functions/v2/https");
  const { setGlobalOptions } = require("firebase-functions/v2");

  // Set global options for better performance
  setGlobalOptions({
    maxInstances: 10,
    timeoutSeconds: 60,
    memory: "512MiB",
  });

  module.exports.api = onRequest(
    {
      // Keep at least 1 instance warm to avoid cold starts
      minInstances: 1,
      // Allow concurrent requests on same instance
      concurrency: 80,
      // Increase memory for better performance
      memory: "512MiB",
      // Set timeout
      timeoutSeconds: 60,
      // Set region (change to your preferred region)
      region: "us-central1",
    },
    app
  );

  // Fallback for older Firebase versions
  if (typeof module.exports.api === "undefined") {
    exports.api = onRequest(
      {
        minInstances: 1,
        concurrency: 80,
        memory: "512MiB",
        timeoutSeconds: 60,
      },
      app
    );
  }
}

exports.app = app;
