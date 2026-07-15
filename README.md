# L’avian Core

**One request in. A coordinated business workflow out. Human judgment only where it matters.**

L’avian Core is an AI-native operating layer that turns unstructured or semi-structured customer requests into structured, executable business workflows.

This OpenAI Build Week demo uses a beauty salon booking as one clear implementation example. The product is not a salon booking application. The salon workflow demonstrates how the same Core can coordinate operations across many small-business industries.

## Overview

A customer submits a normal booking request.

L’avian Core interprets the request, structures the information, prepares downstream work, detects missing operational information, and determines whether professional judgment is required.

The employee sees one decision instead of nine coordination tasks.

## Problem

Small businesses often coordinate work across forms, calendars, customer records, staff messages, and preparation checklists.

One booking can create a chain of manual work:

1. Read the request
2. Copy the information
3. Register the customer
4. Update the schedule
5. Check the assigned staff member
6. Confirm the service
7. Check preparation requirements
8. Notify the team
9. Perform a final review

Small businesses do not need more tools.

They need fewer decisions.

## Solution

L’avian Core gives AI responsibility for repetitive coordination while keeping consequential judgment with a human.

The AI:

- interprets the request
- extracts and normalizes information
- detects missing fields
- prepares workflow updates
- creates preparation tasks
- determines whether approval is required
- recommends the next action

The human steps in only when professional judgment is necessary.

## Core message

**AI is not just answering questions. It is coordinating operations.**

## Demo workflow

1. A customer submits a salon booking.
2. GPT-5.6 interprets and structures the request.
3. The system estimates the service duration.
4. Customer, schedule, and preparation work are prepared.
5. The system detects that the color formula is missing.
6. The dashboard shows the work completed by AI.
7. One human approval is requested.
8. The employee approves the suggested formula.
9. The workflow changes to **Ready for service**.

The demo represents LINE as one possible notification layer, but the underlying workflow is channel-agnostic.

It can be connected to:

- email
- WhatsApp
- Slack
- web forms
- other messaging channels

## Before and after

### Before

A booking arrives and a human manually reads, copies, registers, schedules, checks, prepares, communicates, and confirms.

### With L’avian Core

A booking arrives.

The AI coordinates the workflow.

The human sees:

**1 decision required**

The human selects:

**Approve**

The workflow is ready.

## Architecture

```text
Customer request
        ↓
Responsive booking interface
        ↓
Server-side workflow route
        ↓
OpenAI Responses API
        ↓
Strict structured workflow state
        ↓
Operations dashboard
        ↓
Human approval
        ↓
Ready for service
