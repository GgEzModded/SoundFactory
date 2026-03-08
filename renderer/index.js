const soundboard = document.getElementById("soundboard");
const addSoundBtn = document.getElementById("addSound");
const topPanelTitle = document.getElementById("top-panel-title");
const titlebarTitle = document.querySelector(".titlebar-title");
const minimizeWindowBtn = document.getElementById("window-minimize");
const maximizeWindowBtn = document.getElementById("window-maximize");
const closeWindowBtn = document.getElementById("window-close");
const allAudio = [];
const soundHotkeyMap = new Map();
let currentPlayingAudio = null;
let currentPlayingCard = null;
let globalVolume = 1;
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

  if (titlebarTitle) {
    titlebarTitle.textContent = normalizedTitle;
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

function isTypingTarget(target) {
  if (!target) {
    return false;
  }
  const tagName = target.tagName;
  return (
    target.isContentEditable ||
    tagName === "INPUT" ||
    tagName === "TEXTAREA" ||
    tagName === "SELECT"
  );
}

function normalizeHotkeyCombination(rawValue) {
  if (typeof rawValue !== "string") {
    return "";
  }

  const parts = rawValue
    .split("+")
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length === 0) {
    return "";
  }

  const modifiers = [];
  let keyPart = "";

  parts.forEach((part) => {
    const normalized = part.toLowerCase();
    if (normalized === "ctrl" || normalized === "control") {
      if (!modifiers.includes("Ctrl")) modifiers.push("Ctrl");
      return;
    }
    if (normalized === "alt" || normalized === "option") {
      if (!modifiers.includes("Alt")) modifiers.push("Alt");
      return;
    }
    if (normalized === "shift") {
      if (!modifiers.includes("Shift")) modifiers.push("Shift");
      return;
    }
    if (
      normalized === "meta" ||
      normalized === "cmd" ||
      normalized === "command" ||
      normalized === "win"
    ) {
      if (!modifiers.includes("Meta")) modifiers.push("Meta");
      return;
    }
    keyPart = part;
  });

  const normalizedKey = keyPart
    ? keyPart.length === 1
      ? keyPart.toUpperCase()
      : keyPart.charAt(0).toUpperCase() + keyPart.slice(1)
    : "";

  if (!normalizedKey) {
    return "";
  }

  const orderedModifiers = ["Ctrl", "Alt", "Shift", "Meta"].filter((mod) =>
    modifiers.includes(mod)
  );

  return [...orderedModifiers, normalizedKey].join("+");
}

function combinationFromKeyboardEvent(event) {
  const key = event.key;
  if (!key) {
    return "";
  }

  const lower = key.toLowerCase();
  if (["control", "shift", "alt", "meta"].includes(lower)) {
    return "";
  }

  const modifiers = [];
  if (event.ctrlKey) modifiers.push("Ctrl");
  if (event.altKey) modifiers.push("Alt");
  if (event.shiftKey) modifiers.push("Shift");
  if (event.metaKey) modifiers.push("Meta");

  let keyPart = "";
  if (key === " ") {
    keyPart = "Space";
  } else if (key.length === 1) {
    keyPart = key.toUpperCase();
  } else {
    keyPart = key.charAt(0).toUpperCase() + key.slice(1);
  }

  return [...modifiers, keyPart].join("+");
}

function hotkeyDisplayLabel(hotkey) {
  return hotkey ? hotkey : "Add combination";
}

function rebuildHotkeyMap() {
  soundHotkeyMap.clear();

  document.querySelectorAll(".sound-card").forEach((card) => {
    const hotkey = normalizeHotkeyCombination(card.dataset.hotkey || "");
    if (!hotkey || soundHotkeyMap.has(hotkey)) {
      return;
    }
    soundHotkeyMap.set(hotkey, card);
  });
}

