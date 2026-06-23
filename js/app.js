// ===== Basis variabelen =====
let distance = 0;
let time = 0;
let isRunning = false;
let timerInterval;
const goalDuration = 30 * 60; // 30 minuten

// DOM-elementen
const timeEl = document.getElementById('time');
const startBtn = document.getElementById('start-btn');
const stopBtn = document.getElementById('stop-btn');
const statusPill = document.querySelector('.status-pill');
const progressFill = document.getElementById('progress-fill');
const runSummary = document.getElementById('run-summary');
const kmInput = document.getElementById('km-input');
const meterInput = document.getElementById('meter-input');
const descriptionInput = document.getElementById('description-input');
const calculateBtn = document.getElementById('calculate-btn');
const resultMessage = document.getElementById('result-message');
const resultDetails = document.getElementById('result-details');

const periodSelect = document.getElementById('period-select');
const runsList = document.getElementById('runs-list');
const langSelect = document.getElementById('language-switch');
const resetAllBtn = document.getElementById('reset-all-btn');

// LocalStorage keys
const STORAGE_KEY = 'runpulse_runs';
const LANG_KEY = 'runpulse_lang';

// ===== Vertalingen =====
const translations = {
  nl: {
    eyebrow: 'Run tracker',
    title: 'RunPulse',
    heroText: 'Een strakke hardlooptracker voor timer, afstand en je eindresultaat.',
    languageLabel: 'Taal:',
    statsTitle: 'Je hardloopstatistieken',
    statusReady: 'Klaar',
    statsHelp: 'Hier zie je je timer tijdens het lopen.',
    timerLabel: 'Timer',
    timerHelp: 'Dit is de tijd sinds je op start hebt gedrukt.',
    helperText: 'Start je run, stop daarna en vul je km en meter in voor je samenvatting.',
    summaryLabel: 'Hoeveel heb je gelopen?',
    summaryHelp: 'Vul je afstand in nadat je op stop hebt gedrukt.',
    kmLabel: 'Kilometer',
    kmHelp: 'Vul hier het hele aantal kilometers in.',
    meterLabel: 'Meter',
    meterHelp: 'Gebruik dit voor de losse meters extra.',
    descLabel: 'Omschrijving',
    descHelp: 'Bijvoorbeeld waar of hoe je gelopen hebt.',
    calculateBtn: 'Bereken resultaat',
    resultDefault: 'Vul je afstand in om je resultaat te zien.',
    startBtn: 'Start hardloop',
    stopBtn: 'Stop',
    overviewTitle: 'Overzicht van je runs',
    overviewHelp: 'Hier zie je eerdere trainingen die je hebt opgeslagen.',
    periodLabel: 'Periode:',
    periodHelp: 'Kies welke runs je wilt bekijken.',
    periodDay: 'Vandaag',
    periodWeek: 'Deze week',
    periodMonth: 'Deze maand',
    resetAllBtn: 'Reset alle runs',
    statusNoDistance: 'Afstand ontbreekt',
    statusShort: 'Te korte training',
    statusRunning: 'Training loopt',
    statusDistance: 'Voer afstand in',
    statusCalculated: 'Resultaat berekend',
    msgInvalidDistance: 'Vul eerst een geldige afstand in.',
    msgShortRun: 'Deze training is te kort om eerlijk te beoordelen.',
    msgGood: 'Je bent goed op pad.',
    msgNeedConsistent: 'Je mag nog wat constanter trainen.',
    msgStable: 'Je bent prima bezig en zit op een stabiel tempo.',
    msgStrong: 'Sterk tempo, je loopt erg goed.',
    overviewEmpty: 'Nog geen runs in deze periode.',
    overviewItem: (run) =>
      `${run.date} • ${run.distanceKm.toFixed(2)} km in ${formatDuration(run.durationSec)} • ${run.avgSpeedKmh.toFixed(1)} km/u`
  },
  en: {
    eyebrow: 'Run tracker',
    title: 'RunPulse',
    heroText: 'A clean running tracker for time, distance and your final result.',
    languageLabel: 'Language:',
    statsTitle: 'Your running statistics',
    statusReady: 'Ready',
    statsHelp: 'This is where you see your timer while running.',
    timerLabel: 'Timer',
    timerHelp: 'This is the time since you pressed start.',
    helperText: 'Start your run, stop it, then enter your km and meters to see your summary.',
    summaryLabel: 'How far did you run?',
    summaryHelp: 'Enter your distance after pressing stop.',
    kmLabel: 'Kilometers',
    kmHelp: 'Enter the whole number of kilometers here.',
    meterLabel: 'Meters',
    meterHelp: 'Use this for the extra meters.',
    descLabel: 'Description',
    descHelp: 'For example where or how you ran.',
    calculateBtn: 'Calculate result',
    resultDefault: 'Enter your distance to see your result.',
    startBtn: 'Start run',
    stopBtn: 'Stop',
    overviewTitle: 'Overview of your runs',
    overviewHelp: 'This shows earlier trainings you saved.',
    periodLabel: 'Period:',
    periodHelp: 'Choose which runs you want to view.',
    periodDay: 'Today',
    periodWeek: 'This week',
    periodMonth: 'This month',
    resetAllBtn: 'Reset all runs',
    statusNoDistance: 'Distance missing',
    statusShort: 'Run is too short to judge fairly.',
    statusRunning: 'Workout in progress',
    statusDistance: 'Enter distance',
    statusCalculated: 'Result calculated',
    msgInvalidDistance: 'Please enter a valid distance first.',
    msgShortRun: 'This run is too short to judge fairly.',
    msgGood: 'You are on the right track.',
    msgNeedConsistent: 'You could train a bit more consistently.',
    msgStable: 'You are doing well and running at a stable pace.',
    msgStrong: 'Strong pace, you are running very well.',
    overviewEmpty: 'No runs in this period yet.',
    overviewItem: (run) =>
      `${run.date} • ${run.distanceKm.toFixed(2)} km in ${formatDuration(run.durationSec)} • ${run.avgSpeedKmh.toFixed(1)} km/h`
  }
};

