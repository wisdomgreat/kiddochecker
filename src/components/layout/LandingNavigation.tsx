import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useDashboardNavigation } from "@/hooks/useDashboardNavigation";
import { Menu, X, Shield, ArrowRight, Globe } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const LandingNavigation = () => {
  const { user, userRole } = useAuth();
  const { navigateToDashboard } = useDashboardNavigation();
  const { language, setLanguage } = useLanguage();
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
      "fixed top-0 left-0 right-0 z-50 transition-colors duration-200 px-6 py-4",
      isScrolled ? "bg-background/95 backdrop-blur-md border-b border-border shadow-xs" : "bg-transparent"
    )}>
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-primary flex items-center justify-center text-primary-foreground shadow-xs">
              <Shield className="h-5 w-5" />
            </div>
            <span className="font-semibold text-xl tracking-tight text-foreground">KiddoChecker</span>
          </Link>
        </div>
        
        {/* Desktop navigation */}
        <div className="hidden md:flex items-center space-x-6">
          <Link to="/#features" className="text-muted-foreground hover:text-foreground font-medium text-sm transition-colors">
            {isEs ? "Características" : "Features"}
          </Link>
          <Link to="/#security" className="text-muted-foreground hover:text-foreground font-medium text-sm transition-colors">
            {isEs ? "Seguridad" : "Security"}
          </Link>
          <Link to="/kiosk" className="text-muted-foreground hover:text-foreground font-medium text-sm transition-colors">
            {isEs ? "Quiosco" : "Kiosk"}
          </Link>
          
          <div className="h-4 w-px bg-border" />

          {/* Language Switcher */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-2 font-medium text-xs rounded-lg hover:bg-muted transition-colors">
                <Globe className="h-3.5 w-3.5 text-primary" />
                <span>{isEs ? "Español" : "English"}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="rounded-xl border border-border">
              <DropdownMenuItem onClick={() => setLanguage('en')} className="font-medium text-xs cursor-pointer">
                English
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setLanguage('es')} className="font-medium text-xs cursor-pointer">
                Español
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {user ? (
            <Button onClick={navigateToDashboard} className="rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 font-medium text-sm shadow-xs transition-colors">
              {getDashboardName()}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <div className="flex items-center space-x-3">
              <Link to="/login" className="text-foreground font-medium text-sm hover:text-primary transition-colors px-2 py-1">
                {isEs ? "Iniciar Sesión" : "Log In"}
              </Link>
              <Link to="/parent-registration">
                <Button className="rounded-xl bg-foreground text-background hover:bg-foreground/90 font-medium text-sm px-4 shadow-xs transition-colors">
                  {isEs ? "Registrar Familia" : "Get Started"}
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
            className="rounded-lg"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </Button>
        </div>
      </div>
      
      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-card border-b border-border shadow-lg z-50 py-6 px-6 flex flex-col space-y-4">
          <Link to="/#features" onClick={() => setMobileMenuOpen(false)} className="text-foreground font-medium text-base">
            {isEs ? "Características" : "Features"}
          </Link>
          <Link to="/#security" onClick={() => setMobileMenuOpen(false)} className="text-foreground font-medium text-base">
            {isEs ? "Seguridad" : "Security"}
          </Link>
          <Link to="/kiosk" onClick={() => setMobileMenuOpen(false)} className="text-foreground font-medium text-base">
            {isEs ? "Modo Quiosco" : "Kiosk Mode"}
          </Link>
          
          <div className="pt-4 border-t border-border">
            {user ? (
              <Button onClick={() => { navigateToDashboard(); setMobileMenuOpen(false); }} className="w-full h-11 rounded-xl bg-primary text-primary-foreground font-medium text-base shadow-xs transition-colors">
                {isEs ? "Ir al Tablero" : "Go to Dashboard"}
              </Button>
            ) : (
              <div className="flex flex-col space-y-3">
                <Link to="/login" className="w-full">
                  <Button variant="outline" className="w-full h-11 rounded-xl border-border font-medium text-base hover:bg-muted transition-colors">
                    {isEs ? "Iniciar Sesión" : "Log In"}
                  </Button>
                </Link>
                <Link to="/parent-registration" className="w-full">
                  <Button className="w-full h-11 rounded-xl bg-primary text-primary-foreground font-medium text-base shadow-xs transition-colors">
                    {isEs ? "Registrar Familia" : "Register Family"}
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
