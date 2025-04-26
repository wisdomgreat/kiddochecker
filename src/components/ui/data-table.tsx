
import { useState } from "react";
import { ChevronDown, ChevronUp, MoreVertical, Search } from "lucide-react";

interface Column<T> {
  key: keyof T | "actions"; // Allow "actions" as a special key
  header: string;
  render?: (value: any, item: T) => React.ReactNode;
  sortable?: boolean;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (item: T) => string;
  searchable?: boolean;
  searchPlaceholder?: string;
  onRowClick?: (item: T) => void;
  loading?: boolean;
  pagination?: boolean; // Add pagination prop
}

export function DataTable<T>({
  columns,
  data,
  keyExtractor,
  searchable = false,
  searchPlaceholder = "Search...",
  onRowClick,
  loading = false,
  pagination = false, // Default to false
}: DataTableProps<T>) {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState<{
    key: keyof T | null;
    direction: "asc" | "desc" | null;
  }>({ key: null, direction: null });

  const handleSort = (key: keyof T) => {
    let direction: "asc" | "desc" | null = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    } else if (sortConfig.key === key && sortConfig.direction === "desc") {
      direction = null;
    }
    setSortConfig({ key, direction });
  };

  const sortedData = [...data].sort((a, b) => {
    if (!sortConfig.key || !sortConfig.direction) return 0;
    
    const aValue = a[sortConfig.key];
    const bValue = b[sortConfig.key];
    
    if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
    if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
    return 0;
  });

  const filteredData = sortedData.filter((item) => {
    if (!searchTerm) return true;
    
    return Object.values(item).some((value) => {
      if (value === null || value === undefined) return false;
      return String(value).toLowerCase().includes(searchTerm.toLowerCase());
    });
  });

  return (
    <div className="w-full">
      {searchable && (
        <div className="relative mb-4">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={18} className="text-gray-400" />
          </div>
          <input
            type="text"
            placeholder={searchPlaceholder}
            className="pl-10 pr-4 py-2 border border-gray-200 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      )}
      
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((column) => (
                <th
                  key={String(column.key)}
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  {column.key !== "actions" && column.sortable ? (
                    <button
                      className="flex items-center gap-1 hover:text-gray-700"
                      onClick={() => handleSort(column.key as keyof T)}
                    >
                      {column.header}
                      {sortConfig.key === column.key && (
                        sortConfig.direction === "asc" ? (
                          <ChevronUp size={16} />
                        ) : sortConfig.direction === "desc" ? (
                          <ChevronDown size={16} />
                        ) : null
                      )}
                    </button>
                  ) : (
                    column.header
                  )}
                </th>
              ))}
              {/* Remove the extra actions column that was hardcoded */}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-6 py-8 whitespace-nowrap text-sm text-gray-500 text-center"
                >
                  <div className="flex justify-center items-center space-x-2">
                    <svg className="animate-spin h-5 w-5 text-purple-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Loading data...</span>
                  </div>
                </td>
              </tr>
            ) : filteredData.length > 0 ? (
              filteredData.map((item) => (
                <tr 
                  key={keyExtractor(item)} 
                  className={`table-row ${onRowClick ? 'cursor-pointer' : ''}`}
                  onClick={onRowClick ? () => onRowClick(item) : undefined}
                >
                  {columns.map((column) => (
                    <td
                      key={`${keyExtractor(item)}-${String(column.key)}`}
                      className="px-6 py-4 whitespace-nowrap text-sm text-gray-800"
                    >
                      {column.render
                        ? column.render(column.key === "actions" ? null : item[column.key as keyof T], item)
                        : column.key !== "actions" ? String(item[column.key as keyof T] || "") : ""}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center"
                >
                  No data found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
