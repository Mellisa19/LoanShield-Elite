// --- State ---
let state = {
    purpose: '',
    loan: 15000,
    income: 60000,
    debt: 5000,
    employed: 'Yes',
    debounceTimer: null
};

// --- Category-Specific Configurations ---
const categoryConfig = {
    Business: {
        icon: '💼',
        tagline: 'Fuel Your Growth',
        story: `<strong>Did you know?</strong> 82% of small businesses fail due to cash flow problems. 
                A well-timed business loan can be the difference between scaling up and shutting down. 
                <em>Let's see if your numbers tell a success story.</em>`,
        loanRange: { min: 5000, max: 100000, default: 25000, step: 1000 },
        incomeRange: { min: 30000, max: 500000, default: 80000, step: 5000 },
        tip: '💡 Tip: Strong monthly revenue and low existing debt significantly boost approval odds.'
    },
    Home: {
        icon: '🏠',
        tagline: 'Build Your Future',
        story: `<strong>Your dream home awaits.</strong> The average homeowner builds $200,000 in wealth 
                over 30 years through equity. A mortgage isn't just debt—it's an investment in your future. 
                <em>Let's check your readiness.</em>`,
        loanRange: { min: 50000, max: 500000, default: 150000, step: 5000 },
        incomeRange: { min: 40000, max: 400000, default: 75000, step: 5000 },
        tip: '💡 Tip: A 20% down payment eliminates PMI and gets you the best rates.'
    },
    Consolidation: {
        icon: '📊',
        tagline: 'Simplify Your Debt',
        story: `<strong>One payment. One rate. One path to freedom.</strong> Americans carry an average 
                of $6,000 in credit card debt at 20%+ APR. Consolidation can cut that rate in half. 
                <em>See how much you could save.</em>`,
        loanRange: { min: 2000, max: 50000, default: 10000, step: 500 },
        incomeRange: { min: 25000, max: 200000, default: 55000, step: 2500 },
        tip: '💡 Tip: Consolidating high-interest cards can save thousands in interest over time.'
    },
    Personal: {
        icon: '❤️',
        tagline: 'Make It Happen',
        story: `<strong>Life doesn't wait.</strong> Whether it's a wedding, medical expense, or that 
                once-in-a-lifetime trip—personal loans help you seize the moment responsibly. 
                <em>Let's make sure the math works.</em>`,
        loanRange: { min: 1000, max: 25000, default: 5000, step: 500 },
        incomeRange: { min: 20000, max: 150000, default: 50000, step: 2500 },
        tip: '💡 Tip: Keeping your debt-to-income ratio under 35% maximizes approval chances.'
    }
};

// --- Elements ---
const dom = {
    views: {
        selection: document.getElementById('view-selection'),
        calculator: document.getElementById('view-calculator')
    },
    sliders: {
        loan: document.getElementById('slider-loan'),
        income: document.getElementById('slider-income'),
        debt: document.getElementById('slider-debt')
    },
    displays: {
        loan: document.getElementById('val-loan'),
        income: document.getElementById('val-income'),
        debt: document.getElementById('val-debt'),
        emp: document.getElementById('val-emp')
    },
    empBtns: {
        yes: document.getElementById('btn-emp-yes'),
        no: document.getElementById('btn-emp-no')
    },
    result: {
        score: document.getElementById('scoreValue'),
        badge: document.getElementById('riskBadge'),
        narrative: document.getElementById('narrativeText')
    }
};

