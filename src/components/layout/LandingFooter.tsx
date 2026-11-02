import React from "react";
import { Link } from "react-router-dom";
import { Shield } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

const LandingFooter = () => {
  const currentYear = new Date().getFullYear();
  const { language } = useLanguage();
  const isEs = language === 'es';

  return (
    <footer className="bg-muted/40 border-t border-border py-12">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-primary flex items-center justify-center text-primary-foreground">
                <Shield className="h-4 w-4" />
              </div>
              <span className="font-semibold text-lg text-foreground">KiddoChecker</span>
            </div>
            <p className="text-muted-foreground text-sm max-w-sm leading-relaxed">
              {isEs 
                ? "Plataforma de seguridad y asistencia infantil con quiosco interactivo, verificación de tutores y compatibilidad con impresoras Brother QL."
                : "Childcare check-in and guardian verification platform with touch kiosk, mobile check-in, and Brother QL thermal badge support."}
            </p>
            <p className="text-xs text-muted-foreground pt-1">
              {isEs ? "Desarrollado para Green Valley Alliance Church y ministerios infantiles." : "Built for Green Valley Alliance Church and childcare ministries."}
            </p>
          </div>
          
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-foreground">
              {isEs ? "Plataforma" : "Platform"}
            </h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link to="/kiosk" className="hover:text-foreground transition-colors">
                  {isEs ? "Modo Quiosco" : "Kiosk Check-In"}
                </Link>
              </li>
              <li>
                <Link to="/parent-registration" className="hover:text-foreground transition-colors">
                  {isEs ? "Registro de Padres" : "Family Registration"}
                </Link>
              </li>
              <li>
                <Link to="/login" className="hover:text-foreground transition-colors">
                  {isEs ? "Portal del Personal" : "Staff & Parent Sign In"}
                </Link>
              </li>
              <li>
                <Link to="/about-us" className="hover:text-foreground transition-colors">
                  {isEs ? "Acerca del Sistema" : "About the System"}
                </Link>
              </li>
            </ul>
          </div>
          
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-foreground">
              {isEs ? "Legal y Privacidad" : "Privacy & Terms"}
            </h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link to="/privacy-policy" className="hover:text-foreground transition-colors">
                  {isEs ? "Política de Privacidad (COPPA)" : "Privacy Policy (COPPA)"}
                </Link>
              </li>
              <li>
                <Link to="/terms-of-service" className="hover:text-foreground transition-colors">
                  {isEs ? "Términos de Servicio" : "Terms of Service"}
                </Link>
              </li>
              <li>
                <a 
                  href="https://tdwas.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:text-foreground transition-colors"
                >
                  TDWAS Technology
                </a>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="mt-10 border-t border-border pt-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-muted-foreground">
          <p>
            &copy; {currentYear} KiddoChecker. {isEs ? "Todos los derechos reservados." : "All rights reserved."}
          </p>
          <p>
            {isEs ? "Alojado en Microsoft Azure" : "Hosted securely on Microsoft Azure"}
          </p>
        </div>
      </div>
    </footer>
  );
};

export default LandingFooter;
