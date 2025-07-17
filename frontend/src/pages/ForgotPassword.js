import { useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/api";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");
    setLoading(true);

    try {
      const res = await api.post("/auth/forgot-password", { email });
      setMessage(res.data.message);
      setEmail("");
    } catch (err) {
      console.error("Forgot password error:", err);
      const errorMessage = err.response?.data?.error || "Something went wrong. Please try again.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#1E73BE]">
      <form
        onSubmit={handleSubmit}
        className="w-[320px] sm:w-[400px] p-8 rounded-lg bg-white/10 backdrop-blur-md text-white"
      >
        <h2 className="text-3xl font-bold text-center mb-6">Forgot Password</h2>

        {message && (
          <div className="text-green-300 text-sm mb-4 p-3 bg-green-100/10 border border-green-300 rounded">
            {message}
          </div>
        )}
        {error && (
          <div className="text-red-400 text-sm mb-4 p-3 bg-red-100/10 border border-red-400 rounded">
            {error}
          </div>
        )}

        <input
          type="email"
          name="email"
          placeholder="Enter your registered email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-4 py-2 mb-6 border border-white rounded bg-transparent placeholder-white focus:outline-none"
          required
          disabled={loading}
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-white text-[#1E73BE] font-semibold py-2 rounded-2xl hover:bg-gray-100 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Sending..." : "Send Reset Link"}
        </button>

        <div className="text-center mt-6 text-sm text-white">
          <Link to="/login" className="underline">
            Back to login
          </Link>
        </div>
      </form>
    </div>
  );
};

export default ForgotPassword;
