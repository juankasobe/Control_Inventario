import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { after, before, beforeEach, test } from 'node:test';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} from '@firebase/rules-unit-testing';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  runTransaction,
  setDoc,
  Timestamp,
  updateDoc,
} from 'firebase/firestore';
const PROJECT_ID = 'demo-control-inventario';
const RULES_PATH = new URL('../firestore.rules', import.meta.url);
const REPO_ROOT = new URL('../', import.meta.url);
const IGNORED_CANDIDATE_PATH = /^(?:\.git|node_modules|dist|out|coverage|\.angular|\.cache)(?:\/|$)/;
const SECRET_FILENAME = /(^|\/)(?:\.env(?:\..*)?|.*(?:service.?account|firebase-adminsdk|credential).*\.(?:json|pem|key)|.*\.(?:pem|key))$/i;
const now = Timestamp.fromMillis(1_704_067_200_000);
let testEnv;
before(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: { rules: await readFile(RULES_PATH, 'utf8') },
  });
});
beforeEach(async () => testEnv.clearFirestore());
after(async () => testEnv?.cleanup());
const access = (uid, status = 'approved', extra = {}) => ({
  uid,
  label: `Test ${uid}`,
  status,
  ...extra,
});
const product = (extra = {}) => ({
  nombre: 'Widget',
  cantidad: 5,
  descripcion: 'A test product',
  ...extra,
});
const movement = (productoId, extra = {}) => ({
  productoId,
  numeroFactura: 'F-100',
  fecha: '2024-01-01',
  tipo: 'entrada',
  stockAnterior: 5,
  stockNuevo: 7,
  descripcion: 'Restock',
  timestamp: now,
  ...extra,
});
const dbFor = (uid) => testEnv.authenticatedContext(uid).firestore();
const anonymousDb = () => testEnv.unauthenticatedContext().firestore();
const candidatePaths = () => execFileSync(
  'git',
  ['ls-files', '-co', '--exclude-standard', '-z'],
  { encoding: 'utf8' },
).split('\0').filter((path) => path && !IGNORED_CANDIDATE_PATH.test(path) && !SECRET_FILENAME.test(path));
async function seed(...entries) {
  await testEnv.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();
    await Promise.all(
      entries.map(({ path, data }) => setDoc(doc(db, ...path), data))
    );
  });
}
test('an approved UID can use the current product workflow and an atomic stock transaction', async () => {
  const uid = 'approved-products';
  await seed(
    { path: ['deviceAccess', uid], data: access(uid) },
    { path: ['Productos', 'p-1'], data: product() }
  );
  const db = dbFor(uid);
  const productRef = doc(db, 'Productos', 'p-1');
  await assertSucceeds(getDoc(productRef));
  await assertSucceeds(getDocs(collection(db, 'Productos')));
  await assertSucceeds(setDoc(doc(db, 'Productos', 'p-new'), product({ cantidad: 1 })));
  await assertSucceeds(updateDoc(productRef, { nombre: 'Updated widget' }));
  await assertSucceeds(updateDoc(productRef, { cantidad: 0 }));
  await assertSucceeds(deleteDoc(doc(db, 'Productos', 'p-new')));

  await assertSucceeds(runTransaction(db, async (transaction) => {
    const productSnapshot = await transaction.get(productRef);
    assert.equal(productSnapshot.data().cantidad, 0);
    transaction.update(productRef, { cantidad: 2 });
    transaction.set(
      doc(db, 'Productos', 'p-1', 'cambiosStock', 'm-tx'),
      movement('p-1', { stockAnterior: 0, stockNuevo: 2 })
    );
  }));
});

test('approved clients can store large finite product and movement numbers', async () => {
  const uid = 'large-finite-values';
  const large = Number.MAX_VALUE;
  await seed({ path: ['deviceAccess', uid], data: access(uid) });
  const db = dbFor(uid);

  await assertSucceeds(setDoc(doc(db, 'Productos', 'large'), product({ cantidad: large })));
  await assertSucceeds(
    setDoc(
      doc(db, 'Productos', 'large', 'cambiosStock', 'large-entry'),
      movement('large', { stockAnterior: 1, stockNuevo: large }),
    ),
  );
});

