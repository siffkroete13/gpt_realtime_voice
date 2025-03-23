import { useEffect, useState } from "react";

function TextCallOutput({ text }) {
    return ( 
        <p
            style={{
                whiteSpace: "pre-wrap",     // Preserve whitespace and line breaks
                wordBreak: "break-word",    // Prevent text from overflowing
            }}
        >
            {text}
        </p>
    );
}

function TranscriptOutput({entry}) {
    return (
        <p
            style={{
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
                color: color,
                marginBottom: "0.5rem",
                fontStyle: "italic",
            }}
        >
            {entry.who === "user" ? "🟢 Du:" : entry.color === "purple" ? "🟣 GPT:" : "🔵 GPT:"} 
            {entry.text}
          
        </p>
    );
}

function extractTextOnFunctionCalling(e) {
    let result = '';

    // Hier wird bei function_call => display_text der Text extrahiert
    if (e.type === "response.done" && e.response.output) {
        e.response.output.forEach((output) => {
            if (output.type === "function_call" && output.name === "display_text") { // GPT möchte function_call?
                try {
                    console.log("✓ JSON Response Received:", output.arguments);
                    const { text } = JSON.parse(output.arguments); // Text wird extrahiert wenn function-call
                    result = text;
                    console.log("✓ AI Response Received:", text);
                } catch (error) {
                    console.error("〤 Error parsing AI response:", error);
                }
            }
        });
    }

    return result;
}

function extractTranscript(e) {
    const result = [];

    // 🟢 Deine Eingaben
    if (e.type === "conversation.item.create" && e.item?.role === "user") {
        const text = e.item.content?.find(c => c.type === "input_text")?.text;
        if (text) result.push({ who: "user", text, color: "green" });
    }

    // 🟣 GPT Audioantwort (Transkript)
    if (e.type === "response.audio_transcript.done" && e.transcript) {
        result.push({ who: "assistant", text: e.transcript, color: "purple" });
    }

    // 🔵 GPT Textantwort (nicht über Transkript)
    if (e.type === "response.output_item.done" && e.item?.role === "assistant") {
        const transcript = e.item.content?.find(c => c.type === "audio")?.transcript;
        const text = e.item.content?.find(c => c.type === "text")?.text;
        if (transcript) result.push({ who: "assistant", text: transcript, color: "purple" });
        if (text) result.push({ who: "assistant", text, color: "blue" });
    }

    return result;
}

export default function TextPanel({ isSessionActive, events }) {
    const [textCallOutputs, setTextCallOutputs] = useState([]);
    const [transcriptOutputs, setTranscriptOutputs] = useState([]);

    useEffect(() => {
        if (!events || events.length === 0) return;

        const mostRecentEvent = events[0];

        // Hier wird einerseits Text ausgegeben wenn GPT es möchte und andererseits die Transcription von Audio Dateien

        // Wenn GPT entscheidet, dass es die Funktion display_text aufrufen möchte, schickt es in einem response.done-Event einen function_call
        const text = extractTextOnFunctionCalling(mostRecentEvent);
        if(text) setTextCallOutputs((prev) => [...prev, text]); // Wenn GPT Text ausgeben möchte (per function_calling) dann geben wir Text aus

        // Transcript ausgeben, voice wird ja transcripiert in Text und den möchten wir sehen, zumindest für debug
        const transcript = extractTranscript(mostRecentEvent);
        if(transcript && transcript.text) setTranscriptOutputs( (prev) => [...prev, transcript]);
    }, [events]);

    useEffect(() => {
        if (!isSessionActive) {
            setTextCallOutputs([]);
        }
    }, [isSessionActive]);

    return (
        <section className="text-panel">
            <div className="text-panel-content">
                <h2>✍️ Text-Ausgabe</h2>
                {
                    isSessionActive ? (
                    
                        textCallOutputs.length > 0 ? (
                            textCallOutputs.map((text, index) => <TextCallOutput key={index} text={text} />)
                        ) : (
                            <p>Bitten Sie darum, etwas aufzuschreiben, und es wird hier erscheinen.</p>
                        )

                    ) : (
                        <p>Starten Sie die Sitzung, um dieses Tool zu aktivieren.</p>
                    )
                }

                <h2>✍️ Transcript-Ausgabe</h2>
                {
                    isSessionActive ? (
                    
                        transcriptOutputs.length > 0 ? (
                            transcriptOutputs.map((entry, i) => <TranscriptOutput key={i} entry={entry} />)
                        ) : (
                            <p>Bitten Sie darum, etwas aufzuschreiben, und es wird hier erscheinen.</p>
                        )

                    ) : (
                        <p>Starten Sie die Sitzung, um dieses Tool zu aktivieren.</p>
                    )
                }
            </div>
        </section>
    );
}