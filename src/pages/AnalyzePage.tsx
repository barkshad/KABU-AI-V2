import { useState, useRef } from "react";
import { Upload, FileText, Bot, Sparkles, Layers, X, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function AnalyzePage() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [resultId, setResultId] = useState<string | null>(null);
  const [status, setStatus] = useState("");
  const [summary, setSummary] = useState("");
  const [loadingSummary, setLoadingSummary] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (fileToUpload: File) => {
    setFile(fileToUpload);
    setUploading(true);
    setStatus("Uploading and analyzing document...");
    setSummary("");
    
    const formData = new FormData();
    formData.append("file", fileToUpload);

    try {
      const response = await fetch("/api/documents/upload", {
        method: "POST",
        headers: {
           "x-gemini-api-key": localStorage.getItem("SETUP_GEMINI_API_KEY") || ""
        },
        body: formData
      });

      const data = await response.json();
      
      if (response.ok) {
        setStatus("Document successfully processed and indexed!");
        setResultId(data.documentId);
        toast.success("Document analyzed successfully! Generating AI summary...");
        generateSummary(data.documentId);
      } else {
        setStatus(`Upload failed: ${data.error || "Unknown error"}`);
        toast.error(data.error || "Upload failed");
      }
    } catch (err) {
      setStatus("Error uploading file. Please try again.");
      toast.error("Network error during upload.");
    } finally {
      setUploading(false);
    }
  };

  const generateSummary = async (docId: string, eli5 = false) => {
      setLoadingSummary(true);
      try {
         const res = await fetch("/api/documents/summarize", {
            method: "POST",
            headers: { 
               "Content-Type": "application/json",
               "x-gemini-api-key": localStorage.getItem("SETUP_GEMINI_API_KEY") || ""
            },
            body: JSON.stringify({ documentId: docId, eli5 })
         });
         const data = await res.json();
         if (data.summary) {
            setSummary(data.summary);
         }
      } catch(e) {
         console.error(e);
      } finally {
         setLoadingSummary(false);
      }
  };

  return (
    <div className="h-full w-full flex flex-col pt-12 md:pt-4 p-4 md:p-8 overflow-y-auto">
      <div className="max-w-4xl w-full mx-auto space-y-8">
        
        <section className="flex flex-col gap-2">
            <h1 className="text-3xl font-bold text-white tracking-tight">Document Analysis</h1>
            <p className="text-gray-400 text-sm">Upload academic papers, notes, or books for AI-powered extraction and analysis.</p>
        </section>

        {!resultId && !uploading && (
          <section 
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-[#333] hover:border-gray-500 transition-colors rounded-3xl p-12 flex flex-col items-center justify-center text-center bg-[#0A0A0A] group cursor-pointer relative overflow-hidden"
          >
             <input 
                type="file" 
                ref={fileInputRef}
                className="hidden" 
                onChange={(e) => {
                   if (e.target.files && e.target.files[0]) {
                     handleUpload(e.target.files[0]);
                   }
                }}
                accept=".pdf,.txt,.docx,.pptx"
             />
             <div className="bg-[#111] p-4 rounded-full mb-6 group-hover:scale-110 transition-transform duration-300 shadow-xl border border-[#222]">
                <Upload size={32} className="text-white" />
             </div>
             <h3 className="text-xl font-bold text-white mb-2">Upload Document</h3>
             <p className="text-gray-400 text-sm mb-4 max-w-sm">Support for PDF, DOCX, TXT. Documents are securely stored in your personal workspace.</p>
             <span className="text-xs font-mono text-gray-500 bg-[#111] px-3 py-1 rounded-full uppercase tracking-widest border border-[#222]">Click or Drag & Drop</span>
          </section>
        )}

        {(uploading || resultId) && (
           <section className="bg-[#111] border border-[#222] rounded-3xl p-8 flex flex-col items-center text-center">
              {uploading ? (
                 <Loader2 size={40} className="text-blue-500 animate-spin mb-4" />
              ) : (
                 <div className="w-16 h-16 bg-green-900/30 text-green-400 rounded-full flex items-center justify-center mb-4 border border-green-900/50">
                    <FileText size={28} />
                 </div>
              )}
              <h3 className="text-xl font-bold text-white mb-2">{file?.name}</h3>
              <p className={`text-sm ${uploading ? 'text-blue-400' : 'text-green-400'} font-medium mb-6`}>{status}</p>
              
              {resultId && (
                 <div className="flex flex-col sm:flex-row gap-3 w-full max-w-md mt-4">
                    <button onClick={() => window.location.href=`/chat?q=${encodeURIComponent('I just uploaded ' + file?.name + '. What are the key points?')}`} className="flex-1 bg-white hover:bg-gray-200 text-black px-4 py-3 rounded-xl font-medium transition-colors">
                       Chat with Document
                    </button>
                    <button onClick={() => window.location.href=`/flashcards?q=${encodeURIComponent(file?.name || 'Uploaded Document')}`} className="flex-1 bg-[#1A1A1A] border border-[#333] hover:bg-[#222] text-white px-4 py-3 rounded-xl font-medium transition-colors">
                       Generate Flashcards
                    </button>
                    <button onClick={() => window.location.href=`/chat?q=${encodeURIComponent('Please generate a quiz with 5 multiple-choice questions based on ' + (file?.name || 'the uploaded document') + '.')}`} className="flex-1 bg-[#1A1A1A] border border-[#333] hover:bg-[#222] text-white px-4 py-3 rounded-xl font-medium transition-colors">
                       Generate Quiz
                    </button>
                    <button onClick={() => { setFile(null); setResultId(null); setStatus(""); setSummary(""); }} className="p-3 bg-[#1A1A1A] border border-[#333] hover:bg-red-900/40 text-gray-400 hover:text-red-400 rounded-xl transition-colors">
                      <X size={20} />
                    </button>
                 </div>
              )}
           </section>
        )}

        {/* AI Summary Section */}
        {resultId && (loadingSummary || summary) && (
           <section className="bg-[#050505] border border-[#333] rounded-3xl p-6 md:p-8">
              <div className="flex justify-between items-center mb-4">
                 <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <Sparkles size={20} className="text-blue-400" />
                    AI Summary
                 </h2>
                 <button 
                    onClick={() => generateSummary(resultId, true)}
                    disabled={loadingSummary}
                    className="text-xs px-3 py-1.5 bg-[#1A1A1A] border border-[#333] rounded-lg text-gray-400 hover:text-white hover:bg-[#222] transition-colors"
                 >
                    Explain Like I'm 5
                 </button>
              </div>
              {loadingSummary ? (
                 <div className="flex items-center gap-3 text-gray-400">
                    <Loader2 size={18} className="animate-spin text-blue-500" />
                    <span className="text-sm">Reading and summarizing document...</span>
                 </div>
              ) : (
                 <div className="prose prose-invert max-w-none text-gray-300">
                    <p className="leading-relaxed whitespace-pre-wrap">{summary}</p>
                 </div>
              )}
           </section>
        )}
        
        <section className="space-y-4 pt-4">
           <h2 className="text-lg font-semibold text-white flex items-center gap-2"><Sparkles size={18} className="text-blue-500" /> AI Capabilities</h2>
           <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-[#050505] p-5 rounded-2xl border border-[#222]">
                 <FileText size={20} className="text-gray-400 mb-3" />
                 <h4 className="font-semibold text-white mb-2 text-sm">Summarization</h4>
                 <p className="text-xs text-gray-500 leading-relaxed">Extract key points, methodologies, and conclusions from dense research papers.</p>
              </div>
              <div className="bg-[#050505] p-5 rounded-2xl border border-[#222]">
                 <Bot size={20} className="text-gray-400 mb-3" />
                 <h4 className="font-semibold text-white mb-2 text-sm">Interactive Q&amp;A</h4>
                 <p className="text-xs text-gray-500 leading-relaxed">Chat directly with your document to find specific answers and citations.</p>
              </div>
              <div className="bg-[#050505] p-5 rounded-2xl border border-[#222]">
                 <Layers size={20} className="text-gray-400 mb-3" />
                 <h4 className="font-semibold text-white mb-2 text-sm">Study Generation</h4>
                 <p className="text-xs text-gray-500 leading-relaxed">Automatically generate flashcards and practice quizzes from the text.</p>
              </div>
           </div>
        </section>

      </div>
    </div>
  );
}
