"use client";

import React, { useEffect, useState } from "react";
import { Mic, Square, Loader2, RefreshCcw, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAudioRecorder } from "@/hooks/use-audio-recorder";
import { uploadAudio } from "@/services/voice-service";

type AppState = "idle" | "listening" | "processing" | "success" | "error";

interface VoiceControlProps {
  onSuccess?: () => void;
}

export function VoiceControl({ onSuccess }: VoiceControlProps) {
  const [appState, setAppState] = useState<AppState>("idle");
  const [feedbackText, setFeedbackText] = useState("Tekan untuk bicara");
  // State baru untuk menyimpan jawaban cerdas AI
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  
  const { isRecording, startRecording, stopRecording, audioBlob, duration } = useAudioRecorder();

  useEffect(() => {
    if (isRecording) {
      setAppState("listening");
      setAiResponse(null); // Reset jawaban sebelumnya saat mulai rekam baru
    } else if (!isRecording && audioBlob) {
      handleProcessAudio(audioBlob);
    }
  }, [isRecording, audioBlob]);

  const handleProcessAudio = async (blob: Blob) => {
    setAppState("processing");
    setFeedbackText("Mengirim ke AI...");

    try {
      const response = await uploadAudio(blob);
      
      if (response.status === "success") {
        setAppState("success");
        setFeedbackText(`"${response.data.transcription}"`);
        
        // Tampilkan jawaban natural dari AI (misal: "Stok Indomie sisa 42 bungkus")
        if (response.data.assistant_response) {
            setAiResponse(response.data.assistant_response);
        }

        // Jika ini transaksi, trigger refresh list di bawah
        if (response.data.intent === "TRANSACTION" && onSuccess) {
             onSuccess();
        }
      }
    } catch (error) {
      setAppState("error");
      setFeedbackText("Gagal memproses suara. Coba lagi.");
      console.error(error);
    } finally {
      // Logic Reset:
      // Jika hanya Cek Stok (bukan transaksi), biarkan teks tampil lebih lama biar sempat dibaca
      const delay = aiResponse ? 6000 : 4000;
      
      setTimeout(() => {
        if (appState !== "listening") { 
            setAppState("idle");
            setFeedbackText("Tekan untuk bicara");
            setAiResponse(null);
        }
      }, delay);
    }
  };

  const handleMicClick = () => {
    if (appState === "listening") {
      stopRecording();
    } else {
      startRecording();
    }
  };

  return (
    <div className="flex flex-col items-center justify-center gap-6 p-4 w-full">
      {/* Area Feedback Status (Transcription) */}
      <div className="h-12 flex items-end justify-center text-center px-4 w-full">
        <p className={cn(
          "font-medium transition-colors duration-300 text-sm line-clamp-2",
          appState === "error" ? "text-red-500" : "text-slate-500"
        )}>
          {appState === "listening" ? `Mendengarkan... (${duration}s)` : feedbackText}
        </p>
      </div>

      {/* Main Interaction Button */}
      <div className="relative group">
        {appState === "listening" && (
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75 duration-1000"></span>
        )}

        <Button
          size="icon"
          className={cn(
            "h-32 w-32 rounded-full shadow-2xl transition-all duration-300 border-4",
            appState === "processing" 
              ? "bg-amber-500 border-amber-100 scale-100"
              : appState === "listening"
              ? "bg-red-500 hover:bg-red-600 border-red-100 scale-110"
              : appState === "success"
              ? "bg-green-500 hover:bg-green-600 border-green-100"
              : "bg-blue-600 hover:bg-blue-700 border-blue-100"
          )}
          onClick={handleMicClick}
          disabled={appState === "processing"}
        >
          {appState === "processing" ? (
            <Loader2 className="h-12 w-12 text-white animate-spin" />
          ) : appState === "listening" ? (
            <Square className="h-10 w-10 text-white fill-current" />
          ) : appState === "success" ? (
             <Sparkles className="h-12 w-12 text-white animate-pulse" />
          ) : (
            <Mic className="h-12 w-12 text-white" />
          )}
        </Button>
      </div>

      {/* AI Response Bubble (Muncul di tengah bawah tombol) */}
      {aiResponse && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 mt-4">
          <div className="bg-slate-900 text-white px-6 py-4 rounded-2xl shadow-xl max-w-[300px] text-center relative">
            {/* Segitiga kecil (Bubble Tail) */}
            <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-b-[8px] border-b-slate-900"></div>
            
            <p className="text-sm font-medium leading-relaxed">
              {aiResponse}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}