"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { api } from "@/lib/api";

interface AffiliateProfile {
    _id: string;
    type: string;
    status: string;
    affiliateCode: string;
    commissionRate: number;
    tier: string;
    stats: {
        totalClicks: number;
        totalSignups: number;
        totalBookings: number;
        totalRevenue: number;
        totalCommissionEarned: number;
        totalCommissionPaid: number;
        conversionRate: number;
    };
    pendingCommission: number;
    createdAt: string;
    approvedAt: string;
}

interface ReferredUser {
    _id: string;
    name: string;
    email: string;
    joinedAt: string;
    isEmailVerified: boolean;
    bookingCount: number;
    totalSpent: number;
}

interface Referral {
    _id: string;
    status: string;
    commissionAmount: number;
    bookingAmount: number;
    clickedAt: string;
    bookedAt?: string;
    source: string;
    referredUser?: { name: string; email: string };
    booking?: { bookingReference: string; status: string };
    tour?: { name: string; slug: string };
}

interface Payout {
    amount: number;
    method: string;
    status: string;
    paidAt?: string;
    transactionId?: string;
    requestedAt: string;
}

const tierConfig: Record<string, { color: string; bg: string; label: string }> = {
    bronze: { color: "text-amber-700", bg: "bg-amber-100", label: "Bronze" },
    silver: { color: "text-gray-600", bg: "bg-gray-200", label: "Silver" },
    gold: { color: "text-yellow-700", bg: "bg-yellow-100", label: "Gold" },
    platinum: { color: "text-emerald-700", bg: "bg-emerald-100", label: "Platinum" },
};

const statusColors: Record<string, string> = {
    clicked: "bg-gray-100 text-gray-600",
    signed_up: "bg-blue-100 text-blue-700",
    booked: "bg-emerald-100 text-emerald-700",
    commission_locked: "bg-amber-100 text-amber-700",
    commission_paid: "bg-green-100 text-green-700",
    expired: "bg-red-100 text-red-600",
};

