// sllm_repair_test.mjs
// Node 18+ (built-in fetch). Ollama must be running locally.
// Primary model (gen+repair): gpt-oss:20b
// Judge model (fluency): set via --judge-model or OLLAMA_JUDGE_MODEL; defaults to primary.

// # 50 trials/language, verbose logs, write CSV
// node sllm_repair_test_v3.mjs 50 --csv out.csv --verbose | tee output.txt

// # Optional: use a separate judge (faster / less circular), threshold 4
// node sllm_repair_test_v3.mjs 50 --judge-model qwen2.5:7b-instruct --judge-threshold 4 --csv out.csv | tee output.txt


import fs from 'fs';

const OLLAMA_HOST = process.env.OLLAMA_HOST || 'http://localhost:11434';
const MODEL = process.env.OLLAMA_MODEL || 'gpt-oss:20b';
const JUDGE_MODEL =
  process.env.OLLAMA_JUDGE_MODEL || MODEL; // you can point to a smaller/faster model

const GENERATION_TEMP = 0.8;
const REPAIR_TEMP = 0.2;
const JUDGE_TEMP = 0.0;
const SLEEP_MS = 150;
const PLACEHOLDER = '____';

// ---- CLI ----
const TRIALS = Number(process.argv[2] || 20);
const args = new Set(process.argv.slice(3));
const CSV_PATH = (() => {
  const i = process.argv.findIndex(a => a === '--csv');
  if (i !== -1 && process.argv[i + 1]) return process.argv[i + 1];
  return 'sllm_results.csv';
})();
const VERBOSE = args.has('--verbose');
const NO_JUDGE = args.has('--no-judge');
const judgeModelFlagIdx = process.argv.findIndex(a => a === '--judge-model');
const JUDGE_MODEL_OVERRIDE = judgeModelFlagIdx !== -1 ? process.argv[judgeModelFlagIdx + 1] : null;
const judgeThresholdIdx = process.argv.findIndex(a => a === '--judge-threshold');
const JUDGE_THRESHOLD = judgeThresholdIdx !== -1 ? Number(process.argv[judgeThresholdIdx + 1]) : 4;

// ---- RNG for reproducibility ----
let seed = 1337;
function rand() { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 2 ** 32; }
function choice(arr) { return arr[Math.floor(rand() * arr.length)]; }

