# Case Format Specification

This file defines the exact input format expected by `scripts/generate_case.py`.
Feed this document to any LLM before asking it to write a case — it will produce
output that parses correctly with zero manual edits.

---

## Top-level structure

Every case file has three sections, in this order:

```
CASE_ID: <unique identifier>
CASE_NAME: <human-readable name>
KEY_DETAILS:
  <key>: <value>
  <key>: <value>

STEP 1 [...]
...

STEP N [final]
...
```

- `CASE_ID` — unique slug used as the process ID and filename. Use format like `INC-2026-05134`.
- `CASE_NAME` — display name shown in the UI. E.g. `Priya Nair — Software Access Request`.
- `KEY_DETAILS` — flat key-value pairs shown in the right-hand detail panel. Any keys are valid.
  Indent each pair with 2 spaces. End the block with a blank line before the first STEP.

---

## Step header

```
STEP <n> [<options>]
```

`<n>` is the step number (1, 2, 3...). The `[options]` tag controls step behaviour:

| Tag | Meaning |
|-----|---------|
| `[2s]` | Step takes ~2 seconds to run. Any integer followed by `s`. |
| `[final]` | Last step. Marks process as Done with `completed` status. |
| `[hitl: SIGNAL_NAME]` | Pauses for human decision input. Requires `options:` block. SIGNAL_NAME is uppercase, e.g. `APPROVE_REQUEST`. |
| `[hitl]` (no signal) | Used when the step contains an `email_draft:` artifact — auto-detected as email HITL. |
| No tag | Defaults to 2s delay. |

Only one tag per step. Combine timing with final using `[final]` (timing is irrelevant on the last step).

---

## Step body fields

Each step can contain the following fields, in any order:

### `processing:`
Text shown while the step is running (spinning indicator state).
```
processing: Querying Active Directory for account status...
```

### `done:`
Text shown after the step completes (green check state).
```
done: Account confirmed as locked in Active Directory
```

### `reasoning:`
Collapsible bullet list shown under the step. Start each bullet with `- `.
```
reasoning:
  - Queried AD using employee ID from ServiceNow record
  - Account status returned as locked
  - 5 consecutive failed login attempts recorded at 09:58 AM
```

Reasoning bullets support coloured markers:
- Start with `(G)` for a green dot: `- (G) Check passed — no security flag`
- Start with `(R)` for a red dot: `- (R) Threshold exceeded — escalation required`
- No prefix = plain grey bullet

---

## Artifacts

Artifacts are clickable panels attached to a step. They appear as pill buttons under the step's
reasoning. Multiple artifacts can be attached to one step.

### `artifact: table`

Renders a key-value data panel.

```
artifact: table | <Label> | id:<unique-id>
  <Key>: <Value>
  <Key>: <Value>
  <Key>: <Value>
```

Example:
```
artifact: table | License Summary | id:tbl-001
  Vendor: Adobe Inc.
  License Type: Creative Cloud
  Seats: 40
  Assigned: 38
  Available: 2
  Expiry: 2027-01-15
```

### `artifact: link`

Renders a clickable external link button.

```
artifact: link | <Label> | id:<unique-id> | url:<https://...>
```

Example:
```
artifact: link | View Adobe Admin Console | id:lnk-001 | url:https://adminconsole.adobe.com
```

### `artifact: pdf`

Renders a PDF viewer. Requires a file served by the backend.

```
artifact: pdf | <Label> | id:<unique-id> | path:/files/<filename>.pdf
```

Example:
```
artifact: pdf | Vendor Contract | id:pdf-001 | path:/files/adobe_contract_2026.pdf
```

### `artifact: image`

Renders an image viewer.

```
artifact: image | <Label> | id:<unique-id> | path:/images/<filename>.png
```

---

## HITL — Human-in-the-loop

Two types: **decision** (radio button choice) and **email** (draft review + send).

### Decision HITL

