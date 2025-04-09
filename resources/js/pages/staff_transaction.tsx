import { useState, useEffect, useRef } from "react";
import StaffLayout from "@/components/staff/StaffLayout";
import { type BreadcrumbItem } from "@/types";
import { Head } from "@inertiajs/react";
import axios from "axios";
import { 
  Loader2, ArrowUp, ArrowDown, Search, 
} from "lucide-react";
import SearchBar from "@/components/ui/search-bar";
import FilterButton from "@/components/ui/filter-button";
import SortButton from "@/components/ui/sort-button";
import toast, { Toaster } from "react-hot-toast";
import FullScreenPrompt from "@/components/staff/FullScreenPrompt";

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: "Transactions",
        href: "/staff/transactions",
    },
];

interface Product {
    product_id: number;
    product_name: string;
    product_price: number;
    product_image: string | null;
    order_quantity: number;
    amount: number;
}

interface Transaction {
    order_id: number;
    order_subtotal: number;
    order_tax: number;
    order_discount: number;
    order_total: number;
    order_payment: number;
    order_change: number;
    order_payment_method: string;
    created_at: string;
    products: Product[];
}

export default function TransactionPOS() {
    // State management
    const [transactions, setTransactions] = useState<Transaction[]>([]); // Original transactions
    const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]); // Filtered transactions
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [sortField, setSortField] = useState<string>("created_at");
    const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
    const [searchTerm, setSearchTerm] = useState<string>("");
    const [activeFilter, setActiveFilter] = useState<string>("all");
    const tableRef = useRef<HTMLDivElement>(null);
    const [isFullScreen, setIsFullScreen] = useState(false);

    // Format number utility function
    const formatNumber = (value: number | null | undefined): string => {
        // Ensure we're working with a valid number
        const numValue = Number(value || 0);
        return Number.isInteger(numValue) ? numValue.toString() : numValue.toFixed(2).replace(/\.?0+$/, '');
    };
    
    // Format currency utility function
    const formatCurrency = (value: number | null | undefined): string => {
        return `₱ ${formatNumber(value)}`;
    };
    
    // Initialize transaction data
    useEffect(() => {
        fetchTransactions();
    }, []);

    // Apply filters, search and sort
    useEffect(() => {
        applyFilters();
    }, [sortField, sortDirection, searchTerm, activeFilter, transactions]);

    const fetchTransactions = async () => {
        setIsLoading(true);
        try {
            const response = await axios.get("/staff/transactions/data");
            setTransactions(response.data);
            setFilteredTransactions(response.data);
        } catch (error) {
            console.error("Error fetching transactions:", error);
            toast.error("Failed to load transaction data");
        } finally {
            setIsLoading(false);
        }
    };

    const applyFilters = () => {
        let filtered = [...transactions];

        // Apply search filter
        if (searchTerm.trim() !== "") {
            const query = searchTerm.toLowerCase();
            filtered = filtered.filter(
                (item) =>
                    item.order_id.toString().includes(query) ||
                    item.order_payment_method.toLowerCase().includes(query) ||
                    // Search in products
                    item.products.some(product => 
                        product.product_name.toLowerCase().includes(query)
                    )
            );
        }

        // Apply payment method filter
        if (activeFilter !== "all") {
            filtered = filtered.filter(item => item.order_payment_method.toLowerCase() === activeFilter.toLowerCase());
        }

        // Apply sorting
        filtered = sortTransactions(filtered);

        setFilteredTransactions(filtered);
    };

    const sortTransactions = (transactionsToSort: Transaction[]) => {
        return [...transactionsToSort].sort((a, b) => {
            let valueA, valueB;
            
            switch (sortField) {
                case "order_id":
                    valueA = a.order_id;
                    valueB = b.order_id;
                    break;
                case "order_total":
                    valueA = a.order_total;
                    valueB = b.order_total;
                    break;
                case "order_payment":
                    valueA = a.order_payment;
                    valueB = b.order_payment;
                    break;
                case "created_at":
                default:
                    valueA = new Date(a.created_at).getTime();
                    valueB = new Date(b.created_at).getTime();
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
        const filtered = results as Transaction[];
        
        // Apply active filter on search results
        let finalResults = filtered;
        if (activeFilter !== "all") {
            finalResults = filtered.filter(item => item.order_payment_method.toLowerCase() === activeFilter.toLowerCase());
        }
        
        // Apply sorting
        const sortedResults = sortTransactions(finalResults);
        setFilteredTransactions(sortedResults);
    };

    const handleSearchTermChange = (term: string) => {
        setSearchTerm(term);
    };

    const handleFilterChange = (filterId: string | number) => {
        setActiveFilter(filterId as string);
    };

    const filterOptions = [
        { id: "all", name: "All Methods" },
        { id: "cash", name: "Cash" },
        { id: "gcash", name: "GCash" },
        { id: "foodpanda", name: "FoodPanda" },
        { id: "grabfood", name: "GrabFood" },
    ];

    return (
        <StaffLayout breadcrumbs={breadcrumbs}>
            <Head title="Transactions" />
            <Toaster />
            
            <FullScreenPrompt onFullScreenChange={setIsFullScreen} />
            
            <div className="flex flex-col bg-gray-900 h-[calc(100vh-41px)] overflow-hidden">
                {/* Search, Filter, Sort Controls */}
                <div className="p-2 w-full">
                    <div className="flex items-center mb-2 justify-between">
                        <div className="flex items-center gap-1.5 bg-transparent w-5/9 rounded-lg">
                            <SearchBar
                                placeholder="Search Transactions"
                                items={transactions}
                                searchField={["order_id", "order_payment_method", "products.product_name"]}
                                onSearchResults={handleSearchResults}
                                onSearchTermChange={handleSearchTermChange}
                                className="input w-full bg-gray-600 p-1 pl-3 text-white rounded-lg focus:outline-none focus:ring-1 focus:ring-inset focus:ring-white-400"
                            />
                            
                            <FilterButton
                                options={filterOptions}
                                activeFilter={activeFilter}
                                onSelectFilter={handleFilterChange}
                                includeAvailable={false}
                            />
                            
                            <SortButton
                                options={[
                                    { field: "created_at", label: "Date", type: "date" },
                                    { field: "order_id", label: "Order ID", type: "numeric" },
                                    { field: "order_total", label: "Total", type: "numeric" },
                                ]}
                                currentField={sortField}
                                currentDirection={sortDirection}
                                onSort={handleSortOption}
                            />
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div 
                    className="flex-1 p-2 pt-0 relative"
                    style={{ 
                        height: 'calc(100vh - 150px)',
                        minHeight: '500px'
                    }}
                >
                    <div className="relative overflow-x-auto bg-gray-900 rounded-lg shadow">
                        {/* Table Header */}
                        <div className="sticky top-0 bg-gray-900 shadow-md">
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-700 border-collapse">
                                    <thead className="bg-gray-700">
                                        <tr>
                                            <th 
                                                className={`px-2 py-2.5 text-center text-xs font-semibold text-white uppercase tracking-wider bg-gray-700 cursor-pointer hover:bg-gray-600 ${sortField === "order_id" ? "bg-gray-600" : ""}`}
                                                onClick={() => handleSortOption("order_id", sortField === "order_id" && sortDirection === "asc" ? "desc" : "asc")}
                                            >
                                                <div className="flex items-center justify-center">
                                                    Order ID
                                                    {sortField === "order_id" && (
                                                        sortDirection === "asc" ? <ArrowUp size={12} className="ml-1" /> : <ArrowDown size={12} className="ml-1" />
                                                    )}
                                                </div>
                                            </th>
                                            <th className="px-2 py-2.5 text-center text-xs font-semibold text-white uppercase tracking-wider bg-gray-700">
                                                Image
                                            </th>
                                            <th className="px-2 py-2.5 text-center text-xs font-semibold text-white uppercase tracking-wider bg-gray-700">
                                                Product
                                            </th>
                                            <th className="px-2 py-2.5 text-center text-xs font-semibold text-white uppercase tracking-wider bg-gray-700">
                                                Price
                                            </th>
                                            <th className="px-2 py-2.5 text-center text-xs font-semibold text-white uppercase tracking-wider bg-gray-700">
                                                Qty
                                            </th>
                                            <th className="px-2 py-2.5 text-center text-xs font-semibold text-white uppercase tracking-wider bg-gray-700">
                                                Amount
                                            </th>
                                            <th className="px-2 py-2.5 text-center text-xs font-semibold text-white uppercase tracking-wider bg-gray-700">
                                                Subtotal
                                            </th>
                                            <th className="px-2 py-2.5 text-center text-xs font-semibold text-white uppercase tracking-wider bg-gray-700">
                                                Tax
                                            </th>
                                            <th className="px-2 py-2.5 text-center text-xs font-semibold text-white uppercase tracking-wider bg-gray-700">
                                                Discount
                                            </th>
                                            <th 
                                                className={`px-2 py-2.5 text-center text-xs font-semibold text-white uppercase tracking-wider bg-gray-700 cursor-pointer hover:bg-gray-600 ${sortField === "order_total" ? "bg-gray-600" : ""}`}
                                                onClick={() => handleSortOption("order_total", sortField === "order_total" && sortDirection === "asc" ? "desc" : "asc")}
                                            >
                                                <div className="flex items-center justify-center">
                                                    Total
                                                    {sortField === "order_total" && (
                                                        sortDirection === "asc" ? <ArrowUp size={12} className="ml-1" /> : <ArrowDown size={12} className="ml-1" />
                                                    )}
                                                </div>
                                            </th>
                                            <th className="px-2 py-2.5 text-center text-xs font-semibold text-white uppercase tracking-wider bg-gray-700">
                                                Payment
                                            </th>
                                            <th className="px-2 py-2.5 text-center text-xs font-semibold text-white uppercase tracking-wider bg-gray-700">
                                                Change
                                            </th>
                                            <th className="px-2 py-2.5 text-center text-xs font-semibold text-white uppercase tracking-wider bg-gray-700">
                                                Method
                                            </th>
                                        </tr>
                                    </thead>
                                </table>
                            </div>
                        </div>
                        
                        {/* Table Body with Scrolling */}
                        <div 
                            ref={tableRef}
                            className="overflow-x-auto overflow-y-auto"
                            style={{ maxHeight: 'calc(100vh - 141px)' }}
                        >
                            <table className="min-w-full divide-y divide-gray-700 border-collapse">
                                <tbody className="bg-gray-800 divide-y divide-gray-700">
                                    {isLoading ? (
                                        <tr>
                                            <td colSpan={13} className="px-6 py-6 text-center text-gray-400">
                                                <div className="flex justify-center items-center">
                                                    <Loader2 className="h-6 w-6 animate-spin mr-2" />
                                                    <span className="font-medium">Loading transaction data...</span>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : filteredTransactions.length === 0 ? (
                                        <tr>
                                            <td colSpan={13} className="px-6 py-6 text-center text-gray-400">
                                                <span className="font-medium">No transactions found</span>
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredTransactions.map((transaction) => {
                                            const rowSpan = transaction.products.length;
                                            
                                            return (
                                                <>
                                                {transaction.products.map((product, productIndex) => (
                                                    <tr key={`${transaction.order_id}-${product.product_id}-${productIndex}`} className="hover:bg-gray-700/60 transition-colors">
                                                        {/* Order ID - Only for the first product in each order */}
                                                        {productIndex === 0 && (
                                                            <td rowSpan={rowSpan} className="px-2 text-center py-1 whitespace-nowrap text-sm font-medium text-gray-300 border-r border-gray-700">
                                                                {transaction.order_id}
                                                            </td>
                                                        )}
                                                        
                                                        {/* Product Image */}
                                                        <td className="px-2 py-1 text-center whitespace-nowrap">
                                                            <div className="flex items-center justify-center">
                                                                {product.product_image ? (
                                                                    <img 
                                                                        src={`/storage/products/${product.product_image}`}
                                                                        alt={product.product_name}
                                                                        className="w-10 h-10 object-cover rounded-md border border-gray-600"
                                                                        onError={(e) => {
                                                                            (e.target as HTMLImageElement).onerror = null;
                                                                            (e.target as HTMLImageElement).src = '/placeholder.png';
                                                                        }}
                                                                    />
                                                                ) : (
                                                                    <div className="w-10 h-10 bg-gray-700 rounded-md flex items-center justify-center text-gray-400 border border-gray-600"></div>
                                                                )}
                                                            </div>
                                                        </td>
                                                        
                                                        {/* Product Name */}
                                                        <td className="px-2 py-1 text-left whitespace-nowrap text-sm font-medium text-gray-300">
                                                            {product.product_name}
                                                        </td>
                                                        
                                                        {/* Product Price */}
                                                        <td className="px-2 py-1 text-center whitespace-nowrap text-sm text-gray-300">
                                                            {formatCurrency(product.product_price)}
                                                        </td>
                                                        
                                                        {/* Order Quantity */}
                                                        <td className="px-2 py-1 text-center whitespace-nowrap text-sm text-gray-300">
                                                            {formatNumber(product.order_quantity)}
                                                        </td>
                                                        
                                                        {/* Amount (Price × Quantity) */}
                                                        <td className="px-2 py-1 text-center whitespace-nowrap text-sm text-gray-300 border-r border-gray-700">
                                                            {formatCurrency(product.amount)}
                                                        </td>
                                                        
                                                        {/* Order details - Only for the first product in each order */}
                                                        {productIndex === 0 && (
                                                            <>
                                                                {/* Subtotal */}
                                                                <td rowSpan={rowSpan} className="px-2 py-1 text-center whitespace-nowrap text-sm text-gray-300">
                                                                    {formatCurrency(transaction.order_subtotal)}
                                                                </td>
                                                                
                                                                {/* Tax */}
                                                                <td rowSpan={rowSpan} className="px-2 py-1 text-center whitespace-nowrap text-sm text-gray-300">
                                                                    {formatCurrency(transaction.order_tax)}
                                                                </td>
                                                                
                                                                {/* Discount */}
                                                                <td rowSpan={rowSpan} className="px-2 py-1 text-center whitespace-nowrap text-sm text-gray-300">
                                                                    {formatCurrency(transaction.order_discount)}
                                                                </td>
                                                                
                                                                {/* Total */}
                                                                <td rowSpan={rowSpan} className="px-2 py-1 text-center whitespace-nowrap text-sm font-medium text-white">
                                                                    {formatCurrency(transaction.order_total)}
                                                                </td>
                                                                
                                                                {/* Payment */}
                                                                <td rowSpan={rowSpan} className="px-2 py-1 text-center whitespace-nowrap text-sm text-gray-300">
                                                                    {formatCurrency(transaction.order_payment)}
                                                                </td>
                                                                
                                                                {/* Change */}
                                                                <td rowSpan={rowSpan} className="px-2 py-1 text-center whitespace-nowrap text-sm text-gray-300">
                                                                    {formatCurrency(transaction.order_change)}
                                                                </td>
                                                                
                                                                {/* Payment Method */}
                                                                <td rowSpan={rowSpan} className="px-2 py-1 text-center whitespace-nowrap text-sm text-gray-300">
                                                                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                                                                        ${transaction.order_payment_method === 'cash' ? 'bg-blue-900 text-blue-200' : 
                                                                        transaction.order_payment_method === 'gcash' ? 'bg-green-900 text-green-200' : 
                                                                        transaction.order_payment_method === 'grabfood' ? 'bg-green-800 text-white' : 
                                                                        transaction.order_payment_method === 'foodpanda' ? 'bg-pink-900 text-pink-200' : 
                                                                        'bg-gray-900 text-gray-200'}`}
                                                                    >
                                                                        {transaction.order_payment_method.toUpperCase()}
                                                                    </span>
                                                                </td>
                                                            </>
                                                        )}
                                                    </tr>
                                                ))}
                                                </>
                                            );
                                        })
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
