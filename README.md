1. Pull de github
2. Maak een .env bestand aan en vul dit in met je api gegevens:
   AZURE_OPENAI_API_VERSION=
   AZURE_OPENAI_API_INSTANCE_NAME=
   AZURE_OPENAI_API_KEY=
   AZURE_OPENAI_API_DEPLOYMENT_NAME=
   AZURE_EMBEDDING_DEPLOYMENT_NAME=
3. Installeer de node modules met:
   npm init -y
   npm install langchain @langchain/core @langchain/openai
   npm install @langchain/openai @langchain/community @langchain/core @langchain/textsplitters faiss-node