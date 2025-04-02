import React, { useState } from "react";
import PullTree from "./PullTree";
import PushTree from "./PushTree"; // ← make sure this exists too

function App() {
  const [tab, setTab] = useState("pull");

  const renderTree = () => {
    switch (tab) {
      case "pull":
        return <PullTree />;
      case "push":
        return <PushTree />;
      case "legs":
        return <div className="placeholder">Legs tree coming soon...</div>;
      case "core":
        return <div className="placeholder">Core tree coming soon...</div>;
      default:
        return null;
    }
  };

  return (
    <div style={{ height: "100vh", width: "100vw", background: "#000", display: "flex", flexDirection: "column" }}>
      {/* Full-width top tab bar */}
      <div style={{
        display: "flex",
        justifyContent: "space-around",
        alignItems: "center",
        backgroundColor: "#111",
        borderBottom: "2px solid #222",
        height: "50px",
        width: "100%"
      }}>
        {["pull", "push", "legs", "core"].map((name) => (
          <button
            key={name}
            onClick={() => setTab(name)}
            style={{
              flex: 1,
              height: "100%",
              border: "none",
              backgroundColor: tab === name ? "#3b82f6" : "transparent",
              color: "white",
              fontWeight: "bold",
              fontSize: "16px",
              cursor: "pointer",
              transition: "background-color 0.2s ease-in-out"
            }}
          >
            {name.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Centered skill tree */}
      <div style={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "center" }}>
        <div style={{ width: "100%", height: "100%", maxWidth: "1200px" }}>
          {renderTree()}
        </div>
      </div>
    </div>
  );
}

export default App;
