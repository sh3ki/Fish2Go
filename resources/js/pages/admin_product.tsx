import { useState } from "react";
import { useForm, usePage } from "@inertiajs/react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import AppLayout from "@/layouts/app-layout";
import { Head } from "@inertiajs/react";
import { type BreadcrumbItem } from '@/types';
import toast, { Toaster } from "react-hot-toast"; // Import toast

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Product',
        href: '/admin/product',
    },
];

// Define TypeScript interfaces
interface Product {
    id: number;
    product_name: string;
    product_category: string;
    product_price: number;
    product_quantity: number;
    product_image: string | null;
    created_at: string;
}

interface PageProps {
    products: {
        data: Product[];
    };
    flash?: {
        success?: string;
        error?: string;
    };
}

export default function AdminProduct({ products }: PageProps) {
    const { flash } = usePage<PageProps>().props; // Get flash messages from Inertia
    const { data, setData, reset, post, processing, errors } = useForm({
        product_name: "",
        product_category: "",
        product_price: "",
        product_quantity: "",
        product_image: null as File | null,
    });

    const [searchQuery, setSearchQuery] = useState("");

    const [previewImage, setPreviewImage] = useState<string | null>(null);

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setData("product_image", file);
        setPreviewImage(URL.createObjectURL(file));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route("admin.products.store"), {
            preserveScroll: true,
            onSuccess: () => {
                toast.success(" Product added successfully!", { 
                    position: "top-center", 
                    style: { 
                        fontSize: "16px",
                        fontWeight: "bold",
                        background: "#4CAF50",
                        color: "#fff",
                        padding: "12px",
                        borderRadius: "8px",
                    }
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
                    }
                });
            },
        });
    };

    // Filter products based on search query
    const filteredProducts = products.data.filter((product) =>
        product.product_name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Products" />
            <Toaster /> {/* Toast notifications renderer */}
            
            <div className="flex flex-col items-left min-h-screen p-6 bg-gray-100 dark:bg-gray-900">
                <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
                    <h2 className="text-xl font-semibold text-center text-gray-900 dark:text-white mb-4">
                        Add Product
                    </h2>

                    <form onSubmit={handleSubmit} className="space-y-4" encType="multipart/form-data">
                        <div>
                            <Label htmlFor="product_name">Product Name</Label>
                            <Input
                                id="product_name"
                                type="text"
                                value={data.product_name}
                                onChange={(e) => setData("product_name", e.target.value)}
                                required
                                className="mt-1 w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div>
                            <Label htmlFor="product_category">Category</Label>
                            <select
                                id="product_category"
                                value={data.product_category}
                                onChange={(e) => setData("product_category", e.target.value)}
                                required
                                className="mt-1 w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring focus:ring-blue-500"
                            >
                                <option value="">Select Category</option>
                                <option value="Grilled">Grilled</option>
                                <option value="Ready2eat">Ready2eat</option>
                                <option value="Ready2cook">Ready2cook</option>
                                <option value="Bottled">Bottled</option>
                            </select>
                        </div>

                        <div>
                            <Label htmlFor="product_price">Price (₱)</Label>
                            <Input
                                id="product_price"
                                type="number"
                                value={data.product_price}
                                onChange={(e) => setData("product_price", e.target.value)}
                                required
                                min="0"
                                step="0.01"
                                className="mt-1 w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div>
                            <Label htmlFor="product_quantity">Quantity</Label>
                            <Input
                                id="product_quantity"
                                type="number"
                                value={data.product_quantity}
                                onChange={(e) => setData("product_quantity", e.target.value)}
                                required
                                min="1"
                                className="mt-1 w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div>
                            <Label htmlFor="product_image">Item Image</Label>
                            <Input
                                id="product_image"
                                type="file"
                                accept="image/*"
                                onChange={handleImageUpload}
                                className="mt-1 w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            {previewImage && (
                                <img src={previewImage} alt="Preview" className="mt-2 w-16 max-h-40 object-cover rounded-md border" />
                            )}
                        </div>

                        <Button type="submit" disabled={processing} className="w-full px-4 py-2 mt-4 text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500">
                            {processing ? "Saving..." : "Save Product"}
                        </Button>
                    </form>
                </div>

                {/* Product List */}
                <div className="w-full max-w-4xl bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Product List</h2>

                    {/* Search Bar */}
                    <div className="mb-4">
                        <Input
                            type="text"
                            placeholder="Search Product..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div className="w-full overflow-x-auto">
                        <table className="min-w-[900px] border-collapse border border-gray-300 dark:border-gray-700">
                            <thead>
                                <tr className="bg-gray-200 dark:bg-gray-700">
                                    <th className="border px-4 py-2 min-w-[70px]">ID</th>
                                    <th className="border px-4 py-2 min-w-[150px]">Name</th>
                                    <th className="border px-4 py-2 min-w-[100px]">Image</th>
                                    <th className="border px-4 py-2 min-w-[150px]">Stock Status</th>
                                    <th className="border px-4 py-2 min-w-[150px]">Price</th>
                                    <th className="border px-4 py-2 min-w-[150px]">Category</th>
                                    <th className="border px-4 py-2 min-w-[70px]">Stock</th>
                                    <th className="border px-4 py-2 min-w-[120px]">Total Value</th>
                                    <th className="border px-4 py-2 min-w-[200px]">Created at</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredProducts.map((product) => (
                                    <tr key={product.id} className="text-center">
                                        <td className="border px-4 py-2">{product.id}</td>
                                        <td className="border px-4 py-2">{product.product_name}</td>
                                        <td className="border px-4 py-2">
                                            {product.product_image && (
                                                <img src={`/storage/${product.product_image}`} alt="Product" className="w-12 h-8 object-cover mx-auto rounded" />
                                            )}
                                        </td>
                                        <td className="border px-4 py-2">
                                            <span className={`px-2 py-1 rounded-md ${
                                                product.product_quantity >= 50 ? "bg-purple-500" :
                                                product.product_quantity >= 10 ? "bg-green-500" :
                                                product.product_quantity >= 5 ? "bg-yellow-500" :
                                                product.product_quantity === 0 ? "bg-red-500" :
                                                "bg-blue-500"
                                            } text-white`}>
                                                {product.product_quantity >= 50 ? "High Stock" :
                                                product.product_quantity >= 10 ? "In Stock" :
                                                product.product_quantity >= 5 ? "Low Stock" :
                                                product.product_quantity === 0 ? "Out of Stock" : "Backorder"}
                                            </span>
                                        </td>
                                        <td className="border px-4 py-2">₱ {product.product_price}</td>
                                        <td className="border px-4 py-2">{product.product_category}</td>  
                                        <td className="border px-4 py-2">{product.product_quantity}</td>
                                        <td className="border px-4 py-2">{product.product_quantity * product.product_price}</td>
                                        <td className="border px-4 py-2">
                                            {new Date(product.created_at).toLocaleString("en-US", {
                                                year: "numeric",
                                                month: "2-digit",
                                                day: "2-digit",
                                                hour: "2-digit",
                                                minute: "2-digit",
                                                hour12: true,
                                            })}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>                             
            </div>
        </AppLayout>
    );
}