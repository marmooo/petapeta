import {
  Alert,
  Modal,
} from "https://cdn.jsdelivr.net/npm/bootstrap@5.3.8/+esm";

function toggleDarkMode() {
  const html = document.documentElement;
  const newTheme = html.getAttribute("data-bs-theme") === "dark"
    ? "light"
    : "dark";
  html.setAttribute("data-bs-theme", newTheme);
  localStorage.setItem("darkMode", newTheme);
}

class Sortable {
  static defaultOptions = {
    offset: 10,
    onStart: null,
    onDrop: null,
    onEnd: null,
  };

  constructor(container, options = {}) {
    this.container = container;
    this.options = { ...Sortable.defaultOptions, ...options };
    this.draggedElement = null;
    this.init();
  }

  init() {
    for (const child of this.container.children) {
      child.setAttribute("draggable", "true");
    }
    this.container.addEventListener("dragstart", this.onDragStart);
    this.container.addEventListener("dragover", this.onDragOver);
    this.container.addEventListener("drop", this.onDrop);
    this.container.addEventListener("dragend", this.onDragEnd);
  }

  onDragStart = (event) => {
    if (event.target && event.target.parentNode === this.container) {
      this.draggedElement = event.target;
      if (this.options.offset && this.isInBorder(event)) {
        event.preventDefault();
        return;
      }
      event.dataTransfer.effectAllowed = "move";
      event.target.classList.add("dragging");
      if (this.options.onStart) {
        this.options.onStart(event, this.draggedElement);
      }
    }
  };

  onDragOver = (event) => {
    event.preventDefault();
    const target = this.getValidTarget(event.target);
    if (target && target !== this.draggedElement) {
      target.classList.add("over");
    }
  };

  onDrop = (event) => {
    event.preventDefault();
    const target = this.getValidTarget(event.target);
    if (target && target !== this.draggedElement) {
      this.swapElements(this.draggedElement, target);
      if (this.options.onDrop) {
        this.options.onDrop(event, this.draggedElement, target);
      }
    }
    for (const child of this.container.children) {
      child.classList.remove("over");
    }
  };

  onDragEnd = (event) => {
    if (this.draggedElement) {
      this.draggedElement.classList.remove("dragging");
      this.draggedElement = null;
      if (this.options.onEnd) {
        this.options.onEnd(event);
      }
    }
  };

  isInBorder(event) {
    const { offset } = this.options;
    const rect = this.draggedElement.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    if (x <= offset) return true;
    if (y <= offset) return true;
    if (rect.width - x <= offset) return true;
    if (rect.height - y <= offset) return true;
    return false;
  }

  swapElements(dragged, target) {
    const draggedSibling = dragged.nextSibling === target
      ? dragged
      : dragged.nextSibling;
    this.container.insertBefore(dragged, target.nextSibling);
    this.container.insertBefore(target, draggedSibling);
  }

  getValidTarget(target) {
    while (target && target !== this.container) {
      if (target.parentNode === this.container) {
        return target;
      }
      target = target.parentNode;
    }
    return null;
  }

  destroy() {
    this.container.removeEventListener("dragstart", this.onDragStart);
    this.container.removeEventListener("dragover", this.onDragOver);
    this.container.removeEventListener("drop", this.onDrop);
    this.container.removeEventListener("dragend", this.onDragEnd);
    for (const child of this.container.children) {
      child.removeAttribute("draggable");
    }
  }
}

class Resizable {
  static defaultOptions = {
    offset: 10,
    minSize: 100,
    container: null,
  };

  element;
  direction;
  isResizine = false;
  startX;
  startY;
  startWidth;
  startHeight;
  startTop;
  startLeft;

  constructor(element, options = {}) {
    this.element = element;
    this.options = { ...Resizable.defaultOptions, ...options };
    element.classList.add("resizable");
    this.element.addEventListener("pointermove", this.updateCursor);
    this.element.addEventListener("pointerdown", this.startResize);
    document.addEventListener("pointermove", this.resize);
    document.addEventListener("pointerup", this.stopResize);
  }

