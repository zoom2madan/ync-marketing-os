# Your Next Campus - Marketing OS
This document contains the requirements for the marketing automation system for Your Next Campus.

## Key Features

### 1. Customers
- Page: Search & Results Customers. Search Section at the top. Results in table below. Server-side pagination. 
- Page: Customer Details. Display customer information at the top. Then, A table containing customer attributes.
- Customers are read-only in the marketing automation system.
- API: Provide an API for other systems to publish Customer Information & Customer Attributes to the system
- Bulk Upload: Provide a capability to upload Customer Information & Customer Attributes CSV to the system

Data Models:
CUSTOMERS
- id
- lms_lead_id
- first_name
- last_name
- email
- mobile
- created_date
- updated_date

CUSTOMER_ATTRIBUTES
- id
- customer_id (CUSTOMERS.id)
- field_type (numeric, string, date, timestamp, boolean, array)
- field_name (string)
- field_value (jsonb)
- created_date
- updated_date

## 2. Funnel Events
A funnel event happens when the customer moves from one funnel stage to another
- Page: Search & Results Events. Search Section at the top. Results in table below. Server-side pagination. 
- Page: Event Details. Display event information.
- Events are read-only in the marketing automation system.
- API: Provide an API for other systems to publish Funnel Event of a customer to the system
- Bulk Upload: Provide a capability to upload Funnel Events as CSV to the system

Domain Model:
FUNNEL_EVENTS
- id
- customer_id
- funnel_type (sales|service-delivery)
- from_stage
- to_stage
- created_date
(events are immutable, so there will be on updates to this table)

### 3. Customer Segments
- Page: Search & Results Customer Segments. Search Section at the top. Results in table below. Server-side pagination.
- Page: Customer Segment Details (View)
- Customer Segmentation Form: Create / Edit the Customer Segmentation Criteria
- Customer Segmentation Form: Upload a CSV containing Customer ID
- Page: Display Customers In Segment
    -- For type = 'manual', return the list of customer ids from CUSTOMER_SEGMENT_STATIC_LIST
    -- For type = 'sql', return the list of customer ids by executing the SQL
    -- For type = 'function', invoke the handler_function which will return an array of customer ids.

Data Models:
CUSTOMER_SEGMENTS
- id
- name
- type (manual | sql | function)
- selection_sql
- handler_function

CUSTOMER_SEGMENT_CUSTOMER_LIST
- id
- customer_segment_id (CUSTOMER_SEGMENTS.id)
- customer_id (CUSTOMERS.id)

### 4. Message Template
- Page: Search & Results Message Templates. Search Section at the top. Results in table below. Server-side pagination.
- Page: Message Template Details (View)
- Message Template Form: Create / Edit the Message Template

Data Models:
MESSAGE_TEMPLATES
- id
- name
- type (email | whatsapp)
- templating_type (mjml)
- subject
- message

### 5. Automations
- Page: Search & Results Automations. Search Section at the top. Results in table below. Server-side pagination.
- Page: Automation Detail (View)
- Automation Form: Create / Edit the Automation Detail. Dropdowns for Customer Segment and Message Template. UI based CRON expression builder with both form to expression, and expression to pre-filled form capability.

Data Models:
AUTOMATIONS
- id
- customer_segment_id
- message_template_id
- cron
- is_active


### 6. Scripts

#### 1. Setup / Refresh Automation Schedules
A combination of a shell script and a node/typescript scripts
- shell script will be executed manually as needed (refresh_automation.sh)
- node script reads all the automations data from DB (get_automation_data.ts)
- shell script reads this data and sets up or updates the CRON jobs on the system

#### 2. Automation execution
The cron jobs that get setup in the above process will invoke a node script and pass the automation_id as parameter.
e.g. run-automation.ts <automation_id>

This process should integrate with RESEND email api, for sending out emails. Do not implement the Whatsapp API integration yet.

