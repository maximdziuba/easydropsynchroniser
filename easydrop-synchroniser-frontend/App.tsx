import React from 'react';
import { BrowserRouter as Router, Routes, Route, Outlet } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import { AuthProvider } from './context/AuthContext';
import Login from './pages/Login';
import PrivateRoute from './components/PrivateRoute';
import Mappings from './pages/Mappings';
import History from './pages/History';
import Settings from './pages/Settings';

const Layout: React.FC = () => {
  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      <Sidebar />
      <main className="flex-1 ml-64 p-8">
        <Outlet />
      </main>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <Router>
      <AuthProvider>
        <Routes>
            <Route path="/login" element={<Login />} />
            <Route element={<PrivateRoute />}>
                <Route element={<Layout />}>
                    <Route path="/" element={<Mappings />} />
                    <Route path="/history" element={<History />} />
                    <Route path="/settings" element={<Settings />} />
                </Route>
            </Route>
        </Routes>
      </AuthProvider>
    </Router>
  );
};

export default App;