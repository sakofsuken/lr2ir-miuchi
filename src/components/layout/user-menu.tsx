'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';

export function UserMenu() {
  const router = useRouter();
  const { data: user, isLoading } = trpc.auth.me.useQuery(undefined, {
    retry: false,
  });
  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => {
      router.refresh();
    },
  });

  if (isLoading) return null;

  if (!user) {
    return (
      <Link
        href="/login"
        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        ログイン
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <Link
        href={`/players/${user.id}`}
        className="text-sm text-foreground hover:text-primary transition-colors"
      >
        {user.name}
      </Link>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => logoutMutation.mutate()}
        disabled={logoutMutation.isPending}
      >
        ログアウト
      </Button>
    </div>
  );
}
