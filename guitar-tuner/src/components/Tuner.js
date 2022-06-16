import { useEffect, useRef } from "react";
// import Canvas from "./Canvas";
import autoCorrelate from "../utils/autoCorelate.js";
import styled from "styled-components";
import ChordMap from "./ChordMap.js";
import { useSelector, useDispatch } from "react-redux";

const MainContainer = styled.div`
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
`;
const MainContainer2 = styled.div`
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  /* border: 1px solid black; */
`;

const GuitarContainer = styled.div`
  display: inline-block;
  width: 600px;
  height: 600px;
  margin: 0 auto;
  position: relative;
  /* border: 1px solid blue; */
`;

const GuitarImage = styled.img`
  position: absolute;
  z-index: 1;
`;

const GuitarTuningKeyCanvas = styled.canvas`
  position: relative;
  z-index: 20;
`;

export default function Tuner() {
  const note = useSelector((state) => state.note.data);

  const canvasRef = useRef(null);

  const setupActiveTuner = (stream) => {
    const audioContext = new (window.AudioContext ||
      window.webkitAudioContext)();

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
      const stream = await startMicrophone();
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
    const x = 100;
    const y = 122;
    const radius = 20;
    const distanceY = 109;
    const distanceX = 365;
    const textX = 11;
    const textY = 11;
    const ctx = canvasRef.current.getContext("2d");
    ctx.canvas.width = 600;
    ctx.canvas.height = 600;
    ctx.font = "2rem Arial";

    const { S6, S5, S4, S3, S2, S1 } = note;

    // S4
    ctx.arc(x, y, radius, 0, Math.PI * 2, true);
    ctx.moveTo(x + radius, y + distanceY);
    ctx.fillText(S4.name, x - textX, y + textY);

    // S5
    ctx.arc(x, y + distanceY, radius, 0, Math.PI * 2, true);
    ctx.moveTo(x + radius, y + distanceY * 2);
    ctx.fillText(S5.name, x - textX, y + textY + distanceY);

    // S6
    ctx.arc(x, y + distanceY * 2, radius, 0, Math.PI * 2, true);
    ctx.moveTo(x + radius + distanceX, y);
    ctx.fillText(S6.name, x - textX, y + textY + distanceY * 2);

    // S3
    ctx.arc(x + distanceX, y, radius, 0, Math.PI * 2, true);
    ctx.moveTo(x + radius + distanceX, y + distanceY);
    ctx.fillText(S3.name, x - textX + distanceX, y + textY);

    // S2
    ctx.arc(x + distanceX, y + distanceY, radius, 0, Math.PI * 2, true);
    ctx.moveTo(x + radius + distanceX, y + distanceY * 2);
    ctx.fillText(S2.name, x - textX + distanceX, y + textY + distanceY);

    // S1
    ctx.arc(x + distanceX, y + distanceY * 2, radius, 0, Math.PI * 2, true);
    ctx.fillText(S1.name, x - textX + distanceX, y + textY + distanceY * 2);
    ctx.stroke();
  }, [note]);

  return (
    <MainContainer>
      <MainContainer2>
        <GuitarContainer>
          <GuitarImage src={require("../image/guitar.png")} alt="guitar" />
          <GuitarTuningKeyCanvas ref={canvasRef} />
        </GuitarContainer>
        <ChordMap />
      </MainContainer2>
    </MainContainer>
  );
}

/*

[x] draw six turning key canvas circle
[x] click note event, and interactive with turning key
[] click note style
[] constraint only one note can be clicked for each string
[] auto-detect switch
[] tuner quick search drop down menu
[] determinated tune start and stop
[] tune score logic
[] make turning key hoverable

*/
