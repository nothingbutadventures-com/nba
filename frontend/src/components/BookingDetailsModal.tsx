"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { useRouter } from "next/navigation";
import {
  X,
  Calendar,
  Users,
  Clock,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Clock4,
  MapPin,
  Mail,
  Phone,
  Compass,
  ShieldCheck,
  FileText,
  RefreshCw,
  Hotel,
  Target,
  Info,
  AlertTriangle,
  Receipt,
  ArrowRight,
  ExternalLink,
} from "lucide-react";

interface BookingDetails {
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
  travelers: Array<{
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
    address?: string;
    city?: string;
    postalCode?: string;
    country?: string;
  }>;
  extras?: {
    activities?: Array<{
      name: string;
      price: number;
      count: number;
    }>;
    accommodationUpgrade?: {
      name: string;
      price: number;
      count: number;
    };
  };
  tour: {
    _id: string;
    name: string;
    slug: string;
    tourCode: string;
    images?: Array<{ url: string; caption?: string; isPrimary?: boolean }>;
    duration?: {
      days: number;
      nights: number;
    };
    location?: {
      startCity: string;
      endCity: string;
    };
    price?: {
      amount: number;
      currency: string;
    };
  };
  createdAt: string;
}

interface BookingDetailsModalProps {
  booking: BookingDetails;
  onClose: () => void;
  onBookingUpdated?: () => void;
}

