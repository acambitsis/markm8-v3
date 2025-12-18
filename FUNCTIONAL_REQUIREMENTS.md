# MarkM8 Functional Requirements

**What we're building:** Pay-per-essay AI grading platform for students

---

## Overview

### Product Description

MarkM8 provides AI-powered essay grading for students. Users submit essays through a web interface and receive detailed feedback with grade ranges.

### Core Value Proposition

- Multi-model grading (3 AI models for accuracy)
- Detailed feedback (category scores + actionable suggestions)
- Pay-per-use (no subscriptions, configurable signup bonus)

### Target Users

**Launch:**
- Individual students (undergraduate initially, and then high school and postgraduate)
- Self-directed learners
- Learners who want to improve their writing skills and scores

### Scale Targets

- Launch: 10 concurrent users, 10 essays/day
- Month 1-2: 500 concurrent users, 500 essays/day

---

## User Journeys

### 1. Sign Up & Onboarding

**Flow:**
1. User visits landing page at `/`
2. Clicks "Get Started" → redirected to Clerk sign-in
3. Signs in with Google, Apple, Microsoft, or Magic Link
4. On first signup:
   - User record created in database
   - Credits record created with `balance: [configurable signup bonus amount]` (from admin settings)
   - CreditTransaction record: `type: 'signup_bonus', amount: [configurable signup bonus amount]` (only if amount > 0)
5. Redirected to `/onboarding` (first-time users only)
6. Onboarding page (optional):
   - **Institution** (optional free text field)
     - Max 200 characters
     - Example: "University of Oxford", "Harvard University", "Manchester High School"
   - **Course** (optional free text field)
     - Max 200 characters
     - Example: "English Literature", "Computer Science", "History"
   - "Skip" button → redirects to `/dashboard` (fields remain null)
   - "Continue" button → saves institution/course and redirects to `/dashboard`
7. On subsequent logins, redirect directly to `/dashboard` (skip onboarding)

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
  - User can type the title manually OR use the auto-generate feature
  - **Auto-generate Title** button (optional)
    - Uses a fast, cheap LLM model to generate a concise title based on essay content and instructions
    - Generated title: Maximum 6 words, concise and descriptive
    - Available when essay content (Tab 3) or instructions (Tab 1) are provided
    - Populates the Title field (user can edit after generation)
    - Uses a separate API endpoint with a cost-effective model (not the grading models)
- **Instructions** (required)
  - Max 10,000 characters
  - What the assignment asks for
  - Example: "Analyze the impact of the Medici family on Renaissance art..."
- **Subject** (required)
  - Free text field
  - Examples: "History", "English Literature", "Psychology", "Computer Science"
- **Custom Rubric** (optional)
  - Max 10,000 characters
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
  - **Warning displayed:** "⚠️ Note: We extract text from your document. Scanned images or handwritten essays are not supported. Please upload a text-based PDF or DOCX."
- **Word Count Display**
  - Min: 50 words
  - Max: 50,000 words
  - Error if outside range
- **Cost Estimator**
  - Shows: "This will cost **1.00 credits**"
  - Fixed rate: 1 credit per essay (regardless of word count)
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
   - Institution (optional, editable free text field, max 200 characters)
   - Course (optional, editable free text field, max 200 characters)

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
- Configurable via admin dashboard (can be set to 0.00)
- Default: 1.00 credit (allows risk-free trial)
- Transaction type: `signup_bonus` (only created if amount > 0)
- Admin can adjust this value at any time (affects future signups only)

**Credit Pricing Tiers:**
| Package | Total Price | Price per Credit | Discount |
|---------|-------------|------------------|----------|
| 10 credits | $3.00 | $0.30 | 0% (base) |
| 50 credits | $14.00 | $0.28 | 7% |
| 100 credits | $25.00 | $0.25 | 17% |

### Credit Transaction Rules

**Credit Reservation Model:**
- Credits are **reserved at submission** (moved from `balance` to `reserved` field)
- At submission: `balance - 1.00, reserved + 1.00` (atomic operation)
- On successful grading: `reserved - 1.00` (credit already deducted from balance, just clear reservation)
- On failed grading: `balance + 1.00, reserved - 1.00` (refund reserved credit back to balance)
- Prevents users from submitting multiple essays simultaneously without sufficient credits
- Prevents credit loss if grading fails after submission
- **Note:** User messaging should say "You were not charged" rather than "refunded" since the reservation is released back to balance

