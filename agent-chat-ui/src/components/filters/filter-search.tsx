import React from "react";
import { Input } from "@/components/ui/input";
import { Search, X } from "lucide-react";

interface FilterSearchProps {
  value: string;
  onChange: (value: string) => void;
}

export const FilterSearch: React.FC<FilterSearchProps> = ({ value, onChange }) => {
  return (
    <div className="relative">
      <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        placeholder="Search filters..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-8 pl-8 pr-7 text-xs text-muted-foreground/70 placeholder:text-muted-foreground/40 rounded-full bg-white dark:bg-white/10 shadow-none"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
};
