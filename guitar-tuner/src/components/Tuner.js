import { useEffect, useRef, useState } from "react";
// import Canvas from "./Canvas";
import autoCorrelate from "../utils/autoCorelate.js";
import styled from "styled-components";
import ChordMap from "./ChordMap.js";
import { useSelector, useDispatch } from "react-redux";
import { updateSelected } from "./noteSlice.js";

const MainContainer = styled.div`
  height: 100vh;
  display: grid;
  grid-template-columns: repeat(10, 1fr);
  grid-template-rows: repeat(5, 1fr);
`;

const GuitarContainer = styled.div`
  display: flex;
  justify-content: right;
  align-items: flex-start;
  position: relative;
  border: 1px solid blue;
  grid-column: 2 / span 5;
  grid-row: 2 / span 4;
`;

const GuitarImage = styled.img`
  position: absolute;
  width: 600px;
  height: 600px;
  z-index: 1;
`;

const GuitarTuningKeyCanvas = styled.canvas`
  position: relative;
  z-index: 20;
`;

const MeterContainer = styled.div`
  position: relative;
  border: 1px solid red;
  grid-column: 2 / span 5;
  grid-row: 1 / span 1;
  display: flex;
  align-items: flex-end;
  justify-content: center;
`;
const MeterCanvas = styled.canvas`
  position: absolute;
  z-index: 20;
  border: 1px solid green;
`;

