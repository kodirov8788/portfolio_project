{A concise description of the bug or issue. Include observed behavior, expected behavior, and any error messages.}

---

## **Portfolio Bug Fix Protocol**

You will now systematically debug and fix this issue in the portfolio project.

---

## **Phase 1: Reproduce & Understand**

- **Directive:** Create a minimal test case that reliably triggers the bug.
- **Actions:**
  1. **Define Expected Behavior:** What should happen?
  2. **Identify Trigger:** What causes the bug?
  3. **Test Case:** Create simple steps to reproduce
- **Output:** Clear reproduction steps

---

## **Phase 2: Root Cause Analysis**

- **Directive:** Find the exact cause of the issue.
- **Investigation Steps:**
  1. **Check Console:** Look for JavaScript errors
  2. **Check Network:** Look for failed requests
  3. **Check Components:** Verify React component logic
  4. **Check Types:** Ensure TypeScript types are correct
- **Output:** Specific root cause identified

---

## **Phase 3: Fix Implementation**

- **Directive:** Apply a minimal, precise fix.
- **Core Protocols:**
  - **Read-Write-Reread:** Check file before and after changes
  - **TypeScript Safety:** Maintain proper types
  - **Component Patterns:** Follow existing component structure
  - **Clean Code:** Write maintainable solution

---

## **Phase 4: Verification**

- **Directive:** Prove the fix works without breaking anything.
- **Verification Steps:**
  1. **Fix Confirmed:** Bug no longer occurs
  2. **Type Check:** `tsc --noEmit` passes
  3. **Build Test:** `npm run build` succeeds
  4. **Regression Test:** Other features still work

---

## **Phase 5: Final Check**

- **Directive:** Ensure fix is complete and clean.
- **Final Steps:**
  1. **Code Review:** Fix follows project patterns
  2. **Documentation:** Add comments if needed
  3. **Clean Up:** Remove any debug code
  4. **Testing:** Verify fix works in browser

---

## **Final Report**

- **Root Cause:** Specific issue that was causing the bug
- **Fix Applied:** Changes made to resolve the issue
- **Verification:** TypeScript and build status
- **Result:** Bug resolved, no regressions

**Maintain inline progress using ✅ / ⚠️ / 🚧 markers throughout the process.**
