// src/components/ChatWidget.js
import React, { useState, useEffect, useRef } from 'react';
import './ChatWidget.css';

const ChatWidget = () => {
    // ===== CONFIG =====
    const API_URL = 'https://eduspantech-backend.onrender.com/api/v1/chat';
    const SITE_URL = 'https://www.eduspantech.com';
    const WELCOME_MESSAGE = "Hi! 👋 I'm your EduSpanTech learning assistant. I can help you find courses, assess your skills, or navigate the site. What would you like to explore?";

    // ===== STATE =====
    const [isOpen, setIsOpen] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const [isVisible, setIsVisible] = useState(true);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [consentGiven, setConsentGiven] = useState(
        sessionStorage.getItem('eduspantech_consent') === 'true'
    );
    const [hasOpened, setHasOpened] = useState(
        sessionStorage.getItem('eduspantech_chat_opened') === 'true'
    );
    const messagesEndRef = useRef(null);
    const widgetId = useRef(Math.random().toString(36).substr(2, 9));

    console.log(`✅ ChatWidget [${widgetId.current}] loaded`);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // ===== PLAY BEEP =====
    const playBeepSound = () => {
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            const ctx = new AudioContext();
            const now = ctx.currentTime;

            function tone(freq, start, duration) {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'sine';
                osc.frequency.value = freq;
                gain.gain.setValueAtTime(0, now + start);
                gain.gain.linearRampToValueAtTime(0.12, now + start + 0.02);
                gain.gain.linearRampToValueAtTime(0, now + start + duration);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(now + start);
                osc.stop(now + start + duration + 0.02);
            }

            tone(880, 0, 0.09);
            tone(1175, 0.11, 0.12);
        } catch (e) {
            // Silent fail
        }
    };

    // ===== AUTO-OPEN =====
    useEffect(() => {
        if (!hasOpened && isVisible) {
            const timer = setTimeout(() => {
                playBeepSound();
                setIsOpen(true);
                setIsMinimized(false);
                setHasOpened(true);
                sessionStorage.setItem('eduspantech_chat_opened', 'true');
                setMessages([{ text: WELCOME_MESSAGE, sender: 'bot' }]);
            }, 1500);
            return () => clearTimeout(timer);
        }
    }, [hasOpened, isVisible]);

    // ===== HANDLERS =====
    const handleMinimize = () => {
        setIsOpen(false);
        setIsMinimized(true);
    };

    const handleClose = () => {
        setIsOpen(false);
        setIsMinimized(false);
        setIsVisible(false);
        sessionStorage.setItem('eduspantech_chat_closed', 'true');
    };

    const handleOpen = () => {
        if (!isVisible) return;
        setIsOpen(true);
        setIsMinimized(false);
    };

    // ===== SEND MESSAGE =====
    const sendMessage = async (text) => {
        if (!text || !text.trim()) return;

        setMessages(prev => [...prev, { text: text, sender: 'user' }]);
        setInput('');
        setIsLoading(true);

        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: text,
                    page: window.location.pathname || '/'
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const data = await response.json();
            console.log('📨 Response:', data);

            // ===== GET REPLY FROM RESPONSE =====
            let reply = "I'm not sure how to respond. Please try again.";
            let navigationAction = null;

            if (data && typeof data === 'object') {
                if (data.reply && typeof data.reply === 'string' && data.reply.trim()) {
                    reply = data.reply;
                } else if (data.message && typeof data.message === 'string' && data.message.trim()) {
                    reply = data.message;
                } else if (data.text && typeof data.text === 'string' && data.text.trim()) {
                    reply = data.text;
                } else if (data.response && typeof data.response === 'string' && data.response.trim()) {
                    reply = data.response;
                } else if (data.content && typeof data.content === 'string' && data.content.trim()) {
                    reply = data.content;
                } else if (data.error && typeof data.error === 'string') {
                    reply = "Error: " + data.error;
                } else {
                    console.warn('⚠️ No reply field found, raw response:', data);
                    reply = "I received a response but couldn't understand it. Please try again.";
                }

                if (data.navigationAction) {
                    navigationAction = data.navigationAction;
                }
            }

            console.log('✅ Final reply:', reply);
            setMessages(prev => [...prev, { text: reply, sender: 'bot' }]);

            if (navigationAction) {
                const action = navigationAction;
                if (window.confirm(`Would you like to go to ${action.label}?`)) {
                    const url = action.url.startsWith('http') ? action.url : SITE_URL + action.url;
                    window.location.href = url;
                }
            }

        } catch (error) {
            console.error('❌ Chat error:', error);
            setMessages(prev => [...prev, {
                text: `⚠️ Connection error. Please try again. (${error.message})`,
                sender: 'bot'
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleConsent = () => {
        setConsentGiven(true);
        sessionStorage.setItem('eduspantech_consent', 'true');
    };

    // ===== RENDER =====
    if (!isVisible) return null;

    return (
        <>
            {!isOpen && (
                <button className="chat-bubble" onClick={handleOpen}>
                    💬
                    <span className="bubble-dot"></span>
                </button>
            )}

            {isOpen && (
                <div className="chat-panel">
                    <div className="chat-header">
                        <div className="chat-header-left">
                            <div className="chat-avatar">E</div>
                            <div className="chat-header-info">
                                <h3>EduSpanTech Assistant</h3>
                                <span>Online • AI Powered</span>
                            </div>
                        </div>
                        <div className="chat-header-actions">
                            <button className="chat-minimize" onClick={handleMinimize}>−</button>
                            <button className="chat-close" onClick={handleClose}>✕</button>
                        </div>
                    </div>

                    {!consentGiven && (
                        <div className="chat-consent">
                            <p>🤖 I'm an AI assistant. This chat may use AI to respond.</p>
                            <button onClick={handleConsent}>Got it</button>
                        </div>
                    )}

                    <div className="chat-messages">
                        {messages.map((msg, idx) => (
                            <div key={idx} className={`message ${msg.sender}`}>
                                {msg.text}
                            </div>
                        ))}
                        {isLoading && (
                            <div className="message bot">
                                <div className="typing-dots">
                                    <span></span><span></span><span></span>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {messages.length > 0 && (
                        <div className="quick-actions">
                            <button onClick={() => sendMessage("What can you help me with?")}>❓ Help</button>
                            <button onClick={() => sendMessage("Show me courses")}>📚 Courses</button>
                            <button onClick={() => sendMessage("I want to assess my skills")}>📝 Assessment</button>
                            <button onClick={() => sendMessage("Tell me about the community")}>👥 Community</button>
                            <button onClick={() => sendMessage("Show me pricing plans")}>💰 Pricing</button>
                        </div>
                    )}

                    <div className="chat-input-row">
                        <input
                            type="text"
                            placeholder="Ask me anything..."
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault();
                                    sendMessage(input);
                                }
                            }}
                        />
                        <button onClick={() => sendMessage(input)}>Send</button>
                    </div>
                </div>
            )}
        </>
    );
};

export default ChatWidget;