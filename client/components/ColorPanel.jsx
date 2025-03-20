import { useEffect, useState } from "react";

function ColorCallOutput({ theme, colors }) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-lg font-semibold">Thema: {theme}</p>
      <div className="grid grid-cols-5 gap-2">
        {colors.map((color) => (
          <div
            key={color}
            className="h-16 rounded-md flex items-center justify-center border border-gray-200"
            style={{ backgroundColor: color }}
          >
            <p className="text-sm font-bold text-black bg-slate-100 rounded-md p-2 border border-black">
              {color}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ColorPanel({ isSessionActive, events }) {
  const [colorPalette, setColorPalette] = useState(null);

  useEffect(() => {
    if (!events || events.length === 0) return;

    const mostRecentEvent = events[0];
    if (mostRecentEvent.type === "response.done" && mostRecentEvent.response.output) {
      mostRecentEvent.response.output.forEach((output) => {
        if (output.type === "function_call" && output.name === "display_color_palette") {
          try {
            const { theme, colors } = JSON.parse(output.arguments);
            setColorPalette({ theme, colors }); 
            console.log("AI Color Palette Received:", theme, colors);
          } catch (error) {
            console.error("Error parsing AI response:", error);
          }
        }
      });
    }
  }, [events]);

  useEffect(() => {
    if (!isSessionActive) {
      setColorPalette(null); 
    }
  }, [isSessionActive]);

  return (
    <section className="h-full w-full flex flex-col gap-4">
      <div className="h-full bg-gray-50 rounded-md p-4">
        <h2 className="text-lg font-bold">🎨 Farbpalette Tool</h2>
        {isSessionActive ? (
          colorPalette ? (
            <ColorCallOutput theme={colorPalette.theme} colors={colorPalette.colors} />
          ) : (
            <p>Sagen Sie „Gib mir eine Farbpalette“, um eine zu generieren.</p>
          )
        ) : (
          <p>Starten Sie die Sitzung, um dieses Tool zu verwenden.</p>
        )}
      </div>
    </section>
  );
}
