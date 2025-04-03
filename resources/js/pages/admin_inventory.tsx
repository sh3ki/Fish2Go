import { useState, useEffect, useRef } from "react";
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
import { BadgeCheck, Edit, Trash2, CircleX, Plus, Loader2, Search } from "lucide-react";

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
    current_page: number;
    last_page: number;
  };
  flash?: {
    success?: string;
    error?: string;
  };
  newestItems: Inventory[];
}

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

  const [currentPage, setCurrentPage] = useState(inventory.current_page);
  const [lastPage, setLastPage] = useState(inventory.last_page);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [inventoryList, setInventoryList] = useState(inventory.data);
  const [newestItemsList, setNewestItemsList] = useState(newestItems);
  const [isLoading, setIsLoading] = useState(false);

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
    const interval = setInterval(async () => {
      const response = await axios.get(route("admin.inventory.index"));
      setNewestItemsList(response.data.newestItems);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

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
        handlePageChange(currentPage);
      } else {
        const response = await axios.post(route("admin.inventory.store"), formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
        toast.success("Inventory item added successfully!");
        setInventoryList((prev) => [response.data.inventory, ...prev]);
        setNewestItemsList((prev) => [response.data.inventory, ...prev]);
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
                  setInventoryList((prev) =>
                    prev.filter((item) => item.inventory_id !== inventoryId)
                  );
                  setNewestItemsList((prev) =>
                    prev.filter((item) => item.inventory_id !== inventoryId)
                  );
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

  const handlePageChange = async (page: number) => {
    if (page < 1 || page > lastPage) return;
    setIsLoading(true);
    try {
      const response = await axios.get(route("admin.inventory.index", { page }));
      setInventoryList(response.data.inventory.data);
      setCurrentPage(response.data.inventory.current_page);
      setLastPage(response.data.inventory.last_page);
    } catch (err) {
      toast.error("❌ Failed to fetch inventory data");
    } finally {
      setIsLoading(false);
    }
  };

  const filteredInventory = inventoryList.filter((item) =>
    Object.values(item)
      .join(" ")
      .toLowerCase()
      .includes(searchQuery.toLowerCase())
  );

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Inventory" />
      <Toaster />

      <div className="flex flex-col gap-4 rounded-xl p-4">
        <div className="p-4 pb-2 w-full shadow flex items-center justify-between">
          <div className="flex items-center gap-1.5 bg-transparent rounded-lg w-1/2">
            <input
              type="text"
              placeholder="Search Inventory"
              className="input w-full bg-gray-700 dark:bg-gray-700 dark:text-white bg-gray-200 text-gray-900 p-1.5 pl-3 text-sm rounded-lg focus:outline-none focus:ring-1 focus:ring-inset focus:ring-gray-400 dark:focus:ring-white-400"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <div className="relative">
              <Button
                className="bg-gray-500 rounded-lg flex items-center justify-center h-8"
                style={{ aspectRatio: "1/1", padding: "0" }}
              >
                <Search size={18} />
              </Button>
            </div>
          </div>
          <Button
            onClick={openAddModal}
            className="bg-gray-500 rounded-lg flex items-center justify-center h-8"
            style={{ aspectRatio: "1/1", padding: "0" }}
          >
            <Plus size={18} />
          </Button>
        </div>

        <div ref={tableRef} className="flex-1 overflow-y-auto p-5 pt-0 pb-16">
          <div className="overflow-x-auto">
            <div className="bg-gray-900 dark:bg-gray-900 bg-white rounded-lg shadow overflow-hidden min-w-[900px]">
              <table className="min-w-full divide-y divide-gray-700 dark:divide-gray-700 divide-gray-300">
                <thead className="bg-gray-700 dark:bg-gray-700 bg-gray-100">
                  <tr>
                    <th className="px-1 py-2.5 text-center text-xs font-semibold text-white dark:text-white text-gray-900 uppercase tracking-wider w-14">
                      ID
                    </th>
                    <th className="px-1 py-2.5 text-center text-xs font-semibold text-white dark:text-white text-gray-900 uppercase tracking-wider w-28">
                      Image
                    </th>
                    <th className="px-1 py-2.5 text-center text-xs font-semibold text-white dark:text-white text-gray-900 uppercase tracking-wider w-28">
                      Name
                    </th>
                    <th className="px-1 py-2.5 text-center text-xs font-semibold text-white dark:text-white text-gray-900 uppercase tracking-wider w-30">
                      Price
                    </th>
                    <th className="px-1 py-2.5 text-center text-xs font-semibold text-white dark:text-white text-gray-900 uppercase tracking-wider w-20">
                      Qty
                    </th>
                    <th className="px-1 py-2.5 text-center text-xs font-semibold text-white dark:text-white text-gray-900 uppercase tracking-wider w-30">
                      Status
                    </th>
                    <th className="px-1 py-2.5 text-center text-xs font-semibold text-white dark:text-white text-gray-900 uppercase tracking-wider w-36">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-gray-800 dark:bg-gray-800 bg-white divide-y divide-gray-700 dark:divide-gray-700 divide-gray-300">
                  {isLoading && inventoryList.length === 0 ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-6 py-6 text-center text-gray-400"
                      >
                        <div className="flex justify-center items-center"> 
                          <Loader2 className="h-6 w-6 animate-spin mr-2" />
                          <span className="font-medium">
                            Loading inventory...
                          </span>
                        </div>
                      </td>
                    </tr>
                  ) : filteredInventory.length === 0 ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-6 py-6 text-center text-gray-400"
                      >
                        <span className="font-medium">
                          No inventory items found
                        </span>
                      </td>
                    </tr>
                  ) : (
                    filteredInventory.map((item) => (
                      <tr
                        key={item.inventory_id}
                        className="hover:bg-gray-700/60 dark:hover:bg-gray-700/60 hover:bg-gray-100 transition-colors"
                      >
                        <td className="px-1 text-center py-1 whitespace-nowrap text-sm font-medium text-gray-300 dark:text-gray-300 text-gray-900">
                          {item.inventory_id}
                        </td>
                        <td className="px-1 py-1 text-center whitespace-nowrap">
                          {item.inventory_image ? (
                            <img
                              src={`/storage/${item.inventory_image}`}
                              alt="Item"
                              className="w-10 h-10 object-cover rounded mx-auto"
                              onError={(e) => {
                                (e.target as HTMLImageElement).onerror = null;
                                (e.target as HTMLImageElement).src =
                                  "/placeholder.png";
                              }}
                            />
                          ) : (
                            <div className="w-10 h-10 bg-gray-700 dark:bg-gray-700 bg-gray-300 rounded mx-auto"></div>
                          )}
                        </td>
                        <td className="px-1 text-center py-1 whitespace-nowrap text-sm font-medium text-gray-300 dark:text-gray-300 text-gray-900">
                          {item.inventory_name}
                        </td>
                        <td className="px-1 text-center py-1 whitespace-nowrap text-sm font-medium text-gray-300 dark:text-gray-300 text-gray-900">
                          {`₱${parseFloat(
                            item.inventory_price.toString()
                          ).toFixed(2)}`}
                        </td>
                        <td className="px-1 text-center py-1 whitespace-nowrap text-sm font-medium text-gray-300 dark:text-gray-300 text-gray-900">
                          {item.inventory_qty}
                        </td>
                        <td className="px-1 py-1 text-center whitespace-nowrap">
                          <span
                            className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                              ${
                                item.inventory_qty >= 50
                                  ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                                  : item.inventory_qty >= 10
                                  ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                  : item.inventory_qty >= 3
                                  ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                                  : item.inventory_qty === 0
                                  ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                                  : "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                              }`}
                          >
                            {item.inventory_qty >= 50
                              ? "High Stock"
                              : item.inventory_qty >= 10
                              ? "In Stock"
                              : item.inventory_qty >= 3
                              ? "Low Stock"
                              : item.inventory_qty === 0
                              ? "Out of Stock"
                              : "Backorder"}
                          </span>
                        </td>
                        <td className=" px-4 py-2 flex justify-center gap-2">
                          <button
                            onClick={() => openEditModal(item)}
                            className="inline-flex items-center justify-center p-2 rounded-full bg-blue-500/20 dark:bg-blue-500/20 hover:bg-blue-500/30 dark:hover:bg-blue-500/30 text-blue-400 dark:text-blue-400 transition-colors"
                          >
                            <Edit size={15} />
                          </button>
                          <button
                            onClick={() => handleDelete(item.inventory_id)}
                            className="inline-flex items-center justify-center p-2 rounded-full bg-red-500/20 dark:bg-red-500/20 hover:bg-red-500/30 dark:hover:bg-red-500/30 text-red-400 dark:text-red-400 transition-colors"
                          >
                            <Trash2 size={15} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
          <div className="flex justify-between items-center mt-4">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-4 py-2 bg-gray-700 text-white rounded disabled:opacity-50"
            >
              Previous
            </button>
            <span className="text-gray-300">
              Page {currentPage} of {lastPage}
            </span>
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === lastPage}
              className="px-4 py-2 bg-gray-700 text-white rounded disabled:opacity-50"
            >
              Next
            </button>
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
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-300 transition-colors"
            >
              <CircleX size={20} />
            </button>
            <div className="relative mb-4">
              <h2 className="text-xl font-bold text-white text-center">
                {isEditMode ? "Edit Inventory Item" : "Add Inventory Item"}
              </h2>
            </div>
            <form
              onSubmit={handleSubmit}
              className="space-y-4"
              encType="multipart/form-data"
            >
              <div>
                <Label htmlFor="name" className="text-gray-200">
                  Item Name
                </Label>
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
                <Label htmlFor="quantity" className="text-gray-200">
                  Quantity
                </Label>
                <Input
                  id="quantity"
                  type="number"
                  value={data.quantity}
                  onChange={(e) => setData("quantity", e.target.value)}
                  required
                  min="1"
                  className="mt-1 w-full bg-gray-700 border-gray-600 text-white"
                />
              </div>
              <div>
                <Label htmlFor="price" className="text-gray-200">
                  Price
                </Label>
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
                <Label htmlFor="item_image" className="text-gray-200">
                  Item Image
                </Label>
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
                      className="w-16 max-h-40 object-cover rounded-md border"
                    />
                  </div>
                )}
              </div>
              <div className="flex gap-2 justify-end pt-4 border-t border-gray-700">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsModalOpen(false)}
                  className="bg-gray-700 text-white hover:bg-gray-600 border-gray-600"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-blue-600 text-white hover:bg-blue-700"
                  disabled={processing}
                >
                  {processing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {isEditMode ? "Updating..." : "Saving..."}
                    </>
                  ) : isEditMode ? (
                    "Update Item"
                  ) : (
                    "Add Item"
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
