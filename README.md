# Discover DC Explorer

A public Washington, DC visitor guide with Gemini chat, Prompt Lab controls, and an inspected dish-photo gallery. No visitor account is required.

## Configuration

Set `GEMINI_API_KEY` on the API server for chat and dish inspection. `GEMINI_MODEL` optionally overrides the default `gemini-2.5-flash`. Set `DATABASE_URL` to a PostgreSQL database for dish-photo persistence. Keep both credentials in server secrets; never put them in browser code.

The dish gallery creates its `dish_photos` table on first use. The table is also declared in the Drizzle schema. Only photos approved by the inspector (`isMatch === true` and `confidence >= 0.7`) are saved. A database or inspector error prevents a save and returns a visible error. Existing gallery records survive API server restarts because they live in PostgreSQL.

## Features

- Gemini city chat with system prompt display, temperature/top-p/output-limit controls, token usage, and truncation notices.
- JPEG, PNG, or WebP uploads under 3 MB; browser resizing to at most 1280 pixels.
- LangChain `ChatGoogle.withStructuredOutput` photo inspection, using a Zod result schema and treating image text, titles, and captions as untrusted input.
- Newest-first public gallery with photo, title, caption, date, and inspector description.
- Parameterized database writes and separate image-serving endpoints. Gallery list responses omit image payloads.

## Validation

`pnpm run typecheck` checks all workspace projects. Production build commands are defined in each artifact's Replit configuration. To run the isolated API smoke checks, start the built API server without `GEMINI_API_KEY` or `DATABASE_URL`, then run `node scripts/tests/discover-api-smoke.mjs`. These checks validate input rejection and configuration errors; they do not test live Gemini responses or a live database.

The Replit workspace must pull the GitHub changes and republish to update the public site. This repository change alone does not update the Replit deployment.
