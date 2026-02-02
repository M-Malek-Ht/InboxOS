import { useTheme } from '@/components/ThemeProvider';
import { useResetDemoData } from '@/lib/api/hooks';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { RefreshCw, Moon, Sun, Monitor } from 'lucide-react';

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const resetData = useResetDemoData();

  const handleReset = async () => {
    await resetData.mutateAsync();
    toast.success('Demo data reset successfully');
  };

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage your preferences</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
          <CardDescription>Customize how InboxOS looks</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Theme</Label>
            <Select value={theme} onValueChange={(v) => setTheme(v as any)}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light"><Sun className="h-4 w-4 inline mr-2" />Light</SelectItem>
                <SelectItem value="dark"><Moon className="h-4 w-4 inline mr-2" />Dark</SelectItem>
                <SelectItem value="system"><Monitor className="h-4 w-4 inline mr-2" />System</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Demo Data</CardTitle>
          <CardDescription>Reset to initial demo state</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" onClick={handleReset} disabled={resetData.isPending} className="gap-2">
            <RefreshCw className={`h-4 w-4 ${resetData.isPending ? 'animate-spin' : ''}`} />
            Reset Demo Data
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Keyboard Shortcuts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex justify-between"><span>Command palette</span><kbd className="kbd">⌘K</kbd></div>
            <div className="flex justify-between"><span>Search</span><kbd className="kbd">/</kbd></div>
            <div className="flex justify-between"><span>Navigate up</span><kbd className="kbd">K</kbd></div>
            <div className="flex justify-between"><span>Navigate down</span><kbd className="kbd">J</kbd></div>
            <div className="flex justify-between"><span>Open item</span><kbd className="kbd">Enter</kbd></div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
