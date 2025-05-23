import { useState, useEffect, useRef } from "react";
import StaffLayout from "@/components/staff/StaffLayout";
import { type BreadcrumbItem } from "@/types";
import { Head } from "@inertiajs/react";
import axios from "axios";
import { 
  Loader2, Plus, ArrowUp, ArrowDown, 
  Search, CircleX, Calendar, Save
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import SearchBar from "@/components/ui/search-bar";
import FilterButton from "@/components/ui/filter-button";
import SortButton from "@/components/ui/sort-button";
import DateRangePicker from "@/components/ui/date-range-picker";
import toast, { Toaster } from "react-hot-toast";
import FullScreenPrompt from "@/components/staff/FullScreenPrompt";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { format, isSameDay, isWithinInterval, parseISO } from "date-fns";

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: "Expenses",
        href: "/staff/expenses",
    },
];

// Format date range to "Jan 02, 2025 - Jan 20, 2025" format
const formatDateRange = (start: Date, end: Date): string => {
    return `${format(start, 'MMM dd, yyyy')} - ${format(end, 'MMM dd, yyyy')}`;
};

// TypeScript interfaces
interface Expense {
    id: number;
    date: string;  // YYYY-MM-DD format
    formatted_date: string; // Formatted date string
    user_id: number;
    username: string;
    title: string;
    description: string | null;
    amount: string; // Formatted amount with decimal places
    raw_amount: number; // Raw numeric amount
    created_at: string;
}

interface PageProps {
    today: string;
    current_user_id: number;
    flash?: {
        success?: string;
        error?: string;
    };
}

