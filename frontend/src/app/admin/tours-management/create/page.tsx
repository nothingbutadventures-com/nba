"use client";

import { useState, useEffect, useCallback } from "react";
import { Notebook, Images, MapTrifold, Buildings, CalendarBlank, CheckCircle } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { uploadTourImage } from "@/lib/firebase";
import { Toaster, toast } from "react-hot-toast";
import ImagePickerModal from "@/components/ImagePickerModal";
import CreateActivityModal from "@/components/CreateActivityModal";
import CreateHotelModal from "@/components/CreateHotelModal";
import SearchHotelModal from "@/components/SearchHotelModal";
import BeforeYouBookEditor from "@/components/admin/BeforeYouBookEditor";

// Material UI Components & Icons
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select from "@mui/material/Select";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
import Radio from "@mui/material/Radio";
import RadioGroup from "@mui/material/RadioGroup";
import FormLabel from "@mui/material/FormLabel";
import Chip from "@mui/material/Chip";
import InputAdornment from "@mui/material/InputAdornment";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import IconButton from "@mui/material/IconButton";
import CircularProgress from "@mui/material/CircularProgress";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import CloudUploadOutlinedIcon from "@mui/icons-material/CloudUploadOutlined";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";

interface Country {
  _id: string;
  name: string;
  id?: string;
}

interface ImageUpload {
  file: File | null;
  preview: string;
  caption: string;
  isPrimary: boolean;
  uploading: boolean;
  url: string;
}

interface Activity {
  name: string;
  description: string;
  placeName: string;
  duration: string;
  icon: string;
}

interface ActivityOption {
  _id: string;
  title: string;
  description?: string;
  destination?: { _id?: string; name?: string } | string;
  travelStyle?: { _id?: string; name?: string } | string;
  location?: string;
  isFree?: boolean;
  price?: number;
}

interface OptionalActivity {
  name: string;
  price: {
    amount: number;
    currency: string;
  };
  place: string;
  description: string;
  duration: string;
  icon: string;
}

interface Accommodation {
  name: string;
  type: string;
  rating?: number;
  description?: string;
}

interface ItineraryDay {
  day: number;
  title: string;
  description: string;
  activities: any[];
  optionalActivities: any[];
  accommodations: Accommodation[];
  meals: string;
  importantNote?: string;
}

interface AvailableDate {
  startDate: string;
  endDate: string;
  availableSpots: number | "";
  discount: string;
}

interface DiscountOption {
  _id: string;
  name: string;
  percentage: number;
  color?: string;
  isActive: boolean;
}

interface TravelStyle {
  _id: string;
  name: string;
  slug: string;
  isActive: boolean;
}

interface PhysicalRatingOption {
  _id: string;
  name: string;
  level: number;
  isActive: boolean;
}

interface TripTypeOption {
  _id: string;
  name: string;
  slug: string;
  isActive: boolean;
}

interface InterestOption {
  _id: string;
  name: string;
  slug: string;
  isActive: boolean;
}


