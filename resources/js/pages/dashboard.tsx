import React, { useEffect, useState } from "react";
import axios from "axios";
import AppLayout from "@/layouts/app-layout";
import { type BreadcrumbItem } from "@/types";
import { Head } from "@inertiajs/react";
import Chart from "react-apexcharts";
import dayjs from "dayjs"; // For date formatting
import { LayoutGrid, ShoppingCart, ClipboardList, Users } from "lucide-react";
import { useInView } from "@/hooks/useInView"; // updated import

const breadcrumbs: BreadcrumbItem[] = [
  {
    title: "Dashboard",
    href: "/admin/dashboard",
  },
];

// 📌 Skeleton Loader Component
const SkeletonLoader = ({ height, width }) => (
  <div
    className="animate-pulse bg-gray-300 dark:bg-gray-700 rounded"
    style={{ height, width }}
  ></div>
);

// 📌 Error Message Component
const ErrorMessage = ({ message }) => (
  <div className="text-red-500 text-center py-4">{message}</div>
);

// 📌 Pagination Component
const Pagination = ({ currentPage, totalPages, onPageChange }) => (
  <div className="flex justify-center items-center space-x-2 mt-4">
    <button
      disabled={currentPage === 1}
      onClick={() => onPageChange(currentPage - 1)}
      className="px-4 py-2 bg-gray-300 dark:bg-gray-700 rounded disabled:opacity-50"
    >
      Previous
    </button>
    <span className="text-black dark:text-white">
      Page {currentPage} of {totalPages}
    </span>
    <button
      disabled={currentPage === totalPages}
      onClick={() => onPageChange(currentPage + 1)}
      className="px-4 py-2 bg-gray-300 dark:bg-gray-700 rounded disabled:opacity-50"
    >
      Next
    </button>
  </div>
);

// 📌 Sales Chart Component
const SalesOverviewChart = ({ salesData }) => {
  const maxSales = Math.max(...salesData.map((data) => data.sales), 0); // Determine the maximum sales value

  const options = {
    chart: {
      type: "line",
      toolbar: { show: false },
      zoom: { enabled: false },
    },
    stroke: {
      curve: "smooth",
      width: 3,
    },
    xaxis: {
      type: "category",
      categories: salesData.map((data) => dayjs(data.date).format("DD MMM")), // Display full date (e.g., 01 Jan)
      labels: {
        style: { colors: "#666" },
      },
    },
    yaxis: {
      min: 0,
      max: maxSales, // Set the maximum value dynamically
      labels: {
        style: { colors: "#666" },
        formatter: (value) => `₱ ${value.toLocaleString()}`, // Format as currency
      },
    },
    tooltip: {
      theme: "dark",
      x: {
        formatter: (value) => `Date: ${value}`, // Show full date in tooltip
      },
    },
    grid: {
      borderColor: "rgba(255,255,255,0.2)",
    },
  };

  const series = [
    {
      name: "Sales",
      data: salesData.map((data) => data.sales),
    },
  ];

  return (
    <div className="bg-gray-200 dark:bg-gray-800 p-4 rounded-xl shadow-md w-full">
      <h3 className="text-lg font-semibold text-black dark:text-white mb-4">
        Sales Overview
      </h3>
      <Chart options={options} series={series} type="line" height={350} />
    </div>
  );
};

