# Lead Management System
I run a edtech company (Your Next Campus) focussed on helping indian students get admission to top global universities. we advertise our services/packages on meta, google, linkedin etc. We could like to create a web application to streamline our marketing operations.

## Functional Use Cases

### User Module
1. Social Registration and Login using. Restrict access to email ids with domain @yournextcampus.com
2. Data Model
User: id, firstName, lastName, email, role(admin/agent), isActive, other auth related fields...

Leads API Module
1. An API which can be invoked with our landing page solution and website to post leads to this system. This will be a server to server call, so no auth needed.

### Leads UI Module
1. Manage the leads using UI with following screens
- Dashboard
- Lead List
- Lead Details

2. Dashboard Screen
/dashboard - Overview with metrics

3. Lead List
- URL: /leads
- admin role can view all leads. agent can only view leads assigned to them.
- Filter Section with status, source, date, assigned agent
- DataTable with server-side sorting, filtering & pagination, because the data volumes will be high. 
- Columns to display in table: Lead.id, Lead.firstName, Lead.lastName, Lead.email, Lead.mobile, LeadAcquisition.createdAt (dd-mon-yyyy), LeadDiscovery.stage
- Display 20 records by default, Dropdown to select display count - 10/20/50 records

Data Model:
- Lead: id, firstName, lastName, email, mobile, request
- LeadAcquisition: id, leadId(FK), platform, campaign, adSet, ad, landingPageURL, ipv6, ipv4, createdAt
- LeadEnrichedDetails: id, leadId(FK), country, university, level, stream, subject, targetIntake, currentPursuit
- LeadProcess: id, leadId(FK), stage, notes

Page Actions:
- Assign Lead with multi-select leads
- Status Update with multi-select leads
- Export CSV with multi-select leads
- Create New Lead. Opens a form in a model window. After the submission, the user is directed to "Lead Details" page.

Sample Values:
- level: Diploma, Undergraduate, Postgraduate, PhD
- stream: Arts & Humanities, Engineering & Technology, Life Sciences & Medicine, Natural Sciences, Social Sciences & Management, etc.
- subject: Accounting & Finance, Anthropology, Business & Management Studies, Communication & Media Studies, etc.
- targetIntake: Spring-2026, Summer-2026, Fall-2026, Winter-2026
- stage: New, Not Contactable, Contacted, Marketing Qualified, Sales Qualified, Prospecting, Proposal Sent, Negotiating, Converted, Lost, Nurturing

4. Lead Details
- URL: /leads/[id] - Individual lead detail + activity timeline
- admin role can view all leads. agent can only view leads assigned to them.
- Top Header section displaying Lead.* and LeadProcess.*
- 6 Horizontal Tabs displaying information from: LeadAcquisition.* , LeadEnrichedDetails.* , DemographicProfile.* , AcademicProfile.* , WorkProfile.* and StandardizedTestScores.*
- The information in the tabs should be in read mode.

Data Model:
- DemographicProfile: id, leadId(FK), cityTier, familyIncomeRange, sourceOfIncome, willTakeEduLoan
- AcademicProfile: id, leadId(FK), studyGrade, school, schoolBoard, college, university,  studyStream, gpa, notes
- WorkProfile: id, leadId(FK), workingAt, industry, workDesignation, yearsOfExperience, notes
- StandardizedTestScores: id, leadId(FK), ieltsScore, pteScore, toeflScore, satScore, greScore, gmatScore


Page Actions:
- In the Top Header section, there should be 2 buttons. Edit Lead and Create/Edit LeadProcess. 
- Within each of the 6 tabs, there should be a button to Create/Edit the corresponding record.
- The forms should open in a model window. On saving the form, the base page should reload with the current tab in view.

Sample Values:
- studyGrade: X, XI, XII, Graduation, Post Graduation, PhD
- currentPursuit: Studying, Working, Preparing For Admission

3. Lead assignment to marketing staff - Manually as well as Rule Based (Round Robin, Based on value of the lead field etc.)

## Preferred tech stack
Frontend - Next.js 15+ (App Router) + React + TypeScript + ShadCN UI
Backend: Next.js API Routes (serverless)
Database: Postgres (NeonDB)
Auth Library: NextAuth.js. Social login with gmail only. access restricted to only @yournextcampus.com domain emails.

Conventions: 
- database column names should be snake case
- TS type atributes should be in camel case
