import { useState, useEffect } from "react";

export interface GroqModel {
  id: string;
  object: string;
  created: number;
  owned_by: string;
}

export default function useGroqModels() {
  const [groqModels, setGroqModels] = useState<GroqModel[]>([]);

  useEffect(() => {
    async function getGroqModels(): Promise<void> {
      try {
        const response = await fetch('/api/groq/models');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const models: GroqModel[] = await response.json();
        setGroqModels(models);
      } catch (error) {
        console.error('Error fetching Groq models:', error);
      }
    }

    getGroqModels();
  }, []);

  return { groqModels };
}