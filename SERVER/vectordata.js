import { AzureChatOpenAI, AzureOpenAIEmbeddings } from "@langchain/openai";
import { TextLoader } from "langchain/document_loaders/fs/text";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { FaissStore } from "@langchain/community/vectorstores/faiss";

const model = new AzureChatOpenAI({ temperature: 1 });

const embeddings = new AzureOpenAIEmbeddings({
    temperature: 0,
    azureOpenAIApiEmbeddingsDeploymentName: process.env.AZURE_EMBEDDING_DEPLOYMENT_NAME
});

async function createVectorstore() {
    const loader = new TextLoader("./public/prg08-sport.txt");
    const docs = await loader.load();
    const textSplitter = new RecursiveCharacterTextSplitter({chunkSize: 1000, chunkOverlap: 200,});
    const splitDocs = await textSplitter.splitDocuments(docs);
    const vectorStore = await FaissStore.fromDocuments(splitDocs, embeddings);
    await vectorStore.save("vectordata");
    console.log("Vectoredata saved");
}

async function askQuestion() {
    const vectorStore = await FaissStore.load("vectordata", embeddings);
    const relevantDocs = await vectorStore.similaritySearch("What is this document about?", 3);

    const context = relevantDocs.map(doc => doc.pageContent).join("\n\n");

    const response = await model.invoke([
        ["system", "Use the following context to answer the user's question. Only use information from the context."],
        ["user", `Context: ${context}\n\nQuestion: Waar gaat deze app over?`],
    ]);

    console.log("\nAnswer:");
    console.log(response.content);
}

createVectorstore()
askQuestion()