function isHotkeyTakenByOtherCard(hotkey, currentCard) {
  return Array.from(document.querySelectorAll(".sound-card")).some((card) => {
    if (card === currentCard) {
      return false;
    }
    return normalizeHotkeyCombination(card.dataset.hotkey || "") === hotkey;
  });
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
  allAudio.forEach((audio) => {
    if (audio !== audioToKeep) {
      audio.pause();
      audio.currentTime = 0;
    }
  });

  document.querySelectorAll(".sound-card").forEach((card) => {
    if (card !== cardToKeep) {
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

// Update panel UI
function updatePanelUI() {
  if (!currentPlayingAudio) {
    audioPanel.classList.add("hidden");
    currentSoundName.textContent = "No Sound Playing";
    btnPlay.classList.remove("hidden");
    btnPause.classList.add("hidden");
    progressFill.style.width = "0%";
    currentTimeDisplay.textContent = "0:00";
    totalTimeDisplay.textContent = "0:00";
    return;
  }

  audioPanel.classList.remove("hidden");
  
  if (currentPlayingAudio.paused) {
    btnPlay.classList.remove("hidden");
    btnPause.classList.add("hidden");
  } else {
    btnPlay.classList.add("hidden");
    btnPause.classList.remove("hidden");
  }
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

btnForward.onclick = () => {
  if (currentPlayingAudio) {
    currentPlayingAudio.currentTime = Math.min(
      currentPlayingAudio.currentTime + 10,
      currentPlayingAudio.duration
    );
  }
};

btnBackward.onclick = () => {
  if (currentPlayingAudio) {
    currentPlayingAudio.currentTime = Math.max(currentPlayingAudio.currentTime - 10, 0);
  }
};

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
    setAudioBaseVolume(currentPlayingAudio, panelVolume.value / 100);
    if (currentPlayingAudio._cardVolumeSlider) {
      currentPlayingAudio._cardVolumeSlider.value = panelVolume.value;
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

function createSoundCard(sound) {
  const name = typeof sound?.name === "string" ? sound.name : "Untitled";
  const filePath = typeof sound?.filePath === "string" ? sound.filePath : "";
  const initialHotkey = normalizeHotkeyCombination(sound?.hotkey || "");
  if (!filePath) {
    return;
  }

  const card = document.createElement("div");
  card.className = "sound-card sound-tile";
  card.dataset.hotkey = initialHotkey;

  const label = document.createElement("div");
  label.className = "sound-name sound-title";
  label.textContent = name;

  const hotkeyBadge = document.createElement("div");
  hotkeyBadge.className = "sound-hotkey";
  hotkeyBadge.textContent = hotkeyDisplayLabel(initialHotkey);
  hotkeyBadge.classList.toggle("empty", !initialHotkey);

  const removeBtn = document.createElement("button");
  removeBtn.className = "remove-btn";
  removeBtn.textContent = "x";

  const audio = new Audio(filePath);
  audio._baseVolume = 1;
  audio._isMutedByOption = false;
  audio._filePath = filePath;
  applyAudioVolume(audio);
  allAudio.push(audio);

  const imageWrapper = document.createElement("div");
  imageWrapper.className = "sound-image-wrapper";

  const imageIcon = document.createElement("div");
  imageIcon.className = "sound-image";
  imageIcon.textContent = "PLAY";
  imageWrapper.appendChild(imageIcon);

  imageWrapper.addEventListener("click", () => {
    const wasPlaying = !audio.paused;

    if (!wasPlaying) {
      if (checkStopOthers.classList.contains("checked")) {
        stopAllExcept(audio, card);
      }
      audio.currentTime = 0;
      audio.play();
      card.classList.add("playing");
      setupPanelControls(audio, card, label.textContent);
      syncMuteOthers(audio);
    } else {
      audio.pause();
      audio.currentTime = 0;
      card.classList.remove("playing");
      if (currentPlayingAudio === audio) {
        currentPlayingAudio = null;
        currentPlayingCard = null;
        updatePanelUI();
      }
      syncMuteOthers(null);
    }
  });

  audio.addEventListener("ended", () => {
    if (checkLoop.classList.contains("checked") && currentPlayingAudio === audio) {
      audio.currentTime = 0;
      audio.play();
      syncMuteOthers(audio);
    } else {
      card.classList.remove("playing");
      if (currentPlayingAudio === audio) {
        currentPlayingAudio = null;
        currentPlayingCard = null;
        updatePanelUI();
      }
      syncMuteOthers(null);
    }
  });

  const volume = document.createElement("input");
  volume.type = "range";
  volume.min = 0;
  volume.max = 100;
  volume.value = 100;
  volume.className = "volume-slider";
  audio._cardVolumeSlider = volume;
  volume.oninput = (e) => {
    setAudioBaseVolume(audio, e.target.value / 100);
    if (currentPlayingAudio === audio) {
      panelVolume.value = e.target.value;
      volumeDisplay.textContent = e.target.value;
    }
  };

  removeBtn.onclick = async (e) => {
    e.stopPropagation();
    audio.pause();
    unregisterAudio(audio);
    if (currentPlayingAudio === audio) {
      currentPlayingAudio = null;
      currentPlayingCard = null;
      syncMuteOthers(null);
      updatePanelUI();
    }
    await window.electronAPI.removeSound(filePath);
    card.remove();
    rebuildHotkeyMap();
  };

  label.ondblclick = (e) => {
    e.stopPropagation();
    startRename();
  };

  async function persistHotkey(hotkey) {
    card.dataset.hotkey = hotkey;
    hotkeyBadge.textContent = hotkeyDisplayLabel(hotkey);
    hotkeyBadge.classList.toggle("empty", !hotkey);
    rebuildHotkeyMap();

    if (window.electronAPI && window.electronAPI.saveSoundHotkey) {
      await window.electronAPI.saveSoundHotkey(filePath, hotkey);
    }
  }

  function startHotkeyEdit() {
    const previousHotkey = normalizeHotkeyCombination(card.dataset.hotkey || "");
    const input = document.createElement("input");
    input.type = "text";
    input.value = previousHotkey;
    input.placeholder = "Add combination";
    input.className = "hotkey-input";

    card.replaceChild(input, hotkeyBadge);
    input.focus();
    input.select();

    let editFinished = false;
    const finishEdit = async (shouldSave) => {
      if (editFinished) {
        return;
      }

      if (shouldSave) {
        const normalizedHotkey = normalizeHotkeyCombination(input.value);
        if (normalizedHotkey && isHotkeyTakenByOtherCard(normalizedHotkey, card)) {
          window.alert("This combination is already assigned to another sound.");
          input.focus();
          input.select();
          return;
        }

        await persistHotkey(normalizedHotkey);
      }

      editFinished = true;
      card.replaceChild(hotkeyBadge, input);
      hotkeyBadge.textContent = hotkeyDisplayLabel(card.dataset.hotkey || "");
      hotkeyBadge.classList.toggle("empty", !card.dataset.hotkey);
    };

    input.onblur = () => finishEdit(false);
    input.onkeydown = (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        finishEdit(true);
        return;
      }

      if (e.key === "Escape") {
        e.preventDefault();
        finishEdit(false);
        return;
      }

      if (e.key === "Backspace" || e.key === "Delete") {
        return;
      }

      const capturedCombination = combinationFromKeyboardEvent(e);
      if (capturedCombination) {
        e.preventDefault();
        input.value = capturedCombination;
      }
    };
  }

  hotkeyBadge.ondblclick = (e) => {
    e.stopPropagation();
    startHotkeyEdit();
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
        if (currentPlayingAudio === audio) {
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
        { label: "Add/Edit key combination", action: () => { startHotkeyEdit(); } },
        {
          label: "Remove",
          action: async () => {
            audio.pause();
            unregisterAudio(audio);
            if (currentPlayingAudio === audio) {
              currentPlayingAudio = null;
              currentPlayingCard = null;
              syncMuteOthers(null);
              updatePanelUI();
            }
            await window.electronAPI.removeSound(filePath);
            card.remove();
            rebuildHotkeyMap();
          }
        },
        {
          type: "slider",
          value: audio._baseVolume ?? 1,
          onchange: (v) => {
            setAudioBaseVolume(audio, v);
            if (currentPlayingAudio === audio) {
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
  card.appendChild(hotkeyBadge);
  card.appendChild(controls);
  soundboard.appendChild(card);

  rebuildHotkeyMap();
}

window.electronAPI.loadSounds().then((sounds) => {
  sounds.forEach((sound) => {
    createSoundCard(sound);
  });
});

addSoundBtn.onclick = async () => {
  const sounds = await window.electronAPI.addSound();
  if (Array.isArray(sounds)) {
    sounds.forEach((sound) => {
      if (sound) {
        createSoundCard(sound);
      }
    });
  }
};

document.addEventListener("keydown", (event) => {
  if (event.defaultPrevented || event.repeat) {
    return;
  }

  if (isTypingTarget(event.target)) {
    return;
  }

  const currentCombination = normalizeHotkeyCombination(combinationFromKeyboardEvent(event));
  if (!currentCombination) {
    return;
  }

  const targetCard = soundHotkeyMap.get(currentCombination);
  if (!targetCard) {
    return;
  }

  event.preventDefault();
  const soundImageWrapper = targetCard.querySelector(".sound-image-wrapper");
  if (soundImageWrapper) {
    soundImageWrapper.click();
  }
});
