import Link from 'next/link';
import { Nav } from './nav';

export function Header() {
  return (
    <header className="border-b border-border bg-card">
      <div className="container mx-auto px-4 flex items-center justify-between h-14">
        <div className="flex items-center gap-4">
          <Nav />
          <Link href="/" className="text-xl font-bold tracking-tight">
            LR2IR
          </Link>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/login"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            ログイン
          </Link>
        </div>
      </div>
    </header>
  );
}
