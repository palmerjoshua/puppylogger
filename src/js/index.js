const db = new Dexie('PuppyLoggerDB');
db.version(1).stores({
  activities:
    '++id, type, createddate, starttimeSortable, endtimeSortable, notes, [createddate+starttimeSortable]'
});

let editing       = { date: null, id: null, showEndTime: false };
let lastEditing   = { date: null, id: null };
let showNoteInput = false;

const activities = [
  { emoji: "🍴", label: "Feed" },
  { emoji: "🛏", label: "Sleep" },
  { emoji: "⚽", label: "Play" },
  { emoji: "🎓", label: "Train" },
  { emoji: "🚶", label: "Walk" },
  { emoji: "💧", label: "Pee" },
  { emoji: "💩", label: "Poop" },
];

// Helper to convert "h:mm AM/PM" → "HH:mm"
function toSortable(time12h) {
  let [time, modifier] = time12h.split(' ');
  let [h, m] = time.split(':').map(Number);
  if (modifier === 'PM' && h < 12) h += 12;
  if (modifier === 'AM' && h === 12) h = 0;
  return String(h).padStart(2,'0') + ':' + String(m).padStart(2,'0');
}

// --- CREATE ---
async function logActivity(activity) {
  const now      = new Date();
  const display  = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const sortable = toSortable(display);
  const year  = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day   = String(now.getDate()).padStart(2, '0');
  const createddate = `${year}-${month}-${day}`;
  

  await db.activities.add({
    type: activity,
    createddate,
    starttimeSortable: sortable,
    endtimeSortable: null,
    notes: null
  });

  await renderLogs();
}

