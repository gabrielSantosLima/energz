# Writing rules checklist

Use this checklist right before returning the message.

## Do

- Use the language the user picked in Step 1.
- Keep 4 to 7 bullets, one line each.
- Lead with what the user can do or notice.
- Group related changes into a single bullet.
- Keep sentences short and friendly.
- Summarize invisible fixes as one "stability" bullet.

## Don't

- Don't mention commit hashes, file names, branches or version numbers.
- Don't mention refactors, dependencies, CI, tests or tooling.
- Don't use words like API, agent, job, payload, retry, migration or endpoint.
- Don't add emoji, extra headings or a closing paragraph.
- Don't list more than 7 bullets.
- Don't invent features that are not in the release commits.

## Quick check

1. Would a non-technical user understand every bullet? If not, rewrite it.
2. Does every bullet describe something visible in the app? If not, cut it.
3. Is the message shorter than the commit log? If not, cut more.
