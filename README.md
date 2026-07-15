# L’avian Core

**One request in. A coordinated business workflow out. Human judgment only where it matters.**

L’avian Core is an AI-native operating layer that turns unstructured or semi-structured customer requests into structured, executable business workflows.

This OpenAI Build Week demo uses a beauty salon booking as one clear implementation example. L’avian Core is not simply a salon booking application.

## Overview

A customer submits one booking request. L’avian Core interprets it, structures the information, prepares downstream work, detects missing operational details, and determines whether human judgment is required.

The AI handles repetitive coordination. The employee sees only the decision that matters.

## Problem

A single customer request can create many manual steps:

1. Read the request
2. Copy the information
3. Register the customer
4. Update the schedule
5. Check the assigned staff member
6. Confirm the service
7. Check preparation requirements
8. Notify the team
9. Perform a final confirmation

Small businesses do not need more tools. They need fewer decisions.

## Solution

L’avian Core turns one request into a structured workflow state.

The AI:

- interprets the request
- extracts operational data
- detects missing information
- determines the next action
- prepares customer and schedule updates
- creates preparation tasks
- produces an approval request when judgment is required

The human steps in only for the remaining decision.

**9 manual steps → 1 human decision**

## Demo workflow

1. A customer opens the booking form.
2. The customer selects a service, stylist, date, and time.
3. The booking is submitted.
4. GPT-5.6 interprets and structures the request.
5. L’avian Core prepares the operational workflow.
6. The system detects that the color formula is missing.
7. The dashboard displays completed AI actions and one required approval.
8. The employee approves the suggested option.
9. The workflow becomes **Ready for service**.

LINE is represented as a possible customer-facing notification interface in this demo, but the underlying workflow is channel-agnostic. It can later connect to email, WhatsApp, Slack, web forms, or other messaging channels.

## Architecture

Customer request → Next.js web application → Server-side API route → OpenAI Responses API → Structured workflow state → Operations dashboard → Human approval → Ready for service

Main components:

- responsive React interface
- Next.js server-side processing route
- OpenAI Responses API
- strict JSON Schema output
- server-side environment variables
- deterministic fallback for interface review when the API is unavailable

## How GPT-5.6 is used

GPT-5.6 is used as the workflow interpreter at is used

GPT-5.6 is used as the the center of the demo. It is not used only to generate explanatory text.

The model receives unstructured or semi-structured booking data and performs the following tasks:

- interpret the customer request
- extract customer, service, stylist, date, and time
- estimate service duration
- identify preparation requirements
- detect missing information
- determine whether approval is required
- recommend the next action
- return a structured workflow state

The server requests a strict JSON Schema response so the application receives stable fields that can be used directly by the dashboard.

The model is configured through `OPENAI_MODEL`. The live deployment uses `gpt-5.6` when that model is available to the configured OpenAI project.

The API key is never exposed to the browser. It is stored only as the server-side `OPENAI_API_KEY` environment variable.

## How Codex was used

Codex was used throughout the Build Week project for:

- reviewing the existing L’avian Core design principles without changing the source of truth
- selecting the minimum viable architecture
- implementing the customer booking experience
- implementing the business operations dashboard
- integrating structured OpenAI model output
- debugging and responsive UI iteration
- lint and production-build validation
- interaction testing
- README and submission-material preparation
- implementation review

## Setup

Requirements:

- Node.js 22.13 or later
- an OpenAI API key
- access to the model configured by `OPENAI_MODEL`

Install dependencies:

    npm install

Create a local environment file based on `.env.example`.

Required environment variables:

    OPENAI_API_KEY=your_api_key_here
    OPENAI_MODEL=gpt-5.6

Never commit `.env.local` or a real API key to GitHub.

## Running locally

Start the development server:

    npm run dev

Open the local URL displayed by Next.js.

For a production build:

    npm run build
    npm run start

## Demo instructions

1. Open the demo.
2. Keep the prefilled sample booking.
3. Select **Submit booking**.
4. Watch L’avian Core process the request.
5. Review the booking, AI actions, and preparation state.
6. Confirm that one human decision is required.
7. Select **Approve suggestion**.
8. Confirm that the workflow changes to **Ready for service**.

## Test scenario

| Field | Value |
| --- | --- |
| Customer | Hana Yamada |
| Service | Cut + Color |
| Stylist | Yuko Sato |
| Date | July 20, 2026 |
| Time | 3:00 PM |

Expected result:

- booking information is structured
- a 120-minute service duration is estimated
- the customer record and schedule update are prepared
- a preparation task is created
- the missing color formula is detected
- human approval is requested
- the suggested option is Warm Brown 7
- approval changes the workflow to Ready for service

A haircut-only request can also be used to demonstrate a workflow that does not require color-formula approval.

## Validation

The project was checked with:

    npm run lint
    npm run build

The primary workflow was tested from booking submission through approval and completed state.

Live GPT-5.6 verification must be performed again after `OPENAI_API_KEY` is configured in the deployment environment.

## Security and demo limitations

- No production L’avian Core data is included.
- No private Google Drive credentials or file identifiers are included.
- No real API key is stored in the code or repository.
- API credentials are read only from server-side environment variables.
- The demo uses synthetic customer data.
- Workflow state is held in the demonstration interface.
- The demo does not write to a real calendar, CRM, LINE account, or notification service.
- When the API key is absent or an API request fails, the application uses a deterministic fallback and displays **DEMO MODE**.
- **GPT-5.6 LIVE** is displayed only after a successful live model response.
- Suggested color options are demonstration content, not professional color advice.

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

The longer-term direction is AI-readable operations in which AI can understand versions, builds, dependencies, approvals, workflow state, change history, and reasons for change.

## Build Week notes

- Project: L’avian Core
- Category: Work & Productivity
- Core message: **AI is not just answering questions. It is coordinating operations.**
- Scope: one complete beauty salon workflow
- Existing L’avian Core source-of-truth files were not modified
- `/feedback` should be run from the primary Build Week project session after final deployment and live API verification

## Core message

Most business software helps humans manage work.

L’avian Core helps AI coordinate the work — and brings humans back only for judgment.

**One request in. A coordinated business workflow out. Human judgment only where it matters.**
