
import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { MapPin, Phone, Clock, ChevronRight, Star, Globe, Search, Navigation } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api';
import { useSettings } from "@/hooks/useSettings";

interface Center {
  id: string;
  name: string;
  address: string;
  city: string;
  state_province: string;
  latitude: number;
  longitude: number;
  phone: string;
  email: string;
  is_active: boolean;
}

const mapContainerStyle = {
  width: '100%',
  height: '100%'
};

const mapOptions = {
  disableDefaultUI: true,
  zoomControl: true,
  styles: [
    {
      "elementType": "geometry",
      "stylers": [{ "color": "#1d2c4d" }]
    },
    {
      "elementType": "labels.text.fill",
      "stylers": [{ "color": "#8ec3b9" }]
    },
    {
      "elementType": "labels.text.stroke",
      "stylers": [{ "color": "#1a3646" }]
    },
    {
      "featureType": "administrative.country",
      "elementType": "geometry.stroke",
      "stylers": [{ "color": "#4b6878" }]
    },
    {
      "featureType": "landscape.man_made",
      "elementType": "geometry.stroke",
      "stylers": [{ "color": "#334e87" }]
    },
    {
      "featureType": "poi",
      "elementType": "geometry",
      "stylers": [{ "color": "#283d6a" }]
    },
    {
      "featureType": "road",
      "elementType": "geometry",
      "stylers": [{ "color": "#304a7d" }]
    },
    {
      "featureType": "water",
      "elementType": "geometry",
      "stylers": [{ "color": "#0e1626" }]
    }
  ]
};

