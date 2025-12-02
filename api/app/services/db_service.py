from supabase import create_client, Client
from app.core.config import settings
import logging

# Initialize module-level logger
logger = logging.getLogger(__name__)


class DBService:
    """
    Handles all database interactions using Supabase (PostgreSQL).
    Provides methods for transaction persistence and inventory management.
    """

    def __init__(self):
        # Initialize Supabase client with credentials from settings
        # Using the 'anon' key allows operations permitted by RLS policies
        self.supabase: Client = create_client(
            settings.SUPABASE_URL, settings.SUPABASE_KEY)

    def save_transaction(self, ai_data: dict) -> dict:
        """
        Persists a structured transaction record into the database.

        Args:
            ai_data (dict): Dictionary containing 'customer_name', 'is_debt', and 'items'.

        Returns:
            dict: The created transaction record including its generated ID.
        """
        try:
            # 1. Insert Transaction Header
            tx_data = {
                "customer_name": ai_data.get("customer_name"),
                "is_debt": ai_data.get("is_debt", False),
                "total_amount": 0  # Logic for calculating total based on product prices can be added here
            }

            tx_response = self.supabase.table(
                "transactions").insert(tx_data).execute()

            if not tx_response.data:
                raise Exception("Failed to insert transaction header record.")

            transaction_id = tx_response.data[0]['id']

            # 2. Insert Transaction Items (Details)
            items_data = []
            for item in ai_data.get("items", []):
                items_data.append({
                    "transaction_id": transaction_id,
                    "product_name": item["name"],
                    "quantity": item["qty"],
                    "unit": item["unit"]
                })

            if items_data:
                self.supabase.table("transaction_items").insert(
                    items_data).execute()

            logger.info(
                f"Transaction successfully committed. ID: {transaction_id}")
            return tx_response.data[0]

        except Exception as e:
            logger.error(f"Database persist error: {str(e)}")
            raise e

    def get_all_products(self) -> list:
        """
        Retrieves the full product catalog (name, stock, price).
        Used to provide context (RAG) to the AI Agent.
        """
        try:
            # Fetch minimal fields required for AI context to reduce payload size
            response = self.supabase.table("products").select(
                "name, stock, price, unit").execute()
            return response.data
        except Exception as e:
            logger.error(f"Failed to fetch product catalog: {str(e)}")
            return []

    def check_stock(self, product_query: str) -> list:
        """
        Performs a fuzzy search on the product table.
        Useful if we want to implement manual search later.
        """
        try:
            response = self.supabase.table("products")\
                .select("*")\
                .ilike("name", f"%{product_query}%")\
                .execute()
            return response.data
        except Exception as e:
            logger.error(f"Stock check query failed: {str(e)}")
            return []


# Singleton instance
db_service = DBService()
