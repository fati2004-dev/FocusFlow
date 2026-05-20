# agents/document_agent.py - DATA-DRIVEN VERSION
from typing import Dict, Any, List
import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from rag.rag_tool import rag_pipeline


class DocumentAgent:
    """
    Document Agent - NOW USING YOUR SCIENTIFIC PAPERS
    Provides evidence-based answers from your research papers
    """
    
    def __init__(self):
        self.name = "Document Agent"
        print("   📚 Initializing DATA-DRIVEN Document Agent...")
        print("      📚 Will search your scientific papers and expert content")
    
    def process(self, query: str, shared_state) -> Dict[str, Any]:
        """
        Answer questions using your scientific papers and expert content
        """
        print(f"   🔍 Searching your data for: {query[:50]}...")
        
        # Search different data sources
        scientific_results = rag_pipeline.retrieve_scientific_papers(query, n=2)
        expert_results = rag_pipeline.retrieve_expert_content(query, n=2)
        
        # Combine results
        all_contexts = []
        
        if scientific_results:
            print(f"   ✅ Found {len(scientific_results)} scientific papers")
            all_contexts.extend(scientific_results)
            shared_state.update_rag_results([r['text'] for r in scientific_results])
        
        if expert_results:
            print(f"   ✅ Found {len(expert_results)} expert content items")
            all_contexts.extend(expert_results)
        
        if all_contexts:
            response = self._build_evidence_response(query, all_contexts)
        else:
            response = self._fallback_response()
        
        return {
            "agent": self.name,
            "response": response,
            "contexts": [c['text'] for c in all_contexts],
            "success": bool(all_contexts)
        }
    
    def _build_evidence_response(self, query: str, contexts: List[Dict]) -> str:
        """Build response using your actual data"""
        
        response = f"""## 📚 What I Found in Your Knowledge Base

**Question:** {query}

### 🔬 Scientific Evidence (from your papers):

"""
        for ctx in contexts[:2]:
            if ctx.get('topic'):
                response += f"**From {ctx.get('topic', 'research')} paper:**\n"
            response += f"{ctx['text'][:300]}...\n\n"
        
        response += """
### 💡 Practical Application:

Based on this research, here's what you can do:

1. **Start small** - The science shows that beginning with tiny actions builds momentum
2. **Use structured techniques** - Methods like Pomodoro are backed by research
3. **Address emotions** - Remember that procrastination is often about feelings, not laziness

Would you like me to help you create a plan based on this information?
"""
        return response
    
    def _fallback_response(self) -> str:
        """Response when no data found"""
        return """I searched your knowledge base but couldn't find specific information about that topic.

Your knowledge base currently contains:
- Scientific papers on procrastination neuroscience and psychology
- Expert content on Pomodoro Technique and Eisenhower Matrix
- Coaching conversations from real sessions

Could you rephrase your question or ask about:
- Pomodoro Technique
- Eisenhower Matrix
- Procrastination psychology
- Focus techniques
- Task prioritization
"""