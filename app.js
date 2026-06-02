const officers = [
    "Inspector A. Rahman",
    "SI Kavita Sharma",
    "DSP Rohit Verma",
    "Inspector S. Khan"
];

let statusIndex = 0;
const statuses = ["OPEN", "UNDER REVIEW", "CLOSED"];

function notify(message) {
    const list = document.getElementById("notifications");
    const li = document.createElement("li");
    li.textContent = `📢 ${message}`;
    list.prepend(li);
}

function assignOfficer() {
    const officer = officers[Math.floor(Math.random() * officers.length)];
    document.getElementById("officer").textContent = officer;
    notify(`Officer ${officer} auto-assigned to the case.`);
}

function generateFIR() {
    const text = `
FIR REPORT
------------------------
Case ID: FIR-2025-1189
Crime Type: Identity Fraud
Location: Dhaka
Date: ${new Date().toLocaleDateString()}

Assigned Officer: ${document.getElementById("officer").textContent}
Status: ${statuses[statusIndex]}
    `;

    const output = document.getElementById("firReport");
    output.textContent = "";
    let i = 0;

    const typing = setInterval(() => {
        output.textContent += text.charAt(i);
        i++;
        if (i >= text.length) clearInterval(typing);
    }, 15);

    notify("FIR report auto-generated.");
}