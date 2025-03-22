// Event.jsx
import { ArrowUp, ArrowDown } from "react-feather";
import { useState } from "react";
import "./Event.css"; // oder eigenes CSS, wenn du trennst

export function getEventColor(event) {
    const t = event.type;
  
    // ✅ Funktion im Output (Tool-Aufruf durch GPT)
    const isFunctionCall = event?.response?.output?.some?.((o) => o.type === "function_call");
    if (isFunctionCall) return "green";
  
    // ✅ Farbzuordnung nach Event-Typ
    switch (t) {
      case "response.done": return "#2196f3";                    // Blau
      case "response.output_item.done": return "#4caf50";        // Grün
      case "response.audio_transcript.done": return "#3f51b5";   // Dunkelblau
      case "response.audio.done": return "#000000";              // Schwarz
      case "response.audio_transcript.delta": return "#9c27b0";  // Lila
      case "output_audio_buffer.started": return "#ff9800";      // Orange
      case "response.content_part.done": return "#ffeb3b";       // Gelb
      case "response.content_part.added": return "#ffc107";      // Gold
      case "conversation.item.created": return "#607d8b";        // Grau-Blau
      case "response.output_item.added": return "#03a9f4";       // Hellblau
      case "rate_limits.updated": return "#795548";              // Braun
      case "response.created": return "#00bcd4";                 // Cyan
      case "media.track.start": return "orange";                 // Lokales Audio startet
      default: return "gray";                                    // Unbekannt
    }
}

export default function Event({ event, timestamp }) {
    const [isExpanded, setIsExpanded] = useState(false);
    const isClient = event.event_id && !event.event_id.startsWith("event_");

    const color = getEventColor(event); // 🎯 Farbcode bestimmen

    return (
        <div className="event-container" style={{ borderLeft: `4px solid ${color}` }}>
            <div
            className="event-header"
            onClick={() => setIsExpanded(!isExpanded)}
            >
            {isClient ? (
                <ArrowUp className="icon server" />
            ) : (
                <ArrowDown className="icon client" />
            )}
            <div className="event-meta">
                {isClient ? "client:" : "server:"} {event.type} | {timestamp}
            </div>
            </div>
            <div className={`event-body ${isExpanded ? "expanded" : "collapsed"}`}>
            <pre className="event-json">{JSON.stringify(event, null, 2)}</pre>
            </div>
        </div>
    );
}