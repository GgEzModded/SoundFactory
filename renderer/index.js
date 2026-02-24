const soundboard = document.getElementById("soundboard");
const addSoundBtn = document.getElementById("addSound");
const minimizeWindowBtn = document.getElementById("window-minimize");
const maximizeWindowBtn = document.getElementById("window-maximize");
const closeWindowBtn = document.getElementById("window-close");
const allAudio = [];
let currentPlayingAudio = null;
let currentPlayingCard = null;

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
  panelVolume.value = audio.volume * 100;
  volumeDisplay.textContent = Math.round(audio.volume * 100);
  
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

// Panel button handlers
btnPlay.onclick = () => {
  if (currentPlayingAudio) {
    currentPlayingAudio.play();
    updatePanelUI();
  }
};

btnPause.onclick = () => {
  if (currentPlayingAudio) {
    currentPlayingAudio.pause();
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
  const volume = panelVolume.value / 100;
  volumeDisplay.textContent = panelVolume.value;
  if (currentPlayingAudio) {
    currentPlayingAudio.volume = volume;
  }
};

// Checkbox handlers
document.querySelectorAll('.checkbox-item').forEach(item => {
  item.addEventListener('click', () => {
    const checkbox = item.querySelector('.checkbox');
    checkbox.classList.toggle('checked');
  });
});

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

  const label = document.createElement("div");
  label.className = "sound-name sound-title";
  label.textContent = name;

  const removeBtn = document.createElement("button");
  removeBtn.className = "remove-btn";
  removeBtn.textContent = "x";

  const audio = new Audio(filePath);
  audio.volume = 1.0;
  allAudio.push(audio);

  const imageWrapper = document.createElement("div");
  imageWrapper.className = "sound-image-wrapper";

  const imageIcon = document.createElement("div");
  imageIcon.className = "sound-image";
  imageIcon.textContent = "PLAY";
  imageWrapper.appendChild(imageIcon);

  let isPlaying = false;
  
  imageWrapper.addEventListener("click", () => {
    // Stop other sounds if checkbox is checked
    if (checkStopOthers.classList.contains("checked")) {
      allAudio.forEach(a => {
        if (a !== audio) {
          a.pause();
          a.currentTime = 0;
        }
      });
      document.querySelectorAll(".sound-card").forEach(c => {
        if (c !== card) c.classList.remove("playing");
      });
    }

    // Mute other sounds if checkbox is checked
    if (checkMuteOthers.classList.contains("checked")) {
      allAudio.forEach(a => {
        if (a !== audio) {
          a.volume = 0;
        } else {
          a.volume = panelVolume.value / 100;
        }
      });
    }

    if (!isPlaying) {
      audio.currentTime = 0;
      audio.play();
      isPlaying = true;
      card.classList.add("playing");
      setupPanelControls(audio, card, name);
    } else {
      audio.pause();
      audio.currentTime = 0;
      isPlaying = false;
      card.classList.remove("playing");
      if (currentPlayingAudio === audio) {
        currentPlayingAudio = null;
        currentPlayingCard = null;
        updatePanelUI();
      }
    }
  });

  audio.addEventListener("ended", () => {
    if (checkLoop.classList.contains("checked") && currentPlayingAudio === audio) {
      audio.currentTime = 0;
      audio.play();
    } else {
      isPlaying = false;
      card.classList.remove("playing");
      if (currentPlayingAudio === audio) {
        currentPlayingAudio = null;
        currentPlayingCard = null;
        updatePanelUI();
      }
    }
  });

  const volume = document.createElement("input");
  volume.type = "range";
  volume.min = 0;
  volume.max = 100;
  volume.value = 100;
  volume.className = "volume-slider";
  volume.oninput = (e) => {
    audio.volume = e.target.value / 100;
    if (currentPlayingAudio === audio) {
      panelVolume.value = e.target.value;
      volumeDisplay.textContent = e.target.value;
    }
  };

  removeBtn.onclick = async (e) => {
    e.stopPropagation();
    audio.pause();
    if (currentPlayingAudio === audio) {
      currentPlayingAudio = null;
      currentPlayingCard = null;
      updatePanelUI();
    }
    await window.electronAPI.removeSound(filePath);
    card.remove();
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
        {
          label: "Remove",
          action: async () => {
            audio.pause();
            if (currentPlayingAudio === audio) {
              currentPlayingAudio = null;
              currentPlayingCard = null;
              updatePanelUI();
            }
            await window.electronAPI.removeSound(filePath);
            card.remove();
          }
        },
        {
          type: "slider",
          value: audio.volume,
          onchange: (v) => {
            audio.volume = v;
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
  card.appendChild(controls);
  soundboard.appendChild(card);
}

window.electronAPI.loadSounds().then((sounds) => {
  sounds.forEach((sound) => {
    createSoundCard(sound.name, sound.filePath);
  });
});

addSoundBtn.onclick = async () => {
  const sound = await window.electronAPI.addSound();
  if (sound) {
    createSoundCard(sound.name, sound.filePath);
  }
};
