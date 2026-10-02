import { performance } from 'node:perf_hooks';

const baseUrl = (process.env.VTA_PERF_BASE_URL || 'http://127.0.0.1:3102').replace(/\/$/, '');
const runs = Number(process.env.VTA_PERF_RUNS || 8);
const thresholdMs = Number(process.env.VTA_PERF_MAX_HTML_MS || 1500);
const assetPaths = [
  '/assets/branding/momentum-booster-robot.png',
  '/assets/branding/metatrader5.svg',
  '/logo-mark.svg',
];

const request = async (path) => {
  const started = performance.now();
  const response = await fetch(`${baseUrl}${path}`, { headers: { 'cache-control': 'no-cache' } });
  const body = Buffer.from(await response.arrayBuffer());
  const elapsed = performance.now() - started;
  return {
    path,
    status: response.status,
    bytes: body.byteLength,
    elapsed,
    contentType: response.headers.get('content-type') || '',
  };
};

const summarize = (values) => {
  const sorted = [...values].sort((a, b) => a - b);
  const percentile = (p) => sorted[Math.min(sorted.length - 1, Math.ceil(sorted.length * p) - 1)];
  return {
    min: Math.min(...values),
    median: percentile(0.5),
    p95: percentile(0.95),
    max: Math.max(...values),
  };
};

const htmlRuns = [];
for (let i = 0; i < runs; i += 1) htmlRuns.push(await request('/demo'));

const assets = [];
for (const path of assetPaths) assets.push(await request(path));

const htmlTimes = summarize(htmlRuns.map((run) => run.elapsed));
const htmlOk = htmlRuns.every((run) => run.status === 200 && run.bytes > 0);
const assetsOk = assets.every((asset) => asset.status === 200 && asset.bytes > 0);
const htmlThresholdOk = htmlTimes.p95 <= thresholdMs;

console.log(`VTA Dashboard performance test`);
console.log(`base=${baseUrl}`);
console.log(`runs=${runs}`);
console.log(`html_ms min=${htmlTimes.min.toFixed(1)} median=${htmlTimes.median.toFixed(1)} p95=${htmlTimes.p95.toFixed(1)} max=${htmlTimes.max.toFixed(1)}`);
console.log(`html_bytes min=${Math.min(...htmlRuns.map((run) => run.bytes))} max=${Math.max(...htmlRuns.map((run) => run.bytes))}`);
for (const asset of assets) {
  console.log(`asset=${asset.path} status=${asset.status} bytes=${asset.bytes} ms=${asset.elapsed.toFixed(1)} type=${asset.contentType}`);
}
console.log(`assertion_html_status=${htmlOk ? 'PASS' : 'FAIL'}`);
console.log(`assertion_assets=${assetsOk ? 'PASS' : 'FAIL'}`);
console.log(`assertion_html_p95_under_${thresholdMs}ms=${htmlThresholdOk ? 'PASS' : 'FAIL'}`);

if (!htmlOk || !assetsOk || !htmlThresholdOk) process.exitCode = 1;