The step pauses with a "Needs Attention" status. A decision panel opens with radio options.
When the user picks an option and clicks Confirm, the workflow resumes.

```
STEP <n> [hitl: SIGNAL_NAME]
processing: <text shown while preparing decision...>
done: <text shown on the paused step card>
hitl: <Question shown in the decision panel>
options:
  - <Option Label> | <value> | signal:<SIGNAL_NAME>
  - <Option Label> | <value> | signal:<SIGNAL_NAME>
  - <Option Label> | <value> | signal:<SIGNAL_NAME>
reasoning:
  - <why human review is needed>
```

Rules:
- `[hitl: SIGNAL_NAME]` in the header must match one of the `signal:` values in options.
  The signal that unblocks the step is whichever one the user selects.
- `value` is a short slug (e.g. `approve`, `reject`, `escalate`).
- `signal:` is the uppercase signal name sent to the backend (e.g. `APPROVE_REQUEST`).

Example:
```
STEP 3 [hitl: APPROVE_REQUEST]
processing: Flagging for manager approval...
done: Approval required — awaiting manager decision
hitl: Should this access request be approved?
options:
  - Approve Access | approve | signal:APPROVE_REQUEST
  - Reject — Policy Violation | reject | signal:REJECT_REQUEST
  - Escalate to Director | escalate | signal:ESCALATE_REQUEST
reasoning:
  - Request exceeds the auto-approve threshold for this role
  - Manager sign-off required per IT Access Policy v3.2
```

### Email HITL

The step pauses showing a Gmail-style email draft. The user reviews and clicks Send.
Clicking Send resumes the workflow.

Use a plain `[Xs]` or no tag on the step header — the `email_draft:` field auto-triggers HITL mode.

```
STEP <n> [<Xs>]
processing: <text shown while drafting...>
done: <text shown on the paused step card>
email_draft: <Label shown on the artifact pill> | id:<unique-id>
  to: <recipient@email.com>
  from: <sender@email.com>
  cc: <optional>
  subject: <email subject>
  body: <first line of body>
    <continuation lines — indented or blank lines are included until next keyword>
reasoning:
  - <why this email is being sent>
```

Rules:
- `body:` captures everything until the next step keyword (`processing:`, `done:`, `reasoning:`,
  another `artifact:`, `STEP`, etc.). Use `\n` in the body text for line breaks.
- The email is shown as read-only to the reviewer. They can only Send or close.
- After Send, the step resolves to green and the workflow continues.

Example:
```
STEP 4 [2s]
processing: Drafting access confirmation email...
done: Email ready for review — awaiting send
email_draft: Access Granted — Confirmation | id:email-001
  to: priya.nair@meridianbank.com
  from: itsupport@meridianbank.com
  subject: Adobe Creative Cloud Access Confirmed
  body: Hi Priya,\n\nYour Adobe Creative Cloud access has been provisioned.\nPlease log in at adobe.com using your company SSO.\n\nThanks,\nIT Service Desk
reasoning:
  - Access provisioned successfully
  - Standard confirmation email per IT comms policy
```

---

## Complete example

