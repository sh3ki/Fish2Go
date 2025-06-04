import React, { useState, useEffect } from "react";
import StaffLayout from "@/components/staff/StaffLayout";
import { type BreadcrumbItem } from "@/types";
import { Head } from "@inertiajs/react";
import DateRangePicker from "@/components/ui/date-range-picker";
import { 
  DollarSign, 
  CalendarDays, 
  ShoppingCart, 
  Receipt, 
  Calculator, 
  Wallet,
  Loader2,
  BanknoteIcon,
  CreditCard,
  Footprints,
  PhilippinePeso
} from "lucide-react";
import axios from "axios";
import dayjs from "dayjs";
import { format } from "date-fns";

// Import SVG icons
import GCashIcon from "../../../public/images/gcash.svg";
import GrabFoodIcon from "../../../public/images/grab.svg";
import FoodPandaIcon from "../../../public/images/panda.svg";

const breadcrumbs: BreadcrumbItem[] = [
  {
    title: "Summary",
    href: "/staff/summary",
  },
];

// Define default stats structure based on data from controller
const defaultStats = {
  total_gross_sales: 0,
  total_expenses: 0,
  total_net_sales: 0,
  total_deposited: 0,
  total_cash: 0,
  total_gcash: 0,
  total_grabfood: 0,
  total_foodpanda: 0,
  date: dayjs().format('YYYY-MM-DD')
};

