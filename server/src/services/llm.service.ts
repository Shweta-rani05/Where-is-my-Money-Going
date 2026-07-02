import { GoogleGenAI } from '@google/genai';
import { ExtractedContent } from './ocr.service';

export interface ParsedTransaction {
  amount: number;
  type: 'income' | 'expense';
  category: 'Food' | 'Rent' | 'Shopping' | 'Transport' | 'Bills' | 'Healthcare' | 'Entertainment' | 'Investment' | 'Salary' | 'Others';
  paymentMethod: 'Cash' | 'Credit Card' | 'Bank Transfer' | 'UPI' | 'Others';
  notes: string;
  date: string;
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const withRetry = async <T>(operation: () => Promise<T>, maxRetries = 3): Promise<T> => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error: any) {
      const isRateLimit = error?.status === 429 || error?.message?.includes('429') || error?.message?.includes('RESOURCE_EXHAUSTED');
      const isUnavailable = error?.status === 503 || error?.message?.includes('503') || error?.message?.includes('UNAVAILABLE');
      
      if ((isRateLimit || isUnavailable) && attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
        console.warn(`[LLM Service] API overloaded/rate-limited (Attempt ${attempt}). Retrying in ${delay}ms...`);
        await sleep(delay);
        continue;
      }
      throw error;
    }
  }
  throw new Error('All retries failed.');
};

export const llmService = {
  /**
   * Parses raw extracted OCR data or image into structured JSON transactions
   */
  parseStatement: async (content: ExtractedContent): Promise<ParsedTransaction[]> => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is missing. Cannot parse statement.');
    }

    const ai = new GoogleGenAI({ apiKey });

    const systemPrompt = `You are a highly accurate financial data extraction assistant.
Your job is to read a bank statement and extract ALL transactions into a strict JSON array.
Map the extracted data to the following JSON schema:
[
  {
    "amount": Number (absolute value, no currency symbols),
    "type": "income" or "expense",
    "category": exactly one of ["Food", "Rent", "Shopping", "Transport", "Bills", "Healthcare", "Entertainment", "Investment", "Salary", "Others"],
    "paymentMethod": exactly one of ["Bank Transfer", "Credit Card", "UPI", "Cash", "Others"],
    "notes": String (Cleaned up description/merchant name, max 200 chars),
    "date": String (ISO 8601 format: YYYY-MM-DD)
  }
]

RULES:
1. Return ONLY valid JSON. Do not include markdown formatting like \`\`\`json.
2. Carefully classify "type": money going out is "expense", money coming in is "income".
3. Intelligently guess the "category" based on the merchant or description.
4. Intelligently guess "paymentMethod". If unsure, use "Bank Transfer".
5. If the year is missing from the date, assume the current year. Ensure the date is valid.
6. Do NOT include opening balance, closing balance, or summary lines as transactions.`;

    let contents: any[] = [];
    if (content.type === 'text') {
      contents = [content.data];
    } else if (content.type === 'image') {
      contents = [{
        inlineData: {
          mimeType: content.mimeType,
          data: content.data
        }
      }];
    }

    try {
      const response = await withRetry(() => 
        ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: contents,
          config: {
            systemInstruction: systemPrompt,
            responseMimeType: "application/json"
          }
        })
      );

      const text = response.text;
      
      if (!text) {
        throw new Error('LLM returned empty response.');
      }

      // Sometimes the LLM might still wrap in markdown despite instructions
      let cleanText = text.trim();
      if (cleanText.startsWith('```json')) {
        cleanText = cleanText.replace(/```json/g, '').replace(/```/g, '').trim();
      } else if (cleanText.startsWith('```')) {
        cleanText = cleanText.replace(/```/g, '').trim();
      }

      const parsed: ParsedTransaction[] = JSON.parse(cleanText);
      
      // Basic validation filter
      return parsed.filter(t => t.amount > 0 && t.type && t.date);
    } catch (error: any) {
      console.error('[LLM Service] Parse Error:', error);
      
      const isRateLimit = error?.status === 429 || error?.message?.includes('429') || error?.message?.includes('RESOURCE_EXHAUSTED');
      if (isRateLimit) {
        throw new Error('Gemini API rate limit exceeded (Free Tier). Please wait a moment before trying again.');
      }
      
      throw new Error('Failed to parse the statement into transactions.');
    }
  }
};

