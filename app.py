import streamlit as st
import time
import yaml
from core.engine import GemmaEngine
from core.memory import AgentMemory
from core.tools import search_web # We will move your search logic here

# --- PAGE CONFIG (Google AI Studio Look) ---
st.set_page_config(page_title="Gemma AI Studio", layout="wide", page_icon="🪄")

# Inject Custom CSS for the "Google" feel
st.markdown("""
    <style>
    .stApp { background-color: #ffffff; }
    .stSidebar { background-color: #f8f9fa; border-right: 1px solid #e0e0e0; }
    .stChatMessage { border-radius: 10px; padding: 15px; margin-bottom: 10px; }
    code { color: #d73a49; }
    </style>
""", unsafe_allow_html=True)

# --- INITIALIZE CORE ENGINES (Cached to avoid reloading RAM) ---
@st.cache_resource
def init_agent():
    engine = GemmaEngine()
    memory = AgentMemory()
    return engine, memory

engine, memory = init_agent()

# --- SIDEBAR (Settings & Tools) ---
with st.sidebar:
    st.title("Gemma M4 Agent")
    st.divider()
    
    st.subheader("Model Settings")
    temp = st.slider("Temperature", 0.0, 1.0, 0.7)
    max_t = st.slider("Max Tokens", 128, 4096, 1024)
    
    st.divider()
    st.subheader("Tools")
    use_rag = st.toggle("Library RAG (Pendrive)", value=True)
    use_web = st.toggle("Google Search (DDG)", value=False)
    
    if st.button("Clear Chat History"):
        st.session_state.messages = []

# --- CHAT INTERFACE ---
if "messages" not in st.session_state:
    st.session_state.messages = []

# Display history
for message in st.session_state.messages:
    with st.chat_message(message["role"]):
        st.markdown(message["content"])

# User Input
if prompt := st.chat_input("Ask Gemma anything..."):
    st.session_state.messages.append({"role": "user", "content": prompt})
    with st.chat_message("user"):
        st.markdown(prompt)

    with st.chat_message("assistant"):
        response_placeholder = st.empty()
        full_response = ""
        
        # 1. PRE-PROCESS CONTEXT (Fixes the loop)
        context = ""
        if use_rag:
            context += memory.get_context(prompt)
        if use_web:
            # We fetch web results ONCE before inference starts
            with st.status("Scouring the web...", expanded=False):
                context += search_web(prompt)
        
        # 2. CONSTRUCT FINAL PROMPT
        system_instructions = "You are a Senior Google Software Engineer. Use the provided context to answer precisely."
        final_prompt = f"<bos><start_of_turn>user\nContext:\n{context}\n\nTask: {system_instructions}\nQuery: {prompt}<end_of_turn>\n<start_of_turn>model\n"

        # 3. STREAMING INFERENCE
        for text_chunk in engine.generate_stream(final_prompt, temp, max_t):
            full_response += text_chunk
            response_placeholder.markdown(full_response + "▌")
        
        response_placeholder.markdown(full_response)
        st.session_state.messages.append({"role": "assistant", "content": full_response})