// --- Navigation Logic ---
function selectPurpose(purpose) {
    state.purpose = purpose;
    const config = categoryConfig[purpose];

    // Update the header to show selected category
    const categorySpan = document.getElementById('category-name');
    if (categorySpan) {
        categorySpan.innerText = purpose;
    }

    // Apply category-specific story
    const storyDiv = document.getElementById('category-story');
    if (storyDiv && config) {
        storyDiv.innerHTML = `
            <p class="story-text">${config.story}</p>
            <p class="story-tip">${config.tip}</p>
        `;
    }

    // Apply category-specific slider ranges and defaults
    if (config) {
        // Loan slider
        dom.sliders.loan.min = config.loanRange.min;
        dom.sliders.loan.max = config.loanRange.max;
        dom.sliders.loan.step = config.loanRange.step;
        dom.sliders.loan.value = config.loanRange.default;
        state.loan = config.loanRange.default;
        dom.displays.loan.innerText = formatCurrency(config.loanRange.default);

        // Income slider
        dom.sliders.income.min = config.incomeRange.min;
        dom.sliders.income.max = config.incomeRange.max;
        dom.sliders.income.step = config.incomeRange.step;
        dom.sliders.income.value = config.incomeRange.default;
        state.income = config.incomeRange.default;
        dom.displays.income.innerText = formatCurrency(config.incomeRange.default);
    }

    // Transition
    dom.views.selection.classList.remove('active');
    setTimeout(() => {
        dom.views.selection.classList.add('hidden');
        dom.views.calculator.classList.remove('hidden');

        // Small delay to allow display flex to apply before opacity transition
        setTimeout(() => {
            dom.views.calculator.classList.add('active');
        }, 50);

        // Trigger initial calc for this purpose
        triggerPrediction();
    }, 300);
}

function goBack() {
    dom.views.calculator.classList.remove('active');
    setTimeout(() => {
        dom.views.calculator.classList.add('hidden');
        dom.views.selection.classList.remove('hidden');
        setTimeout(() => {
            dom.views.selection.classList.add('active');
        }, 50);
    }, 300);
}

// --- Interaction Logic ---
function init() {
    // Sliders
    Object.keys(dom.sliders).forEach(key => {
        dom.sliders[key].addEventListener('input', (e) => {
            const val = parseInt(e.target.value);
            state[key] = val;
            dom.displays[key].innerText = formatCurrency(val);
            triggerPrediction();
        });
    });

    // Employment Toggle (Custom Buttons)
    dom.empBtns.yes.addEventListener('click', () => setEmployed('Yes'));
    dom.empBtns.no.addEventListener('click', () => setEmployed('No'));
}

function setEmployed(status) {
    state.employed = status;
    dom.displays.emp.innerText = status === 'Yes' ? 'Employed' : 'Unemployed';

    // Visual Toggle
    dom.empBtns.yes.style.opacity = status === 'Yes' ? '1' : '0.3';
    dom.empBtns.no.style.opacity = status === 'No' ? '1' : '0.3';

    triggerPrediction();
}

// --- Utilities ---
function formatCurrency(num) {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(num);
}

// --- backend logic ---
function triggerPrediction() {
    clearTimeout(state.debounceTimer);
    dom.result.badge.innerText = "Analyzing...";
    dom.result.badge.style.background = "#e5e7eb";
    dom.result.badge.style.color = "#374151";

    state.debounceTimer = setTimeout(fetchPrediction, 500);
}

async function fetchPrediction() {
    const projectedDebt = state.debt + state.loan;
    const modelEmployed = state.employed === 'No' ? 'No' : 'Yes';

    const payload = {
        employed: modelEmployed,
        balance: projectedDebt,
        income: state.income,
        threshold: 0.3
    };

    try {
        const res = await fetch('/predict', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        renderResult(data);
    } catch (err) {
        console.error(err);
    }
}

function renderResult(data) {
    const probPct = Math.round(data.probability * 100);
    dom.result.score.innerText = `${probPct}%`;

    // Colors
    const isSafe = (data.tier === 'Low Risk' || data.tier === 'Minimal Risk');
    dom.result.score.style.color = isSafe ? 'var(--status-safe)' : 'var(--status-danger)';

    dom.result.badge.innerText = isSafe ? "APPROVED" : "REJECTED";
    dom.result.badge.className = isSafe ? "badge safe" : "badge danger";
    dom.result.badge.style.background = ""; // reset inline override
    dom.result.badge.style.color = "white";

    // Narrative
    const dti = ((state.debt + state.loan) / state.income);
    let text = "";

    if (isSafe) {
        text = `<strong>Excellent.</strong> For a <strong>${state.purpose}</strong> loan of this size, your projected DTI (${(dti * 100).toFixed(0)}%) is healthy.`;
    } else {
        text = `<strong>High Risk.</strong> Requesting <strong>${formatCurrency(state.loan)}</strong> pushes your debt load too high.`;
        if (state.employed === 'No') text += ` Employment verification is required.`;
        else text += ` Consider lowering the amount.`;
    }

    dom.result.narrative.innerHTML = text;
}

// Expose checks for onclick
window.selectPurpose = selectPurpose;
window.goBack = goBack;

init();
