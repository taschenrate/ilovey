const state = {
  dateType: "",
  place: "",
  contact: "",
};

const screens = [...document.querySelectorAll(".screen")];
const progressWrap = document.getElementById("progressWrap");
const progressLabel = document.getElementById("progressLabel");
const progressBar = document.getElementById("progressBar");
const progress = document.querySelector(".progress");
const noButton = document.getElementById("noButton");
const noMessage = document.getElementById("noMessage");
const yesButton = document.getElementById("yesButton");
const contactInput = document.getElementById("contactInput");

const stepMap = {
  date: 1,
  place: 2,
  contact: 3,
  result: 4,
};

let noAttempts = 0;
let currentScreen = "welcome";
let lastNoMove = 0;

const noPhrases = [
  "Ти впевнена? 😭",
  "Ні-ні, ця кнопка не працює",
  "Спробуй краще «Так»",
  "Відмова не приймається 💗",
  "Кнопка втекла",
  "Схоже, у неї свої плани 😌",
];

function showScreen(name) {
  currentScreen = name;
  screens.forEach((screen) => {
    screen.classList.toggle("is-active", screen.dataset.screen === name);
  });

  const step = stepMap[name];
  progressWrap.hidden = !step;

  if (step) {
    progressLabel.textContent = `Крок ${step} із 4`;
    progressBar.style.width = `${step * 25}%`;
    progress.setAttribute("aria-valuenow", step);
    progress.setAttribute("aria-valuemax", "4");
  }

  window.scrollTo({ top: 0, behavior: "smooth" });
}

document.querySelectorAll("[data-next]").forEach((button) => {
  button.addEventListener("click", () => showScreen(button.dataset.next));
});

function createFloatingHearts() {
  const host = document.getElementById("floatingHearts");

  for (let index = 0; index < 14; index += 1) {
    const heart = document.createElement("span");
    heart.className = "floating-heart";
    heart.textContent = "♥";
    heart.style.left = `${Math.random() * 100}%`;
    heart.style.fontSize = `${10 + Math.random() * 16}px`;
    heart.style.animationDuration = `${12 + Math.random() * 13}s`;
    heart.style.animationDelay = `${Math.random() * -20}s`;
    host.appendChild(heart);
  }
}

function launchConfetti() {
  const host = document.getElementById("confetti");
  const colors = ["#ff4fa3", "#ff91c5", "#ffd15c", "#8fd9ca", "#a99bff"];
  host.replaceChildren();

  for (let index = 0; index < 70; index += 1) {
    const piece = document.createElement("span");
    piece.className = "confetti-piece";
    piece.style.left = `${Math.random() * 100}%`;
    piece.style.background = colors[index % colors.length];
    piece.style.animationDelay = `${Math.random() * 0.35}s`;
    piece.style.animationDuration = `${1.4 + Math.random() * 1.15}s`;
    piece.style.setProperty("--drift", `${-90 + Math.random() * 180}px`);
    host.appendChild(piece);
  }

  window.setTimeout(() => host.replaceChildren(), 3000);
}

function moveNoButton() {
  const now = Date.now();
  if (now - lastNoMove < 180) return;
  lastNoMove = now;
  noAttempts += 1;
  const rect = noButton.getBoundingClientRect();
  const padding = 14;
  const maxLeft = Math.max(padding, window.innerWidth - rect.width - padding);
  const maxTop = Math.max(76, window.innerHeight - rect.height - padding);
  const nextLeft = padding + Math.random() * Math.max(1, maxLeft - padding);
  const nextTop = 76 + Math.random() * Math.max(1, maxTop - 76);

  noButton.classList.add("is-running");
  noButton.style.left = `${Math.min(nextLeft, maxLeft)}px`;
  noButton.style.top = `${Math.min(nextTop, maxTop)}px`;
  noMessage.textContent = noPhrases[(noAttempts - 1) % noPhrases.length];

  if (noAttempts === 3) {
    noMessage.textContent = "Ти вже 3 рази намагалася відмовитися 😭";
  }

  if (noAttempts === 5) {
    noMessage.textContent = "Добре, кнопка здається… але краще натисни «Так» 💕";
  }
}

["pointerenter", "pointerdown", "touchstart", "click"].forEach((eventName) => {
  noButton.addEventListener(
    eventName,
    (event) => {
      event.preventDefault();
      event.stopPropagation();
      moveNoButton();
    },
    { passive: false },
  );
});

yesButton.addEventListener("click", () => {
  noButton.classList.remove("is-running");
  noButton.removeAttribute("style");
  launchConfetti();
  showScreen("celebrate");
});

function setSelectedOption(containerId, valueKey) {
  const container = document.getElementById(containerId);
  container.addEventListener("click", (event) => {
    const option = event.target.closest(".option-card");
    if (!option) return;

    container.querySelectorAll(".option-card").forEach((card) => {
      card.classList.toggle("is-selected", card === option);
      card.setAttribute("aria-pressed", card === option ? "true" : "false");
    });

    state[valueKey] = option.dataset.value;
    document.getElementById(`${valueKey === "dateType" ? "date" : "place"}Error`).textContent = "";
  });
}

setSelectedOption("dateOptions", "dateType");
setSelectedOption("placeOptions", "place");

document.getElementById("dateContinue").addEventListener("click", () => {
  if (!state.dateType) {
    document.getElementById("dateError").textContent =
      "Спочатку обери варіант побачення 💕";
    return;
  }

  showScreen("place");
});

document.getElementById("placeContinue").addEventListener("click", () => {
  if (!state.place) {
    document.getElementById("placeError").textContent =
      "Спочатку обери, куди ми підемо 💕";
    return;
  }

  showScreen("contact");
  window.setTimeout(() => contactInput.focus({ preventScroll: true }), 450);
});

document.getElementById("contactForm").addEventListener("submit", (event) => {
  event.preventDefault();
  const value = contactInput.value.trim();
  const error = document.getElementById("contactError");

  if (!value) {
    error.textContent = "Введи контакт, щоб я міг написати тобі 💌";
    contactInput.focus();
    return;
  }

  if (value.length < 3) {
    error.textContent = "Контакт має містити щонайменше 3 символи";
    contactInput.focus();
    return;
  }

  state.contact = value;
  error.textContent = "";
  renderResult();
  launchConfetti();
  showScreen("result");
});

contactInput.addEventListener("input", () => {
  document.getElementById("contactError").textContent = "";
});

function renderResult() {
  document.getElementById("resultDate").textContent = state.dateType;
  document.getElementById("resultPlace").textContent = state.place;
  document.getElementById("resultContact").textContent = state.contact;
}

function resetApp() {
  state.dateType = "";
  state.place = "";
  state.contact = "";
  noAttempts = 0;
  lastNoMove = 0;
  noMessage.textContent = "";
  contactInput.value = "";
  noButton.classList.remove("is-running");
  noButton.removeAttribute("style");

  document.querySelectorAll(".option-card").forEach((card) => {
    card.classList.remove("is-selected");
    card.setAttribute("aria-pressed", "false");
  });

  document.querySelectorAll(".form-error").forEach((error) => {
    error.textContent = "";
  });

  showScreen("welcome");
}

document.getElementById("restartButton").addEventListener("click", resetApp);

document.querySelector(".brand").addEventListener("click", (event) => {
  event.preventDefault();
  resetApp();
});

window.addEventListener("resize", () => {
  if (currentScreen === "invite" && noButton.classList.contains("is-running")) {
    moveNoButton();
  }
});

createFloatingHearts();
