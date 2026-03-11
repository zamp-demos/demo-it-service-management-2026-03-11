const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = path.join(__dirname, '..');
const PUBLIC_DATA_DIR = path.join(PROJECT_ROOT, 'public/data');
const PROCESSES_FILE = path.join(PUBLIC_DATA_DIR, 'processes.json');
const PROCESS_ID = 'INC-2026-04821';

const readJson = (file) => (fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : []);
const writeJson = (file, data) => fs.writeFileSync(file, JSON.stringify(data, null, 4));
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const updateProcessLog = (logEntry, keyDetailsUpdate = {}) => {
    const processFile = path.join(PUBLIC_DATA_DIR, `process_${PROCESS_ID}.json`);
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

const updateProcessListStatus = async (status, currentStatus) => {
    const apiUrl = process.env.VITE_API_URL || 'http://localhost:3001';
    try {
        const response = await fetch(`${apiUrl}/api/update-status`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: PROCESS_ID, status, currentStatus })
        });
        if (!response.ok) throw new Error(`Server returned ${response.status}`);
    } catch (e) {
        try {
            const processes = JSON.parse(fs.readFileSync(PROCESSES_FILE, 'utf8'));
            const idx = processes.findIndex(p => p.id === PROCESS_ID);
            if (idx !== -1) {
                processes[idx].status = status;
                processes[idx].currentStatus = currentStatus;
                fs.writeFileSync(PROCESSES_FILE, JSON.stringify(processes, null, 4));
            }
        } catch (err) {}
    }
};

(async () => {
    console.log(`Starting ${PROCESS_ID}: James Holloway — Account Lockout...`);

    // Initialize process log with key details
    writeJson(path.join(PUBLIC_DATA_DIR, `process_${PROCESS_ID}.json`), {
        logs: [],
        keyDetails: {
            'Ticket ID': 'INC-2026-04821',
            'Requester': 'James Holloway',
            'Department': 'Sales Operations',
            'Issue': 'Account locked — unable to log in',
            'Priority': 'P3 — Standard',
            'Source': 'ServiceNow',
            'Assigned To': 'IT Service Desk',
            'SLA': '4 hours'
        },
        sidebarArtifacts: []
    });

    await updateProcessListStatus('In Progress', 'Classifying ticket...');
    await delay(500);

    // Step 1
    const step1Id = 'step-1';
    updateProcessLog({
        id: step1Id,
        type: 'step',
        status: 'processing',
        title: 'Receiving ticket from ServiceNow...',
        reasoning: [],
        timestamp: new Date().toISOString()
    });
    await delay(2000);
    updateProcessLog({
        id: step1Id,
        type: 'step',
        status: 'done',
        title: 'IT service request received and classified as account lockout',
        reasoning: [
            'Ticket INC-2026-04821 ingested from ServiceNow',
            'Requester identified as James Holloway, Sales Operations',
            'Keywords "locked out" and "can\'t log in" matched to account lockout classification',
            'No attachment present'
        ],
        timestamp: new Date().toISOString()
    });
    await updateProcessListStatus('In Progress', 'Querying Active Directory...');

    // Step 2
    const step2Id = 'step-2';
    updateProcessLog({
        id: step2Id,
        type: 'step',
        status: 'processing',
        title: 'Querying Active Directory for account status...',
        reasoning: [],
        timestamp: new Date().toISOString()
    });
    await delay(3000);
    updateProcessLog({
        id: step2Id,
        type: 'step',
        status: 'done',
        title: "James Holloway's account confirmed as locked in Active Directory",
        reasoning: [
            'Queried Active Directory using employee ID pulled from the ServiceNow user record',
            'Account status returned as locked',
            '5 consecutive failed login attempts recorded at 09:58 AM, triggering the lockout policy'
        ],
        timestamp: new Date().toISOString()
    });
    await updateProcessListStatus('In Progress', 'Checking security incident register...');

    // Step 3
    const step3Id = 'step-3';
    updateProcessLog({
        id: step3Id,
        type: 'step',
        status: 'processing',
        title: 'Checking security incident register...',
        reasoning: [],
        timestamp: new Date().toISOString()
    });
    await delay(2000);
    updateProcessLog({
        id: step3Id,
        type: 'step',
        status: 'done',
        title: 'No active security flag — safe to proceed with reset',
        reasoning: [
            'Cross-checked account against the open security incident register',
            'No active flags, suspended accounts, or HR holds found against this employee',
            'Lockout pattern consistent with forgotten password, not a security event'
        ],
        timestamp: new Date().toISOString()
    });
    await updateProcessListStatus('In Progress', 'Unlocking account and generating temporary password...');

    // Step 4
    const step4Id = 'step-4';
    updateProcessLog({
        id: step4Id,
        type: 'step',
        status: 'processing',
        title: 'Unlocking account and generating temporary password...',
        reasoning: [],
        timestamp: new Date().toISOString()
    });
    await delay(4000);
    updateProcessLog({
        id: step4Id,
        type: 'step',
        status: 'done',
        title: 'Account unlocked and temporary password issued',
        reasoning: [
            'Executed account unlock in Active Directory',
            'Temporary password generated per complexity policy — 12 characters, expires on first login',
            'MFA reset not required as existing device registration remains valid'
        ],
        timestamp: new Date().toISOString()
    });
    await updateProcessListStatus('In Progress', 'Sending resolution to requester...');

    // Step 5
    const step5Id = 'step-5';
    updateProcessLog({
        id: step5Id,
        type: 'step',
        status: 'processing',
        title: 'Sending resolution to requester...',
        reasoning: [],
        timestamp: new Date().toISOString()
    });
    await delay(2000);
    updateProcessLog({
        id: step5Id,
        type: 'step',
        status: 'done',
        title: 'Resolution communicated — ticket closed',
        reasoning: [
            'Email drafted and sent to James Holloway with temporary password and first-login instructions',
            'ServiceNow ticket updated with resolution details and auto-closed',
            'SLA of 4 hours met — resolved in under 2 minutes'
        ],
        timestamp: new Date().toISOString()
    });

    await updateProcessListStatus('Done', 'Ticket closed — account unlocked');
    console.log(`${PROCESS_ID} complete.`);
})();
