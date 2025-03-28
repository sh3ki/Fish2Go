import React, { useEffect, useState } from "react";
import axios from "axios";
import AppLayout from "@/layouts/app-layout";
import { type BreadcrumbItem } from "@/types";
import { Head } from "@inertiajs/react";
import Chart from "react-apexcharts";
import dayjs from "dayjs"; // For date formatting
import { LayoutGrid, ShoppingCart, ClipboardList, Users } from "lucide-react";

const breadcrumbs: BreadcrumbItem[] = [
  {
    title: "Dashboard",
    href: "/admin/dashboard",
  },
];

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

  useEffect(() => {
    axios
      .get("/api/category-data")
      .then((response) => setCategoryData(response.data))
      .catch((error) => console.error("Error fetching category data!", error));

    axios
      .get("/api/sales-data")
      .then((response) => {
        const formattedData = response.data.map((item) => ({
          date: dayjs(item.date).format("DD MMM"), // Parse and format the date properly
          sales: item.sales, // Use the summed order_total value
        }));
        setSalesData(formattedData);
      })
      .catch((error) => console.error("Error fetching sales data!", error));

    axios
      .get("/api/total-sales")
      .then((response) => setTotalSales(response.data.total))
      .catch((error) => console.error("Error fetching total sales data!", error));

    axios
      .get("/api/product-sales-data")
      .then((response) => setProductSalesData(response.data))
      .catch((error) => console.error("Error fetching product sales data!", error));
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
                {staffData.map((staff, index) => (
                  <tr key={index} className="text-black dark:text-white border-b border-gray-600">
                    <td className="px-4 py-2">{staff.name}</td>
                    <td className="px-4 py-2">{staff.email}</td>
                    <td className="px-4 py-2">{staff.status}</td>
                    <td className="px-4 py-2">{staff.dateCreated}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Sales Overview Chart (Takes Full Right Side) */}
          <div className="lg:col-span-4 bg-gray-300 dark:bg-gray-800 p-4 rounded-xl">
            <SalesOverviewChart salesData={salesData} />
          </div>
        </div>

        {/* Product Sales Bar Chart */}
        <div className="bg-gray-200 dark:bg-gray-800 p-4 rounded-xl shadow-md w-full">
          <div className="lg:col-span-4 bg-gray-300 dark:bg-gray-800 p-4 rounded-xl">
            <h3 className="text-lg font-semibold text-black dark:text-white mb-4">
              Product Sales
            </h3>
            <div className="overflow-x-auto">
              <Chart
                options={productSalesOptions}
                series={productSalesSeries}
                type="bar"
                height={350}
                width={Math.max(155, productSalesData.length * 100)} // Dynamically adjust width for horizontal scroll
              />
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
