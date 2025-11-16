import { useEffect, useState } from "react";
import djassaLogo from "@/assets/djassa-logo.png";

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
      <div className="flex flex-col items-center gap-6">
        <img
          src={djassaLogo}
          alt="DJASSA Market Logo"
          className="w-64 md:w-80 animate-bounce-in animate-glow-pulse"
        />
        
        {/* Decorative circles */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div 
            className="absolute top-1/4 left-1/4 w-32 h-32 rounded-full bg-primary/10 animate-float"
            style={{ animationDelay: "0s" }}
          />
          <div 
            className="absolute bottom-1/4 right-1/4 w-24 h-24 rounded-full bg-accent/10 animate-float"
            style={{ animationDelay: "0.5s" }}
          />
          <div 
            className="absolute top-1/3 right-1/3 w-16 h-16 rounded-full bg-secondary/10 animate-float"
            style={{ animationDelay: "1s" }}
          />
        </div>
      </div>
    </div>
  );
};

export default SplashScreen;
