/**
 * NEXA EXAM Real-Time Communication Layer
 * Uses BroadcastChannel API for multi-tab synchronization
 */

const REALTIME = {
    channel: new BroadcastChannel('nexa_exam_monitor'),
    
    // Event Types
    EVENTS: {
        EXAM_STARTED: 'EXAM_STARTED',
        EXAM_COMPLETED: 'EXAM_COMPLETED',
        ALERT_TAB_SWITCH: 'ALERT_TAB_SWITCH',
        ALERT_CAMERA_OFF: 'ALERT_CAMERA_OFF',
        ALERT_KEY_RESTRICTED: 'ALERT_KEY_RESTRICTED',
        ALERT_COPY_PASTE: 'ALERT_COPY_PASTE',
        ALERT_RIGHT_CLICK: 'ALERT_RIGHT_CLICK',
        ALERT_FACE_NOT_DETECTED: 'ALERT_FACE_NOT_DETECTED',
        ALERT_VIOLATION_LIMIT: 'ALERT_VIOLATION_LIMIT',
        ALERT_EXAM_TERMINATED: 'ALERT_EXAM_TERMINATED',
        COMMAND_KICK_STUDENT: 'COMMAND_KICK_STUDENT',
        HEARTBEAT: 'HEARTBEAT'
    },

    /**
     * Broadcast an event to all tabs
     * @param {string} type - Event type from REALTIME.EVENTS
     * @param {object} data - Payload data
     */
    broadcast(type, data) {
        const payload = {
            type,
            data,
            timestamp: new Date().toISOString(),
            sessionId: sessionStorage.getItem('eg_userId') || 'anonymous'
        };
        console.log('[REALTIME] Broadcasting:', payload);
        this.channel.postMessage(payload);
    },

    /**
     * Listen for events from other tabs
     * @param {function} callback - Function to handle incoming events
     */
    on(callback) {
        this.channel.onmessage = (event) => {
            console.log('[REALTIME] Received:', event.data);
            callback(event.data);
        };
    }
};

// Auto-broadcast heartbeat if logged in as student
if (sessionStorage.getItem('eg_role') === 'student') {
    setInterval(() => {
        REALTIME.broadcast(REALTIME.EVENTS.HEARTBEAT, {
            fullName: sessionStorage.getItem('eg_fullName'),
            email: sessionStorage.getItem('eg_email'),
            userId: sessionStorage.getItem('eg_userId')
        });
    }, 5000);
}
