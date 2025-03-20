import { useEffect, useState } from "react";

function MemoryDisplay({ memory }) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-lg font-semibold">Erinnerte Information:</p>
      <p className="p-2 bg-yellow-100 border border-yellow-300 rounded-md text-black">
        {memory}
      </p>
    </div>
  );
}

export default function MemoryPanel({ isSessionActive, events }) {
  const [memory, setMemory] = useState(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedMemory = localStorage.getItem("ai_memory");
      if (storedMemory) {
        setMemory(storedMemory);
      }
    }
  }, []);

  useEffect(() => {
    if (!events || events.length === 0) return;

    const mostRecentEvent = events[0];
    if (
      mostRecentEvent.type === "response.done" &&
      mostRecentEvent.response.output
    ) {
      mostRecentEvent.response.output.forEach((output) => {
        if (output.type === "function_call" && output.name === "set_memory") {
          try {
            const { text } = JSON.parse(output.arguments);
            if (text) {
              setMemory(text);

              if (typeof window !== "undefined") {
                localStorage.setItem("ai_memory", text);
              }
              console.log("✅ AI Memorized:", text);
            }
          } catch (error) {
            console.error("❌ Error parsing AI response:", error);
          }
        }
      });
    }
  }, [events]);

  return (
    <section className="h-full w-full flex flex-col gap-4">
      <div className="h-full bg-gray-50 rounded-md p-4">
        <h2 className="text-lg font-bold">🧠 Memory Tool</h2>
        {isSessionActive ? (
          memory ? (
            <MemoryDisplay memory={memory} />
          ) : (
            <p>Sagen Sie „Erinnere dich an...“, um eine Information zu speichern.</p>
          )
        ) : (
          <p>Starten Sie die Sitzung, um dieses Tool zu verwenden.</p>
        )}
      </div>
    </section>
  );
}
