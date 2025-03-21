// Event.jsx
import { ArrowUp, ArrowDown } from "react-feather";
import { useState } from "react";
import "./Event.css"; // oder eigenes CSS, wenn du trennst

export default function Event({ event, timestamp }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const isClient = event.event_id && !event.event_id.startsWith("event_");

  return (
    <div className="event-container">
      <div
        className="event-header"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {isClient ? (
          <ArrowDown className="icon client" />
        ) : (
          <ArrowUp className="icon server" />
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