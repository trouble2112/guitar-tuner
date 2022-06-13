import { useEffect, useRef } from "react";

export default function Canvas(props) {
  const canvasRef = useRef(null);
  useEffect(() => {
    const ctx = canvasRef.current.getContext("2d");
    ctx.canvas.width = 600;
    ctx.canvas.height = 600;
  }, []);

  return <canvas ref={canvasRef} {...props} />;
}
