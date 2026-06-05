import Link from 'next/link';
import { notFound } from 'next/navigation';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { createServerCaller } from '@/lib/trpc-server';
import { CourseRankingTable } from './ranking-table';

export default async function CoursePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const courseId = Number(id);

  if (Number.isNaN(courseId)) notFound();

  const caller = await createServerCaller();
  const course = await caller.courses.getById({ id: courseId });

  if (!course) notFound();

  const passRate =
    course.playPeople > 0 ? `${((course.clearPeople / course.playPeople) * 100).toFixed(1)}%` : '-';

  let stages: string[] = [];
  try {
    const parsed = JSON.parse(course.stages);
    if (Array.isArray(parsed)) {
      stages = parsed.filter((s): s is string => typeof s === 'string');
    }
  } catch {
    // ignore parse errors
  }

  let stageCharts: { md5: string; title: string }[] = [];
  if (stages.length > 0) {
    const chartResults = await Promise.all(stages.map((md5) => caller.charts.getByMd5({ md5 })));
    stageCharts = stages.map((md5, i) => ({
      md5,
      title: chartResults[i]?.title ?? md5,
    }));
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{course.title}</h1>
        {course.category && <p className="text-muted-foreground mt-1">{course.category}</p>}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>コース情報</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
              <dt className="text-muted-foreground">キーモード</dt>
              <dd>{course.keys}</dd>
              <dt className="text-muted-foreground">受験者数</dt>
              <dd>{course.playPeople.toLocaleString()}</dd>
              <dt className="text-muted-foreground">合格者数</dt>
              <dd>{course.clearPeople.toLocaleString()}</dd>
              <dt className="text-muted-foreground">合格率</dt>
              <dd>{passRate}</dd>
            </dl>
          </CardContent>
        </Card>

        {stageCharts.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>ステージ構成</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">Stage</TableHead>
                    <TableHead>譜面</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stageCharts.map((stage, i) => (
                    <TableRow key={stage.md5}>
                      <TableCell className="font-medium">{i + 1}</TableCell>
                      <TableCell>
                        <Link
                          href={`/charts/${stage.md5}`}
                          className="text-primary hover:underline"
                        >
                          {stage.title}
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>スコアランキング</CardTitle>
        </CardHeader>
        <CardContent>
          <CourseRankingTable courseId={courseId} />
        </CardContent>
      </Card>
    </div>
  );
}
