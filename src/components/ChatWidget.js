// src/components/ChatWidget.js
import React, { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom'; // ✅ Added to detect session route
import { API_BASE_URL } from '../services/api';
import './ChatWidget.css';

const ChatWidget = () => {
    // ===== CONFIG =====
    const API_URL = `${API_BASE_URL}/chat`;
    const SITE_URL = 'https://www.eduspantech.com';
    const WELCOME_MESSAGE = "Hi! 👋 I'm your EduSpanTech Guide. How can I help you today?";

    // ===== STATE =====
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isFirstMessage, setIsFirstMessage] = useState(true);
    const [sessionId, setSessionId] = useState(null);
    const [isTyping, setIsTyping] = useState(false);
    const [consentGiven, setConsentGiven] = useState(false);
    const [chatId] = useState(() => `chat-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);
    
    // ✅ NEW: State for the outside greeting bubble
    const [showGreeting, setShowGreeting] = useState(false);

    // ===== REFS =====
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);
    const location = useLocation(); // ✅ Hook to check current URL

    // ============================================
    // NAVIGATION CONFIG
    // ============================================
    const navConfig = {
        courses: {
            keywords: ['courses', 'programs', 'learning', 'study', 'certification', 'training', 'classes', 'learn', 'education', 'subjects'],
            url: '/subjects',
            label: 'Browse Subjects',
            message: "I can help you explore our courses and programs! Let me take you to our course catalog where you can find the perfect learning path for your goals."
        },
        tutors: {
            keywords: ['tutor', 'tutors', 'book session', 'tutoring', 'mentor', 'one-on-one', 'consultation', 'schedule', 'meet with', 'mentorship'],
            url: '/tutors',
            label: 'Book a Session',
            message: "I can help you book a session with one of our expert mentors! Let me take you to the booking page where you can schedule a time that works for you."
        },
        pricing: {
            keywords: ['pricing', 'plans', 'cost', 'price', 'subscription', 'pay', 'payment', 'monthly', 'annual', 'silver', 'gold', 'platinum'],
            url: '/pricing',
            label: 'View Plans',
            message: "Let me take you to our pricing page where you can see all our plans and choose the one that fits your learning needs!"
        },
        help: {
            keywords: ['help', 'support', 'faq', 'questions', 'contact', 'assistance', 'troubleshoot', 'issue', 'problem'],
            url: '/help',
            label: 'Help & Support',
            message: "I'll take you to our help center where you can find answers to common questions and get the support you need."
        },
        dashboard: {
            keywords: ['dashboard', 'my courses', 'my sessions', 'progress', 'my learning', 'account'],
            url: '/dashboard',
            label: 'Dashboard',
            message: "Let me take you to your dashboard where you can see your courses, sessions, and learning progress!"
        },
        resources: {
            keywords: ['resources', 'materials', 'study guides', 'templates', 'tools', 'learning materials', 'downloads', 'guides', 'e-books'],
            url: '/resources',
            label: 'Learning Resources',
            message: "Explore our extensive collection of learning resources, study guides, and tools! Let me take you to the resources page."
        }
    };

    // ============================================
    // HELPERS
    // ============================================
    const scrollToBottom = () => {
        setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
        }, 100);
    };

    const formatTime = () => {
        return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const generateUUID = () => {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : ((r & 0x3) | 0x8);
            return v.toString(16);
        });
    };

    // ============================================
    // DETECT NAVIGATION
    // ============================================
    const detectNavigation = (text) => {
        const lowerText = text.toLowerCase();
        for (const [key, config] of Object.entries(navConfig)) {
            for (const keyword of config.keywords) {
                if (lowerText.includes(keyword)) {
                    return { key, ...config };
                }
            }
        }
        return null;
    };

    // ============================================
    // HANDLE CONSENT
    // ============================================
    const handleConsent = () => {
        setConsentGiven(true);
        localStorage.setItem('chat_consent', 'true');
    };

    // ============================================
    // HANDLE QUICK ACTION
    // ============================================
    const handleQuickAction = (action) => {
        const config = navConfig[action];
        if (config) {
            const message = {
                id: Date.now(),
                text: config.message,
                sender: 'bot',
                time: formatTime(),
                navigation: {
                    url: config.url,
                    label: config.label
                }
            };
            setMessages(prev => [...prev, message]);
            scrollToBottom();
        }
    };

    // ============================================
    // SEND MESSAGE
    // ============================================
    const sendMessage = async (messageText) => {
        if (!messageText.trim() || !consentGiven) return;

        const userMessage = {
            id: Date.now(),
            text: messageText,
            sender: 'user',
            time: formatTime()
        };

        setMessages(prev => [...prev, userMessage]);
        setInputValue('');
        setIsFirstMessage(false);
        scrollToBottom();

        // Check for navigation intent
        const navIntent = detectNavigation(messageText);
        if (navIntent) {
            setIsLoading(true);
            setIsTyping(true);

            setTimeout(() => {
                const responseMessage = {
                    id: Date.now() + 1,
                    text: navIntent.message,
                    sender: 'bot',
                    time: formatTime(),
                    navigation: {
                        url: navIntent.url,
                        label: navIntent.label,
                        key: navIntent.key
                    }
                };
                setMessages(prev => [...prev, responseMessage]);
                setIsLoading(false);
                setIsTyping(false);
                scrollToBottom();
            }, 800);
            return;
        }

        // Regular chat - call API
        setIsLoading(true);
        setIsTyping(true);

        try {
            const token = localStorage.getItem('accessToken');
            const headers = {
                'Content-Type': 'application/json'
            };
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            const requestBody = {
                message: messageText,
                siteUrl: SITE_URL,
                sessionId: sessionId || generateUUID()
            };

            if (!sessionId) {
                setSessionId(requestBody.sessionId);
            }

            const response = await fetch(API_URL, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                throw new Error('Failed to get response');
            }

            const data = await response.json();

            const botMessage = {
                id: Date.now() + 1,
                text: data.response || data.message || "I'm sorry, I didn't understand that. Could you please rephrase?",
                sender: 'bot',
                time: formatTime(),
                navigation: data.navigation || null
            };

            setMessages(prev => [...prev, botMessage]);

        } catch (error) {
            console.error('Chat error:', error);
            const errorMessage = {
                id: Date.now() + 1,
                text: "I'm having trouble connecting right now. Please try again in a moment.",
                sender: 'bot',
                time: formatTime(),
                isError: true
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
            setIsTyping(false);
            scrollToBottom();
        }
    };

    // ============================================
    // HANDLE NAVIGATION
    // ============================================
    const handleNavigate = (url) => {
        window.location.href = url;
    };

    // ============================================
    // TOGGLE CHAT
    // ============================================
    const toggleChat = () => {
        setIsOpen(!isOpen);
        setShowGreeting(false); // ✅ Hide greeting when opening chat
        if (!isOpen) {
            setTimeout(() => {
                inputRef.current?.focus();
                scrollToBottom();
            }, 300);
        }
    };

    // ============================================
    // CLOSE CHAT
    // ============================================
    const closeChat = () => {
        setIsOpen(false);
    };

    // ============================================
    // KEYBOARD SHORTCUT & GREETING TIMER
    // ============================================
    useEffect(() => {
        const handleKeyDown = (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                toggleChat();
            }
            if (e.key === 'Escape' && isOpen) {
                setIsOpen(false);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        
        // ✅ Show greeting bubble after 3 seconds, hide after 5 seconds
        const showTimer = setTimeout(() => {
            if (!isOpen) setShowGreeting(true);
        }, 3000);

        const hideTimer = setTimeout(() => {
            setShowGreeting(false);
        }, 8000); // 3s to show + 5s visible = 8s total

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            clearTimeout(showTimer);
            clearTimeout(hideTimer);
        };
    }, [isOpen]);

    // ============================================
    // INITIALIZE
    // ============================================
    useEffect(() => {
        if (!sessionId) {
            setSessionId(generateUUID());
        }

        // Check for saved consent
        const savedConsent = localStorage.getItem('chat_consent');
        if (savedConsent === 'true') {
            setConsentGiven(true);
        }

        // Add welcome message
        const welcomeMessage = {
            id: Date.now(),
            text: WELCOME_MESSAGE,
            sender: 'bot',
            time: formatTime()
        };
        setMessages([welcomeMessage]);

        // Log widget load
        console.log(`✅ ChatWidget [${chatId}] loaded`);
    }, []);

    // ✅ HIDE WIDGET IF IN TUTOR SESSION
    const isTutorSession = location.pathname.includes('/session/');

    if (isTutorSession) {
        return null; // Do not render the widget at all
    }

    // ============================================
    // RENDER
    // ============================================
    return (
        <div className="chat-widget-container">
            {/* ✅ NEW: Outside Greeting Bubble */}
            {showGreeting && !isOpen && (
                <div className="chat-greeting-bubble" onClick={toggleChat}>
                    <p>Hi there! 👋 Need help navigating the site or finding a tutor?</p>
                    <button 
                        className="chat-greeting-close" 
                        onClick={(e) => { e.stopPropagation(); setShowGreeting(false); }}
                        aria-label="Dismiss greeting"
                    >
                        ✕
                    </button>
                </div>
            )}

            {/* Chat Bubble - Floating Button */}
            <button
                className="chat-bubble"
                onClick={toggleChat}
                aria-label="Toggle chat"
            >
                {isOpen ? '✕' : '💬'}
                <span className="bubble-dot"></span>
            </button>

            {/* Chat Panel */}
            {isOpen && (
                <div className="chat-panel">
                    {/* Header */}
                    <div className="chat-header">
                        <div className="chat-header-left">
                            <div className="chat-avatar">🤖</div>
                            <div className="chat-header-info">
                                <h3>EduSpanTech Assistant</h3>
                                <span>Online</span>
                            </div>
                        </div>
                        <div className="chat-header-actions">
                            <button
                                className="chat-minimize"
                                onClick={toggleChat}
                                aria-label="Minimize"
                                title="Minimize"
                            >
                                ─
                            </button>
                            <button
                                className="chat-close"
                                onClick={closeChat}
                                aria-label="Close chat"
                                title="Close chat"
                            >
                                ✕
                            </button>
                        </div>
                    </div>

                    {/* Consent */}
                    <div className={`chat-consent ${consentGiven ? 'hidden' : ''}`}>
                        <p>By using this chat, you agree to our Terms of Service.</p>
                        <button onClick={handleConsent}>Accept</button>
                    </div>

                    {/* Messages */}
                    <div className="chat-messages" ref={messagesEndRef}>
                        {messages.map((msg, index) => (
                            <div key={index} className={`message ${msg.sender}`}>
                                {msg.text}
                                {msg.navigation && (
                                    <button
                                        className="chat-nav-btn"
                                        onClick={() => handleNavigate(msg.navigation.url)}
                                        style={{
                                            display: 'block',
                                            marginTop: '8px',
                                            padding: '6px 16px',
                                            background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '8px',
                                            cursor: 'pointer',
                                            fontSize: '13px',
                                            fontWeight: 500
                                        }}
                                    >
                                        {msg.navigation.label} →
                                    </button>
                                )}
                            </div>
                        ))}
                        {isTyping && (
                            <div className="message bot">
                                <div className="typing-dots">
                                    <span></span>
                                    <span></span>
                                    <span></span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Quick Actions */}
                    <div className={`quick-actions ${!consentGiven ? 'hidden' : ''}`}>
                        <button onClick={() => handleQuickAction('courses')}>📚 Courses</button>
                        <button onClick={() => handleQuickAction('tutors')}>👨‍🏫 Tutors</button>
                        <button onClick={() => handleQuickAction('pricing')}>💰 Pricing</button>
                        <button onClick={() => handleQuickAction('help')}>❓ Help</button>
                    </div>

                    {/* Input */}
                    <div className="chat-input-row">
                        <input
                            ref={inputRef}
                            type="text"
                            placeholder="Ask me anything..."
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    sendMessage(inputValue);
                                }
                            }}
                            disabled={!consentGiven}
                        />
                        <button
                            onClick={() => sendMessage(inputValue)}
                            disabled={!consentGiven || !inputValue.trim()}
                        >
                            Send
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ChatWidget;
