# MarkM8 Functional Requirements

**What we're building:** Pay-per-essay AI grading platform for students

---

## Overview

### Product Description

MarkM8 provides AI-powered essay grading for students. Users submit essays through a web interface and receive detailed feedback with grade ranges within 60 seconds.

### Core Value Proposition

- Multi-model grading (3 AI models for accuracy)
- Detailed feedback (category scores + actionable suggestions)
- Fast results (95% graded within 60 seconds)
- Pay-per-use (no subscriptions, 1 free essay to start)

### Target Users

**Launch:**
- Individual students (high school, undergraduate, postgraduate)
- Self-directed learners
- Test prep students

### Scale Targets

- Launch: 10 concurrent users, 10 essays/day
- Month 1-2: 500 concurrent users, 500 essays/day

---

## User Journeys

### 1. Sign Up & Onboarding

**Flow:**
1. User visits landing page at `/`
2. Clicks "Get Started" → redirected to Clerk sign-in
3. Signs in with Google, Apple, or Magic Link
4. On first signup:
   - User record created in database
   - Credits record created with `balance: 1.00` (signup bonus)
   - CreditTransaction record: `type: 'signup_bonus', amount: 1.00`
5. Redirected to `/dashboard`

**Landing Page Requirements:**
- Hero section explaining MarkM8's value proposition
- Features section (AI grading, detailed feedback, fast results)
- Pricing section (credit packages)
- Call-to-action: "Get Started" button
- Footer with links (About, Privacy, Terms)

---

### 2. Submit Essay for Grading

**Navigation:** `/dashboard` → "Submit New Essay" → `/submit`

#### Tab 1: Assignment Brief

- **Title** (required)
  - Max 200 characters
  - Example: "Renaissance Art History Essay"
- **Instructions** (required)
  - Max 5000 characters
  - What the assignment asks for
  - Example: "Analyze the impact of the Medici family on Renaissance art..."
- **Subject** (required)
  - Free text field
  - Examples: "History", "English Literature", "Psychology", "Computer Science"
- **Academic Level** (required)
  - Dropdown: "High School", "Undergraduate", "Postgraduate"
  - Affects grading expectations
- **Custom Rubric** (optional)
  - Max 2000 characters
  - Specific criteria to grade against
  - Example: "Focus on thesis clarity (30%), evidence quality (40%), writing style (30%)"

#### Tab 2: Focus Areas (optional)

- Up to 3 specific areas to emphasize in feedback
- Each area: max 100 characters
- Examples:
  - "Thesis statement clarity"
  - "APA citation format"
  - "Counter-argument strength"
- If provided, AI emphasizes these in detailed feedback

#### Tab 3: Essay Content

- **Upload File** OR **Paste Text**
  - Supported formats: PDF, DOCX
  - Document parsing extracts text content
- **Word Count Display**
  - Real-time count as user types
  - Min: 50 words
  - Max: 50,000 words
  - Error if outside range
- **Cost Estimator**
  - Shows: "This will cost **1.00 credits** (~$0.30)"
  - Updates based on word count (currently flat rate)
- **Draft Autosave**
  - Saves every 2 seconds
  - One draft per user (overwrites previous draft)
  - Includes all 3 tabs (all fields can be partial/null)
  - Restores draft on return to `/submit`
- **Submit Button**
  - Validates all required fields
  - Checks credit balance ≥ 1.00
  - If insufficient: Show error "Insufficient credits. [Buy Credits]"
  - Transitions essay from 'draft' → 'submitted'
  - Creates grade record (status: 'queued')
  - Redirects to `/grades/[id]`

---

### 3. View Grading Status & Results

**Status Page:** `/grades/[id]`

#### Status: Queued

- Message: "Your essay is in the queue..."
- Shows position in queue (if available)
- Real-time connection established, waiting for updates

#### Status: Processing

- Message: "Grading in progress..."
- Real-time updates:
  - "Checking your essay..." (step 1)
  - "Running multi-model evaluation..." (step 2)
  - "Analyzing feedback..." (step 3)
- Progress indicator (optional: show steps 1/4, 2/4, etc.)

#### Status: Failed

