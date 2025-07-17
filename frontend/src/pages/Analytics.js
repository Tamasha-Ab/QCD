import React, { useState, useEffect } from "react";
import api from "../api/api";
import { formatDate } from '../utils/dateUtils';
import { FaDownload, FaBoxOpen, FaUser, FaFilter, FaChartLine } from "react-icons/fa";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  CartesianGrid
} from "recharts";

// Fetch analytics data from backend with better error handling
const fetchStats = async (filters = {}) => {
  try {
    // Convert filter object to query parameters
    const queryParams = Object.entries(filters)
      .filter(([_, value]) => value)
      .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
      .join('&');

    const url = `/analytics${queryParams ? `?${queryParams}` : ''}`;
    const response = await api.get(url);
    console.log("Fetched analytics data:", response.data);
    return response.data;
  } catch (error) {
    console.error("❌ Failed to fetch analytics:", error);
    throw error;
  }
};

const AnalyticsPage = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    product: '',
  });
  const [products, setProducts] = useState([]);
  const [dateError, setDateError] = useState('');

  // Fetch products for filter dropdown
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await api.get("/products");
        if (response.data && response.data.success) {
          setProducts(response.data.data || []);
        }
      } catch (err) {
        console.error("Failed to fetch products for filter", err);
        // Don't set error state here, as this is not critical
      }
    };

    fetchProducts();
  }, []);

  // Fetch analytics data
  useEffect(() => {
    const getStats = async () => {
      try {
        setLoading(true);
        const data = await fetchStats(filters);

        if (data && data.success && data.data) {
          // Transform data for recharts components
          const transformedData = {
            ...data.data,
            passRate: parseFloat(100 - data.data.overallMetrics.overallDefectRate).toFixed(2),
            totalDefects: data.data.overallMetrics.totalDefectsFound,
            avgInspectionTime: "12.5 mins", // Example, replace with real data if available

            // Transform defect trends for charts
            defectTrendData: data.data.defectTrend.map(item => ({
              name: item.date,
              rate: parseFloat(item.defectRate),
              inspections: item.inspectionCount,
              defects: item.defectCount
            })),

            // Transform defect by types for bar chart
            defectCategories: data.data.defectsByType.map(item => ({
              name: item._id.charAt(0).toUpperCase() + item._id.slice(1),
              value: item.count
            })),

            // Transform defect by severity for pie chart
            defectSeverity: data.data.defectsBySeverity.map(item => ({
              name: item._id.charAt(0).toUpperCase() + item._id.slice(1),
              value: item.count
            })),

            // Transform inspector data
            inspectorPerformanceData: data.data.inspectorPerformance.map(inspector => ({
              name: inspector.inspectorName || 'Unknown',
              inspections: inspector.inspectionCount,
              defectRate: parseFloat(inspector.defectRate.toFixed(2))
            })),

            // Monthly trends
            monthlyData: data.data.monthlyTrend.map(month => ({
              name: month.period,
              inspections: month.inspectionCount,
              defectRate: parseFloat(month.defectRate.toFixed(2))
            }))
          };

          setStats(transformedData);
        } else {
          setError("Invalid data format received from server");
        }
      } catch (err) {
        console.error("Analytics fetch error:", err);
        setError("⚠️ Failed to load analytics data. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    getStats();
  }, [filters]);

  const handleExport = () => {
    if (!stats) return;

    try {
      // Create CSV content
      let csv = "Quality Metrics Report\n";
      csv += `Generated Date,${formatDate(new Date().toISOString())}\n\n`;
      csv += "Overall Metrics\n";
      csv += `Total Inspections,${stats.overallMetrics.totalInspections}\n`;
      csv += `Total Items Inspected,${stats.overallMetrics.totalItemsInspected}\n`;
      csv += `Total Defects Found,${stats.overallMetrics.totalDefectsFound}\n`;
      csv += `Overall Defect Rate,${stats.overallMetrics.overallDefectRate}%\n\n`;

      csv += "Defects by Type\n";
      stats.defectsByType.forEach(item => {
        csv += `${item._id},${item.count}\n`;
      });

      csv += "\nDefects by Severity\n";
      stats.defectsBySeverity.forEach(item => {
        csv += `${item._id},${item.count}\n`;
      });

      // Create and download CSV file
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "quality_analytics_report.csv");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("Export error:", err);
      alert("Failed to export data. Please try again.");
    }
  };

  // Validate date range
  const validateDateRange = (startDate, endDate) => {
    if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
      setDateError('End date cannot be earlier than start date');
      return false;
    }
    setDateError('');
    return true;
  };

  // Handle filter changes
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    const newFilters = { ...filters, [name]: value };

    // Clear date error when user starts typing
    if (name === 'startDate' || name === 'endDate') {
      setDateError('');
    }

    setFilters(newFilters);

    // Validate dates if both are present
    if (name === 'startDate' || name === 'endDate') {
      const startDate = name === 'startDate' ? value : filters.startDate;
      const endDate = name === 'endDate' ? value : filters.endDate;
      if (startDate && endDate) {
        validateDateRange(startDate, endDate);
      }
    }
  };

  const applyFilters = (e) => {
    e.preventDefault();

    // Validate date range before applying filters
    if (!validateDateRange(filters.startDate, filters.endDate)) {
      return; // Block filter application if validation fails
    }

    // The useEffect will re-run with the new filters
  };

  if (loading) return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-6">
      <div className="text-center">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto"></div>
        </div>
        <div className="mt-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Loading Analytics</h3>
          <p className="text-gray-600">Fetching your quality metrics...</p>
        </div>
      </div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
        <div className="bg-red-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
          <FaChartLine className="text-red-600 text-2xl" />
        </div>
        <h3 className="text-xl font-semibold text-gray-800 mb-2">Error Loading Analytics</h3>
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="bg-gradient-to-r from-red-600 to-pink-600 text-white px-6 py-2 rounded-lg hover:from-red-700 hover:to-pink-700 transition-all duration-200 font-medium"
        >
          Retry
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6">
        {/* Header Section */}
        <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-6 border border-gray-100">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="w-full sm:w-auto">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Quality Analysis Report
              </h1>
              <p className="text-sm sm:text-base text-gray-600 mt-1">Comprehensive insights into your quality metrics</p>
            </div>
            <button
              onClick={handleExport}
              className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              <FaDownload className="text-base sm:text-lg" />
              <span className="text-sm sm:text-base">Export Report</span>
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-6 border border-gray-100">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-4 sm:mb-6">
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl p-2 sm:p-3">
              <FaFilter className="text-white text-lg sm:text-xl" />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-gray-800">Filter Quality Metrics</h3>
          </div>

          {/* Date validation error message */}
          {dateError && (
            <div className="mb-4 p-3 sm:p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl">
              <div className="flex items-center gap-2">
                <div className="bg-red-100 rounded-full p-1">
                  <FaFilter className="text-red-600 text-xs sm:text-sm" />
                </div>
                <strong className="text-xs sm:text-sm">Error:</strong>
                <span className="text-xs sm:text-sm">{dateError}</span>
              </div>
            </div>
          )}

          <form onSubmit={applyFilters} className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">Start Date</label>
              <input
                type="date"
                name="startDate"
                value={filters.startDate}
                onChange={handleFilterChange}
                className={`w-full border rounded-xl px-3 sm:px-4 py-2 sm:py-3 text-sm focus:outline-none focus:ring-2 transition-all duration-200 ${dateError ? 'border-red-300 focus:ring-red-500 bg-red-50' : 'border-gray-200 focus:ring-blue-500 focus:border-blue-500'
                  }`}
              />
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">End Date</label>
              <input
                type="date"
                name="endDate"
                value={filters.endDate}
                onChange={handleFilterChange}
                className={`w-full border rounded-xl px-3 sm:px-4 py-2 sm:py-3 text-sm focus:outline-none focus:ring-2 transition-all duration-200 ${dateError ? 'border-red-300 focus:ring-red-500 bg-red-50' : 'border-gray-200 focus:ring-blue-500 focus:border-blue-500'
                  }`}
              />
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">Product</label>
              <select
                name="product"
                value={filters.product}
                onChange={handleFilterChange}
                className="w-full border border-gray-200 rounded-xl px-3 sm:px-4 py-2 sm:py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
              >
                <option value="">All Products</option>
                {products.map(product => (
                  <option key={product._id} value={product._id}>
                    {product.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-end">
              <button
                type="submit"
                disabled={!!dateError}
                className={`w-full px-4 sm:px-6 py-2 sm:py-3 rounded-xl font-medium text-sm sm:text-base transition-all duration-200 ${dateError
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5'
                  }`}
              >
                Apply Filters
              </button>
            </div>
          </form>
        </div>

        {/* Summary Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          <StatCard
            title="Overall pass rate"
            mainValue={`${stats?.passRate || 0}%`}
            change={stats?.overallMetrics?.overallDefectRate < 5 ? "Good" : "Needs Improvement"}
            changeColor={stats?.overallMetrics?.overallDefectRate < 5 ? "text-green-500" : "text-yellow-500"}
            subtitle="Based on defect rate"
            icon={<FaChartLine className="text-blue-500" />}
          />

          <StatCard
            title="Total defects found"
            mainValue={stats?.totalDefects || 0}
            change={`${stats?.defectsByType?.length || 0} different types`}
            changeColor="text-blue-500"
            subtitle="Across all inspections"
            icon={<FaBoxOpen className="text-red-500" />}
          />

          <StatCard
            title="Total inspections"
            mainValue={stats?.overallMetrics?.totalInspections || 0}
            change={`${stats?.overallMetrics?.totalItemsInspected || 0} items`}
            changeColor="text-green-500"
            subtitle="Items inspected"
            icon={<FaUser className="text-green-500" />}
          />
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
          {/* Defect Rate Trend Chart */}
          <ChartCard title="Defect Rate Trend" subtitle="Over time period">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={stats?.defectTrendData || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value) => `${value}%`} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="rate"
                  name="Defect Rate (%)"
                  stroke="#8884d8"
                  strokeWidth={2}
                  activeDot={{ r: 8 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Defect Categories Bar Chart */}
          <ChartCard title="Defects by Type" subtitle="Distribution of defect types">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats?.defectCategories || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" name="Count" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Defects by Severity */}
          <ChartCard title="Defects by Severity" subtitle="Critical, Major, Minor breakdown">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={stats?.defectSeverity || []}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {stats?.defectSeverity?.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.name === 'Critical' ? '#ff6384' :
                        entry.name === 'Major' ? '#ffce56' :
                          '#36a2eb'}
                    />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `${value} defects`} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Inspector Performance */}
          <ChartCard title="Inspector Performance" subtitle="Defect rates by inspector">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats?.inspectorPerformanceData || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                <Tooltip />
                <Legend />
                <Bar yAxisId="left" dataKey="inspections" name="Inspections" fill="#8884d8" />
                <Bar yAxisId="right" dataKey="defectRate" name="Defect Rate (%)" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* Monthly Trend Chart - Full Width */}
        <ChartCard title="Monthly Quality Metrics" subtitle="Inspections and defect rates by month">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={stats?.monthlyData || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
              <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
              <Tooltip />
              <Legend />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="inspections"
                name="Inspection Count"
                stroke="#8884d8"
                activeDot={{ r: 8 }}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="defectRate"
                name="Defect Rate (%)"
                stroke="#82ca9d"
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Product Rankings */}
        <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-6 border border-gray-100 hover:shadow-2xl transition-all duration-300">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-4 sm:mb-6">
            <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl p-2 sm:p-3">
              <FaBoxOpen className="text-white text-lg sm:text-xl" />
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-gray-800">Product Quality Ranking</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="bg-gradient-to-r from-gray-50 to-gray-100">
                  <th className="py-3 sm:py-4 px-3 sm:px-6 text-left text-xs sm:text-sm font-semibold text-gray-700 rounded-tl-xl">Product</th>
                  <th className="py-3 sm:py-4 px-3 sm:px-6 text-left text-xs sm:text-sm font-semibold text-gray-700 hidden sm:table-cell">Total Inspected</th>
                  <th className="py-3 sm:py-4 px-3 sm:px-6 text-left text-xs sm:text-sm font-semibold text-gray-700 hidden sm:table-cell">Defects Found</th>
                  <th className="py-3 sm:py-4 px-3 sm:px-6 text-left text-xs sm:text-sm font-semibold text-gray-700">Defect Rate</th>
                  <th className="py-3 sm:py-4 px-3 sm:px-6 text-left text-xs sm:text-sm font-semibold text-gray-700 rounded-tr-xl">Quality Rating</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {stats?.productDefectRates?.map((product, index) => (
                  <tr key={index} className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all duration-200">
                    <td className="py-3 sm:py-4 px-3 sm:px-6">
                      <div className="font-medium text-gray-800 text-xs sm:text-base">{product.productName}</div>
                      <div className="text-xs text-gray-500 sm:hidden">
                        {product.totalInspected} inspected • {product.totalDefects} defects
                      </div>
                    </td>
                    <td className="py-3 sm:py-4 px-3 sm:px-6 text-gray-600 text-xs sm:text-base hidden sm:table-cell">{product.totalInspected}</td>
                    <td className="py-3 sm:py-4 px-3 sm:px-6 text-gray-600 text-xs sm:text-base hidden sm:table-cell">{product.totalDefects}</td>
                    <td className="py-3 sm:py-4 px-3 sm:px-6 text-gray-600 text-xs sm:text-base font-medium">{product.defectRate.toFixed(2)}%</td>
                    <td className="py-3 sm:py-4 px-3 sm:px-6">
                      <QualityBadge rate={product.defectRate} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

// Component for stat cards
const StatCard = ({ title, mainValue, change, changeColor, subtitle, icon }) => (
  <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-6 border border-gray-100 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
    <div className="flex items-center justify-between mb-4">
      <div className="flex-1">
        <h3 className="text-xs sm:text-sm font-medium text-gray-600 uppercase tracking-wider mb-2">{title}</h3>
        <div className="flex flex-col sm:flex-row items-start sm:items-baseline gap-1 sm:gap-2">
          <p className="text-2xl sm:text-3xl font-bold text-gray-900">{mainValue}</p>
          <p className={`text-xs sm:text-sm font-medium ${changeColor}`}>{change}</p>
        </div>
        <p className="text-xs sm:text-sm text-gray-500 mt-1">{subtitle}</p>
      </div>
      {icon && (
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-3 sm:p-4 ml-3 sm:ml-4">
          <div className="text-xl sm:text-2xl">{icon}</div>
        </div>
      )}
    </div>
  </div>
);

// Component for chart containers
const ChartCard = ({ title, subtitle, children }) => (
  <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-6 border border-gray-100 hover:shadow-2xl transition-all duration-300">
    <div className="mb-4 sm:mb-6">
      <h3 className="text-base sm:text-lg font-bold text-gray-800 mb-1">{title}</h3>
      <p className="text-xs sm:text-sm text-gray-600">{subtitle}</p>
    </div>
    <div className="relative h-48 sm:h-64 lg:h-72">
      {children}
    </div>
  </div>
);

// Quality badge component
const QualityBadge = ({ rate }) => {
  let color, text, bgGradient;

  if (rate < 2) {
    color = 'text-green-800';
    text = 'Excellent';
    bgGradient = 'bg-gradient-to-r from-green-100 to-emerald-100 border-green-200';
  } else if (rate < 5) {
    color = 'text-blue-800';
    text = 'Good';
    bgGradient = 'bg-gradient-to-r from-blue-100 to-indigo-100 border-blue-200';
  } else if (rate < 10) {
    color = 'text-yellow-800';
    text = 'Average';
    bgGradient = 'bg-gradient-to-r from-yellow-100 to-amber-100 border-yellow-200';
  } else {
    color = 'text-red-800';
    text = 'Poor';
    bgGradient = 'bg-gradient-to-r from-red-100 to-pink-100 border-red-200';
  }

  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${bgGradient} ${color} shadow-sm`}>
      {text}
    </span>
  );
};

export default AnalyticsPage;
