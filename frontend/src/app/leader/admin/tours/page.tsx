"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { api } from "@/lib/api";

// ─── Interfaces ──────────────────────────────────────────────────────────────

interface Tour {
  _id: string;
  name: string;
  slug: string;
  tourCode: string;
  summary: string;
  price: {
    amount: number;
    currency: string;
  };
  duration: {
    days: number;
    nights?: number;
  };
  difficulty?: string;
  country: {
    _id: string;
    name: string;
  };
  isActive: boolean;
  isFeatured: boolean;
}

interface DepartureDateItem {
  date: string;
  endDate?: string;
  availableSpots?: number;
  travelersCount?: number;
  bookingsCount?: number;
  discount?: string;
}

interface TravelerAttendance {
  booking: string;
  travelerId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  emergencyContact?: {
    name?: string;
    phone?: string;
    relationship?: string;
  };
  roomPreference?: string;
  dietary?: string[];
  status: "pending" | "present" | "absent" | "late";
  checkInTime?: string;
  notes?: string;
  bookingRef?: string;
}

interface DayActivity {
  activityId: string;
  title: string;
  duration?: string;
  location?: string;
  placeName?: string;
  status: "upcoming" | "in_progress" | "completed" | "skipped" | "delayed";
  startedAt?: string;
  completedAt?: string;
  notes?: string;
}

interface DailyProgress {
  dayNumber: number;
  status: "not_started" | "in_progress" | "completed";
  activities: DayActivity[];
  notes?: string;
}

