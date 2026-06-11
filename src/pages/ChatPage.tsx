import { useState, useRef, useEffect } from "react";
import { ArrowUp, Paperclip, Bot, FileText, Search, BookOpen } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { useLocation } from "react-router-dom";

interface Message {
  role: "user" | "model" | "system";
  content: string;
  sources?: any[];
  mode?: string;
}

export default function ChatPage({ user }: { user: any }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const location = useLocation();
  const [initialQueryProcessed, setInitialQueryProcessed] = useState(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
     if (!initialQueryProcessed) {
        const queryParams = new URLSearchParams(location.search);
        const q = queryParams.get("q");
        if (q) {
           setInput(q);
           // Slight delay to allow state to settle
           setTimeout(() => {
              const syntheticEvent = new KeyboardEvent('keydown', { key: 'Enter' });
              // We simulate submit by calling a dedicated function instead to avoid dealing with event types
              submitQuery(q);
           }, 100);
        }
        setInitialQueryProcessed(true);
     }
  }, [location.search, initialQueryProcessed]);

  const [aiMode, setAiMode] = useState<"RAG" | "INTERNET" | "HYBRID">("HYBRID");

  const submitQuery = async (queryText: string, fileToAttach?: File) => {
    if ((!queryText.trim() && !fileToAttach) || loading) return;
    
    let userMsgContent = queryText;
    if (fileToAttach) {
      userMsgContent = `[Attached file: ${fileToAttach.name}]\n${queryText}`;
    }

    const newMessages: Message[] = [...messages, { role: "user", content: userMsgContent }];
    setMessages(newMessages);
    setInput("");
    setLoading(true);
    
    let documentId = null;
    if (fileToAttach) {
        setMessages(prev => [...prev, { role: "system", content: "Uploading " + fileToAttach.name + "..." }]);
        const formData = new FormData();
        formData.append("file", fileToAttach);
        try {
            const upRes = await fetch("/api/documents/upload", { method: "POST", body: formData });
            if (upRes.ok) {
                const data = await upRes.json();
                documentId = data.documentId;
                setAttachedFile(null);
                setMessages(prev => [...prev, { role: "system", content: "Upload complete. Analyzing..." }]);
            } else {
                throw new Error("Upload failed");
            }
        } catch(e: any) {
            setMessages(prev => [...prev, { role: "system", content: "Failed to upload document." }]);
            setLoading(false);
            return;
        }
    }

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          message: queryText,
          documentId,
          aiMode,
          history: newMessages.map(m => ({ role: m.role, content: m.content }))
        })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Failed to get response");
      }
      
      if (!response.body) throw new Error("No response body");
      
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulatedResponse = "";
      let parsedSources: any[] = [];
      let parsedMode = "RAG";
      let isFirstChunk = true;

      setMessages(prev => [...prev, { role: "model", content: "", sources: [], mode: "RAG" }]);

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });
        
        if (isFirstChunk && chunk.startsWith("data: ")) {
           isFirstChunk = false;
           const endOfData = chunk.indexOf("\n\n");
           if (endOfData !== -1) {
              const dataStr = chunk.substring(6, endOfData);
              try {
                const metadata = JSON.parse(dataStr);
                parsedSources = metadata.sources || [];
                parsedMode = metadata.mode || "RAG";
              } catch (e) {
                 console.error("Failed to parse sources", e);
              }
              const remaining = chunk.substring(endOfData + 2);
              accumulatedResponse += remaining;
           }
        } else {
           accumulatedResponse += chunk;
        }

        setMessages(prev => {
          const newMsgList = [...prev];
          newMsgList[newMsgList.length - 1] = { 
             role: "model", 
             content: accumulatedResponse,
             sources: parsedSources,
             mode: parsedMode
          };
          return newMsgList;
        });
      }
    } catch (err: any) {
      console.error(err);
      setMessages(prev => [...prev, { role: "system", content: "Network error occurred: " + err.message }]);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = () => submitQuery(input, attachedFile || undefined);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#000000]">
      {/* Chat Area */}
      {messages.length === 0 ? (
        <div className="flex-1 overflow-y-auto flex flex-col items-center justify-center p-4">
          <div className="w-16 h-16 bg-[#111111] rounded-2xl flex items-center justify-center mb-6 shadow-xl border border-[#222222]">
            <BookOpenIcon />
          </div>
          <h1 className="text-2xl md:text-3xl font-semibold text-white mb-2 tracking-tight text-center">Kabu AI</h1>
          <p className="text-gray-400 text-sm md:text-base mb-8 text-center max-w-md">Your Academic AI Study Companion. Education in Biblical Perspective.</p>
          
          <div className="max-w-2xl w-full bg-[#111] border border-[#222] rounded-2xl p-6 mb-8 text-sm text-gray-300">
            <h2 className="text-white font-semibold mb-3">How it works:</h2>
            <ul className="space-y-3">
              <li><strong className="text-gray-100">1. RAG Mode:</strong> Restricts the AI to only use answers from documents you or admins have uploaded. Great for precise academic sourcing.</li>
              <li><strong className="text-gray-100">2. Internet Mode:</strong> Allows the AI to browse the web for answers when you need general knowledge.</li>
              <li><strong className="text-gray-100">3. Hybrid Mode:</strong> Combines verified academic documents with Google API & Kimi AI reasoning for comprehensive answers.</li>
              <li><strong className="text-gray-100">4. File Uploads:</strong> Click the paperclip icon below to upload PDFs or documents for immediate analysis.</li>
            </ul>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl w-full">
            <SuggestedPrompt 
              text="Explain the Data Protection Act in Kenya" 
              onClick={() => setInput("Explain the Data Protection Act in Kenya")} 
            />
            <SuggestedPrompt 
              text="Summarize the key points of Chapter 4" 
              onClick={() => setInput("Summarize the key points of Chapter 4")} 
            />
            <SuggestedPrompt 
              text="Help me prepare for my law exam" 
              onClick={() => setInput("Help me prepare for my law exam")} 
            />
            <SuggestedPrompt 
              text="Create flashcards about negligence" 
              onClick={() => setInput("Create flashcards about negligence")} 
            />
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto py-6 px-4 md:px-0">
          <div className="max-w-3xl mx-auto flex flex-col gap-6">
            {messages.map((message, i) => (
              <div key={i} className={`flex gap-4 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {message.role !== 'user' && (
                  <div className="flex flex-col items-center gap-1 shrink-0 mt-1">
                    <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center">
                      <Bot size={18} className="text-black" />
                    </div>
                    {message.mode && message.role === 'model' && (
                      <div className={`text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-full mt-1 ${message.mode === 'RAG' ? 'bg-blue-900/40 text-blue-400 border border-blue-900/50' : 'bg-purple-900/40 text-purple-400 border border-purple-900/50'}`}>
                        {message.mode}
                      </div>
                    )}
                  </div>
                )}
                
                <div className={`max-w-[85%] md:max-w-[75%] rounded-2xl px-5 py-3.5 ${
                  message.role === 'user' 
                    ? 'bg-[#1A1A1A] text-white border border-[#222222]' 
                    : message.role === 'system'
                    ? 'bg-red-950/30 border border-red-900/50 text-red-200'
                    : 'bg-transparent text-gray-200'
                }`}>
                  {message.role === 'model' ? (
                    <div className="prose prose-invert prose-p:leading-relaxed prose-pre:bg-[#111111] prose-pre:border prose-pre:border-[#222222] max-w-none">
                      <ReactMarkdown>{message.content}</ReactMarkdown>
                      {message.sources && message.sources.length > 0 && (
                        <div className="mt-6 pt-4 border-t border-[#222222]">
                          <div className="flex items-center gap-2 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                            <BookOpenIcon small /> Citations & Sources
                          </div>
                          <div className="flex flex-col gap-2">
                            {message.sources.map((src, idx) => (
                              <div key={idx} className="flex items-start gap-3 bg-[#111111] border border-[#222222] p-3 rounded-lg">
                                <FileText size={16} className="text-gray-500 mt-0.5" />
                                <div>
                                  <p className="text-sm font-medium text-gray-200">{src.title}</p>
                                  {(src.author || src.year) && <p className="text-xs text-gray-500 mt-0.5">{src.author} {src.year ? `(${src.year})` : ''}</p>}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="whitespace-pre-wrap text-sm leading-relaxed">{message.content}</div>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-white flex shrink-0 items-center justify-center mt-1">
                  <Bot size={18} className="text-black" />
                </div>
                <div className="bg-transparent text-gray-400 px-5 py-3.5 flex items-center gap-2">
                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce [animation-delay:0.2s]" />
                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce [animation-delay:0.4s]" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="w-full max-w-3xl mx-auto px-4 pb-6 pt-2">
        <div className="flex gap-2 mb-3">
          <select 
            value={aiMode} 
            onChange={(e: any) => setAiMode(e.target.value)}
            className="bg-[#111111] border border-[#222] text-xs font-medium text-gray-300 rounded-lg px-3 py-1.5 focus:outline-none focus:border-gray-500"
          >
            <option value="RAG">RAG Only (Strict docs)</option>
            <option value="INTERNET">Internet Only (Web + AI)</option>
            <option value="HYBRID">Hybrid (Docs + Web + AI)</option>
          </select>
        </div>
        {attachedFile && (
          <div className="mb-3 flex items-center justify-between bg-[#111111] border border-[#222222] rounded-lg p-3 max-w-xs transition-all">
            <div className="flex items-center gap-3 overflow-hidden">
              <FileText size={18} className="text-gray-400 shrink-0" />
              <span className="text-sm text-gray-300 truncate">{attachedFile.name}</span>
            </div>
            <button onClick={() => setAttachedFile(null)} className="text-gray-500 hover:text-white shrink-0 ml-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
            </button>
          </div>
        )}
        
        <div className="bg-[#111111] border border-[#222222] rounded-[24px] focus-within:border-gray-600 focus-within:bg-[#151515] transition-colors p-2 flex items-end shadow-lg">
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            onChange={(e) => {
              if (e.target.files?.[0]) setAttachedFile(e.target.files[0]);
              e.target.value = '';
            }}
            accept=".pdf,.txt,.docx,.pptx,.png,.jpg,.jpeg,.webp"
          />
          <button 
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-2.5 rounded-full text-gray-400 hover:bg-[#222222] hover:text-white transition-colors shrink-0 m-1"
          >
            <Paperclip size={20} />
          </button>
          
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything or upload a document..."
            className="w-full max-h-48 bg-transparent text-gray-100 placeholder-gray-500 border-none outline-none resize-none py-3.5 px-2 text-sm md:text-base"
            rows={1}
            style={{ minHeight: '48px', height: 'auto' }}
          />
          
          <button 
            onClick={handleSend}
            disabled={(!input.trim() && !attachedFile) || loading}
            className="p-2.5 rounded-full bg-white text-black hover:bg-gray-200 transition-colors shrink-0 disabled:opacity-50 disabled:bg-[#333] disabled:text-gray-500 disabled:cursor-not-allowed m-1"
          >
            <ArrowUp size={20} strokeWidth={2.5} />
          </button>
        </div>
        <div className="text-center mt-3">
          <span className="text-[11px] text-gray-600">Kabu AI retrieves information from verified academic resources. Information may not be exhaustive.</span>
        </div>
      </div>
    </div>
  );
}

function SuggestedPrompt({ text, onClick }: { text: string; onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className="text-left bg-[#111111] border border-[#222222] hover:bg-[#1A1A1A] hover:border-gray-700 transition-all p-4 text-sm text-gray-300 rounded-xl"
    >
      {text}
    </button>
  );
}

function BookOpenIcon({ small }: { small?: boolean }) {
  return <BookOpen size={small ? 14 : 32} className={small ? '' : 'text-white'} />;
}
