import { useState, useRef, useEffect } from 'react';
import { Camera, X, Check, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAppState } from '../context/AppStateContext';

const StudentRegistration = () => {
  const { addNotification, addStudent } = useAppState();
  const [fullName, setFullName] = useState('');
  const [rollNumber, setRollNumber] = useState('');
  const [department, setDepartment] = useState('');
  const [capturedSamples, setCapturedSamples] = useState([]);
  const [isCapturing, setIsCapturing] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [cameraReady, setCameraReady] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  // Department options
  const departments = [
    'Computer Science',
    'Electronics',
    'Mechanical',
    'Electrical',
    'Civil',
    'Information Technology'
  ];

  // Start camera on component mount
  useEffect(() => {
    const startCamera = async () => {
      try {
        // First, enumerate all available devices
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(device => device.kind === 'videoinput');
        
        console.log('Available cameras:', videoDevices);
        
        let deviceId = null;
        
        // Try to find the built-in laptop camera (usually the first one or labeled as "default")
        for (let device of videoDevices) {
          const label = device.label.toLowerCase();
          // Prefer built-in cameras
          if (label.includes('built-in') || label.includes('integrated') || label.includes('internal')) {
            deviceId = device.deviceId;
            console.log('Selected built-in camera:', device.label);
            break;
          }
        }
        
        // If no built-in camera found, use the first one (usually the default)
        if (!deviceId && videoDevices.length > 0) {
          deviceId = videoDevices[0].deviceId;
          console.log('Selected default camera:', videoDevices[0].label);
        }
        
        const constraints = {
          video: { 
            deviceId: deviceId ? { exact: deviceId } : undefined,
            facingMode: 'user',
            width: { ideal: 1280 },
            height: { ideal: 720 }
          },
          audio: false
        };
        
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          streamRef.current = stream;
          
          // Set video to play when ready
          videoRef.current.onloadedmetadata = () => {
            videoRef.current.play().catch(err => {
              console.error('Autoplay error:', err);
              setCameraReady(true);
            });
            setCameraReady(true);
          };
        }
      } catch (error) {
        console.error('Error accessing camera:', error);
        setMessage('Camera access denied. Please enable camera permissions in your browser settings.');
        setMessageType('error');
        setCameraReady(false);
      }
    };

    startCamera();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const captureFrame = () => {
    if (!videoRef.current || !canvasRef.current) return;

    try {
      const context = canvasRef.current.getContext('2d');
      const video = videoRef.current;
      
      canvasRef.current.width = video.videoWidth;
      canvasRef.current.height = video.videoHeight;
      
      // Draw mirror image
      context.translate(canvasRef.current.width, 0);
      context.scale(-1, 1);
      context.drawImage(video, 0, 0);
      
      // Convert to image data
      const imageData = canvasRef.current.toDataURL('image/jpeg');
      return imageData;
    } catch (error) {
      console.error('Error capturing frame:', error);
      return null;
    }
  };

  const handleCaptureSample = () => {
    if (capturedSamples.length >= 5) {
      setMessage('Maximum 5 samples allowed.');
      setMessageType('warning');
      return;
    }

    const imageData = captureFrame();
    if (imageData) {
      setCapturedSamples([...capturedSamples, imageData]);
      setMessage(`Sample ${capturedSamples.length + 1} captured successfully.`);
      setMessageType('success');
    }
  };

  const removeSample = (index) => {
    setCapturedSamples(capturedSamples.filter((_, i) => i !== index));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Validation
    if (!fullName.trim()) {
      setMessage('Please enter full name.');
      setMessageType('error');
      return;
    }
    if (!rollNumber.trim()) {
      setMessage('Please enter roll number.');
      setMessageType('error');
      return;
    }
    if (!department) {
      setMessage('Please select a department.');
      setMessageType('error');
      return;
    }
    if (capturedSamples.length < 5) {
      setMessage(`Please capture 5 samples (${capturedSamples.length}/5 captured).`);
      setMessageType('warning');
      return;
    }

    setIsCapturing(true);
    setMessage('Registering student and saving face samples...');
    setMessageType('info');

    // Save to backend
    const saveFaceSamples = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/save-face-samples', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            studentName: fullName.trim(),
            rollNumber: rollNumber.trim().toUpperCase(),
            department,
            samples: capturedSamples
          })
        });

        const result = await response.json();

        if (!result.success) {
          setMessage(`Error: ${result.message}`);
          setMessageType('error');
          setIsCapturing(false);
          return;
        }

        // Also save to app state
        const addResult = addStudent({
          id: crypto.randomUUID(),
          name: fullName.trim(),
          rollNo: rollNumber.trim().toUpperCase()
        });

        if (!addResult.ok) {
          setMessage(`Database error: ${addResult.message}`);
          setMessageType('error');
          setIsCapturing(false);
          return;
        }

        setMessage(`✓ Student registered successfully! Images saved to ${result.folderPath}`);
        setMessageType('success');
        addNotification({
          message: `${fullName} (${rollNumber.toUpperCase()}) registered with 5 face samples.`,
          type: 'success'
        });

        // Reset form after delay
        setTimeout(() => {
          setFullName('');
          setRollNumber('');
          setDepartment('');
          setCapturedSamples([]);
          setMessage('');
          setIsCapturing(false);
        }, 3000);

      } catch (error) {
        console.error('Backend error:', error);
        setMessage(`Connection error: ${error.message}`);
        setMessageType('error');
        setIsCapturing(false);
      }
    };

    saveFaceSamples();
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-secondary/5 to-secondary/10 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-textPrimary mb-2 flex items-center gap-3">
            <Camera className="w-8 h-8 text-primary" />
            STUDENT REGISTRATION
          </h1>
          <p className="text-textSecondary">
            Computer Vision (CS401) - Register New Students
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Student Information */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-1"
          >
            <div className="glass-card p-8">
              <h2 className="text-sm font-bold tracking-widest text-primary uppercase mb-6 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                Student Information
              </h2>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Full Name */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-textSecondary uppercase">
                    Full Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Arjun Sharma"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-textPrimary placeholder-textSecondary/50 focus:outline-none focus:border-primary/50 transition-all"
                  />
                </div>

                {/* Roll Number */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-textSecondary uppercase">
                    Roll Number
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. CS21009"
                    value={rollNumber}
                    onChange={(e) => setRollNumber(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-textPrimary placeholder-textSecondary/50 focus:outline-none focus:border-primary/50 transition-all"
                  />
                </div>

                {/* Department */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-textSecondary uppercase">
                    Department
                  </label>
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-textPrimary focus:outline-none focus:border-primary/50 transition-all appearance-none cursor-pointer"
                    style={{
                      backgroundImage: "url('data:image/svg+xml;utf8,<svg fill=\"white\" height=\"24\" viewBox=\"0 0 24 24\" width=\"24\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M7 10l5 5 5-5z\"/></svg>')",
                      backgroundRepeat: 'no-repeat',
                      backgroundPosition: 'right 0.5rem center',
                      backgroundSize: '1.5em 1.5em',
                      paddingRight: '2.5rem'
                    }}
                  >
                    <option value="">Select department</option>
                    {departments.map((dept) => (
                      <option key={dept} value={dept} style={{backgroundColor: '#1a1a2e', color: '#00d4ff'}}>
                        {dept}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Progress Indicator */}
                <div className="mt-8 p-4 bg-white/5 border border-white/10 rounded-xl">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-textSecondary uppercase">
                      Face Samples
                    </span>
                    <span className="text-xs font-bold text-primary">
                      {capturedSamples.length}/5
                    </span>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-primary to-secondary"
                      initial={{ width: 0 }}
                      animate={{ width: `${(capturedSamples.length / 5) * 100}%` }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                </div>

                {/* Message */}
                {message && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-4 rounded-xl text-xs font-bold flex items-center gap-2 ${
                      messageType === 'success'
                        ? 'bg-success/10 text-success border border-success/20'
                        : messageType === 'error'
                        ? 'bg-danger/10 text-danger border border-danger/20'
                        : 'bg-warning/10 text-warning border border-warning/20'
                    }`}
                  >
                    {messageType === 'success' ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <AlertCircle className="w-4 h-4" />
                    )}
                    {message}
                  </motion.div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isCapturing}
                  className="w-full bg-primary/20 text-primary border border-primary/30 hover:bg-primary/30 disabled:opacity-50 disabled:cursor-not-allowed py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 active:scale-95 shadow-lg hover:shadow-glow-primary"
                >
                  {isCapturing ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity }}
                      >
                        <Camera className="w-5 h-5" />
                      </motion.div>
                      SAVING...
                    </>
                  ) : (
                    <>
                      <Check className="w-5 h-5" />
                      REGISTER STUDENT
                    </>
                  )}
                </button>
              </form>
            </div>
          </motion.div>

          {/* Middle: Face Capture */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-1"
          >
            <div className="glass-card p-8 flex flex-col h-full">
              <h2 className="text-sm font-bold tracking-widest text-primary uppercase mb-6 flex items-center gap-2">
                <Camera className="w-4 h-4" />
                FACE CAPTURE ({capturedSamples.length}/5)
              </h2>

              {/* Student Name Display */}
              {fullName && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-4 p-3 bg-primary/10 border border-primary/30 rounded-lg text-center"
                >
                  <p className="text-xs text-textSecondary">REGISTERING</p>
                  <p className="text-sm font-bold text-primary">{fullName} • {rollNumber || 'No Roll'}</p>
                </motion.div>
              )}

              {/* Video Feed */}
              <div className="relative mb-6 flex-1 rounded-xl overflow-hidden border-2 border-dashed border-primary/30 bg-black min-h-[300px]">
                {!cameraReady && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black">
                    <div className="text-center space-y-2">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="inline-block"
                      >
                        <Camera className="w-8 h-8 text-primary" />
                      </motion.div>
                      <p className="text-xs text-textSecondary">Initializing camera...</p>
                    </div>
                  </div>
                )}
                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  playsInline
                  width="640"
                  height="480"
                  className="w-full h-full object-cover"
                  style={{ transform: 'scaleX(-1)' }}
                />
                
                {/* Face Detection Circle */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <motion.div
                    animate={{
                      scale: [1, 1.1, 1],
                      opacity: [0.8, 1, 0.8]
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity
                    }}
                    className="w-24 h-24 border-2 border-primary rounded-full flex items-center justify-center"
                  >
                    <div className="w-16 h-16 border border-primary/50 rounded-full" />
                  </motion.div>
                </div>

                {/* Position Hint */}
                <div className="absolute bottom-4 left-0 right-0 text-center pointer-events-none">
                  <p className="text-xs text-primary font-mono">
                    WEBCAM - Position & Lighting: Good
                  </p>
                  <p className="text-xs text-textSecondary mt-1">
                    Position face within frame and click Capture Sample
                  </p>
                </div>
              </div>

              {/* Capture Button */}
              <motion.button
                onClick={handleCaptureSample}
                disabled={capturedSamples.length >= 5 || !cameraReady}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`w-full py-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${
                  capturedSamples.length >= 5
                    ? 'bg-white/10 text-textSecondary/50 cursor-not-allowed'
                    : !cameraReady
                    ? 'bg-white/10 text-textSecondary/50 cursor-not-allowed'
                    : 'bg-primary/20 text-primary border border-primary/30 hover:bg-primary/30 shadow-glow-primary active:scale-95'
                }`}
              >
                <Camera className="w-5 h-5" />
                {capturedSamples.length >= 5 ? 'SAMPLES COMPLETE' : 'CAPTURE SAMPLE'}
              </motion.button>

              {/* Hidden Canvas */}
              <canvas ref={canvasRef} style={{ display: 'none' }} />
            </div>
          </motion.div>

          {/* Right: Captured Samples */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="lg:col-span-1"
          >
            <div className="glass-card p-8 flex flex-col h-full">
              <h2 className="text-sm font-bold tracking-widest text-primary uppercase mb-6">
                CAPTURED SAMPLES
              </h2>

              {capturedSamples.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4 opacity-50">
                  <Camera className="w-16 h-16" />
                  <div>
                    <p className="text-sm font-medium">No samples captured yet</p>
                    <p className="text-xs text-textSecondary">
                      Capture 5 samples to register
                    </p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4 flex-1">
                  {capturedSamples.map((sample, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="relative group rounded-lg overflow-hidden border border-primary/30 bg-black aspect-square"
                    >
                      <img
                        src={sample}
                        alt={`Sample ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                      
                      {/* Sample Number */}
                      <div className="absolute top-2 left-2 bg-primary/80 text-black px-2 py-1 rounded text-xs font-bold">
                        #{index + 1}
                      </div>

                      {/* Remove Button */}
                      <motion.button
                        onClick={() => removeSample(index)}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        className="absolute top-2 right-2 bg-danger/80 hover:bg-danger p-1 rounded text-white opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-4 h-4" />
                      </motion.button>
                    </motion.div>
                  ))}
                </div>
              )}

              {/* Sample Counter */}
              {capturedSamples.length > 0 && (
                <div className="mt-6 p-4 bg-success/10 border border-success/20 rounded-xl text-center">
                  <p className="text-xs font-bold text-success">
                    ✓ {capturedSamples.length}/5 samples ready for registration
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>

      <style jsx>{`
        .mirror-video {
          transform: scaleX(-1);
        }
      `}</style>
    </div>
  );
};

export default StudentRegistration;
