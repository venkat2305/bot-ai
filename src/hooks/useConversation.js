import { useState, useEffect } from "react";
import OpenAI from "openai";
import { setChatData } from "../utils/localStorageUtils";

// Environment variables
const OPENROUTER_API_KEY = process.env.REACT_APP_OPENROUTER_API_KEY;
const REACT_APP_GROQ_API_KEY = process.env.REACT_APP_GROQ_API_KEY;
const REACT_APP_PERPLEXITY_API_KEY = process.env.REACT_APP_PERPLEXITY_API_KEY;

export default function useConversation() {
  const [currentSession, setCurrentSession] = useState([]);
  const [selectedModelType, setSelectedModelType] = useState("groq");
  const [selectedModel, setSelectedModel] = useState(
    "meta-llama/llama-4-maverick-17b-128e-instruct"
  );
  const [loading, setLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingResponse, setStreamingResponse] = useState("");

  useEffect(() => {
    // Reset session or load if needed
    setCurrentSession([]);
  }, []);

  useEffect(() => {
    // Optionally set default models when user changes model types
    if (selectedModelType === "groq") {
      setSelectedModel("meta-llama/llama-4-maverick-17b-128e-instruct");
    } else if (selectedModelType === "openrouter") {
      setSelectedModel("deepseek/deepseek-r1:free");
    } else {
      setSelectedModel("r1-1776");
    }
  }, [selectedModelType]);

  const onAsk = async (input) => {
    const newUserMessage = {
      who: "user",
      quesAns: input,
      time: new Date().toLocaleString(),
    };
    setCurrentSession((prev) => [...prev, newUserMessage]);
    await getAiAnswer(input);
  };

  const getAiAnswer = async (input) => {
    setLoading(true);
    setIsStreaming(true);
    setStreamingResponse("");
    let fullResponse = "";

    // Convert currentSession to proper messages format
    const messages = [];
    
    // Add all previous messages from the session
    currentSession.forEach((item) => {
      if (item.who === "user") {
        messages.push({ role: "user", content: item.quesAns });
      } else {
        messages.push({ role: "assistant", content: item.quesAns });
      }
    });
    
    // Add the new user message
    messages.push({ role: "user", content: input });

    try {
      if (selectedModelType === "perplexity") {
        const response = await fetch(
          "https://api.perplexity.ai/chat/completions",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${REACT_APP_PERPLEXITY_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: selectedModel,
              messages: messages,
            }),
          }
        );
        const data = await response.json();
        fullResponse = data.choices[0].message.content;
        setCurrentSession((prev) => [
          ...prev,
          {
            who: "Soul AI",
            quesAns: fullResponse,
            time: new Date().toLocaleString(),
            rating: 0,
            feedback: "",
          },
        ]);
        setIsStreaming(false);
      } else if (selectedModelType === "groq") {
        const groqAPI = new OpenAI({
          apiKey: REACT_APP_GROQ_API_KEY,
          baseURL: "https://api.groq.com/openai/v1",
          dangerouslyAllowBrowser: true,
        });
        const stream = await groqAPI.chat.completions.create({
          model: selectedModel,
          messages: messages,
          stream: true,
        });

        for await (const chunk of stream) {
          const content = chunk.choices[0]?.delta?.content || "";
          fullResponse += content;
          setStreamingResponse((prev) => prev + content);
        }

        // Final update
        setCurrentSession((prev) => [
          ...prev,
          {
            who: "Soul AI",
            quesAns: fullResponse,
            time: new Date().toLocaleString(),
            rating: 0,
            feedback: "",
          },
        ]);
        setIsStreaming(false);
        setStreamingResponse("");
      } else if (selectedModelType === "openrouter") {
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${OPENROUTER_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: selectedModel,
            messages: messages,
            stream: true,
          }),
        });

        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split("\n").filter((line) => line.trim() !== "");

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6);
              if (data === "[DONE]") continue;

              try {
                const parsed = JSON.parse(data);
                const content = parsed.choices[0]?.delta?.content || "";
                fullResponse += content;
                setStreamingResponse((prev) => prev + content);
              } catch (e) {
                console.error("Error parsing JSON:", e);
              }
            }
          }
        }

        setCurrentSession((prev) => [
          ...prev,
          {
            who: "Soul AI",
            quesAns: fullResponse,
            time: new Date().toLocaleString(),
            rating: 0,
            feedback: "",
          },
        ]);
        setIsStreaming(false);
        setStreamingResponse("");
      }
    } catch (error) {
      console.log(error);
      setIsStreaming(false);
      setStreamingResponse("");
    } finally {
      setLoading(false);
    }
  };

  const onSave = () => {
    setChatData(currentSession);
    console.log("session saved", currentSession);
  };

  const updateRatingFeedback = (time, rating, feedback) => {
    setCurrentSession((prev) => {
      const index = prev.findIndex((item) => item.time === time);
      if (index !== -1) {
        const updated = [...prev];
        updated[index].rating = rating;
        updated[index].feedback = feedback;
        return updated;
      }
      return prev;
    });
  };

  return {
    currentSession,
    selectedModelType,
    setSelectedModelType,
    selectedModel,
    setSelectedModel,
    loading,
    isStreaming,
    streamingResponse,
    onAsk,
    onSave,
    updateRatingFeedback,
  };
}