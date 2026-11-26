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
test('incorpora el logo en el PDF y lo coloca con su proporción', async () => {
 const { pdfBytes } = await import('../web-demo/receipt.mjs');
 const logo = {width:400,height:200,bytes:Uint8Array.of(255,216,255,217)};
 const pdf = Buffer.from(pdfBytes(makeReceipt(sample),logo)).toString('latin1');
 assert.match(pdf,/\/Logo 7 0 R/);
 assert.match(pdf,/\/Width 400 \/Height 200/);
 assert.match(pdf,/100 0 0 50 \d+ \d+ cm \/Logo Do/);
 assert.match(pdf,/ffd8ffd9>/);
 assert.doesNotMatch(Buffer.from(pdfBytes(makeReceipt(sample))).toString('latin1'), /\/Logo/);
});
test('valida el tipo y tamaño del archivo de logo', async () => {
 const { validateLogoFile } = await import('../web-demo/receipt.mjs');
 assert.doesNotThrow(() => validateLogoFile({ type:'image/png',size:18000 }));
 for(const file of [{type:'image/svg+xml',size:99},{type:'image/png',size:0},{type:'image/jpeg',size:6*1024*1024}]) {
   assert.throws(()=>validateLogoFile(file));
 }
});
