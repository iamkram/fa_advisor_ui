/**
 * FA AI System Backend API Client
 * Connects to the LangGraph-based FA AI System for real-time queries
 */

interface FAIQueryRequest {
  query: string;
  fa_id?: string;
  client_id?: number;
  include_news?: boolean;
  query_type?: string;
}

interface FAIQueryResponse {
  response: string;
  sources?: Array<{
    type: string;
    content: string;
    url?: string;
  }>;
  execution_time_ms: number;
  tokens_used?: number;
}

interface FAIBatchRequest {
  tickers: string[];
  date?: string;
}

interface FAIBatchResponse {
  status: string;
  batch_id: string;
  stocks_processed: number;
  execution_time_ms: number;
}

export class FAIClient {
  private baseUrl: string;
  private timeout: number;

  constructor(baseUrl: string = "http://localhost:8000", timeout: number = 60000) {
    this.baseUrl = baseUrl;
    this.timeout = timeout;
  }

  /**
   * Send an interactive query to the FA AI System
   */
  async query(request: FAIQueryRequest): Promise<FAIQueryResponse> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(`${this.baseUrl}/api/v1/query`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: request.query,
          fa_id: request.fa_id,
          client_id: request.client_id,
          include_news: request.include_news ?? true,
          query_type: request.query_type ?? "meeting_prep",
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`FA AI System returned ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof Error) {
        if (error.name === "AbortError") {
          throw new Error("FA AI System query timed out");
        }
        throw new Error(`FA AI System error: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Trigger a batch processing run
   */
  async triggerBatch(request: FAIBatchRequest): Promise<FAIBatchResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/batch/run`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tickers: request.tickers,
          date: request.date,
        }),
      });

      if (!response.ok) {
        throw new Error(`FA AI System returned ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`FA AI System batch error: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Get batch processing status
   */
  async getBatchStatus(batchId: string): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/batch/${batchId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`FA AI System returned ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`FA AI System batch status error: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/health`, {
        method: "GET",
        signal: AbortSignal.timeout(5000),
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}

// Singleton instance
export const faAiClient = new FAIClient(
  process.env.FA_AI_SYSTEM_URL || "https://8000-iobtysnaf9hp9h92n3sxp-1d223801.manusvm.computer",
  parseInt(process.env.FA_AI_SYSTEM_TIMEOUT || "60000")
);
