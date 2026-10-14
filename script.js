/* Add the deployed Apps Script /exec URL here to enable Google Sheets logging. */
const SHEET_WEB_APP_URL =
  "https://script.google.com/macros/s/AKfycbyFEliEtVWQ9go6kLhSWquPG3sHgSy9YV2-EBlfyC5cKqL_lq9MPjtFKJQLjH4khQw/exec";
const STORAGE_KEY = "digital_learn_2_profile_v1";
let profile = null,
  currentModule = null;
const modules = {
  digilocker: {
    title: "DigiLocker basics",
    body: `<p><strong>What it is:</strong> DigiLocker is a Government of India digital platform for accessing and sharing digital documents from participating issuers.</p><ol><li>Open the <a href="https://www.digilocker.gov.in/" target="_blank" rel="noopener">official DigiLocker website</a> or official app listing.</li><li>Follow the current sign-in or account creation instructions shown by the official service.</li><li>Look for documents under issued documents or the relevant issuer; availability depends on issuer and records.</li><li>Review the recipient and consent screen carefully before sharing a document.</li></ol><p><strong>Safety tip:</strong> Never tell anyone your OTP or account PIN. Avoid unexpected login links.</p>`,
  },
  aadhaar: {
    title: "Aadhaar services",
    body: `<p><strong>What it is:</strong> UIDAI is the authority responsible for Aadhaar. Its website provides information and links to available services.</p><ol><li>Start at <a href="https://uidai.gov.in/" target="_blank" rel="noopener">uidai.gov.in</a> and choose the service you need.</li><li>Read eligibility, document requirements and any applicable fee before starting.</li><li>Use the official portal or an authorised centre for updates or downloads.</li><li>Keep an acknowledgement or service request number if one is provided.</li></ol><p><strong>Safety tip:</strong> Do not share Aadhaar details or OTPs with unknown callers.</p>`,
  },
  pan: {
    title: "PAN services",
    body: `<p><strong>What it is:</strong> PAN is used for tax-related and specified financial identification in India.</p><ol><li>Start at the <a href="https://www.incometax.gov.in/iec/foportal/" target="_blank" rel="noopener">Income Tax e-Filing portal</a> or an authorised PAN service provider.</li><li>Confirm whether you need a new PAN, correction, reprint or another service.</li><li>Check current document requirements, charges and application tracking instructions.</li><li>Keep your acknowledgement number for tracking.</li></ol><p><strong>Safety tip:</strong> Check the web address and be cautious of unsolicited offers promising guaranteed approval.</p>`,
  },
};
function toast(msg) {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.classList.remove("hidden");
  setTimeout(() => t.classList.add("hidden"), 3200);
}
async function sendToSheet(payload) {
  if (!SHEET_WEB_APP_URL) {
    document.getElementById("sheetStatus").textContent =
      "Google Sheets: not configured — follow SETUP.md";
    return false;
  }
  try {
    await fetch(SHEET_WEB_APP_URL, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload),
    });
    document.getElementById("sheetStatus").textContent =
      "Google Sheets: event submitted (verify in spreadsheet)";
    return true;
  } catch (e) {
    document.getElementById("sheetStatus").textContent =
      "Google Sheets: submission failed; local progress is saved";
    return false;
  }
}
function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
}
function render() {
  document.getElementById("registerScreen").classList.add("hidden");
  document.getElementById("app").classList.remove("hidden");
  const first = profile.fullName.trim().split(/\s+/)[0];
  document.getElementById("welcomeTitle").textContent =
    `Hey ${first}! Welcome!!!`;
  document.getElementById("avatar").textContent = first.charAt(0).toUpperCase();
  document.getElementById("miniAvatar").textContent = first
    .charAt(0)
    .toUpperCase();
  document.getElementById("userChipName").textContent = first;
  document.getElementById("dropdownFirstName").textContent = first;
  progress();
}
function progress() {
  const n = profile.completedModules.length,
    pct = Math.round((n / 3) * 100);
  document.getElementById("modulesDone").textContent = `${n}/3`;
  document.getElementById("progressText").textContent = `${pct}% complete`;
  document.getElementById("progressFill").style.width = pct + "%";
  document.getElementById("progressBar").setAttribute("aria-valuenow", pct);
  document.getElementById("bestScore").textContent =
    profile.latestScore === null ? "—" : `${profile.latestScore}/10`;
  document.getElementById("learningStatus").textContent =
    n === 3 ? "Completed"
    : n ? "In progress"
    : "Getting started";
}
document
  .getElementById("registerForm")
  .addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!document.getElementById("consent").checked) return;
    profile = {
      fullName: document
        .getElementById("fullName")
        .value.trim()
        .replace(/\s+/g, " ")
        .slice(0, 100),
      ageGroup: document.getElementById("ageGroup").value,
      education: document.getElementById("education").value,
      completedModules: [],
      latestScore: null,
      registeredAt: new Date().toISOString(),
    };
    save();
    render();
    await sendToSheet({ type: "registration", ...profile });
    toast("Welcome to Digital Learn 2.0!");
  });
