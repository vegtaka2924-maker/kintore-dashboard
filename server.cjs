/* ローカル配信用の最小静的サーバ（PWA/IndexedDB確認・日常起動用）。
   使い方:  node server.cjs   → http://localhost:8765/dashboard.html */
const http=require('http'),fs=require('fs'),path=require('path');
const ROOT=__dirname, PORT=8765;
// 起動時に sw.js を再生成（版・アセット一覧を src から注入）
try { require('./gen-sw.cjs').generate(); console.log('sw.js regenerated'); } catch(e){ console.error('gen-sw failed', e); }
const MIME={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.cjs':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8',
 '.json':'application/json; charset=utf-8','.webmanifest':'application/manifest+json; charset=utf-8',
 '.csv':'text/csv; charset=utf-8','.png':'image/png','.svg':'image/svg+xml'};
http.createServer((req,res)=>{
  let p=decodeURIComponent(req.url.split('?')[0]); if(p==='/')p='/dashboard.html';
  const fp=path.join(ROOT,p);
  if(!fp.startsWith(ROOT)){res.writeHead(403);return res.end();}
  fs.readFile(fp,(e,buf)=>{ if(e){res.writeHead(404);return res.end('Not found');}
    res.writeHead(200,{'Content-Type':MIME[path.extname(fp).toLowerCase()]||'application/octet-stream'});
    res.end(buf); });
}).listen(PORT,()=>console.log('serving '+ROOT+' on http://localhost:'+PORT));
