// ============================================================
//  F.A.C.E — SessionContext.jsx
//  Purpose: Manages real-time session state across Dashboard
//           and AI Monitoring Hub pages
// ============================================================

import React, { createContext, useContext, useState, useCallback } from 'react';

const SessionContext = createContext();

export const SessionProvider = ({ children }) => {
  // Session State
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [sessionDuration, setSessionDuration] = useState(0);
  const [faces, setFaces] = useState([]);
  
  // Metrics State
  const [systemMetrics, setSystemMetrics] = useState({
    processingTime: 0,  // ms
    fps: 0,
    detectionCount: 0,
    cpuUsage: 0,
    ramUsage: 0,
  });
  
  // Detection Pipeline State
  const [detectionPipeline, setDetectionPipeline] = useState({
    framesCaptured: 0,
    facesDetected: 0,
    encodingsExtracted: 0,
    databaseMatches: 0,
    attendanceMarked: 0,
  });

  // Update session status
  const updateSessionStatus = useCallback((active) => {
    setIsSessionActive(active);
  }, []);

  // Update detected faces (called from Monitoring Hub)
  const updateDetectedFaces = useCallback((newFaces) => {
    setFaces(newFaces);
    
    // Auto-update detection pipeline counts
    setDetectionPipeline(prev => ({
      ...prev,
      framesCaptured: prev.framesCaptured + 1,
      facesDetected: newFaces.length > 0 ? prev.facesDetected + 1 : prev.facesDetected,
      encodingsExtracted: newFaces.length > 0 ? prev.encodingsExtracted + newFaces.length : prev.encodingsExtracted,
    }));
  }, []);

  // Update system metrics (called from Monitoring Hub)
  const updateSystemMetrics = useCallback((metrics) => {
    setSystemMetrics(prev => ({
      ...prev,
      ...metrics,
      detectionCount: (prev.detectionCount || 0) + (metrics.newDetections || 0),
    }));
  }, []);

  // Update when a face is matched to database
  const recordDatabaseMatch = useCallback(() => {
    setDetectionPipeline(prev => ({
      ...prev,
      databaseMatches: prev.databaseMatches + 1,
    }));
  }, []);

  // Update when attendance is marked
  const recordAttendanceMarked = useCallback((count = 1) => {
    setDetectionPipeline(prev => ({
      ...prev,
      attendanceMarked: prev.attendanceMarked + count,
    }));
  }, []);

  // Reset session (called when ending session)
  const resetSession = useCallback(() => {
    setIsSessionActive(false);
    setSessionDuration(0);
    setFaces([]);
    setSystemMetrics({
      processingTime: 0,
      fps: 0,
      detectionCount: 0,
      cpuUsage: 0,
      ramUsage: 0,
    });
    setDetectionPipeline({
      framesCaptured: 0,
      facesDetected: 0,
      encodingsExtracted: 0,
      databaseMatches: 0,
      attendanceMarked: 0,
    });
  }, []);

  const value = {
    // Session
    isSessionActive,
    sessionDuration,
    setSessionDuration,
    updateSessionStatus,
    
    // Faces & Metrics
    faces,
    updateDetectedFaces,
    systemMetrics,
    updateSystemMetrics,
    
    // Detection Pipeline
    detectionPipeline,
    recordDatabaseMatch,
    recordAttendanceMarked,
    
    // Utility
    resetSession,
  };

  return (
    <SessionContext.Provider value={value}>
      {children}
    </SessionContext.Provider>
  );
};

// Custom hook to use session context
export const useSession = () => {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession must be used within SessionProvider');
  }
  return context;
};

export default SessionContext;
