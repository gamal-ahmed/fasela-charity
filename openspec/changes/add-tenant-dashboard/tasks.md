# Tasks: Add Tenant Dashboard

## Phase 1: Component Updates
- [x] 1.1 Add `organizationId?: string` prop to FeaturedCasesCarousel
- [x] 1.2 Update FeaturedCasesCarousel query to filter by org when prop provided

## Phase 2: Dashboard Page
- [x] 2.1 Create `src/pages/OrgDashboard.tsx`
- [x] 2.2 Fetch organization by slug
- [x] 2.3 Fetch first featured case for organization
- [x] 2.4 Render org-branded hero section
- [x] 2.5 Pass case data to FamilyProfile component
- [x] 2.6 Pass case data to DonationSection component
- [x] 2.7 Render FeaturedCasesCarousel with organizationId

## Phase 3: Routing
- [x] 3.1 Add route `/o/:orgSlug` to App.tsx

## Phase 4: Testing
- [ ] 4.1 Test with valid org slug (yateem-care)
- [ ] 4.2 Test with invalid org slug (error state)
- [ ] 4.3 Test org without featured cases (fallback state)