test('unauthenticated and untrusted authorization states cannot read inventory', async () => {
  const states = [
    ['missing', null],
    ['pending', access('pending', 'pending')],
    ['revoked', access('revoked', 'revoked')],
    ['wrong-label-type', { uid: 'wrong-label-type', label: 42, status: 'approved' }],
    ['missing-label', { uid: 'missing-label', status: 'approved' }],
    ['empty-label', access('empty-label', 'approved', { label: '' })],
    ['extra-field', access('extra-field', 'approved', { extra: true })],
    ['wrong-status', access('wrong-status', 'waiting')],
    ['mismatched', access('different-uid')],
  ];
  await seed(
    { path: ['Productos', 'protected'], data: product() },
    ...states
      .filter(([, record]) => record)
      .map(([uid, record]) => ({ path: ['deviceAccess', uid], data: record }))
  );

  await assertFails(getDoc(doc(anonymousDb(), 'Productos', 'protected')));
  for (const [uid] of states) {
    await assertFails(getDoc(doc(dbFor(uid), 'Productos', 'protected')));
  }
});

test('clients can bootstrap only their own access record and cannot list or mutate the allowlist', async () => {
  const uid = 'pending-client';
  await seed(
    { path: ['deviceAccess', uid], data: access(uid, 'pending') },
    { path: ['deviceAccess', 'other-client'], data: access('other-client') },
    { path: ['Productos', 'protected'], data: product() }
  );
  const db = dbFor(uid);
  const ownRef = doc(db, 'deviceAccess', uid);

  await assertSucceeds(getDoc(ownRef));
  await assertSucceeds(getDoc(doc(dbFor('unregistered-client'), 'deviceAccess', 'unregistered-client')));
  await assertFails(getDoc(doc(db, 'deviceAccess', 'other-client')));
  await assertFails(getDocs(collection(db, 'deviceAccess')));
  await assertFails(setDoc(doc(db, 'deviceAccess', 'new-client'), access('new-client')));
  await assertFails(setDoc(ownRef, access(uid, 'approved')));
  await assertFails(updateDoc(ownRef, { status: 'approved' }));
  await assertFails(deleteDoc(ownRef));
  await assertFails(getDoc(doc(db, 'Productos', 'protected')));
});

test('a reinstall receives no authorization from a previously approved UID', async () => {
  await seed(
    { path: ['deviceAccess', 'old-installation'], data: access('old-installation') },
    { path: ['Productos', 'protected'], data: product() }
  );
  await assertSucceeds(getDoc(doc(dbFor('old-installation'), 'Productos', 'protected')));
  await assertFails(getDoc(doc(dbFor('new-installation'), 'Productos', 'protected')));
});

test('invalid product shapes and ranges are denied', async () => {
  const uid = 'invalid-products';
  await seed(
    { path: ['deviceAccess', uid], data: access(uid) },
    { path: ['Productos', 'existing'], data: product() }
  );
  const db = dbFor(uid);
  const invalidProducts = [
    ['missing-field', { nombre: 'Widget', cantidad: 1 }],
    ['extra-field', product({ extra: true })],
    ['wrong-name-type', product({ nombre: 7 })],
    ['wrong-quantity-type', product({ cantidad: '5' })],
    ['nan-quantity', product({ cantidad: Number.NaN })],
    ['infinity-quantity', product({ cantidad: Number.POSITIVE_INFINITY })],
    ['zero-on-create', product({ cantidad: 0 })],
    ['negative-on-create', product({ cantidad: -1 })],
  ];
  for (const [id, value] of invalidProducts) {
    await assertFails(setDoc(doc(db, 'Productos', id), value));
  }
  await assertFails(updateDoc(doc(db, 'Productos', 'existing'), { cantidad: -1 }));
  await assertFails(updateDoc(doc(db, 'Productos', 'existing'), { extra: true }));
});

