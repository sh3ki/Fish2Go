import { useState, useEffect, useRef } from "react";
import StaffLayout from "@/components/staff/StaffLayout";
import { type BreadcrumbItem } from "@/types";
import { Head } from "@inertiajs/react";
import axios from "axios";
import { 
  Loader2, ArrowUp, ArrowDown, Search, Calendar as CalendarIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import SearchBar from "@/components/ui/search-bar";
import FilterButton from "@/components/ui/filter-button";
import SortButton from "@/components/ui/sort-button";
import DateRangePicker from "@/components/ui/date-range-picker"; // Import DateRangePicker component
import toast, { Toaster } from "react-hot-toast";
import FullScreenPrompt from "@/components/staff/FullScreenPrompt";
// Date picker imports - using simpler approach
import { format } from "date-fns";

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: "Products",
        href: "/staff/products",
    },
];

interface ProductItem {
    product_id: number;
    product_name: string;
    product_price: number;
    product_qty: number;
    product_image: string | null;
    category_id: number;
    category_name: string;
    status: string;
    status_code: string;
    sold: number;
    created_at: string;
    category_color?: string; // Add this property to accept category color
}

interface CategoryItem {
    category_id: number;
    category_name: string;
}

interface DateRangeProps {
    startDate: string;
    endDate: string;
}