// ---- Ollama ----
async function ollamaGenerate(prompt, temperature, model = MODEL) {
  const t0 = performance.now?.() ?? Date.now();
  const resp = await fetch(`${OLLAMA_HOST}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, prompt, stream: false, options: { temperature } })
  });
  const t1 = performance.now?.() ?? Date.now();
  if (!resp.ok) throw new Error(`Ollama ${resp.status}: ${await resp.text().catch(()=>'')}`);
  const json = await resp.json();
  return { text: (json.response || '').trim(), ms: t1 - t0 };
}

const LANGS = {
  en: {
    genPrompt: `You will generate ONE simple, unambiguous English sentence.
- No proper nouns, no quotes, no lists, no emojis.
- 10–16 words, end with a period.
- Output ONLY the sentence.

Sentence:`,
    repairPrompt: (masked) => `Restore the original sentence by filling the blanks (${PLACEHOLDER}).
Return ONLY the completed sentence (no quotes or explanation). End with a period.

${masked}`,
    judgePrompt: (masked, repaired) => `You are a strict but fair rater.
Given a masked sentence with blanks (${PLACEHOLDER}) and a repaired sentence,
evaluate ONLY grammar, fluency, and whether the repair fits naturally into the masked frame.
Ignore matching the original source; just judge if the repaired sentence sounds natural and coherent.

Return JSON ONLY: {"score": <1-5 integer>, "reasons": "<short English reason>"}.

Masked: ${masked}
Repaired: ${repaired}
JSON:`,
    tokenize: (s) => s.trim().replace(/\s+/g, ' ').split(' ').filter(Boolean),
    normalize: (s) => s.trim().replace(/\s+/g, ' ').toLowerCase(),
    isGoodBlankCandidate: (tok) => /^[a-z][a-z'-]*[a-z]$/.test(tok) && tok.length >= 3,
  },
  ko: {
    genPrompt: `간단하고 모호하지 않은 한국어 문장 하나를 만드세요.
- 고유명사, 따옴표, 목록, 이모지 금지.
- 10~16어절 정도, 마침표로 끝내기.
- 문장만 출력하세요.

문장:`,
    repairPrompt: (masked) => `빈칸(${PLACEHOLDER})을 채워 원래 문장을 복원하세요.
완성된 문장만 출력하세요. 따옴표나 설명 없이, 마침표로 끝내세요.

${masked}`,
    judgePrompt: (masked, repaired) => `다음은 빈칸(${PLACEHOLDER})이 있는 문장과 복원 문장입니다.
복원 문장이 문법적으로 맞고, 자연스럽고, 빈칸 자리에 무리 없이 들어가는지 평가하세요.
원문과 일치 여부는 고려하지 마세요. 자연스러운지/말이 되는지만 판단합니다.

JSON만 출력: {"score": <1~5 정수>, "reasons": "<짧은 한국어 이유>"}.

빈칸 문장: ${masked}
복원 문장: ${repaired}
JSON:`,
    tokenize: (s) => s.trim().replace(/\s+/g, ' ').split(' ').filter(Boolean),
    normalize: (s) => s.trim().replace(/\s+/g, ' '),
    isGoodBlankCandidate: (tok) =>
      /[가-힣]/.test(tok) && tok.length >= 2 && !/^[\p{P}\p{S}]+$/u.test(tok),
  },
};

function stripPunct(tok) {
  return tok.replace(/^[^0-9A-Za-z가-힣]+|[^0-9A-Za-z가-힣]+$/g, '');
}
function pickTwoPositions(tokens, lang) {
  const goodIdx = tokens
    .map((t, i) => ({ t, i }))
    .filter(({ t }) => LANGS[lang].isGoodBlankCandidate(stripPunct(t)));
  if (goodIdx.length < 2) return null;
  let a = choice(goodIdx).i;
  let bOptions = goodIdx.filter(x => Math.abs(x.i - a) >= 1);
  if (bOptions.length === 0) return null;
  let b = choice(bOptions).i;
  if (a > b) [a, b] = [b, a];
  return [a, b];
}
function maskTwoWords(sentence, lang) {
  const toks = LANGS[lang].tokenize(sentence);
  if (toks.length < 6) return null;
  const pos = pickTwoPositions(toks, lang);
  if (!pos) return null;
  const [i, j] = pos;
  const originals = [toks[i], toks[j]];
  const masked = toks.map((t, idx) => (idx === i || idx === j ? PLACEHOLDER : t)).join(' ');
  return { masked, originals, positions: [i, j], tokens: toks };
}

// ---- Metrics ----
function sim(a, b) {
  a = a || ''; b = b || '';
  const m = a.length, n = b.length;
  if (m === 0 && n === 0) return 1;
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost
      );
    }
  }
  const d = dp[m][n];
  return 1 - d / Math.max(m, n);
}
function normalizeToken(tok, lang) {
  const n = stripPunct(tok);
  return lang === 'en' ? n.toLowerCase() : n;
}
function positionScore(repaired, originals, positions, lang) {
  const toks = LANGS[lang].tokenize(repaired);
  let score = 0;
  positions.forEach((pos, idx) => {
    const want = normalizeToken(originals[idx], lang);
    const got = normalizeToken(toks[pos] ?? '', lang);
    if (want && (want === got || sim(want, got) >= 0.85)) score++;
  });
  return score;
}
function containsBothAnywhere(repaired, originals, lang) {
  const text = LANGS[lang].normalize(repaired);
  return originals.every(w => {
    const needle = LANGS[lang].normalize(w);
    if (lang === 'en') {
      const re = new RegExp(`\\b${escapeRegExp(needle)}\\b`, 'i');
      return re.test(text);
    }
    return text.includes(needle);
  });
}
function containsOrdered(repaired, originals, lang) {
  const text = LANGS[lang].normalize(repaired);
  const a = LANGS[lang].normalize(originals[0]);
  const b = LANGS[lang].normalize(originals[1]);
  const ia = lang === 'en'
    ? (text.match(new RegExp(`\\b${escapeRegExp(a)}\\b`, 'i'))?.index ?? -1)
    : text.indexOf(a);
  if (ia < 0) return false;
  const rest = text.slice(ia + a.length);
  const ib = lang === 'en'
    ? (rest.match(new RegExp(`\\b${escapeRegExp(b)}\\b`, 'i'))?.index ?? -1)
    : rest.indexOf(b);
  return ib >= 0;
}
function escapeRegExp(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

// ---- Judge (fluency / naturalness) ----
function extractJsonBlock(txt) {
  const start = txt.indexOf('{');
  const end = txt.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) return null;
  const block = txt.slice(start, end + 1);
  try { return JSON.parse(block); } catch { return null; }
}
async function judgeFluency(masked, repaired, lang) {
  const model = JUDGE_MODEL_OVERRIDE || JUDGE_MODEL;
  const prompt = LANGS[lang].judgePrompt(masked, repaired);
  const { text, ms } = await ollamaGenerate(prompt, JUDGE_TEMP, model);
  const obj = extractJsonBlock(text) || {};
  const score = Number.isFinite(obj.score) ? Math.max(1, Math.min(5, Math.round(obj.score))) : null;
  const ok = score != null ? score >= JUDGE_THRESHOLD : null;
  const reasons = typeof obj.reasons === 'string' ? obj.reasons : '';
  return { score, ok, reasons, judge_ms: ms, judge_model: model, raw: text };
}

// ---- Helpers ----
async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
async function generateSentence(lang) {
  const { text, ms } = await ollamaGenerate(LANGS[lang].genPrompt + '\n', GENERATION_TEMP);
  const clean = text.replace(/["“”']/g, '').trim();
  const withPeriod = /\.$/.test(clean) ? clean : clean + '.';
  return { sentence: withPeriod, ms };
}
async function repairSentence(masked, lang) {
  const { text, ms } = await ollamaGenerate(LANGS[lang].repairPrompt(masked), REPAIR_TEMP);
  const repaired = text.replace(/^[“"']|[”"']$/g, '').trim();
  return { repaired, ms };
}

async function runOnce(lang) {
  for (let tries = 0; tries < 4; tries++) {
    const g = await generateSentence(lang);
    const m = maskTwoWords(g.sentence, lang);
    if (!m) { await sleep(SLEEP_MS); continue; }
    const r = await repairSentence(m.masked, lang);

    const exact = LANGS[lang].normalize(r.repaired) === LANGS[lang].normalize(g.sentence);
    const slotScore = positionScore(r.repaired, m.originals, m.positions, lang); // 0..2
    const anywhere = containsBothAnywhere(r.repaired, m.originals, lang);
    const ordered = containsOrdered(r.repaired, m.originals, lang);

    let fluency = { score: null, ok: null, reasons: '', judge_ms: 0, judge_model: '' };
    if (!NO_JUDGE) {
      fluency = await judgeFluency(m.masked, r.repaired, lang);
    }

    return {
      lang,
      sentence: g.sentence,
      masked: m.masked,
      originals: m.originals,
      positions: m.positions,
      repaired: r.repaired,
      gen_ms: g.ms,
      rep_ms: r.ms,
      exact,
      slotScore,
      anywhere,
      ordered,
      fluency_score: fluency.score,
      fluency_ok: fluency.ok,
      fluency_reason: fluency.reasons,
      judge_ms: fluency.judge_ms,
      judge_model: fluency.judge_model,
    };
  }
  throw new Error(`Failed to get a suitable ${lang} sentence after retries.`);
}

// ---- CSV ----
function csvEscape(val) {
  const s = String(val ?? '');
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}
function writeCsvHeader(stream) {
  stream.write([
    'trial','lang',
    'sentence','masked','repaired',
    'idx1','idx2','orig1','orig2',
    'exact','slotScore','anywhere','ordered',
    'fluency_score','fluency_ok','fluency_reason',
    'gen_ms','rep_ms','judge_ms','judge_model'
  ].join(',') + '\n');
}
function writeCsvRow(stream, trial, row) {
  const [i1, i2] = row.positions;
  const [o1, o2] = row.originals;
  const fields = [
    trial, row.lang,
    row.sentence, row.masked, row.repaired,
    i1, i2, o1, o2,
    Number(row.exact), row.slotScore, Number(row.anywhere), Number(row.ordered),
    row.fluency_score ?? '', row.fluency_ok ?? '', row.fluency_reason ?? '',
    Math.round(row.gen_ms), Math.round(row.rep_ms), Math.round(row.judge_ms || 0), row.judge_model || ''
  ];
  stream.write(fields.map(csvEscape).join(',') + '\n');
}

// ---- Main ----
async function main() {
  const csv = fs.createWriteStream(CSV_PATH, { flags: 'w' });
  writeCsvHeader(csv);

  const stats = {
    en: { trials: 0, exact: 0, slot2: 0, slot1plus: 0, anywhere: 0, ordered: 0, flu_ok: 0, flu_sum: 0 },
    ko: { trials: 0, exact: 0, slot2: 0, slot1plus: 0, anywhere: 0, ordered: 0, flu_ok: 0, flu_sum: 0 },
  };

  const judgeModelInUse = JUDGE_MODEL_OVERRIDE || JUDGE_MODEL;
  console.log(`Running ${TRIALS} trials/language`);
  console.log(`Gen/Repair model: ${MODEL}`);
  console.log(`Judge model: ${NO_JUDGE ? '(disabled)' : judgeModelInUse}  (OK if score ≥ ${JUDGE_THRESHOLD})`);
  console.log(`CSV -> ${CSV_PATH}\n`);

  let trial = 0;
  for (let t = 1; t <= TRIALS; t++) {
    for (const lang of ['en','ko']) {
      trial++;
      try {
        const r = await runOnce(lang);

        const s = stats[lang];
        s.trials++;
        if (r.exact) s.exact++;
        if (r.slotScore === 2) s.slot2++;
        if (r.slotScore >= 1) s.slot1plus++;
        if (r.anywhere) s.anywhere++;
        if (r.ordered) s.ordered++;
        if (r.fluency_score != null) s.flu_sum += r.fluency_score;
        if (r.fluency_ok) s.flu_ok++;

        writeCsvRow(csv, trial, r);

        const head = `[${t}/${TRIALS}] ${lang.toUpperCase()}`;
        const flu = NO_JUDGE ? '' :
          ` flu=${r.fluency_score ?? 'NA'}/${5} ok=${r.fluency_ok ?? 'NA'}`;

        if (VERBOSE || !r.exact || (!NO_JUDGE && !r.fluency_ok)) {
          console.log(
            `${head} exact=${r.exact} slot=${r.slotScore}/2 any=${r.anywhere} ord=${r.ordered}${flu} ` +
            `(gen=${Math.round(r.gen_ms)}ms, rep=${Math.round(r.rep_ms)}ms` +
            `${NO_JUDGE ? '' : `, judge=${Math.round(r.judge_ms)}ms`})\n` +
            `  GT : ${r.sentence}\n` +
            `  M  : ${r.masked}\n` +
            `  R  : ${r.repaired}\n` +
            (NO_JUDGE ? '' : `  J  : ${r.fluency_reason}\n`)
          );
        } else {
          process.stdout.write(
            `${head} ✓ exact slot=2/2${NO_JUDGE ? '' : ' flu✓'} | ` +
            `gen=${Math.round(r.gen_ms)}ms rep=${Math.round(r.rep_ms)}ms      \r`
          );
        }
      } catch (e) {
        console.error(`\n${lang} trial ${t} error: ${e.message}`);
      }
      await sleep(SLEEP_MS);
    }
  }

  console.log('\n=== Summary ===');
  for (const lang of ['en','ko']) {
    const s = stats[lang];
    const pct = (n) => s.trials ? (100*n/s.trials).toFixed(1) + '%' : '0.0%';
    const fluAvg = s.trials && s.flu_sum ? (s.flu_sum / s.trials).toFixed(2) : 'NA';
    console.log(
      `${lang.toUpperCase()} trials=${s.trials} ` +
      `| exact=${s.exact} (${pct(s.exact)}) ` +
      `| slot2=${s.slot2} (${pct(s.slot2)}) ` +
      `| slot1+=${s.slot1plus} (${pct(s.slot1plus)}) ` +
      `| anywhere=${s.anywhere} (${pct(s.anywhere)}) ` +
      `| ordered=${s.ordered} (${pct(s.ordered)}) ` +
      `| flu_ok=${s.flu_ok} (${pct(s.flu_ok)}) avg_flu=${fluAvg}`
    );
  }
  csv.end();
  console.log(`\nCSV saved to ${CSV_PATH}`);
}

main().catch(err => { console.error(err); process.exit(1); });
