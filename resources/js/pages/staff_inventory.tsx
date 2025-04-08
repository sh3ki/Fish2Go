import { useState, useEffect, useRef } from "react";
import StaffLayout from "@/components/staff/StaffLayout";
import { type BreadcrumbItem } from "@/types";
import { Head } from "@inertiajs/react";
import axios from "axios";
import { 
  Loader2, CirclePlus, CircleMinus, Save,
  ArrowUp, ArrowDown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import SearchBar from "@/components/ui/search-bar";
import FilterButton from "@/components/ui/filter-button";
import SortButton from "@/components/ui/sort-button";
import toast, { Toaster } from "react-hot-toast";

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
    created_at: string;
    beginning_qty?: number; // Quantity at the beginning of the day
    used_qty?: number; // Quantity used today
    ending_qty?: number; // Quantity at the end of the day
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
            const response = await axios.get("/api/staff/inventory");
            
            // Process the inventory data to include beginning/used/ending quantities
            const processedInventory = response.data.map((item: InventoryItem) => ({
                ...item,
                beginning_qty: item.inventory_qty, // Initially set beginning qty to current qty
                used_qty: 0, // Default to 0 used
                ending_qty: item.inventory_qty // Initially ending qty equals beginning qty
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
                    // Ensure used_qty doesn't go below 0 or above beginning_qty
                    const newUsedQty = Math.max(0, Math.min((item.used_qty || 0) + delta, item.beginning_qty || 0));
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

    const setUsedQty = (id: number, value: number) => {
        // Direct setting of used quantity
        const updateInventory = (list: InventoryItem[]) =>
            list.map(item => {
                if (item.inventory_id === id) {
                    // Parse and validate the input
                    const newValue = Math.max(0, Math.min(value, item.beginning_qty || 0));
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

    const saveInventoryChanges = async () => {
        setIsSaving(true);
        try {
            // Prepare data for saving
            const inventoryUpdates = inventory.map(item => ({
                inventory_id: item.inventory_id,
                beginning_qty: item.beginning_qty,
                used_qty: item.used_qty,
                ending_qty: item.ending_qty
            }));
            
            // Call API to save changes
            await axios.post('/api/staff/inventory/update', { inventory: inventoryUpdates });
            
            // Update image timestamps after successful save to refresh images if needed
            const newTimestamps = { ...imageTimestamps };
            inventory.forEach(item => {
                if (item.inventory_image) {
                    newTimestamps[item.inventory_id] = Date.now();
                }
            });
            setImageTimestamps(newTimestamps);
            
            toast.success('Inventory successfully updated');
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
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                {/* Search, Filter, Sort, and Save Controls */}
                <div className="flex justify-between items-center mb-4">
                    <div className="flex gap-2 items-center flex-1">
                        <SearchBar
                            placeholder="Search inventory..."
                            items={inventory}
                            searchField="inventory_name"
                            onSearchResults={handleSearchResults}
                            onSearchTermChange={handleSearchTermChange}
                            className="input w-full bg-gray-700 p-1.5 pl-3 text-sm text-white rounded-lg focus:outline-none focus:ring-1 focus:ring-inset focus:ring-white-400"
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
                    
                    <Button 
                        onClick={saveInventoryChanges}
                        className="ml-2 bg-green-600 hover:bg-green-700"
                        disabled={isSaving}
                    >
                        {isSaving ? (
                            <>
                                <Loader2 className="animate-spin mr-2 h-4 w-4" />
                                Saving...
                            </>
                        ) : (
                            <>
                                <Save className="mr-2 h-4 w-4" />
                                Save Changes
                            </>
                        )}
                    </Button>
                </div>

                {/* Table */}
                <div className="relative overflow-x-auto bg-gray-900 rounded-lg shadow flex-1">
                    {/* Table Header */}
                    <div className="sticky top-0 bg-gray-900 shadow-md">
                        <table className="min-w-full divide-y divide-gray-700 border-collapse">
                            <thead className="bg-gray-700">
                                <tr>
                                    <th 
                                        className={`px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider w-16 cursor-pointer hover:bg-gray-600 ${sortField === "inventory_id" ? "bg-gray-600" : ""}`}
                                        onClick={() => handleSortOption("inventory_id", sortField === "inventory_id" && sortDirection === "asc" ? "desc" : "asc")}
                                    >
                                        <div className="flex items-center">
                                            ID
                                            {sortField === "inventory_id" && (
                                                sortDirection === "asc" ? <ArrowUp size={12} className="ml-1" /> : <ArrowDown size={12} className="ml-1" />
                                            )}
                                        </div>
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider w-20">
                                        Image
                                    </th>
                                    <th
                                        className={`px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider flex-1 cursor-pointer hover:bg-gray-600 ${sortField === "inventory_name" ? "bg-gray-600" : ""}`}
                                        onClick={() => handleSortOption("inventory_name", sortField === "inventory_name" && sortDirection === "asc" ? "desc" : "asc")}
                                    >
                                        <div className="flex items-center">
                                            Item
                                            {sortField === "inventory_name" && (
                                                sortDirection === "asc" ? <ArrowUp size={12} className="ml-1" /> : <ArrowDown size={12} className="ml-1" />
                                            )}
                                        </div>
                                    </th>
                                    <th
                                        className={`px-6 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wider w-32 cursor-pointer hover:bg-gray-600 ${sortField === "beginning_qty" ? "bg-gray-600" : ""}`}
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
                                        className={`px-6 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wider w-32 cursor-pointer hover:bg-gray-600 ${sortField === "used_qty" ? "bg-gray-600" : ""}`}
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
                                        className={`px-6 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wider w-32 cursor-pointer hover:bg-gray-600 ${sortField === "ending_qty" ? "bg-gray-600" : ""}`}
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
                        style={{ maxHeight: "calc(100vh - 200px)" }}
                    >
                        <table className="min-w-full divide-y divide-gray-700 border-collapse">
                            <tbody className="bg-gray-800 divide-y divide-gray-700">
                                {isLoading ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-6 text-center text-gray-400">
                                            <div className="flex justify-center items-center">
                                                <Loader2 className="h-6 w-6 animate-spin mr-2" />
                                                <span className="font-medium">Loading inventory data...</span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : filteredInventory.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-6 text-center text-gray-400">
                                            <span className="font-medium">No inventory items found</span>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredInventory.map((item) => (
                                        <tr key={item.inventory_id} className="hover:bg-gray-700/60 transition-colors">
                                            <td className="px-6 py-4 text-left text-sm text-gray-300 w-16">
                                                {item.inventory_id}
                                            </td>
                                            <td className="px-6 py-4 text-center w-20">
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
                                            <td className="px-6 py-4 text-left text-sm text-gray-300 flex-1">
                                                {item.inventory_name}
                                            </td>
                                            <td className="px-6 py-4 text-center text-sm text-gray-300 w-32">
                                                {item.beginning_qty || 0}
                                            </td>
                                            <td className="px-6 py-4 text-center text-sm text-gray-300 w-32">
                                                <div className="flex items-center justify-center gap-1">
                                                    <button 
                                                        className="cursor-pointer"
                                                        onClick={() => adjustUsedQty(item.inventory_id, -1)}
                                                        disabled={(item.used_qty || 0) <= 0}
                                                    >
                                                        <CircleMinus size={17} className={(item.used_qty || 0) > 0 ? "text-red-500" : "text-red-800"} />
                                                    </button>
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        max={item.beginning_qty}
                                                        value={item.used_qty || 0}
                                                        onChange={(e) => setUsedQty(item.inventory_id, parseInt(e.target.value) || 0)}
                                                        className="w-12 h-7 bg-gray-700 border border-gray-600 rounded text-white text-center"
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
                                            <td className="px-6 py-4 text-center text-sm text-gray-300 w-32">
                                                {item.ending_qty || 0}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </StaffLayout>
    );
}