export default function ProductsPOS() {
    // State management
    const [products, setProducts] = useState<ProductItem[]>([]); 
    const [filteredProducts, setFilteredProducts] = useState<ProductItem[]>([]);
    const [categories, setCategories] = useState<CategoryItem[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [sortField, setSortField] = useState<string>("product_id");
    const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
    const [searchTerm, setSearchTerm] = useState<string>("");
    const [activeFilter, setActiveFilter] = useState<string | number>("all");
    const [imageTimestamps, setImageTimestamps] = useState<Record<number, number>>({});
    const tableRef = useRef<HTMLDivElement>(null);
    const [isFullScreen, setIsFullScreen] = useState(false);
    
    // Date range state - updated to use Date objects for DateRangePicker compatibility
    const [startDate, setStartDate] = useState<Date>(new Date());
    const [endDate, setEndDate] = useState<Date>(new Date());
    const [showDateFilter, setShowDateFilter] = useState(false);

    // Format number utility function
    const formatNumber = (value: number | null | undefined): string => {
        const numValue = Number(value || 0);
        return Number.isInteger(numValue) ? numValue.toString() : numValue.toFixed(2).replace(/\.?0+$/, '');
    };
    
    // Format currency
    const formatCurrency = (value: number | null | undefined): string => {
        return `₱${formatNumber(value)}`;
    };
    
    // Initialize products data
    useEffect(() => {
        fetchProducts();
    }, [startDate, endDate]);

    // Apply filters, search and sort
    useEffect(() => {
        applyFilters();
    }, [sortField, sortDirection, searchTerm, activeFilter, products]);

    const fetchProducts = async () => {
        setIsLoading(true);
        try {
            const response = await axios.get("/api/staff/products", {
                params: { 
                    startDate: format(startDate, 'yyyy-MM-dd'),
                    endDate: format(endDate, 'yyyy-MM-dd')
                }
            });
            
            // Process the products data
            if (response.data.products) {
                // Make sure category_color is included in the response
                setProducts(response.data.products);
                setFilteredProducts(response.data.products);
            }
            
            // Set categories data if available
            if (response.data.categories) {
                setCategories(response.data.categories);
            }
            
            // Initialize image timestamps
            const timestamps: Record<number, number> = {};
            if (response.data.products) {
                response.data.products.forEach((product: ProductItem) => {
                    if (product.product_image) {
                        timestamps[product.product_id] = Date.now();
                    }
                });
            }
            setImageTimestamps(timestamps);
        } catch (error) {
            console.error("Error fetching products:", error);
            toast.error("Failed to load product data");
        } finally {
            setIsLoading(false);
        }
    };

    const applyFilters = () => {
        let filtered = [...products];

        // Apply search filter
        if (searchTerm.trim() !== "") {
            const query = searchTerm.toLowerCase();
            filtered = filtered.filter(
                (product) =>
                    product.product_name.toLowerCase().includes(query) ||
                    product.product_id.toString().includes(query)
            );
        }

        // Apply category filter
        if (activeFilter !== "all") {
            if (activeFilter === "available") {
                filtered = filtered.filter(product => product.product_qty > 0);
            } else if (activeFilter === "lowstock") {
                filtered = filtered.filter(product => product.product_qty > 0 && product.product_qty < 10);
            } else if (activeFilter === "outofstock") {
                filtered = filtered.filter(product => product.product_qty === 0);
            } else {
                // Filter by category id
                filtered = filtered.filter(product => product.category_id === Number(activeFilter));
            }
        }

        // Apply sorting
        filtered = sortProducts(filtered);

        setFilteredProducts(filtered);
    };

    const sortProducts = (productsToSort: ProductItem[]) => {
        return [...productsToSort].sort((a, b) => {
            let valueA, valueB;
            
            switch (sortField) {
                case "product_name":
                    valueA = a.product_name.toLowerCase();
                    valueB = b.product_name.toLowerCase();
                    return sortDirection === "asc" 
                        ? valueA.localeCompare(valueB) 
                        : valueB.localeCompare(valueA);
                    
                case "product_price":
                    valueA = a.product_price;
                    valueB = b.product_price;
                    break;
                    
                case "product_qty":
                    valueA = a.product_qty;
                    valueB = b.product_qty;
                    break;
                    
                case "sold":
                    valueA = a.sold;
                    valueB = b.sold;
                    break;
                    
                case "category":
                    valueA = a.category_name.toLowerCase();
                    valueB = b.category_name.toLowerCase();
                    return sortDirection === "asc" 
                        ? valueA.localeCompare(valueB) 
                        : valueB.localeCompare(valueA);
                    
                default: // product_id as default
                    valueA = a.product_id;
                    valueB = b.product_id;
            }
            
            if (valueA < valueB) return sortDirection === "asc" ? -1 : 1;
            if (valueA > valueB) return sortDirection === "asc" ? 1 : -1;
            return 0;
        });
    };

    const handleSortOption = (field: string, direction: "asc" | "desc") => {
        setSortField(field);
        setSortDirection(direction);
    };

    const handleSearchResults = (results: any[]) => {
        const filtered = results as ProductItem[];
        
        // Apply active filter on search results
        let finalResults = filtered;
        
        // Apply category/availability filter
        if (activeFilter !== "all") {
            if (activeFilter === "available") {
                finalResults = filtered.filter(item => item.product_qty > 0);
            } else if (activeFilter === "lowstock") {
                finalResults = filtered.filter(item => item.product_qty > 0 && item.product_qty < 10);
            } else if (activeFilter === "outofstock") {
                finalResults = filtered.filter(item => item.product_qty === 0);
            } else {
                // Filter by category id
                finalResults = filtered.filter(item => item.category_id === Number(activeFilter));
            }
        }
        
        // Apply sorting
        const sortedResults = sortProducts(finalResults);
        setFilteredProducts(sortedResults);
    };

    const handleSearchTermChange = (term: string) => {
        setSearchTerm(term);
    };

    const handleFilterChange = (filterId: string | number) => {
        setActiveFilter(filterId);
    };

    // Get status class based on status code
    const getStatusClass = (statusCode: string): string => {
        switch (statusCode) {
            case "high":
                return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
            case "instock":
                return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
            case "low":
                return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
            case "outofstock":
                return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
            default:
                return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
        }
    };
    
    // Get category class for consistent styling with status badges
    const getCategoryClass = (categoryId: number): string => {
        switch (categoryId) {
            case 1:
                return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
            case 2:
                return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
            case 3:
                return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
            case 4:
                return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
            default:
                return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
        }
    };

    // Format date range for display (moved to DateRangePicker component)
    const formatDateRange = (start: Date, end: Date): string => {
        return `${format(start, 'MMM dd, yyyy')} - ${format(end, 'MMM dd, yyyy')}`;
    };

    // Handle date range change from DateRangePicker
    const handleDateRangeChange = (newStartDate: Date, newEndDate: Date) => {
        setStartDate(newStartDate);
        setEndDate(newEndDate);
        
        // Automatically fetch products with new date range
        setIsLoading(true);
        const formattedStartDate = format(newStartDate, 'yyyy-MM-dd');
        const formattedEndDate = format(newEndDate, 'yyyy-MM-dd');
        
        axios.get("/api/staff/products", {
            params: { startDate: formattedStartDate, endDate: formattedEndDate }
        })
        .then(response => {
            if (response.data.products) {
                setProducts(response.data.products);
                setFilteredProducts(response.data.products);
            }
            
            if (response.data.categories) {
                setCategories(response.data.categories);
            }
            
            // Update image timestamps
            const timestamps: Record<number, number> = {};
            if (response.data.products) {
                response.data.products.forEach((product: ProductItem) => {
                    if (product.product_image) {
                        timestamps[product.product_id] = Date.now();
                    }
                });
            }
            setImageTimestamps(timestamps);
        })
        .catch(error => {
            console.error("Error fetching products:", error);
            toast.error("Failed to load product data");
        })
        .finally(() => {
            setIsLoading(false);
        });
    };

    // Generate filter options from categories
    const generateFilterOptions = () => {
        const defaultFilters = [
            { id: "available", name: "Available" },
            { id: "lowstock", name: "Low Stock" },
            { id: "outofstock", name: "Out of Stock" },
        ];
        
        // If no categories, return just the default filters
        if (!categories || categories.length === 0) {
            return defaultFilters;
        }
        
        // Add categories to filter options
        const categoryFilters = categories.map(cat => ({
            id: cat.category_id,
            name: cat.category_name
        }));
        
        return [...defaultFilters, ...categoryFilters];
    };

    // Add a more descriptive message when loading data
    const getLoadingMessage = () => {
        return `Loading product data for ${formatDateRange(startDate, endDate)}...`;
    };

    return (
        <StaffLayout breadcrumbs={breadcrumbs}>
            <Head title="Products" />
            <Toaster />
            
            <FullScreenPrompt onFullScreenChange={setIsFullScreen} />
            
            <div className="flex flex-col bg-gray-900 h-[calc(100vh-41px)] overflow-hidden">
                {/* Search, Filter, Sort Controls */}
                <div className="p-2 w-full">
                    <div className="flex items-center mb-2 justify-between">
                        <div className="flex items-center gap-1.5 bg-transparent w-5/9 rounded-lg">
                            <SearchBar
                                placeholder="Search Products"
                                items={products}
                                searchField="product_name"
                                onSearchResults={handleSearchResults}
                                onSearchTermChange={handleSearchTermChange}
                                className="input w-full bg-gray-600 p-1 pl-3 text-white rounded-lg focus:outline-none focus:ring-1 focus:ring-inset focus:ring-white-400"
                            />
                            
                            <FilterButton
                                options={generateFilterOptions()}
                                activeFilter={activeFilter}
                                onSelectFilter={handleFilterChange}
                                includeAvailable={false}
                                allOptionText="All Products"
                            />
                            
                            <SortButton
                                options={[
                                    { field: "product_id", label: "ID", type: "numeric" },
                                    { field: "product_name", label: "Name", type: "text" },
                                    { field: "product_price", label: "Price", type: "numeric" },
                                    { field: "product_qty", label: "Quantity", type: "numeric" },
                                    { field: "category", label: "Category", type: "text" },
                                    { field: "sold", label: "Sold", type: "numeric" }
                                ]}
                                currentField={sortField}
                                currentDirection={sortDirection}
                                onSort={handleSortOption}
                            />
                        </div>
                        
                        {/* DateRangePicker - matching staff_transaction.tsx styling */}
                        <div className="flex items-center justify-between w-4/9 pl-1.5 z-20">
                            <DateRangePicker
                                startDate={startDate}
                                endDate={endDate}
                                onChange={handleDateRangeChange}
                                formatDisplay={formatDateRange}
                                displayFormat="MMM dd, yyyy"
                            />
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div 
                    className="flex-1 p-2 pt-0 relative"
                    style={{ 
                        height: 'calc(100vh - 104px)',
                        minHeight: '500px'
                    }}
                >
                    <div className="relative overflow-x-auto bg-gray-900 rounded-lg shadow">
                        <div 
                            ref={tableRef}
                            className="overflow-x-auto overflow-y-auto"
                            style={{ maxHeight: 'calc(100vh - 104px)' }}
                        >
                            <table className="min-w-full divide-y divide-gray-700 border-collapse">
                                <thead className="bg-gray-700 sticky top-0 z-10">
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
                                            className={`px-1 py-2.5 text-center text-xs font-semibold text-white uppercase tracking-wider w-30 bg-gray-700 cursor-pointer hover:bg-gray-600 ${sortField === "product_price" ? "bg-gray-600" : ""}`}
                                            onClick={() => handleSortOption("product_price", sortField === "product_price" && sortDirection === "asc" ? "desc" : "asc")}
                                        >
                                            <div className="flex items-center justify-center">
                                                Price
                                                {sortField === "product_price" && (
                                                    sortDirection === "asc" ? <ArrowUp size={12} className="ml-1" /> : <ArrowDown size={12} className="ml-1" />
                                                )}
                                            </div>
                                        </th>
                                        <th className="px-1 py-2.5 text-center text-xs font-semibold text-white uppercase tracking-wider w-28 bg-gray-700">
                                            Status
                                        </th>
                                        <th
                                            className={`px-1 py-2.5 text-center text-xs font-semibold text-white uppercase tracking-wider w-30 bg-gray-700 cursor-pointer hover:bg-gray-600 ${sortField === "category" ? "bg-gray-600" : ""}`}
                                            onClick={() => handleSortOption("category", sortField === "category" && sortDirection === "asc" ? "desc" : "asc")}
                                        >
                                            <div className="flex items-center justify-center">
                                                Category
                                                {sortField === "category" && (
                                                    sortDirection === "asc" ? <ArrowUp size={12} className="ml-1" /> : <ArrowDown size={12} className="ml-1" />
                                                )}
                                            </div>
                                        </th>
                                        <th
                                            className={`px-1 py-2.5 text-center text-xs font-semibold text-white uppercase tracking-wider w-30 bg-gray-700 cursor-pointer hover:bg-gray-600 ${sortField === "sold" ? "bg-gray-600" : ""}`}
                                            onClick={() => handleSortOption("sold", sortField === "sold" && sortDirection === "asc" ? "desc" : "asc")}
                                        >
                                            <div className="flex items-center justify-center">
                                                Sold
                                                {sortField === "sold" && (
                                                    sortDirection === "asc" ? <ArrowUp size={12} className="ml-1" /> : <ArrowDown size={12} className="ml-1" />
                                                )}
                                            </div>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-gray-800 divide-y divide-gray-700">
                                    {isLoading ? (
                                        <tr>
                                            <td colSpan={7} className="px-6 py-6 text-center text-gray-400">
                                                <div className="flex justify-center items-center">
                                                    <Loader2 className="h-6 w-6 animate-spin mr-2" />
                                                    <span className="font-medium">{getLoadingMessage()}</span>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : filteredProducts.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="px-6 py-6 text-center text-gray-400">
                                                <span className="font-medium">No products found</span>
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredProducts.map((product) => (
                                            <tr key={product.product_id} className="hover:bg-gray-700/60 transition-colors">
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
                                                <td className="px-1 py-1 pl-10 text-left whitespace-nowrap text-sm font-medium w-80 text-gray-300">
                                                    {product.product_name}
                                                </td>
                                                <td className="px-1 py-1 text-center whitespace-nowrap text-sm text-gray-300 w-30">
                                                    {formatCurrency(product.product_price)}
                                                </td>
                                                <td className="px-1 py-1 text-center whitespace-nowrap w-28">
                                                    <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusClass(product.status_code)}`}>
                                                        {product.status}
                                                    </span>
                                                </td>
                                                <td className="px-1 py-1 text-center whitespace-nowrap w-30">
                                                    <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getCategoryClass(product.category_id)}`}>
                                                        {product.category_name}
                                                    </span>
                                                </td>
                                                <td className="px-1 py-1 text-center whitespace-nowrap text-sm text-gray-300 w-30">
                                                    {formatNumber(product.sold)}
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
        </StaffLayout>
    );
}