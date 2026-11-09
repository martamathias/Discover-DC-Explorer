import { useState, type FormEvent } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Compass,
  MessageCircle,
  Send,
  SlidersHorizontal,
  Sparkles,
} from 'lucide-react';
import {
  getGetChatSystemPromptQueryKey,
  useGetChatSystemPrompt,
  useHealthCheck,
  usePostChat,
} from '@workspace/api-client-react';

type Message = {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  answer?: {
    settings: { temperature: number; topP: number; maxOutputTokens: number };
    usage: { promptTokens: number; replyTokens: number; totalTokens: number };
    model: string;
    truncated: boolean;
  };
  error?: boolean;
};

const readErrorMessage = (error: unknown) => {
  if (error && typeof error === 'object') {
    const value = error as { message?: unknown; error?: unknown; data?: { error?: unknown } };
    const message = value.data?.error ?? value.error ?? value.message;
    if (typeof message === 'string' && message.trim()) return message;
  }
  return 'The guide could not answer just now. Please try again.';
};

function ChatGuide() {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [temperature, setTemperature] = useState(1);
  const [topP, setTopP] = useState(0.95);
  const [maxOutputTokens, setMaxOutputTokens] = useState(300);
  const [promptOpen, setPromptOpen] = useState(false);
  const [nextId, setNextId] = useState(0);
  const chat = usePostChat();
  const health = useHealthCheck();
  const prompt = useGetChatSystemPrompt({
    query: {
      enabled: promptOpen,
      queryKey: getGetChatSystemPromptQueryKey(),
    },
  });

  const submitQuestion = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const question = message.trim();
    if (!question || chat.isPending) return;
    const priorMessages = messages
      .filter((item) => !item.error)
      .slice(-12)
      .map(({ role, content }) => ({ role, content }));
    const userMessage: Message = { id: nextId, role: 'user', content: question };
    setMessages((current) => [...current, userMessage]);
    setNextId((current) => current + 1);
    setMessage('');
    chat.mutate(
      {
        data: {
          message: question,
          history: priorMessages,
          settings: { temperature, topP, maxOutputTokens },
        },
      },
      {
        onSuccess: (answer) => {
          setMessages((current) => [
            ...current,
            {
              id: nextId + 1,
              role: 'assistant',
              content: answer.reply,
              answer,
            },
          ]);
          setNextId((current) => current + 1);
        },
        onError: (error) => {
          const detail = readErrorMessage(error);
          const isMissingKey = /api.?key|missing.*key|key.*missing/i.test(detail);
          setMessages((current) => [
            ...current,
            {
              id: nextId + 1,
              role: 'assistant',
              content: isMissingKey
                ? `The city guide’s AI service is not configured yet. ${detail}`
                : detail,
              error: true,
            },
          ]);
          setNextId((current) => current + 1);
        },
      },
    );
  };

  const statusLabel = health.data?.status === 'ok'
    ? 'Guide connection ready'
    : health.isLoading
      ? 'Connecting to the guide'
      : 'Guide connection unavailable';

  return (
    <section className="chat-section" id="ask-the-guide" aria-labelledby="chat-title" data-testid="chat-section">
      <div className="container chat-layout">
        <div className="chat-intro">
          <div className="section-kicker">A local voice, at your service</div>
          <h2 className="section-heading" id="chat-title">Ask the city<br />a better question.</h2>
          <p className="section-lead">
            Need a low-key afternoon, a good first Metro ride, or a dinner plan near the Mall? Ask for a little local direction.
          </p>
          <div className="chat-connection" aria-live="polite" data-testid="chat-service-status">
            <span className={health.data?.status === 'ok' ? 'connection-dot is-ready' : 'connection-dot'} />
            {statusLabel}
          </div>
          <button
            className="prompt-toggle"
            type="button"
            onClick={() => setPromptOpen((open) => !open)}
            aria-expanded={promptOpen}
            aria-controls="system-prompt-panel"
            data-testid="toggle-system-prompt"
          >
            <span><SlidersHorizontal size={15} /> See how the guide thinks</span>
            {promptOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
          {promptOpen && (
            <div className="prompt-panel" id="system-prompt-panel" data-testid="system-prompt-panel">
              {prompt.isLoading ? (
                <div className="prompt-skeleton" aria-label="Loading system prompt">
                  <span /><span /><span />
                </div>
              ) : prompt.isError ? (
                <div className="prompt-error" role="alert">
                  <p>The guide’s prompt could not be loaded.</p>
                  <button type="button" onClick={() => void prompt.refetch()} data-testid="retry-system-prompt">Try again</button>
                </div>
              ) : prompt.data ? (
                <>
                  <div className="prompt-meta"><span>System prompt</span><span>{prompt.data.wordCount} words</span></div>
                  <pre>{prompt.data.systemPrompt}</pre>
                </>
              ) : null}
            </div>
          )}
        </div>

        <div className="chat-card">
          <div className="chat-card-head">
            <div className="chat-mark"><Compass size={19} strokeWidth={1.5} /></div>
            <div>
              <strong>Ask Discover DC</strong>
              <span>Practical ideas, with a local point of view</span>
            </div>
            <span className="chat-head-rule" aria-hidden="true" />
          </div>

          <div className="prompt-lab" aria-labelledby="prompt-lab-title">
            <div className="prompt-lab-heading">
              <span><Sparkles size={14} /> Prompt Lab</span>
              <span id="prompt-lab-title">Tune your answer</span>
            </div>
            <div className="prompt-controls">
              <label className="prompt-control" htmlFor="chat-temperature">
                <span>Temperature <output>{temperature.toFixed(1)}</output></span>
                <input
                  id="chat-temperature"
                  type="range"
                  min="0"
                  max="2"
                  step="0.1"
                  value={temperature}
                  onChange={(event) => setTemperature(Number(event.target.value))}
                  data-testid="input-temperature"
                />
                <small>Focused <span>More exploratory</span></small>
              </label>
              <label className="prompt-control" htmlFor="chat-top-p">
                <span>Top P <output>{topP.toFixed(2)}</output></span>
                <input
                  id="chat-top-p"
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={topP}
                  onChange={(event) => setTopP(Number(event.target.value))}
                  data-testid="input-top-p"
                />
                <small>Narrow <span>Broad</span></small>
              </label>
              <label className="prompt-control token-control" htmlFor="chat-max-tokens">
                <span>Max output tokens <output>{maxOutputTokens}</output></span>
                <input
                  id="chat-max-tokens"
                  type="range"
                  min="32"
                  max="1024"
                  step="1"
                  value={maxOutputTokens}
                  onChange={(event) => setMaxOutputTokens(Number(event.target.value))}
                  data-testid="input-max-output-tokens"
                />
                <small>32 <span>1024</span></small>
              </label>
            </div>
          </div>

          <div className={`chat-transcript${messages.length ? ' has-messages' : ''}`} aria-live="polite" aria-relevant="additions text">
            {messages.length === 0 ? (
              <div className="chat-welcome" data-testid="chat-empty-state">
                <div className="welcome-icon"><MessageCircle size={21} strokeWidth={1.5} /></div>
                <strong>Where would you like the day to take you?</strong>
                <p>Try “What can I do near the Mall after lunch?”</p>
              </div>
            ) : (
              messages.map((item) => (
                <article className={`chat-message ${item.role}${item.error ? ' is-error' : ''}`} key={item.id} data-testid={`chat-message-${item.role}-${item.id}`}>
                  <span className="message-role">{item.role === 'user' ? 'You' : 'Discover DC'}</span>
                  <p>{item.content}</p>
                  {item.answer && (
                    <div className="answer-details" data-testid={`answer-details-${item.id}`}>
                      <div className="answer-detail-title">Answer settings <span>{item.answer.model}</span></div>
                      <div className="answer-settings">
                        <span>Temperature <b>{item.answer.settings.temperature}</b></span>
                        <span>Top P <b>{item.answer.settings.topP}</b></span>
                        <span>Max output <b>{item.answer.settings.maxOutputTokens}</b></span>
                      </div>
                      <div className="answer-tokens">
                        <span>Prompt <b>{item.answer.usage.promptTokens}</b></span>
                        <span>Reply <b>{item.answer.usage.replyTokens}</b></span>
                        <span>Total <b>{item.answer.usage.totalTokens}</b> tokens</span>
                      </div>
                      {item.answer.truncated && (
                        <div className="cutoff-notice" role="status" data-testid={`answer-truncated-${item.id}`}>
                          This answer was cut off at the output limit. Ask a follow-up to continue.
                        </div>
                      )}
                    </div>
                  )}
                </article>
              ))
            )}
            {chat.isPending && (
              <div className="chat-thinking" role="status" aria-label="The guide is thinking">
                <span /><span /><span />
              </div>
            )}
          </div>

          <form className="chat-compose" onSubmit={submitQuestion}>
            <label className="sr-only" htmlFor="chat-question">Ask the Discover DC guide</label>
            <textarea
              id="chat-question"
              rows={2}
              maxLength={2000}
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault();
                  event.currentTarget.form?.requestSubmit();
                }
              }}
              placeholder="Ask about a place, a meal, or getting around…"
              data-testid="input-chat-question"
            />
            <div className="compose-footer">
              <span>{message.length} / 2000 · Enter to send</span>
              <button type="submit" disabled={!message.trim() || chat.isPending} data-testid="button-send-chat">
                {chat.isPending ? 'Thinking' : 'Ask the guide'} <Send size={14} />
              </button>
            </div>
          </form>
          <p className="chat-disclaimer">Suggestions are a starting point. Check current hours, tickets, and transit details before you go.</p>
        </div>
      </div>
    </section>
  );
}

export default ChatGuide;
