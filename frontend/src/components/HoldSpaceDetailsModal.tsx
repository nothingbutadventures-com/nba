"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import {
  X,
  User,
  CalendarBlank,
  Clock,
  MapPin,
  ShieldCheck,
  Tag,
  Envelope,
  Phone,
  Globe,
  FileText,
  ArrowRight,
  HourglassHigh,
} from "@phosphor-icons/react";

interface Traveler {
  title?: string;
  firstName?: string;
  middleName?: string;
  lastName?: string;
  email?: string;
  countryCode?: string;
  phone?: string;
  dobDay?: string;
  dobMonth?: string;
  dobYear?: string;
  nationality?: string;
}

interface HoldSpaceDetails {
  _id: string;
  holdReference: string;
  status: "active" | "expired" | "converted" | "released" | string;
  startDate: string;
  endDate?: string;
  numberOfSpots: number;
  expiresAt: string;
  priceAtHold?: {
    amount: number;
    currency: string;
  };
  travelers?: Traveler[];
  specialRequests?: string;
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
  };
  createdAt: string;
}

interface HoldSpaceDetailsModalProps {
  hold: HoldSpaceDetails;
  onClose: () => void;
  onHoldUpdated?: () => void;
}

export default function HoldSpaceDetailsModal({
  hold: initialHold,
  onClose,
  onHoldUpdated,
}: HoldSpaceDetailsModalProps) {
  const router = useRouter();
  const [hold, setHold] = useState(initialHold);
  const [isReleasing, setIsReleasing] = useState(false);

  const calculateTimeRemaining = (expiresAt: string) => {
    const diff = new Date(expiresAt).getTime() - new Date().getTime();
    if (diff <= 0) return { hours: 0, minutes: 0, expired: true };

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return { hours, minutes, expired: false };
  };

  const {
    hours: hoursLeft,
    minutes: minutesLeft,
    expired: isExpired,
  } = calculateTimeRemaining(hold.expiresAt);

  const isActive = hold.status === "active" && !isExpired;

  const handleReleaseHold = async () => {
    if (
      !confirm(
        "Are you sure you want to release this held space? It will immediately become available for others to book.",
      )
    ) {
      return;
    }

    setIsReleasing(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("Authentication required");
        return;
      }

      const res = await fetch(`${api.baseURL}/hold-spaces/${hold._id}/release`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to release hold");
      }

      setHold((prev) => ({ ...prev, status: "released" }));
      if (onHoldUpdated) {
        onHoldUpdated();
      }
      onClose();
    } catch (err: any) {
      console.error("Release hold error:", err);
      alert(err.message || "An error occurred");
    } finally {
      setIsReleasing(false);
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "N/A";
    return new Date(dateStr).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const primaryImage =
    hold.tour?.images?.find((img) => img.isPrimary) || hold.tour?.images?.[0];

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl overflow-hidden my-6 max-h-[90vh] flex flex-col z-10">
        {/* Header */}
        <div className="flex items-center justify-between px-6 sm:px-8 py-5 bg-white sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="bg-purple-100 p-2.5 rounded-2xl text-[#6A38C2]">
              <ShieldCheck size={24} weight="fill" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Hold Space Details
              </h2>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <span>Reference:</span>
                <code className="bg-purple-50 text-[#6A38C2] font-semibold px-2 py-0.5 rounded-lg font-mono">
                  {hold.holdReference}
                </code>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition"
          >
            <X size={20} weight="bold" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-6 flex-1">
          {/* Status & Countdown Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-[#F8F9FA]">
            <div className="flex items-center gap-3">
              <span
                className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold ${
                  isActive
                    ? "bg-amber-100 text-amber-900"
                    : hold.status === "converted"
                      ? "bg-emerald-100 text-emerald-900"
                      : hold.status === "released"
                        ? "bg-gray-200 text-gray-700"
                        : "bg-rose-100 text-rose-900"
                }`}
              >
                {isExpired
                  ? "Expired"
                  : hold.status === "active"
                    ? "48-Hour Free Hold Active"
                    : hold.status === "converted"
                      ? "Booked"
                      : "Released"}
              </span>
            </div>

            {isActive && (
              <div className="flex items-center gap-2 bg-amber-100/90 px-3.5 py-1.5 rounded-xl text-amber-950 text-xs font-medium">
                <Clock size={16} weight="bold" className="text-amber-800" />
                <span>
                  Hold Expires in:{" "}
                  <strong className="font-bold text-amber-950">
                    {hoursLeft}h {minutesLeft}m
                  </strong>
                </span>
              </div>
            )}
          </div>

          {/* Tour Card Summary */}
          <div className="flex flex-col sm:flex-row items-start gap-4 p-5 rounded-2xl bg-[#F8F9FA]">
            <div className="w-full sm:w-28 h-28 relative rounded-xl overflow-hidden shrink-0 bg-gray-100">
              {primaryImage?.url ? (
                <Image
                  src={primaryImage.url}
                  alt={hold.tour?.name || "Tour"}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-3xl">
                  🏔️
                </div>
              )}
            </div>
            <div className="flex-1 space-y-1">
              <div className="text-xs text-[#6A38C2] font-semibold uppercase tracking-wider">
                Tour Code: {hold.tour?.tourCode}
              </div>
              <h3 className="text-lg font-bold text-gray-900">
                {hold.tour?.name}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 text-xs text-gray-600">
                <div className="flex items-center gap-1.5">
                  <CalendarBlank size={16} className="text-[#6A38C2]" />
                  <span>
                    Departure: <strong>{formatDate(hold.startDate)}</strong>
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock size={16} className="text-[#6A38C2]" />
                  <span>
                    Duration:{" "}
                    <strong>{hold.tour?.duration?.days || "—"} Days</strong>
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <User size={16} className="text-[#6A38C2]" />
                  <span>
                    Reserved Spots:{" "}
                    <strong>
                      {hold.numberOfSpots}{" "}
                      {hold.numberOfSpots > 1 ? "Spots" : "Spot"}
                    </strong>
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Tag size={16} className="text-[#6A38C2]" />
                  <span>
                    Locked Price:{" "}
                    <strong>
                      ${hold.priceAtHold?.amount?.toLocaleString() || "—"} USD /
                      person
                    </strong>
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* All Travelers Details Section */}
          <div>
            <h4 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
              <User size={20} className="text-[#6A38C2]" />
              Traveler Information (
              {hold.travelers?.length || hold.numberOfSpots || 1})
            </h4>

            <div className="space-y-3">
              {hold.travelers && hold.travelers.length > 0 ? (
                hold.travelers.map((t, idx) => (
                  <div
                    key={idx}
                    className="rounded-2xl p-4 bg-[#F8F9FA] space-y-3"
                  >
                    <div className="flex items-center justify-between pb-1">
                      <span className="font-bold text-sm text-gray-900">
                        {idx === 0
                          ? "Lead Traveler (Contact Person)"
                          : `Traveler ${idx + 1}`}
                      </span>
                      <span className="text-xs bg-purple-100 text-[#6A38C2] font-semibold px-2.5 py-0.5 rounded-full">
                        {t.title || "Traveler"}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs text-gray-700">
                      <div>
                        <span className="text-gray-400 block text-[11px] font-medium">
                          Full Name
                        </span>
                        <strong className="text-gray-900 text-sm">
                          {[t.title, t.firstName, t.middleName, t.lastName]
                            .filter(Boolean)
                            .join(" ") || "N/A"}
                        </strong>
                      </div>
                      <div>
                        <span className="text-gray-400 block text-[11px] font-medium">
                          Email Address
                        </span>
                        <span className="font-medium text-gray-900">
                          {t.email || "N/A"}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-400 block text-[11px] font-medium">
                          Phone Number
                        </span>
                        <span className="font-medium text-gray-900">
                          {[t.countryCode, t.phone].filter(Boolean).join(" ") ||
                            "N/A"}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-400 block text-[11px] font-medium">
                          Date of Birth
                        </span>
                        <span className="font-medium text-gray-900">
                          {t.dobDay && t.dobMonth && t.dobYear
                            ? `${t.dobDay}/${t.dobMonth}/${t.dobYear}`
                            : "N/A"}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-400 block text-[11px] font-medium">
                          Nationality
                        </span>
                        <span className="font-medium text-gray-900">
                          {t.nationality || "N/A"}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-gray-500 italic p-4 rounded-2xl bg-[#F8F9FA]">
                  No detailed traveler info recorded.
                </p>
              )}
            </div>
          </div>

          {/* Special Requests */}
          {hold.specialRequests && (
            <div className="p-4 rounded-2xl bg-[#F8F9FA]">
              <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <FileText size={16} className="text-[#6A38C2]" />
                Special Requests / Notes
              </h4>
              <p className="text-xs text-gray-600 leading-relaxed">
                {hold.specialRequests}
              </p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 sm:px-8 py-4 bg-white sticky bottom-0 z-10 flex flex-wrap items-center justify-between gap-3 shadow-sm">
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-gray-700 bg-gray-100 hover:bg-gray-200 font-bold rounded-xl transition text-xs"
          >
            Close
          </button>

          {isActive && (
            <div className="flex items-center gap-3">
              <button
                onClick={handleReleaseHold}
                disabled={isReleasing}
                className="px-5 py-2.5 text-rose-700 bg-rose-50 hover:bg-rose-100 font-bold rounded-xl transition text-xs disabled:opacity-50"
              >
                {isReleasing ? "Releasing..." : "Release Hold"}
              </button>
              <button
                onClick={() => {
                  const tourCode = hold.tour?.tourCode || "tour";
                  const dateStr = hold.startDate
                    ? new Date(hold.startDate).toISOString().split("T")[0]
                    : "";
                  router.push(
                    `/trips/${hold.tour?.slug}/${tourCode}/checkout?date=${dateStr}&holdId=${hold._id}`,
                  );
                }}
                className="px-6 py-2.5 bg-[#432360] text-white font-bold rounded-xl hover:bg-[#321a48] transition text-xs shadow-sm flex items-center gap-2"
              >
                Book This Tour Now
                <ArrowRight size={16} weight="bold" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
