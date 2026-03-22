import React from 'react';
import Link from 'next/link';
import './Navbar.css';

function Navbar() {
  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Link href="/">CuTool</Link>
      </div>
      <div className="navbar-links">
        <Link href="/tools/json/formatter">在线工具</Link>
        <Link href="/ai-nav">AI导航</Link>
      </div>
    </nav>
  );
}

export default Navbar; 