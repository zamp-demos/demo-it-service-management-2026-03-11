try { require('dotenv').config(); } catch(e) {}

process.on('uncaughtException', (err) => {
    console.error('UNCAUGHT EXCEPTION:', err.message, err.stack);
    process.exit(1);
});
process.on('unhandledRejection', (reason) => {
    console.error('UNHANDLED REJECTION:', reason);
    process.exit(1);
});

console.log('Starting server... PORT env:', process.env.PORT);

const http = require('http');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const PORT = process.env.PORT || 3001;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.VITE_MODEL || 'gemini-2.5-flash';

const PUBLIC_DIR = path.join(__dirname, 'public');
const DATA_DIR = path.join(PUBLIC_DIR, 'data');
const KB_PATH = path.join(__dirname, 'src', 'data', 'knowledgeBase.md');
const FEEDBACK_QUEUE_PATH = path.join(DATA_DIR, 'feedbackQueue.json');
const KB_VERSIONS_PATH = path.join(DATA_DIR, 'kbVersions.json');
const SNAPSHOTS_DIR = path.join(DATA_DIR, 'snapshots');

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
};

let state = { sent: false, confirmed: false, signals: {} };
let runningProcesses = new Map();

// Startup init
const signalFile = path.join(__dirname, 'interaction-signals.json');
if (!fs.existsSync(signalFile)) fs.writeFileSync(signalFile, JSON.stringify({ APPROVE_CHANGE: false, CONFIRM_RESOLUTION: false }, null, 4));
if (!fs.existsSync(FEEDBACK_QUEUE_PATH)) fs.writeFileSync(FEEDBACK_QUEUE_PATH, '[]');
if (!fs.existsSync(KB_VERSIONS_PATH)) fs.writeFileSync(KB_VERSIONS_PATH, '[]');
if (!fs.existsSync(SNAPSHOTS_DIR)) fs.mkdirSync(SNAPSHOTS_DIR, { recursive: true });

const baseProcessesPath = path.join(DATA_DIR, 'base_processes.json');
const processesPath = path.join(DATA_DIR, 'processes.json');
if (!fs.existsSync(processesPath) && fs.existsSync(baseProcessesPath)) {
    fs.copyFileSync(baseProcessesPath, processesPath);
}

const readJson = (f) => fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf8')) : [];

function serveStatic(res, filePath) {
    if (!fs.existsSync(filePath)) {
        res.writeHead(404); res.end('Not found'); return;
    }
    const ext = path.extname(filePath).toLowerCase();
    const mime = {
        '.html': 'text/html', '.js': 'application/javascript', '.jsx': 'application/javascript',
        '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml',
        '.png': 'image/png', '.jpg': 'image/jpeg', '.webm': 'video/webm',
        '.pdf': 'application/pdf', '.md': 'text/markdown', '.woff2': 'font/woff2'
    }[ext] || 'application/octet-stream';
    res.writeHead(200, { ...corsHeaders, 'Content-Type': mime });
    fs.createReadStream(filePath).pipe(res);
}

