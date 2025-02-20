import { useState, useEffect } from "react";

export default function useOpenRouterModels() {
  const [openRouterModels, setOpenRouterModels] = useState([]);

  useEffect(() => {
    async function getOpenRouterModels() {
      try {
        const response = await fetch("https://openrouter.ai/api/v1/models", {
          headers: {
            "Content-Type": "application/json",
          },
        });
        const data = await response.json();
        const freeModelArr = data.data.filter(
          (model) =>
            model.pricing.prompt === "0" && model.pricing.completion === "0"
        );
        setOpenRouterModels(freeModelArr);
      } catch (error) {
        console.log(error);
      }
    }

    getOpenRouterModels();
  }, []);

  return { openRouterModels };
}