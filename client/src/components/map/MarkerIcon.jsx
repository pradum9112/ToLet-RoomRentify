import L from "leaflet";
import defaultMapHome from "../../assets/media/images/maphome.png";

// Custom Pointed Corner Circle Icon Generator (Single Unified Color Scheme)
export const createPhotoIcon = (imageUrl) => {
  const borderColour = "#534173"; 
  const safeUrl = imageUrl || defaultMapHome;

  return L.divIcon({
    html: `
      <div style="position: relative; width: 46px; height: 46px;">
        <div style="
          width: 46px; 
          height: 46px; 
          border-radius: 50%; 
          border: 3px solid ${borderColour}; 
          overflow: hidden; 
          box-shadow: 0 4px 10px rgba(0,0,0,0.3);
          background: white;
          position: absolute;
          top: 0;
          left: 0;
          z-index: 2;
        ">
          <img 
            src="${safeUrl}" 
            style="width: 100%; height: 100%; object-fit: cover; display: block;" 
            alt="room"
          />
        </div>
        <div style="
          position: absolute;
          bottom: -6px;
          left: 50%;
          transform: translateX(-50%) rotate(45deg);
          width: 14px;
          height: 14px;
          background: ${borderColour};
          box-shadow: 2px 2px 4px rgba(0,0,0,0.25);
          z-index: 1;
        "></div>
      </div>
    `,
    className: "custom-clear-marker", 
    iconSize: [46, 52],    
    iconAnchor: [23, 52],  
    popupAnchor: [0, -52]
  });
};