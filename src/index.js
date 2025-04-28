let editing = { date: null, id: null, showEndTime: false };
let lastEditing = { date: null, id: null };
let showNoteInput = false;
const activities = [
  { emoji: "🍴", label: "Feed" },
  { emoji: "🛏", label: "Nap" },
  { emoji: "⚽", label: "Play" },
  { emoji: "💧", label: "Pee" },
  { emoji: "💩", label: "Poop" },
];

function logActivity(activity) {
  const now = new Date();
  const timeString = now.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
  // new: local date
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const today = `${year}-${month}-${day}`;

  const logs = JSON.parse(localStorage.getItem("puppyLogs")) || {};
  if (!logs[today]) logs[today] = [];
  logs[today].unshift({ id: Date.now(), time: timeString, activity });
  localStorage.setItem("puppyLogs", JSON.stringify(logs));
  renderLogs();
}

function renderLogs() {
  const isNewEdit =
    editing.date !== lastEditing.date || editing.id !== lastEditing.id;
  const logs = JSON.parse(localStorage.getItem("puppyLogs")) || {};
  const logList = document.getElementById("logList");
  logList.innerHTML = "";
  const dates = Object.keys(logs).sort((a, b) => b.localeCompare(a));

  dates.forEach((date, idx) => {
    const dateItem = document.createElement("li");
    const section = document.createElement("section");
    section.className = "bg-white shadow rounded-lg p-4";
    section.setAttribute("data-date", date);
    section.id = `section-${date}`;

    const title = document.createElement("h3");
    title.className = "text-md font-bold mb-2";
    title.textContent = formatDate(date);
    section.appendChild(title);

    logs[date]
      .slice()
      .sort((a, b) => convertToMinutes(b.time) - convertToMinutes(a.time))
      .forEach((item) => {
        const entry = document.createElement("div");
        entry.className = "border-b last:border-0 pb-2 flex flex-col";

        if (editing.date === date && editing.id === item.id) {
          entry.classList.add("editing", "bg-blue-100");
          if (isNewEdit) entry.classList.add("animate-open");

          const timeInput = document.createElement("input");
          timeInput.type = "time";
          timeInput.value = convertTo24hFormat(item.time);
          timeInput.className = "border rounded p-1 mb-2";
          timeInput.setAttribute("data-ga-event", "entry_start_time_edit");
          entry.appendChild(timeInput);

          let endTimeInput = null;
          if (editing.showEndTime) {
            endTimeInput = document.createElement("input");
            endTimeInput.type = "time";
            endTimeInput.value = item.endTime
              ? convertTo24hFormat(item.endTime)
              : timeInput.value;
            endTimeInput.className = "border rounded p-1 mb-2";
            endTimeInput.setAttribute("data-ga-event", "entry_end_time_edit");
            entry.appendChild(endTimeInput);
          }

          const endToggle = document.createElement("button");
          endToggle.type = "button";
          endToggle.textContent = editing.showEndTime
            ? "Remove End Time"
            : "Add End Time";
          endToggle.className =
            "text-blue-700 text-sm underline mb-2 text-left";
          endToggle.setAttribute("data-ga-event", editing.showEndTime ? "entry_end_time_remove_click" : "entry_end_time_add_click");
          endToggle.onclick = () => {
            editing.showEndTime = !editing.showEndTime;
            renderLogs();
          };
          entry.appendChild(endToggle);

          const activitySelect = document.createElement("select");
          activitySelect.className = "border rounded p-1 mb-2";
          activities.forEach((act) => {
            const opt = document.createElement("option");
            opt.value = `${act.emoji} ${act.label}`;
            opt.textContent = opt.value;
            if (item.activity === opt.value) opt.selected = true;
            activitySelect.appendChild(opt);
          });
          activitySelect.setAttribute("data-ga-event", "entry_activity_edit_click")
          entry.appendChild(activitySelect);

          const noteBtn = document.createElement("button");
          noteBtn.type = "button";
          noteBtn.textContent = item.note ? "Edit Note" : "Add Note";
          noteBtn.className =
            "text-blue-700 text-sm underline mb-2 text-left";
          noteBtn.setAttribute("data-ga-event", item.note ? "entry_note_edit_click" : "entry_note_add_click" )
          noteBtn.onclick = () => {
            showNoteInput = true;
            renderLogs();
          };
          entry.appendChild(noteBtn);

          const noteInput = document.createElement("textarea");
          noteInput.className = `border rounded p-1 mb-2 w-full ${
            showNoteInput ? "" : "hidden"
          }`;
          noteInput.placeholder = "Enter note...";
          noteInput.value = item.note || "";
          entry.appendChild(noteInput);

          const btnRow = document.createElement("div");
          btnRow.className = "flex space-x-2";
          const saveBtn = document.createElement("button");
          saveBtn.type = "button";
          saveBtn.textContent = "Save";
          saveBtn.className = "text-green-800 underline";
          saveBtn.onclick = () =>
            saveEdit(
              date,
              item.id,
              timeInput.value,
              activitySelect.value,
              noteInput.value,
              endTimeInput ? endTimeInput.value : ""
            );
          saveBtn.setAttribute("data-ga-event", "entry_edit_save_click");
          const cancelBtn = document.createElement("button");
          cancelBtn.type = "button";
          cancelBtn.textContent = "Cancel";
          cancelBtn.className = "text-gray-800 underline";
          cancelBtn.onclick = cancelEdit;
          cancelBtn.setAttribute("data-ga-event", "entry_edit_cancel_click");
          const deleteBtn = document.createElement("button");
          deleteBtn.type = "button";
          deleteBtn.textContent = "Delete";
          deleteBtn.className = "text-red-700 underline";
          deleteBtn.onclick = () => deleteEntry(date, item.id);
          deleteBtn.setAttribute("data-ga-event", "entry_edit_delete_click");
          btnRow.append(saveBtn, cancelBtn, deleteBtn);
          entry.appendChild(btnRow);
        } else {
          const mainDiv = document.createElement("div");
          mainDiv.className = "flex justify-between items-center";
          const leftDiv = document.createElement("div");
          leftDiv.className = "flex flex-col";
          const timeText = item.endTime
            ? `${item.time} - ${item.endTime}`
            : item.time;
          let noteSpan = "";
          if (item.note) {
            const d =
              item.note.length > 50
                ? item.note.slice(0, 50) + "..."
                : item.note;
            noteSpan = `<span class="ml-1 italic text-gray-500 truncate-note" title="${item.note}">"${d}"</span>`;
          }
          leftDiv.innerHTML = `<span class="font-semibold">${timeText}</span><div class="flex flex-wrap items-center"><span>${item.activity}</span>${noteSpan}</div>`;
          const editBtn = document.createElement("button");
          editBtn.type = "button";
          editBtn.className = "text-blue-700 hover:text-blue-800";
          editBtn.innerText = "✏️";
          editBtn.setAttribute("data-ga-event", "entry_edit_click")
          editBtn.onclick = () => {
            editing = { date, id: item.id, showEndTime: !!item.endTime };
            showNoteInput = false;
            renderLogs();
          };
          mainDiv.append(leftDiv, editBtn);
          entry.appendChild(mainDiv);
        }
        section.appendChild(entry);
      });

    dateItem.appendChild(section);
    logList.appendChild(dateItem);
    if (idx < dates.length - 1) {
      const nav = document.createElement("div");
      nav.className = "flex space-x-2 mt-2";
      nav.innerHTML = `
      <section aria-label="jump-controls-${idx}" class="jump-controls">
      <button onclick="scrollToTop()" class="px-2 py-1 text-xs rounded border" data-ga-event="middle_scroll_top">↑ Top</button>
      <button onclick="scrollToBottom()" class="px-2 py-1 text-xs rounded border" data-ga-event="middle_scroll_bottom">↓ Bottom</button>
      </section>
      `;
      section.after(nav);
    }
    lastEditing = { date: editing.date, id: editing.id };
  });
  updateWelcomeMessage();
  updateJumpControlsVisibility();
  updateClearButtonVisibility();
}

