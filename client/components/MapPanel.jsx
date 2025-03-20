import { useEffect, useState } from "react";
import WeatherMap from './Map';

function MapCallOutput({ mapCallOutput }) {
  const [marker, setMarker] = useState(null);
  const [coords, setCoords] = useState(null);

  async function Weather({ lat, lng, location }) {
    try {
      setMarker({ lat, lng, location });
      setCoords({ lat, lng, location });

      const response = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,wind_speed_10m`
      );

      if (!response.ok) throw new Error("Weather API request failed");

      const json = await response.json();

      setMarker({
        lat,
        lng,
        location,
        temperature: {
          value: json.current?.temperature_2m ?? "N/A",
          units: json.current_units?.temperature_2m ?? "",
        },
        wind_speed: {
          value: json.current?.wind_speed_10m ?? "N/A",
          units: json.current_units?.wind_speed_10m ?? "",
        },
      });
    } catch (error) {
      console.error("Weather API Error:", error);
    }
  }

   useEffect(() => {
    if (!mapCallOutput?.arguments) return;
    
    const { lat, lng, location } = JSON.parse(mapCallOutput.arguments);
    
    if (lat && lng) {
      Weather({ lat, lng, location });
    }
  }, [mapCallOutput?.arguments]);


  return (
    <div className="content-block map">
      <div className="content-block-title">get_weather()</div>
      <div className="content-block-title bottom">
        {marker?.location || 'not yet retrieved'}
        {!!marker?.temperature && (
          <>
            <br />
            🌡️ {marker.temperature.value} {marker.temperature.units}
          </>
        )}
        {!!marker?.wind_speed && (
          <>
            {' '}
            🍃 {marker.wind_speed.value} {marker.wind_speed.units}
          </>
        )}
      </div>
      <div className="content-block-body full">
        {coords && (
          <WeatherMap
            center={[coords.lat, coords.lng]}
            location={coords.location}
          />
        )}
      </div>
    </div>
  );
}
  
export default function MapPanel({
  isSessionActive,
  sendClientEvent,
  events,
}) {
  const [mapFunctionAdded, setMapFunctionAdded] = useState(false);
  const [mapCallOutput, setMapFunctionCallOutput] = useState(null);

  useEffect(() => {
    if (!events || events.length === 0) return;

    const firstEvent = events[events.length - 1];
    if (!mapFunctionAdded && firstEvent.type === "session.created") {
      sendClientEvent(mapSessionUpdate);
      setMapFunctionAdded(true);
    }

    const mostRecentEvent = events[0];
    if (
      mostRecentEvent.type === "response.done" &&
      mostRecentEvent.response.output
    ) {
      mostRecentEvent.response.output.forEach((output) => {
        if (
          output.type === "function_call" &&
          output.name === "display_weather"
        ) {
          setMapFunctionCallOutput(output);
          setTimeout(() => {
            sendClientEvent({
              type: "response.create",
              response: {
                instructions: `
                describe the weather results you have provided.
              `,
              },
            });
          }, 500);
        }
      });
    }
  }, [events]);

  useEffect(() => {
    if (!isSessionActive) {
      setMapFunctionAdded(false);
      setMapFunctionCallOutput(null);
    }
  }, [isSessionActive]);

  return (
    <section className="h-full w-full flex flex-col gap-4">
      <div className="h-full bg-gray-50 rounded-md p-4">
        <h2 className="text-lg font-bold">Wetter Tool</h2>
        {isSessionActive ? (
          mapCallOutput ? (
            <MapCallOutput mapCallOutput={mapCallOutput} />
          ) : (
            <p>Fragen Sie nach dem Wetter in einer Region, um die Informationen zu sehen.</p>
          )
        ) : (
          <p>Starten Sie die Sitzung um dieses Tool zu verwenden.</p>
        )}
      </div>
    </section>
  );
}