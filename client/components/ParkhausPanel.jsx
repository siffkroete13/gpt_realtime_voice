import { useEffect, useState } from "react";

function ParkhausOutput({ parkhausData }) {
  return (
    <div className="flex flex-col gap-2 border-b pb-2">
      <h3 className="font-bold">📍 {parkhausData.title}</h3>
      <p>Adresse: {parkhausData.address}</p>
      <p>Freie Plätze: {parkhausData.free}</p>
      <p>Gesamtkapazität: {parkhausData.total || 'Unbekannt'}</p>
      <p>Status: {parkhausData.status}</p>
      <a href={parkhausData.link} target="_blank" className="text-blue-500 underline">🌍 Mehr Infos</a>
    </div>
  );
}

export default function ParkhausPanel({ isSessionActive, events, sendClientEvent }) {
  const [parkhausResponses, setParkhausResponses] = useState([]);

  useEffect(() => {
    if (!events || events.length === 0) return;

    const mostRecentEvent = events[0];
    if (mostRecentEvent.type === "response.done" && mostRecentEvent.response.output) {
      mostRecentEvent.response.output.forEach((output) => {
        if (output.type === "function_call" && output.name === "display_parking_availability") {
          try {
            const parkhausData = JSON.parse(output.arguments);
            setParkhausResponses([parkhausData]);
            console.log("Parkhaus Data Received:", parkhausData);
          } catch (error) {
            console.error("Error parsing Parkhaus response:", error);
          }
        }
      });
    }
  }, [events]);

  useEffect(() => {
    if (!isSessionActive) {
      setParkhausResponses([]);
    }
  }, [isSessionActive]);

  // Function to fetch parking data directly from API
  const fetchParkingData = async (parkhausName) => {
    const baseUrl = "https://data.bs.ch/api/explore/v2.1/catalog/datasets/100088/records?limit=20";
    const url = parkhausName ? `${baseUrl}&refine=title%3A%22${encodeURIComponent(parkhausName)}%22` : baseUrl;
    
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Fehler beim Abrufen der Daten: ${response.statusText}`);
      
      const data = await response.json();
      if (data.total_count === 0) {
        setParkhausResponses([]);
      } else {
        setParkhausResponses(data.results);
      }
    } catch (error) {
      console.error("Fehler bei der API-Anfrage:", error);
    }
  };

  return (
    <section className="h-full w-full flex flex-col gap-4">
      <div className="h-full bg-gray-50 rounded-md p-4">
        <h2 className="text-lg font-bold">Parkhaus Verfügbarkeit</h2>

        {isSessionActive ? (
          parkhausResponses.length > 0 ? (
            parkhausResponses.map((data, index) => <ParkhausOutput key={index} parkhausData={data} />)
          ) : (
            <p>Frage nach einem Parkhaus, um die Verfügbarkeit zu sehen...</p>
          )
        ) : (
          <p>Starten Sie die Sitzung, um dieses Tool zu aktivieren.</p>
        )}
      </div>
    </section>
  );
}
