let timer;
let startTime;
let elapsedTime = 0;
let isRunning = false;
let isPaused = false;

const timerDisplay = document.getElementById('timer');
const elapsedDisplay = document.getElementById('elapsed');
const startButton = document.getElementById('startButton');
const pauseButton = document.getElementById('pauseButton');
const stopButton = document.getElementById('stopButton');
const timeInput = document.getElementById('timeInput');

function formatTime(ms) {
  const hours = Math.floor(ms / 3600000).toString().padStart(2, '0');
  const minutes = Math.floor((ms % 3600000) / 60000).toString().padStart(2, '0');
  const seconds = Math.floor((ms % 60000) / 1000).toString().padStart(2, '0');
  const milliseconds = (ms % 1000).toString().padStart(3, '0');
  return `${hours}:${minutes}:${seconds}.${milliseconds}`;
}

function updateTimer() {
  const currentTime = Date.now();
  const elapsed = currentTime - startTime;
  const remainingTime = Math.max(0, totalTime - elapsed);

  timerDisplay.textContent = formatTime(remainingTime);
  elapsedDisplay.textContent = `Elapsed: ${formatTime(elapsed)}`;

  if (remainingTime <= 0) {
    clearInterval(timer);
    isRunning = false;
    startButton.disabled = false;
    pauseButton.disabled = true;
    stopButton.disabled = true;
  }
}

startButton.addEventListener('click', () => {
  if (!isRunning) {
    totalTime = parseInt(timeInput.value, 10);
    if (isNaN(totalTime) || totalTime <= 0) {
      alert('Please enter a valid time in milliseconds.');
      return;
    }

    startTime = Date.now() - elapsedTime;
    isRunning = true;
    isPaused = false;
    timer = setInterval(updateTimer, 10);

    startButton.disabled = true;
    pauseButton.disabled = false;
    stopButton.disabled = false;
  }
});

pauseButton.addEventListener('click', () => {
  if (isRunning) {
    clearInterval(timer);
    elapsedTime = Date.now() - startTime;
    isRunning = false;
    isPaused = true;

    startButton.textContent = 'Continue';
    startButton.disabled = false;
    pauseButton.disabled = true;
  }
});

stopButton.addEventListener('click', () => {
  clearInterval(timer);
  isRunning = false;
  isPaused = false;
  elapsedTime = 0;
  timerDisplay.textContent = formatTime(0);
  elapsedDisplay.textContent = 'Elapsed: 00:00:00.000';

  startButton.textContent = 'Start';
  startButton.disabled = false;
  pauseButton.disabled = true;
  stopButton.disabled = true;
});