export default function Tuner() {
  const [turnOn, setTurnOn] = useState(false);
  const note = useSelector((state) => state.note.data);
  const dispatch = useDispatch();

  const canvasRef = useRef(null);
  const canvasBGMeterRef = useRef(null);
  const canvasFGMeterRef = useRef(null);
  const coordinatesRef = useRef(null);
  const tdb = useRef([]);
  const tds = useRef([]);
  const acr = useRef(0);

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

  const analyserRecentSample = (recentSample) => {
    recentSample = recentSample.map((k) => k[1]);
    console.log('recentSample', recentSample)
    const mostCommon = recentSample.sort(
      (a, b) =>
        recentSample.filter((v) => v === a).length -
        recentSample.filter((v) => v === b).length
    )[0];
    const commonSample = recentSample.filter(
      (x) => Math.abs(mostCommon - x) <= 1
    );
    if (commonSample.length > recentSample.length * 0.6) {
      return commonSample;
    }
    return -1;
  };

  const setupActiveTuner = (stream) => {
    const audioContext = new (window.AudioContext ||
      window.webkitAudioContext)();

    let source = audioContext.createMediaStreamSource(stream);
    let analyser = audioContext.createAnalyser();
    source.connect(analyser);
    analyser.fftSize = 4096;

    const draw = () => {
      requestAnimationFrame(draw);
      let buffer = new Float32Array(4096);
      analyser.getFloatTimeDomainData(buffer);
      const autoCorrelateValue = autoCorrelate(buffer, audioContext.sampleRate);
      autoCorrelateValue !== -1 &&
        tdb.current.push([Date.now(), autoCorrelateValue]);
      if (autoCorrelateValue === -1) {
        acr.current += 1;
      }
      if (acr.current === 50) {
        tds.current = [];
        setTurnOn(false);
        acr.current = 0;
      }
      if (autoCorrelateValue !== -1 && note.selected) {
        tdb.current = tdb.current.slice(-100);
        const recentSample = tdb.current.filter(
          (v) => Date.now() - v[0] < 800
          // &&
          // Math.abs(note[note.selected]?.frequency - v[1]) < 10
        );
        const recentFreq = analyserRecentSample(recentSample);
        if (recentFreq !== -1) {
          tds.current.push(...recentFreq);
          setTurnOn(true);
        } else {
          setTurnOn(false);
          tds.current = [];
          console.log("waiting");
        }
        // let offset = Math.abs(E$ - autoCorrelateValue) * 100;
        // const ctx = canvasRef.current.getContext("2d");
        // ctx.beginPath();
        // ctx.fillStyle = "green";
        // // https://stackoverflow.com/questions/32642399/simplest-way-to-plot-points-randomly-inside-a-circle
        // const pt_angle = Math.random() * 2 * Math.PI;
        // const pt_radius_sq = Math.random() * offset * offset;
        // const pt_x = Math.sqrt(pt_radius_sq) * Math.cos(pt_angle);
        // const pt_y = Math.sqrt(pt_radius_sq) * Math.sin(pt_angle);
        // ctx.arc(pt_x + 300, pt_y + 300, 5, 0, Math.PI * 2, true);
        // ctx.fill();
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
    const y = 120;
    const radius = 30;
    const distanceY = 104;
    const distanceX = 400;
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
      }, 1);
    }
  }, [note]);

  // meter canvas animate
  useEffect(() => {
    if (turnOn) {
      const ctx = canvasFGMeterRef.current.getContext("2d");
      const { width, height } = ctx.canvas;
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = "rgba(0,200,30,0.5)";
      const { frequency } = note[note.selected];
      let requestId;
      const draw = () => {
        requestId = requestAnimationFrame(draw);
        console.log("frequency", frequency, tds.current.slice(-10));
        ctx.save();
        tds.current.slice(-10).forEach((v) => {
          setTimeout(() => {
            ctx.fillRect((300 * v) / frequency, 20, 4, 80);
          }, 2);
          ctx.restore();
        });
        if (tds.current.length === 0) {
          console.log("cancel", requestId);
          window.cancelAnimationFrame(requestId);
          requestId = undefined;
          ctx.clearRect(0, 0, width, height);
        }
      };
      draw();
    }
  }, [turnOn, note]);

  // background meter canvas
  useEffect(() => {
    const ctx = canvasBGMeterRef.current.getContext("2d");
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.fillStyle = "white";
    ctx.fillRect(300 - 3, 20, 6, 80);
    ctx.fillRect(330 - 2, 20, 4, 80);
    ctx.fillRect(270 - 2, 20, 4, 80);
    ctx.fillRect(360 - 2, 20, 4, 80);
    ctx.fillRect(240 - 2, 20, 4, 80);
    ctx.fillRect(400 - 1, 20, 2, 80);
    ctx.fillRect(200 - 1, 20, 2, 80);
    ctx.fillRect(440 - 1, 20, 2, 80);
    ctx.fillRect(160 - 1, 20, 2, 80);
    ctx.fillRect(480 - 1, 20, 2, 80);
    ctx.fillRect(120 - 1, 20, 2, 80);
    ctx.fillRect(540 - 1, 20, 2, 80);
    ctx.fillRect(60 - 1, 20, 2, 80);
  }, []);

  useEffect(() => {
    function handleMove(e) {
      // console.log(e)
    }
    function handleClick(e) {
      const clickedKey = checkClickTurningKey(e.layerX, e.layerY);
      if (clickedKey) {
        dispatch(updateSelected(clickedKey));
      }
      console.log(JSON.stringify(tdb.current));
    }
    canvasRef.current.addEventListener("mousemove", handleMove);
    canvasRef.current.addEventListener("click", handleClick);
  }, [dispatch]);

  return (
    <MainContainer>
      <MeterContainer>
        <MeterCanvas ref={canvasBGMeterRef} width="600" height="120" />
        <MeterCanvas ref={canvasFGMeterRef} width="600" height="120" />
      </MeterContainer>
      <GuitarContainer>
        <GuitarImage src={require("../image/guitar.png")} alt="guitar" />
        <GuitarTuningKeyCanvas ref={canvasRef} />
      </GuitarContainer>
      <ChordMap />
    </MainContainer>
  );
}

/*

[x] draw six turning key canvas circle
[x] click note event, and interactive with turning key
[x] click note style
[x] constraint only one note can be clicked for each string
[] virtualize when turn on
[] auto-detect switch
[] tuner quick search drop down menu
[] determinated tune start and stop
[] tune score logic
[] make turning key hoverable

*/
