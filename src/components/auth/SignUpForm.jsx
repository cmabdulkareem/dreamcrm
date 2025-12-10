import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeftIcon, EyeCloseIcon, EyeIcon } from "../../icons";
import Label from "../form/Label";
import Input from "../form/input/InputField";
import Checkbox from "../form/input/Checkbox";
import PhoneInput from "../form/group-input/PhoneInput";
import { countries } from "../../data/DataSets";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import API from "../../config/api";

export default function SignUpForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [isChecked, setIsChecked] = useState(false);
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [signupSuccess, setSignupSuccess] = useState(false); // ✅ NEW STATE
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
  });

  // Password validation
  const validatePassword = (password) => {
    const regex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_\-+=\[\]{};':"\\|,.<>/?]).{8,}$/;
    return regex.test(password);
  };

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (name === "password") {
      if (value && !validatePassword(value)) {
        setPasswordError(
          "Password must be at least 8 characters long, and include uppercase, lowercase, number, and special character."
        );
      } else {
        setPasswordError("");
      }
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isChecked) {
      toast.error("Please accept terms and conditions.");
      return;
    }

    if (!phone) {
      toast.error("Please enter your phone number.");
      return;
    }

    if (!validatePassword(formData.password)) {
      toast.error("Please enter a valid password.");
      return;
    }

    try {
      setLoading(true);
      const payload = { ...formData, phone, consent: isChecked };
      const response = await axios.post(`${API}/users/signup`, payload);

      // Check if this is the first user
      const { isFirstUser } = response.data;

      if (isFirstUser) {
        toast.success("Signup successful! You are the first user and have been granted admin privileges.");
      } else {
        toast.success("Signup successful! Your account is pending approval.");
      }

      setSignupSuccess(true); // ✅ Show thank-you message
      console.log("Signup success:", response.data);
    } catch (error) {
      console.error("Signup failed:", error.response?.data || error.message);
      toast.error(
        error.response?.data?.message || "Signup failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col flex-1 w-full overflow-y-auto lg:w-1/2 no-scrollbar">
      <ToastContainer position="top-center" />
      <div className="w-full max-w-md mx-auto mb-5 sm:pt-10">
        <Link
          to="/"
          className="inline-flex items-center text-sm text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
        >
          <ChevronLeftIcon className="size-5" />
          Back to dashboard
        </Link>
      </div>

      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
        {/* ✅ Conditional rendering */}
        {!signupSuccess ? (
          <div>
            <div className="mb-5 sm:mb-8">
              <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
                Sign Up
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Enter your email and password to sign up!
              </p>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="space-y-5">
                {/* Full Name */}
                <div className="sm:col-span-2">
                  <Label>
                    Full Name<span className="text-error-500">*</span>
                  </Label>
                  <Input
                    type="text"
                    name="fullName"
                    placeholder="Enter your full name"
                    value={formData.fullName}
                    onChange={handleChange}
                    required
                  />
                </div>

                {/* Email */}
                <div className="sm:col-span-2">
                  <Label>
                    Email<span className="text-error-500">*</span>
                  </Label>
                  <Input
                    type="email"
                    name="email"
                    placeholder="Enter your email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </div>

                {/* Phone */}
                <div className="sm:col-span-2">
                  <Label>
                    Mobile Number<span className="text-error-500">*</span>
                  </Label>
                  <PhoneInput
                    selectPosition="end"
                    countries={countries}
                    placeholder="+91 98765 43210"
                    value={phone}
                    onChange={setPhone}
                    required
                  />
                </div>

                {/* Password */}
                <div className="sm:col-span-2">
                  <Label>
                    Password<span className="text-error-500">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      placeholder="Enter your password"
                      value={formData.password}
                      onChange={handleChange}
                      required
                    />
                    <span
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2"
                    >
                      {showPassword ? (
                        <EyeIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                      ) : (
                        <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                      )}
                    </span>
                  </div>

                  {passwordError && (
                    <p className="mt-1 text-s text-red-500">{passwordError}</p>
                  )}
                </div>

                {/* Checkbox */}
                <div className="flex items-center gap-3">
                  <Checkbox
                    className="w-5 h-5"
                    checked={isChecked}
                    onChange={setIsChecked}
                  />
                  <p className="inline-block font-normal text-gray-500 dark:text-gray-400">
                    By creating an account you agree to the{" "}
                    <span className="text-gray-800 dark:text-white/90">
                      Terms and Conditions
                    </span>{" "}
                    and our{" "}
                    <span className="text-gray-800 dark:text-white">
                      Privacy Policy
                    </span>
                  </p>
                </div>

                {/* Submit Button */}
                <div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex items-center justify-center w-full px-4 py-3 text-sm font-medium text-white transition rounded-lg bg-gray-900 shadow-theme-xs hover:bg-gray-800 disabled:opacity-50"
                  >
                    {loading ? "Signing up..." : "Sign Up"}
                  </button>
                </div>
              </div>
            </form>

            <div className="mt-5">
              <p className="text-sm font-normal text-center text-gray-700 dark:text-gray-400 sm:text-start">
                Already have an account?{" "}
                <Link
                  to="/signin"
                  className="text-gray-700 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300"
                >
                  Sign In
                </Link>
              </p>
            </div>
          </div>
        ) : (
          // ✅ Thank You Message
          <div className="flex flex-col items-center justify-center text-center py-12 px-4">
            {/* Success Icon */}
            <div className="flex items-center justify-center w-20 h-20 mb-6 rounded-full bg-green-100 dark:bg-green-900/30">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-10 h-10 text-green-600 dark:text-green-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>

            {/* Title */}
            <h1 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
              Thank You!
            </h1>

            {/* Subtitle */}
            <p className="max-w-sm mb-6 text-gray-500 dark:text-gray-400">
              Your account has been successfully created and is now awaiting admin approval.
              Once approved, you’ll receive access to your dashboard.
            </p>

            {/* Optional loader or illustration */}
            <div className="flex justify-center mb-6 w-full">
              <img
                src="/images/brand/approval-pending.svg"
                alt="Waiting for approval"
                className="w-full h-auto"
              />
            </div>

            {/* Go to Sign In link */}
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Already have an approved account?{" "}
              <Link
                to="/signin"
                className="font-medium text-gray-700 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300"
              >
                Sign In
              </Link>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