const moduleOrder = ["digilocker", "aadhaar", "pan"];

function openModule(id) {
  if (!modules[id]) return;

  currentModule = id;

  const moduleData = modules[id];
  document.getElementById("modalTitle").textContent = moduleData.title;
  document.getElementById("modalBody").innerHTML = moduleData.body;

  const index = moduleOrder.indexOf(id);
  const nextButton = document.getElementById("completeModule");

  nextButton.textContent =
    index === moduleOrder.length - 1
      ? "Finish Learning ✓"
      : "Next Module →";

  document.getElementById("moduleModal").classList.remove("hidden");
}

function closeModule() {
  document.getElementById("moduleModal").classList.add("hidden");
}

document
  .getElementById("closeModuleBtn")
  .addEventListener("click", closeModule);

document
  .getElementById("completeModule")
  .addEventListener("click", async () => {
    const currentIndex = moduleOrder.indexOf(currentModule);

    if (currentIndex === -1) return;

    const wasCompleted =
      profile.completedModules.includes(currentModule);

    if (!wasCompleted) {
      profile.completedModules.push(currentModule);
      save();
      progress();

      await sendToSheet({
        type: "module_completion",
        fullName: profile.fullName,
        module: currentModule,
        completedAt: new Date().toISOString(),
        completedModules: profile.completedModules.join(","),
      });
    }

    if (currentIndex < moduleOrder.length - 1) {
      openModule(moduleOrder[currentIndex + 1]);
    } else {
      closeModule();
      toast("Congratulations! You completed all learning modules.");
    }
  });

const quizAnswers = {
  q1: {
    answer: "a",
    text: "DigiLocker",
    explanation: "DigiLocker lets people access digital documents issued by participating organisations."
  },
  q2: {
    answer: "b",
    text: "Keep the OTP private and use it only in a trusted official flow",
    explanation: "An OTP is a security code that should never be shared with callers or strangers."
  },
  q3: {
    answer: "a",
    text: "UIDAI's official website",
    explanation: "UIDAI is the official source for Aadhaar services and information."
  },
  q4: {
    answer: "a",
    text: "Tax-related and specified financial identification",
    explanation: "PAN is used to identify taxpayers and is required for specified financial transactions."
  },
  q5: {
    answer: "b",
    text: "Avoid the link and visit the official website directly",
    explanation: "Unexpected links may be fraudulent, so use a trusted official website instead."
  },
  q6: {
    answer: "a",
    text: "Check the recipient and consent screen",
    explanation: "Checking the recipient and permissions helps prevent documents from being shared with the wrong person."
  },
  q7: {
    answer: "b",
    text: "The official Income Tax portal or an authorised PAN service provider",
    explanation: "Use official government services or authorised providers for PAN-related applications."
  },
  q8: {
    answer: "a",
    text: "Keep the OTP private and do not share it",
    explanation: "Sharing an OTP can allow someone else to access or authorise an action on your account."
  },
  q9: {
    answer: "b",
    text: "Check the official portal for requirements and fees",
    explanation: "Official instructions help you follow the correct process and avoid misleading services."
  },
  q10: {
    answer: "a",
    text: "The first four letters of the name in uppercase plus the birth year",
    explanation: "The commonly used e-Aadhaar PDF password format combines the first four letters of the name in uppercase with the year of birth."
  }
};

