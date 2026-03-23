import { Handle, Position } from "@xyflow/react";

export default function ResultNode({ data }) {
  return (
    <div className="custom-node result-node">
      <h3>AI Result</h3>

      <div className="result-box">{data.result}</div>

      <Handle type="target" position={Position.Left} />
    </div>
  );
}