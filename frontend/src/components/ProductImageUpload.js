import React, { useState } from "react";
import api from "../api/api";

const ProductImageUpload = ({ productId, onSuccess, currentImage }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState(null);
  const [file, setFile] = useState(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    // Check file type
    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif"];
    if (!validTypes.includes(selectedFile.type)) {
      setError("Please select a valid image file (JPG, PNG, or GIF)");
      return;
    }

    // Check file size (5MB limit)
    if (selectedFile.size > 5 * 1024 * 1024) {
      setError("Image must be less than 5MB");
      return;
    }

    setFile(selectedFile);
    setError("");
    setUploadSuccess(false);

    // Create preview URL
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result);
    reader.readAsDataURL(selectedFile);
  };

  const handleUpload = async () => {
    if (!file) {
      setError("Please select an image to upload");
      return;
    }

    setLoading(true);
    setError("");
    setUploadSuccess(false);

    try {
      const formData = new FormData();
      formData.append("image", file);

      const response = await api.post(
        `/api/products/${productId}/image`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (onSuccess && typeof onSuccess === "function") {
        onSuccess(response.data.data);
      }

      setUploadSuccess(true);
      setTimeout(() => {
        setFile(null);
        setPreview(null);
        setUploadSuccess(false);
      }, 3000);
    } catch (err) {
      console.error("Failed to upload product image:", err);
      setError(
        err.response?.data?.error ||
        "Failed to upload image. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="border rounded p-4 bg-gray-50">
      <h3 className="font-medium mb-3">Product Image</h3>

      {currentImage && !preview && (
        <div className="mb-3">
          <img
            src={currentImage}
            alt="Current product"
            className="w-full max-w-xs rounded border"
          />
          <p className="text-sm text-gray-500 mt-1">Current image</p>
        </div>
      )}

      {preview && (
        <div className="mb-3">
          <img
            src={preview}
            alt="Upload preview"
            className="w-full max-w-xs rounded border"
          />
          <p className="text-sm text-gray-500 mt-1">Preview</p>
        </div>
      )}

      {error && (
        <div className="mb-3 p-2 bg-red-100 text-red-700 text-sm rounded">
          {error}
        </div>
      )}

      {uploadSuccess && (
        <div className="mb-3 p-2 bg-green-100 text-green-700 text-sm rounded">
          Image uploaded successfully!
        </div>
      )}

      <div className="flex flex-col gap-2 mt-3">
        <input
          type="file"
          onChange={handleFileChange}
          className="border p-2 rounded"
          accept="image/jpeg,image/jpg,image/png,image/gif"
        />

        <div className="flex gap-2">
          <button
            onClick={handleUpload}
            disabled={loading || !file}
            className={`px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 
              ${(loading || !file) ? "opacity-60 cursor-not-allowed" : ""}`}
          >
            {loading ? "Uploading..." : "Upload Image"}
          </button>

          {preview && (
            <button
              type="button"
              onClick={() => {
                setFile(null);
                setPreview(null);
              }}
              className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-100"
            >
              Cancel
            </button>
          )}
        </div>
        <p className="text-xs text-gray-500 mt-1">
          Supported formats: JPG, PNG, GIF (max 5MB)
        </p>
      </div>
    </div>
  );
};

export default ProductImageUpload;