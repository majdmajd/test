import React, { useState, useRef, useCallback } from "react";
import ReactFlow, {
  Background,
  Controls,
  ReactFlowProvider,
  useNodesState,
  useEdgesState
} from "reactflow";
import { GiPull } from "react-icons/gi";
import "reactflow/dist/style.css";

const icon = <GiPull />;

const pullSkills = [
  { id: "advTuck", label: "Advanced Tuck Rows (2x4)", requires: ["tuckFL"], position: { x: -300, y: 200 }, xp: 6 },
  { id: "tuckFL", label: "Tucked Front Lever Rows (2x5)", requires: ["feetElevated"], position: { x: -300, y: 300 }, xp: 4 },
  { id: "feetElevated", label: "Feet-Elevated Rows (2x8)", requires: ["rows"], position: { x: -300, y: 400 }, xp: 3 },
  { id: "rows", label: "Bodyweight Rows (2x8)", position: { x: -300, y: 500 }, xp: 2 },

  { id: "muscleUp", label: "Muscle-Up (1–2)", requires: ["explosive"], position: { x: 300, y: 200 }, xp: 8 },
  { id: "explosive", label: "Explosive Pull-Ups (2x4)", requires: ["pullups"], position: { x: 300, y: 300 }, xp: 6 },
  { id: "pullups", label: "Pull-Ups (2x6)", requires: ["scapular"], position: { x: 300, y: 400 }, xp: 5 },
  { id: "scapular", label: "Scapular Pulls (2x10)", requires: ["deadHang"], position: { x: 300, y: 500 }, xp: 3 },
  { id: "deadHang", label: "Dead Hang (20s)", position: { x: 300, y: 600 }, xp: 2 }
];

function PullTree() {
  const [unlocked, setUnlocked] = useState([]);
  const [xp, setXp] = useState(0);

  const level = Math.floor(xp / 10);
  const xpForNext = 10;
  const xpProgress = xp % xpForNext;

  const formatRequirement = (reqStr) => {
    const match = reqStr.match(/\(([^)]+)\)/);
    if (!match) return "";
    const [sets, value] = match[1].split("x");
    if (!value) return match[1];
    return value.includes("s")
      ? `${sets} sets of ${value.replace("s", "")} seconds`
      : `${sets} sets of ${value} reps`;
  };

  const generateFlowData = (skills, unlockedList) => {
    const nodes = skills.map(skill => ({
      id: skill.id,
      type: "default",
      position: skill.position,
      draggable: false,
      data: {
        label: skill.label.replace(/\s*\([^)]*\)/, "")
      },
      style: {
        border: unlockedList.includes(skill.id) ? "2px solid #22c55e" : "2px solid #ffffff",
        padding: 20,
        borderRadius: 8,
        background: unlockedList.includes(skill.id) ? "#3b82f6" : "#444",
        color: "white",
        fontWeight: 500,
        textAlign: "center"
      }
    }));

    const edges = skills
      .filter(skill => skill.requires)
      .flatMap(skill =>
        skill.requires.map(req => ({
          id: `${req}->${skill.id}`,
          source: req,
          target: skill.id,
          type: "straight",
          animated: false,
          style: { stroke: "#ffffff", strokeWidth: 3 }
        }))
      );

    return { nodes, edges };
  };

  const { nodes: initialNodes, edges: initialEdges } = generateFlowData(pullSkills, unlocked);
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const initialized = useRef(false);

  const onInit = (instance) => {
    if (!initialized.current) {
      instance.zoomTo(1.2);
      initialized.current = true;
    }
  };

  const onNodeClick = useCallback((_, node) => {
    const skill = pullSkills.find(s => s.id === node.id);
    if (!skill || unlocked.includes(skill.id)) return;

    const prereqs = skill.requires || [];
    const unmet = prereqs.filter(req => !unlocked.includes(req));
    if (unmet.length > 0) {
      alert(
        `You must unlock these first:\n\n${unmet
          .map(id => pullSkills.find(s => s.id === id)?.label.replace(/\s*\([^)]*\)/, "") || id)
          .join("\n")}`
      );
      return;
    }

    const skillName = skill.label.replace(/\s*\([^)]*\)/, "");
    const prereqId = (skill.requires && skill.requires[0]) || null;
    const prereqSkill = prereqId ? pullSkills.find(s => s.id === prereqId) : null;

    const prereqName = prereqSkill?.label.replace(/\s*\([^)]*\)/, "") || "the prerequisite";
    const prereqReq = prereqSkill ? formatRequirement(prereqSkill.label) : "some prerequisite";

    const confirmed = confirm(`To unlock "${skillName}", you must be able to do:\n\n${prereqReq} of ${prereqName}.\n\nProceed?`);

    if (confirmed) {
      const updatedUnlocked = [...unlocked, skill.id];
      const updatedXp = xp + (skill.xp || 5);
      setUnlocked(updatedUnlocked);
      setXp(updatedXp);
      const updated = generateFlowData(pullSkills, updatedUnlocked);
      setNodes(updated.nodes);
      setEdges(updated.edges);
    }
  }, [unlocked, xp]);

  const reset = () => {
    setUnlocked([]);
    setXp(0);
    const updated = generateFlowData(pullSkills, []);
    setNodes(updated.nodes);
    setEdges(updated.edges);
  };

  return (
    <ReactFlowProvider>
      <div style={{ width: "100%", height: "100%", background: "#000", display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "10px 20px", backgroundColor: "#111", color: "white", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div><strong>Pull Level:</strong> {level}</div>
            <div style={{ background: "#222", height: 10, borderRadius: 5, width: 150, marginTop: 4 }}>
              <div style={{ width: `${(xpProgress / xpForNext) * 100}%`, background: "#3b82f6", height: "100%", borderRadius: 5 }} />
            </div>
          </div>
          <button onClick={reset} style={{ background: "#3b82f6", color: "white", border: "none", padding: "6px 12px", borderRadius: 4 }}>
            Reset
          </button>
        </div>

        <div style={{ flex: 1 }}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onNodeClick={onNodeClick}
            onInit={onInit}
            fitView
            panOnDrag
            nodesDraggable={false}
          >
            <Controls />
            <Background color="#1e1e1e" gap={16} />
          </ReactFlow>
        </div>
      </div>
    </ReactFlowProvider>
  );
}

export default PullTree;
