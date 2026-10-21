export interface ExtractedOrderItem {
  raw_text: string;
  suggested_product_name: string;
  suggested_sku?: string;
  color?: string;
  size?: string;
  quantity: number;
}

export interface ExtractedCustomerInfo {
  name?: string;
  phone?: string;
  address?: string;
}

export interface ExtractedOrderResult {
  customer: ExtractedCustomerInfo;
  items: ExtractedOrderItem[];
  raw_tokens_used: number;
  confidence_score: number;
}

export interface IAIProvider {
  extractDraftOrder(rawMessage: string): Promise<ExtractedOrderResult>;
  answerFaq(question: string, contextChunks: string[]): Promise<string>;
}
