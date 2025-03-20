import { useEffect, useState } from "react";
import "leaflet/dist/leaflet.css";

function WeatherMap({ center, location }) {
  const [LeafletComponents, setLeafletComponents] = useState(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      
      import("react-leaflet").then((L) => {
        setLeafletComponents({
          MapContainer: L.MapContainer,
          TileLayer: L.TileLayer,
          Marker: L.Marker,
          Popup: L.Popup,
        });
      });
    }
  }, []);

  if (!LeafletComponents) {
    return <div className="text-gray-500">Loading map...</div>;
  }

  const { MapContainer, TileLayer, Marker, Popup } = LeafletComponents;

  return (
    <MapContainer center={center} zoom={10} style={{ height: "300px", width: "100%", borderRadius: "10px" }}>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      />
      <Marker position={center}>
        <Popup>{location}</Popup>
      </Marker>
    </MapContainer>
  );
}

export default WeatherMap;
