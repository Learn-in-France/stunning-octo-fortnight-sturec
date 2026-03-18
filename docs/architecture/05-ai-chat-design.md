# AI Chat Architecture

## Philosophy

The AI is an extension of a human counsellor, not a lead capture chatbot.

### Correct behavior
- Conversational guidance
- Understanding student goals first
- Giving useful information before suggesting next steps
- Answering questions about France, visa, costs, housing naturally
- Only suggesting counsellor when it genuinely adds value

### Incorrect behavior
- Pushing counselling sessions aggressively
- Asking for contact details immediately
- Forcing booking links early
- Feeling like a form or qualification pipeline
- Urgency tactics or sales language

## Implementation

### Direct Groq API (NOT LangGraph)
We use direct Groq API calls with a well-crafted system prompt. No framework.

Why not LangGraph: It would make the conversation feel mechanical with rigid state transitions. The student experience should flow naturally. If a student jumps topics, the AI handles it gracefully instead of trying to force them back into a phase.

### Model
Primary: `llama-3.3-70b-versatile` on Groq. Fast, strong reasoning, good structured output.

### System Prompt Structure
The system prompt defines:
1. Personality: warm, supportive, knowledgeable academic advisor
2. Tone: neutral language, short explanations, structured bullet points
3. Knowledge boundaries: only recommend from provided program database, never invent universities
4. Phase guidance (soft, not enforced): background → goals → eligibility → recommendations → handoff
5. Output contract: alongside natural response, output structured JSON assessment
6. Handoff rules: only suggest counsellor when it genuinely helps

### Context Window Management
Per design doc: only last 6-8 messages sent to Groq.

```
messages = [
  system_prompt,                        // ~500 tokens
  student_profile_memory,               // structured JSON of what we know so far
  program_results (if queried),         // injected DB results
  ...last_6_to_8_conversation_messages  // from chat_messages table
]
```

`student_profile_memory` is rebuilt from the latest AI assessment JSON. This is how the AI "remembers" profile data even when older messages drop off.

### Program Database Tool
The AI does NOT query the database directly. The backend mediates:

1. AI's structured output indicates `should_recommend_programs: true`
2. Backend runs Prisma query using collected profile fields:
   ```sql
   SELECT programs + universities
   WHERE gpa >= student_gpa
   AND english_min <= student_score
   AND tuition <= student_budget
   AND intake includes student_preferred_intake
   AND active = true
   ```
3. Results injected into the AI's next context
4. AI presents recommendations naturally in conversation

### Structured Output Contract
After each meaningful exchange, the AI also outputs:

```json
{
  "profile_completeness": 0.7,
  "fields_collected": ["degree_level", "gpa", "english_score", "budget"],
  "fields_missing": ["preferred_city", "intake", "housing_needed"],
  "academic_fit_score": 8,
  "financial_readiness_score": 6,
  "language_readiness_score": 5,
  "motivation_clarity_score": 7,
  "timeline_urgency_score": 8,
  "document_readiness_score": 4,
  "visa_complexity_score": 3,
  "visa_risk": "medium",
  "housing_needed": null,
  "recommended_next_step": "continue_chat",
  "recommended_disposition": "request_more_info",
  "summary_for_team": "Strong academic profile, budget needs clarification",
  "should_recommend_programs": false,
  "should_suggest_counsellor": false
}
```

This JSON:
- Is NEVER shown to the student
- Is saved to `ai_assessments` table
- Drives backend decision logic
- Is what counsellors see as "AI assessment summary"

The model provides the component signals. The backend then computes and persists:
- `qualification_score` (`0-100`)
- `priority_level` (`p1`, `p2`, `p3`)

This keeps final operational routing explainable and deterministic instead of giving the model full authority over qualification.

### Backend Decision Layer
The backend (not the AI) makes operational qualification and routing decisions:

```
weighted_score =
  academic_fit_score * 0.25 +
  financial_readiness_score * 0.20 +
  language_readiness_score * 0.15 +
  motivation_clarity_score * 0.10 +
  timeline_urgency_score * 0.10 +
  document_readiness_score * 0.10 +
  (10 - visa_complexity_score) * 0.10

qualification_score = round(weighted_score * 10)

if missing target_program OR missing preferred_intake OR missing funding clarity:
    qualification_score = min(qualification_score, 59)

if severe academic mismatch against target programs:
    qualification_score = min(qualification_score, 59)

if qualification_score >= 80:
    lead.status = qualified
else:
    lead.status = nurturing

priority_level =
    p1 if qualification_score >= 80
    p2 if qualification_score between 60 and 79
    p3 otherwise

if timeline_urgency_score >= 8 AND qualification_score >= 60:
    raise priority_level one band (max p1)

if profile_completeness >= 0.7 AND should_recommend_programs:
    → run program DB query
    → inject results into next AI context

if session ends:
    → save final ai_assessment
    → emit job: lead routing (priority queue vs nurture vs manual review)
```

Operational rules:
- students never see `qualification_score`, `priority_level`, `recommended_disposition`, or `visa_complexity_score`
- admins/counsellors see the score breakdown and why the lead landed in `p1`, `p2`, or `p3`
- disqualification is always human-driven even if AI recommends manual review

