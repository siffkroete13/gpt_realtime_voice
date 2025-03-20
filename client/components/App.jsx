import { useEffect, useRef, useState } from "react"; 
import logo from "/assets/openai-logomark.svg";
import EventLog from "./EventLog";
import SessionControls from "./SessionControls";

/*========================================== Funktionen importieren: */

import TextPanel from "./TextPanel";
import ColorPanel from "./ColorPanel";

import MapPanel from "./MapPanel";
import ParkhausPanel from "./ParkhausPanel";

/* import MemoryPanel from "./MemoryPanel";
import ImagePanel from "./ImagePanel"; */

export default function App() {
  console.log('Hi Welt!!!!')
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [events, setEvents] = useState([]);
  const [dataChannel, setDataChannel] = useState(null);
  const peerConnection = useRef(null);
  const audioElement = useRef(null); 

  async function addAudioTrackFromFile(pc, audioFileUrl) {
    const audioCtx = new AudioContext();
    const response = await fetch(audioFileUrl);
    const arrayBuffer = await response.arrayBuffer();
    const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
    const source = audioCtx.createBufferSource();
    source.buffer = audioBuffer;
  
    const destination = audioCtx.createMediaStreamDestination();
    source.connect(destination);
    source.start();
  
    const track = destination.stream.getAudioTracks()[0];
    pc.addTrack(track);
  }

  

  async function startSession() {
<<<<<<< HEAD
    
=======
    // Get a session token for OpenAI Realtime API
>>>>>>> 059bf8d27a74b4d4e6e3d247ff6a484c2337e182
    const tokenResponse = await fetch("/token");
    const data = await tokenResponse.json();
    const EPHEMERAL_KEY = data.client_secret.value; 
  
    const pc = new RTCPeerConnection();
  
    audioElement.current = document.createElement("audio");
    audioElement.current.autoplay = true;
    pc.ontrack = (e) => (audioElement.current.srcObject = e.streams[0]);
    
    // Mikrofon durch Audio-Datei ersetzen:
    await addAudioTrackFromFile(pc, '/assets/audio/mock-input.mp3');
  
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

    console.log('Antwort eingetroffen')
    await pc.setRemoteDescription(answer);
  
    peerConnection.current = pc;
  }


  // Stop current session, clean up peer connection and data channel
  function stopSession() {
    if (dataChannel) {
      dataChannel.close();
    }

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

  // Send a message to the model
  function sendClientEvent(message) {
    console.log('Send client event aufgerufen')
    if (dataChannel) {
      const timestamp = new Date().toLocaleTimeString();
      message.event_id = message.event_id || crypto.randomUUID();

      // send event before setting timestamp since the backend peer doesn't expect this field
      dataChannel.send(JSON.stringify(message));

      // if guard just in case the timestamp exists by miracle
      if (!message.timestamp) {
        message.timestamp = timestamp;
      }
      setEvents((prev) => [message, ...prev]);
    } else {
      console.error(
        "Failed to send message - no data channel available",
        message,
      );
    }
  }

  // Send a text message to the model
  function sendTextMessage(message) {
    const event = {
      type: "conversation.item.create",
      item: {
        type: "message",
        role: "user",
        content: [
          {
            type: "input_text",
            text: message,
          },
        ],
      },
    };

    sendClientEvent(event);
    sendClientEvent({ type: "response.create" });
  }

  const toolRegistrations = {
    type: "session.update",
    session: {
      tools: [
        {
          type: "function",
          name: "display_text",
          description: "Call this function when a user asks for a text output; asks to display / write / show something.",
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
          description: "Call this function to check parking availability in Basel.",
          parameters: {
            type: "object",
            strict: true,
            properties: {
              parkhausName: {
                type: "string",
                description: "Name of the parking facility (optional, if omitted returns all facilities).",
                nullable: true,
              },
            },
          },
        },
        /*{
          type: "function",
          name: 'set_memory',
          description: 'Saves important data about the user into memory.',
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
        },*/       
      ],

      tool_choice: "auto",
    },
  };

  // Send tool registrations when session starts
  useEffect(() => {
    if (isSessionActive) {
      sendClientEvent(toolRegistrations);
    }
  }, [isSessionActive]);


  // Attach event listeners to the data channel when a new one is created
  useEffect(() => {
    if (dataChannel) {
      // Append new server events to the list
      dataChannel.addEventListener("message", (e) => {
<<<<<<< HEAD
        const eventData = JSON.parse(e.data);
        console.log("Event vom Server erhalten:", eventData);

        // ACHTUNG: prüfe explizit auf erkannte Texte oder Antworten!
        if (eventData.type.includes("message") || eventData.type.includes("speech")) {
          console.log("✅ Sprach- oder Text-Event:", eventData);
        }

        setEvents((prev) => [JSON.parse(e.data), ...prev]);
=======
        const event = JSON.parse(e.data);
        if (!event.timestamp) {
          event.timestamp = new Date().toLocaleTimeString();
        }

        setEvents((prev) => [event, ...prev]);
>>>>>>> 059bf8d27a74b4d4e6e3d247ff6a484c2337e182
      });

      // Set session active when the data channel is opened
      dataChannel.addEventListener("open", () => {
        console.log("DataChannel geöffnet");
      
        setIsSessionActive(true);
        setEvents([]);
      });
    }
  }, [dataChannel]);

  return (
    <>
      <nav className="absolute top-0 left-0 right-0 h-16 flex items-center">
        <div className="flex items-center gap-4 w-full m-4 pb-2 border-0 border-b border-solid border-gray-200">
          <img style={{ width: "24px" }} src={logo} />
          <h1>realtime console</h1>
        </div>
      </nav>
      <main className="absolute top-16 left-0 right-0 bottom-0">
        <section className="absolute top-0 left-[580px] right-[750px] bottom-0 flex">
          <section className="absolute top-0 left-0 right-0 bottom-32 px-4 overflow-y-auto">
            <EventLog events={events} />
          </section>
          <section className="absolute h-32 left-0 right-0 bottom-0 p-4">
            <SessionControls
              startSession={startSession}
              stopSession={stopSession}
              sendClientEvent={sendClientEvent}
              sendTextMessage={sendTextMessage}
              events={events}
              isSessionActive={isSessionActive}
            />
          </section>
        </section>
        <section className="absolute top-0 w-[580px] bottom-0 p-4 pt-0 overflow-y-auto">
          <TextPanel
            sendClientEvent={sendClientEvent}
            sendTextMessage={sendTextMessage}
            events={events}
            isSessionActive={isSessionActive}
          />
        </section>
        <section className="absolute top-0 w-[380px] right-0 bottom-[280px] p-4 pt-0 overflow-y-auto">
          <ParkhausPanel
            sendClientEvent={sendClientEvent}
            sendTextMessage={sendTextMessage}
            events={events}
            isSessionActive={isSessionActive}
          />
        </section>   
        <section className="absolute top-0 w-[380px] right-[370px] bottom-[380px] p-4 pt-0 overflow-y-auto">
          <MapPanel
            sendClientEvent={sendClientEvent}
            sendTextMessage={sendTextMessage}
            events={events}
            isSessionActive={isSessionActive}
          />
        </section>
       
         <section className="absolute bottom-0 w-[380px] right-0 top-[625px] p-4 pt-0 overflow-y-auto">
         <ColorPanel
            sendClientEvent={sendClientEvent}
            sendTextMessage={sendTextMessage}
            events={events}
            isSessionActive={isSessionActive}
          />
        </section> 
        {/*<section className="absolute bottom-0 w-[380px] right-[370px] top-[525px] p-4 pt-0 overflow-y-auto">
          <ImagePanel
            sendClientEvent={sendClientEvent}
            sendTextMessage={sendTextMessage}
            events={events}
            isSessionActive={isSessionActive}
          />
        </section> */}
      </main>
    </>
  );
}
