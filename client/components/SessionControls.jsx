// SessionControls.jsx
import SessionStopped from "./SessionStopped";
import SessionActive from "./SessionActive";
import "./SessionControls.css";

export default function SessionControls({
  startSession,
  startTextOnlySession,
  stopSession,
  sendClientEvent,
  sendTextMessage,
  serverEvents,
  isSessionActive,
}) {
  return (
    <div className="session-controls">
      {isSessionActive ? (
        <SessionActive
          stopSession={stopSession}
          sendClientEvent={sendClientEvent}
          sendTextMessage={sendTextMessage}
          serverEvents={serverEvents}
        />
      ) : (
        <SessionStopped 
            startSession={startSession}
            startTextOnlySession={startTextOnlySession}
        />
      )}
    </div>
  );
}