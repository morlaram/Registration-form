// --- Constants & References ---
const shareBtn = document.getElementById("whatsappShare");
const shareCounter = document.getElementById("shareCounter");
const shareCompleteMsg = document.getElementById("shareCompleteMsg");
const submitBtn = document.getElementById("submitBtn");
const form = document.getElementById("registrationForm");
const successMsg = document.getElementById("successMsg");
const screenshotInput = document.getElementById("screenshot");
const toast = document.getElementById("toast");
const formData = document.forms["contact-form"];

const MAX_SHARES = 5;
let shareCount = parseInt(localStorage.getItem("shareCount")) || 0;
let submitted = localStorage.getItem("registrationSubmitted") === "true";

// --- UI Helpers ---
function updateShareUI() {
  shareCounter.textContent = `Click count: ${shareCount}/${MAX_SHARES}`;
  shareBtn.disabled = shareCount >= MAX_SHARES;
  shareCompleteMsg.classList.toggle("hidden", shareCount < MAX_SHARES);
}

function disableForm() {
  Array.from(form.elements).forEach((el) => (el.disabled = true));
  shareBtn.disabled = true;
  submitBtn.disabled = true;
}

function showToast(msg, isError = false) {
  toast.textContent = msg;
  toast.style.background = isError ? "#c0392b" : "#232946";
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 3000);
}

// --- On Load ---
window.addEventListener("DOMContentLoaded", () => {
  if (!submitted) {
    shareCount = 0;
    localStorage.setItem("shareCount", shareCount);
  }
  updateShareUI();
  if (submitted) {
    disableForm();
    successMsg.classList.remove("hidden");
  }
  animateStars();
  showStep(0);
  updateProgressBar();
  generateCaptcha();
});

// --- Share Logic ---
shareBtn.addEventListener("click", () => {
  if (shareCount < MAX_SHARES) {
    const message = encodeURIComponent(
      "Hey Buddy, Join Tech For Girls Community!"
    );
    const url = `https://wa.me/?text=${message}`;
    window.open(url, "_blank");
    shareCount++;
    localStorage.setItem("shareCount", shareCount);
    updateShareUI();
  }
});

// --- Progress Bar Logic ---
function updateProgressBar() {
  const progress = document.getElementById("progress");
  let filled = 0;
  if (form.name.value.trim()) filled++;
  if (form.phone.value.trim()) filled++;
  if (form.email.value.trim()) filled++;
  if (form.college.value.trim()) filled++;
  if (screenshotInput.files.length > 0) filled++;
  progress.style.width = (filled / 5) * 100 + "%";
}
form.addEventListener("input", updateProgressBar);
screenshotInput.addEventListener("change", updateProgressBar);

// --- Floating Labels ---
const floatInputs = document.querySelectorAll(".form-section input");
floatInputs.forEach((input) => {
  input.addEventListener("blur", () =>
    input.classList.toggle("filled", !!input.value)
  );
  input.addEventListener("input", () =>
    input.classList.toggle("filled", !!input.value)
  );
});

// --- Multi-step Logic ---
const steps = [
  document.getElementById("step1"),
  document.getElementById("step2"),
  document.getElementById("step3"),
];
let currentStep = 0;
function showStep(idx) {
  steps.forEach((step, i) => step.classList.toggle("hidden", i !== idx));
  currentStep = idx;
}
document.getElementById("nextStep1").onclick = function () {
  if (
    form.name.value &&
    form.phone.value &&
    form.email.value &&
    form.college.value
  ) {
    showStep(1);
  } else {
    showToast("Please fill all details.", true);
  }
};
document.getElementById("prevStep2").onclick = () => showStep(0);
document.getElementById("nextStep2").onclick = function () {
  if (screenshotInput.files.length > 0) {
    showStep(2);
  } else {
    showToast("Please upload a screenshot.", true);
  }
};
document.getElementById("prevStep3").onclick = () => showStep(1);

// --- CAPTCHA Logic ---
let captchaA = 0,
  captchaB = 0;
function generateCaptcha() {
  captchaA = Math.floor(Math.random() * 10) + 1;
  captchaB = Math.floor(Math.random() * 10) + 1;
  document.getElementById(
    "captchaLabel"
  ).textContent = `What is ${captchaA} + ${captchaB}?`;
}

