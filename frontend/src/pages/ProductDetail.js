import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/api";
import ProductImageUpload from "../components/ProductImageUpload";

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Fetch product details
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await api.get(`/products/${id}`);
        setProduct(response.data.data);
      } catch (err) {
        console.error("Failed to fetch product details", err);
        setError(
          err.response?.data?.error ||
          "Failed to load product details. Please try again."
        );
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchProduct();
    }
  }, [id]);

  const handleImageUploadSuccess = (updatedProduct) => {
    // Update the product state with the new image URL
    setProduct(updatedProduct);
  };

  if (loading) {
    return (
      <div className="p-6 flex justify-center">
        <p>Loading product details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-100 p-4 rounded text-red-700 mb-4">{error}</div>
        <button
          onClick={() => navigate(-1)}
          className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
        >
          Go Back
        </button>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="p-6">
        <p>Product not found.</p>
        <button
          onClick={() => navigate(-1)}
          className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 mt-2"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{product.name}</h1>
        <button
          onClick={() => navigate(-1)}
          className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
        >
          Go Back
        </button>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <div className="bg-white rounded shadow p-4">
            <h2 className="font-bold text-lg mb-3">Product Details</h2>
            <div className="space-y-2">
              <p>
                <span className="font-medium">Category:</span> {product.category}
              </p>
              <p>
                <span className="font-medium">Description:</span>{" "}
                {product.description || "No description available"}
              </p>
              <div>
                <h3 className="font-medium mt-3 mb-1">Specifications</h3>
                {product.specs && Object.keys(product.specs).length > 0 ? (
                  <ul className="list-disc list-inside">
                    {Object.entries(product.specs).map(([key, value]) => (
                      <li key={key}>
                        <span className="font-medium">{key}:</span> {value}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-500">No specifications available</p>
                )}
              </div>
            </div>
          </div>
        </div>

        <div>
          <ProductImageUpload
            productId={product._id}
            onSuccess={handleImageUploadSuccess}
            currentImage={product.imageUrl}
          />
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;