import assert from 'node:assert/strict';
import {
  decryptSprContainer,
  exportEncryptedSpr,
  exportPlainSpr,
  parseSprFile,
  SPR_FORMAT,
  SPR_VERSION,
} from '../src/sprExport.ts';

const caseData = {
  case_id: 'case-test-1',
  case_title: 'Marco Bianchi — ricomposizione corporea',
  client_name: 'Marco Bianchi',
  case_summary: 'Marco Bianchi, obiettivo ricomposizione corporea, plateau sulla panca.',
  materials: [],
  timeline: [],
  people: [],
  evidence: [],
  open_questions: [],
  missing_documents: [],
  contradictions: [],
  procedural_deadlines: [],
  brief_markdown: 'Promemoria per Marco Bianchi',
  usage_estimate: { pages: 1, audio_minutes: 0, flash_input_tokens: 100, flash_output_tokens: 50, pro_used: false },
  analisi_progressi: null,
};

const password = 'frase lunga per scheda protetta 2026';

const plain = exportPlainSpr(caseData);
assert.equal(plain.format, SPR_FORMAT);
assert.equal(plain.version, SPR_VERSION);
assert.equal(plain.encrypted, false);
assert.equal(plain.payload.case_title, caseData.case_title);

const parsedPlain = await parseSprFile(JSON.stringify(plain));
assert.equal(parsedPlain.kind, 'case');
assert.equal(parsedPlain.caseData.case_title, caseData.case_title);
assert.equal(parsedPlain.protected, false);

const parsedLegacy = await parseSprFile(JSON.stringify(caseData));
assert.equal(parsedLegacy.kind, 'case');
assert.equal(parsedLegacy.caseData.case_id, caseData.case_id);
assert.equal(parsedLegacy.legacy, true);

const encrypted = await exportEncryptedSpr(caseData, password);
assert.equal(encrypted.format, SPR_FORMAT);
assert.equal(encrypted.version, SPR_VERSION);
assert.equal(encrypted.encrypted, true);
assert.equal(encrypted.kdf.name, 'PBKDF2');
assert.equal(encrypted.kdf.hash, 'SHA-256');
assert.ok(encrypted.kdf.iterations >= 600000);
assert.equal(encrypted.cipher.name, 'AES-GCM');
assert.equal(typeof encrypted.payload, 'string');

const encryptedText = JSON.stringify(encrypted);
assert.equal(encryptedText.includes('Marco Bianchi'), false, 'encrypted .spr must not expose client name in plaintext');
assert.equal(encryptedText.includes('ricomposizione corporea'), false, 'encrypted .spr must not expose case title in plaintext');
assert.equal(encryptedText.includes('Promemoria'), false, 'encrypted .spr must not expose brief text in plaintext');

const parsedEncrypted = await parseSprFile(encryptedText);
assert.equal(parsedEncrypted.kind, 'encrypted');
assert.equal(parsedEncrypted.container.encrypted, true);

const decrypted = await decryptSprContainer(parsedEncrypted.container, password);
assert.equal(decrypted.case_title, caseData.case_title);
assert.equal(decrypted.client_name, caseData.client_name);

await assert.rejects(
  () => decryptSprContainer(parsedEncrypted.container, 'password sbagliata'),
  /Password errata o file danneggiato\./,
);

await assert.rejects(
  () => parseSprFile('{"format":"schedapro.scheda","version":999,"encrypted":false,"payload":{}}'),
  /versione non supportata/i,
);

console.log('spr export/import format checks passed');
