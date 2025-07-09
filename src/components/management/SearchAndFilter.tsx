
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Filter, Plus } from "lucide-react";

interface SearchAndFilterProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onAddClick?: () => void;
  addButtonText?: string;
  filterOptions?: Array<{ value: string; label: string }>;
  selectedFilter?: string;
  onFilterChange?: (value: string) => void;
  placeholder?: string;
}

const SearchAndFilter = ({
  searchTerm,
  onSearchChange,
  onAddClick,
  addButtonText = "Add New",
  filterOptions,
  selectedFilter,
  onFilterChange,
  placeholder = "Search..."
}: SearchAndFilterProps) => {
  return (
    <div className="flex gap-4 items-center">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          placeholder={placeholder}
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>
      
      {filterOptions && onFilterChange && (
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-500" />
          <select
            value={selectedFilter}
            onChange={(e) => onFilterChange(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm"
          >
            {filterOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      )}
      
      {onAddClick && (
        <Button onClick={onAddClick} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="mr-2 h-4 w-4" />
          {addButtonText}
        </Button>
      )}
    </div>
  );
};

export default SearchAndFilter;
