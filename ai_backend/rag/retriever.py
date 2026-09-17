import re
import logging
from typing import List, Dict, Any, Optional
from database import get_all_tours
from rag.knowledge_base import search_knowledge_base

logger = logging.getLogger("ai_backend.retriever")

_cached_tours: List[Dict[str, Any]] = []

async def refresh_tour_cache() -> List[Dict[str, Any]]:
    global _cached_tours
    try:
        tours = await get_all_tours(limit=200)
        if tours:
            _cached_tours = tours
            logger.info(f"Loaded {len(_cached_tours)} tours into retriever cache.")
        return _cached_tours
    except Exception as e:
        logger.error(f"Failed to refresh tour cache: {e}")
        return _cached_tours

def get_tour_cache() -> List[Dict[str, Any]]:
    return _cached_tours

WORD_TO_NUMBER = {
    "one": 1, "a single": 1, "1": 1,
    "two": 2, "2": 2,
    "three": 3, "3": 3,
    "four": 4, "4": 4,
    "five": 5, "5": 5,
    "six": 6, "6": 6,
    "seven": 7, "7": 7,
    "eight": 8, "8": 8,
    "nine": 9, "9": 9,
    "ten": 10, "10": 10
}

KNOWN_DESTINATIONS = [
    "africa", "south africa", "nepal", "kenya", "tanzania", "peru", "india",
    "philippines", "iceland", "costa rica", "asia", "europe", "patagonia",
    "vietnam", "cambodia", "thailand", "indonesia", "bali", "morocco",
    "egypt", "japan", "australia", "new zealand", "himalaya", "himalayas",
    "everest", "kilimanjaro", "serengeti", "masai mara", "machu picchu"
]

def extract_tour_search_criteria(query: str) -> Dict[str, Any]:
    """Parse text query to extract common filters like max price, duration, requested count, destination, etc."""
    criteria = {
        "max_price": None,
        "max_days": None,
        "min_days": None,
        "physical_rating": None,
        "destination": None,
        "travel_style": None,
        "requested_count": None
    }
    
    q_lower = query.lower()
    
    # 1. Extract requested count (e.g. "5 tours", "give me 5", "top 3", "show 1 tour", "two safaris")
    count_match = re.search(r'(?:give me|show(?: me)?|find(?: me)?|top|recommend|best)?\s*(\d{1,2}|one|two|three|four|five|six|seven|eight|nine|ten|a single)\s*(?:best|popular|cheap|top)?\s*(?:tours|tour|trips|trip|expeditions|expedition|safaris|safari|packages|package)', q_lower)
    if count_match:
        matched_val = count_match.group(1).strip()
        if matched_val in WORD_TO_NUMBER:
            criteria["requested_count"] = WORD_TO_NUMBER[matched_val]
        elif matched_val.isdigit():
            criteria["requested_count"] = int(matched_val)
    elif re.search(r'\b(?:top|best)\s*(\d{1,2})\b', q_lower):
        m = re.search(r'\b(?:top|best)\s*(\d{1,2})\b', q_lower)
        if m:
            criteria["requested_count"] = int(m.group(1))
            
    # 2. Extract destination if mentioned in query
    for dest in KNOWN_DESTINATIONS:
        if re.search(r'\b' + re.escape(dest) + r'\b', q_lower):
            criteria["destination"] = dest
            break
            
    # 3. Extract price: e.g. "under $2000", "under 1500", "budget 2500"
    price_match = re.search(r'(?:under|below|less than|budget|max(?:imum)?)\s*\$?\s*(\d{3,6})', q_lower)
    if price_match:
        criteria["max_price"] = float(price_match.group(1))
        
    # 4. Extract duration
    days_match = re.search(r'(?:under|within|less than|max)?\s*(\d{1,2})\s*(?:-|to)?\s*(\d{1,2})?\s*(?:days|day|nights)', q_lower)
    if days_match:
        if days_match.group(2):
            criteria["min_days"] = int(days_match.group(1))
            criteria["max_days"] = int(days_match.group(2))
        else:
            criteria["max_days"] = int(days_match.group(1))
            
    # 5. Extract physical rating
    rating_match = re.search(r'(?:physical rating|fitness level|difficulty|level)\s*([1-5])', q_lower)
    if rating_match:
        criteria["physical_rating"] = int(rating_match.group(1))
    elif "easy" in q_lower or "relaxed" in q_lower:
        criteria["physical_rating"] = 1
    elif "strenuous" in q_lower or "extreme" in q_lower or "hard" in q_lower:
        criteria["physical_rating"] = 5
        
    return criteria

