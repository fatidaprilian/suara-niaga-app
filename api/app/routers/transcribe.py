from fastapi import APIRouter, UploadFile, File, HTTPException
import shutil
import os
import uuid
import logging
from app.services.ai_handler import ai_handler
from app.services.db_service import db_service

logger = logging.getLogger(__name__)

router = APIRouter()

# HAPUS 'async' -> jadi 'def' biasa


@router.post("/transcribe")
def transcribe_audio(file: UploadFile = File(...)):
    """
    Synchronous handler to prevent event loop blocking when using sync libraries (Groq/Supabase).
    """

    if not file.filename:
        raise HTTPException(status_code=400, detail="Invalid file provided.")

    unique_filename = f"temp_{uuid.uuid4()}_{file.filename}"

    try:
        # File saving tetap sama
        with open(unique_filename, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # HAPUS 'await' di sini
        ai_result = ai_handler.process_audio(unique_filename)

        # Database logic tetap sama (karena db_service sudah sync)
        if ai_result.get("intent") == "TRANSACTION":
            try:
                saved_tx = db_service.save_transaction(ai_result)
                ai_result["transaction_id"] = saved_tx.get("id")
                ai_result["db_status"] = "saved"
            except Exception as db_err:
                logger.error(f"Database persistence failed: {str(db_err)}")
                ai_result["db_status"] = f"error: {str(db_err)}"
        else:
            ai_result["db_status"] = "skipped"

        return {
            "status": "success",
            "data": ai_result
        }

    except Exception as e:
        logger.error(f"Transcription endpoint error: {str(e)}")
        raise HTTPException(
            status_code=500, detail=f"Internal Processing Error: {str(e)}")

    finally:
        if os.path.exists(unique_filename):
            try:
                os.remove(unique_filename)
            except OSError:
                pass
