import "./EventLog.css"

import Event from "./Event.jsx"

export default function EventLog({ events }) {
  const eventsToDisplay = [];
  let deltaEvents = {};



  events.forEach((event) => {

    if (event.type.endsWith("delta")) {
      if (deltaEvents[event.type]) {
        // for now just log a single event per render pass
        return;
      } else {
        deltaEvents[event.type] = event;
      }
    }

    eventsToDisplay.push(
      <Event
        key={event.event_id || Math.random()}
        event={event}
        allEvents={events} // ⬅️ wichtig: gesamte Liste übergeben, eigentlich nicht nötig, nur für Fraben, also nur Luxus
        timestamp={new Date().toLocaleTimeString()}
      />,
    );
  });

  return (
    <div className="event-log">
      {events.length === 0 ? (
        <div className="event-placeholder">Awaiting events...</div>
      ) : (
        eventsToDisplay
      )}
    </div>
  );
}
