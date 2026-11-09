const C='atv-pessoal-v2',CS='atv-share';
self.addEventListener('install',e=>{self.skipWaiting()});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==C&&x!==CS).map(x=>caches.delete(x)))).then(()=>self.clients.claim()))});
/* Recebe arquivos compartilhados de outros apps (ex.: "Exportar conversa" do WhatsApp) */
async function recebe(r){
  try{
    const fd=await r.formData(),c=await caches.open(CS);
    for(const k of await c.keys())await c.delete(k);
    let i=0;
    for(const v of fd.getAll('arquivos')){
      if(v&&typeof v==='object'&&v.size!==undefined){
        await c.put(new Request(self.registration.scope+'__share/'+(i++)),new Response(v,{headers:{'x-nome':encodeURIComponent(v.name||'conversa.txt')}}));
      }
    }
    const tx=[fd.get('title'),fd.get('text'),fd.get('url')].filter(x=>typeof x==='string'&&x.trim()).join('\n');
    if(!i&&tx)await c.put(new Request(self.registration.scope+'__share/texto'),new Response(tx,{headers:{'x-nome':encodeURIComponent('texto-compartilhado.txt')}}));
  }catch(e){}
  return Response.redirect(self.registration.scope+'?compartilhado=1',303);
}
self.addEventListener('fetch',e=>{
  const r=e.request,u=new URL(r.url);
  if(r.method==='POST'&&u.origin===self.location.origin&&/\/compartilhar$/.test(u.pathname)){e.respondWith(recebe(r));return}
  if(r.method!=='GET'||u.origin!==self.location.origin)return;
  e.respondWith(fetch(r).then(res=>{const cp=res.clone();caches.open(C).then(c=>c.put(r,cp));return res}).catch(()=>caches.match(r).then(x=>x||caches.match('./'))));
});
