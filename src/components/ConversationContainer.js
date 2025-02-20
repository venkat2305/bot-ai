import React from "react";
import { Select, Space, Typography, Spin, Flex } from "antd";
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
    updateRatingFeedback,
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
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "10px",
        height: "100vh",
        flexGrow: 1,
        gap: "50px",
      }}
    >
      <Flex style={{ flexGrow: 1 }} vertical justify="space-between">
        <Space style={{ justifyContent: "space-between" }}>
          <Typography.Title level={4} style={{ color: "#9785BA" }}>
            Bot AI
          </Typography.Title>
          <Space>
            <Select
              style={{ width: 300 }}
              value={selectedModelType}
              onChange={(value) => setSelectedModelType(value)}
            >
              <Select.Option value="groq">Groq Models</Select.Option>
              <Select.Option value="openrouter">OpenRouter Models</Select.Option>
              <Select.Option value="perplexity">Perplexity</Select.Option>
            </Select>
            <Select
              style={{ width: 300 }}
              value={selectedModel}
              onChange={(value) => setSelectedModel(value)}
            >
              {selectedModelType === "groq"
                ? groqModels.map((model) => (
                    <Select.Option value={model.id} key={model.id}>
                      {model.id}
                    </Select.Option>
                  ))
                : selectedModelType === "openrouter"
                ? openRouterModels.map((model) => (
                    <Select.Option value={model.id} key={model.id}>
                      {model.name}
                    </Select.Option>
                  ))
                : perplexityModels.map((model) => (
                    <Select.Option value={model} key={model}>
                      {model}
                    </Select.Option>
                  ))}
            </Select>
          </Space>
        </Space>
        {currentSession.length ? (
          <Flex vertical justify="flex-start">
            {currentSession.map((item) => (
              <ConversationComp
                key={item.time}
                who={item.who}
                quesAns={item.quesAns}
                time={item.time}
                updateRatingFeedback={updateRatingFeedback}
                rating={item.rating}
                feedback={item.feedback}
              />
            ))}
            {isStreaming && (
              <ConversationComp
                who="Soul AI"
                quesAns={streamingResponse}
                time={new Date().toLocaleString()}
                updateRatingFeedback={() => {}}
                rating={0}
                feedback=""
              />
            )}
          </Flex>
        ) : (
          <>
            <Space direction="vertical" align="center">
              <Typography.Title level={3}>
                How Can I Help You Today?
              </Typography.Title>
              <img src={siteIcon} alt="site icon" />
            </Space>
            <Space
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "25px",
              }}
            >
              {conversationStarters.map((item) => (
                <ConversationStarter
                  key={item.question}
                  question={item.question}
                  subtext={item.subtext}
                  onAsk={onAsk}
                />
              ))}
            </Space>
          </>
        )}
      </Flex>
      {loading && <Spin size="large" />}
      <div>
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