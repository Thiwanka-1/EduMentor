// client/src/pages/PeerNetworkPage.jsx
import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../services/api.js";

export default function PeerNetworkPage() {
  const navigate = useNavigate();
  const [matches, setMatches] = useState([]);
  const [sharedPlans, setSharedPlans] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [myUserId, setMyUserId] = useState(null);

  // Modal State for Study Plan
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
  const [studyPlanText, setStudyPlanText] = useState("");
  const [selectedPlanDetails, setSelectedPlanDetails] = useState("");

  // Modal State for Chat
  const [activeChatPeer, setActiveChatPeer] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const chatBottomRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get user profile first so we know our own ID
        const userRes = await api.get("/auth/profile");
        setMyUserId(userRes.data._id);

        const [matchesRes, plansRes] = await Promise.all([
          api.get("/chat/peers/matches"),
          api.get("/chat/peers/study-plans")
        ]);
        
        setMatches(matchesRes.data.matches || []);
        setSharedPlans(plansRes.data.plans || []);
      } catch (err) {
        console.error("Failed to fetch peer data", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  // ----------------------------------------------------
  // STUDY PLAN LOGIC
  // ----------------------------------------------------
  const getExistingPlan = (tutorId, learnerId, topic) => {
    return sharedPlans.find(p => 
      p.tutorId === tutorId && p.learnerId === learnerId && p.topic === topic
    );
  };

  const handleGeneratePlan = async (peerId, peerName, topicToTeach) => {
    setSelectedPlanDetails(`Lesson: ${topicToTeach} (Tutor: You)`);
    setStudyPlanText("");
    setIsPlanModalOpen(true);
    setIsGeneratingPlan(true);

    try {
      const res = await api.post("/chat/peers/study-plan", {
        peerId,
        topicToTeach
      });

      setStudyPlanText(res.data.studyPlan);
      
      setSharedPlans(prev => [...prev, {
        _id: res.data.planId,
        tutorId: myUserId,
        learnerId: peerId,
        topic: topicToTeach,
        content: res.data.studyPlan
      }]);

    } catch (err) {
      console.error("Failed to generate plan", err);
      setStudyPlanText("⚠️ Failed to generate the study plan. Please try again.");
    } finally {
      setIsGeneratingPlan(false);
    }
  };

  const handleViewPlan = (plan, titleInfo) => {
    setSelectedPlanDetails(titleInfo);
    setStudyPlanText(plan.content);
    setIsGeneratingPlan(false);
    setIsPlanModalOpen(true);
  };

  const getMatchIcon = (type) => {
    if (type === "Mutual Exchange") return "🔄";
    if (type === "Find a Tutor") return "🎓";
    if (type === "Be a Mentor") return "💡";
    return "🤝";
  };

  // ----------------------------------------------------
  // PEER CHAT LOGIC
  // ----------------------------------------------------
  const openChat = async (peer) => {
    setActiveChatPeer(peer);
    fetchMessages(peer.peerId);
  };

  const fetchMessages = async (peerId) => {
    try {
      const res = await api.get(`/chat/peers/messages/${peerId}`);
      setChatMessages(res.data.messages || []);
      setTimeout(() => chatBottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    } catch (err) {
      console.error("Failed to fetch messages", err);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!chatInput.trim() || !activeChatPeer) return;

    const textToSend = chatInput;
    setChatInput(""); 

    // Optimistically update UI
    setChatMessages(prev => [...prev, { senderId: myUserId, text: textToSend, createdAt: new Date() }]);
    setTimeout(() => chatBottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);

    try {
      await api.post("/chat/peers/messages", {
        receiverId: activeChatPeer.peerId,
        text: textToSend
      });
    } catch (err) {
      console.error("Failed to send message", err);
    }
  };

  // Polling Engine: Auto-refresh messages every 3 seconds if chat is open
  useEffect(() => {
    let interval;
    if (activeChatPeer) {
      interval = setInterval(() => {
        fetchMessages(activeChatPeer.peerId);
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [activeChatPeer]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans relative">
      <header className="px-6 py-5 border-b border-slate-200 bg-white sticky top-0 z-20 flex justify-between items-center shadow-sm">
        <div>
          <h1 className="text-2xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-cyan-500 tracking-tight">
            Study Hub & Peer Network
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Algorithmic study group matching based on your ZPD.
          </p>
        </div>
        <button
          onClick={() => navigate("/study-buddy")} 
          className="text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 hover:text-indigo-600 px-4 py-2.5 rounded-xl transition-colors border border-slate-200 shadow-sm"
        >
          ← Back to Chat
        </button>
      </header>

      <main className="flex-1 max-w-6xl w-full mx-auto p-6 md:p-8">
        {isLoading ? (
          <div className="flex items-center justify-center h-64 text-indigo-500 font-bold animate-pulse">
            <span className="w-4 h-4 rounded-full bg-indigo-500 mr-2" />
            Analyzing semantic knowledge graphs...
          </div>
        ) : matches.length === 0 ? (
          <div className="text-center bg-white p-12 rounded-3xl shadow-sm border border-slate-200 mt-10">
            <div className="text-5xl mb-4">🔍</div>
            <h2 className="text-xl font-bold text-slate-800 mb-2">No optimal matches found yet</h2>
            <p className="text-slate-500 max-w-md mx-auto">
              Chat with StudyBuddy more to map out your strong and weak topics!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {matches.map((peer, index) => (
              <div key={index} className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                
                <div className="bg-slate-50 border-b border-slate-100 p-5 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <img 
                      src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${peer.name}&backgroundColor=c0aede`} 
                      alt={peer.name} 
                      className="w-12 h-12 rounded-full border-2 border-white shadow-sm"
                    />
                    <div>
                      <h3 className="font-bold text-slate-800">{peer.name}</h3>
                      <div className="text-xs font-semibold text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-md inline-flex items-center gap-1 mt-1 border border-indigo-100">
                        {getMatchIcon(peer.matchType)} {peer.matchType}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-black text-emerald-500">{peer.compatibilityScore}%</div>
                    <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Match</div>
                  </div>
                </div>

                <div className="p-5 flex-1 space-y-6">
                  {/* YOU ARE THE TUTOR */}
                  {peer.topicsToTeach && peer.topicsToTeach.length > 0 && (
                    <div>
                      <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                        You are mentoring them on:
                      </h4>
                      <div className="space-y-3">
                        {peer.topicsToTeach.map((topic, i) => {
                          const existingPlan = getExistingPlan(myUserId, peer.peerId, topic);
                          return (
                            <div key={i} className="flex items-center justify-between bg-white border border-slate-200 p-3 rounded-xl shadow-sm">
                              <span className="text-sm font-bold text-slate-700">{topic}</span>
                              {existingPlan ? (
                                <button onClick={() => handleViewPlan(existingPlan, `Lesson: ${topic} (Tutor: You)`)} className="text-xs font-bold bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-lg hover:bg-indigo-100">View Lesson</button>
                              ) : (
                                <button onClick={() => handleGeneratePlan(peer.peerId, peer.name, topic)} className="text-xs font-bold bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-500 shadow-sm">✨ Generate Lesson</button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* THEY ARE THE TUTOR */}
                  {peer.topicsToLearn && peer.topicsToLearn.length > 0 && (
                    <div>
                      <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-rose-400"></span>
                        They are mentoring you on:
                      </h4>
                      <div className="space-y-3">
                        {peer.topicsToLearn.map((topic, i) => {
                          const existingPlan = getExistingPlan(peer.peerId, myUserId, topic);
                          return (
                            <div key={i} className="flex items-center justify-between bg-slate-50 border border-slate-200 p-3 rounded-xl">
                              <span className="text-sm font-bold text-slate-700">{topic}</span>
                              {existingPlan ? (
                                <button onClick={() => handleViewPlan(existingPlan, `Lesson: ${topic} (Tutor: ${peer.name})`)} className="text-xs font-bold bg-emerald-50 text-emerald-600 px-3 py-1.5 rounded-lg hover:bg-emerald-100 border border-emerald-200">📚 View Shared Lesson</button>
                              ) : (
                                <span className="text-[10px] font-bold text-slate-400 italic">Waiting for Tutor to generate...</span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                <div className="p-4 border-t border-slate-100 bg-slate-50">
                  <button 
                    onClick={() => openChat(peer)}
                    className="w-full bg-white border border-slate-200 text-slate-600 text-sm font-bold py-3 rounded-xl hover:bg-slate-100 transition-colors shadow-sm flex justify-center items-center gap-2"
                  >
                    💬 Message {peer.name.split(" ")[0]}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* PLAN MODAL */}
      {isPlanModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center p-5 border-b border-slate-200 bg-slate-50">
              <div>
                <h2 className="text-xl font-extrabold text-indigo-600 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                  Masterclass Curriculum
                </h2>
                <div className="text-xs font-medium text-slate-500 mt-1">{selectedPlanDetails}</div>
              </div>
              <button onClick={() => setIsPlanModalOpen(false)} className="text-slate-400 hover:text-rose-500 font-bold p-2 bg-white rounded-xl border border-slate-200 shadow-sm">✕</button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-8 bg-slate-50/50 custom-scrollbar">
              {isGeneratingPlan ? (
                <div className="flex flex-col items-center justify-center h-48 text-indigo-500 gap-4">
                  <span className="w-8 h-8 rounded-full bg-indigo-500 animate-pulse" />
                  <p className="font-bold text-sm">Synthesizing elite pedagogical agenda...</p>
                </div>
              ) : (
                <div className="prose prose-slate max-w-none">
                  <pre className="text-sm text-slate-700 whitespace-pre-wrap font-sans leading-relaxed">{studyPlanText}</pre>
                </div>
              )}
            </div>

            {!isGeneratingPlan && (
              <div className="p-4 border-t border-slate-200 bg-white flex justify-end gap-3">
                <button onClick={() => setIsPlanModalOpen(false)} className="px-5 py-2.5 text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors border border-slate-200">Close</button>
                <button 
                  onClick={() => {
                    const blob = new Blob([studyPlanText], { type: 'text/plain' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `${selectedPlanDetails.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.txt`; // strictly .txt
                    a.click();
                  }}
                  className="px-5 py-2.5 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl transition-colors shadow-sm flex items-center gap-2"
                >
                  Download Agenda (.txt)
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* CHAT MODAL */}
      {activeChatPeer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg h-[600px] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
            
            <div className="flex justify-between items-center p-4 border-b border-slate-200 bg-white">
              <div className="flex items-center gap-3">
                <img 
                  src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${activeChatPeer.name}&backgroundColor=c0aede`} 
                  alt="avatar" 
                  className="w-10 h-10 rounded-full border border-slate-200"
                />
                <div>
                  <h2 className="text-base font-extrabold text-slate-800">{activeChatPeer.name}</h2>
                  <div className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Online
                  </div>
                </div>
              </div>
              <button onClick={() => setActiveChatPeer(null)} className="text-slate-400 hover:text-rose-500 font-bold p-2 bg-slate-50 rounded-xl border border-slate-200 shadow-sm">✕</button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 bg-slate-50 flex flex-col gap-3">
              {chatMessages.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
                  <div className="text-4xl mb-2">👋</div>
                  <p className="text-sm font-bold">Say hi to {activeChatPeer.name.split(" ")[0]}!</p>
                  <p className="text-xs">Coordinate a time to go over your study plan.</p>
                </div>
              ) : (
                chatMessages.map((msg, i) => {
                  const isMe = msg.senderId === myUserId;
                  return (
                    <div key={i} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[75%] px-4 py-2 rounded-2xl text-sm ${isMe ? "bg-indigo-600 text-white rounded-br-sm shadow-sm" : "bg-white border border-slate-200 text-slate-800 rounded-bl-sm shadow-sm"}`}>
                        {msg.text}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={chatBottomRef} />
            </div>

            <div className="p-4 bg-white border-t border-slate-200">
              <form onSubmit={handleSendMessage} className="flex gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                />
                <button 
                  type="submit"
                  disabled={!chatInput.trim()}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-xl font-bold hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-all flex items-center justify-center"
                >
                  <svg className="w-5 h-5 translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}