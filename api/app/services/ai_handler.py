import json
import logging
from groq import Groq
from app.core.config import settings
from app.services.db_service import db_service  # Import DB service for RAG

# Initialize logger
logger = logging.getLogger(__name__)


class AIHandler:
    """
    Handles AI logic using Groq LPU (Whisper + Llama 3).
    Implements Retrieval Augmented Generation (RAG) by injecting DB context into prompts.
    """

    def __init__(self):
        self.client = Groq(api_key=settings.GROQ_API_KEY)

        # Model Configuration (Optimized for Speed/Free Tier)
        self.stt_model = "whisper-large-v3"
        self.llm_model = "llama-3.1-8b-instant"

        # Base System Prompt (The static part of the instruction) [cite: 293]
        self.base_system_prompt = """
        ROLE: Assistant Cashier for Indonesian Warung.
        GOAL: Extract structured data from informal speech.
        
        RULES:
        1. Identify "ngutang/kasbon" as is_debt: true.
        2. Convert slang: "goceng" (5000), "ceban" (10000).
        3. Convert units: "seperempat" (0.25 kg).
        4. If user asks about availability (e.g. "Stok ada gak?"), intent is "CHECK_STOCK".
        5. OUTPUT MUST BE VALID JSON.
        
        OUTPUT SCHEMA:
        {
          "intent": "TRANSACTION" | "CHECK_STOCK" | "UNKNOWN",
          "customer_name": "string or null",
          "is_debt": boolean,
          "items": [
            {"name": "string", "qty": number, "unit": "string"}
          ],
          "assistant_response": "string (short natural language response based on context)"
        }
        """

    def process_audio(self, file_path: str) -> dict:
        """
        Pipeline: Audio -> Text -> Context Retrieval (RAG) -> Intent Extraction.
        """
        try:
            logger.info(f"Processing audio file: {file_path}")

            # Step 1: Transcribe
            transcript = self._transcribe(file_path)
            logger.info(f"Transcript: {transcript}")

            # Step 2: Extract Intent with Context
            extracted_data = self._extract_intent(transcript)

            # Combine results
            extracted_data["transcription"] = transcript

            return extracted_data

        except Exception as e:
            logger.error(f"AI Pipeline Error: {str(e)}")
            return {
                "transcription": "Gagal memproses suara.",
                "intent": "UNKNOWN",
                "items": [],
                "is_debt": False,
                "error": str(e)
            }

    def _transcribe(self, file_path: str) -> str:
        """Transcribes audio using Groq Whisper."""
        try:
            with open(file_path, "rb") as audio_file:
                transcription = self.client.audio.transcriptions.create(
                    model=self.stt_model,
                    file=(file_path, audio_file),
                    language="id",
                    response_format="json"
                )
            return transcription.text
        except Exception as e:
            logger.error(f"Whisper Error: {str(e)}")
            raise e

    def _extract_intent(self, text: str) -> dict:
        """
        Extracts intent using Llama 3 with dynamic inventory context (RAG).
        """
        try:
            # 1. RAG: Fetch current product context from Database [cite: 176]
            products = db_service.get_all_products()

            # Minimize token usage by compacting the JSON string
            context_str = json.dumps(products, separators=(',', ':'))

            # 2. Dynamic Prompt Construction [cite: 181]
            dynamic_prompt = f"""
            {self.base_system_prompt}
            
            CURRENT INVENTORY CONTEXT (Use this to answer stock questions or match product names):
            {context_str}
            """

            # 3. Inference
            completion = self.client.chat.completions.create(
                model=self.llm_model,
                messages=[
                    {"role": "system", "content": dynamic_prompt},
                    {"role": "user", "content": text}
                ],
                temperature=0,  # Deterministic
                response_format={"type": "json_object"}
            )

            content = completion.choices[0].message.content
            return json.loads(content)

        except Exception as e:
            logger.error(f"Llama Inference Error: {str(e)}")
            # Fail safe response
            return {"intent": "UNKNOWN", "items": [], "is_debt": False}


# Singleton instance
ai_handler = AIHandler()
