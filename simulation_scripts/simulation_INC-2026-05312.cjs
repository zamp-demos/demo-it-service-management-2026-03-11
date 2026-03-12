const fs = require('fs');
const path = require('path');

// --- Configuration ---
const PROJECT_ROOT = path.join(__dirname, '..');
const PUBLIC_DATA_DIR = path.join(PROJECT_ROOT, 'public/data');
const PROCESSES_FILE = path.join(PUBLIC_DATA_DIR, 'processes.json');
const PROCESS_ID = "INC-2026-05312";
const CASE_NAME = "James Whitfield — VPN Access Request";

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
            "subject": "James Whitfield, Fixed Income Trading",
            "request": "Corporate VPN access provisioning",
            "ticketId": "INC-2026-05312",
            "priority": "P2 \u2014 High",
            "assignedTo": "IT Security Desk"
},
        sidebarArtifacts: []
    });

    const steps = [
        {
            id: "step-1",
            title_p: "Receiving ticket from ServiceNow...",
            title_s: "Ticket received and classified as VPN access request",
            reasoning: [
                "Ticket INC-2026-05312 ingested from ServiceNow via API",
                "Requester identified as James Whitfield, Fixed Income Trading",
                "Request body parsed \u2014 keywords \"VPN\" and \"remote access\" matched to VPN access classification",
                "Priority set to P2 given trading desk role and business criticality",
                "No attachment present on the ticket"
],
            artifacts: [
                { id: "tbl-ticket-001", type: "table", label: "Ticket Details", data: {"Ticket ID": "INC-2026-05312", "Requester": "James Whitfield", "Department": "Fixed Income Trading", "Request": "Corporate VPN Access", "Priority": "P2 \u2014 High", "Submitted": "2026-03-12 08:42 AM"} }
            ],
            delay_ms: 2000
        },
        {
            id: "step-2",
            title_p: "Checking VPN entitlement policy for requester role...",
            title_s: "VPN access confirmed as permitted for Fixed Income Trading role",
            reasoning: [
                "Queried internal entitlement matrix using James Whitfield's role and department",
                "Fixed Income Trading mapped to full corporate VPN access as standard entitlement",
                "No manager sign-off required for this role tier",
                "No additional compliance approval required \u2014 role does not trigger elevated access review",
                "Entitlement check passed \u2014 proceeding to device verification"
],
            artifacts: [
                { id: "tbl-ent-001", type: "table", label: "Entitlement Check", data: {"Requester Role": "Fixed Income Trader", "Department": "Fixed Income Trading", "Access Requested": "Corporate VPN", "Entitlement Status": "Approved", "Approval Required": "None", "Policy Reference": "IT-SEC-Policy-7.1"} }
            ],
            delay_ms: 3000
        },
        {
            id: "step-3",
            title_p: "Checking device MDM enrollment status in Microsoft Intune...",
            title_s: "No enrolled device found for James Whitfield — VPN provisioning cannot proceed",
            reasoning: [
                "Navigated Microsoft Intune device management portal",
                "Searched for all devices registered under james.whitfield@meridianbank.com",
                "Zero enrolled devices returned against this employee",
                "Searched additionally by employee ID MBK-4421 \u2014 no results found",
                "Corporate VPN policy IT-SEC-7.3 requires at minimum one active MDM enrolled device before VPN credentials can be issued",
                "Provisioning blocked \u2014 device compliance requirement not met"
],
            artifacts: [
                { id: "tbl-dev-001", type: "table", label: "Device Enrollment Check", data: {"Employee": "James Whitfield", "Employee ID": "MBK-4421", "Email": "james.whitfield@meridianbank.com", "Enrolled Devices Found": "0", "MDM Platform": "Microsoft Intune", "Enrollment Required": "Yes", "Provisioning Status": "Blocked"} }
            ],
            delay_ms: 4000
        },
        {
            id: "step-4",
            title_p: "Identifying MDM enrollment process and next steps for requester...",
            title_s: "Enrollment pathway identified — communication being prepared",
            reasoning: [
                "Queried IT knowledge base for MDM enrollment process applicable to Fixed Income Trading department",
                "Identified that James Whitfield's role qualifies for a corporate-issued device under the trading desk hardware policy",
                "Identified two available pathways \u2014 enroll an existing personal device under BYOD policy or request a corporate device through the hardware request process",
                "Located the MDM self-enrollment portal URL and step-by-step guide for both pathways",
                "Located the hardware request form link for corporate device procurement",
                "Identified IT Security Desk as the correct support contact for enrollment assistance",
                "All information assembled \u2014 drafting communication to James Whitfield"
],
            artifacts: [],
            delay_ms: 3000
        },
        {
            id: "step-5",
            title_p: "Drafting communication to James Whitfield...",
            title_s: "Communication drafted — awaiting send",
            reasoning: [
                "Email drafted with both available pathways clearly outlined \u2014 BYOD enrollment and corporate device request",
                "Direct portal links included for both options to minimise friction for the requester",
                "Requester informed that ticket will auto-resume on enrollment completion \u2014 no resubmission needed",
                "Tone kept professional and solution-oriented given P2 priority and trading desk business criticality"
],
            artifacts: [
                { id: "email-vpn-001", type: "email_draft", label: "VPN Request — Device Enrollment Required", data: {"to": "james.whitfield@meridianbank.com", "from": "itsecuritydesk@meridianbank.com", "cc": "", "bcc": "", "subject": "Action Required \u2014 Device Enrollment Needed Before VPN Access Can Be Issued", "body": "Hi James,\n\nThank you for submitting your VPN access request (INC-2026-05312).\n\nWe have reviewed your request and confirmed that you are entitled to corporate VPN access. However, before we can issue your credentials, Meridian Bank's security policy requires at least one active enrolled device registered under your account. Currently, no enrolled devices are found against your profile.\n\nTo get this resolved, you have two options:\n\nOption 1 \u2014 Enroll your existing device\nIf you have a personal or work device you would like to use, you can enroll it through our MDM self-enrollment portal at https://mdm.meridianbank.com/enroll. The process takes approximately 10 minutes and a step-by-step guide is available on the portal.\n\nOption 2 \u2014 Request a corporate device\nIf you require a Meridian Bank issued device, please submit a hardware request at https://itportal.meridianbank.com/hardware-request. Given your trading desk role, you are eligible for a corporate laptop under the standard hardware policy. Typical fulfilment time is 2 business days.\n\nOnce your device is enrolled, your VPN request will be automatically picked up and provisioned without you needing to resubmit a ticket.\n\nIf you need any assistance with enrollment, please contact the IT Security Desk at itsecuritydesk@meridianbank.com or call extension 4400.\n\nApologies for the delay and thank you for your patience.\n\nIT Security Desk\nMeridian Bank", "isIncoming": false, "isSent": false} }
            ],
            delay_ms: 2000,
            isEmailHitl: true
        },
        {
            id: "step-6",
            title_p: "Updating ticket status in ServiceNow...",
            title_s: "Ticket placed on hold — awaiting device enrollment",
            reasoning: [
                "ServiceNow ticket INC-2026-05312 status updated to Pending \u2014 Customer Action Required",
                "Ticket placed on hold pending MDM enrollment confirmation from Microsoft Intune",
                "Automated trigger configured \u2014 ticket will resume and VPN provisioning will proceed automatically once an enrolled device is detected under james.whitfield@meridianbank.com",
                "SLA clock paused per policy during customer action pending status",
                "Full audit trail logged \u2014 entitlement check passed, device check failed, communication sent, ticket held"
],
            artifacts: [
                { id: "tbl-res-001", type: "table", label: "Resolution Summary", data: {"Ticket ID": "INC-2026-05312", "Status": "On Hold \u2014 Pending Device Enrollment", "Entitlement Check": "Passed", "Device Enrollment Check": "Failed", "Communication Sent": "Yes", "SLA Status": "Paused \u2014 Customer Action Pending", "Next Action": "Auto-resume on device enrollment detected"} }
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

