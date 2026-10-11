import { contextBridge, ipcRenderer } from 'electron';
import type { AppState } from '../shared/domain';

export interface RurinagiApi {
  loadState(): Promise<AppState>;
  saveState(state: AppState): Promise<AppState>;
  exportData(): Promise<{ canceled: boolean; path?: string }>;
  importData(): Promise<{ canceled: boolean; state?: AppState }>;
  backupData(): Promise<{ canceled: boolean; path?: string }>;
  clearData(): Promise<AppState>;
  openCapture(): Promise<void>;
  completeCapture(): Promise<void>;
  openExternal(url: string): Promise<void>;
  notify(title: string, body: string): Promise<void>;
  onStateChanged(callback: () => void): () => void;
}

const api: RurinagiApi = {
  loadState: () => ipcRenderer.invoke('state:load') as Promise<AppState>,
  saveState: (state) => ipcRenderer.invoke('state:save', state) as Promise<AppState>,
  exportData: () => ipcRenderer.invoke('data:export') as Promise<{ canceled: boolean; path?: string }>,
  importData: () => ipcRenderer.invoke('data:import') as Promise<{ canceled: boolean; state?: AppState }>,
  backupData: () => ipcRenderer.invoke('data:backup') as Promise<{ canceled: boolean; path?: string }>,
  clearData: () => ipcRenderer.invoke('data:clear') as Promise<AppState>,
  openCapture: () => ipcRenderer.invoke('capture:open') as Promise<void>,
  completeCapture: () => ipcRenderer.invoke('capture:complete') as Promise<void>,
  openExternal: (url) => ipcRenderer.invoke('external:open', url) as Promise<void>,
  notify: (title, body) => ipcRenderer.invoke('notify', title, body) as Promise<void>,
  onStateChanged: (callback) => {
    const listener = (): void => callback();
    ipcRenderer.on('state:changed', listener);
    return () => ipcRenderer.removeListener('state:changed', listener);
  },
};

contextBridge.exposeInMainWorld('rurinagi', api);

