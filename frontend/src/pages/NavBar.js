import React, { useState, useEffect } from "react";
import { NavLink, Outlet, Link } from "react-router-dom";
import logo from "../images/logo1.jpg";
import { User, Menu, X, Sun, Moon } from "lucide-react";
import { directApi } from "../api/api";
import { AlertBell, AlertDropdown, useAlerts } from "../components/AlertSystem";

const NavBar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(
    localStorage.getItem("theme") === "dark" ||
    (!localStorage.getItem("theme") && window.matchMedia("(prefers-color-scheme: dark)").matches)
  );
  const [alertsOpen, setAlertsOpen] = useState(false);
  const { unreadCount } = useAlerts();

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [darkMode]);

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const response = await directApi.get("/api/auth/me");

        if (response.data.success) {
          setCurrentUser(response.data.data);
        }
      } catch (error) {
        console.error("Failed to fetch user info:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCurrentUser();

    // Refresh user data when window gains focus (e.g., when user returns from profile page)
    const handleFocus = () => {
      fetchCurrentUser();
    };

    // Listen for profile updates
    const handleProfileUpdate = () => {
      fetchCurrentUser();
    };

    window.addEventListener('focus', handleFocus);
    window.addEventListener('profileUpdated', handleProfileUpdate);

    return () => {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('profileUpdated', handleProfileUpdate);
    };
  }, []);

  const getNavLinks = () => {
    const links = [
      "Dashboard",
      "Defects",
      "Inspection",
      "AI Detection",
      "Analytics",
    ];

    if (currentUser && currentUser.role === "admin") {
      links.push("User Management");
    }

    return links;
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      setMenuOpen(!menuOpen);
    }
  };

  const toggleTheme = () => {
    setDarkMode(!darkMode);
  };

  const toggleAlerts = () => {
    setAlertsOpen(!alertsOpen);
  };

  return (
    <div className={`font-sans ${darkMode ? 'dark bg-gradient-to-br from-gray-900 via-slate-900 to-gray-900' : 'bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50'} min-h-screen transition-all duration-300`}>
      <header className={`${darkMode ? 'bg-gray-800/95 backdrop-blur-xl border-b border-gray-700/50 text-white shadow-2xl' : 'bg-white/95 backdrop-blur-xl border-b border-gray-200/50 shadow-2xl'} transition-all duration-300 sticky top-0 z-50`}>
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" aria-label="Main navigation">
          <div className="flex items-center justify-between h-16 lg:h-18">
            {/* Enhanced Logo Section */}
            <div className="flex items-center space-x-4">
              <Link to="/dashboard" className="flex-shrink-0 group" aria-label="Dashboard">
                <div className="relative overflow-hidden rounded-xl">
                  <img
                    src={logo}
                    alt="Company Logo"
                    className="w-12 h-12 lg:w-14 lg:h-14 object-contain transition-transform duration-300 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </div>
              </Link>



              {/* Enhanced Mobile Menu Button */}
              <button
                type="button"
                className={`ml-2 sm:hidden inline-flex items-center justify-center p-2.5 rounded-xl ${darkMode ? 'text-gray-300 hover:text-white hover:bg-gray-700/80 border border-gray-600/50' : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50/80 border border-gray-200/50'} focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 backdrop-blur-sm shadow-lg`}
                aria-controls="mobile-menu"
                aria-expanded={menuOpen}
                onClick={() => setMenuOpen(!menuOpen)}
                onKeyDown={handleKeyDown}
              >
                <span className="sr-only">{menuOpen ? 'Close menu' : 'Open menu'}</span>
                {menuOpen ? <X size={24} aria-hidden="true" /> : <Menu size={24} aria-hidden="true" />}
              </button>
            </div>

            {/* Enhanced Desktop Navigation Links */}
            <div className="hidden sm:block">
              <ul className="flex space-x-2 lg:space-x-4">
                {getNavLinks().map((text, i) => (
                  <li key={i}>
                    <NavLink
                      to={`/${text.toLowerCase().replace(" ", "-")}`}
                      className={({ isActive }) =>
                        isActive
                          ? `${darkMode ? 'text-white bg-gradient-to-r from-blue-500/80 to-purple-500/80 shadow-lg border border-blue-400/50' : 'text-white bg-gradient-to-r from-blue-600 to-purple-600 shadow-lg border border-blue-300/50'} font-semibold px-4 py-2.5 rounded-xl inline-flex items-center text-sm transition-all duration-200 backdrop-blur-sm`
                          : `${darkMode ? 'text-gray-300 hover:text-white hover:bg-gray-700/60 border border-transparent hover:border-gray-600/50' : 'text-gray-700 hover:text-blue-600 hover:bg-blue-50/60 border border-transparent hover:border-blue-200/50'} font-medium px-4 py-2.5 rounded-xl inline-flex items-center text-sm transition-all duration-200 backdrop-blur-sm hover:shadow-md`
                      }
                    >
                      {text}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>

            {/* Enhanced Desktop Right Section */}
            <div className="hidden sm:flex items-center space-x-3">
              {/* Enhanced Theme Toggle */}
              <button
                onClick={toggleTheme}
                className={`p-2.5 rounded-xl ${darkMode ? 'text-yellow-300 hover:bg-gray-700/60 border border-gray-600/50 hover:border-yellow-400/50' : 'text-gray-700 hover:bg-orange-50/60 border border-gray-200/50 hover:border-orange-300/50 hover:text-orange-600'} transition-all duration-200 backdrop-blur-sm shadow-lg hover:shadow-xl transform hover:-translate-y-0.5`}
                aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
              >
                {darkMode ? <Sun size={20} /> : <Moon size={20} />}
              </button>

              {/* Enhanced Alert Notification Icon */}
              <div className="relative">
                <button
                  onClick={toggleAlerts}
                  className={`${darkMode ? 'text-gray-300 hover:text-white hover:bg-gray-700/60 border border-gray-600/50' : 'text-gray-700 hover:text-blue-600 hover:bg-blue-50/60 border border-gray-200/50'} p-2.5 rounded-xl transition-all duration-200 backdrop-blur-sm shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 relative`}
                  aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
                >
                  <AlertBell />
                </button>
                {alertsOpen && (
                  <div className="absolute top-full right-0 mt-2 z-50">
                    <AlertDropdown onClose={() => setAlertsOpen(false)} />
                  </div>
                )}
              </div>

              {/* Enhanced Profile Link */}
              <Link
                to="/user-profile"
                className={`${darkMode ? 'text-gray-300 hover:text-white hover:bg-gray-700/60 border border-gray-600/50' : 'text-gray-700 hover:text-blue-600 hover:bg-blue-50/60 border border-gray-200/50'} p-2.5 rounded-xl transition-all duration-200 backdrop-blur-sm shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 group`}
                aria-label="User profile"
              >
                {currentUser && currentUser.profilePhoto ? (
                  <div className="w-6 h-6 rounded-full overflow-hidden bg-gray-100 border-2 border-white shadow-md group-hover:border-blue-300 transition-all duration-200">
                    <img
                      src={currentUser.profilePhoto}
                      alt="Profile"
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-200"
                    />
                  </div>
                ) : (
                  <User size={20} aria-hidden="true" />
                )}
              </Link>
            </div>
          </div>

          {/* Enhanced Mobile menu */}
          <div
            className={`${menuOpen ? 'block' : 'hidden'} sm:hidden transition-all duration-300`}
            id="mobile-menu"
          >
            <div className={`mt-4 ${darkMode ? 'bg-gray-800/60 border-gray-700/50' : 'bg-white/60 border-gray-200/50'} backdrop-blur-xl rounded-xl border shadow-xl overflow-hidden`}>
              <ul className="py-3 space-y-1">
                {getNavLinks().map((text, i) => (
                  <li key={i}>
                    <NavLink
                      to={`/${text.toLowerCase().replace(" ", "-")}`}
                      className={({ isActive }) =>
                        isActive
                          ? `${darkMode ? 'bg-gradient-to-r from-blue-500/80 to-purple-500/80 text-white border-l-4 border-blue-400 shadow-lg' : 'bg-gradient-to-r from-blue-50 to-purple-50 text-blue-600 border-l-4 border-blue-600 shadow-lg'} block px-4 py-3 font-semibold transition-all duration-200`
                          : `${darkMode ? 'text-gray-300 hover:bg-gray-700/60 hover:text-blue-400 border-l-4 border-transparent hover:border-blue-400/50' : 'text-gray-700 hover:bg-blue-50/60 hover:text-blue-600 border-l-4 border-transparent hover:border-blue-400/50'} block px-4 py-3 font-medium transition-all duration-200`
                      }
                      onClick={() => setMenuOpen(false)}
                    >
                      {text}
                    </NavLink>
                  </li>
                ))}
              </ul>

              <div className={`py-4 border-t ${darkMode ? 'border-gray-700/50' : 'border-gray-200/50'}`}>
                <div className="px-2 space-y-2">
                  {/* Enhanced Mobile Theme Toggle */}
                  <button
                    onClick={toggleTheme}
                    className={`flex items-center w-full px-4 py-3 rounded-xl text-base font-medium ${darkMode ? 'text-gray-300 hover:text-white hover:bg-gray-700/60 border border-gray-600/50' : 'text-gray-700 hover:text-blue-600 hover:bg-blue-50/60 border border-gray-200/50'} transition-all duration-200 backdrop-blur-sm shadow-lg`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center mr-3 ${darkMode ? 'bg-yellow-400/20 text-yellow-300' : 'bg-orange-100 text-orange-600'}`}>
                      {darkMode ? <Sun size={18} /> : <Moon size={18} />}
                    </div>
                    <span>{darkMode ? 'Light Mode' : 'Dark Mode'}</span>
                  </button>

                  <div className="space-y-2">
                    {/* Enhanced Mobile Notifications Link */}
                    <Link
                      to="/alert-notifications"
                      className={`flex items-center px-4 py-3 rounded-xl text-base font-medium ${darkMode ? 'text-gray-300 hover:text-white hover:bg-gray-700/60 border border-gray-600/50' : 'text-gray-700 hover:text-blue-600 hover:bg-blue-50/60 border border-gray-200/50'} transition-all duration-200 backdrop-blur-sm shadow-lg`}
                      onClick={() => setMenuOpen(false)}
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center mr-3 relative ${darkMode ? 'bg-blue-400/20 text-blue-300' : 'bg-blue-100 text-blue-600'}`}>
                        <AlertBell />
                      </div>
                      <span>Notifications</span>
                      {unreadCount > 0 && (
                        <span className="ml-auto bg-gradient-to-r from-red-500 to-red-600 text-white text-xs px-2 py-1 rounded-full shadow-lg font-bold">
                          {unreadCount}
                        </span>
                      )}
                    </Link>

                    {/* Enhanced Mobile Profile Link */}
                    <Link
                      to="/user-profile"
                      className={`flex items-center px-4 py-3 rounded-xl text-base font-medium ${darkMode ? 'text-gray-300 hover:text-white hover:bg-gray-700/60 border border-gray-600/50' : 'text-gray-700 hover:text-blue-600 hover:bg-blue-50/60 border border-gray-200/50'} transition-all duration-200 backdrop-blur-sm shadow-lg`}
                      onClick={() => setMenuOpen(false)}
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center mr-3 ${darkMode ? 'bg-purple-400/20 text-purple-300' : 'bg-purple-100 text-purple-600'} overflow-hidden`}>
                        {currentUser && currentUser.profilePhoto ? (
                          <img
                            src={currentUser.profilePhoto}
                            alt="Profile"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <User size={18} aria-hidden="true" />
                        )}
                      </div>
                      <span>Profile</span>
                      {currentUser && (
                        <span className={`ml-auto text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'} font-medium`}>
                          {currentUser.name?.split(' ')[0]}
                        </span>
                      )}
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </nav>
      </header>

      <div className="p-4 sm:p-6 space-y-6">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className={`bg-white/80 backdrop-blur-sm rounded-2xl shadow-2xl p-12 border border-white/20 text-center`}>
              <div className={`animate-spin rounded-full h-12 w-12 border-4 mx-auto mb-4 ${darkMode ? 'border-blue-400 border-t-transparent' : 'border-blue-500 border-t-transparent'}`}></div>
              <p className={`${darkMode ? 'text-gray-300' : 'text-gray-600'} font-medium`}>Loading dashboard...</p>
            </div>
          </div>
        ) : (
          <Outlet />
        )}
      </div>
    </div>
  );
};

export default NavBar;
