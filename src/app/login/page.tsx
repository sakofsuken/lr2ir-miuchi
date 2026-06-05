'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { trpc } from '@/lib/trpc';

export default function LoginPage() {
  const router = useRouter();
  const [lr2id, setLr2id] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: () => {
      router.push('/');
      router.refresh();
    },
    onError: (err) => {
      setError(err.message);
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    const id = parseInt(lr2id, 10);
    if (isNaN(id) || id <= 0) {
      setError('有効な LR2ID を入力してください');
      return;
    }
    loginMutation.mutate({ lr2id: id, password });
  }

  return (
    <div className="flex justify-center mt-12">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>ログイン</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="lr2id" className="text-sm font-medium">
                LR2ID
              </label>
              <Input
                id="lr2id"
                type="text"
                inputMode="numeric"
                placeholder="12345"
                value={lr2id}
                onChange={(e) => setLr2id(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">
                パスワード
              </label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <p className="text-xs text-muted-foreground">
                初回ログイン時に入力したパスワードが登録されます
              </p>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full" disabled={loginMutation.isPending}>
              {loginMutation.isPending ? 'ログイン中...' : 'ログイン'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
