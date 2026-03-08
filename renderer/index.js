const soundboard = document.getElementById("soundboard");
const addSoundBtn = document.getElementById("addSound");
const topPanelTitle = document.getElementById("top-panel-title");
const minimizeWindowBtn = document.getElementById("window-minimize");
const maximizeWindowBtn = document.getElementById("window-maximize");
const closeWindowBtn = document.getElementById("window-close");
const allAudio = [];
let currentPlayingAudio = null;
let currentPlayingCard = null;
let globalVolume = 1;
let currentReproductionMode = "play-overlap";
const DEFAULT_APP_TITLE = "Soundboard";

// Panel elements
const audioPanel = document.getElementById("audio-panel");
const currentSoundName = document.getElementById("current-sound-name");
const panelVolume = document.getElementById("panel-volume");
const volumeDisplay = document.getElementById("volume-display");
const btnPlay = document.getElementById("btn-play");
const btnPause = document.getElementById("btn-pause");
const btnStop = document.getElementById("btn-stop");
const btnForward = document.getElementById("btn-forward");
const btnBackward = document.getElementById("btn-backward");
const progressFill = document.getElementById("progress-fill");
const currentTimeDisplay = document.getElementById("current-time");
const totalTimeDisplay = document.getElementById("total-time");
const progressBar = document.querySelector(".progress-bar");
const editSoundNameBtn = document.querySelector(".edit-icon");
const globalVolumeSlider = document.getElementById("global-volume");
const globalVolumeDisplay = document.getElementById("global-volume-display");
const appBody = document.body;
const leftSettingsBtn = document.getElementById("left-settings-btn");
const leftSettingsMenu = document.getElementById("left-settings-menu");
const toggleLeftPanelThemeBtn = document.getElementById("toggle-left-panel-theme");
const CHARMING_THEME_CLASS = "charming-theme";
const APP_THEME_STORAGE_KEY = "appThemeMode";

function setLeftSettingsMenuOpen(isOpen) {
  if (!leftSettingsMenu) {
    return;
  }

  leftSettingsMenu.classList.toggle("is-open", isOpen);
  leftSettingsMenu.setAttribute("aria-hidden", String(!isOpen));
  if (leftSettingsBtn) {
    leftSettingsBtn.setAttribute("aria-expanded", String(isOpen));
  }
}

function updateLeftPanelThemeButtonLabel() {
  if (!appBody || !toggleLeftPanelThemeBtn) {
    return;
  }

  const isCharmingThemeEnabled = appBody.classList.contains(CHARMING_THEME_CLASS);
  toggleLeftPanelThemeBtn.textContent = isCharmingThemeEnabled
    ? "Use Default Theme"
    : "Use Purple-Pink Theme";
}

if (appBody) {
  try {
    const savedThemeMode = window.localStorage.getItem(APP_THEME_STORAGE_KEY);
    if (savedThemeMode === "charming") {
      appBody.classList.add(CHARMING_THEME_CLASS);
    }
  } catch (err) {
    console.error("Unable to load app theme:", err);
  }
}

if (toggleLeftPanelThemeBtn && appBody) {
  toggleLeftPanelThemeBtn.addEventListener("click", () => {
    const isCharmingThemeEnabled = appBody.classList.toggle(CHARMING_THEME_CLASS);
    try {
      window.localStorage.setItem(
        APP_THEME_STORAGE_KEY,
        isCharmingThemeEnabled ? "charming" : "default"
      );
    } catch (err) {
      console.error("Unable to persist app theme:", err);
    }

    updateLeftPanelThemeButtonLabel();
  });
}

if (leftSettingsBtn && leftSettingsMenu) {
  setLeftSettingsMenuOpen(false);

  leftSettingsBtn.addEventListener("click", (event) => {
    event.stopPropagation();
    const shouldOpen = !leftSettingsMenu.classList.contains("is-open");
    setLeftSettingsMenuOpen(shouldOpen);
  });

  document.addEventListener("click", (event) => {
    if (!leftSettingsMenu.classList.contains("is-open")) {
      return;
    }

    const target = event.target;
    if (!(target instanceof Node)) {
      setLeftSettingsMenuOpen(false);
      return;
    }

    if (leftSettingsMenu.contains(target) || leftSettingsBtn.contains(target)) {
      return;
    }

    setLeftSettingsMenuOpen(false);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && leftSettingsMenu.classList.contains("is-open")) {
      setLeftSettingsMenuOpen(false);
    }
  });
}

