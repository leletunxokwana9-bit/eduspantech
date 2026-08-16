// src/components/ChatWidget.js
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { API_BASE_URL } from '../services/api';
import './ChatWidget.css';

const ChatWidget = () => {
    // ===== CONFIG =====
    const API_URL = `${API_BASE_URL}/chat`;
    const SITE_URL = 'https://www.eduspantech.com';
    const WELCOME_MESSAGE = "Hi! 👋 I'm your EduSpanTech learning assistant. I can help you find courses, assess your skills, or navigate the site. What would you like to explore?";

    // ===== STATE =====
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isFirstMessage, setIsFirstMessage] = useState(true);
    const [sessionId, setSessionId] = useState(null);
    const [isTyping, setIsTyping] = useState(false);
    const [chatId] = useState(() => `chat-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);

    // ===== REFS =====
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);
    const chatContainerRef = useRef(null);

    // ===== NAVIGATION CONFIG =====
    const navConfig = {
        courses: {
            keywords: ['courses', 'programs', 'learning', 'study', 'certification', 'training', 'classes', 'learn', 'education', 'subjects'],
            url: '/courses',
            label: 'Courses & Programs',
            message: "I can help you explore our courses and programs! Let me take you to our course catalog where you can find the perfect learning path for your goals."
        },
        assessment: {
            keywords: ['assessment', 'skill assessment', 'evaluate', 'test', 'quiz', 'knowledge check', 'evaluate my skills', 'skill test', 'self-assessment'],
            url: '/assessment',
            label: 'Skill Assessment',
            message: "Ready to assess your skills? Let me take you to our skill assessment where you can evaluate your current knowledge and identify areas for growth."
        },
        booking: {
            keywords: ['book session', 'tutoring', 'mentor', 'one-on-one', 'consultation', 'schedule', 'book a session', 'meet with', 'tutor', 'mentorship'],
            url: '/tutors',
            label: 'Book a Session',
            message: "I can help you book a session with one of our expert mentors! Let me take you to the booking page where you can schedule a time that works for you."
        },
        resources: {
            keywords: ['resources', 'materials', 'study guides', 'templates', 'tools', 'learning materials', 'downloads', 'guides', 'e-books'],
            url: '/resources',
            label: 'Learning Resources',
            message: "Explore our extensive collection of learning resources, study guides, and tools! Let me take you to the resources page."
        },
        community: {
            keywords: ['community', 'forum', 'discussion', 'network', 'peers', 'collaborate', 'study group', 'connect', 'students', 'discuss'],
            url: '/community',
            label: 'Community Hub',
            message: "Join our vibrant learning community! Let me take you to the Community Hub where you can connect with peers, discuss ideas, and collaborate."
        },
        faq: {
            keywords: ['faq', 'questions', 'help', 'support', 'answers', 'frequently asked', 'how to', 'assistance', 'troubleshoot'],
            url: '/faq',
            label: 'FAQ & Support',
            message: "I can take you to our FAQ section where you'll find answers to common questions about our programs and services."
        },
        blog: {
            keywords: ['blog', 'articles', 'insights', 'tips', 'learning tips', 'edtech', 'education news', 'updates', 'trends'],
            url: '/blog',
            label: 'Blog & Insights',
            message: "Check out our blog for educational insights, learning tips, and the latest in education technology!"
        },
        contact: {
            keywords: ['contact', 'reach out', 'email', 'call', 'phone', 'support', 'help desk', 'talk to someone', 'message', 'get in touch'],
            url: '/contact',
            label: 'Contact Us',
            message: "I'll take you to our contact page where you can reach out to our team for personalized support."
        }
    };

    // ===== HELPERS =====
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

    // ===== NAVIGATION DETECTION =====
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

    // ===== SEND MESSAGE =====
    const sendMessage = async (messageText) => {
        if (!messageText.trim()) return;

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

    // ===== HANDLE NAVIGATION CLICK =====
    const handleNavigate = (url) => {
        window.location.href = url;
    };

    // ===== TOGGLE CHAT =====
    const toggleChat = () => {
        setIsOpen(!isOpen);
        if (!isOpen) {
            setTimeout(() => {
                inputRef.current?.focus();
                scrollToBottom();
            }, 300);
        }
    };

    // ===== KEYBOARD SHORTCUT =====
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
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen]);

    // ===== INITIALIZE =====
    useEffect(() => {
        if (!sessionId) {
            setSessionId(generateUUID());
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

    // ===== RENDER =====
    return (
        <div className="chat-widget-container">
            {/* Chat Toggle Button */}
            <button
                className="chat-toggle-btn"
                onClick={toggleChat}
                aria-label="Toggle chat"
            >
                {isOpen ? (
                    <span className="chat-close-icon">✕</span>
                ) : (
                    <span className="chat-open-icon">💬</span>
                )}
                <span className="chat-toggle-label">
                    {isOpen ? 'Close' : 'Chat'}
                </span>
            </button>

            {/* Chat Window */}
            {isOpen && (
                <div className="chat-window" ref={chatContainerRef}>
                    {/* Header */}
                    <div className="chat-header">
                        <div className="chat-header-info">
                            <span className="chat-avatar">🤖</span>
                            <div>
                                <span className="chat-title">EduSpanTech Assistant</span>
                                <span className="chat-status">Online</span>
                            </div>
                        </div>
                        <div className="chat-header-actions">
                            <button
                                className="chat-minimize-btn"
                                onClick={() => setIsOpen(false)}
                                aria-label="Minimize"
                            >
                                ─
                            </button>
                        </div>
                    </div>

                    {/* Messages */}
                    <div className="chat-messages" ref={messagesEndRef}>
                        {messages.map((msg, index) => (
                            <div key={msg.id || index} className={`chat-message ${msg.sender}`}>
                                <div className="chat-message-content">
                                    <div className="chat-message-bubble">
                                        <p>{msg.text}</p>
                                        {msg.navigation && (
                                            <button
                                                className="chat-nav-btn"
                                                onClick={() => handleNavigate(msg.navigation.url)}
                                            >
                                                {msg.navigation.label} →
                                            </button>
                                        )}
                                        {msg.isError && (
                                            <span className="chat-error-indicator">⚠️</span>
                                        )}
                                    </div>
                                    <span className="chat-message-time">{msg.time}</span>
                                </div>
                            </div>
                        ))}
                        {isTyping && (
                            <div className="chat-message bot typing">
                                <div className="chat-message-content">
                                    <div className="chat-message-bubble typing-indicator">
                                        <span>●</span>
                                        <span>●</span>
                                        <span>●</span>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input */}
                    <div className="chat-input-area">
                        <div className="chat-input-wrapper">
                            <input
                                ref={inputRef}
                                type="text"
                                className="chat-input"
                                placeholder="Ask me anything..."
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        sendMessage(inputValue);
                                    }
                                }}
                                disabled={isLoading}
                            />
                            <button
                                className="chat-send-btn"
                                onClick={() => sendMessage(inputValue)}
                                disabled={isLoading || !inputValue.trim()}
                            >
                                {isLoading ? '⏳' : '➤'}
                            </button>
                        </div>
                        <div className="chat-footer">
                            <span className="chat-footer-text">
                                Press <kbd>Ctrl + K</kbd> to toggle
                            </span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ChatWidget;