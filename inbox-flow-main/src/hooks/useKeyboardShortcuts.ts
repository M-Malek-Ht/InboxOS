import { useEffect, useCallback } from 'react';

type ShortcutHandler = () => void;

interface ShortcutConfig {
  key: string;
  ctrl?: boolean;
  meta?: boolean;
  shift?: boolean;
  handler: ShortcutHandler;
  description?: string;
}

const registeredShortcuts: ShortcutConfig[] = [];

export function useKeyboardShortcuts(shortcuts: ShortcutConfig[]) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        (e.target instanceof HTMLElement && e.target.isContentEditable)
      ) {
        // Allow Escape to work even in inputs
        if (e.key !== 'Escape') {
          return;
        }
      }

      for (const shortcut of shortcuts) {
        const keyMatch = e.key.toLowerCase() === shortcut.key.toLowerCase();
        const ctrlMatch = !!shortcut.ctrl === (e.ctrlKey || e.metaKey);
        const metaMatch = !!shortcut.meta === e.metaKey;
        const shiftMatch = !!shortcut.shift === e.shiftKey;

        if (keyMatch && ctrlMatch && shiftMatch) {
          e.preventDefault();
          shortcut.handler();
          return;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts]);
}

export function useGlobalShortcuts({
  onSearch,
  onCommandPalette,
  onNavigateUp,
  onNavigateDown,
  onSelect,
  onCreateTask,
  onGenerateReply,
  onEscape,
}: {
  onSearch?: () => void;
  onCommandPalette?: () => void;
  onNavigateUp?: () => void;
  onNavigateDown?: () => void;
  onSelect?: () => void;
  onCreateTask?: () => void;
  onGenerateReply?: () => void;
  onEscape?: () => void;
}) {
  const shortcuts: ShortcutConfig[] = [];

  if (onSearch) {
    shortcuts.push({ key: '/', handler: onSearch, description: 'Focus search' });
  }
  
  if (onCommandPalette) {
    shortcuts.push({ key: 'k', ctrl: true, handler: onCommandPalette, description: 'Command palette' });
  }
  
  if (onNavigateUp) {
    shortcuts.push({ key: 'k', handler: onNavigateUp, description: 'Navigate up' });
    shortcuts.push({ key: 'ArrowUp', handler: onNavigateUp, description: 'Navigate up' });
  }
  
  if (onNavigateDown) {
    shortcuts.push({ key: 'j', handler: onNavigateDown, description: 'Navigate down' });
    shortcuts.push({ key: 'ArrowDown', handler: onNavigateDown, description: 'Navigate down' });
  }
  
  if (onSelect) {
    shortcuts.push({ key: 'Enter', handler: onSelect, description: 'Open selected' });
  }
  
  if (onCreateTask) {
    shortcuts.push({ key: 't', handler: onCreateTask, description: 'Create task' });
  }
  
  if (onGenerateReply) {
    shortcuts.push({ key: 'r', handler: onGenerateReply, description: 'Generate reply' });
  }
  
  if (onEscape) {
    shortcuts.push({ key: 'Escape', handler: onEscape, description: 'Close/Cancel' });
  }

  useKeyboardShortcuts(shortcuts);
}
