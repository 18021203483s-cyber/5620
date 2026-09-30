'use client';

import { useEffect, useRef } from 'react';
import { ScoredProperty } from '@/lib/types';

interface MapViewProps {
  properties: ScoredProperty[];
  selectedProperty?: ScoredProperty | null;
  onPropertySelect?: (property: ScoredProperty) => void;
}

// Default center: Sydney CBD
const DEFAULT_CENTER: [number, number] = [-33.8688, 151.2093];
const DEFAULT_ZOOM = 12;

export default function MapView({ properties, selectedProperty, onPropertySelect }: MapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const isInitializedRef = useRef(false);

  useEffect(() => {
    // Prevent multiple initializations
    if (isInitializedRef.current) return;
    
    let mounted = true;
    let map: any = null;

    const initMap = async () => {
      if (!mapRef.current || !mounted) return;
      
      // Check if Leaflet map already exists on this container
      // Leaflet stores map instance as _leaflet_id on the container
      if ((mapRef.current as any)._leaflet_id) {
        console.warn('Map already initialized, skipping');
        return;
      }
      
      try {
        const L = (await import('leaflet')).default;
        
        if (!mounted || !mapRef.current) return;
        
        // Double check after import
        if ((mapRef.current as any)._leaflet_id) {
          console.warn('Map initialized during import, skipping');
          return;
        }

        // Initialize map
        map = L.map(mapRef.current).setView(
          selectedProperty ? [selectedProperty.lat, selectedProperty.lng] : DEFAULT_CENTER,
          selectedProperty ? 15 : DEFAULT_ZOOM
        );
        
        if (!mounted) {
          if (map) map.remove();
          return;
        }

        mapInstanceRef.current = map;
        isInitializedRef.current = true;

        // Add OpenStreetMap tiles
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);

        // Add markers for properties
        updateMarkers(L, map, properties, selectedProperty);
      } catch (error) {
        console.error('Error initializing map:', error);
      }
    };

    initMap();

    return () => {
      mounted = false;
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove();
        } catch (e) {
          // Ignore cleanup errors
        }
        mapInstanceRef.current = null;
        isInitializedRef.current = false;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update markers when properties change (without reinitializing map)
  useEffect(() => {
    const updateMarkersAsync = async () => {
      if (!mapInstanceRef.current) return;
      
      try {
        const L = (await import('leaflet')).default;
        updateMarkers(L, mapInstanceRef.current, properties, selectedProperty);
        
        // Update map view if property is selected
        if (selectedProperty && mapInstanceRef.current) {
          mapInstanceRef.current.setView(
            [selectedProperty.lat, selectedProperty.lng],
            15,
            { animate: true }
          );
        }
      } catch (error) {
        console.error('Error updating markers:', error);
      }
    };
    updateMarkersAsync();
  }, [properties, selectedProperty]);

  const updateMarkers = (L: any, map: any, props: ScoredProperty[], selected: ScoredProperty | null) => {
    if (!map) return;
    
    // Clear existing markers
    markersRef.current.forEach(marker => {
      try {
        marker.remove();
      } catch (e) {
        // Marker might already be removed
      }
    });
    markersRef.current = [];

    // Create custom icon for selected property
    const selectedIcon = L.divIcon({
      className: 'custom-marker selected',
      html: `
        <div style="
          background: #3B82F6;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          border: 3px solid white;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: bold;
          font-size: 14px;
        ">✓</div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });

    // Create custom icon for regular properties
    const regularIcon = L.divIcon({
      className: 'custom-marker',
      html: `
        <div style="
          background: #10B981;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          border: 2px solid white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        "></div>
      `,
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    });

    // Add markers
    props.forEach(property => {
      const isSelected = selected?.id === property.id;
      const icon = isSelected ? selectedIcon : regularIcon;

      const marker = L.marker([property.lat, property.lng], { icon })
        .addTo(map)
        .bindPopup(`
          <div style="min-width: 180px;">
            <strong style="font-size: 14px;">${property.address}</strong><br/>
            <span style="color: #666;">${property.suburb}</span><br/>
            <span style="color: #3B82F6; font-weight: bold;">$${property.price}/week</span><br/>
            <span style="font-size: 12px; color: #666;">${property.bedrooms} bed • ${property.bathrooms} bath</span><br/>
            <span style="font-size: 12px; background: #10B981; color: white; padding: 2px 6px; border-radius: 4px;">
              Score: ${property.totalScore}%
            </span>
          </div>
        `);

      if (onPropertySelect) {
        marker.on('click', () => onPropertySelect(property));
      }

      markersRef.current.push(marker);
    });

    // Fit bounds if multiple properties
    if (props.length > 1 && !selected) {
      const group = L.featureGroup(markersRef.current);
      map.fitBounds(group.getBounds().pad(0.1));
    }
  };

  return (
    <div className="relative w-full h-full">
      <div ref={mapRef} id="leaflet-map" className="w-full h-full" />
      
      {/* Map Legend */}
      <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm rounded-lg p-3 shadow-lg z-[1000]">
        <h4 className="text-xs font-semibold text-gray-700 mb-2">Legend</h4>
        <div className="space-y-1 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500 border-2 border-white"></div>
            <span className="text-gray-600">Selected</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500 border-2 border-white"></div>
            <span className="text-gray-600">Available</span>
          </div>
        </div>
      </div>

      {/* Property Count */}
      <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm rounded-lg px-3 py-2 shadow-lg z-[1000]">
        <span className="text-sm font-medium text-gray-700">
          🏠 {properties.length} Properties
        </span>
      </div>
    </div>
  );
}
