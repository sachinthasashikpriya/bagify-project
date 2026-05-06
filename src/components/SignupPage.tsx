import { 
  CheckCircle, 
  Eye, 
  EyeOff, 
  Loader, 
  ShoppingBag, 
  UserPlus, 
  Mail, 
  User as UserIcon, 
  Phone, 
  MapPin, 
  Lock,
  AlertCircle
} from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { authService } from "../services/authservice";

// ─── Types ───────────────────────────────────────────────────────────────────

interface SignupFormData {
  name: string;
  email: string;
  phone: string;
  address: string;
  password: string;
  confirmPassword: string;
  userType: "BUYER" | "SELLER";
}

interface FormErrors {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  password?: string;
  confirmPassword?: string;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function SignupPage() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [formData, setFormData] = useState<SignupFormData>({
    name: "",
    email: "",
    phone: "",
    address: "",
    password: "",
    confirmPassword: "",
    userType: "BUYER",
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Partial<Record<keyof SignupFormData, boolean>>>({});

  // ─── Validation ──────────────────────────────────────────────────────────

  const validate = (data: SignupFormData): FormErrors => {
    const e: FormErrors = {};

    // Name validation
    if (!data.name.trim()) {
      e.name = "Full name is required";
    } else if (data.name.trim().length < 2) {
      e.name = "Name must be at least 2 characters";
    }

    // Email validation
    if (!data.email.trim()) {
      e.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim())) {
      e.email = "Please enter a valid email address";
    }

    // Phone validation
    if (!data.phone.trim()) {
      e.phone = "Phone number is required";
    } else if (data.phone.trim().length < 10) {
      e.phone = "Enter a valid phone number (min 10 digits)";
    }

    // Address validation
    if (!data.address.trim()) {
      e.address = "Address is required";
    } else if (data.address.trim().length < 10) {
      e.address = "Please provide a more detailed address";
    }

    // Password validation
    if (!data.password) {
      e.password = "Password is required";
    } else if (data.password.length < 8) {
      e.password = "Password must be at least 8 characters";
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])/.test(data.password)) {
      e.password = "Must include uppercase, lowercase, and a number";
    }

    // Confirm Password validation
    if (!data.confirmPassword) {
      e.confirmPassword = "Please confirm your password";
    } else if (data.password !== data.confirmPassword) {
      e.confirmPassword = "Passwords do not match";
    }

