// Event.jsx
import { ArrowUp, ArrowDown } from "react-feather";
import { useState } from "react";
import "./Event.css"; // oder eigenes CSS, wenn du trennst


export function getEventColor(event) {
    const t = event.type;
  
    // ❗️Transcript ist null?
    const hasNullTranscript = event?.item?.content?.some?.((c) => c.type === "input_audio" && (!c.transcript || c.transcript == "") );
  
    if (hasNullTranscript) return "transcript-null";
  
    // ✅ Nur grün, wenn im response.output ein function_call enthalten ist (z. B. bei response.done)
    const isFunctionCall =
      event?.response?.output?.some?.((o) => o.type === "function_call") ||
      event?.item?.type === "function_call";
  
    if (isFunctionCall) return "green";
    
    // 🔀 Farbzuordnung nach event.type
    switch (t) {
        case "response.done": return "#2196f3";
        case "response.output_item.done":
        if (event?.item?.content?.some?.((c) => c.type === "audio")) return "#000000";
        if (event?.item?.content?.some?.((c) => c.type === "text")) return "#3f51b5";
        return "#4caf50";
        case "response.audio_transcript.done": return "#3f51b5";
        case "response.audio.done": return "#000000";
        case "response.audio_transcript.delta": return "#9c27b0";
        case "output_audio_buffer.started": return "#ff9800";
        case "response.content_part.done": return "#ffeb3b";
        case "response.content_part.added": return "#ffc107";
        case "conversation.item.created": return "#607d8b";
        case "response.output_item.added": return "#03a9f4";
        case "rate_limits.updated": return "#795548";
        case "response.created": return "#00bcd4";
        case "media.track.start": return "orange";
        default: return "gray";
    }
}
  
export default function Event({ event, timestamp }) {
    const [isExpanded, setIsExpanded] = useState(false);
    const isClient = event.event_id && !event.event_id.startsWith("event_");

    // Zusatz: system-role bei Client-Events erkennen
    const isSystemEvent = isClient && event?.item?.role === "system";

    const color = getEventColor(event); // 🎯 Farbcode bestimmen
    const isTranscriptNull = color === "transcript-null";
    const bgColor = isTranscriptNull ? "#ffe6e6" : "white";

    return (
        <div
            className="event-container"
            style={{
                borderLeft: `4px solid ${color}`,
                backgroundColor: bgColor,
            }}
        >
            <div
                className="event-header"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                {isClient ? (
                    isSystemEvent ? (
                        <ArrowUp className="icon client-system" /> // dunkelgrün
                    ) : (
                        <ArrowUp className="icon client" /> // hellgrün
                    )
                ) : (
                    <ArrowDown className="icon server" />
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