updateLeftPanelThemeButtonLabel();

if (minimizeWindowBtn) {
  minimizeWindowBtn.addEventListener("click", () => {
    if (window.electronAPI && window.electronAPI.minimizeWindow) {
      window.electronAPI.minimizeWindow();
    }
  });
}

if (maximizeWindowBtn) {
  maximizeWindowBtn.addEventListener("click", () => {
    if (window.electronAPI && window.electronAPI.toggleMaximize) {
      window.electronAPI.toggleMaximize();
    }
  });
}

if (maximizeWindowBtn && window.electronAPI) {
  if (window.electronAPI.onWindowMaximized) {
    window.electronAPI.onWindowMaximized((isMaximized) => {
      maximizeWindowBtn.classList.toggle("is-maximized", isMaximized);
    });
  }

  if (window.electronAPI.getIsMaximized) {
    window.electronAPI.getIsMaximized().then((isMaximized) => {
      maximizeWindowBtn.classList.toggle("is-maximized", isMaximized);
    });
  }
}

if (closeWindowBtn) {
  closeWindowBtn.addEventListener("click", () => {
    if (window.electronAPI && window.electronAPI.closeWindow) {
      window.electronAPI.closeWindow();
    }
  });
}

function applyAppTitle(title) {
  const normalizedTitle =
    typeof title === "string" && title.trim() ? title.trim() : DEFAULT_APP_TITLE;

  if (topPanelTitle) {
    topPanelTitle.textContent = normalizedTitle;
  }
}

async function persistAppTitle(title) {
  if (!window.electronAPI || !window.electronAPI.saveAppTitle) {
    return;
  }

  try {
    const savedTitle = await window.electronAPI.saveAppTitle(title);
    applyAppTitle(savedTitle);
  } catch (err) {
    console.error("Error persisting app title:", err);
  }
}

if (window.electronAPI && window.electronAPI.loadAppTitle) {
  window.electronAPI
    .loadAppTitle()
    .then((savedTitle) => applyAppTitle(savedTitle))
    .catch((err) => {
      console.error("Error loading app title:", err);
      applyAppTitle(DEFAULT_APP_TITLE);
    });
}

if (topPanelTitle) {
  topPanelTitle.ondblclick = () => {
    const previousTitle = topPanelTitle.textContent;
    const input = document.createElement("input");
    input.type = "text";
    input.value = previousTitle;
    input.className = "top-panel-title-input";

    topPanelTitle.replaceWith(input);
    input.focus();
    input.select();

    let renameFinished = false;
    const finishRename = (shouldSave) => {
      if (renameFinished) {
        return;
      }
      renameFinished = true;

      if (shouldSave) {
        const newTitle = input.value.trim();
        if (newTitle) {
          applyAppTitle(newTitle);
          persistAppTitle(newTitle);
        } else {
          applyAppTitle(previousTitle);
          persistAppTitle(previousTitle);
        }
      } else {
        applyAppTitle(previousTitle);
      }

      input.replaceWith(topPanelTitle);
    };

    input.onblur = () => finishRename(true);
    input.onkeydown = (e) => {
      if (e.key === "Enter") {
        finishRename(true);
      }
      if (e.key === "Escape") {
        finishRename(false);
      }
    };
  };
}

// Checkboxes
const checkStopOthers = document.getElementById("check-stop-others");
const checkMuteOthers = document.getElementById("check-mute-others");
const checkLoop = document.getElementById("check-loop");

// Format time helper
function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function clampVolume(value) {
  return Math.min(1, Math.max(0, value));
}

function applyAudioVolume(audio) {
  if (!audio) {
    return;
  }

  const baseVolume = typeof audio._baseVolume === "number" ? audio._baseVolume : 1;
  const mutedByOption = Boolean(audio._isMutedByOption);
  audio.volume = mutedByOption ? 0 : clampVolume(baseVolume * globalVolume);
}

function setAudioBaseVolume(audio, value) {
  if (!audio) {
    return;
  }

  audio._baseVolume = clampVolume(value);
  applyAudioVolume(audio);
}

function applyVolumeToAllAudio() {
  allAudio.forEach(applyAudioVolume);
}

function syncMuteOthers(activeAudio = null) {
  const shouldMuteOthers = checkMuteOthers.classList.contains("checked") && Boolean(activeAudio);

  allAudio.forEach((audio) => {
    audio._isMutedByOption = shouldMuteOthers && audio !== activeAudio;
    applyAudioVolume(audio);
  });
}

