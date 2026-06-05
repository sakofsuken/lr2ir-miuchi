'use client';

import Link from 'next/link';
import { parseAsString, useQueryState } from 'nuqs';

import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { trpc } from '@/lib/trpc';

export function CoursesContent() {
  const [category, setCategory] = useQueryState('category', parseAsString.withDefault(''));

  const { data: categories, isLoading: catLoading } = trpc.courses.getCategories.useQuery();
  const { data, isLoading } = trpc.courses.list.useQuery({
    category: category || undefined,
    page: 1,
    limit: 100,
  });

  if (catLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const allCategories = categories ?? [];
  const activeTab = category || 'all';

  return (
    <Tabs value={activeTab} onValueChange={(val) => setCategory(val === 'all' ? '' : val)}>
      <TabsList>
        <TabsTrigger value="all">すべて</TabsTrigger>
        {allCategories.map((cat) => (
          <TabsTrigger key={cat} value={cat}>
            {cat}
          </TabsTrigger>
        ))}
      </TabsList>
      <TabsContent value={activeTab} className="mt-4">
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : data && data.items.length > 0 ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>コースタイトル</TableHead>
                  <TableHead>キーモード</TableHead>
                  <TableHead className="text-right">受験者数</TableHead>
                  <TableHead className="text-right">合格者数</TableHead>
                  <TableHead className="text-right">合格率</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.items.map((course) => {
                  const passRate =
                    course.playPeople > 0
                      ? `${((course.clearPeople / course.playPeople) * 100).toFixed(1)}%`
                      : '-';
                  return (
                    <TableRow key={course.id}>
                      <TableCell>
                        <Link
                          href={`/courses/${course.id}`}
                          className="text-primary hover:underline"
                        >
                          {course.title}
                        </Link>
                      </TableCell>
                      <TableCell>{course.keys}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {course.playPeople.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {course.clearPeople.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{passRate}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        ) : (
          <p className="text-muted-foreground text-sm">コースがありません</p>
        )}
      </TabsContent>
    </Tabs>
  );
}
