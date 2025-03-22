import { useEffect, useRef, useState } from "react"; 
import "./App.css"; // ✅ CSS direkt nach React importieren
import logo from "/assets/openai-logomark.svg";
import EventLog from "./EventLog";  
import SessionControls from "./SessionControls"  

import TextPanel from "./TextPanel";  
import ColorPanel from "./ColorPanel";  
import MapPanel from "./MapPanel";  
import ParkingPanel from "./ParkhausPanel";  
import MemoryPanel from "./MemoryPanel";  

function createSilentAudioTrack() {
    const ctx = new AudioContext();
    const oscillator = ctx.createOscillator();
    const dst = oscillator.connect(ctx.createMediaStreamDestination());
    oscillator.start();
    const track = dst.stream.getAudioTracks()[0];
    return track;
}

export default function App() {
    // Status-Hooks zum Verwalten des Sitzungsstatus, der Ereignisprotokolle und des Datenkanals
    const [isSessionActive, setIsSessionActive] = useState(false);
    const [events, setEvents] = useState([]);  // Speichert die Ereignisse, die verarbeitet und angezeigt werden
    const [dataChannel, setDataChannel] = useState(null);  // Hält den WebRTC-Datenkanal für die Kommunikation
    const peerConnection = useRef(null);  // Erstellt einen Verweis für das RTCPeerConnection-Objekt
    const audioElement = useRef(null); 


    // ========================================================= Start der Sitzung und Herstellen der WebRTC-Verbindungen 

    async function startSession() {
       
        // console.log("➵ Starting session.");

        // Abrufen des Authentifizierungstokens vom Server, um sich mit der OpenAI-API zu authentifizieren
        const tokenResponse = await fetch("/token");
        const data = await tokenResponse.json();
        const EPHEMERAL_KEY = data.client_secret.value;  // Extrahieren des Tokens 

        // Erstellen eines neuen RTCPeerConnection-Objekts für WebRTC
        const pc = new RTCPeerConnection();

        // Erstellen eines Audioelements zum Abspielen der Remote-Audiospur
        audioElement.current = document.createElement("audio");
        audioElement.current.autoplay = true;

        pc.ontrack = (e) => {
            audioElement.current.srcObject = e.streams[0]; // Einrichten des Audiostreams
          
            // 🔧 Deine Hilfsmarkierung damit ich auch einen Event sehe wenn Audio kommt
            const audioEvent = {
              type: "media.track.start",
              media: ["audio"],
              timestamp: new Date().toISOString(),
            };
            setEvents((prev) => [audioEvent, ...prev]);
        };  
        
        // Erfassen die Mikrofoneingabe des lokalen Benutzers
        const ms = await navigator.mediaDevices.getUserMedia({audio: true,  });
        pc.addTrack(ms.getTracks()[0]);  // Hinzufügen der lokalen Audiospur zur Peer-Verbindung 
        

        // Einrichten des Datenkanals für die Kommunikation mit dem Server
        const dc = pc.createDataChannel("oai-events");  
        setDataChannel(dc);  // Im Status-Hook speichern

        // Start der WebRTC-Sitzung mit dem SDP-Protokoll
        const offer = await pc.createOffer();  // Erstellen eines Angebots zum Starten der Verbindung
        await pc.setLocalDescription(offer);  // Festlegen der lokalen Beschreibung 

        const baseUrl = "https://api.openai.com/v1/realtime"; 
        const model = "gpt-4o-realtime-preview-2024-12-17";  
        const sdpResponse = await fetch(`${baseUrl}?model=${model}`, {
            method: "POST",  
            body: offer.sdp,  // Anhängen des SDP-Angebots an die Anfrage
            headers: {
            Authorization: `Bearer ${EPHEMERAL_KEY}`,  
            "Content-Type": "application/sdp",  
            },
        });

        const answer = {
            type: "answer",  
            sdp: await sdpResponse.text(),  
        };

        await pc.setRemoteDescription(answer);  

        peerConnection.current = pc;  
    }

    async function startTextOnlySession() {
        // console.log("➵ Starting text-only session.");
      
        const tokenResponse = await fetch("/token");
        const data = await tokenResponse.json();
        const EPHEMERAL_KEY = data.client_secret.value;
      
        const pc = new RTCPeerConnection();
      
        // ✅ Stummen Track erzeugen und hinzufügen
        const silentTrack = createSilentAudioTrack();
        pc.addTrack(silentTrack);
      
        // 📡 Nur DataChannel – keine Audio-Spuren
        const dc = pc.createDataChannel("oai-events");
        setDataChannel(dc);
      
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
      
        const baseUrl = "https://api.openai.com/v1/realtime";
        const model = "gpt-4o-realtime-preview-2024-12-17";
        const sdpResponse = await fetch(`${baseUrl}?model=${model}`, {
          method: "POST",
          body: offer.sdp,
          headers: {
            Authorization: `Bearer ${EPHEMERAL_KEY}`,
            "Content-Type": "application/sdp",
          },
        });
      
        const answer = {
          type: "answer",
          sdp: await sdpResponse.text(),
        };
      
        try {
          await pc.setRemoteDescription(answer);
          peerConnection.current = pc;
        } catch (err) {
          console.error("✖️ Failed to set remote description:", err);
          alert("❌ Text-only mode is not supported without an audio track. See console.");
        }
    }
      


    // ============================================== Beenden der aktuellen Sitzung und Bereinigen von WebRTC-Verbindungen und dem Datenkanal

    function stopSession() {
        console.log("➵ Stopping session.");

        if (dataChannel) {
            dataChannel.close(); 
        }

        // Stopp der Sie alle Medienspuren (Audiospuren) von der Peer-Verbindung
        peerConnection.current.getSenders().forEach((sender) => {
            if (sender.track) {
                sender.track.stop();  
            }
        });

        if (peerConnection.current) {
            peerConnection.current.close(); 
        }

        setIsSessionActive(false);
        setDataChannel(null); 
        peerConnection.current = null;
    }


    // =============================================================== Funktion zum Senden von Ereignissen an das Modell über den Datenkanal

    function sendClientEvent(message) {
        // console.log("➵ Sending client event:", message);

        if (dataChannel) {
            message.event_id = message.event_id || crypto.randomUUID();  // Sicherstellen, dass jede Nachricht über eine eindeutige Ereignis-ID verfügt
            dataChannel.send(JSON.stringify(message)); 
            setEvents((prev) => [message, ...prev]);  // Add the message to the events log
        } else {
            console.error("〤 Failed to send message - no data channel available", message);  
        }
    }


    // =============================================================== Funktion zum Senden einer Textnachricht an das Modell

    function sendTextMessage(text_message) {
        // console.log("➵ Sending text message:", text_message);

        const event = {
            type: "conversation.item.create",
            item: {
            type: "message",
            role: "user",
            content: [
                {
                type: "input_text", 
                text: text_message,  
                },
            ],
            },
        };

        sendClientEvent(event); // Zuerst wird eine Textnachricht an das Model gesendet 
        sendClientEvent({ type: "response.create" }); // Danach wird um eine Antwort gebeten
    }


    // ================================================================== Werkzeugregistrierungen für verfügbare Funktionen

    const toolRegistrations = {
    type: "session.update",
        session: {
            tools: [
            {
                type: "function",
                name: "display_text",
                description: "Call this function when a user asks for a text output; asks to display / write something down. ",
                parameters: {
                type: "object",
                strict: true,
                properties: {
                    text: {
                    type: "string",
                    description: "Text output required by the user.",
                    },
                },
                required: ["text"],
                },
            },
            {
                type: "function",
                name: "display_color_palette",
                description: "Call this function when a user asks for a color palette.",
                parameters: {
                type: "object",
                strict: true,
                properties: {
                    theme: {
                    type: "string",
                    description: "Description of the theme for the color scheme.",
                    },
                    colors: {
                    type: "array",
                    description: "Array of five hex color codes based on the theme.",
                    items: {
                        type: "string",
                        description: "Hex color code",
                    },
                    },
                },
                required: ["theme", "colors"],
                },
            },
            {
                type: "function",
                name: "display_weather",
                description: "Call this function when a user asks about the weather in a region/city etc.",
                parameters: {
                type: "object",
                strict: true,
                properties: {
                    lat: { type: "number", description: "Latitude" },
                    lng: { type: "number", description: "Longitude" },
                    location: { type: "string", description: "Name of the location" },
                },
                required: ["lat", "lng", "location"],
                },
            }, 
            {
                type: "function",
                name: "display_parking_availability",
                description: "Call this function to check parking availability in the place user specifies.",
                parameters: {
                type: "object",
                strict: true,
                properties: {
                    parkhausName: {
                    type: "string",
                    description: "Name of the parking facility (optional, if omitted returns all facilities).",
                    enum: ["Elisabethen", "Steinen", "Storchen", "Bad. Bahnhof",
                                "Rebgasse", "Post Basel", "Centralbahn", "Bahnhof Süd",
                                "Anfos", "Messe", "Europe", "Claramatte",
                                "City", "Clarahuus", "Aeschen", "Kunstmuseum"],
                    nullable: true,
                    },
                },
                },
            },
            {
                type: "function",
                name: 'set_memory',
                description: 'Call this function to memorise something the user would like you to memorise.',
                parameters: {
                type: 'object',
                properties: {
                    key: {
                    type: 'string',
                    description:
                        'The key of the memory value. Always use lowercase and underscores, no other characters.',
                    },
                    value: {
                    type: 'string',
                    description: 'Value can be anything represented as a string',
                    },
                },
                required: ['key', 'value'],
                },
            },      
            ],

            tool_choice: "auto",
        },
    };

    // Registrieren von Werkzeugen mit dem Modell, wenn die Sitzung gestartet wird
    useEffect(() => {
        if (isSessionActive) {
            // console.log("➵ Registering tools with the model.");
            sendClientEvent(toolRegistrations);  
        }
    }, [isSessionActive]);


    // ========================================================= Anfügen von Ereignis-Listenern an den Datenkanal, wenn ein neuer Listener erstellt wird

    useEffect(() => {
        if (dataChannel) {
            // Anfügen neuer Serverereignisse an das Ereignisprotokoll
            dataChannel.addEventListener("message", (e) => {
                console.log("Data Channel Event bekommen");
                setEvents((prev) => [JSON.parse(e.data), ...prev]); // Hinzufügen von Ereignisdaten zur Liste
            });

           
            // Sitzung beim Öffnen des Datenkanals aktivieren
            dataChannel.addEventListener("open", () => {
                // console.log("✓ Data channel opened. Session is active.");
                setIsSessionActive(true);
                setEvents([]);
            });
        }
    }, [dataChannel]);


    // ======================================================== Initialisieren des Speichers zu Beginn der Sitzung, wenn er zuvor gespeichert wurde

    useEffect(() => {
        // localStorage.setItem("ai_memory", "Sprich bitte Deutsch mit mir.");
        if (isSessionActive) {
            const savedMemory = localStorage.getItem("ai_memory");  // Abrufen von Arbeitsspeicher aus localStorage

            if (savedMemory) {
                const memory_package = {
                    type: "conversation.item.create",
                    item: {
                        type: "message",
                        role: "user",
                        content: [
                            {
                            type: "input_text",
                            text: `Reminder: ${savedMemory}`,
                            },
                        ],
                    },
                };

                sendClientEvent(memory_package);
            }
        }
    }, [isSessionActive]);

    // ============================================================== HTML-Ausgabe und die Panel-Anrufung unten:

  return (
  
    <div className="app-container">
        <nav className="navbar">
        <div className="navbar-content">
            <img src={logo} alt="OpenAI" className="logo" />
            <h1>Realtime Konsole</h1>
        </div>
        </nav>

        <main className="main-layout">
        <aside className="left-panel">
            <TextPanel
                sendClientEvent={sendClientEvent}
                sendTextMessage={sendTextMessage}
                events={events}
                isSessionActive={isSessionActive}
            />
        </aside>

        <section className="center-panel">
           
            <EventLog events={events} />
            
            <SessionControls
                startSession={startSession}
                startTextOnlySession={startTextOnlySession}
                stopSession={stopSession}
                sendClientEvent={sendClientEvent}
                sendTextMessage={sendTextMessage}
                events={events}
                isSessionActive={isSessionActive}
            />
            
        </section>

        <aside className="right-panel">
            <div className="panel-item">
            <MapPanel
                sendClientEvent={sendClientEvent}
                sendTextMessage={sendTextMessage}
                events={events}
                isSessionActive={isSessionActive}
            />
            </div>
            <div className="panel-item">
            <ParkingPanel
                sendClientEvent={sendClientEvent}
                sendTextMessage={sendTextMessage}
                events={events}
                isSessionActive={isSessionActive}
            />
            </div>
            <div className="panel-item">
            <ColorPanel
                sendClientEvent={sendClientEvent}
                sendTextMessage={sendTextMessage}
                events={events}
                isSessionActive={isSessionActive}
            />
            </div>
            <div className="panel-item">
            <MemoryPanel
                sendClientEvent={sendClientEvent}
                sendTextMessage={sendTextMessage}
                events={events}
                isSessionActive={isSessionActive}
            />
            </div>
        </aside>
        </main>
    </div>
    );
}
