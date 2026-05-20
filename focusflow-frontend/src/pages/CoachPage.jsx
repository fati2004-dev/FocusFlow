
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Box, Typography, TextField, IconButton, Avatar, Paper,
  Chip, Tooltip, Alert, CircularProgress,
} from '@mui/material';
import {
  Send, Sparkles, Heart, Brain, TrendingUp, Coffee,
  Paperclip, Mic, Trash2, Target, Wifi, WifiOff, Calendar, Clock,
} from 'lucide-react';

// ─── Static Coach Responses (No Backend Needed) ──────────────────────────────
const generateStaticResponse = (userMessage) => {
  const lowerMsg = userMessage.toLowerCase();
  
  // Greeting responses
  if (lowerMsg.match(/^(hi|hello|hey|good morning|good afternoon|good evening)/)) {
    return {
      response: "> system: Coach terminal ready.\n> Status: ONLINE\n\n─── ⋆⋅☆⋅⋆ ───\n\n👋 **Hey there! I'm your AI productivity coach.**\n\nI'm here to help you stay focused, motivated, and on track.\n\n**How can I support you today?**\n\n```\n🎯 Need a study plan?\n🧠 Feeling anxious or overwhelmed?\n📚 Have an exam coming up?\n⚡ Just need a quick motivation boost?\n```",
      intent: 'greeting'
    };
  }
  
  // Anxiety / overwhelmed responses
  if (lowerMsg.match(/anxious|anxiety|overwhelmed|stress|stressed|panic|worried|nervous/)) {
    return {
      response: "> system: Emotional support mode activated.\n> Strategy: Micro-step breakdown\n\n─── ⋆⋅☆⋅⋆ ───\n\n🧘 **I hear you. Let's take a breath together.**\n\nWhen anxiety hits, the key is **shrink the scope**. Don't think about the mountain — just the next tiny step.\n\n**Here's a 5-minute grounding plan:**\n\n```\n1️⃣ Close your eyes. Breathe in for 4 seconds.\n2️⃣ Hold for 4 seconds.\n3️⃣ Exhale for 6 seconds.\n4️⃣ Repeat 5 times.\n```\n\n**Now, what's ONE tiny task you can do in 5 minutes?**\n\n> \"I can open my notebook.\"\n> \"I can write down one sentence.\"\n> \"I can organize one folder.\"\n\nTell me what you choose, and I'll cheer you on. 💪",
      intent: 'emotional'
    };
  }
  
  // Exam preparation
  if (lowerMsg.match(/exam|test|final|study|prepare|revision|review/)) {
    return {
      response: "> system: Exam prep mode engaged.\n> Strategy: Active recall + Pomodoro\n\n─── ⋆⋅☆⋅⋆ ───\n\n📚 **Exam time? Let's build a smart study plan.**\n\n**First — answer these 3 questions for me:**\n\n```\n❓ How many days until your exam?\n❓ What are the TOP 3 topics you struggle with?\n❓ How many hours can you study today?\n```\n\n**While you think — here's a proven study sprint:**\n\n```\n🍅 25 MIN FOCUS → Read/Summarize 1 section\n☕ 5 MIN BREAK → Stretch, hydrate, breathe\n🔄 Repeat 4x → Then take 15-30 min longer break\n```\n\n**Pro tip:** Teach what you learn out loud. It locks memory in.\n\nWant me to create a custom schedule? Just tell me your exam date and subjects! 🎯",
      intent: 'planning'
    };
  }
  
  // Document / material analysis (simulated)
  if (lowerMsg.match(/document|pdf|file|material|notes|lecture|chapter|textbook|reading/)) {
    return {
      response: "> system: Document analysis mode.\n> Simulating knowledge base retrieval...\n\n─── ⋆⋅☆⋅⋆ ───\n\n📄 **Got it! I've analyzed your material.**\n\nBased on common study patterns, here's a **3-step extraction plan:**\n\n```\n🔍 STEP 1 — SKIM\n├─ Headings & subheadings\n├─ Bold/italic terms\n└─ Summary boxes / conclusions\n\n✍️ STEP 2 — EXTRACT\n├─ Write 1 sentence per paragraph\n├─ Create quick mind map\n└─ Flag anything you don't understand\n\n🧠 STEP 3 — RECALL\n├─ Close the doc\n├─ Explain it to an imaginary friend\n└─ Identify gaps → re-read only those parts\n```\n\n**Where should we start?**\n\n> \"Help me find key concepts\"\n> \"Create flashcards for me\"\n> \"Summarize the main ideas\"\n\nI'll guide you through whichever you choose. 🚀",
      intent: 'knowledge'
    };
  }
  
  // Planning / organize my day
  if (lowerMsg.match(/plan|organize|schedule|today|day|routine|agenda/)) {
    return {
      response: "> system: Daily planner mode.\n> Strategy: Eisenhower Matrix\n\n─── ⋆⋅☆⋅⋆ ───\n\n📋 **Let's build your perfect day.**\n\n**The 4 Quadrants of Today:**\n\n```\n🔴 URGENT & IMPORTANT → DO FIRST\n   (Deadlines, exams, critical tasks)\n\n🟡 IMPORTANT, NOT URGENT → SCHEDULE\n   (Study, exercise, deep work)\n\n🟠 URGENT, NOT IMPORTANT → DELEGATE/DELAY\n   (Some emails, interruptions)\n\n⚪ NEITHER → ELIMINATE\n   (Doomscrolling, distractions)\n```\n\n**Your mini action plan:**\n\n1️⃣ Write down **3 must-do tasks** for today\n2️⃣ Estimate **time needed** for each\n3️⃣ Block them in your calendar NOW\n4️⃣ Start with the **hardest one** (eat that frog 🐸)\n\nWant me to help prioritize your specific tasks? Tell me what's on your list!",
      intent: 'planning'
    };
  }
  
  // Motivation / encouragement
  if (lowerMsg.match(/motivation|motivate|encourage|inspired|give up|tired|exhausted/)) {
    return {
      response: "> system: Motivation core activated.\n> Energy level: HIGH\n\n─── ⋆⋅☆⋅⋆ ───\n\n🔥 **You've got this. Here's why:**\n\n*\"The secret of getting ahead is getting started.\"* — Mark Twain\n\n**Right now, somewhere in the world:**\n```\n✓ A student just finished their hardest chapter\n✓ An entrepreneur made their 100th cold call\n✓ An athlete completed their 5am workout\n✓ YOU are about to take the next step\n```\n\n**The 3-2-1 GO method:**\n\n```\n3... Think of your WHY.\n2... Imagine how you'll feel after.\n1... Stand up (or sit tall).\nGO → Do 2 minutes. Just 2 minutes.\n```\n\n**I believe in you. Now show me what you've got.** 💪\n\nWhat's the first small action you'll take?",
      intent: 'emotional'
    };
  }
  
  // Progress / stats (simulated)
  if (lowerMsg.match(/progress|stats|streak|performance|how am i doing/)) {
    return {
      response: "> system: Analytics engine.\n> Fetching user metrics...\n\n─── ⋆⋅☆⋅⋆ ───\n\n📊 **Your Momentum Snapshot**\n\n```\n🔥 Current streak: 8 days\n✅ Tasks completed: 24 this week\n🎯 Focus sessions: 18 (avg 32 min)\n📈 Productivity trend: +12% vs last week\n🏆 Longest streak: 14 days\n```\n\n**Insights:**\n```\n✨ Your peak focus time is mornings (9-11am)\n✨ You're most productive on Tuesdays\n✨ Taking breaks every 45min boosts your output\n```\n\n**Next milestone:** 10-day streak — you're 2 days away!\n\nKeep showing up. The compound effect is real. 🚀\n\nWant a deeper breakdown or specific advice?",
      intent: 'analytics'
    };
  }
  
  // Pomodoro / timer
  if (lowerMsg.match(/pomodoro|timer|focus time|work session|25 minute/)) {
    return {
      response: "> system: Pomodoro timer ready.\n> Cycle: 25min work / 5min break\n\n─── ⋆⋅☆⋅⋆ ───\n\n🍅 **Let's start a focus sprint!**\n\n**The Rules:**\n\n```\n⏰ 25 MINUTES — DEEP WORK\n   ├─ Phone on silent\n   ├─ Close extra tabs\n   └─ One task only\n\n☕ 5 MINUTES — GUILT-FREE BREAK\n   ├─ Stand up, stretch\n   ├─ Hydrate\n   └─ No screens if possible\n\n🔄 After 4 pomodoros → 15-30 min long break\n```\n\n**What will you work on for the next 25 minutes?**\n\nTell me your task, and I'll be here when you finish to keep you accountable. ⏳\n\n*Start when you're ready — I'll wait.*",
      intent: 'focus'
    };
  }
  
  // Default / fallback response
  return {
    response: "> system: Coach ready.\n> Listening...\n\n─── ⋆⋅☆⋅⋆ ───\n\n🤖 **I'm here to help with:**\n\n```\n📚 Exam prep & study plans\n🧠 Anxiety & overwhelm support\n📄 Document analysis (tell me what you're reading)\n📋 Daily planning & prioritization\n🔥 Motivation & accountability\n📊 Progress tracking\n🍅 Pomodoro timer\n```\n\n**Try saying:**\n\n> \"I have an exam in 3 days\"\n> \"I feel anxious about my workload\"\n> \"Help me plan my day\"\n> \"Can you analyze this document?\"\n\nWhat do you need right now? 💬",
    intent: 'general'
  };
};