const CenterFinder = () => {
  const { settings } = useSettings();
  const [centers, setCenters] = useState<Center[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCenter, setSelectedCenter] = useState<Center | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const apiKey = settings?.google_maps_api_key || "";

  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: apiKey
  });

  useEffect(() => {
    fetchCenters();
  }, []);

  const fetchCenters = async () => {
    try {
      const { data, error } = await supabase
        .from('centers')
        .select('*')
        .eq('is_active', true);
      
      if (error) throw error;
      setCenters(data || []);
      if (data && data.length > 0) setSelectedCenter(data[0]);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load centers: " + error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredCenters = centers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.city.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const centerCoords = useMemo(() => {
    if (selectedCenter) return { lat: Number(selectedCenter.latitude), lng: Number(selectedCenter.longitude) };
    return { lat: 43.6532, lng: -79.3832 }; // Default to Toronto
  }, [selectedCenter]);

  return (
    <div className="flex flex-col lg:flex-row gap-6 p-1 h-[calc(100vh-12rem)] min-h-[600px]">
      {/* Sidebar - List of Centers */}
      <Card className="flex-1 lg:max-w-md bg-card/5 border-white/10 backdrop-blur-xl overflow-hidden flex flex-col rounded-3xl">
        <CardHeader className="p-6 pb-2">
          <CardTitle className="text-2xl font-bold italic uppercase tracking-tight text-white flex items-center gap-3">
            <Globe className="w-6 h-6 text-indigo-400" />
            Center Finder
          </CardTitle>
          <div className="relative mt-4">
            <Input 
              placeholder="Search by city or name..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-card/5 border-white/10 text-white rounded-2xl pl-10 h-12"
            />
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          </div>
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3">
          {loading ? (
             <div className="space-y-3">
               {[1,2,3].map(i => <div key={i} className="h-24 bg-card/5 animate-pulse rounded-2xl" />)}
             </div>
          ) : filteredCenters.length === 0 ? (
            <div className="text-center py-12">
              <MapPin className="w-12 h-12 mx-auto text-white/10 mb-4" />
              <p className="text-white/40 font-medium">No centers found matching your search.</p>
            </div>
          ) : (
            filteredCenters.map((center) => (
              <motion.button
                key={center.id}
                layout
                onClick={() => setSelectedCenter(center)}
                className={`w-full p-4 rounded-2xl text-left transition-all border ${
                   selectedCenter?.id === center.id 
                    ? 'bg-indigo-600 border-indigo-500 shadow-lg shadow-indigo-600/20' 
                    : 'bg-card/5 border-white/5 hover:border-white/20'
                }`}
              >
                <div className="flex justify-between items-start mb-1">
                  <h3 className={`font-bold ${selectedCenter?.id === center.id ? 'text-white' : 'text-indigo-100'}`}>
                    {center.name}
                  </h3>
                  <Badge className={selectedCenter?.id === center.id ? 'bg-card/20 text-white' : 'bg-emerald-500/10 text-emerald-400 border-0'}>
                    OPEN
                  </Badge>
                </div>
                <div className="flex items-center gap-2 text-white/40 text-[11px] font-medium mb-3">
                  <MapPin className="w-3 h-3" />
                  {center.city}, {center.state_province}
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex -space-x-1">
                    {[1,2,3,4,5].map(i => (
                      <Star key={i} className={`w-3 h-3 ${i <= 5 ? 'text-amber-400 fill-amber-400' : 'text-white/10'}`} />
                    ))}
                  </div>
                  <ChevronRight className={`w-4 h-4 transition-transform ${selectedCenter?.id === center.id ? 'translate-x-1 text-white' : 'text-white/10'}`} />
                </div>
              </motion.button>
            ))
          )}
        </CardContent>
      </Card>

      {/* Main Area - Map & Details */}
      <div className="flex-[2] flex flex-col gap-6 h-full">
        <Card className="flex-1 bg-card/5 border-white/10 rounded-[2.5rem] overflow-hidden relative group">
          {(!apiKey || loadError) ? (
            <div className="absolute inset-0 bg-[#0a0f25] flex flex-col items-center justify-center p-8 text-center">
              <div className="w-16 h-16 bg-amber-500/10 rounded-2xl flex items-center justify-center mb-4">
                <MapPin className="w-8 h-8 text-amber-500" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Google Maps Key Required</h3>
              <p className="text-white/40 max-w-md mx-auto mb-6">
                Please provide a valid Google Maps API Key in Organization Settings to enable the interactive map.
              </p>
              <div className="relative w-full h-48 rounded-2xl overflow-hidden border border-white/5 opacity-50 grayscale">
                 <img src="/artifacts/map_mockup_1773234882923.png" alt="Map Placeholder" className="w-full h-full object-cover" />
                 <div className="absolute inset-0 bg-gradient-to-t from-[#0a0f25] to-transparent" />
              </div>
            </div>
          ) : !isLoaded ? (
            <div className="absolute inset-0 bg-[#0a0f25] flex items-center justify-center">
              <Clock className="w-8 h-8 text-white/20 animate-spin" />
            </div>
          ) : (
            <GoogleMap
              mapContainerStyle={mapContainerStyle}
              center={centerCoords}
              zoom={13}
              options={mapOptions}
            >
              {centers.map(center => (
                <Marker 
                  key={center.id}
                  position={{ lat: Number(center.latitude), lng: Number(center.longitude) }}
                  onClick={() => setSelectedCenter(center)}
                  icon={{
                    url: "https://maps.google.com/mapfiles/ms/icons/blue-dot.png"
                  }}
                />
              ))}
            </GoogleMap>
          )}

          <div className="absolute inset-x-0 bottom-0 p-8 pt-20 pointer-events-none bg-gradient-to-t from-[#0a0f25] via-[#0a0f25]/40 to-transparent">
             {selectedCenter && (
               <motion.div 
                 initial={{ opacity: 0, y: 20 }}
                 animate={{ opacity: 1, y: 0 }}
                 className="bg-card/10 backdrop-blur-2xl border border-white/10 p-6 rounded-[2rem] max-w-lg shadow-2xl pointer-events-auto mx-auto lg:mx-0"
               >
                 <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center">
                      <Navigation className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-white leading-tight">{selectedCenter.name}</h2>
                      <p className="text-white/50 text-sm">{selectedCenter.address}</p>
                    </div>
                 </div>
                 
                 <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="flex items-center gap-3 bg-card/5 p-3 rounded-xl">
                       <Phone className="w-4 h-4 text-indigo-400" />
                       <div className="text-[11px] font-bold text-white/30 uppercase tracking-wider">
                          Call Support
                          <div className="text-white lowercase font-medium">{selectedCenter.phone || '(555) 000-0000'}</div>
                       </div>
                    </div>
                    <div className="flex items-center gap-3 bg-card/5 p-3 rounded-xl">
                       <Clock className="w-4 h-4 text-emerald-400" />
                       <div className="text-[11px] font-bold text-white/30 uppercase tracking-wider">
                          Operating Hours
                          <div className="text-white font-medium">08:00 - 18:00</div>
                       </div>
                    </div>
                 </div>

                 <div className="flex gap-2">
                    <Button className="flex-1 bg-indigo-600 hover:bg-indigo-500 rounded-xl h-12 font-bold gap-2">
                      <Navigation className="w-4 h-4" /> Get Directions
                    </Button>
                    <Button variant="outline" className="flex-1 bg-card/5 border-white/10 text-white hover:bg-card/10 rounded-xl h-12 font-bold">
                      Book Now
                    </Button>
                 </div>
               </motion.div>
             )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default CenterFinder;

