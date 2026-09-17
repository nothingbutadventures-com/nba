"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { api } from "@/lib/api";
import HeaderMegaMenu from "./HeaderMegaMenu";
import WhyUsMegaMenu from "./WhyUsMegaMenu";
import DealsMegaMenu from "./DealsMegaMenu";

interface User {
  name: string;
  email: string;
  role: string;
  avatar?: string;
  photo?: string;
  walletBalance?: number;
}

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDestinationOpen, setIsDestinationOpen] = useState(false);
  const [isAdventureOpen, setIsAdventureOpen] = useState(false);
  const [continents, setContinents] = useState<
    { _id?: string; name: string; slug: string }[]
  >([
    { name: "Asia", slug: "asia" },
    { name: "Europe", slug: "europe" },
    { name: "Africa", slug: "africa" },
    { name: "North America", slug: "north-america" },
    { name: "South America", slug: "south-america" },
    { name: "Oceania & Polar", slug: "oceania" },
  ]);
  const [travelStyles, setTravelStyles] = useState<
    { _id?: string; name: string; slug: string }[]
  >([
    { name: "Classic Adventures", slug: "classic" },
    { name: "Active & Hiking", slug: "active-hiking" },
    { name: "Wildlife & Safari", slug: "wildlife-safari" },
    { name: "Cultural Journeys", slug: "cultural-journeys" },
    { name: "Family Holidays", slug: "family-holidays" },
    { name: "Solo Travel", slug: "solo-travel" },
  ]);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [activeMenu, setActiveMenu] = useState<
    "adventures" | "interests" | "destinations" | "why-us" | "deals" | null
  >(null);
  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Scroll reveal state
  const [show, setShow] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const openedAtTopRef = useRef(false);

  // Fetch continents & travel styles for mobile menu
  useEffect(() => {
    const fetchMenuData = async () => {
      try {
        const [cRes, tsRes] = await Promise.all([
          fetch(`${api.baseURL}/continents`),
          fetch(`${api.baseURL}/travel-styles`),
        ]);
        if (cRes.ok) {
          const cData = await cRes.json();
          const cList = cData.data?.continents || cData.data || [];
          if (cList.length > 0) setContinents(cList);
        }
        if (tsRes.ok) {
          const tsData = await tsRes.json();
          const tsList = tsData.data?.travelStyles || tsData.data || [];
          if (tsList.length > 0) setTravelStyles(tsList);
        }
      } catch (err) {
        // use default fallback data
      }
    };
    fetchMenuData();
  }, []);

  useEffect(() => {
    if (activeMenu) {
      if (window.scrollY < 50) {
        openedAtTopRef.current = true;
      }
    } else {
      openedAtTopRef.current = false;
    }
  }, [activeMenu]);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      // Close dropdowns if scrolling
      if (Math.abs(currentScrollY - lastScrollY) > 20 && isUserMenuOpen) {
        setIsUserMenuOpen(false);
      }

      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        // Scrolling down
        if (activeMenu && openedAtTopRef.current) {
          // Do nothing, let it stay open and scroll with the page naturally.
        } else {
          setShow(false);
          setActiveMenu(null); // Also close mega menus when hiding header
        }
      } else {
        // Scrolling up
        setShow(true);
      }
      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY, isUserMenuOpen, activeMenu]);

  const handleMenuEnter = (
    menu: "adventures" | "interests" | "destinations" | "why-us" | "deals",
  ) => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    setActiveMenu(menu);
  };

  const handleMenuLeave = () => {
    hoverTimeoutRef.current = setTimeout(() => {
      setActiveMenu(null);
    }, 150);
  };

  useEffect(() => {
    checkAuth();
    setIsMenuOpen(false);
    setIsUserMenuOpen(false);
    setActiveMenu(null);
  }, [pathname]);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMenuOpen]);

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setIsLoading(false);
        return;
      }

      const response = await fetch(`${api.baseURL}/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.data.user);
      } else {
        localStorage.removeItem("token");
        setUser(null);
      }
    } catch (error) {
      console.error("Auth check failed:", error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setUser(null);
    setIsUserMenuOpen(false);
    router.push("/");
  };

  if (
    pathname?.startsWith("/auth") ||
    pathname?.startsWith("/admin") ||
    pathname?.startsWith("/affiliate/admin") ||
    pathname?.startsWith("/leader/admin")
  ) {
    return null;
  }

  const isMenuOpenAtTop = activeMenu && openedAtTopRef.current;

  return (
    <>
      {/* Page-level dark overlay — z-40 covers content below the header (z-50) */}
      {activeMenu && (
        <div className="fixed inset-0 bg-black/25 z-40 pointer-events-none transition-opacity duration-300" />
      )}
      <header
        onMouseLeave={() => {
          setActiveMenu(null);
          if (openedAtTopRef.current && window.scrollY > 100) {
            setShow(false);
          }
        }}
        className={`relative z-[100] font-outfit transition-all duration-300 transform ${
          isMenuOpenAtTop ? "" : "sticky top-0"
        } ${
          show ? "translate-y-0" : "-translate-y-full"
        } ${activeMenu ? "bg-[#f3f8ff]" : "bg-white md:bg-white/90 md:backdrop-blur-md"} shadow-[0px_1px_24px_0px_rgba(0,0,0,0.04)] md:shadow-[0px_1px_75px_0px_rgba(0,0,0,0.1)]`}
      >
        {/* Header-level dark overlay — dims header bar but nav (z-[60]) and mega menu (z-[60]) sit above it */}
        {activeMenu && (
          <div className="absolute inset-0 bg-black/25 z-[55] pointer-events-none transition-opacity duration-300 rounded-none" />
        )}
        <div className="w-full max-w-[1280px] mx-auto px-[21.9px] lg:px-[28px] xl:px-[35px] h-[63px] md:h-[41.1px] lg:h-[54px] xl:h-[67px]">
          <div className="flex justify-between items-center h-full">
            {/* Desktop Logo (#5640:8231 on 785px: 102.29px x 22.81px / 1280px: 139px x 31px) */}
            <div className="hidden md:flex items-center justify-start shrink-0">
              <Link
                href="/"
                className="flex items-center gap-[4.9px] lg:gap-[6.5px] xl:gap-[8px]"
              >
                <img
                  src="/nba_logo1.svg"
                  alt="Nothing But Adventures Icon"
                  className="w-[18.4px] h-[18.7px] lg:w-[24px] lg:h-[24.5px] xl:w-[30px] xl:h-[30.5px] object-contain transition-all duration-300"
                />
                <img
                  src="/new_ssss.svg"
                  alt="Nothing But Adventures"
                  className="w-[62px] h-[19px] lg:w-[81px] lg:h-[25px] xl:w-[101px] xl:h-[31px] object-contain transition-all duration-300"
                />
              </Link>
            </div>

            {/* Mobile Logo: 105.44px x 23.52px (Icon 22.76px x 23.13px, Text 76.62px x 23.52px, Gap 6.06px) */}
            <div className="flex md:hidden items-center justify-start shrink-0">
              <Link href="/" className="flex items-center gap-[6.06px]">
                <img
                  src="/nba_logo1.svg"
                  alt="Nothing But Adventures Icon"
                  className="w-[22.76px] h-[23.13px] object-contain"
                />
                <div className="flex flex-col justify-center select-none text-left">
                  <span className="font-outfit font-normal text-[9.86px] text-[#1A1A1A] leading-[0.87em] tracking-[-0.01em]">
                    Nothing but
                  </span>
                  <span className="font-gochi font-normal text-[15.17px] text-[#1A1A1A] leading-[0.87em]">
                    Adventures.
                  </span>
                </div>
              </Link>
            </div>

            {/* Desktop Navigation (#5640:8226 / #5640:8238 on 785px: 23.3px height, rounded 7.36px / 1280px: 38px height, rounded 12px) */}
            <div className="hidden md:flex justify-center items-center">
              <nav
                className={`relative z-[60] flex items-center h-[23.3px] lg:h-[30px] xl:h-[38px] rounded-[7.4px] lg:rounded-[9.5px] xl:rounded-[12px] p-[1.5px] lg:p-[2px] xl:p-[2.5px] gap-[1px] lg:gap-0.5 xl:gap-1 transition-colors duration-200 ${activeMenu ? "bg-white shadow-xs" : "bg-[rgba(181,185,177,0.15)]"}`}
              >
                <button
                  type="button"
                  onMouseEnter={() => handleMenuEnter("destinations")}
                  onClick={() => {
                    setActiveMenu("destinations");
                  }}
                  aria-expanded={activeMenu === "destinations"}
                  className={`flex items-center justify-center h-[20.2px] lg:h-[26px] xl:h-[33px] px-2 lg:px-3.5 xl:px-5 rounded-[5.5px] lg:rounded-[7px] xl:rounded-[9px] font-outfit text-[9.8px] lg:text-[13px] xl:text-[16px] leading-none cursor-pointer whitespace-nowrap transition-colors duration-150 ${
                    activeMenu === "destinations"
                      ? "bg-[#1A1A1A] text-white font-normal shadow-xs"
                      : "text-[#1A1A1A] font-light hover:text-black"
                  }`}
                >
                  <span>Destination</span>
                </button>
                <button
                  type="button"
                  onMouseEnter={() => handleMenuEnter("adventures")}
                  onClick={() => {
                    setActiveMenu("adventures");
                  }}
                  aria-expanded={activeMenu === "adventures"}
                  className={`flex items-center justify-center h-[20.2px] lg:h-[26px] xl:h-[33px] px-2 lg:px-3.5 xl:px-5 rounded-[5.5px] lg:rounded-[7px] xl:rounded-[9px] font-outfit text-[9.8px] lg:text-[13px] xl:text-[16px] leading-none cursor-pointer whitespace-nowrap transition-colors duration-150 ${
                    activeMenu === "adventures"
                      ? "bg-[#1A1A1A] text-white font-normal shadow-xs"
                      : "text-[#1A1A1A] font-light hover:text-black"
                  }`}
                >
                  <span>Adventure</span>
                </button>
                <button
                  type="button"
                  onMouseEnter={() => handleMenuEnter("interests")}
                  onClick={() => {
                    setActiveMenu("interests");
                  }}
                  aria-expanded={activeMenu === "interests"}
                  className={`flex items-center justify-center h-[20.2px] lg:h-[26px] xl:h-[33px] px-2 lg:px-3.5 xl:px-5 rounded-[5.5px] lg:rounded-[7px] xl:rounded-[9px] font-outfit text-[9.8px] lg:text-[13px] xl:text-[16px] leading-none cursor-pointer whitespace-nowrap transition-colors duration-150 ${
                    activeMenu === "interests"
                      ? "bg-[#1A1A1A] text-white font-normal shadow-xs"
                      : "text-[#1A1A1A] font-light hover:text-black"
                  }`}
                >
                  <span>Explore by Interest</span>
                </button>
                <button
                  type="button"
                  onMouseEnter={() => handleMenuEnter("deals")}
                  onClick={() => {
                    setActiveMenu("deals");
                  }}
                  aria-expanded={activeMenu === "deals"}
                  className={`flex items-center justify-center h-[20.2px] lg:h-[26px] xl:h-[33px] px-2 lg:px-3.5 xl:px-5 rounded-[5.5px] lg:rounded-[7px] xl:rounded-[9px] font-outfit text-[9.8px] lg:text-[13px] xl:text-[16px] leading-none cursor-pointer whitespace-nowrap transition-colors duration-150 ${
                    activeMenu === "deals"
                      ? "bg-[#1A1A1A] text-white font-normal shadow-xs"
                      : "text-[#1A1A1A] font-light hover:text-black"
                  }`}
                >
                  <span>Deals</span>
                </button>
                <button
                  type="button"
                  onMouseEnter={() => handleMenuEnter("why-us")}
                  onClick={() => {
                    setActiveMenu("why-us");
                  }}
                  aria-expanded={activeMenu === "why-us"}
                  className={`flex items-center justify-center h-[20.2px] lg:h-[26px] xl:h-[33px] px-2 lg:px-3.5 xl:px-5 rounded-[5.5px] lg:rounded-[7px] xl:rounded-[9px] font-outfit text-[9.8px] lg:text-[13px] xl:text-[16px] leading-none cursor-pointer whitespace-nowrap transition-colors duration-150 ${
                    activeMenu === "why-us"
                      ? "bg-[#1A1A1A] text-white font-normal shadow-xs"
                      : "text-[#1A1A1A] font-light hover:text-black"
                  }`}
                >
                  <span>Why us</span>
                </button>
              </nav>
            </div>

            {/* User Authentication & Action (#5640:8223 on 785px: 52.26px x 14.52px / 1280px: 85.21px x 23.67px) */}
            <div className="hidden md:flex items-center justify-end shrink-0 w-[52.3px] lg:w-[68px] xl:w-[85.21px] gap-[23.2px] lg:gap-[30px] xl:gap-[37.87px]">
              {isLoading ? (
                <div className="flex items-center space-x-2 animate-pulse">
                  <div className="w-[14.5px] h-[14.5px] lg:w-[19px] lg:h-[19px] xl:w-[23.67px] xl:h-[23.67px] bg-gray-200 rounded-full"></div>
                </div>
              ) : (
                <>
                  {/* Call Icon */}
                  <a
                    href="tel:+1234567890"
                    className="flex items-center justify-center w-[14.5px] h-[14.5px] lg:w-[19px] lg:h-[19px] xl:w-[23.67px] xl:h-[23.67px] shrink-0 transition-opacity hover:opacity-75 cursor-pointer"
                    aria-label="Call us"
                  >
                    <img
                      src="/phone-nba.svg"
                      alt="Call"
                      className="w-full h-full object-contain"
                    />
                  </a>

                  {/* Profile Icon */}
                  {user ? (
                    <div className="relative flex items-center shrink-0">
                      <button
                        onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                        className="flex items-center justify-center w-[14.5px] h-[14.5px] lg:w-[19px] lg:h-[19px] xl:w-[23.67px] xl:h-[23.67px] rounded-full overflow-hidden shrink-0 transition-opacity hover:opacity-75 cursor-pointer"
                        aria-label="User profile"
                      >
                        {user.avatar || user.photo ? (
                          <img
                            src={user.avatar || user.photo}
                            alt={user.name || "Profile"}
                            className="w-full h-full object-cover rounded-full border border-black/25"
                          />
                        ) : (
                          <img
                            src="/user-nba.svg"
                            alt="Profile"
                            className="w-full h-full object-contain"
                          />
                        )}
                      </button>

                      {/* User Dropdown */}
                      {isUserMenuOpen && (
                        <div className="absolute right-0 top-full mt-3 w-64 bg-white rounded-2xl shadow-xl border border-gray-100 py-3 z-50 font-sans">
                          <div className="px-5 py-3 border-b border-gray-100 mb-2">
                            <p className="text-sm font-bold text-[#3F3F42]">
                              {user.name}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {user.email}
                            </p>
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide bg-blue-100 text-blue-800 mt-2">
                              {user.role}
                            </span>
                          </div>

                          <Link
                            href="/dashboard"
                            className="flex items-center px-5 py-2.5 text-sm text-[#3F3F42] hover:bg-gray-50 hover:text-[#3F3F42] transition-colors"
                            onClick={() => setIsUserMenuOpen(false)}
                          >
                            <span className="font-medium">Dashboard</span>
                          </Link>
                          <Link
                            href="/trips"
                            className="flex items-center px-5 py-2.5 text-sm text-[#3F3F42] hover:bg-gray-50 hover:text-[#3F3F42] transition-colors"
                            onClick={() => setIsUserMenuOpen(false)}
                          >
                            <span className="font-medium">Trips</span>
                          </Link>
                          <Link
                            href="/blogs"
                            className="flex items-center px-5 py-2.5 text-sm text-[#3F3F42] hover:bg-gray-50 hover:text-[#3F3F42] transition-colors"
                            onClick={() => setIsUserMenuOpen(false)}
                          >
                            <span className="font-medium">Blog</span>
                          </Link>
                          <Link
                            href="/wallet"
                            className="flex items-center px-5 py-2.5 text-sm text-[#3F3F42] hover:bg-gray-50 hover:text-[#3F3F42] transition-colors"
                            onClick={() => setIsUserMenuOpen(false)}
                          >
                            <span className="font-medium">
                              Wallet ($
                              {(user.walletBalance || 0).toLocaleString()})
                            </span>
                          </Link>

                          <div className="my-2 border-t border-gray-100"></div>

                          <Link
                            href="/profile"
                            className="flex items-center px-5 py-2.5 text-sm text-[#3F3F42] hover:bg-gray-50 transition-colors"
                            onClick={() => setIsUserMenuOpen(false)}
                          >
                            My Profile
                          </Link>

                          <Link
                            href="/wishlist"
                            className="flex items-center px-5 py-2.5 text-sm text-[#3F3F42] hover:bg-gray-50 transition-colors"
                            onClick={() => setIsUserMenuOpen(false)}
                          >
                            My Wishlist
                          </Link>

                          <Link
                            href="/profile/settings"
                            className="flex items-center px-5 py-2.5 text-sm text-[#3F3F42] hover:bg-gray-50 transition-colors"
                            onClick={() => setIsUserMenuOpen(false)}
                          >
                            Account Settings
                          </Link>

                          {(user.role === "affiliate" || user.role === "partner") && (
                            <>
                              <Link
                                href="/dashboard/affiliate"
                                className="flex items-center px-5 py-2.5 text-sm text-[#3F3F42] hover:bg-gray-50 transition-colors"
                                onClick={() => setIsUserMenuOpen(false)}
                              >
                                <span className="font-medium">Affiliate Overview</span>
                              </Link>
                              <Link
                                href="/affiliate/admin"
                                className="flex items-center gap-2 px-5 py-2.5 text-sm text-zinc-900 font-semibold hover:bg-gray-50 transition-colors"
                                onClick={() => setIsUserMenuOpen(false)}
                              >
                                <svg className="w-4 h-4 text-zinc-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                </svg>
                                <span>Affiliate Portal</span>
                              </Link>
                            </>
                          )}

                          {(user.role === "adventure_leader" ||
                            user.role === "guide" ||
                            user.role === "leader") && (
                            <Link
                              href="/leader/admin/tours"
                              className="flex items-center gap-2 px-5 py-2.5 text-sm text-purple-700 font-semibold hover:bg-purple-50 transition-colors"
                              onClick={() => setIsUserMenuOpen(false)}
                            >
                              <span className="text-base">🧭</span>
                              <span>Adventure Leader Portal</span>
                            </Link>
                          )}

                          {user.role === "admin" && (
                            <>
                              <Link
                                href="/leader/admin/tours"
                                className="flex items-center gap-2 px-5 py-2.5 text-sm text-[#3F3F42] hover:bg-gray-50 transition-colors"
                                onClick={() => setIsUserMenuOpen(false)}
                              >
                                <span className="text-base">🧭</span>
                                <span>Leader Operations Portal</span>
                              </Link>

                              <Link
                                href="/guide"
                                className="flex items-center px-5 py-2.5 text-sm text-purple-700 font-semibold hover:bg-purple-50 transition-colors"
                                onClick={() => setIsUserMenuOpen(false)}
                              >
                                App Directory & Guide
                              </Link>

                              <Link
                                href="/admin"
                                className="flex items-center px-5 py-2.5 text-sm text-[#3F3F42] hover:bg-gray-50 transition-colors"
                                onClick={() => setIsUserMenuOpen(false)}
                              >
                                Admin Panel
                              </Link>
                            </>
                          )}

                          <div className="border-t border-gray-100 mt-2 pt-2">
                            <button
                              onClick={handleLogout}
                              className="flex items-center w-full px-5 py-2.5 text-sm text-red-600 hover:bg-red-50 font-medium transition-colors"
                            >
                              Sign Out
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <Link
                      href="/auth/login"
                      className="flex items-center justify-center w-[23.67px] h-[23.67px] shrink-0 transition-opacity hover:opacity-75 cursor-pointer"
                      aria-label="Sign in"
                    >
                      <img
                        src="/user-nba.svg"
                        alt="Profile"
                        className="w-[23.67px] h-[23.67px]"
                      />
                    </Link>
                  )}
                </>
              )}
            </div>

            {/* Mobile Menu Toggle Button (Hamburger / Close matching Figma #5823:911 & Menu Button.svg) */}
            <div className="flex md:hidden items-center justify-center w-[36px] h-[24px] shrink-0">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsMenuOpen((prev) => !prev);
                }}
                aria-label={isMenuOpen ? "Close menu" : "Open menu"}
                className="w-full h-full flex items-center justify-center cursor-pointer focus:outline-none select-none relative"
              >
                <div className="relative w-[36px] h-[21px] flex items-center justify-center">
                  {/* Close Icon */}
                  <div
                    className={`absolute inset-0 flex items-center justify-center transition-all duration-300 ease-out ${
                      isMenuOpen
                        ? "opacity-100 rotate-0 scale-100"
                        : "opacity-0 -rotate-90 scale-75 pointer-events-none"
                    }`}
                  >
                    <svg
                      className="w-[19px] h-[17px] text-[#121212]"
                      viewBox="0 0 19 17"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M3.248 0L9.492 7.2493L15.736 0H19L11.211 8.5L19 17H15.736L9.492 9.9831L3.248 17H0L7.695 8.5L0 0H3.248Z"
                        fill="currentColor"
                      />
                    </svg>
                  </div>

                  {/* Menu Button Icon */}
                  <div
                    className={`absolute inset-0 flex items-center justify-center transition-all duration-300 ease-out ${
                      !isMenuOpen
                        ? "opacity-100 rotate-0 scale-100"
                        : "opacity-0 rotate-90 scale-75 pointer-events-none"
                    }`}
                  >
                    <img
                      src="/Menu Button.svg"
                      alt="Menu"
                      className="w-[36px] h-[21px] object-contain"
                    />
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Mega Menus — sits above the dark overlay */}
        <div
          className="relative z-[60]"
          onMouseEnter={() => {
            if (hoverTimeoutRef.current) {
              clearTimeout(hoverTimeoutRef.current);
            }
          }}
          onMouseLeave={handleMenuLeave}
        >
          <WhyUsMegaMenu
            isHovered={activeMenu === "why-us"}
            closeMenu={() => setActiveMenu(null)}
          />
          <DealsMegaMenu isHovered={activeMenu === "deals"} />
          <HeaderMegaMenu
            activeMenu={activeMenu}
            closeMenu={() => setActiveMenu(null)}
          />
        </div>
      </header>

      {/* Mobile Drawer Backdrop */}
      <div
        className={`fixed inset-0 top-[63px] bg-black/40 backdrop-blur-[2px] transition-opacity duration-300 ease-out z-40 md:hidden ${
          isMenuOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setIsMenuOpen(false)}
      />

      {/* Slide-over White Drawer (rect: x 120, y 63, width 282, height 811, fill: white) */}
      <div
        className={`fixed top-[63px] right-0 bottom-0 w-[282px] max-w-[80vw] bg-white flex flex-col justify-between z-50 md:hidden overflow-y-auto font-outfit border-l border-black/[0.08] transform transition-transform duration-350 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          isMenuOpen ? "translate-x-0" : "translate-x-full pointer-events-none"
        }`}
      >
        {/* Top Navigation Items */}
        <div className="flex flex-col w-full">
          {/* 1. Destination (Accordion with Continents) */}
          <div
            className="w-full border-b"
            style={{ borderColor: "rgba(0, 0, 0, 0.04)" }}
          >
            <button
              type="button"
              onClick={() => {
                setIsDestinationOpen(!isDestinationOpen);
              }}
              className={`flex items-center justify-between h-[34px] px-4 text-[14px] font-normal text-[#1A1A1A] transition-colors w-full tracking-normal cursor-pointer ${
                isDestinationOpen ? "bg-[#F4F5F3]" : "hover:bg-[#F4F5F3]"
              }`}
            >
              <span>Destination</span>
              <svg
                className={`w-4 h-4 transition-transform duration-200 ${
                  isDestinationOpen ? "rotate-90 text-black" : "text-[#1A1A1A]"
                }`}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M9 18l6-6-6-6" />
              </svg>
            </button>

            {/* Continents List */}
            {isDestinationOpen && (
              <div
                className="bg-[#FAFBF9] border-t flex flex-col animate-in slide-in-from-top-1 duration-150"
                style={{ borderColor: "rgba(0, 0, 0, 0.04)" }}
              >
                {continents.map((continent) => (
                  <Link
                    key={continent.slug || continent.name}
                    href={`/destinations/${continent.slug || continent.name.toLowerCase().replace(/\s+/g, "-")}`}
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center justify-between pl-6 pr-4 py-2 text-[13px] text-[#1A1A1A]/85 hover:text-black hover:bg-[#F4F5F3] border-b transition-colors"
                    style={{ borderColor: "rgba(0, 0, 0, 0.03)" }}
                  >
                    <span>{continent.name}</span>
                    <span className="text-[10px] text-black/40">
                      Explore &rarr;
                    </span>
                  </Link>
                ))}
                <Link
                  href="/destinations"
                  onClick={() => setIsMenuOpen(false)}
                  className="pl-6 pr-4 py-2 text-[12.5px] font-medium text-[#254B02] hover:bg-[#F4F5F3] transition-colors"
                >
                  All Destinations &rarr;
                </Link>
              </div>
            )}
          </div>

          {/* 2. Adventure (Accordion with Travel Styles) */}
          <div
            className="w-full border-b"
            style={{ borderColor: "rgba(0, 0, 0, 0.04)" }}
          >
            <button
              type="button"
              onClick={() => {
                setIsAdventureOpen(!isAdventureOpen);
              }}
              className={`flex items-center justify-between h-[34px] px-4 text-[14px] font-normal text-[#1A1A1A] transition-colors w-full tracking-normal cursor-pointer ${
                isAdventureOpen ? "bg-[#F4F5F3]" : "hover:bg-[#F4F5F3]"
              }`}
            >
              <span>Adventure</span>
              <svg
                className={`w-4 h-4 transition-transform duration-200 ${
                  isAdventureOpen ? "rotate-90 text-black" : "text-[#1A1A1A]"
                }`}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M9 18l6-6-6-6" />
              </svg>
            </button>

            {/* Travel Styles List */}
            {isAdventureOpen && (
              <div
                className="bg-[#FAFBF9] border-t flex flex-col animate-in slide-in-from-top-1 duration-150"
                style={{ borderColor: "rgba(0, 0, 0, 0.04)" }}
              >
                {travelStyles.map((style) => (
                  <Link
                    key={style.slug || style.name}
                    href={`/travel-styles/${style.slug || style.name.toLowerCase().replace(/\s+/g, "-")}`}
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center justify-between pl-6 pr-4 py-2 text-[13px] text-[#1A1A1A]/85 hover:text-black hover:bg-[#F4F5F3] border-b transition-colors"
                    style={{ borderColor: "rgba(0, 0, 0, 0.03)" }}
                  >
                    <span>{style.name}</span>
                    <span className="text-[10px] text-black/40">
                      View &rarr;
                    </span>
                  </Link>
                ))}
                <Link
                  href="/trips"
                  onClick={() => setIsMenuOpen(false)}
                  className="pl-6 pr-4 py-2 text-[12.5px] font-medium text-[#254B02] hover:bg-[#F4F5F3] transition-colors"
                >
                  All Adventures &rarr;
                </Link>
              </div>
            )}
          </div>

          {/* 3. Deals */}
          <div
            className="w-full border-b"
            style={{ borderColor: "rgba(0, 0, 0, 0.04)" }}
          >
            <Link
              href="/deals"
              onClick={() => setIsMenuOpen(false)}
              className="flex items-center h-[34px] px-4 text-[14px] font-normal text-[#1A1A1A] hover:bg-[#F4F5F3] transition-colors w-full tracking-normal"
            >
              Deals
            </Link>
          </div>

          {/* 4. Why Us */}
          <div
            className="w-full border-b"
            style={{ borderColor: "rgba(0, 0, 0, 0.04)" }}
          >
            <Link
              href="/why-nba"
              onClick={() => setIsMenuOpen(false)}
              className="flex items-center h-[34px] px-4 text-[14px] font-normal text-[#1A1A1A] hover:bg-[#F4F5F3] transition-colors w-full tracking-normal"
            >
              Why Us
            </Link>
          </div>
        </div>

        {/* Bottom Utility Navigation Items (Figma lines 494.75 to 630.75) */}
        <div className="flex flex-col w-full pb-16">
          {/* 5. Wishlist (Heart Icon, height: 34px) */}
          <div
            className="w-full border-t border-b"
            style={{ borderColor: "rgba(0, 0, 0, 0.04)" }}
          >
            <Link
              href="/wishlist"
              onClick={() => setIsMenuOpen(false)}
              className="flex items-center gap-3 h-[34px] px-4 text-[14px] font-normal text-[#1A1A1A] hover:bg-[#F4F5F3] transition-colors w-full tracking-normal"
            >
              <svg
                className="w-4 h-4 text-[#1A1A1A] shrink-0"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
              <span>Wishlist</span>
            </Link>
          </div>

          {/* 6. Manage bookings (User Profile Icon, height: 34px) */}
          <div
            className="w-full border-b"
            style={{ borderColor: "rgba(0, 0, 0, 0.04)" }}
          >
            <Link
              href={user ? "/dashboard" : "/auth/login"}
              onClick={() => setIsMenuOpen(false)}
              className="flex items-center gap-3 h-[34px] px-4 text-[14px] font-normal text-[#1A1A1A] hover:bg-[#F4F5F3] transition-colors w-full tracking-normal"
            >
              <svg
                className="w-4 h-4 text-[#1A1A1A] shrink-0"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              <span>Manage bookings</span>
            </Link>
          </div>

          {/* 7. Contact Us (Phone Icon, height: 34px) */}
          <div
            className="w-full border-b"
            style={{ borderColor: "rgba(0, 0, 0, 0.04)" }}
          >
            <a
              href="tel:+911234567890"
              onClick={() => setIsMenuOpen(false)}
              className="flex items-center gap-3 h-[34px] px-4 text-[14px] font-normal text-[#1A1A1A] hover:bg-[#F4F5F3] transition-colors w-full tracking-normal"
            >
              <svg
                className="w-4 h-4 text-[#1A1A1A] shrink-0"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
              </svg>
              <span>Contact Us</span>
            </a>
          </div>

          {/* 8. Subscribe to Emails (Mail Icon, height: 34px) */}
          <div
            className="w-full border-b"
            style={{ borderColor: "rgba(0, 0, 0, 0.04)" }}
          >
            <a
              href="#subscribe"
              onClick={(e) => {
                setIsMenuOpen(false);
                const el = document.querySelector("#subscribe");
                if (el) {
                  e.preventDefault();
                  el.scrollIntoView({ behavior: "smooth" });
                }
              }}
              className="flex items-center gap-3 h-[34px] px-4 text-[14px] font-normal text-[#1A1A1A] hover:bg-[#F4F5F3] transition-colors w-full tracking-normal"
            >
              <svg
                className="w-4 h-4 text-[#1A1A1A] shrink-0"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                <polyline points="22,6 12,13 2,6" />
              </svg>
              <span>Subscribe to Emails</span>
            </a>
          </div>
        </div>
      </div>
    </>
  );
}
