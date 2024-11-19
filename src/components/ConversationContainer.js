import { Flex, Select, Space, Spin, Typography } from "antd"
import InputBar from "./InputBar"
import siteIcon from '../assets/site-icon.png'
import ConversationStarter from "./ConversationStarter"
import sampleData from '../assets/sampleData.json'
import { useEffect, useState } from "react"
import ConversationComp from "./ConversationComp"
import Groq from "groq-sdk";

const freeModels = [
    {
        id: 0,
        model_name: "Nous: Hermes 3 405B Instruct",
        model_id: "nousresearch/hermes-3-llama-3.1-405b:free",
    },
    {
        id: 1,
        model_name: "Nous: Hermes 3 405B Instruct (extended)",
        model_id: "nousresearch/hermes-3-llama-3.1-405b:extended",
    },
    {
        id: 2,
        model_name: "Meta: Llama 3.1 8B Instruct (free)",
        model_id: "meta-llama/llama-3.1-8b-instruct:free",
    },
    {
        id: 3,
        model_name: "Qwen 2 7B Instruct (free)",
        model_id: "qwen/qwen-2-7b-instruct:free",
    },
    {
        id: 4,
        model_name: "Google: Gemma 2 9B (free)",
        model_id: "google/gemma-2-9b-it:free",
    },
    {
        id: 5,
        model_name: "Mistral: Mistral 7B Instruct (free)",
        model_id: "mistralai/mistral-7b-instruct:free",
    },
    {
        id: 6,
        model_name: "Phi-3 Mini 128K Instruct (free)",
        model_id: "microsoft/phi-3-mini-128k-instruct:free",
    },
    {
        id: 7,
        model_name: "Phi-3 Medium 128K Instruct (free)",
        model_id: "microsoft/phi-3-medium-128k-instruct:free",
    },
    {
        id: 8,
        model_name: "Meta: Llama 3 8B Instruct (free)",
        model_id: "meta-llama/llama-3-8b-instruct:free",
    },
    {
        id: 9,
        model_name: "Google: Gemma 7B (free)",
        model_id: "google/gemma-7b-it:free",
    },
    {
        id: 10,
        model_name: "RWKV v5: Eagle 7B",
        model_id: "recursal/eagle-7b",
    },
    {
        id: 11,
        model_name: "RWKV v5 3B AI Town",
        model_id: "recursal/rwkv-5-3b-ai-town",
    },
    {
        id: 12,
        model_name: "RWKV v5 World 3B",
        model_id: "rwkv/rwkv-5-world-3b",
    },
    {
        id: 13,
        model_name: "MythoMist 7B (free)",
        model_id: "gryphe/mythomist-7b:free",
    },
    {
        id: 14,
        model_name: "Nous: Capybara 7B (free)",
        model_id: "nousresearch/nous-capybara-7b:free",
    },
    {
        id: 15,
        model_name: "OpenChat 3.5 7B (free)",
        model_id: "openchat/openchat-7b:free",
    },
    {
        id: 16,
        model_name: "Toppy M 7B (free)",
        model_id: "undi95/toppy-m-7b:free",
    },
    {
        id: 17,
        model_name: "Hugging Face: Zephyr 7B (free)",
        model_id: "huggingfaceh4/zephyr-7b-beta:free",
    },
];

const OPENROUTER_API_KEY = process.env.REACT_APP_OPENROUTER_API_KEY;
const REACT_APP_GROQ_API_KEY = process.env.REACT_APP_GROQ_API_KEY

let conversationStarters = []
let t = 4
while (t--) {
    let randNum = Math.floor(Math.random() * sampleData.length)
    conversationStarters.push({
        question: sampleData[randNum].question,
        subtext: "Get immediate AI generated response"
    })
}

