import { useState, useEffect } from "react";
import OpenAI from "openai";
import { 
  saveChat, 
  generateChatId, 
  generateChatTitle, 
  getChatById 
} from "../utils/localStorageUtils";

// Environment variables
const OPENROUTER_API_KEY = process.env.REACT_APP_OPENROUTER_API_KEY;
const REACT_APP_GROQ_API_KEY = process.env.REACT_APP_GROQ_API_KEY;
const REACT_APP_PERPLEXITY_API_KEY = process.env.REACT_APP_PERPLEXITY_API_KEY;

export default function useConversation(initialChatId = null) {
  const [currentChatId, setCurrentChatId] = useState(initialChatId);
  const [currentSession, setCurrentSession] = useState([]);
  const [selectedModelType, setSelectedModelType] = useState("groq");
  const [selectedModel, setSelectedModel] = useState(
    "meta-llama/llama-4-maverick-17b-128e-instruct"
  );
  const [loading, setLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingResponse, setStreamingResponse] = useState("");

  useEffect(() => {
    if (initialChatId) {
      loadChat(initialChatId);
    } else {
      setCurrentSession([]);
      setCurrentChatId(null);
    }
  }, [initialChatId]);

  const loadChat = (chatId) => {
    const chat = getChatById(chatId);
    if (chat) {
      setCurrentChatId(chatId);
      setCurrentSession(chat.messages || []);
      setSelectedModelType(chat.modelType || "groq");
      setSelectedModel(chat.model || "meta-llama/llama-4-maverick-17b-128e-instruct");
    }
  };

  const startNewChat = () => {
    setCurrentChatId(null);
    setCurrentSession([]);
    setSelectedModelType("groq");
    setSelectedModel("meta-llama/llama-4-maverick-17b-128e-instruct");
  };

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
    await getAiAnswer(input, newUserMessage);
  };

  // Helper function to check if a model is a reasoning model
  const isReasoningModel = (modelType, modelId) => {
    const reasoningModels = [
      'deepseek/deepseek-r1',
      'deepseek/deepseek-r1:free',
      'r1-1776',
      'meta-llama/llama-4-maverick-17b-128e-instruct'
    ];
    return reasoningModels.some(model => modelId.includes(model) || modelId === model);
  };

  const getAiAnswer = async (input, newUserMessage) => {
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
              stream: isReasoningModel(selectedModelType, selectedModel),
            }),
          }
        );

        if (isReasoningModel(selectedModelType, selectedModel)) {
          // Handle streaming for reasoning models
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
        } else {
          // Handle non-streaming for non-reasoning models
          const data = await response.json();
          fullResponse = data.choices[0].message.content;
        }

        const aiMessage = {
          who: "Soul AI",
          quesAns: fullResponse,
          time: new Date().toLocaleString(),
          rating: 0,
          feedback: "",
        };
        const updatedSession = [...currentSession, newUserMessage, aiMessage];
        setCurrentSession(updatedSession);
        await autoSave(updatedSession);
        setIsStreaming(false);
        setStreamingResponse("");
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
        const aiMessage = {
          who: "Soul AI",
          quesAns: fullResponse,
          time: new Date().toLocaleString(),
          rating: 0,
          feedback: "",
        };
        const updatedSession = [...currentSession, newUserMessage, aiMessage];
        setCurrentSession(updatedSession);
        await autoSave(updatedSession);
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

        const aiMessage = {
          who: "Soul AI",
          quesAns: fullResponse,
          time: new Date().toLocaleString(),
          rating: 0,
          feedback: "",
        };
        const updatedSession = [...currentSession, newUserMessage, aiMessage];
        setCurrentSession(updatedSession);
        await autoSave(updatedSession);
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

  const autoSave = async (updatedSession) => {
    if (updatedSession.length === 0) return;

    let chatId = currentChatId;
    let title = "";
    
    if (!chatId) {
      chatId = generateChatId();
      setCurrentChatId(chatId);
      title = generateChatTitle(updatedSession[0]?.quesAns);
    }

    const chatData = {
      id: chatId,
      title: title || generateChatTitle(updatedSession[0]?.quesAns),
      messages: updatedSession,
      modelType: selectedModelType,
      model: selectedModel
    };

    const success = saveChat(chatData);
    if (success) {
      console.log("Chat auto-saved:", chatId);
    }
    return chatId;
  };

  const onSave = async () => {
    const chatId = await autoSave(currentSession);
    console.log("Chat manually saved:", chatId);
    return chatId;
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
    currentChatId,
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
    loadChat,
    startNewChat,
  };
}