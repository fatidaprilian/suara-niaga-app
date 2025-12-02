import { ApiResponse, TranscriptionData } from "@/types/api";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

/**
 * Uploads an audio blob to the backend for transcription and intent extraction.
 * @param audioBlob - The recorded audio file (webm/wav).
 * @returns Standardized API response containing transcription and entities.
 */
export async function uploadAudio(audioBlob: Blob): Promise<ApiResponse<TranscriptionData>> {
  const formData = new FormData();
  formData.append("file", audioBlob, "recording.webm");

  try {
    const response = await fetch(`${API_URL}/transcribe`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Server returned ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("[VoiceService] Upload failed:", error);
    throw error;
  }
}

/**
 * Retrieves the most recent transaction history from the database.
 * @returns Array of transaction objects with nested items.
 */
export async function getTransactions() {
  try {
    const response = await fetch(`${API_URL}/transactions?limit=20`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch transaction history");
    }

    const result = await response.json();
    return result.data || [];
  } catch (error) {
    console.error("[VoiceService] Fetch history failed:", error);
    return [];
  }
}