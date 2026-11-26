import test from 'node:test';
import assert from 'node:assert/strict';
import { sample, formatAmount, makeReceipt, pdfBytes } from '../web-demo/receipt.mjs';
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
 assert.match(pdf,/112 0 0 56 \d+ \d+ cm \/Logo Do/);
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
test('elige color del logo, evita fondo blanco y conserva contraste', async () => {
 const { pickBrand, contrastWithWhite } = await import('../web-demo/receipt.mjs');
 const pixels = Uint8ClampedArray.from([
  255,255,255,255, 253,253,255,255, 2,55,220,0,
  227,194,25,255, 227,194,25,255, 228,188,25,255
 ]);
 const color = pickBrand(pixels);
 assert.ok(color[0]>color[1] && color[1]>color[2]);
 assert.ok(contrastWithWhite(color)>=4.5);
});
test('usa el color visible en logos monocromos y devuelve null sin color', async () => {
 const { pickBrand }=await import('../web-demo/receipt.mjs');
 assert.deepEqual(pickBrand([17,17,17,255,255,255,255,255]),[17,17,17]);
 assert.equal(pickBrand([250,250,250,255,8,5,7,0]),null);
 const color = pickBrand([170,30,55,255,172,31,56,255,12,40,144,255]);
 assert.ok(color[0]>color[2]);
});
test('recibo profesional separa el pago, el vehículo y una referencia opcional', () => {
 const r=makeReceipt({...sample,concept:'Reserva del vehículo',reference:'PRUEBA-5'});
 assert.equal(r.concept,'Reserva del vehículo'); assert.equal(r.reference,'PRUEBA-5');
 const pdf=Buffer.from(pdfBytes(r,undefined,[32,78,215])).toString('latin1');
 for(const label of ['RECIBO DE PAGO','DATOS DEL VEHÍCULO','Reserva del vehículo','PRUEBA-5']) assert.ok(pdf.includes(label));
 assert.ok(pdf.includes('0.125 0.306 0.843 rg'));
});
