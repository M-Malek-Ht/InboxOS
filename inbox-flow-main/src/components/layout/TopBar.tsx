import { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Search,
  Sun,
  Moon,
  Command,
} from 'lucide-react';
import { useTheme } from '@/components/ThemeProvider';
import { cn } from '@/lib/utils';

interface TopBarProps {
  onCommandPalette: () => void;
  onSearch?: (query: string) => void;
}

const pageTitles: Record<string, string> = {
  '/': 'Dashboard',
  '/inbox': 'Inbox',
  '/drafts': 'Drafts',
  '/workflows': 'Workflows',
  '/calendar': 'Calendar',
  '/settings': 'Settings',
};

export function TopBar({ onCommandPalette, onSearch }: TopBarProps) {
  const location = useLocation();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);

  const pageTitle = pageTitles[location.pathname] || 'InboxOS';

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    onSearch?.(value);
  };

  const toggleTheme = () => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
  };

  // Focus search on / key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === '/' &&
        !(e.target instanceof HTMLInputElement) &&
        !(e.target instanceof HTMLTextAreaElement)
      ) {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <header className="h-14 border-b border-border bg-background/80 backdrop-blur-sm flex items-center justify-between px-6 sticky top-0 z-40">
      {/* Left: Page title */}
      <div className="flex items-center gap-4">
        <h1 className="text-lg font-semibold text-foreground">{pageTitle}</h1>
      </div>

      {/* Center: Search */}
      <div className="flex-1 max-w-md mx-8">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            ref={searchRef}
            type="search"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            className={cn(
              'pl-9 pr-12 h-9 bg-muted/50 border-transparent',
              'focus:bg-background focus:border-input',
              'transition-all duration-200'
            )}
          />
          <kbd className="kbd absolute right-3 top-1/2 -translate-y-1/2">/</kbd>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={onCommandPalette}
          className="gap-2 text-muted-foreground"
        >
          <Command className="h-4 w-4" />
          <span className="hidden sm:inline">Command</span>
          <kbd className="kbd">⌘K</kbd>
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          className="text-muted-foreground"
        >
          {resolvedTheme === 'dark' ? (
            <Sun className="h-4 w-4" />
          ) : (
            <Moon className="h-4 w-4" />
          )}
        </Button>
      </div>
    </header>
  );
}
