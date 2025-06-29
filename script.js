// DOM Elements
const arraySizeSelect = document.getElementById("array-size");
const generateArrayBtn = document.getElementById("generate-array");
const targetInput = document.getElementById("target");
const startSearchBtn = document.getElementById("start-search");
const resetBtn = document.getElementById("reset");
const stepBtn = document.getElementById("step");
const autoBtn = document.getElementById("auto");
const arrayContainer = document.getElementById("array-container");
const logContainer = document.getElementById("log-container");
const statusElement = document.getElementById("status");
const speedSlider = document.getElementById("speed");
const speedValue = document.getElementById("speed-value");
const arrayInputMethod = document.getElementById("array-input-method");
const randomArrayControls = document.getElementById("random-array-controls");
const customArrayControls = document.getElementById("custom-array-controls");
const customArrayInput = document.getElementById("custom-array");
const setCustomArrayBtn = document.getElementById("set-custom-array");
const searchAlgorithmSelect = document.getElementById("search-algorithm");

// State Variables
let array = [];
let low = 0;
let high = 0;
let mid = 0;
let currentIndex = 0; // For linear search
let target = 0;
let step = 0;
let found = false;
let searchComplete = false;
let autoRunInterval = null;
let animationSpeed = parseInt(speedSlider.value);
let searchAlgorithm = "binary";
let maxValue = 100; // For scaling bar heights

// Initialize
generateArray();

// Event Listeners
arrayInputMethod.addEventListener("change", toggleArrayInputMethod);
generateArrayBtn.addEventListener("click", generateArray);
setCustomArrayBtn.addEventListener("click", setCustomArray);
startSearchBtn.addEventListener("click", startSearch);
resetBtn.addEventListener("click", resetSearch);
stepBtn.addEventListener("click", performStep);
autoBtn.addEventListener("click", toggleAutoRun);
speedSlider.addEventListener("input", updateSpeed);
searchAlgorithmSelect.addEventListener("change", function () {
  searchAlgorithm = searchAlgorithmSelect.value;
  resetSearch();
});

// Functions
function toggleArrayInputMethod() {
  if (arrayInputMethod.value === "random") {
    randomArrayControls.style.display = "flex";
    customArrayControls.style.display = "none";
  } else {
    randomArrayControls.style.display = "none";
    customArrayControls.style.display = "flex";
  }
}

function generateArray() {
  resetSearch();

  const size = parseInt(arraySizeSelect.value);
  array = [];

  // Generate sorted array with unique values
  const usedValues = new Set();

  for (let i = 0; i < size; i++) {
    let value;
    do {
      value = Math.floor(Math.random() * 100) + 1;
    } while (usedValues.has(value));

    usedValues.add(value);
    array.push(value);
  }

  // Sort the array (binary search requires a sorted array)
  array.sort((a, b) => a - b);

  // Update max value for scaling
  maxValue = Math.max(...array);

  renderArray();
  addLog(`Generated sorted array with ${size} elements: [${array.join(", ")}]`);

  // Update target input max value
  targetInput.max = maxValue;
}

function setCustomArray() {
  resetSearch();

  // Parse input string into array of numbers
  const input = customArrayInput.value.trim();

  if (!input) {
    addLog("Please enter valid numbers for the array");
    return;
  }

  try {
    // Split by commas and convert to numbers
    array = input
      .split(",")
      .map((num) => num.trim())
      .filter((num) => num !== "")
      .map((num) => {
        const parsed = parseInt(num);
        if (isNaN(parsed)) {
          throw new Error("Invalid number: " + num);
        }
        return parsed;
      });

    if (array.length === 0) {
      addLog("Please enter at least one valid number");
      return;
    }

    // Sort the array (binary search requires a sorted array)
    array.sort((a, b) => a - b);

    // Update max value for scaling
    maxValue = Math.max(...array);

    renderArray();
    addLog(`Set custom sorted array: [${array.join(", ")}]`);

    // Update target input max value
    targetInput.max = maxValue;
  } catch (error) {
    addLog("Error: " + error.message);
  }
}

function renderArray() {
  arrayContainer.innerHTML = "";

  // Calculate container width and bar width
  const containerWidth = arrayContainer.clientWidth;
  const totalItems = array.length;

  // Calculate appropriate width for each bar
  const barMargin = 5;
  const availableWidth = containerWidth - totalItems * barMargin * 2;
  const barWidth = Math.min(40, Math.floor(availableWidth / totalItems));

  array.forEach((value, index) => {
    const element = document.createElement("div");
    element.className = "array-element";

    // Calculate height as percentage of the max value (80% of container height)
    const height = (value / maxValue) * 200; // 200px is 80% of the 250px container height
    element.style.height = `${height}px`;
    element.style.width = `${barWidth}px`;

    // Add value label
    const valueLabel = document.createElement("div");
    valueLabel.className = "value";
    valueLabel.textContent = value;
    element.appendChild(valueLabel);

    // Add index label
    const indexLabel = document.createElement("div");
    indexLabel.className = "index";
    indexLabel.textContent = index;
    element.appendChild(indexLabel);

    // Add classes based on current state
    if (searchComplete) {
      if (
        found &&
        ((searchAlgorithm === "binary" && index === mid) ||
          (searchAlgorithm === "linear" && index === currentIndex))
      ) {
        element.classList.add("found");
      } else if (
        !found &&
        ((searchAlgorithm === "binary" && index === mid) ||
          (searchAlgorithm === "linear" && index === array.length - 1))
      ) {
        element.classList.add("not-found");
      }
    } else if (step > 0) {
      if (searchAlgorithm === "binary") {
        if (index === mid) {
          element.classList.add("mid");
          element.classList.add("pulse");
        }
        if (index === low) {
          element.classList.add("low");
        }
        if (index === high) {
          element.classList.add("high");
        }
      } else if (searchAlgorithm === "linear" && index === currentIndex) {
        element.classList.add("current");
        element.classList.add("pulse");
      }
    }

    arrayContainer.appendChild(element);
  });
}

