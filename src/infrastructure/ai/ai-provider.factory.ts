import { env } from "../../config/env";
import { IAIProvider } from "../../core/interfaces/ai-provider.interface";
import { MockAIProvider } from "./mock-ai.provider";
import { GeminiAIProvider } from "./gemini-ai.provider";

export class AIProviderFactory {
  private static instance: IAIProvider;

  static getProvider(): IAIProvider {
    if (!this.instance) {
      if (env.AI_PROVIDER === "gemini") {
        if (!env.GEMINI_API_KEY) {
          console.warn(
            "⚠️ Cảnh báo: GEMINI_API_KEY bị thiếu! Tự động fallback sang MockAIProvider.",
          );
          this.instance = new MockAIProvider();
        } else {
          this.instance = new GeminiAIProvider(
            env.GEMINI_API_KEY,
            env.GEMINI_MODEL,
            env.AI_TIMEOUT_MS,
            env.AI_TEMPERATURE,
          );
        }
      } else {
        this.instance = new MockAIProvider();
      }
    }
    return this.instance;
  }
}
