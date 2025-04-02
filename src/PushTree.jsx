import React, { useState, useRef, useCallback } from "react";
import ReactFlow, {
  Background,
  Controls,
  ReactFlowProvider,
  useNodesState,
  useEdgesState
} from "reactflow";
import { GiShoulderArmor } from "react-icons/gi";
import "reactflow/dist/style.css";

const icon = <GiShoulderArmor />;

const pushSkills = [
  { id: "oneArmPushups", label: "One-Arm Push-Ups (2x3)", requires: ["archerPushups"], position: { x: -300, y: 200 }, xp: 8 },
  { id: "archerPushups", label: "Archer Push-Ups (2x6)", requires: ["pushups"], position: { x: -300, y: 300 }, xp: 6 },
  { id: "pushups", label: "Push-Ups (2x8)", requires: ["inclinePushups"], position: { x: -300, y: 400 }, xp: 4 },
  { id: "inclinePushups", label: "Incline Push-Ups (2x8)", requires: ["kneePushups"], position: { x: -300, y: 500 }, xp: 3 },
  { id: "kneePushups", label: "Knee Push-Ups (2x8)", position: { x: -300, y: 600 }, xp: 2 },

  { id: "weightedDips", label: "Weighted Dips (2x3)", requires: ["ringDips"], position: { x: 0, y: 200 }, xp: 9 },
  { id: "ringDips", label: "Ring Dips (2x4)", requires: ["koreanDips"], position: { x: 0, y: 300 }, xp: 7 },
  { id: "koreanDips", label: "Korean Dips (2x5)", requires: ["straightBarDips"], position: { x: 0, y: 400 }, xp: 6 },
  { id: "straightBarDips", label: "Straight Bar Dips (2x6)", requires: ["benchDips"], position: { x: 0, y: 500 }, xp: 4 },
  { id: "benchDips", label: "Bench Dips (2x10)", position: { x: 0, y: 600 }, xp: 2 },

  { id: "freestanding", label: "Freestanding HSPU (1–3)", requires: ["wallHandstand"], position: { x: 300, y: 200 }, xp: 10 },
  { id: "wallHandstand", label: "Wall HSPU (2x3)", requires: ["elevatedPike"], position: { x: 300, y: 300 }, xp: 7 },
  { id: "elevatedPike", label: "Elevated Pike PU (2x5)", requires: ["pike"], position: { x: 300, y: 400 }, xp: 5 },
  { id: "pike", label: "Pike Push-Ups (2x6)", requires: ["wallPike"], position: { x: 300, y: 500 }, xp: 3 },
  { id: "wallPike", label: "Wall Pike PU (2x6)", position: { x: 300, y: 600 }, xp: 2 }
];

function PushTree() {
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

  const { nodes: initialNodes, edges: initialEdges } = generateFlowData(pushSkills, unlocked);
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
    const skill = pushSkills.find(s => s.id === node.id);
    if (!skill || unlocked.includes(skill.id)) return;

    const prereqs = skill.requires || [];
    const unmet = prereqs.filter(req => !unlocked.includes(req));
    if (unmet.length > 0) {
      alert(
        `You must unlock these first:\n\n${unmet
          .map(id => pushSkills.find(s => s.id === id)?.label.replace(/\s*\([^)]*\)/, "") || id)
          .join("\n")}`
      );
      return;
    }

    const skillName = skill.label.replace(/\s*\([^)]*\)/, "");
    const prereqId = (skill.requires && skill.requires[0]) || null;
    const prereqSkill = prereqId ? pushSkills.find(s => s.id === prereqId) : null;

    const prereqName = prereqSkill?.label.replace(/\s*\([^)]*\)/, "") || "the prerequisite";
    const prereqReq = prereqSkill ? formatRequirement(prereqSkill.label) : "some prerequisite";

    const confirmed = confirm(`To unlock "${skillName}", you must be able to do:\n\n${prereqReq} of ${prereqName}.\n\nProceed?`);

    if (confirmed) {
      const updatedUnlocked = [...unlocked, skill.id];
      const updatedXp = xp + (skill.xp || 5);
      setUnlocked(updatedUnlocked);
      setXp(updatedXp);
      const updated = generateFlowData(pushSkills, updatedUnlocked);
      setNodes(updated.nodes);
      setEdges(updated.edges);
    }
  }, [unlocked, xp]);

  const reset = () => {
    setUnlocked([]);
    setXp(0);
    const updated = generateFlowData(pushSkills, []);
    setNodes(updated.nodes);
    setEdges(updated.edges);
  };

  return (
    <ReactFlowProvider>
      <div style={{ width: "100%", height: "100%", background: "#000", display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "10px 20px", backgroundColor: "#111", color: "white", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div><strong>Push Level:</strong> {level}</div>
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

export default PushTree;
