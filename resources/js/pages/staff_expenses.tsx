import { PlaceholderPattern } from "@/components/ui/placeholder-pattern";
import StaffLayout from "@/components/staff/StaffLayout";
import { type BreadcrumbItem } from "@/types";
import { Head, useForm, usePage } from "@inertiajs/react";
import { useEffect, useState } from "react";
import { AlertSuccess, AlertDestructive } from "@/components/ui/alerts";

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
    const { props } = usePage();
    const [successMessage, setSuccessMessage] = useState("");
    const [errorMessage, setErrorMessage] = useState("");

    useEffect(() => {
        if (props.flash?.success) {
            setSuccessMessage(props.flash.success);
        }
        if (props.flash?.error) {
            setErrorMessage(props.flash.error);
        }
    }, [props.flash]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post("/staff/expenses", {
            onSuccess: () => {
                reset();
            },
        });
    };

    return (
        <StaffLayout breadcrumbs={breadcrumbs}>
            <Head title="Expenses" />
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
                <div className="flex-1 border-sidebar-border/70 dark:border-sidebar-border relative min-h-[100vh] flex-1 overflow-hidden rounded-xl border md:min-h-min">
                    <PlaceholderPattern className="absolute inset-0 size-full stroke-neutral-900/20 dark:stroke-neutral-100/20" />
                </div>
            </div>
        </StaffLayout>
    );
}
