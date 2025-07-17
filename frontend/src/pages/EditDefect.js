import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../api/api";
import {
    FaExclamationCircle,
    FaCheckCircle,
    FaCamera,
    FaTrash,
    FaArrowLeft,
    FaSave,
    FaClipboardList
} from "react-icons/fa";

const EditDefect = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
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
        status: "open",
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

    const statuses = [
        "open",
        "investigating",
        "resolved",
        "rejected"
    ];

    const severities = [
        { value: "minor", label: "Minor", description: "Minor defects that don't affect functionality" },
        { value: "major", label: "Major", description: "Significant defects that affect product quality" },
        { value: "critical", label: "Critical", description: "Severe defects that require immediate attention" }
    ];

    // Fetch defect data
    useEffect(() => {
        const fetchDefect = async () => {
            try {
                const response = await api.get(`/defects/${id}`);
                if (response.data.success) {
                    const defect = response.data.data;
                    setFormData({
                        inspection: defect.inspection._id || defect.inspection,
                        product: defect.product._id || defect.product,
                        type: defect.type,
                        severity: defect.severity,
                        description: defect.description,
                        location: defect.location || "",
                        rootCause: defect.rootCause || "unknown",
                        status: defect.status || "open",
                        measurements: defect.measurements || {
                            expected: "",
                            actual: "",
                            unit: ""
                        }
                    });

                    if (defect.imageUrl) {
                        setImagePreview(defect.imageUrl);
                    }
                } else {
                    setError("Failed to load defect data");
                }
            } catch (err) {
                console.error("Failed to fetch defect:", err);
                setError("Failed to load defect data. Please try again.");
            } finally {
                setInitialLoading(false);
            }
        };

        if (id) {
            fetchDefect();
        }
    }, [id]);

    // Fetch inspections and products for dropdowns
    useEffect(() => {
        const fetchOptions = async () => {
            setLoadingOptions(true);
            try {
                // Fetch all inspections (not just pending since we're editing)
                const inspectionsResponse = await api.get("/inspections?limit=1000");

                let inspectionData = [];
                if (inspectionsResponse.data.success) {
                    inspectionData = inspectionsResponse.data.data || [];
                    inspectionData.sort((a, b) => new Date(b.date) - new Date(a.date));
                }

                setInspections(inspectionData);

                // Fetch products
                const productsResponse = await api.get("/products?limit=1000");

                let productData = [];
                if (productsResponse.data.success) {
                    productData = productsResponse.data.data || [];
                    productData.sort((a, b) => a.name.localeCompare(b.name));
                }

                setProducts(productData);
            } catch (err) {
                console.error("Failed to fetch options:", err);
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
                inspection: inspectionId
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

            await api.put(
                `/defects/${id}`,
                submitFormData,
                {
                    headers: {
                        "Content-Type": "multipart/form-data"
                    }
                }
            );

            setSuccess(true);

            // Navigate back after short delay
            setTimeout(() => {
                navigate("/defects");
            }, 2000);

        } catch (err) {
            console.error("Error updating defect:", err);
            setError(
                err.response?.data?.error ||
                "Failed to update defect. Please try again."
            );
        } finally {
            setLoading(false);
        }
    };

    const removeImage = () => {
        setDefectImage(null);
        setImagePreview(null);
    };

    if (initialLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
                    <p className="mt-4 text-gray-600">Loading defect data...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Top Header Bar */}
            <div className="bg-white shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center py-4 md:py-6">
                        <div className="flex items-center">
                            <FaClipboardList className="h-6 w-6 text-blue-600 mr-2" />
                            <h1 className="text-xl font-bold text-gray-900">Edit Defect</h1>
                        </div>
                        <button
                            onClick={() => navigate("/defects")}
                            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
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
                    <div className="mb-6 rounded-lg bg-red-50 p-4 border border-red-200 shadow-sm">
                        <div className="flex items-center">
                            <FaExclamationCircle className="h-5 w-5 text-red-500 mr-3" />
                            <span className="text-red-800">{error}</span>
                            <button
                                onClick={() => setError("")}
                                className="ml-auto text-red-500 hover:text-red-700"
                            >
                                <span className="text-xl">&times;</span>
                            </button>
                        </div>
                    </div>
                )}

                {success && (
                    <div className="mb-6 rounded-lg bg-green-50 p-4 border border-green-200 shadow-sm">
                        <div className="flex items-center">
                            <FaCheckCircle className="h-5 w-5 text-green-500 mr-3" />
                            <span className="text-green-800">Defect updated successfully! Redirecting...</span>
                        </div>
                    </div>
                )}

                {/* Main Form */}
                <div className="bg-white shadow-md rounded-lg overflow-hidden">
                    <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
                        <h3 className="text-lg leading-6 font-medium text-gray-900">Defect Information</h3>
                        <p className="mt-1 max-w-2xl text-sm text-gray-500">
                            Update the defect information below.
                        </p>
                    </div>
                    <div className="px-4 py-6 sm:p-6">
                        <form onSubmit={handleSubmit}>
                            <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
                                {/* Inspection Selection */}
                                <div className="sm:col-span-1">
                                    <label htmlFor="inspection" className="block text-sm font-medium text-gray-700 mb-1">
                                        Inspection <span className="text-red-500">*</span>
                                    </label>
                                    {loadingOptions ? (
                                        <div className="h-10 bg-gray-100 rounded-md animate-pulse"></div>
                                    ) : (
                                        <select
                                            id="inspection"
                                            name="inspection"
                                            value={formData.inspection}
                                            onChange={handleInspectionChange}
                                            required
                                            className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                        >
                                            <option value="">Select inspection</option>
                                            {inspections.map((inspection) => (
                                                <option key={inspection._id} value={inspection._id}>
                                                    {inspection.batchNumber} - {new Date(inspection.date).toLocaleDateString('en-US', {
                                                        year: 'numeric',
                                                        month: 'short',
                                                        day: 'numeric'
                                                    })}
                                                </option>
                                            ))}
                                        </select>
                                    )}
                                </div>

                                {/* Product Selection */}
                                <div className="sm:col-span-1">
                                    <label htmlFor="product" className="block text-sm font-medium text-gray-700 mb-1">
                                        Product <span className="text-red-500">*</span>
                                    </label>
                                    {loadingOptions ? (
                                        <div className="h-10 bg-gray-100 rounded-md animate-pulse"></div>
                                    ) : (
                                        <select
                                            id="product"
                                            name="product"
                                            value={formData.product}
                                            onChange={handleChange}
                                            required
                                            className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                        >
                                            <option value="">Select product</option>
                                            {products.map((product) => (
                                                <option key={product._id} value={product._id}>
                                                    {product.name} - {product.category}
                                                </option>
                                            ))}
                                        </select>
                                    )}
                                </div>

                                {/* Defect Type */}
                                <div className="sm:col-span-1">
                                    <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
                                        Defect Type <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        id="type"
                                        name="type"
                                        value={formData.type}
                                        onChange={handleChange}
                                        required
                                        className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
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
                                    <label htmlFor="rootCause" className="block text-sm font-medium text-gray-700 mb-1">
                                        Root Cause
                                    </label>
                                    <select
                                        id="rootCause"
                                        name="rootCause"
                                        value={formData.rootCause}
                                        onChange={handleChange}
                                        className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                    >
                                        {rootCauses.map((cause) => (
                                            <option key={cause} value={cause}>
                                                {cause.charAt(0).toUpperCase() + cause.slice(1)}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Status */}
                                <div className="sm:col-span-1">
                                    <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                                        Status <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        id="status"
                                        name="status"
                                        value={formData.status}
                                        onChange={handleChange}
                                        required
                                        className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                    >
                                        {statuses.map((status) => (
                                            <option key={status} value={status}>
                                                {status.charAt(0).toUpperCase() + status.slice(1)}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Location */}
                                <div className="sm:col-span-1">
                                    <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
                                        Defect Location
                                    </label>
                                    <input
                                        type="text"
                                        id="location"
                                        name="location"
                                        value={formData.location}
                                        onChange={handleChange}
                                        className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                        placeholder="e.g., Top edge, Bottom surface, etc."
                                    />
                                </div>

                                {/* Defect Severity */}
                                <div className="sm:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-3">
                                        Severity <span className="text-red-500">*</span>
                                    </label>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        {severities.map((severity) => (
                                            <div
                                                key={severity.value}
                                                className={`relative rounded-lg border p-4 flex cursor-pointer focus-within:outline-none ${formData.severity === severity.value
                                                    ? `bg-${severity.value === "critical" ? "red" : severity.value === "major" ? "orange" : "green"}-50 border-${severity.value === "critical" ? "red" : severity.value === "major" ? "orange" : "green"}-300 ring-2 ring-${severity.value === "critical" ? "red" : severity.value === "major" ? "orange" : "green"}-500`
                                                    : "border-gray-300"
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
                                                        className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                                                    />
                                                </div>
                                                <div className="ml-3 flex flex-col">
                                                    <label htmlFor={severity.value} className={`block text-sm font-medium ${severity.value === "critical" ? "text-red-700" :
                                                        severity.value === "major" ? "text-orange-700" :
                                                            "text-green-700"
                                                        }`}>
                                                        {severity.label}
                                                    </label>
                                                    <span className="text-xs text-gray-500">{severity.description}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Measurements */}
                                <div className="sm:col-span-2 border-t border-gray-200 pt-5">
                                    <div className="flex items-center mb-3">
                                        <h4 className="text-sm font-medium text-gray-700">Measurements</h4>
                                        <span className="ml-2 text-xs text-gray-500">(Optional)</span>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div>
                                            <label htmlFor="expected" className="block text-xs text-gray-500 mb-1">
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
                                                className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                            />
                                        </div>
                                        <div>
                                            <label htmlFor="actual" className="block text-xs text-gray-500 mb-1">
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
                                                className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                            />
                                        </div>
                                        <div>
                                            <label htmlFor="unit" className="block text-xs text-gray-500 mb-1">
                                                Unit of Measurement
                                            </label>
                                            <input
                                                type="text"
                                                id="unit"
                                                name="measurements.unit"
                                                value={formData.measurements.unit}
                                                onChange={handleChange}
                                                placeholder="Unit (mm, cm, etc.)"
                                                className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Description */}
                                <div className="sm:col-span-2">
                                    <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                                        Description <span className="text-red-500">*</span>
                                    </label>
                                    <textarea
                                        id="description"
                                        name="description"
                                        value={formData.description}
                                        onChange={handleChange}
                                        required
                                        rows="4"
                                        className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                        placeholder="Provide detailed description of the defect..."
                                    ></textarea>
                                </div>

                                {/* Image Upload */}
                                <div className="sm:col-span-2 border-t border-gray-200 pt-5">
                                    <label htmlFor="image-upload" className="block text-sm font-medium text-gray-700 mb-3">
                                        Defect Image
                                    </label>

                                    <div className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-md ${imagePreview ? 'border-gray-300 bg-white' : 'border-gray-300 bg-gray-50 hover:bg-gray-100'}`}>
                                        {!imagePreview ? (
                                            <div className="space-y-1 text-center">
                                                <FaCamera className="mx-auto h-12 w-12 text-gray-300" />
                                                <div className="flex text-sm text-gray-600">
                                                    <label htmlFor="image-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500">
                                                        <span>Upload an image</span>
                                                        <input
                                                            id="image-upload"
                                                            name="image"
                                                            type="file"
                                                            className="sr-only"
                                                            onChange={handleImageChange}
                                                            accept="image/jpeg,image/jpg,image/png,image/gif"
                                                        />
                                                    </label>
                                                    <p className="pl-1">or drag and drop</p>
                                                </div>
                                                <p className="text-xs text-gray-500">JPG, PNG or GIF up to 5MB</p>
                                            </div>
                                        ) : (
                                            <div className="relative w-full">
                                                <img
                                                    src={imagePreview}
                                                    alt="Defect preview"
                                                    className="max-h-64 mx-auto rounded-md shadow-inner"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={removeImage}
                                                    className="absolute top-2 right-2 bg-red-100 text-red-600 p-2 rounded-full hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                                                >
                                                    <FaTrash className="h-4 w-4" />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="mt-8 border-t border-gray-200 pt-5">
                                <div className="flex justify-end space-x-3">
                                    <button
                                        type="button"
                                        onClick={() => navigate("/defects")}
                                        className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className={`inline-flex justify-center items-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors ${loading ? "opacity-70 cursor-not-allowed" : ""
                                            }`}
                                    >
                                        {loading ? (
                                            <>
                                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                Updating...
                                            </>
                                        ) : (
                                            <>
                                                <FaSave className="mr-2 h-4 w-4" />
                                                Update Defect
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

export default EditDefect;
