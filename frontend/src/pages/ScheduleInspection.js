import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";
import { FaPlusCircle, FaClipboardList, FaArrowLeft, FaUpload, FaImage } from "react-icons/fa";

const ScheduleInspection = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [formData, setFormData] = useState({
    product: "",
    batchNumber: "",
    totalInspected: 0,
    notes: "",
  });
  const [error, setError] = useState("");
  const [images, setImages] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);

  // Fetch product list for dropdown
  useEffect(() => {
    const fetchProducts = async () => {
      setLoadingProducts(true);
      try {
        const response = await api.get("/products");

        // Ensure we're handling the data correctly based on API response structure
        let productData = [];
        if (response.data.data && Array.isArray(response.data.data)) {
          productData = response.data.data;
        } else if (Array.isArray(response.data)) {
          productData = response.data;
        } else {
          console.error("Unexpected API response format:", response.data);
        }

        console.log("Fetched products:", productData);
        setProducts(productData);
      } catch (err) {
        console.error("Failed to fetch products", err);
        setError("Failed to load products. Please try again.");
      } finally {
        setLoadingProducts(false);
      }
    };

    fetchProducts();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;

    // Special handling for the product dropdown with "add-new" option
    if (name === "product" && value === "add-new") {
      // Navigate to add product page
      navigate("/products/add");
      return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: name === "totalInspected" ? parseInt(value) || 0 : value,
    }));

    // Clear any previous error when user makes changes
    if (error) setError("");
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);

    // Validate files
    const validFiles = files.filter((file) => {
      const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif"];
      const isValidType = validTypes.includes(file.type);
      const isValidSize = file.size <= 5 * 1024 * 1024; // 5MB limit
      return isValidType && isValidSize;
    });

    if (validFiles.length < files.length) {
      setError(
        "Some files were rejected. Please ensure all files are images (JPG, PNG, GIF) under 5MB."
      );
    }

    // Create preview URLs
    const newPreviewUrls = validFiles.map((file) => URL.createObjectURL(file));
    setPreviewUrls((prev) => [...prev, ...newPreviewUrls]);
    setImages((prev) => [...prev, ...validFiles]);
  };

  const removeImage = (index) => {
    // Remove image and preview at the specified index
    URL.revokeObjectURL(previewUrls[index]); // Free up memory
    setPreviewUrls((prev) => prev.filter((_, i) => i !== index));
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.product) {
      setError("Please select a product");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // First create the inspection
      const response = await api.post(
        "/inspections",
        formData
      );

      console.log("Inspection created:", response.data);
      const inspectionId = response.data.data._id;

      // If images exist, upload them
      if (images.length > 0) {
        const imageFormData = new FormData();
        images.forEach((image) => {
          imageFormData.append("images", image);
        });

        await api.post(
          `/inspections/${inspectionId}/images`,
          imageFormData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          }
        );
      }

      // Set multiple flags to ensure refresh happens
      localStorage.setItem('newInspectionCreated', Date.now().toString());
      localStorage.setItem('forceInspectionRefresh', 'true');

      // Add a small delay before navigation to ensure the data is saved
      setTimeout(() => {
        navigate("/inspection", {
          state: {
            refreshInspections: true,
            newInspectionId: inspectionId
          }
        });
      }, 500);

    } catch (err) {
      console.error("Error scheduling inspection:", err);
      setError(
        err.response?.data?.error ||
        "Failed to schedule inspection. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const goToAddProduct = (e) => {
    e.preventDefault();
    navigate("/products/add");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Enhanced Header Bar */}
      <div className="bg-white/95 backdrop-blur-sm shadow-lg border-b border-gray-200/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-4 md:py-6 gap-4 sm:gap-0">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <FaClipboardList className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                  Schedule New Inspection
                </h1>
                <p className="text-sm text-gray-600 hidden sm:block">Create a quality inspection for products</p>
              </div>
            </div>
            <button
              onClick={() => navigate("/inspection")}
              className="inline-flex items-center px-6 py-3 bg-white border border-gray-300 text-gray-700 text-sm font-semibold rounded-xl shadow-lg hover:bg-gray-50 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 transform hover:-translate-y-0.5"
            >
              <FaArrowLeft className="mr-2 h-4 w-4" />
              Back to Inspections
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-12">
        {/* Enhanced Main Content Card */}
        <div className="bg-white/80 backdrop-blur-sm shadow-2xl rounded-2xl overflow-hidden border border-white/20">
          {/* Enhanced Form Header */}
          <div className="bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-600 px-6 py-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <FaClipboardList className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl lg:text-2xl font-bold text-white">Inspection Details</h2>
                <p className="text-blue-100 text-sm lg:text-base mt-1">Fill out the form below to schedule a new quality inspection</p>
              </div>
            </div>
          </div>

          {/* Enhanced Error Alert */}
          {error && (
            <div className="mx-6 mt-6 bg-red-50/90 backdrop-blur-sm border border-red-200 rounded-xl shadow-lg overflow-hidden">
              <div className="bg-gradient-to-r from-red-500 to-red-600 h-1"></div>
              <div className="p-4">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                      <svg className="h-5 w-5 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-4 flex-1">
                    <h3 className="text-sm font-semibold text-red-800">Error</h3>
                    <p className="text-sm text-red-700 mt-1">{error}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Enhanced Form Content */}
          <div className="px-6 py-8">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Enhanced Product Selection */}
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-200/50">
                <div className="flex justify-between items-center mb-4">
                  <label className="flex items-center text-sm font-bold text-gray-800 mb-4">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                    Product Selection <span className="text-red-500 ml-1">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={goToAddProduct}
                    className="inline-flex items-center text-blue-600 text-sm font-semibold hover:text-blue-800 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-all duration-200"
                  >
                    <FaPlusCircle className="mr-2 h-4 w-4" /> Add New Product
                  </button>
                </div>

                {loadingProducts ? (
                  <div className="w-full border border-gray-300 rounded-xl px-4 py-3 bg-gray-50/70 text-gray-500 flex items-center shadow-sm">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Loading products...
                  </div>
                ) : (
                  <>
                    {products.length > 0 ? (
                      <select
                        name="product"
                        value={formData.product}
                        onChange={handleChange}
                        required
                        className="w-full pl-4 pr-10 py-3 text-base border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 rounded-xl shadow-sm bg-white/80 backdrop-blur-sm hover:shadow-md transition-all duration-200"
                      >
                        <option value="">Select a product</option>
                        {products.map((product) => (
                          <option key={product._id} value={product._id}>
                            {product.name} {product.category ? `(${product.category})` : ''}
                          </option>
                        ))}
                        <option value="add-new" className="font-semibold text-blue-600 bg-blue-50">
                          + Add New Product
                        </option>
                      </select>
                    ) : (
                      <div className="w-full border border-red-300 rounded-xl px-4 py-3 bg-red-50/80 backdrop-blur-sm text-red-700 flex items-center justify-between shadow-sm">
                        <span className="flex items-center">
                          <svg className="w-5 h-5 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                          </svg>
                          No products available.
                        </span>
                        <button
                          onClick={goToAddProduct}
                          className="ml-2 font-semibold text-blue-600 hover:text-blue-800 hover:bg-blue-100 px-3 py-1 rounded-lg transition-all duration-200"
                          type="button"
                        >
                          Add products now
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Enhanced Batch Number */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200/50">
                <label className="flex items-center text-sm font-bold text-gray-800 mb-4">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                  Batch Number <span className="text-red-500 ml-1">*</span>
                </label>
                <input
                  type="text"
                  name="batchNumber"
                  value={formData.batchNumber}
                  onChange={handleChange}
                  required
                  className="w-full border border-gray-300 rounded-xl shadow-sm py-3 px-4 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-base bg-white/80 backdrop-blur-sm hover:shadow-md transition-all duration-200"
                  placeholder="Enter batch number (e.g., BATCH-2024-001)"
                />
              </div>

              {/* Enhanced Total Inspected */}
              <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-6 border border-yellow-200/50">
                <label className="flex items-center text-sm font-bold text-gray-800 mb-4">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></div>
                  Total Items Inspected <span className="text-red-500 ml-1">*</span>
                </label>
                <input
                  type="number"
                  name="totalInspected"
                  value={formData.totalInspected}
                  onChange={handleChange}
                  required
                  min="1"
                  className="w-full border border-gray-300 rounded-xl shadow-sm py-3 px-4 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 text-base bg-white/80 backdrop-blur-sm hover:shadow-md transition-all duration-200"
                  placeholder="Enter total items inspected"
                />
              </div>

              {/* Enhanced Notes */}
              <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-6 border border-purple-200/50">
                <label className="flex items-center text-sm font-bold text-gray-800 mb-4">
                  <div className="w-2 h-2 bg-purple-500 rounded-full mr-2"></div>
                  Additional Notes
                </label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-xl shadow-sm py-3 px-4 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-base bg-white/80 backdrop-blur-sm hover:shadow-md transition-all duration-200 resize-none"
                  rows="4"
                  placeholder="Add any notes about this inspection..."
                ></textarea>
              </div>

              {/* Enhanced Image Upload */}
              <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-xl p-6 border border-indigo-200/50">
                <label className="flex items-center text-sm font-bold text-gray-800 mb-4">
                  <div className="w-2 h-2 bg-indigo-500 rounded-full mr-2"></div>
                  Upload Images
                  <span className="text-gray-500 ml-2 text-xs font-normal">(optional)</span>
                </label>
                <div className="flex justify-center px-6 pt-8 pb-6 border-2 border-gray-300 border-dashed rounded-xl hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 hover:border-blue-400 transition-all duration-300 group cursor-pointer">
                  <div className="space-y-3 text-center">
                    <div className="mx-auto h-16 w-16 text-gray-400 group-hover:text-blue-500 transition-colors duration-300">
                      <FaUpload className="mx-auto h-16 w-16" />
                    </div>
                    <div className="flex text-base text-gray-600">
                      <label
                        htmlFor="file-upload"
                        className="relative cursor-pointer bg-white rounded-xl font-semibold text-blue-600 hover:text-blue-800 focus-within:outline-none px-4 py-2 shadow-sm border border-blue-200 hover:bg-blue-50 transition-all duration-200"
                      >
                        <span>Upload files</span>
                        <input
                          id="file-upload"
                          name="file-upload"
                          type="file"
                          multiple
                          onChange={handleImageChange}
                          className="sr-only"
                          accept="image/jpeg,image/jpg,image/png,image/gif"
                        />
                      </label>
                      <p className="pl-3 text-gray-600">or drag and drop</p>
                    </div>
                    <p className="text-sm text-gray-500 bg-white/60 backdrop-blur-sm px-4 py-2 rounded-lg border border-gray-200">
                      <FaImage className="inline mr-2" />
                      Up to 5 images (JPG, PNG, GIF, max 5MB each)
                    </p>
                  </div>
                </div>

                {/* Enhanced Image Previews */}
                {previewUrls.length > 0 && (
                  <div className="mt-6">
                    <h4 className="text-sm font-semibold text-gray-800 mb-4 flex items-center">
                      <FaImage className="mr-2 text-indigo-500" />
                      Uploaded Images ({previewUrls.length})
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                      {previewUrls.map((url, index) => (
                        <div key={index} className="relative group">
                          <div className="aspect-w-1 aspect-h-1 w-full overflow-hidden rounded-xl bg-gray-200 shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-300">
                            <img
                              src={url}
                              alt={`Preview ${index}`}
                              className="h-full w-full object-cover object-center group-hover:scale-110 transition-transform duration-300"
                            />
                            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 flex items-center justify-center transition-all duration-300 rounded-xl">
                              <button
                                type="button"
                                onClick={() => removeImage(index)}
                                className="opacity-0 group-hover:opacity-100 bg-red-500 hover:bg-red-600 text-white rounded-full p-2 transform scale-75 group-hover:scale-100 transition-all duration-300 shadow-lg"
                                title="Remove image"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </div>
                          </div>
                          <p className="mt-2 text-xs text-gray-600 text-center font-medium bg-gray-100 px-2 py-1 rounded-lg">
                            Image {index + 1}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Enhanced Form Actions */}
              <div className="pt-6 border-t border-gradient-to-r from-gray-200 to-blue-200">
                <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl p-6 border border-gray-200/50">
                  <div className="flex flex-col sm:flex-row sm:justify-between gap-4">
                    <button
                      type="button"
                      onClick={() => navigate("/inspection")}
                      className="w-full sm:w-auto inline-flex justify-center items-center px-6 py-3 border border-gray-300 rounded-xl shadow-lg text-sm font-semibold text-gray-700 bg-white hover:bg-gray-50 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 transform hover:-translate-y-0.5"
                    >
                      <FaArrowLeft className="mr-2 h-4 w-4" />
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading || loadingProducts || products.length === 0}
                      className={`w-full sm:w-auto inline-flex justify-center items-center px-8 py-3 border border-transparent rounded-xl shadow-lg text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 transform hover:-translate-y-0.5 hover:shadow-xl ${(loading || loadingProducts || products.length === 0)
                        ? "opacity-70 cursor-not-allowed transform-none hover:shadow-lg"
                        : ""
                        }`}
                    >
                      {loading ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Scheduling Inspection...
                        </>
                      ) : (
                        <>
                          <FaClipboardList className="mr-2 h-5 w-5" />
                          Schedule Inspection
                        </>
                      )}
                    </button>
                  </div>

                  {/* Additional Info */}
                  <div className="mt-4 pt-4 border-t border-gray-200/50">
                    <div className="flex items-center text-xs text-gray-500">
                      <svg className="w-4 h-4 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>
                        All fields marked with <span className="text-red-500 font-semibold">*</span> are required.
                        Images are optional but recommended for quality documentation.
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScheduleInspection;