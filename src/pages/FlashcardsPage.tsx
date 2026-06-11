import { useState, useEffect } from "react";
import { Layers, ChevronLeft, ChevronRight, Eye, Sparkles, Loader2 } from "lucide-react";
import { useLocation } from "react-router-dom";

export default function FlashcardsPage() {
  const [flipped, setFlipped] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [topic, setTopic] = useState("");
  const [cards, setCards] = useState<{question: string, answer: string}[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const location = useLocation();
  const [initialRun, setInitialRun] = useState(false);

  const handleGenerate = async (forcedTopic?: string) => {
     const t = forcedTopic || topic;
     if (!t) return;
     setLoading(true);
     setError("");
     setCards([]);
     setCurrentIndex(0);
     setFlipped(false);
     
     if (!topic && forcedTopic) {
        setTopic(forcedTopic);
     }
     
     try {
       const res = await fetch("/api/flashcards/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ topic: t })
       });
       if (!res.ok) throw new Error("Failed to generate");
       const data = await res.json();
       setCards(data.flashcards || []);
     } catch(e: any) {
        setError(e.message);
     } finally {
        setLoading(false);
     }
  };

  useEffect(() => {
     if (!initialRun) {
        setInitialRun(true);
        const q = new URLSearchParams(location.search).get("q");
        if (q) {
           handleGenerate(q);
        }
     }
  }, [location.search, initialRun]);

  const handleNext = () => {
    if (cards.length === 0) return;
    setFlipped(false);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % cards.length);
    }, 150);
  };

  const handlePrev = () => {
    if (cards.length === 0) return;
    setFlipped(false);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev - 1 + cards.length) % cards.length);
    }, 150);
  };

  return (
    <div className="flex flex-col h-full items-center p-4 md:p-8">
      <div className="w-full max-w-2xl flex justify-between items-center mb-8 mt-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#111111] border border-[#222222] rounded-lg">
            <Layers size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-white tracking-tight">Flashcards</h1>
            <p className="text-sm text-gray-400">Review generated study notes</p>
          </div>
        </div>
        {cards.length > 0 && (
          <div className="px-3 py-1 bg-[#111111] border border-[#222222] rounded-full text-xs font-medium text-gray-300">
            CARD {currentIndex + 1} OF {cards.length}
          </div>
        )}
      </div>

      <div className="w-full max-w-2xl flex gap-2 mb-8 items-center border border-[#333] p-2 rounded-2xl bg-[#0A0A0A]">
         <input 
            type="text" 
            value={topic} 
            onChange={e => setTopic(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleGenerate()}
            placeholder="Enter a topic (e.g. Constitutional Law, Biology)..." 
            className="flex-1 bg-transparent px-4 py-2 text-white outline-none placeholder-gray-600"
         />
         <button 
           onClick={() => handleGenerate()}
           disabled={loading || !topic}
           className="bg-white text-black px-5 py-2.5 rounded-xl font-medium text-sm flex items-center gap-2 hover:bg-gray-200 transition-colors disabled:opacity-50"
         >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />} 
            Generate
         </button>
      </div>
      
      {error && <div className="text-red-400 mb-4">{error}</div>}

      <div className="flex-1 w-full max-w-xl flex flex-col items-center justify-center pb-20">
        
        {loading && (
           <div className="flex flex-col items-center justify-center text-gray-400 space-y-4 my-20">
              <Loader2 size={40} className="animate-spin text-blue-500" />
              <p>Analyzing topic and creating study cards...</p>
           </div>
        )}

        {!loading && cards.length === 0 && (
           <div className="border border-dashed border-[#333] w-full aspect-[4/5] rounded-[32px] flex flex-col items-center justify-center text-gray-500 my-4 bg-[#050505]">
               <Layers size={48} className="mb-4 opacity-50" />
               <p>Enter a topic above to generate AI flashcards</p>
           </div>
        )}

        {!loading && cards.length > 0 && (
          <>
            <div 
              className="w-full aspect-[4/5] bg-[#111111] border border-[#222222] rounded-[32px] p-8 md:p-12 relative flex flex-col items-center justify-center text-center cursor-pointer overflow-hidden group shadow-2xl transition-all"
              onClick={() => setFlipped(!flipped)}
            >
              {/* Subtle inner ring */}
              <div className="absolute inset-2 border border-white/5 rounded-[24px] pointer-events-none" />
              
              <div className="w-12 h-1 bg-[#222222] rounded-full mb-8 absolute top-8" />
              
              <h2 className={`text-2xl md:text-3xl font-medium leading-relaxed tracking-tight transition-opacity duration-300 ${!flipped ? "text-white opacity-100" : "text-gray-400 opacity-0 absolute"}`}>
                {cards[currentIndex].question}
              </h2>
              
              <p className={`text-lg md:text-xl text-gray-200 leading-relaxed font-medium transition-opacity duration-300 ${flipped ? "opacity-100" : "opacity-0 absolute"}`}>
                {cards[currentIndex].answer}
              </p>

              <div className="absolute bottom-10 left-0 w-full flex justify-center">
                 <button 
                    className="px-6 py-2.5 bg-[#1A1A1A] hover:bg-[#222222] border border-[#333] rounded-full text-xs font-semibold text-gray-400 uppercase tracking-widest flex items-center gap-2 transition-colors"
                    onClick={(e) => { e.stopPropagation(); setFlipped(!flipped); }}
                  >
                    <Eye size={16} />
                    {flipped ? "Hide Answer" : "Reveal Answer"}
                  </button>
              </div>
            </div>

            <div className="w-full flex justify-between items-center mt-12 px-4 max-w-sm">
              <button 
                onClick={handlePrev}
                className="w-14 h-14 rounded-full bg-[#111111] border border-[#222222] flex items-center justify-center text-gray-400 hover:text-white hover:border-gray-500 transition-colors"
              >
                <ChevronLeft size={24} />
              </button>
              <button 
                onClick={handleNext}
                className="w-14 h-14 rounded-full bg-white flex items-center justify-center text-black hover:bg-gray-200 transition-colors"
              >
                <ChevronRight size={24} />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
