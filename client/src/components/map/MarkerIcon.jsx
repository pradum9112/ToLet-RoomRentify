import L from "leaflet";
import defaultMapHome from "../../assets/media/images/maphome.png";

export const createPhotoIcon = (imageUrl) => {
  const safeUrl = imageUrl || defaultMapHome;

  return L.divIcon({
    html: `
      <div class="room-pin-wrapper">
        <div class="room-pin-circle">
          <img 
            src="${safeUrl}" 
            style="width: 100%; height: 100%; object-fit: cover; display: block;" 
            alt="room"
          />
        </div>
        <div class="room-pin-triangle"></div>
      </div>
    `,
    className: "custom-clear-marker",
    iconSize: [46, 52],
    iconAnchor: [23, 52],
    popupAnchor: [0, -52],
  });
};
