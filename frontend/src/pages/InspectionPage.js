import React, { useState, useEffect } from "react";
import api from "../api/api";
import { useNavigate, useLocation } from "react-router-dom";
import {
  FaCalendarAlt,
  FaCheck,
  FaEye,
  FaTimes,
  FaSearch,
  FaFilter,
  FaSyncAlt,
  FaClipboardList,
  FaExclamationTriangle
} from "react-icons/fa";

// ✅ Set api to send cookies globally (this is already handled by the api instance)

const InspectionManagement = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [inspections, setInspections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    status: "",
    product: "",
    inspector: "",
    search: "",
  });
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Add state for confirmation dialog
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: null,
  });

  // ✅ Improved fetch inspections function with better data handling
  const fetchInspections = async () => {
    console.log("fetchInspections called");
    setLoading(true);
    setError(null);
    try {
      // Remove pagination limit to get all inspections
      const response = await api.get("/inspections?limit=100");

      console.log("Fetched inspections response:", response.data);

      // Better handle the response data structure
      if (response.data.success) {
        // Handle standard API format with success property
        const inspectionData = response.data.data || [];

        // Transform the data to match the component's expected format
        const formattedInspections = inspectionData.map(inspection => ({
          id: inspection._id,
          date: new Date(inspection.date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          }),
          product: inspection.product?.name || "Unknown Product",
          inspector: inspection.inspector?.name || "Unassigned",
          status: inspection.status.charAt(0).toUpperCase() + inspection.status.slice(1), // Capitalize first letter
          batchNumber: inspection.batchNumber,
          totalInspected: inspection.totalInspected,
          defectsFound: inspection.defectsFound || 0,
          rawData: inspection // Keep raw data for potential detail view
        }));

        console.log("Formatted inspections:", formattedInspections);
        setInspections(formattedInspections);
      } else {
        // Fallback for unexpected response format
        console.error("Unexpected API response format:", response.data);
        setInspections([]);
      }
    } catch (error) {
      console.error("Failed to fetch inspections", error.response?.data || error.message);
      setInspections([]); // fallback to empty array on failure
      setError("Failed to load inspections. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Fetch inspections on component mount and when location state indicates refresh needed
  useEffect(() => {
    fetchInspections();

    // Check if a new inspection was recently created
    const newInspectionFlag = localStorage.getItem('newInspectionCreated');
    if (newInspectionFlag) {
      console.log("New inspection flag detected, refreshing...");
      localStorage.removeItem('newInspectionCreated');
      // Add a small delay to ensure the backend has processed the new inspection
      setTimeout(() => {
        fetchInspections();
      }, 1500); // Increased delay
    }
  }, []);

  // Check if we need to refresh due to navigation state (e.g., after creating inspection)
  useEffect(() => {
    console.log("Navigation state effect triggered, location.state:", location.state);
    if (location.state?.refreshInspections) {
      console.log("Refreshing inspections due to navigation state");
      // Clear the state first to prevent loops
      navigate(location.pathname, { replace: true, state: {} });

      // Force a refresh with a delay to ensure backend processing
      setTimeout(() => {
        console.log("Delayed refresh after navigation");
        fetchInspections();
      }, 1000);
    }
  }, [location.state, location.pathname, navigate]);

  // Add effect to refetch data when component becomes visible again
  // This ensures the list updates when user returns from scheduling an inspection
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log("Page became visible, refreshing inspections");
        fetchInspections();
      }
    };

    const handleFocus = () => {
      console.log("Window focused, refreshing inspections");
      fetchInspections();
    };

    // Poll for new inspection flag every 2 seconds
    const pollForUpdates = () => {
      const newInspectionFlag = localStorage.getItem('newInspectionCreated');
      if (newInspectionFlag) {
        console.log("Polling detected new inspection flag, refreshing...");
        localStorage.removeItem('newInspectionCreated');
        fetchInspections();
      }
    };

    const pollInterval = setInterval(pollForUpdates, 2000);

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      clearInterval(pollInterval);
    };
  }, []);

  // Show confirm dialog helper function
  const showConfirmDialog = (title, message, onConfirm) => {
    setConfirmDialog({
      isOpen: true,
      title,
      message,
      onConfirm,
    });
  };

  // Complete inspection handler - updated to use the confirmation dialog
  const completeInspection = async (id) => {
    showConfirmDialog(
      "Complete Inspection",
      "Mark this inspection as complete?",
      async () => {
        setActionLoading(id);
        try {
          const response = await api.put(
            `/inspections/${id}/complete`,
            {}
          );

          if (response.data.success) {
            // Update local state to reflect the change
            setInspections(
              inspections.map(item =>
                item.id === id
                  ? {
                    ...item,
                    status: "Completed",
                  }
                  : item
              )
            );
          }
        } catch (error) {
          console.error("Failed to complete inspection:", error);
          setError(`Failed to complete inspection: ${error.response?.data?.error || error.message}`);
        } finally {
          setActionLoading(null);
        }
      }
    );
  };

  // Delete inspection handler - updated to use the confirmation dialog
  const deleteInspection = async (id) => {
    showConfirmDialog(
      "Delete Inspection",
      "Are you sure you want to delete this inspection? This action cannot be undone.",
      async () => {
        setActionLoading(id);
        try {
          // Make the delete request
          const response = await api.delete(
            `/inspections/${id}`
          );

          // If deletion is successful
          if (response.data.success) {
            // Remove the inspection from our local state
            setInspections(inspections.filter(item => (item.id || item._id) !== id));

            // Show success message briefly
            setError(null); // Clear any previous errors
          }
        } catch (error) {
          console.error("Failed to delete inspection:", error);

          // Show specific error message
          setError(`Failed to delete inspection: ${error.response?.data?.error || error.message}`);

          // Clear error message after 5 seconds
          setTimeout(() => setError(null), 5000);
        } finally {
          setActionLoading(null);
        }
      }
    );
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleScheduleClick = () => {
    navigate("/inspection/schedule");
  };

  const viewInspectionDetails = (id) => {
    // Navigate to a detail view (you'll need to implement this)
    // navigate(`/inspection/${id}`);
    console.log("View inspection details for ID:", id);
  };

  const getUnique = (key) => {
    const values = [...new Set(inspections.map((item) => item[key]))];
    // Sort alphabetically, but ensure "pending" comes first for status
    if (key === "status") {
      return values.sort((a, b) => {
        if (a === "Pending") return -1;
        if (b === "Pending") return 1;
        return a.localeCompare(b);
      });
    }
    return values.sort();
  };

  const filteredData = inspections.filter((item) => {
    const statusMatch = !filters.status || item.status === filters.status;
    const productMatch = !filters.product || item.product === filters.product;
    const inspectorMatch =
      !filters.inspector || item.inspector === filters.inspector;
    const searchMatch =
      !filters.search ||
      item.id.toLowerCase().includes(filters.search.toLowerCase()) ||
      item.product.toLowerCase().includes(filters.search.toLowerCase()) ||
      item.batchNumber?.toLowerCase().includes(filters.search.toLowerCase());

    return statusMatch && productMatch && inspectorMatch && searchMatch;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case "Completed":
        return "bg-green-100 text-green-800";
      case "Pending":
        return "bg-yellow-100 text-yellow-800";
      case "Failed":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const resetFilters = () => {
    setFilters({ status: "", product: "", inspector: "", search: "" });
  };

  // Add this function to force refresh
  const forceRefresh = async () => {
    console.log("Force refresh triggered");
    setLoading(true);
    setError(null);
    // Clear any cached data
    setInspections([]);

    // Wait a moment then fetch fresh data
    setTimeout(async () => {
      await fetchInspections();
    }, 200);
  };

  return (
    <div className="bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 min-h-screen">
      {/* Enhanced Page Header - Normal positioning to scroll with content */}
      <div className="bg-white/95 backdrop-blur-sm shadow-lg border-b border-gray-200/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-4 lg:py-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <FaClipboardList className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                  Inspection Management
                </h1>
                <p className="text-sm text-gray-600 hidden sm:block">Monitor and manage quality inspections</p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => {
                  console.log("Manual refresh clicked");
                  forceRefresh();
                }}
                disabled={loading}
                className="flex items-center justify-center px-4 py-2.5 bg-gradient-to-r from-gray-600 to-gray-700 text-white text-sm font-semibold rounded-xl shadow-lg hover:from-gray-700 hover:to-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-all duration-200 transform hover:-translate-y-0.5 disabled:opacity-50"
                title="Refresh inspection list"
              >
                <FaSyncAlt className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                {loading ? 'Refreshing...' : 'Refresh'}
              </button>
              <button
                onClick={handleScheduleClick}
                className="flex items-center justify-center px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-sm font-semibold rounded-xl shadow-lg hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 transform hover:-translate-y-0.5 hover:shadow-xl"
              >
                <FaCalendarAlt className="mr-2" />
                Schedule New Inspection
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Enhanced Error message */}
        {error && (
          <div className="mb-6 bg-red-50/80 backdrop-blur-sm border border-red-200 rounded-xl shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-red-500 to-red-600 h-1"></div>
            <div className="p-4">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center mr-4">
                  <FaExclamationTriangle className="text-red-500 text-lg" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-red-800">Error</h3>
                  <p className="text-red-700 text-sm mt-1">{error}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setError(null)}
                  className="ml-4 text-red-500 hover:text-red-700 hover:bg-red-100 p-2 rounded-lg transition-all duration-200"
                >
                  <FaTimes className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Confirmation Dialog */}
        {confirmDialog.isOpen && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-6 shadow-2xl max-w-md w-full mx-4 border border-white/20 animate-fade-in-down">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-100 to-blue-200 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{confirmDialog.title}</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">{confirmDialog.message}</p>
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  className="px-4 py-2.5 border border-gray-300 bg-white text-gray-700 text-sm font-medium rounded-xl shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200"
                  onClick={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-sm font-medium rounded-xl shadow-lg hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 transform hover:-translate-y-0.5"
                  onClick={() => {
                    if (confirmDialog.onConfirm) confirmDialog.onConfirm();
                    setConfirmDialog({ ...confirmDialog, isOpen: false });
                  }}
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Filter Section */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 mb-6 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 px-6 py-4 border-b border-gray-100/50">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mr-3">
                <FaSearch className="text-white text-sm" />
              </div>
              <h2 className="text-lg font-semibold text-gray-800">Search & Filter Inspections</h2>
            </div>
          </div>

          <div className="p-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
              {/* Enhanced Search Field */}
              <div className="relative flex-grow max-w-lg">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <FaSearch className="text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search by ID, product, or batch number..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange("search", e.target.value)}
                  className="block w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 hover:border-gray-400 bg-white/70 backdrop-blur-sm"
                />
              </div>

              {/* Enhanced Toggle Filters Button */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsFilterOpen(!isFilterOpen)}
                  className={`inline-flex items-center px-5 py-3 text-sm font-semibold rounded-xl shadow-lg transition-all duration-200 transform hover:-translate-y-0.5 ${isFilterOpen
                    ? 'bg-gradient-to-r from-gray-600 to-gray-700 text-white shadow-xl'
                    : 'border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 hover:shadow-xl'
                    }`}
                >
                  <FaFilter className="mr-2" />
                  Advanced Filters
                  <svg className={`ml-2 w-4 h-4 transition-transform duration-200 ${isFilterOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                <button
                  onClick={resetFilters}
                  className="inline-flex items-center px-5 py-3 text-sm font-semibold bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl shadow-lg hover:from-orange-600 hover:to-orange-700 transition-all duration-200 transform hover:-translate-y-0.5 hover:shadow-xl"
                  disabled={!filters.status && !filters.product && !filters.inspector && !filters.search}
                >
                  <FaTimes className="mr-2" />
                  Clear All
                </button>
              </div>
            </div>

            {/* Enhanced Advanced Filters - Collapsible */}
            {isFilterOpen && (
              <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl p-6 border border-gray-200/50">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <label htmlFor="status-filter" className="text-sm font-semibold text-gray-700 flex items-center">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                      Status Filter
                    </label>
                    <select
                      id="status-filter"
                      className="block w-full pl-4 pr-10 py-3 text-base border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 rounded-xl transition-all duration-200 bg-white/80 backdrop-blur-sm shadow-sm hover:shadow-md"
                      value={filters.status}
                      onChange={(e) => handleFilterChange("status", e.target.value)}
                    >
                      <option value="">All Statuses</option>
                      {getUnique("status").map((status) => (
                        <option key={status} value={status}>
                          {status === "Pending" ? "🟡 Pending" : status === "Completed" ? "✅ Completed" : status === "Failed" ? "❌ Failed" : status}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="product-filter" className="text-sm font-semibold text-gray-700 flex items-center">
                      <div className="w-2 h-2 bg-purple-500 rounded-full mr-2"></div>
                      Product Filter
                    </label>
                    <select
                      id="product-filter"
                      className="block w-full pl-4 pr-10 py-3 text-base border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 rounded-xl transition-all duration-200 bg-white/80 backdrop-blur-sm shadow-sm hover:shadow-md"
                      value={filters.product}
                      onChange={(e) => handleFilterChange("product", e.target.value)}
                    >
                      <option value="">All Products</option>
                      {getUnique("product").map((product) => (
                        <option key={product} value={product}>📦 {product}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="inspector-filter" className="text-sm font-semibold text-gray-700 flex items-center">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                      Inspector Filter
                    </label>
                    <select
                      id="inspector-filter"
                      className="block w-full pl-4 pr-10 py-3 text-base border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 rounded-xl transition-all duration-200 bg-white/80 backdrop-blur-sm shadow-sm hover:shadow-md"
                      value={filters.inspector}
                      onChange={(e) => handleFilterChange("inspector", e.target.value)}
                    >
                      <option value="">All Inspectors</option>
                      {getUnique("inspector").map((inspector) => (
                        <option key={inspector} value={inspector}>👤 {inspector}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Enhanced Active Filters */}
            {(filters.status || filters.product || filters.inspector || filters.search) && (
              <div className="flex flex-wrap gap-3 mt-6 pt-4 border-t border-gray-200/50">
                <span className="text-sm font-medium text-gray-600 flex items-center">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                  Active Filters:
                </span>
                {filters.status && (
                  <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 border border-blue-300 shadow-sm">
                    Status: {filters.status}
                    <button
                      type="button"
                      onClick={() => handleFilterChange("status", "")}
                      className="ml-2 text-blue-600 hover:text-blue-800 hover:bg-blue-300 rounded-full p-0.5 transition-all duration-200"
                    >
                      <FaTimes className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {filters.product && (
                  <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold bg-gradient-to-r from-purple-100 to-purple-200 text-purple-800 border border-purple-300 shadow-sm">
                    Product: {filters.product}
                    <button
                      type="button"
                      onClick={() => handleFilterChange("product", "")}
                      className="ml-2 text-purple-600 hover:text-purple-800 hover:bg-purple-300 rounded-full p-0.5 transition-all duration-200"
                    >
                      <FaTimes className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {filters.inspector && (
                  <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold bg-gradient-to-r from-green-100 to-green-200 text-green-800 border border-green-300 shadow-sm">
                    Inspector: {filters.inspector}
                    <button
                      type="button"
                      onClick={() => handleFilterChange("inspector", "")}
                      className="ml-2 text-green-600 hover:text-green-800 hover:bg-green-300 rounded-full p-0.5 transition-all duration-200"
                    >
                      <FaTimes className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {filters.search && (
                  <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 border border-gray-300 shadow-sm">
                    Search: {filters.search}
                    <button
                      type="button"
                      onClick={() => handleFilterChange("search", "")}
                      className="ml-2 text-gray-600 hover:text-gray-800 hover:bg-gray-300 rounded-full p-0.5 transition-all duration-200"
                    >
                      <FaTimes className="w-3 h-3" />
                    </button>
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Enhanced loading state */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-white/20">
              <div className="flex flex-col items-center space-y-4">
                <div className="relative">
                  <div className="w-16 h-16 border-4 border-blue-200 rounded-full animate-spin"></div>
                  <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
                </div>
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-gray-800">Loading Inspections</h3>
                  <p className="text-gray-600 mt-1">Please wait while we fetch the latest data...</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Inspections Table - Desktop */}
        {!loading && filteredData.length > 0 && (
          <div className="hidden lg:block bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 overflow-hidden">
            <div className="bg-gradient-to-r from-gray-50 to-blue-50 px-6 py-4 border-b border-gray-100/50">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mr-3">
                    <FaClipboardList className="w-4 h-4 text-white" />
                  </div>
                  Inspections Overview
                </h3>
                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                  {filteredData.length} {filteredData.length === 1 ? 'item' : 'items'}
                </span>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200/50">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                  <tr>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">ID</th>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Date</th>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Batch Number</th>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Product</th>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Inspector</th>
                    <th scope="col" className="px-6 py-4 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">Inspected</th>
                    <th scope="col" className="px-6 py-4 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">Defects</th>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Status</th>
                    <th scope="col" className="px-6 py-4 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white/50 backdrop-blur-sm divide-y divide-gray-200/50">
                  {filteredData.map((item, index) => (
                    <tr key={item.id} className={`hover:bg-blue-50/50 transition-all duration-200 ${index % 2 === 0 ? 'bg-white/30' : 'bg-gray-50/30'}`}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-gradient-to-r from-gray-400 to-gray-500 rounded-lg flex items-center justify-center mr-2">
                            <span className="text-white text-xs font-bold">#{index + 1}</span>
                          </div>
                          <span className="text-sm font-mono text-gray-600 bg-gray-100 px-2 py-1 rounded border">
                            {item.id.substring(0, 8)}...
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-medium">
                        {item.date}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-medium">
                          {item.batchNumber || "N/A"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                        {item.product}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        <div className="flex items-center">
                          <div className="w-6 h-6 bg-gradient-to-r from-green-400 to-green-500 rounded-full flex items-center justify-center mr-2">
                            <span className="text-white text-xs font-bold">
                              {item.inspector.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          {item.inspector}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 text-center">
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-bold">
                          {item.totalInspected}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 text-center">
                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${item.defectsFound > 0 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                          }`}>
                          {item.defectsFound}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1.5 inline-flex text-xs leading-5 font-semibold rounded-full border shadow-sm ${getStatusColor(item.status)}`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-center">
                        <div className="flex justify-center space-x-2">
                          {item.status === "Pending" && (
                            <button
                              title="Complete Inspection"
                              className="p-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-all duration-200 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transform hover:scale-110"
                              onClick={() => completeInspection(item.id)}
                              disabled={actionLoading === item.id}
                            >
                              {actionLoading === item.id ? (
                                <span className="inline-block w-4 h-4 border-2 border-green-600 border-t-transparent rounded-full animate-spin"></span>
                              ) : (
                                <FaCheck className="h-4 w-4" />
                              )}
                            </button>
                          )}

                          <button
                            title="Delete Inspection"
                            className="p-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-all duration-200 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transform hover:scale-110"
                            onClick={() => deleteInspection(item.id)}
                            disabled={actionLoading === item.id}
                          >
                            {actionLoading === item.id ? (
                              <span className="inline-block w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></span>
                            ) : (
                              <FaTimes className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Enhanced Inspections Cards - Mobile View */}
        {!loading && filteredData.length > 0 && (
          <div className="lg:hidden space-y-6">
            <div className="bg-gradient-to-r from-gray-50 to-blue-50 px-4 py-3 rounded-xl border border-gray-200/50">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mr-3">
                  <FaClipboardList className="w-4 h-4 text-white" />
                </div>
                Inspections Overview
                <span className="ml-auto px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                  {filteredData.length} {filteredData.length === 1 ? 'item' : 'items'}
                </span>
              </h3>
            </div>
            {filteredData.map((item, index) => (
              <div key={item.id} className="bg-white/90 backdrop-blur-sm shadow-xl rounded-2xl overflow-hidden border border-white/20 transform transition-all duration-200 hover:shadow-2xl hover:-translate-y-1">
                {/* Enhanced Card Header */}
                <div className="bg-gradient-to-r from-blue-50 via-purple-50 to-indigo-50 px-6 py-4 border-b border-gray-100/50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-gray-400 to-gray-500 rounded-xl flex items-center justify-center shadow-lg">
                        <span className="text-white text-sm font-bold">#{index + 1}</span>
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 leading-6">
                          {item.product}
                        </h3>
                        <p className="text-sm text-gray-600 font-mono bg-gray-100 px-2 py-0.5 rounded border inline-block">
                          ID: {item.id.substring(0, 8)}...
                        </p>
                      </div>
                    </div>
                    <span className={`px-3 py-1.5 text-xs font-bold rounded-full shadow-sm border ${getStatusColor(item.status)}`}>
                      {item.status}
                    </span>
                  </div>
                </div>

                {/* Enhanced Card Body */}
                <div className="px-6 py-5">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <div className="flex items-center p-3 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl border border-yellow-200/50">
                        <div className="w-2 h-2 bg-yellow-500 rounded-full mr-3"></div>
                        <div>
                          <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Batch</span>
                          <p className="text-sm font-bold text-gray-900">{item.batchNumber || "N/A"}</p>
                        </div>
                      </div>

                      <div className="flex items-center p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200/50">
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                        <div>
                          <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Inspector</span>
                          <p className="text-sm font-bold text-gray-900 flex items-center">
                            <div className="w-5 h-5 bg-gradient-to-r from-green-400 to-green-500 rounded-full flex items-center justify-center mr-2">
                              <span className="text-white text-xs font-bold">
                                {item.inspector.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            {item.inspector}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center p-3 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl border border-blue-200/50">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                        <div>
                          <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Inspected</span>
                          <p className="text-sm font-bold text-blue-800">
                            {item.totalInspected} items
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center p-3 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl border border-purple-200/50">
                        <div className="w-2 h-2 bg-purple-500 rounded-full mr-3"></div>
                        <div>
                          <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Date</span>
                          <p className="text-sm font-bold text-gray-900">{item.date}</p>
                        </div>
                      </div>

                      <div className="flex items-center p-3 bg-gradient-to-r from-red-50 to-pink-50 rounded-xl border border-red-200/50">
                        <div className="w-2 h-2 bg-red-500 rounded-full mr-3"></div>
                        <div>
                          <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Defects</span>
                          <p className={`text-sm font-bold ${item.defectsFound > 0 ? 'text-red-800' : 'text-green-800'}`}>
                            {item.defectsFound} found
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Enhanced Card Actions */}
                <div className="bg-gradient-to-r from-gray-50 to-blue-50 px-6 py-4 border-t border-gray-100/50">
                  <div className="flex flex-wrap gap-3 justify-end">
                    {item.status === "Pending" && (
                      <button
                        title="Complete Inspection"
                        className="inline-flex items-center px-4 py-2.5 bg-gradient-to-r from-green-600 to-green-700 text-white text-sm font-semibold rounded-xl shadow-lg hover:from-green-700 hover:to-green-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-200 transform hover:-translate-y-0.5 disabled:opacity-50"
                        onClick={() => completeInspection(item.id)}
                        disabled={actionLoading === item.id}
                      >
                        {actionLoading === item.id ? (
                          <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>
                        ) : (
                          <FaCheck className="mr-2 h-4 w-4" />
                        )}
                        Complete
                      </button>
                    )}
                    <button
                      title="View Details"
                      className="inline-flex items-center px-4 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-sm font-semibold rounded-xl shadow-lg hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 transform hover:-translate-y-0.5"
                      onClick={() => viewInspectionDetails(item.id)}
                    >
                      <FaEye className="mr-2 h-4 w-4" />
                      Details
                    </button>
                    <button
                      title="Delete Inspection"
                      className="inline-flex items-center px-4 py-2.5 bg-gradient-to-r from-red-600 to-red-700 text-white text-sm font-semibold rounded-xl shadow-lg hover:from-red-700 hover:to-red-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all duration-200 transform hover:-translate-y-0.5 disabled:opacity-50"
                      onClick={() => deleteInspection(item.id)}
                      disabled={actionLoading === item.id}
                    >
                      {actionLoading === item.id ? (
                        <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>
                      ) : (
                        <FaTimes className="mr-2 h-4 w-4" />
                      )}
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Enhanced Empty State */}
        {!loading && filteredData.length === 0 && (
          <div className="bg-white/90 backdrop-blur-sm shadow-xl rounded-2xl border border-white/20 overflow-hidden">
            <div className="bg-gradient-to-r from-gray-50 to-blue-50 px-6 py-4 border-b border-gray-100/50">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                <div className="w-8 h-8 bg-gradient-to-r from-gray-400 to-gray-500 rounded-lg flex items-center justify-center mr-3">
                  <FaClipboardList className="w-4 h-4 text-white" />
                </div>
                No Inspections Found
              </h3>
            </div>
            <div className="p-12 text-center">
              <div className="mx-auto w-20 h-20 bg-gradient-to-r from-blue-100 to-purple-100 rounded-2xl flex items-center justify-center mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">No inspections found</h3>
              <p className="text-gray-600 mb-8 max-w-md mx-auto leading-relaxed">
                {filters.status || filters.product || filters.inspector || filters.search ?
                  "Try adjusting your search filters to find what you're looking for." :
                  "Start by scheduling your first inspection to begin quality monitoring."}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                {filters.status || filters.product || filters.inspector || filters.search ? (
                  <button
                    type="button"
                    onClick={resetFilters}
                    className="inline-flex items-center px-6 py-3 border border-gray-300 bg-white text-gray-700 text-sm font-semibold rounded-xl shadow-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 transform hover:-translate-y-0.5"
                  >
                    <FaTimes className="mr-2 h-4 w-4" />
                    Clear All Filters
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleScheduleClick}
                    className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-sm font-semibold rounded-xl shadow-lg hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 transform hover:-translate-y-0.5 hover:shadow-xl"
                  >
                    <FaCalendarAlt className="mr-2 h-4 w-4" aria-hidden="true" />
                    Schedule Your First Inspection
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Results count and refresh button */}
        {!loading && filteredData.length > 0 && (
          <div className="mt-8 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 px-6 py-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center text-sm text-gray-600">
                <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                <span className="font-medium">
                  Showing <span className="text-blue-600 font-bold">{filteredData.length}</span> inspection{filteredData.length !== 1 && 's'}
                  {(filters.status || filters.product || filters.inspector || filters.search) &&
                    <span className="text-gray-500"> (filtered)</span>
                  }
                </span>
              </div>
              <button
                onClick={fetchInspections}
                disabled={loading}
                className="inline-flex items-center px-5 py-2.5 bg-gradient-to-r from-gray-600 to-gray-700 text-white text-sm font-semibold rounded-xl shadow-lg hover:from-gray-700 hover:to-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-all duration-200 transform hover:-translate-y-0.5 disabled:opacity-50"
                title="Refresh inspection data"
              >
                {loading ? (
                  <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>
                ) : (
                  <FaSyncAlt className="mr-2 h-4 w-4" />
                )}
                {loading ? 'Refreshing...' : 'Refresh Data'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InspectionManagement;
