(() => {
  const ROWS = 10;
  const COLS = 20;

  const boardEl = document.getElementById("board");
  const remainCountEl = document.getElementById("remainCount");
  const removedCountEl = document.getElementById("removedCount");
  const currentSumEl = document.getElementById("currentSum");
  const messageEl = document.getElementById("message");
  const resetBtn = document.getElementById("resetBtn");

  let numbers = [];
  let removed = [];
  let selected = new Set();
  let removedCount = 0;

  let isDragging = false;
  let dragStart = null;
  let dragCurrent = null;
  let boardRect = null;

  const dragRectEl = document.createElement("div");
  dragRectEl.className = "drag-rect hidden";
  boardEl.appendChild(dragRectEl);

  function randomNumber() {
    return Math.floor(Math.random() * 9) + 1;
  }

  function idFrom(r, c) {
    return r + "-" + c;
  }

  function parseId(id) {
    const [r, c] = id.split("-").map(Number);
    return { r, c };
  }

  function getSumOfSelection() {
    let sum = 0;
    selected.forEach((id) => {
      const { r, c } = parseId(id);
      sum += numbers[r][c];
    });
    return sum;
  }

  function updateHud() {
    const remaining = ROWS * COLS - removedCount;
    remainCountEl.textContent = String(remaining);
    removedCountEl.textContent = String(removedCount);
    currentSumEl.textContent = String(getSumOfSelection());
  }

  function setMessage(text, type) {
    messageEl.textContent = text;
    messageEl.className = "message" + (type ? " " + type : "");
  }

  function clearSelection() {
    selected.forEach((id) => {
      const cell = document.querySelector('[data-id="' + id + '"]');
      if (cell && !cell.classList.contains("removed")) {
        cell.classList.remove("selected");
      }
    });
    selected.clear();
    updateHud();
  }

  function removeSelection() {
    selected.forEach((id) => {
      const { r, c } = parseId(id);
      if (!removed[r][c]) {
        removed[r][c] = true;
        removedCount += 1;
      }
      const cell = document.querySelector('[data-id="' + id + '"]');
      if (cell) {
        cell.classList.remove("selected");
        cell.classList.add("removed");
        cell.disabled = true;
      }
    });

    selected.clear();
    updateHud();

    if (removedCount === ROWS * COLS) {
      setMessage("클리어! 모든 사과를 없앴습니다.", "done");
    } else {
      setMessage("합이 10! 사과가 제거되었습니다.", "ok");
    }
  }

  function updateDragVisual() {
    if (!isDragging || !dragStart || !dragCurrent || !boardRect) {
      dragRectEl.classList.add("hidden");
      return;
    }

    const x1 = Math.min(dragStart.x, dragCurrent.x) - boardRect.left;
    const y1 = Math.min(dragStart.y, dragCurrent.y) - boardRect.top;
    const x2 = Math.max(dragStart.x, dragCurrent.x) - boardRect.left;
    const y2 = Math.max(dragStart.y, dragCurrent.y) - boardRect.top;

    dragRectEl.style.left = x1 + "px";
    dragRectEl.style.top = y1 + "px";
    dragRectEl.style.width = Math.max(0, x2 - x1) + "px";
    dragRectEl.style.height = Math.max(0, y2 - y1) + "px";
    dragRectEl.classList.remove("hidden");
  }

  function applySelectionFromRect() {
    if (!isDragging || !dragStart || !dragCurrent || !boardRect) {
      return;
    }

    const minX = Math.min(dragStart.x, dragCurrent.x);
    const maxX = Math.max(dragStart.x, dragCurrent.x);
    const minY = Math.min(dragStart.y, dragCurrent.y);
    const maxY = Math.max(dragStart.y, dragCurrent.y);

    selected.clear();

    const allApples = boardEl.querySelectorAll(".apple");
    allApples.forEach((cell) => {
      if (cell.classList.contains("removed")) {
        cell.classList.remove("selected");
        return;
      }

      const rect = cell.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;

      const inside =
        cx >= minX && cx <= maxX &&
        cy >= minY && cy <= maxY;

      if (inside) {
        cell.classList.add("selected");
        selected.add(cell.dataset.id);
      } else {
        cell.classList.remove("selected");
      }
    });

    updateHud();
  }

  function onPointerDown(e) {
    const target = e.target;
    if (!target.classList.contains("apple") || target.classList.contains("removed")) {
      return;
    }

    isDragging = true;
    boardRect = boardEl.getBoundingClientRect();
    dragStart = { x: e.clientX, y: e.clientY };
    dragCurrent = { x: e.clientX, y: e.clientY };

    setMessage("드래그 영역 안의 사과가 선택됩니다.", "");
    applySelectionFromRect();
    updateDragVisual();

    e.preventDefault();
  }

  function onPointerMove(e) {
    if (!isDragging) return;

    dragCurrent = { x: e.clientX, y: e.clientY };
    updateDragVisual();
    applySelectionFromRect();
  }

  function onPointerUp() {
    if (!isDragging) return;
    isDragging = false;

    dragRectEl.classList.add("hidden");

    const sum = getSumOfSelection();

    if (selected.size === 0) {
      setMessage("", "");
      return;
    }

    if (sum === 10) {
      removeSelection();
    } else {
      setMessage("합이 10이 아닙니다. 다시 선택해보세요.", "warn");
      clearSelection();
    }
  }

  function renderBoard() {
    boardEl.innerHTML = "";
    boardEl.appendChild(dragRectEl);

    for (let r = 0; r < ROWS; r += 1) {
      for (let c = 0; c < COLS; c += 1) {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "apple";
        btn.dataset.id = idFrom(r, c);
        btn.textContent = String(numbers[r][c]);

        boardEl.appendChild(btn);
      }
    }
  }

  function initGame() {
    numbers = Array.from({ length: ROWS }, () =>
      Array.from({ length: COLS }, () => randomNumber())
    );
    removed = Array.from({ length: ROWS }, () =>
      Array.from({ length: COLS }, () => false)
    );
    selected = new Set();
    removedCount = 0;
    isDragging = false;
    dragStart = null;
    dragCurrent = null;
    dragRectEl.classList.add("hidden");

    renderBoard();
    updateHud();
    setMessage("사과를 드래그해서 선택하세요.", "");
  }

  boardEl.addEventListener("pointerdown", onPointerDown);
  window.addEventListener("pointermove", onPointerMove);
  window.addEventListener("pointerup", onPointerUp);

  resetBtn.addEventListener("click", initGame);

  initGame();
})();
