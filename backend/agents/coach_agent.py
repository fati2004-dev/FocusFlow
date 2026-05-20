# agents/coach_agent.py - DATA-DRIVEN VERSION
from typing import Dict, Any, List
import sys
import os
import random

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from rag.rag_tool import rag_pipeline


class CoachAgent:
    """
    Coach Agent - NOW USING YOUR 150,000 COACHING CONVERSATIONS
    Finds similar situations in your data and learns from real coaching examples
    """
    
    def __init__(self):
        self.name = "Coach Agent"
        print("   💬 Initializing DATA-DRIVEN Coach Agent...")
        print("      📚 Will search your 150,000 coaching conversations")
    
    def process(self, query: str, shared_state) -> Dict[str, Any]:
        """
        Process query by searching your coaching data for similar situations
        """
        print(f"   🔍 Searching your coaching conversations for: {query[:50]}...")
        
        # 1. SEARCH YOUR DATA for similar coaching situations
        similar_examples = rag_pipeline.retrieve_coaching_examples(query, n=5)
        
        if similar_examples:
            print(f"   ✅ Found {len(similar_examples)} similar coaching examples")
            
            # 2. LEARN from real coaching responses in your data
            response = self._generate_from_examples(query, similar_examples, shared_state)
        else:
            print(f"   ⚠️ No similar examples found, using general approach")
            response = self._generate_general_response(query, shared_state)
        
        return {
            "agent": self.name,
            "response": response,
            "examples_used": len(similar_examples),
            "success": True
        }
    
    def _generate_from_examples(self, query: str, examples: List[Dict], shared_state) -> str:
        """Generate response based on REAL coaching examples from your data"""
        
        # Extract the most relevant example
        best_example = examples[0]
        
        # Build response using your data
        response = f"""I found a similar situation in our coaching conversations that might help:

## 📋 Real Coaching Example (from {best_example['source']}):

**Situation similar to yours:** 
{best_example['text'][:300]}...

## 💡 What Worked:

Based on this example and my understanding of your situation, here's my suggestion:

{self._extract_key_insights(best_example['text'])}

## 🌟 Remember:

You're not alone in this. The coaching data shows many people face similar challenges, and they found ways through them.

Would you like to explore this approach or talk more about what you're experiencing?"""

        # Update shared state with what we learned
        shared_state.user_mood = self._detect_mood(query)
        
        return response
    
    def _generate_general_response(self, query: str, shared_state) -> str:
        """Fallback when no examples found in your data"""
        return """I hear what you're sharing with me.

While I search my coaching database for situations similar to yours, here's what I know:

Your feelings are valid, and seeking support is a sign of strength. 

Could you tell me a bit more about:
1. What specific challenge you're facing?
2. How long this has been going on?
3. What you've already tried?

This will help me find the most relevant coaching examples from our 150,000+ conversations to support you."""
    
    def _extract_key_insights(self, example_text: str) -> str:
        """Extract actionable insights from coaching example"""
        # Simple extraction - in production, use LLM
        sentences = example_text.split('.')
        actionable = [s for s in sentences if len(s) > 30 and any(
            word in s.lower() for word in ['try', 'can', 'start', 'begin', 'step', 'action']
        )]
        
        if actionable:
            return actionable[0] + "."
        return "Breaking down the challenge into small, manageable steps."
    
    def _detect_mood(self, text: str) -> str:
        """Detect user mood from query"""
        mood_indicators = {
            'overwhelmed': ['overwhelm', 'too much', 'can\'t handle'],
            'anxious': ['anxious', 'worry', 'nervous'],
            'stuck': ['stuck', 'can\'t start', 'blocked'],
            'frustrated': ['frustrated', 'annoying', 'ugh']
        }
        
        text_lower = text.lower()
        for mood, keywords in mood_indicators.items():
            if any(kw in text_lower for kw in keywords):
                return mood
        
        return 'neutral'