"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
    MapPin,
    User as UserIcon,
    Clock,
    Camera,
    Heart,
    Eye,
    Lock,
    Ticket,
    Star,
    Compass,
    Copy,
    Check,
    Pencil,
    X,
    CalendarDays,
    Users,
    ArrowRight
} from "lucide-react";
import { uploadUserAvatar } from "@/lib/firebase";
import { api } from "@/lib/api";
import BookingDetailsModal from "@/components/BookingDetailsModal";
import HoldSpaceDetailsModal from "@/components/HoldSpaceDetailsModal";

// Types
interface User {
    _id: string;
    name: string;
    email: string;
    role: string;
    avatar?: string;
    phone?: string;
    dateOfBirth?: string;
    nationality?: string;
    createdAt: string;
    walletBalance?: number;
    walletExpiresAt?: string;
}

interface Booking {
    _id: string;
    bookingReference: string;
    status: string;
    startDate: string;
    numberOfTravelers: number;
    price: {
        basePrice: number;
        discountAmount: number;
        taxes: number;
        totalPrice: number;
        currency: string;
    };
    payment: {
        method: string;
        status: string;
        transactions?: Array<{
            transactionId: string;
            amount: number;
            paymentDate: string;
        }>;
    };
    travelers: Array<{
        firstName: string;
        lastName: string;
        email?: string;
        phone?: string;
    }>;
    installmentPlan?: {
        isActive: boolean;
        subscriptionId?: string;
        totalAmount: number;
        upfrontAmount: number;
        remainingAmount: number;
        numberOfInstallments: number;
        installmentAmount: number;
        deadline: string;
        schedule: Array<{
            installmentNumber: number;
            amount: number;
            dueDate: string;
            type: string;
            status: string;
            paidAt?: string;
            transactionId?: string;
        }>;
    };
    tour: {
        _id: string;
        name: string;
        slug: string;
        tourCode: string;
        duration: { days: number; nights: number };
        images: Array<{ url: string }>;
        startLocation: { name: string };
    };
    createdAt: string;
}

interface Review {
    _id: string;
    rating: number;
    review: string;
    tour: {
        _id: string;
        name: string;
        slug: string;
        tourCode: string;
    };
    createdAt: string;
}

interface Tour {
    _id: string;
    name: string;
    slug: string;
    tourCode: string;
    duration: { days: number; nights: number };
    price: { amount: number; currency: string; discountPercent: number };
    images: Array<{ url: string; caption?: string; isPrimary?: boolean }>;
    startLocation: { name: string };
    ratingsAverage?: number;
    ratingsQuantity?: number;
}

