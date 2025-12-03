"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { globalSearch } from "@/app/actions/analytics";
import { Search, Loader2, User, Phone, Smartphone, MapPin, Mail } from "lucide-react";
import { formatPhoneNumber } from "@/lib/utils";

interface SearchResultLead {
  id: string;
  customer_name: string;
  contact_number: string;
  device_type: string;
  device_model: string;
  issue_reported: string;
  status: string;
}

interface SearchResultCustomer {
  id: string;
  customer_name: string;
  contact_number: string;
  email: string | null;
  city: string | null;
}

interface SearchResults {
  leads: SearchResultLead[];
  customers: SearchResultCustomer[];
  total: number;
}

export function GlobalSearch() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResults>({ leads: [], customers: [], total: 0 });
  const [isSearching, setIsSearching] = useState(false);
  const router = useRouter();

  // Keyboard shortcut: Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen(true);
      }
      // Escape to close
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  // Search function with debounce
  const performSearch = useCallback(async (searchQuery: string) => {
    if (searchQuery.length < 2) {
      setResults({ leads: [], customers: [], total: 0 });
      return;
    }

    setIsSearching(true);
    const result = await globalSearch(searchQuery);
    if (result.success && result.data) {
      setResults(result.data as SearchResults);
    }
    setIsSearching(false);
  }, []);

  // Debounce search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      performSearch(query);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query, performSearch]);

  const handleResultClick = (type: "lead" | "customer", id: string) => {
    setIsOpen(false);
    setQuery("");
    setResults({ leads: [], customers: [], total: 0 });
    router.push(type === "lead" ? `/leads?view=${id}` : `/customers?view=${id}`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "new":
        return "bg-blue-100 text-blue-800";
      case "contacted":
        return "bg-yellow-100 text-yellow-800";
      case "won":
        return "bg-green-100 text-green-800";
      case "lost":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <>
      {/* Trigger Button */}
      <Button
        variant="outline"
        className="relative h-9 w-full justify-start text-sm text-gray-500 border-black md:w-64"
        onClick={() => setIsOpen(true)}
      >
        <Search className="mr-2 h-4 w-4" />
        <span>Search leads, customers...</span>
        <kbd className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 inline-flex h-5 select-none items-center gap-1 rounded border bg-gray-100 px-1.5 font-mono text-[10px] font-medium text-gray-600">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>

      {/* Search Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-2xl p-0 gap-0" aria-describedby={undefined}>
          {/* Search Input */}
          <div className="flex items-center border-b border-gray-200 px-4 py-3">
            <Search className="mr-2 h-5 w-5 text-gray-400" />
            <Input
              placeholder="Search by name, phone, device model..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1 border-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-base"
              autoFocus
            />
            {isSearching && <Loader2 className="h-4 w-4 animate-spin text-gray-400" />}
          </div>

          {/* Search Results */}
          <div className="max-h-[500px] overflow-y-auto p-4">
            {query.length < 2 ? (
              <div className="text-center py-12 text-gray-400">
                <Search className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm">Type at least 2 characters to search</p>
                <p className="text-xs mt-1">Search across leads and customers</p>
              </div>
            ) : results.total === 0 && !isSearching ? (
              <div className="text-center py-12 text-gray-400">
                <Search className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm">No results found for &quot;{query}&quot;</p>
                <p className="text-xs mt-1">Try searching by name, phone, or device model</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Leads Results */}
                {results.leads.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-500 mb-3 flex items-center gap-2">
                      <Smartphone className="h-4 w-4" />
                      Leads ({results.leads.length})
                    </h3>
                    <div className="space-y-2">
                      {results.leads.map((lead) => (
                        <button
                          key={lead.id}
                          onClick={() => handleResultClick("lead", lead.id)}
                          className="w-full text-left p-3 rounded-lg hover:bg-gray-50 border border-gray-200 transition-colors"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <p className="font-medium text-black">{lead.customer_name}</p>
                                <Badge className={getStatusColor(lead.status)} variant="secondary">
                                  {lead.status}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-3 text-xs text-gray-500">
                                <span className="flex items-center gap-1">
                                  <Phone className="h-3 w-3" />
                                  {formatPhoneNumber(lead.contact_number)}
                                </span>
                                <span>•</span>
                                <span className="flex items-center gap-1">
                                  <Smartphone className="h-3 w-3" />
                                  {lead.device_type} {lead.device_model}
                                </span>
                              </div>
                              <p className="text-xs text-gray-600 mt-1">{lead.issue_reported}</p>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Customers Results */}
                {results.customers.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-500 mb-3 flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Customers ({results.customers.length})
                    </h3>
                    <div className="space-y-2">
                      {results.customers.map((customer) => (
                        <button
                          key={customer.id}
                          onClick={() => handleResultClick("customer", customer.id)}
                          className="w-full text-left p-3 rounded-lg hover:bg-gray-50 border border-gray-200 transition-colors"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <div className="h-8 w-8 rounded-full bg-black text-white flex items-center justify-center text-xs font-semibold">
                                  {customer.customer_name.charAt(0).toUpperCase()}
                                </div>
                                <p className="font-medium text-black">{customer.customer_name}</p>
                              </div>
                              <div className="flex items-center gap-3 text-xs text-gray-500 ml-10">
                                <span className="flex items-center gap-1">
                                  <Phone className="h-3 w-3" />
                                  {formatPhoneNumber(customer.contact_number)}
                                </span>
                                {customer.email && (
                                  <>
                                    <span>•</span>
                                    <span className="flex items-center gap-1">
                                      <Mail className="h-3 w-3" />
                                      {customer.email}
                                    </span>
                                  </>
                                )}
                                {customer.city && (
                                  <>
                                    <span>•</span>
                                    <span className="flex items-center gap-1">
                                      <MapPin className="h-3 w-3" />
                                      {customer.city}
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 px-4 py-2 text-xs text-gray-500 flex items-center justify-between bg-gray-50">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-white border border-gray-300 rounded text-[10px]">↑</kbd>
                <kbd className="px-1.5 py-0.5 bg-white border border-gray-300 rounded text-[10px]">↓</kbd>
                Navigate
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-white border border-gray-300 rounded text-[10px]">Enter</kbd>
                Select
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-white border border-gray-300 rounded text-[10px]">Esc</kbd>
                Close
              </span>
            </div>
            {results.total > 0 && <span>{results.total} results</span>}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
