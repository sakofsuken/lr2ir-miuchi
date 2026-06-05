import Link from 'next/link';

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

export default async function TablesPage() {
  const caller = await createServerCaller();
  const tables = await caller.tables.list();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">難易度表</h1>

      {tables.length === 0 ? (
        <p className="text-muted-foreground text-sm">難易度表がありません</p>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>テーブル一覧</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>シンボル</TableHead>
                  <TableHead>テーブル名</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tables.map((table) => (
                  <TableRow key={table.id}>
                    <TableCell className="font-mono">{table.symbol}</TableCell>
                    <TableCell>
                      <Link href={`/tables/${table.id}`} className="text-primary hover:underline">
                        {table.name}
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
  );
}