// --- READ & RENDER ---
async function renderLogs() {
  // Fetch all entries sorted newest-first by date+time
  const allItems = await db.activities
    .orderBy('[createddate+starttimeSortable]')
    .reverse()
    .toArray();

  // Group entries by createddate
  const logsByDate = allItems.reduce((acc, item) => {
    (acc[item.createddate] ||= []).push(item);
    return acc;
  }, {});

  const dates = Object.keys(logsByDate);
  const isNewEdit = editing.date !== lastEditing.date || editing.id !== lastEditing.id;
  const logList = document.getElementById("logList");
  logList.innerHTML = "";

  dates.forEach((date, idx) => {
    // Section wrapper for each date
    const section = document.createElement("section");
    section.className = "bg-white shadow rounded-lg p-4";
    section.setAttribute("data-date", date);
    section.id = `section-${date}`;

    // Date header
    const title = document.createElement("h3");
    title.className = "text-md font-bold mb-2";
    title.textContent = formatDate(date);
    section.appendChild(title);

    // Entries for this date
    logsByDate[date].forEach(item => {
      const entry = document.createElement("div");
      entry.className = "border-b last:border-0 pb-2 flex flex-col";

      if (editing.date === date && editing.id === item.id) {
        // --- EDIT MODE ---
        entry.classList.add("editing", "bg-blue-100", "mt-2");
        if (isNewEdit) entry.classList.add("animate-open");

        // Seed draft on first render of this edit session
        if (isNewEdit) {
          editDraft = {
            timeSortable:  item.starttimeSortable,
            type:          item.type,
            note:          item.notes || "",
            endSortable:   item.endtimeSortable || "",
            showEndTime:   !!item.endtimeSortable
          };
        }

        // Start-time picker
        const timeInput = document.createElement("input");
        timeInput.type = "time";
        timeInput.value = editDraft.timeSortable;
        timeInput.className = "border rounded p-1 mb-2 bg-white";
        timeInput.setAttribute("data-ga-event", "entry_start_time_edit");
        timeInput.oninput = e => { editDraft.timeSortable = e.target.value; };
        entry.appendChild(timeInput);

        // End-time picker (optional)
        let endTimeInput = null;
        if (editing.showEndTime) {
          endTimeInput = document.createElement("input");
          endTimeInput.type = "time";
          endTimeInput.value = editDraft.endSortable || editDraft.timeSortable;
          endTimeInput.className = "border rounded p-1 mb-2 bg-white";
          endTimeInput.setAttribute("data-ga-event", "entry_end_time_edit");
          endTimeInput.oninput = e => { editDraft.endSortable = e.target.value; };
          entry.appendChild(endTimeInput);
        }

        // Toggle Add/Remove End Time
        const endToggle = document.createElement("button");
        endToggle.type = "button";
        endToggle.textContent = editing.showEndTime ? "Remove End Time" : "Add End Time";
        endToggle.className = "text-blue-700 text-sm underline mb-2 text-left";
        endToggle.setAttribute("data-ga-event",
          editing.showEndTime
            ? "entry_end_time_remove_click"
            : "entry_end_time_add_click"
        );
        endToggle.onclick = () => {
          editDraft.showEndTime = !editDraft.showEndTime;
          editing.showEndTime = editDraft.showEndTime;
          renderLogs();
        };
        entry.appendChild(endToggle);

        // Activity select
        const activitySelect = document.createElement("select");
        activitySelect.className = "border rounded p-1 mb-2 bg-white";
        activitySelect.setAttribute("data-ga-event", "entry_activity_edit_click");
        activities.forEach(act => {
          const opt = document.createElement("option");
          opt.value = `${act.emoji} ${act.label}`;
          opt.textContent = opt.value;
          if (opt.value === editDraft.type) opt.selected = true;
          activitySelect.appendChild(opt);
        });
        activitySelect.onchange = e => { editDraft.type = e.target.value; };
        entry.appendChild(activitySelect);

        // Note Add/Edit button
        const noteBtn = document.createElement("button");
        noteBtn.type = "button";
        noteBtn.textContent = editDraft.note ? "Edit Note" : "Add Note";
        noteBtn.className = "text-blue-700 text-sm underline mb-2 text-left";
        noteBtn.setAttribute("data-ga-event",
          editDraft.note ? "entry_note_edit_click" : "entry_note_add_click"
        );
        noteBtn.onclick = () => {
          showNoteInput = true;
          renderLogs();
        };
        entry.appendChild(noteBtn);

        // Note input textarea
        const noteInput = document.createElement("textarea");
        noteInput.className = `border rounded p-1 mb-2 w-full ${
          showNoteInput ? "" : "hidden"
        }`;
        noteInput.placeholder = "Enter note...";
        noteInput.value = editDraft.note;
        noteInput.oninput = e => { editDraft.note = e.target.value; };
        entry.appendChild(noteInput);

        // Save / Cancel / Delete buttons
        const btnRow = document.createElement("div");
        btnRow.className = "flex space-x-2";

        const saveBtn = document.createElement("button");
        saveBtn.type = "button";
        saveBtn.textContent = "Save";
        saveBtn.className = "text-green-800 underline";
        saveBtn.setAttribute("data-ga-event", "entry_edit_save_click");
        saveBtn.onclick = async () => {
          await saveEdit(
            item.id,
            editDraft.timeSortable,
            editDraft.type,
            editDraft.note,
            editDraft.showEndTime ? editDraft.endSortable : ""
          );
        };

        const cancelBtn = document.createElement("button");
        cancelBtn.type = "button";
        cancelBtn.textContent = "Cancel";
        cancelBtn.className = "text-gray-800 underline";
        cancelBtn.setAttribute("data-ga-event", "entry_edit_cancel_click");
        cancelBtn.onclick = cancelEdit;

        const deleteBtn = document.createElement("button");
        deleteBtn.type = "button";
        deleteBtn.textContent = "Delete";
        deleteBtn.className = "text-red-700 underline";
        deleteBtn.setAttribute("data-ga-event", "entry_edit_delete_click");
        deleteBtn.onclick = async () => { await deleteEntry(item.id); };

        btnRow.append(saveBtn, cancelBtn, deleteBtn);
        entry.appendChild(btnRow);

      } else {
        // --- VIEW MODE ---
        const mainDiv = document.createElement("div");
        mainDiv.className = "flex justify-between items-center";

        const leftDiv = document.createElement("div");
        leftDiv.className = "flex flex-col";


        const startDisplay = convertTo12hFormat(item.starttimeSortable);
        const endDisplay   = item.endtimeSortable
                              ? convertTo12hFormat(item.endtimeSortable)
                              : null;
        
        const timeDisplay = endDisplay
          ? `${startDisplay} - ${endDisplay}`
          : startDisplay;

        let noteSpan = "";
        if (item.notes) {
          const d = item.notes.length > 50
            ? item.notes.slice(0,50) + "..."
            : item.notes;
          noteSpan = `<span class="ml-1 italic text-gray-500 truncate-note" title="${item.notes}">"${d}"</span>`;
        }

        leftDiv.innerHTML = `
          <span class="font-semibold">${timeDisplay}</span>
          <div class="flex flex-wrap items-center">
            <span>${item.type}</span> ${noteSpan}
          </div>`;

        const editBtn = document.createElement("button");
        editBtn.type = "button";
        editBtn.className = "text-blue-700 hover:text-blue-800";
        editBtn.innerText = "✏️";
        editBtn.setAttribute("data-ga-event", "entry_edit_click");
        editBtn.onclick = () => {
          editing = {
            date:             item.createddate,
            id:               item.id,
            showEndTime:      !!item.endtimeSortable
          };
          showNoteInput = false;
          renderLogs();
        };

        mainDiv.append(leftDiv, editBtn);
        entry.appendChild(mainDiv);
      }

      section.appendChild(entry);
    });

    logList.appendChild(section);

    // Middle jump controls
    if (idx < dates.length - 1) {
      const nav = document.createElement("div");
      nav.className = "flex space-x-2 mt-2";
      nav.innerHTML = `
        <section aria-label="jump-controls-${idx}" class="jump-controls">
          <button onclick="scrollToTop()"    class="px-2 py-1 text-xs rounded border" data-ga-event="middle_jump_top">↑ Top</button>
          <button onclick="scrollToBottom()" class="px-2 py-1 text-xs rounded border" data-ga-event="middle_jump_bottom">↓ Bottom</button>
        </section>`;
      section.after(nav);
    }

    lastEditing = { date: editing.date, id: editing.id };
  });

  // Update visibility based on entry count
  const count = allItems.length;
  updateWelcomeMessage(count);
  updateJumpControlsVisibility(count);
  updateClearButtonVisibility(count);
}


