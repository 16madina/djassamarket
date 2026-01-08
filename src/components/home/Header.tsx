import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LogIn, User, Moon, Sun, MapPin, Loader2 } from "lucide-react";
import { useDarkMode } from "@/hooks/useDarkMode";
import { SystemNotifications } from "@/components/notifications/SystemNotifications";
import ayokaLogo from "@/assets/ayoka-logo.png";
interface HeaderProps {
  isAuthenticated: boolean;
}
const Header = ({
  isAuthenticated
}: HeaderProps) => {
  const navigate = useNavigate();
  const {
    darkMode,
    toggleDarkMode
  } = useDarkMode();
  const [userLocation, setUserLocation] = useState<string | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [hasAttempted, setHasAttempted] = useState(false);

  const requestLocation = () => {
    if (hasAttempted && !locationError) return; // Prevent re-fetching if already attempted successfully
    
    setIsLoadingLocation(true);
    setLocationError(null);
    
    if (!('geolocation' in navigator)) {
      console.log('🔴 Geolocation API not available');
      setLocationError("Non supporté");
      setIsLoadingLocation(false);
      setHasAttempted(true);
      return;
    }
    
    console.log('📍 Requesting geolocation...');
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        console.log('📍 Got position:', position.coords.latitude, position.coords.longitude);
        try {
          const { latitude, longitude } = position.coords;
          
          // Use AbortController for timeout
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 8000);
          
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&addressdetails=1&zoom=16`,
            { 
              headers: { 'User-Agent': 'AyokaMarket/1.0' },
              signal: controller.signal
            }
          );
          
          clearTimeout(timeoutId);
          
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
          }
          
          const data = await response.json();
          console.log('📍 Geocode result:', data.address);
          
          const neighborhood = data.address?.neighbourhood || data.address?.suburb || 
            data.address?.quarter || data.address?.hamlet || data.address?.village || 
            data.address?.town || data.address?.city_district || data.address?.city || null;
          
          if (neighborhood) {
            setUserLocation(neighborhood);
            sessionStorage.setItem('user_neighborhood', neighborhood);
          } else {
            // Fallback to city or country
            const fallback = data.address?.city || data.address?.state || data.address?.country;
            if (fallback) {
              setUserLocation(fallback);
              sessionStorage.setItem('user_neighborhood', fallback);
            } else {
              setLocationError("Zone non identifiée");
            }
          }
        } catch (error: any) {
          console.log('🔴 Geocoding error:', error.name, error.message);
          if (error.name === 'AbortError') {
            setLocationError("Délai dépassé");
          } else {
            setLocationError("Erreur réseau");
          }
        } finally {
          setIsLoadingLocation(false);
          setHasAttempted(true);
        }
      },
      (error) => {
        console.log('🔴 Geolocation error:', error.code, error.message);
        if (error.code === error.PERMISSION_DENIED) {
          setLocationError("Activez la localisation");
        } else if (error.code === error.TIMEOUT) {
          setLocationError("Délai dépassé");
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          setLocationError("Position indisponible");
        } else {
          setLocationError("Erreur localisation");
        }
        setIsLoadingLocation(false);
        setHasAttempted(true);
      },
      { 
        enableHighAccuracy: false, 
        timeout: 10000, // 10 seconds for iOS
        maximumAge: 600000 
      }
    );
  };

  useEffect(() => {
    // Check cache first
    const cached = sessionStorage.getItem('user_neighborhood');
    if (cached) {
      setUserLocation(cached);
      setHasAttempted(true);
      return;
    }
    
    requestLocation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 pt-safe">
      <div className="container flex h-12 sm:h-16 items-center justify-between px-4">
        {/* Top row: Logo + Actions */}
        <div className="flex items-center justify-between w-full sm:w-auto">
          <div className="flex flex-col justify-center">
            <img src={ayokaLogo} alt="AYOKA MARKET" className="h-7 sm:h-12 w-auto cursor-pointer transition-all duration-300 hover:scale-105 object-contain dark:drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]" onClick={() => navigate("/")} />
            {/* Location directly below logo on mobile */}
            {userLocation && !isLoadingLocation && (
              <div className="flex sm:hidden items-center gap-1 text-[10px] text-muted-foreground -mt-1">
                <MapPin className="h-2.5 w-2.5" />
                <span className="truncate max-w-[150px]">{userLocation}</span>
              </div>
            )}
            {isLoadingLocation && (
              <div className="flex sm:hidden items-center gap-1 text-[10px] text-muted-foreground -mt-1">
                <Loader2 className="h-2.5 w-2.5 animate-spin" />
                <span>Localisation...</span>
              </div>
            )}
            {!userLocation && !isLoadingLocation && locationError && (
              <button 
                onClick={requestLocation}
                className="flex sm:hidden items-center gap-1 text-[10px] text-muted-foreground -mt-1 hover:text-foreground transition-colors"
              >
                <MapPin className="h-2.5 w-2.5" />
                <span>{locationError}</span>
              </button>
            )}
          </div>
          
          {/* Actions on mobile - shown inline with logo */}
          <nav className="flex sm:hidden items-center gap-2">
            <Button variant="ghost" size="sm" onClick={toggleDarkMode} className="gap-2 min-h-[44px] min-w-[44px] p-2" aria-label="Changer de thème">
              {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            {isAuthenticated && <SystemNotifications />}
            {isAuthenticated ? <Button variant="ghost" size="sm" onClick={() => navigate("/profile")} className="gap-2 p-2">
                <User className="h-4 w-4" />
              </Button> : <Button variant="default" size="sm" onClick={() => navigate("/auth", {
            state: {
              mode: 'login'
            }
          })} className="gap-2 text-xs px-3">
                <LogIn className="h-4 w-4" />
                Se connecter
              </Button>}
          </nav>
        </div>

        {/* Desktop layout */}
        <div className="hidden sm:flex items-center gap-3">
          {userLocation && !isLoadingLocation && (
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <MapPin className="h-3.5 w-3.5" />
              <span className="truncate max-w-[150px]">{userLocation}</span>
            </div>
          )}
          {isLoadingLocation && (
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              <span>Localisation...</span>
            </div>
          )}
          {!userLocation && !isLoadingLocation && locationError && (
            <button 
              onClick={requestLocation}
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <MapPin className="h-3.5 w-3.5" />
              <span>{locationError}</span>
            </button>
          )}
        </div>

        <nav className="hidden sm:flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={toggleDarkMode} className="gap-2 min-h-[44px] min-w-[44px]" aria-label="Changer de thème">
            {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
          {isAuthenticated && <SystemNotifications />}
          {isAuthenticated ? <Button variant="ghost" size="sm" onClick={() => navigate("/profile")} className="gap-2">
              <User className="h-4 w-4" />
              <span>Mon profil</span>
            </Button> : <Button variant="default" size="sm" onClick={() => navigate("/auth", {
          state: {
            mode: 'login'
          }
        })} className="gap-2">
            <LogIn className="h-4 w-4" />
            Se connecter
          </Button>}
        </nav>
      </div>
    </header>;
};
export default Header;