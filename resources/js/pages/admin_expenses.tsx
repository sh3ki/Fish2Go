import React, { useEffect, useState } from "react";
import axios from "axios";
import AppLayout from "@/layouts/app-layout";
import { Head } from "@inertiajs/react";
import SearchBar from "@/components/ui/search-bar";
import { confirmAlert } from 'react-confirm-alert';
import { toast } from 'react-hot-toast';
import { Trash2 } from "lucide-react";
import "react-datepicker/dist/react-datepicker.css";

interface Expense {
  id: number;
  title: string;
  description: string | null;
  amount: number;
  date: string;
  user: {
    name: string;
  };
}

export default function AdminExpenses() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [filteredExpenses, setFilteredExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const now = new Date();
    return now.toLocaleDateString("en-CA"); // Format as YYYY-MM-DD in local timezone
  });

  useEffect(() => {
    const fetchExpenses = async () => {
      try {
        const response = await axios.get('/api/expenses');
        const fetchedExpenses = response.data;
        setExpenses(fetchedExpenses);
        setFilteredExpenses(fetchedExpenses);
        setError(null);
      } catch (error) {
        console.error("Failed to fetch expenses:", error);
        setError("Failed to load expenses. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchExpenses();
  }, []);

  const expenseAdditionalFilter = (expense: Expense, term: string) => {
    const searchLower = term.toLowerCase();
    return (
      (expense.description?.toLowerCase() || '').includes(searchLower) ||
      expense.amount.toString().includes(term) ||
      new Date(expense.date).toLocaleDateString().includes(term)
    );
  };
  
  const handleDateChange = (date: string) => {
    setSelectedDate(date);
    if (date) {
      const filteredByDate = expenses.filter(expense =>
        new Date(expense.date).toLocaleDateString("en-CA") === date
      );
      setFilteredExpenses(filteredByDate);
    } else {
      setFilteredExpenses(expenses); // Reset to all expenses if no date is selected
    }
  };

  const handleDelete = async (expenseId: number) => {
    confirmAlert({
      customUI: ({ onClose }) => (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl border border-gray-300 dark:border-gray-700 max-w-sm text-center">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            ⚠️ Confirm Deletion
          </h2>
          <p className="text-gray-700 dark:text-gray-300 mb-4">
            Are you sure you want to delete this expense? This action{" "}
            <b>cannot</b> be undone.
          </p>
          <div className="flex justify-center gap-4">
            <button
              onClick={async () => {
                try {
                  await axios.delete(`/api/expenses/${expenseId}`);
                  toast.success("Expense deleted successfully!");
                  
                  const updatedExpenses = expenses.filter(expense => expense.id !== expenseId);
                  setExpenses(updatedExpenses);
                  setFilteredExpenses(filteredExpenses.filter(expense => expense.id !== expenseId));
                } catch (error) {
                  toast.error(
                    error.response?.status === 404
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

  return (
    <AppLayout breadcrumbs={[{ title: "Expenses", href: "/admin/expenses" }]}>
      <Head title="Expenses" />
      <div className="flex flex-col gap-4 rounded-xl p-4">
        <div className="p-10 bg-gray-800 rounded-xl w-full overflow-x-auto max-w-8xl"> {/* Increased vertical padding */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-15">
            <h3 className="text-lg font-semibold text-white flex items-center space-x-2">
              <span>Expenses</span>
            </h3>
            
            <div className="flex items-center gap-4">
              <div className="relative w-full md:w-auto">
                <SearchBar<Expense>
                  placeholder="Search by title, date, or amount..."
                  items={expenses}
                  searchField="title"
                  onSearchResults={setFilteredExpenses}
                  additionalFilters={expenseAdditionalFilter}
                  className="px-4 py-2 rounded-lg bg-gray-700 text-white border-none focus:ring-2 focus:ring-blue-500 w-full"
                  initialValue={searchTerm}
                  onSearchTermChange={setSearchTerm}
                  debounceTime={300}
                />
              </div>
              <div className="relative flex items-center gap-2">
                <label htmlFor="date-filter" className="text-sm text-gray-300">
                  Filter by Date:
                </label>
                <input
                  id="date-filter"
                  type="date"
                  value={selectedDate}
                  onChange={(e) => handleDateChange(e.target.value)}
                  className="px-4 py-2 rounded-lg bg-gray-700 text-white border-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
          
          {loading ? (
            <div className="flex justify-center my-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
            </div>
          ) : error ? (
            <div className="text-red-400 my-4 text-center">{error}</div>
          ) : (
            <table className="min-w-full divide-y divide-gray-700 mt-4">
              <thead>
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Title</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Description</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Amount</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Added By</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {filteredExpenses.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-4 text-center text-gray-300">
                      {searchTerm ? "No matching expenses found" : "No expenses found"}
                    </td>
                  </tr>
                ) : (
                  filteredExpenses.map((expense) => (
                    <tr key={expense.id}>
                      <td className="px-4 py-3 text-gray-300">{expense.title}</td>
                      <td className="px-4 py-3 text-gray-300">{expense.description || "-"}</td>
                      <td className="px-4 py-3 text-gray-300">₱{parseFloat(expense.amount.toString()).toFixed(2)}</td>
                      <td className="px-4 py-3 text-gray-300">{new Date(expense.date).toLocaleDateString()}</td>
                      <td className="px-4 py-3 text-gray-300">{expense.user?.name || "Unknown"}</td>
                      <td className="px-4 py-3 text-gray-300">
                        <button
                          onClick={() => handleDelete(expense.id)}
                          className="inline-flex items-center justify-center p-2 rounded-full bg-red-500/20 hover:bg-red-500/30 text-red-400 hover:text-red-300 transition-colors"
                        >
                          <Trash2 size={15} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
