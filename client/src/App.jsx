import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import InputNode from "./nodes/InputNode";
import ResultNode from "./nodes/ResultNode";

const API_URL = "https://server-sfbu.onrender.com";

const nodeTypes = {
  inputNode: InputNode,
  resultNode: ResultNode,
};

const initialNodes = [
  {
    id: "1",
    type: "inputNode",
    position: { x: 80, y: 120 },
    data: {
      value: "",
      onChange: () => {},
    },
  },
  {
    id: "2",
    type: "resultNode",
    position: { x: 500, y: 120 },
    data: {
      result: "AI response will appear here...",
    },
  },
];

const initialEdges = [
  {
    id: "e1-2",
    source: "1",
    target: "2",
    animated: true,
  },
];

export default function App() {
  const [prompt, setPrompt] = useState("");
  const [result, setResult] = useState("AI response will appear here...");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, , onEdgesChange] = useEdgesState(initialEdges);

  useEffect(() => {
    setNodes((prev) =>
      prev.map((node) => {
        if (node.id === "1") {
          return {
            ...node,
            data: {
              ...node.data,
              value: prompt,
              onChange: setPrompt,
            },
          };
        }

        if (node.id === "2") {
          return {
            ...node,
            data: {
              ...node.data,
              result,
            },
          };
        }

        return node;
      }),
    );
  }, [prompt, result, setNodes]);

  const handleRunFlow = useCallback(async () => {
    if (!prompt.trim()) {
      alert("Please enter a prompt first.");
      return;
    }

    try {
      setLoading(true);
      setResult("Generating response...");

      const response = await axios.post(`${API_URL}/api/ask-ai`, {
        prompt,
      });

      setResult(response?.data?.answer || "No response received from backend.");
    } catch (error) {
      console.error(error);

      const message =
        error?.response?.data?.message ||
        "Something went wrong while fetching AI response.";

      setResult(message);
    } finally {
      setLoading(false);
    }
  }, [prompt]);

  const handleSave = useCallback(async () => {
    if (!prompt.trim() || !result.trim()) {
      alert("Prompt and response both are required.");
      return;
    }

    try {
      setSaving(true);

      const response = await axios.post(`${API_URL}/api/save`, {
        prompt,
        response: result,
      });

      alert(response.data.message || "Saved successfully.");
    } catch (error) {
      console.error(error);
      alert("Failed to save data.");
    } finally {
      setSaving(false);
    }
  }, [prompt, result]);

  return (
    <div className="app">
      <div className="topbar">
        <h1>AI Flow App</h1>

        <div className="actions">
          <button onClick={handleRunFlow} disabled={loading}>
            {loading ? "Running..." : "Run Flow"}
          </button>

          <button onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>

      <div className="flow-wrapper">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          fitView
        >
          <MiniMap />
          <Controls />
          <Background />
        </ReactFlow>
      </div>
    </div>
  );
}