interface TourExecutionData {
  tour: {
    _id: string;
    name: string;
    tourCode: string;
    slug: string;
    duration?: { days: number };
    country?: { name: string };
    summary?: string;
    itinerary?: any[];
  };
  departureDate: string;
  availableDepartureDates: DepartureDateItem[];
  execution: {
    _id: string;
    currentDay: number;
    attendance: TravelerAttendance[];
    dailyProgress: DailyProgress[];
    updatedAt: string;
  };
  stats: {
    totalTravelers: number;
    presentCount: number;
    absentCount: number;
    pendingCount: number;
    lateCount: number;
    totalActivities: number;
    completedActivities: number;
    inProgressActivities: number;
  };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDisplayDate(dateStr: string) {
  if (!dateStr) return "N/A";
  try {
    const [y, m, d] = dateStr.split("-").map(Number);
    if (y && m && d) {
      const date = new Date(y, m - 1, d);
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    }
    return dateStr;
  } catch {
    return dateStr;
  }
}

function getDateStatus(startStr: string, endStr?: string) {
  const today = new Date().toISOString().split("T")[0];
  if (endStr && today >= startStr && today <= endStr) {
    return { label: "Active Today", color: "bg-emerald-50 text-emerald-700 border-emerald-200" };
  }
  if (today < startStr) {
    return { label: "Upcoming", color: "bg-purple-50 text-purple-700 border-purple-200" };
  }
  return { label: "Past Departure", color: "bg-zinc-100 text-zinc-600 border-zinc-200" };
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function LeaderAssignedToursPage() {
  const [tours, setTours] = useState<Tour[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // ─── Modal States ────────────────────────────────────────────────────────
  // Modal 1: Departures list for a selected tour
  const [selectedTour, setSelectedTour] = useState<Tour | null>(null);
  const [isDatesModalOpen, setIsDatesModalOpen] = useState(false);
  const [departureDates, setDepartureDates] = useState<DepartureDateItem[]>([]);
  const [loadingDepartures, setLoadingDepartures] = useState(false);

  // Modal 2: Tour Operations (attendance + itinerary) for a selected departure
  const [isOpsModalOpen, setIsOpsModalOpen] = useState(false);
  const [executionData, setExecutionData] = useState<TourExecutionData | null>(null);
  const [loadingExecution, setLoadingExecution] = useState(false);
  const [selectedDepartureDate, setSelectedDepartureDate] = useState<string>("");

  // Operations UI state
  const [activeTab, setActiveTab] = useState<"attendance" | "itinerary">("attendance");
  const [selectedDayNumber, setSelectedDayNumber] = useState<number>(1);
  const [travelerSearch, setTravelerSearch] = useState("");
  const [attendanceFilter, setAttendanceFilter] = useState<"all" | "present" | "absent" | "pending" | "late">("all");
  const [savingAttendanceId, setSavingAttendanceId] = useState<string | null>(null);
  const [savingActivityId, setSavingActivityId] = useState<string | null>(null);
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);

  // ─── Fetch assigned tours ────────────────────────────────────────────────
  useEffect(() => {
    fetchAssignedTours();
  }, []);

  const fetchAssignedTours = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${api.baseURL}${api.endpoints.tours.getMyAssigned}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setTours(data.data.tours || []);
      }
    } catch (error) {
      console.error("Error fetching assigned tours:", error);
    } finally {
      setLoading(false);
    }
  };

  // ─── Tour click → open departures modal ──────────────────────────────────
  const handleTourClick = async (tour: Tour) => {
    setSelectedTour(tour);
    setIsDatesModalOpen(true);
    setLoadingDepartures(true);
    setDepartureDates([]);

    try {
      const token = localStorage.getItem("token");
      const url = `${api.baseURL}${api.endpoints.tourExecution.getByTour(tour._id)}`;
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const resJson = await response.json();
        const payload: TourExecutionData = resJson.data;
        setDepartureDates(payload.availableDepartureDates || []);
      }
    } catch (error) {
      console.error("Error fetching departures:", error);
    } finally {
      setLoadingDepartures(false);
    }
  };

  // ─── Departure click → open ops modal ────────────────────────────────────
  const handleOpenOperations = async (depDate: string) => {
    if (!selectedTour) return;
    setSelectedDepartureDate(depDate);
    setIsOpsModalOpen(true);
    setLoadingExecution(true);
    setExecutionData(null);
    setActiveTab("attendance");
    setTravelerSearch("");
    setAttendanceFilter("all");

    try {
      const token = localStorage.getItem("token");
      const url = `${api.baseURL}${api.endpoints.tourExecution.getByTour(selectedTour._id, depDate)}`;
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const resJson = await response.json();
        const payload: TourExecutionData = resJson.data;
        setExecutionData(payload);
        if (payload.execution?.currentDay) {
          setSelectedDayNumber(payload.execution.currentDay);
        } else {
          setSelectedDayNumber(1);
        }
      }
    } catch (error) {
      console.error("Error fetching tour execution:", error);
    } finally {
      setLoadingExecution(false);
    }
  };

  // ─── Attendance handler ──────────────────────────────────────────────────
  const showNotification = (msg: string) => {
    setActionSuccessMessage(msg);
    setTimeout(() => setActionSuccessMessage(null), 3000);
  };

  const handleUpdateTravelerStatus = async (
    travelerId: string,
    newStatus: "pending" | "present" | "absent" | "late"
  ) => {
    if (!executionData || !selectedTour) return;
    setSavingAttendanceId(travelerId);

    const previousAttendance = [...executionData.execution.attendance];
    const updatedAttendance = executionData.execution.attendance.map((t) => {
      if (t.travelerId === travelerId) {
        return {
          ...t,
          status: newStatus,
          checkInTime: newStatus === "present" ? new Date().toISOString() : t.checkInTime,
        };
      }
      return t;
    });

    setExecutionData({
      ...executionData,
      execution: { ...executionData.execution, attendance: updatedAttendance },
      stats: {
        ...executionData.stats,
        presentCount: updatedAttendance.filter((a) => a.status === "present").length,
        absentCount: updatedAttendance.filter((a) => a.status === "absent").length,
        pendingCount: updatedAttendance.filter((a) => a.status === "pending").length,
        lateCount: updatedAttendance.filter((a) => a.status === "late").length,
      },
    });

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `${api.baseURL}${api.endpoints.tourExecution.updateAttendance(selectedTour._id)}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            departureDate: executionData.departureDate,
            travelerId,
            status: newStatus,
          }),
        }
      );

      if (!res.ok) {
        setExecutionData({
          ...executionData,
          execution: { ...executionData.execution, attendance: previousAttendance },
        });
      } else {
        showNotification(`Attendance updated: ${newStatus.toUpperCase()}`);
      }
    } catch (err) {
      console.error("Error updating attendance:", err);
      setExecutionData({
        ...executionData,
        execution: { ...executionData.execution, attendance: previousAttendance },
      });
    } finally {
      setSavingAttendanceId(null);
    }
  };

  const handleBulkAttendance = async (markAll: "present" | "pending") => {
    if (!executionData || !selectedTour) return;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `${api.baseURL}${api.endpoints.tourExecution.updateAttendance(selectedTour._id)}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            departureDate: executionData.departureDate,
            markAll,
          }),
        }
      );

      if (res.ok) {
        const now = new Date().toISOString();
        const updated = executionData.execution.attendance.map((t) => ({
          ...t,
          status: markAll,
          checkInTime: markAll === "present" ? now : undefined,
        }));

        setExecutionData({
          ...executionData,
          execution: { ...executionData.execution, attendance: updated },
          stats: {
            ...executionData.stats,
            presentCount: markAll === "present" ? updated.length : 0,
            pendingCount: markAll === "pending" ? updated.length : 0,
            absentCount: 0,
            lateCount: 0,
          },
        });
        showNotification(
          markAll === "present"
            ? "All travelers marked as Present!"
            : "Attendance reset to Pending"
        );
      }
    } catch (err) {
      console.error("Error bulk updating attendance:", err);
    }
  };

  // ─── Activity handler ────────────────────────────────────────────────────
  const handleUpdateActivityStatus = async (
    dayNumber: number,
    activityId: string,
    newStatus: "upcoming" | "in_progress" | "completed" | "skipped" | "delayed"
  ) => {
    if (!executionData || !selectedTour) return;
    setSavingActivityId(activityId);

    const prevDailyProgress = JSON.parse(JSON.stringify(executionData.execution.dailyProgress));
    const now = new Date().toISOString();

    const updatedDailyProgress = executionData.execution.dailyProgress.map((day) => {
      if (day.dayNumber === dayNumber) {
        const updatedActivities = day.activities.map((act) => {
          if (act.activityId === activityId) {
            return {
              ...act,
              status: newStatus,
              startedAt: newStatus === "in_progress" ? now : act.startedAt,
              completedAt: newStatus === "completed" ? now : act.completedAt,
            };
          }
          return act;
        });

        const allDone = updatedActivities.every(
          (a) => a.status === "completed" || a.status === "skipped"
        );

        return {
          ...day,
          activities: updatedActivities,
          status: (allDone ? "completed" : newStatus === "in_progress" ? "in_progress" : day.status) as any,
        };
      }
      return day;
    });

    let totalActs = 0;
    let completedActs = 0;
    let inProgressActs = 0;
    updatedDailyProgress.forEach((d) => {
      d.activities.forEach((a) => {
        totalActs++;
        if (a.status === "completed") completedActs++;
        if (a.status === "in_progress") inProgressActs++;
      });
    });

    setExecutionData({
      ...executionData,
      execution: {
        ...executionData.execution,
        dailyProgress: updatedDailyProgress,
      },
      stats: {
        ...executionData.stats,
        totalActivities: totalActs,
        completedActivities: completedActs,
        inProgressActivities: inProgressActs,
      },
    });

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `${api.baseURL}${api.endpoints.tourExecution.updateActivity(selectedTour._id)}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            departureDate: executionData.departureDate,
            dayNumber,
            activityId,
            status: newStatus,
          }),
        }
      );

      if (!res.ok) {
        setExecutionData({
          ...executionData,
          execution: { ...executionData.execution, dailyProgress: prevDailyProgress },
        });
      } else {
        showNotification(`Activity marked as ${newStatus.replace("_", " ").toUpperCase()}`);
      }
    } catch (err) {
      console.error("Error updating activity status:", err);
      setExecutionData({
        ...executionData,
        execution: { ...executionData.execution, dailyProgress: prevDailyProgress },
      });
    } finally {
      setSavingActivityId(null);
    }
  };

  const handleSetCurrentDay = async (dayNumber: number) => {
    if (!executionData || !selectedTour) return;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `${api.baseURL}${api.endpoints.tourExecution.updateActivity(selectedTour._id)}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            departureDate: executionData.departureDate,
            setCurrentDay: dayNumber,
          }),
        }
      );

      if (res.ok) {
        setExecutionData({
          ...executionData,
          execution: {
            ...executionData.execution,
            currentDay: dayNumber,
          },
        });
        showNotification(`Tour progress set to Day ${dayNumber}`);
      }
    } catch (err) {
      console.error("Error updating current day:", err);
    }
  };

  // ─── Derived Data ────────────────────────────────────────────────────────
  const filteredTours = tours.filter(
    (tour) =>
      tour.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tour.country?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tour.tourCode?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredAttendance = executionData
    ? executionData.execution.attendance.filter((t) => {
        const fullName = `${t.firstName} ${t.lastName}`.toLowerCase();
        const query = travelerSearch.toLowerCase();
        const matchesSearch =
          fullName.includes(query) ||
          t.email.toLowerCase().includes(query) ||
          t.phone.toLowerCase().includes(query) ||
          (t.bookingRef && t.bookingRef.toLowerCase().includes(query));

        if (!matchesSearch) return false;
        if (attendanceFilter === "all") return true;
        return t.status === attendanceFilter;
      })
    : [];

  const currentDayProgress = executionData?.execution.dailyProgress.find(
    (dp) => dp.dayNumber === selectedDayNumber
  );
  const currentDayTourItinerary = executionData?.tour.itinerary?.find(
    (item: any) => item.day === selectedDayNumber
  );
  const liveActivity = executionData?.execution.dailyProgress
    .flatMap((dp) => dp.activities)
    .find((act) => act.status === "in_progress");

  // ─── Loading State ───────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b border-gray-200">
          <div className="px-8 py-6">
            <div className="h-7 bg-gray-200 rounded-md w-48 mb-2 animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded-md w-64 animate-pulse"></div>
          </div>
        </div>
        <div className="p-8">
          <div className="bg-white rounded-md border border-gray-200 animate-pulse">
            <div className="p-4 border-b border-gray-100">
              <div className="h-10 bg-gray-200 rounded-md w-64"></div>
            </div>
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-4 border-b border-gray-100 flex items-center gap-4">
                <div className="h-5 bg-gray-200 rounded-md w-48"></div>
                <div className="h-5 bg-gray-200 rounded-md w-24"></div>
                <div className="h-5 bg-gray-200 rounded-md w-20"></div>
                <div className="flex-1"></div>
                <div className="h-8 bg-gray-200 rounded-md w-24"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ─── Render ──────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Toast Notification */}
      {actionSuccessMessage && (
        <div className="fixed bottom-6 right-6 z-[100] bg-zinc-900 text-white px-4 py-2.5 rounded-lg shadow-xl text-xs font-medium flex items-center gap-2 border border-zinc-700 animate-in fade-in slide-in-from-bottom-2">
          <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span>{actionSuccessMessage}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-8 h-16 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-zinc-800 leading-none">
              Assigned Tours Management
            </h1>
            <p className="text-gray-500 text-xs mt-1 leading-none">
              Tours assigned to you as Adventure Leader ({tours.length} total)
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-8">
        {/* Search */}
        <div className="mb-6 flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <input
              type="text"
              placeholder="Search tours by name, country, or code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-zinc-500/20 focus:border-zinc-500 transition shadow-xs"
            />
            <svg
              className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
        </div>

        {/* Tours List */}
        {filteredTours.length === 0 ? (
          <div className="bg-white rounded-md border border-gray-200 p-12 text-center shadow-xs">
            <svg
              className="w-16 h-16 text-gray-300 mx-auto mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
              />
            </svg>
            <h3 className="text-lg font-semibold text-zinc-800 mb-2">
              {searchQuery ? "No tours found" : "No tours assigned to you yet"}
            </h3>
            <p className="text-gray-500 mb-2 text-xs">
              {searchQuery
                ? "Try adjusting your search query"
                : "Your assigned tours from the administration team will appear here."}
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-md border border-gray-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                      Tour Name
                    </th>
                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                      Country
                    </th>
                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                      Duration
                    </th>
                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3.5 text-right text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {filteredTours.map((tour) => (
                    <tr key={tour._id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-zinc-50 border border-gray-200 rounded-md flex items-center justify-center flex-shrink-0">
                            <span className="text-base">🧭</span>
                          </div>
                          <div>
                            <button
                              type="button"
                              onClick={() => handleTourClick(tour)}
                              className="text-sm font-semibold text-zinc-900 hover:text-zinc-700 hover:underline transition-colors flex items-center gap-1.5 bg-transparent border-none cursor-pointer p-0 text-left"
                            >
                              <span>{tour.name}</span>
                              {tour.tourCode && (
                                <span className="text-[10px] font-mono px-1.5 py-0.5 bg-zinc-100 text-zinc-600 rounded">
                                  {tour.tourCode}
                                </span>
                              )}
                            </button>
                            <p className="text-xs text-gray-500 truncate max-w-xs">
                              {tour.summary}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-zinc-800">
                          {tour.country?.name || "N/A"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-zinc-800">
                          {tour.duration?.days ? `${tour.duration.days} Days` : "N/A"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 text-xs font-medium border rounded-md ${
                            tour.isActive
                              ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                              : "bg-zinc-100 text-zinc-600 border-zinc-200"
                          }`}
                        >
                          {tour.isActive ? "Active Tour" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => handleTourClick(tour)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-zinc-900 hover:bg-zinc-800 text-white rounded-md transition shadow-xs cursor-pointer border-none"
                            title="View Departures, Roll Call & Activities"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span>View Departures</span>
                          </button>
                          <Link
                            href={`/trips/${tour.slug}/${tour.tourCode}`}
                            target="_blank"
                            className="p-1.5 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 rounded-md transition-colors"
                            title="View Public Tour Page"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          MODAL 1: DEPARTURES LIST (same pattern as admin/bookings)
          ═══════════════════════════════════════════════════════════════════════ */}
      {isDatesModalOpen && selectedTour && (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-zinc-900/50 backdrop-blur-sm" onClick={() => setIsDatesModalOpen(false)}></div>
          <div className="relative bg-white rounded-md border border-gray-250 w-full max-w-5xl max-h-[90vh] overflow-hidden shadow-lg flex flex-col animate-in fade-in zoom-in duration-200">
            {/* Header */}
            <div className="px-8 py-6 border-b border-gray-200 flex justify-between items-center bg-gray-50/50">
              <div>
                <h2 className="text-xl font-bold text-zinc-800 truncate max-w-xl">{selectedTour.name}</h2>
                <p className="text-gray-500 text-xs mt-1">Select a departure date to manage attendance &amp; activities</p>
              </div>
              <button onClick={() => setIsDatesModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-md transition-colors cursor-pointer border-none">
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Table */}
            <div className="flex-1 overflow-y-auto">
              {loadingDepartures ? (
                <div className="h-64 flex flex-col items-center justify-center">
                  <div className="w-8 h-8 border-4 border-zinc-300 border-t-zinc-900 rounded-full animate-spin"></div>
                  <p className="mt-4 text-xs font-semibold text-zinc-500 animate-pulse">Loading departure dates...</p>
                </div>
              ) : departureDates.length === 0 ? (
                <div className="p-12 text-center">
                  <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="text-sm font-semibold text-zinc-700 mb-1">No departure dates assigned</p>
                  <p className="text-xs text-gray-500">There are no active departure dates scheduled for this tour.</p>
                </div>
              ) : (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="sticky top-0 z-10 bg-white">
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Departure Date</th>
                      <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Travelers</th>
                      <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Spots Left</th>
                      <th className="px-6 py-3.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {departureDates
                      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                      .map((dep) => {
                        const dateStatus = getDateStatus(dep.date, dep.endDate);
                        const travelersCount = dep.travelersCount || 0;
                        const spotsLeft = Math.max(0, (dep.availableSpots || 12) - travelersCount);

                        return (
                          <tr key={dep.date} className="hover:bg-gray-50/50 transition-colors">
                            <td className="px-6 py-4">
                              <div className="flex flex-col">
                                <span className="text-sm font-semibold text-zinc-800">
                                  {formatDisplayDate(dep.date)}
                                </span>
                                {dep.endDate && (
                                  <span className="text-xs text-gray-500 mt-0.5">
                                    Ends: {formatDisplayDate(dep.endDate)}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 py-0.5 text-[11px] font-semibold rounded-md border ${dateStatus.color}`}>
                                {dateStatus.label}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-1.5">
                                <svg className="w-4 h-4 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                </svg>
                                <span className={`text-sm font-semibold ${travelersCount > 0 ? "text-zinc-900" : "text-gray-400"}`}>
                                  {travelersCount} {travelersCount === 1 ? "Traveler" : "Travelers"}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="text-sm text-zinc-700 font-medium">{spotsLeft} remaining</span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <button
                                type="button"
                                onClick={() => handleOpenOperations(dep.date)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md bg-zinc-900 border border-zinc-900 text-white hover:bg-zinc-800 transition shadow-sm cursor-pointer"
                              >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                                </svg>
                                <span>Manage Departure</span>
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          MODAL 2: TOUR OPERATIONS — ATTENDANCE & ITINERARY
          ═══════════════════════════════════════════════════════════════════════ */}
      {isOpsModalOpen && selectedTour && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-zinc-900/50 backdrop-blur-sm" onClick={() => setIsOpsModalOpen(false)}></div>
          <div className="relative bg-white rounded-md border border-gray-200 w-full max-w-6xl max-h-[92vh] overflow-hidden shadow-xl flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-200">
            {/* Ops Modal Header */}
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50/50 flex items-start justify-between gap-4 shrink-0">
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1.5">
                  <button
                    type="button"
                    onClick={() => setIsOpsModalOpen(false)}
                    className="text-xs text-zinc-600 hover:text-zinc-900 flex items-center gap-1 font-semibold transition-colors bg-zinc-100 hover:bg-zinc-200 px-2 py-1 rounded-md cursor-pointer border-none"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    <span>Back to Dates</span>
                  </button>
                  <span className="text-gray-300">|</span>
                  <span className="text-xs text-purple-700 font-semibold bg-purple-50 px-2 py-0.5 rounded border border-purple-100">
                    {formatDisplayDate(selectedDepartureDate)}
                  </span>
                </div>
                <h2 className="text-lg font-bold text-zinc-900 truncate">{selectedTour.name}</h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Roll call, check-in, and daily activity tracking for this departure
                </p>
              </div>
              <button onClick={() => setIsOpsModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-md transition-colors cursor-pointer border-none shrink-0 mt-1">
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Live activity banner */}
            {executionData && liveActivity && (
              <div className="bg-amber-50 border-b border-amber-200 px-6 py-2 flex items-center justify-between text-xs text-amber-900 shrink-0">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
                  </span>
                  <span className="font-semibold uppercase tracking-wider text-[11px] text-amber-800">Live Now:</span>
                  <span className="font-bold text-zinc-900">{liveActivity.title}</span>
                  {liveActivity.location && <span className="text-amber-700">({liveActivity.location})</span>}
                </div>
                <button onClick={() => setActiveTab("itinerary")} className="text-[11px] font-semibold text-amber-900 hover:underline cursor-pointer bg-transparent border-none">
                  View Schedule &rarr;
                </button>
              </div>
            )}

            {/* Tabs */}
            {executionData && (
              <div className="px-6 flex gap-6 border-b border-gray-100 shrink-0">
                <button
                  onClick={() => setActiveTab("attendance")}
                  className={`py-3 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 bg-transparent cursor-pointer ${
                    activeTab === "attendance"
                      ? "border-zinc-900 text-zinc-900"
                      : "border-transparent text-gray-500 hover:text-zinc-700"
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <span>Travelers &amp; Roll Call ({executionData.stats.totalTravelers})</span>
                </button>
                <button
                  onClick={() => setActiveTab("itinerary")}
                  className={`py-3 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 bg-transparent cursor-pointer ${
                    activeTab === "itinerary"
                      ? "border-zinc-900 text-zinc-900"
                      : "border-transparent text-gray-500 hover:text-zinc-700"
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                  <span>Daily Itinerary ({executionData.stats.completedActivities}/{executionData.stats.totalActivities})</span>
                </button>
              </div>
            )}

            {/* Modal Body Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {loadingExecution ? (
                <div className="h-64 flex flex-col items-center justify-center">
                  <div className="w-8 h-8 border-4 border-zinc-300 border-t-zinc-900 rounded-full animate-spin"></div>
                  <p className="mt-4 text-xs font-semibold text-zinc-500 animate-pulse">Loading tour operations...</p>
                </div>
              ) : !executionData ? (
                <div className="p-12 text-center">
                  <p className="text-sm font-semibold text-zinc-700">Failed to load tour execution data.</p>
                  <p className="text-xs text-gray-500 mt-1">Please try again or contact administration.</p>
                </div>
              ) : (
                <>
                  {/* KPI Stats Strip */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                    <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-2xs">
                      <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block">Total</span>
                      <span className="text-lg font-bold text-zinc-900 mt-0.5 block">{executionData.stats.totalTravelers}</span>
                    </div>
                    <div className="bg-emerald-50/30 p-3 rounded-lg border border-emerald-200 shadow-2xs">
                      <span className="text-[10px] font-semibold text-emerald-700 uppercase tracking-wider block">Present</span>
                      <span className="text-lg font-bold text-emerald-700 mt-0.5 block">{executionData.stats.presentCount}</span>
                    </div>
                    <div className="bg-amber-50/30 p-3 rounded-lg border border-amber-200 shadow-2xs">
                      <span className="text-[10px] font-semibold text-amber-700 uppercase tracking-wider block">Pending</span>
                      <span className="text-lg font-bold text-amber-800 mt-0.5 block">{executionData.stats.pendingCount}</span>
                    </div>
                    <div className="bg-red-50/30 p-3 rounded-lg border border-red-200 shadow-2xs">
                      <span className="text-[10px] font-semibold text-red-600 uppercase tracking-wider block">Absent</span>
                      <span className="text-lg font-bold text-red-700 mt-0.5 block">{executionData.stats.absentCount}</span>
                    </div>
                    <div className="bg-purple-50/30 p-3 rounded-lg border border-purple-200 shadow-2xs">
                      <span className="text-[10px] font-semibold text-purple-700 uppercase tracking-wider block">Current Day</span>
                      <span className="text-lg font-bold text-purple-900 mt-0.5 block">Day {executionData.execution.currentDay || 1}</span>
                    </div>
                    <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-2xs">
                      <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block">Activities</span>
                      <span className="text-lg font-bold text-zinc-900 mt-0.5 block">{executionData.stats.completedActivities}/{executionData.stats.totalActivities}</span>
                    </div>
                  </div>

                  {/* ══════ TAB: ATTENDANCE ══════ */}
                  {activeTab === "attendance" && (
                    <div className="space-y-4">
                      {/* Control bar */}
                      <div className="bg-white p-3.5 rounded-lg border border-gray-200 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
                        <div className="relative flex-1 max-w-sm">
                          <input
                            type="text"
                            placeholder="Search traveler by name, email, or ref..."
                            value={travelerSearch}
                            onChange={(e) => setTravelerSearch(e.target.value)}
                            className="w-full pl-9 pr-3 py-1.5 bg-gray-50 border border-gray-300 rounded-md text-xs focus:ring-1 focus:ring-zinc-900 focus:bg-white focus:outline-none"
                          />
                          <svg className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                          </svg>
                        </div>

                        <div className="flex items-center gap-1.5 overflow-x-auto">
                          {(["all", "present", "pending", "absent", "late"] as const).map((filterVal) => (
                            <button
                              key={filterVal}
                              onClick={() => setAttendanceFilter(filterVal)}
                              className={`px-3 py-1 text-xs font-semibold rounded-md capitalize transition-colors cursor-pointer border-none ${
                                attendanceFilter === filterVal
                                  ? "bg-zinc-900 text-white"
                                  : "bg-gray-100 text-zinc-600 hover:bg-gray-200"
                              }`}
                            >
                              {filterVal}
                            </button>
                          ))}
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleBulkAttendance("present")}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-md shadow-xs transition flex items-center gap-1.5 cursor-pointer border-none"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <span>Mark All Present</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleBulkAttendance("pending")}
                            className="px-2.5 py-1.5 border border-gray-300 text-zinc-600 hover:bg-gray-100 text-xs font-medium rounded-md transition cursor-pointer bg-white"
                          >
                            Reset
                          </button>
                        </div>
                      </div>

                      {/* Travelers Table */}
                      {filteredAttendance.length === 0 ? (
                        <div className="bg-white rounded-lg border border-gray-200 p-10 text-center">
                          <svg className="w-10 h-10 text-gray-300 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                          <p className="text-sm font-semibold text-zinc-700">
                            {travelerSearch ? "No travelers match your search" : "No travelers registered for this departure"}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            Bookings for {formatDisplayDate(selectedDepartureDate)} will appear here automatically.
                          </p>
                        </div>
                      ) : (
                        <div className="bg-white rounded-lg border border-gray-200 shadow-xs overflow-hidden">
                          <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200 text-xs">
                              <thead className="bg-gray-50/80 text-zinc-500 uppercase font-semibold text-[11px]">
                                <tr>
                                  <th className="px-5 py-3 text-left">Traveler Name</th>
                                  <th className="px-5 py-3 text-left">Contact &amp; Ref</th>
                                  <th className="px-5 py-3 text-left">Preferences</th>
                                  <th className="px-5 py-3 text-center">Roll Call Status</th>
                                  <th className="px-5 py-3 text-right">Check-in Time</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-100 bg-white">
                                {filteredAttendance.map((traveler) => {
                                  const isSaving = savingAttendanceId === traveler.travelerId;
                                  return (
                                    <tr key={traveler.travelerId} className="hover:bg-gray-50/50 transition-colors">
                                      <td className="px-5 py-3.5">
                                        <div className="flex items-center gap-2.5">
                                          <div className="w-8 h-8 rounded-full bg-zinc-100 border border-zinc-200 flex items-center justify-center font-bold text-zinc-700 text-xs shrink-0">
                                            {traveler.firstName[0]?.toUpperCase() || "T"}
                                          </div>
                                          <div>
                                            <span className="font-semibold text-zinc-900 block text-sm">
                                              {traveler.firstName} {traveler.lastName}
                                            </span>
                                            {traveler.emergencyContact?.name && (
                                              <span className="text-[11px] text-gray-400 block">
                                                Emergency: {traveler.emergencyContact.name} ({traveler.emergencyContact.phone || "No phone"})
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                      </td>
                                      <td className="px-5 py-3.5">
                                        <div>
                                          {traveler.email && <p className="text-zinc-800 font-medium">{traveler.email}</p>}
                                          {traveler.phone && <p className="text-gray-500 text-[11px]">{traveler.phone}</p>}
                                          {traveler.bookingRef && (
                                            <span className="inline-block mt-0.5 font-mono text-[10px] bg-zinc-100 px-1 py-0.2 rounded text-zinc-600">
                                              REF: {traveler.bookingRef}
                                            </span>
                                          )}
                                        </div>
                                      </td>
                                      <td className="px-5 py-3.5">
                                        <div className="space-y-0.5">
                                          {traveler.roomPreference && (
                                            <p className="text-zinc-700">
                                              <span className="text-gray-400">Room:</span> {traveler.roomPreference}
                                            </p>
                                          )}
                                          {traveler.dietary && traveler.dietary.length > 0 && (
                                            <p className="text-purple-700">
                                              <span className="text-gray-400">Diet:</span> {traveler.dietary.join(", ")}
                                            </p>
                                          )}
                                        </div>
                                      </td>
                                      <td className="px-5 py-3.5 text-center">
                                        <div className="inline-flex items-center rounded-lg border border-gray-200 p-0.5 bg-gray-50 gap-0.5">
                                          <button
                                            type="button"
                                            disabled={isSaving}
                                            onClick={() => handleUpdateTravelerStatus(traveler.travelerId, "present")}
                                            className={`px-2.5 py-1 rounded text-xs font-semibold transition cursor-pointer border-none ${
                                              traveler.status === "present"
                                                ? "bg-emerald-600 text-white shadow-2xs"
                                                : "text-zinc-600 hover:text-emerald-700 hover:bg-white bg-transparent"
                                            }`}
                                          >
                                            Present
                                          </button>
                                          <button
                                            type="button"
                                            disabled={isSaving}
                                            onClick={() => handleUpdateTravelerStatus(traveler.travelerId, "late")}
                                            className={`px-2 py-1 rounded text-xs font-semibold transition cursor-pointer border-none ${
                                              traveler.status === "late"
                                                ? "bg-amber-500 text-white shadow-2xs"
                                                : "text-zinc-600 hover:text-amber-700 hover:bg-white bg-transparent"
                                            }`}
                                          >
                                            Late
                                          </button>
                                          <button
                                            type="button"
                                            disabled={isSaving}
                                            onClick={() => handleUpdateTravelerStatus(traveler.travelerId, "absent")}
                                            className={`px-2 py-1 rounded text-xs font-semibold transition cursor-pointer border-none ${
                                              traveler.status === "absent"
                                                ? "bg-red-600 text-white shadow-2xs"
                                                : "text-zinc-600 hover:text-red-700 hover:bg-white bg-transparent"
                                            }`}
                                          >
                                            Absent
                                          </button>
                                          <button
                                            type="button"
                                            disabled={isSaving}
                                            onClick={() => handleUpdateTravelerStatus(traveler.travelerId, "pending")}
                                            className={`px-2 py-1 rounded text-xs font-semibold transition cursor-pointer border-none ${
                                              traveler.status === "pending"
                                                ? "bg-zinc-800 text-white shadow-2xs"
                                                : "text-zinc-400 hover:text-zinc-700 hover:bg-white bg-transparent"
                                            }`}
                                          >
                                            Reset
                                          </button>
                                        </div>
                                      </td>
                                      <td className="px-5 py-3.5 text-right">
                                        {traveler.checkInTime ? (
                                          <span className="text-[11px] text-zinc-700 font-mono">
                                            {new Date(traveler.checkInTime).toLocaleTimeString([], {
                                              hour: "2-digit",
                                              minute: "2-digit",
                                            })}
                                          </span>
                                        ) : (
                                          <span className="text-[11px] text-gray-400 italic">Not checked in</span>
                                        )}
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* ══════ TAB: ITINERARY ══════ */}
                  {activeTab === "itinerary" && (
                    <div className="space-y-5">
                      {/* Day selector + set current day */}
                      <div className="bg-white p-3.5 rounded-lg border border-gray-200 shadow-xs flex items-center justify-between gap-4 overflow-x-auto">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Day:</span>
                          {executionData.execution.dailyProgress.map((dp) => {
                            const isCurrent = executionData.execution.currentDay === dp.dayNumber;
                            const isSelected = selectedDayNumber === dp.dayNumber;
                            return (
                              <button
                                key={dp.dayNumber}
                                type="button"
                                onClick={() => setSelectedDayNumber(dp.dayNumber)}
                                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all relative flex items-center gap-1.5 cursor-pointer border-none ${
                                  isSelected
                                    ? "bg-zinc-900 text-white shadow-xs"
                                    : "bg-gray-100 text-zinc-700 hover:bg-gray-200"
                                }`}
                              >
                                <span>Day {dp.dayNumber}</span>
                                {isCurrent && (
                                  <span className="w-2 h-2 rounded-full bg-emerald-400" title="Active Current Day"></span>
                                )}
                              </button>
                            );
                          })}
                        </div>

                        <button
                          type="button"
                          onClick={() => handleSetCurrentDay(selectedDayNumber)}
                          className={`px-3 py-1.5 rounded-md text-xs font-semibold transition flex items-center gap-1.5 shrink-0 cursor-pointer border ${
                            executionData.execution.currentDay === selectedDayNumber
                              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                              : "bg-zinc-100 hover:bg-zinc-200 text-zinc-800 border-zinc-300"
                          }`}
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span>
                            {executionData.execution.currentDay === selectedDayNumber
                              ? `Active: Day ${selectedDayNumber}`
                              : `Set Day ${selectedDayNumber} as Live`}
                          </span>
                        </button>
                      </div>

                      {/* Day content card */}
                      <div className="bg-white rounded-lg border border-gray-200 shadow-xs p-5 space-y-5">
                        {/* Day overview header */}
                        <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-gray-100 pb-3.5 gap-2">
                          <div>
                            <span className="text-xs font-bold text-purple-700 tracking-wider uppercase">
                              Day {selectedDayNumber} Itinerary
                            </span>
                            <h3 className="text-base font-bold text-zinc-900">
                              {currentDayTourItinerary?.title || `Day ${selectedDayNumber} Program`}
                            </h3>
                            {currentDayTourItinerary?.description && (
                              <p className="text-xs text-gray-500 mt-1 max-w-3xl line-clamp-2">
                                {currentDayTourItinerary.description}
                              </p>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            {currentDayTourItinerary?.accommodations?.[0]?.name && (
                              <span className="px-2.5 py-1 bg-zinc-100 text-zinc-700 text-xs font-medium rounded-md">
                                Hotel: {currentDayTourItinerary.accommodations[0].name}
                              </span>
                            )}
                            {currentDayTourItinerary?.meals && (
                              <span className="px-2.5 py-1 bg-zinc-100 text-zinc-700 text-xs font-medium rounded-md">
                                Meals:{" "}
                                {typeof currentDayTourItinerary.meals === "object"
                                  ? [
                                      currentDayTourItinerary.meals.breakfast ? "B" : "",
                                      currentDayTourItinerary.meals.lunch ? "L" : "",
                                      currentDayTourItinerary.meals.dinner ? "D" : "",
                                    ]
                                      .filter(Boolean)
                                      .join(", ") || "None"
                                  : currentDayTourItinerary.meals}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Activities list */}
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-bold text-zinc-800">
                              Scheduled Activities ({currentDayProgress?.activities?.length || 0})
                            </h4>
                            <span className="text-xs text-gray-400">
                              Update live status as the group progresses
                            </span>
                          </div>

                          {(!currentDayProgress?.activities || currentDayProgress.activities.length === 0) ? (
                            <div className="p-6 text-center text-xs text-gray-500 bg-gray-50 rounded-lg">
                              No individual activities mapped for Day {selectedDayNumber}.
                            </div>
                          ) : (
                            <div className="space-y-2.5">
                              {currentDayProgress.activities.map((activity, idx) => {
                                const isSaving = savingActivityId === activity.activityId;
                                const isLive = activity.status === "in_progress";
                                const isDone = activity.status === "completed";

                                return (
                                  <div
                                    key={activity.activityId}
                                    className={`p-3.5 rounded-lg border transition-all ${
                                      isLive
                                        ? "bg-amber-50/50 border-amber-300 ring-2 ring-amber-400/20"
                                        : isDone
                                        ? "bg-emerald-50/20 border-emerald-200"
                                        : "bg-white border-gray-200 hover:border-gray-300"
                                    }`}
                                  >
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                                      <div className="flex items-start gap-3">
                                        <div
                                          className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 ${
                                            isDone
                                              ? "bg-emerald-600 text-white"
                                              : isLive
                                              ? "bg-amber-500 text-white animate-pulse"
                                              : "bg-zinc-100 text-zinc-600"
                                          }`}
                                        >
                                          {isDone ? (
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                            </svg>
                                          ) : (
                                            idx + 1
                                          )}
                                        </div>
                                        <div>
                                          <div className="flex items-center gap-2">
                                            <h5 className="text-sm font-semibold text-zinc-900">{activity.title}</h5>
                                            {isLive && (
                                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-200 text-amber-900">
                                                Happening Now
                                              </span>
                                            )}
                                            {isDone && (
                                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800">
                                                Done
                                              </span>
                                            )}
                                          </div>
                                          <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 mt-1">
                                            {activity.duration && <span>Duration: {activity.duration}</span>}
                                            {activity.location && <span>Location: {activity.location}</span>}
                                            {activity.startedAt && (
                                              <span>
                                                Started: {new Date(activity.startedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                              </span>
                                            )}
                                            {activity.completedAt && (
                                              <span>
                                                Completed: {new Date(activity.completedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                      </div>

                                      <div className="flex items-center gap-2 shrink-0">
                                        <select
                                          value={activity.status}
                                          disabled={isSaving}
                                          onChange={(e) =>
                                            handleUpdateActivityStatus(
                                              selectedDayNumber,
                                              activity.activityId,
                                              e.target.value as any
                                            )
                                          }
                                          className={`px-3 py-1.5 rounded-md text-xs font-semibold border shadow-2xs focus:outline-none ${
                                            isLive
                                              ? "bg-amber-100 text-amber-900 border-amber-300 font-bold"
                                              : isDone
                                              ? "bg-emerald-100 text-emerald-900 border-emerald-300 font-bold"
                                              : "bg-white text-zinc-700 border-gray-300"
                                          }`}
                                        >
                                          <option value="upcoming">Upcoming</option>
                                          <option value="in_progress">In Progress</option>
                                          <option value="completed">Completed</option>
                                          <option value="delayed">Delayed</option>
                                          <option value="skipped">Skipped</option>
                                        </select>

                                        {activity.status === "upcoming" && (
                                          <button
                                            type="button"
                                            disabled={isSaving}
                                            onClick={() =>
                                              handleUpdateActivityStatus(selectedDayNumber, activity.activityId, "in_progress")
                                            }
                                            className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-md text-xs font-semibold shadow-xs transition cursor-pointer border-none"
                                          >
                                            Start Now
                                          </button>
                                        )}

                                        {activity.status === "in_progress" && (
                                          <button
                                            type="button"
                                            disabled={isSaving}
                                            onClick={() =>
                                              handleUpdateActivityStatus(selectedDayNumber, activity.activityId, "completed")
                                            }
                                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-xs font-semibold shadow-xs transition cursor-pointer border-none"
                                          >
                                            Complete
                                          </button>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
