import { useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import {
  Inbox,
  FileText,
  CheckSquare,
  Calendar,
  Settings,
  Search,
  Mail,
} from 'lucide-react';
import { useEmails } from '@/lib/api/hooks';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEmailSelect?: (emailId: string) => void;
}

export function CommandPalette({ open, onOpenChange, onEmailSelect }: CommandPaletteProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [search, setSearch] = useState('');
  
  const { data: emailsData } = useEmails({ search: search.length > 1 ? search : undefined, limit: 5 });

  const navigateTo = useCallback((path: string) => {
    navigate(path);
    onOpenChange(false);
    setSearch('');
  }, [navigate, onOpenChange]);

  const handleEmailSelect = useCallback((emailId: string) => {
    if (onEmailSelect) {
      onEmailSelect(emailId);
    }
    navigate('/inbox');
    onOpenChange(false);
    setSearch('');
  }, [navigate, onOpenChange, onEmailSelect]);

  const pages = [
    { name: 'Dashboard', path: '/', icon: Search },
    { name: 'Inbox', path: '/inbox', icon: Inbox },
    { name: 'Drafts', path: '/drafts', icon: FileText },
    { name: 'Workflows', path: '/workflows', icon: CheckSquare },
    { name: 'Calendar', path: '/calendar', icon: Calendar },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput 
        placeholder="Type a command or search..." 
        value={search}
        onValueChange={setSearch}
      />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        
        <CommandGroup heading="Pages">
          {pages.map((page) => (
            <CommandItem
              key={page.path}
              onSelect={() => navigateTo(page.path)}
              className="flex items-center gap-3"
            >
              <page.icon className="h-4 w-4 text-muted-foreground" />
              <span>{page.name}</span>
              {location.pathname === page.path && (
                <span className="ml-auto text-xs text-muted-foreground">Current</span>
              )}
            </CommandItem>
          ))}
        </CommandGroup>
        
        {emailsData && emailsData.data.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Emails">
              {emailsData.data.map((email) => (
                <CommandItem
                  key={email.id}
                  onSelect={() => handleEmailSelect(email.id)}
                  className="flex items-center gap-3"
                >
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <div className="flex flex-col">
                    <span className="font-medium">{email.subject}</span>
                    <span className="text-xs text-muted-foreground">{email.fromName}</span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}
        
        <CommandSeparator />
        <CommandGroup heading="Quick Actions">
          <CommandItem onSelect={() => navigateTo('/inbox')}>
            <Inbox className="mr-2 h-4 w-4" />
            <span>Check Inbox</span>
            <kbd className="kbd ml-auto">G then I</kbd>
          </CommandItem>
          <CommandItem onSelect={() => navigateTo('/workflows')}>
            <CheckSquare className="mr-2 h-4 w-4" />
            <span>View Tasks</span>
            <kbd className="kbd ml-auto">G then T</kbd>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}

export function useCommandPalette() {
  const [open, setOpen] = useState(false);

  useKeyboardShortcuts([
    { key: 'k', ctrl: true, handler: () => setOpen(true) },
  ]);

  return { open, setOpen };
}
