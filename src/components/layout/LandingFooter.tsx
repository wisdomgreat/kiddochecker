
import { Link } from "react-router-dom";
import { useLanguage } from "@/context/LanguageContext";

const LandingFooter = () => {
  const currentYear = new Date().getFullYear();
  const { language } = useLanguage();
  const isEs = language === 'es';

  return (
    <footer className="bg-gray-50 dark:bg-card border-t border-border py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center mb-4">
              <div className="h-8 w-8 rounded-full bg-indigo-600 flex items-center justify-center">
                <span className="text-white font-bold text-sm">K</span>
              </div>
              <span className="font-bold text-xl ml-2">KiddoChecker</span>
            </div>
            <p className="text-gray-600 dark:text-muted-foreground text-sm">
              {isEs 
                ? "Simplifique el registro de entrada y salida de niños para su organización con nuestro sistema seguro y fácil de usar."
                : "Streamline child check-in and check-out for your organization with our secure and easy-to-use system."}
            </p>
          </div>
          
          <div>
            <h3 className="text-sm font-semibold tracking-wider uppercase mb-4">
              {isEs ? "Enlaces" : "Links"}
            </h3>
            <ul className="space-y-2">
              <li>
                <Link to="/about-us" className="text-muted-foreground hover:text-indigo-600 text-sm">
                  {isEs ? "Sobre Nosotros" : "About Us"}
                </Link>
              </li>
              <li>
                <Link to="/#features" className="text-muted-foreground hover:text-indigo-600 text-sm">
                  {isEs ? "Características" : "Features"}
                </Link>
              </li>
              <li>
                <Link to="/#security" className="text-muted-foreground hover:text-indigo-600 text-sm">
                  {isEs ? "Seguridad" : "Security"}
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-sm font-semibold tracking-wider uppercase mb-4">
              {isEs ? "Legal" : "Legal"}
            </h3>
            <ul className="space-y-2">
              <li>
                <Link to="/privacy-policy" className="text-muted-foreground hover:text-indigo-600 text-sm">
                  {isEs ? "Política de Privacidad" : "Privacy Policy"}
                </Link>
              </li>
              <li>
                <Link to="/terms-of-service" className="text-muted-foreground hover:text-indigo-600 text-sm">
                  {isEs ? "Términos de Servicio" : "Terms of Service"}
                </Link>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="mt-8 border-t border-border pt-6 flex flex-col md:flex-row justify-between items-center">
          <p className="text-muted-foreground text-sm">
            &copy; {currentYear} KiddoChecker. {isEs ? "Todos los derechos reservados." : "All rights reserved."}
          </p>
        </div>
      </div>
    </footer>
  );
};

export default LandingFooter;

