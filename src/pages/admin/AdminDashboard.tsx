import { useState, useRef, useEffect } from "react";
import { ShieldAlert, Users, FileText, Database, Settings, Upload, X, ShieldCheck, HandIcon } from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";
import { dbService } from "../../services/database";
import { storageService } from "../../services/storage";
import { authService } from "../../services/auth";

function AdminResourceUpload({ onUploadComplete }: { onUploadComplete?: (fileName: string) => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setStatus("Uploading and analyzing document...");
    
    try {
      const user = await authService.getCurrentUser();
      const userId = user?.id || "admin";

      // 1. Upload to backend for RAG indexing (simulated or real endpoint)
      const formData = new FormData();
      formData.append("file", file);
      
      const response = await fetch("/api/documents/upload", {
        method: "POST",
        headers: {
           "x-gemini-api-key": localStorage.getItem("SETUP_GEMINI_API_KEY") || "",
           "x-kimi-api-key": localStorage.getItem("SETUP_KIMI_API_KEY") || ""
        },
        body: formData
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(`Upload failed: ${data.error || "Unknown error"}`);
      }

      setStatus("Uploading to Storage...");

      // 2. Upload to Supabase Storage
      const { publicUrl } = await storageService.uploadFile(userId, file);

      // 3. Save to Supabase DB
      await dbService.addDocument("documents", {
        title: file.name,
        category: "General",
        status: "Draft",
        created_at: new Date().toISOString(),
        documentId: data.documentId || `doc_${Date.now()}`,
        fileUrl: publicUrl,
        cloudinaryUrl: publicUrl,
        fileFormat: file.type || "unknown",
        fileSizeBytes: file.size,
        originalFilename: file.name
      });

      setStatus("Document successfully processed and indexed to knowledge base.");
      setFile(null);
      if (onUploadComplete) onUploadComplete(file.name);
    } catch (err: any) {
      console.error(err);
      setStatus(err.message || "Error uploading file. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="bg-[#111111] border border-[#222222] rounded-2xl p-6 mb-8">
      <h2 className="text-lg font-semibold text-white mb-4">Resource Library Upload</h2>
      <div className="flex flex-col gap-4">
        {file ? (
          <div className="flex items-center justify-between bg-[#1A1A1A] p-4 rounded-xl border border-[#333]">
            <div className="flex items-center gap-3">
              <FileText className="text-gray-400" />
              <span className="text-gray-200 text-sm font-medium">{file.name}</span>
            </div>
            {!uploading && (
                <button onClick={() => setFile(null)} className="text-gray-500 hover:text-white">
                  <X size={18} />
                </button>
            )}
          </div>
        ) : (
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-[#333] hover:border-gray-500 rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer transition-colors"
          >
            <Upload size={32} className="text-gray-500 mb-2" />
            <span className="text-gray-400 text-sm">Click to upload or drag & drop</span>
            <span className="text-gray-600 text-xs mt-1">PDF, DOCX, TXT within 5MB</span>
            <input type="file" className="hidden" ref={fileInputRef} onChange={e => {
               if (e.target.files) setFile(e.target.files[0]);
            }} accept=".pdf,.txt,.docx,.pptx" />
          </div>
        )}
        
        {status && <div className={`text-sm ${status.includes('failed') || status.includes('Error') ? 'text-red-400' : 'text-green-400'}`}>{status}</div>}

        <button 
           onClick={handleUpload}
           disabled={!file || uploading}
           className="w-full bg-white text-black font-medium py-3 rounded-xl disabled:opacity-50 disabled:bg-gray-400 hover:bg-gray-200 transition-colors"
        >
           {uploading ? "Processing..." : "Add to Knowledge Base"}
        </button>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const { tab } = useParams();
  const navigate = useNavigate();
  const activeTab = tab || "resources";
  
  const [documents, setDocuments] = useState<any[]>([]);

  useEffect(() => {
    const fetchDocs = async () => {
      try {
        const data = await dbService.getDocuments('documents', 'created_at', false);
        setDocuments(data || []);
      } catch (e) {
        console.error("Docs fetch err", e);
      }
    };
    fetchDocs();
    
    // Subscribe to changes
    const unsubscribe = dbService.subscribeToCollection('documents', (payload) => {
      fetchDocs();
    });
    
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const handleDeleteDocument = async (id: string, fileUrl?: string) => {
    if (confirm("Are you sure you want to delete this document?")) {
      await dbService.deleteDocument("documents", id);
      setDocuments(documents.filter(d => d.id !== id));
      // Optionally handle storage service file deletion if needed by parsing the fileUrl
    }
  };

  const updateDocumentStatus = async (docObj: any, newStatus: string) => {
    // 1. Update DB
    await dbService.updateDocument("documents", docObj.id, { status: newStatus });
    setDocuments(documents.map(d => d.id === docObj.id ? { ...d, status: newStatus } : d));
    // 2. Broadcast to backend memory
    await fetch("/api/documents/status", {
      method: "POST",
      headers: { 
         "Content-Type": "application/json",
         "x-gemini-api-key": localStorage.getItem("SETUP_GEMINI_API_KEY") || "",
         "x-kimi-api-key": localStorage.getItem("SETUP_KIMI_API_KEY") || ""
      },
      body: JSON.stringify({ documentId: docObj.documentId, status: newStatus })
    }).catch(console.error);
  };

  const [testQuery, setTestQuery] = useState("");
  const [testResults, setTestResults] = useState<{chunks: string[], answer: string} | null>(null);
  const [testingRAG, setTestingRAG] = useState(false);
  const [settings, setSettings] = useState({ allowInternet: false });

  // Load Settings
  useEffect(() => {
     const fetchSettings = async () => {
       try {
         const data = await dbService.getDocument('settings', 'global');
         if (data) setSettings(data);
       } catch (e) { }
     };
     fetchSettings();
  }, []);

  const toggleInternetAccess = async () => {
      const newVal = !settings.allowInternet;
      setSettings(prev => ({ ...prev, allowInternet: newVal }));
      try {
        await dbService.updateDocument('settings', 'global', { allowInternet: newVal });
      } catch (err) {
        // Create if it doesn't exist
        try {
           await dbService.addDocument('settings', { id: 'global', allowInternet: newVal });
        } catch(e) {}
      }
  };

  const handleTestRetrieval = async () => {
    if (!testQuery) return;
    setTestingRAG(true);
    setTestResults(null);
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { 
           "Content-Type": "application/json",
           "x-gemini-api-key": localStorage.getItem("SETUP_GEMINI_API_KEY") || "",
           "x-kimi-api-key": localStorage.getItem("SETUP_KIMI_API_KEY") || ""
        },
        body: JSON.stringify({ message: testQuery }) // using the current main chat API for the test
      });
      if (response.body) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let chunks: string[] = [];
        let finalAnswer = "";
        
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          
          if (chunk.startsWith("data: ")) {
            try {
               const metaStr = chunk.replace(/^data:\s*/, '').split('\n\n')[0];
               const meta = JSON.parse(metaStr);
               chunks = meta.sources?.map((s: any) => s.title) || [];
            } catch(e) {}
          } else {
             finalAnswer += chunk;
          }
          setTestResults({ chunks, answer: finalAnswer.trim() });
        }
      }
    } catch(e) {
      console.error(e);
    } finally {
      setTestingRAG(false);
    }
  };

  const handleTabChange = (newTab: string) => {
    navigate(`/admin/${newTab}`);
  };

  return (
    <div className="flex-1 h-full overflow-y-auto px-4 py-8 md:px-8">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-2 bg-white rounded-lg">
          <ShieldAlert size={20} className="text-black" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-white tracking-tight">Control Center</h1>
          <p className="text-sm text-gray-400">Manage resources, users, and AI parameters.</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard icon={<Users />} label="Total Users" value="1,248" />
        <StatCard icon={<FileText />} label="Resources" value="342" />
        <StatCard icon={<Database />} label="Embeddings" value="1.2M" />
        <StatCard icon={<Settings />} label="CMS Version" value="v1.0" />
      </div>

      <div className="flex border-b border-[#222222] mb-8 overflow-x-auto">
        {["resources", "rag-control-center", "web-links", "users", "analytics", "settings"].map((tabName) => (
          <button
            key={tabName}
            onClick={() => handleTabChange(tabName)}
            className={`px-4 py-3 text-sm font-medium capitalize border-b-2 transition-colors whitespace-nowrap ${
              activeTab === tabName
                ? "border-white text-white"
                : "border-transparent text-gray-500 hover:text-gray-300"
            }`}
          >
            {tabName.replace(/-/g, " ")}
          </button>
        ))}
      </div>

      {activeTab === "resources" && (
        <>
          <AdminResourceUpload />
          <div className="bg-[#111111] border border-[#222222] rounded-2xl p-6">
            <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold text-white">Resource Management</h2>
            <button className="bg-white text-black px-4 py-2 rounded-xl text-sm font-medium hover:bg-gray-200 transition-colors">
              Upload New
            </button>
          </div>
          
          <div className="border border-[#222222] rounded-xl overflow-hidden">
            <table className="w-full text-left text-sm text-gray-400">
              <thead className="bg-[#1A1A1A] text-gray-300">
                <tr>
                  <th className="px-6 py-4 font-medium">Document Title</th>
                  <th className="px-6 py-4 font-medium">Category</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#222222]">
                {documents.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-gray-500">No documents found.</td>
                  </tr>
                ) : documents.map((doc: any) => (
                  <tr key={doc.id} className="hover:bg-[#1A1A1A]/50 transition-colors">
                    <td className="px-6 py-4 text-white">
                      {doc.cloudinaryUrl ? (
                         <a href={doc.cloudinaryUrl} target="_blank" rel="noopener noreferrer" className="hover:underline hover:text-blue-400">
                           {doc.title}
                         </a>
                      ) : (
                         <span>{doc.title}</span>
                      )}
                    </td>
                    <td className="px-6 py-4">{doc.category || "General"}</td>
                    <td className="px-6 py-4">
                      {doc.status === 'Draft' ? (
                        <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-gray-900/30 text-gray-400 text-xs font-medium border border-gray-900/50">
                          Draft
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-green-900/30 text-green-400 text-xs font-medium border border-green-900/50">
                          <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
                          {doc.status || "Indexed"}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right flex justify-end gap-3">
                      {doc.status === 'Draft' && (
                        <button 
                          onClick={() => updateDocumentStatus(doc, 'Published')}
                          className="text-blue-500 hover:text-blue-400 transition-colors"
                        >
                          Publish
                        </button>
                      )}
                      {doc.status === 'Published' && (
                        <button 
                          onClick={() => updateDocumentStatus(doc, 'Draft')}
                          className="text-gray-500 hover:text-gray-400 transition-colors"
                        >
                          Unpublish
                        </button>
                      )}
                      {/* Editing could open a modal, but for now simple inline changes */}
                      <button 
                         onClick={async () => {
                           const newTitle = prompt("Enter new title", doc.title);
                           if (newTitle) {
                              await dbService.updateDocument("documents", doc.id, { title: newTitle });
                              setDocuments(documents.map(d => d.id === doc.id ? { ...d, title: newTitle } : d));
                           }
                         }}
                         className="text-gray-500 hover:text-white transition-colors"
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => handleDeleteDocument(doc.id)}
                        className="text-red-500 hover:text-red-400 transition-colors"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        </>
      )}

      {activeTab === "rag-control-center" && (
        <div className="space-y-6">
           <h2 className="text-xl font-semibold text-white tracking-tight mb-4">RAG Control Center</h2>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div className="bg-[#111111] border border-[#222222] rounded-2xl p-6">
               <h3 className="text-lg font-medium text-white mb-4">Upload & Index</h3>
               <p className="text-sm text-gray-400 mb-6">Add new documents to the knowledge base. Files are stored in Cloudinary and vectors in the database.</p>
               <AdminResourceUpload />
             </div>
             
             <div className="bg-[#111111] border border-[#222222] rounded-2xl p-6">
               <h3 className="text-lg font-medium text-white mb-4">Test Retrieval Setup</h3>
               <p className="text-sm text-gray-400 mb-6">Enter a query to see what context chunks are retrieved and verify the AI's sourced answer.</p>
               
                <div className="space-y-4">
                 <div>
                   <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-2">Test Query</label>
                   <div className="flex gap-2">
                     <input 
                       value={testQuery} 
                       onChange={(e) => setTestQuery(e.target.value)} 
                       onKeyDown={(e) => e.key === 'Enter' && handleTestRetrieval()}
                       type="text" 
                       placeholder="e.g. Explain consideration in contract law" 
                       className="flex-1 bg-[#0A0A0A] border border-[#333] rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-white transition-colors" 
                     />
                     <button 
                       onClick={handleTestRetrieval} 
                       disabled={testingRAG}
                       className="bg-white text-black px-4 py-2.5 rounded-xl font-semibold text-sm hover:bg-gray-200 transition-colors disabled:opacity-50"
                     >
                       {testingRAG ? "Running..." : "Run Test"}
                     </button>
                   </div>
                 </div>
                 
                 <div className="bg-[#050505] border border-[#222] rounded-xl p-4 mt-6">
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Retrieved Sources</h4>
                    <div className="bg-[#111] rounded-lg p-3 text-xs text-gray-400 font-mono italic mb-4">
                       {testResults?.chunks?.length ? testResults.chunks.join(", ") : (testingRAG ? "Searching..." : "No test run yet or no sources found.")}
                    </div>
                    
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Final Answer</h4>
                    <div className="bg-[#111] rounded-lg p-3 text-sm text-gray-300">
                       {testResults?.answer ? testResults.answer : (testingRAG ? "Generating..." : "Awaiting query...")}
                    </div>
                 </div>
               </div>
             </div>
           </div>
        </div>
      )}

      {activeTab === "web-links" && (
        <div className="space-y-6">
           <h2 className="text-xl font-semibold text-white tracking-tight mb-4">External Reference Links</h2>
           <div className="bg-[#111111] border border-[#222222] rounded-2xl p-6">
               <h3 className="text-lg font-medium text-white mb-4">Add Approved Web Source</h3>
               <p className="text-sm text-gray-400 mb-6">Add links to e-library sites, journals, or articles. The AI will access these for answers.</p>
               
               <div className="space-y-4 mb-8">
                 <div>
                   <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-2">URL to Index</label>
                   <div className="flex gap-2">
                     <input type="text" placeholder="https://..." className="flex-1 bg-[#0A0A0A] border border-[#333] rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-white transition-colors" />
                     <button className="bg-white text-black px-4 py-2.5 rounded-xl font-semibold text-sm hover:bg-gray-200 transition-colors">Add Link</button>
                   </div>
                 </div>
               </div>

               <div className="border border-[#222222] rounded-xl overflow-hidden mt-8">
                 <table className="w-full text-left text-sm text-gray-400">
                   <thead className="bg-[#1A1A1A] text-gray-300">
                     <tr>
                       <th className="px-6 py-4 font-medium">Link URL</th>
                       <th className="px-6 py-4 font-medium">Status</th>
                       <th className="px-6 py-4 font-medium text-right">Actions</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-[#222222]">
                     <tr className="hover:bg-[#1A1A1A]/50 transition-colors">
                       <td className="px-6 py-4 text-white">https://lib.kabarak.ac.ke/journal/xyz</td>
                       <td className="px-6 py-4">
                         <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-green-900/30 text-green-400 text-xs font-medium border border-green-900/50">
                           <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
                           Active
                         </span>
                       </td>
                       <td className="px-6 py-4 text-right">
                         <button className="text-red-500 hover:text-red-400 transition-colors">Remove</button>
                       </td>
                     </tr>
                     <tr className="hover:bg-[#1A1A1A]/50 transition-colors">
                       <td className="px-6 py-4 text-white">https://jstor.org/stable/12345</td>
                       <td className="px-6 py-4">
                         <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-green-900/30 text-green-400 text-xs font-medium border border-green-900/50">
                           <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
                           Active
                         </span>
                       </td>
                       <td className="px-6 py-4 text-right">
                         <button className="text-red-500 hover:text-red-400 transition-colors">Remove</button>
                       </td>
                     </tr>
                   </tbody>
                 </table>
               </div>
           </div>
        </div>
      )}

      {activeTab === "analytics" && (
        <div className="space-y-6">
           <h2 className="text-xl font-semibold text-white tracking-tight mb-4">Privacy-Safe Analytics</h2>
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <StatCard icon={<Database />} label="Total Queries (Today)" value="4,821" />
              <StatCard icon={<FileText />} label="Resource Lookups" value="8,409" />
              <StatCard icon={<Users />} label="Active Sessions" value="234" />
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
              <div className="bg-[#111111] border border-[#222] p-6 rounded-2xl">
                 <h3 className="text-lg font-medium text-white mb-4">Top Faculties by Usage</h3>
                 <div className="space-y-4">
                     {[{ name: 'School of Law', percent: 45 }, { name: 'School of Business', percent: 25 }, { name: 'School of Medicine', percent: 20 }, { name: 'Other', percent: 10 }].map((f, i) => (
                       <div key={i} className="flex flex-col gap-1.5">
                          <div className="flex justify-between text-sm text-gray-300">
                             <span>{f.name}</span>
                             <span className="font-mono text-xs">{f.percent}%</span>
                          </div>
                          <div className="h-2 w-full bg-[#222] rounded-full overflow-hidden">
                             <div className="h-full bg-blue-500 rounded-full" style={{ width: `${f.percent}%` }}></div>
                          </div>
                       </div>
                     ))}
                 </div>
              </div>
              <div className="bg-[#111111] border border-[#222] p-6 rounded-2xl">
                 <h3 className="text-lg font-medium text-white mb-4">Most Queried Topics</h3>
                 <ul className="space-y-3 text-sm text-gray-400">
                     <li className="flex justify-between p-3 bg-[#1A1A1A] rounded-xl border border-[#333]"><span>Kenya Constitution Ch 4</span> <span className="font-mono">842 req</span></li>
                     <li className="flex justify-between p-3 bg-[#1A1A1A] rounded-xl border border-[#333]"><span>Microeconomics Fundamentals</span> <span className="font-mono">530 req</span></li>
                     <li className="flex justify-between p-3 bg-[#1A1A1A] rounded-xl border border-[#333]"><span>Anatomy Note Generation</span> <span className="font-mono">412 req</span></li>
                 </ul>
              </div>
           </div>
           <p className="text-xs text-gray-500 mt-8 text-center uppercase tracking-widest"><ShieldCheck size={14} className="inline mr-1 -mt-0.5" /> End-to-End Privacy: No raw queries or chat logs are collected.</p>
        </div>
      )}

      {activeTab === "users" && (
        <div className="bg-[#111111] border border-[#222222] rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-white mb-6">User Access Management</h2>
            <p className="text-sm text-gray-400 mb-8">Approve or reject platform access. All accounts must have a valid institutional email.</p>
            <div className="bg-[#0A0A0A] border border-[#222] rounded-xl flex items-center justify-center p-12 text-center">
               <div>
                  <HandIcon size={40} className="text-[#333] mx-auto mb-4" />
                  <p className="text-gray-400 font-medium tracking-tight">No pending access requests.</p>
               </div>
            </div>
        </div>
      )}

      {activeTab === "settings" && (
        <div className="space-y-6">
           <div className="bg-[#111111] border border-[#222222] rounded-2xl p-6">
              <h2 className="text-lg font-semibold text-white mb-4">AI Governance Configuration</h2>
              <div className="space-y-4 max-w-2xl">
                 <div className="flex justify-between items-center p-4 border border-[#333] rounded-xl bg-[#1A1A1A]">
                    <div>
                       <h3 className="font-medium text-white">External Internet Access</h3>
                       <p className="text-xs text-gray-500 uppercase tracking-widest mt-1">If disabled, AI ONLY uses Admin Uploads</p>
                    </div>
                    <div 
                       onClick={toggleInternetAccess}
                       className={`w-12 h-6 rounded-full cursor-pointer relative transition-colors ${settings.allowInternet ? 'bg-blue-600' : 'bg-gray-600'}`}
                    >
                       <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform ${settings.allowInternet ? 'translate-x-6' : 'translate-x-0.5'}`} />
                    </div>
                 </div>
                 <div className="flex justify-between items-center p-4 border border-[#333] rounded-xl bg-[#1A1A1A]">
                    <div>
                       <h3 className="font-medium text-white">Require High Confidence</h3>
                       <p className="text-xs text-gray-500 uppercase tracking-widest mt-1">AI returns 'I don't know' if confidence &lt; 70%</p>
                    </div>
                    <div className="w-12 h-6 bg-blue-600 rounded-full cursor-pointer relative"><div className="w-5 h-5 bg-white rounded-full absolute top-0.5 right-0.5" /></div>
                 </div>
                 <div className="flex justify-between items-center p-4 border border-[#333] rounded-xl bg-[#1A1A1A]">
                    <div>
                       <h3 className="font-medium text-white">Mandatory Citation</h3>
                       <p className="text-xs text-gray-500 uppercase tracking-widest mt-1">Require explicit citation of Knowledge Base documents</p>
                    </div>
                    <div className="w-12 h-6 bg-blue-600 rounded-full cursor-pointer relative"><div className="w-5 h-5 bg-white rounded-full absolute top-0.5 right-0.5" /></div>
                 </div>
              </div>
           </div>
        </div>
       )}
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="bg-[#111111] border border-[#222222] p-5 rounded-2xl">
      <div className="text-gray-500 mb-3">{icon}</div>
      <div className="text-2xl font-semibold text-white tracking-tight mb-1">{value}</div>
      <div className="text-xs font-medium text-gray-500 uppercase tracking-widest">{label}</div>
    </div>
  );
}
