# LIF First-Contact Qualification Gate — 6 Questions

**Why this exists:** validated against LIF's own labelled outcomes (June 2026), a demographic/profile score does **not** separate winners from losers. Every real disqualifier lives in the *conversation*, not in a profile field. These 6 questions, asked on the first WhatsApp / AI-chat touch, capture them — and would have filtered nearly every lead the team manually disqualified.

**How to use:** ask in order, capture each answer as a structured field, auto-tag on the disqualifier rules. Tone stays LIF-standard — warm, advisory, never pushy. Help is **free for students**; we're qualifying fit, not selling.

---

## The 6 questions (WhatsApp-ready wording)

**1. Programme**
> "Which course are you looking at — a Master in Management (MiM), or one of the specialised MSc programmes (AI & Digital Strategy, Data Science, Corporate Finance, International Business, Luxury, Arts & Cultural Management…)?"

- ✅ **Pass:** any BSB programme — MiM, MSc family, MBA/IMBA, Bachelor in Management.
- 🚫 **Disqualify / redirect** `prog_not_offered`: DBA, PhD/doctorate/research, pure Computer Science / HCI / Cybersecurity, Sports Management, pure-tech Engineering (Chemical, Mechanical, Mineral, Aerospace…), Medicine, Psychology, Public Policy, pure Maths/Physics.
  → *"We focus on business & management programmes at BSB, so that exact course isn't one we place into — but if you're open to [nearest BSB programme], I can tell you more."*

**2. Intake**
> "Are you planning to start in **September 2026**, or are you looking further ahead — 2027 or later?"

- ✅ **Pass:** Sep 2026 (active cycle).
- 🟡 **Defer** `timing_2027+`: 2027 / 2028 → long-term nurture (webinar/podcast/alumni stories), not a call-now lead.

**3. Funding**
> "Scholarships at BSB are merit-based and partial — they reduce the cost but don't cover everything. Are you able to self-fund the rest (with family or an education loan), or are you only able to go if it's **100% free**?"

- ✅ **Pass:** can self-fund part / has loan or family support.
- 🚫 **Disqualify** `scholarship_only`: needs 100% scholarship — BSB doesn't offer full-ride; set expectations honestly and deprioritise.

**4. France commitment**
> "Is **France** where you'd really like to study, or is it one option among a few countries you're weighing?"

- ✅ **Pass:** France is a genuine choice (alone or top of list).
- 🟡 **Caution / qualify** `france_weak`: Germany / UK / Ireland / Canada only, France incidental → qualify motivation before investing counsellor time.

**5. English**
> "All BSB programmes are taught **100% in English** — are you comfortable studying and interviewing in English?"

- ✅ **Pass:** comfortable / English-medium background / has or will take IELTS-TOEFL.
- 🚫 **Disqualify** `english_weak`: can't converse in English.

**6. Live contact**
> *(implicit — confirm a reply on WhatsApp)* "Great — is this WhatsApp number the best way to reach you for next steps?"

- ✅ **Pass:** responds on WhatsApp.
- 🚫 **Disqualify** `dead_contact`: number invalid / no response after the standard follow-up cadence.

---

## Disqualifier tags (for auto-routing)

| Tag | Trigger | Action |
|---|---|---|
| `prog_not_offered` | Q1 off-portfolio | Redirect to nearest BSB programme, else drop |
| `timing_2027+` | Q2 later than Sep 2026 | Long-term nurture funnel |
| `scholarship_only` | Q3 needs 100% free | Deprioritise — set expectations |
| `france_weak` | Q4 France incidental | Qualify motivation first |
| `english_weak` | Q5 not comfortable in English | Disqualify |
| `dead_contact` | Q6 no valid/responsive number | Disqualify |

**A lead with zero tags = a real, workable lead** → into the active pipeline, ranked by Intent (engagement + intake urgency). Tags are the gate; Intent is the rank.

---

## One-line summary
> **Intent score decides who you reach. These 6 questions decide who's real.** No demographic fit score in between — it's been proven not to predict conversion.

*Grounded in: `docs/bsb-india-fit-rubric.md` (ICP, for marketing), `scripts/icp/` (scored pool + validation).*
