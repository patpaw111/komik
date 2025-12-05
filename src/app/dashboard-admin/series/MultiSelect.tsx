"use client";

import { useState, useRef, useEffect } from "react";

type Option = { id: string; name: string };

type MultiSelectProps = {
  options: Option[];
  selectedIds: string[];
  onChange: (selectedIds: string[]) => void;
  placeholder?: string;
  emptyMessage?: string;
  disabled?: boolean;
};

export function MultiSelect({
  options,
  selectedIds,
  onChange,
  placeholder = "Pilih...",
  emptyMessage = "Tidak ada data",
  disabled = false,
}: MultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setSearchQuery("");
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Focus input when dropdown opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const filteredOptions = options.filter((option) =>
    option.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedOptions = options.filter((opt) => selectedIds.includes(opt.id));

  const toggleOption = (id: string) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((selectedId) => selectedId !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  };

  const removeOption = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(selectedIds.filter((selectedId) => selectedId !== id));
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <div
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`flex min-h-10 w-full cursor-pointer flex-wrap gap-1 rounded border border-border bg-input px-3 py-2 text-sm text-foreground outline-none transition-colors ${
          disabled
            ? "cursor-not-allowed opacity-60"
            : "hover:border-primary focus-within:border-primary"
        }`}
      >
        {selectedOptions.length === 0 ? (
          <span className="text-muted-foreground">{placeholder}</span>
        ) : (
          <>
            {selectedOptions.map((option) => (
              <span
                key={option.id}
                className="inline-flex items-center gap-1 rounded bg-primary/20 px-2 py-0.5 text-xs text-primary-foreground"
              >
                {option.name}
                {!disabled && (
                  <button
                    type="button"
                    onClick={(e) => removeOption(option.id, e)}
                    className="hover:text-primary-foreground/80"
                  >
                    ×
                  </button>
                )}
              </span>
            ))}
          </>
        )}
      </div>

      {isOpen && !disabled && (
        <div className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded border border-border bg-card shadow-lg">
          <div className="sticky top-0 border-b border-border bg-card p-2">
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari..."
              className="w-full rounded border border-border bg-input px-2 py-1.5 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-primary"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          <div className="max-h-48 overflow-auto">
            {filteredOptions.length === 0 ? (
              <div className="px-3 py-2 text-sm text-muted-foreground">
                {emptyMessage}
              </div>
            ) : (
              filteredOptions.map((option) => (
                <label
                  key={option.id}
                  className="flex cursor-pointer items-center gap-2 px-3 py-2 text-sm hover:bg-muted"
                >
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(option.id)}
                    onChange={() => toggleOption(option.id)}
                    className="h-4 w-4 rounded border-border bg-input text-primary"
                    onClick={(e) => e.stopPropagation()}
                  />
                  <span className="flex-1">{option.name}</span>
                </label>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

