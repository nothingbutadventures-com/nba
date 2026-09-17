"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Check, X, ShieldAlert, KeyRound, User as UserIcon, Lock, Mail, Shield, AlertTriangle } from "lucide-react";
import { api } from "@/lib/api";

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
}

export default function ProfileSettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Profile form
  const [editForm, setEditForm] = useState({
    name: "",
    phone: "",
    dateOfBirth: "",
    nationality: "",
  });
  const [saving, setSaving] = useState(false);
  const [profileSuccessMessage, setProfileSuccessMessage] = useState("");
  const [profileErrorMessage, setProfileErrorMessage] = useState("");

  // Password form
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordSuccessMessage, setPasswordSuccessMessage] = useState("");
  const [passwordErrorMessage, setPasswordErrorMessage] = useState("");

  useEffect(() => {
    fetchUser();
  }, []);

  const fetchUser = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/auth/login");
        return;
      }

      const res = await fetch(`${api.baseURL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        localStorage.removeItem("token");
        router.push("/auth/login");
        return;
      }

      const data = await res.json();
      const userData = data.data.user;
      setUser(userData);
      setEditForm({
        name: userData.name || "",
        phone: userData.phone || "",
        dateOfBirth: userData.dateOfBirth
          ? new Date(userData.dateOfBirth).toISOString().split("T")[0]
          : "",
        nationality: userData.nationality || "",
      });
    } catch (err) {
      console.error("Failed to load user settings:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSuccessMessage("");
    setProfileErrorMessage("");
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

      const data = await res.json();

      if (res.ok) {
        setUser(data.data.user);
        setProfileSuccessMessage("Profile updated successfully!");
        setTimeout(() => setProfileSuccessMessage(""), 4000);
      } else {
        setProfileErrorMessage(data.message || "Failed to update profile.");
      }
    } catch (err) {
      console.error("Profile save error:", err);
      setProfileErrorMessage("An unexpected error occurred.");
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordSuccessMessage("");
    setPasswordErrorMessage("");

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordErrorMessage("New passwords do not match!");
      return;
    }

    if (passwordForm.newPassword.length < 8) {
      setPasswordErrorMessage("Password must be at least 8 characters long.");
      return;
    }

    try {
      setChangingPassword(true);
      const token = localStorage.getItem("token");
      const res = await fetch(`${api.baseURL}/auth/update-password`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          passwordCurrent: passwordForm.currentPassword,
          password: passwordForm.newPassword,
          passwordConfirm: passwordForm.confirmPassword,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        if (data.token) {
          localStorage.setItem("token", data.token);
        }
        setPasswordSuccessMessage("Password changed successfully!");
        setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
        setTimeout(() => setPasswordSuccessMessage(""), 4000);
      } else {
        setPasswordErrorMessage(data.message || "Failed to update password.");
      }
    } catch (err) {
      console.error("Password change error:", err);
      setPasswordErrorMessage("An error occurred while updating password.");
    } finally {
      setChangingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white py-12">
        <div className="w-full max-w-[1280px] mx-auto px-5 sm:px-6 md:px-8 xl:px-[35px] animate-pulse space-y-6">
          <div className="h-8 w-64 bg-gray-100 rounded-2xl"></div>
          <div className="h-5 w-48 bg-gray-100 rounded-xl"></div>
          <div className="h-72 bg-[#F8F9FA] rounded-3xl"></div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="text-center p-8 max-w-md w-full">
          <h2 className="text-2xl font-bold text-[#1A1A1A] mb-2">Sign in required</h2>
          <p className="text-[#3F3F42] text-sm mb-6">Please log in to manage your account settings.</p>
          <Link
            href="/auth/login"
            className="inline-block bg-[#432360] hover:bg-[#321a48] text-white font-bold px-7 py-3 rounded-full text-xs transition shadow-md"
          >
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

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
            <Link
              href="/profile/settings"
              className="text-[#1A1A1A] font-bold whitespace-nowrap"
            >
              Settings
            </Link>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="w-full max-w-[1280px] mx-auto px-5 sm:px-6 md:px-8 xl:px-[35px] py-10 md:py-12">
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-black text-[#1A1A1A] tracking-tight">
            Account Settings
          </h1>
          <p className="text-sm text-gray-500 font-medium mt-1">
            Manage your personal profile details and security credentials.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Column */}
          <div className="lg:col-span-2 space-y-8">
            {/* Personal Details */}
            <div className="bg-white rounded-3xl p-6 md:p-8 shadow-[0_4px_24px_rgba(0,0,0,0.04)]">
              <div className="flex items-center gap-2.5 mb-1">
                <UserIcon className="w-5 h-5 text-[#432360]" />
                <h2 className="text-lg font-bold text-[#1A1A1A]">Personal Details</h2>
              </div>
              <p className="text-xs text-gray-500 font-medium mb-6">
                Your contact and identity information used for tour reservations.
              </p>

              <form onSubmit={handleSaveProfile} className="space-y-4">
                {profileSuccessMessage && (
                  <div className="p-3.5 rounded-2xl bg-emerald-50 text-emerald-800 text-xs font-bold flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span>{profileSuccessMessage}</span>
                  </div>
                )}
                {profileErrorMessage && (
                  <div className="p-3.5 rounded-2xl bg-rose-50 text-rose-800 text-xs font-bold flex items-center gap-2">
                    <X className="w-4 h-4 text-rose-600 flex-shrink-0" />
                    <span>{profileErrorMessage}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-[#1A1A1A] mb-1.5">Full Legal Name</label>
                    <input
                      type="text"
                      required
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      className="w-full px-4 py-3 rounded-2xl bg-[#F8F9FA] focus:bg-white focus:ring-2 focus:ring-[#432360]/20 text-sm outline-none transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#1A1A1A] mb-1.5">Phone Number</label>
                    <input
                      type="tel"
                      value={editForm.phone}
                      onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                      placeholder="+1 (555) 000-0000"
                      className="w-full px-4 py-3 rounded-2xl bg-[#F8F9FA] focus:bg-white focus:ring-2 focus:ring-[#432360]/20 text-sm outline-none transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#1A1A1A] mb-1.5">Date of Birth</label>
                    <input
                      type="date"
                      value={editForm.dateOfBirth}
                      onChange={(e) => setEditForm({ ...editForm, dateOfBirth: e.target.value })}
                      className="w-full px-4 py-3 rounded-2xl bg-[#F8F9FA] focus:bg-white focus:ring-2 focus:ring-[#432360]/20 text-sm outline-none transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#1A1A1A] mb-1.5">Nationality</label>
                    <input
                      type="text"
                      value={editForm.nationality}
                      onChange={(e) => setEditForm({ ...editForm, nationality: e.target.value })}
                      placeholder="e.g. Indian, Canadian, British"
                      className="w-full px-4 py-3 rounded-2xl bg-[#F8F9FA] focus:bg-white focus:ring-2 focus:ring-[#432360]/20 text-sm outline-none transition"
                    />
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-7 py-3 rounded-full bg-[#432360] hover:bg-[#321a48] text-white text-xs font-bold transition shadow-md hover:shadow-lg disabled:opacity-50"
                  >
                    {saving ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </form>
            </div>

            {/* Change Password */}
            <div className="bg-white rounded-3xl p-6 md:p-8 shadow-[0_4px_24px_rgba(0,0,0,0.04)]">
              <div className="flex items-center gap-2.5 mb-1">
                <Lock className="w-5 h-5 text-[#432360]" />
                <h2 className="text-lg font-bold text-[#1A1A1A]">Password & Security</h2>
              </div>
              <p className="text-xs text-gray-500 font-medium mb-6">
                Update your account password regularly to keep your profile secure.
              </p>

              <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md">
                {passwordSuccessMessage && (
                  <div className="p-3.5 rounded-2xl bg-emerald-50 text-emerald-800 text-xs font-bold flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span>{passwordSuccessMessage}</span>
                  </div>
                )}
                {passwordErrorMessage && (
                  <div className="p-3.5 rounded-2xl bg-rose-50 text-rose-800 text-xs font-bold flex items-center gap-2">
                    <X className="w-4 h-4 text-rose-600 flex-shrink-0" />
                    <span>{passwordErrorMessage}</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-[#1A1A1A] mb-1.5">Current Password</label>
                  <input
                    type="password"
                    required
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                    placeholder="••••••••••••"
                    className="w-full px-4 py-3 rounded-2xl bg-[#F8F9FA] focus:bg-white focus:ring-2 focus:ring-[#432360]/20 text-sm outline-none transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1A1A1A] mb-1.5">New Password</label>
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    placeholder="Minimum 8 characters"
                    className="w-full px-4 py-3 rounded-2xl bg-[#F8F9FA] focus:bg-white focus:ring-2 focus:ring-[#432360]/20 text-sm outline-none transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1A1A1A] mb-1.5">Confirm New Password</label>
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                    placeholder="Re-enter new password"
                    className="w-full px-4 py-3 rounded-2xl bg-[#F8F9FA] focus:bg-white focus:ring-2 focus:ring-[#432360]/20 text-sm outline-none transition"
                  />
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    disabled={changingPassword}
                    className="px-7 py-3 rounded-full bg-[#1A1A1A] hover:bg-black text-white text-xs font-bold transition shadow-md disabled:opacity-50"
                  >
                    {changingPassword ? "Updating..." : "Update Password"}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="bg-[#F8F9FA] rounded-3xl p-6 shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
              <h3 className="text-sm font-bold text-[#1A1A1A] mb-4 flex items-center gap-2">
                <Shield className="w-4 h-4 text-[#432360]" />
                <span>Account Overview</span>
              </h3>
              <div className="space-y-3.5 text-xs">
                <div>
                  <span className="text-gray-400 font-bold uppercase tracking-wider text-[10px] block mb-1">Email Address</span>
                  <span className="text-[#1A1A1A] font-bold text-sm block">{user.email}</span>
                </div>
                <div className="pt-2">
                  <span className="text-gray-400 font-bold uppercase tracking-wider text-[10px] block mb-1">Account Role</span>
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-purple-100 text-[#6A38C2] capitalize">
                    {user.role}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-3xl bg-rose-50/70 shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
              <div className="flex items-center gap-2 mb-1.5">
                <AlertTriangle className="w-4 h-4 text-rose-700" />
                <h3 className="text-sm font-bold text-rose-900">Delete Account</h3>
              </div>
              <p className="text-xs text-rose-800/80 font-medium leading-relaxed mb-4">
                Permanently delete your account and all associated booking history.
              </p>
              <button
                type="button"
                onClick={() => alert("Please contact support@nothingbutadventures.com for account deletion.")}
                className="w-full py-2.5 rounded-full bg-white text-rose-700 text-xs font-bold shadow-xs hover:bg-rose-100 transition"
              >
                Delete Account
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