function startSearch() {
  resetSearch();
  target = parseInt(targetInput.value);

  // Check if target is valid
  if (isNaN(target)) {
    addLog("Please enter a valid target number");
    return;
  }

  addLog(`Starting ${searchAlgorithm} search for target: ${target}`);

  // Initialize search variables
  if (searchAlgorithm === "binary") {
    low = 0;
    high = array.length - 1;
  } else {
    currentIndex = 0;
  }
  step = 1;

  // Enable step and auto buttons
  stepBtn.disabled = false;
  autoBtn.disabled = false;

  updateStatus("Search started...");
}

function performStep() {
  if (searchComplete) return;

  if (searchAlgorithm === "binary") {
    performBinarySearchStep();
  } else {
    performLinearSearchStep();
  }

  step++;
  renderArray();
}

function performBinarySearchStep() {
  // Calculate middle index
  mid = Math.floor((low + high) / 2);

  addLog(
    `Step ${step}: low=${low}, high=${high}, mid=${mid}, midValue=${array[mid]}`
  );

  // Check if the middle element is the target
  if (array[mid] === target) {
    found = true;
    searchComplete = true;
    addLog(`Target ${target} found at index ${mid}!`);
    updateStatus(`Found ${target} at index ${mid}!`);
    disableButtons();
  }
  // Check if search space is exhausted
  else if (low > high) {
    found = false;
    searchComplete = true;
    addLog(`Target ${target} not found in the array.`);
    updateStatus(`Target ${target} not found in the array.`);
    disableButtons();
  }
  // Continue searching
  else if (array[mid] < target) {
    low = mid + 1;
    addLog(`${array[mid]} < ${target}, so setting low = mid + 1 = ${low}`);
    updateStatus(`${array[mid]} < ${target}, searching right half`);
  } else {
    high = mid - 1;
    addLog(`${array[mid]} > ${target}, so setting high = mid - 1 = ${high}`);
    updateStatus(`${array[mid]} > ${target}, searching left half`);
  }
}

function performLinearSearchStep() {
  if (currentIndex >= array.length) {
    found = false;
    searchComplete = true;
    addLog(`Checked all ${array.length} elements. Target ${target} not found.`);
    updateStatus(`Target ${target} not found in the array.`);
    disableButtons();
    return;
  }

  addLog(
    `Step ${step}: Checking index ${currentIndex}, value=${array[currentIndex]}`
  );

  if (array[currentIndex] === target) {
    found = true;
    searchComplete = true;
    addLog(`Target ${target} found at index ${currentIndex}!`);
    updateStatus(`Found ${target} at index ${currentIndex}!`);
    disableButtons();
  } else {
    updateStatus(
      `Checking index ${currentIndex}: ${array[currentIndex]} != ${target}, moving to next element`
    );
    currentIndex++;
  }
}

function disableButtons() {
  stepBtn.disabled = true;
  if (autoRunInterval) {
    clearInterval(autoRunInterval);
    autoRunInterval = null;
    autoBtn.textContent = "Auto Run";
  }
}

function resetSearch() {
  step = 0;
  low = 0;
  high = array.length - 1;
  mid = 0;
  currentIndex = 0;
  found = false;
  searchComplete = false;

  // Disable step and auto buttons
  stepBtn.disabled = true;
  autoBtn.disabled = true;

  // Clear auto run if active
  if (autoRunInterval) {
    clearInterval(autoRunInterval);
    autoRunInterval = null;
    autoBtn.textContent = "Auto Run";
  }

  updateStatus("");
  renderArray();
}

function toggleAutoRun() {
  if (autoRunInterval) {
    clearInterval(autoRunInterval);
    autoRunInterval = null;
    autoBtn.textContent = "Auto Run";
  } else {
    autoRunInterval = setInterval(performStep, animationSpeed);
    autoBtn.textContent = "Stop Auto";
  }
}

function updateSpeed() {
  animationSpeed = parseInt(speedSlider.value);
  speedValue.textContent = `${animationSpeed}ms`;

  // Update interval if auto run is active
  if (autoRunInterval) {
    clearInterval(autoRunInterval);
    autoRunInterval = setInterval(performStep, animationSpeed);
  }
}

function addLog(message) {
  const entry = document.createElement("div");
  entry.className = "log-entry";
  entry.textContent = message;
  logContainer.appendChild(entry);

  // Scroll to bottom
  logContainer.scrollTop = logContainer.scrollHeight;
}

function updateStatus(message) {
  statusElement.textContent = message;
}
