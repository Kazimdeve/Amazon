# Agent Capture Verification

## Setup

- Tool: Codex Windows desktop app (Codex CLI `0.155.0-alpha.2.6` was used to create the two independent canary sessions)
- Model: `gpt-5.6-sol`, high reasoning effort
- Planning and execution: the same `gpt-5.6-sol` model handles both; there is no separate planner model
- Automatic mechanism: repo-scoped Codex lifecycle command hooks for `UserPromptSubmit` and `Stop`
- Hook configuration: `.codex/hooks.json`
- Capture script: `.codex/hooks/capture-agent-turn.ps1`
- Output directory: `.agent-logs/` (tracked; it is not ignored)

The `UserPromptSubmit` hook writes the verbatim `prompt` field. The `Stop` hook writes the `last_assistant_message` field. Both hooks receive the active session ID and model from Codex and timestamp their entries in UTC. They do not copy reasoning, tool calls, intermediate messages, diffs, or retries from the session transcript.

## Verified canary log paths

- `.agent-logs/2026-09-17_09-03-11_01a0ae9a-bdb1-7831-9506-658486a6b4cb.md`
- `.agent-logs/2026-09-17_09-04-23_01a0ae9b-e391-7623-a590-06c51e705ddd.md`

## Canary 1 — raw entries

[LOG_ENTRY type=PROMPT num=1 session=01a0ae9a]
timestamp: 2026-09-17T09:03:11.811Z
model: gpt-5.6-sol

CAPTURE TEST — 8x assignment, Kazim


[LOG_ENTRY type=RESPONSE num=1 session=01a0ae9a]
timestamp: 2026-09-17T09:03:29.482Z
model: gpt-5.6-sol

Capture received: **8x assignment — Kazim**.

## Canary 2 — raw entries

[LOG_ENTRY type=PROMPT num=1 session=01a0ae9b]
timestamp: 2026-09-17T09:04:23.404Z
model: gpt-5.6-sol

CAPTURE TEST — 8x assignment, Kazim


[LOG_ENTRY type=RESPONSE num=1 session=01a0ae9b]
timestamp: 2026-09-17T09:04:36.948Z
model: gpt-5.6-sol

Capture received: **8x assignment — Kazim**.

## Attempts that did not work

1. The first canary session ran before the new project hooks were trusted. Codex skipped the hooks, so no log was created. I opened Codex's hook review flow and persisted trust for both hook definitions.
2. After trust was enabled, both hook events started but exceeded the original 10-second timeout during a cold Windows PowerShell launch. I raised the timeout to 30 seconds and trusted the changed definitions.
3. The first completed capture decoded UTF-8 input through Windows PowerShell 5's legacy console encoding, corrupting the em dash. That failed log remains at `.agent-logs/2026-09-17_09-00-36_01a0ae98-42ad-7400-b2c5-47ce1062961d.md`. I changed the script to read raw stdin bytes and decode them explicitly as UTF-8. The two independent canaries above then passed byte-for-byte for the prompt text.
