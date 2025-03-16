import { useState } from "react";
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
import { Star } from "lucide-react";
import { motion } from "framer-motion";

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: "Inventory",
        href: "/admin/inventory",
    },
];

interface Inventory {
    id: number;
    name: string;
    quantity: number;
    item_image: string | null;
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
    const { data, setData, reset, post, processing, errors } = useForm({
        name: "",
        quantity: "",
        item_image: null as File | null,
    });

    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [inventoryList, setInventoryList] = useState(inventory.data);

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setData("item_image", file);
        setPreviewImage(URL.createObjectURL(file));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const response = await axios.post(route("admin.inventory.store"), data, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            });

            toast.success("Inventory item added successfully!", {
                position: "top-center",
                style: {
                    fontSize: "16px",
                    fontWeight: "bold",
                    background: "#4CAF50",
                    color: "#fff",
                    padding: "12px",
                    borderRadius: "8px",
                },
            });

            setInventoryList((prevInventory) => [response.data.inventory, ...prevInventory]);
            reset();
            setPreviewImage(null);
        } catch (err) {
            toast.error("❌ " + (err.response?.data?.message || "Something went wrong!"), {
                position: "top-center",
                style: {
                    fontSize: "16px",
                    fontWeight: "bold",
                    background: "#D32F2F",
                    color: "#fff",
                    padding: "12px",
                    borderRadius: "8px",
                },
            });
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
                        Are you sure you want to delete this inventory item? This action <b>cannot</b> be undone.
                    </p>
                    <div className="flex justify-center gap-4">
                        <button
                            onClick={async () => {
                                try {
                                    await axios.delete(route("admin.inventory.destroy", inventoryId));

                                    toast.success("Inventory item deleted successfully!", {
                                        position: "top-right",
                                        style: {
                                            fontSize: "16px",
                                            fontWeight: "bold",
                                            background: "#4CAF50",
                                            color: "#fff",
                                            padding: "12px",
                                            borderRadius: "8px",
                                        },
                                    });

                                    setInventoryList((prevInventory) =>
                                        prevInventory.filter((item) => item.id !== inventoryId)
                                    );
                                } catch (error) {
                                    const errorMsg =
                                        error.response?.status === 404
                                            ? "❌ Inventory item not found."
                                            : "❌ Failed to delete inventory item.";

                                    toast.error(errorMsg, {
                                        position: "top-right",
                                        style: {
                                            fontSize: "16px",
                                            fontWeight: "bold",
                                            background: "#D32F2F",
                                            color: "#fff",
                                            padding: "12px",
                                            borderRadius: "8px",
                                        },
                                    });
                                }
                                onClose(); // Close modal
                            }}
                            className="px-4 py-2 bg-red-600 text-white rounded-md shadow hover:bg-red-700"
                        >
                            Yes, Delete
                        </button>

                        <button
                            onClick={() => {
                                toast("🛑 Deletion canceled.", {
                                    position: "top-right",
                                    style: {
                                        fontSize: "16px",
                                        fontWeight: "bold",
                                        background: "#FFC107",
                                        color: "#000",
                                        padding: "12px",
                                        borderRadius: "8px",
                                    },
                                });
                                onClose();
                            }}
                            className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-900 dark:text-white rounded-md shadow hover:bg-gray-400 dark:hover:bg-gray-500"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            ),
        });
    };

    // Filter inventory items based on search query
    const filteredInventory = inventoryList.filter((item) =>
        Object.values(item)
            .join(" ")
            .toLowerCase()
            .includes(searchQuery.toLowerCase())
    );

    const scrollToForm = () => {
        document.getElementById("add-inventory-form")?.scrollIntoView({ behavior: "smooth" });
    };

    const handlePageChange = async (page: number) => {
        try {
            const response = await axios.get(route("admin.inventory.index", { page }));
            setInventoryList(response.data.inventory.data);
        } catch (err) {
            toast.error("❌ " + (err.response?.data?.message || "Something went wrong!"), {
                position: "top-center",
                style: {
                    fontSize: "16px",
                    fontWeight: "bold",
                    background: "#D32F2F",
                    color: "#fff",
                    padding: "12px",
                    borderRadius: "8px",
                },
            });
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Inventory" />
            <Toaster />

            <div className="flex flex-col gap-4 rounded-xl p-4">
                {/* Add Item Button */}
                <div className="flex justify-start mb-4">
                    <Button onClick={scrollToForm} className="bg-blue-600 text-white px-4 py-2 rounded-md">
                        Add Item
                    </Button>
                </div>

                {/* Inventory List */}
                <div className="w-full max-w-5xl bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 overflow-x-auto ">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Inventory List</h2>

                    {/* Search Bar */}
                    <div className="mb-4">
                        <Input
                            type="text"
                            placeholder="Search inventory..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div className="w-full overflow-x-auto ">
                        <table className="min-w-[1020px] border-collapse border border-gray-300 dark:border-gray-700">
                            <thead>
                                <tr className="bg-gray-200 dark:bg-gray-700">
                                    <th className="border px-4 py-2 min-w-[60px]">ID</th>
                                    <th className="border px-4 py-2 min-w-[150px]">Name</th>
                                    <th className="border px-4 py-2 min-w-[100px]">Image</th>
                                    <th className="border px-4 py-2 min-w-[100px]">Stock Status</th>
                                    <th className="border px-4 py-2 min-w-[60px]">Stock</th>
                                    <th className="border px-4 py-2 min-w-[150px]">Created At</th>
                                    <th className="border px-4 py-2 min-w-[100px]">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredInventory.length > 0 ? (
                                    filteredInventory.map((item) => (
                                        <tr key={item.id} className="text-center">
                                            <td className="border px-4 py-2">{item.id}</td>
                                            <td className="border px-4 py-2">{item.name}</td>
                                            <td className="border px-4 py-2">
                                                {item.item_image && (
                                                    <img src={`/storage/${item.item_image}`} alt="Item" className="w-12 h-8 object-cover mx-auto rounded" />
                                                )}
                                            </td>
                                            <td className="border px-4 py-2">
                                                <span className={`px-2 py-1 rounded-md ${
                                                    item.quantity >= 50 ? "bg-purple-500" :
                                                    item.quantity >= 10 ? "bg-green-500" :
                                                    item.quantity >= 3 ? "bg-yellow-500" :
                                                    item.quantity === 0 ? "bg-red-500" :
                                                    "bg-blue-500"
                                                } text-white`}>
                                                    {item.quantity >= 50 ? "High Stock" :
                                                    item.quantity >= 10 ? "In Stock" :
                                                    item.quantity >= 3 ? "Low Stock" :
                                                    item.quantity === 0 ? "Out of Stock" : "Backorder"}
                                                </span>
                                            </td>
                                            <td className="border px-4 py-2">{item.quantity}</td>
                                            <td className="border px-4 py-2">{new Date(item.created_at).toLocaleString()}</td>
                                            <td className="border px-4 py-2 flex justify-center gap-2"> {/* Actions Column */}
                                                <Button
                                                    className="bg-red-500 text-white px-3 py-1 rounded-md"
                                                    onClick={() => handleDelete(item.id)}
                                                >
                                                    Delete
                                                </Button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="7" className="border px-4 py-2 text-center text-gray-500">
                                            No results found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    {/* Pagination Controls */}
                    <div className="flex justify-between mt-4">
                        <Button
                            onClick={() => handlePageChange(inventory.current_page - 1)}
                            disabled={inventory.current_page === 1}
                            className="bg-blue-600 text-white px-4 py-2 rounded-md"
                        >
                            Previous
                        </Button>
                        <Button
                            onClick={() => handlePageChange(inventory.current_page + 1)}
                            disabled={inventory.current_page === inventory.last_page}
                            className="bg-blue-600 text-white px-4 py-2 rounded-md"
                        >
                            Next
                        </Button>
                    </div>
                </div>

                 {/* Inventory Form and Newest Items */}
                <div className="flex flex-row gap-4">
                    <div id="add-inventory-form" className="w-full max-w-[505px] bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6 ">
                        <h2 className="text-xl font-semibold text-center text-gray-900 dark:text-white mb-4">
                            Add Inventory Item
                        </h2>

                        <form onSubmit={handleSubmit} className="space-y-4" encType="multipart/form-data">
                            <div>
                                <Label htmlFor="name">Item Name</Label>
                                <Input
                                    id="name"
                                    type="text"
                                    value={data.name}
                                    onChange={(e) => setData("name", e.target.value)}
                                    required
                                    className="mt-1 w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div>
                                <Label htmlFor="quantity">Quantity</Label>
                                <Input
                                    id="quantity"
                                    type="number"
                                    value={data.quantity}
                                    onChange={(e) => setData("quantity", e.target.value)}
                                    required
                                    min="1"
                                    className="mt-1 w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div>
                                <Label htmlFor="item_image">Item Image</Label>
                                <Input
                                    id="item_image"
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageUpload}
                                    className="mt-1 w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                                {previewImage && (
                                    <img src={previewImage} alt="Preview" className="mt-2 w-16 max-h-40 object-cover rounded-md border" />
                                )}
                            </div>

                            <Button type="submit" disabled={processing} className="w-full px-4 py-2 mt-4 bg-blue-600 text-white rounded-md">
                                {processing ? "Saving..." : "Save Item"}
                            </Button>
                        </form>
                    </div>

                    <div className="w-full max-w-[505px] bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6 ">
                        <h2 className="text-xl font-semibold text-center text-gray-900 dark:text-white mb-4">
                            Newest Items
                        </h2>

                    
     {/* Inline CSS for heartbeat animation */}
     <style>
        {`
          @keyframes heartbeat {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.3); }
          }
          .animate-heartbeat {
            animation: heartbeat 2s ease-in-out infinite;
          }
        `}
      </style>

                    <div className="grid grid-cols-2 gap-4">
        {newestItems.length > 0 ? (
            newestItems.map((item, index) => (
                <div key={index} className="relative flex flex-col items-center p-2 bg-gray-100 dark:bg-gray-700 rounded-md">
                    {/* Star Icon in Upper Right */}
                    <div className="absolute top-1 right-1 animate-[heartbeat_2.5s_ease-in-out_infinite]">
  <Star className="text-yellow-500" size={18} />
</div>
           
                    {item.item_image && (
                        <img src={`/storage/${item.item_image}`} 
                            alt={item.name} 
                            className="w-10 h-10 object-cover rounded-md mb-2" 
                        />
                    )}
                    <span className="text-gray-900 dark:text-white text-sm text-center">{item.name}</span>
                </div>
            ))
        ) : (
            <span className="text-gray-900 dark:text-white text-center col-span-2">No new items</span>
        )}
    </div>
</div>
                </div>

            </div>
        </AppLayout>
    );
    
}
