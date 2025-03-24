import { useState, useRef, useEffect } from "react";
import { useForm, usePage } from "@inertiajs/react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import AppLayout from "@/layouts/app-layout";
import { Head } from "@inertiajs/react";
import { type BreadcrumbItem } from '@/types';
import toast, { Toaster } from "react-hot-toast"; // Import toast
import axios from "axios"; // ✅ Import axios
import { confirmAlert } from 'react-confirm-alert'; // Import react-confirm-alert
import 'react-confirm-alert/src/react-confirm-alert.css'; // Import css
import { Star } from "lucide-react";

const breadcrumbs: BreadcrumbItem[] = [
    {
      title: "Product",
      href: "/admin/product",
    },
  ];
  
// Define TypeScript interfaces
interface Product {
    product_id: number;
    product_name: string;
    category_id: string;
    product_price: number;
    product_qty: number;
    product_image: string | null;
    created_at: string;
}

interface PageProps {
    products: {
        data: Product[];
        current_page: number;
        last_page: number;
    };
    flash?: {
        success?: string;
        error?: string;
    };
    newestProducts: Product[]; // Add newestProducts to PageProps
}

interface Category {
    category_id: number;
    category_name: string;
}


export default function AdminProduct({ products, newestProducts }: PageProps) {
    const { flash } = usePage<PageProps>().props; // Get flash messages from Inertia
    const { data, setData, reset, post, processing, errors } = useForm({
        product_name: "",
        category_id: "",
        product_price: 0,
        product_qty: 0,
        product_image: null as File | null,
    });

    const [searchQuery, setSearchQuery] = useState("");
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [productList, setProductList] = useState(products.data); // Add state for product list
    const [currentPage, setCurrentPage] = useState(products.current_page); // Add state for current page
    const [lastPage, setLastPage] = useState(products.last_page); // Add state for last page
    const addProductRef = useRef<HTMLDivElement>(null); // Add ref for Add Product section
    const [newestItems, setNewestItems] = useState<Product[]>(newestProducts); // Add state for newest items
    const [categories, setCategories] = useState<Category[]>([]);

    useEffect(() => {
        setNewestItems(newestProducts);
    }, [newestProducts]);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const response = await axios.get('/admin/categories'); // ✅ Route to fetch categories
                setCategories(response.data);
            } catch (error) {
                toast.error("Failed to load categories");
            }
        };
        fetchCategories();
    }, []);


    const scrollToAddProduct = () => {
        addProductRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setData("product_image", file);
        setPreviewImage(URL.createObjectURL(file));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const formData = new FormData();
            formData.append('product_name', data.product_name);
            formData.append('category_id', data.category_id);
            formData.append('product_price', data.product_price);
            formData.append('product_qty', data.product_qty);
            if (data.product_image) {
                formData.append('product_image', data.product_image);
            }
    
            const response = await axios.post(route("admin.products.store"), formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
    
            const newProduct = response.data.product;
    
            toast.success("Product added successfully!", { 
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
    
            // ✅ Add the new product to the table instantly without refreshing
            setProductList((prevProducts) => [newProduct, ...prevProducts]);
    
        } catch (err) {
            toast.error("❌ " + (err.response?.data?.error || "Something went wrong!"), { 
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
        }
    };
    

    const handleDelete = async (productId: number) => {
        confirmAlert({
            customUI: ({ onClose }) => (
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl border border-gray-300 dark:border-gray-700 max-w-sm text-center">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                        ⚠️ Confirm Deletion
                    </h2>
                    <p className="text-gray-700 dark:text-gray-300 mb-4">
                        Are you sure you want to delete this product? This action <b>cannot</b> be undone.
                    </p>
                    <div className="flex justify-center gap-4">
                        <button
                            onClick={async () => {
                                try {
                                    await axios.delete(route("admin.products.destroy", productId));
    
                                    toast.success("Product deleted successfully!", {
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
    
                                    setProductList((prevProducts) =>
                                        prevProducts.filter((product) => product.product_id !== productId)
                                    );
                                } catch (error) {
                                    const errorMsg =
                                        error.response?.status === 404
                                            ? "❌ Product not found."
                                            : "❌ Failed to delete product.";
    
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
    

    const openEditModal = (product: Product) => {
        setSelectedProduct(product);
        setData({
            product_name: product.product_name,
            category_id: product.category_id,
            product_price: product.product_price,
            product_qty: product.product_qty,
            product_image: null,
        });
        setIsEditModalOpen(true);
    };

    const fetchProducts = async (page: number) => {
        try {
            const response = await axios.get(route("admin.products.index", { page }));
            
            // ✅ Ensure category_name and created_at are included
            setProductList(response.data.data);
            setCurrentPage(response.data.current_page);
            setLastPage(response.data.last_page);
        } catch (error) {
            toast.error("Failed to fetch products.", {
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
    };
    

    const handlePreviousPage = () => {
        if (currentPage > 1) {
            fetchProducts(currentPage - 1);
        }
    };

    const handleNextPage = () => {
        if (currentPage < lastPage) {
            fetchProducts(currentPage + 1);
        }
    };

    // Filter products based on search query
    const filteredProducts = productList.filter((product) =>
        product.product_name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Products" />
            <Toaster /> {/* Toast notifications renderer */}

            <div className="flex flex-col gap-4 rounded-xl p-4">
                <Button
                    className="bg-blue-500 text-white px-3 py-1 rounded-md self-start"
                    onClick={scrollToAddProduct}
                >
                    Add Product
                </Button>
                <div className="w-full max-w-5xl bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 ">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 ">Product List</h2>

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
                                    <th className="border px-4 py-2 min-w-[130px]">Price</th>
                                    <th className="border px-4 py-2 min-w-[150px]">Category</th>
                                    <th className="border px-4 py-2 min-w-[70px]">Stock</th>
                                    <th className="border px-4 py-2 min-w-[120px]">Total Value</th>
                                    <th className="border px-4 py-2 min-w-[200px]">Created at</th>
                                    <th className="border px-4 py-2 min-w-[150px]">Actions</th> {/* New Column for Buttons */}
                                </tr>
                            </thead>
                            <tbody>
                                {filteredProducts.map((product) => (
                                    <tr key={product.product_id} className="text-center">
                                        <td className="border px-4 py-2">{product.product_id}</td>
                                        <td className="border px-4 py-2">{product.product_name}</td>
                                        <td className="border px-4 py-2">
                                            {product.product_image && (
                                                <img src={`/storage/${product.product_image}`} alt="Product" className="w-12 h-8 object-cover mx-auto rounded" />
                                            )}
                                        </td>
                                        <td className="border px-4 py-2">
                                            <span className={`px-2 py-1 rounded-md ${
                                                product.product_qty >= 50 ? "bg-purple-500" :
                                                product.product_qty >= 10 ? "bg-green-500" :
                                                product.product_qty >= 5 ? "bg-yellow-500" :
                                                product.product_qty === 0 ? "bg-red-500" :
                                                "bg-blue-500"
                                            } text-white`}>
                                                {product.product_qty >= 50 ? "High Stock" :
                                                product.product_qty >= 10 ? "In Stock" :
                                                product.product_qty >= 5 ? "Low Stock" :
                                                product.product_qty === 0 ? "Out of Stock" : "Backorder"}
                                            </span>
                                        </td>
                                        <td className="border px-4 py-2">₱ {product.product_price}</td>
                                        <td className="border px-4 py-2">{product.category_name}</td>
                                        <td className="border px-4 py-2">{product.product_qty}</td>
                                        <td className="border px-4 py-2">{product.product_qty * product.product_price}</td>
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
                                        <td className="border px-4 py-2 flex justify-center gap-2"> {/* Actions Column */}
                                            <Button
                                                className="bg-blue-500 text-white px-3 py-1 rounded-md"
                                                onClick={() => openEditModal(product)}
                                            >
                                                Edit
                                            </Button>
                                            <Button
                                                className="bg-red-500 text-white px-3 py-1 rounded-md"
                                                onClick={() => handleDelete(product.product_id)}
                                            >
                                                Delete
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination Buttons */}
                    <div className="flex justify-between mt-4">
                        <Button
                            className="bg-gray-500 text-white px-3 py-1 rounded-md"
                            onClick={handlePreviousPage}
                            disabled={currentPage === 1}
                        >
                            Previous
                        </Button>
                        <Button
                            className="bg-gray-500 text-white px-3 py-1 rounded-md"
                            onClick={handleNextPage}
                            disabled={currentPage === lastPage}
                        >
                            Next
                        </Button>
                    </div>
                </div>

                <div className="flex">
                    <div ref={addProductRef} className="w-full max-w-[505px] bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
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
                                <Label htmlFor="category_id">Category</Label>
                                <select
                                    id="category_id"
                                    value={data.category_id}
                                    onChange={(e) => setData("category_id", parseInt(e.target.value))} // ✅ Convert to number
                                    required
                                    className="mt-1 w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md 
                                            bg-white dark:bg-gray-800 text-gray-900 dark:text-white 
                                            focus:outline-none focus:ring focus:ring-blue-500"
                                >
                                    <option value="">Select Category</option>
                                    {categories.map((category) => (
                                        <option key={category.category_id} value={category.category_id}>
                                            {category.category_name}
                                        </option>
                                    ))}
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
                                <Label htmlFor="product_qty">Quantity</Label>
                                <Input
                                    id="product_qty"
                                    type="number"
                                    value={data.product_qty}
                                    onChange={(e) => setData("product_qty", e.target.value)}
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

<div className="w-full max-w-[505px] bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6 ml-4"> 
    <h2 className="text-xl font-semibold text-center text-gray-900 dark:text-white mb-4">
        Newest Items
    </h2>
    <div className="grid grid-cols-2 gap-4">
        {newestItems.length > 0 ? (
            newestItems.map((product, index) => (
                <div key={index} className="relative flex flex-col items-center p-2 bg-gray-100 dark:bg-gray-700 rounded-md">
                                   <div className="absolute top-1 right-1 animate-[heartbeat_2.5s_ease-in-out_infinite]">
  <Star className="text-yellow-500" size={18} />
</div>
                    
                    {product.product_image && (
                        <img src={`/storage/${product.product_image}`} 
                            alt={product.product_name} 
                            className="w-10 h-10 object-cover rounded-md mb-2" 
                        />
                    )}
                    <span className="text-gray-900 dark:text-white text-sm text-center">{product.product_name}</span>
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