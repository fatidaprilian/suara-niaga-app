from fastapi import APIRouter, HTTPException
import logging
from app.services.db_service import db_service

# Initialize logger
logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/transactions")
def get_recent_transactions(limit: int = 10):
    """
    Fetches the latest transactions including their items.

    Args:
        limit (int): Number of transactions to retrieve (default: 10).

    Returns:
        dict: List of transactions with nested items.
    """
    try:
        # Perform a relational query: Fetch transactions AND their associated items
        # .order() ensures the newest transactions appear first
        response = db_service.supabase.table("transactions")\
            .select("*, transaction_items(*)")\
            .order("created_at", desc=True)\
            .limit(limit)\
            .execute()

        return {
            "status": "success",
            "data": response.data
        }

    except Exception as e:
        logger.error(f"Failed to fetch transactions: {str(e)}")
        raise HTTPException(
            status_code=500, detail=f"Database query failed: {str(e)}")
