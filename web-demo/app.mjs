import { labels, makeReceipt, pdfBytes, sample } from './receipt.mjs';
const form=document.querySelector('#receipt-form');
const result=document.querySelector('#result');
const details=document.querySelector('#details');
const error=document.querySelector('#error');
const status=document.querySelector('#status');
let current;
function setExample() {
  for (const [k,v] of Object.entries(sample)) form.elements.namedItem(k).value=v;
  result.hidden=true; error.hidden=true; current=undefined; status.textContent='';
}
setExample();
document.querySelector('#reset').addEventListener('click',()=>{
  setExample(); form.elements.namedItem('client').focus();
});
form.addEventListener('input',()=>{result.hidden=true; current=undefined; error.hidden=true;});
form.addEventListener('submit',event=>{
  event.preventDefault(); error.hidden=true; status.textContent='';
  try { current=makeReceipt(Object.fromEntries(new FormData(form))); }
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
  const url=URL.createObjectURL(new Blob([pdfBytes(current)],{type:'application/pdf'}));
  const link=document.createElement('a'); link.href=url; link.download='Recibitos-PRO-'+current.number+'.pdf';
  document.body.append(link); link.click(); link.remove();
  setTimeout(()=>URL.revokeObjectURL(url),30000);
  status.textContent='PDF de demostración generado.';
});
