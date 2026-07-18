import React from 'react';

// Simple full-screen modal that re‑uses the AI chat UI from Layout.
// It receives the same props/state via handlers passed from Layout.
export default function ChatBotModal({
  show,
  onClose,
  patient,
  messages,
  inputText,
  setInputText,
  handleSend,
  isTyping,
  inputFocused,
  setInputFocused,
}) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative w-full max-w-2xl bg-white dark:bg-[#201714] rounded-2xl shadow-2xl overflow-hidden border border-primary/10 dark:border-primary/20 animate-fadeInUp">
        {/* Header */}
        <div className="flex items-center justify-between bg-gradient-to-r from-secondary to-primary px-5 py-4">
          <h2 className="text-white font-bold text-sm flex items-center gap-2">
            <span>🌿</span> AI Diet Coach Chat
          </h2>
          <button onClick={onClose} className="text-white hover:text-gray-200 text-xl font-bold">✕</button>
        </div>

        {/* Messages */}
        <div className="h-[60vh] overflow-y-auto p-5 space-y-3 bg-cream/40 dark:bg-[#160E0C] scrollbar-thin">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} mb-1`}>
              <div className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs font-semibold leading-relaxed whitespace-pre-wrap ${msg.sender === 'user' ? 'bg-primary text-white rounded-tr-none shadow-sm shadow-primary/10' : 'bg-white dark:bg-[#241B18] text-ink dark:text-gray-100 border border-primary/10 dark:border-primary/20 rounded-tl-none shadow-sm'}`}>
                {msg.text}
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-xs">🌿</div>
              <div className="flex space-x-1">
                {[0, 150, 300].map((d) => (
                  <span key={d} className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }} />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div className={`p-4 border-t bg-white dark:bg-[#201714] flex ${inputFocused ? 'border-t-primary' : 'border-t-primary/10 dark:border-t-primary/20'} transition-all`}>
          <div className={`flex-1 flex items-center gap-2 bg-cream dark:bg-[#160E0C] rounded-xl px-3.5 py-2.5 border ${inputFocused ? 'border-primary shadow-sm shadow-primary/10' : 'border-primary/10 dark:border-primary/20'} transition-all`}
            onFocus={() => setInputFocused(true)}
            onBlur={() => setInputFocused(false)}
          >
            <input
              type="text"
              placeholder="Ask about diet, nutrition, meals…"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              className="flex-1 bg-transparent outline-none placeholder:text-muted/60 dark:placeholder:text-gray-600 dark:text-white text-xs font-semibold"
            />
            <button
              onClick={() => handleSend()}
              disabled={!inputText.trim()}
              className="w-7 h-7 rounded-lg bg-primary hover:bg-primary-dark disabled:opacity-40 flex items-center justify-center text-white transition-all"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
