const $=id=>document.getElementById(id);
let stream=null, deferredInstall=null, lastImage=null;
const soraniRules=[
  {from:"هەڵەی نموونە",to:"نموونەی ڕاستکراوە",why:"تەنها نموونەی یاسای فەرهەنگییە؛ بە پێی مەبەست پشتڕاستی بکەرەوە.",tag:"وشە"},
  {from:"بەکارهێنانی",to:"بەکارهێنانی",why:"وشەکە وەک خۆی هێڵدرایەوە.",tag:"پشکنین"}
];
function toast(msg){const t=$("toast");t.textContent=msg;t.classList.add("show");setTimeout(()=>t.classList.remove("show"),2300)}
function setConnection(){const online=navigator.onLine;$("connection").textContent=online?"ئۆنلاین":"ئۆفلاین";$("connection").style.color=online?"#3bd39a":"#f2b544"}
window.addEventListener("online",setConnection);window.addEventListener("offline",setConnection);setConnection();
async function startCamera(){
 try{
  stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:"environment"},width:{ideal:1280},height:{ideal:720}},audio:false});
  $("video").srcObject=stream;$("video").style.display="block";$("cameraPlaceholder").classList.add("hidden");
  $("cameraState").textContent="کامێرا چالاکە";$("startCamera").disabled=true;$("scanBtn").disabled=false;$("stopCamera").disabled=false;
 }catch(e){toast("نەتوانرا کامێرا چالاک بکرێت؛ مۆڵەتی کامێرا پشکنە.");}
}
function stopCamera(){if(stream)stream.getTracks().forEach(t=>t.stop());stream=null;$("video").srcObject=null;$("video").style.display="none";$("cameraPlaceholder").classList.remove("hidden");$("cameraState").textContent="وەستاوە";$("startCamera").disabled=false;$("scanBtn").disabled=true;$("stopCamera").disabled=true}
async function loadOCR(){
 if(window.Tesseract)return window.Tesseract;
 if(!navigator.onLine)throw new Error("OCR library لەم ئامێرەدا بارنەکراوە. جارێک بە ئینتەرنێت پەڕەکە بکەرەوە.");
 await new Promise((resolve,reject)=>{const s=document.createElement("script");s.src="https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js";s.onload=resolve;s.onerror=reject;document.head.appendChild(s)});
 return window.Tesseract;
}
async function recognize(blob){
 const T=await loadOCR();const lang=$("ocrLang").value;
 const result=await T.recognize(blob,lang,{logger:m=>{if(m.status==="recognizing text")$("ocrState").textContent=Math.round((m.progress||0)*100)+"%"}});
 return (result.data.text||"").replace(/\n{3,}/g,"\n\n").trim();
}
async function scanBlob(blob){
 const start=performance.now();$("camera-panel")?.classList.add("scanning");$("cameraState").textContent="پشکنین...";$("ocrState").textContent="OCR...";$("feedback").textContent="دەق دەخوێندرێتەوە...";
 try{const text=await recognize(blob);$("sourceText").value=text;if(!text)throw new Error("هیچ دەقێک نەدۆزرایەوە؛ ڕووناکی و فوکەسی کامێرا بپشکنە.");await checkText();$("elapsed").textContent=((performance.now()-start)/1000).toFixed(1);$("ocrState").textContent="تەواو";$("cameraState").textContent="ئامادە";$("feedback").textContent="پشکنین تەواو بوو. ئەنجامەکان پێشنیارن؛ پێش پەخش پشتڕاستیان بکەرەوە.";saveHistory(text,$("correctedText").value);}
 catch(e){$("ocrState").textContent="هەڵە";$("feedback").textContent=e.message||"هەڵەیەک ڕوویدا.";toast("پشکنین سەرکەوتوو نەبوو.");}
 finally{$("camera-panel")?.classList.remove("scanning")}
}
async function scanCamera(){
 const v=$("video"),c=$("captureCanvas");if(!v.videoWidth){toast("کامێرا ئامادە نییە.");return}
 c.width=Math.min(v.videoWidth,1280);c.height=Math.round(c.width*v.videoHeight/v.videoWidth);c.getContext("2d").drawImage(v,0,0,c.width,c.height);
 c.toBlob(blob=>scanBlob(blob),"image/jpeg",.88);
}
function localCheck(text){
 let corrected=text,issues=[];
 // Only high-confidence, explicitly configured dictionary substitutions should be added here.
 for(const rule of soraniRules){if(corrected.includes(rule.from)&&rule.from!==rule.to){corrected=corrected.split(rule.from).join(rule.to);issues.push({tag:rule.tag,old:rule.from,next:rule.to,why:rule.why})}}
 // Conservative checks: flag suspicious doubled spaces and repeated identical words; never silently rewrite.
 if(/ {2,}/.test(corrected)){issues.push({tag:"فۆرمات",old:"بۆشایی دووبارە",next:"یەک بۆشایی",why:"بۆشاییە دووبارەکان پێشنیار دەکرێت پاک بکرێنەوە."});corrected=corrected.replace(/ {2,}/g," ")}
 const repeated=/(^|\s)(\S+)(\s+\2)(?=\s|$)/u.exec(corrected);
 if(repeated)issues.push({tag:"دووبارەبوونەوە",old:repeated[2]+" "+repeated[2],next:repeated[2],why:"وشەیەکی هاوشێوە دووجار دەرکەوتووە؛ مەبەست پشتڕاست بکەرەوە."});
 return {corrected,issues};
}
async function checkText(){
 const text=$("sourceText").value.trim();if(!text){toast("سەرەتا دەق بنووسە یان Scan بکە.");return}
 const local=localCheck(text);let corrected=local.corrected,issues=[...local.issues],onlineUsed=false;
 const endpoint=$("apiUrl").value.trim();
 if(endpoint&&navigator.onLine){
  try{
   const res=await fetch(endpoint,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({text,language:"ckb",style:"Rudaw broadcast Sorani",task:"proofread",return_explanations:true})});
   if(!res.ok)throw new Error("API "+res.status);
   const data=await res.json();
   if(typeof data.correctedText==="string")corrected=data.correctedText;
   if(Array.isArray(data.issues))issues=issues.concat(data.issues);
   onlineUsed=true;
  }catch(e){$("feedback").textContent="AI Online بەردەست نەبوو؛ تەنها پشکنینی ناوخۆیی بەکارهاتووە."}
 }
 $("correctedText").value=corrected;$("errorCount").textContent=issues.length;$("modeLabel").textContent=onlineUsed?"Hybrid":"Offline";
 renderIssues(issues);$("feedback").className="feedback"+(issues.length?" warn":"");if(!endpoint||!onlineUsed)$("feedback").textContent=issues.length?"پێشنیاری ناوخۆیی هەیە؛ ئەمە پشکنینی تەواوی ڕێزمان نییە.":"هەڵەیەکی ڕوون بە یاساکانی ناوخۆیی نەدۆزرایەوە؛ ئەمە واتای بێهەڵەبوون نییە.";
 return {corrected,issues};
}
function renderIssues(issues){const box=$("issues");if(!issues.length){box.innerHTML='<p class="empty">هیچ پێشنیارێکی ناوخۆیی نەدۆزرایەوە.</p>';return}box.innerHTML=issues.map(x=>`<div class="issue"><div class="issue-tag">${escapeHtml(x.tag||"پێشنیار")}</div><div><b>${escapeHtml(x.old||"")}</b> ← ${escapeHtml(x.next||"") }<small>${escapeHtml(x.why||"پێشنیاری AI")}</small></div></div>`).join("")}
function escapeHtml(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
function saveHistory(src,out){let arr=JSON.parse(localStorage.getItem("cgHistory")||"[]");arr.unshift({src,out,date:new Date().toLocaleString()});localStorage.setItem("cgHistory",JSON.stringify(arr.slice(0,15)));renderHistory()}
function renderHistory(){const arr=JSON.parse(localStorage.getItem("cgHistory")||"[]");$("historyList").innerHTML=arr.length?arr.map(x=>`<div class="history-item"><span>${escapeHtml(x.src.slice(0,75))}</span><small>${escapeHtml(x.date)}</small></div>`).join(""):'<p class="empty">مێژووی پشکنین لێرە پیشان دەدرێت.</p>'}
$("startCamera").addEventListener("click",startCamera);$("stopCamera").addEventListener("click",stopCamera);$("scanBtn").addEventListener("click",scanCamera);
$("checkText").addEventListener("click",async()=>{const r=await checkText();if(r)saveHistory($("sourceText").value,r.corrected)});
$("clearText").addEventListener("click",()=>{$("sourceText").value="";$("correctedText").value="";$("issues").innerHTML='<p class="empty">هێشتا هیچ پشکنینێک نەکراوە.</p>';$("errorCount").textContent="0"});
$("copyBtn").addEventListener("click",async()=>{try{await navigator.clipboard.writeText($("correctedText").value);toast("دەق کۆپی کرا.")}catch(e){$("correctedText").select();toast("دەق هەڵبژێردرا؛ Copy بکە.")}});
$("useCorrection").addEventListener("click",()=>$("sourceText").value=$("correctedText").value);
$("imageInput").addEventListener("change",e=>{const f=e.target.files[0];if(f)scanBlob(f)});
$("clearHistory").addEventListener("click",()=>{localStorage.removeItem("cgHistory");renderHistory();toast("مێژوو سڕایەوە.")});
window.addEventListener("beforeinstallprompt",e=>{e.preventDefault();deferredInstall=e;$("installBtn").classList.remove("hidden")});
$("installBtn").addEventListener("click",async()=>{if(!deferredInstall)return;deferredInstall.prompt();await deferredInstall.userChoice;deferredInstall=null;$("installBtn").classList.add("hidden")});
if("serviceWorker" in navigator)window.addEventListener("load",()=>navigator.serviceWorker.register("./sw.js").catch(()=>{}));
renderHistory();
