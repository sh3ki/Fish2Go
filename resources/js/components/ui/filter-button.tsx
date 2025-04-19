import React, { useState, useRef, useEffect } from "react";
import { Filter } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FilterOption {
  id: number | string;
  name: string;
}

interface FilterButtonProps {
  options: FilterOption[];
  activeFilter: number | string;
  onSelectFilter: (filterId: number | string) => void;
  includeAvailable?: boolean;
  includeAll?: boolean; // New prop to control if "All" button should be shown
  allOptionText?: string; // Text for "All" option
  availableOptionText?: string; // Text for "Available" option
  className?: string;
  buttonClassName?: string;
}

const FilterButton: React.FC<FilterButtonProps> = ({
  options,
  activeFilter,
  onSelectFilter,
  includeAvailable = true,
  includeAll = true, // Default to showing "All" option
  allOptionText = "All Items", // Default text for "All" option
  availableOptionText = "Available", // Default text for "Available" option
  className = "",
  buttonClassName = "bg-gray-500 rounded-lg flex items-center justify-center h-8"
}) => {
  const [showFilterModal, setShowFilterModal] = useState(false);
  const filterButtonRef = useRef<HTMLButtonElement>(null);
  const filterModalRef = useRef<HTMLDivElement>(null);

  // Check if options array already has an "all" option
  const hasAllOption = options.some(option => option.id === "all");

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        filterModalRef.current && 
        !filterModalRef.current.contains(event.target as Node) &&
        filterButtonRef.current && 
        !filterButtonRef.current.contains(event.target as Node)
      ) {
        setShowFilterModal(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const toggleFilterModal = () => {
    setShowFilterModal(prev => !prev);
  };

  return (
    <div className={`relative ${className}`}>
      <Button
        ref={filterButtonRef}
        className={buttonClassName}
        style={{ aspectRatio: '1/1', padding: '0' }}
        onClick={toggleFilterModal}
      >
        <Filter size={18} />
      </Button>
      
      {showFilterModal && (
        <div 
          ref={filterModalRef}
          className="absolute right-0 p-0.5 w-40 rounded-md shadow-lg bg-gray-700 ring-1 ring-black ring-opacity-5 z-50"
        >
          <div className="py-0.5" role="menu" aria-orientation="vertical">
            {/* Only show the default "All" button if includeAll is true AND there's no custom "all" option */}
            {includeAll && !hasAllOption && (
              <button
                onClick={() => {
                  onSelectFilter("all");
                  setShowFilterModal(false);
                }}
                className={`block w-full text-left px-4 py-2 text-sm ${
                  activeFilter === "all" 
                  ? "bg-gray-600 text-white" 
                  : "text-white hover:bg-gray-600"
                }`}
                role="menuitem"
              >
                {allOptionText}
              </button>
            )}
            
            {includeAvailable && (
              <button
                onClick={() => {
                  onSelectFilter("available");
                  setShowFilterModal(false);
                }}
                className={`block w-full text-left px-4 py-2 text-sm ${
                  activeFilter === "available" 
                  ? "bg-gray-600 text-white" 
                  : "text-white hover:bg-gray-600"
                }`}
                role="menuitem"
              >
                {availableOptionText}
              </button>
            )}
            
            {options && options.length > 0 ? (
              options.map((option) => (
                <button
                  key={option.id}
                  onClick={() => {
                    onSelectFilter(option.id);
                    setShowFilterModal(false);
                  }}
                  className={`block w-full text-left px-4 py-2 text-sm ${
                    activeFilter === option.id 
                    ? "bg-gray-600 text-white" 
                    : "text-white hover:bg-gray-600"
                  }`}
                  role="menuitem"
                >
                  {option.name}
                </button>
              ))
            ) : (
              <div className="px-4 py-2 text-sm text-gray-400">No options available</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default FilterButton;
