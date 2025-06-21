import React from 'react';
import { UserProvider } from './contexts/UserContext';
import ClipUploader from './components/ClipUploader';

function App() {
  return (
    <UserProvider>
      <ClipUploader />
    </UserProvider>
  );
}

export default App;
