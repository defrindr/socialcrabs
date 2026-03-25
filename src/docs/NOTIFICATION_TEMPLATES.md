# ClawSocial Notification Templates

**MANDATORY REFERENCE** — All notifications MUST match these templates exactly.

---

## Agent-Driven Comment System

ClawSocial uses an **agent-driven approach** for comments:

1. **Agent reads the content** (tweet, article, post)
2. **Agent reads VOICE.md** for the user's style guide
3. **Agent generates a unique, contextual comment**
4. **Comment is logged** to prevent repetition

### VOICE.md Example

```markdown
# VOICE.md — Comment Style Guide

## Core Rules

- **8th grade reading level** — simple words, short sentences
- **Max 2 sentences** — most comments should be 1 sentence
- **10-25 words** — if it's longer, cut it
- **Ask questions** — engage, don't lecture

## ✅ DO — Real Examples

"15x performance improvement is wild. What's your content strategy?"
"Spot on analogy 💯"
"That's exactly it."
"Smart move. Context switching between AIs is painful."

## ❌ DON'T — AI Patterns to Avoid

"Fascinating approach!"
"Excellent analysis!"
"Love this systematic approach!"
"The intersection of X and Y is where things get really interesting"
```

---

## 🐦 X ENGAGEMENT REPORT

```
🐦 **X ENGAGEMENT** ✅

**Tweet:** [full URL]
**Author:** @[username]
**Preview:** "[first 80 chars of original tweet]"

**Actions:**
• ❤️ Liked: ✅
• 💬 Replied: "[your contextual reply]"

**Language:** [EN/PT/ES/etc]
**Behaviors:** Home feed viewed, search performed
**Time:** [YYYY-MM-DD HH:MM:SS UTC]

_ClawSocial X/Twitter Automation_
```

### Fields Required:

- `author` — Username without @
- `preview` — First 80 chars of the original tweet
- `reply` — Your contextual reply text (NOT a template)
- `language` — Detected language code
- `behaviors` — What human-like behaviors were done

---

## 🐦 X FOLLOW REPORT

```
👥 **X FOLLOW** ✅

**Target:** @[username]
**Profile:** [full profile URL]
**Followers:** [count formatted: 1.5K, 12.3K, etc]

**Queue:** [remaining] accounts left
**Time:** [YYYY-MM-DD HH:MM:SS UTC]

_ClawSocial X/Twitter Automation_
```

### Fields Required:

- `username` — Target username
- `profileUrl` — Full profile URL
- `followers` — Follower count (will be formatted)
- `queueRemaining` — How many left in queue

---

## 🔗 LINKEDIN ENGAGEMENT REPORT

```
🔗 **LINKEDIN ENGAGEMENT** ✅

**Article:** "[Title]"
**Author:** [Author name]
**URL:** [full article URL]

**Actions:**
• ❤️ Liked: ✅
• 💬 Commented: "[your contextual comment]"

**Behaviors:** Article read, liked
**Time:** [YYYY-MM-DD HH:MM:SS UTC]

_ClawSocial LinkedIn Automation_
```

### Fields Required:

- `title` — Title of the article
- `author` — Author name (if known)
- `url` — Full article URL
- `comment` — Your contextual comment (NOT a template)
- `behaviors` — What was done

---

## 🔗 LINKEDIN CONNECTION REPORT

```
🔗 **LINKEDIN CONNECTION** ✅

**Profile:** [username/name]
**URL:** [full profile URL]
**Degree:** [2nd/3rd]
**Method:** [Direct/More dropdown]

**Time:** [YYYY-MM-DD HH:MM:SS UTC]

_ClawSocial LinkedIn Automation_
```

### Fields Required:

- `username` — Profile username/name
- `profileUrl` — Full profile URL
- `degree` — Connection degree
- `method` — How the connect was done

---

## 📸 INSTAGRAM ENGAGEMENT REPORT

```
📸 **INSTAGRAM ENGAGEMENT** ✅

**Target:** @[username]
**Post:** [full post URL or "N/A"]

**Actions:**
• ❤️ Liked: ✅
• 💬 Commented: "[your contextual comment]"

**Behaviors:** Profile viewed, post liked
**Time:** [YYYY-MM-DD HH:MM:SS UTC]

_ClawSocial Instagram Automation_
```

### Fields Required:

- `author` — Target username with @
- `postUrl` — Post URL or "N/A"
- `comment` — Your contextual comment (NOT a template)
- `behaviors` — What was done

---

## ❌ ERROR REPORTS

```
❌ **[PLATFORM] [ACTION]** ❌

**Target:** [URL or username]
**Error:** [error message]
**Attempted:** [what was tried]

**Time:** [YYYY-MM-DD HH:MM:SS UTC]

_ClawSocial [Platform] Automation_
```

---

## Comment Quality Examples

### ❌ BAD (Generic Templates)

```
"This is fire! 🔥"
"Love this! ❤️"
"Great insights here!"
"Amazing content! 🙌"
"Thanks for sharing!"
```

### ✅ GOOD (Contextual, Dynamic)

```
"That 15x improvement is wild. What's your caching strategy?"
"Spot on. The config drift problem is real."
"Smart approach. Did you hit any rate limits?"
"Nice setup. How long did migration take?"
"Interessante! Qual framework você usou?" (Portuguese)
```

### Key Differences:

| Bad             | Good                        |
| --------------- | --------------------------- |
| Generic praise  | References specific content |
| Any post fits   | Only fits THIS post         |
| Template-able   | Unique each time            |
| No questions    | Often asks follow-up        |
| Always positive | Sometimes skeptical         |

---

## Formatting Rules

1. **Headers:** Use `**bold**` for Telegram markdown
2. **Bullets:** Use `•` not `-`
3. **Checkmarks:** Use ✅ and ❌
4. **Footer:** Always italicized `_ClawSocial [Platform] Automation_`
5. **No extra blank lines** between fields
6. **URLs:** Full URLs, not shortened
7. **Quotes:** Wrap comment text in `"quotes"`
8. **Time:** Always include UTC timestamp

---

## CLI Usage

Pass context as JSON:

```bash
npm run cli -- notify report twitter engagement <url> --context='{"author":"username","preview":"First 80 chars...","reply":"Your contextual reply","language":"EN","behaviors":"Home feed viewed"}'
```

ClawSocial formats automatically using these templates.

---

## Storage: Comment Logs

To avoid repetition, log all comments:

```bash
# Append to comment log
echo "$(date +%Y-%m-%d\ %H:%M) | @username | Your comment text" >> ~/clawd/x-comments.txt
```

**Format:**

```
# ~/clawd/x-comments.txt
2026-02-06 15:30 | @user1 | That's wild. What stack?
2026-02-06 15:45 | @user2 | Spot on 💯
2026-02-06 16:03 | @user3 | Smart move. Did it work?
```

Before commenting, read the log to avoid similar phrases.
