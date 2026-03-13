import os
from dotenv import load_dotenv
load_dotenv()  # Ensure .env is loaded in every subprocess context
from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_core.language_models.llms import LLM
from typing import Any, List, Optional
from transformers import AutoModelForSeq2SeqLM, AutoTokenizer, pipeline
from langchain_community.vectorstores import FAISS
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_core.runnables import RunnablePassthrough

PERSIST_DIR = os.getenv("PERSIST_DIR", os.path.join(os.path.dirname(__file__), "data", "vectorstore"))
os.makedirs(PERSIST_DIR, exist_ok=True)

# Global instances to avoid reloading
_llm_instance = None
_embeddings_instance = None

def get_embeddings():
    global _embeddings_instance
    if _embeddings_instance is None:
        _embeddings_instance = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")
    return _embeddings_instance

class LocalT5LLM(LLM):
    model: Any
    tokenizer: Any
    
    @property
    def _llm_type(self) -> str:
        return "local_t5"
        
    def _call(self, prompt: str, stop: Optional[List[str]] = None, **kwargs: Any) -> str:
        inputs = self.tokenizer(prompt, return_tensors="pt")
        outputs = self.model.generate(
            **inputs, 
            max_new_tokens=512, 
            temperature=0.1, 
            do_sample=True
        )
        return self.tokenizer.decode(outputs[0], skip_special_tokens=True)

def get_llm():
    global _llm_instance
    if _llm_instance is None:
        model_id = "google/flan-t5-base"
        tokenizer = AutoTokenizer.from_pretrained(model_id)
        model = AutoModelForSeq2SeqLM.from_pretrained(model_id)
        _llm_instance = LocalT5LLM(model=model, tokenizer=tokenizer)
    return _llm_instance

SYSTEM_PROMPT = """Answer the question based on the provided context. If you don't know the answer, say that the information is not covered by the current policies.

Context:
{context}

Question:
{question}
"""

def _format_docs(docs):
    return "\n\n".join(doc.page_content for doc in docs)

def clear_knowledge_base():
    """Wipe the persistent vector store to prevent contamination."""
    if os.path.exists(PERSIST_DIR):
        import shutil
        shutil.rmtree(PERSIST_DIR)
        os.makedirs(PERSIST_DIR, exist_ok=True)
    return True

def ingest_developer_document(file_path: str):
    loader = PyPDFLoader(file_path)
    docs = loader.load()
    
    # Simple Metadata Extraction (from first 500 chars of first page)
    first_page_text = docs[0].page_content if docs else ""
    title = "Unknown Policy"
    author = "Academic Board"
    
    # Try to find a line that looks like a title
    lines = [l.strip() for l in first_page_text.split('\n') if l.strip()]
    if lines:
        title = lines[0] # Assume first non-empty line is title
        
    for doc in docs:
        doc.metadata["title"] = title
        doc.metadata["author"] = author
        doc.metadata["source"] = os.path.basename(file_path)
    
    text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
    splits = text_splitter.split_documents(docs)
    
    if not splits:
        raise ValueError("No extractable text found in the document. Is it a scanned image?")
        
    faiss_index_path = os.path.join(PERSIST_DIR, "index.faiss")

    if os.path.exists(faiss_index_path):
        vectorstore = FAISS.load_local(PERSIST_DIR, get_embeddings(), allow_dangerous_deserialization=True)
        vectorstore.add_documents(documents=splits)
    else:
        vectorstore = FAISS.from_documents(documents=splits, embedding=get_embeddings())
        
    vectorstore.save_local(PERSIST_DIR)
    return len(splits)

def ask_question(query: str, user_temp_file_path: str = None):
    llm = get_llm()
    prompt = ChatPromptTemplate.from_messages([
        ("system", SYSTEM_PROMPT),
        ("human", "{question}"),
    ])
    
    if user_temp_file_path:
        # User uploaded a file — use temporary in-memory FAISS only
        loader = PyPDFLoader(user_temp_file_path)
        docs = loader.load()
        text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
        splits = text_splitter.split_documents(docs)
        if not splits:
            return "No text could be extracted from the uploaded file. Please ensure it is a text-searchable PDF."
        temp_vectorstore = FAISS.from_documents(documents=splits, embedding=get_embeddings())
        retriever = temp_vectorstore.as_retriever()

    else:
        # Use the persistent developer knowledge base
        faiss_index_path = os.path.join(PERSIST_DIR, "index.faiss")
        if not os.path.exists(faiss_index_path):
            return "Knowledge base is empty. Please ask the developer to upload the master policy PDF."
            
        vectorstore = FAISS.load_local(PERSIST_DIR, get_embeddings(), allow_dangerous_deserialization=True)
        retriever = vectorstore.as_retriever()
    
    rag_chain = (
        {"context": retriever | _format_docs, "question": RunnablePassthrough()}
        | prompt
        | llm
        | StrOutputParser()
    )

    return rag_chain.invoke(query)
