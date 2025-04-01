import React, { useState, useRef, useCallback } from "react";
import ReactFlow, {
  Background,
  Controls,
  ReactFlowProvider,
  useNodesState,
  useEdgesState
} from "reactflow";
import { GiMuscleUp, GiLeg, GiShoulderArmor, GiPull } from "react-icons/gi";
import "reactflow/dist/style.css";

// Simple icon map for each branch
const iconMap = {
  pull: <GiPull />,
  push: <GiShoulderArmor />,
  legs: <GiLeg />,
  master: <GiMuscleUp />
};

/**
 * Each skill now has:
 * 1) A unique ID.
 * 2) A label with sets/reps in parentheses.
 * 3) A 'requires' array listing prerequisites.
 * 4) A 'branch' just for icon reference (not used for auto-position anymore).
 * 5) A manual 'position' object (x,y) that determines where the node is placed.
 * 6) An xp value for unlocking.
 *
 * The coordinates are chosen to create a more "balanced" or symmetrical layout:
 * - Pull branch on the LEFT, going vertically down.
 * - Push branch on the RIGHT, going vertically down.
 * - Legs in the BOTTOM-CENTER, going vertically down.
 * - Master skill at the TOP-CENTER.
 */
const rawSkills = [

  // ---- PULL BRANCH (left side, top to bottom) ----
  {
    id: "pullups",
    label: "Pull-Ups (3x10)",
    branch: "pull",
    xp: 5,
    position: { x: -300, y: 0 }
  },
  {
    id: "explosive",
    label: "Explosive Pull-Ups (3x6)",
    requires: ["pullups"],
    branch: "pull",
    xp: 7,
    position: { x: -350, y: -100 }
  },
  {
    id: "muscleTrans",
    label: "Muscle-Up Transition",
    // Requires both Explosive (pull) and Straight Bar Dips (push)
    requires: ["explosive", "dips"],
    branch: "pull",
    xp: 10,
    position: { x: 0, y: -200 }
  },
  {
    id: "negatives",
    label: "Negative Muscle-Ups (3x5)",
    requires: ["muscleTrans"],
    branch: "pull",
    xp: 12,
    position: { x: -450, y: -300 }
  },
  {
    id: "falseGrip",
    label: "False Grip Hangs (3x20s)",
    requires: ["negatives"],
    branch: "pull",
    xp: 15,
    position: { x: -500, y: -400 }
  },
  {
    id: "bandMU",
    label: "Band-Assisted MU (3x3)",
    requires: ["falseGrip"],
    branch: "pull",
    xp: 18,
    position: { x: -550, y: -500 }
  },
  {
    id: "cleanMU",
    label: "Clean Muscle-Ups (3×1–2)",
    requires: ["bandMU"],
    branch: "pull",
    xp: 20,
    position: { x: -600, y: -600 }
  },
  {
    id: "multiMU",
    label: "Multiple Muscle-Ups (3+)",
    requires: ["cleanMU"],
    branch: "pull",
    xp: 25,
    position: { x: -650, y: -700}
  },

  // ---- PUSH BRANCH (right side, top to bottom) ----
  {
    id: "pushups",
    label: "Push-Ups (3x20)",
    branch: "push",
    xp: 5,
    position: { x: 300, y: 0 }
  },
  {
    id: "pseudo",
    label: "Pseudo Planche PU (3x8)",
    requires: ["pushups"],
    branch: "push",
    xp: 7,
    position: { x: 350, y: -100}
  },
  {
    id: "pike",
    label: "Pike Push-Ups (3x10)",
    requires: ["pseudo"],
    branch: "push",
    xp: 7,
    position: { x: 400, y: -200 }
  },
  {
    id: "dips",
    label: "Straight Bar Dips (3x6)",
    requires: ["pike"],
    branch: "push",
    xp: 7,
    position: { x: 450, y: -300 }
  },
  {
    id: "archer",
    label: "Archer Push-Ups (3x6)",
    requires: ["pike", "dips"],
    branch: "push",
    xp: 10,
    position: { x: 500, y: -400 }
  },
  {
    id: "wallHandstand",
    label: "Wall Handstand PU (3x5)",
    requires: ["archer"],
    branch: "push",
    xp: 15,
    position: { x: 550, y: -500 }
  },
  {
    id: "freestanding",
    label: "Freestanding HSPU (3–5)",
    requires: ["wallHandstand"],
    branch: "push",
    xp: 20,
    position: { x: 600, y: -600 }
  },

  // ---- LEGS BRANCH (bottom-center, top to bottom) ----
  {
    id: "squats",
    label: "Bodyweight Squats (3x20)",
    branch: "legs",
    xp: 5,
    position: { x: 0, y: 300 }
  },
  {
    id: "lunges",
    label: "Walking Lunges (3x10/leg)",
    requires: ["squats"],
    branch: "legs",
    xp: 7,
    position: { x: 0, y: 100 }
  },
  {
    id: "bulgarians",
    label: "Bulgarian Splits (3x8/leg)",
    requires: ["lunges"],
    branch: "legs",
    xp: 10,
    position: { x: 0, y: 200 }
  },
  {
    id: "jumpSquats",
    label: "Jump Squats (3x10)",
    requires: ["bulgarians"],
    branch: "legs",
    xp: 12,
    position: { x: 0, y: 300 }
  },
  {
    id: "pistol",
    label: "Pistol Squats (3x5–8/leg)",
    requires: ["jumpSquats"],
    branch: "legs",
    xp: 15,
    position: { x: 0, y: 400 }
  },
  {
    id: "plyo",
    label: "Single-Leg Plyo (3x5–8/leg)",
    requires: ["pistol"],
    branch: "legs",
    xp: 20,
    position: { x: 0, y: 500 }
  }
];

