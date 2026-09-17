"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { uploadToFirebase, uploadTravelerDocument } from "@/lib/firebase";
import {
    ArrowLeft,
    FileText,
    Upload,
    CheckCircle2,
    XCircle,
    Loader2,
    Eye,
    Shield,
    ShieldCheck,
    AlertCircle,
    CalendarDays,
    Users,
    Activity,
    FileBadge,
    FileCheck,
    ChevronLeft,
    ChevronRight,
} from "lucide-react";

interface Traveler {
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
    dateOfBirth?: string;
    nationality?: string;
}

interface DocFile {
    url: string;
    fileName: string;
    uploadedAt?: string;
    verified: boolean;
}

interface TravelerDocEntry {
    travelerIndex: number;
    passport: DocFile | null;
    visa: DocFile | null;
    medicalCertificate: DocFile | null;
    insurance: DocFile | null;
    submittedAt?: string;
}

interface BookingData {
    _id: string;
    bookingReference: string;
    status: string;
    startDate: string;
    numberOfTravelers: number;
    travelers: Traveler[];
    tour: {
        _id: string;
        name: string;
        slug: string;
        tourCode: string;
        images?: Array<{ url: string; caption?: string; isPrimary?: boolean }>;
    };
    travelerDocuments?: TravelerDocEntry[];
    documentsSubmitted?: boolean;
    documentsVerified?: boolean;
    price: {
        currency: string;
        totalPrice: number;
    };
}

type DocType = "passport" | "visa" | "medicalCertificate" | "insurance";

const DOC_TYPES: { key: DocType; label: string; icon: any }[] = [
    { key: "passport", label: "Passport", icon: FileBadge },
    { key: "visa", label: "Visa", icon: FileCheck },
    { key: "medicalCertificate", label: "Medical Certificate / Vaccination", icon: Activity },
    { key: "insurance", label: "Insurance Details", icon: ShieldCheck },
];

