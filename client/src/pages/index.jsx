import Layout from "./Layout.jsx";
import ProtectedRoute from "../components/ProtectedRoute.jsx";

import Dashboard from "./Dashboard";
import Contracts from "./Contracts";
import Inventory from "./Inventory";
import Marketplace from "./Marketplace";
import Login from "./Login";
import Signup from "./Signup";

import { BrowserRouter as Router, Route, Routes, useLocation, Navigate } from 'react-router-dom';

const PAGES = {
    Dashboard: Dashboard,
    Contracts: Contracts,
    Inventory: Inventory,
    Marketplace: Marketplace,
}

function _getCurrentPage(url) {
    if (url.endsWith('/')) {
        url = url.slice(0, -1);
    }
    let urlLastPart = url.split('/').pop();
    if (urlLastPart.includes('?')) {
        urlLastPart = urlLastPart.split('?')[0];
    }

    const pageName = Object.keys(PAGES).find(page => page.toLowerCase() === urlLastPart.toLowerCase());
    return pageName || Object.keys(PAGES)[0];
}

// Create a wrapper component that uses useLocation inside the Router context
function PagesContent() {
    const location = useLocation();
    const currentPage = _getCurrentPage(location.pathname);
    
    // Check if current route is an auth page
    const authPages = ['/login', '/signup'];
    const isAuthPage = authPages.some(page => location.pathname.toLowerCase().includes(page));
    
    if (isAuthPage) {
        // Render auth pages without layout
        return (
            <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
            </Routes>
        );
    }
    
    // Render protected pages with layout
    return (
        <ProtectedRoute>
            <Layout currentPageName={currentPage}>
                <Routes>            
                    <Route path="/" element={<Navigate to="/dashboard" replace />} />
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/Dashboard" element={<Dashboard />} />
                    <Route path="/contracts" element={<Contracts />} />
                    <Route path="/Contracts" element={<Contracts />} />
                    <Route path="/inventory" element={<Inventory />} />
                    <Route path="/Inventory" element={<Inventory />} />
                    <Route path="/marketplace" element={<Marketplace />} />
                    <Route path="/Marketplace" element={<Marketplace />} />
                </Routes>
            </Layout>
        </ProtectedRoute>
    );
}

export default function Pages() {
    return (
        <Router>
            <PagesContent />
        </Router>
    );
}