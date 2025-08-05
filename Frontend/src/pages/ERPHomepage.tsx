import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ArrowRight,
    BarChart3,
    Users,
    Package,
    TrendingUp,
    Shield,
    Zap,
    Globe,
    CheckCircle,
    Star,
    Play
} from 'lucide-react';

interface FeatureCardProps {
    icon: React.ReactNode;
    title: string;
    description: string;
    delay: number;
}

interface StatCardProps {
    value: string;
    label: string;
    delay: number;
}

// Light theme Glass Card component
const LightGlassCard: React.FC<{ children: React.ReactNode; className?: string; gradient?: boolean }> = ({ children, className = "", gradient = false }) => (
    <div className={`backdrop-blur-xl bg-white/80 border border-gray-200/50 rounded-2xl shadow-lg ${gradient ? 'bg-gradient-to-br from-white/90 to-gray-50/80' : ''} ${className}`}>
        {children}
    </div>
);

const FeatureCard: React.FC<FeatureCardProps> = ({ icon, title, description, delay }) => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setIsVisible(true), delay);
        return () => clearTimeout(timer);
    }, [delay]);

    return (
        <LightGlassCard className={`group p-8 hover:shadow-xl hover:bg-white/90 transition-all duration-500 hover:scale-105 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`} gradient>
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="relative z-10">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                    {icon}
                </div>
                <h3 className="font-bold text-gray-800 mb-3">{title}</h3>
                <p className="text-gray-600 leading-relaxed">{description}</p>
            </div>
        </LightGlassCard>
    );
};

