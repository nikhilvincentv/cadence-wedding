# Requirements Document

## Introduction

VowsOS is a comprehensive wedding planning platform built by expanding the existing Cadence codebase (React 18 / Vite / Express / Clerk / Neon Postgres). Cadence already provides a Sidebar navigation shell, a Command Center dashboard, a Timeline + Cascade AI engine, and a Contract Analysis engine. VowsOS retains and extends all existing functionality while adding five new first-class modules — Budget Analytics, Guest Management, Seating Chart Studio, Smart Inbox, and an AI Coordinator chat interface — alongside a redesigned global navigation and deeper per-vendor profile system. The platform persists all state to the Neon database under the authenticated user's Clerk identity.

---

## Glossary

- **VowsOS**: The full wedding planning platform described in this document.
- **App**: The VowsOS web application running in the user's browser.
- **Server**: The Express backend that serves API routes and communicates with the AI provider and Neon database.
- **Database**: The Neon (Postgres) instance that stores per-user wedding state.
- **Sidebar**: The fixed-width left navigation panel present on every screen.
- **Workspace**: The fluid-width main content area to the right of the Sidebar.
- **User**: An authenticated individual identified by a Clerk user ID.
- **Wedding**: The top-level planning record owned by a User, containing date, venue, couple names, guest count, and budget totals.
- **Vendor**: A service provider (photographer, caterer, DJ, florist, etc.) associated with a Wedding.
- **VendorProfile**: The full detail record for a Vendor, including tabbed sub-sections: Profile, Contract, Emails, Timeline, AI Summary, and Open Tasks.
- **Payment**: A scheduled payment installment linked to a Vendor and a Wedding.
- **TimelineEvent**: A single day-of event node on the Timeline, with a time, duration, vendor tag, and lock state.
- **Conflict**: A detected scheduling or budget inconsistency surfaced by the AI or rule engine.
- **Contract**: Raw vendor contract text uploaded or pasted by the User.
- **ContractAnalysis**: The structured output produced by the Contract Analysis Engine after processing a Contract.
- **Guest**: An individual invited to the Wedding, tracked with RSVP, meal, gift, lodging, and transport data.
- **SeatingTable**: A draggable table object (round or rectangular) on the Seating Chart canvas.
- **GuestBadge**: A draggable pill representing a Guest that can be nested inside a SeatingTable.
- **BudgetCategory**: A named budget line item with projected cost, actual cost, due date, and invoice attachment.
- **InboxThread**: An email thread visible in the Smart Inbox, carrying AI-generated TL;DR and impact metadata.
- **AICoordinator**: The conversational AI agent accessible from the AI Coordinator view.
- **MutationBlock**: An embedded card inside an AICoordinator response that proposes specific data changes and offers Approve / Reject actions.
- **SkeletonLoader**: A placeholder UI element displayed while async data is loading.
- **CascadeEngine**: The existing AI engine that traces downstream disruptions when a timeline change is described.

---

## Requirements

### Requirement 1: Global Sidebar Navigation

**User Story:** As a User, I want a persistent sidebar with clearly labeled navigation items, so that I can reach any module from any screen without losing context.

#### Acceptance Criteria

1. THE App SHALL render a fixed-width Sidebar on every authenticated screen that contains, in order from top to bottom: app branding with workspace switcher, navigation items (Dashboard, Timeline, Budget, Guests, Vendors, Contracts, Seating, Inspiration, Inbox, AI Coordinator), and a user profile block with avatar, display name, and settings gear icon.
2. WHEN the User clicks a navigation item, THE App SHALL update the Workspace to display the corresponding view without a full page reload.
3. WHILE a navigation item is the active view, THE Sidebar SHALL render that item in a visually distinct active state.
4. THE Sidebar SHALL display an AI status indicator showing whether the live model is connected or the built-in reasoner is active.
5. THE Sidebar SHALL display a persistence indicator showing whether the current state is saved to the User's account.
6. IF the User is not authenticated, THEN THE App SHALL redirect to the login screen and SHALL NOT render the Sidebar.

---

### Requirement 2: Home Dashboard

**User Story:** As a User, I want a dashboard that shows my countdown, system alerts, and daily tasks at a glance, so that I always know what needs my attention today.

#### Acceptance Criteria

