const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs').promises;

const databasePath = path.join(__dirname, 'database', 'notes.json');

async function loadNotes() {
    try {
        const data = await fs.readFile(databasePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        if (error.code === 'ENOENT') {
            await fs.mkdir(path.dirname(databasePath), {
                recursive: true
            });

            await fs.writeFile(databasePath, '[]', 'utf8');
            return [];
        }

        throw error;
    }
}

async function saveNotes(notes) {
    if (!Array.isArray(notes)) {
        throw new Error('Invalid notes data');
    }

    await fs.writeFile(
        databasePath,
        JSON.stringify(notes, null, 4),
        'utf8'
    );

    return true;
}

function createWindow() {
    const win = new BrowserWindow({
        width: 900,
        height: 650,
        minWidth: 700,
        minHeight: 500,
        title: 'Notes Taking Application',

        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false
        }
    });

    win.loadFile('index.html');
}

ipcMain.handle('load-notes', () => loadNotes());

ipcMain.handle('save-notes', (event, notes) => saveNotes(notes));

app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});