import { useEffect, useState } from "react";

const functionDescription5 = `
Call this function when a user asks for a text output; asks to display / write / show something.
`;

const imageSessionUpdate = {
  type: "session.update",
  session: {
    tools: [
      {
        type: "function",
        name: "display_image",
        description: functionDescription5,
        parameters: {
          type: "object",
          strict: true,
          properties: {
            text: {
              type: "string",
              description: "Text output required by the user.",
            },
          },
          required: ["text"],
        },
      },
    ],
    tool_choice: "auto",
  },
};

export default function ImagePanel({
  isSessionActive,
  sendClientEvent,
  events,
}) {
  return (
    <section className="h-full w-full flex flex-col gap-4">
      <div className="h-full bg-gray-50 rounded-md p-4">
        <h2 className="text-lg font-bold">Bild Tool</h2>
        {isSessionActive ? (
            <p>Die Textausgabe erscheint hier, wenn Sie sie anfordern.</p>
          ) : (
          <p>Starten Sie die Sitzung um dieses Tool zu verwenden.</p>
        )}
      </div>
    </section>
  );
}