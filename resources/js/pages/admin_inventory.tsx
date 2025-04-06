import { useState, useEffect, useRef, useCallback } from "react";
import { useForm, usePage } from "@inertiajs/react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import AppLayout from "@/layouts/app-layout";
import { Head } from "@inertiajs/react";
import { type BreadcrumbItem } from "@/types";
import toast, { Toaster } from "react-hot-toast";
import axios from "axios";
import { confirmAlert } from "react-confirm-alert";
import "react-confirm-alert/src/react-confirm-alert.css";
import { 
  Filter, CircleX, Loader2, Plus, ArrowUp, ArrowDown, 
  ArrowDownUp, ArrowDownZA, ArrowUpAZ, ArrowUp01, ArrowDown10,
  Search, Edit, Trash2
} from "lucide-react";
import SearchBar from "@/components/ui/search-bar";

const breadcrumbs: BreadcrumbItem[] = [
  {
    title: "Inventory",
    href: "/admin/inventory",
  },
];

interface Inventory {
  inventory_id: number;
  inventory_name: string;
  inventory_qty: number;
  inventory_price: number;
  inventory_image: string | null;
  created_at: string;
}

interface PageProps {
  inventory: {
    data: Inventory[];
    total: number;
  };
  flash?: {
    success?: string;
    error?: string;
  };
  newestItems: Inventory[];
}

// Action Buttons Component
const ActionButtons = ({ onEdit, onDelete }) => (
  <div className="flex justify-center gap-1">
    <button
      onClick={onEdit}
      className="inline-flex items-center justify-center p-2 rounded-full bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 transition-colors"
    >
      <Edit size={15} />
    </button>
    <button
      onClick={onDelete}
      className="inline-flex items-center justify-center p-2 rounded-full bg-red-500/20 hover:bg-red-500/30 text-red-400 transition-colors"
    >
      <Trash2 size={15} />
    </button>
  </div>
);

