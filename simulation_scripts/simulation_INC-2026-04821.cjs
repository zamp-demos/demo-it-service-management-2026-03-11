const steps = [
  {
    duration: 2000,
    processing: "Receiving ticket from ServiceNow...",
    done: "IT service request received and classified as account lockout",
    reasoning: [
      "Ticket INC-2026-04821 ingested from ServiceNow",
      "Requester identified as James Holloway, Sales Operations",
      'Keywords "locked out" and "can\'t log in" matched to account lockout classification',
      "No attachment present"
    ]
  },
  {
    duration: 3000,
    processing: "Querying Active Directory for account status...",
    done: "James Holloway's account confirmed as locked in Active Directory",
    reasoning: [
      "Queried Active Directory using employee ID pulled from the ServiceNow user record",
      "Account status returned as locked",
      "5 consecutive failed login attempts recorded at 09:58 AM, triggering the lockout policy"
    ]
  },
  {
    duration: 2000,
    processing: "Checking security incident register...",
    done: "No active security flag — safe to proceed with reset",
    reasoning: [
      "Cross-checked account against the open security incident register",
      "No active flags, suspended accounts, or HR holds found against this employee",
      "Lockout pattern consistent with forgotten password, not a security event"
    ]
  },
  {
    duration: 4000,
    processing: "Unlocking account and generating temporary password...",
    done: "Account unlocked and temporary password issued",
    reasoning: [
      "Executed account unlock in Active Directory",
      "Temporary password generated per complexity policy — 12 characters, expires on first login",
      "MFA reset not required as existing device registration remains valid"
    ]
  },
  {
    duration: 2000,
    processing: "Sending resolution to requester...",
    done: "Resolution communicated — ticket closed",
    reasoning: [
      "Email drafted and sent to James Holloway with temporary password and first-login instructions",
      "ServiceNow ticket updated with resolution details and auto-closed",
      "SLA of 4 hours met — resolved in under 2 minutes"
    ]
  }
];

async function run(relay) {
  for (const step of steps) {
    await relay.step(step.processing, step.duration, step.done, step.reasoning);
  }
}

module.exports = { run };