function stopAllExcept(audioToKeep, cardToKeep) {
  allAudio.slice().forEach((audio) => {
    if (audio !== audioToKeep) {
      audio.pause();
      audio.currentTime = 0;
      unmarkCardPlaying(audio._parentCard, audio);
      cleanupEphemeralAudio(audio);
    }
  });

  document.querySelectorAll(".sound-card").forEach((card) => {
    if (card !== cardToKeep && card._activeInstances) {
      card._activeInstances.clear();
      card.classList.remove("playing");
    }
  });
}

function unregisterAudio(audioToRemove) {
  const index = allAudio.indexOf(audioToRemove);
  if (index !== -1) {
    allAudio.splice(index, 1);
  }
}

function ensureCardAudioState(card) {
  if (!card) {
    return;
  }

  if (!card._audioInstances) {
    card._audioInstances = new Set();
  }

  if (!card._activeInstances) {
    card._activeInstances = new Set();
  }
}

function markCardPlaying(card, audio) {
  if (!card || !audio) {
    return;
  }

  ensureCardAudioState(card);
  card._activeInstances.add(audio);
  card.classList.add("playing");
}

function unmarkCardPlaying(card, audio) {
  if (!card) {
    return;
  }

  ensureCardAudioState(card);
  if (audio) {
    card._activeInstances.delete(audio);
  } else {
    card._activeInstances.clear();
  }

  if (card._activeInstances.size === 0) {
    card.classList.remove("playing");
  }
}

function cleanupEphemeralAudio(audio) {
  if (!audio || !audio._isEphemeral) {
    return;
  }

  unregisterAudio(audio);
  if (audio._parentCard && audio._parentCard._audioInstances) {
    audio._parentCard._audioInstances.delete(audio);
  }
}

function updateCardBaseVolume(card, value) {
  if (!card) {
    return;
  }

  ensureCardAudioState(card);
  card._audioInstances.forEach((audio) => {
    setAudioBaseVolume(audio, value);
  });

  if (card._cardVolumeSlider) {
    card._cardVolumeSlider.value = Math.round(value * 100);
  }
}

// Update panel UI
function updatePanelUI() {
  const hasAudio = Boolean(currentPlayingAudio);
  audioPanel.classList.toggle("hidden", !hasAudio);

  [btnPlay, btnPause, btnStop, btnForward, btnBackward].forEach((btn) => {
    if (btn) {
      btn.disabled = !hasAudio;
    }
  });

  if (panelVolume) {
    panelVolume.disabled = !hasAudio;
  }

  if (progressBar) {
    progressBar.classList.toggle("is-disabled", !hasAudio);
  }

  if (!hasAudio) {
    currentSoundName.textContent = "No Sound Playing";
    if (btnPlay) {
      btnPlay.classList.remove("hidden");
    }
    if (btnPause) {
      btnPause.classList.add("hidden");
    }
    progressFill.style.width = "0%";
    currentTimeDisplay.textContent = "0:00";
    totalTimeDisplay.textContent = "0:00";
    return;
  }

  if (currentPlayingAudio.paused) {
    if (btnPlay) {
      btnPlay.classList.remove("hidden");
    }
    if (btnPause) {
      btnPause.classList.add("hidden");
    }
  } else {
    if (btnPlay) {
      btnPlay.classList.add("hidden");
    }
    if (btnPause) {
      btnPause.classList.remove("hidden");
    }
  }
}

const reproductionModeGroup = document.querySelector(".mode-toggle-group");

if (reproductionModeGroup) {
  const modeButtons = Array.from(
    reproductionModeGroup.querySelectorAll(".mode-toggle")
  );

  const setActiveModeButton = (activeButton) => {
    modeButtons.forEach((button) => {
      const isActive = button === activeButton;
      button.classList.toggle("is-active", isActive);
      button.setAttribute("aria-checked", String(isActive));
    });
    if (activeButton && activeButton.dataset.mode) {
      currentReproductionMode = activeButton.dataset.mode;
    }
  };

  if (modeButtons.length > 0) {
    const initialButton =
      modeButtons.find((button) => button.classList.contains("is-active")) ||
      modeButtons[0];
    setActiveModeButton(initialButton);

    modeButtons.forEach((button) => {
      button.addEventListener("click", () => {
        setActiveModeButton(button);
      });
    });
  }
}

