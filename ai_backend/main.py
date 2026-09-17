import logging
from contextlib import asynccontextmanager
from typing import List, Dict, Any, Optional
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from config import settings
from database import init_db
from rag.retriever import refresh_tour_cache, search_tours, get_tour_cache
from rag.agent import process_chat_message

# Setup logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("ai_backend")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: initialize database and load cache
    logger.info("Starting up NBA AI Backend...")
    init_db()
    await refresh_tour_cache()
    yield
    logger.info("Shutting down NBA AI Backend...")

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="FastAPI LangChain Groq AI Backend for Nothing But Adventures",
    version="1.0.0",
    lifespan=lifespan
)

# CORS Setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic Schemas
class MessageItem(BaseModel):
    role: str = Field(..., description="Role: 'user' or 'assistant' or 'system'")
    content: str = Field(..., description="Message text content")

class TourFilters(BaseModel):
    destination: Optional[str] = None
    travelStyle: Optional[str] = None
    maxPrice: Optional[float] = None
    maxDays: Optional[int] = None
    minDays: Optional[int] = None
    physicalRating: Optional[int] = None

class ChatRequest(BaseModel):
    messages: List[MessageItem]
    filters: Optional[TourFilters] = None

class ChatResponse(BaseModel):
    reply: str
    tours: List[Dict[str, Any]]
    suggested_questions: List[str]

class SearchRequest(BaseModel):
    query: str = ""
    destination: Optional[str] = None
    travel_style: Optional[str] = None
    max_price: Optional[float] = None
    max_days: Optional[int] = None
    min_days: Optional[int] = None
    physical_rating: Optional[int] = None
    limit: int = 10

# Endpoints
@app.get("/health")
async def health_check():
    cached = get_tour_cache()
    has_key = bool(settings.GROQ_API_KEY and not settings.GROQ_API_KEY.startswith("gsk_default"))
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "tours_cached": len(cached),
        "groq_configured": has_key,
        "model": settings.GROQ_MODEL
    }

@app.post("/api/chat", response_model=ChatResponse)
async def chat_endpoint(payload: ChatRequest):
    try:
        messages_dict = [{"role": m.role, "content": m.content} for m in payload.messages]
        filters_dict = payload.filters.model_dump(exclude_none=True) if payload.filters else {}
        result = await process_chat_message(messages_dict, filters_dict)
        return ChatResponse(**result)
    except Exception as e:
        logger.error(f"Error in /api/chat: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/tours/search")
async def search_endpoint(payload: SearchRequest):
    try:
        tours = search_tours(
            query=payload.query,
            destination=payload.destination,
            travel_style=payload.travel_style,
            max_price=payload.max_price,
            max_days=payload.max_days,
            min_days=payload.min_days,
            physical_rating=payload.physical_rating,
            limit=payload.limit
        )
        return {
            "count": len(tours),
            "tours": tours
        }
    except Exception as e:
        logger.error(f"Error in /api/tours/search: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/quick-prompts")
async def quick_prompts():
    return {
        "prompts": [
            {
                "title": "Trekking in Nepal & Peru",
                "query": "Show me hiking and trekking tours under 12 days"
            },
            {
                "title": "Wildlife & African Safari",
                "query": "What are the best wildlife safari tours in Africa?"
            },
            {
                "title": "Budget-Friendly Trips",
                "query": "Show me adventures under $2500"
            },
            {
                "title": "Cancellation & Lifetime Deposits",
                "query": "How does the cancellation policy and Lifetime Deposit work?"
            },
            {
                "title": "Easy / Leisurely Pace",
                "query": "Find cultural and classic tours with physical rating level 1 or 2"
            }
        ]
    }

@app.post("/api/refresh-cache")
async def refresh_cache_endpoint():
    tours = await refresh_tour_cache()
    return {
        "status": "cache_refreshed",
        "tours_count": len(tours)
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host=settings.HOST, port=settings.PORT, reload=True)
