import { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, User, AlertTriangle, ChevronDown, CheckCircle } from 'lucide-react';
import LottieLib from 'lottie-react';
import assistantAnimation from '../assets/assistent.json';
import loaderAnimation from '../assets/loder.json';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabaseClient';

const Lottie = LottieLib.default || LottieLib;

export default function AIAssistantWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'ai', text: 'Namaste! Main Timbel ki AI Assistant hoon. Aapko timetable, classes, ya platform ke baare me koi query hai toh zaroor puchiye!' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  
  const { user } = useAuth();

  // Structured Issue Form State
  const [showIssueForm, setShowIssueForm] = useState(false);
  const [issueForm, setIssueForm] = useState({
    issue_type: 'Missing Slot',
    room: '',
    day: 'MON',
    slot_time: '',
    query_text: ''
  });
  const [issueSubmitting, setIssueSubmitting] = useState(false);
  const [issueSuccess, setIssueSuccess] = useState(false);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setIsLoading(true);

    try {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      const token = currentSession?.access_token;
      const effectiveUserId = user?.id || currentSession?.user?.id;

      const headers = {
        'Content-Type': 'application/json'
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch('/api/chat/ask', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          message: userMessage,
          history: messages.slice(-10), // Send last 10 messages as context
          user_id: effectiveUserId
        })
      });

      if (!response.ok) throw new Error('Network response was not ok');
      const data = await response.json();

      setMessages(prev => [...prev, { role: 'ai', text: data.reply }]);
    } catch (error) {
      console.error('Chat Error:', error);
      setMessages(prev => [...prev, { role: 'ai', text: 'Sorry, abhi backend me thodi problem hai. Please thodi der baad try karein.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleIssueSubmit = async (e) => {
    e.preventDefault();
    setIssueSubmitting(true);
    try {
      const response = await fetch('/api/chat/report-slot-issue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          room: issueForm.room,
          slot_time: `${issueForm.day} at ${issueForm.slot_time}`,
          issue_type: issueForm.issue_type,
          query_text: issueForm.query_text
        })
      });

      if (!response.ok) throw new Error('Failed to submit issue');
      
      setIssueSuccess(true);
      setMessages(prev => [...prev, { 
        role: 'user', 
        text: `Reported Issue: [${issueForm.issue_type}] for Room ${issueForm.room} on ${issueForm.day} at ${issueForm.slot_time}. Details: ${issueForm.query_text}` 
      }, {
        role: 'ai',
        text: 'Thank you! Your issue has been structured and sent to the Admin for approval.'
      }]);

      setTimeout(() => {
        setShowIssueForm(false);
        setIssueSuccess(false);
        setIssueForm({ issue_type: 'Missing Slot', room: '', day: 'MON', slot_time: '', query_text: '' });
      }, 2000);
    } catch (error) {
      console.error('Submit Issue Error:', error);
      alert('Failed to submit issue. Please try again.');
    } finally {
      setIssueSubmitting(false);
    }
  };
  const isUniUser = user && user.email && (user.email.endsWith('.ac.in') || user.email.endsWith('.edu') || user.email.endsWith('.edu.in'));

  return (
    <div className={`fixed right-4 md:right-6 z-50 ${isUniUser ? 'bottom-[88px] md:bottom-6' : 'bottom-6'}`}>
      {/* Floating Action Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="w-14 h-14 rounded-full bg-violet-primary text-white shadow-2xl flex items-center justify-center hover:bg-violet-600 transition-all hover:scale-110 active:scale-95 border-2 border-violet-400/30 group"
        >
          <MessageSquare className="w-6 h-6 group-hover:animate-pulse" />
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="w-[350px] sm:w-[400px] max-w-[calc(100vw-32px)] h-[500px] max-h-[calc(100vh-100px)] glass-card flex flex-col rounded-2xl shadow-2xl border border-violet-primary/30 overflow-hidden animate-in zoom-in-95 duration-200">
          
          {/* Header */}
          <div className="p-4 border-b border-slate-border/50 bg-slate-darker flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-violet-primary/20 flex items-center justify-center border border-violet-primary/30 overflow-hidden">
                <Lottie animationData={assistantAnimation} className="w-8 h-8" />
              </div>
              <div>
                <h3 className="font-bold text-text-primary text-sm">Timbel Assistant</h3>
                <p className="text-xs text-emerald-free flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-free animate-pulse-soft"></span> Online
                </p>
              </div>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="p-2 text-text-muted hover:text-text-primary hover:bg-slate-border/50 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-slate-border scrollbar-track-transparent">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`flex gap-3 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  <div className={`w-8 h-8 shrink-0 rounded-full flex items-center justify-center mt-1 border ${
                    msg.role === 'user' 
                      ? 'bg-slate-deep border-slate-border text-text-secondary' 
                      : 'bg-violet-primary/20 border-violet-primary/30 text-violet-primary'
                  }`}>
                    {msg.role === 'user' ? <User className="w-4 h-4" /> : <Lottie animationData={assistantAnimation} className="w-8 h-8" />}
                  </div>
                  
                  <div className={`p-3 rounded-2xl text-sm ${
                    msg.role === 'user'
                      ? 'bg-violet-primary text-white rounded-tr-sm'
                      : 'bg-slate-card text-text-primary border border-slate-border/50 rounded-tl-sm'
                  }`}>
                    {msg.text}
                  </div>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="flex gap-3 max-w-[85%]">
                  <div className="w-8 h-8 shrink-0 rounded-full flex items-center justify-center mt-1 border bg-violet-primary/20 border-violet-primary/30 text-violet-primary">
                    <Lottie animationData={assistantAnimation} className="w-8 h-8" />
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-card border border-slate-border/50 rounded-tl-sm flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-violet-primary/60 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 rounded-full bg-violet-primary/60 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 rounded-full bg-violet-primary/60 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Action Bar */}
          {!showIssueForm && (
            <div className="px-4 pb-2 pt-1 flex gap-2 overflow-x-auto scrollbar-none">
              <button
                onClick={() => setShowIssueForm(true)}
                className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-soon/10 text-amber-soon border border-amber-soon/30 text-xs font-semibold hover:bg-amber-soon/20 transition-colors"
              >
                <AlertTriangle size={14} /> Report Issue
              </button>
            </div>
          )}

          {/* Structured Issue Form */}
          {showIssueForm && (
            <div className="absolute inset-x-0 bottom-0 top-[65px] bg-slate-darker z-20 flex flex-col animate-in slide-in-from-bottom-2 duration-200">
              <div className="p-4 border-b border-slate-border/50 flex justify-between items-center bg-slate-card">
                <h4 className="font-bold text-text-primary text-sm flex items-center gap-2">
                  <AlertTriangle className="text-amber-soon w-4 h-4" /> Structured Issue Report
                </h4>
                <button onClick={() => setShowIssueForm(false)} className="text-text-muted hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {issueSuccess ? (
                <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                  <div className="w-16 h-16 rounded-full bg-emerald-free/20 flex items-center justify-center mb-4">
                    <CheckCircle className="w-8 h-8 text-emerald-free" />
                  </div>
                  <h4 className="text-lg font-bold text-text-primary mb-2">Issue Reported</h4>
                  <p className="text-sm text-text-muted">Admin has been notified with your structured data.</p>
                </div>
              ) : (
                <form onSubmit={handleIssueSubmit} className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-slate-border">
                  <div>
                    <label className="block text-xs font-semibold text-text-secondary mb-1.5 uppercase tracking-wider">Issue Type *</label>
                    <div className="relative">
                      <select 
                        value={issueForm.issue_type}
                        onChange={e => setIssueForm(p => ({ ...p, issue_type: e.target.value }))}
                        className="w-full px-3 py-2.5 rounded-xl bg-slate-deep border border-slate-border text-text-primary text-sm appearance-none focus:outline-none focus:border-amber-soon"
                        required
                      >
                        <option value="Missing Slot">Missing Slot</option>
                        <option value="Wrong Teacher">Wrong Teacher</option>
                        <option value="Room Conflict">Room Conflict</option>
                        <option value="Class Cancelled">Class Cancelled</option>
                        <option value="Other">Other</option>
                      </select>
                      <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-text-secondary mb-1.5 uppercase tracking-wider">Room *</label>
                      <input 
                        type="text" 
                        placeholder="e.g. B012"
                        value={issueForm.room}
                        onChange={e => setIssueForm(p => ({ ...p, room: e.target.value }))}
                        className="w-full px-3 py-2.5 rounded-xl bg-slate-deep border border-slate-border text-text-primary text-sm focus:outline-none focus:border-amber-soon"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-text-secondary mb-1.5 uppercase tracking-wider">Day *</label>
                      <div className="relative">
                        <select 
                          value={issueForm.day}
                          onChange={e => setIssueForm(p => ({ ...p, day: e.target.value }))}
                          className="w-full px-3 py-2.5 rounded-xl bg-slate-deep border border-slate-border text-text-primary text-sm appearance-none focus:outline-none focus:border-amber-soon"
                          required
                        >
                          {['MON','TUE','WED','THU','FRI','SAT'].map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                        <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-text-secondary mb-1.5 uppercase tracking-wider">Time (Optional)</label>
                    <input 
                      type="time" 
                      value={issueForm.slot_time}
                      onChange={e => setIssueForm(p => ({ ...p, slot_time: e.target.value }))}
                      className="w-full px-3 py-2.5 rounded-xl bg-slate-deep border border-slate-border text-text-primary text-sm focus:outline-none focus:border-amber-soon"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-text-secondary mb-1.5 uppercase tracking-wider">Description *</label>
                    <textarea 
                      placeholder="Please explain the exact issue..."
                      value={issueForm.query_text}
                      onChange={e => setIssueForm(p => ({ ...p, query_text: e.target.value }))}
                      className="w-full px-3 py-2.5 rounded-xl bg-slate-deep border border-slate-border text-text-primary text-sm h-20 resize-none focus:outline-none focus:border-amber-soon"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={issueSubmitting}
                    className="w-full py-3 rounded-xl bg-amber-soon hover:bg-amber-soon/90 text-slate-darker font-bold text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                  >
                    {issueSubmitting ? <Lottie animationData={loaderAnimation} className="w-5 h-5" /> : 'Submit Report'}
                  </button>
                </form>
              )}
            </div>
          )}

          {/* Input Area */}
          <div className="p-4 border-t border-slate-border/50 bg-slate-darker shrink-0">
            <form onSubmit={handleSend} className="relative flex items-center">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask me anything..."
                className="w-full bg-slate-deep border border-slate-border rounded-xl pl-4 pr-12 py-3 text-sm text-text-primary focus:outline-none focus:border-violet-primary focus:ring-1 focus:ring-violet-primary transition-all"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="absolute right-2 p-2 text-violet-primary hover:bg-violet-primary/10 rounded-lg transition-colors disabled:opacity-50 disabled:hover:bg-transparent"
              >
                {isLoading ? <Lottie animationData={loaderAnimation} className="w-8 h-8" /> : <Send className="w-5 h-5" />}
              </button>
            </form>
            <p className="text-[10px] text-text-muted text-center mt-2">
              Timbel AI can make mistakes. Consider verifying important data.
            </p>
          </div>

        </div>
      )}
    </div>
  );
}