function saveEdit(date, id, newTime24, newActivity, newNote, newEnd24) {
  const logs = JSON.parse(localStorage.getItem("puppyLogs")) || {};
  const items = logs[date] || [];
  const item = items.find((e) => e.id === id);
  if (item) {
    item.time = convertTo12hFormat(newTime24);
    item.activity = newActivity;
    item.note = newNote.trim() || undefined;
    if (newEnd24) item.endTime = convertTo12hFormat(newEnd24);
    else delete item.endTime;
  }
  logs[date] = items.sort(
    (a, b) => convertToMinutes(a.time) - convertToMinutes(b.time)
  );
  localStorage.setItem("puppyLogs", JSON.stringify(logs));
  editing = { date: null, id: null, showEndTime: false };
  showNoteInput = false;
  renderLogs();
}

function cancelEdit() {
  editing = { date: null, id: null, showEndTime: false };
  showNoteInput = false;
  renderLogs();
}

function deleteEntry(date, id) {
  const logs = JSON.parse(localStorage.getItem("puppyLogs")) || {};
  logs[date] = (logs[date] || []).filter((e) => e.id !== id);
  if (!logs[date].length) delete logs[date];
  localStorage.setItem("puppyLogs", JSON.stringify(logs));
  cancelEdit();
}

function openClearConfirm() {
  document
    .getElementById("clearConfirmModal")
    .classList.replace("hidden", "flex");
}

