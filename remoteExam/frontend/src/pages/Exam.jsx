import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

function Exam() {
  const videoRef = useRef(null);
  const [status, setStatus] = useState('Initializing...');
  const [examDetails, setExamDetails] = useState(null);
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));
  const examId = 'exam001';

  useEffect(() => {
    if (!user || user.role !== 'STUDENT') {
      navigate('/');
      return;
    }

    let stream = null;

    const startWebcam = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setStatus('Webcam Active');
      } catch (err) {
        console.error("Error accessing webcam:", err);
        setStatus('Error: Webcam access denied or unavailable.');
      }
    };

    const fetchExamDetails = async () => {
      try {
        const response = await fetch(`http://localhost:8080/api/exam/${examId}`);
        if (response.ok) {
          const data = await response.json();
          setExamDetails(data);
        }
      } catch (err) {
        console.error('Failed to fetch exam details', err);
      }
    };

    startWebcam();
    fetchExamDetails();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/');
  };

  return (
    <div className="exam-container">
      <header className="exam-header">
        <h2>Student Exam Interface</h2>
        <div className={`status-indicator ${status === 'Webcam Active' ? 'active' : 'error'}`}>
          {status}
        </div>
        <button onClick={handleLogout} className="btn-secondary">Logout</button>
      </header>
      
      <div className="video-wrapper" style={{ maxWidth: '600px', margin: '0 auto 2rem auto' }}>
        <video ref={videoRef} autoPlay playsInline muted className="live-video"></video>
      </div>
      
      <div className="exam-info">
        <p>Student: <strong>{user?.name}</strong> ({user?.id})</p>
        <p>Exam ID: <strong>{examId}</strong></p>
        {examDetails && (
          <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
            <h3>{examDetails.title}</h3>
            <p style={{ marginTop: '0.5rem', color: '#94a3b8' }}>{examDetails.description}</p>
            <p style={{ marginTop: '0.5rem' }}>Duration: {examDetails.durationMinutes} minutes</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Exam;