export default function AdminInventory({ inventory, newestItems }: PageProps) {
  const { flash } = usePage<PageProps>().props;
  const { data, setData, reset, processing } = useForm({
    name: "",
    quantity: "",
    item_image: null as File | null,
    price: "",
  });

  // State variables
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Inventory | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [inventoryList, setInventoryList] = useState<Inventory[]>([]);
  const [filteredInventory, setFilteredInventory] = useState<Inventory[]>([]);
  const [newestItemsList, setNewestItemsList] = useState(newestItems);
  const [isLoading, setIsLoading] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [imageTimestamps, setImageTimestamps] = useState<Record<number, number>>({});
  
  // Sorting state
  const [sortField, setSortField] = useState<string>("inventory_id");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [showSortModal, setShowSortModal] = useState(false);
  const [groupBy, setGroupBy] = useState<string | null>(null);
  
  // Refs
  const tableRef = useRef<HTMLDivElement>(null);
  const filterButtonRef = useRef<HTMLButtonElement>(null);
  const filterModalRef = useRef<HTMLDivElement>(null);
  const sortButtonRef = useRef<HTMLButtonElement>(null);
  const sortModalRef = useRef<HTMLDivElement>(null);

  // Display flash messages
  useEffect(() => {
    if (flash?.success) {
      toast.success(flash.success);
    }
    if (flash?.error) {
      toast.error(flash.error);
    }
  }, [flash]);

  // Initialize inventory list from props
  useEffect(() => {
    if (inventory?.data) {
      const sortedInventory = [...inventory.data].sort((a, b) => a.inventory_id - b.inventory_id);
      setInventoryList(sortedInventory);
      setFilteredInventory(sortedInventory);
    }
  }, [inventory]);

  // Real-time newest items update
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const response = await axios.get(route("admin.inventory.fetch"));
        setNewestItemsList(response.data.newestItems);
      } catch (err) {
        console.error("Failed to update newest items:", err);
      }
    }, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, []);

  // Sort inventory when sort parameters change
  useEffect(() => {
    if (filteredInventory.length > 0) {
      const sorted = sortInventoryCopy(filteredInventory);
      setFilteredInventory(sorted);
    }
  }, [sortField, sortDirection, groupBy]);

  // Create a copy of the sort function that doesn't mutate state
  const sortInventoryCopy = (inventoryToSort: Inventory[]) => {
    let sorted = [...inventoryToSort];
    
    // First apply grouping if selected
    if (groupBy === "status") {
      sorted.sort((a, b) => {
        const statusA = getStatusText(a.inventory_qty);
        const statusB = getStatusText(b.inventory_qty);
        return statusA.localeCompare(statusB);
      });
    }
    
    // Then apply sorting within groups
    if (sortField === "inventory_id") {
      sorted = stableSort(sorted, (a, b) => 
        sortDirection === "asc" ? a.inventory_id - b.inventory_id : b.inventory_id - a.inventory_id
      );
    } else if (sortField === "inventory_name") {
      sorted = stableSort(sorted, (a, b) => 
        sortDirection === "asc" 
          ? a.inventory_name.localeCompare(b.inventory_name) 
          : b.inventory_name.localeCompare(a.inventory_name)
      );
    } else if (sortField === "price") {
      sorted = stableSort(sorted, (a, b) => {
        const priceA = parseFloat(a.inventory_price.toString());
        const priceB = parseFloat(b.inventory_price.toString());
        return sortDirection === "asc" ? priceA - priceB : priceB - priceA;
      });
    } else if (sortField === "qty") {
      sorted = stableSort(sorted, (a, b) => 
        sortDirection === "asc" ? a.inventory_qty - b.inventory_qty : b.inventory_qty - a.inventory_qty
      );
    } else if (sortField === "total") {
      sorted = stableSort(sorted, (a, b) => {
        const totalA = parseFloat(a.inventory_price.toString()) * a.inventory_qty;
        const totalB = parseFloat(b.inventory_price.toString()) * b.inventory_qty;
        return sortDirection === "asc" ? totalA - totalB : totalB - totalA;
      });
    }
    
    return sorted;
  };

  // Helper function for stable sorting within groups
  const stableSort = (array: Inventory[], compareFn: (a: Inventory, b: Inventory) => number) => {
    return array.map((item, index) => ({ item, index }))
      .sort((a, b) => {
        const order = compareFn(a.item, b.item);
        return order !== 0 ? order : a.index - b.index;
      })
      .map(({ item }) => item);
  };

  // Get user-friendly status text based on quantity
  const getStatusText = (qty: number): string => {
    if (qty >= 30) return "High Stock";
    if (qty >= 10) return "In Stock";
    if (qty >= 5) return "Low Stock";
    if (qty === 0) return "Out of Stock";
    return "Backorder";
  };

  const handleSortOption = (field: string, direction: "asc" | "desc", group: string | null = groupBy) => {
    setSortField(field);
    setSortDirection(direction);
    setGroupBy(group);
    setShowSortModal(false);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setData("item_image", file);
    setPreviewImage(URL.createObjectURL(file));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const quantity = parseInt(data.quantity, 10);
    const price = parseFloat(data.price);
    if (isNaN(quantity) || quantity < 1) {
      toast.error("❌ Invalid quantity");
      setIsLoading(false);
      return;
    }
    if (isNaN(price) || price < 0) {
      toast.error("❌ Invalid price");
      setIsLoading(false);
      return;
    }

    try {
      const formData = new FormData();
      formData.append("name", data.name);
      formData.append("quantity", quantity.toString());
      formData.append("price", price.toString());
      if (data.item_image) {
        formData.append("item_image", data.item_image);
      }
      
      if (isEditMode && selectedItem) {
        const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute("content");
        const itemId = selectedItem.inventory_id;
        const updateUrl = `/admin/inventory/${itemId}`;
        
        // Append method override for Laravel method spoofing
        formData.append("_method", "PUT");
        
        await axios.post(updateUrl, formData, {
          headers: {
            "Content-Type": "multipart/form-data",
            Accept: "application/json",
            "X-CSRF-TOKEN": csrfToken || "",
            "X-Requested-With": "XMLHttpRequest",
          },
          withCredentials: true,
        });
        toast.success("Inventory item updated successfully!");
        
        // Update image timestamp for cache busting if image was uploaded
        if (data.item_image) {
          setImageTimestamps(prev => ({
            ...prev,
            [itemId]: Date.now()
          }));
        }
        
        // Force reload all inventory after edit - just like products page
        await fetchInventoryData();
      } else {
        const response = await axios.post(route("admin.inventory.store"), formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
        toast.success("Inventory item added successfully!");
        
        // Force reload all inventory after adding a new item - just like products page
        await fetchInventoryData();
      }
      
      reset();
      setPreviewImage(null);
      setIsModalOpen(false);
      setIsEditMode(false);
      setSelectedItem(null);
    } catch (err) {
      toast.error("❌ " + (err.response?.data?.message || "Something went wrong!"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (inventoryId: number) => {
    confirmAlert({
      customUI: ({ onClose }) => (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl border border-gray-300 dark:border-gray-700 max-w-sm text-center">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            ⚠️ Confirm Deletion
          </h2>
          <p className="text-gray-700 dark:text-gray-300 mb-4">
            Are you sure you want to delete this inventory item? This action{" "}
            <b>cannot</b> be undone.
          </p>
          <div className="flex justify-center gap-4">
            <button
              onClick={async () => {
                try {
                  await axios.delete(
                    route("admin.inventory.destroy", inventoryId)
                  );
                  toast.success("Inventory item deleted successfully!");
                  
                  // Force reload all inventory after deletion - just like products page
                  await fetchInventoryData();
                } catch (error) {
                  toast.error(
                    error.response?.status === 404
                      ? "❌ Inventory item not found."
                      : "❌ Failed to delete inventory item."
                  );
                }
                onClose();
              }}
              className="px-4 py-2 bg-red-600 text-white rounded-md shadow hover:bg-red-700"
            >
              Yes, Delete
            </button>
            <button
              onClick={() => onClose()}
              className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-900 dark:text-white rounded-md shadow hover:bg-gray-400 dark:hover:bg-gray-500"
            >
              Cancel
            </button>
          </div>
        </div>
      ),
    });
  };

  const openEditModal = (item: Inventory) => {
    setSelectedItem(item);
    setData({
      name: item.inventory_name,
      quantity: item.inventory_qty.toString(),
      price: item.inventory_price.toString(),
      item_image: null,
    });
    setIsEditMode(true);
    setIsModalOpen(true);
  };

  const openAddModal = () => {
    reset();
    setPreviewImage(null);
    setIsEditMode(false);
    setIsModalOpen(true);
  };

  const toggleFilterModal = () => {
    setShowFilterModal(prev => !prev);
    if (showSortModal) setShowSortModal(false);
  };

  const toggleSortModal = () => {
    setShowSortModal(prev => !prev);
    if (showFilterModal) setShowFilterModal(false);
  };

  const filterByStatus = (status: string) => {
    setActiveFilter(status);
    
    // Apply status filter to current inventory list
    let filtered = [...inventoryList];
    
    if (status === "available") {
      // Filter items with quantity > 0
      filtered = filtered.filter(item => item.inventory_qty > 0);
    } else if (status === "highstock") {
      filtered = filtered.filter(item => item.inventory_qty >= 30);
    } else if (status === "instock") {
      filtered = filtered.filter(item => item.inventory_qty >= 10 && item.inventory_qty < 30);
    } else if (status === "lowstock") {
      filtered = filtered.filter(item => item.inventory_qty >= 5 && item.inventory_qty < 10);
    } else if (status === "critical") {
      filtered = filtered.filter(item => item.inventory_qty > 0 && item.inventory_qty < 5);
    } else if (status === "outofstock") {
      filtered = filtered.filter(item => item.inventory_qty === 0);
    }
    
    // Apply current search term if any
    if (searchTerm.trim() !== "") {
      filtered = filtered.filter(item => 
        item.inventory_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Apply sorting to filtered results
    const sorted = sortInventoryCopy(filtered);
    setFilteredInventory(sorted);
    
    setShowFilterModal(false);
  };

  const handleSearchResults = (results: Inventory[]) => {
    // Apply current filter to search results
    let filtered = results;
    
    if (activeFilter === "available") {
      filtered = filtered.filter(item => item.inventory_qty > 0);
    } else if (activeFilter === "highstock") {
      filtered = filtered.filter(item => item.inventory_qty >= 30);
    } else if (activeFilter === "instock") {
      filtered = filtered.filter(item => item.inventory_qty >= 10 && item.inventory_qty < 30);
    } else if (activeFilter === "lowstock") {
      filtered = filtered.filter(item => item.inventory_qty >= 5 && item.inventory_qty < 10);
    } else if (activeFilter === "critical") {
      filtered = filtered.filter(item => item.inventory_qty > 0 && item.inventory_qty < 5);
    } else if (activeFilter === "outofstock") {
      filtered = filtered.filter(item => item.inventory_qty === 0);
    }
    
    // Apply current sorting rules
    const sorted = sortInventoryCopy(filtered);
    setFilteredInventory(sorted);
  };

  const handleSearchTermChange = (term: string) => {
    setSearchTerm(term);
  };

  const fetchInventoryData = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(route("admin.inventory.fetch"), {
        headers: {
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        }
      });
      
      // Check for successful response
      if (!response.data || response.data.status === 'error') {
        throw new Error(response.data?.message || "Invalid response format");
      }

      // Get the fresh data from the server
      const newInventory = response.data.inventory?.data || [];
      const newNewestItems = response.data.newestItems || [];
      
      // Some debug logging to help identify issues
      console.log("Fetched inventory items:", newInventory.length);
      
      // Update both the master list and the newest items
      setInventoryList(newInventory);
      setNewestItemsList(newNewestItems);
      
      // Apply filters and sort based on current criteria
      let filtered = [...newInventory];
      
      if (activeFilter === "available") {
        filtered = filtered.filter(item => item.inventory_qty > 0);
      } else if (activeFilter === "highstock") {
        filtered = filtered.filter(item => item.inventory_qty >= 30);
      } else if (activeFilter === "instock") {
        filtered = filtered.filter(item => item.inventory_qty >= 10 && item.inventory_qty < 30);
      } else if (activeFilter === "lowstock") {
        filtered = filtered.filter(item => item.inventory_qty >= 5 && item.inventory_qty < 10);
      } else if (activeFilter === "critical") {
        filtered = filtered.filter(item => item.inventory_qty > 0 && item.inventory_qty < 5);
      } else if (activeFilter === "outofstock") {
        filtered = filtered.filter(item => item.inventory_qty === 0);
      }
      
      if (searchTerm.trim() !== "") {
        filtered = filtered.filter(item => 
          item.inventory_name.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }
      
      // Apply current sorting to refreshed data
      const sorted = sortInventoryCopy(filtered);
      setFilteredInventory(sorted);
      
      return true;
    } catch (error) {
      console.error("Error fetching inventory:", error);
      
      // Add more detailed error logging
      if (error.response) {
        console.error("Response error data:", error.response.data);
        console.error("Response error status:", error.response.status);
        console.error("Response error headers:", error.response.headers);
      }
      
      toast.error("Failed to fetch inventory data. Please try again.");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const fetchInventory = fetchInventoryData;

  // Close modals when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      // Handle filter modal
      if (filterModalRef.current && 
          !filterModalRef.current.contains(event.target) &&
          filterButtonRef.current && 
          !filterButtonRef.current.contains(event.target)) {
        setShowFilterModal(false);
      }
      
      // Handle sort modal
      if (sortModalRef.current && 
          !sortModalRef.current.contains(event.target) &&
          sortButtonRef.current && 
          !sortButtonRef.current.contains(event.target)) {
        setShowSortModal(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Update filtered inventory when source data or filtering criteria change
  useEffect(() => {
    if (inventoryList.length > 0) {
      let filtered = [...inventoryList];
      
      // Apply filter
      if (activeFilter === "available") {
        filtered = filtered.filter(item => item.inventory_qty > 0);
      } else if (activeFilter === "highstock") {
        filtered = filtered.filter(item => item.inventory_qty >= 30);
      } else if (activeFilter === "instock") {
        filtered = filtered.filter(item => item.inventory_qty >= 10 && item.inventory_qty < 30);
      } else if (activeFilter === "lowstock") {
        filtered = filtered.filter(item => item.inventory_qty >= 5 && item.inventory_qty < 10);
      } else if (activeFilter === "critical") {
        filtered = filtered.filter(item => item.inventory_qty > 0 && item.inventory_qty < 5);
      } else if (activeFilter === "outofstock") {
        filtered = filtered.filter(item => item.inventory_qty === 0);
      }
      
      // Apply search filter
      if (searchTerm.trim() !== "") {
        filtered = filtered.filter(item => 
          item.inventory_name.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }
      
      // Apply current sorting
      const sorted = sortInventoryCopy(filtered);
      setFilteredInventory(sorted);
    }
  }, [activeFilter, searchTerm, inventoryList]);

  useEffect(() => {
    fetchInventoryData();
  }, []);

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Inventory" />
      <Toaster />

      {/* Main Container - Fixed to viewport size */}
      <div className="flex flex-col rounded-xl p-2 h-[calc(100vh-64px)] overflow-hidden">
  
        {/* Header with Search & Filter */}
        <div className="p-1 pl-5 pb-2 pr-2 w-full">
          {/* Search and Filter */}
          <div className="flex items-center gap-1.5 mb-2 bg-transparent rounded-lg justify-between">
            <div className="flex items-center gap-1.5 w-5/9">
              <SearchBar
                placeholder="Search Inventory"
                items={inventoryList}
                searchField="inventory_name"
                onSearchResults={handleSearchResults}
                onSearchTermChange={handleSearchTermChange}
                className="input w-full bg-gray-700 p-1.5 pl-3 text-sm text-white rounded-lg focus:outline-none focus:ring-1 focus:ring-inset focus:ring-white-400"
              />
              
              <div className="relative">
                <Button
                  ref={filterButtonRef}
                  className="bg-gray-500 rounded-lg flex items-center justify-center h-8"
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
                      <button
                        onClick={() => filterByStatus("all")}
                        className={`block w-full text-left px-4 py-2 text-sm ${
                          activeFilter === "all" 
                          ? "bg-gray-600 text-white" 
                          : "text-white hover:bg-gray-600"
                        }`}
                        role="menuitem"
                      >
                        All items
                      </button>
                      <button
                        onClick={() => filterByStatus("available")}
                        className={`block w-full text-left px-4 py-2 text-sm ${
                          activeFilter === "available" 
                          ? "bg-gray-600 text-white" 
                          : "text-white hover:bg-gray-600"
                        }`}
                        role="menuitem"
                      >
                        Available items
                      </button>
                      <button
                        onClick={() => filterByStatus("highstock")}
                        className={`block w-full text-left px-4 py-2 text-sm ${
                          activeFilter === "highstock" 
                          ? "bg-gray-600 text-white" 
                          : "text-white hover:bg-gray-600"
                        }`}
                        role="menuitem"
                      >
                        High stock
                      </button>
                      <button
                        onClick={() => filterByStatus("instock")}
                        className={`block w-full text-left px-4 py-2 text-sm ${
                          activeFilter === "instock" 
                          ? "bg-gray-600 text-white" 
                          : "text-white hover:bg-gray-600"
                        }`}
                        role="menuitem"
                      >
                        In stock
                      </button>
                      <button
                        onClick={() => filterByStatus("lowstock")}
                        className={`block w-full text-left px-4 py-2 text-sm ${
                          activeFilter === "lowstock" 
                          ? "bg-gray-600 text-white" 
                          : "text-white hover:bg-gray-600"
                        }`}
                        role="menuitem"
                      >
                        Low stock
                      </button>
                      <button
                        onClick={() => filterByStatus("critical")}
                        className={`block w-full text-left px-4 py-2 text-sm ${
                          activeFilter === "critical" 
                          ? "bg-gray-600 text-white" 
                          : "text-white hover:bg-gray-600"
                        }`}
                        role="menuitem"
                      >
                        Critical stock
                      </button>
                      <button
                        onClick={() => filterByStatus("outofstock")}
                        className={`block w-full text-left px-4 py-2 text-sm ${
                          activeFilter === "outofstock" 
                          ? "bg-gray-600 text-white" 
                          : "text-white hover:bg-gray-600"
                        }`}
                        role="menuitem"
                      >
                        Out of stock
                      </button>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Sort Button */}
              <div className="relative">
                <Button
                  ref={sortButtonRef}
                  className="bg-gray-500 rounded-lg flex items-center justify-center h-8"
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
                      {/* Sort options */}
                      
                      {/* ID sorting */}
                      <div className="px-4 py-1 text-white font-medium text-sm">By ID</div>
                      <button
                        onClick={() => handleSortOption("inventory_id", "asc")}
                        className={`flex items-center w-full text-left px-4 py-1 text-sm ${
                          sortField === "inventory_id" && sortDirection === "asc" 
                          ? "bg-gray-600 text-white" 
                          : "text-white hover:bg-gray-600"
                        }`}
                        role="menuitem"
                      >
                        <ArrowUp01 size={14} className="mr-2" /> Ascending
                      </button>
                      <button
                        onClick={() => handleSortOption("inventory_id", "desc")}
                        className={`flex items-center w-full text-left px-4 py-1 text-sm ${
                          sortField === "inventory_id" && sortDirection === "desc" 
                          ? "bg-gray-600 text-white" 
                          : "text-white hover:bg-gray-600"
                        }`}
                        role="menuitem"
                      >
                        <ArrowDown10 size={14} className="mr-2" /> Descending
                      </button>
                      
                      {/* Name sorting */}
                      <div className="px-4 py-1 text-white font-medium text-sm mt-2">By Name</div>
                      <button
                        onClick={() => handleSortOption("inventory_name", "asc")}
                        className={`flex items-center w-full text-left px-4 py-1 text-sm ${
                          sortField === "inventory_name" && sortDirection === "asc" 
                          ? "bg-gray-600 text-white" 
                          : "text-white hover:bg-gray-600"
                        }`}
                        role="menuitem"
                      >
                        <ArrowUpAZ size={14} className="mr-2" /> A to Z
                      </button>
                      <button
                        onClick={() => handleSortOption("inventory_name", "desc")}
                        className={`flex items-center w-full text-left px-4 py-1 text-sm ${
                          sortField === "inventory_name" && sortDirection === "desc" 
                          ? "bg-gray-600 text-white" 
                          : "text-white hover:bg-gray-600"
                        }`}
                        role="menuitem"
                      >
                        <ArrowDownZA size={14} className="mr-2" /> Z to A
                      </button>
                      
                      {/* Price sorting */}
                      <div className="px-4 py-1 text-white font-medium text-sm mt-2">By Price</div>
                      <button
                        onClick={() => handleSortOption("price", "asc")}
                        className={`flex items-center w-full text-left px-4 py-1 text-sm ${
                          sortField === "price" && sortDirection === "asc" 
                          ? "bg-gray-600 text-white" 
                          : "text-white hover:bg-gray-600"
                        }`}
                        role="menuitem"
                      >
                        <ArrowUp01 size={14} className="mr-2" /> Lowest first
                      </button>
                      <button
                        onClick={() => handleSortOption("price", "desc")}
                        className={`flex items-center w-full text-left px-4 py-1 text-sm ${
                          sortField === "price" && sortDirection === "desc" 
                          ? "bg-gray-600 text-white" 
                          : "text-white hover:bg-gray-600"
                        }`}
                        role="menuitem"
                      >
                        <ArrowDown10 size={14} className="mr-2" /> Highest first
                      </button>
                      
                      {/* Quantity sorting */}
                      <div className="px-4 py-1 text-white font-medium text-sm mt-2">By Quantity</div>
                      <button
                        onClick={() => handleSortOption("qty", "asc")}
                        className={`flex items-center w-full text-left px-4 py-1 text-sm ${
                          sortField === "qty" && sortDirection === "asc" 
                          ? "bg-gray-600 text-white" 
                          : "text-white hover:bg-gray-600"
                        }`}
                        role="menuitem"
                      >
                        <ArrowUp01 size={14} className="mr-2" /> Lowest first
                      </button>
                      <button
                        onClick={() => handleSortOption("qty", "desc")}
                        className={`flex items-center w-full text-left px-4 py-1 text-sm ${
                          sortField === "qty" && sortDirection === "desc" 
                          ? "bg-gray-600 text-white" 
                          : "text-white hover:bg-gray-600"
                        }`}
                        role="menuitem"
                      >
                        <ArrowDown10 size={14} className="mr-2" /> Highest first
                      </button>
                      
                      {/* Total value sorting */}
                      <div className="px-4 py-1 text-white font-medium text-sm mt-2">By Total Value</div>
                      <button
                        onClick={() => handleSortOption("total", "asc")}
                        className={`flex items-center w-full text-left px-4 py-1 text-sm ${
                          sortField === "total" && sortDirection === "asc" 
                          ? "bg-gray-600 text-white" 
                          : "text-white hover:bg-gray-600"
                        }`}
                        role="menuitem"
                      >
                        <ArrowUp01 size={14} className="mr-2" /> Lowest first
                      </button>
                      <button
                        onClick={() => handleSortOption("total", "desc")}
                        className={`flex items-center w-full text-left px-4 py-1 text-sm ${
                          sortField === "total" && sortDirection === "desc" 
                          ? "bg-gray-600 text-white" 
                          : "text-white hover:bg-gray-600"
                        }`}
                        role="menuitem"
                      >
                        <ArrowDown10 size={14} className="mr-2" /> Highest first
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Add Inventory Button - Right Aligned */}
            <div className="flex justify-end">
              <Button
                onClick={openAddModal}
                className="bg-gray-500 rounded-lg flex items-center justify-center h-8"
                style={{ aspectRatio: '1/1', padding: '0' }}
              >
                <Plus size={18} />
              </Button>
            </div>
          </div>
          
        </div>

        {/* Table container - Keep header fixed while scrolling body */}
        <div 
          className="flex-1 p-0 pl-5 pr-2 relative"
          style={{ 
            height: 'calc(100vh - 150px)',
            minHeight: '500px'
          }}
        >
          {/* Table wrapper with fixed header and scrollable body */}
          <div className="relative overflow-x-auto bg-gray-900 rounded-lg shadow">
            {/* Fixed header table */}
            <div className="sticky top-0 bg-gray-900 shadow-md">
              <table className="min-w-full divide-y divide-gray-700 border-collapse">
                <thead className="bg-gray-700">
                  <tr>
                    <th 
                      className={`px-1 py-2.5 text-center text-xs font-semibold text-white uppercase tracking-wider w-14 bg-gray-700 cursor-pointer hover:bg-gray-600 ${sortField === "inventory_id" ? "bg-gray-600" : ""}`}
                      onClick={() => handleSortOption("inventory_id", sortField === "inventory_id" && sortDirection === "asc" ? "desc" : "asc", groupBy)}
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
                      onClick={() => handleSortOption("inventory_name", sortField === "inventory_name" && sortDirection === "asc" ? "desc" : "asc", groupBy)}
                    >
                      <div className="flex items-center justify-center">
                        Item Name
                        {sortField === "inventory_name" && (
                          sortDirection === "asc" ? <ArrowUp size={12} className="ml-1" /> : <ArrowDown size={12} className="ml-1" />
                        )}
                      </div>
                    </th>
                    <th 
                      className={`px-1 py-2.5 text-center text-xs font-semibold text-white uppercase tracking-wider w-20 bg-gray-700 cursor-pointer hover:bg-gray-600 ${sortField === "price" ? "bg-gray-600" : ""}`}
                      onClick={() => handleSortOption("price", sortField === "price" && sortDirection === "asc" ? "desc" : "asc", groupBy)}
                    >
                      <div className="flex items-center justify-center">
                        Price
                        {sortField === "price" && (
                          sortDirection === "asc" ? <ArrowUp size={12} className="ml-1" /> : <ArrowDown size={12} className="ml-1" />
                        )}
                      </div>
                    </th>
                    <th 
                      className={`px-1 py-2.5 text-center text-xs font-semibold text-white uppercase tracking-wider w-14 bg-gray-700 cursor-pointer hover:bg-gray-600 ${sortField === "qty" ? "bg-gray-600" : ""}`}
                      onClick={() => handleSortOption("qty", sortField === "qty" && sortDirection === "asc" ? "desc" : "asc", groupBy)}
                    >
                      <div className="flex items-center justify-center">
                        Qty
                        {sortField === "qty" && (
                          sortDirection === "asc" ? <ArrowUp size={12} className="ml-1" /> : <ArrowDown size={12} className="ml-1" />
                        )}
                      </div>
                    </th>
                    <th 
                      className={`px-1 py-2.5 text-center text-xs font-semibold text-white uppercase tracking-wider w-24 bg-gray-700 cursor-pointer hover:bg-gray-600 ${sortField === "total" ? "bg-gray-600" : ""}`}
                      onClick={() => handleSortOption("total", sortField === "total" && sortDirection === "asc" ? "desc" : "asc", groupBy)}
                    >
                      <div className="flex items-center justify-center">
                        Total Value
                        {sortField === "total" && (
                          sortDirection === "asc" ? <ArrowUp size={12} className="ml-1" /> : <ArrowDown size={12} className="ml-1" />
                        )}
                      </div>
                    </th>
                    <th className="px-1 py-2.5 text-center text-xs font-semibold text-white uppercase tracking-wider w-28 bg-gray-700">
                      Status
                    </th>
                    <th className="px-1 py-2.5 text-center text-xs font-semibold text-white uppercase tracking-wider w-30 bg-gray-700">
                      Actions
                    </th>
                    <th 
                      className="px-1 py-2.5 text-center text-xs font-semibold text-white uppercase tracking-wider bg-gray-700"
                      style={{ width: '1rem', minWidth: '1rem', maxWidth: '1rem' }}
                    >
                    </th>
                  </tr>
                </thead>
              </table>
            </div>
            
            {/* Scrollable table body */}
            <div 
              ref={tableRef}
              className="overflow-y-auto"
              style={{ maxHeight: 'calc(100vh - 175px)' }}
              key="inventory-table-body"
            >
              <table className="min-w-full divide-y divide-gray-700 border-collapse">
                <tbody className="bg-gray-800 divide-y divide-gray-700">
                  {isLoading && filteredInventory.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-6 py-6 text-center text-gray-400">
                        <div className="flex justify-center items-center">
                          <Loader2 className="h-6 w-6 animate-spin mr-2" />
                          <span className="font-medium">Loading inventory...</span>
                        </div>
                      </td>
                    </tr>
                  ) : filteredInventory.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-6 py-6 text-center text-gray-400">
                        <span className="font-medium">No inventory items found</span>
                      </td>
                    </tr>
                  ) : (
                    // Display inventory items based on grouping
                    groupBy === "status" ? (
                      // Group rendering by status
                      (() => {
                        // Create groups
                        const groups = filteredInventory.reduce((acc, item) => {
                          const groupKey = getStatusText(item.inventory_qty);
                          if (!acc[groupKey]) {
                            acc[groupKey] = [];
                          }
                          acc[groupKey].push(item);
                          return acc;
                        }, {});
                        
                        // Sort groups by priority
                        const statusOrder = ["High Stock", "In Stock", "Low Stock", "Backorder", "Out of Stock"];
                        
                        // Render groups
                        return statusOrder.map(status => {
                          const items = groups[status] || [];
                          if (items.length === 0) return null;
                          
                          return (
                            <React.Fragment key={status}>
                              <tr className="bg-gray-900">
                                <td colSpan={9} className="px-4 py-2 font-medium text-white">
                                  {status} ({items.length})
                                </td>
                              </tr>
                              {items.map(item => (
                                <tr 
                                  key={item.inventory_id} 
                                  className="hover:bg-gray-700/60 transition-colors"
                                >
                                  <td className="px-1 text-center py-1 whitespace-nowrap text-sm font-medium text-gray-300 w-14">
                                    {item.inventory_id}
                                  </td>
                                  <td className="px-1 py-1 text-center whitespace-nowrap w-18">
                                    {item.inventory_image ? (
                                      <div className="flex items-center justify-center">
                                        <img 
                                          src={`/storage/${item.inventory_image}${imageTimestamps[item.inventory_id] ? `?t=${imageTimestamps[item.inventory_id]}` : ''}`}
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
                                  <td className="px-1 py-1 pl-5 text-left whitespace-nowrap text-sm font-medium w-80 text-gray-300">
                                    {item.inventory_name}
                                  </td>
                                  <td className="px-1 py-1 text-center whitespace-nowrap text-sm font-medium text-gray-300 w-20">
                                    ₱ {parseFloat(item.inventory_price.toString()).toFixed(2)}
                                  </td>
                                  <td className="px-1 py-1 text-center whitespace-nowrap text-sm text-gray-300 w-14">
                                    {item.inventory_qty}
                                  </td>
                                  <td className="px-1 py-1 text-center whitespace-nowrap text-sm font-medium text-green-300 w-24">
                                    ₱ {(parseFloat(item.inventory_price.toString()) * item.inventory_qty).toFixed(2)}
                                  </td>
                                  <td className="px-1 py-1 text-center whitespace-nowrap w-28">
                                    <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                                      ${
                                        item.inventory_qty >= 30
                                          ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                                          : item.inventory_qty >= 10
                                          ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                          : item.inventory_qty >= 5
                                          ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                                          : item.inventory_qty === 0
                                          ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                                          : "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
                                      }`}
                                    >
                                      {getStatusText(item.inventory_qty)}
                                    </span>
                                  </td>
                                  <td className="px-1 py-1 text-center whitespace-nowrap w-30">
                                    <ActionButtons 
                                      onEdit={() => openEditModal(item)}
                                      onDelete={() => handleDelete(item.inventory_id)}
                                    />
                                  </td>
                                </tr>
                              ))}
                            </React.Fragment>
                          );
                        });
                      })()
                    ) : (
                      // Regular rows without grouping
                      filteredInventory.map(item => (
                        <tr 
                          key={item.inventory_id} 
                          className="hover:bg-gray-700/60 transition-colors"
                        >
                          <td className="px-1 text-center py-1 whitespace-nowrap text-sm font-medium text-gray-300 w-14">
                            {item.inventory_id}
                          </td>
                          <td className="px-1 py-1 text-center whitespace-nowrap w-18">
                            {item.inventory_image ? (
                              <div className="flex items-center justify-center">
                                <img 
                                  src={`/storage/${item.inventory_image}${imageTimestamps[item.inventory_id] ? `?t=${imageTimestamps[item.inventory_id]}` : ''}`}
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
                          <td className="px-1 py-1 pl-5 text-left whitespace-nowrap text-sm font-medium w-80 text-gray-300">
                            {item.inventory_name}
                          </td>
                          <td className="px-1 py-1 text-center whitespace-nowrap text-sm font-medium text-gray-300 w-20">
                            ₱ {parseFloat(item.inventory_price.toString()).toFixed(2)}
                          </td>
                          <td className="px-1 py-1 text-center whitespace-nowrap text-sm text-gray-300 w-14">
                            {item.inventory_qty}
                          </td>
                          <td className="px-1 py-1 text-center whitespace-nowrap text-sm font-medium text-green-300 w-24">
                            ₱ {(parseFloat(item.inventory_price.toString()) * item.inventory_qty).toFixed(2)}
                          </td>
                          <td className="px-1 py-1 text-center whitespace-nowrap w-28">
                            <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                              ${
                                item.inventory_qty >= 30
                                  ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                                  : item.inventory_qty >= 10
                                  ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                  : item.inventory_qty >= 5
                                  ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                                  : item.inventory_qty === 0
                                  ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                                  : "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
                              }`}
                            >
                              {getStatusText(item.inventory_qty)}
                            </span>
                          </td>
                          <td className="px-1 py-1 text-center whitespace-nowrap w-30">
                            <ActionButtons 
                              onEdit={() => openEditModal(item)}
                              onDelete={() => handleDelete(item.inventory_id)}
                            />
                          </td>
                        </tr>
                      ))
                    )
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
      
      {/* Modal Implementation */}
      {isModalOpen && (
        <div className="fixed inset-0 flex items-start justify-center z-50 p-4">
          {/* Semi-transparent overlay */}
          <div 
            className="absolute inset-0 bg-black/40" 
            onClick={() => setIsModalOpen(false)}
          ></div>
          
          {/* Modal Content */}
          <div 
            className="relative bg-gray-800 px-4 py-3 rounded-xl shadow-2xl max-w-md w-full mt-10 max-h-[90vh] overflow-y-auto z-50 border border-gray-600"
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              onClick={() => setIsModalOpen(false)}
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-300 transition-colors z-55"
            >
              <CircleX size={20} />
            </button>
            <div className="relative mb-4">
              <h2 className="text-xl font-bold text-white text-center">
                {isEditMode ? 'Edit Inventory Item' : 'Add New Inventory Item'}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name" className="text-gray-200">Item Name</Label>
                <Input
                  id="name"
                  type="text"
                  value={data.name}
                  onChange={(e) => setData("name", e.target.value)}
                  required
                  className="mt-1 w-full bg-gray-700 border-gray-600 text-white"
                />
              </div>

              <div>
                <Label htmlFor="quantity" className="text-gray-200">Quantity</Label>
                <Input
                  id="quantity"
                  type="number"
                  value={data.quantity}
                  onChange={(e) => {
                    // Parse input value to remove leading zeros but maintain as string in form state
                    const value = e.target.value;
                    const parsedValue = value === '' ? '' : parseInt(value, 10).toString();
                    setData("quantity", parsedValue);
                  }}
                  required
                  min="1"
                  className="mt-1 w-full bg-gray-700 border-gray-600 text-white"
                />
              </div>

              <div>
                <Label htmlFor="price" className="text-gray-200">Price (₱)</Label>
                <Input
                  id="price"
                  type="number"
                  value={data.price}
                  onChange={(e) => setData("price", e.target.value)}
                  required
                  min="0"
                  step="0.01"
                  className="mt-1 w-full bg-gray-700 border-gray-600 text-white"
                />
              </div>

              <div>
                <Label htmlFor="item_image" className="text-gray-200">Item Image</Label>
                <Input
                  id="item_image"
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="mt-1 w-full bg-gray-700 border-gray-600 text-white"
                />
                {previewImage && (
                  <div className="mt-2">
                    <img 
                      src={previewImage} 
                      alt="Preview" 
                      className="h-32 object-contain rounded-md" 
                    />
                  </div>
                )}
                {isEditMode && selectedItem?.inventory_image && !previewImage && (
                  <div className="mt-2">
                    <p className="text-sm text-gray-400 mb-1">Current image:</p>
                    <img 
                      src={`/storage/${selectedItem.inventory_image}`} 
                      alt="Current" 
                      className="h-32 object-contain rounded-md" 
                    />
                  </div>
                )}
              </div>

              <div className="flex gap-2 justify-end pt-4 border-t border-gray-700">
                <Button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="bg-gray-700 text-white hover:bg-gray-600 border-gray-600"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  className="bg-blue-600 text-white hover:bg-blue-700"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {isEditMode ? 'Updating...' : 'Saving...'}
                    </>
                  ) : (
                    isEditMode ? 'Update Item' : 'Add Item'
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
