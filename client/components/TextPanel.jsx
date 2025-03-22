import { useEffect, useState } from "react";

function TextCallOutput({ text }) {
  return ( 
    <p
      style={{
        whiteSpace: "pre-wrap",  // Preserve whitespace and line breaks
        wordBreak: "break-word",  // Prevent text from overflowing
      }}
    >
      {text}
    </p>  
  );
}

export default function TextPanel({ isSessionActive, events }) {
  const [textCallOutputs, setTextCallOutputs] = useState([]);

  useEffect(() => {
    if (!events || events.length === 0) return;

    const mostRecentEvent = events[0];
    if (mostRecentEvent.type === "response.done" && mostRecentEvent.response.output) {
      mostRecentEvent.response.output.forEach((output) => {
        if (output.type === "function_call" && output.name === "display_text") {
          try {
            console.log("✓ JSON Response Received:", output.arguments);
            const { text } = JSON.parse(output.arguments);
            setTextCallOutputs((prev) => [...prev, text]); 
            console.log("✓ AI Response Received:", text);
          } catch (error) {
            console.error("〤 Error parsing AI response:", error);
          }
        }
      });
    }
  }, [events]);

  useEffect(() => {
    if (!isSessionActive) {
      setTextCallOutputs([]);
    }
  }, [isSessionActive]);

  return (
    <section className="text-panel">
      <div className="text-panel-content">
        <h2>✍️ Textausgabe</h2>
        {isSessionActive ? (
          textCallOutputs.length > 0 ? (
            textCallOutputs.map((text, index) => <TextCallOutput key={index} text={text} />)
          ) : (
            <p>Bitten Sie darum, etwas aufzuschreiben, und es wird hier erscheinen.</p>
          )
        ) : (
          <p>Starten Sie die Sitzung, um dieses Tool zu aktivieren.</p>
        )}
      </div>
    </section>
  );
  
}