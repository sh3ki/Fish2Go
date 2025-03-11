import { useState } from "react";
import { useForm, usePage } from "@inertiajs/react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import AppLayout from "@/layouts/app-layout";
import { Head } from "@inertiajs/react";
import { type BreadcrumbItem } from "@/types";
import toast, { Toaster } from "react-hot-toast";

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
    };
    flash?: {
        success?: string;
        error?: string;
    };
}

export default function AdminInventory({ inventory }: PageProps) {
    const { flash } = usePage<PageProps>().props;
    const { data, setData, reset, post, processing, errors } = useForm({
        name: "",
        quantity: "",
        item_image: null as File | null,
    });

    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setData("item_image", file);
        setPreviewImage(URL.createObjectURL(file));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route("admin.inventory.store"), {
            preserveScroll: true,
            onSuccess: () => {
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
                reset();
                setPreviewImage(null);
            },
            onError: (err) => {
                toast.error("❌ " + (err.error || "Something went wrong!"), {
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
            },
        });
    };

    // Filter inventory items based on search query
    const filteredInventory = inventory.data.filter((item) =>
        Object.values(item)
            .join(" ")
            .toLowerCase()
            .includes(searchQuery.toLowerCase())
    );

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Inventory" />
            <Toaster />

            <div className="flex flex-col items-left min-h-screen p-6 bg-gray-100 dark:bg-gray-900">
                {/* Inventory Form */}
                <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
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

                {/* Inventory List */}
                <div className="w-full max-w-4xl bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 overflow-x-auto">
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

                    <div className="w-full overflow-x-auto">
                        <table className="min-w-[900px] border-collapse border border-gray-300 dark:border-gray-700">
                            <thead>
                                <tr className="bg-gray-200 dark:bg-gray-700">
                                    <th className="border px-4 py-2 min-w-[60px]">ID</th>
                                    <th className="border px-4 py-2 min-w-[150px]">Name</th>
                                    <th className="border px-4 py-2 min-w-[100px]">Image</th>
                                    <th className="border px-4 py-2 min-w-[100px]">Stock Status</th>
                                    <th className="border px-4 py-2 min-w-[60px]">Stock</th>
                                    <th className="border px-4 py-2 min-w-[150px]">Created At</th>
                                  
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
                                         
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="6" className="border px-4 py-2 text-center text-gray-500">
                                            No results found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
