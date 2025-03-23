export default function EventTranscript({ events }) {
    const result = [];
  
    for (let i = 0; i < events.length; i++) {
      const e = events[i];
  
      // 🟢 Benutzer-Nachrichten
      if (e.type === "conversation.item.create" && e.item?.role === "user") {
        const text = e.item.content?.find(c => c.type === "input_text")?.text;
        if (text) {
          result.push({ who: "user", text });
        }
      }
  
      // 🔵 GPT-Audio-Antwort (transcript kommt separat)
      if (e.type === "response.audio_transcript.done" && e.transcript) {
        result.push({ who: "assistant", text: e.transcript });
      }
  
      // 🔵 GPT-Text-Antwort (z. B. bei Text-Only-Mode)
      if (
        e.type === "response.output_item.done" &&
        e.item?.role === "assistant"
      ) {
        const transcript = e.item.content?.find(c => c.type === "audio")?.transcript;
        const text = e.item.content?.find(c => c.type === "text")?.text;
  
        if (transcript) result.push({ who: "assistant", text: transcript });
        if (text) result.push({ who: "assistant", text }); // falls GPT mal Text sendet
      }
  
      if (result.length >= 6) break; // begrenzen
    }
  
    return (
      <div style={{ padding: "1rem", fontSize: "0.95rem", backgroundColor: "#f0f4f8", borderRadius: "8px" }}>
        <h3 style={{ marginBottom: "0.5rem" }}>Letzte Unterhaltung</h3>
        {result.slice(0, 6).map((entry, i) => (
          <div key={i} style={{ color: entry.who === "user" ? "green" : "blue", marginBottom: "0.3rem" }}>
            {entry.who === "user" ? "🟢 Du:" : "🔵 GPT:"} {entry.text}
          </div>
        ))}
      </div>
    );
}
  