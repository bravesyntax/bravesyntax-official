/* PDF Toolkit engine — ported from pages/pdf-tools.php. Tool logic is unchanged; Next.js adaptations:
 *  - DOM wiring and ?tool= auto-open run in pdfToolsInit(), which the React page calls on every mount
 *    (client-side navigation renders fresh DOM, but this script only loads once);
 *  - the document/window listeners are attached only once;
 *  - "Other PDF Tools" links switch tools without a full page reload.
 * Needs the PDFLib, pdfjsLib, JSZip (and, for OCR, Tesseract) globals that the page loads. */
/* ── State ── */
var currentTool='',uploadedFiles=[],selectedPages=new Set(),viewerDoc=null,viewerPage=1,viewerZoom=1.5;
var sigPaths=[],sigCurrentPath=[],sigDrawing=false;
var exportedBlobs=[];  /* for ZIP download */

/* ── Safe DOM helper (no jQuery collision) ── */
function getEl(id){return document.getElementById(id)}
function formatBytes(b){if(b<1024)return b+' B';if(b<1048576)return(b/1024).toFixed(1)+' KB';return(b/1048576).toFixed(1)+' MB'}

/* ── Toast ── */
function toast(msg,type){
    type=type||'success';
    var el=document.createElement('div');el.className='toast toast-'+type;el.textContent=msg;
    getEl('toastContainer').appendChild(el);
    requestAnimationFrame(function(){el.classList.add('show')});
    setTimeout(function(){el.classList.remove('show');setTimeout(function(){el.remove()},400)},3500);
}

/* ── Tools metadata ── */
var TOOLS={
    merge:{name:'Merge PDF',desc:'Upload multiple PDFs and combine them. Drag to reorder files.',accept:'.pdf',multi:true,icon:'M12 6v6m0 0v6m0-6h6m-6 0H6',btn:'Merge PDFs'},
    split:{name:'Split PDF',desc:'Click page thumbnails to select which pages to extract.',accept:'.pdf',multi:false,icon:'M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4',btn:'Extract Selected'},
    reorder:{name:'Reorder Pages',desc:'Drag and drop page thumbnails to rearrange order.',accept:'.pdf',multi:false,icon:'M4 6h16M4 10h16M4 14h16M4 18h16',btn:'Save Reordered PDF'},
    delete:{name:'Delete Pages',desc:'Click pages to mark them for removal.',accept:'.pdf',multi:false,icon:'M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16',btn:'Delete Selected Pages'},
    rotate:{name:'Rotate Pages',desc:'Select pages and choose rotation angle.',accept:'.pdf',multi:false,icon:'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15',btn:'Rotate & Save'},
    watermark:{name:'Add Watermark',desc:'Add text watermark with custom position, size, color & opacity.',accept:'.pdf',multi:false,icon:'M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01',btn:'Apply Watermark'},
    pagenum:{name:'Page Numbers',desc:'Add page numbers with position, format and start options.',accept:'.pdf',multi:false,icon:'M7 20l4-16m2 16l4-16M6 9h14M4 15h14',btn:'Add Page Numbers'},
    sign:{name:'Sign PDF',desc:'Draw your signature and choose which page to place it on.',accept:'.pdf',multi:false,icon:'M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z',btn:'Apply Signature'},
    metadata:{name:'Edit Metadata',desc:'View and edit the PDF title, author, subject and keywords.',accept:'.pdf',multi:false,icon:'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',btn:'Save Metadata'},
    compress:{name:'Compress PDF',desc:'Reduce file size by re-rendering pages at lower quality.',accept:'.pdf',multi:false,icon:'M19 14l-7 7m0 0l-7-7m7 7V3',btn:'Compress PDF'},
    img2pdf:{name:'Images \u2192 PDF',desc:'Select JPG, PNG or WebP images to combine into a PDF.',accept:'image/jpeg,image/png,image/webp',multi:true,icon:'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z',btn:'Create PDF'},
    pdf2img:{name:'PDF \u2192 Images',desc:'Export pages as PNG/JPG. Download individually or all as ZIP.',accept:'.pdf',multi:false,icon:'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z',btn:'Export Pages'},
    extract:{name:'Extract Text',desc:'Smart extraction + OCR for Hindi, scanned & non-Unicode PDFs.',accept:'.pdf',multi:false,icon:'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',btn:'Extract Text'},
    protect:{name:'Protect PDF',desc:'Strip metadata and flatten for basic protection.',accept:'.pdf',multi:false,icon:'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z',btn:'Protect PDF'},
    unlock:{name:'Unlock PDF',desc:'Attempt to open and re-save a restricted PDF.',accept:'.pdf',multi:false,icon:'M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z',btn:'Unlock & Save'},
    viewer:{name:'PDF Viewer',desc:'Preview with zoom controls and keyboard navigation.',accept:'.pdf',multi:false,icon:'M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z',btn:'View PDF'},
};

/* ── Category filter ── */
function filterTools(cat,btn){
    document.querySelectorAll('.cat-btn').forEach(function(b){b.classList.remove('active')});
    btn.classList.add('active');
    document.querySelectorAll('#toolsList .tool-card').forEach(function(card){
        if(cat==='all'||card.dataset.cat===cat){card.style.display='';card.style.animation='slide-up .3s ease-out forwards'}
        else card.style.display='none';
    });
}

/* ── Open / Close tool ── */
function openTool(id){
    currentTool=id;uploadedFiles=[];selectedPages=new Set();exportedBlobs=[];
    var m=TOOLS[id];
    getEl('toolTitle').textContent=m.name;getEl('toolDesc').textContent=m.desc;
    getEl('toolIconPath').setAttribute('d',m.icon);
    getEl('fileInput').accept=m.accept;getEl('fileInput').multiple=m.multi;
    getEl('dropText').textContent=m.multi?'Drop files here or click to browse':'Drop a file here or click to browse';
    getEl('dropHint').textContent=m.accept==='.pdf'?'PDF files only':'JPG, PNG, WebP images';
    getEl('btnLabel').textContent=m.btn;
    /* ── NEW: push unique URL to browser history ── */
    if(window.history&&window.history.pushState){
        window.history.pushState({tool:id},'',window.location.pathname+'?tool='+id);
    }
    getEl('toolsGrid').classList.add('hidden');getEl('privacyBanner').classList.add('hidden');
    getEl('toolWorkspace').classList.remove('hidden');
    ['fileList','processBtn','progressBar','resultArea','multiResult','textResult','viewerResult','thumbArea','sigArea'].forEach(function(x){getEl(x).classList.add('hidden')});
    getEl('fileList').innerHTML='';getEl('thumbGrid').innerHTML='';
    var o=getEl('toolOptions');o.innerHTML='';o.classList.add('hidden');
    buildOptions(id);
    /* ── NEW: populate other tools strip ── */
    var strip=getEl('otherToolsStrip');
    if(strip){strip.innerHTML=Object.keys(TOOLS).filter(function(k){return k!==id}).map(function(k){
        return '<a href="'+window.location.pathname+'?tool='+k+'" onclick="openTool(\'' +k+ '\');return false" class="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900/60 border border-zinc-800 hover:border-accent/40 rounded-xl text-xs font-mono text-zinc-400 hover:text-white transition-all">'+TOOLS[k].name+'</a>';
    }).join('');}
    window.scrollTo({top:0,behavior:'smooth'});
}
function closeTool(){
    getEl('toolWorkspace').classList.add('hidden');getEl('toolsGrid').classList.remove('hidden');getEl('privacyBanner').classList.remove('hidden');
    currentTool='';uploadedFiles=[];selectedPages.clear();exportedBlobs=[];
    if(viewerDoc){viewerDoc.destroy();viewerDoc=null}
    /* ── NEW: restore clean URL ── */
    if(window.history&&window.history.pushState){
        window.history.pushState({},'',window.location.pathname);
    }
}

