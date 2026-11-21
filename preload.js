
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('notesAPI', {

    loadNotes: () => {
        return ipcRenderer.invoke('load-notes');
    },

    saveNotes: (notes) => {
        return ipcRenderer.invoke('save-notes', notes);
    }

});
