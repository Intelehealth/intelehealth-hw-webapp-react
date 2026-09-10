/**
 * Tests for the cross-run memory: line-independent identity, changed-line
 * scoping, and the mechanical "the flagged code is gone" check.
 *
 * The failure these guard against is live, not hypothetical: on testbed#22 a
 * pure line shift re-minted every finding id and the bot reposted findings it
 * had already made; on hw-webapp-react#318 the model changed its own anchor
 * span between runs with the same effect.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import {
  changedLines,
  fileLineHashes,
  identify,
  normalizeLine,
  scopeMap,
} from '../lib/memory.mjs';
import * as awaitHash from '../lib/gate.mjs';

const HOOK = `import { useEffect, useState } from 'react';

const NOTES_ENDPOINT = '/api/visits';

export const useVisitNotes = (visitId: string) => {
  const [notes, setNotes] = useState([]);

  const fetchNotes = async () => {
    try {
      const response = await fetch(NOTES_ENDPOINT);
      setNotes(response);
    } catch (error) {
      console.log('boom', error);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, [visitId]);

  return { notes };
};
`;

test('scopeMap resolves symbols in this repo’s arrow-function style', () => {
  const map = scopeMap(HOOK);
  const lineOf = text => HOOK.split('\n').findIndex(l => l.includes(text));
  assert.match(map[lineOf("console.log('boom'")], /useVisitNotes>fetchNotes/);
  assert.match(map[lineOf('fetchNotes();')], /useVisitNotes/);
});

test('the identity survives lines being inserted above the finding', () => {
  const finding = f => ({
    ruleId: 'STD-008',
    file: 'src/hooks/useVisitNotes.ts',
    ...f,
  });
  const lineOf = (src, text) =>
    src.split('\n').findIndex(l => l.includes(text)) + 1;

  const shifted = '/** docs */\n/** more docs */\n\n' + HOOK;
  const before = identify(
    finding({ line: lineOf(HOOK, "console.log('boom'") }),
    HOOK
  );
  const after = identify(
    finding({ line: lineOf(shifted, "console.log('boom'") }),
    shifted
  );
  assert.equal(
    before.bucket,
    after.bucket,
    'a line shift must not re-mint the id'
  );
});

test('two rules on the same line stay distinct findings', () => {
  const line =
    HOOK.split('\n').findIndex(l => l.includes("console.log('boom'")) + 1;
  const a = identify({ ruleId: 'STD-008', file: 'x.ts', line }, HOOK);
  const b = identify({ ruleId: 'ASYNC-002', file: 'x.ts', line }, HOOK);
  assert.notEqual(a.bucket, b.bucket);
});

test('a missing source file degrades to a whole-file bucket, never a crash', () => {
  const { bucket, anchors } = identify(
    { ruleId: 'SEC-001', file: 'gone.ts', line: 10 },
    null
  );
  assert.ok(bucket);
  assert.deepEqual(anchors, []);
});

test('the anchor window covers the line above, so an off-by-one report still anchors the real code', () => {
  // Observed live: the model flagged the `return` line below the actual
  // `message!` offender. The window must include the line above the reported
  // one so the fix is still detected as touching the region.
  const src =
    'const a = 1;\nconst preview = message!.slice(0, 40);\nreturn `x ${preview}`;\n';
  const { anchors } = identify(
    { ruleId: 'TS-002', file: 'x.ts', line: 3 },
    src
  );
  const { hash32 } = awaitHash;
  assert.ok(
    anchors.includes(hash32('const preview = message!.slice(0, 40);')),
    'the line above the reported one must be anchored'
  );
});

test('normalizeLine treats reformatting as the same line', () => {
  assert.equal(
    normalizeLine('   setNotes(  payload.notes )  ;'),
    normalizeLine('setNotes( payload.notes ) ;')
  );
});

