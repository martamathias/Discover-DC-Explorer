import { useState, type FormEvent } from 'react';
import './AskDCExplorer.css';

const topics = [
  { terms: ['free', 'budget', 'cost'], answer: 'Explore the Lincoln Memorial, Washington Monument grounds, National Mall, National Gallery of Art, and many Smithsonian museums for free. Check official sites for timed-entry requirements.' },
  { terms: ['ethiopian', 'injera'], answer: 'DC has a vibrant Ethiopian food scene. Explore restaurants around Shaw and U Street for injera and traditional shared platters. Check current menus and hours before visiting.' },
  { terms: ['kid', 'family', 'children'], answer: 'For families, try the Smithsonian National Museum of Natural History, National Air and Space Museum, and a walk along the National Mall. Check museum entry requirements before visiting.' },
  { terms: ['metro', 'train', 'bus', 'transport'], answer: 'Use Metrorail and Metrobus to explore DC. Pay with a SmarTrip card or supported contactless payment. Check wmata.com for current fares, routes, and service updates.' },
  { terms: ['museum', 'history', 'art'], answer: 'Start with the Smithsonian National Museum of Natural History, National Air and Space Museum, National Museum of African American History and Culture, or National Gallery of Art. Many are free; some require timed-entry passes.' },
  { terms: ['monument', 'landmark', 'memorial', 'sight'], answer: 'Start at the National Mall for the Lincoln Memorial and Washington Monument. The White House can be viewed from Lafayette Square. Wear comfortable shoes!' },
  { terms: ['food', 'eat', 'restaurant'], answer: 'Try Ethiopian food around Shaw or U Street, a DC half-smoke at Ben’s Chili Bowl, or browse food options at Eastern Market and Union Market.' },
  { terms: ['neighborhood', 'georgetown', 'street'], answer: 'Explore Georgetown for historic streets and waterfront views, U Street for music and cultural history, and Penn Quarter for museums and dining.' },
  { terms: ['season', 'spring', 'summer', 'fall', 'winter', 'weather'], answer: 'Spring brings cherry blossoms, summer can be hot and humid, fall is comfortable for walking, and winter is often quieter. Check the forecast before your visit.' },
];

const suggestions = ['What can I do for free?', 'Where can I eat Ethiopian food?', 'What can I do with kids?', 'How do I use the Metro?'];

function findAnswer(question: string): string {
  const text = question.toLowerCase();
  const match = topics.find((topic) => topic.terms.some((term) => text.includes(term)));
  return match?.answer ?? 'I can help with DC museums, landmarks, free attractions, Ethiopian food, neighborhoods, family activities, and Metro travel. Try asking about one of those topics!';
}

export default function AskDCExplorer() {
  const [question, setQuestion] = useState('');
  const [conversation, setConversation] = useState<{ question: string; answer: string }[]>([]);

  function ask(value: string) {
    const trimmed = value.trim();
    if (!trimmed) return;
    setConversation((previous) => [...previous, { question: trimmed, answer: findAnswer(trimmed) }]);
    setQuestion('');
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    ask(question);
  }

  return (
    <section id="ask-dc" className="ask-dc-section" aria-labelledby="ask-dc-title">
      <div className="ask-dc-panel">
        <span className="ask-dc-eyebrow">YOUR DC TRAVEL HELPER</span>
        <h2 id="ask-dc-title">Ask DC Explorer Anything!</h2>
        <p>Questions about museums, food, landmarks, neighborhoods, or getting around? Start here.</p>
        <form onSubmit={submit} className="ask-dc-form">
          <label className="ask-dc-sr-only" htmlFor="ask-dc-input">Ask a question about Washington DC</label>
          <input id="ask-dc-input" value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="What would you like to explore in DC?" />
          <button type="submit">Ask DC Explorer</button>
        </form>
        <div className="ask-dc-suggestions" aria-label="Suggested questions">
          {suggestions.map((suggestion) => <button key={suggestion} type="button" onClick={() => ask(suggestion)}>{suggestion}</button>)}
        </div>
        {conversation.length > 0 && (
          <div className="ask-dc-conversation" role="log" aria-live="polite" aria-label="Travel questions and answers">
            {conversation.map((entry, index) => (
              <div className="ask-dc-exchange" key={`${index}-${entry.question}`}>
                <div className="ask-dc-question"><strong>You:</strong> {entry.question}</div>
                <div className="ask-dc-answer"><strong>DC Explorer:</strong> {entry.answer}</div>
              </div>
            ))}
          </div>
        )}
        <small>Answers are from a built-in DC guide, not live AI. Check official websites for up-to-date details.</small>
      </div>
    </section>
  );
}
