import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import AppLayout from "@/layouts/app-layout";
import { type BreadcrumbItem } from "@/types";
import { Head } from "@inertiajs/react";
import Chart from "react-apexcharts";
import dayjs from "dayjs";
import { PhilippinePeso, CreditCard, Wallet, BanknoteIcon, Footprints } from "lucide-react";
import DateRangePicker from "@/components/ui/date-range-picker";

// Import SVG icons
import GCashIcon from "../../../public/images/gcash.svg";
import GrabFoodIcon from "../../../public/images/grab.svg";
import FoodPandaIcon from "../../../public/images/panda.svg";

const breadcrumbs: BreadcrumbItem[] = [
  {
    title: "Dashboard",
    href: "/admin/dashboard",
  },
];

// 📌 Main Dashboard Component
export default function Dashboard({ totalProducts, totalInventory, staffUsers, todayFinancials }) {
  // New state for today's data (similar to staff_summary)
  const [todayStats, setTodayStats] = useState({
    total_gross_sales: todayFinancials?.totalSales || 0,
    total_expenses: todayFinancials?.totalExpense || 0,
    total_net_sales: todayFinancials?.totalCash || 0,
    total_deposited: todayFinancials?.totalDeposited || 0,
    total_walk_in: todayFinancials?.cashSales || 0,
    total_gcash: todayFinancials?.gcashSales || 0,
    total_grabfood: todayFinancials?.grabfoodSales || 0,
    total_foodpanda: todayFinancials?.foodpandaSales || 0,
  });
  
  // Reference to store the interval ID for cleanup
  const refreshInterval = useRef(null);
  
  // New state for chart data
  const [salesChartData, setSalesChartData] = useState([]);
  const [isChartLoading, setIsChartLoading] = useState(true);
  
  // New state for expense chart data
  const [expenseChartData, setExpenseChartData] = useState([]);
  const [isExpenseChartLoading, setIsExpenseChartLoading] = useState(true);
  
  // New state for top products chart
  const [topProductsData, setTopProductsData] = useState([]);
  const [isProductsChartLoading, setIsProductsChartLoading] = useState(true);
  
  // Initial date range - start of current month to today
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(1); // First day of current month
    return date;
  });
  const [endDate, setEndDate] = useState(new Date()); // Today

  // Fetch today's data (similar to fetchTodayStats in staff_summary)
  const fetchTodayStats = async () => {
    try {
      const today = dayjs().format('YYYY-MM-DD');
      const response = await axios.get('/admin/dashboard/cards', {
        params: {
          date: today
        }
      });
      
      const responseData = response.data || {};
      setTodayStats({
        total_gross_sales: responseData.totalSales || 0,
        total_expenses: responseData.totalExpense || 0, 
        total_net_sales: responseData.totalCash || 0,
        total_deposited: responseData.totalDeposited || 0,
        total_walk_in: responseData.cashSales || 0,
        total_gcash: responseData.gcashSales || 0,
        total_grabfood: responseData.grabfoodSales || 0,
        total_foodpanda: responseData.foodpandaSales || 0,
      });
    } catch (error) {
      console.error('Error fetching today\'s stats:', error);
    }
  };

  // Quick refresh function that only fetches card data - lightweight
  const refreshCardData = async () => {
    try {
      const today = dayjs().format('YYYY-MM-DD');
      const response = await axios.get('/admin/dashboard/cards', {
        params: { date: today }
      });
      
      if (response.data) {
        // Only update the state values that control the numbers displayed in cards
        setTodayStats(prev => ({
          ...prev,
          total_gross_sales: response.data.totalSales ?? prev.total_gross_sales,
          total_expenses: response.data.totalExpense ?? prev.total_expenses,
          total_net_sales: response.data.totalCash ?? prev.total_net_sales,
          total_deposited: response.data.totalDeposited ?? prev.total_deposited,
          total_walk_in: response.data.cashSales ?? prev.total_walk_in,
          total_gcash: response.data.gcashSales ?? prev.total_gcash,
          total_grabfood: response.data.grabfoodSales ?? prev.total_grabfood,
          total_foodpanda: response.data.foodpandaSales ?? prev.total_foodpanda,
        }));
      }
    } catch (error) {
      // Silent fail - don't disrupt the UI on refresh errors
      console.error('Error refreshing card data:', error);
    }
  };
  
  // Function to fetch sales chart data based on date range
  const fetchSalesChartData = async (start, end) => {
    setIsChartLoading(true);
    setIsExpenseChartLoading(true);
    setIsProductsChartLoading(true);
    try {
      console.log("Fetching data for range:", dayjs(start).format('YYYY-MM-DD'), "to", dayjs(end).format('YYYY-MM-DD'));
      
      const response = await axios.get('/admin/dashboard/sales-chart', {
        params: {
          start_date: dayjs(start).format('YYYY-MM-DD'),
          end_date: dayjs(end).format('YYYY-MM-DD')
        }
      });
      
      if (response.data) {
        console.log("Sales chart data received:", response.data);
        setSalesChartData(response.data);
        setExpenseChartData(response.data);
      }
      
      // Fetch top products data for the same date range
      const topProductsResponse = await axios.get('/admin/dashboard/top-products', {
        params: {
          start_date: dayjs(start).format('YYYY-MM-DD'),
          end_date: dayjs(end).format('YYYY-MM-DD'),
          limit: 10
        }
      });
      
      if (topProductsResponse.data) {
        console.log("Top products data received:", topProductsResponse.data);
        setTopProductsData(topProductsResponse.data);
      }
    } catch (error) {
      console.error('Error fetching chart data:', error);
      setSalesChartData([]);
      setExpenseChartData([]);
      setTopProductsData([]);
    } finally {
      setIsChartLoading(false);
      setIsExpenseChartLoading(false);
      setIsProductsChartLoading(false);
    }
  };
  
  // Handle date range change for the chart
  const handleDateRangeChange = (newStartDate, newEndDate) => {
    setStartDate(newStartDate);
    setEndDate(newEndDate);
    fetchSalesChartData(newStartDate, newEndDate);
  };

  useEffect(() => {
    // Initial data fetch
    fetchTodayStats();
    fetchSalesChartData(startDate, endDate);
    
    // Set up polling interval - refresh card data every 2 seconds
    refreshInterval.current = setInterval(() => {
      refreshCardData();
    }, 2000);
    
    // Cleanup function
    return () => {
      if (refreshInterval.current) {
        clearInterval(refreshInterval.current);
      }
    };
  }, []);

  // Format currency function
  const formatCurrency = (value) => {
    return `₱ ${(value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };
  
  // Create chart options
  const chartOptions = {
    chart: {
      type: 'line',
      toolbar: {
        show: false
      },
      fontFamily: 'Inter, sans-serif',
      background: 'transparent',
      zoom: {
        enabled: false
      }
    },
    colors: ['#10B981', '#3B82F6'], // green for gross, blue for net
    stroke: {
      curve: 'smooth',
      width: 3
    },
    markers: {
      size: 4,
      hover: {
        size: 6
      }
    },
    grid: {
      borderColor: '#374151',
      strokeDashArray: 5,
      xaxis: {
        lines: {
          show: true
        }
      },
      yaxis: {
        lines: {
          show: true
        }
      },
      padding: {
        top: 0,
        right: 10,
        bottom: 0,
        left: 10
      }
    },
    xaxis: {
      type: 'category',
      categories: salesChartData.map(item => dayjs(item.date).format('MMM DD')),
      labels: {
        style: {
          colors: '#9CA3AF',
          fontSize: '12px'
        }
      },
      axisBorder: {
        show: false
      },
      axisTicks: {
        show: false
      }
    },
    yaxis: {
      labels: {
        style: {
          colors: '#9CA3AF',
          fontSize: '12px'
        },
        formatter: (value) => formatCurrency(value)
      }
    },
    tooltip: {
      theme: 'dark',
      x: {
        show: true,
        formatter: (value, opts) => {
          return dayjs(salesChartData[opts.dataPointIndex].date).format('MMM DD, YYYY');
        }
      },
      y: {
        formatter: (value) => formatCurrency(value)
      },
      marker: {
        show: true
      }
    },
    legend: {
      position: 'top',
      horizontalAlign: 'right',
      labels: {
        colors: '#9CA3AF'
      }
    },
    dataLabels: {
      enabled: false
    },
    fill: {
      opacity: 0.05,
      type: 'solid'
    }
  };
  
  // Create chart series
  const chartSeries = [
    {
      name: 'Gross Sales',
      data: salesChartData.map(item => item.total_gross_sales || 0)
    },
    {
      name: 'Net Sales',
      data: salesChartData.map(item => item.total_net_sales || 0)
    }
  ];

  // Create expense chart options
  const expenseChartOptions = {
    chart: {
      type: 'line',
      toolbar: {
        show: false
      },
      fontFamily: 'Inter, sans-serif',
      background: 'transparent',
      zoom: {
        enabled: false
      }
    },
    colors: ['#F43F5E'], // Red for expenses
    stroke: {
      curve: 'smooth',
      width: 3
    },
    markers: {
      size: 4,
      hover: {
        size: 6
      }
    },
    grid: {
      borderColor: '#374151',
      strokeDashArray: 5,
      xaxis: {
        lines: {
          show: true
        }
      },
      yaxis: {
        lines: {
          show: true
        }
      },
      padding: {
        top: 0,
        right: 10,
        bottom: 0,
        left: 10
      }
    },
    xaxis: {
      type: 'category',
      categories: expenseChartData.map(item => dayjs(item.date).format('MMM DD')),
      labels: {
        style: {
          colors: '#9CA3AF',
          fontSize: '12px'
        }
      },
      axisBorder: {
        show: false
      },
      axisTicks: {
        show: false
      }
    },
    yaxis: {
      labels: {
        style: {
          colors: '#9CA3AF',
          fontSize: '12px'
        },
        formatter: (value) => formatCurrency(value)
      }
    },
    tooltip: {
      theme: 'dark',
      x: {
        show: true,
        formatter: (value, opts) => {
          return dayjs(expenseChartData[opts.dataPointIndex].date).format('MMM DD, YYYY');
        }
      },
      y: {
        formatter: (value) => formatCurrency(value)
      },
      marker: {
        show: true
      }
    },
    legend: {
      position: 'top',
      horizontalAlign: 'right',
      labels: {
        colors: '#9CA3AF'
      }
    },
    dataLabels: {
      enabled: false
    },
    fill: {
      opacity: 0.05,
      type: 'solid'
    }
  };
  
  // Create expense chart series
  const expenseChartSeries = [
    {
      name: 'Total Expenses',
      data: expenseChartData.map(item => item.total_expenses || 0)
    }
  ];

  // Top Products Chart Options
  const topProductsOptions = {
    chart: {
      type: 'bar',
      toolbar: {
        show: false
      },
      background: 'transparent',
    },
    colors: ['#6366F1'], // Indigo color for products
    plotOptions: {
      bar: {
        horizontal: true,
        borderRadius: 4,
        distributed: true,
        dataLabels: {
          position: 'top'
        },
      }
    },
    grid: {
      borderColor: '#374151',
      strokeDashArray: 5,
      xaxis: {
        lines: {
          show: true
        }
      },
      yaxis: {
        lines: {
          show: false
        }
      },
    },
    xaxis: {
      categories: topProductsData.map(item => item.product_name),
      labels: {
        style: {
          colors: '#9CA3AF',
          fontSize: '12px'
        }
      }
    },
    yaxis: {
      labels: {
        style: {
          colors: '#9CA3AF',
          fontSize: '12px',
        },
        maxWidth: 150,
        trim: true
      }
    },
    tooltip: {
      theme: 'dark',
      y: {
        formatter: (value) => `${value} items ordered`
      }
    },
    dataLabels: {
      enabled: false,
    },
    legend: {
      show: false // Hide legends
    }
  };

  // Top Products Chart Series
  const topProductsSeries = [
    {
      name: 'Quantity',
      data: topProductsData.map(item => item.total_quantity)
    }
  ];

  // Payment Method Distribution Chart Options - changed from donut to pie
  const paymentMethodOptions = {
    chart: {
      type: 'pie',
      background: 'transparent',
      foreColor: '#9CA3AF',
    },
    colors: ['#3B82F6', '#10B981', '#F43F5E', '#F59E0B'], // Blue, Green, Red, Yellow for payment methods
    labels: ['Cash', 'GCash', 'GrabFood', 'FoodPanda'],
    stroke: {
      width: 0
    },
    plotOptions: {
      pie: {
        expandOnClick: false,
        dataLabels: {
          offset: 0,
        }
      }
    },
    legend: {
      position: 'bottom',
      fontSize: '14px',
      horizontalAlign: 'center',
      labels: {
        colors: '#9CA3AF',
      },
      markers: {
        width: 12,
        height: 12,
        radius: 6,
      },
      itemMargin: {
        horizontal: 10,
        vertical: 5
      }
    },
    dataLabels: {
      enabled: true,
      formatter: (val, opts) => {
        return `${Math.round(val)}%`;
      },
      style: {
        fontSize: '12px',
        fontWeight: 'normal',
      },
      dropShadow: {
        enabled: false
      }
    },
    tooltip: {
      theme: 'dark',
      y: {
        formatter: (value) => formatCurrency(value)
      }
    },
    responsive: [{
      breakpoint: 480,
      options: {
        legend: {
          position: 'bottom',
        }
      }
    }]
  };

  // Calculate payment method series from the summary data - ensure non-zero values
  const calculatePaymentSeries = () => {
    console.log("Calculating payment series from data:", salesChartData);
    
    if (!salesChartData || salesChartData.length === 0) {
      console.log("No sales data available, using fallback values");
      return [1, 1, 1, 1]; // Fallback values
    }
    
    try {
      const walkIn = salesChartData.reduce((sum, item) => sum + (parseFloat(item.total_walk_in) || 0), 0);
      const gcash = salesChartData.reduce((sum, item) => sum + (parseFloat(item.total_gcash) || 0), 0);
      const grabfood = salesChartData.reduce((sum, item) => sum + (parseFloat(item.total_grabfood) || 0), 0);
      const foodpanda = salesChartData.reduce((sum, item) => sum + (parseFloat(item.total_foodpanda) || 0), 0);
      
      console.log("Payment values:", { walkIn, gcash, grabfood, foodpanda });
      
      // If all values are 0, return placeholder values to avoid empty chart
      const total = walkIn + gcash + grabfood + foodpanda;
      if (total === 0) {
        console.log("Total is zero, using fallback values");
        return [1, 1, 1, 1]; 
      }
      
      return [walkIn, gcash, grabfood, foodpanda];
    } catch (error) {
      console.error("Error calculating payment series:", error);
      return [1, 1, 1, 1]; // Fallback on error
    }
  };

  const paymentMethodSeries = calculatePaymentSeries();

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Dashboard" />
      <div className="flex flex-col gap-2 rounded-xl p-4">
        {/* Overview Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-2 mb-2">
          {/* First row - first card */}
          <div className="p-4 bg-gray-300 dark:bg-gray-800 rounded-xl text-black dark:text-white flex flex-col">
            <h3 className="text-lg font-semibold flex items-center">
              <Wallet className="w-5 h-5 text-purple-500 mr-2" />
              <span>Gross Sales</span>
            </h3>
            <p className="text-2xl font-medium mt-2">{formatCurrency(todayStats.total_gross_sales)}</p>
          </div>

          {/* First row - second card */}
          <div className="p-4 bg-gray-300 dark:bg-gray-800 rounded-xl text-black dark:text-white flex flex-col">
            <h3 className="text-lg font-semibold flex items-center">
              <CreditCard className="w-5 h-5 text-red-500 mr-2" />
              <span>Expenses</span>
            </h3>
            <p className="text-2xl font-medium mt-2">{formatCurrency(todayStats.total_expenses)}</p>
          </div>

          {/* First row - third card */}
          <div className="p-4 bg-gray-300 dark:bg-gray-800 rounded-xl text-black dark:text-white flex flex-col">
            <h3 className="text-lg font-semibold flex items-center">
              <PhilippinePeso className="w-5 h-5 text-blue-500 mr-2" />
              <span>Net Sales</span>
            </h3>
            <p className="text-2xl font-medium mt-2">{formatCurrency(todayStats.total_net_sales)}</p>
          </div>

          {/* First row - fourth card */}
          <div className="p-4 bg-gray-300 dark:bg-gray-800 rounded-xl text-black dark:text-white flex flex-col">
            <h3 className="text-lg font-semibold flex items-center">
              <BanknoteIcon className="w-5 h-5 text-green-500 mr-2" />
              <span>Deposited</span>
            </h3>
            <p className="text-2xl font-medium mt-2">{formatCurrency(todayStats.total_deposited)}</p>
          </div>

          {/* Second row - first card */}
          <div className="p-4 bg-gray-300 dark:bg-gray-800 rounded-xl text-black dark:text-white flex flex-col">
            <h3 className="text-lg font-semibold flex items-center">
              <Footprints className="w-5 h-5 text-yellow-500 mr-2" />
              <span>Walk-in</span>
            </h3>
            <p className="text-2xl font-medium mt-2">{formatCurrency(todayStats.total_walk_in)}</p>
          </div>

          {/* Second row - second card */}
          <div className="p-4 bg-gray-300 dark:bg-gray-800 rounded-xl text-black dark:text-white flex flex-col">
            <h3 className="text-lg font-semibold flex items-center">
              <div className="w-5 h-5 mr-2 flex items-center justify-center">
                <img src={GCashIcon} alt="GCash" className="w-5 h-5" />
              </div>
              <span>GCash</span>
            </h3>
            <p className="text-2xl font-medium mt-2">{formatCurrency(todayStats.total_gcash)}</p>
          </div>

          {/* Second row - third card */}
          <div className="p-4 bg-gray-300 dark:bg-gray-800 rounded-xl text-black dark:text-white flex flex-col">
            <h3 className="text-lg font-semibold flex items-center">
              <div className="w-5 h-5 mr-2 flex items-center justify-center">
                <img src={GrabFoodIcon} alt="GrabFood" className="w-5 h-5" />
              </div>
              <span>GrabFood</span>
            </h3>
            <p className="text-2xl font-medium mt-2">{formatCurrency(todayStats.total_grabfood)}</p>
          </div>

          {/* Second row - fourth card */}
          <div className="p-4 bg-gray-300 dark:bg-gray-800 rounded-xl text-black dark:text-white flex flex-col">
            <h3 className="text-lg font-semibold flex items-center">
              <div className="w-5 h-5 mr-2 flex items-center justify-center">
                <img src={FoodPandaIcon} alt="FoodPanda" className="w-5 h-5" />
              </div>
              <span>FoodPanda</span>
            </h3>
            <p className="text-2xl font-medium mt-2">{formatCurrency(todayStats.total_foodpanda)}</p>
          </div>
        </div>
        
        {/* Sales Chart Section */}
        <div className="bg-gray-300 dark:bg-gray-800 p-4 rounded-xl text-black dark:text-white">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Sales Performance</h3>
            <DateRangePicker
              startDate={startDate}
              endDate={endDate}
              onChange={handleDateRangeChange}
              buttonClassName="bg-gray-500 dark:bg-gray-700 rounded-lg flex items-center justify-center h-8"
            />
          </div>
          
          {isChartLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : salesChartData.length === 0 ? (
            <div className="flex justify-center items-center h-64 text-gray-500">
              No data available for the selected date range
            </div>
          ) : (
            <div className="h-80">
              <Chart
                options={chartOptions}
                series={chartSeries}
                type="area"
                height="100%"
              />
            </div>
          )}
        </div>
        
        {/* Expense Chart Section */}
        <div className="bg-gray-300 dark:bg-gray-800 p-4 rounded-xl text-black dark:text-white">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Expense Breakdown</h3>
          </div>
          
          {isExpenseChartLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500"></div>
            </div>
          ) : expenseChartData.length === 0 ? (
            <div className="flex justify-center items-center h-64 text-gray-500">
              No expense data available for the selected date range
            </div>
          ) : (
            <div className="h-80">
              <Chart
                options={expenseChartOptions}
                series={expenseChartSeries}
                type="area"
                height="100%"
              />
            </div>
          )}
        </div>
        
        {/* Two Column Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
          {/* Top Products Bar Chart */}
          <div className="bg-gray-300 dark:bg-gray-800 p-4 rounded-xl text-black dark:text-white">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Top Products</h3>
            </div>
            
            {isProductsChartLoading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
              </div>
            ) : topProductsData.length === 0 ? (
              <div className="flex justify-center items-center h-64 text-gray-500">
                No product data available for the selected date range
              </div>
            ) : (
              <div className="h-80">
                <Chart
                  options={topProductsOptions}
                  series={topProductsSeries}
                  type="bar"
                  height="100%"
                />
              </div>
            )}
          </div>
          
          {/* Payment Method Distribution Chart */}
          <div className="bg-gray-300 dark:bg-gray-800 p-4 rounded-xl text-black dark:text-white">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Payment Method Distribution</h3>
            </div>
            
            {isChartLoading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : salesChartData.length === 0 ? (
              <div className="flex justify-center items-center h-64 text-gray-500">
                No payment data available for the selected date range
              </div>
            ) : (
              <div className="h-80 flex items-center justify-center">
                {console.log("Rendering pie chart with series:", paymentMethodSeries)}
                <Chart
                  options={paymentMethodOptions}
                  series={paymentMethodSeries}
                  type="pie"
                  width="100%"
                  height="100%"
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
