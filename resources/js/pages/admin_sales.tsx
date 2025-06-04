import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import AppLayout from "@/layouts/app-layout";
import { Head } from "@inertiajs/react";
import { Loader2, ArrowUp, ArrowDown } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import SearchBar from "@/components/ui/search-bar";
import FilterButton from "@/components/ui/filter-button";
import SortButton from "@/components/ui/sort-button";
import DateRangePicker from "@/components/ui/date-range-picker";
import { format } from "date-fns";

// Format date range to "Jan 02, 2025 - Jan 20, 2025" format
const formatDateRange = (start: Date, end: Date): string => {
    return `${format(start, 'MMM dd, yyyy')} - ${format(end, 'MMM dd, yyyy')}`;
};

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
    products?: Product[];
}

interface Product {
    product_id: number;
    product_name: string;
    product_price: number;
    product_image: string | null;
    order_quantity: number;
    amount: number;
}

export default function AdminSales() {
  // State management
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [page, setPage] = useState<number>(1);
  const [totalTransactions, setTotalTransactions] = useState<number>(0);
  const [latestBatch, setLatestBatch] = useState<number>(0);
  const [allTransactionsLoaded, setAllTransactionsLoaded] = useState<boolean>(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<string>("order_id");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const tableRef = useRef<HTMLDivElement>(null);

  // Date range state
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [formattedDateRange, setFormattedDateRange] = useState<string>(
      formatDateRange(new Date(), new Date())
  );

  const itemsPerPage = 25;
  const loadTriggerRefs = useRef<{[key: string]: HTMLTableRowElement | null}>({});

  const filterOptions = [
      { id: "cash", name: "Cash" },
      { id: "gcash", name: "GCash" },
      { id: "foodpanda", name: "FoodPanda" },
      { id: "grabfood", name: "GrabFood" },
  ];

  // Format number utility function
  const formatNumber = (value: number | null | undefined): string => {
    const numValue = Number(value || 0);
    return Number.isInteger(numValue) ? numValue.toString() : numValue.toFixed(2).replace(/\.?0+$/, '');
  };
  const formatCurrency = (value: number | null | undefined): string => {
    return `₱ ${formatNumber(value)}`;
  };

  // Initial load
  useEffect(() => {
    const today = new Date();
    setStartDate(today);
    setEndDate(today);
    setFormattedDateRange(formatDateRange(today, today));
    fetchOrdersBatch(1, today, today);
  }, []);

  // Lazy loading intersection observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        const latestBatchTrigger = loadTriggerRefs.current[`trigger-${latestBatch}`];
        if (entries.some(entry => entry.target === latestBatchTrigger && entry.isIntersecting) &&
          hasMore && !isLoading && !isLoadingMore) {
          loadMoreOrders();
        }
      },
      { threshold: 0.1 }
    );
    const latestTrigger = loadTriggerRefs.current[`trigger-${latestBatch}`];
    if (latestTrigger) {
      observer.observe(latestTrigger);
    }
    return () => {
      Object.values(loadTriggerRefs.current).forEach(element => {
        if (element) observer.unobserve(element);
      });
    };
  }, [hasMore, isLoading, isLoadingMore, latestBatch, filteredTransactions]);

  // Filtering, searching, sorting
  useEffect(() => {
    applyFilters();
  }, [sortField, sortDirection, searchTerm, activeFilter, transactions]);

  const fetchOrdersBatch = async (pageNum: number = 1, start?: Date, end?: Date) => {
    if (pageNum === 1) setIsLoading(true);
    else setIsLoadingMore(true);

    const startDateToUse = start || startDate;
    const endDateToUse = end || endDate;

    try {
      const response = await axios.get(`/api/orders`, {
        params: {
          page: pageNum,
          limit: itemsPerPage,
          start_date: startDateToUse.toISOString().split('T')[0],
          end_date: endDateToUse.toISOString().split('T')[0]
        }
      });
      const newTransactions = response.data.data || [];
      const hasMoreData = response.data.meta?.has_more ?? false;
      setHasMore(hasMoreData);

      if (response.data.meta?.total) {
        setTotalTransactions(response.data.meta.total);
      }
      if (!hasMoreData) {
        setAllTransactionsLoaded(true);
      }
      setLatestBatch(pageNum - 1);

      setTransactions(prevTransactions => {
        if (pageNum === 1) {
          return newTransactions;
        } else {
          return [...prevTransactions, ...newTransactions];
        }
      });
    } catch (error) {
      console.error("Error fetching orders data!", error);
      toast.error("Failed to load transaction data");
    } finally {
      if (pageNum === 1) setIsLoading(false);
      else setIsLoadingMore(false);
    }
  };

  const loadMoreOrders = () => {
    if (hasMore && !isLoadingMore && !isLoading) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchOrdersBatch(nextPage);
    }
  };

  const applyFilters = () => {
    let filtered = [...transactions];
    if (activeFilter !== "all") {
      filtered = filtered.filter(item =>
        item.order_payment_method.toLowerCase() === activeFilter.toLowerCase()
      );
    }
    if (searchTerm.trim() !== "") {
      const query = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.order_id.toString().includes(query) ||
          item.order_payment_method.toLowerCase().includes(query) ||
          (item.products && item.products.some(product =>
            product.product_name.toLowerCase().includes(query)
          ))
      );
    }
    filtered = sortTransactions(filtered);
    setFilteredTransactions(filtered);
  };

  const handleFilterChange = (filterId: string | number) => {
    setActiveFilter(filterId as string);
  };

  const handleDateRangeChange = (newStartDate: Date, newEndDate: Date) => {
    setStartDate(newStartDate);
    setEndDate(newEndDate);
    setFormattedDateRange(formatDateRange(newStartDate, newEndDate));
    setPage(1);
    setHasMore(true);
    setAllTransactionsLoaded(false);
    setTransactions([]);
    setFilteredTransactions([]);
    loadTriggerRefs.current = {};
    fetchOrdersBatch(1, newStartDate, newEndDate);
  };

  const handleSearchResults = (results: any[]) => {};
  const handleSearchTermChange = (term: string) => {
    setSearchTerm(term);
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

  return (
    <AppLayout breadcrumbs={[{ title: "Sales", href: "/admin/sales" }]}>
      <Head title="Sales" />
      <Toaster />

      {/* Main Container - Fixed to viewport size */}
      <div className="flex flex-col rounded-xl p-2 h-[calc(100vh-64px)] overflow-hidden">
        {/* Header with Search & Filter */}
        <div className="p-1 pl-5 pb-2 pr-2 w-full">
          {/* Search and Category Filter */}
          <div className="flex items-center gap-1.5 mb-2 bg-transparent rounded-lg justify-between">
            <div className="flex items-center gap-1.5 w-5/9">
              <SearchBar
                placeholder="Search Transactions"
                items={transactions}
                searchField={["order_id", "order_payment_method"]}
                onSearchResults={handleSearchResults}
                onSearchTermChange={handleSearchTermChange}
                className="input w-full bg-gray-700 p-1.5 pl-3 text-sm text-white rounded-lg focus:outline-none focus:ring-1 focus:ring-inset focus:ring-white-400"
              />
              
              <FilterButton
                options={filterOptions}
                activeFilter={activeFilter}
                onSelectFilter={handleFilterChange}
                includeAvailable={false}
                allOptionText="All Methods"
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
            
            {/* Date Range Picker - Right Aligned */}
            <div className="flex justify-end">
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

        {/* Table container - Consistent with admin_product */}
        <div
          className="flex-1 p-0 pl-5 pr-2 relative"
          style={{
            height: 'calc(100vh - 150px)',
            minHeight: '500px'
          }}
        >
          <div className="relative overflow-x-auto bg-gray-900 rounded-lg shadow">
            {/* Fixed header table */}
            <div className="sticky top-0 bg-gray-900 shadow-md z-0">
              <table className="min-w-full divide-y divide-gray-700 border-collapse">
                <thead className="bg-gray-700 sticky top-0 z-0">
                  <tr>
                    <th 
                      className={`px-2 py-2.5 text-center text-xs font-semibold text-white uppercase tracking-wider bg-gray-700 cursor-pointer hover:bg-gray-600 ${sortField === "order_id" ? "bg-gray-600" : ""} w-12`}
                      onClick={() => handleSortOption("order_id", sortField === "order_id" && sortDirection === "asc" ? "desc" : "asc")}
                    >
                      <div className="flex items-center justify-center">
                        ID
                        {sortField === "order_id" && (
                          sortDirection === "asc" ? <ArrowUp size={12} className="ml-1" /> : <ArrowDown size={12} className="ml-1" />
                        )}
                      </div>
                    </th>
                    <th className="px-2 py-2.5 text-center text-xs font-semibold text-white uppercase tracking-wider bg-gray-700 w-16">
                      Image
                    </th>
                    <th className="px-6 py-2.5 text-center text-xs font-semibold text-white uppercase tracking-wider bg-gray-700 min-w-[180px] max-w-[320px] w-64">
                      Product
                    </th>
                    <th className="px-2 py-2.5 text-center text-xs font-semibold text-white uppercase tracking-wider bg-gray-700 w-20">
                      Price
                    </th>
                    <th className="px-2 py-2.5 text-center text-xs font-semibold text-white uppercase tracking-wider bg-gray-700 w-12">
                      Qty
                    </th>
                    <th className="px-2 py-2.5 text-center text-xs font-semibold text-white uppercase tracking-wider bg-gray-700 w-24">
                      Amount
                    </th>
                    <th className="px-2 py-2.5 text-center text-xs font-semibold text-white uppercase tracking-wider bg-gray-700 w-24">
                      Subtotal
                    </th>
                    <th className="px-2 py-2.5 text-center text-xs font-semibold text-white uppercase tracking-wider bg-gray-700 w-20">
                      Tax
                    </th>
                    <th className="px-2 py-2.5 text-center text-xs font-semibold text-white uppercase tracking-wider bg-gray-700 w-24">
                      Discount
                    </th>
                    <th 
                      className={`px-2 py-2.5 text-center text-xs font-semibold text-white uppercase tracking-wider bg-gray-700 cursor-pointer hover:bg-gray-600 ${sortField === "order_total" ? "bg-gray-600" : ""} w-24`}
                      onClick={() => handleSortOption("order_total", sortField === "order_total" && sortDirection === "asc" ? "desc" : "asc")}
                    >
                      <div className="flex items-center justify-center">
                        Total
                        {sortField === "order_total" && (
                          sortDirection === "asc" ? <ArrowUp size={12} className="ml-1" /> : <ArrowDown size={12} className="ml-1" />
                        )}
                      </div>
                    </th>
                    <th className="px-2 py-2.5 text-center text-xs font-semibold text-white uppercase tracking-wider bg-gray-700 w-24">
                      Payment
                    </th>
                    <th className="px-2 py-2.5 text-center text-xs font-semibold text-white uppercase tracking-wider bg-gray-700 w-20">
                      Change
                    </th>
                    <th className="px-2 py-2.5 text-center text-xs font-semibold text-white uppercase tracking-wider bg-gray-700 w-28">
                      Method
                    </th>
                    <th 
                      className={`px-2 py-2.5 text-center text-xs font-semibold text-white uppercase tracking-wider bg-gray-700 w-40 cursor-pointer hover:bg-gray-600 ${sortField === "created_at" ? "bg-gray-600" : ""}`}
                      onClick={() => handleSortOption("created_at", sortField === "created_at" && sortDirection === "asc" ? "desc" : "asc")}
                    >
                      <div className="flex items-center justify-center">
                        Date
                        {sortField === "created_at" && (
                          sortDirection === "asc" ? <ArrowUp size={12} className="ml-1" /> : <ArrowDown size={12} className="ml-1" />
                        )}
                      </div>
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
            >
              <table className="min-w-full divide-y divide-gray-700 border-collapse">
                <tbody className="bg-gray-800 divide-y divide-gray-700">
                  {isLoading ? (
                    <tr>
                      <td colSpan={15} className="px-6 py-6 text-center text-gray-400">
                        <div className="flex justify-center items-center">
                          <Loader2 className="h-6 w-6 animate-spin mr-2" />
                          <span className="font-medium">Loading transactions...</span>
                        </div>
                      </td>
                    </tr>
                  ) : filteredTransactions.length === 0 ? (
                    <tr>
                      <td colSpan={15} className="px-6 py-6 text-center text-gray-400">
                        <span className="font-medium">No transactions found</span>
                      </td>
                    </tr>
                  ) : (
                    filteredTransactions.map((transaction, index) => {
                      const rowSpan = transaction.products?.length || 1;
                      const batchIndex = Math.floor(index / itemsPerPage);
                      const indexInBatch = index % itemsPerPage;
                      const isTriggerRow = indexInBatch === itemsPerPage - 1;
                      const triggerRowKey = `trigger-${batchIndex}`;
                      return (
                        <React.Fragment key={transaction.order_id}>
                          {transaction.products && transaction.products.length > 0 ? (
                            transaction.products.map((product, productIndex) => {
                              const shouldAttachRef = productIndex === 0 && isTriggerRow;
                              return (
                                <tr
                                  key={`${transaction.order_id}-${product.product_id}-${productIndex}`}
                                  className="hover:bg-gray-700/60 transition-colors"
                                  ref={shouldAttachRef ? (el) => {
                                    loadTriggerRefs.current[triggerRowKey] = el;
                                  } : undefined}
                                >
                                  {productIndex === 0 && (
                                    <td rowSpan={rowSpan} className="px-1 text-center py-1 whitespace-nowrap text-sm text-gray-300 border-r border-gray-700">
                                      {transaction.order_id}
                                    </td>
                                  )}
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
                                  <td className="px-6 py-1 text-left whitespace-nowrap text-sm text-gray-300 min-w-[180px] max-w-[320px]">
                                    {product.product_name}
                                  </td>
                                  <td className="px-2 py-1 text-center whitespace-nowrap text-sm text-gray-300">
                                    {formatCurrency(product.product_price)}
                                  </td>
                                  <td className="px-2 py-1 text-center whitespace-nowrap text-sm text-gray-300">
                                    {formatNumber(product.order_quantity)}
                                  </td>
                                  <td className="px-2 py-1 text-center whitespace-nowrap text-sm text-gray-300 border-r border-gray-700">
                                    {formatCurrency(product.amount)}
                                  </td>
                                  {productIndex === 0 && (
                                    <>
                                      <td rowSpan={rowSpan} className="px-2 py-1 text-center whitespace-nowrap text-sm text-gray-300">
                                        {formatCurrency(transaction.order_subtotal)}
                                      </td>
                                      <td rowSpan={rowSpan} className="px-2 py-1 text-center whitespace-nowrap text-sm text-gray-300">
                                        {formatCurrency(transaction.order_tax)}
                                      </td>
                                      <td rowSpan={rowSpan} className="px-2 py-1 text-center whitespace-nowrap text-sm text-gray-300">
                                        {formatCurrency(transaction.order_discount)}
                                      </td>
                                      <td rowSpan={rowSpan} className="px-2 py-1 text-center whitespace-nowrap text-sm font-medium text-white">
                                        {formatCurrency(transaction.order_total)}
                                      </td>
                                      <td rowSpan={rowSpan} className="px-2 py-1 text-center whitespace-nowrap text-sm text-gray-300">
                                        {formatCurrency(transaction.order_payment)}
                                      </td>
                                      <td rowSpan={rowSpan} className="px-2 py-1 text-center whitespace-nowrap text-sm text-gray-300">
                                        {formatCurrency(transaction.order_change)}
                                      </td>
                                      <td rowSpan={rowSpan} className="px-2 py-1 text-center whitespace-nowrap text-sm text-gray-300">
                                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                                          ${transaction.order_payment_method === 'cash' ? 'bg-yellow-600 text-yellow-200' : 
                                          transaction.order_payment_method === 'gcash' ? 'bg-blue-600 text-blue-200' : 
                                          transaction.order_payment_method === 'grabfood' ? 'bg-green-600 text-green-200' : 
                                          transaction.order_payment_method === 'foodpanda' ? 'bg-pink-600 text-pink-200' : 
                                          'bg-gray-900 text-gray-200'}`}
                                        >
                                          {transaction.order_payment_method.toUpperCase()}
                                        </span>
                                      </td>
                                      <td rowSpan={rowSpan} className="px-2 py-1 text-center whitespace-nowrap text-sm text-gray-300">
                                        {new Date(transaction.created_at).toLocaleString("en-US", {
                                          year: "numeric",
                                          month: "2-digit",
                                          day: "2-digit",
                                          hour: "2-digit",
                                          minute: "2-digit",
                                          hour12: true,
                                        })}
                                      </td>
                                    </>
                                  )}
                                </tr>
                              );
                            })
                          ) : (
                            <tr key={transaction.order_id} className="hover:bg-gray-700/60 transition-colors">
                              <td className="px-2 py-1 text-center whitespace-nowrap text-sm text-gray-300">
                                {transaction.order_id}
                              </td>
                              <td className="px-2 py-1 text-center whitespace-nowrap text-sm text-gray-300">
                                {/* No image */}
                              </td>
                              <td className="px-2 py-1 text-center whitespace-nowrap text-sm text-gray-300" colSpan={3}>
                                -
                              </td>
                              <td className="px-2 py-1 text-center whitespace-nowrap text-sm text-gray-300">
                                {formatCurrency(transaction.order_subtotal)}
                              </td>
                              <td className="px-2 py-1 text-center whitespace-nowrap text-sm text-gray-300">
                                {formatCurrency(transaction.order_tax)}
                              </td>
                              <td className="px-2 py-1 text-center whitespace-nowrap text-sm text-gray-300">
                                {formatCurrency(transaction.order_discount)}
                              </td>
                              <td className="px-2 py-1 text-center whitespace-nowrap text-sm font-medium text-white">
                                {formatCurrency(transaction.order_total)}
                              </td>
                              <td className="px-2 py-1 text-center whitespace-nowrap text-sm text-gray-300">
                                {formatCurrency(transaction.order_payment)}
                              </td>
                              <td className="px-2 py-1 text-center whitespace-nowrap text-sm text-gray-300">
                                {formatCurrency(transaction.order_change)}
                              </td>
                              <td className="px-2 py-1 text-center whitespace-nowrap text-sm text-gray-300">
                                <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                                  ${transaction.order_payment_method === 'cash' ? 'bg-yellow-600 text-yellow-200' : 
                                  transaction.order_payment_method === 'gcash' ? 'bg-blue-600 text-blue-200' : 
                                  transaction.order_payment_method === 'grabfood' ? 'bg-green-600 text-green-200' : 
                                  transaction.order_payment_method === 'foodpanda' ? 'bg-pink-600 text-pink-200' : 
                                  'bg-gray-900 text-gray-200'}`}
                                >
                                  {transaction.order_payment_method.toUpperCase()}
                                </span>
                              </td>
                              <td className="px-2 py-1 text-center whitespace-nowrap text-sm text-gray-300">
                                {new Date(transaction.created_at).toLocaleString("en-US", {
                                  year: "numeric",
                                  month: "2-digit",
                                  day: "2-digit",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                  hour12: true,
                                })}
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })
                  )}
                </tbody>
              </table>
              {/* Loading indicator at bottom */}
              {!isLoading && filteredTransactions.length > 0 && !allTransactionsLoaded && isLoadingMore && (
                <div className="py-4 text-center text-gray-400">
                  <div className="flex justify-center items-center">
                    <Loader2 className="h-5 w-5 animate-spin" />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
