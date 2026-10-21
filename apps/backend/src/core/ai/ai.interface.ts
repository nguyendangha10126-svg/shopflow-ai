export interface AIParsingParams {
  rawMessage: string;
  anonymizedMessage: string;
  shopContext?: {
    shopId: string;
    shopName?: string;
  };
  scenario?: string; // Hỗ trợ MockProvider chuyển đổi kịch bản trong dev/test
  timeoutMs?: number;
}

export interface AITokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export interface AIParsingRawOutput {
  rawResponseText: string;
  model: string;
  latencyMs: number;
  tokens: AITokenUsage;
}

export interface AIProvider {
  readonly name: string;
  parseDraftOrder(params: AIParsingParams): Promise<AIParsingRawOutput>;
}

