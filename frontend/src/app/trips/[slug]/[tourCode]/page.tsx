"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import Image from "next/image";
import TourDetailLoading from "./loading";
import {
  CalendarCheck,
  Clock,
  Heart,
  CaretDown,
  Star,
  ArrowUpRight,
  Plus,
  CheckCircle,
  Armchair,
  X,
  CaretLeft,
  CaretRight,
  ShareNetwork,
  LockKey,
  BookmarkSimple,
} from "@phosphor-icons/react";
import ReviewsSection from "@/components/ReviewsSection";
import AuthModal from "@/components/AuthModal";
import RecentlyViewedSection from "@/components/RecentlyViewedSection";
import FaqSection from "@/components/FaqSection";

interface Tour {
  _id: string;
  name: string;
  slug: string;
  tourCode: string;
  summary: string;
  description: string;
  descriptionImage?: string;
  itineraryMapImage?: string;
  whatsIncluded?: string;
  transportation?: string;
  transport?: string;
  staffExperts?: string;
  meals?: string;
  accommodation?: string;
  ownRoomAvailable?: boolean;
  wifiAvailable?: boolean;
  interests?: string[];
  price: {
    amount: number;
    currency: string;
    discountPercent?: number;
    ownRoomPrice?: number;
    bookingType?: "Percentage" | "Amount";
    bookingPercentage?: number;
    bookingAmount?: number;
  };
  duration: {
    days: number;
    nights: number;
  };
  maxGroupSize: number;
  physicalRating: {
    level: number;
    description?: string;
  };
  ratingsAverage: number;
  ratingsQuantity: number;
  images: Array<{
    url: string;
    caption: string;
    isPrimary: boolean;
  }>;
  itinerary: Array<{
    day: number;
    title: string;
    description: string;
    importantNote?: string;
    activities: Array<{
      name?: string;
      title?: string;
      description: string;
      placeName?: string;
      location?: string;
      duration: string;
      icon: string;
      price?: number;
      isFree?: boolean;
    }>;
    optionalActivities: Array<{
      name: string;
      title?: string;
      price:
        | number
        | {
            amount: number;
            currency: string;
          };
      place: string;
      description: string;
      duration: string;
      icon: string;
    }>;
    accommodations: Array<{
      name: string;
      type: string;
      rating?: number;
      description?: string;
    }>;
    meals?: {
      breakfast: boolean;
      lunch: boolean;
      dinner: boolean;
    };
  }>;
  highlights: string[];
  location: {
    startCity: string;
    endCity: string;
    visitedCities: string[];
  };
  country: {
    _id: string;
    name: string;
    slug: string;
    continent?: {
      _id: string;
      name: string;
      slug: string;
    };
  };
  travelStyle: string;
  serviceLevel: string;
  startDates: Array<{
    _id?: string;
    startDate: string;
    endDate: string;
    availableSpots: number;
    discount: string;
    price?: {
      amount: number;
      currency: string;
    };
    isActive: boolean;
  }>;
  ageRequirement: {
    min: number;
    max: number;
    description?: string;
  };
  seo?: {
    metaTitle?: string;
    metaDescription?: string;
    keywords?: string[];
  };
  beforeYouBook?: {
    isTourForMe?: string;
    visaInformation?: string;
    accommodation?: string;
    joiningPoint?: string;
  };
  preTripHotel?: {
    _id: string;
    name: string;
    location: string;
    privateRoomPrice: number;
    sharedRoomPrice?: number;
    image?: string;
  };
  postTripHotel?: {
    _id: string;
    name: string;
    location: string;
    privateRoomPrice: number;
    sharedRoomPrice?: number;
    image?: string;
  };
  hotel?: {
    _id: string;
    name: string;
    location: string;
    privateRoomPrice: number;
    sharedRoomPrice?: number;
    image?: string;
  };
}

const physicalRatings = [
  { level: 1, name: "Easy" },
  { level: 2, name: "Light" },
  { level: 3, name: "Average" },
  { level: 4, name: "Demanding" },
  { level: 5, name: "Challenging" },
];

