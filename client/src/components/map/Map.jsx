import React, { useState, useContext, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import axios from "axios";
import swal from "sweetalert";
import { Box, Button, Typography, Stack, TextField, InputAdornment, IconButton } from "@mui/material";
import WbSunnyIcon from "@mui/icons-material/WbSunny";
import BedtimeIcon from "@mui/icons-material/Bedtime";
import SearchIcon from "@mui/icons-material/Search";

import { UserContext } from "../../context/UserContext.jsx";
import { url } from "../../utils/Constants";
import { createPhotoIcon } from "./MarkerIcon";
import { MapEngineFixer, MapClickHandler } from "./MapHelpers";
import "../../assets/styles/map.css";

// Fix Leaflet Marker Icons Fallback
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require("leaflet/dist/images/marker-icon-2x.png"),
  iconUrl: require("leaflet/dist/images/marker-icon.png"),
  shadowUrl: require("leaflet/dist/images/marker-shadow.png"),
});

export default function Map() {
  const [points, setPoints] = useState([]);
  const [darkMode, setDarkMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchTarget, setSearchTarget] = useState(null);

  const { setLatitude, setLongitude } = useContext(UserContext);
  const navigate = useNavigate();

  const defaultCenter = [25.3176, 82.9739];
  const defaultZoom = 12;

  // Fetch Places
  useEffect(() => {
    const getPoints = async () => {
      try {
        const response = await axios.get(`${url}/places/allplaces`);
        setPoints(Array.isArray(response.data) ? response.data : []);
      } catch (error) {
        console.error("Error fetching places:", error);
      }
    };
    getPoints();
  }, []);

  // Search Query Processor
  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1`
      );
      const data = await response.json();
      if (data && data.length > 0) {
        setSearchTarget({ lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) });
      } else {
        swal("Not Found", "Location area not found. Please try another specific landmark.", "warning");
      }
    } catch (err) {
      console.error("Search Query Error:", err);
    }
  };

  return (
    <Box sx={{ mx: 3, my: 3, display: "flex", flexDirection: "column", gap: 2 }}>
      {/* Header */}
      <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems="center" gap={2}>
        <Typography variant="h5" fontWeight="700" color={darkMode ? "#fff" : "#534173"}>
          Explore Rental Properties
        </Typography>

        <Stack direction="row" spacing={2} alignItems="center" component="form" onSubmit={handleSearch}>
          <TextField
            size="small"
            placeholder="Search city or area..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            sx={{ width: { xs: "100%", sm: "280px" } }}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton type="submit">
                    <SearchIcon />
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          <Button
            variant="contained"
            startIcon={darkMode ? <WbSunnyIcon /> : <BedtimeIcon />}
            onClick={() => setDarkMode(!darkMode)}
            sx={{ backgroundColor: "#534173", textTransform: "none", whiteSpace: "nowrap" }}
          >
            {darkMode ? "Light" : "Dark"} Mode
          </Button>
        </Stack>
      </Stack>

      {/* Map Layout Box Container */}
      <Box
        sx={{
          width: "100%",
          height: { xs: "60vh", sm: "70vh", md: "75vh" },
          borderRadius: "16px",
          overflow: "hidden",
          boxShadow: "0 10px 30px rgba(0,0,0,0.15)",
          border: "1px solid",
          borderColor: darkMode ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"
        }}
      >
        <MapContainer
          center={defaultCenter}
          zoom={defaultZoom}
          style={{ height: "100%", width: "100%" }}
          zoomControl={true}
        >
          <TileLayer
            url={
              darkMode
                ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                : "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
            }
            attribution='&copy; OpenStreetMap contributors'
          />

          <MapEngineFixer darkMode={darkMode} searchTarget={searchTarget} />

          <MapClickHandler
            setLatitude={setLatitude}
            setLongitude={setLongitude}
            navigate={navigate}
          />

          {points.map((point) => {
            const lat = Number(point.latitude);
            const lng = Number(point.longitude);

            if (isNaN(lat) || isNaN(lng)) return null;

            let roomImage = "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=200&q=80";
            if (point.photos && Array.isArray(point.photos) && point.photos.length > 0) {
              roomImage = point.photos[0]; 
            }

            return (
              <Marker
                key={point._id}
                position={[lat, lng]}
                icon={createPhotoIcon(roomImage)} 
              >
                <Popup maxWidth={240}>
                  <div style={{ textAlign: "center", fontFamily: "sans-serif" }}>
                    <div style={{ position: "relative" }}>
                      <img
                        src={roomImage}
                        alt={point.title}
                        style={{ width: "100%", height: "120px", objectFit: "cover", borderRadius: "8px" }}
                        onError={(e) => { e.target.src = "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=200&q=80"; }}
                      />
                    </div>

                    <h4 style={{ margin: "10px 0 4px 0", fontSize: "14px", fontWeight: "700" }}>{point.title}</h4>
                    <p style={{ margin: "2px 0", fontSize: "12px" }}><strong>Type:</strong> {point.placetype}</p>
                    <p style={{ margin: "2px 0 8px 0", fontSize: "12px" }}><strong>Price:</strong> ₹{point.price} {point.placetype === "Hotel" ? "/night" : "/month"}</p>

                    {point.isbooked ? (
                      <button disabled style={{ width: "100%", padding: "8px", background: "#ccc", border: "none", borderRadius: "6px", cursor: "not-allowed" }}>
                        Already Booked
                      </button>
                    ) : (
                      <Link
                        to={`/detail/${point._id}`}
                        style={{
                          display: "block",
                          padding: "8px",
                          background: "#534173",
                          color: "white",
                          textDecoration: "none",
                          borderRadius: "6px",
                          fontSize: "12px",
                          fontWeight: "600",
                          textAlign: "center"
                        }}
                      >
                        View Details
                      </Link>
                    )}
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </Box>
    </Box>
  );
}