- Error message: "Grading failed. You were not charged. Please try again."
- Reason (if available): "API timeout" or "Service unavailable"
- **[Retry]** button → creates new grade record for same essay
- No credit deduction occurred (no-hold model)

#### Status: Complete - Full Results

**Grade Summary:**
- **Grade Range:** "B to B+" or "82-87%"
  - Displays letter grade range if spread ≤ 1 grade (e.g., B-B+)
  - Otherwise shows percentage range
- **Individual Model Scores** (collapsed by default):
  - Model 1 (Grok-4): 82% ✓ Included
  - Model 2 (Grok-4): 87% ✓ Included
  - Model 3 (Grok-4): 95% ✗ Excluded (outlier)
  - Explanation: "Outlier detection excludes scores >10% different from all others"

**Overall Feedback:**

1. **Strengths** (3-5 items)
   - Structure: `{ title, description, evidence }`
   - Example:
     ```
     Title: "Strong Thesis Statement"
     Description: "Your thesis clearly articulates the central argument"
     Evidence: "In paragraph 1, you state 'The Medici family's patronage fundamentally transformed...'"
     ```

2. **Areas for Improvement** (3-5 items)
   - Structure: `{ title, description, suggestion, detailed_suggestions[] }`
   - Example:
     ```
     Title: "Transition Clarity"
     Description: "Some paragraph transitions are abrupt"
     Suggestion: "Use transitional phrases to connect ideas between paragraphs"
     Detailed Suggestions:
       - "Add 'Furthermore' or 'In addition' when introducing supporting points"
       - "Use 'However' or 'Conversely' for contrasting ideas"
       - "Reference previous paragraphs: 'Building on this point...'"
     ```

3. **Language Tips** (3-5 items)
   - Structure: `{ category, feedback }`
   - Example:
     ```
     Category: "Academic Tone"
     Feedback: "Avoid contractions like 'didn't' - use 'did not' in formal writing"
     ```

4. **Recommended Resources** (2-4 items)
   - Structure: `{ title, url?, description }`
   - Example:
     ```
     Title: "Purdue OWL - Thesis Statements"
     URL: "https://owl.purdue.edu/owl/general_writing/..."
     Description: "Comprehensive guide on crafting strong thesis statements"
     ```

**Category Scores** (each 0-100):
- **Content & Understanding:** 85
  - How well the essay demonstrates subject knowledge
- **Structure & Organization:** 78
  - Logical flow, paragraph structure, transitions
- **Critical Analysis:** 82
  - Depth of analysis, argument quality, evidence
- **Language & Style:** 88
  - Grammar, vocabulary, academic tone
- **Citations & References:** 75
  - Proper citation format, source quality

**Category-Specific Feedback** (optional, collapsed by default):
- For each category: detailed strengths and improvements
- Structure: `{ strengths[], improvements[] }` per category
- Example for "Structure & Organization":
  ```
  Strengths:
    - Clear topic sentences in each paragraph
    - Logical progression from introduction to conclusion
  Improvements:
    - Add transitional phrases between main sections
    - Conclusion could better synthesize arguments rather than summarize
  ```

**Actions:**
- **[View Essay]** - Shows original essay with optional highlighting
- **[Download PDF]** - Generates PDF with grade + full feedback
- **[Regrade]** (future) - Creates new grade for same essay
- **[Submit Another]** - Returns to `/submit`

---

### 4. Purchase Credits

**Navigation:** `/dashboard` → "Buy Credits" OR `/settings` → "Credits" tab

**Credit Balance Display:**
- Shown in navbar: "2.50 credits"
- Shown on settings page: "You have **2.50 credits** ($0.75 value)"

**Purchase Options:**
- **10 credits** = $3.00 ($0.30/essay)
- **50 credits** = $14.00 ($0.28/essay) - 7% discount
- **100 credits** = $25.00 ($0.25/essay) - 17% discount

**Checkout Flow:**
1. User clicks "Buy 10 Credits"
2. Redirected to Stripe hosted checkout
3. After successful payment:
   - Credits added to balance atomically
   - Transaction record created: `type: 'purchase', amount: 10.00`
   - Redirects back to `/settings?success=true`