export default function ProfilePage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [user, setUser] = useState<User | null>(null);
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [reviews, setReviews] = useState<Review[]>([]);
    const [holdSpaces, setHoldSpaces] = useState<any[]>([]);
    const [wishlist, setWishlist] = useState<Tour[]>([]);
    const [loading, setLoading] = useState(true);

    // Expansion toggles for sections with multiple items
    const [showAllBookings, setShowAllBookings] = useState(false);
    const [showAllHolds, setShowAllHolds] = useState(false);
    const [showAllDeposits, setShowAllDeposits] = useState(false);
    const [showAllWishlist, setShowAllWishlist] = useState(false);
    const [showAllReviews, setShowAllReviews] = useState(false);

    // Hold releasing & Copy code states
    const [releasingHold, setReleasingHold] = useState<string | null>(null);
    const [copiedDepositCode, setCopiedDepositCode] = useState<string | null>(null);
    const [lifetimeDeposits, setLifetimeDeposits] = useState<any[]>([]);

    // Edit profile state
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editForm, setEditForm] = useState({
        name: "",
        phone: "",
        dateOfBirth: "",
        nationality: "",
    });
    const [saving, setSaving] = useState(false);
    const [uploadingAvatar, setUploadingAvatar] = useState(false);

    // Modals
    const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
    const [selectedHoldSpace, setSelectedHoldSpace] = useState<any>(null);

    // Real-time tick for hold expiration timers
    const [, setCountdownTick] = useState(0);

    useEffect(() => {
        fetchUserData();
    }, []);

    // Countdown tick for holds
    useEffect(() => {
        const interval = setInterval(() => {
            setCountdownTick((prev) => prev + 1);

            setHoldSpaces((prev) =>
                prev.map((h) => {
                    if (h.status === "active" && new Date(h.expiresAt) <= new Date()) {
                        return { ...h, status: "expired" };
                    }
                    return h;
                })
            );
        }, 1000);

        return () => clearInterval(interval);
    }, []);

    // Tab URL param compatibility
    useEffect(() => {
        const tabParam = searchParams.get("tab")?.toLowerCase();
        if (tabParam) {
            let targetId = "";
            if (tabParam.includes("book")) {
                targetId = "bookings";
                setShowAllBookings(true);
            } else if (tabParam.includes("hold")) {
                targetId = "hold-spaces";
                setShowAllHolds(true);
            } else if (tabParam.includes("deposit")) {
                targetId = "lifetime-deposits";
                setShowAllDeposits(true);
            } else if (tabParam.includes("wish")) {
                targetId = "wishlist";
                setShowAllWishlist(true);
            } else if (tabParam.includes("review")) {
                targetId = "reviews";
                setShowAllReviews(true);
            } else if (tabParam.includes("setting")) {
                router.push("/profile/settings");
                return;
            }

            if (targetId) {
                setTimeout(() => {
                    const el = document.getElementById(targetId);
                    if (el) {
                        el.scrollIntoView({ behavior: "smooth", block: "start" });
                    }
                }, 300);
            }
        }
    }, [searchParams, router]);

    const fetchUserData = async () => {
        try {
            const token = localStorage.getItem("token");
            if (!token) {
                router.push("/auth/login");
                return;
            }

            const userRes = await fetch(`${api.baseURL}/auth/me`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (!userRes.ok) {
                localStorage.removeItem("token");
                router.push("/auth/login");
                return;
            }

            const userData = await userRes.json();
            setUser(userData.data.user);
            setEditForm({
                name: userData.data.user.name || "",
                phone: userData.data.user.phone || "",
                dateOfBirth: userData.data.user.dateOfBirth
                    ? new Date(userData.data.user.dateOfBirth).toISOString().split("T")[0]
                    : "",
                nationality: userData.data.user.nationality || "",
            });

            // Fetch bookings
            const bookingsRes = await fetch(`${api.baseURL}/users/my-bookings`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (bookingsRes.ok) {
                const bookingsData = await bookingsRes.json();
                setBookings(bookingsData.data.bookings || []);
            }

            // Fetch reviews
            const reviewsRes = await fetch(`${api.baseURL}/users/my-reviews`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (reviewsRes.ok) {
                const reviewsData = await reviewsRes.json();
                setReviews(reviewsData.data.reviews || []);
            }

            // Fetch hold spaces
            const holdsRes = await fetch(`${api.baseURL}/hold-spaces/my-holds`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (holdsRes.ok) {
                const holdsData = await holdsRes.json();
                setHoldSpaces(holdsData.data.holdSpaces || []);
            }

            // Fetch lifetime deposits
            const depositsRes = await fetch(`${api.baseURL}/lifetime-deposits/my-deposits`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (depositsRes.ok) {
                const depositsData = await depositsRes.json();
                setLifetimeDeposits(depositsData.data.deposits || []);
            }

            // Fetch wishlist
            const wishlistRes = await fetch(`${api.baseURL}${api.endpoints.users.getWishlist}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (wishlistRes.ok) {
                const wishlistData = await wishlistRes.json();
                setWishlist(wishlistData.data.wishlist || []);
            }
        } catch (error) {
            console.error("Error fetching profile data:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !user) return;

        setUploadingAvatar(true);
        try {
            const avatarUrl = await uploadUserAvatar(file);
            const token = localStorage.getItem("token");

            const res = await fetch(`${api.baseURL}/users/updateMe`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ avatar: avatarUrl }),
            });

            if (res.ok) {
                const updatedUser = await res.json();
                setUser(updatedUser.data.user);
            }
        } catch (error) {
            console.error("Error uploading avatar:", error);
            alert("Failed to upload avatar image.");
        } finally {
            setUploadingAvatar(false);
        }
    };

    const handleSaveProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${api.baseURL}/users/updateMe`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(editForm),
            });

            if (res.ok) {
                const updatedUser = await res.json();
                setUser(updatedUser.data.user);
                setIsEditModalOpen(false);
            } else {
                const err = await res.json();
                alert(err.message || "Failed to update profile");
            }
        } catch (error) {
            console.error("Error updating profile:", error);
            alert("An error occurred while saving your profile.");
        } finally {
            setSaving(false);
        }
    };

    const formatDate = (dateStr: string) => {
        if (!dateStr) return "N/A";
        return new Date(dateStr).toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric",
        });
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopiedDepositCode(text);
        setTimeout(() => setCopiedDepositCode(null), 2500);
    };

    const activeHolds = holdSpaces.filter((h) => h.status === "active");
    const activeDeposits = lifetimeDeposits.filter((d) => d.status === "active");

    const hasAnyContent =
        wishlist.length > 0 ||
        bookings.length > 0 ||
        activeHolds.length > 0 ||
        activeDeposits.length > 0 ||
        reviews.length > 0;

    if (loading) {
        return (
            <div className="min-h-screen bg-white">
                <div className="w-full max-w-[1280px] mx-auto px-5 sm:px-6 md:px-8 xl:px-[35px] py-12 animate-pulse space-y-8">
                    <div className="h-10 w-64 bg-gray-100 rounded-2xl"></div>
                    <div className="flex items-center gap-6">
                        <div className="w-28 h-28 rounded-full bg-gray-100"></div>
                        <div className="space-y-3 flex-1">
                            <div className="h-4 w-40 bg-gray-100 rounded-xl"></div>
                            <div className="h-4 w-32 bg-gray-100 rounded-xl"></div>
                            <div className="h-4 w-52 bg-gray-100 rounded-xl"></div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center p-4">
                <div className="text-center p-8 max-w-md w-full">
                    <h2 className="text-2xl font-bold text-[#1A1A1A] mb-2">Sign in required</h2>
                    <p className="text-[#3F3F42] text-sm mb-6">
                        Please sign in to access your Nothing But Adventures profile.
                    </p>
                    <Link
                        href="/auth/login"
                        className="inline-block w-full bg-[#1A1A1A] hover:bg-black text-white font-medium py-3 rounded-2xl text-sm transition shadow-sm"
                    >
                        Sign In
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white font-sans text-[#1A1A1A]">
            {/* SUB NAVIGATION BAR */}
            <div className="bg-white">
                <div className="w-full max-w-[1280px] mx-auto px-5 sm:px-6 md:px-8 xl:px-[35px] pt-4 pb-1">
                    <nav className="flex items-center gap-6 md:gap-8 overflow-x-auto py-2 text-[13px] md:text-sm font-medium text-gray-500 scrollbar-hide">
                        <Link href="/trips" className="hover:text-[#1A1A1A] transition whitespace-nowrap">
                            Tours
                        </Link>
                        <Link href="/tree-planting" className="hover:text-[#1A1A1A] transition whitespace-nowrap">
                            Trees for Days
                        </Link>
                        <Link
                            href="/profile"
                            className="text-[#1A1A1A] font-bold whitespace-nowrap"
                        >
                            Profile
                        </Link>
                        <Link href="/nba-club" className="hover:text-[#1A1A1A] transition whitespace-nowrap">
                            Great Adventurers Club
                        </Link>
                        <Link href="/profile/settings" className="hover:text-[#1A1A1A] transition whitespace-nowrap">
                            Settings
                        </Link>
                    </nav>
                </div>
            </div>

            {/* MAIN CONTAINER */}
            <div className="w-full max-w-[1280px] mx-auto px-5 sm:px-6 md:px-8 xl:px-[35px] py-10 md:py-12 space-y-12">

                {/* 1. HERO PROFILE SECTION */}
                <section>
                    <div>
                        <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-[#1A1A1A] tracking-tight">
                            {user.name}
                        </h1>
                        <p className="text-base md:text-lg text-gray-500 font-normal mt-1.5">
                            Welcome to your profile
                        </p>
                    </div>

                    {/* Traveler Info Row with Avatar & Meta details */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-6 mt-8">
                        {/* Avatar */}
                        <div className="relative group shrink-0 w-24 h-24 sm:w-28 sm:h-28">
                            <div className="w-full h-full rounded-full overflow-hidden bg-gray-100 shadow-sm">
                                {user.avatar ? (
                                    <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-3xl font-bold text-[#1A1A1A] bg-gray-100">
                                        {user.name ? user.name.charAt(0).toUpperCase() : <UserIcon className="w-10 h-10 text-gray-400" />}
                                    </div>
                                )}
                            </div>

                            <label
                                title="Change avatar photo"
                                className="absolute inset-0 flex items-center justify-center bg-black/40 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                            >
                                {uploadingAvatar ? (
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                ) : (
                                    <div className="flex flex-col items-center text-[10px] font-medium gap-0.5">
                                        <Camera className="w-4 h-4" />
                                        <span>Edit</span>
                                    </div>
                                )}
                                <input
                                    type="file"
                                    className="hidden"
                                    accept="image/*"
                                    onChange={handleAvatarUpload}
                                    disabled={uploadingAvatar}
                                />
                            </label>
                        </div>

                        {/* Metadata Items with Lucide Icons */}
                        <div className="space-y-2 text-sm text-[#3F3F42]">
                            <div className="flex items-center gap-2.5">
                                <MapPin className="w-4 h-4 text-gray-400 shrink-0" />
                                <span>
                                    Lives in{" "}
                                    <strong className="text-[#1A1A1A] font-semibold">
                                        {user.nationality ? `${user.nationality}` : "Earth"}
                                    </strong>
                                </span>
                            </div>

                            <div className="flex items-center gap-2.5">
                                <UserIcon className="w-4 h-4 text-gray-400 shrink-0" />
                                <span className="font-semibold text-[#1A1A1A]">
                                    {user.nationality || "Adventurer"}
                                </span>
                            </div>

                            <div className="flex items-center gap-2.5">
                                <Clock className="w-4 h-4 text-gray-400 shrink-0" />
                                <span>Joined on {formatDate(user.createdAt)}</span>
                            </div>

                            <div className="pt-1.5">
                                <button
                                    onClick={() => setIsEditModalOpen(true)}
                                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-600 hover:text-black transition"
                                >
                                    <Pencil className="w-3 h-3 text-gray-400" />
                                    <span>Edit profile information</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </section>


                {/* 2. CONDITIONAL SECTION: TOURS ON YOUR WISHLIST */}
                {wishlist.length > 0 && (
                    <section id="wishlist">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl md:text-2xl font-bold text-[#1A1A1A] tracking-tight">
                                Tours on your wishlist
                            </h2>
                            {wishlist.length > 2 && (
                                <button
                                    onClick={() => setShowAllWishlist(!showAllWishlist)}
                                    className="text-xs font-bold text-gray-600 hover:text-black transition"
                                >
                                    {showAllWishlist ? "Show Top 2 Only" : `View all (${wishlist.length})`}
                                </button>
                            )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {(showAllWishlist ? wishlist : wishlist.slice(0, 2)).map((tour) => {
                                const primaryImage = tour.images?.find((img) => img.isPrimary) || tour.images?.[0];
                                const discountedPrice =
                                    tour.price.discountPercent > 0
                                        ? tour.price.amount * (1 - tour.price.discountPercent / 100)
                                        : tour.price.amount;
                                const tourUrl = `/trips/${tour.slug}/${tour.tourCode || tour.slug}`;

                                return (
                                    <div
                                        key={tour._id}
                                        className="group relative h-[380px] md:h-[400px] rounded-3xl overflow-hidden shadow-[0_6px_28px_rgba(0,0,0,0.06)] hover:shadow-[0_12px_36px_rgba(0,0,0,0.12)] flex flex-col justify-end p-4 transition-all duration-300"
                                    >
                                        {/* Background Tour Photo */}
                                        {primaryImage?.url ? (
                                            <img
                                                src={primaryImage.url}
                                                alt={tour.name}
                                                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                                            />
                                        ) : (
                                            <div className="absolute inset-0 bg-gradient-to-tr from-sky-400 to-indigo-600"></div>
                                        )}

                                        {/* Soft gradient overlay */}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent"></div>

                                        {/* Overlaid Modern Card at Bottom */}
                                        <div className="relative z-10 bg-white/95 backdrop-blur-md rounded-2xl p-4 shadow-lg flex flex-col justify-between">
                                            <div>
                                                <div className="flex items-center justify-between mb-1.5">
                                                    <span className="text-[11px] font-extrabold text-gray-500 uppercase tracking-wider">
                                                        {tour.duration?.days || 0} DAY TOUR
                                                    </span>
                                                    <Heart className="w-4 h-4 text-[#6A38C2] fill-[#6A38C2]" />
                                                </div>

                                                <h3 className="text-sm md:text-base font-bold text-[#1A1A1A] leading-snug line-clamp-2">
                                                    {tour.name}
                                                </h3>
                                            </div>

                                            <div className="mt-3 pt-2 flex items-center justify-between">
                                                <div>
                                                    <span className="text-base font-black text-[#1A1A1A]">
                                                        ${Math.round(discountedPrice).toLocaleString()}
                                                    </span>
                                                    <span className="text-[11px] text-gray-500 font-medium ml-1">
                                                        USD <em className="not-italic text-gray-400">per person</em>
                                                    </span>
                                                </div>

                                                <Link
                                                    href={tourUrl}
                                                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#432360] hover:bg-[#321a48] text-white text-xs font-bold shadow-sm hover:shadow transition-all"
                                                >
                                                    <Eye className="w-3.5 h-3.5" />
                                                    <span>View tour</span>
                                                </Link>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </section>
                )}


                {/* 3. CONDITIONAL SECTION: YOUR BOOKINGS */}
                {bookings.length > 0 && (
                    <section id="bookings">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl md:text-2xl font-bold text-[#1A1A1A] tracking-tight">
                                Your Bookings
                            </h2>
                            {bookings.length > 1 && (
                                <button
                                    onClick={() => setShowAllBookings(!showAllBookings)}
                                    className="text-xs font-bold text-gray-600 hover:text-black transition"
                                >
                                    {showAllBookings ? "Show Recent Only" : `View all (${bookings.length})`}
                                </button>
                            )}
                        </div>

                        <div className="space-y-4">
                            {(showAllBookings ? bookings : bookings.slice(0, 1)).map((booking) => {
                                const tour = booking.tour || {};
                                const primaryImg = tour.images?.[0]?.url || "";

                                return (
                                    <div
                                        key={booking._id}
                                        className="bg-white rounded-3xl p-5 md:p-6 shadow-[0_4px_24px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_32px_rgba(0,0,0,0.08)] transition-all duration-300 flex flex-col md:flex-row md:items-center justify-between gap-6"
                                    >
                                        <div className="flex items-start gap-4">
                                            <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl bg-gray-100 overflow-hidden shrink-0 shadow-sm">
                                                {primaryImg ? (
                                                    <img src={primaryImg} alt={tour.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                                                        <Compass className="w-8 h-8" />
                                                    </div>
                                                )}
                                            </div>

                                            <div>
                                                <div className="flex flex-wrap items-center gap-2 mb-1.5">
                                                    <span
                                                        className={`px-3 py-1 text-[11px] font-bold rounded-full uppercase tracking-wider ${booking.status === "confirmed"
                                                            ? "bg-emerald-50 text-emerald-700"
                                                            : booking.status === "pending"
                                                                ? "bg-amber-50 text-amber-700"
                                                                : booking.status === "cancelled"
                                                                    ? "bg-rose-50 text-rose-700"
                                                                    : "bg-gray-100 text-gray-700"
                                                            }`}
                                                    >
                                                        {booking.status}
                                                    </span>
                                                    <span className="text-xs text-gray-400 font-mono bg-gray-50 px-2.5 py-0.5 rounded-lg">
                                                        Ref: {booking.bookingReference}
                                                    </span>
                                                </div>

                                                <h3 className="text-base sm:text-lg font-bold text-[#1A1A1A]">
                                                    {tour.name || "Booked Adventure"}
                                                </h3>

                                                <div className="flex items-center gap-4 text-xs font-medium text-gray-500 mt-1.5">
                                                    <span className="flex items-center gap-1.5">
                                                        <CalendarDays className="w-3.5 h-3.5 text-gray-400" />
                                                        <span>{formatDate(booking.startDate)}</span>
                                                    </span>
                                                    <span>•</span>
                                                    <span className="flex items-center gap-1.5">
                                                        <Users className="w-3.5 h-3.5 text-gray-400" />
                                                        <span>{booking.numberOfTravelers} traveler{booking.numberOfTravelers > 1 ? "s" : ""}</span>
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between md:justify-end gap-6 shrink-0 pt-2 md:pt-0">
                                            <div className="text-left md:text-right">
                                                <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider block mb-0.5">Total</span>
                                                <div className="text-xl font-black text-[#1A1A1A]">
                                                    ${booking.price?.totalPrice?.toLocaleString() || "0"}{" "}
                                                    <span className="text-xs font-bold text-gray-500">USD</span>
                                                </div>
                                            </div>

                                            <button
                                                onClick={() => setSelectedBooking(booking)}
                                                className="px-6 py-2.5 rounded-full bg-[#432360] hover:bg-[#321a48] text-white text-xs font-bold shadow-md hover:shadow-lg transition-all"
                                            >
                                                Manage Booking
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </section>
                )}


                {/* 4. CONDITIONAL SECTION: ACTIVE HOLD SPACES */}
                {activeHolds.length > 0 && (
                    <section id="hold-spaces">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl md:text-2xl font-bold text-[#1A1A1A] tracking-tight">
                                Active Hold Spaces
                            </h2>
                            {activeHolds.length > 1 && (
                                <button
                                    onClick={() => setShowAllHolds(!showAllHolds)}
                                    className="text-xs font-bold text-gray-600 hover:text-black transition"
                                >
                                    {showAllHolds ? "Show Recent Only" : `View all (${activeHolds.length})`}
                                </button>
                            )}
                        </div>

                        <div className="space-y-4">
                            {(showAllHolds ? activeHolds : activeHolds.slice(0, 1)).map((hold) => {
                                const remaining = Math.max(0, new Date(hold.expiresAt).getTime() - Date.now());
                                const hoursLeft = Math.floor(remaining / (1000 * 60 * 60));
                                const minutesLeft = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
                                const tourUrl = `/trips/${hold.tour?.slug}/${hold.tour?.tourCode || hold.tour?.slug}/checkout?date=${hold.startDate ? new Date(hold.startDate).toISOString().split('T')[0] : ''}&holdId=${hold._id}`;

                                return (
                                    <div
                                        key={hold._id}
                                        className="bg-white rounded-3xl p-5 md:p-6 shadow-[0_4px_24px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_32px_rgba(0,0,0,0.08)] transition-all duration-300 flex flex-col md:flex-row md:items-center justify-between gap-6"
                                    >
                                        <div>
                                            <div className="flex items-center gap-2 mb-1.5">
                                                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 uppercase">
                                                    <Lock className="w-3.5 h-3.5 text-amber-600" />
                                                    <span>{hoursLeft}h {minutesLeft}m Left</span>
                                                </span>
                                                <span className="text-xs text-gray-400 font-mono bg-gray-50 px-2.5 py-0.5 rounded-lg">
                                                    Ref: {hold.holdReference}
                                                </span>
                                            </div>
                                            <h3 className="text-base sm:text-lg font-bold text-[#1A1A1A]">
                                                {hold.tour?.name || "Held Tour"}
                                            </h3>
                                            <p className="text-xs text-gray-500 font-medium mt-1">
                                                Departure: <strong>{formatDate(hold.startDate)}</strong> • Locked Price: ${hold.priceAtHold?.amount?.toLocaleString()} USD / person
                                            </p>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            <button
                                                onClick={() => setSelectedHoldSpace(hold)}
                                                className="px-4 py-2.5 rounded-full bg-gray-100 hover:bg-gray-200 text-xs font-bold text-gray-800 transition"
                                            >
                                                Details
                                            </button>
                                            <button
                                                onClick={() => router.push(tourUrl)}
                                                className="px-5 py-2.5 rounded-full bg-[#432360] hover:bg-[#321a48] text-white text-xs font-bold shadow-md hover:shadow-lg transition flex items-center gap-1.5"
                                            >
                                                <span>Complete Booking</span>
                                                <ArrowRight className="w-3.5 h-3.5" />
                                            </button>
                                            <button
                                                onClick={async () => {
                                                    if (!confirm("Release this hold space?")) return;
                                                    setReleasingHold(hold._id);
                                                    try {
                                                        const token = localStorage.getItem("token");
                                                        const res = await fetch(`${api.baseURL}/hold-spaces/${hold._id}/release`, {
                                                            method: "PATCH",
                                                            headers: { Authorization: `Bearer ${token}` },
                                                        });
                                                        if (res.ok) {
                                                            setHoldSpaces((prev) =>
                                                                prev.map((h) => (h._id === hold._id ? { ...h, status: "released" } : h))
                                                            );
                                                        }
                                                    } finally {
                                                        setReleasingHold(null);
                                                    }
                                                }}
                                                disabled={releasingHold === hold._id}
                                                className="text-xs text-gray-400 hover:text-rose-600 font-semibold transition disabled:opacity-50"
                                            >
                                                Release
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </section>
                )}


                {/* 5. CONDITIONAL SECTION: LIFETIME DEPOSITS */}
                {activeDeposits.length > 0 && (
                    <section id="lifetime-deposits">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl md:text-2xl font-bold text-[#1A1A1A] tracking-tight">
                                Lifetime Deposit Vouchers
                            </h2>
                            {activeDeposits.length > 1 && (
                                <button
                                    onClick={() => setShowAllDeposits(!showAllDeposits)}
                                    className="text-xs font-bold text-gray-600 hover:text-black transition"
                                >
                                    {showAllDeposits ? "Show Recent Only" : `View all (${activeDeposits.length})`}
                                </button>
                            )}
                        </div>

                        <div className="space-y-4">
                            {(showAllDeposits ? activeDeposits : activeDeposits.slice(0, 1)).map((deposit) => {
                                const isCopied = copiedDepositCode === deposit.code;

                                return (
                                    <div
                                        key={deposit._id}
                                        className="bg-white rounded-3xl p-5 md:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-[0_4px_24px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_32px_rgba(0,0,0,0.08)] transition-all duration-300"
                                    >
                                        <div>
                                            <div className="flex items-center gap-3 mb-2">
                                                <span className="font-mono font-bold text-sm bg-purple-50 text-[#6A38C2] px-3.5 py-1 rounded-xl flex items-center gap-1.5">
                                                    <Ticket className="w-3.5 h-3.5 text-[#6A38C2]" />
                                                    <span>{deposit.code}</span>
                                                </span>
                                                <button
                                                    onClick={() => copyToClipboard(deposit.code)}
                                                    className="inline-flex items-center gap-1 text-xs font-bold text-[#6A38C2] hover:text-[#432360] transition"
                                                >
                                                    {isCopied ? (
                                                        <>
                                                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                                                            <span className="text-emerald-600">Copied</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Copy className="w-3.5 h-3.5" />
                                                            <span>Copy Code</span>
                                                        </>
                                                    )}
                                                </button>
                                            </div>
                                            <p className="text-xs text-gray-500 font-medium mt-1">
                                                Origin: <strong>{deposit.originalTour?.name || "Cancelled Tour"}</strong> • Issued: {formatDate(deposit.createdAt)}
                                            </p>
                                        </div>

                                        <div className="text-left md:text-right">
                                            <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider block mb-0.5">Credit Amount</span>
                                            <div className="text-xl font-black text-emerald-600">
                                                ${deposit.amount?.toLocaleString()}{" "}
                                                <span className="text-xs font-bold text-gray-500">USD</span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </section>
                )}


                {/* 6. CONDITIONAL SECTION: TRAVEL REVIEWS */}
                {reviews.length > 0 && (
                    <section id="reviews">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl md:text-2xl font-bold text-[#1A1A1A] tracking-tight">
                                Your Reviews
                            </h2>
                            {reviews.length > 1 && (
                                <button
                                    onClick={() => setShowAllReviews(!showAllReviews)}
                                    className="text-xs font-bold text-gray-600 hover:text-black transition"
                                >
                                    {showAllReviews ? "Show Recent Only" : `View all (${reviews.length})`}
                                </button>
                            )}
                        </div>

                        <div className="space-y-4">
                            {(showAllReviews ? reviews : reviews.slice(0, 1)).map((review) => (
                                <div
                                    key={review._id}
                                    className="bg-white rounded-3xl p-5 md:p-6 shadow-[0_4px_24px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_32px_rgba(0,0,0,0.08)] transition-all duration-300"
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <h3 className="font-bold text-sm sm:text-base text-[#1A1A1A]">
                                            {review.tour.name}
                                        </h3>
                                        <div className="flex text-amber-400 gap-0.5">
                                            {[...Array(review.rating)].map((_, i) => (
                                                <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                                            ))}
                                        </div>
                                    </div>
                                    <p className="text-xs md:text-sm text-gray-600 italic leading-relaxed">
                                        &ldquo;{review.review}&rdquo;
                                    </p>
                                    <span className="text-[10px] text-gray-400 mt-2 block font-medium">
                                        {formatDate(review.createdAt)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </section>
                )}


                {/* 7. FALLBACK / EXPLORATION CARD IF PROFILE HAS NO CONTENT */}
                {!hasAnyContent && (
                    <section className="bg-white rounded-3xl p-8 md:p-12 text-center max-w-2xl mx-auto shadow-[0_4px_24px_rgba(0,0,0,0.04)]">
                        <div className="w-14 h-14 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-[#1A1A1A]">
                            <Compass className="w-7 h-7 text-gray-700" />
                        </div>
                        <h2 className="text-xl md:text-2xl font-bold text-[#1A1A1A] mb-2">
                            Ready for your next grand adventure?
                        </h2>
                        <p className="text-xs md:text-sm text-gray-500 leading-relaxed mb-6">
                            You don&apos;t have any active bookings or saved wishlist items yet. Discover hand-curated expeditions across Patagonia, the Himalayas, Africa, and beyond.
                        </p>
                        <Link
                            href="/trips"
                            className="inline-block bg-[#432360] hover:bg-[#321a48] text-white text-xs font-bold py-3 px-8 rounded-full transition shadow-md"
                        >
                            Explore All Tours
                        </Link>
                    </section>
                )}

            </div>


            {/* EDIT PROFILE MODAL */}
            {isEditModalOpen && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
                        <div className="flex items-center justify-between pb-3">
                            <h3 className="text-lg font-bold text-[#1A1A1A]">Edit Profile Details</h3>
                            <button
                                onClick={() => setIsEditModalOpen(false)}
                                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <form onSubmit={handleSaveProfile} className="space-y-4 mt-3 text-xs">
                            <div>
                                <label className="block font-bold text-[#1A1A1A] mb-1.5">Full Legal Name</label>
                                <input
                                    type="text"
                                    required
                                    value={editForm.name}
                                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                    className="w-full px-3.5 py-2.5 rounded-2xl bg-[#F8F9FA] focus:bg-white focus:ring-2 focus:ring-[#432360]/20 text-sm outline-none transition"
                                />
                            </div>

                            <div>
                                <label className="block font-bold text-[#1A1A1A] mb-1.5">Phone</label>
                                <input
                                    type="tel"
                                    value={editForm.phone}
                                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                                    placeholder="+1 555-000-0000"
                                    className="w-full px-3.5 py-2.5 rounded-2xl bg-[#F8F9FA] focus:bg-white focus:ring-2 focus:ring-[#432360]/20 text-sm outline-none transition"
                                />
                            </div>

                            <div>
                                <label className="block font-bold text-[#1A1A1A] mb-1.5">Nationality / Country</label>
                                <input
                                    type="text"
                                    value={editForm.nationality}
                                    onChange={(e) => setEditForm({ ...editForm, nationality: e.target.value })}
                                    placeholder="e.g. Indian, Canadian, British"
                                    className="w-full px-3.5 py-2.5 rounded-2xl bg-[#F8F9FA] focus:bg-white focus:ring-2 focus:ring-[#432360]/20 text-sm outline-none transition"
                                />
                            </div>

                            <div>
                                <label className="block font-bold text-[#1A1A1A] mb-1.5">Date of Birth</label>
                                <input
                                    type="date"
                                    value={editForm.dateOfBirth}
                                    onChange={(e) => setEditForm({ ...editForm, dateOfBirth: e.target.value })}
                                    className="w-full px-3.5 py-2.5 rounded-2xl bg-[#F8F9FA] focus:bg-white focus:ring-2 focus:ring-[#432360]/20 text-sm outline-none transition"
                                />
                            </div>

                            <div className="pt-3 flex items-center justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => setIsEditModalOpen(false)}
                                    className="px-4 py-2 rounded-full text-gray-600 hover:bg-gray-100 font-semibold"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="px-6 py-2.5 rounded-full bg-[#432360] hover:bg-[#321a48] text-white font-bold disabled:opacity-50 shadow-sm transition"
                                >
                                    {saving ? "Saving..." : "Save"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}


            {/* BOOKING DETAILS MODAL */}
            {selectedBooking && (
                <BookingDetailsModal
                    booking={selectedBooking as any}
                    onClose={() => setSelectedBooking(null)}
                    onBookingUpdated={() => fetchUserData()}
                />
            )}

            {/* HOLD SPACE DETAILS MODAL */}
            {selectedHoldSpace && (
                <HoldSpaceDetailsModal
                    hold={selectedHoldSpace as any}
                    onClose={() => setSelectedHoldSpace(null)}
                    onHoldUpdated={() => fetchUserData()}
                />
            )}
        </div>
    );
}
