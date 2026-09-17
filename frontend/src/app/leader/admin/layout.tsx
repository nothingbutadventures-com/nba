"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { api } from "@/lib/api";

interface User {
  name: string;
  email: string;
  role: string;
}

const menuItems = [
  {
    name: "Assigned Tours",
    href: "/leader/admin/tours",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
      </svg>
    ),
  },
];

function LeaderLayoutSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar Skeleton */}
      <aside className="fixed top-0 left-0 h-screen w-64 bg-white border-r border-gray-200 z-40">
        <div className="h-16 px-6 flex items-center border-b border-gray-100">
          <div className="flex items-center gap-3 animate-pulse">
            <div className="w-8 h-8 bg-gray-200 rounded-md"></div>
            <div className="h-5 bg-gray-200 rounded w-28"></div>
          </div>
        </div>

        <nav className="p-4 space-y-1">
          {[1].map((i) => (
            <div
              key={i}
              className="flex items-center gap-3 px-3 py-2.5 rounded-md animate-pulse"
            >
              <div className="w-5 h-5 bg-gray-200 rounded-md"></div>
              <div className="h-4 bg-gray-200 rounded w-24"></div>
            </div>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-100">
          <div className="flex items-center gap-3 animate-pulse">
            <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
            <div className="flex-1">
              <div className="h-4 bg-gray-200 rounded w-24 mb-1.5"></div>
              <div className="h-3 bg-gray-200 rounded w-16"></div>
            </div>
          </div>
        </div>
      </aside>

      <div className="ml-64">
        <header className="h-16 bg-white border-b border-gray-200 px-8 flex items-center justify-between">
          <div className="h-6 bg-gray-200 rounded w-32 animate-pulse"></div>
          <div className="h-8 bg-gray-200 rounded w-24 animate-pulse"></div>
        </header>
        <div className="p-8">
          <div className="h-64 bg-white rounded-md border border-gray-200 animate-pulse"></div>
        </div>
      </div>
    </div>
  );
}

export default function LeaderAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [collapsed, setCollapsed] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login?redirect=/leader/admin/tours");
        return;
      }

      const response = await fetch(`${api.baseURL}${api.endpoints.auth.me}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        const userData = data.data.user;

        // Allow adventure_leader, guide, leader, partner, or admin
        const allowedRoles = ["adventure_leader", "guide", "leader", "partner", "admin", "affiliate"];
        if (!allowedRoles.includes(userData.role)) {
          router.push("/");
          return;
        }

        setUser(userData);
      } else {
        router.push("/login?redirect=/leader/admin/tours");
      }
    } catch (error) {
      console.error("Auth error:", error);
      router.push("/login?redirect=/leader/admin/tours");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/login");
  };

  if (loading) {
    return <LeaderLayoutSkeleton />;
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-screen bg-white border-r border-gray-200 z-40 transition-all duration-300 flex flex-col justify-between ${
          collapsed ? "w-20" : "w-64"
        }`}
      >
        <div>
          {/* Logo Section */}
          <div className="h-16 px-6 flex items-center justify-between border-b border-gray-100">
            {!collapsed && (
              <Link href="/leader/admin/tours" className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-zinc-900 text-white font-bold flex items-center justify-center text-sm">
                  🧭
                </div>
                <div>
                  <span className="text-sm font-bold text-zinc-900 tracking-tight block leading-tight">
                    Adventure Leader
                  </span>
                  <span className="text-[10px] text-purple-700 font-semibold uppercase tracking-wider block">
                    Field Guide Portal
                  </span>
                </div>
              </Link>
            )}
            {collapsed && (
              <div className="w-8 h-8 rounded-lg bg-zinc-900 text-white font-bold flex items-center justify-center text-sm mx-auto">
                🧭
              </div>
            )}
            <button
              onClick={() => setCollapsed(!collapsed)}
              className={`p-1.5 rounded-md hover:bg-gray-100 text-gray-500 hover:text-zinc-800 transition ${
                collapsed ? "mx-auto mt-2" : ""
              }`}
              title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              <svg
                className={`w-4 h-4 transition-transform duration-200 ${
                  collapsed ? "rotate-180" : ""
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          </div>

          {/* Navigation */}
          <nav className="p-3 space-y-1">
            {menuItems.map((item) => {
              const isActive = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                    isActive
                      ? "bg-zinc-900 text-white shadow-xs"
                      : "text-zinc-600 hover:bg-gray-100 hover:text-zinc-900"
                  } ${collapsed ? "justify-center px-2" : ""}`}
                  title={collapsed ? item.name : undefined}
                >
                  <span className="shrink-0">{item.icon}</span>
                  {!collapsed && <span>{item.name}</span>}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User Profile & Actions Footer */}
        <div className="p-3 border-t border-gray-100">
          {!collapsed ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2.5 px-2 py-1.5 bg-gray-50 rounded-lg">
                <div className="w-8 h-8 rounded-full bg-zinc-900 text-white font-bold flex items-center justify-center text-xs shrink-0">
                  {user.name ? user.name[0].toUpperCase() : "L"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-zinc-900 truncate">
                    {user.name}
                  </p>
                  <span className="text-[10px] font-semibold text-purple-700 bg-purple-50 px-1.5 py-0.2 rounded border border-purple-100 uppercase">
                    Adventure Leader
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1 pt-1">
                <Link
                  href="/"
                  className="flex-1 text-center py-1.5 px-2 text-[11px] font-medium text-zinc-600 hover:text-zinc-900 hover:bg-gray-100 rounded-md transition"
                >
                  Back to Site
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex-1 text-center py-1.5 px-2 text-[11px] font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition"
                >
                  Sign Out
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <div
                className="w-8 h-8 rounded-full bg-zinc-900 text-white font-bold flex items-center justify-center text-xs"
                title={`${user.name} (Adventure Leader)`}
              >
                {user.name ? user.name[0].toUpperCase() : "L"}
              </div>
              <button
                onClick={handleLogout}
                className="p-1.5 text-gray-400 hover:text-red-600 rounded-md hover:bg-red-50 transition"
                title="Sign Out"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <main
        className={`flex-1 transition-all duration-300 min-w-0 ${
          collapsed ? "ml-20" : "ml-64"
        }`}
      >
        {children}
      </main>
    </div>
  );
}