  destroy() {
    this.element.removeEventListener("pointermove", this.updateCursor);
    this.element.removeEventListener("pointerdown", this.startResize);
    document.removeEventListener("pointermove", this.resize);
    document.removeEventListener("pointerup", this.stopResize);
    this.element.classList.remove("n", "s", "e", "w", "ne", "nw", "se", "sw");
    this.element.style.cursor = "initial";
  }

  updateCursor = (event) => {
    if (this.isResizing) return;
    const { offset } = this.options;
    const rect = this.element.getBoundingClientRect();
    let { left, top, right, bottom } = rect;
    left += offset;
    top += offset;
    right -= offset;
    bottom -= offset;
    const { clientX: x, clientY: y } = event;
    const style = this.element.style;
    if (y < top && x > right) style.cursor = "nesw-resize";
    else if (y < top && x < left) style.cursor = "nwse-resize";
    else if (y > bottom && x > right) style.cursor = "nwse-resize";
    else if (y > bottom && x < left) style.cursor = "nesw-resize";
    else if (y < top) style.cursor = "n-resize";
    else if (y > bottom) style.cursor = "s-resize";
    else if (x > right) style.cursor = "e-resize";
    else if (x < left) style.cursor = "w-resize";
    else style.cursor = "initial";
  };

  startResize = (event) => {
    const { offset } = this.options;
    const rect = this.element.getBoundingClientRect();
    let { left, top, right, bottom } = rect;
    left += offset;
    top += offset;
    right -= offset;
    bottom -= offset;
    const { clientX: x, clientY: y } = event;
    if (y < top && x > right) this.direction = "ne";
    else if (y < top && x < left) this.direction = "nw";
    else if (y > bottom && x > right) this.direction = "se";
    else if (y > bottom && x < left) this.direction = "sw";
    else if (y < top) this.direction = "n";
    else if (y > bottom) this.direction = "s";
    else if (x > right) this.direction = "e";
    else if (x < left) this.direction = "w";
    if (this.direction) {
      this.isResizing = true;
      this.startX = x;
      this.startY = y;
      this.startWidth = rect.width;
      this.startHeight = rect.height;
      this.startTop = rect.top;
      this.startLeft = rect.left;
      this.element.dispatchEvent(new CustomEvent("resizeStart"));
    }
  };

  resize = (event) => {
    if (!this.isResizing) return;
    if (!event.buttons) {
      this.stopResize();
      return;
    }
    this.element.style.overflow = "hidden";
    const { minSize, container } = this.options;
    const dx = event.clientX - this.startX;
    const dy = event.clientY - this.startY;
    const style = this.element.style;
    if (this.direction.includes("e")) {
      style.width = `${Math.max(minSize, this.startWidth + dx)}px`;
    }
    if (this.direction.includes("s")) {
      style.height = `${Math.max(minSize, this.startHeight + dy)}px`;
    }
    if (this.direction.includes("w")) {
      style.width = `${Math.max(minSize, this.startWidth - dx)}px`;
      if (container) container.style.left = `${this.startLeft + dx}px`;
    }
    if (this.direction.includes("n")) {
      style.height = `${Math.max(minSize, this.startHeight - dy)}px`;
      if (container) container.style.top = `${this.startTop + dy}px`;
    }
  };

  stopResize = () => {
    this.element.style.overflow = "auto";
    if (!this.isResizing) return;
    this.isResizing = false;
    this.direction = null;
    this.element.dispatchEvent(new CustomEvent("resizeEnd"));
  };
}

class Draggable {
  static defaultOptions = {
    offset: 10,
  };
  static draggableElements = new Set();
  static highestZIndex = 1;

  element;
  options = {};
  isDragging = false;
  startX;
  startY;
  initialLeft;
  initialTop;

  constructor(element, options = {}) {
    this.element = element;
    this.options = { ...Draggable.defaultOptions, ...options };
    Draggable.draggableElements.add(this.element);
    this.init();
  }

