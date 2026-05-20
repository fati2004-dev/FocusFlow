# agents/focus_agent.py
from typing import Dict, Any
from datetime import datetime, timedelta
import time
import threading


class PomodoroTimer:
    """Simple Pomodoro timer implementation"""
    
    def __init__(self):
        self.is_running = False
        self.start_time = None
        self.remaining = 25 * 60  # 25 minutes in seconds
        self.timer_thread = None
        
    def start(self, minutes: int = 25):
        self.is_running = True
        self.start_time = datetime.now()
        self.remaining = minutes * 60
        return f"✅ Timer started for {minutes} minutes!"
    
    def pause(self):
        if self.is_running and self.start_time:
            elapsed = (datetime.now() - self.start_time).seconds
            self.remaining -= elapsed
            self.is_running = False
            return f"⏸️ Timer paused. {self.remaining // 60} minutes remaining."
        return "No active timer to pause."
    
    def resume(self):
        if not self.is_running and self.remaining > 0:
            self.start_time = datetime.now()
            self.is_running = True
            return f"▶️ Timer resumed! {self.remaining // 60} minutes remaining."
        return "No paused timer found."
    
    def stop(self):
        if self.start_time:
            self.is_running = False
            minutes_completed = (25 * 60 - self.remaining) // 60
            self.remaining = 25 * 60
            return f"⏹️ Timer stopped. You completed {minutes_completed} minutes of focused work!"
        return "No active timer."
    
    def status(self):
        if self.is_running and self.start_time:
            elapsed = (datetime.now() - self.start_time).seconds
            remaining = max(0, self.remaining - elapsed)
            return {
                "is_running": True,
                "remaining_minutes": remaining // 60,
                "remaining_seconds": remaining % 60
            }
        return {"is_running": False, "remaining_minutes": self.remaining // 60}


class FocusAgent:
    """
    Agent 4: Focus/Timer Specialist
    Role: Implement Pomodoro technique and focus sessions
    Tool: Timer management
    """
    
    def __init__(self):
        self.name = "Focus Agent"
        self.persona = """You are a focus coach specializing in the Pomodoro Technique.
Your role is to help users implement effective focus sessions.
Use 25-minute work blocks with 5-minute breaks.
After 4 Pomodoros, recommend a 15-30 minute longer break.
Be encouraging and help users build focus habits."""
        
        self.timer = PomodoroTimer()
        self.sessions_completed = 0
        
        print("   ⏰ Initializing Focus Agent...")
    
    def process(self, query: str, shared_state) -> Dict[str, Any]:
        """
        Process query related to focus and timing
        
        Args:
            query: User's timer/focus request
            shared_state: Shared state from supervisor
        
        Returns:
            Dictionary with timer response
        """
        query_lower = query.lower()
        
        # For greetings
        if any(greeting in query_lower for greeting in ['hello', 'hi', 'hey', 'greetings']):
            return {
                "agent": self.name,
                "response": "Hello! I'm your Focus Agent. I specialize in the Pomodoro Technique and focus sessions. Say 'start focus' when you're ready to begin a 25-minute focused work session!",
                "timer_active": False,
                "sessions_today": shared_state.focus_sessions,
                "success": True
            }
        
        # Handle different timer commands
        if any(word in query_lower for word in ["start", "begin", "go"]):
            # Check if there's a task to focus on
            if shared_state.current_focus_task:
                task_desc = shared_state.current_focus_task
            else:
                # Try to get the first pending task
                pending_tasks = [t for t in shared_state.tasks if t.get("status") == "pending"]
                if pending_tasks:
                    task_desc = pending_tasks[0].get("description", "your task")
                else:
                    task_desc = "your focus session"
            
            result = self.timer.start(25)
            
            # Update shared state
            shared_state.focus_sessions += 1
            
            response = f"""## 🍅 Pomodoro Session Started!

{result}

### Current Focus Task: {task_desc}

### Session Rules:
- 🔴 Focus for 25 minutes on this ONE task
- 🟢 Take a 5-minute break when timer ends
- 📱 Put away distractions during focus time
- 💪 You've got this!

### Timer Status:
Running: {self.timer.status()['remaining_minutes']} minutes remaining

I'll check in when your timer completes. Stay focused! 🎯
"""
        
        elif any(word in query_lower for word in ["pause", "break"]):
            result = self.timer.pause()
            status = self.timer.status()
            response = f"""⏸️ Session Paused

{result}

When you're ready to continue, just say "resume" or "continue".
"""
        
        elif any(word in query_lower for word in ["resume", "continue", "unpause"]):
            result = self.timer.resume()
            status = self.timer.status()
            response = f"""▶️ Session Resumed

{result}

Stay focused! You're doing great. 🎯
"""
        
        elif any(word in query_lower for word in ["stop", "end", "cancel"]):
            result = self.timer.stop()
            response = f"""⏹️ Focus Session Ended

{result}

Great effort! Every session builds your focus muscle. Would you like to start another session or review what you accomplished?
"""
        
        elif "status" in query_lower or "time" in query_lower or "remaining" in query_lower:
            status = self.timer.status()
            if status['is_running']:
                response = f"""⏲️ Timer Status

Focus session in progress!
- ⏰ Time remaining: {status['remaining_minutes']} minutes, {status['remaining_seconds']} seconds
- ✅ Sessions completed today: {shared_state.focus_sessions}

Keep going! You're building momentum. 💪
"""
            else:
                response = f"""⏲️ Timer Status

No active focus session.
- ✅ Sessions completed today: {shared_state.focus_sessions}
- 📋 Pending tasks: {len([t for t in shared_state.tasks if t.get('status') == 'pending'])}

Ready to start a Pomodoro? Just say "start focus" or "begin session"!
"""
        
        else:
            # General focus advice
            response = f"""## 🍅 Pomodoro Technique Overview

The Pomodoro Technique is a proven method for maintaining focus:

### How It Works:
1. 📍 Choose ONE task to focus on
2. ⏰ Set timer for 25 minutes
3. 🎯 Work until timer rings
4. 🌿 Take 5 minute break
5. 🔄 Repeat 4 times, then take longer break (15-30 min)

### Benefits:
- Reduces mental fatigue
- Builds focus stamina
- Makes large tasks manageable
- Creates urgency without stress

### Today's Progress:
- Sessions completed: {shared_state.focus_sessions}
- Tasks pending: {len([t for t in shared_state.tasks if t.get('status') == 'pending'])}

### Get Started:
Say "start focus" to begin your first Pomodoro session!

*I'll be here to keep you on track. You're building a powerful habit.* 🌟
"""
        
        return {
            "agent": self.name,
            "response": response,
            "timer_active": self.timer.status()['is_running'],
            "sessions_today": shared_state.focus_sessions,
            "success": True
        }