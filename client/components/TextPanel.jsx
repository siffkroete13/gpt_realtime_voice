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
                color: entry.color,
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
                    console.log("✓ AI Text Response Received:", text);
                } catch (error) {
                    console.error("〤 Error parsing AI Text response:", error);
                }
            }
        });
    }

    return result;
}

function extractTranscript(e) {
    let result = null;

    // 1. conversation.item.create (Text von User, System, Assistant)
    if (e.type === "conversation.item.create" && e.item?.content) {
        const role = e.item.role;
        const text = e.item.content.find(c => c.type === "input_text")?.text;
        if (text) {
            let color = "gray";
            if (role === "user") color = "green";
            else if (role === "assistant") color = "blue";
            else if (role === "system") color = "orange";

            result = { who: role, text, color };
        }
    }

    // 2. response.audio_transcript.done
    else if (e.type === "response.audio_transcript.done" && e.transcript) {
        result = { who: "assistant", text: e.transcript, color: "purple" };
    }

    // 3. response.content_part.done
    else if (e.type === "response.content_part.done" && e.part?.transcript) {
        result = { who: "assistant", text: e.part.transcript, color: "purple" };
    }

    // 4. response.output_item.done
    else if (e.type === "response.output_item.done" && e.item?.role === "assistant") {
        const audioTranscript = e.item.content?.find(c => c.type === "audio")?.transcript;
        const textContent = e.item.content?.find(c => c.type === "text")?.text;

        if (audioTranscript) {
            result = { who: "assistant", text: audioTranscript, color: "purple" };
        } else if (textContent) {
            result = { who: "assistant", text: textContent, color: "blue" };
        }
    }

    // 5. response.done mit inline content
    else if (e.type === "response.done" && Array.isArray(e.response?.output)) {
        e.response.output.forEach(item => {
            if (item.role === "assistant" && Array.isArray(item.content)) {
                item.content.forEach(contentItem => {
                    if (contentItem.type === "audio" && contentItem.transcript) {
                        result = { who: "assistant", text: contentItem.transcript, color: "purple" };
                    } else if (contentItem.type === "text" && contentItem.text) {
                        result = { who: "assistant", text: contentItem.text, color: "blue" };
                    }
                });
            }
        });
    }

    // ✅ 6. Funktion Call Event (von dir gewünscht)
    else if (e.type === "conversation.item.created" && e.item?.type === "function_call") {
        const functionName = e.item.name || "unknown_function";
        const args = e.item.arguments || "";
        const text = `function_calling: ${functionName}` + (args ? ` ${args}` : "");
        result = { who: "user", text, color: "green" };
    }

    // ✅ 7. Optional: arguments received (wenn du auch das anzeigen willst)
    else if (e.type === "response.function_call_arguments.done") {
        const functionName = e.name || "unknown_function";
        const args = e.arguments || "";
        const text = `function_call_args: ${functionName} ${args}`;
        result = { who: "user", text, color: "green" };
    } 

    // ✅ 8. Das ist die Bestätigung, dass GPT einen Tool-Call erfolgreich abgeschlossen hat.
    else if (e.type === "response.output_item.done" && e.item?.type === "function_call") {
        const functionName = e.item.name || "unknown_function";
        const args = e.item.arguments || "";
        const status = e.item.status || "done";
        const text = `function_call (${status}): ${functionName} ${args}`;
        result = { who: "assistant", text, color: "purple" };
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
                    textCallOutputs.length > 0 ? (
                        textCallOutputs.map((text, index) => <TextCallOutput key={index} text={text} />)
                    ) : (
                        <p>Bitten Sie darum, etwas aufzuschreiben, und es wird hier erscheinen.</p>
                    )
                }

                <h2>✍️ Transcript-Ausgabe</h2>
                {
                    transcriptOutputs.length > 0 ? (
                        transcriptOutputs.map((entry, i) => <TranscriptOutput key={i} entry={entry} />)
                    ) : (
                        <p>Hier sollten Audio-Transcriptions erscheinen</p>
                    )
                }
            </div>
        </section>
    );
}