  init() {
    this.element.style.position = "absolute";
    this.element.style.cursor = "grab";
    this.element.addEventListener("pointerdown", this.onPointerDown);
    this.element.addEventListener("pointermove", this.onPointerMove);
    this.element.addEventListener("pointerup", this.onPointerUp);
    if (!this.element.style.zIndex) {
      Draggable.highestZIndex += 1;
      this.element.style.zIndex = Draggable.highestZIndex;
    }
  }

  isInBorder(event) {
    const { offset } = this.options;
    const rect = this.element.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    if (x <= offset) return true;
    if (y <= offset) return true;
    if (rect.width - x <= offset) return true;
    if (rect.height - y <= offset) return true;
    return false;
  }

  onPointerDown = (event) => {
    if (event.buttons > 0) {
      if (this.options.offset && this.isInBorder(event)) return;
      this.isDragging = true;
      this.startX = event.clientX;
      this.startY = event.clientY;
      this.initialLeft = this.element.offsetLeft;
      this.initialTop = this.element.offsetTop;
      this.element.setPointerCapture(event.pointerId);
      this.element.style.cursor = "grabbing";
      Draggable.highestZIndex += 1;
      this.element.style.zIndex = Draggable.highestZIndex;
    }
  };

  onPointerMove = (event) => {
    if (this.isDragging) {
      const deltaX = event.clientX - this.startX;
      const deltaY = event.clientY - this.startY;
      this.element.style.left = this.initialLeft + deltaX + "px";
      this.element.style.top = this.initialTop + deltaY + "px";
    }
  };

  onPointerUp = (event) => {
    if (this.isDragging) {
      this.isDragging = false;
      this.element.releasePointerCapture(event.pointerId);
      this.element.style.cursor = "grab";
    }
  };

  destroy() {
    this.element.removeEventListener("pointerdown", this.onPointerDown);
    this.element.removeEventListener("pointermove", this.onPointerMove);
    this.element.removeEventListener("pointerup", this.onPointerUp);
    Draggable.draggableElements.delete(this.element);
    this.element.style = "";
  }
}

function resizeAll(event) {
  const { offsetWidth, offsetHeight } = event.currentTarget;
  for (const div of dragPanel.children) {
    const media = div.firstElementChild;
    const style = media.style;
    style.width = `${offsetWidth}px`;
    style.height = `${offsetHeight}px`;
  }
}

function getMode() {
  const id = ["freeOn", "dashboardOn", "gridOn"].find((id) => {
    return !document.getElementById(id).classList.contains("d-none");
  });
  return id.slice(0, -2);
}

function setModeEvents(div, event) {
  const media = div.firstElementChild;
  div.querySelector(".close").addEventListener("pointerdown", () => {
    div.remove();
  });
  switch (getMode()) {
    case "free": {
      const resizable = new Resizable(media, { container: media.parentNode });
      resizables.push(resizable);
      const draggable = new Draggable(div);
      draggables.push(draggable);
      if (event && event.clientX) {
        const style = div.style;
        style.left = `${event.clientX}px`;
        style.top = `${event.clientY}px`;
      }
      break;
    }
    case "dashboard": {
      const resizable = new Resizable(media);
      resizables.push(resizable);
      break;
    }
    case "grid": {
      const resizable = new Resizable(media);
      resizables.push(resizable);
      media.addEventListener("resizeEnd", resizeAll);
    }
  }
}

function freeOn() {
  document.getElementById("freeOn").classList.remove("d-none");
  document.getElementById("freeOff").classList.add("d-none");
  document.getElementById("dashboardOn").classList.add("d-none");
  document.getElementById("dashboardOff").classList.remove("d-none");
  document.getElementById("gridOn").classList.add("d-none");
  document.getElementById("gridOff").classList.remove("d-none");
  if (sortable) {
    sortable.destroy();
    sortable = null;
    for (const div of dragPanel.children) {
      const media = div.firstElementChild;
      media.setAttribute("draggable", "false");
    }
    const minX = dragPanel.offsetLeft;
    const minY = dragPanel.offsetTop;
    const width = dragPanel.offsetWidth;
    const height = dragPanel.offsetHeight;
    for (const div of dragPanel.children) {
      const draggable = new Draggable(div);
      draggables.push(draggable);
      const style = div.style;
      const randomX = minX + Math.random() * (width - div.offsetWidth);
      const randomY = minY + Math.random() * (height - div.offsetHeight);
      style.top = `${randomY}px`;
      style.left = `${randomX}px`;
    }
  }
  for (const resizable of resizables) {
    resizable.options.container = resizable.element.parentNode;
    resizable.element.removeEventListener("resizeEnd", resizeAll);
  }
}