/* ── Build tool-specific options ── */
function buildOptions(id){
    var o=getEl('toolOptions');
    var inp=function(label,elId,ph,val){val=val||'';return '<div><label class="block text-sm font-mono text-zinc-400 mb-2">'+label+'</label><input type="text" id="'+elId+'" placeholder="'+ph+'" value="'+val+'" class="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-xl text-white font-mono text-sm focus:outline-none focus:border-accent transition-colors"></div>'};
    var pwd=function(label,elId,ph){return '<div><label class="block text-sm font-mono text-zinc-400 mb-2">'+label+'</label><input type="password" id="'+elId+'" placeholder="'+ph+'" class="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-xl text-white font-mono text-sm focus:outline-none focus:border-accent transition-colors"></div>'};
    var sel=function(label,elId,opts){return '<div><label class="block text-sm font-mono text-zinc-400 mb-2">'+label+'</label><select id="'+elId+'" class="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-xl text-white font-mono text-sm focus:outline-none focus:border-accent">'+opts.map(function(p){return '<option value="'+p[0]+'">'+p[1]+'</option>'}).join('')+'</select></div>'};

    if(id==='rotate'){o.classList.remove('hidden');o.innerHTML='<div class="option-grid">'+sel('Rotation Angle','rotateAngle',[['90','90\u00b0 Clockwise'],['180','180\u00b0'],['270','90\u00b0 Counter-clockwise']])+sel('Apply To','rotateTarget',[['all','All Pages'],['selected','Selected Pages Only']])+'</div>'}
    if(id==='watermark'){o.classList.remove('hidden');o.innerHTML='<div class="option-grid">'+inp('Watermark Text','watermarkText','CONFIDENTIAL','CONFIDENTIAL')+sel('Position','watermarkPos',[['center','Center Diagonal'],['top','Top Center'],['bottom','Bottom Center']])+sel('Font Size','watermarkSize',[['small','Small'],['medium','Medium'],['large','Large']])+sel('Opacity','watermarkOpacity',[['0.1','Subtle (10%)'],['0.2','Light (20%)'],['0.3','Normal (30%)'],['0.5','Strong (50%)'],['0.7','Bold (70%)']])+'</div>'}
    if(id==='pagenum'){o.classList.remove('hidden');o.innerHTML='<div class="option-grid">'+sel('Position','pnPosition',[['bottom-center','Bottom Center'],['bottom-left','Bottom Left'],['bottom-right','Bottom Right'],['top-center','Top Center']])+sel('Format','pnFormat',[['num','1, 2, 3...'],['numtotal','1 / 10, 2 / 10...'],['dash','- 1 -, - 2 -...'],['page','Page 1, Page 2...']])+sel('Start Numbering From','pnStart',[['1','Page 1 (all pages)'],['2','Page 2 (skip cover)'],['3','Page 3']])+'</div>'}
    if(id==='sign'){/* signature options built after file upload */}
    if(id==='protect'){o.classList.remove('hidden');o.innerHTML='<p class="text-xs font-mono text-zinc-500 p-4 bg-zinc-800/30 rounded-xl">This tool strips all metadata, flattens the document structure, and re-saves with object stream compression. For full AES-256 password encryption, a server-side tool is required.</p>'}
    if(id==='unlock'){o.classList.remove('hidden');o.innerHTML=pwd('Enter PDF Password (if any)','unlockPass','Password')+('<p class="text-xs font-mono text-zinc-600 mt-2">Attempts to open with ignoreEncryption flag and re-save a clean copy.</p>')}
    if(id==='pdf2img'){o.classList.remove('hidden');o.innerHTML='<div class="option-grid">'+sel('Quality','imgScale',[['1','Standard (1x)'],['2','High (2x)'],['3','Ultra (3x)']])+sel('Format','imgFormat',[['png','PNG (lossless)'],['jpeg','JPEG (smaller)']])+'</div>'}
    if(id==='compress'){o.classList.remove('hidden');o.innerHTML='<div class="option-grid">'+sel('Compression Level','compressQuality',[['0.8','Light (best quality)'],['0.5','Medium (balanced)'],['0.3','Heavy (smallest file)'],['0.15','Maximum (lowest quality)']])+'</div><p class="text-xs font-mono text-zinc-600 mt-2">Re-renders every page as a JPEG image at chosen quality. Best for image-heavy PDFs.</p>'}
    if(id==='extract'){o.classList.remove('hidden');o.innerHTML='<div class="option-grid">'+sel('Extraction Mode','extractMode',[['standard','Standard (fast — Unicode PDFs)'],['ocr','OCR Mode (Hindi, scanned, non-Unicode)']])+sel('OCR Language','extractLang',[['eng','English'],['hin','Hindi (हिन्दी)'],['hin+eng','Hindi + English'],['mar','Marathi'],['ben','Bengali'],['tam','Tamil'],['tel','Telugu'],['guj','Gujarati'],['kan','Kannada'],['pan','Punjabi'],['urd','Urdu']])+'</div><p id="ocrNote" class="text-xs font-mono text-zinc-600 mt-2">Standard mode uses PDF text layer. Switch to <strong>OCR Mode</strong> for Hindi PDFs, scanned documents, or garbled text.</p>'}
}

/* ── File handling ── */
function bindDropZone(){
    var dz=getEl('dropZone'),fi=getEl('fileInput');
    dz.addEventListener('click',function(){fi.click()});
    dz.addEventListener('dragover',function(e){e.preventDefault();dz.classList.add('drop-active')});
    dz.addEventListener('dragleave',function(){dz.classList.remove('drop-active')});
    dz.addEventListener('drop',function(e){e.preventDefault();dz.classList.remove('drop-active');handleFiles(e.dataTransfer.files)});
    fi.addEventListener('change',function(e){handleFiles(e.target.files)});
}

