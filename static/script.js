// --- Initialize Chart.js ---
const ctx = document.getElementById('fraudChart').getContext('2d');
let fraudChart = new Chart(ctx, {
    type: 'line',
    data: {
        labels: [],
        datasets: [{
            label: 'Risk Probability Trend',
            data: [],
            borderColor: '#38bdf8',
            backgroundColor: 'rgba(56, 189, 248, 0.1)',
            borderWidth: 2,
            fill: true,
            tension: 0.4
        }]
    },
    options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            y: { beginAtZero: true, max: 1, grid: { color: 'rgba(255,255,255,0.05)' }, border: { display: false } },
            x: { grid: { display: false }, border: { display: false } }
        },
        plugins: { legend: { display: false } }
    }
});

// --- State ---
let currentThreshold = 0.3;

// --- Elements ---
const thresholdSlider = document.getElementById('thresholdSlider');
const thresholdVal = document.getElementById('thresholdVal');
const stressTestBtn = document.getElementById('stressTestBtn');

// --- Listeners ---
thresholdSlider.addEventListener('input', (e) => {
    currentThreshold = parseFloat(e.target.value);
    thresholdVal.innerText = currentThreshold.toFixed(2);
});

document.getElementById('predictionForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const data = {
        student: document.getElementById('student').value,
        balance: parseFloat(document.getElementById('balance').value),
        income: parseFloat(document.getElementById('income').value),
        threshold: currentThreshold
    };

    const resultArea = document.getElementById('resultArea');
    const resultBadge = document.getElementById('resultBadge');
    const resultIcon = document.getElementById('resultIcon');
    const resultText = document.getElementById('resultText');
    const probBar = document.getElementById('probBar');
    const probValue = document.getElementById('probValue');
    const reasoningList = document.getElementById('reasoningList');
    const riskTierContainer = document.getElementById('riskTierContainer');

    try {
        const response = await fetch('/predict', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        const result = await response.json();

        // Show result area
        resultArea.classList.remove('hidden');

        // Update badge
        if (result.is_fraud) {
            resultBadge.className = 'result-badge fraud';
            resultIcon.className = 'fas fa-exclamation-triangle';
            resultText.innerText = 'Risk Identified';
            probBar.className = 'prob-bar fraud';
        } else {
            resultBadge.className = 'result-badge safe';
            resultIcon.className = 'fas fa-check-shield';
            resultText.innerText = 'Loan Secure';
            probBar.className = 'prob-bar safe';
        }

        // --- NEW: Risk Tier Update ---
        riskTierContainer.innerText = result.tier;
        riskTierContainer.className = `risk-tier-badge ${result.tier.split(' ')[0].toLowerCase()}`;

        // Update probability display
        const probPct = (result.probability * 100).toFixed(1);
        probValue.innerText = `${probPct}%`;
        probBar.style.width = `${probPct}%`;

        // Render AI Reasoning
        reasoningList.innerHTML = '';
        result.explanation.forEach(reason => {
            const item = document.createElement('div');
            item.className = 'reason-item';
            const icon = reason.impact === "Increases Risk" ? 'fa-arrow-up' : 'fa-arrow-down';
            const colorClass = reason.impact === "Increases Risk" ? 'up' : 'down';

            item.innerHTML = `
                <span>${reason.feature}</span>
                <span class="reason-impact ${colorClass}">
                    <i class="fas ${icon}"></i> ${reason.impact}
                </span>
            `;
            reasoningList.appendChild(item);
        });

        // Update Chart
        updateChart(result.probability);

        // Add to live feed
        addToFeed(data, result);

        // --- NEW: Risk Narrative ---
        generateRiskNarrative(result, data);

    } catch (err) {
        console.error('Error:', err);
    }
});