4. Success message: "10 credits added! Your new balance: 12.50 credits"

---

### 5. View Essay History

**Navigation:** `/dashboard` → "History" OR `/history`

**Display:**
- Table of all past essays for this user
- Columns:
  - **Date Submitted** (descending)
  - **Title** (from assignment brief)
  - **Grade** (letter range or percentage range)
  - **Status** (badge: queued/processing/complete/failed)
  - **Actions** (View, Delete)
- Pagination: 20 per page
- Search: Filter by title
- Sort: By date, by grade (when complete)

**Row Click:** Navigates to `/grades/[id]`

**Delete:**
- Confirmation modal: "Delete this essay and grade? This cannot be undone."
- Soft delete: Sets `deletedAt` timestamp (audit trail preserved)
- Filter out deleted essays from history view

---

### 6. Settings & Account Management

**Navigation:** `/settings`

**Tabs:**

1. **Profile**
   - Email (read-only)
   - Name (editable)
   - Profile picture

2. **Credits**
   - Current balance
   - Purchase options
   - Transaction history:
     - Date, Type (Purchase/Deduction/Refund/Bonus), Amount, Balance After

3. **Billing**
   - Past payments
   - Download receipts

4. **Preferences** (future)
   - Email notifications (when essay graded)
   - Default academic level
   - Dark mode toggle

---

## Business Rules

### Credit Economics

**Credit Costs:**
- **Essay grading:** 1.00 credit (fixed, regardless of length)
- **Regrading:** 1.00 credit (creates new grade record)
- **User cost:** 1 credit = $0.25-$0.30 (depending on package)

**Signup Bonus:**
- Every new user receives **1.00 free credit**
- Allows risk-free trial
- Transaction type: `signup_bonus`

**Credit Pricing Tiers:**
| Package | Total Price | Price per Credit | Discount |
|---------|-------------|------------------|----------|
| 10 credits | $3.00 | $0.30 | 0% (base) |
| 50 credits | $14.00 | $0.28 | 7% |
| 100 credits | $25.00 | $0.25 | 17% |

### Credit Transaction Rules

**Deduction Timing (No-Hold Model):**
- Credits **deducted when grading completes successfully** (not at submission)
- If grading fails, **no credit deduction occurs** (user never loses the credit)
- Prevents charging for failed/incomplete grades
- **Note:** User messaging should say "You were not charged" rather than "refunded" since no deduction happened

**Atomic Operations:**
- Credit deduction + grade completion happens in single transaction
- Either both succeed or both fail (no partial states)

**Credit Checks:**
1. **At submission:** Check `balance >= 1.00`
   - If false, block submission with error message
2. **Before deduction:** Re-check balance during processing (race condition protection)
   - If insufficient, fail gracefully and notify user

**Refund Scenarios:**
- **Grading fails (API error, timeout):** No deduction occurred, so no refund needed. User can retry.
- **User reports error (admin verified):** Manual refund via admin dashboard (creates `refund` transaction type for audit purposes, even though no original deduction may have occurred)

### Grading Service Level Agreement (SLA)

**Performance Targets:**
- **95% of essays** graded within **60 seconds**
- **99% of essays** graded within **120 seconds**

**Timeout Handling:**
- Hard timeout: **5 minutes** (300 seconds)
- After 5 minutes: Mark grade as `failed`, no credit deduction (since credits only deducted on success)
- User can retry submission

**Retry Logic:**
- **3 automatic retries** on transient failures
- Exponential backoff: 5s, 15s, 45s
- After 3 failures: Mark as `failed`, no credit deduction

**Error Classification:**
- **Transient errors (retry):** Network timeouts, 503 Service Unavailable, rate limits
- **Permanent errors (fail immediately):** Invalid API key, 400 Bad Request, essay too long

### Multi-Model Consensus Algorithm

**Configuration:**
- Run **3 parallel instances** of Grok-4 on same essay
- Same prompt, same parameters
- Different responses due to LLM temperature/variance

**Outlier Detection:**
- Calculate relative difference between scores
- **Outlier threshold:** 10% relative difference
- Formula: `|score1 - score2| / max(score1, score2) > 0.10`
- **Exclude score if:** It differs >10% from **ALL** other scores

