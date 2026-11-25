// Fails when the source picks up one of the patterns DESIGN.md rules out.
// Run with `npm run check`. It reads src/ and data/, never dist/.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';

const everywhere = [
  [/[←-⇿➔➜➡]|&[lr]arr;/, 'arrow glyph'],
  [/[·•∙]|&middot;|&bull;/, 'dot used as a separator'],
  [/[✦✧✨★☆]/, 'sparkle or star glyph'],
  [/—|&mdash;/, 'em dash'],
  [/Instrument Serif/i, 'Instrument Serif'],
  [/\bquiet(ly|er)?\b/i, 'the word "quiet"'],
  [/\breal\b/i, 'the word "real"'],
];

const inCode = [
  [/IntersectionObserver|ScrollTrigger|data-reveal|animation-timeline\s*:\s*view/, 'scroll-triggered reveal'],
  [/box-shadow|text-shadow|drop-shadow/, 'shadow'],
  [/border-radius/, 'rounded corner'],
  [/blur\(/, 'blur filter'],
  [/gradient\(/, 'gradient'],
  [/text-transform\s*:\s*uppercase/, 'uppercase label'],
  [/border-(left|inline-start)\s*:\s*[2-9]/, 'coloured side border'],
  [/font-style\s*:\s*italic/, 'italic set in CSS (use <em> in prose instead)'],
];

const codeTypes = new Set(['.astro', '.css', '.ts', '.js', '.mjs']);
const textTypes = new Set([...codeTypes, '.json', '.md']);

function* files(dir) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) yield* files(path);
    else if (textTypes.has(extname(path))) yield path;
  }
}

const problems = [];

for (const root of ['src', 'data']) {
  for (const path of files(root)) {
    const rules = codeTypes.has(extname(path)) ? [...everywhere, ...inCode] : everywhere;
    readFileSync(path, 'utf8')
      .split('\n')
      .forEach((line, i) => {
        for (const [pattern, name] of rules) {
          if (pattern.test(line)) problems.push(`${path}:${i + 1}  ${name}`);
        }
      });
  }
}

// Copy: a sentence of one or two words inside a longer passage.
function walk(value, where) {
  if (typeof value === 'string') {
    const sentences = value.split(/(?<=[.!?])\s+/);
    if (sentences.length < 2) return;
    for (const s of sentences) {
      if (s.trim().split(/\s+/).length <= 2) problems.push(`data/profile.json ${where}  two-word sentence: "${s}"`);
    }
  } else if (value && typeof value === 'object') {
    for (const [key, child] of Object.entries(value)) walk(child, `${where}.${key}`);
  }
}
walk(JSON.parse(readFileSync('data/profile.json', 'utf8')), 'profile');

if (problems.length > 0) {
  console.error(problems.join('\n'));
  console.error(`\n${problems.length} design check${problems.length === 1 ? '' : 's'} failed. See DESIGN.md.`);
  process.exit(1);
}
console.log('Design checks passed.');
