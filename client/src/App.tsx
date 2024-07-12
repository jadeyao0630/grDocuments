import React, { useRef, useState } from 'react';
import { library } from '@fortawesome/fontawesome-svg-core';
import { fas } from '@fortawesome/free-solid-svg-icons';
import './App.css';
import { DBLoaderProvider } from './utils/DBLoader/DBLoaderContext';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Home from './pages/Home';
import SearchPage from './components/SearchBar/SearchPage';
import UserRegister from './components/Register/UserRegister';
import Login from './components/Login/Login';
import Dialog from './components/Dialog/Dialog';
import MessageBox from './components/MessageBox/MessageBox';
import DBLoader from './utils/DBLoader/DBLoader';

library.add(fas);

function App() {
  const [message, setMessage] = useState<string | null>(null);

  const showMessage = (mesg: string | null) => {
    setMessage(mesg);
  };


  return (
    <div className="App">
      <DBLoaderProvider>
      <DBLoader databaseType={'mssql'} />
        <Router>
          <Routes>
            <Route path="/" element={<Home showMessage={showMessage} />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/regist" element={<UserRegister />} />
            <Route path="/login" element={<Login />} />
          </Routes>
        </Router>
      </DBLoaderProvider>
      {message && (
        <MessageBox message={message} type="success" duration={3000} onClose={() => setMessage(null)} />
      )}
    </div>
  );
}

export default App;
