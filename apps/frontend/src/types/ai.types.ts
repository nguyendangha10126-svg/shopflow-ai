export type MatchStatus = 'MATCHED' | 'AMBIGUOUS' | 'OUT_OF_STOCK' | 'NOT_FOUND';

export interface MatchedOrderItem {
  raw_text: string;
  product_name_query: string;
  quantity: number;
  match_status: MatchStatus;
  product_id?: string;
  product_name?: string;
  variant_id?: string;
  variant_name?: string;
  sku?: string;
  price_vnd?: number;
  stock?: number;
  potential_matches?: Array<{
    variant_id: string;
    variant_name: string;
    sku: string;
    price_vnd: number;
    stock: number;
  }>;
  notes?: string;
}

export interface ProcessedAIDraftResult {
  intent: string;
  confidence: number;
  needs_clarification: boolean;
  questions_for_staff: string[];
  warning_flags: string[];
  customer: {
    name: string | null;
    phone: string | null;
    address: string | null;
  };
  matched_items: MatchedOrderItem[];
  raw_anonymized_message: string;
  draft_order_id?: string;
  order_number?: number;
  total_estimate_vnd: number;
  telemetry: {
    model: string;
    latency_ms: number;
    tokens: {
      input: number;
      output: number;
      total: number;
    };
  };
}

