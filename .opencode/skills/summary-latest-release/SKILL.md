---
name: Summary latest release
description: Write a short, non-technical summary of the latest release in Brazilian Portuguese or English. Use when the user asks for a release message, release notes, or a summary of what changed recently.
---

# Summary latest release

Create a short, user-facing message about the latest release. The readers are
end users, not developers.

## Step 1 — Ask the language (required, every time)

Before doing anything else, ask which language to use with a multiple-choice
question (`question` tool, single selection) containing exactly these options:

1. `Português (Brasil)` — pt-BR
2. `English` — en

Ask even when the request, the conversation, or previous messages are already in
Portuguese or English. Never infer the language from context.

## Step 2 — Collect the release scope

Run these commands in the repository root:

1. `git describe --tags --abbrev=0` — latest release tag.
2. `git log --oneline <latest-tag>..HEAD` — changes after that tag.
3. If the range is empty, use `git log --oneline <previous-tag>..<latest-tag>`.

Ignore merge commits and `chore(release)` commits. If both ranges are empty,
say there is nothing new to summarize and stop.

## Step 3 — Translate commits into user-facing changes

- Group related commits into one bullet (for example, several sync fixes become
  one "sincronização mais estável" bullet).
- Keep only what the user can notice or do in the app.
- Drop everything internal: refactors, dependency bumps, CI, tests, tooling,
  migrations, file names, hook or service names.
- Fixes without a visible outcome become a single "ajustes de estabilidade" or
  "bug fixes" bullet.
- Never invent features that are not in the commits.

## Step 4 — Write the message

- Start with the title `O que mudou` (pt-BR) or `What changed` (en), in bold.
- 4 to 7 bullets, one line each, ordered by user impact.
- Plain, friendly language. Short sentences.
- Avoid technical vocabulary: API, refactor, agent, job, commit, dependency,
  retry, payload, migration, CI.
- No file names, commit hashes, branch names or version numbers unless the user
  asks for them.
- No emoji. No headings besides the title. No closing paragraph.
- Output only the message, in the chosen language.

## References

- `references/writing-rules.md` — concise do/don't checklist before answering.

## Example (pt-BR)

**O que mudou**

- Agora dá para sincronizar seus dados com outro aparelho por proximidade, sem internet.
- Registre a leitura de hoje direto da tela inicial, em poucos toques.
- A leitura da conta ficou mais precisa, usando a foto e o texto juntos.
- Se a leitura demorar, aparece um botão para cancelar.
- A sincronização entre aparelhos está mais estável, com mensagens claras quando algo precisa de atenção.

## Example (en)

**What changed**

- You can now sync your data with another device nearby, with no internet.
- Log today's reading right from the home screen in a few taps.
- Bill scanning is more accurate by using both the photo and the text.
- If the scan takes too long, a cancel button appears.
- Syncing between devices is more stable, with clear messages when something needs attention.
