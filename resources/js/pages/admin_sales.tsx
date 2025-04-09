import React, { useEffect, useState } from "react";
import axios from "axios";
import AppLayout from "@/layouts/app-layout";
import { Head } from "@inertiajs/react";
import { Button } from "@/components/ui/button";
import { Search, Loader2 } from "lucide-react";

export default function AdminSales() {
  const [orders, setOrders] = useState([]);
  const [date, setDate] = useState(() => {
    const now = new Date();
    return now.toLocaleDateString("en-CA"); // Format as YYYY-MM-DD in local timezone
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchOrders(date, currentPage);
  }, [date, currentPage]);

  const fetchOrders = (date, page) => {
    setIsLoading(true);
    axios
      .get(`/api/orders?date=${date}&page=${page}`) // changed URL to connect with backend
      .then((response) => {
        console.log("API Response:", response.data);
        if (response.data && response.data.data) {
          setOrders(response.data.data);
          setCurrentPage(response.data.current_page);
          setLastPage(response.data.last_page);
        } else {
          console.error("Unexpected response format:", response.data);
        }
      })
      .catch((error) => console.error("Error fetching orders data!", error))
      .finally(() => setIsLoading(false));
  };

  const handlePageChange = (page) => {
    fetchOrders(date, page);
  };

  const filteredOrders = orders.filter((order) =>
    Object.values(order)
      .join(" ")
      .toLowerCase()
      .includes(searchQuery.toLowerCase())
  );

  return (
    <AppLayout breadcrumbs={[{ title: "Sales", href: "/admin/sales" }]}>
      <Head title="Sales" />
      <div className="flex flex-col gap-4 rounded-xl p-4">
        {/* Search and Date Filter Container */}
        <div className="p-4 pb-2 w-full shadow flex justify-between items-center">
          <div className="flex items-center gap-1.5 bg-transparent rounded-lg w-1/2">
            <input
              type="text"
              placeholder="Search Orders"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input w-full bg-gray-700 p-1.5 pl-3 text-sm text-white rounded-lg focus:outline-none focus:ring-1 focus:ring-inset focus:ring-white-400"
            />
            <Button
              className="bg-gray-500 rounded-lg flex items-center justify-center h-8"
              style={{ aspectRatio: "1/1", padding: "0" }}
            >
              <Search size={18} />
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <label htmlFor="date-filter" className="text-sm text-gray-300">
              Filter by Date:
            </label>
            <input
              id="date-filter"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="input bg-gray-700 p-1.5 text-sm text-white rounded-lg focus:outline-none focus:ring-1 focus:ring-inset focus:ring-white-400"
              defaultValue={new Date().toISOString().split("T")[0]} // Set default value to today's date
            />
          </div>
        </div>

        {/* Table Container */}
        <div className="flex-1 overflow-y-auto p-5 pt-0 pb-16">
          <div className="overflow-x-auto">
            <div className="bg-gray-900 rounded-lg shadow overflow-hidden min-w-[900px]">
              <table className="min-w-full divide-y divide-gray-700 border-collapse">
                <thead className="bg-gray-700">
                  <tr>
                    <th className="px-3 py-2.5 text-center text-xs font-semibold text-white uppercase tracking-wider">ID</th>
                    <th className="px-1 py-2.5 text-center text-xs font-semibold text-white uppercase tracking-wider">Product ID</th>
                    <th className="px-1 py-2.5 text-center text-xs font-semibold text-white uppercase tracking-wider">Quantity</th>
                    <th className="px-1 py-2.5 text-center text-xs font-semibold text-white uppercase tracking-wider">Subtotal</th>
                    <th className="px-1 py-2.5 text-center text-xs font-semibold text-white uppercase tracking-wider">Tax</th>
                    <th className="px-1 py-2.5 text-center text-xs font-semibold text-white uppercase tracking-wider">Discount</th>
                    <th className="px-1 py-2.5 text-center text-xs font-semibold text-white uppercase tracking-wider">Total</th>
                    <th className="px-1 py-2.5 text-center text-xs font-semibold text-white uppercase tracking-wider">Payment</th>
                    <th className="px-1 py-2.5 text-center text-xs font-semibold text-white uppercase tracking-wider">Change</th>
                    <th className="px-1 py-2.5 text-center text-xs font-semibold text-white uppercase tracking-wider">Status</th>
                    <th className="px-1 py-2.5 text-center text-xs font-semibold text-white uppercase tracking-wider">Created At</th>
                  </tr>
                </thead>
                <tbody className="bg-gray-800 divide-y divide-gray-700">
                  {isLoading && orders.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="px-6 py-6 text-center text-gray-400">
                        <div className="flex justify-center items-center">
                          <Loader2 className="h-6 w-6 animate-spin mr-2" />
                          <span className="font-medium">Loading orders...</span>
                        </div>
                      </td>
                    </tr>
                  ) : filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="px-6 py-6 text-center text-gray-400">
                        <span className="font-medium">No orders found</span>
                      </td>
                    </tr>
                  ) : (
                    filteredOrders.map((order, index) => (
                      <tr key={index} className="text-center hover:bg-gray-700 transition-colors">
                        <td className="px-1 py-2">{order.order_id}</td>
                        <td className="px-1 py-2">{order.product_id}</td>
                        <td className="px-1 py-2">{order.order_quantity}</td>
                        <td className="px-1 py-2">{order.order_subtotal}</td>
                        <td className="px-1 py-2">{order.order_tax}</td>
                        <td className="px-1 py-2">{order.order_discount}</td>
                        <td className="px-1 py-2">{order.order_total}</td>
                        <td className="px-1 py-2">{order.order_payment}</td>
                        <td className="px-1 py-2">{order.order_change}</td>
                        <td className="px-1 py-2">{order.order_status}</td>
                        <td className="px-1 py-2">
                          {new Date(order.created_at).toLocaleString("en-US", {
                            year: "numeric",
                            month: "2-digit",
                            day: "2-digit",
                            hour: "2-digit",
                            minute: "2-digit",
                            hour12: true,
                          })}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <div className="flex justify-between items-center mt-4">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-4 py-2 bg-gray-700 text-white rounded disabled:opacity-50"
              >
                Previous
              </button>
              <span className="text-gray-300">
                Page {currentPage} of {lastPage}
              </span>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === lastPage}
                className="px-4 py-2 bg-gray-700 text-white rounded disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </div>

    
      </div>
    </AppLayout>
  );
}
