"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";

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

interface DepartureDateItem {
  date: string;
  endDate?: string;
  availableSpots?: number;
  travelersCount?: number;
  bookingsCount?: number;
  discount?: string;
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

export default function LeaderTourOperationsPage() {
  const params = useParams();
  const tourId = params?.id as string;

  const [data, setData] = useState<TourExecutionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDepartureDate, setSelectedDepartureDate] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"attendance" | "itinerary">("attendance");
  const [selectedDayNumber, setSelectedDayNumber] = useState<number>(1);
  const [travelerSearch, setTravelerSearch] = useState("");
  const [attendanceFilter, setAttendanceFilter] = useState<"all" | "present" | "absent" | "pending" | "late">("all");
  const [savingAttendanceId, setSavingAttendanceId] = useState<string | null>(null);
  const [savingActivityId, setSavingActivityId] = useState<string | null>(null);
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);

  // Initialize selected date from URL query parameter if present
  useEffect(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const dateFromUrl = urlParams.get("date");
      if (dateFromUrl) {
        setSelectedDepartureDate(dateFromUrl);
      }
    }
  }, []);

  useEffect(() => {
    if (tourId) {
      fetchTourExecution(selectedDepartureDate);
    }
  }, [tourId, selectedDepartureDate]);

  const showNotification = (msg: string) => {
    setActionSuccessMessage(msg);
    setTimeout(() => {
      setActionSuccessMessage(null);
    }, 3000);
  };

  const fetchTourExecution = async (depDate?: string) => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const url = `${api.baseURL}${api.endpoints.tourExecution.getByTour(tourId, depDate)}`;
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const resJson = await response.json();
        const payload: TourExecutionData = resJson.data;
        setData(payload);
        if (payload.execution?.currentDay) {
          setSelectedDayNumber(payload.execution.currentDay);
        }
      } else {
        console.error("Failed to load tour execution data");
      }
    } catch (err) {
      console.error("Error fetching tour execution:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectDate = (dateStr: string) => {
    setSelectedDepartureDate(dateStr);
    if (typeof window !== "undefined") {
      const newUrl = dateStr
        ? `/leader/admin/tours/${tourId}?date=${dateStr}`
        : `/leader/admin/tours/${tourId}`;
      window.history.replaceState(null, "", newUrl);
    }
  };

  // Update attendance for a single traveler
  const handleUpdateTravelerStatus = async (
    travelerId: string,
    newStatus: "pending" | "present" | "absent" | "late"
  ) => {
    if (!data) return;
    setSavingAttendanceId(travelerId);

    // Optimistic state update
    const previousAttendance = [...data.execution.attendance];
    const updatedAttendance = data.execution.attendance.map((t) => {
      if (t.travelerId === travelerId) {
        return {
          ...t,
          status: newStatus,
          checkInTime: newStatus === "present" ? new Date().toISOString() : t.checkInTime,
        };
      }
      return t;
    });

    setData({
      ...data,
      execution: {
        ...data.execution,
        attendance: updatedAttendance,
      },
      stats: {
        ...data.stats,
        presentCount: updatedAttendance.filter((a) => a.status === "present").length,
        absentCount: updatedAttendance.filter((a) => a.status === "absent").length,
        pendingCount: updatedAttendance.filter((a) => a.status === "pending").length,
        lateCount: updatedAttendance.filter((a) => a.status === "late").length,
      },
    });

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `${api.baseURL}${api.endpoints.tourExecution.updateAttendance(tourId)}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            departureDate: data.departureDate,
            travelerId,
            status: newStatus,
          }),
        }
      );

      if (!res.ok) {
        setData({
          ...data,
          execution: { ...data.execution, attendance: previousAttendance },
        });
      } else {
        showNotification(`Attendance updated: ${newStatus.toUpperCase()}`);
      }
    } catch (err) {
      console.error("Error updating attendance:", err);
      setData({
        ...data,
        execution: { ...data.execution, attendance: previousAttendance },
      });
    } finally {
      setSavingAttendanceId(null);
    }
  };

  // Bulk update attendance
  const handleBulkAttendance = async (markAll: "present" | "pending") => {
    if (!data) return;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `${api.baseURL}${api.endpoints.tourExecution.updateAttendance(tourId)}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            departureDate: data.departureDate,
            markAll,
          }),
        }
      );

      if (res.ok) {
        const now = new Date().toISOString();
        const updated = data.execution.attendance.map((t) => ({
          ...t,
          status: markAll,
          checkInTime: markAll === "present" ? now : undefined,
        }));

        setData({
          ...data,
          execution: { ...data.execution, attendance: updated },
          stats: {
            ...data.stats,
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

  // Update live activity status
  const handleUpdateActivityStatus = async (
    dayNumber: number,
    activityId: string,
    newStatus: "upcoming" | "in_progress" | "completed" | "skipped" | "delayed"
  ) => {
    if (!data) return;
    setSavingActivityId(activityId);

    const prevDailyProgress = JSON.parse(JSON.stringify(data.execution.dailyProgress));
    const now = new Date().toISOString();

    const updatedDailyProgress = data.execution.dailyProgress.map((day) => {
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

    // Recalculate stats
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

    setData({
      ...data,
      execution: {
        ...data.execution,
        dailyProgress: updatedDailyProgress,
      },
      stats: {
        ...data.stats,
        totalActivities: totalActs,
        completedActivities: completedActs,
        inProgressActivities: inProgressActs,
      },
    });

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `${api.baseURL}${api.endpoints.tourExecution.updateActivity(tourId)}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            departureDate: data.departureDate,
            dayNumber,
            activityId,
            status: newStatus,
          }),
        }
      );

      if (!res.ok) {
        setData({
          ...data,
          execution: { ...data.execution, dailyProgress: prevDailyProgress },
        });
      } else {
        showNotification(`Activity marked as ${newStatus.replace("_", " ").toUpperCase()}`);
      }
    } catch (err) {
      console.error("Error updating activity status:", err);
      setData({
        ...data,
        execution: { ...data.execution, dailyProgress: prevDailyProgress },
      });
    } finally {
      setSavingActivityId(null);
    }
  };

  // Set active tour current day
  const handleSetCurrentDay = async (dayNumber: number) => {
    if (!data) return;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `${api.baseURL}${api.endpoints.tourExecution.updateActivity(tourId)}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            departureDate: data.departureDate,
            setCurrentDay: dayNumber,
          }),
        }
      );

      if (res.ok) {
        setData({
          ...data,
          execution: {
            ...data.execution,
            currentDay: dayNumber,
          },
        });
        showNotification(`Tour progress set to Day ${dayNumber}`);
      }
    } catch (err) {
      console.error("Error updating current day:", err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="h-6 bg-gray-200 rounded w-48 mb-4 animate-pulse"></div>
        <div className="h-10 bg-gray-200 rounded w-96 mb-8 animate-pulse"></div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-white rounded-md border border-gray-200 animate-pulse"></div>
          ))}
        </div>
        <div className="h-96 bg-white rounded-md border border-gray-200 animate-pulse"></div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gray-50 p-8 text-center py-20">
        <h2 className="text-lg font-bold text-zinc-800 mb-2">Tour not found</h2>
        <p className="text-xs text-gray-500 mb-4">
          This tour might not exist or you are not assigned as its Adventure Leader.
        </p>
        <Link
          href="/leader/admin/tours"
          className="inline-block px-4 py-2 bg-zinc-900 text-white text-xs font-semibold rounded-md"
        >
          &larr; Back to Assigned Tours
        </Link>
      </div>
    );
  }

  const { tour, execution, stats } = data;

  // =========================================================================
  // VIEW 1: AVAILABLE DEPARTURE DATES SCREEN (Shown when no date is picked yet)
  // =========================================================================
  if (!selectedDepartureDate) {
    return (
      <div className="min-h-screen bg-gray-50 pb-16">
        {/* Page Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="px-8 py-5">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 mb-2">
              <Link
                href="/leader/admin/tours"
                className="text-xs text-gray-500 hover:text-zinc-900 flex items-center gap-1 transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span>Back to Assigned Tours</span>
              </Link>
              <span className="text-gray-300">/</span>
              <span className="text-xs text-gray-700 font-medium">Select Departure Date</span>
            </div>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-xl font-bold text-zinc-900 leading-tight">
                    {tour.name}
                  </h1>
                  {tour.tourCode && (
                    <span className="font-mono text-xs font-semibold px-2 py-0.5 bg-zinc-100 text-zinc-700 rounded border border-zinc-200">
                      {tour.tourCode}
                    </span>
                  )}
                  {tour.duration?.days && (
                    <span className="text-xs font-medium px-2 py-0.5 bg-purple-50 text-purple-700 rounded border border-purple-100">
                      {tour.duration.days} Days
                    </span>
                  )}
                  {tour.country?.name && (
                    <span className="text-xs text-gray-500 font-medium flex items-center gap-1">
                      <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      </svg>
                      {tour.country.name}
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Select a departure date batch below to view all travelers registered for that date, take attendance, and track daily activities.
                </p>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right">
                  <span className="text-xs font-bold text-zinc-900 block">
                    {data.availableDepartureDates.length} Departure Dates
                  </span>
                  <span className="text-[11px] text-gray-500">
                    {data.availableDepartureDates.reduce((acc, d) => acc + (d.travelersCount || 0), 0)} Total Travelers Booked
                  </span>
                </div>

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
            </div>
          </div>
        </div>

        {/* Departure Dates Grid Content */}
        <div className="p-8 max-w-7xl mx-auto space-y-6">
          {data.availableDepartureDates.length === 0 ? (
            <div className="bg-white rounded-lg border border-gray-200 p-12 text-center shadow-xs">
              <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <h3 className="text-base font-bold text-zinc-900 mb-1">No departure dates scheduled</h3>
              <p className="text-xs text-gray-500 max-w-sm mx-auto mb-4">
                There are currently no active departure dates scheduled for this tour in the system.
              </p>
              <button
                type="button"
                onClick={() => handleSelectDate(data.departureDate || new Date().toISOString().split("T")[0])}
                className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white rounded-md text-xs font-semibold transition"
              >
                Open Guide Roster with Today&apos;s Date
              </button>
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-bold text-zinc-800 uppercase tracking-wider">
                  Available Tour Departures ({data.availableDepartureDates.length})
                </h2>
                <span className="text-xs text-gray-400">
                  Click any date batch to open roll call &amp; activity operations
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {data.availableDepartureDates.map((dep) => {
                  const dateStatus = getDateStatus(dep.date, dep.endDate);
                  const travelersCount = dep.travelersCount || 0;

                  return (
                    <div
                      key={dep.date}
                      onClick={() => handleSelectDate(dep.date)}
                      className="bg-white rounded-xl border border-gray-200 shadow-xs hover:border-zinc-500 hover:shadow-md transition-all cursor-pointer p-5 flex flex-col justify-between group"
                    >
                      <div>
                        {/* Top Badges */}
                        <div className="flex items-center justify-between mb-3">
                          <span className={`px-2 py-0.5 text-[11px] font-semibold rounded-md border ${dateStatus.color}`}>
                            {dateStatus.label}
                          </span>
                          <span className="text-xs text-gray-400 font-mono">
                            {dep.date}
                          </span>
                        </div>

                        {/* Date Header Info */}
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-10 h-10 rounded-lg bg-zinc-100 border border-zinc-200 flex items-center justify-center text-zinc-700 shrink-0 group-hover:bg-zinc-900 group-hover:text-white transition-colors">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                          <div>
                            <h3 className="text-base font-bold text-zinc-900 group-hover:text-zinc-800">
                              {formatDisplayDate(dep.date)}
                            </h3>
                            {dep.endDate ? (
                              <p className="text-xs text-gray-500">
                                Returns: {formatDisplayDate(dep.endDate)}
                              </p>
                            ) : (
                              <p className="text-xs text-gray-500">
                                Departure Start
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Metrics Strip */}
                        <div className="bg-gray-50/80 rounded-lg p-3 border border-gray-100 flex items-center justify-between mb-4">
                          <div>
                            <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider block">
                              Travelers Booked
                            </span>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <svg className="w-4 h-4 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                              </svg>
                              <span className={`text-sm font-bold ${travelersCount > 0 ? "text-emerald-700" : "text-gray-500"}`}>
                                {travelersCount} {travelersCount === 1 ? "Traveler" : "Travelers"}
                              </span>
                            </div>
                          </div>

                          <div className="text-right">
                            <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider block">
                              Spots Left
                            </span>
                            <span className="text-sm font-bold text-zinc-700 mt-0.5 block">
                              {Math.max(0, (dep.availableSpots || 10) - travelersCount)} / {dep.availableSpots || 10}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Action Link */}
                      <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                        <span className="text-xs font-semibold text-zinc-900 group-hover:underline flex items-center gap-1">
                          <span>View Travelers &amp; Attendance</span>
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </span>
                        <span className="w-6 h-6 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-500 group-hover:bg-zinc-900 group-hover:text-white transition-colors text-xs font-bold">
                          &rarr;
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW 2: TRAVELERS & ACTIVITY OPERATIONS (For the Selected Departure Date)
  // =========================================================================
  const filteredAttendance = execution.attendance.filter((t) => {
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
  });

  const currentDayProgress = execution.dailyProgress.find(
    (dp) => dp.dayNumber === selectedDayNumber
  );
  const currentDayTourItinerary = tour.itinerary?.find(
    (item: any) => item.day === selectedDayNumber
  );

  const liveActivity = execution.dailyProgress
    .flatMap((dp) => dp.activities)
    .find((act) => act.status === "in_progress");

  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      {/* Toast Notification */}
      {actionSuccessMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-zinc-900 text-white px-4 py-2.5 rounded-lg shadow-xl text-xs font-medium flex items-center gap-2 border border-zinc-700 animate-in fade-in slide-in-from-bottom-2">
          <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span>{actionSuccessMessage}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-8 py-5">
          {/* Breadcrumb with Back to Departure Dates */}
          <div className="flex items-center gap-2 mb-2">
            <button
              type="button"
              onClick={() => handleSelectDate("")}
              className="text-xs text-zinc-700 hover:text-zinc-900 flex items-center gap-1 font-semibold transition-colors bg-zinc-100 hover:bg-zinc-200 px-2.5 py-1 rounded-md"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span>&larr; Back to Departure Dates</span>
            </button>
            <span className="text-gray-300">/</span>
            <span className="text-xs text-purple-700 font-semibold bg-purple-50 px-2 py-0.5 rounded border border-purple-100">
              Departure: {formatDisplayDate(selectedDepartureDate)}
            </span>
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-xl font-bold text-zinc-900 leading-tight">
                  {tour.name}
                </h1>
                {tour.tourCode && (
                  <span className="font-mono text-xs font-semibold px-2 py-0.5 bg-zinc-100 text-zinc-700 rounded border border-zinc-200">
                    {tour.tourCode}
                  </span>
                )}
                {tour.duration?.days && (
                  <span className="text-xs font-medium px-2 py-0.5 bg-purple-50 text-purple-700 rounded border border-purple-100">
                    {tour.duration.days} Days
                  </span>
                )}
                {tour.country?.name && (
                  <span className="text-xs text-gray-500 font-medium flex items-center gap-1">
                    <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    </svg>
                    {tour.country.name}
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Passenger roll call, start-day check-in, and live daily activity updates for departure on {formatDisplayDate(selectedDepartureDate)}
              </p>
            </div>

            {/* Quick Departure Batch Switcher */}
            <div className="flex items-center gap-3">
              <label className="text-xs font-semibold text-zinc-700 whitespace-nowrap">
                Switch Date:
              </label>
              <select
                value={selectedDepartureDate}
                onChange={(e) => handleSelectDate(e.target.value)}
                className="px-3 py-1.5 bg-white border border-gray-300 rounded-md text-xs font-semibold text-zinc-800 shadow-xs focus:ring-1 focus:ring-zinc-900 focus:outline-none"
              >
                {data.availableDepartureDates.map((d) => (
                  <option key={d.date} value={d.date}>
                    {formatDisplayDate(d.date)} ({d.travelersCount || 0} travelers)
                  </option>
                ))}
              </select>

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
          </div>
        </div>

        {/* Live Activity Alert Banner */}
        {liveActivity && (
          <div className="bg-amber-50 border-t border-amber-200 px-8 py-2.5 flex items-center justify-between text-xs text-amber-900">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
              </span>
              <span className="font-semibold uppercase tracking-wider text-[11px] text-amber-800">
                Live Activity Now:
              </span>
              <span className="font-bold text-zinc-900">{liveActivity.title}</span>
              {liveActivity.location && (
                <span className="text-amber-700">({liveActivity.location})</span>
              )}
            </div>
            <button
              onClick={() => setActiveTab("itinerary")}
              className="text-[11px] font-semibold text-amber-900 hover:underline"
            >
              View Schedule &rarr;
            </button>
          </div>
        )}

        {/* Tabs Bar */}
        <div className="px-8 flex gap-6 border-t border-gray-100">
          <button
            onClick={() => setActiveTab("attendance")}
            className={`py-3 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === "attendance"
                ? "border-zinc-900 text-zinc-900"
                : "border-transparent text-gray-500 hover:text-zinc-700"
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <span>Date Travelers &amp; Roll Call ({stats.totalTravelers})</span>
          </button>

          <button
            onClick={() => setActiveTab("itinerary")}
            className={`py-3 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === "itinerary"
                ? "border-zinc-900 text-zinc-900"
                : "border-transparent text-gray-500 hover:text-zinc-700"
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
            <span>Daily Itinerary &amp; Activity Progress ({stats.completedActivities}/{stats.totalActivities})</span>
          </button>
        </div>
      </div>

      {/* Main Content Body */}
      <div className="p-8 max-w-7xl mx-auto space-y-6">
        {/* KPI Stats Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="bg-white p-3.5 rounded-lg border border-gray-200 shadow-2xs">
            <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block">
              Total Travelers
            </span>
            <span className="text-xl font-bold text-zinc-900 mt-1 block">
              {stats.totalTravelers}
            </span>
          </div>

          <div className="bg-white p-3.5 rounded-lg border border-emerald-200 bg-emerald-50/20 shadow-2xs">
            <span className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider block">
              Present / Checked-in
            </span>
            <span className="text-xl font-bold text-emerald-700 mt-1 block">
              {stats.presentCount}
            </span>
          </div>

          <div className="bg-white p-3.5 rounded-lg border border-amber-200 bg-amber-50/20 shadow-2xs">
            <span className="text-[11px] font-semibold text-amber-700 uppercase tracking-wider block">
              Pending Arrival
            </span>
            <span className="text-xl font-bold text-amber-800 mt-1 block">
              {stats.pendingCount}
            </span>
          </div>

          <div className="bg-white p-3.5 rounded-lg border border-red-200 bg-red-50/20 shadow-2xs">
            <span className="text-[11px] font-semibold text-red-600 uppercase tracking-wider block">
              Absent / No Show
            </span>
            <span className="text-xl font-bold text-red-700 mt-1 block">
              {stats.absentCount}
            </span>
          </div>

          <div className="bg-white p-3.5 rounded-lg border border-purple-200 bg-purple-50/20 shadow-2xs">
            <span className="text-[11px] font-semibold text-purple-700 uppercase tracking-wider block">
              Current Tour Day
            </span>
            <span className="text-xl font-bold text-purple-900 mt-1 block">
              Day {execution.currentDay || 1}
            </span>
          </div>

          <div className="bg-white p-3.5 rounded-lg border border-gray-200 shadow-2xs">
            <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block">
              Activities Done
            </span>
            <span className="text-xl font-bold text-zinc-900 mt-1 block">
              {stats.completedActivities} / {stats.totalActivities}
            </span>
          </div>
        </div>

        {/* TAB 1: TRAVELERS & ATTENDANCE */}
        {activeTab === "attendance" && (
          <div className="space-y-4">
            {/* Control Bar */}
            <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
              {/* Search */}
              <div className="relative flex-1 max-w-sm">
                <input
                  type="text"
                  placeholder="Search traveler by name, email, or booking ref..."
                  value={travelerSearch}
                  onChange={(e) => setTravelerSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 bg-gray-50 border border-gray-300 rounded-md text-xs focus:ring-1 focus:ring-zinc-900 focus:bg-white focus:outline-none"
                />
                <svg
                  className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>

              {/* Status Filters */}
              <div className="flex items-center gap-1.5 overflow-x-auto">
                {(["all", "present", "pending", "absent", "late"] as const).map((filterVal) => (
                  <button
                    key={filterVal}
                    onClick={() => setAttendanceFilter(filterVal)}
                    className={`px-3 py-1 text-xs font-semibold rounded-md capitalize transition-colors ${
                      attendanceFilter === filterVal
                        ? "bg-zinc-900 text-white"
                        : "bg-gray-100 text-zinc-600 hover:bg-gray-200"
                    }`}
                  >
                    {filterVal}
                  </button>
                ))}
              </div>

              {/* Bulk Quick Actions */}
              <div className="flex items-center gap-2 border-t md:border-t-0 pt-2 md:pt-0">
                <button
                  type="button"
                  onClick={() => handleBulkAttendance("present")}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-md shadow-xs transition flex items-center gap-1.5"
                  title="Mark all travelers as Present for departure"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Mark All Present</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleBulkAttendance("pending")}
                  className="px-2.5 py-1.5 border border-gray-300 text-zinc-600 hover:bg-gray-100 text-xs font-medium rounded-md transition"
                  title="Reset attendance state"
                >
                  Reset
                </button>
              </div>
            </div>

            {/* Travelers Roster Table */}
            {filteredAttendance.length === 0 ? (
              <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
                <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <h3 className="text-sm font-semibold text-zinc-800 mb-1">
                  {travelerSearch ? "No travelers match your search" : "No travelers registered for this departure date"}
                </h3>
                <p className="text-xs text-gray-500">
                  Bookings registered for {formatDisplayDate(selectedDepartureDate)} will automatically populate in this roster.
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
                            {/* Name */}
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

                            {/* Contact */}
                            <td className="px-5 py-3.5">
                              <div>
                                {traveler.email && (
                                  <p className="text-zinc-800 font-medium">{traveler.email}</p>
                                )}
                                {traveler.phone && (
                                  <p className="text-gray-500 text-[11px]">{traveler.phone}</p>
                                )}
                                {traveler.bookingRef && (
                                  <span className="inline-block mt-0.5 font-mono text-[10px] bg-zinc-100 px-1 py-0.2 rounded text-zinc-600">
                                    REF: {traveler.bookingRef}
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* Preferences */}
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

                            {/* Attendance Status Buttons */}
                            <td className="px-5 py-3.5 text-center">
                              <div className="inline-flex items-center rounded-lg border border-gray-200 p-0.5 bg-gray-50 gap-0.5">
                                <button
                                  type="button"
                                  disabled={isSaving}
                                  onClick={() => handleUpdateTravelerStatus(traveler.travelerId, "present")}
                                  className={`px-2.5 py-1 rounded text-xs font-semibold transition ${
                                    traveler.status === "present"
                                      ? "bg-emerald-600 text-white shadow-2xs"
                                      : "text-zinc-600 hover:text-emerald-700 hover:bg-white"
                                  }`}
                                >
                                  Present
                                </button>
                                <button
                                  type="button"
                                  disabled={isSaving}
                                  onClick={() => handleUpdateTravelerStatus(traveler.travelerId, "late")}
                                  className={`px-2 py-1 rounded text-xs font-semibold transition ${
                                    traveler.status === "late"
                                      ? "bg-amber-500 text-white shadow-2xs"
                                      : "text-zinc-600 hover:text-amber-700 hover:bg-white"
                                  }`}
                                >
                                  Late
                                </button>
                                <button
                                  type="button"
                                  disabled={isSaving}
                                  onClick={() => handleUpdateTravelerStatus(traveler.travelerId, "absent")}
                                  className={`px-2 py-1 rounded text-xs font-semibold transition ${
                                    traveler.status === "absent"
                                      ? "bg-red-600 text-white shadow-2xs"
                                      : "text-zinc-600 hover:text-red-700 hover:bg-white"
                                  }`}
                                >
                                  Absent
                                </button>
                                <button
                                  type="button"
                                  disabled={isSaving}
                                  onClick={() => handleUpdateTravelerStatus(traveler.travelerId, "pending")}
                                  className={`px-2 py-1 rounded text-xs font-semibold transition ${
                                    traveler.status === "pending"
                                      ? "bg-zinc-800 text-white shadow-2xs"
                                      : "text-zinc-400 hover:text-zinc-700 hover:bg-white"
                                  }`}
                                >
                                  Reset
                                </button>
                              </div>
                            </td>

                            {/* Check-in Time */}
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

        {/* TAB 2: DAILY ITINERARY & ACTIVITY TRACKER */}
        {activeTab === "itinerary" && (
          <div className="space-y-6">
            {/* Days Selector Bar */}
            <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-xs flex items-center justify-between gap-4 overflow-x-auto">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                  Select Day:
                </span>
                {execution.dailyProgress.map((dp) => {
                  const isCurrent = execution.currentDay === dp.dayNumber;
                  const isSelected = selectedDayNumber === dp.dayNumber;
                  return (
                    <button
                      key={dp.dayNumber}
                      type="button"
                      onClick={() => setSelectedDayNumber(dp.dayNumber)}
                      className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all relative flex items-center gap-1.5 ${
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

              {/* Set Current Day Button */}
              <button
                type="button"
                onClick={() => handleSetCurrentDay(selectedDayNumber)}
                className={`px-3.5 py-1.5 rounded-md text-xs font-semibold transition flex items-center gap-1.5 shrink-0 ${
                  execution.currentDay === selectedDayNumber
                    ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                    : "bg-zinc-100 hover:bg-zinc-200 text-zinc-800 border border-zinc-300"
                }`}
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>
                  {execution.currentDay === selectedDayNumber
                    ? `Active Live Day: Day ${selectedDayNumber}`
                    : `Set Day ${selectedDayNumber} as Current Live Day`}
                </span>
              </button>
            </div>

            {/* Selected Day Content Card */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-xs p-6 space-y-6">
              {/* Day Overview Header */}
              <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-gray-100 pb-4 gap-2">
                <div>
                  <span className="text-xs font-bold text-purple-700 tracking-wider uppercase">
                    Day {selectedDayNumber} Itinerary
                  </span>
                  <h2 className="text-lg font-bold text-zinc-900">
                    {currentDayTourItinerary?.title || `Day ${selectedDayNumber} Program`}
                  </h2>
                  {currentDayTourItinerary?.description && (
                    <p className="text-xs text-gray-500 mt-1 max-w-3xl line-clamp-2">
                      {currentDayTourItinerary.description}
                    </p>
                  )}
                </div>

                {/* Accommodations & Meals Pills */}
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

              {/* Day Activities List */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-zinc-800">
                    Scheduled Activities &amp; Milestones ({currentDayProgress?.activities?.length || 0})
                  </h3>
                  <span className="text-xs text-gray-400">
                    Update live activity status as the group progresses through the day
                  </span>
                </div>

                {(!currentDayProgress?.activities || currentDayProgress.activities.length === 0) ? (
                  <div className="p-8 text-center text-xs text-gray-500 bg-gray-50 rounded-lg">
                    No individual activities mapped for Day {selectedDayNumber}.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {currentDayProgress.activities.map((activity, idx) => {
                      const isSaving = savingActivityId === activity.activityId;
                      const isLive = activity.status === "in_progress";
                      const isDone = activity.status === "completed";

                      return (
                        <div
                          key={activity.activityId}
                          className={`p-4 rounded-lg border transition-all ${
                            isLive
                              ? "bg-amber-50/50 border-amber-300 ring-2 ring-amber-400/20"
                              : isDone
                              ? "bg-emerald-50/20 border-emerald-200"
                              : "bg-white border-gray-200 hover:border-gray-300"
                          }`}
                        >
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            {/* Activity Details */}
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
                                  <h4 className="text-sm font-semibold text-zinc-900">
                                    {activity.title}
                                  </h4>
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
                                  {activity.location && (
                                    <span>Location: {activity.location}</span>
                                  )}
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

                            {/* Live Status Controls */}
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
                                <option value="upcoming">Upcoming (Scheduled)</option>
                                <option value="in_progress">In Progress (Active Now)</option>
                                <option value="completed">Completed</option>
                                <option value="delayed">Delayed</option>
                                <option value="skipped">Skipped</option>
                              </select>

                              {/* Quick Action One-Click Buttons */}
                              {activity.status === "upcoming" && (
                                <button
                                  type="button"
                                  disabled={isSaving}
                                  onClick={() =>
                                    handleUpdateActivityStatus(selectedDayNumber, activity.activityId, "in_progress")
                                  }
                                  className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-md text-xs font-semibold shadow-xs transition"
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
                                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-xs font-semibold shadow-xs transition"
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
      </div>
    </div>
  );
}
