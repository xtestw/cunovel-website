import React from 'react';
import { Link } from 'react-router-dom';
import './Navbar.css';

function Navbar() {
  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Link to="/">CuTool</Link>
      </div>
      <div className="navbar-links">
        <Link to="/tools">在线工具</Link>
        <Link to="/ai-nav">AI导航</Link>
      </div>
    </nav>
  );
}

export default Navbar; 