import React, { useState } from "react";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import Dashboard from "./views/Dashboard";
import Projects from "./views/Projects";
import About from "./views/About";
import Contact from "./views/Contact";
import type { View } from "./types";

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>("Dashboard");

  const renderView = () => {
    switch (currentView) {
      case "Dashboard":
        return <Dashboard />;
      case "Projects":
        return <Projects />;
      case "About":
        return <About />;
      case "Contact":
        return <Contact />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="flex h-screen bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] transition-colors duration-200">
      <Sidebar currentView={currentView} setCurrentView={setCurrentView} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header currentView={currentView} />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-[var(--color-bg-primary)] p-4 sm:p-6 lg:p-8">
          {renderView()}
        </main>
      </div>
    </div>
  );
};

export default App;
