# Contributing Guidelines

## Documentation Policy

### ❌ DO NOT CREATE

**Never create these types of files:**
- Summary files: `IMPLEMENTATION_SUMMARY.md`, `COMPLETION_SUMMARY.md`, etc.
- Status files: `IMPLEMENTATION_COMPLETE.md`, `DOCS_COMPLETE.md`, etc.
- Temporary tracking: `TODO_*.md` files after feature is complete
- Duplicate documentation: `RELEASE_NOTES.md`, `CHANGELOG_*.md`, etc.

**Why?** These files pollute the project and become stale quickly.

### ✅ DO INSTEAD

**Update existing documentation:**
- `PROJECT_STATUS.md` - For implementation status and history
- `spec.md` - For technical specifications
- `README.md` - For user-facing information
- Relevant files in `algorithms/` or `concepts/` subdirectories

### File Organization Rules

**Root directory (`/opt/thermal-software/refractory/`):**
- Only `README.md` allowed
- Everything else goes in subdirectories

**Documentation (`docs/`):**
- Core docs: spec.md, API.md, INSTALLATION.md, PROJECT_STATUS.md, PROJECT_STRUCTURE.md
- User guides: BLEND_OPTIMIZER_GUIDE.md, QUICK_START_TEST.md, UI_TESTING_GUIDE.md
- Subdirectories: `algorithms/`, `concepts/`

**Code (`src/`):**
- TypeScript source files only
- No markdown files

**Public (`public/`):**
- HTML, CSS, JavaScript only
- No documentation files

### When Adding New Features

1. **Update spec.md** - Add technical details
2. **Update PROJECT_STATUS.md** - Add to development history (new stage)
3. **Update relevant guides** - If user-facing changes
4. **Update README.md** - If major feature
5. **DO NOT** create new summary/status/todo files

### Example: Adding Feature "X"

**Wrong:**
```
✗ Create FEATURE_X_IMPLEMENTATION.md
✗ Create FEATURE_X_COMPLETE.md
✗ Create TODO_FEATURE_X.md
```

**Correct:**
```
✓ Add to spec.md: Section on Feature X
✓ Add to PROJECT_STATUS.md: Stage N: Feature X Implementation
✓ Update BLEND_OPTIMIZER_GUIDE.md: How to use Feature X
✓ Update README.md: Add Feature X to feature list
```

---

## Code Style

- TypeScript: Follow existing patterns
- Comments: Explain WHY, not WHAT
- Functions: Single responsibility
- Validation: Early returns for errors

---

## Commit Messages

Format: `[Module] Brief description`

Examples:
- `[BlendOptimizer] Add fixed fractions feature`
- `[Docs] Update PROJECT_STATUS with v1.1.0`
- `[UI] Fix fraction table layout`

---

## Testing

Before committing:
```bash
make build  # Ensure TypeScript compiles
make test   # Run tests
make up     # Verify application starts
```

---

**Remember: Keep it clean. Update existing docs, don't create new ones.**

