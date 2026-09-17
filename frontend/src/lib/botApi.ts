export interface BotMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface BotTourFilters {
  destination?: string;
  travelStyle?: string;
  maxPrice?: number;
  maxDays?: number;
  minDays?: number;
  physicalRating?: number;
}

export interface BotChatResponse {
  reply: string;
  tours: Array<any>;
  suggested_questions: string[];
}

export interface QuickPrompt {
  title: string;
  query: string;
}

const AI_API_BASE_URL =
  process.env.NEXT_PUBLIC_AI_API_URL || "http://localhost:8000";

export const botApi = {
  async sendMessage(
    messages: BotMessage[],
    filters?: BotTourFilters
  ): Promise<BotChatResponse> {
    try {
      const response = await fetch(`${AI_API_BASE_URL}/api/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages,
          filters: filters || {},
        }),
      });

      if (!response.ok) {
        throw new Error(`AI Service returned status ${response.status}`);
      }

      return await response.json();
    } catch (err: any) {
      console.warn("AI Backend API fetch error, utilizing client fallback:", err);
      // Fallback response if AI service is starting up or offline
      return {
        reply:
          "Welcome to Nothing But Adventures! I am currently initializing my expedition intelligence engine. Please ask me about our popular hiking, safari, cultural tours, or cancellation policies!",
        tours: [],
        suggested_questions: [
          "Show me top popular tours",
          "What is your cancellation policy?",
          "Find trekking adventures under 10 days",
        ],
      };
    }
  },

  async getQuickPrompts(): Promise<QuickPrompt[]> {
    try {
      const response = await fetch(`${AI_API_BASE_URL}/api/quick-prompts`);
      if (response.ok) {
        const data = await response.json();
        return data.prompts || [];
      }
    } catch (err) {
      console.warn("Failed to fetch quick prompts:", err);
    }
    return [
      {
        title: "Trekking in Nepal & Peru",
        query: "Show me hiking and trekking tours under 12 days",
      },
      {
        title: "Wildlife & Safari",
        query: "What are the best wildlife safari tours in Africa?",
      },
      {
        title: "Budget-Friendly Trips",
        query: "Show me adventures under $2500",
      },
      {
        title: "Cancellation Policy",
        query: "How does the cancellation policy and Lifetime Deposit work?",
      },
      {
        title: "Easy / Relaxed Pacing",
        query: "Find cultural and classic tours with physical rating level 1 or 2",
      },
    ];
  },

  async checkHealth(): Promise<{ status: string; tours_cached: number }> {
    try {
      const response = await fetch(`${AI_API_BASE_URL}/health`);
      if (response.ok) {
        return await response.json();
      }
    } catch (err) {}
    return { status: "offline", tours_cached: 0 };
  },
};