// --- Form Submit Handler ---
form.addEventListener("submit", (e) => {
  e.preventDefault();

  const captchaInput = document.getElementById("captchaInput").value.trim();
  if (parseInt(captchaInput) !== captchaA + captchaB) {
    showToast("Incorrect answer to the math question.", true);
    generateCaptcha();
    document.getElementById("captchaInput").value = "";
    return;
  }

  if (!document.getElementById("terms").checked) {
    showToast("You must agree to the terms and conditions.", true);
    return;
  }

  const file = screenshotInput.files[0];
  if (!file) {
    showToast("Please upload a screenshot.", true);
    return;
  }

  submitBtn.disabled = true;

  const toBase64 = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result.split(",")[1]);
      reader.onerror = (error) => reject(error);
    });

  let base64String;
  try {
    base64String = toBase64(file);
  } catch (err) {
    showToast("Failed to read file.", true);
    submitBtn.disabled = false;
    return;
  }

  let formDetails = new FormData(form);
  formDetails.append("name", form.name.value);
  formDetails.append("phone", form.phone.value);
  formDetails.append("email", form.email.value);
  formDetails.append("college", form.college.value);
  formDetails.append("screenshot", base64String);
  formDetails.append("screenshot-name", file.name);
  formDetails.append("screenshot-Type", file.type);
  console.log(formDetails);

  const scriptURL ="https://script.google.com/macros/s/AKfycbwz9MEGPfQi62ADTOeo7A7ylGyU8-02pTZHdnAU-lppMfscdbfJvyVbMFPqgNOSWQiL/exec";

  fetch(scriptURL, { method: "POST", body: formDetails })
    .then((response) => alert("Thank you! Form is submitted"))
    .then(() => {
      localStorage.setItem("registrationSubmitted", "true");
      disableForm();
      successMsg.classList.remove("hidden");
      showToast("Your submission has been recorded.Thanks for being part of Tech for Girls!.");
      launchConfetti();
      window.location.reload();
    })
    .catch((error) => {
      console.error("Error!", error.message);
      showToast("Submission failed. Please try again.", true);
      submitBtn.disabled = false;
    });
});

// Show success popup before submitting the form
submitBtn.onclick = function () {
  // Validate terms and captcha before showing popup
  if (!document.getElementById("terms").checked) {
    showToast("You must agree to the terms and conditions.", true);
    return;
  }

  const captchaInput = document.getElementById("captchaInput").value.trim();
  if (parseInt(captchaInput) !== captchaA + captchaB) {
    showToast("Incorrect answer to the math question.", true);
    generateCaptcha();
    return;
  }

  // Show popup and confetti
  document.getElementById("successMsg").classList.remove("hidden");
  launchConfetti && launchConfetti();

  // Trigger form submission (with fetch logic) after a short delay
  setTimeout(function () {
    document.getElementById("registrationForm").requestSubmit();
  }, 1500);
};

// --- Stars Animation ---
function animateStars() {
  const canvas = document.querySelector(".stars");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  let w = window.innerWidth,
    h = window.innerHeight;
  canvas.width = w;
  canvas.height = h;

  let stars = Array.from({ length: 80 }, () => ({
    x: Math.random() * w,
    y: Math.random() * h,
    r: Math.random() * 1.2 + 0.5,
    dx: Math.random() * 0.5 + 0.2,
    dy: Math.random() * 0.5 + 0.2,
  }));

  function draw() {
    ctx.clearRect(0, 0, w, h);
    ctx.save();
    ctx.globalAlpha = 0.7;
    for (let s of stars) {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, 2 * Math.PI);
      ctx.fillStyle = "#fff";
      ctx.shadowColor = "#eebefa";
      ctx.shadowBlur = 8;
      ctx.fill();
    }
    ctx.restore();
  }

  function update() {
    for (let s of stars) {
      s.x += s.dx;
      s.y += s.dy;
      if (s.x > w || s.y > h) {
        s.x = Math.random() * w * 0.3;
        s.y = Math.random() * h * 0.3;
      }
    }
  }

  function loop() {
    draw();
    update();
    requestAnimationFrame(loop);
  }

  loop();
  window.addEventListener("resize", () => {
    w = window.innerWidth;
    h = window.innerHeight;
    canvas.width = w;
    canvas.height = h;
  });
}

// --- Confetti Animation ---
function launchConfetti() {
  const canvas = document.getElementById("confettiCanvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const w = 200,
    h = 120;
  canvas.width = w;
  canvas.height = h;

  let confetti = Array.from({ length: 30 }, () => ({
    x: Math.random() * w,
    y: Math.random() * -h,
    r: Math.random() * 6 + 4,
    d: Math.random() * 2 + 1,
    color: `hsl(${Math.random() * 360},80%,70%)`,
    tilt: Math.random() * 10 - 5,
  }));

  let frame = 0;
  function draw() {
    ctx.clearRect(0, 0, w, h);
    for (let c of confetti) {
      ctx.save();
      ctx.beginPath();
      ctx.ellipse(c.x, c.y, c.r, c.r / 2, c.tilt, 0, 2 * Math.PI);
      ctx.fillStyle = c.color;
      ctx.globalAlpha = 0.8;
      ctx.fill();
      ctx.restore();
    }
  }

  function update() {
    for (let c of confetti) {
      c.y += c.d + Math.sin(frame / 10 + c.x);
      c.x += Math.sin(frame / 15 + c.y / 10) * 1.5;
      if (c.y > h) {
        c.x = Math.random() * w;
        c.y = (Math.random() * -h) / 2;
      }
    }
    frame++;
  }

  let count = 0;
  function loop() {
    draw();
    update();
    count++;
    if (count < 80) requestAnimationFrame(loop);
  }

  loop();
}
