# L’avian Core

**One request in. A coordinated business workflow out. Human judgment only where it matters.**

L’avian Core is an AI-native operating layer that turns unstructured or semi-structured customer requests into structured, executable business workflows.

This OpenAI Build Week demo uses a beauty salon workflow as one clear implementation example. L’avian Core is not simply a salon booking application.

## Overview

A customer submits one booking request.

L’avian Core interprets the request, structures the information, prepares downstream work, detects missing operational details, and determines whether human judgment is required.

After approval, the same workflow continues through customer arrival, service, checkout, retail product sales, inventory updates, customer history, dashboard updates, and spreadsheet-ready records.

The AI handles repetitive coordination. The employee sees only the decisions that matter.

## Problem

A single customer request can create many disconnected manual steps:

1. Read the request
2. Copy the customer information
3. Register the booking
4. Update the schedule
5. Check the assigned stylist
6. Confirm the service
7. Prepare the station
8. Notify the team
9. Request approval
10. Check in the customer
11. Record the service
12. Calculate payment
13. Record retail sales
14. Reduce inventory
15. Update customer history
16. Prepare follow-up information

Small businesses do not need more tools.

They need fewer decisions.

## Solution

L’avian Core turns one customer request into a coordinated operational workflow.

The AI:

- interprets the request
- extracts operational data
- estimates duration
- detects missing information
- identifies preparation requirements
- determines whether approval is required
- recommends the next action
- prepares booking and customer records
- prepares the schedule
- creates operational tasks
- carries workflow state into visit and service operations
- prepares payment and post-visit records

The human steps in only when judgment or confirmation is required.

**9 manual coordination steps → 1 human decision**

## Demo workflow

1. A visitor opens the salon-style website entry.
2. The visitor chooses **Book an appointment** or **Send an inquiry**.
3. A customer submits a salon booking.
4. GPT-5.6 interprets and structures the request.
5. L’avian Core estimates the duration and prepares the workflow.
6. The system detects that the color formula is missing.
7. The operations view displays completed AI actions.
8. The stylist approves the suggested color formula.
9. The customer arrives and is checked in.
10. The completed service and added option are recorded.
11. Retail products can be added to checkout.
12. Service charges, option charges, product sales, discount, tax, and final amount are calculated.
13. A payment method is selected and payment is completed.
14. Purchased product quantities are deducted from inventory.
15. Low-stock, out-of-stock, and reorder-candidate states are generated.
16. Customer history and the next-visit recommendation are prepared.
17. The store dashboard shows bookings, approvals, sales, payment, history, inventory, and sync status.
18. Google Sheets records are updated when the secure server-side connection is configured.
19. The workflow becomes **Completed**.

## Website entry and store dashboard

The first screen is a quiet, salon-style website rather than an AI chat screen. It introduces the service, stylists, booking path, and the operating layer behind the customer experience.

The website entry is only one channel. The same workflow can also begin from LINE, email, messaging apps, web forms, or another connected channel.

After payment, the demo presents a store-facing web dashboard in the same application. It shows:

- today’s bookings
- approvals remaining
- completed workflows
- today’s sales and payment status
- customer record and visit history
- next-visit recommendation
- inventory status, low-stock, out-of-stock, and reorder states
- Google Sheets synchronization status

This keeps the customer experience and business operations in one visible workflow without pretending that a separate back office has been implemented.

## Main demonstration value

### Fewer decisions, not more tools

Small businesses do not need another disconnected management interface.

L’avian Core coordinates the work across the full customer workflow.

### AI does the coordination work

The model does not only answer a question or write text.

It interprets the request, structures data, detects missing information, determines workflow state, prepares tasks, and isolates the required human decision.

### One Core, many industries

The beauty salon is the demonstration workflow.

The same Core concept can apply different schemas and operational rules to nail salons, esthetic salons, fitness studios, yoga studios, lessons, personal training, real estate, and sales workflows.

## Screens and workflow states

The demo includes:

- Customer Booking
- AI Processing
- Human Approval
- Customer Arrival
- Visit Check-in
- Service Record
- Added Options
- Checkout
- Payment
- Retail Product Sales
- Inventory Update
- Low-stock Alert
- Out-of-stock Status
- Reorder Candidate
- Customer History
- Next-visit Recommendation
- Spreadsheet Sync Status
- Workflow Completion