function getCurrentReproductionMode() {
  return currentReproductionMode;
}

// Setup panel controls
function setupPanelControls(audio, card, name) {
  currentPlayingAudio = audio;
  currentPlayingCard = card;
  currentSoundName.textContent = name;
  const baseVolume = Math.round((audio._baseVolume ?? 1) * 100);
  panelVolume.value = baseVolume;
  volumeDisplay.textContent = baseVolume;
  if (audio._cardVolumeSlider) {
    audio._cardVolumeSlider.value = baseVolume;
  }
  
  updatePanelUI();

  // Update progress
  const updateProgress = () => {
    if (audio.duration) {
      const percent = (audio.currentTime / audio.duration) * 100;
      progressFill.style.width = percent + "%";
      currentTimeDisplay.textContent = formatTime(audio.currentTime);
      totalTimeDisplay.textContent = formatTime(audio.duration);
    }
  };

  audio.addEventListener("timeupdate", updateProgress);
  audio.addEventListener("loadedmetadata", updateProgress);
}

function startPanelRename() {
  if (!currentPlayingAudio || !currentPlayingCard || !currentSoundName) {
    return;
  }

  const previousName = currentSoundName.textContent;
  const input = document.createElement("input");
  input.type = "text";
  input.value = previousName;
  input.className = "rename-input";

  currentSoundName.replaceWith(input);
  input.focus();
  input.select();

  let renameFinished = false;
  const finishRename = async (shouldSave) => {
    if (renameFinished) {
      return;
    }
    renameFinished = true;

    let nextName = previousName;
    if (shouldSave) {
      const newName = input.value.trim();
      if (newName) {
        nextName = newName;
        const label = currentPlayingCard.querySelector(".sound-title");
        if (label) {
          label.textContent = newName;
        }
        await window.electronAPI.renameSound(currentPlayingAudio._filePath, newName);
      }
    }

    currentSoundName.textContent = nextName;
    input.replaceWith(currentSoundName);
  };

  input.onblur = () => finishRename(true);
  input.onkeydown = (e) => {
    if (e.key === "Enter") {
      finishRename(true);
    }
    if (e.key === "Escape") {
      finishRename(false);
    }
  };
}

if (currentSoundName) {
  currentSoundName.ondblclick = startPanelRename;
}

if (editSoundNameBtn) {
  editSoundNameBtn.addEventListener("click", startPanelRename);
}

// Panel button handlers
if (btnPlay) {
  btnPlay.onclick = () => {
    if (currentPlayingAudio) {
      if (checkStopOthers.classList.contains("checked")) {
        stopAllExcept(currentPlayingAudio, currentPlayingCard);
      }
      currentPlayingAudio.play();
      if (currentPlayingCard) {
        currentPlayingCard.classList.add("playing");
      }
      syncMuteOthers(currentPlayingAudio);
      updatePanelUI();
    }
  };
}

if (btnPause) {
  btnPause.onclick = () => {
    if (currentPlayingAudio) {
      currentPlayingAudio.pause();
      if (currentPlayingCard) {
        currentPlayingCard.classList.remove("playing");
      }
      syncMuteOthers(null);
      updatePanelUI();
    }
  };
}

if (btnStop) {
  btnStop.onclick = () => {
    if (currentPlayingAudio) {
      currentPlayingAudio.pause();
      currentPlayingAudio.currentTime = 0;
      if (currentPlayingCard) {
        currentPlayingCard.classList.remove("playing");
      }
      currentPlayingAudio = null;
      currentPlayingCard = null;
      syncMuteOthers(null);
      updatePanelUI();
    }
  };
}

if (btnForward) {
  btnForward.onclick = () => {
    if (currentPlayingAudio) {
      currentPlayingAudio.currentTime = Math.min(
        currentPlayingAudio.currentTime + 10,
        currentPlayingAudio.duration
      );
    }
  };
}

if (btnBackward) {
  btnBackward.onclick = () => {
    if (currentPlayingAudio) {
      currentPlayingAudio.currentTime = Math.max(currentPlayingAudio.currentTime - 10, 0);
    }
  };
}

// Progress bar click
progressBar.onclick = (e) => {
  if (currentPlayingAudio && currentPlayingAudio.duration) {
    const rect = progressBar.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    currentPlayingAudio.currentTime = percent * currentPlayingAudio.duration;
  }
};

