"use client";

import React, { useState, useEffect } from "react";
import { api } from "@/lib/api";

export interface AdventureLeaderItem {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
  phone?: string;
  nationality?: string;
  role: string;
}

interface AssignLeaderModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedLeaderIds: string[];
  onSave: (leaderIds: string[], leaderObjects: AdventureLeaderItem[]) => void;
}

export default function AssignLeaderModal({
  isOpen,
  onClose,
  selectedLeaderIds,
  onSave,
}: AssignLeaderModalProps) {
  const [leaders, setLeaders] = useState<AdventureLeaderItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Local selection state
  const [tempSelectedIds, setTempSelectedIds] = useState<string[]>([]);
  const [selectedMap, setSelectedMap] = useState<Record<string, AdventureLeaderItem>>({});

  useEffect(() => {
    if (isOpen) {
      setTempSelectedIds([...selectedLeaderIds]);
      setSearchTerm("");
      fetchLeaders();
    }
  }, [isOpen, selectedLeaderIds]);

  const fetchLeaders = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const url = `${api.baseURL}/tours/adventure-leaders`;

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const json = await res.json();
        const list: AdventureLeaderItem[] = json.data?.leaders || [];
        setLeaders(list);

        // Populate map
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
      console.error("Error fetching adventure leaders:", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredLeaders = leaders.filter(
    (lead) =>
      lead.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.nationality?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleSelect = (leader: AdventureLeaderItem) => {
    const id = leader._id;
    if (tempSelectedIds.includes(id)) {
      setTempSelectedIds((prev) => prev.filter((item) => item !== id));
    } else {
      setTempSelectedIds((prev) => [...prev, id]);
      setSelectedMap((prev) => ({ ...prev, [id]: leader }));
    }
  };

  const removeSelected = (id: string) => {
    setTempSelectedIds((prev) => prev.filter((item) => item !== id));
  };

  const handleConfirm = () => {
    const objects = tempSelectedIds.map(
      (id) => selectedMap[id] || { _id: id, name: "Leader", email: "", role: "adventure_leader" }
    );
    onSave(tempSelectedIds, objects);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="bg-white rounded-xl shadow-2xl border border-gray-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-zinc-900 text-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center text-white">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div>
              <h2 className="text-base font-bold text-white leading-tight">
                Assign Adventure Leaders (Field Guides)
              </h2>
              <p className="text-xs text-zinc-400">
                Select the team members who will accompany travelers and manage the live tour
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="w-7 h-7 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 flex items-center justify-center transition"
          >
            ✕
          </button>
        </div>

        {/* Selected Leaders Chips */}
        {tempSelectedIds.length > 0 && (
          <div className="px-6 py-3 bg-zinc-50 border-b border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
                Selected Leaders ({tempSelectedIds.length})
              </span>
              <button
                type="button"
                onClick={() => setTempSelectedIds([])}
                className="text-[11px] text-red-600 hover:text-red-700 font-semibold"
              >
                Clear All
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
              {tempSelectedIds.map((id) => {
                const item = selectedMap[id];
                const name = item?.name || "Leader";
                return (
                  <span
                    key={id}
                    className="inline-flex items-center gap-1.5 pl-2 pr-1 py-1 rounded-md text-xs bg-white text-zinc-800 border border-zinc-300 shadow-2xs"
                  >
                    <span className="font-semibold">{name}</span>
                    <button
                      type="button"
                      onClick={() => removeSelected(id)}
                      className="w-4 h-4 rounded hover:bg-zinc-100 text-zinc-400 hover:text-zinc-700 flex items-center justify-center text-xs"
                    >
                      ×
                    </button>
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {/* Search Input */}
        <div className="p-4 border-b border-gray-100">
          <div className="relative">
            <input
              type="text"
              placeholder="Search leader by name, email, nationality..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-zinc-900 bg-white"
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
        </div>

        {/* Leaders List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2 min-h-[220px]">
          {loading ? (
            <div className="p-8 text-center text-xs text-gray-500 space-y-2">
              <div className="w-6 h-6 border-2 border-zinc-900 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p>Loading adventure leaders...</p>
            </div>
          ) : filteredLeaders.length === 0 ? (
            <div className="p-8 text-center text-xs text-gray-500">
              <p className="font-semibold text-zinc-800 mb-1">No adventure leaders found</p>
              <p>Ensure team members have the role &quot;adventure_leader&quot; or &quot;guide&quot; assigned in Users management.</p>
            </div>
          ) : (
            filteredLeaders.map((lead) => {
              const isSelected = tempSelectedIds.includes(lead._id);
              return (
                <div
                  key={lead._id}
                  onClick={() => toggleSelect(lead)}
                  className={`p-3 rounded-lg border flex items-center justify-between cursor-pointer transition-all ${
                    isSelected
                      ? "bg-zinc-900 text-white border-zinc-900 shadow-xs"
                      : "bg-white text-zinc-800 border-gray-200 hover:border-zinc-400 hover:bg-gray-50/50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                        isSelected ? "bg-white text-zinc-900" : "bg-zinc-100 text-zinc-700 border border-zinc-200"
                      }`}
                    >
                      {lead.name ? lead.name[0].toUpperCase() : "L"}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs leading-tight">
                          {lead.name}
                        </span>
                        <span
                          className={`text-[10px] font-semibold px-1.5 py-0.2 rounded border ${
                            isSelected
                              ? "bg-zinc-800 text-zinc-200 border-zinc-700"
                              : "bg-purple-50 text-purple-700 border-purple-200"
                          }`}
                        >
                          Adventure Leader
                        </span>
                      </div>
                      <p className={`text-[11px] ${isSelected ? "text-zinc-300" : "text-gray-500"}`}>
                        {lead.email} {lead.phone ? `• ${lead.phone}` : ""}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    {lead.nationality && (
                      <span className={`text-[11px] ${isSelected ? "text-zinc-300" : "text-gray-400"}`}>
                        {lead.nationality}
                      </span>
                    )}
                    <div
                      className={`w-5 h-5 rounded-md flex items-center justify-center border transition-colors ${
                        isSelected
                          ? "bg-white text-zinc-900 border-white"
                          : "border-gray-300 bg-white"
                      }`}
                    >
                      {isSelected && (
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
          <span className="text-xs text-gray-500">
            {tempSelectedIds.length} {tempSelectedIds.length === 1 ? "leader" : "leaders"} selected
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 border border-gray-300 text-zinc-700 hover:bg-gray-100 rounded-md text-xs font-semibold transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className="px-4 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-md text-xs font-semibold shadow-xs transition"
            >
              Save Assigned Leaders ({tempSelectedIds.length})
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
