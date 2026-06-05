'use client';

import Link from 'next/link';
import { parseAsInteger, useQueryState } from 'nuqs';
import { useState } from 'react';

import { PaginationNav } from '@/components/pagination-nav';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { trpc } from '@/lib/trpc';

function PostForm() {
  const [message, setMessage] = useState('');
  const utils = trpc.useUtils();

  const post = trpc.bbs.post.useMutation({
    onSuccess: () => {
      setMessage('');
      utils.bbs.list.invalidate();
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = message.trim();
    if (!trimmed || trimmed.length > 500) return;
    post.mutate({ message: trimmed });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>投稿</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            type="text"
            placeholder="メッセージを入力..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            maxLength={500}
            className="flex-1"
          />
          <Button type="submit" disabled={post.isPending || !message.trim()}>
            投稿
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function LoginPrompt() {
  return (
    <Card>
      <CardContent className="pt-4">
        <p className="text-sm text-muted-foreground">
          投稿するには
          <Link href="/login" className="text-primary hover:underline">
            ログイン
          </Link>
          してください。
        </p>
      </CardContent>
    </Card>
  );
}

export function BbsContent() {
  const [page] = useQueryState('page', parseAsInteger.withDefault(1));

  const { data: me } = trpc.auth.me.useQuery(undefined, { retry: false });
  const { data, isLoading } = trpc.bbs.list.useQuery({ page, limit: 50 });

  const totalPages = data ? Math.ceil(data.total / 50) : 0;

  function buildHref(p: number) {
    if (p <= 1) return '/bbs';
    return `/bbs?page=${p}`;
  }

  return (
    <div className="space-y-4">
      {me ? <PostForm /> : <LoginPrompt />}

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 10 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : data && data.items.length > 0 ? (
        <>
          <p className="text-sm text-muted-foreground">{data.total.toLocaleString()} 件</p>
          <div className="space-y-3">
            {data.items.map((post) => (
              <div key={post.id} className="rounded-lg border p-3">
                <div className="flex items-center gap-2 text-sm">
                  {post.playerId ? (
                    <Link
                      href={`/players/${post.playerId}`}
                      className="font-medium text-primary hover:underline"
                    >
                      {post.playerName}
                    </Link>
                  ) : (
                    <span className="font-medium">{post.playerName ?? '匿名'}</span>
                  )}
                  <span className="text-muted-foreground text-xs">
                    {new Date(post.postedAt).toLocaleString('ja-JP')}
                  </span>
                </div>
                <p className="mt-1 text-sm whitespace-pre-wrap break-words">{post.message}</p>
              </div>
            ))}
          </div>
          <PaginationNav currentPage={page} totalPages={totalPages} buildHref={buildHref} />
        </>
      ) : (
        <p className="text-muted-foreground text-sm">投稿がありません</p>
      )}
    </div>
  );
}
