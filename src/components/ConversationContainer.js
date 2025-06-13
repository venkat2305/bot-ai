import React from "react";
import InputBar from "../components/InputBar";
import ConversationComp from "../components/ConversationComp";
import ConversationStarter from "../components/ConversationStarter";
import siteIcon from "../assets/site-icon.png";
import sampleData from "../assets/sampleData.json";
import useConversation from "../hooks/useConversation";
import useOpenRouterModels from "../hooks/useOpenRouterModels";
import useGroqModels from "../hooks/useGroqModels";

function ConversationContainer() {
  const {
    currentSession,
    isStreaming,
    streamingResponse,
    loading,
    selectedModelType,
    setSelectedModelType,
    selectedModel,
    setSelectedModel,
    onAsk,
    onSave,
  } = useConversation();

  const { openRouterModels } = useOpenRouterModels();
  const { groqModels } = useGroqModels();
  const perplexityModels = ["r1-1776"];

  const conversationStarters = React.useMemo(() => {
    const starters = [];
    let t = 4;
    while (t--) {
      let randNum = Math.floor(Math.random() * sampleData.length);
      starters.push({
        question: sampleData[randNum].question,
        subtext: "Get immediate AI generated response",
      });
    }
    return starters;
  }, []);

  const [inputText, setInputText] = React.useState("");

  return (
    <div className="flex flex-col justify-between p-3 h-screen gap-12">
      <div className="flex flex-col gap-4 flex-1">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-bold text-[var(--primary-color)]">Bot AI</h1>
          <div className="flex gap-3">
            <select
              className="border rounded p-1 text-sm bg-white dark:bg-gray-800 dark:text-white"
              value={selectedModelType}
              onChange={(e) => setSelectedModelType(e.target.value)}
            >
              <option value="groq">Groq Models</option>
              <option value="openrouter">OpenRouter Models</option>
              <option value="perplexity">Perplexity</option>
            </select>
            <select
              className="border rounded p-1 text-sm bg-white dark:bg-gray-800 dark:text-white"
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
            >
              {selectedModelType === "groq"
                ? groqModels.map((model) => (
                    <option value={model.id} key={model.id}>
                      {model.id}
                    </option>
                  ))
                : selectedModelType === "openrouter"
                ? openRouterModels.map((model) => (
                    <option value={model.id} key={model.id}>
                      {model.name}
                    </option>
                  ))
                : perplexityModels.map((model) => (
                    <option value={model} key={model}>
                      {model}
                    </option>
                  ))}
            </select>
          </div>
        </div>
        {currentSession.length ? (
          <div className="flex flex-col gap-2 flex-1 overflow-y-auto">
            {currentSession.map((item) => (
              <ConversationComp
                key={item.time}
                who={item.who}
                quesAns={item.quesAns}
                time={item.time}
              />
            ))}
            {isStreaming && (
              <ConversationComp
                who="Soul AI"
                quesAns={streamingResponse}
                time={new Date().toLocaleString()}
              />
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center flex-1 gap-2">
            <h2 className="text-xl font-semibold">How Can I Help You Today?</h2>
            <img src={siteIcon} alt="site icon" />
          </div>
        )}
      </div>
      {loading && <div className="text-center">Loading...</div>}
      <div className="space-y-4">
        {currentSession.length === 0 && (
          <div className="grid grid-cols-2 gap-6">
            {conversationStarters.map((item) => (
              <ConversationStarter
                key={item.question}
                question={item.question}
                subtext={item.subtext}
                onAsk={onAsk}
              />
            ))}
          </div>
        )}
        <InputBar
          inputText={inputText}
          setInputText={setInputText}
          onAsk={(question) => onAsk(question)}
          onSave={onSave}
        />
      </div>
    </div>
  );
}

export default ConversationContainer;
