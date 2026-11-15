import { test } from 'node:test';
import assert from 'node:assert/strict';
import { lockoutSeconds, newKey, open, sameString, seal, stretchSecret } from '../src/lib/cryptoCore.ts';

test('PIN hashing is salted: same PIN, different salt, different hash', () => {
  const a = stretchSecret('1234', 'c2FsdEE=', 50);
  const b = stretchSecret('1234', 'c2FsdEI=', 50);
  assert.notEqual(a, b);
  assert.equal(a, stretchSecret('1234', 'c2FsdEE=', 50));
  assert.notEqual(a, stretchSecret('1235', 'c2FsdEE=', 50));
});

test('string comparison', () => {
  assert.ok(sameString('abc', 'abc'));
  assert.ok(!sameString('abc', 'abd'));
  assert.ok(!sameString('abc', 'ab'));
});

test('wrong-PIN waiting time grows and is capped', () => {
  assert.equal(lockoutSeconds(4), 0);
  assert.equal(lockoutSeconds(5), 30);
  assert.equal(lockoutSeconds(6), 60);
  assert.equal(lockoutSeconds(20), 900);
});

test('saved data opens only with the right key and is not readable as text', () => {
  const k = newKey();
  const box = seal(k, { journal: 'private words' });
  assert.ok(!box.ciphertext.includes('private'));
  assert.deepEqual(open(k, box.ciphertext, box.nonce), { journal: 'private words' });
  assert.equal(open(newKey(), box.ciphertext, box.nonce), null);
});
