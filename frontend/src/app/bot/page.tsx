"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { botApi, BotMessage, BotTourFilters, QuickPrompt } from "@/lib/botApi";
import TourCard from "@/components/TourCard";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  tours?: Array<any>;
  suggestedQuestions?: string[];
  timestamp: string;
}

export default function BotPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Hello! I am your **Nothing But Adventures AI Assistant**.\n\nI can help you discover small-group expeditions across the world, check departure dates & pricing, or answer questions regarding our **Cancellation & Lifetime Deposit** policies.\n\nHow can I help plan your next trip today?",
      suggestedQuestions: [
        "Show me trekking tours in Nepal",
        "What are the best wildlife safaris in Africa?",
        "What is the cancellation and refund policy?",
        "Find adventures under $2500",
      ],
      timestamp: "",
    },
  ]);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [quickPrompts, setQuickPrompts] = useState<QuickPrompt[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<BotTourFilters>({
    destination: "",
    travelStyle: "",
    maxPrice: undefined,
    maxDays: undefined,
    physicalRating: undefined,
  });

  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    botApi.getQuickPrompts().then(setQuickPrompts);
    setMessages((prev) =>
      prev.map((m) =>
        m.id === "welcome" && !m.timestamp
          ? { ...m, timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) }
          : m
      )
    );
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || input).trim();
    if (!text || loading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const apiPayload: BotMessage[] = newMessages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const activeFilters: BotTourFilters = {};
      if (filters.destination) activeFilters.destination = filters.destination;
      if (filters.travelStyle) activeFilters.travelStyle = filters.travelStyle;
      if (filters.maxPrice) activeFilters.maxPrice = Number(filters.maxPrice);
      if (filters.maxDays) activeFilters.maxDays = Number(filters.maxDays);
      if (filters.physicalRating) activeFilters.physicalRating = Number(filters.physicalRating);

      const res = await botApi.sendMessage(apiPayload, activeFilters);

      const botReply: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: res.reply,
        tours: res.tours || [],
        suggestedQuestions: res.suggested_questions || [],
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, botReply]);
    } catch (err) {
      console.error("Chat error:", err);
      const errorReply: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content:
          "I'm sorry, I encountered an issue connecting to the database. Please try again.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, errorReply]);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleResetChat = () => {
    setMessages([
      {
        id: "welcome-new",
        role: "assistant",
        content:
          "Chat reset. How can I assist you with your travel plans today?",
        suggestedQuestions: [
          "Show me top popular tours",
          "What is your cancellation policy?",
          "Find trekking adventures under 10 days",
        ],
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ]);
  };

  const renderMarkdown = (text: string) => {
    return text.split("\n\n").map((paragraph, pIdx) => {
      const lines = paragraph.split("\n");
      const isList = lines.every(
        (line) =>
          line.trim().startsWith("- ") ||
          line.trim().startsWith("* ") ||
          /^\d+\.\s/.test(line.trim())
      );

      if (isList) {
        return (
          <ul key={pIdx} className="list-disc list-inside space-y-1.5 my-2 text-gray-700 text-[15px]">
            {lines.map((line, lIdx) => {
              const cleanLine = line.replace(/^[-*]\s+|\d+\.\s+/, "");
              return (
                <li key={lIdx} className="leading-relaxed">
                  {renderFormattedInline(cleanLine)}
                </li>
              );
            })}
          </ul>
        );
      }

      if (paragraph.startsWith("### ")) {
        return (
          <h3 key={pIdx} className="text-base font-bold text-gray-900 mt-3 mb-1.5">
            {paragraph.replace("### ", "")}
          </h3>
        );
      }
      if (paragraph.startsWith("## ")) {
        return (
          <h2 key={pIdx} className="text-lg font-bold text-gray-900 mt-4 mb-2">
            {paragraph.replace("## ", "")}
          </h2>
        );
      }

      return (
        <p key={pIdx} className="mb-2 leading-relaxed text-gray-800 text-[15px] last:mb-0">
          {renderFormattedInline(paragraph)}
        </p>
      );
    });
  };

  const renderFormattedInline = (str: string) => {
    const parts = str.split(/(\*\*.*?\*\*|\*.*?\*)/g);
    return parts.map((part, idx) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return (
          <strong key={idx} className="font-semibold text-gray-900">
            {part.slice(2, -2)}
          </strong>
        );
      }
      if (part.startsWith("*") && part.endsWith("*")) {
        return (
          <em key={idx} className="italic text-gray-800">
            {part.slice(1, -1)}
          </em>
        );
      }
      return part;
    });
  };

  return (
    <div className="min-h-[calc(100vh-140px)] flex flex-col bg-[#F9FAFB] text-gray-900">
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-6 md:py-8 flex flex-col">
        {/* Simple & Clean Header */}
        <div className="bg-white border border-gray-200/80 rounded-2xl p-5 mb-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-full bg-[#1A1A1A] text-white flex items-center justify-center text-xl shadow-xs">
              🧭
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-gray-900 tracking-tight">
                  NBA Travel Assistant
                </h1>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Online
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                Ask about adventures, itineraries, prices, and cancellation policies
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 border ${
                showFilters
                  ? "bg-black text-white border-black"
                  : "bg-gray-50 hover:bg-gray-100 text-gray-700 border-gray-200"
              }`}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              <span>{showFilters ? "Hide Filters" : "Filters"}</span>
            </button>

            <button
              onClick={handleResetChat}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-50 hover:bg-gray-100 text-gray-600 border border-gray-200 transition-all flex items-center gap-1.5"
              title="Reset Chat"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>Clear</span>
            </button>
          </div>
        </div>

        {/* Quick Suggestion Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-2 scrollbar-none">
          <span className="text-xs text-gray-400 font-medium whitespace-nowrap">
            Popular:
          </span>
          {quickPrompts.map((p, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(p.query)}
              className="px-3 py-1 rounded-full text-xs font-medium bg-white hover:bg-gray-100 text-gray-700 border border-gray-200/80 shadow-2xs whitespace-nowrap transition-colors"
            >
              {p.title}
            </button>
          ))}
        </div>

        {/* Compact Filters Panel */}
        {showFilters && (
          <div className="bg-white border border-gray-200 rounded-xl p-4 mb-4 shadow-xs grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Destination
              </label>
              <input
                type="text"
                placeholder="e.g. Nepal, Kenya"
                value={filters.destination || ""}
                onChange={(e) => setFilters({ ...filters, destination: e.target.value })}
                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs text-gray-800 focus:bg-white focus:outline-none focus:border-black"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Travel Style
              </label>
              <select
                value={filters.travelStyle || ""}
                onChange={(e) => setFilters({ ...filters, travelStyle: e.target.value })}
                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs text-gray-800 focus:bg-white focus:outline-none focus:border-black"
              >
                <option value="">All Styles</option>
                <option value="Classic">Classic</option>
                <option value="Active">Active & Hiking</option>
                <option value="Wildlife">Wildlife & Safari</option>
                <option value="Cultural">Cultural</option>
                <option value="Family">Family</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Max Budget (USD)
              </label>
              <input
                type="number"
                placeholder="e.g. 2500"
                value={filters.maxPrice || ""}
                onChange={(e) =>
                  setFilters({ ...filters, maxPrice: e.target.value ? Number(e.target.value) : undefined })
                }
                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs text-gray-800 focus:bg-white focus:outline-none focus:border-black"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Max Days
              </label>
              <input
                type="number"
                placeholder="e.g. 10"
                value={filters.maxDays || ""}
                onChange={(e) =>
                  setFilters({ ...filters, maxDays: e.target.value ? Number(e.target.value) : undefined })
                }
                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs text-gray-800 focus:bg-white focus:outline-none focus:border-black"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Fitness Rating
              </label>
              <select
                value={filters.physicalRating || ""}
                onChange={(e) =>
                  setFilters({
                    ...filters,
                    physicalRating: e.target.value ? Number(e.target.value) : undefined,
                  })
                }
                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs text-gray-800 focus:bg-white focus:outline-none focus:border-black"
              >
                <option value="">Any Level</option>
                <option value="1">Level 1 - Easy</option>
                <option value="2">Level 2 - Light</option>
                <option value="3">Level 3 - Moderate</option>
                <option value="4">Level 4 - Demanding</option>
                <option value="5">Level 5 - Strenuous</option>
              </select>
            </div>
          </div>
        )}

        {/* Chat Stream Box */}
        <div className="flex-1 bg-white border border-gray-200/90 rounded-2xl p-4 sm:p-6 mb-4 flex flex-col shadow-xs overflow-hidden min-h-[460px]">
          <div className="flex-1 overflow-y-auto space-y-5 pr-1">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex flex-col ${
                  m.role === "user" ? "items-end" : "items-start"
                }`}
              >
                <div
                  className={`flex gap-3 max-w-2xl ${
                    m.role === "user" ? "flex-row-reverse" : "flex-row"
                  }`}
                >
                  {/* Avatar */}
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold ${
                      m.role === "user"
                        ? "bg-[#1A1A1A] text-white"
                        : "bg-gray-100 text-gray-700 border border-gray-200"
                    }`}
                  >
                    {m.role === "user" ? "You" : "🧭"}
                  </div>

                  {/* Message Bubble */}
                  <div className="flex flex-col">
                    <div
                      className={`rounded-2xl px-4 py-3 ${
                        m.role === "user"
                          ? "bg-[#1A1A1A] text-white text-[15px]"
                          : "bg-[#F3F4F6] text-gray-900 border border-gray-200/50"
                      }`}
                    >
                      {m.role === "user" ? (
                        <p className="whitespace-pre-wrap leading-relaxed">{m.content}</p>
                      ) : (
                        <div>{renderMarkdown(m.content)}</div>
                      )}
                    </div>

                    <span suppressHydrationWarning className="text-[10px] text-gray-400 mt-1 px-1">
                      {m.timestamp}
                    </span>
                  </div>
                </div>

                {/* Embedded Tour Cards in Light Screen */}
                {m.tours && m.tours.length > 0 && (
                  <div className="w-full mt-4 pl-11">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-600 flex items-center gap-1.5">
                        <span>Matching Expeditions ({m.tours.length})</span>
                      </h4>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {m.tours.map((tour, tourIdx) => (
                        <div key={tour._id || tourIdx} className="transition-transform hover:-translate-y-1">
                          <TourCard tour={tour} />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Suggested Questions */}
                {m.suggestedQuestions && m.suggestedQuestions.length > 0 && (
                  <div className="w-full mt-2.5 pl-11 flex flex-wrap gap-1.5">
                    {m.suggestedQuestions.map((sq, sqIdx) => (
                      <button
                        key={sqIdx}
                        onClick={() => handleSend(sq)}
                        className="px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-200 transition-colors"
                      >
                        {sq}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-gray-100 text-gray-700 border border-gray-200 flex items-center justify-center flex-shrink-0 text-xs">
                  🧭
                </div>
                <div className="bg-[#F3F4F6] border border-gray-200/50 rounded-2xl px-4 py-3 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-gray-500 animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-2 h-2 rounded-full bg-gray-500 animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-2 h-2 rounded-full bg-gray-500 animate-bounce" style={{ animationDelay: "300ms" }} />
                  <span className="text-xs text-gray-500 ml-2">Searching adventures & policies...</span>
                </div>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>
        </div>

        {/* Clean Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="relative bg-white border border-gray-300 rounded-xl p-2 shadow-xs flex items-center gap-2 focus-within:border-black transition-colors"
        >
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about trips (e.g. 'Trekking tours in Nepal under 10 days' or 'Cancellation policy')..."
            className="flex-1 bg-transparent px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none"
            disabled={loading}
          />

          <button
            type="submit"
            disabled={!input.trim() || loading}
            className={`px-4 py-2 rounded-lg font-medium text-xs sm:text-sm transition-colors flex items-center gap-1.5 ${
              input.trim() && !loading
                ? "bg-[#1A1A1A] hover:bg-black text-white cursor-pointer"
                : "bg-gray-100 text-gray-400 cursor-not-allowed"
            }`}
          >
            <span>Send</span>
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </button>
        </form>

        <p className="text-[11px] text-center text-gray-400 mt-2">
          Responses are verified with Nothing But Adventures live itineraries and booking policies.
        </p>
      </main>
    </div>
  );
}