export default function BookingDocumentsPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const bookingId = searchParams.get("bookingId");

    const [booking, setBooking] = useState<BookingData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [activeTravelerIndex, setActiveTravelerIndex] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitSuccess, setSubmitSuccess] = useState(false);

    // Local state for document uploads (per traveler, per doc type)
    const [localDocs, setLocalDocs] = useState<Record<number, Record<DocType, { file?: File; url: string; fileName: string; progress: number; uploading: boolean; verified: boolean }>>>({});

    const initLocalDocs = useCallback((bookingData: BookingData) => {
        const docs: typeof localDocs = {};
        for (let i = 0; i < bookingData.numberOfTravelers; i++) {
            const existingDoc = bookingData.travelerDocuments?.find(d => d.travelerIndex === i);
            docs[i] = {} as any;
            for (const dt of DOC_TYPES) {
                const existing = existingDoc?.[dt.key];
                docs[i][dt.key] = {
                    url: existing?.url || "",
                    fileName: existing?.fileName || "",
                    progress: existing?.url ? 100 : 0,
                    uploading: false,
                    verified: existing?.verified || false,
                };
            }
        }
        setLocalDocs(docs);
    }, []);

    useEffect(() => {
        if (!bookingId) {
            setError("No booking ID provided");
            setLoading(false);
            return;
        }
        fetchBooking();
    }, [bookingId]);

    const fetchBooking = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem("token");
            if (!token) {
                setError("Please log in to view this page");
                return;
            }

            const res = await fetch(`${api.baseURL}${api.endpoints.bookings.getById(bookingId!)}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();

            if (!res.ok) {
                setError(data.message || "Failed to load booking");
                return;
            }

            setBooking(data.data.booking);
            initLocalDocs(data.data.booking);
        } catch (err) {
            setError("Failed to load booking data");
        } finally {
            setLoading(false);
        }
    };

    const handleFileSelect = async (travelerIdx: number, docType: DocType, file: File) => {
        if (localDocs[travelerIdx]?.[docType]?.verified) {
            alert("This document has already been verified by the administrator and cannot be modified.");
            return;
        }

        if (file.type !== "application/pdf") {
            alert("Only PDF files are accepted. Please select a PDF file.");
            return;
        }

        if (file.size > 10 * 1024 * 1024) {
            alert("File size must be less than 10MB.");
            return;
        }

        setLocalDocs(prev => ({
            ...prev,
            [travelerIdx]: {
                ...prev[travelerIdx],
                [docType]: {
                    ...prev[travelerIdx][docType],
                    file,
                    uploading: true,
                    progress: 0,
                },
            },
        }));

        try {
            const uploadFn = uploadTravelerDocument || ((f: File, p?: (pct: number) => void) => uploadToFirebase(f, "traveler-documents", p));
            const url = await uploadFn(file, (pct) => {
                setLocalDocs(prev => ({
                    ...prev,
                    [travelerIdx]: {
                        ...prev[travelerIdx],
                        [docType]: {
                            ...prev[travelerIdx][docType],
                            progress: pct,
                        },
                    },
                }));
            });

            setLocalDocs(prev => ({
                ...prev,
                [travelerIdx]: {
                    ...prev[travelerIdx],
                    [docType]: {
                        ...prev[travelerIdx][docType],
                        url,
                        fileName: file.name,
                        uploading: false,
                        progress: 100,
                    },
                },
            }));
        } catch (err) {
            console.error("Upload failed:", err);
            alert("Failed to upload document. Please try again.");
            setLocalDocs(prev => ({
                ...prev,
                [travelerIdx]: {
                    ...prev[travelerIdx],
                    [docType]: {
                        ...prev[travelerIdx][docType],
                        uploading: false,
                        progress: 0,
                    },
                },
            }));
        }
    };

    const allDocsUploaded = () => {
        if (!booking) return false;
        for (let i = 0; i < booking.numberOfTravelers; i++) {
            for (const dt of DOC_TYPES) {
                if (!localDocs[i]?.[dt.key]?.url) return false;
            }
        }
        return true;
    };

    const handleSubmitAll = async () => {
        if (!booking || !allDocsUploaded()) return;

        setIsSubmitting(true);
        try {
            const token = localStorage.getItem("token");
            if (!token) {
                alert("Please log in again");
                return;
            }

            const travelerDocuments = [];
            for (let i = 0; i < booking.numberOfTravelers; i++) {
                const docs: any = {};
                for (const dt of DOC_TYPES) {
                    docs[dt.key] = {
                        url: localDocs[i][dt.key].url,
                        fileName: localDocs[i][dt.key].fileName,
                    };
                }
                travelerDocuments.push(docs);
            }

            const res = await fetch(`${api.baseURL}${api.endpoints.bookings.submitDocuments(booking._id)}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ travelerDocuments }),
            });

            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.message || "Failed to submit documents");
            }

            setBooking(data.data.booking);
            initLocalDocs(data.data.booking);
            setSubmitSuccess(true);
        } catch (err: any) {
            alert(err.message || "Failed to submit documents");
        } finally {
            setIsSubmitting(false);
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
        });
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-white">
                <div className="w-full max-w-[1280px] mx-auto px-5 sm:px-6 md:px-8 xl:px-[35px] py-12 animate-pulse space-y-6">
                    <div className="h-8 w-64 bg-gray-100 rounded-2xl"></div>
                    <div className="h-44 bg-[#F8F9FA] rounded-3xl"></div>
                    <div className="h-96 bg-[#F8F9FA] rounded-3xl"></div>
                </div>
            </div>
        );
    }

    if (error || !booking) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center p-4">
                <div className="bg-[#F8F9FA] rounded-3xl shadow-sm p-10 text-center max-w-md w-full">
                    <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-[#1A1A1A] mb-2">Unable to Load Booking</h2>
                    <p className="text-gray-500 text-xs leading-relaxed mb-6">{error || "Booking not found"}</p>
                    <Link
                        href="/profile"
                        className="inline-block bg-[#432360] hover:bg-[#321a48] text-white font-bold py-3 px-8 rounded-full text-xs transition shadow-md"
                    >
                        Back to My Profile
                    </Link>
                </div>
            </div>
        );
    }

    const isAlreadySubmitted = booking.documentsSubmitted;

    return (
        <div className="min-h-screen bg-white font-sans text-[#1A1A1A] pb-16">
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
                        <Link href="/profile" className="hover:text-[#1A1A1A] transition whitespace-nowrap">
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

            {/* Main Content Container matching Homepage and Profile width */}
            <div className="w-full max-w-[1280px] mx-auto px-5 sm:px-6 md:px-8 xl:px-[35px] py-10 md:py-12 space-y-8">
                
                {/* Back to Profile Link */}
                <div>
                    <Link
                        href="/profile"
                        className="inline-flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-black transition"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        <span>Back to Profile</span>
                    </Link>
                </div>

                {/* Success Banner */}
                {submitSuccess && (
                    <div className="bg-emerald-50 rounded-3xl p-5 flex items-start sm:items-center gap-3.5 shadow-sm">
                        <CheckCircle2 className="w-6 h-6 text-emerald-600 flex-shrink-0" />
                        <div>
                            <p className="font-bold text-emerald-900 text-sm">Documents submitted successfully!</p>
                            <p className="text-emerald-700 text-xs mt-0.5 font-medium">Your documents are now under review. You will be notified once they are verified.</p>
                        </div>
                    </div>
                )}

                {/* Booking Info Card */}
                <div className="bg-white rounded-3xl p-6 md:p-8 shadow-[0_4px_24px_rgba(0,0,0,0.04)]">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <span className="font-mono text-xs font-bold text-[#6A38C2] bg-purple-50 px-2.5 py-0.5 rounded-lg">
                                    Ref: {booking.bookingReference}
                                </span>
                            </div>
                            <h1 className="text-2xl sm:text-3xl font-black text-[#1A1A1A] tracking-tight mb-2">{booking.tour.name}</h1>
                            <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-gray-500">
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
                        <div className="flex items-center gap-2">
                            {booking.documentsVerified ? (
                                <span className="px-4 py-1.5 text-xs font-bold rounded-full bg-emerald-50 text-emerald-700 flex items-center gap-1.5">
                                    <CheckCircle2 className="w-4 h-4" />
                                    All Documents Verified
                                </span>
                            ) : isAlreadySubmitted ? (
                                <span className="px-4 py-1.5 text-xs font-bold rounded-full bg-amber-50 text-amber-800 flex items-center gap-1.5">
                                    <AlertCircle className="w-4 h-4" />
                                    Verification Pending
                                </span>
                            ) : (
                                <span className="px-4 py-1.5 text-xs font-bold rounded-full bg-purple-50 text-[#6A38C2] flex items-center gap-1.5">
                                    <FileText className="w-4 h-4" />
                                    Documents Required
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Traveller Tabs + Content */}
                <div className="bg-white rounded-3xl shadow-[0_4px_24px_rgba(0,0,0,0.04)] overflow-hidden">
                    {/* Traveller Tab Cards */}
                    <div className="p-6 md:p-8 bg-[#F8F9FA]/70">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-base sm:text-lg font-bold text-[#1A1A1A]">Travelers in this Booking</h3>
                            <span className="text-xs text-gray-400 font-medium">Select a traveler to upload files</span>
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-3">
                            {booking.travelers.map((t, i) => {
                                const travelerDocs = localDocs[i];
                                const allDocsForTraveler = travelerDocs && DOC_TYPES.every(dt => travelerDocs[dt.key]?.url);
                                const allVerifiedForTraveler = travelerDocs && DOC_TYPES.every(dt => travelerDocs[dt.key]?.verified);
                                const isActive = activeTravelerIndex === i;

                                return (
                                    <button
                                        key={i}
                                        onClick={() => setActiveTravelerIndex(i)}
                                        className={`relative flex items-center gap-3 rounded-2xl px-5 py-3.5 min-w-[220px] transition text-left ${
                                            isActive
                                                ? 'bg-[#432360] text-white shadow-md'
                                                : 'bg-white hover:bg-gray-100 text-[#1A1A1A] shadow-xs'
                                        }`}
                                    >
                                        <div className={`w-10 h-10 rounded-full ${isActive ? 'bg-white/20 text-white' : i === 0 ? 'bg-purple-100 text-[#6A38C2]' : 'bg-gray-200 text-gray-700'} flex items-center justify-center font-bold text-sm shrink-0`}>
                                            {t.firstName?.charAt(0).toUpperCase() || "T"}
                                        </div>
                                        <div className="flex flex-col">
                                            <span className={`text-[11px] font-bold uppercase tracking-wider ${isActive ? 'text-white/70' : 'text-gray-400'}`}>
                                                {i === 0 ? "Lead Traveler" : `Traveler ${i + 1}`}
                                            </span>
                                            <span className="text-sm font-bold truncate">
                                                {t.firstName} {t.lastName}
                                            </span>
                                        </div>
                                        {allVerifiedForTraveler ? (
                                            <CheckCircle2 className={`absolute top-2.5 right-2.5 w-4 h-4 ${isActive ? 'text-emerald-300' : 'text-emerald-600'}`} />
                                        ) : !allDocsForTraveler ? (
                                            <span className="absolute top-2.5 right-2.5 text-amber-500 font-black leading-none">*</span>
                                        ) : null}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Active Traveller Content */}
                    <div className="p-6 md:p-8 space-y-8">
                        {(() => {
                            const traveler = booking.travelers[activeTravelerIndex];
                            if (!traveler) return null;

                            return (
                                <div className="space-y-8">
                                    {/* Personal Info Display */}
                                    <div>
                                        <h3 className="text-base font-bold text-[#1A1A1A] mb-1">
                                            {activeTravelerIndex === 0 ? "Lead Traveler Information" : `Traveler ${activeTravelerIndex + 1} Information`}
                                        </h3>
                                        <p className="text-xs text-gray-400 font-medium mb-4">Confirmed booking details for this adventurer</p>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                                            <div className="bg-[#F8F9FA] rounded-2xl p-3.5">
                                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">First Name</span>
                                                <span className="text-sm font-bold text-[#1A1A1A]">{traveler.firstName || "—"}</span>
                                            </div>
                                            <div className="bg-[#F8F9FA] rounded-2xl p-3.5">
                                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Last Name</span>
                                                <span className="text-sm font-bold text-[#1A1A1A]">{traveler.lastName || "—"}</span>
                                            </div>
                                            <div className="bg-[#F8F9FA] rounded-2xl p-3.5">
                                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Email Address</span>
                                                <span className="text-sm font-bold text-[#1A1A1A] truncate block">{traveler.email || "—"}</span>
                                            </div>
                                            <div className="bg-[#F8F9FA] rounded-2xl p-3.5">
                                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Phone Number</span>
                                                <span className="text-sm font-bold text-[#1A1A1A]">{traveler.phone || "—"}</span>
                                            </div>
                                            <div className="bg-[#F8F9FA] rounded-2xl p-3.5">
                                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Date of Birth</span>
                                                <span className="text-sm font-bold text-[#1A1A1A]">{traveler.dateOfBirth ? formatDate(traveler.dateOfBirth) : "—"}</span>
                                            </div>
                                            <div className="bg-[#F8F9FA] rounded-2xl p-3.5">
                                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Nationality</span>
                                                <span className="text-sm font-bold text-[#1A1A1A]">{traveler.nationality || "—"}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Document Upload Section */}
                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <h3 className="text-base font-bold text-[#1A1A1A]">
                                                Required Documents (PDF Format)
                                            </h3>
                                            <span className="text-xs text-gray-400 font-medium">Max 10MB per file</span>
                                        </div>
                                        <p className="text-xs text-gray-500 font-medium mb-6">Upload all 4 documents for this traveler before submitting for administrative verification.</p>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {DOC_TYPES.map((dt) => {
                                                const docState = localDocs[activeTravelerIndex]?.[dt.key];
                                                if (!docState) return null;

                                                const hasFile = !!docState.url;
                                                const isUploading = docState.uploading;
                                                const IconComponent = dt.icon;

                                                return (
                                                    <div
                                                        key={dt.key}
                                                        className="bg-[#F8F9FA] rounded-3xl p-5 transition flex flex-col justify-between"
                                                    >
                                                        <div>
                                                            <div className="flex items-center justify-between mb-3">
                                                                <div className="flex items-center gap-2.5">
                                                                    <div className="w-8 h-8 rounded-xl bg-purple-100 text-[#6A38C2] flex items-center justify-center">
                                                                        <IconComponent className="w-4 h-4" />
                                                                    </div>
                                                                    <h4 className="font-bold text-[#1A1A1A] text-sm">{dt.label}</h4>
                                                                </div>

                                                                {/* Verification Badge */}
                                                                {hasFile && (
                                                                    <span className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full flex items-center gap-1 ${
                                                                        docState.verified
                                                                            ? 'bg-emerald-100 text-emerald-800'
                                                                            : 'bg-amber-100 text-amber-800'
                                                                    }`}>
                                                                        {docState.verified ? (
                                                                            <><CheckCircle2 className="w-3 h-3" /> Verified</>
                                                                        ) : (
                                                                            <><AlertCircle className="w-3 h-3" /> Under Review</>
                                                                        )}
                                                                    </span>
                                                                )}
                                                            </div>

                                                            {isUploading ? (
                                                                <div className="space-y-2 py-3">
                                                                    <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                                                                        <div
                                                                            className="bg-[#432360] h-2 rounded-full transition-all duration-300"
                                                                            style={{ width: `${docState.progress}%` }}
                                                                        />
                                                                    </div>
                                                                    <p className="text-xs text-gray-500 font-medium flex items-center gap-1.5">
                                                                        <Loader2 className="w-3.5 h-3.5 animate-spin text-[#432360]" />
                                                                        <span>Uploading document ({docState.progress}%)</span>
                                                                    </p>
                                                                </div>
                                                            ) : hasFile ? (
                                                                <div className="space-y-3 pt-1">
                                                                    <div className="flex items-center gap-2 bg-white rounded-2xl p-3 shadow-xs">
                                                                        <FileText className="w-4 h-4 text-[#432360] shrink-0" />
                                                                        <span className="truncate flex-1 text-xs font-bold text-gray-800">{docState.fileName}</span>
                                                                        <a
                                                                            href={docState.url}
                                                                            target="_blank"
                                                                            rel="noopener noreferrer"
                                                                            className="text-[#432360] hover:text-[#321a48] flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-lg bg-gray-100 transition"
                                                                        >
                                                                            <Eye className="w-3.5 h-3.5" />
                                                                            <span>View</span>
                                                                        </a>
                                                                    </div>
                                                                    {!isAlreadySubmitted && !docState.verified && (
                                                                        <label className="text-xs text-[#432360] font-bold cursor-pointer hover:underline inline-flex items-center gap-1 pl-1">
                                                                            <Upload className="w-3.5 h-3.5" />
                                                                            <span>Replace PDF file</span>
                                                                            <input
                                                                                type="file"
                                                                                accept=".pdf,application/pdf"
                                                                                className="hidden"
                                                                                onChange={(e) => {
                                                                                    const f = e.target.files?.[0];
                                                                                    if (f) handleFileSelect(activeTravelerIndex, dt.key, f);
                                                                                }}
                                                                            />
                                                                        </label>
                                                                    )}
                                                                </div>
                                                            ) : (
                                                                <label className="flex flex-col items-center justify-center bg-white rounded-2xl py-6 cursor-pointer hover:bg-purple-50/40 transition group shadow-xs">
                                                                    <Upload className="w-6 h-6 text-gray-400 group-hover:text-[#432360] mb-2 transition" />
                                                                    <span className="text-xs font-bold text-gray-700 group-hover:text-[#432360] transition">
                                                                        Upload PDF Document
                                                                    </span>
                                                                    <span className="text-[10px] text-gray-400 mt-0.5">Click to browse files</span>
                                                                    <input
                                                                        type="file"
                                                                        accept=".pdf,application/pdf"
                                                                        className="hidden"
                                                                        onChange={(e) => {
                                                                            const f = e.target.files?.[0];
                                                                            if (f) handleFileSelect(activeTravelerIndex, dt.key, f);
                                                                        }}
                                                                    />
                                                                </label>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Navigation Buttons between Travelers */}
                                    <div className="flex justify-between items-center pt-4">
                                        {activeTravelerIndex > 0 ? (
                                            <button
                                                onClick={() => setActiveTravelerIndex(activeTravelerIndex - 1)}
                                                className="bg-gray-100 hover:bg-gray-200 text-[#1A1A1A] font-bold py-2.5 px-6 rounded-full text-xs transition inline-flex items-center gap-1"
                                            >
                                                <ChevronLeft className="w-4 h-4" />
                                                <span>Previous Traveler</span>
                                            </button>
                                        ) : <div />}

                                        {activeTravelerIndex < booking.numberOfTravelers - 1 && (
                                            <button
                                                onClick={() => setActiveTravelerIndex(activeTravelerIndex + 1)}
                                                className="bg-[#432360] hover:bg-[#321a48] text-white font-bold py-2.5 px-7 rounded-full text-xs transition shadow-sm inline-flex items-center gap-1"
                                            >
                                                <span>Next Traveler</span>
                                                <ChevronRight className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })()}
                    </div>
                </div>

                {/* Submit Section */}
                {!isAlreadySubmitted && (
                    <div className="bg-white rounded-3xl p-6 md:p-8 shadow-[0_4px_24px_rgba(0,0,0,0.04)]">
                        <div className="flex flex-col md:flex-row items-center justify-between gap-5">
                            <div>
                                <h3 className="font-bold text-[#1A1A1A] text-lg">Ready to submit all documents?</h3>
                                <p className="text-xs text-gray-500 font-medium mt-1">
                                    {allDocsUploaded()
                                        ? "All required documents for all travelers have been uploaded. Submit them to initiate the verification process."
                                        : "Please upload all 4 documents for each traveler in this booking before submitting."}
                                </p>
                            </div>
                            <button
                                onClick={handleSubmitAll}
                                disabled={!allDocsUploaded() || isSubmitting}
                                className={`flex items-center gap-2 font-bold py-3.5 px-8 rounded-full transition text-xs whitespace-nowrap shadow-md ${
                                    allDocsUploaded() && !isSubmitting
                                        ? 'bg-[#432360] hover:bg-[#321a48] text-white'
                                        : 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'
                                }`}
                            >
                                {isSubmitting ? (
                                    <><Loader2 className="w-4 h-4 animate-spin" /> Submitting...</>
                                ) : (
                                    <><CheckCircle2 className="w-4 h-4" /> Submit All Documents</>
                                )}
                            </button>
                        </div>
                    </div>
                )}

                {/* Already submitted message */}
                {isAlreadySubmitted && !submitSuccess && (
                    <div className="bg-white rounded-3xl p-6 md:p-8 shadow-[0_4px_24px_rgba(0,0,0,0.04)]">
                        <div className="flex items-center gap-3.5">
                            <CheckCircle2 className="w-6 h-6 text-emerald-600 flex-shrink-0" />
                            <div>
                                <p className="font-bold text-[#1A1A1A] text-sm">Documents have been submitted</p>
                                <p className="text-gray-500 text-xs font-medium mt-0.5">
                                    {booking.documentsVerified
                                        ? "All documents have been verified and approved by our team."
                                        : "Your documents are currently under review by our operations team."}
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