**Examples:**
- Scores: [82, 85, 87] → All included (differences ≤10%)
- Scores: [82, 85, 95] → Exclude 95 (differs >10% from both 82 and 85)
- Scores: [50, 75, 100] → Include all (all differ >10%, genuine disagreement)

**Grade Range Calculation:**
- **Included scores:** Use min and max of non-outlier scores
- **Letter grade range:** "B to B+" (if spread ≤ 1 grade)
- **Percentage range:** "82-87%" (always shown)

**Feedback Selection:**
- Use **lowest scorer's detailed feedback** (most critical perspective)
- **Category scores:** Average of all included models
- Rationale: Lowest scorer identifies most areas for improvement

---

## Page & Route Specifications

### Public Routes (No Auth Required)

**`/` - Landing Page**
- Hero section: "AI-Powered Essay Grading in 60 Seconds"
- Features grid:
  - "Multi-Model Grading" - 3 AI models for accuracy
  - "Detailed Feedback" - Category scores + actionable suggestions
  - "Fast Results" - 95% graded within 60 seconds
- Pricing section (credit packages)
- Social proof (testimonials, if available)
- CTA: "Get Started Free" (1 free essay)

**`/privacy` - Privacy Policy**
- Standard privacy policy
- Data collected, usage, third parties (Clerk, Stripe, OpenRouter)

**`/terms` - Terms of Service**
- Usage terms, refund policy, acceptable use

### Protected Routes (Auth Required)

**`/dashboard` - Main Dashboard**
- Credit balance widget (top-right)
- Quick actions:
  - **"Submit New Essay"** → `/submit`
  - **"Buy Credits"** → `/settings#credits`
- Recent essays (last 5):
  - Title, date, status, grade (if complete)
  - Click to view full results
- Stats (optional):
  - Total essays submitted
  - Average grade
  - Credits used

