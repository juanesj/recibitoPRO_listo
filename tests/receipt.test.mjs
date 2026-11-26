import test from 'node:test';
import assert from 'node:assert/strict';
import { sample, formatAmount, makeReceipt } from '../web-demo/receipt.mjs';
test('formatea quetzales sin perder centavos', () => assert.equal(formatAmount('1250.5'), 'Q1,250.50'));
test('conserva campos y fecha del ejemplo', () => {
 const r = makeReceipt(sample);
 assert.equal(r.client, 'María de Ejemplo');
 assert.equal(r.day, '26/11/2026');
 assert.equal(r.total, 'Q1,250.50');
 assert.equal(r.number, 'DEMO-0001');
});
test('rechaza montos y fechas inválidos', () => {
 for (const amount of ['0','-7','1e3','5.123','abc','']) assert.throws(() => makeReceipt({...sample,amount}));
 assert.throws(() => makeReceipt({...sample,date:'2026-02-31'}));
 assert.throws(() => makeReceipt({...sample,client:'  '}));
});
test('crea un PDF con acentos y referencias válidas', async () => {
 const { pdfBytes } = await import('../web-demo/receipt.mjs');
 const b = Buffer.from(pdfBytes(makeReceipt(sample)));
 assert.match(b.toString('latin1'), /María de Ejemplo/);
 assert.match(b.toString('latin1'), /Q1,250\.50/);
 const x = Number(b.toString('latin1').match(/startxref\s+(\d+)/)[1]);
 assert.equal(b.subarray(x,x+4).toString(), 'xref');
});
