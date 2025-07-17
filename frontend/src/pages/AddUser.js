import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { directApi } from "../api/api";
import {
    FaUser,
    FaEnvelope,
    FaLock,
    FaUserShield,
    FaBuilding,
    FaArrowLeft,
    FaEye,
    FaEyeSlash,
    FaSave,
    FaTimes
} from "react-icons/fa";

const AddUser = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [errors, setErrors] = useState({});
    const [showSuccess, setShowSuccess] = useState(false);

    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
        role: "inspector",
        department: ""
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

        // Clear error for this field when user starts typing
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ""
            }));
        }
    };

    const validateForm = () => {
        const newErrors = {};

        // Name validation
        if (!formData.name.trim()) {
            newErrors.name = "Name is required";
        } else if (formData.name.trim().length < 2) {
            newErrors.name = "Name must be at least 2 characters";
        }

        // Email validation
        if (!formData.email.trim()) {
            newErrors.email = "Email is required";
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = "Please enter a valid email address";
        }

        // Password validation
        if (!formData.password) {
            newErrors.password = "Password is required";
        } else if (formData.password.length < 6) {
            newErrors.password = "Password must be at least 6 characters";
        }

        // Confirm password validation
        if (!formData.confirmPassword) {
            newErrors.confirmPassword = "Please confirm your password";
        } else if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = "Passwords do not match";
        }

        // Department validation
        if (!formData.department.trim()) {
            newErrors.department = "Department is required";
        }

        return newErrors;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const validationErrors = validateForm();
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            return;
        }

        setLoading(true);
        setErrors({});

        try {
            const userData = {
                name: formData.name.trim(),
                email: formData.email.trim(),
                password: formData.password,
                role: formData.role,
                department: formData.department.trim()
            };

            const response = await directApi.post("/api/users", userData);

            if (response.data.success) {
                // Show success animation
                setShowSuccess(true);

                // Show success message and redirect back to user management
                setTimeout(() => {
                    alert("User created successfully!");
                    navigate("/user-management");
                }, 500);
            }
        } catch (err) {
            console.error("Error creating user:", err);

            if (err.response?.data?.error) {
                // Handle specific backend errors
                if (err.response.data.error.includes("User already exists")) {
                    setErrors({ email: "A user with this email or name already exists" });
                } else {
                    setErrors({ general: err.response.data.error });
                }
            } else {
                setErrors({ general: "Failed to create user. Please try again." });
            }
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        navigate("/user-management");
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
            {/* Main Content */}
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Page Header */}
                <div className="mb-10">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <button
                                onClick={() => navigate("/user-management")}
                                className="group inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
                            >
                                <FaArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform duration-200" />
                                Back to User Management
                            </button>
                            <div className="h-8 w-px bg-gray-300"></div>
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Add New User</h1>
                                <p className="mt-1 text-base text-gray-600">
                                    Create a new user account with the appropriate role and permissions
                                </p>
                            </div>
                        </div>
                        <div className="hidden sm:flex items-center space-x-2 text-sm text-gray-500">
                            <div className="flex items-center space-x-1">
                                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                                <span>Admin Panel</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden backdrop-blur-sm">
                    {/* Header Section */}
                    <div className="relative px-8 py-6 bg-gradient-to-r from-blue-600 to-indigo-600">
                        <div className="absolute inset-0 bg-black opacity-5"></div>
                        <div className="relative">
                            <div className="flex items-center space-x-3">
                                <div className="flex-shrink-0">
                                    <div className="w-12 h-12 bg-white bg-opacity-20 rounded-xl flex items-center justify-center">
                                        <FaUser className="h-6 w-6 text-white" />
                                    </div>
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-white">User Information</h2>
                                    <p className="text-blue-100 text-sm mt-1">
                                        Fill in the details below to create a new user account
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="px-8 py-8 space-y-8">
                        {/* Success Message */}
                        {showSuccess && (
                            <div className="bg-green-50 border-l-4 border-green-400 rounded-lg p-4 animate-fadeIn">
                                <div className="flex">
                                    <div className="flex-shrink-0">
                                        <svg className="h-5 w-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <div className="ml-3">
                                        <p className="text-sm font-medium text-green-800">User created successfully! Redirecting...</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* General Error */}
                        {errors.general && (
                            <div className="bg-red-50 border-l-4 border-red-400 rounded-lg p-4 animate-fadeIn">
                                <div className="flex">
                                    <div className="flex-shrink-0">
                                        <FaTimes className="h-5 w-5 text-red-400" />
                                    </div>
                                    <div className="ml-3">
                                        <p className="text-sm font-medium text-red-800">{errors.general}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Personal Information Section */}
                        <div className="space-y-6">
                            <div className="flex items-center space-x-3 pb-3 border-b border-gray-200">
                                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                                    <FaUser className="h-4 w-4 text-blue-600" />
                                </div>
                                <h3 className="text-lg font-semibold text-gray-900">Personal Information</h3>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Name Field */}
                                <div className="space-y-2">
                                    <label htmlFor="name" className="block text-sm font-semibold text-gray-700">
                                        Full Name <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                            <FaUser className={`h-5 w-5 transition-colors duration-200 ${errors.name ? 'text-red-400' : 'text-gray-400 group-focus-within:text-blue-500'}`} />
                                        </div>
                                        <input
                                            type="text"
                                            id="name"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleChange}
                                            className={`block w-full pl-12 pr-4 py-3 border rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-sm ${errors.name
                                                ? 'border-red-300 bg-red-50 focus:ring-red-500 focus:border-red-500'
                                                : 'border-gray-300 hover:border-gray-400 focus:bg-white'
                                                }`}
                                            placeholder="Enter full name"
                                        />
                                        {errors.name && (
                                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                                <FaTimes className="h-4 w-4 text-red-400" />
                                            </div>
                                        )}
                                    </div>
                                    {errors.name && (
                                        <p className="text-sm text-red-600 font-medium animate-fadeIn flex items-center">
                                            <span className="mr-1">⚠️</span>
                                            {errors.name}
                                        </p>
                                    )}
                                </div>

                                {/* Email Field */}
                                <div className="space-y-2">
                                    <label htmlFor="email" className="block text-sm font-semibold text-gray-700">
                                        Email Address <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                            <FaEnvelope className={`h-5 w-5 transition-colors duration-200 ${errors.email ? 'text-red-400' : 'text-gray-400 group-focus-within:text-blue-500'}`} />
                                        </div>
                                        <input
                                            type="email"
                                            id="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleChange}
                                            className={`block w-full pl-12 pr-4 py-3 border rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-sm ${errors.email
                                                ? 'border-red-300 bg-red-50 focus:ring-red-500 focus:border-red-500'
                                                : 'border-gray-300 hover:border-gray-400 focus:bg-white'
                                                }`}
                                            placeholder="Enter email address"
                                        />
                                        {errors.email && (
                                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                                <FaTimes className="h-4 w-4 text-red-400" />
                                            </div>
                                        )}
                                    </div>
                                    {errors.email && (
                                        <p className="text-sm text-red-600 font-medium animate-fadeIn flex items-center">
                                            <span className="mr-1">⚠️</span>
                                            {errors.email}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Security Information Section */}
                        <div className="space-y-6">
                            <div className="flex items-center space-x-3 pb-3 border-b border-gray-200">
                                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                                    <FaLock className="h-4 w-4 text-green-600" />
                                </div>
                                <h3 className="text-lg font-semibold text-gray-900">Security Information</h3>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Password Field */}
                                <div className="space-y-2">
                                    <label htmlFor="password" className="block text-sm font-semibold text-gray-700">
                                        Password <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                            <FaLock className={`h-5 w-5 transition-colors duration-200 ${errors.password ? 'text-red-400' : 'text-gray-400 group-focus-within:text-blue-500'}`} />
                                        </div>
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            id="password"
                                            name="password"
                                            value={formData.password}
                                            onChange={handleChange}
                                            className={`block w-full pl-12 pr-12 py-3 border rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-sm ${errors.password
                                                ? 'border-red-300 bg-red-50 focus:ring-red-500 focus:border-red-500'
                                                : 'border-gray-300 hover:border-gray-400 focus:bg-white'
                                                }`}
                                            placeholder="Enter password"
                                        />
                                        <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="text-gray-400 hover:text-gray-600 focus:outline-none focus:text-blue-500 transition-colors duration-200"
                                            >
                                                {showPassword ? <FaEyeSlash className="h-5 w-5" /> : <FaEye className="h-5 w-5" />}
                                            </button>
                                        </div>
                                    </div>
                                    {errors.password && (
                                        <p className="text-sm text-red-600 font-medium animate-fadeIn flex items-center">
                                            <span className="mr-1">⚠️</span>
                                            {errors.password}
                                        </p>
                                    )}
                                    {!errors.password && formData.password && (
                                        <div className="text-xs text-green-600 flex items-center space-x-1">
                                            <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                            </svg>
                                            <span>Password meets requirements</span>
                                        </div>
                                    )}
                                    {!formData.password && (
                                        <p className="text-xs text-gray-500">
                                            💡 Password must be at least 6 characters long
                                        </p>
                                    )}
                                </div>

                                {/* Confirm Password Field */}
                                <div className="space-y-2">
                                    <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-700">
                                        Confirm Password <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                            <FaLock className={`h-5 w-5 transition-colors duration-200 ${errors.confirmPassword ? 'text-red-400' : 'text-gray-400 group-focus-within:text-blue-500'}`} />
                                        </div>
                                        <input
                                            type={showConfirmPassword ? "text" : "password"}
                                            id="confirmPassword"
                                            name="confirmPassword"
                                            value={formData.confirmPassword}
                                            onChange={handleChange}
                                            className={`block w-full pl-12 pr-12 py-3 border rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-sm ${errors.confirmPassword
                                                ? 'border-red-300 bg-red-50 focus:ring-red-500 focus:border-red-500'
                                                : 'border-gray-300 hover:border-gray-400 focus:bg-white'
                                                }`}
                                            placeholder="Confirm password"
                                        />
                                        <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
                                            <button
                                                type="button"
                                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                className="text-gray-400 hover:text-gray-600 focus:outline-none focus:text-blue-500 transition-colors duration-200"
                                            >
                                                {showConfirmPassword ? <FaEyeSlash className="h-5 w-5" /> : <FaEye className="h-5 w-5" />}
                                            </button>
                                        </div>
                                    </div>
                                    {errors.confirmPassword && (
                                        <p className="text-sm text-red-600 font-medium animate-fadeIn flex items-center">
                                            <span className="mr-1">⚠️</span>
                                            {errors.confirmPassword}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Role & Department Section */}
                        <div className="space-y-6">
                            <div className="flex items-center space-x-3 pb-3 border-b border-gray-200">
                                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                                    <FaUserShield className="h-4 w-4 text-purple-600" />
                                </div>
                                <h3 className="text-lg font-semibold text-gray-900">Role & Department</h3>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Role Field */}
                                <div className="space-y-2">
                                    <label htmlFor="role" className="block text-sm font-semibold text-gray-700">
                                        Role <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                            <FaUserShield className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors duration-200" />
                                        </div>
                                        <select
                                            id="role"
                                            name="role"
                                            value={formData.role}
                                            onChange={handleChange}
                                            className="block w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-sm hover:border-gray-400 focus:bg-white appearance-none bg-white"
                                        >
                                            <option value="inspector" className="py-2">👷 Inspector</option>
                                            <option value="manager" className="py-2">👨‍💼 Manager</option>
                                            <option value="admin" className="py-2">👑 Administrator</option>
                                        </select>
                                        <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                                            <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                            </svg>
                                        </div>
                                    </div>
                                </div>

                                {/* Department Field */}
                                <div className="space-y-2">
                                    <label htmlFor="department" className="block text-sm font-semibold text-gray-700">
                                        Department <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                            <FaBuilding className={`h-5 w-5 transition-colors duration-200 ${errors.department ? 'text-red-400' : 'text-gray-400 group-focus-within:text-blue-500'}`} />
                                        </div>
                                        <input
                                            type="text"
                                            id="department"
                                            name="department"
                                            value={formData.department}
                                            onChange={handleChange}
                                            list="departments"
                                            className={`block w-full pl-12 pr-4 py-3 border rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-sm ${errors.department
                                                ? 'border-red-300 bg-red-50 focus:ring-red-500 focus:border-red-500'
                                                : 'border-gray-300 hover:border-gray-400 focus:bg-white'
                                                }`}
                                            placeholder="Enter department name"
                                        />
                                        <datalist id="departments">
                                            <option value="Quality Assurance" />
                                            <option value="Manufacturing" />
                                            <option value="Engineering" />
                                            <option value="Operations" />
                                            <option value="Maintenance" />
                                            <option value="Safety" />
                                            <option value="Research & Development" />
                                            <option value="Supply Chain" />
                                        </datalist>
                                        {errors.department && (
                                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                                <FaTimes className="h-4 w-4 text-red-400" />
                                            </div>
                                        )}
                                    </div>
                                    {errors.department && (
                                        <p className="text-sm text-red-600 font-medium animate-fadeIn flex items-center">
                                            <span className="mr-1">⚠️</span>
                                            {errors.department}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Form Actions */}
                        <div className="flex items-center justify-between pt-8 border-t border-gray-200">
                            <div className="flex items-center space-x-2 text-sm text-gray-500">
                                <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                                <span>All fields marked with * are required</span>
                            </div>
                            <div className="flex items-center space-x-4">
                                <button
                                    type="button"
                                    onClick={handleCancel}
                                    className="group inline-flex items-center px-6 py-3 border border-gray-300 shadow-sm text-sm font-medium rounded-xl text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-all duration-200"
                                >
                                    <FaTimes className="mr-2 h-4 w-4 group-hover:rotate-90 transition-transform duration-200" />
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="group inline-flex items-center px-8 py-3 border border-transparent shadow-lg text-sm font-medium rounded-xl text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:from-blue-600 disabled:hover:to-indigo-600 transition-all duration-200 transform hover:scale-105 disabled:hover:scale-100"
                                >
                                    {loading ? (
                                        <>
                                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Creating User...
                                        </>
                                    ) : (
                                        <>
                                            <FaSave className="mr-2 h-4 w-4 group-hover:scale-110 transition-transform duration-200" />
                                            Create User
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </form>
                </div>

                {/* Floating Footer with Actions */}
                <div className="mt-8 bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-900">Need Help?</p>
                                <p className="text-xs text-gray-500">Contact support for assistance with user creation</p>
                            </div>
                        </div>
                        <button
                            type="button"
                            className="text-blue-600 hover:text-blue-700 text-sm font-medium transition-colors duration-200"
                        >
                            View Guidelines →
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AddUser;
