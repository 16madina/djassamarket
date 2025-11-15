import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin } from 'lucide-react';

interface LocationMapProps {
  location: string;
}

const LocationMap = ({ location }: LocationMapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);

  useEffect(() => {
    if (!mapContainer.current) return;

    // Geocode location to coordinates (simple approach for West African cities)
    const getCoordinates = (loc: string): [number, number] => {
      const locationMap: Record<string, [number, number]> = {
        'abidjan': [-4.0, 5.3],
        'dakar': [-17.4, 14.7],
        'bamako': [-8.0, 12.6],
        'conakry': [-13.7, 9.5],
        'ouagadougou': [-1.5, 12.4],
        'lomé': [1.2, 6.1],
        'cotonou': [2.4, 6.4],
        'niamey': [2.1, 13.5],
      };

      const normalizedLoc = loc.toLowerCase();
      for (const [city, coords] of Object.entries(locationMap)) {
        if (normalizedLoc.includes(city)) {
          return coords;
        }
      }
      // Default to Abidjan
      return [-4.0, 5.3];
    };

    const coordinates = getCoordinates(location);

    // Initialize map with token from environment
    const token = import.meta.env.VITE_MAPBOX_PUBLIC_TOKEN;
    
    if (!token) {
      console.error('VITE_MAPBOX_PUBLIC_TOKEN n\'est pas défini');
      return;
    }

    mapboxgl.accessToken = token;
    
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: coordinates,
      zoom: 12,
    });

    // Add marker
    new mapboxgl.Marker({ color: '#6366f1' })
      .setLngLat(coordinates)
      .addTo(map.current);

    // Add navigation controls
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    // Cleanup
    return () => {
      map.current?.remove();
    };
  }, [location]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <MapPin className="h-5 w-5" />
          Localisation
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div ref={mapContainer} className="h-64 w-full rounded-b-lg" />
      </CardContent>
    </Card>
  );
};

export default LocationMap;
