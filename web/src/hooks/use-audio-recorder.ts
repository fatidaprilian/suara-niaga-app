import { useState, useRef, useCallback } from "react";

export function useAudioRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [duration, setDuration] = useState(0);
  
  // Ref untuk menyimpan instance MediaRecorder agar tidak hilang saat re-render
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);

  const startRecording = useCallback(async () => {
    try {
      // 1. Minta izin browser untuk pakai mic
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // 2. Inisialisasi MediaRecorder
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = []; // Reset buffer audio

      // 3. Event listener saat data audio tersedia (buffer terisi)
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      // 4. Event listener saat rekaman berhenti
      mediaRecorder.onstop = () => {
        // Gabungkan semua chunk menjadi satu file Blob (tipe webm/mp3)
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        setAudioBlob(blob);
        
        // Matikan track microphone agar lampu indikator browser mati
        stream.getTracks().forEach((track) => track.stop());
      };

      // 5. Mulai merekam
      mediaRecorder.start();
      setIsRecording(true);
      setAudioBlob(null);
      setDuration(0);

      // 6. Timer untuk menghitung durasi bicara
      timerRef.current = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);

    } catch (error) {
      console.error("Gagal mengakses mikrofon:", error);
      alert("Izin mikrofon ditolak. Mohon aktifkan di pengaturan browser.");
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  }, [isRecording]);

  return {
    isRecording,
    audioBlob,
    duration,
    startRecording,
    stopRecording,
  };
}