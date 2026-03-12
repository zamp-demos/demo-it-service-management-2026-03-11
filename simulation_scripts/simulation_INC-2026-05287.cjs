const fs = require('fs');
const path = require('path');

// --- Configuration ---
const PROJECT_ROOT = path.join(__dirname, '..');
const PUBLIC_DATA_DIR = path.join(PROJECT_ROOT, 'public/data');
const PROCESSES_FILE = path.join(PUBLIC_DATA_DIR, 'processes.json');
const PROCESS_ID = "INC-2026-05287";
const CASE_NAME = "Sarah Mitchell — Adobe Creative Cloud Access Request";

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
            "subject": "Sarah Mitchell, Marketing",
            "request": "Adobe Creative Cloud license provisioning",
            "ticketId": "INC-2026-05287",
            "priority": "P3 \u2014 Medium",
            "assignedTo": "IT Service Desk"
},
        sidebarArtifacts: []
    });

    const steps = [
        {
            id: "step-1",
            title_p: "Receiving ticket from ServiceNow...",
            title_s: "Ticket received and classified as software access request",
            reasoning: [
                "Ticket INC-2026-05287 ingested from ServiceNow via API",
                "Requester identified as Sarah Mitchell, Marketing Department",
                "Request body parsed \u2014 software identified as Adobe Creative Cloud",
                "Priority set to P3, no SLA breach risk at current time"
],
            artifacts: [
                { id: "tbl-ticket-001", type: "table", label: "Ticket Details", data: {"Ticket ID": "INC-2026-05287", "Requester": "Sarah Mitchell", "Department": "Marketing", "Software Requested": "Adobe Creative Cloud", "Priority": "P3 \u2014 Medium", "Submitted": "2026-03-12 09:14 AM"} }
            ],
            delay_ms: 2000
        },
        {
            id: "step-2",
            title_p: "Checking entitlement matrix for requester role...",
            title_s: "Adobe Creative Cloud confirmed as approved software for Marketing department",
            reasoning: [
                "Queried internal entitlement matrix using Sarah Mitchell's role and department",
                "Marketing department mapped to Adobe Creative Cloud as standard approved software",
                "No manager sign-off required for this entitlement tier",
                "No budget approval threshold triggered at this license cost"
],
            artifacts: [
                { id: "tbl-ent-001", type: "table", label: "Entitlement Check", data: {"Requester Role": "Marketing Specialist", "Department": "Marketing", "Software Requested": "Adobe Creative Cloud", "Entitlement Status": "Approved", "Approval Required": "None", "Policy Reference": "IT-SW-Policy-2.4"} }
            ],
            delay_ms: 3000
        },
        {
            id: "step-3",
            title_p: "Checking license inventory in SaaS management tool...",
            title_s: "4 unassigned licenses confirmed — sufficient to proceed",
            reasoning: [
                "Navigated SaaS management tool to Adobe Creative Cloud license pool",
                "Total licenses provisioned: 40",
                "Currently assigned: 36",
                "Unassigned licenses available: 4",
                "No procurement request required \u2014 within available pool"
],
            artifacts: [
                { id: "tbl-lic-001", type: "table", label: "License Inventory", data: {"Software": "Adobe Creative Cloud", "Total Licenses": "40", "Assigned": "36", "Unassigned": "4", "Status": "Available \u2014 No Procurement Needed"} }
            ],
            delay_ms: 3000
        },
        {
            id: "step-4",
            title_p: "Provisioning license in Adobe Admin Console...",
            title_s: "License assigned to Sarah Mitchell — access active",
            reasoning: [
                "Navigated Adobe Admin Console to user management panel",
                "Located sarah.mitchell@boa.com \u2014 no existing Adobe profile found",
                "Created user profile and assigned one Creative Cloud All Apps license",
                "Activation confirmed immediately upon assignment",
                "License inventory updated \u2014 3 unassigned licenses remaining"
],
            artifacts: [
                { id: "tbl-prov-001", type: "table", label: "Provisioning Confirmation", data: {"User": "sarah.mitchell@boa.com", "License Tier": "Creative Cloud All Apps", "Activation Status": "Active", "Provisioned At": "2026-03-12 09:19 AM", "Remaining Unassigned Licenses": "3"} },
                { id: "vid-prov-001", type: "video", label: "Browser Agent Recording", videoPath: "/data/adobe_admin_console_INC-2026-05287.webm" }
            ],
            delay_ms: 4000
        },
        {
            id: "step-5",
            title_p: "Drafting confirmation email to requester...",
            title_s: "Confirmation email ready — awaiting send",
            reasoning: [
                "Confirmation email drafted with SSO login instructions and direct access link",
                "Email personalised to Sarah Mitchell with her provisioned email address",
                "Reply routed back to original ticket for traceability"
],
            artifacts: [
                { id: "email-adobe-001", type: "email_draft", label: "Adobe Access Confirmation", data: {"to": "sarah.mitchell@boa.com", "from": "itservicedesk@boa.com", "cc": "", "bcc": "", "subject": "Adobe Creative Cloud Access Confirmed", "body": "Hi Sarah,\n\nYour Adobe Creative Cloud access has been provisioned and is ready to use.\n\nTo get started, visit https://creativecloud.adobe.com and sign in using your company SSO credentials (sarah.mitchell@boa.com).\n\nYou have access to the full Creative Cloud All Apps suite. If you run into any issues signing in, please reply to this ticket or contact the IT Service Desk.\n\nThanks,\nIT Service Desk", "isIncoming": false, "isSent": false} }
            ],
            delay_ms: 2000,
            isEmailHitl: true
        },
        {
            id: "step-6",
            title_p: "Closing ticket in ServiceNow...",
            title_s: "Ticket closed — Adobe Creative Cloud access active",
            reasoning: [
                "All provisioning and communication steps completed successfully",
                "ServiceNow ticket INC-2026-05287 auto-closed with resolution summary",
                "SLA of 4 hours met \u2014 resolved in 5 minutes",
                "Audit trail logged across entitlement check, license assignment, and confirmation"
],
            artifacts: [
                { id: "tbl-res-001", type: "table", label: "Resolution Summary", data: {"Ticket ID": "INC-2026-05287", "Status": "Closed", "Resolution Time": "5 minutes", "SLA Target": "4 hours", "SLA Status": "Met", "Resolved By": "Pace"} }
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
