import { useEffect, useState, useRef } from "react";
import { collection, getDocs } from "firebase/firestore";
import { useAppState } from "../context/AppStateContext";
import { db } from "../firebase";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Camera, 
  StopCircle, 
  Play, 
  History, 
  Calendar, 
  RefreshCw, 
  CheckCircle2, 
  XSquare, 
  Activity,
  Maximize2
} from "lucide-react";

export default function TeacherAttendance() {
  const { isFirebaseConfigured } = useAppState();
  const [engineStatus, setEngineStatus]   = useState("stopped"); // stopped | running | done
  const [results, setResults]             = useState([]);
  const [loading, setLoading]             = useState(false);
  const [selectedDate, setSelectedDate]   = useState(
    new Date().toISOString().split("T")[0]
  );
  
  const [devices, setDevices]             = useState([]);
  const [selectedDevice, setSelectedDevice]= useState("");

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const overlayCanvasRef = useRef(null);
  const streamRef = useRef(null);
  const frameInterval = useRef(null);

  // ── Stop Camera & Engine ────────────────────────────────
  const stopEngine = async () => {
    try {
      setEngineStatus("done");
      clearInterval(frameInterval.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
      // Tell backend to end session
      await fetch("http://127.0.0.1:5000/api/end-session", { method: "POST" });
      fetchResultsFromAPI();
    } catch(e) {
      console.error("Error stopping engine:", e);
    }
  };

  // Keyboard listener for ESC to stop
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && engineStatus === "running") {
        stopEngine();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [engineStatus]);

  // Enumerate camera devices
  useEffect(() => {
    navigator.mediaDevices.enumerateDevices()
      .then(mediaDevices => {
        const videoDevices = mediaDevices.filter(d => d.kind === "videoinput");
        setDevices(videoDevices);
        if (videoDevices.length > 0) {
          setSelectedDevice(videoDevices[0].deviceId);
        }
      })
      .catch(err => console.error("Error enumerating devices", err));
  }, []);

  // Capture frame and send
  const captureAndSendFrame = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    const ctx = canvasRef.current.getContext("2d");
    canvasRef.current.width = videoRef.current.videoWidth || 640;
    canvasRef.current.height = videoRef.current.videoHeight || 480;
    if (canvasRef.current.width === 0) return;
    
    ctx.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);
    const base64Image = canvasRef.current.toDataURL("image/jpeg", 0.7);

    try {
      const res = await fetch("http://127.0.0.1:5000/api/recognize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: base64Image })
      });
      const data = await res.json();
      
      // Draw overlays
      if (overlayCanvasRef.current && videoRef.current) {
        const overlay = overlayCanvasRef.current;
        const ctxOverlay = overlay.getContext("2d");
        
        overlay.width = videoRef.current.videoWidth;
        overlay.height = videoRef.current.videoHeight;
        
        ctxOverlay.clearRect(0, 0, overlay.width, overlay.height);
        
        if (data.faces) {
          data.faces.filter(f => f.name !== "UNKNOWN").forEach(face => {
            const { x, y, w, h } = face.box;
            
            ctxOverlay.strokeStyle = face.status === "Present" ? "#10b981" : (face.name === "UNKNOWN" ? "#ef4444" : "#3b82f6");
            if (face.isDrowsy) ctxOverlay.strokeStyle = "#f59e0b";
            
            ctxOverlay.lineWidth = 3;
            // Draw corner-only rectangle for futuristic look
            const cornerLen = Math.min(w, h) * 0.2;
            
            // Top Left
            ctxOverlay.beginPath(); ctxOverlay.moveTo(x, y + cornerLen); ctxOverlay.lineTo(x, y); ctxOverlay.lineTo(x + cornerLen, y); ctxOverlay.stroke();
            // Top Right
            ctxOverlay.beginPath(); ctxOverlay.moveTo(x + w - cornerLen, y); ctxOverlay.lineTo(x + w, y); ctxOverlay.lineTo(x + w, y + cornerLen); ctxOverlay.stroke();
            // Bottom Left
            ctxOverlay.beginPath(); ctxOverlay.moveTo(x, y + h - cornerLen); ctxOverlay.lineTo(x, y + h); ctxOverlay.lineTo(x + cornerLen, y + h); ctxOverlay.stroke();
            // Bottom Right
            ctxOverlay.beginPath(); ctxOverlay.moveTo(x + w - cornerLen, y + h); ctxOverlay.lineTo(x + w, y + h); ctxOverlay.lineTo(x + w, y + h - cornerLen); ctxOverlay.stroke();
            
            // Label
            ctxOverlay.fillStyle = ctxOverlay.strokeStyle;
            ctxOverlay.font = "bold 14px Orbitron, sans-serif";
            const labelText = `${face.name} ${face.isDrowsy ? "⚠️ DROWSY" : ""}`;
            const textWidth = ctxOverlay.measureText(labelText).width;
            
            ctxOverlay.fillRect(x, y - 25, textWidth + 10, 20);
            ctxOverlay.fillStyle = "black";
            ctxOverlay.fillText(labelText, x + 5, y - 10);
          });
        }
      }
    } catch(err) {
      console.error("Frame send error", err);
    }
  };

  // ── Start AI Engine via backend API ──────────────────────
  const startEngine = async () => {
    try {
      setEngineStatus("running");
      const res = await fetch("http://127.0.0.1:5000/api/start-session", { method: "POST" });
      const data = await res.json();
      console.log("[START]", data.message);

      // Start Camera
      const constraints = {
        video: selectedDevice ? { deviceId: { exact: selectedDevice } } : { width: 1280, height: 720 }
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      // Send ~3 frames a second
      frameInterval.current = setInterval(captureAndSendFrame, 350);

    } catch (err) {
      console.error(err);
      alert("Failed to start camera or backend.");
      setEngineStatus("stopped");
    }
  };

  // ── Fetch results from backend after session ──────────────
  const fetchResultsFromAPI = async () => {
    try {
      const res  = await fetch("http://127.0.0.1:5000/api/attendance");
      const data = await res.json();
      setResults(data.attendance || []);
    } catch {
      console.error("Could not fetch results from backend.");
    }
  };

  // ── Load past attendance from Firebase ───────────────────
  const loadFromFirebase = async () => {
    if (!isFirebaseConfigured || !db) return;
    setLoading(true);
    try {
      const snap = await getDocs(
        collection(db, "attendance", selectedDate, "students")
      );
      const rows = snap.docs.map((doc) => doc.data());
      setResults(rows);
    } catch (err) {
      console.error("Firebase read error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFromFirebase();
  }, [selectedDate]);

  return (
    <div className="p-8 max-w-[1600px] mx-auto space-y-8">
      {/* ── AI Engine Control ────────────────────────── */}
      <motion.section 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card overflow-hidden"
      >
        <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center gap-3">
             <div className={`p-2 rounded-lg ${engineStatus === 'running' ? 'bg-danger/20 text-danger animate-pulse' : 'bg-primary/20 text-primary'}`}>
               <Camera className="w-5 h-5" />
             </div>
             <div>
               <h2 className="text-sm font-bold tracking-widest uppercase">AI Monitoring Hub</h2>
               <p className="text-[10px] text-textSecondary font-bold mt-0.5 tracking-tighter">
                 STATUS: {engineStatus.toUpperCase()} / CV PIPELINE ACTIVE
               </p>
             </div>
          </div>
          
          <div className="flex items-center gap-4">
            {devices.length > 0 && (
              <select 
                value={selectedDevice} 
                onChange={(e) => setSelectedDevice(e.target.value)}
                disabled={engineStatus === "running"}
                className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs font-bold text-textSecondary focus:outline-none focus:border-primary/50 appearance-none cursor-pointer min-w-[200px]"
              >
                {devices.map((device, i) => (
                  <option key={device.deviceId} value={device.deviceId} className="bg-card">
                    {device.label || `Camera ${i + 1}`}
                  </option>
                ))}
              </select>
            )}

            <button
              onClick={engineStatus === "running" ? stopEngine : startEngine}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all active:scale-95 shadow-glow-${engineStatus === 'running' ? 'danger' : 'primary'} ${
                engineStatus === "running" 
                ? "bg-danger/20 text-danger border border-danger/30 hover:bg-danger/30" 
                : "bg-primary/20 text-primary border border-primary/30 hover:bg-primary/30"
              }`}
            >
              {engineStatus === "running" ? (
                <>
                  <StopCircle className="w-4 h-4" />
                  TERMINATE SESSION
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  INITIALIZE ENGINE
                </>
              )}
            </button>
          </div>
        </div>

        <div className="p-8">
           <AnimatePresence mode="wait">
             {engineStatus === "running" ? (
               <motion.div 
                 key="live"
                 initial={{ opacity: 0, scale: 0.95 }}
                 animate={{ opacity: 1, scale: 1 }}
                 exit={{ opacity: 0, scale: 0.95 }}
                 className="relative max-w-4xl mx-auto rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-black"
               >
                 <video
                   ref={videoRef}
                   autoPlay
                   playsInline
                   muted
                   className="w-full h-auto block"
                 />
                 <canvas ref={overlayCanvasRef} className="absolute top-0 left-0 w-full h-full pointer-events-none" />
                 <canvas ref={canvasRef} className="hidden" />
                 
                 {/* Futuristic UI Overlays */}
                 <div className="absolute top-4 left-4 flex gap-2">
                    <span className="px-2 py-1 bg-danger/80 text-white text-[10px] font-bold rounded flex items-center gap-1 animate-pulse">
                      <Activity className="w-3 h-3" /> LIVE
                    </span>
                    <span className="px-2 py-1 bg-black/50 text-white text-[10px] font-bold rounded backdrop-blur-md border border-white/20">
                      1280x720 / 30 FPS
                    </span>
                 </div>
                 
                 <div className="absolute bottom-4 right-4 flex gap-2">
                    <div className="w-32 h-1 bg-white/20 rounded-full overflow-hidden">
                       <motion.div 
                         className="h-full bg-primary"
                         animate={{ x: ["-100%", "100%"] }}
                         transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                       />
                    </div>
                 </div>
                 
                 <div className="absolute inset-0 pointer-events-none border-[20px] border-transparent group">
                    <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-primary opacity-50"></div>
                    <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-primary opacity-50"></div>
                    <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-primary opacity-50"></div>
                    <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-primary opacity-50"></div>
                 </div>
               </motion.div>
             ) : (
               <motion.div 
                 key="idle"
                 initial={{ opacity: 0 }}
                 animate={{ opacity: 1 }}
                 className="flex flex-col items-center justify-center py-20 text-center space-y-6"
               >
                 <div className="w-20 h-20 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                    <Camera className="w-10 h-10" />
                 </div>
                 <div className="space-y-2">
                    <h3 className="text-lg font-bold">Engine Ready for Deployment</h3>
                    <p className="text-textSecondary text-sm max-w-md">Connect a high-definition optical sensor and initialize the facial recognition pipeline to begin real-time attendance tracking.</p>
                 </div>
                 {engineStatus === "done" && (
                   <motion.div 
                     initial={{ opacity: 0, y: 10 }}
                     animate={{ opacity: 1, y: 0 }}
                     className="px-4 py-2 bg-success/10 border border-success/20 rounded-lg text-success text-xs font-bold"
                   >
                     ✓ SESSION SUCCESSFULLY SYNCED TO FIRESTORE
                   </motion.div>
                 )}
               </motion.div>
             )}
           </AnimatePresence>
        </div>
      </motion.section>

      {/* ── View Past Attendance ─────────────────────── */}
      <motion.section 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass-card"
      >
        <div className="p-6 border-b border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
             <div className="p-2 rounded-lg bg-secondary/10 text-secondary">
               <History className="w-5 h-5" />
             </div>
             <h2 className="text-sm font-bold tracking-widest uppercase">Logs & Analytics</h2>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative group">
              <Calendar className="w-4 h-4 text-textSecondary absolute left-3 top-1/2 -translate-y-1/2 group-hover:text-primary transition-colors" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-xs font-bold text-textPrimary focus:outline-none focus:border-primary/50 transition-all cursor-pointer"
              />
            </div>
            <button
              onClick={loadFromFirebase}
              className="flex items-center gap-2 bg-white/5 border border-white/10 hover:bg-white/10 px-4 py-2 rounded-xl text-xs font-bold transition-all active:scale-95"
            >
              <RefreshCw className="w-4 h-4" />
              LOAD LOGS
            </button>
          </div>
        </div>

        <div className="p-0 overflow-x-auto">
          {loading ? (
            <div className="p-20 text-center opacity-50 space-y-4">
               <RefreshCw className="w-10 h-10 animate-spin mx-auto text-primary" />
               <p className="text-sm font-medium tracking-widest uppercase">Fetching encrypted data...</p>
            </div>
          ) : results.length === 0 ? (
            <div className="p-20 text-center opacity-50">
               <XSquare className="w-16 h-16 mx-auto mb-4" />
               <p className="text-sm font-medium">System reports zero localized records for the specified temporal coordinates.</p>
            </div>
          ) : (
            <table className="w-full text-left">
              <thead>
                <tr className="bg-white/5">
                  <th className="px-6 py-4 text-[10px] font-bold text-textSecondary uppercase tracking-widest">Identification</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-textSecondary uppercase tracking-widest">Status</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-textSecondary uppercase tracking-widest">Timestamp</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-textSecondary uppercase tracking-widest text-center">Active (S)</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-textSecondary uppercase tracking-widest text-center">Focus (%)</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-textSecondary uppercase tracking-widest text-center">Anomalies</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {results.map((row, i) => (
                  <motion.tr 
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="hover:bg-white/[0.02] transition-colors group"
                  >
                    <td className="px-6 py-4 font-bold text-sm tracking-tight group-hover:text-primary transition-colors">{row.name}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-[10px] font-bold border ${
                        row.status === 'Present' 
                        ? 'bg-success/10 text-success border-success/20' 
                        : 'bg-danger/10 text-danger border-danger/20'
                      }`}>
                        {row.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs font-mono text-textSecondary">{row.timeMarked}</td>
                    <td className="px-6 py-4 text-xs font-mono text-center">{row.activeTime}</td>
                    <td className="px-6 py-4 text-center">
                       <div className="flex items-center justify-center gap-2">
                          <span className="text-xs font-mono">{row.engagement}</span>
                          <div className="w-12 h-1 bg-white/5 rounded-full overflow-hidden">
                             <div className="h-full bg-primary" style={{ width: `${row.engagement}%` }}></div>
                          </div>
                       </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                       <span className={`text-xs font-bold ${row.drowsyEvents > 0 ? 'text-warning' : 'text-textSecondary opacity-30'}`}>
                          {row.drowsyEvents}
                       </span>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </motion.section>
    </div>
  );
}