const quizForm = document.getElementById("quizForm");
const quizActions = document.getElementById("quizActions");
const quizResult = document.getElementById("quizResult");
const quizReviewModal = document.getElementById("quizReviewModal");
const quizReviewContent = document.getElementById("quizReviewContent");

let quizSubmitted = false;

function closeQuizReview() {
  quizReviewModal.classList.add("hidden");
}

document.getElementById("closeQuizReview").addEventListener(
  "click",
  closeQuizReview
);

document.getElementById("closeQuizReviewBottom").addEventListener(
  "click",
  closeQuizReview
);

// Close the popup when clicking the dark background.
quizReviewModal.addEventListener("click", (event) => {
  if (event.target === quizReviewModal) {
    closeQuizReview();
  }
});

// Also allow the Escape key to close the popup.
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" &&
      !quizReviewModal.classList.contains("hidden")) {
    closeQuizReview();
  }
});

quizForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (quizSubmitted) return;

  const formData = new FormData(quizForm);
  const total = Object.keys(quizAnswers).length;
  let score = 0;

  for (const [question, details] of Object.entries(quizAnswers)) {
    if (formData.get(question) === details.answer) {
      score++;
    }
  }

  quizSubmitted = true;

  // Lock the answers after submission.
  quizForm.querySelectorAll('input[type="radio"]').forEach((input) => {
    input.disabled = true;
  });

  // Replace Submit Quiz with the two new actions.
  quizActions.innerHTML = `
    <button class="btn" type="button" id="reviewAnswers">
      Review Answers
    </button>
    <button class="btn" type="button" id="tryAgain">
      Try Again
    </button>
  `;

  quizResult.className = "result";
  quizResult.textContent =
    `You scored ${score} out of ${total}. ` +
    (score === total
      ? "Excellent work!"
      : score >= 7
      ? "Good job! Review the answers to improve further."
      : "Review the answers and explanations, then try again.");

  // Update the dashboard score.
  profile.latestScore = score;
  save();
  progress();

  // Build the review content, but do not show it yet.
  quizReviewContent.replaceChildren();

  Object.entries(quizAnswers).forEach(([question, details], index) => {
    const selected = formData.get(question);
    const isCorrect = selected === details.answer;

    const card = document.createElement("section");
    card.className = "quiz-review-item";

    const heading = document.createElement("h3");
    heading.textContent = `Question ${index + 1}`;

    const status = document.createElement("p");
    status.className = isCorrect
      ? "quiz-review-status correct"
      : "quiz-review-status incorrect";
    status.textContent = isCorrect
      ? "✓ Your answer was correct"
      : "✗ Your answer was incorrect";

    const answer = document.createElement("p");
    answer.className = "quiz-review-answer";
    answer.textContent = `Correct answer: ${details.text}`;

    const explanation = document.createElement("p");
    explanation.className = "quiz-review-explanation";
    explanation.textContent = details.explanation;

    card.append(heading, status, answer, explanation);
    quizReviewContent.appendChild(card);
  });

  // Review opens the separate scrollable popup.
  document.getElementById("reviewAnswers").addEventListener("click", () => {
    quizReviewModal.classList.remove("hidden");
    quizReviewContent.scrollTop = 0;
    document.getElementById("closeQuizReview").focus();
  });

  // Try Again resets the quiz for another attempt.
  document.getElementById("tryAgain").addEventListener("click", () => {
    quizForm.reset();

    quizForm.querySelectorAll('input[type="radio"]').forEach((input) => {
      input.disabled = false;
    });

    quizSubmitted = false;
    closeQuizReview();
    quizReviewContent.replaceChildren();

    quizResult.textContent = "";
    quizResult.className = "";

    quizActions.innerHTML = `
      <button class="btn" type="submit" id="submitQuiz">
        Submit Quiz
      </button>
    `;

    quizForm.scrollIntoView({ behavior: "smooth", block: "start" });
  });

  // Send the result once per submitted attempt.
  try {
    await sendToSheet({
      type: "quiz_score",
      fullName: profile.fullName,
      score: score,
      total: total,
      submittedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error("Could not submit quiz score to Google Sheets:", error);
  }
});

