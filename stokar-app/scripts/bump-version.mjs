#!/usr/bin/env node
/**
 * Sobe a versão do app em um só lugar: package.json, app.json e CHANGELOG.md.
 *
 *   npm run release -- patch   # 1.0.0 -> 1.0.1 (correções)
 *   npm run release -- minor   # 1.0.0 -> 1.1.0 (novidades compatíveis)
 *   npm run release -- major   # 1.0.0 -> 2.0.0 (mudanças que quebram)
 *   npm run release -- 1.4.2   # versão exata
 *
 * O número do build (versionCode / buildNumber) NÃO fica aqui: o EAS incrementa
 * sozinho a cada build de produção (eas.json: appVersionSource "remote" + autoIncrement).
 */
import { readFileSync, writeFileSync } from 'node:fs';

const arg = process.argv[2];
const read = (file) => JSON.parse(readFileSync(new URL(`../${file}`, import.meta.url), 'utf8'));
const write = (file, data) => writeFileSync(new URL(`../${file}`, import.meta.url), `${JSON.stringify(data, null, 2)}\n`);

const pkg = read('package.json');
const app = read('app.json');
const [major, minor, patch] = pkg.version.split('.').map(Number);

const next =
  arg === 'major'
    ? `${major + 1}.0.0`
    : arg === 'minor'
      ? `${major}.${minor + 1}.0`
      : arg === 'patch'
        ? `${major}.${minor}.${patch + 1}`
        : /^\d+\.\d+\.\d+$/.test(arg ?? '')
          ? arg
          : null;

if (!next) {
  console.error('Uso: npm run release -- <patch|minor|major|x.y.z>');
  process.exit(1);
}

pkg.version = next;
app.expo.version = next;
write('package.json', pkg);
write('app.json', app);

const changelogUrl = new URL('../CHANGELOG.md', import.meta.url);
const changelog = readFileSync(changelogUrl, 'utf8');
const today = new Date().toISOString().slice(0, 10);
const entry = `## ${next} — ${today}\n\n### Adicionado\n- \n\n### Corrigido\n- \n\n`;
writeFileSync(changelogUrl, changelog.replace(/^## /m, `${entry}## `));

console.log(`Versão ${next}. Preencha o CHANGELOG.md e depois:`);
console.log(`  git commit -am "release: app v${next}" && git tag app-v${next}`);
