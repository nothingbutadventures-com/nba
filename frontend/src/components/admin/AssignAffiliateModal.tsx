"use client";

import React, { useState, useEffect, useMemo } from "react";
import { api } from "@/lib/api";

export interface AffiliateItem {
  _id: string;
  user?: {
    _id?: string;
    name?: string;
    email?: string;
    avatar?: string;
  };
  companyName?: string;
  affiliateCode?: string;
  commissionRate?: number;
  tier?: string;
  status?: string;
}

interface AssignAffiliateModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedAffiliateIds: string[];
  onSave: (affiliateIds: string[], affiliateObjects: AffiliateItem[]) => void;
}

export default function AssignAffiliateModal({
  isOpen,
  onClose,
  selectedAffiliateIds,
  onSave,
}: AssignAffiliateModalProps) {
  const [affiliates, setAffiliates] = useState<AffiliateItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 8;

  // Local selection state (clone of selectedAffiliateIds)
  const [tempSelectedIds, setTempSelectedIds] = useState<string[]>([]);
  // Cached map of selected affiliate objects to retain selected chips even when paginating
  const [selectedMap, setSelectedMap] = useState<Record<string, AffiliateItem>>({});

  useEffect(() => {
    if (isOpen) {
      setTempSelectedIds([...selectedAffiliateIds]);
      setPage(1);
      setSearchTerm("");
      fetchAffiliates(1, "");
    }
  }, [isOpen, selectedAffiliateIds]);

  const fetchAffiliates = async (targetPage: number, search: string) => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      let url = `${api.baseURL}/affiliates?status=approved&page=${targetPage}&limit=${pageSize}`;
      if (search.trim()) {
        url += `&search=${encodeURIComponent(search.trim())}`;
      }

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const json = await res.json();
        const list: AffiliateItem[] = json.data?.affiliates || [];
        setAffiliates(list);
        setTotalCount(json.total || list.length);

        // Update selected map cache with fetched objects
        setSelectedMap((prev) => {
          const next = { ...prev };
          list.forEach((item) => {
            if (next[item._id] || tempSelectedIds.includes(item._id)) {
              next[item._id] = item;
            }
          });
          return next;
        });
      }
    } catch (err) {
      console.error("Error fetching affiliates:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchTerm(val);
    setPage(1);
    fetchAffiliates(1, val);
  };

  const toggleSelect = (affiliate: AffiliateItem) => {
    const id = affiliate._id;
    if (tempSelectedIds.includes(id)) {
      setTempSelectedIds((prev) => prev.filter((item) => item !== id));
    } else {
      setTempSelectedIds((prev) => [...prev, id]);
      setSelectedMap((prev) => ({ ...prev, [id]: affiliate }));
    }
  };

  const removeSelected = (id: string) => {
    setTempSelectedIds((prev) => prev.filter((item) => item !== id));
  };

  const handleSelectAllCurrent = () => {
    const newMap = { ...selectedMap };
    const newIds = new Set(tempSelectedIds);
    affiliates.forEach((a) => {
      newIds.add(a._id);
      newMap[a._id] = a;
    });
    setTempSelectedIds(Array.from(newIds));
    setSelectedMap(newMap);
  };

  const handleClearSelection = () => {
    setTempSelectedIds([]);
  };

  const handleConfirm = () => {
    const objects = tempSelectedIds.map((id) => selectedMap[id] || { _id: id });
    onSave(tempSelectedIds, objects);
    onClose();
  };

  const totalPages = Math.ceil(totalCount / pageSize) || 1;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="bg-white rounded-2xl shadow-2xl border border-gray-100 w-full max-w-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-gray-50/80 to-white">
          <div>
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <span>🤝 Assign Affiliates</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                {tempSelectedIds.length} Selected
              </span>
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Select any number of approved affiliates to link with this tour.
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-800 flex items-center justify-center transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Selected Chips Bar */}
        {tempSelectedIds.length > 0 && (
          <div className="px-6 py-2.5 bg-gray-50/80 border-b border-gray-100 flex items-center gap-2 overflow-x-auto scrollbar-none">
            <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">
              Assigned:
            </span>
            {tempSelectedIds.map((id) => {
              const aff = selectedMap[id];
              const name = aff?.user?.name || aff?.companyName || aff?.affiliateCode || id.slice(-6);
              return (
                <span
                  key={id}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-white border border-gray-200 shadow-2xs text-gray-800 whitespace-nowrap"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span>{name}</span>
                  <button
                    type="button"
                    onClick={() => removeSelected(id)}
                    className="text-gray-400 hover:text-red-500 ml-0.5"
                  >
                    ✕
                  </button>
                </span>
              );
            })}
            <button
              type="button"
              onClick={handleClearSelection}
              className="text-xs text-red-600 hover:text-red-700 font-medium whitespace-nowrap ml-auto pl-2"
            >
              Clear all
            </button>
          </div>
        )}

        {/* Search & Actions Bar */}
        <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <input
              type="text"
              placeholder="Search by name, email, company, or referral code..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm text-gray-900 placeholder-gray-400 focus:bg-white focus:outline-none focus:border-black transition-colors"
            />
            <svg
              className="w-4 h-4 text-gray-400 absolute left-3 top-2.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
            <button
              type="button"
              onClick={handleSelectAllCurrent}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
            >
              Select Page
            </button>
          </div>
        </div>

        {/* Affiliates List (Optimized & Paginated) */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2 min-h-[280px]">
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4].map((n) => (
                <div key={n} className="h-14 bg-gray-50 rounded-xl animate-pulse border border-gray-100" />
              ))}
            </div>
          ) : affiliates.length === 0 ? (
            <div className="py-12 text-center text-gray-400">
              <span className="text-3xl block mb-2">🔍</span>
              <p className="text-sm font-medium text-gray-600">No approved affiliates found</p>
              <p className="text-xs text-gray-400 mt-0.5">Try searching with a different term</p>
            </div>
          ) : (
            affiliates.map((aff) => {
              const isSelected = tempSelectedIds.includes(aff._id);
              const userName = aff.user?.name || "Affiliate Partner";
              const userEmail = aff.user?.email || "No email";
              const company = aff.companyName || "Independent Ambassador";
              const code = aff.affiliateCode || "N/A";
              const tier = (aff.tier || "bronze").toUpperCase();

              return (
                <div
                  key={aff._id}
                  onClick={() => toggleSelect(aff)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                    isSelected
                      ? "bg-emerald-50/60 border-emerald-300 shadow-2xs"
                      : "bg-white border-gray-200/80 hover:border-gray-300 hover:bg-gray-50/50"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Checkbox */}
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => {}}
                      className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-gray-300 pointer-events-none"
                    />

                    {/* Avatar Initials */}
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#1A1A1A] to-gray-700 text-white flex items-center justify-center text-xs font-bold shrink-0">
                      {userName.charAt(0).toUpperCase()}
                    </div>

                    {/* Name & Email */}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-gray-900 truncate">
                          {userName}
                        </span>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 shrink-0">
                          {tier}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-500 truncate">
                        <span>{userEmail}</span>
                        <span>•</span>
                        <span className="text-gray-600 font-medium">{company}</span>
                      </div>
                    </div>
                  </div>

                  {/* Code Badge */}
                  <div className="text-right shrink-0">
                    <span className="inline-block font-mono text-xs font-bold text-gray-800 bg-gray-100 px-2 py-1 rounded border border-gray-200">
                      {code}
                    </span>
                    <span className="block text-[10px] text-gray-400 mt-0.5">
                      {aff.commissionRate || 10}% commission
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer & Pagination */}
        <div className="px-6 py-3.5 border-t border-gray-100 bg-gray-50/80 flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Pagination Controls */}
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <span>
              Page {page} of {totalPages} ({totalCount} total)
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={page <= 1 || loading}
                onClick={() => {
                  const p = page - 1;
                  setPage(p);
                  fetchAffiliates(p, searchTerm);
                }}
                className="px-2 py-1 rounded border bg-white border-gray-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-100"
              >
                Prev
              </button>
              <button
                type="button"
                disabled={page >= totalPages || loading}
                onClick={() => {
                  const p = page + 1;
                  setPage(p);
                  fetchAffiliates(p, searchTerm);
                }}
                className="px-2 py-1 rounded border bg-white border-gray-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-100"
              >
                Next
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className="px-5 py-2 text-xs font-semibold text-white bg-[#1A1A1A] hover:bg-black rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
            >
              <span>Apply & Assign</span>
              <span className="bg-white/20 px-1.5 py-0.2 rounded-full text-[10px]">
                {tempSelectedIds.length}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
