import { Handle, Position } from "@xyflow/react";

export default function InputNode({ data }) {
  return (
    <div className="custom-node input-node">
      <h3>Prompt Input</h3>

      <textarea
        placeholder="Type your prompt here..."
        value={data.value}
        onChange={(e) => data.onChange(e.target.value)}
        rows={7}
      />

      <Handle type="source" position={Position.Right} />
    </div>
  );
}