const fs = require('fs');
const path = require('path');

// --- Configuration ---
const PROJECT_ROOT = path.join(__dirname, '..');
const PUBLIC_DATA_DIR = path.join(PROJECT_ROOT, 'public/data');
const PROCESSES_FILE = path.join(PUBLIC_DATA_DIR, 'processes.json');
const PROCESS_ID = "INC-2026-04821";
const CASE_NAME = "James Holloway — Account Lockout";

// --- Helpers ---
const readJson = (file) => (fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : []);
const writeJson = (file, data) => fs.writeFileSync(file, JSON.stringify(data, null, 4));
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

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

const waitForEmail = async (caseId) => {
    console.log(`Waiting for user to send email for ${caseId}...`);
    const API_URL = process.env.VITE_API_URL || 'http://localhost:3001';
    try {
        await fetch(`${API_URL}/email-status`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sent: false, caseId })
        });
    } catch (e) {}
    while (true) {
        try {
            const response = await fetch(`${API_URL}/email-status?caseId=${caseId}`);
            if (response.ok) {
                const { sent } = await response.json();
                if (sent) { console.log(`Email sent for ${caseId}!`); return true; }
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
            "Ticket ID": "INC-2026-04821",
            "Requester": "James Holloway",
            "Department": "Sales Operations",
            "Issue": "Account locked \u2014 unable to log in",
            "Priority": "P3 \u2014 Standard",
            "Source": "ServiceNow",
            "Assigned To": "IT Service Desk",
            "SLA": "4 hours"
},
        sidebarArtifacts: []
    });

    const steps = [
        {
            id: "step-1",
            title_p: "Receiving ticket from ServiceNow...",
            title_s: "IT service request received and classified as account lockout",
            reasoning: [
                "Ticket INC-2026-04821 ingested from ServiceNow",
                "Requester identified as James Holloway, Sales Operations",
                "Keywords locked out and can not log in matched to account lockout classification",
                "No attachment present"
],
            artifacts: [],
            delay_ms: 2000
        },
        {
            id: "step-2",
            title_p: "Querying Active Directory for account status...",
            title_s: "James Holloway account confirmed as locked in Active Directory",
            reasoning: [
                "Queried Active Directory using employee ID pulled from the ServiceNow user record",
                "Account status returned as locked",
                "5 consecutive failed login attempts recorded at 09:58 AM triggering the lockout policy"
],
            artifacts: [],
            delay_ms: 3000
        },
        {
            id: "step-3",
            title_p: "Checking security incident register...",
            title_s: "No active security flag — safe to proceed with reset",
            reasoning: [
                "Cross-checked account against the open security incident register",
                "No active flags suspended accounts or HR holds found against this employee",
                "Lockout pattern consistent with forgotten password not a security event"
],
            artifacts: [],
            delay_ms: 2000
        },
        {
            id: "step-4",
            title_p: "Unlocking account and generating temporary password...",
            title_s: "Account unlocked and temporary password issued",
            reasoning: [
                "Executed account unlock in Active Directory",
                "Temporary password generated per complexity policy \u2014 12 characters expires on first login",
                "MFA reset not required as existing device registration remains valid"
],
            artifacts: [],
            delay_ms: 4000
        },
        {
            id: "step-5",
            title_p: "Sending resolution to requester...",
            title_s: "Resolution communicated — ticket closed",
            reasoning: [
                "Email drafted and sent to James Holloway with temporary password and first-login instructions",
                "ServiceNow ticket updated with resolution details and auto-closed",
                "SLA of 4 hours met \u2014 resolved in under 2 minutes"
],
            artifacts: [],
            delay_ms: 2000
        }
    ];

    for (let i = 0; i < steps.length; i++) {
        const step = steps[i];
        const isFinal = step.isFinal || i === steps.length - 1;

        updateProcessLog(PROCESS_ID, {
            id: step.id,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            title: step.title_p,
            status: "processing"
        });
        await updateProcessListStatus(PROCESS_ID, "In Progress", step.title_p);
        await delay(step.delay_ms || 2200);

        if (step.isHitl) {
            updateProcessLog(PROCESS_ID, {
                id: step.id,
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                title: step.title_s,
                status: "warning",
                reasoning: step.reasoning || [],
                artifacts: step.artifacts || []
            });
            await updateProcessListStatus(PROCESS_ID, "Needs Attention", step.title_s);
            await waitForSignal(step.signalName);
            await updateProcessListStatus(PROCESS_ID, "In Progress", `Approved: ${step.title_s}`);
            await delay(1500);
        } else if (step.isEmailHitl) {
            updateProcessLog(PROCESS_ID, {
                id: step.id,
                title: step.title_s,
                status: "warning",
                reasoning: step.reasoning || [],
                artifacts: step.artifacts || []
            });
            await updateProcessListStatus(PROCESS_ID, "Needs Attention", "Draft Review: Email Pending");
            await waitForEmail(PROCESS_ID);
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
