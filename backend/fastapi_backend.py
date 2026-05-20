# fastapi_backend.py
from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from datetime import datetime
import os
import sys
import json

# Add backend to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from agents.supervisor import SupervisorAgent, RoutingStrategy
from rag.rag_tool import rag_pipeline

app = FastAPI(title="FocusFlow API", description="Multi-Agent Productivity System")

# CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],  # React dev servers
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize agents
print("🚀 Starting FocusFlow Backend API...")
supervisor = SupervisorAgent()

# Load RAG data
print("📚 Loading knowledge base...")
rag_pipeline.load_all_data()
print("✅ Backend ready!")

# ============================================
# Request/Response Models
# ============================================

class ChatRequest(BaseModel):
    message: str
    conversation_id: Optional[str] = None

class ChatResponse(BaseModel):
    response: str
    intent: str
    tasks_count: int
    focus_sessions: int
    user_mood: Optional[str] = None

class TaskCreate(BaseModel):
    title: str
    description: Optional[str] = ""
    priority: str = "medium"  # high, medium, low
    due_date: Optional[str] = None
    category: Optional[str] = ""
    subtasks: List[Dict] = []

class TaskUpdate(BaseModel):
    completed: Optional[bool] = None
    title: Optional[str] = None
    priority: Optional[str] = None

class FocusSession(BaseModel):
    duration_minutes: int = 25
    task_id: Optional[int] = None

class DocumentUpload(BaseModel):
    name: str
    content: str
    type: str

# ============================================
# Chat Endpoints
# ============================================

