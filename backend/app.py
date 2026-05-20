# app.py - FIXED VERSION (checks API instead of CLI)
import sys
import os
import requests

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from agents.supervisor import SupervisorAgent, RoutingStrategy
from rag.rag_tool import rag_pipeline


class FocusFlowApp:
    """
    FocusFlow - COMPLETE DATA-DRIVEN Multi-Agent System
    Uses OLLAMA locally - NO OpenAI required!
    """
    
    def __init__(self):
        print("=" * 60)
        print("🧠 FOCUSFLOW - DATA-DRIVEN Multi-Agent System")
        print("=" * 60)
        print()
        
        # Check Ollama before proceeding
        if not self._check_ollama():
            print("\n Ollama is not running!")
            print("\nPlease start Ollama:")
            print("   1. Open Windows Start Menu")
            print("   2. Search for 'Ollama' and launch it")
            print("   3. OR open Command Prompt and run: ollama serve")
            print("\nThen run this app again.")
            return
        
        # FIRST: Load ALL your data into RAG
        print(" STEP 1: Loading Your Data...")
        num_docs = rag_pipeline.load_all_data()
        
        print(f"\n Your Data Summary:")
        print(f"    Total documents indexed: {num_docs}")
        
        # Check health
        health = rag_pipeline.health_check()
        print(f"    Index status: {'Loaded' if health['index_exists'] else 'Not loaded'}")
        print(f"    Vector store size: {health['collection_size']} chunks")
        
        # SECOND: Initialize agents (they will use RAG)
        print("\n STEP 2: Initializing Data-Driven Agents...")
        self.supervisor = SupervisorAgent()
        
        print("\n✨ System Ready! Using YOUR actual data with Ollama.")
        print("=" * 60)
        print()
    
    def _check_ollama(self) -> bool:
        """Check if Ollama is running by calling its API"""
        print(" Checking Ollama...")
        
        try:
            # Try to connect to Ollama API
            response = requests.get("http://localhost:11434/api/tags", timeout=5)
            if response.status_code == 200:
                data = response.json()
                models = data.get('models', [])
                if models:
                    print(f"   Ollama is running!")
                    print(f"    Available models: {[m['name'] for m in models]}")
                    
                    # Check if llama3.2 is available
                    has_llama = any('llama3.2' in m['name'] for m in models)
                    if has_llama:
                        print(f"    llama3.2:3b model found!")
                    else:
                        print(f"    llama3.2:3b not found. Pulling may take a moment...")
                        print(f"   Run: ollama pull llama3.2:3b")
                    return True
                else:
                    print(f"   Ollama is running but no models pulled yet")
                    print(f"   Run: ollama pull llama3.2:3b")
                    return True
            else:
                print(f"    Ollama API returned unexpected status: {response.status_code}")
                return False
                
        except requests.exceptions.ConnectionError:
            print(f"   ❌ Cannot connect to Ollama API at http://localhost:11434")
            return False
        except Exception as e:
            print(f"   ❌ Error checking Ollama: {e}")
            return False
    
    def run_interactive(self):
        """Run interactive CLI mode"""
        print("\n Interactive Mode - Powered by Your Data")
        print("Type your question or 'quit' to exit")
        print("Type 'stats' to see what data is loaded")
        print("-" * 40)
        
        while True:
            try:
                user_input = input("\n You: ").strip()
                
                if not user_input:
                    continue
                
                if user_input.lower() in ['quit', 'exit', 'q']:
                    print("\n👋 Thank you for using FocusFlow!")
                    break
                
                if user_input.lower() == 'stats':
                    self.show_stats()
                    continue
                
                if user_input.lower() == 'reset':
                    self.supervisor.reset_state()
                    print("✅ Conversation reset!")
                    continue
                
                # Process using your data
                result = self.supervisor.process_query(
                    user_input, 
                    strategy=RoutingStrategy.CONDITIONAL
                )
                
                print(f"\n🤖 Assistant: {result['response']}")
                print(f"\n[Intent: {result['intent']} | Tasks: {result['shared_state']['tasks_count']}]")
                
            except KeyboardInterrupt:
                print("\n\n👋 Goodbye!")
                break
            except Exception as e:
                print(f"\n❌ Error: {e}")
                import traceback
                traceback.print_exc()
    
    def show_stats(self):
        """Show what data is loaded"""
        try:
            health = rag_pipeline.health_check()
            
            # Also check Ollama status
            try:
                ollama_response = requests.get("http://localhost:11434/api/tags", timeout=2)
                ollama_status = "Running" if ollama_response.status_code == 200 else "Unknown"
            except:
                ollama_status = "Not responding"
            
            print(f"""
📊 YOUR DATA STATUS
==================
Coaching conversations: Loaded from CSV files
Expert content: Eisenhower, Pomodoro, Procrastination
Scientific papers: Neuroscience, Psychology, Interventions

RAG Pipeline Status:
- Index loaded: {health['index_exists']}
- Documents in vector store: {health['collection_size']}
- LLM: Ollama (llama3.2:3b) - Status: {ollama_status}

Ready to answer questions using YOUR data!
""")
        except Exception as e:
            print(f"Error getting stats: {e}")


def main():
    app = FocusFlowApp()
    
    # Only run interactive if initialization succeeded
    if hasattr(app, 'supervisor'):
        app.run_interactive()


if __name__ == "__main__":
    main()