// --- UPDATE (Save edited entry) ---
async function saveEdit(id, newTimeSortable, newType, newNotes, newEndSortable) {
  const updates = {
    starttimeDisplay:  convertTo12hFormat(newTimeSortable),
    starttimeSortable: newTimeSortable,
    type:              newType,
    notes:             newNotes.trim() || null,
    endtimeDisplay:    newEndSortable ? convertTo12hFormat(newEndSortable) : null,
    endtimeSortable:   newEndSortable || null
  };
  await db.activities.update(id, updates);
  editing = { date: null, id: null, showEndTime: false };
  showNoteInput = false;
  await renderLogs();
}

// --- DELETE SINGLE ---
async function deleteEntry(id) {
  await db.activities.delete(id);
  cancelEdit();
  await renderLogs();
}

// --- CLEAR ALL ---
async function confirmClearLog() {
  await db.activities.clear();
  cancelEdit();
  closeClearConfirm();
  await renderLogs();
}

// --- CANCEL EDIT ---
function cancelEdit() {
  editing = { date: null, id: null, showEndTime: false };
  showNoteInput = false;
  renderLogs();
}

// --- MODALS & SCROLLING ---
function openClearConfirm()  { document.getElementById("clearConfirmModal").classList.replace("hidden","flex"); }
function closeClearConfirm() { document.getElementById("clearConfirmModal").classList.replace("flex","hidden"); }
function openModal()         { document.getElementById("modal").classList.replace("hidden","flex"); }
function closeModal()        { document.getElementById("modal").classList.replace("flex","hidden"); }
function scrollToTop()       { window.scrollTo({ top: 0, behavior: "smooth" }); }
function scrollToBottom()    { window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" }); }
function openExportConfirm() {
  document.getElementById('exportConfirmModal')
          .classList.replace('hidden','flex');
}
function closeExportConfirm() {
  document.getElementById('exportConfirmModal')
          .classList.replace('flex','hidden');
}

document.getElementById('export-first-yes')
  .addEventListener('click', () => {
    closeExportConfirm();
    // show your CSV modal:
    document.getElementById('csv-modal')
            .classList.replace('hidden','flex');
});

document.getElementById('export-first-no')
  .addEventListener('click', () => {
    closeExportConfirm();
    // now show the normal "Are you sure?" clear modal:
    openClearConfirm();
});


// --- DATE PICKER ---
function openDatePicker() {
  const picker = document.getElementById("datePicker");
  picker.classList.remove("hidden");
  picker.focus();
}
document.getElementById("datePicker").addEventListener("change", e => {
  const date = e.target.value;
  e.target.classList.add("hidden");
  const section = document.querySelector(`section[data-date="${date}"]`);
  if (section) section.scrollIntoView({ behavior: "smooth", block: "start" });
  else alert(`No entries for ${date}`);
  e.target.value = "";
});

// --- VISIBILITY HELPERS ---
function updateJumpControlsVisibility(count) {
  // Wait until after renderLogs has updated the DOM
  window.requestAnimationFrame(() => {
    const scrollable = document.documentElement.scrollHeight > window.innerHeight;
    const displayValue = (count > 0 && scrollable) ? 'flex' : 'none';
    document.querySelectorAll('.jump-controls').forEach(el => {
      el.style.display = displayValue;
    });
  });
}

function updateClearButtonVisibility(count) {
  const btn = document.querySelector('button[onclick="openClearConfirm()"]');
  if (btn) btn.style.display = count > 0 ? "inline-block" : "none";
}
function updateWelcomeMessage(count) {
  const welcome = document.getElementById("welcome-message");
  if (count === 0) welcome.classList.remove("hidden");
  else             welcome.classList.add("hidden");
}

// --- FORMATTERS ---
function convertTo12hFormat(time24h) {
  let [hours, minutes] = time24h.split(':').map(Number);
  const modifier = hours >= 12 ? 'PM' : 'AM';
  if (hours === 0) hours = 12;
  else if (hours > 12) hours -= 12;
  return `${hours}:${String(minutes).padStart(2,'0')} ${modifier}`;
}
function convertToMinutes(timeString) {
  const [time, modifier] = timeString.split(' ');
  let [hours, minutes] = time.split(':').map(Number);
  if (modifier === 'PM' && hours !== 12) hours += 12;
  if (modifier === 'AM' && hours === 12) hours = 0;
  return hours * 60 + minutes;
}
function formatDate(isoDate) {
  const [year, month, day] = isoDate.split('-').map(Number);
  const months = [
    "January","February","March","April","May","June",
    "July","August","September","October","November","December"
  ];
  return `${months[month-1]} ${day}, ${year}`;
}

const importBtn    = document.getElementById('importExportBtn');
const modal        = document.getElementById('csv-modal');
const exportBtn    = document.getElementById('csv-export-btn');
const importInput  = document.getElementById('csv-import-input');
const closeBtn     = document.getElementById('csv-modal-close');

// open/close modal
importBtn.addEventListener('click', () => modal.classList.remove('hidden'));
closeBtn .addEventListener('click', () => modal.classList.add('hidden'));

// EXPORT
exportBtn.addEventListener('click', async () => {
  try {
    // fetch all records
    const allLogs = await db.activities
    .orderBy('[createddate+starttimeSortable]')
    .reverse()
    .toArray();
    // build CSV
    const header = ['id','type','createddate','starttime','endtime','notes'];
    const rows = allLogs.map(log => {
      // escape quotes in text fields
      const esc = str => `"${(str||'').replace(/"/g,'""')}"`;
      return [
        log.id,
        esc(log.type),
        log.createddate,
        log.starttimeSortable,
        log.endtimeSortable||'',
        esc(log.notes)
      ].join(',');
    });
    const csv = [header.join(','), ...rows].join('\r\n');
    // trigger download
    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `puppy-logs-${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  } catch (err) {
    alert('Export failed: ' + err);
  }
});

function parseCSVLine(line) {
  const result = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      // double quote inside quoted field -> literal quote
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }

    } else if (char === ',' && !inQuotes) {
      // end of field
      result.push(current);
      current = "";

    } else {
      current += char;
    }
  }

  // last field
  result.push(current);
  return result;
}

importInput.addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  try {
    const text  = await file.text();
    const lines = text.split(/\r\n|\n/).filter(l => l);
    const [header, ...dataRows] = lines;
    const cols = parseCSVLine(header)
      .map(h => h.replace(/^"|"$/g, '')   // remove outer quotes
      .replace(/""/g, '"'));             // un-escape any doubled quotes
    const idx   = name => cols.indexOf(name);

    const records = dataRows.map(line => {
      const cells = parseCSVLine(line);
      return {
        id:            Number(cells[idx('id')] || Date.now()),
        type:          cells[idx('type')]             .replace(/^"|"$/g,'').replace(/""/g,'"'),
        createddate:   cells[idx('createddate')]      || '',
        starttimeSortable: cells[idx('starttime')]    || '',
        endtimeSortable:   cells[idx('endtime')]      || undefined,
        notes:         (cells[idx('notes')]            || '')
                          .replace(/^"|"$/g,'')
                          .replace(/""/g,'"')         || undefined
      };
    });

    await db.activities.bulkPut(records);

    renderLogs();
    alert('Import successful!');
  } catch (err) {
    alert('Import failed: ' + err);
  } finally {
    e.target.value = '';
    modal.classList.add('hidden');
  }
});