// Volume control
panelVolume.oninput = () => {
  volumeDisplay.textContent = panelVolume.value;
  if (currentPlayingAudio) {
    const nextValue = panelVolume.value / 100;
    if (currentPlayingAudio._parentCard) {
      updateCardBaseVolume(currentPlayingAudio._parentCard, nextValue);
      if (currentPlayingAudio._parentCard._cardVolumeSlider) {
        currentPlayingAudio._parentCard._cardVolumeSlider.value = panelVolume.value;
      }
    } else {
      setAudioBaseVolume(currentPlayingAudio, nextValue);
    }
  }
};

// Checkbox handlers
document.querySelectorAll('.checkbox-item').forEach(item => {
  item.addEventListener('click', () => {
    const checkbox = item.querySelector('.checkbox');
    checkbox.classList.toggle('checked');

    if (checkbox === checkMuteOthers) {
      const activeAudio =
        currentPlayingAudio && !currentPlayingAudio.paused ? currentPlayingAudio : null;
      syncMuteOthers(activeAudio);
    }
  });
});

if (globalVolumeSlider) {
  globalVolumeSlider.oninput = () => {
    globalVolume = globalVolumeSlider.value / 100;
    globalVolumeDisplay.textContent = globalVolumeSlider.value;
    applyVolumeToAllAudio();
  };
}

// Context menu
function createContextMenu(options, x, y) {
  const existing = document.getElementById("context-menu");
  if (existing) existing.remove();

  const menu = document.createElement("div");
  menu.id = "context-menu";
  menu.style.position = "fixed";
  menu.style.top = y + "px";
  menu.style.left = x + "px";
  menu.style.background = "#2a2a2a";
  menu.style.border = "1px solid #555";
  menu.style.borderRadius = "5px";
  menu.style.padding = "5px 0";
  menu.style.zIndex = 1000;
  menu.style.minWidth = "140px";
  menu.style.boxShadow = "2px 2px 8px rgba(0,0,0,0.4)";

  options.forEach((opt) => {
    const item = document.createElement("div");
    item.style.padding = "6px 10px";
    item.style.cursor = "pointer";
    item.style.userSelect = "none";
    item.style.display = "flex";
    item.style.alignItems = "center";
    item.style.justifyContent = "space-between";

    if (opt.type === "slider") {
      const label = document.createElement("span");
      label.textContent = "Volume";

      const slider = document.createElement("input");
      slider.type = "range";
      slider.min = 0;
      slider.max = 100;
      slider.value = opt.value * 100;
      slider.style.flex = "1";
      slider.style.marginLeft = "10px";

      slider.oninput = (e) => {
        opt.onchange(e.target.value / 100);
      };

      item.appendChild(label);
      item.appendChild(slider);
    } else {
      item.textContent = opt.label;
      item.onclick = () => {
        opt.action();
        menu.remove();
      };
    }

    item.onmouseover = () => { item.style.background = "#3a3a3a"; };
    item.onmouseout = () => { item.style.background = "transparent"; };

    menu.appendChild(item);
  });

  document.body.appendChild(menu);
  document.addEventListener("click", () => menu.remove(), { once: true });
}

