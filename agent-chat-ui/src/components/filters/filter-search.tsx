import React from "react";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

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
        className="h-8 pl-8 text-sm"
      />
    </div>
  );
};
