// SessionActive.jsx
import { useState } from "react";
import { CloudOff, MessageSquare } from "react-feather";
import Button from "./Button";
import "./SessionControls.css";

export default function SessionActive({ stopSession, sendTextMessage }) {
  const [message, setMessage] = useState("");

  function handleSendClientEvent() {
    sendTextMessage(message);
    setMessage("");
  }

  return (
    <div className="session-active">
      <input
        onKeyDown={(e) => {
          if (e.key === "Enter" && message.trim()) {
            handleSendClientEvent();
          }
        }}
        type="text"
        placeholder="Textnachricht senden..."
        className="session-input"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
      />
      <Button
        onClick={() => {
          if (message.trim()) {
            handleSendClientEvent();
          }
        }}
        icon={<MessageSquare height={16} />}
        className="blue"
      >
        schicken
      </Button>
      <Button onClick={stopSession} icon={<CloudOff height={16} />}>
        trennen
      </Button>
    </div>
  );
}