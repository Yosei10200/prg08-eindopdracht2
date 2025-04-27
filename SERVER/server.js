import express from 'express'
import cors from 'cors'

import { AzureChatOpenAI, AzureOpenAIEmbeddings } from "@langchain/openai";
import {HumanMessage, SystemMessage} from "@langchain/core/messages";
import { FaissStore } from "@langchain/community/vectorstores/faiss";
import { tool } from "@langchain/core/tools"
import { tavily } from "@tavily/core";

const client = tavily({ apiKey: process.env.TAVILY_KEY });
const options = {topic: "news", timeRange: "m", includeAnswer: "true", maxResults:1, days: 5 }

export async function searchTavily({query}) {
    try {
        const response = await client.search(query, options);
        const result = response.results[0].title + " " + response.results[0].content
        console.log(result);
        return result
    } catch (error) {
        console.error(error);
    }
}

const searchTool = tool(searchTavily, {
    name: "searchTavily",
    description: "Haal nuttige informatie over sporten op die jouw antwoorden kunnen assisteren.",
    schema: {
        type: "object",
        properties: {
            query: { type: "string" },
        },
        required: ["query"],
    },
});

const model = new AzureChatOpenAI({
    temperature: 0.5,
}).bindTools([searchTool])

const embeddings = new AzureOpenAIEmbeddings({
    azureOpenAIApiEmbeddingsDeploymentName: process.env.AZURE_EMBEDDING_DEPLOYMENT_NAME
})

let vectorStore;

const app = express()
app.use(cors())
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.post('/', async (req, res) => {
    try {
        res.setHeader('Content-Type', 'text/plain');
        res.setHeader('Transfer-Encoding', 'chunked');

        const input = req.body.messages;
        const lastMessage = input[input.length - 1];
        const question = lastMessage[1];

        const relevantDocs = await vectorStore.similaritySearch(question, 3);
        const context = relevantDocs.map(doc => doc.pageContent).join("\n\n");

        const messages = [
            new SystemMessage("Gebruik de volgende context om de vraag te beantwoorden. Praat alsof jij de app bent. Lees op de vectordata wat voor app je bent. Als er bijvoorbeeld vragen worden gesteld over een workout, geef dan een goede workout schema dat specifiek is. Een voorbeeld is dan 3x10 sets van squats, 3x10 sets van jumping jacks, enzovoort. Praat ook altijd in het nederlands"),
            new HumanMessage(`Context: ${context}\n\nQuestion: ${question}`)
        ];

        let result = await model.invoke(messages)
        messages.push(result)
        const tools = [searchTool];
        const toolsByName = Object.fromEntries(tools.map(tool => [tool.name, tool]));
        console.log(toolsByName)

        if (result.tool_calls && result.tool_calls.length > 0) {
            for (const toolCall of result.tool_calls) {
                console.log("toolcalls", toolCall);
                const selectedTool = toolsByName[toolCall.name];
                console.log("now trying to call " + toolCall.name);
                const toolMessage = await selectedTool.invoke(toolCall);
                messages.push(toolMessage);
            }
            result = await model.invoke(messages);
            console.log(result.content);
        }


        const stream = await model.stream(messages);
        for await (const chunk of stream) {
            res.write(chunk.content);
        }
        res.end();


    } catch (error) {
        console.log("error", error);
    }
})

async function startServer() {
    vectorStore = await FaissStore.load("vectordata", embeddings);
    app.listen(process.env.EXPRESS_PORT || 8000, () => {
        console.log(`Server is listening on port ${process.env.EXPRESS_PORT || 8000}`);
    });
}

startServer();