const nodeWidth = 180;
const nodeHeight = 60;

// Utility to parse something like "3x10" or "3x20s" into a more descriptive string
function formatRequirement(req) {
  let match = req.match(/^(\d+)x(\d+)(s?)$/);
  if (match) {
    const sets = parseInt(match[1], 10);
    const value = parseInt(match[2], 10);
    const isSeconds = match[3] === "s";
    return `${sets} set${sets > 1 ? "s" : ""} of ${value} ${isSeconds ? "seconds" : "reps"}`;
  }
  match = req.match(/^(\d+)\+\s*reps$/i);
  if (match) {
    return `At least ${match[1]} reps`;
  }
  return req;
}

function SkillTreeFlow() {
  // Load saved progress or set defaults
  const [unlocked, setUnlocked] = useState(() => {
    const saved = localStorage.getItem("unlockedSkills");
    // Default unlocked: Pull-Ups, Push-Ups, Squats
    return saved ? JSON.parse(saved) : ["pullups", "pushups", "squats"];
  });
  const [xp, setXp] = useState(() => {
    const saved = localStorage.getItem("xp");
    return saved ? parseInt(saved) : 0;
  });

  const level = Math.floor(xp / 10);
  const xpForNext = 10;
  const xpProgress = xp % xpForNext;

  // Create nodes/edges from rawSkills
  function generateFlowData(skills, unlockedList) {
    // Build node objects
    const nodes = skills.map(skill => ({
      id: skill.id,
      type: "default",
      // Use the skill's manual position
      position: skill.position,
      draggable: false,
      data: {
        label: (
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            {iconMap[skill.branch]}
            <span>{skill.label.replace(/\s*\([^)]*\)/, "")}</span>
          </div>
        )
      },
      style: {
        border: unlockedList.includes(skill.id) ? "2px solid #22c55e" : "2px solid #ffffff",
        padding: 20,
        minWidth: nodeWidth,
        minHeight: nodeHeight,
        borderRadius: 8,
        background: unlockedList.includes(skill.id) ? "#3b82f6" : "#444",
        color: "white",
        fontWeight: 500,
        textAlign: "center"
      }
    }));

    // Build edge objects from each skill's prerequisites
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
  }

  const { nodes: initialNodes, edges: initialEdges } = generateFlowData(rawSkills, unlocked);
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const initialized = useRef(false);

  const onInit = (instance) => {
    // Zoom in a bit on first load
    if (!initialized.current && nodes.length > 0) {
      instance.zoomTo(1.2);
      initialized.current = true;
    }
  };

  // Handle node click to unlock skill if prerequisites are met
  const onNodeClick = useCallback(
    (_, node) => {
      const skill = rawSkills.find(s => s.id === node.id);
      if (!skill || unlocked.includes(skill.id)) return;

      const prereqs = skill.requires || [];
      const unmet = prereqs.filter(req => !unlocked.includes(req));
      if (unmet.length > 0) {
        alert(
          `You must unlock these first:\n\n${unmet
            .map(
              id => `• ${rawSkills.find(s => s.id === id)?.label.replace(/\s*\([^)]*\)/, "") || id}`
            )
            .join("\n")}`
        );
        return;
      }

      // Show a short confirmation about the sets/reps
      const reqMatch = skill.label.match(/\(([^)]+)\)/);
      const requirementText = reqMatch ? formatRequirement(reqMatch[1]) : "the requirement";
      const confirmed = confirm(
        `Before unlocking "${skill.label.replace(/\s*\([^)]*\)/, "")}", you need to complete:\n` +
        `${requirementText}\n\nPrerequisites unlocked:\n` +
        `${prereqs
          .map(
            id =>
              rawSkills.find(s => s.id === id)?.label.replace(/\s*\([^)]*\)/, "") || id
          )
          .join("\n")}\n\nProceed?`
      );
      if (confirmed) {
        const updatedUnlocked = [...unlocked, skill.id];
        const updatedXp = xp + (skill.xp || 5);
        setUnlocked(updatedUnlocked);
        setXp(updatedXp);
        localStorage.setItem("unlockedSkills", JSON.stringify(updatedUnlocked));
        localStorage.setItem("xp", updatedXp);

        // Re-generate nodes/edges with the newly unlocked skill
        const updated = generateFlowData(rawSkills, updatedUnlocked);
        setNodes(updated.nodes);
        setEdges(updated.edges);
      }
    },
    [unlocked, xp]
  );

  // Reset everything
  const resetTree = () => {
    const initial = ["pullups", "pushups", "squats"];
    setUnlocked(initial);
    setXp(0);
    localStorage.setItem("unlockedSkills", JSON.stringify(initial));
    localStorage.setItem("xp", "0");

    const updated = generateFlowData(rawSkills, initial);
    setNodes(updated.nodes);
    setEdges(updated.edges);
  };

  return (
    <ReactFlowProvider>
      <div style={{ width: "100vw", height: "100vh", background: "#000", display: "flex", flexDirection: "column" }}>
        {/* Header bar with XP info and reset button */}
        <div style={{
          padding: 10,
          color: "white",
          background: "#111",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between"
        }}>
          <div style={{ flex: 1 }}>
            <strong>Level:</strong> {level} / 100
            <br />
            <strong>XP:</strong> {xp} XP
            <div style={{ background: "#222", height: 10, borderRadius: 5, marginTop: 4 }}>
              <div
                style={{
                  width: `${(xpProgress / xpForNext) * 100}%`,
                  background: "#3b82f6",
                  height: "100%",
                  borderRadius: 5
                }}
              />
            </div>
          </div>
          <button
            onClick={resetTree}
            style={{
              background: "#3b82f6",
              color: "white",
              border: "none",
              padding: "6px 12px",
              borderRadius: 4,
              cursor: "pointer"
            }}
          >
            Reset
          </button>
        </div>

        {/* Main React Flow area */}
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

export default SkillTreeFlow;