// ===== LocalStorage helpers =====
function loadRuns() {
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw ? JSON.parse(raw) : [];
}

function saveRuns(runs) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(runs));
}

// ===== Taalfuncties =====
function setLanguage(lang) {
  const dict = translations[lang] || translations.nl;

  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    const value = dict[key];
    if (typeof value === 'string') {
      el.textContent = value;
    }
  });

  kmInput.placeholder = '5';
  meterInput.placeholder = '200';
  descriptionInput.placeholder =
    lang === 'nl' ? 'Avondrun door het park' : 'Evening run in the park';

  localStorage.setItem(LANG_KEY, lang);
  renderRunsOverview();
}

langSelect.addEventListener('change', () => {
  setLanguage(langSelect.value);
});

// ===== Eventlisteners =====
startBtn.addEventListener('click', startHardloop);
stopBtn.addEventListener('click', stopHardloop);
calculateBtn.addEventListener('click', calculateResult);
periodSelect.addEventListener('change', renderRunsOverview);
resetAllBtn.addEventListener('click', resetAllRuns);

// Init
updateDisplay();
initLanguage();
renderRunsOverview();

// ===== Init language =====
function initLanguage() {
  const savedLang = localStorage.getItem(LANG_KEY) || 'nl';
  langSelect.value = savedLang;
  setLanguage(savedLang);
}

// ===== Hardloop functionaliteit =====
function startHardloop() {
  if (!isRunning) {
    isRunning = true;
    timerInterval = setInterval(updateTimer, 1000);
    startBtn.disabled = true;
    stopBtn.disabled = false;
    const lang = langSelect.value;
    statusPill.textContent = translations[lang].statusRunning;
    runSummary.classList.add('is-hidden');
    resultDetails.textContent = '';
    resultMessage.textContent = translations[lang].resultDefault;
  }
}

function stopHardloop() {
  if (isRunning) {
    isRunning = false;
    clearInterval(timerInterval);
    startBtn.disabled = false;
    stopBtn.disabled = true;
    const lang = langSelect.value;
    statusPill.textContent = translations[lang].statusDistance;
    runSummary.classList.remove('is-hidden');
    kmInput.focus();
  }
}

function updateTimer() {
  time++;
  updateDisplay();
}

// Bereken het resultaat van de run, sla het op en werk het overzicht bij.
function calculateResult() {
  const lang = langSelect.value;
  const dict = translations[lang];

  const kilometers = parseDistanceInput(kmInput.value);
  const meters = parseDistanceInput(meterInput.value);
  const walkedDistance = calculateTotalDistance(kilometers, meters);

  if (!Number.isFinite(walkedDistance) || walkedDistance <= 0) {
    resultMessage.textContent = dict.msgInvalidDistance;
    resultDetails.textContent = '';
    statusPill.textContent = dict.statusNoDistance;
    return;
  }

  distance = walkedDistance;

  const elapsedMinutes = time / 60;
  const hours = time / 3600;
  const averageSpeed = hours > 0 ? distance / hours : 0;
  const paceMinutesPerKm = distance > 0 ? elapsedMinutes / distance : 0;
  const paceLabel = formatPace(paceMinutesPerKm);

  if (time < 60) {
    resultMessage.textContent = dict.msgShortRun;
    resultDetails.textContent =
      lang === 'nl'
        ? `Je liep ${distance.toFixed(2)} km in ${timeEl.textContent}. Laat de timer iets langer lopen voor een bruikbare gemiddelde snelheid en tempo.`
        : `You ran ${distance.toFixed(2)} km in ${timeEl.textContent}. Let the timer run a bit longer for a more useful average speed and pace.`;
    statusPill.textContent = dict.statusShort;
    return;
  }

  let verdict = dict.msgGood;

  if (paceMinutesPerKm > 7.5) {
    verdict = dict.msgNeedConsistent;
  } else if (paceMinutesPerKm > 5.5 && paceMinutesPerKm <= 7.5) {
    verdict = dict.msgStable;
  } else if (paceMinutesPerKm <= 5.5) {
    verdict = dict.msgStrong;
  }

  resultMessage.textContent = verdict;
  resultDetails.textContent =
    lang === 'nl'
      ? `Gemiddelde snelheid: ${averageSpeed.toFixed(1)} km/u · Gemiddeld tempo: ${paceLabel} min/km`
      : `Average speed: ${averageSpeed.toFixed(1)} km/h · Average pace: ${paceLabel} min/km`;
  statusPill.textContent = dict.statusCalculated;

  const description = descriptionInput.value.trim() || (lang === 'nl'
    ? 'Run zonder omschrijving'
    : 'Run without description');

  const newRun = {
    id: Date.now().toString(),
    date: new Date().toISOString().slice(0, 10),
    category: 'Hardlopen',
    description,
    distanceKm: distance,
    durationSec: time,
    avgSpeedKmh: Number(averageSpeed.toFixed(1)),
    paceMinPerKm: paceMinutesPerKm
  };

  const runs = loadRuns();
  runs.push(newRun);
  saveRuns(runs);

  renderRunsOverview();
}

