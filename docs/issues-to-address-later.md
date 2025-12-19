---

## Findings to Defer (Add Later Easily)

These are **optimizations** or **edge cases** that don't affect core data models and can be added incrementally.

### 1. **Document Parsing in Worker** ⏸️ (Independent audit)
**Why Defer:** At launch scale (10 essays/day), parsing a 50k-word doc in the API route is fine. The OOM risk is real but unlikely at low volume. 

**When to Add:** When you see p95 API latency >5s or memory alerts. Then move parsing to worker + S3 storage.

**Risk of Deferring:** Low. Worst case: one user's large PDF times out, they paste text instead.

---

### 2. **SSE via LISTEN/NOTIFY** ⏸️ (My finding)
**Why Defer:** The current polling approach (2s intervals) works fine at 10-50 concurrent users. The database load concern is valid but not urgent.

**When to Add:** When Neon costs exceed $50/month or you see connection pool exhaustion.

---

### 3. **Fallback AI Model** ⏸️ (Independent audit)
**Why Defer:** OpenRouter already provides some redundancy. Adding Claude/GPT fallback adds complexity (different prompt formats, cost tracking).

**When to Add:** After first Grok-4 outage causes user complaints.

---

### 4. **"Lowest Scorer" vs "Average Scorer" Feedback** ⏸️ (Independent audit)
**Why Defer:** This is a product decision, not a technical one. Launch with lowest scorer, gather user feedback, adjust.

**When to Add:** After user research indicates feedback is "too harsh."

---

### 5. **Original File Storage (S3)** ⏸️ (Independent audit)
**Why Defer:** The spec explicitly says "original file NOT stored." Regrading uses the same parsed text. This is a product decision.

**When to Add:** If users request "regrade with different rubric" and formatting matters.

---

### 6. **Soft Delete Cleanup Job** ⏸️ (My finding)
**Why Defer:** Soft-deleted records accumulating for 6 months won't hurt anything. 

**When to Add:** When database size becomes a cost concern.

---

### 7. **50,000 Word Limit Reduction** ⏸️ (Both audits)
**Why Defer:** The cost analysis is correct (long essays cost more), but this is a pricing/product decision. Launch with the limit, track actual usage patterns.

**When to Add:** After you see average essay length and can make data-driven pricing tiers.

---

### 8. **Admin Dashboard** ⏸️ (My finding)
**Why Defer:** Direct database access works for 10 users/day. Build admin tooling when support volume justifies it.

**When to Add:** When you're spending >1 hour/week on manual DB queries for support.

---

### 9. **Pending Transaction UI for Stripe** ⏸️ (Independent audit)
**Why Defer:** Stripe webhooks typically fire within 1-2 seconds. The "close window before webhook" scenario is rare.

**When to Add:** If users report "I paid but no credits" more than once.

---

## Summary: Implementation Checklist

### Must Have for Launch (8 items)
| # | Finding | Effort | Risk if Skipped |
|---|---------|--------|-----------------|
| 1 | Credit Reservation Pattern | 4h | Financial loss |
| 2 | Stripe Webhook Idempotency | 30m | Double credits |
| 3 | SSE Reconnection + Initial Sync | 2h | Support tickets |
| 4 | Worker Startup Sweep | 1h | Stuck grades |
| 5 | AI Response Schema (Zod) | 2h | Crashes |
| 6 | Outlier Algorithm Fix | 1h | Wrong grades |
| 7 | Blank PDF Warning + Validation | 30m | Support tickets |
| 8 | Submission Rate Limiting | 1h | Abuse |

**Total: ~12 hours of additional work**

### Defer to Post-Launch (9 items)
| # | Finding | Trigger to Implement |
|---|---------|---------------------|
| 1 | Document Parsing in Worker | API latency >5s |
| 2 | SSE via LISTEN/NOTIFY | Neon costs >$50/mo |
| 3 | Fallback AI Model | First Grok-4 outage |
| 4 | Average Scorer Feedback | User feedback |
| 5 | Original File Storage | Product request |
| 6 | Soft Delete Cleanup | DB size concern |
| 7 | Word Limit Reduction | Usage data |
| 8 | Admin Dashboard | Support >1h/week |
| 9 | Pending Transaction UI | User reports |

---

## One New Finding to Add from Independent Audit

### **Token Limit Concern for Long Essays**
The independent audit raises a valid point I underweighted: 50,000 words + instructions + structured output may exceed practical limits even within context windows.

**Recommendation:** Add to "Must Have" list:
- **Validate token count before submission** (not just word count)
- **Set realistic limit:** 15,000 words (~20k tokens) for V1
- **Document in UI:** "Essays up to 15,000 words supported"

This prevents the edge case where a 50k-word essay is accepted, sent to AI, and fails mid-processing due to output token limits.