import React, { useState } from "react";
import { useNavigate } from 'react-router-dom';
import {
    Check as FiCheck,
    Mail as FiMail,
    Lock as FiLock,
    Eye as FiEye,
    EyeOff as FiEyeOff,
    User as FiUser,
    Linkedin,
    Mail,
    Globe, BarChart3,
    ArrowLeft

} from 'lucide-react';

const Login = () => {
    const navigate = useNavigate();
    
    const [isLoaded, setIsLoaded] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [formData, setFormData] = useState({
        username: "",
        password: ""
    });
    const [errors, setErrors] = useState({
        username: "",
        password: ""
    });
    const [rememberMe, setRememberMe] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        if (errors[name as keyof typeof errors]) {
            setErrors(prev => ({
                ...prev,
                [name]: ""
            }));
        }
    };

    const validateForm = (fingerprint = false) => {
        const newErrors = {
            username: !formData.username ? "Username is required" : "",
            password: fingerprint ? "" : (!formData.password ? "Password is required" : "")
        };
        setErrors(newErrors);
        return !newErrors.username && !newErrors.password;
    };

    const handleRegularLogin = (e: React.FormEvent) => {
        e.preventDefault();
        if (validateForm()) {
            // Proceed with regular login
            console.log("Regular login", formData, rememberMe);
            navigate('/dashboard');
        }
    };

    const handleFingerprintLogin = (e: React.FormEvent) => {
        e.preventDefault();
        const newErrors = {
            username: !formData.username ? "Username is required" : ""};
        if (validateForm(true)) {  // Pass true for fingerprint validation
            console.log("Fingerprint login", rememberMe);
            navigate('/dashboard');
        }
    };
    return (
          <>
    <nav className="h-20 flex items-center px-6 lg:px-10">
  <div className="flex justify-between items-center w-full max-w-7xl mx-auto">
    <div className="flex items-center space-x-3">
      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
        <BarChart3 className="w-6 h-6 text-white" />
      </div>
      <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
        ASHTECH ERP
      </span>
    </div>

    <button
      onClick={() => navigate('/')}
      className="px-8 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-full hover:from-blue-600 hover:to-blue-700 transition-all duration-300 hover:scale-105 hover:shadow-2xl font-medium flex items-center space-x-2 group shadow-lg"
    >
      <span>Home</span>
      <ArrowLeft className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
    </button>
  </div>
</nav>

        
        <div className="min-h-screen flex bg-white">
             
            {/* Left Side - Brand Section */}
            <div className="hidden md:flex md:w-1/2  p-12 flex-col justify-center">
                <div className="max-w-md mx-auto">
                    <div className="mb-12 text-center">
                        
                        <p className="text-xl text-dark-100">Manage Your Company With:</p>
                        <h1 className="text-4xl font-bold text-dark mb-4">ASH TECH's ERP</h1>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-start">
                            <div className="bg-gradient-to-br from-purple-200 to-blue-800 p-2 rounded-full mr-4">
                                <FiCheck className="w-6 h-6 text-dark" />
                            </div>
                            <div>
                                <h3 className="text-xl font-semibold text-dark">All In One Tool</h3>
                                <p className="text-dark-100">Run And Scale Your ERP</p>
                            </div>
                        </div>

                        <div className="flex items-start">
                            <div className="bg-gradient-to-br from-purple-200 to-blue-800  p-2 rounded-full mr-4">
                                <FiCheck className="w-6 h-6 text-dark" />
                            </div>
                            <div>
                                <h3 className="text-xl font-semibold text-dark">Easily Add And Manage Your Services</h3>
                                <p className="text-dark-100">It Brings Together Your Invoices, Clients And Sales</p>
                            </div>
                        </div>
                        <div className="flex flex-col items-center">
                            <h3 className="text-xl font-semibold text-dark mb-3">Contact Us</h3>

                            {/* Icons */}
                            <div className="flex justify-center space-x-4 text-gray-300 ">
                                <a
                                    href="mailto:shehzadaashan@gmail.com"
                                    aria-label="Email"
                                    className="hover:text-blue-400 transition-colors bg-gradient-to-br from-purple-700 to-blue-800  p-2 rounded-full"
                                >
                                    <Mail size={22} />
                                </a>
                                <a
                                    href="https://ash-techs.github.io/portfolio"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    aria-label="Website"
                                    className="hover:text-blue-400 transition-colors bg-gradient-to-br from-purple-700 to-blue-800  p-2 rounded-full"
                                >
                                    <Globe size={22} />
                                </a>
                                <a
                                    href="https://www.linkedin.com/company/ash-tech-virtual-software-house/"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    aria-label="LinkedIn"
                                    className="hover:text-blue-400 transition-colors bg-gradient-to-br from-purple-700 to-blue-800  p-2 rounded-full"
                                >
                                    <Linkedin size={22} />
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Side - Login Form */}
            <div className="w-full md:w-1/2 bg-white flex items-center justify-center p-8">
                <div className="max-w-md w-full">
                    <h2 className="text-3xl font-bold text-gray-800 mb-2 text-center">Sign In</h2>
                    <p className="text-gray-600 mb-8 text-center">Access your Ash-Tech's account</p>

                    <form className="space-y-6">
                        <div>
                            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                                <FiMail className="mr-2" />
                                Username
                            </label>
                            <input
                                type="text"
                                id="username"
                                name="username"
                                value={formData.username}
                                onChange={handleChange}
                                className={`w-full px-4 py-3 border ${errors.username ? "border-red-500" : "border-gray-300"} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pl-10`}
                                placeholder="Enter your username"
                            />
                            {errors.username && <p className="mt-1 text-sm text-red-500">{errors.username}</p>}
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                                <FiLock className="mr-2" />
                                Password
                            </label>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    id="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    className={`w-full px-4 py-3 border ${errors.password ? "border-red-500" : "border-gray-300"} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pl-10`}
                                    placeholder="Enter your password"
                                />
                                <button
                                    type="button"
                                    className="absolute right-3 top-3.5 text-gray-500 hover:text-gray-700"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? <FiEyeOff /> : <FiEye />}
                                </button>
                            </div>
                            {errors.password && <p className="mt-1 text-sm text-red-500">{errors.password}</p>}
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                <input
                                    id="remember-me"
                                    name="remember-me"
                                    type="checkbox"
                                    checked={rememberMe}
                                    onChange={(e) => setRememberMe(e.target.checked)}
                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                />
                                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                                    Remember me
                                </label>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <button
                                type="submit"
                                onClick={handleRegularLogin}
                                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                            >
                                Log In
                            </button>

                            <button
                                type="button"
                                onClick={handleFingerprintLogin}
                                className="w-full flex items-center justify-center gap-2 bg-gray-100 text-gray-800 py-3 px-4 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
                            >
                                <FiUser className="w-5 h-5" />
                                Login with Fingerprint
                            </button>
                        </div>
                    </form>
                </div>
            </div>
            
        </div></>
    );
};

export default Login;