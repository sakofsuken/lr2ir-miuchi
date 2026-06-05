import { notFound } from 'next/navigation';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { createServerCaller } from '@/lib/trpc-server';
import { TableLevelCharts } from './level-charts';

export default async function TablePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const tableId = Number(id);

  if (Number.isNaN(tableId)) notFound();

  const caller = await createServerCaller();
  const [tables, levels] = await Promise.all([
    caller.tables.list(),
    caller.tables.getLevels({ tableId }),
  ]);

  const table = tables.find((t) => t.id === tableId);
  if (!table) notFound();

  const sortedLevels = [...levels].sort((a, b) => {
    const numA = Number.parseInt(a.level, 10);
    const numB = Number.parseInt(b.level, 10);
    if (Number.isNaN(numA) && Number.isNaN(numB)) return a.level.localeCompare(b.level);
    if (Number.isNaN(numA)) return 1;
    if (Number.isNaN(numB)) return -1;
    return numA - numB;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{table.name}</h1>
        <p className="text-muted-foreground mt-1">シンボル: {table.symbol}</p>
      </div>

      {sortedLevels.length === 0 ? (
        <p className="text-muted-foreground text-sm">レベルデータがありません</p>
      ) : (
        sortedLevels.map((level) => (
          <Card key={level.level}>
            <CardHeader>
              <CardTitle>
                {table.symbol}
                {level.level} ({level.count}曲)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <TableLevelCharts tableId={tableId} level={level.level} />
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
