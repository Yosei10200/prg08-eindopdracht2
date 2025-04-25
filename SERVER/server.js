import express from 'express'
import cors from 'cors'

import { AzureChatOpenAI, AzureOpenAIEmbeddings } from "@langchain/openai";
import {HumanMessage, AIMessage, SystemMessage, ToolMessage, isSystemMessage} from "@langchain/core/messages";
import { FaissStore } from "@langchain/community/vectorstores/faiss";
import { tool } from "@langchain/core/tools"