function calculateTotalDistance(kilometers, meters) {
  if (!Number.isFinite(kilometers) || !Number.isFinite(meters)) {
    return NaN;
  }
  if (kilometers < 0 || meters < 0 || meters >= 1000) {
    return NaN;
  }
  return kilometers + meters / 1000;
}

function parseDistanceInput(value) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatPace(minutesPerKm) {
  if (!Number.isFinite(minutesPerKm) || minutesPerKm <= 0) {
    return '0:00';
  }

  const paceMinutes = Math.floor(minutesPerKm);
  let paceSeconds = Math.round((minutesPerKm - paceMinutes) * 60);

  if (paceSeconds === 60) {
    return `${paceMinutes + 1}:00`;
  }

  return `${paceMinutes}:${String(paceSeconds).padStart(2, '0')}`;
}

function updateDisplay() {
  const minutes = Math.floor(time / 60);
  const seconds = time % 60;
  timeEl.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const progress = Math.min((time / goalDuration) * 100, 100);
  progressFill.style.width = `${progress}%`;
}

// ===== Overzicht (Read + Delete) =====
// Toon alle opgeslagen runs in de gekozen periode en werk het run-overzicht bij.
function renderRunsOverview() {
  const runs = loadRuns();
  const period = periodSelect.value;
  const filtered = filterRunsByPeriod(runs, period);
  const lang = langSelect.value;
  const dict = translations[lang];

  if (!filtered.length) {
    runsList.innerHTML = `<p class="helper-text">${dict.overviewEmpty}</p>`;
    return;
  }

  const html = filtered.map(run => `
    <article class="run-item">
      <div class="run-item__main">
        <p>${dict.overviewItem(run)}</p>
        <p class="run-item__desc">${run.description}</p>
      </div>
        <button class="run-item__delete" onclick="deleteRun('${run.id}')">
        ✕
        </button>
    </article>
  `).join('');

  runsList.innerHTML = html;
}

function filterRunsByPeriod(runs, period) {
  const now = new Date();
  return runs.filter(run => {
    const runDate = new Date(run.date + 'T00:00:00');
    const diffDays = Math.floor((now - runDate) / (1000 * 60 * 60 * 24));

    if (period === 'day') {
      return diffDays === 0;
    }
    if (period === 'week') {
      return diffDays >= 0 && diffDays < 7;
    }
    if (period === 'month') {
      return diffDays >= 0 && diffDays < 31;
    }
    return true;
  });
}

function formatDuration(durationSec) {
  const minutes = Math.floor(durationSec / 60);
  const seconds = durationSec % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

// Delete-functie per item
window.deleteRun = function (id) {
  const runs = loadRuns();
  const updated = runs.filter(run => run.id !== id);
  saveRuns(updated);
  renderRunsOverview();
};

// Reset ALLE runs: verwijder alle opgeslagen data en zet de UI terug naar de startstand.
function resetAllRuns() {
  const lang = langSelect.value;
  const dict = translations[lang];

  const confirmMessage =
    lang === 'nl'
      ? 'Weet je zeker dat je ALLE runs wilt verwijderen? Dit kan niet ongedaan gemaakt worden.'
      : 'Are you sure you want to delete ALL runs? This cannot be undone.';

  if (!window.confirm(confirmMessage)) {
    return;
  }

  // Verwijder alle runs uit LocalStorage
  localStorage.removeItem(STORAGE_KEY);

  // UI legen
  runsList.innerHTML = `<p class="helper-text">${dict.overviewEmpty}</p>`;

  // Timer en inputs terugzetten
  time = 0;
  distance = 0;
  clearInterval(timerInterval);
  isRunning = false;
  startBtn.disabled = false;
  stopBtn.disabled = true;
  kmInput.value = '';
  meterInput.value = '';
  descriptionInput.value = '';
  updateDisplay();

  statusPill.textContent = dict.statusReady;
  resultMessage.textContent = dict.resultDefault;
  resultDetails.textContent = '';
  runSummary.classList.add('is-hidden');
}