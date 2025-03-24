import React, { useEffect, useState } from "react";
import axios from "axios";
import AppLayout from "@/layouts/app-layout";
import { Head } from "@inertiajs/react";

export default function AdminSales() {
  const [orders, setOrders] = useState([]);
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]); // Default to current date
  const [currentPage, setCurrentPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchOrders(date, currentPage);
  }, [date, currentPage]);

  const fetchOrders = (date, page) => {
    axios
      .get(`/api/orders?date=${date}&page=${page}`)
      .then((response) => {
        console.log("API Response:", response.data); // Debug log to verify API response
        if (response.data && response.data.data) {
          setOrders(response.data.data); // Set the orders data
          setCurrentPage(response.data.current_page); // Set the current page
          setLastPage(response.data.last_page); // Set the last page
        } else {
          console.error("Unexpected response format:", response.data);
        }
      })
      .catch((error) => console.error("Error fetching orders data!", error));
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
        <div className="p-4 bg-gray-800 rounded-xl w-full overflow-x-auto max-w-5xl">
          <h3 className="text-lg font-semibold text-white flex items-center space-x-2">
            <span>All Orders</span>
          </h3>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="mb-4 p-2 rounded border-1 mt-2 border-gray-100"
          />
          <input
            type="text"
            placeholder="Search orders..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div className="overflow-x-auto mt-3">
            <table className="w-full mt-1 min-w-[600px]">
              <thead>
                <tr className="bg-gray-200 dark:bg-gray-700">
                  <th className="border px-4 py-2">ID</th>
                  <th className="border px-4 py-2">Product ID</th>
                  <th className="border px-4 py-2">Quantity</th>
                  <th className="border px-4 py-2">Subtotal</th>
                  <th className="border px-4 py-2">Tax</th>
                  <th className="border px-4 py-2">Discount</th>
                  <th className="border px-4 py-2">Total</th>
                  <th className="border px-4 py-2">Payment</th>
                  <th className="border px-4 py-2">Change</th>
                  <th className="border px-4 py-2">Status</th>
                  <th className="border px-4 py-2">Created At</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.length > 0 ? (
                  filteredOrders.map((order, index) => (
                    <tr key={index} className="text-center">
                      <td className="border px-4 py-2">{order.order_id}</td>
                      <td className="border px-4 py-2">{order.product_id}</td>
                      <td className="border px-4 py-2">{order.product_quantity}</td>
                      <td className="border px-4 py-2">{order.order_subtotal}</td>
                      <td className="border px-4 py-2">{order.order_tax}</td>
                      <td className="border px-4 py-2">{order.order_discount}</td>
                      <td className="border px-4 py-2">{order.order_total}</td>
                      <td className="border px-4 py-2">{order.order_payment}</td>
                      <td className="border px-4 py-2">{order.order_change}</td>
                      <td className="border px-4 py-2">{order.order_status}</td>
                      <td className="border px-4 py-2">
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
                ) : (
                  <tr className="text-center">
                    <td className="p-4 text-white" colSpan={11}>
                      No data available.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <br />
          <div className="flex justify-between">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="p-2 bg-gray-700 rounded text-white"
            >
              Previous
            </button>
            <span className="text-white">
              Page {currentPage} of {lastPage}
            </span>
            <button
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, lastPage))}
              disabled={currentPage === lastPage}
              className="p-2 bg-gray-700 rounded text-white"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
