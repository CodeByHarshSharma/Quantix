import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { HumanMessage, SystemMessage, AIMessage, tool, createAgent } from 'langchain'
import * as z from "zod";
import { searchInternet } from "./internet.service.js";

const geminiModel = new ChatGoogleGenerativeAI({
    model: "gemini-3.1-flash-lite",
    apiKey: process.env.GEMINI_API_KEY
})

const searchInternetTool = tool(searchInternet, {
    name: "searchInternet",
    description: "Use this tool to get latest information from the internet",
    schema: z.object({
        query: z.string().describe("The search query to look up on the internet")
    })
})

const agent = createAgent({
    model: geminiModel,
    tools: [searchInternetTool]
})

const SYSTEM_PROMPT = `
        You are a helpful and precise assistant for answering questions.
        If you don't know the answer, say you currently dont have an answer for that
        If the question requires up-to-date information , use the "searchInternet" tool to get latest information from the internet and then answer based on the search results.`

function toLangchainMessage(messages) {
    return [
        new SystemMessage(SYSTEM_PROMPT),
        ...messages
            .filter(msg => msg.role === "User" || msg.role === "AI")
            .map(msg => msg.role === "User"
                ? new HumanMessage(msg.content)
                : new AIMessage(msg.content))
    ]
}

const isAIChunk = (m) => (m?.getType?.() ?? m?._getType?.()) === "ai"

export async function generateMessage(messages) {
    const response = await agent.invoke({
        messages: toLangchainMessage(messages)
    })
    return response.messages[response.messages.length - 1].text
}

export async function streamMessage(messages, { onToken, onToolStart, signal } = {}) {
    const stream = await agent.stream(
        { messages: toLangchainMessage(messages) },
        { streamMode: "messages", signal }
    )

    for await (const [chunk] of stream) {
        if (!isAIChunk(chunk)) continue

        for (const tc of chunk.tool_call_chunks ?? []) {
            if (tc.name) onToolStart?.(tc.name)
        }

        const text = chunk.text
        if (text) onToken?.(text)
    }
}

export async function generateChatTitle(message) {

    const response = await geminiModel.invoke([
        new SystemMessage(`You are a helpful assistant that generates concise and descriptive titles for chat conversation
            
        User will provide you with the first message of a chat conversation, and you will generate a title that captures the essence of the conversation in 2-4 words. The title should be clear, relevant and engaging, giving users a quick understanding of chat's topic`),

        new HumanMessage(`
            Generate a title for a chat conversation based on following first message:
            "${message}"`)
    ])

    return response.text.trim().replace(/^["']|["']$/g, "")

}