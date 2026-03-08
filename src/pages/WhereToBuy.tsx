import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, MapPin, Loader2, Search, RotateCcw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

// Fix default marker icons for Leaflet + bundlers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

interface Place {
  id: number;
  lat: number;
  lon: number;
  name: string;
  type: string;
}

function MapUpdater({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, 14);
  }, [center, map]);
  return null;
}

export default function WhereToBuy() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const dish = searchParams.get("dish") || "food";

  const [position, setPosition] = useState<[number, number] | null>(null);
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [manualLocation, setManualLocation] = useState("");
  const [geoError, setGeoError] = useState(false);

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPosition([pos.coords.latitude, pos.coords.longitude]);
        setLoading(false);
      },
      () => {
        setGeoError(true);
        setLoading(false);
      },
      { timeout: 8000 }
    );
  }, []);

  useEffect(() => {
    if (position) {
      searchNearby(position);
    }
  }, [position]);

  const searchNearby = async (coords: [number, number]) => {
    setSearching(true);
    setSearchError(null);
    try {
      const [lat, lon] = coords;
      const { data, error } = await supabase.functions.invoke("nearby-places", {
        body: { lat, lon },
      });
      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);
      setPlaces(data.places ?? []);
    } catch (e) {
      setSearchError(e instanceof Error ? e.message : "Failed to find nearby places");
      setPlaces([]);
    } finally {
      setSearching(false);
    }
  };

  const handleManualSearch = async () => {
    if (!manualLocation.trim()) return;
    setSearching(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(manualLocation)}&limit=1`
      );
      const data = await res.json();
      if (data.length > 0) {
        const coords: [number, number] = [parseFloat(data[0].lat), parseFloat(data[0].lon)];
        setPosition(coords);
        setGeoError(false);
      }
    } catch {
      // ignore
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-border">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="font-display font-semibold text-foreground text-lg">
            Where to get {dish}
          </h1>
          <p className="text-muted-foreground text-xs">
            Nearby restaurants & stores
          </p>
        </div>
      </div>

      {/* Manual location fallback */}
      {(geoError || !position) && !loading && (
        <div className="p-4 flex gap-2">
          <Input
            placeholder="Enter your location..."
            value={manualLocation}
            onChange={(e) => setManualLocation(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleManualSearch()}
          />
          <Button size="sm" onClick={handleManualSearch} disabled={searching}>
            <Search className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
            <p className="text-muted-foreground text-sm">Getting your location...</p>
          </div>
        </div>
      )}

      {/* Map */}
      {position && (
        <div className="flex-1 relative">
          {searching && (
            <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[1000] bg-card border border-border rounded-full px-4 py-1.5 flex items-center gap-2 shadow-sm">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
              <span className="text-xs text-muted-foreground">Searching nearby...</span>
            </div>
          )}
          {searchError && !searching && (
            <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[1000] bg-card border border-destructive rounded-lg px-4 py-2 flex items-center gap-2 shadow-sm">
              <span className="text-xs text-destructive">{searchError}</span>
              <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={() => searchNearby(position)}>
                <RotateCcw className="w-3 h-3 mr-1" /> Retry
              </Button>
            </div>
          )}
          <MapContainer
            center={position}
            zoom={14}
            className="w-full h-full min-h-[60vh]"
            style={{ zIndex: 1 }}
          >
            <MapUpdater center={position} />
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <Marker position={position}>
              <Popup>You are here</Popup>
            </Marker>
            {places.map((place) => (
              <Marker key={place.id} position={[place.lat, place.lon]}>
                <Popup>
                  <strong>{place.name}</strong>
                  <br />
                  <span className="text-xs capitalize">{place.type.replace(/_/g, " ")}</span>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      )}

      {/* No location prompt */}
      {!position && !loading && geoError && !manualLocation && (
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center">
            <MapPin className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">
              Enter your location above to find nearby places
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
