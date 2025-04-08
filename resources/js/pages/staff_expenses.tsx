import StaffLayout from "@/components/staff/StaffLayout";
import { type BreadcrumbItem } from "@/types";
import { Head, useForm, usePage } from "@inertiajs/react";
import { useEffect, useState } from "react";
import { AlertSuccess, AlertDestructive } from "@/components/ui/alerts";
import FullScreenPrompt from "@/components/staff/FullScreenPrompt";
import DatePicker from "react-datepicker"; // Install react-datepicker if not already installed
import "react-datepicker/dist/react-datepicker.css";

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: "Expenses",
        href: "/staff/expenses",
    },
];

export default function ExpensesPOS() {
    const { data, setData, post, processing, reset } = useForm({
        title: "",
        description: "",
        amount: "",
    });
    const { props } = usePage<{ expenses: Array<{ id: number; title: string; description: string; amount: string; date: string }> }>();
    const [successMessage, setSuccessMessage] = useState("");
    const [errorMessage, setErrorMessage] = useState("");
    const [isFullScreen, setIsFullScreen] = useState(false);
    const [filteredExpenses, setFilteredExpenses] = useState(props.expenses);
    const [filterDate, setFilterDate] = useState<Date | null>(null);
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        if (props.flash?.success) {
            setSuccessMessage(props.flash.success);
        }
        if (props.flash?.error) {
            setErrorMessage(props.flash.error);
        }
    }, [props.flash]);

    useEffect(() => {
        let filtered = props.expenses;

        if (filterDate) {
            filtered = filtered.filter(
                (expense) =>
                    new Date(expense.date).toISOString().split("T")[0] ===
                    filterDate.toISOString().split("T")[0]
            );
        }

        if (searchQuery) {
            filtered = filtered.filter((expense) =>
                expense.title.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        filtered = filtered.sort(
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );

        setFilteredExpenses(filtered);
    }, [filterDate, searchQuery, props.expenses]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post("/staff/expenses", {
            onSuccess: () => {
                reset();
                window.location.reload(); // Reload to fetch updated expenses
            },
        });
    };

    return (
        <StaffLayout breadcrumbs={breadcrumbs}>
            <Head title="Expenses" />
            
            <FullScreenPrompt onFullScreenChange={setIsFullScreen} />
            
            {successMessage && (
                <AlertSuccess
                    message={successMessage}
                    onClose={() => setSuccessMessage("")}
                />
            )}
            {errorMessage && (
                <AlertDestructive
                    message={errorMessage}
                    onClose={() => setErrorMessage("")}
                />
            )}
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4 md:flex-row">
                {/* Left Section: Form */}
                <div className="flex-1 rounded-xl border border-gray-300 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                        <div>
                            <label
                                htmlFor="title"
                                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                            >
                                Title
                            </label>
                            <input
                                id="title"
                                type="text"
                                value={data.title}
                                onChange={(e) => setData("title", e.target.value)}
                                className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:focus:border-blue-500 dark:focus:ring-blue-500"
                                required
                            />
                        </div>
                        <div>
                            <label
                                htmlFor="description"
                                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                            >
                                Description
                            </label>
                            <textarea
                                id="description"
                                value={data.description}
                                onChange={(e) => setData("description", e.target.value)}
                                className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:focus:border-blue-500 dark:focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label
                                htmlFor="amount"
                                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                            >
                                Amount
                            </label>
                            <input
                                id="amount"
                                type="number"
                                step="0.01"
                                value={data.amount}
                                onChange={(e) => setData("amount", e.target.value)}
                                className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:focus:border-blue-500 dark:focus:ring-blue-500"
                                required
                            />
                        </div>
                        <button
                            type="submit"
                            className="ml-auto mt-4 rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-offset-gray-800"
                            disabled={processing}
                        >
                            Save
                        </button>
                    </form>
                </div>
                {/* Right Section */}
                <div className="flex-1 rounded-xl border border-gray-300 bg-white p-4 shadow-md dark:border-gray-700 dark:bg-gray-800">
                    <div className="space-y-4">
                        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">Expenses</h2>
                        <div className="flex items-center gap-4">
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                                placeholder="Search by title"
                            />
                            <DatePicker
                                selected={filterDate}
                                onChange={(date) => setFilterDate(date)}
                                className="rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                                placeholderText="Filter by date"
                            />
                            <button
                                onClick={() => setFilterDate(null)}
                                className="rounded-md bg-gray-500 px-4 py-2 text-white hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 dark:bg-gray-600 dark:hover:bg-gray-700 dark:focus:ring-offset-gray-800"
                            >
                                Clear Filter
                            </button>
                        </div>
                        <ul className="space-y-2 max-h-48 overflow-y-auto">
                            {filteredExpenses.map((expense) => (
                                <li
                                    key={expense.id}
                                    className="flex flex-col gap-1 rounded-lg border border-gray-200 bg-gray-50 p-4 shadow-sm dark:border-gray-600 dark:bg-gray-700"
                                >
                                    <p className="text-base font-medium text-gray-800 dark:text-gray-100">{expense.title}</p>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">{expense.description}</p>
                                    <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">${expense.amount}</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">{expense.date}</p>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>
        </StaffLayout>
    );
}
