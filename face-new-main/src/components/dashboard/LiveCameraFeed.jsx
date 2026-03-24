import React, { useRef, useEffect, useState } from 'react';
import { recognizeFrame } from '../../api';
import { useSession } from '../../context/SessionContext';
import { Camera } from 'lucide-react';

const LiveCameraFeed = ({ isSessionActive, onFrameDetected, onSystemMetrics }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const { updateDetectedFaces, updateSystemMetrics, recordDatabaseMatch, recordAttendanceMarked } = useSession();
  
  const [faceCount, setFaceCount] = useState(0);
  const [fps, setFps] = useState(0);
  const [processingTime, setProcessingTime] = useState(0);
  const [detectionCount, setDetectionCount] = useState(0);
  const frameCountRef = useRef(0);
  const lastTimeRef = useRef(Date.now());
  const lastFacesRef = useRef([]);

  useEffect(() => {
    if (!isSessionActive) return;

    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 } }
        });
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error('Camera access denied:', err);
      }
    };

    startCamera();

    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      }
    };
  }, [isSessionActive]);

  useEffect(() => {
    if (!isSessionActive || !videoRef.current || !canvasRef.current) return;

    const processFrame = async () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      if (video.readyState === video.HAVE_ENOUGH_DATA) {
        const ctx = canvas.getContext('2d');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = canvas.toDataURL('image/jpeg', 0.8);

        const startTime = performance.now();
        
        try {
          const result = await recognizeFrame(imageData);
          const endTime = performance.now();
          const processingMs = Math.round(endTime - startTime);

          setProcessingTime(processingMs);
          setFaceCount(result.faceCount || 0);
          
          // Track new detections
          const newFaces = result.faces || [];
          const newDetections = newFaces.filter(f => 
            !lastFacesRef.current.some(lf => lf.name === f.name)
          ).length;
          
          if (newDetections > 0) {
            setDetectionCount(prev => prev + newDetections);
            recordDatabaseMatch();
          }

          // Check for attendance marked
          const newlyMarked = newFaces.filter(f => f.status === 'Present').length;
          if (newlyMarked > 0) {
            recordAttendanceMarked(newlyMarked);
          }

          lastFacesRef.current = newFaces;

          // Draw faces on canvas
          if (newFaces && newFaces.length > 0) {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            
            newFaces.forEach(face => {
              ctx.strokeStyle = '#00ff88';
              ctx.lineWidth = 2;
              ctx.strokeRect(face.box.x, face.box.y, face.box.w, face.box.h);
              
              ctx.fillStyle = '#00ff88';
              ctx.font = 'bold 16px Arial';
              ctx.fillText(
                `${face.name} - ${face.ear}`,
                face.box.x,
                face.box.y - 10
              );
            });
          }

          // Update global session state
          updateDetectedFaces(newFaces);

          if (onFrameDetected) {
            onFrameDetected(result);
          }

          // Calculate FPS
          frameCountRef.current++;
          const now = Date.now();
          if (now - lastTimeRef.current >= 1000) {
            setFps(frameCountRef.current);
            frameCountRef.current = 0;
            lastTimeRef.current = now;
          }

          // Send metrics to context
          updateSystemMetrics({
            processingTime: processingMs,
            fps: fps,
            newDetections: newDetections,
          });

          if (onSystemMetrics) {
            onSystemMetrics({
              processingTime: processingMs,
              fps: fps,
              detectionCount
            });
          }
        } catch (err) {
          console.error('Frame processing error:', err);
        }
      }

      requestAnimationFrame(processFrame);
    };

    const frameInterval = requestAnimationFrame(processFrame);
    return () => cancelAnimationFrame(frameInterval);
  }, [isSessionActive, fps, detectionCount, onFrameDetected, onSystemMetrics, updateDetectedFaces, updateSystemMetrics, recordDatabaseMatch, recordAttendanceMarked]);

  return (
    <div className="glass-card p-1 overflow-hidden relative group border-primary/20">
      {/* Top Right Info */}
      <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
        <div className="bg-background/80 backdrop-blur-md px-3 py-1 rounded text-xs font-bold text-secondary">
          {faceCount} faces in frame
        </div>
        <div className="bg-background/80 backdrop-blur-md px-3 py-1 rounded text-xs font-bold text-secondary">
          {fps} FPS
        </div>
      </div>

      {/* Top Left Badge */}
      <div className="absolute top-4 left-4 z-10">
        <div className="bg-background/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-primary/30 flex items-center gap-2">
          <span className="w-2 h-2 bg-primary rounded-full animate-pulse shadow-glow-primary"></span>
          <span className="text-xs font-bold tracking-widest text-primary uppercase">LIVE CAMERA FEED</span>
        </div>
      </div>

      {/* Video Container */}
      <div className="aspect-[16/9] bg-black rounded-lg overflow-hidden relative">
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className="w-full h-full object-cover"
        />
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full"
        />
        
        {!isSessionActive && (
          <div className="absolute inset-0 flex items-center justify-center flex-col gap-4 bg-black/50">
            <Camera className="w-16 h-16 text-textSecondary/30" />
            <p className="text-xs font-bold tracking-widest text-textSecondary/30 uppercase">
              Start session to activate camera
            </p>
          </div>
        )}

        {/* Scan Line Effect */}
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-transparent via-primary/5 to-transparent h-24 w-full -top-24 animate-[scan_3s_linear_infinite]"></div>
      </div>

      {/* Bottom Info */}
      <div className="p-3 flex items-center justify-between text-xs font-bold tracking-widest text-textSecondary/70 uppercase">
        <span>CAM_01 / FRONT_SEC_DASH</span>
        <span className="text-primary/70">{processingTime}ms INFERENCE</span>
      </div>
    </div>
  );
};

export default LiveCameraFeed;
