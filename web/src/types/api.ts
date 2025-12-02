export interface ExtractedItem {
  name: string;
  qty: number;
  unit: string;
}

export interface TranscriptionData {
  transcription: string;
  intent: "TRANSACTION" | "CHECK_STOCK" | "UNKNOWN";
  customer_name: string | null;
  is_debt: boolean;
  items: ExtractedItem[];
  // Field baru untuk jawaban natural language dari AI
  assistant_response?: string;
}

export interface ApiResponse<T> {
  status: "success" | "error";
  data: T;
  message?: string;
}