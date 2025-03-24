import { useRef, useState } from "react"; 

export default function MicRecorder() {
    const [isRecording, setIsRecording] = useState(false);
    const [recordingUrl, setRecordingUrl] = useState(null);
    const mediaRecorder = useRef(null);
  
    async function toggleRecording() {
        if (isRecording) {
            mediaRecorder.current.stop();
            setIsRecording(false);
        } else {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const recorder = new MediaRecorder(stream);
            const chunks = [];

            recorder.ondataavailable = (e) => chunks.push(e.data);

            recorder.onstop = () => {
                const blob = new Blob(chunks, { type: 'audio/webm' });
                const url = URL.createObjectURL(blob);
                setRecordingUrl(url);

                // Optional: Du kannst den Blob auch in eine File verwandeln:
                // const file = new File([blob], "aufnahme.webm", { type: "audio/webm" });
            };

            mediaRecorder.current = recorder;
            recorder.start();
            setIsRecording(true);
        }
    }
  
    return (
      <div>
        <button className ="button start-recording" onClick={toggleRecording}>
          {isRecording ? "⏹️ Stop" : "🎙️ Start Recording"}
        </button>
  
        {recordingUrl && (
          <div style={{ marginTop: "1rem" }}>
            <audio controls src={recordingUrl}></audio>
            <br />
            <a href={recordingUrl} download="aufnahme.webm">📥 Download Aufnahme</a>
          </div>
        )}
      </div>
    );
  }