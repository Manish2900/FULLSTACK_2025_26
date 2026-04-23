import React, { useEffect, useRef, useState } from 'react';
import * as faceapi from '@vladmandic/face-api';

const API_BASE = 'http://localhost:8080';

function getAuthHeaders() {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
}

function Exam({ user, onLogout }) {
  const videoRef = useRef(null);
  const pcRef = useRef(null);
  const wsRef = useRef(null);
  const [status, setStatus] = useState('Initializing...');
  const [examDetails, setExamDetails] = useState(null);
  const [examId, setExamId] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [score, setScore] = useState(null);
  const [warning, setWarning] = useState('');

  // Fetch exam assignments for this student, then load exam details
  useEffect(() => {
    const fetchAssignments = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/student/assignments`, {
          headers: getAuthHeaders()
        });
        if (res.ok) {
          const assignments = await res.json();
          if (assignments.length > 0) {
            const firstAssignment = assignments[0];
            setExamId(firstAssignment.examId);
            fetchExamData(firstAssignment.examId);
          }
        }
      } catch (err) {
        console.error('Failed to fetch assignments', err);
      }
    };
    fetchAssignments();
  }, []);

  // Load Face API models and start webcam
  useEffect(() => {
    let stream = null;

    const init = async () => {
      try {
        await faceapi.nets.tinyFaceDetector.loadFromUri('/models');
        await faceapi.nets.faceLandmark68Net.loadFromUri('/models');
        
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setStatus('Webcam Active');

        // Setup WebSocket & WebRTC
        wsRef.current = new WebSocket('ws://localhost:8080/signaling');
        wsRef.current.onopen = () => {
          wsRef.current.send(JSON.stringify({ type: 'join', role: 'STUDENT', userId: user.id }));
          startWebRTC(stream);
        };
        
        wsRef.current.onmessage = async (event) => {
          const data = JSON.parse(event.data);
          if (data.type === 'answer') {
            await pcRef.current.setRemoteDescription(new RTCSessionDescription(data.answer));
          } else if (data.type === 'candidate') {
            await pcRef.current.addIceCandidate(new RTCIceCandidate(data.candidate));
          }
        };

      } catch (err) {
        console.error("Initialization error:", err);
        setStatus('Error: Initialization failed. Please check camera permissions.');
      }
    };

    init();

    return () => {
      if (stream) stream.getTracks().forEach(track => track.stop());
      if (wsRef.current) wsRef.current.close();
      if (pcRef.current) pcRef.current.close();
    };
  }, []);

  const startWebRTC = async (stream) => {
    pcRef.current = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    });

    stream.getTracks().forEach(track => pcRef.current.addTrack(track, stream));

    pcRef.current.onicecandidate = (e) => {
      if (e.candidate) {
        wsRef.current.send(JSON.stringify({ type: 'candidate', candidate: e.candidate }));
      }
    };

    const offer = await pcRef.current.createOffer();
    await pcRef.current.setLocalDescription(offer);
    wsRef.current.send(JSON.stringify({ type: 'offer', offer }));
  };

  const handleVideoPlay = () => {
    // Start face detection loop
    setInterval(async () => {
      if (!videoRef.current) return;
      const detections = await faceapi.detectAllFaces(videoRef.current, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks();
      
      let newWarning = '';
      if (detections.length === 0) {
        newWarning = 'Face not detected! Please look at the camera.';
      } else if (detections.length > 1) {
        newWarning = 'Multiple faces detected!';
      } else {
        const landmarks = detections[0].landmarks;
        const nose = landmarks.getNose()[0];
        const jawline = landmarks.getJawOutline();
        const leftEdge = jawline[0].x;
        const rightEdge = jawline[16].x;
        
        // Simple gaze/pose heuristic: nose x-position relative to face width
        const faceWidth = rightEdge - leftEdge;
        const noseRelativeX = (nose.x - leftEdge) / faceWidth;
        
        if (noseRelativeX < 0.35 || noseRelativeX > 0.65) {
          newWarning = 'Please do not look away from the screen!';
        }
      }

      setWarning(newWarning);
      if (newWarning && wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'warning', message: newWarning }));
      }
    }, 1000);
  };

  const fetchExamData = async (eid) => {
    try {
      const resDetails = await fetch(`${API_BASE}/api/exam/${eid}`, {
        headers: getAuthHeaders()
      });
      if (resDetails.ok) setExamDetails(await resDetails.json());

      const resQs = await fetch(`${API_BASE}/api/exam/${eid}/questions`, {
        headers: getAuthHeaders()
      });
      if (resQs.ok) setQuestions(await resQs.json());
    } catch (err) {
      console.error('Failed to fetch exam data', err);
    }
  };

  const submitExam = async () => {
    if (!examId) return;
    try {
      const response = await fetch(`${API_BASE}/api/exam/${examId}/submit`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(answers)
      });
      if (response.ok) {
        const result = await response.json();
        setScore(result);
      }
    } catch (err) {
      console.error('Submission failed', err);
    }
  };

  const handleAnswerSelect = (qId, optionIdx) => {
    setAnswers(prev => ({ ...prev, [qId]: optionIdx }));
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 1rem', display: 'flex', gap: '2rem', flexWrap: 'wrap', alignItems: 'flex-start' }}>
      {/* Sticky Left Sidebar for Camera and Info */}
      <div style={{ flex: '1', minWidth: '350px', position: 'sticky', top: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <header className="exam-header" style={{ marginBottom: 0 }}>
          <h2>Student Exam Interface</h2>
          <div className={`status-indicator ${status === 'Webcam Active' ? 'active' : 'error'}`}>
            {status}
          </div>
          <button onClick={onLogout} className="btn-secondary">Logout</button>
        </header>

        {warning && (
          <div style={{ 
            backgroundColor: 'rgba(255, 77, 77, 0.1)', 
            border: '2px solid #ff4d4d',
            color: '#ff4d4d', 
            padding: '1rem', 
            borderRadius: '12px', 
            textAlign: 'center', 
            fontWeight: 'bold',
            boxShadow: '0 4px 15px rgba(255, 77, 77, 0.2)',
            animation: 'pulse 2s infinite'
          }}>
            ⚠️ AI Warning: {warning}
          </div>
        )}

        <div className="video-wrapper" style={{ margin: 0, position: 'relative', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 8px 30px rgba(0,0,0,0.5)' }}>
          <video ref={videoRef} onPlay={handleVideoPlay} autoPlay playsInline muted className="live-video" style={{ width: '100%', display: 'block' }}></video>
          {/* Overlay scanning effect */}
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none', background: 'linear-gradient(180deg, rgba(0,255,0,0.05) 0%, rgba(0,0,0,0) 100%)' }}></div>
        </div>
        
        <div className="exam-info" style={{ margin: 0, padding: '1.5rem', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
          <p style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>Student: <strong style={{ color: '#fff' }}>{user?.name}</strong></p>
          {examDetails && (
            <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
              <h3 style={{ color: '#4facfe', marginBottom: '0.5rem' }}>{examDetails.title}</h3>
              <p style={{ color: '#94a3b8', fontSize: '0.9rem', lineHeight: '1.5' }}>{examDetails.description}</p>
            </div>
          )}
        </div>
      </div>

      {/* Scrollable Right Area for Quiz */}
      <div style={{ flex: '2', minWidth: '400px' }}>
        {score ? (
          <div style={{ padding: '3rem', backgroundColor: 'rgba(76, 175, 80, 0.1)', border: '2px solid #4CAF50', borderRadius: '16px', textAlign: 'center', boxShadow: '0 10px 30px rgba(76, 175, 80, 0.2)' }}>
            <h2 style={{ fontSize: '2.5rem', color: '#4CAF50', marginBottom: '1rem' }}>Exam Submitted!</h2>
            <p style={{ fontSize: '1.5rem', color: '#e2e8f0' }}>Your Final Score</p>
            <div style={{ fontSize: '4rem', fontWeight: 'bold', color: '#fff', marginTop: '1rem', textShadow: '0 0 20px rgba(76, 175, 80, 0.5)' }}>
              {score.score} <span style={{ fontSize: '2rem', color: '#94a3b8' }}>/ {score.total}</span>
            </div>
          </div>
        ) : (
          questions.length > 0 && (
            <div className="quiz-section" style={{ backgroundColor: 'rgba(20, 20, 30, 0.5)', padding: '2.5rem', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.05)', boxShadow: '0 20px 40px rgba(0,0,0,0.3)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1rem' }}>
                <h3 style={{ fontSize: '1.8rem', color: '#fff' }}>Examination Questions</h3>
                <span style={{ backgroundColor: 'rgba(79, 172, 254, 0.2)', color: '#4facfe', padding: '0.5rem 1rem', borderRadius: '20px', fontWeight: 'bold' }}>
                  {Object.keys(answers).length} / {questions.length} Answered
                </span>
              </div>
              
              {questions.map((q, idx) => (
                <div key={q.id} style={{ 
                  marginBottom: '2rem', 
                  padding: '2rem', 
                  backgroundColor: 'rgba(255,255,255,0.03)', 
                  borderRadius: '16px',
                  border: '1px solid rgba(255,255,255,0.02)',
                  transition: 'all 0.3s ease',
                  boxShadow: answers[q.id] !== undefined ? '0 0 0 1px rgba(79, 172, 254, 0.5)' : 'none'
                }}>
                  <p style={{ fontWeight: '600', fontSize: '1.2rem', marginBottom: '1.5rem', color: '#e2e8f0', lineHeight: '1.6' }}>
                    <span style={{ color: '#4facfe', marginRight: '0.5rem' }}>{idx + 1}.</span> {q.text}
                  </p>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                    {q.options.map((opt, oIdx) => {
                      const isSelected = answers[q.id] === oIdx;
                      return (
                        <label key={oIdx} style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          padding: '1rem 1.5rem', 
                          backgroundColor: isSelected ? 'rgba(79, 172, 254, 0.15)' : 'rgba(0,0,0,0.2)',
                          border: isSelected ? '1px solid #4facfe' : '1px solid rgba(255,255,255,0.1)',
                          borderRadius: '12px',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          color: isSelected ? '#fff' : '#cbd5e1'
                        }}>
                          <input 
                            type="radio" 
                            name={`question_${q.id}`} 
                            checked={isSelected}
                            onChange={() => handleAnswerSelect(q.id, oIdx)}
                            style={{ 
                              marginRight: '1rem', 
                              accentColor: '#4facfe',
                              width: '18px',
                              height: '18px'
                            }}
                          />
                          <span style={{ fontSize: '1.05rem' }}>{opt}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}
              
              <button 
                onClick={submitExam} 
                className="btn-primary" 
                style={{ 
                  width: '100%', 
                  padding: '1.2rem', 
                  fontSize: '1.2rem',
                  fontWeight: 'bold',
                  marginTop: '1rem',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                  boxShadow: '0 8px 20px rgba(79, 172, 254, 0.4)',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                  cursor: Object.keys(answers).length < questions.length ? 'not-allowed' : 'pointer',
                  opacity: Object.keys(answers).length < questions.length ? 0.7 : 1
                }}
                disabled={Object.keys(answers).length < questions.length}
              >
                {Object.keys(answers).length < questions.length ? 'Answer all questions to submit' : 'Submit Exam'}
              </button>
            </div>
          )
        )}
      </div>
    </div>
  );
}

export default Exam;