**`/submit` - Essay Submission Workflow**
- 3-tab interface (detailed in User Journey #2)
- Persistent draft (autosave every 2s)
- Progress indicator (tab 1 of 3, 2 of 3, 3 of 3)
- "Back" and "Next" buttons between tabs
- "Submit" button on final tab validates and transitions to 'submitted'

**`/grades/[id]` - Grade Status & Results**
- Dynamic based on grade status:
  - `queued` → Queue position + real-time connection
  - `processing` → Progress updates
  - `complete` → Full results (detailed in User Journey #3)
  - `failed` → Error message + retry button
- Breadcrumb: Dashboard → Grades → [Essay Title]

**`/history` - Essay History**
- Filterable, sortable table
- Pagination (20 per page)
- Search by title

**`/settings` - User Settings**
- Tabs: Profile, Credits, Billing, Preferences

### Admin Routes (Future Feature - Not in v3 Launch)

**Note:** Admin functionality is specified here for future implementation. For v3 launch, use direct database access or minimal admin tools. Full admin dashboard planned for v3.1+.

**Requires `isAdmin: true` (to be implemented):**

**`/admin` - Admin Dashboard Overview**
- **Platform Stats:**
  - Total users (with % growth this week)
  - Essays graded today / this week / all time
  - Revenue this week / this month
  - Average API cost per essay
  - Profit margin (real-time calculation)
- **Active Jobs:**
  - Queue status
  - Jobs in queue, processing, failed (last 24h)
- **Recent Activity:**
  - Last 10 signups
  - Last 10 essays submitted
  - Last 10 credit purchases

**`/admin/users` - User Management**
- **User List:**
  - Columns: Email, Name, Credits, Essays Submitted, Signup Date, Last Active
  - Search by email or name
  - Sort by any column
  - Click user → Detail view
- **User Detail View:**
  - Full profile
  - Credit balance
  - Transaction history
  - Essay history
  - **Admin Actions:**
    - **Adjust Credits:** Add/subtract with reason (logged)
    - **View as User:** Impersonate user session

**`/admin/transactions` - Transaction Log**
- All credit transactions
- Columns: Date, User Email, Type, Amount, Balance After, Notes
- Filter by: Type, Date range, User
- Export to CSV

**`/admin/analytics` - Analytics Dashboard**
- **Charts:**
  - Essays per day (last 30 days)
  - Revenue per day (last 30 days)
  - New signups per day (last 30 days)
  - Average grade distribution (histogram)
- **Insights:**
  - Most popular subjects
  - Average essay word count
  - Average grading time
  - Retry rate

---

## Admin Functionality Details

### Admin Actions Log

**Purpose:** Audit trail for all admin interventions

**Logged Actions:**
- Credit adjustments (add/subtract)
- Manual refunds
- User deletions
- Other admin overrides

**Required Data:**
- Which admin performed action
- Target user affected
- Action type
- Metadata (action-specific details)
- Timestamp

**Example Credit Adjustment:**
```json
{
  "adminId": "admin-123",
  "targetUserId": "user-456",
  "action": "adjust_credits",
  "metadata": {
    "amount": 5.0,
    "reason": "Compensation for grading error on essay-789",
    "previousBalance": 2.5,
    "newBalance": 7.5
  },
  "createdAt": "2025-01-15T10:30:00Z"
}
```

**Business Rules:**
- All admin credit adjustments must include a reason
- Reason must be ≥10 characters (prevents lazy logging)
- Admin actions are **never deletable** (audit trail integrity)
- Display admin actions in user detail view for transparency

---

## Error States & User Messages

### Submission Errors

| Error | User Message | Action |
|-------|-------------|---------|
| Insufficient credits | "You need 1.00 credits to grade this essay. You have 0.50 credits. [Buy Credits]" | Block submission, link to purchase |
| Word count too low | "Essay must be at least 50 words. Current: 32 words." | Disable submit button |
| Word count too high | "Essay exceeds 50,000 word limit. Current: 52,134 words. Please shorten your essay." | Disable submit button |
| Missing required field | "Please fill in all required fields: [Instructions]" | Highlight missing field |
| File upload failed | "Failed to upload file. Please try again or paste text directly." | Allow retry or paste text |
| Parsing failed | "Could not extract text from this file. Please check the format or paste text directly." | Fall back to paste text |

### Grading Errors

| Error | User Message | Recovery |
|-------|-------------|----------|
| API timeout (retry exhausted) | "Grading took too long and timed out. You were not charged. Please try again." | [Retry] button, no deduction occurred |
| API error (permanent) | "Grading failed due to a service error. You were not charged. Our team has been notified." | No deduction occurred, alert logged |
| Insufficient credits during processing | "You don't have enough credits to complete this grading. Please purchase more credits." | Graceful fail, no deduction (credits only deducted on success) |

### Payment Errors

| Error | User Message | Action |
|-------|-------------|---------|
| Stripe checkout failed | "Payment processing failed. Please try again or contact support." | Return to settings page |
| Webhook failed to update credits | (Silent to user) Admin alert | Admin manually reconciles |

---

## Data Validation Rules

### Essay Drafts (status = 'draft')

- **All fields optional** - Can be null or partial
- **No validation** - Accepts any incomplete data
- **Autosave pattern** - Upsert on userId where status = 'draft'
- **One draft per user** - Previous draft is overwritten

### Essay Submission (status = 'submitted')

When transitioning from 'draft' → 'submitted', validate:

- **Title:** Required, 1-200 characters, trim whitespace
- **Instructions:** Required, 1-5000 characters
- **Subject:** Required, 1-100 characters
- **Academic Level:** Required, enum validation
- **Custom Rubric:** Optional, 0-2000 characters
- **Focus Areas:** Optional, 0-3 items, each 1-100 characters
- **Essay Content:** Required, 50-50,000 words (word count via split on whitespace)

If validation fails, keep status as 'draft' and show error to user.

### Credit Purchases

- **Amount:** Must match exact package amounts (10, 50, 100)
- **User:** Must be authenticated
- **Webhook:** Signature must be valid

### Admin Actions

- **Reason:** Required for credit adjustments, min 10 characters
- **Amount:** For credit adjustments, must be non-zero number
- **Target User:** Must exist and not be deleted

---

This functional specification defines **what the system does** without prescribing **how it's built**. Implementation details (tech stack, code patterns, deployment) belong in the Technical Design document.
