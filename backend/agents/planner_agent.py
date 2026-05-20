# agents/planner_agent.py - DATA-DRIVEN VERSION
from typing import Dict, Any, List
from datetime import datetime
import sys
import os
import re

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from rag.rag_tool import rag_pipeline


class PlannerAgent:
    """
    Planner Agent - NOW USING YOUR EXPERT CONTENT
    Uses Eisenhower Matrix, Pomodoro Technique from your TXT files
    """
    
    def __init__(self):
        self.name = "Planner Agent"
        print("   📋 Initializing DATA-DRIVEN Planner Agent...")
        print("      📚 Will use your expert content (Eisenhower, Pomodoro, etc.)")
        
        # Cache expert techniques from your data
        self.expert_techniques = {}
        self._load_expert_techniques()
    
    def _load_expert_techniques(self):
        """Load and cache techniques from your expert content"""
        try:
            # Search for productivity techniques in your data
            techniques = rag_pipeline.retrieve_expert_content("productivity technique method", n=10)
            for tech in techniques:
                source = tech['source']
                self.expert_techniques[source] = tech['text'][:500]
            print(f"      ✅ Loaded {len(self.expert_techniques)} expert techniques")
        except:
            print("      ⚠️ Using default techniques")
    
    def process(self, query: str, shared_state) -> Dict[str, Any]:
        """
        Create action plan using your expert content
        """
        print(f"   📝 Creating plan using expert content for: {query[:50]}...")
        
        # 1. Search your expert content for relevant techniques
        relevant_techniques = rag_pipeline.retrieve_expert_content(query, n=3)
        
        # 2. Get scientific backing if available
        scientific_context = rag_pipeline.retrieve_scientific_papers(query, n=2)
        
        # 3. Extract task from query
        main_task = self._extract_task(query)
        
        # 4. Decompose using techniques from your data
        subtasks = self._decompose_with_expertise(main_task, relevant_techniques)
        
        # 5. Prioritize using Eisenhower (from your expert content)
        prioritized = self._prioritize_with_eisenhower(subtasks)
        
        # 6. Save to shared state
        for task in subtasks[:3]:
            shared_state.add_task({
                "description": task,
                "created_at": datetime.now().isoformat(),
                "status": "pending",
                "source": "expert_content"
            })
        
        # Build response using your actual expert content
        response = self._build_response(main_task, subtasks, prioritized, relevant_techniques, scientific_context)
        
        return {
            "agent": self.name,
            "response": response,
            "tasks_created": len(subtasks),
            "techniques_used": [t['source'] for t in relevant_techniques],
            "success": True
        }
    
    def _extract_task(self, query: str) -> str:
        """Extract the main task from user query"""
        patterns = [
            r'(?:plan|organize|help with|break down|work on|do)\s+(.+?)(?:\?|\.|$)',
            r'(?:my|the|this)\s+(.+?)(?:\?|\.|$)'
        ]
        
        for pattern in patterns:
            match = re.search(pattern, query.lower())
            if match:
                return match.group(1).strip()
        
        return query[:50] if len(query) > 50 else query
    
    def _decompose_with_expertise(self, task: str, techniques: List[Dict]) -> List[str]:
        """Decompose task using techniques from your expert content"""
        
        # Check if Pomodoro Technique is in your data
        pomodoro_found = any('pomodoro' in t['source'].lower() for t in techniques)
        
        # Check if Eisenhower Matrix is in your data
        eisenhower_found = any('eisenhower' in t['source'].lower() for t in techniques)
        
        if "write" in task.lower() or "essay" in task.lower():
            if pomodoro_found:
                return [
                    f"Apply Pomodoro: 25 min writing block for {task[:30]}",
                    "Take 5 min break",
                    "Second Pomodoro: Continue writing",
                    "Review what you wrote"
                ]
            else:
                return [
                    f"Open document and write title for {task[:30]}",
                    "Write 3 main points",
                    "Write first paragraph",
                    "Take short break",
                    "Write second paragraph"
                ]
        
        elif "study" in task.lower() or "read" in task.lower():
            if pomodoro_found:
                return [
                    f"Pomodoro Session 1 (25 min): Read/study {task[:30]}",
                    "5 min break - stretch",
                    f"Pomodoro Session 2 (25 min): Review and take notes",
                    "5 min break",
                    "Summarize what you learned"
                ]
            else:
                return [
                    f"Gather materials for {task}",
                    "Set timer for 25 minutes",
                    "Study until timer ends",
                    "Take break",
                    "Review and test yourself"
                ]
        
        else:
            # Generic decomposition
            return [
                f"Step 1: Gather everything needed for {task}",
                f"Step 2: Spend 5 minutes just starting {task}",
                f"Step 3: Take a 2-minute break",
                f"Step 4: Work on {task} for 25 minutes",
                f"Step 5: Review progress and adjust plan"
            ]
    
    def _prioritize_with_eisenhower(self, tasks: List[str]) -> Dict[str, List[str]]:
        """Prioritize using Eisenhower Matrix from your expert content"""
        result = {
            "urgent_important": [],    # Do first
            "not_urgent_important": [], # Schedule
            "delegate": [],            # Delegate if possible
            "eliminate": []            # Don't do
        }
        
        for task in tasks:
            task_lower = task.lower()
            # Urgent indicators
            if any(word in task_lower for word in ["deadline", "today", "tomorrow", "due", "urgent"]):
                result["urgent_important"].append(task)
            # Important but not urgent
            elif any(word in task_lower for word in ["plan", "learn", "understand", "review"]):
                result["not_urgent_important"].append(task)
            # Can delegate
            elif any(word in task_lower for word in ["find", "search", "look up", "research"]):
                result["delegate"].append(task)
            else:
                result["eliminate"].append(task)
        
        return result
    
    def _build_response(self, task: str, subtasks: List[str], prioritized: Dict, techniques: List[Dict], scientific: List[Dict]) -> str:
        """Build response using your actual expert content"""
        
        response = f"""## 🎯 Action Plan for: {task}

### ✅ Priority Tasks (Do First):
"""
        for i, t in enumerate(prioritized["urgent_important"][:3], 1):
            response += f"{i}. **{t}**\n"
        
        response += f"""
### 📅 Schedule for Later:
"""
        for i, t in enumerate(prioritized["not_urgent_important"][:3], 1):
            response += f"{i}. {t}\n"
        
        # Add technique from your expert content
        if techniques:
            response += f"""
## 📚 Using Technique from Your Expert Content: {techniques[0]['source']}

{techniques[0]['text'][:200]}...

"""
        
        # Add scientific backing
        if scientific:
            response += f"""
## 🔬 Scientific Basis (from your papers):

{scientific[0]['text'][:150]}...

"""
        
        response += f"""
## ⏱️ Estimated Time:
- First task: ~5-10 minutes
- Total plan: ~1-2 hours

## 💪 Ready to start?
Say "start focus" and I'll help you begin with the first task!
"""
        
        return response