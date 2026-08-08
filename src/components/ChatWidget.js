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

    // ===== AUTO-OPEN ON FIRST VISIT =====
    useEffect(() => {
        console.log(`🔍 ChatWidget [${widgetId.current}] auto-open check:`, { hasOpened, consentGiven });
        
        if (!hasOpened) {
            console.log(`⏳ ChatWidget [${widgetId.current}] auto-open timer started`);
            const timer = setTimeout(() => {
                console.log(`🚀 ChatWidget [${widgetId.current}] auto-opening chat`);
                setIsOpen(true);
                setHasOpened(true);
                sessionStorage.setItem('eduspantech_chat_opened', 'true');
                setMessages([
                    { text: WELCOME_MESSAGE, sender: 'bot' }
                ]);
            }, 1500);
            return () => clearTimeout(timer);
        }
    }, [hasOpened, WELCOME_MESSAGE, consentGiven]);

    // ===== SEND MESSAGE =====
    const sendMessage = async (text) => {
        if (!text || !text.trim()) {
            console.warn(`⚠️ ChatWidget [${widgetId.current}] empty message, ignoring`);
            return;
        }

        console.log(`📤 ChatWidget [${widgetId.current}] sending message:`, text);
        console.log(`📡 ChatWidget [${widgetId.current}] API URL:`, API_URL);

        // Add user message
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
            console.log(`📨 ChatWidget [${widgetId.current}] response headers:`, response.headers);

            if (!response.ok) {
                const errorText = await response.text();
                console.error(`❌ ChatWidget [${widgetId.current}] response error:`, errorText);
                throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
            }

            const data = await response.json();
            console.log(`✅ ChatWidget [${widgetId.current}] response data:`, data);

            // Add bot reply
            const reply = data.reply || "I'm not sure how to respond to that. Could you try rephrasing?";
            setMessages(prev => [...prev, { text: reply, sender: 'bot' }]);

            // Handle navigation
            if (data.navigationAction) {
                const action = data.navigationAction;
                console.log(`🧭 ChatWidget [${widgetId.current}] navigation detected:`, action);
                const confirmMsg = `Would you like to go to ${action.label}?`;
                if (window.confirm(confirmMsg)) {
                    const url = action.url.startsWith('http') ? action.url : SITE_URL + action.url;
                    console.log(`🔗 ChatWidget [${widgetId.current}] navigating to:`, url);
                    window.location.href = url;
                }
            }

        } catch (error) {
            console.error(`❌ ChatWidget [${widgetId.current}] error details:`, {
                message: error.message,
                stack: error.stack,
                url: API_URL,
                name: error.name
            });
            setMessages(prev => [...prev, {
                text: "Oops! Something went wrong. Please try again. If the problem persists, contact support.",
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
    return (
        <>
            {/* Chat Bubble */}
            <button
                className="chat-bubble"
                onClick={() => {
                    console.log(`🔄 ChatWidget [${widgetId.current}] bubble clicked, isOpen:`, !isOpen);
                    setIsOpen(!isOpen);
                }}
                aria-label="Open AI Assistant"
            >
                💬
                <span className="bubble-dot"></span>
            </button>

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
                        <button
                            className="chat-close"
                            onClick={() => {
                                console.log(`❌ ChatWidget [${widgetId.current}] chat closed`);
                                setIsOpen(false);
                            }}
                        >
                            ✕
                        </button>
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