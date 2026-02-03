## ADDED Requirements

### Requirement: Organization Dashboard Page
The system SHALL provide a public dashboard page for each organization accessible at `/o/:orgSlug`.

#### Scenario: Valid organization slug
- **WHEN** a user navigates to `/o/yateem-care`
- **THEN** the page displays the organization's name and logo in the hero section
- **AND** shows the first featured case using the FamilyProfile component
- **AND** shows the DonationSection for that case
- **AND** shows the FeaturedCasesCarousel with only that organization's featured cases

#### Scenario: Invalid organization slug
- **WHEN** a user navigates to `/o/invalid-slug`
- **THEN** the page displays an error message "Organization not found"

#### Scenario: Organization has no featured cases
- **WHEN** a user navigates to an organization with no featured cases
- **THEN** the page displays the organization hero
- **AND** shows a message indicating no featured cases are available
- **AND** provides a link to view all cases at `/o/:orgSlug/cases`

### Requirement: Organization-Scoped Featured Cases Carousel
The FeaturedCasesCarousel component SHALL accept an optional `organizationId` prop to filter cases.

#### Scenario: Carousel with organizationId
- **WHEN** FeaturedCasesCarousel receives an `organizationId` prop
- **THEN** only featured cases belonging to that organization are displayed

#### Scenario: Carousel without organizationId
- **WHEN** FeaturedCasesCarousel does not receive an `organizationId` prop
- **THEN** all featured cases across organizations are displayed (backward compatible)