    return e;
  };

  // Run validation whenever form data changes
  useEffect(() => {
    const validationErrors = validate(formData);
    setErrors(validationErrors);
  }, [formData]);

  const getPasswordStrength = (password: string): { label: string; color: string; width: string; score: number } => {
    if (!password) return { label: "", color: "", width: "0%", score: 0 };
    
    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    if (score <= 2) return { label: "Weak", color: "bg-red-500", width: "33%", score };
    if (score <= 4) return { label: "Medium", color: "bg-yellow-500", width: "66%", score };
    return { label: "Strong", color: "bg-green-500", width: "100%", score };
  };

  // ─── Handlers ────────────────────────────────────────────────────────────

  const handleChange = (name: keyof SignupFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleBlur = (name: keyof SignupFormData) => {
    setTouched((prev) => ({ ...prev, [name]: true }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Mark all fields as touched to show all errors
    const allTouched = Object.keys(formData).reduce((acc, key) => ({ ...acc, [key]: true }), {});
    setTouched(allTouched);

    const validationErrors = validate(formData);
    if (Object.keys(validationErrors).length > 0) {
      toast.error("Please fix the validation errors");
      return;
    }

    setIsLoading(true);

    try {
      const registerResponse = await authService.register({
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim(),
        address: formData.address.trim(),
        password: formData.password,
        confirmPassword: formData.confirmPassword,
        userrole: formData.userType, // Send uppercase BUYER or SELLER
      });

      if (!registerResponse.ok || !registerResponse.data) {
        toast.error(registerResponse.error || "Registration failed. Please try again.");
        return;
      }

      toast.success("Account created successfully! Please login.");
      navigate("/login");
    } catch (error) {
      console.error("Registration error:", error);
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const strength = getPasswordStrength(formData.password);
  const isFormValid = Object.keys(errors).length === 0;

  // ─── Render Helper ───────────────────────────────────────────────────────

  const renderField = (
    id: keyof SignupFormData,
    label: string,
    type: string,
    icon: React.ReactNode,
    placeholder: string,
    isTextArea: boolean = false
  ) => (
    <div className="relative group">
      <label htmlFor={id} className="block text-sm font-semibold text-gray-700 mb-1.5 ml-1">
        {label} <span className="text-red-500">*</span>
      </label>
      <div className="relative">
        <div className={`absolute left-3 ${isTextArea ? 'top-3' : 'top-1/2 -translate-y-1/2'} text-gray-400 group-focus-within:text-purple-600 transition-colors`}>
          {icon}
        </div>
        {isTextArea ? (
          <textarea
            id={id}
            value={formData[id]}
            onChange={(e) => handleChange(id, e.target.value)}
            onBlur={() => handleBlur(id)}
            rows={3}
            className={`w-full pl-10 pr-4 py-2.5 bg-gray-50 border rounded-xl focus:ring-2 focus:ring-purple-600/20 focus:border-purple-600 transition-all resize-none ${
              errors[id] && touched[id] ? "border-red-500 bg-red-50" : "border-gray-200"
            }`}
            placeholder={placeholder}
            disabled={isLoading}
          />
        ) : (
          <input
            type={id === 'password' ? (showPassword ? 'text' : 'password') : (id === 'confirmPassword' ? (showConfirm ? 'text' : 'password') : type)}
            id={id}
            value={formData[id]}
            onChange={(e) => handleChange(id, e.target.value)}
            onBlur={() => handleBlur(id)}
            className={`w-full pl-10 pr-10 py-2.5 bg-gray-50 border rounded-xl focus:ring-2 focus:ring-purple-600/20 focus:border-purple-600 transition-all ${
              errors[id] && touched[id] ? "border-red-500 bg-red-50" : "border-gray-200"
            }`}
            placeholder={placeholder}
            disabled={isLoading}
          />
        )}
        
        {(id === 'password' || id === 'confirmPassword') && (
          <button
            type="button"
            onClick={() => id === 'password' ? setShowPassword(!showPassword) : setShowConfirm(!showConfirm)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-purple-600 transition-colors"
            tabIndex={-1}
          >
            {id === 'password' ? (showPassword ? <EyeOff size={18} /> : <Eye size={18} />) : (showConfirm ? <EyeOff size={18} /> : <Eye size={18} />)}
          </button>
        )}

        {errors[id] && touched[id] && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
            {id !== 'password' && id !== 'confirmPassword' && <AlertCircle size={18} className="text-red-500" />}
          </div>
        )}
      </div>
      {errors[id] && touched[id] && (
        <p className="mt-1.5 text-xs font-medium text-red-500 flex items-center gap-1 animate-in fade-in slide-in-from-top-1">
          <AlertCircle size={12} /> {errors[id]}
        </p>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8F9FF] flex items-center justify-center px-4 py-12 selection:bg-purple-100">
      <div className="max-w-2xl w-full">
        {/* Logo & Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-3xl shadow-xl shadow-purple-200/50 mb-6 group cursor-default transition-transform hover:scale-105 duration-300">
            <ShoppingBag className="w-10 h-10 text-purple-600 group-hover:rotate-12 transition-transform" />
          </div>
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight mb-2">
            Create Your Account
          </h1>
          <p className="text-gray-500 font-medium">Join BagMarket and start your premium journey today</p>
        </div>

        <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-purple-200/40 p-10 md:p-14 overflow-hidden relative border border-purple-50">
          {/* Decorative Elements */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-50 rounded-full -mr-16 -mt-16 blur-3xl opacity-50"></div>
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-50 rounded-full -ml-16 -mb-16 blur-3xl opacity-50"></div>

          <form onSubmit={handleSubmit} className="space-y-8 relative">
            
            {/* Role Selection */}
            <div className="bg-gray-50/80 p-1.5 rounded-2xl border border-gray-100">
              <div className="grid grid-cols-2 gap-2">
                {(["BUYER", "SELLER"] as const).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => handleChange("userType", type)}
                    disabled={isLoading}
                    className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold transition-all duration-300 ${
                      formData.userType === type
                        ? "bg-white text-purple-600 shadow-md shadow-purple-100 border border-purple-100"
                        : "text-gray-500 hover:text-gray-700 hover:bg-white/50"
                    }`}
                  >
                    {type === "BUYER" ? "🛍️ I want to Buy" : "🏪 I want to Sell"}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {renderField("name", "Full Name", "text", <UserIcon size={18} />, "John Doe")}
              {renderField("email", "Email Address", "email", <Mail size={18} />, "john@example.com")}
              {renderField("phone", "Phone Number", "tel", <Phone size={18} />, "+1 234 567 890")}
              {renderField("password", "Create Password", "password", <Lock size={18} />, "••••••••")}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="space-y-4">
                  {renderField("confirmPassword", "Confirm Password", "password", <CheckCircle size={18} />, "••••••••")}
                  
                  {/* Password strength bar */}
                  {formData.password && (
                    <div className="px-1 animate-in fade-in zoom-in-95 duration-500">
                      <div className="flex justify-between items-center mb-1.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Security Strength</span>
                        <span className={`text-[10px] font-bold uppercase tracking-wider ${strength.color.replace('bg-', 'text-')}`}>
                          {strength.label}
                        </span>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden flex gap-1">
                        <div
                          className={`h-full rounded-full transition-all duration-700 ease-out ${strength.color}`}
                          style={{ width: strength.width }}
                        />
                      </div>
                    </div>
                  )}
               </div>
               {renderField("address", "Physical Address", "text", <MapPin size={18} />, "123 Main St, City, State", true)}
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={isLoading || !isFormValid}
                className={`w-full relative group overflow-hidden flex items-center justify-center gap-3 px-8 py-4 bg-purple-600 text-white rounded-2xl font-bold text-lg transition-all duration-300 hover:bg-purple-700 hover:shadow-xl hover:shadow-purple-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100`}
              >
                {isLoading ? (
                  <Loader className="w-6 h-6 animate-spin" />
                ) : (
                  <>
                    <UserPlus className="w-6 h-6 group-hover:scale-110 transition-transform" />
                    <span>Create Account</span>
                  </>
                )}
                
                {/* Shine effect */}
                {!isLoading && (
                  <div className="absolute top-0 -inset-full h-full w-1/2 z-5 block transform -skew-x-12 bg-gradient-to-r from-transparent to-white opacity-20 group-hover:animate-shine" />
                )}
              </button>
            </div>
          </form>

          <div className="mt-10 text-center">
            <p className="text-gray-500 font-medium">
              Already have an account?{" "}
              <button
                onClick={() => navigate("/login")}
                className="text-purple-600 hover:text-purple-700 font-bold transition-colors underline-offset-4 hover:underline"
              >
                Login here
              </button>
            </p>
          </div>
        </div>
        
        {/* Footer info */}
        <p className="mt-8 text-center text-xs text-gray-400 font-medium tracking-wide uppercase">
          &copy; 2026 Bagify Marketplace • Secure Registration
        </p>
      </div>
    </div>
  );
}
