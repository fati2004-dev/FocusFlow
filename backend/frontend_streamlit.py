# frontend_streamlit.py
import streamlit as st
import sys
import os
import time

# Add backend to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from agents.supervisor import SupervisorAgent, RoutingStrategy
from rag.rag_tool import rag_pipeline

# Page configuration
st.set_page_config(
    page_title="FocusFlow - AI Productivity Coach",
    page_icon="🎯",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Custom CSS for better styling
st.markdown("""
<style>
    .main-header {
        font-size: 2.5rem;
        color: #4CAF50;
        text-align: center;
        margin-bottom: 1rem;
    }
    .agent-badge {
        padding: 4px 12px;
        border-radius: 20px;
        font-size: 0.8rem;
        font-weight: bold;
        display: inline-block;
        margin: 2px;
    }
    .coach { background-color: #FF6B6B; color: white; }
    .planner { background-color: #4ECDC4; color: white; }
    .document { background-color: #45B7D1; color: white; }
    .focus { background-color: #96CEB4; color: white; }
    .user-message {
        background-color: #E8F5E9;
        padding: 10px;
        border-radius: 10px;
        margin: 5px 0;
    }
    .assistant-message {
        background-color: #F5F5F5;
        padding: 10px;
        border-radius: 10px;
        margin: 5px 0;
    }
    .sidebar-header {
        font-size: 1.2rem;
        font-weight: bold;
        margin-top: 20px;
        margin-bottom: 10px;
    }
</style>
""", unsafe_allow_html=True)

# Initialize session state
if 'initialized' not in st.session_state:
    st.session_state.initialized = False
    st.session_state.messages = []
    st.session_state.supervisor = None
    st.session_state.data_loaded = False

# Sidebar
with st.sidebar:
    st.image("https://emojis.slackmojis.com/emojis/2020-04-10/56762/rocket.png", width=50)
    st.title("🎯 FocusFlow")
    st.markdown("---")
    
    # System status
    st.markdown("### 📊 System Status")
    
    if not st.session_state.data_loaded:
        with st.spinner("Loading your data..."):
            try:
                # Load data
                num_docs = rag_pipeline.load_all_data()
                st.session_state.data_loaded = True
                st.success(f"✅ Loaded {num_docs} documents")
            except Exception as e:
                st.error(f"❌ Error loading data: {e}")
    
    if st.session_state.data_loaded and not st.session_state.initialized:
        with st.spinner("Initializing agents..."):
            st.session_state.supervisor = SupervisorAgent()
            st.session_state.initialized = True
        st.success("✅ Agents ready!")
    
    # Agent status
    if st.session_state.initialized:
        st.markdown("### 🤖 Agents Active")
        st.markdown('<span class="agent-badge document">📚 Document Agent</span>', unsafe_allow_html=True)
        st.markdown('<span class="agent-badge coach">💬 Coach Agent</span>', unsafe_allow_html=True)
        st.markdown('<span class="agent-badge planner">📋 Planner Agent</span>', unsafe_allow_html=True)
        st.markdown('<span class="agent-badge focus">⏰ Focus Agent</span>', unsafe_allow_html=True)
    
    st.markdown("---")
    
    # Quick actions
    st.markdown("### ⚡ Quick Actions")
    if st.button("🔄 Reset Conversation"):
        if st.session_state.supervisor:
            st.session_state.supervisor.reset_state()
        st.session_state.messages = []
        st.success("Conversation reset!")
        st.rerun()
    
    if st.button("📊 Show Stats"):
        if st.session_state.supervisor:
            stats = st.session_state.supervisor.shared_state
            st.info(f"""
            - Tasks created: {len(stats.tasks)}
            - Focus sessions: {stats.focus_sessions}
            - Messages: {len(stats.conversation_history)}
            - User mood: {stats.user_mood or 'Not detected'}
            """)
    
    st.markdown("---")
    
    # Help section
    with st.expander("💡 How to use"):
        st.markdown("""
        **Try asking:**
        - "I feel overwhelmed with my work"
        - "What is the Pomodoro Technique?"
        - "Help me plan my study session"
        - "Start a focus timer"
        - "How to stop procrastinating?"
        """)
    
    st.markdown("---")
    st.caption("Powered by LlamaIndex + Ollama | Your data, locally processed")

# Main chat area
st.markdown('<div class="main-header">🧠 FocusFlow - Your AI Productivity Coach</div>', unsafe_allow_html=True)
st.markdown("*Multi-agent system using your coaching conversations, expert content, and scientific papers*")
st.markdown("---")

# Chat container
chat_container = st.container()

with chat_container:
    # Display chat messages
    for message in st.session_state.messages:
        if message["role"] == "user":
            st.markdown(f'<div class="user-message">🧑 **You:** {message["content"]}</div>', unsafe_allow_html=True)
        else:
            st.markdown(f'<div class="assistant-message">🤖 **FocusFlow:** {message["content"]}</div>', unsafe_allow_html=True)

# Input area
col1, col2 = st.columns([6, 1])
with col1:
    user_input = st.chat_input("Type your message here...", key="chat_input")
with col2:
    st.write("")
    st.write("")

if user_input:
    # Add user message
    st.session_state.messages.append({"role": "user", "content": user_input})
    
    # Process with agents
    with st.spinner("🤔 Thinking..."):
        try:
            if st.session_state.supervisor:
                result = st.session_state.supervisor.process_query(
                    user_input,
                    strategy=RoutingStrategy.CONDITIONAL
                )
                response = result['response']
                
                # Add assistant response
                st.session_state.messages.append({"role": "assistant", "content": response})
            else:
                response = "System not ready. Please wait for initialization."
                st.session_state.messages.append({"role": "assistant", "content": response})
        except Exception as e:
            response = f"Error: {str(e)}"
            st.session_state.messages.append({"role": "assistant", "content": response})
    
    # Rerun to update display
    st.rerun()

# Footer
st.markdown("---")
st.caption("💡 Tip: Be specific about your challenges for better coaching!")