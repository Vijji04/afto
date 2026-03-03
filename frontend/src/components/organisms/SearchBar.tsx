"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { getSuggestions } from "@/lib/api";
import type { Suggestion } from "@/types";

export function SearchBar() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const fetchSuggestions = useCallback(async (q: string) => {
    if (q.trim().length < 2) {
      setSuggestions([]);
      return;
    }
    try {
      const result = await getSuggestions(q);
      setSuggestions(result.suggestions);
      setShowSuggestions(true);
    } catch {
      setSuggestions([]);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(query), 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, fetchSuggestions]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (query.trim()) {
      setShowSuggestions(false);
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((prev) => Math.min(prev + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prev) => Math.max(prev - 1, -1));
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
    } else if (e.key === "Enter" && activeIndex >= 0) {
      e.preventDefault();
      const s = suggestions[activeIndex];
      setShowSuggestions(false);
      router.push(`/product/${s.id}`);
    }
  }

  function handleSuggestionClick(s: Suggestion) {
    setShowSuggestions(false);
    setQuery(s.name);
    router.push(`/product/${s.id}`);
  }

  return (
    <div ref={wrapperRef} className="relative w-full max-w-xl">
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setActiveIndex(-1);
          }}
          onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search for groceries..."
          className="w-full rounded-lg border border-beige bg-white px-4 py-2.5 text-sm text-chocolate placeholder:text-brown/50 focus:border-terracotta focus:outline-none focus:ring-2 focus:ring-terracotta/20"
        />
      </form>
      {showSuggestions && suggestions.length > 0 && (
        <ul className="absolute z-50 mt-1 w-full rounded-lg border border-beige bg-white shadow-lg">
          {suggestions.map((s, i) => (
            <li
              key={s.id}
              className={`cursor-pointer px-4 py-2.5 text-sm ${
                i === activeIndex ? "bg-cream text-terracotta" : "text-chocolate hover:bg-cream"
              }`}
              onMouseDown={() => handleSuggestionClick(s)}
              onMouseEnter={() => setActiveIndex(i)}
            >
              <span className="font-medium">{s.name}</span>
              <span className="ml-2 text-xs text-brown">{s.category}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
