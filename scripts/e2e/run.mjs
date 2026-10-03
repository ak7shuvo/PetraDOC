// Usage: npm run build && npm run e2e [-- testName ...]   (E2E_BROWSER=firefox|webkit optional)
import { failures, startServer, total } from "./lib.mjs";
import { runAll } from "./tests.mjs";

const srv = await startServer();
try { await runAll(process.argv.slice(2).length ? process.argv.slice(2) : undefined); }
finally { srv.kill(); }
console.log(`\n${total() - failures()}/${total()} checks passed`);
process.exit(failures() ? 1 : 0);
