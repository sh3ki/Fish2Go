import { useState, useRef, useEffect, useCallback } from "react";
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
import { Filter, CircleX, Loader2, Plus, ArrowUp, ArrowDown } from "lucide-react";
import SearchBar from "@/components/ui/search-bar";
import ActionButtons from "@/components/ui/action-buttons";
import FilterButton from "@/components/ui/filter-button";
import SortButton from "@/components/ui/sort-button";

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
  const [productList, setProductList] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeCategory, setActiveCategory] = useState<number | "all" | "available">("all");
  const [categoryList, setCategoryList] = useState<Category[]>(categories || []);
  const [imageTimestamps, setImageTimestamps] = useState<Record<number, number>>({});
  
  // New state for Add Category modal
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [newCategoryData, setNewCategoryData] = useState({
    category_name: "",
    category_color: "#3b82f6" // Default blue color
  });
  
  // New state for sorting
  const [sortField, setSortField] = useState<string>("product_id");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  
  // Refs
  const tableRef = useRef<HTMLDivElement>(null);

  // Display a flash message if one exists
  useEffect(() => {
    if (flash?.success) {
      toast.success(flash.success);
    }
    if (flash?.error) {
      toast.error(flash.error);
    }
  }, [flash]);

  // Initialize product list from props
  useEffect(() => {
    if (products?.data && products.data.length > 0) {
      const sortedProducts = [...products.data].sort((a, b) => a.product_id - b.product_id);
      setProductList(sortedProducts);
      setFilteredProducts(sortedProducts);
    }
  }, [products]);

  // Sort products when sort parameters change
  useEffect(() => {
    if (filteredProducts.length > 0) {
      const sorted = sortProductsCopy(filteredProducts);
      setFilteredProducts(sorted);
    }
  }, [sortField, sortDirection]);

  // Create a copy of the sort function that doesn't mutate state
  const sortProductsCopy = (productsToSort: Product[]) => {
    let sorted = [...productsToSort];
    
    // Regular sorting
    if (sortField === "product_id") {
      sorted.sort((a, b) => 
        sortDirection === "asc" ? a.product_id - b.product_id : b.product_id - a.product_id
      );
    } else if (sortField === "product_name") {
      sorted.sort((a, b) => 
        sortDirection === "asc" 
          ? a.product_name.localeCompare(b.product_name) 
          : b.product_name.localeCompare(a.product_name)
      );
    } else if (sortField === "price") {
      sorted.sort((a, b) => {
        const priceA = parseFloat(a.product_price.toString());
        const priceB = parseFloat(b.product_price.toString());
        return sortDirection === "asc" ? priceA - priceB : priceB - priceA;
      });
    } else if (sortField === "qty") {
      sorted.sort((a, b) => 
        sortDirection === "asc" ? a.product_qty - b.product_qty : b.product_qty - a.product_qty
      );
    } else if (sortField === "total") {
      sorted.sort((a, b) => {
        const totalA = parseFloat(a.product_price.toString()) * a.product_qty;
        const totalB = parseFloat(b.product_price.toString()) * b.product_qty;
        return sortDirection === "asc" ? totalA - totalB : totalB - totalA;
      });
    }
    
    return sorted;
  };

  // Modified version of sortProducts that updates state
  const sortProducts = () => {
    const sorted = sortProductsCopy(filteredProducts);
    setFilteredProducts(sorted);
  };

  // Get user-friendly status text based on quantity
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
    
    // Apply sorting immediately
    const sorted = sortProductsCopy(filteredProducts);
    setFilteredProducts(sorted);
  };

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
      
      // Append all product data fields - ensure numeric values are properly formatted
      formData.append('product_name', data.product_name);
      formData.append('category_id', data.category_id.toString());
      formData.append('product_price', Number(data.product_price).toString());
      
      // Explicitly parse the quantity to an integer to handle leading zeros
      const quantity = parseInt(data.product_qty.toString(), 10);
      formData.append('product_qty', isNaN(quantity) ? "0" : quantity.toString());

      if (isEditMode && selectedProduct) {
        // Modified approach for updating products
        
        // If we have a new image, we want to tell the backend to replace the old one
        if (data.product_image) {
          formData.append('product_image', data.product_image);
          
          // Tell backend to keep the same filename
          if (selectedProduct.product_image) {
            formData.append('existing_image_path', selectedProduct.product_image);
          }
        }
        
        // Get CSRF token directly from meta tag
        const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
        
        // Use the correct Laravel route pattern and include _method for proper method spoofing
        const productId = selectedProduct.product_id;
        const updateUrl = `/admin/products/${productId}`;
        
        try {
          // Configuration for axios
          const axiosConfig = {
            headers: {
              'Content-Type': 'multipart/form-data',
              'Accept': 'application/json',
              'X-CSRF-TOKEN': csrfToken || '',
              'X-Requested-With': 'XMLHttpRequest', // Add this line - important for Laravel to recognize AJAX requests
            },
            withCredentials: true // Add this line to include cookies in the request
          };
          
          // Add _method field to simulate PUT request via POST
          formData.append('_method', 'PUT');
          
          // Use regular POST with _method field for Laravel method spoofing
          const response = await axios.post(updateUrl, formData, axiosConfig);
          
          toast.success("Product updated successfully!");
          
          // Update the product in the productList directly, instead of fetching all products
          if (response.data && response.data.product) {
            setProductList(prevProducts => 
              prevProducts.map(product => 
                product.product_id === productId ? response.data.product : product
              )
            );
            
            // If an image was uploaded, update the timestamp for cache busting
            if (data.product_image) {
              setImageTimestamps(prev => ({
                ...prev,
                [productId]: Date.now()
              }));
            }
          } else {
            // Fallback to full refresh if response doesn't contain the updated product
            fetchProducts(searchTerm, activeCategory);
          }
          
          // Close modal and reset form
          setIsModalOpen(false);
          setIsEditMode(false);
          setSelectedProduct(null);
          reset();
          setPreviewImage(null);
        } catch (error) {
          // More specific error handling
          if (error.response?.status === 419) {
            toast.error("CSRF token mismatch. Please refresh the page and try again.");
          } else if (error.response?.status === 422) {
            toast.error("Validation error: " + Object.values(error.response.data.errors).flat().join(", "));
          } else {
            toast.error("Failed to update product: " + (error.response?.data?.message || error.message));
          }
        }
      } else {
        // For new products
        if (data.product_image) {
          formData.append('product_image', data.product_image);
        }
        
        const response = await axios.post(route("admin.products.store"), formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Accept': 'application/json',
          },
        });
        
        toast.success("Product added successfully!");
        
        // Force reload after creating products too
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      }

      // Reset form and close modal
      reset();
      setPreviewImage(null);
      setIsModalOpen(false);
      setIsEditMode(false);
      setSelectedProduct(null);

    } catch (err) {
      toast.error("❌ " + (err.response?.data?.error || err.response?.data?.message || "Something went wrong!"));
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
                  fetchProducts(searchTerm, activeCategory);
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
              className="px-4 py-2 bg-gray-600 text-white rounded-md shadow hover:bg-gray-700"
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

  const filterByCategory = (categoryId: number | "all" | "available") => {
    setActiveCategory(categoryId);
    
    // Apply category filter to current product list
    let filtered = [...productList];
    
    if (categoryId === "available") {
      // Filter products with quantity > 0
      filtered = filtered.filter(product => product.product_qty > 0);
    } else if (categoryId !== "all") {
      filtered = filtered.filter(product => product.category_id === categoryId);
    }
    
    // Apply current search term if any
    if (searchTerm.trim() !== "") {
      const tokens = searchTerm.toLowerCase().split(/\s+/).filter(t => t.length > 0);
      filtered = filtered.filter(product => 
        tokens.every(token => product.product_name.toLowerCase().includes(token))
      );
    }
    
    // Apply sorting to filtered results
    const sorted = sortProductsCopy(filtered);
    setFilteredProducts(sorted);
  };

  const handleSearchResults = (results: Product[]) => {
    // Apply current category filter to search results
    let filtered = results;
    
    if (activeCategory === "available") {
      filtered = filtered.filter(product => product.product_qty > 0);
    } else if (activeCategory !== "all") {
      filtered = filtered.filter(product => product.category_id === activeCategory);
    }
    
    // Apply current sorting rules
    const sorted = sortProductsCopy(filtered);
    setFilteredProducts(sorted);
  };

  const handleSearchTermChange = (term: string) => {
    setSearchTerm(term);
  };

  const fetchProducts = useCallback(async (search: string = "", category: number | "all" | "available" = "all") => {
    if (isLoading) return;

    setIsLoading(true);
    try {
      let url = route("admin.products.fetch");
      
      // Add query parameters for search and category
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (category !== "all" && category !== "available") params.append('category', category.toString());
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
      
      console.log(`Fetching all products`);
      
      const response = await axios.get(url);

      if (!response.data || !response.data.products) {
        throw new Error("Invalid API response structure");
      }

      let newProducts = response.data.products.data ?? [];
      
      // Replace all products and apply sorting
      setProductList(newProducts);
      
      // Apply filters and sorting
      let filtered = [...newProducts];
      
      if (category === "available") {
        filtered = filtered.filter(product => product.product_qty > 0);
      } else if (category !== "all") {
        filtered = filtered.filter(product => product.category_id === category);
      }
      
      if (searchTerm.trim() !== "") {
        const tokens = searchTerm.toLowerCase().split(/\s+/).filter(t => t.length > 0);
        filtered = filtered.filter(product => 
          tokens.every(token => product.product_name.toLowerCase().includes(token))
        );
      }
      
      const sorted = sortProductsCopy(filtered);
      setFilteredProducts(sorted);
      
    } catch (error) {
      console.error("Error fetching products:", error);
      toast.error("Failed to fetch products.");
    } finally {
      setIsLoading(false);
    }
  }, [sortProductsCopy, searchTerm]);

  const fetchCategories = async () => {
    try {
      const response = await axios.get('/admin/categories');
      if (response.data && Array.isArray(response.data)) {
        setCategoryList(response.data);
      } else if (response.data && Array.isArray(response.data.categories)) {
        setCategoryList(response.data.categories);
      }
    } catch (error) {
      toast.error("Failed to load categories");
    }
  };

  // Handle saving a new category
  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newCategoryData.category_name.trim()) {
      toast.error("Category name is required");
      return;
    }
    
    try {
      // Get CSRF token directly from meta tag
      const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
      
      const response = await axios.post('/admin/categories', newCategoryData, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-CSRF-TOKEN': csrfToken || '',
        }
      });
      
      if (response.data && response.data.category) {
        // Add new category to the list
        const newCategory = response.data.category;
        setCategoryList(prev => [...prev, newCategory]);
        
        // Select the new category
        setData("category_id", newCategory.category_id.toString());
        
        // Close the modal and reset form
        setShowAddCategoryModal(false);
        setNewCategoryData({
          category_name: "",
          category_color: "#3b82f6"
        });
        
        toast.success("Category added successfully!");
      }
    } catch (error) {
      toast.error("Failed to add category: " + (error.response?.data?.message || error.message));
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    if (isModalOpen) {
      fetchCategories();
    }
  }, [isModalOpen]);

  // Update filtered products when source data or filtering criteria change
  useEffect(() => {
    if (productList.length > 0) {
      let filtered = [...productList];
      
      // Apply category filter
      if (activeCategory === "available") {
        filtered = filtered.filter(product => product.product_qty > 0);
      } else if (activeCategory !== "all") {
        filtered = filtered.filter(product => product.category_id === activeCategory);
      }
      
      // Apply search filter
      if (searchTerm.trim() !== "") {
        const tokens = searchTerm.toLowerCase().split(/\s+/).filter(t => t.length > 0);
        filtered = filtered.filter(product => 
          tokens.every(token => product.product_name.toLowerCase().includes(token))
        );
      }
      
      // Apply current sorting
      const sorted = sortProductsCopy(filtered);
      setFilteredProducts(sorted);
    }
  }, [activeCategory, searchTerm, productList]);

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Products" />
      <Toaster />

      {/* Main Container - Fixed to viewport size */}
      <div className="flex flex-col rounded-xl p-2 h-[calc(100vh-64px)] overflow-hidden">
  
        {/* Header with Search & Filter */}
        <div className="p-1 pl-5 pb-2 pr-2 w-full">
          {/* Search and Category Filter */}
          <div className="flex items-center gap-1.5 mb-2 bg-transparent rounded-lg justify-between">
            <div className="flex items-center gap-1.5 w-5/9">
              <SearchBar
                placeholder="Search Product"
                items={productList}
                searchField="product_name"
                onSearchResults={handleSearchResults}
                onSearchTermChange={handleSearchTermChange}
                className="input w-full bg-gray-700 p-1.5 pl-3 text-sm text-white rounded-lg focus:outline-none focus:ring-1 focus:ring-inset focus:ring-white-400"
              />
              
              <FilterButton
                options={categoryList.map(cat => ({ id: cat.category_id, name: cat.category_name }))}
                activeFilter={activeCategory}
                onSelectFilter={(categoryId) => filterByCategory(categoryId as number | "all" | "available")}
                includeAvailable={true}
              />
              
              <SortButton
                options={[
                  { field: "product_id", label: "ID", type: "numeric" },
                  { field: "product_name", label: "Name", type: "text" },
                  { field: "price", label: "Price", type: "numeric" },
                  { field: "qty", label: "Quantity", type: "numeric" },
                  { field: "total", label: "Total Value", type: "numeric" }
                ]}
                currentField={sortField}
                currentDirection={sortDirection}
                onSort={handleSortOption}
              />
            </div>
            
            {/* Add Product Button - Right Aligned */}
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
                      className={`px-1 py-2.5 text-center text-xs font-semibold text-white uppercase tracking-wider w-14 bg-gray-700 cursor-pointer hover:bg-gray-600 ${sortField === "product_id" ? "bg-gray-600" : ""}`}
                      onClick={() => handleSortOption("product_id", sortField === "product_id" && sortDirection === "asc" ? "desc" : "asc")}
                    >
                      <div className="flex items-center justify-center">
                        ID
                        {sortField === "product_id" && (
                          sortDirection === "asc" ? <ArrowUp size={12} className="ml-1" /> : <ArrowDown size={12} className="ml-1" />
                        )}
                      </div>
                    </th>
                    <th className="px-1 py-2.5 text-center text-xs font-semibold text-white uppercase tracking-wider w-18 bg-gray-700">
                      Image
                    </th>
                    <th 
                      className={`px-1 py-2.5 text-center text-xs font-semibold text-white uppercase tracking-wider w-80 bg-gray-700 cursor-pointer hover:bg-gray-600 ${sortField === "product_name" ? "bg-gray-600" : ""}`}
                      onClick={() => handleSortOption("product_name", sortField === "product_name" && sortDirection === "asc" ? "desc" : "asc")}
                    >
                      <div className="flex items-center justify-center">
                        Product Name
                        {sortField === "product_name" && (
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
                        Total
                        {sortField === "total" && (
                          sortDirection === "asc" ? <ArrowUp size={12} className="ml-1" /> : <ArrowDown size={12} className="ml-1" />
                        )}
                      </div>
                    </th>
                    <th className="px-1 py-2.5 text-center text-xs font-semibold text-white uppercase tracking-wider w-28 bg-gray-700">
                      Status
                    </th>
                    <th className="px-1 py-2.5 text-center text-xs font-semibold text-white uppercase tracking-wider w-26 bg-gray-700">
                      Category
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
              key="product-table-body"
            >
              <table className="min-w-full divide-y divide-gray-700 border-collapse">
                <tbody className="bg-gray-800 divide-y divide-gray-700">
                  {isLoading && filteredProducts.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-6 py-6 text-center text-gray-400">
                        <div className="flex justify-center items-center">
                          <Loader2 className="h-6 w-6 animate-spin mr-2" />
                          <span className="font-medium">Loading products...</span>
                        </div>
                      </td>
                    </tr>
                  ) : filteredProducts.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-6 py-6 text-center text-gray-400">
                        <span className="font-medium">No products found</span>
                      </td>
                    </tr>
                  ) : (
                    // Regular rows without grouping
                    filteredProducts.map((product) => (
                      <tr 
                        key={product.product_id} 
                        className="hover:bg-gray-700/60 transition-colors"
                      >
                        <td className="px-1 text-center py-1 whitespace-nowrap text-sm font-medium text-gray-300 w-14">
                          {product.product_id}
                        </td>
                        <td className="px-1 py-1 text-center whitespace-nowrap w-18">
                          {product.product_image ? (
                            <div className="flex items-center justify-center">
                              <img 
                                src={`/storage/${product.product_image}${imageTimestamps[product.product_id] ? `?t=${imageTimestamps[product.product_id]}` : ''}`} 
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
                              <div className="w-10 h-10 bg-gray-700 rounded-md flex items-center justify-center text-gray-400 border border-gray-600"></div>
                            </div>
                          )}
                        </td>
                        <td className="px-1 py-1 pl-5 text-left whitespace-nowrap text-sm font-medium w-80 text-gray-300">
                          {product.product_name}
                        </td>
                        <td className="px-1 py-1 text-center whitespace-nowrap text-sm font-medium text-gray-300 w-20">
                          ₱ {parseFloat(product.product_price.toString()).toFixed(2)}
                        </td>
                        <td className="px-1 py-1 text-center whitespace-nowrap text-sm text-gray-300 w-14">
                          {product.product_qty}
                        </td>
                        <td className="px-1 py-1 text-center whitespace-nowrap text-sm font-medium text-green-300 w-24">
                          ₱ {(parseFloat(product.product_price.toString()) * product.product_qty).toFixed(2)}
                        </td>
                        <td className="px-1 py-1 text-center whitespace-nowrap w-28">
                          <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                            ${product.product_qty >= 30 ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200" :
                              product.product_qty >= 10 ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" :
                              product.product_qty >= 5 ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200" :
                              product.product_qty === 0 ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200" :
                              "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"}`}
                          >
                            {getStatusText(product.product_qty)}
                          </span>
                        </td>
                        <td className="px-1 py-1 text-center text-sm text-gray-300 w-26">
                          {product.category_name}
                        </td>
                        <td className="px-1 py-1 text-center items-center whitespace-nowrap space-x-2 w-30">
                          <ActionButtons 
                            onEdit={() => openEditModal(product)}
                            onDelete={() => handleDelete(product.product_id)}
                          />
                        </td>
                      </tr>
                    ))
                  )}
                  
                  </tbody>              
                  </table>            
                  </div>          
                  </div>                  
                  </div>      </div>      
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
                {isEditMode ? 'Edit Product' : 'Add New Product'}
              </h2>
            </div>

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
                  onChange={(e) => {
                    if (e.target.value === "add_new") {
                      setShowAddCategoryModal(true);
                    } else {
                      setData("category_id", e.target.value);
                    }
                  }}
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
                  <option value="add_new" className="font-semibold text-blue-400">+ Add New Category</option>
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
                  onChange={(e) => {
                    // Parse input value to remove leading zeros but maintain as string in form state
                    const value = e.target.value;
                    const parsedValue = value === '' ? 0 : parseInt(value, 10);
                    setData("product_qty", parsedValue);
                  }}
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
          </div>
        </div>
      )}
      
      {/* Add Category Modal */}
      {showAddCategoryModal && (
        <div className="fixed inset-0 flex items-center justify-center z-[60]">
          <div 
            className="absolute inset-0 bg-black/40" 
            onClick={() => setShowAddCategoryModal(false)}
          ></div>
          
          <div 
            className="relative bg-gray-800 px-4 py-3 rounded-xl shadow-2xl max-w-md w-full z-50 border border-gray-600"
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              onClick={() => setShowAddCategoryModal(false)}
              className="absolute top-3 right-3 z-[60] text-gray-400 hover:text-gray-300 transition-colors"
            >
              <CircleX size={20} />
            </button>
            <div className="relative mb-4">
              <h2 className="text-xl font-bold text-white text-center">
                Add New Category
              </h2>
            </div>

            <form onSubmit={handleSaveCategory} className="space-y-4">
              <div>
                <Label htmlFor="category_name" className="text-gray-200">Category Name</Label>
                <Input
                  id="category_name"
                  type="text"
                  value={newCategoryData.category_name}
                  onChange={(e) => setNewCategoryData({...newCategoryData, category_name: e.target.value})}
                  required
                  className="mt-1 w-full bg-gray-700 border-gray-600 text-white"
                />
              </div>

              <div>
                <Label htmlFor="category_color" className="text-gray-200">Category Color</Label>
                <div className="flex mt-1 items-center">
                  <input
                    id="category_color"
                    type="color"
                    value={newCategoryData.category_color}
                    onChange={(e) => setNewCategoryData({...newCategoryData, category_color: e.target.value})}
                    className="w-12 h-8 p-1 bg-transparent border border-gray-600 rounded"
                  />
                  <span className="ml-3 text-gray-300 text-sm">{newCategoryData.category_color}</span>
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-4 border-t border-gray-700">
                <Button 
                  type="submit" 
                  className="bg-blue-600 text-white hover:bg-blue-700"
                >
                  Save
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  );
}