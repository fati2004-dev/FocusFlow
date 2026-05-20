# agents/supervisor.py
from typing import Dict, Any, List, Optional
from enum import Enum
from dataclasses import dataclass, field
from datetime import datetime

from .document_agent import DocumentAgent
from .coach_agent import CoachAgent
from .planner_agent import PlannerAgent
from .focus_agent import FocusAgent


class RoutingStrategy(Enum):
    """Different orchestration strategies"""
    SEQUENTIAL = "sequential"
    CONDITIONAL = "conditional"
    PARALLEL = "parallel"


class QueryIntent(Enum):
    """User query intent types"""
    KNOWLEDGE = "knowledge"      # "What is X?"
    EMOTIONAL = "emotional"       # "I feel overwhelmed"
    PLANNING = "planning"         # "Help me organize"
    FOCUS = "focus"              # "Start timer"
    COMPLEX = "complex"          # Needs all agents


@dataclass
class SharedState:
    """Shared state that all agents can access and modify"""
    tasks: List[Dict] = field(default_factory=list)
    conversation_history: List[Dict] = field(default_factory=list)
    rag_results: List[str] = field(default_factory=list)
    user_mood: Optional[str] = None
    focus_sessions: int = 0
    current_focus_task: Optional[str] = None
    retrieved_contexts: List[str] = field(default_factory=list)
    last_agent_response: Dict[str, Any] = field(default_factory=dict)
    
    def add_task(self, task: Dict):
        self.tasks.append(task)
    
    def add_to_history(self, role: str, content: str, agent: str = "user"):
        self.conversation_history.append({
            "role": role,
            "content": content,
            "agent": agent,
            "timestamp": datetime.now().isoformat()
        })
    
    def update_rag_results(self, results: List[str]):
        self.rag_results = results
        self.retrieved_contexts = results
    
    def get_context_string(self) -> str:
        """Get all contexts as a single string for prompting"""
        if self.retrieved_contexts:
            return "\n---\n".join(self.retrieved_contexts)
        return ""