const formatTime = (date) => date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

const intentSuggestions = {
  greeting: ['Plan my day', 'I have an exam', 'I feel anxious'],
  emotional: ['Help me find a small task', 'Set a 5-minute timer', 'I need motivation'],
  planning: ['Break this down further', 'Set priorities', 'Create a study schedule'],
  focus: ['Start Pomodoro timer', 'Help me choose a task', 'Block distractions'],
  knowledge: ['Summarize key points', 'Create flashcards', 'Explain concept'],
  analytics: ['Show weekly trend', 'How to improve streak', 'Peak focus times'],
  general: ['Plan my day', 'I feel overwhelmed', 'Show my progress', 'Exam help'],
};

const DEFAULT_SUGGESTIONS = ['Plan my day', 'I feel overwhelmed', 'I have an exam soon'];

export default function CoachPage({ darkMode }) {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [backendOnline] = useState(true); // Always "online" with static responses
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (messages.length === 0) {
      setMessages([{
        id: Date.now(),
        type: 'coach',
        content: "> system: FocusFlow Coach initialized.\n> Status: ONLINE\n> Knowledge base: ACTIVE\n\n─── ⋆⋅☆⋅⋆ ───\n\n👋 **Hello. I'm your AI productivity coach.**\n\nI can help you with:\n```\n📋 Tasks & planning     ⏰ Pomodoro timer\n🎯 Focus strategies     📚 Exam preparation\n💪 Anxiety support      🔥 Streak tracking\n📄 Document Q&A         🎯 Daily priorities\n```\n\n**What do you need?**",
        timestamp: new Date(),
        suggestions: DEFAULT_SUGGESTIONS,
      }]);
    }
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const generateResponse = async (userMessage) => {
    setIsTyping(true);
    
    // Simulate realistic typing delay (300-800ms)
    await new Promise(resolve => setTimeout(resolve, 400 + Math.random() * 400));
    
    const { response, intent } = generateStaticResponse(userMessage);
    const suggestions = intentSuggestions[intent] ?? DEFAULT_SUGGESTIONS;
    
    setMessages(prev => [...prev, {
      id: Date.now(),
      type: 'coach',
      content: response,
      timestamp: new Date(),
      suggestions,
      meta: { intent },
    }]);
    
    setIsTyping(false);
  };

  const handleSend = async () => {
    if (!inputValue.trim()) return;
    const userMsg = { id: Date.now(), type: 'user', content: inputValue.trim(), timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    const text = inputValue.trim();
    setInputValue('');
    await generateResponse(text);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSuggestion = (suggestion) => {
    setInputValue(suggestion);
    setTimeout(() => {
      const userMsg = { id: Date.now(), type: 'user', content: suggestion, timestamp: new Date() };
      setMessages(prev => [...prev, userMsg]);
      setInputValue('');
      generateResponse(suggestion);
    }, 50);
  };

  const handleClear = () => {
    setMessages([messages[0]]);
  };

  const bgGradient = darkMode
    ? 'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(99,102,241,0.08) 0%, transparent 70%)'
    : 'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(37,99,235,0.05) 0%, transparent 70%)';

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>
      <Box sx={{ position: 'fixed', inset: 0, background: bgGradient, pointerEvents: 'none', zIndex: 0 }} />

      <Box sx={{ position: 'relative', zIndex: 1, height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* Terminal Header */}
        <Box sx={{
          flexShrink: 0, px: 3, py: 1.5, borderBottom: '1px solid rgba(99,102,241,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          bgcolor: darkMode ? 'rgba(15,23,42,0.7)' : 'rgba(255,255,255,0.7)',
          backdropFilter: 'blur(12px)',
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box sx={{
                width: 10, height: 10, borderRadius: '50%',
                bgcolor: '#10B981',
                boxShadow: '0 0 8px #10B981',
              }} />
              <Typography sx={{ fontFamily: '"DM Mono", monospace', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.05em', color: darkMode ? '#94A3B8' : '#475569' }}>
                COACH: ACTIVE
              </Typography>
            </Box>
            <Box sx={{ width: 1, height: 20, bgcolor: 'rgba(99,102,241,0.3)' }} />
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Brain size={12} color="#6366F1" />
              <Typography sx={{ fontFamily: '"DM Mono", monospace', fontSize: '0.65rem', color: '#6366F1', fontWeight: 600 }}>
                v2.0 · STATIC MODE
              </Typography>
            </Box>
          </Box>
          <Tooltip title="Clear session">
            <IconButton size="small" onClick={handleClear} sx={{ color: '#64748B' }}>
              <Trash2 size={14} />
            </IconButton>
          </Tooltip>
        </Box>

        {/* Messages - Terminal Style */}
        <Box sx={{
          flex: 1, overflowY: 'auto', px: 3, py: 3, display: 'flex', flexDirection: 'column', gap: 2.5,
          '&::-webkit-scrollbar': { width: '6px' },
          '&::-webkit-scrollbar-track': { bgcolor: 'transparent' },
          '&::-webkit-scrollbar-thumb': { bgcolor: 'rgba(99,102,241,0.3)', borderRadius: '10px' },
        }}>
          <AnimatePresence>
            {messages.map((msg, idx) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, x: msg.type === 'user' ? 20 : -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: Math.min(idx * 0.03, 0.2) }}
              >
                <Box sx={{ display: 'flex', justifyContent: msg.type === 'user' ? 'flex-end' : 'flex-start', gap: 1.5 }}>
                  {msg.type === 'coach' && (
                    <Avatar sx={{ width: 36, height: 36, bgcolor: '#6366F1', boxShadow: '0 0 0 2px rgba(99,102,241,0.2)' }}>
                      <Sparkles size={16} color="white" />
                    </Avatar>
                  )}
                  <Box sx={{ maxWidth: '80%' }}>
                    <Paper sx={{
                      p: 2.5, borderRadius: msg.type === 'user' ? '20px 20px 6px 20px' : '20px 20px 20px 6px',
                      bgcolor: msg.type === 'user' ? '#6366F1' : darkMode ? 'rgba(30,41,59,0.85)' : '#F8FAFC',
                      color: msg.type === 'user' ? 'white' : darkMode ? '#E2E8F0' : '#1E293B',
                      border: msg.type === 'coach' ? '1px solid rgba(99,102,241,0.2)' : 'none',
                      backdropFilter: msg.type === 'coach' ? 'blur(8px)' : 'none',
                    }}>
                      <Typography sx={{ 
                        whiteSpace: 'pre-wrap', 
                        lineHeight: 1.7, 
                        fontSize: '0.85rem', 
                        fontFamily: '"Inter", "DM Mono", monospace',
                        fontWeight: 450,
                      }}>
                        {msg.content}
                      </Typography>
                    </Paper>
                    <Box sx={{ display: 'flex', gap: 1.5, mt: 0.75, ml: 1.5 }}>
                      <Typography sx={{ fontSize: 9, color: '#64748B', fontFamily: '"DM Mono", monospace' }}>
                        {formatTime(msg.timestamp)}
                      </Typography>
                      {msg.meta?.intent && (
                        <Typography sx={{ fontSize: 8, color: '#6366F1', textTransform: 'uppercase', fontFamily: '"DM Mono", monospace', fontWeight: 600 }}>
                          [{msg.meta.intent}]
                        </Typography>
                      )}
                    </Box>
                    {msg.type === 'coach' && msg.suggestions && (
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 2, ml: 1.5 }}>
                        {msg.suggestions.map((s, i) => (
                          <Chip 
                            key={i} 
                            label={s} 
                            size="small" 
                            onClick={() => handleSuggestion(s)} 
                            sx={{
                              height: 30, 
                              fontSize: '0.7rem', 
                              fontWeight: 600,
                              fontFamily: '"Inter", monospace',
                              bgcolor: 'rgba(99,102,241,0.1)', 
                              border: '1px solid rgba(99,102,241,0.2)',
                              borderRadius: '10px',
                              '&:hover': { bgcolor: '#6366F1', color: 'white', borderColor: '#6366F1', cursor: 'pointer' },
                            }} 
                          />
                        ))}
                      </Box>
                    )}
                  </Box>
                  {msg.type === 'user' && (
                    <Avatar sx={{ width: 36, height: 36, bgcolor: '#10B981', boxShadow: '0 0 0 2px rgba(16,185,129,0.2)' }}>
                      <Typography sx={{ fontSize: '0.9rem' }}>👤</Typography>
                    </Avatar>
                  )}
                </Box>
              </motion.div>
            ))}
          </AnimatePresence>
          {isTyping && (
            <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
              <Avatar sx={{ width: 36, height: 36, bgcolor: '#6366F1' }}><Sparkles size={16} color="white" /></Avatar>
              <Paper sx={{ p: 1.75, borderRadius: '20px', bgcolor: darkMode ? 'rgba(30,41,59,0.85)' : '#F8FAFC', border: '1px solid rgba(99,102,241,0.2)' }}>
                <Box sx={{ display: 'flex', gap: 0.8 }}>
                  {[0, 0.15, 0.3].map(d => (
                    <motion.div 
                      key={d} 
                      animate={{ y: [0, -6, 0] }} 
                      transition={{ repeat: Infinity, duration: 0.8, delay: d }}
                      style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#6366F1' }} 
                    />
                  ))}
                </Box>
              </Paper>
            </Box>
          )}
          <div ref={messagesEndRef} />
        </Box>

        {/* Quick Commands Bar */}
        <Box sx={{
          flexShrink: 0, px: 3, py: 1.5, borderTop: '1px solid rgba(99,102,241,0.1)',
          bgcolor: darkMode ? 'rgba(15,23,42,0.5)' : 'rgba(255,255,255,0.5)',
          backdropFilter: 'blur(8px)',
        }}>
          <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'center' }}>
            <Typography sx={{ fontFamily: '"DM Mono", monospace', fontSize: '0.65rem', color: '#6366F1', fontWeight: 700, letterSpacing: '0.05em' }}>
              QUICK COMMANDS
            </Typography>
            {[
              { icon: <Brain size={12} />, label: 'PLAN', cmd: 'Help me plan my day' },
              { icon: <Coffee size={12} />, label: 'BREAK', cmd: 'I need a break' },
              { icon: <TrendingUp size={12} />, label: 'STATS', cmd: 'Show my progress' },
              { icon: <Heart size={12} />, label: 'MOTIVATE', cmd: 'I need motivation' },
              { icon: <Target size={12} />, label: 'EXAM', cmd: 'I have an exam soon' },
              { icon: <Calendar size={12} />, label: 'ANXIETY', cmd: 'I feel anxious' },
            ].map(({ icon, label, cmd }) => (
              <Chip 
                key={label} 
                icon={icon} 
                label={label} 
                onClick={() => handleSuggestion(cmd)} 
                size="small" 
                sx={{
                  fontFamily: '"DM Mono", monospace', 
                  fontSize: '0.65rem', 
                  fontWeight: 700,
                  letterSpacing: '0.03em',
                  bgcolor: 'rgba(99,102,241,0.08)', 
                  border: '1px solid rgba(99,102,241,0.15)',
                  borderRadius: '10px',
                  '&:hover': { bgcolor: 'rgba(99,102,241,0.2)', cursor: 'pointer' },
                }} 
              />
            ))}
          </Box>
        </Box>

        {/* Input Area */}
        <Box sx={{
          flexShrink: 0, p: 2.5, borderTop: '1px solid rgba(99,102,241,0.15)',
          bgcolor: darkMode ? 'rgba(15,23,42,0.7)' : 'rgba(255,255,255,0.7)',
          backdropFilter: 'blur(12px)',
        }}>
          <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-end' }}>
            <Typography sx={{ fontFamily: '"DM Mono", monospace', fontSize: '0.85rem', color: '#6366F1', fontWeight: 700, pb: 1 }}>
              $&gt;
            </Typography>
            <TextField
              inputRef={inputRef}
              fullWidth
              multiline
              maxRows={3}
              placeholder="type your message... (try 'I have an exam' or 'I feel anxious')"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              variant="standard"
              sx={{
                '& .MuiInput-root': { fontFamily: '"DM Mono", "Inter", monospace', fontSize: '0.85rem', color: darkMode ? '#E2E8F0' : '#1E293B' },
                '& .MuiInput-underline:before': { borderBottomColor: 'rgba(99,102,241,0.3)' },
                '& .MuiInput-underline:after': { borderBottomColor: '#6366F1' },
              }}
            />
            <IconButton 
              onClick={handleSend} 
              disabled={!inputValue.trim() || isTyping} 
              sx={{
                bgcolor: inputValue.trim() && !isTyping ? '#6366F1' : 'rgba(99,102,241,0.2)',
                color: inputValue.trim() && !isTyping ? 'white' : '#64748B',
                borderRadius: '12px', 
                width: 42, 
                height: 42,
                transition: 'all 0.2s',
                '&:hover': { bgcolor: inputValue.trim() && !isTyping ? '#4F46E5' : 'rgba(99,102,241,0.3)' },
              }}>
              <Send size={16} />
            </IconButton>
          </Box>
          <Typography sx={{ textAlign: 'center', mt: 1.5, fontSize: '0.6rem', fontFamily: '"DM Mono", monospace', color: '#475569', letterSpacing: '0.02em' }}>
            FocusFlow Coach — AI-powered productivity terminal • {backendOnline ? 'Static mode active' : 'Offline'}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
