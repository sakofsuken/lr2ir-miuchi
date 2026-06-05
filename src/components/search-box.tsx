'use client';

import { Search } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type SearchType = 'charts' | 'players' | 'courses';

const searchTypeLabels: Record<SearchType, string> = {
  charts: '譜面',
  players: 'プレイヤー',
  courses: 'コース',
};

const searchTypePaths: Record<SearchType, string> = {
  charts: '/search',
  players: '/players',
  courses: '/courses',
};

export function SearchBox() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [searchType, setSearchType] = useState<SearchType>('charts');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    const path = searchTypePaths[searchType];
    router.push(`${path}?q=${encodeURIComponent(query.trim())}`);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <div className="flex gap-2">
        {(Object.keys(searchTypeLabels) as SearchType[]).map((type) => (
          <Button
            key={type}
            type="button"
            variant={searchType === type ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSearchType(type)}
          >
            {searchTypeLabels[type]}
          </Button>
        ))}
      </div>
      <div className="flex gap-2">
        <Input
          type="text"
          placeholder={`${searchTypeLabels[searchType]}を検索...`}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="flex-1"
        />
        <Button type="submit" size="default">
          <Search className="size-4" />
          検索
        </Button>
      </div>
    </form>
  );
}
