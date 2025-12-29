// client/src/App.jsx
import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";

function App() {
  return (
    <Routes>
      <Route path="/" element={<ChatPage />} />
      {/* later you can add more pages here, e.g.
          <Route path="/settings" element={<SettingsPage />} />
      */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
