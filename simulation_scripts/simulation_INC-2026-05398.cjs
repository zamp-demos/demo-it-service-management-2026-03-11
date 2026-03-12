const fs = require('fs');
const path = require('path');

// --- Configuration ---
const PROJECT_ROOT = path.join(__dirname, '..');
const PUBLIC_DATA_DIR = path.join(PROJECT_ROOT, 'public/data');
const PROCESSES_FILE = path.join(PUBLIC_DATA_DIR, 'processes.json');
const PROCESS_ID = "INC-2026-05398";
const CASE_NAME = "Daniel Harris — Actimize Access Request";

// --- Helpers ---
const readJson  = (file) => (fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : []);
const writeJson = (file, data) => fs.writeFileSync(file, JSON.stringify(data, null, 4));
const delay     = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const updateProcessLog = (processId, logEntry, keyDetailsUpdate = {}) => {
    const processFile = path.join(PUBLIC_DATA_DIR, `process_${processId}.json`);
    let data = { logs: [], keyDetails: {}, sidebarArtifacts: [] };
    if (fs.existsSync(processFile)) data = readJson(processFile);

    if (logEntry) {
        const existingIdx = logEntry.id ? data.logs.findIndex(l => l.id === logEntry.id) : -1;
        if (existingIdx !== -1) {
            data.logs[existingIdx] = { ...data.logs[existingIdx], ...logEntry };
        } else {
            data.logs.push(logEntry);
        }
    }

    if (keyDetailsUpdate && Object.keys(keyDetailsUpdate).length > 0) {
        data.keyDetails = { ...data.keyDetails, ...keyDetailsUpdate };
    }
    writeJson(processFile, data);
};

const updateProcessListStatus = async (processId, status, currentStatus) => {
    const apiUrl = process.env.VITE_API_URL || 'http://localhost:3001';
    try {
        const response = await fetch(`${apiUrl}/api/update-status`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: processId, status, currentStatus })
        });
        if (!response.ok) throw new Error(`Server returned ${response.status}`);
    } catch (e) {
        try {
            const processes = JSON.parse(fs.readFileSync(PROCESSES_FILE, 'utf8'));
            const idx = processes.findIndex(p => p.id === String(processId));
            if (idx !== -1) {
                processes[idx].status = status;
                processes[idx].currentStatus = currentStatus;
                fs.writeFileSync(PROCESSES_FILE, JSON.stringify(processes, null, 4));
            }
        } catch (err) { }
    }
};

const waitForEmail = async () => {
    console.log("Waiting for user to send email...");
    const API_URL = process.env.VITE_API_URL || 'http://localhost:3001';
    try {
        await fetch(`${API_URL}/email-status`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sent: false })
        });
    } catch (e) {}
    while (true) {
        try {
            const response = await fetch(`${API_URL}/email-status`);
            if (response.ok) {
                const { sent } = await response.json();
                if (sent) { console.log("Email sent!"); return true; }
            }
        } catch (e) { }
        await delay(2000);
    }
};

