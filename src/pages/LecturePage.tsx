import { useState, useRef } from "react";
import { Mic, Square, Save, Play, Clock, CircleAlert } from "lucide-react";

export default function LecturePage() {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [status, setStatus] = useState("Ready to record lecture notes.");
  const [processing, setProcessing] = useState(false);

  const handleStartRecording = () => {
    setIsRecording(true);
    setStatus("Recording active... (Simulation)");
  };

  const handleStopRecording = async () => {
    setIsRecording(false);
    setProcessing(true);
    setStatus("Processing transcript securely...");
    
    // Simulate AI processing delay
    await new Promise((res) => setTimeout(res, 2500));
    
    setTranscript("Constitutional Law Summary: The structural separation of powers provides internal checks and balances. The executive acts, the legislature dictates, and the judiciary interprets. Note the critical precedent in establishing judicial review.");
    setProcessing(false);
    setStatus("Lecture processed and note created securely. Ready to save.");
  };

  return (
    <div className="h-full bg-[#000000] text-white p-6 relative flex flex-col md:p-12">
      <div className="max-w-4xl mx-auto w-full h-full flex flex-col">
        <header className="mb-8">
          <h1 className="text-3xl font-semibold tracking-tight mb-2">Lecture Notes AI</h1>
          <p className="text-sm text-gray-400">Record your lecture to generate structured, formatted notes securely.</p>
        </header>

        <div className="bg-[#111111] border border-[#222222] p-8 rounded-3xl mb-8 flex flex-col items-center justify-center min-h-[240px] relative overflow-hidden flex-shrink-0 shadow-xl">
          {isRecording && (
            <div className="absolute inset-0 rounded-3xl animate-pulse bg-red-900/5 border-2 border-red-900/20" />
          )}
          
          <div className="z-10 flex flex-col items-center">
            {isRecording ? (
              <button 
                onClick={handleStopRecording}
                className="w-20 h-20 bg-white shadow-lg rounded-full flex items-center justify-center hover:scale-105 transition-transform mb-4"
              >
                <Square className="text-red-500 fill-red-500" size={28} />
              </button>
            ) : (
              <button 
                onClick={handleStartRecording}
                disabled={processing}
                className="w-20 h-20 border-2 border-[#333] hover:bg-[#1A1A1A] hover:border-gray-500 rounded-full flex items-center justify-center transition-all mb-4 disabled:opacity-50"
              >
                <Mic className="text-gray-300" size={32} />
              </button>
            )}
            
            <div className="flex items-center gap-2 text-sm text-gray-400 font-medium">
              {processing && <RefreshCcw className="animate-spin" size={14} />}
              {status}
            </div>
            
            {isRecording && (
               <div className="mt-4 flex items-center gap-2 text-red-500 font-mono text-xs font-semibold tracking-widest uppercase">
                 <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                 Recording
               </div>
            )}
          </div>
        </div>

        <div className="flex-1 bg-[#1A1A1A] border border-[#333] rounded-2xl p-6 overflow-y-auto">
          {transcript ? (
            <div className="prose prose-invert max-w-none">
              <h3 className="text-lg font-semibold mb-4 text-white">Generated Structured Notes</h3>
              <p className="text-gray-300 leading-relaxed text-sm">
                {transcript}
              </p>
            </div>
          ) : (
             <div className="w-full h-full flex flex-col items-center justify-center text-gray-600">
                <Clock size={32} className="mb-4 opacity-50" />
                <p>Waiting for lecture recording...</p>
             </div>
          )}
        </div>
        
        {transcript && (
          <div className="mt-6 flex justify-end gap-4">
             <button onClick={() => setTranscript("")} className="px-6 py-2.5 text-sm font-medium text-gray-400 hover:text-white transition-colors">Discard</button>
             <button className="flex items-center gap-2 bg-white text-black px-6 py-2.5 rounded-xl font-medium text-sm hover:bg-gray-200 shadow-xl transition-all">
               <Save size={16} /> Save Notes
             </button>
          </div>
        )}
      </div>
    </div>
  );
}

// Simple stand-in icon
const RefreshCcw = ({ size, className }: any) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
    <path d="M3 3v5h5"/>
  </svg>
)
