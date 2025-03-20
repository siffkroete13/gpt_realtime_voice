import { useEffect, useState } from "react";

function TextCallOutput({ text }) {
  return (
    <div className="flex flex-col gap-2">
      <p>KI-Ausgabe: {text}</p>
    </div>
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
            const { text } = JSON.parse(output.arguments);
            setTextCallOutputs((prev) => [...prev, text]); 
            console.log("AI Response Received:", text);
          } catch (error) {
            console.error("Error parsing AI response:", error);
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
    <section className="h-full w-full flex flex-col gap-4">
      <div className="h-full bg-gray-50 rounded-md p-4">
        <h2 className="text-lg font-bold">Textausgabe</h2>
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