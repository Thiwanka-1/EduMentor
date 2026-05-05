// client/src/App.jsx
import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";

// ✅ Import the AuthProvider to fix the useAuth crash!
import { AuthProvider } from "./context/AuthContext";

// Public Pages
import Home from "./pages/Home";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";

// Protected Pages & Components
import ProtectedRoute from "./components/ProtectedRoute";
import ProfilePage from "./pages/ProfilePage";
import TutorMode from "./pages/TutorMode.jsx";
import LessonMode from "./pages/LessonMode.jsx";
import ChatPage from "./components/ChatPage.jsx";
import KnowledgeTreePage from "./pages/KnowledgeTreePage"; 
import PeerNetworkPage from "./pages/PeerNetworkPage";
import Dashboard from "./pages/Dashboard.jsx";
import NotesPage from "./pages/NotesPage.jsx";
import AudioSessionsPage from "./pages/AudioSessionsPage.jsx";
import VideoSessionsPage from "./pages/VideoSessionsPage.jsx";
import QuizResultsPage from "./pages/QuizResultsPage.jsx";

// ✅ MVEG pages
import MvegLayout from "./pages/mveg/MvegLayout";
import MvegExplain from "./pages/mveg/MvegExplain";
import MvegLibrary from "./pages/mveg/MvegLibrary";

// ✅ ACE pages
import AceLayout from "./pages/ace/AceLayout";
import AceDashboard from "./pages/ace/AceDashboard";
import AceCreate from "./pages/ace/AceCreate";
import AceAnalysis from "./pages/ace/AceAnalysis";
import AceFlashcards from "./pages/ace/AceFlashcards";
import AceSession from "./pages/ace/AceSession";
import AceReinforce from "./pages/ace/AceReinforce";
import ReviewQuiz from "./pages/ace/ReviewQuiz";

function NotFoundInline() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-900 font-sans">
      <div className="text-center p-8 max-w-md">
        <p className="text-sm font-extrabold tracking-[0.2em] uppercase text-indigo-600 mb-2">
          404 Error
        </p>
        <h1 className="text-4xl md:text-5xl font-extrabold mb-4">
          Page not found
        </h1>
        <p className="text-lg text-slate-600 mb-8">
          The page you’re looking for doesn’t exist (yet) or has been moved.
        </p>
        <a
          href="/"
          className="inline-flex items-center justify-center rounded-xl px-8 py-3.5 text-base font-bold text-white bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 shadow-lg shadow-indigo-500/25 transition-all hover:-translate-y-0.5"
        >
          Back to Home
        </a>
      </div>
    </div>
  );
}

export default function App() {
  return (
    // ✅ Wrap everything in the AuthProvider!
    <AuthProvider>
      <Routes>
        {/* ==========================================
            PUBLIC ROUTES (Anyone can access)
            ========================================== */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/about" element={<Navigate to="/#about" replace />} />
        <Route path="/contact" element={<Navigate to="/#contact" replace />} />

        {/* ==========================================
            PROTECTED ROUTES (Must be logged in)
            ========================================== */}
        <Route element={<ProtectedRoute />}>
          <Route path="/profile" element={<ProfilePage />} />

          {/* ✅ MVEG module */}
          <Route path="/mveg" element={<MvegLayout />}>
            <Route index element={<Navigate to="/mveg/explain" replace />} />
            <Route path="explain" element={<MvegExplain />} />
            <Route path="library" element={<MvegLibrary />} />
          </Route>

          {/* ✅ ACE module */}
          <Route path="/ace" element={<AceLayout />}>
            <Route index element={<AceDashboard />} />
            <Route path="create" element={<AceCreate />} />
            <Route path="analysis" element={<AceAnalysis />} />
            <Route path="flashcards" element={<AceFlashcards />} />
            <Route path="session" element={<AceSession />} />
            <Route path="reinforce" element={<AceReinforce />} />
            <Route path="history" element={<ReviewQuiz />} />
          </Route>

          {/* Standalone Tools */}
          <Route path="/tutor" element={<TutorMode />} />
          <Route path="/lesson" element={<LessonMode />} />
          <Route path="/knowledge-tree" element={<KnowledgeTreePage />} />
          <Route path="/study-buddy" element={<ChatPage />} />
          <Route path="/study-hub" element={<PeerNetworkPage />} />
          <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/dashboard/lessons/:id" element={<NotesPage />} />
        <Route path="/dashboard/notes" element={<Dashboard />} />
        <Route path="/dashboard/audio" element={<AudioSessionsPage />} />
        <Route path="/dashboard/videos" element={<VideoSessionsPage />} />
        <Route path="/dashboard/quiz" element={<QuizResultsPage />} />
      




        </Route>

        {/* Catch-all 404 */}
        <Route path="*" element={<NotFoundInline />} />
      </Routes>
    </AuthProvider>
  );
}