1. THE Dashboard SHALL display a large numerical countdown in days to the Wedding date alongside a wedding progress bar.
2. THE Dashboard SHALL render a 60/40 asymmetric grid: the left column displays system alerts and conflicts; the right column displays a daily task checklist.
3. WHEN a Payment is due within 14 calendar days and is not in "paid" status, THE Dashboard SHALL display an alert row for that Payment containing a severity icon, a headline, and a detail line.
4. WHEN a Payment has status "action", THE Dashboard SHALL display an alert row for that Payment regardless of due date proximity.
5. WHEN the User hovers over an alert row, THE Dashboard SHALL reveal an action affordance (button or link) relevant to that alert.
6. THE Dashboard SHALL display a task checklist where each row contains a checkbox and a task description string.
7. WHEN the User checks a task checkbox, THE App SHALL persist the updated checked state to the Database.
8. IF no alerts exist, THEN THE Dashboard SHALL display a placeholder message indicating nothing is urgent.
9. THE Dashboard SHALL display four summary metric cards: Countdown (days), Vendor count, Budget used percentage with a progress bar, and total Payments due amount.

---

### Requirement 3: Vendor Directory and Profile Matrix

**User Story:** As a User, I want a visual grid of all my vendors with quick-glance payment status, so that I can track who I owe and open full profiles to dig into details.

#### Acceptance Criteria

1. THE Vendor Directory SHALL render each Vendor as a card showing: vendor name, category, star rating, a paid-vs-total progress bar, and next payment due date.
2. WHEN the User clicks a Vendor card, THE App SHALL open a VendorProfile panel with six tabs: Profile, Contract, Emails, Timeline, AI Summary, and Open Tasks.
3. THE Profile tab SHALL display the Vendor's name, category, contact information, booking status, and rating.
4. THE Contract tab SHALL display any ContractAnalysis results associated with that Vendor, or a prompt to scan a contract.
5. THE Emails tab SHALL display InboxThreads whose sender is associated with that Vendor.
6. THE Timeline tab SHALL display TimelineEvents that are tagged to that Vendor.
7. THE AI Summary tab SHALL display a two-column layout: the left column shows Payment Schedule and Arrival Times and Deliverables; the right column shows Cancellation Policy and Overtime Rates extracted from the Vendor's ContractAnalysis.
8. THE Open Tasks tab SHALL display tasks linked to that Vendor with checkbox completion state.
9. WHEN the User edits fields on the Profile tab and saves, THE App SHALL persist the updated Vendor record to the Database.

---

### Requirement 4: Contract Analysis Engine

**User Story:** As a User, I want to upload or paste any vendor contract and receive an instant structured analysis, so that I never miss a hidden fee, cancellation clause, or payment deadline.

#### Acceptance Criteria

1. THE Contract Analysis Engine SHALL provide a drag-and-drop upload zone and a paste-text area for receiving contract input.
2. WHEN the User submits contract text, THE Server SHALL parse the text and extract: Critical Dates, Hidden Fees, Cancellation Clauses, Payment Schedule, and a list of Strategic Questions to Ask the Vendor.
3. WHEN extraction is complete, THE App SHALL display the extracted fields in labeled sections.
4. WHEN the User clicks "Save to Plan", THE App SHALL create Payment records from the extracted Payment Schedule and associate them with the matching Vendor if one exists.
5. IF the contract text is empty or fewer than 50 characters, THEN THE Contract Analysis Engine SHALL display a validation error and SHALL NOT submit the text to the Server.
6. THE Contract Analysis Engine SHALL associate ContractAnalysis output with the Vendor selected or matched by name, making it available in the VendorProfile Contract tab.
7. THE ContractParser SHALL parse contract text into a ContractAnalysis object.
8. THE ContractPrinter SHALL format a ContractAnalysis object back into a human-readable structured summary.
9. FOR ALL valid ContractAnalysis objects, parsing then printing then parsing SHALL produce an equivalent ContractAnalysis object (round-trip property).

---

### Requirement 5: AI Coordinator Chat Interface

**User Story:** As a User, I want to converse with an AI coordinator that can read my live wedding data and propose changes, so that I can get intelligent recommendations and apply them directly to my plan.

#### Acceptance Criteria

