import React, { Component, ErrorInfo, ReactNode } from "react";
import { TriangleAlert, RefreshCcw } from "lucide-react";

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class GlobalErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[#000000] text-white p-6">
          <div className="max-w-md w-full bg-[#111111] border border-[#222222] p-8 rounded-2xl shadow-xl flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-red-900/20 rounded-full flex items-center justify-center mb-6">
              <TriangleAlert className="text-red-500" size={32} />
            </div>
            <h2 className="text-2xl font-bold mb-3 tracking-tight">Something went wrong</h2>
            <p className="text-gray-400 text-sm mb-8 leading-relaxed">
              We encountered an unexpected error. Our system limits have safely caught the crash.
            </p>
            <div className="bg-[#1A1A1A] border border-[#333] p-4 rounded-xl w-full mb-8 text-left overflow-auto max-h-32 text-xs text-red-300 font-mono">
              {this.state.error?.message?.toString() || "Unknown rendering error."}
            </div>
            <button
              onClick={() => window.location.reload()}
              className="flex items-center gap-2 bg-white text-black font-medium px-6 py-3 rounded-xl hover:bg-gray-200 transition-colors w-full justify-center"
            >
              <RefreshCcw size={18} />
              Reload Application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