// 📌 Main Dashboard Component
export default function Dashboard({ totalProducts, totalInventory, staffUsers }) {
  const [categoryData, setCategoryData] = useState([]);
  const [salesData, setSalesData] = useState([]);
  const [totalSales, setTotalSales] = useState(0);
  const [productSalesData, setProductSalesData] = useState([]);
  const [paymentData, setPaymentData] = useState({
    cash: { count: 0, percentage: 0 },
    gcash: { count: 0, percentage: 0 },
    foodpanda: { count: 0, percentage: 0 },
    grabfood: { count: 0, percentage: 0 },
  });
  const [paymentSeries, setPaymentSeries] = useState([]);
  const [salesLoading, setSalesLoading] = useState(true);
  const [productLoading, setProductLoading] = useState(true);
  const [paymentLoading, setPaymentLoading] = useState(true);
  const [staffError, setStaffError] = useState(null);
  const [staffPage, setStaffPage] = useState(1);
  const staffPerPage = 5;
  const totalStaffPages = Math.ceil(staffUsers.length / staffPerPage);

  // Set up lazy loading refs for sections (trigger once when in view)
  const { ref: salesRef, inView: salesInView } = useInView({ triggerOnce: true });
  const { ref: productSalesRef, inView: productSalesInView } = useInView({ triggerOnce: true });
  const { ref: paymentRef, inView: paymentInView } = useInView({ triggerOnce: true });

  // Lazy load Sales Data when in view
  useEffect(() => {
    if (salesInView) {
      axios
        .get("/api/sales-data")
        .then((response) => {
          const formattedData = response.data.map((item) => ({
            date: dayjs(item.date).format("DD MMM"),
            sales: item.sales,
          }));
          setSalesData(formattedData);
          setSalesLoading(false);
        })
        .catch((error) => console.error("Error fetching sales data!", error));
    }
  }, [salesInView]);

  // Lazy load Product Sales Data when in view
  useEffect(() => {
    if (productSalesInView) {
      axios
        .get("/api/product-sales-data")
        .then((response) => {
          setProductSalesData(response.data);
          setProductLoading(false);
        })
        .catch((error) => console.error("Error fetching product sales data!", error));
    }
  }, [productSalesInView]);

  // Lazy load Payment Methods Data when in view
  useEffect(() => {
    if (paymentInView) {
      axios
        .get("/admin/dashboard/payment-method-percentages")
        .then((response) => {
          const data = response.data;
          setPaymentData(data);
          setPaymentSeries([
            data.cash.percentage,
            data.gcash.percentage,
            data.foodpanda.percentage,
            data.grabfood.percentage,
          ]);
          setPaymentLoading(false);
        })
        .catch((error) =>
          console.error("Error fetching payment percentages!", error)
        );
    }
  }, [paymentInView]);

  useEffect(() => {
    axios
      .get("/api/category-data")
      .then((response) => setCategoryData(response.data))
      .catch((error) => console.error("Error fetching category data!", error));
    axios
      .get("/api/total-sales")
      .then((response) => setTotalSales(response.data.total))
      .catch((error) => console.error("Error fetching total sales data!", error));
  }, []);

  // Function to extract data from staff users
  const extractStaffData = () => {
    return staffUsers.map((user) => ({
      name: user.name,
      email: user.email,
      loggedIn: user.logged_in_at ? new Date(user.logged_in_at).toLocaleString() : "N/A",
      loggedOut: user.logged_out_at ? new Date(user.logged_out_at).toLocaleString() : "N/A",
      status:
        user.status ||
        (user.logged_out_at
          ? "Logged Out"
          : user.logged_in_at
          ? "Logged In"
          : "Never Logged In"),
      dateCreated: new Date(user.created_at).toLocaleString("en-US", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      }),
    }));
  };

  const handleExportStaffData = () => {
    const csvContent =
      "data:text/csv;charset=utf-8," +
      ["Name,Email,Status,Date Created"]
        .concat(
          staffUsers.map(
            (user) =>
              `${user.name},${user.email},${user.status},${user.dateCreated}`
          )
        )
        .join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "staff_users.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Get formatted staff data
  const staffData = extractStaffData();
  const productSalesOptions = {
    chart: {
      type: "bar",
      toolbar: { show: false },
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: "50%", // Adjust bar width
      },
    },
    xaxis: {
      categories: productSalesData.map((data) => data.product_name),
      labels: {
        style: { colors: "#666" },
      },
    },
    yaxis: {
      labels: {
        style: { colors: "#666" },
        formatter: (value) => `₱ ${value.toLocaleString()}`, // Format as currency
      },
    },
    grid: {
      show: true,
      borderColor: "rgba(0,0,0,0.1)",
      strokeDashArray: 2, // Thinner horizontal dashed lines
      xaxis: { lines: { show: false } }, // Remove vertical lines
    },
    tooltip: {
      theme: "dark",
      y: {
        formatter: (value) => `₱ ${value.toLocaleString()}`, // Format tooltip values
      },
    },
  };

  const productSalesSeries = [
    {
      name: "Total Sales",
      data: productSalesData.map((data) => data.total_sales),
    },
  ];

  const foreColor = document.documentElement.classList.contains('dark') ? '#fff' : '#000';
  const paymentOptions = {
    chart: {
      foreColor: foreColor,
    },
    labels: [
      `Cash (${paymentData.cash.count})`,
      `Gcash (${paymentData.gcash.count})`,
      `Foodpanda (${paymentData.foodpanda.count})`,
      `Grabfood (${paymentData.grabfood.count})`,
    ],
    colors: ["#008FFB", "#00E396", "#FEB019", "#FF4560"],
    tooltip: {
      y: {
        formatter: (value, opts) => {
          const counts = [
            paymentData.cash.count,
            paymentData.gcash.count,
            paymentData.foodpanda.count,
            paymentData.grabfood.count,
          ];
          return `${value.toFixed(1)}% (${counts[opts.seriesIndex]} orders)`;
        },
      },
    },
  };

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Dashboard" />
      <div className="flex flex-col gap-4 rounded-xl p-4">
        {/* Overview Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { title: "Total Sales", value: `₱ ${totalSales}`, icon: LayoutGrid },
            { title: "Total Products", value: `${totalProducts} Product/s`, icon: ShoppingCart },
            { title: "Total Inventory", value: `${totalInventory} Inventory/s`, icon: ClipboardList },
            { title: "Staff Users", value: `${staffUsers.length} User/s`, icon: Users },
          ].map(({ title, value, icon: Icon }, index) => (
            <div
              key={index}
              className="p-4 bg-gray-300 dark:bg-gray-800 rounded-xl text-black dark:text-white flex flex-col"
            >
              <h3 className="text-lg font-semibold flex items-center space-x-2">
                {Icon && <Icon className="w-4 h-4 text-purple-900 dark:text-purple-500" />}
                <span className="text-[16px]">{title}</span>
              </h3>
              <p className="text-sm">{value}</p>
            </div>
          ))}
        </div>

        {/* Staff Users Table */}
        <div className="bg-gray-200 dark:bg-gray-800 p-4 rounded-xl shadow-md w-full">
          <div className="p-4 bg-gray-300 dark:bg-gray-800 rounded-xl w-full overflow-x-auto">
            <h3 className="text-lg font-semibold text-white flex items-center space-x-2">
              <Users className="w-5 h-5 text-purple-900 dark:text-purple-500" />
              <span className="text-black dark:text-white">Staff Users</span>
            </h3>
            <button
              onClick={handleExportStaffData}
              className="mt-2 px-4 py-2 bg-purple-500 text-white rounded"
            >
              Export Data
            </button>
            {staffError ? (
              <ErrorMessage message={staffError} />
            ) : (
              <table className="w-full mt-1 min-w-[600px]">
                <thead>
                  <tr className="text-left text-black dark:text-white bg-gray-300 dark:bg-gray-800">
                    <th className="px-4 py-2">Name</th>
                    <th className="px-4 py-2">Email</th>
                    <th className="px-4 py-2">Status</th>
                    <th className="px-4 py-2">Date Created</th>
                  </tr>
                </thead>
                <tbody>
                  {staffData
                    .slice(
                      (staffPage - 1) * staffPerPage,
                      staffPage * staffPerPage
                    )
                    .map((staff, index) => (
                      <tr key={index} className="text-black dark:text-white border-b border-gray-600">
                        <td className="px-4 py-2">{staff.name}</td>
                        <td className="px-4 py-2">{staff.email}</td>
                        <td className="px-4 py-2">{staff.status}</td>
                        <td className="px-4 py-2">{staff.dateCreated}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            )}
            <Pagination
              currentPage={staffPage}
              totalPages={totalStaffPages}
              onPageChange={setStaffPage}
            />
          </div>
        </div>

        {/* Sales Overview Chart Lazy-Loaded */}
        <div ref={salesRef} className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-4 bg-gray-300 dark:bg-gray-800 p-4 rounded-xl">
            {salesLoading ? (
              <div className="flex justify-center items-center h-64">
                <svg className="animate-spin h-8 w-8 text-gray-500" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                </svg>
              </div>
            ) : (
              <SalesOverviewChart salesData={salesData} />
            )}
          </div>
        </div>

        {/* Product Sales Bar Chart Lazy-Loaded */}
        <div ref={productSalesRef} className="bg-gray-200 dark:bg-gray-800 p-4 rounded-xl shadow-md w-full">
          <div className="lg:col-span-4 bg-gray-300 dark:bg-gray-800 p-4 rounded-xl">
            <h3 className="text-lg font-semibold text-black dark:text-white mb-4">
              Product Sales
            </h3>
            {productLoading ? (
              <div className="flex justify-center items-center h-350">
                <svg
                  className="animate-spin h-8 w-8 text-purple-500"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  ></path>
                </svg>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Chart
                  options={productSalesOptions}
                  series={productSalesSeries}
                  type="bar"
                  height={350}
                  width={Math.max(155, productSalesData.length * 100)}
                />
              </div>
            )}
          </div>
        </div>

        {/* Payment Methods Donut Chart Lazy-Loaded */}
        <div ref={paymentRef} className="bg-gray-200 dark:bg-gray-800 p-4 rounded-xl shadow-md w-full">
          <div className="bg-gray-300 dark:bg-gray-800 p-4 rounded-xl">
            <h3 className="text-lg font-semibold text-black dark:text-white mb-4">
              Payment Methods
            </h3>
            {paymentLoading ? (
              <div className="flex justify-center items-center h-350">
                <svg
                  className="animate-spin h-8 w-8 text-purple-500"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  ></path>
                </svg>
              </div>
            ) : (
              <Chart
                options={paymentOptions}
                series={paymentSeries}
                type="donut"
                height={350}
              />
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}