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
import { router } from "@inertiajs/react";
import { 
  CircleX, Loader2, Plus, ArrowUp, ArrowDown, 
  ArrowUp01, ArrowDown10, ArrowUpAZ, ArrowDownZA,
  Search, Edit, Trash2
} from "lucide-react";
import SearchBar from "@/components/ui/search-bar";
import FilterButton from "@/components/ui/filter-button";
import SortButton from "@/components/ui/sort-button";

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

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Inventory | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [inventoryList, setInventoryList] = useState<Inventory[]>([]);
  const [filteredInventory, setFilteredInventory] = useState<Inventory[]>([]);
  const [newestItemsList, setNewestItemsList] = useState(newestItems);
  const [isLoading, setIsLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [imageTimestamps, setImageTimestamps] = useState<Record<number, number>>({});

  const [sortField, setSortField] = useState<string>("inventory_id");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  const tableRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (flash?.success) {
      toast.success(flash.success);
    }
    if (flash?.error) {
      toast.error(flash.error);
    }
  }, [flash]);

  useEffect(() => {
    if (inventory?.data) {
      const sortedInventory = [...inventory.data].sort((a, b) => a.inventory_id - b.inventory_id);
      setInventoryList(sortedInventory);
      setFilteredInventory(sortedInventory);
    }
  }, [inventory]);

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const response = await axios.get(route("admin.inventory.fetch"));
        setNewestItemsList(response.data.newestItems);
      } catch (err) {
        console.error("Failed to update newest items:", err);
      }
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (filteredInventory.length > 0) {
      const sorted = sortInventoryCopy(filteredInventory);
      setFilteredInventory(sorted);
    }
  }, [sortField, sortDirection]);

  const sortInventoryCopy = (inventoryToSort: Inventory[]) => {
    let sorted = [...inventoryToSort];

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

  const stableSort = (array: Inventory[], compareFn: (a: Inventory, b: Inventory) => number) => {
    return array.map((item, index) => ({ item, index }))
      .sort((a, b) => {
        const order = compareFn(a.item, b.item);
        return order !== 0 ? order : a.index - b.index;
      })
      .map(({ item }) => item);
  };

  const getStatusText = (qty: number): string => {
    if (qty >= 30) return "High Stock";
    if (qty >= 10) return "In Stock";
    if (qty >= 5) return "Low Stock";
    if (qty === 0) return "Out of Stock";
    return "Backorder";
  };

  const handleSortOption = (field: string, direction: "asc" | "desc") => {
    setSortField(field);
    setSortDirection(direction);
    setFilteredInventory(sortInventoryCopy(filteredInventory));
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

        if (data.item_image) {
          setImageTimestamps(prev => ({
            ...prev,
            [itemId]: Date.now()
          }));
        }

        await fetchInventoryData();
      } else {
        const response = await axios.post(route("admin.inventory.store"), formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
        toast.success("Inventory item added successfully!");

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

  const filterByStatus = (status: string) => {
    setActiveFilter(status);

    let filtered = [...inventoryList];

    if (status === "available") {
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

    if (searchTerm.trim() !== "") {
      filtered = filtered.filter(item => 
        item.inventory_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    const sorted = sortInventoryCopy(filtered);
    setFilteredInventory(sorted);
  };

  const handleSearchResults = (results: any[]) => {
    let filtered = results as Inventory[];
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

      if (!response.data || response.data.status === 'error') {
        throw new Error(response.data?.message || "Invalid response format");
      }

      const newInventory = response.data.inventory?.data || [];
      const newNewestItems = response.data.newestItems || [];

      setInventoryList(newInventory);
      setNewestItemsList(newNewestItems);

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

      const sorted = sortInventoryCopy(filtered);
      setFilteredInventory(sorted);

      return true;
    } catch (error) {
      console.error("Error fetching inventory:", error);
      toast.error("Failed to fetch inventory data. Please try again.");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const filterOptions = [
    { id: "available", name: "Available" },
    { id: "highstock", name: "High Stock" },
    { id: "instock", name: "In Stock" },
    { id: "lowstock", name: "Low Stock" },
    { id: "critical", name: "Critical Stock" },
    { id: "outofstock", name: "Out of Stock" },
  ];

  const handleFilterChange = (filterId: string | number) => {
    filterByStatus(filterId as string);
  };

  const handleSortChange = (option: SortOption) => {
    handleSortOption(option.field, option.direction);
  };

  useEffect(() => {
    if (inventoryList.length > 0) {
      let filtered = [...inventoryList];

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

      <div className="flex flex-col rounded-xl p-2 h-[calc(100vh-64px)] overflow-hidden">
        <div className="p-1 pl-5 pb-2 pr-2 w-full">
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
                  { field: "price", label: "Price", type: "numeric" },
                  { field: "qty", label: "Quantity", type: "numeric" },
                  { field: "total", label: "Total Value", type: "numeric" }
                ]}
                currentField={sortField}
                currentDirection={sortDirection}
                onSort={handleSortOption}
              />
            </div>
            
            <div className="flex justify-end gap-2">
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

        <div 
          className="flex-1 p-0 pl-5 pr-2 relative"
          style={{ 
            height: 'calc(100vh - 150px)',
            minHeight: '500px'
          }}
        >
          <div className="relative overflow-x-auto bg-gray-900 rounded-lg shadow">
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
                      className={`px-1 py-2.5 text-center text-xs font-semibold text-white uppercase tracking-wider w-20 bg-gray-700 cursor-pointer hover:bg-gray-600 ${sortField === "price" ? "bg-gray-600" : ""}`}
                      onClick={() => handleSortOption("price", sortField === "price" && sortDirection === "asc" ? "desc" : "asc")}
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
                      onClick={() => handleSortOption("qty", sortField === "qty" && sortDirection === "asc" ? "desc" : "asc")}
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
                      onClick={() => handleSortOption("total", sortField === "total" && sortDirection === "asc" ? "desc" : "asc")}
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
            
            <div 
              ref={tableRef}
              className="overflow-y-auto"
              style={{ maxHeight: 'calc(100vh - 175px)' }}
            >
              <table className="min-w-full divide-y divide-gray-700 border-collapse">
                <tbody className="bg-gray-800 divide-y divide-gray-700">
                  {isLoading ? (
                    <tr>
                      <td colSpan={9} className="px-6 py-6 text-center text-gray-400">
                        <div className="flex justify-center items-center">
                          <Loader2 className="h-6 w-6 animate-spin mr-2" />
                          <span className="font-medium">Loading inventory data...</span>
                        </div>
                      </td>
                    </tr>
                  ) : filteredInventory.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-6 py-6 text-center text-gray-400">
                        <span className="font-medium">No inventory data found</span>
                      </td>
                    </tr>
                  ) : (
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
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
      
      {isModalOpen && (
        <div className="fixed inset-0 flex items-start justify-center z-50 p-4">
          <div 
            className="absolute inset-0 bg-black/40" 
            onClick={() => setIsModalOpen(false)}
          ></div>
          
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
                      src={`/storage/inventory/${selectedItem.inventory_image}`} 
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
