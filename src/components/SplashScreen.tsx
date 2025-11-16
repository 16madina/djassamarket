import { useEffect, useState } from "react";
import logo from "/logo.svg";
import DjassaLogo from "./DjassaLogo";

interface SplashScreenProps {
  onFinish: () => void;
}

const SplashScreen = ({ onFinish }: SplashScreenProps) => {
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setFadeOut(true);
      setTimeout(() => {
        onFinish();
      }, 500);
    }, 2500);

    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-background transition-opacity duration-500 ${
        fadeOut ? "opacity-0" : "opacity-100"
      }`}
    >
      <div className="flex flex-col items-center gap-6 animate-fade-in">
        <img
          src={logo}
          alt="DJASSA Logo"
          className="w-32 h-32 animate-scale-in"
          style={{ animationDelay: "0.2s" }}
        />
        
        <div className="flex flex-col items-center gap-2 animate-fade-in" style={{ animationDelay: "0.4s" }}>
          <DjassaLogo className="w-64 md:w-80 h-16 md:h-20 text-foreground" />
          <span className="text-3xl md:text-4xl font-pacifico text-primary">
            Market
          </span>
        </div>
      </div>
    </div>
  );
};

export default SplashScreen;
