import { useState, useRef, useEffect } from "react";
import {
  ShieldAlert,
  Users,
  FileText,
  Database,
  Settings,
  Upload,
  X,
  ShieldCheck,
  HandIcon,
  Bot,
  Sparkles,
  Layers,
  Layout,
  BookOpen,
  Image as ImageIcon,
  Palette,
  CheckCircle,
  Terminal,
  Activity,
  Plus,
  Trash2,
  Edit,
  Globe,
  Lock
} from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";
import { dbService } from "../../services/database";
import { storageService } from "../../services/storage";
import { authService } from "../../services/auth";
import { toast } from "sonner";

function AdminResourceUpload({
  onUploadComplete,
}: {
  onUploadComplete?: (fileName: string) => void;
}) {
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

      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/documents/upload", {
        method: "POST",
        headers: {
          "x-gemini-api-key":
            localStorage.getItem("SETUP_GEMINI_API_KEY") || "",
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(`Upload failed: ${data.error || "Unknown error"}`);
      }

      setStatus("Uploading to Storage...");

      const { publicUrl } = await storageService.uploadFile(userId, file);

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
        originalFilename: file.name,
      });

      setStatus(
        "Document successfully processed and indexed to knowledge base.",
      );
      setFile(null);
      if (onUploadComplete) onUploadComplete(file.name);
      toast.success("Document analyzed and added to the knowledge base!");
    } catch (err: any) {
      console.error(err);
      setStatus(err.message || "Error uploading file. Please try again.");
      toast.error(err.message || "Failed to add document.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="bg-[#111111] border border-[#222222] rounded-2xl p-6 mb-8">
      <h2 className="text-lg font-semibold text-white mb-4">
        Resource Library Upload
      </h2>
      <div className="flex flex-col gap-4">
        {file ? (
          <div className="flex items-center justify-between bg-[#1A1A1A] p-4 rounded-xl border border-[#333]">
            <div className="flex items-center gap-3">
              <FileText className="text-gray-400" />
              <span className="text-gray-200 text-sm font-medium">
                {file.name}
              </span>
            </div>
            {!uploading && (
              <button
                onClick={() => setFile(null)}
                className="text-gray-500 hover:text-white"
              >
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
            <span className="text-gray-400 text-sm">
              Click to upload or drag & drop
            </span>
            <span className="text-gray-600 text-xs mt-1">
              PDF, DOCX, TXT within 5MB
            </span>
            <input
              type="file"
              className="hidden"
              ref={fileInputRef}
              onChange={(e) => {
                if (e.target.files) setFile(e.target.files[0]);
              }}
              accept=".pdf,.txt,.docx,.pptx"
            />
          </div>
        )}

        {status && (
          <div
            className={`text-sm ${
              status.includes("failed") || status.includes("Error")
                ? "text-red-400"
                : "text-green-400"
            }`}
          >
            {status}
          </div>
        )}

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

  // Existing states
  const [documents, setDocuments] = useState<any[]>([]);
  const [testQuery, setTestQuery] = useState("");
  const [testResults, setTestResults] = useState<{
    chunks: string[];
    answer: string;
  } | null>(null);
  const [testingRAG, setTestingRAG] = useState(false);
  
  // Custom CMS / Design / Blog / Media States
  const [settings, setSettings] = useState({
    siteName: "Kabu AI",
    siteDescription: "The Premium AI Research & Study Hub of Kabarak University",
    contactEmail: "support@kabarak.ac.ke",
    contactPhone: "+254 700 000000",
    themeMode: "light",
    primaryColor: "#0f172a",
    accentColor: "#f59e0b",
    logoUrl: "",
    faviconUrl: "",
    footerText: "© 2026 Kabarak University. Powered by Google Gemini AI.",
    allowInternet: true,
    mfaRequired: false,
    rateLimitingEnabled: true
  });

  const [cmsPages, setCmsPages] = useState<any[]>([]);
  const [cmsBlogs, setCmsBlogs] = useState<any[]>([]);
  const [cmsMedia, setCmsMedia] = useState<any[]>([]);

  // Page Editor States
  const [editingPageId, setEditingPageId] = useState<string | null>(null);
  const [pageTitle, setPageTitle] = useState("");
  const [pageSlug, setPageSlug] = useState("");
  const [pageSections, setPageSections] = useState<any[]>([]);

  // Blog Editor States
  const [editingBlogId, setEditingBlogId] = useState<string | null>(null);
  const [blogTitle, setBlogTitle] = useState("");
  const [blogAuthor, setBlogAuthor] = useState("");
  const [blogCategory, setBlogCategory] = useState("Research");
  const [blogCoverUrl, setBlogCoverUrl] = useState("");
  const [blogContent, setBlogContent] = useState("");
  const [blogStatus, setBlogStatus] = useState("Draft");

  // Media upload state
  const mediaInputRef = useRef<HTMLInputElement>(null);
  const [uploadingMedia, setUploadingMedia] = useState(false);

  // AI Connection Handshake States
  const [testingHandshake, setTestingHandshake] = useState(false);
  const [handshakeModel, setHandshakeModel] = useState("gemini-2.5-flash");
  const [handshakeLogs, setHandshakeLogs] = useState<string[]>([]);

  // Load Initial Data
  useEffect(() => {
    const fetchDocs = async () => {
      try {
        const data = await dbService.getDocuments(
          "documents",
          "created_at",
          false,
        );
        setDocuments(data || []);
      } catch (e) {
        console.error("Docs fetch err", e);
      }
    };
    fetchDocs();

    const fetchSettings = async () => {
      try {
        // Retrieve dynamic settings
        let data = await dbService.getDocument("settings", "global");
        if (!data) {
          // preseed in state
          data = await dbService.addDocument("settings", { id: "global", ...settings });
        }
        if (data) setSettings((prev) => ({ ...prev, ...data }));
        if (data?.primaryColor) {
           setHandshakeModel(localStorage.getItem("DbarModel") || "gemini-2.5-flash");
        }
      } catch (e) {
         console.warn("Global settings fetch error; using presets.", e);
      }
    };
    fetchSettings();

    const fetchCMSData = async () => {
      try {
        const pages = await dbService.getDocuments("cms_pages");
        setCmsPages(pages || []);
        
        const blogs = await dbService.getDocuments("cms_blogs", "created_at", false);
        setCmsBlogs(blogs || []);

        const media = await dbService.getDocuments("cms_media", "created_at", false);
        setCmsMedia(media || []);
      } catch (e) {
        console.error("CMS read error:", e);
      }
    };
    fetchCMSData();

    // Subscribe to docs updates
    const unsubscribe = dbService.subscribeToCollection(
      "documents",
      (payload) => {
        fetchDocs();
      },
    );
    return () => {
      unsubscribe();
    };
  }, []);

  const handleDocumentUploaded = () => {
    dbService.getDocuments("documents", "created_at", false).then(data => {
      setDocuments(data || []);
    });
  };

  const updateDocumentStatus = async (docObj: any, newStatus: string) => {
    try {
      await dbService.updateDocument("documents", docObj.id, { status: newStatus });
      setDocuments(documents.map(d => d.id === docObj.id ? { ...d, status: newStatus } : d));
      
      await fetch("/api/documents/status", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-gemini-api-key": localStorage.getItem("SETUP_GEMINI_API_KEY") || "",
        },
        body: JSON.stringify({ documentId: docObj.documentId, status: newStatus }),
      });
      toast.success(`Document marked as ${newStatus}!`);
    } catch(err) {
      console.error(err);
      toast.error("Status synchronization failed.");
    }
  };

  const handleDeleteDocument = async (id: string) => {
    if (!confirm("Are you sure you want to delete this resource chunk? This cannot be undone.")) return;
    try {
      await dbService.deleteDocument("documents", id);
      setDocuments(documents.filter((doc) => doc.id !== id));
      toast.success("Document removed successfully.");
    } catch (err) {
      toast.error("Could not remove document from database.");
    }
  };

  // ────────────────────────────────────────────────────────
  // CMS DYNAMIC INTERACTIVE PAGE BUILDER
  // ────────────────────────────────────────────────────────

  const startNewPage = () => {
    setEditingPageId("new");
    setPageTitle("");
    setPageSlug("");
    setPageSections([
      { id: "sec_1", type: "Hero", heading: "Welcome to Kabu Research", content: "Experience next-generation academic reasoning." }
    ]);
  };

  const addCmsBuilderSection = (type: string) => {
    const defaultSections: Record<string, any> = {
      Hero: { heading: "New Banner Header", content: "Replace this introduction text with your layout details." },
      Text: { heading: "Faculty Information", content: "Write standard scholarly descriptions or details here." },
      FAQ: { heading: "Frequently Asked Questions", content: "Q: Is Kabu AI certified?\nA: Yes, compliant under university rules." },
      Testimonial: { heading: "Student Testimonials", content: "Review by John Doe: 'This changed my workflow entirely!'" }
    };
    setPageSections([
      ...pageSections,
      { id: `sec_${Date.now()}`, type, ...defaultSections[type] }
    ]);
    toast.success(`Added ${type} component chunk.`);
  };

  const removeBuilderSection = (id: string) => {
    setPageSections(pageSections.filter(s => s.id !== id));
  };

  const saveCmsBuilderPage = async () => {
    if (!pageTitle || !pageSlug) {
      toast.error("Please fill in Title and URL Slug.");
      return;
    }
    try {
      const pageData = {
        title: pageTitle,
        slug: pageSlug,
        sections: pageSections,
        updated_at: new Date().toISOString()
      };

      if (editingPageId === "new") {
        const created = await dbService.addDocument("cms_pages", {
          ...pageData,
          created_at: new Date().toISOString()
        });
        setCmsPages([...cmsPages, created]);
        toast.success("New site view saved dynamically!");
      } else if (editingPageId) {
        await dbService.updateDocument("cms_pages", editingPageId, pageData);
        setCmsPages(cmsPages.map(p => p.id === editingPageId ? { ...p, ...pageData } : p));
        toast.success("Page modified inside CMS.");
      }
      setEditingPageId(null);
    } catch(err) {
      toast.error("CMS Page failed to serialize.");
    }
  };

  // ────────────────────────────────────────────────────────
  // BLOG PUBLISHING PORTAL
  // ────────────────────────────────────────────────────────

  const startNewBlog = () => {
    setEditingBlogId("new");
    setBlogTitle("");
    setBlogAuthor("School Administrations");
    setBlogCategory("Research");
    setBlogCoverUrl("");
    setBlogContent("");
    setBlogStatus("Draft");
  };

  const saveBlog = async () => {
    if (!blogTitle || !blogContent) {
      toast.error("Blogs must contain a title and core text content.");
      return;
    }
    const blogData = {
      title: blogTitle,
      author: blogAuthor,
      category: blogCategory,
      coverUrl: blogCoverUrl || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=600",
      content: blogContent,
      status: blogStatus,
      updated_at: new Date().toISOString()
    };
    try {
      if (editingBlogId === "new") {
        const created = await dbService.addDocument("cms_blogs", {
          ...blogData,
          created_at: new Date().toISOString()
        });
        setCmsBlogs([created, ...cmsBlogs]);
        toast.success("Article has been created!");
      } else if (editingBlogId) {
        await dbService.updateDocument("cms_blogs", editingBlogId, blogData);
        setCmsBlogs(cmsBlogs.map(b => b.id === editingBlogId ? { ...b, ...blogData } : b));
        toast.success("Article updated successfully!");
      }
      setEditingBlogId(null);
    } catch(e) {
      toast.error("Blog serialization error.");
    }
  };

  const deleteBlog = async (id: string) => {
    if (!confirm("Are you sure you want to delete this blog post?")) return;
    try {
      await dbService.deleteDocument("cms_blogs", id);
      setCmsBlogs(cmsBlogs.filter(b => b.id !== id));
      toast.success("Article removed.");
    } catch(e) {
      toast.error("Deletion failed.");
    }
  };

  // ────────────────────────────────────────────────────────
  // MEDIA UPLOAD DASHBOARD
  // ────────────────────────────────────────────────────────

  const triggerMediaFile = () => {
    mediaInputRef.current?.click();
  };

  const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    const item = e.target.files[0];
    setUploadingMedia(true);
    try {
      const user = await authService.getCurrentUser();
      const userId = user?.id || "admin";
      const { publicUrl } = await storageService.uploadFile(userId, item);

      const mediaDoc = await dbService.addDocument("cms_media", {
        name: item.name,
        type: item.type,
        size: item.size,
        url: publicUrl,
        created_at: new Date().toISOString()
      });
      setCmsMedia([mediaDoc, ...cmsMedia]);
      toast.success("Media file indexed in library!");
    } catch(err: any) {
      toast.error(err.message || "Failed to parse file upload.");
    } finally {
      setUploadingMedia(false);
    }
  };

  const deleteMedia = async (id: string) => {
    if (!confirm("Remove this asset from CMS storage?")) return;
    try {
      await dbService.deleteDocument("cms_media", id);
      setCmsMedia(cmsMedia.filter(m => m.id !== id));
      toast.success("Media file deleted.");
    } catch(e) {
      toast.error("Could not complete removal.");
    }
  };

  // ────────────────────────────────────────────────────────
  // APPEARANCE LAYOUT BUILDER & THEME ENGINE
  // ────────────────────────────────────────────────────────

  const saveThemeSettings = async () => {
    try {
      toast.loading("Applying changes and re-building site configurations...");
      await dbService.updateDocument("settings", "global", settings);
      
      // Update endpoint for dynamic model binding
      await fetch("/api/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          geminiKey: localStorage.getItem("SETUP_GEMINI_API_KEY") || "",
          model: handshakeModel
        })
      });

      localStorage.setItem("DbarModel", handshakeModel);
      toast.dismiss();
      toast.success("Site Appearance & Design published live successfully! Future site alterations active without code adjustments.");
    } catch(e) {
      toast.dismiss();
      toast.error("Settings saving timed out.");
    }
  };

  // ────────────────────────────────────────────────────────
  // AI DIAGNOSTICS & VERIFICATION HANDSHAKE
  // ────────────────────────────────────────────────────────

  const runVerificationDiagnostics = async () => {
    setTestingHandshake(true);
    setHandshakeLogs(["[Handshake Mode Initiated]", `Connecting with engine profile: ${handshakeModel}...`]);
    try {
      const startMs = Date.now();
      const res = await fetch("/api/gemini/test-connection", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "x-gemini-api-key": localStorage.getItem("SETUP_GEMINI_API_KEY") || ""
        },
        body: JSON.stringify({ model: handshakeModel })
      });
      const latency = Date.now() - startMs;
      const data = await res.json();
      
      if (res.ok && data.success) {
        setHandshakeLogs(prev => [
          ...prev,
          `[Server Output] Success Handshake established.`,
          `[API Result] Handshake response: "${data.response}"`,
          `[Latency Meter] Handshake completed in ${latency}ms verified.`,
          `[Verdict Status] CHROME SYSTEM ONLINE.`
        ]);
        toast.success("Handshake verified! Gemini engine active.");
      } else {
        setHandshakeLogs(prev => [
          ...prev,
          `[Error Handshake] Connection handshake failed.`,
          `[Logs] Server responded with details: "${data.error || "Handshake handshake timeout"}"`
        ]);
        toast.error("Handshake failed. Check credentials/model limits.");
      }
    } catch(err: any) {
      setHandshakeLogs(prev => [
        ...prev,
        `[Network Error] Ping test terminated: ${err.message}`
      ]);
      toast.error("Network loop failed.");
    } finally {
      setTestingHandshake(false);
    }
  };

  // ────────────────────────────────────────────────────────
  // RAG CONTROL DEMO RETRIEVAL
  // ────────────────────────────────────────────────────────

  const handleTestRetrieval = async () => {
    if (!testQuery) return;
    setTestingRAG(true);
    setTestResults(null);
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-gemini-api-key":
            localStorage.getItem("SETUP_GEMINI_API_KEY") || "",
        },
        body: JSON.stringify({ message: testQuery }),
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
              const metaStr = chunk.replace(/^data:\s*/, "").split("\n\n")[0];
              const meta = JSON.parse(metaStr);
              chunks = meta.sources?.map((s: any) => s.title) || [];
            } catch (e) {}
          } else {
            finalAnswer += chunk;
          }
          setTestResults({ chunks, answer: finalAnswer.trim() });
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setTestingRAG(false);
    }
  };

  const handleTabChange = (newTab: string) => {
    navigate(`/admin/${newTab}`);
  };

  return (
    <div className="flex-1 h-full overflow-y-auto px-4 py-8 md:px-8 bg-[#0A0A0A] text-gray-200">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-white rounded-xl shadow-md">
            <ShieldAlert size={20} className="text-black" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Kabu AI Enterprise CMS</h1>
            <p className="text-sm text-gray-400">
              Configure layout themes, design dynamic pages, publish blogs, and test active AI models code-free.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
           <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-950/40 text-green-400 border border-green-900 rounded-lg text-xs font-semibold uppercase tracking-wider">
              <div className="w-1.5 h-1.5 bg-green-400 rounded-full" /> Setup Mode: Verified
           </span>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard icon={<Users />} label="Total Users" value="1,248" />
        <StatCard icon={<FileText />} label="Academic Docs" value={String(documents.length)} />
        <StatCard icon={<Layout />} label="CMS Views" value={String(cmsPages.length)} />
        <StatCard icon={<Activity />} label="Handshake" value={settings.allowInternet ? "Web Enabled" : "RAG Restrict"} />
      </div>

      {/* Main CMS Tabbed Navigation */}
      <div className="flex border-b border-[#222222] mb-8 overflow-x-auto gap-2">
        {[
          { id: "resources", label: "Resources", icon: <Database size={15} /> },
          { id: "rag-control-center", label: "Retrieve Test", icon: <Bot size={15} /> },
          { id: "web-links", label: "Web Sources", icon: <Globe size={15} /> },
          { id: "cms-pages", label: "Dynamic Pages", icon: <Layout size={15} /> },
          { id: "cms-blogs", label: "Publish Blogs", icon: <BookOpen size={15} /> },
          { id: "cms-media", label: "Media Studio", icon: <ImageIcon size={15} /> },
          { id: "cms-design", label: "Site Appearance", icon: <Palette size={15} /> },
          { id: "settings", label: "AI & Server Defaults", icon: <Settings size={15} /> }
        ].map((tabConfig) => (
          <button
            key={tabConfig.id}
            onClick={() => handleTabChange(tabConfig.id)}
            className={`px-4 py-3 text-sm font-semibold border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap ${
              activeTab === tabConfig.id
                ? "border-white text-white bg-[#111]/30"
                : "border-transparent text-gray-400 hover:text-gray-200"
            }`}
          >
            {tabConfig.icon}
            {tabConfig.label}
          </button>
        ))}
      </div>

      {/* ──────────────────────────────────────────────────────── */}
      {/* TAB: resources */}
      {/* ──────────────────────────────────────────────────────── */}
      {activeTab === "resources" && (
        <div className="space-y-6">
          <AdminResourceUpload onUploadComplete={handleDocumentUploaded} />
          <div className="bg-[#111111] border border-[#222222] rounded-2xl p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-white">Academic Knowledgebase (RAG)</h2>
              <span className="text-xs text-gray-500 font-mono tracking-wider">
                Total Files Indexed: {documents.length}
              </span>
            </div>

            <div className="border border-[#222222] rounded-xl overflow-hidden">
              <table className="w-full text-left text-sm text-gray-400">
                <thead className="bg-[#1A1A1A] text-gray-300">
                  <tr>
                    <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider">Document Title</th>
                    <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider">Category</th>
                    <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#222222]">
                  {documents.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                        No resources indexed yet. Submit documents using the upload section.
                      </td>
                    </tr>
                  ) : (
                    documents.map((doc: any) => (
                      <tr key={doc.id} className="hover:bg-[#1A1A1A]/50 transition-colors">
                        <td className="px-6 py-4 text-white font-medium">
                          {doc.fileUrl ? (
                            <a
                              href={doc.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="hover:underline hover:text-amber-500 transition-colors inline-flex items-center gap-1.5"
                            >
                              <FileText size={14} className="text-gray-400 shrink-0" />
                              {doc.title}
                            </a>
                          ) : (
                            <span className="inline-flex items-center gap-1.5">
                              <FileText size={14} className="text-gray-400 shrink-0" />
                              {doc.title}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-gray-300">
                          {doc.category || "General"}
                        </td>
                        <td className="px-6 py-4">
                          {doc.status === "Draft" ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-gray-800 text-gray-400 border border-gray-700">
                              Draft
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-green-950/40 text-green-400 border border-green-900">
                              <div className="w-1 h-1 rounded-full bg-green-400" />
                              {doc.status || "Indexed"}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right flex justify-end gap-2">
                          {doc.status === "Draft" && (
                            <button
                              onClick={() => updateDocumentStatus(doc, "Published")}
                              className="px-2.5 py-1 text-xs font-semibold text-white bg-green-900 hover:bg-green-800 rounded-lg transition-colors"
                            >
                              Publish
                            </button>
                          )}
                          {doc.status === "Published" && (
                            <button
                              onClick={() => updateDocumentStatus(doc, "Draft")}
                              className="px-2.5 py-1 text-xs font-semibold text-gray-300 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
                            >
                              Draft
                            </button>
                          )}
                          <button
                            onClick={async () => {
                              const title = prompt("Specify custom resource title", doc.title);
                              if (title) {
                                await dbService.updateDocument("documents", doc.id, { title });
                                setDocuments(documents.map(d => d.id === doc.id ? { ...d, title } : d));
                              }
                            }}
                            className="p-1 px-2 rounded hover:bg-gray-800 hover:text-white text-gray-400 text-xs transition-colors"
                          >
                            Rename
                          </button>
                          <button
                            onClick={() => handleDeleteDocument(doc.id)}
                            className="p-1 text-red-500 hover:bg-red-950/40 rounded transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────── */}
      {/* TAB: rag-control-center */}
      {/* ──────────────────────────────────────────────────────── */}
      {activeTab === "rag-control-center" && (
        <div className="space-y-6">
          <div className="bg-[#111111] border border-[#222222] rounded-2xl p-6">
            <h2 className="text-lg font-bold text-white mb-2">Workspace Retrieval Auditer</h2>
            <p className="text-sm text-gray-400 mb-6">
              Formulate a search trigger query to inspect active Chroma chunking matching, cosine weight scores, and stream returns.
            </p>

            <div className="space-y-4">
              <div className="flex gap-2">
                <input
                  value={testQuery}
                  onChange={(e) => setTestQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleTestRetrieval()}
                  placeholder="e.g. Constitutional privacy protections in Kenya..."
                  className="flex-1 bg-[#1A1A1A] border border-[#333] rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-white transition-colors"
                />
                <button
                  onClick={handleTestRetrieval}
                  disabled={testingRAG || !testQuery}
                  className="bg-white text-black font-semibold px-6 py-3 rounded-xl hover:bg-gray-200 transition-colors disabled:opacity-50"
                >
                  {testingRAG ? "Retrieving..." : "Analyze Model Output"}
                </button>
              </div>

              {testResults && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-8">
                  <div className="bg-[#050505] border border-[#222] rounded-xl p-4">
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                       <Database size={12} /> Pulled Vector Chunks
                    </h4>
                    <div className="space-y-2">
                      {testResults.chunks.length > 0 ? (
                        testResults.chunks.map((name, i) => (
                          <div key={i} className="p-2.5 bg-[#111] rounded border border-gray-900 text-xs text-amber-400 font-mono flex items-center gap-1.5">
                             <CheckCircle size={10} className="shrink-0 text-green-500" />
                             {name} [Chunk {i+1}]
                          </div>
                        ))
                      ) : (
                        <span className="text-xs text-gray-500 italic">No contexts returned from vector space.</span>
                      )}
                    </div>
                  </div>

                  <div className="bg-[#050505] border border-[#222] rounded-xl p-4">
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                       <Sparkles size={12} className="text-amber-500" /> Gemini Generation Loop
                    </h4>
                    <div className="p-3 bg-neutral-900 border border-neutral-800 rounded-lg text-sm leading-relaxed text-gray-300">
                      {testResults.answer}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────── */}
      {/* TAB: web-links */}
      {/* ──────────────────────────────────────────────────────── */}
      {activeTab === "web-links" && (
        <div className="bg-[#111111] border border-[#222222] rounded-2xl p-6">
          <h2 className="text-lg font-bold text-white mb-2">Approved Academic Anchors</h2>
          <p className="text-sm text-gray-400 mb-6">
            Register approved university web-domains, e-libraries, or online research archives. The Gemini model is grounded on these anchors during Search.
          </p>

          <div className="bg-[#1A1A1A] p-4 rounded-xl border border-[#333] max-w-xl">
             <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Link registry under compliance settings</div>
             <p className="text-gray-500 text-xs mb-3">Grounding is established dynamically using active web searches. Secure URLs are pinned. </p>
             <div className="p-2 bg-neutral-900 rounded border border-neutral-800 text-xs font-mono text-gray-300">https://lib.kabarak.ac.ke/catalog/*</div>
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────── */}
      {/* TAB: cms-pages */}
      {/* ──────────────────────────────────────────────────────── */}
      {activeTab === "cms-pages" && (
        <div className="space-y-6">
          {editingPageId ? (
            <div className="bg-[#111] border border-[#222] rounded-2xl p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-white">
                  {editingPageId === "new" ? "Interactive Page Designer" : "Update Page Content"}
                </h3>
                <button
                  onClick={() => setEditingPageId(null)}
                  className="p-1 text-gray-400 hover:text-white"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-gray-400 uppercase block mb-1">Page Title</label>
                    <input
                      value={pageTitle}
                      onChange={(e) => setPageTitle(e.target.value)}
                      placeholder="e.g. About Our System"
                      className="w-full bg-[#1A1A1A] border border-[#333] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-400 uppercase block mb-1">URL Path Slug</label>
                    <input
                      value={pageSlug}
                      onChange={(e) => setPageSlug(e.target.value)}
                      placeholder="about-us"
                      className="w-full bg-[#1A1A1A] border border-[#333] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none"
                    />
                  </div>

                  {/* Drag-Drop Simulator Builder Block */}
                  <div>
                    <span className="text-xs font-bold text-gray-400 uppercase block mb-3">Page Document Layout Canvas</span>
                    <div className="border border-[#333] bg-[#0c0c0c] rounded-xl p-4 space-y-3 min-h-[200px]">
                      {pageSections.length === 0 ? (
                        <p className="text-xs text-gray-500 italic text-center py-10">Click components on the right to construct pages dynamically.</p>
                      ) : (
                        pageSections.map((sec, index) => (
                          <div key={sec.id} className="p-3.5 bg-[#181818] rounded-lg border border-[#333] flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-400 border border-amber-900">
                                {sec.type}
                              </span>
                              <div>
                                <input
                                  value={sec.heading}
                                  onChange={(e) => {
                                    const text = e.target.value;
                                    setPageSections(pageSections.map(s => s.id === sec.id ? { ...s, heading: text } : s));
                                  }}
                                  className="bg-transparent text-sm text-white font-semibold focus:outline-none border-b border-transparent hover:border-gray-500"
                                />
                                <input
                                  value={sec.content}
                                  onChange={(e) => {
                                    const text = e.target.value;
                                    setPageSections(pageSections.map(s => s.id === sec.id ? { ...s, content: text } : s));
                                  }}
                                  className="bg-transparent text-xs text-gray-400 block focus:outline-none focus:border-gray-500 w-full mt-1"
                                />
                              </div>
                            </div>
                            <button
                              onClick={() => removeBuilderSection(sec.id)}
                              className="text-red-400 hover:text-red-500 transition-colors"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                {/* Section selection template tray */}
                <div className="bg-[#181818] p-5 rounded-xl border border-[#333] self-start space-y-4">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">CMS Builder Shelf</h4>
                  <p className="text-xs text-gray-400 font-sans">Click blocks below to inject component sections directly into your active canvas.</p>
                  
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { type: "Hero", desc: "Huge top banner" },
                      { type: "Text", desc: "Standard text module" },
                      { type: "FAQ", desc: "Collapsible accordions" },
                      { type: "Testimonial", desc: "Feedback quotes" }
                    ].map(block => (
                      <button
                        key={block.type}
                        onClick={() => addCmsBuilderSection(block.type)}
                        className="p-3 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded-lg text-left transition-colors"
                      >
                        <span className="text-xs font-bold text-amber-500 block">{block.type} Block</span>
                        <span className="text-[10px] text-gray-400">{block.desc}</span>
                      </button>
                    ))}
                  </div>

                  <div className="pt-4 border-t border-gray-800 flex gap-2">
                    <button
                      onClick={saveCmsBuilderPage}
                      className="flex-1 bg-white text-black font-semibold py-2.5 rounded-lg text-xs hover:bg-gray-200 transition-colors"
                    >
                      Save Dynamic View
                    </button>
                    <button
                      onClick={() => setEditingPageId(null)}
                      className="px-4 bg-[#2a2a2a] text-white font-semibold py-2.5 rounded-lg text-xs hover:bg-[#333] transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-[#111111] border border-[#222222] rounded-2xl p-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-lg font-bold text-white">Dynamic Content Builder</h2>
                  <p className="text-xs text-gray-400 mt-1">Design and publish custom university sub-pages instantly without writing any code.</p>
                </div>
                <button
                  onClick={startNewPage}
                  className="bg-white text-black text-xs font-semibold px-4 py-2.5 rounded-xl flex items-center gap-1.5 hover:bg-gray-200 transition-all shadow"
                >
                  <Plus size={14} /> New Site Page
                </button>
              </div>

              <div className="border border-[#222] rounded-xl overflow-hidden">
                <table className="w-full text-left text-sm text-gray-400">
                  <thead className="bg-[#1A1A1A] text-gray-200">
                    <tr>
                      <th className="px-6 py-4 font-semibold text-xs uppercase text-left">Page Title</th>
                      <th className="px-6 py-4 font-semibold text-xs uppercase text-left">Dynamic URL Route</th>
                      <th className="px-6 py-4 font-semibold text-xs uppercase text-center">Sections</th>
                      <th className="px-6 py-4 font-semibold text-xs uppercase text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#222222]">
                    {cmsPages.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                          No customized dynamic pages exist. Try making one!
                        </td>
                      </tr>
                    ) : (
                      cmsPages.map((page) => (
                        <tr key={page.id} className="hover:bg-[#1A1A1A]/30 transition-colors">
                          <td className="px-6 py-4 font-bold text-white text-left">{page.title}</td>
                          <td className="px-6 py-4 font-mono text-xs text-amber-500">/page/{page.slug}</td>
                          <td className="px-6 py-4 text-center font-semibold text-gray-300">{(page.sections || []).length} blocks</td>
                          <td className="px-6 py-4 text-right flex justify-end gap-2">
                            <button
                              onClick={() => {
                                setEditingPageId(page.id);
                                setPageTitle(page.title);
                                setPageSlug(page.slug);
                                setPageSections(page.sections || []);
                              }}
                              className="px-2.5 py-1 text-xs font-semibold bg-gray-800 hover:bg-gray-700 rounded-lg text-white font-sans flex items-center gap-1"
                            >
                              <Edit size={12} /> Designer
                            </button>
                            <button
                              onClick={async () => {
                                if (confirm("Delete this dynamic page?")) {
                                   await dbService.deleteDocument("cms_pages", page.id);
                                   setCmsPages(cmsPages.filter(p => p.id !== page.id));
                                   toast.success("Page deleted.");
                                }
                              }}
                              className="p-1 px-2 text-red-500 hover:bg-red-950/40 rounded transition-colors"
                            >
                              <Trash2 size={13} />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ──────────────────────────────────────────────────────── */}
      {/* Dynamic Blog Publisher TAB */}
      {/* ──────────────────────────────────────────────────────── */}
      {activeTab === "cms-blogs" && (
        <div className="space-y-6">
          {editingBlogId ? (
            <div className="bg-[#111] border border-[#222] rounded-2xl p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-white">Dynamic Blog Publisher</h3>
                <button onClick={() => setEditingBlogId(null)} className="text-gray-400 hover:text-white">
                  <X size={20} />
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-widest block mb-1">Title</label>
                    <input
                      value={blogTitle}
                      onChange={(e) => setBlogTitle(e.target.value)}
                      placeholder="e.g. Advancing AI Research Guidelines"
                      className="w-full bg-[#1A1A1A] border border-[#333] rounded-xl px-4 py-3 text-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-widest block mb-1">Article Body Content (Markdown supported)</label>
                    <textarea
                      value={blogContent}
                      onChange={(e) => setBlogContent(e.target.value)}
                      rows={12}
                      placeholder="Start writing the content article body..."
                      className="w-full bg-[#1A1A1A] border border-[#333] rounded-xl p-4 text-white focus:outline-none font-mono text-sm leading-relaxed"
                    />
                  </div>
                </div>

                <div className="bg-[#181818] p-5 rounded-xl border border-[#333] space-y-4 self-start">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">Publication Details</h4>
                  
                  <div>
                    <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Author Name</label>
                    <input
                      value={blogAuthor}
                      onChange={(e) => setBlogAuthor(e.target.value)}
                      className="w-full bg-[#111] border border-[#333] text-xs p-2.5 rounded-lg text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Category Group</label>
                    <select
                      value={blogCategory}
                      onChange={(e) => setBlogCategory(e.target.value)}
                      className="w-full bg-[#111] border border-[#333] text-xs p-2.5 rounded-lg text-white"
                    >
                      <option value="Research">Research Core</option>
                      <option value="Announcements">General Announcements</option>
                      <option value="Tutorials">Academic Tutorials</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Cover Image URL</label>
                    <input
                      value={blogCoverUrl}
                      onChange={(e) => setBlogCoverUrl(e.target.value)}
                      placeholder="https://images.unsplash.com/..."
                      className="w-full bg-[#111] border border-[#333] text-xs p-2.5 rounded-lg text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Status</label>
                    <select
                      value={blogStatus}
                      onChange={(e) => setBlogStatus(e.target.value)}
                      className="w-full bg-[#111] border border-[#333] text-xs p-2.5 rounded-lg text-white"
                    >
                      <option value="Draft">Save as Draft</option>
                      <option value="Published">Publish Immediately</option>
                    </select>
                  </div>

                  <div className="pt-4 border-t border-gray-800 flex flex-col gap-2">
                    <button
                      onClick={saveBlog}
                      className="w-full bg-white text-black font-semibold py-2.5 rounded-lg text-xs hover:bg-gray-200 transition-colors"
                    >
                      Publish Article
                    </button>
                    <button
                      onClick={() => setEditingBlogId(null)}
                      className="w-full bg-transparent text-gray-400 border border-[#333] py-2.5 rounded-lg text-xs hover:text-white transition-colors"
                    >
                      Cancel Draft
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-[#111111] border border-[#222222] rounded-2xl p-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-lg font-bold text-white">Dynamic Broadcaster Blog</h2>
                  <p className="text-xs text-gray-400 mt-1 font-sans">Draft news columns or notifications. Articles sync code-free to user views.</p>
                </div>
                <button
                  onClick={startNewBlog}
                  className="bg-white text-black text-xs font-semibold px-4 py-2.5 rounded-xl flex items-center gap-1 px-3 shadow"
                >
                  <Plus size={14} /> Compose post
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {cmsBlogs.length === 0 ? (
                  <div className="col-span-full py-16 text-center text-gray-500 text-sm">
                    No publications drafted yet. Create your very first blog article.
                  </div>
                ) : (
                  cmsBlogs.map(blog => (
                    <div key={blog.id} className="bg-[#191919] border border-[#222] rounded-xl overflow-hidden shadow flex flex-col justify-between">
                       <img src={blog.coverUrl} className="h-36 w-full object-cover" alt="Cover" />
                       <div className="p-4 flex-1 flex flex-col justify-between">
                          <div>
                            <div className="flex justify-between items-center mb-1.5">
                              <span className="text-[9px] uppercase tracking-wider font-bold text-amber-500">{blog.category}</span>
                              <span className={`text-[8px] uppercase tracking-wider px-2 py-0.5 rounded font-bold ${blog.status === "Published" ? "bg-green-950/40 text-green-400 border border-green-900" : "bg-neutral-800 text-gray-400"}`}>
                                {blog.status}
                              </span>
                            </div>
                            <h3 className="text-sm font-bold text-white mb-2 line-clamp-1">{blog.title}</h3>
                            <p className="text-gray-400 text-xs line-clamp-2 mb-4">{blog.content}</p>
                          </div>
                          
                          <div className="pt-3 border-t border-gray-800 flex justify-between items-center text-[10px]">
                             <span className="text-gray-500">By {blog.author}</span>
                             <div className="flex gap-2.5">
                                <button
                                  onClick={() => {
                                    setEditingBlogId(blog.id);
                                    setBlogTitle(blog.title);
                                    setBlogAuthor(blog.author);
                                    setBlogCategory(blog.category);
                                    setBlogCoverUrl(blog.coverUrl);
                                    setBlogContent(blog.content);
                                    setBlogStatus(blog.status);
                                  }}
                                  className="text-amber-500 hover:underline font-bold"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => deleteBlog(blog.id)}
                                  className="text-red-500 hover:underline font-bold"
                                >
                                  Delete
                                </button>
                             </div>
                          </div>
                       </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ──────────────────────────────────────────────────────── */}
      {/* Media Studio TAB */}
      {/* ──────────────────────────────────────────────────────── */}
      {activeTab === "cms-media" && (
        <div className="bg-[#111111] border border-[#222222] rounded-2xl p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-lg font-bold text-white">Media Studio Assets</h2>
              <p className="text-xs text-gray-400 mt-1 font-sans">Organize layouts, cover arts, pictures, dynamic maps, and document resources safely.</p>
            </div>
            <div>
              <button
                onClick={triggerMediaFile}
                disabled={uploadingMedia}
                className="bg-white text-black font-semibold text-xs px-4 py-2.5 rounded-xl hover:bg-gray-200 transition-colors flex items-center gap-1.5"
              >
                <Plus size={14} /> {uploadingMedia ? "Processing..." : "Media Upload"}
              </button>
              <input
                type="file"
                ref={mediaInputRef}
                className="hidden"
                accept="image/*,application/pdf"
                onChange={handleMediaUpload}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {cmsMedia.length === 0 ? (
              <div className="col-span-full py-16 text-center text-gray-500 text-sm">
                No items in media vault yet. Click button to upload graphical layout items.
              </div>
            ) : (
              cmsMedia.map(item => (
                <div key={item.id} className="bg-[#181818] border border-neutral-800 rounded-xl overflow-hidden flex flex-col justify-between shadow hover:border-neutral-700 transition-all group">
                   <div className="h-28 bg-[#111] flex items-center justify-center p-2 border-b border-gray-900 relative">
                      {item.type?.startsWith("image/") ? (
                         <img src={item.url} className="h-full w-full object-contain" alt="thumbnail" />
                      ) : (
                         <FileText size={40} className="text-amber-500" />
                      )}
                      
                      <button
                        onClick={() => deleteMedia(item.id)}
                        className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-red-900 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 size={12} />
                      </button>
                   </div>
                   
                   <div className="p-3">
                      <h4 className="text-[11px] text-white font-semibold truncate mb-1">{item.name}</h4>
                      <div className="flex justify-between items-center mt-2.5">
                         <span className="text-[9px] text-gray-500 font-mono">{(item.size / 1024).toFixed(1)} KB</span>
                         <button
                           onClick={() => {
                             navigator.clipboard.writeText(item.url);
                             toast.success("Asset URL copied to clipboard!");
                           }}
                           className="text-[10px] text-amber-500 hover:text-amber-400 font-bold hover:underline"
                         >
                           Copy URL
                         </button>
                      </div>
                   </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────── */}
      {/* Dynamic Site Appearance Settings Builder TAB */}
      {/* ──────────────────────────────────────────────────────── */}
      {activeTab === "cms-design" && (
        <div className="space-y-6">
          <div className="bg-[#111111] border border-[#222222] rounded-2xl p-6">
            <h2 className="text-xl font-bold text-white tracking-tight mb-2">Configure Site Design & Appearance</h2>
            <p className="text-sm text-gray-400 mb-6 font-sans">
              Update layout, title, footer, email settings, brand logo URLs, and primary palettes. Changes are applied instantly.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-gray-400 block mb-1">Site Landing Title</label>
                  <input
                    value={settings.siteName}
                    onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
                    className="w-full bg-[#1A1A1A] border border-[#333] rounded-xl px-4 py-3 text-sm text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-400 block mb-1">Theme Brand Sub-description</label>
                  <textarea
                    value={settings.siteDescription}
                    onChange={(e) => setSettings({ ...settings, siteDescription: e.target.value })}
                    rows={2}
                    className="w-full bg-[#1A1A1A] border border-[#333] rounded-xl px-4 py-3 text-sm text-white focus:outline-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-gray-400 block mb-1">Contact Email</label>
                    <input
                      value={settings.contactEmail}
                      onChange={(e) => setSettings({ ...settings, contactEmail: e.target.value })}
                      className="w-full bg-[#1A1A1A] border border-[#333] rounded-xl p-3 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-400 block mb-1">Support Phone</label>
                    <input
                      value={settings.contactPhone}
                      onChange={(e) => setSettings({ ...settings, contactPhone: e.target.value })}
                      className="w-full bg-[#1A1A1A] border border-[#333] rounded-xl p-3 text-xs text-white"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-gray-400 block mb-1">Logo URL Anchor</label>
                    <input
                      value={settings.logoUrl}
                      onChange={(e) => setSettings({ ...settings, logoUrl: e.target.value })}
                      placeholder="e.g. /favicon.png"
                      className="w-full bg-[#1A1A1A] border border-[#333] rounded-xl p-3 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-400 block mb-1">Favicon URL Link</label>
                    <input
                      value={settings.faviconUrl}
                      onChange={(e) => setSettings({ ...settings, faviconUrl: e.target.value })}
                      placeholder="https://..."
                      className="w-full bg-[#1A1A1A] border border-[#333] rounded-xl p-3 text-xs text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                   {/* Brand color hex fields */}
                  <div>
                    <label className="text-xs font-semibold text-gray-400 block mb-1">Primary Color (Hex)</label>
                    <div className="flex gap-2">
                       <input
                         type="color"
                         value={settings.primaryColor}
                         onChange={(e) => setSettings({ ...settings, primaryColor: e.target.value })}
                         className="w-9 h-9 border bg-transparent border-gray-800 rounded cursor-pointer"
                       />
                       <input
                         value={settings.primaryColor}
                         onChange={(e) => setSettings({ ...settings, primaryColor: e.target.value })}
                         className="flex-1 bg-[#1A1A1A] border border-[#333] rounded-lg px-2 text-xs text-white uppercase text-center"
                       />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-400 block mb-1">Accent Accent (Hex)</label>
                    <div className="flex gap-2">
                       <input
                         type="color"
                         value={settings.accentColor}
                         onChange={(e) => setSettings({ ...settings, accentColor: e.target.value })}
                         className="w-9 h-9 border bg-transparent border-gray-800 rounded cursor-pointer"
                       />
                       <input
                         value={settings.accentColor}
                         onChange={(e) => setSettings({ ...settings, accentColor: e.target.value })}
                         className="flex-1 bg-[#1A1A1A] border border-[#333] rounded-lg px-2 text-xs text-white uppercase text-center"
                       />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-400 block mb-1">Theme Copyright Notice</label>
                  <input
                    value={settings.footerText}
                    onChange={(e) => setSettings({ ...settings, footerText: e.target.value })}
                    className="w-full bg-[#1A1A1A] border border-[#333] rounded-xl px-4 py-3 text-xs text-white focus:outline-none"
                  />
                </div>

                <div className="pt-4">
                  <button
                    onClick={saveThemeSettings}
                    className="w-full bg-white hover:bg-gray-200 text-black font-semibold py-3 rounded-xl text-sm transition-colors"
                  >
                    Publish Appearance Layout
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────── */}
      {/* TAB: analytics */}
      {/* ──────────────────────────────────────────────────────── */}
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
                {[
                  { name: "School of Law", percent: 45 },
                  { name: "School of Business", percent: 25 },
                  { name: "School of Science & Tech", percent: 20 },
                  { name: "Other Faculties", percent: 10 }
                ].map((f, i) => (
                  <div key={i} className="flex flex-col gap-1.5">
                    <div className="flex justify-between text-sm text-gray-300">
                      <span>{f.name}</span>
                      <span className="font-mono text-xs">{f.percent}%</span>
                    </div>
                    <div className="h-2 w-full bg-[#222] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-500 rounded-full"
                        style={{ width: `${f.percent}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-[#111111] border border-[#222] p-6 rounded-2xl">
              <h3 className="text-lg font-medium text-white mb-4">Most Queried Topics</h3>
              <ul className="space-y-3 text-sm text-gray-400">
                <li className="flex justify-between p-3 bg-[#1A1A1A] rounded-xl border border-[#333]">
                  <span>Kenya Constitution Ch 4</span> <span className="font-mono text-amber-500">842 requests</span>
                </li>
                <li className="flex justify-between p-3 bg-[#1A1A1A] rounded-xl border border-[#333]">
                  <span>Microeconomics Fundamentals</span> <span className="font-mono text-amber-500">530 requests</span>
                </li>
                <li className="flex justify-between p-3 bg-[#1A1A1A] rounded-xl border border-[#333]">
                  <span>Theology & Biblical Sourcing</span> <span className="font-mono text-amber-500">412 requests</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────── */}
      {/* TAB: users */}
      {/* ──────────────────────────────────────────────────────── */}
      {activeTab === "users" && (
        <div className="bg-[#111111] border border-[#222222] rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-white mb-6">User Access Management</h2>
          <p className="text-sm text-gray-400 mb-8 font-sans">
            Review and configure permissions of administrators, educators, and campus support. Accounts require institutional authorization.
          </p>
          <div className="bg-[#0A0A0A] border border-[#222] rounded-xl flex items-center justify-center p-12 text-center">
            <div>
              <HandIcon size={40} className="text-[#333] mx-auto mb-4" />
              <p className="text-gray-400 font-medium tracking-tight">No pending access requests.</p>
            </div>
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────── */}
      {/* TAB: settings */}
      {/* ──────────────────────────────────────────────────────── */}
      {activeTab === "settings" && (
        <div className="space-y-6">
          <div className="bg-[#111111] border border-[#222222] rounded-2xl p-6">
            <h2 className="text-lg font-bold text-white mb-2">AI Governance & Model Connection</h2>
            <p className="text-xs text-gray-400 mb-6 font-sans">
              Test and bind specific Gemini AI versions directly. Connection health parameters are displayed below.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-gray-400 block mb-1">Target Intelligence Profile</label>
                  <p className="text-[11px] text-gray-500 mb-2">Switch between models without code change deployment lines.</p>
                  <select
                    value={handshakeModel}
                    onChange={(e) => setHandshakeModel(e.target.value)}
                    className="w-full bg-[#1A1A1A] border border-[#333] rounded-xl px-4 py-3 text-sm text-white focus:outline-none"
                  >
                    <option value="gemini-2.5-flash">gemini-2.5-flash (Standard & Rapid)</option>
                    <option value="gemini-3.5-flash">gemini-3.5-flash (Latest Model)</option>
                    <option value="gemini-3.1-pro-preview">gemini-3.1-pro-preview (Intense reasoning)</option>
                  </select>
                </div>

                <div className="space-y-2 pt-2">
                  <button
                    onClick={runVerificationDiagnostics}
                    disabled={testingHandshake}
                    className="w-full bg-white hover:bg-gray-200 text-black font-semibold py-3 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Terminal size={14} /> {testingHandshake ? "Testing Connection Handshake..." : "Test Gemini Connection"}
                  </button>
                  <button
                    onClick={saveThemeSettings}
                    className="w-full bg-transparent text-white border border-neutral-700 py-3 rounded-xl text-xs font-semibold hover:bg-neutral-900 transition-colors"
                  >
                    Apply Model as Global Server Default
                  </button>
                </div>

                <div className="pt-2 border-t border-gray-800 space-y-3">
                  <div className="flex justify-between items-center p-3 border border-gray-900 rounded-lg bg-[#181818]/60">
                    <div>
                      <h4 className="text-xs font-semibold text-white">Require High Confidence Filter</h4>
                      <p className="text-[10px] text-gray-500 uppercase font-mono tracking-widest mt-1">confidence &gt; 70% threshold</p>
                    </div>
                    <div onClick={() => setSettings({ ...settings, mfaRequired: !settings.mfaRequired })} className="w-10 h-5 bg-blue-600 rounded-full cursor-pointer relative">
                      <div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-transform ${settings.mfaRequired ? "translate-x-5" : "translate-x-1"}`} />
                    </div>
                  </div>
                  <div className="flex justify-between items-center p-3 border border-gray-900 rounded-lg bg-[#181818]/60">
                    <div>
                      <h4 className="text-xs font-semibold text-white">University Security Rate-Limiting</h4>
                      <p className="text-[10px] text-gray-500 uppercase font-mono tracking-widest mt-1">Prevents system abuse lines</p>
                    </div>
                    <div onClick={() => setSettings({ ...settings, rateLimitingEnabled: !settings.rateLimitingEnabled })} className="w-10 h-5 bg-blue-600 rounded-full cursor-pointer relative">
                      <div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-transform ${settings.rateLimitingEnabled ? "translate-x-5" : "translate-x-1"}`} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Handshake Terminal logs output */}
              <div className="bg-black/95 border border-neutral-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col justify-between">
                <div className="bg-[#151515] border-b border-[#222] p-3 px-4 flex items-center justify-between text-xs font-bold text-gray-400 tracking-wider">
                   <div className="flex items-center gap-1.5">
                      <Terminal size={12} className="text-green-500" /> Handshake Terminal Console
                   </div>
                   <div className="flex gap-1">
                      <div className="w-2.5 h-2.5 rounded-full bg-red-500/20" />
                      <div className="w-2.5 h-2.5 rounded-full bg-amber-500/20" />
                      <div className="w-2.5 h-2.5 rounded-full bg-green-500/20" />
                   </div>
                </div>
                <div className="p-4 flex-1 font-mono text-xs text-green-500 space-y-2 bg-[#050505] min-h-[190px] overflow-y-auto leading-relaxed">
                   {handshakeLogs.length === 0 ? (
                      <span className="text-gray-600 italic">Console output inactive. Trigger 'Test Gemini Connection' to run server-side diagnostic connection handshakes.</span>
                   ) : (
                      handshakeLogs.map((log, i) => (
                         <div key={i} className={log.includes("Error") || log.includes("failed") ? "text-red-400" : log.includes("Success") ? "text-green-400 font-bold" : "text-green-500"}>
                            &gt; {log}
                         </div>
                      ))
                   )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="bg-[#111111] border border-[#222222] p-5 rounded-2xl flex flex-col justify-between">
      <div className="text-gray-500 mb-3">{icon}</div>
      <div>
        <div className="text-2xl font-bold text-white tracking-tight mb-1">
          {value}
        </div>
        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">
          {label}
        </div>
      </div>
    </div>
  );
}
