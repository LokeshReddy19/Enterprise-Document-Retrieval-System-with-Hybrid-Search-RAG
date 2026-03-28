# Enterprise Document Retrieval System with Hybrid Search & RAG

An advanced, full-stack Enterprise Information Retrieval (IR) System built to index, search, and chat with your PDF documents. The system uses a powerful combination of Hybrid Search (Semantic, Keyword, and Fuzzy matching) along with Retrieval-Augmented Generation (RAG) powered by Mistral AI.

## 🌟 Key Features

- **📄 Document Processing**: Automatically extracts text from uploaded PDF files, splits them into manageable semantic chunks, and generates vector embeddings using SentenceTransformers (`all-MiniLM-L6-v2`).
- **🔍 Hybrid Search Engine**: A highly accurate search engine that calculates a combined relevance score based on:
  - *Semantic Similarity* (Cosine Similarity via embeddings) (60% weight)
  - *Keyword Matching* (25% weight)
  - *Fuzzy Matching* (Spelling error tolerance via RapidFuzz) (15% weight)
- **🤖 RAG Chat Interface**: Ask contextual questions directly to your documents. The system uses FAISS to quickly retrieve the most relevant chunks and feeds them to the **Mistral Large** model to generate accurate, context-aware answers.
- **☁️ Scalable Database**: Stores documents and their high-dimensional vector embeddings safely in MongoDB.
- **⚡ Full-Stack Architecture**: Built with a fast, async FastAPI Python backend and a modern JavaScript frontend.

## 🛠️ Tech Stack

### Backend
- **Framework**: FastAPI (Python)
- **Database**: MongoDB (via Motor AsyncIO)
- **AI / LLM**: Mistral AI (`mistral-large-latest`)
- **Embeddings**: `sentence-transformers` (`all-MiniLM-L6-v2`)
- **Vector Search**: FAISS
- **Utilities**: PyPDF2 (PDF parsing), NLTK (Sentence chunking), RapidFuzz (Fuzzy matching), scikit-learn (Cosine Similarity).

### Frontend
- Modern Node.js/React-based UI (located in the `frontend` directory).

## 🚀 Getting Started

### Prerequisites
- Python 3.9+
- Node.js & npm
- MongoDB URI
- Mistral API Key

### 1. Backend Setup
1. Navigate to the backend directory: `cd backend`
2. Create and activate a virtual environment: `python -m venv venv`
3. Install dependencies: `pip install -r requirements.txt`
4. Set up your `.env` file with the following keys:
   ```env
   MONGO_URI="your_mongodb_connection_string"
   MISTRAL_API_KEY="your_mistral_api_key"
   ```
5. Run the FastAPI server: `uvicorn main:app --reload` (Runs on port 8000 by default).

### 2. Frontend Setup
1. Navigate to the frontend directory: `cd frontend`
2. Install dependencies: `npm install`
3. Start the development server: `npm start` (or `npm run dev`)

## 📡 API Endpoints

- `POST /upload`: Upload a PDF document to process, chunk, embed, and store in MongoDB.
- `POST /search?query="..."`: Perform a hybrid search to find the most relevant chunks of text across all uploaded documents.
- `POST /chat?question="..."`: Ask a question and receive an AI-generated answer using RAG based on your documents' context.
