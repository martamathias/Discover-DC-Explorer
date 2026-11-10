import { useEffect, useState, type FormEvent } from 'react';
import './AskDCExplorer.css';

type ChatSettings = {
  temperature: number;
  topP: number;
  maxOutputTokens: number;
};

type ChatUsage = {
  promptTokens: number;
  outputTokens: number;
  totalTokens: number;
  truncated: boolean;
};

type ChatEntry = {
  question: string;
  reply: string;
  usage: ChatUsage;
  settings: ChatSettings;
  model: string;
};

type HistoryMessage = { role: 'user' | 'assistant'; content: string };

const defaultSettings: ChatSettings = {
  temperature: 1,
  topP: 0.95,
  maxOutputTokens: 300,
};

const suggestions = ['What should I eat first?', 'What can I do for free?', 'What can I do with kids?', 'How do I use the Metro?'];

function isChatEntry(value: unknown): value is Omit<ChatEntry, 'question'> {
  if (typeof value !== 'object' || value === null) return false;
  const result = value as Partial<ChatEntry>;
  return typeof result.reply === 'string'
    && typeof result.model === 'string'
    && typeof result.settings?.temperature === 'number'
    && typeof result.settings.topP === 'number'
    && typeof result.settings.maxOutputTokens === 'number'
    && typeof result.usage?.promptTokens === 'number'
    && typeof result.usage.outputTokens === 'number'
    && typeof result.usage.totalTokens === 'number'
    && typeof result.usage.truncated === 'boolean';
}

export default function AskDCExplorer() {
  const [question, setQuestion] = useState('');
  const [conversation, setConversation] = useState<ChatEntry[]>([]);
  const [settings, setSettings] = useState(defaultSettings);
  const [systemPrompt, setSystemPrompt] = useState('');
  const [promptError, setPromptError] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let active = true;
    fetch('/api/chat/system-prompt')
      .then(async (response) => {
        if (!response.ok) throw new Error('Could not load the city guide prompt.');
        return response.json() as Promise<{ systemPrompt: string }>;
      })
      .then((data) => {
        if (active) setSystemPrompt(data.systemPrompt);
      })
      .catch((cause: unknown) => {
        if (active) setPromptError(cause instanceof Error ? cause.message : 'Could not load the city guide prompt.');
      });
    return () => {
      active = false;
    };
  }, []);

  async function ask(value: string) {
    const trimmed = value.trim();
    if (!trimmed || isLoading) return;

    setQuestion('');
    setError('');
    setIsLoading(true);
    const history: HistoryMessage[] = conversation.slice(-20).flatMap((entry) => [
      { role: 'user', content: entry.question },
      { role: 'assistant', content: entry.reply },
    ]);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: trimmed, history, settings }),
      });
      const data: unknown = await response.json();
      if (!response.ok) {
        const message = typeof data === 'object' && data !== null && 'error' in data && typeof data.error === 'string'
          ? data.error
          : 'The city guide is unavailable right now. Please try again.';
        throw new Error(message);
      }

      if (!isChatEntry(data)) throw new Error('The city guide returned an invalid response. Please try again.');
      setConversation((previous) => [...previous, { question: trimmed, ...data }]);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'The city guide is unavailable right now. Please try again.');
      setQuestion(trimmed);
    } finally {
      setIsLoading(false);
    }
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void ask(question);
  }

  return (
    <section id="ask-dc" className="ask-dc-section" aria-labelledby="ask-dc-title">
      <div className="ask-dc-panel">
        <span className="ask-dc-eyebrow">YOUR DC TRAVEL HELPER</span>
        <h2 id="ask-dc-title">Ask DC Explorer Anything!</h2>
        <p>Questions about museums, food, landmarks, neighborhoods, or getting around? Start here.</p>
        <form onSubmit={submit} className="ask-dc-form">
          <label className="ask-dc-sr-only" htmlFor="ask-dc-input">Ask a question about Washington DC</label>
          <input id="ask-dc-input" value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="What would you like to explore in DC?" maxLength={4000} disabled={isLoading} />
          <button type="submit" disabled={isLoading || !question.trim()}>{isLoading ? 'Thinking…' : 'Ask DC Explorer'}</button>
        </form>
        <div className="ask-dc-suggestions" aria-label="Suggested questions">
          {suggestions.map((suggestion) => <button key={suggestion} type="button" onClick={() => void ask(suggestion)} disabled={isLoading}>{suggestion}</button>)}
        </div>

        <details className="ask-dc-prompt-lab">
          <summary>Prompt Lab</summary>
          <div className="ask-dc-controls">
            <label>
              <span>Temperature <output>{settings.temperature.toFixed(1)}</output></span>
              <input aria-label="Temperature" type="range" min="0" max="2" step="0.1" value={settings.temperature} onChange={(event) => setSettings((current) => ({ ...current, temperature: Number(event.target.value) }))} />
            </label>
            <label>
              <span>Max output tokens <output>{settings.maxOutputTokens}</output></span>
              <input aria-label="Max output tokens" type="range" min="32" max="1024" step="1" value={settings.maxOutputTokens} onChange={(event) => setSettings((current) => ({ ...current, maxOutputTokens: Number(event.target.value) }))} />
            </label>
            <label>
              <span>Top-p <output>{settings.topP.toFixed(2)}</output></span>
              <input aria-label="Top-p" type="range" min="0" max="1" step="0.01" value={settings.topP} onChange={(event) => setSettings((current) => ({ ...current, topP: Number(event.target.value) }))} />
            </label>
          </div>
          <details className="ask-dc-system-prompt">
            <summary>View system prompt</summary>
            {promptError ? <p role="alert">{promptError}</p> : <pre>{systemPrompt || 'Loading system prompt…'}</pre>}
          </details>
        </details>

        {error && <p className="ask-dc-error" role="alert">{error}</p>}
        {isLoading && <p className="ask-dc-loading" role="status">Finding a good local answer…</p>}
        {conversation.length > 0 && (
          <div className="ask-dc-conversation" role="log" aria-live="polite" aria-label="Travel questions and answers">
            {conversation.map((entry, index) => (
              <div className="ask-dc-exchange" key={`${index}-${entry.question}`}>
                <div className="ask-dc-question"><strong>You:</strong> {entry.question}</div>
                <div className="ask-dc-answer">
                  <strong>DC Explorer:</strong> {entry.reply}
                  {entry.usage.truncated && <div className="ask-dc-truncated">This answer may have been cut off at the token limit.</div>}
                  <div className="ask-dc-metadata">
                    Model: {entry.model} · Temperature {entry.settings.temperature} · Top-p {entry.settings.topP} · Max {entry.settings.maxOutputTokens} tokens
                    <br />Tokens: {entry.usage.promptTokens} prompt + {entry.usage.outputTokens} answer = {entry.usage.totalTokens} total
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        <small>AI responses are based on this guide’s DC facts and may not reflect live hours, fares, or availability. Check official websites for current details.</small>
      </div>
    </section>
  );
}
