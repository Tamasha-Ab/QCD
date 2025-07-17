import React, { useState, useEffect } from "react";
import api from "../api/api";
import { useNavigate } from "react-router-dom";
import {
  FaTrash,
  FaFilter,
  FaPlus,
  FaSearch,
  FaExclamationTriangle,
  FaSpinner,
  FaTimes,
  FaUndo,
  FaEdit
} from "react-icons/fa";

const DefectManagement = () => {
  const navigate = useNavigate();
  const [defects, setDefects] = useState([]);
  const [filters, setFilters] = useState({
    status: "",
    type: "",
    dateRange: "",
    search: "",
  });
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // ✅ Fetch defects and ensure response is an array
  const fetchDefects = async () => {
    setFetchLoading(true);
    try {
      // Apply backend filters if needed
      const queryParams = new URLSearchParams();
      if (filters.status) queryParams.append('status', filters.status);
      if (filters.type) queryParams.append('type', filters.type);

      // Only add date params if we have a dateRange filter
      if (filters.dateRange) {
        const today = new Date();
        let startDate = new Date();

        // Calculate startDate based on the date range selection
        if (filters.dateRange === '7days') {
          startDate.setDate(today.getDate() - 7);
        } else if (filters.dateRange === '30days') {
          startDate.setDate(today.getDate() - 30);
        } else if (filters.dateRange === '90days') {
          startDate.setDate(today.getDate() - 90);
        }

        queryParams.append('startDate', startDate.toISOString().split('T')[0]);
        queryParams.append('endDate', today.toISOString().split('T')[0]);
      }

      const url = `/defects${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
      console.log("Fetching defects from:", url);

      const response = await api.get(url);

      const data = response.data;
      const defectArray = Array.isArray(data)
        ? data
        : Array.isArray(data.defects)
          ? data.defects
          : data.data || [];

      console.log("Fetched defects:", defectArray.length);
      setDefects(defectArray);
    } catch (error) {
      console.error("Failed to fetch defects", error.response?.data || error.message);
      setDefects([]);
      setError("Failed to load defects. Please try again.");
    } finally {
      setFetchLoading(false);
    }
  };

  useEffect(() => {
    fetchDefects();
  }, [filters.status, filters.type, filters.dateRange]); // Re-fetch when these filters change
  // eslint-disable-next-line react-hooks/exhaustive-deps

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  // Add delete defect function
  const handleDeleteDefect = async (id) => {
    if (!window.confirm("Are you sure you want to delete this defect?")) {
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      await api.delete(`/defects/${id}`);
      // Remove the deleted defect from state
      setDefects(defects.filter(defect => (defect.id || defect._id) !== id));
      // Show success message briefly
      setSuccess("Defect deleted successfully");
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error("Failed to delete defect:", error);
      setError(`Failed to delete defect: ${error.response?.data?.error || error.message}`);
      setTimeout(() => setError(null), 5000); // Clear error after 5 seconds
    } finally {
      setLoading(false);
    }
  };

  // Client-side filtering (for the search field)
  const filteredData = defects.filter((defect) => {
    // Only apply search filter here, other filters are applied via API
    const searchMatch = !filters.search ||
      defect.description?.toLowerCase().includes(filters.search.toLowerCase()) ||
      defect._id?.toLowerCase().includes(filters.search.toLowerCase()) ||
      defect.type?.toLowerCase().includes(filters.search.toLowerCase());

    return searchMatch;
  });

  // Reset all filters
  const clearFilters = () => {
    setFilters({
      status: "",
      type: "",
      dateRange: "",
      search: ""
    });
    setIsFilterOpen(false);
  };

  const getSeverityBadgeClass = (severity) => {
    switch (severity?.toLowerCase()) {
      case "critical":
        return "bg-red-100 text-red-800 border-red-300";
      case "major":
        return "bg-orange-100 text-orange-800 border-orange-300";
      case "minor":
        return "bg-green-100 text-green-800 border-green-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case "open":
        return "bg-green-100 text-green-800 border-green-300";
      case "investigating":
        return "bg-blue-100 text-blue-800 border-blue-300";
      case "resolved":
        return "bg-gray-100 text-gray-500 border-gray-300";
      case "rejected":
        return "bg-red-100 text-red-800 border-red-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  return (
    <div className="bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 min-h-screen">
      {/* Enhanced Top Header Bar - Normal positioning to scroll with content */}
      <div className="bg-white/95 backdrop-blur-sm shadow-lg border-b border-gray-200/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-4 md:py-6 gap-4 sm:gap-0">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-red-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg">
                <FaExclamationTriangle className="text-white text-lg" />
              </div>
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                  Defect Management
                </h1>
                <p className="text-sm text-gray-600 hidden sm:block">Track and manage quality control defects</p>
              </div>
            </div>
            <button
              onClick={() => navigate("/defects/log")}
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-sm font-semibold rounded-xl shadow-lg hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 transform hover:-translate-y-0.5 hover:shadow-xl"
            >
              <FaPlus className="mr-2" />
              Add New Defect
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area - Normal padding */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
                  className="ml-4 text-red-500 hover:text-red-700 hover:bg-red-100 p-2 rounded-lg transition-all duration-200"
                  onClick={() => setError(null)}
                >
                  <FaTimes />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Success message */}
        {success && (
          <div className="mb-6 bg-green-50/80 backdrop-blur-sm border border-green-200 rounded-xl shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-green-500 to-green-600 h-1"></div>
            <div className="p-4">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mr-4">
                  <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-green-800">Success</h3>
                  <p className="text-green-700 text-sm mt-1">{success}</p>
                </div>
                <button
                  className="ml-4 text-green-500 hover:text-green-700 hover:bg-green-100 p-2 rounded-lg transition-all duration-200"
                  onClick={() => setSuccess(null)}
                >
                  <FaTimes />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Search and Filter Bar */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 mb-6 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 px-6 py-4 border-b border-gray-100/50">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mr-3">
                <FaSearch className="text-white text-sm" />
              </div>
              <h2 className="text-lg font-semibold text-gray-800">Search & Filter Defects</h2>
            </div>
          </div>

          <div className="p-6">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-4 mb-6">
              {/* Enhanced Search field */}
              <div className="relative flex items-center w-full lg:max-w-md">
                <div className="absolute left-4 flex items-center pointer-events-none">
                  <FaSearch className="text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search defects by ID, description, or type..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange("search", e.target.value)}
                  className="pl-12 pr-4 py-3 border border-gray-300 rounded-xl w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 hover:border-gray-400 bg-white/70 backdrop-blur-sm shadow-sm"
                />
              </div>

              {/* Enhanced Control buttons */}
              <div className="flex items-center gap-3 w-full lg:w-auto">
                <button
                  onClick={() => setIsFilterOpen(!isFilterOpen)}
                  className={`flex items-center px-5 py-3 text-sm font-semibold rounded-xl shadow-lg transition-all duration-200 transform hover:-translate-y-0.5 ${isFilterOpen
                    ? "bg-gradient-to-r from-gray-600 to-gray-700 text-white shadow-xl"
                    : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 hover:shadow-xl"
                    }`}
                >
                  <FaFilter className="mr-2" />
                  Advanced Filters
                  <svg className={`ml-2 w-4 h-4 transition-transform duration-200 ${isFilterOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                <button
                  onClick={clearFilters}
                  className="flex items-center px-5 py-3 text-sm font-semibold bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl shadow-lg hover:from-orange-600 hover:to-orange-700 transition-all duration-200 transform hover:-translate-y-0.5 hover:shadow-xl"
                  disabled={!filters.status && !filters.type && !filters.dateRange && !filters.search}
                >
                  <FaUndo className="mr-2" />
                  Clear All
                </button>
                <button
                  onClick={fetchDefects}
                  className="flex items-center px-5 py-3 text-sm font-semibold bg-gradient-to-r from-gray-700 to-gray-800 text-white rounded-xl shadow-lg hover:from-gray-800 hover:to-gray-900 transition-all duration-200 transform hover:-translate-y-0.5 hover:shadow-xl"
                >
                  {fetchLoading ? <FaSpinner className="animate-spin mr-2" /> : <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>}
                  Refresh
                </button>
              </div>
            </div>

            {/* Enhanced Advanced filters - collapsible */}
            {isFilterOpen && (
              <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl p-6 border border-gray-200/50">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Enhanced Status Filter */}
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700 flex items-center">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                      Status Filter
                    </label>
                    <select
                      className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white/80 backdrop-blur-sm shadow-sm hover:shadow-md"
                      value={filters.status}
                      onChange={(e) => handleFilterChange("status", e.target.value)}
                    >
                      <option value="">All Statuses</option>
                      <option value="open">🟢 Open</option>
                      <option value="investigating">🔵 Investigating</option>
                      <option value="resolved">⚪ Resolved</option>
                      <option value="rejected">🔴 Rejected</option>
                    </select>
                  </div>

                  {/* Enhanced Type Filter */}
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700 flex items-center">
                      <div className="w-2 h-2 bg-purple-500 rounded-full mr-2"></div>
                      Type Filter
                    </label>
                    <select
                      className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white/80 backdrop-blur-sm shadow-sm hover:shadow-md"
                      value={filters.type}
                      onChange={(e) => handleFilterChange("type", e.target.value)}
                    >
                      <option value="">All Types</option>
                      <option value="visual">👁️ Visual</option>
                      <option value="functional">⚙️ Functional</option>
                      <option value="dimensional">📏 Dimensional</option>
                      <option value="structural">🏗️ Structural</option>
                      <option value="finish">✨ Finish</option>
                      <option value="material">🧱 Material</option>
                      <option value="assembly">🔧 Assembly</option>
                      <option value="electrical">⚡ Electrical</option>
                      <option value="mechanical">🔩 Mechanical</option>
                      <option value="other">📦 Other</option>
                    </select>
                  </div>

                  {/* Enhanced Date Range Filter */}
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700 flex items-center">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                      Date Range
                    </label>
                    <select
                      className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white/80 backdrop-blur-sm shadow-sm hover:shadow-md"
                      value={filters.dateRange}
                      onChange={(e) => handleFilterChange("dateRange", e.target.value)}
                    >
                      <option value="">All Time</option>
                      <option value="7days">📅 Last 7 days</option>
                      <option value="30days">🗓️ Last 30 days</option>
                      <option value="90days">📆 Last 90 days</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Enhanced Active filters display */}
            {(filters.status || filters.type || filters.dateRange) && (
              <div className="flex flex-wrap gap-3 mt-6 pt-4 border-t border-gray-200/50">
                <span className="text-sm font-medium text-gray-600 flex items-center">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                  Active Filters:
                </span>
                {filters.status && (
                  <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold bg-gradient-to-r from-green-100 to-green-200 text-green-800 border border-green-300 shadow-sm">
                    Status: {filters.status.charAt(0).toUpperCase() + filters.status.slice(1)}
                    <button
                      onClick={() => handleFilterChange("status", "")}
                      className="ml-2 text-green-600 hover:text-green-800 hover:bg-green-300 rounded-full p-0.5 transition-all duration-200"
                    >
                      <FaTimes className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {filters.type && (
                  <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold bg-gradient-to-r from-purple-100 to-purple-200 text-purple-800 border border-purple-300 shadow-sm">
                    Type: {filters.type.charAt(0).toUpperCase() + filters.type.slice(1)}
                    <button
                      onClick={() => handleFilterChange("type", "")}
                      className="ml-2 text-purple-600 hover:text-purple-800 hover:bg-purple-300 rounded-full p-0.5 transition-all duration-200"
                    >
                      <FaTimes className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {filters.dateRange && (
                  <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 border border-blue-300 shadow-sm">
                    Date: {filters.dateRange === '7days' ? 'Last 7 days' :
                      filters.dateRange === '30days' ? 'Last 30 days' : 'Last 90 days'}
                    <button
                      onClick={() => handleFilterChange("dateRange", "")}
                      className="ml-2 text-blue-600 hover:text-blue-800 hover:bg-blue-300 rounded-full p-0.5 transition-all duration-200"
                    >
                      <FaTimes className="w-3 h-3" />
                    </button>
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Enhanced Loading State */}
        {fetchLoading ? (
          <div className="flex justify-center items-center py-20">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-white/20">
              <div className="flex flex-col items-center space-y-4">
                <div className="relative">
                  <div className="w-16 h-16 border-4 border-blue-200 rounded-full animate-spin"></div>
                  <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
                </div>
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-gray-800">Loading Defects</h3>
                  <p className="text-gray-600 mt-1">Please wait while we fetch the latest data...</p>
                </div>
              </div>
            </div>
          </div>
        ) : filteredData.length > 0 ? (
          <>
            {/* Enhanced Desktop Table View */}
            <div className="hidden lg:block overflow-hidden bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20">
              <div className="bg-gradient-to-r from-gray-50 to-blue-50 px-6 py-4 border-b border-gray-100/50">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mr-3">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    </div>
                    Defects Overview
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
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">ID</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Description</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Type</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Severity</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Reported By</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Created</th>
                      <th className="px-6 py-4 text-right text-xs font-bold text-gray-600 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white/50 backdrop-blur-sm divide-y divide-gray-200/50">
                    {filteredData.map((defect, index) => (
                      <tr key={defect.id || defect._id} className={`hover:bg-blue-50/50 transition-all duration-200 ${index % 2 === 0 ? 'bg-white/30' : 'bg-gray-50/30'}`}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-8 h-8 bg-gradient-to-r from-gray-400 to-gray-500 rounded-lg flex items-center justify-center mr-2">
                              <span className="text-white text-xs font-bold">#{index + 1}</span>
                            </div>
                            <span className="text-sm font-mono text-gray-600 bg-gray-100 px-2 py-1 rounded border">
                              {(defect.id || defect._id)?.substring(0, 6)}...
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="max-w-xs">
                            <p className="text-sm text-gray-900 font-medium line-clamp-2">
                              {defect.description?.substring(0, 60) || "No description"}
                              {(defect.description?.length || 0) > 60 ? "..." : ""}
                            </p>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-3 py-1.5 inline-flex text-xs leading-5 font-semibold rounded-full bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 border border-blue-300 shadow-sm">
                            {defect.type?.charAt(0).toUpperCase() + defect.type?.slice(1) || "Unknown"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-3 py-1.5 inline-flex text-xs leading-5 font-semibold rounded-full border shadow-sm ${getSeverityBadgeClass(defect.severity)}`}>
                            {defect.severity?.charAt(0).toUpperCase() + defect.severity?.slice(1) || "Unknown"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-3 py-1.5 inline-flex text-xs leading-5 font-semibold rounded-full border shadow-sm ${getStatusBadgeClass(defect.status)}`}>
                            {defect.status?.charAt(0).toUpperCase() + defect.status?.slice(1) || "Unknown"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-6 h-6 bg-gradient-to-r from-green-400 to-green-500 rounded-full flex items-center justify-center mr-2">
                              <span className="text-white text-xs font-bold">
                                {(defect.reportedBy?.name || "U").charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <span className="text-sm text-gray-600">
                              {defect.reportedBy?.name || "Unknown"}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          <div className="flex flex-col">
                            <span className="font-medium">
                              {new Date(defect.createdAt || Date.now()).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric'
                              })}
                            </span>
                            <span className="text-xs text-gray-400">
                              {new Date(defect.createdAt || Date.now()).getFullYear()}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="flex justify-end space-x-2">
                            <button
                              onClick={() => navigate(`/defects/edit/${defect.id || defect._id}`)}
                              className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 group"
                              title="Edit defect"
                            >
                              <FaEdit className="h-4 w-4 group-hover:scale-110 transition-transform duration-200" />
                            </button>
                            <button
                              onClick={() => handleDeleteDefect(defect.id || defect._id)}
                              disabled={loading}
                              className="p-2 text-red-600 hover:text-red-800 hover:bg-red-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 transition-all duration-200 group disabled:opacity-50"
                              title="Delete defect"
                            >
                              <FaTrash className="h-4 w-4 group-hover:scale-110 transition-transform duration-200" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Enhanced Mobile Card View */}
            <div className="lg:hidden space-y-4">
              {filteredData.map((defect, index) => (
                <div key={defect.id || defect._id} className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 overflow-hidden transition-all duration-300 hover:shadow-xl hover:scale-[1.02]">
                  {/* Card Header */}
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 px-4 py-3 border-b border-gray-100/50">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                          <span className="text-white text-sm font-bold">#{index + 1}</span>
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="text-xs text-gray-500 font-mono bg-gray-100 px-2 py-1 rounded border">
                              {(defect.id || defect._id)?.substring(0, 10)}...
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => navigate(`/defects/edit/${defect.id || defect._id}`)}
                          className="p-2 text-blue-500 hover:bg-blue-100 rounded-lg transition-all duration-200 hover:scale-110"
                        >
                          <FaEdit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteDefect(defect.id || defect._id)}
                          disabled={loading}
                          className="p-2 text-red-500 hover:bg-red-100 rounded-lg transition-all duration-200 hover:scale-110 disabled:opacity-50"
                        >
                          <FaTrash className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-4 space-y-4">
                    {/* Description */}
                    <div>
                      <p className="text-sm font-medium text-gray-900 leading-relaxed">
                        {defect.description?.substring(0, 120) || "No description provided"}
                        {(defect.description?.length || 0) > 120 ? "..." : ""}
                      </p>
                    </div>

                    {/* Status Badges */}
                    <div className="flex flex-wrap gap-2">
                      <span className={`px-3 py-1.5 inline-flex text-xs leading-5 font-semibold rounded-full border shadow-sm ${getStatusBadgeClass(defect.status)}`}>
                        <div className="w-2 h-2 rounded-full bg-current mr-2 opacity-60"></div>
                        {defect.status?.charAt(0).toUpperCase() + defect.status?.slice(1) || "Unknown"}
                      </span>
                      <span className={`px-3 py-1.5 inline-flex text-xs leading-5 font-semibold rounded-full border shadow-sm ${getSeverityBadgeClass(defect.severity)}`}>
                        ⚠️ {defect.severity?.charAt(0).toUpperCase() + defect.severity?.slice(1) || "Unknown"}
                      </span>
                      <span className="px-3 py-1.5 inline-flex text-xs leading-5 font-semibold rounded-full bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 border border-blue-300 shadow-sm">
                        🏷️ {defect.type?.charAt(0).toUpperCase() + defect.type?.slice(1) || "Unknown"}
                      </span>
                    </div>

                    {/* Footer Info */}
                    <div className="flex justify-between items-center pt-3 border-t border-gray-100/50">
                      <div className="flex items-center space-x-2">
                        <div className="w-6 h-6 bg-gradient-to-r from-green-400 to-green-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs font-bold">
                            {(defect.reportedBy?.name || "U").charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <span className="text-xs text-gray-600 font-medium">
                          {defect.reportedBy?.name || "Unknown User"}
                        </span>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-gray-500">
                          {new Date(defect.createdAt || Date.now()).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </div>
                        <div className="text-xs text-gray-400">
                          {new Date(defect.createdAt || Date.now()).toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-12 text-center">
            <div className="max-w-md mx-auto">
              {/* Enhanced Empty State Icon */}
              <div className="relative inline-block mb-6">
                <div className="w-24 h-24 bg-gradient-to-r from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center shadow-lg">
                  <FaFilter className="h-12 w-12 text-gray-400" />
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
              </div>

              {/* Enhanced Empty State Content */}
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-gray-900">No defects found</h3>
                <p className="text-gray-600 leading-relaxed">
                  {filters.status || filters.type || filters.dateRange || filters.search ? (
                    <>
                      We couldn't find any defects matching your current filters.
                      <br />
                      <span className="text-sm text-gray-500">Try adjusting your search criteria or clearing filters</span>
                    </>
                  ) : (
                    <>
                      You haven't logged any defects yet.
                      <br />
                      <span className="text-sm text-gray-500">Start by creating your first defect report</span>
                    </>
                  )}
                </p>
              </div>

              {/* Enhanced Action Buttons */}
              <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
                {filters.status || filters.type || filters.dateRange || filters.search ? (
                  <>
                    <button
                      onClick={clearFilters}
                      className="inline-flex items-center px-6 py-3 border border-gray-300 shadow-lg text-sm font-semibold rounded-xl text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 transform hover:-translate-y-0.5"
                    >
                      <FaUndo className="mr-2" />
                      Clear All Filters
                    </button>
                    <button
                      onClick={() => navigate("/defects/log")}
                      className="inline-flex items-center px-6 py-3 border border-transparent shadow-lg text-sm font-semibold rounded-xl text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 transform hover:-translate-y-0.5"
                    >
                      <FaPlus className="mr-2" />
                      Log New Defect
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => navigate("/defects/log")}
                    className="inline-flex items-center px-8 py-4 border border-transparent shadow-lg text-base font-semibold rounded-xl text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 transform hover:-translate-y-0.5 hover:shadow-xl"
                  >
                    <FaPlus className="mr-3" />
                    Create Your First Defect Report
                  </button>
                )}
              </div>

              {/* Additional Help Text */}
              <div className="mt-6 text-xs text-gray-500">
                <p>Need help? Check our documentation or contact support</p>
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Results count */}
        {filteredData.length > 0 && (
          <div className="mt-6 flex justify-between items-center">
            <div className="text-sm text-gray-600 bg-white/60 backdrop-blur-sm px-4 py-2 rounded-xl border border-gray-200/50 shadow-sm">
              <span className="font-medium">Showing {filteredData.length}</span>
              <span className="mx-1">of</span>
              <span className="font-medium">{defects.length}</span>
              <span className="ml-1">{filteredData.length === 1 ? 'defect' : 'defects'}</span>
            </div>

            {/* Quick stats */}
            <div className="hidden sm:flex items-center space-x-4 text-xs text-gray-500">
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>{filteredData.filter(d => d.status === 'open').length} Open</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>{filteredData.filter(d => d.status === 'investigating').length} Investigating</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                <span>{filteredData.filter(d => d.status === 'resolved').length} Resolved</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Enhanced Loading overlay */}
      {loading && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white/90 backdrop-blur-sm p-8 rounded-2xl shadow-2xl max-w-sm w-full mx-4 border border-white/20">
            <div className="flex flex-col items-center space-y-4">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-blue-200 rounded-full animate-spin"></div>
                <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <FaTrash className="text-blue-600 text-lg" />
                </div>
              </div>
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-800">Processing Request</h3>
                <p className="text-gray-600 mt-1">Please wait while we handle your request...</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DefectManagement;
