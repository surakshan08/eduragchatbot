# EDURAG - Campus Assistance Bot

EDURAG is a local, AI-powered Retrieval-Augmented Generation (RAG) application specifically designed to assist end-users with campus-related queries based on master policy documents. 

It provides an intuitive dual-mode interface directly from the browser allowing regular users to get answers in Chat Mode and administrators to manage the knowledge base in Developer Mode.

## Features
- **Local Large Language Model (LLM)**: Uses `google/flan-t5-base` running locally for privacy-preserving document Q&A. No external APIs needed for inference.
- **RAG Architecture**: Employs **FAISS** for swift vector storage and `all-MiniLM-L6-v2` via HuggingFace for accurate document embeddings.
- **Dual Mode Interface**:
  - **User (Chat) Mode**: End-users can naturally chat with the system using the pre-loaded knowledge base, or even securely upload a temporary PDF for ad-hoc, isolated document analysis.
  - **Developer Mode (System Override)**: Authenticated area to securely ingest new master policy PDFs into the persistent knowledge base or to clear out the entire vector store when policies change or to prevent cross-document contamination.

## Technologies Used
- **Backend Infrastructure**: Python 3.x, FastAPI framework setup, LangChain ecosystem, FAISS, LangChain Community integrations, HuggingFace Transformers, PyPDF for text extraction.
- **Frontend Subsystem**: React (powered by Vite), Styled components/CSS, Lucide React (for UI iconography), React Markdown.

## Project Structure
- `/backend`: Contains the FastAPI application and core RAG logic pipelines (`main.py`, `rag_service.py`).
- `/frontend`: Contains the React/Vite web application application (`src/App.jsx`, `src/components/`, etc.).

## Setup & Running the Application

### 1- Backend Setup

1. Open a terminal and navigate to the `backend` directory:
   ```bash
   cd backend
   ```
2. Setup and activate a fresh python virtual environment:
   ```bash
   python -m venv .venv
   
   # For Windows
   .\.venv\Scripts\activate
   
   # For MacOS / Linux
   source .venv/bin/activate
   ```
3. Ensure backend dependencies are installed. Typical requirements generally include:
   ```bash
   pip install fastapi uvicorn langchain langchain-community langchain-text-splitters langchain-huggingface transformers faiss-cpu pypdf python-dotenv
   ```
4. Start the backend local development server:
   ```bash
   python main.py
   # Or alternatively: uvicorn main:app --host 0.0.0.0 --port 8000 --reload
   ```
   > By default, the API will be available at `http://localhost:8000`

### 2- Frontend Setup

1. Open a new, separate terminal and navigate into the `frontend` directory:
   ```bash
   cd frontend
   ```
2. Install frontend `npm` dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
   > The UI will typically map to `http://localhost:5173` or similar.

## Application Usage & Workflow

1. **Initial Vector Store Initialization**: To interact with the master knowledge base, you first need to authenticate via Developer Mode in the React UI (using default credentials or custom `.env` overrides if placed). 
   - _Note_: the Default developer credentials built into the system are Username: `admin` / Password: `admin123`.
2. **Uploading Base Knowledge**: Upload a master policy PDF file while logged into Developer Mode.
3. **Querying**: Switch back to Chat mode to start conversing and retrieving answers securely driven by the newly generated FAISS index. Alternatively, users may upload temporary documents for session-isolated QA.
