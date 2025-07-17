import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";
import {
    FaExclamationCircle,
    FaCheckCircle,
    FaCamera,
    FaTrash,
    FaArrowLeft,
    FaSave,
    FaClipboardList,
    FaInfoCircle
} from "react-icons/fa";

const LogDefect = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [inspections, setInspections] = useState([]);
    const [products, setProducts] = useState([]);
    const [loadingOptions, setLoadingOptions] = useState(true);
    const [defectImage, setDefectImage] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [success, setSuccess] = useState(false);
    const [formData, setFormData] = useState({
        inspection: "",
        product: "",
        type: "",
        severity: "minor",
        description: "",
        location: "",
        rootCause: "unknown",
        measurements: {
            expected: "",
            actual: "",
            unit: ""
        }
    });
    const [error, setError] = useState("");

    // Defect types and severities based on your backend model
    const defectTypes = [
        "visual",
        "functional",
        "dimensional",
        "structural",
        "finish",
        "material",
        "assembly",
        "electrical",
        "mechanical",
        "other"
    ];

    const rootCauses = [
        "design",
        "material",
        "manufacturing",
        "assembly",
        "handling",
        "unknown"
    ];

    const severities = [
        { value: "minor", label: "Minor", description: "Minor defects that don't affect functionality" },
        { value: "major", label: "Major", description: "Significant defects that affect product quality" },
        { value: "critical", label: "Critical", description: "Severe defects that require immediate attention" }
    ];

    // Fetch inspections and products for dropdowns
    useEffect(() => {
        const fetchOptions = async () => {
            setLoadingOptions(true);
            try {
                // Fetch all inspections (not just pending ones) to allow defect logging for any inspection
                console.log("Starting to fetch inspections...");
                const inspectionsResponse = await api.get(
                    "/inspections?limit=1000"  // Removed status filter to get all inspections
                );

                console.log("Raw inspections response:", inspectionsResponse);
                console.log("Inspections response data:", inspectionsResponse.data);

                let inspectionData = [];
                if (inspectionsResponse.data && inspectionsResponse.data.success) {
                    inspectionData = inspectionsResponse.data.data || [];

                    // Sort inspections by date (newest first) for better UX
                    inspectionData.sort((a, b) => new Date(b.date) - new Date(a.date));
                }

                console.log("Fetched inspections for defect logging:", inspectionData.length);
                console.log("Inspection data:", inspectionData);
                setInspections(inspectionData);

                // Fetch products with increased limit
                const productsResponse = await api.get(
                    "/products?limit=1000"  // Increased limit to get all products
                );

                let productData = [];
                if (productsResponse.data.success) {
                    productData = productsResponse.data.data || [];

                    // Sort products alphabetically for better UX
                    productData.sort((a, b) => a.name.localeCompare(b.name));
                }

                console.log("Fetched products for defect logging:", productData.length);
                setProducts(productData);
            } catch (err) {
                console.error("Failed to fetch options:", err);
                console.error("Error response:", err.response?.data);
                setError("Failed to load inspections or products. Please try again.");
            } finally {
                setLoadingOptions(false);
            }
        };

        fetchOptions();
    }, []);

    // Handle inspection selection and auto-fill product
    const handleInspectionChange = (e) => {
        const inspectionId = e.target.value;
        const selectedInspection = inspections.find(insp => insp._id === inspectionId);

        if (selectedInspection && selectedInspection.product) {
            // Auto-select the product based on inspection
            setFormData(prev => ({
                ...prev,
                inspection: inspectionId,
                product: typeof selectedInspection.product === 'object'
                    ? selectedInspection.product._id
                    : selectedInspection.product
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                inspection: inspectionId,
                product: ""
            }));
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;

        // Handle nested measurements object
        if (name.includes("measurements.")) {
            const measProp = name.split(".")[1];
            setFormData(prev => ({
                ...prev,
                measurements: {
                    ...prev.measurements,
                    [measProp]: value
                }
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: value
            }));
        }
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Validate file
        const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif"];
        if (!validTypes.includes(file.type)) {
            setError("Please select a valid image file (JPG, PNG, or GIF)");
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            setError("Image must be less than 5MB");
            return;
        }

        setDefectImage(file);
        // Create image preview
        const reader = new FileReader();
        reader.onload = () => setImagePreview(reader.result);
        reader.readAsDataURL(file);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        // Basic validation
        if (!formData.inspection || !formData.product || !formData.type || !formData.description) {
            setError("Please fill all required fields");
            setLoading(false);
            return;
        }

        try {
            // Create form data for multipart submission (for image upload)
            const submitFormData = new FormData();

            // Append image if selected
            if (defectImage) {
                submitFormData.append("image", defectImage);
            }

            // Append all other form fields
            Object.keys(formData).forEach(key => {
                if (key === 'measurements') {
                    // Handle measurements object
                    submitFormData.append(key, JSON.stringify(formData[key]));
                } else {
                    submitFormData.append(key, formData[key]);
                }
            });

            await api.post(
                "/defects",
                submitFormData,
                {
                    headers: {
                        "Content-Type": "multipart/form-data"
                    }
                }
            );

            setSuccess(true);

            // Reset form after short delay
            setTimeout(() => {
                setFormData({
                    inspection: "",
                    product: "",
                    type: "",
                    severity: "minor",
                    description: "",
                    location: "",
                    rootCause: "unknown",
                    measurements: {
                        expected: "",
                        actual: "",
                        unit: ""
                    }
                });
                setDefectImage(null);
                setImagePreview(null);
                setSuccess(false);
                navigate("/defects");
            }, 2000);

        } catch (err) {
            console.error("Error logging defect:", err);
            setError(
                err.response?.data?.error ||
                "Failed to log defect. Please try again."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50">
            {/* Top Header Bar */}
            <div className="bg-white/80 backdrop-blur-lg border-b border-white/20 shadow-lg shadow-slate-200/50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center py-6 md:py-8">
                        <div className="flex items-center space-x-3">
                            <div className="p-2 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl shadow-lg">
                                <FaClipboardList className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                                    Add New Defect
                                </h1>
                                <p className="text-sm text-gray-600 mt-1">Log quality issues and defects</p>
                            </div>
                        </div>
                        <button
                            onClick={() => navigate("/defects")}
                            className="inline-flex items-center px-4 py-2.5 bg-white/80 backdrop-blur-sm border border-gray-200/80 shadow-lg shadow-gray-200/50 text-sm font-medium rounded-xl text-gray-700 hover:bg-white hover:shadow-xl hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-300 transition-all duration-200"
                        >
                            <FaArrowLeft className="mr-2 h-4 w-4" />
                            Back to Defects
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Notifications */}
                {error && (
                    <div className="mb-6 rounded-2xl bg-gradient-to-r from-red-50 to-pink-50 p-5 border border-red-200/50 shadow-xl shadow-red-100/30 backdrop-blur-sm">
                        <div className="flex items-center">
                            <div className="p-2 bg-red-100 rounded-full mr-4">
                                <FaExclamationCircle className="h-5 w-5 text-red-600" />
                            </div>
                            <span className="text-red-800 font-medium flex-1">{error}</span>
                            <button
                                onClick={() => setError("")}
                                className="ml-4 p-1 text-red-400 hover:text-red-600 hover:bg-red-100 rounded-full transition-all duration-200"
                            >
                                <span className="text-xl">&times;</span>
                            </button>
                        </div>
                    </div>
                )}

                {success && (
                    <div className="mb-6 rounded-2xl bg-gradient-to-r from-green-50 to-emerald-50 p-5 border border-green-200/50 shadow-xl shadow-green-100/30 backdrop-blur-sm">
                        <div className="flex items-center">
                            <div className="p-2 bg-green-100 rounded-full mr-4">
                                <FaCheckCircle className="h-5 w-5 text-green-600" />
                            </div>
                            <span className="text-green-800 font-medium">Defect logged successfully! Redirecting...</span>
                        </div>
                    </div>
                )}

                {/* Main Form */}
                <div className="bg-white/80 backdrop-blur-lg shadow-2xl shadow-slate-200/50 rounded-3xl overflow-hidden border border-white/50">
                    <div className="px-6 py-8 bg-gradient-to-r from-blue-50/80 to-indigo-50/80 border-b border-blue-100/50">
                        <div className="flex items-center space-x-3">
                            <div className="p-2 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl shadow-lg">
                                <FaInfoCircle className="h-5 w-5 text-white" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                                    Defect Information
                                </h3>
                                <p className="text-sm text-gray-600 mt-1">
                                    Please provide detailed information about the quality issue.
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="px-6 py-8 sm:px-8">
                        <form onSubmit={handleSubmit}>
                            <div className="grid grid-cols-1 gap-8">
                                {/* Basic Information Section */}
                                <div className="bg-gradient-to-r from-slate-50/50 to-blue-50/30 rounded-2xl p-6 border border-slate-200/50">
                                    <h4 className="text-lg font-semibold text-gray-800 mb-6 flex items-center">
                                        <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                                        Basic Information
                                    </h4>
                                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                                        {/* Inspection Selection */}
                                        <div className="sm:col-span-1">
                                            <label htmlFor="inspection" className="block text-sm font-semibold text-gray-700 mb-2">
                                                Inspection <span className="text-red-500">*</span>
                                            </label>
                                            {loadingOptions ? (
                                                <div className="h-12 bg-gradient-to-r from-gray-100 to-gray-200 rounded-xl animate-pulse"></div>
                                            ) : (
                                                <div>
                                                    <select
                                                        id="inspection"
                                                        name="inspection"
                                                        value={formData.inspection}
                                                        onChange={handleInspectionChange}
                                                        required
                                                        className="block w-full border border-gray-300 rounded-xl shadow-sm py-3 px-4 bg-white/80 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400 transition-all duration-200 text-sm"
                                                    >
                                                        <option value="">Select inspection</option>
                                                        {inspections.length === 0 ? (
                                                            <option value="" disabled>No inspections available</option>
                                                        ) : (
                                                            inspections.map((inspection) => (
                                                                <option key={inspection._id} value={inspection._id}>
                                                                    {inspection.batchNumber} - {inspection.product?.name || 'Unknown Product'} - {new Date(inspection.date).toLocaleDateString('en-US', {
                                                                        year: 'numeric',
                                                                        month: 'short',
                                                                        day: 'numeric'
                                                                    })} ({inspection.status || 'pending'})
                                                                </option>
                                                            ))
                                                        )}
                                                    </select>
                                                    {inspections.length === 0 && (
                                                        <p className="mt-2 text-xs text-gray-500 flex items-center bg-amber-50 p-2 rounded-lg border border-amber-200">
                                                            <FaInfoCircle className="mr-2 text-amber-500" />
                                                            No inspections found. Please create an inspection first.
                                                        </p>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        {/* Product Selection */}
                                        <div className="sm:col-span-1">
                                            <label htmlFor="product" className="block text-sm font-semibold text-gray-700 mb-2">
                                                Product <span className="text-red-500">*</span>
                                            </label>
                                            {loadingOptions ? (
                                                <div className="h-12 bg-gradient-to-r from-gray-100 to-gray-200 rounded-xl animate-pulse"></div>
                                            ) : (
                                                <div>
                                                    <select
                                                        id="product"
                                                        name="product"
                                                        value={formData.product}
                                                        onChange={handleChange}
                                                        required
                                                        disabled={formData.inspection !== ""}
                                                        className={`block w-full border border-gray-300 rounded-xl shadow-sm py-3 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400 transition-all duration-200 text-sm ${formData.inspection !== ""
                                                            ? "bg-gray-50/80 cursor-not-allowed border-gray-200"
                                                            : "bg-white/80 backdrop-blur-sm"
                                                            }`}
                                                    >
                                                        <option value="">Select product</option>
                                                        {products.map((product) => (
                                                            <option key={product._id} value={product._id}>
                                                                {product.name} - {product.category}
                                                            </option>
                                                        ))}
                                                    </select>
                                                    {formData.inspection && (
                                                        <p className="mt-2 text-xs text-gray-500 flex items-center bg-blue-50 p-2 rounded-lg border border-blue-200">
                                                            <FaInfoCircle className="mr-2 text-blue-500" />
                                                            Auto-selected from inspection
                                                        </p>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        {/* Defect Type */}
                                        <div className="sm:col-span-1">
                                            <label htmlFor="type" className="block text-sm font-semibold text-gray-700 mb-2">
                                                Defect Type <span className="text-red-500">*</span>
                                            </label>
                                            <select
                                                id="type"
                                                name="type"
                                                value={formData.type}
                                                onChange={handleChange}
                                                required
                                                className="block w-full border border-gray-300 rounded-xl shadow-sm py-3 px-4 bg-white/80 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400 transition-all duration-200 text-sm"
                                            >
                                                <option value="">Select defect type</option>
                                                {defectTypes.map((type) => (
                                                    <option key={type} value={type}>
                                                        {type.charAt(0).toUpperCase() + type.slice(1)}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* Root Cause */}
                                        <div className="sm:col-span-1">
                                            <label htmlFor="rootCause" className="block text-sm font-semibold text-gray-700 mb-2">
                                                Root Cause
                                            </label>
                                            <select
                                                id="rootCause"
                                                name="rootCause"
                                                value={formData.rootCause}
                                                onChange={handleChange}
                                                className="block w-full border border-gray-300 rounded-xl shadow-sm py-3 px-4 bg-white/80 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400 transition-all duration-200 text-sm"
                                            >
                                                {rootCauses.map((cause) => (
                                                    <option key={cause} value={cause}>
                                                        {cause.charAt(0).toUpperCase() + cause.slice(1)}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* Location */}
                                        <div className="sm:col-span-2">
                                            <label htmlFor="location" className="block text-sm font-semibold text-gray-700 mb-2">
                                                Defect Location
                                            </label>
                                            <input
                                                type="text"
                                                id="location"
                                                name="location"
                                                value={formData.location}
                                                onChange={handleChange}
                                                className="block w-full border border-gray-300 rounded-xl shadow-sm py-3 px-4 bg-white/80 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400 transition-all duration-200 text-sm"
                                                placeholder="e.g., Top edge, Bottom surface, etc."
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Severity Section */}
                                <div className="bg-gradient-to-r from-orange-50/50 to-red-50/30 rounded-2xl p-6 border border-orange-200/50">
                                    <h4 className="text-lg font-semibold text-gray-800 mb-6 flex items-center">
                                        <div className="w-2 h-2 bg-orange-500 rounded-full mr-3"></div>
                                        Severity Level
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        {severities.map((severity) => (
                                            <div
                                                key={severity.value}
                                                className={`relative rounded-2xl border-2 p-6 flex cursor-pointer transition-all duration-200 hover:shadow-lg ${formData.severity === severity.value
                                                    ? severity.value === "critical"
                                                        ? "bg-gradient-to-br from-red-50 to-red-100 border-red-300 shadow-xl shadow-red-200/50"
                                                        : severity.value === "major"
                                                            ? "bg-gradient-to-br from-orange-50 to-orange-100 border-orange-300 shadow-xl shadow-orange-200/50"
                                                            : "bg-gradient-to-br from-green-50 to-green-100 border-green-300 shadow-xl shadow-green-200/50"
                                                    : "border-gray-200 bg-white/80 hover:bg-gray-50/80"
                                                    }`}
                                            >
                                                <div className="flex items-center h-5">
                                                    <input
                                                        id={severity.value}
                                                        name="severity"
                                                        type="radio"
                                                        value={severity.value}
                                                        checked={formData.severity === severity.value}
                                                        onChange={handleChange}
                                                        className={`h-5 w-5 border-gray-300 focus:ring-2 ${severity.value === "critical" ? "text-red-600 focus:ring-red-500" :
                                                                severity.value === "major" ? "text-orange-600 focus:ring-orange-500" :
                                                                    "text-green-600 focus:ring-green-500"
                                                            }`}
                                                    />
                                                </div>
                                                <div className="ml-4 flex flex-col">
                                                    <label htmlFor={severity.value} className={`block text-sm font-bold ${severity.value === "critical" ? "text-red-700" :
                                                            severity.value === "major" ? "text-orange-700" :
                                                                "text-green-700"
                                                        }`}>
                                                        {severity.label}
                                                    </label>
                                                    <span className="text-xs text-gray-600 mt-1">{severity.description}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Measurements Section */}
                                <div className="bg-gradient-to-r from-purple-50/50 to-indigo-50/30 rounded-2xl p-6 border border-purple-200/50">
                                    <div className="flex items-center mb-6">
                                        <div className="w-2 h-2 bg-purple-500 rounded-full mr-3"></div>
                                        <h4 className="text-lg font-semibold text-gray-800">Measurements</h4>
                                        <span className="ml-3 px-3 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded-full">
                                            Optional
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <div>
                                            <label htmlFor="expected" className="block text-sm font-semibold text-gray-700 mb-2">
                                                Expected Value
                                            </label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                id="expected"
                                                name="measurements.expected"
                                                value={formData.measurements.expected}
                                                onChange={handleChange}
                                                placeholder="Expected"
                                                className="block w-full border border-gray-300 rounded-xl shadow-sm py-3 px-4 bg-white/80 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-400 transition-all duration-200 text-sm"
                                            />
                                        </div>
                                        <div>
                                            <label htmlFor="actual" className="block text-sm font-semibold text-gray-700 mb-2">
                                                Actual Value
                                            </label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                id="actual"
                                                name="measurements.actual"
                                                value={formData.measurements.actual}
                                                onChange={handleChange}
                                                placeholder="Actual"
                                                className="block w-full border border-gray-300 rounded-xl shadow-sm py-3 px-4 bg-white/80 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-400 transition-all duration-200 text-sm"
                                            />
                                        </div>
                                        <div>
                                            <label htmlFor="unit" className="block text-sm font-semibold text-gray-700 mb-2">
                                                Unit of Measurement
                                            </label>
                                            <input
                                                type="text"
                                                id="unit"
                                                name="measurements.unit"
                                                value={formData.measurements.unit}
                                                onChange={handleChange}
                                                placeholder="Unit (mm, cm, etc.)"
                                                className="block w-full border border-gray-300 rounded-xl shadow-sm py-3 px-4 bg-white/80 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-400 transition-all duration-200 text-sm"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Description Section */}
                                <div className="bg-gradient-to-r from-emerald-50/50 to-teal-50/30 rounded-2xl p-6 border border-emerald-200/50">
                                    <h4 className="text-lg font-semibold text-gray-800 mb-6 flex items-center">
                                        <div className="w-2 h-2 bg-emerald-500 rounded-full mr-3"></div>
                                        Description
                                        <span className="text-red-500 ml-2">*</span>
                                    </h4>
                                    <textarea
                                        id="description"
                                        name="description"
                                        value={formData.description}
                                        onChange={handleChange}
                                        required
                                        rows="5"
                                        className="block w-full border border-gray-300 rounded-xl shadow-sm py-4 px-4 bg-white/80 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-400 transition-all duration-200 text-sm resize-none"
                                        placeholder="Provide detailed description of the defect including what you observed, how it affects the product, and any other relevant information..."
                                    ></textarea>
                                </div>

                                {/* Image Upload Section */}
                                <div className="bg-gradient-to-r from-blue-50/50 to-cyan-50/30 rounded-2xl p-6 border border-blue-200/50">
                                    <h4 className="text-lg font-semibold text-gray-800 mb-6 flex items-center">
                                        <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                                        Defect Image
                                    </h4>

                                    <div className={`relative rounded-2xl border-2 border-dashed transition-all duration-300 ${imagePreview
                                            ? 'border-blue-300 bg-blue-50/30'
                                            : 'border-gray-300 bg-white/50 hover:bg-blue-50/20 hover:border-blue-400'
                                        }`}>
                                        {!imagePreview ? (
                                            <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
                                                <div className="p-4 bg-blue-100 rounded-full mb-4">
                                                    <FaCamera className="h-8 w-8 text-blue-600" />
                                                </div>
                                                <div className="space-y-2">
                                                    <label htmlFor="image-upload" className="relative cursor-pointer font-semibold text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500 transition-colors">
                                                        <span className="text-lg">Upload an image</span>
                                                        <input
                                                            id="image-upload"
                                                            name="image"
                                                            type="file"
                                                            className="sr-only"
                                                            onChange={handleImageChange}
                                                            accept="image/jpeg,image/jpg,image/png,image/gif"
                                                        />
                                                    </label>
                                                    <p className="text-gray-600">or drag and drop</p>
                                                    <p className="text-sm text-gray-500">JPG, PNG or GIF up to 5MB</p>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="relative p-4">
                                                <div className="relative overflow-hidden rounded-xl">
                                                    <img
                                                        src={imagePreview}
                                                        alt="Defect preview"
                                                        className="max-h-80 w-full object-contain mx-auto shadow-lg"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setDefectImage(null);
                                                            setImagePreview(null);
                                                        }}
                                                        className="absolute top-3 right-3 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 shadow-lg transition-all duration-200 hover:scale-110"
                                                    >
                                                        <FaTrash className="h-4 w-4" />
                                                    </button>
                                                </div>
                                                <div className="mt-4 text-center">
                                                    <p className="text-sm text-gray-600 font-medium">Image uploaded successfully</p>
                                                    <p className="text-xs text-gray-500 mt-1">Click the trash icon to remove</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Form Actions */}
                            <div className="mt-10 pt-8 border-t border-gray-200/80">
                                <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-4">
                                    <button
                                        type="button"
                                        onClick={() => navigate("/defects")}
                                        className="w-full sm:w-auto inline-flex justify-center items-center px-6 py-3 border border-gray-300 shadow-lg text-sm font-semibold rounded-xl text-gray-700 bg-white/80 backdrop-blur-sm hover:bg-gray-50 hover:shadow-xl hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-all duration-200"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className={`w-full sm:w-auto inline-flex justify-center items-center px-8 py-3 border border-transparent shadow-lg text-sm font-semibold rounded-xl text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 hover:shadow-xl hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 ${loading ? "opacity-70 cursor-not-allowed hover:scale-100" : ""
                                            }`}
                                    >
                                        {loading ? (
                                            <>
                                                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-3"></div>
                                                Processing...
                                            </>
                                        ) : (
                                            <>
                                                <FaSave className="mr-2 h-4 w-4" />
                                                Add Defect
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LogDefect;