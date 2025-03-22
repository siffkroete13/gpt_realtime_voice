// Event.jsx
import { ArrowUp, ArrowDown } from "react-feather";
import { useState } from "react";
import "./Event.css"; // oder eigenes CSS, wenn du trennst

export function getEventColor(event, allEvents = []) {
    const isText = event?.response?.output?.some?.((o) => o.type === "text");
    const isFunctionCall = event?.response?.output?.some?.((o) => o.type === "function_call");

    // 🟢 Function Call → grün
    if (isFunctionCall) return "green";

    // 🟣 Text + Audio (zeitlich nahe beieinander)
    if (isText && event.timestamp) {
        const t1 = new Date(event.timestamp).getTime();

        const audioNearby = allEvents.some((e) =>
            e.type === "media.track.start" &&
            e.timestamp &&
            Math.abs(new Date(e.timestamp).getTime() - t1) <= 300
        );

        if (audioNearby) return "purple"; // Text + Audio (Ist zwar nur Text aber von Audio begleitet, darum beides sozusagen)
        return "blue"; // 🔵 Nur Text
    }

    // 🟠 Nur Audio-Event (manuell gesetzt)
    if (event.type === "media.track.start") return "orange";

    // ⚪️ Sonstige Events
    return "gray";
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