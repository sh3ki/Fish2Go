import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import AppLayout from "@/layouts/app-layout";
import { Head } from "@inertiajs/react";
import { Loader2, ArrowUp, ArrowDown, Trash2, Plus, CircleX } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import SearchBar from "@/components/ui/search-bar";
import FilterButton from "@/components/ui/filter-button";
import SortButton from "@/components/ui/sort-button";
import DateRangePicker from "@/components/ui/date-range-picker";
import { confirmAlert } from 'react-confirm-alert';
import { format } from "date-fns";
import { Button } from "@/components/ui/button"; // Import Button component

const formatDateRange = (start: Date, end: Date): string => {
    return `${format(start, 'MMM dd, yyyy')} - ${format(end, 'MMM dd, yyyy')}`;
};

interface Expense {
    id: number;
    date: string;
    formatted_date: string;
    user_id: number;
    username: string;
    title: string;
    description: string | null;
    amount: string;
    raw_amount: number;
    created_at: string;
}

export default function AdminExpenses() {
    // State
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [filteredExpenses, setFilteredExpenses] = useState<Expense[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
    const [hasMore, setHasMore] = useState<boolean>(true);
    const [page, setPage] = useState<number>(1);
    const [totalExpenses, setTotalExpenses] = useState<number>(0);
    const [latestBatch, setLatestBatch] = useState<number>(0);
    const [allExpensesLoaded, setAllExpensesLoaded] = useState<boolean>(false);

    const [searchTerm, setSearchTerm] = useState<string>("");
    const [sortField, setSortField] = useState<string>("date");
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

    // Filter options (admin can filter by user or all)
    const [userOptions, setUserOptions] = useState<{id: string, name: string}[]>([]);
    useEffect(() => {
        // Optionally fetch user list for filter dropdown
        axios.get('/api/expenses/users').then(res => {
            setUserOptions([{id: "all", name: "All Users"}, ...res.data]);
        }).catch(() => {
            setUserOptions([{id: "all", name: "All Users"}]);
        });
    }, []);

    // Initial load
    useEffect(() => {
        const today = new Date();
        setStartDate(today);
        setEndDate(today);
        setFormattedDateRange(formatDateRange(today, today));
        fetchExpensesBatch(1, today, today);
    }, []);

    // Lazy loading intersection observer
    useEffect(() => {
        const observer = new IntersectionObserver(
            entries => {
                const latestBatchTrigger = loadTriggerRefs.current[`trigger-${latestBatch}`];
                if (entries.some(entry => entry.target === latestBatchTrigger && entry.isIntersecting) &&
                    hasMore && !isLoading && !isLoadingMore) {
                    loadMoreExpenses();
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
    }, [hasMore, isLoading, isLoadingMore, latestBatch, filteredExpenses]);

    // Filtering, searching, sorting
    useEffect(() => {
        applyFilters();
    }, [sortField, sortDirection, searchTerm, activeFilter, expenses]);

    const fetchExpensesBatch = async (pageNum: number = 1, start?: Date, end?: Date) => {
        if (pageNum === 1) setIsLoading(true);
        else setIsLoadingMore(true);

        const startDateToUse = start || startDate;
        const endDateToUse = end || endDate;

        try {
            const response = await axios.get(`/api/expenses`, {
                params: {
                    page: pageNum,
                    limit: itemsPerPage,
                    start_date: startDateToUse.toISOString().split('T')[0],
                    end_date: endDateToUse.toISOString().split('T')[0],
                    user_id: activeFilter !== "all" ? activeFilter : undefined
                }
            });
            const newExpenses = response.data.data || [];
            const hasMoreData = response.data.meta?.has_more ?? false;
            setHasMore(hasMoreData);

            if (response.data.meta?.total) {
                setTotalExpenses(response.data.meta.total);
            }
            if (!hasMoreData) {
                setAllExpensesLoaded(true);
            }
            setLatestBatch(pageNum - 1);

            setExpenses(prevExpenses => {
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
        let filtered = [...expenses];
        if (activeFilter !== "all") {
            filtered = filtered.filter(expense => expense.user_id.toString() === activeFilter);
        }
        if (searchTerm.trim() !== "") {
            const query = searchTerm.toLowerCase();
            filtered = filtered.filter(
                (expense) =>
                    expense.title.toLowerCase().includes(query) ||
                    (expense.description && expense.description.toLowerCase().includes(query)) ||
                    expense.username.toLowerCase().includes(query)
            );
        }
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

    const handleSortOption = (field: string, direction: "asc" | "desc") => {
        setSortField(field);
        setSortDirection(direction);
    };

    const handleSearchResults = (results: any[]) => {};
    const handleSearchTermChange = (term: string) => {
        setSearchTerm(term);
    };

    const handleDateRangeChange = (newStartDate: Date, newEndDate: Date) => {
        setStartDate(newStartDate);
        setEndDate(newEndDate);
        setFormattedDateRange(formatDateRange(newStartDate, newEndDate));
        setPage(1);
        setHasMore(true);
        setAllExpensesLoaded(false);
        setExpenses([]);
        setFilteredExpenses([]);
        loadTriggerRefs.current = {};
        fetchExpensesBatch(1, newStartDate, newEndDate);
    };

    const handleFilterChange = (filterId: string | number) => {
        setActiveFilter(filterId as string);
        setPage(1);
        setHasMore(true);
        setAllExpensesLoaded(false);
        setExpenses([]);
        setFilteredExpenses([]);
        loadTriggerRefs.current = {};
        fetchExpensesBatch(1, startDate, endDate);
    };

    const handleDelete = async (expenseId: number) => {
        confirmAlert({
            customUI: ({ onClose }) => (
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl border border-gray-300 dark:border-gray-700 max-w-sm text-center">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                        ⚠️ Confirm Deletion
                    </h2>
                    <p className="text-gray-700 dark:text-gray-300 mb-4">
                        Are you sure you want to delete this expense? This action <b>cannot</b> be undone.
                    </p>
                    <div className="flex justify-center gap-4">
                        <button
                            onClick={async () => {
                                try {
                                    await axios.delete(`/api/expenses/${expenseId}`);
                                    toast.success("Expense deleted successfully!");
                                    setExpenses(prev => prev.filter(exp => exp.id !== expenseId));
                                    setFilteredExpenses(prev => prev.filter(exp => exp.id !== expenseId));
                                } catch (error: any) {
                                    toast.error(
                                        error?.response?.status === 404
                                            ? "❌ Expense not found."
                                            : "❌ Failed to delete expense."
                                    );
                                }
                                onClose();
                            }}
                            className="px-4 py-2 bg-red-600 text-white rounded-md shadow hover:bg-red-700"
                        >
                            Yes, Delete
                        </button>
                        <button
                            onClick={() => onClose()}
                            className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-900 dark:text-white rounded-md shadow hover:bg-gray-400 dark:hover:bg-gray-500"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )
        });
    };

    // Add Expense modal state
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [isSaving, setIsSaving] = useState<boolean>(false);
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        amount: "",
        date: new Date()
    });

    // Add Expense form handlers
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleDatePickerChange = (date: Date | null) => {
        if (date) {
            setFormData(prev => ({ ...prev, date }));
        }
    };

    const handleAddExpense = () => {
        setFormData({
            title: "",
            description: "",
            amount: "",
            date: new Date()
        });
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);

        try {
            const formattedAmount = parseFloat(formData.amount).toFixed(2);
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
            const response = await axios.post('/api/expenses', {
                title: formData.title,
                description: formData.description,
                amount: formattedAmount,
                date: formData.date.toISOString().split('T')[0]
            }, {
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': csrfToken || '',
                }
            });

            if (response.data && (response.data.success || response.data.id)) {
                toast.success("Expense added successfully!");
                setIsModalOpen(false);
                setFormData({
                    title: "",
                    description: "",
                    amount: "",
                    date: new Date()
                });
                // Reload expenses
                setPage(1);
                setHasMore(true);
                setAllExpensesLoaded(false);
                setExpenses([]);
                setFilteredExpenses([]);
                loadTriggerRefs.current = {};
                fetchExpensesBatch(1, startDate, endDate);
            } else {
                toast.error(response.data.message || "Failed to add expense");
            }
        } catch (error) {
            toast.error("Failed to save expense. Please try again.");
        } finally {
            setIsSaving(false);
        }
    };

    // Filter options for users
    const filterOptions = userOptions.length > 0 ? userOptions : [
        { id: "all", name: "All Users" }
    ];

    return (
        <AppLayout breadcrumbs={[{ title: "Expenses", href: "/admin/expenses" }]}>
            <Head title="Expenses" />
            <Toaster />

            <div className="flex flex-col rounded-xl p-2 h-[calc(100vh-64px)] overflow-hidden">
                {/* Header with Search & Filter */}
                <div className="p-1 pl-5 pb-2 pr-2 w-full">
                    <div className="flex items-center gap-1.5 mb-2 bg-transparent rounded-lg justify-between">
                        <div className="flex items-center gap-1.5 w-5/9">
                            <SearchBar
                                placeholder="Search Expenses"
                                items={expenses}
                                searchField={["title", "description", "username"]}
                                onSearchResults={handleSearchResults}
                                onSearchTermChange={handleSearchTermChange}
                                className="input w-full bg-gray-700 p-1.5 pl-3 text-sm text-white rounded-lg focus:outline-none focus:ring-1 focus:ring-inset focus:ring-white-400"
                            />
                            <FilterButton
                                options={filterOptions}
                                activeFilter={activeFilter}
                                onSelectFilter={handleFilterChange}
                                includeAvailable={false}
                                allOptionText="All Users"
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
                        <div className="flex items-center gap-2 justify-end">
                            <DateRangePicker
                                startDate={startDate}
                                endDate={endDate}
                                onChange={handleDateRangeChange}
                                formatDisplay={formatDateRange}
                                displayFormat="MMM dd, yyyy"
                            />
                            <Button
                                onClick={handleAddExpense}
                                className="bg-gray-500 rounded-lg flex items-center justify-center h-8"
                                style={{ aspectRatio: '1/1', padding: '0' }}
                            >
                                <Plus size={18} />
                            </Button>
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
                                            className={`w-16 px-2 py-2.5 text-center text-xs font-semibold text-white uppercase tracking-wider bg-gray-700 cursor-pointer hover:bg-gray-600 ${sortField === "id" ? "bg-gray-600" : ""}`}
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
                                            className={`w-32 px-2 py-2.5 text-center text-xs font-semibold text-white uppercase tracking-wider bg-gray-700 cursor-pointer hover:bg-gray-600 ${sortField === "date" ? "bg-gray-600" : ""}`}
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
                                            className={`w-32 px-2 py-2.5 text-center text-xs font-semibold text-white uppercase tracking-wider bg-gray-700 cursor-pointer hover:bg-gray-600 ${sortField === "username" ? "bg-gray-600" : ""}`}
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
                                            className={`w-40 px-2 py-2.5 text-center text-xs font-semibold text-white uppercase tracking-wider bg-gray-700 cursor-pointer hover:bg-gray-600 ${sortField === "title" ? "bg-gray-600" : ""}`}
                                            onClick={() => handleSortOption("title", sortField === "title" && sortDirection === "asc" ? "desc" : "asc")}
                                        >
                                            <div className="flex items-center justify-center">
                                                Title
                                                {sortField === "title" && (
                                                    sortDirection === "asc" ? <ArrowUp size={12} className="ml-1" /> : <ArrowDown size={12} className="ml-1" />
                                                )}
                                            </div>
                                        </th>
                                        <th className="w-64 px-2 py-2.5 text-center text-xs font-semibold text-white uppercase tracking-wider bg-gray-700">
                                            Description
                                        </th>
                                        <th
                                            className={`w-28 px-2 py-2.5 text-center text-xs font-semibold text-white uppercase tracking-wider bg-gray-700 cursor-pointer hover:bg-gray-600 ${sortField === "amount" ? "bg-gray-600" : ""}`}
                                            onClick={() => handleSortOption("amount", sortField === "amount" && sortDirection === "asc" ? "desc" : "asc")}
                                        >
                                            <div className="flex items-center justify-center">
                                                Amount
                                                {sortField === "amount" && (
                                                    sortDirection === "asc" ? <ArrowUp size={12} className="ml-1" /> : <ArrowDown size={12} className="ml-1" />
                                                )}
                                            </div>
                                        </th>
                                        <th className="w-20 px-2 py-2.5 text-center text-xs font-semibold text-white uppercase tracking-wider bg-gray-700">
                                            Action
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
                                            const batchIndex = Math.floor(index / itemsPerPage);
                                            const indexInBatch = index % itemsPerPage;
                                            const isTriggerRow = indexInBatch === itemsPerPage - 1;
                                            const triggerRowKey = `trigger-${batchIndex}`;
                                            return (
                                                <tr
                                                    key={expense.id}
                                                    className="hover:bg-gray-700/60 transition-colors"
                                                    ref={isTriggerRow ? (el) => {
                                                        loadTriggerRefs.current[triggerRowKey] = el;
                                                    } : undefined}
                                                >
                                                    <td className="w-16 px-2 py-2 text-center whitespace-nowrap text-sm text-gray-300">
                                                        {expense.id}
                                                    </td>
                                                    <td className="w-32 px-2 py-2 text-center whitespace-nowrap text-sm text-gray-300">
                                                        {expense.formatted_date}
                                                    </td>
                                                    <td className="w-32 px-2 py-2 text-center whitespace-nowrap text-sm text-gray-300">
                                                        {expense.username}
                                                    </td>
                                                    <td className="w-40 px-2 py-2 text-left whitespace-nowrap text-sm font-medium text-gray-300">
                                                        {expense.title}
                                                    </td>
                                                    <td className="w-64 px-2 py-2 text-left whitespace-nowrap text-sm text-gray-300">
                                                        <div className="max-w-sm">
                                                            {expense.description || "-"}
                                                        </div>
                                                    </td>
                                                    <td className="w-28 px-2 py-2 text-center whitespace-nowrap text-sm font-medium text-red-300">
                                                        ₱ {expense.amount}
                                                    </td>
                                                    <td className="w-20 px-2 py-2 text-center whitespace-nowrap">
                                                        <button
                                                            onClick={() => handleDelete(expense.id)}
                                                            className="inline-flex items-center justify-center p-2 rounded-full bg-red-500/20 hover:bg-red-500/30 text-red-400 hover:text-red-300 transition-colors"
                                                        >
                                                            <Trash2 size={15} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
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
                                <label htmlFor="title" className="text-gray-200 block mb-1">Title</label>
                                <input
                                    id="title"
                                    name="title"
                                    type="text"
                                    value={formData.title}
                                    onChange={handleInputChange}
                                    required
                                    className="mt-1 w-full bg-gray-700 border-gray-600 text-white rounded px-3 py-2"
                                />
                            </div>
                            <div>
                                <label htmlFor="description" className="text-gray-200 block mb-1">Description</label>
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
                                <label htmlFor="amount" className="text-gray-200 block mb-1">Amount (₱)</label>
                                <input
                                    id="amount"
                                    name="amount"
                                    type="number"
                                    step="0.01"
                                    value={formData.amount}
                                    onChange={handleInputChange}
                                    required
                                    min="0"
                                    className="mt-1 w-full bg-gray-700 border-gray-600 text-white rounded px-3 py-2"
                                />
                            </div>
                            {/* Date picker removed - always uses today's date */}
                            <div className="flex gap-2 justify-end pt-4 border-t border-gray-700">
                                <button
                                    type="submit"
                                    className="bg-blue-600 text-white hover:bg-blue-700 px-4 py-2 rounded"
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
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}
