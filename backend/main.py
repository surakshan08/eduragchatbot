from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Depends, Header
from pydantic import BaseModel
from typing import Optional
from fastapi.middleware.cors import CORSMiddleware
import os
import tempfile
from rag_service import ingest_developer_document, ask_question
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="EDURAG Backend")

ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5174"
]
frontend_url = os.getenv("FRONTEND_URL")
if frontend_url:
    ALLOWED_ORIGINS.append(frontend_url)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

os.makedirs("data/uploads", exist_ok=True)

DEV_USERNAME = os.getenv("DEV_USERNAME", "admin")
DEV_PASSWORD = os.getenv("DEV_PASSWORD", "admin123")
DEV_TOKEN = "dev_secret_token_123"

class LoginRequest(BaseModel):
    username: str
    password: str

async def verify_token(authorization: str = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Unauthorized")
    token = authorization.split(" ")[1]
    if token != DEV_TOKEN:
        raise HTTPException(status_code=401, detail="Invalid token")
    return True

@app.post("/api/developer/login")
async def developer_login(req: LoginRequest):
    if req.username == DEV_USERNAME and req.password == DEV_PASSWORD:
        return {"token": DEV_TOKEN}
    raise HTTPException(status_code=401, detail="Invalid credentials")


@app.post("/api/developer/upload")
async def developer_upload(file: UploadFile = File(...), authorized: bool = Depends(verify_token)):
    if not file.filename.endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")
    
    file_path = os.path.join("data/uploads", file.filename)
    with open(file_path, "wb") as f:
        content = await file.read()
        f.write(content)
        
    try:
        chunks = ingest_developer_document(file_path)
        return {"status": "success", "message": f"Successfully ingested {file.filename} into {chunks} chunks."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/developer/clear")
async def developer_clear(authorized: bool = Depends(verify_token)):
    try:
        from rag_service import clear_knowledge_base
        clear_knowledge_base()
        return {"status": "success", "message": "Knowledge base cleared successfully."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/ask")
async def ask(query: str = Form(...), file: Optional[UploadFile] = File(None)):
    user_temp_file_path = None
    try:
        if file:
            if not file.filename.endswith('.pdf'):
                raise HTTPException(status_code=400, detail="Only PDF files are supported.")
            
            # Save temporarily for processing, guarantee deletion
            with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as temp_file:
                content = await file.read()
                temp_file.write(content)
                user_temp_file_path = temp_file.name
                
        answer = ask_question(query, user_temp_file_path)
        return {"answer": answer}
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if user_temp_file_path and os.path.exists(user_temp_file_path):
            os.remove(user_temp_file_path)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
