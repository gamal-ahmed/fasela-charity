# Change: Add Tenant Dashboard

## Why
Each organization needs a public-facing landing page that showcases their work, featured cases, and allows visitors to donate. Currently, the home page uses mock data and isn't org-scoped. The `/o/:orgSlug/cases` page only shows a case list, not a full dashboard experience.

## What Changes
- Create new `OrgDashboard.tsx` page at `/o/:orgSlug`
- Reuse existing UI components (FamilyProfile, DonationSection, FeaturedCasesCarousel)
- Pass real organization-scoped data to components
- Modify FeaturedCasesCarousel to accept optional `organizationId` prop

## Impact
- Affected specs: New capability (tenant-dashboard)
- Affected code:
  - `src/pages/OrgDashboard.tsx` (new)
  - `src/components/FeaturedCasesCarousel.tsx` (modified)
  - `src/App.tsx` (new route)
