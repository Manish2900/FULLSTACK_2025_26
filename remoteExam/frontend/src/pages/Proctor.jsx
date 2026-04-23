import React, { useEffect, useRef, useState } from 'react';

const API_BASE = 'http://localhost:8080';

function getAuthHeaders() {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
}

function Proctor({ user, onLogout }) {
  const [status, setStatus] = useState('Waiting for students...');
  const [warnings, setWarnings] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const videoRef = useRef(null);
  const pcRef = useRef(null);
  const wsRef = useRef(null);

  // Fetch proctor's assigned students
  useEffect(() => {
    const fetchAssignments = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/proctor/assignments`, {
          headers: getAuthHeaders()
        });
        if (res.ok) {
          const data = await res.json();
          setAssignments(data);
        }
      } catch (err) {
        console.error('Failed to fetch assignments', err);
      }
    };
    fetchAssignments();
  }, []);

  useEffect(() => {
    // Setup WebSocket
    wsRef.current = new WebSocket('ws://localhost:8080/signaling');

    wsRef.current.onopen = () => {
      setStatus('Connected to Signaling Server');
      wsRef.current.send(JSON.stringify({ type: 'join', role: 'PROCTOR' }));
    };

    wsRef.current.onmessage = async (event) => {
      const data = JSON.parse(event.data);

      if (data.type === 'offer') {
        setStatus('Incoming stream...');
        pcRef.current = new RTCPeerConnection({
          iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
        });

        pcRef.current.ontrack = (e) => {
          if (videoRef.current && e.streams[0]) {
            videoRef.current.srcObject = e.streams[0];
            setStatus('Viewing Student Stream');
          }
        };

        pcRef.current.onicecandidate = (e) => {
          if (e.candidate) {
            wsRef.current.send(JSON.stringify({ type: 'candidate', candidate: e.candidate }));
          }
        };

        await pcRef.current.setRemoteDescription(new RTCSessionDescription(data.offer));
        const answer = await pcRef.current.createAnswer();
        await pcRef.current.setLocalDescription(answer);

        wsRef.current.send(JSON.stringify({ type: 'answer', answer }));
      } else if (data.type === 'candidate') {
        if (pcRef.current) {
          try {
            await pcRef.current.addIceCandidate(new RTCIceCandidate(data.candidate));
          } catch (e) {
            console.error('Error adding ICE candidate', e);
          }
        }
      } else if (data.type === 'warning') {
        setWarnings(prev => [...prev, { time: new Date().toLocaleTimeString(), msg: data.message }]);
      }
    };

    return () => {
      if (wsRef.current) wsRef.current.close();
      if (pcRef.current) pcRef.current.close();
    };
  }, []);

  return (
    <div className="exam-container" style={{ maxWidth: '1100px' }}>
      <header className="exam-header">
        <h2>Proctor Dashboard</h2>
        <div className={`status-indicator ${status === 'Viewing Student Stream' ? 'active' : 'error'}`}>
          {status}
        </div>
        <button onClick={onLogout} className="btn-secondary">Logout</button>
      </header>

      {/* Assigned Students List */}
      {assignments.length > 0 && (
        <div style={{ marginBottom: '2rem', padding: '1.5rem', backgroundColor: 'rgba(79, 172, 254, 0.05)', borderRadius: '12px', border: '1px solid rgba(79, 172, 254, 0.15)' }}>
          <h3 style={{ color: '#4facfe', marginBottom: '1rem', fontSize: '1.1rem' }}>Assigned Students</h3>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            {assignments.map((a, i) => (
              <div key={i} style={{ 
                padding: '0.75rem 1.25rem', 
                backgroundColor: 'rgba(255,255,255,0.05)', 
                borderRadius: '8px', 
                border: '1px solid rgba(255,255,255,0.1)',
                fontSize: '0.9rem'
              }}>
                <span style={{ color: '#e2e8f0', fontWeight: '500' }}>{a.studentName}</span>
                <span style={{ 
                  marginLeft: '0.75rem',
                  padding: '0.25rem 0.5rem',
                  borderRadius: '4px',
                  fontSize: '0.75rem',
                  backgroundColor: a.status === 'ACTIVE' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                  color: a.status === 'ACTIVE' ? '#10b981' : '#94a3b8'
                }}>{a.status}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
        <div className="video-wrapper" style={{ flex: '1', minWidth: '300px' }}>
          <video ref={videoRef} autoPlay playsInline muted className="live-video" style={{ width: '100%', borderRadius: '12px' }}></video>
        </div>

        <div style={{ flex: '1', minWidth: '300px', backgroundColor: 'rgba(255,255,255,0.05)', padding: '1.5rem', borderRadius: '12px' }}>
          <h3 style={{ marginBottom: '1rem', color: '#ff4d4d' }}>AI Warnings</h3>
          {warnings.length === 0 ? (
            <p style={{ color: '#94a3b8' }}>No warnings yet.</p>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0, maxHeight: '400px', overflowY: 'auto' }}>
              {warnings.map((w, i) => (
                <li key={i} style={{ marginBottom: '0.5rem', padding: '0.75rem', backgroundColor: 'rgba(255,77,77,0.1)', borderRadius: '8px', borderLeft: '4px solid #ff4d4d', fontSize: '0.9rem' }}>
                  <strong>{w.time}:</strong> {w.msg}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

export default Proctor;