test('approved clients can create and read movements but cannot alter them', async () => {
  const uid = 'movement-client';
  await seed(
    { path: ['deviceAccess', uid], data: access(uid) },
    { path: ['Productos', 'p-1'], data: product() },
    { path: ['Productos', 'p-1', 'cambiosStock', 'existing'], data: movement('p-1') }
  );
  const db = dbFor(uid);
  const movementRef = doc(db, 'Productos', 'p-1', 'cambiosStock', 'created');
  const existingRef = doc(db, 'Productos', 'p-1', 'cambiosStock', 'existing');

  await assertSucceeds(getDocs(collection(db, 'Productos', 'p-1', 'cambiosStock')));
  await assertSucceeds(setDoc(movementRef, movement('p-1')));
  await assertFails(updateDoc(existingRef, { descripcion: 'tampered' }));
  await assertFails(deleteDoc(existingRef));
});

test('movement shape, range, direction, date, and parent-ID violations are denied', async () => {
  const uid = 'invalid-movements';
  await seed(
    { path: ['deviceAccess', uid], data: access(uid) },
    { path: ['Productos', 'p-1'], data: product() }
  );
  const db = dbFor(uid);
  const { timestamp, ...missingTimestamp } = movement('p-1');
  const invalidMovements = [
    ['extra', movement('p-1', { extra: true })],
    ['missing-field', missingTimestamp],
    ['wrong-text-type', movement('p-1', { numeroFactura: 100 })],
    ['wrong-date', movement('p-1', { fecha: 'not-a-date' })],
    ['date-range', movement('p-1', { fecha: '2024-13-01' })],
    ['wrong-type', movement('p-1', { tipo: 'compra' })],
    ['negative-stock', movement('p-1', { stockAnterior: -1 })],
    ['nan-stock', movement('p-1', { stockAnterior: Number.NaN })],
    ['entry-direction', movement('p-1', { stockNuevo: 4 })],
    ['exit-direction', movement('p-1', { tipo: 'salida', stockNuevo: 6 })],
    ['wrong-timestamp', movement('p-1', { timestamp: '2024-01-01' })],
    ['wrong-parent', movement('other-product')],
  ];
  for (const [id, value] of invalidMovements) {
    await assertFails(setDoc(doc(db, 'Productos', 'p-1', 'cambiosStock', id), value));
  }
});

test('approved clients can read known legacy movement fields', async () => {
  const uid = 'legacy-reader';
  await seed(
    { path: ['deviceAccess', uid], data: access(uid) },
    { path: ['Productos', 'legacy-product'], data: product() },
    {
      path: ['Productos', 'legacy-product', 'cambiosStock', 'legacy'],
      data: {
        productoId: 'legacy-product',
        numeroFactura: 'legacy-1',
        fecha: '2023-12-31',
        descipcion: 'Legacy spelling',
        compra: true,
        venta: false,
        timeStamp: now,
      },
    }
  );
  await assertSucceeds(
    getDoc(doc(dbFor(uid), 'Productos', 'legacy-product', 'cambiosStock', 'legacy'))
  );
});

test('unspecified paths remain denied and rules contain no privileged credential material', async () => {
  const uid = 'default-deny';
  await seed({ path: ['deviceAccess', uid], data: access(uid) });
  const db = dbFor(uid);
  await assertFails(getDoc(doc(db, 'unlisted', 'document')));
  await assertFails(setDoc(doc(db, 'unlisted', 'document'), { value: true }));
  const paths = candidatePaths();
  assert.ok(paths.includes('firestore.rules'));
  const candidateText = (await Promise.all(
    paths.map((path) => readFile(new URL(path, REPO_ROOT), 'utf8')),
  )).join('\n');
  const privilegedMarkers = [
    ['BEGIN', ' [A-Z ]+ ', 'PRIVATE', ' KEY'].join(''),
    ['client', 'email'].join('_'),
    ['private', 'key'].join('_'),
  ];
  for (const marker of privilegedMarkers) {
    assert.doesNotMatch(candidateText, new RegExp(marker));
  }
});
