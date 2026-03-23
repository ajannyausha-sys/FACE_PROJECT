import { useEffect, useRef, useState } from "react";
import * as faceapi from "face-api.js";

const MODEL_URL = "/models";

function FaceDetectionCamera({ students, onMatch, attendanceMap }) {
  const videoRef = useRef(null);
  const [ready, setReady] = useState(false);
  const [status, setStatus] = useState("Load models to begin.");

  const startCamera = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { width: 640, height: 480 },
      audio: false
    });

    if (videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  };

  const loadModels = async () => {
    setStatus("Loading detection models...");
    await Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
      faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
      faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL)
    ]);
    setReady(true);
    setStatus("Models loaded. Start camera and detect.");
  };

  useEffect(() => {
    let timer;

    if (ready) {
      timer = setInterval(async () => {
        if (!videoRef.current || students.length === 0) return;

        const detection = await faceapi
          .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions())
          .withFaceLandmarks()
          .withFaceDescriptor();

        if (detection) {
          // Demo fallback: marks the first unmarked student when a face is detected.
          const firstUnmarked = students.find((student) => !attendanceMap.has(student.id));
          if (firstUnmarked) {
            onMatch(firstUnmarked.id);
            setStatus(`Face detected. Marked ${firstUnmarked.name} present.`);
          } else {
            setStatus("Face detected, but all students are already marked present.");
          }
        }
      }, 2500);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [ready, students, onMatch, attendanceMap]);

  return (
    <div className="stack">
      <p>{status}</p>
      <div className="row">
        <button onClick={loadModels}>Load Models</button>
        <button onClick={startCamera}>Start Camera</button>
      </div>
      <video ref={videoRef} autoPlay muted playsInline width="100%" />
      <small>
        Put face-api model files in <code>public/models</code>. This starter includes UI
        flow and detection hooks.
      </small>
    </div>
  );
}

export default FaceDetectionCamera;