(async () => {
    console.log(`Starting ${PROCESS_ID}: ${CASE_NAME}...`);

    writeJson(path.join(PUBLIC_DATA_DIR, `process_${PROCESS_ID}.json`), {
        logs: [],
        keyDetails: {
            "subject": "Daniel Harris, AML Compliance",
            "request": "Actimize license provisioning \u2014 new joiner",
            "ticketId": "INC-2026-05398",
            "priority": "P2 \u2014 High",
            "submittedBy": "Michael Torres, AML Compliance Manager",
            "assignedTo": "IT Service Desk"
},
        sidebarArtifacts: []
    });

    const steps = [
        {
            id: "step-1",
            title_p: "Receiving ticket from ServiceNow...",
            title_s: "Ticket received and classified as software access request — new joiner",
            reasoning: [
                "Ticket INC-2026-05398 ingested from ServiceNow via API",
                "Request submitted by Michael Torres on behalf of new joiner Daniel Harris",
                "Software identified as Actimize \u2014 core AML transaction monitoring platform",
                "New joiner flag detected \u2014 start date March 17 noted in ticket body",
                "Priority set to P2 given compliance role and regulatory function of requested software"
],
            artifacts: [
                { id: "tbl-ticket-001", type: "table", label: "Ticket Details", data: {"Ticket ID": "INC-2026-05398", "New Joiner": "Daniel Harris", "Department": "AML Compliance", "Role": "AML Compliance Analyst", "Software Requested": "Actimize", "Start Date": "2026-03-17", "Submitted By": "Michael Torres \u2014 AML Compliance Manager", "Priority": "P2 \u2014 High"} }
            ],
            delay_ms: 2000
        },
        {
            id: "step-2",
            title_p: "Checking entitlement matrix for AML Compliance Analyst role...",
            title_s: "Actimize confirmed as standard entitlement for AML Compliance Analyst role",
            reasoning: [
                "Queried internal entitlement matrix using Daniel Harris's role and department",
                "AML Compliance Analyst mapped to Actimize as a core required platform",
                "Access tier identified as Standard Analyst \u2014 transaction monitoring and alert review permissions",
                "No manager sign-off required for new joiner provisioning of entitled software",
                "Entitlement check passed \u2014 proceeding to license inventory check"
],
            artifacts: [
                { id: "tbl-ent-001", type: "table", label: "Entitlement Check", data: {"Requester Role": "AML Compliance Analyst", "Department": "AML Compliance", "Software Requested": "Actimize", "Access Tier": "Standard Analyst", "Entitlement Status": "Approved", "Approval Required": "None", "Policy Reference": "IT-SW-Policy-5.2"} }
            ],
            delay_ms: 3000
        },
        {
            id: "step-3",
            title_p: "Checking Actimize license inventory...",
            title_s: "License pool exhausted — 0 unassigned seats available",
            reasoning: [
                "Navigated SaaS management tool to Actimize license pool",
                "Total licenses under current contract: 50, currently assigned: 50",
                "No licenses recoverable from inactive users \u2014 all 50 seats active within the past 30 days",
                "Provisioning cannot proceed from existing pool",
                "Procurement request required to acquire an additional seat"
],
            artifacts: [
                { id: "tbl-lic-001", type: "table", label: "License Inventory", data: {"Software": "Actimize", "Total Licenses": "50", "Assigned": "50", "Unassigned": "0", "Inactive Seats Recoverable": "0", "Status": "Pool Exhausted \u2014 Procurement Required", "Cost Per Additional Seat": "$18,000 / year"} }
            ],
            delay_ms: 4000
        },
        {
            id: "step-4",
            title_p: "Assembling and submitting procurement request...",
            title_s: "Procurement request raised in procurement portal — awaiting approval",
            reasoning: [
                "Navigated internal procurement portal to raise a new software seat request",
                "Request populated with software name, vendor, cost per seat, and business justification drawn from ticket body",
                "Urgency flag set given Daniel Harris's start date of March 17",
                "Request submitted and procurement reference number returned"
],
            artifacts: [
                { id: "tbl-proc-001", type: "table", label: "Procurement Request", data: {"Procurement Reference": "PROC-2026-00892", "Software": "Actimize", "Vendor": "NICE Actimize", "Seats Requested": "1", "Cost Per Seat": "$18,000 / year", "Business Justification": "New AML Compliance Analyst \u2014 core platform access required from start date", "Urgency": "High \u2014 Start Date March 17", "Status": "Pending Procurement Approval"} }
            ],
            delay_ms: 3000
        },
        {
            id: "step-5",
            title_p: "Notifying manager of procurement hold...",
            title_s: "Michael Torres notified — ticket placed on hold pending procurement approval",
            reasoning: [
                "Manager notified proactively ahead of Daniel's start date",
                "Daniel copied so he is aware of the situation before day one",
                "No action requested from manager at this stage"
],
            artifacts: [
                { id: "email-proc-001", type: "email_draft", label: "Actimize Access Request — Procurement In Progress", data: {"to": "michael.torres@meridianbank.com", "from": "itservicedesk@meridianbank.com", "cc": "daniel.harris@meridianbank.com", "bcc": "", "subject": "Actimize Access Request for Daniel Harris \u2014 Procurement Underway", "body": "Hi Michael,\n\nWe have picked up the Actimize access request for Daniel Harris (INC-2026-05398).\n\nDaniel's role qualifies for Actimize access and the entitlement check has passed. However, the current license pool is fully allocated and we are unable to assign a seat from the existing inventory.\n\nWe have raised an urgent procurement request (PROC-2026-00892) to acquire an additional seat and have flagged it as high priority given Daniel's start date of March 17.\n\nWe will keep you updated and will provision Daniel's access as soon as the seat is confirmed. No action is required from your side at this stage.\n\nThanks,\nIT Service Desk\nMeridian Bank", "isIncoming": false, "isSent": false} }
            ],
            delay_ms: 2000,
            isEmailHitl: true
        },
        {
            id: "step-6",
            title_p: "Waiting for procurement approval...",
            title_s: "Procurement request PROC-2026-00892 approved — new Actimize seat confirmed",
            reasoning: [
                "Procurement portal polled for status update on PROC-2026-00892",
                "Approval received from Sarah Kim, Head of Procurement",
                "Purchase order raised against NICE Actimize vendor contract",
                "New seat activated in Actimize license pool \u2014 available seats updated from 0 to 1"
],
            artifacts: [
                { id: "tbl-procapp-001", type: "table", label: "Procurement Approval", data: {"Procurement Reference": "PROC-2026-00892", "Approved By": "Sarah Kim \u2014 Head of Procurement", "Purchase Order": "PO-2026-03-1142", "New Seats Activated": "1", "Updated License Pool": "51 total \u2014 50 assigned \u2014 1 available", "Status": "Approved"} }
            ],
            delay_ms: 2000
        },
        {
            id: "step-7",
            title_p: "Provisioning Daniel Harris in Actimize admin portal...",
            title_s: "Actimize account created and permissions assigned for Daniel Harris",
            reasoning: [
                "Navigated Actimize admin portal to user management panel",
                "Searched for daniel.harris@meridianbank.com \u2014 no existing profile found",
                "Created new user profile with AML Compliance Analyst role",
                "Standard Analyst permission set assigned \u2014 transaction monitoring, alert review, case management, report access"
],
            artifacts: [
                { id: "tbl-prov-001", type: "table", label: "Provisioning Confirmation", data: {"User": "Daniel Harris", "Email": "daniel.harris@meridianbank.com", "Role": "AML Compliance Analyst", "Permission Set": "Standard Analyst", "Access": "Transaction Monitoring, Alert Review, Case Management, Reports", "Account Status": "Active"} }
            ],
            delay_ms: 4000
        },
        {
            id: "step-8",
            title_p: "Drafting confirmation to Daniel Harris and Michael Torres...",
            title_s: "Confirmation email ready — awaiting send",
            reasoning: [
                "Confirmation sent to Daniel ahead of his March 17 start date",
                "Michael Torres copied as the requesting manager",
                "Access scope outlined so Daniel knows what he can do on day one"
],
            artifacts: [
                { id: "email-confirm-001", type: "email_draft", label: "Actimize Access Confirmed — Daniel Harris", data: {"to": "daniel.harris@meridianbank.com", "from": "itservicedesk@meridianbank.com", "cc": "michael.torres@meridianbank.com", "bcc": "", "subject": "Your Actimize Access Is Ready \u2014 Login Instructions Inside", "body": "Hi Daniel,\n\nWelcome to Meridian Bank. Your Actimize access has been provisioned and is ready for your start date on March 17.\n\nLogin URL: https://actimize.meridianbank.com\nUsername: daniel.harris@meridianbank.com\nPassword: You will receive a separate activation email from Actimize to set your password.\n\nYour account has been set up with Standard Analyst access which includes transaction monitoring, alert review and disposition, case creation and management, and the reporting dashboard.\n\nIf you have any issues on your first day please contact the IT Service Desk at itsecuritydesk@meridianbank.com or call extension 4400.\n\nIT Service Desk\nMeridian Bank", "isIncoming": false, "isSent": false} }
            ],
            delay_ms: 2000,
            isEmailHitl: true
        },
        {
            id: "step-9",
            title_p: "Closing ticket in ServiceNow...",
            title_s: "Ticket closed — Actimize access fully provisioned",
            reasoning: [
                "Entitlement check passed, procurement raised and approved, account provisioned, confirmation sent",
                "ServiceNow ticket INC-2026-05398 updated and closed",
                "Full audit trail logged across entitlement matrix, procurement portal, Actimize admin, and communications"
],
            artifacts: [
                { id: "tbl-res-001", type: "table", label: "Resolution Summary", data: {"Ticket ID": "INC-2026-05398", "Status": "Closed", "Submitted": "2026-03-12", "Provisioned": "2026-03-14", "SLA Status": "Met"} }
            ],
            delay_ms: 2000,
            isFinal: true
        }
    ];

    for (let i = 0; i < steps.length; i++) {
        const step = steps[i];
        const isFinal = step.isFinal || i === steps.length - 1;

        // --- processing write ---
        updateProcessLog(PROCESS_ID, {
            id: step.id,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            title: step.title_p,
            status: "processing"
        });
        await updateProcessListStatus(PROCESS_ID, "In Progress", step.title_p);
        await delay(step.delay_ms || 2200);

        // --- decision HITL ---
        if (step.isHitl) {
            const decisionArtifact = {
                id: `decision-${step.id}`,
                type: "decision",
                label: "Manual Review",
                data: {
                    question: step.hitlQuestion || step.title_s,
                    options: step.hitlOptions || []
                }
            };
            const allArtifacts = [...(step.artifacts || []), decisionArtifact];
            updateProcessLog(PROCESS_ID, {
                id: step.id,
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                title: step.title_s,
                status: "warning",
                reasoning: step.reasoning || [],
                artifacts: allArtifacts
            });
            await updateProcessListStatus(PROCESS_ID, "Needs Attention", step.title_s);
            await waitForSignal(step.signalName);
            await updateProcessListStatus(PROCESS_ID, "In Progress", `Approved: ${step.title_s}`);
            await delay(1500);

        // --- email HITL ---
        } else if (step.isEmailHitl) {
            updateProcessLog(PROCESS_ID, {
                id: step.id,
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                title: step.title_s,
                status: "warning",
                reasoning: step.reasoning || [],
                artifacts: step.artifacts || []
            });
            await updateProcessListStatus(PROCESS_ID, "Needs Attention", "Draft Review: Email Pending");
            await waitForEmail();
            updateProcessLog(PROCESS_ID, {
                id: step.id,
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                title: "Email sent successfully",
                status: "success",
                reasoning: step.reasoning || [],
                artifacts: step.artifacts || []
            });
            await updateProcessListStatus(PROCESS_ID, "In Progress", "Email sent");
            await delay(1500);

        // --- normal step ---
        } else {
            updateProcessLog(PROCESS_ID, {
                id: step.id,
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                title: step.title_s,
                status: isFinal ? "completed" : "success",
                reasoning: step.reasoning || [],
                artifacts: step.artifacts || []
            });
            await updateProcessListStatus(PROCESS_ID, isFinal ? "Done" : "In Progress", step.title_s);
            await delay(1500);
        }
    }

    console.log(`${PROCESS_ID} Complete: ${CASE_NAME}`);
})();

