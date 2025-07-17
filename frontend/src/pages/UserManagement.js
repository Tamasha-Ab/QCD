import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { directApi } from "../api/api";
import {
  FaUser,
  FaSearch,
  FaFilter,
  FaPlus,
  FaTrash,
  FaTimes,
  FaExclamationTriangle,
  FaUserShield,
  FaUserCog,
  FaClipboardCheck
} from "react-icons/fa";

const UserManagement = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("All Roles");
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showFilters, setShowFilters] = useState(false);

  // Fetch current user and user list on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Get current user
        const currentUserRes = await directApi.get("/api/auth/me");

        const loggedInUser = currentUserRes.data.data;
        setCurrentUser(loggedInUser);

        console.log("Current user:", loggedInUser);

        // Restrict access to admin only
        if (loggedInUser.role !== 'admin') {
          console.log("Access restricted - redirecting to dashboard");
          navigate('/dashboard');
          return;
        }

        // Only fetch users if current user is admin
        const usersRes = await directApi.get("/api/users");

        if (usersRes.data.success) {
          console.log("Users fetched:", usersRes.data.data);

          // Map users to include status (consider all users active for now)
          const mappedUsers = usersRes.data.data.map(user => ({
            ...user,
            status: "Active"
          }));

          setUsers(mappedUsers);
        }
      } catch (err) {
        console.error("Error fetching user data:", err);
        setError("Failed to load user data. Please try again.");

        // If unauthorized, redirect to login
        if (err.response && (err.response.status === 401 || err.response.status === 403)) {
          navigate('/login');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

  const handleDelete = async (index) => {
    const userToDelete = filteredUsers[index];

    // Create a modal-like confirmation instead of window.confirm
    if (!window.confirm(`Are you sure you want to delete ${userToDelete.name}?`)) {
      return;
    }

    try {
      await directApi.delete(`/api/users/${userToDelete._id}`);

      // Update local state after successful deletion
      setUsers(users.filter(user => user._id !== userToDelete._id));

    } catch (err) {
      console.error("Error deleting user:", err);
      setError("Failed to delete user: " + (err.response?.data?.error || "Unknown error"));
    }
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user.department && user.department.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesRole = roleFilter === "All Roles" || user.role === roleFilter.toLowerCase();
    return matchesSearch && matchesRole;
  });

  const getRoleIcon = (role) => {
    switch (role) {
      case 'admin':
        return <FaUserShield className="text-indigo-500" />;
      case 'manager':
        return <FaUserCog className="text-blue-500" />;
      case 'inspector':
        return <FaClipboardCheck className="text-green-500" />;
      default:
        return <FaUser className="text-gray-500" />;
    }
  };

  const getRoleBadgeClass = (role) => {
    switch (role) {
      case 'admin':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'manager':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'inspector':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const clearFilters = () => {
    setSearchQuery("");
    setRoleFilter("All Roles");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center p-4">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-2xl p-12 border border-white/20 text-center max-w-md">
          <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-white border-t-transparent"></div>
          </div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">Loading User Data</h3>
          <p className="text-gray-600 leading-relaxed">Please wait while we fetch user information...</p>
          <div className="mt-6 w-full bg-gray-200 rounded-full h-2">
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full animate-pulse" style={{ width: '70%' }}></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center p-4">
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl p-12 border border-white/20 max-w-md w-full">
          <div className="w-20 h-20 bg-gradient-to-r from-red-500 to-red-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <FaExclamationTriangle className="text-white text-2xl" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2 text-center">System Error</h2>
          <p className="text-gray-600 mb-8 text-center leading-relaxed">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white py-3 px-6 rounded-xl font-semibold shadow-lg transition-all duration-200 transform hover:-translate-y-0.5 hover:shadow-xl"
          >
            Retry Loading
          </button>
        </div>
      </div>
    );
  }

  // If current user is not admin, this component should not render
  if (currentUser && currentUser.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center p-4">
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl p-12 border border-white/20 max-w-md w-full">
          <div className="w-20 h-20 bg-gradient-to-r from-orange-500 to-red-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <FaExclamationTriangle className="text-white text-2xl" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2 text-center">Access Denied</h2>
          <p className="text-gray-600 mb-8 text-center leading-relaxed">
            This page is restricted to administrators only.
          </p>
          <button
            onClick={() => navigate('/dashboard')}
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-3 px-6 rounded-xl font-semibold shadow-lg transition-all duration-200 transform hover:-translate-y-0.5 hover:shadow-xl"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Enhanced Header Section - Normal positioning to scroll with content */}
      <div className="bg-white/95 backdrop-blur-sm shadow-lg border-b border-gray-200/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <FaUserShield className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                  User Management
                </h1>
                <p className="text-sm text-gray-600 hidden sm:block">Manage system users and permissions</p>
              </div>
            </div>
            <div className="flex items-center space-x-2 text-sm">
              <div className="bg-blue-100 text-blue-800 px-3 py-1.5 rounded-full font-medium">
                Total Users: {users.length}
              </div>
              <div className="bg-green-100 text-green-800 px-3 py-1.5 rounded-full font-medium">
                Admin Access
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Enhanced Search and Filter Section */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 mb-8 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 px-6 py-4 border-b border-gray-100/50">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mr-3">
                <FaSearch className="text-white text-sm" />
              </div>
              <h2 className="text-lg font-semibold text-gray-800">Search & Filter Users</h2>
            </div>
          </div>

          <div className="p-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
              <div className="relative flex-1 max-w-lg">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <FaSearch className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search by name, email, or department..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="block w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 hover:border-gray-400 bg-white/70 backdrop-blur-sm"
                />
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`inline-flex items-center px-5 py-3 text-sm font-semibold rounded-xl shadow-lg transition-all duration-200 transform hover:-translate-y-0.5 ${showFilters
                    ? 'bg-gradient-to-r from-gray-600 to-gray-700 text-white shadow-xl'
                    : 'border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 hover:shadow-xl'
                    }`}
                >
                  <FaFilter className="mr-2" />
                  Advanced Filters
                  <svg className={`ml-2 w-4 h-4 transition-transform duration-200 ${showFilters ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                <button
                  onClick={clearFilters}
                  className={`inline-flex items-center px-5 py-3 text-sm font-semibold bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl shadow-lg hover:from-orange-600 hover:to-orange-700 transition-all duration-200 transform hover:-translate-y-0.5 hover:shadow-xl ${!searchQuery && roleFilter === "All Roles" ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  disabled={!searchQuery && roleFilter === "All Roles"}
                >
                  <FaTimes className="mr-2" />
                  Clear All
                </button>

                <button
                  className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-sm font-semibold rounded-xl shadow-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 transform hover:-translate-y-0.5 hover:shadow-xl"
                  onClick={() => navigate("/user/add")}
                >
                  <FaPlus className="mr-2" />
                  Add User
                </button>
              </div>
            </div>

            {showFilters && (
              <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl p-6 border border-gray-200/50">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <label htmlFor="role-filter" className="text-sm font-semibold text-gray-700 flex items-center">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                      Filter by Role
                    </label>
                    <select
                      id="role-filter"
                      value={roleFilter}
                      onChange={(e) => setRoleFilter(e.target.value)}
                      className="block w-full pl-4 pr-10 py-3 text-base border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 rounded-xl transition-all duration-200 bg-white/80 backdrop-blur-sm shadow-sm hover:shadow-md"
                    >
                      <option>All Roles</option>
                      <option>admin</option>
                      <option>manager</option>
                      <option>inspector</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Enhanced Active filters */}
            {(searchQuery || roleFilter !== "All Roles") && (
              <div className="flex flex-wrap gap-3 mt-6 pt-4 border-t border-gray-200/50">
                <span className="text-sm font-medium text-gray-600 flex items-center">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                  Active Filters:
                </span>

                {searchQuery && (
                  <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 border border-gray-300 shadow-sm">
                    Search: {searchQuery}
                    <button
                      type="button"
                      onClick={() => setSearchQuery("")}
                      className="ml-2 text-gray-600 hover:text-gray-800 hover:bg-gray-300 rounded-full p-0.5 transition-all duration-200"
                    >
                      <FaTimes className="w-3 h-3" />
                    </button>
                  </span>
                )}

                {roleFilter !== "All Roles" && (
                  <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 border border-blue-300 shadow-sm">
                    Role: {roleFilter}
                    <button
                      type="button"
                      onClick={() => setRoleFilter("All Roles")}
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

        {/* Enhanced Users Table */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 overflow-hidden">
          {filteredUsers.length === 0 ? (
            <div className="bg-gradient-to-r from-gray-50 to-blue-50 px-6 py-4 border-b border-gray-100/50">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                <div className="w-8 h-8 bg-gradient-to-r from-gray-400 to-gray-500 rounded-lg flex items-center justify-center mr-3">
                  <FaUser className="w-4 h-4 text-white" />
                </div>
                No Users Found
              </h3>
            </div>
          ) : (
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 px-6 py-4 border-b border-gray-100/50">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mr-3">
                    <FaUserShield className="w-4 h-4 text-white" />
                  </div>
                  Users Overview
                </h3>
                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                  {filteredUsers.length} {filteredUsers.length === 1 ? 'user' : 'users'}
                </span>
              </div>
            </div>
          )}

          {filteredUsers.length === 0 ? (
            <div className="text-center py-20 px-4">
              <div className="mx-auto w-20 h-20 bg-gradient-to-r from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center mb-6">
                <FaUser className="h-10 w-10 text-gray-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">No users found</h3>
              <p className="text-gray-600 mb-8 max-w-md mx-auto leading-relaxed">
                {searchQuery || roleFilter !== "All Roles"
                  ? "Try adjusting your search filters to find what you're looking for."
                  : "Start by adding a new user to the system."}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                {searchQuery || roleFilter !== "All Roles" ? (
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="inline-flex items-center px-6 py-3 border border-gray-300 bg-white text-gray-700 text-sm font-semibold rounded-xl shadow-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 transform hover:-translate-y-0.5"
                  >
                    <FaTimes className="mr-2 h-4 w-4" />
                    Clear All Filters
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => navigate("/user/add")}
                    className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-sm font-semibold rounded-xl shadow-lg hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 transform hover:-translate-y-0.5 hover:shadow-xl"
                  >
                    <FaPlus className="mr-2 h-4 w-4" />
                    Add New User
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200/50">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                  <tr>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">User</th>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Email</th>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Role</th>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Department</th>
                    <th scope="col" className="px-6 py-4 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white/50 backdrop-blur-sm divide-y divide-gray-200/50">
                  {filteredUsers.map((user, index) => (
                    <tr key={user._id || index} className={`hover:bg-blue-50/50 transition-all duration-200 ${index % 2 === 0 ? 'bg-white/30' : 'bg-gray-50/30'}`}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-12 h-12 bg-gradient-to-r from-blue-400 to-purple-500 rounded-xl flex items-center justify-center shadow-lg">
                            <span className="font-bold text-white text-sm">
                              {user.name.charAt(0).toUpperCase()}
                              {user.name.split(' ')[1] ? user.name.split(' ')[1].charAt(0).toUpperCase() : ''}
                            </span>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-bold text-gray-900">{user.name}</div>
                            {user.status && (
                              <div className="mt-1">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-800 border border-green-300">
                                  {user.status}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 font-medium">{user.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold border shadow-sm ${getRoleBadgeClass(user.role)}`}>
                          <span className="mr-2">{getRoleIcon(user.role)}</span>
                          {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 font-medium">{user.department || '-'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        {currentUser._id !== user._id ? (
                          <button
                            onClick={() => handleDelete(index)}
                            className="inline-flex items-center p-2.5 text-red-600 hover:bg-red-50 rounded-xl transition-all duration-200 shadow-sm hover:shadow-md transform hover:scale-110"
                            title="Delete User"
                          >
                            <FaTrash className="h-4 w-4" />
                          </button>
                        ) : (
                          <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 border border-blue-300 shadow-sm">
                            Current User
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Enhanced Results count */}
        {filteredUsers.length > 0 && (
          <div className="mt-8 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 px-6 py-4">
            <div className="flex items-center text-sm text-gray-600">
              <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
              <span className="font-medium">
                Showing <span className="text-blue-600 font-bold">{filteredUsers.length}</span> of <span className="text-purple-600 font-bold">{users.length}</span> users
                {(searchQuery || roleFilter !== "All Roles") &&
                  <span className="text-gray-500"> (filtered)</span>
                }
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserManagement;
