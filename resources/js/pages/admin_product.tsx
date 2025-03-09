import { useState } from "react";
import { useForm, Link } from "@inertiajs/react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import AppLayout from "@/layouts/app-layout";
import { type BreadcrumbItem } from "@/types";
import { Head } from "@inertiajs/react";

const breadcrumbs: BreadcrumbItem[] = [{ title: "Products", href: "/admin/products" }];

export default function AdminProduct({ products }) {
    const { data, setData, reset } = useForm({
        product_name: "",
        product_category: "",
        product_price: "",
        product_quantity: "",
        product_image: "",
    });

    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const [processing, setProcessing] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    // Handle image upload and store temporarily
    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const formData = new FormData();
            formData.append("product_image", file);
    
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute("content") || "";
            console.log("CSRF Token:", csrfToken); // Log CSRF token for debugging
    
            try {
                const response = await fetch(route("admin.products.uploadTempImage"), {
                    method: "POST",
                    headers: {
                        "X-CSRF-TOKEN": csrfToken,
                    },
                    body: formData,
                });
    
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
    
                const result = await response.json();
                console.log(result); // Log the response for debugging
    
                if (result.filePath) {
                    setData("product_image", result.filePath); // Store the file path
                    setPreviewImage(URL.createObjectURL(file)); // Show preview
                } else {
                    setErrorMessage("Failed to upload image. Please try again.");
                }
            } catch (error) {
                console.error("Image upload failed", error);
                setErrorMessage("An error occurred while uploading the image.");
            }
        }
    };

    // Handle form submission using JSON API
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setProcessing(true);
        setErrorMessage(null);

        try {
            const response = await fetch(route("admin.products.store"), {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRF-TOKEN": document.querySelector('meta[name="csrf-token"]')?.getAttribute("content") || "",
                },
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            console.log(result); // Log the response for debugging

            if (result.success) {
                alert("Product added successfully!");
                reset(); // Reset form
                setPreviewImage(null);
            } else {
                setErrorMessage("Failed to add product. Please try again.");
            }
        } catch (error) {
            console.error("Error saving product", error);
            setErrorMessage("An unexpected error occurred.");
        } finally {
            setProcessing(false);
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Products" />
            <div className="flex flex-col items-center min-h-screen p-6 bg-gray-100 dark:bg-gray-900">
                {/* Add Product Form */}
                <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
                    <h2 className="text-xl font-semibold text-center text-gray-900 dark:text-white mb-4">
                        Add Product
                    </h2>

                    {/* Display Error Message */}
                    {errorMessage && <p className="text-red-500 text-center">{errorMessage}</p>}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Product Name */}
                        <div>
                            <Label htmlFor="product_name">Product Name</Label>
                            <Input
                                id="product_name"
                                type="text"
                                placeholder="Enter name"
                                value={data.product_name}
                                onChange={(e) => setData("product_name", e.target.value)}
                                required
                            />
                        </div>

                        {/* Product Category */}
                        <div>
                            <Label htmlFor="product_category">Category</Label>
                            <select
                                id="product_category"
                                value={data.product_category}
                                onChange={(e) => setData("product_category", e.target.value)}
                                className="w-full mt-1 border-gray-300 dark:border-gray-600 rounded-md"
                                required
                            >
                                <option value="">Select Category</option>
                                <option value="Electronics">Electronics</option>
                                <option value="Clothing">Clothing</option>
                                <option value="Books">Books</option>
                            </select>
                        </div>

                        {/* Product Price */}
                        <div>
                            <Label htmlFor="product_price">Price ($)</Label>
                            <Input
                                id="product_price"
                                type="number"
                                placeholder="Enter price"
                                value={data.product_price}
                                onChange={(e) => setData("product_price", e.target.value)}
                                required
                                min="0"
                                step="0.01"
                            />
                        </div>

                        {/* Product Quantity */}
                        <div>
                            <Label htmlFor="product_quantity">Quantity</Label>
                            <Input
                                id="product_quantity"
                                type="number"
                                placeholder="Enter quantity"
                                value={data.product_quantity}
                                onChange={(e) => setData("product_quantity", e.target.value)}
                                required
                                min="1"
                            />
                        </div>

                        {/* Product Image Upload & Preview */}
                        <div>
                            <Label htmlFor="product_image">Product Image</Label>
                            <Input
                                id="product_image"
                                type="file"
                                accept="image/*"
                                onChange={handleImageUpload}
                            />
                            {previewImage && (
                                <img
                                    src={previewImage}
                                    alt="Product Preview"
                                    className="mt-2 w-full h-40 object-cover rounded-md border"
                                />
                            )}
                        </div>

                        {/* Submit Button */}
                        <Button type="submit" disabled={processing} className="w-full py-2 text-lg font-medium bg-blue-600 hover:bg-blue-700 transition-all">
                            {processing ? "Saving..." : "Save Product"}
                        </Button>
                    </form>
                </div>

                {/* Product List with Pagination */}
                <div className="w-full max-w-3xl bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Product List</h2>

                    <table className="w-full border-collapse border border-gray-300 dark:border-gray-700">
                        <thead>
                            <tr className="bg-gray-200 dark:bg-gray-700">
                                <th className="border px-4 py-2">Name</th>
                                <th className="border px-4 py-2">Category</th>
                                <th className="border px-4 py-2">Price</th>
                                <th className="border px-4 py-2">Quantity</th>
                                <th className="border px-4 py-2">Image</th>
                            </tr>
                        </thead>
                        <tbody>
                            {products.data.map((product) => (
                                <tr key={product.id} className="text-center">
                                    <td className="border px-4 py-2">{product.product_name}</td>
                                    <td className="border px-4 py-2">{product.product_category}</td>
                                    <td className="border px-4 py-2">${product.product_price}</td>
                                    <td className="border px-4 py-2">{product.product_quantity}</td>
                                    <td className="border px-4 py-2">
                                        {product.product_image && (
                                            <img
                                                src={`/storage/${product.product_image}`}
                                                alt="Product"
                                                className="w-16 h-16 object-cover mx-auto rounded"
                                            />
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {/* Pagination Links */}
                    <div className="flex justify-center gap-2 mt-4">
                        {products.links.map((link, index) => (
                            <Link key={index} href={link.url || "#"} className={`px-4 py-2 border rounded ${link.active ? "bg-blue-500 text-white" : ""}`}>
                                {link.label}
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}