function ConversationContainer() {

    const [currentSession, setCurrentSession] = useState([])
    const [inputText, setInputText] = useState("")
    const [loading, setLoading] = useState(false)
    const [openRouterModels, setOpenRouterModels] = useState([])
    const [selectedModel, setSelectedModel] = useState(openRouterModels?.find(model => model?.id === "nousresearch/hermes-3-llama-3.1-405b:free")?.id)
    const [groqModels, setGroqModels] = useState([])
    const [streamingResponse, setStreamingResponse] = useState("");
    const [isStreaming, setIsStreaming] = useState(false);

    const groq = new Groq({ apiKey: REACT_APP_GROQ_API_KEY, dangerouslyAllowBrowser: true });

    const getGroqModels = async () => {
        const res = await groq.models.list();
        setGroqModels(res.data)
    };

    const getOpenRouterModels = async () => {
        try {
            const res = await fetch('https://openrouter.ai/api/v1/models', {
                headers: {
                    'Content-Type': 'application/json'
                }
            })
            const data = await res.json()
            const freeModelArr = data.data.filter(model => {
                return model.pricing.prompt === "0" && model.pricing.completion === "0" ? true : false
            })
            console.log(freeModelArr)
            setOpenRouterModels(freeModelArr)
        } catch (e) {
            console.log(e)
        }
    }

    useEffect(() => {
        setCurrentSession([])
        getOpenRouterModels()
        getGroqModels()
    }, [])

    useEffect(() => {
        // Set the default model once the openRouterModels are fetched
        if (openRouterModels.length > 0) {
            const defaultModel = openRouterModels.find(model => model.id === "nousresearch/hermes-3-llama-3.1-405b:free");
            if (defaultModel) {
                setSelectedModel(defaultModel.id);
            } else {
                setSelectedModel(openRouterModels[0].id); // Fallback to the first available model
            }
        }
    }, [openRouterModels]);

    const getAiAnwer = async (input) => {
        let fullContext = ""
        currentSession.forEach(item => {
            fullContext += `user question or AI response : ${item.who} question or answer ${item.quesAns}`
        })
        fullContext += ` my new question is ${input}`
        setLoading(true)
        setIsStreaming(true)
        setStreamingResponse("");
        let fullResponse = ""; // Store the complete response

        try {
            const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    "model": freeModels[0].model_id,
                    "messages": [
                        { "role": "user", "content": fullContext },
                    ],
                    "stream": true
                })
            });

            const reader = response.body.getReader();
            const decoder = new TextDecoder();

            while (true) {
                const { value, done } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value);
                const lines = chunk.split('\n').filter(line => line.trim() !== '');

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const data = line.slice(6);
                        if (data === '[DONE]') continue;
                        
                        try {
                            const parsed = JSON.parse(data);
                            const content = parsed.choices[0]?.delta?.content || '';
                            fullResponse += content; // Accumulate the full response
                            setStreamingResponse(prev => prev + content);
                        } catch (e) {
                            console.error('Error parsing JSON:', e);
                        }
                    }
                }
            }

            // Wait for next render cycle before updating the conversation
            setTimeout(() => {
                setCurrentSession(prev => ([...prev, {
                    who: "Soul AI",
                    quesAns: fullResponse, // Use the accumulated response
                    time: new Date().toLocaleString(),
                    rating: 0,
                    feedback: "",
                }]));
                setIsStreaming(false);
                setStreamingResponse("");
            }, 0);

        } catch (e) {
            console.log(e)
            setIsStreaming(false);
            setStreamingResponse("");
        } finally {
            setLoading(false)
        }
    }

    // lets use time as id to identify and modify for adding rating and feedback

    const updateRatingFeedback = (time, rating, feedback) => {
        setCurrentSession(prev => {
            const index = prev.findIndex(item => item.time === time)
            const newArr = [...prev]

            if (index != -1) {
                newArr[index].rating = rating
                newArr[index].feedback = feedback
            }
            return newArr
        })
    }

    const onAsk = (input) => {
        setCurrentSession(prev => ([...prev, {
            who: "user",
            quesAns: input,
            time: new Date().toLocaleString()
        }]))
        getAiAnwer(input)

        setInputText("")
    }

    const onSave = () => {

        if (!localStorage.getItem("chatBotData")) {
            localStorage.setItem("chatBotData", JSON.stringify([]))
        }
        const localData = JSON.parse(localStorage.getItem("chatBotData"))
        localData.push(currentSession)
        localStorage.setItem("chatBotData", JSON.stringify(localData))
        console.log("session saved", currentSession)
    }

    return (
        <div style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: "10px",
            height: "100vh",
            // background: "linear-gradient(180deg, rgba(215, 199, 244, 0.2) 0%, rgba(151, 133, 186, 0.2) 100%)",
            flexGrow: 1,
            gap: "50px"
        }}>
            <Flex style={{ flexGrow: 1 }} vertical justify="space-between">
                <Space style={{ justifyContent: "space-between" }}>
                    <Typography.Title level={4} style={{ color: "#9785BA" }}>Bot AI</Typography.Title>
                    <Space>
                        <Select
                            style={{ width: 300 }}
                        >
                            {groqModels.map(model => (
                                <Select.Option key={model.id}>
                                    {model.id}
                                </Select.Option>
                            ))}
                        </Select>
                        <Select
                            defaultValue={selectedModel}
                            value={selectedModel}
                            onChange={(value) => setSelectedModel(value)}
                            style={{ width: 300 }}
                        >
                            {openRouterModels.map(model => (
                                <Select.Option value={model.id} key={model.id}>
                                    {model.name}
                                </Select.Option>
                            ))}
                        </Select>
                    </Space>
                </Space>
                {currentSession.length ? (
                    <Flex vertical justify="flex-start" >
                        {currentSession.map(item => (
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
                            <Typography.Title level={3}>How Can I Help You Today?</Typography.Title>
                            <img src={siteIcon} alt="site icon" />
                        </Space>
                        <Space style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "25px" }}>
                            {conversationStarters.map(item => (
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
                <InputBar inputText={inputText} setInputText={setInputText} onAsk={onAsk} onSave={onSave} />
            </div>

        </div>
    )
}

export default ConversationContainer