export default function StaffExpenses({ today, current_user_id, flash }: PageProps) {
    // State management
    const [allExpenses, setAllExpenses] = useState<Expense[]>([]);
    const [filteredExpenses, setFilteredExpenses] = useState<Expense[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [isSaving, setIsSaving] = useState<boolean>(false);
    const [sortField, setSortField] = useState<string>("date");
    const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
    const [searchTerm, setSearchTerm] = useState<string>("");
    const [activeFilter, setActiveFilter] = useState<string>("all");
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [isFullScreen, setIsFullScreen] = useState<boolean>(false);
    
    // Date range state
    const [startDate, setStartDate] = useState<Date>(new Date());
    const [endDate, setEndDate] = useState<Date>(new Date());
    const [isDateRangeActive, setIsDateRangeActive] = useState<boolean>(true);
    const [formattedDateRange, setFormattedDateRange] = useState<string>(
        formatDateRange(new Date(), new Date())
    );
    
    // Form data state
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        amount: "",
        date: new Date()
    });
    
    // Refs
    const tableRef = useRef<HTMLDivElement>(null);

    // Lazy loading state
    const [page, setPage] = useState<number>(1);
    const [hasMore, setHasMore] = useState<boolean>(true);
    const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
    const [totalExpenses, setTotalExpenses] = useState<number>(0);
    const itemsPerPage = 25; // Number of items to load per page
    const [allExpensesLoaded, setAllExpensesLoaded] = useState<boolean>(false);
    const [latestBatch, setLatestBatch] = useState<number>(0);
    
    // Set up loading trigger rows - specifically for the 20th item of each batch
    const loadTriggerRefs = useRef<{[key: string]: HTMLTableRowElement | null}>({});

    // Display toast messages from flash
    useEffect(() => {
        if (flash?.success) {
            toast.success(flash.success);
        }
        if (flash?.error) {
            toast.error(flash.error);
        }
    }, [flash]);

    // Initialize with today's date by default
    useEffect(() => {
        // Set default to today's date for both start and end
        const todayDate = new Date(today);
        setStartDate(todayDate);
        setEndDate(todayDate);
        setFormattedDateRange(formatDateRange(todayDate, todayDate));
        
        // Fetch first batch of expenses
        fetchExpensesBatch(1, todayDate, todayDate);
    }, []);

    // Set up intersection observer to monitor the 20th item of the latest batch
    useEffect(() => {
        const observer = new IntersectionObserver(
            entries => {
                // Only consider triggers from the latest batch
                const latestBatchTrigger = loadTriggerRefs.current[`trigger-${latestBatch}`];
                if (entries.some(entry => entry.target === latestBatchTrigger && entry.isIntersecting) && 
                    hasMore && !isLoading && !isLoadingMore) {
                    loadMoreExpenses();
                }
            },
            { threshold: 0.1 }
        );
        
        // Only observe the trigger for the latest batch
        const latestTrigger = loadTriggerRefs.current[`trigger-${latestBatch}`];
        if (latestTrigger) {
            observer.observe(latestTrigger);
        }
        
        return () => {
            // Clean up by unobserving all elements
            Object.values(loadTriggerRefs.current).forEach(element => {
                if (element) observer.unobserve(element);
            });
        };
    }, [hasMore, isLoading, isLoadingMore, latestBatch, filteredExpenses]);

    // Update filtered data when search, sort or filter changes
    useEffect(() => {
        applyFilters();
    }, [sortField, sortDirection, searchTerm, activeFilter, allExpenses]);

    const fetchExpensesBatch = async (pageNum: number = 1, start?: Date, end?: Date) => {
        if (pageNum === 1) setIsLoading(true);
        else setIsLoadingMore(true);
        
        // Use the parameters or fall back to state values
        const startDateToUse = start || startDate;
        const endDateToUse = end || endDate;
        
        try {
            const response = await axios.get("/staff/expenses/data", {
                params: {
                    page: pageNum,
                    limit: itemsPerPage,
                    start_date: startDateToUse.toISOString().split('T')[0],
                    end_date: endDateToUse.toISOString().split('T')[0]
                }
            });
            
            const newExpenses = response.data.data || [];
            
            // Use server-provided metadata to determine if there are more expenses
            const hasMoreData = response.data.meta?.has_more ?? false;
            setHasMore(hasMoreData);
            
            if (response.data.meta?.total) {
                setTotalExpenses(response.data.meta.total);
            }
            
            if (!hasMoreData) {
                setAllExpensesLoaded(true);
            }
            
            // Update the latest batch number
            setLatestBatch(pageNum - 1);
            
            // Add new expenses to existing ones
            setAllExpenses(prevExpenses => {
                if (pageNum === 1) {
                    return newExpenses;
                } else {
                    return [...prevExpenses, ...newExpenses];
                }
            });
            
        } catch (error) {
            toast.error("Failed to load expense data");
        } finally {
            if (pageNum === 1) setIsLoading(false);
            else setIsLoadingMore(false);
        }
    };
    
    const loadMoreExpenses = () => {
        if (hasMore && !isLoadingMore && !isLoading) {
            const nextPage = page + 1;
            setPage(nextPage);
            fetchExpensesBatch(nextPage);
        }
    };

    const applyFilters = () => {
        let filtered = [...allExpenses];
        
        // Apply user filter first
        if (activeFilter === "mine") {
            filtered = filtered.filter(expense => expense.user_id === current_user_id);
        }
        
        // Apply search term if present
        if (searchTerm.trim() !== "") {
            const query = searchTerm.toLowerCase();
            filtered = filtered.filter(
                (expense) =>
                    expense.title.toLowerCase().includes(query) ||
                    (expense.description && expense.description.toLowerCase().includes(query)) ||
                    expense.username.toLowerCase().includes(query)
            );
        }

        // Apply sorting
        filtered = sortExpenses(filtered);
        
        setFilteredExpenses(filtered);
    };

    const sortExpenses = (expensesToSort: Expense[]) => {
        return [...expensesToSort].sort((a, b) => {
            let comparison = 0;
            
            switch (sortField) {
                case "id":
                    comparison = a.id - b.id;
                    break;
                case "date":
                    comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
                    break;
                case "username":
                    comparison = a.username.localeCompare(b.username);
                    break;
                case "title":
                    comparison = a.title.localeCompare(b.title);
                    break;
                case "amount":
                    comparison = a.raw_amount - b.raw_amount;
                    break;
                default:
                    comparison = a.id - b.id;
            }
            
            return sortDirection === "asc" ? comparison : -comparison;
        });
    };

    // Handle sorting
    const handleSortOption = (field: string, direction: "asc" | "desc") => {
        setSortField(field);
        setSortDirection(direction);
    };

    const handleSearchResults = (results: any[]) => {
        setSearchTerm(results.length > 0 ? searchTerm : "");
    };

    const handleSearchTermChange = (term: string) => {
        setSearchTerm(term);
    };

    // Date range handler
    const handleDateRangeChange = (newStartDate: Date, newEndDate: Date) => {
        setStartDate(newStartDate);
        setEndDate(newEndDate);
        setFormattedDateRange(formatDateRange(newStartDate, newEndDate));
        setIsDateRangeActive(true);
        
        // Reset pagination and load new data with the date range
        setPage(1);
        setHasMore(true);
        setAllExpensesLoaded(false);
        setAllExpenses([]);
        setFilteredExpenses([]);
        
        // Clear refs for trigger rows
        loadTriggerRefs.current = {};
        
        // Fetch expenses with the new date range
        fetchExpensesBatch(1, newStartDate, newEndDate);
    };
    
    const openAddModal = () => {
        setFormData({
            title: "",
            description: "",
            amount: "",
            date: new Date() // Always set to current date
        });
        setIsModalOpen(true);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleDatePickerChange = (date: Date | null) => {
        if (date) {
            setFormData(prev => ({ ...prev, date }));
        }
    };

    // Form submission handler
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        
        try {
            // Format amount to ensure it's a valid number
            const formattedAmount = parseFloat(formData.amount).toFixed(2);
            
            // Get CSRF token from meta tag
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
            
            const response = await axios.post('/staff/expenses', {
                title: formData.title,
                description: formData.description,
                amount: formattedAmount,
                date: formData.date.toISOString().split('T')[0] // This still sends 'date' to match controller validation
            }, {
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': csrfToken || '',
                }
            });
            
            if (response.data.success) {
                toast.success("Expense added successfully!");
                
                // Fetch updated expenses or add the new one to the state
                setPage(1);
                fetchExpensesBatch(1, startDate, endDate);
                
                // Close modal and reset form
                setIsModalOpen(false);
                setFormData({
                    title: "",
                    description: "",
                    amount: "",
                    date: new Date()
                });
            } else {
                toast.error(response.data.message || "Failed to add expense");
            }
        } catch (error) {
            toast.error("Failed to save expense. Please try again.");
        } finally {
            setIsSaving(false);
        }
    };

    // Simplified filter options - only user filtering
    const getFilterOptions = () => [
        { id: "all", name: "All Expenses" },
        { id: "mine", name: "My Expenses" },
    ];

    return (
        <StaffLayout breadcrumbs={breadcrumbs}>
            <Head title="Expenses" />
            <Toaster />
            
            <FullScreenPrompt onFullScreenChange={setIsFullScreen} />
            
            <div className="flex flex-col bg-gray-900 h-[calc(100vh-41px)] overflow-hidden">
                {/* Search, Filter, and Add Controls */}
                <div className="p-2 w-full">
                    <div className="flex items-center mb-2 justify-between">
                        <div className="flex items-center gap-1.5 bg-transparent w-5/9 rounded-lg">
                            <SearchBar
                                placeholder="Search Expenses"
                                items={allExpenses}
                                searchField={["title", "description", "username"]} 
                                onSearchResults={handleSearchResults}
                                onSearchTermChange={handleSearchTermChange}
                                className="input w-full bg-gray-600 p-1 pl-3 text-white rounded-lg focus:outline-none focus:ring-1 focus:ring-inset focus:ring-white-400"
                            />
                            
                            <FilterButton
                                options={getFilterOptions()}
                                activeFilter={activeFilter}
                                onSelectFilter={(filterId) => setActiveFilter(filterId as string)}
                                includeAvailable={false}
                                includeAll={false}
                                allOptionText="All Expenses"
                            />
                            
                            <SortButton
                                options={[
                                    { field: "id", label: "ID", type: "numeric" },
                                    { field: "date", label: "Date", type: "date" },
                                    { field: "username", label: "User", type: "text" },
                                    { field: "title", label: "Title", type: "text" },
                                    { field: "amount", label: "Amount", type: "numeric" }
                                ]}
                                currentField={sortField}
                                currentDirection={sortDirection}
                                onSort={handleSortOption}
                            />
                        </div>
                        <div className="flex items-center justify-between w-4/9 pl-1.5 z-20">
                            <DateRangePicker
                                startDate={startDate}
                                endDate={endDate}
                                onChange={handleDateRangeChange}
                                formatDisplay={formatDateRange}
                                displayFormat="MMM dd, yyyy"
                            />
                            <Button
                                onClick={openAddModal}
                                className="bg-gray-500 rounded-lg flex items-center justify-center h-8 ml-auto"
                                style={{ aspectRatio: '1/1', padding: '0' }}
                            >
                                <Plus size={18} />
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Table Container */}
                <div 
                    className="flex-1 p-2 pt-0 relative"
                    style={{ 
                        height: 'calc(100vh - 104px)',
                        minHeight: '500px'
                    }}
                >
                    <div className="relative overflow-x-auto bg-gray-900 rounded-lg shadow">
                        {/* Table with sticky header */}
                        <div 
                            ref={tableRef}
                            className="overflow-x-auto overflow-y-auto"
                            style={{ maxHeight: 'calc(100vh - 104px)' }}
                        >
                            <table className="min-w-full divide-y divide-gray-700 border-collapse">
                                <thead className="bg-gray-700 sticky top-0 z-10">
                                    <tr>
                                        <th 
                                            className={`px-2 py-2.5 text-center text-xs font-semibold text-white uppercase tracking-wider bg-gray-700 cursor-pointer hover:bg-gray-600 ${sortField === "id" ? "bg-gray-600" : ""}`}
                                            onClick={() => handleSortOption("id", sortField === "id" && sortDirection === "asc" ? "desc" : "asc")}
                                        >
                                            <div className="flex items-center justify-center">
                                                ID
                                                {sortField === "id" && (
                                                    sortDirection === "asc" ? <ArrowUp size={12} className="ml-1" /> : <ArrowDown size={12} className="ml-1" />
                                                )}
                                            </div>
                                        </th>
                                        <th 
                                            className={`px-2 py-2.5 text-center text-xs font-semibold text-white uppercase tracking-wider bg-gray-700 cursor-pointer hover:bg-gray-600 ${sortField === "date" ? "bg-gray-600" : ""}`}
                                            onClick={() => handleSortOption("date", sortField === "date" && sortDirection === "asc" ? "desc" : "asc")}
                                        >
                                            <div className="flex items-center justify-center">
                                                Date
                                                {sortField === "date" && (
                                                    sortDirection === "asc" ? <ArrowUp size={12} className="ml-1" /> : <ArrowDown size={12} className="ml-1" />
                                                )}
                                            </div>
                                        </th>
                                        <th 
                                            className={`px-2 py-2.5 text-center text-xs font-semibold text-white uppercase tracking-wider bg-gray-700 cursor-pointer hover:bg-gray-600 ${sortField === "username" ? "bg-gray-600" : ""}`}
                                            onClick={() => handleSortOption("username", sortField === "username" && sortDirection === "asc" ? "desc" : "asc")}
                                        >
                                            <div className="flex items-center justify-center">
                                                User
                                                {sortField === "username" && (
                                                    sortDirection === "asc" ? <ArrowUp size={12} className="ml-1" /> : <ArrowDown size={12} className="ml-1" />
                                                )}
                                            </div>
                                        </th>
                                        <th 
                                            className={`px-2 py-2.5 text-center text-xs font-semibold text-white uppercase tracking-wider bg-gray-700 cursor-pointer hover:bg-gray-600 ${sortField === "title" ? "bg-gray-600" : ""}`}
                                            onClick={() => handleSortOption("title", sortField === "title" && sortDirection === "asc" ? "desc" : "asc")}
                                        >
                                            <div className="flex items-center justify-center">
                                                Title
                                                {sortField === "title" && (
                                                    sortDirection === "asc" ? <ArrowUp size={12} className="ml-1" /> : <ArrowDown size={12} className="ml-1" />
                                                )}
                                            </div>
                                        </th>
                                        <th className="px-2 py-2.5 text-center text-xs font-semibold text-white uppercase tracking-wider bg-gray-700">
                                            Description
                                        </th>
                                        <th 
                                            className={`px-2 py-2.5 text-center text-xs font-semibold text-white uppercase tracking-wider bg-gray-700 cursor-pointer hover:bg-gray-600 ${sortField === "amount" ? "bg-gray-600" : ""}`}
                                            onClick={() => handleSortOption("amount", sortField === "amount" && sortDirection === "asc" ? "desc" : "asc")}
                                        >
                                            <div className="flex items-center justify-center">
                                                Amount
                                                {sortField === "amount" && (
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
                                                    <span className="font-medium">Loading expenses...</span>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : filteredExpenses.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="px-6 py-6 text-center text-gray-400">
                                                <span className="font-medium">No expenses found</span>
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredExpenses.map((expense, index) => {
                                            // Calculate if this is the 20th row (index 19) of any batch
                                            const batchIndex = Math.floor(index / itemsPerPage);
                                            const indexInBatch = index % itemsPerPage;
                                            const isTriggerRow = indexInBatch === 19; // 20th item (0-indexed)
                                            const triggerRowKey = `trigger-${batchIndex}`;
                                            
                                            return (
                                                <tr 
                                                    key={expense.id} 
                                                    className="hover:bg-gray-700/60 transition-colors"
                                                    ref={isTriggerRow ? (el) => {
                                                        loadTriggerRefs.current[triggerRowKey] = el;
                                                    } : undefined}
                                                >
                                                    <td className="px-2 py-2 text-center whitespace-nowrap text-sm text-gray-300">
                                                        {expense.id}
                                                    </td>
                                                    <td className="px-2 py-2 text-center whitespace-nowrap text-sm text-gray-300">
                                                        {expense.formatted_date}
                                                    </td>
                                                    <td className="px-2 py-2 text-center whitespace-nowrap text-sm text-gray-300">
                                                        {expense.username}
                                                    </td>
                                                    <td className="px-2 py-2 text-left whitespace-nowrap text-sm font-medium text-gray-300">
                                                        {expense.title}
                                                    </td>
                                                    <td className="px-2 py-2 text-left whitespace-nowrap text-sm text-gray-300">
                                                        <div className=" max-w-sm">
                                                            {expense.description || "-"}
                                                        </div>
                                                    </td>
                                                    <td className="px-2 py-2 text-center whitespace-nowrap text-sm font-medium text-red-300">
                                                        ₱ {expense.amount}
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                    
                                    {/* Loading indicator */}
                                    {!isLoading && isLoadingMore && (
                                        <tr>
                                            <td colSpan={7} className="py-4 text-center text-gray-400 bg-gray-800/50">
                                                <div className="flex justify-center items-center">
                                                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
            
            {/* Add Expense Modal */}
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
                            className="absolute top-2 right-2 text-white z-1"
                        >
                            <CircleX size={20} />
                        </button>
                        <div className="relative mb-4">
                            <h2 className="text-xl font-bold text-white text-center">
                                Add New Expense
                            </h2>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <Label htmlFor="title" className="text-gray-200">Title</Label>
                                <Input
                                    id="title"
                                    name="title"
                                    type="text"
                                    value={formData.title}
                                    onChange={handleInputChange}
                                    required
                                    className="mt-1 w-full bg-gray-700 border-gray-600 text-white"
                                />
                            </div>

                            <div>
                                <Label htmlFor="description" className="text-gray-200">Description</Label>
                                <textarea
                                    id="description"
                                    name="description"
                                    value={formData.description}
                                    onChange={handleInputChange}
                                    rows={5}
                                    className="mt-1 block w-full rounded-md border border-gray-600 
                                            bg-gray-700 text-white px-3 py-2 shadow-sm 
                                            focus:outline-none focus:ring focus:ring-blue-500
                                            resize-none overflow-y-auto"
                                />
                            </div>

                            <div>
                                <Label htmlFor="amount" className="text-gray-200">Amount (₱)</Label>
                                <Input
                                    id="amount"
                                    name="amount"
                                    type="number"
                                    step="0.01"
                                    value={formData.amount}
                                    onChange={handleInputChange}
                                    required
                                    min="0"
                                    className="mt-1 w-full bg-gray-700 border-gray-600 text-white"
                                />
                            </div>
                            
                            {/* Date picker removed - automatically using today's date */}

                            <div className="flex gap-2 justify-end pt-4 border-t border-gray-700">
                                <Button 
                                    type="submit" 
                                    className="bg-blue-600 text-white hover:bg-blue-700"
                                    disabled={isSaving}
                                >
                                    {isSaving ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Saving...
                                        </>
                                    ) : (
                                        'Save Expense'
                                    )}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </StaffLayout>
    );
}