**Atomic Operations:**
- Credit reservation + essay submission happens in single transaction
- Credit refund + grade failure happens in single transaction
- Credit deduction + grade completion happens in single transaction
- Either all succeed or all fail (no partial states)

**Credit Checks:**
1. **At submission:** Check `balance >= 1.00` (available balance, not including reserved)
   - If false, block submission with error message
2. **Before processing:** Re-check balance during processing (race condition protection)
   - If insufficient, fail gracefully and notify user

**Refund Scenarios:**
- **Grading fails (API error, timeout):** Reserved credit is refunded back to balance (`balance + 1.00, reserved - 1.00`). User can retry.
- **User reports error (admin verified):** Manual refund via admin dashboard (creates `refund` transaction type for audit purposes)

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
- Use "furthest from mean" algorithm (replaces pairwise comparison)
- Calculate mean of all scores
- Calculate deviation of each score from mean: `|score - mean|`
- Find maximum deviation
- **Outlier threshold:** 10% of mean
- **Exclude score if:** Maximum deviation > 10% of mean (exclude the furthest score)
- **Rationale:** Pairwise comparison can incorrectly exclude the median score (e.g., `[60, 80, 100]` would exclude 80, the median)

**Examples:**
- Scores: [82, 85, 87] → Mean: 84.67, Max deviation: 2.67 (3.2% of mean) → All included
- Scores: [82, 85, 95] → Mean: 87.33, Max deviation: 7.67 (8.8% of mean) → All included (no outlier)
- Scores: [60, 80, 100] → Mean: 80, Max deviation: 20 (25% of mean) → Exclude 100 (furthest from mean)
- Scores: [50, 75, 100] → Mean: 75, Max deviation: 25 (33% of mean) → Exclude 100 (furthest from mean)

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
- CTA: "Get Started Free" (shows signup bonus amount if > 0, e.g., "1 free essay" or "0.50 free credits")

**`/privacy` - Privacy Policy**
- Standard privacy policy
- Data collected, usage, third parties (Clerk, Stripe, OpenRouter)

**`/terms` - Terms of Service**
- Usage terms, refund policy, acceptable use

### Protected Routes (Auth Required)

**`/onboarding` - Optional Onboarding (First-Time Users Only)**
- Shown only on first signup (check if user has institution/course set)
- If user already has institution/course, redirect to `/dashboard`
- Form fields:
  - **Institution** (optional free text, max 200 characters)
  - **Course** (optional free text, max 200 characters)
- Actions:
  - "Skip" button → redirects to `/dashboard` (fields remain null)
  - "Continue" button → saves institution/course via API and redirects to `/dashboard`
- After submission, user never sees this page again (redirects to dashboard on subsequent visits)

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

**`/admin/settings` - Platform Settings**
- **Signup Bonus Configuration:**
  - Input field: Signup bonus amount (numeric, 0.00 or greater, 2 decimal places)
  - Current value displayed
  - Save button updates configuration
  - Changes apply to future signups only (existing users unaffected)
  - Validation: Must be ≥ 0.00, max 1000.00 (safety limit)

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
| No text extracted (blank/scanned PDF) | "No text could be extracted. Please ensure your document contains selectable text, not images." | Show error, allow retry or paste text |
| Rate limit exceeded | "Rate limit exceeded - Please wait 30 seconds between submissions" | Disable submit button temporarily |
| Title generation failed | "Could not generate title. Please enter a title manually." | Allow manual entry, no blocking |

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
- **Instructions:** Required, 1-10,000 characters
- **Subject:** Required, 1-100 characters
- **Academic Level:** Required, enum validation
- **Custom Rubric:** Optional, 0-10,000 characters
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

### Platform Settings

- **Signup Bonus Amount:**
  - Type: Numeric (decimal, 2 places)
  - Range: 0.00 to 1000.00
  - Default: 1.00
  - Can be set to 0.00 (no signup bonus)
  - Changes apply to future signups only

---

This functional specification defines **what the system does** without prescribing **how it's built**. Implementation details (tech stack, code patterns, deployment) belong in the Technical Design document.