export default function TourDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug as string;
  const tourCode = params?.tourCode as string;

  const [tour, setTour] = useState<Tour | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<
    "overview" | "details" | "itinerary"
  >("overview");
  const [expandedItineraryDays, setExpandedItineraryDays] = useState<number[]>([
    1,
  ]);
  const [expandedOptionalDays, setExpandedOptionalDays] = useState<number[]>(
    [],
  );
  const [expandedPremiumDays, setExpandedPremiumDays] = useState<number[]>([1]);
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const [filterDealsOnly, setFilterDealsOnly] = useState(false);
  const [priceSortOrder, setPriceSortOrder] = useState<
    "low-to-high" | "high-to-low"
  >("low-to-high");
  const [selectedDateFilter, setSelectedDateFilter] = useState<string>("all");
  const [priceSortFilter, setPriceSortFilter] = useState<"low" | "high">("low");
  const [discountsMap, setDiscountsMap] = useState<{ [name: string]: number }>(
    {},
  );
  const [currentDay, setCurrentDay] = useState(1);
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [relatedTours, setRelatedTours] = useState<Tour[]>([]);
  const [calendarOffset, setCalendarOffset] = useState<number>(0);
  const [activeDepartureIndex, setActiveDepartureIndex] = useState<number>(0);

  // What's Included Tabs
  const [includedTab, setIncludedTab] = useState<
    "nba" | "leader" | "transport" | "accommodation" | "meals"
  >("nba");

  // Modals & Lightbox
  const [showGalleryModal, setShowGalleryModal] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [showFullItineraryModal, setShowFullItineraryModal] = useState(false);
  const [showHoldModal, setShowHoldModal] = useState(false);
  const [showHoldAuthModal, setShowHoldAuthModal] = useState(false);
  const [holdSelectedDate, setHoldSelectedDate] = useState<string | null>(null);
  const [holdLoading, setHoldLoading] = useState(false);
  const [holdMessage, setHoldMessage] = useState<{
    text: string;
    type: "success" | "error";
  } | null>(null);

  // Sticky footer & refs
  const [showStickyFooter, setShowStickyFooter] = useState(false);
  const [showDayOverview, setShowDayOverview] = useState(false);
  const bookingPanelRef = useRef<HTMLElement>(null);
  const recommendedToursRef = useRef<HTMLDivElement>(null);
  const itinerarySectionRef = useRef<HTMLDivElement>(null);
  const dayRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});
  const monthScrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const updateScrollButtons = () => {
    if (monthScrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = monthScrollRef.current;
      setCanScrollLeft(scrollLeft > 5);
      setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 5);
    }
  };

  const handleScrollMonths = (direction: "left" | "right") => {
    if (monthScrollRef.current) {
      const scrollAmount = 140;
      monthScrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
      setTimeout(updateScrollButtons, 350);
    }
  };

  useEffect(() => {
    const fetchTour = async () => {
      try {
        setLoading(true);

        // Fetch discounts first to build the lookup map
        try {
          const discountsResponse = await fetch(`${api.baseURL}/discounts`);
          if (discountsResponse.ok) {
            const discountsData = await discountsResponse.json();
            const discounts =
              discountsData.data?.discounts || discountsData.discounts || [];
            const map: { [name: string]: number } = {};
            discounts.forEach((d: { name: string; percentage: number }) => {
              if (d.name && d.percentage) {
                map[d.name] = d.percentage;
              }
            });
            setDiscountsMap(map);
          }
        } catch (e) {
          console.error("Failed to load discounts map", e);
        }

        const res = await fetch(`${api.baseURL}/tours/${slug}`);
        if (!res.ok) throw new Error("Tour not found");
        const json = await res.json();
        const loadedTour = json.data?.tour || json.data || json.tour || json;
        setTour(loadedTour);

        // Save to recently viewed tours in localStorage
        try {
          if (
            loadedTour &&
            (loadedTour._id || loadedTour.tourCode || loadedTour.slug)
          ) {
            const rawStored = localStorage.getItem("nba-recently-viewed");
            const existing: any[] = rawStored ? JSON.parse(rawStored) : [];
            const filtered = existing.filter(
              (t) =>
                t._id &&
                t._id !== loadedTour._id &&
                t.tourCode &&
                t.tourCode !== loadedTour.tourCode &&
                t.slug &&
                t.slug !== loadedTour.slug,
            );
            localStorage.setItem(
              "nba-recently-viewed",
              JSON.stringify([loadedTour, ...filtered].slice(0, 10)),
            );
          }
        } catch (e) {
          console.error("Failed to save recently viewed tour", e);
        }

        // Fetch related/all tours
        try {
          const relRes = await fetch(`${api.baseURL}/tours?limit=8`);
          if (relRes.ok) {
            const relJson = await relRes.json();
            setRelatedTours(relJson.data?.tours || relJson.data || []);
          }
        } catch (e) {
          console.error("Failed to load related tours", e);
        }
      } catch (err: any) {
        setError(err.message || "Failed to load tour details");
      } finally {
        setLoading(false);
      }
    };

    if (slug && tourCode) {
      fetchTour();
    }
  }, [slug, tourCode]);

  // Scroll-driven sticky horizontal moments
  const momentsSectionRef = useRef<HTMLDivElement>(null);
  const [momentsProgress, setMomentsProgress] = useState(0);
  const [windowWidth, setWindowWidth] = useState(1200);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          // Moments scroll progress
          if (momentsSectionRef.current) {
            const rect = momentsSectionRef.current.getBoundingClientRect();
            const totalScrollable =
              momentsSectionRef.current.offsetHeight - window.innerHeight;
            if (totalScrollable > 0) {
              const progress = Math.max(
                0,
                Math.min(1, -rect.top / totalScrollable),
              );
              setMomentsProgress(progress);
            }
          }

          // Sticky footer calculation
          if (bookingPanelRef.current && recommendedToursRef.current) {
            const bookingPanelRect =
              bookingPanelRef.current.getBoundingClientRect();
            const recommendedRect =
              recommendedToursRef.current.getBoundingClientRect();
            const isBookingPanelPassed = bookingPanelRect.bottom < 0;
            const isBeforeRecommended =
              recommendedRect.top > window.innerHeight;
            setShowStickyFooter(isBookingPanelPassed && isBeforeRecommended);
          }

          // Day Overview visibility calculation (appears when Itinerary is scrolled to the top)
          if (itinerarySectionRef.current) {
            const itineraryRect =
              itinerarySectionRef.current.getBoundingClientRect();
            setShowDayOverview(
              itineraryRect.top <= 140 && itineraryRect.bottom > 100,
            );
          }
          ticking = false;
        });
        ticking = true;
      }
    };

    // Run immediately
    handleScroll();

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, [loading, tour]);

  const getDiscountPercentage = (discountVal?: any): number => {
    if (!discountVal) return 0;
    if (typeof discountVal === "number") return discountVal;
    if (typeof discountVal === "string") {
      if (discountsMap[discountVal]) return discountsMap[discountVal];
      const match = discountVal.match(/(\d+)%/);
      if (match) return parseInt(match[1], 10);
      const num = parseFloat(discountVal);
      if (!isNaN(num) && num > 0 && num <= 100) return num;
    }
    return 0;
  };

  const formatMeals = (
    mealsVal: any,
    defaultText: string = "Breakfast | Dinner",
  ): string => {
    if (!mealsVal) return defaultText;
    if (typeof mealsVal === "string") return mealsVal;
    if (typeof mealsVal === "object") {
      const parts = [];
      if (mealsVal.breakfast) parts.push("Breakfast");
      if (mealsVal.lunch) parts.push("Lunch");
      if (mealsVal.dinner) parts.push("Dinner");
      return parts.length > 0 ? parts.join(" | ") : defaultText;
    }
    return String(mealsVal);
  };

  const handleWishlistToggle = () => {
    setIsInWishlist(!isInWishlist);
  };

  const handleHoldSpace = async (specificDate?: string) => {
    const targetDate = specificDate || holdSelectedDate;
    if (!targetDate) return;

    const token = localStorage.getItem("token");
    if (!token) {
      setShowHoldAuthModal(true);
      return;
    }

    try {
      setHoldLoading(true);
      setHoldMessage(null);
      const res = await fetch(`${api.baseURL}/hold-spaces`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          tourId: tour?._id,
          startDate: targetDate,
          spaces: 1,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to hold space");
      setHoldMessage({
        text: "Space held successfully for 48 hours!",
        type: "success",
      });
      setTimeout(() => setShowHoldModal(false), 2000);
    } catch (err: any) {
      setHoldMessage({
        text: err.message || "Failed to hold space",
        type: "error",
      });
    } finally {
      setHoldLoading(false);
    }
  };

  const toggleItineraryDay = (dayNum: number) => {
    setExpandedItineraryDays((prev) =>
      prev.includes(dayNum)
        ? prev.filter((d) => d !== dayNum)
        : [...prev, dayNum],
    );
  };

  const toggleOptionalDay = (dayNum: number) => {
    setExpandedOptionalDays((prev) =>
      prev.includes(dayNum)
        ? prev.filter((d) => d !== dayNum)
        : [...prev, dayNum],
    );
  };

  const togglePremiumDay = (dayNum: number) => {
    setExpandedPremiumDays((prev) =>
      prev.includes(dayNum)
        ? prev.filter((d) => d !== dayNum)
        : [...prev, dayNum],
    );
  };

  const scrollToModalDay = (dayNum: number) => {
    setCurrentDay(dayNum);
    const element = document.getElementById(`itinerary-day-${dayNum}`);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  if (loading) return <TourDetailLoading />;
  if (error || !tour) {
    return (
      <div className="min-h-screen flex items-center justify-center font-outfit px-4">
        <div className="text-center max-w-md">
          <h2 className="text-2xl font-bold text-[#1A1A1A] mb-3">
            Tour Not Found
          </h2>
          <p className="text-gray-500 mb-6 font-light">
            {error || "We couldn't find the adventure you're looking for."}
          </p>
          <Link
            href="/trips"
            className="bg-[#1A1A1A] text-white px-6 py-3 rounded-full font-medium hover:bg-black transition text-sm"
          >
            Browse All Tours
          </Link>
        </div>
      </div>
    );
  }

  // Price calculations
  const basePrice = tour.price?.amount || 599;
  const currency = tour.price?.currency || "USD";
  const sortedDates = [...(tour.startDates || [])].sort(
    (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime(),
  );

  let bestDiscount = tour.price?.discountPercent || 0;
  let bestDealDate = sortedDates[0];

  sortedDates.forEach((d) => {
    const disc = getDiscountPercentage(d.discount);
    if (disc > bestDiscount) {
      bestDiscount = disc;
      bestDealDate = d;
    }
  });

  const discountedPrice =
    bestDiscount > 0 ? basePrice * (1 - bestDiscount / 100) : basePrice;
  const depositAmount = tour.price?.bookingAmount || 200;

  // Real deal departure date calculation
  const dealDeparture =
    sortedDates.find((d) => getDiscountPercentage(d.discount) > 0) ||
    sortedDates[0];
  const dealDiscountPercent = dealDeparture
    ? getDiscountPercentage(dealDeparture.discount) || bestDiscount
    : bestDiscount;
  const dealDepartureDateStr = dealDeparture
    ? new Date(dealDeparture.startDate).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "Jan 22, 2026";
  const promoCodeStr = tour.tourCode ? `NBA${tour.tourCode}` : "NBA2608LA20";

  // Dynamic months & departure filtering for Check Availability
  const validStartDates = (tour.startDates || []).filter((d) => d.startDate);

  const monthsMap: {
    [key: string]: { key: string; label: string; minPrice: number; date: Date };
  } = {};

  validStartDates.forEach((d) => {
    const dateObj = new Date(d.startDate);
    if (isNaN(dateObj.getTime())) return;
    const key = dateObj.toLocaleDateString("en-US", {
      month: "short",
      year: "numeric",
    });
    const base = d.price?.amount || basePrice;
    const disc = getDiscountPercentage(d.discount);
    const effective = disc > 0 ? Math.round(base * (1 - disc / 100)) : base;

    if (monthsMap[key]) {
      monthsMap[key].minPrice = Math.min(monthsMap[key].minPrice, effective);
    } else {
      monthsMap[key] = {
        key,
        label: key,
        minPrice: effective,
        date: new Date(dateObj.getFullYear(), dateObj.getMonth(), 1),
      };
    }
  });

  const availableMonths = Object.values(monthsMap).sort(
    (a, b) => a.date.getTime() - b.date.getTime(),
  );

  const totalDealsCount = validStartDates.filter(
    (d) => getDiscountPercentage(d.discount) > 0,
  ).length;

  let displayedDepartures = [...validStartDates];
  if (selectedMonth) {
    displayedDepartures = displayedDepartures.filter((d) => {
      const dateObj = new Date(d.startDate);
      const key = dateObj.toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
      });
      return key === selectedMonth;
    });
  }

  if (filterDealsOnly) {
    displayedDepartures = displayedDepartures.filter(
      (d) => getDiscountPercentage(d.discount) > 0,
    );
  }

  displayedDepartures.sort((a, b) => {
    const baseA = a.price?.amount || basePrice;
    const discA = getDiscountPercentage(a.discount);
    const priceA = discA > 0 ? baseA * (1 - discA / 100) : baseA;

    const baseB = b.price?.amount || basePrice;
    const discB = getDiscountPercentage(b.discount);
    const priceB = discB > 0 ? baseB * (1 - discB / 100) : baseB;

    return priceSortOrder === "low-to-high" ? priceA - priceB : priceB - priceA;
  });

  const galleryImages = [
    tour.descriptionImage || tour.images?.[0]?.url || "/mountain_hikers.png",
    ...(tour.images?.map((i) => i.url) || []),
    "/mountain_hikers.png",
    "/mountain_hikers.png",
    "/mountain_hikers.png",
  ];

  // Dynamic Moments derived from tour itinerary activities (deduplicated)
  const momentsData: Array<{
    day: number;
    tag: string;
    title: string;
    desc: string;
    image: string;
  }> = (() => {
    if (!tour?.itinerary || tour.itinerary.length === 0) return [];

    const extracted: Array<{
      day: number;
      tag: string;
      title: string;
      desc: string;
      image: string;
    }> = [];
    const seenTitles = new Set<string>();

    const defaultImages = [
      tour.descriptionImage ||
        tour.images?.[0]?.url ||
        "https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?q=80&w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1551632811-561732d1e306?q=80&w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1548013146-72479768bada?q=80&w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1524492412937-b28074a5d7da?q=80&w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1516426122078-c23e76319801?q=80&w=800&auto=format&fit=crop",
    ];

    tour.itinerary.forEach((dayItem) => {
      const dayNum = dayItem.day || 1;
      const dayImages = (dayItem as any).images || [];

      // 1. Add all activities from this day
      if (Array.isArray(dayItem.activities) && dayItem.activities.length > 0) {
        dayItem.activities.forEach((act: any, actIdx: number) => {
          const title = (
            act.title ||
            act.name ||
            `Day ${dayNum} Adventure`
          ).trim();
          const normKey = title.toLowerCase();
          if (seenTitles.has(normKey)) return;
          seenTitles.add(normKey);

          const desc =
            act.description ||
            dayItem.description ||
            "Experience an unforgettable adventure highlight on this tour.";
          const img =
            act.coverImage ||
            act.image ||
            (Array.isArray(act.images) && act.images[0]) ||
            dayImages[actIdx] ||
            dayImages[0] ||
            tour.images?.[extracted.length % (tour.images?.length || 1)]?.url ||
            defaultImages[extracted.length % defaultImages.length];

          extracted.push({
            day: dayNum,
            tag: act.location || dayItem.title || "Included",
            title,
            desc,
            image: img,
          });
        });
      }

      // 2. Also add optional activities if any
      if (
        Array.isArray(dayItem.optionalActivities) &&
        dayItem.optionalActivities.length > 0
      ) {
        dayItem.optionalActivities.forEach((act: any, actIdx: number) => {
          const title = (
            act.title ||
            act.name ||
            `Day ${dayNum} Optional Activity`
          ).trim();
          const normKey = title.toLowerCase();
          if (seenTitles.has(normKey)) return;
          seenTitles.add(normKey);

          const desc =
            act.description ||
            dayItem.description ||
            "Optional curated experience to elevate your journey.";
          const img =
            act.coverImage ||
            act.image ||
            dayImages[actIdx] ||
            dayImages[0] ||
            tour.images?.[extracted.length % (tour.images?.length || 1)]?.url ||
            defaultImages[extracted.length % defaultImages.length];

          extracted.push({
            day: dayNum,
            tag: act.place || "Add-on",
            title,
            desc,
            image: img,
          });
        });
      }

      // 3. If day has no activities array, extract the day itself
      if (
        (!dayItem.activities || dayItem.activities.length === 0) &&
        (!dayItem.optionalActivities ||
          dayItem.optionalActivities.length === 0) &&
        (dayItem.title || dayItem.description)
      ) {
        const title = (dayItem.title || `Day ${dayNum} Highlights`).trim();
        const normKey = title.toLowerCase();
        if (!seenTitles.has(normKey)) {
          seenTitles.add(normKey);
          const desc =
            dayItem.description ||
            "Immerse yourself in authentic local experiences and breathtaking sights.";
          const img =
            dayImages[0] ||
            tour.images?.[extracted.length % (tour.images?.length || 1)]?.url ||
            defaultImages[extracted.length % defaultImages.length];

          extracted.push({
            day: dayNum,
            tag: "Highlight",
            title,
            desc,
            image: img,
          });
        }
      }
    });

    return extracted;
  })();

  // Split title so top line has max 50% width and remaining words flow into the subtitle line below
  const getTitleAndSubtitle = () => {
    const fullName = (tour.name || "").trim();

    if (fullName.includes(":")) {
      const [first, ...rest] = fullName.split(":");
      return {
        mainTitle: first.trim(),
        subTitlePrefix: rest.join(":").trim(),
      };
    }

    if (fullName.includes(" - ")) {
      const [first, ...rest] = fullName.split(" - ");
      return {
        mainTitle: first.trim(),
        subTitlePrefix: rest.join(" - ").trim(),
      };
    }

    if (
      tour.summary &&
      tour.summary.trim() &&
      tour.summary !== "Temples, Trails & Himalayan Hikes"
    ) {
      return {
        mainTitle: fullName,
        subTitlePrefix: tour.summary.trim(),
      };
    }

    const words = fullName.split(" ");
    if (words.length > 2) {
      const firstPart = words.slice(0, 2).join(" ");
      const restPart = words.slice(2).join(" ");
      return {
        mainTitle: firstPart,
        subTitlePrefix: restPart,
      };
    }

    return {
      mainTitle: fullName,
      subTitlePrefix: "",
    };
  };

  const { mainTitle, subTitlePrefix } = getTitleAndSubtitle();
  const routeAndDuration =
    `${tour.duration?.days ? `${tour.duration.days} Days, ` : ""}${tour.location?.startCity || ""} to ${tour.location?.endCity || ""}`.trim();
  const subtitleLine = subTitlePrefix
    ? `${subTitlePrefix} - ${routeAndDuration}`
    : routeAndDuration;

  return (
    <div className="min-h-screen bg-white font-outfit text-[#1A1A1A]">
      {/* 1. Header Bar & Title Section */}
      <div className="w-full max-w-[1280px] mx-auto px-5 sm:px-6 md:px-8 xl:px-[35px] pt-4 sm:pt-6 pb-2">
        {/* Breadcrumbs - hidden on mobile per Figma */}
        <nav className="mb-4 hidden md:flex items-center space-x-2 text-[13px] text-[#1A1A1A]/80 font-light font-outfit">
          <Link href="/" className="hover:text-black transition-colors">
            Home
          </Link>
          <span className="text-[#1A1A1A]/30">/</span>
          <Link
            href="/destinations"
            className="hover:text-black transition-colors"
          >
            Destinations
          </Link>
          {tour.country?.continent && (
            <>
              <span className="text-[#1A1A1A]/30">/</span>
              <Link
                href={`/destinations/${tour.country.continent.slug}`}
                className="hover:text-black transition-colors capitalize"
              >
                {tour.country.continent.slug}
              </Link>
            </>
          )}
          <span className="text-[#1A1A1A]/30">/</span>
          <Link
            href={`/destinations/${tour.country?.continent?.slug || "asia"}/${tour.country.slug}`}
            className="hover:text-black transition-colors"
          >
            {tour.country.name}
          </Link>
          <span className="text-[#1A1A1A]/30">/</span>
          <span className="text-[#1A1A1A] font-normal truncate max-w-[200px] sm:max-w-none">
            {tour.name}
          </span>
        </nav>

        {/* Title Header with Share & Wishlist Icons (Figma Mobile #5880:7228 & Desktop #5295:6937) */}
        <div className="flex items-start justify-between gap-4 sm:gap-6 mb-4 md:mb-6">
          <div className="w-full max-w-[760px]">
            <h1 className="text-[29.44px] sm:text-[40px] md:text-[56px] xl:text-[64px] font-normal text-[#000000] tracking-[-0.02em] font-outfit break-words leading-[1.15] md:leading-[1.02]">
              {mainTitle}
            </h1>
            <p className="text-[14px] sm:text-[18px] md:text-[20px] text-[#000000]/80 font-light mt-1 md:mt-1.5 font-outfit tracking-normal">
              {subtitleLine}
            </p>
          </div>

          {/* Desktop Share & Wishlist Buttons (hidden on mobile per Figma) */}
          <div className="hidden md:flex items-center gap-3 shrink-0 pt-2">
            <button
              onClick={() => {
                if (navigator.share) {
                  navigator.share({
                    title: tour.name,
                    url: window.location.href,
                  });
                } else {
                  navigator.clipboard.writeText(window.location.href);
                  alert("Link copied to clipboard!");
                }
              }}
              className="p-2 hover:bg-[rgba(181,185,177,0.15)] rounded-full transition cursor-pointer"
              title="Share"
              aria-label="Share"
            >
              <ShareNetwork size={22} className="text-[#1A1A1A]" />
            </button>
            <button
              onClick={handleWishlistToggle}
              className="p-2 hover:bg-[rgba(181,185,177,0.15)] rounded-full transition cursor-pointer"
              title="Save to Wishlist"
              aria-label="Save to Wishlist"
            >
              <Heart
                size={22}
                weight={isInWishlist ? "fill" : "regular"}
                className={isInWishlist ? "text-[#E63946]" : "text-[#1A1A1A]"}
              />
            </button>
          </div>
        </div>

        {/* 2, 3, 4. Hero Section + Tour Intro + Your Adventure at a Glance with Sticky Right Price/Booking Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_316px] xl:grid-cols-[853px_316px] gap-6 xl:gap-[41px] items-start mb-10 md:mb-16">
          {/* Left Column: Hero Image + Tour Intro + Your Adventure at a Glance */}
          <div className="space-y-6 sm:space-y-8 md:space-y-10 w-full">
            {/* Left Hero Image (Figma Mobile #5880:7229: 360x291, rounded 7.36px) */}
            <div
              className="relative w-full h-[291px] sm:h-[380px] md:h-[421px] rounded-[7.36px] md:rounded-[12px] overflow-hidden cursor-pointer group shadow-2xs"
              onClick={() => {
                setActiveImageIndex(0);
                setShowGalleryModal(true);
              }}
            >
              <Image
                src={galleryImages[0]}
                alt={tour.name}
                fill
                priority
                className="object-cover group-hover:scale-[1.02] transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/40 pointer-events-none" />

              {/* Mobile Share & Like / Wishlist Actions on Bottom Right of Image (Figma Mobile #5880:7294: pure white over image) */}
              <div
                onClick={(e) => e.stopPropagation()}
                className="md:hidden absolute bottom-3 right-3 flex items-center gap-3.5 z-10 drop-shadow-[0_1px_3px_rgba(0,0,0,0.6)]"
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (navigator.share) {
                      navigator.share({
                        title: tour.name,
                        url: window.location.href,
                      });
                    } else {
                      navigator.clipboard.writeText(window.location.href);
                      alert("Link copied to clipboard!");
                    }
                  }}
                  className="hover:opacity-80 transition cursor-pointer flex items-center justify-center text-white"
                  title="Share"
                  aria-label="Share"
                >
                  <ShareNetwork
                    size={22}
                    className="text-white"
                    weight="regular"
                  />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleWishlistToggle();
                  }}
                  className="hover:opacity-80 transition cursor-pointer flex items-center justify-center text-white"
                  title="Save to Wishlist"
                  aria-label="Save to Wishlist"
                >
                  <Heart
                    size={22}
                    weight={isInWishlist ? "fill" : "regular"}
                    className={isInWishlist ? "text-[#E63946]" : "text-white"}
                  />
                </button>
              </div>
            </div>

            {/* 3. Tour Intro Section (100% Figma MCP Match #5880:7292 & #5880:7293) */}
            {(() => {
              const fullDesc =
                tour.description ||
                tour.summary ||
                "Experience authentic adventures, scenic routes, and unforgettable local culture with comfort and clear schedules.";
              const sentences = fullDesc.match(
                /[^.!?]+[.!?]+(?:\s+|$)|[^.!?]+$/g,
              ) || [fullDesc];
              let col1 = fullDesc;
              let col2 = "";

              if (sentences.length > 1) {
                const totalLen = fullDesc.length;
                let accumulated = 0;
                let splitIdx = 1;
                let minDiff = Infinity;

                for (let i = 0; i < sentences.length; i++) {
                  accumulated += sentences[i].length;
                  const diff = Math.abs(accumulated - totalLen / 2);
                  if (diff < minDiff) {
                    minDiff = diff;
                    splitIdx = i + 1;
                  }
                }
                col1 = sentences.slice(0, splitIdx).join("").trim();
                col2 = sentences.slice(splitIdx).join("").trim();
              }

              return (
                <div>
                  <h2 className="text-[21px] sm:text-[26px] md:text-[32px] font-normal text-[#1A1A1A] mb-3 md:mb-5 leading-snug font-outfit">
                    A fast, fun, Action-filled{" "}
                    <span className="font-gochi text-[#3B5D1B] md:text-[#254B02] text-[21px] sm:text-[26px] md:text-[32px]">
                      Intro to{" "}
                      {tour.country?.name ||
                        tour.location?.startCity ||
                        "the Adventure"}
                    </span>
                  </h2>

                  {/* Description Paragraphs in 2 Columns on md+, 1 Column on mobile (#5880:7293) */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3 md:gap-y-4 text-[12px] md:text-[15px] font-light text-[#000000]/80 md:text-[#1A1A1A]/80 leading-[18px] md:leading-[26px] font-outfit">
                    <p className="whitespace-pre-line">{col1}</p>
                    {col2 ? (
                      <p className="whitespace-pre-line">{col2}</p>
                    ) : null}
                  </div>
                </div>
              );
            })()}

            {/* Quick Tour Info & Check Dates Bar on Mobile (100% Figma MCP Mobile #5880:8449, y: 621) */}
            <div className="md:hidden w-full flex items-center justify-between py-1 px-0">
              <div className="flex flex-col justify-center">
                <div className="text-[14px] font-normal text-[#000000] font-outfit leading-[1.3em] truncate max-w-[170px]">
                  {tour.location?.startCity && tour.location?.endCity
                    ? `${tour.location.startCity} to ${tour.location.endCity}`
                    : tour.name}
                </div>
                <div className="text-[11px] font-light text-[#000000]/80 font-outfit leading-[1.3em]">
                  {tour.duration?.days} Days
                </div>
              </div>
              <button
                onClick={() => {
                  const datesSection = document.getElementById(
                    "check-availability-section",
                  );
                  if (datesSection) {
                    datesSection.scrollIntoView({ behavior: "smooth" });
                  }
                }}
                className="bg-[#1A1A1A] hover:bg-black text-white text-[11px] font-normal font-outfit px-4 py-2 rounded-full whitespace-nowrap transition cursor-pointer"
              >
                Check Dates And Prices
              </button>
            </div>

            {/* 4. "Your Adventure at a Glance" Box (#5880:7230: 360x196, bg #F6F7F6, rounded 8px) */}
            <div
              className="w-full relative rounded-[8px] md:rounded-[12px] px-3.5 py-[18px] sm:p-7 xl:p-[28px] overflow-hidden shadow-xs bg-[#F6F7F6] md:bg-[rgba(181,185,177,0.2)]"
              style={{
                minHeight: "196px",
              }}
            >
              {/* Top-Right Decorative Watermark in Pure White (#5295:7574) - hidden on mobile */}
              <div className="hidden md:block absolute -top-24 -right-14 w-[260px] pointer-events-none select-none">
                <Image
                  src="/nba_logo1.svg"
                  alt="Watermark"
                  width={209}
                  height={188}
                  className="w-full h-full object-contain brightness-0 invert"
                />
              </div>

              {/* Title (#5880:7232: Gochi Hand 19.625px on mobile, #3B5D1B, x: 12.45, y: 19.69) */}
              <h3 className="font-gochi text-[19.625px] sm:text-[28px] md:text-[32px] text-[#3B5D1B] md:text-[#254B02] font-normal mb-[18px] sm:mb-7 relative z-10 leading-[0.9em]">
                Your Adventure at a Glance
              </h3>

              {/* 6 Key Attributes Grid (2 Columns x 3 Rows - Exact Figma Mobile Match #5880:7230) */}
              <div className="grid grid-cols-2 gap-x-[14px] sm:gap-x-8 xl:gap-x-12 gap-y-[15px] sm:gap-y-6 relative z-10">
                {/* 1. Tour Duration (#5880:7233) */}
                <div className="flex items-center gap-[10px] sm:gap-3.5">
                  <Image
                    src="/yaa1.svg"
                    alt="Tour Duration"
                    width={51}
                    height={51}
                    className="w-[31.28px] h-[31.28px] sm:w-[51px] sm:h-[51px] shrink-0 object-contain rounded-[8px]"
                  />
                  <div className="flex flex-col justify-center">
                    <div className="text-[12.27px] sm:text-[18px] md:text-[20px] font-medium text-[#1A1A1A] leading-tight font-outfit">
                      Tour Duration
                    </div>
                    <div className="text-[8.59px] sm:text-[13px] md:text-[14px] font-light text-[#1A1A1A]/80 mt-[2px] font-outfit">
                      {tour.duration.days} days
                    </div>
                  </div>
                </div>

                {/* 2. Trip Type (#5880:7241) */}
                <div className="flex items-center gap-[10px] sm:gap-3.5">
                  <Image
                    src="/yaa2.svg"
                    alt="Trip Type"
                    width={51}
                    height={51}
                    className="w-[31.28px] h-[31.28px] sm:w-[51px] sm:h-[51px] shrink-0 object-contain rounded-[8px]"
                  />
                  <div className="flex flex-col justify-center">
                    <div className="text-[12.27px] sm:text-[18px] md:text-[20px] font-medium text-[#1A1A1A] leading-tight font-outfit">
                      Trip Type
                    </div>
                    <div className="text-[9.81px] sm:text-[13px] md:text-[14px] font-light text-[#1A1A1A]/80 mt-[2px] font-outfit">
                      {tour.travelStyle || "Small Group"}
                    </div>
                  </div>
                </div>

                {/* 3. Group Size (#5880:7250) */}
                <div className="flex items-center gap-[10px] sm:gap-3.5">
                  <Image
                    src="/yaa3.svg"
                    alt="Group Size"
                    width={51}
                    height={51}
                    className="w-[31.28px] h-[31.28px] sm:w-[51px] sm:h-[51px] shrink-0 object-contain rounded-[8px]"
                  />
                  <div className="flex flex-col justify-center">
                    <div className="text-[12.27px] sm:text-[18px] md:text-[20px] font-medium text-[#1A1A1A] leading-tight font-outfit">
                      Group Size
                    </div>
                    <div className="text-[8.59px] sm:text-[13px] md:text-[14px] font-light text-[#1A1A1A]/80 mt-[2px] font-outfit">
                      Max {tour.maxGroupSize} People
                    </div>
                  </div>
                </div>

                {/* 4. Service Level (#5880:7272) */}
                <div className="flex items-center gap-[10px] sm:gap-3.5">
                  <Image
                    src="/yaa4.svg"
                    alt="Service Level"
                    width={51}
                    height={51}
                    className="w-[31.28px] h-[31.28px] sm:w-[51px] sm:h-[51px] shrink-0 object-contain rounded-[8px]"
                  />
                  <div className="flex flex-col justify-center">
                    <div className="text-[12.27px] sm:text-[18px] md:text-[20px] font-medium text-[#1A1A1A] leading-tight font-outfit">
                      Service Level
                    </div>
                    <div className="text-[9.81px] sm:text-[13px] md:text-[14px] font-light text-[#1A1A1A]/80 mt-[2px] font-outfit">
                      {tour.serviceLevel || "Standard"}
                    </div>
                  </div>
                </div>

                {/* 5. Physical Rating (#5880:7264) */}
                <div className="flex items-center gap-[10px] sm:gap-3.5">
                  <Image
                    src="/yaa5.svg"
                    alt="Physical Rating"
                    width={51}
                    height={51}
                    className="w-[31.28px] h-[31.28px] sm:w-[51px] sm:h-[51px] shrink-0 object-contain rounded-[8px]"
                  />
                  <div className="flex flex-col justify-center">
                    <div className="text-[12.27px] sm:text-[18px] md:text-[20px] font-medium text-[#1A1A1A] leading-tight font-outfit">
                      Physical Rating
                    </div>
                    <div className="text-[8.59px] sm:text-[13px] md:text-[14px] font-light text-[#1A1A1A]/80 mt-[2px] font-outfit">
                      {tour.physicalRating?.level || 1}/5
                    </div>
                  </div>
                </div>

                {/* 6. Minimum Age (#5880:7279) */}
                <div className="flex items-center gap-[10px] sm:gap-3.5">
                  <Image
                    src="/yaa6.svg"
                    alt="Minimum Age"
                    width={51}
                    height={51}
                    className="w-[31.28px] h-[31.28px] sm:w-[51px] sm:h-[51px] shrink-0 object-contain rounded-[8px]"
                  />
                  <div className="flex flex-col justify-center">
                    <div className="text-[12.27px] sm:text-[18px] md:text-[20px] font-medium text-[#1A1A1A] leading-tight font-outfit">
                      Minimum Age
                    </div>
                    <div className="text-[9.81px] sm:text-[13px] md:text-[14px] font-light text-[#1A1A1A]/80 mt-[2px] font-outfit">
                      {tour.ageRequirement?.min || 12}+ Years
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Booking Summary Card Column (Sticky on Desktop, hidden on mobile) */}
          <aside
            ref={bookingPanelRef}
            className="w-full flex-col lg:sticky lg:top-24 hidden lg:flex"
          >
            {/* Main Price / Booking Card (#5295:6968) */}
            <div
              className="rounded-[13px] p-3.5 sm:p-[13px] flex flex-col gap-3 w-full shadow-xs font-outfit"
              style={{ backgroundColor: "rgba(181, 185, 177, 0.2)" }}
            >
              {/* Top Badges Row (#5303:8783) */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <span className="bg-[#F73D0A] text-white text-[10px] sm:text-[10.86px] font-normal px-2.5 py-[2px] rounded-[27px] leading-none inline-flex items-center justify-center">
                    Bestseller
                  </span>
                  <span className="bg-[#1A1A1A] text-white text-[10px] sm:text-[10.86px] font-normal px-2.5 py-[2px] rounded-[27px] leading-none inline-flex items-center justify-center">
                    Sale {bestDiscount}%
                  </span>
                </div>
                <span className="text-[10px] font-medium text-[#1A1A1A]/80 text-right leading-none">
                  Trip Code: {tour.tourCode || "UCOOS"}
                </span>
              </div>

              {/* Duration in Gochi Hand (#5295:6980) */}
              <div className="pt-0.5">
                <div className="font-gochi text-[32px] text-[#254B02] leading-none">
                  {tour.duration.days} Days
                </div>
              </div>

              {/* Price section (#5295:6981) */}
              <div className="pt-0.5 font-outfit">
                <div className="flex items-end justify-between gap-2">
                  {/* Left: From + $ 599 USD + Valid on Date */}
                  <div>
                    <div className="text-[10px] font-light text-[#1A1A1A] leading-none mb-1">
                      From
                    </div>
                    <div className="flex items-baseline gap-0.5">
                      <span className="text-[10px] font-semibold text-[#1A1A1A] leading-none mr-0.5">
                        $
                      </span>
                      <span className="text-[32px] font-semibold text-[#1A1A1A] leading-none tracking-tight font-outfit">
                        {Math.round(discountedPrice)}
                      </span>
                      <span className="text-[10px] font-semibold text-[#1A1A1A] leading-none ml-1">
                        USD
                      </span>
                    </div>
                    <div className="text-[10px] font-light text-[#1A1A1A] mt-1.5">
                      Valid on{" "}
                      <strong className="font-medium text-[#1A1A1A]">
                        {bestDealDate
                          ? new Date(bestDealDate.startDate).toLocaleDateString(
                              "en-US",
                              {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              },
                            )
                          : "Mar 4, 2026"}
                      </strong>
                    </div>
                  </div>

                  {/* Right: was $1499 (aligned to bottom, no strikethrough per #5295:6987) */}
                  <div className="text-right pb-0.5">
                    <div className="text-[13px] font-normal text-[#1A1A1A]">
                      <span className="text-[10px] font-light text-[#1A1A1A] mr-1">
                        was
                      </span>
                      <span className="text-[16px] font-normal text-[#1A1A1A]">
                        ${basePrice}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Adventure Deposit Card (#5295:6989) */}
              <div className="bg-white rounded-[8px] px-3 py-2 flex items-center justify-between my-0.5 shadow-2xs font-outfit">
                <div>
                  <div className="flex items-center gap-1.5 text-[12px] font-medium text-[#1A1A1A]">
                    <Image
                      src="/aadd.svg"
                      alt="Adventure Deposit"
                      width={13}
                      height={13}
                      className="w-[13px] h-[13px] object-contain shrink-0"
                    />
                    <span>Adventure Deposit</span>
                  </div>
                  <div className="text-[8.7px] font-light text-[#1A1A1A]/70 mt-0.5 pl-[19px]">
                    Book your spot Now
                  </div>
                </div>
                <div className="text-[10px] font-medium text-[#1A1A1A]">
                  ${depositAmount.toFixed(2)}
                </div>
              </div>

              {/* Star Rating Row (#5295:7001) */}
              <div className="flex items-center gap-1.5 pt-0.5">
                <div className="flex items-center gap-0.5 text-[#254B02]">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      size={14}
                      weight="fill"
                      className="text-[#254B02]"
                    />
                  ))}
                </div>
                <span className="text-[13.5px] text-[#1A1A1A] font-normal ml-1">
                  ({tour.ratingsQuantity || 56} reviews)
                </span>
              </div>

              {/* CTA Button (#5295:7010) */}
              <button
                onClick={() => {
                  const datesSection = document.getElementById(
                    "check-availability-section",
                  );
                  if (datesSection) {
                    datesSection.scrollIntoView({ behavior: "smooth" });
                  }
                }}
                className="w-full bg-[#1A1A1A] hover:bg-black text-white text-[16px] font-light py-2.5 px-4 rounded-[34px] text-center transition cursor-pointer mt-1 shadow-xs font-outfit"
              >
                Check Dates And Prices
              </button>
            </div>

            {/* Deal & Offers Below Widget (#5295:7013 - #5295:7029) */}
            <div className="mt-3 space-y-2 font-outfit">
              <div className="flex justify-start">
                <span className="bg-[#F73D0A] text-white text-[10.86px] font-normal px-2.5 py-[2px] rounded-[27px] leading-none inline-flex items-center justify-center">
                  Deal &amp; Offers
                </span>
              </div>

              {/* Row 1: Save X% Departure Date (#5295:7013) */}
              <div className="bg-[#F6F7F6] rounded-[13px] py-2 px-3 flex items-center justify-between text-[10.86px] font-light text-[#1A1A1A]/80 border border-[rgba(26,26,26,0.06)] shadow-2xs">
                <span className="bg-[rgba(26,26,26,0.6)] text-white px-2 py-0.5 rounded-[13px] text-[8.7px] font-normal shrink-0">
                  Save {dealDiscountPercent}%
                </span>
                <span className="text-[10.86px] font-light text-[#1A1A1A]/80">
                  Departure {dealDepartureDateStr}
                </span>
              </div>

              {/* Row 2: Expires in X days | Promo Code (#5295:7022) */}
              <div className="bg-[#F6F7F6] rounded-[13px] py-2 px-3 text-[10.86px] font-light text-[#1A1A1A]/80 text-center flex items-center justify-center gap-1.5 border border-[rgba(26,26,26,0.06)] shadow-2xs">
                <span>Expires in 18 days</span>
                <span className="text-[#1A1A1A]/40">|</span>
                <span>
                  Promo Code{" "}
                  <strong className="font-semibold text-[#1A1A1A]">
                    {promoCodeStr}
                  </strong>
                </span>
              </div>
            </div>
          </aside>
        </div>

        {/* 5. "Moments that'll make you call Really?" (100% Figma MCP Match #5295:7976 & Mobile #5880:7297) */}
        <div
          ref={momentsSectionRef}
          className="relative h-[260vh] w-full max-w-[1280px] mx-auto mb-12 md:mb-16"
        >
          <div className="sticky top-0 h-screen max-h-[850px] w-full flex flex-col justify-center overflow-hidden py-6 md:py-8">
            {/* Centered Heading (#5880:7298 Mobile 24px-29.44px Outfit / 28px Gochi Hand #3B5D1B | Desktop #5295:7977 48px Outfit / 56px Gochi Hand) */}
            <h2 className="text-center text-[24px] sm:text-[34px] md:text-[42px] xl:text-[48px] font-normal text-[#1A1A1A] font-outfit leading-[1.1] mb-6 md:mb-10 shrink-0">
              Moments that’ll make you call <br />
              <span className="font-gochi text-[#3B5D1B] md:text-[#254B02] text-[28px] sm:text-[44px] md:text-[52px] xl:text-[56px] leading-[1.1] md:leading-[54px]">
                Really?
              </span>
            </h2>

            {/* Horizontal Pinned Sliding Track */}
            {(() => {
              // Circular data array: start on card 3 (index 2), loop around to card 1 & 2 at the end, and keep trailing cards on right
              const circularMoments =
                momentsData.length >= 3
                  ? [
                      ...momentsData,
                      ...momentsData.slice(0, Math.min(5, momentsData.length)),
                    ]
                  : momentsData;
              const startIdx = momentsData.length >= 3 ? 2 : 0;
              // Center on Card 1 / Card 2 at the end, leaving trailing cards 3, 4, 5 on the right
              const endIdx =
                momentsData.length >= 3
                  ? momentsData.length + 1
                  : circularMoments.length - 1;
              const currentCenterFloat =
                startIdx + momentsProgress * (endIdx - startIdx);
              const isMobile = windowWidth < 768;
              const cardWidth = isMobile ? 256.6 : 277;
              const cardGap = isMobile ? 20 : 36;
              const step = cardWidth + cardGap;

              return (
                <div className="relative w-full overflow-visible py-4 md:py-8">
                  <div
                    className="flex items-center gap-[20px] md:gap-[36px] will-change-transform"
                    style={{
                      transform: `translateX(calc(50% - ${cardWidth / 2}px - ${currentCenterFloat * step}px))`,
                    }}
                  >
                    {circularMoments.map((m: any, idx: number) => {
                      const distance = Math.abs(idx - currentCenterFloat);
                      const isFocus = distance < 0.5;
                      const factor =
                        distance < 0.6
                          ? Math.cos((distance / 0.6) * (Math.PI / 2))
                          : 0;
                      const scale = 0.82 + 0.18 * factor;
                      const zIndex = isFocus
                        ? 20
                        : 10 - Math.min(9, Math.round(distance));
                      const dayNumber = (idx % momentsData.length) + 1;

                      return (
                        <div
                          key={idx}
                          onClick={() => {
                            if (momentsSectionRef.current) {
                              const targetProgress =
                                endIdx > startIdx
                                  ? Math.max(
                                      0,
                                      Math.min(
                                        1,
                                        (idx - startIdx) / (endIdx - startIdx),
                                      ),
                                    )
                                  : 0;
                              const targetScroll =
                                momentsSectionRef.current.offsetTop +
                                targetProgress *
                                  (momentsSectionRef.current.offsetHeight -
                                    window.innerHeight);
                              window.scrollTo({
                                top: targetScroll,
                                behavior: "smooth",
                              });
                            }
                          }}
                          className="w-[256.6px] md:w-[277px] shrink-0 flex flex-col group cursor-pointer origin-center select-none transition-transform duration-150 ease-out"
                          style={{
                            transform: `scale(${scale})`,
                            zIndex,
                          }}
                        >
                          {/* Top Image Box (#5880:7301 / #5880:7366 256.28px x 212px vs #5295:7981 277px x 229px) */}
                          <div className="relative w-full h-[212px] md:h-[229px] rounded-t-[7.27px] md:rounded-t-[7.85px] overflow-hidden shrink-0 bg-gray-100">
                            <Image
                              src={m.image}
                              alt={m.title}
                              fill
                              className="object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                          </div>

                          {/* Bottom Content Box (#5880:7304 256.59px x 89.85px vs #5295:7983 277px x 97px) */}
                          <div
                            className="bg-white rounded-b-[7.27px] md:rounded-b-[7.85px] p-3 md:p-4 flex flex-col justify-between min-h-[90px] md:min-h-[97px] transition-shadow duration-300 font-outfit"
                            style={{
                              boxShadow: isFocus
                                ? "0px 2px 20px 2px rgba(0, 0, 0, 0.08)"
                                : "0px 0.605px 15.15px 0.605px rgba(0, 0, 0, 0.04)",
                            }}
                          >
                            <div>
                              {/* Day Pill Badge (#5880:7308 / #5295:7987) */}
                              <span className="inline-block px-2 md:px-2.5 py-0.5 bg-[#1A1A1A] text-white text-[7.27px] md:text-[9px] font-normal rounded-full mb-1.5 self-start font-outfit">
                                Included in Day {m.day || dayNumber}
                              </span>

                              {/* Highlight Title (#5880:7312 18.53px vs #5295:7991 20px) */}
                              <h4 className="text-[18.53px] md:text-[20px] font-normal text-[#1A1A1A] tracking-[-0.0156em] leading-tight mb-1 truncate font-outfit">
                                {m.title}
                              </h4>

                              {/* Description (#5880:7311 11px font-light vs #5295:7990 12px) */}
                              <p className="text-[11px] md:text-[12px] font-light text-[#1A1A1A]/70 tracking-[-0.0179em] leading-relaxed line-clamp-2 font-outfit">
                                {m.desc}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}
          </div>
        </div>

        {/* 6. "Why this Trip" (100% Figma MCP Match #5295:7398 & Mobile #5880:7368) */}
        <div
          className="-mx-4 sm:-mx-6 md:-mx-8 xl:-mx-[35px] px-4 sm:px-6 md:px-8 xl:px-[35px] py-8 sm:py-10 md:py-12 xl:py-[42px] mb-12 md:mb-16 rounded-[12px]"
          style={{ backgroundColor: "rgba(244, 236, 217, 0.3)" }}
        >
          <div className="w-full max-w-[1210px] mx-auto">
            <h2 className="text-[24px] sm:text-[29.44px] md:text-[42px] xl:text-[48px] font-normal text-[#1A1A1A] font-outfit mb-5 md:mb-8 leading-tight">
              Why <span className="font-gochi text-[#3B5D1B] md:text-[#254B02]">this Trip</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5 xl:gap-[28px]">
              {/* Card 1 (#5880:7370 / #5295:7403) - Left aligned on mobile */}
              <div className="w-[85%] max-w-[307px] md:w-full md:max-w-none mr-auto md:mr-0 bg-white rounded-[10px] md:rounded-[12px] p-4 sm:p-5 md:p-6 xl:p-[22px] flex flex-col justify-between min-h-[180px] md:min-h-[230px] shadow-[0_2px_12px_rgba(0,0,0,0.05)] font-outfit">
                <div className="h-[67px] md:h-[85px] mb-3 md:mb-4 flex items-center justify-start">
                  <Image
                    src="/wwww1.svg"
                    alt="Small Groups"
                    width={77}
                    height={84}
                    className="h-[67px] md:h-[84px] w-auto object-contain object-left"
                  />
                </div>
                <div>
                  <h3 className="text-[15.95px] md:text-[20px] font-normal text-[#1A1A1A] mb-1 tracking-[-0.0234em] leading-snug font-outfit">
                    Small Groups, Big Adventure
                  </h3>
                  <p className="text-[11px] md:text-[14px] text-[#1A1A1A]/70 font-light leading-[18px] md:leading-[20px] tracking-[-0.0236em] md:tracking-[-0.0203em] font-outfit">
                    Small groups means deeper connections. Meet travellers from
                    around the world and make every adventure feel like a shared
                    passport stamp.
                  </p>
                </div>
              </div>

              {/* Card 2 (#5880:7414 / #5295:7447) - Right aligned on mobile */}
              <div className="w-[85%] max-w-[307px] md:w-full md:max-w-none ml-auto md:ml-0 bg-white rounded-[10px] md:rounded-[12px] p-4 sm:p-5 md:p-6 xl:p-[22px] flex flex-col justify-between min-h-[180px] md:min-h-[230px] shadow-[0_2px_12px_rgba(0,0,0,0.05)] font-outfit">
                <div className="h-[67px] md:h-[85px] mb-3 md:mb-4 flex items-center justify-start">
                  <Image
                    src="/wwww2.svg"
                    alt="Solo or Sociable"
                    width={57}
                    height={84}
                    className="h-[67px] md:h-[84px] w-auto object-contain object-left"
                  />
                </div>
                <div>
                  <h3 className="text-[15.95px] md:text-[20px] font-normal text-[#1A1A1A] mb-1 tracking-[-0.0234em] leading-snug font-outfit">
                    Solo or Sociable, your Choice
                  </h3>
                  <p className="text-[11px] md:text-[14px] text-[#1A1A1A]/70 font-light leading-[18px] md:leading-[20px] tracking-[-0.0236em] md:tracking-[-0.0203em] font-outfit">
                    Choose to roam along with group or explore at your own pace,
                    your choice. No sidelines, nothing but adventures here.
                  </p>
                </div>
              </div>

              {/* Card 3 (#5880:7443 / #5295:7476) - Left aligned on mobile */}
              <div className="w-[85%] max-w-[307px] md:w-full md:max-w-none mr-auto md:mr-0 bg-white rounded-[10px] md:rounded-[12px] p-4 sm:p-5 md:p-6 xl:p-[22px] flex flex-col justify-between min-h-[180px] md:min-h-[230px] shadow-[0_2px_12px_rgba(0,0,0,0.05)] font-outfit">
                <div className="h-[67px] md:h-[85px] mb-3 md:mb-4 flex items-center justify-start">
                  <Image
                    src="/wwww3.svg"
                    alt="Adventure Captains"
                    width={60}
                    height={85}
                    className="h-[67px] md:h-[84px] w-auto object-contain object-left"
                  />
                </div>
                <div>
                  <h3 className="text-[15.95px] md:text-[20px] font-normal text-[#1A1A1A] mb-1 tracking-[-0.0234em] leading-snug font-outfit">
                    They are called Adventure Captains
                  </h3>
                  <p className="text-[11px] md:text-[14px] text-[#1A1A1A]/70 font-light leading-[18px] md:leading-[20px] tracking-[-0.0236em] md:tracking-[-0.0203em] font-outfit">
                    Choose to roam along with group or explore at your own pace,
                    your choice. No sidelines, nothing but adventures here.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 7 & 8. "What's Included" + "Your Adventure Story" (Unified 100% Figma Match #5295:8115, #5295:8202, #5295:8248) */}
        <div className="mb-10 md:mb-20">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_316px] xl:grid-cols-[853px_316px] gap-6 xl:gap-[41px] items-start">
            {/* Left Column (853px / 1fr): What's Included + Your Adventure Story */}
            <div className="space-y-8 md:space-y-16 w-full min-w-0">
              {/* 7. "What's Included" (#5295:8115 & Mobile #5880:7468) */}
              <div>
                <h2 className="text-[24px] sm:text-[29.44px] md:text-[34px] xl:text-[48px] font-normal text-[#060F23] font-outfit mb-4 md:mb-6 leading-tight">
                  What’s Included
                </h2>

                {/* What's Included Card (#5295:8178 Desktop / #5880:7469 Mobile 360x508) */}
                <div className="border border-[#D9D9E4] rounded-[8px] md:rounded-[13px] overflow-hidden bg-white shadow-xs flex flex-row md:flex-col font-outfit min-h-[460px] md:min-h-0">
                  {/* Mobile Left Sidebar Tab Bar (#5880:7495) */}
                  <div
                    className="flex md:hidden flex-col justify-around w-[96px] sm:w-[104px] shrink-0 border-r border-[#D9D9E4] py-2"
                    style={{ backgroundColor: "rgba(181, 185, 177, 0.12)" }}
                  >
                    {[
                      {
                        id: "nba",
                        label: "NBA",
                        activeIcon: "/wi1_active.svg",
                        inactiveIcon: "/wi1_inactive.svg",
                      },
                      {
                        id: "leader",
                        label: "TOUR LEADER",
                        activeIcon: "/wi2_active.svg",
                        inactiveIcon: "/wi2_inactive.svg",
                      },
                      {
                        id: "transport",
                        label: "TRANSPORT",
                        activeIcon: "/wi3_active.svg",
                        inactiveIcon: "/wi3_inactive.svg",
                      },
                      {
                        id: "accommodation",
                        label: "ACCOMMODATION",
                        activeIcon: "/sssss1_active.svg",
                        inactiveIcon: "/sssss1_inactive.svg",
                      },
                      {
                        id: "meals",
                        label: "MEALS",
                        activeIcon: "/wi5_active.svg",
                        inactiveIcon: "/wi5_inactive.svg",
                      },
                    ].map((tab) => {
                      const isActive = includedTab === tab.id;
                      return (
                        <button
                          key={tab.id}
                          onClick={() => setIncludedTab(tab.id as any)}
                          className="relative flex-1 w-full flex flex-col items-center justify-center py-2 px-1 transition-colors cursor-pointer group font-outfit"
                        >
                          <div className="w-[32px] h-[32px] flex items-center justify-center transition-transform">
                            <Image
                              src={isActive ? tab.activeIcon : tab.inactiveIcon}
                              alt={tab.label}
                              width={32}
                              height={32}
                              className={`w-[32px] h-[32px] object-contain transition-all ${
                                isActive ? "opacity-100" : "opacity-60"
                              }`}
                            />
                          </div>
                          <span
                            className={`text-[9.5px] font-outfit tracking-wider uppercase transition-colors text-center mt-1 leading-tight ${
                              isActive
                                ? "text-[#6C114E] font-semibold"
                                : "text-[#1A1A1A]/70 font-normal"
                            }`}
                          >
                            {tab.label}
                          </span>
                          {isActive && (
                            <div className="absolute right-0 top-0 bottom-0 w-[2.5px] bg-[#6C114E]" />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Desktop Categories Tab Bar (#5295:8116) */}
                  <div
                    className="hidden md:flex px-4 sm:px-6 xl:px-8 h-[135px] items-center justify-between overflow-x-auto gap-3 border-b border-[#D9D9E4]"
                    style={{ backgroundColor: "rgba(181, 185, 177, 0.2)" }}
                  >
                    {[
                      {
                        id: "nba",
                        label: "NBA",
                        activeIcon: "/wi1_active.svg",
                        inactiveIcon: "/wi1_inactive.svg",
                      },
                      {
                        id: "leader",
                        label: "TOUR LEADER",
                        activeIcon: "/wi2_active.svg",
                        inactiveIcon: "/wi2_inactive.svg",
                      },
                      {
                        id: "transport",
                        label: "TRANSPORT",
                        activeIcon: "/wi3_active.svg",
                        inactiveIcon: "/wi3_inactive.svg",
                      },
                      {
                        id: "accommodation",
                        label: "ACCOMMODATION",
                        activeIcon: "/sssss1_active.svg",
                        inactiveIcon: "/sssss1_inactive.svg",
                      },
                      {
                        id: "meals",
                        label: "MEALS",
                        activeIcon: "/wi5_active.svg",
                        inactiveIcon: "/wi5_inactive.svg",
                      },
                    ].map((tab) => {
                      const isActive = includedTab === tab.id;
                      return (
                        <button
                          key={tab.id}
                          onClick={() => setIncludedTab(tab.id as any)}
                          className="relative flex flex-col items-center justify-center gap-2.5 h-full px-3 min-w-[85px] transition-colors cursor-pointer group font-outfit"
                        >
                          <div className="w-[46px] h-[46px] flex items-center justify-center transition-transform group-hover:scale-105">
                            <Image
                              src={isActive ? tab.activeIcon : tab.inactiveIcon}
                              alt={tab.label}
                              width={46}
                              height={46}
                              className={`w-[46px] h-[46px] object-contain transition-all ${
                                isActive
                                  ? "opacity-100"
                                  : "opacity-70 group-hover:opacity-100"
                              }`}
                            />
                          </div>
                          <span
                            className={`text-[14px] sm:text-[16px] font-outfit tracking-wider uppercase transition-colors text-center ${
                              isActive
                                ? "text-[#254B02] font-semibold"
                                : "text-[#1A1A1A] font-normal group-hover:text-[#254B02]"
                            }`}
                          >
                            {tab.label}
                          </span>
                          {isActive && (
                            <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#254B02] rounded-t-sm" />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Tab Body Content */}
                  <div className="p-3.5 sm:p-5 md:p-6 xl:p-[28px] flex-1 bg-white min-h-[190px] font-outfit">
                    {includedTab === "nba" && (
                      <div className="flex flex-col md:grid md:grid-cols-2 gap-y-4 md:gap-y-6 md:gap-x-8 xl:gap-x-12">
                        {/* Included Activities (#5880:7475 & #5295:8179) */}
                        <div>
                          <div className="flex items-center gap-2 md:gap-2.5 mb-2 md:mb-3">
                            <img
                              src="/tickpp.svg"
                              alt="Included"
                              className="w-[16px] h-[16px] md:w-[20px] md:h-[20px] shrink-0"
                            />
                            <h4 className="text-[12.5px] sm:text-[14px] md:text-[16px] font-medium text-[#1A1A1A] font-outfit">
                              Included Activities
                            </h4>
                          </div>
                          <ul className="space-y-1 md:space-y-1.5 pl-5 md:pl-[28px]">
                            {tour.itinerary &&
                            tour.itinerary.length > 0 &&
                            tour.itinerary.some(
                              (d) => d.activities && d.activities.length > 0,
                            ) ? (
                              Array.from(
                                new Set(
                                  tour.itinerary
                                    .flatMap(
                                      (d) =>
                                        d.activities?.map(
                                          (a) =>
                                            a.name || a.title || a.description,
                                        ) || [],
                                    )
                                    .filter(Boolean),
                                ),
                              )
                                .slice(0, 5)
                                .map((act, i) => (
                                  <li
                                    key={i}
                                    className="text-[11px] md:text-[14px] text-[#1A1A1A]/80 font-light leading-[18px] md:leading-[22px] font-outfit"
                                  >
                                    {act}
                                  </li>
                                ))
                            ) : (
                              <>
                                <li className="text-[11px] md:text-[14px] text-[#1A1A1A]/80 font-light leading-[18px] md:leading-[22px] font-outfit">
                                  Senso-Ji Temple
                                </li>
                                <li className="text-[11px] md:text-[14px] text-[#1A1A1A]/80 font-light leading-[18px] md:leading-[22px] font-outfit">
                                  Ropeway Cable Cart
                                </li>
                                <li className="text-[11px] md:text-[14px] text-[#1A1A1A]/80 font-light leading-[18px] md:leading-[22px] font-outfit">
                                  Tea Ceremony
                                </li>
                                <li className="text-[11px] md:text-[14px] text-[#1A1A1A]/80 font-light leading-[18px] md:leading-[22px] font-outfit">
                                  Osaka Castle &amp; Dotonbori
                                </li>
                              </>
                            )}
                          </ul>
                        </div>

                        {/* Right Sub-column: Premium Inclusions & Add-on Activities */}
                        <div className="space-y-3.5 md:space-y-5">
                          {/* Premium Inclusions (#5880:7482 & #5295:8184) */}
                          <div>
                            <div className="flex items-center gap-2 md:gap-2.5 mb-1.5 md:mb-2.5">
                              <img
                                src="/premium-i.svg"
                                alt="Premium Inclusions"
                                className="w-[16px] h-[16px] md:w-[20px] md:h-[20px] shrink-0"
                              />
                              <h4 className="text-[12.5px] sm:text-[14px] md:text-[16px] font-medium text-[#1A1A1A] font-outfit">
                                Premium Inclusions
                              </h4>
                            </div>
                            <div className="pl-5 md:pl-[28px]">
                              <p className="text-[11px] md:text-[14px] text-[#1A1A1A]/80 font-light leading-[18px] md:leading-[22px] font-outfit">
                                {tour.highlights && tour.highlights.length > 0
                                  ? tour.highlights[0]
                                  : "Shinjuku, Omoide Yokocho and Golden Gai"}
                              </p>
                            </div>
                          </div>

                          {/* Add-on Activities (#5880:7490 & #5295:8189) */}
                          <div>
                            <div className="flex items-center gap-2 md:gap-2.5 mb-1.5 md:mb-2.5">
                              <img
                                src="/add-ons-i.svg"
                                alt="Add-on Activities"
                                className="w-[16px] h-[16px] md:w-[20px] md:h-[20px] shrink-0"
                              />
                              <h4 className="text-[12.5px] sm:text-[14px] md:text-[16px] font-medium text-[#1A1A1A] font-outfit">
                                Add-on Activities
                              </h4>
                            </div>
                            <ul className="space-y-1 md:space-y-1.5 pl-5 md:pl-[28px]">
                              {tour.itinerary &&
                              tour.itinerary.some(
                                (d) =>
                                  d.optionalActivities &&
                                  d.optionalActivities.length > 0,
                              ) ? (
                                Array.from(
                                  new Set(
                                    tour.itinerary
                                      .flatMap(
                                        (d) =>
                                          d.optionalActivities?.map(
                                            (a) => a.name || a.title,
                                          ) || [],
                                      )
                                      .filter(Boolean),
                                  ),
                                )
                                  .slice(0, 3)
                                  .map((act, i) => (
                                    <li
                                      key={i}
                                      className="text-[11px] md:text-[14px] text-[#1A1A1A]/80 font-light leading-[18px] md:leading-[22px] font-outfit"
                                    >
                                      {act}
                                    </li>
                                  ))
                              ) : (
                                <>
                                  <li className="text-[11px] md:text-[14px] text-[#1A1A1A]/80 font-light leading-[18px] md:leading-[22px] font-outfit">
                                    Kinkaku-Ji Visit (Rokuon-Ji)
                                  </li>
                                  <li className="text-[11px] md:text-[14px] text-[#1A1A1A]/80 font-light leading-[18px] md:leading-[22px] font-outfit">
                                    Hiroshima Peace Museum
                                  </li>
                                </>
                              )}
                            </ul>
                          </div>
                        </div>
                      </div>
                    )}

                    {includedTab === "leader" && (
                      <div>
                        <div className="flex items-center gap-2 md:gap-2.5 mb-2 md:mb-3">
                          <img
                            src="/tickpp.svg"
                            alt="Tour Leader"
                            className="w-[16px] h-[16px] md:w-[20px] md:h-[20px] shrink-0"
                          />
                          <h4 className="text-[12.5px] sm:text-[14px] md:text-[16px] font-medium text-[#1A1A1A] font-outfit">
                            Tour Leader &amp; Expert Guides
                          </h4>
                        </div>
                        <p className="text-[11px] md:text-[14px] text-[#1A1A1A]/80 font-light leading-[18px] md:leading-relaxed pl-5 md:pl-[28px] font-outfit">
                          {tour.staffExperts ||
                            "English-speaking local CEO (Chief Experience Officer) & experienced local guides throughout the trip."}
                        </p>
                      </div>
                    )}

                    {includedTab === "transport" && (
                      <div>
                        <div className="flex items-center gap-2 md:gap-2.5 mb-2 md:mb-3">
                          <img
                            src="/tickpp.svg"
                            alt="Transport"
                            className="w-[16px] h-[16px] md:w-[20px] md:h-[20px] shrink-0"
                          />
                          <h4 className="text-[12.5px] sm:text-[14px] md:text-[16px] font-medium text-[#1A1A1A] font-outfit">
                            Transport
                          </h4>
                        </div>
                        <p className="text-[11px] md:text-[14px] text-[#1A1A1A]/80 font-light leading-[18px] md:leading-relaxed pl-5 md:pl-[28px] font-outfit">
                          {tour.transportation ||
                            tour.transport ||
                            "Air-conditioned private overland safari vehicle, 4x4 safari vehicles for game drives, and airport transfers."}
                        </p>
                      </div>
                    )}

                    {includedTab === "accommodation" && (
                      <div>
                        <div className="flex items-center gap-2 md:gap-2.5 mb-2 md:mb-3">
                          <img
                            src="/tickpp.svg"
                            alt="Accommodation"
                            className="w-[16px] h-[16px] md:w-[20px] md:h-[20px] shrink-0"
                          />
                          <h4 className="text-[12.5px] sm:text-[14px] md:text-[16px] font-medium text-[#1A1A1A] font-outfit">
                            Accommodation
                          </h4>
                        </div>
                        <p className="text-[11px] md:text-[14px] text-[#1A1A1A]/80 font-light leading-[18px] md:leading-relaxed pl-5 md:pl-[28px] font-outfit">
                          {tour.accommodation ||
                            "Comfortable twin-share safari lodges, luxury tented camps, and standard tourist hotels with private en-suite facilities."}
                        </p>
                      </div>
                    )}

                    {includedTab === "meals" && (
                      <div>
                        <div className="flex items-center gap-2 md:gap-2.5 mb-2 md:mb-3">
                          <img
                            src="/tickpp.svg"
                            alt="Meals"
                            className="w-[16px] h-[16px] md:w-[20px] md:h-[20px] shrink-0"
                          />
                          <h4 className="text-[12.5px] sm:text-[14px] md:text-[16px] font-medium text-[#1A1A1A] font-outfit">
                            Meals Included
                          </h4>
                        </div>
                        <p className="text-[11px] md:text-[14px] text-[#1A1A1A]/80 font-light leading-[18px] md:leading-relaxed pl-5 md:pl-[28px] font-outfit">
                          {formatMeals(
                            tour.meals,
                            "Daily authentic breakfasts, welcome dinners, and curated local culinary tastings.",
                          )}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Mobile Journey Map (#5880:7559 - Only on Mobile, placed right above Your Adventure Story) */}
              <div className="block lg:hidden my-6 font-outfit">
                <h3 className="text-[24px] sm:text-[30px] font-normal text-[#1A1A1A] font-outfit mb-3">
                  Journey Map
                </h3>
                <div className="relative w-full h-[230px] rounded-[17.6px] overflow-hidden bg-gray-100 shadow-sm border border-gray-100">
                  <Image
                    src={
                      tour.itineraryMapImage ||
                      tour.images?.[0]?.url ||
                      "/mountain_hikers.png"
                    }
                    alt="Journey Map"
                    fill
                    className="object-cover"
                  />
                </div>
              </div>

              {/* 8. "Your Adventure Story" (Itinerary - 100% Figma Match #5295:8202 & Mobile #5880:7565) */}
              <div ref={itinerarySectionRef} id="itinerary-section">
                {/* Header Row: Title Left + Full Itinerary Button Right */}
                <div className="flex items-center justify-between gap-3 mb-4 md:mb-6">
                  <h2 className="text-[20.26px] sm:text-[28px] md:text-[34px] xl:text-[48px] font-normal text-[#000000] font-outfit leading-tight">
                    Your{" "}
                    <span className="font-gochi text-[#3B5D1B] md:text-[#254B02]">
                      Adventure Story
                    </span>
                  </h2>
                  <button
                    onClick={() => setShowFullItineraryModal(true)}
                    className="h-[24px] md:h-[26px] px-3 md:px-[16px] py-[2px] bg-[#1A1A1A] hover:bg-black text-[#FFFFFF] rounded-[44px] flex items-center justify-center gap-1.5 md:gap-[7px] text-[12px] md:text-[16px] font-normal font-outfit transition-colors cursor-pointer w-fit shrink-0"
                  >
                    <svg
                      className="w-[14px] h-[14px] md:w-[19px] md:h-[19px] text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                      />
                    </svg>
                    <span>Download Itinerary</span>
                  </button>
                </div>

                {/* Itinerary Day Cards */}
                <div className="space-y-[10px]">
                  {tour.itinerary.map((day) => {
                    const isExpanded = expandedItineraryDays.includes(day.day);

                    if (!isExpanded) {
                      // Collapsed Day Card (#5295:8228 / Mobile #5880:7613)
                      return (
                        <div
                          key={day.day}
                          ref={(el) => {
                            if (el) dayRefs.current[day.day] = el;
                          }}
                          onClick={() => toggleItineraryDay(day.day)}
                          className="w-full min-h-[44px] md:min-h-[50px] bg-[#F8F8F7] hover:bg-[#F0F0EE] rounded-full px-4 sm:px-6 py-2 md:py-3 flex items-center justify-between cursor-pointer transition-colors select-none shadow-2xs"
                        >
                          <span className="text-[13.5px] sm:text-[16px] md:text-[18px] font-normal text-[#000000] font-outfit truncate pr-3">
                            {day.title ||
                              `${tour.location?.startCity || "Day"} to ${tour.location?.endCity || "Next Destination"}`}
                          </span>
                          <div className="px-2.5 py-0.5 md:w-[73px] md:h-[26px] bg-[#1A1A1A] rounded-[44px] flex items-center justify-center shrink-0">
                            <span className="text-[10px] sm:text-[12px] md:text-[16px] font-normal text-white font-outfit leading-none">
                              Day {day.day}
                            </span>
                          </div>
                        </div>
                      );
                    }

                    // Expanded Day Card (#5295:8207 / Mobile #5880:7569)
                    return (
                      <div
                        key={day.day}
                        ref={(el) => {
                          if (el) dayRefs.current[day.day] = el;
                        }}
                        className="w-full bg-[#F8F8F7] rounded-[8px] md:rounded-[12px] p-4 sm:p-6 md:p-7 shadow-2xs font-outfit"
                      >
                        {/* Top Row: Destination Title Left + Day Pill Right (#5295:8210 & Mobile #5880:7595) */}
                        <div className="flex items-start justify-between gap-3 mb-1.5 md:mb-2">
                          <h3
                            onClick={() => toggleItineraryDay(day.day)}
                            className="text-[16px] sm:text-[22px] md:text-[28px] xl:text-[32px] font-normal text-[#000000] leading-tight font-outfit cursor-pointer hover:opacity-85 transition-opacity"
                          >
                            {day.title ||
                              `${tour.location?.startCity || "Destination"}`}
                          </h3>
                          <button
                            type="button"
                            onClick={() => toggleItineraryDay(day.day)}
                            className="px-2.5 py-0.5 md:w-[73px] md:h-[26px] bg-[#1A1A1A] hover:bg-black rounded-[44px] flex items-center justify-center shrink-0 cursor-pointer transition-colors"
                          >
                            <span className="text-[10px] sm:text-[12px] md:text-[16px] font-normal text-white font-outfit leading-none">
                              Day {day.day}
                            </span>
                          </button>
                        </div>

                        {/* Day Description (#5880:7578 & #5295:8211) */}
                        {day.description && (
                          <p className="text-[11px] sm:text-[13px] md:text-[16px] text-[#000000]/60 font-light leading-relaxed font-outfit mt-1.5 mb-4 md:mb-6">
                            {day.description}
                          </p>
                        )}

                        {/* Activities Section (#5880:7598 & #5295:8221) */}
                        {day.activities && day.activities.length > 0 && (
                          <div className="mt-3 md:mt-4 pt-1 md:pt-2">
                            {/* Activities Subheader */}
                            <div className="flex items-center justify-between mb-3 md:mb-5">
                              <div className="flex items-center gap-2 md:gap-3">
                                <div className="w-[20px] h-[20px] md:w-[32px] md:h-[32px] rounded-full bg-[#1A1A1A] text-white flex items-center justify-center text-[9.5px] md:text-[16px] font-medium font-outfit shrink-0">
                                  {String(day.activities.length).padStart(
                                    2,
                                    "0",
                                  )}
                                </div>
                                <h4 className="text-[13px] sm:text-[16px] md:text-[20px] font-normal text-[#000000] font-outfit">
                                  Activities
                                </h4>
                              </div>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  togglePremiumDay(day.day);
                                }}
                                className="text-[10px] md:text-[14px] font-normal text-[#000000]/60 hover:text-[#000000] transition-colors cursor-pointer font-outfit"
                              >
                                {expandedPremiumDays.includes(day.day)
                                  ? "Hide"
                                  : "Show"}
                              </button>
                            </div>

                            {/* Activities List */}
                            {expandedPremiumDays.includes(day.day) && (
                              <div className="space-y-3 md:space-y-4">
                                {day.activities.map((act, aIdx) => (
                                  <div
                                    key={aIdx}
                                    className="flex items-start gap-2.5 md:gap-3.5"
                                  >
                                    {/* Circle Badge (#5880:7603) */}
                                    <div className="w-[9px] h-[9px] md:w-[21px] md:h-[21px] rounded-full bg-white shadow-[0_1px_3px_rgba(0,0,0,0.1)] shrink-0 mt-1 md:mt-0.5" />

                                    {/* Activity Content */}
                                    <div className="flex-1">
                                      <h5 className="text-[11.5px] sm:text-[13.5px] md:text-[16px] font-normal text-[#000000] font-outfit leading-snug">
                                        {act.name || act.title}
                                      </h5>

                                      {act.description && (
                                        <p className="text-[10px] sm:text-[12px] md:text-[14px] text-[#000000]/60 font-light leading-relaxed font-outfit mt-0.5 md:mt-1">
                                          {act.description}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Optional Activities Section (#5880:7589 & #5303:8814) */}
                        {day.optionalActivities &&
                          day.optionalActivities.length > 0 && (
                            <div className="mt-4 md:mt-7">
                              <div className="flex items-center justify-between mb-3 md:mb-5">
                                <div className="flex items-center gap-2 md:gap-3">
                                  <div className="w-[20px] h-[20px] md:w-[32px] md:h-[32px] rounded-full bg-[#1A1A1A] text-white flex items-center justify-center text-[9.5px] md:text-[16px] font-medium font-outfit shrink-0">
                                    {String(
                                      day.optionalActivities.length,
                                    ).padStart(2, "0")}
                                  </div>
                                  <h4 className="text-[13px] sm:text-[16px] md:text-[20px] font-normal text-[#000000] font-outfit">
                                    Optional Activities
                                  </h4>
                                </div>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleOptionalDay(day.day);
                                  }}
                                  className="text-[10px] md:text-[14px] font-normal text-[#000000]/60 hover:text-[#000000] transition-colors cursor-pointer font-outfit"
                                >
                                  {expandedOptionalDays.includes(day.day)
                                    ? "Hide"
                                    : "Show"}
                                </button>
                              </div>

                              {expandedOptionalDays.includes(day.day) && (
                                <div className="space-y-3 md:space-y-4">
                                  {day.optionalActivities.map((opt, oIdx) => (
                                    <div
                                      key={oIdx}
                                      className="flex items-start gap-2.5 md:gap-3.5"
                                    >
                                      {/* Circle Badge (#5880:7593) */}
                                      <div className="w-[9px] h-[9px] md:w-[21px] md:h-[21px] rounded-full bg-white shadow-[0_1px_3px_rgba(0,0,0,0.1)] shrink-0 mt-1 md:mt-0.5" />

                                      {/* Optional Activity Content */}
                                      <div className="flex-1">
                                        <div className="flex items-center justify-between gap-2">
                                          <h5 className="text-[11.5px] sm:text-[13.5px] md:text-[16px] font-normal text-[#000000] font-outfit">
                                            {opt.name || opt.title}
                                          </h5>
                                          {typeof opt.price === "number" ? (
                                            <span className="text-[10.5px] md:text-[14px] font-normal text-[#000000] font-outfit">
                                              +${opt.price}
                                            </span>
                                          ) : typeof opt.price === "object" &&
                                            opt.price?.amount ? (
                                            <span className="text-[10.5px] md:text-[14px] font-normal text-[#000000] font-outfit">
                                              +${opt.price.amount}
                                            </span>
                                          ) : null}
                                        </div>
                                        {opt.description && (
                                          <p className="text-[10px] sm:text-[12px] md:text-[14px] text-[#000000]/60 font-light leading-relaxed font-outfit mt-0.5 md:mt-1">
                                            {opt.description}
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}

                        {/* Bottom Row: Accommodation & Meals Included (#5880:7571 & #5880:7574) */}
                        <div className="mt-5 md:mt-8 pt-0 grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-6">
                          {/* Accommodation */}
                          <div className="flex items-start gap-2 md:gap-3">
                            <div className="w-[16px] h-[16px] md:w-[24px] md:h-[21px] flex items-center justify-center shrink-0 mt-0.5">
                              <Image
                                src="/aas1.svg"
                                alt="Accommodation"
                                width={24}
                                height={21}
                                className="w-[16px] h-[16px] md:w-[24px] md:h-[21px] object-contain"
                              />
                            </div>
                            <div>
                              <div className="text-[10.5px] md:text-[16px] font-normal text-[#1A1A1A] font-outfit leading-tight">
                                Accommodation
                              </div>
                              <div className="text-[9.5px] md:text-[14px] font-light text-[#1A1A1A]/70 font-outfit mt-0.5 md:mt-1 leading-snug">
                                {day.accommodations?.[0]?.name ||
                                  (day as any).accommodation ||
                                  tour.accommodation ||
                                  "Hotel Name (or similar)"}
                              </div>
                            </div>
                          </div>

                          {/* Meals Included */}
                          <div className="flex items-start gap-2 md:gap-3">
                            <div className="w-[16px] h-[16px] md:w-[23px] md:h-[22px] flex items-center justify-center shrink-0 mt-0.5">
                              <Image
                                src="/aas2.svg"
                                alt="Meals Included"
                                width={23}
                                height={22}
                                className="w-[16px] h-[16px] md:w-[23px] md:h-[22px] object-contain"
                              />
                            </div>
                            <div>
                              <div className="text-[10.5px] md:text-[16px] font-normal text-[#1A1A1A] font-outfit leading-tight">
                                Meals Included
                              </div>
                              <div className="text-[9.5px] md:text-[14px] font-light text-[#1A1A1A]/70 font-outfit mt-0.5 md:mt-1 leading-snug">
                                {formatMeals((day as any).meals || tour.meals)}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right Sticky Column (316px #5207:7723): Destination Card + Day Overview (Desktop only) */}
            <div className="hidden lg:block space-y-6 lg:sticky lg:top-24 pt-0 lg:pt-[80px]">
              {/* Destination Photo & Map Card (#5207:7727) */}
              <div className="w-full">
                <div className="rounded-[13px] overflow-hidden aspect-[316/215] w-full relative shadow-xs bg-gray-100 group">
                  <Image
                    src={
                      tour.itineraryMapImage ||
                      tour.images?.[0]?.url ||
                      "/mountain_hikers.png"
                    }
                    alt={tour.country?.name || "Destination"}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <div className="text-[28px] sm:text-[32px] font-normal text-[#1A1A1A] leading-tight mt-3 font-outfit">
                  {tour.country?.continent?.name ||
                    tour.country?.name ||
                    "Destination"}
                </div>
              </div>

              {/* Day Overview Box (#5295:7675) - Appears when Itinerary section comes into view */}
              <div
                className={`w-full bg-white border border-[#CFD1D6] rounded-[13px] p-[17px] shadow-2xs transition-all duration-300 ${
                  showDayOverview
                    ? "opacity-100 translate-y-0 block pointer-events-auto"
                    : "opacity-0 -translate-y-2 pointer-events-none hidden"
                }`}
              >
                <div className="text-[20px] font-normal text-[#1A1A1A] mb-4">
                  Day Overview
                </div>
                <div className="flex flex-wrap gap-2">
                  {(tour.itinerary && tour.itinerary.length > 0
                    ? tour.itinerary
                    : Array.from(
                        { length: tour.duration?.days || 5 },
                        (_, i) => ({ day: i + 1 }),
                      )
                  ).map((d: any) => {
                    const isDayOpen = expandedItineraryDays.includes(d.day);
                    return (
                      <button
                        key={d.day}
                        onClick={() => {
                          if (!expandedItineraryDays.includes(d.day)) {
                            setExpandedItineraryDays((prev) => [
                              ...prev,
                              d.day,
                            ]);
                          }
                          const el = dayRefs.current[d.day];
                          if (el)
                            el.scrollIntoView({
                              behavior: "smooth",
                              block: "center",
                            });
                        }}
                        className={`w-[40px] h-[40px] rounded-[8.65px] border text-[17px] font-normal flex items-center justify-center transition-all cursor-pointer ${
                          isDayOpen
                            ? "bg-[#69124C] text-white border-[#69124C] shadow-xs"
                            : "border-[#CFD1D6] hover:border-black text-[#1A1A1A] bg-transparent"
                        }`}
                      >
                        {d.day}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 9. "Available Extras (Optional)" (100% Figma MCP Match #5295:7334 & Mobile #5880:7669) */}
        <div className="mb-10 md:mb-20">
          <div className="mb-4 md:mb-6">
            <h2 className="text-[24px] sm:text-[29.44px] md:text-[34px] xl:text-[48px] font-normal text-[#1A1A1A] font-outfit leading-tight">
              Available Extras{" "}
              <span className="text-[16px] sm:text-[20px] md:text-[24px] text-[#1A1A1A] font-normal font-outfit">
                (Optional)
              </span>
            </h2>
            <p className="text-[11px] sm:text-[13px] md:text-[16px] text-[#1A1A1A]/70 font-light font-outfit mt-1 md:mt-2">
              Add this to your tour when you book
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_316px] xl:grid-cols-[853px_316px] gap-6 xl:gap-[41px] items-start">
            {/* Extras Options Container Left (853px Desktop / 360px Mobile #5880:7633) */}
            {(() => {
              const privateRoomPrice =
                tour.ownRoomAvailable &&
                tour.price?.ownRoomPrice &&
                tour.price.ownRoomPrice > 0
                  ? tour.price.ownRoomPrice
                  : tour.hotel?.privateRoomPrice &&
                      tour.hotel.privateRoomPrice > 0
                    ? tour.hotel.privateRoomPrice
                    : tour.price?.ownRoomPrice && tour.price.ownRoomPrice > 0
                      ? tour.price.ownRoomPrice
                      : 49;
              const hasPrivateRoom = Boolean(privateRoomPrice > 0);

              const preHotelPrice =
                tour.preTripHotel?.sharedRoomPrice ||
                tour.preTripHotel?.privateRoomPrice ||
                0;
              const postHotelPrice =
                tour.postTripHotel?.sharedRoomPrice ||
                tour.postTripHotel?.privateRoomPrice ||
                0;
              const mainHotelNightPrice =
                tour.hotel?.sharedRoomPrice ||
                tour.hotel?.privateRoomPrice ||
                0;
              const hotelNightPrices = [
                preHotelPrice,
                postHotelPrice,
                mainHotelNightPrice,
              ].filter((p) => p > 0);
              const minExtraNightPrice =
                hotelNightPrices.length > 0
                  ? Math.min(...hotelNightPrices)
                  : 49;
              const hasExtraNights = Boolean(minExtraNightPrice > 0);

              return (
                <div className="w-full min-w-0 border border-[rgba(26,26,26,0.12)] rounded-[8px] md:rounded-[12px] overflow-hidden bg-white shadow-2xs font-outfit">
                  {/* Category 1: Stay Your Way (Private Room) #5880:7636 */}
                  {hasPrivateRoom && (
                    <>
                      <div
                        className="px-3.5 sm:px-5 md:px-6 py-2.5 sm:py-3.5 border-b border-[rgba(26,26,26,0.1)] flex flex-col justify-center"
                        style={{
                          backgroundColor: "rgba(181, 185, 177, 0.12)",
                          minHeight: "44px",
                        }}
                      >
                        <div className="text-[12.27px] sm:text-[16px] md:text-[20px] font-normal text-[#000000] leading-[0.9em] font-outfit">
                          Stay Your Way
                        </div>
                        <div className="text-[9px] sm:text-[12px] md:text-[16px] text-[#000000]/80 font-light font-outfit mt-0.5 md:mt-1">
                          For travellers who value private space.
                        </div>
                      </div>

                      <div className="px-3.5 sm:px-5 md:px-6 py-3 sm:py-4 md:py-5 flex items-center justify-between gap-3 md:gap-4 border-b border-[rgba(26,26,26,0.1)]">
                        <div className="flex items-start gap-2.5 md:gap-4">
                          <div className="w-[18px] h-[18px] md:w-[21px] md:h-[21px] rounded-full bg-[#1A1A1A] hover:bg-black text-white flex items-center justify-center text-[12px] md:text-[15px] font-normal leading-none shrink-0 mt-0.5 select-none cursor-pointer transition-colors">
                            +
                          </div>
                          <div>
                            <div className="text-[12.27px] sm:text-[14px] md:text-[16px] font-normal text-[#1A1A1A] font-outfit mb-0.5">
                              Private Room Upgrades
                            </div>
                            <p className="text-[10px] sm:text-[12px] md:text-[14px] text-[#1A1A1A]/70 font-light font-outfit leading-relaxed max-w-xl">
                              Enjoy single-room privacy and personal space
                              throughout your adventure hotels and stays.
                            </p>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-[10px] sm:text-[12px] md:text-[14px] text-[#1A1A1A] font-light font-outfit mr-1">
                            From
                          </span>
                          <span className="text-[13px] sm:text-[16px] md:text-[20px] font-medium text-[#1A1A1A] font-outfit">
                            ${privateRoomPrice}
                          </span>
                        </div>
                      </div>
                    </>
                  )}

                  {/* Category 2: Pre and Post Tour Extras #5880:7640 */}
                  {hasExtraNights && (
                    <>
                      <div
                        className={`px-3.5 sm:px-5 md:px-6 py-2.5 sm:py-3.5 ${
                          hasPrivateRoom ? "border-t" : ""
                        } border-b border-[rgba(26,26,26,0.1)] flex flex-col justify-center`}
                        style={{
                          backgroundColor: "rgba(181, 185, 177, 0.12)",
                          minHeight: "44px",
                        }}
                      >
                        <div className="text-[12.27px] sm:text-[16px] md:text-[20px] font-normal text-[#000000] leading-[0.9em] font-outfit">
                          Pre and Post Tour Extras
                        </div>
                        <div className="text-[9px] sm:text-[12px] md:text-[16px] text-[#000000]/80 font-light font-outfit mt-0.5 md:mt-1">
                          Keep discovering
                        </div>
                      </div>

                      {/* Extra Nights (#5880:7654) */}
                      <div className="px-3.5 sm:px-5 md:px-6 py-3 sm:py-4 md:py-5 flex items-center justify-between gap-3 md:gap-4 border-b border-[rgba(26,26,26,0.1)]">
                        <div className="flex items-start gap-2.5 md:gap-4">
                          <div className="w-[18px] h-[18px] md:w-[21px] md:h-[21px] rounded-full bg-[#1A1A1A] hover:bg-black text-white flex items-center justify-center text-[12px] md:text-[15px] font-normal leading-none shrink-0 mt-0.5 select-none cursor-pointer transition-colors">
                            +
                          </div>
                          <div>
                            <div className="text-[12.27px] sm:text-[14px] md:text-[16px] font-normal text-[#1A1A1A] font-outfit mb-0.5">
                              Extra Nights
                            </div>
                            <p className="text-[10px] sm:text-[12px] md:text-[14px] text-[#1A1A1A]/70 font-light font-outfit leading-relaxed max-w-xl">
                              Arrive earlier or extend your stay with additional
                              hotel nights at our partner accommodations.
                            </p>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <div>
                            <span className="text-[10px] sm:text-[12px] md:text-[14px] text-[#1A1A1A] font-light font-outfit mr-1">
                              From
                            </span>
                            <span className="text-[13px] sm:text-[16px] md:text-[20px] font-medium text-[#1A1A1A] font-outfit">
                              ${minExtraNightPrice}
                            </span>
                          </div>
                          <div className="text-[9px] sm:text-[11px] md:text-[13px] text-gray-500 font-light font-outfit">
                            / Night
                          </div>
                        </div>
                      </div>

                      {/* Transfers (#5880:7663) */}
                      <div className="px-3.5 sm:px-5 md:px-6 py-3 sm:py-4 md:py-5 flex items-center justify-between gap-3 md:gap-4">
                        <div className="flex items-start gap-2.5 md:gap-4">
                          <div className="w-[18px] h-[18px] md:w-[21px] md:h-[21px] rounded-full bg-[#1A1A1A] hover:bg-black text-white flex items-center justify-center text-[12px] md:text-[15px] font-normal leading-none shrink-0 mt-0.5 select-none cursor-pointer transition-colors">
                            +
                          </div>
                          <div>
                            <div className="text-[12.27px] sm:text-[14px] md:text-[16px] font-normal text-[#1A1A1A] font-outfit mb-0.5">
                              Transfers
                            </div>
                            <p className="text-[10px] sm:text-[12px] md:text-[14px] text-[#1A1A1A]/70 font-light font-outfit leading-relaxed max-w-xl">
                              Pre-arranged airport and hotel private transfers for
                              stress-free connections.
                            </p>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-[10px] sm:text-[12px] md:text-[14px] text-[#1A1A1A] font-light font-outfit mr-1">
                            From
                          </span>
                          <span className="text-[13px] sm:text-[16px] md:text-[20px] font-medium text-[#1A1A1A] font-outfit">
                            $35
                          </span>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              );
            })()}

            {/* Continue Your Journey Card Right (316px #5295:7335 - #5295:7358 - Desktop only) */}
            <div
              className="hidden lg:flex w-full xl:w-[316px] rounded-[13.4px] p-5 border border-[rgba(26,26,26,0.2)] shadow-2xs flex-col justify-between font-outfit"
              style={{
                backgroundColor: "rgba(181, 185, 177, 0.1)",
                minHeight: "282px",
              }}
            >
              <div>
                <h3 className="font-gochi text-[24px] text-[#254B02] leading-tight mb-2">
                  Continue Your Journey
                </h3>
                <p className="text-[12px] text-[#1A1A1A]/70 font-light font-outfit leading-relaxed mb-4 border-b border-[rgba(26,26,26,0.2)] pb-4">
                  Your adventure doesn’t have to end here—discover another tour
                  starting right after, from the same destination. Seamlessly
                  extend your travel with handpicked experiences nearby.
                </p>

                <div className="mb-4">
                  <div className="text-[18px] sm:text-[20px] font-normal text-[#1A1A1A] font-outfit leading-snug mb-1">
                    Next Tour: Kathmandu to Pokhara Escape
                  </div>
                  <div className="text-[12px] text-[#1A1A1A]/70 font-light font-outfit">
                    Duration: 3 Days • Scenic drive • Lakeside stay
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  onClick={() => router.push("/trips")}
                  className="bg-[#1A1A1A] hover:bg-black text-white text-[14px] sm:text-[15px] font-medium font-outfit px-5 py-2 rounded-full flex items-center gap-2 transition cursor-pointer shadow-xs"
                >
                  Start Exploring
                </button>
                <button
                  onClick={() => router.push("/trips")}
                  className="w-[35px] h-[35px] rounded-full bg-[#1A1A1A] hover:bg-black text-white flex items-center justify-center cursor-pointer transition shadow-xs shrink-0"
                  aria-label="Start Exploring"
                >
                  <ArrowUpRight
                    size={15}
                    className="text-white"
                    weight="bold"
                  />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 10. "Meet Your Local Guides" (100% Figma MCP Match #5091:8967 & Mobile #5880:8100) */}
        <div className="mb-10 md:mb-20 font-outfit">
          {/* Main Heading */}
          <h2 className="text-[24px] sm:text-[34.74px] md:text-[40px] xl:text-[54px] font-normal text-[#1A1A1A] mb-5 md:mb-8 leading-[1.05] tracking-[0.007em]">
            Meet Your <br className="hidden sm:inline" />
            <span className="font-gochi text-[#3B5D1B]">Local Guides</span>
          </h2>

          {/* 2 Equal Columns Below Heading */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 xl:gap-10 items-stretch">
            {/* Left Column: Image on Left + Quote Block on Right (Side by side on mobile & desktop) */}
            <div className="flex flex-row items-center gap-3 sm:gap-6 bg-white/50 rounded-[12px] p-2 sm:p-0">
              {/* Photo on Left */}
              <div className="w-[140px] sm:w-[170px] md:w-[240px] h-[150px] sm:h-[180px] md:h-[303px] rounded-[8.25px] md:rounded-[12px] overflow-hidden relative shrink-0 shadow-xs">
                <Image
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=800&auto=format&fit=crop"
                  alt="Lead Guide Amir"
                  fill
                  className="object-cover"
                />
              </div>

              {/* Quote Block on Right of Image */}
              <div className="flex flex-col justify-center flex-1 py-1 sm:py-3 sm:pr-4">
                <div className="inline-block px-2.5 md:px-3.5 py-0.5 md:py-1 bg-[#1A1A1A] md:bg-[#1A1A1A]/70 text-white rounded-[70px] md:rounded-[111px] text-[8.95px] md:text-[14px] font-normal mb-2 md:mb-3 shadow-xs self-start">
                  400+ Local Guides
                </div>
                <p className="text-[12.37px] md:text-[16px] text-[#1A1A1A] font-light md:font-normal leading-[14.8px] md:leading-[23.4px] tracking-[-0.0234em] mb-1.5 md:mb-3">
                  “Every trip is personal. We keep groups small to make sure
                  your experience feels private, safe, and unforgettable.”
                </p>
                <div className="text-[10.3px] md:text-[14px] text-[#1A1A1A]/50 font-light">
                  — Amir , Founder &amp; Lead Guide
                </div>
              </div>
            </div>

            {/* Right Column: Guide Story Card */}
            <div
              className="rounded-[12px] border border-[#D9D9E4]/60 overflow-hidden flex flex-col sm:flex-row shadow-xs min-h-0 md:min-h-[303px]"
              style={{ backgroundColor: "rgba(181, 185, 177, 0.12)" }}
            >
              {/* Left Photo */}
              <div className="w-full sm:w-[240px] md:w-[260px] xl:w-[307px] h-[200px] sm:h-auto relative shrink-0">
                <Image
                  src="https://images.unsplash.com/photo-1543269865-cbf427effbad?q=80&w=800&auto=format&fit=crop"
                  alt="Adventure Guide"
                  fill
                  className="object-cover"
                />
              </div>

              {/* Right Content */}
              <div className="p-4 sm:p-6 md:p-7 flex flex-col justify-between flex-1">
                <div>
                  <h4 className="text-[16px] sm:text-[18px] md:text-[20px] font-bold md:font-medium text-[#1A1A1A] mb-2 md:mb-3 leading-snug tracking-[-0.0229em]">
                    Step inside a journey guided by passion and experience
                  </h4>
                  <p className="text-[12px] sm:text-[14px] md:text-[16px] text-[#404040] md:text-[#1A1A1A] font-light leading-relaxed tracking-[-0.0286em]">
                    Each tour is led by people who know every dune, story, and
                    sunrise of AlUla guides who turn every route into a journey
                    worth remembering.
                  </p>
                </div>

                {/* Social Circle Icons */}
                <div className="flex items-center gap-2 md:gap-2.5 mt-3 md:mt-5">
                  <a
                    href="https://facebook.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-[22px] h-[22px] md:w-[24px] md:h-[24px] rounded-full flex items-center justify-center text-[#1A1A1A] hover:bg-black hover:text-white transition"
                    style={{ backgroundColor: "rgba(181, 185, 177, 0.3)" }}
                    aria-label="Facebook"
                  >
                    <svg
                      className="w-2.5 h-2.5 md:w-3 md:h-3"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
                    </svg>
                  </a>
                  <a
                    href="https://instagram.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-[22px] h-[22px] md:w-[24px] md:h-[24px] rounded-full flex items-center justify-center text-[#1A1A1A] hover:bg-black hover:text-white transition"
                    style={{ backgroundColor: "rgba(181, 185, 177, 0.3)" }}
                    aria-label="Instagram"
                  >
                    <svg
                      className="w-2.5 h-2.5 md:w-3 md:h-3"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                    </svg>
                  </a>
                  <a
                    href="https://twitter.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-[22px] h-[22px] md:w-[24px] md:h-[24px] rounded-full flex items-center justify-center text-[#1A1A1A] hover:bg-black hover:text-white transition"
                    style={{ backgroundColor: "rgba(181, 185, 177, 0.3)" }}
                    aria-label="X / Twitter"
                  >
                    <svg
                      className="w-2 md:w-2.5 h-2 md:h-2.5"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                    </svg>
                  </a>
                  <a
                    href="https://youtube.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-[22px] h-[22px] md:w-[24px] md:h-[24px] rounded-full flex items-center justify-center text-[#1A1A1A] hover:bg-black hover:text-white transition"
                    style={{ backgroundColor: "rgba(181, 185, 177, 0.3)" }}
                    aria-label="YouTube"
                  >
                    <svg
                      className="w-2.5 h-2.5 md:w-3 md:h-3"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                    </svg>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 11. "The Good you’re doing" (100% Figma MCP Match #5295:6938 & Mobile #5880:8148) */}
        <div className="w-full max-w-[1210px] mx-auto rounded-[12px] p-0 md:p-6 xl:p-[38px] flex flex-row items-center gap-3 sm:gap-6 md:gap-8 mb-10 md:mb-20 shadow-none md:shadow-2xs font-outfit bg-transparent md:bg-[rgba(181,185,177,0.12)]">
          {/* Nature Graphic Box Left (129x129px Mobile #5880:8148 / 183x130px Desktop) */}
          <div className="w-[110px] sm:w-[129px] md:w-[183px] h-[110px] sm:h-[129px] md:h-[130px] rounded-[10px] md:rounded-[12px] overflow-hidden relative shrink-0 shadow-xs block">
            <Image
              src="/why_we_love_trees.png"
              alt="Forest and Trees"
              fill
              className="object-cover"
            />
          </div>

          {/* Right Text, Stats & Button Area (#5880:8152 & #5295:6940) */}
          <div className="flex-1 flex flex-col justify-between w-full min-w-0">
            {/* Title (#5880:8154 & #5295:6941) */}
            <h3 className="text-[17px] sm:text-[22px] md:text-[30px] xl:text-[32px] font-normal text-[#1A1A1A] mb-1 sm:mb-2 leading-tight font-outfit">
              The Good you’re doing
            </h3>

            {/* Description (#5880:8157 & #5295:6944) */}
            <p className="text-[10px] sm:text-[13px] md:text-[16px] font-light md:font-normal text-[#1A1A1A]/70 leading-snug md:leading-relaxed mb-1.5 sm:mb-2 max-w-4xl font-outfit">
              Our Adventures gives you more opportunities to do Nothing But Good
              to support important causes in destinations you visit and around
              the world
            </p>

            {/* Bottom Row: Stats & Learn More Button (#5880:8149 - #5880:8159) */}
            <div className="flex items-end justify-between gap-2 sm:gap-4">
              <div className="flex flex-col gap-0.5 sm:gap-1.5 text-[9.5px] sm:text-[12px] md:text-[16px] font-normal text-[#1A1A1A] font-outfit">
                <span>Trees Planted this trip : 08</span>
                <span>Tours Gifted : 12</span>
              </div>

              <Link
                href="/tree-planting"
                className="h-[20px] sm:h-[24px] md:h-[26px] bg-[#1A1A1A] hover:bg-black text-white text-[9.5px] sm:text-[12px] md:text-[16px] font-normal font-outfit px-3 sm:px-5 md:px-[35px] rounded-[20px] md:rounded-[34px] transition whitespace-nowrap inline-flex items-center justify-center shrink-0 shadow-xs"
              >
                Learn More
              </Link>
            </div>
          </div>
        </div>

        {/* 12. "Plans Change. Adventure Continues." (100% Figma MCP Match #5295:8047 - #5295:8114 / Mobile #5880:8160 - #5880:8224) */}
        <div
          className="-mx-4 sm:-mx-6 md:-mx-8 xl:-mx-[35px] px-3.5 sm:px-6 md:px-8 xl:px-[35px] py-6 sm:py-10 md:py-12 xl:py-[42px] mb-8 md:mb-20 rounded-[12px] bg-[#FCF9F4] md:bg-[rgba(244,236,217,0.2)]"
        >
          <div className="w-full max-w-[1210px] mx-auto">
            {/* Header Row (#5295:8049 & #5295:8053 / Mobile #5880:8161) */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 md:gap-6 mb-4 md:mb-8 sm:mb-10">
              <div>
                <span className="inline-block text-[8.59px] md:text-[13px] font-medium md:font-normal text-[#1A1A1A]/70 bg-white md:bg-[rgba(26,26,26,0.06)] px-2 md:px-3 py-0.5 md:py-1 rounded-full mb-1.5 md:mb-3 font-outfit">
                  Tours Snippets
                </span>
                <h2 className="text-[26px] sm:text-[34px] md:text-[42px] xl:text-[48px] font-normal text-[#1A1A1A] font-outfit leading-tight">
                  Plans Change. <br />
                  <span className="font-gochi text-[#3B5D1B] md:text-[#254B02]">
                    Adventure Continues.
                  </span>
                </h2>
              </div>
              <p className="hidden md:block text-[14px] sm:text-[16px] font-light text-[#6C114E] max-w-md md:text-right leading-[1.4] font-outfit">
                We organize{" "}
                <span className="font-normal">
                  guided trips, scenic routes, and local experiences
                </span>{" "}
                with comfort and clear schedules.
              </p>
            </div>

            {/* 4 White Feature Cards (Figma 100% Match #5295:8054 - #5295:8096 / Mobile #5880:8165 - #5880:8223) */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-5 xl:gap-[36px]">
              {/* Card 1 (#5295:8054 / Mobile #5880:8165) */}
              <div className="bg-white rounded-[7.36px] md:rounded-[12px] p-3 md:p-5 sm:p-6 flex flex-col justify-between min-h-[140px] md:min-h-[225px] shadow-[0px_0.61px_9.2px_-1.2px_rgba(0,0,0,0.03)] md:shadow-[0_2px_12px_rgba(0,0,0,0.05)] font-outfit">
                <div className="h-[36px] md:h-[65px] mb-2 md:mb-3.5 flex items-center justify-start">
                  <Image
                    src="/gggg1.svg"
                    alt="Free Date Change"
                    width={66}
                    height={65}
                    className="h-[32px] sm:h-[45px] md:h-[65px] w-auto object-contain object-left"
                  />
                </div>
                <div>
                  <h4 className="text-[12.26px] sm:text-[16px] md:text-[18px] sm:md:text-[20px] font-normal text-[#2F3D44] md:text-[#1A1A1A] mb-1 md:mb-1.5 leading-snug font-outfit">
                    Free Date Change
                  </h4>
                  <p className="text-[8.58px] sm:text-[11px] md:text-[13px] sm:text-[14px] font-light text-[#1A1A1A]/70 leading-[11px] md:leading-[20px] font-outfit">
                    Free date change options where applicable.
                  </p>
                </div>
              </div>

              {/* Card 2 (#5295:8075 / Mobile #5880:8186) */}
              <div className="bg-white rounded-[7.36px] md:rounded-[12px] p-3 md:p-5 sm:p-6 flex flex-col justify-between min-h-[140px] md:min-h-[225px] shadow-[0px_0.61px_9.2px_-1.2px_rgba(0,0,0,0.03)] md:shadow-[0_2px_12px_rgba(0,0,0,0.05)] font-outfit">
                <div className="h-[36px] md:h-[65px] mb-2 md:mb-3.5 flex items-center justify-start">
                  <Image
                    src="/gggg2.svg"
                    alt="Adventure Credit"
                    width={81}
                    height={65}
                    className="h-[32px] sm:h-[45px] md:h-[65px] w-auto object-contain object-left"
                  />
                </div>
                <div>
                  <h4 className="text-[12.26px] sm:text-[16px] md:text-[18px] sm:md:text-[20px] font-normal text-[#2F3D44] md:text-[#1A1A1A] mb-1 md:mb-1.5 leading-snug font-outfit">
                    Adventure Credit
                  </h4>
                  <p className="text-[8.58px] sm:text-[11px] md:text-[13px] sm:text-[14px] font-light text-[#1A1A1A]/70 leading-[11px] md:leading-[20px] font-outfit">
                    Because sometimes life changes.
                    <br />
                    Your adventure should still be waiting.
                  </p>
                </div>
              </div>

              {/* Card 3 (#5295:8086 / Mobile #5880:8195) */}
              <div className="bg-white rounded-[7.36px] md:rounded-[12px] p-3 md:p-5 sm:p-6 flex flex-col justify-between min-h-[140px] md:min-h-[225px] shadow-[0px_0.61px_9.2px_-1.2px_rgba(0,0,0,0.03)] md:shadow-[0_2px_12px_rgba(0,0,0,0.05)] font-outfit">
                <div className="h-[36px] md:h-[65px] mb-2 md:mb-3.5 flex items-center justify-start">
                  <Image
                    src="/gggg3.svg"
                    alt="Hold My Adventure"
                    width={64}
                    height={64}
                    className="h-[32px] sm:h-[45px] md:h-[64px] w-auto object-contain object-left"
                  />
                </div>
                <div>
                  <h4 className="text-[12.26px] sm:text-[16px] md:text-[18px] sm:md:text-[20px] font-normal text-[#2F3D44] md:text-[#1A1A1A] mb-1 md:mb-1.5 leading-snug font-outfit">
                    Hold My Adventure
                  </h4>
                  <p className="text-[8.58px] sm:text-[11px] md:text-[13px] sm:text-[14px] font-light text-[#1A1A1A]/70 leading-[11px] md:leading-[20px] font-outfit">
                    Not ready to decide today?
                    <br />
                    Reserve your place while you prepare.
                  </p>
                </div>
              </div>

              {/* Card 4 (#5295:8096 / Mobile #5880:8205) */}
              <div className="bg-white rounded-[7.36px] md:rounded-[12px] p-3 md:p-5 sm:p-6 flex flex-col justify-between min-h-[140px] md:min-h-[225px] shadow-[0px_0.61px_9.2px_-1.2px_rgba(0,0,0,0.03)] md:shadow-[0_2px_12px_rgba(0,0,0,0.05)] font-outfit">
                <div className="h-[36px] md:h-[65px] mb-2 md:mb-3.5 flex items-center justify-start">
                  <Image
                    src="/gggg4.svg"
                    alt="Pay Your Way"
                    width={93}
                    height={65}
                    className="h-[32px] sm:h-[45px] md:h-[65px] w-auto object-contain object-left"
                  />
                </div>
                <div>
                  <h4 className="text-[12.26px] sm:text-[16px] md:text-[18px] sm:md:text-[20px] font-normal text-[#2F3D44] md:text-[#1A1A1A] mb-1 md:mb-1.5 leading-snug font-outfit">
                    Pay Your Way
                  </h4>
                  <p className="text-[8.58px] sm:text-[11px] md:text-[13px] sm:text-[14px] font-light text-[#1A1A1A]/70 leading-[11px] md:leading-[20px] font-outfit">
                    Make meaningful travel easier to plan.
                  </p>
                </div>
              </div>
            </div>

            {/* Mobile Subtext (#5880:8224) */}
            <div className="block md:hidden text-right mt-3">
              <p className="text-[9.81px] font-light text-[#6C114E] leading-[1.3] font-outfit">
                We organize{" "}
                <span className="font-normal">
                  guided trips, scenic routes, and local experiences
                </span>{" "}
                with comfort and clear schedules.
              </p>
            </div>
          </div>
        </div>

        {/* 12 & 13. Adventure Deposit & Check Availability with Sticky Right "Book Privately" Panel (100% Figma MCP Match #5295:7697, #5295:7717, #5295:8248) */}
        <div id="check-availability-section" className="mb-10 md:mb-20">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_316px] xl:grid-cols-[853px_316px] gap-6 xl:gap-[41px] items-start">
            {/* Left Column (853px / 1fr): Adventure Deposit + Check Availability */}
            <div className="space-y-6 md:space-y-8 w-full min-w-0">
              {/* Adventure Deposit Card (100% Screenshot & Figma Exact Match #5295:7697 / Mobile #5880:8231, #5880:8384) */}
              <div
                className="w-full rounded-[7.36px] md:rounded-[12px] border border-[rgba(26,26,26,0.2)] md:border-[rgba(26,26,26,0.12)] p-3 sm:p-5 md:p-6 relative overflow-hidden font-outfit shadow-2xs"
                style={{ backgroundColor: "rgba(181, 185, 177, 0.1)" }}
              >
                {/* Right background graphic shape */}
                <div className="absolute top-0 right-0 w-[75px] md:w-[140px] h-[43px] md:h-[80px] pointer-events-none opacity-20 select-none">
                  <svg
                    viewBox="0 0 123 70"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-full h-full"
                  >
                    <path
                      d="M0 0H123V70C123 70 90 60 60 70C30 80 0 0 0 0Z"
                      fill="#1A1A1A"
                    />
                  </svg>
                </div>

                <div className="relative z-10 flex flex-col">
                  {/* Header: Icon + Title */}
                  <div className="flex items-center gap-2 md:gap-3 mb-1.5 md:mb-2">
                    <div className="w-[14px] md:w-[23px] h-[15px] md:h-[24px] flex items-center justify-center shrink-0">
                      <Image
                        src="/aadd.svg"
                        alt="Adventure Deposit"
                        width={23}
                        height={24}
                        className="w-[14px] md:w-[23px] h-[15px] md:h-[24px] object-contain"
                      />
                    </div>
                    <h3 className="text-[19.6px] sm:text-[26px] md:text-[32px] font-normal text-[#1A1A1A] font-outfit tracking-[-0.0143em] leading-tight">
                      Adventure Deposit
                    </h3>
                  </div>

                  {/* Description & Learn More Button */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-4 mt-0.5 md:mt-1">
                    <p className="text-[9.81px] sm:text-[14px] md:text-[16px] font-light text-[#1A1A1A]/70 font-outfit tracking-[-0.0286em] leading-[14.35px] sm:leading-relaxed max-w-[692px]">
                      Lock in your Trip with a small &quot;Deposit amount&quot;
                      Adventure Deposit if it departs 60+ days from now.
                    </p>

                    <Link
                      href="/why-nba"
                      className="bg-[#1A1A1A] hover:bg-black text-white text-[9.81px] sm:text-[14px] md:text-[16px] font-medium font-outfit px-3 sm:px-5 py-0.5 sm:py-1 rounded-[11.65px] md:rounded-[19px] transition whitespace-nowrap inline-flex items-center justify-center shrink-0 self-end sm:self-auto min-w-[68px] md:min-w-[112px] h-[18px] md:h-[28px] text-center shadow-xs"
                    >
                      Learn More
                    </Link>
                  </div>
                </div>
              </div>

              {/* 13. "Check Availability" (Exact 100% Figma MCP Flow #5295:7717 - #5295:7970 / Mobile #5880:8235 - #5880:8383) */}
              <div className="w-full border border-[rgba(47,61,68,0.3)] md:border-[rgba(47,61,68,0.3)] rounded-[12px] overflow-hidden bg-white shadow-2xs font-outfit">
                {/* Top Header Bar (#5295:7719 - #5295:7723 / Mobile #5880:8235, #5880:8283, #5880:8284) */}
                <div
                  className="px-4 sm:px-6 md:px-8 py-3.5 sm:py-6 border-b border-[rgba(26,26,26,0.1)] flex flex-col justify-center min-h-[64px] sm:min-h-[85px] md:min-h-[104px]"
                  style={{
                    backgroundColor: "rgba(181, 185, 177, 0.1)",
                  }}
                >
                  <h2 className="text-[19.6px] sm:text-[26px] md:text-[32px] font-normal text-[#1A1A1A] font-outfit tracking-[-0.0143em] leading-tight">
                    Check Availability
                  </h2>
                  <p className="text-[9.81px] sm:text-[14px] md:text-[16px] font-light text-[#1A1A1A]/70 font-outfit tracking-[-0.0286em] mt-0.5 sm:mt-1">
                    Select Your Preferred dates and secure your spot on this
                    Tour.
                  </p>
                </div>

                {/* Dual / Single Month Calendar Widget Container (#5295:7741 - #5295:7884 / Mobile #5880:8285) */}
                <div className="py-4 sm:py-7 px-3 sm:px-8 lg:px-10 bg-white">
                  {(() => {
                    const activeDep =
                      displayedDepartures[activeDepartureIndex] ||
                      displayedDepartures[0];
                    const baseDate = activeDep?.startDate
                      ? new Date(activeDep.startDate)
                      : validStartDates[0]?.startDate
                        ? new Date(validStartDates[0].startDate)
                        : new Date();

                    const month1Date = new Date(
                      baseDate.getFullYear(),
                      baseDate.getMonth() + calendarOffset,
                      1,
                    );
                    const month2Date = new Date(
                      baseDate.getFullYear(),
                      baseDate.getMonth() + calendarOffset + 1,
                      1,
                    );

                    const formatPrice = (dep: any) => {
                      const disc = getDiscountPercentage(dep.discount);
                      const base = dep.price?.amount || basePrice;
                      const eff =
                        disc > 0 ? Math.round(base * (1 - disc / 100)) : base;
                      return eff >= 1000
                        ? `$${(eff / 1000).toFixed(1)}k`
                        : `$${eff}`;
                    };

                    const renderMonthCalendar = (
                      targetDate: Date,
                      onPrevClick?: () => void,
                      onNextClick?: () => void,
                    ) => {
                      const monthName = targetDate.toLocaleDateString("en-US", {
                        month: "short",
                        year: "numeric",
                      });
                      const year = targetDate.getFullYear();
                      const monthIdx = targetDate.getMonth();
                      const daysInMonth = new Date(
                        year,
                        monthIdx + 1,
                        0,
                      ).getDate();
                      const firstDay = new Date(year, monthIdx, 1).getDay();

                      const isSameDay = (d1: Date, d2: Date) =>
                        d1.getFullYear() === d2.getFullYear() &&
                        d1.getMonth() === d2.getMonth() &&
                        d1.getDate() === d2.getDate();

                      const isBetweenDays = (
                        d: Date,
                        start: Date,
                        end: Date,
                      ) => {
                        const t = new Date(
                          d.getFullYear(),
                          d.getMonth(),
                          d.getDate(),
                        ).getTime();
                        const s = new Date(
                          start.getFullYear(),
                          start.getMonth(),
                          start.getDate(),
                        ).getTime();
                        const e = new Date(
                          end.getFullYear(),
                          end.getMonth(),
                          end.getDate(),
                        ).getTime();
                        return t > s && t < e;
                      };

                      const cells: Array<{
                        day?: number;
                        isCurrent: boolean;
                        date?: Date;
                      }> = [];
                      for (let i = 0; i < firstDay; i++) {
                        cells.push({ isCurrent: false });
                      }
                      for (let i = 1; i <= daysInMonth; i++) {
                        cells.push({
                          day: i,
                          isCurrent: true,
                          date: new Date(year, monthIdx, i),
                        });
                      }
                      const totalCells = cells.length > 35 ? 42 : 35;
                      const remaining = totalCells - cells.length;
                      for (let i = 1; i <= remaining; i++) {
                        cells.push({ day: i, isCurrent: false });
                      }

                      const depStart = activeDep?.startDate
                        ? new Date(activeDep.startDate)
                        : null;
                      const depEnd = activeDep?.endDate
                        ? new Date(activeDep.endDate)
                        : depStart
                          ? new Date(
                              depStart.getTime() +
                                (tour.duration.days - 1) * 86400000,
                            )
                          : null;

                      return (
                        <div className="border border-[#E5E5E5] rounded-[8px] md:rounded-[16px] p-3 sm:p-5 md:p-6 bg-white shadow-2xs font-outfit">
                          {/* Calendar Header with Navigation */}
                          <div className="flex items-center justify-between mb-2.5 sm:mb-4 px-1">
                            <button
                              onClick={onPrevClick}
                              className="p-1 sm:p-1.5 text-[#1A1A1A] hover:text-gray-600 transition cursor-pointer"
                              aria-label="Previous month"
                            >
                              <CaretLeft size={16} className="sm:w-5 sm:h-5" weight="bold" />
                            </button>

                            <span className="text-[14.9px] sm:text-[18px] md:text-[20px] font-normal text-[#1A1A1A] font-outfit">
                              {monthName}
                            </span>

                            <button
                              onClick={onNextClick}
                              className="p-1 sm:p-1.5 text-[#1A1A1A] hover:text-gray-600 transition cursor-pointer"
                              aria-label="Next month"
                            >
                              <CaretRight size={16} className="sm:w-5 sm:h-5" weight="bold" />
                            </button>
                          </div>

                          {/* Day of Week Header (#5295:7744 / Mobile #5880:8287) */}
                          <div className="grid grid-cols-7 text-center text-[10px] sm:text-[13px] font-normal text-[#8E8E93] mb-1.5 sm:mb-2.5 font-outfit">
                            <span>Su</span>
                            <span>Mo</span>
                            <span>Tu</span>
                            <span>We</span>
                            <span>Th</span>
                            <span>Fr</span>
                            <span>Sa</span>
                          </div>

                          {/* Calendar Grid */}
                          <div className="grid grid-cols-7 gap-y-1.5 sm:gap-y-2.5 gap-x-0.5 sm:gap-x-1 text-center text-[12px] sm:text-[15px] font-normal text-[#1A1A1A] font-outfit items-center justify-items-center">
                            {cells.map((cell, cIdx) => {
                              if (!cell.isCurrent || !cell.date) {
                                return (
                                  <div
                                    key={cIdx}
                                    className="w-[32px] h-[32px] sm:w-[42px] sm:h-[42px] flex items-center justify-center"
                                  >
                                    {cell.day ? (
                                      <span className="text-[#C7C7CC] text-[12px] sm:text-[15px]">
                                        {cell.day}
                                      </span>
                                    ) : null}
                                  </div>
                                );
                              }

                              const currentDate = cell.date;

                              // Check if matches active selected departure (#57063C #5295:7841)
                              const isStart =
                                depStart && isSameDay(currentDate, depStart);
                              const isEnd =
                                depEnd && isSameDay(currentDate, depEnd);
                              const isBetween =
                                depStart &&
                                depEnd &&
                                isBetweenDays(currentDate, depStart, depEnd);

                              if (isStart) {
                                const disc = getDiscountPercentage(
                                  activeDep.discount,
                                );
                                return (
                                  <div
                                    key={cIdx}
                                    className="relative w-[32px] h-[32px] sm:w-[42px] sm:h-[42px] flex items-center justify-center cursor-pointer"
                                  >
                                    {disc > 0 && (
                                      <span className="absolute top-[1px] left-[1px] sm:top-[2px] sm:left-[2px] w-[6px] h-[6px] sm:w-[8px] sm:h-[8px] rounded-full bg-[#FF3B30] z-10 shadow-xs pointer-events-none" />
                                    )}
                                    <div className="w-[32px] h-[32px] sm:w-[42px] sm:h-[42px] rounded-full bg-[#57063C] text-white flex flex-col items-center justify-center shadow-xs select-none">
                                      <span className="text-[12px] sm:text-[15px] font-medium leading-none">
                                        {cell.day}
                                      </span>
                                      <span className="text-[7px] sm:text-[9px] font-light leading-none mt-0.5 opacity-90">
                                        {formatPrice(activeDep)}
                                      </span>
                                    </div>
                                  </div>
                                );
                              }

                              if (isEnd) {
                                return (
                                  <div
                                    key={cIdx}
                                    className="w-[32px] h-[32px] sm:w-[42px] sm:h-[42px] flex items-center justify-center cursor-pointer"
                                  >
                                    <div className="w-[32px] h-[32px] sm:w-[42px] sm:h-[42px] rounded-full bg-[#57063C] text-white flex items-center justify-center shadow-xs select-none">
                                      <span className="text-[12px] sm:text-[15px] font-medium leading-none">
                                        {cell.day}
                                      </span>
                                    </div>
                                  </div>
                                );
                              }

                              if (isBetween) {
                                return (
                                  <div
                                    key={cIdx}
                                    className="w-[32px] h-[32px] sm:w-[42px] sm:h-[42px] flex items-center justify-center cursor-pointer"
                                  >
                                    <div className="w-[32px] h-[32px] sm:w-[42px] sm:h-[42px] rounded-full bg-[rgba(87,6,60,0.08)] text-[#57063C] flex items-center justify-center select-none">
                                      <span className="text-[12px] sm:text-[15px] font-medium leading-none">
                                        {cell.day}
                                      </span>
                                    </div>
                                  </div>
                                );
                              }

                              // Check if matches other unselected departures
                              const otherDepIdx = displayedDepartures.findIndex(
                                (dep, idx) => {
                                  if (idx === activeDepartureIndex)
                                    return false;
                                  const s = dep.startDate
                                    ? new Date(dep.startDate)
                                    : null;
                                  const e = dep.endDate
                                    ? new Date(dep.endDate)
                                    : s
                                      ? new Date(
                                          s.getTime() +
                                            (tour.duration.days - 1) * 86400000,
                                        )
                                      : null;
                                  if (!s) return false;
                                  return (
                                    isSameDay(currentDate, s) ||
                                    (e && isSameDay(currentDate, e)) ||
                                    (e && isBetweenDays(currentDate, s, e))
                                  );
                                },
                              );

                              if (otherDepIdx >= 0) {
                                const otherDep =
                                  displayedDepartures[otherDepIdx];
                                const otherStart = new Date(otherDep.startDate);
                                const isOtherStart = isSameDay(
                                  currentDate,
                                  otherStart,
                                );

                                if (isOtherStart) {
                                  return (
                                    <div
                                      key={cIdx}
                                      onClick={() =>
                                        setActiveDepartureIndex(otherDepIdx)
                                      }
                                      className="relative w-[32px] h-[32px] sm:w-[42px] sm:h-[42px] flex items-center justify-center cursor-pointer group"
                                    >
                                      <div className="w-[32px] h-[32px] sm:w-[42px] sm:h-[42px] rounded-full bg-[#585C60] text-white flex flex-col items-center justify-center shadow-xs transition group-hover:bg-[#4A4E51] select-none">
                                        <span className="text-[12px] sm:text-[15px] font-medium leading-none">
                                          {cell.day}
                                        </span>
                                        <span className="text-[7px] sm:text-[9px] font-light leading-none mt-0.5 opacity-90">
                                          {formatPrice(otherDep)}
                                        </span>
                                      </div>
                                    </div>
                                  );
                                }

                                return (
                                  <div
                                    key={cIdx}
                                    onClick={() =>
                                      setActiveDepartureIndex(otherDepIdx)
                                    }
                                    className="w-[32px] h-[32px] sm:w-[42px] sm:h-[42px] flex items-center justify-center cursor-pointer group"
                                  >
                                    <div className="w-[32px] h-[32px] sm:w-[42px] sm:h-[42px] rounded-full bg-[#EAEAEA] text-[#1A1A1A] flex items-center justify-center transition group-hover:bg-[#E0E0E0] select-none">
                                      <span className="text-[12px] sm:text-[15px] font-normal leading-none">
                                        {cell.day}
                                      </span>
                                    </div>
                                  </div>
                                );
                              }

                              // Regular Day
                              return (
                                <div
                                  key={cIdx}
                                  className="w-[32px] h-[32px] sm:w-[42px] sm:h-[42px] flex items-center justify-center"
                                >
                                  <span className="text-[12px] sm:text-[15px] font-normal text-[#1A1A1A] w-[30px] h-[30px] sm:w-[38px] sm:h-[38px] flex items-center justify-center rounded-full hover:bg-gray-100 cursor-pointer transition select-none">
                                    {cell.day}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    };

                    return (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-10 lg:gap-12">
                        {renderMonthCalendar(
                          month1Date,
                          () => setCalendarOffset((prev) => prev - 1),
                          () => setCalendarOffset((prev) => prev + 1),
                        )}
                        <div className="hidden md:block">
                          {renderMonthCalendar(
                            month2Date,
                            () => setCalendarOffset((prev) => prev - 1),
                            () => setCalendarOffset((prev) => prev + 1),
                          )}
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* Month Selector Tabs & Filter Header (#5295:7939 - #5295:7967 / Mobile #5880:8237) */}
                <div
                  className="px-3 sm:px-6 py-2.5 sm:py-3.5 flex flex-col lg:flex-row lg:items-center justify-between gap-2.5 sm:gap-4 border-t border-b border-[rgba(181,185,177,0.2)] font-outfit"
                  style={{
                    backgroundColor: "rgba(181, 185, 177, 0.1)",
                  }}
                >
                  {/* Left: Month Tabs with Smooth Scroll & Dynamic Black/Gray Arrows */}
                  <div className="flex items-center gap-1.5 sm:gap-2.5 max-w-full">
                    {/* Left Arrow Button */}
                    <button
                      onClick={() => handleScrollMonths("left")}
                      disabled={!canScrollLeft}
                      className={`w-[22px] h-[22px] sm:w-[32px] sm:h-[32px] rounded-full flex items-center justify-center text-white transition shrink-0 shadow-2xs ${
                        canScrollLeft
                          ? "bg-[#1A1A1A] hover:bg-black cursor-pointer"
                          : "bg-[#9E9E9E] cursor-default opacity-80"
                      }`}
                      aria-label="Scroll left"
                    >
                      <CaretLeft size={13} className="sm:w-4 sm:h-4" weight="bold" />
                    </button>

                    {/* Smooth Scrollable Months Container */}
                    <div
                      ref={monthScrollRef}
                      onScroll={updateScrollButtons}
                      className="flex items-center gap-1.5 sm:gap-2.5 overflow-x-auto scroll-smooth w-full sm:w-[410px] md:w-[440px] py-0.5 sm:py-1"
                      style={{
                        scrollbarWidth: "none",
                        msOverflowStyle: "none",
                      }}
                    >
                      {availableMonths.map((m) => {
                        const isSelected = selectedMonth === m.key;
                        return (
                          <button
                            key={m.key}
                            onClick={() => {
                              setSelectedMonth(isSelected ? null : m.key);
                              setActiveDepartureIndex(0);
                            }}
                            className={`min-w-[70px] sm:min-w-[114px] w-[70px] sm:w-[114px] h-[36px] sm:h-[54px] px-2 sm:px-3.5 py-1 sm:py-1.5 rounded-[5px] sm:rounded-[12px] flex flex-col justify-center text-left transition cursor-pointer shrink-0 shadow-xs border-0 ${
                              isSelected
                                ? "bg-[#57063C] text-white"
                                : "bg-white text-[#1A1A1A] hover:bg-gray-50"
                            }`}
                          >
                            <span className="text-[10px] sm:text-[15px] font-medium sm:font-bold leading-tight truncate">
                              {m.label}
                            </span>
                            <span
                              className={`text-[8px] sm:text-[12px] font-normal leading-tight mt-0.5 truncate ${isSelected ? "text-white/90" : "text-[#696969]"}`}
                            >
                              from ${m.minPrice}
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Right Arrow Button */}
                    <button
                      onClick={() => handleScrollMonths("right")}
                      disabled={!canScrollRight}
                      className={`w-[22px] h-[22px] sm:w-[32px] sm:h-[32px] rounded-full flex items-center justify-center text-white transition shrink-0 shadow-2xs ${
                        canScrollRight
                          ? "bg-[#1A1A1A] hover:bg-black cursor-pointer"
                          : "bg-[#9E9E9E] cursor-default opacity-80"
                      }`}
                      aria-label="Scroll right"
                    >
                      <CaretRight size={13} className="sm:w-4 sm:h-4" weight="bold" />
                    </button>
                  </div>

                  {/* Right: Filter Dropdown Buttons (#5295:7960, #5295:7964 / Mobile #5880:8275, #5880:8279) */}
                  <div className="flex items-center gap-2 sm:gap-3 shrink-0 self-end lg:self-center font-outfit">
                    {/* Deals Filter Toggle */}
                    <button
                      onClick={() => setFilterDealsOnly(!filterDealsOnly)}
                      className={`rounded-[5px] sm:rounded-[10px] px-2.5 sm:px-4 h-[24px] sm:h-[42px] text-[10px] sm:text-[15px] font-normal font-outfit flex items-center gap-1.5 sm:gap-2.5 shadow-xs transition cursor-pointer border-0 ${
                        filterDealsOnly
                          ? "bg-[#57063C] text-white shadow-xs"
                          : "bg-white text-[#1A1A1A] hover:bg-gray-50"
                      }`}
                    >
                      <span>Deals ({totalDealsCount || 5})</span>
                      <CaretDown
                        size={11}
                        className={`sm:w-3.5 sm:h-3.5 ${
                          filterDealsOnly ? "text-white" : "text-[#1A1A1A]"
                        }`}
                      />
                    </button>

                    {/* Price Sort Toggle */}
                    <button
                      onClick={() =>
                        setPriceSortOrder(
                          priceSortOrder === "low-to-high"
                            ? "high-to-low"
                            : "low-to-high",
                        )
                      }
                      className="bg-white rounded-[5px] sm:rounded-[10px] px-2.5 sm:px-4 h-[24px] sm:h-[42px] text-[10px] sm:text-[15px] font-normal font-outfit text-[#1A1A1A] flex items-center gap-1.5 sm:gap-2.5 shadow-xs hover:bg-gray-50 border-0 transition cursor-pointer"
                      title="Toggle Price Sorting"
                    >
                      <span>
                        Price (
                        {priceSortOrder === "low-to-high"
                          ? "low to h..."
                          : "high to l..."}
                        )
                      </span>
                      <CaretDown size={11} className="sm:w-3.5 sm:h-3.5 text-[#1A1A1A]" />
                    </button>
                  </div>
                </div>

                {/* Departure Rows Container (#5295:7720 - #5295:7938 / Mobile #5880:8362 - #5880:8383) */}
                <div className="p-3 sm:p-7 space-y-2 sm:space-y-3 bg-white font-outfit">
                  {/* Sub-header row (#5295:7720, #5295:7721 / Mobile #5880:8362, #5880:8357) */}
                  <div className="flex items-center justify-between mb-1.5 sm:mb-3 px-1 font-outfit">
                    <h4 className="text-[12.26px] sm:text-[20px] font-normal text-[#1A1A1A] font-outfit tracking-[-0.02em]">
                      All Available Dates
                    </h4>
                    <span className="text-[9.81px] sm:text-[16px] font-light text-[#57063C] md:text-[#1A1A1A]/80 font-outfit hover:underline cursor-pointer">
                      Do you want Sooner dates?
                    </span>
                  </div>

                  {/* Dynamic Departure Rows */}
                  {displayedDepartures.length > 0 ? (
                    displayedDepartures.map((d, index) => {
                      const startDateObj = new Date(d.startDate);
                      const endDateObj = d.endDate
                        ? new Date(d.endDate)
                        : new Date(
                            startDateObj.getTime() +
                              (tour.duration.days - 1) * 86400000,
                          );
                      const dateStr =
                        startDateObj.toLocaleDateString("en-US", {
                          month: "short",
                          day: "2-digit",
                        }) +
                        " - " +
                        endDateObj.toLocaleDateString("en-US", {
                          month: "short",
                          day: "2-digit",
                        });
                      const disc = getDiscountPercentage(d.discount);
                      const base = d.price?.amount || basePrice;
                      const price =
                        disc > 0 ? Math.round(base * (1 - disc / 100)) : base;
                      const isoDateStr = startDateObj
                        .toISOString()
                        .split("T")[0];
                      const isSelected = activeDepartureIndex === index;

                      return (
                        <div
                          key={d._id || index}
                          onClick={() => setActiveDepartureIndex(index)}
                          style={{
                            border: isSelected
                              ? "1.5px solid #57063C"
                              : "1.5px solid transparent",
                            backgroundColor: isSelected
                              ? "rgba(87, 6, 60, 0.08)"
                              : "rgba(181, 185, 177, 0.15)",
                          }}
                          className="rounded-[7.36px] md:rounded-[12px] px-3 md:px-5 min-h-[30px] md:min-h-[62px] h-auto md:h-[62px] py-1.5 md:py-0 grid grid-cols-3 items-center md:flex md:items-center md:justify-between relative transition-all cursor-pointer font-outfit"
                        >
                          {/* Column 1: Date & Status Tag (Left aligned) */}
                          <div className="flex flex-col justify-center shrink-0 text-left">
                            {disc > 0 && (
                              <span className="text-[#FF2B00] text-[6.13px] md:text-[10px] font-normal tracking-tight leading-none mb-0.5">
                                On Sale
                              </span>
                            )}
                            <span className="text-[9.8px] md:text-[16px] font-medium text-[#1A1A1A] leading-tight tracking-tight font-outfit">
                              {dateStr}
                            </span>
                          </div>

                          {/* Column 2: Spots Left Tag (Centered on mobile!) */}
                          <div className="flex justify-center items-center">
                            <div className="bg-white rounded-full md:rounded-[25px] px-2 md:px-3.5 py-0.5 md:py-1 flex items-center justify-center shrink-0 shadow-2xs">
                              <span className="text-[7.36px] md:text-[12px] text-[#1A1A1A] font-normal opacity-85 leading-none whitespace-nowrap font-outfit">
                                {d.availableSpots ??
                                  (d as any).remainingSpots ??
                                  (d as any).spotsLeft ??
                                  14}{" "}
                                Spots Left
                              </span>
                            </div>
                          </div>

                          {/* Column 3: Price & Desktop Actions (Right aligned on mobile) */}
                          <div className="flex items-center justify-end gap-2 md:gap-4 font-outfit text-right">
                            <div className="flex items-baseline gap-0.5 shrink-0 font-outfit">
                              <span className="text-[8px] md:text-[11px] font-semibold text-[#1A1A1A] self-start mt-0.5 md:mt-1 mr-0.5 font-outfit">
                                $
                              </span>
                              <span className="text-[13px] md:text-[32px] font-bold md:font-bold text-[#1A1A1A] tracking-tight leading-none font-outfit">
                                {price}
                              </span>
                              <span className="text-[6.13px] md:text-[10px] font-medium text-[#1A1A1A] ml-0.5 md:ml-1 self-end mb-0.5 leading-none whitespace-nowrap font-outfit">
                                USD/Per Person
                              </span>
                            </div>

                            {/* Desktop-only Action Buttons (#5295:7736, #5295:7739) */}
                            <div className="hidden md:flex items-center gap-3 shrink-0 ml-auto font-outfit">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setHoldSelectedDate(isoDateStr);
                                  handleHoldSpace(isoDateStr);
                                }}
                                className={`h-[32px] px-5 text-[14px] font-normal transition cursor-pointer flex items-center justify-center min-w-[136px] font-outfit ${
                                  isSelected
                                    ? "bg-[rgba(87,6,60,0.2)] hover:bg-[rgba(87,6,60,0.3)] text-[#1A1A1A] rounded-[27px]"
                                    : "bg-[rgba(26,26,26,0.1)] hover:bg-[rgba(26,26,26,0.18)] text-[#1A1A1A] rounded-[31px]"
                                }`}
                              >
                                Hold Adventure
                              </button>

                              {/* Relative Book Now Button Container with Discount Tag Attached */}
                              <div className="relative inline-flex items-center">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    router.push(
                                      `/trips/${tour.slug}/${tour.tourCode}/checkout?date=${isoDateStr}`,
                                    );
                                  }}
                                  className={`h-[32px] px-6 text-[14px] font-normal transition cursor-pointer shadow-xs flex items-center justify-center min-w-[125px] text-white font-outfit ${
                                    isSelected
                                      ? "bg-[#57063C] hover:bg-[#43042e] rounded-[27px]"
                                      : "bg-[#696969] hover:bg-[#1A1A1A] rounded-[31px]"
                                  }`}
                                >
                                  Book Now
                                </button>

                                {/* Bookmark Discount Ribbon Attached Directly Over Book Now Right Side (#5295:7904) */}
                                {disc > 0 && (
                                  <div className="absolute -top-[17px] right-[5px] flex flex-col items-center z-20 select-none pointer-events-none">
                                    <svg
                                      width="25"
                                      height="40"
                                      viewBox="0 0 25 40"
                                      fill="none"
                                      xmlns="http://www.w3.org/2000/svg"
                                      className="drop-shadow-xs"
                                    >
                                      <path
                                        d="M0 4C0 1.79086 1.79086 0 4 0H21C23.2091 0 25 1.79086 25 4V40L12.5 30L0 40V4Z"
                                        fill="#FFFFFF"
                                        stroke={
                                          isSelected ? "#57063C" : "#D1D1D6"
                                        }
                                        strokeWidth="1"
                                      />
                                    </svg>
                                    <span
                                      className={`absolute top-1 text-[9px] font-bold leading-[1.05] text-center font-outfit ${
                                        isSelected
                                          ? "text-[#57063C]"
                                          : "text-[#1A1A1A]"
                                      }`}
                                    >
                                      {disc}%<br />
                                      Off
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Mobile-only Bookmark Ribbon attached to right edge (#5880:8364, #5880:8367) */}
                          {disc > 0 && (
                            <div className="block md:hidden absolute -top-[10px] -right-[3px] z-20 select-none pointer-events-none">
                              <div className="relative flex flex-col items-center">
                                <svg
                                  width="16"
                                  height="24"
                                  viewBox="0 0 25 40"
                                  fill="none"
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="drop-shadow-xs"
                                >
                                  <path
                                    d="M0 4C0 1.79086 1.79086 0 4 0H21C23.2091 0 25 1.79086 25 4V40L12.5 30L0 40V4Z"
                                    fill="#FFFFFF"
                                    stroke={
                                      isSelected ? "#57063C" : "#D1D1D6"
                                    }
                                    strokeWidth="1.2"
                                  />
                                </svg>
                                <span
                                  className={`absolute top-0.5 text-[5.5px] font-bold leading-[1.05] text-center font-outfit ${
                                    isSelected
                                      ? "text-[#57063C]"
                                      : "text-[#1A1A1A]"
                                  }`}
                                >
                                  {disc}%<br />
                                  Off
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <div className="py-10 text-center text-gray-500 font-light font-outfit">
                      <p className="text-[14px] sm:text-[16px] text-[#1A1A1A] mb-2 font-outfit">
                        No departures found for the selected filters.
                      </p>
                      <button
                        onClick={() => {
                          setSelectedMonth(null);
                          setFilterDealsOnly(false);
                          setActiveDepartureIndex(0);
                        }}
                        className="text-[#57063C] font-medium underline text-[12px] sm:text-[14px] cursor-pointer font-outfit"
                      >
                        Reset filters
                      </button>
                    </div>
                  )}

                  {/* Mobile Bottom Action Bar (#5880:8358, #5880:8360, #5880:8383) */}
                  <div className="flex md:hidden items-center justify-between pt-2">
                    <div className="flex items-center gap-2">
                      {/* Hold Adventure Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const activeDep = displayedDepartures[activeDepartureIndex] || displayedDepartures[0];
                          if (activeDep?.startDate) {
                            const isoDateStr = new Date(activeDep.startDate).toISOString().split("T")[0];
                            setHoldSelectedDate(isoDateStr);
                            handleHoldSpace(isoDateStr);
                          }
                        }}
                        className="h-[19px] px-2.5 text-[8px] font-normal transition cursor-pointer flex items-center justify-center bg-[rgba(58,28,54,0.2)] hover:bg-[rgba(58,28,54,0.3)] text-[#1A1A1A] rounded-[20.97px] font-outfit shadow-2xs"
                      >
                        Hold Adventure
                      </button>

                      {/* Book Now Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const activeDep = displayedDepartures[activeDepartureIndex] || displayedDepartures[0];
                          if (activeDep?.startDate) {
                            const isoDateStr = new Date(activeDep.startDate).toISOString().split("T")[0];
                            router.push(`/trips/${tour.slug}/${tour.tourCode}/checkout?date=${isoDateStr}`);
                          }
                        }}
                        className="h-[19px] px-3 text-[8px] font-normal transition cursor-pointer flex items-center justify-center bg-[#57063C] hover:bg-[#43042e] text-white rounded-[20.97px] font-outfit shadow-2xs"
                      >
                        Book Now
                      </button>
                    </div>

                    {/* Clear date button on mobile */}
                    <button
                      onClick={() => {
                        setSelectedMonth(null);
                        setFilterDealsOnly(false);
                        setPriceSortOrder("low-to-high");
                        setActiveDepartureIndex(0);
                      }}
                      className="text-[#57063C] hover:underline text-[10px] font-normal cursor-pointer font-outfit"
                    >
                      Clear date
                    </button>
                  </div>

                  {/* Desktop Clear Date button */}
                  <div className="hidden md:flex justify-end pt-3 pr-1">
                    <button
                      onClick={() => {
                        setSelectedMonth(null);
                        setFilterDealsOnly(false);
                        setPriceSortOrder("low-to-high");
                        setActiveDepartureIndex(0);
                      }}
                      className="text-[#57063C] hover:underline text-[16px] font-normal cursor-pointer font-outfit"
                    >
                      Clear date
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Sticky Column (316px #5295:8248 / Mobile #5880:8431 - #5880:8448): "Book Privately" Card */}
            <div className="w-full xl:w-[316px] lg:sticky lg:top-24 space-y-4 font-outfit">
              <div className="w-full bg-white border border-[rgba(0,0,0,0.12)] md:border-[rgba(26,26,26,0.15)] rounded-[7.36px] md:rounded-[12px] overflow-hidden shadow-2xs flex flex-col font-outfit">
                {/* Top Photo (#5295:8267 / Mobile #5880:8448) */}
                <div className="w-full h-[104px] md:h-[169px] relative bg-gray-900 overflow-hidden rounded-t-[6px] md:rounded-t-[12px]">
                  <Image
                    src={tour.images?.[1]?.url || "/mountain_hikers.png"}
                    alt="Book Privately"
                    fill
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-black/5" />
                </div>

                {/* Card Content (#5295:8252 / Mobile #5880:8433) */}
                <div className="px-2.5 pt-2 pb-2.5 md:p-5 flex flex-col justify-between flex-1 font-outfit">
                  <div>
                    <h4 className="text-[14.72px] md:text-[24px] font-normal text-[#1A1A1A] font-outfit leading-normal md:leading-tight mb-0.5 md:mb-1.5">
                      Book Privately
                    </h4>
                    <p className="text-[8.59px] md:text-[14px] font-light text-[#1A1A1A]/70 font-outfit leading-tight md:leading-relaxed mb-2 md:mb-2.5">
                      Enjoy your journey with added privacy, comfort, and
                      exclusive personal space.
                    </p>
                  </div>

                  <div className="flex items-center gap-[2.45px] md:gap-2">
                    <Link
                      href={`/contact?subject=Private%20Booking%20for%20${encodeURIComponent(tour.name)}`}
                      className="bg-[#1A1A1A] hover:bg-black text-white text-[7.52px] md:text-[14px] font-medium font-outfit px-2.5 md:px-5 h-[20.24px] md:h-[35px] rounded-full flex items-center justify-center transition cursor-pointer shadow-xs whitespace-nowrap"
                    >
                      Start Exploring
                    </Link>
                    <Link
                      href={`/contact?subject=Private%20Booking%20for%20${encodeURIComponent(tour.name)}`}
                      className="w-[20.3px] h-[20.3px] md:w-[35px] md:h-[35px] rounded-full bg-[#1A1A1A] hover:bg-black text-white flex items-center justify-center cursor-pointer transition shadow-xs shrink-0"
                      aria-label="Start Exploring"
                    >
                      <ArrowUpRight
                        size={9}
                        className="md:hidden text-white"
                        weight="bold"
                      />
                      <ArrowUpRight
                        size={15}
                        className="hidden md:block text-white"
                        weight="bold"
                      />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 14. Reviews Section */}
        <div ref={recommendedToursRef} className="mb-10 md:mb-20">
          <ReviewsSection />
        </div>

        {/* 15. Recently Viewed Section */}
        <div className="mb-10 md:mb-20">
          <RecentlyViewedSection />
        </div>

        {/* 16. FAQ Section */}
        <div className="mb-10 md:mb-20">
          <FaqSection />
        </div>
      </div>

      {/* 17. Sticky Footer for Desktop (100% Figma MCP Match #5091:8488) */}
      {(showStickyFooter || showFullItineraryModal) && (
        <div
          className={`hidden md:block fixed bottom-0 left-0 right-0 bg-white border-t border-[rgba(26,26,26,0.12)] shadow-[0_-4px_16px_rgba(0,0,0,0.06)] animate-in slide-in-from-bottom duration-300 ${
            showFullItineraryModal ? "z-[102]" : "z-50"
          }`}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              {/* Left Info Group */}
              <div className="flex flex-wrap items-center gap-6 sm:gap-8 lg:gap-10">
                {/* Route & Duration */}
                <div className="flex flex-col justify-center">
                  <div className="text-[17px] sm:text-[18px] font-normal text-[#1A1A1A] font-outfit leading-tight">
                    {tour.location?.startCity && tour.location?.endCity
                      ? `${tour.location.startCity} to ${tour.location.endCity}`
                      : tour.name}
                  </div>
                  <div className="text-[13px] sm:text-[14px] font-light text-[#1A1A1A]/80 leading-tight mt-0.5">
                    {tour.duration.days} Days
                  </div>
                </div>

                {/* Price & Discount Info */}
                <div className="flex items-center gap-2">
                  <div className="flex flex-col justify-center">
                    <span className="text-[10px] font-light text-[#1A1A1A]/70 leading-none mb-0.5">
                      From
                    </span>
                    <div className="flex items-baseline">
                      <span className="text-[11px] font-semibold text-[#1A1A1A] self-start mt-0.5 mr-0.5">
                        $
                      </span>
                      <span className="text-[26px] sm:text-[28px] font-bold text-[#1A1A1A] leading-none tracking-tight font-outfit">
                        {Math.round(discountedPrice)}
                      </span>
                      <span className="text-[10px] font-normal text-[#1A1A1A] ml-1 self-end mb-0.5 leading-none">
                        USD
                      </span>
                    </div>
                  </div>

                  {/* Sale Tag & Was Price */}
                  {bestDiscount > 0 && (
                    <div className="flex flex-col justify-center pl-1">
                      <span className="text-[#FF2B00] text-[10px] font-normal leading-none mb-0.5">
                        Sale {bestDiscount}%
                      </span>
                      <span className="text-[8px] font-light text-[#1A1A1A]/60 leading-none">
                        was
                      </span>
                      <span className="text-[13px] font-normal text-[#1A1A1A] line-through leading-tight">
                        ${basePrice}
                      </span>
                    </div>
                  )}
                </div>

                {/* Vertical Divider */}
                <div className="w-[1px] h-[34px] bg-[#E5E5E5] hidden md:block" />

                {/* Valid on Date */}
                <div className="hidden md:flex flex-col justify-center">
                  <span className="text-[10px] font-light text-[#1A1A1A]/70 leading-none mb-0.5">
                    on
                  </span>
                  <span className="text-[14px] sm:text-[15px] font-normal text-[#1A1A1A] leading-tight font-outfit">
                    {dealDepartureDateStr}
                  </span>
                </div>
              </div>

              {/* Right Side: Check Dates And Prices Button */}
              <div className="w-full sm:w-auto flex justify-end">
                <button
                  onClick={() => {
                    const datesSection = document.getElementById(
                      "check-availability-section",
                    );
                    if (datesSection) {
                      datesSection.scrollIntoView({ behavior: "smooth" });
                    }
                  }}
                  className="w-full sm:w-auto bg-[#1A1A1A] hover:bg-black text-white text-[15px] sm:text-[16px] font-normal px-8 sm:px-10 py-1.5 h-[34px] flex items-center justify-center rounded-[34px] transition cursor-pointer shadow-xs whitespace-nowrap text-center"
                >
                  Check Dates And Prices
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Auth Modal for Hold Space */}
      <AuthModal
        isOpen={showHoldAuthModal}
        onClose={() => setShowHoldAuthModal(false)}
        initialView="login"
        onSuccess={() => {
          setShowHoldAuthModal(false);
          handleHoldSpace();
        }}
      />

      {/* Gallery Lightbox Modal */}
      {showGalleryModal && (
        <div className="fixed inset-0 z-[100] bg-black/90 flex flex-col justify-between p-4 sm:p-8">
          <div className="flex items-center justify-between text-white">
            <h3 className="text-lg font-medium">
              {tour.name} Gallery ({activeImageIndex + 1} /{" "}
              {galleryImages.length})
            </h3>
            <button
              onClick={() => setShowGalleryModal(false)}
              className="p-2 hover:bg-white/10 rounded-full transition text-white cursor-pointer"
            >
              <X size={28} />
            </button>
          </div>

          <div className="relative w-full h-[70vh] flex items-center justify-center my-auto">
            <Image
              src={galleryImages[activeImageIndex]}
              alt={`${tour.name} image ${activeImageIndex + 1}`}
              fill
              className="object-contain"
            />
          </div>

          <div className="flex items-center justify-between text-white max-w-md mx-auto w-full">
            <button
              onClick={() =>
                setActiveImageIndex((prev) =>
                  prev > 0 ? prev - 1 : galleryImages.length - 1,
                )
              }
              className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-full transition cursor-pointer text-sm"
            >
              <CaretLeft size={18} /> Prev
            </button>
            <div className="flex gap-1.5 overflow-x-auto max-w-[200px] py-1">
              {galleryImages.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImageIndex(idx)}
                  className={`w-2 h-2 rounded-full transition-all cursor-pointer ${idx === activeImageIndex ? "bg-white scale-125" : "bg-white/40"}`}
                />
              ))}
            </div>
            <button
              onClick={() =>
                setActiveImageIndex((prev) =>
                  prev < galleryImages.length - 1 ? prev + 1 : 0,
                )
              }
              className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-full transition cursor-pointer text-sm"
            >
              Next <CaretRight size={18} />
            </button>
          </div>
        </div>
      )}

      {/* Full Itinerary Modal */}
      {showFullItineraryModal && (
        <div className="fixed inset-0 z-[105] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-[20px] max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-[#F8F8F7]">
              <div>
                <span className="text-[12px] font-medium tracking-wider uppercase text-gray-500">
                  {tour.tourCode} • {tour.duration?.days} Days
                </span>
                <h3 className="text-[24px] font-normal text-[#1A1A1A]">
                  Full Itinerary:{" "}
                  <span className="font-medium">{tour.name}</span>
                </h3>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => window.print()}
                  className="hidden sm:flex items-center gap-1.5 px-4 py-2 border border-gray-300 hover:border-black rounded-full text-[13px] font-medium text-[#1A1A1A] transition cursor-pointer"
                >
                  <svg
                    className="w-4 h-4 text-black"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
                    />
                  </svg>
                  <span>Print</span>
                </button>
                <button
                  onClick={() => setShowFullItineraryModal(false)}
                  className="w-10 h-10 rounded-full hover:bg-gray-200/80 flex items-center justify-center transition cursor-pointer text-[#1A1A1A]"
                >
                  <X size={22} />
                </button>
              </div>
            </div>

            {/* Modal Content - All Days */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              {tour.itinerary.map((day) => (
                <div
                  key={day.day}
                  className="bg-[#F8F8F7] rounded-[12px] p-6 space-y-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <h4 className="text-[22px] font-normal text-[#1A1A1A]">
                      {day.title || `Day ${day.day}`}
                    </h4>
                    <span className="px-4 py-1 bg-[#1A1A1A] text-white rounded-full text-[14px] font-normal shrink-0">
                      Day {day.day}
                    </span>
                  </div>

                  {day.description && (
                    <p className="text-[15px] text-[#1A1A1A]/70 font-light leading-relaxed">
                      {day.description}
                    </p>
                  )}

                  {day.activities && day.activities.length > 0 && (
                    <div className="pt-2">
                      <div className="text-[15px] font-medium text-[#1A1A1A] mb-3">
                        Activities ({day.activities.length})
                      </div>
                      <div className="relative pl-[35px] space-y-4">
                        <div className="absolute left-[12px] top-[6px] bottom-[6px] w-[1px] bg-[#AEAEAD]" />
                        {day.activities.map((act, aIdx) => (
                          <div key={aIdx} className="relative">
                            <div className="absolute -left-[25px] top-[7px] w-[5px] h-[5px] rounded-full bg-[#1A1A1A]" />
                            <div className="text-[15px] font-normal text-[#1A1A1A]">
                              {act.name || act.title}
                            </div>
                            {act.description && (
                              <div className="text-[13px] text-[#1A1A1A]/60 font-light mt-0.5">
                                {act.description}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
