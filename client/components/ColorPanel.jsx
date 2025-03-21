import { useEffect, useState } from "react";
import "./ColorPanel.css"

function ColorCallOutput({ theme, colors }) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-lg">Thema: {theme}</p>
      <div className="grid grid-cols-5 gap-2">
        {colors.map((color) => (
          <div
            key={color}
            className="h-48 rounded-md flex items-center justify-center border border-gray-200"
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
  const [colorPalette, setColorPalette] = useState(null); // Set initial state to null

  useEffect(() => {
    if (!events || events.length === 0) return;

    const mostRecentEvent = events[0];
    if (mostRecentEvent.type === "response.done" && mostRecentEvent.response.output) {
      mostRecentEvent.response.output.forEach((output) => {
        if (output.type === "function_call" && output.name === "display_color_palette") {
          try {
            const { theme, colors } = JSON.parse(output.arguments);
            // Update the colorPalette state as an object with both theme and colors
            setColorPalette({ theme, colors });
            console.log("✓ AI Color Palette Received:", theme, colors);
          } catch (error) {
            console.error("〤 Error parsing AI response:", error);
          }
        }
      });
    }
  }, [events]);

  useEffect(() => {
    if (!isSessionActive) {
      setColorPalette(null); // Reset the color palette when session ends
    }
  }, [isSessionActive]);

  return (
    <section className="color-panel">
      <div className="color-panel-inner">
        <h2 className="color-panel-title">🎨 Farbpalette Tool</h2>
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
