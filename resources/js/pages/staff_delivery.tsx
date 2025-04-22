import { useState, useEffect, useRef } from "react";
import StaffLayout from "@/components/staff/StaffLayout";
import { type BreadcrumbItem } from "@/types";
import { Head } from "@inertiajs/react";
import axios from "axios";
import { 
  Loader2, CirclePlus, CircleMinus, Save,
   ArrowUp, ArrowDown, Search, CircleX, AlertCircle, X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import SearchBar from "@/components/ui/search-bar";
import FilterButton from "@/components/ui/filter-button";
import SortButton from "@/components/ui/sort-button";
import toast, { Toaster } from "react-hot-toast";
import FullScreenPrompt from "@/components/staff/FullScreenPrompt";

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: "Delivery",
        href: "/staff/delivery",
    },
];

interface DeliveryItem {
    id: string;
    type: 'product' | 'inventory';
    product_id: number | null;
    inventory_id: number | null;
    name: string;
    image: string | null;
    category_name?: string;
    beginning_qty?: number;
    used_qty?: number;
    ending_qty?: number;
    original_used_qty?: number;
    created_at: string;
}

export default function DeliveryPOS() {
    // State management
    const [items, setItems] = useState<DeliveryItem[]>([]); // All items (products + inventory)
    const [filteredItems, setFilteredItems] = useState<DeliveryItem[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [isSaving, setIsSaving] = useState<boolean>(false);
    const [sortField, setSortField] = useState<string>("id"); // Changed from "name" to "id"
    const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc"); // Keep "asc" as default
    const [searchTerm, setSearchTerm] = useState<string>("");
    const [activeFilter, setActiveFilter] = useState<string>("all");
    const [imageTimestamps, setImageTimestamps] = useState<Record<string, number>>({});
    const tableRef = useRef<HTMLDivElement>(null);
    const [isFullScreen, setIsFullScreen] = useState(false);
    const [showSaveModal, setShowSaveModal] = useState(false);
    const [focusedInputId, setFocusedInputId] = useState<string | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [inputValue, setInputValue] = useState<Record<string, string>>({});
    const [productCount, setProductCount] = useState<number>(0);

    // Update the number formatting utility function to handle different decimal cases
    const formatNumber = (value: number | null | undefined): string => {
        // Ensure we're working with a valid number
        const numValue = Number(value || 0);
        
        // If it's an integer, return without decimals
        if (Number.isInteger(numValue)) {
            return numValue.toString();
        }
        
        // Get the decimal part
        const decimalStr = numValue.toString();
        const decimalPart = decimalStr.includes('.') ? decimalStr.split('.')[1] : '';
        
        // If there's 1 decimal digit, show 1 decimal place
        if (decimalPart && decimalPart.length === 1) {
            return numValue.toFixed(1);
        }
        
        // Otherwise show 2 decimal places
        return numValue.toFixed(2);
    };
    
    // Status text function
    const getStatusText = (qty: number): string => {
        if (qty >= 30) return "High Stock";
        if (qty >= 10) return "In Stock";
        if (qty >= 5) return "Low Stock";
        if (qty == 0) return "Out of Stock";
        return "Backorder";
    };

    // Initialize data
    useEffect(() => {
        fetchData();
    }, []);

    // Apply filters, search and sort
    useEffect(() => {
        applyFilters();
    }, [sortField, sortDirection, searchTerm, activeFilter, items]);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const response = await axios.get("/staff/delivery/data");
            
            // Calculate product count
            const productsArray = response.data.products || [];
            setProductCount(productsArray.length);
            
            // Ensure inventory data is properly loaded
            const inventoryArray = response.data.inventory || [];
            
            // Process all items to ensure we have the correct values and structure
            const allItems = [
                ...productsArray,
                ...inventoryArray
            ].map(item => ({
                ...item,
                // Ensure these properties exist and are properly initialized
                beginning_qty: item.beginning_qty || 0,
                used_qty: item.used_qty || 0, 
                original_used_qty: item.original_used_qty || 0,
                ending_qty: item.ending_qty || 0
            }));
            
            setItems(allItems);
            
            // Apply initial sorting to ensure products come first
            const initialSorted = sortItems(allItems);
            setFilteredItems(initialSorted);
            
            // Initialize image timestamps for all items
            const timestamps: Record<string, number> = {};
            allItems.forEach(item => {
                if (item.image) {
                    timestamps[item.id] = Date.now();
                }
            });
            setImageTimestamps(timestamps);
        } catch (error) {
            toast.error("Failed to load delivery data");
        } finally {
            setIsLoading(false);
        }
    };

    const applyFilters = () => {
        let filtered = [...items];

        // Apply search filter
        if (searchTerm.trim() !== "") {
            const query = searchTerm.toLowerCase();
            filtered = filtered.filter(
                (item) =>
                    item.name.toLowerCase().includes(query) ||
                    item.id.toString().includes(query)
            );
        }

        // Apply type filter
        if (activeFilter === "products") {
            filtered = filtered.filter(item => item.type === "product");
        } else if (activeFilter === "inventory") {
            filtered = filtered.filter(item => item.type === "inventory");
        } else if (activeFilter === "available") {
            filtered = filtered.filter(item => (item.beginning_qty || 0) > 0);
        } else if (activeFilter === "lowstock") {
            filtered = filtered.filter(item => (item.beginning_qty || 0) > 0 && (item.beginning_qty || 0) < 10);
        } else if (activeFilter === "outofstock") {
            filtered = filtered.filter(item => (item.beginning_qty || 0) === 0);
        }

        // Apply sorting
        filtered = sortItems(filtered);

        setFilteredItems(filtered);
    };

    const sortItems = (itemsToSort: DeliveryItem[]) => {
        return [...itemsToSort].sort((a, b) => {
            // First sort by type was putting products first - remove this behavior for ID-based sorting
            if (sortField === "id") {
                // For ID sorting, convert both to numeric display ID values
                const valueA = a.type === 'product' ? Number(a.product_id) : productCount + Number(a.inventory_id || 0);
                const valueB = b.type === 'product' ? Number(b.product_id) : productCount + Number(b.inventory_id || 0);
                
                return sortDirection === "asc" ? valueA - valueB : valueB - valueA;
            }
            
            // For non-ID fields, still group by type first (products then inventory)
            if (a.type !== b.type) {
                return a.type === 'product' ? -1 : 1;
            }
            
            // Then sort by the chosen field
            let valueA, valueB;
            
            switch (sortField) {
                case "name":
                    valueA = a.name.toLowerCase();
                    valueB = b.name.toLowerCase();
                    break;
                case "type":
                    valueA = a.type.toLowerCase();
                    valueB = b.type.toLowerCase();
                    break;
                case "beginning_qty":
                    valueA = a.beginning_qty || 0;
                    valueB = b.beginning_qty || 0;
                    break;
                case "used_qty":
                    valueA = a.used_qty || 0;
                    valueB = b.used_qty || 0;
                    break;
                case "ending_qty":
                    valueA = a.ending_qty || 0;
                    valueB = b.ending_qty || 0;
                    break;
                default:
                    // Fallback to ID sorting for other undefined fields
                    valueA = a.type === 'product' ? a.product_id : a.inventory_id;
                    valueB = b.type === 'product' ? b.product_id : b.inventory_id;
            }
            
            if (valueA < valueB) return sortDirection === "asc" ? -1 : 1;
            if (valueA > valueB) return sortDirection === "asc" ? 1 : -1;
            return 0;
        });
    };

    const handleSortOption = (field: string, direction: "asc" | "desc") => {
        setSortField(field);
        setSortDirection(direction);
    };

    const handleSearchResults = (results: any[]) => {
        const filtered = results as DeliveryItem[];
        
        // Apply active filter on search results
        let finalResults = filtered;
        if (activeFilter === "products") {
            finalResults = filtered.filter(item => item.type === "product");
        } else if (activeFilter === "inventory") {
            finalResults = filtered.filter(item => item.type === "inventory");
        } else if (activeFilter === "available") {
            finalResults = filtered.filter(item => (item.beginning_qty || 0) > 0);
        } else if (activeFilter === "lowstock") {
            finalResults = filtered.filter(item => (item.beginning_qty || 0) > 0 && (item.beginning_qty || 0) < 10);
        } else if (activeFilter === "outofstock") {
            finalResults = filtered.filter(item => (item.beginning_qty || 0) === 0);
        }
        
        // Apply sorting
        const sortedResults = sortItems(finalResults);
        setFilteredItems(sortedResults);
    };

    const handleSearchTermChange = (term: string) => {
        setSearchTerm(term);
    };

    const handleFilterChange = (filterId: string | number) => {
        setActiveFilter(filterId as string);
    };

    // Fix the increment/decrement logic to use proper decimal increments
    const adjustUsedQty = (id: string, delta: number) => {
        // Update all items
        const updateItems = (list: DeliveryItem[]) =>
            list.map(item => {
                if (item.id === id) {
                    // Get current value with appropriate precision
                    const currentValue = parseFloat((item.used_qty || 0).toString());
                    
                    // Ensure used_qty doesn't go below original_used_qty
                    // No upper limit for delivery as we're adding to inventory
                    const minValue = parseFloat((item.original_used_qty || 0).toString());
                    const newUsedQty = Math.max(minValue, currentValue + delta);
                    
                    // Calculate ending quantity as the sum of beginning and delivered
                    const beginningQty = parseFloat((item.beginning_qty || 0).toString());
                    const endingQty = beginningQty + newUsedQty;
                    
                    return {
                        ...item,
                        used_qty: newUsedQty,
                        ending_qty: endingQty
                    };
                }
                return item;
            });
        
        setItems(updateItems(items));
        setFilteredItems(updateItems(filteredItems));
    };

    const setUsedQty = (id: string, value: number | null) => {
        // Direct setting of used quantity
        const updateItems = (list: DeliveryItem[]) =>
            list.map(item => {
                if (item.id === id) {
                    // If value is null (empty input), revert to original inventory_used value
                    if (value === null) {
                        const originalUsed = parseFloat((item.original_used_qty || 0).toString());
                        const beginningQty = parseFloat((item.beginning_qty || 0).toString());
                        
                        return {
                            ...item,
                            used_qty: originalUsed,
                            ending_qty: beginningQty + originalUsed // Sum for delivery
                        };
                    }
                    
                    // Ensure value is not less than the original inventory_used
                    const minValue = parseFloat((item.original_used_qty || 0).toString());
                    const newValue = Math.max(minValue, value);
                    
                    // Calculate ending quantity with proper precision
                    const beginningQty = parseFloat((item.beginning_qty || 0).toString());
                    const endingQty = beginningQty + newValue;
                    
                    return {
                        ...item,
                        used_qty: newValue,
                        ending_qty: endingQty
                    };
                }
                return item;
            });
        
        setItems(updateItems(items));
        setFilteredItems(updateItems(filteredItems));
    };

    // Handle quantity change with validation for decimal inputs
    const handleQtyChange = (id: string, value: string) => {
        // Store the current input value for this field
        setInputValue(prev => ({
            ...prev,
            [id]: value
        }));
        
        // If input is empty, just update the visual state
        if (value.trim() === '') {
            return;
        }
        
        // Validate that the input is a valid number with optional decimals
        if (!/^-?\d*\.?\d*$/.test(value)) {
            return; // Reject non-numeric input
        }
        
        const item = items.find(item => item.id === id);
        if (!item) return;
        
        const parsedQty = parseFloat(value);
        
        // If parsing failed or value is NaN, exit early
        if (isNaN(parsedQty)) {
            return;
        }
        
        // Validate against minimum (original used qty)
        const minValue = parseFloat((item.original_used_qty || 0).toString());
        if (parsedQty < minValue) {
            setErrorMessage(`Cannot set value below ${formatNumber(minValue)}. This is the minimum required value.`);
            setTimeout(() => setErrorMessage(null), 3000);
            return;
        }
        
        // Input is valid, update the used qty
        setUsedQty(id, parsedQty);
    };

    // Handle input focus - completely clear zero values
    const handleInputFocus = (id: string) => {
        setFocusedInputId(id);
        
        const item = items.find(item => item.id === id);
        if (!item) return;
        
        // Always clear the input on focus to remove zero placeholders
        if (item.used_qty === 0 || item.used_qty === item.original_used_qty) {
            setInputValue(prev => ({
                ...prev,
                [id]: '' // Clear the input
            }));
        } else {
            // Otherwise initialize with the current value
            setInputValue(prev => ({
                ...prev,
                [id]: item.used_qty?.toString() || ''
            }));
        }
    };

    // Handle input blur with proper decimal handling
    const handleInputBlur = (id: string) => {
        setFocusedInputId(null);
        
        const value = inputValue[id];
        const item = items.find(item => item.id === id);
        
        // If input is empty on blur, revert to original value
        if (!value || value.trim() === '') {
            if (item) {
                setUsedQty(id, item.original_used_qty || 0);
            }
            return;
        }
        
        // Otherwise update with the current value
        const parsedQty = parseFloat(value);
        if (!isNaN(parsedQty)) {
            if (item) {
                // Ensure only minimum bounds (no max needed for delivery)
                const minValue = parseFloat((item.original_used_qty || 0).toString());
                const boundedValue = Math.max(minValue, parsedQty);
                setUsedQty(id, boundedValue);
            }
        }
    };

    // Function to get changed items - exclude items with zero used qty or unchanged
    const getChangedItems = () => {
        return items.filter(item => 
            (item.used_qty || 0) !== (item.original_used_qty || 0) && 
            (item.used_qty || 0) > 0
        );
    };

    // Updated to show modal instead of saving directly
    const handleSaveButtonClick = () => {
        const changedItems = getChangedItems();
        if (changedItems.length === 0) {
            toast.info('No delivery changes to save');
            return;
        }
        setShowSaveModal(true);
    };

    const saveDeliveryChanges = async () => {
        setIsSaving(true);
        try {
            // Only send changed items that have valid changes to track
            const changedItems = getChangedItems().map(item => ({
                id: item.id,
                type: item.type,
                product_id: item.product_id,
                inventory_id: item.inventory_id,
                beginning_qty: item.beginning_qty || 0,
                used_qty: item.used_qty || 0,
                ending_qty: item.ending_qty || 0
            }));
            
            // Call API to save changes
            const response = await axios.post('/staff/delivery/update', { 
                items: changedItems 
            });
            
            // Update image timestamps after successful save to refresh images if needed
            const newTimestamps = { ...imageTimestamps };
            items.forEach(item => {
                if (item.image) {
                    newTimestamps[item.id] = Date.now();
                }
            });
            setImageTimestamps(newTimestamps);
            
            // Update local data to reflect saved state without refreshing
            const updatedItems = items.map(item => {
                const found = changedItems.find(changed => changed.id === item.id);
                if (found) {
                    return {
                        ...item,
                        original_used_qty: found.used_qty, // Update the original value to match what was saved
                        used_qty: found.used_qty, // Keep the used quantity as is
                        beginning_qty: found.beginning_qty, // Keep the beginning quantity as is 
                        ending_qty: found.ending_qty // Keep the ending quantity as is
                    };
                }
                return item;
            });
            
            // Update both state variables to ensure consistency
            setItems(updatedItems);
            setFilteredItems(sortItems(updatedItems.filter(item => {
                // Apply current filter to maintain the correct view
                if (activeFilter === "products") {
                    return item.type === "product";
                } else if (activeFilter === "inventory") {
                    return item.type === "inventory";
                } else if (activeFilter === "available") {
                    return (item.beginning_qty || 0) > 0;
                } else if (activeFilter === "lowstock") {
                    return (item.beginning_qty || 0) > 0 && (item.beginning_qty || 0) < 10;
                } else if (activeFilter === "outofstock") {
                    return (item.beginning_qty || 0) === 0;
                }
                return true;
            })));
            
            toast.success(response.data.message || 'Delivery updates successfully saved');
            setShowSaveModal(false); // Close the modal after successful save
            
        } catch (error) {
            console.error("Error saving delivery data:", error);
            const errorMessage = error.response?.data?.message || 'Failed to save delivery changes';
            toast.error(errorMessage);
        } finally {
            setIsSaving(false);
        }
    };

    const filterOptions = [
        { id: "all", name: "All Items" },
        { id: "products", name: "Products" },
        { id: "inventory", name: "Inventory" },
        { id: "available", name: "Available" },
        { id: "lowstock", name: "Low Stock" },
        { id: "outofstock", name: "Out of Stock" },
    ];

    // Helper to get appropriate image path based on item type
    const getImagePath = (item: DeliveryItem) => {
        if (!item.image) return null;
        
        if (item.type === 'product') {
            return `/storage/products/${item.image}${imageTimestamps[item.id] ? `?t=${imageTimestamps[item.id]}` : ''}`;
        } else {
            return `/storage/inventory/${item.image}${imageTimestamps[item.id] ? `?t=${imageTimestamps[item.id]}` : ''}`;
        }
    };

    return (
        <StaffLayout breadcrumbs={breadcrumbs}>
            <Head title="Delivery" />
            <Toaster />
            
            <FullScreenPrompt onFullScreenChange={setIsFullScreen} />
            
            {/* Error Message Display */}
            {errorMessage && (
                <div className="fixed top-4 right-4 z-50 bg-red-500 text-white p-3 rounded-md shadow-lg flex items-center animate-in fade-in slide-in-from-top-5 duration-300">
                    <AlertCircle className="mr-2" size={20} />
                    <span>{errorMessage}</span>
                    <button
                        onClick={() => setErrorMessage(null)}
                        className="ml-4 text-white hover:text-red-200"
                    >
                        <X size={18} />
                    </button>
                </div>
            )}
            
            {/* Save Confirmation Modal */}
            {showSaveModal && (
                <div className="fixed inset-0 flex items-center justify-center z-50" style={{ backgroundColor: 'rgba(0, 0, 0, 0.75)' }}>
                    <div className="bg-gray-800 p-2 pt-3 rounded-xl w-md w-full max-w-md relative">
                        {/* Close button */}
                        <button 
                            onClick={() => setShowSaveModal(false)}
                            className="absolute top-2 right-2 text-white"
                        >
                            <CircleX size={20} />
                        </button>
                        
                        <div className="flex justify-center items-center mb-2">
                            <h2 className="text-xl font-bold text-white">Items Delivered</h2>
                        </div>
                      
                        {/* Changed Items List - updated to 3 columns with fixed height */}
                        <div className="p-2 rounded-lg bg-gray-800 mb-2" style={{ maxHeight: '350px' }}>
                            <div className="grid grid-cols-12 px-2 text-white font-semibold border-b border-gray-700 pb-4">
                                <div className="col-span-6">Item Name</div>
                                <div className="col-span-4 text-center">Delivered</div>
                                <div className="col-span-2 text-center">Qty</div>
                            </div>
                            
                            <div className="overflow-y-auto" style={{ maxHeight: '280px' }}>
                                {getChangedItems().length === 0 ? (
                                    <div className="text-center text-gray-400">No changes to save</div>
                                ) : (
                                    getChangedItems().map((item) => {
                                        // Calculate the difference between new and original values
                                        const difference = (item.used_qty || 0) - (item.original_used_qty || 0);
                                        // Format the difference with a plus sign for delivery
                                        const formattedDifference = "+ " + formatNumber(Math.abs(difference));
                                        
                                        return (
                                            <div key={item.id} className="grid grid-cols-12 py-1 px-2 border-b border-gray-700">
                                                <span className="col-span-6 text-white text-sm font-medium truncate">
                                                    {item.name}
                                                </span>
                                                <span className="col-span-4 text-white text-sm text-center">Delivered:</span>
                                                <span className="col-span-2 text-sm text-center text-green-400">{formattedDifference}</span>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>

                        {/* Confirm Button */}
                        <div className="flex justify-center">
                            <Button 
                                className="bg-green-600 hover:bg-green-700 text-white font-bold px-8 py-2"
                                onClick={saveDeliveryChanges}
                                disabled={isSaving}
                            >
                                {isSaving ? (
                                    <>
                                        <Loader2 className="animate-spin h-4 w-4 mr-2" />
                                        Saving...
                                    </>
                                ) : (
                                    "CONFIRM"
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
            
            <div className="flex flex-col bg-gray-900 h-[calc(100vh-41px)] overflow-hidden">
                {/* Search, Filter, Sort, and Save Controls */}
                <div className="p-2 w-full">
                    <div className="flex items-center mb-2 justify-between">
                        <div className="flex items-center gap-1.5 bg-transparent w-5/9 rounded-lg">
                            <SearchBar
                                placeholder="Search Items"
                                items={items}
                                searchField="name"
                                onSearchResults={handleSearchResults}
                                onSearchTermChange={handleSearchTermChange}
                                className="input w-full bg-gray-600 p-1 pl-3 text-white rounded-lg focus:outline-none focus:ring-1 focus:ring-inset focus:ring-white-400"
                            />
                            
                            <FilterButton
                                options={filterOptions}
                                activeFilter={activeFilter}
                                onSelectFilter={handleFilterChange}
                                includeAvailable={false}
                                allOptionText="All Items"
                            />
                            
                            <SortButton
                                options={[
                                    { field: "id", label: "ID", type: "text" },
                                    { field: "name", label: "Name", type: "text" },
                                    { field: "type", label: "Type", type: "text" },
                                    { field: "beginning_qty", label: "Beginning", type: "numeric" },
                                    { field: "used_qty", label: "Delivered", type: "numeric" },
                                    { field: "ending_qty", label: "Ending", type: "numeric" }
                                ]}
                                currentField={sortField}
                                currentDirection={sortDirection}
                                onSort={handleSortOption}
                            />
                        </div>
                        
                        <div className="flex justify-end gap-2">
                            <Button 
                                onClick={handleSaveButtonClick}
                                className={`rounded-lg flex items-center gap-1 h-8 w-8 
                                    ${getChangedItems().length > 0 ? "bg-green-600 hover:bg-green-700" : "bg-gray-500 opacity-50 cursor-not-allowed"}`}
                                disabled={isSaving || getChangedItems().length === 0}
                            >
                                {isSaving ? (
                                    <Loader2 className="animate-spin h-4 w-4" />
                                ) : (
                                    <Save className="h-4 w-4" />
                                )}
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div 
                    className="flex-1 p-2 pt-0 relative"
                    style={{ 
                        height: 'calc(100vh - 104px)',
                        minHeight: '500px'
                    }}
                >
                    <div className="relative overflow-x-auto bg-gray-900 rounded-lg shadow">
                        {/* Single table with sticky header */}
                        <div 
                            ref={tableRef}
                            className="overflow-x-auto overflow-y-auto"
                            style={{ maxHeight: 'calc(100vh - 104px)' }}
                        >
                            <table className="min-w-full divide-y divide-gray-700 border-collapse">
                                <thead className="bg-gray-700 sticky top-0 z-10">
                                    <tr>
                                        <th 
                                            className={`px-1 py-2.5 text-center text-xs font-semibold text-white uppercase tracking-wider w-14 bg-gray-700 cursor-pointer hover:bg-gray-600 ${sortField === "id" ? "bg-gray-600" : ""}`}
                                            onClick={() => handleSortOption("id", sortField === "id" && sortDirection === "asc" ? "desc" : "asc")}
                                        >
                                            <div className="flex items-center justify-center">
                                                ID
                                                {sortField === "id" && (
                                                    sortDirection === "asc" ? <ArrowUp size={12} className="ml-1" /> : <ArrowDown size={12} className="ml-1" />
                                                )}
                                            </div>
                                        </th>
                                        <th className="px-1 py-2.5 text-center text-xs font-semibold text-white uppercase tracking-wider w-18 bg-gray-700">
                                            Image
                                        </th>
                                        <th
                                            className={`px-1 py-2.5 text-center text-xs font-semibold text-white uppercase tracking-wider w-75 bg-gray-700 cursor-pointer hover:bg-gray-600 ${sortField === "name" ? "bg-gray-600" : ""}`}
                                            onClick={() => handleSortOption("name", sortField === "name" && sortDirection === "asc" ? "desc" : "asc")}
                                        >
                                            <div className="flex items-center justify-center">
                                                Item Name
                                                {sortField === "name" && (
                                                    sortDirection === "asc" ? <ArrowUp size={12} className="ml-1" /> : <ArrowDown size={12} className="ml-1" />
                                                )}
                                            </div>
                                        </th>
                                        <th
                                            className={`px-1 py-2.5 text-center text-xs font-semibold text-white uppercase tracking-wider w-20 bg-gray-700 cursor-pointer hover:bg-gray-600 ${sortField === "type" ? "bg-gray-600" : ""}`}
                                            onClick={() => handleSortOption("type", sortField === "type" && sortDirection === "asc" ? "desc" : "asc")}
                                        >
                                            <div className="flex items-center justify-center">
                                                Type
                                                {sortField === "type" && (
                                                    sortDirection === "asc" ? <ArrowUp size={12} className="ml-1" /> : <ArrowDown size={12} className="ml-1" />
                                                )}
                                            </div>
                                        </th>
                                        {/* Add status column */}
                                        <th className="px-1 py-2.5 text-center text-xs font-semibold text-white uppercase tracking-wider w-28 bg-gray-700">
                                            Status
                                        </th>
                                        <th
                                            className={`px-1 py-2.5 text-center text-xs font-semibold text-white uppercase tracking-wider w-30 bg-gray-700 cursor-pointer hover:bg-gray-600 ${sortField === "beginning_qty" ? "bg-gray-600" : ""}`}
                                            onClick={() => handleSortOption("beginning_qty", sortField === "beginning_qty" && sortDirection === "asc" ? "desc" : "asc")}
                                        >
                                            <div className="flex items-center justify-center">
                                                Inv. Beg.
                                                {sortField === "beginning_qty" && (
                                                    sortDirection === "asc" ? <ArrowUp size={12} className="ml-1" /> : <ArrowDown size={12} className="ml-1" />
                                                )}
                                            </div>
                                        </th>
                                        <th
                                            className={`px-1 py-2.5 text-center text-xs font-semibold text-white uppercase tracking-wider w-36 bg-gray-700 cursor-pointer hover:bg-gray-600 ${sortField === "used_qty" ? "bg-gray-600" : ""}`}
                                            onClick={() => handleSortOption("used_qty", sortField === "used_qty" && sortDirection === "asc" ? "desc" : "asc")}
                                        >
                                            <div className="flex items-center justify-center">
                                                Delivered
                                                {sortField === "used_qty" && (
                                                    sortDirection === "asc" ? <ArrowUp size={12} className="ml-1" /> : <ArrowDown size={12} className="ml-1" />
                                                )}
                                            </div>
                                        </th>
                                        <th
                                            className={`px-1 py-2.5 text-center text-xs font-semibold text-white uppercase tracking-wider w-30 bg-gray-700 cursor-pointer hover:bg-gray-600 ${sortField === "ending_qty" ? "bg-gray-600" : ""}`}
                                            onClick={() => handleSortOption("ending_qty", sortField === "ending_qty" && sortDirection === "asc" ? "desc" : "asc")}
                                        >
                                            <div className="flex items-center justify-center">
                                                Inv. End.
                                                {sortField === "ending_qty" && (
                                                    sortDirection === "asc" ? <ArrowUp size={12} className="ml-1" /> : <ArrowDown size={12} className="ml-1" />
                                                )}
                                            </div>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-gray-800 divide-y divide-gray-700">
                                    {isLoading ? (
                                        <tr>
                                            <td colSpan={8} className="px-6 py-6 text-center text-gray-400">
                                                <div className="flex justify-center items-center">
                                                    <Loader2 className="h-6 w-6 animate-spin mr-2" />
                                                    <span className="font-medium">Loading data...</span>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : filteredItems.length === 0 ? (
                                        <tr>
                                            <td colSpan={8} className="px-6 py-6 text-center text-gray-400">
                                                <span className="font-medium">No items found</span>
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredItems.map((item) => (
                                            <tr key={item.id} className="hover:bg-gray-700/60 transition-colors">
                                                <td className="px-1 text-center py-1 whitespace-nowrap text-sm font-medium text-gray-300 w-14">
                                                    {item.type === 'product' 
                                                        ? item.product_id 
                                                        : productCount + Number(item.inventory_id) // Apply the offset for inventory items
                                                    }
                                                </td>
                                                <td className="px-1 py-1 text-center whitespace-nowrap w-18">
                                                    {item.image ? (
                                                        <div className="flex items-center justify-center">
                                                            <img 
                                                                src={getImagePath(item)}
                                                                alt={item.name}
                                                                className="w-10 h-10 object-cover rounded-md border border-gray-600"
                                                                onError={(e) => {
                                                                    (e.target as HTMLImageElement).onerror = null;
                                                                    (e.target as HTMLImageElement).src = '/placeholder.png';
                                                                }}
                                                            />
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center justify-center">
                                                            <div className="w-10 h-10 bg-gray-700 rounded-md flex items-center justify-center text-gray-400 border border-gray-600"></div>
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-1 py-1 pl-10 text-left whitespace-nowrap text-sm font-medium w-75 text-gray-300">
                                                    {item.name}
                                                </td>
                                                <td className="px-1 py-1 text-center whitespace-nowrap text-sm text-gray-300 w-28">
                                                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full
                                                        ${item.type === 'product' ? 'bg-blue-900 text-blue-200' : 'bg-purple-900 text-purple-200'}`}
                                                    >
                                                        {item.type === 'product' ? 'Product' : 'Inventory'}
                                                    </span>
                                                </td>
                                                {/* Status cell */}
                                                <td className="px-1 py-1 text-center whitespace-nowrap w-28">
                                                    <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                                                        ${
                                                            (item.beginning_qty || 0) >= 30
                                                                ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                                                                : (item.beginning_qty || 0) >= 10
                                                                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                                                : (item.beginning_qty || 0) >= 5
                                                                ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                                                                : (item.beginning_qty || 0) === 0
                                                                ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                                                                : "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
                                                        }`}
                                                    >
                                                        {getStatusText(item.beginning_qty || 0)}
                                                    </span>
                                                </td>
                                                <td className="px-1 py-1 text-center whitespace-nowrap text-sm text-gray-300 w-25">
                                                    {formatNumber(item.beginning_qty || 0)}
                                                </td>
                                                <td className="px-1 py-1 text-center whitespace-nowrap text-sm text-gray-300 w-36">
                                                    <div className="flex items-center justify-center gap-1.5">
                                                        <button 
                                                            className="cursor-pointer"
                                                            onClick={() => adjustUsedQty(item.id, -1)}
                                                            disabled={(item.used_qty || 0) <= (item.original_used_qty || 0)}
                                                        >
                                                            <CircleMinus 
                                                                size={17} 
                                                                className={(item.used_qty || 0) > (item.original_used_qty || 0) 
                                                                    ? "text-red-500" 
                                                                    : "text-red-800 cursor-not-allowed"}
                                                            />
                                                        </button>
                                                        <input
                                                            type="number"
                                                            min={item.original_used_qty || 0}
                                                            step="0.01"
                                                            value={focusedInputId === item.id 
                                                                ? inputValue[item.id] || '' 
                                                                : (item.used_qty !== undefined && item.used_qty !== null ? formatNumber(item.used_qty) : '')}
                                                            onChange={(e) => handleQtyChange(item.id, e.target.value)}
                                                            onFocus={() => handleInputFocus(item.id)}
                                                            onBlur={() => handleInputBlur(item.id)}
                                                            placeholder=""
                                                            className={`w-18 h-7 rounded focus:outline-none focus:ring-1 focus:ring-inset focus:ring-white-400 text-white text-center`}
                                                        />
                                                        <button 
                                                            className="cursor-pointer"
                                                            onClick={() => adjustUsedQty(item.id, 1)}
                                                        >
                                                            <CirclePlus size={17} className="text-green-500" />
                                                        </button>
                                                    </div>
                                                </td>
                                                <td className="px-1 py-1 text-center whitespace-nowrap text-sm text-gray-300 w-25">
                                                    {formatNumber(item.ending_qty || 0)}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </StaffLayout>
    );
}
