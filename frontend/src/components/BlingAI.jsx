import React, { useState, useRef, useEffect } from 'react';
import { aiAPI } from '../utils/api';
import { useAuth } from '../context/auth-context';
import './BlingAI.css';

const BlingAI = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { role: 'model', parts: [{ text: "Hey dev! I'm Bling AI. I can help you with your profile audit, debugging, or just chatting about the platform. What's up?" }] }
    ]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [auditResult, setAuditResult] = useState(null);
    const messagesEndRef = useRef(null);
    const { user } = useAuth();

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isTyping]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!input.trim() || isTyping) return;

        const userMessage = input.trim();
        setInput('');
        setMessages(prev => [...prev, { role: 'user', parts: [{ text: userMessage }] }]);
        setIsTyping(true);

        try {
            // Check for special commands
            if (userMessage.toLowerCase().includes('verify') || userMessage.toLowerCase().includes('audit')) {
                const response = await aiAPI.chat(`The user wants to know about verification. Here is their profile audit: ${JSON.stringify(auditResult)}. If auditResult is null, tell them I am starting an audit now.`);

                // Trigger audit if not done
                if (!auditResult) {
                    const audit = await aiAPI.auditVerification();
                    setAuditResult(audit.data);
                }

                setMessages(prev => [...prev, { role: 'model', parts: [{ text: response.data.reply }] }]);
            } else {
                // Regular chat
                const history = messages.map(msg => ({
                    role: msg.role,
                    parts: msg.parts
                }));
                const response = await aiAPI.chat(userMessage, history);
                setMessages(prev => [...prev, { role: 'model', parts: [{ text: response.data.reply }] }]);
            }
        } catch (error) {
            const errorMsg = error.response?.data?.error || error.message || "Bling AI is having some trouble. Check the console.";
            setMessages(prev => [...prev, { role: 'model', parts: [{ text: `Error: ${errorMsg}` }] }]);
        } finally {
            setIsTyping(false);
        }
    };

    const runAudit = async () => {
        setIsTyping(true);
        setMessages(prev => [...prev, { role: 'user', parts: [{ text: "Audit my profile for verification." }] }]);
        try {
            const response = await aiAPI.auditVerification();
            setAuditResult(response.data);
            const verifiedMsg = response.data.autoVerified
                ? "✨ BOOM! Your profile is top-tier. I've automatically verified your account. Check out your new badge!"
                : `I've analyzed your profile! You scored ${response.data.score}/100. ${response.data.feedback}`;

            setMessages(prev => [...prev, {
                role: 'model',
                parts: [{ text: verifiedMsg }]
            }]);
        } catch (error) {
            const errorMsg = error.response?.data?.error || error.message || "Audit failed.";
            setMessages(prev => [...prev, { role: 'model', parts: [{ text: `Error: ${errorMsg}` }] }]);
        } finally {
            setIsTyping(false);
        }
    };

    if (!user) return null;

    return (
        <div className="bling-ai-container">
            <button className="bling-ai-trigger" onClick={() => setIsOpen(!isOpen)}>
                {isOpen ? '✕' : '✨'}
            </button>

            {isOpen && (
                <div className="bling-ai-window">
                    <div className="bling-ai-header">
                        <h3><span className="gradient-gold-text">Bling AI</span></h3>
                        <button onClick={runAudit} className="btn-outline btn-sidebar-post" style={{ fontSize: '10px' }}>Audit Me</button>
                    </div>

                    <div className="bling-ai-messages">
                        {messages.map((msg, i) => (
                            <div key={i} className={msg.role === 'user' ? 'user-message' : 'ai-message'}>
                                {msg.parts[0].text}
                            </div>
                        ))}
                        {auditResult && (
                            <div className="verification-card">
                                <div className="verify-score">{auditResult.score}%</div>
                                <div className={`verify-status status-${auditResult.status}`}>
                                    Status: {auditResult.status}
                                </div>
                                <p style={{ fontSize: '12px', margin: 0 }}>{auditResult.reasoning}</p>
                            </div>
                        )}
                        {isTyping && <div className="ai-message pulse-indicator">...</div>}
                        <div ref={messagesEndRef} />
                    </div>

                    <form className="bling-ai-input-area" onSubmit={handleSend}>
                        <input
                            type="text"
                            className="bling-ai-input"
                            placeholder="Ask me anything..."
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                        />
                        <button type="submit" className="bling-ai-send" disabled={isTyping}>
                            ➤
                        </button>
                    </form>
                </div>
            )}
        </div>
    );
};

export default BlingAI;