export default function StaffSummary({ initialStats, summaries = [] }) {
  // Update to use last 7 days as default date range
  const [startDate, setStartDate] = useState<Date>(dayjs().subtract(6, 'day').toDate());
  const [endDate, setEndDate] = useState<Date>(dayjs().toDate());
  const [isLoading, setIsLoading] = useState(false);
  
  // Initialize with defaultStats, then merge with initialStats if available
  const [stats, setStats] = useState({
    ...defaultStats,
    ...(initialStats || {})
  });

  // New state for today's data only (for the cards)
  const [todayStats, setTodayStats] = useState({
    ...defaultStats,
    ...(initialStats || {})
  });

  const [summaryData, setSummaryData] = useState(summaries || []);

  // Updated to handle Date objects from DateRangePicker
  const handleDateRangeChange = (newStartDate: Date, newEndDate: Date) => {
    setStartDate(newStartDate);
    setEndDate(newEndDate);
    fetchStaffStats(newStartDate, newEndDate);
  };

  // Fetch today's data only (for cards)
  const fetchTodayStats = async () => {
    try {
      const today = dayjs().format('YYYY-MM-DD');
      const response = await axios.get('/api/staff/summary', {
        params: {
          start_date: today,
          end_date: today
        }
      });
      
      const responseData = response.data || {};
      setTodayStats({
        ...defaultStats,
        ...responseData
      });
    } catch (error) {
      console.error('Error fetching today\'s stats:', error);
      setTodayStats(defaultStats);
    }
  };

  const fetchStaffStats = async (start: Date, end: Date) => {
    setIsLoading(true);
    try {
      const response = await axios.get('/api/staff/summary', {
        params: {
          start_date: format(start, 'yyyy-MM-dd'),
          end_date: format(end, 'yyyy-MM-dd')
        }
      });
      
      // Ensure we're using our default structure and merging with the response data
      const responseData = response.data || {};
      setStats({
        ...defaultStats,
        ...responseData
      });

      // Update the summaries data if it exists in response
      if (responseData.summaries) {
        setSummaryData(responseData.summaries);
      }
    } catch (error) {
      console.error('Error fetching staff stats:', error);
      // On error, reset to defaults but keep dates
      setStats(defaultStats);
      setSummaryData([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Fetch today's data for cards
    fetchTodayStats();
    
    // Fetch date range data for table
    if (!initialStats || Object.keys(initialStats).length === 0) {
      fetchStaffStats(startDate, endDate);
    }
  }, []);

  // Format currency function
  const formatCurrency = (value) => {
    return `₱ ${(value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <StaffLayout breadcrumbs={breadcrumbs}>
      <Head title="Summary" />
      
      <div className="flex flex-col bg-gray-900 h-[calc(100vh-41px)]">
        
        {/* Main content scrollable area */}
        <div className="flex-1 p-2" style={{ height: 'calc(100vh - 104px)' }}>
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="flex flex-col items-center">
                <Loader2 className="h-12 w-12 animate-spin text-purple-500 mb-4" />
                <span className="text-white text-lg">Loading financial data...</span>
              </div>
            </div>
          ) : (
            <>
              {/* Single 4x2 grid for all 8 cards - Using todayStats now */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-2 mb-4">
                {/* First row - first card */}
                <div className="p-4 bg-gray-800 rounded-xl text-white flex flex-col">
                  <h3 className="text-lg font-semibold flex items-center">
                    <Wallet className="w-5 h-5 text-purple-500 mr-2" />
                    <span>Gross Sales</span>
                  </h3>
                  <p className="text-2xl font-medium mt-2">{formatCurrency(todayStats.total_gross_sales)}</p>
                </div>

                {/* First row - second card */}
                <div className="p-4 bg-gray-800 rounded-xl text-white flex flex-col">
                  <h3 className="text-lg font-semibold flex items-center">
                    <CreditCard className="w-5 h-5 text-red-500 mr-2" />
                    <span>Expenses</span>
                  </h3>
                  <p className="text-2xl font-medium mt-2">{formatCurrency(todayStats.total_expenses)}</p>
                </div>

                {/* First row - third card */}
                <div className="p-4 bg-gray-800 rounded-xl text-white flex flex-col">
                  <h3 className="text-lg font-semibold flex items-center">
                    <PhilippinePeso className="w-5 h-5 text-blue-500 mr-2" />
                    <span>Net Sales</span>
                  </h3>
                  <p className="text-2xl font-medium mt-2">{formatCurrency(todayStats.total_net_sales)}</p>
                </div>

                {/* First row - fourth card */}
                <div className="p-4 bg-gray-800 rounded-xl text-white flex flex-col">
                  <h3 className="text-lg font-semibold flex items-center">
                    <BanknoteIcon className="w-5 h-5 text-green-500 mr-2" />
                    <span>Deposited</span>
                  </h3>
                  <p className="text-2xl font-medium mt-2">{formatCurrency(todayStats.total_deposited)}</p>
                </div>

                {/* Second row - first card */}
                <div className="p-4 bg-gray-800 rounded-xl text-white flex flex-col">
                  <h3 className="text-lg font-semibold flex items-center">
                    <Footprints className="w-5 h-5 text-yellow-500 mr-2" />
                    <span>Walk-in</span>
                  </h3>
                  <p className="text-2xl font-medium mt-2">{formatCurrency(todayStats.total_walk_in)}</p>
                </div>

                {/* Second row - second card */}
                <div className="p-4 bg-gray-800 rounded-xl text-white flex flex-col">
                  <h3 className="text-lg font-semibold flex items-center">
                    <div className="w-5 h-5 mr-2 flex items-center justify-center">
                      <img src={GCashIcon} alt="GCash" className="w-5 h-5" />
                    </div>
                    <span>GCash</span>
                  </h3>
                  <p className="text-2xl font-medium mt-2">{formatCurrency(todayStats.total_gcash)}</p>
                </div>

                {/* Second row - third card */}
                <div className="p-4 bg-gray-800 rounded-xl text-white flex flex-col">
                  <h3 className="text-lg font-semibold flex items-center">
                    <div className="w-5 h-5 mr-2 flex items-center justify-center">
                      <img src={GrabFoodIcon} alt="GrabFood" className="w-5 h-5" />
                    </div>
                    <span>GrabFood</span>
                  </h3>
                  <p className="text-2xl font-medium mt-2">{formatCurrency(todayStats.total_grabfood)}</p>
                </div>

                {/* Second row - fourth card */}
                <div className="p-4 bg-gray-800 rounded-xl text-white flex flex-col">
                  <h3 className="text-lg font-semibold flex items-center">
                    <div className="w-5 h-5 mr-2 flex items-center justify-center">
                      <img src={FoodPandaIcon} alt="FoodPanda" className="w-5 h-5" />
                    </div>
                    <span>FoodPanda</span>
                  </h3>
                  <p className="text-2xl font-medium mt-2">{formatCurrency(todayStats.total_foodpanda)}</p>
                </div>
              </div>

              {/* Date range for controlling the table display */}
              <div className="relative inline-block mb-2">
                <DateRangePicker 
                      startDate={startDate} 
                  endDate={endDate} 
                  onChange={handleDateRangeChange}
                  buttonClassName="bg-gray-500 rounded-lg flex items-center justify-center h-8"
                />
              </div>

              {/* Summaries Table - Using date range data */}
              <div className="bg-gray-800 rounded-xl overflow-hidden mt-2" >
                  <table className="w-full text-left">
                    <thead className="bg-gray-700 text-white text-sm uppercase font-medium">
                      <tr>
                        <th scope="col" className="px-4 py-3">Date</th>
                        <th scope="col" className="px-4 py-3">Gross Sales</th>
                        <th scope="col" className="px-4 py-3">Expenses</th>
                        <th scope="col" className="px-4 py-3">Net Sales</th>
                        <th scope="col" className="px-4 py-3">Walk-in</th>
                        <th scope="col" className="px-4 py-3">GCash</th>
                        <th scope="col" className="px-4 py-3">GrabFood</th>
                        <th scope="col" className="px-4 py-3">FoodPanda</th>
                        <th scope="col" className="px-4 py-3">Deposited</th>
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
            </>
          )}
        </div>
      </div>
    </StaffLayout>
  );
}
