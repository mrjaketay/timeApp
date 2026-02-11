"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useDebounce } from "@/hooks/use-debounce";
import { Card } from "@/components/ui/card";

interface SearchSuggestion {
  id: string;
  text: string;
  type?: string;
  href?: string; // Optional direct href for navigation
}

export function SearchBarWithSuggestions() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isLoading, setIsLoading] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Get search query from URL if present
  useEffect(() => {
    const query = searchParams.get("search") || "";
    setSearchQuery(query);
  }, [searchParams]);

  const debouncedSearch = useDebounce(searchQuery, 200);

  // Fetch suggestions based on current page when debounced search changes
  useEffect(() => {
    if (debouncedSearch && debouncedSearch.length >= 2) {
      fetchSuggestions(debouncedSearch);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, pathname]);

  const fetchSuggestions = async (query: string) => {
    if (!query || query.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setShowSuggestions(true); // Show loading state immediately
    
    try {
      let endpoint = "";
      
      // Determine endpoint based on current page
      console.log("[Search] Current pathname:", pathname);
      
      if (pathname.startsWith("/admin/companies")) {
        endpoint = `/api/search/companies?q=${encodeURIComponent(query)}`;
      } else if (pathname.startsWith("/admin/users")) {
        endpoint = `/api/search/users?q=${encodeURIComponent(query)}`;
      } else if (pathname.startsWith("/dashboard/employees")) {
        endpoint = `/api/search/employees?q=${encodeURIComponent(query)}`;
      } else if (pathname.startsWith("/dashboard/attendance")) {
        // Both /dashboard/attendance and /dashboard/attendance/manage use the same search
        endpoint = `/api/search/attendance?q=${encodeURIComponent(query)}`;
      } else if (pathname.startsWith("/dashboard/nfc-cards")) {
        endpoint = `/api/search/nfc-cards?q=${encodeURIComponent(query)}`;
      } else if (pathname.startsWith("/dashboard/locations")) {
        // Locations page can search for employees
        endpoint = `/api/search/employees?q=${encodeURIComponent(query)}`;
      } else if (pathname.startsWith("/dashboard")) {
        // For other dashboard pages, use employees search as fallback
        endpoint = `/api/search/employees?q=${encodeURIComponent(query)}`;
      } else if (pathname.startsWith("/admin")) {
        // For other admin pages, use companies search as fallback
        endpoint = `/api/search/companies?q=${encodeURIComponent(query)}`;
      }
      
      console.log("[Search] Selected endpoint:", endpoint);

      if (endpoint) {
        console.log("[Search] Fetching suggestions from:", endpoint);
        const response = await fetch(endpoint, {
          method: "GET",
          cache: "no-store",
          credentials: "include",
        });
        
        console.log("[Search] Response status:", response.status);
        
        if (response.ok) {
          const data = await response.json();
          console.log("[Search] Received data:", data);
          const fetchedSuggestions = data.suggestions || [];
          console.log("[Search] Setting suggestions:", fetchedSuggestions.length, fetchedSuggestions);
          
          // Update state together to avoid race conditions
          setSuggestions(fetchedSuggestions);
          setIsLoading(false);
          
          // Always show dropdown if we have suggestions
          if (fetchedSuggestions.length > 0) {
            console.log("[Search] Showing suggestions dropdown with", fetchedSuggestions.length, "items");
            setShowSuggestions(true);
          } else {
            console.log("[Search] No suggestions to show");
            setShowSuggestions(false);
          }
        } else {
          const errorText = await response.text();
          console.error("Search API error:", response.status, response.statusText, errorText);
          setSuggestions([]);
          setShowSuggestions(false);
          setIsLoading(false);
        }
      } else {
        console.log("[Search] No endpoint for pathname:", pathname);
        setSuggestions([]);
        setShowSuggestions(false);
        setIsLoading(false);
      }
    } catch (error) {
      console.error("Error fetching suggestions:", error);
      setSuggestions([]);
      setShowSuggestions(false);
      setIsLoading(false);
    }
  };

  const handleSearch = (query: string) => {
    const params = new URLSearchParams(searchParams.toString());
    
    if (query) {
      params.set("search", query);
    } else {
      params.delete("search");
    }
    
    params.delete("page");
    
    const newUrl = `${pathname}${params.toString() ? `?${params.toString()}` : ""}`;
    router.push(newUrl);
    setShowSuggestions(false);
    inputRef.current?.blur();
  };

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    console.log("[Search] Suggestion clicked:", suggestion);
    setShowSuggestions(false);
    inputRef.current?.blur();

    // If href is provided, use it directly
    if (suggestion.href) {
      router.push(suggestion.href);
      return;
    }

    // Navigate based on suggestion type and current page
    if (suggestion.type === "Company") {
      // Navigate to company detail page
      router.push(`/admin/companies/${suggestion.id}`);
    } else if (suggestion.type === "Employee") {
      // Navigate to employee detail page using employee profile ID
      router.push(`/dashboard/employees/${suggestion.id}`);
    } else if (suggestion.type === "Attendance" || suggestion.type === "User") {
      // For attendance/users, search for that user
      handleSearch(suggestion.text);
    } else if (suggestion.type === "NFC Card") {
      // Navigate to NFC cards page with search
      router.push(`/dashboard/nfc-cards?search=${encodeURIComponent(suggestion.text)}`);
    } else {
      // Default: just search
      handleSearch(suggestion.text);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => 
        prev < suggestions.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (selectedIndex >= 0 && suggestions[selectedIndex]) {
        handleSearch(suggestions[selectedIndex].text);
      } else {
        handleSearch(searchQuery);
      }
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
      inputRef.current?.blur();
    }
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        // Only close if we're not clicking on a suggestion or the dropdown itself
        const target = event.target as HTMLElement;
        if (
          !target.closest('[data-suggestion-item]') &&
          !target.closest('[data-suggestion-dropdown]')
        ) {
          setShowSuggestions(false);
        }
      }
    };

    // Use a slight delay to allow click events on suggestions to fire first
    const timeoutId = setTimeout(() => {
      document.addEventListener("mousedown", handleClickOutside);
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="relative w-full" ref={searchRef}>
      <div className="relative flex items-center gap-1">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4 z-10 pointer-events-none" />
          <Input
            ref={inputRef}
            type="search"
            placeholder="Search..."
            value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setSelectedIndex(-1);
            // Clear suggestions immediately if query is too short
            if (e.target.value.length < 2) {
              setSuggestions([]);
              setShowSuggestions(false);
              setIsLoading(false);
            }
            // Debounced search will handle fetching via useEffect
          }}
            onKeyDown={handleKeyDown}
            onFocus={() => {
              if (suggestions.length > 0 && searchQuery.length >= 2) {
                setShowSuggestions(true);
              } else if (searchQuery.length >= 2) {
                fetchSuggestions(searchQuery);
              }
            }}
            className="pl-10 pr-10 bg-background/50 backdrop-blur-sm border-border/50 focus-visible:ring-primary/20"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                handleSearch("");
              }}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground rounded p-0.5"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <Button
          type="button"
          size="sm"
          variant="default"
          onClick={() => handleSearch(searchQuery)}
          className="h-10 px-3 shrink-0"
        >
          <Search className="h-4 w-4 mr-1.5" />
          Search
        </Button>
      </div>

      {showSuggestions && (
        <Card 
          className="absolute top-full mt-1 w-full z-[100] max-h-64 overflow-y-auto shadow-lg border bg-background"
          data-suggestion-dropdown
          onMouseDown={(e) => {
            // Prevent closing when clicking inside the dropdown
            e.stopPropagation();
          }}
          style={{ display: showSuggestions ? 'block' : 'none' }}
        >
          <div className="p-1">
            {isLoading ? (
              <div className="px-3 py-2 text-sm text-muted-foreground">Loading suggestions...</div>
            ) : suggestions.length > 0 ? (
              suggestions.map((suggestion, index) => (
                <button
                  key={`${suggestion.id}-${index}`}
                  type="button"
                  data-suggestion-item
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleSuggestionClick(suggestion);
                  }}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                    index === selectedIndex
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted"
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <Search className="h-3 w-3 shrink-0" />
                    <span className="flex-1 truncate">{suggestion.text}</span>
                    {suggestion.type && (
                      <span className="text-xs text-muted-foreground shrink-0">
                        {suggestion.type}
                      </span>
                    )}
                  </div>
                </button>
              ))
            ) : !isLoading ? (
              <div className="px-3 py-2 text-sm text-muted-foreground">No suggestions found</div>
            ) : null}
          </div>
        </Card>
      )}
    </div>
  );
}
