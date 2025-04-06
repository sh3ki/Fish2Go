import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import AppLayout from "@/layouts/app-layout";
import { type BreadcrumbItem } from "@/types";
import { Head } from "@inertiajs/react";
import Chart from "react-apexcharts";
import dayjs from "dayjs"; // For date formatting
import { LayoutGrid, ShoppingCart, ClipboardList, Users, PhilippinePeso, HandCoins } from "lucide-react";

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
     
      <Chart options={options} series={series} type="line" height={350} />
    </div>
  );
};

const getCurrentMonthYear = () => {
  const now = new Date();
  return {
    month: now.getMonth() + 1, // Months are 0-indexed
    year: now.getFullYear(),
  };
};

// 📌 Main Dashboard Component
export default function Dashboard({ totalProducts, totalInventory, staffUsers }) {
  const [categoryData, setCategoryData] = useState([]);
  const [totalSales, setTotalSales] = useState(0);
  const [staffError, setStaffError] = useState(null);
  const [staffPage, setStaffPage] = useState(1);
  const staffPerPage = 5;
  const totalStaffPages = Math.ceil(staffUsers.length / staffPerPage);

  const [salesData, setSalesData] = useState([]);
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

  const [salesFilterDate, setSalesFilterDate] = useState(getCurrentMonthYear());
  const [productSalesFilterDate, setProductSalesFilterDate] = useState(getCurrentMonthYear());
  const [paymentFilterDate, setPaymentFilterDate] = useState(getCurrentMonthYear());

  const [productSalesPage, setProductSalesPage] = useState(1);
  const productsPerPage = 10;

  const handleDateChange = (setFilterDate) => (e) => {
    const { name, value } = e.target;
    setFilterDate((prev) => ({ ...prev, [name]: parseInt(value, 10) }));
  };

  const fetchSalesData = useMemo(() => {
    return () => {
      setSalesLoading(true);
      axios
        .get(`/api/sales-data?month=${salesFilterDate.month}&year=${salesFilterDate.year}`)
        .then((response) => {
          const formattedData = response.data.map((item) => ({
            date: dayjs(item.date).format("DD MMM"),
            sales: item.sales,
          }));
          setSalesData(formattedData);
          setSalesLoading(false);
        })
        .catch((error) => {
          console.error("Error fetching sales data!", error);
          setSalesData([]);
          setSalesLoading(false);
        });
    };
  }, [salesFilterDate]);

  const fetchProductSalesData = useMemo(() => {
    return () => {
      setProductLoading(true);
      axios
        .get(`/api/product-sales-data?month=${productSalesFilterDate.month}&year=${productSalesFilterDate.year}`)
        .then((response) => {
          setProductSalesData(response.data);
          setProductLoading(false);
        })
        .catch((error) => {
          console.error("Error fetching product sales data!", error);
          setProductSalesData([]);
          setProductLoading(false);
        });
    };
  }, [productSalesFilterDate]);

  const fetchPaymentData = useMemo(() => {
    return () => {
      setPaymentLoading(true);
      axios
        .get(`/admin/dashboard/payment-method-percentages?month=${paymentFilterDate.month}&year=${paymentFilterDate.year}`)
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
        .catch((error) => {
          console.error("Error fetching payment percentages!", error);
          setPaymentData({
            cash: { count: 0, percentage: 0 },
            gcash: { count: 0, percentage: 0 },
            foodpanda: { count: 0, percentage: 0 },
            grabfood: { count: 0, percentage: 0 },
          });
          setPaymentSeries([]);
          setPaymentLoading(false);
        });
    };
  }, [paymentFilterDate]);

  const sortedProductSalesData = useMemo(() => {
    return [...productSalesData].sort((a, b) => b.total_sales - a.total_sales);
  }, [productSalesData]);

  const paginatedProductSalesData = useMemo(() => {
    const startIndex = (productSalesPage - 1) * productsPerPage;
    const endIndex = startIndex + productsPerPage;
    return sortedProductSalesData.slice(startIndex, endIndex);
  }, [sortedProductSalesData, productSalesPage]);

  const totalProductSalesPages = Math.ceil(sortedProductSalesData.length / productsPerPage);

  useEffect(() => {
    fetchSalesData();
  }, [fetchSalesData]);

  useEffect(() => {
    fetchProductSalesData();
  }, [fetchProductSalesData]);

  useEffect(() => {
    fetchPaymentData();
  }, [fetchPaymentData]);

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

  const renderDateFilter = (filterDate, setFilterDate) => {
    const startYear = 2024; // Start year
    const endYear = 2034; // End year
    const yearsRange = Array.from({ length: endYear - startYear + 1 }, (_, i) => startYear + i);

    return (
      <div className="flex items-center space-x-2">
        <select
          name="month"
          value={filterDate.month}
          onChange={handleDateChange(setFilterDate)}
          className="px-2 py-1 rounded bg-gray-300 dark:bg-gray-700 text-black dark:text-white"
        >
          {Array.from({ length: 12 }, (_, i) => (
            <option key={i + 1} value={i + 1}>
              {dayjs().month(i).format("MMMM")}
            </option>
          ))}
        </select>
        <select
          name="year"
          value={filterDate.year}
          onChange={handleDateChange(setFilterDate)}
          className="px-2 py-1 rounded bg-gray-300 dark:bg-gray-700 text-black dark:text-white"
        >
          {yearsRange.map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>
      </div>
    );
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

        {/* Sales Overview Chart */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-4 bg-gray-300 dark:bg-gray-800 p-4 rounded-xl">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-white flex items-center space-x-2">
                <PhilippinePeso className="w-5 h-5 text-purple-900 dark:text-purple-500" />
                <span className="text-black dark:text-white">Sales Overview</span>
              </h3>
              {renderDateFilter(salesFilterDate, setSalesFilterDate)}
            </div>
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

        {/* Product Sales Bar Chart */}
        <div className="bg-gray-200 dark:bg-gray-800 p-4 rounded-xl shadow-md w-full">
          <div className="lg:col-span-4 bg-gray-300 dark:bg-gray-800 p-4 rounded-xl overflow-x-auto">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-white flex items-center space-x-2">
                <PhilippinePeso className="w-5 h-5 text-purple-900 dark:text-purple-500" />
                <span className="text-black dark:text-white">Product Sales</span>
              </h3>
              {renderDateFilter(productSalesFilterDate, setProductSalesFilterDate)}
            </div>
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
                    r="10" stroke="currentColor" strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  ></path>
                </svg>
              </div>
            ) : (
              <div className="min-w-full">
                <Chart
                  options={{
                    ...productSalesOptions,
                    xaxis: {
                      categories: paginatedProductSalesData.map((data) => data.product_name),
                      labels: { style: { colors: "#666" } },
                    },
                  }}
                  series={[
                    {
                      name: "Total Sales",
                      data: paginatedProductSalesData.map((data) => data.total_sales),
                    },
                  ]}
                  type="bar"
                  height={350}
                  width={Math.max(155, paginatedProductSalesData.length * 100)}
                />
                <Pagination
                  currentPage={productSalesPage}
                  totalPages={totalProductSalesPages}
                  onPageChange={setProductSalesPage}
                />
              </div>
            )}
          </div>
        </div>

        {/* Payment Methods Donut Chart */}
        <div className="bg-gray-200 dark:bg-gray-800 p-4 rounded-xl shadow-md w-full">
          <div className="bg-gray-300 dark:bg-gray-800 p-4 rounded-xl">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-white flex items-center space-x-2">
                <HandCoins className="w-5 h-5 text-purple-900 dark:text-purple-500" />
                <span className="text-black dark:text-white">Payment Method</span>
              </h3>
              {renderDateFilter(paymentFilterDate, setPaymentFilterDate)}
            </div>
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

        {/* Leftover Products Section */}
        <div className="bg-gray-200 dark:bg-gray-800 p-4 rounded-xl shadow-md w-full"></div>
          <div className="p-4 bg-gray-300 dark:bg-gray-800 rounded-xl w-full">
            <h3 className="text-lg font-semibold text-white flex items-center space-x-2">
              <ClipboardList className="w-5 h-5 text-purple-900 dark:text-purple-500" />
              <span className="text-black dark:text-white">Leftover Products</span>
            </h3>
            <ul className="mt-4 space-y-2">
              <li className="bg-gray-100 dark:bg-gray-700 p-2 rounded text-black dark:text-white">
                Product 1
              </li>
              <li className="bg-gray-100 dark:bg-gray-700 p-2 rounded text-black dark:text-white">
                Product 2
              </li>
              <li className="bg-gray-100 dark:bg-gray-700 p-2 rounded text-black dark:text-white">
                Product 3
              </li>
              <li className="bg-gray-100 dark:bg-gray-700 p-2 rounded text-black dark:text-white">
                Product 4
              </li>
              <li className="bg-gray-100 dark:bg-gray-700 p-2 rounded text-black dark:text-white">
                Product 5
              </li>
            </ul>
          </div>
        </div>
 
    </AppLayout>
  );
}