document.getElementById("generatePassword").addEventListener("click", () => {
  const name = document.getElementById("aadhaarName").value.trim(),
    year = document.getElementById("birthYear").value.trim(),
    out = document.getElementById("passwordOutput");
  if (name.replace(/\s/g, "").length < 4 || !/^\d{4}$/.test(year)) {
    out.textContent =
      "Enter a name with at least 4 letters and a 4-digit birth year.";
    return;
  }
  out.textContent = name.replace(/\s/g, "").slice(0, 4).toUpperCase() + year;
});
document.getElementById("copyPassword").addEventListener("click", async () => {
  const t = document.getElementById("passwordOutput").textContent;
  if (!t || t.includes("appear") || t.startsWith("Enter a name")) {
    toast("Generate a password first.");
    return;
  }
  try {
    await navigator.clipboard.writeText(t);
    toast("Password copied.");
  } catch (e) {
    toast("Copy unavailable here. Select the password and copy it manually.");
  }
});
const profileToggle = document.getElementById("profileToggle");
const profileDropdown = document.getElementById("profileDropdown");
const dropdownFirstName = document.getElementById("dropdownFirstName");

profileToggle.addEventListener("click", () => {
  const isOpen = profileDropdown.classList.toggle("hidden") === false;

  profileToggle.setAttribute("aria-expanded", String(isOpen));

  const firstName =
    profile && profile.fullName
      ? profile.fullName.trim().split(/\s+/)[0]
      : "Learner";

  dropdownFirstName.textContent = firstName;
});

document.addEventListener("click", (event) => {
  if (!event.target.closest(".profile-menu")) {
    profileDropdown.classList.add("hidden");
    profileToggle.setAttribute("aria-expanded", "false");
  }
});

document.getElementById("logoutBtn").addEventListener("click", () => {
  if (
    confirm(
      "Log out and clear this browser's profile and learning progress? Existing Google Sheet entries will not be deleted."
    )
  ) {
    localStorage.removeItem(STORAGE_KEY);
    location.reload();
  }
});

const nav = document.querySelector(".nav");
const mobileNavBtn = document.getElementById("mobileNavBtn");
const navButtons = document.querySelectorAll(".nav button");

navButtons.forEach((button) => {
  button.addEventListener("click", () => {
    navButtons.forEach((item) => item.classList.remove("active"));
    button.classList.add("active");

    const target = document.getElementById(button.dataset.target);

    if (target) {
      target.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
    }

    const crumbTitle = document.getElementById("crumbTitle");
    if (crumbTitle) {
      crumbTitle.textContent = button.textContent.trim();
    }

    // Close the mobile menu after choosing a section.
    nav.classList.remove("nav-open");
    mobileNavBtn.setAttribute("aria-expanded", "false");
  });
});

mobileNavBtn.addEventListener("click", () => {
  const isOpen = nav.classList.toggle("nav-open");

  mobileNavBtn.setAttribute("aria-expanded", String(isOpen));
});

try {
  const s = localStorage.getItem(STORAGE_KEY);
  if (s) {
    profile = JSON.parse(s);
    if (profile && profile.fullName && Array.isArray(profile.completedModules))
      render();
  }
} catch (e) {
  localStorage.removeItem(STORAGE_KEY);
}