function closeClearConfirm() {
  document
    .getElementById("clearConfirmModal")
    .classList.replace("flex", "hidden");
}

function confirmClearLog() {
  localStorage.removeItem("puppyLogs");
  cancelEdit();
  closeClearConfirm();
  renderLogs();
  updateJumpControlsVisibility();
}

function openModal() {
  document.getElementById("modal").classList.replace("hidden", "flex");
}

function closeModal() {
  document.getElementById("modal").classList.replace("flex", "hidden");
}

function convertTo24hFormat(time12h) {
  const [time, modifier] = time12h.split(" ");
  let [hours, minutes] = time.split(":").map(Number);
  if (modifier === "PM" && hours !== 12) hours += 12;
  if (modifier === "AM" && hours === 12) hours = 0;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
    2,
    "0"
  )}`;
}

function convertTo12hFormat(time24h) {
  let [hours, minutes] = time24h.split(":").map(Number);
  const modifier = hours >= 12 ? "PM" : "AM";
  if (hours === 0) hours = 12;
  else if (hours > 12) hours -= 12;
  return `${hours}:${String(minutes).padStart(2, "0")} ${modifier}`;
}

function convertToMinutes(timeString) {
  const [time, modifier] = timeString.split(" ");
  let [hours, minutes] = time.split(":").map(Number);
  if (modifier === "PM" && hours !== 12) hours += 12;
  if (modifier === "AM" && hours === 12) hours = 0;
  return hours * 60 + minutes;
}

function formatDate(isoDate) {
  const [year, month, day] = isoDate.split("-").map(Number);
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  return `${months[month - 1]} ${day}, ${year}`;
}

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function scrollToBottom() {
  window.scrollTo({
    top: document.body.scrollHeight,
    behavior: "smooth",
  });
}

function updateJumpControlsVisibility() {
  const logs = JSON.parse(localStorage.getItem("puppyLogs")) || {};
  const hasLogs = Object.keys(logs).length > 0;
  const scrollable =
    document.documentElement.scrollHeight > window.innerHeight;
  const shouldShow = hasLogs && scrollable;

  document.querySelectorAll(".jump-controls").forEach((el) => {
    el.style.display = shouldShow ? "flex" : "none";
  });
}

function updateClearButtonVisibility() {
  const logsExist =
    Object.keys(JSON.parse(localStorage.getItem("puppyLogs")) || {})
      .length > 0;
  const btn = document.querySelector(
    'button[onclick="openClearConfirm()"]'
  );
  if (btn) {
    btn.style.display = logsExist ? "inline-block" : "none";
  }
}

window.addEventListener("load", updateJumpControlsVisibility);
window.addEventListener("resize", updateJumpControlsVisibility);
window.addEventListener("load", updateJumpControlsVisibility);
window.addEventListener("resize", updateJumpControlsVisibility);

function openDatePicker() {
  const picker = document.getElementById("datePicker");
  picker.classList.remove("hidden");
  picker.focus();
}

document.getElementById("datePicker").addEventListener("change", (e) => {
  const date = e.target.value; // "YYYY-MM-DD"
  e.target.classList.add("hidden");

  // find the exact day's section
  const section = document.querySelector(`section[data-date="${date}"]`);
  if (section) {
    section.scrollIntoView({ behavior: "smooth", block: "start" });
  } else {
    alert(`No entries for ${date}`);
  }

  // reset for next time
  e.target.value = "";
});

function updateWelcomeMessage() {
  const logs = JSON.parse(localStorage.getItem("puppyLogs")) || {};
  const welcome = document.getElementById("welcome-message");
  if (Object.keys(logs).length === 0) {
    welcome.classList.remove("hidden");
  } else {
    welcome.classList.add("hidden");
  }
}
