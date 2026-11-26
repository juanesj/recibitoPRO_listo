export const sample = Object.freeze({
  kind:'vehicular', paymentType:'abono', saleTotal:'50000', previousPaid:'5000',
  address:'Avenida de Ejemplo 10, Guatemala', phone:'0000-0000', client:'María de Ejemplo', vehicle:'Toyota Corolla 2018', plate:'DEMO-01',
  vin:'FICTICIO-0001', seller:'Autos de Ejemplo', amount:'1250.50',
  method:'Transferencia', date:'2026-11-26', concept:'Reserva del vehículo', reference:'PRUEBA-001', notes:'Abono de demostración.'
});
export const labels = Object.freeze({
  client:'Cliente', vehicle:'Vehículo', plate:'Placa', vin:'VIN',
  seller:'Empresa o vendedor',address:'Dirección',phone:'Teléfono', method:'Forma de pago', day:'Fecha', concept:'Concepto', reference:'Referencia', notes:'Observaciones'
});
const moneyFormat=new Intl.NumberFormat('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});
const gtq=cents=>'Q'+moneyFormat.format(cents/100);
function cents(value,label,allowZero=false) {
  const v=String(value??'').trim();
  if (!/^\d{1,7}([.,]\d{1,2})?$/.test(v)) throw new Error(label+': escribe un monto válido de hasta dos decimales.');
  const [whole,frac='']=v.replace(',','.').split('.');
  const result=Number(whole)*100+Number(frac.padEnd(2,'0'));
  if (!allowZero && result===0) throw new Error(label+': escribe un monto mayor que cero.');
  return result;
}
export function formatAmount(value) { return gtq(cents(value,'Pago de hoy')); }
export const paymentTypes=Object.freeze({anticipo:'Anticipo',abono:'Abono',total:'Pago total'});
export function calculatePayment(input) {
  const type=input.paymentType??'total';
  if (!Object.hasOwn(paymentTypes,type)) throw new Error('Selecciona un tipo de pago válido.');
  const paid=cents(input.amount,'Pago de hoy');
  const sale=type==='total'?paid:cents(input.saleTotal,'Total de la operación');
  const previous=type==='abono'?cents(String(input.previousPaid??'').trim()||'0','Abonos anteriores',true):0;
  const cumulative=paid+previous;
  if (cumulative>sale) throw new Error('Los abonos y el pago de hoy superan el total de la operación.');
  return {type,label:paymentTypes[type], paid:gtq(paid), sale:gtq(sale), previous:gtq(previous), accumulated:gtq(cumulative), balance:gtq(sale-cumulative)};
}
export function makeReceipt(input) {
  const date = String(input.date || '');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error('Selecciona una fecha válida.');
  const d = new Date(date + 'T12:00:00Z');
  if (!Number.isFinite(+d) || d.toISOString().slice(0,10) !== date) throw new Error('Selecciona una fecha válida.');
  const payment=calculatePayment(input);
  const kind=input.kind??'vehicular';
  if (!['general','vehicular'].includes(kind)) throw new Error('Selecciona un formato de recibo válido.');
  const r = {number:'DEMO-0001',kind,day:date.split('-').reverse().join('/'),total:payment.paid,payment};
  for (const k of Object.keys(labels).filter(k=>k!=='day')) {
    r[k] = String(input[k] || '').trim().replace(/\s+/g,' ').slice(0,({notes:160,address:84,phone:30,plate:16,vin:24})[k]??50);
  }
  if (!r.client || !r.seller || !r.method) throw new Error('Completa cliente, empresa y forma de pago.');
  if (kind==='general') r.vehicle=r.plate=r.vin='';
  else if (!r.vehicle) throw new Error('Completa los datos del vehículo.');
  return r;
}
const literal = value => String(value).normalize('NFC').replace(/[^\x20-\x7e\xa0-\xff]/g,'?').replace(/[\\()]/g,'\\$&');
export function validateLogoFile(file) {
  const types = ['image/png','image/jpeg','image/webp'];
  if (!file || !types.includes(file.type)) throw new Error('Elige una imagen PNG, JPG o WebP.');
  if (!(file.size > 0 && file.size <= 5 * 1024 * 1024)) throw new Error('El logo debe pesar como máximo 5 MB.');
}
export const defaultBrand=Object.freeze([23,62,53]);
export function pdfBytes(r, logo, selectedColor=logo?.color, signature) {
  const raw=Array.isArray(selectedColor)&&selectedColor.length===3&&selectedColor.every(v=>Number.isFinite(v)&&v>=0&&v<=255)?selectedColor:defaultBrand;
  const brand=raw.map(v=>(v/255).toFixed(3)).join(' ');
  const ink='0.078 0.125 0.110', muted='0.278 0.333 0.318', lineColor='0.81 0.85 0.83', white='1 1 1';
  const tint=raw.map(v=>(.95+.05*v/255).toFixed(3)).join(' ');
  const line=(x,y,size,value,bold=false,color=ink)=>
    color+' rg BT /'+(bold?'F2':'F1')+' '+size+' Tf '+x+' '+y+' Td ('+literal(value)+') Tj ET\n';
  const box=(x,y,w,h,color)=>color+' rg '+[x,y,w,h].join(' ')+' re f\n';
  const rule=(x,y,end)=>lineColor+' RG '+x+' '+y+' m '+end+' '+y+' l S\n';
  const fit=(value,max,size)=>Math.min(size,max/Math.max(1,value.length)).toFixed(2);
  const field=(x,y,width,label,value)=>line(x,y,8,label,true,muted)+
    line(x,y-17,fit(value,width,11),value);
  let stream=box(0,781,612,11,brand);
  stream+=line(40,739,10,'RECIBO DE PAGO',true,brand);
  stream+=line(40,708,fit(r.seller,380,25),r.seller,true);
  if(r.address) stream+=line(40,690,fit(r.address,405,9),r.address,false,muted);
  stream+=line(40,669,10,'N.º '+r.number+'  |  Fecha: '+r.day,false,muted);
  if(r.phone) stream+=line(320,669,10,'Tel.: '+r.phone,false,muted);
  if(logo) {
    const scale=Math.min(112/logo.width,69/logo.height);
    const w=Math.max(1,Math.round(scale*logo.width)),h=Math.max(1,Math.round(scale*logo.height));
    stream+='q '+w+' 0 0 '+h+' '+(572-w)+' '+(756-h)+' cm /Logo Do Q\n';
  } else stream+=line(468,738,12,'RECIBITOS PRO',true,brand);
  stream+=box(40,566,532,84,brand);
  stream+=line(58,624,9,'PAGO DE HOY  /  '+r.payment.label.toUpperCase(),true,white);
  stream+=line(58,587,31,r.total,true,white);
  for (const [i,label,value] of [[0,'Total de la operación',r.payment.sale],[1,'Total abonado',r.payment.accumulated],[2,'Saldo pendiente',r.payment.balance]]) {
    stream+=line(320,623-i*18,9,label,false,white)+line(463,623-i*18,11,value,true,white);
  }
  stream+=line(40,533,9,'DATOS DEL PAGO',true,brand)+rule(40,524,572);
  stream+=field(40,506,255,'PAGADO POR',r.client);
  stream+=field(320,506,252,'FORMA DE PAGO',r.method);
  stream+=field(40,457,255,'CONCEPTO',r.concept||'No indicado');
  stream+=field(320,457,252,'REFERENCIA',r.reference||'No indicada');
  const vehicle=r.kind==='vehicular';
  if (vehicle) {
    stream+=line(40,396,9,'DATOS DEL VEHÍCULO',true,brand)+rule(40,387,572);
    stream+=field(40,369,255,'VEHÍCULO',r.vehicle);
    stream+=field(320,369,90,'PLACA',r.plate||'No indicada');
    stream+=field(420,369,152,'VIN',r.vin||'No indicado');
  }
  const noteY=vehicle?223:310;
  stream+=box(40,noteY,532,86,tint);
  stream+=line(54,noteY+63,9,'OBSERVACIONES',true,brand);
  const note=r.notes||'Sin observaciones.';
  const chunks=note.match(/.{1,52}(?: |$)|.{1,52}/g)||[];
  chunks.forEach((part,i)=>{stream+=line(54,noteY+46-i*12,9,part.trim());});
  if(signature) {
    const scale=Math.min(164/signature.width,56/signature.height);
    const w=Math.max(1,Math.round(signature.width*scale)),h=Math.max(1,Math.round(signature.height*scale));
    stream+='q '+w+' 0 0 '+h+' 40 120 cm /Signature Do Q\n';
    stream+=rule(40,117,218)+line(40,102,8,'Firma capturada en pantalla · Sin certificado digital',false,muted);
  }
  stream+=rule(40,86,572)+line(40,69,8,'DATOS FICTICIOS. NO VÁLIDO COMO COMPROBANTE.',true,muted);
  stream+=line(40,54,8,'Generado con Recibitos PRO',false,muted)+line(520,54,8,'PÁG. 1 / 1',false,muted);
  const images=[['Logo',logo],['Signature',signature]].filter(([,image])=>image);
  const xobjects=images.length?'/XObject << '+images.map(([name],i)=>'/'+name+' '+(7+i)+' 0 R').join(' ')+' >> ':'';
  const objects=[
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> '+xobjects+'>> /Contents 6 0 R >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>',
    '<< /Length '+stream.length+' >>\nstream\n'+stream+'endstream'
  ];
  for (const [,image] of images) {
    const hex=Array.from(image.bytes,b=>b.toString(16).padStart(2,'0')).join('')+'>';
    objects.push('<< /Type /XObject /Subtype /Image /Width '+image.width+' /Height '+image.height+' /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter [/ASCIIHexDecode /DCTDecode] /Length '+hex.length+' >>\nstream\n'+hex+'\nendstream');
  }
  let file='%PDF-1.4\n'; const offsets=[];
  objects.forEach((obj,i)=>{offsets.push(file.length); file+=(i+1)+' 0 obj\n'+obj+'\nendobj\n';});
  const xref=file.length;
  file+='xref\n0 '+(objects.length+1)+'\n0000000000 65535 f \n';
  for(const n of offsets) file+=String(n).padStart(10,'0')+' 00000 n \n';
  file+='trailer\n<< /Size '+(objects.length+1)+' /Root 1 0 R >>\nstartxref\n'+xref+'\n%%EOF\n';
  return Uint8Array.from(file,c=>c.charCodeAt(0));
}

export function contrastWithWhite(color) {
  const rgb=color.map(value=>{
    const s=value/255;
    return s<=.04045?s/12.92:((s+.055)/1.055)**2.4;
  });
  return 1.05/(.05+.2126*rgb[0]+.7152*rgb[1]+.0722*rgb[2]);
}
export function pickBrand(pixels) {
  const buckets=new Map();
  for(let i=0;i+3<pixels.length;i+=4) {
    const r=pixels[i],g=pixels[i+1],b=pixels[i+2],alpha=pixels[i+3];
    if(alpha<120 || Math.min(r,g,b)>232) continue;
    const key=[r,g,b].map(v=>Math.floor(v/28)).join(',');
    const item=buckets.get(key)||{n:0,r:0,g:0,b:0};
    item.n++; item.r+=r; item.g+=g; item.b+=b;
    buckets.set(key,item);
  }
  let best=null;
  for(const item of buckets.values()) {
    const color=[item.r,item.g,item.b].map(v=>Math.round(v/item.n));
    const spread=Math.max(...color)-Math.min(...color);
    const score=item.n*(1+spread/115);
    if(!best||score>best.score) best={score,color};
  }
  if(!best) return null;
  let color=best.color;
  while(contrastWithWhite(color)<4.5) color=color.map(v=>Math.floor(v*.94));
  return color;
}
