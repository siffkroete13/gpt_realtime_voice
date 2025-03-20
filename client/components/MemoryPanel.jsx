import { useEffect, useState } from "react";

export default function MemoryPanel({
  isSessionActive,
  sendClientEvent,
  events,
}) {
  return (
    <section className="h-full w-full flex flex-col gap-4">
      <div className="h-full bg-gray-50 rounded-md p-4">
        <h2 className="text-lg font-bold">Erinnerung Tool</h2>
        {isSessionActive ? (
            <p>Die Textausgabe erscheint hier, wenn Sie sie anfordern.</p>
          ) : (
          <p>Starten Sie die Sitzung um dieses Tool zu verwenden.</p>
        )}
      </div>
    </section>
  );
}