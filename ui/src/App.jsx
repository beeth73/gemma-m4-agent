import React, { useState, useEffect, useRef } from 'react';
import { Play, RotateCcw, Copy, Trash2, Globe, Terminal, Sparkles, Settings2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

export default function App() {
  // --- STATE MANAGEMENT ---
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hello! I am Gemma 4. My logic is running locally on your M4 Silicon. How can I help you code today?' }
  ]);
  const [input, setInput] = useState("");
  const [system, setSystem] = useState("You are a helpful coding assistant. Respond in clear Markdown with code blocks where applicable.");
  const [useWeb, setUseWeb] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  
  // Run Settings (AI Studio Style)
  const [temp, setTemp] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(4096); 
  
  const scrollRef = useRef(null);

  // Auto-scroll logic
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages]);

  // --- CORE LOGIC ---
  const handleSend = async (overrideInput = null) => {
    const textToSend = overrideInput || input;
    if (!textToSend || isStreaming) return;
    
    setInput("");
    setMessages(prev => [...prev, { role: 'user', content: textToSend }, { role: 'assistant', content: "" }]);
    setIsStreaming(true);

    try {
      const response = await fetch("http://localhost:8000/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          prompt: textToSend, 
          system_instruction: system, 
          use_web: useWeb,
          temperature: parseFloat(temp),
          max_tokens: parseInt(maxTokens) 
        })
      });

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");
        
        for (let line of lines) {
          if (line.startsWith("data: ")) {
            const dataStr = line.replace("data: ", "").trim();
            if (dataStr === "[DONE]") {
              setIsStreaming(false);
              continue;
            }
            try {
              const data = JSON.parse(dataStr);
              accumulated += data.text;
              setMessages(prev => {
                const updated = [...prev];
                updated[updated.length - 1].content = accumulated;
                return updated;
              });
            } catch (e) { }
          }
        }
      }
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: "⚠️ **System Error:** Connection to M4 Backend failed. Ensure `python -m api.main` is running." }]);
      setIsStreaming(false);
    }
  };

  const handleEditAndRerun = (index) => {
    const previousUserContent = messages[index].content;
    setInput(previousUserContent);
    setMessages(messages.slice(0, index)); 
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="flex h-screen w-screen bg-[#000000] text-gray-200 font-sans selection:bg-blue-500/30 overflow-hidden">
      
      {/* --- SIDEBAR (Left) --- */}
      <aside className="w-80 bg-[#0a0a0a] border-r border-[#1a1a1a] p-6 flex flex-col shrink-0 overflow-y-auto custom-scrollbar">
        <div className="flex items-center gap-3 mb-10">
          <div className="bg-blue-600 p-2 rounded-lg shadow-lg shadow-blue-900/20">
            <Terminal size={20} className="text-white" />
          </div>
          <h1 className="text-lg font-bold tracking-tight text-white">Gemma Studio</h1>
        </div>

        <div className="flex-1 flex flex-col gap-8">
          {/* System Prompt */}
          <div>
            <label className="text-[10px] uppercase tracking-[0.2em] text-gray-500 font-bold mb-3 block">System Instructions</label>
            <textarea 
              value={system} 
              onChange={(e) => setSystem(e.target.value)}
              className="w-full bg-[#000000] border border-[#222] rounded-xl p-4 text-xs h-40 resize-none focus:border-blue-500 transition-all outline-none leading-relaxed"
              placeholder="Define agent behavior..."
            />
          </div>

          {/* Model Settings */}
          <div className="space-y-6">
            <label className="text-[10px] uppercase tracking-[0.2em] text-gray-500 font-bold block">Run Settings</label>
            
            <div className="space-y-3">
              <div className="flex justify-between text-[10px] text-gray-400 font-medium">
                <span>Temperature</span>
                <span className="text-blue-400">{temp}</span>
              </div>
              <input 
                type="range" min="0" max="1" step="0.1" 
                value={temp} 
                onChange={(e) => setTemp(e.target.value)}
                className="w-full h-1 bg-[#222] rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
            </div>

            <div className="space-y-3">
              <div className="flex justify-between text-[10px] text-gray-400 font-medium">
                <span>Max Output Tokens</span>
                <span className="text-blue-400">{maxTokens}</span>
              </div>
              <input 
                type="range" min="128" max="8192" step="128" 
                value={maxTokens} 
                onChange={(e) => setMaxTokens(e.target.value)}
                className="w-full h-1 bg-[#222] rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
            </div>
          </div>

          {/* Grounding Tools */}
          <div className="space-y-4">
            <label className="text-[10px] uppercase tracking-[0.2em] text-gray-500 font-bold block">Grounding Tools</label>
            <button 
              onClick={() => setUseWeb(!useWeb)} 
              className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all ${useWeb ? 'border-blue-500/50 bg-blue-500/5 text-blue-400' : 'border-[#222] bg-[#000000] text-gray-400'}`}
            >
              <div className="flex items-center gap-3">
                <Globe size={16} />
                <span className="text-sm font-medium">Google Search</span>
              </div>
              <div className={`w-2 h-2 rounded-full ${useWeb ? 'bg-blue-500 animate-pulse' : 'bg-gray-800'}`} />
            </button>
          </div>
        </div>

        <button onClick={() => setMessages([{role: 'assistant', content: 'Session cleared. Ready.'}])} className="mt-8 flex items-center gap-2 text-xs text-gray-600 hover:text-white transition-colors py-2">
          <Trash2 size={14}/> Clear Session
        </button>
      </aside>

      {/* --- MAIN CHAT AREA (Right) --- */}
      <main className="flex-1 flex flex-col bg-[#000000] relative">
        
        {/* Messages Feed */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-12 custom-scrollbar">
          <div className="max-w-4xl mx-auto space-y-12 pb-20">
            {messages.map((m, i) => (
              <div key={i} className="flex flex-col gap-3 group animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${m.role === 'user' ? 'text-gray-500' : 'text-blue-500'}`}>
                      {m.role === 'user' ? 'USER' : 'GEMMA 4'}
                    </span>
                    {isStreaming && i === messages.length - 1 && m.role === 'assistant' && (
                       <Sparkles size={12} className="text-blue-400 animate-pulse" />
                    )}
                  </div>
                  
                  <div className="flex gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => copyToClipboard(m.content)} title="Copy Text" className="text-gray-600 hover:text-white transition-colors">
                      <Copy size={14}/>
                    </button>
                    {m.role === 'user' && (
                      <button onClick={() => handleEditAndRerun(i)} title="Edit & Rerun" className="text-gray-600 hover:text-white transition-colors">
                        <RotateCcw size={14}/>
                      </button>
                    )}
                  </div>
                </div>

                <div className="text-[15px] leading-relaxed text-gray-200 prose prose-invert prose-blue max-w-none">
                  <ReactMarkdown 
                    remarkPlugins={[remarkGfm]}
                    components={{
                      code({node, inline, className, children, ...props}) {
                        const match = /language-(\w+)/.exec(className || '')
                        return !inline && match ? (
                          <div className="rounded-xl overflow-hidden border border-[#222] my-6 shadow-2xl">
                            <div className="bg-[#111] text-[10px] text-gray-500 px-4 py-2 border-b border-[#222] uppercase font-bold tracking-widest flex justify-between items-center">
                              <span>{match[1]}</span>
                              <span className="text-[8px] text-gray-700">M4-ACCELERATED</span>
                            </div>
                            <SyntaxHighlighter
                              style={vscDarkPlus}
                              language={match[1]}
                              PreTag="div"
                              customStyle={{ margin: 0, background: '#050505', padding: '1.5rem', fontSize: '13px', lineHeight: '1.6' }}
                              {...props}
                            >
                              {String(children).replace(/\n$/, '')}
                            </SyntaxHighlighter>
                          </div>
                        ) : (
                          <code className="bg-[#1a1a1a] text-blue-400 px-1.5 py-0.5 rounded text-sm font-mono border border-[#222]" {...props}>
                            {children}
                          </code>
                        )
                      }
                    }}
                  >
                    {m.content}
                  </ReactMarkdown>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* --- INPUT DOCK --- */}
        <div className="p-8 bg-gradient-to-t from-[#000000] via-[#000000] to-transparent">
          <div className="max-w-4xl mx-auto relative group">
            <textarea 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Ask anything..."
              className="w-full bg-[#0a0a0a] border border-[#222] rounded-2xl p-6 pr-16 focus:border-[#333] transition-all outline-none min-h-[100px] text-sm shadow-2xl placeholder:text-gray-700"
            />
            <button 
              onClick={() => handleSend()} 
              disabled={isStreaming || !input}
              className={`absolute bottom-5 right-5 p-3 rounded-xl transition-all shadow-lg ${isStreaming || !input ? 'bg-gray-900 text-gray-700' : 'bg-white text-black hover:scale-105 active:scale-95'}`}
            >
              <Play size={18} fill={isStreaming || !input ? "none" : "currentColor"} />
            </button>
          </div>
          <div className="max-w-4xl mx-auto flex justify-between items-center mt-4 px-2">
            <p className="text-[10px] text-gray-700 uppercase tracking-widest font-bold">Local • 8-Bit Quantized</p>
            <p className="text-[10px] text-gray-700 uppercase tracking-widest font-bold">Apple Silicon M4</p>
          </div>
        </div>
      </main>
    </div>
  );
}