## Checkout calculations

The checkout workflow includes:

- service charge
- option charge
- retail product sales
- discount
- subtotal
- tax
- total due
- payment method
- final received amount

Inventory is reduced only after payment is completed.

## Product and inventory workflow

The demonstration product master includes synthetic salon products such as shampoo, treatment, and hair oil.

Each product includes:

- product ID
- SKU
- product name
- unit price
- current stock
- low-stock threshold
- selected purchase quantity

After payment:

- the purchased quantity is deducted
- remaining stock is calculated
- low stock is detected
- zero stock becomes out of stock
- products requiring replenishment become reorder candidates

## Customer history and post-visit processing

After checkout, L’avian Core prepares:

- visit history
- performed service
- color formula
- treatment and option details
- service notes
- payment details
- retail purchase details
- final received amount
- next-visit recommendation
- inventory movements
- workflow history
- dashboard updates
- spreadsheet records

## Architecture

Customer Request  
→ Salon Website Entry  
→ Next.js Web Application  
→ Server-side Processing Route  
→ OpenAI Responses API  
→ Structured Workflow State  
→ Human Approval  
→ Visit and Service Workflow  
→ Checkout and Retail Sales  
→ Inventory Update  
→ Customer History  
→ Store Dashboard  
→ Google Sheets Sync  
→ Completed Workflow

Main components:

- responsive React interface
- Next.js server-side API routes
- OpenAI Responses API
- strict JSON Schema output
- server-side environment variables
- deterministic fallback for interface review
- server-side Google Sheets service-account sync
- synthetic demonstration product and customer data

## How GPT-5.6 is used

GPT-5.6 is used as the workflow interpreter at the center of the demo.

It is not used only for explanatory text.

The model receives unstructured or semi-structured booking data and performs the following tasks:

- interpret the customer request
- extract customer, service, stylist, date, and time
- estimate service duration
- identify preparation requirements
- detect missing information
- determine whether approval is required
- recommend the next action
- return a structured workflow state

The server requests strict JSON Schema output so the dashboard receives stable operational fields.

The model is configured through `OPENAI_MODEL`.

The live deployment uses `gpt-5.6` when that model is available to the configured OpenAI project.

The API key is never exposed to the browser. It is stored only in the server-side `OPENAI_API_KEY` environment variable.

The interface displays **GPT-5.6 LIVE** only after a successful live model response.

## How Codex was used

Codex was used throughout the Build Week project for:

- reviewing reusable L’avian Core principles without modifying the existing source of truth
- selecting the minimum public-demo architecture
- implementing the booking workflow
- implementing structured OpenAI output
- implementing human approval
- implementing arrival and service states
- implementing checkout and payment calculations
- implementing product sales and inventory reduction
- implementing low-stock and reorder-candidate states
- implementing customer-history preparation
- implementing spreadsheet synchronization support
- responsive interface development
- debugging and implementation review
- lint and production-build validation
- README and submission-material preparation

## Setup

Requirements:

- Node.js 22.13 or later
- an OpenAI API key
- access to the model configured through `OPENAI_MODEL`

Install dependencies:

    npm install

Create `.env.local` from `.env.example`.

Required OpenAI variables:

    OPENAI_API_KEY=your_api_key_here
    OPENAI_MODEL=gpt-5.6

Required spreadsheet variables for live sync:

    GOOGLE_SHEETS_ID=
    GOOGLE_SERVICE_ACCOUNT_EMAIL=
    GOOGLE_PRIVATE_KEY=

Never commit `.env.local`, API keys, webhook URLs, tokens, private credentials, or production customer information to GitHub.

## Running locally

Start the development server:

    npm run dev

Open the local URL shown by Next.js.

Create a production build:

    npm run build

Run the production build:

    npm run start

## Vercel deployment

1. Import this GitHub repository into Vercel.
2. Confirm that Vercel detects Next.js.
3. Add `OPENAI_API_KEY` in Project Settings → Environment Variables.
4. Add `OPENAI_MODEL` with the value `gpt-5.6`.
5. Add `GOOGLE_SHEETS_ID`, `GOOGLE_SERVICE_ACCOUNT_EMAIL`, and `GOOGLE_PRIVATE_KEY` only when live Sheets sync is required.
6. Keep all secrets server-side.
7. Redeploy after saving the environment variables.
8. Submit the sample booking.
9. Confirm that the interface displays **GPT-5.6 LIVE** when the live model responds.
10. Confirm **Google Sheets Sync** after completing payment when the service-account connection is configured.

