import React, { useState, useEffect, useRef } from 'react';

interface SearchBarProps<T> {
  placeholder?: string;
  items: T[];
  searchField: keyof T;
  onSearchResults: (results: T[]) => void;
  additionalFilters?: (item: T, searchTerm: string) => boolean;
  className?: string;
  debounceTime?: number;
  autoFocus?: boolean;
  initialValue?: string;
  onSearchTermChange?: (term: string) => void;
}

const SearchBar = <T extends Record<string, any>>({
  placeholder = "Search...",
  items,
  searchField,
  onSearchResults,
  additionalFilters,
  className = "",
  debounceTime = 300,
  autoFocus = false,
  initialValue = "",
  onSearchTermChange
}: SearchBarProps<T>) => {
  const [searchTerm, setSearchTerm] = useState(initialValue);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);
  
  // Apply search filtering when the search term changes
  useEffect(() => {
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }
    
    debounceTimeout.current = setTimeout(() => {
      performSearch(searchTerm);
    }, debounceTime);
    
    return () => {
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
      }
    };
  }, [searchTerm, items]);
  
  useEffect(() => {
    // If initial value is provided or changed, update the search term
    if (initialValue !== searchTerm) {
      setSearchTerm(initialValue);
    }
  }, [initialValue]);
  
  useEffect(() => {
    if (autoFocus && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [autoFocus]);
  
  const performSearch = (term: string) => {
    if (!term || term.trim() === "") {
      onSearchResults(items);
      if (onSearchTermChange) onSearchTermChange(term);
      return;
    }
    
    // Split the search term into individual words (tokens)
    const searchTokens = term.toLowerCase().split(/\s+/).filter(token => token.length > 0);
    
    // Filter items based on the search tokens
    let filtered = items.filter(item => {
      const fieldValue = String(item[searchField]).toLowerCase();
      
      // Check if all search tokens are found in the searchField
      const matchesSearch = searchTokens.every(token => fieldValue.includes(token));
      
      // Apply any additional filters provided via props
      if (matchesSearch && additionalFilters) {
        return additionalFilters(item, term);
      }
      
      return matchesSearch;
    });
    
    onSearchResults(filtered);
    if (onSearchTermChange) onSearchTermChange(term);
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTerm = e.target.value;
    setSearchTerm(newTerm);
  };
  
  return (
    <input
      ref={searchInputRef}
      type="text"
      placeholder={placeholder}
      value={searchTerm}
      onChange={handleInputChange}
      className={className}
    />
  );
};

export default SearchBar;
