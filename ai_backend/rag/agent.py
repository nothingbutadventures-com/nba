import re
import logging
import json
from typing import List, Dict, Any, Optional
from groq import Groq
from config import settings
from rag.retriever import search_tours, get_tour_cache
from rag.knowledge_base import search_knowledge_base, NBA_KNOWLEDGE_DOCS

logger = logging.getLogger("ai_backend.agent")

ACTIVE_GROQ_MODELS = [
    settings.GROQ_MODEL,
    "openai/gpt-oss-120b",
    "qwen/qwen3.8-27b",
    "groq/compound-mini",
    "llama-3.3-70b-versatile",
    "llama-3.1-8b-instant"
]

SYSTEM_PROMPT = """You are the Nothing But Adventures (NBA) AI Travel Concierge.
Your mission is to provide concise, direct, and helpful guidance for travelers exploring Nothing But Adventures expeditions, tours, pricing, and policies.

CRITICAL RULES & FORMATTING:
1. BE CONCISE & SCANNABLE: Never write long walls of text or lengthy paragraphs. Limit your response to 2–4 short, punchy bullet points and a brief 1-sentence intro/outro.
2. STRICT GUARDRAILS: ONLY answer questions related to Nothing But Adventures (NBA), our tours, destinations, itineraries, departure dates, pricing, physical ratings, cancellation policies, and lifetime deposits. Politely decline any off-topic questions.
3. GROUNDED FACTS: Only mention facts (prices, days, fitness levels) present in the provided context. Never invent imaginary tours or prices.
4. TONE: Direct, adventurous, professional, and clear.
"""

def format_date_safe(val: Any) -> str:
    if not val:
        return ""
    if isinstance(val, str):
        return val[:10]
    if hasattr(val, "strftime"):
        return val.strftime("%Y-%m-%d")
    return str(val)[:10]

def should_return_tour_cards(query: str, filters: Optional[Dict[str, Any]] = None) -> bool:
    """Determine if the user is explicitly asking to search/browse/discover tour packages rather than asking details about a tour."""
    filters = filters or {}
    if any(filters.values()):
        return True
        
    q_lower = query.lower().strip()
    
    # 1. Attribute / Detail / Question queries on a tour or policy (DO NOT SHOW TOUR CARDS)
    # E.g. "show me this tour discounts", "what is included?", "cancellation policy", "reviews on this tour", "how to book"
    detail_keywords = [
        "discount", "discounts", "promo", "promo code", "voucher",
        "included", "inclusion", "inclusions", "exclude", "exclusion", "exclusions",
        "itinerary", "day by day", "fitness level", "physical level", "difficulty",
        "what to pack", "packing list", "meals", "food", "hotel", "stay", "accommodation",
        "visa", "passport", "insurance", "deposit", "cancellation", "refund", "lifetime deposit",
        "how to book", "how do i book", "pay", "payment", "guide", "guides",
        "who are you", "what is nba", "support", "help", "contact"
    ]
    
    is_detail_query = any(kw in q_lower for kw in detail_keywords)
    
    # Explicit search triggers that override detail questions (e.g. "show tours with discounts", "find tours under 5 days")
    explicit_search_triggers = [
        "show me tours", "show tours", "find tours", "find me tours", "search tours",
        "list tours", "give me tours", "recommend tours", "recommend trips",
        "top tours", "top trips", "tours in", "trips in", "adventures in", "packages in",
        "best 1 tour", "best tour", "best 2 tours", "best 3 tours", "top 5 tours", "give me 5"
    ]
    
    has_explicit_search = any(st in q_lower for st in explicit_search_triggers)
    
    if is_detail_query and not has_explicit_search:
        return False
        
    # 2. General Discovery / Search / Recommendation queries (SHOW TOUR CARDS)
    tour_discovery_patterns = [
        r'\b(?:show|find|give|recommend|search|list)\b.*\b(?:tour|tours|trip|trips|safari|safaris|trek|treks|expedition|expeditions|package|packages|holiday|holidays)\b',
        r'\b(?:best|top|popular|cheap|affordable)\b.*\b(?:tour|tours|trip|trips|safari|safaris|trek|treks|adventure|adventures)\b',
        r'\b(?:tours?|trips?|safaris?|treks?|adventures?)\s+(?:in|to|for|around)\s+[a-zA-Z]+',
        r'\b(?:nepal|kenya|tanzania|peru|india|philippines|iceland|costa rica|africa|asia|europe|patagonia|vietnam)\b',
        r'\bunder\s+\$?\d{3,6}\b',
        r'\b\d{1,2}\s+(?:days?|nights?)\s+(?:tour|trip|trek|safari)\b',
        r'\b(?:1|2|3|4|5|6|7|8|9|10|one|two|three|four|five|six|seven|eight|nine|ten)\s+(?:tours?|trips?|safaris?|treks?|adventures?)\b'
    ]
    
    for pattern in tour_discovery_patterns:
        if re.search(pattern, q_lower):
            return True
            
    return False