1. THE AI Coordinator view SHALL render a 40/60 split-pane layout: the left pane is a read-only dynamic context viewer showing either the Timeline list or the Budget table; the right pane is the chat interface.
2. THE AICoordinator SHALL display user messages right-aligned and AI messages left-aligned with an AI icon.
3. WHEN the AICoordinator produces a response that includes proposed data changes, THE App SHALL render a MutationBlock embedded in the AI message containing the proposed changes and two action buttons: "Approve & Apply Globally" and "Reject Changes".
4. WHEN the User clicks "Approve & Apply Globally" on a MutationBlock, THE App SHALL apply the proposed changes to the relevant data records and persist the updated state to the Database.
5. WHEN the User clicks "Reject Changes" on a MutationBlock, THE App SHALL dismiss the MutationBlock without modifying any data.
6. THE chat input area SHALL be fixed at the bottom of the right pane with a textarea and a submit button.
7. WHEN the User submits a message, THE App SHALL display a SkeletonLoader in the chat pane while waiting for the AICoordinator response.
8. IF the AICoordinator request fails, THEN THE App SHALL display an inline error message in the chat pane and SHALL NOT modify any data.
9. THE AICoordinator SHALL have access to the current Wedding, Vendor list, Timeline, Budget, Guest count, and Payments as context when generating responses.

---

### Requirement 6: Smart Inbox Workspace

**User Story:** As a User, I want to see all my vendor emails in one place with AI-generated summaries and smart reply drafts, so that I can process vendor communications quickly without leaving the app.

#### Acceptance Criteria

1. THE Smart Inbox SHALL render a 35/65 split-pane layout: the left pane is a scrollable email thread list; the right pane is the active email detail.
2. THE thread list SHALL display each InboxThread with sender name, received timestamp, and an AI-generated TL;DR summary of one to two sentences.
3. WHEN the User clicks an InboxThread, THE App SHALL display the full email body in the right pane.
4. THE right pane SHALL display an AI Impact Banner at the top that describes how the email content may affect the Wedding plan (e.g., date change, cost increase, vendor cancellation).
5. THE right pane SHALL display a Smart Reply area at the bottom containing an AI-pre-populated draft reply and a Send button.
6. WHEN the User edits the draft reply and clicks Send, THE App SHALL record the sent reply and associate it with the InboxThread.
7. WHEN a new InboxThread is connected or synced, THE Server SHALL generate the TL;DR summary and Impact analysis before surfacing the thread in the inbox list.
8. IF the User has no connected email account, THEN THE Smart Inbox SHALL display an onboarding prompt to connect an email integration.

---

### Requirement 7: Draggable Timeline Framework

**User Story:** As a User, I want to build and rearrange my day-of timeline using drag-and-drop, so that I can visualize the full day and quickly resolve scheduling conflicts.

#### Acceptance Criteria

1. THE Timeline SHALL render TimelineEvents as draggable node cards in a vertical linear layout sorted by time.
2. Each TimelineEvent card SHALL display a drag handle, time range, event title, and vendor tag.
3. WHEN the User drags a TimelineEvent card to a new position, THE App SHALL update the TimelineEvent's time value and re-sort the Timeline accordingly, then persist the change to the Database.
4. WHEN two or more TimelineEvents overlap in their time ranges, THE App SHALL display a floating conflict alert pill above the affected nodes.
5. WHEN the conflict alert pill is displayed, THE App SHALL offer an "Execute Auto-Fix" button that invokes the CascadeEngine to propose a resolution.
6. WHEN the User adds a TimelineEvent with a locked flag, THE App SHALL prevent that event from being moved by drag-and-drop and SHALL display a locked indicator on the card.
7. WHEN the CascadeEngine returns a fix proposal, THE App SHALL display the proposed changes and require explicit User confirmation before applying them.

---

### Requirement 8: Budget Analytics Interface

**User Story:** As a User, I want a clear view of my full wedding budget with projected vs. actual costs per category, so that I can stay on track and catch overruns early.

#### Acceptance Criteria

1. THE Budget Analytics view SHALL display three summary metric modules at the top: Total Budget, Amount Spent, and Amount Remaining.
2. THE Budget Analytics view SHALL display a data table with one row per BudgetCategory, with columns: Category name, Projected cost, Actual cost, Due Date, and Invoice attachment slot.
3. WHEN actual cost exceeds projected cost for any BudgetCategory, THE App SHALL display an alert banner identifying the over-budget categories.
4. WHEN the User uploads a file to an Invoice attachment slot, THE App SHALL store the file reference and display a linked icon in that row.
5. WHEN the User edits a BudgetCategory row (projected cost, actual cost, or due date), THE App SHALL persist the updated BudgetCategory to the Database.
6. WHEN the User adds a new BudgetCategory, THE App SHALL insert a new row in the table and persist it to the Database.
7. THE Budget Analytics view SHALL recalculate Amount Spent and Amount Remaining in real time as BudgetCategory actual costs are edited.
8. IF the total of all BudgetCategory projected costs exceeds the Wedding's budgetTotal, THEN THE App SHALL display a total-budget-exceeded warning.