```
CASE_ID: INC-2026-05200
CASE_NAME: Tom Brady — VPN Access Request
KEY_DETAILS:
  subject: Tom Brady, Engineering
  request: Access requested for corporate VPN
  ticketId: INC-2026-05200
  priority: P2 — High
  assignedTo: IT Security Desk

STEP 1 [2s]
processing: Receiving ticket from ServiceNow...
done: Ticket received and classified as VPN access request
reasoning:
  - Ticket INC-2026-05200 ingested from ServiceNow
  - Requester identified as Tom Brady, Engineering
  - Keywords VPN and remote access matched to VPN access request classification

STEP 2 [3s]
processing: Checking VPN entitlement policy...
done: VPN access confirmed as permitted for Engineering role
reasoning:
  - (G) Queried entitlement matrix — Engineering role qualifies for full VPN access
  - (G) No security hold on account
  - No manager sign-off required for this tier
artifact: table | Entitlement Check | id:tbl-ent-001
  Role: Engineering
  VPN Tier: Full Access
  Approval Required: No
  Security Hold: None

STEP 3 [hitl: APPROVE_VPN]
processing: Flagging for security team review...
done: Security review required before provisioning
hitl: Should VPN access be provisioned for this user?
options:
  - Approve and Provision | approve | signal:APPROVE_VPN
  - Reject — Security Concern | reject | signal:REJECT_VPN
reasoning:
  - (R) User account has a recent failed MFA event — flagged for manual review
  - Policy requires security team sign-off when MFA anomalies exist

STEP 4 [2s]
processing: Provisioning VPN credentials...
done: VPN credentials issued to Tom Brady
reasoning:
  - Cisco AnyConnect profile created for tom.brady@meridianbank.com
  - Certificate issued — valid for 12 months
  - MFA device registered
artifact: table | Provisioning Summary | id:tbl-prov-001
  VPN Client: Cisco AnyConnect
  Certificate Expiry: 2027-03-11
  MFA Device: Registered
artifact: link | Download VPN Client | id:lnk-001 | url:https://vpn.meridianbank.com/download

STEP 5 [2s]
processing: Sending confirmation to requester...
done: Confirmation email sent — awaiting user acknowledgement
email_draft: VPN Access Confirmation | id:email-vpn-001
  to: tom.brady@meridianbank.com
  from: itsecurity@meridianbank.com
  subject: VPN Access Confirmed — Setup Instructions Enclosed
  body: Hi Tom,\n\nYour corporate VPN access has been provisioned.\nDownload Cisco AnyConnect at https://vpn.meridianbank.com/download\nUse your company SSO credentials to log in.\n\nThanks,\nIT Security Desk
reasoning:
  - Standard VPN onboarding email per IT comms policy
  - Includes download link and login instructions

STEP 6 [final]
processing: Closing ticket...
done: Ticket closed — VPN access active
reasoning:
  - All provisioning steps complete
  - SLA of 2 hours met — resolved in 8 minutes
  - Ticket auto-closed in ServiceNow
```

---

## Quick reference

```
CASE_ID: INC-YYYY-NNNNN
CASE_NAME: Person Name — Issue Description
KEY_DETAILS:
  key: value

STEP n [2s]                     normal step, 2 second delay
STEP n [3s]                     normal step, 3 second delay
STEP n [final]                  last step — marks process Done
STEP n [hitl: SIGNAL_NAME]      decision HITL — pauses for human choice
  + hitl: question text
  + options: block required

email_draft: Label | id:xyz     email HITL — auto-detected, no [hitl] tag needed
  + to/from/subject/body fields

artifact: table | Label | id:xyz         key-value data panel
artifact: link  | Label | id:xyz | url:  external link button
artifact: pdf   | Label | id:xyz | path: PDF viewer
artifact: image | Label | id:xyz | path: image viewer

reasoning bullet prefixes:
  - plain bullet
  - (G) green dot — check passed
  - (R) red dot   — issue found
```

---

## Rules the LLM must follow

1. Every case must have `CASE_ID`, `CASE_NAME`, `KEY_DETAILS`, and at least one `STEP`.
2. Every step must have `processing:` and `done:` (except pure HITL steps where `done:` is the paused state text).
3. The last step must have `[final]`.
4. Artifact `id:` values must be unique within the case.
5. `[hitl: SIGNAL_NAME]` steps must have an `options:` block with at least 2 options.
6. `email_draft:` does not need a `[hitl]` tag — just put `email_draft:` in the step body.
7. `body:` in an email_draft is collected until the next keyword line — use `\n` for line breaks.
8. Do not use `status: done` anywhere — the generator handles status values automatically.
9. Blank lines between sections are fine and ignored.
10. Do not add any fields not listed in this spec — unknown fields are silently ignored.