export default function CreateTourPage() {
  const router = useRouter();
  const [countries, setCountries] = useState<Country[]>([]);
  const [continents, setContinents] = useState<any[]>([]);
  const [showDestinationPopup, setShowDestinationPopup] = useState(false);
  const [expandedContinent, setExpandedContinent] = useState<string | null>(null);
  const [travelStyles, setTravelStyles] = useState<TravelStyle[]>([]);
  const [activityOptions, setActivityOptions] = useState<ActivityOption[]>([]);
  const [activitySearchTerms, setActivitySearchTerms] = useState<Record<string, string>>({});
  const [physicalRatings, setPhysicalRatings] = useState<PhysicalRatingOption[]>([]);
  const [tripTypes, setTripTypes] = useState<TripTypeOption[]>([]);
  const [interestsOptions, setInterestsOptions] = useState<InterestOption[]>([]);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [discounts, setDiscounts] = useState<DiscountOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Destinations for the selected country
  const [destinations, setDestinations] = useState<any[]>([]);
  const [plantingLocations, setPlantingLocations] = useState<any[]>([]);
  const [showLocationPopup, setShowLocationPopup] = useState<{ dayIndex: number } | null>(null);
  const [showCityPopup, setShowCityPopup] = useState<'start' | 'end' | null>(null);
  const [showActivityPopup, setShowActivityPopup] = useState<{ dayIndex: number; activityIndex: number; isOptional: boolean } | null>(null);
  const [locationSearch, setLocationSearch] = useState("");
  const [addingLocation, setAddingLocation] = useState(false);
  const [activitySearch, setActivitySearchInput] = useState("");
  const [showCreateActivityModal, setShowCreateActivityModal] = useState(false);

  // Hotels state
  const [hotels, setHotels] = useState<any[]>([]);
  const [selectedPreHotelId, setSelectedPreHotelId] = useState<string>("");
  const [selectedPostHotelId, setSelectedPostHotelId] = useState<string>("");
  const [hotelTarget, setHotelTarget] = useState<"pre" | "post">("pre");
  const [showCreateHotelModal, setShowCreateHotelModal] = useState<boolean>(false);
  const [showSearchHotelModal, setShowSearchHotelModal] = useState<boolean>(false);
  const [searchHotelTarget, setSearchHotelTarget] = useState<"pre" | "post">("pre");

  // Image uploads
  const [images, setImages] = useState<ImageUpload[]>([]);

  // Image Picker Modal State
  const [imagePickerModal, setImagePickerModal] = useState<{
    isOpen: boolean;
    target: "main" | "description" | "map";
    multiple: boolean;
  }>({
    isOpen: false,
    target: "main",
    multiple: false,
  });

  // Description Image
  const [descriptionImage, setDescriptionImage] = useState<{
    file: File | null;
    preview: string;
    uploading: boolean;
    url: string;
  }>({
    file: null,
    preview: "",
    uploading: false,
    url: "",
  });

  // Itinerary Map Image
  const [itineraryMapImage, setItineraryMapImage] = useState<{
    file: File | null;
    preview: string;
    uploading: boolean;
    url: string;
  }>({
    file: null,
    preview: "",
    uploading: false,
    url: "",
  });

  // Itinerary
  const [itinerary, setItinerary] = useState<ItineraryDay[]>([]);

  // Available Dates
  const [availableDates, setAvailableDates] = useState<AvailableDate[]>([]);

  // Before You Book
  const [beforeYouBook, setBeforeYouBook] = useState<any>({
    isTourForMe: "",
    visaInformation: "",
    accommodation: "",
    joiningPoint: "",
  });
  const [beforeYouBookTab, setBeforeYouBookTab] = useState(0);
  const beforeYouBookTabs = [
    { key: "isTourForMe" as const, label: "Is the tour for me" },
    { key: "visaInformation" as const, label: "Visa Information" },
    { key: "accommodation" as const, label: "Accommodation" },
    { key: "joiningPoint" as const, label: "Joining Point" },
  ];

  const [formData, setFormData] = useState({
    name: "",
    summary: "",
    description: "",
    country: "",
    durationDays: "",
    maxGroupSize: "",
    physicalRatingLevel: "",
    priceAmount: "",
    priceCurrency: "USD",
    bookingType: "Percentage",
    bookingPercentage: "",
    bookingAmount: "",
    ownRoomPrice: "",
    exemptFromLifetimeDeposit: false,
    travelStyle: "",
    tripType: "",
    startCity: "",
    endCity: "",
    visitedCities: "",
    highlights: "",
    whatsIncluded: "",
    transportation: "",
    staffExperts: "",
    accommodation: "",
    ageMin: "0",
    ageMax: "0",
    isFeatured: false,
    isActive: true,
    wifiAvailable: false,
    plantingLocation: "",
    treesPlanted: "0",
  });

  // Step wizard state
  type TourStep = 1 | 2 | 3 | 4 | 5;
  const [currentStep, setCurrentStep] = useState<TourStep>(1);
  const totalSteps = 5;

  const stepConfig = [
    { label: "Tour Details", step: 1 as TourStep, icon: Notebook },
    { label: "Media & Pricing", step: 2 as TourStep, icon: Images },
    { label: "Itinerary", step: 3 as TourStep, icon: MapTrifold },
    { label: "Hotels & Info", step: 4 as TourStep, icon: Buildings },
    { label: "Dates & Publish", step: 5 as TourStep, icon: CalendarBlank },
  ];

  const handleStepNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep((prev) => (prev + 1) as TourStep);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleStepPrev = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as TourStep);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  useEffect(() => {
    checkAuthAndFetchData();
  }, []);

  const checkAuthAndFetchData = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/auth/login");
        return;
      }

      const authResponse = await fetch(`${api.baseURL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!authResponse.ok) {
        router.push("/auth/login");
        return;
      }

      const authData = await authResponse.json();

      if (authData.data.user.role !== "admin") {
        router.push("/dashboard");
        return;
      }

      const continentsResponse = await fetch(`${api.baseURL}/continents`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (continentsResponse.ok) {
        const continentsData = await continentsResponse.json();
        const fetchedContinents = continentsData.data.continents || [];
        setContinents(fetchedContinents);
        const flatCountries = fetchedContinents.flatMap((c: any) => c.countries || []);
        setCountries(flatCountries);
      }

      // Fetch travel styles
      const travelStylesResponse = await fetch(`${api.baseURL}/travel-styles`);
      if (travelStylesResponse.ok) {
        const travelStylesData = await travelStylesResponse.json();
        setTravelStyles(travelStylesData.data.travelStyles || []);
      }

      // Fetch physical ratings
      const physicalRatingsResponse = await fetch(`${api.baseURL}/physical-ratings`);
      if (physicalRatingsResponse.ok) {
        const physicalRatingsData = await physicalRatingsResponse.json();
        setPhysicalRatings(physicalRatingsData.data.physicalRatings || []);
      }

      // Fetch trip types
      const tripTypesResponse = await fetch(`${api.baseURL}/trip-types`);
      if (tripTypesResponse.ok) {
        const tripTypesData = await tripTypesResponse.json();
        setTripTypes(tripTypesData.data.tripTypes || []);
      }

      // Fetch interests
      const interestsResponse = await fetch(`${api.baseURL}${api.endpoints.interests.getAll}`);
      if (interestsResponse.ok) {
        const interestsData = await interestsResponse.json();
        setInterestsOptions(interestsData.data.interests || []);
      }

      // Fetch discounts
      const discountsResponse = await fetch(`${api.baseURL}/discounts`);
      if (discountsResponse.ok) {
        const discountsData = await discountsResponse.json();
        setDiscounts(discountsData.data.discounts || []);
      }

      // Fetch activities for itinerary selector
      const activitiesResponse = await fetch(`${api.baseURL}/activities?limit=500`);
      if (activitiesResponse.ok) {
        const activitiesData = await activitiesResponse.json();
        setActivityOptions(activitiesData.data.activities || []);
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDestinations = async (countryId: string) => {
    try {
      const response = await fetch(`${api.baseURL}/countries/${countryId}`);
      const data = await response.json();
      if (data.status === "success") {
        setDestinations(data.data.country.destinations || []);
      }
    } catch (error) {
      console.error("Error fetching destinations:", error);
    }
  };

  const fetchPlantingLocations = async (countryId: string) => {
    try {
      const response = await fetch(`${api.baseURL}/planting-locations?country=${countryId}`);
      if (response.ok) {
        const data = await response.json();
        setPlantingLocations(data.data.plantingLocations || []);
      }
    } catch (error) {
      console.error("Error fetching planting locations:", error);
    }
  };

  const fetchHotels = async (countryId: string) => {
    try {
      const response = await fetch(`${api.baseURL}/hotels?destination=${countryId}`);
      if (response.ok) {
        const data = await response.json();
        setHotels(data.data.hotels || []);
      }
    } catch (error) {
      console.error("Error fetching hotels:", error);
    }
  };

  const handleAddLocation = async () => {
    if (!locationSearch.trim() || !formData.country) return;
    setAddingLocation(true);
    try {
      const token = localStorage.getItem("token");
      const updatedDestinations = [
        ...destinations,
        { name: locationSearch.trim(), description: "" },
      ];

      const response = await fetch(`${api.baseURL}/countries/${formData.country}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ destinations: updatedDestinations }),
      });

      const data = await response.json();
      if (data.status === "success") {
        setDestinations(data.data.country.destinations || []);

        // Handle city popup
        if (showCityPopup) {
          if (showCityPopup === 'start') {
            setFormData(prev => ({ ...prev, startCity: locationSearch.trim() }));
          } else {
            setFormData(prev => ({ ...prev, endCity: locationSearch.trim() }));
          }
          setShowCityPopup(null);
        }

        // Handle location popup (itinerary)
        if (showLocationPopup) {
          const dayIndex = showLocationPopup.dayIndex;
          const currentTags = itinerary[dayIndex].title ? itinerary[dayIndex].title.split(",").filter(t => t.trim()) : [];
          if (!currentTags.includes(locationSearch.trim()) && currentTags.length < 2) {
            const newTitle = [...currentTags, locationSearch.trim()].join(",");
            updateItinerary(dayIndex, "title", newTitle);
          }
          setShowLocationPopup(null);
        }

        setLocationSearch("");
      } else {
        alert("Failed to add location: " + data.message);
      }
    } catch (error) {
      console.error("Error adding location:", error);
      alert("Failed to add location");
    } finally {
      setAddingLocation(false);
    }
  };

  useEffect(() => {
    if (formData.country) {
      fetchDestinations(formData.country);
      fetchPlantingLocations(formData.country);
      fetchHotels(formData.country);
    } else {
      setDestinations([]);
      setPlantingLocations([]);
      setHotels([]);
      setSelectedPreHotelId("");
      setSelectedPostHotelId("");
    }
  }, [formData.country]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value, type } = e.target;

    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  // Image Upload Functions
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);

    files.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImages((prev) => [
          ...prev,
          {
            file,
            preview: reader.result as string,
            caption: "",
            isPrimary: prev.length === 0,
            uploading: false,
            url: "",
          },
        ]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleImagePickerSelect = (urls: string[]) => {
    const target = imagePickerModal.target;

    if (target === "main") {
      urls.forEach((url) => {
        setImages((prev) => [
          ...prev,
          {
            file: null,
            preview: url,
            caption: "",
            isPrimary: prev.length === 0,
            uploading: false,
            url: url,
          },
        ]);
      });
    } else if (target === "description") {
      setDescriptionImage({
        file: null,
        preview: urls[0],
        uploading: false,
        url: urls[0],
      });
    } else if (target === "map") {
      setItineraryMapImage({
        file: null,
        preview: urls[0],
        uploading: false,
        url: urls[0],
      });
    }
  };

  const uploadImageToSupabase = async (file: File): Promise<string> => {
    return await uploadTourImage(file);
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const updateImageCaption = (index: number, caption: string) => {
    setImages((prev) =>
      prev.map((img, i) => (i === index ? { ...img, caption } : img)),
    );
  };

  const setImageAsPrimary = (index: number) => {
    setImages((prev) =>
      prev.map((img, i) => ({ ...img, isPrimary: i === index })),
    );
  };

  // Description Image Functions
  const handleDescriptionImageSelect = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setDescriptionImage({
          file,
          preview: reader.result as string,
          uploading: false,
          url: "",
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const removeDescriptionImage = () => {
    setDescriptionImage({
      file: null,
      preview: "",
      uploading: false,
      url: "",
    });
  };

  // Itinerary Functions
  const addItineraryDay = () => {
    setItinerary((prev) => [
      ...prev,
      {
        day: prev.length + 1,
        title: "",
        description: "",
        activities: [],
        optionalActivities: [],
        accommodations: [{ name: "", type: "Hotel" }],
        meals: "",
        importantNote: "",
      },
    ]);
  };

  const removeItineraryDay = (index: number) => {
    setItinerary((prev) =>
      prev
        .filter((_, i) => i !== index)
        .map((item, i) => ({ ...item, day: i + 1 })),
    );
  };

  const updateItinerary = (
    index: number,
    field: keyof ItineraryDay,
    value: string | number,
  ) => {
    setItinerary((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)),
    );
  };

  // Itinerary Map Image Functions
  const handleItineraryMapImageSelect = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setItineraryMapImage({
          file,
          preview: reader.result as string,
          uploading: false,
          url: "",
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const removeItineraryMapImage = () => {
    setItineraryMapImage({
      file: null,
      preview: "",
      uploading: false,
      url: "",
    });
  };

  // Activity management functions
  const addActivity = (dayIndex: number) => {
    setItinerary((prev) => {
      const newItinerary = [...prev];
      newItinerary[dayIndex].activities = [
        ...newItinerary[dayIndex].activities,
        {
          title: "",
          name: "",
          description: "",
          placeName: "",
          duration: "",
          icon: "MapPin",
        },
      ];
      return newItinerary;
    });
  };

  const removeActivity = (dayIndex: number, activityIndex: number) => {
    setItinerary((prev) => {
      const newItinerary = [...prev];
      newItinerary[dayIndex].activities.splice(activityIndex, 1);
      return newItinerary;
    });
  };

  const updateActivity = (
    dayIndex: number,
    activityIndex: number,
    field: keyof Activity,
    value: string,
  ) => {
    setItinerary((prev) => {
      const newItinerary = [...prev];
      newItinerary[dayIndex].activities[activityIndex] = {
        ...newItinerary[dayIndex].activities[activityIndex],
        [field]: value,
      };
      return newItinerary;
    });
  };

  const getActivitySlotKey = (dayIndex: number, activityIndex: number) =>
    `${dayIndex}-${activityIndex}`;

  const setActivitySearch = (
    dayIndex: number,
    activityIndex: number,
    value: string,
  ) => {
    const key = getActivitySlotKey(dayIndex, activityIndex);
    setActivitySearchTerms((prev) => ({ ...prev, [key]: value }));
  };

  const getFilteredActivityOptions = (searchValue: string) => {
    const normalizedSearch = searchValue.trim().toLowerCase();

    return activityOptions.filter((option) => {
      if (!normalizedSearch) return true;

      const destinationName =
        typeof option.destination === "string"
          ? ""
          : option.destination?.name || "";
      const travelStyleName =
        typeof option.travelStyle === "string"
          ? ""
          : option.travelStyle?.name || "";

      return [option.title, option.description || "", destinationName, travelStyleName]
        .join(" ")
        .toLowerCase()
        .includes(normalizedSearch);
    });
  };

  const applyActivityOption = (
    dayIndex: number,
    activityIndex: number,
    optionId: string,
    isOptional: boolean = false
  ) => {
    const selected = activityOptions.find((option) => option._id === optionId);
    if (!selected) return;

    setItinerary((prev) => {
      const newItinerary = [...prev];
      if (isOptional) {
        newItinerary[dayIndex].optionalActivities[activityIndex] = selected;
      } else {
        newItinerary[dayIndex].activities[activityIndex] = selected;
      }
      return newItinerary;
    });
  };

  // Optional activity management functions
  const addOptionalActivity = (dayIndex: number) => {
    setItinerary((prev) => {
      const newItinerary = [...prev];
      newItinerary[dayIndex].optionalActivities = [
        ...newItinerary[dayIndex].optionalActivities,
        {
          name: "",
          price: { amount: 0, currency: "USD" },
          place: "",
          description: "",
          duration: "",
          icon: "MapPin",
        },
      ];
      return newItinerary;
    });
  };

  const removeOptionalActivity = (dayIndex: number, activityIndex: number) => {
    setItinerary((prev) => {
      const newItinerary = [...prev];
      newItinerary[dayIndex].optionalActivities.splice(activityIndex, 1);
      return newItinerary;
    });
  };

  const updateOptionalActivity = (
    dayIndex: number,
    activityIndex: number,
    field: string,
    value: any,
  ) => {
    setItinerary((prev) => {
      const newItinerary = [...prev];
      if (field === "price.amount") {
        newItinerary[dayIndex].optionalActivities[activityIndex].price.amount =
          value;
      } else if (field === "price.currency") {
        newItinerary[dayIndex].optionalActivities[
          activityIndex
        ].price.currency = value;
      } else {
        newItinerary[dayIndex].optionalActivities[activityIndex] = {
          ...newItinerary[dayIndex].optionalActivities[activityIndex],
          [field]: value,
        };
      }
      return newItinerary;
    });
  };

  // Accommodation management functions
  const addAccommodation = (dayIndex: number) => {
    setItinerary((prev) => {
      const newItinerary = [...prev];
      newItinerary[dayIndex].accommodations = [
        ...newItinerary[dayIndex].accommodations,
        {
          name: "",
          type: "Hotel",
          rating: 3,
          description: "",
        },
      ];
      return newItinerary;
    });
  };

  const removeAccommodation = (
    dayIndex: number,
    accommodationIndex: number,
  ) => {
    setItinerary((prev) => {
      const newItinerary = [...prev];
      newItinerary[dayIndex].accommodations.splice(accommodationIndex, 1);
      return newItinerary;
    });
  };

  const updateAccommodation = (
    dayIndex: number,
    accommodationIndex: number,
    field: keyof Accommodation,
    value: string | number,
  ) => {
    setItinerary((prev) => {
      const newItinerary = [...prev];
      newItinerary[dayIndex].accommodations[accommodationIndex] = {
        ...newItinerary[dayIndex].accommodations[accommodationIndex],
        [field]: value,
      };
      return newItinerary;
    });
  };

  // Available Dates Functions
  const addAvailableDate = () => {
    setAvailableDates((prev) => [
      ...prev,
      {
        startDate: "",
        endDate: "",
        availableSpots: "",
        discount: "",
      },
    ]);
  };

  const removeAvailableDate = (index: number) => {
    setAvailableDates((prev) => prev.filter((_, i) => i !== index));
  };

  const updateAvailableDate = (
    index: number,
    field: keyof AvailableDate,
    value: string | number,
  ) => {
    setAvailableDates((prev) => {
      const updated = prev.map((item, i) => (i === index ? { ...item, [field]: value } : item));

      // Auto-calculate end date if start date is updated and duration is set
      if (field === "startDate" && value) {
        const days = parseInt(formData.durationDays, 10);
        if (!isNaN(days) && days > 0) {
          const [year, month, day] = (value as string).split('-').map(Number);
          if (year && month && day) {
            const start = new Date(year, month - 1, day);
            start.setDate(start.getDate() + (days - 1));

            const newYear = start.getFullYear();
            const newMonth = String(start.getMonth() + 1).padStart(2, '0');
            const newDay = String(start.getDate()).padStart(2, '0');

            updated[index].endDate = `${newYear}-${newMonth}-${newDay}`;
          }
        }
      }
      return updated;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !formData.name ||
      !formData.country ||
      !formData.physicalRatingLevel ||
      !formData.travelStyle ||
      !formData.tripType ||
      !formData.priceAmount
    ) {
      toast.error("Please fill in all required fields: Tour Name, Destination, Physical Rating, Travel Style, Trip Type, and Base Price");
      return;
    }

    try {
      setSubmitting(true);

      // Upload all images to Supabase
      const uploadedImages = await Promise.all(
        images.map(async (img) => {
          if (img.file) {
            const url = await uploadImageToSupabase(img.file);
            return {
              url,
              caption: img.caption,
              isPrimary: img.isPrimary,
            };
          } else if (img.url) {
            return {
              url: img.url,
              caption: img.caption,
              isPrimary: img.isPrimary,
            };
          }
          return null;
        }),
      );

      const validImages = uploadedImages.filter((img) => img !== null) as { url: string; caption: string; isPrimary: boolean }[];

      // Upload description image if exists
      let descriptionImageUrl = descriptionImage.url || "";
      if (descriptionImage.file) {
        descriptionImageUrl = await uploadImageToSupabase(descriptionImage.file);
      }

      // Upload itinerary map image if exists
      let itineraryMapImageUrl = itineraryMapImage.url || "";
      if (itineraryMapImage.file) {
        itineraryMapImageUrl = await uploadImageToSupabase(itineraryMapImage.file);
      }

      // Upload day images
      const itineraryWithImages = await Promise.all(
        itinerary.map(async (day) => {
          return {
            day: day.day,
            title: day.title,
            description: day.description,
            importantNote: day.importantNote,
            activities: day.activities.map(act => act._id || (typeof act === "string" ? act : null)).filter(Boolean),
            optionalActivities: day.optionalActivities.map(act => act._id || (typeof act === "string" ? act : null)).filter(Boolean),
            accommodations: day.accommodations,
            meals: {
              breakfast: day.meals.includes("Breakfast"),
              lunch: day.meals.includes("Lunch"),
              dinner: day.meals.includes("Dinner"),
            },
          };
        }),
      );

      const token = localStorage.getItem("token");

      const visitedCitiesArray = formData.visitedCities
        .split(",")
        .map((city) => city.trim())
        .filter((city) => city !== "");

      const highlightsArray = formData.highlights
        .split("\n")
        .map((h) => h.trim())
        .filter((h) => h !== "");

      const tourData = {
        name: formData.name,
        summary: formData.summary,
        description: formData.description,
        descriptionImage: descriptionImageUrl,
        itineraryMapImage: itineraryMapImageUrl,
        country: formData.country || undefined,
        preTripHotel: selectedPreHotelId || undefined,
        postTripHotel: selectedPostHotelId || undefined,
        hotel: selectedPreHotelId || undefined,
        duration: {
          days: parseInt(formData.durationDays) || undefined,
        },
        maxGroupSize: parseInt(formData.maxGroupSize) || undefined,
        physicalRating: {
          level: parseInt(formData.physicalRatingLevel) || undefined,
        },
        price: {
          amount: parseFloat(formData.priceAmount) || undefined,
          currency: formData.priceCurrency || "USD",
          bookingType: formData.bookingType,
          bookingPercentage: parseFloat(formData.bookingPercentage) || 20,
          bookingAmount: parseFloat(formData.bookingAmount) || 0,
          ownRoomPrice: parseFloat(formData.ownRoomPrice) || 0,
        },
        exemptFromLifetimeDeposit: formData.exemptFromLifetimeDeposit,
        travelStyle: formData.travelStyle || undefined,
        tripType: formData.tripType || undefined,
        interests: selectedInterests,
        serviceLevel: "Standard",
        location: {
          startCity: formData.startCity || undefined,
          endCity: formData.endCity || undefined,
          visitedCities: visitedCitiesArray,
        },
        highlights: highlightsArray,
        whatsIncluded: formData.whatsIncluded,
        transportation: formData.transportation,
        staffExperts: formData.staffExperts,
        accommodation: formData.accommodation,
        images: validImages,
        itinerary: itineraryWithImages,
        startDates: availableDates.map((ad) => ({
          startDate: ad.startDate ? new Date(ad.startDate) : undefined,
          endDate: ad.endDate ? new Date(ad.endDate) : undefined,
          availableSpots: parseInt(formData.maxGroupSize) || undefined,
          discount: ad.discount || undefined,
          isActive: true,
        })).filter((ad) => ad.startDate && ad.endDate),
        ageRequirement: {
          min: parseInt(formData.ageMin) || 0,
          max: parseInt(formData.ageMax) || 99,
        },
        wifiAvailable: formData.wifiAvailable,
        isFeatured: formData.isFeatured,
        isActive: formData.isActive,
        plantingLocation: formData.plantingLocation || undefined,
        treesPlanted: parseInt(formData.treesPlanted) || 0,
        beforeYouBook: {
          isTourForMe: beforeYouBook.isTourForMe || undefined,
          visaInformation: beforeYouBook.visaInformation || undefined,
          accommodation: beforeYouBook.accommodation || undefined,
          joiningPoint: beforeYouBook.joiningPoint || undefined,
        },
      };

      const response = await fetch(`${api.baseURL}/tours`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(tourData),
      });

      if (response.ok) {
        toast.success("Tour created successfully!");
        router.push("/admin/tours-management");
      } else {
        const data = await response.json();
        toast.error(`Failed to create tour: ${data.message || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Error creating tour:", error);
      toast.error("Failed to create tour. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
          <p className="mt-3 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#f8fafc", p: { xs: 2, sm: 3 }, pb: 8 }}>
      <Toaster position="top-right" />

      {/* Header & Breadcrumbs: Matching /admin and /admin/tours-management */}
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          justifyContent: "space-between",
          alignItems: { xs: "flex-start", sm: "center" },
          gap: 1.5,
          mb: 2.5,
        }}
      >
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, color: "#0f172a", fontSize: "1.25rem", lineHeight: 1.2 }}>
            Create New Tour Package
          </Typography>
          <Typography variant="body2" sx={{ color: "#64748b", fontSize: "0.8125rem", mt: 0.25 }}>
            Fill in the tour specifications step-by-step to publish to the adventure catalog
          </Typography>
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Button
            component={Link}
            href="/admin/tours-management"
            variant="outlined"
            size="small"
            startIcon={<ArrowBackRoundedIcon sx={{ fontSize: 16 }} />}
            sx={{
              borderColor: "#e2e8f0",
              color: "#334155",
              fontSize: "0.8125rem",
              borderRadius: "6px",
              height: 32,
              "&:hover": { borderColor: "#cbd5e1", bgcolor: "#ffffff" },
            }}
          >
            Back to Tours
          </Button>
        </Box>
      </Box>

      {/* Stepper Header (Pure Material UI) */}
      <Paper
        sx={{
          p: 1.5,
          mb: 3,
          borderRadius: "6px",
          border: "1px solid #e2e8f0",
          bgcolor: "#ffffff",
          boxShadow: "0 1px 2px 0 rgba(0,0,0,0.02)",
        }}
      >
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "repeat(2, 1fr)", sm: "repeat(5, 1fr)" },
            gap: 1.25,
          }}
        >
          {stepConfig.map((s) => {
            const isCompleted = currentStep > s.step;
            const isCurrent = currentStep === s.step;
            const Icon = s.icon;
            return (
              <Box
                key={s.step}
                onClick={() => {
                  setCurrentStep(s.step);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1.25,
                  p: 1.25,
                  borderRadius: "6px",
                  cursor: "pointer",
                  border: "1px solid",
                  borderColor: isCurrent ? "#0f172a" : isCompleted ? "#cbd5e1" : "#f1f5f9",
                  bgcolor: isCurrent ? "#0f172a" : isCompleted ? "#f8fafc" : "#ffffff",
                  color: isCurrent ? "#ffffff" : "#0f172a",
                  transition: "all 0.15s ease",
                  "&:hover": {
                    borderColor: isCurrent ? "#0f172a" : "#94a3b8",
                    bgcolor: isCurrent ? "#0f172a" : "#f8fafc",
                  },
                }}
              >
                <Box
                  sx={{
                    width: 32,
                    height: 32,
                    borderRadius: "4px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    bgcolor: isCurrent ? "rgba(255,255,255,0.15)" : isCompleted ? "#e2e8f0" : "#f1f5f9",
                    color: isCurrent ? "#ffffff" : isCompleted ? "#0f172a" : "#64748b",
                    flexShrink: 0,
                  }}
                >
                  <Icon size={18} weight={isCurrent ? "bold" : "regular"} />
                </Box>
                <Box sx={{ minWidth: 0 }}>
                  <Typography
                    variant="subtitle2"
                    noWrap
                    sx={{
                      fontSize: "0.785rem",
                      fontWeight: 600,
                      color: isCurrent ? "#ffffff" : "#0f172a",
                      lineHeight: 1.2,
                    }}
                  >
                    {s.label}
                  </Typography>
                  <Typography
                    variant="caption"
                    noWrap
                    sx={{
                      fontSize: "0.68rem",
                      color: isCurrent ? "rgba(255,255,255,0.7)" : isCompleted ? "#10b981" : "#94a3b8",
                      display: "block",
                      fontWeight: 500,
                    }}
                  >
                    {isCompleted ? "Completed" : `Step ${s.step} of 5`}
                  </Typography>
                </Box>
              </Box>
            );
          })}
        </Box>
      </Paper>

      {/* Main Content Form */}
      <form onSubmit={handleSubmit}>

          {/* ==================== STEP 1: TOUR DETAILS ==================== */}
          {currentStep === 1 && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
              <Box sx={{ px: 0.5 }}>
                <Typography variant="h5" sx={{ fontWeight: 700, color: "#0f172a", fontSize: "1.25rem", mb: 0.5 }}>
                  Tour Details
                </Typography>
                <Typography variant="body2" sx={{ color: "#64748b", fontSize: "0.8125rem" }}>
                  Configure basic information, destinations, itinerary maps, and tour categorization.
                </Typography>
              </Box>

              <Paper
                elevation={0}
                sx={{
                  p: { xs: 2.5, sm: 3.5 },
                  borderRadius: "6px",
                  border: "1px solid #e2e8f0",
                  bgcolor: "#ffffff",
                }}
              >
                <Typography variant="subtitle1" sx={{ fontWeight: 600, color: "#0f172a", mb: 0.5, fontSize: "0.95rem" }}>
                  Basic Information
                </Typography>
                <Typography variant="body2" sx={{ color: "#64748b", mb: 3, fontSize: "0.8125rem" }}>
                  Primary details displayed on the tour card and hero section.
                </Typography>

                <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)" }, gap: 2.5 }}>
                  {/* Tour Name */}
                  <Box sx={{ gridColumn: { sm: "span 2" } }}>
                    <TextField
                      label="Tour Name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      fullWidth
                      size="small"
                      placeholder="e.g., Himalayan Adventure Trek - Everest Base Camp"
                      slotProps={{ inputLabel: { shrink: true } }}
                    />
                  </Box>

                  {/* Description */}
                  <Box sx={{ gridColumn: { sm: "span 2" } }}>
                    <TextField
                      label="Description"
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      multiline
                      rows={4}
                      fullWidth
                      size="small"
                      placeholder="Detailed description of the tour adventure..."
                      slotProps={{ inputLabel: { shrink: true } }}
                    />
                  </Box>

                  {/* Description Image */}
                  <Box sx={{ gridColumn: { sm: "span 2" } }}>
                    <Typography variant="caption" sx={{ fontWeight: 600, color: "#475569", display: "block", mb: 0.5 }}>
                      Description Image
                    </Typography>
                    {!descriptionImage.preview ? (
                      <Paper
                        variant="outlined"
                        onClick={() => setImagePickerModal({ isOpen: true, target: "description", multiple: false })}
                        sx={{
                          p: 3,
                          textAlign: "center",
                          cursor: "pointer",
                          borderRadius: "6px",
                          borderColor: "#cbd5e1",
                          borderStyle: "dashed",
                          bgcolor: "#f8fafc",
                          "&:hover": { borderColor: "#0f172a", bgcolor: "#f1f5f9" },
                        }}
                      >
                        <CloudUploadOutlinedIcon sx={{ fontSize: 32, color: "#64748b", mb: 0.5 }} />
                        <Typography variant="body2" sx={{ fontWeight: 500, color: "#334155" }}>
                          Click to select or upload description image
                        </Typography>
                        <Typography variant="caption" sx={{ color: "#94a3b8" }}>
                          Displayed in the tour detail overview page
                        </Typography>
                      </Paper>
                    ) : (
                      <Box sx={{ position: "relative", borderRadius: "6px", overflow: "hidden", border: "1px solid #e2e8f0", maxWidth: 400 }}>
                        <img src={descriptionImage.preview} alt="Description preview" style={{ width: "100%", height: 180, objectFit: "cover" }} />
                        <Button
                          size="small"
                          color="error"
                          variant="contained"
                          onClick={removeDescriptionImage}
                          startIcon={<DeleteOutlineRoundedIcon fontSize="small" />}
                          sx={{ position: "absolute", top: 8, right: 8, textTransform: "none", fontSize: "0.75rem", py: 0.5, px: 1.25 }}
                        >
                          Remove
                        </Button>
                      </Box>
                    )}
                  </Box>

                  {/* Itinerary Map Image */}
                  <Box sx={{ gridColumn: { sm: "span 2" } }}>
                    <Typography variant="caption" sx={{ fontWeight: 600, color: "#475569", display: "block", mb: 0.5 }}>
                      Itinerary Map Image
                    </Typography>
                    {!itineraryMapImage.preview ? (
                      <Paper
                        variant="outlined"
                        onClick={() => setImagePickerModal({ isOpen: true, target: "map", multiple: false })}
                        sx={{
                          p: 3,
                          textAlign: "center",
                          cursor: "pointer",
                          borderRadius: "6px",
                          borderColor: "#cbd5e1",
                          borderStyle: "dashed",
                          bgcolor: "#f8fafc",
                          "&:hover": { borderColor: "#0f172a", bgcolor: "#f1f5f9" },
                        }}
                      >
                        <CloudUploadOutlinedIcon sx={{ fontSize: 32, color: "#64748b", mb: 0.5 }} />
                        <Typography variant="body2" sx={{ fontWeight: 500, color: "#334155" }}>
                          Click to select or upload map image
                        </Typography>
                        <Typography variant="caption" sx={{ color: "#94a3b8" }}>
                          Displayed as interactive overview map on the tour page
                        </Typography>
                      </Paper>
                    ) : (
                      <Box sx={{ position: "relative", borderRadius: "6px", overflow: "hidden", border: "1px solid #e2e8f0", maxWidth: 400 }}>
                        <img src={itineraryMapImage.preview} alt="Map preview" style={{ width: "100%", height: 180, objectFit: "cover" }} />
                        <Button
                          size="small"
                          color="error"
                          variant="contained"
                          onClick={removeItineraryMapImage}
                          startIcon={<DeleteOutlineRoundedIcon fontSize="small" />}
                          sx={{ position: "absolute", top: 8, right: 8, textTransform: "none", fontSize: "0.75rem", py: 0.5, px: 1.25 }}
                        >
                          Remove
                        </Button>
                      </Box>
                    )}
                  </Box>

                  {/* Destination */}
                  <Box>
                    <TextField
                      label="Destination Country"
                      required
                      value={countries.find((c) => c._id === formData.country || c.id === formData.country)?.name || ""}
                      placeholder="Click to select destination"
                      onClick={() => setShowDestinationPopup(true)}
                      fullWidth
                      size="small"
                      slotProps={{
                        input: {
                          readOnly: true,
                          sx: { cursor: "pointer" },
                          endAdornment: (
                            <InputAdornment position="end">
                              <ChevronRightRoundedIcon fontSize="small" sx={{ color: "#64748b" }} />
                            </InputAdornment>
                          ),
                        },
                        inputLabel: { shrink: true },
                      }}
                    />
                    <input type="hidden" name="country" value={formData.country} required />
                  </Box>

                  {/* Max Group Size */}
                  <Box>
                    <TextField
                      type="number"
                      label="Max Group Size"
                      name="maxGroupSize"
                      value={formData.maxGroupSize}
                      onChange={handleChange}
                      fullWidth
                      size="small"
                      placeholder="12"
                      slotProps={{
                        htmlInput: { min: 1, max: 50 },
                        inputLabel: { shrink: true },
                      }}
                    />
                  </Box>

                  {/* Duration Days */}
                  <Box>
                    <TextField
                      type="number"
                      label="Duration (Days)"
                      name="durationDays"
                      value={formData.durationDays}
                      onChange={handleChange}
                      fullWidth
                      size="small"
                      placeholder="7"
                      slotProps={{
                        htmlInput: { min: 1 },
                        inputLabel: { shrink: true },
                      }}
                    />
                  </Box>

                  {/* Physical Rating */}
                  <Box>
                    <TextField
                      select
                      label="Physical Rating"
                      required
                      name="physicalRatingLevel"
                      value={formData.physicalRatingLevel}
                      onChange={handleChange}
                      fullWidth
                      size="small"
                      slotProps={{ inputLabel: { shrink: true } }}
                    >
                      <MenuItem value=""><em>Select physical rating...</em></MenuItem>
                      {physicalRatings.map((rating) => (
                        <MenuItem key={rating._id} value={rating.level}>
                          {rating.level} - {rating.name}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Box>

                  {/* Travel Style */}
                  <Box>
                    <TextField
                      select
                      label="Travel Style"
                      required
                      name="travelStyle"
                      value={formData.travelStyle}
                      onChange={handleChange}
                      fullWidth
                      size="small"
                      slotProps={{ inputLabel: { shrink: true } }}
                    >
                      <MenuItem value=""><em>Select travel style...</em></MenuItem>
                      {travelStyles.map((style) => (
                        <MenuItem key={style._id} value={style.name}>{style.name}</MenuItem>
                      ))}
                    </TextField>
                  </Box>

                  {/* Trip Type */}
                  <Box>
                    <TextField
                      select
                      label="Trip Type"
                      required
                      name="tripType"
                      value={formData.tripType}
                      onChange={handleChange}
                      fullWidth
                      size="small"
                      slotProps={{ inputLabel: { shrink: true } }}
                    >
                      <MenuItem value=""><em>Select trip type...</em></MenuItem>
                      {tripTypes.map((type) => (
                        <MenuItem key={type._id} value={type.name}>{type.name}</MenuItem>
                      ))}
                    </TextField>
                  </Box>

                  {/* Interests */}
                  <Box sx={{ gridColumn: { sm: "span 2" } }}>
                    <Typography variant="caption" sx={{ fontWeight: 600, color: "#475569", display: "block", mb: 0.5 }}>
                      Interests & Categories
                    </Typography>
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 1.5 }}>
                      {selectedInterests.map((interest) => (
                        <Chip
                          key={interest}
                          label={interest}
                          size="small"
                          onDelete={() => setSelectedInterests(selectedInterests.filter((i) => i !== interest))}
                          sx={{ borderRadius: "4px", bgcolor: "#f1f5f9", fontWeight: 500, fontSize: "0.75rem" }}
                        />
                      ))}
                      {selectedInterests.length === 0 && (
                        <Typography variant="caption" sx={{ color: "#94a3b8", fontStyle: "italic" }}>
                          No interests selected
                        </Typography>
                      )}
                    </Box>
                    <TextField
                      select
                      label="Add Interest"
                      value=""
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val && !selectedInterests.includes(val)) {
                          setSelectedInterests([...selectedInterests, val]);
                        }
                      }}
                      fullWidth
                      size="small"
                      slotProps={{ inputLabel: { shrink: true } }}
                    >
                      <MenuItem value=""><em>Choose interest to add...</em></MenuItem>
                      {interestsOptions
                        .filter((i) => !selectedInterests.includes(i.name))
                        .map((interest) => (
                          <MenuItem key={interest._id} value={interest.name}>
                            {interest.name}
                          </MenuItem>
                        ))}
                    </TextField>
                  </Box>

                  {/* Start City & End City */}
                  {formData.country && (
                    <>
                      <Box>
                        <TextField
                          label="Start City"
                          name="startCity"
                          value={formData.startCity}
                          onClick={() => setShowCityPopup('start')}
                          placeholder="Select Start City"
                          fullWidth
                          size="small"
                          slotProps={{
                            input: {
                              readOnly: true,
                              sx: { cursor: "pointer" },
                              endAdornment: (
                                <InputAdornment position="end">
                                  <ChevronRightRoundedIcon fontSize="small" sx={{ color: "#64748b" }} />
                                </InputAdornment>
                              ),
                            },
                            inputLabel: { shrink: true },
                          }}
                        />
                      </Box>
                      <Box>
                        <TextField
                          label="End City"
                          name="endCity"
                          value={formData.endCity}
                          onClick={() => setShowCityPopup('end')}
                          placeholder="Select End City"
                          fullWidth
                          size="small"
                          slotProps={{
                            input: {
                              readOnly: true,
                              sx: { cursor: "pointer" },
                              endAdornment: (
                                <InputAdornment position="end">
                                  <ChevronRightRoundedIcon fontSize="small" sx={{ color: "#64748b" }} />
                                </InputAdornment>
                              ),
                            },
                            inputLabel: { shrink: true },
                          }}
                        />
                      </Box>
                    </>
                  )}

                  {/* Highlights */}
                  <Box sx={{ gridColumn: { sm: "span 2" } }}>
                    <TextField
                      label="Tour Highlights (one per line)"
                      name="highlights"
                      value={formData.highlights}
                      onChange={handleChange}
                      multiline
                      rows={4}
                      fullWidth
                      size="small"
                      placeholder="Reach Everest Base Camp&#10;Sunrise from Kala Patthar"
                      slotProps={{ inputLabel: { shrink: true } }}
                    />
                  </Box>

                  {/* Transportation */}
                  <Box sx={{ gridColumn: { sm: "span 2" } }}>
                    <TextField
                      label="Transportation"
                      name="transportation"
                      value={formData.transportation}
                      onChange={handleChange}
                      multiline
                      rows={2}
                      fullWidth
                      size="small"
                      placeholder="Train, local bus, private vehicle, small riverboat, plane."
                      slotProps={{ inputLabel: { shrink: true } }}
                    />
                  </Box>

                  {/* Staff & Experts */}
                  <Box sx={{ gridColumn: { sm: "span 2" } }}>
                    <TextField
                      label="Staff & Experts"
                      name="staffExperts"
                      value={formData.staffExperts}
                      onChange={handleChange}
                      multiline
                      rows={2}
                      fullWidth
                      size="small"
                      placeholder="CEO (Chief Experience Officer) throughout, local guides."
                      slotProps={{ inputLabel: { shrink: true } }}
                    />
                  </Box>

                  {/* Age Requirements */}
                  <Box>
                    <Typography variant="caption" sx={{ fontWeight: 600, color: "#475569", display: "block", mb: 0.5 }}>
                      Age Requirements
                    </Typography>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                      <TextField
                        type="number"
                        label="Min"
                        name="ageMin"
                        value={formData.ageMin}
                        onChange={handleChange}
                        size="small"
                        slotProps={{ htmlInput: { min: 0 }, inputLabel: { shrink: true } }}
                        sx={{ width: 110 }}
                      />
                      <Typography variant="body2" sx={{ color: "#94a3b8" }}>to</Typography>
                      <TextField
                        type="number"
                        label="Max"
                        name="ageMax"
                        value={formData.ageMax}
                        onChange={handleChange}
                        size="small"
                        slotProps={{ htmlInput: { min: 0 }, inputLabel: { shrink: true } }}
                        sx={{ width: 110 }}
                      />
                    </Box>
                  </Box>

                  {/* Wifi Availability */}
                  <Box>
                    <FormControl component="fieldset" size="small">
                      <FormLabel component="legend" sx={{ fontSize: "0.75rem", fontWeight: 600, color: "#475569", mb: 0.5 }}>
                        Wifi Availability
                      </FormLabel>
                      <RadioGroup
                        row
                        value={formData.wifiAvailable === true ? "yes" : "no"}
                        onChange={(e) => setFormData({ ...formData, wifiAvailable: e.target.value === "yes" })}
                      >
                        <FormControlLabel value="yes" control={<Radio size="small" sx={{ color: "#94a3b8", "&.Mui-checked": { color: "#0f172a" } }} />} label={<Typography variant="body2" sx={{ fontSize: "0.8125rem" }}>Yes</Typography>} />
                        <FormControlLabel value="no" control={<Radio size="small" sx={{ color: "#94a3b8", "&.Mui-checked": { color: "#0f172a" } }} />} label={<Typography variant="body2" sx={{ fontSize: "0.8125rem" }}>No</Typography>} />
                      </RadioGroup>
                    </FormControl>
                  </Box>

                  {/* Active & Featured */}
                  <Box sx={{ display: "flex", gap: 3, alignItems: "center", gridColumn: { sm: "span 2" }, pt: 1 }}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={formData.isActive}
                          onChange={handleChange}
                          name="isActive"
                          size="small"
                          sx={{ color: "#94a3b8", "&.Mui-checked": { color: "#0f172a" } }}
                        />
                      }
                      label={<Typography variant="body2" sx={{ fontSize: "0.8125rem", fontWeight: 500, color: "#334155" }}>Active in Catalog</Typography>}
                    />
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={formData.isFeatured}
                          onChange={handleChange}
                          name="isFeatured"
                          size="small"
                          sx={{ color: "#94a3b8", "&.Mui-checked": { color: "#0f172a" } }}
                        />
                      }
                      label={<Typography variant="body2" sx={{ fontSize: "0.8125rem", fontWeight: 500, color: "#334155" }}>Featured Tour</Typography>}
                    />
                  </Box>
                </Box>
              </Paper>
            </Box>
          )}

          {showCityPopup && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#3F3F42]/50 backdrop-blur-sm">
              <div className="bg-white rounded-md w-full max-w-md shadow-2xl overflow-hidden">
                <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                  <h3 className="font-bold text-[#3F3F42]">Select {showCityPopup === 'start' ? 'Start' : 'End'} City</h3>
                  <button
                    type="button"
                    onClick={() => setShowCityPopup(null)}
                    className="p-1 hover:bg-gray-100 rounded-full"
                  >
                    <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <div className="p-4">
                  <input
                    type="text"
                    placeholder="Search locations..."
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-md outline-none focus:ring-2 focus:ring-[#18181b]/20 focus:border-[#18181b] mb-4 text-[#3F3F42]"
                    value={locationSearch}
                    onChange={(e) => setLocationSearch(e.target.value)}
                    autoFocus
                  />
                  <div className="space-y-1 max-h-[300px] overflow-y-auto">
                    {destinations
                      .filter(d => d.name.toLowerCase().includes(locationSearch.toLowerCase()))
                      .slice(0, 10)
                      .map((d) => (
                        <button
                          key={d._id || d.name}
                          type="button"
                          className="w-full text-left px-4 py-3 hover:bg-[#f4f4f5] rounded-md transition-colors flex items-center gap-3 group"
                          onClick={() => {
                            if (showCityPopup === 'start') {
                              setFormData(prev => ({ ...prev, startCity: d.name }));
                            } else {
                              setFormData(prev => ({ ...prev, endCity: d.name }));
                            }
                            setShowCityPopup(null);
                            setLocationSearch("");
                          }}
                        >
                          <div className="w-8 h-8 rounded-md bg-gray-100 flex items-center justify-center group-hover:bg-[#f4f4f5]">
                            <svg className="w-4 h-4 text-gray-500 group-hover:text-[#18181b]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                          </div>
                          <div>
                            <p className="font-medium text-[#3F3F42] group-hover:text-[#18181b]">{d.name}</p>
                          </div>
                        </button>
                      ))}
                    {destinations.filter(d => d.name.toLowerCase().includes(locationSearch.toLowerCase())).length === 0 && (
                      <div className="text-center py-8 text-gray-500 text-sm flex flex-col items-center gap-3">
                        <p>No locations found</p>
                        {locationSearch.trim() !== "" && (
                          <button
                            type="button"
                            onClick={handleAddLocation}
                            disabled={addingLocation}
                            className="px-4 py-2 bg-[#18181b] text-white rounded-md text-sm font-medium hover:bg-[#27272a] transition disabled:opacity-50"
                          >
                            {addingLocation ? "Adding..." : `Add "${locationSearch.trim()}"`}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {showLocationPopup && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#3F3F42]/50 backdrop-blur-sm">
              <div className="bg-white rounded-md w-full max-w-md shadow-2xl overflow-hidden">
                <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                  <h3 className="font-bold text-[#3F3F42]">Select Location</h3>
                  <button
                    type="button"
                    onClick={() => setShowLocationPopup(null)}
                    className="p-1 hover:bg-gray-100 rounded-full"
                  >
                    <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <div className="p-4">
                  <input
                    type="text"
                    placeholder="Search locations..."
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-md outline-none focus:ring-2 focus:ring-[#18181b]/20 focus:border-[#18181b] mb-4 text-[#3F3F42]"
                    value={locationSearch}
                    onChange={(e) => setLocationSearch(e.target.value)}
                    autoFocus
                  />
                  <div className="space-y-1 max-h-[300px] overflow-y-auto">
                    {destinations
                      .filter(d => d.name.toLowerCase().includes(locationSearch.toLowerCase()))
                      .slice(0, 10)
                      .map((d) => (
                        <button
                          key={d._id || d.name}
                          type="button"
                          className="w-full text-left px-4 py-3 hover:bg-[#f4f4f5] rounded-md transition-colors flex items-center gap-3 group"
                          onClick={() => {
                            const dayIndex = showLocationPopup.dayIndex;
                            const currentTags = itinerary[dayIndex].title ? itinerary[dayIndex].title.split(",").filter(t => t.trim()) : [];
                            if (!currentTags.includes(d.name) && currentTags.length < 2) {
                              const newTitle = [...currentTags, d.name].join(",");
                              updateItinerary(dayIndex, "title", newTitle);
                            }
                            setShowLocationPopup(null);
                            setLocationSearch("");
                          }}
                        >
                          <div className="w-8 h-8 rounded-md bg-gray-100 flex items-center justify-center group-hover:bg-[#f4f4f5]">
                            <svg className="w-4 h-4 text-gray-500 group-hover:text-[#18181b]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                          </div>
                          <span className="font-medium text-[#3F3F42]">{d.name}</span>
                        </button>
                      ))}
                    {destinations.filter(d => d.name.toLowerCase().includes(locationSearch.toLowerCase())).length === 0 && (
                      <div className="text-center py-8 text-gray-500 text-sm flex flex-col items-center gap-3">
                        <p>No locations found</p>
                        {locationSearch.trim() !== "" && (
                          <button
                            type="button"
                            onClick={handleAddLocation}
                            disabled={addingLocation}
                            className="px-4 py-2 bg-[#18181b] text-white rounded-md text-sm font-medium hover:bg-[#27272a] transition disabled:opacity-50"
                          >
                            {addingLocation ? "Adding..." : `Add "${locationSearch.trim()}"`}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {showActivityPopup && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#3F3F42]/50 backdrop-blur-sm">
              <div className="bg-white rounded-md w-full max-w-md shadow-2xl overflow-hidden">
                <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                  <h3 className="font-bold text-[#3F3F42]">Select Activity</h3>
                  <button
                    type="button"
                    onClick={() => setShowActivityPopup(null)}
                    className="p-1 hover:bg-gray-100 rounded-full"
                  >
                    <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <div className="p-4">
                  <input
                    type="text"
                    placeholder="Search activities..."
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-md outline-none focus:ring-2 focus:ring-[#18181b]/20 focus:border-[#18181b] mb-4 text-[#3F3F42]"
                    value={activitySearch}
                    onChange={(e) => setActivitySearchInput(e.target.value)}
                    autoFocus
                  />
                  <div className="space-y-1 max-h-[300px] overflow-y-auto">
                    {activityOptions
                      .filter(opt => {
                        const dayIndex = showActivityPopup.dayIndex;
                        const dayLocations = itinerary[dayIndex].title ? itinerary[dayIndex].title.split(",").filter(t => t.trim()) : [];

                        // Filter by selected country
                        const destId = typeof opt.destination === "string" ? opt.destination : opt.destination?._id;
                        if (destId !== formData.country) return false;

                        // Filter by selected location tags for the day
                        if (!opt.location || !dayLocations.includes(opt.location)) return false;

                        // Filter by search query
                        if (activitySearch && !opt.title.toLowerCase().includes(activitySearch.toLowerCase())) return false;

                        return true;
                      })
                      .slice(0, 10)
                      .map((opt) => (
                        <button
                          key={opt._id}
                          type="button"
                          className="w-full text-left px-4 py-3 hover:bg-[#f4f4f5] rounded-md transition-colors flex items-center gap-3 group"
                          onClick={() => {
                            applyActivityOption(
                              showActivityPopup.dayIndex,
                              showActivityPopup.activityIndex,
                              opt._id,
                              showActivityPopup.isOptional
                            );
                            setShowActivityPopup(null);
                            setActivitySearchInput("");
                          }}
                        >
                          <div className="w-8 h-8 rounded-md bg-gray-100 flex items-center justify-center group-hover:bg-[#f4f4f5]">
                            <svg className="w-4 h-4 text-gray-500 group-hover:text-[#18181b]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                          </div>
                          <div>
                            <span className="font-medium text-[#3F3F42] block text-sm">{opt.title}</span>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-xs text-gray-500 font-medium">{opt.location}</span>
                              <span className="text-xs text-gray-300">•</span>
                              {opt.isFree ? (
                                <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">Free</span>
                              ) : (
                                <span className="text-[10px] font-semibold text-[#18181b] bg-[#f4f4f5] px-1.5 py-0.5 rounded">${opt.price}</span>
                              )}
                            </div>
                          </div>
                        </button>
                      ))}
                    {activityOptions.filter(opt => {
                      const dayIndex = showActivityPopup.dayIndex;
                      const dayLocations = itinerary[dayIndex].title ? itinerary[dayIndex].title.split(",").filter(t => t.trim()) : [];
                      const destId = typeof opt.destination === "string" ? opt.destination : opt.destination?._id;
                      if (destId !== formData.country) return false;
                      if (!opt.location || !dayLocations.includes(opt.location)) return false;
                      if (activitySearch && !opt.title.toLowerCase().includes(activitySearch.toLowerCase())) return false;
                      return true;
                    }).length === 0 && (
                        <div className="text-center py-8 text-gray-500 text-sm">
                          No activities found matching your criteria
                        </div>
                      )}
                  </div>
                  {/* Create Activity Button */}
                  <div className="pt-3 mt-3 border-t border-gray-100">
                    <button
                      type="button"
                      onClick={() => setShowCreateActivityModal(true)}
                      className="w-full text-center px-4 py-2.5 bg-[#3F3F42] text-white rounded-md text-sm font-medium hover:bg-[#3F3F42] transition"
                    >
                      + Create New Activity
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}


          {/* ==================== STEP 2: MEDIA & PRICING ==================== */}
          {currentStep === 2 && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
              <Box sx={{ px: 0.5 }}>
                <Typography variant="h5" sx={{ fontWeight: 700, color: "#0f172a", fontSize: "1.25rem", mb: 0.5 }}>
                  Media & Pricing
                </Typography>
                <Typography variant="body2" sx={{ color: "#64748b", fontSize: "0.8125rem" }}>
                  Upload tour gallery images, configure pricing tiers, booking deposits, and eco-initiatives.
                </Typography>
              </Box>

              {/* Images Section */}
              <Paper
                elevation={0}
                sx={{
                  p: { xs: 2.5, sm: 3.5 },
                  borderRadius: "6px",
                  border: "1px solid #e2e8f0",
                  bgcolor: "#ffffff",
                }}
              >
                <Typography variant="subtitle1" sx={{ fontWeight: 600, color: "#0f172a", mb: 0.5, fontSize: "0.95rem" }}>
                  Tour Gallery Images
                </Typography>
                <Typography variant="body2" sx={{ color: "#64748b", mb: 3, fontSize: "0.8125rem" }}>
                  Upload high-resolution images. Set one as primary for catalog cards.
                </Typography>

                <Paper
                  variant="outlined"
                  onClick={() => setImagePickerModal({ isOpen: true, target: "main", multiple: true })}
                  sx={{
                    p: 3.5,
                    textAlign: "center",
                    cursor: "pointer",
                    borderRadius: "6px",
                    borderColor: "#cbd5e1",
                    borderStyle: "dashed",
                    bgcolor: "#f8fafc",
                    mb: 3,
                    "&:hover": { borderColor: "#0f172a", bgcolor: "#f1f5f9" },
                  }}
                >
                  <CloudUploadOutlinedIcon sx={{ fontSize: 36, color: "#64748b", mb: 1 }} />
                  <Typography variant="body2" sx={{ fontWeight: 600, color: "#334155" }}>
                    Click to select or upload images
                  </Typography>
                  <Typography variant="caption" sx={{ color: "#94a3b8" }}>
                    Upload multiple files or choose from media asset library
                  </Typography>
                </Paper>

                <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" }, gap: 2 }}>
                  {images.map((img, index) => (
                    <Paper
                      key={index}
                      variant="outlined"
                      sx={{
                        borderRadius: "6px",
                        overflow: "hidden",
                        borderColor: img.isPrimary ? "#0f172a" : "#e2e8f0",
                        bgcolor: "#ffffff",
                      }}
                    >
                      <Box sx={{ position: "relative" }}>
                        <img src={img.preview} alt="Preview" style={{ width: "100%", height: 130, objectFit: "cover" }} />
                        <IconButton
                          size="small"
                          onClick={() => removeImage(index)}
                          sx={{
                            position: "absolute",
                            top: 6,
                            right: 6,
                            bgcolor: "rgba(15,23,42,0.7)",
                            color: "#ffffff",
                            "&:hover": { bgcolor: "#ef4444" },
                          }}
                        >
                          <DeleteOutlineRoundedIcon fontSize="small" />
                        </IconButton>
                        {img.isPrimary && (
                          <Chip
                            label="Primary"
                            size="small"
                            sx={{
                              position: "absolute",
                              top: 6,
                              left: 6,
                              bgcolor: "#0f172a",
                              color: "#ffffff",
                              fontWeight: 600,
                              fontSize: "0.68rem",
                              height: 20,
                            }}
                          />
                        )}
                      </Box>
                      <Box sx={{ p: 1.5, display: "flex", flexDirection: "column", gap: 1 }}>
                        <TextField
                          size="small"
                          placeholder="Image caption..."
                          value={img.caption}
                          onChange={(e) => updateImageCaption(index, e.target.value)}
                          fullWidth
                        />
                        <Button
                          size="small"
                          variant={img.isPrimary ? "contained" : "outlined"}
                          onClick={() => setImageAsPrimary(index)}
                          sx={{
                            textTransform: "none",
                            fontSize: "0.75rem",
                            borderRadius: "4px",
                            fontWeight: 600,
                            bgcolor: img.isPrimary ? "#0f172a" : "transparent",
                            color: img.isPrimary ? "#ffffff" : "#475569",
                            borderColor: "#cbd5e1",
                            "&:hover": {
                              bgcolor: img.isPrimary ? "#1e293b" : "#f8fafc",
                            },
                          }}
                        >
                          {img.isPrimary ? "Primary Cover" : "Set as Primary"}
                        </Button>
                      </Box>
                    </Paper>
                  ))}
                </Box>

                {images.length === 0 && (
                  <Box sx={{ textAlign: "center", py: 3, color: "#94a3b8", fontSize: "0.8125rem" }}>
                    No images uploaded yet
                  </Box>
                )}
              </Paper>

              {/* Pricing Section */}
              <Paper
                elevation={0}
                sx={{
                  p: { xs: 2.5, sm: 3.5 },
                  borderRadius: "6px",
                  border: "1px solid #e2e8f0",
                  bgcolor: "#ffffff",
                }}
              >
                <Typography variant="subtitle1" sx={{ fontWeight: 600, color: "#0f172a", mb: 0.5, fontSize: "0.95rem" }}>
                  Pricing & Deposit
                </Typography>
                <Typography variant="body2" sx={{ color: "#64748b", mb: 3, fontSize: "0.8125rem" }}>
                  Set base booking prices, currency, and payment requirements.
                </Typography>

                <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" }, gap: 2.5 }}>
                  <TextField
                    label="Base Price"
                    required
                    type="number"
                    name="priceAmount"
                    value={formData.priceAmount}
                    onChange={handleChange}
                    fullWidth
                    size="small"
                    placeholder="1299.00"
                    slotProps={{
                      htmlInput: { min: 0, step: "0.01" },
                      inputLabel: { shrink: true },
                    }}
                  />

                  <TextField
                    select
                    label="Currency"
                    name="priceCurrency"
                    value={formData.priceCurrency}
                    onChange={handleChange}
                    fullWidth
                    size="small"
                    slotProps={{ inputLabel: { shrink: true } }}
                  >
                    <MenuItem value="USD">USD ($)</MenuItem>
                    <MenuItem value="EUR">EUR (€)</MenuItem>
                    <MenuItem value="GBP">GBP (£)</MenuItem>
                    <MenuItem value="INR">INR (₹)</MenuItem>
                  </TextField>

                  <TextField
                    select
                    label="Booking Type"
                    name="bookingType"
                    value={formData.bookingType}
                    onChange={handleChange}
                    fullWidth
                    size="small"
                    slotProps={{ inputLabel: { shrink: true } }}
                  >
                    <MenuItem value="Percentage">Percentage (%)</MenuItem>
                    <MenuItem value="Amount">Fixed Amount</MenuItem>
                  </TextField>

                  <TextField
                    type="number"
                    label={formData.bookingType === "Percentage" ? "Booking Percentage (%)" : "Booking Amount"}
                    name={formData.bookingType === "Percentage" ? "bookingPercentage" : "bookingAmount"}
                    value={formData.bookingType === "Percentage" ? formData.bookingPercentage : formData.bookingAmount}
                    onChange={handleChange}
                    fullWidth
                    size="small"
                    placeholder={formData.bookingType === "Percentage" ? "20" : "500"}
                    slotProps={{
                      htmlInput: { min: 0, max: formData.bookingType === "Percentage" ? 100 : undefined },
                      inputLabel: { shrink: true },
                    }}
                  />

                  <Box sx={{ gridColumn: { sm: "span 3" }, pt: 0.5 }}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={formData.exemptFromLifetimeDeposit}
                          onChange={handleChange}
                          name="exemptFromLifetimeDeposit"
                          size="small"
                          sx={{ color: "#94a3b8", "&.Mui-checked": { color: "#0f172a" } }}
                        />
                      }
                      label={<Typography variant="body2" sx={{ fontSize: "0.8125rem", fontWeight: 500, color: "#334155" }}>Exempt from Lifetime Deposit</Typography>}
                    />
                  </Box>
                </Box>
              </Paper>

              {/* Add-ons Section */}
              <Paper
                elevation={0}
                sx={{
                  p: { xs: 2.5, sm: 3.5 },
                  borderRadius: "6px",
                  border: "1px solid #e2e8f0",
                  bgcolor: "#ffffff",
                }}
              >
                <Typography variant="subtitle1" sx={{ fontWeight: 600, color: "#0f172a", mb: 0.5, fontSize: "0.95rem" }}>
                  Add-on Options
                </Typography>
                <Typography variant="body2" sx={{ color: "#64748b", mb: 3, fontSize: "0.8125rem" }}>
                  Optional supplemental pricing options for solo travelers or custom upgrades.
                </Typography>

                <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" }, gap: 2.5 }}>
                  <TextField
                    type="number"
                    label="Own Room Supplement Price"
                    name="ownRoomPrice"
                    value={formData.ownRoomPrice}
                    onChange={handleChange}
                    fullWidth
                    size="small"
                    placeholder="0"
                    slotProps={{
                      htmlInput: { min: 0 },
                      inputLabel: { shrink: true },
                    }}
                  />
                </Box>
              </Paper>

              {/* Tree Planting Section */}
              {formData.country && (
                <Paper
                  elevation={0}
                  sx={{
                    p: { xs: 2.5, sm: 3.5 },
                    borderRadius: "6px",
                    border: "1px solid #e2e8f0",
                    bgcolor: "#ffffff",
                  }}
                >
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, color: "#0f172a", mb: 0.5, fontSize: "0.95rem" }}>
                    Tree Planting Information
                  </Typography>
                  <Typography variant="body2" sx={{ color: "#64748b", mb: 3, fontSize: "0.8125rem" }}>
                    Sustainability initiative contribution for each confirmed traveller.
                  </Typography>

                  <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)" }, gap: 2.5 }}>
                    <Box>
                      {plantingLocations.length > 0 ? (
                        <TextField
                          select
                          label="Planting Location"
                          name="plantingLocation"
                          value={formData.plantingLocation}
                          onChange={handleChange}
                          fullWidth
                          size="small"
                          slotProps={{ inputLabel: { shrink: true } }}
                        >
                          <MenuItem value=""><em>-- Select Planting Location --</em></MenuItem>
                          {plantingLocations.map((pl) => (
                            <MenuItem key={pl._id} value={pl._id}>
                              {pl.locationName} ({pl.plantSpecies?.join(", ")})
                            </MenuItem>
                          ))}
                        </TextField>
                      ) : (
                        <Box sx={{ p: 1.5, bgcolor: "#fffbeb", border: "1px solid #fef3c7", borderRadius: "6px", color: "#92400e", fontSize: "0.8125rem" }}>
                          No planting locations registered for this country. Manage them in{" "}
                          <Link href="/admin/planting-locations" style={{ color: "#78350f", fontWeight: 600 }}>
                            Planting Locations
                          </Link>
                        </Box>
                      )}
                    </Box>

                    <TextField
                      type="number"
                      label="Number of Trees Planted (after completion)"
                      name="treesPlanted"
                      value={formData.treesPlanted}
                      onChange={handleChange}
                      fullWidth
                      size="small"
                      placeholder="0"
                      slotProps={{
                        htmlInput: { min: 0 },
                        inputLabel: { shrink: true },
                      }}
                    />
                  </Box>
                </Paper>
              )}
            </Box>
          )}

          {/* ==================== STEP 3: ITINERARY ==================== */}
          {currentStep === 3 && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
              <Box sx={{ px: 0.5, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Box>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: "#0f172a", fontSize: "1.25rem", mb: 0.5 }}>
                    Itinerary Builder
                  </Typography>
                  <Typography variant="body2" sx={{ color: "#64748b", fontSize: "0.8125rem" }}>
                    Configure daily schedules, included activities, optional excursions, and accommodations.
                  </Typography>
                </Box>
                {formData.country && (
                  <Button
                    type="button"
                    variant="contained"
                    size="small"
                    startIcon={<AddRoundedIcon />}
                    onClick={addItineraryDay}
                    sx={{
                      bgcolor: "#0f172a",
                      color: "#ffffff",
                      borderRadius: "6px",
                      textTransform: "none",
                      fontWeight: 600,
                      "&:hover": { bgcolor: "#1e293b" },
                    }}
                  >
                    Add Day
                  </Button>
                )}
              </Box>

              {formData.country ? (
                <Paper
                  elevation={0}
                  sx={{
                    p: { xs: 2.5, sm: 3.5 },
                    borderRadius: "6px",
                    border: "1px solid #e2e8f0",
                    bgcolor: "#ffffff",
                  }}
                >
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
                    {itinerary.map((day, dayIndex) => (
                      <Paper
                        key={dayIndex}
                        variant="outlined"
                        sx={{
                          p: 3,
                          borderRadius: "6px",
                          borderColor: "#e2e8f0",
                          bgcolor: "#f8fafc",
                        }}
                      >
                        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                          <Typography variant="subtitle1" sx={{ fontWeight: 700, color: "#0f172a", fontSize: "0.95rem" }}>
                            Day {day.day}
                          </Typography>
                          <Button
                            type="button"
                            size="small"
                            color="error"
                            variant="outlined"
                            startIcon={<DeleteOutlineRoundedIcon fontSize="small" />}
                            onClick={() => removeItineraryDay(dayIndex)}
                            sx={{ textTransform: "none", borderRadius: "6px", fontSize: "0.75rem" }}
                          >
                            Remove Day
                          </Button>
                        </Box>

                        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                          {/* Location tags */}
                          <Box>
                            <Typography variant="caption" sx={{ fontWeight: 600, color: "#475569", display: "block", mb: 0.5 }}>
                              Location Tags (up to 2)
                            </Typography>
                            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                              {(day.title ? day.title.split(",").filter(t => t.trim()) : []).map((tag, tagIndex) => (
                                <Chip
                                  key={tagIndex}
                                  label={tag}
                                  size="small"
                                  onDelete={() => {
                                    const currentTags = day.title.split(",").filter(t => t.trim());
                                    currentTags.splice(tagIndex, 1);
                                    updateItinerary(dayIndex, "title", currentTags.join(","));
                                  }}
                                  sx={{ borderRadius: "4px", bgcolor: "#ffffff", border: "1px solid #cbd5e1", fontWeight: 500 }}
                                />
                              ))}
                              {(day.title ? day.title.split(",").filter(t => t.trim()).length : 0) < 2 && (
                                <Button
                                  size="small"
                                  variant="outlined"
                                  startIcon={<AddRoundedIcon fontSize="small" />}
                                  onClick={() => {
                                    setShowLocationPopup({ dayIndex });
                                    setLocationSearch("");
                                  }}
                                  sx={{
                                    textTransform: "none",
                                    fontSize: "0.75rem",
                                    borderRadius: "4px",
                                    borderColor: "#cbd5e1",
                                    color: "#475569",
                                    bgcolor: "#ffffff",
                                  }}
                                >
                                  Add Location Tag
                                </Button>
                              )}
                            </Box>
                          </Box>

                          {/* Day description */}
                          <TextField
                            label="Day Description"
                            required
                            multiline
                            rows={2}
                            fullWidth
                            size="small"
                            placeholder="Detailed activities, route, and highlights for this day..."
                            value={day.description}
                            onChange={(e) => updateItinerary(dayIndex, "description", e.target.value)}
                            slotProps={{ inputLabel: { shrink: true } }}
                            sx={{ bgcolor: "#ffffff" }}
                          />

                          {/* Important Note */}
                          <TextField
                            label="Important Note (Optional)"
                            multiline
                            rows={2}
                            fullWidth
                            size="small"
                            placeholder="Passport checks, altitude advisory, packing tips..."
                            value={day.importantNote || ""}
                            onChange={(e) => updateItinerary(dayIndex, "importantNote", e.target.value)}
                            slotProps={{ inputLabel: { shrink: true } }}
                            sx={{ bgcolor: "#ffffff" }}
                          />

                          {/* Activities Section */}
                          {(day.title ? day.title.split(",").filter(t => t.trim()).length : 0) > 0 && (
                            <Box sx={{ mt: 1 }}>
                              <Typography variant="caption" sx={{ fontWeight: 700, color: "#334155", display: "block", mb: 1, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                                Included Activities
                              </Typography>
                              <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                                {day.activities.map((activity, actIndex) => (
                                  <Paper
                                    key={actIndex}
                                    variant="outlined"
                                    sx={{ p: 1.5, borderRadius: "6px", bgcolor: "#ffffff", borderColor: "#e2e8f0" }}
                                  >
                                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                                      <Typography variant="body2" sx={{ fontWeight: 600, color: "#0f172a" }}>
                                        {activity.title || activity.name || `Activity #${actIndex + 1}`}
                                      </Typography>
                                      <Button
                                        size="small"
                                        color="error"
                                        onClick={() => removeActivity(dayIndex, actIndex)}
                                        sx={{ textTransform: "none", fontSize: "0.75rem", p: 0 }}
                                      >
                                        Remove
                                      </Button>
                                    </Box>
                                    <TextField
                                      size="small"
                                      fullWidth
                                      value={activity.title || activity.name || ""}
                                      placeholder="Click to select activity from admin database"
                                      onClick={() => {
                                        setShowActivityPopup({ dayIndex, activityIndex: actIndex, isOptional: false });
                                        setActivitySearchInput("");
                                      }}
                                      slotProps={{
                                        input: {
                                          readOnly: true,
                                          sx: { cursor: "pointer", fontSize: "0.8125rem" },
                                          endAdornment: (
                                            <InputAdornment position="end">
                                              <ChevronRightRoundedIcon fontSize="small" sx={{ color: "#64748b" }} />
                                            </InputAdornment>
                                          ),
                                        },
                                      }}
                                    />
                                  </Paper>
                                ))}
                              </Box>
                              <Button
                                size="small"
                                variant="outlined"
                                startIcon={<AddRoundedIcon fontSize="small" />}
                                onClick={() => addActivity(dayIndex)}
                                sx={{ mt: 1.5, textTransform: "none", borderRadius: "6px", color: "#334155", borderColor: "#cbd5e1" }}
                              >
                                Add Activity
                              </Button>
                            </Box>
                          )}

                          {/* Optional Activities */}
                          <Box sx={{ mt: 1 }}>
                            <Typography variant="caption" sx={{ fontWeight: 700, color: "#334155", display: "block", mb: 1, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                              Optional Excursions
                            </Typography>
                            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                              {day.optionalActivities.map((optActivity, optIndex) => (
                                <Paper
                                  key={optIndex}
                                  variant="outlined"
                                  sx={{ p: 1.5, borderRadius: "6px", bgcolor: "#ffffff", borderColor: "#e2e8f0" }}
                                >
                                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                                    <Typography variant="body2" sx={{ fontWeight: 600, color: "#0f172a" }}>
                                      {optActivity.title || optActivity.name || `Optional Activity #${optIndex + 1}`}
                                    </Typography>
                                    <Button
                                      size="small"
                                      color="error"
                                      onClick={() => removeOptionalActivity(dayIndex, optIndex)}
                                      sx={{ textTransform: "none", fontSize: "0.75rem", p: 0 }}
                                    >
                                      Remove
                                    </Button>
                                  </Box>
                                  <TextField
                                    size="small"
                                    fullWidth
                                    value={optActivity.title || optActivity.name || ""}
                                    placeholder="Click to select optional activity"
                                    onClick={() => {
                                      setShowActivityPopup({ dayIndex, activityIndex: optIndex, isOptional: true });
                                      setActivitySearchInput("");
                                    }}
                                    slotProps={{
                                      input: {
                                        readOnly: true,
                                        sx: { cursor: "pointer", fontSize: "0.8125rem" },
                                        endAdornment: (
                                          <InputAdornment position="end">
                                            <ChevronRightRoundedIcon fontSize="small" sx={{ color: "#64748b" }} />
                                          </InputAdornment>
                                        ),
                                      },
                                    }}
                                  />
                                </Paper>
                              ))}
                            </Box>
                            <Button
                              size="small"
                              variant="outlined"
                              startIcon={<AddRoundedIcon fontSize="small" />}
                              onClick={() => addOptionalActivity(dayIndex)}
                              sx={{ mt: 1.5, textTransform: "none", borderRadius: "6px", color: "#334155", borderColor: "#cbd5e1" }}
                            >
                              Add Optional Activity
                            </Button>
                          </Box>

                          {/* Accommodations */}
                          <Box sx={{ mt: 1 }}>
                            <Typography variant="caption" sx={{ fontWeight: 700, color: "#334155", display: "block", mb: 1, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                              Accommodations
                            </Typography>
                            {day.accommodations.map((acc, accIndex) => (
                              <Box key={accIndex} sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "2fr 1fr" }, gap: 1.5 }}>
                                <TextField
                                  label="Accommodation Name"
                                  size="small"
                                  value={acc.name}
                                  onChange={(e) => updateAccommodation(dayIndex, accIndex, "name", e.target.value)}
                                  placeholder="e.g., Mountain Lodge Hotel"
                                  slotProps={{ inputLabel: { shrink: true } }}
                                  sx={{ bgcolor: "#ffffff" }}
                                />
                                <TextField
                                  select
                                  label="Type"
                                  size="small"
                                  value={acc.type}
                                  onChange={(e) => updateAccommodation(dayIndex, accIndex, "type", e.target.value)}
                                  slotProps={{ inputLabel: { shrink: true } }}
                                  sx={{ bgcolor: "#ffffff" }}
                                >
                                  <MenuItem value="Hotel">Hotel</MenuItem>
                                  <MenuItem value="Lounge">Lounge</MenuItem>
                                  <MenuItem value="Cottage">Cottage</MenuItem>
                                  <MenuItem value="Guestroom">Guestroom</MenuItem>
                                  <MenuItem value="Camp">Camp</MenuItem>
                                </TextField>
                              </Box>
                            ))}
                          </Box>

                          {/* Meals */}
                          <Box sx={{ mt: 1 }}>
                            <Typography variant="caption" sx={{ fontWeight: 700, color: "#334155", display: "block", mb: 1, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                              Included Meals
                            </Typography>
                            <Box sx={{ display: "flex", gap: 1 }}>
                              {["Breakfast", "Lunch", "Dinner"].map((meal) => {
                                const currentMeals = day.meals ? day.meals.split(",").map(m => m.trim()) : [];
                                const isSelected = currentMeals.includes(meal);
                                return (
                                  <Chip
                                    key={meal}
                                    label={meal}
                                    clickable
                                    variant={isSelected ? "filled" : "outlined"}
                                    onClick={() => {
                                      let newMeals;
                                      if (isSelected) {
                                        newMeals = currentMeals.filter(m => m !== meal).join(",");
                                      } else {
                                        newMeals = [...currentMeals, meal].join(",");
                                      }
                                      updateItinerary(dayIndex, "meals", newMeals);
                                    }}
                                    sx={{
                                      borderRadius: "6px",
                                      fontWeight: 600,
                                      fontSize: "0.8125rem",
                                      bgcolor: isSelected ? "#0f172a" : "#ffffff",
                                      color: isSelected ? "#ffffff" : "#475569",
                                      borderColor: isSelected ? "#0f172a" : "#cbd5e1",
                                      "&:hover": {
                                        bgcolor: isSelected ? "#1e293b" : "#f1f5f9",
                                      },
                                    }}
                                  />
                                );
                              })}
                            </Box>
                          </Box>
                        </Box>
                      </Paper>
                    ))}

                    {itinerary.length === 0 && (
                      <Box sx={{ textAlign: "center", py: 4, color: "#94a3b8", fontSize: "0.875rem" }}>
                        No itinerary days added yet. Click &quot;Add Day&quot; to begin.
                      </Box>
                    )}

                    <Button
                      type="button"
                      variant="outlined"
                      fullWidth
                      startIcon={<AddRoundedIcon />}
                      onClick={addItineraryDay}
                      sx={{
                        py: 1,
                        textTransform: "none",
                        fontWeight: 600,
                        borderRadius: "6px",
                        borderColor: "#cbd5e1",
                        color: "#0f172a",
                        "&:hover": { bgcolor: "#f8fafc", borderColor: "#94a3b8" },
                      }}
                    >
                      + Add Next Day
                    </Button>
                  </Box>
                </Paper>
              ) : (
                <Paper
                  elevation={0}
                  sx={{ p: 4, textAlign: "center", borderRadius: "6px", border: "1px solid #e2e8f0", bgcolor: "#ffffff" }}
                >
                  <Typography variant="body2" sx={{ color: "#64748b" }}>
                    Please select a destination country in Step 1 to build the itinerary.
                  </Typography>
                </Paper>
              )}
            </Box>
          )}

          {/* ==================== STEP 4: HOTELS & INFO ==================== */}
          {currentStep === 4 && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 3.5 }}>
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 700, color: "#0f172a", mb: 0.5 }}>
                  Hotels & Information
                </Typography>
                <Typography variant="body2" sx={{ color: "#64748b" }}>
                  Configure pre & post-trip hotel options and essential traveler guidelines.
                </Typography>
              </Box>

              {/* Hotel Accommodation Section */}
              {formData.country && (
                <Paper
                  elevation={0}
                  sx={{
                    p: { xs: 2.5, md: 3.5 },
                    borderRadius: "6px",
                    border: "1px solid #e2e8f0",
                    bgcolor: "#ffffff",
                  }}
                >
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, color: "#0f172a", mb: 2 }}>
                    Pre & Post-trip Extra Accommodation
                  </Typography>

                  <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 3 }}>
                    {/* Pre-trip Hotel */}
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Pre-trip Hotel (Optional)"
                        value={selectedPreHotelId ? hotels.find((h) => h._id === selectedPreHotelId)?.name || "" : ""}
                        placeholder="Click to select pre-trip hotel"
                        onClick={() => {
                          setSearchHotelTarget("pre");
                          setShowSearchHotelModal(true);
                        }}
                        slotProps={{
                          input: {
                            readOnly: true,
                            sx: { cursor: "pointer", bgcolor: "#ffffff", borderRadius: "6px" },
                            endAdornment: (
                              <InputAdornment position="end">
                                <SearchRoundedIcon sx={{ color: "#64748b", fontSize: 20 }} />
                              </InputAdornment>
                            ),
                          },
                          inputLabel: { shrink: true },
                        }}
                      />

                      {selectedPreHotelId &&
                        (() => {
                          const hotel = hotels.find((h) => h._id === selectedPreHotelId);
                          if (!hotel) return null;
                          return (
                            <Paper
                              variant="outlined"
                              sx={{
                                p: 2,
                                borderRadius: "6px",
                                borderColor: "#e2e8f0",
                                bgcolor: "#f8fafc",
                                display: "flex",
                                gap: 2,
                                alignItems: "center",
                              }}
                            >
                              {hotel.image ? (
                                <img
                                  src={hotel.image}
                                  alt={hotel.name}
                                  className="w-14 h-14 rounded-md object-cover border border-slate-200"
                                />
                              ) : (
                                <Box
                                  sx={{
                                    width: 56,
                                    height: 56,
                                    borderRadius: "6px",
                                    bgcolor: "#e2e8f0",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    fontSize: "1.5rem",
                                  }}
                                >
                                  🏨
                                </Box>
                              )}
                              <Box sx={{ flex: 1 }}>
                                <Typography variant="subtitle2" sx={{ fontWeight: 600, color: "#0f172a" }}>
                                  {hotel.name}
                                </Typography>
                                <Typography variant="caption" sx={{ color: "#64748b", display: "block", mb: 0.5 }}>
                                  {hotel.location}
                                </Typography>
                                <Typography variant="caption" sx={{ color: "#334155", fontWeight: 500, display: "block" }}>
                                  Private: ${hotel.privateRoomPrice}/night • Shared: ${hotel.sharedRoomPrice}/night
                                </Typography>
                              </Box>
                            </Paper>
                          );
                        })()}
                    </Box>

                    {/* Post-trip Hotel */}
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Post-trip Hotel (Optional)"
                        value={selectedPostHotelId ? hotels.find((h) => h._id === selectedPostHotelId)?.name || "" : ""}
                        placeholder="Click to select post-trip hotel"
                        onClick={() => {
                          setSearchHotelTarget("post");
                          setShowSearchHotelModal(true);
                        }}
                        slotProps={{
                          input: {
                            readOnly: true,
                            sx: { cursor: "pointer", bgcolor: "#ffffff", borderRadius: "6px" },
                            endAdornment: (
                              <InputAdornment position="end">
                                <SearchRoundedIcon sx={{ color: "#64748b", fontSize: 20 }} />
                              </InputAdornment>
                            ),
                          },
                          inputLabel: { shrink: true },
                        }}
                      />

                      {selectedPostHotelId &&
                        (() => {
                          const hotel = hotels.find((h) => h._id === selectedPostHotelId);
                          if (!hotel) return null;
                          return (
                            <Paper
                              variant="outlined"
                              sx={{
                                p: 2,
                                borderRadius: "6px",
                                borderColor: "#e2e8f0",
                                bgcolor: "#f8fafc",
                                display: "flex",
                                gap: 2,
                                alignItems: "center",
                              }}
                            >
                              {hotel.image ? (
                                <img
                                  src={hotel.image}
                                  alt={hotel.name}
                                  className="w-14 h-14 rounded-md object-cover border border-slate-200"
                                />
                              ) : (
                                <Box
                                  sx={{
                                    width: 56,
                                    height: 56,
                                    borderRadius: "6px",
                                    bgcolor: "#e2e8f0",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    fontSize: "1.5rem",
                                  }}
                                >
                                  🏨
                                </Box>
                              )}
                              <Box sx={{ flex: 1 }}>
                                <Typography variant="subtitle2" sx={{ fontWeight: 600, color: "#0f172a" }}>
                                  {hotel.name}
                                </Typography>
                                <Typography variant="caption" sx={{ color: "#64748b", display: "block", mb: 0.5 }}>
                                  {hotel.location}
                                </Typography>
                                <Typography variant="caption" sx={{ color: "#334155", fontWeight: 500, display: "block" }}>
                                  Private: ${hotel.privateRoomPrice}/night • Shared: ${hotel.sharedRoomPrice}/night
                                </Typography>
                              </Box>
                            </Paper>
                          );
                        })()}
                    </Box>
                  </Box>
                </Paper>
              )}

              {/* Before You Book Section */}
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
                  Before You Book
                </Typography>
                <Typography variant="body2" sx={{ color: "#64748b", mb: 2.5 }}>
                  Add content for each tab. Use &quot;Normal Text&quot; for paragraphs and &quot;List Item&quot; for checklist items on the frontend.
                </Typography>

                {/* Tab Navigation */}
                <Tabs
                  value={beforeYouBookTab}
                  onChange={(_, val) => setBeforeYouBookTab(val)}
                  variant="scrollable"
                  scrollButtons="auto"
                  sx={{
                    borderBottom: "1px solid #e2e8f0",
                    mb: 3,
                    minHeight: 44,
                    "& .MuiTab-root": {
                      textTransform: "none",
                      fontWeight: 600,
                      fontSize: "0.875rem",
                      color: "#64748b",
                      minHeight: 44,
                      py: 1,
                      "&.Mui-selected": { color: "#0f172a" },
                    },
                    "& .MuiTabs-indicator": { backgroundColor: "#0f172a", height: 2 },
                  }}
                >
                  {beforeYouBookTabs.map((tab) => (
                    <Tab key={tab.key} label={tab.label} />
                  ))}
                </Tabs>

                {/* Block Editor */}
                <BeforeYouBookEditor
                  key={beforeYouBookTabs[beforeYouBookTab].key}
                  value={beforeYouBook[beforeYouBookTabs[beforeYouBookTab].key]}
                  onChange={(data) => {
                    const key = beforeYouBookTabs[beforeYouBookTab].key;
                    setBeforeYouBook((prev: any) => ({ ...prev, [key]: data }));
                  }}
                />
              </Paper>
            </Box>
          )}

          {/* ==================== STEP 5: DATES & PUBLISH ==================== */}
          {currentStep === 5 && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 3.5 }}>
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 700, color: "#0f172a", mb: 0.5 }}>
                  Dates & Publish
                </Typography>
                <Typography variant="body2" sx={{ color: "#64748b" }}>
                  Define departure dates, seasonal discounts, and review everything before publishing.
                </Typography>
              </Box>

              {/* Available Dates Section */}
              <Paper
                elevation={0}
                sx={{
                  p: { xs: 2.5, md: 3.5 },
                  borderRadius: "6px",
                  border: "1px solid #e2e8f0",
                  bgcolor: "#ffffff",
                }}
              >
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, color: "#0f172a" }}>
                    Available Dates ({availableDates.length})
                  </Typography>
                  <Button
                    type="button"
                    variant="contained"
                    size="small"
                    startIcon={<AddRoundedIcon />}
                    onClick={addAvailableDate}
                    sx={{
                      borderRadius: "6px",
                      textTransform: "none",
                      fontWeight: 600,
                      bgcolor: "#0f172a",
                      "&:hover": { bgcolor: "#1e293b" },
                    }}
                  >
                    Add Date
                  </Button>
                </Box>

                <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  {availableDates.map((ad, index) => (
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
                          Date Range #{index + 1}
                        </Typography>
                        <Button
                          type="button"
                          size="small"
                          color="error"
                          startIcon={<DeleteOutlineRoundedIcon sx={{ fontSize: 18 }} />}
                          onClick={() => removeAvailableDate(index)}
                          sx={{ textTransform: "none", fontWeight: 600, fontSize: "0.8125rem" }}
                        >
                          Remove
                        </Button>
                      </Box>

                      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr 1.5fr" }, gap: 2 }}>
                        <TextField
                          fullWidth
                          size="small"
                          label="Start Date"
                          type="date"
                          value={ad.startDate}
                          onChange={(e) => updateAvailableDate(index, "startDate", e.target.value)}
                          slotProps={{
                            inputLabel: { shrink: true },
                            htmlInput: { max: ad.endDate || undefined },
                          }}
                        />
                        <TextField
                          fullWidth
                          size="small"
                          label="End Date"
                          type="date"
                          value={ad.endDate}
                          onChange={(e) => updateAvailableDate(index, "endDate", e.target.value)}
                          slotProps={{
                            inputLabel: { shrink: true },
                            htmlInput: { min: ad.startDate || undefined },
                          }}
                        />
                        <TextField
                          fullWidth
                          size="small"
                          select
                          label="Discount Promotion"
                          value={ad.discount}
                          onChange={(e) => updateAvailableDate(index, "discount", e.target.value)}
                          slotProps={{ inputLabel: { shrink: true } }}
                        >
                          <MenuItem value="">
                            <em>No Discount</em>
                          </MenuItem>
                          {discounts.filter((d) => d.isActive).map((d) => (
                            <MenuItem key={d._id} value={d.name}>
                              {d.name} ({d.percentage}% off)
                            </MenuItem>
                          ))}
                        </TextField>
                      </Box>
                    </Paper>
                  ))}

                  {availableDates.length === 0 && (
                    <Box sx={{ textAlign: "center", py: 4, bgcolor: "#f8fafc", borderRadius: "6px", border: "1px dashed #cbd5e1" }}>
                      <Typography variant="body2" sx={{ color: "#64748b" }}>
                        No available dates added yet. Click &quot;Add Date&quot; above to schedule departures.
                      </Typography>
                    </Box>
                  )}
                </Box>
              </Paper>

              {/* Submit Button in Step 5 */}
              <Paper
                elevation={0}
                sx={{
                  p: { xs: 3, md: 5 },
                  textAlign: "center",
                  borderRadius: "6px",
                  border: "1px solid #e2e8f0",
                  bgcolor: "#ffffff",
                }}
              >
                <Typography variant="h6" sx={{ fontWeight: 700, color: "#0f172a", mb: 1 }}>
                  Ready to Publish?
                </Typography>
                <Typography variant="body2" sx={{ color: "#64748b", mb: 3.5, maxWidth: 500, mx: "auto" }}>
                  Review all steps before creating the tour. You can navigate back using the steps indicator at the top anytime.
                </Typography>
                <Button
                  type="submit"
                  disabled={submitting}
                  variant="contained"
                  size="large"
                  sx={{
                    px: 6,
                    py: 1.5,
                    borderRadius: "6px",
                    textTransform: "none",
                    fontWeight: 600,
                    fontSize: "1rem",
                    bgcolor: "#0f172a",
                    "&:hover": { bgcolor: "#1e293b" },
                  }}
                >
                  {submitting ? (
                    <>
                      <CircularProgress size={20} sx={{ color: "#ffffff", mr: 1.5 }} />
                      Creating Tour...
                    </>
                  ) : (
                    "Create Tour"
                  )}
                </Button>
              </Paper>
            </Box>
          )}

          {/* Step Navigation Buttons */}
          <Paper
            elevation={0}
            sx={{
              p: 2.5,
              mt: 4,
              borderRadius: "6px",
              border: "1px solid #e2e8f0",
              backgroundColor: "#ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Button
              type="button"
              onClick={handleStepPrev}
              disabled={currentStep === 1}
              variant="outlined"
              sx={{
                borderRadius: "6px",
                textTransform: "none",
                fontWeight: 600,
                color: "#475569",
                borderColor: "#cbd5e1",
                visibility: currentStep === 1 ? "hidden" : "visible",
                "&:hover": { borderColor: "#94a3b8", backgroundColor: "#f8fafc" },
              }}
            >
              Previous
            </Button>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <Button
                type="button"
                onClick={() => router.push("/admin/tours-management")}
                variant="outlined"
                sx={{
                  borderRadius: "6px",
                  textTransform: "none",
                  fontWeight: 500,
                  color: "#64748b",
                  borderColor: "#e2e8f0",
                  "&:hover": { borderColor: "#cbd5e1", backgroundColor: "#f8fafc" },
                }}
              >
                Cancel
              </Button>
              {currentStep < totalSteps && (
                <Button
                  type="button"
                  onClick={handleStepNext}
                  variant="contained"
                  sx={{
                    borderRadius: "6px",
                    textTransform: "none",
                    fontWeight: 600,
                    backgroundColor: "#0f172a",
                    color: "#ffffff",
                    px: 3,
                    boxShadow: "none",
                    "&:hover": { backgroundColor: "#1e293b", boxShadow: "none" },
                  }}
                >
                  Continue
                </Button>
              )}
            </Box>
          </Paper>
        </form>
      <ImagePickerModal
        isOpen={imagePickerModal.isOpen}
        onClose={() => setImagePickerModal((prev) => ({ ...prev, isOpen: false }))}
        onSelect={handleImagePickerSelect}
        multiple={imagePickerModal.multiple}
        folder="tour-images"
      />
      {/* Create Activity Modal */}
      {showActivityPopup && (
        <CreateActivityModal
          isOpen={showCreateActivityModal}
          onClose={() => setShowCreateActivityModal(false)}
          destinationId={formData.country}
          locationTags={
            itinerary[showActivityPopup.dayIndex]?.title
              ? itinerary[showActivityPopup.dayIndex].title.split(",").map((t: string) => t.trim()).filter(Boolean)
              : []
          }
          onCreated={(newActivity) => {
            setActivityOptions((prev) => [newActivity, ...prev]);
            // Auto-select the newly created activity directly in the state to avoid stale closure state
            setItinerary((prevItinerary) => {
              const newItinerary = [...prevItinerary];
              if (showActivityPopup.isOptional) {
                newItinerary[showActivityPopup.dayIndex].optionalActivities[showActivityPopup.activityIndex] = newActivity;
              } else {
                newItinerary[showActivityPopup.dayIndex].activities[showActivityPopup.activityIndex] = newActivity;
              }
              return newItinerary;
            });
            setShowActivityPopup(null);
            setActivitySearchInput("");
          }}
        />
      )}

      {formData.country && (
        <CreateHotelModal
          isOpen={showCreateHotelModal}
          onClose={() => setShowCreateHotelModal(false)}
          destinationId={formData.country}
          onCreated={(newHotel) => {
            setHotels((prev) => [newHotel, ...prev]);
            if (hotelTarget === "pre") {
              setSelectedPreHotelId(newHotel._id);
            } else {
              setSelectedPostHotelId(newHotel._id);
            }
          }}
        />
      )}

      {showSearchHotelModal && formData.country && (
        <SearchHotelModal
          isOpen={showSearchHotelModal}
          onClose={() => setShowSearchHotelModal(false)}
          hotels={hotels}
          countryId={formData.country}
          onRefresh={() => fetchHotels(formData.country)}
          title={searchHotelTarget === "pre" ? "Select Pre-Trip Hotel" : "Select Post-Trip Hotel"}
          onSelect={(hotelId) => {
            if (searchHotelTarget === "pre") {
              setSelectedPreHotelId(hotelId);
            } else {
              setSelectedPostHotelId(hotelId);
            }
          }}
        />
      )}

      {/* Destination Selection Popup Modal */}
      {showDestinationPopup && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-[#3F3F42]/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-md shadow-2xl w-full max-w-lg overflow-hidden transform transition-all scale-100 flex flex-col max-h-[85vh]">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center sticky top-0 z-10">
              <h2 className="text-lg font-bold text-[#3F3F42]">Select Destination</h2>
              <button 
                type="button"
                onClick={() => setShowDestinationPopup(false)} 
                className="text-gray-400 hover:text-gray-600 transition-colors p-1 hover:bg-gray-100 rounded-full"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-3 flex-1">
              {continents.length === 0 ? (
                <div className="text-center py-8 text-gray-500 text-sm">
                  Loading destinations...
                </div>
              ) : (
                continents.map((continent) => {
                  const id = continent.id || continent._id;
                  const isExpanded = expandedContinent === id;
                  const countryCount = continent.countries?.length || 0;
                  
                  return (
                    <div 
                      key={id}
                      className="border border-gray-200 rounded-md overflow-hidden shadow-sm"
                    >
                      <button
                        type="button"
                        onClick={() => setExpandedContinent(isExpanded ? null : id)}
                        className="w-full px-5 py-4 flex items-center justify-between bg-white hover:bg-gray-50 transition-colors text-left font-medium text-[#3F3F42]"
                      >
                        <span>{continent.name}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-normal">
                            {countryCount} {countryCount === 1 ? "country" : "countries"}
                          </span>
                          <svg 
                            className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`} 
                            fill="none" 
                            stroke="currentColor" 
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </button>
                      
                      {isExpanded && (
                        <div className="bg-gray-50 border-t border-gray-150 p-4 grid grid-cols-1 sm:grid-cols-2 gap-2 animate-in slide-in-from-top-1 duration-150">
                          {countryCount === 0 ? (
                            <div className="col-span-full text-center text-sm text-gray-400 py-2">
                              No countries found in this continent
                            </div>
                          ) : (
                            continent.countries.map((country: any) => {
                              const countryId = country.id || country._id;
                              const isSelected = formData.country === countryId;
                              return (
                                <button
                                  type="button"
                                  key={countryId}
                                  onClick={() => {
                                    setFormData((prev) => ({ ...prev, country: countryId }));
                                    setShowDestinationPopup(false);
                                  }}
                                  className={`px-4 py-2.5 rounded-md border text-sm font-medium text-left transition-all ${
                                    isSelected
                                      ? "bg-[#f4f4f5] border-[#18181b] text-[#18181b] shadow-sm"
                                      : "bg-white border-gray-200 text-[#3F3F42] hover:border-[#18181b]/40 hover:bg-[#f4f4f5]/30"
                                  }`}
                                >
                                  {country.name}
                                </button>
                              );
                            })
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

    </Box>
  );
}
