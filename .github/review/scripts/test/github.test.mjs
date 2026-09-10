/**
 * Unit tests for lib/github.mjs — commentableLines.
 *
 * The network-dependent functions (rest, restAll, graphql, createReview, …)
 * are exercised end-to-end in post-review.e2e.test.mjs via the stub server.
 * commentableLines is a pure patch-parsing function and is tested directly.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { commentableLines } from '../lib/github.mjs';

test('commentableLines returns an empty set for falsy or empty patches', () => {
  assert.equal(commentableLines(null).size, 0);
  assert.equal(commentableLines(undefined).size, 0);
  assert.equal(commentableLines('').size, 0);
});

test('commentableLines includes added (+) lines with correct line numbers', () => {
  const patch = '@@ -0,0 +1,3 @@\n+line one\n+line two\n+line three';
  const lines = commentableLines(patch);
  assert.ok(lines.has(1));
  assert.ok(lines.has(2));
  assert.ok(lines.has(3));
  assert.equal(lines.size, 3);
});

test('commentableLines includes context ( ) lines', () => {
  const patch = '@@ -1,3 +1,3 @@\n const a = 1;\n+const b = 2;\n const c = 3;';
  const lines = commentableLines(patch);
  assert.ok(lines.has(1), 'context line before addition');
  assert.ok(lines.has(2), 'added line');
  assert.ok(lines.has(3), 'context line after addition');
});

test('commentableLines excludes removed (-) lines', () => {
  const patch = '@@ -1,2 +1,1 @@\n-const removed = 1;\n const kept = 2;';
  const lines = commentableLines(patch);
  assert.equal(lines.size, 1);
  assert.ok(lines.has(1), 'the surviving context line must be at position 1');
});

test('commentableLines skips the no-newline-at-end-of-file marker', () => {
  const patch = '@@ -1,1 +1,1 @@\n+const x = 1;\n\\ No newline at end of file';
  const lines = commentableLines(patch);
  assert.equal(lines.size, 1);
  assert.ok(lines.has(1));
});

test('commentableLines tracks correct line numbers across multiple hunks', () => {
  const patch = [
    '@@ -1,1 +1,2 @@',
    ' const a = 1;',
    '+const b = 2;',
    '@@ -10,1 +11,2 @@',
    ' const x = 10;',
    '+const y = 11;',
  ].join('\n');
  const lines = commentableLines(patch);
  assert.ok(lines.has(1), 'context in first hunk');
  assert.ok(lines.has(2), 'addition in first hunk');
  assert.ok(lines.has(11), 'context in second hunk');
  assert.ok(lines.has(12), 'addition in second hunk');
});
