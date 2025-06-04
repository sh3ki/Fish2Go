import React, { useState, useEffect } from "react";
import AppLayout from "@/layouts/app-layout";
import { Head } from "@inertiajs/react";
import DateRangePicker from "@/components/ui/date-range-picker";
import { 
  Wallet, 
  CreditCard, 
  PhilippinePeso, 
  BanknoteIcon, 
  Footprints 
} from "lucide-react";
import axios from "axios";
import dayjs from "dayjs";
import { format } from "date-fns";

// Import SVG icons
import GCashIcon from "../../../public/images/gcash.svg";
import GrabFoodIcon from "../../../public/images/grab.svg";
import FoodPandaIcon from "../../../public/images/panda.svg";

const defaultStats = {
  total_gross_sales: 0,
  total_expenses: 0,
  total_net_sales: 0,
  total_deposited: 0,
  total_walk_in: 0,
  total_gcash: 0,
  total_grabfood: 0,
  total_foodpanda: 0,
};

export default function AdminSummary({ initialStats, summaries = [] }) {
  // Date range state
  const [startDate, setStartDate] = useState<Date>(dayjs(initialStats?.start_date || dayjs().subtract(6, 'day')).toDate());
  const [endDate, setEndDate] = useState<Date>(dayjs(initialStats?.end_date || dayjs()).toDate());
  const [isLoading, setIsLoading] = useState(false);

  // Card stats (today only, fetched from /admin/dashboard/cards)
  const [cardStats, setCardStats] = useState({ ...defaultStats });

  // Table data
  const [summaryData, setSummaryData] = useState(summaries || []);

  // Fetch card data (today only, always from /admin/dashboard/cards)
  const fetchCardStats = async () => {
    try {
      const today = dayjs().format('YYYY-MM-DD');
      const response = await axios.get('/admin/dashboard/cards', {
        params: { date: today }
      });
      const data = response.data || {};
      setCardStats({
        total_gross_sales: data.totalSales || 0,
        total_expenses: data.totalExpense || 0,
        total_net_sales: data.totalCash || 0,
        total_deposited: data.totalDeposited || 0,
        total_walk_in: data.cashSales || 0,
        total_gcash: data.gcashSales || 0,
        total_grabfood: data.grabfoodSales || 0,
        total_foodpanda: data.foodpandaSales || 0,
      });
    } catch {
      setCardStats({ ...defaultStats });
    }
  };

  // Fetch stats and summaries for date range (table only)
  const fetchStats = async (start: Date, end: Date) => {
    setIsLoading(true);
    try {
      const response = await axios.get('/admin/summary/stats', {
        params: {
          start_date: format(start, 'yyyy-MM-dd'),
          end_date: format(end, 'yyyy-MM-dd')
        }
      });
      const responseData = response.data || {};
      if (responseData.summaries) {
        setSummaryData(responseData.summaries);
      }
    } catch {
      setSummaryData([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle date range change (table only)
  const handleDateRangeChange = (newStartDate: Date, newEndDate: Date) => {
    setStartDate(newStartDate);
    setEndDate(newEndDate);
    fetchStats(newStartDate, newEndDate);
  };

  useEffect(() => {
    fetchCardStats();
    // On mount, fetch stats for initial range if not present
    if (!initialStats || Object.keys(initialStats).length === 0) {
      fetchStats(startDate, endDate);
    }
  }, []);

  // Format currency
  const formatCurrency = (value) => {
    return `₱ ${(value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <AppLayout breadcrumbs={[{ title: "Summary", href: "/admin/summary" }]}>
      <Head title="Summary" />
      <div className="flex flex-col gap-2 rounded-xl p-4">
        {/* 8 Cards - always show today's data */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-2 mb-2">
          <div className="p-4 bg-gray-300 dark:bg-gray-800 rounded-xl text-black dark:text-white flex flex-col">
            <h3 className="text-lg font-semibold flex items-center">
              <Wallet className="w-5 h-5 text-purple-500 mr-2" />
              <span>Gross Sales</span>
            </h3>
            <p className="text-2xl font-medium mt-2">{formatCurrency(cardStats.total_gross_sales)}</p>
          </div>
          <div className="p-4 bg-gray-300 dark:bg-gray-800 rounded-xl text-black dark:text-white flex flex-col">
            <h3 className="text-lg font-semibold flex items-center">
              <CreditCard className="w-5 h-5 text-red-500 mr-2" />
              <span>Expenses</span>
            </h3>
            <p className="text-2xl font-medium mt-2">{formatCurrency(cardStats.total_expenses)}</p>
          </div>
          <div className="p-4 bg-gray-300 dark:bg-gray-800 rounded-xl text-black dark:text-white flex flex-col">
            <h3 className="text-lg font-semibold flex items-center">
              <PhilippinePeso className="w-5 h-5 text-blue-500 mr-2" />
              <span>Net Sales</span>
            </h3>
            <p className="text-2xl font-medium mt-2">{formatCurrency(cardStats.total_net_sales)}</p>
          </div>
          <div className="p-4 bg-gray-300 dark:bg-gray-800 rounded-xl text-black dark:text-white flex flex-col">
            <h3 className="text-lg font-semibold flex items-center">
              <BanknoteIcon className="w-5 h-5 text-green-500 mr-2" />
              <span>Deposited</span>
            </h3>
            <p className="text-2xl font-medium mt-2">{formatCurrency(cardStats.total_deposited)}</p>
          </div>
          <div className="p-4 bg-gray-300 dark:bg-gray-800 rounded-xl text-black dark:text-white flex flex-col">
            <h3 className="text-lg font-semibold flex items-center">
              <Footprints className="w-5 h-5 text-yellow-500 mr-2" />
              <span>Walk-in</span>
            </h3>
            <p className="text-2xl font-medium mt-2">{formatCurrency(cardStats.total_walk_in)}</p>
          </div>
          <div className="p-4 bg-gray-300 dark:bg-gray-800 rounded-xl text-black dark:text-white flex flex-col">
            <h3 className="text-lg font-semibold flex items-center">
              <div className="w-5 h-5 mr-2 flex items-center justify-center">
                <img src={GCashIcon} alt="GCash" className="w-5 h-5" />
              </div>
              <span>GCash</span>
            </h3>
            <p className="text-2xl font-medium mt-2">{formatCurrency(cardStats.total_gcash)}</p>
          </div>
          <div className="p-4 bg-gray-300 dark:bg-gray-800 rounded-xl text-black dark:text-white flex flex-col">
            <h3 className="text-lg font-semibold flex items-center">
              <div className="w-5 h-5 mr-2 flex items-center justify-center">
                <img src={GrabFoodIcon} alt="GrabFood" className="w-5 h-5" />
              </div>
              <span>GrabFood</span>
            </h3>
            <p className="text-2xl font-medium mt-2">{formatCurrency(cardStats.total_grabfood)}</p>
          </div>
          <div className="p-4 bg-gray-300 dark:bg-gray-800 rounded-xl text-black dark:text-white flex flex-col">
            <h3 className="text-lg font-semibold flex items-center">
              <div className="w-5 h-5 mr-2 flex items-center justify-center">
                <img src={FoodPandaIcon} alt="FoodPanda" className="w-5 h-5" />
              </div>
              <span>FoodPanda</span>
            </h3>
            <p className="text-2xl font-medium mt-2">{formatCurrency(cardStats.total_foodpanda)}</p>
          </div>
        </div>

        {/* Daterangepicker */}
        <div className="flex justify-end">
          <div className="relative inline-block">
            <DateRangePicker
              startDate={startDate}
              endDate={endDate}
              onChange={handleDateRangeChange}
              buttonClassName="bg-gray-500 dark:bg-gray-700 rounded-lg flex items-center justify-center h-8"
            />
          </div>
        </div>

        {/* Summaries Table */}
        <div className="bg-gray-800 rounded-xl overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-gray-700 text-white text-sm uppercase font-medium">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Gross Sales</th>
                <th className="px-4 py-3">Expenses</th>
                <th className="px-4 py-3">Net Sales</th>
                <th className="px-4 py-3">Walk-in</th>
                <th className="px-4 py-3">GCash</th>
                <th className="px-4 py-3">GrabFood</th>
                <th className="px-4 py-3">FoodPanda</th>
                <th className="px-4 py-3">Deposited</th>
              </tr>
            </thead>
            <tbody>
              {summaryData.length > 0 ? (
                summaryData.map((summary, index) => (
                  <tr key={summary.id || index} className="border-b border-gray-700 text-white bg-gray-800 hover:bg-gray-700">
                    <td className="px-4 py-3">{summary.date}</td>
                    <td className="px-4 py-3">{formatCurrency(summary.total_gross_sales)}</td>
                    <td className="px-4 py-3">{formatCurrency(summary.total_expenses)}</td>
                    <td className="px-4 py-3">{formatCurrency(summary.total_net_sales)}</td>
                    <td className="px-4 py-3">{formatCurrency(summary.total_walk_in)}</td>
                    <td className="px-4 py-3">{formatCurrency(summary.total_gcash)}</td>
                    <td className="px-4 py-3">{formatCurrency(summary.total_grabfood)}</td>
                    <td className="px-4 py-3">{formatCurrency(summary.total_foodpanda)}</td>
                    <td className="px-4 py-3">{formatCurrency(summary.total_deposited)}</td>
                  </tr>
                ))
              ) : (
                <tr className="text-white">
                  <td colSpan={9} className="px-4 py-6 text-center">No summary data available for the selected date range</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AppLayout>
  );
}
