import { useState, useEffect } from "react";

export default function useGroqModels() {
  const [groqModels, setGroqModels] = useState([]);

  useEffect(() => {
    async function getGroqModels() {
      try {
        const response = await fetch('/api/groq/models');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const models = await response.json();
        setGroqModels(models);
      } catch (error) {
        console.error('Error fetching Groq models:', error);
      }
    }

    getGroqModels();
  }, []);

  return { groqModels };
}