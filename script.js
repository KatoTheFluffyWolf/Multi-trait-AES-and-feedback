const essayForm = document.getElementById("essayForm");
const promptInput = document.getElementById("promptInput");
const essayInput = document.getElementById("essayInput");
const wordCount = document.getElementById("wordCount");
const wordWarning = document.getElementById("wordWarning");
const submitBtn = document.getElementById("submitBtn");

const emptyState = document.getElementById("emptyState");
const loadingState = document.getElementById("loadingState");
const resultContent = document.getElementById("resultContent");

const totalScore = document.getElementById("totalScore");
const contentScore = document.getElementById("contentScore");
const organizationScore = document.getElementById("organizationScore");
const languageScore = document.getElementById("languageScore");

const feedbackText = document.getElementById("feedbackText");
const suggestionList = document.getElementById("suggestionList");

// Change this later to your actual FastAPI endpoint.
// Example: "http://127.0.0.1:8000/predict"
const API_URL = "https://katothesoftwolf-aes-api.hf.space/predict";

// Set to true if you want to test the frontend without your backend.
const DEMO_MODE = false;

essayInput.addEventListener("input", updateWordCount);

function updateWordCount() {
  const text = essayInput.value.trim();

  const words = text === ""
    ? []
    : text.split(/\s+/);

  const count = words.length;

  wordCount.textContent = `Word count: ${count}`;

  if (count === 0) {
    wordWarning.textContent = "DREsS traits: Content, Organization, Language";
  } else {
    wordWarning.textContent = "Ready for multi-trait scoring";
  }
}

essayForm.addEventListener("submit", async function (event) {
  event.preventDefault();

  const prompt = promptInput.value.trim();
  const essay = essayInput.value.trim();

  if (!prompt || !essay) {
    alert("Please enter both the prompt and the essay.");
    return;
  }

  showLoading();

  try {
    let data;

    if (DEMO_MODE) {
      data = await getDemoResult();
    } else {
      data = await sendEssayToBackend(prompt, essay);
    }

    showResult(data);
  } catch (error) {
    console.error("Error:", error);
    showError("Something went wrong while analyzing the essay. Please check your backend connection.");
  }
});

async function sendEssayToBackend(prompt, essay) {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      prompt: prompt,
      essay: essay
    })
  });

  if (!response.ok) {
    throw new Error(`Server error: ${response.status}`);
  }

  return await response.json();
}

function showLoading() {
  submitBtn.disabled = true;
  submitBtn.textContent = "Analyzing...";

  emptyState.classList.add("hidden");
  resultContent.classList.add("hidden");
  loadingState.classList.remove("hidden");
}

function showResult(data) {
  submitBtn.disabled = false;
  submitBtn.textContent = "Analyze Essay";

  loadingState.classList.add("hidden");
  emptyState.classList.add("hidden");
  resultContent.classList.remove("hidden");

  const content = Number(data.trait_scores.content);
  const organization = Number(data.trait_scores.organization);
  const language = Number(data.trait_scores.language);

  const total =
    data.total_score !== undefined && data.total_score !== null
      ? Number(data.total_score)
      : content + organization + language;

  totalScore.textContent = formatScore(total);
  contentScore.textContent = formatScore(content);
  organizationScore.textContent = formatScore(organization);
  languageScore.textContent = formatScore(language);

  feedbackText.textContent = data.feedback;

  suggestionList.innerHTML = "";

  data.suggestions.forEach(function (suggestion) {
    const li = document.createElement("li");
    li.textContent = suggestion;
    suggestionList.appendChild(li);
  });
}

function showError(message) {
  submitBtn.disabled = false;
  submitBtn.textContent = "Analyze Essay";

  loadingState.classList.add("hidden");
  resultContent.classList.add("hidden");
  emptyState.classList.remove("hidden");

  emptyState.innerHTML = `
    <div class="empty-icon">⚠️</div>
    <h3>Analysis failed</h3>
    <p>${message}</p>
  `;
}

function formatScore(score) {
  if (score === null || score === undefined || isNaN(score)) {
    return "-";
  }

  return Number(score).toFixed(1);
}
