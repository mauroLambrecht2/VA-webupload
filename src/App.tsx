import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { UserProvider } from './contexts/UserContext';
import ClipUploader from './components/ClipUploader';
import ClipsPage from './components/ClipsPage';

function App() {
  return (
    <UserProvider>
      <Router>
        <Routes>
          <Route path="/" element={<ClipUploader />} />
          <Route path="/clips" element={<ClipsPage />} />
        </Routes>
      </Router>
    </UserProvider>
  );
}

export default App;
