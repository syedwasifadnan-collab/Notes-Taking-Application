
const noteForm = document.getElementById('noteForm');
const noteTitle = document.getElementById('noteTitle');
const noteContent = document.getElementById('noteContent');

const notesList = document.getElementById('notesList');
const noteCount = document.getElementById('noteCount');

const saveBtn = document.getElementById('saveBtn');
const cancelBtn = document.getElementById('cancelBtn');
const formHeading = document.getElementById('formHeading');

let notes = [];
let editingId = null;


// Load notes from JSON database
async function loadNotes() {
    try {
        notes = await window.notesAPI.loadNotes();
        displayNotes();

    } catch (error) {
        console.error('Loading error:', error);
        alert('Unable to load notes: ' + error.message);
    }
}


// Display all notes
function displayNotes() {
    notesList.innerHTML = '';

    noteCount.textContent =
        `${notes.length} ${notes.length === 1 ? 'Note' : 'Notes'}`;

    if (notes.length === 0) {
        const message = document.createElement('p');
        message.className = 'empty-message';
        message.textContent = 'No notes available. Create your first note!';
        notesList.appendChild(message);
        return;
    }

    notes.forEach((note) => {
        const card = document.createElement('div');
        card.className = 'note-card';

        const title = document.createElement('h3');
        title.textContent = note.title;

        const content = document.createElement('p');
        content.textContent = note.content;

        const date = document.createElement('div');
        date.className = 'note-date';
        date.textContent =
            'Last updated: ' + new Date(note.updatedAt).toLocaleString();

        const actions = document.createElement('div');
        actions.className = 'note-actions';

        const editBtn = document.createElement('button');
        editBtn.className = 'edit-btn';
        editBtn.textContent = 'Edit';
        editBtn.dataset.action = 'edit';
        editBtn.dataset.id = note.id;

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-btn';
        deleteBtn.textContent = 'Delete';
        deleteBtn.dataset.action = 'delete';
        deleteBtn.dataset.id = note.id;

        actions.append(editBtn, deleteBtn);
        card.append(title, content, date, actions);

        notesList.appendChild(card);
    });
}


// Save notes to JSON database
async function saveToDatabase() {
    try {
        await window.notesAPI.saveNotes(notes);
        displayNotes();
        return true;

    } catch (error) {
        console.error('Saving error:', error);
        alert('Unable to save notes.');
        return false;
    }
}


// Custom delete confirmation popup
function confirmDelete() {
    return new Promise((resolve) => {
        const overlay = document.createElement('div');

        overlay.style.cssText = `
            position: fixed;
            inset: 0;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 9999;
        `;

        const dialog = document.createElement('div');

        dialog.style.cssText = `
            background: white;
            padding: 25px;
            border-radius: 10px;
            width: 320px;
            max-width: 90%;
            text-align: center;
            box-shadow: 0 5px 20px rgba(0, 0, 0, 0.2);
            font-family: Arial, sans-serif;
        `;

        const message = document.createElement('p');
        message.textContent = 'Are you sure you want to delete this note? This action cannot be undone.';

        message.style.cssText = `
            font-size: 16px;
            margin: 0 0 20px;
            color: #333;
        `;

        const buttons = document.createElement('div');

        buttons.style.cssText = `
            display: flex;
            justify-content: center;
            gap: 10px;
        `;

        const yesBtn = document.createElement('button');
        yesBtn.textContent = 'Yes';

        yesBtn.style.cssText = `
            padding: 9px 20px;
            border: none;
            border-radius: 5px;
            background: #dc2626;
            color: white;
            cursor: pointer;
        `;

        const noBtn = document.createElement('button');
        noBtn.textContent = 'No';

        noBtn.style.cssText = `
            padding: 9px 20px;
            border: none;
            border-radius: 5px;
            background: #6b7280;
            color: white;
            cursor: pointer;
        `;

        buttons.append(yesBtn, noBtn);
        dialog.append(message, buttons);
        overlay.appendChild(dialog);
        document.body.appendChild(overlay);

        yesBtn.addEventListener('click', () => {
            overlay.remove();
            resolve(true);
        });

        noBtn.addEventListener('click', () => {
            overlay.remove();
            resolve(false);
        });
    });
}


// Add or update a note
noteForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const title = noteTitle.value.trim();
    const content = noteContent.value.trim();

    if (!title || !content) {
        alert('Please enter both title and content.');
        return;
    }

    const currentTime = new Date().toISOString();

    if (editingId !== null) {
        const note = notes.find(n => n.id === editingId);

        if (note) {
            note.title = title;
            note.content = content;
            note.updatedAt = currentTime;
        }

    } else {
        const newNote = {
            id: Date.now().toString(),
            title: title,
            content: content,
            updatedAt: currentTime
        };

        notes.push(newNote);
    }

    const saved = await saveToDatabase();

    if (saved) {
        resetForm();
    }
});


// Edit and delete notes
notesList.addEventListener('click', async (event) => {
    const button = event.target.closest('button[data-action]');

    if (!button) return;

    const id = button.dataset.id;
    const action = button.dataset.action;

    const note = notes.find(n => n.id === id);

    if (!note) return;

    if (action === 'edit') {
        editingId = id;

        noteTitle.value = note.title;
        noteContent.value = note.content;

        formHeading.textContent = 'Edit Note';
        saveBtn.textContent = 'Update Note';
        cancelBtn.hidden = false;

        noteTitle.focus();
    }

    else if (action === 'delete') {
        const confirmed = await confirmDelete();

        if (!confirmed) return;

        const previousNotes = [...notes];

        notes = notes.filter(n => n.id !== id);

        const saved = await saveToDatabase();

        if (!saved) {
            notes = previousNotes;
            displayNotes();

        } else {
            resetForm();

            requestAnimationFrame(() => {
                noteTitle.focus();
            });
        }
    }
});


// Reset the form
function resetForm() {
    noteForm.reset();

    editingId = null;

    noteTitle.disabled = false;
    noteContent.disabled = false;

    noteTitle.readOnly = false;
    noteContent.readOnly = false;

    formHeading.textContent = 'Create a New Note';
    saveBtn.textContent = 'Save Note';
    cancelBtn.hidden = true;
}


// Cancel editing
cancelBtn.addEventListener('click', resetForm);


// Start the application
loadNotes();