function dashboardOn() {
  document.getElementById("freeOn").classList.add("d-none");
  document.getElementById("freeOff").classList.remove("d-none");
  document.getElementById("dashboardOff").classList.add("d-none");
  document.getElementById("dashboardOn").classList.remove("d-none");
  document.getElementById("gridOn").classList.add("d-none");
  document.getElementById("gridOff").classList.remove("d-none");
  if (!sortable) {
    sortable = new Sortable(dragPanel);
  }
  draggables.forEach((draggable) => draggable.destroy());
  draggables = [];
  for (const resizable of resizables) {
    resizable.options.container = null;
    resizable.element.removeEventListener("resizeEnd", resizeAll);
  }
}

function gridOn() {
  document.getElementById("freeOn").classList.add("d-none");
  document.getElementById("freeOff").classList.remove("d-none");
  document.getElementById("dashboardOn").classList.add("d-none");
  document.getElementById("dashboardOff").classList.remove("d-none");
  document.getElementById("gridOn").classList.remove("d-none");
  document.getElementById("gridOff").classList.add("d-none");
  if (!sortable) {
    sortable = new Sortable(dragPanel);
  }
  draggables.forEach((draggable) => draggable.destroy());
  draggables = [];
  let avgWidth = 0;
  let avgHeight = 0;
  const medias = [];
  for (const div of dragPanel.children) {
    const media = div.firstElementChild;
    medias.push(media);
    avgWidth += media.offsetWidth;
    avgHeight += media.offsetHeight;
  }
  avgWidth /= medias.length;
  avgHeight /= medias.length;
  for (const media of medias) {
    media.addEventListener("resizeEnd", resizeAll);
    const style = media.style;
    style.width = `${avgWidth}px`;
    style.height = `${avgHeight}px`;
  }
}

// Same-origin apps (e.g. 動画管理ソフト / video-manager.html, when served
// from this same host:port) can hand off a dragged File directly via
// BroadcastChannel instead of native DataTransfer, which has proven unable
// to carry a real File across tabs/windows in testing — independent of
// whether the source used a FileSystemFileHandle or a plain File. The
// visual drag/drop gesture stays native; only the payload moves out-of-band,
// correlated to the drop by "did a drag-file/drag-url message arrive and
// not yet get cleared by drag-end".
let pendingDrag = null;
if ("BroadcastChannel" in globalThis) {
  const dragChannel = new BroadcastChannel("video-manager-drag");
  dragChannel.onmessage = (event) => {
    const data = event.data;
    if (!data) return;
    if (data.type === "drag-file" || data.type === "drag-url") {
      pendingDrag = data;
    } else if (data.type === "drag-end") {
      pendingDrag = null;
    }
  };
}

function addFile(file, event, startTime) {
  const type = file.type;
  if (type.startsWith("image")) {
    return addImageFile(file, event);
  } else if (type.startsWith("video")) {
    return addVideoFile(file, event, startTime);
  } else if (type.startsWith("text/html")) {
    return addHTMLFile(file, event);
  } else if (type.startsWith("text")) {
    return addText(file, event);
  }
}

function addImageFile(file, event) {
  const template = document.getElementById("sortable-box")
    .content.cloneNode(true);
  const div = template.firstElementChild;
  const img = document.createElement("img");
  img.setAttribute("alt", "");
  img.setAttribute("draggable", "false");
  const style = img.style;
  style.objectFit = "contain";
  img.onload = () => {
    img.width = img.naturalWidth;
    img.height = img.naturalHeight;
    const maxWidth = dragPanel.offsetWidth / 2;
    if (getMode() === "grid") {
      const media = dragPanel.firstElementChild.firstElementChild;
      const mediaStyle = getComputedStyle(media);
      style.width = mediaStyle.width;
      style.height = mediaStyle.height;
    } else if (img.naturalWidth > maxWidth) {
      const height = img.naturalHeight / img.naturalWidth * maxWidth;
      style.width = `${maxWidth}px`;
      style.height = `${height}px`;
    }
  };
  img.src = URL.createObjectURL(file);
  div.prepend(img);
  dragPanel.appendChild(div);
  setModeEvents(div, event);
}

