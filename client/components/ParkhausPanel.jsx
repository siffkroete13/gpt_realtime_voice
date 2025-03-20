import { useEffect, useState } from "react";
//import Fuse from 'fuse.js';

function ParkhausOutput({ parkhausData }) {
  return (
    <div className="flex flex-col gap-2 border-b pb-2">
      <h3 className="font-bold">{parkhausData.title}</h3>
      <p>Adresse: {parkhausData.address}</p>
      <p>Freie Plätze: {parkhausData.free}</p>
      <p>Gesamtkapazität: {parkhausData.total || 'Unbekannt'}</p>
      <p>Status: {parkhausData.status}</p>
      <a href={parkhausData.link} target="_blank" className="text-blue-500 underline">Mehr Infos</a>
    </div>
  );
}

async function apiRequestParkhaus(parkhausName, setParkhausResponses, sendClientEvent) {

  /*const parkingPlaces = ["Elisabethen", "Steinen", "Storchen", "Bad. Bahnhof",
                         "Rebgasse", "Post Basel", "Centralbahn", "Bahnhof Süd",
                         "Anfos", "Messe", "Europe", "Claramatte",
                         "City", "Clarahuus", "Aeschen", "Kunstmuseum"];

  const options = {
    includeScore: true,
    keys: ['name'],
  };

  const fuse = new Fuse(parkingPlaces, options);

  let parkhausNameMatch = null;
  let results = null;

  if (parkhausName) {
    results = fuse.search(parkhausName);
    if (results.length > 0) {
      parkhausNameMatch = results[0].item; 
    } 
  }*/

  const baseUrl = "https://data.bs.ch/api/explore/v2.1/catalog/datasets/100088/records?limit=20";
  const url = parkhausName ? `${baseUrl}&refine=title%3A"Parkhaus%20${encodeURIComponent(parkhausName)}"` : baseUrl;

  try {
    console.log("➵ Fetching data from:", url);
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Error during the data call: ${response.statusText}`);

    const data = await response.json();
    console.log("✓ Data received:", data);
    setParkhausResponses(data.total_count === 0 ? [] : data.results);
    if (!parkhausName) {
      sendClientEvent({
        type: "conversation.item.create",
        item: {
          type: "message",
          role: "user",
          content: [
            {
              type: "input_text",
              text: `The parking situation is as follows: ${data.results}. Can you describe the provided parking results for me?`,
            },
          ],
        },              
      });
    } else {
      sendClientEvent({
        type: "conversation.item.create",
        item: {
          type: "message",
          role: "system",
          content: [
            {
              type: "input_text",
              text: `The parking at ${parkhausName} is as follows: Freie Plätze: ${data.results.free}, Gesamtkapazität: ${data.results.total}, Adresse: ${data.results.address}, Status: ${data.results.status}. Can you describe the provided parking results for me?`,
            },
          ],
        },              
      });
    }   

    sendClientEvent({
      type: "response.create",
      response: {
        instructions: "Describe the parking results provided.",
      },
    });

  } catch (error) {
    console.error("〤 An error during the API request:", error);
  }
}

export default function ParkhausPanel({ isSessionActive, events, sendClientEvent }) {
  const [parkhausResponses, setParkhausResponses] = useState([]);

  useEffect(() => {
    if (!events || events.length === 0) return;

    const mostRecentEvent = events[0];

    if (mostRecentEvent.type === "response.done" && mostRecentEvent.response.output) {
      mostRecentEvent.response.output.forEach((output) => {
        if (output.type === "function_call" && output.name === "display_parking_availability") {
          let parkhausName = null;

          try {
            const parsedArgs = JSON.parse(output.arguments);
            parkhausName = parsedArgs.parkhausName;
            console.log("➵ Parkhaus Name:", parkhausName);
          } catch (error) {
            console.error("〤 Error parsing Parkhaus Name response:", error);
          }

          apiRequestParkhaus(parkhausName, setParkhausResponses, sendClientEvent);
        }
      });
    }
  }, [events]);


  useEffect(() => {
    if (!isSessionActive) {
      setParkhausResponses([]);
    }
  }, [isSessionActive]);

  return (
    <section className="h-full w-full flex flex-col gap-4">
      <div className="h-full bg-gray-50 rounded-md p-4 overflow-y-auto">
        <h2 className="text-lg font-bold">🅿️ Parkhaus Verfügbarkeit</h2>
        {isSessionActive ? (
          parkhausResponses.length > 0 ? (
            parkhausResponses.map((data, index) => <ParkhausOutput key={index} parkhausData={data} />)
          ) : (
            <p>Frage nach einem Parkhaus, um die Verfügbarkeit zu sehen.</p>
          )
        ) : (
          <p>Starten Sie die Sitzung, um dieses Tool zu aktivieren.</p>
        )}
      </div>
    </section>
  );
}
