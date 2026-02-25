import { useState, useCallback } from "react";
import { v4 as uuidv4 } from "uuid";

export interface TextQuote {
  id: string;
  text: string;
  sourceMessageId: string;
  sourceType: "ai" | "human";
}

export function useTextQuotes() {
  const [quotes, setQuotes] = useState<TextQuote[]>([]);

  const addQuote = useCallback(
    (text: string, sourceMessageId: string, sourceType: "ai" | "human") => {
      setQuotes((prev) => [
        ...prev,
        { id: uuidv4(), text, sourceMessageId, sourceType },
      ]);
    },
    [],
  );

  const updateQuote = useCallback((id: string, newText: string) => {
    setQuotes((prev) =>
      prev.map((q) => (q.id === id ? { ...q, text: newText } : q)),
    );
  }, []);

  const removeQuote = useCallback((id: string) => {
    setQuotes((prev) => prev.filter((q) => q.id !== id));
  }, []);

  const clearQuotes = useCallback(() => {
    setQuotes([]);
  }, []);

  const setQuotesFromTexts = useCallback((texts: string[]) => {
    setQuotes(
      texts.map((text) => ({
        id: uuidv4(),
        text,
        sourceMessageId: "",
        sourceType: "ai" as const,
      })),
    );
  }, []);

  const hasQuotes = quotes.length > 0;

  const toMetadata = useCallback(():
    | { selected_text: string[] }
    | undefined => {
    if (quotes.length === 0) return undefined;
    return { selected_text: quotes.map((q) => q.text) };
  }, [quotes]);

  return {
    quotes,
    addQuote,
    updateQuote,
    removeQuote,
    clearQuotes,
    setQuotesFromTexts,
    hasQuotes,
    toMetadata,
  };
}
