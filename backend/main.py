from datetime import datetime
import os
import io
import numpy as np
import nltk
import faiss

from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import PyPDF2
from dotenv import load_dotenv

from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
from rapidfuzz import fuzz
from mistralai import Mistral

# -------------------- INIT --------------------
load_dotenv()
nltk.download("punkt")

app = FastAPI()

# -------------------- CORS --------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# -------------------- DATABASE --------------------
MONGO_URI = os.getenv("MONGO_URI")
client = AsyncIOMotorClient(MONGO_URI)
db = client.enterprise_db
collection = db.documents

# -------------------- MODELS --------------------
embedding_model = SentenceTransformer("all-MiniLM-L6-v2")
mistral_client = Mistral(api_key=os.getenv("MISTRAL_API_KEY"))

# -------------------- CHUNKING --------------------
def chunk_text(text, chunk_size=500, overlap=100):
    chunks = []
    start = 0
    while start < len(text):
        end = start + chunk_size
        chunks.append(text[start:end])
        start += chunk_size - overlap
    return chunks

# -------------------- UPLOAD --------------------
@app.post("/upload")
async def upload_document(file: UploadFile = File(...)):
    file_bytes = await file.read()

    try:
        reader = PyPDF2.PdfReader(io.BytesIO(file_bytes))
        full_text = ""

        for page in reader.pages:
            full_text += page.extract_text() or ""

        if not full_text.strip():
            raise HTTPException(status_code=400, detail="No text found in PDF")

        chunks = chunk_text(full_text)
        embeddings = embedding_model.encode(chunks).tolist()

        document = {
            "filename": file.filename,
            "chunks": chunks,
            "embeddings": embeddings,
            "upload_date": datetime.utcnow()
        }

        await collection.insert_one(document)

        return {"status": "success"}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# -------------------- HYBRID SEARCH --------------------
@app.post("/search")
async def search(query: str):
    documents = await collection.find({}).to_list(length=100)
    if not documents:
        return {"results": []}

    query_embedding = embedding_model.encode([query])
    query_lower = query.lower()

    results = []

    for doc in documents:
        chunks = doc.get("chunks", [])
        embeddings = np.array(doc.get("embeddings", []))
        if not chunks or embeddings.size == 0:
            continue

        semantic_scores = cosine_similarity(query_embedding, embeddings)[0]
        top_indices = semantic_scores.argsort()[-3:][::-1]

        for idx in top_indices:
            semantic_score = float(semantic_scores[idx])
            chunk_text_data = chunks[idx]

            keyword_score = 1.0 if query_lower in chunk_text_data.lower() else 0.0
            fuzzy_score = fuzz.partial_ratio(query_lower, chunk_text_data.lower()) / 100

            final_score = (
                0.6 * semantic_score +
                0.25 * keyword_score +
                0.15 * fuzzy_score
            )

            if final_score > 0.4:
                results.append({
                    "filename": doc["filename"],
                    "relevance": round(final_score * 100, 2),
                    "matched_chunk": chunk_text_data[:300]
                })

    results.sort(key=lambda x: x["relevance"], reverse=True)
    return {"results": results[:10]}

# -------------------- RAG CHAT --------------------
@app.post("/chat")
async def chat_with_pdf(question: str):

    documents = await collection.find({}).to_list(length=100)
    if not documents:
        raise HTTPException(status_code=400, detail="No documents available")

    all_chunks = []
    for doc in documents:
        all_chunks.extend(doc.get("chunks", []))

    if not all_chunks:
        raise HTTPException(status_code=400, detail="No chunks found")

    chunk_embeddings = embedding_model.encode(all_chunks)
    dimension = chunk_embeddings.shape[1]

    index = faiss.IndexFlatL2(dimension)
    index.add(np.array(chunk_embeddings))

    question_embedding = embedding_model.encode([question])
    D, I = index.search(np.array(question_embedding), k=3)

    retrieved_chunks = [all_chunks[i] for i in I[0]]
    context = "\n\n".join(retrieved_chunks)

    prompt = f"""
Answer the question using ONLY the context below.

Context:
{context}

Question:
{question}
"""

    response = mistral_client.chat.complete(
        model="mistral-large-latest",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.2
    )

    answer = response.choices[0].message.content

    return {"answer": answer}
