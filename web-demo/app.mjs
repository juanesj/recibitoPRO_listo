import { labels, makeReceipt, pdfBytes, sample, formatAmount, validateLogoFile } from './receipt.mjs';
const form=document.querySelector('#receipt-form');
const result=document.querySelector('#result');
const details=document.querySelector('#details');
const error=document.querySelector('#error');
const status=document.querySelector('#status');
let current, brandLogo;
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
  try { amountHint.textContent=value?'Total: '+formatAmount(value):hintDefault; }
  catch { amountHint.textContent='Escribe un monto válido (por ejemplo, 1250.50).'; }
}
function drawBrand() {
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
    const ctx=canvas.getContext('2d');
    ctx.fillStyle='#fff'; ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.drawImage(image,0,0,canvas.width,canvas.height);
    const preview=canvas.toDataURL('image/jpeg',0.88);
    return {preview,width:canvas.width,height:canvas.height,
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
    brandLogo=decoded; drawBrand();
  } catch (e) {
    if (token!==selection) return;
    logoInput.value=''; logoError.textContent=e.message; logoError.hidden=false;
  }
});
function setExample() {
  for (const [k,v] of Object.entries(sample)) form.elements.namedItem(k).value=v;
  result.hidden=true; error.hidden=true; current=undefined; status.textContent=''; refreshAmount();
}
setExample();
document.querySelector('#reset').addEventListener('click',()=>{
  setExample(); form.elements.namedItem('client').focus();
});
form.addEventListener('input',()=>{result.hidden=true; current=undefined; error.hidden=true; refreshAmount();});
form.addEventListener('submit',event=>{
  event.preventDefault(); error.hidden=true; status.textContent='';
  try { current=makeReceipt(Object.fromEntries(new FormData(form))); drawBrand(); }
  catch (e) { current=undefined; result.hidden=true; error.textContent=e.message; error.hidden=false; return; }
  document.querySelector('#number').textContent=current.number;
  document.querySelector('#total').textContent=current.total;
  details.replaceChildren();
  for(const [key,label] of Object.entries(labels)) {
    if(!current[key]) continue;
    const row=document.createElement('div');
    const term=document.createElement('dt'); term.textContent=label;
    const value=document.createElement('dd'); value.textContent=current[key];
    row.append(term,value); details.append(row);
  }
  result.hidden=false;
  document.querySelector('#result-title').focus();
});
document.querySelector('#download').addEventListener('click',()=>{
  if(!current) return;
  const url=URL.createObjectURL(new Blob([pdfBytes(current,brandLogo)],{type:'application/pdf'}));
  const link=document.createElement('a'); link.href=url; link.download='Recibitos-PRO-'+current.number+'.pdf';
  document.body.append(link); link.click(); link.remove();
  setTimeout(()=>URL.revokeObjectURL(url),30000);
  status.textContent='PDF de demostración generado.';
});
