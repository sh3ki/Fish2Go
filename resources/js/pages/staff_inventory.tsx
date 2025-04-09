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
        title: "Inventory",
        href: "/staff/inventory",
    },
];

interface InventoryItem {
    inventory_id: number;
    inventory_name: string;
    inventory_qty: number;
    inventory_price: number;
    inventory_image: string | null;
    inventory_used: number; // Add inventory_used field from database
    created_at: string;
    beginning_qty?: number; // Quantity at the beginning of the day
    used_qty?: number; // Quantity used today
    ending_qty?: number; // Quantity at the end of the day
    original_used_qty?: number; // Store the original used qty for reference
}

export default function InventoryPOS() {
    // State management
    const [inventory, setInventory] = useState<InventoryItem[]>([]); // Original inventory
    const [filteredInventory, setFilteredInventory] = useState<InventoryItem[]>([]); // Filtered inventory
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [isSaving, setIsSaving] = useState<boolean>(false);
    const [sortField, setSortField] = useState<string>("inventory_id");
    const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
    const [searchTerm, setSearchTerm] = useState<string>("");
    const [activeFilter, setActiveFilter] = useState<string>("all");
    const [imageTimestamps, setImageTimestamps] = useState<Record<number, number>>({}); // Add imageTimestamps state
    const tableRef = useRef<HTMLDivElement>(null);
    const [isFullScreen, setIsFullScreen] = useState(false); // Add isFullScreen state
    const [showSaveModal, setShowSaveModal] = useState(false); // Add state for the modal
    const [focusedInputId, setFocusedInputId] = useState<number | null>(null); // Add state for tracking which input is focused
    const [errorMessage, setErrorMessage] = useState<string | null>(null); // Add error message state
    const [inputValue, setInputValue] = useState<Record<number, string>>({}); // Track input values separately

    // Fix the number formatting utility function to handle non-numeric values
    const formatNumber = (value: number | null | undefined): string => {
        // Ensure we're working with a valid number
        const numValue = Number(value || 0);
        return Number.isInteger(numValue) ? numValue.toString() : numValue.toFixed(2).replace(/\.?0+$/, '');
    };
    
    // Initialize inventory data
    useEffect(() => {
        fetchInventory();
    }, []);

    // Apply filters, search and sort
    useEffect(() => {
        applyFilters();
    }, [sortField, sortDirection, searchTerm, activeFilter, inventory]);

    const fetchInventory = async () => {
        setIsLoading(true);
        try {
            const response = await axios.get("/staff/inventory");
            
            // Process the inventory data to include beginning/used/ending quantities
            const processedInventory = response.data.map((item: InventoryItem) => ({
                ...item,
                beginning_qty: item.inventory_qty, // Initially set beginning qty to current qty
                used_qty: item.inventory_used, // Use inventory_used from database as initial value
                original_used_qty: item.inventory_used, // Store the original value for reference
                ending_qty: item.inventory_qty - item.inventory_used // Calculate ending qty
            }));
            
            setInventory(processedInventory);
            setFilteredInventory(processedInventory);
            
            // Initialize image timestamps for all items
            const timestamps: Record<number, number> = {};
            processedInventory.forEach(item => {
                if (item.inventory_image) {
                    timestamps[item.inventory_id] = Date.now();
                }
            });
            setImageTimestamps(timestamps);
        } catch (error) {
            console.error("Error fetching inventory:", error);
            toast.error("Failed to load inventory data");
        } finally {
            setIsLoading(false);
        }
    };

    const applyFilters = () => {
        let filtered = [...inventory];

        // Apply search filter
        if (searchTerm.trim() !== "") {
            const query = searchTerm.toLowerCase();
            filtered = filtered.filter(
                (item) =>
                    item.inventory_name.toLowerCase().includes(query) ||
                    item.inventory_id.toString().includes(query)
            );
        }

        // Apply status filter
        if (activeFilter === "available") {
            filtered = filtered.filter(item => item.inventory_qty > 0);
        } else if (activeFilter === "lowstock") {
            filtered = filtered.filter(item => item.inventory_qty > 0 && item.inventory_qty < 10);
        } else if (activeFilter === "outofstock") {
            filtered = filtered.filter(item => item.inventory_qty === 0);
        }

        // Apply sorting
        filtered = sortInventory(filtered);

        setFilteredInventory(filtered);
    };

    const sortInventory = (inventoryToSort: InventoryItem[]) => {
        return [...inventoryToSort].sort((a, b) => {
            let valueA, valueB;
            
            switch (sortField) {
                case "inventory_name":
                    valueA = a.inventory_name.toLowerCase();
                    valueB = b.inventory_name.toLowerCase();
                    break;
                case "inventory_qty":
                    valueA = a.inventory_qty;
                    valueB = b.inventory_qty;
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
                case "inventory_price":
                    valueA = a.inventory_price;
                    valueB = b.inventory_price;
                    break;
                default: // inventory_id as default
                    valueA = a.inventory_id;
                    valueB = b.inventory_id;
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
        const filtered = results as InventoryItem[];
        
        // Apply active filter on search results
        let finalResults = filtered;
        if (activeFilter === "available") {
            finalResults = filtered.filter(item => item.inventory_qty > 0);
        } else if (activeFilter === "lowstock") {
            finalResults = filtered.filter(item => item.inventory_qty > 0 && item.inventory_qty < 10);
        } else if (activeFilter === "outofstock") {
            finalResults = filtered.filter(item => item.inventory_qty === 0);
        }
        
        // Apply sorting
        const sortedResults = sortInventory(finalResults);
        setFilteredInventory(sortedResults);
    };

    const handleSearchTermChange = (term: string) => {
        setSearchTerm(term);
    };

    const handleFilterChange = (filterId: string | number) => {
        setActiveFilter(filterId as string);
    };

    // Handle quantity adjustments
    const adjustUsedQty = (id: number, delta: number) => {
        // Update the inventory and filtered inventory
        const updateInventory = (list: InventoryItem[]) =>
            list.map(item => {
                if (item.inventory_id === id) {
                    // Ensure used_qty doesn't go below original_used_qty or above beginning_qty
                    const minValue = item.original_used_qty || 0;
                    const newUsedQty = Math.max(minValue, Math.min((item.used_qty || 0) + delta, item.beginning_qty || 0));
                    
                    return {
                        ...item,
                        used_qty: newUsedQty,
                        ending_qty: (item.beginning_qty || 0) - newUsedQty
                    };
                }
                return item;
            });
        
        setInventory(updateInventory(inventory));
        setFilteredInventory(updateInventory(filteredInventory));
    };

    const setUsedQty = (id: number, value: number | null) => {
        // Direct setting of used quantity
        const updateInventory = (list: InventoryItem[]) =>
            list.map(item => {
                if (item.inventory_id === id) {
                    // If value is null (empty input), revert to original inventory_used value
                    if (value === null) {
                        return {
                            ...item,
                            used_qty: item.original_used_qty || 0, 
                            ending_qty: (item.beginning_qty || 0) - (item.original_used_qty || 0)
                        };
                    }
                    
                    // Ensure value is not less than the original inventory_used
                    const minValue = item.original_used_qty || 0;
                    const newValue = Math.max(minValue, Math.min(value, item.beginning_qty || 0));
                    
                    return {
                        ...item,
                        used_qty: newValue,
                        ending_qty: (item.beginning_qty || 0) - newValue
                    };
                }
                return item;
            });
        
        setInventory(updateInventory(inventory));
        setFilteredInventory(updateInventory(filteredInventory));
    };

    // Handle quantity change with validation - improved validation logic
    const handleQtyChange = (id: number, value: string) => {
        // Store the current input value for this field
        setInputValue(prev => ({
            ...prev,
            [id]: value
        }));
        
        // If input is empty, just update the visual state
        if (value.trim() === '') {
            return;
        }
        
        const item = inventory.find(item => item.inventory_id === id);
        if (!item) return;
        
        const parsedQty = parseFloat(value);
        const maxAllowed = item.beginning_qty || 0;
        
        // Validate against minimum (original used qty)
        if (parsedQty < (item.original_used_qty || 0)) {
            setErrorMessage(`Cannot set value below ${formatNumber(item.original_used_qty || 0)}. This is the minimum required value.`);
            setTimeout(() => setErrorMessage(null), 3000);
            return;
        }
        
        // Validate against maximum (beginning qty)
        if (parsedQty > maxAllowed) {
            setErrorMessage(`Cannot set ${parsedQty}. Maximum available quantity is ${formatNumber(maxAllowed)}.`);
            setTimeout(() => setErrorMessage(null), 3000);
            
            // Keep only valid digits that would be below the max
            const maxString = maxAllowed.toString();
            const valueDigits = value.replace(/\D/g, ''); // Keep only digits
            
            // Find the longest valid prefix of digits that would be below max
            let validPrefix = '';
            for (let i = 0; i < valueDigits.length; i++) {
                const testValue = parseInt(valueDigits.slice(0, i + 1));
                if (testValue <= maxAllowed) {
                    validPrefix = valueDigits.slice(0, i + 1);
                } else {
                    // Found a prefix that would exceed max, stop here
                    break;
                }
            }
            
            // If all digits exceed max, just keep the first digit if valid
            if (validPrefix === '' && valueDigits.length > 0) {
                const firstDigit = parseInt(valueDigits[0]);
                if (firstDigit <= parseInt(maxString[0])) {
                    validPrefix = valueDigits[0];
                }
            }
            
            // Update the input value with the valid prefix
            setInputValue(prev => ({
                ...prev,
                [id]: validPrefix
            }));
            
            // If valid prefix is empty, don't update the used qty
            if (validPrefix === '') return;
            
            // Update the used qty with the valid prefix
            setUsedQty(id, parseFloat(validPrefix));
            return;
        }
        
        // Input is valid, update the used qty
        setUsedQty(id, parsedQty);
    };

    // Handle input focus - completely clear zero values
    const handleInputFocus = (id: number) => {
        setFocusedInputId(id);
        
        const item = inventory.find(item => item.inventory_id === id);
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

    // Handle input blur
    const handleInputBlur = (id: number) => {
        setFocusedInputId(null);
        
        const value = inputValue[id];
        const item = inventory.find(item => item.inventory_id === id);
        
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
                // Ensure within min/max bounds
                const boundedValue = Math.max(
                    item.original_used_qty || 0,
                    Math.min(parsedQty, item.beginning_qty || 0)
                );
                setUsedQty(id, boundedValue);
            }
        }
    };

    // Function to get changed inventory items
    const getChangedItems = () => {
        return inventory.filter(item => 
            (item.used_qty || 0) !== (item.original_used_qty || 0)
        );
    };

    // Updated to show modal instead of saving directly
    const handleSaveButtonClick = () => {
        const changedItems = getChangedItems();
        if (changedItems.length === 0) {
            toast.info('No inventory changes to save');
            return;
        }
        setShowSaveModal(true);
    };

    const saveInventoryChanges = async () => {
        setIsSaving(true);
        try {
            // Only send changed items that have valid used_qty values
            const inventoryUpdates = getChangedItems().map(item => ({
                inventory_id: item.inventory_id,
                used_qty: item.used_qty || 0 // Ensure we have a valid value
            }));
            
            // Call API to save changes
            const response = await axios.post('/staff/inventory/update', { 
                inventory: inventoryUpdates 
            });
            
            // Update image timestamps after successful save to refresh images if needed
            const newTimestamps = { ...imageTimestamps };
            inventory.forEach(item => {
                if (item.inventory_image) {
                    newTimestamps[item.inventory_id] = Date.now();
                }
            });
            setImageTimestamps(newTimestamps);
            
            // Update local data to reflect saved state
            setInventory(inventory.map(item => {
                const found = getChangedItems().find(changed => changed.inventory_id === item.inventory_id);
                if (found) {
                    return {
                        ...item,
                        original_used_qty: found.used_qty // Update the original value to match what was saved
                    };
                }
                return item;
            }));
            
            toast.success('Inventory successfully updated');
            setShowSaveModal(false); // Close the modal after successful save
        } catch (error) {
            console.error('Error saving inventory:', error);
            toast.error('Failed to save inventory changes');
        } finally {
            setIsSaving(false);
        }
    };

    const filterOptions = [
        { id: "all", name: "All Items" },
        { id: "available", name: "Available" },
        { id: "lowstock", name: "Low Stock" },
        { id: "outofstock", name: "Out of Stock" },
    ];

    return (
        <StaffLayout breadcrumbs={breadcrumbs}>
            <Head title="Inventory" />
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
                    <div className="bg-gray-800 p-2 pt-3 rounded-xl w-xs w-full max-w-md relative">
                        {/* Close button */}
                        <button 
                            onClick={() => setShowSaveModal(false)}
                            className="absolute top-1 right-1 text-white-500"
                        >
                            <CircleX size={20} />
                        </button>
                        
                        <div className="flex justify-center items-center mb-2">
                            <h2 className="text-xl font-bold text-white">Inventory Used</h2>
                        </div>
                      
                        {/* Changed Items List - updated to 3 columns with fixed height */}
                        <div className="p-2 rounded-lg bg-gray-800 mb-2" style={{ maxHeight: '350px' }}>
                            <div className="grid grid-cols-12 px-2 text-white font-semibold border-b border-gray-700 pb-4">
                                <div className="col-span-7">Item Name</div>
                                <div className="col-span-3 text-center">Used</div>
                                <div className="col-span-2 text-center">Qty</div>
                            </div>
                            
                            <div className="overflow-y-auto" style={{ maxHeight: '280px' }}>
                                {getChangedItems().length === 0 ? (
                                    <div className="text-center text-gray-400">No changes to save</div>
                                ) : (
                                    getChangedItems().map((item) => {
                                        // Calculate the difference between new and original values
                                        const difference = (item.used_qty || 0) - (item.original_used_qty || 0);
                                        // Format the difference with a + sign for increases
                                        const formattedDifference = difference > 0 
                                            ? '+' + formatNumber(difference) 
                                            : formatNumber(difference);
                                        // Determine text color based on the difference
                                        const textColorClass = difference > 0 
                                            ? "text-green-400" 
                                            : difference < 0 
                                                ? "text-red-400" 
                                                : "text-white";
                                        
                                        return (
                                            <div key={item.inventory_id} className="grid grid-cols-12 py-1 px-2 border-b border-gray-700">
                                                <span className="col-span-7 text-white text-sm font-medium truncate">{item.inventory_name}</span>
                                                <span className="col-span-3 text-white text-sm text-center">Used:</span>
                                                <span className={`col-span-2 text-sm text-center ${textColorClass}`}>{formattedDifference}</span>
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
                                onClick={saveInventoryChanges}
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
                                placeholder="Search Inventory"
                                items={inventory}
                                searchField="inventory_name"
                                onSearchResults={handleSearchResults}
                                onSearchTermChange={handleSearchTermChange}
                                className="input w-full bg-gray-600 p-1 pl-3 text-white rounded-lg focus:outline-none focus:ring-1 focus:ring-inset focus:ring-white-400"
                            />
                            
                            <FilterButton
                                options={filterOptions}
                                activeFilter={activeFilter}
                                onSelectFilter={handleFilterChange}
                                includeAvailable={false}
                            />
                            
                            <SortButton
                                options={[
                                    { field: "inventory_id", label: "ID", type: "numeric" },
                                    { field: "inventory_name", label: "Name", type: "text" },
                                    { field: "beginning_qty", label: "Beginning", type: "numeric" },
                                    { field: "used_qty", label: "Used", type: "numeric" },
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
                                className="bg-gray-500 rounded-lg flex items-center gap-1 h-8 px-3"
                                disabled={isSaving}
                            >
                                {isSaving ? (
                                    <>
                                        <Loader2 className="animate-spin h-4 w-4" />
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <Save className="h-4 w-4" />
                                        Save Changes
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div 
                    className="flex-1 p-2 pt-0 relative"
                    style={{ 
                        height: 'calc(100vh - 150px)',
                        minHeight: '500px'
                    }}
                >
                    <div className="relative overflow-x-auto bg-gray-900 rounded-lg shadow">
                        {/* Table Header */}
                        <div className="sticky top-0 bg-gray-900 shadow-md">
                            <table className="min-w-full divide-y divide-gray-700 border-collapse">
                                <thead className="bg-gray-700">
                                    <tr>
                                        <th 
                                            className={`px-1 py-2.5 text-center text-xs font-semibold text-white uppercase tracking-wider w-14 bg-gray-700 cursor-pointer hover:bg-gray-600 ${sortField === "inventory_id" ? "bg-gray-600" : ""}`}
                                            onClick={() => handleSortOption("inventory_id", sortField === "inventory_id" && sortDirection === "asc" ? "desc" : "asc")}
                                        >
                                            <div className="flex items-center justify-center">
                                                ID
                                                {sortField === "inventory_id" && (
                                                    sortDirection === "asc" ? <ArrowUp size={12} className="ml-1" /> : <ArrowDown size={12} className="ml-1" />
                                                )}
                                            </div>
                                        </th>
                                        <th className="px-1 py-2.5 text-center text-xs font-semibold text-white uppercase tracking-wider w-18 bg-gray-700">
                                            Image
                                        </th>
                                        <th
                                            className={`px-1 py-2.5 text-center text-xs font-semibold text-white uppercase tracking-wider w-80 bg-gray-700 cursor-pointer hover:bg-gray-600 ${sortField === "inventory_name" ? "bg-gray-600" : ""}`}
                                            onClick={() => handleSortOption("inventory_name", sortField === "inventory_name" && sortDirection === "asc" ? "desc" : "asc")}
                                        >
                                            <div className="flex items-center justify-center">
                                                Item Name
                                                {sortField === "inventory_name" && (
                                                    sortDirection === "asc" ? <ArrowUp size={12} className="ml-1" /> : <ArrowDown size={12} className="ml-1" />
                                                )}
                                            </div>
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
                                                Used
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
                                                Inv. End
                                                {sortField === "ending_qty" && (
                                                    sortDirection === "asc" ? <ArrowUp size={12} className="ml-1" /> : <ArrowDown size={12} className="ml-1" />
                                                )}
                                            </div>
                                        </th>
                                    </tr>
                                </thead>
                            </table>
                        </div>
                        
                        {/* Table Body with Scrolling */}
                        <div 
                            ref={tableRef}
                            className="overflow-y-auto"
                            style={{ maxHeight: 'calc(100vh - 141px)' }}
                        >
                            <table className="min-w-full divide-y divide-gray-700 border-collapse">
                                <tbody className="bg-gray-800 divide-y divide-gray-700">
                                    {isLoading ? (
                                        <tr>
                                            <td colSpan={7} className="px-6 py-6 text-center text-gray-400">
                                                <div className="flex justify-center items-center">
                                                    <Loader2 className="h-6 w-6 animate-spin mr-2" />
                                                    <span className="font-medium">Loading inventory data...</span>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : filteredInventory.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="px-6 py-6 text-center text-gray-400">
                                                <span className="font-medium">No inventory items found</span>
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredInventory.map((item) => (
                                            <tr key={item.inventory_id} className="hover:bg-gray-700/60 transition-colors">
                                                <td className="px-1 text-center py-1 whitespace-nowrap text-sm font-medium text-gray-300 w-14">
                                                    {item.inventory_id}
                                                </td>
                                                <td className="px-1 py-1 text-center whitespace-nowrap w-18">
                                                    {item.inventory_image ? (
                                                        <div className="flex items-center justify-center">
                                                            <img 
                                                                src={`/storage/inventory/${item.inventory_image}${imageTimestamps[item.inventory_id] ? `?t=${imageTimestamps[item.inventory_id]}` : ''}`}
                                                                alt={item.inventory_name}
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
                                                <td className="px-1 py-1 pl-10 text-left whitespace-nowrap text-sm font-medium w-80 text-gray-300">
                                                    {item.inventory_name}
                                                </td>
                                                <td className="px-1 py-1 text-center whitespace-nowrap text-sm text-gray-300 w-30">
                                                    {formatNumber(item.beginning_qty || 0)}
                                                </td>
                                                <td className="px-1 py-1 text-center whitespace-nowrap text-sm text-gray-300 w-36">
                                                    <div className="flex items-center justify-center gap-1.5">
                                                        <button 
                                                            className="cursor-pointer"
                                                            onClick={() => adjustUsedQty(item.inventory_id, -1)}
                                                            disabled={(item.used_qty || 0) <= (item.original_used_qty || 0)}
                                                        >
                                                            <CircleMinus size={17} className={(item.used_qty || 0) > (item.original_used_qty || 0) ? "text-red-500" : "text-red-800"} />
                                                        </button>
                                                        <input
                                                            type="number"
                                                            min={item.original_used_qty || 0}
                                                            max={item.beginning_qty}
                                                            step="0.01"
                                                            value={focusedInputId === item.inventory_id 
                                                                ? inputValue[item.inventory_id] || '' 
                                                                : (item.used_qty !== undefined && item.used_qty !== null ? formatNumber(item.used_qty) : '')}
                                                            onChange={(e) => handleQtyChange(item.inventory_id, e.target.value)}
                                                            onFocus={() => handleInputFocus(item.inventory_id)}
                                                            onBlur={() => handleInputBlur(item.inventory_id)}
                                                            placeholder=""
                                                            className="w-18 h-7 bg-transparent rounded focus:outline-none focus:ring-1 focus:ring-inset focus:ring-white-400 text-white text-center"
                                                        />
                                                        <button 
                                                            className="cursor-pointer"
                                                            onClick={() => adjustUsedQty(item.inventory_id, 1)}
                                                            disabled={(item.used_qty || 0) >= (item.beginning_qty || 0)}
                                                        >
                                                            <CirclePlus size={17} className={(item.used_qty || 0) < (item.beginning_qty || 0) ? "text-green-500" : "text-green-800"} />
                                                        </button>
                                                    </div>
                                                </td>
                                                <td className="px-1 py-1 text-center whitespace-nowrap text-sm text-gray-300 w-30">
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
