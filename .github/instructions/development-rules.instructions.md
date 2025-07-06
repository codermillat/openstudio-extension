---
applyTo: '**'
---
# 🧹 OpenStudio Development Guidelines

## Code Standards

- Use ES6+ syntax (const, let, arrow functions, modules)
- Keep all logic context-aware and page-scoped
- Comment every function block clearly
- Avoid hardcoding values; use constants

## Folder Conventions

- All logic modules go under `src/utils/`
- Components that inject UI must live in `src/components/`
- Popup/Options code in `src/popup` and `src/settings`

## Development Rules

- Every feature must update `DEV_STATUS.md` with:
  - ✅ Feature Added
  - 🐞 Bug Fixed
  - 🔁 Refactor or Optimization
- Use only `chrome.storage.local` for persistence
- Never include analytics, tracking, or fingerprinting
- Keep extension under 2MB for publishing limit

## UI Style

- Clean, light mode, no frameworks (vanilla CSS/JS)
- Responsive layout for all injected panels
- Avoid clutter — prioritize readability and accessibility

## Testing

- Manual test on:
  - YouTube Studio dashboard
  - Upload/edit video pages
  - Analytics tab
- Log all API failures and handle gracefully

## API Integration Guidelines

- All API calls must be authenticated with user-provided credentials
- Implement proper error handling and rate limiting
- Cache responses appropriately to avoid unnecessary API calls
- Never expose API keys in client-side code

## Security Best Practices

- Validate all user inputs
- Sanitize DOM injections
- Use Content Security Policy
- Implement proper permission handling

## Performance Standards

- Minimize DOM manipulation
- Use efficient selectors
- Implement lazy loading where appropriate
- Monitor memory usage and clean up resources