---

### Requirement 9: Guest Management Matrix

**User Story:** As a User, I want a spreadsheet-style grid to manage all my guests, so that I can track RSVPs, meals, gifts, lodging, and transport in one place.

#### Acceptance Criteria

1. THE Guest Management view SHALL render a data grid with one row per Guest and the following columns: selection checkbox, Guest Name, RSVP Status, Meal Selection, Gift Description, Relationship Category, Lodging Status, Transportation Toggle, and Notes.
2. WHEN the User edits a cell in the Guest grid, THE App SHALL validate the input and persist the updated Guest record to the Database.
3. WHEN the User adds a new Guest row, THE App SHALL insert the row with default values and focus the Guest Name cell for immediate entry.
4. WHEN the User selects one or more Guest rows and triggers a bulk action, THE App SHALL apply the action (e.g., update RSVP Status, assign meal) to all selected rows and persist all changes.
5. THE Guest Management view SHALL display aggregate counts: total guests, confirmed count, declined count, and awaiting-response count.
6. WHEN the User filters by RSVP Status or Relationship Category, THE App SHALL display only the matching Guest rows without removing data.
7. IF a Guest Name cell is submitted empty, THEN THE App SHALL display an inline validation error and SHALL NOT persist the empty record.

---

### Requirement 10: Seating Chart Studio

**User Story:** As a User, I want an infinite-canvas seating chart editor where I can drag tables and assign guests, so that I can design and optimize my reception layout visually.

#### Acceptance Criteria

1. THE Seating Chart Studio SHALL render a 2D infinite canvas with a visible dot-matrix grid background.
2. THE App SHALL support adding circular and rectangular SeatingTable objects to the canvas.
3. WHEN the User drags a SeatingTable, THE App SHALL update its position on the canvas and persist the updated layout to the Database.
4. THE App SHALL support adding GuestBadge objects and nesting them inside a SeatingTable to represent a seat assignment.
5. WHEN the User drags a GuestBadge from one SeatingTable to another, THE App SHALL update the Guest's seat assignment and persist the change.
6. THE Seating Chart Studio SHALL include a slide-out AI Analysis Sidebar that displays seating violation alerts including proximity issues, accessibility concerns, and distribution imbalances.
7. WHEN the User clicks an alert in the AI Analysis Sidebar, THE App SHALL highlight the affected SeatingTable or GuestBadge on the canvas.
8. IF a Guest is assigned to two SeatingTables simultaneously, THEN THE App SHALL display a duplicate-assignment conflict indicator on both GuestBadge instances.
9. THE App SHALL allow the User to export the seating chart layout as a printable view.

---

### Requirement 11: State Persistence and Data Integrity

**User Story:** As a User, I want all my wedding data saved to my account automatically, so that I never lose progress when I close or refresh the app.

#### Acceptance Criteria

1. WHEN the User makes any change to Wedding, Vendor, Payment, TimelineEvent, Guest, BudgetCategory, or SeatingTable data, THE App SHALL persist the updated state to the Database within 2 seconds.
2. WHEN the App loads for an authenticated User, THE App SHALL retrieve the User's full state from the Database before rendering any data-dependent views.
3. IF the Database write fails, THEN THE App SHALL display a non-blocking error notification and SHALL retain the change in local memory for retry.
4. IF the Database is unreachable at load time, THEN THE App SHALL fall back to the last cached local state and display a connectivity warning.
5. THE App SHALL associate all state records with the authenticated User's Clerk user ID to prevent cross-user data leakage.

---

### Requirement 12: Loading and Validation States

**User Story:** As a User, I want clear feedback while data is loading and when I submit invalid input, so that the app always feels responsive and safe to use.

#### Acceptance Criteria

1. WHILE any data-heavy container is waiting for an async response, THE App SHALL display a SkeletonLoader placeholder in that container.
2. WHEN an async request completes, THE App SHALL replace the SkeletonLoader with the actual content without a full page re-render.
3. WHEN the User submits a form with invalid or missing required fields, THE App SHALL display inline validation error messages adjacent to the offending fields and SHALL NOT submit the data to the Server.
4. WHEN the User submits a valid form, THE App SHALL disable the submit button until the Server response is received to prevent duplicate submissions.

