// Appliance Energy Calculator (vanilla JavaScript)

const DAYS_PER_MONTH = 30;
const DAYS_PER_YEAR = 365;
const DEFAULT_PRICE = 30; // cents per kWh (example value)

const form = document.getElementById("calc-form");
const modelSelect = document.getElementById("model");
const wattsInput = document.getElementById("watts");
const hoursInput = document.getElementById("hours");
const priceInput = document.getElementById("price");
const resultsPanel = document.getElementById("results");

// ----- Calculation logic -----
function calculateEnergy(watts, hours, centsPerKwh) {
  const dailyKwh = (watts * hours) / 1000;
  const monthlyKwh = dailyKwh * DAYS_PER_MONTH;
  const yearlyKwh = dailyKwh * DAYS_PER_YEAR;
  const monthlyCost = (monthlyKwh * centsPerKwh) / 100; // dollars
  const yearlyCost = (yearlyKwh * centsPerKwh) / 100;
  return { dailyKwh, monthlyKwh, yearlyKwh, monthlyCost, yearlyCost };
}

// ----- Validation -----
function setError(input, message) {
  document.getElementById(input.id + "-error").textContent = message;
  input.classList.toggle("invalid", message !== "");
}

function readNumber(input, { max, label, allowZero }) {
  const raw = input.value.trim();
  if (raw === "") {
    setError(input, `Please enter ${label}.`);
    return null;
  }
  const value = Number(raw);
  if (!Number.isFinite(value)) {
    setError(input, `${label} must be a valid number.`);
    return null;
  }
  if (value < 0) {
    setError(input, `${label} cannot be negative.`);
    return null;
  }
  if (value === 0 && !allowZero) {
    setError(input, `${label} must be greater than 0.`);
    return null;
  }
  if (max !== undefined && value > max) {
    setError(input, `${label} cannot be more than ${max}.`);
    return null;
  }
  setError(input, "");
  return value;
}

function validateInputs() {
  const watts = readNumber(wattsInput, { label: "the power usage (watts)", allowZero: false });
  const hours = readNumber(hoursInput, { max: 24, label: "the hours of use per day", allowZero: true });
  const price = readNumber(priceInput, { label: "the electricity price", allowZero: true });
  if (watts === null || hours === null || price === null) return null;
  return { watts, hours, price };
}

// ----- Display -----
function renderResults(r) {
  // Replace the panel content each time (no duplicated results)
  resultsPanel.innerHTML = `
    <h3>Results</h3>
    <dl>
      <dt>Daily energy</dt><dd>${r.dailyKwh.toFixed(2)} kWh</dd>
      <dt>Monthly energy (30 days)</dt><dd>${r.monthlyKwh.toFixed(2)} kWh</dd>
      <dt>Yearly energy</dt><dd>${r.yearlyKwh.toFixed(2)} kWh</dd>
      <dt>Estimated monthly cost</dt><dd>$${r.monthlyCost.toFixed(2)}</dd>
      <dt>Estimated yearly cost</dt><dd>$${r.yearlyCost.toFixed(2)}</dd>
    </dl>`;
}

function renderMessage(text) {
  resultsPanel.innerHTML = `<h3>Results</h3><p class="placeholder">${text}</p>`;
}

// ----- Events -----
function updateIfValid() {
  const values = validateInputs();
  if (values) renderResults(calculateEnergy(values.watts, values.hours, values.price));
}

modelSelect.addEventListener("change", () => {
  if (modelSelect.value !== "") {
    wattsInput.value = modelSelect.value;
    setError(wattsInput, "");
    if (hoursInput.value.trim() !== "") updateIfValid();
  }
});

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const values = validateInputs();
  if (values) {
    renderResults(calculateEnergy(values.watts, values.hours, values.price));
  } else {
    renderMessage("Please fix the highlighted fields and try again.");
  }
});

// Live update when the user edits a field (only if everything is valid)
[wattsInput, hoursInput, priceInput].forEach((el) => {
  el.addEventListener("input", () => {
    if (modelSelect.value !== "" && el === wattsInput) modelSelect.value = "";
    updateIfValid();
  });
});

form.addEventListener("reset", () => {
  [wattsInput, hoursInput, priceInput].forEach((el) => setError(el, ""));
  // The browser clears fields after this event, so restore the default price afterwards
  setTimeout(() => { priceInput.value = DEFAULT_PRICE; }, 0);
  renderMessage("Enter your values and press Calculate.");
});