def build_context_for_query(query: str, filters: Optional[Dict[str, Any]] = None) -> tuple[str, List[Dict[str, Any]]]:
    """Retrieve relevant knowledge base items and matched tours."""
    filters = filters or {}
    matched_tours = search_tours(
        query=query,
        destination=filters.get("destination"),
        travel_style=filters.get("travelStyle"),
        max_price=filters.get("maxPrice"),
        max_days=filters.get("maxDays"),
        min_days=filters.get("minDays"),
        physical_rating=filters.get("physicalRating"),
        limit=None
    )
    
    kb_docs = search_knowledge_base(query, top_k=3)
    context_parts = []
    
    if kb_docs:
        context_parts.append("### OFFICIAL NBA POLICIES & KNOWLEDGE BASE:")
        for doc in kb_docs:
            context_parts.append(f"**{doc['title']}**:\n{doc['content']}\n")
            
    if matched_tours:
        context_parts.append("### AVAILABLE MATCHING TOURS IN NBA DATABASE:")
        for t in matched_tours:
            name = t.get("name") or t.get("title") or "Adventure Tour"
            country = t.get("country", {}).get("name") if isinstance(t.get("country"), dict) else str(t.get("country", ""))
            price = t.get("price", {}).get("amount") if isinstance(t.get("price"), dict) else t.get("pricing", {}).get("startingPrice", "N/A")
            currency = t.get("price", {}).get("currency", "USD") if isinstance(t.get("price"), dict) else "USD"
            days = t.get("duration", {}).get("days") or t.get("durationDays") or "Flexible"
            p_rating = t.get("physicalRating", {}).get("level") if isinstance(t.get("physicalRating"), dict) else t.get("physicalRating", "Standard")
            summary = t.get("summary") or t.get("description", "")[:180]
            start_dates = t.get("startDates", [])
            dates_list = [format_date_safe(d.get("startDate")) for d in start_dates[:2] if d.get("startDate")]
            dates_str = ", ".join([d for d in dates_list if d]) or "Flexible dates"
            
            context_parts.append(
                f"- **{name}** ({country}) | {days} Days | From {currency} ${price} | Physical Level: {p_rating} | Departures: {dates_str}\n"
                f"  Summary: {summary}\n"
            )
    else:
        all_cached = get_tour_cache()
        if all_cached:
            context_parts.append(f"### NOTE: NBA offers {len(all_cached)} adventures worldwide across all continents.")

    return "\n".join(context_parts), matched_tours

def generate_suggested_questions(query: str, matched_tours: List[Dict[str, Any]]) -> List[str]:
    """Generate dynamic follow-up question chips for the user."""
    q_lower = query.lower()
    
    if "cancellation" in q_lower or "refund" in q_lower:
        return [
            "How do Lifetime Deposits work?",
            "What if I cancel 45 days before departure?",
            "Show me popular wildlife tours"
        ]
    elif matched_tours:
        top_tour_name = matched_tours[0].get("name") or matched_tours[0].get("title")
        return [
            f"What fitness level for {top_tour_name[:20]}?",
            "What is included in the price?",
            "Show me tours under 10 days"
        ]
    elif "hiking" in q_lower or "trek" in q_lower:
        return [
            "What fitness level is needed?",
            "Show me wildlife safari adventures",
            "What deposit is required to book?"
        ]
    else:
        return [
            "Show me top 5 popular tours",
            "What is your cancellation policy?",
            "Do you have tours under 10 days?"
        ]

