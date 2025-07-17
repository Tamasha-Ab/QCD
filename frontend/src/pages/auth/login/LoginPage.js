import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import api from "../../../api/api";

const LoginPage = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    password: "",
  });

  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const res = await api.post("/auth/login", formData);
      console.log("Login success:", res.data);

      // Optional: store token based on rememberMe
      if (rememberMe) {
        localStorage.setItem("token", res.data.token);
      }

      navigate("/dashboard");
    } catch (err) {
      console.error("Login error:", err);
      setError(err.response?.data?.error || "Login failed. Please try again.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#1E73BE]">
      <form
        onSubmit={handleSubmit}
        className="w-[320px] sm:w-[400px] p-8 rounded-lg bg-white/10 backdrop-blur-md text-white"
      >
        <h2 className="text-4xl font-bold text-center mb-8">Log in</h2>

        {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

        <input
          type="text"
          name="name"
          placeholder="Name"
          value={formData.name}
          onChange={handleInputChange}
          className="w-full px-4 py-2 mb-4 border border-white rounded bg-transparent placeholder-white focus:outline-none"
        />

        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleInputChange}
            className="w-full px-4 py-2 pr-12 mb-2 border border-white rounded bg-transparent placeholder-white focus:outline-none"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-2 text-white hover:text-gray-300 transition-colors"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>

        {/* Remember me and Forgot password */}
        <div className="flex items-center justify-between mb-6 text-sm mt-3">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="accent-white"
            />
            Remember me
          </label>

          <Link to="/forgot-password" className="underline hover:text-gray-200">
            Forgot password?
          </Link>
        </div>

        <button
          type="submit"
          className="w-full bg-white text-[#1E73BE] font-semibold py-2 rounded-2xl hover:bg-gray-100 transition mb-6"
        >
          Log In
        </button>

        <div className="border-t border-white/50 my-6" />

        <div className="text-center mb-4 text-sm text-white">or</div>

        <div className="text-center text-sm text-white">
          Don't have an account?{" "}
          <Link to="/signup" className="underline">
            Sign up
          </Link>
        </div>
      </form>
    </div>
  );
};

export default LoginPage;