const StatCard: React.FC<StatCardProps> = ({ value, label, delay }) => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setIsVisible(true), delay);
        return () => clearTimeout(timer);
    }, [delay]);

    return (
        <div className={`text-center transform transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <div className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                {value}
            </div>
            <div className="text-gray-600 text-sm uppercase tracking-wider font-medium">{label}</div>
        </div>
    );
};

const ERPHomepage: React.FC = () => {
    const [isLoaded, setIsLoaded] = useState(false);
    const [currentTestimonial, setCurrentTestimonial] = useState(0);
    const navigate = useNavigate();

    useEffect(() => {
        setIsLoaded(true);

        const testimonialTimer = setInterval(() => {
            setCurrentTestimonial((prev) => (prev + 1) % 3);
        }, 5000);

        return () => clearInterval(testimonialTimer);
    }, []);

    const testimonials = [
        {
            text: "ProERP transformed our business operations completely. The integration was seamless and the results were immediate.",
            author: "Sarah Johnson",
            role: "CEO, TechCorp",
            rating: 5
        },
        {
            text: "The best ERP solution we've ever used. Intuitive, powerful, and backed by excellent support.",
            author: "Michael Chen",
            role: "Operations Director, InnovateLtd",
            rating: 5
        },
        {
            text: "Streamlined our entire workflow and improved efficiency by 300%. Couldn't be happier with the choice.",
            author: "Emma Rodriguez",
            role: "VP Operations, GlobalTech",
            rating: 5
        }
    ];

    const handleLogin = (): void => {
        navigate('/login');
    };
    const handleGetStarted = (): void => {
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 relative overflow-hidden">
            {/* Animated Background Elements */}
            <div className="absolute inset-0">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-200/20 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-200/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
                <div className="absolute top-3/4 left-1/2 w-64 h-64 bg-cyan-200/20 rounded-full blur-3xl animate-pulse delay-2000"></div>
            </div>

            {/* Navigation */}
            <nav className={`relative z-50 p-6 lg:p-8 transform transition-all duration-1000 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
                <div className="flex justify-between items-center max-w-7xl mx-auto">
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                            <BarChart3 className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                            ASHTECH ERP
                        </span>
                    </div>

                    <button
                        onClick={handleLogin}
                        className="px-8 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-full hover:from-blue-600 hover:to-blue-700 transition-all duration-300 hover:scale-105 hover:shadow-2xl font-medium flex items-center space-x-2 group shadow-lg"
                    >
                        <span>Login</span>
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
                    </button>
                </div>
            </nav>

            {/* Main Content */}
            <div className="relative z-10 px-6 lg:px-8 pb-20">
                <div className="max-w-7xl mx-auto">

                    {/* Hero Section */}
                    <div className="text-center mb-20 lg:mb-32">
                        <h1 className={`text-3xl lg:text-3xl xl:text-6xl font-bold text-gray-800 mb-8 leading-tight transform transition-all duration-1000 delay-300 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                            Enterprise
                            <span className="block bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                                Revolutionized
                            </span>
                        </h1>

                        <p className={`text-xl lg:text-2xl text-gray-600 mb-12 max-w-4xl mx-auto leading-relaxed transform transition-all duration-1000 delay-500 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                            Transform your business with our cutting-edge ERP solution. Streamline operations,
                            boost productivity, and drive growth with intelligent automation and real-time insights.
                        </p>

                        <div className={`flex flex-col sm:flex-row gap-6 justify-center items-center mb-16 transform transition-all duration-1000 delay-700 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                            <button onClick={handleGetStarted} className="px-10 py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-full hover:from-blue-600 hover:to-blue-700 transition-all duration-300 hover:scale-105 hover:shadow-2xl font-semibold text-lg flex items-center space-x-3 group shadow-lg">
                                <span>Get Started</span>
                                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
                            </button>

                          </div>

                        {/* Stats */}
                        <LightGlassCard className="p-8 max-w-5xl mx-auto" gradient>
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
                                <StatCard value="500K+" label="Active Users" delay={900} />
                                <StatCard value="99.9%" label="Uptime" delay={1100} />
                                <StatCard value="150+" label="Countries" delay={1300} />
                                <StatCard value="24/7" label="Support" delay={1500} />
                            </div>
                        </LightGlassCard>
                    </div>

                    {/* Features Grid */}
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20 lg:mb-32">
                        <FeatureCard
                            icon={<BarChart3 className="w-8 h-8 text-white" />}
                            title="Advanced Analytics"
                            description="Get deep insights into your business with real-time analytics, custom dashboards, and predictive modeling."
                            delay={800}
                        />

                        <FeatureCard
                            icon={<Users className="w-8 h-8 text-white" />}
                            title="Team Management"
                            description="Streamline your workforce with intelligent scheduling, performance tracking, and collaboration tools."
                            delay={1000}
                        />

                        <FeatureCard
                            icon={<Package className="w-8 h-8 text-white" />}
                            title="Inventory Control"
                            description="Optimize your supply chain with automated inventory management, demand forecasting, and vendor integration."
                            delay={1200}
                        />

                        <FeatureCard
                            icon={<TrendingUp className="w-8 h-8 text-white" />}
                            title="Growth Optimization"
                            description="Scale your business efficiently with data-driven insights and automated growth strategies."
                            delay={1400}
                        />

                        <FeatureCard
                            icon={<Shield className="w-8 h-8 text-white" />}
                            title="Enterprise Security"
                            description="Protect your data with bank-level encryption, role-based access, and compliance management."
                            delay={1600}
                        />

                        <FeatureCard
                            icon={<Zap className="w-8 h-8 text-white" />}
                            title="Lightning Fast"
                            description="Experience unmatched performance with our optimized infrastructure and intelligent caching."
                            delay={1800}
                        />
                    </div>

                    {/* Testimonials */}
                    <div className="text-center mb-20 lg:mb-32">
                        <h2 className="text-4xl lg:text-5xl font-bold text-gray-800 mb-4">
                            Trusted by Industry Leaders
                        </h2>
                        <p className="text-gray-600 text-xl mb-16 max-w-3xl mx-auto">
                            Join thousands of companies that have transformed their operations with ProERP
                        </p>

                        <div className="relative max-w-4xl mx-auto">
                            <LightGlassCard className="p-8 lg:p-12" gradient>
                                <div className="flex justify-center mb-6">
                                    {[...Array(testimonials[currentTestimonial].rating)].map((_, i) => (
                                        <Star key={i} className="w-6 h-6 text-yellow-500 fill-current" />
                                    ))}
                                </div>

                                <blockquote className="text-2xl lg:text-3xl text-gray-800 font-medium mb-8 leading-relaxed">
                                    "{testimonials[currentTestimonial].text}"
                                </blockquote>

                                <div className="flex flex-col items-center">
                                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-4 shadow-lg">
                                        <span className="text-white font-bold text-lg">
                                            {testimonials[currentTestimonial].author.split(' ').map(n => n[0]).join('')}
                                        </span>
                                    </div>
                                    <h4 className="text-gray-800 font-semibold text-lg">{testimonials[currentTestimonial].author}</h4>
                                    <p className="text-gray-600">{testimonials[currentTestimonial].role}</p>
                                </div>
                            </LightGlassCard>

                            <div className="flex justify-center mt-8 space-x-3">
                                {testimonials.map((_, index) => (
                                    <button
                                        key={index}
                                        onClick={() => setCurrentTestimonial(index)}
                                        className={`w-3 h-3 rounded-full transition-all duration-300 ${index === currentTestimonial
                                            ? 'bg-gradient-to-r from-blue-500 to-purple-600 scale-125'
                                            : 'bg-gray-300 hover:bg-gray-400'
                                            }`}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* CTA Section */}
                    <LightGlassCard className="text-center p-12 lg:p-20" gradient>
                        <div className="relative">
                            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-3xl"></div>
                            <div className="relative z-10">
                                <h2 className="text-4xl lg:text-5xl font-bold text-gray-800 mb-6">
                                    Ready to Transform Your Business?
                                </h2>
                                <p className="text-xl text-gray-600 mb-10 max-w-3xl mx-auto">
                                    Join the ERP revolution today. Start your free trial and experience the power of intelligent automation.
                                </p>

                                <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
                                    <button onClick={handleGetStarted} className="px-12 py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-full hover:from-blue-600 hover:to-purple-700 transition-all duration-300 hover:scale-105 hover:shadow-2xl font-semibold text-lg flex items-center space-x-3 group shadow-lg">
                                        <span>Try it out</span>
                                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
                                    </button>

                                   
                                </div>

                                
                            </div>
                        </div>
                    </LightGlassCard>
                </div>
            </div>
        </div>
    );
};

export default ERPHomepage;