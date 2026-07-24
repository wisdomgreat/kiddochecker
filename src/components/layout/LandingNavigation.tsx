
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useDashboardNavigation } from "@/hooks/useDashboardNavigation";
import { Menu, X, Shield, ArrowRight } from "lucide-react";

import { useLanguage } from "@/context/LanguageContext";

const LandingNavigation = () => {
  const { user, userRole } = useAuth();
  const { navigateToDashboard } = useDashboardNavigation();
  const { language } = useLanguage();
  const isEs = language === 'es';
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);
  
  const getDashboardName = () => {
    if (userRole === "admin" || userRole === "super_admin") return isEs ? "Tablero de Administración" : "Admin Dashboard";
    if (userRole === "teacher" || userRole === "teacher_assistant" || userRole === "staff") return isEs ? "Tablero de Personal" : "Staff Dashboard";
    return isEs ? "Portal de Padres" : "Parent Dashboard";
  };
  
  return (
    <nav className={cn(
      "fixed top-0 left-0 right-0 z-50 transition-all duration-300 px-6 py-4",
      isScrolled ? "bg-card/80 backdrop-blur-md shadow-sm" : "bg-transparent"
    )}>
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="h-10 w-10 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-200 group-hover:scale-110 transition-transform">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <span className="font-bold text-2xl tracking-tighter text-foreground">KiddoChecker</span>
          </Link>
        </div>
        
        {/* Desktop navigation */}
        <div className="hidden md:flex items-center space-x-8">
          <Link to="/#features" className="text-slate-600 hover:text-indigo-600 font-bold text-sm transition-colors">
            {isEs ? "Características" : "Features"}
          </Link>
          <Link to="/#security" className="text-slate-600 hover:text-indigo-600 font-bold text-sm transition-colors">
            {isEs ? "Seguridad" : "Security"}
          </Link>
          <Link to="/#pricing" className="text-slate-600 hover:text-indigo-600 font-bold text-sm transition-colors">
            {isEs ? "Precios" : "Pricing"}
          </Link>
          <div className="h-4 w-px bg-slate-200 ml-4" />
          {user ? (
            <Button onClick={navigateToDashboard} className="rounded-2xl bg-indigo-600 hover:bg-indigo-700 font-bold shadow-lg shadow-indigo-100">
              {getDashboardName()}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <div className="flex items-center space-x-4">
              <Link to="/login" className="text-foreground font-bold text-sm hover:text-indigo-600 transition-colors">
                {isEs ? "Iniciar Sesión" : "Log In"}
              </Link>
              <Link to="/parent-registration">
                <Button className="rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold px-6 shadow-xl shadow-slate-200">
                  {isEs ? "Comenzar" : "Get Started"}
                </Button>
              </Link>
            </div>
          )}
        </div>
        
        {/* Mobile menu button */}
        <div className="md:hidden">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="rounded-xl"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </Button>
        </div>
      </div>
      
      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-card border-t border-slate-100 shadow-2xl z-50 py-8 px-8 flex flex-col space-y-6 animate-in slide-in-from-top duration-300">
          <Link to="/#features" onClick={() => setMobileMenuOpen(false)} className="text-foreground font-bold text-lg">
            {isEs ? "Características" : "Features"}
          </Link>
          <Link to="/#security" onClick={() => setMobileMenuOpen(false)} className="text-foreground font-bold text-lg">
            {isEs ? "Seguridad" : "Security"}
          </Link>
          <Link to="/#pricing" onClick={() => setMobileMenuOpen(false)} className="text-foreground font-bold text-lg">
            {isEs ? "Precios" : "Pricing"}
          </Link>
          
          <div className="pt-6 border-t border-slate-100">
            {user ? (
              <Button onClick={() => { navigateToDashboard(); setMobileMenuOpen(false); }} className="w-full h-14 rounded-2xl bg-indigo-600 font-bold text-lg shadow-xl shadow-indigo-100">
                {isEs ? "Ir al Tablero" : "Go to Dashboard"}
              </Button>
            ) : (
              <div className="flex flex-col space-y-4">
                <Link to="/login" className="w-full">
                  <Button variant="outline" className="w-full h-14 rounded-2xl border-slate-200 font-bold text-lg">
                    {isEs ? "Iniciar Sesión" : "Log In"}
                  </Button>
                </Link>
                <Link to="/parent-registration" className="w-full">
                  <Button className="w-full h-14 rounded-2xl bg-indigo-600 font-bold text-lg shadow-xl shadow-indigo-100">
                    {isEs ? "Crear Cuenta Gratis" : "Create Free Account"}
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default LandingNavigation;


