import { useState, useRef, useEffect } from "react";
import { useForm, usePage } from "@inertiajs/react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import AppLayout from "@/layouts/app-layout";
import { Head } from "@inertiajs/react";
import { type BreadcrumbItem } from '@/types';
import toast, { Toaster } from "react-hot-toast";
import axios from "axios";
import { confirmAlert } from 'react-confirm-alert';
import 'react-confirm-alert/src/react-confirm-alert.css';
import { Search, LayoutList, Edit, Trash2, AlertCircle, CircleX, X, Loader2, Plus } from "lucide-react";

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
  category_id: string | number;
  category_name?: string;
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
    total: number;
  };
  categories: Category[];
  flash?: {
    success?: string;
    error?: string;
  };
}

interface Category {
  category_id: number;
  category_name: string;
}

export default function AdminProduct({ products, categories = [] }: PageProps) {
  const { flash } = usePage<PageProps>().props;
  const { data, setData, reset, post, processing, errors } = useForm({
    product_name: "",
    category_id: "",
    product_price: 0,
    product_qty: 0,
    product_image: null as File | null,
  });

  // State variables
  const [searchTerm, setSearchTerm] = useState("");
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [productList, setProductList] = useState<Product[]>(products?.data || []);
  const [currentPage, setCurrentPage] = useState(products?.current_page || 1);
  const [lastPage, setLastPage] = useState(products?.last_page || 1);
  const [totalProducts, setTotalProducts] = useState(products?.total || 0);
  const [isLoading, setIsLoading] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [activeCategory, setActiveCategory] = useState<number | "all">("all");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [categoryList, setCategoryList] = useState<Category[]>(categories || []);
  
  // Refs
  const tableRef = useRef<HTMLDivElement>(null);
  const categoryButtonRef = useRef<HTMLButtonElement>(null);
  const categoryModalRef = useRef<HTMLDivElement>(null);
  
  // Display a flash message if one exists
  useEffect(() => {
    if (flash?.success) {
      toast.success(flash.success);
    }
    if (flash?.error) {
      toast.error(flash.error);
    }
  }, [flash]);

  // Improved categories handling
  useEffect(() => {
    console.log('Initial categories prop:', categories);
    
    // If categories are already provided through props, use them
    if (categories && categories.length > 0) {
      setCategoryList(categories);
      setErrorMessage(null);
      return;
    }
    
    const fetchCategories = async () => {
      try {
        setErrorMessage("Loading categories...");
        
        // Try the API endpoint
        const response = await axios.get('/admin/categories');
        console.log('Categories API response:', response);
        
        let categoriesData = [];
        
        // Handle different response formats
        if (Array.isArray(response.data)) {
          categoriesData = response.data;
        } else if (response.data.categories && Array.isArray(response.data.categories)) {
          categoriesData = response.data.categories;
        } else if (response.data.data && Array.isArray(response.data.data)) {
          categoriesData = response.data.data;
        }
        
        // Update state regardless of empty array
        setCategoryList(categoriesData);
        
        // Only show error if no categories found
        if (categoriesData.length === 0) {
          setErrorMessage("No categories found. Please add categories first.");
        } else {
          setErrorMessage(null);
        }
      } catch (error) {
        console.error("Error fetching categories:", error);
        
        // On error, try a fallback endpoint
        try {
          const fallbackResponse = await axios.get('/admin/category');
          console.log('Fallback categories response:', fallbackResponse);
          
          if (fallbackResponse.data && Array.isArray(fallbackResponse.data)) {
            setCategoryList(fallbackResponse.data);
            
            if (fallbackResponse.data.length === 0) {
              setErrorMessage("No categories found. Please add categories first.");
            } else {
              setErrorMessage(null);
            }
            return;
          }
        } catch (fallbackError) {
          console.error("Fallback fetch also failed:", fallbackError);
        }
        
        // If all fetches fail
        setCategoryList([]);
        setErrorMessage("Failed to load categories. Please add categories.");
      }
    };
    
    fetchCategories();
  }, []); // Removed categories from dependency array to avoid loops

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setData("product_image", file);
    setPreviewImage(URL.createObjectURL(file));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const formData = new FormData();
      formData.append('product_name', data.product_name);
      formData.append('category_id', data.category_id.toString());
      formData.append('product_price', data.product_price.toString());
      formData.append('product_qty', data.product_qty.toString());
      if (data.product_image) {
        formData.append('product_image', data.product_image);
      }

      let response;
      
      if (isEditMode && selectedProduct) {
        formData.append('_method', 'PUT');
        response = await axios.post(
          route("admin.products.update", selectedProduct.product_id), 
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          }
        );
        toast.success("Product updated successfully!");
      } else {
        response = await axios.post(route("admin.products.store"), formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        toast.success("Product added successfully!");
      }

      // Reset form and close modal
      reset();
      setPreviewImage(null);
      setIsModalOpen(false);
      setIsEditMode(false);
      setSelectedProduct(null);

      // Refresh product list
      fetchProducts(1, searchTerm, activeCategory);

    } catch (err) {
      toast.error("❌ " + (err.response?.data?.error || "Something went wrong!"));
    } finally {
      setIsLoading(false);
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
                  toast.success("Product deleted successfully!");
                  fetchProducts(currentPage, searchTerm, activeCategory);
                } catch (error) {
                  const errorMsg =
                    error.response?.status === 404
                      ? "❌ Product not found."
                      : "❌ Failed to delete product.";
                  toast.error(errorMsg);
                }
                onClose();
              }}
              className="px-4 py-2 bg-red-600 text-white rounded-md shadow hover:bg-red-700"
            >
              Yes, Delete
            </button>

            <button
              onClick={() => {
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
      category_id: product.category_id.toString(),
      product_price: product.product_price,
      product_qty: product.product_qty,
      product_image: null,
    });
    setIsEditMode(true);
    setIsModalOpen(true);
  };

  const openAddModal = () => {
    reset();
    setPreviewImage(null);
    setSelectedProduct(null);
    setIsEditMode(false);
    setIsModalOpen(true);
  };

  const toggleCategoryModal = () => {
    setShowCategoryModal(prev => !prev);
  };

  const filterByCategory = (categoryId: number | "all") => {
    setActiveCategory(categoryId);
    setCurrentPage(1); // Reset to first page
    fetchProducts(1, searchTerm, categoryId);
    setShowCategoryModal(false);
  };

  const fetchProducts = async (page: number, search: string = "", category: number | "all" = "all") => {
    setIsLoading(true);
    try {
      let url = route("admin.products.fetch", { page });
      
      // Add query parameters for search and category
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (category !== "all") params.append('category', category.toString());
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
      
      const response = await axios.get(url);

      if (!response.data || !response.data.products) {
        throw new Error("Invalid API response structure");
      }

      if (page === 1) {
        // Replace all products if it's the first page
        setProductList(response.data.products.data ?? []);
      } else {
        // Append products for lazy loading
        setProductList(prev => [...prev, ...(response.data.products.data ?? [])]);
      }
      
      setCurrentPage(response.data.products.current_page ?? 1);
      setLastPage(response.data.products.last_page ?? 1);
      setTotalProducts(response.data.products.total ?? 0);
    } catch (error) {
      console.error("Error fetching products:", error);
      setErrorMessage("Failed to fetch products.");
      setTimeout(() => setErrorMessage(null), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle scroll for lazy loading
  const handleScroll = () => {
    if (!tableRef.current || isLoading || currentPage >= lastPage) return;
    
    const { scrollTop, clientHeight, scrollHeight } = tableRef.current;
    
    // Load more when user has scrolled to bottom (with 100px threshold)
    if (scrollTop + clientHeight >= scrollHeight - 100) {
      fetchProducts(currentPage + 1, searchTerm, activeCategory);
    }
  };

  // Handle search input with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProducts(1, searchTerm, activeCategory);
    }, 300);
    
    return () => clearTimeout(timer);
  }, [searchTerm]);
  
  // Close category dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (categoryModalRef.current && 
          !categoryModalRef.current.contains(event.target) &&
          categoryButtonRef.current && 
          !categoryButtonRef.current.contains(event.target)) {
        setShowCategoryModal(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Products" />
      <Toaster />

      {/* Enhanced error message with action button */}
      {errorMessage && (
        <div className="fixed top-4 right-4 z-50 bg-red-500 text-white p-3 rounded-md shadow-lg flex items-center animate-in fade-in duration-300">
          <AlertCircle className="mr-2" size={20} />
          <span>{errorMessage}</span>
          <button
            onClick={() => setErrorMessage(null)}
            className="ml-4 text-white hover:text-red-200"
          >
            <X size={18} />
          </button>
          
          {/* Add category button with correct path */}
          {errorMessage.includes("No categories found") && (
            <a 
              href="/admin/category/create"
              className="ml-4 bg-white text-red-500 px-2 py-1 rounded text-xs font-medium hover:bg-gray-100"
            >
              Add Category
            </a>
          )}
        </div>
      )}

      {/* Main Container */}
      <div className="flex flex-col h-[calc(100vh-64px)] overflow-hidden bg-gray-900">
        {/* Header with Search & Filter - Updated to match staff_pos styling */}
        <div className="p-4 pb-2 w-1/2 shadow">
          {/* Search and Category Filter - Styled like staff_pos */}
          <div className="flex items-center gap-1.5 mb-2 bg-transparent rounded-lg">
            <input
              type="text"
              placeholder="Search Product"
              className="input w-full bg-gray-700 p-1.5 pl-3 text-sm text-white rounded-lg focus:outline-none focus:ring-1 focus:ring-inset focus:ring-white-400"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <div className="relative">
              <Button
                ref={categoryButtonRef}
                className="bg-gray-500 rounded-lg flex items-center justify-center h-8"
                style={{ aspectRatio: '1/1', padding: '0' }}
                onClick={toggleCategoryModal}
              >
                <LayoutList size={18} />
              </Button>
              
              {showCategoryModal && (
                <div 
                  ref={categoryModalRef}
                  className="absolute right-0 p-0.5 w-30 rounded-md shadow-lg bg-gray-700 ring-1 ring-black ring-opacity-5 z-50"
                >
                  <div className="py-0.5" role="menu" aria-orientation="vertical">
                    <button
                      onClick={() => filterByCategory("all")}
                      className={`block w-full text-left px-4 py-2 text-sm ${
                        activeCategory === "all" 
                        ? "bg-gray-600 text-white" 
                        : "text-white hover:bg-gray-600"
                      }`}
                      role="menuitem"
                    >
                      All Products
                    </button>
                    {categoryList && categoryList.length > 0 ? (
                      categoryList.map((category) => (
                        <button
                          key={category.category_id}
                          onClick={() => filterByCategory(category.category_id)}
                          className={`block w-full text-left px-4 py-2 text-sm ${
                            activeCategory === category.category_id 
                            ? "bg-gray-600 text-white" 
                            : "text-white hover:bg-gray-600"
                          }`}
                          role="menuitem"
                        >
                          {category.category_name}
                        </button>
                      ))
                    ) : (
                      <div className="px-4 py-2 text-sm text-gray-400">Loading categories...</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Table container with better empty state */}
        <div 
          ref={tableRef} 
          className="flex-1 overflow-y-auto p-5 pt-0 pb-16" 
          onScroll={handleScroll}
        >
          {categoryList.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-400">
              <AlertCircle size={48} className="mb-4" />
              <h2 className="text-xl font-semibold mb-2">No Categories Available</h2>
              <p className="text-center mb-6">You need to create categories before you can add products.</p>
              <div className="flex space-x-4">
                <a 
                  href="/admin/categories"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors"
                >
                  View Categories
                </a>
                <a 
                  href="/admin/category/create"
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md transition-colors"
                >
                  Add New Category
                </a>
              </div>
            </div>
          ) : (
            <div className="bg-gray-900 rounded-lg shadow overflow-hidden">
              <table className="min-w-full divide-y divide-gray-700 border-collapse">
                <thead className="bg-gray-700 sticky top-0 z-10">
                  <tr>
                    <th className="px-1 py-2.5 text-center text-xs font-semibold text-white uppercase tracking-wider w-14">
                      ID
                    </th>
                    <th className="px-1 py-2.5 text-center text-xs font-semibold text-white uppercase tracking-wider w-28">
                      Image
                    </th>
                    <th className="px-1 py-2.5 text-center text-xs font-semibold text-white uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-1 py-2.5 text-center text-xs font-semibold text-white uppercase tracking-wider w-30">
                      Price
                    </th>
                    <th className="px-1 py-2.5 text-center text-xs font-semibold text-white uppercase tracking-wider w-20">
                      Qty
                    </th>
                    <th className="px-1 py-2.5 text-center text-xs font-semibold text-white uppercase tracking-wider w-36">
                      Status
                    </th>
                    <th className="px-1 py-2.5 text-center text-xs font-semibold text-white uppercase tracking-wider w-32">
                      Category
                    </th>
                    <th className="px-1 py-2.5 text-center text-xs font-semibold text-white uppercase tracking-wider w-32">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-gray-800 divide-y divide-gray-700">
                  {isLoading && productList.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-6 text-center text-gray-400">
                        <div className="flex justify-center items-center">
                          <Loader2 className="h-6 w-6 animate-spin mr-2" />
                          <span className="font-medium">Loading products...</span>
                        </div>
                      </td>
                    </tr>
                  ) : productList.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-6 text-center text-gray-400">
                        <span className="font-medium">No products found</span>
                      </td>
                    </tr>
                  ) : (
                    productList.map((product) => (
                      <tr 
                        key={product.product_id} 
                        className="hover:bg-gray-700/60 transition-colors"
                      >
                        <td className="px-1 text-center py-1 whitespace-nowrap text-sm font-medium text-gray-300">
                          {product.product_id}
                        </td>
                        <td className="px-1 py-1 text-center whitespace-nowrap">
                          {product.product_image ? (
                            <div className="flex items-center justify-center">
                              <img 
                                src={`/storage/${product.product_image}`} 
                                alt={product.product_name}
                                className="w-10 h-10 object-cover rounded-md border border-gray-600"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).onerror = null;
                                  (e.target as HTMLImageElement).src = '/placeholder.png';
                                }}
                              />
                            </div>
                          ) : (
                            <div className="flex items-center justify-center">
                              <div className="w-10 h-10 bg-gray-700 rounded-md flex items-center justify-center text-gray-400 border border-gray-600">
                                No img
                              </div>
                            </div>
                          )}
                        </td>
                        <td className="px-1 py-1 text-left pl-3 text-sm text-gray-300">
                          {product.product_name}
                        </td>
                        <td className="px-1 py-1 text-center whitespace-nowrap text-sm font-medium text-gray-300">
                          ₱{parseFloat(product.product_price.toString()).toFixed(2)}
                        </td>
                        <td className="px-1 py-1 text-center whitespace-nowrap text-sm text-gray-300">
                          {product.product_qty}
                        </td>
                        <td className="px-1 py-1 text-center whitespace-nowrap">
                          <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                            ${product.product_qty >= 30 ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200" :
                              product.product_qty >= 10 ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" :
                              product.product_qty >= 5 ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200" :
                              product.product_qty === 0 ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200" :
                              "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"}`}
                          >
                            {product.product_qty >= 30 ? "High Stock" :
                              product.product_qty >= 10 ? "In Stock" :
                              product.product_qty >= 5 ? "Low Stock" :
                              product.product_qty === 0 ? "Out of Stock" : "Backorder"}
                          </span>
                        </td>
                        <td className="px-1 py-1 text-center text-sm text-gray-300">
                          {product.category_name}
                        </td>
                        <td className="px-1 py-1 text-center whitespace-nowrap space-x-2">
                          <button
                            onClick={() => openEditModal(product)}
                            className="inline-flex items-center justify-center p-2 rounded-full bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 hover:text-blue-300 transition-colors"
                          >
                            <Edit size={15} />
                          </button>
                          <button
                            onClick={() => handleDelete(product.product_id)}
                            className="inline-flex items-center justify-center p-2 rounded-full bg-red-500/20 hover:bg-red-500/30 text-red-400 hover:text-red-300 transition-colors"
                          >
                            <Trash2 size={15} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                  
                  {/* Loading indicator at bottom during lazy loading */}
                  {isLoading && productList.length > 0 && currentPage < lastPage && (
                    <tr>
                      <td colSpan={8} className="px-6 py-4 text-center text-gray-400">
                        <div className="flex justify-center items-center">
                          <Loader2 className="h-5 w-5 animate-spin mr-2" />
                          <span>Loading more...</span>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
        
        {/* Floating Action Button - Only show if categories exist */}
        {categoryList.length > 0 && (
          <div className="absolute bottom-0.5 right-4">
            <button
              onClick={openAddModal}
              className="text-white p-2 rounded-lg shadow-lg inline-flex items-center justify-center bg-gray-700 transition-colors"
            >
              <Plus size={32} />
            </button>
          </div>
        )}
      </div>

      {/* Modal Implementation - adjusted for categories validation */}
      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          {/* Semi-transparent overlay */}
          <div 
            className="absolute inset-0 bg-black/40" 
            onClick={() => setIsModalOpen(false)}
          ></div>
          
          {/* Modal Content - Ensure higher z-index and solid background */}
          <div 
            className="relative bg-gray-800 px-4 py-3 rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto z-50 border border-gray-600"
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
                {isEditMode ? 'Edit Product' : 'Add New Product'}
              </h2>
            </div>

            {categoryList.length === 0 ? (
              <div className="text-center py-6">
                <AlertCircle size={48} className="mx-auto mb-4 text-yellow-500" />
                <h3 className="text-lg font-semibold text-white mb-2">No Categories Available</h3>
                <p className="text-gray-300 mb-6">You need to create categories before you can add products.</p>
                <a 
                  href="/admin/categories"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors"
                >
                  Go to Categories
                </a>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="product_name" className="text-gray-200">Product Name</Label>
                  <Input
                    id="product_name"
                    type="text"
                    value={data.product_name}
                    onChange={(e) => setData("product_name", e.target.value)}
                    required
                    className="mt-1 w-full bg-gray-700 border-gray-600 text-white"
                  />
                </div>

                <div>
                  <Label htmlFor="category_id" className="text-gray-200">Category</Label>
                  <select
                    id="category_id"
                    value={data.category_id}
                    onChange={(e) => setData("category_id", e.target.value)}
                    required
                    className="mt-1 w-full px-4 py-2 border border-gray-600 rounded-md 
                            bg-gray-700 text-white 
                            focus:outline-none focus:ring focus:ring-blue-500"
                  >
                    <option value="">Select Category</option>
                    {categoryList && categoryList.length > 0 ? (
                      categoryList.map((category) => (
                        <option key={category.category_id} value={category.category_id}>
                          {category.category_name}
                        </option>
                      ))
                    ) : (
                      <option value="" disabled>Loading categories...</option>
                    )}
                  </select>
                </div>

                <div>
                  <Label htmlFor="product_price" className="text-gray-200">Price (₱)</Label>
                  <Input
                    id="product_price"
                    type="number"
                    value={data.product_price}
                    onChange={(e) => setData("product_price", e.target.value)}
                    required
                    min="0"
                    step="0.01"
                    className="mt-1 w-full bg-gray-700 border-gray-600 text-white"
                  />
                </div>

                <div>
                  <Label htmlFor="product_qty" className="text-gray-200">Quantity</Label>
                  <Input
                    id="product_qty"
                    type="number"
                    value={data.product_qty}
                    onChange={(e) => setData("product_qty", e.target.value)}
                    required
                    min="0"
                    className="mt-1 w-full bg-gray-700 border-gray-600 text-white"
                  />
                </div>

                <div>
                  <Label htmlFor="product_image" className="text-gray-200">Product Image</Label>
                  <Input
                    id="product_image"
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="mt-1 w-full bg-gray-700 border-gray-600 text-white"
                  />
                  {previewImage && (
                    <div className="mt-2">
                      <img src={previewImage} alt="Preview" className="h-32 object-contain rounded-md" />
                    </div>
                  )}
                  {isEditMode && selectedProduct?.product_image && !previewImage && (
                    <div className="mt-2">
                      <p className="text-sm text-gray-400 mb-1">Current image:</p>
                      <img 
                        src={`/storage/${selectedProduct.product_image}`} 
                        alt="Current" 
                        className="h-32 object-contain rounded-md" 
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
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {isEditMode ? 'Updating...' : 'Saving...'}
                      </>
                    ) : (
                      isEditMode ? 'Update Product' : 'Add Product'
                    )}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </AppLayout>
  );
}