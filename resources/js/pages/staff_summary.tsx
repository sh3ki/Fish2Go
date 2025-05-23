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
  CreditCard
} from "lucide-react";
import axios from "axios";
import dayjs from "dayjs";
import { format } from "date-fns";

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
    return `₱ ${(value || 0).toLocaleString()}`;
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
                    <ShoppingCart className="w-5 h-5 text-purple-500 mr-2" />
                    <span>Gross Sales</span>
                  </h3>
                  <p className="text-2xl font-medium mt-2">{formatCurrency(todayStats.total_gross_sales)}</p>
                </div>

                {/* First row - second card */}
                <div className="p-4 bg-gray-800 rounded-xl text-white flex flex-col">
                  <h3 className="text-lg font-semibold flex items-center">
                    <Receipt className="w-5 h-5 text-red-500 mr-2" />
                    <span>Expenses</span>
                  </h3>
                  <p className="text-2xl font-medium mt-2">{formatCurrency(todayStats.total_expenses)}</p>
                </div>

                {/* First row - third card */}
                <div className="p-4 bg-gray-800 rounded-xl text-white flex flex-col">
                  <h3 className="text-lg font-semibold flex items-center">
                    <Wallet className="w-5 h-5 text-blue-500 mr-2" />
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
                    <DollarSign className="w-5 h-5 text-yellow-500 mr-2" />
                    <span>Walk-in</span>
                  </h3>
                  <p className="text-2xl font-medium mt-2">{formatCurrency(todayStats.total_walk_in)}</p>
                </div>

                {/* Second row - second card */}
                <div className="p-4 bg-gray-800 rounded-xl text-white flex flex-col">
                  <h3 className="text-lg font-semibold flex items-center">
                    <div className="w-5 h-5 mr-2">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="#3B82F6" className="w-5 h-5">
                        <path d="M82.189,26.498c-0.547,0-1.089,0.13-1.59,0.386c-1.718,0.879-2.401,2.992-1.522,4.71 C82.012,37.332,83.5,43.525,83.5,50c0,6.477-1.487,12.669-4.422,18.406c-0.427,0.833-0.503,1.781-0.216,2.67 c0.288,0.89,0.904,1.614,1.736,2.04c0.5,0.256,1.036,0.385,1.592,0.385c1.322,0,2.518-0.73,3.118-1.907 C88.754,64.863,90.5,57.598,90.5,50c0-7.595-1.746-14.86-5.19-21.594c-0.426-0.833-1.15-1.449-2.041-1.737 C82.915,26.555,82.551,26.498,82.189,26.498z"></path><path d="M43,85C23.701,85,8,69.299,8,50s15.701-35,35-35c7.843,0,15.262,2.543,21.454,7.355 c1.744,1.355,2.06,3.869,0.704,5.613c-1.354,1.744-3.868,2.061-5.612,0.705C54.771,24.961,49.049,23,43,23 c-14.888,0-27,12.112-27,27s12.112,27,27,27c6.049,0,11.771-1.961,16.546-5.672c1.745-1.357,4.258-1.04,5.612,0.704 c1.355,1.745,1.041,4.257-0.704,5.613C58.262,82.457,50.844,85,43,85z"></path>
                      </svg>
                    </div>
                    <span>GCash</span>
                  </h3>
                  <p className="text-2xl font-medium mt-2">{formatCurrency(todayStats.total_gcash)}</p>
                </div>

                {/* Second row - third card */}
                <div className="p-4 bg-gray-800 rounded-xl text-white flex flex-col">
                  <h3 className="text-lg font-semibold flex items-center">
                    <div className="w-5 h-5 mr-2">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="green" className="w-5 h-5">
                        <path d="M70.645,82h-41.29C23.084,82,18,76.916,18,70.645v-41.29C18,23.084,23.084,18,29.355,18h41.29 C76.916,18,82,23.084,82,29.355v41.29C82,76.916,76.916,82,70.645,82z"></path>
                      </svg>
                    </div>
                    <span>GrabFood</span>
                  </h3>
                  <p className="text-2xl font-medium mt-2">{formatCurrency(todayStats.total_grabfood)}</p>
                </div>

                {/* Second row - fourth card */}
                <div className="p-4 bg-gray-800 rounded-xl text-white flex flex-col">
                  <h3 className="text-lg font-semibold flex items-center">
                    <div className="w-5 h-5 mr-2">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="#ee5490" className="w-5 h-5">
                        <path d="M86,49.031c0-0.232-0.03-0.456-0.035-0.686c-0.019-0.746-0.05-1.488-0.112-2.222 c-0.05-0.626-0.123-1.243-0.205-1.86c-0.042-0.303-0.089-0.604-0.138-0.904c-0.817-5.146-2.695-9.934-5.448-14.109 c1.987-1.606,3.005-4.148,3.005-6.955c0-5.291-4.263-9.262-9.604-9.262c-3.214,0-5.968,1.387-7.621,3.71 c-4.786-2.353-10.149-3.71-15.842-3.71c-5.69,0-11.051,1.356-15.835,3.707c-1.667-2.329-4.404-3.706-7.626-3.706 c-5.222-0.056-9.511,4.08-9.605,9.262c0.044,2.623,1.131,5.113,3.008,6.95c-2.765,4.192-4.648,9-5.46,14.17 c-0.06,0.361-0.117,0.722-0.166,1.086c-0.063,0.497-0.12,0.994-0.162,1.497c-0.076,0.852-0.118,1.708-0.13,2.568 C14.022,48.721,14,48.873,14,49.031c0,0.038,0.006,0.074,0.006,0.112c0,0.049-0.005,0.098-0.005,0.148 c0.005,18.152,13.652,33.106,31.312,35.4c1.538,0.2,3.094,0.339,4.687,0.339c0,0,0,0,0,0l0,0c0.071,0,0.14-0.01,0.211-0.011 c1.425-0.008,2.824-0.118,4.205-0.288C72.206,82.56,85.99,67.543,86,49.302c0-0.053-0.005-0.104-0.006-0.157 C85.994,49.106,86,49.069,86,49.031z"></path>
                      </svg> 
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