export default function AffiliateDashboardPage() {
    const [profile, setProfile] = useState<AffiliateProfile | null>(null);
    const [referredUsers, setReferredUsers] = useState<ReferredUser[]>([]);
    const [referrals, setReferrals] = useState<Referral[]>([]);
    const [payouts, setPayouts] = useState<Payout[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<"users" | "referrals" | "payouts">("users");
    const [copied, setCopied] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const token = localStorage.getItem("token");
                if (!token) {
                    setError("Please log in to access your affiliate dashboard.");
                    setLoading(false);
                    return;
                }
                const headers = { Authorization: `Bearer ${token}` };

                const [profileRes, referralsRes, payoutsRes] = await Promise.all([
                    fetch(`${api.baseURL}${api.endpoints.affiliates.me}`, { headers }),
                    fetch(`${api.baseURL}${api.endpoints.affiliates.myReferrals}?limit=50`, { headers }),
                    fetch(`${api.baseURL}${api.endpoints.affiliates.myPayouts}`, { headers }),
                ]);

                const profileData = await profileRes.json();
                const referralsData = await referralsRes.json();
                const payoutsData = await payoutsRes.json();

                if (profileData.status === "success") setProfile(profileData.data.affiliate);
                else setError(profileData.message || "Failed to load profile");

                if (referralsData.status === "success") {
                    setReferrals(referralsData.data.referrals || []);
                    setReferredUsers(referralsData.data.referredUsers || []);
                }
                if (payoutsData.status === "success") setPayouts(payoutsData.data.payouts || []);
            } catch {
                setError("Network error. Please try again.");
            }
            setLoading(false);
        };
        fetchData();
    }, []);

    const copyLink = () => {
        if (!profile?.affiliateCode) return;
        const link = `https://nothingbutadventures.com/?ref=${profile.affiliateCode}`;
        navigator.clipboard.writeText(link);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const formatCurrency = (n: number) => `$${(n || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    if (loading) {
        return (
            <main className="min-h-screen bg-[#FAFAFA] pt-24 pb-16 px-4 font-outfit">
                <div className="max-w-5xl mx-auto">
                    <div className="flex items-center justify-center py-32">
                        <div className="text-center">
                            <div className="w-10 h-10 border-2 border-[#1A1A1A] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                            <p className="text-[#3F3F42]/50">Loading your dashboard...</p>
                        </div>
                    </div>
                </div>
            </main>
        );
    }

    if (error || !profile) {
        return (
            <main className="min-h-screen bg-[#FAFAFA] pt-24 pb-16 px-4 font-outfit">
                <div className="max-w-2xl mx-auto text-center py-32">
                    <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <svg className="w-10 h-10 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                    </div>
                    <h2 className="text-2xl font-bold text-[#1A1A1A] mb-3">{error || "No Affiliate Profile Found"}</h2>
                    <p className="text-[#3F3F42]/60 mb-8">You haven&apos;t applied for the affiliate program yet, or your account isn&apos;t linked.</p>
                    <Link href="/partner/affiliate" className="px-8 py-3 bg-[#1A1A1A] text-white rounded-xl font-semibold hover:bg-[#333] transition-colors inline-block">
                        Apply Now
                    </Link>
                </div>
            </main>
        );
    }

    // Pending/Rejected state
    if (profile.status === "pending" || profile.status === "rejected" || profile.status === "suspended") {
        const configs = {
            pending: { icon: "⏳", title: "Application Under Review", desc: "Your affiliate application is being reviewed. We'll get back to you within 2-3 business days.", color: "bg-amber-100" },
            rejected: { icon: "❌", title: "Application Not Approved", desc: "Unfortunately, your application was not approved at this time. Please contact affiliate@nothingbutadventures.com for more information.", color: "bg-red-100" },
            suspended: { icon: "⚠️", title: "Account Suspended", desc: "Your affiliate account has been suspended. Please contact affiliate@nothingbutadventures.com for assistance.", color: "bg-gray-100" },
        };
        const config = configs[profile.status];
        return (
            <main className="min-h-screen bg-[#FAFAFA] pt-24 pb-16 px-4 font-outfit">
                <div className="max-w-2xl mx-auto text-center py-32">
                    <div className={`w-20 h-20 ${config.color} rounded-full flex items-center justify-center mx-auto mb-6 text-4xl`}>
                        {config.icon}
                    </div>
                    <h2 className="text-2xl font-bold text-[#1A1A1A] mb-3">{config.title}</h2>
                    <p className="text-[#3F3F42]/60 mb-8">{config.desc}</p>
                    <Link href="/" className="px-8 py-3 bg-[#1A1A1A] text-white rounded-xl font-semibold hover:bg-[#333] transition-colors inline-block">
                        Go Home
                    </Link>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-[#FAFAFA] pt-24 pb-16 px-4 font-outfit">
            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-[#1A1A1A]">Affiliate Dashboard</h1>
                        <p className="text-[#3F3F42]/60 text-sm mt-1">Track your referred users, bookings, and earned commissions</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Link
                            href="/affiliate/admin"
                            className="px-4 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
                        >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                            <span>Admin Portal</span>
                        </Link>
                        <span className={`px-3 py-1.5 rounded-full text-xs font-semibold capitalize ${tierConfig[profile.tier]?.bg} ${tierConfig[profile.tier]?.color}`}>
                            {tierConfig[profile.tier]?.label || profile.tier} Tier
                        </span>
                        <span className="px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-full text-xs font-semibold">
                            {profile.commissionRate}% Commission Rate
                        </span>
                    </div>
                </div>

                {/* Referral Link Card */}
                <div className="bg-gradient-to-r from-[#1A1A1A] to-[#2d2d2d] rounded-2xl p-6 sm:p-8 mb-8 text-white shadow-lg">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div>
                            <p className="text-white/50 text-xs font-medium uppercase tracking-wider mb-1">Your Personal Referral Link</p>
                            <p className="text-sm sm:text-base font-mono text-white/90 break-all font-semibold">
                                https://nothingbutadventures.com/?ref={profile.affiliateCode}
                            </p>
                            <p className="text-xs text-white/50 mt-2">
                                When visitors use this link to create an account, all their future tour bookings earn you commission automatically!
                            </p>
                        </div>
                        <button onClick={copyLink} className={`px-6 py-3 rounded-xl font-semibold text-sm transition-all duration-300 shrink-0 cursor-pointer ${copied ? "bg-emerald-500 text-white" : "bg-white text-[#1A1A1A] hover:bg-gray-100"}`}>
                            {copied ? "✓ Copied Link!" : "Copy Link"}
                        </button>
                    </div>
                    <div className="mt-4 pt-4 border-t border-white/10 flex items-center gap-3">
                        <p className="text-white/40 text-xs">Affiliate Code:</p>
                        <p className="font-mono font-bold text-white text-sm bg-white/10 px-2 py-0.5 rounded">{profile.affiliateCode}</p>
                    </div>
                </div>

                {/* Stats Grid - Focused on Referred Users & Bookings */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-[#3F3F42]/50 font-medium">Referred Users</span>
                            <span className="p-1.5 bg-blue-50 text-blue-600 rounded-lg text-lg">👥</span>
                        </div>
                        <p className="text-2xl font-bold text-[#1A1A1A] mt-2">{referredUsers.length}</p>
                        <p className="text-xs text-gray-400 mt-1">Accounts created with your link</p>
                    </div>

                    <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-[#3F3F42]/50 font-medium">Tours Booked</span>
                            <span className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg text-lg">🎒</span>
                        </div>
                        <p className="text-2xl font-bold text-[#1A1A1A] mt-2">{profile.stats.totalBookings.toLocaleString()}</p>
                        <p className="text-xs text-gray-400 mt-1">Total trips booked</p>
                    </div>

                    <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-[#3F3F42]/50 font-medium">Total Commission</span>
                            <span className="p-1.5 bg-amber-50 text-amber-600 rounded-lg text-lg">💰</span>
                        </div>
                        <p className="text-2xl font-bold text-[#1A1A1A] mt-2">{formatCurrency(profile.stats.totalCommissionEarned)}</p>
                        <p className="text-xs text-gray-400 mt-1">{formatCurrency(profile.stats.totalCommissionPaid)} paid out</p>
                    </div>

                    <div className="bg-emerald-50 rounded-xl border border-emerald-200 p-5 shadow-sm">
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-emerald-700 font-medium">Pending Payout</span>
                            <span className="p-1.5 bg-emerald-100 text-emerald-700 rounded-lg text-lg">💵</span>
                        </div>
                        <p className="text-2xl font-bold text-emerald-800 mt-2">{formatCurrency(profile.pendingCommission)}</p>
                        <p className="text-xs text-emerald-600 mt-1">Ready for next payout</p>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex items-center gap-2 mb-6">
                    <button
                        onClick={() => setActiveTab("users")}
                        className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer flex items-center gap-2 ${activeTab === "users" ? "bg-[#1A1A1A] text-white" : "bg-gray-100 text-[#3F3F42] hover:bg-gray-200"}`}
                    >
                        <span>Referred Users</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${activeTab === "users" ? "bg-white/20 text-white" : "bg-gray-200 text-gray-700"}`}>
                            {referredUsers.length}
                        </span>
                    </button>

                    <button
                        onClick={() => setActiveTab("referrals")}
                        className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer flex items-center gap-2 ${activeTab === "referrals" ? "bg-[#1A1A1A] text-white" : "bg-gray-100 text-[#3F3F42] hover:bg-gray-200"}`}
                    >
                        <span>Tours Booked & Commission</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${activeTab === "referrals" ? "bg-white/20 text-white" : "bg-gray-200 text-gray-700"}`}>
                            {referrals.filter(r => r.bookingAmount > 0).length}
                        </span>
                    </button>

                    <button
                        onClick={() => setActiveTab("payouts")}
                        className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${activeTab === "payouts" ? "bg-[#1A1A1A] text-white" : "bg-gray-100 text-[#3F3F42] hover:bg-gray-200"}`}
                    >
                        Payout History
                    </button>
                </div>

                {/* TAB 1: Referred Users List */}
                {activeTab === "users" && (
                    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
                        {referredUsers.length === 0 ? (
                            <div className="p-12 text-center">
                                <p className="text-4xl mb-3">👥</p>
                                <h3 className="font-bold text-[#1A1A1A] text-lg mb-1">No referred accounts yet</h3>
                                <p className="text-[#3F3F42]/50 text-sm max-w-md mx-auto">
                                    Share your unique referral link! When travelers click and create an account, they will show up here.
                                </p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-gray-100 bg-gray-50/50">
                                            <th className="text-left px-5 py-3.5 font-semibold text-[#3F3F42]/70">User Name</th>
                                            <th className="text-left px-5 py-3.5 font-semibold text-[#3F3F42]/70">User Email</th>
                                            <th className="text-left px-5 py-3.5 font-semibold text-[#3F3F42]/70">Joined Date</th>
                                            <th className="text-center px-5 py-3.5 font-semibold text-[#3F3F42]/70">Tours Booked</th>
                                            <th className="text-right px-5 py-3.5 font-semibold text-[#3F3F42]/70">Total Spend</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {referredUsers.map((user) => (
                                            <tr key={user._id} className="hover:bg-gray-50/50 transition-colors">
                                                <td className="px-5 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-zinc-100 text-zinc-700 flex items-center justify-center font-bold text-xs">
                                                            {user.name ? user.name.charAt(0).toUpperCase() : "U"}
                                                        </div>
                                                        <span className="font-semibold text-zinc-800">{user.name}</span>
                                                    </div>
                                                </td>
                                                <td className="px-5 py-4 font-mono text-xs text-zinc-600">
                                                    {user.email}
                                                </td>
                                                <td className="px-5 py-4 text-zinc-500 text-xs">
                                                    {new Date(user.joinedAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
                                                </td>
                                                <td className="px-5 py-4 text-center">
                                                    {user.bookingCount > 0 ? (
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                                                            {user.bookingCount} {user.bookingCount === 1 ? "Trip" : "Trips"}
                                                        </span>
                                                    ) : (
                                                        <span className="text-xs text-gray-400">0 Trips</span>
                                                    )}
                                                </td>
                                                <td className="px-5 py-4 text-right font-semibold text-zinc-800">
                                                    {user.totalSpent > 0 ? formatCurrency(user.totalSpent) : "—"}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}

                {/* TAB 2: Bookings & Commission */}
                {activeTab === "referrals" && (
                    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
                        {referrals.filter(r => r.bookingAmount > 0).length === 0 ? (
                            <div className="p-12 text-center">
                                <p className="text-4xl mb-3">🎒</p>
                                <h3 className="font-bold text-[#1A1A1A] text-lg mb-1">No bookings recorded yet</h3>
                                <p className="text-[#3F3F42]/50 text-sm max-w-md mx-auto">
                                    When users you refer book their tours, their trips and your earned commissions will appear here.
                                </p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-gray-100 bg-gray-50/50">
                                            <th className="text-left px-5 py-3.5 font-semibold text-[#3F3F42]/70">Date</th>
                                            <th className="text-left px-5 py-3.5 font-semibold text-[#3F3F42]/70">Traveler</th>
                                            <th className="text-left px-5 py-3.5 font-semibold text-[#3F3F42]/70">Tour</th>
                                            <th className="text-left px-5 py-3.5 font-semibold text-[#3F3F42]/70">Status</th>
                                            <th className="text-right px-5 py-3.5 font-semibold text-[#3F3F42]/70">Booking Total</th>
                                            <th className="text-right px-5 py-3.5 font-semibold text-[#3F3F42]/70">Your Commission</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {referrals.filter(r => r.bookingAmount > 0).map((ref) => (
                                            <tr key={ref._id} className="hover:bg-gray-50/50">
                                                <td className="px-5 py-3.5 text-[#3F3F42]/70 text-xs">
                                                    {new Date(ref.bookedAt || ref.clickedAt).toLocaleDateString()}
                                                </td>
                                                <td className="px-5 py-3.5">
                                                    <div className="font-medium text-zinc-800 text-xs">{ref.referredUser?.name || "Traveler"}</div>
                                                    <div className="text-[11px] text-gray-400 font-mono">{ref.referredUser?.email}</div>
                                                </td>
                                                <td className="px-5 py-3.5 text-zinc-800 font-medium text-xs">
                                                    {ref.tour?.name || "Adventure Tour"}
                                                </td>
                                                <td className="px-5 py-3.5">
                                                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${statusColors[ref.status] || "bg-gray-100 text-gray-600"}`}>
                                                        {ref.status.replace(/_/g, " ")}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-3.5 text-right font-medium">
                                                    {formatCurrency(ref.bookingAmount)}
                                                </td>
                                                <td className="px-5 py-3.5 text-right font-bold text-emerald-600">
                                                    {formatCurrency(ref.commissionAmount)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}

                {/* TAB 3: Payouts */}
                {activeTab === "payouts" && (
                    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
                        {payouts.length === 0 ? (
                            <div className="p-12 text-center">
                                <p className="text-4xl mb-3">💵</p>
                                <p className="text-[#3F3F42]/50 text-sm">No payouts processed yet. Once approved bookings complete, payouts will be listed here.</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-gray-100 bg-gray-50/50">
                                            <th className="text-left px-5 py-3.5 font-semibold text-[#3F3F42]/70">Date</th>
                                            <th className="text-left px-5 py-3.5 font-semibold text-[#3F3F42]/70">Method</th>
                                            <th className="text-left px-5 py-3.5 font-semibold text-[#3F3F42]/70">Transaction Reference</th>
                                            <th className="text-left px-5 py-3.5 font-semibold text-[#3F3F42]/70">Status</th>
                                            <th className="text-right px-5 py-3.5 font-semibold text-[#3F3F42]/70">Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {payouts.map((p, i) => (
                                            <tr key={i} className="hover:bg-gray-50/50">
                                                <td className="px-5 py-3.5 text-xs">{new Date(p.paidAt || p.requestedAt).toLocaleDateString()}</td>
                                                <td className="px-5 py-3.5 capitalize text-xs">{p.method.replace(/_/g, " ")}</td>
                                                <td className="px-5 py-3.5 font-mono text-xs text-gray-500">{p.transactionId || "—"}</td>
                                                <td className="px-5 py-3.5">
                                                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${p.status === "completed" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                                                        {p.status}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-3.5 text-right font-bold text-emerald-600">{formatCurrency(p.amount)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </main>
    );
}
