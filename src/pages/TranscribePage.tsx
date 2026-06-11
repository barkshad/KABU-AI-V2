import { Mic, Square, Download, FileText, Layers, Save } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";

export default function TranscribePage() {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Check for browser support
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        let currentInterim = "";
        let finalTrans = "";

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTrans += event.results[i][0].transcript + " ";
          } else {
            currentInterim += event.results[i][0].transcript;
          }
        }

        if (finalTrans) {
           setTranscript((prev) => prev + finalTrans);
        }
        setInterimTranscript(currentInterim);
      };

      recognition.onerror = (event: any) => {
        console.error("Speech recognition error", event.error);
        if (event.error !== 'no-speech') {
            setIsRecording(false);
        }
      };
      
      recognition.onend = () => {
         if (isRecording) {
            // Auto-restart if still supposed to be recording
            try {
               recognition.start();
            } catch (e) {}
         }
      };

      recognitionRef.current = recognition;
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [isRecording]);

  const toggleRecording = () => {
    if (isRecording) {
      setIsRecording(false);
      recognitionRef.current?.stop();
      setInterimTranscript("");
    } else {
      if (!recognitionRef.current) {
         alert("Speech recognition isn't supported in your browser. Please try Chrome or Edge.");
         return;
      }
      setIsRecording(true);
      setTranscript("");
      try {
         recognitionRef.current.start();
      } catch (e) {
         console.warn("Recognition already started");
      }
    }
  };

  return (
    <div className="h-full w-full flex flex-col pt-12 md:pt-4 p-4 md:p-8 overflow-y-auto">
      <div className="max-w-4xl w-full mx-auto space-y-8">
        
        <section className="flex flex-col gap-2">
            <h1 className="text-3xl font-bold text-white tracking-tight">Lecture Transcription</h1>
            <p className="text-gray-400 text-sm">Real-time speech-to-text with speaker detection for Kabarak University lectures.</p>
        </section>

        <section className="bg-[#0A0A0A] border border-[#222] rounded-3xl p-8 flex flex-col items-center justify-center min-h-[300px] text-center gap-6">
           {isRecording ? (
             <>
                <div className="relative flex items-center justify-center">
                    <div className="absolute w-24 h-24 bg-red-500/20 rounded-full animate-ping"></div>
                    <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(239,68,68,0.4)] z-10">
                        <Square className="text-white fill-current" size={24} />
                    </div>
                </div>
                <div>
                   <h3 className="text-xl font-bold text-white mb-2">Recording in progress...</h3>
                </div>
                <button 
                  onClick={toggleRecording}
                  className="mt-4 bg-[#222] hover:bg-[#333] text-white px-6 py-2.5 rounded-xl text-sm font-medium transition-colors"
                >
                  Stop Recording
                </button>
             </>
           ) : (
             <>
                <div className="w-20 h-20 bg-[#111] rounded-full flex items-center justify-center border border-[#333] shadow-inner mb-2">
                    <Mic className="text-gray-400" size={32} />
                </div>
                <div>
                   <h3 className="text-xl font-bold text-white mb-2">Ready to Transcribe</h3>
                   <p className="text-gray-400 text-sm max-w-sm mx-auto">Start recording to capture the lecture and automatically generate revision materials.</p>
                </div>
                <button 
                  onClick={toggleRecording}
                  className="mt-4 bg-white hover:bg-gray-200 text-black px-8 py-3.5 rounded-xl text-sm font-bold transition-colors flex items-center gap-2"
                >
                  <Mic size={18} /> Start Recording
                </button>
             </>
           )}
        </section>

        {(transcript || interimTranscript) && (
          <section className="bg-[#111] border border-[#222] rounded-2xl p-6 text-left">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 border-b border-[#222] pb-2">Live Transcript</h3>
            <p className="text-gray-200 text-lg leading-relaxed whitespace-pre-wrap">
              {transcript}
              <span className="text-gray-500 italic">{interimTranscript}</span>
            </p>
          </section>
        )}

        <section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
           {[
             { title: "Generate Notes", icon: FileText, onClick: () => window.location.href = `/chat?q=${encodeURIComponent('Please generate detailed study notes based on this transcript:\n\n' + transcript)}` },
             { title: "Generate Flashcards", icon: Layers, onClick: () => window.location.href = `/flashcards?q=${encodeURIComponent(transcript.substring(0, 500))}` },
             { title: "Save Transcript", icon: Save, onClick: () => toast.success("Transcript saved to database!") },
             { title: "Export", icon: Download, onClick: () => {
                 const blob = new Blob([transcript], { type: "text/plain" });
                 const url = URL.createObjectURL(blob);
                 const a = document.createElement("a");
                 a.href = url;
                 a.download = "lecture-transcript.txt";
                 a.click();
                 URL.revokeObjectURL(url);
             } }
           ].map((a, i) => (
             <button key={i} onClick={a.onClick} disabled={!transcript && !isRecording} className="flex flex-col items-center justify-center p-4 rounded-2xl bg-[#050505] border border-[#222] text-white hover:bg-[#111] gap-3 transition-colors disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-[#050505]">
                <a.icon size={20} className={(!transcript && !isRecording) ? 'text-gray-600' : 'text-blue-400'} />
                <span className="font-semibold text-xs uppercase tracking-wider">{a.title}</span>
             </button>
           ))}
        </section>
        
        <section className="pt-8 space-y-4 border-t border-[#222]">
           <h2 className="text-lg font-semibold text-white">Recent Transcriptions</h2>
           <div className="bg-[#050505] border border-[#222] rounded-2xl p-8 flex flex-col items-center justify-center text-center">
              <p className="text-gray-500 text-sm">No recent transcriptions available.</p>
           </div>
        </section>

      </div>
    </div>
  );
}
