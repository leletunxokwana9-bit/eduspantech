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

    // ===== LOGGING =====
    console.log(`✅ ChatWidget [${widgetId.current}] loaded with API:`, API_URL);

    // ===== SCROLL TO BOTTOM =====
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // ===== PLAY BEEP SOUND (Same as Wix version) =====
    const playBeepSound = () => {
        try {
            console.log('🔊 Playing beep sound...');
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            const ctx = new AudioContext();
            const now = ctx.currentTime;

            // Create two tones like Wix version
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

            // First tone: 880Hz (higher note)
            tone(880, 0, 0.09);
            // Second tone: 1175Hz (slightly higher - friendly "ping-ping")
            tone(1175, 0.11, 0.12);

            console.log('🔊 Beep sound played successfully');
        } catch (e) {
            // Autoplay blocked or Web Audio unsupported - fail silently
            console.log('🔇 Beep sound skipped (autoplay blocked or unsupported)');
        }
    };

    // ===== AUTO-OPEN ON FIRST VISIT =====
    useEffect(() => {
        console.log(`🔍 ChatWidget [${widgetId.current}] auto-open check:`, { hasOpened, consentGiven });
        
        if (!hasOpened && isVisible) {
            console.log(`⏳ ChatWidget [${widgetId.current}] auto-open timer started`);
            const timer = setTimeout(() => {
                console.log(`🚀 ChatWidget [${widgetId.current}] auto-opening chat`);
                
                // Play beep sound before opening
                playBeepSound();
                
                setIsOpen(true);
                setIsMinimized(false);
                setHasOpened(true);
                sessionStorage.setItem('eduspantech_chat_opened', 'true');
                setMessages([
                    { text: WELCOME_MESSAGE, sender: 'bot' }
                ]);
            }, 1500);
            return () => clearTimeout(timer);
        }
    }, [hasOpened, WELCOME_MESSAGE, consentGiven, isVisible]);

    // ===== MINIMIZE CHAT =====
    const handleMinimize = () => {
        console.log(`📉 ChatWidget [${widgetId.current}] minimized`);
        setIsOpen(false);
        setIsMinimized(true);
    };

    // ===== CLOSE CHAT =====
    const handleClose = () => {
        console.log(`❌ ChatWidget [${widgetId.current}] closed permanently`);
        setIsOpen(false);
        setIsMinimized(false);
        setIsVisible(false);
        sessionStorage.setItem('eduspantech_chat_closed', 'true');
    };

    // ===== OPEN CHAT =====
    const handleOpen = () => {
        if (!isVisible) return;
        console.log(`📤 ChatWidget [${widgetId.current}] opened`);
        setIsOpen(true);
        setIsMinimized(false);
    };

    // ===== SEND MESSAGE =====
    const sendMessage = async (text) => {
        if (!text || !text.trim()) {
            console.warn(`⚠️ ChatWidget [${widgetId.current}] empty message, ignoring`);
            return;
        }

        console.log(`📤 ChatWidget [${widgetId.current}] sending message:`, text);
        console.log(`📡 ChatWidget [${widgetId.current}] API URL:`, API_URL);

        setMessages(prev => [...prev, { text: text, sender: 'user' }]);
        setInput('');
        setIsLoading(true);

        try {
            const requestBody = {
                message: text,
                page: window.location.pathname || '/'
            };
            console.log(`📦 ChatWidget [${widgetId.current}] request body:`, requestBody);

            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                body: JSON.stringify(requestBody)
            });

            console.log(`📨 ChatWidget [${widgetId.current}] response status:`, response.status);

            if (!response.ok) {
                const errorText = await response.text();
                console.error(`❌ ChatWidget [${widgetId.current}] response error:`, errorText);
                setMessages(prev => [...prev, {
                    text: `Error: Server returned ${response.status}. Please try again.`,
                    sender: 'bot'
                }]);
                setIsLoading(false);
                return;
            }

            const data = await response.json();
            console.log(`✅ ChatWidget [${widgetId.current}] response data:`, data);

            let reply = "I'm not sure how to respond to that. Could you try rephrasing?";
            let navigationAction = null;

            if (data && typeof data === 'object') {
                if (data.reply && typeof data.reply === 'string') {
                    reply = data.reply;
                } else if (data.message && typeof data.message === 'string') {
                    reply = data.message;
                } else if (data.text && typeof data.text === 'string') {
                    reply = data.text;
                } else if (data.response && typeof data.response === 'string') {
                    reply = data.response;
                } else if (data.content && typeof data.content === 'string') {
                    reply = data.content;
                } else if (data.error && typeof data.error === 'string') {
                    reply = "Error: " + data.error;
                } else {
                    console.warn('⚠️ No reply field found in response:', data);
                    reply = "I received a response but couldn't understand it. Please try again.";
                }

                if (data.navigationAction) {
                    navigationAction = data.navigationAction;
                }
            }

            console.log(`✅ ChatWidget [${widgetId.current}] extracted reply:`, reply);

            setMessages(prev => [...prev, { text: reply, sender: 'bot' }]);

            if (navigationAction) {
                const action = navigationAction;
                const confirmMsg = `Would you like to go to ${action.label}?`;
                if (window.confirm(confirmMsg)) {
                    const url = action.url.startsWith('http') ? action.url : SITE_URL + action.url;
                    window.location.href = url;
                }
            }

        } catch (error) {
            console.error(`❌ ChatWidget [${widgetId.current}] error:`, error);
            setMessages(prev => [...prev, {
                text: "⚠️ Connection error. Please check your internet and try again.",
                sender: 'bot'
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    // ===== CONSENT HANDLER =====
    const handleConsent = () => {
        console.log(`✅ ChatWidget [${widgetId.current}] consent given`);
        setConsentGiven(true);
        sessionStorage.setItem('eduspantech_consent', 'true');
    };

    // ===== RENDER =====
    if (!isVisible) {
        return null;
    }

    return (
        <>
            {/* Chat Bubble */}
            {!isOpen && (
                <button
                    className="chat-bubble"
                    onClick={handleOpen}
                    aria-label="Open AI Assistant"
                >
                    💬
                    <span className="bubble-dot"></span>
                </button>
            )}

            {/* Chat Panel */}
            {isOpen && (
                <div className="chat-panel">
                    {/* Header */}
                    <div className="chat-header">
                        <div className="chat-header-left">
                            <div className="chat-avatar">E</div>
                            <div className="chat-header-info">
                                <h3>EduSpanTech Assistant</h3>
                                <span>Online • AI Powered</span>
                            </div>
                        </div>
                        <div className="chat-header-actions">
                            <button
                                className="chat-minimize"
                                onClick={handleMinimize}
                                aria-label="Minimize chat"
                                title="Minimize"
                            >
                                −
                            </button>
                            <button
                                className="chat-close"
                                onClick={handleClose}
                                aria-label="Close chat permanently"
                                title="Close"
                            >
                                ✕
                            </button>
                        </div>
                    </div>

                    {/* Consent */}
                    {!consentGiven && (
                        <div className="chat-consent">
                            <p>🤖 I'm an AI assistant. This chat may use AI to respond.</p>
                            <button onClick={handleConsent}>Got it</button>
                        </div>
                    )}

                    {/* Messages */}
                    <div className="chat-messages">
                        {messages.length === 0 && (
                            <div className="message bot" style={{ opacity: 0.6 }}>
                                Click the button below to start chatting! 👋
                            </div>
                        )}
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

                    {/* Quick Actions */}
                    {messages.length > 0 && (
                        <div className="quick-actions">
                            <button onClick={() => sendMessage("What can you help me with?")}>
                                ❓ Help
                            </button>
                            <button onClick={() => sendMessage("Show me courses")}>
                                📚 Courses
                            </button>
                            <button onClick={() => sendMessage("I want to assess my skills")}>
                                📝 Assessment
                            </button>
                            <button onClick={() => sendMessage("Tell me about the community")}>
                                👥 Community
                            </button>
                            <button onClick={() => sendMessage("Show me pricing plans")}>
                                💰 Pricing
                            </button>
                        </div>
                    )}

                    {/* Input */}
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
                        <button onClick={() => sendMessage(input)}>
                            Send
                        </button>
                    </div>
                </div>
            )}
        </>
    );
};

export default ChatWidget;