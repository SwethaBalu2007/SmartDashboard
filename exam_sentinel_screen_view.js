// ================================
// Student Side – Screen Sharing (React Component)
// ================================
import React, { useEffect, useRef, useState } from 'react';
import io from 'socket.io-client';

const socket = io('http://localhost:5000'); // backend server URL

const StudentScreenShare = ({ studentId }) => {
  const [isSharing, setIsSharing] = useState(false);
  const streamRef = useRef(null);

  useEffect(() => {
    socket.on('request-screen-share', ({ targetStudentId }) => {
      if (targetStudentId === studentId) {
        if (window.confirm('Admin wants to view your screen. Allow?')) {
          startScreenShare();
        }
      }
    });
  }, []);

  const startScreenShare = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      streamRef.current = stream;
      setIsSharing(true);

      const videoTrack = stream.getVideoTracks()[0];
      const imageCapture = new ImageCapture(videoTrack);

      const sendFrames = async () => {
        if (!streamRef.current) return;
        const bitmap = await imageCapture.grabFrame();
        const canvas = document.createElement('canvas');
        canvas.width = bitmap.width;
        canvas.height = bitmap.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(bitmap, 0, 0);
        canvas.toBlob((blob) => {
          socket.emit('screen-frame', {
            studentId,
            blob,
          });
        }, 'image/jpeg');
      };

      setInterval(sendFrames, 1000); // Send every second
    } catch (err) {
      alert('Screen sharing failed: ' + err.message);
    }
  };

  return (
    <div>
      {isSharing ? <p>Screen sharing is active</p> : <p>Waiting for admin to request screen...</p>}
    </div>
  );
};

export default StudentScreenShare;


// ================================
// Admin Side – Screen Viewer (React Component)
// ================================
import React, { useEffect, useRef, useState } from 'react';
import io from 'socket.io-client';

const socket = io('http://localhost:5000');

const AdminViewScreen = ({ selectedStudentId }) => {
  const canvasRef = useRef(null);
  const [image, setImage] = useState(null);

  useEffect(() => {
    socket.emit('initiate-screen-request', { targetStudentId: selectedStudentId });

    socket.on('receive-screen-frame', ({ blob }) => {
      const img = new Image();
      img.src = URL.createObjectURL(blob);
      img.onload = () => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      };
    });
  }, [selectedStudentId]);

  return (
    <div>
      <h2>Live Screen - {selectedStudentId}</h2>
      <canvas ref={canvasRef} width={1024} height={768} style={{ border: '1px solid #ccc' }} />
    </div>
  );
};

export default AdminViewScreen;


// ================================
// Backend – Socket.IO Handlers (Express)
// ================================
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');