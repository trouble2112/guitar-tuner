import { useEffect, useRef } from "react";
import Canvas from "./Canvas";
import autoCorrelate from "../utils/autoCorelate.js";
let audioContext, stream;

export default function Tuner() {
  const canvasRef = useRef(null);

  const setupActiveTuner = (stream) => {
    audioContext =
      audioContext || new (window.AudioContext || window.webkitAudioContext)();

    let source = audioContext.createMediaStreamSource(stream);
    let analyser = audioContext.createAnalyser();
    source.connect(analyser);
    analyser.fftSize = 4096;

    const E$ = 82.41;
    const draw = () => {
      requestAnimationFrame(draw);
      let buffer = new Float32Array(4096);
      analyser.getFloatTimeDomainData(buffer);
      const autoCorrelateValue = autoCorrelate(buffer, audioContext.sampleRate);
      autoCorrelateValue !== -1 && console.log(autoCorrelateValue);
      if (autoCorrelateValue !== -1) {
        let offset = Math.abs(E$ - autoCorrelateValue) * 100;
        const ctx = canvasRef.current.getContext("2d");
        ctx.beginPath();
        ctx.fillStyle = "green";
        // https://stackoverflow.com/questions/32642399/simplest-way-to-plot-points-randomly-inside-a-circle
        const pt_angle = Math.random() * 2 * Math.PI;
        const pt_radius_sq = Math.random() * offset * offset;
        const pt_x = Math.sqrt(pt_radius_sq) * Math.cos(pt_angle);
        const pt_y = Math.sqrt(pt_radius_sq) * Math.sin(pt_angle);
        ctx.arc(pt_x + 300, pt_y + 300, 5, 0, Math.PI * 2, true);
        ctx.fill();
      }
    };
    draw();
  };

  const startMicrophone = async () => {
    try {
      return await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (error) {
      console.log("getUserMedia error:", error.message);
      throw new Error("Permission denied");
    }
  };

  const initActiveTuner = async () => {
    try {
      stream = await startMicrophone();
      setupActiveTuner(stream);
    } catch (error) {
      console.log("initActiveTuner error:", error.message);
      if (error.message === "Permission denied") return;
    }
  };

  useEffect(() => {
    const handleStream = async () => {
      await initActiveTuner();
    };
    handleStream().catch(console.error);
  });

  useEffect(() => {
    const ctx = canvasRef.current.getContext("2d");
    ctx.canvas.width = 600;
    ctx.canvas.height = 600;
    ctx.arc(300, 300, 150, 0, Math.PI * 2, true);
    ctx.stroke();
  }, []);

  return (
    <>
      {/* <div>Test Root</div> */}
      <canvas ref={canvasRef} />
    </>
  );
}
