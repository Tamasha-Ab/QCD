import { useState, useEffect } from "react";
import { Upload, Camera, FileCheck2, AlertTriangle, Loader2 } from "lucide-react";
import { directApi } from "../api/api";

const AIDetection = () => {
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    id: "",
    productName: "",
    batch: "",
    date: "",
    confidence: "",
    status: "",
    type: "",
    imageUrl: null,
  });
  const [image, setImage] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [detecting, setDetecting] = useState(false);

  // Helper to resolve image URL (backend might return relative path)
  const resolveImageUrl = (url) => {
    if (!url) return null;
    if (url.startsWith("http") || url.startsWith("/")) return url;
    // If relative path without leading slash, add it
    return `/uploads/${url}`;
  };

  // Fetch initial defect data from backend API on mount
  useEffect(() => {
    async function fetchData() {
      try {
        const response = await directApi.get('/api/ai/data');
        const data = response.data;
        if (data.imageUrl) setImage(resolveImageUrl(data.imageUrl));
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();

    // Cleanup preview URL on unmount
    return () => {
      if (imageFile) URL.revokeObjectURL(image);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Upload image and send it to backend for TensorFlow detection
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Clean up previous preview URL if exists
    if (imageFile) URL.revokeObjectURL(image);

    setImageFile(file);
    const previewUrl = URL.createObjectURL(file);
    setImage(previewUrl);

    // Send image file to backend for detection
    setDetecting(true);
    try {
      const formPayload = new FormData();
      formPayload.append("image", file);

      const response = await directApi.post('/api/ai/detect', formPayload, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const detectionResult = response.data;
      // Map backend response to flat formData for the UI
      if (detectionResult && detectionResult.data && detectionResult.data.detection) {
        setFormData({
          confidence: detectionResult.data.detection.confidence || "",
          type: detectionResult.data.detection.defectType || "",
          status: detectionResult.data.detection.hasDefect ? "Defective" : "Good",
          imageUrl: detectionResult.data.imageUrl || null,
          id: detectionResult.data.id || ("AUTO_ID_" + Date.now()),
          productName: detectionResult.data.productName || "Default Product",
          batch: detectionResult.data.batch || ("BATCH_" + Math.floor(1000 + Math.random() * 9000)),
          date: new Date().toISOString().slice(0, 10),
        });
        if (detectionResult.data.imageUrl) setImage(resolveImageUrl(detectionResult.data.imageUrl));
      } else {
        // fallback: set raw response
        setFormData(detectionResult);
      }
    } catch (error) {
      console.error(error);
      alert("Defect detection failed. Try again.");
    } finally {
      setDetecting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-2xl p-12 border border-white/20 text-center max-w-md">
          <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Loader2 className="h-10 w-10 text-white animate-spin" />
          </div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">Initializing AI System</h3>
          <p className="text-gray-600 leading-relaxed">Loading AI detection system...</p>
          <div className="mt-6 w-full bg-gray-200 rounded-full h-2">
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
          </div>
        </div>
      </div>
    );
  }

  if (!formData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-2xl p-12 border border-white/20 text-center max-w-md">
          <div className="w-20 h-20 bg-gradient-to-r from-red-500 to-red-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="h-10 w-10 text-white" />
          </div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">System Error</h3>
          <p className="text-gray-600 leading-relaxed">Failed to load AI detection system.</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-6 px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white font-semibold rounded-xl shadow-lg hover:from-red-700 hover:to-red-800 transition-all duration-200 transform hover:-translate-y-0.5"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const getStatusColor = (status) => {
    if (!status) return "gray";

    status = status.toLowerCase();
    if (status.includes("good")) return "green";
    if (status.includes("defect")) return "red";
    return "yellow";
  };

  const statusColor = getStatusColor(formData.status);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Enhanced Header Section - Normal positioning to scroll with content */}
      <div className="bg-white/95 backdrop-blur-sm shadow-lg border-b border-gray-200/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="flex items-center space-x-4">
              <div className="w-14 h-14 bg-gradient-to-r from-purple-500 via-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center shadow-xl">
                <Camera className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                  AI Defect Detection
                </h1>
                <p className="text-gray-600 text-sm lg:text-base">Upload an image to detect product defects using AI</p>
              </div>
            </div>

            <div className="flex items-center">
              <label htmlFor="upload-image" className={`
                flex items-center justify-center gap-3 px-6 py-3 rounded-xl font-semibold text-sm lg:text-base shadow-lg transition-all duration-200 transform
                ${detecting ?
                  "bg-gray-300 text-gray-500 cursor-not-allowed" :
                  "bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 cursor-pointer hover:-translate-y-0.5 hover:shadow-xl"
                }
              `}>
                {detecting ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Processing AI Analysis...
                  </>
                ) : (
                  <>
                    <Upload className="h-5 w-5" />
                    Upload & Detect Image
                  </>
                )}
              </label>
              <input
                id="upload-image"
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                disabled={detecting}
                className="hidden"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {/* Enhanced Image Section */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 overflow-hidden transition-all duration-300 hover:shadow-2xl">
            {/* Section Header */}
            <div className="bg-gradient-to-r from-blue-50 via-purple-50 to-indigo-50 px-6 py-5 border-b border-gray-100/50">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-800 flex items-center">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mr-3">
                    <Camera className="h-4 w-4 text-white" />
                  </div>
                  Product Image Analysis
                </h2>
                {detecting && (
                  <div className="flex items-center text-sm text-blue-600 font-medium">
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    AI Processing...
                  </div>
                )}
              </div>
            </div>

            <div className="p-6">
              {image ? (
                <div className="relative rounded-xl overflow-hidden shadow-2xl border border-gray-200/50 bg-gradient-to-br from-gray-50 to-white">
                  <img
                    src={image}
                    alt="Product for defect detection"
                    className="w-full object-contain max-h-[450px] transition-all duration-300"
                  />
                  {/* Enhanced Status Overlay */}
                  {formData.status && (
                    <div className="absolute top-4 right-4">
                      <div className={`
                        px-4 py-2 rounded-full text-sm font-bold shadow-lg backdrop-blur-sm border
                        ${statusColor === "green" ? "bg-green-100/90 text-green-800 border-green-300" :
                          statusColor === "red" ? "bg-red-100/90 text-red-800 border-red-300" :
                            "bg-yellow-100/90 text-yellow-800 border-yellow-300"}
                      `}>
                        {formData.status}
                      </div>
                    </div>
                  )}

                  {/* AI Confidence Indicator */}
                  {formData.confidence && (
                    <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm rounded-xl px-4 py-2 shadow-lg border border-white/50">
                      <div className="flex items-center space-x-2">
                        <span className="text-yellow-500">⚡</span>
                        <span className="text-sm font-semibold text-gray-700">AI Confidence:</span>
                        <span className="text-sm font-bold text-blue-600">{formData.confidence}</span>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-[400px] bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 rounded-xl border-2 border-dashed border-gray-300 text-center p-8 transition-all duration-300 hover:border-blue-400">
                  <div className="w-20 h-20 bg-gradient-to-r from-gray-200 to-gray-300 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
                    <Upload className="h-10 w-10 text-gray-500" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-700 mb-2">No Image Uploaded</h3>
                  <p className="text-gray-600 mb-4 max-w-xs leading-relaxed">Upload an image to begin AI-powered defect detection analysis</p>
                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <FileCheck2 className="h-4 w-4" />
                    <span>Supported: JPG, PNG, WEBP</span>
                  </div>
                </div>
              )}

              {/* Enhanced File Info */}
              <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-200/50">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center text-gray-600">
                    <FileCheck2 className="h-4 w-4 mr-2" />
                    <span className="font-medium">Supported formats: JPG, PNG, WEBP</span>
                  </div>
                  <div className="text-blue-600 font-semibold">
                    Max size: 10MB
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Results Section */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 overflow-hidden transition-all duration-300 hover:shadow-2xl">
            {/* Section Header */}
            <div className="bg-gradient-to-r from-purple-50 via-blue-50 to-indigo-50 px-6 py-5 border-b border-gray-100/50">
              <h2 className="text-xl font-bold text-gray-800 flex items-center">
                <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-600 rounded-lg flex items-center justify-center mr-3">
                  <AlertTriangle className="h-4 w-4 text-white" />
                </div>
                Detection Results
              </h2>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Enhanced Form Fields */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-600 uppercase tracking-wider flex items-center">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                    ID
                  </label>
                  <div className="bg-gradient-to-r from-gray-50 to-blue-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-800 font-mono text-sm shadow-sm">
                    {formData.id || "—"}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-600 uppercase tracking-wider flex items-center">
                    <div className="w-2 h-2 bg-purple-500 rounded-full mr-2"></div>
                    Product Name
                  </label>
                  <div className="bg-gradient-to-r from-gray-50 to-purple-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-800 font-medium shadow-sm">
                    {formData.productName || "—"}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-600 uppercase tracking-wider flex items-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                    Batch Number
                  </label>
                  <div className="bg-gradient-to-r from-gray-50 to-green-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-800 font-medium shadow-sm">
                    {formData.batch || "—"}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-600 uppercase tracking-wider flex items-center">
                    <div className="w-2 h-2 bg-orange-500 rounded-full mr-2"></div>
                    Detected Date
                  </label>
                  <div className="bg-gradient-to-r from-gray-50 to-orange-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-800 font-medium shadow-sm">
                    {formData.date || "—"}
                  </div>
                </div>

                {/* Enhanced Confidence Score */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-600 uppercase tracking-wider flex items-center">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></div>
                    AI Confidence Score
                    <span className="ml-2 text-yellow-500">⚡</span>
                  </label>
                  <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-xl px-4 py-3 shadow-sm">
                    <div className="text-gray-800 font-bold text-lg">
                      {formData.confidence || "—"}
                    </div>
                    {formData.confidence && (
                      <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-yellow-400 to-orange-500 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${parseFloat(formData.confidence) || 0}%` }}
                        ></div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Enhanced Status */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-600 uppercase tracking-wider flex items-center">
                    <div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
                    Status
                  </label>
                  <div className={`
                    rounded-xl px-4 py-3 font-bold text-center shadow-sm border-2
                    ${statusColor === "green" ? "bg-gradient-to-r from-green-50 to-emerald-50 text-green-800 border-green-300" :
                      statusColor === "red" ? "bg-gradient-to-r from-red-50 to-rose-50 text-red-800 border-red-300" :
                        "bg-gradient-to-r from-yellow-50 to-amber-50 text-yellow-800 border-yellow-300"}
                  `}>
                    {formData.status || "—"}
                  </div>
                </div>

                {/* Enhanced Defect Type */}
                <div className="sm:col-span-2 space-y-2">
                  <label className="text-xs font-bold text-gray-600 uppercase tracking-wider flex items-center">
                    <div className="w-2 h-2 bg-indigo-500 rounded-full mr-2"></div>
                    Defect Type
                  </label>
                  <div className="bg-gradient-to-r from-gray-50 to-indigo-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-800 font-medium shadow-sm">
                    {formData.type || "—"}
                  </div>
                </div>
              </div>

              {/* Enhanced AI Info Section */}
              <div className="mt-8 p-6 bg-gradient-to-r from-blue-50 via-purple-50 to-indigo-50 rounded-xl border border-blue-200/50">
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                    <span className="text-white font-bold text-lg">AI</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-800 mb-1">TensorFlow Neural Network</h3>
                    <p className="text-sm text-gray-600 leading-relaxed">The AI detection system analyzes the image using a TensorFlow neural network to identify potential defects with high accuracy.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIDetection;
