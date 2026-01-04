---
description: "Test the essay grading happy path using browser automation"
argument-hint: "empty for full test | 'quick' for minimal test"
---

# Test Essay Grading Flow

Runs an end-to-end browser test of the essay grading happy path.

## Prerequisites

1. **Dev server must be running** on port 3000
   - Check: `lsof -i :3000`
   - Start: `bun --bun run dev`

2. **Browser MCP tab context** must be available
   - Use `mcp__claude-in-chrome__tabs_context_mcp` to get/create tabs

3. **User must be logged in** (or login via Google OAuth)

## Test Flow

### Step 1: Navigate to App
- Go to `http://localhost:3000`
- If not logged in, click "Sign In" and complete Google OAuth for `andreas@cambitsis.com`
- Verify redirect to `/dashboard`

### Step 2: Start Essay Submission
- Click "Start New Submission" or navigate to "Grade Essay"
- Verify 3-step form appears: Assignment Brief → Focus Areas → Essay Content

### Step 3: Fill Assignment Brief (Step 1)
Required fields:
- **Title**: e.g., "The Impact of Climate Change on Global Agriculture"
- **Assignment Instructions**: Detailed assignment requirements
- **Subject**: e.g., "Environmental Science"
- **Academic Level**: Select from dropdown (High School / Undergraduate / Postgraduate)
- **Custom Rubric**: (Optional)

Click "Next: Focus Areas"

### Step 4: Focus Areas (Step 2 - Optional)
- Click "+ Add Focus Area" to add specific feedback areas
- Example: "Argument structure and evidence quality"
- Or leave empty for general feedback

Click "Next: Essay Content"

### Step 5: Essay Content (Step 3)
- Paste essay content (minimum 50 words, maximum 50,000 words)
- Verify "Word Count" updates and shows "Ready to submit"
- Verify "Cost: 1.00 credits" displayed

**CRITICAL**: Use `form_input` tool to set textarea value, NOT `type` action!
The `type` action doesn't trigger React's onChange events properly.

```
mcp__claude-in-chrome__form_input({
  tabId: <tab_id>,
  ref: "ref_13",  // or find the textarea ref
  value: "<essay content>"
})
```

### Step 6: Submit for Grading
- Click "Submit for Grading"
- Verify redirect to `/grades/<grade_id>`
- Verify credits deducted (e.g., 8.00 → 7.00)

### Step 7: Verify Grade Results
Wait for grading to complete (real-time via Convex subscriptions). Verify:
- Grade letter and percentage range displayed (e.g., "C 73-79%")
- "View model scores" option available
- **Strengths** section with feedback items
- **Areas for Improvement** section with specific suggestions
- **Language Tips** section
- **Recommended Resources** with links

## Known Issues & Gotchas

### 1. Form State Not Captured
**Problem**: Browser `type` action enters text in DOM but React state doesn't update.
**Solution**: Use `form_input` tool which properly triggers React synthetic events.

### 2. Autosave Validation Errors
**Problem**: `saveDraft` mutation fails if required fields are missing.
**Symptom**: Console errors like "Object is missing the required field `academicLevel`"
**Note**: These are non-blocking; submission can still work if all fields are filled.

### 3. Dropdown Selection
**Problem**: Clicking dropdown options requires precise coordinates.
**Solution**: Click on dropdown to open, take screenshot, click on visible option text.

## Sample Test Essay

```
The Impact of Climate Change on Global Agriculture

Introduction

Climate change represents one of the most significant challenges facing global food security in the 21st century. Rising temperatures, altered precipitation patterns, and increased frequency of extreme weather events are fundamentally transforming agricultural systems worldwide.

The Science of Climate Change and Agriculture

The relationship between climate and agriculture is complex. According to the IPCC (2021), global temperatures have risen by approximately 1.1 degrees Celsius since pre-industrial times. Rising temperatures accelerate crop development, potentially reducing yields.

Regional Impacts

The impacts are not uniformly distributed. Developing nations in tropical regions face disproportionate risks due to their already warm climates and limited adaptive capacity.

Conclusion

Climate change presents an unprecedented challenge to global agricultural systems. Through coordinated international action, humanity can adapt to these challenges.
```

## Success Criteria

- [ ] Navigation to `/dashboard` successful
- [ ] 3-step form navigation works
- [ ] All required fields accept input
- [ ] Word count updates in real-time
- [ ] Submission redirects to grade results page
- [ ] Credits deducted correctly
- [ ] Grade and feedback displayed within ~30 seconds