async function handleFiles(fileList){
    uploadedFiles=[].concat(uploadedFiles,Array.from(fileList));
    renderFileList();getEl('processBtn').classList.remove('hidden');
    var thumbTools=['split','reorder','delete','rotate','viewer'];
    if(thumbTools.indexOf(currentTool)!==-1&&uploadedFiles.length===1) await generateThumbnails(uploadedFiles[0]);
    if(currentTool==='sign'&&uploadedFiles.length){getEl('sigArea').classList.remove('hidden');initSignatureCanvas();buildSignOptions()}
    if(currentTool==='metadata'&&uploadedFiles.length) await loadMetadata(uploadedFiles[0]);
}
function removeFile(i){uploadedFiles.splice(i,1);renderFileList();if(!uploadedFiles.length){getEl('processBtn').classList.add('hidden');getEl('thumbArea').classList.add('hidden');getEl('sigArea').classList.add('hidden')}}

function renderFileList(){
    var l=getEl('fileList');l.classList.remove('hidden');
    l.innerHTML=uploadedFiles.map(function(f,i){return '<div class="file-item flex items-center justify-between px-4 py-3 bg-zinc-800/30 border border-zinc-700/50 rounded-xl group" draggable="'+(currentTool==='merge'?'true':'false')+'" data-idx="'+i+'">'+'<div class="flex items-center gap-3 min-w-0">'+(currentTool==='merge'?'<span class="drag-handle text-zinc-600 hover:text-zinc-400 cursor-grab"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8h16M4 16h16"/></svg></span>':'')+'<div class="w-8 h-8 bg-red-500/10 rounded-lg flex items-center justify-center flex-shrink-0"><svg class="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"/></svg></div><div class="min-w-0"><p class="text-sm font-mono text-white truncate">'+f.name+'</p><p class="text-xs font-mono text-zinc-500">'+formatBytes(f.size)+'</p></div></div><button onclick="removeFile('+i+')" class="p-1 text-zinc-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg></button></div>'}).join('');
    if(currentTool==='merge') initMergeDragDrop();
}

function initMergeDragDrop(){var dragIdx=null;document.querySelectorAll('#fileList .file-item').forEach(function(el){el.addEventListener('dragstart',function(){dragIdx=+el.dataset.idx;el.classList.add('dragging')});el.addEventListener('dragend',function(){el.classList.remove('dragging');document.querySelectorAll('.drag-over-top,.drag-over-bottom').forEach(function(x){x.classList.remove('drag-over-top','drag-over-bottom')})});el.addEventListener('dragover',function(e){e.preventDefault();var r=el.getBoundingClientRect(),mid=r.top+r.height/2;el.classList.toggle('drag-over-top',e.clientY<mid);el.classList.toggle('drag-over-bottom',e.clientY>=mid)});el.addEventListener('dragleave',function(){el.classList.remove('drag-over-top','drag-over-bottom')});el.addEventListener('drop',function(e){e.preventDefault();var dropIdx=+el.dataset.idx;if(dragIdx!==null&&dragIdx!==dropIdx){var item=uploadedFiles.splice(dragIdx,1)[0];uploadedFiles.splice(dropIdx,0,item);renderFileList()}})})}

/* ── Page Thumbnails ── */
async function generateThumbnails(file){
    getEl('thumbArea').classList.remove('hidden');var grid=getEl('thumbGrid');grid.innerHTML='';selectedPages.clear();
    var data=new Uint8Array(await file.arrayBuffer());var pdf=await pdfjsLib.getDocument({data:data}).promise;
    if(['split','delete'].indexOf(currentTool)!==-1){getEl('thumbLabel').textContent=pdf.numPages+' pages \u2014 click to select';getEl('thumbActions').innerHTML='<button onclick="selectAllPages('+pdf.numPages+')" class="px-3 py-1 text-xs font-mono text-zinc-400 border border-zinc-700 rounded-lg hover:text-accent hover:border-accent/30 transition-colors">All</button><button onclick="selectNoPages()" class="px-3 py-1 text-xs font-mono text-zinc-400 border border-zinc-700 rounded-lg hover:text-accent hover:border-accent/30 transition-colors">None</button>'}
    else if(currentTool==='reorder'){getEl('thumbLabel').textContent=pdf.numPages+' pages \u2014 drag to reorder';getEl('thumbActions').innerHTML=''}
    else if(currentTool==='rotate'){getEl('thumbLabel').textContent=pdf.numPages+' pages \u2014 click to select for rotation';getEl('thumbActions').innerHTML='<button onclick="selectAllPages('+pdf.numPages+')" class="px-3 py-1 text-xs font-mono text-zinc-400 border border-zinc-700 rounded-lg hover:text-accent hover:border-accent/30 transition-colors">All</button><button onclick="selectNoPages()" class="px-3 py-1 text-xs font-mono text-zinc-400 border border-zinc-700 rounded-lg hover:text-accent hover:border-accent/30 transition-colors">None</button>'}
    else{getEl('thumbLabel').textContent=pdf.numPages+' pages';getEl('thumbActions').innerHTML=''}
    for(var i=1;i<=pdf.numPages;i++){var page=await pdf.getPage(i);var vp=page.getViewport({scale:0.4});var canvas=document.createElement('canvas');canvas.width=vp.width;canvas.height=vp.height;await page.render({canvasContext:canvas.getContext('2d'),viewport:vp}).promise;var thumb=document.createElement('div');thumb.className='page-thumb';thumb.dataset.page=i;thumb.innerHTML='<div class="page-check"><svg class="w-3 h-3 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24" style="display:none"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/></svg></div><span class="page-num">'+i+'</span>';thumb.prepend(canvas);if(['split','delete','rotate'].indexOf(currentTool)!==-1)(function(n,t){t.addEventListener('click',function(){togglePage(n,t)})})(i,thumb);if(currentTool==='reorder'){thumb.draggable=true;thumb.classList.add('drag-handle');initThumbDrag(thumb)}grid.appendChild(thumb)}
}
function togglePage(num,el){if(selectedPages.has(num)){selectedPages.delete(num);el.classList.remove('selected');el.querySelector('.page-check svg').style.display='none'}else{selectedPages.add(num);el.classList.add('selected');el.querySelector('.page-check svg').style.display=''}getEl('thumbLabel').textContent=selectedPages.size+' of '+getEl('thumbGrid').children.length+' pages selected'}
function selectAllPages(total){selectedPages.clear();for(var i=1;i<=total;i++)selectedPages.add(i);document.querySelectorAll('.page-thumb').forEach(function(el){el.classList.add('selected');el.querySelector('.page-check svg').style.display=''});getEl('thumbLabel').textContent=total+' of '+total+' pages selected'}
function selectNoPages(){selectedPages.clear();document.querySelectorAll('.page-thumb').forEach(function(el){el.classList.remove('selected');el.querySelector('.page-check svg').style.display='none'});getEl('thumbLabel').textContent='0 of '+getEl('thumbGrid').children.length+' pages selected'}
function initThumbDrag(thumb){thumb.addEventListener('dragstart',function(e){e.dataTransfer.setData('text/plain',thumb.dataset.page);thumb.classList.add('dragging')});thumb.addEventListener('dragend',function(){thumb.classList.remove('dragging')});thumb.addEventListener('dragover',function(e){e.preventDefault();thumb.style.outline='2px solid #10b981'});thumb.addEventListener('dragleave',function(){thumb.style.outline=''});thumb.addEventListener('drop',function(e){e.preventDefault();thumb.style.outline='';var from=e.dataTransfer.getData('text/plain'),to=thumb.dataset.page;if(from!==to){var grid=getEl('thumbGrid'),ch=Array.from(grid.children),fEl=ch.find(function(c){return c.dataset.page===from}),tEl=ch.find(function(c){return c.dataset.page===to});if(fEl&&tEl){var fI=ch.indexOf(fEl),tI=ch.indexOf(tEl);if(fI<tI)grid.insertBefore(fEl,tEl.nextSibling);else grid.insertBefore(fEl,tEl)}}})}

