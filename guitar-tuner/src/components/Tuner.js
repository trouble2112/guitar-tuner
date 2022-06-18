import { useEffect, useRef } from "react";
// import Canvas from "./Canvas";
import autoCorrelate from "../utils/autoCorelate.js";
import styled from "styled-components";
import ChordMap from "./ChordMap.js";
import { useSelector, useDispatch } from "react-redux";
import { updateSelected } from "./noteSlice.js";

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
  border: 1px solid blue;
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
  const dispatch = useDispatch();

  const canvasRef = useRef(null);
  const coordinatesRef = useRef(null);

  const checkClickTurningKey = (x, y) => {
    if (!coordinatesRef.current) {
      return null;
    }
    const coordinates = coordinatesRef.current;
    const inRadiusRange = (a, b, centerX, centerY) => {
      return (
        Math.sqrt(Math.abs(a - centerX) ** 2 + Math.abs(b - centerY) ** 2) <
        coordinates.radius + 12
      );
    };
    const keys = ["S6", "S5", "S4", "S3", "S2", "S1"];
    for (const key of keys) {
      if (inRadiusRange(x, y, ...coordinates[key])) {
        return key;
      }
    }
    return null;
  };

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
    console.log("draw1");

    const x = 100;
    const y = 122;
    const radius = 30;
    const distanceY = 109;
    const distanceX = 365;
    const textX = 11;
    const textY = 11;
    const ctx = canvasRef.current.getContext("2d");
    const coordinates = { radius: 20 };
    ctx.canvas.width = 600;
    ctx.canvas.height = 600;
    ctx.font = "2rem Arial";

    const { S6, S5, S4, S3, S2, S1 } = note;

    // S4
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2, true);
    ctx.moveTo(x + radius, y + distanceY);
    ctx.fillText(S4.name, x - textX, y + textY);
    coordinates.S4 = [x, y];

    // S5
    ctx.arc(x, y + distanceY, radius, 0, Math.PI * 2, true);
    ctx.moveTo(x + radius, y + distanceY * 2);
    ctx.fillText(S5.name, x - textX, y + textY + distanceY);
    coordinates.S5 = [x, y + distanceY];

    // S6
    ctx.arc(x, y + distanceY * 2, radius, 0, Math.PI * 2, true);
    ctx.moveTo(x + radius + distanceX, y);
    ctx.fillText(S6.name, x - textX, y + textY + distanceY * 2);
    coordinates.S6 = [x, y + distanceY * 2];

    // S3
    ctx.arc(x + distanceX, y, radius, 0, Math.PI * 2, true);
    ctx.moveTo(x + radius + distanceX, y + distanceY);
    ctx.fillText(S3.name, x - textX + distanceX, y + textY);
    coordinates.S3 = [x + distanceX, y];

    // S2
    ctx.arc(x + distanceX, y + distanceY, radius, 0, Math.PI * 2, true);
    ctx.moveTo(x + radius + distanceX, y + distanceY * 2);
    ctx.fillText(S2.name, x - textX + distanceX, y + textY + distanceY);
    coordinates.S2 = [x + distanceX, y + distanceY];

    // S1
    ctx.arc(x + distanceX, y + distanceY * 2, radius, 0, Math.PI * 2, true);
    ctx.fillText(S1.name, x - textX + distanceX, y + textY + distanceY * 2);
    coordinates.S1 = [x + distanceX, y + distanceY * 2];
    coordinatesRef.current = coordinates;
    ctx.stroke();

    if (note.selected) {
      const [rx, ry] = coordinatesRef.current[note.selected];
      const gradient = ctx.createRadialGradient(
        rx,
        ry,
        radius / 2,
        rx,
        ry,
        radius
      );
      gradient.addColorStop(0, "rgba(50,30,160,0.7)");
      gradient.addColorStop(0.9, "white");
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(rx, ry, radius, 0, 2 * Math.PI, true);
      ctx.fill();

      let deegres = 0;
      let result = 3.6 * 80;
      const acrInterval = setInterval(function () {
        deegres += 1;

        ctx.beginPath();
        ctx.arc(
          rx,
          ry,
          radius,
          (Math.PI / 180) * 270,
          (Math.PI / 180) * (270 + 360)
        );
        ctx.strokeStyle = "#b1b1b1";
        ctx.lineWidth = "10";
        ctx.stroke();

        ctx.beginPath();
        ctx.strokeStyle = "#3949AB";
        ctx.lineWidth = "10";
        ctx.arc(
          rx,
          ry,
          radius,
          (Math.PI / 180) * 270,
          (Math.PI / 180) * (270 + deegres)
        );
        ctx.stroke();
        if (deegres >= result) clearInterval(acrInterval);
      }, 5);
    }
  }, [note]);

  useEffect(() => {
    function handleMove(e) {
      // console.log(e)
    }
    function handleClick(e) {
      const clickedKey = checkClickTurningKey(e.layerX, e.layerY);
      if (clickedKey) {
        dispatch(updateSelected(clickedKey));
      }
    }
    canvasRef.current.addEventListener("mousemove", handleMove);
    canvasRef.current.addEventListener("click", handleClick);
  }, [dispatch]);

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