async def process_chat_message(
    messages: List[Dict[str, str]],
    filters: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """Process incoming chat conversation and return concise grounded LLM response + matching tour cards when relevant."""
    if not messages:
        return {
            "reply": "Hello! I am your Nothing But Adventures AI concierge. How can I help you discover your next journey?",
            "tours": [],
            "suggested_questions": [
                "Show me top popular tours",
                "What is your cancellation policy?",
                "Find trekking adventures under 10 days"
            ]
        }
        
    latest_user_message = messages[-1].get("content", "")
    
    # 1. Retrieve grounded context
    context_str, matched_tours = build_context_for_query(latest_user_message, filters)
    
    # 2. Determine if tour cards should be displayed for this query
    should_show_tours = should_return_tour_cards(latest_user_message, filters)
    tours_to_return = matched_tours if should_show_tours else []
    
    groq_key = settings.GROQ_API_KEY
    has_valid_key = bool(groq_key and not groq_key.startswith("gsk_default"))
    
    if has_valid_key:
        groq_messages = [
            {"role": "system", "content": f"{SYSTEM_PROMPT}\n\nCONTEXT INFORMATION:\n{context_str}"}
        ]
        
        for m in messages[-4:]:
            role = m.get("role")
            content = m.get("content", "")
            if role in ["user", "assistant"]:
                groq_messages.append({"role": role, "content": content})
                
        client = Groq(api_key=groq_key)
        
        for model_name in dict.fromkeys(ACTIVE_GROQ_MODELS):
            if not model_name:
                continue
            try:
                completion = client.chat.completions.create(
                    messages=groq_messages,
                    model=model_name,
                    temperature=0.2,
                    max_tokens=400
                )
                reply_text = completion.choices[0].message.content
                if reply_text and len(reply_text.strip()) > 5:
                    logger.info(f"Generated concise response using Groq model: {model_name}")
                    return {
                        "reply": reply_text.strip(),
                        "tours": tours_to_return,
                        "suggested_questions": generate_suggested_questions(latest_user_message, tours_to_return)
                    }
            except Exception as e:
                logger.warning(f"Groq generation failed on model {model_name}: {e}")
                continue
                
    # Fallback concise response
    q_lower = latest_user_message.lower()
    
    off_topic_words = ["python", "javascript", "code", "programming", "math", "calculus", "politics", "president", "recipe", "homework"]
    if any(w in q_lower for w in off_topic_words) and not any(t in q_lower for t in ["tour", "travel", "trip", "trek", "safari"]):
        return {
            "reply": "I specialize strictly in Nothing But Adventures expeditions, tours, and booking policies. How can I help you plan your next trip?",
            "tours": [],
            "suggested_questions": ["Show me top popular tours", "What is your cancellation policy?"]
        }
        
    if "cancellation" in q_lower or "refund" in q_lower or "deposit" in q_lower:
        reply = (
            "**Cancellation & Lifetime Deposit Rules:**\n"
            "- **60+ Days Before**: 100% of the remainder refunded; deposit saved as Lifetime Deposit.\n"
            "- **30–59 Days Before**: 50% remainder refunded; deposit saved as Lifetime Deposit.\n"
            "- **< 30 Days Before**: 0% remainder refunded; deposit saved as Lifetime Deposit.\n"
            "- **Lifetime Deposit Guarantee**: Deposits never expire and apply to any future tour."
        )
    elif tours_to_return:
        reply = f"Here are the top matches from our database for **{latest_user_message}**:"
    else:
        reply = "We offer small-group adventures worldwide. Let me know your destination, duration, or budget to find the best match!"
        
    return {
        "reply": reply,
        "tours": tours_to_return,
        "suggested_questions": generate_suggested_questions(latest_user_message, tours_to_return)
    }