stressTestBtn.addEventListener('click', async () => {
    stressTestBtn.disabled = true;
    stressTestBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Testing...';

    try {
        const response = await fetch('/stress-test', { method: 'POST' });
        const results = await response.json();

        results.forEach((res, index) => {
            setTimeout(() => {
                addToFeed(res, { is_fraud: res.is_fraud, status: res.is_fraud ? 'RISK' : 'SAFE' });
                if (index % 5 === 0) {
                    const countElem = document.querySelectorAll('.stat-card .value')[0];
                    countElem.innerText = (parseInt(countElem.innerText.replace(',', '')) + 5).toLocaleString();
                }
            }, index * 100);
        });

    } catch (err) {
        console.error('Stress test failed');
    } finally {
        stressTestBtn.disabled = false;
        stressTestBtn.innerHTML = '<i class="fas fa-microchip"></i> Simulate Load';
    }
});

function updateChart(prob) {
    const now = new Date();
    const label = `${now.getHours()}:${now.getMinutes()}:${now.getSeconds()}`;

    fraudChart.data.labels.push(label);
    fraudChart.data.datasets[0].data.push(prob);

    if (fraudChart.data.labels.length > 10) {
        fraudChart.data.labels.shift();
        fraudChart.data.datasets[0].data.shift();
    }
    fraudChart.update();
}

function addToFeed(data, result) {
    const feed = document.getElementById('transactionFeed');
    const item = document.createElement('div');
    item.className = `feed-item ${result.is_fraud ? 'fraud' : ''}`;

    const id = Math.floor(Math.random() * 9000) + 1000;

    item.innerHTML = `
        <div class="item-icon"><i class="fas fa-credit-card"></i></div>
        <div class="item-details">
            <p class="user">Loan Request #${id}</p>
            <p class="meta">Balance: $${data.balance.toLocaleString()} | Income: $${data.income.toLocaleString()}</p>
        </div>
        <div class="item-status">
            <span class="status-tag ${result.is_fraud ? 'red' : 'green'}">${result.status.toUpperCase()}</span>
        </div>
    `;

    if (feed.firstChild) {
        feed.insertBefore(item, feed.firstChild);
    } else {
        feed.appendChild(item);
    }

    if (feed.children.length > 8) {
        feed.removeChild(feed.lastChild);
    }
}

// --- Navigation Logic ---
document.querySelectorAll('.nav-links a').forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();

        // Remove active class from all links
        document.querySelectorAll('.nav-links a').forEach(l => l.classList.remove('active'));

        // Add active class to clicked link
        link.classList.add('active');

        // Hide all view sections
        document.querySelectorAll('.view-section').forEach(section => {
            section.classList.add('hidden');
        });

        // Show target view
        const targetId = link.getAttribute('data-target');
        const targetSection = document.getElementById(targetId);
        if (targetSection) {
            targetSection.classList.remove('hidden');
        }
    });
});

// --- Risk Narrative Logic ---
function generateRiskNarrative(result, data) {
    const narrativeBox = document.getElementById('riskNarrative');
    const narrativeText = document.getElementById('narrativeText');

    narrativeBox.classList.remove('hidden');

    let text = "";
    if (result.is_fraud) {
        text = `<strong>⚠️ Risk Warning:</strong> This loan application has been flagged as <strong>High Risk</strong>. `;

        // Dynamic reason based on top LIME factor
        const topReason = result.explanation[0];
        if (topReason) {
            if (topReason.feature.includes('balance') && topReason.impact === 'Increases Risk') {
                text += `The primary concern is the <strong>Credit Balance</strong> ($${data.balance.toLocaleString()}), which is critically high relative to the applicant's profile. `;
            } else if (topReason.feature.includes('income') && topReason.impact === 'Increases Risk') {
                text += `The reported <strong>Annual Income</strong> ($${data.income.toLocaleString()}) appears insufficient to support additional credit lines. `;
            } else if (topReason.feature.includes('student') && topReason.impact === 'Increases Risk') {
                text += `The student status combined with current debt levels fits a known default pattern. `;
            } else {
                text += `Historical data indicates that applicants with this specific financial profile have a high rate of default. `;
            }
        }

        text += `Recommendation is to <strong>Reject</strong> or require a co-signer.`;
    } else {
        text = `<strong>✅ Approval Recommended:</strong> This application passes all security checks. `;
        text += `The applicant maintains a healthy balance-to-income ratio. `;
        text += `System confidence is high (${(Math.max((1 - result.probability), result.probability) * 100).toFixed(1)}%).`;
    }

    narrativeText.innerHTML = text;
}
