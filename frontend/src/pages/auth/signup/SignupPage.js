import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import api from "../../../api/api";

const SignupPage = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "inspector",
    department: "",
    termsAccepted: false,
  });

  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = "Name is required";
    if (!formData.email.trim()) newErrors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = "Invalid email";
    if (!formData.password) newErrors.password = "Password is required";
    else if (formData.password.length < 6) newErrors.password = "Minimum 6 characters";
    if (formData.password !== formData.confirmPassword)
      newErrors.confirmPassword = "Passwords do not match";
    if (!formData.department.trim()) newErrors.department = "Department is required";
    if (!formData.termsAccepted) newErrors.termsAccepted = "You must accept the terms";

    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validate();
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length === 0) {
      try {
        const newUser = {
          name: formData.name,
          email: formData.email,
          password: formData.password,
          role: formData.role,
          department: formData.department,
        };

        await api.post("/auth/register", newUser);
        navigate("/login");
      } catch (err) {
        setErrors({ apiError: err.response?.data?.error || "Signup failed" });
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#1E73BE]">
      <form
        onSubmit={handleSubmit}
        className="w-[90%] max-w-md p-8 rounded-lg bg-white/10 backdrop-blur-md text-white"
      >
        <h2 className="text-4xl font-bold text-center mb-8">Sign Up</h2>

        {errors.apiError && <p className="text-red-400 text-sm mb-4">{errors.apiError}</p>}

        <input
          type="text"
          name="name"
          placeholder="Name"
          value={formData.name}
          onChange={handleChange}
          className={`w-full px-4 py-2 mb-3 border ${errors.name ? "border-red-500" : "border-white"
            } rounded bg-transparent placeholder-white`}
        />
        {errors.name && <p className="text-red-500 text-xs mb-2">{errors.name}</p>}

        <input
          type="email"
          name="email"
          placeholder="Email Address"
          value={formData.email}
          onChange={handleChange}
          className={`w-full px-4 py-2 mb-3 border ${errors.email ? "border-red-500" : "border-white"
            } rounded bg-transparent placeholder-white`}
        />
        {errors.email && <p className="text-red-500 text-xs mb-2">{errors.email}</p>}

        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            className={`w-full px-4 py-2 pr-12 mb-3 border ${errors.password ? "border-red-500" : "border-white"
              } rounded bg-transparent placeholder-white`}
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
        {errors.password && <p className="text-red-500 text-xs mb-2">{errors.password}</p>}

        <div className="relative">
          <input
            type={showConfirmPassword ? "text" : "password"}
            name="confirmPassword"
            placeholder="Confirm Password"
            value={formData.confirmPassword}
            onChange={handleChange}
            className={`w-full px-4 py-2 pr-12 mb-3 border ${errors.confirmPassword ? "border-red-500" : "border-white"
              } rounded bg-transparent placeholder-white`}
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-3 top-2 text-white hover:text-gray-300 transition-colors"
            aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
          >
            {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>
        {errors.confirmPassword && (
          <p className="text-red-500 text-xs mb-2">{errors.confirmPassword}</p>
        )}

        <select
          name="role"
          value={formData.role}
          onChange={handleChange}
          className="w-full px-4 py-2 mb-3 border border-white rounded bg-transparent text-white"
        >
          <option value="inspector" className="text-black">Inspector</option>
          <option value="manager" className="text-black">Manager</option>
          <option value="admin" className="text-black">Admin</option>
        </select>

        <input
          type="text"
          name="department"
          placeholder="Department"
          value={formData.department}
          onChange={handleChange}
          className={`w-full px-4 py-2 mb-3 border ${errors.department ? "border-red-500" : "border-white"
            } rounded bg-transparent placeholder-white`}
        />
        {errors.department && <p className="text-red-500 text-xs mb-2">{errors.department}</p>}

        <label className="flex items-center text-sm mt-4 mb-2">
          <input
            type="checkbox"
            name="termsAccepted"
            checked={formData.termsAccepted}
            onChange={handleChange}
            className="mr-2 w-4 h-4 accent-white"
          />
          <span>I accept the Terms of Use & Privacy Policy.</span>
        </label>
        {errors.termsAccepted && (
          <p className="text-red-500 text-xs mb-4">{errors.termsAccepted}</p>
        )}

        <button
          type="submit"
          className="w-full bg-white text-[#1E73BE] font-semibold py-2 rounded-2xl hover:bg-gray-100 transition mb-6"
        >
          Sign Up
        </button>
      </form>
    </div>
  );
};

export default SignupPage;