## Demo instructions

1. Open the demo website.
2. Select **Book now**, **Book an appointment**, or **Send an inquiry**.
3. Keep the prefilled Hana Yamada booking.
4. Select a stylist, available time, and service.
5. Confirm the appointment.
6. Review the structured booking and AI actions.
7. Approve **Warm Brown 7**.
8. Check in the customer.
9. Review the service record and option.
10. Proceed to checkout and add a retail product.
11. Review service, option, product, discount, tax, and final amount.
12. Select the payment method and complete payment.
13. Review the store dashboard.
14. Review updated inventory, customer history, next visit, and Sheets status.
15. Confirm that the workflow is completed.

## Test scenario

| Field | Value |
| --- | --- |
| Customer | Hana Yamada |
| Service | Cut + Color |
| Stylist | Yuko Sato |
| Date | July 20, 2026 |
| Time | 3:00 PM |
| Suggested color | Warm Brown 7 |
| Service charge | $140 |
| Option charge | $20 |
| Discount | $10 |
| Tax rate | 10% |
| Payment method | Card |

Expected result:

- the booking is structured
- a 120-minute duration is estimated
- preparation tasks are generated
- the missing color formula is detected
- one human approval is requested
- the customer can be checked in
- service details can be recorded
- product purchases can be added
- service, option, product, discount, and tax values are calculated
- payment can be completed
- inventory is automatically reduced
- low-stock and reorder-candidate states are displayed
- customer history is prepared
- the next visit is recommended for 6–8 weeks
- spreadsheet sync status is displayed
- the workflow reaches Completed

## Validation

The project was checked with:

    npm run lint
    npm run build

The complete workflow was implemented from booking through payment, inventory update, and post-visit completion.

Live GPT-5.6 verification must be performed again after `OPENAI_API_KEY` is configured in the Vercel production environment.

Live spreadsheet verification must be performed only after the Google Sheets service-account variables are securely configured.

## Security and demo limitations

- No production L’avian Core files were modified.
- No production customer data is included.
- No private Google Drive credentials are included.
- No API key is stored in the repository.
- API credentials are read only from server-side environment variables.
- The demo uses synthetic customer and product data.
- Workflow state is maintained in the demonstration interface.
- The demo does not directly modify a production salon calendar or CRM.
- Google Sheets synchronization requires the separately configured server-side service-account variables.
- When no OpenAI key is configured, the application uses a deterministic fallback and displays **DEMO MODE**.
- **GPT-5.6 LIVE** is displayed only after a successful live model response.
- Product and color suggestions are demonstration content.

## Spreadsheet record design

The synchronization payload includes:

- booking
- customer
- visit time
- performed service
- stylist
- service notes
- selected option
- service charge
- option charge
- purchased products
- product quantities
- unit prices
- product sales amount
- discount
- tax
- final amount
- payment method
- inventory remaining
- inventory status
- next-visit recommendation
- completion timestamp

The live route writes customer, booking, visit/service, payment/sales, and inventory records to the configured spreadsheet tabs. The browser never receives the service-account private key.

## Future direction

The same Core can apply different schemas and operational rules to:

- beauty salons
- nail salons
- esthetic salons
- fitness studios
- yoga studios
- lessons
- personal training
- real estate
- sales workflows

The longer-term direction is AI-readable operations in which AI can understand:

- versions
- builds
- dependencies
- approvals
- workflow state
- change history
- reasons for change

## Build Week notes

- Project: L’avian Core
- Category: Work & Productivity
- Core message: **AI is not just answering questions. It is coordinating operations.**
- Scope: one complete beauty salon workflow
- Entry: salon-style website to customer booking to store dashboard
- Existing L’avian Core source-of-truth files were not modified
- `/feedback` should be run from the primary Build Week project session after final deployment and live API verification

## Final message

Most business software helps humans manage work.

L’avian Core helps AI coordinate the work — and brings humans back only for judgment.

**One request in. A coordinated business workflow out. Human judgment only where it matters.**