const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, `http://localhost:${PORT}`);
    const cleanPath = url.pathname;

    if (req.method === 'OPTIONS') {
        res.writeHead(204, corsHeaders); res.end(); return;
    }

    if (cleanPath === '/reset') {
        state = { sent: false, confirmed: false, signals: {} };
        console.log('Demo Reset Triggered');

        fs.writeFileSync(signalFile, JSON.stringify({ APPROVE_CHANGE: false, CONFIRM_RESOLUTION: false }, null, 4));

        runningProcesses.forEach((proc) => { try { process.kill(-proc.pid, 'SIGKILL'); } catch (e) {} });
        runningProcesses.clear();

        exec('pkill -9 -f "node(.*)simulation_scripts" || true', (err) => {
            setTimeout(() => {
                const cases = [
                    {
                        id: "INC-2026-05134", name: "Priya Nair — Software Access Request", category: "IT Service Management",
                        stockId: "INC-2026-05134", year: new Date().toISOString().split('T')[0],
                        status: "In Progress", currentStatus: "Awaiting trigger",
                        subject: "Priya Nair, Marketing", request: "Access requested for Adobe Creative Cloud",
                        documentType: "Service Request", riskLevel: "Low",
                        ticketId: "INC-2026-05134"
                    },
                    {
                        id: "INC-2026-05287", name: "Sarah Mitchell — Adobe Creative Cloud Access Request", category: "IT Service Management",
                        stockId: "INC-2026-05287", year: new Date().toISOString().split('T')[0],
                        status: "In Progress", currentStatus: "Awaiting trigger",
                        subject: "Sarah Mitchell, Marketing", request: "Adobe Creative Cloud license provisioning",
                        documentType: "Service Request", riskLevel: "Low",
                        ticketId: "INC-2026-05287"
                    },
                    {
                        id: "INC-2026-04821", name: "James Holloway — Account Lockout", category: "IT Service Management",
                        stockId: "INC-2026-04821", year: new Date().toISOString().split('T')[0],
                        status: "In Progress", currentStatus: "Awaiting trigger",
                        subject: "James Holloway, Sales Operations", request: "Account locked — unable to log in",
                        ticketId: "INC-2026-04821"
                    },
                    {
                        id: "INC-2026-05312", name: "James Whitfield — VPN Access Request", category: "IT Service Management",
                        stockId: "INC-2026-05312", year: new Date().toISOString().split('T')[0],
                        status: "In Progress", currentStatus: "Starting...",
                        keyDetails: {
                            subject: "James Whitfield, Fixed Income Trading",
                            request: "Corporate VPN access provisioning",
                            ticketId: "INC-2026-05312",
                            priority: "P2 — High",
                            assignedTo: "IT Security Desk"
                        }
                    },
                    {
                        id: "INC-2026-05398", name: "Daniel Harris — Actimize Access Request", category: "IT Service Management",
                        stockId: "INC-2026-05398", year: new Date().toISOString().split('T')[0],
                        status: "In Progress", currentStatus: "Starting...",
                        keyDetails: {
                            subject: "Daniel Harris, AML Compliance",
                            request: "Actimize license provisioning — new joiner",
                            ticketId: "INC-2026-05398",
                            priority: "P2 — High",
                            submittedBy: "Michael Torres, AML Compliance Manager",
                            assignedTo: "IT Service Desk"
                        }
                    },
                    {
                        id: "INC-2026-05441", name: "Ryan Carter — Contractor IT Onboarding", category: "IT Service Management",
                        stockId: "INC-2026-05441", year: new Date().toISOString().split('T')[0],
                        status: "In Progress", currentStatus: "Starting...",
                        keyDetails: {
                            subject: "Ryan Carter, IT Infrastructure Contractor",
                            request: "System access provisioning — contractor onboarding",
                            ticketId: "INC-2026-05441",
                            priority: "P2 — High",
                            contractType: "Fixed Term — 3 Months",
                            engagementScope: "Cloud Migration — AWS to Azure",
                            submittedBy: "David Langley, Head of IT Infrastructure",
                            assignedTo: "IT Service Desk"
                        }
                    }
                ];
                fs.writeFileSync(processesPath, JSON.stringify(cases, null, 4));
                fs.writeFileSync(FEEDBACK_QUEUE_PATH, '[]');
                fs.writeFileSync(KB_VERSIONS_PATH, '[]');

                const scripts = [
                    { file: 'simulation_INC-2026-05134.cjs', id: 'INC-2026-05134' },
                    { file: 'simulation_INC-2026-05287.cjs', id: 'INC-2026-05287' },
                    { file: 'simulation_INC-2026-04821.cjs', id: 'INC-2026-04821' },
                    { file: 'simulation_INC-2026-05312.cjs', id: 'INC-2026-05312' },
                    { file: 'simulation_INC-2026-05398.cjs', id: 'INC-2026-05398' },
                    { file: 'simulation_INC-2026-05441.cjs', id: 'INC-2026-05441' }
                ];

                let totalDelay = 0;
                scripts.forEach((script) => {
                    setTimeout(() => {
                        const scriptPath = path.join(__dirname, 'simulation_scripts', script.file);
                        const child = exec(`node "${scriptPath}" > "${scriptPath}.log" 2>&1`, (error) => {
                            if (error && error.code !== 0) console.error(`${script.file} error:`, error.message);
                            runningProcesses.delete(script.id);
                        });
                        runningProcesses.set(script.id, child);
                    }, totalDelay * 1000);
                    totalDelay += 2;
                });
            }, 1000);
        });

        res.writeHead(200, { ...corsHeaders, 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'ok' }));
        return;
    }

    if (cleanPath === '/email-status' && req.method === 'GET') {
        res.writeHead(200, { ...corsHeaders, 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ sent: state.sent })); return;
    }

    if (cleanPath === '/email-status' && req.method === 'POST') {
        let body = '';
        req.on('data', d => body += d);
        req.on('end', () => {
            try { const p = JSON.parse(body); state.sent = p.sent; } catch(e) {}
            res.writeHead(200, { ...corsHeaders, 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ status: 'ok' }));
        }); return;
    }

    if (cleanPath === '/signal-status' && req.method === 'GET') {
        res.writeHead(200, { ...corsHeaders, 'Content-Type': 'application/json' });
        res.end(JSON.stringify(state.signals)); return;
    }

    if (cleanPath === '/signal' && req.method === 'POST') {
        let body = '';
        req.on('data', d => body += d);
        req.on('end', () => {
            try {
                const p = JSON.parse(body);
                state.signals[p.signal] = true;
                if (fs.existsSync(signalFile)) {
                    const sigs = JSON.parse(fs.readFileSync(signalFile, 'utf8'));
                    sigs[p.signal] = true;
                    fs.writeFileSync(signalFile, JSON.stringify(sigs, null, 4));
                }
            } catch(e) {}
            res.writeHead(200, { ...corsHeaders, 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ status: 'ok' }));
        }); return;
    }

    if (cleanPath === '/api/update-status' && req.method === 'POST') {
        let body = '';
        req.on('data', d => body += d);
        req.on('end', () => {
            try {
                const p = JSON.parse(body);
                const procs = readJson(processesPath);
                const idx = procs.findIndex(x => x.id === String(p.id));
                if (idx !== -1) {
                    procs[idx].status = p.status;
                    procs[idx].currentStatus = p.currentStatus;
                    fs.writeFileSync(processesPath, JSON.stringify(procs, null, 4));
                }
            } catch(e) {}
            res.writeHead(200, { ...corsHeaders, 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ status: 'ok' }));
        }); return;
    }

    if (cleanPath === '/api/chat' && req.method === 'POST') {
        let body = '';
        req.on('data', d => body += d);
        req.on('end', async () => {
            try {
                const parsed = JSON.parse(body);
                const { GoogleGenerativeAI } = require('@google/generative-ai');
                const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
                const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });

                let result;
                if (parsed.messages && parsed.systemPrompt) {
                    const history = parsed.messages.slice(0, -1).map(m => ({
                        role: m.role === 'assistant' ? 'model' : 'user',
                        parts: [{ text: m.content }]
                    }));
                    const chat = model.startChat({ history, systemInstruction: parsed.systemPrompt });
                    const last = parsed.messages[parsed.messages.length - 1];
                    result = await chat.sendMessage(last.content);
                } else {
                    const systemPrompt = `You are a helpful AI assistant. Use this knowledge base to answer questions:\n\n${parsed.knowledgeBase}`;
                    const history = (parsed.history || []).slice(0, -1).map(m => ({
                        role: m.role === 'assistant' ? 'model' : 'user',
                        parts: [{ text: m.content }]
                    }));
                    const chat = model.startChat({ history, systemInstruction: systemPrompt });
                    result = await chat.sendMessage(parsed.message);
                }
                const text = result.response.text();
                res.writeHead(200, { ...corsHeaders, 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ response: text }));
            } catch(e) {
                res.writeHead(500, { ...corsHeaders, 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: e.message }));
            }
        }); return;
    }

    if (cleanPath === '/api/feedback/questions' && req.method === 'POST') {
        let body = '';
        req.on('data', d => body += d);
        req.on('end', async () => {
            try {
                const parsed = JSON.parse(body);
                const { GoogleGenerativeAI } = require('@google/generative-ai');
                const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
                const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });
                const prompt = `You are helping refine knowledge base feedback. Given this feedback: "${parsed.feedback}" and this knowledge base: "${parsed.knowledgeBase}", generate exactly 3 short clarifying questions to better understand the feedback. Return as JSON array: ["Q1?", "Q2?", "Q3?"]`;
                const result = await model.generateContent(prompt);
                const text = result.response.text().replace(/```json\n?|\n?```/g, '').trim();
                const questions = JSON.parse(text);
                res.writeHead(200, { ...corsHeaders, 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ questions }));
            } catch(e) {
                res.writeHead(500, { ...corsHeaders, 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: e.message }));
            }
        }); return;
    }

    if (cleanPath === '/api/feedback/summarize' && req.method === 'POST') {
        let body = '';
        req.on('data', d => body += d);
        req.on('end', async () => {
            try {
                const parsed = JSON.parse(body);
                const { GoogleGenerativeAI } = require('@google/generative-ai');
                const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
                const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });
                const prompt = `Summarize this feedback into a clear, actionable KB update proposal.\nFeedback: ${parsed.feedback}\nQuestions asked: ${JSON.stringify(parsed.questions)}\nAnswers: ${JSON.stringify(parsed.answers)}\nReturn a 2-3 sentence summary of what should change in the KB.`;
                const result = await model.generateContent(prompt);
                res.writeHead(200, { ...corsHeaders, 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ summary: result.response.text() }));
            } catch(e) {
                res.writeHead(500, { ...corsHeaders, 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: e.message }));
            }
        }); return;
    }

    if (cleanPath === '/api/feedback/queue' && req.method === 'GET') {
        const queue = readJson(FEEDBACK_QUEUE_PATH);
        res.writeHead(200, { ...corsHeaders, 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ queue })); return;
    }

    if (cleanPath === '/api/feedback/queue' && req.method === 'POST') {
        let body = '';
        req.on('data', d => body += d);
        req.on('end', () => {
            try {
                const item = JSON.parse(body);
                const queue = readJson(FEEDBACK_QUEUE_PATH);
                queue.push({ ...item, status: 'pending', timestamp: new Date().toISOString() });
                fs.writeFileSync(FEEDBACK_QUEUE_PATH, JSON.stringify(queue, null, 4));
            } catch(e) {}
            res.writeHead(200, { ...corsHeaders, 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ status: 'ok' }));
        }); return;
    }

    const deleteQueueMatch = cleanPath.match(/^\/api\/feedback\/queue\/(.+)$/);
    if (deleteQueueMatch && req.method === 'DELETE') {
        const id = deleteQueueMatch[1];
        const queue = readJson(FEEDBACK_QUEUE_PATH).filter(x => x.id !== id);
        fs.writeFileSync(FEEDBACK_QUEUE_PATH, JSON.stringify(queue, null, 4));
        res.writeHead(200, { ...corsHeaders, 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'ok' })); return;
    }

    if (cleanPath === '/api/feedback/apply' && req.method === 'POST') {
        let body = '';
        req.on('data', d => body += d);
        req.on('end', async () => {
            try {
                const { feedbackId } = JSON.parse(body);
                const queue = readJson(FEEDBACK_QUEUE_PATH);
                const item = queue.find(x => x.id === feedbackId);
                if (!item) { res.writeHead(404, corsHeaders); res.end(JSON.stringify({ error: 'Not found' })); return; }

                const currentKB = fs.readFileSync(KB_PATH, 'utf8');
                const { GoogleGenerativeAI } = require('@google/generative-ai');
                const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
                const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });
                const prompt = `Update this knowledge base markdown according to this proposal: "${item.summary}"\n\nCurrent KB:\n${currentKB}\n\nReturn ONLY the updated markdown, no other text.`;
                const result = await model.generateContent(prompt);
                const updatedKB = result.response.text();

                const ts = Date.now();
                const prevFile = `kb_${ts}_prev.md`;
                const newFile = `kb_${ts}_new.md`;
                fs.writeFileSync(path.join(SNAPSHOTS_DIR, prevFile), currentKB);
                fs.writeFileSync(path.join(SNAPSHOTS_DIR, newFile), updatedKB);
                fs.writeFileSync(KB_PATH, updatedKB);

                const versions = readJson(KB_VERSIONS_PATH);
                const versionId = `v${ts}`;
                versions.push({ id: versionId, timestamp: new Date().toISOString(), snapshotFile: newFile, previousFile: prevFile, changes: [item.summary] });
                fs.writeFileSync(KB_VERSIONS_PATH, JSON.stringify(versions, null, 4));

                const updatedQueue = queue.map(x => x.id === feedbackId ? { ...x, status: 'applied' } : x);
                fs.writeFileSync(FEEDBACK_QUEUE_PATH, JSON.stringify(updatedQueue, null, 4));

                res.writeHead(200, { ...corsHeaders, 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true, content: updatedKB }));
            } catch(e) {
                res.writeHead(500, { ...corsHeaders, 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: e.message }));
            }
        }); return;
    }

    if (cleanPath === '/api/kb/content' && req.method === 'GET') {
        const versionId = url.searchParams.get('versionId');
        let content;
        if (versionId) {
            const versions = readJson(KB_VERSIONS_PATH);
            const v = versions.find(x => x.id === versionId);
            if (v) content = fs.readFileSync(path.join(SNAPSHOTS_DIR, v.snapshotFile), 'utf8');
        }
        if (!content) content = fs.existsSync(KB_PATH) ? fs.readFileSync(KB_PATH, 'utf8') : '';
        res.writeHead(200, { ...corsHeaders, 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ content })); return;
    }

    if (cleanPath === '/api/kb/versions' && req.method === 'GET') {
        res.writeHead(200, { ...corsHeaders, 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ versions: readJson(KB_VERSIONS_PATH) })); return;
    }

    const snapshotMatch = cleanPath.match(/^\/api\/kb\/snapshot\/(.+)$/);
    if (snapshotMatch && req.method === 'GET') {
        const file = path.join(SNAPSHOTS_DIR, snapshotMatch[1]);
        if (fs.existsSync(file)) {
            res.writeHead(200, { ...corsHeaders, 'Content-Type': 'text/markdown' });
            res.end(fs.readFileSync(file, 'utf8'));
        } else {
            res.writeHead(404, corsHeaders); res.end('Not found');
        }
        return;
    }

    if (cleanPath === '/api/kb/update' && req.method === 'POST') {
        let body = '';
        req.on('data', d => body += d);
        req.on('end', () => {
            try { const p = JSON.parse(body); fs.writeFileSync(KB_PATH, p.content); } catch(e) {}
            res.writeHead(200, { ...corsHeaders, 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ status: 'ok' }));
        }); return;
    }

    if (cleanPath === '/debug-paths') {
        res.writeHead(200, { ...corsHeaders, 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ dataDir: DATA_DIR, exists: fs.existsSync(DATA_DIR), files: fs.existsSync(DATA_DIR) ? fs.readdirSync(DATA_DIR) : [] }));
        return;
    }

    // Static file serving
    let filePath = path.join(PUBLIC_DIR, cleanPath === '/' ? 'index.html' : cleanPath);
    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) { serveStatic(res, filePath); return; }
    const indexPath = path.join(PUBLIC_DIR, 'index.html');
    if (fs.existsSync(indexPath)) { serveStatic(res, indexPath); return; }
    res.writeHead(404); res.end('Not found');
});

server.listen(PORT, '0.0.0.0', () => console.log(`Server running on port ${PORT}`));
