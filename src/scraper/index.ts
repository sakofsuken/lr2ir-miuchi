import { runPlayers } from './tasks/players';
import { runTables } from './tasks/tables';
import { runCharts } from './tasks/charts';
import { runGhosts } from './tasks/ghosts';

const TASKS: Record<string, () => Promise<void>> = {
  players: runPlayers,
  tables: runTables,
  charts: runCharts,
  ghosts: runGhosts,
};

async function main(): Promise<void> {
  const taskName = process.argv[2];

  if (!taskName || !(taskName in TASKS)) {
    console.error(`Usage: tsx src/scraper/index.ts <task>`);
    console.error(`Available tasks: ${Object.keys(TASKS).join(', ')}`);
    process.exit(1);
  }

  const startTime = Date.now();
  console.log(`[scraper] Starting task: ${taskName}`);

  try {
    await TASKS[taskName]();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[scraper] Task ${taskName} failed: ${message}`);
    process.exit(1);
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`[scraper] Task ${taskName} finished in ${elapsed}s`);
}

main();
