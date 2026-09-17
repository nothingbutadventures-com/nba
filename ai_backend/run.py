import uvicorn
from config import settings

if __name__ == "__main__":
    print(f"🚀 Starting Nothing But Adventures AI Backend on http://{settings.HOST}:{settings.PORT}")
    print(f"📖 Swagger Docs available at http://{settings.HOST}:{settings.PORT}/docs")
    uvicorn.run("main:app", host=settings.HOST, port=settings.PORT, reload=True)
