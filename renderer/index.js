const soundboard = document.getElementById("soundboard");
const addSoundBtn = document.getElementById("addSound");
const allAudio = []; // keep track of all Audio objects
let globalVolume = 1; // 0.0 - 1.0
let isMuted = false;

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
    if (!isPlaying) {
      audio.currentTime = 0;
      audio.play();
      isPlaying = true;
      card.classList.add("playing");
    } else {
      audio.pause();
      audio.currentTime = 0;
      isPlaying = false;
      card.classList.remove("playing");
    }
  });

  audio.addEventListener("ended", () => {
    isPlaying = false;
    card.classList.remove("playing");
  });

  const volume = document.createElement("input");
  volume.type = "range";
  volume.min = 0;
  volume.max = 100;
  volume.value = 100;
  volume.className = "volume-slider";
  volume.oninput = (e) => {
    audio.volume = e.target.value / 100;
  };

  removeBtn.onclick = async (e) => {
    e.stopPropagation();
    audio.pause();
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
            await window.electronAPI.removeSound(filePath);
            card.remove();
          }
        },
        {
          type: "slider",
          value: audio.volume,
          onchange: (v) => { audio.volume = v; }
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

const globalSlider = document.getElementById("globalVolume");
const muteBtn = document.getElementById("muteBtn");

globalSlider.oninput = () => {
  globalVolume = globalSlider.value / 100;
  updateAllVolumes();
};

muteBtn.onclick = () => {
  isMuted = !isMuted;
  muteBtn.textContent = isMuted ? "Unmute" : "Mute";
  updateAllVolumes();
};

function updateAllVolumes() {
  allAudio.forEach((audio) => {
    audio.volume = (isMuted ? 0 : globalVolume) * 1;
  });
}
