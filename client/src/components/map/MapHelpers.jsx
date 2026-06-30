import { useEffect } from "react";
import { useMap, useMapEvents } from "react-leaflet";
import swal from "sweetalert";

// Size Fixer & Search Focus Handler Component
export function MapEngineFixer({ darkMode, searchTarget }) {
  const map = useMap();

  useEffect(() => {
    map.invalidateSize();
    const t1 = setTimeout(() => map.invalidateSize(), 50);
    const t2 = setTimeout(() => map.invalidateSize(), 300);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [map, darkMode]);

  useEffect(() => {
    if (searchTarget) {
      map.flyTo([searchTarget.lat, searchTarget.lng], 13, {
        animate: true,
        duration: 1.5,
      });
    }
  }, [map, searchTarget]);

  return null;
}

// Click Handler Component to Pin Location
export function MapClickHandler({ setLatitude, setLongitude, navigate }) {
  useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng;
      swal({
        title: "Pin this location?",
        text: `Latitude: ${lat.toFixed(6)}\nLongitude: ${lng.toFixed(6)}`,
        icon: "info",
        buttons: ["Cancel", "Yes, Pin It"],
      }).then((willPin) => {
        if (willPin) {
          setLatitude(lat);
          setLongitude(lng);
          swal("Success!", "Location saved successfully!", "success");
          navigate("/profile/places/new");
        }
      });
    },
  });
  return null;
}