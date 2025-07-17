import React, { useState, useEffect } from "react";
import { Eye, Check, X, Search, Bell, Filter, Settings } from "lucide-react";
import api from "../api/api";
import { useAlerts } from "../components/AlertSystem";
import { formatDateTime } from '../utils/dateUtils';

const AlertNotifications = () => {
  // Get alerts from context
  const { alerts: contextAlerts, markAsRead } = useAlerts();

  const [alerts, setAlerts] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [selectedPriority, setSelectedPriority] = useState("All");
  const [emailNotification, setEmailNotification] = useState(true);
  const [loading, setLoading] = useState(true);

  // Fetch all alerts (including read ones) when the component mounts
  useEffect(() => {
    const fetchAllAlerts = async () => {
      setLoading(true);
      try {
        const response = await api.get("/alerts");

        if (response.data.success) {
          setAlerts(response.data.data);
        }
      } catch (err) {
        console.error("Error fetching alerts:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAllAlerts();
  }, []);

  // Update local alerts when context alerts change
  useEffect(() => {
    if (contextAlerts.length > 0) {
      setAlerts(prevAlerts => {
        // Combine existing alerts with new ones from context
        const updatedAlerts = [...prevAlerts];

        contextAlerts.forEach(newAlert => {
          const existingIndex = updatedAlerts.findIndex(a => a._id === newAlert._id);
          if (existingIndex >= 0) {
            updatedAlerts[existingIndex] = newAlert;
          } else {
            updatedAlerts.unshift(newAlert);
          }
        });

        return updatedAlerts;
      });
    }
  }, [contextAlerts]);

  // Format date using the utility function

  const handleDismiss = async (id) => {
    try {
      await api.put(`/alerts/${id}/dismiss`, {});

      setAlerts(alerts.map(alert => alert._id === id ? { ...alert, status: "dismissed" } : alert));
    } catch (err) {
      console.error("Error dismissing alert:", err);
    }
  };

  const handleSolve = async (id) => {
    try {
      await api.put(`/alerts/${id}/resolve`, {});

      setAlerts(alerts.map(alert => alert._id === id ? { ...alert, status: "solved" } : alert));
    } catch (err) {
      console.error("Error resolving alert:", err);
    }
  };

  const handleView = (id) => {
    // Mark as read when viewed
    markAsRead(id);
  };

  const filteredAlerts = alerts.filter(alert => {
    const matchesSearch =
      alert.message?.toLowerCase().includes(searchText.toLowerCase()) ||
      alert._id?.toLowerCase().includes(searchText.toLowerCase());

    const matchesPriority = selectedPriority === "All" || alert.severity?.toUpperCase() === selectedPriority.toUpperCase();
    return matchesSearch && matchesPriority && alert.status !== "dismissed" && alert.status !== "solved";
  });

  const countByStatus = (status) => alerts.filter(a => a.status === status).length;
  const countHighPriority = alerts.filter(a => a.severity?.toUpperCase() === "HIGH" || a.severity?.toUpperCase() === "CRITICAL").length;

  const getPriorityBadge = (severity) => {
    const baseClasses = "px-2.5 py-0.5 rounded-full text-xs font-medium";
    if (!severity) return <span className={`${baseClasses} bg-gray-100 text-gray-800`}>Unknown</span>;

    switch (severity.toLowerCase()) {
      case "critical":
        return <span className={`${baseClasses} bg-red-100 text-red-800`}>Critical</span>;
      case "high":
        return <span className={`${baseClasses} bg-orange-100 text-orange-800`}>High</span>;
      case "medium":
        return <span className={`${baseClasses} bg-yellow-100 text-yellow-800`}>Medium</span>;
      case "low":
        return <span className={`${baseClasses} bg-green-100 text-green-800`}>Low</span>;
      default:
        return <span className={`${baseClasses} bg-gray-100 text-gray-800`}>{severity}</span>;
    }
  };

  return (
    <div className="p-4 sm:p-6 font-sans bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center">
            <Bell className="h-8 w-8 text-blue-600 mr-3" />
            <h1 className="text-2xl font-bold text-gray-900">Alert & Notifications</h1>
          </div>
          <p className="mt-1 text-sm text-gray-500">Manage and view system alerts and notifications</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left side - Alerts Table */}
          <div className="flex-1 transition-all duration-200">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-5 border-b border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-800 flex items-center">
                    <Bell size={18} className="mr-2 text-blue-600" />
                    Recent Alerts
                  </h2>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {filteredAlerts.length} Active
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 mb-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <input
                      type="text"
                      placeholder="Search alerts..."
                      value={searchText}
                      onChange={(e) => setSearchText(e.target.value)}
                      className="pl-10 w-full border border-gray-200 rounded-lg py-2 px-3 text-sm focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-all duration-200"
                    />
                  </div>
                  <div className="relative sm:w-48">
                    <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <select
                      value={selectedPriority}
                      onChange={(e) => setSelectedPriority(e.target.value)}
                      className="pl-10 w-full border border-gray-200 rounded-lg py-2 px-3 text-sm appearance-none focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-all duration-200 bg-white"
                    >
                      <option value="All">All Priorities</option>
                      <option value="Critical">Critical</option>
                      <option value="High">High</option>
                      <option value="Medium">Medium</option>
                      <option value="Low">Low</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                {loading ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <div className="w-12 h-12 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin"></div>
                    <p className="mt-4 text-sm text-gray-500">Loading alerts...</p>
                  </div>
                ) : filteredAlerts.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <div className="bg-gray-50 rounded-full p-3">
                      <Bell className="h-8 w-8 text-gray-400" />
                    </div>
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No alerts</h3>
                    <p className="mt-1 text-sm text-gray-500">No alerts match your current filters.</p>
                  </div>
                ) : (
                  <table className="min-w-full divide-y divide-gray-100">
                    <thead>
                      <tr className="bg-gray-50">
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Message</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Severity</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Timestamp</th>
                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                      {filteredAlerts.map((alert) => (
                        <tr key={alert._id} className={`hover:bg-gray-50 transition-colors duration-150 ${!alert.read ? 'bg-blue-50' : ''}`}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="font-medium text-gray-900">{alert._id?.substring(0, 8)}</span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900 max-w-md truncate">{alert.message}</div>
                            {alert.defectRate && (
                              <div className="text-xs text-gray-500 mt-1">
                                Defect rate: {alert.defectRate.toFixed(2)}% (Threshold: {alert.threshold}%)
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {getPriorityBadge(alert.severity)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDateTime(alert.createdAt)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex items-center justify-end space-x-3">
                              <button
                                onClick={() => handleView(alert._id)}
                                className="text-gray-500 hover:text-blue-600 transition-colors duration-150"
                                title="View Details"
                              >
                                <Eye size={18} />
                              </button>
                              <button
                                onClick={() => handleDismiss(alert._id)}
                                className="text-gray-500 hover:text-red-600 transition-colors duration-150"
                                title="Dismiss Alert"
                              >
                                <X size={18} />
                              </button>
                              <button
                                onClick={() => handleSolve(alert._id)}
                                className="text-gray-500 hover:text-green-600 transition-colors duration-150"
                                title="Mark as Solved"
                              >
                                <Check size={18} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>

          {/* Right side - Stats Cards */}
          <div className="w-full lg:w-80 space-y-5">
            {/* Alert Status Cards */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 shadow-sm border border-blue-200">
                <div className="text-sm font-medium text-blue-700 mb-1">Active Alerts</div>
                <div className="text-2xl font-bold text-blue-900">{alerts.filter(a => a.status !== 'dismissed' && a.status !== 'solved').length}</div>
              </div>
              <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-4 shadow-sm border border-red-200">
                <div className="text-sm font-medium text-red-700 mb-1">High Priority</div>
                <div className="text-2xl font-bold text-red-900">{countHighPriority}</div>
              </div>
              <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl p-4 shadow-sm border border-yellow-200">
                <div className="text-sm font-medium text-yellow-700 mb-1">Dismissed</div>
                <div className="text-2xl font-bold text-yellow-900">{countByStatus("dismissed")}</div>
              </div>
              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 shadow-sm border border-green-200">
                <div className="text-sm font-medium text-green-700 mb-1">Solved</div>
                <div className="text-2xl font-bold text-green-900">{countByStatus("solved")}</div>
              </div>
            </div>

            {/* Alert Configuration Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-800 flex items-center">
                  <Settings size={16} className="mr-2 text-gray-500" />
                  Alert Configuration
                </h3>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Email Notifications</span>
                  <button
                    onClick={() => setEmailNotification(!emailNotification)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${emailNotification ? "bg-blue-600" : "bg-gray-200"
                      }`}
                    role="switch"
                    aria-checked={emailNotification}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${emailNotification ? "translate-x-6" : "translate-x-1"
                        }`}
                    />
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Browser Notifications</span>
                  <button
                    onClick={() => {
                      if (Notification.permission !== 'granted') {
                        Notification.requestPermission();
                      }
                    }}
                    className="text-xs text-blue-600 hover:text-blue-800"
                  >
                    {Notification.permission === 'granted' ? "Enabled" : "Enable"}
                  </button>
                </div>
                <div className="pt-2 border-t border-gray-100">
                  <p className="text-xs text-gray-500">Alert thresholds are configured by system administrators.</p>
                </div>
              </div>
            </div>

            {/* Alert Source Distribution */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <h3 className="font-semibold text-gray-800 mb-4">Alert Sources</h3>
              <div className="space-y-3">
                {alerts.length > 0 && [
                  { name: "High Defect Rate", count: alerts.filter(a => a.type === 'high-defect-rate').length, color: "bg-red-500" },
                  { name: "Critical Defect", count: alerts.filter(a => a.type === 'critical-defect').length, color: "bg-orange-500" },
                  { name: "Inspection Failed", count: alerts.filter(a => a.type === 'inspection-failed').length, color: "bg-yellow-500" },
                  { name: "Other", count: alerts.filter(a => a.type === 'other').length, color: "bg-blue-500" }
                ].map((source, i) => (
                  <div key={i} className="flex items-center">
                    <div className="w-full">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-600">{source.name}</span>
                        <span className="text-gray-900 font-medium">{source.count}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`${source.color} h-2 rounded-full`}
                          style={{ width: `${alerts.length > 0 ? (source.count / alerts.length) * 100 : 0}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AlertNotifications;
