// client/src/pages/KnowledgeTreePage.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import ReactFlow, { Background, Controls, MarkerType } from "reactflow";
import "reactflow/dist/style.css"; 
import { api } from "../services/api.js";

export default function KnowledgeTreePage() {
  const navigate = useNavigate();
  const [rawTopics, setRawTopics] = useState({ weak: [], strong: [] });
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // -----------------------------------------------------
  // THE STRUCTURED TREE LAYOUT ENGINE
  // -----------------------------------------------------
  const buildStructuredTree = (strong, weak) => {
    const newNodes = [];
    const newEdges = [];

    // Common Edge Styling
    const edgeStyle = {
      type: 'smoothstep',
      animated: true,
      style: { stroke: '#cbd5e1', strokeWidth: 2 },
      markerEnd: { type: MarkerType.ArrowClosed, color: '#cbd5e1' },
    };

    // 1. Central Root Node
    newNodes.push({
      id: "root",
      position: { x: 350, y: 50 },
      data: { label: "My Knowledge" },
      style: { background: "#4f46e5", color: "white", fontWeight: "bold", border: "none", borderRadius: "8px", padding: "10px 20px" },
    });

    // 2. Strong Topics Branch (Left Side)
    if (strong.length > 0) {
      newNodes.push({
        id: "strong-root",
        position: { x: 150, y: 150 },
        data: { label: "✨ Mastered" },
        style: { background: "#ecfdf5", color: "#059669", fontWeight: "bold", borderColor: "#34d399", borderRadius: "8px" },
      });
      newEdges.push({ id: "e-root-strong", source: "root", target: "strong-root", ...edgeStyle });

      strong.forEach((topic, i) => {
        const nodeId = `s-${i}`;
        newNodes.push({
          id: nodeId,
          position: { x: 150, y: 250 + i * 65 }, 
          data: { label: topic },
          style: { background: "white", color: "#334155", borderColor: "#10b981", borderRadius: "6px", fontSize: "12px", width: 160 },
        });
        newEdges.push({ id: `e-strong-${i}`, source: "strong-root", target: nodeId, ...edgeStyle });
      });
    }

    // 3. Weak Topics Branch (Right Side)
    if (weak.length > 0) {
      newNodes.push({
        id: "weak-root",
        position: { x: 550, y: 150 },
        data: { label: "⚠️ Needs Review" },
        style: { background: "#fff1f2", color: "#e11d48", fontWeight: "bold", borderColor: "#fb7185", borderRadius: "8px" },
      });
      newEdges.push({ id: "e-root-weak", source: "root", target: "weak-root", ...edgeStyle });

      weak.forEach((topic, i) => {
        const nodeId = `w-${i}`;
        newNodes.push({
          id: nodeId,
          position: { x: 550, y: 250 + i * 65 },
          data: { label: topic },
          style: { background: "white", color: "#334155", borderColor: "#f43f5e", borderRadius: "6px", fontSize: "12px", width: 160 },
        });
        newEdges.push({ id: `e-weak-${i}`, source: "weak-root", target: nodeId, ...edgeStyle });
      });
    }

    setNodes(newNodes);
    setEdges(newEdges);
  };

  useEffect(() => {
    const fetchKnowledge = async () => {
      try {
        const res = await api.get("/chat/knowledge");
        const weak = res.data.weakTopics || [];
        const strong = res.data.strongTopics || [];
        setRawTopics({ weak, strong });
        buildStructuredTree(strong, weak);
      } catch (err) {
        console.error("Failed to fetch knowledge graph", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchKnowledge();
  }, []);

  const handleQuizMe = () => {
    if (rawTopics.weak.length === 0) {
      alert("You don't have any weak topics to review right now! Great job.");
      return;
    }
    navigate("/study-buddy", { state: { triggerQuiz: true, topics: rawTopics.weak } });
  };

  const totalTopics = rawTopics.strong.length + rawTopics.weak.length;
  const masteryPercentage = totalTopics === 0 ? 0 : Math.round((rawTopics.strong.length / totalTopics) * 100);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <header className="px-6 py-5 border-b border-slate-200 bg-white sticky top-0 z-20 flex justify-between items-center shadow-sm">
        <div>
          <h1 className="text-2xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-cyan-500 tracking-tight">
            Knowledge Dashboard
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Analytics derived in real-time from your StudyBuddy sessions.
          </p>
        </div>
        <button
          onClick={() => navigate("/study-buddy")} 
          className="text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 hover:text-indigo-600 px-4 py-2.5 rounded-xl transition-colors border border-slate-200 shadow-sm"
        >
          ← Back to Chat
        </button>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 flex flex-col lg:flex-row gap-6">
        
        {/* 👉 THE FIX: ReactFlow wrapped in a strict 600px height div */}
        <div className="flex-1 bg-white border border-slate-200 rounded-3xl shadow-sm relative overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center h-[600px] text-indigo-500 font-bold">
              <span className="w-4 h-4 rounded-full bg-indigo-500 animate-pulse mr-2" />
              Mapping your brain...
            </div>
          ) : nodes.length <= 1 ? (
             <div className="flex flex-col items-center justify-center h-[600px] p-8 text-center">
              <div className="text-4xl mb-3">🌱</div>
              <h2 className="text-lg font-bold text-slate-800 mb-2">Your tree is empty!</h2>
              <p className="text-sm text-slate-500 max-w-xs">Chat with Study Buddy about your topics and exams to start growing your knowledge tree.</p>
            </div>
          ) : (
            <div style={{ width: '100%', height: '600px' }}>
              <ReactFlow 
                nodes={nodes} 
                edges={edges} 
                fitView 
                fitViewOptions={{ padding: 0.2 }}
                attributionPosition="bottom-right"
              >
                <Background color="#cbd5e1" gap={16} size={1} />
                <Controls />
              </ReactFlow>
            </div>
          )}
        </div>

        {/* Analytics & Controls Panel */}
        <div className="w-full lg:w-80 flex flex-col gap-4 flex-shrink-0">
          <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm text-center">
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wide mb-2">Overall Mastery</h3>
            <div className="text-5xl font-extrabold bg-clip-text text-transparent bg-gradient-to-br from-indigo-500 to-cyan-400 mb-2">
              {masteryPercentage}%
            </div>
            <p className="text-xs text-slate-400 font-medium">Calculated from your chat interactions.</p>
          </div>

          <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm flex-1">
            <h3 className="text-sm font-bold text-rose-500 flex items-center gap-2 mb-4">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
              Focus Areas
            </h3>
            {rawTopics.weak.length === 0 ? (
              <div className="text-xs text-slate-400 italic">No weak topics identified yet.</div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {rawTopics.weak.map((topic, i) => (
                  <span key={i} className="bg-rose-50 border border-rose-200 text-rose-600 px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm">
                    {topic}
                  </span>
                ))}
              </div>
            )}

            <hr className="my-5 border-slate-100" />

            <h3 className="text-sm font-bold text-emerald-500 flex items-center gap-2 mb-4">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              Strong Areas
            </h3>
            {rawTopics.strong.length === 0 ? (
              <div className="text-xs text-slate-400 italic">No strong topics identified yet.</div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {rawTopics.strong.map((topic, i) => (
                  <span key={i} className="bg-emerald-50 border border-emerald-200 text-emerald-600 px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm">
                    {topic}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="bg-gradient-to-br from-indigo-500 to-cyan-500 rounded-3xl p-6 text-white shadow-md flex flex-col items-center justify-center text-center relative overflow-hidden group">
            <div className="absolute -right-6 -top-6 w-24 h-24 bg-white/20 rounded-full blur-2xl group-hover:bg-white/30 transition-all"></div>
            <h3 className="font-bold text-lg mb-2 relative z-10">Ready to Level Up?</h3>
            <p className="text-xs text-indigo-100 mb-4 relative z-10">Have your buddy quiz you specifically on your focus areas.</p>
            
            <button 
              onClick={handleQuizMe}
              className="w-full bg-white text-indigo-600 font-extrabold py-3.5 px-4 rounded-xl hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all relative z-10 flex justify-center items-center gap-2"
            >
              Ask Buddy to Quiz Me 🧠
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}