@app.post("/api/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """Send a message to the AI Coach"""
    try:
        result = supervisor.process_query(
            request.message,
            strategy=RoutingStrategy.CONDITIONAL
        )
        
        return ChatResponse(
            response=result["response"],
            intent=result["intent"],
            tasks_count=result["shared_state"]["tasks_count"],
            focus_sessions=result["shared_state"]["focus_sessions"],
            user_mood=result["shared_state"].get("user_mood")
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/chat/suggestions")
async def get_suggestions():
    """Get suggested conversation starters"""
    return {
        "suggestions": [
            "Help me organize my tasks",
            "I feel overwhelmed",
            "Break down a project for me",
            "Start a focus session",
            "What is the Pomodoro Technique?",
            "How do I stop procrastinating?"
        ]
    }

# ============================================
# Task Endpoints
# ============================================

@app.get("/api/tasks")
async def get_tasks():
    """Get all tasks from shared state"""
    tasks = []
    for task in supervisor.shared_state.tasks:
        tasks.append({
            "id": id(task),  # Simple ID for demo
            "title": task.get("description", ""),
            "description": task.get("description", ""),
            "priority": task.get("priority", "medium"),
            "completed": task.get("status") == "completed",
            "created_at": task.get("created_at", datetime.now().isoformat())
        })
    return tasks

@app.post("/api/tasks")
async def create_task(task: TaskCreate):
    """Create a new task"""
    new_task = {
        "description": task.title,
        "priority": task.priority,
        "status": "pending",
        "created_at": datetime.now().isoformat()
    }
    supervisor.shared_state.add_task(new_task)
    return {"success": True, "task": new_task}

@app.put("/api/tasks/{task_id}")
async def update_task(task_id: str, update: TaskUpdate):
    """Update a task (complete, edit)"""
    # In production, you'd track tasks by ID properly
    # For now, we'll just toggle the most recent task
    if supervisor.shared_state.tasks:
        if update.completed is not None:
            status = "completed" if update.completed else "pending"
            supervisor.shared_state.tasks[-1]["status"] = status
    return {"success": True}

# ============================================
# Focus Session Endpoints
# ============================================

@app.post("/api/focus/start")
async def start_focus(session: FocusSession):
    """Start a focus session"""
    result = supervisor.focus_agent.process(
        f"Start {session.duration_minutes} minute focus session",
        supervisor.shared_state
    )
    return {
        "success": True,
        "message": result["response"],
        "sessions_today": supervisor.shared_state.focus_sessions
    }

@app.post("/api/focus/pause")
async def pause_focus():
    """Pause current focus session"""
    result = supervisor.focus_agent.process("pause", supervisor.shared_state)
    return {"success": True, "message": result["response"]}

@app.post("/api/focus/resume")
async def resume_focus():
    """Resume paused focus session"""
    result = supervisor.focus_agent.process("resume", supervisor.shared_state)
    return {"success": True, "message": result["response"]}

@app.post("/api/focus/stop")
async def stop_focus():
    """Stop current focus session"""
    result = supervisor.focus_agent.process("stop", supervisor.shared_state)
    return {"success": True, "message": result["response"]}

@app.get("/api/focus/stats")
async def get_focus_stats():
    """Get focus session statistics"""
    return {
        "total_sessions": supervisor.shared_state.focus_sessions,
        "current_streak": 0,  # Would track this properly
        "today_sessions": supervisor.shared_state.focus_sessions,
        "daily_stats": {}
    }

# ============================================
# Document Endpoints (RAG)
# ============================================

@app.post("/api/documents/upload")
async def upload_document(file: UploadFile = File(...)):
    """Upload a document for RAG processing"""
    try:
        content = await file.read()
        
        # Create document for RAG
        from llama_index.core import Document
        doc = Document(
            text=content.decode('utf-8', errors='ignore')[:10000],
            metadata={
                'source': file.filename,
                'type': 'user_upload',
                'uploaded_at': datetime.now().isoformat()
            }
        )
        
        # Add to RAG index
        if rag_pipeline.index:
            rag_pipeline.index.insert(doc)
        
        return {
            "success": True,
            "filename": file.filename,
            "size": len(content),
            "message": "Document uploaded and indexed for RAG"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/documents")
async def get_documents():
    """Get list of documents in RAG"""
    # Return sample documents (in production, track actual documents)
    return {
        "documents": [
            {
                "id": 1,
                "name": "Eisenhower Matrix.txt",
                "type": "expert_content",
                "size": 45000,
                "uploaded_at": datetime.now().isoformat()
            },
            {
                "id": 2,
                "name": "Pomodoro Technique.txt",
                "type": "expert_content",
                "size": 32000,
                "uploaded_at": datetime.now().isoformat()
            }
        ]
    }

@app.post("/api/documents/search")
async def search_documents(query: str):
    """Search documents using RAG"""
    results = rag_pipeline.retrieve_general(query, n=5)
    return {
        "query": query,
        "results": [
            {
                "text": r["text"][:500],
                "source": r["metadata"].get("source", "unknown")
            }
            for r in results
        ]
    }

# ============================================
# Analytics Endpoints
# ============================================

@app.get("/api/analytics/stats")
async def get_analytics():
    """Get overall analytics"""
    completed_tasks = sum(1 for t in supervisor.shared_state.tasks if t.get("status") == "completed")
    total_tasks = len(supervisor.shared_state.tasks)
    
    return {
        "total_tasks": total_tasks,
        "completed_tasks": completed_tasks,
        "completion_rate": (completed_tasks / total_tasks * 100) if total_tasks > 0 else 0,
        "focus_sessions": supervisor.shared_state.focus_sessions,
        "user_mood": supervisor.shared_state.user_mood,
        "rag_documents": rag_pipeline.collection.count() if rag_pipeline.collection else 0
    }

# ============================================
# Health Check
# ============================================

@app.get("/api/health")
async def health_check():
    """Check if backend is running"""
    return {
        "status": "healthy",
        "rag_indexed": rag_pipeline.index is not None,
        "agents_ready": supervisor is not None,
        "timestamp": datetime.now().isoformat()
    }

if __name__ == "__main__":
    import uvicorn
    print("\n" + "="*50)
    print("🚀 FocusFlow API Server")
    print("="*50)
    print(f"📚 RAG Status: {'Loaded' if rag_pipeline.index else 'Loading...'}")
    print(f"🤖 Agents: Ready")
    print(f"🌐 API: http://localhost:8000")
    print(f"📖 Docs: http://localhost:8000/docs")
    print("="*50 + "\n")
    uvicorn.run(app, host="0.0.0.0", port=8000)