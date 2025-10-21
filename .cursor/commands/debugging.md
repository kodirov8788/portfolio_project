Find root problems – Use browser console, network tab, and component errors to locate the issue.

Make fix plan – Write an ordered list (critical → minor).

Apply best practices – Fix correctly, cleanly, and maintainably.

Test code – Run TypeScript check and build to confirm everything works.

Monitor behavior – Watch browser behavior during testing for hidden issues.

---

## **Portfolio Debugging Checklist**

### 🔍 **Identify the Problem**

- Check browser console for JavaScript errors
- Check network tab for failed requests
- Check component rendering issues
- Check TypeScript type errors

### 📋 **Plan the Fix**

- 🟥 **Critical** → Crashes, build failures, type errors
- 🟧 **Major** → Logic errors, performance issues
- 🟨 **Minor** → Styling, minor bugs

### 🛠️ **Apply Fix**

- Follow existing component patterns
- Maintain TypeScript type safety
- Use consistent naming conventions
- Keep code clean and readable

### 🧪 **Test the Fix**

- Run `tsc --noEmit` for type checking
- Run `npm run build` for build verification
- Test in browser to confirm fix works
- Check for regressions in other features

### 📊 **Monitor Results**

- Watch console for new errors
- Check network requests
- Verify component behavior
- Ensure responsive design works

**Order: Fix critical issues first, then major, then minor. Always test after each fix.**
