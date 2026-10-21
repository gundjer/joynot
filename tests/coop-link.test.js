import test from 'node:test';
import assert from 'node:assert/strict';
import { CoopLink } from '../public/games/_play/coop-link.js';

function link() {
  return new CoopLink({ role: 'host', token: 'child', urls: {} });
}

test('answers from a previous connection cannot overwrite the current connection', async () => {
  const l = link(), descriptions = [];
  l.peers.set('parent', { id: 'new', pc: { setRemoteDescription: async d => descriptions.push(d) }, ice: [] });
  await l.recv('parent', { t: 'rtc-answer', id: 'old', sdp: { type: 'answer', sdp: 'old' } });
  assert.equal(descriptions.length, 0);
  await l.recv('parent', { t: 'rtc-answer', id: 'new', sdp: { type: 'answer', sdp: 'v=0' } });
  assert.equal(descriptions[0].sdp, 'v=0\r\n');
});

test('ICE candidates from an old connection are never applied to the current peer', () => {
  const l = link(), candidates = [];
  l.peers.set('parent', { id: 'new', pc: { remoteDescription: {}, addIceCandidate: async c => candidates.push(c) }, ice: [] });
  l.recv('parent', { t: 'rtc-ice', id: 'old', c: 'old candidate' });
  l.recv('parent', { t: 'rtc-ice', id: 'new', c: 'new candidate' });
  assert.deepEqual(candidates, ['new candidate']);
});

test('poll finishes processing an offer before processing its ICE candidates and member list', async () => {
  const originalFetch = globalThis.fetch, originalLocation = globalThis.location;
  const calls = [];
  globalThis.location = { href: 'http://localhost/' };
  globalThis.fetch = async () => ({ ok: true, json: async () => ({ members: [], msgs: [
    { from: 'child', body: { t: 'rtc-offer' } }, { from: 'child', body: { t: 'rtc-ice' } },
  ] }) });
  try {
    const l = new CoopLink({ role: 'member', token: 'parent', urls: { poll: '/poll' }, onMembers: () => calls.push('members') });
    l.recv = async (from, body) => { await Promise.resolve(); calls.push(body.t); };
    await l.poll();
    assert.deepEqual(calls, ['rtc-offer', 'rtc-ice', 'members']);
  } finally { globalThis.fetch = originalFetch; globalThis.location = originalLocation; }
});

test('dropping a peer removes it before close callbacks and cancels pending retries', () => {
  const l = link();
  const peer = { pc: { close: () => assert.equal(l.peers.has('parent'), false) }, retry: setTimeout(() => assert.fail('retry survived drop'), 1000) };
  l.peers.set('parent', peer);
  l.drop('parent');
  assert.equal(l.peers.size, 0);
});

test('a network failure preserves signaling and the latest fallback picture for retry', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => { throw new Error('offline'); };
  try {
    const l = new CoopLink({ role: 'host', token: 'child', csrf: 'test', urls: { send: '/send' } });
    const message = { to: 'parent', body: { t: 'rtc-offer' } };
    l.out.push(message); l.pendingState = { cam: 'picture' };
    await assert.rejects(l.flush(), /offline/);
    assert.deepEqual(l.out, [message]);
    assert.deepEqual(l.pendingState, { cam: 'picture' });
  } finally { globalThis.fetch = originalFetch; }
});
