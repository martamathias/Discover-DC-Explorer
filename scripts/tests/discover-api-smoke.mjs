// Run against an isolated API server with no GEMINI_API_KEY or DATABASE_URL.
import assert from 'node:assert/strict';
const base = process.env.TEST_API_URL || 'http://localhost:8080/api';
let checks = 0;
async function check(path, options, expected, pattern) {
  const response = await fetch(base + path, options);
  const body = await response.json();
  assert.equal(response.status, expected, JSON.stringify(body));
  if (pattern) assert.match(body.error, pattern);
  checks++; return body;
}
const post = (body) => ({ method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
await check('/healthz', undefined, 200);
const prompt = await check('/chat/system-prompt', undefined, 200);
assert.ok(prompt.wordCount > 0 && prompt.systemPrompt.includes('Washington'));
await check('/chat', post({ message: '' }), 400, /question/);
await check('/chat', post({ message: 'Hello', settings: { temperature: 9 } }), 400);
await check('/chat', post({ message: 'What should I see?' }), 503, /GEMINI_API_KEY/);
await check('/dishes', undefined, 503, /database/);
await check('/dishes/nope/image', undefined, 404, /not found/);
await check('/dishes', post({ title: 'Food', image: 'data:image/gif;base64,R0lGODlh' }), 400, /GIF/);
await check('/dishes', post({ title: 'Food', image: 'data:image/png;base64,aGVsbG8=' }), 400, /format/);
await check('/dishes', post({ title: '', image: 'data:image/png;base64,aGVsbG8=' }), 400, /title/);
await check('/dishes', post({ title: 'Food', image: 'data:image/jpeg;base64,' + Buffer.alloc(3 * 1024 * 1024 + 1, 255).toString('base64') }), 413, /3 MB/);
await check('/dishes', post({ title: 'Food', image: 'a'.repeat(6 * 1024 * 1024) }), 413, /too large/);
await check('/dishes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{' }, 400, /invalid JSON/);
console.log(`${checks} API smoke checks passed.`);
