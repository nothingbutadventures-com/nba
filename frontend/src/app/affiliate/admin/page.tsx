"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { api } from "@/lib/api";

export default function AffiliateAdminDashboardPage() {
  const [assignedToursCount, setAssignedToursCount] = useState<number>(0);
  const [affiliateProfile, setAffiliateProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem("token");

      // Fetch assigned tours count
      const toursRes = await fetch(`${api.baseURL}${api.endpoints.tours.getMyAssigned}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (toursRes.ok) {
        const toursData = await toursRes.json();
        setAssignedToursCount(toursData.total || (toursData.data.tours ? toursData.data.tours.length : 0));
      }

      // Fetch affiliate profile
      const affRes = await fetch(`${api.baseURL}/affiliates/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (affRes.ok) {
        const affData = await affRes.json();
        setAffiliateProfile(affData.data?.affiliate || null);
      }
    } catch (err) {
      console.error("Error loading affiliate dashboard:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="h-8 bg-gray-200 rounded-md w-48 mb-6 animate-pulse"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="h-32 bg-gray-200 rounded-xl animate-pulse"></div>
          <div className="h-32 bg-gray-200 rounded-xl animate-pulse"></div>
          <div className="h-32 bg-gray-200 rounded-xl animate-pulse"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-8 h-16 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-zinc-800 leading-none">Affiliate Dashboard</h1>
            <p className="text-gray-550 text-xs mt-1 leading-none">
              Welcome to your Nothing But Adventures affiliate partner center
            </p>
          </div>
          <Link
            href="/affiliate/admin/tours"
            className="bg-purple-600 hover:bg-purple-700 text-white font-medium py-1.5 px-3 rounded-md shadow-sm transition-colors text-xs flex items-center gap-1.5"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
            </svg>
            View Assigned Tours
          </Link>
        </div>
      </div>

      {/* Content */}
      <div className="p-8 max-w-7xl mx-auto space-y-6">
        {/* Welcome Card */}
        <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-zinc-900 rounded-2xl p-6 text-white shadow-md relative overflow-hidden">
          <div className="relative z-10 max-w-2xl">
            <span className="inline-block px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-500/30 text-purple-200 border border-purple-400/30 mb-3">
              Official Partner Portal
            </span>
            <h2 className="text-2xl font-bold mb-2">
              Hello, {affiliateProfile?.user?.name || "Partner"}!
            </h2>
            <p className="text-purple-100/80 text-sm leading-relaxed mb-4">
              Access your assigned expeditions, promotional links, and performance tracking directly from this dashboard.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              {affiliateProfile?.affiliateCode && (
                <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg px-3 py-1.5 flex items-center gap-2">
                  <span className="text-xs text-purple-200">Your Code:</span>
                  <span className="font-mono font-bold text-sm text-yellow-300">
                    {affiliateProfile.affiliateCode}
                  </span>
                </div>
              )}
              {affiliateProfile?.commissionRate !== undefined && (
                <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg px-3 py-1.5 flex items-center gap-2">
                  <span className="text-xs text-purple-200">Commission Rate:</span>
                  <span className="font-bold text-sm text-emerald-300">
                    {affiliateProfile.commissionRate}%
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link
            href="/affiliate/admin/tours"
            className="bg-white p-6 rounded-xl border border-gray-200 shadow-xs hover:border-purple-300 hover:shadow-md transition group"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Assigned Tours
              </span>
              <div className="w-9 h-9 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center group-hover:bg-purple-600 group-hover:text-white transition">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
                </svg>
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900">{assignedToursCount}</p>
            <p className="text-xs text-purple-600 font-medium mt-2 flex items-center gap-1">
              <span>View all assigned tours</span>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </p>
          </Link>

          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Account Status
              </span>
              <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <p className="text-2xl font-bold text-emerald-700 capitalize">
              {affiliateProfile?.status || "Approved"}
            </p>
            <p className="text-xs text-gray-500 mt-2">
              Tier: <span className="font-semibold text-gray-800 capitalize">{affiliateProfile?.tier || "Standard"}</span>
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Partner Code
              </span>
              <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                </svg>
              </div>
            </div>
            <p className="text-xl font-mono font-bold text-gray-900">
              {affiliateProfile?.affiliateCode || "NBA-PARTNER"}
            </p>
            <p className="text-xs text-gray-500 mt-2">
              Attach to tour URLs to track referrals
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
