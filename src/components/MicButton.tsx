import { Mic, Square } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface MicButtonProps {
  onAudio: (payload: { base64: string; durationSec: number; transcriptHint?: string }) => void;
  disabled?: boolean;
}

/**
 * Records audio via MediaRecorder and returns a base64 string.
 * Falls back to a simulated recording if mic access is denied.
 */
export function MicButton({ onAudio, disabled }: MicButtonProps) {
  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startedAtRef = useRef<number>(0);
  const tickRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (tickRef.current) window.clearInterval(tickRef.current);
    };
  }, []);

  async function start() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const base64 = await blobToBase64(blob);
        const durationSec = Math.max(1, Math.round((Date.now() - startedAtRef.current) / 1000));
        onAudio({ base64, durationSec });
      };
      recorder.start();
      recorderRef.current = recorder;
      startedAtRef.current = Date.now();
      setRecording(true);
      setElapsed(0);
      tickRef.current = window.setInterval(() => {
        setElapsed(Math.round((Date.now() - startedAtRef.current) / 1000));
      }, 250);
    } catch {
      // simulate when no mic permission
      const durationSec = 4;
      onAudio({
        base64: "",
        durationSec,
        transcriptHint: "Ho ricevuto 5 casse di pomodori San Marzano.",
      });
    }
  }

  function stop() {
    recorderRef.current?.stop();
    setRecording(false);
    if (tickRef.current) window.clearInterval(tickRef.current);
  }

  return (
    <button
      type="button"
      onClick={recording ? stop : start}
      disabled={disabled}
      aria-label={recording ? "Ferma registrazione" : "Registra messaggio vocale"}
      className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl transition-colors ${
        recording ? "bg-destructive text-destructive-foreground" : "bg-secondary text-secondary-foreground"
      } disabled:opacity-50`}
    >
      {recording ? <Square className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
      {recording && (
        <span className="ml-1 text-xs tabular-nums">{elapsed}s</span>
      )}
    </button>
  );
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      resolve(result.split(",")[1] ?? "");
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}