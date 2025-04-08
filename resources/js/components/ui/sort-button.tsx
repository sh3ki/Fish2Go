import React, { useState, useRef, useEffect } from "react";
import { ArrowDownUp, ArrowUp01, ArrowDown10, ArrowUpAZ, ArrowDownZA } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SortOption {
  field: string;
  label: string;
  type: "numeric" | "text";
}

interface SortButtonProps {
  options: SortOption[];
  currentField: string;
  currentDirection: "asc" | "desc";
  onSort: (field: string, direction: "asc" | "desc") => void;
  className?: string;
  buttonClassName?: string;
}

const SortButton: React.FC<SortButtonProps> = ({
  options,
  currentField,
  currentDirection,
  onSort,
  className = "",
  buttonClassName = "bg-gray-500 rounded-lg flex items-center justify-center h-8"
}) => {
  const [showSortModal, setShowSortModal] = useState(false);
  const sortButtonRef = useRef<HTMLButtonElement>(null);
  const sortModalRef = useRef<HTMLDivElement>(null);

  // Close modal when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        sortModalRef.current && 
        !sortModalRef.current.contains(event.target as Node) &&
        sortButtonRef.current && 
        !sortButtonRef.current.contains(event.target as Node)
      ) {
        setShowSortModal(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const toggleSortModal = () => {
    setShowSortModal(prev => !prev);
  };

  const handleSortOption = (field: string, direction: "asc" | "desc") => {
    onSort(field, direction);
    setShowSortModal(false);
  };

  return (
    <div className={`relative ${className}`}>
      <Button
        ref={sortButtonRef}
        className={buttonClassName}
        style={{ aspectRatio: '1/1', padding: '0' }}
        onClick={toggleSortModal}
      >
        <ArrowDownUp size={18} />
      </Button>
      
      {showSortModal && (
        <div 
          ref={sortModalRef}
          className="absolute right-0 p-0.5 w-52 rounded-md shadow-lg bg-gray-700 ring-1 ring-black ring-opacity-5 z-50"
        >
          <div className="py-0.5" role="menu" aria-orientation="vertical">
            {options.map((option, index) => (
              <React.Fragment key={option.field}>
                {index > 0 && (
                  <div className="border-t border-gray-600 my-1"></div>
                )}
                <div className="px-4 py-1 text-white font-medium text-sm mt-2">By {option.label}</div>
                {option.type === "numeric" ? (
                  <>
                    <button
                      onClick={() => handleSortOption(option.field, "asc")}
                      className={`flex items-center w-full text-left px-4 py-1 text-sm ${
                        currentField === option.field && currentDirection === "asc" 
                        ? "bg-gray-600 text-white" 
                        : "text-white hover:bg-gray-600"
                      }`}
                      role="menuitem"
                    >
                      <ArrowUp01 size={14} className="mr-2" /> Lowest first
                    </button>
                    <button
                      onClick={() => handleSortOption(option.field, "desc")}
                      className={`flex items-center w-full text-left px-4 py-1 text-sm ${
                        currentField === option.field && currentDirection === "desc" 
                        ? "bg-gray-600 text-white" 
                        : "text-white hover:bg-gray-600"
                      }`}
                      role="menuitem"
                    >
                      <ArrowDown10 size={14} className="mr-2" /> Highest first
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => handleSortOption(option.field, "asc")}
                      className={`flex items-center w-full text-left px-4 py-1 text-sm ${
                        currentField === option.field && currentDirection === "asc" 
                        ? "bg-gray-600 text-white" 
                        : "text-white hover:bg-gray-600"
                      }`}
                      role="menuitem"
                    >
                      <ArrowUpAZ size={14} className="mr-2" /> A to Z
                    </button>
                    <button
                      onClick={() => handleSortOption(option.field, "desc")}
                      className={`flex items-center w-full text-left px-4 py-1 text-sm ${
                        currentField === option.field && currentDirection === "desc" 
                        ? "bg-gray-600 text-white" 
                        : "text-white hover:bg-gray-600"
                      }`}
                      role="menuitem"
                    >
                      <ArrowDownZA size={14} className="mr-2" /> Z to A
                    </button>
                  </>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SortButton;
export type { SortOption };