/* ── Signature Canvas ── */
function initSignatureCanvas(){var canvas=getEl('sigCanvas');canvas.width=canvas.offsetWidth;var ctx=canvas.getContext('2d');ctx.strokeStyle='#10b981';ctx.lineWidth=2.5;ctx.lineCap='round';ctx.lineJoin='round';function getPos(e){var r=canvas.getBoundingClientRect(),t=e.touches?e.touches[0]:e;return[t.clientX-r.left,t.clientY-r.top]}function start(e){e.preventDefault();sigDrawing=true;sigCurrentPath=[getPos(e)]}function move(e){if(!sigDrawing)return;e.preventDefault();var p=getPos(e);sigCurrentPath.push(p);ctx.beginPath();var prev=sigCurrentPath[sigCurrentPath.length-2];ctx.moveTo(prev[0],prev[1]);ctx.lineTo(p[0],p[1]);ctx.stroke()}function end(){if(sigDrawing){sigDrawing=false;sigPaths.push(sigCurrentPath.slice());sigCurrentPath=[]}}canvas.addEventListener('mousedown',start);canvas.addEventListener('mousemove',move);canvas.addEventListener('mouseup',end);canvas.addEventListener('mouseleave',end);canvas.addEventListener('touchstart',start);canvas.addEventListener('touchmove',move);canvas.addEventListener('touchend',end)}
function clearSignature(){sigPaths=[];sigCurrentPath=[];var c=getEl('sigCanvas');c.getContext('2d').clearRect(0,0,c.width,c.height)}
function undoSignature(){sigPaths.pop();var c=getEl('sigCanvas'),ctx=c.getContext('2d');ctx.clearRect(0,0,c.width,c.height);ctx.strokeStyle='#10b981';ctx.lineWidth=2.5;ctx.lineCap='round';ctx.lineJoin='round';sigPaths.forEach(function(path){if(path.length<2)return;ctx.beginPath();ctx.moveTo(path[0][0],path[0][1]);for(var i=1;i<path.length;i++)ctx.lineTo(path[i][0],path[i][1]);ctx.stroke()})}
async function buildSignOptions(){
    var data=new Uint8Array(await uploadedFiles[0].arrayBuffer());var pdf=await pdfjsLib.getDocument({data:data}).promise;var total=pdf.numPages;
    var o=getEl('toolOptions');o.classList.remove('hidden');var opts=[];for(var i=1;i<=total;i++)opts.push([String(i),'Page '+i]);
    var sel=function(label,elId,items){return '<div><label class="block text-sm font-mono text-zinc-400 mb-2">'+label+'</label><select id="'+elId+'" class="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-xl text-white font-mono text-sm">'+items.map(function(p){return '<option value="'+p[0]+'">'+p[1]+'</option>'}).join('')+'</select></div>'};
    o.innerHTML='<div class="option-grid">'+sel('Place on Page','signPage',opts.concat([['last','Last Page']]))+sel('Position','signPos',[['bottom-right','Bottom Right'],['bottom-left','Bottom Left'],['bottom-center','Bottom Center'],['top-right','Top Right']])+'</div>';
}