function addVideoFile(file, event, startTime) {
  addVideoElement(URL.createObjectURL(file), event, startTime);
}

// URLから直接<video>を貼る版。video-manager.html側の「サムネイルをドラッグ」
// 機能で、ローカルファイルの実体を持たないリモート動画(http/https URL)を
// ドラッグしたときは、application/x-video-manager と text/uri-list だけが
// 飛んでくる(items.add() で渡せる File が存在しないため)。それをここで拾う。
function addVideoUrl(url, event, startTime) {
  addVideoElement(url, event, startTime);
}

function addVideoElement(src, event, startTime) {
  const template = document.getElementById("sortable-box")
    .content.cloneNode(true);
  const div = template.firstElementChild;
  const video = document.createElement("video");
  video.setAttribute("controls", true);
  video.setAttribute("preload", "metadata");
  video.setAttribute("draggable", "false");
  const style = video.style;
  style.objectFit = "contain";
  video.onloadedmetadata = () => {
    video.width = video.videoWidth;
    video.height = video.videoHeight;
    if (startTime) {
      video.currentTime = startTime;
    }
    const maxWidth = dragPanel.offsetWidth / 2;
    if (getMode() === "grid") {
      const media = dragPanel.firstElementChild.firstElementChild;
      const mediaStyle = getComputedStyle(media);
      style.width = mediaStyle.width;
      style.height = mediaStyle.height;
    } else if (video.videoWidth > maxWidth) {
      const height = video.videoHeight / video.videoWidth * maxWidth;
      style.width = `${maxWidth}px`;
      style.height = `${height}px`;
    }
  };
  video.src = src;
  div.prepend(video);
  dragPanel.appendChild(div);
  setModeEvents(div, event);
}

function addText(text) {
  const template = document.getElementById("sortable-box")
    .content.cloneNode(true);
  const div = template.firstElementChild;
  const container = document.createElement("div");
  container.textContent = text;
  div.prepend(container);
  container.style.overflow = "auto";
  const child = div.firstElementChild;
  child.setAttribute("contenteditable", "true");
  if (getMode() === "grid") {
    const media = dragPanel.firstElementChild.firstElementChild;
    const mediaStyle = getComputedStyle(media);
    const style = div.firstElementChild.style;
    style.width = mediaStyle.width;
    style.height = mediaStyle.height;
  }
  dragPanel.appendChild(div);
  setModeEvents(div);
}

function isMedia(node) {
  switch (node.tagName.toLowerCase()) {
    case "iframe":
    case "img":
    case "svg":
    case "video":
      return true;
    default:
      return false;
  }
}

function addHTMLText(text) {
  const template = document.getElementById("sortable-box")
    .content.cloneNode(true);
  const div = template.firstElementChild;
  const container = document.createElement("div");
  container.innerHTML = text;
  const containerChild = container.firstElementChild;
  if (container.children.length === 1 && isMedia(containerChild)) {
    div.prepend(containerChild);
    containerChild.style.overflow = "auto";
  } else {
    div.prepend(container);
    container.style.overflow = "auto";
  }
  const child = div.firstElementChild;
  child.setAttribute("contenteditable", "true");
  if (getMode() === "grid") {
    const media = dragPanel.firstElementChild.firstElementChild;
    const mediaStyle = getComputedStyle(media);
    const style = div.firstElementChild.style;
    style.width = mediaStyle.width;
    style.height = mediaStyle.height;
  }
  dragPanel.appendChild(div);
  setModeEvents(div);
}

