import { Outlet } from 'react-router-dom';
import { AppSidebar } from './AppSidebar';
import { TopBar } from './TopBar';
import { CommandPalette, useCommandPalette } from '@/components/CommandPalette';
import { useState } from 'react';

interface AppLayoutProps {
  children?: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { open: commandOpen, setOpen: setCommandOpen } = useCommandPalette();
  const [globalSearch, setGlobalSearch] = useState('');

  return (
    <div className="min-h-screen flex w-full bg-background">
      <AppSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar 
          onCommandPalette={() => setCommandOpen(true)}
          onSearch={setGlobalSearch}
        />
        <main className="flex-1 overflow-auto">
          {children || <Outlet />}
        </main>
      </div>
      <CommandPalette open={commandOpen} onOpenChange={setCommandOpen} />
    </div>
  );
}
