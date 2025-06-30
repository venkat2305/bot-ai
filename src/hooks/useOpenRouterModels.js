import { useState, useEffect } from "react";

export default function useOpenRouterModels() {
  const [openRouterModels, setOpenRouterModels] = useState([]);

  useEffect(() => {
    async function getOpenRouterModels() {
      try {
        const response = await fetch('/api/openrouter/models');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const models = await response.json();
        setOpenRouterModels(models);
      } catch (error) {
        console.error('Error fetching OpenRouter models:', error);
      }
    }

    getOpenRouterModels();
  }, []);

  return { openRouterModels };
}