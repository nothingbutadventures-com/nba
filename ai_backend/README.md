# Nothing But Adventures - AI RAG Backend (FastAPI + LangChain + Groq)

This is the dedicated Python AI backend for **Nothing But Adventures (NBA)**. It connects to the website's MongoDB database, indexes adventure tours, policies, FAQs, and travel styles, and exposes an intelligent RAG conversational agent powered by **GroqCloud** LLMs (`llama-3.3-70b-versatile` or `llama-3.1-8b-instant`).

## Features
- **Strict Guardrails**: Answers queries exclusively related to Nothing But Adventures, destinations, itineraries, pricing, departure dates, physical fitness levels, and booking/cancellation policies.
- **Dynamic Tour Retrieval**: Finds matching tours based on price, duration, fitness rating, style, and keywords, returning structured data for direct rendering in the Next.js `TourCard` component.
- **FastAPI Endpoints**:
  - `POST /api/chat`: Process conversation messages with grounded RAG context.
  - `POST /api/tours/search`: Search and filter tours directly.
  - `GET /api/quick-prompts`: Suggested prompts for travelers.
  - `GET /health`: Server and model status check.
  - `POST /api/refresh-cache`: Reload tours from MongoDB into cache.

## Quick Start

### 1. Configure Environment Variables
Copy `.env.example` to `.env` and configure your keys:
```bash
cp .env.example .env
```
Make sure to add your **GroqCloud API Key**:
```env
GROQ_API_KEY=gsk_your_actual_groq_api_key_here
MONGODB_URI=mongodb+srv://...
PORT=8000
```

### 2. Activate Virtual Environment & Run
```bash
# Activate virtual environment
source venv/bin/activate

# Start the server
python run.py
```
The server will start on `http://localhost:8000`. You can test the interactive API docs at `http://localhost:8000/docs`.
