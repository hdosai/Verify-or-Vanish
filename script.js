let db;
let firebaseRef;
let firebasePush;
let firebaseOnValue;

let timeLeft = 60;
let timer = document.getElementById("timer");
let game = document.getElementById("game");
let message = document.getElementById("message");

// SOUND
let tickSound = new Audio("sounds/tick.mp3");
let alarmSound = new Audio("sounds/alarm.mp3");

let phase1Words = ["MANDATORY", "DIGITAL", "IDENTIFICATION"];
let phase1Answer = localStorage.getItem("phase1Answer");

let countdown;
let lastTickTime = Date.now();
let gameStarted = false; // 🔥 NEW: controls start button logic


function initFirebase() {
  db = window.db;
  firebaseRef = window.ref;
  firebasePush = window.push;
  firebaseOnValue = window.onValue;
}

// ================= START GAME =================
function startGame() {
  initFirebase(); // 🔥 connect Firebase first

  tickSound.currentTime = 0;
  tickSound.play().catch(() => {});

  startTimer();
  loadPhase1();
}

// ================= TIMER (SYNCED) =================
function startTimer() {
  lastTickTime = Date.now();

  countdown = setInterval(() => {
    let now = Date.now();

    if (now - lastTickTime >= 1000) {
      lastTickTime = now;

      timeLeft--;
      timer.textContent = "Time Left: " + Math.max(timeLeft, 0); // 🔥 never show negative

      playTick();

      if (timeLeft <= 10) {
        timer.classList.add("danger");
      }

      if (timeLeft <= 0) {
        timeLeft = 0; // 🔥 lock at 0
        timer.textContent = "Time Left: 0";
        endGame(false);
      }
    }
  }, 50);
}

// ================= PLAY TICK =================
function playTick() {
  tickSound.pause();
  tickSound.currentTime = 0;
  tickSound.play().catch(() => {});
}

// ================= END GAME =================
function endGame(win) {
  clearInterval(countdown);

  tickSound.pause();
  tickSound.currentTime = 0;

  game.innerHTML = "";

  if (win) {
    message.innerHTML = "🎉 <span class='glitch'>ACCESS GRANTED</span>";
    saveScore();
  } else {
    alarmSound.play().catch(() => {});
    message.innerHTML = "❌ <span class='glitch'>VERIFICATION FAILED</span>";
  }

  showLeaderboard();
}

// ================= INITIAL SCREEN CONTROL =================
function showStartScreen() {
  game.innerHTML = `
    <button onclick="startGame()">Start Game</button>
  `;
}

// ================= PHASE 1 =================
function loadPhase1() {

  // 🔥 assign ONLY ONCE per device
  if (!phase1Answer) {
    phase1Answer = phase1Words[Math.floor(Math.random() * phase1Words.length)];
    localStorage.setItem("phase1Answer", phase1Answer);
  }

  let modes = ["jumbled", "missing", "leet"];
  let mode = modes[Math.floor(Math.random() * modes.length)];

  let display = "";

  if (mode === "jumbled") {
    display = phase1Answer.split("").sort(() => Math.random() - 0.5).join(" ");
  }

  if (mode === "missing") {
    display = phase1Answer.replace(/[A-Z]/g, "_ ");
  }

  if (mode === "leet") {
    display = phase1Answer
      .replaceAll("A", "4")
      .replaceAll("E", "3")
      .replaceAll("I", "1")
      .replaceAll("O", "0")
      .replaceAll("T", "7");
  }

  game.innerHTML = `
    <h2>Decrypt System Protocol</h2>
    <p>${display}</p>

    <input type="text" id="answer1" placeholder="Enter word">
    <br>
    <button onclick="checkPhase1()">Submit</button>
  `;
}

// ================= PHASE 2 =================
function loadPhase2() {
  game.innerHTML = `
    <h2>Select Official Portal</h2>
    <button onclick="checkPhase2(1)">htttp://securesite.to</button>
    <button onclick="checkPhase2(2)">http://University.edu.gov.ph</button>
    <button onclick="checkPhase2(3)">https://Free.money</button>
  `;
}

function checkPhase2(choice) {
  if (choice === 2) {
    message.innerHTML = "✅ CONNECTION SECURE";
    glitchFlash();
    setTimeout(loadPhase3, 500);
  } else {
    message.innerHTML = "⚠️ PHISHING DETECTED (-5s)";
    timeLeft -= 5;
    shakeScreen();
  }
}

// ================= PHASE 3 =================
function loadPhase3() {
  let today = new Date();
  let d = today.getDate();
  let m = today.getMonth() + 1;
  let y = today.getFullYear();

  game.innerHTML = `
    <h2>Date Verification</h2>
    <p>Enter today's date (DD/MM/YYYY)</p>
    <input type="text" id="dateInput">
    <br>
    <button onclick="checkPhase3(${d},${m},${y})">Verify</button>
  `;
}

function checkPhase3(d, m, y) {
  let input = document.getElementById("dateInput").value;
  let correct = `${d}/${m}/${y}`;

  if (input === correct) {
    endGame(true);
  } else {
    message.innerHTML = "❌ INVALID DATE";
    shakeScreen();
  }
}

// ================= LEADERBOARD =================
function saveScore() {
  let name = prompt("Enter your name:");
  if (!name) name = "Anonymous";

  let score = timeLeft;

  const leaderboardRef = firebaseRef(db, "leaderboard");

  firebasePush(leaderboardRef, {
    name: name,
    score: score
  });
}

function showLeaderboard() {
  const leaderboardRef = firebaseRef(db, "leaderboard");

  firebaseOnValue(leaderboardRef, (snapshot) => {
    let data = snapshot.val();

    let entries = [];

    for (let key in data) {
      entries.push(data[key]);
    }

    entries.sort((a, b) => b.score - a.score);
    entries = entries.slice(0, 5);

    let html = "<h2>🏆 GLOBAL LEADERBOARD</h2>";

    entries.forEach((entry, index) => {
      let medal = "";
      let label = "";

      if (index === 0) {
        medal = "🥇";
        label = ""; // no number
      } else if (index === 1) {
        medal = "🥈";
        label = "";
      } else if (index === 2) {
        medal = "🥉";
        label = "";
      } else {
        medal = "🔹";
        label = `${index + 1}.`; // only 4th, 5th, etc
      }

      html += `<p>${medal} ${label} ${entry.name} - ${entry.score}s</p>`;
    });

    html += `<br><button onclick="restartGame()">Try Again</button>`;

    game.innerHTML = html;
  });
}

// ================= RESTART =================
function restartGame() {
  localStorage.removeItem("phase1Answer"); // 🔥 resets RNG
  location.reload();
}

// ================= EFFECTS =================
function glitchFlash() {
  document.body.style.background = "#033";
  setTimeout(() => {
    document.body.style.background = "black";
  }, 100);
}

function shakeScreen() {
  document.body.classList.add("shake");
  setTimeout(() => {
    document.body.classList.remove("shake");
  }, 300);
}

// ================= AUTO START SCREEN =================
showStartScreen();
window.checkPhase1 = checkPhase1;
window.startGame = startGame;
window.checkPhase2 = checkPhase2;
window.checkPhase3 = checkPhase3;
window.restartGame = restartGame;