/* ── Load Metadata ── */
async function loadMetadata(file){
    var data=new Uint8Array(await file.arrayBuffer());var doc=await PDFLib.PDFDocument.load(data,{ignoreEncryption:true});
    var o=getEl('toolOptions');o.classList.remove('hidden');
    var fields=[['metaTitle','Title',doc.getTitle()||''],['metaAuthor','Author',doc.getAuthor()||''],['metaSubject','Subject',doc.getSubject()||''],['metaCreator','Creator',doc.getCreator()||''],['metaProducer','Producer',doc.getProducer()||''],['metaKeywords','Keywords',doc.getKeywords()||'']];
    o.innerHTML='<div class="space-y-3">'+fields.map(function(f){return '<div><label class="block text-xs font-mono text-zinc-500 mb-1">'+f[1]+'</label><input id="'+f[0]+'" type="text" value="'+String(f[2]).replace(/"/g,'&quot;')+'" class="w-full px-4 py-2.5 bg-zinc-800/50 border border-zinc-700 rounded-xl text-white font-mono text-sm focus:outline-none focus:border-accent transition-colors"></div>'}).join('')+'</div>';
}

/* ── Progress & Download helpers ── */
function showProgress(pct,text){getEl('progressBar').classList.remove('hidden');getEl('progressFill').style.width=pct+'%';getEl('progressPct').textContent=Math.round(pct)+'%';getEl('progressText').textContent=text}
function downloadBlob(blob,name,info){var url=URL.createObjectURL(blob);getEl('downloadLink').href=url;getEl('downloadLink').download=name;getEl('resultInfo').textContent=info||name+' \u2014 '+formatBytes(blob.size);getEl('resultArea').classList.remove('hidden');getEl('processBtn').classList.add('hidden')}
async function readFile(f){return new Uint8Array(await f.arrayBuffer())}
function copyText(){navigator.clipboard.writeText(getEl('extractedText').value);toast('Copied to clipboard!','info')}
function downloadText(){var blob=new Blob([getEl('extractedText').value],{type:'text/plain'});var url=URL.createObjectURL(blob);var a=document.createElement('a');a.href=url;a.download='extracted-text.txt';a.click();URL.revokeObjectURL(url);toast('Text file downloaded!','info')}

/* ═══════════ POSITION-AWARE TEXT EXTRACTION ═══════════ */
function extractTextFromPage(textContent){
    var items=textContent.items;if(!items||!items.length)return '';
    /* Sort items by Y (top to bottom) then X (left to right) */
    var sorted=items.filter(function(it){return it.str&&it.str.trim()}).map(function(it){
        /* transform: [scaleX, skewX, skewY, scaleY, translateX, translateY] */
        var tx=it.transform;return{str:it.str,x:tx[4],y:tx[5],w:it.width,h:Math.abs(tx[3])||12}
    });
    if(!sorted.length)return '';
    /* Sort by Y descending (PDF Y goes bottom-up), then X ascending */
    sorted.sort(function(a,b){
        var dy=b.y-a.y; /* group by line: items within half line-height are same line */
        if(Math.abs(dy)>Math.max(a.h,b.h)*0.4) return dy>0?1:-1;
        return a.x-b.x;
    });
    var lines=[],currentLine=[sorted[0]],lastY=sorted[0].y;
    for(var i=1;i<sorted.length;i++){
        var it=sorted[i];
        var lineThreshold=Math.max(currentLine[0].h,it.h)*0.4;
        if(Math.abs(it.y-lastY)>lineThreshold){
            lines.push(currentLine);currentLine=[it];lastY=it.y;
        }else{
            currentLine.push(it);
        }
    }
    lines.push(currentLine);
    /* Build text with proper spacing */
    var result=[];var prevLineY=null;
    for(var li=0;li<lines.length;li++){
        var line=lines[li];
        line.sort(function(a,b){return a.x-b.x});
        /* Detect gaps between words: if gap > avg char width, insert space */
        var lineStr='';
        for(var wi=0;wi<line.length;wi++){
            if(wi>0){
                var gap=line[wi].x-(line[wi-1].x+line[wi-1].w);
                var avgCharW=line[wi-1].w/(line[wi-1].str.length||1);
                if(gap>avgCharW*0.3) lineStr+=' ';
            }
            lineStr+=line[wi].str;
        }
        /* Detect paragraph breaks (extra vertical gap) */
        if(prevLineY!==null){
            var lineGap=prevLineY-line[0].y;
            var lineH=line[0].h||12;
            if(lineGap>lineH*1.8) result.push('');  /* empty line = paragraph break */
        }
        prevLineY=line[0].y;
        result.push(lineStr);
    }
    return result.join('\n');
}

/* ═══════════ REAL IMAGE-BASED COMPRESSION ═══════════ */
async function compressPdfWithCanvas(fileBytes,quality){
    /* Render each page to canvas at reduced quality, then embed as JPEG */
    var srcPdf=await pdfjsLib.getDocument({data:fileBytes}).promise;
    var newDoc=await PDFLib.PDFDocument.create();
    for(var i=1;i<=srcPdf.numPages;i++){
        showProgress((i/srcPdf.numPages)*90,'Compressing page '+i+'/'+srcPdf.numPages+'...');
        var page=await srcPdf.getPage(i);
        var vp=page.getViewport({scale:1.5}); /* render at 1.5x for decent quality */
        var canvas=document.createElement('canvas');canvas.width=vp.width;canvas.height=vp.height;
        var ctx=canvas.getContext('2d');ctx.fillStyle='#ffffff';ctx.fillRect(0,0,canvas.width,canvas.height);
        await page.render({canvasContext:ctx,viewport:vp}).promise;
        /* Convert to JPEG blob at chosen quality */
        var jpgDataUrl=canvas.toDataURL('image/jpeg',quality);
        var jpgBytes=Uint8Array.from(atob(jpgDataUrl.split(',')[1]),function(c){return c.charCodeAt(0)});
        var img=await newDoc.embedJpg(jpgBytes);
        /* Get original page size to maintain dimensions */
        var origVp=page.getViewport({scale:1});
        var newPage=newDoc.addPage([origVp.width,origVp.height]);
        newPage.drawImage(img,{x:0,y:0,width:origVp.width,height:origVp.height});
    }
    showProgress(95,'Saving...');
    return await newDoc.save({useObjectStreams:true});
}

/* ═══════════ ZIP DOWNLOAD FOR IMAGES ═══════════ */
async function downloadAllAsZip(){
    if(!exportedBlobs.length){toast('No images to download.','error');return}
    var btn=getEl('zipDownloadBtn');btn.disabled=true;btn.textContent='Creating ZIP...';
    try{
        var zip=new JSZip();var format=getEl('imgFormat')?getEl('imgFormat').value:'png';
        for(var i=0;i<exportedBlobs.length;i++){zip.file('page-'+(i+1)+'.'+format,exportedBlobs[i])}
        var content=await zip.generateAsync({type:'blob'});
        var url=URL.createObjectURL(content);var a=document.createElement('a');a.href=url;a.download='pdf-pages.zip';a.click();URL.revokeObjectURL(url);
        toast('ZIP downloaded with '+exportedBlobs.length+' images!','success');
    }catch(e){toast('ZIP creation failed: '+e.message,'error')}
    btn.disabled=false;btn.textContent='Download All as ZIP';
}

/* ═══════════ PROCESS ROUTER ═══════════ */
async function processFiles(){
    var btn=getEl('processBtn');btn.disabled=true;var orig=getEl('btnLabel').textContent;getEl('btnLabel').textContent='Processing...';
    ['resultArea','multiResult','textResult','viewerResult','progressBar'].forEach(function(x){getEl(x).classList.add('hidden')});
    try{
        switch(currentTool){
            case 'merge':await doMerge();break;case 'split':await doSplit();break;case 'reorder':await doReorder();break;case 'delete':await doDelete();break;
            case 'rotate':await doRotate();break;case 'watermark':await doWatermark();break;case 'pagenum':await doPageNum();break;case 'sign':await doSign();break;
            case 'metadata':await doMetadata();break;case 'compress':await doCompress();break;case 'img2pdf':await doImg2Pdf();break;case 'pdf2img':await doPdf2Img();break;
            case 'extract':await doExtract();break;case 'protect':await doProtect();break;case 'unlock':await doUnlock();break;case 'viewer':await doViewer();break;
        }
        if(['viewer','extract','metadata','pdf2img'].indexOf(currentTool)===-1) toast('Processing complete!');
    }catch(e){toast('Error: '+e.message,'error');console.error(e)}
    btn.disabled=false;getEl('btnLabel').textContent=orig;
}

/* ═══════════ TOOL IMPLEMENTATIONS ═══════════ */

async function doMerge(){if(uploadedFiles.length<2){toast('Add at least 2 PDFs.','error');return}var PDFDocument=PDFLib.PDFDocument,merged=await PDFDocument.create();for(var i=0;i<uploadedFiles.length;i++){showProgress((i+1)/uploadedFiles.length*90,'Merging file '+(i+1)+' of '+uploadedFiles.length+'...');var src=await PDFDocument.load(await readFile(uploadedFiles[i]),{ignoreEncryption:true});(await merged.copyPages(src,src.getPageIndices())).forEach(function(p){merged.addPage(p)})}showProgress(100,'Done!');var bytes=await merged.save();downloadBlob(new Blob([bytes],{type:'application/pdf'}),'merged.pdf',uploadedFiles.length+' files merged \u2014 '+formatBytes(bytes.length))}

async function doSplit(){if(!selectedPages.size){toast('Select at least one page.','error');return}var PDFDocument=PDFLib.PDFDocument,src=await PDFDocument.load(await readFile(uploadedFiles[0]),{ignoreEncryption:true});showProgress(50,'Extracting...');var doc=await PDFDocument.create();var indices=Array.from(selectedPages).map(function(n){return n-1}).sort(function(a,b){return a-b});(await doc.copyPages(src,indices)).forEach(function(p){doc.addPage(p)});showProgress(100,'Done!');var bytes=await doc.save();downloadBlob(new Blob([bytes],{type:'application/pdf'}),'extracted.pdf',indices.length+' pages extracted \u2014 '+formatBytes(bytes.length))}

async function doReorder(){var order=Array.from(getEl('thumbGrid').children).map(function(t){return parseInt(t.dataset.page)-1});var PDFDocument=PDFLib.PDFDocument,src=await PDFDocument.load(await readFile(uploadedFiles[0]),{ignoreEncryption:true});showProgress(40,'Reordering...');var doc=await PDFDocument.create();(await doc.copyPages(src,order)).forEach(function(p){doc.addPage(p)});showProgress(100,'Done!');var bytes=await doc.save();downloadBlob(new Blob([bytes],{type:'application/pdf'}),'reordered.pdf',order.length+' pages reordered')}

async function doDelete(){if(!selectedPages.size){toast('Select pages to delete.','error');return}var PDFDocument=PDFLib.PDFDocument,src=await PDFDocument.load(await readFile(uploadedFiles[0]),{ignoreEncryption:true});var total=src.getPageCount(),keep=[];for(var i=0;i<total;i++)if(!selectedPages.has(i+1))keep.push(i);if(!keep.length){toast('Cannot delete all pages.','error');return}showProgress(50,'Removing...');var doc=await PDFDocument.create();(await doc.copyPages(src,keep)).forEach(function(p){doc.addPage(p)});showProgress(100,'Done!');var bytes=await doc.save();downloadBlob(new Blob([bytes],{type:'application/pdf'}),'trimmed.pdf',selectedPages.size+' pages deleted, '+keep.length+' remaining')}

async function doRotate(){var angle=parseInt(getEl('rotateAngle').value||'90'),target=getEl('rotateTarget').value||'all';var doc=await PDFLib.PDFDocument.load(await readFile(uploadedFiles[0]),{ignoreEncryption:true});var degrees=PDFLib.degrees;doc.getPages().forEach(function(p,i){if(target==='all'||selectedPages.has(i+1)){showProgress((i+1)/doc.getPageCount()*100,'Rotating page '+(i+1)+'...');p.setRotation(degrees(p.getRotation().angle+angle))}});showProgress(100,'Done!');var bytes=await doc.save();downloadBlob(new Blob([bytes],{type:'application/pdf'}),'rotated.pdf')}

async function doWatermark(){var text=getEl('watermarkText').value||'WATERMARK',pos=getEl('watermarkPos').value||'center';var sizeMap={small:0.05,medium:0.08,large:0.12};var sizeMult=sizeMap[getEl('watermarkSize').value]||0.08;var opacity=parseFloat(getEl('watermarkOpacity').value||'0.3');var doc=await PDFLib.PDFDocument.load(await readFile(uploadedFiles[0]),{ignoreEncryption:true});var font=await doc.embedFont(PDFLib.StandardFonts.HelveticaBold);var rgb=PDFLib.rgb,degrees=PDFLib.degrees;doc.getPages().forEach(function(page,i){showProgress((i+1)/doc.getPageCount()*100,'Watermarking page '+(i+1)+'...');var size=page.getSize(),w=size.width,h=size.height;var fs=Math.min(w,h)*sizeMult;var tw=font.widthOfTextAtSize(text,fs);var x,y,rot;if(pos==='center'){x=(w-tw)/2;y=h/2;rot=degrees(45)}else if(pos==='top'){x=(w-tw)/2;y=h-40;rot=degrees(0)}else{x=(w-tw)/2;y=30;rot=degrees(0)}page.drawText(text,{x:x,y:y,size:fs,font:font,color:rgb(0.6,0.6,0.6),opacity:opacity,rotate:rot})});showProgress(100,'Done!');var bytes=await doc.save();downloadBlob(new Blob([bytes],{type:'application/pdf'}),'watermarked.pdf')}

async function doPageNum(){var position=getEl('pnPosition').value||'bottom-center',format=getEl('pnFormat').value||'num',startFrom=parseInt(getEl('pnStart').value||'1');var doc=await PDFLib.PDFDocument.load(await readFile(uploadedFiles[0]),{ignoreEncryption:true});var font=await doc.embedFont(PDFLib.StandardFonts.Helvetica);var rgb=PDFLib.rgb;var pages=doc.getPages(),total=pages.length;var numberedCount=total-startFrom+1;pages.forEach(function(page,i){if(i<startFrom-1)return;showProgress((i+1)/total*100,'Page '+(i+1)+'...');var size=page.getSize(),w=size.width,h=size.height;var displayNum=i-startFrom+2;var label;if(format==='num')label=String(displayNum);else if(format==='numtotal')label=displayNum+' / '+numberedCount;else if(format==='dash')label='- '+displayNum+' -';else label='Page '+displayNum;var tw=font.widthOfTextAtSize(label,10);var x,y;if(position==='bottom-center'){x=(w-tw)/2;y=22}else if(position==='bottom-left'){x=40;y=22}else if(position==='bottom-right'){x=w-tw-40;y=22}else{x=(w-tw)/2;y=h-30}page.drawText(label,{x:x,y:y,size:10,font:font,color:rgb(0.4,0.4,0.4)})});showProgress(100,'Done!');var bytes=await doc.save();downloadBlob(new Blob([bytes],{type:'application/pdf'}),'numbered.pdf')}

async function doSign(){if(!sigPaths.length){toast('Draw a signature first.','error');return}var sigCanvas=getEl('sigCanvas'),sigDataUrl=sigCanvas.toDataURL('image/png');var sigBytes=Uint8Array.from(atob(sigDataUrl.split(',')[1]),function(c){return c.charCodeAt(0)});var doc=await PDFLib.PDFDocument.load(await readFile(uploadedFiles[0]),{ignoreEncryption:true});var sigImg=await doc.embedPng(sigBytes);var pages=doc.getPages();var pageChoice=getEl('signPage')?getEl('signPage').value:'last';var pageIdx=pageChoice==='last'?pages.length-1:parseInt(pageChoice)-1;if(pageIdx<0||pageIdx>=pages.length)pageIdx=pages.length-1;var targetPage=pages[pageIdx];var size=targetPage.getSize(),w=size.width;var sigW=150,sigH=(sigImg.height/sigImg.width)*sigW;var posChoice=getEl('signPos')?getEl('signPos').value:'bottom-right';var x,y;if(posChoice==='bottom-right'){x=w-sigW-50;y=40}else if(posChoice==='bottom-left'){x=50;y=40}else if(posChoice==='bottom-center'){x=(w-sigW)/2;y=40}else{x=w-sigW-50;y=size.height-sigH-40}showProgress(60,'Placing signature...');targetPage.drawImage(sigImg,{x:x,y:y,width:sigW,height:sigH});showProgress(100,'Done!');var bytes=await doc.save();downloadBlob(new Blob([bytes],{type:'application/pdf'}),'signed.pdf')}

async function doMetadata(){var doc=await PDFLib.PDFDocument.load(await readFile(uploadedFiles[0]),{ignoreEncryption:true});doc.setTitle(getEl('metaTitle').value||'');doc.setAuthor(getEl('metaAuthor').value||'');doc.setSubject(getEl('metaSubject').value||'');doc.setCreator(getEl('metaCreator').value||'');doc.setProducer(getEl('metaProducer').value||'');doc.setKeywords((getEl('metaKeywords').value||'').split(',').map(function(s){return s.trim()}).filter(Boolean));showProgress(80,'Saving...');var bytes=await doc.save();showProgress(100,'Done!');downloadBlob(new Blob([bytes],{type:'application/pdf'}),'metadata-updated.pdf');toast('Metadata updated!')}

async function doCompress(){showProgress(5,'Loading PDF...');var original=await readFile(uploadedFiles[0]);var quality=parseFloat(getEl('compressQuality')?getEl('compressQuality').value:'0.5');var origSize=uploadedFiles[0].size;/* read before pdf.js takes ownership of (and empties) the byte array */var compressed=await compressPdfWithCanvas(original,quality);showProgress(100,'Done!');var saved=((1-compressed.length/origSize)*100).toFixed(1);downloadBlob(new Blob([compressed],{type:'application/pdf'}),'compressed.pdf',formatBytes(origSize)+' \u2192 '+formatBytes(compressed.length)+' ('+saved+'% '+(saved>0?'smaller':'larger')+')')}

async function doImg2Pdf(){var PDFDocument=PDFLib.PDFDocument,doc=await PDFDocument.create();for(var i=0;i<uploadedFiles.length;i++){showProgress((i+1)/uploadedFiles.length*100,'Adding image '+(i+1)+'...');var bytes=await readFile(uploadedFiles[i]),type=uploadedFiles[i].type;var img=(type==='image/png'||type==='image/webp')?await doc.embedPng(bytes):await doc.embedJpg(bytes);doc.addPage([img.width,img.height]).drawImage(img,{x:0,y:0,width:img.width,height:img.height})}var outBytes=await doc.save();downloadBlob(new Blob([outBytes],{type:'application/pdf'}),'images.pdf',uploadedFiles.length+' images combined')}

async function doPdf2Img(){var scale=parseInt(getEl('imgScale').value||'2'),format=getEl('imgFormat').value||'png';var data=await readFile(uploadedFiles[0]),pdf=await pdfjsLib.getDocument({data:data}).promise;var container=getEl('multiDownloads');container.innerHTML='';exportedBlobs=[];getEl('multiResult').classList.remove('hidden');getEl('processBtn').classList.add('hidden');for(var i=1;i<=pdf.numPages;i++){showProgress(i/pdf.numPages*100,'Rendering page '+i+'...');var page=await pdf.getPage(i),vp=page.getViewport({scale:scale});var canvas=document.createElement('canvas');canvas.width=vp.width;canvas.height=vp.height;var ctx=canvas.getContext('2d');ctx.fillStyle='#ffffff';ctx.fillRect(0,0,canvas.width,canvas.height);await page.render({canvasContext:ctx,viewport:vp}).promise;var blob=await new Promise(function(resolve){canvas.toBlob(resolve,format==='jpeg'?'image/jpeg':'image/png',0.92)});exportedBlobs.push(blob);var url=URL.createObjectURL(blob);container.innerHTML+='<a href="'+url+'" download="page-'+i+'.'+format+'" class="flex items-center gap-2 px-4 py-3 bg-zinc-800/30 border border-zinc-700/50 rounded-xl text-sm font-mono text-white hover:border-accent/50 hover:text-accent transition-colors"><svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>Page '+i+'</a>'}showProgress(100,'All pages exported!');toast(pdf.numPages+' pages exported as '+format.toUpperCase()+'!')}

async function doExtract(){
    var mode=getEl('extractMode')?getEl('extractMode').value:'standard';
    var lang=getEl('extractLang')?getEl('extractLang').value:'eng';
    if(mode==='ocr'){await doExtractOCR(lang);return}
    /* Standard mode */
    showProgress(5,'Loading PDF...');var data=await readFile(uploadedFiles[0]);var pdf=await pdfjsLib.getDocument({data:data}).promise;var allText='';for(var i=1;i<=pdf.numPages;i++){showProgress(i/pdf.numPages*95,'Extracting page '+i+'/'+pdf.numPages+'...');var page=await pdf.getPage(i);var content=await page.getTextContent();var pageText=extractTextFromPage(content);allText+='\u2550\u2550\u2550 Page '+i+' \u2550\u2550\u2550\n'+pageText+'\n\n'}getEl('extractedText').value=allText.trim();var words=allText.split(/\s+/).filter(Boolean).length;var chars=allText.length;getEl('textInfo').textContent=pdf.numPages+' pages \u00b7 ~'+words.toLocaleString()+' words \u00b7 '+chars.toLocaleString()+' characters (Standard mode)';getEl('textResult').classList.remove('hidden');getEl('processBtn').classList.add('hidden');showProgress(100,'Extracted!');toast('Text extracted from '+pdf.numPages+' pages!')
}

/* ═══════════ OCR-BASED TEXT EXTRACTION (Tesseract.js) ═══════════ */
async function doExtractOCR(lang){
    showProgress(2,'Loading PDF for OCR...');
    var data=await readFile(uploadedFiles[0]);
    var pdf=await pdfjsLib.getDocument({data:data}).promise;
    var totalPages=pdf.numPages;

    showProgress(5,'Initializing Tesseract OCR ('+lang+')...\nFirst run downloads language data (~2-15MB). Please wait.');

    /* Create Tesseract worker */
    var worker=await Tesseract.createWorker(lang,1,{
        logger:function(m){
            if(m.status==='recognizing text'&&m.progress){
                /* m.progress is 0-1 for current page */
            }
        }
    });

    var allText='';
    for(var i=1;i<=totalPages;i++){
        var basePct=5+((i-1)/totalPages)*90;
        var pagePct=90/totalPages;
        showProgress(basePct,'OCR: Rendering page '+i+'/'+totalPages+'...');

        /* Render page to canvas at 2x for good OCR quality */
        var page=await pdf.getPage(i);
        var vp=page.getViewport({scale:2.0});
        var canvas=document.createElement('canvas');
        canvas.width=vp.width;canvas.height=vp.height;
        var ctx=canvas.getContext('2d');
        ctx.fillStyle='#ffffff';ctx.fillRect(0,0,canvas.width,canvas.height);
        await page.render({canvasContext:ctx,viewport:vp}).promise;

        showProgress(basePct+pagePct*0.3,'OCR: Recognizing page '+i+'/'+totalPages+' (this may take a moment)...');

        /* Run OCR on the rendered canvas */
        var result=await worker.recognize(canvas);
        var pageText=result.data.text||'';

        allText+='\u2550\u2550\u2550 Page '+i+' \u2550\u2550\u2550\n'+pageText.trim()+'\n\n';
        showProgress(basePct+pagePct,'OCR: Page '+i+' complete.');
    }

    /* Terminate worker */
    await worker.terminate();

    getEl('extractedText').value=allText.trim();
    var words=allText.split(/\s+/).filter(Boolean).length;
    var chars=allText.length;
    getEl('textInfo').textContent=totalPages+' pages \u00b7 ~'+words.toLocaleString()+' words \u00b7 '+chars.toLocaleString()+' characters (OCR mode: '+lang+')';
    getEl('textResult').classList.remove('hidden');
    getEl('processBtn').classList.add('hidden');
    showProgress(100,'OCR Extraction complete!');
    toast('OCR text extracted from '+totalPages+' pages!');
}

async function doProtect(){showProgress(30,'Loading...');var PDFDocument=PDFLib.PDFDocument;var src=await PDFDocument.load(await readFile(uploadedFiles[0]),{ignoreEncryption:true});showProgress(60,'Stripping metadata & flattening...');var doc=await PDFDocument.create();(await doc.copyPages(src,src.getPageIndices())).forEach(function(p){doc.addPage(p)});doc.setTitle('');doc.setAuthor('');doc.setSubject('');doc.setKeywords([]);doc.setProducer('BraveSyntax PDF Tools');doc.setCreator('');showProgress(90,'Saving...');var bytes=await doc.save({useObjectStreams:true});showProgress(100,'Done!');downloadBlob(new Blob([bytes],{type:'application/pdf'}),'protected.pdf','Metadata stripped & structure flattened \u2014 '+formatBytes(bytes.length));toast('PDF cleaned and protected!','info')}

async function doUnlock(){var pass=getEl('unlockPass')?getEl('unlockPass').value:'';showProgress(30,'Attempting to open...');try{var data=await readFile(uploadedFiles[0]);var doc=await PDFLib.PDFDocument.load(data,{ignoreEncryption:true,password:pass||undefined});showProgress(60,'Re-saving without restrictions...');var newDoc=await PDFLib.PDFDocument.create();(await newDoc.copyPages(doc,doc.getPageIndices())).forEach(function(p){newDoc.addPage(p)});newDoc.setTitle(doc.getTitle()||'');newDoc.setAuthor(doc.getAuthor()||'');var bytes=await newDoc.save();showProgress(100,'Done!');downloadBlob(new Blob([bytes],{type:'application/pdf'}),'unlocked.pdf','Restrictions removed \u2014 '+formatBytes(bytes.length))}catch(e){toast('Could not unlock: '+e.message,'error')}}

async function doViewer(){showProgress(30,'Loading...');var data=await readFile(uploadedFiles[0]);viewerDoc=await pdfjsLib.getDocument({data:data}).promise;viewerPage=1;viewerZoom=1.5;getEl('viewerInfo').textContent=viewerDoc.numPages+' pages \u00b7 '+formatBytes(uploadedFiles[0].size);getEl('viewerResult').classList.remove('hidden');getEl('processBtn').classList.add('hidden');showProgress(100,'Loaded!');await renderViewerPage();toast('Viewing '+viewerDoc.numPages+'-page PDF','info')}

async function renderViewerPage(){if(!viewerDoc)return;var page=await viewerDoc.getPage(viewerPage);var vp=page.getViewport({scale:viewerZoom});var canvas=getEl('viewerCanvas');canvas.width=vp.width;canvas.height=vp.height;var ctx=canvas.getContext('2d');ctx.fillStyle='#ffffff';ctx.fillRect(0,0,canvas.width,canvas.height);await page.render({canvasContext:ctx,viewport:vp}).promise;getEl('viewerPageNum').textContent=viewerPage+' / '+viewerDoc.numPages;getEl('viewerZoomLbl').textContent=Math.round(viewerZoom*100/1.5*100)+'%'}
function viewerPrev(){if(viewerPage>1){viewerPage--;renderViewerPage()}}
function viewerNext(){if(viewerDoc&&viewerPage<viewerDoc.numPages){viewerPage++;renderViewerPage()}}
function viewerZoomIn(){viewerZoom=Math.min(viewerZoom+0.3,5);renderViewerPage()}
function viewerZoomOut(){viewerZoom=Math.max(viewerZoom-0.3,0.5);renderViewerPage()}

/* ── Keyboard shortcuts for viewer ── */
function onViewerKeydown(e){
    if(currentTool!=='viewer'||!viewerDoc)return;
    if(e.key==='ArrowLeft'||e.key==='ArrowUp'){e.preventDefault();viewerPrev()}
    else if(e.key==='ArrowRight'||e.key==='ArrowDown'){e.preventDefault();viewerNext()}
    else if(e.key==='+'||e.key==='='){e.preventDefault();viewerZoomIn()}
    else if(e.key==='-'){e.preventDefault();viewerZoomOut()}
}


/* ── Browser back/forward button support ── */
function onToolPopstate(){
    var params=new URLSearchParams(window.location.search);
    var tool=params.get('tool');
    if(tool&&TOOLS[tool]){
        openTool(tool);
    } else if(currentTool){
        getEl('toolWorkspace').classList.add('hidden');
        getEl('toolsGrid').classList.remove('hidden');
        getEl('privacyBanner').classList.remove('hidden');
        currentTool='';uploadedFiles=[];selectedPages.clear();exportedBlobs=[];
        if(viewerDoc){viewerDoc.destroy();viewerDoc=null}
    }
}

/* ── Called by the page component on every mount ── */
function pdfToolsInit(){
    currentTool='';uploadedFiles=[];selectedPages=new Set();exportedBlobs=[];
    sigPaths=[];sigCurrentPath=[];sigDrawing=false;
    if(viewerDoc){viewerDoc.destroy();viewerDoc=null}
    bindDropZone();
    if(!window.__pdfToolsListeners){
        document.addEventListener('keydown',onViewerKeydown);
        window.addEventListener('popstate',onToolPopstate);
        window.__pdfToolsListeners=true;
    }
    var tool=new URLSearchParams(window.location.search).get('tool');
    if(tool&&TOOLS[tool]) openTool(tool);
}
window.pdfToolsInit=pdfToolsInit;
