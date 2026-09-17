import logging
import os
from datetime import datetime, date
from typing import List, Dict, Any, Optional
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo import MongoClient
from bson import ObjectId
from config import settings

logger = logging.getLogger("ai_backend.database")

async_client: Optional[AsyncIOMotorClient] = None
async_db = None
sync_client: Optional[MongoClient] = None
sync_db = None

DB_NAME = os.getenv("MONGODB_DB_NAME", "test")

def init_db():
    global async_client, async_db, sync_client, sync_db
    if settings.MONGODB_URI:
        try:
            async_client = AsyncIOMotorClient(settings.MONGODB_URI)
            async_db = async_client[DB_NAME]
            
            sync_client = MongoClient(settings.MONGODB_URI, serverSelectionTimeoutMS=5000)
            sync_db = sync_client[DB_NAME]
            
            logger.info(f"MongoDB clients initialized successfully on database '{DB_NAME}'.")
        except Exception as e:
            logger.error(f"Failed to connect to MongoDB: {e}")

def serialize_mongo_doc(doc: Any) -> Any:
    """Recursively convert BSON ObjectId, datetime, and other non-JSON types to standard primitives."""
    if doc is None:
        return None
    if isinstance(doc, (ObjectId,)):
        return str(doc)
    if isinstance(doc, (datetime, date)):
        return doc.isoformat()
    if isinstance(doc, list):
        return [serialize_mongo_doc(item) for item in doc]
    if isinstance(doc, dict):
        result = {}
        for k, v in doc.items():
            result[k] = serialize_mongo_doc(v)
        return result
    return doc

async def get_all_tours(limit: int = 150) -> List[Dict[str, Any]]:
    """Retrieve all tours from MongoDB, populating country and travel style."""
    if async_db is None:
        return []
    try:
        pipeline = [
            {
                "$lookup": {
                    "from": "countries",
                    "localField": "country",
                    "foreignField": "_id",
                    "as": "country_data"
                }
            },
            {
                "$unwind": {
                    "path": "$country_data",
                    "preserveNullAndEmptyArrays": True
                }
            },
            {
                "$lookup": {
                    "from": "travelstyles",
                    "localField": "travelStyle",
                    "foreignField": "_id",
                    "as": "travel_style_data"
                }
            },
            {
                "$unwind": {
                    "path": "$travel_style_data",
                    "preserveNullAndEmptyArrays": True
                }
            },
            {"$limit": limit}
        ]
        cursor = async_db["tours"].aggregate(pipeline)
        tours = await cursor.to_list(length=limit)
        
        # Format tours so they match frontend TourCard expectations
        formatted_tours = []
        for t in tours:
            doc = serialize_mongo_doc(t)
            if "country_data" in doc and doc["country_data"]:
                doc["country"] = {
                    "_id": str(doc["country_data"].get("_id", "")),
                    "name": doc["country_data"].get("name", ""),
                    "slug": doc["country_data"].get("slug", "")
                }
            if "travel_style_data" in doc and doc["travel_style_data"]:
                doc["travelStyle"] = {
                    "_id": str(doc["travel_style_data"].get("_id", "")),
                    "name": doc["travel_style_data"].get("name", ""),
                    "slug": doc["travel_style_data"].get("slug", "")
                }
            formatted_tours.append(doc)
            
        return formatted_tours
    except Exception as e:
        logger.error(f"Error fetching tours: {e}")
        return []

async def get_tour_by_id_or_slug(identifier: str) -> Optional[Dict[str, Any]]:
    """Find a specific tour by ObjectId string or slug."""
    if async_db is None:
        return None
    try:
        query = {}
        if ObjectId.is_valid(identifier):
            query["_id"] = ObjectId(identifier)
        else:
            query["slug"] = identifier
            
        tour = await async_db["tours"].find_one(query)
        if tour:
            return serialize_mongo_doc(tour)
    except Exception as e:
        logger.error(f"Error getting tour: {e}")
    return None
