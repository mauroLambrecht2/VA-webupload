import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { UserProvider } from './contexts/UserContext';
import TaskManager from './components/TaskManager';
import ClipUploader from './components/ClipUploader';
import ClipsPage from './components/ClipsPage';

function App() {
  return (
    <UserProvider>
      <TaskManager>
        <Router>
          <Routes>
            <Route path="/" element={<ClipUploader />} />
            <Route path="/clips" element={<ClipsPage />} />
          </Routes>
        </Router>
      </TaskManager>
    </UserProvider>
  );
}

export default App;
 