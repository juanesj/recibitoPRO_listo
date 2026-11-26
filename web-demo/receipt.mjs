export const sample = Object.freeze({
  client:'María de Ejemplo', vehicle:'Toyota Corolla 2018', plate:'DEMO-01',
  vin:'FICTICIO-0001', seller:'Autos de Ejemplo', amount:'1250.50',
  method:'Transferencia', date:'2026-11-26', notes:'Abono de demostración.'
});
export const labels = Object.freeze({
  client:'Cliente', vehicle:'Vehículo', plate:'Placa', vin:'VIN',
  seller:'Vendedor', method:'Forma de pago', day:'Fecha', notes:'Observaciones'
});
export function formatAmount(value) {
  const v = String(value).trim();
  if (!/^\d{1,7}([.,]\d{1,2})?$/.test(v) || Number(v.replace(',','.')) <= 0) {
    throw new Error('Escribe un monto mayor que cero, con hasta dos decimales.');
  }
  return 'Q' + new Intl.NumberFormat('en-US',{minimumFractionDigits:2,maximumFractionDigits:2}).format(Number(v.replace(',','.')));
}
export function makeReceipt(input) {
  const date = String(input.date || '');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error('Selecciona una fecha válida.');
  const d = new Date(date + 'T12:00:00Z');
  if (!Number.isFinite(+d) || d.toISOString().slice(0,10) !== date) throw new Error('Selecciona una fecha válida.');
  const r = {number:'DEMO-0001',day:date.split('-').reverse().join('/'),total:formatAmount(input.amount)};
  for (const k of Object.keys(labels).filter(k=>k!=='day')) {
    r[k] = String(input[k] || '').trim().replace(/\s+/g,' ').slice(0,k==='notes'?160:50);
  }
  if (!r.client || !r.vehicle || !r.seller || !r.method) throw new Error('Completa cliente, vehículo, vendedor y forma de pago.');
  return r;
}
const literal = value => String(value).normalize('NFC').replace(/[^\x20-\x7e\xa0-\xff]/g,'?').replace(/[\\()]/g,'\\$&');
export function validateLogoFile(file) {
  const types = ['image/png','image/jpeg','image/webp'];
  if (!file || !types.includes(file.type)) throw new Error('Elige una imagen PNG, JPG o WebP.');
  if (!(file.size > 0 && file.size <= 5 * 1024 * 1024)) throw new Error('El logo debe pesar como máximo 5 MB.');
}
export function pdfBytes(r, logo) {
  const line = (x,y,size,value,bold=false) =>
    'BT /'+(bold?'F2':'F1')+' '+size+' Tf '+x+' '+y+' Td ('+literal(value)+') Tj ET\n';
  let stream = '0.08 0.14 0.13 rg\n';
  if (logo) {
    const scale=Math.min(100/logo.width,58/logo.height);
    const w=Math.round(scale*logo.width), h=Math.round(scale*logo.height);
    stream+='q '+w+' 0 0 '+h+' '+(560-w)+' '+(752-h)+' cm /Logo Do Q\n';
  }
  stream += line(52,738,24,'Recibitos PRO',true)+line(52,709,14,'Recibo de demostración');
  stream += line(52,677,11,r.number+'   |   '+r.day)+line(52,615,30,r.total,true);
  stream += '0.75 0.81 0.77 RG 52 591 m 560 591 l S\n';
  let y=562;
  for(const k of ['client','vehicle','plate','vin','seller','method']) {
    const value=r[k]||'No indicado';
    stream+=line(52,y,10,labels[k],true)+line(180,y,Math.min(12,380/value.length),value); y-=32;
  }
  stream+=line(52,350,10,'Observaciones',true);
  const note = r.notes || 'Sin observaciones.';
  for(let i=0;i<note.length;i+=63) stream+=line(52,328-(i/63)*17,11,note.slice(i,i+63));
  stream+=line(52,70,10,'DATOS FICTICIOS. NO VÁLIDO COMO COMPROBANTE.',true);
  const objects=[
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> '+(logo?'/XObject << /Logo 7 0 R >> ':'')+'>> /Contents 6 0 R >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>',
    '<< /Length '+stream.length+' >>\nstream\n'+stream+'endstream'
  ];
  if (logo) {
    const hex=Array.from(logo.bytes,b=>b.toString(16).padStart(2,'0')).join('')+'>';
    objects.push('<< /Type /XObject /Subtype /Image /Width '+logo.width+' /Height '+logo.height+' /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter [/ASCIIHexDecode /DCTDecode] /Length '+hex.length+' >>\nstream\n'+hex+'\nendstream');
  }
  let file='%PDF-1.4\n'; const offsets=[];
  objects.forEach((obj,i)=>{offsets.push(file.length); file+=(i+1)+' 0 obj\n'+obj+'\nendobj\n';});
  const xref=file.length;
  file+='xref\n0 '+(objects.length+1)+'\n0000000000 65535 f \n';
  for(const n of offsets) file+=String(n).padStart(10,'0')+' 00000 n \n';
  file+='trailer\n<< /Size '+(objects.length+1)+' /Root 1 0 R >>\nstartxref\n'+xref+'\n%%EOF\n';
  return Uint8Array.from(file,c=>c.charCodeAt(0));
}