test('changedLines reports only the lines a commit touched, whitespace ignored', () => {
  const dir = mkdtempSync(join(tmpdir(), 'memory-git-'));
  const git = args => execFileSync('git', args, { cwd: dir, encoding: 'utf8' });
  try {
    git(['init', '-q']);
    git(['config', 'user.email', 't@t']);
    git(['config', 'user.name', 't']);
    writeFileSync(join(dir, 'a.ts'), 'one\ntwo\nthree\nfour\n');
    git(['add', '.']);
    git(['commit', '-qm', 'base']);
    const base = git(['rev-parse', 'HEAD']).trim();

    // Reindent line two (whitespace only) and rewrite line three.
    writeFileSync(join(dir, 'a.ts'), 'one\n  two\nTHREE\nfour\n');
    git(['add', '.']);
    git(['commit', '-qm', 'change']);
    const head = git(['rev-parse', 'HEAD']).trim();

    const ranges = changedLines(base, head, dir);
    assert.ok(ranges.has('a.ts'));
    assert.ok(ranges.get('a.ts').has(3), 'a rewritten line is in scope');
    assert.ok(
      !ranges.get('a.ts').has(2),
      'a whitespace-only change must not re-open a line'
    );
    assert.ok(!ranges.get('a.ts').has(1));

    assert.equal(
      changedLines('0000000', head, dir),
      null,
      'an unreachable sha must return null (fail open), not an empty map'
    );
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('normalizeLine handles null, undefined, and empty input without throwing', () => {
  assert.equal(normalizeLine(null), '');
  assert.equal(normalizeLine(undefined), '');
  assert.equal(normalizeLine(''), '');
});

test('fileLineHashes returns a Set of hashes for an existing file, skipping short lines', () => {
  const dir = mkdtempSync(join(tmpdir(), 'memory-hash-'));
  const path = join(dir, 'test.ts');
  // 'ok' is 2 chars — below the 6-char threshold and must be excluded.
  writeFileSync(path, 'const a = 1;\nconst b = 2;\nok\n');
  try {
    const hashes = fileLineHashes(path);
    assert.ok(hashes instanceof Set, 'must return a Set');
    const { hash32 } = awaitHash;
    assert.ok(hashes.has(hash32('const a = 1;')), 'long line must be present');
    assert.ok(hashes.has(hash32('const b = 2;')), 'long line must be present');
    assert.ok(!hashes.has(hash32('ok')), 'short line must be absent');
    assert.equal(hashes.size, 2);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('fileLineHashes returns null for a non-existent file', () => {
  assert.equal(fileLineHashes('/this/path/does/not/exist/at/all.ts'), null);
});

test('identify with endLine extends the anchor window to cover additional lines', () => {
  const src =
    'const a = 1;\nconst b = 2;\nconst c = 3;\nconst d = 4;\nconst e = 5;\n';
  const finding = { ruleId: 'TST-001', file: 'x.ts', line: 3 };
  const { hash32 } = awaitHash;

  const withEnd = identify({ ...finding, endLine: 5 }, src);
  const without = identify(finding, src);

  const dHash = hash32('const d = 4;');
  assert.ok(
    withEnd.anchors.includes(dHash),
    'endLine=5 must include line 4 in the anchor window'
  );
  assert.ok(
    !without.anchors.includes(dHash),
    'without endLine, line 4 falls outside the window'
  );
});

test('identify with endLine <= line behaves identically to no endLine', () => {
  const src = 'const a = 1;\nconst b = 2;\nconst c = 3;\n';
  const finding = { ruleId: 'TST-001', file: 'x.ts', line: 2 };
  const base = identify(finding, src);
  const same = identify({ ...finding, endLine: 2 }, src); // endLine === line
  const less = identify({ ...finding, endLine: 1 }, src); // endLine < line
  assert.equal(same.bucket, base.bucket);
  assert.deepEqual(same.anchors, base.anchors);
  assert.equal(less.bucket, base.bucket);
  assert.deepEqual(less.anchors, base.anchors);
});

test('changedLines marks the insertion point when a line is purely deleted', () => {
  const dir = mkdtempSync(join(tmpdir(), 'memory-del-'));
  const git = args => execFileSync('git', args, { cwd: dir, encoding: 'utf8' });
  try {
    git(['init', '-q']);
    git(['config', 'user.email', 't@t']);
    git(['config', 'user.name', 't']);
    writeFileSync(join(dir, 'a.ts'), 'one\ntwo\nthree\nfour\n');
    git(['add', '.']);
    git(['commit', '-qm', 'base']);
    const base = git(['rev-parse', 'HEAD']).trim();

    // Delete "two" — produces a pure-deletion hunk (+start,0) in the diff.
    writeFileSync(join(dir, 'a.ts'), 'one\nthree\nfour\n');
    git(['add', '.']);
    git(['commit', '-qm', 'delete line 2']);
    const head = git(['rev-parse', 'HEAD']).trim();

    const ranges = changedLines(base, head, dir);
    assert.ok(ranges !== null, 'must return a map, not null');
    assert.ok(ranges.has('a.ts'));
    // git reports +1,0 for deleting old line 2: the insertion point in the new
    // file is after line 1 ("one"), so the set entry is 1.
    const set = ranges.get('a.ts');
    assert.ok(
      set.has(1) || set.has(2),
      'the insertion point adjacent to a deletion must be marked in scope'
    );
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