class SupervisorAgent:
    """
    Orchestrator that routes queries to specialized agents
    Implements sequential, conditional, and parallel flows
    """
    
    def __init__(self):
        # Initialize all agents
        print("🎯 Initializing Supervisor Agent...")
        self.document_agent = DocumentAgent()
        self.coach_agent = CoachAgent()
        self.planner_agent = PlannerAgent()
        self.focus_agent = FocusAgent()
        
        # Shared state across agents
        self.shared_state = SharedState()
        
        # Routing configuration
        self.intent_keywords = {
            QueryIntent.KNOWLEDGE: ["what", "how", "why", "explain", "define", "tell me about", "difference between", "research", "study", "scientific"],
            QueryIntent.EMOTIONAL: ["feel", "overwhelmed", "stuck", "anxious", "stressed", "can't", "struggle", "hard", "difficult", "demotivated", "tired"],
            QueryIntent.PLANNING: ["organize", "plan", "break down", "schedule", "task", "project", "assignment", "homework", "deadline", "priority"],
            QueryIntent.FOCUS: ["timer", "focus", "pomodoro", "concentrate", "distraction", "session", "start", "pause", "stop"],
            QueryIntent.COMPLEX: ["procrastinate", "thesis", "work", "study", "productivity", "help me", "advice", "recommendation"]
        }
        
        print("   ✅ Supervisor Agent Ready!")
    
    def detect_intent(self, query: str) -> QueryIntent:
        """Analyze query to determine intent"""
        query_lower = query.lower()
        
        # Check for greetings first
        if any(greeting in query_lower for greeting in ['hello', 'hi', 'hey', 'greetings']):
            return QueryIntent.COMPLEX
        
        # Check for each intent type
        intent_scores = {}
        for intent, keywords in self.intent_keywords.items():
            score = sum(1 for keyword in keywords if keyword in query_lower)
            intent_scores[intent] = score
        
        # Get highest scoring intent
        if max(intent_scores.values()) == 0:
            return QueryIntent.COMPLEX
        
        top_intent = max(intent_scores, key=intent_scores.get)
        
        # If multiple intents have high scores, treat as complex
        scores = list(intent_scores.values())
        scores.sort(reverse=True)
        if len(scores) > 1 and scores[0] > 0 and scores[1] > 0:
            return QueryIntent.COMPLEX
            
        return top_intent
    
    def sequential_flow(self, query: str) -> str:
        """
        SEQUENTIAL: Document → Coach → Planner → Focus
        Used for complex productivity requests
        """
        print("\n🔄 Executing SEQUENTIAL flow...")
        
        responses = []
        
        # Step 1: Document Agent - Get knowledge
        print("   📚 Step 1: Document Agent retrieving knowledge...")
        try:
            doc_result = self.document_agent.process(query, self.shared_state)
            responses.append(f"###  Knowledge Base\n{doc_result.get('response', 'No information found')}")
            self.shared_state.update_rag_results(doc_result.get("contexts", []))
        except Exception as e:
            print(f"   ❌ Document Agent error: {e}")
            responses.append("###  Knowledge Base\nUnable to retrieve information at this moment.")
        
        # Step 2: Coach Agent - Add emotional support
        print("   💬 Step 2: Coach Agent providing motivation...")
        try:
            coach_result = self.coach_agent.process(query, self.shared_state)
            responses.append(f"### 💡 Coach's Perspective\n{coach_result.get('response', '')}")
        except Exception as e:
            print(f"   ❌ Coach Agent error: {e}")
            responses.append("### 💡 Coach's Perspective\nI'm here to support you.")
        
        # Step 3: Planner Agent - Create tasks
        print("   📋 Step 3: Planner Agent creating action items...")
        try:
            planner_result = self.planner_agent.process(query, self.shared_state)
            responses.append(f"### ✅ Action Plan\n{planner_result.get('response', '')}")
        except Exception as e:
            print(f"   ❌ Planner Agent error: {e}")
            responses.append("### ✅ Action Plan\nLet me help you organize your tasks.")
        
        # Step 4: Focus Agent - Offer timer
        print("   ⏰ Step 4: Focus Agent suggesting Pomodoro...")
        try:
            focus_result = self.focus_agent.process(query, self.shared_state)
            responses.append(f"### ⏱️ Focus Session\n{focus_result.get('response', '')}")
        except Exception as e:
            print(f"   ❌ Focus Agent error: {e}")
            responses.append("### ⏱️ Focus Session\nReady to start a focus session?")
        
        # Combine responses
        final_response = "\n\n".join(responses)
        
        # Add footer
        final_response += "\n\n---\n*How would you like to proceed? I'm here to help!*"
        
        return final_response
    
    def conditional_flow(self, query: str, intent: QueryIntent) -> str:
        """
        CONDITIONAL: Route to specific agent based on intent
        Used for simple, single-purpose queries
        """
        print(f"\n🔀 Executing CONDITIONAL flow for intent: {intent.value}")
        
        # For greetings, provide a friendly welcome from all agents
        if any(greeting in query.lower() for greeting in ['hello', 'hi', 'hey', 'greetings']):
            return self._get_welcome_message()
        
        if intent == QueryIntent.KNOWLEDGE:
            try:
                result = self.document_agent.process(query, self.shared_state)
                return result.get('response', "I couldn't find information on that topic.")
            except Exception as e:
                return f"I encountered an error while searching: {str(e)}"
        
        elif intent == QueryIntent.EMOTIONAL:
            try:
                result = self.coach_agent.process(query, self.shared_state)
                return result.get('response', "I'm here to support you. Tell me more about what you're feeling.")
            except Exception as e:
                return f"I want to help, but encountered an issue: {str(e)}"
        
        elif intent == QueryIntent.PLANNING:
            try:
                result = self.planner_agent.process(query, self.shared_state)
                return result.get('response', "Let me help you organize that task.")
            except Exception as e:
                return f"I'm having trouble planning right now: {str(e)}"
        
        elif intent == QueryIntent.FOCUS:
            try:
                result = self.focus_agent.process(query, self.shared_state)
                return result.get('response', "I can help you start a focus session.")
            except Exception as e:
                return f"Timer error: {str(e)}"
        
        else:
            return self.sequential_flow(query)
    
    def _get_welcome_message(self) -> str:
        """Get welcome message from all agents"""
        return """## 👋 Welcome to FocusFlow!

I'm your personal productivity assistant, powered by **4 specialized agents** working together to help you overcome procrastination.

### 🎯 What I Can Help With:

| Agent | Specialty | Example Questions |
|-------|-----------|-------------------|
| 📚 **Knowledge Agent** | Productivity research & techniques | "What is the Pomodoro Technique?" |
| 💬 **Coach Agent** | Emotional support & motivation | "I feel overwhelmed with my work" |
| 📋 **Planner Agent** | Task breakdown & organization | "Help me plan my study session" |
| ⏰ **Focus Agent** | Pomodoro timer & focus sessions | "Start a 25-minute focus session" |

### 💡 Try These Commands:

**Simple queries** (I'll route to the right agent):
- "What is the Eisenhower Matrix?"
- "I can't stop procrastinating"
- "Break down my thesis into steps"
- "Start a focus timer"

**Complex problems** (All agents collaborate):
- "I'm struggling with my programming project, can you help me plan and stay focused?"

### 🚀 Quick Start:
Just tell me what you need help with, and I'll handle the rest!

*What would you like to work on today?* 🎯
"""
    
    def process_query(self, query: str, strategy: RoutingStrategy = RoutingStrategy.CONDITIONAL) -> Dict[str, Any]:
        """
        Main entry point for processing user queries
        
        Args:
            query: User's question or statement
            strategy: Which orchestration pattern to use
        
        Returns:
            Dictionary with response and metadata
        """
        # Add to history
        self.shared_state.add_to_history("user", query)
        
        # Detect intent
        intent = self.detect_intent(query)
        print(f"\n📝 Query: {query[:100]}...")
        print(f"🎯 Detected intent: {intent.value}")
        
        # Route based on strategy
        try:
            if strategy == RoutingStrategy.SEQUENTIAL:
                response = self.sequential_flow(query)
            elif strategy == RoutingStrategy.CONDITIONAL:
                response = self.conditional_flow(query, intent)
            else:
                response = self.sequential_flow(query)
        except Exception as e:
            response = f"I encountered an error while processing your request: {str(e)}\n\nPlease try rephrasing your question or type 'reset' to start over."
            print(f"❌ Error in process_query: {e}")
        
        # Add response to history
        self.shared_state.add_to_history("assistant", response, "supervisor")
        
        return {
            "query": query,
            "response": response,
            "intent": intent.value,
            "strategy": strategy.value,
            "shared_state": {
                "tasks_count": len(self.shared_state.tasks),
                "focus_sessions": self.shared_state.focus_sessions,
                "user_mood": self.shared_state.user_mood
            }
        }
    
    def reset_state(self):
        """Reset shared state for new conversation"""
        self.shared_state = SharedState()
        print("🔄 Shared state reset")