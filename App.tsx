import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { NCI_CRITERIA, SCORE_RANGES } from './constants';
import { ScoreCard } from './components/ScoreCard';
import { Dashboard } from './components/Dashboard';
import { analyzeTextWithGemini } from './services/geminiService';
import { RiskLevel } from './types';

interface AttachedFile {
  name: string;
  mimeType: string;
  data: string; // base64
}

const STORAGE_KEY = 'nci_analysis_v1';

const App: React.FC = () => {
  // Initialize scores with 1 (Not Present)
  const [scores, setScores] = useState<Record<number, number>>(() => {
    const initial: Record<number, number> = {};
    NCI_CRITERIA.forEach(c => initial[c.id] = 1);
    return initial;
  });

  const [inputText, setInputText] = useState("");
  const [attachedFile, setAttachedFile] = useState<AttachedFile | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiReasoning, setAiReasoning] = useState<Record<number, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);
  const [resetKey, setResetKey] = useState(0); // Used to force re-render on reset
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const analysisIdRef = useRef(0); // Used to prevent race conditions

  // Clear notification after 3 seconds
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const handleScoreChange = useCallback((id: number, val: number) => {
    setScores(prev => ({ ...prev, [id]: val }));
  }, []);

  const totalScore = useMemo(() => {
    return Object.values(scores).reduce((acc: number, curr: number) => acc + curr, 0);
  }, [scores]);

  const currentRange = useMemo(() => {
    return SCORE_RANGES.find(r => totalScore >= r.min && totalScore <= r.max) || SCORE_RANGES[0];
  }, [totalScore]);

  const handleReset = () => {
    if (window.confirm("Are you sure you want to reset all data?")) {
      // Invalidate any pending analysis
      analysisIdRef.current += 1;

      const reset: Record<number, number> = {};
      NCI_CRITERIA.forEach(c => reset[c.id] = 1);
      
      setScores(reset);
      setAiReasoning({});
      setInputText("");
      setAttachedFile(null);
      setError(null);
      setIsAnalyzing(false);
      setNotification("All fields reset.");
      setResetKey(prev => prev + 1); // Force UI remount
      
      // Critical fix: Explicitly clear the file input to ensure onChange triggers even for the same file
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleSave = () => {
    const stateToSave = {
      scores,
      inputText,
      attachedFile,
      aiReasoning,
      timestamp: new Date().toISOString()
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
      setNotification("Analysis saved successfully.");
      setError(null);
    } catch (e) {
      console.error(e);
      setError("Failed to save analysis to local storage.");
    }
  };

  const handleLoad = () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) {
        setError("No saved analysis found.");
        return;
      }
      const parsed = JSON.parse(saved);
      
      if (parsed.scores) setScores(parsed.scores);
      if (parsed.inputText !== undefined) setInputText(parsed.inputText);
      if (parsed.attachedFile !== undefined) setAttachedFile(parsed.attachedFile);
      if (parsed.aiReasoning) setAiReasoning(parsed.aiReasoning);
      
      setNotification(`Loaded analysis from ${new Date(parsed.timestamp).toLocaleDateString()}`);
      setError(null);
      setResetKey(prev => prev + 1); // Force refresh of components with new data
    } catch (e) {
      console.error(e);
      setError("Failed to load saved analysis. Data may be corrupted.");
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);

    const extension = file.name.split('.').pop()?.toLowerCase();

    if (extension === 'pdf') {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        // Remove data URL prefix to get raw base64
        const base64 = result.split(',')[1];
        setAttachedFile({
          name: file.name,
          mimeType: 'application/pdf',
          data: base64
        });
      };
      reader.readAsDataURL(file);
    } 
    else if (extension === 'docx') {
      const reader = new FileReader();
      reader.onload = (e) => {
        const arrayBuffer = e.target?.result as ArrayBuffer;
        if ((window as any).mammoth) {
          (window as any).mammoth.extractRawText({ arrayBuffer: arrayBuffer })
            .then((result: any) => {
              setInputText(result.value);
              setAttachedFile(null); // Clear binary attachment if we extracted text successfully
            })
            .catch((err: any) => {
              console.error(err);
              setError("Failed to parse .docx file.");
            });
        } else {
           setError("Docx parser not loaded.");
        }
      };
      reader.readAsArrayBuffer(file);
    }
    else if (extension === 'txt' || extension === 'md') {
      const reader = new FileReader();
      reader.onload = (e) => {
        setInputText(e.target?.result as string);
        setAttachedFile(null);
      };
      reader.readAsText(file);
    } else {
      setError("Unsupported file format. Please use PDF, DOCX, TXT, or MD.");
    }
    
    // Reset input value so same file can be selected again if needed
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeAttachedFile = () => {
    setAttachedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleAnalyze = async () => {
    if (!inputText.trim() && !attachedFile) return;
    
    const currentAnalysisId = ++analysisIdRef.current;
    setIsAnalyzing(true);
    setError(null);
    setNotification(null);
    
    try {
      // Pass both text and file data if they exist
      const result = await analyzeTextWithGemini(
        inputText, 
        attachedFile ? { mimeType: attachedFile.mimeType, data: attachedFile.data } : undefined
      );
      
      // Only update state if this is still the active analysis and wasn't reset
      if (currentAnalysisId === analysisIdRef.current) {
        setScores(result.scores);
        setAiReasoning(result.reasoning);
      }
    } catch (err: any) {
      if (currentAnalysisId === analysisIdRef.current) {
        setError("Analysis failed. Please ensure a valid API key is set in the environment or try again.");
        console.error(err);
      }
    } finally {
      if (currentAnalysisId === analysisIdRef.current) {
        setIsAnalyzing(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-red-500/30">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
             <div className="h-10 w-10 bg-red-600 flex items-center justify-center font-black text-white text-xl tracking-tighter">
                NCI
             </div>
             <div>
                <h1 className="font-bold text-lg leading-tight tracking-wide text-slate-100">PYSOPS DETECTOR</h1>
                <p className="text-[10px] font-mono text-slate-400 tracking-widest">CAREY DESIGN LABS</p>
             </div>
          </div>
          <a href="#" className="text-xs font-mono text-slate-500 hover:text-slate-300">DOC #319</a>
        </div>
      </header>

      {/* Main Content with Key to force remount on reset */}
      <main key={resetKey} className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Analysis Input & Stats */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Dashboard Gauge */}
          <Dashboard totalScore={totalScore} currentRange={currentRange} />

          {/* Input Panel */}
          <div className="bg-slate-900 p-6 rounded-xl border border-slate-700">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-bold text-slate-400 uppercase font-mono flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path></svg>
                AI Analysis Tool
              </h3>
              
              <div className="relative">
                <input 
                  type="file" 
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  className="hidden" 
                  accept=".pdf,.docx,.txt,.md"
                />
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="text-xs flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-indigo-300 px-2 py-1 rounded border border-slate-700 transition-colors"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"></path></svg>
                  Attach Doc
                </button>
              </div>
            </div>

            {/* Attached File Indicator */}
            {attachedFile && (
              <div className="mb-3 flex items-center justify-between bg-indigo-900/30 border border-indigo-500/50 p-2 rounded text-xs text-indigo-200">
                <div className="flex items-center gap-2 truncate">
                  <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd"></path></svg>
                  <span className="truncate">{attachedFile.name}</span>
                </div>
                <button onClick={removeAttachedFile} className="text-indigo-400 hover:text-white p-1">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
              </div>
            )}
            
            <textarea 
              className="w-full h-40 bg-slate-800 border border-slate-600 rounded-lg p-3 text-sm text-slate-200 focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none resize-none placeholder-slate-500 font-mono"
              placeholder="Paste text here or upload a document (PDF, DOCX, TXT, MD)..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
            />

            {error && (
              <div className="mt-2 text-xs text-red-400 bg-red-900/20 p-2 rounded border border-red-900/50">
                {error}
              </div>
            )}
            
            {notification && (
              <div className="mt-2 text-xs text-emerald-400 bg-emerald-900/20 p-2 rounded border border-emerald-900/50">
                {notification}
              </div>
            )}

            <div className="mt-4 flex flex-col gap-2">
              <button 
                onClick={handleAnalyze}
                disabled={isAnalyzing || (!inputText && !attachedFile)}
                className={`w-full py-2 px-4 rounded font-bold text-sm transition-all flex items-center justify-center gap-2
                  ${isAnalyzing || (!inputText && !attachedFile)
                    ? 'bg-slate-700 text-slate-500 cursor-not-allowed' 
                    : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-900/50'}`}
              >
                {isAnalyzing ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    ANALYZING...
                  </>
                ) : (
                  'RUN AI ANALYSIS'
                )}
              </button>
              
              <div className="grid grid-cols-3 gap-2">
                <button 
                  onClick={handleSave}
                  className="px-2 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded text-slate-300 text-xs font-mono transition-colors flex items-center justify-center gap-1"
                  title="Save analysis to local storage"
                >
                   <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"></path></svg>
                   SAVE
                </button>
                <button 
                  onClick={handleLoad}
                  className="px-2 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded text-slate-300 text-xs font-mono transition-colors flex items-center justify-center gap-1"
                  title="Load analysis from local storage"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
                  LOAD
                </button>
                <button 
                  onClick={handleReset}
                  className="px-2 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded text-slate-300 text-xs font-mono transition-colors"
                  title="Reset All Scores"
                >
                  RESET
                </button>
              </div>
            </div>
            
            <p className="text-[10px] text-slate-500 mt-3 text-center">
              Powered by Gemini 2.5 Flash. Results are advisory only.
            </p>
          </div>
          
          {/* Legend */}
          <div className="bg-slate-900 p-6 rounded-xl border border-slate-700">
            <h4 className="text-xs font-bold text-slate-400 uppercase font-mono mb-3">Interpretation Guide</h4>
            <ul className="space-y-2 text-xs text-slate-300">
              <li className="flex justify-between">
                <span>0-25</span>
                <span className="text-emerald-400">Low likelihood</span>
              </li>
              <li className="flex justify-between">
                <span>26-50</span>
                <span className="text-amber-400">Moderate likelihood</span>
              </li>
              <li className="flex justify-between">
                <span>51-75</span>
                <span className="text-orange-400">Strong likelihood</span>
              </li>
              <li className="flex justify-between font-bold">
                <span>76-100</span>
                <span className="text-red-500">Overwhelming signs</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Right Column: Scoring List */}
        <div className="lg:col-span-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-slate-100">Assessment Criteria</h2>
            <span className="bg-slate-800 text-slate-400 text-xs px-2 py-1 rounded font-mono border border-slate-700">
              20 CATEGORIES
            </span>
          </div>
          
          <div className="space-y-2">
            {NCI_CRITERIA.map((criteria) => (
              <ScoreCard 
                key={criteria.id} 
                criteria={criteria} 
                score={scores[criteria.id]} 
                reasoning={aiReasoning[criteria.id]}
                onChange={handleScoreChange}
              />
            ))}
          </div>

          <div className="mt-8 p-4 border-t border-slate-800 text-center text-slate-600 text-xs">
            &copy; APPLIED BEHAVIOR RESEARCH . 2024 | NCI UNIVERSITY GRAD SCHOOL RESOURCE 319
          </div>
        </div>

      </main>
    </div>
  );
};

export default App;