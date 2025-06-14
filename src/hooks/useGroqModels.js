import { useState, useEffect } from "react";
import OpenAI from "openai";

const REACT_APP_GROQ_API_KEY = process.env.NEXT_PUBLIC_GROQ_API_KEY;

export default function useGroqModels() {
  const [groqModels, setGroqModels] = useState([]);

  useEffect(() => {
    const groq = new OpenAI({
      apiKey: REACT_APP_GROQ_API_KEY,
      baseURL: "https://api.groq.com/openai/v1",
      dangerouslyAllowBrowser: true,
    });

    async function getGroqModels() {
      try {
        const res = await groq.models.list();
        setGroqModels(res.data);
      } catch (error) {
        console.log(error);
      }
    }

    getGroqModels();
  }, []);

  return { groqModels };
}