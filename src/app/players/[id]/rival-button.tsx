'use client';

import { UserMinus, UserPlus } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { trpc } from '@/lib/trpc';

export function RivalButton({ playerId }: { playerId: number }) {
  const { data: me } = trpc.auth.me.useQuery(undefined, {
    retry: false,
  });
  const { data: rivals } = trpc.rivals.list.useQuery({ playerId: me?.id ?? 0 }, { enabled: !!me });

  const utils = trpc.useUtils();
  const addRival = trpc.rivals.add.useMutation({
    onSuccess: () => {
      utils.rivals.list.invalidate();
    },
  });
  const removeRival = trpc.rivals.remove.useMutation({
    onSuccess: () => {
      utils.rivals.list.invalidate();
    },
  });

  if (!me || me.id === playerId) return null;

  const isRival = rivals?.some((r) => r.rivalId === playerId) ?? false;

  if (isRival) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => removeRival.mutate({ rivalId: playerId })}
        disabled={removeRival.isPending}
      >
        <UserMinus className="size-4" />
        ライバル解除
      </Button>
    );
  }

  return (
    <Button
      variant="default"
      size="sm"
      onClick={() => addRival.mutate({ rivalId: playerId })}
      disabled={addRival.isPending}
    >
      <UserPlus className="size-4" />
      ライバル登録
    </Button>
  );
}
