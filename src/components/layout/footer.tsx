import { Separator } from '@/components/ui/separator';

export function Footer() {
  return (
    <footer className="border-t border-border bg-card mt-auto">
      <div className="container mx-auto px-4 py-4">
        <Separator className="mb-4" />
        <p className="text-center text-sm text-muted-foreground">LR2IR Archive (read-only)</p>
      </div>
    </footer>
  );
}
