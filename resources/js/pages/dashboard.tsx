import React, { useEffect, useState } from "react";
import axios from "axios";
import AppLayout from "@/layouts/app-layout";
import { type BreadcrumbItem } from "@/types";
import { Head } from "@inertiajs/react";
import {
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Legend,
  Brush,
  ReferenceLine,
} from "recharts";
import { LayoutGrid, ShoppingCart, ClipboardList, Users } from "lucide-react";

const breadcrumbs: BreadcrumbItem[] = [
  {
    title: "Dashboard",
    href: "/admin/dashboard",
  },
];

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#A033FF"];

export default function Dashboard({ totalProducts, totalInventory, staffUsers }) {
  const [categoryData, setCategoryData] = useState([]);
  const [salesData, setSalesData] = useState([]);
  const [totalSales, setTotalSales] = useState(0);

  useEffect(() => {
    axios.get("/api/category-data")
      .then((response) => {
        console.log("Category Data:", response.data); // Debugging line
        setCategoryData(response.data);
      })
      .catch((error) => console.error("Error fetching category data!", error));

    axios.get("/api/sales-data")
      .then((response) => {
        console.log("Sales Data:", response.data); // Debugging line
        setSalesData(response.data);
      })
      .catch((error) => console.error("Error fetching sales data!", error));

    axios.get("/api/total-sales")
      .then((response) => {
        console.log("Total Sales:", response.data.total); // Debugging line
        setTotalSales(response.data.total);
      })
      .catch((error) => console.error("Error fetching total sales data!", error));
  }, []);

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Dashboard" />
      <div className="flex flex-col gap-4 rounded-xl p-4">
        
        {/* Overview Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { title: "Total Sales", value: `₱ ${totalSales}`, icon: LayoutGrid },
            { title: "TBC", value: "₱ 1,234", icon: LayoutGrid },
            { title: "Total Products", value: `${totalProducts} Product/s`, icon: ShoppingCart },
            { title: "Total Inventory", value: `${totalInventory} Inventory/s`, icon: ClipboardList },
          ].map(({ title, value, icon: Icon }, index) => (
            <div key={index} className="p-4 bg-gray-800 rounded-xl text-white flex flex-col">
              <h3 className="text-lg font-semibold flex items-center space-x-2">
                {Icon && <Icon className="w-4 h-4 text-purple-400" />}
                <span className="text-[16px]">{title}</span>
              </h3>
              <p className="text-sm">{value}</p>
            </div>
          ))}
        </div>

        {/* Staff Users Table */}
        <div className="p-4 bg-gray-800 rounded-xl w-full overflow-x-auto">
          <h3 className="text-lg font-semibold text-white flex items-center space-x-2">
            <Users className="w-5 h-5 text-purple-400" />
            <span>Staff Users</span>
          </h3>
          <table className="w-full mt-1 min-w-[600px]">
            <thead>
              <tr className="text-left text-white bg-gray-700">
                <th className="p-2">Img</th>
                <th className="p-2">Name</th>
                <th className="p-2">Logged In</th>
                <th className="p-2">Logged Out</th>
                <th className="p-2">Status</th>
                <th className="p-2">Date Created</th>
              </tr>
            </thead>
            <tbody>
              {staffUsers.map((user, index) => (
                <tr key={index} className="text-white border-b border-gray-600">
                  <td className="p-2"></td>
                  <td className="p-2">TBC</td>
                  <td className="p-2">{user.name}</td>
                  <td className="p-2">TBC</td>
                  <td className="p-2">TBC</td>

                  <td className="p-2">
                    {new Date(user.created_at).toLocaleString("en-US", {
                      year: "numeric",
                      month: "2-digit",
                      day: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                      hour12: true,
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Sales Overview Chart */}
          <div className="bg-gray-800 p-4 rounded-xl">
            <h3 className="text-lg font-semibold text-white mb-4">Sales Overview</h3>
            <ResponsiveContainer width="100%" height={290}>
              <LineChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                <XAxis dataKey="date" stroke="#ffffff" />
                <YAxis stroke="#ffffff" domain={[0, Math.max(...salesData.map(data => data.sales))]} />
                <Tooltip contentStyle={{ backgroundColor: "#333", borderColor: "#333" }} />
                <Legend verticalAlign="top" height={35} />
                <Brush dataKey="date" height={17} stroke="#8884d8" />
                <ReferenceLine y={0} stroke="#000" />
                <Line type="monotone" dataKey="sales" stroke="#82ca9d" strokeWidth={1.5} dot={{ r: 2.5 }} activeDot={{ r: 8 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Category Distribution Chart */}
          <div className="bg-gray-800 p-4 rounded-xl">
            <h3 className="text-lg font-semibold text-white mb-4">Category Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={categoryData} dataKey="value" nameKey="name" outerRadius={100} fill="#8884d8" label>
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: "#333", borderColor: "#333" }} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

        </div>

      </div>
    </AppLayout>
  );
}
