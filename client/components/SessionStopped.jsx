// SessionStopped.jsx
import { useState } from "react";
import { CloudLightning } from "react-feather";
import Button from "./Button";
import "./SessionControls.css";

export default function SessionStopped({ startSession }) {
  const [isActivating, setIsActivating] = useState(false);

  function handleStartSession() {
    if (isActivating) return;
    setIsActivating(true);
    startSession();
  }

  return (
    <div className="session-stopped">
      <Button
        onClick={handleStartSession}
        className={isActivating ? "gray" : "red"}
        icon={<CloudLightning height={16} />}
      >
        {isActivating ? "Sitzung wird gestartet..." : "Sitzung starten"}
      </Button>
    </div>
  );
}