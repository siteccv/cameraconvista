import { useState } from "react";
import { apiRequest } from "@/lib/queryClient";

interface TranslateOptions {
  context?: string;
}

interface UseTranslationResult {
  translate: (text: string, options?: TranslateOptions) => Promise<string>;
  isTranslating: boolean;
  error: string | null;
}

export function useTranslation(): UseTranslationResult {
  const [isTranslating, setIsTranslating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const translate = async (text: string, options?: TranslateOptions): Promise<string> => {
    if (!text.trim()) {
      return "";
    }

    setIsTranslating(true);
    setError(null);

    try {
      const response = await apiRequest("POST", "/api/admin/translate", {
        text,
        context: options?.context,
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Translation failed");
      }

      return data.translation;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Translation failed";
      setError(message);
      throw err;
    } finally {
      setIsTranslating(false);
    }
  };

  return { translate, isTranslating, error };
}