function createSoundCard(name, filePath) {
  const card = document.createElement("div");
  card.className = "sound-card sound-tile";
  card._filePath = filePath;
  ensureCardAudioState(card);

  const label = document.createElement("div");
  label.className = "sound-name sound-title";
  label.textContent = name;

  const removeBtn = document.createElement("button");
  removeBtn.className = "remove-btn";
  removeBtn.textContent = "x";

  const volume = document.createElement("input");
  volume.type = "range";
  volume.min = 0;
  volume.max = 100;
  volume.value = 100;
  volume.className = "volume-slider";
  card._cardVolumeSlider = volume;

  const audio = new Audio(filePath);
  audio._baseVolume = 1;
  audio._isMutedByOption = false;
  audio._filePath = filePath;
  audio._parentCard = card;
  audio._isEphemeral = false;
  audio._cardVolumeSlider = volume;
  applyAudioVolume(audio);
  allAudio.push(audio);
  card._audioInstances.add(audio);
  card._primaryAudio = audio;

  const imageWrapper = document.createElement("div");
  imageWrapper.className = "sound-image-wrapper";

  const imageIcon = document.createElement("div");
  imageIcon.className = "sound-image";
  imageIcon.textContent = "PLAY";
  imageWrapper.appendChild(imageIcon);

  const registerAudioEnded = (targetAudio) => {
    targetAudio.addEventListener("ended", () => {
      if (checkLoop.classList.contains("checked") && currentPlayingAudio === targetAudio) {
        targetAudio.currentTime = 0;
        targetAudio.play();
        syncMuteOthers(targetAudio);
        return;
      }

      unmarkCardPlaying(card, targetAudio);
      if (currentPlayingAudio === targetAudio) {
        currentPlayingAudio = null;
        currentPlayingCard = null;
        updatePanelUI();
      }
      syncMuteOthers(null);
      cleanupEphemeralAudio(targetAudio);
    });
  };

  registerAudioEnded(audio);

  const createEphemeralAudio = () => {
    const instance = new Audio(filePath);
    instance._baseVolume = audio._baseVolume ?? 1;
    instance._isMutedByOption = false;
    instance._filePath = filePath;
    instance._parentCard = card;
    instance._isEphemeral = true;
    instance._cardVolumeSlider = volume;
    applyAudioVolume(instance);
    allAudio.push(instance);
    card._audioInstances.add(instance);
    registerAudioEnded(instance);
    return instance;
  };

  const startPlayback = (targetAudio, options = {}) => {
    if (!targetAudio) {
      return;
    }

    if (checkStopOthers.classList.contains("checked")) {
      stopAllExcept(targetAudio, card);
    }

    if (options.restart) {
      targetAudio.currentTime = 0;
    }

    targetAudio.play();
    markCardPlaying(card, targetAudio);
    setupPanelControls(targetAudio, card, label.textContent);
    syncMuteOthers(targetAudio);
  };

  const pausePlayback = (targetAudio, options = {}) => {
    if (!targetAudio) {
      return;
    }

    targetAudio.pause();
    if (options.reset) {
      targetAudio.currentTime = 0;
    }
    unmarkCardPlaying(card, targetAudio);

    if (options.clearCurrent && currentPlayingAudio === targetAudio) {
      currentPlayingAudio = null;
      currentPlayingCard = null;
    }

    syncMuteOthers(null);
    updatePanelUI();
    cleanupEphemeralAudio(targetAudio);
  };

  const handlePlayOverlap = () => {
    const instance = createEphemeralAudio();
    if (!instance) {
      return;
    }

    startPlayback(instance, { restart: true });
  };

  const handlePlayPause = () => {
    if (!audio.paused) {
      pausePlayback(audio, { reset: false, clearCurrent: false });
      return;
    }

    const shouldRestart =
      audio.ended || (audio.duration && audio.currentTime >= audio.duration);
    startPlayback(audio, { restart: shouldRestart });
  };

  const handlePlayStop = () => {
    if (!audio.paused) {
      pausePlayback(audio, { reset: true, clearCurrent: true });
      return;
    }

    startPlayback(audio, { restart: true });
  };

  const handlePlayRestart = () => {
    startPlayback(audio, { restart: true });
  };

  const handleModeTrigger = () => {
    const mode = getCurrentReproductionMode();
    if (mode === "push-loop") {
      return;
    }

    switch (mode) {
      case "play-overlap":
        handlePlayOverlap();
        break;
      case "play-pause":
        handlePlayPause();
        break;
      case "play-stop":
        handlePlayStop();
        break;
      case "play-restart":
        handlePlayRestart();
        break;
      default:
        handlePlayStop();
        break;
    }
  };

  let pushLoopActive = false;

  const startPushLoop = () => {
    if (pushLoopActive) {
      return;
    }
    pushLoopActive = true;

    if (checkStopOthers.classList.contains("checked")) {
      stopAllExcept(audio, card);
    }

    audio._previousLoop = audio.loop;
    audio.loop = true;
    audio.currentTime = 0;
    audio.play();
    markCardPlaying(card, audio);
    setupPanelControls(audio, card, label.textContent);
    syncMuteOthers(audio);
  };

  const stopPushLoop = () => {
    if (!pushLoopActive) {
      return;
    }
    pushLoopActive = false;

    audio.loop = audio._previousLoop ?? false;
    audio.pause();
    audio.currentTime = 0;
    unmarkCardPlaying(card, audio);
    if (currentPlayingAudio === audio) {
      currentPlayingAudio = null;
      currentPlayingCard = null;
    }
    syncMuteOthers(null);
    updatePanelUI();
  };

  imageWrapper.addEventListener("click", () => {
    if (getCurrentReproductionMode() === "push-loop") {
      return;
    }
    handleModeTrigger();
  });

  imageWrapper.addEventListener("pointerdown", (event) => {
    if (getCurrentReproductionMode() !== "push-loop") {
      return;
    }
    event.preventDefault();
    if (imageWrapper.setPointerCapture) {
      imageWrapper.setPointerCapture(event.pointerId);
    }
    startPushLoop();
  });

  imageWrapper.addEventListener("pointerup", (event) => {
    if (getCurrentReproductionMode() !== "push-loop") {
      return;
    }
    stopPushLoop();
    if (imageWrapper.hasPointerCapture && imageWrapper.hasPointerCapture(event.pointerId)) {
      imageWrapper.releasePointerCapture(event.pointerId);
    }
  });

  imageWrapper.addEventListener("pointercancel", (event) => {
    if (getCurrentReproductionMode() !== "push-loop") {
      return;
    }
    stopPushLoop();
    if (imageWrapper.hasPointerCapture && imageWrapper.hasPointerCapture(event.pointerId)) {
      imageWrapper.releasePointerCapture(event.pointerId);
    }
  });

  volume.oninput = (e) => {
    const nextValue = e.target.value / 100;
    updateCardBaseVolume(card, nextValue);
    if (currentPlayingAudio && currentPlayingAudio._parentCard === card) {
      panelVolume.value = e.target.value;
      volumeDisplay.textContent = e.target.value;
    }
  };

  const removeCard = async () => {
    if (card._audioInstances) {
      card._audioInstances.forEach((instance) => {
        instance.pause();
        instance.currentTime = 0;
        unregisterAudio(instance);
      });
      card._audioInstances.clear();
    }

    unmarkCardPlaying(card);
    if (currentPlayingAudio && currentPlayingAudio._parentCard === card) {
      currentPlayingAudio = null;
      currentPlayingCard = null;
      syncMuteOthers(null);
      updatePanelUI();
    }

    await window.electronAPI.removeSound(filePath);
    card.remove();
  };

  removeBtn.onclick = async (e) => {
    e.stopPropagation();
    await removeCard();
  };

  label.ondblclick = (e) => {
    e.stopPropagation();
    startRename();
  };

  function startRename() {
    const input = document.createElement("input");
    input.type = "text";
    input.value = label.textContent;
    input.className = "rename-input";

    card.replaceChild(input, label);
    input.focus();
    input.select();

    const save = async () => {
      const newName = input.value.trim();
      if (newName) {
        label.textContent = newName;
        await window.electronAPI.renameSound(filePath, newName);
        if (currentPlayingAudio && currentPlayingAudio._parentCard === card) {
          currentSoundName.textContent = newName;
        }
      }
      card.replaceChild(label, input);
    };

    input.onblur = save;
    input.onkeydown = (e) => {
      if (e.key === "Enter") save();
      if (e.key === "Escape") card.replaceChild(label, input);
    };
  }

  card.oncontextmenu = (e) => {
    e.preventDefault();
    createContextMenu(
      [
        { label: "Rename", action: () => { startRename(); } },
        {
          label: "Remove",
          action: async () => {
            await removeCard();
          }
        },
        {
          type: "slider",
          value: audio._baseVolume ?? 1,
          onchange: (v) => {
            updateCardBaseVolume(card, v);
            if (currentPlayingAudio && currentPlayingAudio._parentCard === card) {
              panelVolume.value = v * 100;
              volumeDisplay.textContent = Math.round(v * 100);
            }
          }
        }
      ],
      e.clientX,
      e.clientY
    );
  };

  const controls = document.createElement("div");
  controls.className = "sound-controls";
  controls.appendChild(volume);

  card.appendChild(removeBtn);
  card.appendChild(imageWrapper);
  card.appendChild(label);
  card.appendChild(controls);
  soundboard.appendChild(card);
}

window.electronAPI.loadSounds().then((sounds) => {
  sounds.forEach((sound) => {
    createSoundCard(sound.name, sound.filePath);
  });
});

addSoundBtn.onclick = async () => {
  const sounds = await window.electronAPI.addSound();
  if (Array.isArray(sounds)) {
    sounds.forEach((sound) => {
      if (sound) {
        createSoundCard(sound.name, sound.filePath);
      }
    });
  }
};