### Interactive Options
At natural moments, the AI presents choices rendered as clickable buttons:
```
What would you like to explore next?
• Learn about programs that match your profile
• Understand the visa process
• Estimate your living costs in France
• Speak with an advisor
```
The AI decides when to offer them. The frontend renders them as buttons.

### Auth-First Chat Entry
Cold leads must sign in before starting chat. The public website can market the AI advisor and show a chat CTA, but the actual conversation begins only after Firebase login (Google or email+password).

Benefits of this flow:
- every chat session has a known `user_id` from the first message
- backend creates or reuses the lead before opening the chat session
- no anonymous session migration
- no deferred Firebase linking or email-match reconciliation

Recommended public CTA copy:
- "Sign in to talk to your France study advisor"
- "Get matched to programs that fit your profile"
- "Talk to an AI advisor who understands France admissions"
- "Track your application journey from start to arrival"
- "Free, takes 10 seconds with Google sign-in"

### Language Support
Phase 1: English only. System prompt, conversation, and UI all in English. Primary audience is Indian students applying to English-taught programs in France. French language support is a Phase 2 consideration — Llama 3.3 70B handles French well, and the system prompt can be made bilingual when needed.

### AI and Documents: Clarification
The AI does NOT read, parse, or analyze document content (no OCR, no PDF reading, no content extraction). However, when a document is uploaded, the **backend** can trigger an AI re-assessment of the student's overall readiness based on which document types now exist (e.g., "transcript uploaded → profile completeness increases"). This is a metadata-level re-scoring, not document content analysis. The `ai_assessments.source_type=document` refers to this: an assessment triggered by the event of a document upload, not by reading the document itself.

## AI for University Leads (Non-Chat)

University leads are bulk-imported with structured data (GPA, field, target programs, documents) but never go through the qualification chat. The AI still adds value through two mechanisms:

### Batch Profile Assessment (MVP)
When the `imports` worker creates a university lead, it chains an `ai-processing` job for each lead. The AI receives the imported structured data (not a chat transcript) and produces the same `ai_assessments` output:

```json
{
  "profile_completeness": 0.6,
  "fields_collected": ["degree_level", "gpa", "target_program"],
  "fields_missing": ["english_score", "budget", "french_level"],
  "academic_fit_score": 7,
  "financial_readiness_score": null,
  "language_readiness_score": null,
  "motivation_clarity_score": 6,
  "timeline_urgency_score": 7,
  "document_readiness_score": 3,
  "visa_complexity_score": 4,
  "visa_risk": null,
  "summary_for_team": "Strong GPA for target program, missing language and financial data",
  "recommended_disposition": "request_more_info",
  "source_type": "import"
}
```

This gives counsellors an instant readiness snapshot without manual review. The backend computes the same `qualification_score` and `priority_level` from these component signals. The assessment uses `source_type=import` to distinguish from chat-based assessments.

### Gap Analysis & Action Plan Generation (MVP)
Alongside the assessment, the AI compares the imported profile against:
- Target program's eligibility rules (`eligibility_rules` table)
- Required documents for the student's stage (`visa_requirements`, `student_document_requirements`)
- Campus France prep requirements

Output is a structured gap list:
```json
{
  "missing_documents": ["financial_proof", "tcf_score_certificate"],
  "missing_profile_fields": ["french_level", "budget_range"],
  "suggested_next_actions": [
    "Request TCF/TEF score",
    "Upload financial proof (bank statement or sponsor letter)",
    "Complete Campus France motivation letter"
  ],
  "readiness_for_stage": "intake_completed",
  "blockers": ["No language certification on file"]
}
```

This auto-populates the student's document checklist and next actions when they are converted from lead to student.

### Phase 2: Additional AI for University Leads
- **Smart counsellor routing**: use priority plus AI-scored complexity (multiple targets, visa risk, GPA gap) to match with counsellor expertise/workload instead of simple admin queue review
- **Personalized outreach drafts**: AI generates first-touch messages for counsellors based on the lead's profile
- **Profile completion chat**: Shorter, focused chat (5 questions) to fill gaps in imported data — different prompt template from cold-lead qualification
- **Campus France prep generation**: AI creates personalized interview prep materials based on student profile

### What AI Does NOT Do (Phase 1)
- Make admission promises
- Guarantee visa outcomes
- Read, parse, or analyze document content (no OCR, no PDF analysis)
- Make autonomous routing decisions (backend decides)
- Access the actual content of student documents or financial files
- Store or reference other students' information

## Knowledge Base Sources (Required Datasets)
The AI references these via the backend, not directly:

1. **University and program database** — `universities` + `programs` tables
2. **Admission eligibility matrix** — `eligibility_rules` table
3. **Tuition and budget tiers** — `programs.tuition_amount` fields
4. **Visa documentation requirements** — `visa_requirements` table
5. **Campus France interview preparation** — `campus_france_prep` table

All admin-managed via catalog CRUD endpoints. No redeployment needed to update.