export default function BookingDetailsModal({
  booking: initialBooking,
  onClose,
  onBookingUpdated,
}: BookingDetailsModalProps) {
  const router = useRouter();
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [booking, setBooking] = useState(initialBooking);
  const [isSyncing, setIsSyncing] = useState(false);

  // Cancellation specific states
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancellationPreview, setCancellationPreview] = useState<any>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [previewError, setPreviewError] = useState("");
  const [cancellationReason, setCancellationReason] = useState("");
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancellationSuccess, setCancellationSuccess] = useState(false);

  const fetchCancellationPreview = async () => {
    setLoadingPreview(true);
    setPreviewError("");
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No authorization token found");

      const res = await fetch(
        `${api.baseURL}/bookings/${booking._id}/cancellation-preview`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      const data = await res.json();
      if (!res.ok)
        throw new Error(data.message || "Failed to fetch cancellation preview");

      setCancellationPreview(data.data);
    } catch (err: any) {
      console.error("Fetch Cancellation Preview Error", err);
      setPreviewError(
        err.message || "Could not retrieve cancellation preview.",
      );
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleConfirmCancellation = async () => {
    setIsCancelling(true);
    setPreviewError("");
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No authorization token found");

      const res = await fetch(`${api.baseURL}/bookings/${booking._id}/cancel`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ reason: cancellationReason }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to cancel booking");

      setBooking(data.data.booking);
      setCancellationSuccess(true);
      if (onBookingUpdated) {
        onBookingUpdated();
      }
    } catch (err: any) {
      console.error("Cancel Booking Error", err);
      setPreviewError(
        err.message || "Could not cancel booking. Please try again.",
      );
    } finally {
      setIsCancelling(false);
    }
  };

  useEffect(() => {
    if (showCancelModal) {
      fetchCancellationPreview();
    }
  }, [showCancelModal]);

  // Sync installment status from PayPal on mount
  useEffect(() => {
    if (
      booking.installmentPlan?.isActive &&
      booking.installmentPlan?.subscriptionId
    ) {
      syncInstallmentStatus();
    }
  }, []);

  const syncInstallmentStatus = async () => {
    setIsSyncing(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `${api.baseURL}/installments/${booking._id}/sync`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      const data = await res.json();
      if (res.ok && data.data?.booking) {
        setBooking(data.data.booking);
      }
    } catch (err) {
      console.error("Failed to sync installment status:", err);
    } finally {
      setIsSyncing(false);
    }
  };

  // Lock body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-emerald-50 text-emerald-700";
      case "pending":
        return "bg-amber-50 text-amber-700";
      case "completed":
        return "bg-blue-50 text-blue-700";
      case "cancelled":
        return "bg-rose-50 text-rose-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: booking.price.currency || "USD",
      maximumFractionDigits: 0,
    }).format(price);
  };

  const primaryImage =
    booking.tour.images?.find((img) => img.isPrimary) ||
    booking.tour.images?.[0];

  const totalPaid =
    booking.payment.transactions?.reduce((sum, t) => sum + t.amount, 0) || 0;
  const remainingAmount = booking.price.totalPrice - totalPaid;

  const handlePayRemaining = async () => {
    setIsProcessingPayment(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("Please log in again");
        return;
      }

      const newTransaction = {
        transactionId: `sim_${Date.now()}`,
        amount: remainingAmount,
        paymentDate: new Date().toISOString(),
        status: "completed",
        currency: booking.price.currency || "USD",
      };

      const updatedTransactions = [
        ...(booking.payment.transactions || []),
        newTransaction,
      ];

      const response = await fetch(`${api.baseURL}/bookings/${booking._id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          payment: {
            method: booking.payment.method,
            status: "paid",
            transactions: updatedTransactions,
          },
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Payment failed");
      }

      onClose();
      window.location.reload();
    } catch (error: any) {
      console.error("Payment error:", error);
      alert(error.message || "Something went wrong processing payment");
    } finally {
      setIsProcessingPayment(false);
      setShowPaymentModal(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-6"
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Content - Seamless Borderless Card */}
      <div className="relative w-full max-w-5xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[90vh] z-10">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2.5 text-gray-500 hover:text-gray-900 bg-white/90 hover:bg-white shadow-sm rounded-full transition-all"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Left Column: Image & Key Summary Specs */}
        <div className="w-full md:w-5/12 bg-[#F8F9FA] flex flex-col overflow-y-auto">
          {/* Trip Image */}
          <div className="aspect-[16/10] sm:aspect-[4/3] w-full bg-gray-100 relative">
            {primaryImage?.url ? (
              <img
                src={primaryImage.url}
                alt={booking.tour.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gray-100">
                <Compass className="w-12 h-12 stroke-[1.5]" />
              </div>
            )}
            <div className="absolute top-4 left-4">
              <span
                className={`inline-flex items-center px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-full shadow-sm ${getStatusBadge(
                  booking.status,
                )}`}
              >
                {booking.status}
              </span>
            </div>
          </div>

          {/* Booking Meta Grid */}
          <div className="p-6 sm:p-7 grid grid-cols-2 gap-y-5 gap-x-4">
            <div className="col-span-2 bg-white rounded-2xl p-4 shadow-sm">
              <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                Booking Reference
              </h4>
              <p className="text-base font-bold text-gray-900 font-mono tracking-tight">
                {booking.bookingReference}
              </p>
            </div>

            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <div className="flex items-center gap-1.5 text-gray-400 mb-1">
                <Calendar className="w-3.5 h-3.5" />
                <h4 className="text-[11px] font-bold uppercase tracking-wider">
                  Start Date
                </h4>
              </div>
              <p className="text-sm font-bold text-gray-900">
                {formatDate(booking.startDate)}
              </p>
            </div>

            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <div className="flex items-center gap-1.5 text-gray-400 mb-1">
                <Users className="w-3.5 h-3.5" />
                <h4 className="text-[11px] font-bold uppercase tracking-wider">
                  Travelers
                </h4>
              </div>
              <p className="text-sm font-bold text-gray-900">
                {booking.numberOfTravelers} {booking.numberOfTravelers === 1 ? "person" : "people"}
              </p>
            </div>

            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <div className="flex items-center gap-1.5 text-gray-400 mb-1">
                <Clock className="w-3.5 h-3.5" />
                <h4 className="text-[11px] font-bold uppercase tracking-wider">
                  Duration
                </h4>
              </div>
              <p className="text-sm font-bold text-gray-900">
                {booking.tour.duration
                  ? `${booking.tour.duration.days}D / ${booking.tour.duration.nights}N`
                  : "N/A"}
              </p>
            </div>

            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <div className="flex items-center gap-1.5 text-gray-400 mb-1">
                <CreditCard className="w-3.5 h-3.5" />
                <h4 className="text-[11px] font-bold uppercase tracking-wider">
                  Payment Method
                </h4>
              </div>
              <p className="text-sm font-bold text-gray-900 capitalize">
                {booking.payment.method.replace("_", " ")}
              </p>
            </div>

            <div className="col-span-2 bg-white rounded-2xl p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                    Payment Status
                  </h4>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 text-xs font-bold rounded-full ${
                      booking.payment.status === "paid"
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-amber-50 text-amber-700"
                    }`}
                  >
                    {booking.payment.status.toUpperCase()}
                  </span>
                </div>
                {booking.payment.status === "partially_paid" &&
                  remainingAmount > 0 && (
                    <button
                      onClick={() => setShowPaymentModal(true)}
                      className="text-xs bg-[#432360] hover:bg-[#321a48] text-white font-bold py-2 px-3.5 rounded-xl transition-colors shadow-sm"
                    >
                      Pay Remaining ({formatPrice(remainingAmount)})
                    </button>
                  )}
              </div>
            </div>

            <div className="col-span-2 px-1">
              <h4 className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-0.5">
                Booked On
              </h4>
              <p className="text-xs font-medium text-gray-600">
                {formatDateTime(booking.createdAt)}
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Full Details & Schedules */}
        <div className="w-full md:w-7/12 bg-white flex flex-col max-h-[90vh]">
          <div className="p-6 sm:p-8 flex-1 overflow-y-auto space-y-7">
            {/* Header / Title */}
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight mb-2">
                {booking.tour.name}
              </h2>
              <div className="flex items-center gap-1.5 text-sm font-medium text-gray-500">
                <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <span>
                  {booking.tour.location
                    ? `${booking.tour.location.startCity} to ${booking.tour.location.endCity}`
                    : "Adventure Journey"}
                </span>
              </div>
            </div>

            {/* Travelers List */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Users className="w-4 h-4 text-gray-500" />
                <h3 className="text-base font-bold text-gray-900">
                  Travelers ({booking.travelers.length})
                </h3>
              </div>
              <div className="space-y-3">
                {booking.travelers.map((traveler, idx) => (
                  <div
                    key={idx}
                    className="bg-[#F8F9FA] rounded-2xl p-4 transition-all"
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-gray-900 text-sm">
                            {traveler.firstName} {traveler.lastName}
                          </p>
                          {idx === 0 && (
                            <span className="text-[11px] font-semibold bg-purple-100 text-[#6A38C2] px-2 py-0.5 rounded-full">
                              Lead Traveler
                            </span>
                          )}
                        </div>

                        {traveler.email && (
                          <p className="text-xs text-gray-600 flex items-center gap-1.5 pt-0.5">
                            <Mail className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                            {traveler.email}
                          </p>
                        )}
                        {traveler.phone && (
                          <p className="text-xs text-gray-600 flex items-center gap-1.5">
                            <Phone className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                            {traveler.phone}
                          </p>
                        )}
                        {traveler.address && (
                          <p className="text-xs text-gray-600 flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                            {traveler.address}
                            {traveler.city && `, ${traveler.city}`}
                            {traveler.postalCode && `, ${traveler.postalCode}`}
                            {traveler.country && `, ${traveler.country}`}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Price Breakdown */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Receipt className="w-4 h-4 text-gray-500" />
                <h3 className="text-base font-bold text-gray-900">
                  Price Breakdown
                </h3>
              </div>
              <div className="bg-[#F8F9FA] rounded-2xl p-5 space-y-4">
                {/* Trips Section */}
                <div>
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                    Trips
                  </p>
                  <div className="flex justify-between items-start">
                    <div className="flex-1 pr-4">
                      <p className="text-sm font-semibold text-gray-900">
                        {booking.tour.name}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        × {booking.numberOfTravelers} traveler
                        {booking.numberOfTravelers > 1 ? "s" : ""}
                      </p>
                    </div>
                    <span className="font-bold text-gray-900 text-sm whitespace-nowrap">
                      $
                      {(
                        booking.price.basePrice * booking.numberOfTravelers
                      ).toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Extras Section */}
                {((booking.extras?.activities &&
                  booking.extras.activities.length > 0) ||
                  booking.extras?.accommodationUpgrade) && (
                  <div className="pt-3 space-y-3">
                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                      Extras & Add-ons
                    </p>
                    <div className="space-y-2.5">
                      {booking.extras?.activities?.map((activity, idx) => (
                        <div
                          key={idx}
                          className="flex justify-between items-start"
                        >
                          <div className="flex items-start gap-2 flex-1 pr-4">
                            <Target className="w-4 h-4 text-[#6A38C2] flex-shrink-0 mt-0.5" />
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {activity.name}
                              </p>
                              <p className="text-xs text-gray-500">
                                × {activity.count} traveler
                                {activity.count > 1 ? "s" : ""}
                              </p>
                            </div>
                          </div>
                          <span className="font-semibold text-gray-900 text-sm whitespace-nowrap">
                            $
                            {(activity.price * activity.count).toLocaleString()}
                          </span>
                        </div>
                      ))}

                      {booking.extras?.accommodationUpgrade && (
                        <div className="flex justify-between items-start">
                          <div className="flex items-start gap-2 flex-1 pr-4">
                            <Hotel className="w-4 h-4 text-[#6A38C2] flex-shrink-0 mt-0.5" />
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {booking.extras.accommodationUpgrade.name}
                              </p>
                              <p className="text-xs text-gray-500">
                                × {booking.extras.accommodationUpgrade.count}{" "}
                                traveler
                                {booking.extras.accommodationUpgrade.count > 1
                                  ? "s"
                                  : ""}
                              </p>
                            </div>
                          </div>
                          <span className="font-semibold text-gray-900 text-sm whitespace-nowrap">
                            $
                            {(
                              booking.extras.accommodationUpgrade.price *
                              booking.extras.accommodationUpgrade.count
                            ).toLocaleString()}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Total */}
                <div className="pt-3 flex justify-between items-center bg-white rounded-xl p-4 shadow-sm">
                  <div>
                    <p className="font-bold text-gray-900 text-base">Total Price</p>
                    <p className="text-xs text-gray-400">All taxes & fees included</p>
                  </div>
                  <span className="font-extrabold text-gray-900 text-2xl">
                    ${booking.price.totalPrice.toLocaleString()}{" "}
                    <span className="text-xs font-bold text-gray-500">
                      {booking.price.currency || "USD"}
                    </span>
                  </span>
                </div>
              </div>
            </div>

            {/* Payment Transaction Details */}
            {booking.payment.transactions &&
              booking.payment.transactions.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <CreditCard className="w-4 h-4 text-gray-500" />
                    <h3 className="text-base font-bold text-gray-900">
                      Payment Details
                    </h3>
                  </div>
                  <div className="bg-[#F8F9FA] rounded-2xl p-4 space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500 font-medium">Transaction Reference</span>
                      <span className="font-mono font-bold text-gray-900">
                        {booking.payment.transactions[0].transactionId}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500 font-medium">Payment Timestamp</span>
                      <span className="text-gray-900 font-medium">
                        {formatDateTime(
                          booking.payment.transactions[0].paymentDate,
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              )}

            {/* Installment Plan Section */}
            {booking.installmentPlan &&
              booking.installmentPlan.schedule &&
              booking.installmentPlan.schedule.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Clock4 className="w-4 h-4 text-gray-500" />
                      <h3 className="text-base font-bold text-gray-900">
                        Installment Schedule
                      </h3>
                    </div>
                    {booking.installmentPlan.isActive && (
                      <button
                        onClick={syncInstallmentStatus}
                        disabled={isSyncing}
                        className="inline-flex items-center gap-1.5 text-xs bg-purple-50 hover:bg-purple-100 text-[#6A38C2] font-semibold py-1.5 px-3 rounded-full transition disabled:opacity-50"
                      >
                        <RefreshCw
                          className={`w-3 h-3 ${isSyncing ? "animate-spin" : ""}`}
                        />
                        {isSyncing ? "Syncing..." : "Refresh Status"}
                      </button>
                    )}
                  </div>

                  {/* Progress bar */}
                  {(() => {
                    const paidCount = booking.installmentPlan.schedule.filter(
                      (s: any) => s.status === "paid",
                    ).length;
                    const totalCount = booking.installmentPlan.schedule.length;
                    const progressPercent = Math.round(
                      (paidCount / totalCount) * 100,
                    );
                    const totalPaid = booking.installmentPlan.schedule
                      .filter((s: any) => s.status === "paid")
                      .reduce((sum: number, s: any) => sum + s.amount, 0);

                    return (
                      <div className="bg-[#F8F9FA] rounded-2xl p-4 mb-3">
                        <div className="flex justify-between text-xs mb-2">
                          <span className="text-gray-600 font-medium">
                            {paidCount} of {totalCount} installments completed
                          </span>
                          <span className="font-bold text-gray-900">
                            {progressPercent}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${progressPercent}%`,
                              background:
                                progressPercent === 100
                                  ? "#10b981"
                                  : "#6A38C2",
                            }}
                          />
                        </div>
                        <div className="flex justify-between text-xs mt-2 font-medium">
                          <span className="text-emerald-700">
                            Paid: ${(totalPaid || 0).toLocaleString()}
                          </span>
                          <span className="text-gray-500">
                            Remaining: $
                            {(
                              booking.installmentPlan.totalAmount - totalPaid
                            ).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Schedule table */}
                  <div className="bg-[#F8F9FA] rounded-2xl overflow-hidden p-2">
                    <div className="grid grid-cols-4 gap-2 px-3 py-2 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                      <span>Payment</span>
                      <span>Amount</span>
                      <span>Due Date</span>
                      <span>Status</span>
                    </div>
                    <div className="space-y-1">
                      {booking.installmentPlan.schedule.map(
                        (entry: any, idx: number) => (
                          <div
                            key={idx}
                            className={`grid grid-cols-4 gap-2 px-3 py-2.5 rounded-xl text-xs items-center ${
                              entry.status === "paid"
                                ? "bg-emerald-50/60"
                                : "bg-white"
                            }`}
                          >
                            <span className="text-gray-900 font-bold">
                              {entry.type === "upfront"
                                ? "Upfront Deposit"
                                : `Installment #${entry.installmentNumber}`}
                            </span>
                            <span className="text-gray-900 font-bold">
                              ${entry.amount.toLocaleString()}
                            </span>
                            <span className="text-gray-500 font-medium">
                              {new Date(entry.dueDate).toLocaleDateString(
                                "en-US",
                                {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                },
                              )}
                            </span>
                            <span>
                              {entry.status === "paid" ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                                  <CheckCircle2 className="w-3 h-3" /> Paid
                                </span>
                              ) : entry.status === "failed" ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800">
                                  <AlertCircle className="w-3 h-3" /> Failed
                                </span>
                              ) : entry.status === "overdue" ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800">
                                  <AlertTriangle className="w-3 h-3" /> Overdue
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-gray-100 text-gray-600">
                                  <Clock4 className="w-3 h-3" /> Pending
                                </span>
                              )}
                            </span>
                          </div>
                        ),
                      )}
                    </div>
                  </div>

                  {/* Deadline notice */}
                  {booking.installmentPlan.isActive && (
                    <div className="mt-3 bg-amber-50/80 rounded-2xl p-3.5 flex items-start gap-2.5">
                      <AlertTriangle className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-amber-900 leading-relaxed">
                        All payments must be completed by{" "}
                        <strong>
                          {new Date(
                            booking.installmentPlan.deadline,
                          ).toLocaleDateString("en-US", {
                            month: "long",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </strong>{" "}
                        (90 days before tour). Failure to complete will result
                        in booking cancellation and the paid amount being
                        credited to your wallet.
                      </p>
                    </div>
                  )}
                </div>
              )}
          </div>

          {/* Modal Footer - Modern borderless buttons */}
          <div className="p-4 sm:p-5 bg-white flex flex-wrap items-center justify-between gap-3 shadow-sm">
            <div className="flex flex-wrap items-center gap-2">
              <Link
                href={`/trips/${booking.tour.slug}/${booking.tour.tourCode}`}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold rounded-xl text-gray-800 bg-[#F0F2F5] hover:bg-[#E4E7EC] transition-all"
              >
                <span>View Trip</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>

              {booking.status !== "cancelled" && (
                <button
                  onClick={() => {
                    onClose();
                    router.push(`/bookings?bookingId=${booking._id}`);
                  }}
                  className={`inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold rounded-xl transition-all ${
                    (booking as any).documentsVerified
                      ? "text-emerald-800 bg-emerald-50 cursor-default"
                      : (booking as any).documentsSubmitted
                        ? "text-amber-800 bg-amber-50 hover:bg-amber-100"
                        : "text-[#6A38C2] bg-purple-50 hover:bg-purple-100"
                  }`}
                  disabled={(booking as any).documentsVerified}
                >
                  <FileText className="w-3.5 h-3.5" />
                  {(booking as any).documentsVerified
                    ? "Documents Verified"
                    : (booking as any).documentsSubmitted
                      ? "View Documents"
                      : "Submit Documents"}
                </button>
              )}

              {booking.status !== "cancelled" &&
                booking.status !== "completed" && (
                  <button
                    onClick={() => setShowCancelModal(true)}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold rounded-xl text-rose-700 bg-rose-50 hover:bg-rose-100 transition-all"
                  >
                    Cancel Booking
                  </button>
                )}
            </div>

            <button
              onClick={onClose}
              className="inline-flex items-center px-5 py-2.5 text-xs font-bold rounded-xl text-white bg-[#432360] hover:bg-[#321a48] transition-all shadow-sm"
            >
              Close
            </button>
          </div>
        </div>
      </div>

      {/* Cancellation Modal Overlay */}
      {showCancelModal && (
        <div
          className="fixed inset-0 z-[10000] overflow-y-auto"
          aria-labelledby="modal-title"
          role="dialog"
          aria-modal="true"
        >
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            {/* Background overlay */}
            <div
              className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
              aria-hidden="true"
              onClick={() => !isCancelling && setShowCancelModal(false)}
            />

            <span
              className="hidden sm:inline-block sm:align-middle sm:h-screen"
              aria-hidden="true"
            >
              &#8203;
            </span>

            {/* Modal panel */}
            <div className="inline-block align-bottom bg-white rounded-3xl text-left overflow-hidden shadow-2xl relative z-[10001] sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white p-6 sm:p-7">
                <div className="sm:flex sm:items-start gap-4">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-2xl bg-rose-50 sm:mx-0">
                    <AlertTriangle className="w-6 h-6 text-rose-600" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                    <h3
                      className="text-xl font-bold text-gray-900 tracking-tight"
                      id="modal-title"
                    >
                      Cancel Booking
                    </h3>

                    {loadingPreview ? (
                      <div className="mt-6 flex flex-col items-center justify-center py-6">
                        <div className="animate-spin rounded-full h-8 w-8 border-2 border-rose-600 border-t-transparent" />
                        <p className="mt-2 text-xs font-semibold text-gray-500 text-center">
                          Calculating refund & deposit options...
                        </p>
                      </div>
                    ) : previewError ? (
                      <div className="mt-4 p-4 bg-rose-50 text-rose-700 text-xs rounded-2xl font-medium">
                        {previewError}
                        <div className="mt-4">
                          <button
                            type="button"
                            onClick={() => setShowCancelModal(false)}
                            className="w-full inline-flex justify-center rounded-xl px-4 py-2.5 bg-white text-xs font-bold text-gray-700 shadow-sm hover:bg-gray-50"
                          >
                            Close
                          </button>
                        </div>
                      </div>
                    ) : cancellationSuccess ? (
                      <div className="mt-4 text-center py-4">
                        <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3">
                          <CheckCircle2 className="w-8 h-8" />
                        </div>
                        <h4 className="text-lg font-bold text-gray-900 mb-1">
                          Booking Cancelled Successfully
                        </h4>
                        <p className="text-xs text-gray-500 mb-6 leading-relaxed">
                          Your cancellation has been processed. Confirmation
                          emails and any eligible Lifetime Deposits have been
                          credited.
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            setShowCancelModal(false);
                            onClose();
                          }}
                          className="w-full inline-flex justify-center rounded-xl px-4 py-3 bg-[#432360] text-sm font-bold text-white hover:bg-[#321a48] shadow-sm transition-all"
                        >
                          Done
                        </button>
                      </div>
                    ) : cancellationPreview ? (
                      <div className="mt-4">
                        <p className="text-xs text-gray-500 mb-4 leading-relaxed">
                          Are you sure you want to cancel your booking? Below is
                          the policy breakdown for your cancellation.
                        </p>

                        <div className="bg-[#F8F9FA] p-4 rounded-2xl mb-4 text-xs space-y-2.5">
                          <div className="flex justify-between">
                            <span className="text-gray-500">Booking Ref:</span>
                            <span className="font-mono font-bold text-gray-900">
                              {booking.bookingReference}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">
                              Days to Departure:
                            </span>
                            <span className="font-bold text-gray-900">
                              {cancellationPreview.daysBeforeDeparture} days
                            </span>
                          </div>
                          <div className="flex justify-between pt-2">
                            <span className="text-gray-500">Total Paid:</span>
                            <span className="font-bold text-gray-900">
                              ${cancellationPreview.totalPaid.toLocaleString()}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">
                              Lifetime Deposit held:
                            </span>
                            <span className="font-bold text-[#6A38C2]">
                              $
                              {cancellationPreview.heldDepositAmount.toLocaleString()}
                            </span>
                          </div>
                          <div className="flex justify-between pt-2 text-sm bg-white p-3 rounded-xl shadow-sm">
                            <span className="text-gray-900 font-bold">
                              Cash Refund:
                            </span>
                            <span className="font-extrabold text-emerald-600">
                              $
                              {cancellationPreview.refundAmount.toLocaleString()}
                            </span>
                          </div>
                        </div>

                        <div className="mb-4 text-xs text-purple-900 bg-purple-50 p-3.5 rounded-2xl flex items-start gap-2 leading-relaxed">
                          <Info className="w-4 h-4 text-[#6A38C2] flex-shrink-0 mt-0.5" />
                          <div>
                            <strong>Cancellation Policy:</strong>
                            <p className="mt-0.5">{cancellationPreview.policyApplied}</p>
                          </div>
                        </div>

                        <div className="mb-4">
                          <label
                            htmlFor="reason"
                            className="block text-xs font-bold text-gray-700 mb-1.5"
                          >
                            Reason for cancellation (optional)
                          </label>
                          <textarea
                            id="reason"
                            value={cancellationReason}
                            onChange={(e) =>
                              setCancellationReason(e.target.value)
                            }
                            placeholder="Please let us know why you are cancelling..."
                            className="w-full px-3.5 py-2.5 text-xs rounded-2xl bg-[#F8F9FA] focus:bg-white focus:ring-2 focus:ring-rose-500/20 outline-none resize-none h-20 transition"
                          />
                        </div>

                        <div className="flex flex-col gap-2">
                          <button
                            type="button"
                            disabled={isCancelling}
                            onClick={handleConfirmCancellation}
                            className="w-full inline-flex justify-center rounded-xl px-4 py-3 bg-rose-600 text-xs font-bold text-white hover:bg-rose-700 disabled:opacity-50 transition shadow-sm"
                          >
                            {isCancelling
                              ? "Processing Cancellation..."
                              : "Confirm Cancellation"}
                          </button>
                          <button
                            type="button"
                            disabled={isCancelling}
                            onClick={() => setShowCancelModal(false)}
                            className="w-full inline-flex justify-center rounded-xl px-4 py-2.5 bg-[#F0F2F5] text-xs font-bold text-gray-700 hover:bg-[#E4E7EC] transition"
                          >
                            Keep My Booking
                          </button>
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payment Simulation Modal Overlay */}
      {showPaymentModal && (
        <div
          className="fixed inset-0 z-[10000] overflow-y-auto"
          aria-labelledby="modal-title"
          role="dialog"
          aria-modal="true"
        >
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            {/* Background overlay */}
            <div
              className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
              aria-hidden="true"
              onClick={() => !isProcessingPayment && setShowPaymentModal(false)}
            />

            <span
              className="hidden sm:inline-block sm:align-middle sm:h-screen"
              aria-hidden="true"
            >
              &#8203;
            </span>

            {/* Modal panel */}
            <div className="inline-block align-bottom bg-white rounded-3xl text-left overflow-hidden shadow-2xl relative z-[10001] sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white p-6 sm:p-7">
                <div className="sm:flex sm:items-start gap-4">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-2xl bg-emerald-50 sm:mx-0">
                    <CreditCard className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                    <h3
                      className="text-xl font-bold text-gray-900 tracking-tight"
                      id="modal-title"
                    >
                      Pay Remaining Balance
                    </h3>
                    <div className="mt-2">
                      <p className="text-xs text-gray-500 mb-4 leading-relaxed">
                        Complete your booking by paying the remaining balance with your simulated card.
                      </p>

                      <div className="bg-[#F8F9FA] p-4 rounded-2xl mb-4 space-y-2 text-xs">
                        <div className="flex justify-between">
                          <span className="text-gray-500">Booking Ref:</span>
                          <span className="font-mono font-bold text-gray-900">
                            {booking.bookingReference}
                          </span>
                        </div>
                        <div className="flex justify-between text-base font-bold text-gray-900 pt-2 bg-white p-3 rounded-xl shadow-sm">
                          <span>Pay Remaining:</span>
                          <span className="text-[#432360] font-extrabold">{formatPrice(remainingAmount)}</span>
                        </div>
                        <div className="flex justify-between text-xs pt-1 text-gray-500">
                          <span>Payment Method:</span>
                          <span className="font-mono font-medium text-gray-700">Card ending in 4242</span>
                        </div>
                      </div>

                      <div className="mt-4 flex flex-col gap-2">
                        <button
                          type="button"
                          disabled={isProcessingPayment}
                          onClick={handlePayRemaining}
                          className="w-full inline-flex justify-center rounded-xl px-4 py-3 bg-[#432360] text-xs font-bold text-white hover:bg-[#321a48] disabled:opacity-50 transition shadow-sm"
                        >
                          {isProcessingPayment
                            ? "Processing Payment..."
                            : `Pay ${formatPrice(remainingAmount)}`}
                        </button>
                        <button
                          type="button"
                          disabled={isProcessingPayment}
                          onClick={() => setShowPaymentModal(false)}
                          className="w-full inline-flex justify-center rounded-xl px-4 py-2.5 bg-[#F0F2F5] text-xs font-bold text-gray-700 hover:bg-[#E4E7EC] transition"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
