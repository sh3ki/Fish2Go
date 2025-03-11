import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { PlaceholderPattern } from '@/components/ui/placeholder-pattern';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { LineChart, Line, PieChart, Pie, Cell, Tooltip, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Legend, Brush, ReferenceLine } from 'recharts';
import { BookOpen, Folder, LayoutGrid, ShoppingCart, ClipboardList, Users } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/admin/dashboard',
    },
];

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A033FF'];

export default function Dashboard({ totalProducts, totalInventory, staffUsers }) {
    const [categoryData, setCategoryData] = useState([]);
    const [salesData, setSalesData] = useState([]);

    useEffect(() => {
        axios.get('/api/category-data')
            .then(response => {
                setCategoryData(response.data);
            })
            .catch(error => {
                console.error('There was an error fetching the category data!', error);
            });

        axios.get('/api/sales-data')
            .then(response => {
                setSalesData(response.data);
            })
            .catch(error => {
                console.error('There was an error fetching the sales data!', error);
            });
    }, []);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">

                    <div className="p-4 bg-gray-800 rounded-xl text-white">
                        <h3 className="text-lg font-semibold flex items-center space-x-2">
                            <LayoutGrid className="w-4 h-4 text-purple-400" />
                            <span className="text-[16px]">TBC</span>
                        </h3>
                        <p className="text-sm">₱ 12,345</p>
                    </div>

                    <div className="p-4 bg-gray-800 rounded-xl text-white">
                        <h3 className="text-lg font-semibold flex items-center space-x-2">
                            <LayoutGrid className="w-4 h-4 text-purple-400" />
                            <span className="text-[16px]">TBC</span>
                        </h3>
                        <p className="text-sm">₱ 1,234</p>
                    </div>

                    <div className="p-4 bg-gray-800 rounded-xl text-white">
                        <h3 className="text-lg font-semibold flex items-center space-x-2">
                            <ShoppingCart className="w-4 h-4 text-purple-400" />
                            <span className="text-[16px]">Total Products</span>
                        </h3>
                        <p className="text-sm">{totalProducts} Product/s</p>
                    </div>

                    <div className="p-4 bg-gray-800 rounded-xl text-white">
                        <h3 className="text-lg font-semibold flex items-center space-x-2">
                            <ClipboardList className="w-4 h-4 text-purple-400" />
                            <span className="text-[16px]">Total Inventory</span>
                        </h3>
                        <p className="text-sm">{totalInventory} Inventory/s</p>
                    </div>

                    <div className="p-4 bg-gray-800 rounded-xl text-white w-full col-span-4">
                     
                        <table className="w-full mt-1">
                            <thead>
                                <tr>
                            <Users  className="w-5 h-5 text-purple-400" />
                                    <th className="text-left p-2">Img</th>
                                    <th className="text-left p-2">Name</th>
                                    <th className="text-left p-2">Logged In</th>
                                    <th className="text-left p-2">Logged Out</th>
                                    <th className="text-left p-2">Status</th>
                                    <th className="text-left p-2">Date Created</th>

                                </tr>
                            </thead>
                            <tbody>
                                {staffUsers.map((user, index) => (
                                    <tr key={index}>
                                           <td className="p-2"></td>
                                        <td className="p-2">TBC </td>
                                        <td className="p-2">{user.name}</td>
                                        <td className="p-2">TBC </td>
                                        <td className="p-2">TBC </td>
                                        <td className="p-2">TBC </td>
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

                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-gray-800 p-4 rounded-xl">
                        <h3 className="text-lg font-semibold text-white mb-4">Sales Overview</h3>
                        <ResponsiveContainer width="90%" height={290}>
                            <LineChart data={salesData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                                <XAxis dataKey="date" stroke="#ffffff" />
                                <YAxis stroke="#ffffff" />
                                <Tooltip contentStyle={{ backgroundColor: '#333', borderColor: '#333' }} />
                                <Legend verticalAlign="top" height={35} />
                                <Brush dataKey="date" height={17} stroke="#8884d8" />
                                <ReferenceLine y={0} stroke="#000" />
                                <Line type="monotone" dataKey="sales" stroke="#82ca9d" strokeWidth={1.5} dot={{ r: 2.5 }} activeDot={{ r: 8 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="bg-gray-800 p-4 rounded-xl">
                        <h3 className="text-lg font-semibold text-white mb-4">Category Distribution</h3>
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie data={categoryData} dataKey="value" nameKey="name" outerRadius={100} fill="#8884d8" label>
                                    {categoryData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={{ backgroundColor: '#333', borderColor: '#333' }} />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}