import { labels, makeReceipt, pdfBytes, sample, formatAmount, validateLogoFile, pickBrand, calculatePayment } from './receipt.mjs?v=pagos3';
const form=document.querySelector('#receipt-form');
const result=document.querySelector('#result');
const paymentDetails=document.querySelector('#payment-details');
const vehicleDetails=document.querySelector('#vehicle-details');
const error=document.querySelector('#error');
const status=document.querySelector('#status');
let current, brandLogo, signed;
const history=[];
const paymentType=form.elements.namedItem('paymentType');
const kindInput=form.elements.namedItem('kind');
const partialFields=document.querySelector('#partial-fields');
const vehicleFields=document.querySelector('#vehicle-fields');
const priorField=document.querySelector('#past-field');
const balanceHint=document.querySelector('#balance-hint');
const saveReceipt=document.querySelector('#save-receipt');
const pad=document.querySelector('#signature-pad');
const pen=pad.getContext('2d');
function clearPad() {
  pen.fillStyle='#fff'; pen.fillRect(0,0,pad.width,pad.height);
  signed=undefined;
}
clearPad();
let pointer=null, origin=null;
function point(e) {
  const r=pad.getBoundingClientRect();
  return [(e.clientX-r.left)*pad.width/r.width,(e.clientY-r.top)*pad.height/r.height];
}
pad.addEventListener('pointerdown',e=>{
  if(pointer!==null || (e.pointerType==='mouse'&&e.button!==0)) return;
  pointer=e.pointerId; pad.setPointerCapture(pointer); origin=point(e);
});
pad.addEventListener('pointermove',e=>{
  if(e.pointerId!==pointer) return;
  const end=point(e);
  pen.beginPath(); pen.strokeStyle='#172a24'; pen.lineWidth=3.8; pen.lineCap='round';
  pen.moveTo(...origin); pen.lineTo(...end); pen.stroke(); origin=end;
  signed=true; invalidate();
});
function stopStroke(e) { if(e.pointerId===pointer){pointer=null;origin=null;} }
for (const name of ['pointerup','pointercancel','lostpointercapture']) pad.addEventListener(name,stopStroke);
document.querySelector('#clear-signature').addEventListener('click',()=>{clearPad();invalidate();});
function imageOfSignature() {
  if(!signed) return undefined;
  const preview=pad.toDataURL('image/jpeg',.9);
  const bytes=Uint8Array.from(atob(preview.split(',')[1]),c=>c.charCodeAt(0));
  return {preview,bytes,width:pad.width,height:pad.height};
}
function invalidate() {
  result.hidden=true; current=undefined; error.hidden=true; status.textContent='';
  saveReceipt.disabled=false;
}
function syncFields() {
  vehicleFields.hidden=vehicleFields.disabled=kindInput.value==='general';
  partialFields.hidden=partialFields.disabled=paymentType.value==='total';
  priorField.hidden=paymentType.value!=='abono';
  form.elements.namedItem('previousPaid').disabled=priorField.hidden;
}
let selection=0;
const logoInput=document.querySelector('#logo');
const logoError=document.querySelector('#logo-error');
const logoThumb=document.querySelector('#logo-thumb');
const receiptLogo=document.querySelector('#receipt-logo');
const placeholder=document.querySelector('#logo-placeholder');
const removeLogo=document.querySelector('#logo-remove');
const amount=form.elements.namedItem('amount');
const amountHint=document.querySelector('#amount-hint');
const hintDefault='Usa punto o coma para los centavos.';
function refreshAmount() {
  const value=amount.value.trim();
  try { amountHint.textContent=value?'Pago de hoy: '+formatAmount(value):hintDefault; }
  catch { amountHint.textContent='Escribe un monto válido (por ejemplo, 1250.50).'; }
  if (!partialFields.hidden) {
    try {
      const p=calculatePayment(Object.fromEntries(new FormData(form)));
      balanceHint.textContent='Total abonado: '+p.accumulated+' · Saldo pendiente: '+p.balance;
    } catch (e) { balanceHint.textContent=e.message; }
  }
}
const root=document.documentElement;
const cssColor=(c)=>'rgb('+c.join(', ')+')';
const blend=(a,b,ratio)=>a.map((v,i)=>Math.round(v*(1-ratio)+b[i]*ratio));
function applyPalette(color) {
  const white=[255,255,255], black=[0,0,0];
  const palette=color?{
    '--brand':color, '--logo-hero':blend(color,black,.16),
    '--logo-hover':blend(color,black,.22), '--logo-soft':blend(color,white,.91),
    '--logo-muted':blend(color,white,.96), '--logo-edge':blend(color,white,.78),
    '--logo-focus':color
  }:null;
  for(const key of ['--brand','--logo-hero','--logo-hover','--logo-soft','--logo-muted','--logo-edge','--logo-focus']) {
    if(palette) root.style.setProperty(key,cssColor(palette[key]));
    else root.style.removeProperty(key);
  }
}
function drawBrand() {
  applyPalette(brandLogo?.color);
  for (const element of [logoThumb,receiptLogo]) {
    element.hidden=!brandLogo;
    if (brandLogo) element.src=brandLogo.preview;
    else element.removeAttribute('src');
  }
  placeholder.hidden=!!brandLogo;
  removeLogo.hidden=!brandLogo;
}
removeLogo.addEventListener('click',()=>{
  selection++; brandLogo=undefined; logoInput.value=''; logoError.hidden=true;
  if(saveReceipt.disabled) invalidate();
  drawBrand(); logoInput.focus();
});
async function decodeLogo(file) {
  validateLogoFile(file);
  const url=URL.createObjectURL(file);
  try {
    const image=new Image();
    await new Promise((resolve,reject)=>{
      image.onload=resolve;
      image.onerror=()=>reject(new Error('No pude abrir esa imagen. Prueba con otro logo.'));
      image.src=url;
    });
    const {naturalWidth:w,naturalHeight:h}=image;
    if (!w || !h || w*h>12500000) throw new Error('La imagen es demasiado grande. Usa una versión de menor resolución.');
    const resize=Math.min(1,640/Math.max(w,h));
    const canvas=document.createElement('canvas');
    canvas.width=Math.max(1,Math.round(w*resize)); canvas.height=Math.max(1,Math.round(h*resize));
    const sampleCanvas=document.createElement('canvas');
    const sampleScale=Math.min(1,56/Math.max(w,h));
    sampleCanvas.width=Math.max(1,Math.round(w*sampleScale));
    sampleCanvas.height=Math.max(1,Math.round(h*sampleScale));
    const sampleCtx=sampleCanvas.getContext('2d',{willReadFrequently:true});
    sampleCtx.drawImage(image,0,0,sampleCanvas.width,sampleCanvas.height);
    const color=pickBrand(sampleCtx.getImageData(0,0,sampleCanvas.width,sampleCanvas.height).data);
    const ctx=canvas.getContext('2d');
    ctx.fillStyle='#fff'; ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.drawImage(image,0,0,canvas.width,canvas.height);
    const preview=canvas.toDataURL('image/jpeg',0.88);
    return {preview,color,width:canvas.width,height:canvas.height,
      bytes:Uint8Array.from(atob(preview.split(',')[1]),c=>c.charCodeAt(0))};
  } finally { URL.revokeObjectURL(url); }
}
logoInput.addEventListener('change',async ()=>{
  const file=logoInput.files?.[0];
  if (!file) return;
  const token=++selection;
  logoError.hidden=true;
  try {
    const decoded=await decodeLogo(file);
    if (token!==selection) return;
    brandLogo=decoded; if(saveReceipt.disabled) invalidate(); drawBrand();
  } catch (e) {
    if (token!==selection) return;
    logoInput.value=''; logoError.textContent=e.message; logoError.hidden=false;
  }
});
function setExample() {
  for (const [k,v] of Object.entries(sample)) form.elements.namedItem(k).value=v;
  clearPad(); invalidate(); syncFields(); refreshAmount();
}
setExample();
document.querySelector('#reset').addEventListener('click',()=>{
  setExample(); form.elements.namedItem('client').focus();
});
function updateForm() { invalidate(); syncFields(); refreshAmount(); }
form.addEventListener('input',updateForm);
form.addEventListener('change',updateForm);
form.addEventListener('submit',event=>{
  event.preventDefault(); error.hidden=true; status.textContent='';
  try { current=makeReceipt(Object.fromEntries(new FormData(form))); drawBrand(); }
  catch (e) { current=undefined; result.hidden=true; error.textContent=e.message; error.hidden=false; return; }
  current.number='DEMO-'+String(history.length+1).padStart(4,'0');
  document.querySelector('#number').textContent=current.number;
  document.querySelector('#payment-caption').textContent='Pago de hoy · '+current.payment.label;
  const totals=document.querySelector('#payment-totals');
  totals.replaceChildren();
  for (const [label,value] of [['Total de la operación',current.payment.sale],['Total abonado',current.payment.accumulated],['Saldo pendiente',current.payment.balance]]) appendDetail(totals,label,value);
  document.querySelector('#vehicle-preview').hidden=current.kind==='general';
  for (const [id,key,prefix] of [['#merchant-address','address',''],['#merchant-phone','phone','Tel.: ']]) {
    const el=document.querySelector(id); el.hidden=!current[key]; el.textContent=current[key]?prefix+current[key]:'';
  }
  const signedImage=imageOfSignature(), signedPreview=document.querySelector('#signature-preview');
  signedPreview.hidden=!signedImage;
  const sigEl=document.querySelector('#signature-image');
  if(signedImage) sigEl.src=signedImage.preview; else sigEl.removeAttribute('src');
  document.querySelector('#total').textContent=current.total;
  document.querySelector('#merchant').textContent=current.seller;
  document.querySelector('#date-issued').textContent='Fecha: '+current.day;
  document.querySelector('#receipt-notes').textContent=current.notes||'Sin observaciones.';
  for(const [list,keys] of [[paymentDetails,['client','method','concept','reference']],[vehicleDetails,['vehicle','plate','vin']]]) {
    list.replaceChildren();
    for(const key of keys) {
      appendDetail(list,labels[key],current[key]||'No indicado');
    }
  }
  result.hidden=false;
  document.querySelector('#result-title').focus();
});
function appendDetail(list,label,value) {
  const row=document.createElement('div');
  const term=document.createElement('dt'); term.textContent=label;
  const item=document.createElement('dd'); item.textContent=value; row.append(term,item); list.append(row);
}
function receiptFile() {
  const bytes=pdfBytes(current,brandLogo,brandLogo?.color,imageOfSignature());
  return new File([bytes],'Recibitos-PRO-'+current.number+'.pdf',{type:'application/pdf'});
}
function downloadFile(file) {
  const url=URL.createObjectURL(file), link=document.createElement('a');
  link.href=url; link.download=file.name; document.body.append(link); link.click(); link.remove();
  setTimeout(()=>URL.revokeObjectURL(url),30000);
}
document.querySelector('#download').addEventListener('click',()=>{
  if(!current) return;
  downloadFile(receiptFile()); status.textContent='PDF de demostración generado.';
});
document.querySelector('#share').addEventListener('click',async ()=>{
  if(!current) return;
  const file=receiptFile(), payload={files:[file]};
  status.textContent='';
  try {
    if(navigator.share && navigator.canShare?.(payload)) { await navigator.share(payload); return; }
  } catch(e) { if(e.name==='AbortError') return; }
  downloadFile(file);
  status.textContent='Se descargó el PDF. Puedes adjuntarlo como documento en WhatsApp.';
});
saveReceipt.addEventListener('click',()=>{
  if(!current || saveReceipt.disabled) return;
  if(history.length>=30){status.textContent='El historial temporal admite hasta 30 recibos.';return;}
  const file=receiptFile();
  history.push(file); saveReceipt.disabled=true;
  const row=document.createElement('li'), text=document.createElement('span'), button=document.createElement('button');
  text.textContent=current.number+' · '+current.client+' · '+current.total;
  button.type='button'; button.className='quiet'; button.textContent='Descargar original';
  button.addEventListener('click',()=>downloadFile(file));
  row.append(text,button); document.querySelector('#history-list').prepend(row);
  document.querySelector('#history').hidden=false;
  status.textContent='Guardado en el historial de esta sesión.';
});