def search_tours(
    query: str = "",
    destination: Optional[str] = None,
    travel_style: Optional[str] = None,
    max_price: Optional[float] = None,
    max_days: Optional[int] = None,
    min_days: Optional[int] = None,
    physical_rating: Optional[int] = None,
    limit: Optional[int] = None
) -> List[Dict[str, Any]]:
    """Hybrid semantic & attribute filter over cached tours with strict destination and relevance matching."""
    tours = _cached_tours
    if not tours:
        return []
        
    extracted = extract_tour_search_criteria(query)
    
    # Determine exact limit
    if extracted.get("requested_count"):
        effective_limit = extracted["requested_count"]
    elif limit is not None:
        effective_limit = limit
    else:
        effective_limit = 3
        
    effective_max_price = max_price or extracted.get("max_price")
    effective_max_days = max_days or extracted.get("max_days")
    effective_min_days = min_days or extracted.get("min_days")
    effective_physical_rating = physical_rating or extracted.get("physical_rating")
    target_destination = destination or extracted.get("destination")
    
    # Filter out common stop words
    words = [w.strip().lower() for w in re.findall(r'\b[a-zA-Z0-9]{3,}\b', query) if w.lower() not in [
        "tour", "tours", "trip", "trips", "show", "find", "want", "like", "with", "from", "that", "this", "have", "give", "please", "best", "some", "offers", "offer", "currently", "what", "where", "about"
    ]]
    
    q_lower = query.lower()
    scored_tours = []
    
    for t in tours:
        name = (t.get("name") or t.get("title") or "").lower()
        summary = (t.get("summary") or "").lower()
        description = (t.get("description") or "").lower()
        
        country_obj = t.get("country") or {}
        country_name = country_obj.get("name", "").lower() if isinstance(country_obj, dict) else str(country_obj).lower()
        country_slug = country_obj.get("slug", "").lower() if isinstance(country_obj, dict) else ""
        
        travel_style_obj = t.get("travelStyle") or {}
        travel_style_name = travel_style_obj.get("name", "").lower() if isinstance(travel_style_obj, dict) else str(travel_style_obj).lower()
        
        price_val = 0
        if isinstance(t.get("price"), dict):
            price_val = t["price"].get("amount", 0)
        elif isinstance(t.get("pricing"), dict):
            price_val = t["pricing"].get("startingPrice", 0)
            
        duration_days = 0
        if isinstance(t.get("duration"), dict):
            duration_days = t["duration"].get("days", 0)
        elif t.get("durationDays"):
            duration_days = t.get("durationDays", 0)
            
        p_rating = 0
        if isinstance(t.get("physicalRating"), dict):
            p_rating = t["physicalRating"].get("level", 0)
        elif isinstance(t.get("physicalRating"), (int, float)):
            p_rating = int(t.get("physicalRating"))
            
        # Hard attribute filters
        if effective_max_price and price_val > 0 and price_val > effective_max_price:
            continue
        if effective_max_days and duration_days > 0 and duration_days > effective_max_days:
            continue
        if effective_min_days and duration_days > 0 and duration_days < effective_min_days:
            continue
        if effective_physical_rating and p_rating > 0 and p_rating > effective_physical_rating:
            continue
        if travel_style and travel_style.lower() not in travel_style_name:
            continue
            
        # Strict destination match: If user asked for a destination/country/region (e.g. "Africa", "Nepal", "Kenya")
        if target_destination:
            td = target_destination.lower()
            # Check if this tour matches the target destination
            matches_dest = (
                td in country_name or
                td in country_slug or
                td in name or
                td in summary or
                (td == "africa" and any(ac in (country_name + " " + country_slug + " " + name + " " + summary) for ac in ["south africa", "kenya", "tanzania", "africa", "safari"])) or
                (td == "asia" and any(ac in (country_name + " " + country_slug + " " + name + " " + summary) for ac in ["nepal", "india", "philippines", "asia", "thailand", "vietnam"]))
            )
            if not matches_dest:
                continue
                
        # Keyword scoring
        keyword_score = 0
        
        # Exact tour title match boost
        if name and name in q_lower:
            keyword_score += 100
            
        if not words:
            keyword_score = 10
        else:
            for w in words:
                if w in name:
                    keyword_score += 25
                if w in country_name:
                    keyword_score += 30
                if w in travel_style_name:
                    keyword_score += 15
                if w in summary:
                    keyword_score += 8
                if w in description:
                    keyword_score += 3
                    
        # If words were provided but none matched this tour, skip it! (Don't pad with unrelated tours)
        if words and keyword_score == 0 and not target_destination:
            continue
            
        total_score = keyword_score
        if t.get("descriptionImage") or t.get("images"):
            total_score += 2
        if price_val > 0:
            total_score += 1
            
        scored_tours.append((total_score, t))
        
    scored_tours.sort(key=lambda x: x[0], reverse=True)
    
    if not scored_tours:
        return []
        
    # If the top tour is an exact title match, return just that 1 tour
    if scored_tours[0][0] >= 100 and not extracted.get("requested_count"):
        return [scored_tours[0][1]]
        
    top_score = scored_tours[0][0]
    
    # Filter out low-relevance tours (must have at least 50% of top score if top score is high)
    valid_matches = []
    for score, tour in scored_tours:
        if top_score >= 30 and score < (top_score * 0.45):
            continue
        valid_matches.append(tour)
        
    return valid_matches[:effective_limit]
