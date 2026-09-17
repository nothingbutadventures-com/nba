from typing import List, Dict

NBA_KNOWLEDGE_DOCS = [
    {
        "id": "company_overview",
        "title": "About Nothing But Adventures (NBA)",
        "category": "about",
        "content": (
            "Nothing But Adventures (NBA) is a premier adventure travel company offering curated, "
            "small-group guided expeditions across all 7 continents. We specialize in authentic, "
            "culturally immersive, active, and wildlife journeys. Every booking contributes to our "
            "sustainability initiative where we plant trees for every traveler."
        )
    },
    {
        "id": "cancellation_policy",
        "title": "Cancellation & Refund Policy & Lifetime Deposits",
        "category": "policies",
        "content": (
            "NBA Cancellation & Refund Policy Rules:\n"
            "1. Core Definitions: Total Paid = Cash Paid + Lifetime Deposits redeemed. Required Deposit = booking percentage (standard 20%) or fixed amount per traveler. Held Deposit = Math.min(Total Paid, Required Deposit). Remainder = Total Paid - Held Deposit.\n"
            "2. Cancellation Timelines & Refunds:\n"
            "   - 60+ days before departure: 100% of the Remainder is refunded in cash/original payment method. The Held Deposit is protected and issued as a brand-new Lifetime Deposit voucher.\n"
            "   - 30 to 59 days before departure: 50% of the Remainder is refunded. The remaining 50% is forfeited. The Held Deposit is converted into a Lifetime Deposit voucher.\n"
            "   - Less than 30 days before departure: 0% of the Remainder is refunded (fully forfeited). The Held Deposit is converted into a Lifetime Deposit voucher.\n"
            "3. Lifetime Deposits Rule: Held deposits never expire and can be transferred or applied to any future NBA adventure. If a tour is marked 'exemptFromLifetimeDeposit: true', the deposit is non-refundable."
        )
    },
    {
        "id": "physical_ratings",
        "title": "Physical Activity Ratings (Levels 1 to 5)",
        "category": "guidelines",
        "content": (
            "NBA Physical Rating System:\n"
            "- Level 1 (Easy / Relaxed): Minimal physical exertion, light walking on flat surfaces, leisurely pace.\n"
            "- Level 2 (Light / Moderate): Walking 2-4 hours per day, mild elevation changes, suitable for most fitness levels.\n"
            "- Level 3 (Average / Moderate): Walking/hiking 4-6 hours per day over varied terrain, good cardiovascular health recommended.\n"
            "- Level 4 (Demanding): High-intensity trekking 6-8+ hours per day, steep ascents/descents, altitude may be involved.\n"
            "- Level 5 (Strenuous / Extreme): Rigorous endurance expeditions, technical terrain, extreme altitudes or weather conditions, high fitness required."
        )
    },
    {
        "id": "travel_styles",
        "title": "NBA Travel Styles",
        "category": "styles",
        "content": (
            "We offer multiple specialized travel styles:\n"
            "1. Classic Adventures: The perfect blend of top highlights, hidden local gems, cultural interaction, and comfortable stays.\n"
            "2. Active & Hiking: Trekking, cycling, kayaking, and outdoor exploration for active travelers.\n"
            "3. Wildlife & Safari: Expert-led wildlife tracking, national park game drives, marine safaris, and conservation focus.\n"
            "4. Cultural Journeys: Deep dives into heritage, culinary traditions, indigenous communities, and historical wonders.\n"
            "5. Family Holidays: Adventure itineraries tailored with kid-friendly activities, safety, and multi-generational pacing.\n"
            "6. Solo Travel: Small groups with zero or optional single supplements, ideal for making lifelong travel friends."
        )
    },
    {
        "id": "booking_payments",
        "title": "Booking Process, Deposits & Payment Methods",
        "category": "bookings",
        "content": (
            "Booking with Nothing But Adventures:\n"
            "- Secure your spot with a flexible deposit (typically 20% of tour price).\n"
            "- Remaining balance is due 60 days before the departure date.\n"
            "- Payment options: Visa, MasterCard, American Express, PayPal, Installment payment plans, and Lifetime Deposit voucher credits.\n"
            "- Flexible Space Hold: Reserve and hold your spot without payment for a limited window while planning flights."
        )
    },
    {
        "id": "sustainability_tree_planting",
        "title": "Sustainability & Tree Planting Initiative",
        "category": "sustainability",
        "content": (
            "For every traveler who books an adventure with NBA, we plant trees in dedicated reforestation zones around the world, "
            "supporting local ecosystems, carbon offsetting, and biodiversity."
        )
    },
    {
        "id": "what_to_bring_faq",
        "title": "General FAQs & Travel Essentials",
        "category": "faq",
        "content": (
            "General Travel Information:\n"
            "- Visas & Passports: Travelers must have a valid passport with at least 6 months validity from departure date. Visas depend on destination and citizenship.\n"
            "- Travel Insurance: Comprehensive travel medical and evacuation insurance is mandatory for all NBA expeditions.\n"
            "- Group Sizes: Most tours have an average of 10-12 travelers and a strict maximum of 16 for a personal, low-impact experience.\n"
            "- Solo Travelers: Solo travelers can share a twin room with a same-gender traveler at no extra cost, or opt for a private room upgrade."
        )
    }
]

def search_knowledge_base(query: str, top_k: int = 3) -> List[Dict]:
    """Simple keyword/relevance match over internal knowledge documents."""
    query_lower = query.lower()
    scores = []
    
    for doc in NBA_KNOWLEDGE_DOCS:
        score = 0
        title_lower = doc["title"].lower()
        content_lower = doc["content"].lower()
        
        words = [w for w in query_lower.split() if len(w) > 2]
        for word in words:
            if word in title_lower:
                score += 3
            if word in content_lower:
                score += 1
                
        if score > 0:
            scores.append((score, doc))
            
    scores.sort(key=lambda x: x[0], reverse=True)
    return [item[1] for item in scores[:top_k]]
