# api.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn

from agents.supervisor import SupervisorAgent, RoutingStrategy

app = FastAPI(title="FocusFlow API")

# Allow React dev server to call this
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize once at startup (loads RAG, all agents)
supervisor = SupervisorAgent()

class ChatRequest(BaseModel):
    message: str
    strategy: str = "conditional"  # "conditional" | "sequential"

class ResetRequest(BaseModel):
    pass

@app.post("/chat")
def chat(req: ChatRequest):
    strategy = (
        RoutingStrategy.SEQUENTIAL
        if req.strategy == "sequential"
        else RoutingStrategy.CONDITIONAL
    )
    result = supervisor.process_query(req.message, strategy=strategy)
    return result   # already a dict with response, intent, shared_state, etc.

@app.post("/reset")
def reset():
    supervisor.reset_state()
    return {"status": "reset"}

@app.get("/health")
def health():
    return {"status": "ok"}

if __name__ == "__main__":
    uvicorn.run("api:app", host="0.0.0.0", port=8000, reload=False)