function addHTMLFile(file) {
  const reader = new FileReader();
  reader.onload = (event) => {
    const text = event.target.result;
    addHTML(text);
  };
  reader.readAsText(file);
}

function addHTMLfromTextArea() {
  const text = document.getElementById("addTextarea").value;
  addHTMLText(text);
}

function showAddModal() {
  new Modal("#addModal").show();
}

const dragPanel = document.getElementById("dragPanel");
const resizables = [];
let draggables = [];
let sortable = new Sortable(dragPanel);
for (const div of dragPanel.children) {
  const media = div.firstElementChild;
  const resizable = new Resizable(media);
  media.addEventListener("resizeEnd", resizeAll);
  resizables.push(resizable);
}
for (const closeButton of dragPanel.querySelectorAll(".close")) {
  closeButton.addEventListener("pointerdown", () => {
    closeButton.parentNode.remove();
  });
}

document.querySelectorAll(".alert").forEach((alert) => {
  new Alert(alert);
});
document.getElementById("addModal").addEventListener("shown.bs.modal", () => {
  document.getElementById("addTextarea").focus();
});

document.getElementById("toggleDarkMode").onclick = toggleDarkMode;
document.getElementById("showAddModal").onclick = showAddModal;
document.getElementById("freeOff").onclick = freeOn;
document.getElementById("dashboardOff").onclick = dashboardOn;
document.getElementById("gridOff").onclick = gridOn;
document.getElementById("addHTML").onclick = addHTMLfromTextArea;
globalThis.ondragover = (event) => {
  event.preventDefault();
};
globalThis.ondrop = (event) => {
  event.preventDefault();
  // If the drop came from 動画管理ソフト (video-manager.html), it attaches a
  // custom "application/x-video-manager" payload alongside the File that
  // records which second of the video the dragged thumbnail represents.
  // When present, seek the newly added <video> to that second; any other
  // drag source (Explorer/Finder, another tab, etc.) simply won't set this,
  // and playback starts from 0 as before.
  let startTime;
  const custom = event.dataTransfer.getData("application/x-video-manager");
  if (custom) {
    try {
      const info = JSON.parse(custom);
      if (typeof info.time === "number" && isFinite(info.time)) {
        startTime = info.time;
      }
    } catch (_) {
      // ignore malformed/foreign payloads
    }
  }
  const files = event.dataTransfer.files;
  if (files.length > 0) {
    for (const file of files) {
      addFile(file, event, startTime);
    }
    return;
  }
  // Native DataTransfer carried no File (this is the common case for a
  // cross-tab drag in testing) — fall back to whatever arrived out-of-band
  // via BroadcastChannel for this same drag gesture, if same-origin.
  if (pendingDrag) {
    const drag = pendingDrag;
    pendingDrag = null;
    if (drag.type === "drag-file" && drag.file) {
      addFile(drag.file, event, drag.time);
      return;
    }
    if (drag.type === "drag-url" && drag.url) {
      addVideoUrl(drag.url, event, drag.time);
      return;
    }
  }
  // Last resort: a plain dragged link/URL (no BroadcastChannel available,
  // or a source other than 動画管理ソフト), e.g. 動画管理ソフト is showing a
  // remote (http/https-hosted) video: it has no local file to hand over via
  // items.add(), only the URL itself, sent as text/uri-list / text/plain.
  const uri = (event.dataTransfer.getData("text/uri-list") ||
    event.dataTransfer.getData("text/plain") || "").trim();
  if (/^https?:\/\//i.test(uri)) {
    addVideoUrl(uri, event, startTime);
  }
};
globalThis.addEventListener("paste", (event) => {
  if (event.target.tagName.toLowerCase() === "textarea") return;
  const items = event.clipboardData.items;
  if (items[0].kind === "string") {
    const item = items[0];
    const type = item.type;
    item.getAsString((text) => {
      switch (type) {
        case "text/html":
          addHTMLText(text);
          break;
        default:
          addText(text);
          break;
      }
    });
  } else {
    for (const item of items) {
      if (item.kind === "string") continue;
      const file = item.getAsFile();
      addFile(file, event);
    }
  }
});
