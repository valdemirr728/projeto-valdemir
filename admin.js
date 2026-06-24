
/* GF NAV CLEAN 2026-06-22: manter somente gfStableSideNav/gfStableMobileNav */
(function(){
  window.__GF_USE_STABLE_NAV_ONLY_20260622__=true;
  function kill(){ try{ document.querySelectorAll('#gfMobileBottomNav,#gfUltimateMobileNav,#gfOneMobileNav,#gfFinalMobileNav,.gfSideOverlay,.gfSideNav').forEach(function(el){ if(!el.hasAttribute('data-gf-stable-keep')) el.remove(); }); }catch(e){} }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',kill,{once:true}); else kill();
  try{ new MutationObserver(kill).observe(document.documentElement,{childList:true,subtree:true}); }catch(e){}
})();

/* GF V37 PERFORMANCE */
window.__gfDashboardCacheHtml=window.__gfDashboardCacheHtml||'';
window.__gfDashboardCacheTs=window.__gfDashboardCacheTs||0;

/* GF V35 MOBILE LITE - celular leve, PC completo */
(function(){
  if(window.__GF_V35_MOBILE_LITE__) return;
  window.__GF_V35_MOBILE_LITE__ = true;

  window.gfIsMobileLiteV35 = function(){
    try{
      return !!(window.matchMedia && window.matchMedia('(max-width:700px)').matches);
    }catch(e){ return false; }
  };

  window.gfMobileLiteIdleV35 = function(fn, delay){
    if(!window.gfIsMobileLiteV35()) return fn();
    return setTimeout(function(){ try{ fn(); }catch(e){} }, delay || 1200);
  };
})();



/* GF_NAV_FAST_CACHE */
window.__gfViewCache=window.__gfViewCache||{};
document.addEventListener('click',function(e){
 const b=e.target.closest('[data-view],[data-module]');
 if(!b)return;
 document.body.classList.add('gf-nav-fast');
},{passive:true});

/* GF_CLEAN_VERSION 20260613-heavy-clean */
(function(){
  'use strict';
  if(window.__gfAssumeConfirmVisibleProtectionV1) return;
  window.__gfAssumeConfirmVisibleProtectionV1 = true;

  function installCss(){
    if(document.getElementById('gfAssumeConfirmCss')) return;
    var st=document.createElement('style');
    st.id='gfAssumeConfirmCss';
    st.textContent = [
      '#gfAssumeConfirmOverlay{position:fixed!important;inset:0!important;z-index:2147483647!important;display:flex!important;align-items:center!important;justify-content:center!important;padding:18px!important;background:rgba(5,14,35,.68)!important;}',
      '#gfAssumeConfirmBox{position:relative!important;top:auto!important;left:auto!important;right:auto!important;bottom:auto!important;transform:none!important;width:min(460px,calc(100vw - 36px))!important;background:#fff!important;border:1px solid #d9e7fb!important;border-radius:24px!important;box-shadow:0 25px 80px rgba(0,0,0,.35)!important;padding:24px!important;text-align:center!important;font-family:inherit!important;}',
      '#gfAssumeConfirmBox h3{margin:0 0 8px!important;color:#06183d!important;font-size:23px!important;font-weight:900!important;}',
      '#gfAssumeConfirmBox p{margin:0 0 22px!important;color:#334766!important;font-size:15px!important;line-height:1.45!important;}',
      '#gfAssumeConfirmBox .gfAssumeActions{display:flex!important;gap:12px!important;justify-content:center!important;flex-wrap:wrap!important;}',
      '#gfAssumeConfirmBox button{border-radius:16px!important;padding:14px 20px!important;min-width:150px!important;font-weight:900!important;cursor:pointer!important;box-shadow:0 10px 24px rgba(0,0,0,.10)!important;touch-action:manipulation!important;-webkit-tap-highlight-color:transparent!important;user-select:none!important;}',
      '#gfAssumeConfirmBox button:disabled{opacity:.72!important;cursor:wait!important;}',
      '#gfAssumeCancel{background:#fff!important;color:#08224d!important;border:1px solid #d6e3f4!important;}',
      '#gfAssumeOk{background:linear-gradient(135deg,#f59e0b,#ffb31a)!important;color:#06183d!important;border:0!important;}'
    ].join('');
    (document.head||document.documentElement).appendChild(st);
  }

  window.gfPublicTicketNumber = function(id){
    id=Number(id||0);
    try{
      var lists=[];
      if(Array.isArray(window.tickets)) lists.push(window.tickets);
      if(typeof tickets!=='undefined' && Array.isArray(tickets)) lists.push(tickets);
      if(Array.isArray(window.allTickets)) lists.push(window.allTickets);
      if(Array.isArray(window.dashboardTickets)) lists.push(window.dashboardTickets);
      for(var i=0;i<lists.length;i++){
        var found=lists[i].find(function(t){return Number(t&&t.id)===id;});
        if(found){
          return found.ticket_number || found.number || found.public_number || found.protocol || id;
        }
      }
    }catch(e){}
    return id;
  };

  window.gfShowAssumeConfirmModal = function(id, displayNumber){
    id=Number(id||0);
    displayNumber = displayNumber || window.gfPublicTicketNumber(id);
    return new Promise(function(resolve){
      installCss();
      var old=document.getElementById('gfAssumeConfirmOverlay');
      if(old) old.remove();
      var ov=document.createElement('div');
      ov.id='gfAssumeConfirmOverlay';
      ov.innerHTML='<div id="gfAssumeConfirmBox" role="dialog" aria-modal="true">'
        +'<h3>Assumir chamado?</h3>'
        +'<p>Deseja realmente assumir o chamado nº <b>'+displayNumber+'</b>?</p>'
        +'<div class="gfAssumeActions">'
        +'<button type="button" id="gfAssumeCancel">Cancelar</button>'
        +'<button type="button" id="gfAssumeOk">Sim, assumir</button>'
        +'</div></div>';
      document.body.appendChild(ov);
      var finished=false;
      function done(v){
        if(finished) return;
        finished=true;
        try{
          var btns=ov.querySelectorAll('button');
          btns.forEach(function(b){ b.disabled=true; });
          var okBtn=ov.querySelector('#gfAssumeOk');
          if(v && okBtn) okBtn.textContent='Assumindo...';
        }catch(e){}
        setTimeout(function(){ try{ov.remove();}catch(e){} resolve(!!v); }, v ? 60 : 0);
      }
      function bindFast(btn, value){
        if(!btn) return;
        var fire=function(e){
          try{ e.preventDefault(); e.stopPropagation(); if(e.stopImmediatePropagation) e.stopImmediatePropagation(); }catch(_e){}
          done(value);
        };
        btn.addEventListener('pointerup', fire, {passive:false});
        btn.addEventListener('touchend', fire, {passive:false});
        btn.addEventListener('click', fire, {passive:false});
      }
      bindFast(ov.querySelector('#gfAssumeCancel'), false);
      bindFast(ov.querySelector('#gfAssumeOk'), true);
      ov.addEventListener('click',function(e){ if(e.target===ov) done(false); });
      setTimeout(function(){try{ov.querySelector('#gfAssumeOk').focus();}catch(e){}},30);
    });
  };

  window.gfConfirmAssumeBeforeStatus = async function(id,status){
    id=Number(id||0);
    status=String(status||'').toUpperCase();
    if(status!=='IN_PROGRESS') return true;
    if(!id) return false;
    if(window.__gfAssumeConfirmedTicketId===id) return true;
    var ok=await window.gfShowAssumeConfirmModal(id, window.gfPublicTicketNumber(id));
    if(!ok) return false;
    window.__gfAssumeConfirmedTicketId=id;
    setTimeout(function(){ if(window.__gfAssumeConfirmedTicketId===id) window.__gfAssumeConfirmedTicketId=0; }, 6000);
    return true;
  };

  var oldFetch=window.fetch;
  if(oldFetch && !oldFetch.__gfAssumeConfirmFetch){
    var wrappedFetch=async function(input, init){
      init=init||{};
      try{
        var url=(typeof input==='string')?input:(input&&input.url?input.url:'');
        var method=String(init.method||'GET').toUpperCase();
        var body=init.body;
        var bodyText=(typeof body==='string')?body:'';
        var isStatus=/\/api\/admin\/tickets\/\d+\/status/i.test(String(url));
        var wantsProgress = bodyText.indexOf('IN_PROGRESS')>=0 || (body && typeof FormData!=='undefined' && body instanceof FormData && String(body.get('status')||'').toUpperCase()==='IN_PROGRESS');
        if(isStatus && method==='POST' && wantsProgress){
          var m=String(url).match(/\/tickets\/(\d+)\/status/i), tid=m?Number(m[1]):0;
          if(!(await window.gfConfirmAssumeBeforeStatus(tid,'IN_PROGRESS'))){
            return new Response(JSON.stringify({ok:false,cancelled:true,error:'Assunção cancelada pelo usuário.'}),{status:499,headers:{'Content-Type':'application/json'}});
          }
          var headers=new Headers(init.headers||{});
          headers.set('x-gf-assume-confirmed','YES');
          init=Object.assign({},init,{headers:headers});
          if(typeof body==='string'){
            try{ var obj=JSON.parse(body); obj.assume_confirmed='YES'; init.body=JSON.stringify(obj); }
            catch(e){}
          }else if(body && typeof FormData!=='undefined' && body instanceof FormData){
            body.set('assume_confirmed','YES'); init.body=body;
          }
        }
      }catch(e){}
      return oldFetch.apply(this,arguments.length===1?[input]:[input,init]);
    };
    wrappedFetch.__gfAssumeConfirmFetch=true;
    window.fetch=wrappedFetch;
  }
})();

let gfAiHistory=[];
function gfAiBox(){return document.getElementById('gfAiMessages')}
function addGfAiMessage(type,text){
  const box=gfAiBox(); if(!box)return;
  const div=document.createElement('div');
  div.className='gfAiMsg '+(type||'bot');
  div.textContent=String(text||'');
  box.appendChild(div);
  box.scrollTop=box.scrollHeight;
}
function setGfAiStatus(text,busy){
  const el=document.getElementById('gfAiStatus'); if(!el)return;
  el.textContent=text||'pronta';
  el.style.background=busy?'#fff3d2':'#e8fff1';
  el.style.color=busy?'#8b6100':'#14824e';
}
function initGfAi(){
  const input=document.getElementById('gfAiInput');
  if(input&&!input.__gfAiEnter){
    input.__gfAiEnter=true;
    input.addEventListener('keydown',function(e){
      if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();sendGfAiMessage();}
    });
  }
}
function askGfAiQuick(text){const input=document.getElementById('gfAiInput');if(input){input.value=text;sendGfAiMessage();}}
async function sendGfAiMessage(){
  const input=document.getElementById('gfAiInput');
  const btn=document.getElementById('gfAiSendBtn');
  const message=String(input?.value||'').trim();
  if(!message){toastMsg('Digite uma pergunta para a IA.');return;}
  addGfAiMessage('user',message);
  gfAiHistory.push({role:'user',content:message});
  if(input)input.value='';
  if(btn)btn.disabled=true;
  setGfAiStatus('pensando...',true);
  try{
    const r=await fetch(API+'/api/admin/ai-chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message,history:gfAiHistory.slice(-8),panel_context:(typeof buildPanelContext==='function'?buildPanelContext():null)})});
    const j=await r.json().catch(()=>({}));
    if(!r.ok||!j.ok) throw new Error(j.error||'Falha ao consultar IA');
    const answer=String(j.answer||'Sem resposta.');
    addGfAiMessage('bot',answer);
    gfAiHistory.push({role:'assistant',content:answer});
  }catch(err){
    addGfAiMessage('bot','Não consegui consultar a IA agora. Verifique se o token está no .env e se o servidor foi reiniciado. Detalhe: '+(err.message||err));
  }finally{
    if(btn)btn.disabled=false;
    setGfAiStatus('pronta',false);
  }
}

;
const API=window.location.origin;let tickets=[],current=null,me=null,firstLoad=true,lastMaxId=0,statusBusy=false,quick='ALL',sectors=[],assets=[],issues=[];
function roleOf(){return String(me?.role||'').toUpperCase()}
function isAdmin(){return roleOf()==='ADMIN'}
function isTech(){return roleOf()==='TECH'}
function canHandleTickets(){return isAdmin()||isTech()}
function guardAction(type){
  if(type==='ticket'&&!canHandleTickets()){toastMsg('Visualizador possui acesso somente leitura.');return false}
  if(type==='admin'&&!isAdmin()){toastMsg('Somente administrador pode cadastrar, editar ou transferir.');return false}
  return true
}

function currentUserOwnsTicket(t){
  const normName = (v)=>String(v||'')
    .trim()
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g,'')
    .replace(/[^A-Z0-9@._ -]/g,'')
    .replace(/\s+/g,' ');
  const samePersonName = (a,b)=>{
    a=normName(a); b=normName(b);
    if(!a || !b) return false;
    if(a===b) return true;
    if(a.length>=3 && b.length>=3 && (a.startsWith(b) || b.startsWith(a))) return true;
    const aw=a.split(' ').filter(Boolean);
    const bw=b.split(' ').filter(Boolean);
    if(!aw.length || !bw.length) return false;
    // Evita travar quando a API devolve só primeiro nome ou nome curto.
    if(aw[0] && bw[0] && aw[0]===bw[0]){
      if(aw.length===1 || bw.length===1) return true;
      if(aw[1] && bw[1] && aw[1]===bw[1]) return true;
    }
    return false;
  };
  const u1 = (typeof me !== 'undefined' && me) ? me : {};
  const u2 = window.me || {};
  const u3 = window.currentUser || window.user || {};
  const myId = Number(u1.id || u2.id || u3.id || localStorage.getItem('user_id') || 0);
  const assignedId = Number(t && (t.assigned_to_user_id || t.assignee_id || t.responsible_user_id || t.assigned_user_id || t.user_id) || 0);
  if(myId && assignedId && assignedId === myId) return true;
  const myNames = [
    u1.name,u1.nome,u1.display_name,u1.username,u1.full_name,u1.short_name,u1.email,
    u2.name,u2.nome,u2.display_name,u2.username,u2.full_name,u2.short_name,u2.email,
    u3.name,u3.nome,u3.display_name,u3.username,u3.full_name,u3.short_name,u3.email,
    localStorage.getItem('user_name'), localStorage.getItem('name'), localStorage.getItem('display_name'), localStorage.getItem('username'), localStorage.getItem('email')
  ].filter(Boolean);
  const assignedNames = [
    t && t.assigned_to_name, t && t.assigned_name, t && t.responsible_name,
    t && t.technician_name, t && t.assigned_user_name, t && t.responsible_user_name,
    t && t.assigned_to_email, t && t.responsible_email
  ].filter(Boolean);
  return assignedNames.some(an => myNames.some(mn => samePersonName(mn, an)));
}
function ticketStatusClean(t){
  const st = String(t && t.status || 'NEW').toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
  if(st === 'DONE' || st === 'FINALIZED' || st === 'RESOLVED' || st === 'RESOLVIDO' || (t && (t.resolved_at || t.closed_at || t.finished_at || t.done_at || t.finalized_at))) return 'DONE';
  if(st === 'IN_PROGRESS' || st === 'ASSIGNED' || st === 'PROGRESS' || st === 'EM ANDAMENTO' || st === 'ANDAMENTO') return 'IN_PROGRESS';
  if((t && (t.assigned_to_user_id || t.assignee_id || t.responsible_user_id || t.assigned_to_name || t.assigned_name || t.responsible_name || t.technician_name)) && st !== 'DONE') return 'IN_PROGRESS';
  return 'NEW';
}
function canShowAssumeTicket(t){
  const hasResponsible = !!(t && (t.assigned_to_user_id || t.assignee_id || t.responsible_user_id || t.assigned_to_name || t.assigned_name || t.responsible_name || t.technician_name));
  return canHandleTickets() && ticketStatusClean(t)==='NEW' && !hasResponsible;
}
function canShowFinishTicket(t){
  return canHandleTickets() && ticketStatusClean(t)==='IN_PROGRESS' && currentUserOwnsTicket(t);
}
function ticketCardActionsHtml(t, openFn){
  const id = Number(t && t.id || 0);
  const openCall = openFn || 'openTicketFromDashboard';
  let html = `<button class="btn btnLight" type="button" data-gf-open-ticket="${id}" onclick="event.stopPropagation();${openCall}(${id})">Ver detalhes</button>`;
  if(canShowAssumeTicket(t)) html += `<button class="btn btnWarn" type="button" data-gf-assume-ticket="${id}" onclick="event.stopPropagation();setStatus(${id},'IN_PROGRESS')">Assumir chamado</button>`;
  if(canShowFinishTicket(t)) html += `<button class="btn btnDark" type="button" data-gf-resolve-ticket="${id}">Finalizar chamado</button>`;
  return html;
}
function updateTicketActionButtons(){
  const assume=document.getElementById('btnAssumeTicket');
  const finish=document.getElementById('btnFinishTicket');
  if(!assume || !finish) return;
  const t = current || window.current || null;
  const hide = (el)=>{ if(!el) return; el.style.setProperty('display','none','important'); el.disabled=true; el.setAttribute('aria-hidden','true'); };
  const show = (el)=>{ if(!el) return; el.style.removeProperty('display'); el.disabled=false; el.removeAttribute('aria-hidden'); };
  if(!t){ hide(assume); hide(finish); return; }
  const canHandle=canHandleTickets();
  const assigned=!!(t.assigned_to_user_id || t.assignee_id || t.responsible_user_id || t.assigned_user_id || t.assigned_to_name || t.assigned_name || t.responsible_name || t.technician_name);
  const isMine=currentUserOwnsTicket(t);
  const clean=ticketStatusClean(t);
  if(canHandle && clean==='NEW' && !assigned) show(assume); else hide(assume);
  if(canHandle && clean==='IN_PROGRESS' && assigned && isMine){ show(finish); finish.title=''; }
  else { hide(finish); finish.title = clean==='DONE' ? 'Chamado já finalizado' : (!assigned ? 'Assuma o chamado antes de finalizar' : 'Somente quem assumiu pode finalizar'); }
}

try{
  window.currentUserOwnsTicket=currentUserOwnsTicket;
  window.ticketStatusClean=ticketStatusClean;
  window.canShowAssumeTicket=canShowAssumeTicket;
  window.canShowFinishTicket=canShowFinishTicket;
  window.ticketCardActionsHtml=ticketCardActionsHtml;
}catch(e){}
function applyRoleUI(){
  const r = roleOf();

  document
    .querySelectorAll('[data-admin-only]')
    .forEach(el => el.classList.toggle('roleHidden', !isAdmin()));

  if(window.accessNotice){
    accessNotice.classList.add('hidden');
    accessNotice.innerHTML = '';
  }

  document
    .querySelectorAll('.adminOnly')
    .forEach(el => el.classList.toggle('roleHidden', !isAdmin()));

  document
    .querySelectorAll('.ticketOnly')
    .forEach(el => el.classList.toggle('roleHidden', !canHandleTickets()));

  document
    .querySelectorAll('.viewerOnlyHint')
    .forEach(el => el.classList.add('roleHidden'));

  document
    .querySelectorAll('#pageCadastros input, #pageCadastros select, #pageCadastros textarea')
    .forEach(el => {
      const isFilter =
        el.id === 'assetSearch' ||
        el.id === 'assetFilterSector';

      el.disabled = !isAdmin() && !isFilter;
    });
}
const BR_TIME_ZONE='America/Sao_Paulo';
function parseDateBR(value){
  if(!value) return null;
  if(value instanceof Date) return Number.isNaN(value.getTime())?null:value;
  let raw=String(value).trim();
  if(!raw) return null;
  if(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}/.test(raw)) raw=raw.replace(' ','T')+'Z';
  else if(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(raw) && !/[zZ]|[+-]\d{2}:?\d{2}$/.test(raw)) raw=raw+'Z';
  const d=new Date(raw);
  return Number.isNaN(d.getTime())?null:d;
}
function fmtBR(value){
  const d=parseDateBR(value);
  if(!d) return value?String(value):'-';
  return new Intl.DateTimeFormat('pt-BR',{timeZone:BR_TIME_ZONE,day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'}).format(d).replace(',', '');
}
function fmt(value){return fmtBR(value)}
function timeBR(value=new Date()){
  const d=parseDateBR(value)||new Date();
  return new Intl.DateTimeFormat('pt-BR',{timeZone:BR_TIME_ZONE,hour:'2-digit',minute:'2-digit',second:'2-digit'}).format(d);
}
function dateBR(value=new Date()){
  const d=parseDateBR(value)||new Date();
  return new Intl.DateTimeFormat('pt-BR',{timeZone:BR_TIME_ZONE,day:'2-digit',month:'2-digit',year:'numeric'}).format(d);
}
function dayKeyBR(value){
  const d=parseDateBR(value);
  if(!d) return '';
  const parts=new Intl.DateTimeFormat('en-CA',{timeZone:BR_TIME_ZONE,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(d);
  const obj=Object.fromEntries(parts.map(p=>[p.type,p.value]));
  return `${obj.year}-${obj.month}-${obj.day}`;
}
function nowDayKeyBR(){return dayKeyBR(new Date())}
function tsBR(value){const d=parseDateBR(value);return d?d.getTime():0}
function diffMinBR(a,b){const da=tsBR(a),db=tsBR(b);return da&&db?((da-db)/60000):0}
function clock(){clockEl.innerText=dateBR(new Date())+' '+timeBR(new Date())}const clockEl=document.getElementById('clock');setInterval(clock,1000);clock();
function toastMsg(m){toast.innerText=m;toast.style.display='block';setTimeout(()=>toast.style.display='none',3500)}
function beep(){try{const a=new(window.AudioContext||window.webkitAudioContext)(),o=a.createOscillator(),g=a.createGain();o.frequency.value=880;g.gain.value=.08;o.connect(g);g.connect(a.destination);o.start();setTimeout(()=>{o.stop();a.close()},180)}catch(e){}}
function applyCompanyBrand(company){
  company = company || window.GF_COMPANY || {};
  const name = String(company.name || 'EMPRESA').trim();
  let logo = String(company.logo_url || '').trim();
  try{
    if(logo && location.protocol === 'https:' && /^http:\/\//i.test(logo)){
      logo = logo.replace(/^http:\/\//i, 'https://');
    }
  }catch(e){}
  window.GF_COMPANY = company;
  try{ if(company.slug) sessionStorage.setItem('GF_COMPANY_SLUG', company.slug); }catch(e){}
  const brandName = document.getElementById('companyBrandName') || document.querySelector('.brandText small');
  if(brandName) brandName.innerText = name.toUpperCase();
  const img = document.getElementById('companyLogoImg') || document.querySelector('.brandLogoBox img');
  const box = document.getElementById('companyLogoBox') || document.querySelector('.brandLogoBox');
  if(logo && img){
    document.body.classList.remove('gf-no-company-logo');
    if(box) box.style.display='';
    img.src = logo; img.alt = name; img.style.display='block'; img.style.objectFit='contain';
    img.onerror=function(){ this.style.display='none'; document.body.classList.add('gf-no-company-logo'); if(box) box.style.display='none'; };
  } else {
    document.body.classList.add('gf-no-company-logo');
    if(img) img.style.display='none';
    if(box) box.style.display='none';
  }
}
function gfAiFirstName(){
  try{
    var u = null;
    try{ if(typeof me !== 'undefined' && me) u = me; }catch(_e){}
    if(!u && window.me) u = window.me;

    if(!u){
      var keys=['user','gfUser','authUser','currentUser','loggedUser','GF_USER','guaraUser','adminUser'];
      for(var i=0;i<keys.length;i++){
        var raw='';
        try{raw=localStorage.getItem(keys[i])||sessionStorage.getItem(keys[i])||'';}catch(_s){}
        if(raw){
          try{u=JSON.parse(raw);}catch(_j){u={name:raw};}
          break;
        }
      }
    }

    var n = '';
    if(u){
      n = u.name || u.nome || u.fullName || u.full_name || u.username || u.userName || u.login || u.email ||
          (u.user && (u.user.name || u.user.nome || u.user.username || u.user.email)) || '';
    }

    if(!n){
      var meNameEl=document.getElementById('meName');
      n=meNameEl ? String(meNameEl.textContent||'').split('•')[0].trim() : '';
    }

    n=String(n||'').trim();
    if(!n || n==='-' || /^usu[aá]rio$/i.test(n)) return 'Usuário';
    if(n.indexOf('@')>-1) n=n.split('@')[0];
    return (n.split(/\s+/)[0]||'Usuário');
  }catch(e){return 'Usuário';}
}
function gfAiEscapeText(v){return String(v==null?'':v).replace(/[&<>'"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]||c;});}
function updateAiWelcomeMessages(){try{var first=gfAiEscapeText(gfAiFirstName());var normal=document.getElementById('gfAiWelcomeMsg');if(normal){normal.innerHTML='Olá, <b>'+first+'</b>. Estou conectada ao painel operacional e pronta para te ajudar de forma mais natural.<br><br>Posso analisar chamados, setores, equipamentos, custos, tendências e te explicar o que estiver acontecendo no sistema.';}}catch(e){}}
window.gfAiFirstName=gfAiFirstName;
window.updateAiWelcomeMessages=updateAiWelcomeMessages;
async function ensureMe(){const r=await fetch(API+'/api/admin/me');if(r.status===401){const slug=sessionStorage.getItem('GF_COMPANY_SLUG')||'';location.href=slug?('/login?company='+encodeURIComponent(slug)):'/login';return}const j=await r.json();me=j.user||{};window.me=me;try{sessionStorage.setItem('GF_USER',JSON.stringify(me));}catch(e){}applyCompanyBrand(j.company);meName.innerText=(me.display_name||gfShortPersonName(me.name||me.nome||me.username)||me.email||'Usuário')+' • '+({ADMIN:'Administrador',TECH:'Técnico',VIEWER:'Visualizador'}[String(me.role||'').toUpperCase()]||me.role||'');gfApplyAccountPrefs();updateAiWelcomeMessages();applyRoleUI()}
async function logout(){const slug=(window.GF_COMPANY&&window.GF_COMPANY.slug)||sessionStorage.getItem('GF_COMPANY_SLUG')||'';await fetch(API+'/api/auth/logout?company='+encodeURIComponent(slug),{method:'POST'});location.href=slug?('/login?company='+encodeURIComponent(slug)):'/login'}
function gfBool(v, def=true){if(v===undefined||v===null||v==='')return def;return v===true||v===1||String(v)==='1'||String(v).toLowerCase()==='true'}
function gfThemeValue(v){
  v=String(v||'light').toLowerCase();
  return ['light','dark'].includes(v)?v:'light';
}
function gfThemeClassName(theme){return 'gfTheme'+theme.charAt(0).toUpperCase()+theme.slice(1)}
function gfSetTheme(theme, persist){
  try{
    theme=gfThemeValue(theme);
    const classes=['gfThemeLight','gfThemeDark'];
    document.body.classList.remove(...classes);
    document.documentElement.classList.remove(...classes);
    document.body.classList.add(gfThemeClassName(theme));
    document.documentElement.classList.add(gfThemeClassName(theme));
    document.body.setAttribute('data-gf-theme',theme);
    document.documentElement.setAttribute('data-gf-theme',theme);
    const color=({light:'#eef3fb',dark:'#0f172a'}[theme]||'#eef3fb');
    const meta=document.querySelector('meta[name="theme-color"]');
    if(meta) meta.setAttribute('content',color);
    if(persist) localStorage.setItem('GF_PANEL_THEME',theme);
  }catch(e){}
}
function gfApplySavedThemeEarly(){try{gfSetTheme(localStorage.getItem('GF_PANEL_THEME')||'light',false)}catch(e){}}
gfApplySavedThemeEarly();
function gfApplyAccountPrefs(){
  try{
    const theme=gfThemeValue((me && me.theme) || localStorage.getItem('GF_PANEL_THEME') || 'light');
    document.body.classList.toggle('gfCompactMode', !!(me && gfBool(me.compact_mode,false)));
    gfSetTheme(theme,true);
  }catch(e){}
}
function gfPreviewTheme(value){gfSetTheme(value,true)}
function gfAccountModalHtml(){
  const full=escHTML(me?.name||'');
  const display=escHTML(me?.display_name||gfShortPersonName(me?.name||'')||'');
  const email=escHTML(me?.email||'');
  const role=escHTML(roleLabel(String(me?.role||'')));
  const push=gfBool(me?.notify_push,true)?'checked':'';
  const sound=gfBool(me?.notify_sound,true)?'checked':'';
  const vib=gfBool(me?.notify_vibration,true)?'checked':'';
  const compact=gfBool(me?.compact_mode,false)?'checked':'';
  const theme=gfThemeValue(me?.theme);
  const sel=(v)=>theme===v?'selected':'';
  const dname=display||full||'Usuário';
  return `<div class="gfAccountBg" id="gfAccountBg" onclick="if(event.target.id==='gfAccountBg')closeGfAccountModal()">
    <div class="gfAccountModal" role="dialog" aria-modal="true">
      <div class="gfAccountHead"><div><small>Central pessoal</small><h2>⚙️ Minha conta</h2></div><button type="button" class="gfAccountClose" onclick="closeGfAccountModal()">×</button></div>
      <div class="gfAccountBody">
        <div class="gfAccountProfileCard"><div class="gfAccountBigAvatar">${escHTML((dname||'U').charAt(0).toUpperCase())}</div><div><b>${dname}</b><small>${email} • ${role}</small><span class="gfAccountStatus">🟢 Notificações de novos chamados ${push?'ativas':'desativadas'}</span></div></div>
        <div class="gfAccountGrid">
          <section class="gfAccountSection"><h3>👤 Perfil</h3><label>Nome completo <span class="gfLockBadge">🔒 bloqueado</span><input id="gfMeName" value="${full}" placeholder="Nome completo" readonly disabled class="gfLockedInput" title="Nome completo não pode ser alterado por aqui"></label><p class="gfMiniHelp">O nome completo fica protegido para preservar histórico, auditoria e registros oficiais.</p><label>Nome de exibição nos chamados<input id="gfMeDisplay" value="${display}" placeholder="Ex: Valdemir"></label><div class="gfNamePreview"><b>Prévia nos chamados</b><span>Assumido por: ${dname}</span><span>Atualizado por: ${dname}</span><span>Finalizado por: ${dname}</span></div><button class="btn btnDark" onclick="saveGfAccountProfile()">Salvar perfil</button></section>
          <section class="gfAccountSection"><h3>🔐 Alterar senha</h3><label>Senha atual<input id="gfPassCurrent" type="password" autocomplete="current-password"></label><label>Nova senha<input id="gfPassNew" type="password" autocomplete="new-password"></label><label>Confirmar nova senha<input id="gfPassConfirm" type="password" autocomplete="new-password"></label><button class="btn btnDark" onclick="saveGfAccountPassword()">Alterar senha</button></section>
          <section class="gfAccountSection"><h3>🔔 Notificações</h3><p class="gfMiniHelp">O sistema atual notifica apenas novos chamados. Não adicionei assumido/finalizado para não criar opção sem função validada.</p><label class="gfCheck"><input id="gfNotifyPush" type="checkbox" ${push}> Receber novos chamados</label><label class="gfCheck"><input id="gfNotifySound" type="checkbox" ${sound}> Som ao chegar novo chamado</label><label class="gfCheck"><input id="gfNotifyVib" type="checkbox" ${vib}> Vibração no celular</label><button class="btn btnDark" onclick="saveGfAccountProfile()">Salvar notificações</button></section>
          <section class="gfAccountSection"><h3>🎨 Preferências</h3><label>Tema do painel<select id="gfTheme" onchange="gfPreviewTheme(this.value)"><option value="light" ${sel('light')}>Padrão</option><option value="dark" ${sel('dark')}>Escuro suave</option></select></label><p class="gfMiniHelp">Mantive só o tema padrão do sistema e o escuro suave para evitar poluição visual e CSS sem uso.</p><label class="gfCheck"><input id="gfCompactMode" type="checkbox" ${compact}> Listas mais compactas</label><button class="btn btnDark" onclick="saveGfAccountProfile()">Salvar preferências</button></section>
        </div>
      </div>
      <div class="gfAccountFoot"><button class="btn btnLight" onclick="closeGfAccountModal()">Fechar</button></div>
    </div>
  </div>`;
}
function openGfAccountModal(){
  let el=document.getElementById('gfAccountBg');
  if(el) el.remove();
  document.body.insertAdjacentHTML('beforeend', gfAccountModalHtml());
  document.getElementById('gfAccountBg').classList.add('show');
}
function closeGfAccountModal(){const el=document.getElementById('gfAccountBg'); if(el) el.remove();}
async function saveGfAccountProfile(){
  try{
    const body={
      display_name:document.getElementById('gfMeDisplay')?.value||'',
      notify_push:document.getElementById('gfNotifyPush')?.checked?1:0,
      notify_sound:document.getElementById('gfNotifySound')?.checked?1:0,
      notify_vibration:document.getElementById('gfNotifyVib')?.checked?1:0,
      theme:document.getElementById('gfTheme')?.value||'light',
      compact_mode:document.getElementById('gfCompactMode')?.checked?1:0
    };
    gfSetTheme(body.theme,true);
    const r=await fetch(API+'/api/admin/me/profile',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
    const j=await r.json(); if(!j.ok) throw new Error(j.error||'Erro ao salvar configurações');
    toastMsg('Configurações salvas!'); await ensureMe(); closeGfAccountModal();
  }catch(e){toastMsg(e.message)}
}
async function saveGfAccountPassword(){
  try{
    const cur=document.getElementById('gfPassCurrent')?.value||'';
    const np=document.getElementById('gfPassNew')?.value||'';
    const cf=document.getElementById('gfPassConfirm')?.value||'';
    if(!cur||!np) throw new Error('Informe a senha atual e a nova senha');
    if(np.length<6) throw new Error('A nova senha precisa ter pelo menos 6 caracteres');
    if(np!==cf) throw new Error('A confirmação não confere');
    const r=await fetch(API+'/api/admin/change-password',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({current_password:cur,new_password:np})});
    const j=await r.json(); if(!j.ok) throw new Error(j.error||'Erro ao alterar senha');
    toastMsg('Senha alterada com sucesso!');
    ['gfPassCurrent','gfPassNew','gfPassConfirm'].forEach(id=>{const el=document.getElementById(id); if(el) el.value='';});
  }catch(e){toastMsg(e.message)}
}

function cap(s){return s.charAt(0).toUpperCase()+s.slice(1)}
function statusBadge(v){v=String(v||'').toUpperCase();if(v==='NEW')return'<span class="badge new status-new">Novo</span>';if(v==='IN_PROGRESS')return'<span class="badge progress status-progress">Em andamento</span>';if(v==='DONE')return'<span class="badge done status-done">Resolvido</span>';if(v==='NO_REPAIR')return'<span class="badge status-no-repair">Sem reparo</span>';if(v==='SWAP')return'<span class="badge status-swap">Aguardando troca</span>';if(v==='WRITTEN_OFF')return'<span class="badge status-writeoff">Baixado</span>';return'<span class="badge offB">'+(v||'-')+'</span>'}
function finalOutcomeLabel(v){v=String(v||'').toUpperCase();return{RESOLVED:'Resolvido',NO_REPAIR:'Sem reparo',SWAP:'Aguardando troca',WRITTEN_OFF:'Baixado patrimônio'}[v]||''}
function finalOutcomeBadge(v){if(!v)return'';v=String(v||'').toUpperCase();const cls={RESOLVED:'final-ok',NO_REPAIR:'final-no-repair',SWAP:'final-swap',WRITTEN_OFF:'final-writeoff'}[v]||'final-ok';return `<span class="finalBadge ${cls}">${finalOutcomeLabel(v)}</span>`}

function ticketRatingStars(t){
  const n = Number(t && (
    t.rating_stars ??
    t.ticket_rating_stars ??
    t.customer_rating_stars ??
    t.stars_rating ??
    t.rating
  ) || 0);
  return Number.isFinite(n) ? Math.max(0, Math.min(5, Math.round(n))) : 0;
}
function ticketRatingComment(t){
  return String(t && (
    t.rating_comment ??
    t.ticket_rating_comment ??
    t.customer_rating_comment ??
    t.comment_rating ??
    ''
  ) || '').trim();
}
function ticketRatingDate(t){
  const raw = String(t && (
    t.rating_created_at_br ??
    t.ticket_rating_created_at_br ??
    ''
  ) || '').trim();
  if(raw) return raw;
  const dt = String(t && (
    t.rating_created_at ??
    t.ticket_rating_created_at ??
    ''
  ) || '').trim();
  return dt ? (typeof fmtBR === 'function' ? fmtBR(dt) : dt) : '';
}
function ticketRatingHtml(t, compact=false){
  const stars = ticketRatingStars(t);
  if(!stars) return '';
  const filled = '★'.repeat(stars);
  const empty = '☆'.repeat(5-stars);
  const comment = ticketRatingComment(t);
  const date = ticketRatingDate(t);
  if(compact){
    return `<span class="gfRatingMini" title="${escHTML(comment || 'Avaliação do atendimento')}">${filled}${empty}</span>`;
  }
  return `
    <div class="gfTicketRatingBox">
      <div class="gfTicketRatingTitle">⭐ Avaliação do atendimento</div>
      <div class="gfTicketRatingStars">${filled}${empty}</div>
      ${date ? `<div class="gfTicketRatingMeta">Avaliado em ${escHTML(date)}</div>` : ''}
      ${comment ? `<div class="gfTicketRatingComment">${escHTML(comment)}</div>` : ''}
    </div>
  `;
}
function ensureTicketRatingCss(){
  if(document.getElementById('gfTicketRatingCss')) return;
  const st=document.createElement('style');
  st.id='gfTicketRatingCss';
  st.textContent=`
    .gfRatingMini{
      display:inline-flex;
      margin-left:6px;
      padding:4px 8px;
      border-radius:999px;
      background:#fff8df;
      color:#b77900;
      border:1px solid #ffe7a3;
      font-size:13px;
      font-weight:1000;
      letter-spacing:.5px;
      vertical-align:middle;
      white-space:nowrap;
    }
    .gfTicketRatingBox{
      margin-top:12px;
      padding:14px;
      border:1px solid #ffe2a8;
      border-radius:16px;
      background:linear-gradient(180deg,#fffdf5,#fff8e6);
      color:#1e293b;
      box-shadow:0 8px 20px rgba(6,18,58,.06);
    }
    .gfTicketRatingTitle{
      font-size:13px;
      font-weight:1000;
      color:#7c5200;
      margin-bottom:6px;
      text-transform:uppercase;
      letter-spacing:.2px;
    }
    .gfTicketRatingStars{
      font-size:25px;
      line-height:1;
      color:#f7b500;
      font-weight:1000;
      letter-spacing:2px;
      text-shadow:0 2px 4px rgba(0,0,0,.12);
    }
    .gfTicketRatingMeta{
      margin-top:6px;
      font-size:12px;
      color:#64748b;
      font-weight:800;
    }
    .gfTicketRatingComment{
      margin-top:8px;
      font-size:14px;
      color:#334155;
      line-height:1.35;
      font-weight:700;
    }
  `;
  document.head.appendChild(st);
}
function injectTicketRatingInDrawer(t){
  ensureTicketRatingCss();
  const old=document.getElementById('gfDrawerTicketRatingBox');
  if(old) old.remove();
  const html=ticketRatingHtml(t,false);
  if(!html) return;
  const target=document.getElementById('dSolution') || document.getElementById('dDescription');
  if(!target || !target.parentElement) return;
  const wrap=document.createElement('div');
  wrap.id='gfDrawerTicketRatingBox';
  wrap.innerHTML=html;
  target.parentElement.appendChild(wrap);
}

function priBadge(v){if(v==='HIGH')return'<span class="badge high">Alta</span>';if(v==='LOW')return'<span class="badge low">Baixa</span>';return'<span class="badge medium">Média</span>'}
function mins(created){const t=tsBR(created);return t?Math.floor((Date.now()-t)/60000):0}
function formatDurationMinutes(total){
  const d=Math.max(0,Number(total||0));
  if(d<1)return'agora';
  if(d<60)return d+' min';
  const h=Math.floor(d/60), m=d%60;
  if(h<24)return h+'h '+m+'min';
  const days=Math.floor(h/24), rh=h%24;
  return days+'d '+rh+'h '+m+'min';
}
function waiting(created){return formatDurationMinutes(mins(created))}
function durationBetweenBR(start,end){
  const a=tsBR(start), b=tsBR(end);
  if(!a||!b||b<a)return waiting(start);
  return formatDurationMinutes(Math.round((b-a)/60000));
}
function isTicketDone(t){return String(t?.status||'').toUpperCase()==='DONE' || !!t?.resolved_at}
function ticketTimeLabel(t){return isTicketDone(t)?'Tempo até conclusão':'Tempo esperando'}
function ticketTimeValue(t){return isTicketDone(t)?durationBetweenBR(t.created_at,t.resolved_at||t.updated_at):waiting(t.created_at)}
function ticketTimeMini(t){return isTicketDone(t)?('Finalizado em: '+fmtBR(t.resolved_at||t.updated_at)):''}
function ticketTimeInline(t){return (isTicketDone(t)?'Concluído em ':'Aguardando há ')+ticketTimeValue(t)}
function sla(t){if(t.status==='DONE')return{cls:'',txt:'OK'};const m=mins(t.created_at);if(gfIsOpenNewCritical(t))return{cls:'slaBad',txt:'Crítico'};if(m>=10)return{cls:'slaWarn',txt:'Atenção'};return{cls:'slaOk',txt:'Normal'}}
function gfIsOpenNewCritical(t){try{var s=(typeof effectiveStatus==='function'?effectiveStatus(t):String(t&&t.status||'NEW').toUpperCase());return s==='NEW'&&typeof mins==='function'&&mins(t.created_at)>=2880;}catch(e){return false;}}
function isToday(d){return !!d && dayKeyBR(d)===nowDayKeyBR()}
function ticketUpdatedTime(t){return tsBR(t?.updated_at||t?.resolved_at||t?.created_at)}
function ticketCreatedTime(t){return tsBR(t?.created_at)}
function count(){
  const done=tickets.filter(t=>t.resolved_at);
  let avg=0;
  if(done.length){avg=Math.round(done.reduce((a,t)=>a+(tsBR(t.resolved_at)-tsBR(t.created_at))/60000,0)/done.length)}
  if(typeof cAvg!=='undefined'&&cAvg)cAvg.innerText=avg+'m';
  const rank={};
  done.forEach(t=>{const n=t.assigned_to_name||'Equipe';rank[n]=(rank[n]||0)+1});
  if(typeof ranking!=='undefined'&&ranking)ranking.innerHTML=Object.entries(rank).sort((a,b)=>b[1]-a[1]).slice(0,3).map(x=>`${x[0]}: <b>${x[1]}</b>`).join('<br>')||'-';
}
function setQuick(v){quick=v;document.querySelectorAll('.quick .btn').forEach(b=>b.classList.remove('active'));({ALL:qAll,TODAY:qHoje,CRITICAL:qCrit,MINE:qMine,DONE:qDone}[v]).classList.add('active');render()}
function render(){
  const rawQ=(search.value||'').trim();
  const q=rawQ.toLowerCase().replace(/^#/,'');
  const st=statusFilter.value;
  let rows=tickets.filter(t=>{
    const ticketNo=String(t.ticket_number||t.id||'');
    const text=[ticketNo,'#'+ticketNo,t.id,t.sector_name,t.asset_name,t.asset_brand,t.asset_model,t.issue_name,t.description,t.patrimonio,t.assigned_to_name,t.status].join(' ').toLowerCase();
    let ok=(!q||text.includes(q))&&(!st||t.status===st);
    if(quick==='TODAY')ok=ok&&isToday(t.created_at);
    if(quick==='CRITICAL')ok=ok&&gfIsOpenNewCritical(t);
    if(quick==='MINE')ok=ok&&me&&t.assigned_to_user_id===me.id;
    if(quick==='DONE')ok=ok&&t.status==='DONE';
    return ok
  });
  rows.sort((a,b)=>ticketUpdatedTime(b)-ticketUpdatedTime(a)||ticketCreatedTime(b)-ticketCreatedTime(a)||Number(b.id||0)-Number(a.id||0));
  count();
  if(!rows.length){tbody.innerHTML='<tr><td colspan="12" class="empty">Nenhum chamado encontrado. Tente buscar pelo número sem #, patrimônio, setor ou equipamento.</td></tr>';return}
  tbody.innerHTML=rows.map(t=>{
    const s=sla(t);
    const ticketNo=t.ticket_number||t.id;
    const model=(t.asset_brand||t.asset_model)?`<span class="modelPill">${escHTML((t.asset_brand||'')+' '+(t.asset_model||'')).trim()}</span>`:'-';
    return`<tr class="${s.cls} ticketClickable" data-ticket-id="${t.id}" title="Clique para abrir o chamado"><td data-label="#"><span class="ticketNumPill">#${escHTML(ticketNo)}</span></td><td data-label="SLA"><span class="badge ${s.txt==='Crítico'?'high':s.txt==='Atenção'?'medium':'new'}">${s.txt}</span></td><td data-label="Setor">${escHTML(t.sector_name||'-')}</td><td data-label="${gfTicketItemLabel(t)}" class="ticketAssetCell"><div class="equipMain">${escHTML(t.asset_name||'-')}</div><div class="equipMeta">${gfTicketAssetKind(t)==='SERVICE'?'<span class="miniPill">Serviço</span>':(t.patrimonio?`<span class="miniPill">Patr. ${escHTML(t.patrimonio)}</span>`:'')}</div></td><td data-label="Modelo">${model}</td><td data-label="Problema">${escHTML(t.issue_name||'-')}</td><td data-label="Descrição"><div class="descClamp">${escHTML(t.description||'-')}</div></td><td data-label="Status">${statusBadge(t.status)} ${finalOutcomeBadge(t.final_outcome||t.resolution_type)} ${ticketRatingHtml(t,true)}</td><td data-label="Prioridade">${priBadge(t.priority)}</td><td data-label="Responsável">${escHTML(gfShortPersonName(t.assigned_to_name)||'Área administrativa')}</td><td data-label="Atualização" class="nowrap"><b>${fmtBR(t.updated_at||t.created_at)||'-'}</b>${t.created_at?`<br><small>Criado: ${fmtBR(t.created_at)}</small>`:''}</td><td data-label="Ações">${canHandleTickets()?`<div class="ticketActions">${ticketCardActionsHtml(t,'openDrawer')}</div>`:'<span class="viewerOnlyHint">Somente leitura</span>'}</td></tr>`
  }).join('');
  applyRoleUI()
}
function maskEmail(email){
  const raw = String(email || "").trim();
  if(!raw.includes("@")) return raw;
  const [name, domain] = raw.split("@");
  if(name.length <= 3){
    return `••••@${domain}`;
  }
  return `${name.slice(0,3)}••••@${domain}`;
}
let users=[];
function roleLabel(role){return {ADMIN:'Administrador',TECH:'Técnico',VIEWER:'Visualizador'}[role]||role||'-'}
function roleBadge(role){const cls={ADMIN:'roleAdmin',TECH:'roleTech',VIEWER:'roleViewer'}[role]||'roleViewer';return `<span class="rolePill ${cls}">${roleLabel(role)}</span>`}
async function loadUsers(){
  try{
    const r=await fetch(API+'/api/admin/users');
    if(r.status===401){location.href='/login';return}
    if(r.status===403){usersBody.innerHTML='<tr><td colspan="6" class="empty">Somente administrador pode gerenciar usuários.</td></tr>';return}
    const j=await r.json();
    if(!j.ok) throw new Error(j.error||'Erro ao buscar usuários');
    users=j.users||[];
    renderUsers();applyRoleUI();
  }catch(e){usersBody.innerHTML=`<tr><td colspan="6" class="empty">${e.message}</td></tr>`}
}

function openSettingsUsers(){
  if(!isAdmin()){toastMsg('Somente administrador acessa usuários e acessos.');return;}
  const chooser=document.getElementById('gfSettingsChooser');
  const panel=document.getElementById('gfUsersAdminPanel');
  if(chooser) chooser.classList.add('hidden');
  if(panel) panel.classList.remove('hidden');
  loadUsers();
}
function closeSettingsUsers(clearBody=true){
  const chooser=document.getElementById('gfSettingsChooser');
  const panel=document.getElementById('gfUsersAdminPanel');
  if(chooser) chooser.classList.remove('hidden');
  if(panel) panel.classList.add('hidden');
  if(clearBody){const body=document.getElementById('usersBody'); if(body) body.innerHTML='<tr><td class="empty" colspan="6">Clique em Usuários e acessos para carregar.</td></tr>';}
}

function renderUsers(){
  if(!users.length){usersBody.innerHTML='<tr><td colspan="6" class="empty">Nenhum usuário cadastrado</td></tr>';return}
  usersBody.innerHTML=users.map((u,i)=>{
    const display=escHTML(u.display_name||gfShortPersonName(u.name)||u.name||'-');
    const full=escHTML(u.name||'-');
    return `<tr class="${u.active?'':'userOff'} gfUserRow">
      <td data-label="#">#${u.user_number || u.local_user_number || (i+1)}</td>
      <td data-label="Usuário"><div class="gfUserCell"><div class="gfUserAvatarSmall">${display.charAt(0).toUpperCase()}</div><div><b>${display}</b><small>${full}${u.display_name?`<br>Exibição: ${display}`:''}</small></div></div></td>
      <td data-label="Email" class="maskedEmail">${maskEmail(u.email)||'-'}</td>
      <td data-label="Perfil"><select id="roleUser${u.id}"><option value="ADMIN" ${u.role==='ADMIN'?'selected':''}>Administrador</option><option value="TECH" ${u.role==='TECH'?'selected':''}>Técnico</option><option value="VIEWER" ${u.role==='VIEWER'?'selected':''}>Visualizador</option></select></td>
      <td data-label="Status"><select id="activeUser${u.id}"><option value="1" ${u.active?'selected':''}>Ativo</option><option value="0" ${!u.active?'selected':''}>Desativado</option></select></td>
      <td data-label="Ações"><div class="gfUserActions"><button class="btn btnDark btnMini" onclick="saveUserAccess(${u.id})">Salvar acesso</button><button class="btn btnLight btnMini" onclick="openAdminUserConfig(${u.id})">⚙️ Configurar</button></div></td>
    </tr>`;
  }).join('')
}
function openAdminUserConfig(id){
  const u=users.find(x=>Number(x.id)===Number(id)); if(!u) return;
  const display=escHTML(u.display_name||gfShortPersonName(u.name)||'');
  const html=`<div class="gfAccountBg" id="gfAdminUserBg" onclick="if(event.target.id==='gfAdminUserBg')closeAdminUserConfig()"><div class="gfAccountModal gfAdminUserModal"><div class="gfAccountHead"><div><small>Configuração do usuário</small><h2>👤 ${escHTML(u.name||'-')}</h2></div><button class="gfAccountClose" onclick="closeAdminUserConfig()">×</button></div><div class="gfAccountBody"><div class="gfAccountGrid"><section class="gfAccountSection"><h3>Nome de exibição</h3><label>Nome completo <span class="gfLockBadge">🔒 bloqueado</span><input id="admUserName" value="${escHTML(u.name||'')}" readonly disabled class="gfLockedInput" title="Nome completo não pode ser alterado por aqui"></label><p class="gfMiniHelp">Nome completo protegido para não alterar histórico oficial do usuário.</p><label>Nome curto nos chamados<input id="admUserDisplay" value="${display}" placeholder="Ex: Valdemir"></label><p class="gfMiniHelp">Ideal para celular: mostra nome curto em cards, topo e chamados.</p><button class="btn btnDark" onclick="saveAdminUserConfig(${u.id})">Salvar perfil</button></section><section class="gfAccountSection"><h3>🔐 Resetar senha</h3><label>Nova senha<input id="admUserPass" type="password" placeholder="Mínimo 6 caracteres"></label><button class="btn btnDark" onclick="resetAdminUserPassword(${u.id})">Alterar senha desse usuário</button></section></div></div><div class="gfAccountFoot"><button class="btn btnLight" onclick="closeAdminUserConfig()">Fechar</button></div></div></div>`;
  const old=document.getElementById('gfAdminUserBg'); if(old) old.remove();
  document.body.insertAdjacentHTML('beforeend',html);
  document.getElementById('gfAdminUserBg').classList.add('show');
}
function closeAdminUserConfig(){const el=document.getElementById('gfAdminUserBg'); if(el) el.remove();}
async function saveAdminUserConfig(id){
  if(!guardAction('admin')) return;
  const u=users.find(x=>Number(x.id)===Number(id)); if(!u)return;
  try{
    const body={name:u.name,email:u.email,display_name:document.getElementById('admUserDisplay').value,role:document.getElementById('roleUser'+id).value,active:document.getElementById('activeUser'+id).value==='1'};
    const r=await fetch(API+'/api/admin/users/'+id,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
    const j=await r.json(); if(!j.ok) throw new Error(j.error||'Erro ao salvar usuário');
    toastMsg('Usuário atualizado!'); closeAdminUserConfig(); loadUsers();
  }catch(e){toastMsg(e.message)}
}
async function resetAdminUserPassword(id){
  if(!guardAction('admin')) return;
  try{
    const password=document.getElementById('admUserPass').value||'';
    if(password.length<6) throw new Error('Senha precisa ter pelo menos 6 caracteres');
    const r=await fetch(API+'/api/admin/users/'+id+'/reset-password',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({password})});
    const j=await r.json(); if(!j.ok) throw new Error(j.error||'Erro ao alterar senha');
    toastMsg('Senha alterada!'); closeAdminUserConfig();
  }catch(e){toastMsg(e.message)}
}
async function saveUserAccess(id){
  if(!guardAction('admin')) return;
  const u=users.find(x=>x.id===id); if(!u)return;
  try{
    const body={name:u.name,email:u.email,display_name:u.display_name||gfShortPersonName(u.name)||'',role:document.getElementById('roleUser'+id).value,active:document.getElementById('activeUser'+id).value==='1'};
    const r=await fetch(API+'/api/admin/users/'+id,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
    const j=await r.json();
    if(!j.ok) throw new Error(j.error||'Erro ao atualizar acesso');
    toastMsg('Acesso atualizado!');loadUsers();
  }catch(e){toastMsg(e.message)}
}
/* V19: loadTickets antigo removido.
   A implementação única fica no bloco de paginação (window.loadTickets),
   preservando paginação, notificação e evitando render duplicado quando não há mudança real. */
function __gfTicketsSig(list){
  try{return (Array.isArray(list)?list:[]).map(function(t){return [t.id,t.ticket_number,t.status,t.assigned_to_user_id,t.updated_at,t.resolved_at].join(':');}).join('|');}
  catch(_){return String(Date.now());}
}
function parseJsonArray(v){try{return JSON.parse(v||'[]')||[]}catch(e){return[]}}
function renderFiles(){const files=parseJsonArray(current.attachments);if(!files.length){dFiles.innerHTML='Nenhum anexo ainda.';return}dFiles.innerHTML='<div class="filesGrid">'+files.map((f,idx)=>{const url=API+f.file_url;if((f.file_type||'').startsWith('image/'))return`<button type="button" class="gfFileImgBtn" onclick="openGfImageViewer('${escHTML(url)}','Foto ${idx+1} do chamado #${escHTML(current?.ticket_number||current?.id||'')}')"><img src="${url}" alt="Foto ${idx+1} do chamado"></button>`;return`<a class="gfFileLink" href="${url}" target="_blank" rel="noopener">Abrir anexo</a>`}).join('')+'</div>'}

function gfShortPersonName(name){
  const raw = String(name || '').trim().replace(/\s+/g,' ');
  if(!raw) return '';
  const parts = raw.split(' ').filter(Boolean);
  if(parts.length <= 2) return raw;
  return `${parts[0]} ${parts[parts.length-1]}`;
}

function escHTML(v){return String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}
function actionLabel(a){return{TICKET_CREATED:'Chamado criado',TICKET_ASSIGNED:'Chamado assumido',TICKET_RESOLVED:'Chamado resolvido',STATUS_CHANGED:'Status alterado',INTERNAL_NOTE:'Nota interna',PUBLIC_NOTE:'Atualização para solicitante',SYSTEM_NOTE:'Sistema',RESOLUTION_NOTE:'Observação técnica',TICKET_FINALIZED:'Chamado finalizado',TICKET_SWAP_PENDING:'Enviado para troca',RESOLUTION_PHOTO:'Foto da resolução',ASSET_STATUS_CHANGED:'Equipamento atualizado',ASSET_RETURNED_FROM_SWAP:'Troca concluída'}[a]||a}
function actionClass(a){if(['TICKET_RESOLVED','TICKET_FINALIZED','ASSET_RETURNED_FROM_SWAP'].includes(a))return'done';if(['TICKET_SWAP_PENDING','ASSET_STATUS_CHANGED'].includes(a))return'warn';if(['INTERNAL_NOTE','PUBLIC_NOTE','RESOLUTION_NOTE','RESOLUTION_PHOTO'].includes(a))return'note';return'system'}
function actionIcon(a){return{TICKET_CREATED:'📦',TICKET_ASSIGNED:'👨‍🔧',TICKET_RESOLVED:'✅',TICKET_FINALIZED:'✅',STATUS_CHANGED:'🔄',INTERNAL_NOTE:'📝',PUBLIC_NOTE:'📣',SYSTEM_NOTE:'ℹ️',RESOLUTION_NOTE:'🛠️',TICKET_SWAP_PENDING:'🚚',RESOLUTION_PHOTO:'📷',ASSET_STATUS_CHANGED:'⚙️',ASSET_RETURNED_FROM_SWAP:'🏁'}[a]||'•'}
function actionSimpleText(l){const a=l.action;const who=l.user_name||'Sistema';const note=String(l.notes||'').trim();if(a==='TICKET_CREATED')return note||'Chamado aberto pelo QR.';if(a==='TICKET_ASSIGNED')return `Chamado assumido por ${who}.`;if(a==='TICKET_RESOLVED'||a==='TICKET_FINALIZED')return `Resolvido por ${who}.`;if(a==='RESOLUTION_NOTE')return note||'Solução técnica registrada.';if(a==='RESOLUTION_PHOTO')return 'Foto da resolução anexada.';if(a==='INTERNAL_NOTE')return note||'Nota interna adicionada.';if(a==='PUBLIC_NOTE')return note||'Atualização publicada para o solicitante.';if(a==='TICKET_SWAP_PENDING')return note||'Equipamento enviado para a fila de troca.';return note}
function renderTrackItem(l,isFirst){
  const body=actionSimpleText(l);
  const when=l.created_at?fmtBR(l.created_at):'-';
  const who=l.user_name?` • ${escHTML(l.user_name)}`:'';
  const cls=actionClass(l.action)+(isFirst?' active':'');
  let photoHtml='';
  if(l.action==='RESOLUTION_PHOTO'){
    const m=String(l.notes||'').match(/\/uploads\/[^\s]+/);
    if(m){
      const url=API+m[0];
      photoHtml=`<div class="trackText"><button type="button" class="gfFileImgBtn" onclick="openGfImageViewer('${escHTML(url)}','Foto da resolução')"><img src="${escHTML(url)}" alt="Foto da resolução" style="width:96px;height:96px;object-fit:cover;border-radius:14px;border:1px solid #d8deea"></button></div>`;
    }
  }
  return `<div class="trackItem ${cls}"><div class="trackRail"><div class="trackIcon">${actionIcon(l.action)}</div></div><div class="trackContent"><div class="trackTitle">${escHTML(actionLabel(l.action))}</div>${body?`<div class="trackText">${escHTML(body)}</div>`:''}${photoHtml}<div class="trackMeta">${escHTML(when)}${who}</div></div></div>`
}
function renderLogs(){
  const logs=parseJsonArray(current.logs);
  timeline.classList.remove('timelineClean');
  timeline.classList.add('trackingTimeline');
  if(!logs.length){timeline.innerHTML='<div class="trackingGuide"><b>Sem histórico ainda.</b><br>Quando alguém pegar, resolver ou comentar, aparece aqui.</div>';return}
  const ordered=[...logs].sort((a,b)=>{
    const da=a?.created_at ? tsBR(a.created_at) : 0;
    const db=b?.created_at ? tsBR(b.created_at) : 0;
    if(da!==db) return da-db;
    return Number(a?.id||0)-Number(b?.id||0);
  });
  timeline.innerHTML='<div class="trackingGuide"><b>Histórico do chamado</b><br>Ordem correta de cima para baixo: criação, atendimento, observações e solução.</div>'+ordered.map((l,i)=>renderTrackItem(l,i===ordered.length-1)).join('')
}
function coerceTicketKey(value){
  const raw=String(value??'').trim().replace(/^#/,'');
  const n=Number(raw);
  return Number.isFinite(n)&&n>0?n:null;
}
function upsertTicketLocal(t){
  if(!t || !t.id) return null;
  const idx=tickets.findIndex(x=>Number(x.id)===Number(t.id));
  if(idx>=0) tickets[idx]={...tickets[idx],...t};
  else tickets.unshift(t);
  return tickets.find(x=>Number(x.id)===Number(t.id)) || t;
}
async function fetchTicketFromUrls(urls, label){
  for(const url of urls){
    try{
      const r=await fetch(url,{credentials:'include',cache:'no-store'});
      if(r.status===401){location.href='/login';return null}
      if(!r.ok) continue;
      const j=await r.json();
      const t=j.ticket || (Array.isArray(j.tickets)?j.tickets[0]:null);
      if(j.ok && t) return upsertTicketLocal(t);
    }catch(e){console.warn('Falha ao buscar chamado '+(label||'')+':',url,e)}
  }
  return null;
}
async function fetchTicketByDbId(id){
  const k=coerceTicketKey(id);
  if(!k) return null;
  return fetchTicketFromUrls([API+'/api/admin/tickets/by-db-id/'+encodeURIComponent(k)], 'por ID interno');
}
async function fetchTicketByKey(key){
  const k=coerceTicketKey(key);
  if(!k) return null;
  return fetchTicketFromUrls([
    API+'/api/admin/tickets/'+encodeURIComponent(k),
    API+'/api/admin/ticket/'+encodeURIComponent(k),
    API+'/api/admin/tickets/by-key/'+encodeURIComponent(k)
  ], 'por número/chave');
}
async function gfOpenTicketByDbId(id){
  const key=coerceTicketKey(id);
  if(!key){alert('ID do chamado inválido.');return}
  const full=await fetchTicketByDbId(key);
  if(full){ fillDrawerTicket(full); return full; }
  const cached=(Array.isArray(tickets)?tickets:[]).find(x=>Number(x.id)===key);
  if(cached){ fillDrawerTicket(cached); return cached; }
  alert('Não foi possível abrir este chamado pelo ID interno.');
  return null;
}
window.gfOpenTicketByDbId=gfOpenTicketByDbId;

function gfNormalizeText(v){
  return String(v||'').trim().toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
}
function gfTicketAssetKind(t){
  const raw = String(t?.asset_kind || t?.assetKind || t?.kind || '').trim().toUpperCase();
  if(raw === 'SERVICE') return 'SERVICE';
  if(raw === 'EQUIPMENT') return 'EQUIPMENT';
  const name = gfNormalizeText(t?.asset_name || t?.asset || t?.name || '');
  const serviceNames = [
    'LIMBER','INTERNET','INTERNETE','REDE','MARCENARIA','PASSAGEM DE CABO',
    'LANCAMENTO DE CABO','INSTALACAO','CAMERA','CAMERAS','CABEAMENTO',
    'MANUTENCAO PREDIAL','VIDRACARIA','TOMADA','LAMPADA','ELETRICA',
    'HIDRAULICA','PINTURA','ALVENARIA','REQUISICAO','OUTRAS DEMANDAS','OUTROS'
  ];
  return serviceNames.includes(name) ? 'SERVICE' : 'EQUIPMENT';
}
function gfTicketItemLabel(t){
  return gfTicketAssetKind(t) === 'SERVICE' ? 'Serviço' : 'Equipamento';
}
function gfApplyTicketDetailKind(t){
  const isService = gfTicketAssetKind(t) === 'SERVICE';
  const label = document.getElementById('dAssetLabel');
  if(label) label.textContent = isService ? 'Serviço' : 'Equipamento';
  ['dPatrimonioBox','dBrandBox','dModelBox'].forEach(id=>{
    const el = document.getElementById(id);
    if(el) el.style.display = isService ? 'none' : '';
  });
}

function fillDrawerTicket(t){
  current=t;
  dNumber.innerText='#'+(current.ticket_number||current.id);
  dSector.innerText=current.sector_name||'-';
  gfApplyTicketDetailKind(current);
  const isServiceTicket = gfTicketAssetKind(current) === 'SERVICE';
  dPatrimonio.innerText=isServiceTicket ? '-' : plainPatrimonio(current);
  dAsset.innerText=current.asset_name||'-';
  if(window.dBrand)dBrand.innerText=isServiceTicket ? '-' : (current.asset_brand||current.brand||'-');
  if(window.dModel)dModel.innerText=isServiceTicket ? '-' : (current.asset_model||current.model||'-');
  dIssue.innerText=current.issue_name||'-';
  dStatus.innerHTML=statusBadge(current.status);
  dPriority.innerHTML=priBadge(current.priority);
  if(window.dWaitingLabel)dWaitingLabel.innerText=ticketTimeLabel(current);
  dWaiting.innerText=ticketTimeValue(current);
  if(window.dFinishedAt)dFinishedAt.innerText=ticketTimeMini(current);
  dResponsible.innerText=gfShortPersonName(current.assigned_to_name)||'Área administrativa';
  injectSpExtraInfo(current);
  dDescription.innerText=current.description||'Sem descrição.';
  if(window.dSolution){dSolution.textContent=current.solution_note||current.technical_observation||'Ainda não informada.';dSolution.classList.toggle('empty',!(current.solution_note||current.technical_observation));}
  injectTicketRatingInDrawer(current);
  renderFiles();
  renderLogs();
  loadSmartHistory(current.id);
  drawerBg.classList.add('show');
  drawer.classList.add('show');
  updateTicketActionButtons();
  applyRoleUI();
}
async function openDrawer(id){
  const key=coerceTicketKey(id);
  if(!key){alert('Número do chamado inválido.');return}

  // CURA DA FERIDA: links/notificações usam tickets.id.
  // Primeiro busca por ID interno exato; só depois cai no número visual antigo.
  const byId = await fetchTicketByDbId(key);
  if(byId && Number(byId.id)===key){ fillDrawerTicket(byId); return byId; }

  const cachedById=(Array.isArray(tickets)?tickets:[]).find(x=>Number(x.id)===key);
  if(cachedById){ fillDrawerTicket(cachedById); return cachedById; }

  const full=await fetchTicketByKey(key);
  if(full){ fillDrawerTicket(full); return full; }

  const cached=(Array.isArray(tickets)?tickets:[]).find(x=>Number(x.ticket_number)===key);
  if(cached){ fillDrawerTicket(cached); return cached; }
  alert('Não foi possível abrir este chamado. Rota testada, mas o ID/número não retornou dados.');
}

function closeDrawer(){
  drawer.classList.remove('show');
  if(window.historyDrawer) historyDrawer.classList.remove('show');

  if(window.gfRestoreDashboardModalContext && window.gfRestoreDashboardModalContext()){
    const url = new URL(window.location.href);
    if(url.searchParams.has('ticket')){
      url.searchParams.delete('ticket');
      window.history.replaceState({}, '', url.pathname + (url.searchParams.toString() ? '?' + url.searchParams.toString() : ''));
    }
    return;
  }

  if(window.dashboardFilterDrawer) dashboardFilterDrawer.classList.remove('show');
  drawerBg.classList.remove('show');
  const url = new URL(window.location.href);
  if(url.searchParams.has('ticket')){
    url.searchParams.delete('ticket');
    window.history.replaceState({}, '', url.pathname + (url.searchParams.toString() ? '?' + url.searchParams.toString() : ''));
  }
}
let pendingResolveTicketId=null;
function openResolveModal(id){
  const t = tickets.find(x=>Number(x.id)===Number(id)) || current;
  const clean = (typeof ticketStatusClean==='function') ? ticketStatusClean(t) : String(t&&t.status||'').toUpperCase();
  const assigned = !!(t && (t.assigned_to_user_id || t.assignee_id || t.responsible_user_id || t.assigned_to_name || t.assigned_name || t.responsible_name || t.technician_name));
  if(t && clean==='IN_PROGRESS' && assigned && !currentUserOwnsTicket(t)){
    alert('Somente quem assumiu este chamado pode finalizar.');
    return;
  }
  if(t && clean==='NEW'){
    alert('Assuma o chamado antes de finalizar.');
    return;
  }
  pendingResolveTicketId=id;
  const info=document.getElementById('resolveTicketInfo');
  const txt=document.getElementById('resolveSolution');
  if(info){
    info.innerHTML=`Chamado #${t?.ticket_number||t?.id||id}<small>${t?.asset_name||'-'} · ${t?.issue_name||'-'}</small>`;
  }
  if(txt){ txt.value = (t?.final_outcome==='SWAP' && t?.status==='IN_PROGRESS') ? '' : (t?.solution_note || ''); setTimeout(()=>txt.focus(),80); }
  const photoBox=document.getElementById('resolvePhotoBox');
  const photoInput=document.getElementById('resolvePhoto');
  if(photoInput) photoInput.value='';
  if(photoBox) photoBox.classList.toggle('show', isTech());
  const mt=document.getElementById('resolveMaintenanceType'); if(mt) mt.value=t?.maintenance_type||'';
  const pn=document.getElementById('resolvePartName'); if(pn) pn.value=t?.part_name||'';
  const mv=document.getElementById('resolveMaintenanceValue'); if(mv) mv.value=t?.maintenance_value||'';
  const sp=document.getElementById('resolveSupplierName'); if(sp) sp.value=t?.ticket_supplier_name||t?.supplier_name||'';
  const md=document.getElementById('resolveMaintenanceDesc'); if(md) md.value=t?.maintenance_description||'';
  const defaultOutcome='RESOLVED';
  const checked=document.querySelector(`input[name=\"resolveOutcome\"][value=\"${defaultOutcome}\"]`);
  if(checked) checked.checked=true;
  try{ if(resolveBg && resolveBg.parentElement !== document.body) document.body.appendChild(resolveBg); }catch(e){}
  resolveBg.classList.add('show');
  try{
    resolveBg.style.setProperty('position','fixed','important');
    resolveBg.style.setProperty('inset','0','important');
    resolveBg.style.setProperty('z-index','2147483200','important');
    resolveBg.style.setProperty('pointer-events','auto','important');
    var rm=resolveBg.querySelector('.resolveModal');
    if(rm){ rm.style.setProperty('position','relative','important'); rm.style.setProperty('z-index','2147483201','important'); rm.style.setProperty('pointer-events','auto','important'); }
  }catch(e){}
  document.body.classList.add('resolveOpen');
  setTimeout(()=>{ try{ resolveBg.scrollTop=0; document.querySelector('.resolveModal')?.scrollTo?.(0,0); }catch(e){} },30);
}
function closeResolveModal(){
  pendingResolveTicketId=null;
  resolveBg.classList.remove('show');
  document.body.classList.remove('resolveOpen');
}
async function confirmResolveTicket(){
  const txt=document.getElementById('resolveSolution');
  const solution=(txt?.value||'').trim();
  const outcome='RESOLVED';
  if(!solution){alert('Informe a observação técnica antes de finalizar.');txt?.focus();return}
  const photo=document.getElementById('resolvePhoto');
  if(isTech() && (!photo || !photo.files || photo.files.length!==1)){alert('Perfil técnico precisa anexar 1 foto da resolução antes de finalizar.');photo?.focus();return}
  await setStatus(pendingResolveTicketId,'DONE',solution,outcome);
  closeResolveModal();
}
async function setStatus(id,status,solutionText='',finalOutcome='RESOLVED'){
  if(!(await window.gfConfirmAssumeBeforeStatus(id,status))) return false;
  if(!guardAction('ticket')) return;
  const tCheck = (tickets.find(x=>Number(x.id)===Number(id)) || current);
  if(status==='DONE' && tCheck && !currentUserOwnsTicket(tCheck)){
    alert(tCheck.assigned_to_user_id ? 'Somente quem assumiu este chamado pode finalizar.' : 'Assuma o chamado antes de finalizar.');
    return;
  }
  if(status==='DONE' && !String(solutionText||'').trim()){
    openResolveModal(id);
    return;
  }
  if(statusBusy){
    try{ toastMsg('Aguarde, já estou processando o chamado...'); }catch(e){}
    return false;
  }
  statusBusy=true;
  const gfDisabledButtons=[];
  document.querySelectorAll('button').forEach(b=>{
    if(b.closest('#gfAssumeConfirmOverlay')) return;
    if(b.disabled) return;
    const isTicketAction = b.matches('[data-gf-assume-ticket],[data-gf-resolve-ticket]') || /Assumir|Finalizar|Resolver|Salvar/i.test(String(b.textContent||''));
    if(isTicketAction){ b.disabled=true; gfDisabledButtons.push(b); }
  });
  try{
    const body={status};
    if(String(status||'').toUpperCase()==='IN_PROGRESS') body.assume_confirmed='YES';
    if(String(solutionText||'').trim()) body.solution=String(solutionText).trim();
    if(status==='DONE'){
      body.final_outcome=finalOutcome||'RESOLVED';
      body.maintenance_type=document.getElementById('resolveMaintenanceType')?.value||'';
      body.part_name=document.getElementById('resolvePartName')?.value||'';
      body.maintenance_value=document.getElementById('resolveMaintenanceValue')?.value||'';
      body.supplier_name=document.getElementById('resolveSupplierName')?.value||'';
      body.maintenance_description=document.getElementById('resolveMaintenanceDesc')?.value||'';
    }
    let fetchOptions;
    const photoInput=document.getElementById('resolvePhoto');
    if(status==='DONE' && photoInput?.files?.length){
      const fd=new FormData();
      Object.entries(body).forEach(([k,v])=>fd.append(k, v==null?'':String(v)));
      fd.append('resolution_photo', photoInput.files[0]);
      fetchOptions={method:'POST',body:fd};
    }else{
      fetchOptions={method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)};
    }
    const r=await fetch(API+'/api/admin/tickets/'+id+'/status',fetchOptions);
    if(r.status===401){location.href='/login';return}
    const j=await r.json().catch(()=>({}));
    if(!j.ok){alert(j.error||'Erro ao atualizar chamado');return}
    if(status==='IN_PROGRESS') toastMsg('Chamado assumido e enviado para Em andamento!');
    if(status==='DONE') toastMsg(j.pending_swap?'Chamado continua em andamento aguardando troca!':'Chamado finalizado e histórico registrado!');
    await loadTickets();
    // GF_STATUS_REFRESH_COUNTERS_20260620
    // Ao assumir/finalizar, força recarregar o Dashboard sem usar cache de 8s.
    // Assim os cards e contadores mudam na hora, sem precisar F5.
    if(typeof window.gfDashboardForceRefresh==='function'){
      await window.gfDashboardForceRefresh();
      if(typeof gfRefreshOpenDashboardFilter==='function') gfRefreshOpenDashboardFilter();
    }else if(typeof loadDashboardV8==='function'){
      await loadDashboardV8();
      if(typeof gfRefreshOpenDashboardFilter==='function') gfRefreshOpenDashboardFilter();
    }
    if(status==='DONE' && typeof loadAssets==='function'){
      await loadAssets();
      if(typeof loadSectors==='function') await loadSectors();
    }
    if(current&&current.id===id)openDrawer(id);
  }finally{
    statusBusy=false;
    try{ gfDisabledButtons.forEach(b=>{ b.disabled=false; }); }catch(e){}
  }
}
function setCurrentStatus(status){
  if(!current) return;
  const clean=ticketStatusClean(current);
  const assigned=!!(current.assigned_to_user_id || current.assignee_id || current.responsible_user_id || current.assigned_user_id || current.assigned_to_name || current.assigned_name || current.responsible_name || current.technician_name);
  const isMine=currentUserOwnsTicket(current);
  if(status==='DONE'){
    if(clean!=='IN_PROGRESS' || !assigned || !isMine){ updateTicketActionButtons(); alert(clean==='DONE'?'Este chamado já foi finalizado.':(assigned?'Somente quem assumiu este chamado pode finalizar.':'Assuma o chamado antes de finalizar.')); return; }
    return openResolveModal(current.id);
  }
  if(status==='IN_PROGRESS' && (clean!=='NEW' || assigned)){ updateTicketActionButtons(); return; }
  return setStatus(current.id,status);
}
async function addNote(){if(!guardAction('ticket')) return;const txt=note.value.trim();if(!txt)return alert('Digite uma atualização para o solicitante.');const r=await fetch(API+'/api/admin/tickets/'+current.id+'/notes',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({note:txt})});if(r.status===401){location.href='/login';return}note.value='';await loadTickets();openDrawer(current.id)}
search.oninput=render;statusFilter.onchange=render;
function optSectors(selected=''){return sectors.map(s=>`<option value="${s.id}" ${String(selected)===String(s.id)?'selected':''}>${s.name}</option>`).join('')}
async function loadRegisters(){await loadSectors();}
async function loadSectors(){
  const j=await (await fetch(API+'/api/admin/sectors')).json();
  sectors=j.sectors||[];
  assetSector.innerHTML=optSectors();
  assetFilterSector.innerHTML='<option value="">Todos setores</option>'+optSectors();
  renderSectors();
}
function gfToggleEdit(btn){
  const card = btn.closest('.gfCleanCard');
  if(!card) return;
  card.classList.toggle('editing');
  btn.textContent = card.classList.contains('editing') ? 'Fechar' : 'Editar';
}
function renderSectors(){
  const list=sectors.slice(0,cadLimit.sectors||8);
  if(typeof sectorsBody==='undefined'){var sectorsBody=document.getElementById('sectorsBody');} if(sectorsBody) sectorsBody.innerHTML=list.map(s=>`<div class="gfCleanCard gfSectorCard"><div class="gfCardAccent"></div><div class="gfCardIcon">📍</div><div class="gfCardMain"><div class="gfCardTop"><h3>${escapeAttr(s.name)}</h3>${s.active?'<span class="gfStatus on">Ativo</span>':'<span class="gfStatus off">Inativo</span>'}</div><div class="gfCardMeta"><span><b>${s.assets_count||0}</b> equipamentos</span><span>QR: /s/${escapeAttr(s.slug)}</span><span>Bloco: <b>${escapeAttr(qrBlockLabel(s.qr_block))}</b></span></div><div class="gfInlineEdit adminOnly"><input class="sectorNameInput" value="${escapeAttr(s.name)}" id="sn${s.id}"><input class="sectorNameInput" list="qrBlockOptions" value="${escapeAttr(s.qr_block||'')}" id="sb${s.id}" placeholder="Bloco do QR: RESTAURANTE, ADMINISTRATIVO..."><button class="btn btnSaveInline" onclick="updateSector(${s.id})">Salvar</button></div></div><div class="gfCardActions"><button class="btn btnEdit adminOnly" onclick="gfToggleEdit(this)">Editar</button><button class="btn btnLight" onclick="openSectorAssetsDrawer(${s.id})">Equipamentos</button><button class="btn btnLight" onclick="copyQr('${s.slug}')">QR</button><button class="btn btnLight" onclick="openSectorHistory(${s.id})">Histórico</button></div></div>`).join('') + (sectors.length>list.length?`<div class="gfMoreCard"><button class="btn btnLight" onclick="moreRows('sectors')">Ver mais setores (${sectors.length-list.length})</button></div>`:'') || '<div class="empty">Nenhum setor cadastrado</div>';
}
async function saveSector(){if(!guardAction('admin')) return;
  const name=sectorName.value.trim();
  if(!name)return alert('Informe o nome do setor/local.');
  const r=await fetch(API+'/api/admin/sectors',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name})});
  const j=await r.json();
  if(!j.ok)return alert(j.error);
  sectorName.value='';
  await loadSectors();
  await loadQrs();
  toastMsg('Setor criado e QR gerado automaticamente');
}
async function updateSector(id){if(!guardAction('admin')) return;
  const name=document.getElementById('sn'+id).value.trim();
  const blockEl=document.getElementById('sb'+id);
  const qr_block=blockEl?blockEl.value.trim():'';
  const old=sectors.find(s=>s.id===id);
  await fetch(API+'/api/admin/sectors/'+id,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({name,slug:old.slug,active:true,qr_block})});
  await loadSectors();
  await loadQrs();
  toastMsg('Setor atualizado');
}
function escapeAttr(v){return String(v||'').replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;')}
function getSelectedAssetDepartment(){
  const checked=document.querySelector('input[name="assetDepartment"]:checked');
  return checked ? checked.value : 'TI';
}
function assetDepartmentBadge(v){
  const raw=String(v||'').toUpperCase();
  if(raw==='APOIO') return '<span class="assetDeptBadge apoio">🤝 Apoio</span>';
  if(raw==='MANUTENCAO') return '<span class="assetDeptBadge manut">🛠️ Manutenção</span>';
  if(raw==='TI') return '<span class="assetDeptBadge ti">💻 TI</span>';
  return '<span class="assetDeptBadge ti">💻 TI</span>';
}
function assetKindOf(a){
  const k=String(a?.asset_kind||a?.kind||'').toUpperCase();
  if(k==='SERVICE') return 'SERVICE';
  const n=String(a?.name||'').trim().toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
  return ['LIMBER','INTERNET','INTERNETE','MANUTENCAO PREDIAL','MARCENARIA','VIDRACARIA','TOMADA','LAMPADA','ELETRICA','HIDRAULICA','PINTURA','ALVENARIA','REQUISICAO','OUTRAS DEMANDAS','OUTROS'].includes(n)?'SERVICE':'EQUIPMENT';
}
function assetKindBadge(a){return assetKindOf(a)==='SERVICE'?'<span class="badge offB">🧩 Serviço</span>':'<span class="badge activeB">🧰 Equipamento</span>'}
function assetKindIcon(a){const d=String(a?.asset_department||'').toUpperCase(); return assetKindOf(a)==='SERVICE'?(d==='APOIO'?'🤝':'🧩'):(d==='APOIO'?'🤝':(d==='MANUTENCAO'?'🛠️':'💻'))}
function assetKindFromName(name){return assetKindOf({name:name});}
function getSelectedAssetKind(){return (document.getElementById('assetKindSelect')?.value || assetKindFromName(document.getElementById('assetName')?.value||'')).toUpperCase()==='SERVICE'?'SERVICE':'EQUIPMENT';}
async function loadAssets(force=false){
  const sid=assetFilterSector.value;
  const key='assets:'+(sid||'ALL');
  const now=Date.now();
  window.__gfAssetsCacheV29=window.__gfAssetsCacheV29||{};
  const cached=window.__gfAssetsCacheV29[key];
  if(!force && cached && (now-cached.ts)<60000 && Array.isArray(cached.assets)){
    assets=cached.assets;
    window.assets=assets;
    renderAssets();
    return assets;
  }
  const j=await (await fetch(API+'/api/admin/assets'+(sid?'?sector_id='+sid:''))).json();
  assets=j.assets||[];
  window.assets=assets;
  window.__gfAssetsCacheV29[key]={ts:Date.now(),assets:assets};
  renderAssets();
  return assets;
}
function gfInvalidateAssetsCacheV29(){
  try{window.__gfAssetsCacheV29={};}catch(e){}
  try{ if(typeof window.gfForceRenderAssetsV31==='function') window.gfForceRenderAssetsV31(); }catch(e){}
}
function assetStatusBadge(status){if(status==='ACTIVE')return '<span class="badge activeB">Ativo</span>';if(status==='NO_REPAIR')return '<span class="badge assetStatusNoRepair">Sem reparo</span>';if(status==='WRITTEN_OFF')return '<span class="badge assetStatusWriteOff">Baixado</span>';if(status==='SWAP')return '<span class="badge assetStatusSwap">Aguardando troca</span>';return '<span class="badge offB">Inativo</span>'}
function isSemPatrimonioCode(v){
  return /^SP-\d+$/i.test(String(v||'').trim()) || /^SEM-PATR-\d+$/i.test(String(v||'').trim());
}
function getPatrimonioValue(assetOrValue){
  if(assetOrValue && typeof assetOrValue === 'object'){
    const p = String(assetOrValue.patrimonio || assetOrValue.asset_patrimonio || '').trim();
    if(p) return p;
    const sp = String(assetOrValue.sp_identificacao || assetOrValue.asset_sp_identificacao || '').trim();
    return sp || '';
  }
  return String(assetOrValue || '').trim();
}
function displayPatrimonio(assetOrValue){
  const value=getPatrimonioValue(assetOrValue);
  if(!value) return '<span class="patrimonioSemBadge">Sem patrimônio</span>';
  if(isSemPatrimonioCode(value)) return `<span class="patrimonioSpBadge">${escHTML(value)}</span>`;
  return escHTML(value);
}
function plainPatrimonio(assetOrValue){
  const value=getPatrimonioValue(assetOrValue);
  return value || 'Sem patrimônio';
}
function isSPTicketAsset(obj){
  const p=String(obj?.patrimonio || obj?.asset_patrimonio || '').trim().toUpperCase();
  const sp=String(obj?.sp_identificacao || obj?.asset_sp_identificacao || '').trim();
  return !!sp || !p || p.startsWith('SP-');
}
function spValue(obj, key){
  return String(obj?.[key] || obj?.['asset_'+key] || '').trim();
}
function spHistoryChips(obj){
  if(!isSPTicketAsset(obj)) return '';
  const ident=spValue(obj,'sp_identificacao') || getPatrimonioValue(obj);
  const resp=spValue(obj,'sp_responsavel');
  const loc=spValue(obj,'sp_local');
  const obs=spValue(obj,'sp_obs');
  const chips=[];
  if(ident) chips.push(`<span class="spHistoryChip">🔎 ${escHTML(ident)}</span>`);
  if(resp) chips.push(`<span class="spHistoryChip person">👤 ${escHTML(resp)}</span>`);
  if(loc) chips.push(`<span class="spHistoryChip local">📍 ${escHTML(loc)}</span>`);
  if(obs) chips.push(`<span class="spHistoryChip obs">📝 ${escHTML(obs)}</span>`);
  return chips.length ? `<div class="spHistoryChips">${chips.join('')}</div>` : '';
}
function spMetaText(obj){
  if(!isSPTicketAsset(obj)) return '';
  const parts=[];
  const ident=spValue(obj,'sp_identificacao') || getPatrimonioValue(obj);
  const resp=spValue(obj,'sp_responsavel');
  const loc=spValue(obj,'sp_local');
  if(ident) parts.push(ident);
  if(resp) parts.push('Responsável: '+resp);
  if(loc) parts.push('Local: '+loc);
  return parts.join(' • ');
}
function renderSpExtraInfo(obj){
  const isSP=isSPTicketAsset(obj);
  const ident=isSP ? (spValue(obj,'sp_identificacao') || getPatrimonioValue(obj)) : '';
  const resp=spValue(obj,'sp_responsavel');
  const loc=isSP ? spValue(obj,'sp_local') : '';
  const obs=isSP ? spValue(obj,'sp_obs') : '';
  if(!ident && !resp && !loc && !obs) return '';
  return `<div class="spExtraGrid">
    ${ident?`<div class="info spExtraInfo"><b>Identificação SP</b><span>${escHTML(ident)}</span></div>`:''}
    ${resp?`<div class="info spExtraInfo"><b>Responsável do equipamento</b><span>👤 ${escHTML(resp)}</span></div>`:''}
    ${loc?`<div class="info spExtraInfo"><b>Local do item</b><span>📍 ${escHTML(loc)}</span></div>`:''}
    ${obs?`<div class="info spExtraInfo"><b>Obs. sem patrimônio</b><span>📝 ${escHTML(obs)}</span></div>`:''}
  </div>`;
}
function injectSpExtraInfo(obj){
  const grid=document.querySelector('#drawer .infoGrid');
  if(!grid) return;
  grid.querySelectorAll('.spExtraGrid').forEach(el=>el.remove());
  const html=renderSpExtraInfo(obj);
  if(html) grid.insertAdjacentHTML('beforeend', html);
}
function toggleAssetOwnerMode(){
  const checked=!!document.getElementById('assetHasOwner')?.checked;
  const box=document.getElementById('assetOwnerExtra');
  if(box) box.classList.toggle('show', checked);
  const el=document.getElementById('assetOwnerName');
  if(el) el.disabled=!checked;
  if(checked) setTimeout(()=>el?.focus(),80);
}
function toggleAssetPatrimonioMode(){
  const checked=!!document.getElementById('assetNoPatrimonio')?.checked;
  if(window.assetPatrimonio){
    assetPatrimonio.disabled=checked;
    if(checked) assetPatrimonio.value='';
    assetPatrimonio.placeholder=checked?'Será gerado automático: SP-0001':'Patrimônio / etiqueta (opcional se marcar sem patrimônio)';
  }
  const extra=document.getElementById('semPatrimonioExtra');
  if(extra) extra.classList.toggle('show', checked);
  ['sp_identificacao','sp_local','sp_obs'].forEach(id=>{
    const el=document.getElementById(id);
    if(el) el.disabled=!checked;
  });
  const resp=document.getElementById('sp_responsavel');
  if(resp) resp.disabled=!checked;
  if(checked){
    if(document.getElementById('assetHasOwner')) assetHasOwner.checked=false;
    toggleAssetOwnerMode();
    setTimeout(()=>document.getElementById('sp_identificacao')?.focus(),80);
  }
}
async function saveAsset(){
  if(!guardAction('admin')) return;
  const semPatrimonio=!!document.getElementById('assetNoPatrimonio')?.checked;
  const hasOwner=!!document.getElementById('assetHasOwner')?.checked;
  const ownerName=String(document.getElementById('assetOwnerName')?.value||'').trim();
if(!semPatrimonio && hasOwner && !ownerName) return alert('Informe o nome/responsável do equipamento. Ex: Lais');
  const body={
    sector_id:assetSector.value,
    patrimonio:semPatrimonio?'':assetPatrimonio.value,
    no_patrimonio:semPatrimonio,
    name:assetName.value,
    brand:assetBrand.value,
    model:assetModel.value,
    asset_department:getSelectedAssetDepartment(),
    asset_kind:getSelectedAssetKind(),
    purchase_value:document.getElementById('assetPurchaseValue')?.value||'',
    invoice_number:document.getElementById('assetInvoiceNumber')?.value||'',
    purchase_date:document.getElementById('assetPurchaseDate')?.value||'',
    supplier_name:document.getElementById('assetSupplierName')?.value||'',
    warranty_until:document.getElementById('assetWarrantyUntil')?.value||'',
    useful_life_years:document.getElementById('assetUsefulLifeYears')?.value||'',
    sp_identificacao:semPatrimonio?document.getElementById('sp_identificacao')?.value:'',
    sp_responsavel:semPatrimonio?document.getElementById('sp_responsavel')?.value:(hasOwner?ownerName:''),
    sp_local:semPatrimonio?document.getElementById('sp_local')?.value:'',
    sp_obs:semPatrimonio?document.getElementById('sp_obs')?.value:''
  };
  const r=await fetch(API+'/api/admin/assets',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
  const j=await r.json();
  if(!j.ok)return alert(j.error);
  ['assetPatrimonio','assetName','assetBrand','assetModel','assetPurchaseValue','assetInvoiceNumber','assetPurchaseDate','assetSupplierName','assetWarrantyUntil','sp_identificacao','sp_responsavel','sp_local','sp_obs','assetOwnerName'].forEach(id=>{const el=document.getElementById(id); if(el) el.value='';});
  if(document.getElementById('assetNoPatrimonio')) assetNoPatrimonio.checked=false;
  if(document.getElementById('assetHasOwner')) assetHasOwner.checked=false;
  if(document.getElementById('assetDeptTI')) assetDeptTI.checked=true;
  toggleAssetPatrimonioMode();
  toggleAssetOwnerMode();
  await loadAssets();await loadSectors();toastMsg(getSelectedAssetKind()==='SERVICE'?'Serviço cadastrado':'Equipamento cadastrado')
}
function ensureAssetEditDrawer(){
  if(document.getElementById('assetEditDrawer')) return;
  document.body.insertAdjacentHTML('beforeend', `
    <div id="assetEditBackdrop" class="assetEditBackdrop" onclick="closeAssetEditDrawer()"></div><aside id="assetEditDrawer" class="assetEditDrawer"><div class="assetEditHead"><div><h2>Editar equipamento</h2><small id="assetEditSub">Atualize dados, responsável e setor</small></div><button class="assetEditClose" onclick="closeAssetEditDrawer()">×</button></div><div class="assetEditBody"><div class="assetEditGrid"><input type="hidden" id="editAssetId"><label>Patrimônio<input id="editAssetPatrimonio" placeholder="Patrimônio ou SP-0001"></label><label>Setor<select id="editAssetSector"></select></label><label class="full">Equipamento<input id="editAssetName" placeholder="Nome do equipamento"></label><label>Marca<input id="editAssetBrand" placeholder="Marca"></label><label>Modelo<input id="editAssetModel" placeholder="Modelo"></label><div class="assetDepartmentChoice full editDeptChoice" role="radiogroup" aria-label="Área do equipamento"><label class="assetDeptBox ti"><input type="radio" name="editAssetDepartmentRadio" id="editAssetDeptTI" value="TI"><span>💻 TI</span><small>Padrão dos equipamentos antigos</small></label><label class="assetDeptBox manut"><input type="radio" name="editAssetDepartmentRadio" id="editAssetDeptManutencao" value="MANUTENCAO"><span>🛠️ Manutenção</span><small>Marque só quando for manutenção</small></label><label class="assetDeptBox apoio"><input type="radio" name="editAssetDepartmentRadio" id="editAssetDeptApoio" value="APOIO"><span>🤝 Apoio</span><small>Serviços gerais / apoio operacional</small></label></div><label>Valor compra<input id="editAssetPurchaseValue" placeholder="Ex: 2500,00"></label><label>Nº nota fiscal<input id="editAssetInvoiceNumber" placeholder="NF opcional"></label><label>Data compra<input id="editAssetPurchaseDate" type="date"></label><label>Fornecedor<input id="editAssetSupplierName" placeholder="Fornecedor opcional"></label><label>Garantia até<input id="editAssetWarrantyUntil" type="date"></label><label>Vida útil estimada<input id="editAssetUsefulLifeYears" type="number" min="1" placeholder="Anos opcionais"></label><label>Status<select id="editAssetStatus"><option value="ACTIVE">Ativo</option><option value="INACTIVE">Inativo</option><option value="SWAP">Aguardando troca</option><option value="NO_REPAIR">Sem reparo</option><option value="WRITTEN_OFF">Baixado patrimônio</option></select></label><label class="assetEditCheck"><input type="checkbox" id="editAssetHasOwner" onchange="toggleEditAssetOwner()"> Vincular responsável / pessoa</label><label id="editAssetOwnerLine" class="full" style="display:none">Nome / responsável<input id="editAssetOwner" placeholder="Ex: Lais, João TI, Recepção"></label><label class="assetEditCheck"><input type="checkbox" id="editAssetNoPatrimonio" onchange="toggleEditAssetNoPatrimonio()"> Item sem patrimônio / SP</label><div id="editAssetSpBox" class="assetEditSpBox"><label>Identificação<input id="editSpIdentificacao" placeholder="Mouse USB preto / Lâmpada LED 20W"></label><label>Responsável<input id="editSpResponsavel" placeholder="Lais / Recepção"></label><label>Local<input id="editSpLocal" placeholder="Financeiro - Mesa 3 / Sala 2"></label><label>Observação<input id="editSpObs" placeholder="Observação opcional"></label></div></div></div><div class="assetEditFoot"><button class="btn btnLight" onclick="closeAssetEditDrawer()">Cancelar</button><button class="btn btnLight" onclick="openAssetHistory(Number(document.getElementById('editAssetId').value))">Histórico</button><button class="btn btnDark" onclick="saveAssetFromDrawer()">Salvar alterações</button></div></aside>`);
}
function toggleEditAssetOwner(){
  const checked=!!document.getElementById('editAssetHasOwner')?.checked;
  const line=document.getElementById('editAssetOwnerLine');
  if(line) line.style.display=checked?'flex':'none';
}
function toggleEditAssetNoPatrimonio(){
  const checked=!!document.getElementById('editAssetNoPatrimonio')?.checked;
  const box=document.getElementById('editAssetSpBox');
  if(box) box.classList.toggle('show', checked);
  const patr=document.getElementById('editAssetPatrimonio');
  if(patr){ patr.disabled=checked; if(checked && !isSemPatrimonioCode(patr.value)) patr.value=''; }
  if(checked){
    const owner=document.getElementById('editAssetHasOwner');
    if(owner) owner.checked=false;
    toggleEditAssetOwner();
  }
}
function openAssetEditDrawer(id){
  if(!guardAction('admin')) return;
  ensureAssetEditDrawer();
  const a=assets.find(x=>Number(x.id)===Number(id));
  if(!a) return alert('Equipamento não encontrado na lista atual');
  editAssetId.value=a.id;
  editAssetPatrimonio.value=a.patrimonio||'';
  editAssetSector.innerHTML=optSectors(a.sector_id);
  editAssetName.value=a.name||'';
  editAssetBrand.value=a.brand||'';
  editAssetModel.value=a.model||'';
  const depRaw = String(a.asset_department || '')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g,'')
  .toUpperCase();

const depEdit = depRaw.includes('APOIO')
  ? 'APOIO'
  : (depRaw.includes('MANUT') ? 'MANUTENCAO' : 'TI');
  if(document.getElementById('editAssetDeptTI')) editAssetDeptTI.checked = depEdit === 'TI';
  if(document.getElementById('editAssetDeptManutencao')) editAssetDeptManutencao.checked = depEdit === 'MANUTENCAO';
  if(document.getElementById('editAssetDeptApoio')) editAssetDeptApoio.checked = depEdit === 'APOIO';
  editAssetPurchaseValue.value=a.purchase_value||'';
  editAssetInvoiceNumber.value=a.invoice_number||'';
  editAssetPurchaseDate.value=a.purchase_date||'';
  editAssetSupplierName.value=a.supplier_name||a.asset_supplier_name||'';
  editAssetWarrantyUntil.value=a.warranty_until||'';
  if(window.editAssetUsefulLifeYears) editAssetUsefulLifeYears.value=a.useful_life_years||'';
  editAssetStatus.value=a.status||'ACTIVE';
  const sem=isSemPatrimonioCode(a.patrimonio)||(!a.patrimonio && (a.sp_identificacao||a.sp_local||a.sp_obs));
  editAssetNoPatrimonio.checked=!!sem;
  editSpIdentificacao.value=a.sp_identificacao||'';
  editSpResponsavel.value=a.sp_responsavel||'';
  editSpLocal.value=a.sp_local||'';
  editSpObs.value=a.sp_obs||'';
  editAssetOwner.value=!sem?(a.sp_responsavel||''):'';
  editAssetHasOwner.checked=!sem && !!String(a.sp_responsavel||'').trim();
  assetEditSub.innerText=`${a.patrimonio||'Sem patrimônio'} • ${a.sector_name||'-'}`;
  toggleEditAssetNoPatrimonio();
  toggleEditAssetOwner();
  assetEditBackdrop.classList.add('show');
  assetEditDrawer.classList.add('show');
}
function closeAssetEditDrawer(){
  document.getElementById('assetEditBackdrop')?.classList.remove('show');
  document.getElementById('assetEditDrawer')?.classList.remove('show');
}
async function saveAssetFromDrawer(){
  if(!guardAction('admin')) return;
  const id=Number(document.getElementById('editAssetId')?.value||0);
  const sem=!!document.getElementById('editAssetNoPatrimonio')?.checked;
  const hasOwner=!!document.getElementById('editAssetHasOwner')?.checked;
  if(sem){
    if(!String(editSpIdentificacao.value||'').trim()) return alert('Informe a identificação do item sem patrimônio.');
    if(!String(editSpLocal.value||'').trim()) return alert('Informe o local do item sem patrimônio.');
  }
  if(!sem && hasOwner && !String(editAssetOwner.value||'').trim()) return alert('Informe o nome/responsável do equipamento.');
  const body={
    sector_id:editAssetSector.value,
    patrimonio:sem?'':editAssetPatrimonio.value,
    no_patrimonio:sem,
    name:editAssetName.value,
    brand:editAssetBrand.value,
    model:editAssetModel.value,
    asset_department:(document.querySelector('input[name="editAssetDepartmentRadio"]:checked')?.value || 'TI'),
    asset_kind:(document.getElementById('editAssetKind')?.value || assetKindFromName(editAssetName.value)),
    purchase_value:editAssetPurchaseValue.value,
    invoice_number:editAssetInvoiceNumber.value,
    purchase_date:editAssetPurchaseDate.value,
    supplier_name:editAssetSupplierName.value,
    warranty_until:editAssetWarrantyUntil.value,
    useful_life_years:document.getElementById('editAssetUsefulLifeYears')?.value||'',
    status:editAssetStatus.value,
    sp_identificacao:sem?editSpIdentificacao.value:'',
    sp_responsavel:sem?editSpResponsavel.value:(hasOwner?editAssetOwner.value:''),
    sp_local:sem?editSpLocal.value:'',
    sp_obs:sem?editSpObs.value:''
  };
  const j=await (await fetch(API+'/api/admin/assets/'+id,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)})).json();
  if(!j.ok) return alert(j.error||'Erro ao salvar equipamento');
  closeAssetEditDrawer();
  gfInvalidateAssetsCacheV29();await loadAssets(true);await loadSectors();toastMsg('Equipamento atualizado');
}
async function updateAsset(id){
  if(!guardAction('admin')) return;
  openAssetEditDrawer(id);
}
async function transferAsset(id){if(!guardAction('admin')) return;const sector_id=document.getElementById('tr'+id).value;const j=await (await fetch(API+'/api/admin/assets/'+id+'/transfer',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sector_id})})).json();if(!j.ok)return alert(j.error);gfInvalidateAssetsCacheV29();await loadAssets(true);await loadSectors();toastMsg(j.message||'Transferido')}
async function sendAssetToSwap(id){
  if(!guardAction('ticket')) return;
  const asset=assets.find(a=>a.id===id);
  const ok=confirm(`Enviar "${asset?.name||'equipamento'}" para Aguardando troca?\n\nEle NÃO volta direto ao setor. Depois abra o chamado em andamento e finalize como Resolvido.`);
  if(!ok) return;
  const j=await (await fetch(API+'/api/admin/assets/'+id+'/send-to-swap',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({note:'Reavaliação: equipamento será analisado/trocado antes de retornar ao setor.'})})).json();
  if(!j.ok) return alert(j.error||'Erro ao enviar para troca');
  await loadTickets();
  await loadAssets();
  await loadSectors();
  toastMsg(j.message||'Enviado para Aguardando troca');
  setTimeout(()=>{
    const panel=document.querySelector('.cadProSwapPanel');
    if(panel) panel.scrollIntoView({behavior:'smooth',block:'start'});
  },120);
}
async function toggleAsset(id,status){if(!guardAction('admin')) return;const old=assets.find(a=>a.id===id);const body={...old,status};await fetch(API+'/api/admin/assets/'+id,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});gfInvalidateAssetsCacheV29();await loadAssets(true);toastMsg('Status atualizado')}
async function loadIssues(force=false){
  const now=Date.now();
  window.__gfIssuesCacheV30=window.__gfIssuesCacheV30||{};
  const cached=window.__gfIssuesCacheV30.all;
  if(!force && cached && (now-cached.ts)<60000 && Array.isArray(cached.issues)){
    issues=cached.issues;
    window.issues=issues;
    if(!issueFilterAssetsLoaded) refreshIssueFilterAssets();
    renderIssues();
    return issues;
  }
  const j=await (await fetch(API+'/api/admin/issues')).json();
  issues=j.issues||[];
  window.issues=issues;
  window.__gfIssuesCacheV30.all={ts:Date.now(),issues:issues};
  if(!issueFilterAssetsLoaded) refreshIssueFilterAssets();
  renderIssues();
  return issues;
}
function gfInvalidateIssuesCacheV30(){try{window.__gfIssuesCacheV30={};}catch(e){} try{ if(typeof window.gfForceRenderIssuesV31==='function') window.gfForceRenderIssuesV31(); }catch(e){}}

function issuePriorityBadge(priority){
  const p=String(priority||'MEDIUM').toUpperCase();
  if(p==='HIGH') return '<span class="gfPriority high">Alta</span>';
  if(p==='LOW') return '<span class="gfPriority low">Baixa</span>';
  return '<span class="gfPriority medium">Média</span>';
}
let issueFilterAssets=[];
let issueFilterAssetsLoaded=false;
async function refreshIssueFilterAssets(){
  try{
    const j=await (await fetch(API+'/api/admin/assets')).json();
    issueFilterAssets=Array.isArray(j.assets)?j.assets:[];
    issueFilterAssetsLoaded=true;
    refreshIssueQuickFilters();
    renderIssues();
  }catch(e){
    console.warn('issue filter assets',e);
    issueFilterAssetsLoaded=true;
  }
}
function issueNorm(v){return String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();}
function issueKey(v){return issueNorm(v).replace(/[^a-z0-9]+/g,'');}
function issueAssetsSource(){
  const all=Array.isArray(issueFilterAssets)&&issueFilterAssets.length?issueFilterAssets:(Array.isArray(assets)?assets:[]);
  return all.filter(a=>a && String(a.status||'ACTIVE').toUpperCase()==='ACTIVE');
}
function issueAssetNamesForSector(sectorId){
  const rows=issueAssetsSource().filter(a=>!sectorId || String(a.sector_id||'')===String(sectorId));
  return new Set(rows.map(a=>issueKey(a.name)).filter(Boolean));
}
function issueHasAssetInSector(issue,sectorId){
  if(!sectorId) return true;
  const k=issueKey(issue.asset_name);
  if(!k) return false;
  return issueAssetsSource().some(a=>String(a.sector_id||'')===String(sectorId) && issueKey(a.name)===k);
}
function issueFilteredList(){
  const sectorId=document.getElementById('issueFilterSector')?.value||'';
  const assetName=document.getElementById('issueFilterAsset')?.value||'';
  const q=issueNorm(document.getElementById('issueFilterSearch')?.value||'');
  const assetK=issueKey(assetName);
  return (Array.isArray(issues)?issues:[]).filter(i=>{
    if(sectorId && !issueHasAssetInSector(i,sectorId)) return false;
    if(assetK && issueKey(i.asset_name)!==assetK) return false;
    if(q){
      const txt=issueNorm([i.asset_name,i.name,i.priority,priorityText(i.priority)].join(' '));
      if(!txt.includes(q)) return false;
    }
    return true;
  });
}
function refreshIssueQuickFilters(){
  const sectorSel=document.getElementById('issueFilterSector');
  const assetSel=document.getElementById('issueFilterAsset');
  if(!sectorSel || !assetSel) return;
  const oldSector=sectorSel.value||'';
  const oldAsset=assetSel.value||'';
  const sectorOptions=(Array.isArray(sectors)?sectors:[]).slice().sort((a,b)=>String(a.name||'').localeCompare(String(b.name||''),'pt-BR'));
  sectorSel.innerHTML='<option value="">Todos os setores</option>'+sectorOptions.map(s=>`<option value="${escapeAttr(s.id)}">${escapeAttr(s.name||'-')}</option>`).join('');
  if([...sectorSel.options].some(o=>o.value===oldSector)) sectorSel.value=oldSector;
  const sectorId=sectorSel.value||'';
  const validNamesBySector=issueAssetNamesForSector(sectorId);
  const issueNames=[...new Set((Array.isArray(issues)?issues:[])
    .filter(i=>!sectorId || validNamesBySector.has(issueKey(i.asset_name)))
    .map(i=>String(i.asset_name||'').trim())
    .filter(Boolean))]
    .sort((a,b)=>a.localeCompare(b,'pt-BR'));
  assetSel.innerHTML='<option value="">Todos equipamentos</option>'+issueNames.map(n=>`<option value="${escapeAttr(n)}">${escapeAttr(n)}</option>`).join('');
  if([...assetSel.options].some(o=>o.value===oldAsset)) assetSel.value=oldAsset;
  else assetSel.value='';
}
function onIssueSectorFilterChange(){
  const assetSel=document.getElementById('issueFilterAsset');
  if(assetSel) assetSel.value='';
  refreshIssueQuickFilters();
  renderIssues();
}
function clearIssueQuickFilters(){
  const ids=['issueFilterSector','issueFilterAsset','issueFilterSearch'];
  ids.forEach(id=>{const el=document.getElementById(id); if(el) el.value='';});
  refreshIssueQuickFilters();
  renderIssues();
}
function priorityText(priority){
  const p=String(priority||'MEDIUM').toUpperCase();
  if(p==='HIGH') return 'Alta';
  if(p==='LOW') return 'Baixa';
  return 'Média';
}
function normTxt(v){
  return String(v||'')
    .normalize('NFD').replace(/[\u0300-\u036f]/g,'')
    .toLowerCase()
    .replace(/[^a-z0-9]/g,'')
    .trim();
}
function validAssetNameTyped(value){
  const n = normTxt(value);
  return assets.find(a => normTxt(a.name) === n);
}
async function saveIssue(){
  if(!guardAction('admin')) return;
  const asset = validAssetNameTyped(issueAssetName.value);
  if(!asset){
    alert('Selecione um equipamento válido da lista. Se escrever errado, o sistema não deixa cadastrar.');
    issueAssetName.focus();
    return;
  }
  const problem = String(issueName.value||'').trim();
  if(!problem){
    alert('Informe o nome do problema.');
    issueName.focus();
    return;
  }
  const body={
    asset_name: asset.name,
    name: problem,
    priority: issuePriority.value
  };
  const j=await (await fetch(API+'/api/admin/issues',{
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify(body)
  })).json();
  if(!j.ok)return alert(j.error);
  issueAssetName.value='';
  issueName.value='';
  gfInvalidateIssuesCacheV30();await loadIssues(true);
  toastMsg('Problema cadastrado');
}
async function updateIssue(id,active){
  if(!guardAction('admin')) return;
  const assetInput=document.getElementById('ia'+id);
  const nameInput=document.getElementById('in'+id);
  const original=(Array.isArray(issues)?issues:[]).find(x=>Number(x.id)===Number(id))||{};
  const typedAsset=String(assetInput?.value||'').trim();
  const originalAsset=String(original.asset_name||'').trim();
  const asset=validAssetNameTyped(typedAsset);

  let assetName = asset ? asset.name : originalAsset;
  const changedAsset = typedAsset && originalAsset && issueKey(typedAsset) !== issueKey(originalAsset);
  if(!assetName || (changedAsset && !asset)){
    alert('Selecione um equipamento/serviço válido da lista. Se escrever errado, o sistema não salva.');
    assetInput?.focus();
    return;
  }

  const problem=String(nameInput?.value||original.name||'').trim();
  if(!problem){
    alert('Informe o nome do problema.');
    nameInput?.focus();
    return;
  }
  const body={
    asset_name:assetName,
    name:problem,
    priority:document.getElementById('ip'+id)?.value || original.priority || 'MEDIUM',
    active: !!active
  };
  const j=await (await fetch(API+'/api/admin/issues/'+id,{
    method:'PUT',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify(body)
  })).json();
  if(!j.ok)return alert(j.error);
  gfInvalidateIssuesCacheV30();await loadIssues(true);
  toastMsg(active?'Problema ativado':'Problema desativado');
}
let qrOpenBlocks = {};
let qrLastQuery = '';
let qrLastBlockFilter = 'ALL';
let qrLastQrs = [];

function qrBlockLabel(v){return String(v||'').trim() || 'SEM BLOCO DEFINIDO'}
function qrBlockKey(v){
  const label=qrBlockLabel(v);
  if(label==='SEM BLOCO DEFINIDO') return 'SEM_BLOCO_DEFINIDO';
  return label.toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^A-Z0-9]+/g,'_').replace(/^_+|_+$/g,'') || 'SEM_BLOCO_DEFINIDO';
}
function qrBaseBlocks(){return ['RESTAURANTE','ADMINISTRATIVO','PISCINAS','ATENDIMENTO','OPERAÇÃO','TI','MANUTENÇÃO']}
function qrCanonicalBlockName(v){
  const raw=qrBlockLabel(v);
  const key=qrBlockKey(raw);
  if(key==='SEM_BLOCO_DEFINIDO') return 'SEM BLOCO DEFINIDO';
  const candidates=[
    ...qrBaseBlocks(),
    ...qrLocalBlocks(),
    ...(Array.isArray(sectors)?sectors:[]).map(s=>s.qr_block).filter(Boolean).map(qrBlockLabel),
    ...(qrLastQrs||[]).map(s=>s.qr_block).filter(Boolean).map(qrBlockLabel)
  ];
  const found=candidates.find(b=>qrBlockKey(b)===key);
  return found ? qrBlockLabel(found) : raw;
}
function qrSameBlock(a,b){return qrBlockKey(a)===qrBlockKey(b)}
function qrBlockIcon(v){const b=qrCanonicalBlockName(v).toUpperCase();if(b.includes('RESTAUR'))return '🍽️';if(b.includes('ADMIN')||b.includes('FINANCE')||b.includes('RH'))return '🏢';if(b.includes('PISC')||b.includes('POINT')||b.includes('ONDA'))return '🏊';if(b.includes('ATEND')||b.includes('BILH')||b.includes('RECEP'))return '🎟️';if(b.includes('TI'))return '💻';if(b.includes('MAN')||b.includes('OPERA'))return '🛠️';return '📦'}
function qrBlockTone(v){const b=qrCanonicalBlockName(v).toUpperCase();if(b.includes('RESTAUR'))return 'orange';if(b.includes('PISC'))return 'blue';if(b.includes('ADMIN'))return 'purple';if(b.includes('ATEND'))return 'teal';if(b.includes('MAN')||b.includes('OPERA'))return 'amber';if(b.includes('SEM BLOCO'))return 'gray';return 'blue'}
function qrLocalBlocks(){try{return JSON.parse(localStorage.getItem('gfQrBlocks')||'[]').filter(Boolean)}catch(e){return []}}
function qrHiddenBlocks(){try{return JSON.parse(localStorage.getItem('gfQrHiddenBlocks')||'[]').filter(Boolean).map(qrBlockLabel)}catch(e){return []}}
function qrSaveLocalBlocks(arr){
  try{
    const map=new Map();
    (arr||[]).map(qrCanonicalBlockName).filter(Boolean).forEach(b=>{if(qrBlockKey(b)!=='SEM_BLOCO_DEFINIDO') map.set(qrBlockKey(b), b)});
    localStorage.setItem('gfQrBlocks', JSON.stringify([...map.values()]));
  }catch(e){}
}
function qrSaveHiddenBlocks(arr){
  try{
    const map=new Map();
    (arr||[]).map(qrCanonicalBlockName).filter(Boolean).forEach(b=>{if(qrBlockKey(b)!=='SEM_BLOCO_DEFINIDO') map.set(qrBlockKey(b), b)});
    localStorage.setItem('gfQrHiddenBlocks', JSON.stringify([...map.values()]));
  }catch(e){}
}
function qrKnownBlocks(){
  const map=new Map();
  const add=(b)=>{
    const name=qrCanonicalBlockName(b);
    const key=qrBlockKey(name);
    if(!name || key==='SEM_BLOCO_DEFINIDO') return;
    if(!map.has(key)) map.set(key,name);
  };
  qrBaseBlocks().forEach(add);
  qrLocalBlocks().forEach(add);
  (Array.isArray(sectors)?sectors:[]).map(s=>s.qr_block).filter(Boolean).forEach(add);
  (qrLastQrs||[]).map(s=>s.qr_block).filter(Boolean).forEach(add);
  const hiddenKeys=new Set(qrHiddenBlocks().map(qrBlockKey));
  const assignedKeys=new Set((Array.isArray(sectors)?sectors:[]).concat(qrLastQrs||[]).map(s=>s.qr_block).filter(Boolean).map(qrBlockKey));
  return [...map.values()]
    .filter(b=>!hiddenKeys.has(qrBlockKey(b)) || assignedKeys.has(qrBlockKey(b)))
    .sort((a,b)=>a.localeCompare(b,'pt-BR'));
}
function qrEnsureStyle(){
  if(document.getElementById('gfQrBlocksCssV2')) return;
  const st=document.createElement('style');
  st.id='gfQrBlocksCssV2';
  st.textContent=`
    #pageQrs{background:linear-gradient(135deg,#f8fbff 0%,#eef4ff 100%);border-radius:0!important;}
    .gfQrShell{display:grid;grid-template-columns:minmax(0,1fr);gap:18px;align-items:start;}
    .gfQrMain{min-width:0;}
    .gfQrTop{display:flex;justify-content:space-between;gap:14px;align-items:flex-start;margin-bottom:16px;}
    .gfQrTitle h2{margin:0;color:#071a3d;font-size:28px;font-weight:1000;letter-spacing:-.5px}.gfQrTitle p{margin:4px 0 0;color:#60708b;font-weight:800}.gfQrTitle a,.gfQrTitle span{color:#0877e8;font-weight:1000}
    .gfQrTopActions{display:flex;gap:10px;flex-wrap:wrap;justify-content:flex-end}.gfQrBlueBtn,.gfQrWhiteBtn{height:42px;border-radius:12px;border:1px solid #d8e5f4;padding:0 16px;font-weight:1000;cursor:pointer;box-shadow:0 8px 20px rgba(5,24,68,.08)}.gfQrBlueBtn{background:linear-gradient(135deg,#0d61cf,#1687f3);color:white;border:0}.gfQrWhiteBtn{background:#fff;color:#0753b8}
    .gfQrToolbar{display:grid;grid-template-columns:minmax(220px,1fr) 260px minmax(260px,.9fr);gap:12px;background:#fff;border:1px solid #e3edf9;border-radius:18px;padding:14px;margin-bottom:18px;box-shadow:0 12px 30px rgba(9,32,74,.08)}
    .gfQrToolbar input,.gfQrToolbar select{height:46px;border:1px solid #dbe7f6;border-radius:12px;padding:0 14px;font-weight:850;color:#10244a;background:#fff;outline:none}
    .gfQrPanel{background:#fff;border:1px solid #edf2f8;border-radius:20px;padding:16px;box-shadow:0 16px 45px rgba(8,30,70,.09)}.gfQrPanelTitle{font-size:18px;font-weight:1000;color:#071a3d;margin:0 0 14px}
    .gfQrBlocks{display:flex;flex-direction:column;gap:10px}.gfQrBlock{border:1px solid #dce8f6;border-radius:14px;background:#fff;overflow:hidden;box-shadow:0 7px 18px rgba(8,30,70,.05)}.gfQrBlockHead{width:100%;border:0;background:linear-gradient(180deg,#fff,#fbfdff);padding:12px 14px;display:grid;grid-template-columns:46px minmax(0,1fr) auto auto;gap:12px;align-items:center;text-align:left;cursor:pointer}.gfQrBlockHead:hover{background:#f7fbff}.gfQrBlockIcon{width:42px;height:42px;border-radius:50%;display:grid;place-items:center;color:#fff;font-size:20px}.gfQrBlockIcon.orange{background:#ff9f1c}.gfQrBlockIcon.blue{background:#1687f3}.gfQrBlockIcon.purple{background:#9b5de5}.gfQrBlockIcon.teal{background:#10b9ad}.gfQrBlockIcon.amber{background:#f5b400}.gfQrBlockIcon.gray{background:#94a3b8}.gfQrBlockName{font-weight:1000;color:#071a3d;font-size:15px}.gfQrBlockSub{font-size:12px;color:#667895;font-weight:800;margin-top:2px}.gfQrPill{border-radius:999px;padding:6px 10px;background:#dcfce7;color:#148342;font-size:12px;font-weight:1000;white-space:nowrap}.gfQrPill.sectors{background:#fff4dd;color:#d97706}.gfQrChevron{font-size:18px;color:#0b234d;font-weight:1000}.gfQrBlockBody{border-top:1px solid #e6eef8;background:#fbfdff;padding:12px}.gfQrSectorList{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px}.gfQrSectorItem{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:10px;align-items:center;background:#fff;border:1px solid #e1eaf6;border-radius:12px;padding:10px}.gfQrSectorInfo{min-width:0}.gfQrSectorName{font-weight:1000;color:#071a3d;font-size:14px;line-height:1.15;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.gfQrSectorBlock{display:inline-flex;margin-top:4px;padding:3px 8px;border-radius:999px;background:#f1f5f9;color:#60708b;font-size:10px;font-weight:900;text-transform:capitalize;max-width:100%;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.gfQrActions{display:flex;gap:6px;align-items:center;justify-content:flex-end;flex-wrap:nowrap}.gfQrSmallBtn,.gfQrOpenBtn,.gfQrInactiveBtn{height:32px;border-radius:9px;padding:0 9px;font-size:11px;font-weight:1000;cursor:pointer;white-space:nowrap}.gfQrSmallBtn{border:1px solid #bcd7fb;background:#f4f9ff;color:#0753b8}.gfQrOpenBtn{border:0;background:#0d7ee8;color:#fff}.gfQrInactiveBtn{border:1px solid #fee2e2;background:#fff7f7;color:#dc2626}.gfQrInactiveBtn.on{border-color:#bbf7d0;background:#f0fdf4;color:#15803d}.gfQrPreviewImg{display:block;width:min(320px,82vw);height:auto;margin:10px auto 0;border:1px solid #e1eaf6;border-radius:18px;padding:14px;background:#fff}.gfQrPreviewMeta{text-align:center;color:#60708b;font-weight:900;margin-top:8px}.gfQrMore{grid-column:1/-1;color:#0d7ee8;font-weight:1000;padding:8px 0 0 44px}
    .gfQrSide{display:flex;flex-direction:column;gap:14px}.gfQrSideCard{background:#fff;border:1px solid #edf2f8;border-radius:18px;padding:16px;box-shadow:0 14px 35px rgba(8,30,70,.08)}.gfQrSideCard h3{margin:0 0 12px;color:#071a3d;font-size:16px;font-weight:1000}.gfQrSideCard p{margin:0 0 12px;color:#30415f;line-height:1.45;font-weight:700}.gfQrCheck{display:flex;gap:8px;color:#30415f;font-weight:850;font-size:13px;margin:9px 0}.gfQrCheck:before{content:'✓';width:19px;height:19px;border-radius:50%;background:#22c55e;color:white;display:grid;place-items:center;font-size:12px;font-weight:1000;flex:0 0 auto}.gfQrSideBtn{width:100%;height:40px;border:1px solid #cfe0f5;border-radius:10px;background:#fff;color:#0753b8;font-weight:1000;margin-top:8px;cursor:pointer}.gfQrSideBtn.primary{border-color:#1687f3;background:#f8fbff}.gfQrEmpty{border:1px dashed #cbd9ea;border-radius:16px;padding:24px;text-align:center;color:#64748b;font-weight:900;background:#fbfdff}
    .gfQrManageBackdrop{position:fixed;inset:0;background:rgba(7,19,43,.58);z-index:9998;display:none}.gfQrManageModal{position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);width:min(560px,calc(100vw - 28px));background:#fff;border-radius:22px;border:1px solid #dce8f6;box-shadow:0 28px 90px rgba(0,0,0,.28);z-index:9999;display:none;overflow:hidden}.gfQrManageHead{padding:18px 20px;border-bottom:1px solid #e6eef8;display:flex;justify-content:space-between;align-items:center}.gfQrManageHead h3{margin:0;color:#071a3d;font-weight:1000}.gfQrManageBody{padding:18px 20px}.gfQrManageBody input,.gfQrManageBody select{width:100%;height:44px;border:1px solid #dbe7f6;border-radius:12px;padding:0 12px;font-weight:850;background:#fff;color:#10244a}.gfQrModalGrid{display:grid;gap:10px}.gfQrModalLabel{display:block;color:#60708b;font-size:12px;font-weight:1000;margin:10px 0 5px}.gfQrModalActions{display:flex;gap:10px;margin-top:14px}.gfQrModalActions button{flex:1}.gfQrManageList{margin-top:12px;display:flex;flex-wrap:wrap;gap:8px}.gfQrManageChip{display:inline-flex;gap:8px;align-items:center;border:1px solid #dce8f6;border-radius:999px;padding:8px 12px;background:#f8fbff;font-weight:1000;color:#0b234d}.gfQrManageChip button{border:0;background:transparent;color:#ef4444;font-weight:1000;cursor:pointer}.gfQrManageClose{border:0;background:#fff;font-size:24px;cursor:pointer;color:#0b234d}
    .gfQrBlockTools{display:flex;gap:8px;flex-wrap:wrap;margin:0 0 12px}.gfQrAddBtn{height:36px;border:1px solid #bcd7fb;background:#f4f9ff;color:#0753b8;border-radius:10px;padding:0 12px;font-weight:1000;cursor:pointer}.gfQrRemoveBtn{height:32px;border:1px solid #fee2e2;background:#fff7f7;color:#dc2626;border-radius:9px;padding:0 9px;font-weight:1000;cursor:pointer}.gfQrAssignList{display:flex;flex-direction:column;gap:8px;max-height:360px;overflow:auto;margin-top:12px;padding-right:4px}.gfQrAssignItem{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:10px;align-items:center;border:1px solid #e1eaf6;border-radius:12px;padding:10px;background:#fbfdff}.gfQrAssignItem strong{display:block;color:#071a3d;font-weight:1000}.gfQrAssignItem span{display:block;color:#667895;font-size:12px;font-weight:850;margin-top:2px}
    @media(max-width:1100px){.gfQrShell{grid-template-columns:1fr}.gfQrSide{display:none}.gfQrToolbar{grid-template-columns:1fr}.gfQrSectorList{grid-template-columns:1fr}}
    @media(max-width:640px){#pageQrs{padding:10px!important}.gfQrTop{display:block}.gfQrTopActions{margin-top:10px;justify-content:stretch}.gfQrTopActions button{flex:1}.gfQrTitle h2{font-size:22px}.gfQrBlockHead{grid-template-columns:42px minmax(0,1fr) auto}.gfQrPill.sectors{display:none}.gfQrSectorItem{grid-template-columns:minmax(0,1fr);gap:8px}.gfQrActions{justify-content:stretch}.gfQrActions button{flex:1;padding:0 5px;font-size:10px}.gfQrToolbar{padding:10px}.gfQrPanel{padding:12px}}
  `;
  document.head.appendChild(st);
}
function ensureQrBlockControls(){
  qrEnsureStyle();
  let dl=document.getElementById('qrBlockOptions');
  if(!dl){dl=document.createElement('datalist');dl.id='qrBlockOptions';document.body.appendChild(dl)}
  dl.innerHTML=qrKnownBlocks().map(b=>`<option value="${escapeAttr(b)}"></option>`).join('');
}
function qrBlockSelectOptions(selected){
  const currentKey=qrBlockKey(selected||'');
  const blocks=qrKnownBlocks().filter(b=>qrBlockKey(b)!=='SEM_BLOCO_DEFINIDO');
  return `<option value="">Sem bloco definido</option>`+blocks.map(b=>`<option value="${escapeAttr(b)}" ${currentKey===qrBlockKey(b)?'selected':''}>${escapeAttr(b)}</option>`).join('');
}
function qrCleanPageShell(){
  const page=document.getElementById('pageQrs');
  let grid=document.getElementById('qrGrid');
  if(page){
    if(!grid || grid.parentElement!==page || page.children.length!==1){
      page.innerHTML='<div id="qrGrid"></div>';
      grid=document.getElementById('qrGrid');
    }
  }
  return grid || document.getElementById('qrGrid');
}
function toggleQrBlock(block){qrOpenBlocks[block]=!qrOpenBlocks[block];document.querySelectorAll(`[data-qr-block-list="${CSS.escape(block)}"]`).forEach(el=>el.classList.toggle('hidden',!qrOpenBlocks[block]));document.querySelectorAll(`[data-qr-block-arrow="${CSS.escape(block)}"]`).forEach(el=>el.textContent=qrOpenBlocks[block]?'⌃':'⌄')}
async function updateQrBlock(id){
  if(!guardAction('admin')) return;
  const sel=document.getElementById('qrBlock'+id);
  const old=(qrLastQrs||[]).find(s=>Number(s.id)===Number(id)) || (Array.isArray(sectors)?sectors:[]).find(s=>Number(s.id)===Number(id));
  if(!old||!sel) return;
  const qr_block=sel.value ? qrCanonicalBlockName(sel.value) : '';
  const j=await (await fetch(API+'/api/admin/sectors/'+id,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:old.name,slug:old.slug||old.public_slug,active:old.active!==0,qr_block})})).json();
  if(!j.ok)return alert(j.error||'Erro ao salvar bloco');
  if(qr_block){const blocks=qrLocalBlocks();blocks.push(qr_block);qrSaveLocalBlocks(blocks);qrOpenBlocks[qr_block]=true}
  await loadSectors();
  await loadQrs();
  toastMsg('Bloco do QR atualizado');
}
function qrNorm(t){return String(t||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'')}
let gfQrSearchTimer=null;
function qrSetSearch(v){
  qrLastQuery=v||'';
  clearTimeout(gfQrSearchTimer);
  gfQrSearchTimer=setTimeout(async function(){
    const pos=(document.getElementById('gfQrSearchInput')||{}).selectionStart||String(qrLastQuery||'').length;
    await loadQrs();
    const inp=document.getElementById('gfQrSearchInput');
    if(inp){ inp.focus(); try{inp.setSelectionRange(pos,pos)}catch(e){} }
  },180);
}
function qrSetFilter(v){qrLastBlockFilter=v||'ALL';loadQrs()}
function openQrBlockManager(){
  qrEnsureStyle();
  let bd=document.getElementById('gfQrManageBackdrop'), md=document.getElementById('gfQrManageModal');
  if(!bd){bd=document.createElement('div');bd.id='gfQrManageBackdrop';bd.className='gfQrManageBackdrop';bd.onclick=closeQrBlockManager;document.body.appendChild(bd)}
  if(!md){md=document.createElement('div');md.id='gfQrManageModal';md.className='gfQrManageModal';document.body.appendChild(md)}
  md.innerHTML=`<div class="gfQrManageHead"><h3>Gerenciar blocos</h3><button class="gfQrManageClose" onclick="closeQrBlockManager()">×</button></div><div class="gfQrManageBody"><p style="margin-top:0;color:#60708b;font-weight:800">Crie nomes de blocos para usar nos QR já gerados. Depois é só selecionar o bloco no setor e salvar.</p><input id="gfQrNewBlockName" list="qrBlockOptions" placeholder="Nome do bloco. Ex: PISCINAS, RESTAURANTE, ADMINISTRATIVO"><button class="gfQrBlueBtn" style="margin-top:10px;width:100%" onclick="saveQrNewBlock()">+ Criar novo bloco</button><div class="gfQrManageList">${qrKnownBlocks().map(b=>`<span class="gfQrManageChip">${qrBlockIcon(b)} ${escapeAttr(b)} <button onclick="removeQrBlock('${escapeAttr(b)}')">×</button></span>`).join('')}</div></div>`;
  bd.style.display='block';md.style.display='block';
}
function closeQrBlockManager(){const bd=document.getElementById('gfQrManageBackdrop'),md=document.getElementById('gfQrManageModal');if(bd)bd.style.display='none';if(md)md.style.display='none'}
function saveQrNewBlock(){
  const inp=document.getElementById('gfQrNewBlockName');
  const name=qrCanonicalBlockName(inp&&inp.value);
  if(!name||name==='SEM BLOCO DEFINIDO')return toastMsg('Digite o nome do bloco');
  const blocks=qrLocalBlocks();blocks.push(name);qrSaveLocalBlocks(blocks);
  qrSaveHiddenBlocks(qrHiddenBlocks().filter(b=>!qrSameBlock(b,name)));
  ensureQrBlockControls();openQrBlockManager();loadQrs();toastMsg('Bloco criado')
}
async function removeQrBlock(name){
  if(!guardAction('admin')) return;
  const block=qrCanonicalBlockName(name);
  const blockKey=qrBlockKey(block);
  if(!block || blockKey==='SEM_BLOCO_DEFINIDO') return toastMsg('Esse bloco não pode ser removido');
  const linked=(qrLastQrs||[]).filter(q=>qrSameBlock(q.qr_block,block));
  const msg=linked.length
    ? `Remover o bloco "${block}"?\n\n${linked.length} setor(es) vão ficar sem bloco e poderão ser adicionados em outro bloco depois.`
    : `Remover o bloco "${block}"?`;
  if(!confirm(msg)) return;
  for(const q of linked){
    const old=(Array.isArray(sectors)?sectors:[]).find(s=>Number(s.id)===Number(q.id)) || q;
    await fetch(API+'/api/admin/sectors/'+q.id,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:old.name,slug:old.slug||old.public_slug,active:old.active!==0,qr_block:''})});
  }
  qrSaveLocalBlocks(qrLocalBlocks().filter(b=>!qrSameBlock(b,block)));
  const hidden=qrHiddenBlocks().filter(b=>!qrSameBlock(b,block)); hidden.push(block); qrSaveHiddenBlocks(hidden);
  Object.keys(qrOpenBlocks).forEach(k=>{if(qrSameBlock(k,block)) delete qrOpenBlocks[k]});
  closeQrBlockManager();
  await loadSectors();
  await loadQrs();
  toastMsg('Bloco removido')
}
function qrBlockIsEmptyName(v){return !String(v||'').trim() || qrBlockKey(v)==='SEM_BLOCO_DEFINIDO'}
function qrAvailableForBlock(){return (qrLastQrs||[]).filter(q=>qrBlockIsEmptyName(q.qr_block))}
function qrBlockBodyTools(block){return `<div class="gfQrBlockTools adminOnly"><button class="gfQrAddBtn" onclick="event.stopPropagation();openQrAddSectorModal('${escapeAttr(block)}')">+ Adicionar setor neste bloco</button></div>`}
async function setQrSectorBlock(id, block){
  if(!guardAction('admin')) return;
  const old=(qrLastQrs||[]).find(s=>Number(s.id)===Number(id)) || (Array.isArray(sectors)?sectors:[]).find(s=>Number(s.id)===Number(id));
  if(!old) return toastMsg('Setor não encontrado');
  const qr_block=block ? qrCanonicalBlockName(block) : '';
  const j=await (await fetch(API+'/api/admin/sectors/'+id,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:old.name,slug:old.slug||old.public_slug,active:old.active!==0,qr_block})})).json();
  if(!j.ok) return alert(j.error||'Erro ao atualizar bloco');
  if(qr_block){const blocks=qrLocalBlocks();blocks.push(qr_block);qrSaveLocalBlocks(blocks);qrOpenBlocks[qr_block]=true;}
  await loadSectors();
  await loadQrs();
  toastMsg(qr_block?'Setor adicionado ao bloco':'Setor removido do bloco');
}

function openQrCreateModal(){
  if(!guardAction('admin')) return;
  qrEnsureStyle();
  let bd=document.getElementById('gfQrManageBackdrop'), md=document.getElementById('gfQrManageModal');
  if(!bd){bd=document.createElement('div');bd.id='gfQrManageBackdrop';bd.className='gfQrManageBackdrop';bd.onclick=closeQrBlockManager;document.body.appendChild(bd)}
  if(!md){md=document.createElement('div');md.id='gfQrManageModal';md.className='gfQrManageModal';document.body.appendChild(md)}
  md.innerHTML=`<div class="gfQrManageHead"><h3>Criar novo QR</h3><button class="gfQrManageClose" onclick="closeQrBlockManager()">×</button></div><div class="gfQrManageBody"><p style="margin-top:0;color:#60708b;font-weight:800">Crie um novo local/setor. O QR aparece automaticamente dentro do bloco escolhido.</p><div class="gfQrModalGrid"><label><span class="gfQrModalLabel">Nome do local/setor</span><input id="gfQrCreateName" placeholder="Ex: Piscina Adulto"></label><label><span class="gfQrModalLabel">Slug opcional</span><input id="gfQrCreateSlug" placeholder="Ex: piscina-adulto"></label><label><span class="gfQrModalLabel">Bloco</span><select id="gfQrCreateBlock">${qrBlockSelectOptions('')}</select></label></div><div class="gfQrModalActions"><button class="gfQrWhiteBtn" onclick="closeQrBlockManager()">Cancelar</button><button class="gfQrBlueBtn" onclick="saveQrCreateModal()">Salvar e gerar QR</button></div></div>`;
  bd.style.display='block';md.style.display='block';
  setTimeout(()=>document.getElementById('gfQrCreateName')?.focus(),50);
}
async function saveQrCreateModal(){
  if(!guardAction('admin')) return;
  const name=(document.getElementById('gfQrCreateName')?.value||'').trim();
  const slug=(document.getElementById('gfQrCreateSlug')?.value||'').trim();
  const rawBlock=(document.getElementById('gfQrCreateBlock')?.value||'').trim();
  const qr_block=rawBlock ? qrCanonicalBlockName(rawBlock) : '';
  if(!name) return alert('Informe o local/setor.');
  const r=await fetch(API+'/api/admin/sectors',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name,slug,qr_block})});
  const j=await r.json();
  if(!j.ok) return alert(j.error || 'Erro ao criar setor');
  if(qr_block && qrBlockKey(qr_block)!=='SEM_BLOCO_DEFINIDO'){const blocks=qrLocalBlocks();blocks.push(qr_block);qrSaveLocalBlocks(blocks);qrOpenBlocks[qrCanonicalBlockName(qr_block)]=true;}
  closeQrBlockManager();
  await loadSectors();
  await loadQrs();
  const finalSlug=(j.sector&&j.sector.slug)||slug||slugifyLocal(name);
  toastMsg('Setor criado e QR gerado');
  setTimeout(()=>copyQr(finalSlug),300);
}
function openQrAddSectorModal(block){
  qrEnsureStyle();
  let bd=document.getElementById('gfQrManageBackdrop'), md=document.getElementById('gfQrManageModal');
  if(!bd){bd=document.createElement('div');bd.id='gfQrManageBackdrop';bd.className='gfQrManageBackdrop';bd.onclick=closeQrBlockManager;document.body.appendChild(bd)}
  if(!md){md=document.createElement('div');md.id='gfQrManageModal';md.className='gfQrManageModal';document.body.appendChild(md)}
  const list=qrAvailableForBlock();
  md.innerHTML=`<div class="gfQrManageHead"><h3>Adicionar setor em ${escapeAttr(block)}</h3><button class="gfQrManageClose" onclick="closeQrBlockManager()">×</button></div><div class="gfQrManageBody"><p style="margin-top:0;color:#60708b;font-weight:800">Aparecem aqui somente setores que ainda não estão em nenhum bloco, para não bagunçar a organização.</p><input id="gfQrAssignSearch" placeholder="Buscar setor disponível..." oninput="renderQrAssignList('${escapeAttr(block)}',this.value)"><div id="gfQrAssignList" class="gfQrAssignList"></div></div>`;
  bd.style.display='block';md.style.display='block';
  renderQrAssignList(block,'');
}
function renderQrAssignList(block, term){
  const el=document.getElementById('gfQrAssignList'); if(!el) return;
  const q=qrNorm(term||'');
  const list=qrAvailableForBlock().filter(s=>!q || qrNorm([s.name,s.slug].join(' ')).includes(q));
  el.innerHTML=list.length?list.map(s=>`<div class="gfQrAssignItem"><div><strong>${escapeAttr(s.name)}</strong><span>QR: /s/${escapeAttr(s.public_slug||s.slug||'')}</span></div><button class="gfQrAddBtn" onclick="setQrSectorBlock(${Number(s.id)},'${escapeAttr(block)}');closeQrBlockManager()">Adicionar</button></div>`).join(''):`<div class="gfQrEmpty">Nenhum setor disponível sem bloco.</div>`;
}
function qrFirstSectorText(rows){return rows.slice(0,2).map(r=>r.name).join(', ') || 'Setores que ainda não foram atribuídos a este bloco'}
function qrRenderSectorItem(q){
  const url=q.url||qrUrl(q.public_slug||q.slug);
  const img=qrImg(url);
  const displayBlock=qrCanonicalBlockName(q.qr_block);
  const active=q.active!==0 && q.active!==false;
  return `<div class="gfQrSectorItem ${active?'':'gfInactiveCard'}"><div class="gfQrSectorInfo"><div class="gfQrSectorName">${escapeAttr(q.name)}</div><div class="gfQrSectorBlock">${escapeAttr(displayBlock)}</div></div><div class="gfQrActions"><button type="button" class="gfQrSmallBtn" onclick="event.stopPropagation();qrVisualizar(${Number(q.id)})">Visualizar QR</button><button type="button" class="gfQrOpenBtn" onclick="event.stopPropagation();window.open('${url}','_blank')">Abrir chamado</button><button type="button" class="gfQrInactiveBtn ${active?'':'on'} adminOnly" onclick="event.stopPropagation();toggleQrSectorActive(${Number(q.id)},${active?0:1})">${active?'Inativar':'Ativar'}</button></div></div>`
}

function qrFindSector(id){
  id=Number(id);
  return (qrLastQrs||[]).find(q=>Number(q.id)===id) || (Array.isArray(sectors)?sectors:[]).find(q=>Number(q.id)===id) || null;
}
function qrVisualizar(id){
  const q=qrFindSector(id);
  if(!q) return alert('QR não encontrado.');
  const url=q.url||qrUrl(q.public_slug||q.slug);
  const img=qrImg(url);
  const bd=document.getElementById('gfQrManageBackdrop')||document.createElement('div');
  if(!bd.id){bd.id='gfQrManageBackdrop';bd.className='gfQrManageBackdrop';document.body.appendChild(bd)}
  let md=document.getElementById('gfQrManageModal');
  if(!md){md=document.createElement('div');md.id='gfQrManageModal';md.className='gfQrManageModal';document.body.appendChild(md)}
  md.innerHTML=`<div class="gfQrManageHead"><h3>${escapeAttr(q.name||'QR Code')}</h3><button class="gfQrManageClose" onclick="closeQrBlockManager()">×</button></div><div class="gfQrManageBody"><img class="gfQrPreviewImg" src="${img}" alt="QR ${escapeAttr(q.name||'')}"><div class="gfQrPreviewMeta">${escapeAttr(qrCanonicalBlockName(q.qr_block))}</div><div class="gfQrModalActions"><button class="gfQrWhiteBtn" onclick="window.open('${img}','_blank')">Abrir imagem</button><button class="gfQrBlueBtn" onclick="window.open('${url}','_blank')">Abrir chamado</button></div></div>`;
  bd.style.display='block'; md.style.display='block';
}
async function toggleQrSectorActive(id, active){
  if(!guardAction('admin')) return;
  const q=qrFindSector(id);
  if(!q) return alert('Setor não encontrado.');
  if(!active && !confirm('Inativar este QR/local? Ele deixa de aparecer para novas aberturas.')) return;
  const payload={name:q.name,slug:q.slug||q.public_slug,active:!!active,qr_block:q.qr_block||''};
  const j=await (await fetch(API+'/api/admin/sectors/'+id,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)})).json();
  if(!j.ok) return alert(j.error||'Erro ao atualizar QR');
  const idx=(qrLastQrs||[]).findIndex(x=>Number(x.id)===Number(id));
  if(idx>=0) qrLastQrs[idx].active=active?1:0;
  toastMsg(active?'QR ativado':'QR inativado');
  loadQrs();
}

function qrTicketCountFromPayload(j){
  const candidates=[j&&j.ticket_stats,j&&j.ticketStats,j&&j.stats,j&&j.summary].filter(Boolean);
  for(const obj of candidates){
    for(const key of ['total','tickets_total','ticket_total','chamados_total','chamados_via_qr','qr_tickets_total']){
      const n=Number(obj[key]);
      if(Number.isFinite(n)) return n;
    }
  }
  return null;
}
async function qrResolveCalledCount(j){
  const direct=qrTicketCountFromPayload(j);
  if(direct!==null) return direct;
  try{
    const r=await fetch(API+'/api/admin/tickets?light=1',{cache:'no-store',credentials:'include'});
    if(!r.ok) return 0;
    const data=await r.json();
    const list=Array.isArray(data.tickets)?data.tickets:[];
    return new Set(list.map(t=>String(t.id||t.ticket_number||'')).filter(Boolean)).size;
  }catch(_){
    return 0;
  }
}
async function loadQrs(){
  const gridEl=qrCleanPageShell();
  if(!gridEl) return;
  const j=await (await fetch(API+'/api/admin/qrcodes',{cache:'no-store',credentials:'include'})).json();
  const qrs=j.qrs||[];
  qrLastQrs=qrs;
  if(document.getElementById('fixedQrDomain')) fixedQrDomain.innerText=FIXED_QR_BASE;
  ensureQrBlockControls();
  const query=qrNorm(qrLastQuery||'');
  const filter=qrLastBlockFilter||'ALL';
  const allGroups={};
  qrs.forEach(q=>{
    const b=qrCanonicalBlockName(q.qr_block);
    if(!allGroups[b]) allGroups[b]=[];
    allGroups[b].push({...q, qr_block:b});
  });
  qrKnownBlocks().forEach(b=>{const name=qrCanonicalBlockName(b); if(!allGroups[name]) allGroups[name]=[]});
  let blocks=Object.keys(allGroups).sort((a,b)=>a.localeCompare(b,'pt-BR'));
  if(filter!=='ALL') blocks=blocks.filter(b=>qrSameBlock(b,filter));
  if(query) blocks=blocks.filter(b=>qrNorm(b).includes(query) || allGroups[b].some(q=>qrNorm([q.name,q.slug,q.qr_block,q.url].join(' ')).includes(query)));
  const localKeys=new Set(qrLocalBlocks().map(qrBlockKey));
  gridEl.innerHTML=`
    <div class="gfQrShell" style="grid-column:1/-1">
      <main class="gfQrMain">
        <div class="gfQrTop gfQrTopWithBack"><div class="gfQrTitle"><h2>📱 QR Codes</h2><p>Organize blocos e setores para geração dos QR Codes.</p></div><div class="gfQrTopActions">
  <button class="gfQrWhiteBtn" onclick="showPage('cadastros')" type="button">← Voltar</button>
  <button class="gfQrWhiteBtn adminOnly" onclick="openQrBlockManager()">+ Criar bloco</button>
  <button class="gfQrBlueBtn adminOnly" onclick="openQrCreateModal()">+ Criar QR</button>
  <button class="gfQrWhiteBtn" onclick="qrSetFilter('ALL');qrSetSearch('')">Limpar filtros</button>
</div></div>
        <div class="gfQrToolbar"><input id="gfQrSearchInput" value="${escapeAttr(qrLastQuery)}" oninput="qrSetSearch(this.value)" placeholder="🔎 Buscar bloco ou setor..."><select onchange="qrSetFilter(this.value)"><option value="ALL">Todos os blocos</option>${qrKnownBlocks().map(b=>`<option value="${escapeAttr(b)}" ${filter!=='ALL'&&qrSameBlock(filter,b)?'selected':''}>${escapeAttr(b)}</option>`).join('')}</select></div>
        <section class="gfQrPanel"><h3 class="gfQrPanelTitle">Blocos de Setores</h3><div class="gfQrBlocks">${blocks.length?blocks.map(block=>{const rows=allGroups[block]||[];const open=qrOpenBlocks[block]===true;const tone=qrBlockTone(block);const visibleRows=query?rows.filter(q=>qrNorm([q.name,q.slug,q.qr_block,q.url,block].join(' ')).includes(query)||qrNorm(block).includes(query)):rows;return `<div class="gfQrBlock"><button class="gfQrBlockHead" onclick="toggleQrBlock('${escapeAttr(block)}')"><div class="gfQrBlockIcon ${tone}">${qrBlockIcon(block)}</div><div><div class="gfQrBlockName">${escapeAttr(block)}</div><div class="gfQrBlockSub">${escapeAttr(qrFirstSectorText(rows))}</div></div><span class="gfQrPill sectors">${rows.length} setor${rows.length!==1?'es':''}</span><span class="gfQrPill">${rows.length} QR Code${rows.length!==1?'s':''}</span><span class="gfQrChevron" data-qr-block-arrow="${escapeAttr(block)}">${open?'⌃':'⌄'}</span></button><div class="gfQrBlockBody ${open?'':'hidden'}" data-qr-block-list="${escapeAttr(block)}">${qrBlockBodyTools(block)}<div class="gfQrSectorList">${visibleRows.length?visibleRows.map(qrRenderSectorItem).join(''):'<div class="gfQrEmpty">Nenhum setor neste bloco ainda. Clique em adicionar setor para escolher entre os setores disponíveis sem bloco.</div>'}</div></div></div>`}).join(''):'<div class="gfQrEmpty">Nenhum bloco encontrado na busca.</div>'}</div></section>
      </main>
    </div>`;
}
let cadLimit = { sectors: 999999, assets: 999999, issues: 999999 };
const FIXED_QR_BASE = ''.replace(/\/$/, '');
function defaultPublicBase(){ return FIXED_QR_BASE; }
function qrUrl(slug){ return FIXED_QR_BASE + '/s/' + slug; }
function qrImg(url){ return 'https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=' + encodeURIComponent(url); }

window.copyText = window.copyText || async function(text){
  const value = String(text || '').trim();
  if(!value){
    alert('Link não encontrado para copiar.');
    return false;
  }
  try{
    if(navigator.clipboard && window.isSecureContext){
      await navigator.clipboard.writeText(value);
      alert('Link copiado!');
      return true;
    }
  }catch(e){
    console.warn('Clipboard API falhou, usando fallback:', e);
  }
  try{
    const ta = document.createElement('textarea');
    ta.value = value;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.left = '-9999px';
    ta.style.top = '0';
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    if(ok){
      alert('Link copiado!');
      return true;
    }
  }catch(e){
    console.warn('Fallback de cópia falhou:', e);
  }
  prompt('Não consegui copiar automaticamente. Copie o link abaixo:', value);
  return false;
};

function copyQr(slug){ window.copyText(qrUrl(slug)); }
function moreRows(type){ cadLimit[type] = (cadLimit[type] || 8) + 8; if(type==='sectors') renderSectors(); if(type==='assets') renderAssets(); if(type==='issues'){ cadLimit.issues = 999999; renderIssues(); } }
function createSectorFromQr(){
  return openQrCreateModal();
}

function slugifyLocal(text){return String(text||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'')}
function statusText(v){return v==='DONE'?'Resolvido':v==='IN_PROGRESS'?'Em andamento':v==='NEW'?'Novo':(v||'-')}
function auditLabel(a){return {SECTOR_CREATED:'Setor criado',SECTOR_UPDATED:'Setor atualizado',ASSET_CREATED:'Equipamento cadastrado',ASSET_UPDATED:'Equipamento atualizado',ASSET_TRANSFERRED:'Equipamento transferido',ISSUE_CREATED:'Problema criado',ISSUE_UPDATED:'Problema atualizado'}[a]||a}
function closeHistoryDrawer(){historyDrawer.classList.remove('show');drawerBg.classList.remove('show')}
function openTicketFromHistory(id){
  const key = coerceTicketKey ? coerceTicketKey(id) : Number(id);
  if(!key){ alert('ID do chamado inválido.'); return; }
  if(window.historyDrawer) historyDrawer.classList.remove('show');
  return (window.gfOpenTicketByDbId||window.openDrawer)(key);
}
function renderHistoryTicketItem(t,i){
  const isSP=isSPTicketAsset(t);
  const patrPart=isSP ? spMetaText(t) : (t.patrimonio ? 'Patrimônio '+plainPatrimonio(t.patrimonio) : '');
  const meta=[fmtBR(t.created_at), t.asset_name||'-', patrPart, t.assigned_to_name||''].filter(Boolean).map(escHTML).join(' • ');
  return `<div class="trackItem trackTicketClickable ${t.status==='DONE'?'done':t.status==='IN_PROGRESS'?'warn':'system'} ${i===0?'active':''}" data-ticket-id="${t.id}" title="Clique para abrir o chamado"><div class="trackRail"><div class="trackIcon">${t.status==='DONE'?'✅':t.status==='IN_PROGRESS'?'🛠️':'📦'}</div></div><div class="trackContent"><div class="trackTitle">#${t.ticket_number||t.id} • ${escHTML(t.issue_name||'Problema')}</div><div class="trackText">${escHTML(t.description||'Sem descrição.')}</div>${spHistoryChips(t)}<div class="trackMeta">${meta}</div><div class="historyActions" style="margin-top:10px"><button class="btn btnLight" type="button" onclick="event.stopPropagation();openTicketFromHistory(${t.id})">Abrir chamado</button></div><span class="trackBadge">${statusText(t.status)}</span></div></div>`;
}
function renderHistoryPayload(title,data){
  if(window.historyDrawer) historyDrawer.classList.remove('historyDrawerEquipmentsMode');
  if(window.hTickets) hTickets.parentElement.querySelector('h3').innerText='Problemas dos últimos 30 dias';
  if(window.hAudits) hAudits.parentElement.style.display='';
  const tickets=data.tickets||[], audits=data.audits||[];
  const open=tickets.filter(t=>t.status!=='DONE').length, done=tickets.filter(t=>t.status==='DONE').length;
  hTitle.innerText=title;
  hSummary.innerHTML=`<div class="historyCard"><b>Chamados 30 dias</b><span>${tickets.length}</span></div><div class="historyCard"><b>Resolvidos</b><span>${done}</span></div><div class="historyCard"><b>Em aberto</b><span>${open}</span></div><div class="historyCard"><b>Alterações</b><span>${audits.length}</span></div>`;
  hTickets.innerHTML=tickets.length?`<div class="timeline trackingTimeline"><div class="trackingGuide"><b>Problemas dos últimos 30 dias</b><br>Lista organizada por data, igual rastreio.</div>${tickets.map((t,i)=>renderHistoryTicketItem(t,i)).join('')}</div>`:'<div class="desc">Nenhum problema registrado nos últimos 30 dias.</div>';
  hAudits.innerHTML=audits.length?`<div class="timeline trackingTimeline"><div class="trackingGuide"><b>Alterações e transferências</b><br>Tudo que mudou aparece aqui em ordem simples.</div>${audits.map((a,i)=>`<div class="trackItem system ${i===0?'active':''}"><div class="trackRail"><div class="trackIcon">⚙️</div></div><div class="trackContent"><div class="trackTitle">${escHTML(auditLabel(a.action))}</div>${a.notes?`<div class="trackText">${escHTML(a.notes)}</div>`:''}<div class="trackMeta">${fmtBR(a.created_at)}${a.user_name?' • '+escHTML(a.user_name):''}</div></div></div>`).join('')}</div>`:'<div class="desc">Nenhuma alteração registrada ainda.</div>';
  drawerBg.classList.add('show');historyDrawer.classList.add('show');
}
let gfSectorAssetRows = [];
let gfSectorAssetContext = null;
function gfStatusAssetLabel(v){
  const s=String(v||'ACTIVE').toUpperCase();
  if(s==='ACTIVE') return 'Ativo';
  if(s==='SWAP') return 'Aguardando troca';
  if(s==='NO_REPAIR') return 'Sem reparo';
  if(s==='WRITTEN_OFF') return 'Baixado';
  if(s==='INACTIVE') return 'Inativo';
  return s || '-';
}
function gfAssetMatchesFilter(a, q, statusFilter){
  const status=String(a.status||'ACTIVE').toUpperCase();
  if(statusFilter && statusFilter!=='ALL'){
    if(statusFilter==='OFF'){
      if(!['NO_REPAIR','WRITTEN_OFF','INACTIVE'].includes(status)) return false;
    }else if(status!==statusFilter){
      return false;
    }
  }
  const hay=[a.name,a.brand,a.model,a.patrimonio,a.sp_identificacao,a.sp_responsavel,a.sp_local,a.sp_obs,a.sector_name,a.origin_sector_name,gfStatusAssetLabel(status)]
    .map(x=>String(x||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase())
    .join(' ');
  const needle=String(q||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
  return !needle || hay.includes(needle);
}
function gfRenderSectorAssetList(){
  const rows=Array.isArray(gfSectorAssetRows)?gfSectorAssetRows:[];
  const sector=gfSectorAssetContext||{};
  const q=String(document.getElementById('sectorAssetSearch')?.value||'');
  const st=String(document.getElementById('sectorAssetStatus')?.value||'ALL');
  const filtered=rows.filter(a=>gfAssetMatchesFilter(a,q,st));
  const countEl=document.getElementById('sectorAssetCountInfo');
  if(countEl) countEl.innerText=`Mostrando ${filtered.length} de ${rows.length} equipamentos`;
  const listEl=document.getElementById('sectorAssetList');
  if(!listEl) return;
  listEl.innerHTML = filtered.length ? filtered.map(a=>{
    const status=String(a.status||'ACTIVE').toUpperCase();
    const badge=assetStatusBadge(status);
    const model=[a.brand,a.model].filter(Boolean).join(' ') || '-';
    const ticketId=a.latest_ticket_id||'';
    const ticketNum=a.latest_ticket_number||ticketId;
    const patr=plainPatrimonio(a);
    const resp=String(a.sp_responsavel||'').trim();
    const ident=String(a.sp_identificacao||'').trim();
    const isSP=isSemPatrimonioCode(a.patrimonio);
    return `<div class="historyItem gfAssetCard gfAssetCardApp" style="cursor:default"><div class="gfAssetAppTop"><div class="gfAssetAppIcon">▣</div><div class="gfAssetAppInfo"><div class="gfAssetAppName">${escHTML(ident || a.name || 'Equipamento')}</div>
          ${resp ? `<div class="gfAssetAppPerson">👤 ${escHTML(resp)}</div>` : ''}
          <div class="gfAssetAppTags"><span class="gfAssetAppTag ${isSP ? 'sp' : ''}">${isSP ? escHTML(patr) : 'Patrimônio '+escHTML(patr)}</span>
            ${model && model !== '-' ? `<span class="gfAssetAppTag">${escHTML(model)}</span>` : ''}
            <span class="gfAssetAppStatus">${escHTML(gfStatusAssetLabel(status))}</span></div></div><div class="gfAssetAppBadge">${badge}</div></div>
      ${a.latest_ticket_solution?`<div class="trackText" style="margin-top:8px">Última solução: ${escHTML(a.latest_ticket_solution)}</div>`:''}
      <div class="historyActions" style="margin-top:10px"><button class="btn btnLight" type="button" onclick="openAssetHistory(${Number(a.id)||0})">Histórico do equipamento</button>
        ${ticketId?`<button class="btn btnDark" type="button" onclick="openTicketFromHistory(${Number(ticketId)||0})">Abrir chamado #${escHTML(ticketNum)}</button>`:''}
      </div></div>`;
  }).join('') : '<div class="desc">Nenhum equipamento encontrado com esse filtro.</div>';
}
async function openSectorAssetsDrawer(id){
  try{
    const sector = sectors.find(s=>Number(s.id)===Number(id)) || {id, name:'Setor'};
    let rows = (Array.isArray(assets)?assets:[]).filter(a=>Number(a.sector_id)===Number(id) || Number(a.last_sector_id)===Number(id));
    if(!rows.length){
      const r = await fetch(API+'/api/admin/assets?sector_id='+encodeURIComponent(id));
      const j = await r.json().catch(()=>({}));
      if(j && j.ok && Array.isArray(j.assets)) rows = j.assets;
    }
    gfSectorAssetRows = rows;
    gfSectorAssetContext = sector;
    const active = rows.filter(a=>String(a.status||'ACTIVE').toUpperCase()==='ACTIVE').length;
    const swap = rows.filter(a=>String(a.status||'').toUpperCase()==='SWAP').length;
    const off = rows.filter(a=>['NO_REPAIR','WRITTEN_OFF','INACTIVE'].includes(String(a.status||'').toUpperCase())).length;
    if(window.historyDrawer) historyDrawer.classList.add('historyDrawerEquipmentsMode');
    hTitle.innerText='Equipamentos: '+(sector.name||('Setor '+id));
    if(window.hTickets) hTickets.parentElement.querySelector('h3').innerText='Itens cadastrados neste setor';
    if(window.hAudits) hAudits.parentElement.style.display='none';
    hSummary.innerHTML=`<div class="historyCard"><b>Total</b><span>${rows.length}</span></div><div class="historyCard"><b>Ativos</b><span>${active}</span></div><div class="historyCard"><b>Aguardando troca</b><span>${swap}</span></div><div class="historyCard"><b>Fora/baixados</b><span>${off}</span></div>`;
    hTickets.innerHTML = `
      <div class="gfAssetFilterBox" style="background:#f8fbff;border:1px solid #dfe8f3;border-radius:18px;padding:12px;margin-bottom:12px;display:grid;grid-template-columns:1fr 180px;gap:10px;align-items:center"><input id="sectorAssetSearch" type="text" placeholder="Buscar equipamento, marca, modelo ou patrimônio" oninput="gfRenderSectorAssetList()" style="height:44px;border-radius:14px;padding:0 12px;width:100%"><select id="sectorAssetStatus" onchange="gfRenderSectorAssetList()" style="height:44px;border-radius:14px;padding:0 12px;width:100%"><option value="ALL">Todos status</option><option value="ACTIVE">Ativos</option><option value="SWAP">Aguardando troca</option><option value="OFF">Fora/baixados</option></select><div id="sectorAssetCountInfo" style="grid-column:1/-1;color:#667394;font-size:13px;font-weight:900">Mostrando ${rows.length} de ${rows.length} equipamentos</div></div><div id="sectorAssetList"></div>`;
    hAudits.innerHTML='';
    if(hTickets && hTickets.parentElement){ hTickets.parentElement.style.display='block'; }
    if(hAudits && hAudits.parentElement){ hAudits.parentElement.style.display='none'; }
    drawerBg.classList.add('show');
    historyDrawer.classList.add('show');
    setTimeout(gfRenderSectorAssetList, 0);
  }catch(err){
    console.error('Erro ao abrir equipamentos do setor:', err);
    alert('Não foi possível abrir os equipamentos deste setor. Veja o terminal/console.');
  }
}
async function openSectorHistory(id){const j=await (await fetch(API+'/api/admin/sectors/'+id+'/history')).json();if(!j.ok)return alert(j.error||'Erro');renderHistoryPayload('Setor: '+j.sector.name,j)}
async function openAssetHistory(id){const j=await (await fetch(API+'/api/admin/assets/'+id+'/history')).json();if(!j.ok)return alert(j.error||'Erro');renderHistoryPayload('Patrimônio '+(j.asset.patrimonio||id),j)}
let dashboardRangeMode='OPEN_NOW';
let dashboardStartKey='';
let dashboardEndKey='';
let dashboardOpenTickets=[];
let dashboardAllTickets=[];
let v132CriticalLimit=4;
let v132LatestLimit=4;
let v133ChartLimits={days:4,sectors:4,assets:4,avg:4};
function v133ResetDashboardLimits(){
  v132CriticalLimit=4;
  v132LatestLimit=4;
  v133ChartLimits={days:4,sectors:4,assets:4,avg:4};
}
function dateKeyAdd(key, days){
  const [y,m,d]=String(key).split('-').map(Number);
  const dt=new Date(Date.UTC(y,m-1,d,12,0,0));
  dt.setUTCDate(dt.getUTCDate()+Number(days||0));
  return dt.toISOString().slice(0,10);
}
function setDashboardRange(mode){
  dashboardRangeMode=String(mode||'OPEN_NOW');
  const today=nowDayKeyBR();
  if(dashboardRangeMode==='OPEN_NOW'){
    dashboardStartKey=today; dashboardEndKey=today;
  }else if(dashboardRangeMode==='ALL'){
    dashboardStartKey=''; dashboardEndKey='';
  }else if(dashboardRangeMode==='TODAY'){
    dashboardStartKey=today; dashboardEndKey=today;
  }else{
    const days=Number(dashboardRangeMode||7);
    dashboardStartKey=dateKeyAdd(today,-Math.max(days-1,0));
    dashboardEndKey=today;
  }
  if(window.dashStartDate) dashStartDate.value=dashboardStartKey;
  if(window.dashEndDate) dashEndDate.value=dashboardEndKey;
  v133ResetDashboardLimits();
  updateDashboardRangeButtons();
  loadDashboardV8();
}
function applyDashboardCustomRange(){
  const s=String(window.dashStartDate?.value||'').trim();
  const e=String(window.dashEndDate?.value||'').trim();
  if(!s || !e){alert('Informe a data inicial e final.');return;}
  if(s>e){alert('A data inicial não pode ser maior que a data final.');return;}
  dashboardRangeMode='CUSTOM'; dashboardStartKey=s; dashboardEndKey=e;
  v133ResetDashboardLimits();
  updateDashboardRangeButtons();
  loadDashboardV8();
}
function dashboardRangeTitle(){
  if(dashboardRangeMode==='OPEN_NOW') return 'Chamados em aberto';
  if(dashboardRangeMode==='TODAY') return 'Hoje';
  if(dashboardRangeMode==='7') return 'Últimos 7 dias';
  if(dashboardRangeMode==='15') return 'Últimos 15 dias';
  if(dashboardRangeMode==='30') return 'Últimos 30 dias';
  if(dashboardRangeMode==='ALL') return 'Todos os chamados';
  return 'Período selecionado';
}
function updateDashboardRangeButtons(){
  document.querySelectorAll('[data-dash-range]').forEach(btn=>{
    btn.classList.toggle('active', btn.dataset.dashRange===dashboardRangeMode);
  });
  if(window.dashRangeInfo){
    if(dashboardRangeMode==='OPEN_NOW') dashRangeInfo.innerText='Visão: chamados em aberto agora';
    else if(dashboardRangeMode==='ALL') dashRangeInfo.innerText='Período: todos os chamados';
    else if(dashboardStartKey===dashboardEndKey) dashRangeInfo.innerText='Período: '+dashboardStartKey.split('-').reverse().join('/');
    else dashRangeInfo.innerText='Período: '+dashboardStartKey.split('-').reverse().join('/')+' até '+dashboardEndKey.split('-').reverse().join('/');
  }
}

function dashStatus(t){
  return String((t&&t.status)||'NEW').toUpperCase();
}
function dashIsResolved(t){
  const st=dashStatus(t);
  return st==='DONE' || st==='RESOLVIDO' || st==='RESOLVIDA' || st==='FECHADO' || st==='FECHADA' || st==='CLOSED';
}
function dashIsOpen(t){
  return !dashIsResolved(t);
}
function dashResolvedKey(t){
  if(!dashIsResolved(t)) return '';
  return dayKeyBR((t&&t.resolved_at) || (t&&t.updated_at));
}
function dashKeyInside(key){
  if(!key) return false;
  if(dashboardRangeMode==='ALL') return true;
  if(dashboardStartKey && key<dashboardStartKey) return false;
  if(dashboardEndKey && key>dashboardEndKey) return false;
  return true;
}
function dashboardTicketsResolvedInPeriod(){
  const list=(Array.isArray(dashboardAllTickets)&&dashboardAllTickets.length)?dashboardAllTickets:(Array.isArray(tickets)?tickets:[]);
  return list.filter(t=>dashIsResolved(t) && dashKeyInside(dashResolvedKey(t)));
}

function dashboardTicketInSelectedPeriod(t){
  if(dashboardRangeMode==='ALL') return true;
  const createdKey = dayKeyBR(t.created_at);
  const resolvedKey = dashResolvedKey(t);
  return dashKeyInside(createdKey) || dashKeyInside(resolvedKey);
}
function dashboardTicketsByDateRange(){
  const list=(Array.isArray(dashboardAllTickets)&&dashboardAllTickets.length)?dashboardAllTickets:(Array.isArray(tickets)?tickets:[]);
  if(dashboardRangeMode==='ALL') return list;
  return list.filter(dashboardTicketInSelectedPeriod);
}
function dashboardTicketsInRange(){
  if(dashboardRangeMode==='OPEN_NOW') return (dashboardOpenTickets.length?dashboardOpenTickets:((Array.isArray(dashboardAllTickets)&&dashboardAllTickets.length)?dashboardAllTickets:(Array.isArray(tickets)?tickets:[])).filter(dashIsOpen));
  return dashboardTicketsByDateRange();
}
function dashboardGroup(rows,key){
  const out={};
  (rows||[]).forEach(t=>{const k=t[key]||'Não informado'; out[k]=(out[k]||0)+1});
  return Object.entries(out).sort((a,b)=>b[1]-a[1]).map(([name,total])=>({name,total}));
}
function dashboardChartsLocal(rows){
  rows=rows||[];
  const today=nowDayKeyBR();
  let start=dashboardStartKey || today;
  let end=dashboardEndKey || today;
  if(dashboardRangeMode==='ALL'){
    const keys=rows.map(t=>dayKeyBR(t.created_at)).filter(Boolean).sort();
    if(keys.length){start=keys[0];end=keys[keys.length-1];}
    else{start=dateKeyAdd(today,-6);end=today;}
  }
  let days=[], cursor=start, safety=0;
  while(cursor<=end && safety<366){days.push(cursor);cursor=dateKeyAdd(cursor,1);safety++;}
  if(!days.length) days=[today];
  const byDay=days.map(k=>({
    name:k.slice(8,10)+'/'+k.slice(5,7),
    total:rows.filter(t=>{
      const createdKey=dayKeyBR(t.created_at);
      const resolvedKey=dashResolvedKey(t);
      return createdKey===k || resolvedKey===k;
    }).length
  }));
  const resolved=rows.filter(dashIsResolved);
  const avgMap={};
  resolved.forEach(t=>{
    const k=t.sector_name||'Não informado';
    const total=Math.max(0,Math.round((tsBR(t.resolved_at||t.updated_at)-tsBR(t.created_at))/60000));
    if(!avgMap[k]) avgMap[k]={name:k,total:0,count:0};
    avgMap[k].total+=total; avgMap[k].count+=1;
  });
  const avgBySector=Object.values(avgMap)
    .map(x=>({name:x.name,minutes:Math.round(x.total/x.count),count:x.count}))
    .sort((a,b)=>b.minutes-a.minutes);
  return {
    byDay,
    bySector:dashboardGroup(rows,'sector_name'),
    byAsset:dashboardGroup(rows,'asset_name'),
    avgBySector
  };
}
function v133MoreHTMLChart(kind, showing, total){
  if(total<=showing) return `<div class="v132MoreBox"><span class="v132MoreInfo">Mostrando ${total} de ${total}</span></div>`;
  const labels={days:'Ver mais dias',sectors:'Ver mais setores',assets:'Ver mais equipamentos',avg:'Ver mais tempos'};
  return `<div class="v132MoreBox"><span class="v132MoreInfo">Mostrando ${showing} de ${total}</span><button class="v132MoreBtn" type="button" onclick="v133ShowMoreChart('${kind}')">${labels[kind]||'Ver mais'}</button></div>`;
}
function v133ShowMoreChart(kind){
  v133ChartLimits[kind]=(v133ChartLimits[kind]||4)+4;
  loadDashboardV8();
}
function clipName(v,max=24){v=String(v||'-');return v.length>max?v.slice(0,max-1)+'…':v}
function renderBars(elId, data, valueKey='total', suffix=''){
  const el=document.getElementById(elId); if(!el) return;
  data=data||[]; const max=Math.max(1,...data.map(x=>Number(x[valueKey]||0)));
  const isV16 = String(elId||'').startsWith('v16Eq');
  if(isV16){
    return renderV16OpsRanking(elId, data, valueKey, suffix);
  }
  el.innerHTML=data.length?data.map(x=>{
    const label=String(x.name||x.label||'-');
    const viewLabel=clipName(label,22);
    return `<div class="barRow"><div class="barLabel" title="${escapeAttr(label)}">${escHTML(viewLabel)}</div><div class="barTrack"><div class="barFill" style="width:${Math.max(6,(Number(x[valueKey]||0)/max)*100)}%"></div></div><b>${escHTML(String(x[valueKey]??0))}${suffix}</b></div>`;
  }).join(''):'<div class="empty">Sem dados ainda</div>';
}

function renderV16OpsRanking(elId, data, valueKey='total', suffix=''){
  const el=document.getElementById(elId); if(!el) return;
  const rows=(Array.isArray(data)?data:[])
    .map(x=>({
      name:String(x.name||x.label||'-').trim()||'-',
      total:Number(x[valueKey]||0)
    }))
    .filter(x=>x.total>0);

  if(!rows.length){
    el.innerHTML='<div class="sfd-empty">Sem dados ainda</div>';
    return;
  }

  const colors=['#dc2626','#f97316','#eab308','#16a85a','#0b66b2','#7c3aed','#14b8a6','#64748b','#8b5cf6','#94a3b8'];
  const isMoney=(elId==='v16EqBySectorCost'||elId==='v16EqLossRanking');
  const kindMap={
    v16EqByAsset:{main:'chamados', meta:'equipamentos', unit:' chamados', foot:'Principal'},
    v16EqBySectorCost:{main:'em gastos', meta:'setores', unit:'', foot:'Maior gasto'},
    v16EqLossRanking:{main:'em prejuízo', meta:'equipamentos', unit:'', foot:'Maior prejuízo'},
    v16EqByPart:{main:'lançamentos', meta:'peças/serviços', unit:' lanç.', foot:'Mais lançado'}
  };
  const cfg=kindMap[elId]||{main:'registros',meta:'itens',unit:suffix||'',foot:'Principal'};
  const top=rows.slice(0,4);
  const rest=rows.slice(4);
  const restTotal=rest.reduce((a,x)=>a+x.total,0);
  const items=restTotal>0 ? top.concat([{name:'Outros',total:restTotal}]) : top;
  const total=items.reduce((a,x)=>a+x.total,0);
  const max=Math.max(1,...items.map(x=>x.total));

  const sz=100, r=38, cx=50, cy=50, circ=2*Math.PI*r, sw=8;
  let offset=0, segs='';
  items.forEach((x,i)=>{
    const val=Number(x.total||0), pct=total?(val/total):0, len=pct*circ;
    if(len>0.01){
      const c=colors[i%colors.length];
      segs+='<circle cx="'+cx+'" cy="'+cy+'" r="'+r+'" fill="none" stroke="'+c+'" stroke-width="'+sw+'" stroke-linecap="butt" stroke-dasharray="'+len+' '+(circ-len)+'" stroke-dashoffset="'+(-offset)+'" transform="rotate(-90 '+cx+' '+cy+')" opacity=".94"/>';
      offset+=len;
    }
  });

  const rowsHtml=items.map((x,i)=>{
    const val=Number(x.total||0);
    const pct=total?((val/total)*100):0;
    const pctFmt=pct.toFixed(1).replace('.',',')+'%';
    const c=colors[i%colors.length];
    const raw=String(x.name||'-');
    const valText=isMoney?moneyBR(val):(val+(cfg.unit||''));
    const barW=Math.max(7,(val/max)*100);
    return ''+
      '<div class="sfd-rank-item">'+
        '<span class="sfd-rank-bar" style="width:'+barW+'%;background:'+c+'"></span>'+
        '<div class="sfd-rank-left">'+
          '<span class="sfd-rank-pos">'+(i+1)+'º</span>'+
          '<span class="sfd-rank-dot" style="background:'+c+'"></span>'+
          '<span class="sfd-rank-name" title="'+escapeAttr(raw)+'">'+escHTML(clipName(raw,30))+'</span>'+
        '</div>'+
        '<div class="sfd-rank-right">'+
          '<span class="sfd-rank-value">'+escHTML(valText)+'</span>'+
          '<span class="sfd-rank-percent">'+pctFmt+'</span>'+
        '</div>'+
      '</div>';
  }).join('');

  const leader=rows[0];
  const leaderPct=total?((Number(leader.total||0)/total)*100):0;
  const leaderVal=isMoney?moneyBR(leader.total):(leader.total+(cfg.unit||''));
  const totalLabel=isMoney?moneyBR(total):String(total);
  const foot=(cfg.foot||'Principal')+': <b>'+escHTML(clipName(leader.name,22))+'</b> • '+escHTML(leaderVal)+' • '+leaderPct.toFixed(1).replace('.',',')+'%';
  const alertHtml=leaderPct>50?'<span class="sfd-foot-alert">⚠ Muito concentrado</span>':(leaderPct>30?'<span class="sfd-foot-alert">⚠ Atenção</span>':'');

  el.innerHTML=''+
    '<div class="sfd sfd-widget v16CostDonut">'+
      '<div class="sfd-summary">'+
        '<span class="sfd-summary-total"><b>'+escHTML(totalLabel)+'</b> '+escHTML(cfg.main)+'</span>'+
        '<span class="sfd-summary-meta">'+rows.length+' '+escHTML(cfg.meta)+'</span>'+
      '</div>'+
      '<div class="sfd-body">'+
        '<div class="sfd-visual" aria-hidden="true"><svg viewBox="0 0 '+sz+' '+sz+'" class="sfd-ring">'+segs+'</svg></div>'+
        '<div class="sfd-ranks">'+rowsHtml+'</div>'+
      '</div>'+
      '<div class="sfd-foot"><span class="sfd-foot-text">'+foot+'</span>'+alertHtml+'</div>'+
    '</div>';
}

function renderDonut(elId, data, valueKey, suffix, maxItems){
  var el = document.getElementById(elId);
  if(!el) return;

  var rows = Array.isArray(data) ? data.slice() : [];
  valueKey = valueKey || 'total';

  var chartKind = '';
  var limit = Number(maxItems || 4);

  function _esc(v){
    return String(v == null ? '' : v).replace(/[&<>"']/g,function(c){
      return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];
    });
  }
  function _clip(v,n){
    v = String(v || '-').trim();
    return v.length > n ? v.slice(0,n-1) + '…' : v;
  }
  function _num(v){
    v = Number(v || 0);
    return Number.isFinite(v) ? v : 0;
  }
  function _pct(v,total){
    return total ? ((v/total)*100).toFixed(1).replace('.',',') + '%' : '0,0%';
  }
  function _clickAttr(name){
    var raw = String(name || '');
    var safe = raw.replace(/\\/g,'\\\\').replace(/'/g,"\\'").replace(/\n/g,' ');
    return '';
  }

  rows.sort(function(a,b){ return _num((b||{})[valueKey]) - _num((a||{})[valueKey]); });

  var total = rows.reduce(function(sum,x){ return sum + _num((x||{})[valueKey]); }, 0);
  if(!total){
    el.innerHTML='<div class="sfd-empty">Sem dados no período</div>';
    return;
  }

  var shown = rows.slice(0, Math.max(1, limit));
  var meta = 'itens';

  var colors = ['#dc2626','#f97316','#eab308','#16a85a','#0b66b2','#7c3aed','#14b8a6','#64748b'];
  var maxVal = Math.max.apply(null, shown.map(function(x){ return _num((x||{})[valueKey]); }).concat([1]));

  var circ = 238.76, offset = 0;
  var segs = shown.map(function(x,i){
    var val = _num((x||{})[valueKey]);
    var len = total ? (val/total)*circ : 0;
    var color = colors[i % colors.length];
    var s = '<circle cx="50" cy="50" r="38" fill="none" stroke="'+color+'" stroke-width="8" stroke-dasharray="'+len+' '+(circ-len)+'" stroke-dashoffset="'+(-offset)+'" transform="rotate(-90 50 50)"></circle>';
    offset += len;
    return s;
  }).join('');

  var rowsHtml = shown.map(function(x,i){
    var nameRaw = String((x && x.name) || '-');
    var val = _num((x||{})[valueKey]);
    var color = colors[i % colors.length];
    var width = Math.max(8, Math.round((val/maxVal)*100));
    return ''+
      '<div class="gfDashStableRow"'+_clickAttr(nameRaw)+' title="'+_esc(nameRaw)+'">'+
        '<span class="gfDashStableBar" style="width:'+width+'%;background:'+color+'"></span>'+
        '<span class="gfDashStableLeft">'+
          '<b class="gfDashStablePos">'+(i+1)+'º</b>'+
          '<i style="background:'+color+'"></i>'+
          '<strong>'+_esc(_clip(nameRaw,28))+'</strong>'+
        '</span>'+
        '<span class="gfDashStableRight">'+
          '<b>'+val+'</b>'+
          '<small>'+_pct(val,total)+'</small>'+
        '</span>'+
      '</div>';
  }).join('');

  var top = shown[0] || {};
  var topName = String(top.name || '-');
  var topVal = _num(top[valueKey]);
  var foot = '';
  foot = 'Principal: <b>'+_esc(_clip(topName,22))+'</b> • '+topVal+' itens • '+_pct(topVal,total);
  var mainWord = 'itens';

  var html = ''+
    '<div class="gfDashStable sfd sfd-widget">'+
      '<div class="gfDashStableSummary">'+
        '<span><b>'+total+'</b> '+mainWord+'</span>'+
        '<em>'+rows.length+' '+meta+'</em>'+
      '</div>'+
      '<div class="gfDashStableBody">'+
        '<div class="gfDashStableDonut"><svg viewBox="0 0 100 100">'+segs+'</svg></div>'+
        '<div class="gfDashStableRanks">'+rowsHtml+'</div>'+
      '</div>'+
      '<div class="gfDashStableFoot">'+foot+'</div>'+
    '</div>'+
    (chartKind && typeof v133MoreHTMLChart === 'function' ? v133MoreHTMLChart(chartKind, shown.length, rows.length) : '');

  if(el.innerHTML !== html) el.innerHTML = html;
}

function v9TicketIsService(t){
  const raw=[t.asset_kind,t.kind,t.asset_type,t.item_kind,t.asset_department,t.asset_name,t.issue_name].join(' ').toLowerCase();
  return raw.includes('service') || raw.includes('serviço') || raw.includes('servico') || /serviços|servicos|limber|internet|passagem de cabo|requisicao|requisição|suprimentos|instalação|instalacao|marcenaria|gás|gas/.test(raw);
}
function v9TicketIcon(t){
  return v9TicketIsService(t) ? '<span class="v9ServiceIcon" title="Serviço">🧩</span>' : '<span class="v9EquipIcon" title="Equipamento físico">🧰</span>';
}
function gfDeptEmojiInfoInline(t){
  let raw = String((t && (t.asset_department || t.department || t.department_name || t.dept || t.sector_department || t.ticket_department || t.asset_kind || t.kind)) || '').trim().toUpperCase();
  try{ raw = raw.normalize('NFD').replace(/[\u0300-\u036f]/g,''); }catch(e){}
  if(raw.indexOf('APOIO')>=0 || raw.indexOf('SUPORTE')>=0) return {emoji:'🤝', sigla:'APO', cls:'apoio', title:'Apoio'};
  if(raw.indexOf('MANUT')>=0 || raw.indexOf('MAN')===0) return {emoji:'🔧', sigla:'MAN', cls:'manut', title:'Manutenção'};
  if(raw.indexOf('TI')>=0 || raw.indexOf('TECNOLOGIA')>=0 || raw.indexOf('INFORMATICA')>=0) return {emoji:'💻', sigla:'TI', cls:'ti', title:'TI'};
  return null;
}
function gfDeptEmojiInline(t){
  const info = gfDeptEmojiInfoInline(t);
  if(!info) return '';
  return '<span class="gfDeptEmojiBadge '+info.cls+'" title="'+escHTML(info.title)+'" aria-label="'+escHTML(info.title)+'">'+info.emoji+'</span>';
}
function gfDeptPrefixHtml(t){
  const info = gfDeptEmojiInfoInline(t);
  if(info){
    return '<span class="gfDeptPrefix '+info.cls+'" title="'+escHTML(info.title)+'">'+info.emoji+' '+escHTML(info.sigla)+'</span>';
  }
  return '<span class="gfDeptPrefix geral" title="Departamento">🧩 DEP</span>';
}
function v9AssigneeHtml(t,st){
  const name=String(t.assigned_to_name||t.assigned_name||t.technician_name||'').trim();
  const cls=st==='DONE'?'done':st==='IN_PROGRESS'?'progress':'';
  if(st==='DONE') return '<span class="v9Assignee done">✅ Resolvido por: '+escHTML(name||'Equipe')+'</span>';
  if(st==='IN_PROGRESS') return '<span class="v9Assignee progress">👤 Assumido por: '+escHTML(name||'Equipe')+'</span>';
  return '<span class="v9Assignee">👤 Ainda não assumido</span>';
}
function gfTicketVisualState(t, forceCritical){
  const st=(String(t.status||'NEW').toUpperCase()==='NEW' && (t.assigned_to_user_id || t.assigned_to_name)) ? 'IN_PROGRESS' : String(t.status||'NEW').toUpperCase();
  const critical=!!forceCritical || gfIsOpenNewCritical(t);
  const cls=critical?'high':st==='DONE'?'done':st==='IN_PROGRESS'?'progress':'new';
  const label=critical?'SLA crítico':(st==='NEW'?'Novo':statusText(st));
  return {st,critical,cls,label};
}
function gfTicketCardHeaderMeta(t){
  return gfDeptPrefixHtml(t)+'<span class="gfDashDot">•</span><span class="gfDashPin">📍</span> '+escHTML(t.sector_name||'-')+'<span class="gfDashDot">•</span><strong class="gfDashTicketNo">#'+escHTML(t.ticket_number||t.id)+'</strong>';
}
function gfTicketMainTitle(t){
  const item=escHTML(t.asset_name||'-');
  const brandModel=(t.asset_brand||t.asset_model)?' '+escHTML([t.asset_brand||'',t.asset_model||''].join(' ').trim()):'';
  const issue=escHTML(t.issue_name||'Problema');
  return item+brandModel+' <span>•</span> '+issue;
}
function gfTicketUpdatedChip(t){
  return '<span class="gfDashUpdated">◷ Atualizado: '+escHTML(fmtBR(t.updated_at||t.created_at)||'-')+'</span>';
}
function v9TicketCardHtml(t,opts){
  opts=opts||{};
  const state=gfTicketVisualState(t, opts.critical);
  const st=state.st;
  const actions=opts.actions?`<div class="v9FilterActions">${ticketCardActionsHtml(t,'openTicketFromDashboard')}</div>`:'';
  const kindClass = v9TicketIsService(t) ? ' v9KindService' : ' v9KindEquipment';
  const cardClass = (opts.ticketClass||'v9FilterItem') + kindClass + ' gfDashTicketSnow ' + state.cls;
  const desc = escHTML(t.description||'Sem descrição.');
  const timeInline = escHTML(ticketTimeInline(t)||'');
  return `<div class="${cardClass}" ${opts.dataAttrs||''} onclick="openTicketFromDashboard(${Number(t.id)})">
    <div class="gfDashCardTop">
      <div class="gfDashCardMeta">${gfTicketCardHeaderMeta(t)}</div>
      ${gfTicketUpdatedChip(t)}
    </div>
    <div class="gfDashCardBadgeRow"><span class="badge ${state.cls}">${state.label}</span>${ticketRatingHtml(t,true)}</div>
    <div class="gfDashCardTitle">${gfTicketMainTitle(t)}</div>
    <div class="gfDashCardTime"><span>▣ ${escHTML(fmtBR(t.created_at)||'-')}</span>${timeInline?'<span>⌛ '+timeInline+'</span>':''}</div>
    ${v9AssigneeHtml(t,st)}
    <div class="gfDashCardDesc">${desc}</div>
    ${String(st).toUpperCase()==='DONE' ? ticketRatingHtml(t,false) : ''}
    ${(t.public_note||t.requester_update)?`<div class="v9RequesterUpdate gfDashRequesterUpdate">
      <div>📢 Atualização para solicitante</div>
      <p>${escHTML(t.public_note||t.requester_update||'')}</p>
    </div>`:''}
    ${actions}
  </div>`;
}

function dashboardInsightFilter(type,name){
  try{
    const base = dashboardTicketsInRange();
    let rows = [];
    const target = String(name||'').trim().toLowerCase();

    if(type==='DAY'){
      rows = base.filter(function(t){
        const d = formatTicketDayLabel(t);
        return String(d||'').trim().toLowerCase() === target;
      });
    } else if(type==='SECTOR'){
      rows = base.filter(function(t){
        return String(t.sector_name||'Não informado').trim().toLowerCase() === target;
      });
    } else if(type==='ASSET'){
      rows = base.filter(function(t){
        return String(t.asset_name||'Não informado').trim().toLowerCase() === target;
      });
    }

    window.gfDashboardFilterRowsById = {};
    rows.forEach(function(row){ if(row && row.id) window.gfDashboardFilterRowsById[Number(row.id)] = row; });

    dfTitle.innerText='Detalhamento';
    dfSubtitle.innerText=name;
    dfHint.innerText='Clique em um chamado para abrir os detalhes.';
    dfCount.innerText=rows.length+' '+(rows.length===1?'item':'itens');

    dfList.innerHTML = rows.length ? rows.map(function(t){
      const st=(String(t.status||'NEW').toUpperCase()==='NEW' && (t.assigned_to_user_id || t.assigned_to_name)) ? 'IN_PROGRESS' : String(t.status||'NEW').toUpperCase();
      return v9TicketCardHtml(t,{ticketClass:'v9FilterItem'});
    }).join('') : '<div class="empty">Nenhum chamado encontrado.</div>';

    drawerBg.classList.add('show');
    dashboardFilterDrawer.classList.add('show');
  }catch(e){
    console.error('Erro ao abrir detalhamento do dashboard:',e);
  }
}

async function loadDashboardV8(){
  if(window.__gfDashboardInFlight) return window.__gfDashboardInFlight;
  window.__gfDashboardInFlight = (async function(){
  try{
    if(!window.__gfDashCacheHydrated){
      window.__gfDashCacheHydrated=true;
      try{
        const cj=JSON.parse(sessionStorage.getItem('GF_DASHBOARD_CACHE')||'null');
        if(cj&&cj.ok&&Array.isArray(cj.rows)){ dashboardAllTickets=cj.rows; dashboardV9Data=cj; }
      }catch(_e){}
    }
    try{ if(window.gfFastMobileDashboardPaint) window.gfFastMobileDashboardPaint(); }catch(_e){}
    const r=await fetch(API+'/api/admin/dashboard-v8?light=1',{credentials:'include',cache:'no-store'}); if(r.status===401){location.href='/login';return}
    const j=await r.json(); if(!j.ok) return;
    dashboardAllTickets = Array.isArray(j.rows) ? j.rows : [];
    if(!dashboardAllTickets.length){
      try{
        const rt=await fetch(API+'/api/admin/tickets?light=1');
        if(rt.ok){ const jt=await rt.json(); if(jt.ok && Array.isArray(jt.tickets)) dashboardAllTickets=jt.tickets; }
      }catch(_){ dashboardAllTickets=[]; }
    }
    dashboardOpenTickets=((Array.isArray(dashboardAllTickets)&&dashboardAllTickets.length)?dashboardAllTickets:(Array.isArray(tickets)?tickets:[])).filter(dashIsOpen);
    dashboardV9Data=j;
    const visibleTickets = dashboardTicketsInRange();
    const periodTickets = dashboardTicketsByDateRange();
    const metricTickets = ((Array.isArray(dashboardAllTickets)&&dashboardAllTickets.length)?dashboardAllTickets:(Array.isArray(tickets)?tickets:[]));
    const newTicketsNow = metricTickets.filter(t=>dashStatus(t)==='NEW' && !dashIsResolved(t));
    updateDashboardRangeButtons();
    const todayStr = nowDayKeyBR();
    const groupLocal = (key) => {
      const out={}; visibleTickets.forEach(t=>{const k=t[key]||'Não informado'; out[k]=(out[k]||0)+1});
      return Object.entries(out).sort((a,b)=>b[1]-a[1]).map(([name,total])=>({name,total}));
    };
    const doneLocal = dashboardTicketsResolvedInPeriod();
    const byTechLocal={}; doneLocal.forEach(t=>{const k=t.assigned_to_name||'Equipe'; byTechLocal[k]=(byTechLocal[k]||0)+1});
    const topTechLocal=Object.entries(byTechLocal).sort((a,b)=>b[1]-a[1]).map(([name,total])=>({name,total}))[0]||{name:'-',total:0};
    const resolvedLocal = dashboardTicketsResolvedInPeriod();
    const avgLocal = resolvedLocal.length ? Math.round(resolvedLocal.reduce((acc,t)=>acc+((tsBR(t.resolved_at||t.updated_at)-tsBR(t.created_at))/60000),0)/resolvedLocal.length) : 0;
    j.cards = Object.assign({}, j.cards||{}, {
      openNow: newTicketsNow.length,
      progress: metricTickets.filter(t=>dashStatus(t)==='IN_PROGRESS' && !dashIsResolved(t)).length,
      slaCritical: metricTickets.filter(t=>gfIsOpenNewCritical(t)).length,
      doneToday: resolvedLocal.length,
      avgMinutes: Math.max(0, avgLocal||0),
      topTech: topTechLocal,
      topSector: groupLocal('sector_name')[0]||{name:'-',total:0},
      topAsset: groupLocal('asset_name')[0]||{name:'-',total:0}
    });
    dashboardV9Data=j;
    try{sessionStorage.setItem('GF_DASHBOARD_CACHE',JSON.stringify(Object.assign({},j,{rows:(j.rows||[]).slice(0,500)})));}catch(_e){}
    const c=j.cards||{}, ch=j.charts||{};
    function gfSetDashKpi(id,value){
      const el=document.getElementById(id);
      if(!el) return;
      const txt=String(value==null?'0':value);
      if(el.textContent!==txt) el.textContent=txt;
    }
    gfSetDashKpi('v8Open', Number(c.openNow||0));
    gfSetDashKpi('v8Progress', Number(c.progress||0));
    gfSetDashKpi('v8Critical', Number(c.slaCritical||0));
    gfSetDashKpi('v8DoneToday', Number(c.doneToday||0));
    gfSetDashKpi('v8Avg', Math.max(0, Number(c.avgMinutes||0))+'m');
    v8TopTech.innerText=clipName((c.topTech||{}).name||'-',18); v8TopTechSub.innerText=((c.topTech||{}).total||0)+' resolvidos';
    v8TopSector.innerText=clipName((c.topSector||{}).name||'-',18); v8TopSectorSub.innerText=((c.topSector||{}).total||0)+' chamados';
    v8TopAsset.innerText=clipName((c.topAsset||{}).name||'-',18); v8TopAssetSub.innerText=((c.topAsset||{}).total||0)+' chamados';
    v8CriticalCard.classList.toggle('v8Blink', Number(c.slaCritical||0)>0);
    if(window.v8AuditList){v8AuditList.innerHTML='';}
    renderDashboardV9Lists();
    if(window.v8Updated) v8Updated.innerText='Atualizado '+timeBR(new Date());
    if(!(window.gfIsMobileLiteV35 && window.gfIsMobileLiteV35()) && !(window.matchMedia && window.matchMedia('(max-width:700px)').matches) && typeof loadEquipmentDashboard==='function'){
      (window.requestIdleCallback || function(cb){ return setTimeout(cb, 300); })(function(){
        try{
          if(String(window.__gfCurrentPage||'dashboard')==='dashboard'){
            loadEquipmentDashboard();
          }
        }catch(e){}
      });
    }
  }catch(e){console.warn('dashboard v8',e)}
  finally{ window.__gfDashboardInFlight=null; }
  })();
  return window.__gfDashboardInFlight;
}
let dashboardV9Data={cards:{},charts:{}};
function clearOperationFilters(){ if(window.search) search.value=''; if(window.statusFilter) statusFilter.value=''; }
function scrollToOperation(){ setTimeout(()=>{ const box=document.querySelector('#pageOperacao .tablebox'); if(box) box.scrollIntoView({behavior:'smooth',block:'start'}); },80); }
let lastDashboardFilterType='ALL';

function closeDashboardFilter(){
  try{
    var dd=document.getElementById('dashboardFilterDrawer')||window.dashboardFilterDrawer;
    var bg=document.getElementById('drawerBg')||window.drawerBg;
    if(dd) dd.classList.remove('show');
    document.body.classList.remove('gf-dashboard-filter-open');
    if(bg && !(window.drawer&&drawer.classList&&drawer.classList.contains('show')) && !(window.historyDrawer&&historyDrawer.classList&&historyDrawer.classList.contains('show'))){
      bg.classList.remove('show');
      bg.style.pointerEvents=''; bg.style.background=''; bg.style.backdropFilter=''; bg.style.webkitBackdropFilter='';
    }
  }catch(e){}
}
function getDashboardFilterInfo(type){
  const c=dashboardV9Data.cards||{};
  const baseRows=dashboardTicketsInRange();
  const topTech=(c.topTech||{}).name;
  const topSector=(c.topSector||{}).name;
  const topAsset=(c.topAsset||{}).name;
  let title='Chamados', hint='Resultado do filtro selecionado.', rows=[];
  if(type==='OPEN'){title='Aguardando atendimento';hint='Somente chamados novos, ainda não assumidos.';rows=(dashboardOpenTickets.length?dashboardOpenTickets:((Array.isArray(dashboardAllTickets)&&dashboardAllTickets.length)?dashboardAllTickets:(Array.isArray(tickets)?tickets:[])).filter(dashIsOpen)).filter(t=>String(t.status||'NEW').toUpperCase()==='NEW');}
  else if(type==='PROGRESS'){title='Em andamento';hint='Chamados que já foram assumidos.';rows=baseRows.filter(t=>String(t.status||'').toUpperCase()==='IN_PROGRESS');}
  else if(type==='CRITICAL'){title='SLA crítico';hint='Somente chamados novos/abertos acima de 2 dias.';rows=baseRows.filter(t=>gfIsOpenNewCritical(t));}
  else if(type==='DONE_TODAY'||type==='DONE_PERIOD'){title='Resolvidos no período';hint='Chamados fechados dentro do filtro de data selecionado.';rows=dashboardTicketsResolvedInPeriod();}
  else if(type==='DONE'){title='Chamados resolvidos';hint='Todos os chamados resolvidos.';rows=baseRows.filter(dashIsResolved);}
  else if(type==='TOP_TECH' && topTech && topTech!=='-'){title='Técnico destaque';hint='Resolvidos pelo técnico destaque.';rows=baseRows.filter(t=>dashIsResolved(t)&&(t.assigned_to_name||'Equipe')===topTech);}
  else if(type==='TOP_SECTOR' && topSector && topSector!=='-'){title='Setor com mais problemas';hint='Chamados do setor campeão de problemas.';rows=baseRows.filter(t=>(t.sector_name||'Não informado')===topSector);}
  else if(type==='TOP_ASSET' && topAsset && topAsset!=='-'){title='Equipamento que mais quebra';hint='Chamados do equipamento com mais registros.';rows=baseRows.filter(t=>(t.asset_name||'Não informado')===topAsset);}
  rows=rows.sort((a,b)=>{
    const ac=gfIsOpenNewCritical(a)?0:String(a.status||'').toUpperCase()==='NEW'?1:String(a.status||'').toUpperCase()==='IN_PROGRESS'?2:3;
    const bc=gfIsOpenNewCritical(b)?0:String(b.status||'').toUpperCase()==='NEW'?1:String(b.status||'').toUpperCase()==='IN_PROGRESS'?2:3;
    return ac-bc||ticketUpdatedTime(b)-ticketUpdatedTime(a)||ticketCreatedTime(b)-ticketCreatedTime(a);
  });
  return {title,hint,rows};
}
function gfRefreshOpenDashboardFilter(){
  try{
    const drawer=document.getElementById('dashboardFilterDrawer');
    if(drawer && drawer.classList.contains('show') && lastDashboardFilterType){ dashboardFilter(lastDashboardFilterType); }
  }catch(e){console.warn('Falha ao atualizar detalhamento do dashboard:', e);}
}
function gfDashMobile(){ return window.matchMedia && window.matchMedia('(max-width:700px)').matches; }
function gfFastFilterTicketCardHtml(t){
  var id=Number(t.id||0);
  var state=gfTicketVisualState(t, false);
  var st=state.st;
  var canAssume=st==='NEW' && !t.assigned_to_user_id;
  var canFinish=st==='IN_PROGRESS';
  var timeInline=escHTML(ticketTimeInline(t)||'');
  return '<div class="gfFastFilterCard '+state.cls+'" data-gf-ticket-id="'+id+'">'
    +'<div class="gfFastFilterTop"><div class="gfFastMeta">'+gfTicketCardHeaderMeta(t)+'</div>'+gfTicketUpdatedChip(t)+'</div>'
    +'<div class="gfFastBadge"><span class="badge '+state.cls+'">'+state.label+'</span></div>'
    +'<div class="gfFastFilterTitle">'+gfTicketMainTitle(t)+'</div>'
    +'<div class="gfFastFilterTime"><span>▣ '+escHTML(fmtBR(t.created_at)||'-')+'</span>'+(timeInline?'<span>⌛ '+timeInline+'</span>':'')+'</div>'
    +v9AssigneeHtml(t,st)
    +'<div class="gfFastFilterDesc">'+escHTML(t.description||'Sem descrição.')+'</div>'
    +'<div class="gfFastFilterActions"><button class="btn btnLight" type="button" data-gf-open-ticket="'+id+'">☷ Ver detalhes</button>'
    +(canAssume?'<button class="btn btnWarn" type="button" data-gf-assume-ticket="'+id+'">👤 Assumir chamado</button>':'')
    +(canFinish?'<button class="btn" type="button" data-gf-resolve-ticket="'+id+'">✓ Finalizar chamado</button>':'')
    +'</div></div>';
}
function gfRenderDashboardFilterRows(limit){
  var rows=window.gfDashboardFilterCurrentRows||[];
  var mobile=gfDashMobile();
  var lim=limit || (mobile?8:rows.length);
  window.gfDashboardFilterLimit=lim;
  var html='';
  var slice=rows.slice(0,lim);
  if(slice.length){
    html=slice.map(function(t){ return gfDashTicketCardHtml(t); }).join('');
    if(rows.length>lim){ html += '<div class="gfMoreCard"><button class="btn btnLight" type="button" onclick="gfDashboardFilterMore()">Ver mais '+(rows.length-lim)+' chamado(s)</button></div>'; }
  }else html='<div class="empty">Nenhum chamado encontrado nesse filtro.</div>';
  dfList.innerHTML=html;
}
function gfDashboardFilterMore(){ gfRenderDashboardFilterRows((window.gfDashboardFilterLimit||8)+8); }
function dashboardFilter(type){
  lastDashboardFilterType=type;
  try{
    drawerBg.classList.add('show');
    dashboardFilterDrawer.classList.add('show');
    document.body.classList.add('gf-dashboard-filter-open');
    if(gfDashMobile()){
      drawerBg.style.pointerEvents='none';
      drawerBg.style.background='transparent';
      drawerBg.style.backdropFilter='none';
      drawerBg.style.webkitBackdropFilter='none';
    }
    dfTitle.innerText='Detalhamento';
    dfSubtitle.innerText='Abrindo...';
    dfHint.innerText='';
    dfCount.innerText='';
    dfList.innerHTML='<div class="empty">Carregando chamados...</div>';
  }catch(e){}
  requestAnimationFrame(function(){
    try{
      const info=getDashboardFilterInfo(type);
      const rows=Array.isArray(info.rows)?info.rows:[];
      window.gfDashboardFilterRowsById = {};
      rows.forEach(function(row){ if(row && row.id) window.gfDashboardFilterRowsById[Number(row.id)] = row; });
      window.gfDashboardFilterCurrentRows=rows;
      dfTitle.innerHTML=gfFilterTopCardHtml(info.title||'Detalhamento',rows.length,((type==='CRITICAL')?'critical':((type==='PROGRESS')?'progress':((type==='DONE_TODAY'||type==='DONE_PERIOD'||type==='DONE'||type==='TOP_TECH')?'done':'open'))));
      var filterTone = (type==='CRITICAL')?'critical':((type==='PROGRESS')?'progress':((type==='DONE_TODAY'||type==='DONE_PERIOD'||type==='DONE'||type==='TOP_TECH')?'done':'open'));
      var filterIcon = filterTone==='critical'?'⚠️':(filterTone==='progress'?'⏱️':(filterTone==='done'?'✅':'⏱️'));
      dfSubtitle.innerHTML='';
      dfHint.innerHTML='';
      dfCount.innerText='';
      gfRenderDashboardFilterRows(rows.length);
    }catch(e){
      console.error('Erro ao abrir detalhamento do dashboard:', e);
      dfTitle.innerText='Detalhamento'; dfSubtitle.innerText='Erro ao carregar'; dfHint.innerText='Tente abrir novamente.'; dfCount.innerText='0 itens';
      dfList.innerHTML='<div class="empty">Não foi possível carregar os chamados agora.</div>';
    }
  });
}
window.gfDashboardFilterRowsById = window.gfDashboardFilterRowsById || {};
async function openTicketFromDashboard(id){
  id = Number(id || 0);
  if(!id){ alert('Chamado inválido.'); return; }

  const cached = window.gfDashboardFilterRowsById && window.gfDashboardFilterRowsById[id];
  closeDashboardFilter();
  if(cached){
    try{
      const t = (typeof upsertTicketLocal==='function') ? (upsertTicketLocal(cached) || cached) : cached;
      fillDrawerTicket(t);
    }catch(e){ openDrawer(id); }
    try{
      fetch(API + '/api/admin/tickets/by-db-id/' + encodeURIComponent(id), {credentials:'include'})
        .then(function(r){ if(r.ok) return r.json(); })
        .then(function(j){ if(j && j.ok && j.ticket){ const fresh=(typeof upsertTicketLocal==='function')?(upsertTicketLocal(j.ticket)||j.ticket):j.ticket; if(window.drawer && drawer.classList.contains('show')) fillDrawerTicket(fresh); } })
        .catch(function(){});
    }catch(e){}
    return;
  }

  try{
    const r = await fetch(API + '/api/admin/tickets/by-db-id/' + encodeURIComponent(id), {credentials:'include'});
    if(r.status===401){ location.href='/login'; return; }
    if(r.ok){
      const j = await r.json();
      if(j && j.ok && j.ticket){
        const t = (typeof upsertTicketLocal==='function') ? (upsertTicketLocal(j.ticket) || j.ticket) : j.ticket;
        fillDrawerTicket(t);
        return;
      }
    }
  }catch(e){ console.warn('Falha ao abrir por ID interno do dashboard:', e); }
  openDrawer(id);
}
function v132MoreHTML(type, showing, total){
  if(total<=showing) return `<div class="v132MoreBox"><span class="v132MoreInfo">Mostrando ${total} de ${total}</span></div>`;
  const fn=type==='critical'?'v132ShowMoreCritical':'v132ShowMoreLatest';
  const label=type==='critical'?'Ver mais críticos':'Ver mais chamados';
  return `<div class="v132MoreBox"><span class="v132MoreInfo">Mostrando ${showing} de ${total}</span><button class="v132MoreBtn" type="button" onclick="${fn}()">${label}</button></div>`;
}
function v132ShowMoreCritical(){
  v132CriticalLimit += 4;
  renderDashboardV9Lists();
}
function v132ShowMoreLatest(){
  v132LatestLimit += 4;
  renderDashboardV9Lists();
}
function renderDashboardV9Lists(){
  const dashRows=dashboardTicketsInRange();
  const criticalAll=dashRows
    .filter(t=>gfIsOpenNewCritical(t))
    .sort((a,b)=>mins(b.created_at)-mins(a.created_at));
  const latestAll=dashRows
    .slice()
    .sort((a,b)=>ticketUpdatedTime(b)-ticketUpdatedTime(a)||ticketCreatedTime(b)-ticketCreatedTime(a));
  const critical=criticalAll.slice(0,v132CriticalLimit);
  const latest=latestAll.slice(0,v132LatestLimit);
  const row=t=>v9TicketCardHtml(t,{ticketClass:'v9Ticket ticketClickable',showTime:true,dataAttrs:`data-ticket-id="${Number(t.id)}" title="Clique para abrir o chamado"`});
  if(window.v9CriticalList){
    v9CriticalList.innerHTML=criticalAll.length
      ? critical.map(row).join('') + v132MoreHTML('critical', critical.length, criticalAll.length)
      : '<div class="empty">Nenhum chamado crítico agora.</div>';
  }
  if(window.v9LatestList){
    v9LatestList.innerHTML=latestAll.length
      ? latest.map(row).join('') + v132MoreHTML('latest', latest.length, latestAll.length)
      : '<div class="empty">Nenhum chamado ainda.</div>';
  }
}
async function loadSmartHistory(id){
  const box=document.getElementById('smartHistory'); if(!box) return;
  box.innerHTML='Carregando análise dos últimos 30 dias...';
  try{
    const r=await fetch(API+'/api/admin/tickets/'+id+'/history-smart'); const j=await r.json(); if(!j.ok){box.innerHTML='Não foi possível carregar.';return}
    const s=j.summary||{};
    box.innerHTML=`${s.repeatedAlert?'<div class="badge high">⚠ Mesmo problema repetido neste setor</div>':'<div class="badge done">Histórico analisado</div>'}<div class="smartStats"><div class="historyCard"><b>Chamados 30 dias</b><span>${s.last30||0}</span></div><div class="historyCard"><b>Resolvidos</b><span>${s.resolved||0}</span></div><div class="historyCard"><b>Em aberto</b><span>${s.open||0}</span></div><div class="historyCard"><b>Mesmo problema</b><span>${s.repeated||0}</span></div></div>${(j.tickets||[]).slice(0,5).map(t=>`<div class="historyItem ticketClickable" data-ticket-id="${t.id}" title="Clique para abrir o chamado"><div class="openLine"><b>#${t.ticket_number||t.id} · ${escHTML(t.issue_name||'Problema')}</b><span class="badge ${t.status==='DONE'?'done':t.status==='IN_PROGRESS'?'progress':'new'}">${statusText(t.status)}</span></div>${spHistoryChips(t)}<small>${escHTML([fmtBR(t.created_at), t.asset_name||'-', spMetaText(t)].filter(Boolean).join(' · '))}</small></div>`).join('')||'<small>Nenhum chamado anterior neste setor nos últimos 30 dias.</small>'}`;
  }catch(e){box.innerHTML='Erro ao analisar histórico.'}
}
function moneyBR(v){return (Number(v||0)).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});}
async function syncEquipDashSectors(){
  const sel=document.getElementById('equipDashSector'); if(!sel) return;
  const cur=sel.value;
  let list=Array.isArray(sectors)?sectors:[];
  if(!list.length){
    try{
      const r=await fetch(API+'/api/admin/sectors');
      const j=await r.json();
      if(j.ok && Array.isArray(j.sectors)){ sectors=j.sectors; list=sectors; }
    }catch(e){ console.warn('setores dashboard financeiro',e); }
  }
  sel.innerHTML='<option value="">Todos setores</option>'+list.map(s=>`<option value="${s.id}">${escHTML(s.name||'-')}</option>`).join('');
  if(cur && list.some(s=>String(s.id)===String(cur))) sel.value=cur;
}
async function syncEquipDashAssets(){
  const sel=document.getElementById('equipDashAsset'); if(!sel) return;
  const cur=sel.value;
  const sid=document.getElementById('equipDashSector')?.value||'';
  const dept=document.getElementById('equipDashDepartment')?.value||'';
  try{
    const qs=new URLSearchParams();
    if(sid) qs.set('sector_id',sid);
    const url=API+'/api/admin/assets'+(qs.toString()?'?'+qs.toString():'');
    const r=await fetch(url);
    const j=await r.json();
    let list=(j.assets||[]).filter(a=>String(a.status||'ACTIVE')!=='WRITTEN_OFF');
    if(dept) list=list.filter(a=>String(a.asset_department||'TI').toUpperCase()===dept);
    sel.innerHTML='<option value="">Todos equipamentos</option>'+list.map(a=>{
      const patrimonio=(a.patrimonio||a.sp_identificacao||a.id||'').toString();
      const nome=[patrimonio, a.name||'-'].filter(Boolean).join(' - ');
      const modelo=[a.brand||'', a.model||''].join(' ').trim();
      const setor=a.sector_name?` · ${a.sector_name}`:'';
      const extra=modelo?` · ${modelo}`:'';
      return `<option value="${a.id}">${escHTML(nome+extra+setor)}</option>`;
    }).join('');
    if(cur && list.some(a=>String(a.id)===String(cur))) sel.value=cur;
    else sel.value='';
  }catch(e){
    console.warn('equipamentos dashboard financeiro',e);
    sel.innerHTML='<option value="">Todos equipamentos</option>';
  }
}
function onEquipDashSectorChange(){
  const assetSel=document.getElementById('equipDashAsset');
  if(assetSel) assetSel.value='';
  loadEquipmentDashboard();
}
function onEquipDashDepartmentChange(){
  const assetSel=document.getElementById('equipDashAsset');
  if(assetSel) assetSel.value='';
  loadEquipmentDashboard();
}
function v16HealthLabel(status){
  const s=String(status||'').toUpperCase();
  if(s==='WRITTEN_OFF'||s==='SUCATA') return '⚫ Sucata';
  if(s==='NO_REPAIR'||s==='CRITICO') return '🔴 Crítico';
  if(s==='ATENCAO') return '🟡 Atenção';
  if(s==='OBSERVAR'||s==='SWAP') return '🟠 Observar';
  return '🟢 Saudável';
}
function v16AssetStatusFromRow(r){
  if(r?.asset_health_status) return r.asset_health_status;
  const tickets=Number(r?.asset_total_tickets||r?.total_tickets||0), cost=Number(r?.asset_total_maintenance||r?.total_maintenance||r?.maintenance_value||0), purchase=Number(r?.purchase_value||0), st=String(r?.asset_status||'').toUpperCase();
  const ratio=purchase>0 ? cost/purchase : 0;
  if(st==='WRITTEN_OFF') return 'SUCATA';
  if(st==='NO_REPAIR') return 'CRITICO';
  if(tickets>=5 || cost>=1000 || ratio>=.60) return 'CRITICO';
  if(tickets>=3 || cost>=400 || ratio>=.35) return 'ATENCAO';
  if(tickets>=1 || cost>0 || st==='SWAP') return 'OBSERVAR';
  return 'SAUDAVEL';
}
function v16CompraHTML(r){
  const lines=[];
  if(r.purchase_value) lines.push('💰 Patrimônio: <b>'+moneyBR(r.purchase_value)+'</b>');
  if(r.invoice_number) lines.push('🧾 NF: '+escHTML(r.invoice_number));
  if(r.purchase_date) lines.push('📅 Compra: '+escHTML(r.purchase_date));
  if(r.asset_supplier_name) lines.push('🏪 Fornecedor: '+escHTML(r.asset_supplier_name));
  if(r.warranty_until) lines.push('🛡️ Garantia: '+escHTML(r.warranty_until));
  if(r.useful_life_years) lines.push('⏳ Vida útil: '+escHTML(r.useful_life_years)+' ano(s)');
  return lines.length ? lines.join('<br>') : 'Compra: -';
}
async function loadEquipmentDashboard(){
  try{
    await syncEquipDashSectors();
    await syncEquipDashAssets();
    const p=new URLSearchParams();
    const sid=document.getElementById('equipDashSector')?.value||'';
    const aid=document.getElementById('equipDashAsset')?.value||'';
    const dept=document.getElementById('equipDashDepartment')?.value||'';
    const valueMode=document.getElementById('equipDashValueMode')?.value||'ALL';
    const st=document.getElementById('equipDashStart')?.value||dashboardStartKey||'';
    const en=document.getElementById('equipDashEnd')?.value||dashboardEndKey||'';
    if(sid)p.set('sector_id',sid); if(aid)p.set('asset_id',aid); if(dept)p.set('department',dept); if(valueMode&&valueMode!=='ALL')p.set('value_mode',valueMode); if(st)p.set('start',st); if(en)p.set('end',en);
    const r=await fetch(API+'/api/admin/equipment-dashboard?'+p.toString()); if(r.status===401){location.href='/login';return}
    const j=await r.json(); if(!j.ok)return;
    const c=j.cards||{};
    if(window.v16EqTickets)v16EqTickets.innerText=c.totalTickets||0;
    if(window.v16EqAssets)v16EqAssets.innerText=c.assetsWithProblem||0;
    if(window.v16EqCost)v16EqCost.innerText=moneyBR(c.totalMaintenance||0);
    if(window.v16EqPatrimony)v16EqPatrimony.innerText=moneyBR(c.totalPatrimonyValue||0);
    if(window.v16EqLoss)v16EqLoss.innerText=c.lossAsset?.asset_name||'-';
    if(window.v16EqCritical)v16EqCritical.innerText=c.criticalAssets||0;
    if(window.v16EqMonthCost)v16EqMonthCost.innerText=moneyBR(c.totalMaintenanceMonth||0);
    if(window.v16EqYearCost)v16EqYearCost.innerText=moneyBR(c.totalMaintenanceYear||0);
    if(window.v16EqTop)v16EqTop.innerText=c.topAsset?.asset_name||'-';
    renderBars('v16EqByAsset',(j.charts?.byAsset||[]).map(x=>({name:x.asset_name,total:x.total_tickets})),'total','');
    renderBars('v16EqBySectorCost',(j.charts?.bySector||[]).map(x=>({name:x.name,total:Math.round(Number(x.total_maintenance||0))})),'total','');
    renderBars('v16EqLossRanking',(j.charts?.lossRanking||[]).filter(x=>Number(x.total_maintenance||0)>0).slice(0,8).map(x=>({name:x.asset_name,total:Math.round(Number(x.total_maintenance||0))})),'total','');
    renderBars('v16EqByPart',(j.charts?.byPart||[]).map(x=>({name:x.name,total:x.total})),'total','');
    const rows=(j.rows||[]).slice(0,80);
    const tb=document.getElementById('v16EqRows');
    if(tb)tb.innerHTML=rows.length?rows.map(r=>{
      const status=v16AssetStatusFromRow(r);
      const servico=[r.part_name, r.maintenance_description, r.ticket_supplier_name].filter(Boolean).join(' · ')||'-';
      const acumulado=Number(r.asset_total_maintenance||r.maintenance_value||0);
      return `<tr><td>#${escHTML(r.ticket_number||r.id)}</td><td>${escHTML(r.sector_name||'-')}</td><td><div class="v16StatusLine"><b>${displayPatrimonio(r)}</b><span class="v16EquipName">${escHTML(r.asset_name||'-')}</span><span class="v16EquipStatus">${v16HealthLabel(status)}</span></div><span class="financeMini v16FinanceDetails">${v16CompraHTML(r)}<br>🔧 Gasto acumulado do patrimônio: <b>${moneyBR(acumulado)}</b><br>🧾 Valor deste chamado: <b>${moneyBR(r.maintenance_value||0)}</b></span></td><td>${escHTML(r.issue_name||'-')}</td><td>${escHTML(servico)}</td><td><b>${moneyBR(r.maintenance_value||0)}</b></td><td>${fmtBR(r.updated_at||r.created_at)}</td></tr>`;
    }).join(''):'<tr><td colspan="7" class="empty">Sem dados nesse filtro.</td></tr>';
  }catch(e){console.warn('equip dashboard',e)}
}
window.__gfCurrentPage='dashboard';
function gfPageIs(p){return String(window.__gfCurrentPage||'dashboard')===p;}
function gfCanPoll(){return !document.hidden;}
function gfRunSingle(name,fn){
  const k='__gfBusy_'+name, p='__gfPend_'+name;
  if(window[k]){window[p]=true;return;}
  window[k]=true;
  Promise.resolve().then(fn).catch(e=>console.warn('poll '+name,e)).finally(()=>{
    window[k]=false;
    if(window[p]){window[p]=false;setTimeout(()=>gfRunSingle(name,fn),350);}
  });
}
(async()=>{
  await ensureMe();

  setDashboardRange('OPEN_NOW');

  setTimeout(()=>{ if(gfCanPoll()) gfRunSingle('tickets',()=>loadTickets()); },1600);

  setInterval(()=>{ if(gfCanPoll()) gfRunSingle('tickets',()=>loadTickets()); },(window.innerWidth<=768?30000:15000));
  setInterval(()=>{ 
  try{
    var mod=(localStorage.getItem('cadastroModuloAtual')||'').toLowerCase();
    if(gfCanPoll() && (gfPageIs('operacao') || (gfPageIs('cadastros') && mod==='equipamentos'))){
      gfRunSingle('assets',()=>loadAssets());
    }
  }catch(e){}
},30000);
  setInterval(()=>{ if(gfCanPoll() && gfPageIs('dashboard')) gfRunSingle('dashboard',()=>loadDashboardV8()); },(window.innerWidth<=768?90000:45000));
})();
setInterval(()=>{try{const n=document.getElementById('meName')?.innerText||'G';const a=document.getElementById('userAvatar');if(a){const v=(n.trim()[0]||'G').toUpperCase(); if(a.innerText!==v)a.innerText=v;}}catch(e){}},5000);

;
function closeAllExportMenus(){
  document.querySelectorAll('.exportMenuPanel.show').forEach(el=>el.classList.remove('show'));
}
function placeExportMenu(panel,btn){
  if(!panel || !btn) return;
  const gap=10;
  const bw=btn.getBoundingClientRect();
  panel.classList.add('show');
  panel.style.visibility='hidden';
  panel.style.left='12px';
  panel.style.top='12px';
  const pw=Math.min(panel.offsetWidth || 286, window.innerWidth - 24);
  const ph=panel.offsetHeight || 150;
  let left=bw.right - pw;
  left=Math.max(12, Math.min(left, window.innerWidth - pw - 12));
  let top=bw.bottom + gap;
  if(top + ph > window.innerHeight - 12) top=Math.max(12, bw.top - ph - gap);
  panel.style.left=left+'px';
  panel.style.top=top+'px';
  panel.style.visibility='visible';
}
document.addEventListener('click',function(ev){
  if(!ev.target.closest('.exportMenuWrap') && !ev.target.closest('.exportMenuPanel')) closeAllExportMenus();
},true);
window.addEventListener('resize',closeAllExportMenus);
window.addEventListener('scroll',closeAllExportMenus,true);
function exportDashboardQuery(){
  const p=new URLSearchParams();
  p.set('mode', dashboardRangeMode || 'TODAY');
  if(dashboardStartKey) p.set('start', dashboardStartKey);
  if(dashboardEndKey) p.set('end', dashboardEndKey);
  return p.toString();
}
function exportEquipmentDashboardCSV(){
  try{
    const table=document.querySelector('#v16EqRows')?.closest('table');
    if(!table){ alert('Tabela de equipamentos não encontrada.'); return; }
    const headers=[...table.querySelectorAll('thead th')].map(th=>th.innerText.trim());
    const rows=[...table.querySelectorAll('tbody tr')].filter(tr=>!tr.querySelector('.empty')).map(tr=>[...tr.children].map(td=>td.innerText.replace(/\s+/g,' ').trim()));
    if(!rows.length){ alert('Não há dados para exportar nesse filtro.'); return; }
    const csv=[headers,...rows].map(cols=>cols.map(v=>'"'+String(v||'').replace(/"/g,'""')+'"').join(';')).join('\n');
    const blob=new Blob(['\ufeff'+csv],{type:'text/csv;charset=utf-8;'});
    const url=URL.createObjectURL(blob);
    const a=document.createElement('a');
    const now=new Date();
    const stamp=now.toISOString().slice(0,10);
    a.href=url;
    a.download='equipamentos-filtro-'+stamp+'.csv';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    if(typeof toast==='function') toast('Exportação gerada com sucesso.');
  }catch(e){
    console.warn('export equipment dashboard',e);
    alert('Não foi possível exportar agora.');
  }
}

;
async function exportAssetsCadastrosCSV(){
  try{
    const cleanText = (v)=>String(v ?? '')
      .replace(/<[^>]*>/g,'')
      .replace(/&nbsp;/gi,' ')
      .replace(/&amp;/gi,'&')
      .replace(/&lt;/gi,'<')
      .replace(/&gt;/gi,'>')
      .replace(/&quot;/gi,'"')
      .replace(/&#39;/gi,"'")
      .replace(/\s+/g,' ')
      .trim();
    const normalize = (v)=>{
      const raw = cleanText(v).toLowerCase();
      try{
        return raw.normalize('NFD').replace(/[\u0300-\u036f]/g,'');
      }catch(_){
        return raw;
      }
    };
    const sectorId = document.getElementById('assetFilterSector')?.value || '';
    const selectedAsset = document.getElementById('assetFilterAsset')?.value || '';
    const q = normalize(document.getElementById('assetSearch')?.value || '');
    let source = [];
    try{
      const url = API + '/api/admin/assets' + (sectorId ? '?sector_id=' + encodeURIComponent(sectorId) : '');
      const res = await fetch(url);
      const json = await res.json();
      source = Array.isArray(json.assets) ? json.assets : [];
    }catch(_){
      source = (typeof getAssets==='function') ? getAssets() : (Array.isArray(window.assets) ? window.assets : []);
    }
    const rows = source
      .filter(a=>{
        if(String(a.status || 'ACTIVE').toUpperCase() !== 'ACTIVE') return false;
        if(selectedAsset && String(a.id) !== String(selectedAsset)) return false;
        if(q){
          const txt = normalize([
            a.patrimonio,
            a.sp_identificacao,
            a.sp_responsavel,
            a.sp_local,
            a.sp_obs,
            a.name,
            a.asset_department,
            a.brand,
            a.model,
            a.sector_name,
            a.origin_sector_name,
            a.status,
            a.out_of_operation_reason,
            a.latest_ticket_solution,
            a.latest_ticket_user_name,
            a.latest_ticket_number
          ].join(' '));
          if(!txt.includes(q)) return false;
        }
        return true;
      })
      .sort((a,b)=>cleanText(a.name).localeCompare(cleanText(b.name),'pt-BR',{numeric:true,sensitivity:'base'}));
    if(!rows.length){
      alert('Não há equipamentos ativos para exportar nesse filtro.');
      return;
    }
    const patrimonioLimpo = (a)=>{
      const value = (typeof displayPatrimonio==='function') ? displayPatrimonio(a) : (a.patrimonio || '');
      return cleanText(value);
    };
    const headers = [
      'Patrimônio',
      'Equipamento',
      'Setor',
      'Departamento',
      'Marca',
      'Modelo',
      'Responsável',
      'Local SP',
      'Identificação SP',
      'Observação SP',
      'Status'
    ];
    const csvRows = rows.map(a=>[
      patrimonioLimpo(a),
      a.name,
      a.sector_name,
      a.asset_department,
      a.brand,
      a.model,
      a.sp_responsavel || a.owner_name || '',
      a.sp_local || '',
      a.sp_identificacao || '',
      a.sp_obs || '',
      a.status || 'ACTIVE'
    ].map(cleanText));
    const csv = [headers, ...csvRows]
      .map(cols=>cols.map(v=>'"'+String(v || '').replace(/"/g,'""')+'"').join(';'))
      .join('\n');
    const blob = new Blob(['\ufeff' + csv], {type:'text/csv;charset=utf-8;'});
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const stamp = new Date().toISOString().slice(0,10);
    link.href = url;
    link.download = 'equipamentos-cadastrados-' + stamp + '.csv';
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    if(typeof toast==='function') toast('Exportação de equipamentos gerada.');
    else if(typeof toastMsg==='function') toastMsg('Exportação de equipamentos gerada.');
  }catch(e){
    console.warn('export assets cadastros', e);
    alert('Não foi possível exportar os equipamentos agora.');
  }
}

;
(function(){
  function ready(fn){document.readyState==='loading'?document.addEventListener('DOMContentLoaded',fn):fn();}
  ready(function(){
    try{
      var header=document.querySelector('.appTopbar')||document.querySelector('.topbar');
      var tabs=document.querySelector('.wrap > .tabs')||document.querySelector('.tabs');
      if(header && tabs && !tabs.classList.contains('g126-moved') && !(window.matchMedia && window.matchMedia('(max-width:768px)').matches)){
        tabs.classList.add('g126-moved');
        header.insertBefore(tabs, header.querySelector('.appUserBar') || header.lastElementChild);
      }
      document.querySelectorAll('tbody tr').forEach(function(tr){
        var headers=[].slice.call((tr.closest('table')||document).querySelectorAll('thead th')).map(function(th){return th.innerText.trim();});
        [].slice.call(tr.children).forEach(function(td,i){ if(!td.getAttribute('data-label')) td.setAttribute('data-label', headers[i]||''); });
      });
    }catch(e){console.warn('V12.6 layout helper',e);}
  });
})();

;
(function(){
  function forceInitialDrawerClosed(){
    try{
      document.querySelectorAll('.drawer').forEach(function(d){
        d.classList.remove('show');
      });
      var bg=document.getElementById('drawerBg') || document.querySelector('.drawerBg');
      if(bg) bg.classList.remove('show');
      document.body.classList.remove('drawer-open');
    }catch(e){}
  }
  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', forceInitialDrawerClosed, {once:true});
  }else{
    forceInitialDrawerClosed();
  }
  window.addEventListener('load', function(){
    setTimeout(forceInitialDrawerClosed, 80);
  });
})();

;
(function(){
  function cadastroPage(){ return document.getElementById('pageCadastros'); }
  function clearCadastroState(page){
    if(!page) return;
    page.classList.remove('cadastro-show-equipamentos','cadastro-show-servicos','cadastro-show-problemas','cadastro-module-open','cadastro-menu-open');
  }
  window.showCadastroMenu=function(){
    const page=cadastroPage();
    clearCadastroState(page);
    page.classList.add('cadastro-menu-open');
    const chooser=document.getElementById('cadastroChooser');
    if(chooser) chooser.scrollIntoView({behavior:'smooth',block:'start'});
  };
  window.openCadastroModule=function(module){
    const map={equipamentos:'cadastro-show-equipamentos',servicos:'cadastro-show-servicos',problemas:'cadastro-show-problemas'};
    const page=cadastroPage();
    clearCadastroState(page);
    if(!map[module]) return showCadastroMenu();
    page.classList.add('cadastro-module-open',map[module]);
    try{ localStorage.setItem('cadastroModuloAtual',module); }catch(e){}
    try{
      const kind=document.getElementById('assetFilterKind');
      const newKind=document.getElementById('assetKindSelect');
      if(module==='servicos'){
        var b=document.getElementById('assetsBody');
        var hasCache=!!(b && window.gfCadastroCache.servicos);
        if(hasCache){ b.innerHTML=window.gfCadastroCache.servicos; window.__gfUseServiceCache=true; }
        if(kind) kind.value='SERVICE';
        if(newKind) newKind.value='SERVICE';
        if(!hasCache && typeof window.loadAssets==='function') setTimeout(function(){ window.loadAssets(); },0);
      }else if(module==='equipamentos'){
        var b=document.getElementById('assetsBody');
        var hasCache=!!(b && window.gfCadastroCache.equipamentos);
        if(hasCache){ b.innerHTML=window.gfCadastroCache.equipamentos; }
        if(kind) kind.value='EQUIPMENT';
        if(newKind) newKind.value='EQUIPMENT';
        if(!hasCache && typeof window.loadAssets==='function') setTimeout(function(){ window.loadAssets(); },0);
      }
      if(typeof window.updateCadastroAssetHero==='function') setTimeout(window.updateCadastroAssetHero,0);
    }catch(e){}
    const target=page.querySelector('[data-cadastro-module="'+(module==='servicos'?'equipamentos':module)+'"]');
    if(target) target.scrollIntoView({behavior:'smooth',block:'start'});
  };
  document.addEventListener('DOMContentLoaded',function(){
    const page=cadastroPage();
    if(page && !page.classList.contains('hidden')) window.showCadastroMenu();
  });
})();

;

(function(){
  function el(id){return document.getElementById(id)}
  function txt(id,v){var x=el(id); if(x)x.textContent=String(v)}
  function norm(v){return String(v||'').toUpperCase().trim()}
  function kindOf(a){return norm(a&& (a.asset_kind||a.kind||a.type))==='SERVICE'?'SERVICE':'EQUIPMENT'}
  function statusOf(a){return norm(a&&(a.status||a.asset_status||'ACTIVE'))||'ACTIVE'}
  function activeAsset(a){return !['INACTIVE','NO_REPAIR','WRITTEN_OFF','DISABLED'].includes(statusOf(a))}
  function activeService(g){return Number(g&&g.active==null?1:g.active)===1 && statusOf(g)!=='INACTIVE'}
  window.updateCadastroAssetHero=function(){
    var kind=(el('assetFilterKind')&&el('assetFilterKind').value)||'EQUIPMENT';
    var assets=Array.isArray(window.assets)?window.assets:[];
    var services=Array.isArray(window.gfIssueServiceGroups)?window.gfIssueServiceGroups:(Array.isArray(window.serviceGroupsCache)?window.serviceGroupsCache:[]);
    var equip=assets.filter(function(a){return kindOf(a)!=='SERVICE'});
    var serv=services.length?services:assets.filter(function(a){return kindOf(a)==='SERVICE'});
    var list=kind==='SERVICE'?serv:equip;
    var active=list.filter(function(x){return kind==='SERVICE'?activeService(x):activeAsset(x)}).length;
    var inactive=Math.max(0,list.length-active);
    txt('cadAssetStatEquip',equip.length);
    txt('cadAssetStatServ',serv.length);
    txt('cadAssetStatActive',active);
    txt('cadAssetStatInactive',inactive);
    var isSvc=kind==='SERVICE';
    txt('cadAssetModuleTitle',isSvc?'Serviços':'Equipamentos');
    txt('cadAssetModuleSub',isSvc?'Organize serviços vinculados aos setores, igual a lógica dos QR Codes.':'Organize patrimônios por setor, responsável, status e histórico.');
    txt('cadAssetHeroTitle',isSvc?'Serviços':'Equipamentos');
    txt('cadAssetHeroSub',isSvc?'Gerencie serviços, setores vinculados, departamento e ativo/inativo sem misturar com patrimônio físico.':'Visual limpo para cadastrar, localizar, editar e separar equipamentos ativos e inativos.');
    txt('cadAssetModuleBadge',isSvc?'Serviços':'Controle técnico');
    txt('cadAssetHeroIcon',isSvc?'🧩':'🧰');
  };
})();

;
(function(){
  function gfMobileReady(){ return window.matchMedia && window.matchMedia('(max-width:700px)').matches; }
  function ensureMobileTicketBox(){
    var box=document.getElementById('gfMobileTickets');
    if(box) return box;
    var table=document.querySelector('#pageOperacao > .tablebox');
    box=document.createElement('section');
    box.id='gfMobileTickets';
    box.innerHTML='<div class="gfMobileSectionHead"><h3>Chamados</h3><small id="gfMobileTicketCount">0 itens</small></div><div class="gfTicketRail" id="gfTicketRail"></div>';
    if(table && table.parentNode) table.parentNode.insertBefore(box,table);
    return box;
  }
  function esc(v){
    try{ if(typeof escHTML==='function') return escHTML(v); }catch(_){}
    return String(v==null?'':v).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});
  }
  function safeCall(fn,arg,fallback){ try{ return typeof fn==='function'?fn(arg):fallback; }catch(_){ return fallback; } }
  function gfFilteredTickets(){
    try{
      var rawQ=(window.search && window.search.value ? window.search.value : '').trim();
      var q=rawQ.toLowerCase().replace(/^#/,'');
      var st=(window.statusFilter && window.statusFilter.value) || '';
      var list=(typeof tickets!=='undefined' && Array.isArray(tickets)) ? tickets : [];
      return list.filter(function(t){
        var ticketNo=String(t.ticket_number||t.id||'');
        var text=[ticketNo,'#'+ticketNo,t.id,t.sector_name,t.asset_name,t.asset_brand,t.asset_model,t.issue_name,t.description,t.patrimonio,t.asset_sp_identificacao,t.opened_by_name,t.assigned_to_name,t.status].join(' ').toLowerCase();
        var ok=(!q||text.indexOf(q)>-1)&&(!st||t.status===st);
        try{
          if(typeof quick!=='undefined'){
            if(quick==='TODAY') ok=ok&&isToday(t.created_at);
            if(quick==='CRITICAL') ok=ok&&gfIsOpenNewCritical(t);
            if(quick==='MINE') ok=ok&&me&&t.assigned_to_user_id===me.id;
            if(quick==='DONE') ok=ok&&t.status==='DONE';
          }
        }catch(_){}
        return ok;
      }).sort(function(a,b){
        var bu=safeCall(window.ticketUpdatedTime||ticketUpdatedTime,b,0), au=safeCall(window.ticketUpdatedTime||ticketUpdatedTime,a,0);
        var bc=safeCall(window.ticketCreatedTime||ticketCreatedTime,b,0), ac=safeCall(window.ticketCreatedTime||ticketCreatedTime,a,0);
        return bu-au||bc-ac||Number(b.id||0)-Number(a.id||0);
      });
    }catch(e){ console.warn('mobile ticket filter',e); return []; }
  }
  window.gfRenderMobileTickets=function(){
    var box=ensureMobileTicketBox();
    if(!box) return;
    var rail=document.getElementById('gfTicketRail');
    var count=document.getElementById('gfMobileTicketCount');
    if(!rail) return;
    var rows=gfFilteredTickets();
    if(count) count.innerText=rows.length+' '+(rows.length===1?'item':'itens');
    if(!rows.length){ rail.innerHTML='<div class="gfEmptyMobile">Nenhum chamado encontrado nesse filtro.</div>'; return; }
    if(window.gfIsMobileLiteV35 && window.gfIsMobileLiteV35()) rows=rows.slice(0,10);
    rail.innerHTML=rows.map(function(t){
      var s={txt:'OK',cls:''}; try{s=sla(t)||s;}catch(_){}
      var ticketNo=t.ticket_number||t.id;
      var patrimonio=t.patrimonio||t.asset_sp_identificacao||'';
      var chips='';
      if(patrimonio) chips+='<span class="gfTicketChip">Patr. '+esc(patrimonio)+'</span>';
      var marcaModelo=((t.asset_brand||'')+' '+(t.asset_model||'')).trim();
      if(marcaModelo) chips+='<span class="gfTicketChip">'+esc(marcaModelo)+'</span>';
      chips+='<span class="gfTicketChip">'+esc(t.issue_name||'Problema')+'</span>';
      var st=''; try{ st=statusBadge(t.status)+' '+finalOutcomeBadge(t.final_outcome||t.resolution_type); }catch(_){ st='<span class="badge">'+esc(t.status||'')+'</span>'; }
      var pr=''; try{ pr=priBadge(t.priority); }catch(_){}
      return '<article class="gfTicketCard '+esc(s.cls||'')+'" data-ticket-id="'+esc(t.id||'')+'" data-gf-ticket-id="'+esc(t.id||'')+'" title="Clique para abrir o chamado">'
        +'<div class="gfTicketTop"><span class="gfTicketNum">#'+esc(ticketNo)+'</span><span class="gfTicketSla badge '+(s.txt==='Crítico'?'high':s.txt==='Atenção'?'medium':'new')+'">'+esc(s.txt||'OK')+'</span></div>'
        +'<div class="gfTicketTitle"><b>'+esc(t.sector_name||'-')+'</b><strong>'+esc(t.asset_name||'-')+'</strong></div>'
        +'<div class="gfTicketChips">'+chips+'</div>'
        +'<div class="gfTicketDesc">'+esc(t.description||'-')+'</div>'
        +'<div class="gfTicketFoot"><div class="gfTicketMeta">'+esc(t.assigned_to_name||'Área administrativa')+' · '+esc((typeof fmtBR==='function'?fmtBR(t.updated_at||t.created_at):'')||'-')+'</div>'
        +'<div class="gfTicketActions">'+st+' '+pr+'</div></div></article>';
    }).join('');
  };
  function bind(){
    try{ window.gfRenderMobileTickets(); }catch(e){}
    ['search','statusFilter'].forEach(function(id){var el=window[id]||document.getElementById(id); if(el && !el.dataset.gfMobBind){el.dataset.gfMobBind='1'; el.addEventListener('input',window.gfRenderMobileTickets); el.addEventListener('change',window.gfRenderMobileTickets);}});
  }
  function gfBootMobileTicketsOnce(){ if(window.__gfMobTicketsBootV20) return; window.__gfMobTicketsBootV20=true; setTimeout(bind,500); }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',gfBootMobileTicketsOnce,{once:true}); else gfBootMobileTicketsOnce();
  window.addEventListener('resize',function(){ try{ window.gfRenderMobileTickets(); }catch(e){} });
})();

;
(function(){
  function getDirectTicketKey(){
    try{
      var params=new URLSearchParams(location.search||'');
      var key=params.get('ticket')||params.get('chamado')||params.get('open');
      if(!key && location.hash){
        var h=String(location.hash||'').replace(/^#/, '');
        if(/^ticket=/i.test(h) || /^chamado=/i.test(h) || /^open=/i.test(h)){
          key=new URLSearchParams(h).get('ticket')||new URLSearchParams(h).get('chamado')||new URLSearchParams(h).get('open');
        }else if(/^\d+$/.test(h)){
          key=h;
        }
      }
      key=String(key||'').trim().replace(/^#/, '');
      return /^\d+$/.test(key)?key:'';
    }catch(_){return '';}
  }
  function getDirectTicketDbId(){
    try{
      var params=new URLSearchParams(location.search||'');
      var key=params.get('ticket_id')||params.get('db_id')||params.get('id');
      key=String(key||'').trim().replace(/^#/, '');
      return /^\d+$/.test(key)?key:'';
    }catch(_){return '';}
  }
  async function openDirectTicket(){
    var dbId=getDirectTicketDbId();
    var key=getDirectTicketKey();
    if(!dbId && !key) return;
    var tries=0;
    var timer=setInterval(async function(){
      tries++;
      try{
        var byCanonical = typeof window.gfOpenTicketCanonical==='function';
        var byId = typeof window.gfOpenTicketByDbId==='function';
        var byKey = typeof window.openDrawer==='function' || typeof window.gfOpenTicketForce==='function';
        if(byCanonical || byId || byKey){
          clearInterval(timer);
          if(typeof window.showPage==='function') window.showPage('Operacao');
          var realId = Number(dbId || key);
          if(byCanonical) await window.gfOpenTicketCanonical(realId);
          else if(realId && byId) await window.gfOpenTicketByDbId(realId);
          else await (window.gfOpenTicketForce||window.openDrawer)(Number(key));
        }
      }catch(e){
        console.warn('Falha ao abrir chamado pelo link direto:', e);
      }
      if(tries>=30) clearInterval(timer);
    }, 250);
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', openDirectTicket);
  else openDirectTicket();
})();

;

(function(){
  function safeText(v){ return String(v||'').trim(); }
  function company(){
    var c=window.GF_COMPANY||{};
    var name=safeText(c.name)||safeText(document.getElementById('companyBrandName')&&document.getElementById('companyBrandName').textContent)||'Sistema Facilities';
    var logo=safeText(c.logo_url)||safeText(document.getElementById('companyLogoImg')&&document.getElementById('companyLogoImg').src);
    var slug=safeText(c.slug)||safeText(sessionStorage.getItem('GF_COMPANY_SLUG'))||'';
    return {name:name,logo:logo,slug:slug};
  }
  function buildSystemLink(c){
    var origin=location.origin;
    if(c.slug) return origin+'/c/'+encodeURIComponent(c.slug)+'/admin';
    return origin+'/admin.html';
  }
  window.openGfAppDownloadModal=function(){
    var c=company();
    var bg=document.getElementById('gfAppDownloadBg'); if(!bg) return;
    var title=document.getElementById('gfAppDownloadTitle');
    var text=document.getElementById('gfAppDownloadText');
    var logo=document.getElementById('gfAppDownloadLogo');
    var box=logo&&logo.parentElement;
    var apk=document.getElementById('gfAppDownloadApk');
    var open=document.getElementById('gfAppDownloadOpen');
    if(title) title.textContent='Baixar app — '+c.name;
    if(text) text.textContent='Instale o aplicativo desta empresa com o mesmo painel, login, chamados, QR, anexos e filtros do site.';
    if(logo && box){
      if(c.logo && !/admin\.html/i.test(c.logo)){ logo.src=c.logo; logo.style.display='block'; box.classList.remove('noLogo'); logo.onerror=function(){ logo.style.display='none'; box.classList.add('noLogo'); }; }
      else { logo.removeAttribute('src'); logo.style.display='none'; box.classList.add('noLogo'); }
    }
    if(open){
      open.href=c.slug?('/c/'+encodeURIComponent(c.slug)+'/app'):'/app';
    }
    if(apk){

      apk.setAttribute('download', (c.name||'guara-facilities').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'')+'-app.apk');
    }
    bg.classList.add('show');
  };
  window.closeGfAppDownloadModal=function(ev){
    if(ev && ev.target && ev.target.id!=='gfAppDownloadBg') return;
    var bg=document.getElementById('gfAppDownloadBg'); if(bg) bg.classList.remove('show');
  };
  window.copyGfAppLink=async function(){
    var link=buildSystemLink(company());
    try{ await navigator.clipboard.writeText(link); alert('Link copiado: '+link); }
    catch(e){ prompt('Copie o link:',link); }
  };
})();

;
(function(){
  function isMobile(){ return window.matchMedia && window.matchMedia('(max-width:700px)').matches; }
  function ensureMobileAppButton(){
    if(!isMobile()) return;
    if(document.getElementById('gfMobileAppDownloadBtn')) return;
    var btn=document.createElement('button');
    btn.id='gfMobileAppDownloadBtn';
    btn.type='button';
    btn.setAttribute('aria-label','Baixar aplicativo');
    btn.title='Baixar app';
    btn.onclick=function(ev){
      ev.preventDefault();
      ev.stopPropagation();
      if(typeof window.openGfAppDownloadModal==='function') window.openGfAppDownloadModal();
      else alert('Opção de baixar app ainda está carregando. Tente novamente.');
    };
    document.body.appendChild(btn);
  }

  // Proteção mobile: deslizar na barra de módulos não navega. Só clique/tap real abre.
  (function(){
    var sx=0, sy=0, moved=false;
    window.addEventListener('touchstart', function(ev){
      var t=ev.target && ev.target.closest && ev.target.closest('#gfUltimateMobileNav,[data-gf-ultimate-route]');
      if(!t) return;
      var p=ev.touches && ev.touches[0]; if(!p) return;
      sx=p.clientX; sy=p.clientY; moved=false;
    }, true);
    window.addEventListener('touchmove', function(ev){
      var t=ev.target && ev.target.closest && ev.target.closest('#gfUltimateMobileNav,[data-gf-ultimate-route]');
      if(!t) return;
      var p=ev.touches && ev.touches[0]; if(!p) return;
      if(Math.abs(p.clientX-sx)>10 || Math.abs(p.clientY-sy)>10) moved=true;
    }, true);
    window.addEventListener('touchend', function(ev){
      var t=ev.target && ev.target.closest && ev.target.closest('#gfUltimateMobileNav,[data-gf-ultimate-route]');
      if(!t) return;
      if(moved){ ev.stopImmediatePropagation(); ev.stopPropagation(); return; }
    }, true);
  })();

  function boot(){
    ensureMobileAppButton();
    setTimeout(ensureMobileAppButton,500);
    setTimeout(ensureMobileAppButton,1500);
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot); else boot();
  window.addEventListener('resize',function(){
    if(isMobile()) ensureMobileAppButton();
    else { var b=document.getElementById('gfMobileAppDownloadBtn'); if(b) b.remove(); }
  });
})();

;
(function(){
  if(window.__gfAppNotifyV1) return; window.__gfAppNotifyV1=true;
  function esc(v){try{return String(v==null?'':v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}catch(e){return ''}}
  function val(t,keys,fb){for(var i=0;i<keys.length;i++){var v=t&&t[keys[i]]; if(v!==undefined && v!==null && String(v).trim()!=='') return v;} return fb||'-';}
  function dept(t){var d=String(val(t,['department','asset_department','ticket_department','dept'],'')).toUpperCase(); if(d.indexOf('MANUT')>=0) return 'MANUTENÇÃO'; if(d.indexOf('TI')>=0) return 'TI'; return d||'GERAL';}
  function container(){var el=document.getElementById('gfAppNotifyStack'); if(!el){el=document.createElement('div');el.id='gfAppNotifyStack';el.className='gfAppNotifyStack';document.body.appendChild(el);} return el;}
  function close(card){if(!card) return; card.style.animation='gfAppNotifyOut .22s ease-in forwards'; setTimeout(function(){try{card.remove()}catch(e){}},240);}
  function openTicket(id){
    id = Number(id || 0);
    try{ if(typeof window.gfOpenTicketCanonical==='function') return window.gfOpenTicketCanonical(id); }catch(e){}
    try{ if(typeof window.gfOpenTicketByDbId==='function') return window.gfOpenTicketByDbId(id); }catch(e){}
    try{ if(typeof window.openDrawer==='function') return window.openDrawer(id); }catch(e){}
  }
  window.gfAppNotifyTicket=function(t){
    if(!t) return;
    var id=val(t,['id','ticket_id','ticket_number'],'');
    var dep=dept(t), setor=val(t,['sector_name','sector','setor'],'-'), equip=val(t,['asset_name','asset','equipment','equipamento','name'],'-');
    var prob=val(t,['issue_name','problem','problema','description','descricao'],'-');
    var card=document.createElement('div'); card.className='gfAppNotify'; card.setAttribute('data-ticket-id',id);
    card.innerHTML='<div class="gfAppNotifyTop"><div class="gfAppNotifyIcon">🔔</div><div class="gfAppNotifyTitle"><b>Novo chamado — '+esc(dep)+'</b><small>Chamado #'+esc(val(t,['ticket_number','id'],id))+' acabou de chegar</small></div><button class="gfAppNotifyClose" type="button" aria-label="Fechar">×</button></div>'+
      '<div class="gfAppNotifyBody"><div class="gfAppNotifyLine"><span>Departamento</span><b>'+esc(dep)+'</b></div><div class="gfAppNotifyLine"><span>Setor</span><b>'+esc(setor)+'</b></div><div class="gfAppNotifyLine"><span>Equipamento</span><b>'+esc(equip)+'</b></div><div class="gfAppNotifyLine"><span>Problema</span><b>'+esc(prob)+'</b></div></div>'+
      '<div class="gfAppNotifyActions"><button class="gfAppNotifyOpen" type="button">Abrir chamado</button><button class="gfAppNotifyLater" type="button">Depois</button></div><div class="gfAppNotifyProgress"><i></i></div>';
    container().prepend(card);
    card.querySelector('.gfAppNotifyClose').onclick=function(){close(card)};
    card.querySelector('.gfAppNotifyLater').onclick=function(){close(card)};
    card.querySelector('.gfAppNotifyOpen').onclick=function(){close(card);openTicket(id)};
    setTimeout(function(){close(card)},10000);
  };
  window.gfAppNotifyTickets=function(list){(Array.isArray(list)?list:[list]).slice(0,3).forEach(function(t,i){setTimeout(function(){window.gfAppNotifyTicket(t)},i*450)});};
})();

;

(function(){
  'use strict';
  if(window.__GF_PUSH_UNICO_SEM_PISCAR_V40__) return;
  window.__GF_PUSH_UNICO_SEM_PISCAR_V40__ = true;

  function safe(v){ return String(v == null ? '' : v).trim(); }
  function companySlug(){
    var c = window.GF_COMPANY || {};
    return safe(c.slug) || safe(sessionStorage.getItem('GF_COMPANY_SLUG')) || safe(localStorage.getItem('gf_company_slug')) || safe(localStorage.getItem('GF_COMPANY_SLUG')) || '';
  }
  function deviceKey(){
    var k = '';
    try{ k = localStorage.getItem('GF_PUSH_DEVICE_ID_V40') || ''; }catch(e){}
    if(!k){
      k = 'dev-' + Date.now() + '-' + Math.random().toString(36).slice(2,10);
      try{ localStorage.setItem('GF_PUSH_DEVICE_ID_V40', k); }catch(e){}
    }
    return k;
  }
  function enabledKey(){ return 'GF_PUSH_ENABLED_V40_' + companySlug() + '_' + deviceKey(); }
  function disabledKey(){ return 'GF_PUSH_DISABLED_V40_' + companySlug() + '_' + deviceKey(); }
  function markOn(){ try{ localStorage.setItem(enabledKey(),'1'); localStorage.removeItem(disabledKey()); }catch(e){} }
  function markOff(){ try{ localStorage.removeItem(enabledKey()); localStorage.setItem(disabledKey(), String(Date.now())); }catch(e){} }
  function isMarkedOn(){ try{ return localStorage.getItem(enabledKey()) === '1'; }catch(e){ return false; } }
  function isMarkedOff(){ try{ return !!localStorage.getItem(disabledKey()); }catch(e){ return false; } }

  function notifyBox(msg, type){
    try{
      var old = document.getElementById('gfPushMsgV40');
      if(old) old.remove();
      var div = document.createElement('div');
      div.id = 'gfPushMsgV40';
      div.textContent = msg;
      div.style.cssText = 'position:fixed;right:22px;top:92px;z-index:999999;padding:15px 18px;border-radius:16px;font-weight:900;font-size:14px;box-shadow:0 18px 45px rgba(0,0,0,.22);max-width:420px;line-height:1.25;color:#fff;background:' + (type === 'ok' ? '#0f7a3a' : type === 'warn' ? '#9a5a00' : '#7f1d1d') + ';';
      document.body.appendChild(div);
      clearTimeout(window.__gfPushMsgTimerV40);
      window.__gfPushMsgTimerV40 = setTimeout(function(){ try{ div.remove(); }catch(e){} }, 5200);
    }catch(e){ try{ alert(msg); }catch(_){} }
  }

  function setActive(){
    var btn = document.getElementById('gfPushTopBtn'); if(!btn) return;
    btn.disabled = false;
    btn.textContent = '✅ Notificações ativas';
    btn.title = 'Clique para desativar as notificações deste aparelho';
    btn.setAttribute('aria-pressed','true');
    btn.className = 'gfPushTopBtn active';
  }
  function setInactive(){
    var btn = document.getElementById('gfPushTopBtn'); if(!btn) return;
    btn.disabled = false;
    btn.textContent = '🔔 Ativar notificações';
    btn.title = 'Clique para ativar as notificações neste aparelho';
    btn.setAttribute('aria-pressed','false');
    btn.className = 'gfPushTopBtn';
  }
  function setBlocked(txt){
    var btn = document.getElementById('gfPushTopBtn'); if(!btn) return;
    btn.disabled = false;
    btn.textContent = txt || '🚫 Bloqueado';
    btn.title = 'Libere notificações no cadeado do navegador/app';
    btn.setAttribute('aria-pressed','false');
    btn.className = 'gfPushTopBtn blocked';
  }
  function setBusy(txt){
    var btn = document.getElementById('gfPushTopBtn'); if(!btn) return;
    btn.disabled = true;
    btn.textContent = txt || 'Aguarde...';
  }
  function u8(base64String){
    var padding = '='.repeat((4 - base64String.length % 4) % 4);
    var base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    var raw = atob(base64);
    var arr = new Uint8Array(raw.length);
    for(var i=0;i<raw.length;i++) arr[i] = raw.charCodeAt(i);
    return arr;
  }
  async function getReg(){
    if(!('serviceWorker' in navigator)) return null;
    try{
      try{
        var chk = await fetch('/sw.js', { method:'HEAD', cache:'no-store' });
        if(!chk || !chk.ok) return null;
      }catch(_check){ return null; }

      var r = await navigator.serviceWorker.register('/sw.js', { scope:'/', updateViaCache:'none' });
      try{ await r.update(); }catch(e){}
      return await navigator.serviceWorker.ready;
    }catch(e){
      try{ return await navigator.serviceWorker.getRegistration('/') || null; }catch(_){ return null; }
    }
  }
  async function getSub(){
    try{ var r = await getReg(); return r && r.pushManager ? await r.pushManager.getSubscription() : null; }catch(e){ return null; }
  }
  async function saveSub(sub){
    var res = await fetch('/api/push/subscribe', {
      method:'POST', credentials:'include', cache:'no-store', headers:{'Content-Type':'application/json'},
      body:JSON.stringify({ subscription:sub, company_slug:companySlug(), company:companySlug(), device_id:deviceKey() })
    });
    var data = {}; try{ data = await res.json(); }catch(e){}
    if(!res.ok || data.ok === false) throw new Error(data.error || ('Falha ao salvar no servidor HTTP ' + res.status));
  }
  async function removeSub(){
    markOff();
    var sub = await getSub();
    var endpoint = sub && sub.endpoint ? String(sub.endpoint) : '';
    try{
      await fetch('/api/push/unsubscribe', {
        method:'POST', credentials:'include', cache:'no-store', headers:{'Content-Type':'application/json'},
        body:JSON.stringify({ endpoint:endpoint, company_slug:companySlug(), company:companySlug(), device_id:deviceKey() })
      });
    }catch(e){}
    if(sub){ try{ await sub.unsubscribe(); }catch(e){} }
    markOff();
  }
  async function refresh(force){
    var btn = document.getElementById('gfPushTopBtn'); if(!btn) return;
    if(!('Notification' in window) || !('serviceWorker' in navigator) || !('PushManager' in window)){ setBlocked('🚫 Sem suporte'); return; }
    if(Notification.permission === 'denied'){ markOff(); setBlocked('🚫 Bloqueado'); return; }

    if(isMarkedOff() && !force){ setInactive(); return; }

    if(Notification.permission === 'granted' && isMarkedOn() && !force){
      setActive();
      (async function(){
        try{
          var reg = await getReg();
          if(!reg || !reg.pushManager) return;
          var sub = await reg.pushManager.getSubscription();
          if(!sub){
            var keyRes = await fetch('/api/push/public-key?company=' + encodeURIComponent(companySlug()), { credentials:'include', cache:'no-store' });
            var keyData = {}; try{ keyData = await keyRes.json(); }catch(e){}
            if(keyRes.ok && keyData.publicKey){
              sub = await reg.pushManager.subscribe({ userVisibleOnly:true, applicationServerKey:u8(keyData.publicKey) });
            }
          }
          if(sub) await saveSub(sub);
        }catch(e){ console.warn('[PUSH V40 refresh silencioso]', e); }
      })();
      return;
    }

    var sub = await getSub();
    if(Notification.permission === 'granted' && sub){ markOn(); setActive(); return; }
    setInactive();
  }
  async function activate(){
    if(!('Notification' in window) || !('serviceWorker' in navigator) || !('PushManager' in window)) throw new Error('Este navegador/app não suporta notificações push.');
    var secureHost = /^(localhost|127\.0\.0\.1|\[::1\])$/i.test(location.hostname);
    if(location.protocol !== 'https:' && !secureHost) throw new Error('Notificação Push precisa de HTTPS. Abra pelo link HTTPS do sistema.');
    var p = Notification.permission;
    if(p !== 'granted') p = await Notification.requestPermission();
    if(p !== 'granted') throw new Error('Permissão não liberada. Clique no cadeado do navegador e permita notificações.');
    var reg = await getReg();
    if(!reg || !reg.pushManager) throw new Error('Service Worker não registrou. Substitua também o server.js e reinicie o PM2.');
    var keyRes = await fetch('/api/push/public-key?company=' + encodeURIComponent(companySlug()), { credentials:'include', cache:'no-store' });
    var keyData = {}; try{ keyData = await keyRes.json(); }catch(e){}
    if(!keyRes.ok || !keyData.publicKey) throw new Error(keyData.error || ('Falha ao buscar chave Push HTTP ' + keyRes.status));
    var sub = await reg.pushManager.getSubscription();
    if(!sub) sub = await reg.pushManager.subscribe({ userVisibleOnly:true, applicationServerKey:u8(keyData.publicKey) });
    await saveSub(sub);
    markOn();
    setActive();
    try{ await reg.showNotification('✅ Notificações ativadas', { body:'Este aparelho vai receber os chamados novos.', tag:'gf-push-ok-' + deviceKey(), icon:'/favicon.ico', badge:'/favicon.ico' }); }catch(e){}
  }
  async function toggle(e){
    if(e){ e.preventDefault(); e.stopPropagation(); if(e.stopImmediatePropagation) e.stopImmediatePropagation(); }
    var btn = document.getElementById('gfPushTopBtn'); if(!btn) return;
    if(('Notification' in window) && Notification.permission === 'denied'){
      notifyBox('Notificações bloqueadas. Clique no cadeado ao lado do link e libere notificações.', 'warn');
      setBlocked('🚫 Bloqueado');
      return;
    }
    var activeVisual = btn.classList.contains('active') || btn.getAttribute('aria-pressed') === 'true';
    try{
      if(activeVisual){
        setBusy('Desativando...');
        await removeSub();
        setInactive();
        notifyBox('Notificações desativadas neste aparelho.', 'ok');
      }else{
        setBusy('Ativando...');
        await activate();
        notifyBox('Notificações ativadas neste aparelho.', 'ok');
      }
    }catch(err){
      console.error('[PUSH V40]', err);
      await refresh();
      notifyBox(err && err.message ? err.message : 'Não foi possível alterar as notificações.', 'err');
    }
  }
  function install(){
    var btn = document.getElementById('gfPushTopBtn');
    if(!btn){
      var target = document.querySelector('.topRight') || document.querySelector('.appUserBar') || document.querySelector('.appTopbar') || document.body;
      btn = document.createElement('button');
      btn.id = 'gfPushTopBtn';
      btn.type = 'button';
      btn.className = 'gfPushTopBtn';
      btn.textContent = '🔔 Ativar notificações';
      target.insertBefore(btn, target.firstChild || null);
    }
    btn.onclick = null;
    if(!btn.__gfPushV40){ btn.__gfPushV40 = true; btn.addEventListener('click', toggle, true); }
    refresh(false);
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install); else install();
  window.addEventListener('pageshow', install);
  document.addEventListener('visibilitychange', function(){ if(!document.hidden) refresh(false); });
  setInterval(function(){ refresh(false); }, 15000);
})();

(function(){
  var lastFocus=null;
  var scale=1, tx=0, ty=0;
  var pointers=new Map();
  var lastDist=0, lastMid=null;
  var dragging=false, lastPoint=null;

  function clamp(v,min,max){return Math.max(min,Math.min(max,v));}
  function img(){return document.getElementById('gfImageViewerImg');}
  function bg(){return document.getElementById('gfImageViewer');}
  function label(){return document.getElementById('gfZoomLabel');}
  function apply(){
    var im=img(); if(!im)return;
    scale=clamp(scale,1,5);
    if(scale<=1.01){scale=1;tx=0;ty=0;}
    im.style.transform='translate3d('+tx+'px,'+ty+'px,0) scale('+scale+')';
    var lb=label(); if(lb) lb.textContent=Math.round(scale*100)+'%';
  }
  function reset(){scale=1;tx=0;ty=0;apply();}
  function zoomAt(nextScale,cx,cy){
    var old=scale;
    nextScale=clamp(nextScale,1,5);
    if(!cx && !cy){cx=window.innerWidth/2;cy=window.innerHeight/2;}
    var dx=cx-window.innerWidth/2;
    var dy=cy-window.innerHeight/2;
    tx=(tx-dx)*(nextScale/old)+dx;
    ty=(ty-dy)*(nextScale/old)+dy;
    scale=nextScale;
    apply();
  }
  window.gfImageZoomIn=function(){zoomAt(scale+.35);}
  window.gfImageZoomOut=function(){zoomAt(scale-.35);}
  window.gfImageZoomReset=reset;

  window.openGfImageViewer=function(src,title){
    var b=bg(), im=img(), tt=document.getElementById('gfImageViewerTitle');
    if(!b||!im)return;
    lastFocus=document.activeElement;
    reset();
    im.src=src||'';
    if(tt)tt.textContent=title||'Foto do chamado';
    b.classList.add('show');
    b.setAttribute('aria-hidden','false');
    document.body.style.overflow='hidden';
    try{ history.pushState({gfImageViewer:true},'',location.href); }catch(e){}
  };

  window.closeGfImageViewer=function(skipHistory){
    var b=bg(), im=img();
    if(!b)return;
    b.classList.remove('show');
    b.setAttribute('aria-hidden','true');
    reset();
    pointers.clear();
    if(im) setTimeout(function(){ if(!b.classList.contains('show')) im.removeAttribute('src'); },150);
    document.body.style.overflow='';
    try{ if(!skipHistory && history.state && history.state.gfImageViewer) history.back(); }catch(e){}
    try{ if(lastFocus&&lastFocus.focus) lastFocus.focus(); }catch(e){}
  };

  function mid(a,b){return {x:(a.clientX+b.clientX)/2,y:(a.clientY+b.clientY)/2};}
  function dist(a,b){var x=a.clientX-b.clientX,y=a.clientY-b.clientY;return Math.sqrt(x*x+y*y);}

  document.addEventListener('pointerdown',function(e){
    var b=bg(), im=img();
    if(!b||!b.classList.contains('show'))return;
    if(e.target===im || e.target.id==='gfImageViewerStage'){
      e.preventDefault();
      pointers.set(e.pointerId,e);
      if(e.target.setPointerCapture) try{e.target.setPointerCapture(e.pointerId)}catch(_){}
      if(pointers.size===1){
        dragging=true; lastPoint={x:e.clientX,y:e.clientY};
        if(im) im.classList.add('dragging');
      }else if(pointers.size===2){
        var arr=Array.from(pointers.values());
        lastDist=dist(arr[0],arr[1]); lastMid=mid(arr[0],arr[1]);
      }
    }
  },true);

  document.addEventListener('pointermove',function(e){
    var b=bg(); if(!b||!b.classList.contains('show')||!pointers.has(e.pointerId))return;
    e.preventDefault();
    pointers.set(e.pointerId,e);
    if(pointers.size===2){
      var arr=Array.from(pointers.values());
      var d=dist(arr[0],arr[1]); var m=mid(arr[0],arr[1]);
      if(lastDist>0){ zoomAt(scale*(d/lastDist),m.x,m.y); }
      if(lastMid && scale>1){ tx+=m.x-lastMid.x; ty+=m.y-lastMid.y; apply(); }
      lastDist=d; lastMid=m;
    }else if(pointers.size===1 && dragging && lastPoint && scale>1){
      tx+=e.clientX-lastPoint.x; ty+=e.clientY-lastPoint.y;
      lastPoint={x:e.clientX,y:e.clientY}; apply();
    }
  },{capture:true,passive:false});

  document.addEventListener('pointerup',function(e){
    pointers.delete(e.pointerId);
    if(pointers.size<2){lastDist=0;lastMid=null;}
    if(pointers.size===0){
      dragging=false; lastPoint=null;
      var im=img(); if(im) im.classList.remove('dragging');
    }
  },true);
  document.addEventListener('pointercancel',function(e){pointers.delete(e.pointerId);},true);

  document.addEventListener('dblclick',function(e){
    var b=bg(), im=img();
    if(b&&b.classList.contains('show')&&(e.target===im || e.target.id==='gfImageViewerStage')){
      e.preventDefault();
      if(scale>1.2) reset(); else zoomAt(2.4,e.clientX,e.clientY);
    }
  },true);

  document.addEventListener('wheel',function(e){
    var b=bg();
    if(b&&b.classList.contains('show')){
      e.preventDefault();
      zoomAt(scale+(e.deltaY<0?.22:-.22),e.clientX,e.clientY);
    }
  },{passive:false});

  document.addEventListener('click',function(e){
    var b=bg();
    if(b&&b.classList.contains('show')&&e.target===b) window.closeGfImageViewer();
  },true);
  document.addEventListener('keydown',function(e){
    var b=bg();
    if(!b||!b.classList.contains('show'))return;
    if(e.key==='Escape') window.closeGfImageViewer();
    if(e.key==='+' || e.key==='=') window.gfImageZoomIn();
    if(e.key==='-') window.gfImageZoomOut();
    if(e.key==='0') window.gfImageZoomReset();
  });
  window.addEventListener('popstate',function(){
    var b=bg();
    if(b&&b.classList.contains('show')) window.closeGfImageViewer(true);
  });
})();

;
(function(){
  'use strict';
  var PAGE_SIZE=10;
  window.gfTicketsLoadedLimit=Number(window.gfTicketsLoadedLimit||PAGE_SIZE);
  window.gfTicketsTotal=0;
  window.gfTicketsHasMore=false;
  window.gfTicketsLoading=false;
  window.gfTicketsManualLoading=false;
  window.gfTicketStats=null;

  function ensurePagerStyle(){
    if(document.getElementById('gfTicketPagerMobileFix')) return;
    var st=document.createElement('style');
    st.id='gfTicketPagerMobileFix';
    st.textContent=[
      '#gfTicketPager{display:flex;align-items:center;justify-content:center;gap:12px;margin:14px 0 18px;padding:0;}',
      '#gfTicketPager .gfTicketPagerInfo{font-weight:800;opacity:.72;}',
      '#gfTicketPager .gfTicketPagerBtn{border:0;border-radius:16px;padding:13px 22px;font-weight:900;cursor:pointer;box-shadow:0 8px 18px rgba(15,45,80,.12);}',
      '@media (max-width: 760px){',
      '  #pageOperacao .tablebox{min-height:0!important;padding-bottom:10px!important;margin-bottom:10px!important;}',
      '  #gfTicketPager{position:relative!important;inset:auto!important;transform:none!important;margin:10px 8px 14px!important;padding:0!important;width:auto!important;}',
      '  #gfTicketPager .gfTicketPagerInfo{display:none!important;}',
      '  #gfTicketPager .gfTicketPagerBtn{width:100%!important;min-height:46px!important;border-radius:16px!important;}',
      '}'
    ].join('\n');
    document.head.appendChild(st);
  }

  function ensurePager(){
    ensurePagerStyle();
    var table=document.querySelector('#pageOperacao > .tablebox') || document.querySelector('#pageOperacao .tablebox');
    if(!table) return null;
    var box=document.getElementById('gfTicketPager');
    if(!box){
      box=document.createElement('div');
      box.id='gfTicketPager';
      box.className='gfTicketPager';
      box.innerHTML='<span id="gfTicketPagerInfo" class="gfTicketPagerInfo">Carregando chamados...</span><button id="gfTicketLoadMoreBtn" class="gfTicketPagerBtn" type="button" onclick="gfLoadMoreTickets()">Carregar mais 10</button>';
    }
    if(box.parentElement!==table){
      table.appendChild(box);
    }
    return box;
  }

  function updatePager(){
    var box=ensurePager(); if(!box) return;
    var info=document.getElementById('gfTicketPagerInfo');
    var btn=document.getElementById('gfTicketLoadMoreBtn');
    var loaded=Array.isArray(window.tickets)?window.tickets.length:(Array.isArray(tickets)?tickets.length:0);
    var total=Number(window.gfTicketsTotal||loaded||0);
    if(info) info.textContent = total ? ('Mostrando '+loaded+' de '+total+' chamados') : 'Nenhum chamado carregado';
    if(btn){
      btn.style.display = window.gfTicketsHasMore ? '' : 'none';
      btn.disabled = !!window.gfTicketsManualLoading;
      btn.textContent = window.gfTicketsManualLoading ? 'Carregando...' : 'Carregar mais 10';
    }
  }

  function maxIdOf(list){
    list=list||[];
    return Math.max(0,...list.map(function(t){return Number(t&&t.id)||0;}));
  }

  window.loadTickets=async function(){
    if(window.gfTicketsLoading){
      window.gfTicketsPending=true;
      return;
    }
    window.gfTicketsLoading=true; updatePager();
    try{
      var limit=Math.max(Number(window.gfTicketsLoadedLimit||PAGE_SIZE),PAGE_SIZE);
      var r=await fetch(API+'/api/admin/tickets?limit='+encodeURIComponent(limit)+'&offset=0',{credentials:'include',cache:'no-store'});
      if(r.status===401){location.href='/login';return}
      var j=await r.json();
      var nt=j.tickets||[];
      var maxId=maxIdOf(nt);
      var sig=(typeof __gfTicketsSig==='function'?__gfTicketsSig(nt):String(maxId)+':'+String(nt.length));
      var changed=sig!==window.__gfTicketsLastSigV19;
      var manual=!!window.gfTicketsManualLoading;

      if(!firstLoad && maxId>lastMaxId){
        var novos=nt.filter(function(t){return Number(t.id)>Number(lastMaxId||0)}).sort(function(a,b){return Number(a.id)-Number(b.id)});
        try{beep();}catch(e){}
        try{toastMsg('Novo chamado recebido!');}catch(e){}
        try{if(typeof window.gfAppNotifyTickets==='function') window.gfAppNotifyTickets(novos.length?novos:nt.filter(function(t){return Number(t.id)===Number(maxId)}));}catch(e){}
        try{cardOpen.classList.add('flash');setTimeout(function(){cardOpen.classList.remove('flash')},3000)}catch(e){}
      }

      tickets=nt; window.tickets=tickets;
      window.gfTicketsTotal=Number((j.pagination&&j.pagination.total)||nt.length||0);
      window.gfTicketsHasMore=!!(j.pagination&&j.pagination.has_more);
      window.gfTicketStats=j.stats||null;
      lastMaxId=maxId; firstLoad=false;

      if(changed || manual){
        window.__gfTicketsLastSigV19=sig;
        try{
          var pg=String(window.__gfCurrentPage||'dashboard').toLowerCase();
          if(pg==='operacao'){
            if(typeof window.render==='function') window.render();
            if(typeof window.gfRenderMobileTickets==='function') window.gfRenderMobileTickets();
          }else if(pg==='dashboard'){
            if(typeof window.renderDashboardV9Lists==='function') window.renderDashboardV9Lists();
            else if(typeof renderDashboardV9Lists==='function') renderDashboardV9Lists();
          }
        }catch(e){ console.warn('page render',e); }
      }
      updatePager();
    }catch(e){try{toastMsg('Erro ao carregar chamados: '+(e.message||e));}catch(_){}}
    finally{
      window.gfTicketsLoading=false; updatePager();
      if(window.gfTicketsPending){
        window.gfTicketsPending=false;
        setTimeout(function(){ try{ window.loadTickets(); }catch(e){} },250);
      }
    }
  };  try{ window.loadTickets.__gfV19Unified=true; loadTickets=window.loadTickets; }catch(e){}

  window.gfLoadMoreTickets=function(){
    if(window.gfTicketsLoading) return;
    window.gfTicketsManualLoading=true;
    window.gfTicketsLoadedLimit=Number(window.gfTicketsLoadedLimit||PAGE_SIZE)+PAGE_SIZE;
    var done=window.loadTickets();
    if(done && typeof done.finally==='function'){
      return done.finally(function(){ window.gfTicketsManualLoading=false; updatePager(); });
    }
    window.gfTicketsManualLoading=false; updatePager();
    return done;
  };

  document.addEventListener('DOMContentLoaded',function(){ensurePager();updatePager();});
})();

;

(function(){
  'use strict';
  if (window.__gfV200Unified) return;
  window.__gfV200Unified = true;

  function N(v){ return Number(String(v==null?'':v).replace(/[^0-9]/g,''))||0; }
  function arr(v){ return Array.isArray(v)?v:[]; }
  function api(){ try{ return window.API||API||''; }catch(e){ return window.API||''; } }
  function setBodyClass(){
    try{
      var b = document.body || document.querySelector('body');
      if (b && !b.classList.contains('gf-v200')) b.classList.add('gf-v200');
    }catch(e){}
  }
  if (document.body) setBodyClass();
  else document.addEventListener('DOMContentLoaded', setBodyClass);

  function pool(){
    var out=[];
    try{ out=out.concat(arr(window.tickets)); }catch(e){}
    try{ out=out.concat(arr(window.dashboardAllTickets)); }catch(e){}
    try{ out=out.concat(arr(window.dashboardOpenTickets)); }catch(e){}
    try{
      if (window.gfDashboardFilterRowsById){
        Object.keys(window.gfDashboardFilterRowsById).forEach(function(k){
          out.push(window.gfDashboardFilterRowsById[k]);
        });
      }
    }catch(e){}
    var seen={}, clean=[];
    out.forEach(function(t){
      if (!t) return;
      var id = N(t.id || t.ticket_id);
      if (!id || seen[id]) return;
      seen[id] = 1;
      clean.push(t);
    });
    return clean;
  }
  function findById(id){
    id = N(id);
    return pool().find(function(t){ return N(t.id||t.ticket_id) === id; }) || null;
  }

  async function fetchById(id){
    id = N(id); if (!id) return null;
    try{
      var r = await fetch(api() + '/api/admin/tickets/by-db-id/' + encodeURIComponent(id), { credentials:'include' });
      if (r.status === 401){ location.href = '/login'; return null; }
      if (r.ok){
        var j = await r.json().catch(function(){ return null; });
        if (j && j.ok && j.ticket && N(j.ticket.id||j.ticket.ticket_id) === id) return j.ticket;
      }
    }catch(e){}
    try{
      var r2 = await fetch(api() + '/api/admin/tickets', { credentials:'include' });
      if (r2.status === 401){ location.href = '/login'; return null; }
      if (r2.ok){
        var j2 = await r2.json().catch(function(){ return null; });
        var t = arr(j2 && j2.tickets).find(function(x){ return N(x.id||x.ticket_id) === id; });
        if (t) return t;
      }
    }catch(e){}
    return null;
  }
  function upsertLocal(t){
    if (!t) return null;
    try{
      if (typeof window.upsertTicketLocal === 'function'){
        var r = window.upsertTicketLocal(t);
        if (r) return r;
      }
    }catch(e){}
    try{
      if (Array.isArray(window.tickets)){
        var id = N(t.id||t.ticket_id);
        var i = window.tickets.findIndex(function(x){ return N(x.id||x.ticket_id) === id; });
        if (i >= 0) window.tickets[i] = Object.assign({}, window.tickets[i], t);
        else window.tickets.unshift(t);
      }
    }catch(e){}
    return t;
  }

  async function gfOpenTicketCanonical(id){
    id = N(id);
    if (!id){ alert('Chamado inválido.'); return; }

    var t = findById(id);
    if (!t){
      t = await fetchById(id);
    }

    if (!t || N(t.id||t.ticket_id) !== id){
      alert('Não consegui localizar o chamado #' + id + '. Atualize a página e tente novamente.');
      return;
    }
    t = upsertLocal(t) || t;

    try{ if(window.gfSaveDashboardModalContext) window.gfSaveDashboardModalContext(); }catch(e){}

    try{ var f = document.getElementById('dashboardFilterDrawer'); if (f) f.classList.remove('show'); }catch(e){}
    try{ var h = document.getElementById('historyDrawer'); if (h) h.classList.remove('show'); }catch(e){}
    try{ var bg = document.getElementById('drawerBg'); if (bg) bg.classList.add('show'); }catch(e){}

    try{ window.current = t; current = t; }catch(e){ window.current = t; }

    var painted = false;
    function paint(detail){
      if (!detail || N(detail.id||detail.ticket_id) !== id) return;
      detail = upsertLocal(detail) || detail;
      try{ window.current = detail; current = detail; }catch(e){ window.current = detail; }
      if (typeof window.fillDrawerTicket === 'function'){ window.fillDrawerTicket(detail); patchDrawerStatus(detail); painted = true; return; }
      if (typeof fillDrawerTicket === 'function'){ fillDrawerTicket(detail); patchDrawerStatus(detail); painted = true; return; }
    }
    function showHistoryLoading(){
      try{
        var box = document.getElementById('timeline') || document.getElementById('dTimeline') || document.querySelector('.timeline');
        if (!box) return;
        var logs = [];
        try{ logs = parseJsonArray((window.current||current||{}).logs); }catch(e){}
        if (logs && logs.length) return;
        box.innerHTML = '<div class="trackingGuide"><b>Carregando histórico...</b><br>Logs, notas e anexos serão exibidos aqui.</div>';
      }catch(e){}
    }
    paint(t);
    if (painted) showHistoryLoading();

    setTimeout(function(){
      fetchById(id).then(function(fresh){
        if(!fresh || N(fresh.id||fresh.ticket_id)!==id) return;
        var active = window.current || current;
        if(active && N(active.id||active.ticket_id)===id) paint(fresh);
      }).catch(function(e){
        console.warn('Detalhe completo do chamado falhou:', e);
        try{
          var box = document.getElementById('timeline') || document.getElementById('dTimeline') || document.querySelector('.timeline');
          if (box) box.innerHTML = '<div class="trackingGuide"><b>Não foi possível carregar o histórico.</b><br>Tente fechar e abrir o chamado novamente.</div>';
        }catch(_){}
      });
    }, 0);

    if (painted) return;
    if (typeof window.openDrawer === 'function'){ window.openDrawer(id); return; }
  }
  window.gfOpenTicketCanonical = gfOpenTicketCanonical;

  function hasAssigneeReal(t){
    if (!t) return false;
    if (t.assigned_to_user_id != null && String(t.assigned_to_user_id).trim() !== '' && Number(t.assigned_to_user_id) !== 0) return true;
    var n = String(t.assigned_to_name||'').trim();
    return !!(n && !/^(-|área administrativa|area administrativa|equipe)$/i.test(n));
  }
  function effectiveStatus(t){
    var s = String((t&&t.status)||'').trim().toUpperCase();
    if (s === 'DONE' || s === 'RESOLVIDO' || s === 'CLOSED' || s === 'FINALIZADO' || s === 'FECHADO') return 'DONE';
    if (s === 'IN_PROGRESS' || s === 'ANDAMENTO' || s === 'EM ANDAMENTO' || hasAssigneeReal(t)) return 'IN_PROGRESS';
    return 'NEW';
  }
  function statusBadgeHTML(st){
    if (st === 'DONE') return '<span class="badge done">Resolvido</span>';
    if (st === 'IN_PROGRESS') return '<span class="badge progress">Em andamento</span>';
    return '<span class="badge new">Novo</span>';
  }
  function escapeHTML(v){ return String(v==null?'':v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];}); }
  function patchDrawerStatus(t){
    try{
      t = t || window.current;
      if (!t) return;
      var st = effectiveStatus(t);
      if (st === 'IN_PROGRESS' && String(t.status||'').toUpperCase() === 'NEW') t.status = 'IN_PROGRESS';
      var dStatus = document.getElementById('dStatus');
      if (dStatus){
        dStatus.innerHTML = statusBadgeHTML(st);
        if (st === 'IN_PROGRESS' && hasAssigneeReal(t)){
          dStatus.innerHTML += '<small class="gfStatusFixedNote">Chamado já assumido por ' + escapeHTML(t.assigned_to_name||'equipe') + '</small>';
        }
      }
      var dResp = document.getElementById('dResponsible');
      if (dResp) dResp.innerText = t.assigned_to_name || 'Área administrativa';
    }catch(e){}
  }

  function ringOpenRows(){
    try{ if (typeof window.dashboardTicketsInRange === 'function') return arr(window.dashboardTicketsInRange()); }catch(e){}
    return arr(window.dashboardAllTickets) || arr(window.tickets) || [];
  }
  function ringCard(t){
    var id = N(t&&(t.id||t.ticket_id));
    var no = N(t&&t.ticket_number) || id;
    var s  = effectiveStatus(t);
    var b  = statusBadgeHTML(s);
    var meta = [t.asset_name, ((t.asset_brand||'')+' '+(t.asset_model||'')).trim(), t.issue_name]
                .map(function(x){return String(x||'').trim();}).filter(Boolean).join(' · ') || '-';
    var when = '';
    try{ if (typeof fmtBR === 'function') when = fmtBR(t.updated_at||t.created_at) || ''; }catch(e){}
    return '<div class="v9FilterItem" data-gf-ticket-id="'+id+'" data-ticket-id="'+id+'">'
      + '<div class="openLine"><b>#'+escapeHTML(no)+' · '+escapeHTML(t.sector_name||'-')+'</b>'+b+'</div>'
      + '<small>'+escapeHTML(meta)+' · Atualizado: '+escapeHTML(when||'-')+'</small>'
      + '<small>'+escapeHTML(t.description||'Sem descrição.')+'</small>'
      + '<div class="v9FilterActions"><button class="btn btnLight" type="button" data-gf-open-ticket="'+id+'">Ver detalhes</button></div>'
      + '</div>';
  }
  window.gfOpenDashboardRing = function(kind){
    var rows = ringOpenRows();
    var title = 'Chamados do gráfico';
    try{
      window.gfDashboardFilterRowsById = {};
      rows.forEach(function(t){ var id = N(t&&(t.id||t.ticket_id)); if (id) window.gfDashboardFilterRowsById[id] = t; });
    }catch(e){}
    var dfTitle    = document.getElementById('dfTitle');
    var dfSubtitle = document.getElementById('dfSubtitle');
    var dfHint     = document.getElementById('dfHint');
    var dfCount    = document.getElementById('dfCount');
    var dfList     = document.getElementById('dfList');
    if (dfTitle)    dfTitle.innerText    = 'Detalhamento';
    if (dfSubtitle) dfSubtitle.innerText = title;
    if (dfHint)     dfHint.innerText     = 'Clique em um chamado para abrir os detalhes.';
    if (dfCount)    dfCount.innerText    = rows.length + ' ' + (rows.length === 1 ? 'item' : 'itens');
    if (dfList)     dfList.innerHTML     = rows.length ? rows.map(ringCard).join('') : '<div class="empty">Nenhum chamado encontrado.</div>';
    try{
      var bg = document.getElementById('drawerBg'); if (bg) bg.classList.add('show');
      var dd = document.getElementById('dashboardFilterDrawer'); if (dd) dd.classList.add('show');
    }catch(e){}
  };


  function pickTicketId(el){
    if (!el || !el.getAttribute) return 0;
    var v = el.getAttribute('data-gf-ticket-id')
         || el.getAttribute('data-ticket-id')
         || el.getAttribute('data-gf-open-ticket')
         || el.getAttribute('data-gf-assume-ticket')
         || el.getAttribute('data-gf-resolve-ticket');
    if (v) return N(v);
    try{
      var m = String(el.textContent||'').match(/#\s*(\d+)/);
      if (m){
        var no = N(m[1]);
        var t = pool().find(function(x){ return N(x.ticket_number) === no; });
        if (t) return N(t.id||t.ticket_id);
      }
    }catch(e){}
    return 0;
  }
  function kpiTypeFromEl(kpi){
    if (!kpi) return '';
    var t = kpi.getAttribute && kpi.getAttribute('data-gf-dash-type');
    if (t) return t;
    if (kpi.id === 'v8CriticalCard') return 'CRITICAL';
    var st = kpi.querySelector && kpi.querySelector('strong');
    var id = st && st.id;
    return ({v8Open:'OPEN', v8Progress:'PROGRESS', v8Critical:'CRITICAL', v8DoneToday:'DONE_PERIOD', v8Avg:'DONE'})[id] || '';
  }

  var lastOpenId = 0, lastOpenAt = 0;
  function unifiedClick(ev){
    if(window.gfWasTouchScrollClick && window.gfWasTouchScrollClick()){
      var maybe = ev.target && ev.target.closest && ev.target.closest('[data-gf-open-ticket],[data-gf-assume-ticket],[data-gf-resolve-ticket],[data-gf-dash-type],.v8Kpi,.v9Kpi,.v9Ticket,.v9FilterItem,[data-ticket-id],[data-gf-ticket-id]');
      if(maybe){ ev.preventDefault(); ev.stopPropagation(); if(ev.stopImmediatePropagation) ev.stopImmediatePropagation(); return false; }
    }
    var target = ev.target;
    if (!target || !target.closest) return;

    if (target.closest('input,select,textarea,label')) return;

    var act = target.closest('[data-gf-assume-ticket]');
    if (act){
      var aid = N(act.getAttribute('data-gf-assume-ticket') || act.getAttribute('data-gf-ticket-id'));
      if (aid){
        ev.preventDefault(); ev.stopPropagation(); if (ev.stopImmediatePropagation) ev.stopImmediatePropagation();
        if (typeof window.setStatus === 'function') setStatus(aid, 'IN_PROGRESS');
        return;
      }
    }
    var res = target.closest('[data-gf-resolve-ticket]');
    if (res){
      var rid = N(res.getAttribute('data-gf-resolve-ticket') || res.getAttribute('data-gf-ticket-id'));
      if (rid){
        ev.preventDefault(); ev.stopPropagation(); if (ev.stopImmediatePropagation) ev.stopImmediatePropagation();
        if (typeof window.openResolveModal === 'function') openResolveModal(rid);
        return;
      }
    }
    var opn = target.closest('[data-gf-open-ticket]');
    if (opn){
      var oid = N(opn.getAttribute('data-gf-open-ticket') || opn.getAttribute('data-gf-ticket-id'));
      if (oid){
        ev.preventDefault(); ev.stopPropagation(); if (ev.stopImmediatePropagation) ev.stopImmediatePropagation();
        var now = Date.now();
        if (lastOpenId === oid && now - lastOpenAt < 650) return;
        lastOpenId = oid; lastOpenAt = now;
        gfOpenTicketCanonical(oid);
        return;
      }
    }

    var card = target.closest(
      '#dashboardFilterDrawer .v9FilterItem,' +
      '#dfList .v9FilterItem,' +
      '#dashboardFilterDrawer .v9Ticket,' +
      '#dfList .v9Ticket,' +
      '#pageDashboard .v9Ticket,' +
      '#v9CriticalList .v9Ticket,' +
      '#v9LatestList .v9Ticket,' +
      '[data-gf-ticket-id],' +
      '[data-ticket-id]'
    );
    if (card && !target.closest('button,a,.exportMenuWrap,.exportMenuPanel')){
      var cid = pickTicketId(card);
      if (cid){
        ev.preventDefault(); ev.stopPropagation(); if (ev.stopImmediatePropagation) ev.stopImmediatePropagation();
        var now2 = Date.now();
        if (lastOpenId === cid && now2 - lastOpenAt < 650) return;
        lastOpenId = cid; lastOpenAt = now2;
        gfOpenTicketCanonical(cid);
        return;
      }
    }


    var kpi = target.closest('#pageDashboard .v8Kpi,[data-gf-dash-type]');
    if (kpi && !target.closest('button,a')){
      var typ = kpiTypeFromEl(kpi);
      if (typ){
        ev.preventDefault(); ev.stopPropagation(); if (ev.stopImmediatePropagation) ev.stopImmediatePropagation();
        if (typeof window.dashboardFilter === 'function') return setTimeout(function(){ window.dashboardFilter(typ); }, 0);
      }
    }
  }
  window.addEventListener('click', unifiedClick, true);

  function normalizeCards(){
    var sel = '#dashboardFilterDrawer .v9FilterItem,' +
              '#dfList .v9FilterItem,' +
              '#dashboardFilterDrawer .v9Ticket,' +
              '#dfList .v9Ticket,' +
              '#pageDashboard .v9Ticket,' +
              '#v9CriticalList .v9Ticket,' +
              '#v9LatestList .v9Ticket,' +
              '#tbody tr';
    try{
      document.querySelectorAll(sel).forEach(function(card){
        var existing = N(card.getAttribute('data-gf-ticket-id') || card.getAttribute('data-ticket-id'));
        var id = existing;
        if (!id){
          var m = String(card.textContent||'').match(/#\s*(\d+)/);
          if (m){
            var no = N(m[1]);
            var t = pool().find(function(x){ return N(x.ticket_number) === no; });
            if (t) id = N(t.id||t.ticket_id);
          }
        }
        if (id){
          card.setAttribute('data-gf-ticket-id', id);
          card.setAttribute('data-ticket-id', id);
        }
      });
    }catch(e){}
  }
  function gfBootNormalizeCardsOnce(){ if(window.__gfNormalizeCardsBootV20) return; window.__gfNormalizeCardsBootV20=true; setTimeout(normalizeCards,150); }
  if (document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', gfBootNormalizeCardsOnce, {once:true});
  } else {
    gfBootNormalizeCardsOnce();
  }

})();

;
(function(){
  'use strict';
  function hasVisibleDetail(){
    return !!document.querySelector(
      '.drawer.show,#drawer.show,#drawerBg.show,.resolveBg.show,.assetEditDrawer.show,.assetEditBackdrop.show,.history-modal.show,.history-modal-backdrop.show,.gf-modal.show,.gf-modal-backdrop.show,.gfImageViewerBg.show'
    );
  }
  function syncDetailState(){
    try{
      document.body.classList.toggle('gf-detail-open', hasVisibleDetail());
    }catch(e){}
  }
  function wrap(name, after){
    var old=window[name];
    if(typeof old!=='function' || old.__gfV212Wrapped) return;
    var fn=function(){
      var r=old.apply(this, arguments);
      setTimeout(syncDetailState, after || 0);
      return r;
    };
    fn.__gfV212Wrapped=true;
    window[name]=fn;
  }
  function init(){
    wrap('openDrawer', 30);
    wrap('closeDrawer', 30);
    wrap('openResolveModal', 30);
    wrap('closeResolveModal', 30);
    wrap('openAssetEditDrawer', 30);
    wrap('closeAssetEditDrawer', 30);
    wrap('openHistoryDrawer', 30);
    wrap('closeHistoryDrawer', 30);
    var syncTimer=0;
    function scheduleSync(){
      if(syncTimer) return;
      syncTimer=setTimeout(function(){ syncTimer=0; syncDetailState(); },60);
    }
    var mo=new MutationObserver(scheduleSync);
    function observeDetailNodes(){
      try{
        var nodes=document.querySelectorAll('.drawer,#drawer,.drawerBg,#drawerBg,.resolveBg,.assetEditDrawer,.assetEditBackdrop,.history-modal,.history-modal-backdrop,.gf-modal,.gf-modal-backdrop,.gfImageViewerBg');
        nodes.forEach(function(n){ if(!n.__gfDetailObserved){ n.__gfDetailObserved=true; mo.observe(n,{attributes:true,attributeFilter:['class','style']}); } });
      }catch(e){}
    }
    observeDetailNodes();
    setTimeout(observeDetailNodes,500);
    
    document.addEventListener('click',function(){setTimeout(syncDetailState,40);},true);
    document.addEventListener('keydown',function(ev){if(ev.key==='Escape') setTimeout(syncDetailState,40);},true);
    syncDetailState();
    setTimeout(syncDetailState,250);
    setTimeout(syncDetailState,900);
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})();

;
(function(){
  'use strict';
  const idle = window.requestIdleCallback || function(cb){ return setTimeout(function(){ cb({didTimeout:false,timeRemaining:function(){return 0;}}); }, 80); };
  function lazyImgs(root){
    try{ (root||document).querySelectorAll('img').forEach(function(img){ img.loading='lazy'; img.decoding='async'; }); }catch(e){}
  }
  function patchWhenReady(){
    lazyImgs(document);
    document.documentElement.classList.toggle('gf-touch-device', ('ontouchstart' in window) || navigator.maxTouchPoints>0);

    if(typeof window.loadSmartHistory === 'function' && !window.loadSmartHistory.__gfFast){
      const originalLoadSmartHistory = window.loadSmartHistory;
      const smartCache = new Map();
      const running = new Map();
      window.loadSmartHistory = function(id){
        const box = document.getElementById('smartHistory');
        const key = String(id||'');
        if(!key) return;
        if(box && smartCache.has(key)){ box.innerHTML = smartCache.get(key); return; }
        if(running.has(key)) return running.get(key);
        if(box) box.textContent = 'Carregando análise dos últimos 30 dias...';
        const job = new Promise(function(resolve){
          idle(function(){
            Promise.resolve(originalLoadSmartHistory.call(window,id)).catch(function(e){ console.warn('Histórico inteligente falhou:', e); })
            .finally(function(){
              try{ if(box) smartCache.set(key, box.innerHTML); }catch(e){}
              running.delete(key); resolve();
            });
          });
        });
        running.set(key, job);
        return job;
      };
      window.loadSmartHistory.__gfFast = true;
    }

    if(typeof window.renderFiles === 'function' && !window.renderFiles.__gfFast){
      const originalRenderFiles = window.renderFiles;
      window.renderFiles = function(){
        const out = originalRenderFiles.apply(this, arguments);
        lazyImgs(document.getElementById('dFiles') || document);
        return out;
      };
      window.renderFiles.__gfFast = true;
    }


    if(('ontouchstart' in window) || navigator.maxTouchPoints>0){
      document.addEventListener('touchstart', function(){}, {passive:true});
    }
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', patchWhenReady, {once:true});
  else patchWhenReady();
})();

;
(function(){
  'use strict';
  function isMobile(){return window.matchMedia && window.matchMedia('(max-width:768px)').matches;}
  function cleanMobileTop(){
    if(!isMobile()) return;
    try{
      var wrap=document.querySelector('.wrap');
      var tabs=document.querySelector('.appTopbar .tabs, .topbar.appTopbar .tabs');
      if(wrap && tabs && tabs.parentNode!==wrap){
        wrap.insertBefore(tabs, wrap.firstChild);
      }
      document.querySelectorAll('#gfPushTopBtn,.gfPushTopBtn').forEach(function(btn){
        btn.removeAttribute('aria-hidden');
        btn.tabIndex=0;
      });
    }catch(e){}
  }
  function detailOpen(){
    return !!document.querySelector('.drawer.show,#drawer.show,#drawerBg.show,.resolveBg.show,.assetEditDrawer.show,.assetEditBackdrop.show,.history-modal.show,.history-modal-backdrop.show,.gf-modal.show,.gf-modal-backdrop.show,.gfImageViewerBg.show');
  }
  function sync(){
    cleanMobileTop();
    document.body.classList.toggle('gf-detail-open', detailOpen());
  }
  var timer=0;
  function schedule(){ if(timer) return; timer=setTimeout(function(){timer=0;sync();},80); }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',sync,{once:true}); else sync();
  window.addEventListener('resize',schedule,{passive:true});
  document.addEventListener('click',function(){setTimeout(sync,40);},true);
  setTimeout(sync,200);setTimeout(sync,900);
})();

;
(function(){
  'use strict';
  if(window.__gfV215DashboardDeptModalUnico) return;
  window.__gfV215DashboardDeptModalUnico=true;

  function U(v){return String(v==null?'':v).trim().toUpperCase();}
  function NORM(v){return String(v==null?'':v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toUpperCase();}
  function arr(v){return Array.isArray(v)?v:[];}
  function num(v){return Number(String(v==null?'':v).replace(/[^0-9]/g,''))||0;}
  function idOf(t){return num(t && (t.id||t.ticket_id||t.db_id));}
  function ticketNo(t){return String((t&&(t.ticket_number||t.number||t.id))||'').trim()||String(idOf(t));}
  function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
  function ts(v){try{if(typeof window.tsBR==='function') return window.tsBR(v)||0;}catch(e){} var d=Date.parse(String(v||'').replace(' ','T')); return isNaN(d)?0:d;}
  function dayKey(v){
    if(!v) return '';
    try{ if(typeof window.dayKeyBR==='function'){var k=window.dayKeyBR(v); if(k) return k;} }catch(e){}
    var s=String(v); var m=s.match(/^(\d{4})-(\d{2})-(\d{2})/); if(m) return m[1]+'-'+m[2]+'-'+m[3];
    m=s.match(/^(\d{2})\/(\d{2})\/(\d{4})/); if(m) return m[3]+'-'+m[2]+'-'+m[1];
    var d=new Date(s.replace(' ','T')); if(isNaN(d.getTime())) return ''; return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
  }
  function selectedDept(){
    var d=NORM(window.gfDashboardDept||'ALL');
    if(!d || d==='ALL' || d==='TODOS' || d==='TODOS DEPARTAMENTOS') return 'ALL';
    if(d.indexOf('APOIO')>=0 || d.indexOf('SUPORTE')>=0) return 'APOIO';
    if(d.indexOf('MANUT')>=0) return 'MANUTENCAO';
    return 'TI';
  }
  function assetsMap(){
    var m={};
    arr(window.assets).forEach(function(a){ if(a && a.id!=null) m[num(a.id)]=a; });
    return m;
  }
  function deptOf(t){
    var raw=NORM(t&&(t.asset_department||t.department||t.dept||t.sector_department||t.ticket_department));
    if(!raw && t && t.asset_id){ var a=assetsMap()[num(t.asset_id)]; if(a) raw=NORM(a.asset_department||a.department||a.dept); }
    if(raw.indexOf('APOIO')>=0 || raw.indexOf('SUPORTE')>=0) return 'APOIO';
    if(raw.indexOf('MANUT')>=0) return 'MANUTENCAO';
    if(raw.indexOf('TI')>=0 || raw.indexOf('TECNO')>=0 || raw.indexOf('INFORM')>=0) return 'TI';
    return 'TI';
  }
  function deptFilter(rows){
    var d=selectedDept();
    rows=arr(rows);
    if(d==='ALL') return rows.slice();
    return rows.filter(function(t){return deptOf(t)===d;});
  }
  function hasAssignee(t){
    if(!t) return false;
    if(t.assigned_to_user_id!=null && String(t.assigned_to_user_id).trim()!=='' && Number(t.assigned_to_user_id)!==0) return true;
    var n=String(t.assigned_to_name||t.responsible_name||'').trim();
    return !!(n && !/^(-|area administrativa|área administrativa|equipe)$/i.test(n));
  }
  function statusOf(t){
    var s=U(t&&t.status);
    if(['DONE','FINALIZADO','FINALIZADA','RESOLVIDO','RESOLVIDA','FECHADO','FECHADA','CLOSED'].indexOf(s)>=0) return 'DONE';
    if(['IN_PROGRESS','EM_ANDAMENTO','EM ANDAMENTO','ANDAMENTO','ASSUMIDO','ASSUMIDA'].indexOf(s)>=0) return 'IN_PROGRESS';
    if(hasAssignee(t)) return 'IN_PROGRESS';
    return 'NEW';
  }
  function isOpen(t){return statusOf(t)!=='DONE';}
  function isCritical(t){
    if(!isOpen(t)) return false;
    try{ if(typeof window.gfIsOpenNewCritical==='function') return !!window.gfIsOpenNewCritical(t); }catch(e){}
    var created=ts(t&&t.created_at); return created && ((Date.now()-created)/60000)>=2880;
  }
  function inPeriod(t){
    try{ if(typeof window.dashboardTicketInSelectedPeriod==='function') return !!window.dashboardTicketInSelectedPeriod(t); }catch(e){}
    var mode=String(window.dashboardRangeMode||'OPEN_NOW');
    if(mode==='ALL' || mode==='OPEN_NOW') return true;
    var s=String(window.dashboardStartKey||''), e=String(window.dashboardEndKey||'');
    var ck=dayKey(t&&t.created_at), rk=statusOf(t)==='DONE'?dayKey((t&&t.resolved_at)||(t&&t.updated_at)):'';
    function inside(k){ if(!k) return false; if(s&&k<s) return false; if(e&&k>e) return false; return true; }
    return inside(ck)||inside(rk);
  }
  function mergeTickets(){
    var out=[];
    try{out=out.concat(arr(window.tickets));}catch(e){}
    try{out=out.concat(arr(window.dashboardAllTickets));}catch(e){}
    try{out=out.concat(arr(window.dashboardOpenTickets));}catch(e){}
    try{ if(window.gfDashboardFilterRowsById) Object.keys(window.gfDashboardFilterRowsById).forEach(function(k){out.push(window.gfDashboardFilterRowsById[k]);}); }catch(e){}
    var seen={}, clean=[];
    out.forEach(function(t){var id=idOf(t); if(!id||seen[id]) return; seen[id]=1; clean.push(t);});
    return clean;
  }
  function sortRows(rows){return arr(rows).filter(function(t){return idOf(t)>0;}).sort(function(a,b){return (ts(b.updated_at||b.resolved_at||b.created_at)-ts(a.updated_at||a.resolved_at||a.created_at))||idOf(b)-idOf(a);});}
  function currentRows(){return deptFilter(mergeTickets());}
  window.gfDashboardCurrentRowsV215=currentRows;

  document.addEventListener('click',function(ev){
    if(ev.target&&ev.target.closest&&ev.target.closest('[data-dept],#deptAll,#deptTI,#deptManutencao')) setTimeout(refreshAfterDept,80);
  },true);
})();

;
(function(){
  function isStandalone(){
    try{
      if(window.matchMedia && (window.matchMedia('(display-mode: standalone)').matches || window.matchMedia('(display-mode: fullscreen)').matches || window.matchMedia('(display-mode: minimal-ui)').matches)) return true;
    }catch(e){}
    try{ if(window.navigator && window.navigator.standalone === true) return true; }catch(e){}
    try{ if(String(document.referrer || '').indexOf('android-app://') === 0) return true; }catch(e){}
    return false;
  }
  function hideInstallButtonIfApp(){
    if(!isStandalone()) return false;
    try{ document.documentElement.classList.add('gf-pwa-standalone'); }catch(e){}
    try{ document.body && document.body.classList.add('gf-pwa-standalone'); }catch(e){}
    var selectors = ['.gfAppDownloadBtn','#gfMobileAppDownloadBtn','#gfAppDownloadBg'];
    selectors.forEach(function(sel){
      document.querySelectorAll(sel).forEach(function(el){
        el.style.setProperty('display','none','important');
        el.style.setProperty('visibility','hidden','important');
        el.style.setProperty('pointer-events','none','important');
      });
    });
    if(typeof window.openGfAppDownloadModal === 'function' && !window.openGfAppDownloadModal.__gfPwaBlocked){
      window.openGfAppDownloadModal = function(){ return false; };
      window.openGfAppDownloadModal.__gfPwaBlocked = true;
    }
    return true;
  }
  hideInstallButtonIfApp();
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', hideInstallButtonIfApp);
  else hideInstallButtonIfApp();
  window.addEventListener('load', hideInstallButtonIfApp);
  setTimeout(hideInstallButtonIfApp, 300);
  setTimeout(hideInstallButtonIfApp, 1200);
  try{
    ['(display-mode: standalone)','(display-mode: fullscreen)','(display-mode: minimal-ui)'].forEach(function(q){
      var mq = window.matchMedia(q);
      if(mq && mq.addEventListener) mq.addEventListener('change', hideInstallButtonIfApp);
    });
  }catch(e){}
})();

;
(function(){
  function byId(id){ return document.getElementById(id); }
  function markActive(v){
    document.querySelectorAll('#pageOperacao .quick .btn').forEach(function(b){ b.classList.remove('active'); });
    var map={ALL:'qAll',TODAY:'qHoje',CRITICAL:'qCrit',MINE:'qMine',DONE:'qDone'};
    var btn=byId(map[v]||'qAll');
    if(btn) btn.classList.add('active');
  }
  function refreshTickets(){
    try{ if(typeof window.render==='function') window.render(); }catch(e){ console.warn('render quick',e); }
    try{ if(typeof window.gfRenderMobileTickets==='function') window.gfRenderMobileTickets(); }catch(e){}
    try{ if(typeof window.gfRefreshDashboardKpis==='function') window.gfRefreshDashboardKpis(); }catch(e){}
  }
  window.setQuick=function(v){
    v=String(v||'ALL').toUpperCase();
    if(!['ALL','TODAY','CRITICAL','MINE','DONE'].includes(v)) v='ALL';
    try{ quick=v; }catch(e){}
    window.quick=v;
    var sf=byId('statusFilter');
    if(sf) sf.value='';
    markActive(v);
    refreshTickets();
  };
  function bindQuickButtons(){
    var ids={qAll:'ALL',qHoje:'TODAY',qCrit:'CRITICAL',qMine:'MINE',qDone:'DONE'};
    Object.keys(ids).forEach(function(id){
      var btn=byId(id);
      if(!btn || btn.dataset.gfQuickFixed==='1') return;
      btn.dataset.gfQuickFixed='1';
      btn.setAttribute('type','button');
      btn.addEventListener('click',function(ev){
        ev.preventDefault();
        ev.stopPropagation();
        window.setQuick(ids[id]);
      },true);
    });
    try{ window.quick=window.quick||quick||'ALL'; }catch(e){ window.quick=window.quick||'ALL'; }
    markActive(window.quick||'ALL');
  }
  function gfBootQuickButtonsOnce(){ if(window.__gfQuickButtonsBootV20) return; window.__gfQuickButtonsBootV20=true; setTimeout(bindQuickButtons,200); }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',gfBootQuickButtonsOnce,{once:true}); else gfBootQuickButtonsOnce();
})();

;
(function(){
  function arr(){
    try{ if(Array.isArray(window.tickets)) return window.tickets; }catch(e){}
    try{ if(Array.isArray(tickets)) return tickets; }catch(e){}
    return [];
  }
  function up(v){ return String(v||'').trim().toUpperCase(); }
  function isDone(t){ return up(t&&t.status)==='DONE'; }
  function setText(id,v){ var el=document.getElementById(id); if(el) el.innerText=String(v); }
  function ticketDept(t){
    var d=up(t&&t.asset_department);
    if(d.indexOf('MANUT')>=0) return 'MANUTENCAO';
    if(d==='APOIO') return 'APOIO';
    if(d==='SERVICOS'||d==='SERVIÇOS'||d==='SERVICE') return 'SERVICOS';
    return d || 'TI';
  }
  function deptOk(t){
    var f=up(window.gfOpDept||'ALL');
    if(!f || f==='ALL') return true;
    return ticketDept(t)===f;
  }
  function toTime(v){
    if(!v) return 0;
    var s=String(v).trim();
    if(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}/.test(s)) s=s.replace(' ','T')+'Z';
    var d=new Date(s);
    return isNaN(d.getTime())?0:d.getTime();
  }
  function today(t){
    var v=(t&&t.created_at)||'';
    try{ if(typeof window.isToday==='function') return window.isToday(v); }catch(e){}
    var ms=toTime(v); if(!ms) return false;
    var d=new Date(ms), n=new Date();
    return d.getFullYear()===n.getFullYear() && d.getMonth()===n.getMonth() && d.getDate()===n.getDate();
  }
  function critical(t){
    try{ if(typeof window.gfIsOpenNewCritical==='function') return !!window.gfIsOpenNewCritical(t); }catch(e){}
    if(isDone(t)) return false;
    var ms=toTime(t&&t.created_at); if(!ms) return false;
    return (Date.now()-ms) >= (2*24*60*60*1000);
  }
  function matchSearchAndStatus(t){
    var q=''; try{ q=(document.getElementById('search')||{}).value||''; }catch(e){}
    q=String(q).trim().toLowerCase().replace(/^#/,'');
    var st=''; try{ st=(document.getElementById('statusFilter')||{}).value||''; }catch(e){}
    var no=String((t&&t.ticket_number)||((t&&t.id)||''));
    var txt=[no,'#'+no,t&&t.id,t&&t.sector_name,t&&t.asset_name,t&&t.asset_brand,t&&t.asset_model,t&&t.asset_department,t&&t.issue_name,t&&t.description,t&&t.patrimonio,t&&t.assigned_to_name,t&&t.status].join(' ').toLowerCase();
    return (!q || txt.indexOf(q)>=0) && (!st || up(t&&t.status)===up(st));
  }
  function quickOk(t){
    var q=up(window.quick||'ALL');
    if(q==='TODAY') return today(t);
    if(q==='CRITICAL') return critical(t);
    if(q==='MINE'){
      var mid=0; try{ mid=Number((window.me||me||{}).id||0); }catch(e){}
      return !!mid && Number(t&&t.assigned_to_user_id)===mid;
    }
    if(q==='DONE') return isDone(t);
    return true;
  }
  window.gfOperationRowsForCards=function(){
    return arr().filter(function(t){ return deptOk(t) && matchSearchAndStatus(t) && quickOk(t); });
  };
  function refreshCards(){
    var rows=window.gfOperationRowsForCards();
    setText('cOpen', rows.filter(function(t){ return up(t&&t.status)==='NEW'; }).length);
    setText('cProgress', rows.filter(function(t){ return up(t&&t.status)==='IN_PROGRESS'; }).length);
    setText('cCritical', rows.filter(critical).length);
    setText('cDone', rows.filter(isDone).length);
    var done=rows.filter(function(t){ return isDone(t) && (t&&t.resolved_at); });
    var avg=0;
    if(done.length){
      var total=0, n=0;
      done.forEach(function(t){ var a=toTime(t.created_at), b=toTime(t.resolved_at); if(a&&b&&b>=a){ total+=(b-a)/60000; n++; } });
      avg=n?Math.round(total/n):0;
    }
    setText('cAvg', avg+'m');
    var rank={};
    done.forEach(function(t){ var nm=(t&&t.assigned_to_name)||'Equipe'; rank[nm]=(rank[nm]||0)+1; });
    var r=document.getElementById('ranking');
    if(r) r.innerHTML=Object.keys(rank).map(function(k){return [k,rank[k]];}).sort(function(a,b){return b[1]-a[1];}).slice(0,3).map(function(x){return x[0]+': <b>'+x[1]+'</b>';}).join('<br>') || '-';
  }
  window.count=refreshCards;
  try{ count=refreshCards; }catch(e){}
  function refreshAll(){
    try{ refreshCards(); }catch(e){}
    if(window.__gfRefreshCardsTimerV20) clearTimeout(window.__gfRefreshCardsTimerV20);
    window.__gfRefreshCardsTimerV20=setTimeout(function(){ window.__gfRefreshCardsTimerV20=0; try{ refreshCards(); }catch(e){} },120);
  }
  document.addEventListener('click',function(ev){ if(ev.target && ev.target.closest && ev.target.closest('#pageOperacao .quick .btn')) refreshAll(); },true);
  document.addEventListener('input',function(ev){ if(ev.target && (ev.target.id==='search'||ev.target.id==='statusFilter')) refreshAll(); },true);
  document.addEventListener('change',function(ev){ if(ev.target && (ev.target.id==='search'||ev.target.id==='statusFilter')) refreshAll(); },true);
  function gfBootRefreshAllOnce(){ if(window.__gfRefreshAllBootV20) return; window.__gfRefreshAllBootV20=true; setTimeout(refreshAll,500); }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',gfBootRefreshAllOnce,{once:true}); else gfBootRefreshAllOnce();
})();

;

;
(function(){
  'use strict';
  if(window.__gfV215ResolveModalOverDrawer) return;
  window.__gfV215ResolveModalOverDrawer = true;

  function bringResolveToFront(){
    var bg = document.getElementById('resolveBg');
    if(!bg) return;
    if(bg.parentElement !== document.body){
      document.body.appendChild(bg);
    }
    bg.classList.add('show');
    document.body.classList.add('resolveOpen');
    bg.style.zIndex = '60000';
    var modal = bg.querySelector('.resolveModal');
    if(modal){
      modal.style.zIndex = '60010';
      modal.scrollTop = 0;
    }
    bg.scrollTop = 0;
    setTimeout(function(){
      try{
        bg.scrollTop = 0;
        if(modal) modal.scrollTop = 0;
        var first = document.getElementById('resolveSolution');
        if(first) first.focus({preventScroll:true});
      }catch(e){}
    },80);
  }

  document.addEventListener('keydown', function(ev){
    if(ev.key === 'Escape' && document.getElementById('resolveBg')?.classList.contains('show')){
      window.closeResolveModal();
    }
  }, true);
})();

;
(function(){
  const API_BASE = (typeof API !== 'undefined' ? API : window.location.origin);
  let gfIssueServices = [];
  let gfIssueAssets = [];

  function norm(v){
    return String(v||'')
      .normalize('NFD').replace(/[\u0300-\u036f]/g,'')
      .toUpperCase().replace(/[^A-Z0-9]+/g,' ')
      .trim();
  }
  function key(v){ return norm(v).replace(/\s+/g,''); }
  function esc(v){
    if(typeof escapeAttr === 'function') return escapeAttr(v);
    return String(v||'').replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  }
  function serviceDisplayName(v){
    const k = norm(v);
    if(k === 'LAMPADA') return 'LÂMPADA';
    if(k === 'ELETRICA') return 'ELÉTRICA';
    if(k === 'HIDRAULICA') return 'HIDRÁULICA';
    if(k === 'MANUTENCAO PREDIAL') return 'MANUTENÇÃO PREDIAL';
    if(k === 'REQUISICAO') return 'REQUISIÇÃO';
    return String(v||'').trim();
  }
  function selectedIssueKind(){
    const el = document.getElementById('issueItemKind');
    return String(el?.value || 'EQUIPMENT').toUpperCase() === 'SERVICE' ? 'SERVICE' : 'EQUIPMENT';
  }
  function setIssuePlaceholder(){
    const input = document.getElementById('issueAssetName');
    const kind = selectedIssueKind();
    if(input){
      input.placeholder = kind === 'SERVICE' ? 'Serviço ex: LÂMPADA' : 'Equipamento ex: Ar-condicionado';
      input.setAttribute('list', kind === 'SERVICE' ? 'issueServiceOptions' : 'issueEquipmentOptions');
    }
    const fAsset = document.getElementById('issueFilterAsset');
    if(fAsset && fAsset.options && fAsset.options[0]){
      fAsset.options[0].textContent = 'Todos equipamentos/serviços';
    }
  }
  function ensureIssueKindUI(){
    const form = document.querySelector('.cadProForm.issueForm');
    const input = document.getElementById('issueAssetName');
    if(!form || !input || document.getElementById('issueItemKind')) return;

    const sel = document.createElement('select');
    sel.id = 'issueItemKind';
    sel.innerHTML = '<option value="EQUIPMENT">Equipamento</option><option value="SERVICE">Serviço</option>';
    sel.onchange = function(){
      if(input) input.value = '';
      setIssuePlaceholder();
    };
    form.insertBefore(sel, input);

    const dlEq = document.createElement('datalist');
    dlEq.id = 'issueEquipmentOptions';
    const dlSvc = document.createElement('datalist');
    dlSvc.id = 'issueServiceOptions';
    document.body.appendChild(dlEq);
    document.body.appendChild(dlSvc);

    const css = document.createElement('style');
    css.textContent = `
      .cadProForm.issueForm{grid-template-columns:.75fr 1.15fr 1.35fr .7fr auto!important}
      @media(max-width:1050px){.cadProForm.issueForm{grid-template-columns:1fr 1fr!important}}
      @media(max-width:700px){.cadProForm.issueForm{grid-template-columns:1fr!important}}
    `;
    document.head.appendChild(css);
    setIssuePlaceholder();
  }

  async function fetchJson(url, opts){
    const r = await fetch(url, Object.assign({cache:'no-store'}, opts||{}));
    return await r.json();
  }
  async function loadIssueSources(){
    try{
      const aj = await fetchJson(API_BASE + '/api/admin/assets');
      gfIssueAssets = Array.isArray(aj.assets) ? aj.assets.filter(a => {
        const k = String(a.asset_kind || a.kind || '').toUpperCase();
        return k !== 'SERVICE' && String(a.status || 'ACTIVE').toUpperCase() === 'ACTIVE';
      }) : [];
    }catch(e){ gfIssueAssets = []; }

    try{
      const sj = await fetchJson(API_BASE + '/api/admin/service-groups');
      gfIssueServices = Array.isArray(sj.services) ? sj.services.filter(s => Number(s.active ?? 1) === 1) : [];
    }catch(e){ gfIssueServices = []; }

    const dlEq = document.getElementById('issueEquipmentOptions');
    if(dlEq) dlEq.innerHTML = gfIssueAssets
      .slice().sort((a,b)=>String(a.name||'').localeCompare(String(b.name||''),'pt-BR'))
      .map(a=>`<option value="${esc(a.name||'')}"></option>`).join('');

    const dlSvc = document.getElementById('issueServiceOptions');
    if(dlSvc) dlSvc.innerHTML = gfIssueServices
      .slice().sort((a,b)=>String(a.name||'').localeCompare(String(b.name||''),'pt-BR'))
      .map(s=>`<option value="${esc(s.name||'')}"></option>`).join('');

    try{
      const activeServicesAsAssets = gfIssueServices.map(s=>({
        id:s.id || s.service_id,
        service_id:s.service_id || s.id,
        name:s.name,
        asset_name:s.name,
        asset_kind:'SERVICE',
        status:'ACTIVE',
        sector_id:'',
        sector_name:'',
        service_key:s.service_key || s.name
      }));
      if(Array.isArray(issueFilterAssets)){
        const base = issueFilterAssets.filter(a => String(a.asset_kind||'').toUpperCase() !== 'SERVICE');
        issueFilterAssets = base.concat(activeServicesAsAssets);
      }
    }catch(e){}
  }
  function findEquipmentByName(value){
    const k = key(value);
    let list = [];
    try{ if(Array.isArray(gfIssueAssets) && gfIssueAssets.length) list = gfIssueAssets; }catch(e){}
    if(!list.length){
      try{ list = Array.isArray(assets) ? assets : []; }catch(e){ list = []; }
    }
    return list.find(a => key(a.name) === k && String(a.asset_kind||'').toUpperCase() !== 'SERVICE') || null;
  }
  function findServiceByName(value){
    const k = key(value);
    return (gfIssueServices || []).find(s =>
      key(s.name) === k || key(s.service_key) === k || key(s.legacy_asset_name) === k
    ) || null;
  }

  window.gfIssueRefreshSources = async function(){
    ensureIssueKindUI();
    await loadIssueSources();
    setIssuePlaceholder();
    try{ if(typeof refreshIssueQuickFilters === 'function') refreshIssueQuickFilters(); }catch(e){}
  };

  const oldValid = window.validAssetNameTyped;
  window.validAssetNameTyped = function(value){
    const kind = selectedIssueKind();
    if(kind === 'SERVICE'){
      const svc = findServiceByName(value);
      if(svc) return { id: svc.id || svc.service_id, service_id: svc.service_id || svc.id, name: svc.name, asset_kind:'SERVICE', service_key: svc.service_key || svc.name };
    }
    const eq = findEquipmentByName(value);
    if(eq) return eq;
    if(typeof oldValid === 'function') return oldValid(value);
    return null;
  };

  window.saveIssue = async function(){
    if(typeof guardAction === 'function' && !guardAction('admin')) return;
    await window.gfIssueRefreshSources();

    const kind = selectedIssueKind();
    const itemValue = document.getElementById('issueAssetName')?.value || '';
    const problem = String(document.getElementById('issueName')?.value || '').trim();
    const priority = document.getElementById('issuePriority')?.value || 'MEDIUM';

    if(!problem){
      alert('Informe o nome do problema.');
      document.getElementById('issueName')?.focus();
      return;
    }

    if(kind === 'SERVICE'){
      const svc = findServiceByName(itemValue);
      if(!svc){
        alert('Selecione um serviço válido da lista. Exemplo: LÂMPADA.');
        document.getElementById('issueAssetName')?.focus();
        return;
      }
      const serviceKey = encodeURIComponent(svc.service_key || svc.name || itemValue);
      const body = { name: problem, priority, service_id: svc.service_id || svc.id, asset_name: serviceDisplayName(svc.name || itemValue) };
      const j = await fetchJson(API_BASE + '/api/admin/service-groups/' + serviceKey + '/issues', {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify(body)
      });
      if(!j.ok) return alert(j.error || 'Erro ao cadastrar problema do serviço');
    }else{
      const asset = findEquipmentByName(itemValue);
      if(!asset){
        alert('Selecione um equipamento válido da lista.');
        document.getElementById('issueAssetName')?.focus();
        return;
      }
      const body = { asset_name: asset.name, name: problem, priority };
      const j = await fetchJson(API_BASE + '/api/admin/issues', {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify(body)
      });
      if(!j.ok) return alert(j.error || 'Erro ao cadastrar problema');
    }

    const issueAssetName = document.getElementById('issueAssetName');
    const issueName = document.getElementById('issueName');
    if(issueAssetName) issueAssetName.value = '';
    if(issueName) issueName.value = '';
    try{ if(typeof loadIssues === 'function') gfInvalidateIssuesCacheV30();await loadIssues(true); }catch(e){}
    try{ if(typeof toastMsg === 'function') toastMsg('Problema cadastrado'); }catch(e){}
  };

  document.addEventListener('DOMContentLoaded', function(){
    ensureIssueKindUI();
    setTimeout(window.gfIssueRefreshSources, 800);
  });
  setTimeout(window.gfIssueRefreshSources, 1500);
})();

;
(function(){
  const API_BASE = (typeof API !== 'undefined' ? API : window.location.origin);
  window.gfIssueServiceGroups = window.gfIssueServiceGroups || [];

  function norm(v){
    return String(v||'')
      .normalize('NFD').replace(/[\u0300-\u036f]/g,'')
      .toUpperCase().replace(/[^A-Z0-9]+/g,' ')
      .trim();
  }
  function key(v){ return norm(v).replace(/\s+/g,''); }
  function esc(v){
    if(typeof escapeAttr === 'function') return escapeAttr(v);
    return String(v||'').replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  }

  function issueKindFilterValue(){
    const el=document.getElementById('issueFilterKind');
    const v=String(el?.value||'ALL').toUpperCase();
    return ['ALL','EQUIPMENT','SERVICE'].includes(v)?v:'ALL';
  }

  function serviceKeys(){
    const set = new Set();
    (window.gfIssueServiceGroups||[]).forEach(s=>{
      [s.name,s.service_key,s.legacy_asset_name].forEach(v=>{ const k=key(v); if(k) set.add(k); });
    });
    return set;
  }

  function issueIsService(issue){
    const k = key(issue?.asset_name);
    return !!k && serviceKeys().has(k);
  }

  function serviceHasSector(issue, sectorId){
    if(!sectorId) return true;
    const k = key(issue?.asset_name);
    const svc = (window.gfIssueServiceGroups||[]).find(s =>
      [s.name,s.service_key,s.legacy_asset_name].some(v=>key(v)===k)
    );
    if(!svc) return false;
    const ids = Array.isArray(svc.sector_ids) ? svc.sector_ids.map(String) : [];
    const sectors = Array.isArray(svc.sectors) ? svc.sectors.map(s=>String(s.id||s.sector_id||'')) : [];
    return ids.concat(sectors).includes(String(sectorId));
  }

  async function refreshServiceGroups(){
    try{
      const r = await fetch(API_BASE + '/api/admin/service-groups', {cache:'no-store'});
      const j = await r.json();
      window.gfIssueServiceGroups = Array.isArray(j.services) ? j.services.filter(s=>Number(s.active ?? 1)===1) : [];
    }catch(e){
      console.warn('service groups issue filter', e);
      window.gfIssueServiceGroups = window.gfIssueServiceGroups || [];
    }

    let dlSvc = document.getElementById('issueServiceOptions');
    if(!dlSvc){
      dlSvc = document.createElement('datalist');
      dlSvc.id = 'issueServiceOptions';
      document.body.appendChild(dlSvc);
    }
    dlSvc.innerHTML = (window.gfIssueServiceGroups||[])
      .slice()
      .sort((a,b)=>String(a.name||'').localeCompare(String(b.name||''),'pt-BR'))
      .map(s=>`<option value="${esc(s.name||s.service_key||'')}"></option>`)
      .join('');
  }

  function ensureKindFilter(){
    const box = document.querySelector('.issueQuickFilters');
    const assetSel = document.getElementById('issueFilterAsset');
    if(box && assetSel && !document.getElementById('issueFilterKind')){
      const sel = document.createElement('select');
      sel.id = 'issueFilterKind';
      sel.innerHTML = '<option value="ALL">Equipamentos e serviços</option><option value="EQUIPMENT">Só equipamentos</option><option value="SERVICE">Só serviços</option>';
      sel.onchange = function(){
        const a=document.getElementById('issueFilterAsset'); if(a) a.value='';
        if(typeof refreshIssueQuickFilters === 'function') refreshIssueQuickFilters();
        if(typeof renderIssues === 'function') renderIssues();
      };
      box.insertBefore(sel, assetSel);
    }
  }

  function equipmentHasSector(issue, sectorId){
    if(!sectorId) return true;
    if(typeof issueHasAssetInSector === 'function') return issueHasAssetInSector(issue, sectorId);
    return true;
  }

  const oldRefresh = window.refreshIssueQuickFilters;
  window.refreshIssueQuickFilters = function(){
    ensureKindFilter();

    const sectorSel=document.getElementById('issueFilterSector');
    const assetSel=document.getElementById('issueFilterAsset');
    if(!sectorSel || !assetSel){
      if(typeof oldRefresh === 'function') oldRefresh();
      return;
    }

    const oldSector=sectorSel.value||'';
    const oldAsset=assetSel.value||'';

    const sectorOptions=(Array.isArray(sectors)?sectors:[]).slice().sort((a,b)=>String(a.name||'').localeCompare(String(b.name||''),'pt-BR'));
    sectorSel.innerHTML='<option value="">Todos os setores</option>'+sectorOptions.map(s=>`<option value="${esc(s.id)}">${esc(s.name||'-')}</option>`).join('');
    if([...sectorSel.options].some(o=>o.value===oldSector)) sectorSel.value=oldSector;

    const sectorId=sectorSel.value||'';
    const kind=issueKindFilterValue();

    const names=[...new Set((Array.isArray(issues)?issues:[])
      .filter(i=>{
        const isSvc=issueIsService(i);
        if(kind==='SERVICE' && !isSvc) return false;
        if(kind==='EQUIPMENT' && isSvc) return false;
        if(sectorId){
          if(isSvc) return serviceHasSector(i, sectorId);
          return equipmentHasSector(i, sectorId);
        }
        return true;
      })
      .map(i=>String(i.asset_name||'').trim())
      .filter(Boolean))]
      .sort((a,b)=>a.localeCompare(b,'pt-BR'));

    const first = kind==='SERVICE' ? 'Todos serviços' : (kind==='EQUIPMENT' ? 'Todos equipamentos' : 'Todos equipamentos/serviços');
    assetSel.innerHTML=`<option value="">${first}</option>`+names.map(n=>`<option value="${esc(n)}">${esc(n)}</option>`).join('');
    if([...assetSel.options].some(o=>o.value===oldAsset)) assetSel.value=oldAsset;
    else assetSel.value='';
  };

  window.issueFilteredList = function(){
    const sectorId=document.getElementById('issueFilterSector')?.value||'';
    const assetName=document.getElementById('issueFilterAsset')?.value||'';
    const q=(typeof issueNorm === 'function') ? issueNorm(document.getElementById('issueFilterSearch')?.value||'') : String(document.getElementById('issueFilterSearch')?.value||'').toLowerCase();
    const assetK=(typeof issueKey === 'function') ? issueKey(assetName) : key(assetName);
    const kind=issueKindFilterValue();

    return (Array.isArray(issues)?issues:[]).filter(i=>{
      const isSvc=issueIsService(i);
      if(kind==='SERVICE' && !isSvc) return false;
      if(kind==='EQUIPMENT' && isSvc) return false;

      if(sectorId){
        if(isSvc){
          if(!serviceHasSector(i, sectorId)) return false;
        }else if(typeof issueHasAssetInSector === 'function' && !issueHasAssetInSector(i, sectorId)){
          return false;
        }
      }

      const iKey=(typeof issueKey === 'function') ? issueKey(i.asset_name) : key(i.asset_name);
      if(assetK && iKey!==assetK) return false;

      if(q){
        const txt=(typeof issueNorm === 'function')
          ? issueNorm([i.asset_name,i.name,i.priority,typeof priorityText==='function'?priorityText(i.priority):''].join(' '))
          : String([i.asset_name,i.name,i.priority].join(' ')).toLowerCase();
        if(!txt.includes(q)) return false;
      }
      return true;
    });
  };

  document.addEventListener('change', function(ev){
    if(ev.target && ev.target.id === 'issueItemKind'){
      const input=document.getElementById('issueAssetName');
      if(input){
        input.value='';
        input.setAttribute('list', String(ev.target.value).toUpperCase()==='SERVICE' ? 'issueServiceOptions' : 'issueEquipmentOptions');
        input.placeholder = String(ev.target.value).toUpperCase()==='SERVICE' ? 'Serviço ex: LÂMPADA' : 'Equipamento ex: Ar-condicionado';
      }
    }
  }, true);

  async function boot(){
    ensureKindFilter();
    await refreshServiceGroups();
    if(typeof window.gfIssueRefreshSources === 'function') {
      try{ await window.gfIssueRefreshSources(); }catch(e){}
    }
    if(typeof refreshIssueQuickFilters === 'function') refreshIssueQuickFilters();
    if(typeof renderIssues === 'function') renderIssues();
  }

  function gfBootIssuesOnce(){
    if(window.__gfIssuesBootV23) return;
    window.__gfIssuesBootV23 = true;
    setTimeout(boot, 500);
  }

  /* Problemas não carregam na abertura do site; só quando abrir o módulo. */
})();

;
(function(){
  'use strict';
  if(window.__gfInativosSeparatedV1) return;
  window.__gfInativosSeparatedV1=true;
  var API_BASE=(typeof API!=='undefined'&&API)?API:'';
  var serviceGroupsCache=[];
  function byId(id){return document.getElementById(id)}
  function esc(v){ if(typeof escapeAttr==='function') return escapeAttr(v); return String(v==null?'':v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c];}); }
  function N(v){return String(v==null?'':v).trim().toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');}
  function norm(v){return String(v==null?'':v).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim();}
  function key(v){return N(v).replace(/[^A-Z0-9]+/g,'');}
  function selectedAssetKind(){var v=N(byId('assetFilterKind')&&byId('assetFilterKind').value||'EQUIPMENT'); if(v.indexOf('SERV')>=0)return'SERVICE'; if(v.indexOf('EQUIP')>=0)return'EQUIPMENT'; return '';}
  function assetStatusMode(){var v=N(byId('assetFilterStatus')&&byId('assetFilterStatus').value||'ACTIVE'); return ['ACTIVE','INACTIVE','ALL'].includes(v)?v:'ACTIVE';}
  function issueStatusMode(){var v=N(byId('issueFilterStatus')&&byId('issueFilterStatus').value||'ACTIVE'); return ['ACTIVE','INACTIVE','ALL'].includes(v)?v:'ACTIVE';}
  function statusOf(a){return N(a&&a.status||'ACTIVE')||'ACTIVE';}
  function isActiveStatus(a){return statusOf(a)==='ACTIVE';}
  function kindOf(a){var k=N(a&& (a.asset_kind||a.kind)); if(k.indexOf('SERV')>=0)return'SERVICE'; return 'EQUIPMENT';}
  function fetchJson(url,opt){return fetch(url,Object.assign({cache:'no-store'},opt||{})).then(function(r){return r.json();});}
  function ensureAssetStatusFilter(){
    var kind=byId('assetFilterKind'); if(!kind || byId('assetFilterStatus')) return;
    var sel=document.createElement('select'); sel.id='assetFilterStatus'; sel.className='gfInactiveFilterSelect';
    sel.innerHTML='<option value="ACTIVE">Ativos</option><option value="INACTIVE">Inativos</option><option value="ALL">Todos</option>';
    sel.onchange=function(){ var a=byId('assetFilterAsset'); if(a)a.value=''; if(typeof window.loadAssets==='function') window.loadAssets(); };
    kind.insertAdjacentElement('afterend', sel);
  }
  function ensureIssueStatusFilter(){
    var box=document.querySelector('.issueQuickFilters'); var assetSel=byId('issueFilterAsset'); if(!box || !assetSel || byId('issueFilterStatus')) return;
    var sel=document.createElement('select'); sel.id='issueFilterStatus'; sel.className='gfInactiveFilterSelect';
    sel.innerHTML='<option value="ACTIVE">Ativos</option><option value="INACTIVE">Inativos</option><option value="ALL">Todos</option>';
    sel.onchange=function(){ if(typeof window.refreshIssueQuickFilters==='function') window.refreshIssueQuickFilters(); if(typeof window.renderIssues==='function') window.renderIssues(); };
    box.insertBefore(sel, assetSel);
  }
  function statusBadge(v){
    var s=N(v||'ACTIVE');
    if(typeof assetStatusBadge==='function') return assetStatusBadge(s);
    return s==='ACTIVE'?'<span class="badge activeB">Ativo</span>':'<span class="badge offB">Inativo</span>';
  }
  function activeLabel(){return assetStatusMode()==='INACTIVE'?'inativo(s)':(assetStatusMode()==='ALL'?'cadastrado(s)':'ativo(s)');}
  function semInfo(a){var chips=[]; if(a.sp_identificacao)chips.push('🔎 '+esc(a.sp_identificacao)); if(a.sp_responsavel)chips.push('👤 '+esc(a.sp_responsavel)); if(a.sp_local)chips.push('📍 '+esc(a.sp_local)); if(a.sp_obs)chips.push('📝 '+esc(a.sp_obs)); return chips.length?'<small class="assetSpMini">'+chips.map(function(c){return '<span>'+c+'</span>';}).join('')+'</small>':'';}
  function cardAsset(a){
    var active=isActiveStatus(a); var id=esc(a.id);
    var pat=(typeof displayPatrimonio==='function')?displayPatrimonio(a):esc(a.patrimonio||a.sp_identificacao||'Sem patrimônio');
    var dept=(typeof assetDepartmentBadge==='function')?assetDepartmentBadge(a.asset_department):esc(a.asset_department||'');
    var kb=(typeof assetKindBadge==='function')?assetKindBadge(a):(kindOf(a)==='SERVICE'?'🧩 Serviço':'🧰 Equipamento');
    var icon=(typeof assetKindIcon==='function')?assetKindIcon(a):(kindOf(a)==='SERVICE'?'🧩':'💻');
    return '<div class="gfCleanCard gfAssetCardNew '+(!active?'gfInactiveCard':'')+'"><div class="gfCardAccent"></div><div class="gfCardIcon">'+icon+'</div><div class="gfCardMain"><div class="gfCardTop"><h3>'+esc(a.name||'-')+'</h3>'+statusBadge(a.status)+'</div><div class="gfCardMeta"><span><b>'+pat+'</b></span><span>'+esc(a.sector_name||'-')+'</span><span>'+dept+'</span><span>'+kb+'</span></div><div class="gfCardSpecs"><span>Marca: <b>'+esc(a.brand||'-')+'</b></span><span>Modelo: <b>'+esc(a.model||'-')+'</b></span></div>'+semInfo(a)+'<div class="gfHiddenInputs adminOnly"><input value="'+esc(a.patrimonio||'')+'" id="ap'+id+'"><input value="'+esc(a.name||'')+'" id="an'+id+'"><input value="'+esc(a.brand||'')+'" id="ab'+id+'" placeholder="Marca"><input value="'+esc(a.model||'')+'" id="am'+id+'" placeholder="Modelo"></div></div><div class="gfTransferBox adminOnly"><label>Transferir para</label><select id="tr'+id+'">'+(typeof optSectors==='function'?optSectors(a.sector_id):'')+'</select></div><div class="gfCardActions"><button class="btn btnDark adminOnly" onclick="openAssetEditDrawer('+id+')">Editar</button>'+(active?'<button class="btn btnWarn adminOnly" onclick="transferAsset('+id+')">Transferir</button>':'')+'<button class="btn btnLight" onclick="openAssetHistory('+id+')">Histórico</button><button class="btn btnLight adminOnly" onclick="toggleAsset('+id+',\''+(active?'INACTIVE':'ACTIVE')+'\')">'+(active?'Desativar':'Ativar')+'</button></div></div>';
  }
  function refreshAssetOptions(rows){
    var sel=byId('assetFilterAsset'); if(!sel) return;
    var old=sel.value||'', k=selectedAssetKind(), mode=assetStatusMode();
    var filtered=(rows||[]).filter(function(a){ if(k&&kindOf(a)!==k)return false; if(mode==='ACTIVE'&&!isActiveStatus(a))return false; if(mode==='INACTIVE'&&isActiveStatus(a))return false; return true; });
    var label=k==='SERVICE'?'Todos serviços':(k===''?'Todos itens':'Todos equipamentos físicos');
    sel.innerHTML='<option value="">'+label+'</option>'+filtered.map(function(a){var pat=(typeof plainPatrimonio==='function'?plainPatrimonio(a):(a.patrimonio||a.sp_identificacao||'Sem patrimônio')); return '<option value="'+esc(a.id)+'">'+esc((a.name||'-')+' • '+pat+(a.sector_name?' • '+a.sector_name:''))+'</option>';}).join('');
    if([].slice.call(sel.options).some(function(o){return o.value===old;})) sel.value=old;
  }
  function renderAssetRows(){
    ensureAssetStatusFilter();
    var all=Array.isArray(window.assets)?window.assets:(typeof assets!=='undefined'&&Array.isArray(assets)?assets:[]);
    refreshAssetOptions(all);
    var q=norm(byId('assetSearch')&&byId('assetSearch').value||''), selected=byId('assetFilterAsset')&&byId('assetFilterAsset').value||'', k=selectedAssetKind(), mode=assetStatusMode(), sector=byId('assetFilterSector')&&byId('assetFilterSector').value||'';
    var rows=all.filter(function(a){
      if(k&&kindOf(a)!==k)return false; if(selected&&String(a.id)!==String(selected))return false; if(mode==='ACTIVE'&&!isActiveStatus(a))return false; if(mode==='INACTIVE'&&isActiveStatus(a))return false;
      if(q){var txt=norm([a.patrimonio,a.sp_identificacao,a.sp_responsavel,a.sp_local,a.sp_obs,a.name,a.asset_department,a.asset_kind,a.brand,a.model,a.sector_name,a.origin_sector_name,a.status].join(' ')); if(txt.indexOf(q)<0)return false;}
      return true;
    });
    var hasFilter=!!(q||selected||sector||k!=='EQUIPMENT'||mode!=='ACTIVE');
    var limit=rows.length, list=rows.slice(0,limit), body=byId('assetsBody');
    var label=k==='SERVICE'?'serviço(s)':(k===''?'item(ns)':'equipamento(s) físico(s)');
    var info=byId('assetFilterInfo'); if(info) info.innerText=hasFilter?'Filtro aplicado: '+rows.length+' '+label+' '+activeLabel()+' encontrado(s).':'Mostrando '+Math.min(list.length,rows.length)+' de '+rows.length+' '+label+' ativo(s).';
    if(body){
      body.innerHTML=cadGroupedHtml(rows,{
        icon:'📍',
        group:function(a){return a.sector_name||'SEM SETOR';},
        subtitle:function(k,items){
          var tipos={};
          items.forEach(function(a){ var t=kindOf(a)==='SERVICE'?'Serviço':'Equipamento'; tipos[t]=1; });
          var names=Object.keys(tipos);
          return names.length ? names.join(' e ')+' neste setor' : 'Itens deste setor';
        },
        badge:function(k,items){return items.length+' '+(items.length===1?'equipamento':'equipamentos');},
        card:cardAsset,
        empty:'<div class="cadQuickEmpty">Nenhum equipamento encontrado neste filtro.</div>'
      });
    }
    var swap=all.filter(function(a){return statusOf(a)==='SWAP'}), out=all.filter(function(a){return ['NO_REPAIR','WRITTEN_OFF'].includes(statusOf(a))});
    if(window.swapAssetsCount) swapAssetsCount.innerText=swap.length+' '+(swap.length===1?'item':'itens');
    if(window.outAssetsCount) outAssetsCount.innerText=out.length+' '+(out.length===1?'item':'itens');
    if(typeof window.updateCadastroAssetHero==='function') window.updateCadastroAssetHero();
  }
  function sectorsText(g){var n=Number(g.active_count||((g.sector_ids||[]).length)||0); return n+' setor'+(n===1?' vinculado':'es vinculados');}
  function serviceActive(g){return Number(g.active==null?1:g.active)===1 && N(g.status||'ACTIVE')==='ACTIVE';}
  function serviceKey(g){return encodeURIComponent(g.service_key||g.name||'');}
  function cadGroupKey(v){return String(v||'SEM GRUPO').trim()||'SEM GRUPO';}
  function cadGroupIcon(title, fallback){
    var t=N(title);
    if(t.indexOf('TI')>=0)return '💻';
    if(t.indexOf('MANUT')>=0)return '🛠️';
    if(t.indexOf('APOIO')>=0)return '🤝';
    if(t.indexOf('ADMIN')>=0)return '🏢';
    if(t.indexOf('RESTAUR')>=0)return '🍽️';
    if(t.indexOf('ATEND')>=0)return '🎟️';
    return fallback||'📁';
  }
  function cadGroupedHtml(rows, opts){
    opts=opts||{}; rows=Array.isArray(rows)?rows:[];
    var groups={};
    rows.forEach(function(row){var key=cadGroupKey(opts.group(row)); if(!groups[key])groups[key]=[]; groups[key].push(row);});
    var keys=Object.keys(groups).sort(function(a,b){return a.localeCompare(b,'pt-BR');});
    if(!keys.length) return opts.empty||'<div class="cadQuickEmpty">Nenhum item encontrado neste filtro.</div>';
    return '<div class="cadBlockList">'+keys.map(function(k){
      var list=groups[k];
      var sub=opts.subtitle?opts.subtitle(k,list):'';
      var badge=opts.badge?opts.badge(k,list):list.length+' item'+(list.length===1?'':'s');
      var cards=list.map(opts.card).join('');
      return '<details class="cadBlockGroup"><summary><div class="cadBlockLeft"><span class="cadBlockIcon">'+cadGroupIcon(k,opts.icon)+'</span><div><b>'+esc(k)+'</b>'+(sub?'<small>'+esc(sub)+'</small>':'')+'</div></div><div class="cadBlockBadges"><span>'+esc(badge)+'</span><span>⌄</span></div></summary><div class="cadBlockItems">'+cards+'</div></details>';
    }).join('')+'</div>';
  }
  function renderServices(){
    ensureAssetStatusFilter();
    var q=norm(byId('assetSearch')&&byId('assetSearch').value||''), selected=byId('assetFilterAsset')&&byId('assetFilterAsset').value||'', mode=assetStatusMode();
    var rows=serviceGroupsCache.filter(function(g){var act=serviceActive(g); if(mode==='ACTIVE'&&!act)return false; if(mode==='INACTIVE'&&act)return false; if(selected&&String(g.service_key)!==String(selected))return false; if(q&&norm([g.name,g.service_key,sectorsText(g),(g.sectors||[]).map(function(s){return s.name}).join(' '),g.status].join(' ')).indexOf(q)<0)return false; return true;});
    var sel=byId('assetFilterAsset'); if(sel){var old=sel.value||''; var opts=serviceGroupsCache.filter(function(g){var act=serviceActive(g); if(mode==='ACTIVE'&&!act)return false; if(mode==='INACTIVE'&&act)return false; return true;}); sel.innerHTML='<option value="">Todos serviços</option>'+opts.map(function(g){return '<option value="'+esc(g.service_key)+'">'+esc(g.name)+' • '+sectorsText(g)+'</option>';}).join(''); if([].slice.call(sel.options).some(function(o){return o.value===old;})) sel.value=old;}
    var info=byId('assetFilterInfo'); if(info) info.innerText='Filtro aplicado: '+rows.length+' serviço(s) '+activeLabel()+' encontrado(s).';
    var title=[].slice.call(document.querySelectorAll('.cadAssetTitleActions b, .cadAssetTitleActions h2, .cadProTableTitle b')).find(function(el){return /Equipamentos|Serviços|Itens/i.test(el.textContent)}); if(title) title.textContent='Serviços cadastrados';
    var body=byId('assetsBody'); if(!body)return;
    if(window.__gfUseServiceCache&&window.gfCadastroCache.servicos){body.innerHTML=window.gfCadastroCache.servicos; window.__gfUseServiceCache=false; return;}
    function serviceCard(g){var act=serviceActive(g); return '<div class="gfCleanCard gfAssetCardNew gfServiceCompactCard '+(!act?'gfInactiveCard':'')+'"><div class="gfCardAccent"></div><div class="gfCardIcon">🧩</div><div class="gfCardMain"><div class="gfCardTop"><h3>'+esc(g.name)+'</h3>'+(act?'<span class="gfStatus on">Ativo</span>':'<span class="gfStatus off">Inativo</span>')+'</div><div class="gfCardMeta"><span class="gfServiceCount">'+sectorsText(g)+'</span><span>🧩 Serviço</span><select class="gfDeptSelect adminOnly" title="Departamento do serviço" onchange="saveServiceDepartment(\''+serviceKey(g)+'\',this.value)"><option value="TI" '+(N(g.asset_department)==='TI'?'selected':'')+'>💻 TI</option><option value="MANUTENCAO" '+(N(g.asset_department||'MANUTENCAO')==='MANUTENCAO'?'selected':'')+'>🛠️ Manutenção</option><option value="APOIO" '+(N(g.asset_department)==='APOIO'?'selected':'')+'>🤝 Apoio</option></select><span class="viewerOnly">'+esc(g.asset_department||'MANUTENCAO')+'</span></div>'+(act?'':'<span class="gfInactiveHint">Serviço inativo: não aparece no QR nem para abrir chamados.</span>')+'</div><div class="gfCardActions"><button class="btn btnDark" onclick="openServiceSectorDrawer(\''+serviceKey(g)+'\')">Vincular</button><button class="btn btnLight adminOnly" onclick="gfEditServiceName(\''+serviceKey(g)+'\',\''+encodeURIComponent(g.name||'')+'\')">Editar</button><button class="btn '+(act?'btnRed':'btnLight')+' adminOnly" onclick="gfToggleServiceActive(\''+serviceKey(g)+'\','+(act?0:1)+')">'+(act?'Inativar':'Ativar')+'</button></div></div>'; }
    if(rows.length){
      body.innerHTML='<div class="gfServiceListClean">'+rows.map(serviceCard).join('')+'</div>';
    }else{
      body.innerHTML='<div class="cadQuickEmpty">Nenhum serviço encontrado neste filtro.</div>';
    }
    if(window.swapAssetsCount) swapAssetsCount.innerText='0 itens'; if(window.outAssetsCount) outAssetsCount.innerText='0 itens';
    try{window.gfIssueServiceGroups=serviceGroupsCache.slice();}catch(e){}
    if(typeof window.updateCadastroAssetHero==='function') window.updateCadastroAssetHero();
  }

  window.gfEditServiceName=function(k,currentName){
    var atual = ''; try{ atual = decodeURIComponent(String(currentName || '')); }catch(e){ atual = String(currentName || ''); }
    var novo = prompt('Novo nome do serviço:', atual);
    if(novo===null) return;
    novo = String(novo || '').trim();
    if(!novo) return alert('Informe o nome do serviço.');
    fetchJson(API_BASE+'/api/admin/service-groups/'+encodeURIComponent(decodeURIComponent(String(k||'')))+'/name',{
      method:'PUT',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({name:novo})
    }).then(function(j){
      if(!j || !j.ok) return alert((j && j.error) || 'Erro ao editar nome do serviço');
      if(typeof toastMsg==='function') toastMsg('Nome do serviço atualizado');
      return window.loadAssets();
    }).catch(function(){ alert('Erro ao editar nome do serviço'); });
  };

  window.gfToggleServiceActive=function(k,active){
    fetchJson(API_BASE+'/api/admin/service-groups/'+encodeURIComponent(decodeURIComponent(String(k||'')))+'/active',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({active:!!active})}).then(function(j){if(!j.ok)return alert(j.error||'Erro ao alterar serviço'); if(typeof toastMsg==='function')toastMsg(active?'Serviço ativado':'Serviço inativado'); try{gfInvalidateAssetsCacheV29();}catch(e){} return window.loadAssets(true);});
  };
  window.loadAssets=async function(){
    ensureAssetStatusFilter();
    if(selectedAssetKind()==='SERVICE'){
      var j=await fetchJson(API_BASE+'/api/admin/service-groups'); serviceGroupsCache=Array.isArray(j.services)?j.services:[]; window.gfIssueServiceGroups=serviceGroupsCache.slice(); window.serviceGroupsCache=serviceGroupsCache.slice(); renderServices(); return;
    }
    var sid=byId('assetFilterSector')&&byId('assetFilterSector').value||''; var url=API_BASE+'/api/admin/assets'+(sid?'?sector_id='+encodeURIComponent(sid):''); var ja=await fetchJson(url); window.assets=Array.isArray(ja.assets)?ja.assets:[]; try{assets=window.assets}catch(e){} renderAssetRows();
  };
  window.refreshAssetQuickFilters=function(){ ensureAssetStatusFilter(); if(selectedAssetKind()==='SERVICE')return renderServices(); return refreshAssetOptions(Array.isArray(window.assets)?window.assets:[]); };
  window.clearAssetQuickFilters=async function(){['assetFilterSector','assetFilterAsset','assetSearch'].forEach(function(id){var el=byId(id); if(el)el.value='';}); var k=byId('assetFilterKind'); if(k)k.value='EQUIPMENT'; var st=byId('assetFilterStatus'); if(st)st.value='ACTIVE'; await window.loadAssets();};
  window.onAssetSectorFilterChange=async function(){var a=byId('assetFilterAsset'); if(a)a.value=''; await window.loadAssets();};

  window.issueFilteredList=function(){
    var sectorId=byId('issueFilterSector')&&byId('issueFilterSector').value||'', assetName=byId('issueFilterAsset')&&byId('issueFilterAsset').value||'', q=(typeof issueNorm==='function')?issueNorm(byId('issueFilterSearch')&&byId('issueFilterSearch').value||''):norm(byId('issueFilterSearch')&&byId('issueFilterSearch').value||''), assetK=(typeof issueKey==='function')?issueKey(assetName):key(assetName), mode=issueStatusMode();
    var kind=N(byId('issueFilterKind')&&byId('issueFilterKind').value||'ALL'); if(!['ALL','EQUIPMENT','SERVICE'].includes(kind))kind='ALL';
    var svcKeys=new Set((window.gfIssueServiceGroups||serviceGroupsCache||[]).map(function(s){return [s.name,s.service_key,s.legacy_asset_name].map(key)}).flat().filter(Boolean));
    function isSvc(i){return svcKeys.has(key(i&&i.asset_name));}
    return (Array.isArray(window.issues)?window.issues:(typeof issues!=='undefined'?issues:[])).filter(function(i){
      var act=!!Number(i.active==null?1:i.active); if(mode==='ACTIVE'&&!act)return false; if(mode==='INACTIVE'&&act)return false; var sv=isSvc(i); if(kind==='SERVICE'&&!sv)return false; if(kind==='EQUIPMENT'&&sv)return false;
      var iKey=(typeof issueKey==='function')?issueKey(i.asset_name):key(i.asset_name); if(assetK&&iKey!==assetK)return false;
      if(q){var txt=(typeof issueNorm==='function')?issueNorm([i.asset_name,i.name,i.priority,typeof priorityText==='function'?priorityText(i.priority):''].join(' ')):norm([i.asset_name,i.name,i.priority].join(' ')); if(txt.indexOf(q)<0)return false;}
      return true;
    });
  };
  window.renderIssues=function(){
    ensureIssueStatusFilter(); if(typeof window.refreshIssueQuickFilters==='function') window.refreshIssueQuickFilters();
    var filtered=window.issueFilteredList();
    var list=filtered.slice();
    var info=byId('issueFilterInfo'); if(info) info.innerText='Mostrando '+filtered.length+' de '+filtered.length+' problema(s) '+(issueStatusMode()==='INACTIVE'?'inativo(s)':(issueStatusMode()==='ALL'?'cadastrado(s)':'ativo(s)'));
    var body=byId('issuesBody'); if(!body)return;
    function issueCard(i){var act=!!Number(i.active==null?1:i.active); return '<div class="gfCleanCard gfIssueCard '+(!act?'gfInactiveCard':'')+'" data-asset="'+esc(i.asset_name||'')+'" data-issue="'+esc(i.name||'')+'"><div class="gfCardAccent"></div><div class="gfCardIcon">⚠️</div><div class="gfCardMain"><div class="gfCardTop"><h3>'+esc(i.asset_name||'-')+'</h3>'+(act?'<span class="gfStatus on">Ativo</span>':'<span class="gfStatus off">Inativo</span>')+'</div><div class="gfProblemName">'+esc(i.name||'-')+'</div><div class="gfCardMeta">'+(typeof issuePriorityBadge==='function'?issuePriorityBadge(i.priority):esc(i.priority||'MEDIUM'))+'</div><div class="gfHiddenInputs adminOnly"><input value="'+esc(i.asset_name)+'" id="ia'+esc(i.id)+'"><input value="'+esc(i.name)+'" id="in'+esc(i.id)+'"><select id="ip'+esc(i.id)+'"><option value="HIGH" '+(i.priority==='HIGH'?'selected':'')+'>Alta</option><option value="MEDIUM" '+(i.priority==='MEDIUM'?'selected':'')+'>Média</option><option value="LOW" '+(i.priority==='LOW'?'selected':'')+'>Baixa</option></select></div></div><div class="gfCardActions"><button class="btn btnEdit adminOnly" onclick="gfToggleEdit(this)">Editar</button><button class="btn btnSaveInline adminOnly" onclick="updateIssue('+esc(i.id)+',true)">Salvar</button><button class="btn btnLight adminOnly" onclick="updateIssue('+esc(i.id)+','+(act?'false':'true')+')">'+(act?'Desativar':'Ativar')+'</button>'+(typeof isAdmin==='function'&&!isAdmin()?'<span class="viewerOnlyHint">Somente leitura</span>':'')+'</div></div>'; }
    body.innerHTML=cadGroupedHtml(list,{
      icon:'⚠️',
      group:function(i){return i.asset_name||'SEM EQUIPAMENTO/SERVIÇO';},
      subtitle:function(k,items){var altas=items.filter(function(i){return String(i.priority||'').toUpperCase()==='HIGH';}).length; return altas?altas+' prioridade alta':'Prioridades organizadas';},
      badge:function(k,items){return items.length+' problema'+(items.length===1?'':'s');},
      card:issueCard,
      empty:'<div class="empty">Nenhum problema encontrado nesse filtro</div>'
    })+'';
  };

  function gfAllSectorsForDrawer(){
    try{ if(Array.isArray(window.sectors) && window.sectors.length) return window.sectors; }catch(e){}
    try{ if(typeof sectors!=='undefined' && Array.isArray(sectors) && sectors.length) return sectors; }catch(e){}
    return [];
  }
  async function gfEnsureSectorsForDrawer(){
    var list=gfAllSectorsForDrawer();
    if(list.length) return list;
    try{
      var j=await fetchJson(API_BASE+'/api/admin/sectors');
      list=Array.isArray(j.sectors)?j.sectors:[];
      window.sectors=list;
      try{ sectors=list; }catch(e){}
      return list;
    }catch(e){ return []; }
  }
  window.openServiceSectorDrawer=async function(k){
    if(typeof window.ensureServiceDrawer==='function') window.ensureServiceDrawer();
    else { alert('Tela de setores ainda não carregou. Atualize a página.'); return; }
    var raw='';
    try{ raw=decodeURIComponent(String(k||'')); }catch(e){ raw=String(k||''); }
    if(!serviceGroupsCache.length){
      try{
        var j=await fetchJson(API_BASE+'/api/admin/service-groups');
        serviceGroupsCache=Array.isArray(j.services)?j.services:[];
        window.gfIssueServiceGroups=serviceGroupsCache.slice();
      }catch(e){}
    }
    function same(a,b){ return String(a||'').trim()===String(b||'').trim(); }
    var g=(serviceGroupsCache||[]).find(function(x){return same(x.service_key,raw)||same(x.name,raw)||same(x.legacy_asset_name,raw);});
    if(!g) return alert('Serviço não encontrado. Atualize a página e tente novamente.');
    var keyVal=g.service_key||g.name||raw;
    var sectorsList=(await gfEnsureSectorsForDrawer()).slice().sort(function(a,b){return norm(a.name).localeCompare(norm(b.name),'pt-BR');});
    var linked=new Set((g.sector_ids||[]).map(String));
    var checks=byId('serviceSectorChecks');
    byId('serviceSectorKey').value=keyVal;
    byId('serviceSectorTitle').textContent='Setores do serviço: '+(g.name||'Serviço');
    byId('serviceSectorSub').textContent=sectorsText(g)+' — marque/desmarque e salve';
    if(checks){
      checks.innerHTML=sectorsList.length?sectorsList.map(function(s){
        return '<label><input type="checkbox" value="'+esc(s.id)+'" '+(linked.has(String(s.id))?'checked':'')+'> '+esc(s.name||'-')+'</label>';
      }).join(''):'<div class="empty">Nenhum setor cadastrado.</div>';
    }
    byId('serviceSectorBackdrop')&&byId('serviceSectorBackdrop').classList.add('show');
    byId('serviceSectorDrawer')&&byId('serviceSectorDrawer').classList.add('show');
  };
  window.saveServiceSectors=async function(){
    var keyVal=byId('serviceSectorKey')&&byId('serviceSectorKey').value||'';
    var sector_ids=[].slice.call(document.querySelectorAll('#serviceSectorChecks input:checked')).map(function(i){return Number(i.value);}).filter(Boolean);
    if(!keyVal) return alert('Serviço inválido.');
    var j=await fetchJson(API_BASE+'/api/admin/service-groups/'+encodeURIComponent(keyVal)+'/sectors',{
      method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({sector_ids:sector_ids})
    });
    if(!j || !j.ok) return alert((j&&j.error)||'Erro ao salvar setores');
    closeServiceSectorDrawer();
    if(typeof toastMsg==='function') toastMsg('Setores do serviço atualizados');
    await window.loadAssets();
  };

  function boot(){ensureAssetStatusFilter(); ensureIssueStatusFilter(); try{document.getElementById('assetFilterStatus')?.addEventListener('change',function(){window.loadAssets();});}catch(e){} }
  if(!window.__GF_BOOT_ONCE__){window.__GF_BOOT_ONCE__=true;if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot); else boot();}
})();


(function(){
  'use strict';
  if(window.__GF_DASHBOARD_V16_FINAL_CLEAN__) return;
  window.__GF_DASHBOARD_V16_FINAL_CLEAN__ = true;

  var DB = {
    rows: [],
    fetchedAt: 0,
    loading: false,
    seq: 0,
    dept: 'ALL',
    mode: 'OPEN_NOW',
    start: '',
    end: '',
    criticalLimit: 4,
    latestLimit: 4
  };
  try{ window.DB = DB; window.gfDashboardDB = DB; }catch(e){}

  function arr(v){ return Array.isArray(v) ? v : []; }
  function str(v){ return String(v==null?'':v).trim(); }
  function up(v){ return str(v).toUpperCase(); }
  function norm(v){ return up(v).normalize('NFD').replace(/[\u0300-\u036f]/g,''); }
  function api(){ try{return window.API || API || '';}catch(e){return window.API || '';} }
  function esc(v){
    if(typeof escapeHtml==='function') return escapeHtml(v);
    return str(v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c];});
  }
  function idOf(t){ return Number(t && (t.id || t.ticket_id || t.ticketId || t.db_id)) || 0; }
  function pad(n){ return String(n).padStart(2,'0'); }
  function todayKey(){
    try{ if(typeof window.nowDayKeyBR==='function') return window.nowDayKeyBR(); }catch(e){}
    var d=new Date(); return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());
  }
  function addDays(k,n){
    try{ if(typeof window.dateKeyAdd==='function') return window.dateKeyAdd(k,n); }catch(e){}
    var p=String(k||todayKey()).split('-').map(Number); var d=new Date(p[0],p[1]-1,p[2]); d.setDate(d.getDate()+Number(n||0));
    return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());
  }
  function dayKey(v){
    try{ if(typeof window.dayKeyBR==='function'){ var k=window.dayKeyBR(v); if(k) return k; } }catch(e){}
    var s=str(v); if(!s) return '';
    var m=s.match(/^(\d{4})-(\d{2})-(\d{2})/); if(m) return m[1]+'-'+m[2]+'-'+m[3];
    m=s.match(/^(\d{2})\/(\d{2})\/(\d{4})/); if(m) return m[3]+'-'+m[2]+'-'+m[1];
    var d=new Date(s.replace(' ','T')); if(isNaN(d.getTime())) return '';
    return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());
  }
  function ts(v){
    try{ if(typeof window.tsBR==='function') return Number(window.tsBR(v)||0); }catch(e){}
    var n=Date.parse(str(v).replace(' ','T')); return isNaN(n)?0:n;
  }
  function dept(v){
    var d=norm(v);
    if(!d || d==='ALL' || d==='TODOS' || d==='TODOS DEPARTAMENTOS') return 'ALL';
    if(d.indexOf('APOIO')>=0 || d.indexOf('SUPORTE')>=0) return 'APOIO';
    if(d.indexOf('MANUT')>=0 || d.indexOf('PREDIAL')>=0) return 'MANUTENCAO';
    if(d==='TI' || d.indexOf('TECNO')>=0 || d.indexOf('INFORM')>=0) return 'TI';
    return 'ALL';
  }
  function deptLabel(d){ d=dept(d); return d==='TI'?'TI':(d==='MANUTENCAO'?'Manutenção':(d==='APOIO'?'Apoio':'Todos')); }
  function assetById(){
    var m={};
    arr(window.assets).forEach(function(a){ if(a && a.id!=null) m[Number(a.id)] = a; });
    try{ arr(assets).forEach(function(a){ if(a && a.id!=null) m[Number(a.id)] = a; }); }catch(e){}
    return m;
  }
  function ticketDept(t){
    var d = dept(t && (t.service_department || t.asset_department || t.department || t.dept || t.ticket_department || t.sector_department));
    if(d !== 'ALL') return d;
    var aid=Number(t && (t.asset_id || t.assetId)) || 0;
    if(aid){ var a=assetById()[aid]; if(a){ d=dept(a.asset_department || a.service_department || a.department); if(d!=='ALL') return d; } }
    var text=norm([t&&t.asset_name,t&&t.service_name,t&&t.issue_name,t&&t.description,t&&t.category].join(' '));
    if(text.indexOf('LIMPEZA')>=0 || text.indexOf('APOIO')>=0 || text.indexOf('REQUISICAO')>=0 || text.indexOf('REQUISICAO')>=0) return 'APOIO';
    if(text.indexOf('LAMPADA')>=0 || text.indexOf('TOMADA')>=0 || text.indexOf('MARCENARIA')>=0 || text.indexOf('VIDRACARIA')>=0 || text.indexOf('PREDIAL')>=0 || text.indexOf('MANUT')>=0) return 'MANUTENCAO';
    if(text.indexOf('LIMBER')>=0 || text.indexOf('INTERNET')>=0 || text.indexOf('IMPRESSORA')>=0 || text.indexOf('COMPUTADOR')>=0 || text.indexOf('PDV')>=0 || text.indexOf('BALANCA')>=0) return 'TI';
    return 'TI';
  }
  window.gfTicketDept = ticketDept;
  window.gfDepartmentOfTicket = ticketDept;

  function hasAssignee(t){
    if(!t) return false;
    if(t.assigned_to_user_id!=null && str(t.assigned_to_user_id)!=='' && Number(t.assigned_to_user_id)!==0) return true;
    var n=str(t.assigned_to_name || t.responsible_name || t.assigned_name);
    return !!(n && !/^(-|area administrativa|área administrativa|equipe)$/i.test(n));
  }
  function status(t){
    var s=norm(t && t.status);
    if(['DONE','FINALIZADO','FINALIZADA','RESOLVIDO','RESOLVIDA','FECHADO','FECHADA','CLOSED'].indexOf(s)>=0) return 'DONE';
    if(['CANCELED','CANCELLED','CANCELADO','CANCELADA'].indexOf(s)>=0) return 'CANCELED';
    if(['IN_PROGRESS','EM_PROGRESSO','EM ANDAMENTO','EM_ANDAMENTO','ANDAMENTO','ASSUMIDO','ASSUMIDA'].indexOf(s)>=0) return 'IN_PROGRESS';
    if(hasAssignee(t)) return 'IN_PROGRESS';
    return 'NEW';
  }
  function isDone(t){ return status(t)==='DONE'; }
  function isOpen(t){ var s=status(t); return s!=='DONE' && s!=='CANCELED'; }
  function isNew(t){ return status(t)==='NEW' && !hasAssignee(t); }
  function isProgress(t){ return status(t)==='IN_PROGRESS' || (isOpen(t) && hasAssignee(t)); }
  function createdKey(t){ return dayKey(t && (t.created_at || t.createdAt)); }
  function resolvedKey(t){ return isDone(t) ? dayKey(t && (t.resolved_at || t.closed_at || t.finished_at || t.done_at || t.updated_at)) : ''; }
  function critical(t){
    try{ if(typeof window.gfIsOpenNewCritical==='function') return !!window.gfIsOpenNewCritical(t); }catch(e){}
    var c=ts(t && t.created_at); return isOpen(t) && c && ((Date.now()-c)/60000)>=2880;
  }
  function mergeRows(){
    var map={};
    [DB.rows, window.dashboardAllTickets, window.dashboardOpenTickets, window.tickets].forEach(function(list){
      arr(list).forEach(function(t){ var id=idOf(t); if(!id) return; map[id]=Object.assign({}, map[id]||{}, t); });
    });
    return Object.keys(map).map(function(k){ return map[k]; }).sort(function(a,b){ return (ts(b.updated_at||b.created_at)-ts(a.updated_at||a.created_at)) || (idOf(b)-idOf(a)); });
  }
  function range(){
    var m=str(DB.mode || window.dashboardRangeMode || 'OPEN_NOW'); var t=todayKey();
    if(m==='ALL') return {s:'',e:''};
    if(m==='OPEN_NOW' || m==='TODAY') return {s:t,e:t};
    if(['7','15','30'].indexOf(m)>=0) return {s:addDays(t,-(Number(m)-1)),e:t};
    return {s:str(DB.start || window.dashboardStartKey || t), e:str(DB.end || window.dashboardEndKey || t)};
  }
  function inRange(k){ if(!k) return false; if(DB.mode==='ALL') return true; var r=range(); if(r.s && k<r.s) return false; if(r.e && k>r.e) return false; return true; }
  function rowsAll(){ var d=dept(DB.dept || window.gfDashboardDept || 'ALL'); return mergeRows().filter(function(t){ return d==='ALL' || ticketDept(t)===d; }); }
  function rowsContext(){
    var all=rowsAll();
    if(DB.mode==='OPEN_NOW') return all.filter(isOpen);
    if(DB.mode==='ALL') return all;
    return all.filter(function(t){ return inRange(createdKey(t)) || inRange(resolvedKey(t)); });
  }
  function rowsDone(){ return rowsAll().filter(function(t){ return isDone(t) && inRange(resolvedKey(t)); }); }
  function group(rows,getter){
    var out={}; arr(rows).forEach(function(t){ var k=typeof getter==='function'?getter(t):(t&&t[getter]); k=str(k)||'Não informado'; out[k]=(out[k]||0)+1; });
    return Object.keys(out).map(function(k){ return {name:k,total:out[k]}; }).sort(function(a,b){ return b.total-a.total || String(a.name).localeCompare(String(b.name),'pt-BR'); });
  }
  function groupDays(rows){
    var out={}; arr(rows).forEach(function(t){ var k=(DB.mode==='OPEN_NOW') ? createdKey(t) : (resolvedKey(t)||createdKey(t)); if(!k) return; if(DB.mode!=='OPEN_NOW' && DB.mode!=='ALL' && !inRange(k)) return; out[k]=(out[k]||0)+1; });
    return Object.keys(out).sort().reverse().map(function(k){ return {name:k.slice(8,10)+'/'+k.slice(5,7), total:out[k]}; });
  }
  function avgBySector(done){
    var out={}; arr(done).forEach(function(t){ var k=str(t.sector_name)||'Não informado'; var min=Math.max(0,Math.round((ts(t.resolved_at||t.updated_at)-ts(t.created_at))/60000)); if(!out[k]) out[k]={name:k,total:0,count:0}; out[k].total+=min; out[k].count++; });
    return Object.keys(out).map(function(k){ var x=out[k]; return {name:x.name, minutes:Math.round(x.total/Math.max(1,x.count)), count:x.count}; }).sort(function(a,b){ return b.minutes-a.minutes; });
  }
  function setTxt(id,v){ var el=document.getElementById(id); if(!el) return; var s=str(v); if(el.textContent!==s) el.textContent=s; }
  function setHtml(id,v){ var el=document.getElementById(id); if(!el) return; var s=String(v||''); if(el.innerHTML!==s) el.innerHTML=s; }
  function gfFilterTone(type){
    var typ=norm(type);
    if(typ==='CRITICAL') return 'critical';
    if(typ==='PROGRESS') return 'progress';
    if(typ==='DONE'||typ==='DONE_PERIOD'||typ==='DONE_TODAY'||typ==='RESOLVED') return 'done';
    return 'open';
  }
  function gfFilterIcon(tone){ return tone==='critical'?'⚠️':(tone==='progress'?'⏱️':(tone==='done'?'✅':'⏱️')); }
  function gfFilterTopCardHtml(title,total,tone){
    return '<div class="gfFilterTopCard '+esc(tone||'open')+'"><div class="gfFilterTopIcon">'+gfFilterIcon(tone)+'</div><div class="gfFilterTopText"><b>'+esc(title||'Detalhamento')+'</b><small>Resultado do filtro atual.</small></div><strong>'+esc(total)+' '+(Number(total)===1?'item':'itens')+'</strong></div>';
  }
  function renderBars(id,rows,field,suffix,limit){
    var el=document.getElementById(id); if(!el) return;
    rows=arr(rows); field=field||'total'; suffix=suffix||''; limit=limit||4;
    if(typeof window.renderDonut==='function') return window.renderDonut(id, rows, field, suffix, limit);
    if(!rows.length){ if(!el.innerHTML) el.innerHTML='<div class="empty">Sem dados nesse filtro.</div>'; return; }
    var total=rows.reduce(function(a,x){return a+(Number(x[field])||0);},0)||1;
    var html=rows.slice(0,limit).map(function(x){ var v=Number(x[field])||0; var p=Math.max(6,Math.round(v/total*100)); return '<div class="barRow"><div class="barLabel">'+esc(x.name)+'</div><div class="barTrack"><div class="barFill" style="width:'+p+'%"></div></div><b>'+v+suffix+'</b></div>'; }).join('');
    if(el.innerHTML!==html) el.innerHTML=html;
  }
  function gfShortName(v){
    var s=str(v); if(!s) return '';
    var parts=s.split(/\s+/).filter(Boolean);
    return parts.length>1 ? (parts[0]+' '+parts[parts.length-1]) : parts[0];
  }
  function gfTicketNumber(t){ return t && (t.ticket_number || t.ticketNumber || t.number || t.id) || '-'; }
  function gfTicketTitle(t){
    var main=str((t && (t.asset_name || t.service_name || t.equipment_name || t.asset || t.service)) || 'Chamado');
    var issue=str(t && (t.issue_type || t.problem_type || t.issue_name || t.problem_name || t.type_name || t.problem));
    if(issue && main && norm(main).indexOf(norm(issue))<0) return main+' • '+issue;
    return main || issue || 'Chamado';
  }
  function gfTicketIssue(t){ return str((t && (t.issue_name || t.problem_name || t.problem)) || 'Problema'); }
  function gfTicketDesc(t){ return str(t && (t.description || t.desc || t.observation || t.note)) || 'Sem descrição.'; }
  function gfStatusForCard(t){ return critical(t) ? 'CRITICAL' : status(t); }
  function gfStatusPill(st){
    if(st==='CRITICAL') return '<span class="gfDashTicketStatus critical">SLA crítico</span>';
    if(st==='DONE') return '<span class="gfDashTicketStatus done">Resolvido</span>';
    if(st==='IN_PROGRESS') return '<span class="gfDashTicketStatus progress">Em andamento</span>';
    return '<span class="gfDashTicketStatus new">Novo</span>';
  }
  function gfAgeText(t){
    var base=ts(t && (t.created_at || t.createdAt || t.updated_at));
    if(!base) return '';
    var min=Math.max(0,Math.floor((Date.now()-base)/60000));
    if(min<60) return 'Há '+min+' min';
    var h=Math.floor(min/60), m=min%60;
    if(h<24) return 'Há '+h+'h'+(m?(' '+m+'m'):'');
    var d=Math.floor(h/24), rh=h%24;
    return 'Há '+d+'d'+(rh?(' '+rh+'h'):'');
  }
  function gfAssigneeText(t){
    var st=status(t);
    if(st==='DONE') return gfShortName(t && (t.resolved_by_name || t.closed_by_name || t.finished_by_name || t.assigned_to_name || t.responsible_name)) || 'Equipe';
    if(st==='IN_PROGRESS') return gfShortName(t && (t.assigned_to_name || t.assigned_name || t.responsible_name || t.technician_name)) || 'Equipe';
    return 'Não assumido';
  }
  function gfParseMaybeArray(v){
    if(Array.isArray(v)) return v;
    if(!v) return [];
    if(typeof v==='string'){
      try{ var j=JSON.parse(v); return Array.isArray(j)?j:[]; }catch(e){ return []; }
    }
    return [];
  }

  var GF_PUBLIC_UPDATE_CACHE_KEY='GF_DASH_PUBLIC_UPDATE_CACHE_V2';
  var GF_PUBLIC_UPDATE_CACHE={};
  var GF_PUBLIC_UPDATE_HYDRATING={};
  var GF_PUBLIC_UPDATE_LAST_TRY={};
  try{ GF_PUBLIC_UPDATE_CACHE=JSON.parse(sessionStorage.getItem(GF_PUBLIC_UPDATE_CACHE_KEY)||'{}')||{}; }catch(e){ GF_PUBLIC_UPDATE_CACHE={}; }
  function gfSavePublicUpdateCache(){
    try{ sessionStorage.setItem(GF_PUBLIC_UPDATE_CACHE_KEY, JSON.stringify(GF_PUBLIC_UPDATE_CACHE)); }catch(e){}
  }
  function gfCacheKey(t){ var id=idOf(t); return id ? String(id) : ''; }
  function gfCleanUpdateText(txt){
    txt=str(txt);
    if(!txt || /^(-|null|undefined)$/i.test(txt)) return '';
    return txt.replace(/\s+/g,' ').trim();
  }
  function gfRememberPublicUpdate(t,u){
    var k=gfCacheKey(t);
    if(!k || !u || !gfCleanUpdateText(u.text)) return u;
    var old=GF_PUBLIC_UPDATE_CACHE[k]||{};
    var at=u.at || old.at || '';
    var oldTs=ts(old.at), newTs=ts(at);
    if(!old.text || !oldTs || !newTs || newTs>=oldTs){
      GF_PUBLIC_UPDATE_CACHE[k]={text:gfCleanUpdateText(u.text),by:gfShortName(u.by||old.by||'Equipe')||'Equipe',at:at};
      gfSavePublicUpdateCache();
    }
    return GF_PUBLIC_UPDATE_CACHE[k];
  }
  function gfCachedPublicUpdate(t){
    var k=gfCacheKey(t); if(!k) return null;
    var u=GF_PUBLIC_UPDATE_CACHE[k];
    return (u && gfCleanUpdateText(u.text)) ? u : null;
  }
  function gfMergeFullTicketIntoDashboard(full){
    if(!full) return;
    var id=idOf(full); if(!id) return;
    function mergeInto(list){
      if(!Array.isArray(list)) return;
      var ix=list.findIndex(function(x){ return idOf(x)===id; });
      if(ix>=0) list[ix]=Object.assign({}, list[ix]||{}, full);
    }
    mergeInto(DB.rows);
    mergeInto(window.tickets);
    mergeInto(window.dashboardAllTickets);
    mergeInto(window.dashboardOpenTickets);
    try{ if(typeof tickets!=='undefined') mergeInto(tickets); }catch(e){}
  }
  async function gfFetchFullTicketForUpdate(t){
    var id=idOf(t); if(!id) return null;
    var urls=[api()+'/api/admin/tickets/'+encodeURIComponent(id), api()+'/api/admin/tickets/by-db-id/'+encodeURIComponent(id), api()+'/api/admin/tickets/by-key/'+encodeURIComponent(t.ticket_number||id)];
    for(var i=0;i<urls.length;i++){
      try{
        var r=await fetch(urls[i],{credentials:'include',cache:'no-store'});
        if(r.status===401){ location.href='/login'; return null; }
        if(!r.ok) continue;
        var j=await r.json().catch(function(){return {};});
        var full=j.ticket || j.data || (Array.isArray(j.tickets)?j.tickets[0]:null) || (j.ok && j.id ? j : null);
        if(full) return full;
      }catch(e){}
    }
    return null;
  }
  function gfTicketNeedsUpdateHydration(t){
    var id=idOf(t); if(!id) return false;
    if(gfLatestPublicUpdate(t,true)) return false;
    var now=Date.now(), last=Number(GF_PUBLIC_UPDATE_LAST_TRY[id]||0);
    return !last || (now-last)>45000;
  }
  function gfHydrateVisiblePublicUpdates(rows){
    rows=arr(rows);

    /*
      Correção: quando os cards são agrupados e o usuário navega pelas setas,
      alguns chamados do mesmo grupo ainda não tinham o histórico completo no objeto
      do dashboard. Antes a hidratação buscava só os primeiros cards visíveis; agora
      ela busca também TODOS os chamados que estão dentro dos grupos visíveis.
      Assim a “Atualização para solicitante” já fica pronta ao trocar pela seta,
      sem precisar abrir o chamado e voltar.
    */
    var hydrateRows=[];
    try{
      var sorted=rows.slice().sort(function(a,b){return ts(b.updated_at||b.created_at)-ts(a.updated_at||a.created_at)||idOf(b)-idOf(a);});
      var built=gfDashBuildRelatedGroups(sorted);
      var limit=Math.max(4, Number(DB.latestLimit)||4);
      (built.order||[]).slice(0,limit).forEach(function(key){
        hydrateRows=hydrateRows.concat(arr(built.groups && built.groups[key]));
      });
    }catch(e){
      hydrateRows=rows.slice(0, Math.max(8, Number(DB.latestLimit)||4));
    }

    var seen={};
    hydrateRows=arr(hydrateRows).filter(function(t){
      var id=idOf(t); if(!id || seen[id]) return false;
      seen[id]=1; return true;
    });

    var targets=hydrateRows.filter(gfTicketNeedsUpdateHydration).slice(0,80);
    if(!targets.length) return;
    targets.forEach(function(t){
      var id=idOf(t); if(!id || GF_PUBLIC_UPDATE_HYDRATING[id]) return;
      GF_PUBLIC_UPDATE_HYDRATING[id]=1; GF_PUBLIC_UPDATE_LAST_TRY[id]=Date.now();
      gfFetchFullTicketForUpdate(t).then(function(full){
        if(full){
          gfMergeFullTicketIntoDashboard(full);
          var u=gfLatestPublicUpdate(full,true);
          if(u) gfRememberPublicUpdate(full,u);
          render();
        }
      }).finally(function(){ delete GF_PUBLIC_UPDATE_HYDRATING[id]; });
    });
  }
  function gfUpdateTextCandidate(t){
    var keys=['latest_public_note','last_public_note','public_note','last_note','latest_note','note','notes_for_requester','requester_note','client_note','customer_note','last_update_note','latest_update_note'];
    for(var i=0;i<keys.length;i++){
      var v=str(t && t[keys[i]]);
      if(v && !/^(-|null|undefined)$/i.test(v)) return v;
    }
    return '';
  }
  function gfUpdateAuthorCandidate(t){
    return gfShortName(t && (t.latest_public_note_user_name || t.last_public_note_user_name || t.public_note_by_name || t.last_note_user_name || t.latest_note_user_name || t.note_user_name || t.updated_by_name || t.last_updated_by_name || t.public_note_user_name)) || '';
  }
  function gfUpdateTimeCandidate(t){
    return t && (t.latest_public_note_at || t.last_public_note_at || t.last_note_at || t.latest_note_at || t.note_created_at || t.updated_note_at || t.last_update_at) || '';
  }
  function gfLatestPublicUpdate(t,rawOnly){
    var logs=[];
    logs=logs.concat(gfParseMaybeArray(t && t.logs));
    logs=logs.concat(gfParseMaybeArray(t && t.ticket_logs));
    logs=logs.concat(gfParseMaybeArray(t && t.history));
    logs=logs.filter(function(l){
      var a=norm(l && (l.action || l.type || l.event || l.kind));
      var note=gfCleanUpdateText(l && (l.notes || l.note || l.message || l.description || l.text));
      if(!note) return false;
      return a==='PUBLIC_NOTE' || a.indexOf('PUBLIC')>=0 || a.indexOf('SOLICITANTE')>=0 || a.indexOf('ATUALIZACAO')>=0 || a.indexOf('ATUALIZA')>=0;
    }).sort(function(a,b){ return ts(b.created_at || b.createdAt || b.at || b.updated_at)-ts(a.created_at || a.createdAt || a.at || a.updated_at); });
    if(logs.length){
      var l=logs[0];
      return gfRememberPublicUpdate(t,{
        text:gfCleanUpdateText(l.notes || l.note || l.message || l.description || l.text),
        by:gfShortName(l.user_name || l.user || l.author_name || l.created_by_name || l.name) || 'Equipe',
        at:l.created_at || l.createdAt || l.at || l.updated_at || ''
      });
    }
    var txt=gfCleanUpdateText(gfUpdateTextCandidate(t));
    if(txt){
      return gfRememberPublicUpdate(t,{text:txt,by:gfUpdateAuthorCandidate(t)||'Equipe',at:gfUpdateTimeCandidate(t)});
    }
    return rawOnly ? null : gfCachedPublicUpdate(t);
  }
  function gfUpdatePreviewHtml(t){
    var u=gfLatestPublicUpdate(t,false);
    if(!u || !gfCleanUpdateText(u.text)) return '';
    var meta=[];
    if(u.at) meta.push(fmtBR(u.at));
    if(u.by) meta.push(u.by);
    return '<div class="gfDashRequesterUpdate">'
      + '<strong>📣 Atualização para solicitante</strong>'
      + '<p>'+esc(gfCleanUpdateText(u.text))+'</p>'
      + (meta.length ? '<small>'+esc(meta.join(' • '))+'</small>' : '')
      + '</div>';
  }
  function gfDepartmentCompact(t){
    var d=ticketDept(t);
    if(d==='MANUTENCAO') return {txt:'🔧 MAN', cls:'man'};
    if(d==='APOIO') return {txt:'🤝 APO', cls:'apo'};
    return {txt:'💻 TI', cls:'ti'};
  }
  function gfSlug(v){
    return norm(v).toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'') || 'setor';
  }
  function gfSectorTone(t){
    var s=norm(t && (t.sector_name || t.origin_sector_name || t.requester_sector || t.location || ''));
    if(s.indexOf('RH')>=0) return 'red';
    if(s.indexOf('AQUA')>=0 || s.indexOf('TI')>=0 || s.indexOf('ENGENHARIA')>=0) return 'blue';
    if(s.indexOf('CONVEN')>=0 || s.indexOf('SALA DO APOIO')>=0 || s.indexOf('APOIO')>=0 || s.indexOf('ENCANT')>=0 || s.indexOf('KIDS')>=0) return 'green';
    if(s.indexOf('BEBIDA')>=0 || s.indexOf('RESTAUR')>=0 || s.indexOf('COZINHA')>=0 || s.indexOf('BUFFET')>=0 || s.indexOf('BILHETER')>=0) return 'orange';
    return 'green';
  }
  function gfAssigneeCls(t){
    var s=status(t);
    if(s==='DONE') return 'done';
    if(s==='IN_PROGRESS') return 'progress';
    return 'new';
  }
  function gfDashRelatedKey(t){
    t=t||{};

    /*
      Agrupamento correto dos cards do Dashboard:
      - junta pelo NOME PRINCIPAL que aparece no card;
      - ignora ID interno do serviço/equipamento;
      - ignora tipo de problema/complemento;
      - exemplo: IMPRESSORA • DEFEITO + IMPRESSORA • SUPRIMENTOS => IMPRESSORA;
      - exemplo: LIMBER • SINCRONIZAR + LIMBER • ERRO => LIMBER.
    */
    function cleanMainName(v){
      v=String(v||'').trim();
      if(!v) return '';

      var original=v;
      var upper=norm(original).toUpperCase();

      /* nomes principais conhecidos no sistema: força juntar mesmo se vier com complemento */
      var known=[
        'LIMBER','MONITOR','IMPRESSORA','REQUISICAO','DESKTOP','NOTEBOOK','COMPUTADOR',
        'INTERNET','FACIAL','CAMERA','CAMERAS','TELEFONE','RAMAL','PDV','NFC',
        'SERVICOS DIVERSOS','SERVICO DIVERSO','SERVICOS','MANUTENCAO','TOMADA','LAMPADA'
      ];
      for(var i=0;i<known.length;i++){
        if(upper===known[i] || upper.indexOf(known[i]+' ')===0 || upper.indexOf(known[i]+' -')===0 || upper.indexOf(known[i]+' •')===0 || upper.indexOf(known[i]+'.')===0 || upper.indexOf(known[i]+':')===0){
          return known[i].toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
        }
      }

      /* remove o complemento depois de separadores comuns */
      original=original.split(/\s*[•\-–—|:;\/\\]\s*/)[0] || original;

      var n=norm(original).toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
      if(!n || n==='chamado' || n==='nao informado' || n==='sem nome' || n==='problema') return '';

      /* se ainda veio texto grande sem separador, usa o primeiro bloco principal */
      var parts=n.split(/\s+/).filter(Boolean);
      if(parts.length>2){
        var firstTwo=parts.slice(0,2).join(' ');
        if(firstTwo==='servicos diversos' || firstTwo==='servico diverso') return firstTwo;
        return parts[0];
      }
      return n;
    }

    var mainName = cleanMainName(
      t.asset_name || t.service_name || t.equipment_name ||
      t.asset_label || t.item_name || t.asset || t.service || t.equipment ||
      (typeof gfTicketTitle==='function' ? gfTicketTitle(t) : '') || ''
    );

    if(mainName) return 'principal:nome:'+mainName;

    /* Sem nome confiável: não inventa grupo falso. */
    return 'ticket:'+String(idOf(t)||Math.random());
  }
  function gfDashBuildRelatedGroups(rows){
    var groups={}, order=[];
    arr(rows).forEach(function(t){
      var key=gfDashRelatedKey(t);
      if(!groups[key]){ groups[key]=[]; order.push(key); }
      groups[key].push(t);
    });
    order.forEach(function(key){
      groups[key].sort(function(a,b){return ts(b.updated_at||b.created_at)-ts(a.updated_at||a.created_at)||idOf(b)-idOf(a);});
    });
    return {groups:groups, order:order};
  }
  function gfDashTicketCardHtml(t){
    var related=arr(t&&t.__gfRelatedTickets);
    var groupKey=t&&t.__gfRelatedKey ? String(t.__gfRelatedKey) : '';
    if(related.length>1 && groupKey){
      window.gfDashRelatedIndex=window.gfDashRelatedIndex||{};
      var idx=Number(window.gfDashRelatedIndex[groupKey]||0);
      if(idx<0 || idx>=related.length) idx=0;
      t=related[idx];
      t.__gfRelatedTickets=related;
      t.__gfRelatedKey=groupKey;
      t.__gfRelatedIndex=idx;
    }
    var id=idOf(t), st=gfStatusForCard(t), dep=gfDepartmentCompact(t), n=gfTicketNumber(t), sectorTone=gfSectorTone(t);
    var done=st==='DONE';
    var cardCls='gfDashTicketCard dept-'+dep.cls+' sector-'+sectorTone+' '+(st==='CRITICAL'?'critical':(st==='IN_PROGRESS'?'progress':(st==='DONE'?'done':'new')));
    var actions=(typeof window.ticketCardActionsHtml==='function')
      ? window.ticketCardActionsHtml(t,'openTicketFromDashboard')
      : '<button class="btn btnLight" type="button" onclick="event.stopPropagation();openTicketFromDashboard('+Number(id)+')">Ver detalhes</button>';
    var relatedHtml='';
    if(related.length>1 && groupKey){
      var pos=Number(t.__gfRelatedIndex||0)+1;
      relatedHtml='<div class="gfDashRelatedCount" title="Chamados relacionados">'+pos+'/'+related.length+'</div>';
    }
    return '<article class="'+cardCls+'" data-ticket-id="'+esc(id)+'" data-gf-ticket-id="'+esc(id)+'" data-ticket-number="'+esc(n)+'" data-gf-public-ticket-number="'+esc(n)+'" data-gf-rel-key="'+esc(groupKey)+'" onclick="openTicketFromDashboard('+Number(id)+')">'+
      '<div class="gfDashTicketTop">'+
        '<div class="gfDashTicketRoute"><strong class="gfDashTicketNum">#'+esc(n)+'</strong><span class="gfDashSector sector-'+sectorTone+'">📍 '+esc(t&&t.sector_name||'-')+'</span><span class="gfDashDept dept-'+dep.cls+'">'+esc(dep.txt)+'</span></div>'+relatedHtml.replace('<div class="gfDashRelatedCount"','<div class="gfDashRelatedCount"')+
        '<div class="gfDashTicketRight">'+(done?'':'<span class="gfDashTicketTime">'+esc(gfAgeText(t))+'</span>')+gfStatusPill(st)+'</div>'+
      '</div>'+
      '<div class="gfDashTicketHead"><h4>'+esc(gfTicketTitle(t))+'</h4></div>'+
      '<p class="gfDashTicketDesc">'+esc(gfTicketDesc(t))+'</p>'+
      gfUpdatePreviewHtml(t)+
      '<div class="gfDashTicketBottom"><span class="gfDashAssignee '+gfAssigneeCls(t)+'">👤 '+esc(gfAssigneeText(t))+'</span><div class="gfDashTicketActions">'+actions+'</div></div>'+
      (related.length>1 && groupKey ? '<div class="gfDashRelatedHint" data-gf-rel-key="'+esc(groupKey)+'"><button type="button" class="gfRelArrow gfRelPrev" data-gf-rel-nav="prev" aria-label="Chamado relacionado anterior">◄</button><em>Arraste para os lados</em><button type="button" class="gfRelArrow gfRelNext" data-gf-rel-nav="next" aria-label="Próximo chamado relacionado">►</button></div>' : '')+
    '</article>';
  }
  function gfDashTicketBoardHtml(rows){
    rows=arr(rows).slice().sort(function(a,b){return ts(b.updated_at||b.created_at)-ts(a.updated_at||a.created_at)||idOf(b)-idOf(a);});
    var built=gfDashBuildRelatedGroups(rows);
    var grouped=built.order.map(function(key){
      var group=built.groups[key]||[];
      var rep=group[0]||{};
      rep.__gfRelatedTickets=group;
      rep.__gfRelatedKey=key;
      return rep;
    }).sort(function(a,b){return ts(b.updated_at||b.created_at)-ts(a.updated_at||a.created_at)||idOf(b)-idOf(a);});
    var totalGroups=grouped.length;
    var totalTickets=rows.length;
    var limit=Math.max(4, Number(DB.latestLimit)||4);
    var shown=grouped.slice(0,limit);
    var shownTickets=shown.reduce(function(sum,t){ return sum + Math.max(1, arr(t&&t.__gfRelatedTickets).length || 1); },0);
    if(!totalGroups) return '<div class="empty">Nenhum chamado nesse filtro.</div>';
    return '<div class="gfDashTicketList">'+shown.map(gfDashTicketCardHtml).join('')+'</div>'+moreBtn('latest', shownTickets, totalTickets);
  }
  function cardHtml(t){
    return gfDashTicketCardHtml(t);
  }
  function moreBtn(kind,shown,total){
    if(total<=shown) return '';
    var rest=total-shown;
    var label='Carregar mais'+(rest>4?'': '');
    return '<button class="btn btnLight gfLoadMoreDashBtn" type="button" onclick="gfDashV15ShowMore(\''+kind+'\')">'+label+' <small>('+shown+'/'+total+')</small></button>';
  }
  window.gfDashV15ShowMore=function(kind){ if(kind==='critical') DB.criticalLimit+=4; else DB.latestLimit+=4; render(); };
  function gfDashRelatedMove(key,dir){
    if(!key) return;
    window.gfDashRelatedIndex=window.gfDashRelatedIndex||{};
    var cards=[];
    document.querySelectorAll('#v9LatestList .gfDashTicketCard[data-gf-rel-key] .gfDashRelatedCount').forEach(function(el){
      var card=el.closest('.gfDashTicketCard');
      if(card && card.getAttribute('data-gf-rel-key')===String(key)) cards.push(el);
    });
    var total=0;
    if(cards && cards[0]){
      var m=String(cards[0].textContent||'').match(/\/(\d+)/);
      total=m?Number(m[1]):0;
    }
    if(!total || total<2) return;
    var cur=Number(window.gfDashRelatedIndex[key]||0);
    cur=(cur+dir+total)%total;
    window.gfDashRelatedIndex[key]=cur;
    render();
  }
  function gfDashInstallRelatedEvents(){
    if(window.__gfDashRelatedEventsV1) return;
    window.__gfDashRelatedEventsV1=true;
    document.addEventListener('click',function(ev){
      var card=ev.target && ev.target.closest && ev.target.closest('#v9LatestList .gfDashTicketCard');
      if(card && window.__gfDashRelatedSuppressClickUntil && Date.now()<window.__gfDashRelatedSuppressClickUntil){
        ev.preventDefault(); ev.stopPropagation(); if(ev.stopImmediatePropagation) ev.stopImmediatePropagation();
        return;
      }
      var btn=ev.target && ev.target.closest && ev.target.closest('[data-gf-rel-nav]');
      if(!btn) return;
      var box=btn.closest('[data-gf-rel-key]');
      var key=box && box.getAttribute('data-gf-rel-key');
      ev.preventDefault(); ev.stopPropagation(); if(ev.stopImmediatePropagation) ev.stopImmediatePropagation();
      gfDashRelatedMove(key, btn.getAttribute('data-gf-rel-nav')==='prev'?-1:1);
    },true);
    var start=null;
    document.addEventListener('pointerdown',function(ev){
      var card=ev.target && ev.target.closest && ev.target.closest('#v9LatestList .gfDashTicketCard[data-gf-rel-key]');
      if(!card) return;
      if(ev.target.closest('button,.btn,a,input,select,textarea,[data-gf-rel-nav]')) return;
      var key=card.getAttribute('data-gf-rel-key');
      if(!key) return;
      var counter=card.querySelector('.gfDashRelatedCount');
      if(!counter) return;
      start={x:ev.clientX,y:ev.clientY,key:key,moved:false};
    },true);
    document.addEventListener('pointermove',function(ev){
      if(!start) return;
      var dx=ev.clientX-start.x, dy=ev.clientY-start.y;
      if(Math.abs(dx)>12 || Math.abs(dy)>12) start.moved=true;
    },true);
    document.addEventListener('pointerup',function(ev){
      if(!start) return;
      var dx=ev.clientX-start.x, dy=ev.clientY-start.y, key=start.key;
      var isSwipe=Math.abs(dx)>=70 && Math.abs(dx)>Math.abs(dy)*1.35;
      start=null;
      if(!isSwipe) return;
      window.__gfDashRelatedSuppressClickUntil=Date.now()+450;
      ev.preventDefault(); ev.stopPropagation(); if(ev.stopImmediatePropagation) ev.stopImmediatePropagation();
      gfDashRelatedMove(key, dx<0?1:-1);
    },true);
    document.addEventListener('pointercancel',function(){ start=null; },true);
  }
  
    document.addEventListener('click',function(ev){
      var btn=ev.target && ev.target.closest && ev.target.closest('[data-gf-assume-ticket],[data-gf-resolve-ticket],[data-gf-open-ticket]');
      if(!btn) return;
      var card=btn.closest('.gfDashTicketCard[data-gf-rel-key]');
      if(!card) return;
      var key=card.getAttribute('data-gf-rel-key');
      if(!key || !window.gfDashRelatedGroups || !window.gfDashRelatedGroups[key]) return;
      var idx=Number((window.gfDashRelatedIndex&&window.gfDashRelatedIndex[key])||0);
      var ticket=window.gfDashRelatedGroups[key][idx];
      if(!ticket || !ticket.id) return;
      if(btn.hasAttribute('data-gf-assume-ticket')) btn.setAttribute('data-gf-assume-ticket',ticket.id);
      if(btn.hasAttribute('data-gf-resolve-ticket')) btn.setAttribute('data-gf-resolve-ticket',ticket.id);
      if(btn.hasAttribute('data-gf-open-ticket')) btn.setAttribute('data-gf-open-ticket',ticket.id);
      var oc=btn.getAttribute('onclick')||'';
      oc=oc.replace(/\(\d+,\s*'IN_PROGRESS'\)/,"("+ticket.id+",'IN_PROGRESS')");
      oc=oc.replace(/\(\d+\)/,"("+ticket.id+")");
      btn.setAttribute('onclick',oc);
    },true);

  gfDashInstallRelatedEvents();

  function ensureLatestBoardCss(){
    if(document.getElementById('gfLatestTicketListCssV2')) return;
    var old=document.getElementById('gfLatestTicketBoardCssV1');
    if(old) old.remove();
    var st=document.createElement('style');
    st.id='gfLatestTicketListCssV2';
    st.textContent=`
      #pageDashboard .v8Grid{display:grid;grid-template-columns:repeat(4,minmax(180px,1fr));gap:14px;align-items:stretch;}
      #pageDashboard .v8Kpi{min-height:96px;border-radius:22px!important;border:1px solid #dbe7f7!important;background:#fff!important;box-shadow:0 14px 34px rgba(15,23,42,.07)!important;padding:18px 20px!important;overflow:hidden;position:relative;}
      #pageDashboard .v8Kpi:before{content:'';position:absolute;inset:0 auto 0 0;width:4px;background:#0b84ff;opacity:.9;}
      #pageDashboard .v8Kpi:nth-child(1):before{background:#f59e0b;} #pageDashboard .v8Kpi:nth-child(2):before{background:#f59e0b;} #pageDashboard .v8Kpi:nth-child(3):before{background:#ef4444;} #pageDashboard .v8Kpi:nth-child(4):before{background:#22c55e;}
      #pageDashboard .v8Kpi b,#pageDashboard .v8Kpi strong{letter-spacing:-.02em;}
      #v9LatestList .gfDashTicketList{display:grid;grid-template-columns:1fr;gap:12px;width:100%;}
      #v9LatestList .gfDashTicketCard{position:relative;overflow:hidden;background:#fff;border:1px solid #dce8f7;border-radius:18px;padding:14px 14px 14px 20px;box-shadow:0 10px 24px rgba(15,23,42,.07);cursor:pointer;transition:transform .15s ease,box-shadow .15s ease,border-color .15s ease;min-height:142px;}
      #v9LatestList .gfDashTicketCard:hover{transform:translateY(-1px);box-shadow:0 14px 30px rgba(15,23,42,.10);border-color:#bfdbfe;}
      #v9LatestList .gfDashTicketCard:before{content:'';position:absolute;left:0;top:0;bottom:0;width:5px;background:#3b82f6;}
      #v9LatestList .gfDashTicketCard.new:before{background:#ef4444;} #v9LatestList .gfDashTicketCard.progress:before{background:#f59e0b;} #v9LatestList .gfDashTicketCard.critical:before{background:#dc2626;} #v9LatestList .gfDashTicketCard.done:before{background:#16a34a;}
      #v9LatestList .gfDashTicketTop{display:flex;align-items:flex-start;justify-content:space-between;gap:10px;margin-bottom:9px;}
      #v9LatestList .gfDashTicketRoute{display:flex;align-items:center;gap:9px;flex-wrap:wrap;color:#14532d;font-size:14px;font-weight:1000;line-height:1.25;min-width:0;text-transform:uppercase;}
      #v9LatestList .gfDashDept{display:inline-flex;align-items:center;gap:4px;border-radius:999px;padding:3px 8px;background:#edf5ff;color:#0b56c5;white-space:nowrap;}
      #v9LatestList .gfDashDept.man{background:#fff7ed;color:#9a3412;} #v9LatestList .gfDashDept.apo{background:#f0fdf4;color:#166534;} #v9LatestList .gfDashDept.ti{background:#eff6ff;color:#1d4ed8;}
      #v9LatestList .gfDashTicketRight{display:flex;align-items:center;gap:8px;flex:0 0 auto;}#v9LatestList .gfDashTicketNum{color:#09285a;font-size:22px;font-weight:1000;line-height:1;}#v9LatestList .gfDashTicketTime{white-space:nowrap;color:#475569;font-size:12px;font-weight:950;}
      #v9LatestList .gfDashTicketHead{display:flex;align-items:baseline;gap:7px;flex-wrap:wrap;margin-bottom:6px;}
      #v9LatestList .gfDashTicketHead h4{margin:0;color:#0b2f66;font-size:22px;line-height:1.12;font-weight:1000;letter-spacing:-.02em;text-transform:uppercase;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;}
      #v9LatestList .gfDashTicketHead b{color:#172554;font-size:17px;line-height:1.15;font-weight:1000;text-transform:uppercase;}
      #v9LatestList .gfDashTicketDesc{margin:0 0 12px;color:#334155;font-size:14px;font-weight:750;line-height:1.35;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;}
      #v9LatestList .gfDashUpdatePreview{display:inline-block;max-width:min(560px,100%);margin:0 0 10px;background:#f8fbff;border:1px solid #d9e7f7;border-radius:12px;padding:8px 10px;color:#223653;box-shadow:0 6px 14px rgba(15,23,42,.04);}
      #v9LatestList .gfDashUpdateMeta{font-size:12px;font-weight:950;color:#415575;line-height:1.25;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
      #v9LatestList .gfDashUpdateMeta b{color:#0b2f66;}
      #v9LatestList .gfDashUpdateText{margin-top:4px;font-size:13px;font-weight:750;color:#0f1f3d;line-height:1.32;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;}
      #v9LatestList .gfDashTicketBottom{display:grid;grid-template-columns:minmax(0,1fr) minmax(220px,auto);align-items:center;gap:10px;}#v9LatestList .gfDashTicketFoot{display:none;}
      #v9LatestList .gfDashAssignee{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:12px;font-weight:950;color:#334155;background:#f8fafc;border:1px solid #e2e8f0;border-radius:999px;padding:4px 9px;}
      #v9LatestList .gfDashTicketStatus{white-space:nowrap;border-radius:999px;padding:5px 10px;font-size:12px;font-weight:1000;border:1px solid transparent;}
      #v9LatestList .gfDashTicketStatus.new{background:#fee2e2;color:#b91c1c;border-color:#fecaca;} #v9LatestList .gfDashTicketStatus.progress{background:#fff7ed;color:#b45309;border-color:#fed7aa;} #v9LatestList .gfDashTicketStatus.critical{background:#fee2e2;color:#991b1b;border-color:#fca5a5;} #v9LatestList .gfDashTicketStatus.done{background:#dcfce7;color:#166534;border-color:#bbf7d0;}
      #v9LatestList .gfDashTicketActions{display:grid;grid-auto-flow:column;grid-auto-columns:minmax(150px,1fr);gap:9px;align-items:center;}
      #v9LatestList .gfDashTicketActions .btn{min-height:40px;padding:9px 14px;border-radius:12px;font-size:13px;font-weight:1000;box-shadow:none;width:100%;white-space:nowrap;}
      #v9LatestList .gfLoadMoreDashBtn{width:100%;margin-top:12px;border-radius:14px;}
      @media(min-width:980px){#v9LatestList .gfDashTicketCard{display:block;}#v9LatestList .gfDashTicketBottom{grid-template-columns:minmax(0,1fr) minmax(300px,auto);}}
      @media(max-width:900px){#pageDashboard .v8Grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;}#pageDashboard .v8Kpi{min-height:106px;padding:14px!important;border-radius:18px!important;}#v9LatestList .gfDashTicketCard{border-radius:16px;padding:13px 12px 13px 17px;min-height:154px;}#v9LatestList .gfDashTicketTop{align-items:flex-start;flex-direction:row;}#v9LatestList .gfDashTicketRoute{gap:8px;font-size:13px;}#v9LatestList .gfDashTicketNum{font-size:21px;}#v9LatestList .gfDashTicketRight{margin-left:auto;}#v9LatestList .gfDashTicketHead h4{font-size:20px;}#v9LatestList .gfDashTicketHead b{font-size:14px;}#v9LatestList .gfDashTicketTime{white-space:nowrap;}#v9LatestList .gfDashTicketBottom{grid-template-columns:1fr;gap:10px;}#v9LatestList .gfDashTicketActions{grid-template-columns:1fr 1fr;grid-auto-flow:initial;grid-auto-columns:initial;}#v9LatestList .gfDashTicketActions .btn{min-width:0;}}
@media(max-width:430px){#v9LatestList .gfDashTicketCard{min-height:160px;}#v9LatestList .gfDashTicketRoute{gap:7px;}#v9LatestList .gfDashTicketRoute span{font-size:12px;}#v9LatestList .gfDashTicketTime{font-size:12px;}#v9LatestList .gfDashTicketStatus{font-size:11px;padding:5px 8px;}#v9LatestList .gfDashTicketActions{gap:8px;}#v9LatestList .gfDashTicketActions .btn{font-size:13px;padding:9px 8px;min-height:42px;}}
    `;
    (document.head||document.documentElement).appendChild(st);
  }
  ensureLatestBoardCss();

  function syncUiState(){
    DB.dept = dept(DB.dept || window.gfDashboardDept || 'ALL'); window.gfDashboardDept=DB.dept;
    DB.mode = str(DB.mode || window.dashboardRangeMode || 'OPEN_NOW');
    var r=range(); DB.start=r.s; DB.end=r.e;
    try{ dashboardRangeMode=DB.mode; dashboardStartKey=DB.start; dashboardEndKey=DB.end; }catch(e){}
    window.dashboardRangeMode=DB.mode; window.dashboardStartKey=DB.start; window.dashboardEndKey=DB.end;
    var ds=document.getElementById('dashStartDate'), de=document.getElementById('dashEndDate'); if(ds) ds.value=DB.start||''; if(de) de.value=DB.end||'';
    document.querySelectorAll('[data-gf-dept-scope="dash"]').forEach(function(b){ b.classList.toggle('active', dept(b.getAttribute('data-gf-dept')||b.textContent)===DB.dept); });
    document.querySelectorAll('[data-dash-range]').forEach(function(b){ b.classList.toggle('active', str(b.getAttribute('data-dash-range'))===DB.mode); });
    var info=document.getElementById('dashRangeInfo');
    if(info){
      function br(k){return k?String(k).split('-').reverse().join('/'):'';}
      if(DB.mode==='OPEN_NOW') info.textContent='Visão: chamados em aberto agora';
      else if(DB.mode==='ALL') info.textContent='Período: todos os chamados';
      else info.textContent=(DB.start===DB.end?'Período: '+br(DB.start):'Período: '+br(DB.start)+' até '+br(DB.end));
    }
  }
  function ensureDeptButtons(){
    var box=document.getElementById('gfDashDeptFilter') || document.getElementById('gfdashDeptFilter');
    if(!box){
      var anchor=document.getElementById('v131DashFilter') || document.querySelector('#pageDashboard .dashFilters') || document.querySelector('#pageDashboard .quick') || document.querySelector('#pageDashboard');
      if(!anchor) return;
      box=document.createElement('div'); box.id='gfDashDeptFilter'; box.className='gfDeptFilter gfDashDeptFilter';
      box.innerHTML='<b>Departamento:</b><button type="button" class="gfDeptBtn" data-gf-dept-scope="dash" data-gf-dept="ALL">Todos</button><button type="button" class="gfDeptBtn" data-gf-dept-scope="dash" data-gf-dept="TI">💻 TI</button><button type="button" class="gfDeptBtn" data-gf-dept-scope="dash" data-gf-dept="MANUTENCAO">🛠️ Manutenção</button><button type="button" class="gfDeptBtn" data-gf-dept-scope="dash" data-gf-dept="APOIO">🤝 Apoio</button>';
      if(anchor.id==='pageDashboard') anchor.insertBefore(box, anchor.firstChild); else anchor.insertAdjacentElement('afterend',box);
    }
    syncUiState();
  }
  function publish(){
    window.dashboardAllTickets = DB.rows.slice();
    window.dashboardOpenTickets = rowsAll().filter(isOpen);
    window.dashboardTicketsInRange = function(){ return rowsContext().slice(); };
    window.dashboardTicketsByDateRange = function(){ return rowsContext().slice(); };
    window.dashboardTicketsResolvedInPeriod = function(){ return rowsDone().slice(); };
    try{ dashboardAllTickets=window.dashboardAllTickets; dashboardOpenTickets=window.dashboardOpenTickets; dashboardTicketsInRange=window.dashboardTicketsInRange; dashboardTicketsByDateRange=window.dashboardTicketsByDateRange; dashboardTicketsResolvedInPeriod=window.dashboardTicketsResolvedInPeriod; }catch(e){}
  }
  function render(){
    ensureDeptButtons(); syncUiState(); publish();
    var all=rowsAll(), open=all.filter(isOpen), done=rowsDone(), ctx=rowsContext();
    var newRows=open.filter(isNew), progress=open.filter(isProgress), crit=open.filter(critical);
    setTxt('v8Open',newRows.length); setTxt('v8Progress',progress.length); setTxt('v8Critical',crit.length); setTxt('v8DoneToday',done.length);
    var avg=done.length?Math.round(done.reduce(function(a,t){return a+Math.max(0,(ts(t.resolved_at||t.updated_at)-ts(t.created_at))/60000);},0)/done.length):0; setTxt('v8Avg',avg+'m');
    var topSector=group(ctx,'sector_name'), topAsset=group(ctx,function(t){return t.asset_name||t.service_name||t.equipment_name||'Não informado';});
    var topTech=group(done,function(t){return t.assigned_to_name||t.responsible_name||t.assigned_name||'Equipe';});
    setTxt('v8TopTech',(topTech[0]&&topTech[0].name)||'-'); setTxt('v8TopTechSub',((topTech[0]&&topTech[0].total)||0)+' resolvidos');
    setTxt('v8TopSector',(topSector[0]&&topSector[0].name)||'-'); setTxt('v8TopSectorSub',((topSector[0]&&topSector[0].total)||0)+' chamados');
    setTxt('v8TopAsset',(topAsset[0]&&topAsset[0].name)||'-'); setTxt('v8TopAssetSub',((topAsset[0]&&topAsset[0].total)||0)+' chamados');
    var cList=document.getElementById('v9CriticalList'); if(cList){ var c=crit.slice().sort(function(a,b){return ts(a.created_at)-ts(b.created_at);}); var html=c.length?c.slice(0,DB.criticalLimit).map(cardHtml).join('')+moreBtn('critical',Math.min(DB.criticalLimit,c.length),c.length):'<div class="empty">Nenhum chamado crítico nesse filtro.</div>'; if(cList.innerHTML!==html) cList.innerHTML=html; }
    var lList=document.getElementById('v9LatestList'); if(lList){ var l=ctx.slice().sort(function(a,b){return ts(b.updated_at||b.created_at)-ts(a.updated_at||a.created_at);}); var html2=gfDashTicketBoardHtml(l); if(lList.innerHTML!==html2) lList.innerHTML=html2; gfHydrateVisiblePublicUpdates(l); }
    try{ var cc=document.getElementById('v8CriticalCard'); if(cc) cc.classList.toggle('v8Blink',crit.length>0); }catch(e){}
    var upd=document.getElementById('v8Updated'); if(upd){ try{ upd.textContent='Atualizado '+new Date().toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'}); }catch(e){} }
  }

  var lastFetch=0;
  function mergeTicketLists(a,b){
    var map={};
    arr(a).forEach(function(t){ var id=idOf(t); if(id) map[id]=Object.assign({}, map[id]||{}, t); });
    arr(b).forEach(function(t){ var id=idOf(t); if(id) map[id]=Object.assign({}, map[id]||{}, t); });
    return Object.keys(map).map(function(k){return map[k];}).sort(function(x,y){ return (ts(y.updated_at||y.created_at)-ts(x.updated_at||x.created_at)) || (idOf(y)-idOf(x)); });
  }

  async function fetchAllTicketsForDashboard(){
    try{
      var rt=await fetch(api()+'/api/admin/tickets?light=1&limit=500&offset=0',{credentials:'include',cache:'no-store'});
      if(rt.status===401){location.href='/login';return [];}
      var jt=rt.ok?await rt.json():null;
      return (jt&&Array.isArray(jt.tickets))?jt.tickets:(jt&&Array.isArray(jt.rows)?jt.rows:[]);
    }catch(e){ console.warn('[GF V28] tickets full fetch:',e); return []; }
  }

  async function fetchRows(force){
    if(DB.loading) return;
    var needsFull = String(DB.mode||'').toUpperCase()==='ALL';
    if(!force && !needsFull && DB.rows.length && Date.now()-lastFetch<8000){ render(); return; }
    DB.loading=true; var seq=++DB.seq; render();
    try{
      var url=api()+'/api/admin/dashboard-v8?light=1';
      var r=await fetch(url,{credentials:'include',cache:'no-store'});
      if(r.status===401){location.href='/login';return;}
      var j=r.ok?await r.json():null;
      var rows=(j&&Array.isArray(j.rows))?j.rows:[];

      if(needsFull || !rows.length){
        var fullRows=await fetchAllTicketsForDashboard();
        if(fullRows.length) rows=mergeTicketLists(rows,fullRows);
      }

      if(seq!==DB.seq) return;
      if(rows.length){ DB.rows=rows; lastFetch=Date.now(); try{ sessionStorage.setItem('GF_DASHBOARD_V16_CACHE', JSON.stringify({at:lastFetch,rows:rows.slice(0,1500)})); }catch(e){} }
    }catch(e){ console.warn('[GF V15] dashboard fetch:',e); }
    finally{ DB.loading=false; render(); }
  }
  function loadCache(){
    try{ var raw=sessionStorage.getItem('GF_DASHBOARD_V16_CACHE')||sessionStorage.getItem('GF_DASHBOARD_CLEAN_CACHE')||sessionStorage.getItem('GF_DASHBOARD_CACHE')||''; if(!raw) return; var j=JSON.parse(raw); if(j&&Array.isArray(j.rows)){ DB.rows=j.rows; lastFetch=Number(j.at||0); } }catch(e){}
  }

  var gfDeptRenderTimer=0;
  window.setDashboardDeptFilter=function(v){
    var nextDept=dept(v);
    if(DB.dept===nextDept){ syncUiState(); return; }
    DB.dept=nextDept; DB.criticalLimit=4; DB.latestLimit=4;
    syncUiState();
    if(gfDeptRenderTimer) cancelAnimationFrame(gfDeptRenderTimer);
    gfDeptRenderTimer=requestAnimationFrame(function(){ gfDeptRenderTimer=0; render(); });
  };
  try{ setDashboardDeptFilter=window.setDashboardDeptFilter; }catch(e){}
  window.setDashboardRange=function(v){ DB.mode=str(v||'OPEN_NOW'); if(DB.mode!=='CUSTOM'){ var r=range(); DB.start=r.s; DB.end=r.e; } DB.criticalLimit=4; DB.latestLimit=4; render(); if(DB.mode==='ALL') fetchRows(true); };
  try{ setDashboardRange=window.setDashboardRange; }catch(e){}
  window.applyDashboardCustomRange=function(){ var ds=document.getElementById('dashStartDate'), de=document.getElementById('dashEndDate'); var s=str(ds&&ds.value), e=str(de&&de.value); if(!s||!e){alert('Informe a data inicial e final.');return;} if(s>e){alert('A data inicial não pode ser maior que a data final.');return;} DB.mode='CUSTOM'; DB.start=s; DB.end=e; DB.criticalLimit=4; DB.latestLimit=4; render(); };
  try{ applyDashboardCustomRange=window.applyDashboardCustomRange; }catch(e){}
  window.loadDashboardV8=function(){ return fetchRows(false); };
  try{ loadDashboardV8=window.loadDashboardV8; }catch(e){}
  // GF_STATUS_REFRESH_COUNTERS_20260620
  // Usado depois de Assumir/Finalizar para não esperar cache nem F5.
  window.gfDashboardForceRefresh=function(){ return fetchRows(true); };
  window.renderDashboardV9Lists=function(){ render(); };
  try{ renderDashboardV9Lists=window.renderDashboardV9Lists; }catch(e){}
  window.getDashboardFilterInfo=function(type){
    var typ=norm(type), rows=rowsContext(), title='Chamados', hint='Resultado do filtro atual.';
    if(typ==='OPEN'){ title='Aguardando atendimento'; rows=rowsAll().filter(isNew); }
    else if(typ==='PROGRESS'){ title='Em andamento'; rows=rowsAll().filter(isProgress); }
    else if(typ==='CRITICAL'){ title='SLA crítico'; rows=rowsAll().filter(critical); }
    else if(typ==='DONE'||typ==='DONE_PERIOD'||typ==='DONE_TODAY'||typ==='RESOLVED'){ title='Resolvidos no período'; hint='Fechados dentro do período e departamento selecionado.'; rows=rowsDone(); }
    return {title:title,hint:hint,rows:rows};
  };
  try{ getDashboardFilterInfo=window.getDashboardFilterInfo; }catch(e){}

  window.dashboardFilter=function(type){
    var info=window.getDashboardFilterInfo(type||'ALL');
    var rows=arr(info.rows).sort(function(a,b){ return ts(b.updated_at||b.created_at)-ts(a.updated_at||a.created_at); });
    var bg=document.getElementById('drawerBg')||window.drawerBg;
    var dd=document.getElementById('dashboardFilterDrawer')||window.dashboardFilterDrawer;
    if(bg) bg.classList.add('show');
    if(dd) dd.classList.add('show');
    try{ document.body.classList.add('gf-dashboard-filter-open'); }catch(e){}
    var tone=gfFilterTone(type||'ALL');
    setHtml('dfTitle',gfFilterTopCardHtml(info.title||'Detalhamento',rows.length,tone));
    setTxt('dfSubtitle','');
    setTxt('dfHint','');
    setTxt('dfCount','');
    var list=document.getElementById('dfList');
    if(list){ var html=rows.length?rows.map(gfDashTicketCardHtml).join(''):'<div class="empty">Nenhum chamado encontrado nesse filtro.</div>'; if(list.innerHTML!==html) list.innerHTML=html; }
  };
  try{ dashboardFilter=window.dashboardFilter; }catch(e){}
  window.gfRefreshOpenDashboardFilter=function(){ render(); };
  try{ gfRefreshOpenDashboardFilter=window.gfRefreshOpenDashboardFilter; }catch(e){}

  document.addEventListener('click',function(ev){
    var b=ev.target&&ev.target.closest&&ev.target.closest('[data-gf-dept-scope="dash"]');
    if(!b) return;
    ev.preventDefault(); ev.stopPropagation();
    window.setDashboardDeptFilter(b.getAttribute('data-gf-dept')||b.textContent||'ALL');
  },false);
  document.addEventListener('DOMContentLoaded',function(){ ensureDeptButtons(); loadCache(); render(); fetchRows(false); });
  if(document.readyState!=='loading'){ ensureDeptButtons(); loadCache(); render(); fetchRows(false); }
  setInterval(function(){ if(!document.hidden && String(window.__gfCurrentPage||'dashboard')==='dashboard' && !(window.gfIsMobileLiteV35&&window.gfIsMobileLiteV35())) fetchRows(true); },30000);
})();

(function(){
  'use strict';
  if(window.__GF_V24_FINISH_SINGLE_FLOW__) return;
  window.__GF_V24_FINISH_SINGLE_FLOW__ = true;

  function N(v){ var n=Number(v||0); return Number.isFinite(n) ? n : 0; }
  function norm(v){ return String(v==null?'':v).trim().toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g,''); }
  function arr(v){ return Array.isArray(v) ? v : []; }
  function myId(){
    try{ return N((typeof me!=='undefined' && me && me.id) || (window.me && window.me.id) || (window.currentUser && window.currentUser.id) || (window.user && window.user.id)); }catch(e){ return 0; }
  }
  function myName(){
    try{ return norm((typeof me!=='undefined' && me && (me.name||me.nome||me.username||me.full_name)) || (window.me && (window.me.name||window.me.nome||window.me.username||window.me.full_name)) || (window.currentUser && (window.currentUser.name||window.currentUser.nome||window.currentUser.username||window.currentUser.full_name))); }catch(e){ return ''; }
  }
  function localRows(){
    var out=[];
    try{ if(typeof tickets!=='undefined') out=out.concat(arr(tickets)); }catch(e){}
    try{ out=out.concat(arr(window.tickets)); }catch(e){}
    try{ out=out.concat(arr(window.dashboardAllTickets)); }catch(e){}
    try{ out=out.concat(arr(window.dashboardOpenTickets)); }catch(e){}
    try{ if(window.gfDashboardFilterRowsById) Object.keys(window.gfDashboardFilterRowsById).forEach(function(k){ if(window.gfDashboardFilterRowsById[k]) out.push(window.gfDashboardFilterRowsById[k]); }); }catch(e){}
    try{ var c=(typeof current!=='undefined') ? current : window.current; if(c) out.push(c); }catch(e){ if(window.current) out.push(window.current); }
    var seen={}, clean=[];
    out.forEach(function(t){
      if(!t) return;
      var id=N(t.id||t.ticket_id||t.db_id), no=N(t.ticket_number||t.number);
      var key=id ? ('id_'+id) : ('no_'+no);
      if(seen[key]) return;
      seen[key]=1; clean.push(t);
    });
    return clean;
  }
  function findLocal(key){
    key=N(key); if(!key) return null;
    var rows=localRows();
    for(var i=0;i<rows.length;i++){
      var t=rows[i]||{};
      if(N(t.id||t.ticket_id||t.db_id)===key || N(t.ticket_number||t.number)===key) return t;
    }
    return null;
  }
  function mergeLocal(t){
    if(!t) return t;
    var id=N(t.id||t.ticket_id||t.db_id);
    try{ if(typeof upsertTicketLocal==='function') return upsertTicketLocal(t) || t; }catch(e){}
    try{
      if(typeof tickets!=='undefined' && Array.isArray(tickets)){
        var ix=tickets.findIndex(function(x){ return N(x && (x.id||x.ticket_id||x.db_id))===id; });
        if(ix>=0) tickets[ix]=Object.assign({},tickets[ix],t); else if(id) tickets.unshift(t);
      }
    }catch(e){}
    try{
      window.tickets=Array.isArray(window.tickets)?window.tickets:[];
      var wx=window.tickets.findIndex(function(x){ return N(x && (x.id||x.ticket_id||x.db_id))===id; });
      if(wx>=0) window.tickets[wx]=Object.assign({},window.tickets[wx],t); else if(id) window.tickets.unshift(t);
    }catch(e){}
    try{ window.gfDashboardFilterRowsById=window.gfDashboardFilterRowsById||{}; if(id) window.gfDashboardFilterRowsById[id]=t; }catch(e){}
    return t;
  }
  async function fetchFull(key){
    key=N(key); if(!key) return null;
    try{ if(typeof fetchTicketByKey==='function'){ var a=await fetchTicketByKey(key); if(a) return mergeLocal(a); } }catch(e){}
    var base=''; try{ base=(typeof API!=='undefined' && API) ? API : ''; }catch(e){}
    var urls=[
      base+'/api/admin/tickets/'+encodeURIComponent(key),
      base+'/api/admin/ticket/'+encodeURIComponent(key),
      base+'/api/admin/tickets/by-key/'+encodeURIComponent(key)
    ];
    for(var i=0;i<urls.length;i++){
      try{
        var r=await fetch(urls[i],{credentials:'include'});
        if(r.status===401){ location.href='/login'; return null; }
        if(!r.ok) continue;
        var j=await r.json().catch(function(){return {};});
        var t=j.ticket || j.data || (Array.isArray(j.tickets)?j.tickets[0]:null);
        if(t) return mergeLocal(t);
      }catch(e){}
    }
    return null;
  }
  function ticketStatus(t){
    try{ if(typeof ticketStatusClean==='function') return ticketStatusClean(t); }catch(e){}
    var st=norm(t && t.status);
    if(st==='DONE'||st==='FINALIZADO'||st==='FINALIZED'||st==='RESOLVED') return 'DONE';
    if(st==='IN_PROGRESS'||st==='EM ANDAMENTO'||st==='ASSIGNED'||st==='PROGRESS'||(t&&(t.assigned_to_user_id||t.assigned_to_name||t.assigned_name))) return 'IN_PROGRESS';
    return 'NEW';
  }
  function owns(t){
    if(!t) return false;
    try{ if(typeof currentUserOwnsTicket==='function' && currentUserOwnsTicket(t)) return true; }catch(e){}
    var id=myId();
    if(id && N(t.assigned_to_user_id||t.assignee_id||t.user_id)===id) return true;
    var meName=myName();
    var assigned=norm(t.assigned_to_name||t.assigned_name||t.responsible_name||t.technician_name||t.user_name||t.taken_by_name);
    return !!(meName && assigned && meName===assigned);
  }
  function canHandle(){ try{ return typeof canHandleTickets==='function' ? !!canHandleTickets() : true; }catch(e){ return true; } }
  function canFinish(t){ return !!(canHandle() && t && ticketStatus(t)==='IN_PROGRESS' && owns(t)); }
  function keyFromButton(btn){
    if(!btn) return 0;
    var raw=btn.getAttribute('data-gf-resolve-ticket') || btn.getAttribute('data-gf-ticket-id') || btn.getAttribute('data-ticket-id') || '';
    if(!raw){
      var card=btn.closest('[data-gf-ticket-id],[data-ticket-id]');
      if(card) raw=card.getAttribute('data-gf-ticket-id') || card.getAttribute('data-ticket-id') || '';
    }
    return N(raw);
  }
  function setCurrentTicket(t){
    try{ current=t; }catch(e){}
    try{ window.current=t; }catch(e){}
  }
  function openResolveDirect(t){
    var id=N(t && (t.id||t.ticket_id||t.db_id));
    if(!id) return false;
    setCurrentTicket(t);
    try{ if(typeof pendingResolveTicketId!=='undefined') pendingResolveTicketId=id; }catch(e){}
    try{ window.pendingResolveTicketId=id; }catch(e){}

    var info=document.getElementById('resolveTicketInfo');
    if(info) info.innerHTML='Chamado #'+(t.ticket_number||id)+'<small>'+((t.asset_name||'-')+' · '+(t.issue_name||'-'))+'</small>';
    var txt=document.getElementById('resolveSolution');
    if(txt){ txt.value=(t.final_outcome==='SWAP' && ticketStatus(t)==='IN_PROGRESS') ? '' : (t.solution_note||''); }
    var photoInput=document.getElementById('resolvePhoto'); if(photoInput) photoInput.value='';
    var photoBox=document.getElementById('resolvePhotoBox'); try{ if(photoBox) photoBox.classList.toggle('show', typeof isTech==='function' ? isTech() : false); }catch(e){}
    var mt=document.getElementById('resolveMaintenanceType'); if(mt) mt.value=t.maintenance_type||'';
    var pn=document.getElementById('resolvePartName'); if(pn) pn.value=t.part_name||'';
    var mv=document.getElementById('resolveMaintenanceValue'); if(mv) mv.value=t.maintenance_value||'';
    var sp=document.getElementById('resolveSupplierName'); if(sp) sp.value=t.ticket_supplier_name||t.supplier_name||'';
    var md=document.getElementById('resolveMaintenanceDesc'); if(md) md.value=t.maintenance_description||'';
    var defaultOutcome=(t.final_outcome==='SWAP' && ticketStatus(t)==='IN_PROGRESS') ? 'RESOLVED' : (t.final_outcome||t.resolution_type||'RESOLVED');
    try{ var checked=document.querySelector('input[name="resolveOutcome"][value="'+defaultOutcome+'"]'); if(checked) checked.checked=true; }catch(e){}

    var bg=document.getElementById('resolveBg') || window.resolveBg;
    if(bg){
      try{ if(bg.parentElement!==document.body) document.body.appendChild(bg); }catch(e){}
      bg.classList.add('show');
      bg.style.zIndex='2147483200';
      var modal=bg.querySelector('.resolveModal');
      if(modal){ modal.style.zIndex='2147483201'; modal.scrollTop=0; }
      bg.scrollTop=0;
    }
    document.body.classList.add('resolveOpen');
    setTimeout(function(){ try{ if(txt) txt.focus({preventScroll:true}); }catch(e){} },80);
    return true;
  }
  async function finishFromButton(btn){
    var key=keyFromButton(btn);
    if(!key) return false;
    if(btn){ btn.disabled=true; btn.dataset.gfFinishBusy='1'; }
    try{
      var t=findLocal(key);
      if(!t || !t.status || !(t.assigned_to_user_id||t.assigned_to_name||t.assigned_name)) t=await fetchFull(key) || t;
      if(t && N(t.ticket_number||t.number)===key && N(t.id||t.ticket_id||t.db_id) && N(t.id||t.ticket_id||t.db_id)!==key){
        t=await fetchFull(N(t.id||t.ticket_id||t.db_id)) || t;
      }
      if(!t){ alert('Não consegui carregar este chamado para finalizar. Abra os detalhes e tente novamente.'); return false; }
      if(!canFinish(t)){
        alert((t.assigned_to_user_id||t.assigned_to_name||t.assigned_name) ? 'Somente quem assumiu este chamado pode finalizar.' : 'Assuma o chamado antes de finalizar.');
        return false;
      }
      return openResolveDirect(t);
    }finally{
      if(btn){ setTimeout(function(){ btn.disabled=false; delete btn.dataset.gfFinishBusy; },250); }
    }
  }

  window.gfCanFinishTicketById=function(id){
    var t=findLocal(id);
    if(!t) return true;
    return canFinish(t);
  };

  window.addEventListener('click', function(ev){
    var btn=ev.target && ev.target.closest && ev.target.closest('[data-gf-resolve-ticket]');
    if(!btn) return;
    var key=keyFromButton(btn);
    if(!key) return;
    ev.preventDefault();
    ev.stopPropagation();
    if(ev.stopImmediatePropagation) ev.stopImmediatePropagation();
    finishFromButton(btn);
    return false;
  }, true);
})();

(function(){
  'use strict';
  if(window.__GF_V26_DASHBOARD_MODAL_CONTEXT__) return;
  window.__GF_V26_DASHBOARD_MODAL_CONTEXT__ = true;

  var ctx = null;

  function visible(el){ return !!(el && el.classList && el.classList.contains('show')); }
  function getDrawer(){ return document.getElementById('dashboardFilterDrawer') || window.dashboardFilterDrawer || null; }
  function getBg(){ return document.getElementById('drawerBg') || window.drawerBg || null; }
  function getDetailDrawer(){ return document.getElementById('drawer') || window.drawer || null; }
  function getHistoryDrawer(){ return document.getElementById('historyDrawer') || window.historyDrawer || null; }
  function getList(){ return document.getElementById('dfList') || null; }

  window.gfSaveDashboardModalContext = function(){
    var dd = getDrawer();
    if(!visible(dd)) return false;
    var list = getList();
    ctx = {
      at: Date.now(),
      drawerScroll: Number(dd.scrollTop || 0),
      listScroll: Number(list && list.scrollTop || 0),
      title: (document.getElementById('dfTitle')||{}).textContent || '',
      subtitle: (document.getElementById('dfSubtitle')||{}).textContent || '',
      count: (document.getElementById('dfCount')||{}).textContent || '',
      dept: window.gfDashboardDept || window.dashboardDepartment || '',
      rangeMode: window.dashboardRangeMode || '',
      filterType: window.lastDashboardFilterType || ''
    };
    return true;
  };

  window.gfRestoreDashboardModalContext = function(){
    if(!ctx) return false;
    var dd = getDrawer();
    var bg = getBg();
    var detail = getDetailDrawer();
    var hist = getHistoryDrawer();
    var list = getList();
    if(!dd) { ctx = null; return false; }

    if(detail) detail.classList.remove('show');
    if(hist) hist.classList.remove('show');
    if(bg) bg.classList.add('show');
    dd.classList.add('show');

    var saved = ctx;
    ctx = null;
    setTimeout(function(){
      try{ dd.scrollTop = Number(saved.drawerScroll || 0); }catch(e){}
      try{ if(list) list.scrollTop = Number(saved.listScroll || 0); }catch(e){}
    }, 30);
    setTimeout(function(){
      try{ dd.scrollTop = Number(saved.drawerScroll || 0); }catch(e){}
      try{ if(list) list.scrollTop = Number(saved.listScroll || 0); }catch(e){}
    }, 120);
    return true;
  };

  document.addEventListener('pointerdown', function(ev){
    try{
      var dd = getDrawer();
      if(!visible(dd)) return;
      var btn = ev.target && ev.target.closest && ev.target.closest('[data-gf-open-ticket], .v9FilterItem[data-gf-ticket-id], .gfV216Card[data-gf-ticket-id], [data-ticket-id]');
      if(btn && dd.contains(btn)) window.gfSaveDashboardModalContext();
    }catch(e){}
  }, true);
})();

(function(){
  'use strict';
  if(window.__GF_V29_RESOLVE_CAMERA__) return;
  window.__GF_V29_RESOLVE_CAMERA__ = true;

  var stream = null;
  var enhanced = false;
  var lastOpenState = false;

  function $(id){ return document.getElementById(id); }
  function isResolveOpen(){ var bg=$('resolveBg'); return !!(bg && bg.classList.contains('show')); }
  function syncResolveLock(){ try{ document.documentElement.classList.toggle('gfResolveModalLocked', isResolveOpen()); }catch(e){} }
  function techNeedsPhoto(){ try{ return typeof isTech === 'function' ? !!isTech() : false; }catch(e){ return false; } }

  function ensureStyle(){
    if($('gfResolveCameraStyle')) return;
    var st=document.createElement('style');
    st.id='gfResolveCameraStyle';
    st.textContent = `
      #resolvePhotoBox .gfResolveCameraWrap{margin-top:8px;display:grid;gap:8px}
      #resolvePhotoBox .gfResolveCameraActions{display:flex;gap:8px;flex-wrap:wrap;align-items:center}
      #resolvePhotoBox .gfResolveCameraActions .btn{min-height:38px;padding:9px 12px;font-size:13px;line-height:1.1}
      #resolvePhotoBox .gfResolveCameraHint{font-size:11px;color:#64748b;font-weight:800;line-height:1.25;margin:0}
      #resolvePhotoBox .gfResolveCameraStage{display:none;border:1px solid #dbe6f5;background:#f8fbff;border-radius:14px;padding:8px;gap:8px}
      #resolvePhotoBox .gfResolveCameraStage.show{display:grid}
      #resolvePhotoBox video.gfResolveVideo,#resolvePhotoBox img.gfResolvePreview{width:100%;max-height:260px;object-fit:contain;background:#07111f;border-radius:12px;border:1px solid #dbe6f5}
      #resolvePhotoBox .gfResolvePreviewBox{display:none;gap:8px}
      #resolvePhotoBox .gfResolvePreviewBox.show{display:grid}
      #resolvePhotoBox .gfResolveNativeFallback{display:none;margin-top:6px}
      #resolvePhotoBox.gfCameraFallback .gfResolveNativeFallback{display:block}
      #resolvePhotoBox.gfCameraFallback .gfResolveCameraHint{color:#9a3412}
      @media(max-width:700px){
        html.gfResolveModalLocked,body.resolveOpen{overflow:hidden!important;overscroll-behavior:none!important}
        #resolveBg.show{
          position:fixed!important;
          inset:0!important;
          width:100vw!important;
          height:100dvh!important;
          display:flex!important;
          align-items:center!important;
          justify-content:center!important;
          overflow:hidden!important;
          padding:8px!important;
          box-sizing:border-box!important;
          background:rgba(15,23,42,.58)!important;
        }
        #resolveBg.show .resolveModal{
          width:100%!important;
          max-width:430px!important;
          max-height:calc(100dvh - 16px)!important;
          overflow-y:auto!important;
          overflow-x:hidden!important;
          overscroll-behavior:contain!important;
          -webkit-overflow-scrolling:touch!important;
          box-sizing:border-box!important;
          border-radius:18px!important;
          padding:10px!important;
          margin:0!important;
          position:relative!important;
          transform:none!important;
        }
        #resolveBg.show .resolveModal *{box-sizing:border-box!important;max-width:100%}
        #resolvePhotoBox{margin-top:5px!important;overflow:visible!important;max-width:100%!important}
        #resolvePhotoBox.show{display:block!important}
        #resolvePhotoBox .gfResolveCameraWrap{gap:5px!important;margin-top:5px!important;max-width:100%!important;overflow:hidden!important}
        #resolvePhotoBox .gfResolveCameraHint{font-size:10px!important;line-height:1.1!important;margin:0!important}
        #resolvePhotoBox .gfResolveCameraActions{gap:5px!important;display:grid!important;grid-template-columns:1fr 1fr!important;width:100%!important}
        #resolvePhotoBox .gfResolveCameraActions .btn{width:100%!important;min-width:0!important;min-height:32px!important;padding:7px 6px!important;font-size:11.5px!important;border-radius:10px!important;white-space:normal!important}
        #resolvePhotoBox .gfResolveCameraStage{padding:5px!important;gap:5px!important;border-radius:12px!important;max-height:32dvh!important;overflow:hidden!important;position:relative!important}
        #resolvePhotoBox video.gfResolveVideo,#resolvePhotoBox img.gfResolvePreview{width:100%!important;height:auto!important;max-height:20dvh!important;object-fit:contain!important;border-radius:10px!important;display:block!important;position:relative!important}
        #resolvePhotoBox .gfResolvePreviewBox{gap:5px!important;max-height:31dvh!important;overflow:hidden!important;position:relative!important}
        #resolveSolution{max-height:70px!important;min-height:54px!important}
      }
      @media(max-width:380px){
        #resolveBg.show{padding:6px!important}
        #resolveBg.show .resolveModal{max-height:calc(100dvh - 12px)!important;padding:8px!important;border-radius:16px!important}
        #resolvePhotoBox video.gfResolveVideo,#resolvePhotoBox img.gfResolvePreview{max-height:17dvh!important}
        #resolvePhotoBox .gfResolveCameraActions .btn{font-size:11px!important;min-height:30px!important;padding:6px 5px!important}
      }
    `;
    document.head.appendChild(st);
  }

  function fileInput(){
    var input=$('resolvePhoto');
    if(input){
      try{
        input.setAttribute('accept','image/*');
        input.removeAttribute('capture');
      }catch(e){}
    }
    return input;
  }

  function openFilePicker(){
    stopCamera();
    var input=fileInput();
    if(!input) return;
    try{
      input.setAttribute('accept','image/*');
      input.removeAttribute('capture');
      input.click();
    }catch(e){}
  }

  function stopCamera(){
    try{ if(stream){ stream.getTracks().forEach(function(t){ try{ t.stop(); }catch(e){} }); } }catch(e){}
    stream=null;
    var video=$('gfResolveVideo');
    if(video){ try{ video.srcObject=null; }catch(e){} }
  }

  function setInputFile(file){
    var input=fileInput();
    if(!input || !file) return false;
    try{
      var dt=new DataTransfer();
      dt.items.add(file);
      input.files=dt.files;
      try{ input.dispatchEvent(new Event('change',{bubbles:true})); }catch(e){}
      return true;
    }catch(e){
      return false;
    }
  }

  function clearPhoto(){
    stopCamera();
    var input=fileInput();
    if(input) input.value='';
    var img=$('gfResolvePreview');
    if(img){ img.removeAttribute('src'); }
    var preview=$('gfResolvePreviewBox');
    if(preview) preview.classList.remove('show');
    var stage=$('gfResolveCameraStage');
    if(stage) stage.classList.remove('show');
    var openBtn=$('gfOpenResolveCamera');
    if(openBtn) openBtn.disabled=false;
  }

  function enhancePhotoBox(){
    var box=$('resolvePhotoBox');
    if(!box) return;
    ensureStyle();
    var input=fileInput();
    if(!input) return;

    if(!enhanced){
      enhanced=true;
      input.classList.add('gfResolveNativeFallback');
      var wrap=document.createElement('div');
      wrap.className='gfResolveCameraWrap';
      wrap.innerHTML = `
        <div class="gfResolveCameraHint">📷 Tire a foto, confira a prévia e finalize.</div>
        <div class="gfResolveCameraActions">
          <button type="button" class="btn btnPrimary" id="gfOpenResolveCamera">Câmera</button>
          <button type="button" class="btn" id="gfFallbackResolvePhoto">Arquivo</button>
        </div>
        <div class="gfResolveCameraStage" id="gfResolveCameraStage">
          <video class="gfResolveVideo" id="gfResolveVideo" autoplay playsinline muted></video>
          <div class="gfResolveCameraActions">
            <button type="button" class="btn btnDark" id="gfCaptureResolvePhoto">Tirar</button>
            <button type="button" class="btn" id="gfCancelResolveCamera">Cancelar</button>
          </div>
        </div>
        <div class="gfResolvePreviewBox" id="gfResolvePreviewBox">
          <img class="gfResolvePreview" id="gfResolvePreview" alt="Prévia da foto da resolução">
          <div class="gfResolveCameraActions">
            <button type="button" class="btn btnPrimary" id="gfUseResolvePhoto">Usar foto</button>
            <button type="button" class="btn btnDanger" id="gfDeleteResolvePhoto">Refazer</button>
          </div>
        </div>`;
      input.insertAdjacentElement('afterend', wrap);

      $('gfOpenResolveCamera')?.addEventListener('click', openCamera);
      $('gfFallbackResolvePhoto')?.addEventListener('click', openFilePicker);
      $('gfCaptureResolvePhoto')?.addEventListener('click', capturePhoto);
      $('gfCancelResolveCamera')?.addEventListener('click', stopAndHideCamera);
      $('gfDeleteResolvePhoto')?.addEventListener('click', clearPhoto);
      $('gfUseResolvePhoto')?.addEventListener('click', function(){
        try{ if(typeof toastMsg==='function') toastMsg('Foto pronta para enviar.'); }catch(e){}
      });
      input.addEventListener('change', function(){
        var f=input.files && input.files[0];
        if(!f) return;
        if(!String(f.type||'').startsWith('image/')){ alert('Envie apenas foto/imagem. Vídeo não é permitido.'); input.value=''; return; }
        showPreview(URL.createObjectURL(f));
      });
    }
    box.classList.toggle('gfCameraFallback', !('mediaDevices' in navigator && navigator.mediaDevices && navigator.mediaDevices.getUserMedia));
  }

  async function openCamera(){
    var box=$('resolvePhotoBox');
    enhancePhotoBox();
    if(!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia){
      if(box) box.classList.add('gfCameraFallback');
      alert('Este navegador não liberou câmera direta. Use a opção Arquivo para escolher uma imagem.');
      return;
    }
    stopCamera();
    var btn=$('gfOpenResolveCamera');
    if(btn) btn.disabled=true;
    try{
      stream=await navigator.mediaDevices.getUserMedia({
        video:{ facingMode:{ ideal:'environment' }, width:{ ideal:1280 }, height:{ ideal:720 } },
        audio:false
      });
      var video=$('gfResolveVideo');
      var stage=$('gfResolveCameraStage');
      if(video) video.srcObject=stream;
      if(stage) stage.classList.add('show');
      try{ await video.play(); }catch(e){}
    }catch(e){
      if(box) box.classList.add('gfCameraFallback');
      alert('Não consegui abrir a câmera. Verifique a permissão ou use a opção Arquivo.');
    }finally{
      if(btn) btn.disabled=false;
    }
  }

  function stopAndHideCamera(){
    stopCamera();
    var stage=$('gfResolveCameraStage');
    if(stage) stage.classList.remove('show');
  }

  function capturePhoto(){
    var video=$('gfResolveVideo');
    if(!video || !video.videoWidth){ alert('A câmera ainda não está pronta. Tente novamente.'); return; }
    var canvas=document.createElement('canvas');
    var maxW=1280;
    var scale=Math.min(1, maxW / video.videoWidth);
    canvas.width=Math.round(video.videoWidth*scale);
    canvas.height=Math.round(video.videoHeight*scale);
    var ctx=canvas.getContext('2d');
    ctx.drawImage(video,0,0,canvas.width,canvas.height);
    canvas.toBlob(function(blob){
      if(!blob){ alert('Não consegui capturar a foto.'); return; }
      var name='resolucao_chamado_'+Date.now()+'.jpg';
      var file=new File([blob], name, {type:'image/jpeg', lastModified:Date.now()});
      if(!setInputFile(file)){
        alert('Seu navegador não permitiu anexar a foto automaticamente. Use a opção Arquivo.');
        return;
      }
      showPreview(URL.createObjectURL(file));
      stopAndHideCamera();
    }, 'image/jpeg', 0.86);
  }

  function showPreview(url){
    var img=$('gfResolvePreview');
    var preview=$('gfResolvePreviewBox');
    if(img) img.src=url;
    if(preview) preview.classList.add('show');
  }

  function resetWhenModalOpens(){
    syncResolveLock();
    enhancePhotoBox();
    clearPhoto();
  }

  var oldOpen=window.openResolveModal;
  if(typeof oldOpen==='function'){
    window.openResolveModal=function(){
      var ret=oldOpen.apply(this, arguments);
      setTimeout(resetWhenModalOpens, 40);
      return ret;
    };
    try{ openResolveModal=window.openResolveModal; }catch(e){}
  }

  var oldClose=window.closeResolveModal;
  if(typeof oldClose==='function'){
    window.closeResolveModal=function(){
      clearPhoto();
      var r = oldClose.apply(this, arguments);
      setTimeout(syncResolveLock, 0);
      return r;
    };
    try{ closeResolveModal=window.closeResolveModal; }catch(e){}
  }

  document.addEventListener('DOMContentLoaded', function(){
    enhancePhotoBox();
    var bg=$('resolveBg');
    if(bg){
      try{
        new MutationObserver(function(){
          var open=isResolveOpen();
          if(open && !lastOpenState) resetWhenModalOpens();
          if(!open && lastOpenState) clearPhoto();
          syncResolveLock();
          lastOpenState=open;
        }).observe(bg,{attributes:true,attributeFilter:['class']});
      }catch(e){}
    }
  });
})();

(function(){
  'use strict';
  if(window.__GF_REALTIME_TICKETS_V30__) return;
  window.__GF_REALTIME_TICKETS_V30__ = true;

  var es = null;
  var reconnectTimer = null;
  var lastShown = Object.create(null);

  function apiBase(){ return (window.API || window.location.origin || '').replace(/\/$/,''); }
  function ticketKey(t){ return String((t && (t.id || t.ticket_id || t.ticket_number)) || ''); }
  function seenRecently(key){
    if(!key) return false;
    var now = Date.now();
    if(lastShown[key] && now - lastShown[key] < 12000) return true;
    lastShown[key] = now;
    try{ sessionStorage.setItem('GF_RT_LAST_TICKET_'+key, String(now)); }catch(_){}
    return false;
  }
  function normalizeTicket(t){
    t = t || {};
    if(t.ticket_id && !t.id) t.id = t.ticket_id;
    return t;
  }
  async function showSystemNotification(t){
    try{
      if(!('Notification' in window) || Notification.permission !== 'granted') return;
      var reg = null;
      try{ if('serviceWorker' in navigator) reg = await navigator.serviceWorker.ready; }catch(_){ reg = null; }
      var no = t.ticket_number || t.id || t.ticket_id || '';
      var dept = t.department || t.asset_department || 'Chamado';
      var setor = t.sector_name || t.sector || 'Setor não informado';
      var problema = t.issue_name || t.problem || t.description || 'Novo chamado aberto';
      var title = '🔔 Chamado #' + no + ' — ' + dept;
      var opts = {
        body: '📍 ' + setor + '\n⚠️ ' + problema,
        tag: 'ticket-' + (t.company_id || '') + '-' + no,
        renotify: true,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        data: { ticket_id: t.id || t.ticket_id, ticket_number: no }
      };
      if(reg && reg.showNotification) await reg.showNotification(title, opts);
      else new Notification(title, opts);
    }catch(e){ console.warn('[GF REALTIME] notification:', e); }
  }
  function applyTicketCreated(raw){
    var t = normalizeTicket(raw || {});
    var key = ticketKey(t);
    if(seenRecently(key)) return;

    try{ if(typeof window.beep === 'function') window.beep(); }catch(_){}
    try{ if(typeof window.toastMsg === 'function') window.toastMsg('Novo chamado recebido!'); }catch(_){}
    try{ if(typeof window.gfAppNotifyTickets === 'function') window.gfAppNotifyTickets([t]); }catch(_){}
    try{ showSystemNotification(t); }catch(_){}

    try{ if(typeof window.loadTickets === 'function') window.loadTickets(); }catch(_){}
    try{ if(typeof window.loadDashboardV8 === 'function') window.loadDashboardV8(); }catch(_){}
    try{ if(typeof window.renderDashboardV9Lists === 'function') window.renderDashboardV9Lists(); }catch(_){}
  }
  function connect(){
    try{
      if(es) { try{ es.close(); }catch(_){} es = null; }
      es = new EventSource(apiBase() + '/api/admin/realtime', { withCredentials:true });
      es.addEventListener('ticket_created', function(ev){
        try{ applyTicketCreated(JSON.parse(ev.data || '{}')); }catch(e){ console.warn('[GF REALTIME] ticket_created:', e); }
      });
      es.addEventListener('ready', function(){ console.info('[GF REALTIME] conectado'); });
      es.onerror = function(){
        try{ es.close(); }catch(_){}
        es = null;
        clearTimeout(reconnectTimer);
        reconnectTimer = setTimeout(connect, 4000);
      };
    }catch(e){
      clearTimeout(reconnectTimer);
      reconnectTimer = setTimeout(connect, 5000);
    }
  }
  if(window.EventSource){
    if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', connect);
    else connect();
    window.addEventListener('beforeunload', function(){ try{ if(es) es.close(); }catch(_){} });
  }else{
    console.warn('[GF REALTIME] EventSource não suportado neste navegador. Push/polling continuam como fallback.');
  }
})();

(function(){
  'use strict';
  if(window.__GF_V33_RESOLVE_MOBILE_LAYOUT__) return;
  window.__GF_V33_RESOLVE_MOBILE_LAYOUT__ = true;
  var st=document.createElement('style');
  st.id='gfResolveMobileLayoutV33';
  st.textContent = `
    @media(max-width:700px){
      html.gfResolveModalLocked, body.resolveOpen{overflow:hidden!important;overscroll-behavior:none!important;touch-action:auto!important}
      #resolveBg.show{
        position:fixed!important;
        inset:0!important;
        width:100vw!important;
        height:100dvh!important;
        display:flex!important;
        align-items:flex-start!important;
        justify-content:center!important;
        overflow:hidden!important;
        padding:10px 8px!important;
        box-sizing:border-box!important;
        background:rgba(15,23,42,.62)!important;
      }
      #resolveBg.show .resolveModal{
        width:100%!important;
        max-width:430px!important;
        height:auto!important;
        max-height:calc(100dvh - 20px)!important;
        margin:0!important;
        padding:0!important;
        border-radius:20px!important;
        overflow-y:auto!important;
        overflow-x:hidden!important;
        -webkit-overflow-scrolling:touch!important;
        overscroll-behavior:contain!important;
        display:block!important;
        box-sizing:border-box!important;
      }
      #resolveBg.show .resolveHead{
        position:sticky!important;
        top:0!important;
        z-index:5!important;
        background:#fff!important;
        padding:14px 14px 10px!important;
        border-bottom:1px solid #e5edf7!important;
      }
      #resolveBg.show .resolveHead h2{font-size:24px!important;line-height:1.05!important;margin:0!important}
      #resolveBg.show .resolveHead small{font-size:11px!important;line-height:1.05!important;letter-spacing:.09em!important}
      #resolveBg.show .resolveClose{width:40px!important;height:40px!important;min-width:40px!important}
      #resolveBg.show .resolveBody{
        overflow:visible!important;
        max-height:none!important;
        padding:12px 14px 6px!important;
        display:block!important;
      }
      #resolveBg.show .resolveTicketBox{padding:12px 14px!important;border-radius:16px!important;margin-bottom:12px!important}
      #resolveBg.show label{font-size:11px!important;line-height:1.15!important;margin:8px 0 5px!important;letter-spacing:.04em!important}
      #resolveBg.show .resolveOptions{display:grid!important;gap:8px!important;margin-bottom:10px!important}
      #resolveBg.show .resolveOption{padding:12px!important;border-radius:14px!important;min-height:auto!important}
      #resolveBg.show .resolveOption span{font-size:14px!important;line-height:1.1!important}
      #resolveBg.show .resolveOption small{font-size:10.5px!important;line-height:1.15!important;margin-top:3px!important}
      #resolveSolution{
        min-height:82px!important;
        max-height:110px!important;
        resize:vertical!important;
        font-size:14px!important;
        line-height:1.25!important;
      }
      #resolvePhotoBox{
        margin:10px 0!important;
        padding:10px!important;
        border-radius:14px!important;
        overflow:visible!important;
        max-width:100%!important;
      }
      #resolvePhotoBox.show{display:block!important}
      #resolvePhotoBox > label{margin-top:0!important;font-size:10.5px!important;line-height:1.1!important}
      #resolvePhotoBox > small{display:block!important;font-size:10.5px!important;line-height:1.2!important;margin-top:5px!important}
      #resolvePhotoBox .gfResolveCameraWrap{gap:6px!important;margin-top:6px!important;overflow:visible!important}
      #resolvePhotoBox .gfResolveCameraHint{font-size:10px!important;line-height:1.15!important}
      #resolvePhotoBox .gfResolveCameraActions{display:grid!important;grid-template-columns:1fr 1fr!important;gap:6px!important;width:100%!important}
      #resolvePhotoBox .gfResolveCameraActions .btn{width:100%!important;min-width:0!important;min-height:34px!important;padding:7px 6px!important;font-size:11px!important;border-radius:10px!important;line-height:1.1!important;white-space:normal!important}
      #resolvePhotoBox .gfResolveCameraStage{padding:6px!important;gap:6px!important;border-radius:12px!important;max-height:none!important;overflow:visible!important;position:relative!important}
      #resolvePhotoBox video.gfResolveVideo,
      #resolvePhotoBox img.gfResolvePreview{width:100%!important;height:auto!important;max-height:22dvh!important;object-fit:contain!important;border-radius:10px!important;display:block!important;position:relative!important}
      #resolvePhotoBox .gfResolvePreviewBox{gap:6px!important;max-height:none!important;overflow:visible!important;position:relative!important}
      #resolveBg.show .resolveCostBox,
      #resolveBg.show .v16PlusCost{margin-top:8px!important;display:grid!important;gap:8px!important}
      #resolveBg.show .resolveCostBox label,
      #resolveBg.show .v16PlusCost label{font-size:10.5px!important;margin:0!important}
      #resolveBg.show .resolveCostBox input,
      #resolveBg.show .resolveCostBox select,
      #resolveBg.show .v16PlusCost input,
      #resolveBg.show .v16PlusCost select{min-height:42px!important;padding:10px 12px!important;font-size:13px!important;border-radius:12px!important}
      #resolveBg.show .resolveHint{font-size:11px!important;line-height:1.25!important;margin:10px 0!important;padding:9px!important;border-radius:12px!important}
      #resolveBg.show .resolveFoot{
        position:static!important;
        sticky:auto!important;
        bottom:auto!important;
        left:auto!important;
        right:auto!important;
        top:auto!important;
        transform:none!important;
        z-index:auto!important;
        width:auto!important;
        max-width:none!important;
        margin:8px 14px 14px!important;
        padding:0!important;
        background:transparent!important;
        box-shadow:none!important;
        border:0!important;
        display:grid!important;
        grid-template-columns:1fr!important;
        gap:8px!important;
      }
      #resolveBg.show .resolveFoot .btn{width:100%!important;min-height:48px!important;border-radius:14px!important;font-size:14px!important;margin:0!important}
      #resolveBg.show .resolveModal::after{content:'';display:block;height:6px!important}
    }
    @media(max-width:380px){
      #resolveBg.show{padding:6px!important}
      #resolveBg.show .resolveModal{max-height:calc(100dvh - 12px)!important;border-radius:17px!important}
      #resolveBg.show .resolveHead{padding:12px 12px 9px!important}
      #resolveBg.show .resolveBody{padding:10px 12px 4px!important}
      #resolvePhotoBox video.gfResolveVideo,
      #resolvePhotoBox img.gfResolvePreview{max-height:18dvh!important}
      #resolveBg.show .resolveFoot{margin:8px 12px 12px!important}
    }
  `;
  document.head.appendChild(st);
})();

;
(function(){
  'use strict';
  if(window.__gfOperationConsultaV41) return;
  window.__gfOperationConsultaV41 = true;

  var STORE='gf_op_consulta_v41';
  var APIBASE = window.API || (typeof API!=='undefined'?API:'');
  var state = loadState();
  var allTickets = Array.isArray(window.gfOpAllTicketsV41) ? window.gfOpAllTicketsV41 : (Array.isArray(window.gfOpAllTicketsV40) ? window.gfOpAllTicketsV40 : []);
  var loadedAll = allTickets.length>0, loading=false, renderDebounce=null, contextExpanded=false;
  // Cache leve da Central: evita remontar/filtrar tudo a cada clique/tecla.
  // Não muda regra de negócio; só reaproveita resultado enquanto dados e filtros não mudam.
  var gfOcCache={version:'',tickets:null,rowsKey:'',rows:null,filtersKey:'',filtersHtml:''};
  function gfOcDataVersion(){
    var a=Array.isArray(allTickets)?allTickets.length:0;
    var b=0,c=0,d=0;
    try{b=Array.isArray(window.dashboardAllTickets)?window.dashboardAllTickets.length:0}catch(e){}
    try{c=Array.isArray(window.tickets)?window.tickets.length:0}catch(e){}
    try{if(typeof tickets!=='undefined'&&Array.isArray(tickets))d=tickets.length}catch(e){}
    return [a,b,c,d].join('|');
  }
  function gfOcInvalidateCache(){gfOcCache.version='';gfOcCache.tickets=null;gfOcCache.rowsKey='';gfOcCache.rows=null;gfOcCache.filtersKey='';gfOcCache.filtersHtml='';}


  function loadState(){
    var def={range:'TODAY',status:'ALL',sector:'',tech:'',type:'ALL',query:'',from:'',to:''};
    try{
      var saved=JSON.parse(localStorage.getItem(STORE)||'{}')||{};
      var out=Object.assign({},def,saved);
      // A Central nunca deve iniciar em "Todos" depois de refresh/voltar: isso carrega dado velho e pesa a tela.
      // Só usa outro período quando o usuário clicar durante a sessão.
      if(!sessionStorage.getItem('gf_oc_keep_period_session')){
        out.range='TODAY'; out.from=''; out.to='';
      }
      if(String(out.range||'').toUpperCase()==='ALL') out.range='TODAY';
      out.status=out.status||'ALL'; out.type=out.type||'ALL';
      return out;
    }catch(e){return def}
  }
  function saveState(){try{localStorage.setItem(STORE,JSON.stringify(state))}catch(e){} gfOcCache.rowsKey=''; gfOcCache.rows=null;}
  function byId(id){return document.getElementById(id)}
  function arr(v){return Array.isArray(v)?v:[]}
  function txt(v){return String(v==null?'':v).trim()}
  function esc(v){return txt(v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
  function norm(v){return txt(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase()}
  function money(v){return (Number(v||0)||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}
  function setText(id,v){var e=byId(id); if(e) e.textContent=v}
  function setHtml(id,v){var e=byId(id); if(e) e.innerHTML=v}
  function parseDate(v){if(!v)return 0;var s=String(v).trim();if(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}/.test(s))s=s.replace(' ','T');var d=new Date(s);return isNaN(d.getTime())?0:d.getTime()}
  function fmt(v){var d=parseDate(v);return d?new Date(d).toLocaleString('pt-BR',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'}):'-'}
  function startDay(o){var d=new Date();d.setDate(d.getDate()+(o||0));d.setHours(0,0,0,0);return d.getTime()}
  function endDay(o){var d=new Date();d.setDate(d.getDate()+(o||0));d.setHours(23,59,59,999);return d.getTime()}
  function monthStart(){var d=new Date();d.setDate(1);d.setHours(0,0,0,0);return d.getTime()}
  function isoDay(offset){var d=new Date();d.setDate(d.getDate()+(offset||0));var y=d.getFullYear(),m=String(d.getMonth()+1).padStart(2,'0'),day=String(d.getDate()).padStart(2,'0');return y+'-'+m+'-'+day}
  function bounds(){var r=norm(state.range||'TODAY'),now=Date.now();
    if(r==='TODAY')return {a:startDay(0),b:endDay(0),label:'Hoje'};
    if(r==='YESTERDAY')return {a:startDay(-1),b:endDay(-1),label:'Ontem'};
    if(r==='7'||r==='15'||r==='30')return {a:now-Number(r)*86400000,b:Infinity,label:'Últimos '+r+' dias'};
    if(r==='MONTH')return {a:monthStart(),b:Infinity,label:'Mês atual'};
    if(r==='ALL')return {a:0,b:Infinity,label:'Todos os períodos'};
    if(r==='CUSTOM'){var ff=state.from||isoDay(0), tt=state.to||ff;return {a:new Date(ff+'T00:00:00').getTime(),b:new Date(tt+'T23:59:59').getTime(),label:'Personalizado'};}
    return {a:startDay(0),b:endDay(0),label:'Hoje'};
  }
  function mergeConsultaTickets(){
    var map={};
    function putList(list){
      arr(list).forEach(function(t){
        if(!t)return;
        var id=String(t.id||t.ticket_id||t.db_id||t.ticket_number||'');
        if(!id)return;
        var prev=map[id]||{};
        var merged=Object.assign({}, prev, t);
        if(done(prev)||done(t)){
          merged.status='DONE';
          merged.resolved_at = merged.resolved_at || prev.resolved_at || t.resolved_at || prev.closed_at || t.closed_at || prev.finished_at || t.finished_at || prev.completed_at || t.completed_at || prev.done_at || t.done_at || prev.finalized_at || t.finalized_at || merged.updated_at || prev.updated_at || t.updated_at;
        }
        map[id]=merged;
      });
    }
    putList(allTickets);
    try{putList(window.dashboardAllTickets)}catch(e){}
    try{putList(window.tickets)}catch(e){}
    try{if(typeof tickets!=='undefined')putList(tickets)}catch(e){}
    try{
      ['GF_DASHBOARD_V16_CACHE','GF_DASHBOARD_CACHE','GF_DASHBOARD_CLEAN_CACHE'].forEach(function(k){
        var raw=sessionStorage.getItem(k)||'';
        if(!raw)return;
        var j=JSON.parse(raw);
        if(j&&Array.isArray(j.rows))putList(j.rows);
        if(j&&j.ok&&Array.isArray(j.rows))putList(j.rows);
      });
    }catch(e){}
    return Object.keys(map).map(function(k){return map[k]}).sort(function(a,b){return ticketDate(b)-ticketDate(a)});
  }
  function ticketsList(){
    var v=gfOcDataVersion();
    if(gfOcCache.tickets && gfOcCache.version===v) return gfOcCache.tickets;
    var merged=mergeConsultaTickets();
    gfOcCache.version=v;
    gfOcCache.tickets=merged.length?merged:[];
    gfOcCache.rowsKey='';
    gfOcCache.rows=null;
    gfOcCache.filtersKey='';
    gfOcCache.filtersHtml='';
    return gfOcCache.tickets;
  }
  function assetsList(){
    try{if(Array.isArray(window.assets)&&window.assets.length)return window.assets}catch(e){}
    try{if(typeof assets!=='undefined'&&Array.isArray(assets)&&assets.length)return assets}catch(e){}
    return [];
  }
  var gfOcAssetsLoading=false, gfOcAssetsLoaded=false;
  function gfOcEnsureAssetsLoaded(){
    try{
      if(gfOcAssetsLoaded || gfOcAssetsLoading) return;
      if(assetsList().length){gfOcAssetsLoaded=true;return;}
      gfOcAssetsLoading=true;
      fetch(APIBASE+'/api/admin/assets',{credentials:'include',cache:'no-store'})
        .then(function(r){return r&&r.ok?r.json():null})
        .then(function(j){
          var list=j&&(Array.isArray(j.assets)?j.assets:(Array.isArray(j.rows)?j.rows:[]));
          if(list&&list.length){ window.assets=list; try{assets=list}catch(_e){} gfOcInvalidateCache(); }
        })
        .catch(function(){})
        .finally(function(){gfOcAssetsLoading=false;gfOcAssetsLoaded=true;try{render()}catch(_e){}});
    }catch(e){}
  }
  function gfOcAssetsCostTotal(){
    try{return assetsList().reduce(function(s,a){return s+cost(a)},0)}catch(e){return 0}
  }
  function ticketDate(t){return parseDate(t.created_at||t.opened_at||t.updated_at||t.resolved_at)}
  function done(t){
    var s=norm(t&&(t.status||t.status_name||t.ticket_status||t.situation||t.situacao));
    if(['DONE','RESOLVED','CLOSED','FINISHED','FINALIZED','COMPLETED','RESOLVIDO','RESOLVIDA','FECHADO','FECHADA','FINALIZADO','FINALIZADA','CONCLUIDO','CONCLUIDA','CONCLUÍDO','CONCLUÍDA'].indexOf(s)>=0) return true;
    if(t&&(t.is_done===true||t.done===true||t.resolved===true||t.finished===true||t.closed===true)) return true;
    return !!(t&&(t.resolved_at||t.closed_at||t.finished_at||t.completed_at||t.done_at||t.finalized_at));
  }
  function pending(t){return !done(t)}
  function statusLabel(v,t){if(t&&done(t))return 'Resolvido';return {NEW:'Novo',IN_PROGRESS:'Em andamento',DONE:'Resolvido'}[norm(v)]||(v?txt(v):'Não informado')}
  function prioLabel(v){return {LOW:'Baixa',MEDIUM:'Média',HIGH:'Alta',CRITICAL:'Crítica'}[norm(v)]||(v?txt(v):'Não informada')}
  function itemName(t){return txt(t&&(t.asset_name||t.service_name||t.item_name||t.asset_label||t.name||''))||'Não informado'}
  function issueName(t){return txt(t&&(t.issue_name||t.problem_name||t.issue_type_name||t.problem||''))||'Não informado'}
  function sectorName(t){return txt(t&&(t.sector_name||t.requester_sector_name||t.department_name||''))||'Não informado'}
  function patr(t){return txt(t&&(t.patrimonio||t.asset_patrimonio||t.asset_sp_identificacao||t.sp_identificacao||''))}
  function responsible(t){return txt(t&&(t.assigned_to_name||t.assigned_name||t.user_name||''))}
  function resolver(t){return txt(t&&(t.resolved_by_name||t.finished_by_name||t.closed_by_name||''))}
  function openedBy(t){return txt(t&&(t.requester_name||t.created_by_name||t.opened_by_name||''))}
  function anyPerson(t){return txt([responsible(t),resolver(t),openedBy(t)].filter(Boolean).join(' / '))||'Não informado'}
  function gfOcMoneyNumber(v){
    if(v==null||v==='')return 0;
    if(typeof v==='number')return isFinite(v)?v:0;
    var s=String(v).trim();
    if(!s)return 0;
    s=s.replace(/[^0-9,.-]/g,'');
    if(s.indexOf(',')>=0 && s.indexOf('.')>=0)s=s.replace(/\./g,'').replace(',','.');
    else if(s.indexOf(',')>=0)s=s.replace(',','.');
    var n=Number(s);
    return isFinite(n)?n:0;
  }
  function gfOcDirectCost(obj){
    if(!obj)return 0;
    var keys=['maintenance_value','ticket_maintenance_total','asset_maintenance_value','asset_total_maintenance','total_maintenance','maintenance_total','maintenance_cost','ticket_maintenance_value','ticket_cost','total_cost','cost','value','amount','price','total_price','valor_manutencao','valor_manutencao_total','valor_total_manutencao','valor_total','valor','custo','custo_total','custo_manutencao','custo_total_manutencao','repair_cost','repair_value','service_cost','service_value','parts_cost','parts_value','labor_cost','labor_value','material_cost','material_value','expense_value','expenses_total','maintenance_amount','maintenance_price','last_maintenance_value','last_maintenance_cost','total_spent','spent_total'];
    for(var i=0;i<keys.length;i++){
      var n=gfOcMoneyNumber(obj[keys[i]]);
      if(n>0)return n;
    }
    var sumKeys=['parts_cost','parts_value','labor_cost','labor_value','material_cost','material_value','service_cost','service_value'];
    var sum=0;
    for(var j=0;j<sumKeys.length;j++) sum+=gfOcMoneyNumber(obj[sumKeys[j]]);
    return sum>0?sum:0;
  }
  function gfOcRelatedAssetCost(t){
    try{
      var list=assetsList();
      if(!t||!list||!list.length)return 0;
      var assetId=txt(t.asset_id||t.assetId||t.equipment_id||t.equipmentId||t.service_id||t.serviceId);
      var pat=norm(patr(t));
      if(!assetId && !pat)return 0;
      for(var i=0;i<list.length;i++){
        var a=list[i];
        var aid=txt(a.id||a.asset_id||a.service_id);
        var ap=norm(a.patrimonio||a.asset_patrimonio||a.sp_identificacao||a.asset_sp_identificacao);
        if((assetId&&aid&&assetId===aid)||(pat&&ap&&pat===ap)){
          var c=gfOcDirectCost(a);
          if(c>0)return c;
        }
      }
    }catch(e){}
    return 0;
  }
  function cost(t){
    var direct=gfOcDirectCost(t);
    if(direct>0)return direct;
    return gfOcRelatedAssetCost(t);
  }
  function gfOcTicketOwnCost(t){
    if(!t)return 0;
    var keys=['maintenance_value','ticket_maintenance_total','ticket_maintenance_value','ticket_cost','maintenance_cost','cost','valor_manutencao','custo_manutencao'];
    for(var i=0;i<keys.length;i++){
      var n=gfOcMoneyNumber(t[keys[i]]);
      if(n>0)return n;
    }
    return 0;
  }
  function supplier(t){return txt(t&&(t.ticket_supplier_name||t.supplier_name||t.asset_supplier_name||''))}
  function part(t){return txt(t&&(t.part_name||t.maintenance_type||t.piece_name||''))}
  function rawType(t){var d=norm(t&&t.asset_department),k=norm(t&&t.asset_kind);if(d.indexOf('MANUT')>=0)return 'MANUTENCAO';if(k==='SERVICE'||d==='APOIO'||d==='SERVICOS'||d==='SERVIÇOS'||t.service_name)return 'APOIO';return 'TI'}
  function typeLabel(t){var x=rawType(t);return x==='MANUTENCAO'?'Manutenção':(x==='APOIO'?'Apoio/Serviços':'TI')}
  function textTicket(t){return norm([t.ticket_number,t.id,sectorName(t),typeLabel(t),itemName(t),patr(t),issueName(t),t.description,t.solution,t.resolution_note,t.public_note,statusLabel(t.status,t),prioLabel(t.priority),responsible(t),resolver(t),openedBy(t),supplier(t),part(t)].join(' '))}
  function qNorm(){return norm(state.query||'')}
  function inPeriod(t){var b=bounds(),d=ticketDate(t);return !d || (d>=b.a && d<=b.b)}
  function matchBase(t){
    if(!inPeriod(t))return false;
    var st=norm(state.status||'ALL');
    if(st!=='ALL'){
      if(st==='DONE'&&!done(t))return false;
      else if(st==='PENDING'&&!pending(t))return false;
      else if(st!=='DONE'&&st!=='PENDING'&&norm(t.status)!==st)return false;
    }
    if(state.sector && sectorName(t)!==state.sector)return false;
    if(state.tech){var te=state.tech;if(responsible(t)!==te && resolver(t)!==te && openedBy(t)!==te)return false;}
    if(state.type && norm(state.type)!=='ALL' && rawType(t)!==norm(state.type))return false;
    return true;
  }
  function matchQuery(t){var q=qNorm(); return !q || textTicket(t).indexOf(q)>=0}
  function rows(){
    var key=gfOcDataVersion()+'|'+JSON.stringify({range:state.range,status:state.status,sector:state.sector,tech:state.tech,type:state.type,query:state.query,from:state.from,to:state.to});
    if(gfOcCache.rows && gfOcCache.rowsKey===key) return gfOcCache.rows;
    var out=ticketsList().filter(function(t){return matchBase(t)&&matchQuery(t)}).sort(function(a,b){return ticketDate(b)-ticketDate(a)});
    gfOcCache.rowsKey=key;
    gfOcCache.rows=out;
    return out;
  }
  function group(list,fn){var m={};list.forEach(function(t){var k=fn(t)||'Não informado';if(!m[k])m[k]={name:k,total:0,pending:0,done:0,cost:0,rows:[]};m[k].total++;if(done(t))m[k].done++;else m[k].pending++;m[k].cost+=cost(t);m[k].rows.push(t)});return Object.keys(m).map(function(k){return m[k]}).sort(function(a,b){return b.total-a.total||b.cost-a.cost||a.name.localeCompare(b.name,'pt-BR')})}
  function assetStatus(v){return {ACTIVE:'Ativo',INACTIVE:'Inativo',OUT_OF_OPERATION:'Fora de operação',SWAP:'Encaminhado para troca',NO_REPAIR:'Sem reparo',WRITTEN_OFF:'Baixado'}[norm(v)]||(v?txt(v):'Não informado')}
  function timeToResolve(t){var a=parseDate(t.created_at),b=parseDate(t.resolved_at||t.updated_at);if(!a||!b||b<a)return '-';var h=Math.round((b-a)/3600000);if(h<1)return 'menos de 1h';if(h<24)return h+'h';return Math.floor(h/24)+'d '+(h%24)+'h'}

  function ensureCss(){
    var old=byId('gfOperationConsultaCssV57'); if(old)return;
    var st=document.createElement('style');st.id='gfOperationConsultaCssV57';st.textContent=`
      #pageOperacao.gfOpConsultaMode>*:not(#gfOperationConsulta){display:none!important}
      #pageOperacao.gfOpConsultaMode{background:linear-gradient(180deg,#eef6ff 0,#f8fbff 44%,#edf6ff 100%)!important;padding:18px 18px 80px!important;box-sizing:border-box!important;display:block!important;justify-content:initial!important;align-items:initial!important;overflow-x:hidden!important;width:100%!important;max-width:none!important;margin:0!important}
      #gfOperationConsulta{width:100%!important;max-width:none!important;margin:0!important;color:#13223c;font-family:inherit!important;box-sizing:border-box:border-box!important;box-sizing:border-box!important}.gfOcHeader{display:flex;align-items:center;gap:16px;background:rgba(255,255,255,.98);border:1px solid #dbe8f6;border-radius:26px;padding:24px 26px;margin:0 0 14px;box-shadow:0 14px 32px rgba(28,55,100,.08)}.gfOcHeaderIcon{width:58px;height:58px;border-radius:20px;background:#eef6ff;color:#0d6fe0;display:grid;place-items:center;font-size:30px;flex:0 0 auto}.gfOcHeader h2{font-size:30px;line-height:1.08;margin:0 0 5px;letter-spacing:-.04em;color:#101d35}.gfOcHeader p{margin:0;color:#5d6b84;font-size:15px;font-weight:800}
      .gfOcBox,.gfOcPanel,.gfOcKpi{background:rgba(255,255,255,.96);border:1px solid #dbe8f6;box-shadow:0 14px 32px rgba(28,55,100,.10)}.gfOcBox{border-radius:26px;padding:15px;margin-bottom:14px}.gfOcSearch{width:100%;box-sizing:border-box;border:2px solid #d5e5f7;border-radius:18px;padding:15px 18px;font-size:20px;font-weight:950;color:#101d35;outline:none}.gfOcSearch:focus{border-color:#0d7de2;box-shadow:0 0 0 5px rgba(13,125,226,.12)}.gfOcFilters{display:grid;grid-template-columns:repeat(12,minmax(0,1fr));gap:9px;margin-top:12px}.gfOcBtn,.gfOcFilters select,.gfOcDate{border:1px solid #d3e2f5;background:#fff;color:#0e1b34;border-radius:15px;padding:10px 12px;min-height:44px;font-weight:950;box-shadow:0 4px 12px rgba(15,35,66,.04);box-sizing:border-box}.gfOcBtn{cursor:pointer}.gfOcBtn.active{background:linear-gradient(135deg,#071739,#116bd5);color:#fff;border-color:#116bd5}.gfOcSpan1{grid-column:span 1}.gfOcSpan2{grid-column:span 2}.gfOcSpan3{grid-column:span 3}.gfOcSpan4{grid-column:span 4}.gfOcExport{grid-column:span 3;display:flex;gap:8px;justify-content:flex-end}.gfOcDate{display:none}.gfOcCustom .gfOcDate{display:block}
      .gfOcKpis{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:13px;margin:14px 0}.gfOcKpi{border-radius:22px;padding:15px;min-height:96px;position:relative;overflow:hidden;cursor:pointer}.gfOcKpi small{display:block;color:#64748b;font-weight:950}.gfOcKpi b{display:block;font-size:30px;margin:6px 0;color:#06122a}.gfOcKpi em{font-size:12px;font-style:normal;font-weight:850;color:#72819a}.gfOcKpi:before{content:"";position:absolute;left:0;top:0;right:0;height:5px}.kBlue:before{background:#1476d8}.kOrange:before{background:#f59e0b}.kGreen:before{background:#22c55e}.kPurple:before{background:#8b5cf6}.kRed:before{background:#ef4444}
      .gfOcGrid{display:grid;grid-template-columns:1.05fr .95fr;gap:14px}.gfOcPanel{border-radius:24px;padding:14px;margin-bottom:14px}.gfOcTitle{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:10px}.gfOcTitle h3{margin:0;font-size:18px}.gfOcTitle small{color:#677690;font-weight:900}.gfOcLine,.gfOcEmpty{border:1px solid #deebf8;background:#f8fbff;border-radius:16px;padding:12px;margin:8px 0;font-weight:850;color:#26364f}.gfOcLine.accent{background:linear-gradient(135deg,#eff6ff,#fff);border-color:#bfdbfe}.gfOcCtx{display:grid;gap:9px}.gfOcCtxRow{display:grid;grid-template-columns:1fr auto auto;align-items:center;gap:10px;border:1px solid #dde9f6;background:#f9fcff;border-radius:16px;padding:11px 12px;cursor:pointer}.gfOcCtxRow b{font-size:15px}.gfOcCtxRow small{color:#667792;font-weight:850}.gfPill{display:inline-flex;align-items:center;border-radius:999px;padding:6px 10px;font-size:12px;font-weight:950;background:#eaf2ff;color:#1155aa}.gfPill.ok{background:#dcfce7;color:#15803d}.gfPill.warn{background:#fff1d6;color:#b45309}.gfPill.bad{background:#fee2e2;color:#b91c1c}.gfPill.blue{background:#dbeafe;color:#1d4ed8}
      .gfOcTickets{display:grid;gap:9px}.gfOcTicket{display:grid;grid-template-columns:82px 132px 1fr 1fr 1fr 1fr auto;gap:10px;align-items:center;border:1px solid #dce9f7;background:#fff;border-radius:18px;padding:12px;cursor:pointer}.gfOcTicket:hover,.gfOcCtxRow:hover,.gfOcAsset:hover{border-color:#93c5fd;box-shadow:0 10px 22px rgba(37,99,235,.10)}.gfOcTicket b{display:block;color:#14223b}.gfOcTicket small{display:block;color:#697892;font-size:11px;font-weight:900}.gfOcTicket .desc{grid-column:1/-1;color:#475569;background:#f8fbff;border-radius:12px;padding:8px;font-size:12px;font-weight:750}.gfOcMore{text-align:center;color:#687792;font-weight:900;padding:12px}.gfOcAssets{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}.gfOcAsset{border:1px solid #dbe8f6;border-radius:20px;padding:14px;background:linear-gradient(180deg,#fff,#f8fbff);cursor:pointer;box-shadow:0 10px 22px rgba(28,55,100,.06)}.gfOcItemCard{border-top:5px solid #1476d8}.gfOcAsset b{display:block;font-size:17px;color:#0f2547}.gfOcAssetLine{display:flex;justify-content:space-between;gap:8px;align-items:center;margin-top:8px}.gfOcAsset small{color:#687792;font-weight:900}.gfOcMiniText{margin-top:8px;padding:8px 10px;border-radius:12px;background:#eef6ff;color:#334155;font-size:12px;font-weight:800;line-height:1.35}.gfOcMiniText b{display:inline;font-size:12px;color:#0f3d78}
      .gfOcModalBg{position:fixed;inset:0;background:rgba(15,23,42,.56);z-index:9997;display:none}.gfOcModal{position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);width:min(1400px,90vw);height:min(88vh,calc(100vh - 104px));display:none;background:#fff;border-radius:24px;box-shadow:0 30px 90px rgba(0,0,0,.35);z-index:9998;overflow:hidden;flex-direction:column}.gfOcModal.show{display:flex}.gfOcModalBg.show{display:block}.gfOcModalHead{display:flex;justify-content:space-between;align-items:center;gap:10px;padding:14px 18px;border-bottom:1px solid #e2e8f0;flex:0 0 auto;background:#fff}.gfOcModalHead h3{margin:0}.gfOcClose{border:1px solid #dbe8f6;background:#fff;border-radius:14px;padding:10px 16px;font-weight:950}.gfOcModalBody{padding:14px;overflow:auto;flex:1 1 auto;min-height:0}.gfOcTrace{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:12px}.gfOcTraceBox{border:1px solid #dbe8f6;border-radius:16px;padding:12px;background:#f8fbff}.gfOcTraceBox small{display:block;color:#64748b;font-weight:900}.gfOcTraceBox b{font-size:22px}.gfOcDetail{border:1px solid #dbe8f6;border-radius:18px;padding:10px 12px;margin:10px 0;background:#fff}.gfOcDetailTop{display:flex;justify-content:space-between;gap:10px;align-items:center}.gfOcMeta{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-top:8px}.gfOcMeta div{background:#f8fbff;border-radius:12px;padding:8px}.gfOcMeta small{display:block;color:#6b7b94;font-weight:900}.gfOcMeta span{font-weight:850}.gfOcInfo{margin-top:8px;background:#f8fbff;border:1px solid #e2e8f0;border-radius:14px;padding:9px 10px;color:#334155;font-weight:750}
      .gfOcTableWrap{margin-top:12px;border:1px solid #dbe8f6;border-radius:18px;overflow:auto;background:#fff;box-shadow:0 10px 26px rgba(15,23,42,.06)}.gfOcTable{width:100%;border-collapse:separate;border-spacing:0;min-width:980px}.gfOcTable th{position:sticky;top:0;background:linear-gradient(180deg,#eef6ff,#e8f2ff);color:#28476d;text-align:left;font-size:12px;text-transform:uppercase;letter-spacing:.03em;padding:12px 10px;border-bottom:1px solid #dbe8f6;z-index:1}.gfOcTable td{padding:12px 10px;border-bottom:1px solid #edf3fb;vertical-align:top;color:#0f1b33;font-weight:800}.gfOcTable tr:hover td{background:#f8fbff}.gfOcCellMain{font-weight:950;color:#0b1b36}.gfOcCellSub{display:block;margin-top:3px;font-size:12px;color:#65748c;font-weight:850}.gfOcTextCell{max-width:340px;white-space:normal;line-height:1.35}.gfOcConclusion{background:#f7fbff;border:1px solid #e2eaf5;border-radius:12px;padding:8px}.gfOcConclusion b{display:block;color:#0f3b72;margin-bottom:3px}.gfOcNoConclusion{color:#7b8797;font-weight:850}.gfOcMiniBtn{display:inline-flex;align-items:center;justify-content:center;border:1px solid #cfe0f3;background:#fff;border-radius:999px;padding:7px 10px;font-weight:950;color:#0f3b72;cursor:pointer}

      .gfOcPanel{background:linear-gradient(180deg,#ffffff,#f9fcff);border-color:#d7e7f8}.gfOcPanel:nth-child(1){border-top:5px solid #0f6fd6}.gfOcPanel:nth-child(2){border-top:5px solid #16a34a}.gfOcAnswerGrid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.gfOcInsight{border:1px solid #d9e8f7;background:linear-gradient(180deg,#fff,#f6fbff);border-radius:18px;padding:13px 14px;min-height:72px;box-shadow:0 8px 18px rgba(15,70,140,.06)}.gfOcInsight.main{grid-column:1/-1;background:linear-gradient(135deg,#eff6ff,#ffffff);border-color:#bfdbfe}.gfOcInsight small{display:block;text-transform:uppercase;letter-spacing:.04em;color:#64748b;font-size:11px;font-weight:950;margin-bottom:5px}.gfOcInsight b{display:block;color:#13223c;font-size:16px;line-height:1.22}.gfOcInsight span{display:block;color:#475569;font-size:12px;font-weight:850;margin-top:4px;line-height:1.35}.gfOcCtxRow{grid-template-columns:minmax(0,1.2fr) minmax(0,1fr) auto!important;background:linear-gradient(180deg,#ffffff,#f7fbff)!important;border-left:5px solid #0f6fd6!important;padding:12px 14px!important}.gfOcCtxRow:hover{transform:translateY(-1px);background:#fff!important}.gfOcCtxRow .ctxMain{min-width:0}.gfOcCtxRow .ctxMain b{display:block;white-space:normal;overflow:visible;text-overflow:clip;line-height:1.2}.gfOcCtxRow .ctxKind{display:inline-flex;margin-top:5px;border-radius:999px;background:#eef6ff;color:#2563eb;padding:4px 8px;font-size:11px!important;font-weight:950}.gfOcCtxRow .ctxStats{display:flex;flex-wrap:wrap;justify-content:flex-end;gap:5px;color:#52647f;font-size:12px;font-weight:900}.gfOcCtxRow .ctxStat{display:inline-flex;align-items:center;border-radius:999px;background:#f1f5f9;padding:5px 8px;white-space:nowrap}.gfOcCtxRow.kind-Problema{border-left-color:#f59e0b!important}.gfOcCtxRow.kind-Setor{border-left-color:#8b5cf6!important}.gfOcCtxRow.kind-Pessoa{border-left-color:#10b981!important}.gfOcCtxRow.kind-Equipamento{border-left-color:#0f6fd6!important}

      /* Central de Consulta - padrão limpo igual referência, sem tela antiga */
      #pageOperacao.gfOpConsultaMode{background:linear-gradient(180deg,#eef6ff 0,#f8fbff 42%,#eef6ff 100%)!important;padding:18px 18px 96px!important}
      #gfOperationConsulta{width:100%!important;max-width:none!important;margin:0!important;color:#081b3f!important;font-family:inherit!important;box-sizing:border-box!important}
      #gfOperationConsulta .gfOcHeader{display:grid!important;grid-template-columns:150px minmax(0,1fr) auto!important;align-items:center!important;gap:20px!important;background:#fff!important;border:1px solid #dbe7f6!important;border-radius:26px!important;box-shadow:0 14px 34px rgba(28,55,100,.08)!important;padding:22px 24px!important;margin:0 0 16px!important;box-sizing:border-box!important;width:100%!important}
      #gfOperationConsulta .gfOcLogoBox{width:142px;height:66px;display:flex!important;align-items:center!important;justify-content:flex-start!important;color:#ef4444!important;font-weight:1000!important;line-height:1!important}
      #gfOperationConsulta .gfOcLogoBox img{max-width:134px!important;max-height:62px!important;object-fit:contain!important;display:block!important}
      #gfOperationConsulta .gfOcLogoBox b{font-size:25px!important;color:#ef4444!important;display:block!important}.gfOcLogoBox small{display:block!important;color:#64748b!important;font-size:10px!important;font-weight:900!important;letter-spacing:.04em!important}
      #gfOperationConsulta .gfOcHeaderText h2{font-size:28px!important;line-height:1.08!important;margin:0 0 4px!important;font-weight:950!important;letter-spacing:-.03em!important;color:#08245a!important}
      #gfOperationConsulta .gfOcHeaderText p{font-size:15px!important;line-height:1.28!important;margin:0!important;color:#475569!important;font-weight:800!important;max-width:580px!important}
      #gfOperationConsulta .gfOcClosePage{height:52px!important;padding:0 18px!important;border:1px solid #dbe7f6!important;border-radius:18px!important;background:#fff!important;color:#08245a!important;font-size:20px!important;font-weight:950!important;display:inline-flex!important;align-items:center!important;gap:8px!important;box-shadow:0 10px 26px rgba(15,23,42,.07)!important;cursor:pointer!important}
      #gfOperationConsulta .gfOcClosePage span{font-size:14px!important;font-weight:950!important}
      #gfOperationConsulta .gfOcSearchBox{border-radius:26px!important;padding:20px!important;margin-bottom:16px!important;background:rgba(255,255,255,.96)!important;border:1px solid #dbe7f6!important;box-shadow:0 14px 34px rgba(28,55,100,.08)!important;box-sizing:border-box!important;width:100%!important;overflow:visible!important}
      #gfOperationConsulta .gfOcSearch{height:52px!important;border-radius:17px!important;border:1px solid #d4e3f5!important;background:#fff!important;font-size:16px!important;font-weight:850!important;padding:0 16px!important;margin-bottom:14px!important}
      #gfOperationConsulta .gfOcFilters{display:grid!important;grid-template-columns:1fr!important;gap:14px!important;margin:0!important}
      #gfOperationConsulta .gfOcPeriodCard{background:transparent!important;border:0!important;box-shadow:none!important;padding:0!important;margin:0!important}
      #gfOperationConsulta .gfOcSectionHead{display:flex!important;align-items:center!important;gap:14px!important;margin:0 0 14px!important}
      #gfOperationConsulta .gfOcSectionIcon,.gfOcKpi:after{width:52px!important;height:52px!important;border-radius:17px!important;background:#edf6ff!important;color:#0b73df!important;display:grid!important;place-items:center!important;font-size:25px!important;flex:0 0 auto!important}
      #gfOperationConsulta .gfOcSectionHead h3{font-size:24px!important;color:#0b2454!important;margin:0 0 4px!important;line-height:1.1!important;font-weight:950!important}.gfOcSectionHead p{font-size:14px!important;margin:0!important;color:#66758b!important;font-weight:850!important}
      #gfOperationConsulta .gfOcPeriodBtns{display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:12px!important;width:100%!important;align-items:stretch!important}
      #gfOperationConsulta .gfOcPeriodBtns .gfOcBtn{height:58px!important;min-height:58px!important;border-radius:14px!important;font-size:15px!important;display:flex!important;align-items:center!important;justify-content:center!important;gap:8px!important;padding:0 12px!important;box-shadow:0 5px 14px rgba(15,35,66,.035)!important}
      #gfOperationConsulta .gfOcPeriodBtns .gfOcBtn.active{background:#0878db!important;color:#fff!important;border-color:#0878db!important;box-shadow:0 12px 26px rgba(8,120,219,.20)!important}
      #gfOperationConsulta .gfOcDateRow{display:none!important;grid-template-columns:1fr 1fr!important;gap:10px!important;margin-top:12px!important}.gfOcCustom .gfOcDateRow{display:grid!important}.gfOcCustom .gfOcDate{display:block!important}
      #gfOperationConsulta .gfOcFilterRows{display:grid!important;gap:10px!important;background:transparent!important;width:100%!important}.gfOcSelectRow{height:62px!important;border:1px solid #dbe7f6!important;background:#fff!important;border-radius:16px!important;display:grid!important;grid-template-columns:48px 180px minmax(0,1fr) 22px!important;align-items:center!important;gap:12px!important;padding:0 14px!important;box-shadow:0 6px 16px rgba(15,35,66,.035)!important;position:relative!important;box-sizing:border-box!important;width:100%!important;overflow:hidden!important}.gfOcSelectRow:after{content:'⌄'!important;color:#334155!important;font-size:22px!important;font-weight:900!important}.gfOcRowIcon{width:42px!important;height:42px!important;border-radius:999px!important;background:#edf6ff!important;display:grid!important;place-items:center!important;color:#0b73df!important;font-size:18px!important}.gfOcSelectRow b{font-size:16px!important;color:#0b2454!important;font-weight:950!important}.gfOcSelectRow select{height:100%!important;min-height:0!important;width:100%!important;border:0!important;background:transparent!important;box-shadow:none!important;color:#64748b!important;font-size:15px!important;font-weight:800!important;padding:0!important;appearance:none!important;outline:none!important}.gfOcActionRow{display:grid!important;grid-template-columns:2fr .62fr .72fr .62fr!important;gap:10px!important;margin-top:12px!important;width:100%!important;align-items:stretch!important}.gfOcActionRow .gfOcBtn{height:52px!important;min-height:52px!important;border-radius:14px!important;display:flex!important;align-items:center!important;justify-content:center!important;gap:8px!important;font-size:14px!important;background:#fff!important}.gfOcActionRow .gfOcClearBtn{justify-content:center!important}
      #gfOperationConsulta .gfOcKpis{grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:14px!important;margin:16px 0!important}.gfOcKpi{cursor:pointer!important;user-select:none!important;min-height:106px!important;border-radius:20px!important;padding:18px 18px 16px 88px!important;background:#fff!important;border:1px solid #dbe7f6!important;box-shadow:0 12px 28px rgba(28,55,100,.075)!important;position:relative!important}.gfOcKpi:before{display:none!important}.gfOcKpi:after{content:'📄'!important;position:absolute!important;left:18px!important;top:22px!important}.gfOcKpi.kOrange:after{content:'!'!important;background:#fff7e6!important;color:#f59e0b!important;font-size:28px!important}.gfOcKpi.kGreen:after{content:'✓'!important;background:#dcfce7!important;color:#16a34a!important;font-size:28px!important}.gfOcKpi.kPurple:after{content:'$'!important;background:#f3e8ff!important;color:#8b5cf6!important;font-size:28px!important}.gfOcKpi.kRed:after{content:'⚠'!important;background:#fee2e2!important;color:#ef4444!important;font-size:25px!important}.gfOcKpi small{font-size:14px!important;color:#6b7b94!important;font-weight:900!important}.gfOcKpi b{font-size:28px!important;margin:4px 0!important;color:#08245a!important;line-height:1!important}.gfOcKpi em{font-size:13px!important;color:#6b7b94!important;font-weight:800!important}
      #gfOperationConsulta .gfOcKpi.active{outline:3px solid rgba(8,120,219,.22)!important;box-shadow:0 16px 34px rgba(8,120,219,.15)!important}#gfOperationConsulta .gfOcKpiResult{background:#fff!important;border:1px solid #dbe7f6!important;border-radius:22px!important;box-shadow:0 12px 28px rgba(28,55,100,.075)!important;padding:16px!important;margin:0 0 16px!important}#gfOperationConsulta .gfOcGrid{grid-template-columns:1fr!important;gap:14px!important}.gfOcPanel{border-radius:22px!important;padding:18px!important;background:#fff!important;border:1px solid #dbe7f6!important;box-shadow:0 12px 28px rgba(28,55,100,.075)!important}.gfOcTitle h3{font-size:20px!important;color:#0b2454!important}.gfOcTitle small{font-size:13px!important}


      /* FIX 20260619: remove espaço fantasma da sidebar na Central de Consulta */
      body.gf-sidebar-ready .gfMainWrap>section#pageOperacao.gfOpConsultaMode,
      .gfMainWrap>section#pageOperacao.gfOpConsultaMode,
      #pageOperacao.gfOpConsultaMode{width:100%!important;max-width:none!important;margin:0!important;left:auto!important;right:auto!important;transform:none!important;padding-left:18px!important;padding-right:18px!important;display:block!important;justify-content:initial!important;align-items:initial!important}
      #gfOperationConsulta{width:100%!important;max-width:none!important;margin:0!important;left:auto!important;right:auto!important;transform:none!important}
      #gfOperationConsulta .gfOcHeader,#gfOperationConsulta .gfOcSearchBox{width:100%!important;max-width:none!important;margin-left:0!important;margin-right:0!important}

      @media(max-width:720px){
        #pageOperacao.gfOpConsultaMode{display:block!important;padding:12px 10px 104px!important;background:linear-gradient(180deg,#eef6ff 0,#f8fbff 42%,#eef6ff 100%)!important;overflow-x:hidden!important}
        #gfOperationConsulta{max-width:none!important;width:100%!important}
        #gfOperationConsulta .gfOcHeader{grid-template-columns:136px 1fr auto!important;gap:10px!important;padding:10px 2px 18px!important;align-items:center!important}
        #gfOperationConsulta .gfOcLogoBox{width:130px!important;height:58px!important}.gfOcLogoBox img{max-width:126px!important;max-height:56px!important}
        #gfOperationConsulta .gfOcHeaderText h2{font-size:22px!important;line-height:1.12!important;margin-bottom:3px!important}
        #gfOperationConsulta .gfOcHeaderText p{font-size:13px!important;line-height:1.28!important;max-width:330px!important}
        #gfOperationConsulta .gfOcClosePage{height:50px!important;border-radius:16px!important;padding:0 13px!important;font-size:20px!important}.gfOcClosePage span{font-size:13px!important}
        #gfOperationConsulta .gfOcSearchBox{border-radius:22px!important;padding:16px!important;margin-bottom:14px!important}
        #gfOperationConsulta .gfOcSearch{height:50px!important;font-size:16px!important;margin-bottom:14px!important}
        #gfOperationConsulta .gfOcSectionIcon{width:48px!important;height:48px!important;border-radius:16px!important;font-size:22px!important}.gfOcSectionHead h3{font-size:21px!important}.gfOcSectionHead p{font-size:13px!important}
        #gfOperationConsulta .gfOcPeriodBtns{grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:10px!important}.gfOcPeriodBtns .gfOcBtn{height:56px!important;min-height:56px!important;font-size:14px!important}.gfOcPeriodBtns .gfOcBtn:nth-child(7),.gfOcPeriodBtns .gfOcBtn:nth-child(8){grid-column:auto!important}
        #gfOperationConsulta .gfOcSelectRow{height:auto!important;min-height:58px!important;grid-template-columns:40px minmax(96px,128px) minmax(0,1fr) 18px!important;padding:0 10px!important;gap:8px!important}.gfOcRowIcon{width:38px!important;height:38px!important}.gfOcSelectRow b{font-size:15px!important}.gfOcSelectRow select{font-size:14px!important}
        #gfOperationConsulta .gfOcActionRow{grid-template-columns:1fr 1fr!important;gap:8px!important}.gfOcActionRow .gfOcBtn{height:50px!important;min-height:50px!important;font-size:13px!important}
        #gfOperationConsulta .gfOcKpis{grid-template-columns:repeat(2,1fr)!important;gap:10px!important}.gfOcKpi{min-height:100px!important;padding:14px 12px 13px 76px!important;border-radius:18px!important}.gfOcKpi:after{left:14px!important;top:20px!important;width:48px!important;height:48px!important}.gfOcKpi small{font-size:13px!important}.gfOcKpi b{font-size:25px!important}.gfOcKpi em{font-size:12px!important}
        #gfOperationConsulta .gfOcPanel{border-radius:20px!important;padding:16px!important}.gfOcTitle h3{font-size:18px!important}
      }
      @media(max-width:1100px){#pageOperacao.gfOpConsultaMode{padding:16px 14px 72px!important}.gfOcKpis{grid-template-columns:repeat(2,1fr)}.gfOcGrid{grid-template-columns:1fr}.gfOcAssets{grid-template-columns:repeat(2,1fr)}.gfOcTicket{grid-template-columns:76px 125px 1fr 1fr auto}.gfOcTicket .hideTab{display:none}.gfOcFilters{grid-template-columns:repeat(6,1fr)}.gfOcSpan1,.gfOcSpan2{grid-column:span 2}.gfOcSpan3,.gfOcSpan4,.gfOcExport{grid-column:span 6}.gfOcTrace,.gfOcMeta{grid-template-columns:repeat(2,1fr)}}

      #gfOperationConsulta .gfOcHeader,#gfOperationConsulta .gfOcSearchBox,#gfOperationConsulta .gfOcKpis,#gfOperationConsulta .gfOcKpiResult,#gfOperationConsulta .gfOcGrid{max-width:100%!important;box-sizing:border-box!important}
      #gfOperationConsulta .gfOcHeaderText{min-width:0!important}.gfOcHeaderText h2,.gfOcHeaderText p{overflow-wrap:anywhere!important}
      #gfOperationConsulta .gfOcSearch{box-sizing:border-box!important;width:100%!important;display:block!important}
      #gfOperationConsulta .gfOcPeriodBtns .gfOcBtn{width:100%!important;min-width:0!important;box-sizing:border-box!important}
      #gfOperationConsulta .gfOcSelectRow b{white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important}
      #gfOperationConsulta .gfOcSelectRow select{min-width:0!important;overflow:hidden!important;text-overflow:ellipsis!important}
      #gfOperationConsulta .gfOcActionRow .gfOcBtn{width:100%!important;min-width:0!important;box-sizing:border-box!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important}
      @media(max-width:720px){#gfOperationConsulta .gfOcHeader{grid-template-columns:1fr!important;text-align:center!important;padding:18px!important;border-radius:22px!important}#gfOperationConsulta .gfOcLogoBox{margin:0 auto!important;justify-content:center!important}#gfOperationConsulta .gfOcClosePage{width:100%!important;justify-content:center!important}.gfOcActionRow .gfOcClearBtn{grid-column:1/-1!important}}

      @media(max-width:720px){.gfOcHeader{border-radius:20px;padding:18px;align-items:flex-start}.gfOcHeaderIcon{width:50px;height:50px;border-radius:17px;font-size:26px}.gfOcHeader h2{font-size:24px}.gfOcHeader p{font-size:13px}.gfOcSearch{font-size:16px}.gfOcFilters{grid-template-columns:repeat(2,1fr)}.gfOcSpan1,.gfOcSpan2,.gfOcSpan3,.gfOcSpan4,.gfOcExport{grid-column:span 2}.gfOcKpis{grid-template-columns:repeat(2,1fr);gap:9px}.gfOcKpi{min-height:82px;padding:12px}.gfOcKpi b{font-size:23px}.gfOcCtxRow{grid-template-columns:1fr!important}.gfOcCtxRow small{grid-column:1/-1}.gfOcCtxRow .ctxStats{justify-content:flex-start}.gfOcAnswerGrid{grid-template-columns:1fr}.gfOcTicket{grid-template-columns:1fr;gap:5px}.gfOcTicket .hideMobile,.gfOcTicket .hideTab{display:none}.gfOcAssets{grid-template-columns:1fr}.gfOcTrace,.gfOcMeta{grid-template-columns:1fr}.gfOcModal{width:100vw;height:100dvh;max-width:none;max-height:none;border-radius:0;top:0;left:0;transform:none}.gfOcModalHead{padding:12px}.gfOcModalBody{padding:10px;overflow:auto}.gfOcTableWrap{border-radius:14px}.gfOcTable{min-width:760px}.gfOcTable th,.gfOcTable td{font-size:12px;padding:9px 8px}.gfOcTextCell{max-width:260px}}
    `;document.head.appendChild(st);
  }

  var gfOcActiveKpiCard='';
  function ensureBox(){
    ensureCss();var page=byId('pageOperacao');if(!page)return null;page.classList.add('gfOpConsultaMode');
    var old=byId('gfOperationConsulta'); if(old && old.dataset.v==='57')return old; if(old)old.remove();
    var box=document.createElement('div');box.id='gfOperationConsulta';box.dataset.v='57';
    var ocLogo=(document.getElementById('companyLogoImg')&&document.getElementById('companyLogoImg').src)||'';
    box.innerHTML=''+
      '<div class="gfOcHeader"><div class="gfOcLogoBox">'+(ocLogo?'<img src="'+esc(ocLogo)+'" alt="Guará">':'<b>Guará</b><small>ACQUA PARK</small>')+'</div><div class="gfOcHeaderText"><h2>Central de Consulta</h2><p>Pesquise e filtre chamados, equipamentos, setores, responsáveis ou patrimônio.</p></div><button class="gfOcClosePage" type="button" data-oc-close="1">× <span>Fechar</span></button></div>'+
      '<div class="gfOcBox gfOcSearchBox"><input id="gfOcQuery" class="gfOcSearch" autocomplete="off" placeholder="Buscar chamado, equipamento, setor, responsável ou patrimônio..."><div id="gfOcFilters" class="gfOcFilters"></div></div>'+
      '<div class="gfOcKpis"><div class="gfOcKpi kBlue" data-kpi="ALL"><small>Chamados encontrados</small><b id="gfOcTotal">0</b><em>acontecimentos reais</em></div><div class="gfOcKpi kOrange" data-kpi="PENDING"><small>Pendentes</small><b id="gfOcPending">0</b><em>precisam atenção</em></div><div class="gfOcKpi kGreen" data-kpi="DONE"><small>Resolvidos</small><b id="gfOcDone">0</b><em>concluídos</em></div><div class="gfOcKpi kPurple" data-kpi="COST"><small>Custo filtrado</small><b id="gfOcCost">R$ 0,00</b><em>gasto real</em></div><div class="gfOcKpi kRed" data-kpi="ASSETS"><small>Itens com problema</small><b id="gfOcAssetsCount">0</b><em>equipamentos/serviços filtrados</em></div></div>'+
      '<div id="gfOcKpiResult" class="gfOcKpiResult" style="display:none"></div>'+
      '<div class="gfOcGrid"><div class="gfOcPanel"><div class="gfOcTitle"><h3>📌 Resumo da consulta</h3><small id="gfOcPeriodLabel"></small></div><div id="gfOcAnswer"></div></div><div class="gfOcPanel"><div class="gfOcTitle"><h3>🧭 Contexto relacionado</h3><small>principais relações da busca</small></div><div id="gfOcContext" class="gfOcCtx"></div></div></div>'+
      '<div class="gfOcPanel gfOcLatestPanel"><div class="gfOcTitle"><h3>✅ Últimas conclusões encontradas</h3><small id="gfOcLatestCount">somente registros com comentário</small></div><div id="gfOcLatest" class="gfOcLatestGrid"></div></div>'+
      '<div class="gfOcPanel"><div class="gfOcTitle"><h3>🧩 Equipamentos e serviços com problema</h3><small>baseado nos chamados filtrados</small></div><div id="gfOcAssets" class="gfOcAssets"></div></div>'+
      '<div id="gfOcModalBg" class="gfOcModalBg"></div><div id="gfOcModal" class="gfOcModal"><div class="gfOcModalHead"><h3 id="gfOcModalTitle">Detalhes</h3><button id="gfOcClose" class="gfOcClose" type="button">Fechar</button></div><div id="gfOcModalBody" class="gfOcModalBody"></div></div>';
    page.prepend(box);bindBox(box);return box;
  }
  function filterHtml(){
    var base=ticketsList();
    var fkey=gfOcDataVersion()+'|'+JSON.stringify({range:state.range,status:state.status,sector:state.sector,tech:state.tech,type:state.type,from:state.from,to:state.to});
    if(gfOcCache.filtersHtml && gfOcCache.filtersKey===fkey) return gfOcCache.filtersHtml;
    var sectors=[...new Set(base.map(sectorName).filter(function(x){return x&&x!=='Não informado'}))].sort((a,b)=>a.localeCompare(b,'pt-BR'));
    var techs=[...new Set(base.flatMap(function(t){return [responsible(t),resolver(t),openedBy(t)]}).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'pt-BR'));
    var ranges=[['TODAY','Hoje'],['YESTERDAY','Ontem'],['7','7 dias'],['15','15 dias'],['30','30 dias'],['MONTH','Mês atual'],['ALL','Todos'],['CUSTOM','Personalizado']];
    var rangeButtons=ranges.map(function(x){return '<button type="button" class="gfOcBtn '+(norm(state.range)===x[0]?'active':'')+'" data-range="'+x[0]+'">📅 <span>'+x[1]+'</span></button>'}).join('');
    var html='<div class="gfOcPeriodCard"><div class="gfOcSectionHead"><div class="gfOcSectionIcon">📅</div><div><h3>Período</h3><p>Selecione o período desejado para a consulta.</p></div></div><div class="gfOcPeriodBtns">'+rangeButtons+'</div><div class="gfOcDateRow"><label><span>Data inicial</span><input id="gfOcFrom" class="gfOcDate" type="date"></label><label><span>Data final</span><input id="gfOcTo" class="gfOcDate" type="date"></label></div></div>'+
      '<div class="gfOcFilterRows">'+
      '<label class="gfOcSelectRow"><span class="gfOcRowIcon">☑️</span><b>Status</b><select id="gfOcStatus"><option value="ALL">Todos</option><option value="PENDING">Pendentes</option><option value="NEW">Novo</option><option value="IN_PROGRESS">Em andamento</option><option value="DONE">Resolvido</option></select></label>'+
      '<label class="gfOcSelectRow"><span class="gfOcRowIcon">👥</span><b>Setor</b><select id="gfOcSector"><option value="">Todos</option>'+sectors.map(function(s){return '<option>'+esc(s)+'</option>'}).join('')+'</select></label>'+
      '<label class="gfOcSelectRow"><span class="gfOcRowIcon">👤</span><b>Técnico/Pessoa</b><select id="gfOcTech"><option value="">Todos</option>'+techs.map(function(s){return '<option>'+esc(s)+'</option>'}).join('')+'</select></label>'+
      '<label class="gfOcSelectRow"><span class="gfOcRowIcon">🪛</span><b>Tipo</b><select id="gfOcType"><option value="ALL">Todos</option><option value="TI">TI</option><option value="MANUTENCAO">Manutenção</option><option value="APOIO">Apoio/Serviços</option></select></label>'+
      '<div class="gfOcActionRow"><button type="button" class="gfOcBtn gfOcClearBtn" data-clear-filters="1">☰ <span>Limpar filtros</span></button><button type="button" class="gfOcBtn" data-export="csv">📄 <span>CSV</span></button><button type="button" class="gfOcBtn" data-export="excel">🟩 <span>Excel</span></button><button type="button" class="gfOcBtn" data-export="pdf">🟥 <span>PDF</span></button></div>'+
      '</div>';
    gfOcCache.filtersKey=fkey;
    gfOcCache.filtersHtml=html;
    return html;
  }
  var gfOcTicketReturnContext=null;
  var gfOcModalBackStack=[];
  function saveConsultaModalContext(){
    try{
      var m=byId('gfOcModal'), bg=byId('gfOcModalBg'), body=byId('gfOcModalBody');
      if(!m || !m.classList.contains('show')) return false;
      gfOcTicketReturnContext={scroll:body?Number(body.scrollTop||0):0, at:Date.now()};
      m.classList.remove('show');
      if(bg) bg.classList.remove('show');
      return true;
    }catch(e){return false}
  }
  function restoreConsultaModalContext(){
    try{
      if(!gfOcTicketReturnContext) return false;
      try{var aa=document.activeElement;if(aa&&aa.blur)aa.blur();document.querySelectorAll('#gfOperationConsulta select').forEach(function(x){try{x.blur()}catch(_e){}})}catch(_e){}
      var m=byId('gfOcModal'), bg=byId('gfOcModalBg'), body=byId('gfOcModalBody');
      if(bg) bg.classList.add('show');
      if(m) m.classList.add('show');
      var saved=gfOcTicketReturnContext;
      gfOcTicketReturnContext=null;
      setTimeout(function(){try{if(body) body.scrollTop=Number(saved.scroll||0)}catch(e){}},40);
      setTimeout(function(){try{if(body) body.scrollTop=Number(saved.scroll||0)}catch(e){}},160);
      return true;
    }catch(e){gfOcTicketReturnContext=null;return false}
  }
  window.gfRestoreOperationConsultaContext=restoreConsultaModalContext;
  function openTicketFromConsultaModal(id){
    try{var aa=document.activeElement;if(aa&&aa.blur)aa.blur();document.querySelectorAll('#gfOperationConsulta select').forEach(function(x){try{x.blur()}catch(_e){}})}catch(_e){}
    id=String(id||'').replace(/[^0-9]/g,'');
    if(!id)return;
    saveConsultaModalContext();
    try{
      window.gfOpAllTicketsById = window.gfOpAllTicketsById || {};
      ticketsList().forEach(function(t){ if(t && t.id) window.gfOpAllTicketsById[Number(t.id)] = t; });
      window.gfDashboardFilterRowsById = window.gfDashboardFilterRowsById || {};
      ticketsList().forEach(function(t){ if(t && t.id) window.gfDashboardFilterRowsById[Number(t.id)] = t; });
    }catch(e){}
    var n=Number(id);
    try{
      if(typeof window.openTicketFromDashboard==='function'){ window.openTicketFromDashboard(n); return; }
      if(typeof openTicketFromDashboard==='function'){ openTicketFromDashboard(n); return; }
      if(typeof window.openDrawer==='function'){ window.openDrawer(n); return; }
      if(typeof openDrawer==='function'){ openDrawer(n); return; }
    }catch(e){console.warn('Falha ao abrir detalhe completo do chamado:',e)}
    restoreConsultaModalContext();
  }

  function bindBox(box){if(box.__bound)return;box.__bound=true;
    box.addEventListener('input',function(e){var t=e.target;if(!t)return;if(t.id==='gfOcQuery'){state.query=t.value;saveState();scheduleRender()}if(t.id==='gfOcFrom'){state.from=t.value;saveState();scheduleRender()}if(t.id==='gfOcTo'){state.to=t.value;saveState();scheduleRender()}});
    box.addEventListener('change',function(e){var t=e.target;if(!t)return;if(t.id==='gfOcStatus')state.status=t.value;if(t.id==='gfOcSector')state.sector=t.value;if(t.id==='gfOcTech')state.tech=t.value;if(t.id==='gfOcType')state.type=t.value;saveState();render()});
    box.addEventListener('click',function(e){var b=e.target.closest('[data-range],[data-export],[data-kpi-ticket],[data-kpi],[data-detail],[data-asset],[data-context-more],[data-clear-filters],[data-oc-close]');if(!b)return;if(b.dataset.ocClose){try{gfOcCloseKpiFloat&&gfOcCloseKpiFloat(); window.__gfOcKpiReturnAfterTicket=null; gfOcActiveKpiCard=''; state.range='TODAY'; state.status='ALL'; state.sector=''; state.tech=''; state.type='ALL'; state.query=''; state.from=''; state.to=''; try{sessionStorage.removeItem('gf_oc_keep_period_session')}catch(_e){} saveState(); var pg=document.getElementById('pageOperacao'); if(pg)pg.classList.remove('gfOpConsultaMode'); var bx=document.getElementById('gfOperationConsulta'); if(bx)bx.remove(); if(typeof window.showPage==='function')window.showPage('dashboard');}catch(_){ }return}if(b.dataset.contextMore){contextExpanded=!contextExpanded;render();return}if(b.dataset.clearFilters){state.range='TODAY';state.status='ALL';state.sector='';state.tech='';state.type='ALL';state.from='';state.to='';try{sessionStorage.removeItem('gf_oc_keep_period_session')}catch(_e){}saveState();render();return}if(b.dataset.range){
        state.range=b.dataset.range;
        try{sessionStorage.setItem('gf_oc_keep_period_session','1')}catch(_e){}
        if(norm(state.range)==='CUSTOM'){
          if(!state.from)state.from=isoDay(0);
          if(!state.to)state.to=state.from;
        }else{
          state.from='';
          state.to='';
        }
        if(norm(state.range)==='ALL'){
          state.status='ALL';
          state.sector='';
          state.tech='';
          state.type='ALL';
          loadAllTickets(true);
        }
        saveState();render();
        if(norm(state.range)==='CUSTOM'){setTimeout(function(){var f=byId('gfOcFrom'); if(f)try{f.focus()}catch(e){}},40)}
        return}if(b.dataset.export){try{e.preventDefault();e.stopPropagation(); if(e.stopImmediatePropagation)e.stopImmediatePropagation();}catch(_e){} try{gfOcCloseKpiFloat&&gfOcCloseKpiFloat({manual:true})}catch(_e){} exportData(b.dataset.export);return}if(b.dataset.kpiTicket){openTicketFromConsultaModal(b.dataset.kpiTicket);return}if(b.dataset.kpi){openKpi(b.dataset.kpi);return}if(b.dataset.detail){var detail=String(b.dataset.detail||'');if(detail.indexOf('__TICKET_')===0){openTicketFromConsultaModal(detail.replace('__TICKET_',''));return}openDetail(b.dataset.detail,b.dataset.kind||'Detalhes');return}if(b.dataset.asset){openAssetDetail(b.dataset.asset);return}});
    var c=byId('gfOcClose'),bg=byId('gfOcModalBg');
    if(c)c.onclick=function(ev){
      try{ if(ev){ev.preventDefault();ev.stopPropagation(); if(ev.stopImmediatePropagation)ev.stopImmediatePropagation();} }catch(_e){}
      closeModal();
      return false;
    };
    if(bg)bg.onclick=function(ev){
      try{ if(ev){ev.preventDefault();ev.stopPropagation(); if(ev.stopImmediatePropagation)ev.stopImmediatePropagation();} }catch(_e){}
      closeModal();
      return false;
    };
  }
  function scheduleRender(){clearTimeout(renderDebounce);renderDebounce=setTimeout(render,120)}

  function relatedAssets(list){
    var groups=group(list,itemName).filter(function(g){return g.name && g.name!=='Não informado'}).slice(0,50);
    groups.forEach(function(g){
      var sectors=group(g.rows,sectorName).slice(0,4).map(function(s){return s.name+' ('+s.total+')'}).join(', ');
      var issues=group(g.rows,issueName).slice(0,3).map(function(s){return s.name+' ('+s.total+')'}).join(', ');
      var patrs=[...new Set(g.rows.map(patr).filter(Boolean))].slice(0,6);
      g.sectors=sectors; g.issues=issues; g.patrs=patrs; g.isOperationItem=true;
    });
    return groups;
  }
  function render(){
    if(norm(state.range)==='ALL' && !sessionStorage.getItem('gf_oc_keep_period_session')){state.range='TODAY';state.from='';state.to='';}
    var page=byId('pageOperacao');if(!page)return;ensureBox();var box=byId('gfOperationConsulta');if(!box)return;box.classList.toggle('gfOcCustom',norm(state.range)==='CUSTOM');
    try{var dr=byId('gfOcDateRow')||document.querySelector('#gfOperationConsulta .gfOcDateRow'); if(dr) dr.style.display=(norm(state.range)==='CUSTOM'?'grid':'none');}catch(e){}
    gfOcEnsureAssetsLoaded();
    var fh=filterHtml(); var fe=byId('gfOcFilters'); if(fe && fe.__gfOcHtml!==fh){fe.innerHTML=fh;fe.__gfOcHtml=fh;}
    var q=byId('gfOcQuery');if(q&&q.value!==state.query)q.value=state.query||'';
    ['Status','Sector','Tech','Type'].forEach(function(n){var el=byId('gfOc'+n);if(!el)return;var key=n==='Sector'?'sector':n==='Tech'?'tech':n.toLowerCase();el.value=state[key]||''});
    var f=byId('gfOcFrom'),to=byId('gfOcTo');if(f)f.value=state.from||'';if(to)to.value=state.to||'';
    var r=rows(), a=relatedAssets(r); renderKpis(r,a); renderAnswer(r,a); renderContext(r); renderLatest(r); renderAssets(a);
  }
  
  function gfOcKpiTicketMini(t){
    var id=t&&(t.id||t.ticket_number)||'';
    var st=done(t)?'done':(pending(t)?'warn':'progress');
    var title=[issueName(t), itemName(t)].filter(function(x){return x&&x!=='Não informado'}).slice(0,2).join(' • ') || 'Chamado';
    var desc=txt(t&&t.description||'');
    return '<button type="button" class="gfOcKpiTicketMini" data-kpi-ticket="'+esc(id)+'">'
      +'<span class="gfOcKpiTicketTop"><b>#'+esc(t.ticket_number||t.id||'-')+'</b><strong>'+esc(sectorName(t))+'</strong><i class="'+st+'">'+esc(statusLabel(t.status,t))+'</i></span>'
      +'<span class="gfOcKpiTicketTitle">'+esc(title)+'</span>'
      +(desc?'<span class="gfOcKpiTicketDesc">'+esc(String(desc).slice(0,92))+'</span>':'')
    +'</button>';
  }
  function gfOcKpiAssetMini(g){
    return '<button type="button" class="gfOcKpiTicketMini asset" data-detail="'+esc(g.name)+'" data-kind="Equipamento/Serviço">'
      +'<span class="gfOcKpiTicketTop"><b>'+esc(g.total)+'x</b><strong>'+esc(g.name)+'</strong><i class="'+(g.pending?'warn':'done')+'">'+esc(g.pending+' pendente(s)')+'</i></span>'
      +(g.issues?'<span class="gfOcKpiTicketDesc">'+esc(g.issues)+'</span>':'')
    +'</button>';
  }
  function gfOcFillKpiList(id,list,empty){
    setHtml(id,(list&&list.length)?list.map(gfOcKpiTicketMini).join(''):'<div class="gfOcKpiEmpty">'+esc(empty||'Sem chamados no filtro')+'</div>');
  }
  function bindKpiCardsClick(){
    try{
      document.querySelectorAll('#gfOperationConsulta .gfOcKpi[data-kpi]').forEach(function(card){
        if(card.__gfOcKpiBound)return;
        card.__gfOcKpiBound=true;
        card.setAttribute('role','button');
        card.setAttribute('tabindex','0');
        card.title='Clique para ver os chamados deste card';
        card.addEventListener('click',function(ev){
          ev.preventDefault();
          ev.stopPropagation();
          openKpi(card.getAttribute('data-kpi'));
        });
        card.addEventListener('keydown',function(ev){
          if(ev.key==='Enter'||ev.key===' '){
            ev.preventDefault();
            openKpi(card.getAttribute('data-kpi'));
          }
        });
      });
    }catch(e){}
  }
  function renderKpis(r,a){
    var pendList=r.filter(pending), doneList=r.filter(done), costList=r.filter(function(t){return cost(t)>0});
    var ticketCostTotal=r.reduce(function(s,t){return s+cost(t)},0);
    var visibleCost=ticketCostTotal;
    setText('gfOcTotal',r.length);setText('gfOcPending',pendList.length);setText('gfOcDone',doneList.length);setText('gfOcCost',money(visibleCost));setText('gfOcAssetsCount',a.length);setText('gfOcPeriodLabel',bounds().label);setText('gfOcCount',r.length+' registro(s)');
    bindKpiCardsClick();
    var fp=byId('gfOcKpiFloatPanel');
    if(gfOcActiveKpiCard && fp && fp.parentNode && getComputedStyle(fp).display!=='none'){
      // Evita travamento: não remonta a lista suspensa a cada renderização simples.
      // A lista é atualizada apenas quando o usuário clicar em outro card.
      fp.setAttribute('data-current-kpi',gfOcActiveKpiCard);
    }
  }

  function renderAnswer(r,a){
    var q=txt(state.query||''), b=bounds(), pend=r.filter(pending).length, res=r.filter(done).length, c=r.reduce(function(s,t){return s+cost(t)},0);
    if(!r.length){setHtml('gfOcAnswer','<div class="gfOcEmpty">Nenhum acontecimento encontrado. Tente mudar o período para Todos ou limpar algum filtro.</div>');return}
    var byItem=group(r,itemName), byIssue=group(r,issueName), bySector=group(r,sectorName), byPerson=group(r,anyPerson);
    var qn=norm(q), person=qn?byPerson.find(function(g){return norm(g.name).indexOf(qn)>=0}):null;
    var html='<div class="gfOcAnswerGrid">';
    html+='<div class="gfOcInsight main"><small>Resumo da consulta</small><b>'+(q?'Pesquisa: '+esc(q):'Filtro atual')+' • '+esc(b.label)+'</b><span>'+r.length+' chamado(s) encontrado(s), '+res+' resolvido(s), '+pend+' pendente(s) e '+money(c)+' em custos.</span></div>';
    if(person){
      html+='<div class="gfOcInsight"><small>Pessoa/Técnico</small><b>'+esc(person.name)+'</b><span>'+person.total+' chamado(s), '+person.done+' resolvido(s), '+person.pending+' pendente(s).</span></div>';
      html+='<div class="gfOcInsight"><small>Setores atendidos</small><b>'+esc(bySector.slice(0,4).map(function(g){return g.name}).join(', ')||'-')+'</b><span>Baseado nos chamados encontrados no filtro.</span></div>';
    }
    if(byItem[0])html+='<div class="gfOcInsight"><small>Item/serviço mais relacionado</small><b>'+esc(byItem[0].name)+'</b><span>'+byItem[0].total+' ocorrência(s) no filtro.</span></div>';
    if(byIssue[0])html+='<div class="gfOcInsight"><small>Problema mais comum</small><b>'+esc(byIssue[0].name)+'</b><span>'+byIssue[0].total+' ocorrência(s) encontrada(s).</span></div>';
    if(bySector[0])html+='<div class="gfOcInsight"><small>Setor mais relacionado</small><b>'+esc(bySector[0].name)+'</b><span>'+bySector[0].total+' chamado(s) no período.</span></div>';
    html+='<div class="gfOcInsight"><small>Equipamentos/serviços com problema</small><b>'+a.length+'</b><span>Apenas itens envolvidos nos chamados filtrados.</span></div>';
    html+='</div>';
    setHtml('gfOcAnswer',html);
  }
  function ctxIcon(kind){kind=String(kind||''); if(kind.indexOf('Equipamento')>=0)return '🧩'; if(kind.indexOf('Problema')>=0)return '⚠️'; if(kind.indexOf('Setor')>=0)return '🏢'; if(kind.indexOf('Pessoa')>=0)return '👤'; return '🔎'}
  function ctxUnit(kind){kind=String(kind||''); if(kind.indexOf('Pessoa')>=0)return 'participação'; return 'ocorrência'}
  function ctxRow(g,kind){
    var cls='kind-'+String(kind||'').split('/')[0].replace(/[^A-Za-zÀ-ÿ0-9]/g,'');
    var unit=ctxUnit(kind), label=g.total+' '+unit+(g.total===1?'':'s');
    return '<div class="gfOcCtxRow gfOcCtxSimple '+esc(cls)+'" data-detail="'+esc(g.name)+'" data-kind="'+esc(kind)+'">'
      +'<div class="ctxIcon">'+ctxIcon(kind)+'</div>'
      +'<div class="ctxMain"><b>'+esc(g.name)+'</b><small class="ctxKind">'+esc(kind)+'</small></div>'
      +'<div class="ctxQty">'+esc(label)+'</div>'
      +'<span class="gfPill '+(g.pending?'warn':'ok')+'">ver</span></div>'
  }
  function renderContext(r){
    var all=[];
    group(r,itemName).slice(0,4).forEach(function(g){all.push({g:g,k:'Equipamento/Serviço'})});
    group(r,issueName).slice(0,4).forEach(function(g){all.push({g:g,k:'Problema'})});
    group(r,sectorName).slice(0,4).forEach(function(g){all.push({g:g,k:'Setor'})});
    group(r,anyPerson).filter(function(g){return g.name!=='Não informado'}).slice(0,4).forEach(function(g){all.push({g:g,k:'Pessoa/Técnico'})});
    if(!all.length){setHtml('gfOcContext','<div class="gfOcEmpty">Sem contexto para detalhar.</div>');return}
    var visible=contextExpanded?all:all.slice(0,5);
    var html=visible.map(function(x){return ctxRow(x.g,x.k)}).join('');
    if(all.length>5){
      html+='<button type="button" class="gfOcSeeMore" data-context-more="1">'+(contextExpanded?'Ver menos':'Ver mais (+'+(all.length-5)+')')+'</button>';
    }
    setHtml('gfOcContext',html);
  }
  function conclusionText(t){return txt(t&&(t.resolution_note||t.solution||t.latest_ticket_solution||t.final_note||t.close_note||t.resolution_description||''))}
  function latestItem(t){
    var res=conclusionText(t), desc=txt(t&&t.description||''), st=done(t)?'ok':(norm(t.status)==='IN_PROGRESS'?'warn':'blue');
    var main=res||desc||('Chamado relacionado a '+itemName(t));
    var sub=[]; if(sectorName(t)!=='Não informado')sub.push(sectorName(t)); if(itemName(t)!=='Não informado')sub.push(itemName(t)); if(issueName(t)!=='Não informado')sub.push(issueName(t)); if(anyPerson(t)!=='Não informado')sub.push(anyPerson(t));
    return '<div class="gfOcConclusionItem" data-detail="__TICKET_'+esc(t.id||t.ticket_number)+'" data-kind="Chamado">'
      +'<div class="gfOcConclusionTop"><b>#'+esc(t.ticket_number||t.id)+' • '+esc(fmt(t.created_at))+'</b><span class="gfPill '+st+'">'+esc(statusLabel(t.status,t))+'</span></div>'
      +'<p>'+esc(String(main).slice(0,320))+'</p>'
      +'<small>'+esc(sub.filter(Boolean).slice(0,5).join(' • '))+'</small>'
    +'</div>'
  }
  function renderLatest(r){
    var list=r.filter(function(t){return conclusionText(t)||txt(t.description||'')}).slice(0,8);
    setText('gfOcLatestCount', list.length ? list.length+' registro(s) direto(s)' : 'sem comentário no filtro');
    setHtml('gfOcLatest', list.map(latestItem).join('') || '<div class="gfOcEmpty">Nenhuma descrição ou conclusão encontrada no filtro atual.</div>');
  }
  function renderAssets(list){
    if(!list.length){setHtml('gfOcAssets','<div class="gfOcEmpty">Nenhum equipamento ou serviço com problema dentro dos filtros atuais.</div>');return}
    setHtml('gfOcAssets',list.map(function(g){
      return '<div class="gfOcAsset gfOcItemCard" data-detail="'+esc(g.name)+'" data-kind="Equipamento/Serviço">'+
        '<b>'+esc(g.name)+'</b>'+
        '<div class="gfOcAssetLine"><span>'+g.total+' ocorrência(s)</span><span class="gfPill '+(g.pending?'warn':'ok')+'">'+g.done+' resolvido(s)</span></div>'+
        '<div class="gfOcAssetLine"><small>'+esc(g.pending+' pendente(s) • '+money(g.cost))+'</small><small>ver detalhes</small></div>'+
        (g.sectors?'<div class="gfOcMiniText"><b>Setores:</b> '+esc(g.sectors)+'</div>':'')+
        (g.issues?'<div class="gfOcMiniText"><b>Problemas:</b> '+esc(g.issues)+'</div>':'')+
        (g.patrs&&g.patrs.length?'<div class="gfOcMiniText"><b>Patrimônios relacionados:</b> '+esc(g.patrs.join(', '))+'</div>':'')+
      '</div>'
    }).join(''))
  }


  async function loadAllTickets(force){
    if(loading || (loadedAll && !force))return;loading=true;
    try{
      var lists=[];
      var urls=[
        APIBASE+'/api/admin/dashboard-v8?light=1',
        APIBASE+'/api/admin/tickets?light=1&limit=500&offset=0',
        APIBASE+'/api/admin/tickets?limit=500&offset=0'
      ];
      for(var i=0;i<urls.length;i++){
        try{
          var r=await fetch(urls[i],{credentials:'include',cache:'no-store'});
          if(r.status===401){location.href='/login';return}
          if(!r.ok)continue;
          var j=await r.json();
          if(Array.isArray(j.rows))lists.push(j.rows);
          if(Array.isArray(j.tickets))lists.push(j.tickets);
        }catch(_e){}
      }
      var map={};
      function put(list){arr(list).forEach(function(t){if(!t)return;var id=String(t.id||t.ticket_id||t.db_id||t.ticket_number||'');if(!id)return;map[id]=Object.assign({},map[id]||{},t)})}
      lists.forEach(put);
      try{put(window.dashboardAllTickets)}catch(e){}
      try{put(window.tickets)}catch(e){}
      allTickets=Object.keys(map).map(function(k){return map[k]}).sort(function(a,b){return ticketDate(b)-ticketDate(a)});
      gfOcInvalidateCache();
      window.gfOpAllTicketsV41=allTickets;
      window.gfOpAllTicketsV40=allTickets;
      try{window.tickets=allTickets;tickets=allTickets}catch(e){window.tickets=allTickets}
      loadedAll=true;
    }
    catch(e){try{console.warn('Consulta: falha ao carregar todos os chamados',e)}catch(_){}}
    finally{loading=false;render()}
  }
  function traceCards(r){
    if(!r.length)return '<div class="gfOcEmpty">Nenhum registro relacionado.</div>';
    function has(v){return txt(v) && txt(v)!=='-' && txt(v)!=='Não informado' && txt(v)!=='Não informada'}
    function safeJoin(a,sep){return a.filter(function(x){return has(x)}).join(sep||' • ')}
    function statusClass(t){
      var st=norm(t.status);
      if(done(t))return 'done';
      if(st==='IN_PROGRESS')return 'progress';
      if(st==='NEW')return 'new';
      return pending(t)?'new':'done';
    }
    function statusText(t){return statusLabel(t.status,t)||'Novo'}
    function isCritical(t){
      var pr=norm(t.priority||t.prioridade||'');
      var sla=norm(t.sla_status||t.sla||'');
      return pr==='HIGH'||pr==='ALTA'||sla.indexOf('CRIT')>=0||sla.indexOf('BAD')>=0||statusText(t).toLowerCase().indexOf('sla')>=0;
    }
    function leftClass(t){
      if(isCritical(t))return 'sla';
      if(norm(t.status)==='IN_PROGRESS')return 'progress';
      return 'open';
    }
    function shortAge(t){
      var d=parseDate(t.created_at||t.opened_at||t.date); if(!d)return '';
      var ms=Date.now()-d.getTime(); if(ms<0)ms=0;
      var h=Math.floor(ms/3600000), m=Math.floor((ms%3600000)/60000);
      if(h<1)return 'Há '+Math.max(1,m)+'min';
      if(h<24)return 'Há '+h+'h '+m+'min';
      return 'Há '+Math.floor(h/24)+'d '+(h%24)+'h';
    }
    function respPill(t){
      var name=responsible(t)||resolver(t)||openedBy(t)||'';
      if(done(t) && has(name))return '<div class="gfOcDashResp">👤 '+esc(name)+'</div>';
      if(has(name))return '<div class="gfOcDashResp">👤 '+esc(name)+'</div>';
      return '<div class="gfOcDashResp">👤 Não assumido</div>';
    }
    function card(t){
      var desc=txt(t.description||t.public_note||'');
      var sec=sectorName(t);
      var typ=typeLabel(t);
      var title=safeJoin([itemName(t),issueName(t)],' • ')||'Chamado';
      var stc=statusClass(t), lc=leftClass(t);
      var badgeText=isCritical(t)&&!done(t)?'SLA crítico':statusText(t);
      return '<article class="gfOcDashTicketCard '+lc+'" data-detail="__TICKET_'+esc(t.id||t.ticket_number)+'" data-kind="Chamado">'
        +'<div class="gfOcDashTop">'
          +'<div class="gfOcDashMeta">'
            +'<b class="gfOcDashNumber">#'+esc(t.ticket_number||t.id)+'</b>'
            +(has(sec)?'<span class="gfOcDashSector">📍 '+esc(sec)+'</span>':'')
            +(has(typ)?'<span class="gfOcDashType">💻 '+esc(typ)+'</span>':'')
          +'</div>'
          +'<div class="gfOcDashRight">'
            +(shortAge(t)?'<span class="gfOcDashAge">'+esc(shortAge(t))+'</span>':'')
            +'<span class="gfOcDashBadge '+stc+'">'+esc(badgeText)+'</span>'
          +'</div>'
        +'</div>'
        +'<h4 class="gfOcDashTitle">'+esc(title)+'</h4>'
        +(desc?'<p class="gfOcDashDesc">'+esc(desc)+'</p>':'')
        +'<div class="gfOcDashBottom">'
          +respPill(t)
          +'<button type="button" class="gfOcDashBtn" data-detail="__TICKET_'+esc(t.id||t.ticket_number)+'" data-kind="Chamado">Ver detalhes</button>'
        +'</div>'
      +'</article>';
    }
    return '<div class="gfOcDashTicketList">'+r.slice(0,120).map(card).join('')+'</div>'+(r.length>120?'<div class="gfOcMore">Mostrando 120 registros. Use os filtros para refinar a consulta.</div>':'');
  }
  function openDetail(name,kind){
    var r=rows();
    if(String(name).indexOf('__TICKET_')===0){
      var id=String(name).replace('__TICKET_','');
      r=ticketsList().filter(function(t){return String(t.id)===id||String(t.ticket_number)===id});
      showDetail(name,kind,r);
      return;
    }
    if(name){var n=norm(name);r=r.filter(function(t){return textTicket(t).indexOf(n)>=0})}
    gfOcOpenRelatedFloat(name,kind,r);
  }
  function showDetail(title,kind,r){
    try{var mm=byId('gfOcModal'); if(mm)mm.classList.remove('gfOcAssetsMode'); var cc=byId('gfOcClose'); if(cc)cc.textContent='Fechar';}catch(e){}
    var totalCost=r.reduce(function(s,t){return s+cost(t)},0);
    setText('gfOcModalTitle',(title||'Detalhes'));
    var doneCount=r.filter(done).length, pendCount=r.filter(pending).length;
    setHtml('gfOcModalBody',
      '<div class="gfOcDashSummary">'
        +'<div class="gfOcDashSummaryIcon">📄</div>'
        +'<div class="gfOcDashSummaryText"><b>'+esc(title||'Detalhes')+'</b><small>Resultado do filtro atual.</small></div>'
        +'<strong>'+r.length+' itens</strong>'
      +'</div>'
      +'<div class="gfOcDashMiniStats"><span>Pendentes <b>'+pendCount+'</b></span><span>Resolvidos <b>'+doneCount+'</b></span>'+(totalCost>0?'<span>Custo <b>'+money(totalCost)+'</b></span>':'')+'</div>'
      +traceCards(r)
    );
    openModal();
  }
  function gfOcEnsureKpiResult(){
    var el=byId('gfOcKpiResult');
    if(el)return el;
    var kpis=document.querySelector('#gfOperationConsulta .gfOcKpis');
    if(!kpis||!kpis.parentNode)return null;
    el=document.createElement('div');
    el.id='gfOcKpiResult';
    el.className='gfOcKpiResult';
    el.style.display='none';
    kpis.parentNode.insertBefore(el,kpis.nextSibling);
    return el;
  }
  function gfOcSimpleTicketList(list){
    if(!list||!list.length)return '<div class="gfOcEmpty">Nenhum chamado nesse card.</div>';
    return '<div class="gfOcDashTicketList">'+list.slice(0,120).map(function(t){
      var id=t&&(t.id||t.ticket_number)||'';
      var desc=txt(t&&t.description||t&&t.public_note||'');
      var title=[itemName(t),issueName(t)].filter(function(x){return x&&x!=='Não informado'}).join(' • ')||'Chamado';
      var st=done(t)?'done':(pending(t)?'new':'progress');
      var badge=done(t)?'Resolvido':(pending(t)?'Novo':'Em andamento');
      var sec=sectorName(t)||'';
      var typ=typeLabel(t)||'';
      return '<article class="gfOcDashTicketCard '+(done(t)?'done':(pending(t)?'open':'progress'))+'" data-detail="__TICKET_'+esc(id)+'" data-kind="Chamado">'
        +'<div class="gfOcDashTop"><div class="gfOcDashMeta"><b class="gfOcDashNumber">#'+esc(t.ticket_number||t.id||'-')+'</b>'
        +(sec?'<span class="gfOcDashSector">📍 '+esc(sec)+'</span>':'')
        +(typ?'<span class="gfOcDashType">'+esc(typ)+'</span>':'')
        +'</div><div class="gfOcDashRight"><span class="gfOcDashBadge '+st+'">'+esc(badge)+'</span></div></div>'
        +'<h4 class="gfOcDashTitle">'+esc(title)+'</h4>'
        +(desc?'<p class="gfOcDashDesc">'+esc(String(desc).slice(0,160))+'</p>':'')
        +'<div class="gfOcDashBottom"><div class="gfOcDashResp">👤 '+esc(responsible(t)||'Não assumido')+'</div><button type="button" class="gfOcDashBtn" data-detail="__TICKET_'+esc(id)+'" data-kind="Chamado">Ver detalhes</button></div>'
        +'</article>';
    }).join('')+'</div>'+(list.length>120?'<div class="gfOcMore">Mostrando 120 registros. Use os filtros para refinar.</div>':'');
  }
  function gfOcCloseKpiFloat(opts){
    try{
      // Fecha a lista suspensa. Quando for fechamento manual (X, Fechar ou fundo),
      // limpa também o estado interno do KPI aberto. Sem isso, renderKpis() reabria
      // sozinho ao voltar para a pesquisa porque gfOcActiveKpiCard continuava preenchido.
      var manual = !(opts && opts.manual===false);
      if(manual){
        window.__gfOcKpiReturnAfterTicket=null;
        gfOcActiveKpiCard='';
      }
      var bg=byId('gfOcKpiFloatBg'), p=byId('gfOcKpiFloatPanel');
      if(bg)bg.remove();
      if(p)p.remove();
      document.querySelectorAll('#gfOperationConsulta .gfOcKpi').forEach(function(x){x.classList.remove('active')});
    }catch(e){}
  }
  function gfOcKpiFloatTitle(k){
    if(k==='PENDING')return {icon:'!', title:'Pendentes no período', sub:'RESULTADO DO FILTRO ATUAL.'};
    if(k==='DONE')return {icon:'✓', title:'Resolvidos no período', sub:'RESULTADO DO FILTRO ATUAL.'};
    if(k==='COST')return {icon:'$', title:'Chamados com custo', sub:'RESULTADO DO FILTRO ATUAL.'};
    return {icon:'▤', title:'Chamados encontrados', sub:'RESULTADO DO FILTRO ATUAL.'};
  }
  function gfOcOpenRelatedFloat(title,kind,list){
    try{gfOcCloseKpiFloat({manual:false})}catch(e){}
    var bg=document.createElement('div'), panel=document.createElement('section');
    bg.id='gfOcKpiFloatBg';
    panel.id='gfOcKpiFloatPanel';
    panel.className='gfOcKpiFloatPanel';
    panel.setAttribute('data-current-kpi','RELATED');
    bg.addEventListener('click',gfOcCloseKpiFloat);
    var totalCost=list.reduce(function(s,t){return s+cost(t)},0);
    var extra='<div class="gfOcDashMiniStats"><span>Pendentes <b>'+list.filter(pending).length+'</b></span><span>Resolvidos <b>'+list.filter(done).length+'</b></span>'+(totalCost>0?'<span>Custo <b>'+money(totalCost)+'</b></span>':'')+'</div>';
    panel.innerHTML='<div class="gfOcKpiFloatHead">'
      +'<div class="gfOcKpiFloatIcon">🔎</div>'
      +'<div class="gfOcKpiFloatText"><b>'+esc(title||'Relacionados')+'</b><small>'+esc(kind||'Chamados relacionados')+'</small></div>'
      +'<strong>'+esc(list.length)+' itens</strong>'
      +'<button type="button" class="gfOcKpiFloatClose" aria-label="Fechar">×</button>'
    +'</div><div class="gfOcKpiFloatBody">'+extra+gfOcSimpleTicketList(list)+'</div>'
    +'<div class="gfOcKpiFloatFoot"><button type="button" class="gfOcKpiFloatBtn">Fechar</button></div>';
    panel.querySelector('.gfOcKpiFloatClose').onclick=gfOcCloseKpiFloat;
    panel.querySelector('.gfOcKpiFloatBtn').onclick=gfOcCloseKpiFloat;
    panel.addEventListener('click',function(ev){
      var detail=ev.target&&ev.target.closest&&ev.target.closest('[data-detail]');
      if(!detail)return;
      ev.preventDefault(); ev.stopPropagation(); if(ev.stopImmediatePropagation)ev.stopImmediatePropagation();
      var d=String(detail.dataset.detail||'');
      if(d.indexOf('__TICKET_')===0){
        try{
          var body=panel.querySelector('.gfOcKpiFloatBody');
          window.__gfOcKpiReturnAfterTicket={active:true,scroll:body?Number(body.scrollTop||0):0,at:Date.now()};
          if(bg) bg.style.setProperty('display','none','important');
          if(panel) panel.style.setProperty('display','none','important');
        }catch(e){}
        openTicketFromConsultaModal(d.replace('__TICKET_',''));
      }
    });
    document.body.appendChild(bg); document.body.appendChild(panel);
    try{panel.querySelector('.gfOcKpiFloatBody').scrollTop=0;}catch(e){}
  }
  function gfOcOpenKpiFloat(k,list){
    gfOcCloseKpiFloat({manual:false});
    var meta=gfOcKpiFloatTitle(k), bg=document.createElement('div'), panel=document.createElement('section');
    bg.id='gfOcKpiFloatBg';
    panel.id='gfOcKpiFloatPanel';
    panel.className='gfOcKpiFloatPanel';
    panel.setAttribute('data-current-kpi',String(k||'ALL').toUpperCase());
    bg.addEventListener('click',gfOcCloseKpiFloat);
    var totalCost=list.reduce(function(s,t){return s+(k==='COST'?gfOcTicketOwnCost(t):cost(t))},0);
    var extra=(k==='COST'&&totalCost>0)?'<div class="gfOcDashMiniStats"><span>Custo filtrado <b>'+money(totalCost)+'</b></span></div>':'';
    panel.innerHTML='<div class="gfOcKpiFloatHead">'
      +'<div class="gfOcKpiFloatIcon">'+esc(meta.icon)+'</div>'
      +'<div class="gfOcKpiFloatText"><b>'+esc(meta.title)+'</b><small>'+esc(meta.sub)+'</small></div>'
      +'<strong>'+esc(list.length)+' itens</strong>'
      +'<button type="button" class="gfOcKpiFloatClose" aria-label="Fechar">×</button>'
    +'</div><div class="gfOcKpiFloatBody">'+extra+gfOcSimpleTicketList(list)+'</div>'
    +'<div class="gfOcKpiFloatFoot"><button type="button" class="gfOcKpiFloatBtn">Fechar</button></div>';
    panel.querySelector('.gfOcKpiFloatClose').onclick=gfOcCloseKpiFloat;
    panel.querySelector('.gfOcKpiFloatBtn').onclick=gfOcCloseKpiFloat;
    panel.addEventListener('click',function(ev){
      var detail=ev.target&&ev.target.closest&&ev.target.closest('[data-detail]');
      if(!detail)return;
      ev.preventDefault();
      ev.stopPropagation(); if(ev.stopImmediatePropagation)ev.stopImmediatePropagation();
      if(detail.dataset.detail){
        var d=String(detail.dataset.detail||'');
        if(d.indexOf('__TICKET_')===0){
          try{
            var body=panel.querySelector('.gfOcKpiFloatBody');
            window.__gfOcKpiReturnAfterTicket={active:true,scroll:body?Number(body.scrollTop||0):0,at:Date.now()};
            if(bg) bg.style.setProperty('display','none','important');
            if(panel) panel.style.setProperty('display','none','important');
          }catch(e){}
          openTicketFromConsultaModal(d.replace('__TICKET_',''));
          return;
        }
        openDetail(d,detail.dataset.kind||'Detalhes');
      }
    });
    document.body.appendChild(bg);
    document.body.appendChild(panel);
    try{panel.querySelector('.gfOcKpiFloatBody').scrollTop=0;}catch(e){}
  }
  function openKpi(k){
    k=String(k||'ALL').toUpperCase();
    var currentPanel=byId('gfOcKpiFloatPanel');
    if(currentPanel && currentPanel.parentNode && currentPanel.getAttribute('data-current-kpi')===k && getComputedStyle(currentPanel).display!=='none')return;
    document.querySelectorAll('#gfOperationConsulta .gfOcKpi').forEach(function(x){
      x.classList.toggle('active',x.getAttribute('data-kpi')===k);
    });
    gfOcActiveKpiCard=k;
    if(k==='ASSETS'){
      showAssetsModal();
      return;
    }
    var r=rows();
    if(k==='PENDING'){
      r=r.filter(pending);
    }else if(k==='DONE'){
      r=r.filter(done);
    }else if(k==='COST'){
      r=r.filter(function(t){return gfOcTicketOwnCost(t)>0});
    }
    gfOcOpenKpiFloat(k,r);
  }
  window.gfOcOpenKpi=openKpi;
  function gfOcRenderAssetsRoot(list,keepScroll){
    function iconFor(name){var n=norm(name); if(n.indexOf('IMPRESSORA')>=0)return '🖨️'; if(n.indexOf('INTERNET')>=0||n.indexOf('WIFI')>=0)return '📶'; if(n.indexOf('SERVICOS')>=0||n.indexOf('SERVIÇOS')>=0||n.indexOf('MANUT')>=0)return '🛠️'; if(n.indexOf('REQUISI')>=0)return '📋'; return '🖥️'}
    function item(g){
      var detail=txt(((g.sectors||'')+(g.sectors&&g.issues?', ':'')+(g.issues||''))).toUpperCase();
      return '<article class="gfOcAssetListItem gfOcItemCard" data-asset-related="'+esc(g.name)+'">'
        +'<div class="gfOcAssetListIcon">'+iconFor(g.name)+'</div>'
        +'<div class="gfOcAssetListMain"><div class="gfOcAssetListTop"><h4>'+esc(g.name)+'</h4><span class="gfOcAssetDone '+(g.pending?'warn':'ok')+'">'+g.done+' resolvido(s)</span></div>'
        +'<div class="gfOcAssetCount">'+g.total+' ocorrência(s)</div>'
        +(detail?'<p>'+esc(detail)+'</p>':'')+'</div><div class="gfOcAssetArrow">›</div></article>';
    }
    try{var m=byId('gfOcModal'); if(m)m.classList.add('gfOcAssetsMode'); var c=byId('gfOcClose'); if(c)c.innerHTML='<span class="gfOcCloseX">×</span><b>Fechar</b>'; var h=byId('gfOcModalTitle'); if(h)h.innerHTML='<span class="gfOcAssetsHeadIcon">⌯</span><span>Equipamentos e serviços com problema no filtro</span>'; }catch(e){}
    setHtml('gfOcModalBody','<div class="gfOcAssetsListRef">'+(list.map(item).join('')||'<div class="gfOcEmpty">Nenhum equipamento ou serviço com problema no filtro.</div>')+'</div>');
    var body=byId('gfOcModalBody');
    if(body){
      body.onclick=function(ev){
        var row=ev.target&&ev.target.closest&&ev.target.closest('[data-asset-related]');
        if(!row)return;
        ev.preventDefault();ev.stopPropagation();
        var name=String(row.getAttribute('data-asset-related')||'');
        var n=norm(name);
        var related=rows().filter(function(t){return norm(itemName(t))===n || textTicket(t).indexOf(n)>=0});
        gfOcModalBackStack.push({view:'assetsRoot', list:list, scroll:body?Number(body.scrollTop||0):0});
        gfOcRenderRelatedTickets(name, related, 0);
      };
      if(keepScroll){setTimeout(function(){try{body.scrollTop=Number(keepScroll||0)}catch(e){}},30);}
    }
  }
  function gfOcRenderRelatedTickets(name,related,keepScroll){
    try{var m=byId('gfOcModal'); if(m)m.classList.remove('gfOcAssetsMode'); var h=byId('gfOcModalTitle'); if(h)h.innerHTML='<span>Chamados relacionados • '+esc(name)+'</span>'; var c=byId('gfOcClose'); if(c)c.innerHTML='<span class="gfOcCloseX">×</span><b>Voltar</b>'; }catch(e){}
    setHtml('gfOcModalBody','<div class="gfOcDashSummary"><div class="gfOcDashSummaryIcon">📄</div><div class="gfOcDashSummaryText"><b>'+esc(name)+'</b><small>Chamados relacionados ao item selecionado.</small></div><strong>'+related.length+' itens</strong></div>'+gfOcSimpleTicketList(related));
    var body=byId('gfOcModalBody');
    if(body){
      body.onclick=function(ev){
        var detail=ev.target&&ev.target.closest&&ev.target.closest('[data-detail]');
        if(!detail)return;
        var d=String(detail.dataset.detail||'');
        if(d.indexOf('__TICKET_')===0){
          ev.preventDefault();ev.stopPropagation(); if(ev.stopImmediatePropagation)ev.stopImmediatePropagation();
          openTicketFromConsultaModal(d.replace('__TICKET_',''));
          return false;
        }
      };
      if(keepScroll){setTimeout(function(){try{body.scrollTop=Number(keepScroll||0)}catch(e){}},30);}
    }
  }
  function showAssetsModal(){
    gfOcModalBackStack=[];
    var list=relatedAssets(rows());
    gfOcRenderAssetsRoot(list,0);
    openModal();
  }
  function openAssetDetail(id){var a=assetsList().filter(function(x){return String(x.id)===String(id)})[0];if(!a)return;var p=norm(a.patrimonio||a.sp_identificacao), n=norm(a.name);var r=ticketsList().filter(function(t){return (p&&norm(patr(t))===p)||(t.asset_id&&String(t.asset_id)===String(a.id))||(p&&textTicket(t).indexOf(p)>=0)});setText('gfOcModalTitle',(a.patrimonio||a.sp_identificacao||a.name||'Patrimônio')+' • Patrimônio');setHtml('gfOcModalBody','<div class="gfOcTrace"><div class="gfOcTraceBox"><small>Situação</small><b>'+esc(assetStatus(a.status))+'</b></div><div class="gfOcTraceBox"><small>Setor</small><b>'+esc(a.sector_name||a.origin_sector_name||'-')+'</b></div><div class="gfOcTraceBox"><small>Chamados relacionados</small><b>'+r.length+'</b></div><div class="gfOcTraceBox"><small>Custo relacionado</small><b>'+money(r.reduce(function(s,t){return s+cost(t)},0))+'</b></div></div><div class="gfOcInfo"><b>Equipamento:</b> '+esc(a.name||'-')+'<br><b>Motivo/Situação:</b> '+esc(a.out_of_operation_reason||a.latest_ticket_solution||'-')+'</div>'+traceCards(r));openModal()}
  function openModal(){var bg=byId('gfOcModalBg'),m=byId('gfOcModal'),body=byId('gfOcModalBody');try{if(bg&&bg.parentNode!==document.body)document.body.appendChild(bg);if(m&&m.parentNode!==document.body)document.body.appendChild(m);}catch(e){} if(bg){bg.style.display='block';bg.classList.add('show');} if(m){m.style.display='flex';m.style.visibility='visible';m.style.opacity='1';m.classList.add('show');} try{if(body)body.scrollTop=0;if(m)m.scrollTop=0;document.documentElement.classList.add('gfOcModalOpen');document.body.classList.add('gfOcModalOpenBody')}catch(e){}requestAnimationFrame(function(){try{if(body)body.scrollTop=0;if(m)m.scrollTop=0}catch(e){}});setTimeout(function(){try{if(body)body.scrollTop=0;if(m)m.scrollTop=0}catch(e){}},50)}
  function closeModal(){
    try{
      if(gfOcModalBackStack && gfOcModalBackStack.length){
        var prev=gfOcModalBackStack.pop();
        if(prev && prev.view==='assetsRoot'){
          gfOcRenderAssetsRoot(prev.list||relatedAssets(rows()), prev.scroll||0);
          openModal();
          return;
        }
      }
    }catch(e){}
    gfOcModalBackStack=[];
    var bg=byId('gfOcModalBg'),m=byId('gfOcModal');
    if(bg){bg.classList.remove('show');bg.style.display='none';}
    if(m){m.classList.remove('show');m.style.display='none';}
    try{var body=byId('gfOcModalBody'); if(body)body.onclick=null;}catch(e){}
    try{document.documentElement.classList.remove('gfOcModalOpen');document.body.classList.remove('gfOcModalOpenBody')}catch(e){}
  }
  function exportRows(){return rows().map(function(t){return {'Chamado':t.ticket_number||t.id,'Data abertura':t.created_at||'','Setor':sectorName(t),'Tipo':typeLabel(t),'Equipamento/Serviço':itemName(t),'Patrimônio':patr(t),'Problema':issueName(t),'Status':statusLabel(t.status,t),'Prioridade':prioLabel(t.priority),'Aberto por':openedBy(t),'Responsável':responsible(t),'Resolvido por':resolver(t),'Custo':cost(t),'Fornecedor':supplier(t),'Peça/Tipo':part(t),'Resolvido em':t.resolved_at||'','Tempo até resolver':timeToResolve(t),'Descrição':t.description||'','Resolução':t.resolution_note||t.solution||''}})}
  function download(name,type,content){var blob=new Blob([content],{type:type});var a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;document.body.appendChild(a);a.click();setTimeout(function(){URL.revokeObjectURL(a.href);a.remove()},500)}
  function patchDrawerReturnToConsulta(){
    try{
      if(window.__gfOcDrawerReturnV48)return;
      window.__gfOcDrawerReturnV48=true;
      var old=window.closeDrawer;
      if(typeof old!=='function')return;
      window.closeDrawer=function(){
        var r=old.apply(this,arguments);
        try{ if(window.gfRestoreOperationConsultaContext) window.gfRestoreOperationConsultaContext(); }catch(e){}
        return r;
      };
    }catch(e){}
  }
  patchDrawerReturnToConsulta();

  (function gfOcModalClickShield(){
    try{
      if(window.__gfOcModalClickShieldV2)return;
      window.__gfOcModalClickShieldV2=true;
      document.addEventListener('click',function(ev){
        var t=ev.target;
        if(!t || !t.closest)return;
        var close=t.closest('#gfOcClose');
        var bg=t.closest('#gfOcModalBg');
        if(close || bg){
          ev.preventDefault();
          ev.stopPropagation();
          if(ev.stopImmediatePropagation)ev.stopImmediatePropagation();
          try{closeModal();}catch(_e){}
          return false;
        }
        // IMPORTANTE: não bloquear clique dentro do modal na fase de captura.
        // Antes isso impedia abrir INTERNET/REQUISIÇÃO e os botões "Ver detalhes".
        // O bloqueio de vazamento para botões atrás fica no overlay e no bubble abaixo.
      },true);
      document.addEventListener('click',function(ev){
        var t=ev.target;
        if(!t || !t.closest)return;
        if(t.closest('#gfOcModal') || t.closest('#gfOcKpiFloatPanel')){
          ev.stopPropagation();
        }
      },false);
    }catch(e){}
  })();

  function exportData(type){var data=exportRows(),keys=Object.keys(data[0]||{'Sem dados':''});if(type==='csv'){var csv=keys.join(';')+'\n'+data.map(function(r){return keys.map(function(k){return '"'+String(r[k]??'').replace(/"/g,'""')+'"'}).join(';')}).join('\n');download('operacao-consulta.csv','text/csv;charset=utf-8','\ufeff'+csv);return}if(type==='excel'){var html='<table><thead><tr>'+keys.map(function(k){return '<th>'+esc(k)+'</th>'}).join('')+'</tr></thead><tbody>'+data.map(function(r){return '<tr>'+keys.map(function(k){return '<td>'+esc(r[k])+'</td>'}).join('')+'</tr>'}).join('')+'</tbody></table>';download('operacao-consulta.xls','application/vnd.ms-excel;charset=utf-8','\ufeff'+html);return}var w=window.open('','_blank');if(!w)return;w.document.write('<html><head><title>Operação - Consulta</title><style>body{font-family:Arial;padding:20px}table{width:100%;border-collapse:collapse}td,th{border:1px solid #ddd;padding:6px;font-size:12px}th{background:#f1f5f9}</style></head><body><h2>Central de Consulta Operacional</h2><p>'+new Date().toLocaleString('pt-BR')+'</p><table><thead><tr>'+keys.map(function(k){return '<th>'+esc(k)+'</th>'}).join('')+'</tr></thead><tbody>'+data.map(function(r){return '<tr>'+keys.map(function(k){return '<td>'+esc(r[k])+'</td>'}).join('')+'</tr>'}).join('')+'</tbody></table><script>window.print()<\/script></body></html>');w.document.close()}

  (function(){
    if(document.getElementById('gfOperationConsultaCssV43'))return;
    var st=document.createElement('style');
    st.id='gfOperationConsultaCssV43';
    st.textContent=`
      #gfOcModal{max-width:min(980px,calc(100vw - 26px))!important;width:min(980px,calc(100vw - 26px))!important;max-height:calc(100dvh - 36px)!important;overflow:hidden!important;border-radius:24px!important}
      #gfOcModalBody{max-height:calc(100dvh - 125px)!important;overflow:auto!important;padding:14px 16px 18px!important;background:#f4f8ff!important}
      .gfOcTraceCompact{grid-template-columns:repeat(auto-fit,minmax(135px,1fr))!important;gap:10px!important;margin-bottom:10px!important}
      .gfOcTraceCompact .gfOcTraceBox{background:#fff!important;border:1px solid #dbe7f6!important;border-radius:16px!important;padding:12px!important;box-shadow:0 8px 20px rgba(15,23,42,.05)!important}
      .gfOcTicketList{display:grid!important;grid-template-columns:1fr!important;gap:12px!important}
      .gfOcTicketCard{background:#fff!important;border:1px solid #d8e6f7!important;border-radius:20px!important;padding:14px!important;box-shadow:0 10px 24px rgba(15,23,42,.06)!important;cursor:pointer!important}
      .gfOcTicketCard:hover{transform:translateY(-1px);box-shadow:0 14px 30px rgba(15,23,42,.09)!important}
      .gfOcTicketTop{display:flex!important;align-items:flex-start!important;justify-content:space-between!important;gap:12px!important;margin-bottom:12px!important}
      .gfOcTicketNo{font-size:13px!important;font-weight:900!important;color:#2563eb!important;margin-bottom:3px!important}
      .gfOcTicketTitle{font-size:16px!important;font-weight:1000!important;color:#0f172a!important;line-height:1.2!important}
      .gfOcMetaGrid{display:grid!important;grid-template-columns:repeat(4,minmax(0,1fr))!important;gap:8px!important;margin-bottom:10px!important}
      .gfOcMeta{background:#f8fbff!important;border:1px solid #e5eefb!important;border-radius:14px!important;padding:9px 10px!important;min-width:0!important}
      .gfOcMeta.wide{grid-column:span 2!important}
      .gfOcMeta small{display:block!important;color:#64748b!important;font-size:11px!important;font-weight:900!important;margin-bottom:3px!important;text-transform:uppercase!important;letter-spacing:.02em!important}
      .gfOcMeta b{display:block!important;color:#0f172a!important;font-size:13px!important;font-weight:1000!important;line-height:1.2!important;overflow-wrap:anywhere!important}
      .gfOcTinyLine{font-size:12px!important;font-weight:800!important;color:#64748b!important;background:#f8fafc!important;border:1px dashed #d8e6f7!important;border-radius:12px!important;padding:8px 10px!important;margin:8px 0!important}
      .gfOcTextBlock{background:#f8fbff!important;border:1px solid #dbe7f6!important;border-radius:15px!important;padding:10px 12px!important;margin-top:8px!important}
      .gfOcTextBlock small{display:block!important;font-size:11px!important;font-weight:1000!important;color:#2563eb!important;text-transform:uppercase!important;margin-bottom:5px!important}
      .gfOcTextBlock p{margin:0!important;color:#1e293b!important;font-size:14px!important;font-weight:800!important;line-height:1.35!important;white-space:pre-wrap!important;overflow-wrap:anywhere!important}
      .gfOcConclusionBlock{background:linear-gradient(135deg,#ecfdf5,#f0fdf4)!important;border-color:#bbf7d0!important}
      .gfOcConclusionBlock small{color:#15803d!important}
      .gfOcInfo{border-radius:15px!important;background:#eef6ff!important;border:1px solid #d8e6f7!important;color:#1e3a5f!important}
      .gfOcTableWrap,.gfOcTable{display:none!important}
      @media(max-width:760px){
        #gfOcModal{width:calc(100vw - 14px)!important;max-width:calc(100vw - 14px)!important;border-radius:18px!important;max-height:calc(100dvh - 14px)!important}
        #gfOcModalBody{max-height:calc(100dvh - 92px)!important;padding:10px!important}
        .gfOcTicketCard{padding:12px!important;border-radius:17px!important}
        .gfOcTicketTop{align-items:flex-start!important}
        .gfOcTicketTitle{font-size:14px!important}
        .gfOcMetaGrid{grid-template-columns:1fr 1fr!important;gap:7px!important}
        .gfOcMeta.wide{grid-column:span 2!important}
        .gfOcMeta{padding:8px!important}
        .gfOcTextBlock p{font-size:13px!important}
        .gfOcTraceCompact{grid-template-columns:1fr 1fr!important}
      }
      @media(max-width:420px){.gfOcMetaGrid{grid-template-columns:1fr!important}.gfOcMeta.wide{grid-column:span 1!important}.gfOcTraceCompact{grid-template-columns:1fr!important}}
    `;
    document.head.appendChild(st);
  })();

  (function(){
    if(document.getElementById('gfOperationConsultaCssV44'))return;
    var st=document.createElement('style');
    st.id='gfOperationConsultaCssV44';
    st.textContent=`
      #gfOcModal{max-width:min(1120px,calc(100vw - 24px))!important;width:min(1120px,calc(100vw - 24px))!important}
      #gfOcModalBody{padding:16px 18px 20px!important}
      .gfOcTicketCard{padding:16px!important;border-radius:22px!important}
      .gfOcTicketTop{margin-bottom:10px!important;align-items:center!important}
      .gfOcTicketTitle{font-size:16px!important;line-height:1.25!important;word-break:normal!important;overflow-wrap:normal!important}
      .gfOcMetaGrid{display:grid!important;grid-template-columns:repeat(auto-fit,minmax(230px,1fr))!important;gap:10px!important;align-items:stretch!important;margin-bottom:10px!important}
      .gfOcMeta{display:flex!important;align-items:center!important;gap:12px!important;min-height:46px!important;padding:10px 12px!important;border-radius:15px!important;box-sizing:border-box!important;overflow:hidden!important}
      .gfOcMeta.wide{grid-column:auto!important}
      .gfOcMeta small{flex:0 0 auto!important;margin:0!important;min-width:86px!important;font-size:10.5px!important;line-height:1!important;white-space:nowrap!important;color:#64748b!important}
      .gfOcMeta b{flex:1 1 auto!important;min-width:0!important;font-size:14px!important;line-height:1.18!important;word-break:normal!important;overflow-wrap:break-word!important;hyphens:none!important;color:#0f172a!important}
      .gfOcTextBlock{padding:11px 13px!important;border-radius:16px!important}
      .gfOcTextBlock p{font-size:14px!important;line-height:1.35!important;word-break:normal!important;overflow-wrap:break-word!important}
      .gfOcInfo{padding:12px 14px!important;line-height:1.35!important}
      @media(max-width:820px){
        #gfOcModal{width:calc(100vw - 12px)!important;max-width:calc(100vw - 12px)!important;border-radius:18px!important}
        #gfOcModalBody{padding:10px!important;max-height:calc(100dvh - 90px)!important}
        .gfOcTicketCard{padding:12px!important;border-radius:18px!important}
        .gfOcMetaGrid{grid-template-columns:1fr!important;gap:8px!important}
        .gfOcMeta{min-height:auto!important;padding:10px!important;align-items:flex-start!important}
        .gfOcMeta small{min-width:92px!important;font-size:10px!important;padding-top:2px!important}
        .gfOcMeta b{font-size:13.5px!important;line-height:1.22!important}
        .gfOcTicketTop{align-items:flex-start!important}
      }
      @media(max-width:420px){
        .gfOcMeta{display:block!important}
        .gfOcMeta small{display:block!important;min-width:0!important;margin-bottom:4px!important;white-space:normal!important}
        .gfOcMeta b{display:block!important;font-size:13.5px!important}
      }
    `;
    document.head.appendChild(st);
  })();

  (function(){
    if(document.getElementById('gfOperationConsultaCssV46'))return;
    var st=document.createElement('style');
    st.id='gfOperationConsultaCssV46';
    st.textContent=`
      .gfOcLatestPanel{border-top:5px solid #22c55e!important;background:linear-gradient(180deg,#ffffff,#f7fcff)!important}
      .gfOcLatestGrid{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:10px!important}
      .gfOcConclusionItem{border:1px solid #dbe8f6!important;background:linear-gradient(180deg,#ffffff,#f8fbff)!important;border-radius:18px!important;padding:12px 14px!important;box-shadow:0 8px 18px rgba(15,70,140,.06)!important;cursor:pointer!important;min-width:0!important}
      .gfOcConclusionItem:hover{border-color:#93c5fd!important;box-shadow:0 12px 26px rgba(37,99,235,.12)!important;transform:translateY(-1px)!important}
      .gfOcConclusionTop{display:flex!important;align-items:center!important;justify-content:space-between!important;gap:10px!important;margin-bottom:7px!important}
      .gfOcConclusionTop b{font-size:13px!important;color:#0f2547!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important;min-width:0!important}
      .gfOcConclusionItem p{margin:0 0 7px!important;color:#17233b!important;font-weight:900!important;line-height:1.32!important;font-size:14px!important;word-break:normal!important;overflow-wrap:break-word!important}
      .gfOcConclusionItem small{display:block!important;color:#64748b!important;font-weight:850!important;line-height:1.25!important}
      .gfOcGrid{align-items:start!important}.gfOcPanel{overflow:hidden!important}.gfOcAnswerGrid{gap:11px!important}.gfOcInsight{min-height:0!important;padding:12px!important}.gfOcInsight b{font-size:15px!important}.gfOcInsight span{font-size:12px!important}
      .gfOcCtxRow{grid-template-columns:minmax(0,1.35fr) minmax(0,1fr) auto!important}.gfOcCtxRow .ctxMain b{font-size:15px!important}.gfOcCtxRow .ctxStats{font-size:11.5px!important}.gfOcCtxRow .ctxStat{padding:4px 7px!important}
      @media(max-width:900px){.gfOcLatestGrid{grid-template-columns:1fr!important}.gfOcGrid{grid-template-columns:1fr!important}.gfOcCtxRow{grid-template-columns:1fr!important}.gfOcCtxRow .ctxStats{justify-content:flex-start!important}}
      @media(max-width:520px){.gfOcLatestPanel,.gfOcPanel{border-radius:18px!important;padding:11px!important}.gfOcConclusionItem{border-radius:15px!important;padding:10px!important}.gfOcConclusionTop{align-items:flex-start!important}.gfOcConclusionTop b{white-space:normal!important}.gfOcConclusionItem p{font-size:13px!important}.gfOcTitle h3{font-size:16px!important}}
    `;
    document.head.appendChild(st);
  })();

  (function(){
    if(document.getElementById('gfOperationConsultaCssV47'))return;
    var st=document.createElement('style');
    st.id='gfOperationConsultaCssV47';
    st.textContent=`
      .gfOcGrid{grid-template-columns:minmax(0,1fr) minmax(360px,.92fr)!important;align-items:stretch!important}
      .gfOcGrid>.gfOcPanel{height:100%!important;display:flex!important;flex-direction:column!important}
      .gfOcGrid>.gfOcPanel #gfOcAnswer,.gfOcGrid>.gfOcPanel #gfOcContext{flex:1!important}
      .gfOcAnswerGrid{display:grid!important;grid-template-columns:1fr 1fr!important;gap:12px!important}
      .gfOcInsight.main{grid-column:1/-1!important;background:linear-gradient(135deg,#eff6ff,#ffffff)!important;border-color:#bfdbfe!important}
      .gfOcInsight{border-radius:18px!important;border:1px solid #dbe8f6!important;background:linear-gradient(180deg,#ffffff,#f8fbff)!important;box-shadow:0 8px 18px rgba(15,70,140,.045)!important}
      .gfOcCtx{gap:10px!important;align-content:start!important}
      .gfOcCtxRow.gfOcCtxSimple{grid-template-columns:42px minmax(0,1fr) auto auto!important;padding:12px 14px!important;min-height:66px!important;border-radius:18px!important;background:linear-gradient(180deg,#fff,#f8fbff)!important;box-shadow:0 8px 18px rgba(15,70,140,.045)!important;border-left-width:5px!important}
      .gfOcCtxSimple.kind-Equipamento{border-left-color:#1677dd!important}.gfOcCtxSimple.kind-Problema{border-left-color:#f59e0b!important}.gfOcCtxSimple.kind-Setor{border-left-color:#22c55e!important}.gfOcCtxSimple.kind-Pessoa{border-left-color:#8b5cf6!important}
      .gfOcCtxSimple .ctxIcon{width:34px;height:34px;border-radius:14px;display:grid;place-items:center;background:#eef6ff;font-size:18px}
      .gfOcCtxSimple .ctxMain{min-width:0!important}.gfOcCtxSimple .ctxMain b{display:block!important;font-size:16px!important;line-height:1.15!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important;color:#14223b!important}.gfOcCtxSimple .ctxKind{display:inline-flex!important;margin-top:5px!important;border-radius:999px!important;background:#eef6ff!important;color:#1d4ed8!important;padding:4px 8px!important;font-size:11px!important;font-weight:950!important}
      .gfOcCtxSimple .ctxQty{font-weight:950!important;color:#334155!important;background:#eef2f7!important;border-radius:999px!important;padding:7px 10px!important;white-space:nowrap!important;font-size:12px!important}
      .gfOcCtxSimple .gfPill{padding:8px 11px!important}
      .gfOcSeeMore{width:100%;border:1px solid #bfdbfe;background:linear-gradient(135deg,#eff6ff,#fff);color:#0d55a8;border-radius:16px;padding:12px;font-weight:950;cursor:pointer;box-shadow:0 8px 18px rgba(15,70,140,.05)}
      .gfOcSeeMore:hover{border-color:#60a5fa;box-shadow:0 12px 24px rgba(37,99,235,.11)}

      /* Central de Consulta - padrão limpo igual referência, sem tela antiga */
      #pageOperacao.gfOpConsultaMode{background:linear-gradient(180deg,#eef6ff 0,#f8fbff 42%,#eef6ff 100%)!important;padding:18px 18px 96px!important}
      #gfOperationConsulta{width:100%!important;max-width:none!important;margin:0!important;color:#081b3f!important;font-family:inherit!important;box-sizing:border-box!important}
      #gfOperationConsulta .gfOcHeader{display:grid!important;grid-template-columns:150px minmax(0,1fr) auto!important;align-items:center!important;gap:20px!important;background:#fff!important;border:1px solid #dbe7f6!important;border-radius:26px!important;box-shadow:0 14px 34px rgba(28,55,100,.08)!important;padding:22px 24px!important;margin:0 0 16px!important;box-sizing:border-box!important;width:100%!important}
      #gfOperationConsulta .gfOcLogoBox{width:142px;height:66px;display:flex!important;align-items:center!important;justify-content:flex-start!important;color:#ef4444!important;font-weight:1000!important;line-height:1!important}
      #gfOperationConsulta .gfOcLogoBox img{max-width:134px!important;max-height:62px!important;object-fit:contain!important;display:block!important}
      #gfOperationConsulta .gfOcLogoBox b{font-size:25px!important;color:#ef4444!important;display:block!important}.gfOcLogoBox small{display:block!important;color:#64748b!important;font-size:10px!important;font-weight:900!important;letter-spacing:.04em!important}
      #gfOperationConsulta .gfOcHeaderText h2{font-size:28px!important;line-height:1.08!important;margin:0 0 4px!important;font-weight:950!important;letter-spacing:-.03em!important;color:#08245a!important}
      #gfOperationConsulta .gfOcHeaderText p{font-size:15px!important;line-height:1.28!important;margin:0!important;color:#475569!important;font-weight:800!important;max-width:580px!important}
      #gfOperationConsulta .gfOcClosePage{height:52px!important;padding:0 18px!important;border:1px solid #dbe7f6!important;border-radius:18px!important;background:#fff!important;color:#08245a!important;font-size:20px!important;font-weight:950!important;display:inline-flex!important;align-items:center!important;gap:8px!important;box-shadow:0 10px 26px rgba(15,23,42,.07)!important;cursor:pointer!important}
      #gfOperationConsulta .gfOcClosePage span{font-size:14px!important;font-weight:950!important}
      #gfOperationConsulta .gfOcSearchBox{border-radius:26px!important;padding:20px!important;margin-bottom:16px!important;background:rgba(255,255,255,.96)!important;border:1px solid #dbe7f6!important;box-shadow:0 14px 34px rgba(28,55,100,.08)!important;box-sizing:border-box!important;width:100%!important;overflow:visible!important}
      #gfOperationConsulta .gfOcSearch{height:52px!important;border-radius:17px!important;border:1px solid #d4e3f5!important;background:#fff!important;font-size:16px!important;font-weight:850!important;padding:0 16px!important;margin-bottom:14px!important}
      #gfOperationConsulta .gfOcFilters{display:grid!important;grid-template-columns:1fr!important;gap:14px!important;margin:0!important}
      #gfOperationConsulta .gfOcPeriodCard{background:transparent!important;border:0!important;box-shadow:none!important;padding:0!important;margin:0!important}
      #gfOperationConsulta .gfOcSectionHead{display:flex!important;align-items:center!important;gap:14px!important;margin:0 0 14px!important}
      #gfOperationConsulta .gfOcSectionIcon,.gfOcKpi:after{width:52px!important;height:52px!important;border-radius:17px!important;background:#edf6ff!important;color:#0b73df!important;display:grid!important;place-items:center!important;font-size:25px!important;flex:0 0 auto!important}
      #gfOperationConsulta .gfOcSectionHead h3{font-size:24px!important;color:#0b2454!important;margin:0 0 4px!important;line-height:1.1!important;font-weight:950!important}.gfOcSectionHead p{font-size:14px!important;margin:0!important;color:#66758b!important;font-weight:850!important}
      #gfOperationConsulta .gfOcPeriodBtns{display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:12px!important;width:100%!important;align-items:stretch!important}
      #gfOperationConsulta .gfOcPeriodBtns .gfOcBtn{height:58px!important;min-height:58px!important;border-radius:14px!important;font-size:15px!important;display:flex!important;align-items:center!important;justify-content:center!important;gap:8px!important;padding:0 12px!important;box-shadow:0 5px 14px rgba(15,35,66,.035)!important}
      #gfOperationConsulta .gfOcPeriodBtns .gfOcBtn.active{background:#0878db!important;color:#fff!important;border-color:#0878db!important;box-shadow:0 12px 26px rgba(8,120,219,.20)!important}
      #gfOperationConsulta .gfOcDateRow{display:none!important;grid-template-columns:1fr 1fr!important;gap:10px!important;margin-top:12px!important}.gfOcCustom .gfOcDateRow{display:grid!important}.gfOcCustom .gfOcDate{display:block!important}
      #gfOperationConsulta .gfOcFilterRows{display:grid!important;gap:10px!important;background:transparent!important;width:100%!important}.gfOcSelectRow{height:62px!important;border:1px solid #dbe7f6!important;background:#fff!important;border-radius:16px!important;display:grid!important;grid-template-columns:48px 180px minmax(0,1fr) 22px!important;align-items:center!important;gap:12px!important;padding:0 14px!important;box-shadow:0 6px 16px rgba(15,35,66,.035)!important;position:relative!important;box-sizing:border-box!important;width:100%!important;overflow:hidden!important}.gfOcSelectRow:after{content:'⌄'!important;color:#334155!important;font-size:22px!important;font-weight:900!important}.gfOcRowIcon{width:42px!important;height:42px!important;border-radius:999px!important;background:#edf6ff!important;display:grid!important;place-items:center!important;color:#0b73df!important;font-size:18px!important}.gfOcSelectRow b{font-size:16px!important;color:#0b2454!important;font-weight:950!important}.gfOcSelectRow select{height:100%!important;min-height:0!important;width:100%!important;border:0!important;background:transparent!important;box-shadow:none!important;color:#64748b!important;font-size:15px!important;font-weight:800!important;padding:0!important;appearance:none!important;outline:none!important}.gfOcActionRow{display:grid!important;grid-template-columns:2fr .62fr .72fr .62fr!important;gap:10px!important;margin-top:12px!important;width:100%!important;align-items:stretch!important}.gfOcActionRow .gfOcBtn{height:52px!important;min-height:52px!important;border-radius:14px!important;display:flex!important;align-items:center!important;justify-content:center!important;gap:8px!important;font-size:14px!important;background:#fff!important}.gfOcActionRow .gfOcClearBtn{justify-content:center!important}
      #gfOperationConsulta .gfOcKpis{grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:14px!important;margin:16px 0!important}.gfOcKpi{cursor:pointer!important;user-select:none!important;min-height:106px!important;border-radius:20px!important;padding:18px 18px 16px 88px!important;background:#fff!important;border:1px solid #dbe7f6!important;box-shadow:0 12px 28px rgba(28,55,100,.075)!important;position:relative!important}.gfOcKpi:before{display:none!important}.gfOcKpi:after{content:'📄'!important;position:absolute!important;left:18px!important;top:22px!important}.gfOcKpi.kOrange:after{content:'!'!important;background:#fff7e6!important;color:#f59e0b!important;font-size:28px!important}.gfOcKpi.kGreen:after{content:'✓'!important;background:#dcfce7!important;color:#16a34a!important;font-size:28px!important}.gfOcKpi.kPurple:after{content:'$'!important;background:#f3e8ff!important;color:#8b5cf6!important;font-size:28px!important}.gfOcKpi.kRed:after{content:'⚠'!important;background:#fee2e2!important;color:#ef4444!important;font-size:25px!important}.gfOcKpi small{font-size:14px!important;color:#6b7b94!important;font-weight:900!important}.gfOcKpi b{font-size:28px!important;margin:4px 0!important;color:#08245a!important;line-height:1!important}.gfOcKpi em{font-size:13px!important;color:#6b7b94!important;font-weight:800!important}
      #gfOperationConsulta .gfOcKpi.active{outline:3px solid rgba(8,120,219,.22)!important;box-shadow:0 16px 34px rgba(8,120,219,.15)!important}#gfOperationConsulta .gfOcKpiResult{background:#fff!important;border:1px solid #dbe7f6!important;border-radius:22px!important;box-shadow:0 12px 28px rgba(28,55,100,.075)!important;padding:16px!important;margin:0 0 16px!important}#gfOperationConsulta .gfOcGrid{grid-template-columns:1fr!important;gap:14px!important}.gfOcPanel{border-radius:22px!important;padding:18px!important;background:#fff!important;border:1px solid #dbe7f6!important;box-shadow:0 12px 28px rgba(28,55,100,.075)!important}.gfOcTitle h3{font-size:20px!important;color:#0b2454!important}.gfOcTitle small{font-size:13px!important}

      @media(max-width:720px){
        #pageOperacao.gfOpConsultaMode{display:block!important;padding:12px 10px 104px!important;background:linear-gradient(180deg,#eef6ff 0,#f8fbff 42%,#eef6ff 100%)!important;overflow-x:hidden!important}
        #gfOperationConsulta{max-width:none!important;width:100%!important}
        #gfOperationConsulta .gfOcHeader{grid-template-columns:136px 1fr auto!important;gap:10px!important;padding:10px 2px 18px!important;align-items:center!important}
        #gfOperationConsulta .gfOcLogoBox{width:130px!important;height:58px!important}.gfOcLogoBox img{max-width:126px!important;max-height:56px!important}
        #gfOperationConsulta .gfOcHeaderText h2{font-size:22px!important;line-height:1.12!important;margin-bottom:3px!important}
        #gfOperationConsulta .gfOcHeaderText p{font-size:13px!important;line-height:1.28!important;max-width:330px!important}
        #gfOperationConsulta .gfOcClosePage{height:50px!important;border-radius:16px!important;padding:0 13px!important;font-size:20px!important}.gfOcClosePage span{font-size:13px!important}
        #gfOperationConsulta .gfOcSearchBox{border-radius:22px!important;padding:16px!important;margin-bottom:14px!important}
        #gfOperationConsulta .gfOcSearch{height:50px!important;font-size:16px!important;margin-bottom:14px!important}
        #gfOperationConsulta .gfOcSectionIcon{width:48px!important;height:48px!important;border-radius:16px!important;font-size:22px!important}.gfOcSectionHead h3{font-size:21px!important}.gfOcSectionHead p{font-size:13px!important}
        #gfOperationConsulta .gfOcPeriodBtns{grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:10px!important}.gfOcPeriodBtns .gfOcBtn{height:56px!important;min-height:56px!important;font-size:14px!important}.gfOcPeriodBtns .gfOcBtn:nth-child(7),.gfOcPeriodBtns .gfOcBtn:nth-child(8){grid-column:auto!important}
        #gfOperationConsulta .gfOcSelectRow{height:auto!important;min-height:58px!important;grid-template-columns:40px minmax(96px,128px) minmax(0,1fr) 18px!important;padding:0 10px!important;gap:8px!important}.gfOcRowIcon{width:38px!important;height:38px!important}.gfOcSelectRow b{font-size:15px!important}.gfOcSelectRow select{font-size:14px!important}
        #gfOperationConsulta .gfOcActionRow{grid-template-columns:1fr 1fr!important;gap:8px!important}.gfOcActionRow .gfOcBtn{height:50px!important;min-height:50px!important;font-size:13px!important}
        #gfOperationConsulta .gfOcKpis{grid-template-columns:repeat(2,1fr)!important;gap:10px!important}.gfOcKpi{min-height:100px!important;padding:14px 12px 13px 76px!important;border-radius:18px!important}.gfOcKpi:after{left:14px!important;top:20px!important;width:48px!important;height:48px!important}.gfOcKpi small{font-size:13px!important}.gfOcKpi b{font-size:25px!important}.gfOcKpi em{font-size:12px!important}
        #gfOperationConsulta .gfOcPanel{border-radius:20px!important;padding:16px!important}.gfOcTitle h3{font-size:18px!important}
      }
      @media(max-width:1100px){.gfOcGrid{grid-template-columns:1fr!important}.gfOcGrid>.gfOcPanel{height:auto!important}.gfOcAnswerGrid{grid-template-columns:1fr 1fr!important}}
      @media(max-width:720px){.gfOcAnswerGrid{grid-template-columns:1fr!important}.gfOcCtxRow.gfOcCtxSimple{grid-template-columns:36px minmax(0,1fr) auto!important}.gfOcCtxSimple .gfPill{grid-column:1/-1;justify-content:center}.gfOcCtxSimple .ctxQty{font-size:11px!important;padding:6px 8px!important}.gfOcCtxSimple .ctxMain b{white-space:normal!important}.gfOcHeader h2{font-size:22px!important}}
    `;
    document.head.appendChild(st);
  })();

  if(!window.__gfOcKpiCaptureFixed){
    window.__gfOcKpiCaptureFixed=true;
    document.addEventListener('click',function(ev){
      var card=ev.target&&ev.target.closest&&ev.target.closest('#gfOperationConsulta .gfOcKpi[data-kpi]');
      if(!card)return;
      ev.preventDefault();
      ev.stopImmediatePropagation();
      if(typeof window.gfOcOpenKpi==='function')window.gfOcOpenKpi(card.getAttribute('data-kpi'));
    },true);
  }
  function openConsultaPage(){ ensureBox(); render(); }
  window.gfRenderOperationConsulta=render;
  window.gfOpenOperationConsulta=openConsultaPage;
  window.openOperationConsulta=openConsultaPage;
  window.openConsultaOperacao=openConsultaPage;
  window.openConsulta=window.openConsulta || openConsultaPage;
})();

(function(){
  if(window.__GF_OC_V48_STYLE__)return;
  window.__GF_OC_V48_STYLE__=true;
  var st=document.createElement('style');
  st.textContent=`
    .gfOcTicketActions{display:flex!important;align-items:flex-end!important;gap:8px!important;flex-direction:column!important;min-width:145px!important}
    .gfOcOpenHint{font-size:11px!important;font-weight:1000!important;color:#2563eb!important;background:#eff6ff!important;border:1px solid #bfdbfe!important;border-radius:999px!important;padding:5px 9px!important;white-space:nowrap!important}
    .gfOcTicketCard:hover .gfOcOpenHint{background:#dbeafe!important;color:#1d4ed8!important}
    @media(max-width:720px){.gfOcTicketActions{align-items:flex-start!important;min-width:0!important}.gfOcOpenHint{font-size:10px!important}}
  `;
  document.head.appendChild(st);
})();

  (function(){
    if(document.getElementById('gfOperationConsultaCssV49'))return;
    var st=document.createElement('style');
    st.id='gfOperationConsultaCssV49';
    st.textContent=`
      #gfOcModal{
        top:calc(50% + 34px)!important;
        max-height:calc(100dvh - 118px)!important;
        border-radius:24px!important;
        box-shadow:0 28px 90px rgba(15,23,42,.38)!important;
      }
      .gfOcModalHead{
        position:relative!important;
        z-index:4!important;
        background:linear-gradient(180deg,#ffffff,#f8fbff)!important;
        border-bottom:1px solid #dbe8f6!important;
        box-shadow:0 10px 22px rgba(15,23,42,.06)!important;
        padding:16px 20px!important;
      }
      .gfOcModalHead h3{font-size:18px!important;font-weight:1000!important;color:#0f2547!important;line-height:1.2!important}
      #gfOcModalBody{
        max-height:calc(100dvh - 190px)!important;
        padding:26px 18px 22px!important;
        scroll-padding-top:28px!important;
      }
      .gfOcTicketCard{margin-top:0!important;padding:18px!important;border-radius:22px!important}
      .gfOcTicketCard + .gfOcTicketCard{margin-top:4px!important}
      .gfOcTicketTop{padding-bottom:2px!important;margin-bottom:14px!important}
      .gfOcTicketActions{display:flex!important;align-items:center!important;gap:8px!important;flex-wrap:wrap!important;justify-content:flex-end!important}
      .gfOcOpenHint{
        display:inline-flex!important;align-items:center!important;justify-content:center!important;
        border:1px solid #bfdbfe!important;background:#eff6ff!important;color:#1d4ed8!important;
        border-radius:999px!important;padding:6px 10px!important;font-size:12px!important;font-weight:1000!important;
        white-space:nowrap!important;box-shadow:0 6px 14px rgba(37,99,235,.08)!important
      }
      .gfOcTicketNo{margin-bottom:5px!important}
      .gfOcTicketTitle{letter-spacing:.01em!important}
      .gfOcMetaGrid{margin-top:4px!important;margin-bottom:14px!important}
      .gfOcMeta{background:linear-gradient(180deg,#f8fbff,#f3f8ff)!important;border-color:#dbe8f6!important}
      .gfOcTextBlock{margin-top:10px!important;background:linear-gradient(180deg,#f8fbff,#f4f9ff)!important}
      .gfOcTextBlock small{margin-bottom:7px!important}
      .gfOcTextBlock p{font-size:14.5px!important;line-height:1.42!important}
      .gfPill.ok{background:#dcfce7!important;color:#15803d!important;border-color:#bbf7d0!important}
      .gfPill.warn{background:#fff7ed!important;color:#c2410c!important;border-color:#fed7aa!important}
      .gfPill.blue{background:#eff6ff!important;color:#1d4ed8!important;border-color:#bfdbfe!important}
      @media(max-width:820px){
        #gfOcModal{top:calc(50% + 28px)!important;max-height:calc(100dvh - 94px)!important;width:calc(100vw - 12px)!important;max-width:calc(100vw - 12px)!important}
        .gfOcModalHead{padding:12px 14px!important}
        .gfOcModalHead h3{font-size:15px!important}
        #gfOcModalBody{max-height:calc(100dvh - 150px)!important;padding:20px 10px 14px!important}
        .gfOcTicketCard{padding:13px!important}
        .gfOcTicketActions{justify-content:flex-start!important;margin-top:6px!important}
        .gfOcOpenHint{font-size:11.5px!important;padding:6px 9px!important}
      }
    `;
    document.head.appendChild(st);
  })();

(function(){
  if(window.__GF_OC_V50_REAL__)return;
  window.__GF_OC_V50_REAL__=true;
  function replaceTextNode(el,from,to){
    if(!el)return;
    try{
      Array.prototype.forEach.call(el.childNodes,function(n){
        if(n.nodeType===3 && String(n.nodeValue).indexOf(from)>=0)n.nodeValue=String(n.nodeValue).replace(new RegExp(from,'g'),to);
      });
      if(String(el.textContent||'').trim()===from)el.textContent=to;
      if(el.innerHTML && /Operação/.test(el.innerHTML) && /tab|btn|nav/i.test(el.id||el.className||'')) el.innerHTML=el.innerHTML.replace(/Operação/g,'Consulta');
    }catch(e){}
  }
  function applyConsultaLabel(){
    ['tabOperacao','btnOperacao','navOperacao'].forEach(function(id){replaceTextNode(document.getElementById(id),'Operação','Consulta')});
    try{
      document.querySelectorAll('button,a,.tab,[data-page="operacao"],[onclick*="operacao"]').forEach(function(el){
        var t=String(el.textContent||'').trim();
        if(t==='Operação')el.textContent='Consulta';
        else if(t.indexOf('Operação')>=0 && t.length<30) replaceTextNode(el,'Operação','Consulta');
      });
    }catch(e){}
  }
  function removeConsultaWarnings(){
    try{
      document.querySelectorAll('.gfOcInfo').forEach(function(el){
        var t=String(el.textContent||'');
        if(t.indexOf('Origem: chamados')>=0 || t.indexOf('Visual direto:')>=0) el.remove();
      });
    }catch(e){}
  }
  function tick(){applyConsultaLabel();removeConsultaWarnings();}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',function(){setTimeout(tick,50);setTimeout(tick,500)});
  else {setTimeout(tick,50);setTimeout(tick,500)}
  setTimeout(tick,500);
})();

(function gfDeptPrefixStyle(){
  if(document.getElementById('gfDeptPrefixStyle')) return;
  const st=document.createElement('style');
  st.id='gfDeptPrefixStyle';
  st.textContent='.gfDeptPrefix{display:inline-flex;align-items:center;gap:4px;margin-right:2px;font-weight:900;white-space:nowrap}.v9DashTitle b{display:flex;align-items:center;gap:6px;flex-wrap:wrap}.v9DashTitle{min-width:0}.v9DashTitle b{min-width:0}.v9DashTitle .gfDeptPrefix+span{white-space:nowrap}@media(max-width:720px){.v9DashTitle b{font-size:14px;line-height:1.25}}';
  document.head.appendChild(st);
})();

;
(function(){
  'use strict';
  if(window.__gfResolveOnlyResolvedPatch) return;
  window.__gfResolveOnlyResolvedPatch = true;

  function closestOption(input){
    return input.closest('label,.resolveOption,.outcomeOption,.choiceCard,.radioCard,.formCard,.card') || input.parentElement;
  }

  function cleanResolveModal(){
    var bg = document.getElementById('resolveBg') || document.querySelector('.resolveBg');
    var root = bg || document;
    var inputs = root.querySelectorAll('input[name="resolveOutcome"]');
    inputs.forEach(function(inp){
      var val = String(inp.value || '').toUpperCase();
      if(val && val !== 'RESOLVED'){
        var opt = closestOption(inp);
        if(opt) opt.remove();
        else inp.remove();
      }else{
        inp.checked = true;
        inp.value = 'RESOLVED';
      }
    });

    root.querySelectorAll('small,p,div,span').forEach(function(el){
      if(!el || !el.textContent) return;
      var txt = el.textContent.toUpperCase();
      if(
        txt.includes('SEM REPARO') ||
        txt.includes('ENCAMINHADO PARA TROCA') ||
        txt.includes('ENCAMINHADO PARA') ||
        txt.includes('BAIXADO PATRIM') ||
        txt.includes('AGUARDANDO TROCA') ||
        txt.includes('NÃO TEM CONSERTO') ||
        txt.includes('NAO TEM CONSERTO')
      ){
        var hasInput = el.querySelector && el.querySelector('input[name="resolveOutcome"]');
        if(!hasInput && !txt.includes('RESOLVIDO')){
          el.remove();
        }
      }
    });

    var resolved = root.querySelector('input[name="resolveOutcome"][value="RESOLVED"]');
    if(resolved){
      var card = closestOption(resolved);
      if(card){
        card.style.width='100%';
        card.style.gridColumn='1 / -1';
        card.style.display='block';
      }
      var wrap = card && card.parentElement;
      if(wrap){
        wrap.style.gridTemplateColumns='1fr';
      }
    }
  }

  window.gfCleanResolveModalFinal = cleanResolveModal;

  var oldConfirm = window.confirmResolveTicket;
  if(typeof oldConfirm === 'function'){
    window.confirmResolveTicket = function(){
      var resolved = document.querySelector('input[name="resolveOutcome"][value="RESOLVED"]');
      if(resolved) resolved.checked = true;
      cleanResolveModal();
      return oldConfirm.apply(this, arguments);
    };
    try{ confirmResolveTicket = window.confirmResolveTicket; }catch(e){}
  }

  document.addEventListener('DOMContentLoaded', function(){
    cleanResolveModal();
    setTimeout(cleanResolveModal, 300);
    setTimeout(cleanResolveModal, 1200);
  });
})();

;
(function(){
  'use strict';
  if(window.__gfRemoveOldSwapHintSafe) return;
  window.__gfRemoveOldSwapHintSafe = true;

  function removeOldSwapHint(){
    try{
      var root = document.getElementById('resolveBg') || document;
      var els = root.querySelectorAll('small,p,div,span');
      els.forEach(function(el){
        var txt = String(el.innerText || el.textContent || '').replace(/\s+/g,' ').trim();
        if(!txt) return;
        var up = txt.toUpperCase();

        var isOldHint =
          up.indexOf('ENCAMINHADO PARA TROCA') >= 0 ||
          up.indexOf('AGUARDANDO TROCA') >= 0 ||
          (up.indexOf('SERÁ SALVO NO HISTÓRICO') >= 0 && up.indexOf('RESOLVIDO') >= 0 && up.indexOf('SETOR') >= 0);

        if(!isOldHint) return;

        if(el.querySelector && el.querySelector('input,textarea,select,button')) return;
        if(txt.length > 420) return;

        el.remove();
      });
    }catch(e){}
  }

  window.gfRemoveOldSwapHintFinal = removeOldSwapHint;


  document.addEventListener('DOMContentLoaded', function(){
    removeOldSwapHint();
    setTimeout(removeOldSwapHint, 500);
  });
})();

/* GF_RESOLVE_MODAL_SINGLE_WRAPPER_V4 */
(function(){
  'use strict';
  if(window.__GF_RESOLVE_MODAL_SINGLE_WRAPPER_V4__) return;
  window.__GF_RESOLVE_MODAL_SINGLE_WRAPPER_V4__ = true;
  var oldOpen = window.openResolveModal;
  if(typeof oldOpen === 'function'){
    window.openResolveModal = function(){
      var ret = oldOpen.apply(this, arguments);
      setTimeout(function(){ try{ if(window.gfCleanResolveModalFinal) window.gfCleanResolveModalFinal(); if(window.gfRemoveOldSwapHintFinal) window.gfRemoveOldSwapHintFinal(); }catch(e){} }, 0);
      setTimeout(function(){ try{ if(window.gfCleanResolveModalFinal) window.gfCleanResolveModalFinal(); if(window.gfRemoveOldSwapHintFinal) window.gfRemoveOldSwapHintFinal(); }catch(e){} }, 100);
      return ret;
    };
    try{ openResolveModal = window.openResolveModal; }catch(e){}
  }
})();

;
(function(){
  if(window.__gfAdminRatingDisplayPatch) return;
  window.__gfAdminRatingDisplayPatch = true;
  try{ ensureTicketRatingCss(); }catch(e){}

})();

(function(){
  'use strict';
  function fixMobileSettingsLabel(){
    try{
      var tab=document.getElementById('tabUsuarios');
      if(tab) tab.textContent='Configurações';
      document.querySelectorAll('.gfMobileBottomNav button[data-page="usuarios"]').forEach(function(btn){
        var spans=btn.querySelectorAll('span');
        if(spans.length>=2){spans[0].textContent='⚙'; spans[1].textContent='Config.';}
        else btn.textContent='⚙ Config.';
        btn.setAttribute('aria-label','Configurações');
        btn.title='Configurações';
      });
    }catch(e){}
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', function(){setTimeout(fixMobileSettingsLabel,50);setTimeout(fixMobileSettingsLabel,500);setTimeout(fixMobileSettingsLabel,1500);});
  else {setTimeout(fixMobileSettingsLabel,50);setTimeout(fixMobileSettingsLabel,500);setTimeout(fixMobileSettingsLabel,1500);}
  setTimeout(fixMobileSettingsLabel,500);
})();

(function(){
  'use strict';
  if(window.__gfCadastroModalPortalV221) return;
  window.__gfCadastroModalPortalV221 = true;

  var assetHome=null, assetTitleHome=null, issueHome=null, issueTitleHome=null;
  var currentKind=null;

  function byId(id){ return document.getElementById(id); }
  function page(){ return byId('pageCadastros'); }
  function isServico(){ var p=page(); return !!(p && p.classList.contains('cadastro-show-servicos')); }
  function ensureRoot(){
    var root=byId('gfCadastroModalRoot');
    if(root) return root;
    root=document.createElement('div');
    root.id='gfCadastroModalRoot';
    root.innerHTML='<div id="gfCadastroModalBox" role="dialog" aria-modal="true"></div>';
    document.body.appendChild(root);
    root.addEventListener('mousedown',function(e){ if(e.target===root) window.closeCadastroForm(); });
    return root;
  }
  function saveHomes(){
    var form=byId('cadAssetMainForm'), title=document.querySelector('#pageCadastros .cadAssetFormTitle');
    var iform=byId('cadIssueMainForm'), ititle=document.querySelector('#pageCadastros .cadIssueFormTitle');
    if(form && !assetHome) assetHome={parent:form.parentNode,next:form.nextSibling};
    if(title && !assetTitleHome) assetTitleHome={parent:title.parentNode,next:title.nextSibling};
    if(iform && !issueHome) issueHome={parent:iform.parentNode,next:iform.nextSibling};
    if(ititle && !issueTitleHome) issueTitleHome={parent:ititle.parentNode,next:ititle.nextSibling};
  }
  function putBack(node,home){
    if(!node || !home || !home.parent) return;
    try{ home.parent.insertBefore(node,home.next && home.next.parentNode===home.parent ? home.next : null); }catch(e){ home.parent.appendChild(node); }
  }
  function configureAssetModalKind(){
    var form=byId('cadAssetMainForm');
    if(!form) return;
    var svc=isServico();
    var kind=byId('assetKindSelect');
    if(kind){
      kind.value=svc?'SERVICE':'EQUIPMENT';
      kind.innerHTML=svc?'<option value="SERVICE">🧩 Serviço / categoria</option>':'<option value="EQUIPMENT">🧰 Equipamento físico</option>';
      kind.setAttribute('data-locked-kind',svc?'SERVICE':'EQUIPMENT');
      kind.setAttribute('aria-hidden','true');
      kind.tabIndex=-1;
      kind.hidden=true;
    }
    var apoio=byId('assetDeptApoio');
    var apoioBox=apoio&&apoio.closest?apoio.closest('label'):null;
    if(apoioBox){
      apoioBox.hidden=false;
      apoioBox.style.display='';
    }
    var ti=byId('assetDeptTI');
    var manut=byId('assetDeptManutencao');
    if(ti && manut && apoio && !ti.checked && !manut.checked && !apoio.checked){
      if(svc) apoio.checked=true;
      else ti.checked=true;
    }
  }

  function setTitle(kind){
    var title = kind==='issue' ? document.querySelector('.cadIssueFormTitle') : document.querySelector('.cadAssetFormTitle');
    if(!title) return;
    var text = kind==='issue' ? 'Novo tipo de problema' : (isServico() ? 'Novo serviço' : 'Novo equipamento');
    title.innerHTML='<span class="cadFormTitleText">'+text+'</span><button class="btn btnLight cadFormCloseBtn" type="button" onclick="closeCadastroForm()">Fechar</button>';
  }
  function open(kind){
    saveHomes();
    var p=page(); if(!p) return;
    currentKind=kind==='issue'?'issue':'asset';
    var root=ensureRoot();
    var box=byId('gfCadastroModalBox'); if(!box) return;
    var title=currentKind==='issue'?document.querySelector('#pageCadastros .cadIssueFormTitle'):document.querySelector('#pageCadastros .cadAssetFormTitle');
    var form=currentKind==='issue'?byId('cadIssueMainForm'):byId('cadAssetMainForm');
    if(!title || !form) return;
    setTitle(currentKind);
    if(currentKind==='asset') configureAssetModalKind();
    box.innerHTML='';
    box.appendChild(title);
    box.appendChild(form);
    root.className='show '+(currentKind==='issue'?'gf-issue-modal':(isServico()?'gf-service-modal':'gf-equipment-modal'));
    document.body.classList.add('gfCadastroModalOpen');
    p.classList.toggle('cadastro-asset-form-open',currentKind==='asset');
    p.classList.toggle('cadastro-issue-form-open',currentKind==='issue');
    setTimeout(function(){
      var focus=currentKind==='issue'?byId('issueAssetName'):(isServico()?byId('assetName'):byId('assetSector'));
      if(focus && typeof focus.focus==='function') focus.focus();
    },60);
  }
  function close(){
    var p=page();
    var root=byId('gfCadastroModalRoot');
    var titleA=document.querySelector('.cadAssetFormTitle'), formA=byId('cadAssetMainForm');
    var titleI=document.querySelector('.cadIssueFormTitle'), formI=byId('cadIssueMainForm');
    putBack(titleA,assetTitleHome); putBack(formA,assetHome);
    putBack(titleI,issueTitleHome); putBack(formI,issueHome);
    if(root){ root.className=''; var box=byId('gfCadastroModalBox'); if(box) box.innerHTML=''; }
    if(p) p.classList.remove('cadastro-asset-form-open','cadastro-issue-form-open');
    document.body.classList.remove('gfCadastroModalOpen');
    currentKind=null;
  }

  window.closeCadastroForm=close;
  window.toggleCadastroForm=function(which){
    var kind=which==='issue'?'issue':'asset';
    var p=page();
    if(p && ((kind==='asset' && p.classList.contains('cadastro-asset-form-open')) || (kind==='issue' && p.classList.contains('cadastro-issue-form-open')))) close();
    else open(kind);
  };

  function normalizeCreateButtons(){
    var p=page(); if(!p) return;
    configureAssetModalKind();
    var isProb=p.classList.contains('cadastro-show-problemas');
    var isSvc=p.classList.contains('cadastro-show-servicos');
    var actions=document.querySelector('#pageCadastros .cadastroModuleHeroActions');
    if(actions && !isProb){
      actions.innerHTML='<button class="btn btnDark" onclick="toggleCadastroForm(\'asset\')" type="button">+'+(isSvc?' Cadastrar serviço':' Cadastrar equipamento')+'</button>';
    }
    var headBtn=document.querySelector('#pageCadastros .cadProAssetPanel .cadAssetHeadNewBtn');
    if(headBtn && !isProb){
      headBtn.textContent='+'+(isSvc?' Cadastrar serviço':' Cadastrar equipamento');
      headBtn.style.display='inline-flex';
    }
    var extra=document.querySelectorAll('#pageCadastros .cadToggleFormBtn');
    extra.forEach(function(b){ b.remove(); });
  }

  document.addEventListener('keydown',function(e){ if(e.key==='Escape') close(); });
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',function(){ saveHomes(); close(); normalizeCreateButtons(); });
  else { saveHomes(); close(); normalizeCreateButtons(); }
})();

(function(){
  'use strict';
  if(window.__gfCadastrosV226) return;
  window.__gfCadastrosV226=true;
  var API_BASE=window.API||window.location.origin;
  var servicesCache=Array.isArray(window.serviceGroupsCache)?window.serviceGroupsCache.slice():[];
  function byId(id){return document.getElementById(id)}
  function page(){return byId('pageCadastros')}
  function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
  function norm(v){return String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim()}
  function upper(v){return String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().trim()}
  function fetchJson(url,opt){return fetch(url,opt||{cache:'no-store'}).then(function(r){return r.json().catch(function(){return {}})})}
  function moduleName(){var p=page(); if(p&&p.classList.contains('cadastro-show-servicos'))return 'servicos'; if(p&&p.classList.contains('cadastro-show-problemas'))return 'problemas'; return 'equipamentos'}
  function kindOf(a){var k=upper(a&&(a.asset_kind||a.kind||a.type)); return k.indexOf('SERV')>=0?'SERVICE':'EQUIPMENT'}
  function statusOf(a){return upper(a&&(a.status||a.asset_status||'ACTIVE'))||'ACTIVE'}
  function isActive(a){return !['INACTIVE','NO_REPAIR','WRITTEN_OFF','DISABLED'].includes(statusOf(a))}
  function serviceActive(g){return Number(g&&g.active==null?1:g.active)===1 && !['INACTIVE','DISABLED'].includes(upper(g&&g.status||'ACTIVE'))}
  function sectorCount(g){return Number(g&&(g.active_count||((g.sector_ids||[]).length)||((g.sectors||[]).length)||0))||0}
  function filterStatus(){var st=upper(byId('assetFilterStatus')&&byId('assetFilterStatus').value||'ACTIVE'); return ['ACTIVE','INACTIVE','ALL'].includes(st)?st:'ACTIVE'}
  function plainPat(a){try{if(typeof window.plainPatrimonio==='function')return window.plainPatrimonio(a)}catch(e){} return String((a&&(a.patrimonio||a.sp_identificacao))||'Sem patrimônio')}
  function optSectorsSafe(selected){try{if(typeof window.optSectors==='function')return window.optSectors(selected)}catch(e){} return (Array.isArray(window.sectors)?window.sectors:[]).map(function(s){return '<option value="'+esc(s.id)+'" '+(String(selected)===String(s.id)?'selected':'')+'>'+esc(s.name)+'</option>'}).join('')}
  function assetGenericName(a){return String((a&&a.name)||'').trim()||'Sem nome'}
  function serviceKey(g){return encodeURIComponent(g.service_key||g.name||'')}
  function setBackVisible(){var p=page(), back=byId('cadastroBackLine'); if(p&&back){back.style.display=p.classList.contains('cadastro-module-open')?'flex':'none'}}
  function setModuleClasses(m){var p=page(); if(!p)return; p.classList.remove('cadastro-menu-open','cadastro-show-equipamentos','cadastro-show-servicos','cadastro-show-problemas','cadastro-asset-form-open','cadastro-issue-form-open'); p.classList.add('cadastro-module-open','cadastro-show-'+m); setBackVisible()}
  function lockKind(kind){var f=byId('assetFilterKind'); if(f){f.innerHTML=kind==='SERVICE'?'<option value="SERVICE">Somente serviços</option>':'<option value="EQUIPMENT">Somente equipamentos</option>'; f.value=kind} var s=byId('assetKindSelect'); if(s){s.innerHTML=kind==='SERVICE'?'<option value="SERVICE">🧩 Serviço / categoria</option>':'<option value="EQUIPMENT">🧰 Equipamento físico</option>'; s.value=kind; s.hidden=true; s.tabIndex=-1}}
  function setModuleText(m){var isSvc=m==='servicos'; var txt=function(id,v){var e=byId(id); if(e)e.textContent=v};
    txt('cadAssetModuleTitle',isSvc?'Serviços':'Equipamentos');
    txt('cadAssetModuleSub',isSvc?'Lista própria de serviços, com setores vinculados.':'Cadastre, edite, localize ou inative.');
    txt('cadAssetHeroTitle',isSvc?'Serviços':'Equipamentos');
    txt('cadAssetHeroSub',isSvc?'Crie o serviço, vincule setores ou inative.':'Cadastre, edite, localize ou inative.');
    txt('cadAssetHeroIcon',isSvc?'🧩':'🧰'); txt('cadAssetModuleBadge',isSvc?'Serviços':'Controle técnico');
    var actions=document.querySelector('#pageCadastros .cadastroModuleHeroActions');
    if(actions) actions.innerHTML='<button class="btn btnDark" onclick="toggleCadastroForm(\'asset\')" type="button">+'+(isSvc?' Cadastrar serviço':' Cadastrar equipamento')+'</button>';
    var listTitle=document.querySelector('#pageCadastros .cadAssetTitleActions b'); if(listTitle) listTitle.textContent=isSvc?'Serviços cadastrados':'Equipamentos cadastrados';
    var listSub=document.querySelector('#pageCadastros .cadAssetTitleActions small'); if(listSub) listSub.textContent=isSvc?'':'Equipamentos físicos separados por setor, igual QR.';
    var search=byId('assetSearch'); if(search) search.placeholder=isSvc?'Buscar serviço ou setor vinculado':'Buscar tipo, patrimônio, responsável, marca, modelo ou setor';
    lockKind(isSvc?'SERVICE':'EQUIPMENT'); setBackVisible();
  }

  function removeEquipmentLegacyChrome(){
    var page=document.getElementById('pageCadastros'); if(!page)return;
    var panel=page.querySelector('[data-cadastro-module="equipamentos"]'); if(!panel)return;
    var body=panel.querySelector('.cadProBody');
    var oldSearch=document.getElementById('assetSearch');
    var val=oldSearch?oldSearch.value:'';
    ['.cadastroModuleHero','#assetQuickFilterBox','.cadAssetTitleActions','.cadastroModuleStats'].forEach(function(sel){
      var el=panel.querySelector(sel); if(el&&el.parentNode)el.parentNode.removeChild(el);
    });
    var micro=panel.querySelector('.cadProMicro'); if(micro&&micro.parentNode)micro.parentNode.removeChild(micro);
    var title=panel.querySelector('#cadAssetModuleTitle'); if(title) title.textContent='Equipamentos';
    var sub=panel.querySelector('#cadAssetModuleSub'); if(sub) sub.textContent='Cadastre, edite, localize ou inative.';
    var icon=panel.querySelector('.cadProHeadIcon'); if(icon) icon.textContent='🧰';
    var badge=panel.querySelector('#cadAssetModuleBadge'); if(badge) badge.remove();
    var btn=panel.querySelector('.cadAssetHeadNewBtn');
    if(btn){ btn.textContent='+ Novo equipamento'; btn.setAttribute('onclick',"toggleCadastroForm('asset')"); btn.style.display='inline-flex'; }
    if(body && !document.getElementById('gfEquipmentSimpleSearch')){
      var wrap=document.createElement('div');
      wrap.id='gfEquipmentSimpleSearch';
      wrap.className='gfServiceSimpleSearch gfEquipmentSimpleSearch';
      wrap.innerHTML='<input id="assetSearch" oninput="renderAssets()" placeholder="Buscar equipamento"/>';
      body.insertBefore(wrap, body.firstChild);
      var search=document.getElementById('assetSearch'); if(search) search.value=val;
    }
  }

  function removeServiceLegacyChrome(){
    var page=document.getElementById('pageCadastros'); if(!page)return;
    var panel=page.querySelector('[data-cadastro-module="equipamentos"]'); if(!panel)return;
    var body=panel.querySelector('.cadProBody');
    var oldSearch=document.getElementById('assetSearch');
    var val=oldSearch?oldSearch.value:'';
    ['.cadastroModuleStats','#assetQuickFilterBox','.cadAssetTitleActions'].forEach(function(sel){
      var el=panel.querySelector(sel); if(el&&el.parentNode)el.parentNode.removeChild(el);
    });
    var micro=panel.querySelector('.cadProMicro'); if(micro&&micro.parentNode)micro.parentNode.removeChild(micro);
    var formTitle=panel.querySelector('.cadAssetFormTitle'); if(formTitle&&formTitle.parentNode)formTitle.parentNode.removeChild(formTitle);
    var hero=panel.querySelector('.cadastroModuleHero');
    if(hero){
      var title=hero.querySelector('#cadAssetHeroTitle'); if(title)title.textContent='Serviços';
      var sub=hero.querySelector('#cadAssetHeroSub'); if(sub)sub.textContent='Crie o serviço, vincule setores ou inative.';
      var actions=hero.querySelector('.cadastroModuleHeroActions');
      if(actions)actions.innerHTML='<button class="btn btnDark" onclick="toggleCadastroForm(\'service\')" type="button">+ Novo serviço</button>';
    }
    if(body && !document.getElementById('gfServiceSimpleSearch')){
      var wrap=document.createElement('div');
      wrap.id='gfServiceSimpleSearch';
      wrap.className='gfServiceSimpleSearch';
      wrap.innerHTML='<input id="assetSearch" oninput="renderAssets()" placeholder="Buscar serviço"/><button class="btn btnDark" onclick="toggleCadastroForm(\'service\')" type="button">+ Novo serviço</button>';
      body.insertBefore(wrap, document.getElementById('assetsBody'));
      var inp=wrap.querySelector('#assetSearch'); if(inp)inp.value=val;
    }
  }

  function updateKpis(m,equipRows,serviceRows){equipRows=Array.isArray(equipRows)?equipRows:[]; serviceRows=Array.isArray(serviceRows)?serviceRows:[]; if(m==='servicos')return; var s1=byId('cadAssetStatEquip'),l1=s1&&s1.parentElement&&s1.parentElement.querySelector('span'),s2=byId('cadAssetStatServ'),l2=s2&&s2.parentElement&&s2.parentElement.querySelector('span'),a=byId('cadAssetStatActive'),i=byId('cadAssetStatInactive'); if(m==='servicos'){}else{if(s1)s1.textContent=equipRows.length;if(l1)l1.textContent='Equipamentos';var sectors={};equipRows.forEach(function(x){var k=x.sector_id||x.sector_name;if(k)sectors[k]=1});if(s2)s2.textContent=Object.keys(sectors).length;if(l2)l2.textContent='Setores com equipamentos';var ea=equipRows.filter(isActive).length;if(a)a.textContent=ea;if(i)i.textContent=Math.max(0,equipRows.length-ea)}}
  function toggleBlock(id){var e=byId(id); if(!e)return; e.classList.toggle('open'); var k=e.getAttribute('data-cad-block-key')||id; window.gfCadOpenBlocks=window.gfCadOpenBlocks||{}; window.gfCadOpenBlocks[k]=e.classList.contains('open')} window.gfToggleCadBlock=toggleBlock;
  function blockList(blocks,empty){
    blocks=Array.isArray(blocks)?blocks:[];
    if(!blocks.length)return '<div class="cadQuickEmpty gfBlockEmpty">'+esc(empty||'Nenhum item encontrado.')+'</div>';
    window.gfCadOpenBlocks=window.gfCadOpenBlocks||{};
    return '<div class="gfCadQrBlocks">'+blocks.map(function(b,idx){
      var safeKey=String((b.prefix||'g')+'_'+(b.key||b.title||idx)).replace(/[^a-zA-Z0-9_-]/g,'_');
      var id='gfCadBlock_'+safeKey;
      var open=window.gfCadOpenBlocks[safeKey]?' open':'';
      return '<div class="gfCadQrBlock'+open+'" id="'+id+'" data-cad-block-key="'+safeKey+'"><button class="gfCadQrBlockHead" type="button" onclick="gfToggleCadBlock(\''+id+'\')"><span class="gfCadQrIcon '+esc(b.tone||'blue')+'">'+esc(b.icon||'📁')+'</span><span class="gfCadQrText"><b>'+esc(b.title||'-')+'</b><small>'+esc(b.subtitle||'')+'</small></span><span class="gfCadQrPill gfCadQrPillOrange">'+esc(b.badge1||'')+'</span><span class="gfCadQrArrow">⌄</span></button><div class="gfCadQrBlockBody">'+(b.body||'')+'</div></div>'
    }).join('')+'</div>'
  }
  function equipmentCard(a){var id=Number(a.id)||0,active=isActive(a),dep=upper(a.asset_department||'TI'),icon=dep==='MANUTENCAO'?'🛠️':(dep==='APOIO'?'🤝':'🧰'),meta=[plainPat(a),a.sector_name||a.origin_sector_name||'-',active?'Ativo':'Inativo'].filter(Boolean).join(' • '); return '<div class="gfCleanCard gfServiceSimpleCard gfEquipmentSimpleCard '+(!active?'gfInactiveCard':'')+'"><div class="gfCardAccent"></div><div class="gfCardIcon">'+icon+'</div><div class="gfCadItemMain"><div class="gfCadItemTop"><h3>'+esc(a.name||'-')+'</h3></div><div class="gfCardMeta gfServiceOneLine"><span>'+esc(meta)+'</span></div></div><div class="gfCardActions"><button class="btn btnDark adminOnly" onclick="openAssetEditDrawer('+id+')">Editar</button><button class="btn btnLight" onclick="openAssetHistory('+id+')">Histórico</button><button class="btn '+(active?'btnDanger':'btnDark')+' adminOnly" onclick="toggleAsset('+id+',\''+(active?'INACTIVE':'ACTIVE')+'\')">'+(active?'Inativar':'Ativar')+'</button></div></div>'}
  function serviceCard(g){var act=serviceActive(g),key=serviceKey(g),dept=upper(g.asset_department||g.department||'MANUTENCAO'),icon=dept==='APOIO'?'🤝':(dept==='TI'?'🧩':'🛠️'); return '<div class="gfCleanCard gfServiceSimpleCard '+(!act?'gfInactiveCard':'')+'"><div class="gfCardAccent"></div><div class="gfCardIcon">'+icon+'</div><div class="gfCadItemMain"><div class="gfCadItemTop"><h3>'+esc(g.name||'-')+'</h3></div><div class="gfCardMeta gfServiceOneLine"><span>'+esc(dept||'-')+' • '+(act?'Ativo':'Inativo')+'</span></div></div><div class="gfCardActions"><button class="btn btnDark adminOnly" onclick="openServiceSectorEditor(\''+key+'\')">Vincular</button><button class="btn btnLight adminOnly" onclick="editServiceName(\''+key+'\')">Editar</button><button class="btn btnDanger adminOnly" onclick="toggleServiceGroupActive(\''+key+'\','+(act?'0':'1')+')">'+(act?'Inativar':'Ativar')+'</button></div></div>'}
  function refreshEquipmentTypeSelect(rows){var sel=byId('assetFilterAsset'); if(!sel)return; var old=sel.value||''; var names={}; rows.forEach(function(a){var n=assetGenericName(a); if(n)names[n]=1}); var opts=Object.keys(names).sort(function(a,b){return a.localeCompare(b,'pt-BR')}); sel.innerHTML='<option value="">Todos equipamentos físicos</option>'+opts.map(function(n){return '<option value="'+esc(n)+'">'+esc(n)+'</option>'}).join(''); if(opts.some(function(n){return n===old}))sel.value=old; else sel.value=''}
  function refreshServiceSelect(rows){var sel=byId('assetFilterAsset'); if(!sel)return; var old=sel.value||''; sel.innerHTML='<option value="">Todos serviços</option>'+rows.map(function(g){var k=String(g.service_key||g.name||''); return '<option value="'+esc(k)+'">'+esc(g.name||'-')+'</option>'}).join(''); if([].slice.call(sel.options).some(function(o){return o.value===old}))sel.value=old}
  async function loadEquipments(){var sid=byId('assetFilterSector')&&byId('assetFilterSector').value||''; var j=await fetchJson(API_BASE+'/api/admin/assets'+(sid?'?sector_id='+encodeURIComponent(sid):'')); var list=Array.isArray(j.assets)?j.assets:[]; window.assets=list; try{assets=list}catch(e){} return list}
  async function loadServices(){var j=await fetchJson(API_BASE+'/api/admin/service-groups'); servicesCache=Array.isArray(j.services)?j.services:[]; window.serviceGroupsCache=servicesCache.slice(); window.gfIssueServiceGroups=servicesCache.slice(); return servicesCache}
  window.gfCadastroCache=window.gfCadastroCache||{};
  function renderEquipments(list){if(moduleName()!=='equipamentos')return; setModuleText('equipamentos'); removeEquipmentLegacyChrome(); list=Array.isArray(list)?list:(Array.isArray(window.assets)?window.assets:[]); var q=norm(byId('assetSearch')&&byId('assetSearch').value||''); var base=list.filter(function(a){return kindOf(a)!=='SERVICE'}); var rows=base.filter(function(a){if(q && norm([a.name,a.patrimonio,a.sp_identificacao,a.sp_responsavel,a.brand,a.model,a.sector_name,a.origin_sector_name].join(' ')).indexOf(q)<0)return false; return true}); var body=byId('assetsBody'); if(body){body.innerHTML=rows.length?'<div class="gfServiceListClean gfEquipmentListClean">'+rows.sort(function(a,b){return String(a.name||'').localeCompare(String(b.name||''),'pt-BR')}).map(equipmentCard).join('')+'</div>':'<div class="cadQuickEmpty gfBlockEmpty">Nenhum equipamento encontrado.</div>'; body.dataset.gfHasStableContent='1';}}
  function renderServices(list){if(moduleName()!=='servicos')return; setModuleText('servicos'); removeServiceLegacyChrome(); list=Array.isArray(list)?list:servicesCache; var q=norm(byId('assetSearch')&&byId('assetSearch').value||''), selected=byId('assetFilterAsset')&&byId('assetFilterAsset').value||'', mode=filterStatus(); var statusBase=list.filter(function(g){var act=serviceActive(g); return (mode!=='ACTIVE'||act)&&(mode!=='INACTIVE'||!act)}); refreshServiceSelect(statusBase); selected=byId('assetFilterAsset')&&byId('assetFilterAsset').value||''; var rows=statusBase.filter(function(g){if(selected && String(g.service_key||g.name)!==String(selected))return false; var sectors=(Array.isArray(g.sectors)?g.sectors:[]).map(function(s){return s.name}).join(' '); if(q && norm([g.name,g.service_key,g.asset_department,g.department,sectors].join(' ')).indexOf(q)<0)return false; return true}); var body=byId('assetsBody'); if(body){body.innerHTML=rows.length?'<div class="gfServiceListClean">'+rows.sort(function(a,b){return String(a.name||'').localeCompare(String(b.name||''),'pt-BR')}).map(serviceCard).join('')+'</div>':'<div class="cadQuickEmpty gfBlockEmpty">Nenhum serviço encontrado neste filtro.</div>'; body.dataset.gfHasStableContent='1';}}
  async function loadCurrent(){var m=moduleName(), body=byId('assetsBody'); if(body&&m!=='problemas'&&!(body.dataset&&body.dataset.gfHasStableContent==='1'))body.innerHTML='<div class="cadQuickEmpty gfBlockEmpty">Carregando...</div>'; if(m==='servicos')return renderServices(await loadServices()); if(m==='problemas'){ if(typeof window.loadIssues==='function') return window.loadIssues(true); if(typeof window.renderIssues==='function')return window.renderIssues(); return} return renderEquipments(await loadEquipments())}
  window.loadAssets=loadCurrent;
  window.renderAssets=function(){var m=moduleName(); if(m==='servicos')return renderServices(servicesCache.length?servicesCache:(Array.isArray(window.serviceGroupsCache)?window.serviceGroupsCache:[])); if(m==='equipamentos')return renderEquipments(Array.isArray(window.assets)?window.assets:[])};
  window.openCadastroModule=function(m){
    m=(m==='servicos'||m==='problemas')?m:'equipamentos';
    try{if(typeof window.closeCadastroForm==='function')window.closeCadastroForm()}catch(e){}
    var ab=byId('assetsBody');
    if(ab){
      if(ab.dataset) delete ab.dataset.gfHasStableContent;
      ab.innerHTML='<div class="cadQuickEmpty gfBlockEmpty">Carregando...</div>';
    }
    setModuleClasses(m);
    setModuleText(m);
    if(m==='problemas'){
      try{ if(typeof cadLimit!=='undefined') cadLimit.issues=999999; }catch(e){}
      try{setTimeout(async function(){
        if(typeof ensureIssueToolbar==='function') ensureIssueToolbar();
        try{
          var sj=await fetchJson(API_BASE+'/api/admin/service-groups');
          window.gfIssueServiceGroups=Array.isArray(sj.services)?sj.services:[];
          window.serviceGroupsCache=window.gfIssueServiceGroups.slice();
        }catch(e){}
        if(typeof window.loadIssues==='function') window.loadIssues(true);
        else if(typeof window.renderIssues==='function') window.renderIssues();
      },0)}catch(e){}
    }else{
      var search=byId('assetSearch'); if(search)search.value='';
      var sel=byId('assetFilterAsset'); if(sel)sel.value='';
      if(m==='servicos'){
        loadServices().then(function(rows){ renderServices(rows); }).catch(function(){ renderServices(Array.isArray(window.serviceGroupsCache)?window.serviceGroupsCache:[]); });
      }else{
        loadEquipments().then(function(rows){ renderEquipments(rows); }).catch(function(){ renderEquipments(Array.isArray(window.assets)?window.assets:[]); });
      }
    }
    try{localStorage.setItem('cadastroModuloAtual',m)}catch(e){}
    var target=page()&&page().querySelector('[data-cadastro-module="'+(m==='problemas'?'problemas':(m==='servicos'?'servicos':'equipamentos'))+'"]') || page()&&page().querySelector('.cadastroModuleHero,.cadProPanel');
    if(target)setTimeout(function(){target.scrollIntoView({behavior:'smooth',block:'start'}); setBackVisible()},60)
  };
  window.showCadastroMenu=function(){try{if(typeof window.closeCadastroForm==='function')window.closeCadastroForm()}catch(e){} var p=page(); if(p){p.classList.remove('cadastro-module-open','cadastro-show-equipamentos','cadastro-show-servicos','cadastro-show-problemas','cadastro-asset-form-open','cadastro-issue-form-open');p.classList.add('cadastro-menu-open')} setBackVisible()};
  (function(){
  var assetFilterIdsV22 = {
    assetFilterSector: true,
    assetFilterStatus: true,
    assetFilterAsset: true,
    assetSearch: true
  };
  function handleAssetFilterV22(e){
    var id = e && e.target && e.target.id;
    if(id && assetFilterIdsV22[id] && window.renderAssets){
      window.renderAssets();
    }
  }
  document.addEventListener('input', handleAssetFilterV22, true);
  document.addEventListener('change', handleAssetFilterV22, true);
})();
  var guardTimer=null; function guard(){clearTimeout(guardTimer); guardTimer=setTimeout(function(){var m=moduleName(), body=byId('assetsBody'); if(!body||m==='problemas')return; var t=body.textContent||''; if(m==='servicos' && /Setor com equipamentos cadastrados|equipamentos cadastrados/i.test(t))renderServices(servicesCache); if(m==='equipamentos' && /Editar setores|Serviço\/categoria/i.test(t))renderEquipments(Array.isArray(window.assets)?window.assets:[])},80)} try{var __gfObsTarget=document.getElementById('assetsBody')||(page&&page())||document.body;new MutationObserver(guard).observe(__gfObsTarget,{childList:true,subtree:true})}catch(e){}
  setTimeout(function(){setBackVisible(); if(page()&&page().classList.contains('cadastro-show-servicos'))loadServices().then(function(rows){renderServices(rows)}); else if(page()&&page().classList.contains('cadastro-show-equipamentos'))loadEquipments().then(function(rows){renderEquipments(rows)})},150);
})();

(function(){
  function gfById(id){return document.getElementById(id)}
  function gfEsc(v){return String(v==null?'':v).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
  function gfApi(){return (typeof API_BASE!=='undefined'?API_BASE:(typeof API!=='undefined'?API:''))}
  function gfNorm(v){return String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().trim()}
  function gfServiceKey(g){return String(g && (g.service_key||g.name||g.legacy_asset_name||''))}
  function gfServiceCount(g){
    var n=Number((g&&g.active_count)!=null?g.active_count:((g&&g.sector_ids&&g.sector_ids.length)||0));
    return n+' setor'+(n===1?' vinculado':'es vinculados');
  }
  async function gfFetchJson(url,opts){
    var r=await fetch(url,Object.assign({cache:'no-store',credentials:'include'},opts||{}));
    try{return await r.json()}catch(e){return {ok:false,error:'Resposta inválida'}}
  }
  async function gfGetServices(){
    var list=[];
    try{ if(Array.isArray(window.serviceGroupsCache)) list=window.serviceGroupsCache.slice(); }catch(e){}
    try{ if(!list.length && Array.isArray(window.gfIssueServiceGroups)) list=window.gfIssueServiceGroups.slice(); }catch(e){}
    if(!list.length){
      try{
        var j=await gfFetchJson(gfApi()+'/api/admin/service-groups');
        list=Array.isArray(j.services)?j.services:[];
        window.serviceGroupsCache=list.slice();
        window.gfIssueServiceGroups=list.slice();
      }catch(e){}
    }
    return list;
  }
  async function gfGetSectors(){
    var list=[];
    try{ if(Array.isArray(window.sectors)) list=window.sectors.slice(); }catch(e){}
    try{ if(!list.length && typeof sectors!=='undefined' && Array.isArray(sectors)) list=sectors.slice(); }catch(e){}
    if(!list.length){
      try{
        var j=await gfFetchJson(gfApi()+'/api/admin/sectors');
        list=Array.isArray(j.sectors)?j.sectors:(Array.isArray(j.rows)?j.rows:[]);
        window.sectors=list.slice();
      }catch(e){}
    }
    return list;
  }
  function gfEnsureServiceDrawer(){
    if(gfById('serviceSectorDrawer')) return;
    document.body.insertAdjacentHTML('beforeend','<div id="serviceSectorBackdrop" class="assetEditBackdrop" onclick="closeServiceSectorDrawer()"></div><aside id="serviceSectorDrawer" class="assetEditDrawer"><div class="assetEditHead"><div><h2 id="serviceSectorTitle">Vincular setores</h2><small id="serviceSectorSub">Marque os setores onde o serviço deve aparecer.</small></div><button class="assetEditClose" onclick="closeServiceSectorDrawer()">×</button></div><div class="assetEditBody"><input type="hidden" id="serviceSectorKey"><div id="serviceSectorChecks" class="serviceSectorChecks"></div></div><div class="assetEditFoot"><button class="btn btnLight" onclick="closeServiceSectorDrawer()">Cancelar</button><button class="btn btnDark" onclick="saveServiceSectors()">Salvar vínculos</button></div></aside>');
  }
  window.openServiceSectorDrawer=async function(rawKey){
    gfEnsureServiceDrawer();
    var key=''; try{key=decodeURIComponent(String(rawKey||''))}catch(e){key=String(rawKey||'')}
    var services=await gfGetServices();
    var target=services.find(function(g){return gfNorm(g.service_key)===gfNorm(key)||gfNorm(g.name)===gfNorm(key)||gfNorm(g.legacy_asset_name)===gfNorm(key)});
    if(!target){alert('Serviço não encontrado.');return;}
    var sectors=await gfGetSectors();
    var linked=new Set((target.sector_ids||[]).map(function(x){return String(x)}));
    gfById('serviceSectorKey').value=gfServiceKey(target);
    gfById('serviceSectorTitle').textContent='Vincular setores: '+(target.name||'Serviço');
    gfById('serviceSectorSub').textContent=gfServiceCount(target);
    gfById('serviceSectorChecks').innerHTML=sectors.slice().sort(function(a,b){return String(a.name||'').localeCompare(String(b.name||''),'pt-BR')}).map(function(s){
      return '<label><input type="checkbox" value="'+gfEsc(s.id)+'" '+(linked.has(String(s.id))?'checked':'')+'> '+gfEsc(s.name||'-')+'</label>';
    }).join('') || '<div class="empty">Nenhum setor cadastrado.</div>';
    gfById('serviceSectorBackdrop').classList.add('show');
    gfById('serviceSectorDrawer').classList.add('show');
  };
  window.closeServiceSectorDrawer=function(){
    gfById('serviceSectorBackdrop')?.classList.remove('show');
    gfById('serviceSectorDrawer')?.classList.remove('show');
  };
  window.saveServiceSectors=async function(){
    var key=gfById('serviceSectorKey')?.value||'';
    var sector_ids=[].slice.call(document.querySelectorAll('#serviceSectorChecks input:checked')).map(function(i){return Number(i.value)}).filter(Boolean);
    var j=await gfFetchJson(gfApi()+'/api/admin/service-groups/'+encodeURIComponent(key)+'/sectors',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({sector_ids:sector_ids})});
    if(!j || j.ok===false){alert((j&&j.error)||'Erro ao salvar setores');return;}
    closeServiceSectorDrawer();
    try{ if(typeof toastMsg==='function') toastMsg('Setores do serviço atualizados'); }catch(e){}
    if(typeof window.loadAssets==='function') window.loadAssets();
  };
})();

(function(){
  var API_ROOT = (typeof API !== 'undefined' ? API : window.location.origin);
  function byId(id){return document.getElementById(id)}
  function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]})}
  function norm(v){return String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().replace(/[^A-Z0-9]+/g,' ').trim()}
  function key(v){return norm(v).replace(/\s+/g,'')}
  async function jfetch(url,opts){
    opts=opts||{};
    var timeout=Number(opts.timeout||15000), ctrl=null, timer=null;
    try{
      if(typeof AbortController!=='undefined'){
        ctrl=new AbortController(); timer=setTimeout(function(){try{ctrl.abort()}catch(e){}},timeout);
        opts=Object.assign({},opts,{signal:ctrl.signal}); delete opts.timeout;
      }
      var r=await fetch(url,Object.assign({cache:'no-store',credentials:'include'},opts||{}));
      if(timer)clearTimeout(timer);
      var data=null; try{data=await r.json()}catch(e){data={ok:false,error:'Resposta inválida'}}
      if(!r.ok && data && !data.error) data.error='Erro '+r.status;
      return data;
    }catch(e){
      if(timer)clearTimeout(timer);
      return {ok:false,error:(e&&e.name==='AbortError')?'Servidor demorou para responder. Tente novamente.':'Erro de comunicação'};
    }
  }
  function priLabel(p){p=String(p||'MEDIUM').toUpperCase();return p==='HIGH'?'Alta':(p==='LOW'?'Baixa':'Média')}
  function priBadge(p){p=String(p||'MEDIUM').toUpperCase();return '<span class="gfPriority '+(p==='HIGH'?'high':p==='LOW'?'low':'medium')+'">'+priLabel(p)+'</span>'}
  function serviceKey(g){return String(g&&(g.service_key||g.name||g.legacy_asset_name)||'')}
  function findServiceByIssue(i){var list=window.gfIssueServiceGroups||window.serviceGroupsCache||[];var ks=[i&&i.asset_name,i&&i.service_key].map(key);return list.find(function(g){return ks.indexOf(key(g.name))>=0||ks.indexOf(key(g.service_key))>=0||ks.indexOf(key(g.legacy_asset_name))>=0})||null}
  async function ensureSources(){
    try{ if(typeof window.gfIssueRefreshSources==='function') await window.gfIssueRefreshSources(); }catch(e){}
    if(!Array.isArray(window.sectors)||!window.sectors.length){try{var sj=await jfetch(API_ROOT+'/api/admin/sectors'); window.sectors=Array.isArray(sj.sectors)?sj.sectors:[]}catch(e){}}
    if(!Array.isArray(window.gfIssueServiceGroups)||!window.gfIssueServiceGroups.length){try{var gj=await jfetch(API_ROOT+'/api/admin/service-groups'); window.gfIssueServiceGroups=Array.isArray(gj.services)?gj.services:[]; window.serviceGroupsCache=window.gfIssueServiceGroups.slice()}catch(e){}}
    if(!Array.isArray(window.assets)||!window.assets.length){try{var aj=await jfetch(API_ROOT+'/api/admin/assets'); window.assets=Array.isArray(aj.assets)?aj.assets:[]}catch(e){}}
  }
  function itemOptions(kind){
    kind=String(kind||'EQUIPMENT').toUpperCase();
    if(kind==='SERVICE'){
      var sv=(window.gfIssueServiceGroups||window.serviceGroupsCache||[]).slice().filter(function(s){return Number(s.active==null?1:s.active)!==0});
      return sv.sort(function(a,b){return String(a.name||'').localeCompare(String(b.name||''),'pt-BR')}).map(function(s){return '<option value="'+esc(s.name||'')+'">'+esc(s.name||'')+'</option>'}).join('');
    }
    var rows=(window.assets||[]).slice().filter(function(a){return String(a.asset_kind||a.kind||'').toUpperCase()!=='SERVICE' && String(a.status||'ACTIVE').toUpperCase()==='ACTIVE'});
    var seen={};
    rows=rows.filter(function(a){var k=key(a.name); if(!k||seen[k])return false; seen[k]=1; return true});
    return rows.sort(function(a,b){return String(a.name||'').localeCompare(String(b.name||''),'pt-BR')}).map(function(a){return '<option value="'+esc(a.name||'')+'">'+esc(a.name||'')+'</option>'}).join('');
  }
  function ensureIssueModal(){
    if(byId('gfIssueModal'))return;
    document.body.insertAdjacentHTML('beforeend','<div id="gfIssueBackdrop" class="assetEditBackdrop" onclick="closeIssueModal()"></div><div id="gfIssueModal" class="gfIssueModal"><div class="assetEditHead"><div><h2>Novo tipo de problema</h2><small>Escolha equipamento/serviço, prioridade e status. Será salvo somente na empresa logada.</small></div><button class="assetEditClose" onclick="closeIssueModal()">×</button></div><div class="assetEditBody"><div class="gfIssueCreateGrid"><label>Tipo<select id="gfIssueKind"><option value="EQUIPMENT">Equipamento</option><option value="SERVICE">Serviço</option></select></label><label>Equipamento/serviço<select id="gfIssueItem"></select></label><label>Nome do problema<input id="gfIssueName" placeholder="Ex: Não liga / Vazamento / Sem internet"></label><label>Prioridade<select id="gfIssuePriority"><option value="HIGH">Alta</option><option value="MEDIUM" selected>Média</option><option value="LOW">Baixa</option></select></label><label>Status<select id="gfIssueActive"><option value="1" selected>Ativo</option><option value="0">Inativo</option></select></label></div></div><div class="assetEditFoot"><button class="btn btnLight" onclick="closeIssueModal()">Cancelar</button><button class="btn btnDark" onclick="saveIssueModal()">Cadastrar problema</button></div></div>');
    byId('gfIssueKind').addEventListener('change',function(){byId('gfIssueItem').innerHTML=itemOptions(this.value)});
  }
  window.openIssueModal=async function(){
    if(typeof guardAction==='function' && !guardAction('admin'))return;
    ensureIssueModal(); await ensureSources();
    byId('gfIssueKind').value='EQUIPMENT'; byId('gfIssueItem').innerHTML=itemOptions('EQUIPMENT'); byId('gfIssueName').value=''; byId('gfIssuePriority').value='MEDIUM'; byId('gfIssueActive').value='1';
    byId('gfIssueBackdrop').classList.add('show'); byId('gfIssueModal').classList.add('show'); setTimeout(function(){byId('gfIssueName')&&byId('gfIssueName').focus()},80);
  };
  window.closeIssueModal=function(){byId('gfIssueBackdrop')?.classList.remove('show');byId('gfIssueModal')?.classList.remove('show')};
  window.saveIssueModal=async function(){
    if(typeof guardAction==='function' && !guardAction('admin'))return;
    var btn=document.querySelector('#gfIssueModal .assetEditFoot .btnDark');
    if(btn && btn.dataset.saving==='1')return;
    var oldTxt=btn?btn.textContent:'';
    try{
      var kind=byId('gfIssueKind').value, item=String(byId('gfIssueItem').value||'').trim(), name=String(byId('gfIssueName').value||'').trim(), priority=byId('gfIssuePriority').value, active=byId('gfIssueActive').value==='1';
      if(!item)return alert('Selecione o equipamento ou serviço.');
      if(!name)return alert('Informe o nome do problema.');
      if(btn){btn.dataset.saving='1';btn.disabled=true;btn.textContent='Salvando...';}
      var body={asset_name:item,name:name,priority:priority,active:active,item_type:kind};
      if(kind==='SERVICE'){
        var svc=(window.gfIssueServiceGroups||[]).find(function(s){return key(s.name)===key(item)||key(s.service_key)===key(item)||key(s.legacy_asset_name)===key(item)});
        if(svc){body.service_id=svc.service_id||svc.id; body.asset_name=svc.name||item;}
      }else{
        var eq=(window.assets||[]).find(function(a){return key(a.name)===key(item)&&String(a.asset_kind||'').toUpperCase()!=='SERVICE'});
        if(eq)body.asset_id=eq.id;
      }
      var j=await jfetch(API_ROOT+'/api/admin/issues',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body),timeout:12000});
      if(!j.ok)return alert(j.error||'Erro ao cadastrar problema');
      closeIssueModal();
      try{if(typeof loadIssues==='function')await loadIssues()}catch(e){}
      try{if(typeof window.renderIssues==='function')window.renderIssues()}catch(e){}
      try{toastMsg('Tipo de problema cadastrado')}catch(e){}
    }finally{
      if(btn){btn.dataset.saving='0';btn.disabled=false;btn.textContent=oldTxt||'Cadastrar problema';}
    }
  };
  function ensureIssueSectorDrawer(){
    if(byId('gfIssueSectorDrawer'))return;
    document.body.insertAdjacentHTML('beforeend','<div id="gfIssueSectorBackdrop" class="assetEditBackdrop" onclick="closeIssueSectorDrawer()"></div><aside id="gfIssueSectorDrawer" class="assetEditDrawer"><div class="assetEditHead"><div><h2 id="gfIssueSectorTitle">Equipamentos/serviços do problema</h2><small id="gfIssueSectorSub">Marque onde esse tipo de problema deve aparecer.</small></div><button class="assetEditClose" onclick="closeIssueSectorDrawer()">×</button></div><div class="assetEditBody"><input type="hidden" id="gfIssueSectorId"><div class="gfDrawerHint">A lógica correta é: o problema fica cadastrado uma vez e aqui você escolhe quais equipamentos ou serviços usam esse mesmo problema.</div><div id="gfIssueSectorChecks" class="serviceSectorChecks gfIssueItemChecks"></div></div><div class="assetEditFoot"><button class="btn btnLight" onclick="closeIssueSectorDrawer()">Cancelar</button><button class="btn btnDark" onclick="saveIssueSectors()">Salvar vínculos</button></div></aside>');
  }
  window.openIssueSectorDrawer=async function(id){
    if(typeof guardAction==='function' && !guardAction('admin'))return;
    ensureIssueSectorDrawer(); await ensureSources();
    var issue=(window.issues||issues||[]).find(function(x){return Number(x.id)===Number(id)})||{};
    byId('gfIssueSectorId').value=id;
    byId('gfIssueSectorTitle').textContent='Vínculos: '+(issue.name||'Problema');
    byId('gfIssueSectorSub').textContent='Selecione os equipamentos/serviços que terão esse problema no QR.';
    byId('gfIssueSectorChecks').innerHTML='<div class="empty">Carregando equipamentos e serviços...</div>';
    byId('gfIssueSectorBackdrop').classList.add('show'); byId('gfIssueSectorDrawer').classList.add('show');
    var j=await jfetch(API_ROOT+'/api/admin/issues/'+encodeURIComponent(id)+'/item-links');
    if(!j.ok){ byId('gfIssueSectorChecks').innerHTML='<div class="empty">'+esc(j.error||'Erro ao carregar vínculos')+'</div>'; return; }
    var linked=new Set((j.linked_values||[]).map(String));
    var items=Array.isArray(j.items)?j.items:[];
    var eq=items.filter(function(x){return String(x.kind).toUpperCase()==='EQUIPMENT'});
    var sv=items.filter(function(x){return String(x.kind).toUpperCase()==='SERVICE'});
    function group(title,arr){
      if(!arr.length)return '';
      return '<div class="gfCheckGroupTitle">'+title+'</div>'+arr.map(function(it){return '<label><input type="checkbox" value="'+esc(it.value)+'" '+(linked.has(String(it.value))?'checked':'')+'> <span>'+(String(it.kind).toUpperCase()==='SERVICE'?'🧩 ':'🧰 ')+esc(it.name||'-')+'</span></label>'}).join('');
    }
    byId('gfIssueSectorChecks').innerHTML=(group('Equipamentos',eq)+group('Serviços',sv))||'<div class="empty">Nenhum equipamento ou serviço ativo encontrado nesta empresa.</div>';
  };
  window.closeIssueSectorDrawer=function(){byId('gfIssueSectorBackdrop')?.classList.remove('show');byId('gfIssueSectorDrawer')?.classList.remove('show')};
  window.saveIssueSectors=async function(){
    var id=byId('gfIssueSectorId')?.value; if(!id)return;
    var btn=document.querySelector('#gfIssueSectorDrawer .assetEditFoot .btnDark'), old=btn?btn.textContent:'';
    var item_values=[].slice.call(document.querySelectorAll('#gfIssueSectorChecks input:checked')).map(function(x){return String(x.value)}).filter(Boolean);
    try{
      if(btn){btn.disabled=true;btn.textContent='Salvando...';}
      var j=await jfetch(API_ROOT+'/api/admin/issues/'+encodeURIComponent(id)+'/item-links',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({item_values:item_values}),timeout:15000});
      if(!j.ok)return alert(j.error||'Erro ao salvar vínculos do problema');
      closeIssueSectorDrawer(); try{toastMsg('Vínculos do problema atualizados')}catch(e){};
      try{if(typeof loadIssues==='function')await loadIssues()}catch(e){}
      try{if(typeof window.renderIssues==='function')window.renderIssues()}catch(e){}
    }finally{ if(btn){btn.disabled=false;btn.textContent=old||'Salvar vínculos';} }
  };
  function ensureIssueToolbar(){
    var body=byId('issuesBody'); if(!body||byId('gfIssueToolbar'))return;
    var bar=document.createElement('div'); bar.id='gfIssueToolbar'; bar.className='gfIssueToolbar adminOnly';
    bar.innerHTML='<div><b>Problemas cadastrados</b><small>Crie problemas e vincule setores dentro de cada card.</small></div><button class="btn btnDark" type="button" onclick="openIssueModal()">+ Novo tipo de problema</button>';
    body.parentNode.insertBefore(bar,body);
  }
  function gfRenderIssuesOfficialToolbar(){ ensureIssueToolbar(); try{ if(typeof refreshIssueQuickFilters==='function') refreshIssueQuickFilters(); }catch(e){} }
  document.addEventListener('gf:page-shown', function(ev){ if(ev && ev.detail && ev.detail.page==='cadastros') gfRenderIssuesOfficialToolbar(); });
  window.openServiceSectorEditor=function(key){return window.openServiceSectorDrawer?window.openServiceSectorDrawer(key):null};
  window.showServiceSectors=function(key){return window.openServiceSectorDrawer?window.openServiceSectorDrawer(key):null};
  /* V43: toolbar/problemas sob demanda ao abrir módulo */
})();

/* GF limpo: problemas carregam todos ao abrir o módulo; sem botão Ver mais e sem override moreRows. */

(function(){
  if(window.__gfIssueModalV5) return;
  window.__gfIssueModalV5 = true;
  var API_ROOT = (typeof API !== 'undefined' ? API : window.location.origin);
  var cache = {assets:null, services:null, issues:null, loading:null, at:0};
  function byId(id){return document.getElementById(id)}
  function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]})}
  function norm(v){return String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().replace(/[^A-Z0-9]+/g,' ').trim()}
  function key(v){return norm(v).replace(/\s+/g,'')}
  async function getJson(url){try{var r=await fetch(url,{cache:'no-store',credentials:'include'});return await r.json()}catch(e){return {ok:false}}}
  function isService(a){return String(a && (a.asset_kind||a.kind||'')).toUpperCase()==='SERVICE'}
  function isActiveAsset(a){var st=String(a && (a.status||a.active_status||'ACTIVE')).toUpperCase();return st!=='INACTIVE' && st!=='DISABLED' && st!=='NO_REPAIR' && st!=='WRITTEN_OFF' && !isService(a)}
  function isActiveService(s){return Number(s && s.active==null?1:s&&s.active)!==0 && String(s&&s.active||'1')!=='false'}
  function ensureModal(){
    var oldBackdrop=byId('gfIssueBackdrop'), oldModal=byId('gfIssueModal');
    if(!oldBackdrop || !oldModal){
      if(oldBackdrop) oldBackdrop.remove();
      if(oldModal) oldModal.remove();
      document.body.insertAdjacentHTML('beforeend','<div id="gfIssueBackdrop" class="assetEditBackdrop gfIssueBackdropSafe"></div><div id="gfIssueModal" class="gfIssueModal gfIssueModalSafe" role="dialog" aria-modal="true"><div class="assetEditHead"><div><h2>Novo tipo de problema</h2><small>Escolha equipamento/serviço, prioridade e status. Será salvo somente na empresa logada.</small></div><button class="assetEditClose" type="button" data-gf-close-issue>×</button></div><div class="assetEditBody"><div class="gfIssueCreateGrid"><label>Tipo<select id="gfIssueKind"><option value="EQUIPMENT">Equipamento</option><option value="SERVICE">Serviço</option></select></label><label>Equipamento/serviço<select id="gfIssueItem"><option value="">Carregando...</option></select></label><label>Nome do problema<input id="gfIssueName" autocomplete="off" placeholder="Ex: Não liga / Vazamento / Sem internet"></label><label>Prioridade<select id="gfIssuePriority"><option value="HIGH">Alta</option><option value="MEDIUM" selected>Média</option><option value="LOW">Baixa</option></select></label><label>Status<select id="gfIssueActive"><option value="1" selected>Ativo</option><option value="0">Inativo</option></select></label></div></div><div class="assetEditFoot"><button class="btn btnLight" type="button" data-gf-close-issue>Cancelar</button><button class="btn btnDark" type="button" data-gf-save-issue>Cadastrar problema</button></div></div>');
    }
    var modal=byId('gfIssueModal'), backdrop=byId('gfIssueBackdrop'), kind=byId('gfIssueKind');
    if(backdrop){
      backdrop.classList.add('gfIssueBackdropSafe');
      backdrop.onclick=null;
      backdrop.onmousedown=null;
      backdrop.onmouseup=null;
      backdrop.ontouchstart=null;
    }
    if(modal){
      modal.classList.add('gfIssueModalSafe');
      modal.onclick=function(e){e.stopPropagation();};
      modal.onmousedown=function(e){e.stopPropagation();};
      modal.onmouseup=function(e){e.stopPropagation();};
      modal.ontouchstart=function(e){e.stopPropagation();};
    }
    if(kind && !kind.dataset.gfV5Bound){kind.dataset.gfV5Bound='1'; kind.addEventListener('change',function(){fillItems(this.value);});}
    document.querySelectorAll('[data-gf-close-issue]').forEach(function(b){if(!b.dataset.gfV5Bound){b.dataset.gfV5Bound='1';b.addEventListener('click',function(e){e.preventDefault();e.stopPropagation();closeIssueModal();});}});
    var save=document.querySelector('[data-gf-save-issue]');
    if(save && !save.dataset.gfV5Bound){save.dataset.gfV5Bound='1';save.addEventListener('click',function(e){e.preventDefault();e.stopPropagation();saveIssueModal();});}
  }
  async function preload(force){
    var now=Date.now();
    if(!force && cache.loading) return cache.loading;
    if(!force && cache.assets && cache.services && (now-cache.at)<120000) return cache;
    if(Array.isArray(window.assets)&&window.assets.length) cache.assets=window.assets;
    if(Array.isArray(window.serviceGroupsCache)&&window.serviceGroupsCache.length) cache.services=window.serviceGroupsCache;
    if(Array.isArray(window.gfIssueServiceGroups)&&window.gfIssueServiceGroups.length) cache.services=window.gfIssueServiceGroups;
    if(Array.isArray(window.issues)&&window.issues.length) cache.issues=window.issues;
    cache.loading=Promise.allSettled([
      cache.assets?Promise.resolve({assets:cache.assets}):getJson(API_ROOT+'/api/admin/assets'),
      cache.services?Promise.resolve({services:cache.services}):getJson(API_ROOT+'/api/admin/service-groups'),
      cache.issues?Promise.resolve({issues:cache.issues}):getJson(API_ROOT+'/api/admin/issues')
    ]).then(function(rs){
      var a=rs[0].value||{}, s=rs[1].value||{}, i=rs[2].value||{};
      cache.assets=Array.isArray(a.assets)?a.assets:(cache.assets||[]);
      cache.services=Array.isArray(s.services)?s.services:(cache.services||[]);
      cache.issues=Array.isArray(i.issues)?i.issues:(cache.issues||[]);
      window.assets=cache.assets; try{assets=cache.assets}catch(e){}
      window.serviceGroupsCache=cache.services.slice(); window.gfIssueServiceGroups=cache.services.slice();
      window.issues=cache.issues; try{issues=cache.issues}catch(e){}
      cache.at=Date.now(); cache.loading=null; return cache;
    }).catch(function(){cache.loading=null; return cache;});
    return cache.loading;
  }
  function uniqueByName(rows){var seen={};return rows.filter(function(x){var k=key(x&&x.name); if(!k||seen[k]) return false; seen[k]=1; return true;});}
  function fallbackFromIssues(){
    var rows=(cache.issues||window.issues||[]).slice(); var seen={}; var out=[];
    rows.forEach(function(i){var n=String(i&&i.asset_name||'').trim(); var k=key(n); if(k&&!seen[k]){seen[k]=1; out.push({name:n,status:'ACTIVE'});}});
    return out;
  }
  function fillItems(kind){
    var sel=byId('gfIssueItem'); if(!sel) return;
    kind=String(kind||'EQUIPMENT').toUpperCase();
    if(kind==='SERVICE'){
      var sv=(cache.services||window.gfIssueServiceGroups||window.serviceGroupsCache||[]).slice().filter(isActiveService).sort(function(a,b){return String(a.name||'').localeCompare(String(b.name||''),'pt-BR')});
      sel.innerHTML=sv.length?sv.map(function(s){return '<option value="'+esc(s.name||'')+'">'+esc(s.name||'-')+'</option>';}).join(''):'<option value="">Nenhum serviço ativo encontrado</option>';
      return;
    }
    var eq=uniqueByName((cache.assets||window.assets||[]).slice().filter(isActiveAsset));
    if(!eq.length) eq=uniqueByName(fallbackFromIssues());
    eq=eq.sort(function(a,b){return String(a.name||'').localeCompare(String(b.name||''),'pt-BR')});
    sel.innerHTML=eq.length?eq.map(function(a){return '<option value="'+esc(a.name||'')+'">'+esc(a.name||'-')+'</option>';}).join(''):'<option value="">Nenhum equipamento ativo encontrado</option>';
  }
  window.openIssueModal=function(){
    if(typeof guardAction==='function' && !guardAction('admin')) return;
    ensureModal();
    var kind=byId('gfIssueKind'), item=byId('gfIssueItem'), name=byId('gfIssueName'), pri=byId('gfIssuePriority'), active=byId('gfIssueActive');
    if(kind) kind.value='EQUIPMENT';
    if(item) item.innerHTML='<option value="">Carregando equipamentos...</option>';
    if(name) name.value='';
    if(pri) pri.value='MEDIUM';
    if(active) active.value='1';
    var bd=byId('gfIssueBackdrop'), md=byId('gfIssueModal');
    if(bd) bd.classList.add('show');
    if(md) md.classList.add('show');
    document.body.classList.add('gf-issue-modal-open');
    fillItems('EQUIPMENT');
    preload(false).then(function(){ if(byId('gfIssueModal')&&byId('gfIssueModal').classList.contains('show')) fillItems(byId('gfIssueKind')&&byId('gfIssueKind').value||'EQUIPMENT'); });
    setTimeout(function(){try{name&&name.focus({preventScroll:true})}catch(e){}},120);
  };
  window.closeIssueModal=function(){
    var bd=byId('gfIssueBackdrop'), md=byId('gfIssueModal');
    if(bd) bd.classList.remove('show');
    if(md) md.classList.remove('show');
    document.body.classList.remove('gf-issue-modal-open');
  };
  document.addEventListener('keydown',function(e){if(e.key==='Escape' && byId('gfIssueModal')&&byId('gfIssueModal').classList.contains('show')) closeIssueModal();},true);
  setTimeout(function(){preload(false)},1200);
})();

(function(){
  if(window.__gfIssueKeepOpenV8) return;
  window.__gfIssueKeepOpenV8 = true;
  var openKeys = window.__gfIssueOpenKeys || (window.__gfIssueOpenKeys = {});
  function norm(v){return String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().replace(/[^A-Z0-9]+/g,' ').trim().replace(/\s+/g,'')}
  function getKey(block){
    if(!block) return '';
    var b = block.querySelector('.gfIssueProblemHead b');
    return norm(b ? b.textContent : block.textContent);
  }
  document.addEventListener('click', function(ev){
    var head = ev.target && ev.target.closest ? ev.target.closest('.gfIssueProblemHead') : null;
    if(!head) return;
    var block = head.closest('.gfIssueProblemBlock');
    var k = getKey(block);
    if(!k) return;
    setTimeout(function(){ openKeys[k] = !!(block && block.classList.contains('open')); }, 0);
  }, true);
  function restore(){
    document.querySelectorAll('#issuesBody .gfIssueProblemBlock').forEach(function(block){
      var k = getKey(block);
      if(k && openKeys[k]) block.classList.add('open');
    });
  }
  document.addEventListener('gf:issues-rendered', function(){ restore(); setTimeout(restore,40); });

  window.updateIssue = async function(id, active){
    if(typeof guardAction === 'function' && !guardAction('admin')) return;
    var original = findIssue(id);
    var assetInput = byId('ia' + id);
    var nameInput = byId('in' + id);
    var priInput = byId('ip' + id);

    var assetName = String((assetInput && assetInput.value) || original.asset_name || '').trim();
    var problem = String((nameInput && nameInput.value) || original.name || '').trim();
    var priority = String((priInput && priInput.value) || original.priority || 'MEDIUM').toUpperCase();
    var newActive = !!active;

    if(!assetName){ alert('Selecione o equipamento/serviço do problema.'); if(assetInput) assetInput.focus(); return; }
    if(!problem){ alert('Informe o nome do problema.'); if(nameInput) nameInput.focus(); return; }

    var btn = null;
    try{ btn = document.activeElement && document.activeElement.tagName === 'BUTTON' ? document.activeElement : null; }catch(e){}
    var oldTxt = btn ? btn.textContent : '';
    try{
      if(btn){ btn.disabled = true; btn.textContent = newActive ? 'Ativando...' : 'Desativando...'; }
      var body = { asset_name: assetName, name: problem, priority: priority, active: newActive };
      var r = await fetch(API_BASE + '/api/admin/issues/' + encodeURIComponent(id), {
        method:'PUT',
        headers:{ 'Content-Type':'application/json' },
        credentials:'include',
        cache:'no-store',
        body: JSON.stringify(body)
      });
      var j = await r.json().catch(function(){ return {}; });
      if(!r.ok || !j.ok){ alert(j.error || 'Erro ao atualizar tipo de problema'); return; }

      patchLocalIssue(id, { asset_name: assetName, name: problem, priority: priority, active: activeVal(newActive) });
      refreshIssuesScreen();

      try{ await fetchIssuesFresh(); }catch(e){}
      refreshIssuesScreen();
      try{ if(typeof toastMsg === 'function') toastMsg(newActive ? 'Problema ativado' : 'Problema desativado'); }catch(e){}
    }catch(e){
      alert('Erro de comunicação ao atualizar o tipo de problema.');
    }finally{
      if(btn){ btn.disabled = false; btn.textContent = oldTxt || (newActive ? 'Ativar' : 'Desativar'); }
    }
  };
})();

(function(){
  function gfApplyViewportMode(){
    var w = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0);
    document.body.classList.toggle('gf-mobile', w <= 700);
    document.body.classList.toggle('gf-tablet', w > 700 && w <= 1100);
    document.body.classList.toggle('gf-desktop', w > 1100);
    document.documentElement.style.setProperty('--gf-vw', w + 'px');
  }
  gfApplyViewportMode();
  window.addEventListener('resize', gfApplyViewportMode, {passive:true});
  window.addEventListener('orientationchange', gfApplyViewportMode, {passive:true});
})();


(function(){
  'use strict';
  if(window.__gfIaConfigInsideMainFix) return;
  window.__gfIaConfigInsideMainFix = true;

  function qs(sel){ return document.querySelector(sel); }
  function qsa(sel){ return Array.prototype.slice.call(document.querySelectorAll(sel)); }
  function cap(x){ x=String(x||''); return x.charAt(0).toUpperCase()+x.slice(1); }

  function moveIaConfigIntoMain(){
    var main = qs('.gfMainWrap');
    if(!main) return;
    ['pageIa','pageUsuarios'].forEach(function(id){
      var el = document.getElementById(id);
      if(el && el.parentElement !== main){
        main.appendChild(el);
      }
    });
  }

  function setActiveMenu(p){
    p = String(p || 'dashboard').toLowerCase();
    qsa('.gfSideItem,.gfSideSubItem,.tab').forEach(function(el){ el.classList.remove('active'); });
    var map = {
      dashboard: '#tabDashboard',
      operacao: '#tabOperacao',
      consulta: '#tabOperacao',
      ia: '#navIaGuara',
      usuarios: '#tabUsuarios',
      configuracoes: '#tabUsuarios',
      qrs: '#navCadQrs',
      cadastros: '#tabCadastros'
    };
    var el = qs(map[p] || '#tabDashboard');
    if(el) el.classList.add('active');
    if(p === 'qrs'){
      var cad = qs('#tabCadastros');
      if(cad) cad.classList.add('active');
      document.body.classList.add('gf-cad-sub-open');
    }
    if(p !== 'cadastros' && p !== 'qrs'){
      document.body.classList.remove('gf-cad-sub-open');
    }
  }

  function forcePage(p){
    p = String(p || 'dashboard').toLowerCase();
    if(p === 'consulta') p = 'operacao';
    if(p === 'configuracoes') p = 'usuarios';
    moveIaConfigIntoMain();
    ['dashboard','operacao','cadastros','qrs','ia','usuarios'].forEach(function(x){
      var page = document.getElementById('page' + cap(x));
      if(page){
        page.classList.toggle('hidden', x !== p);
        if(x === p){ page.style.display = ''; }
      }
    });
    if(p === 'ia' && typeof window.initGfAi === 'function'){
      try{ window.initGfAi(); }catch(e){}
    }
    if(p === 'usuarios' && typeof window.closeSettingsUsers === 'function'){
      try{ window.closeSettingsUsers(false); }catch(e){}
    }
    setActiveMenu(p);
  }


  // Proteção mobile: deslizar na barra de módulos não navega. Só clique/tap real abre.
  (function(){
    var sx=0, sy=0, moved=false;
    window.addEventListener('touchstart', function(ev){
      var t=ev.target && ev.target.closest && ev.target.closest('#gfUltimateMobileNav,[data-gf-ultimate-route]');
      if(!t) return;
      var p=ev.touches && ev.touches[0]; if(!p) return;
      sx=p.clientX; sy=p.clientY; moved=false;
    }, true);
    window.addEventListener('touchmove', function(ev){
      var t=ev.target && ev.target.closest && ev.target.closest('#gfUltimateMobileNav,[data-gf-ultimate-route]');
      if(!t) return;
      var p=ev.touches && ev.touches[0]; if(!p) return;
      if(Math.abs(p.clientX-sx)>10 || Math.abs(p.clientY-sy)>10) moved=true;
    }, true);
    window.addEventListener('touchend', function(ev){
      var t=ev.target && ev.target.closest && ev.target.closest('#gfUltimateMobileNav,[data-gf-ultimate-route]');
      if(!t) return;
      if(moved){ ev.stopImmediatePropagation(); ev.stopPropagation(); return; }
    }, true);
  })();

  function boot(){
    moveIaConfigIntoMain();
    var ia = document.getElementById('navIaGuara');
    var cfg = document.getElementById('tabUsuarios');
    if(ia && !ia.dataset.gfIaConfigDirect){
      ia.dataset.gfIaConfigDirect = '1';
      ia.onclick = function(ev){ if(ev) ev.preventDefault(); window.showPage('ia'); return false; };
    }
    if(cfg && !cfg.dataset.gfIaConfigDirect){
      cfg.dataset.gfIaConfigDirect = '1';
      cfg.onclick = function(ev){ if(ev) ev.preventDefault(); window.showPage('usuarios'); return false; };
    }
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
  window.addEventListener('load', boot, {passive:true});
})();


/* GF CLEAN: bloco antigo gfCadastrosToggleFixV7 removido para acabar com submenu/duplicidade. */


(function(){
  if(window.__gfAppFastCacheFinal) return;
  window.__gfAppFastCacheFinal = true;

  var TTL = 1000 * 60 * 10; // 10 minutos: mostra rápido e atualiza em segundo plano
  function key(k){
    var company = (window.GF_COMPANY && (window.GF_COMPANY.slug || window.GF_COMPANY.id)) || sessionStorage.getItem('GF_COMPANY_SLUG') || 'default';
    return 'gf_fast_cache_v1_' + company + '_' + k;
  }
  function read(k){
    try{
      var raw = sessionStorage.getItem(key(k));
      if(!raw) return null;
      var obj = JSON.parse(raw);
      if(!obj || !obj.data) return null;
      return obj;
    }catch(e){ return null; }
  }
  function write(k,data){
    try{ sessionStorage.setItem(key(k), JSON.stringify({ts:Date.now(), data:data})); }catch(e){}
  }
  function clear(k){ try{ sessionStorage.removeItem(key(k)); }catch(e){} }
  function clearAll(){ ['sectors','assets_all','issues'].forEach(clear); try{ Object.keys(sessionStorage).forEach(function(k){ if(k.indexOf('gf_fast_cache_v1_')===0 && k.indexOf('_assets_')>-1) sessionStorage.removeItem(k); }); }catch(e){} }
  function isFresh(obj){ return obj && obj.ts && (Date.now() - obj.ts < TTL); }
  async function jsonFetch(url){
    var r = await fetch(url,{credentials:'include'});
    if(r.status===401){ location.href='/login'; return {}; }
    return await r.json();
  }

  var nativeFetch = window.fetch;
  if(nativeFetch && !nativeFetch.__gfAppFastCacheFinal){
    var wrappedFetch = async function(input, init){
      var method = String((init && init.method) || (input && input.method) || 'GET').toUpperCase();
      var url = String((typeof input === 'string' ? input : (input && input.url)) || '');
      var resp = await nativeFetch.apply(this, arguments.length===1 ? [input] : [input, init]);
      try{
        if(method !== 'GET' && /\/api\/admin\/(sectors|assets|issues|services|qrcodes)/.test(url)) clearAll();
      }catch(e){}
      return resp;
    };
    wrappedFetch.__gfAppFastCacheFinal = true;
    window.fetch = wrappedFetch;
  }

  async function loadSectorsFast(opts){
    opts = opts || {};
    var cached = read('sectors');
    if(cached && !opts.force){
      try{
        window.sectors = sectors = cached.data.sectors || [];
        if(window.assetSector) assetSector.innerHTML = optSectors();
        if(window.assetFilterSector) assetFilterSector.innerHTML = '<option value="">Todos setores</option>' + optSectors();
        if(typeof renderSectors === 'function') renderSectors();
      }catch(e){}
      if(isFresh(cached)) return;
    }
    try{
      var j = await jsonFetch(API + '/api/admin/sectors');
      write('sectors', j || {});
      window.sectors = sectors = (j && j.sectors) || [];
      if(window.assetSector) assetSector.innerHTML = optSectors();
      if(window.assetFilterSector) assetFilterSector.innerHTML = '<option value="">Todos setores</option>' + optSectors();
      if(typeof renderSectors === 'function') renderSectors();
    }catch(e){ console.warn('loadSectorsFast', e); }
  }

  async function loadAssetsFast(opts){
    opts = opts || {};
    var sid = '';
    try{ sid = (window.assetFilterSector && assetFilterSector.value) || ''; }catch(e){}
    var ck = sid ? ('assets_' + sid) : 'assets_all';
    var cached = read(ck);
    if(cached && !opts.force){
      try{
        window.assets = assets = cached.data.assets || [];
        if(typeof renderAssets === 'function') renderAssets();
      }catch(e){}
      if(isFresh(cached)) return;
    }
    try{
      var url = API + '/api/admin/assets' + (sid ? '?sector_id=' + encodeURIComponent(sid) : '');
      var j = await jsonFetch(url);
      write(ck, j || {});
      if(!sid) write('assets_all', j || {});
      window.assets = assets = (j && j.assets) || [];
      if(typeof renderAssets === 'function') renderAssets();
    }catch(e){ console.warn('loadAssetsFast', e); }
  }

  async function loadIssuesFast(opts){
    opts = opts || {};
    var cached = read('issues');
    if(cached && !opts.force){
      try{
        window.issues = issues = cached.data.issues || [];
        if(!window.issueFilterAssetsLoaded && typeof refreshIssueFilterAssets === 'function') refreshIssueFilterAssets();
        if(document.getElementById('pageCadastros')?.classList.contains('cadastro-show-problemas') && typeof renderIssues === 'function') renderIssues();
      }catch(e){}
      if(isFresh(cached)) return;
    }
    try{
      var j = await jsonFetch(API + '/api/admin/issues');
      write('issues', j || {});
      window.issues = issues = (j && j.issues) || [];
      if(!window.issueFilterAssetsLoaded && typeof refreshIssueFilterAssets === 'function') refreshIssueFilterAssets();
      if(document.getElementById('pageCadastros')?.classList.contains('cadastro-show-problemas') && typeof renderIssues === 'function') renderIssues();
    }catch(e){ console.warn('loadIssuesFast', e); }
  }

  try{ if(window.cadLimit) cadLimit.issues = 999999; }catch(e){}
  window.gfInvalidateFastCache = clearAll;
  window.loadSectors = loadSectors = loadSectorsFast;
  window.loadAssets = loadAssets = loadAssetsFast;
  window.loadIssues = loadIssues = loadIssuesFast;
  window.loadRegisters = loadRegisters = async function(){
    // Cadastros abre leve: não carrega setores, equipamentos, serviços ou problemas na abertura do site.
    // Cada módulo carrega seus dados somente quando o usuário abre.
    return true;
  };

  function warmUp(){
    // Sem pré-carregamento pesado no celular/PC. Os módulos carregam sob demanda.
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', warmUp, {once:true});
  else warmUp();
})();

(function(){
  if(document.getElementById('gfOperationConsultaCssV54'))return;
  var st=document.createElement('style');
  st.id='gfOperationConsultaCssV54';
  st.textContent=`
    html.gfOcModalOpen, body.gfOcModalOpenBody{overflow:hidden!important;}
    body > #gfOcModalBg.gfOcModalBg.show{
      position:fixed!important;
      inset:0!important;
      display:block!important;
      width:100vw!important;
      height:100dvh!important;
      background:rgba(15,23,42,.58)!important;
      z-index:2147483000!important;
      pointer-events:auto!important;
    }
    body > #gfOcModal.gfOcModal.show{
      position:fixed!important;
      display:flex!important;
      visibility:visible!important;
      opacity:1!important;
      left:50%!important;
      top:50%!important;
      right:auto!important;
      bottom:auto!important;
      transform:translate(-50%,-50%)!important;
      width:min(92vw,1400px)!important;
      max-width:1400px!important;
      height:auto!important;
      max-height:88dvh!important;
      min-height:260px!important;
      overflow:hidden!important;
      background:#fff!important;
      border-radius:24px!important;
      box-shadow:0 32px 100px rgba(0,0,0,.38)!important;
      z-index:2147483001!important;
      flex-direction:column!important;
      pointer-events:auto!important;
    }
    body > #gfOcModal .gfOcModalHead{flex:0 0 auto!important;padding:14px 18px!important;min-height:58px!important;background:#fff!important;border-bottom:1px solid #dbe8f6!important;}
    body > #gfOcModal #gfOcModalBody{flex:1 1 auto!important;min-height:0!important;max-height:calc(88dvh - 72px)!important;overflow:auto!important;padding:12px 16px 16px!important;background:#f4f8ff!important;}
    body > #gfOcModal #gfOcModalBody>.gfOcTrace,
    body > #gfOcModal #gfOcModalBody>.gfOcTraceCompact{margin-top:0!important;margin-bottom:10px!important;}
    @media(max-width:720px){
      body > #gfOcModal.gfOcModal.show{left:0!important;top:0!important;right:0!important;bottom:0!important;transform:none!important;width:100vw!important;max-width:none!important;height:100dvh!important;max-height:none!important;border-radius:0!important;}
      body > #gfOcModal #gfOcModalBody{max-height:none!important;padding:10px!important;}
    }
  `;
  document.head.appendChild(st);
})();

(function(){
  'use strict';
  if(window.__GF_FIX_20260613_ADMIN__) return;
  window.__GF_FIX_20260613_ADMIN__ = true;

  function n(v){ var x=Number(String(v||'').replace(/^#/,'')); return Number.isFinite(x)&&x>0?x:0; }
  function api(){ return (typeof API!=='undefined' && API) ? API : window.location.origin; }
  function byId(id){ return document.getElementById(id); }
  function toast(txt){ try{ if(typeof toastMsg==='function') toastMsg(txt); else console.log(txt); }catch(e){ console.log(txt); } }
  function fail(msg){ alert(msg || 'Não foi possível concluir.'); }
  function currentAssets(){ try{ return Array.isArray(window.assets)?window.assets:(Array.isArray(assets)?assets:[]); }catch(e){ return []; } }
  function currentIssues(){ try{ return Array.isArray(window.issues)?window.issues:(Array.isArray(issues)?issues:[]); }catch(e){ return []; } }
  function setBtnBusy(btn,busy,label){
    if(!btn) return;
    if(busy){ btn.dataset.gfOldText = btn.textContent || ''; btn.disabled = true; btn.classList.add('gfBtnBusy'); btn.textContent = label || 'Salvando...'; }
    else { btn.disabled = false; btn.classList.remove('gfBtnBusy'); if(btn.dataset.gfOldText) btn.textContent = btn.dataset.gfOldText; delete btn.dataset.gfOldText; }
  }
  async function jsonFetch(url,opts){
    var r = await fetch(url, Object.assign({credentials:'include',cache:'no-store'}, opts||{}));
    var j = await r.json().catch(function(){ return {ok:false,error:'Resposta inválida do servidor'}; });
    if(r.status===401){ location.href='/login'; return j; }
    if(!r.ok || j.ok===false) throw new Error(j.error || 'Falha na operação');
    return j;
  }

  async function openTicketStable(id){
    var key=n(id); if(!key) return;
    try{
      if(typeof window.openDrawer==='function'){
        await window.openDrawer(key);
        return;
      }
    }catch(e){ console.warn('openDrawer falhou, tentando rota direta', e); }
    try{
      var t = null;
      if(typeof window.fetchTicketByKey==='function') t = await window.fetchTicketByKey(key);
      if(t && typeof window.fillDrawerTicket==='function') window.fillDrawerTicket(t);
      else fail('Não foi possível abrir este chamado.');
    }catch(err){ fail(err.message || 'Não foi possível abrir este chamado.'); }
  }
  window.gfOpenTicketStable = openTicketStable;

  document.addEventListener('click', function(ev){
    var target = ev.target;
    if(!target || !target.closest) return;
    if(target.closest('[data-gf-assume-ticket],[data-gf-resolve-ticket],button:not([data-gf-open-ticket]),a,input,textarea,select,label')) return;
    var el = target.closest('[data-gf-open-ticket], tr.ticketClickable[data-ticket-id], .ticketClickable[data-ticket-id], .v9FilterItem[data-ticket-id], .gfTicketCard[data-ticket-id], .gfV216Card[data-ticket-id]');
    if(!el) return;
    var id = el.getAttribute('data-gf-open-ticket') || el.getAttribute('data-gf-ticket-id') || el.getAttribute('data-ticket-id');
    id = n(id);
    if(!id) return;
    ev.preventDefault(); ev.stopPropagation(); if(ev.stopImmediatePropagation) ev.stopImmediatePropagation();
    openTicketStable(id);
  }, true);

  document.addEventListener('click', function(ev){
    var btn = ev.target && ev.target.closest && ev.target.closest('[data-gf-open-ticket]');
    if(!btn) return;
    var id=n(btn.getAttribute('data-gf-open-ticket'));
    if(!id) return;
    ev.preventDefault(); ev.stopPropagation(); if(ev.stopImmediatePropagation) ev.stopImmediatePropagation();
    openTicketStable(id);
  }, true);

  window.toggleAsset = async function(id,status){
    if(typeof guardAction==='function' && !guardAction('admin')) return;
    var btn = event && event.target && event.target.closest ? event.target.closest('button') : null;
    setBtnBusy(btn,true,'Salvando...');
    try{
      id=n(id); status=String(status||'INACTIVE').toUpperCase();
      var old=currentAssets().find(function(a){return Number(a.id)===id;});
      if(!old) throw new Error('Equipamento não encontrado na tela. Atualize os cadastros.');
      var body=Object.assign({},old,{status:status});
      if(status==='INACTIVE') body.sector_id = old.sector_id || null;
      await jsonFetch(api()+'/api/admin/assets/'+encodeURIComponent(id),{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
      old.status=status;
      if(typeof window.renderAssets==='function') window.renderAssets();
      if(typeof window.loadAssets==='function') await window.loadAssets();
      toast(status==='ACTIVE'?'Equipamento ativado.':'Equipamento inativado.');
    }catch(err){ fail(err.message); }
    finally{ setBtnBusy(btn,false); }
  };

  window.updateIssue = async function(id,active){
    if(typeof guardAction==='function' && !guardAction('admin')) return;
    var btn = event && event.target && event.target.closest ? event.target.closest('button') : null;
    setBtnBusy(btn,true,'Salvando...');
    try{
      id=n(id);
      var original=currentIssues().find(function(x){return Number(x.id)===id;}) || {};
      var assetInput=byId('ia'+id), nameInput=byId('in'+id), pri=byId('ip'+id);
      var assetName=String((assetInput&&assetInput.value)||original.asset_name||'').trim();
      var name=String((nameInput&&nameInput.value)||original.name||'').trim();
      if(!assetName) throw new Error('Informe o equipamento/serviço do problema.');
      if(!name) throw new Error('Informe o nome do problema.');
      await jsonFetch(api()+'/api/admin/issues/'+encodeURIComponent(id),{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({asset_name:assetName,name:name,priority:(pri&&pri.value)||original.priority||'MEDIUM',active:!!active})});
      original.active = active ? 1 : 0;
      original.asset_name = assetName; original.name = name; original.priority = (pri&&pri.value)||original.priority||'MEDIUM';
      if(typeof window.renderIssues==='function') window.renderIssues();
      if(typeof window.loadIssues==='function') await window.loadIssues();
      toast(active?'Problema ativado.':'Problema inativado.');
    }catch(err){ fail(err.message); }
    finally{ setBtnBusy(btn,false); }
  };

  window.toggleServiceGroupActive = async function(key,active){
    if(typeof guardAction==='function' && !guardAction('admin')) return;
    var btn = event && event.target && event.target.closest ? event.target.closest('button') : null;
    setBtnBusy(btn,true,'Salvando...');
    try{
      key=String(key||'').trim();
      if(!key) throw new Error('Serviço inválido.');
      await jsonFetch(api()+'/api/admin/service-groups/'+encodeURIComponent(key)+'/active',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({active:!!Number(active)})});
      try{ if(Array.isArray(window.serviceGroupsCache)){ window.serviceGroupsCache.forEach(function(g){ if(String(g.service_key||g.name)===key) g.active=!!Number(active); }); } }catch(e){}
      if(typeof window.loadAssets==='function') await window.loadAssets();
      else if(typeof window.renderAssets==='function') window.renderAssets();
      toast(Number(active)?'Serviço ativado.':'Serviço inativado.');
    }catch(err){ fail(err.message); }
    finally{ setBtnBusy(btn,false); }
  };
})();

(function(){
  'use strict';
  if(window.__GF_TICKET_MODAL_FIX_FINAL__) return;
  window.__GF_TICKET_MODAL_FIX_FINAL__ = true;

  function n(v){
    var raw = String(v == null ? '' : v).trim().replace(/^#/, '');
    var num = Number(raw);
    return Number.isFinite(num) && num > 0 ? num : 0;
  }
  function pool(){
    var out=[];
    try{ if(Array.isArray(window.tickets)) out=out.concat(window.tickets); }catch(e){}
    try{ if(typeof tickets !== 'undefined' && Array.isArray(tickets)) out=out.concat(tickets); }catch(e){}
    try{ if(Array.isArray(window.dashboardAllTickets)) out=out.concat(window.dashboardAllTickets); }catch(e){}
    try{ if(Array.isArray(window.dashboardOpenTickets)) out=out.concat(window.dashboardOpenTickets); }catch(e){}
    try{ if(window.gfDashboardFilterRowsById) Object.keys(window.gfDashboardFilterRowsById).forEach(function(k){ out.push(window.gfDashboardFilterRowsById[k]); }); }catch(e){}
    var seen={}, clean=[];
    out.forEach(function(t){
      var id=n(t && (t.id || t.ticket_id));
      if(id && !seen[id]){ seen[id]=1; clean.push(t); }
    });
    return clean;
  }
  function findLocalById(id){
    id=n(id);
    return pool().find(function(t){ return n(t && (t.id || t.ticket_id)) === id; }) || null;
  }
  function findLocalByNumber(no){
    no=n(no);
    return pool().find(function(t){ return n(t && t.ticket_number) === no; }) || null;
  }
  function upsert(t){
    if(!t) return null;
    try{ if(typeof window.upsertTicketLocal === 'function') return window.upsertTicketLocal(t) || t; }catch(e){}
    try{ if(typeof upsertTicketLocal === 'function') return upsertTicketLocal(t) || t; }catch(e){}
    try{
      if(!Array.isArray(window.tickets)) window.tickets=[];
      var id=n(t.id || t.ticket_id);
      var i=window.tickets.findIndex(function(x){ return n(x && (x.id || x.ticket_id)) === id; });
      if(i>=0) window.tickets[i]=Object.assign({}, window.tickets[i], t);
      else window.tickets.unshift(t);
    }catch(e){}
    return t;
  }
  async function fetchJson(url){
    var r = await fetch(url, {credentials:'include', cache:'no-store'});
    if(r.status === 401){ location.href='/login'; return null; }
    if(!r.ok) return null;
    var j = await r.json().catch(function(){ return null; });
    if(!j || j.ok === false) return null;
    return j.ticket || (Array.isArray(j.tickets) ? j.tickets[0] : null);
  }
  async function fetchTicketExact(id){
    id=n(id); if(!id) return null;
    var urls=[API + '/api/admin/tickets/by-db-id/' + encodeURIComponent(id)];
    for(var i=0;i<urls.length;i++){
      try{
        var t=await fetchJson(urls[i]);
        if(t) return upsert(t);
      }catch(e){ console.warn('Falha ao buscar chamado:', urls[i], e); }
    }
    return null;
  }
  function showTicket(t){
    if(!t) return false;
    try{
      if(typeof window.fillDrawerTicket === 'function') window.fillDrawerTicket(t);
      else if(typeof fillDrawerTicket === 'function') fillDrawerTicket(t);
      else if(typeof window.openDrawer === 'function' && !window.openDrawer.__gfTicketFixFinal) window.openDrawer(n(t.id||t.ticket_id));
      document.body.classList.add('gf-detail-open');
      var drawer=document.getElementById('drawer');
      var bg=document.getElementById('drawerBg');
      if(bg) bg.classList.add('show');
      if(drawer){
        drawer.classList.add('show');
        var body=drawer.querySelector('.drawerBody');
        if(body) body.scrollTop=0;
        drawer.scrollTop=0;
      }
      return true;
    }catch(e){ console.error('Erro ao preencher detalhe do chamado:', e); return false; }
  }
  async function openCanonical(raw){
    var id=n(raw);
    if(!id){ alert('Chamado inválido.'); return null; }

    try{ if(window.gfSaveDashboardModalContext) window.gfSaveDashboardModalContext(); }catch(e){}

    var local=findLocalById(id);
    if(!local){
      var byNo=findLocalByNumber(id);
      if(byNo) { local=byNo; id=n(byNo.id || byNo.ticket_id); }
    }
    var full=await fetchTicketExact(id);
    if(full){ showTicket(full); return full; }

    if(local){ showTicket(local); return local; }
    alert('Não foi possível abrir este chamado. Atualize a tela e tente novamente.');
    return null;
  }
  openCanonical.__gfTicketFixFinal = true;

  window.gfOpenTicketCanonical = openCanonical;
  window.gfOpenTicketStable = openCanonical;
  window.openDrawer = openCanonical;
  try{ openDrawer = openCanonical; }catch(e){}
  window.openTicketFromDashboard = openCanonical;
  try{ openTicketFromDashboard = openCanonical; }catch(e){}
  window.openTicketFromHistory = openCanonical;
  try{ openTicketFromHistory = openCanonical; }catch(e){}
  window.openTicket = openCanonical;

  function idFromElement(el){
    if(!el || !el.getAttribute) return 0;
    var raw = el.getAttribute('data-gf-open-ticket') || el.getAttribute('data-gf-ticket-id') || el.getAttribute('data-ticket-id');
    var id=n(raw);
    if(id) return id;
    try{
      var child=el.querySelector('[data-gf-open-ticket],[data-gf-ticket-id],[data-ticket-id]');
      if(child) return n(child.getAttribute('data-gf-open-ticket') || child.getAttribute('data-gf-ticket-id') || child.getAttribute('data-ticket-id'));
    }catch(e){}
    try{
      var m=String(el.textContent||'').match(/#\s*(\d+)/);
      if(m){
        var t=findLocalByNumber(m[1]);
        if(t) return n(t.id || t.ticket_id);
      }
    }catch(e){}
    return 0;
  }

  var lastId=0,lastAt=0;
  document.addEventListener('click', function(ev){
    var target=ev.target;
    if(!target || !target.closest) return;
    if(target.closest('input,textarea,select,label,.exportMenuWrap,.exportMenuPanel')) return;
    if(target.closest('[data-gf-assume-ticket],[data-gf-resolve-ticket]')) return;
    var el=target.closest('[data-gf-open-ticket],tr.ticketClickable[data-ticket-id],.ticketClickable[data-ticket-id],.trackTicketClickable[data-ticket-id],.historyItem[data-ticket-id],.v9FilterItem[data-ticket-id],.v9FilterItem[data-gf-ticket-id],.v9Ticket[data-ticket-id],.gfTicketCard[data-ticket-id],.gfTicketCard[data-gf-ticket-id],.gfV216Card[data-ticket-id],.gfV216Card[data-gf-ticket-id]');
    if(!el) return;
    if(target.closest('button,a') && !target.closest('[data-gf-open-ticket]')) return;
    var id=idFromElement(el);
    if(!id) return;
    ev.preventDefault(); ev.stopPropagation(); if(ev.stopImmediatePropagation) ev.stopImmediatePropagation();
    var now=Date.now();
    if(lastId===id && now-lastAt<500) return;
    lastId=id; lastAt=now;
    openCanonical(id);
  }, true);

  var oldClose = window.closeDrawer || (typeof closeDrawer==='function' ? closeDrawer : null);
  window.closeDrawer = function(){
    try{ document.body.classList.remove('gf-detail-open'); }catch(e){}
    if(typeof oldClose === 'function') return oldClose.apply(this, arguments);
    var drawer=document.getElementById('drawer');
    var bg=document.getElementById('drawerBg');
    if(drawer) drawer.classList.remove('show');
    if(bg) bg.classList.remove('show');
  };
  try{ closeDrawer = window.closeDrawer; }catch(e){}
})();

(function(){
  function syncDashboardFilterOpen(){
    try{
      var dd=document.getElementById('dashboardFilterDrawer');
      document.body.classList.toggle('gf-dashboard-filter-open', !!(dd && dd.classList.contains('show')));
    }catch(e){}
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', syncDashboardFilterOpen);
  else syncDashboardFilterOpen();
  try{
    var dd=document.getElementById('dashboardFilterDrawer');
    if(dd){ new MutationObserver(syncDashboardFilterOpen).observe(dd,{attributes:true,attributeFilter:['class']}); }
  }catch(e){}
  document.addEventListener('click', function(){ setTimeout(syncDashboardFilterOpen,0); }, true);
})();

(function(){
  if(window.__gfMobileUsabilityFinal) return;
  window.__gfMobileUsabilityFinal = true;

  function isMobile(){ return window.matchMedia && window.matchMedia('(max-width:700px)').matches; }

  document.addEventListener('pointerdown', function(ev){
    if(!isMobile()) return;
    var el = ev.target && ev.target.closest && ev.target.closest('button,.btn,a,.tab,[onclick],.v8Kpi,.gfDashTicketCard');
    if(!el) return;
    try{ el.classList.add('gfTapNow'); }catch(e){}
  }, {capture:true, passive:true});

  document.addEventListener('pointerup', function(ev){
    if(!isMobile()) return;
    var el = ev.target && ev.target.closest && ev.target.closest('.gfTapNow');
    if(!el) return;
    setTimeout(function(){ try{ el.classList.remove('gfTapNow'); }catch(e){} }, 90);
  }, {capture:true, passive:true});

  window.addEventListener('pageshow', function(){
    try{ document.body.classList.remove('gf-dashboard-filter-open'); }catch(e){}
  }, {passive:true});
})();

(function(){
  if(window.__gfMobilePerfDefinitivo) return;
  window.__gfMobilePerfDefinitivo = true;

  function mobile(){ return window.matchMedia && window.matchMedia('(max-width:700px)').matches; }
  function shown(el){ return !!(el && el.classList && el.classList.contains('show')); }
  function byId(id){ return document.getElementById(id); }

  window.gfFastMobileDashboardPaint = function(){
    if(!mobile()) return;
    try{
      var rows = Array.isArray(window.dashboardAllTickets) ? window.dashboardAllTickets : [];
      if(!rows.length && Array.isArray(window.tickets)) rows = window.tickets;
      if(!rows.length) return;
      function st(t){ return String((t&&t.status)||'').toUpperCase(); }
      function done(t){ var s=st(t); return s==='DONE'||s==='RESOLVIDO'||s==='CLOSED'||s==='FINALIZADO'; }
      function openNew(t){ return !done(t) && st(t)==='NEW'; }
      function prog(t){ return !done(t) && st(t)==='IN_PROGRESS'; }
      function set(id,val){ var el=byId(id); if(el && el.textContent!==String(val)) el.textContent=String(val); }
      set('v8Open', rows.filter(openNew).length);
      set('v8Progress', rows.filter(prog).length);
      if(window.gfIsOpenNewCritical) set('v8Critical', rows.filter(window.gfIsOpenNewCritical).length);
      else set('v8Critical', rows.filter(openNew).length);
      set('v8DoneToday', rows.filter(done).length);
      if(window.renderDashboardV9Lists) requestAnimationFrame(function(){ try{ window.renderDashboardV9Lists(); }catch(e){} });
    }catch(e){}
  };

  function realModalOpen(){
    return shown(byId('drawer')) || shown(byId('dashboardFilterDrawer')) || shown(byId('historyDrawer')) ||
           shown(document.querySelector('.resolveBg')) || shown(document.querySelector('.assetEditBackdrop')) ||
           shown(document.querySelector('.history-modal-backdrop')) || shown(document.querySelector('.gf-modal-backdrop')) ||
           shown(document.querySelector('.gfImageViewerBg'));
  }

  function cleanBackdrop(){
    if(!mobile()) return;
    try{
      var bg = byId('drawerBg');
      var dd = byId('dashboardFilterDrawer');
      if(!bg) return;
      if(shown(dd)){
        document.body.classList.add('gf-dashboard-filter-open');
        bg.style.pointerEvents='none';
        bg.style.background='transparent';
        bg.style.backdropFilter='none';
        bg.style.webkitBackdropFilter='none';
        return;
      }
      document.body.classList.remove('gf-dashboard-filter-open');
      bg.style.pointerEvents='';
      bg.style.background='';
      bg.style.backdropFilter='';
      bg.style.webkitBackdropFilter='';
      if(shown(bg) && !realModalOpen()) bg.classList.remove('show');
    }catch(e){}
  }

  function fastAction(el){
    if(!el || el.__gfFastBusy) return false;
    el.__gfFastBusy = true;
    setTimeout(function(){ el.__gfFastBusy=false; }, 420);
    try{
      if(el.matches('[data-gf-open-ticket],[data-ticket-id],[data-gf-ticket-id]')){
        var id = el.getAttribute('data-gf-open-ticket') || el.getAttribute('data-gf-ticket-id') || el.getAttribute('data-ticket-id');
        id = Number(String(id||'').replace(/[^0-9]/g,''));
        if(id && window.gfOpenTicketCanonical){ window.gfOpenTicketCanonical(id); return true; }
      }
      if(el.matches('[data-gf-dash-type],#pageDashboard .v8Kpi')){
        var type = el.getAttribute('data-gf-dash-type') || '';
        if(type && window.dashboardFilter){ window.dashboardFilter(type); return true; }
      }
    }catch(e){}
    return false;
  }

  /* Clique mobile fica no evento click real. Não abrir no pointerup/touchend, pois no iPhone isso dispara ao terminar uma rolagem. */
  document.addEventListener('pointerup', function(ev){
    if(!mobile()) return;
    cleanBackdrop();
  }, {capture:true, passive:true});

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', function(){ cleanBackdrop(); window.gfFastMobileDashboardPaint(); }, {once:true});
  else { cleanBackdrop(); setTimeout(window.gfFastMobileDashboardPaint, 0); }
  window.addEventListener('pageshow', function(){ setTimeout(cleanBackdrop, 0); setTimeout(window.gfFastMobileDashboardPaint, 20); }, {passive:true});
  window.addEventListener('resize', cleanBackdrop, {passive:true});
  document.addEventListener('click', function(){ setTimeout(cleanBackdrop,0); }, true);
  setTimeout(cleanBackdrop, 1200);
})();

(function(){
  if(window.__gfMobileKpiListOnlyFix) return;
  window.__gfMobileKpiListOnlyFix = true;
  function mobile(){ return window.matchMedia && window.matchMedia('(max-width: 900px)').matches; }
  function kpiFrom(ev){ var t=ev&&ev.target; return t&&t.closest&&t.closest('#pageDashboard .v8Kpi[data-gf-dash-type]'); }
  document.addEventListener('click', function(ev){
    if(!mobile()) return;
    if(window.gfWasTouchScrollClick && window.gfWasTouchScrollClick()) return;
    var kpi=kpiFrom(ev);
    if(!kpi) return;
    var type=kpi.getAttribute('data-gf-dash-type')||'';
    if(!type || typeof window.dashboardFilter!=='function') return;
    ev.preventDefault(); ev.stopPropagation(); if(ev.stopImmediatePropagation) ev.stopImmediatePropagation();
    window.dashboardFilter(type);
  }, true);
})();

(function(){
  if(window.__gfInstantEngineV1) return;
  window.__gfInstantEngineV1=true;

  function now(){return Date.now();}
  function isGet(init){return String((init&&init.method)||'GET').toUpperCase()==='GET';}
  function urlOf(input){try{return typeof input==='string'?input:(input&&input.url)||'';}catch(e){return '';}}
  function cleanUrl(u){try{var a=document.createElement('a');a.href=u;return a.pathname+a.search;}catch(e){return String(u||'');}}
  function cacheInfo(u){
    var p=cleanUrl(u);
    if(/\/api\/admin\/dashboard-v8(?:\?|$)/.test(p)) return {key:'GF_FAST_dashboard_v8',ttl:15000};
    if(/\/api\/admin\/tickets\?[^#]*light=1/.test(p)) return {key:'GF_FAST_tickets_light',ttl:15000};
    if(/\/api\/admin\/sectors(?:\?|$)/.test(p)) return {key:'GF_FAST_sectors',ttl:60000};
    if(/\/api\/admin\/qrcodes(?:\?|$)/.test(p)) return {key:'GF_FAST_qrcodes',ttl:45000};
    if(/\/api\/admin\/assets(?:\?|$)/.test(p)) return {key:'GF_FAST_assets_'+p.replace(/[^a-z0-9]/gi,'_').slice(0,80),ttl:30000};
    if(/\/api\/admin\/issues(?:\?|$)/.test(p)) return {key:'GF_FAST_issues',ttl:45000};
    return null;
  }
  function readStore(k){
    try{var raw=sessionStorage.getItem(k)||localStorage.getItem(k)||''; if(!raw) return null; var j=JSON.parse(raw); if(!j||!j.text) return null; return j;}catch(e){return null;}
  }
  function writeStore(k,text){
    if(!text || text.length>2500000) return;
    var obj=JSON.stringify({at:now(),text:text});
    try{sessionStorage.setItem(k,obj);}catch(e){}
    try{localStorage.setItem(k,obj);}catch(e){}
  }
  function resp(text){return new Response(text,{status:200,headers:{'Content-Type':'application/json;charset=utf-8','X-GF-Instant':'cache'}});}
  function invalidateByUrl(u){
    try{
      var keys=['GF_FAST_dashboard_v8','GF_FAST_tickets_light','GF_DASHBOARD_V16_CACHE','GF_DASHBOARD_CACHE','GF_TICKETS_LIGHT_CACHE'];
      keys.forEach(function(k){sessionStorage.removeItem(k);localStorage.removeItem(k);});
      if(/\/assets|\/issues|\/sectors|\/qrcodes/.test(cleanUrl(u))){
        Object.keys(sessionStorage).forEach(function(k){if(/^GF_FAST_(assets|issues|sectors|qrcodes)/.test(k)) sessionStorage.removeItem(k);});
        Object.keys(localStorage).forEach(function(k){if(/^GF_FAST_(assets|issues|sectors|qrcodes)/.test(k)) localStorage.removeItem(k);});
      }
    }catch(e){}
  }

  var baseFetch=window.fetch;
  var inflight={};
  if(baseFetch && !baseFetch.__gfInstantWrapped){
    var fastFetch=function(input,init){
      init=init||{};
      var u=urlOf(input), method=String(init.method||'GET').toUpperCase();
      if(method!=='GET' && /\/api\/admin\//.test(cleanUrl(u))){
        return baseFetch.apply(this,arguments).then(function(r){ if(r&&r.ok) invalidateByUrl(u); return r; });
      }
      var info=(isGet(init)&&cacheInfo(u));
      if(!info) return baseFetch.apply(this,arguments);
      var cached=readStore(info.key);
      var fresh=cached && (now()-Number(cached.at||0) < info.ttl);
      var key=info.key+'::'+cleanUrl(u);
      function refresh(){
        if(inflight[key]) return inflight[key].then(function(r){return r.clone();});
        inflight[key]=baseFetch(input,init).then(function(r){
          try{ if(r&&r.ok){ r.clone().text().then(function(t){writeStore(info.key,t);}).catch(function(){}); } }catch(e){}
          return r;
        }).finally(function(){delete inflight[key];});
        return inflight[key].then(function(r){return r.clone();});
      }
      if(fresh){
        setTimeout(refresh,60);
        return Promise.resolve(resp(cached.text));
      }
      if(cached){
        return Promise.race([
          refresh(),
          new Promise(function(resolve){setTimeout(function(){resolve(resp(cached.text));},180);})
        ]);
      }
      return refresh();
    };
    fastFetch.__gfInstantWrapped=true;
    window.fetch=fastFetch;
  }

  function idle(fn,ms){ if('requestIdleCallback' in window) requestIdleCallback(fn,{timeout:ms||1200}); else setTimeout(fn,ms||400); }
  window.gfInstantPreload=function(){ if(window.gfIsMobileLiteV35 && window.gfIsMobileLiteV35()) return;
    try{
      var API=window.API||'';
      [API+'/api/admin/dashboard-v8',API+'/api/admin/tickets?light=1',API+'/api/admin/sectors'].forEach(function(u,i){
        setTimeout(function(){try{fetch(u,{credentials:'include'}).catch(function(){});}catch(e){}},250+i*220);
      });
      idle(function(){try{fetch((window.API||'')+'/api/admin/assets',{credentials:'include'}).catch(function(){});}catch(e){}},1800);
    }catch(e){}
  };
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',function(){/* V42 fix disabled preload */;},{once:true});
  else /* V42 fix disabled preload */;

  // showPage instantâneo tratado no showPage oficial final, sem oldShow.

  try{
    var oldDept=window.setDashboardDeptFilter;
    if(typeof oldDept==='function' && !oldDept.__gfInstantDept){
      var deptBusy=0;
      window.setDashboardDeptFilter=function(v){
        if(deptBusy) cancelAnimationFrame(deptBusy);
        var args=arguments, self=this;
        document.querySelectorAll('[data-gf-dept-scope="dash"]').forEach(function(b){
          var raw=String(b.getAttribute('data-gf-dept')||b.textContent||'').toUpperCase();
          var val=String(v||'ALL').toUpperCase();
          b.classList.toggle('active', raw.indexOf(val)>=0 || (val==='ALL' && /TODOS|ALL/.test(raw)));
        });
        deptBusy=requestAnimationFrame(function(){deptBusy=0; oldDept.apply(self,args);});
      };
      window.setDashboardDeptFilter.__gfInstantDept=true;
      try{setDashboardDeptFilter=window.setDashboardDeptFilter;}catch(e){}
    }
  }catch(e){}

  function clearGhosts(){
    try{
      var dd=document.getElementById('dashboardFilterDrawer');
      var drawer=document.getElementById('drawer');
      var bg=document.getElementById('drawerBg');
      var open=!!((dd&&dd.classList.contains('show'))||(drawer&&drawer.classList.contains('show')));
      if(bg && !open){bg.classList.remove('show');bg.style.pointerEvents='none';}
      if(bg && open && dd && dd.classList.contains('show')){bg.style.pointerEvents='none';bg.style.background='transparent';}
    }catch(e){}
  }
  document.addEventListener('pointerup',function(){setTimeout(clearGhosts,0);},true);
  window.addEventListener('pageshow',function(){setTimeout(clearGhosts,0);},{passive:true});
  setTimeout(clearGhosts,500);
})();

(function(){
  'use strict';
  if(window.__GF_FIX_CONSULTA_DETALHE_20260613__) return;
  window.__GF_FIX_CONSULTA_DETALHE_20260613__ = true;

  function n(v){
    var x = Number(String(v == null ? '' : v).replace(/[^0-9]/g,''));
    return Number.isFinite(x) && x > 0 ? x : 0;
  }
  function allPools(){
    var out=[];
    function add(a){ try{ if(Array.isArray(a)) out=out.concat(a); }catch(e){} }
    try{ add(window.tickets); }catch(e){}
    try{ if(typeof tickets !== 'undefined') add(tickets); }catch(e){}
    try{ add(window.dashboardAllTickets); }catch(e){}
    try{ add(window.dashboardOpenTickets); }catch(e){}
    try{ if(window.gfOpAllTicketsById) Object.keys(window.gfOpAllTicketsById).forEach(function(k){ out.push(window.gfOpAllTicketsById[k]); }); }catch(e){}
    try{ if(window.gfDashboardFilterRowsById) Object.keys(window.gfDashboardFilterRowsById).forEach(function(k){ out.push(window.gfDashboardFilterRowsById[k]); }); }catch(e){}
    var seen={}, clean=[];
    out.forEach(function(t){
      var id=n(t && (t.id || t.ticket_id));
      var key=id || ('no_'+n(t && t.ticket_number));
      if(key && !seen[key]){ seen[key]=1; clean.push(t); }
    });
    return clean;
  }
  function findInternalId(raw, el){
    var id=n(raw);
    if(!id && el){
      id=n(el.getAttribute('data-gf-open-ticket') || el.getAttribute('data-ticket-id') || el.getAttribute('data-gf-ticket-id') || el.getAttribute('data-detail'));
      if(!id){
        var m=String(el.textContent||'').match(/#\s*(\d+)/);
        if(m) id=n(m[1]);
      }
    }
    if(!id) return 0;
    var list=allPools();
    var byId=list.find(function(t){ return n(t && (t.id || t.ticket_id)) === id; });
    if(byId) return n(byId.id || byId.ticket_id);
    var byNo=list.find(function(t){ return n(t && t.ticket_number) === id; });
    if(byNo) return n(byNo.id || byNo.ticket_id) || id;
    return id;
  }
  function rememberConsulta(){
    try{
      var m=document.getElementById('gfOcModal'), bg=document.getElementById('gfOcModalBg'), body=document.getElementById('gfOcModalBody');
      if(!m) return;
      window.__gfConsultaReturnAfterTicket = {
        active: m.classList.contains('show') || m.style.display !== 'none',
        scroll: body ? Number(body.scrollTop||0) : 0,
        at: Date.now()
      };
      if(m){ m.classList.remove('show'); m.style.display='none'; }
      if(bg){ bg.classList.remove('show'); bg.style.display='none'; }
      document.body.classList.remove('gfOcModalOpenBody');
      document.documentElement.classList.remove('gfOcModalOpen');
    }catch(e){}
  }
  function restoreConsulta(){
    try{
      var ctx=window.__gfConsultaReturnAfterTicket;
      if(!ctx || !ctx.active) return false;
      var m=document.getElementById('gfOcModal'), bg=document.getElementById('gfOcModalBg'), body=document.getElementById('gfOcModalBody');
      if(bg){ bg.style.display='block'; bg.classList.add('show'); }
      if(m){ m.style.display='flex'; m.style.visibility='visible'; m.style.opacity='1'; m.classList.add('show'); }
      document.body.classList.add('gfOcModalOpenBody');
      document.documentElement.classList.add('gfOcModalOpen');
      setTimeout(function(){ try{ if(body) body.scrollTop=Number(ctx.scroll||0); }catch(e){} },30);
      setTimeout(function(){ try{ if(body) body.scrollTop=Number(ctx.scroll||0); }catch(e){} },150);
      window.__gfConsultaReturnAfterTicket=null;
      return true;
    }catch(e){ return false; }
  }
  window.gfRestoreOperationConsultaContext = restoreConsulta;

  function openFromConsulta(raw, el){
    var id=findInternalId(raw, el);
    if(!id) return false;
    rememberConsulta();
    try{
      if(typeof window.gfOpenTicketCanonical === 'function') { window.gfOpenTicketCanonical(id); return true; }
      if(typeof window.gfOpenTicketStable === 'function') { window.gfOpenTicketStable(id); return true; }
      if(typeof window.openTicketFromDashboard === 'function') { window.openTicketFromDashboard(id); return true; }
      if(typeof window.openDrawer === 'function') { window.openDrawer(id); return true; }
    }catch(e){ console.warn('Consulta: falha ao abrir detalhe', e); }
    restoreConsulta();
    return false;
  }
  window.gfOpenTicketFromConsulta = openFromConsulta;

  document.addEventListener('click', function(ev){
    var target=ev.target;
    if(!target || !target.closest) return;
    var modal=target.closest('#gfOcModal');
    if(!modal) return;
    var el=target.closest('[data-gf-open-ticket],[data-ticket-id],[data-gf-ticket-id],.gfOcTicketCard[data-detail],.gfOcOpenHint');
    if(!el) return;
    var card=el.closest('.gfOcTicketCard[data-detail]') || el;
    var raw=card.getAttribute('data-gf-open-ticket') || card.getAttribute('data-ticket-id') || card.getAttribute('data-gf-ticket-id') || card.getAttribute('data-detail') || '';
    if(String(raw).indexOf('__TICKET_')===0) raw=String(raw).replace('__TICKET_','');
    var id=findInternalId(raw, card);
    if(!id) return;
    ev.preventDefault(); ev.stopPropagation(); if(ev.stopImmediatePropagation) ev.stopImmediatePropagation();
    openFromConsulta(id, card);
  }, true);

  var oldClose=window.closeDrawer;
  window.closeDrawer=function(){
    var r;
    try{ if(typeof oldClose==='function') r=oldClose.apply(this, arguments); }
    finally{ setTimeout(restoreConsulta, 30); }
    return r;
  };
  try{ closeDrawer=window.closeDrawer; }catch(e){}
})();

/* GF_MOBILE_BOTTOM_NAV_RESTORE_20260613
   Restaura a navegação inferior mobile sem depender dos patches antigos.
   Mantém PC oculto e cria/recupera a barra caso algum clean/hotfix remova.
*/

/* GF_GLOBAL_NAV_FAST_FINAL_20260613
   Ajuste global de fluidez: evita recarregar módulos pesados toda vez que navega
   no mobile/PC e deixa troca de departamento local, sem buscar rede a cada toque. */

/* GF_TICKET_ACTIONS_CLEAN_FINAL_20260613
   Regra limpa do rodapé do detalhe. Sem loop piscando: aplica ao abrir detalhe e quando o DOM muda.
*/
(function(){
  'use strict';
  if(window.__GF_TICKET_ACTIONS_CLEAN_FINAL_20260613__) return;
  window.__GF_TICKET_ACTIONS_CLEAN_FINAL_20260613__=true;
  function apply(){ try{ if(typeof updateTicketActionButtons==='function') updateTicketActionButtons(); }catch(e){} }
  var oldFill = window.fillDrawerTicket || (typeof fillDrawerTicket==='function' ? fillDrawerTicket : null);
  if(typeof oldFill==='function' && !oldFill.__gfCleanActionsWrapped){
    var wrapped=function(t){
      try{ window.current=t; current=t; }catch(e){ window.current=t; }
      var r=oldFill.apply(this, arguments);
      apply(); setTimeout(apply,60);
      return r;
    };
    wrapped.__gfCleanActionsWrapped=true;
    window.fillDrawerTicket=wrapped; try{ fillDrawerTicket=wrapped; }catch(e){}
  }
  document.addEventListener('click', function(ev){
    var btn=ev.target&&ev.target.closest&&ev.target.closest('#btnAssumeTicket,#btnFinishTicket,[data-gf-assume-ticket],[data-gf-resolve-ticket]');
    if(!btn) return;
    var isDetail = btn.id==='btnAssumeTicket' || btn.id==='btnFinishTicket';
    if(!isDetail) return;
    var t=null; try{t=current||window.current||null;}catch(e){t=window.current||null;}
    var st = typeof ticketStatusClean==='function' ? ticketStatusClean(t) : 'NEW';
    var assigned = !!(t&&(t.assigned_to_user_id||t.assignee_id||t.responsible_user_id||t.assigned_user_id||t.assigned_to_name||t.assigned_name||t.responsible_name||t.technician_name));
    var mine = typeof currentUserOwnsTicket==='function' ? currentUserOwnsTicket(t) : false;
    if(btn.id==='btnAssumeTicket' && !(st==='NEW' && !assigned)){
      ev.preventDefault(); ev.stopPropagation(); if(ev.stopImmediatePropagation) ev.stopImmediatePropagation(); apply(); return false;
    }
    if(btn.id==='btnFinishTicket' && !(st==='IN_PROGRESS' && assigned && mine)){
      ev.preventDefault(); ev.stopPropagation(); if(ev.stopImmediatePropagation) ev.stopImmediatePropagation(); apply(); alert(st==='DONE'?'Este chamado já foi finalizado.':(assigned?'Somente quem assumiu este chamado pode finalizar.':'Assuma o chamado antes de finalizar.')); return false;
    }
  }, true);
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', apply); else apply();
})();

/* GF PERFORMANCE PATCH 2026-06-13
   Objetivo: navegação com sensação instantânea no PC e celular.
   - Usa cache leve dos chamados para pintar a tela na hora ao atualizar.
   - Evita renderizações duplicadas quando vários eventos disparam juntos.
   - Mantém busca real na API logo depois para não mostrar dado velho.
   - Mantém notificações em tempo real e polling, mas sem brigar com carregamentos em andamento.
*/

/* GF FIX: no celular o botão "Carregar mais" ficava escondido atrás da barra inferior.
   Ajuste limpo: cria espaço real abaixo da lista e sobe o botão, sem position fixed e sem esconder nada. */

/* GF_OFFICIAL_NAV_RENDER_CLEAN_20260614
   Consolidação definitiva: um único showPage oficial, sem oldShow/previousShowPage.
   renderAssets/renderIssues oficiais permanecem os definidos no módulo limpo de Cadastros;
   este bloco não envelopa render: apenas garante navegação sem versão antiga piscando. */
(function(){
  'use strict';
  if(window.__GF_OFFICIAL_NAV_RENDER_CLEAN_20260614__) return;
  window.__GF_OFFICIAL_NAV_RENDER_CLEAN_20260614__ = true;

  function capClean(s){ return String(s||'').charAt(0).toUpperCase()+String(s||'').slice(1); }
  function normPageClean(p){
    p = String(p || 'dashboard').toLowerCase().trim();
    if(p === 'consulta' || p === 'operação') return 'operacao';
    if(p === 'qr' || p === 'qrcode' || p === 'qrcodes') return 'qrs';
    if(p === 'configuracoes' || p === 'configurações') return 'usuarios';
    if(!/^(dashboard|operacao|cadastros|qrs|ia|usuarios)$/.test(p)) return 'dashboard';
    return p;
  }
  function togglePageClean(p){
    ['dashboard','operacao','cadastros','qrs','ia','usuarios'].forEach(function(x){
      var page = document.getElementById('page' + capClean(x));
      if(!page) return;
      page.classList.toggle('hidden', x !== p);
      if(x === p){ page.removeAttribute('aria-hidden'); }
      else { page.setAttribute('aria-hidden','true'); }
    });
  }
  function setActiveClean(p){
    var active = (p === 'qrs') ? 'cadastros' : p;
    ['dashboard','operacao','cadastros','usuarios'].forEach(function(x){
      var tab = document.getElementById('tab' + capClean(x));
      if(tab) tab.classList.toggle('active', x === active);
    });
    document.querySelectorAll('.gfSideItem,.gfSideSubItem,[data-page]').forEach(function(el){
      var id = String(el.id || '').toLowerCase();
      var dp = String(el.getAttribute('data-page') || '').toLowerCase();
      var hit = dp === p || id === ('tab'+p).toLowerCase() || id.indexOf(p) > -1;
      if(p === 'qrs') hit = hit || id.indexOf('qrs') > -1;
      if(p === 'ia') hit = hit || id.indexOf('ia') > -1;
      el.classList.toggle('active', !!hit);
    });
  }
  function loadPageClean(p){
    try{
      if(p === 'dashboard' && typeof window.loadDashboardV8 === 'function') return window.loadDashboardV8();
      if(p === 'operacao') return Promise.resolve();
      if(p === 'cadastros' && typeof window.loadRegisters === 'function') return window.loadRegisters();
      if(p === 'qrs' && typeof window.loadQrs === 'function') return window.loadQrs();
      if(p === 'ia' && typeof window.initGfAi === 'function') return window.initGfAi();
      if(p === 'usuarios' && typeof window.closeSettingsUsers === 'function') return window.closeSettingsUsers(false);
    }catch(e){ console.warn('loadPageClean', e); }
  }
  window.showPage = function(p){
    p = normPageClean(p);
    if(p!=='cadastros'){try{var a=document.getElementById('assetsBody');if(a)a.innerHTML='';var i=document.getElementById('issuesBody');if(i)i.innerHTML='';}catch(e){}} window.__gfCurrentPage = p;
    document.documentElement.classList.add('gf-page-switching');
    togglePageClean(p);
    setActiveClean(p);
    try{ if(typeof window.applyRoleUI === 'function') window.applyRoleUI(); }catch(e){}
    var ret = loadPageClean(p);
    try{ document.dispatchEvent(new CustomEvent('gf:page-shown',{detail:{page:p}})); }catch(e){}
    setTimeout(function(){ document.documentElement.classList.remove('gf-page-switching'); }, 80);
    return ret;
  };
  try{ showPage = window.showPage; }catch(e){}

  try{
    if(typeof window.renderIssues === 'function'){
      var originalRenderIssuesOfficial = window.renderIssues;
      if(!originalRenderIssuesOfficial.__gfOfficialIssuesEvent){
        window.renderIssues = function(){
          var ret = originalRenderIssuesOfficial.apply(this, arguments);
          try{ document.dispatchEvent(new CustomEvent('gf:issues-rendered')); }catch(e){}
          return ret;
        };
        window.renderIssues.__gfOfficialIssuesEvent = true;
        try{ renderIssues = window.renderIssues; }catch(e){}
      }
    }
  }catch(e){}
})();

/* GF_V31_RESTORE_SIDEBAR_TOGGLE_AND_MOBILE_BOTTOM_NAV
   Corrige regressao da limpeza V3: seta lateral sem acao, conteudo ficando embaixo do rail
   e navegacao inferior mobile removida. Mantem uma unica restauracao final, sem esconder versao antiga. */
(function(){
  'use strict';
  if(window.__gfV31RestoreSidebarMobileNav) return;
  window.__gfV31RestoreSidebarMobileNav = true;

  var pages = ['dashboard','operacao','cadastros','qrs','usuarios'];
  var labels = {
    dashboard:['▦','Painel'],
    operacao:['⌕','Consulta'],
    cadastros:['✚','Cadastro'],
    qrs:['◇','QR'],
    usuarios:['⚙','Config.']
  };

  function qs(s){ return document.querySelector(s); }
  function qsa(s){ return Array.prototype.slice.call(document.querySelectorAll(s)); }
  function cap(s){ s=String(s||''); return s.charAt(0).toUpperCase()+s.slice(1); }
  function isMobile(){ try{return window.matchMedia && window.matchMedia('(max-width:900px)').matches;}catch(e){return window.innerWidth<=900;} }

  function measureTop(){
    var h = qs('header.topbar.appTopbar,header.topbar,.appTopbar,.topbar');
    var n = h ? Math.ceil(h.getBoundingClientRect().height) : 92;
    if(!n || n < 60) n = 92;
    document.documentElement.style.setProperty('--gf-top-h', n + 'px');
  }

  function injectCss(){
    var old = document.getElementById('gfV31RestoreSidebarMobileNavCss');
    if(old) old.remove();
    var st = document.createElement('style');
    st.id = 'gfV31RestoreSidebarMobileNavCss';
    st.textContent = [
      ':root{--gf-side-closed:78px;--gf-side-open:260px;--gf-top-h:92px;}',
      'body.gf-sidebar-ready .gfSideNav{position:fixed!important;left:0!important;top:var(--gf-top-h)!important;bottom:0!important;width:var(--gf-side-closed)!important;z-index:900!important;overflow:visible!important;transition:width .18s ease!important;}',
      'body.gf-sidebar-ready.gf-sidebar-open .gfSideNav{width:var(--gf-side-open)!important;}',
      'body.gf-sidebar-ready .gfMainWrap{margin-left:var(--gf-side-closed)!important;width:calc(100% - var(--gf-side-closed))!important;transition:margin-left .18s ease,width .18s ease!important;}',
      'body.gf-sidebar-ready.gf-sidebar-open .gfMainWrap{margin-left:var(--gf-side-open)!important;width:calc(100% - var(--gf-side-open))!important;}',
      'body.gf-sidebar-ready .gfSideItem,body.gf-sidebar-ready .gfSideSubItem{white-space:nowrap!important;overflow:hidden!important;}',
      'body.gf-sidebar-ready:not(.gf-sidebar-open) .gfSideItem strong,body.gf-sidebar-ready:not(.gf-sidebar-open) .gfSideItem em,body.gf-sidebar-ready:not(.gf-sidebar-open) .gfSideItem small,body.gf-sidebar-ready:not(.gf-sidebar-open) .gfSideSubItem strong,body.gf-sidebar-ready:not(.gf-sidebar-open) .gfSideSubItem em,body.gf-sidebar-ready:not(.gf-sidebar-open) .gfSideSubItem small{display:none!important;}',
      'body.gf-sidebar-ready #gfSideToggle{cursor:pointer!important;pointer-events:auto!important;z-index:950!important;}',
      '@media(max-width:900px){',
      '  body.gf-sidebar-ready .gfSideNav{display:none!important;}',
      '  body.gf-sidebar-ready .gfMainWrap{margin-left:0!important;width:100%!important;padding-bottom:112px!important;}',
      '  body{padding-bottom:96px!important;}',
      '  #gfMobileBottomNav.gfMobileBottomNav{position:fixed!important;left:14px!important;right:14px!important;bottom:12px!important;height:76px!important;display:flex!important;align-items:center!important;justify-content:space-between!important;gap:6px!important;padding:8px 10px!important;border-radius:24px!important;background:rgba(255,255,255,.97)!important;border:1px solid rgba(180,205,230,.70)!important;box-shadow:0 16px 42px rgba(13,60,110,.24)!important;z-index:2147483600!important;opacity:1!important;visibility:visible!important;transform:none!important;pointer-events:auto!important;backdrop-filter:blur(14px)!important;-webkit-backdrop-filter:blur(14px)!important;}',
      '  #gfMobileBottomNav.gfMobileBottomNav button{flex:1 1 0!important;min-width:0!important;height:60px!important;border:0!important;border-radius:18px!important;background:transparent!important;color:#42526b!important;display:flex!important;flex-direction:column!important;align-items:center!important;justify-content:center!important;gap:3px!important;font-weight:900!important;font-size:12px!important;line-height:1.05!important;cursor:pointer!important;touch-action:manipulation!important;-webkit-tap-highlight-color:transparent!important;}',
      '  #gfMobileBottomNav.gfMobileBottomNav button .ico{font-size:24px!important;line-height:1!important;}',
      '  #gfMobileBottomNav.gfMobileBottomNav button.active{background:linear-gradient(135deg,#005aa7,#087dd8)!important;color:white!important;box-shadow:0 10px 26px rgba(0,90,167,.28)!important;}',
      '}',
      '@media(min-width:901px){#gfMobileBottomNav{display:none!important;}}'
    ].join('\n');
    document.head.appendChild(st);
  }

  function setSidebarOpen(open){
    if(isMobile()) open = false;
    document.body.classList.add('gf-sidebar-ready');
    document.body.classList.toggle('gf-sidebar-open', !!open);
    if(!open) document.body.classList.remove('gf-cad-sub-open');
    var btn = qs('#gfSideToggle');
    if(btn){
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      btn.setAttribute('aria-label', open ? 'Fechar menu lateral' : 'Abrir menu lateral');
    }
  }

  function bindSidebarToggle(){
    var btn = qs('#gfSideToggle');
    if(!btn || btn.dataset.gfV31ToggleBound) return;
    var clone = btn.cloneNode(true);
    clone.dataset.gfV31ToggleBound = '1';
    btn.parentNode.replaceChild(clone, btn);
    clone.addEventListener('click', function(ev){
      ev.preventDefault(); ev.stopPropagation(); if(ev.stopImmediatePropagation) ev.stopImmediatePropagation();
      setSidebarOpen(!document.body.classList.contains('gf-sidebar-open'));
      measureTop();
      return false;
    }, true);
  }

  function currentPage(){
    for(var i=0;i<pages.length;i++){
      var p=pages[i], el=document.getElementById('page'+cap(p));
      if(el && !el.classList.contains('hidden')) return p;
    }
    return String(window.__gfCurrentPage || 'dashboard').toLowerCase();
  }

  function syncBottomNav(){
    var nav = document.getElementById('gfMobileBottomNav');
    if(!nav) return;
    var p = currentPage();
    nav.querySelectorAll('button').forEach(function(btn){ btn.classList.toggle('active', btn.getAttribute('data-page') === p); });
  }

  function openPage(p){
    try{
      if(typeof window.showPage === 'function') window.showPage(p);
      else {
        var tab = document.getElementById('tab'+cap(p)) || document.querySelector('[data-page="'+p+'"]');
        if(tab) tab.click();
      }
    }catch(e){}
    setTimeout(syncBottomNav, 0);
    setTimeout(syncBottomNav, 160);
  }

  function buildBottomNav(){
    if(!isMobile()) return;
    var nav = document.getElementById('gfMobileBottomNav');
    if(!nav){
      nav = document.createElement('nav');
      nav.id = 'gfMobileBottomNav';
      nav.className = 'gfMobileBottomNav';
      nav.setAttribute('aria-label', 'Navegação mobile');
      document.body.appendChild(nav);
    }
    nav.className = 'gfMobileBottomNav';
    nav.style.display = 'flex';
    nav.style.visibility = 'visible';
    nav.style.opacity = '1';
    nav.style.pointerEvents = 'auto';
    nav.style.transform = 'none';
    if(nav.children.length !== pages.length){
      nav.innerHTML = '';
      pages.forEach(function(p){
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.setAttribute('data-page', p);
        btn.innerHTML = '<span class="ico">'+labels[p][0]+'</span><span>'+labels[p][1]+'</span>';
        btn.addEventListener('click', function(ev){
          ev.preventDefault(); ev.stopPropagation(); if(ev.stopImmediatePropagation) ev.stopImmediatePropagation();
          openPage(p);
          return false;
        }, true);
        nav.appendChild(btn);
      });
    }
    syncBottomNav();
  }


  // Proteção mobile: deslizar na barra de módulos não navega. Só clique/tap real abre.
  (function(){
    var sx=0, sy=0, moved=false;
    window.addEventListener('touchstart', function(ev){
      var t=ev.target && ev.target.closest && ev.target.closest('#gfUltimateMobileNav,[data-gf-ultimate-route]');
      if(!t) return;
      var p=ev.touches && ev.touches[0]; if(!p) return;
      sx=p.clientX; sy=p.clientY; moved=false;
    }, true);
    window.addEventListener('touchmove', function(ev){
      var t=ev.target && ev.target.closest && ev.target.closest('#gfUltimateMobileNav,[data-gf-ultimate-route]');
      if(!t) return;
      var p=ev.touches && ev.touches[0]; if(!p) return;
      if(Math.abs(p.clientX-sx)>10 || Math.abs(p.clientY-sy)>10) moved=true;
    }, true);
    window.addEventListener('touchend', function(ev){
      var t=ev.target && ev.target.closest && ev.target.closest('#gfUltimateMobileNav,[data-gf-ultimate-route]');
      if(!t) return;
      if(moved){ ev.stopImmediatePropagation(); ev.stopPropagation(); return; }
    }, true);
  })();

  function boot(){
    measureTop();
    injectCss();
    document.body.classList.add('gf-sidebar-ready');
    bindSidebarToggle();
    if(isMobile()) setSidebarOpen(false);
    buildBottomNav();
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, {once:true});
  else boot();
  window.addEventListener('load', function(){ boot(); setTimeout(boot,120); setTimeout(boot,700); }, {passive:true});
  window.addEventListener('pageshow', function(){ setTimeout(boot,0); }, {passive:true});
  window.addEventListener('resize', function(){ setTimeout(boot,120); }, {passive:true});
  window.addEventListener('orientationchange', function(){ setTimeout(boot,180); }, {passive:true});
  document.addEventListener('click', function(){ setTimeout(syncBottomNav,0); }, true);
})();



/* GF_V31_RENDER_SIGNATURE_GUARD_20260615
   Evita renderizações repetidas quando dados e filtros não mudaram.
   Foco: Cadastros > Equipamentos/Serviços/Problemas.
*/
(function(){
  if(window.__GF_V31_RENDER_SIGNATURE_GUARD__) return;
  window.__GF_V31_RENDER_SIGNATURE_GUARD__ = true;

  function byId(id){ return document.getElementById(id); }
  function v(id){ var e=byId(id); return e ? String(e.value||'') : ''; }
  function arr(a){ return Array.isArray(a) ? a : []; }

  function smallListSig(list){
    list = arr(list);
    var len = list.length;
    var first = list[0] || {};
    var mid = list[Math.floor(len/2)] || {};
    var last = list[len-1] || {};
    function rowSig(x){
      return [
        x.id, x.name, x.asset_name, x.status, x.active,
        x.priority, x.updated_at, x.sector_id, x.sector_name
      ].map(function(p){ return String(p == null ? '' : p); }).join(':');
    }
    return len + '|' + rowSig(first) + '|' + rowSig(mid) + '|' + rowSig(last);
  }

  function assetRenderSig(){
    return [
      'page=' + String(window.__gfCurrentPage || ''),
      'module=' + (document.body.className || ''),
      'kind=' + v('assetFilterKind'),
      'status=' + v('assetFilterStatus'),
      'sector=' + v('assetFilterSector'),
      'asset=' + v('assetFilterAsset'),
      'search=' + v('assetSearch'),
      'assets=' + smallListSig(window.assets || window.assetsCache || [])
    ].join('||');
  }

  function issueRenderSig(){
    return [
      'page=' + String(window.__gfCurrentPage || ''),
      'module=' + (document.body.className || ''),
      'status=' + v('issueFilterStatus'),
      'sector=' + v('issueFilterSector'),
      'asset=' + v('issueFilterAsset'),
      'search=' + v('issueFilterSearch'),
      'issues=' + smallListSig(window.issues || (typeof issues !== 'undefined' ? issues : []))
    ].join('||');
  }

  function wrapLater(){
    try{
      if(typeof window.renderAssets === 'function' && !window.renderAssets.__gfV31Sig){
        var oldAssets = window.renderAssets;
        window.renderAssets = function(){
          var sig = assetRenderSig();
          if(!window.__gfForceRenderAssetsV31 && sig === window.__gfLastAssetsRenderSigV31) return;
          window.__gfForceRenderAssetsV31 = false;
          window.__gfLastAssetsRenderSigV31 = sig;
          return oldAssets.apply(this, arguments);
        };
        window.renderAssets.__gfV31Sig = true;
        try{ renderAssets = window.renderAssets; }catch(e){}
      }

      if(typeof window.renderIssues === 'function' && !window.renderIssues.__gfV31Sig){
        var oldIssues = window.renderIssues;
        window.renderIssues = function(){
          var sig = issueRenderSig();
          if(!window.__gfForceRenderIssuesV31 && sig === window.__gfLastIssuesRenderSigV31) return;
          window.__gfForceRenderIssuesV31 = false;
          window.__gfLastIssuesRenderSigV31 = sig;
          return oldIssues.apply(this, arguments);
        };
        window.renderIssues.__gfV31Sig = true;
        try{ renderIssues = window.renderIssues; }catch(e){}
      }
    }catch(e){}
  }

  window.gfForceRenderAssetsV31 = function(){
    window.__gfLastAssetsRenderSigV31 = '';
    window.__gfForceRenderAssetsV31 = true;
  };
  window.gfForceRenderIssuesV31 = function(){
    window.__gfLastIssuesRenderSigV31 = '';
    window.__gfForceRenderIssuesV31 = true;
  };

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', function(){ setTimeout(wrapLater, 0); setTimeout(wrapLater, 500); }, {once:true});
  }else{
    setTimeout(wrapLater, 0);
    setTimeout(wrapLater, 500);
  }
})();



(function(){
 if(window.__gfV37Installed) return;
 window.__gfV37Installed=true;
 document.addEventListener('click',function(){},false);

 var oldShow=window.showPage;
 if(typeof oldShow==='function'){
   window.showPage=function(p){
     try{
       var cur=String(window.__gfCurrentPage||'').toLowerCase();
       if(cur==='cadastros' && String(p).toLowerCase()!=='cadastros'){
         var a=document.getElementById('assetsBody'); if(a) a.innerHTML='';
         var i=document.getElementById('issuesBody'); if(i) i.innerHTML='';
       }
       if(cur==='dashboard'){
         var d=document.getElementById('pageDashboard');
         if(d){ window.__gfDashboardCacheHtml=d.innerHTML; window.__gfDashboardCacheTs=Date.now(); }
       }
     }catch(e){}
     var r=oldShow.apply(this,arguments);
     try{
       if(String(p).toLowerCase()==='dashboard'){
         var d=document.getElementById('pageDashboard');
         if(d && window.__gfDashboardCacheHtml && (Date.now()-window.__gfDashboardCacheTs)<60000){
            d.innerHTML=window.__gfDashboardCacheHtml;
         }
       }
     }catch(e){}
     return r;
   }
 }
})();


/* V38 ULTRA MOBILE DOM */
(function(){
 if(window.__GFV38) return; window.__GFV38=true;
 function destroyCadastrosHeavy(){
   try{
    var a=document.getElementById('assetsBody'); if(a) a.innerHTML='';
    var i=document.getElementById('issuesBody'); if(i) i.innerHTML='';
   }catch(e){}
 }
 var oldShow=window.showPage;
 if(typeof oldShow==='function'){
   window.showPage=function(p){
      var cur=String(window.__gfCurrentPage||'').toLowerCase();
      if(cur==='cadastros' && String(p).toLowerCase()!=='cadastros'){
         destroyCadastrosHeavy();
      }
      return oldShow.apply(this,arguments);
   };
 }
 // mobile limits
 try{
   window.__gfMobileMaxCards=20;
 }catch(e){}
})();


/* GF_V40_MOBILE_PERF */
(function(){
 if(window.__GF_V40_MOBILE_PERF__) return;
 window.__GF_V40_MOBILE_PERF__=true;
 function apply(){
   try{
     if(window.innerWidth>768) return;
     document.documentElement.classList.add('gf-mobile-perf');
   }catch(e){}
 }
 window.addEventListener('resize',apply,{passive:true});
 setTimeout(apply,0);
})();



/* Removidos patches antigos V43/V44/V48/V49 de Cadastros que brigavam com Serviços. */

(function(){
  'use strict';
  if(window.__GF_V50_DASHBOARD_INSTANT_MOBILE__) return;
  window.__GF_V50_DASHBOARD_INSTANT_MOBILE__ = true;

  function isMobile(){
    try{return !!(window.matchMedia && window.matchMedia('(max-width: 900px)').matches);}catch(e){return false;}
  }
  function cap(s){s=String(s||'');return s.charAt(0).toUpperCase()+s.slice(1);}
  function norm(p){
    p=String(p||'dashboard').toLowerCase().trim();
    if(p==='consulta'||p==='operação') return 'operacao';
    if(p==='qr'||p==='qrcode'||p==='qrcodes') return 'qrs';
    if(p==='configuracoes'||p==='configurações') return 'usuarios';
    if(!/^(dashboard|operacao|cadastros|qrs|ia|usuarios)$/.test(p)) return 'dashboard';
    return p;
  }
  function installCss(){
    if(document.getElementById('gfV50DashboardInstantCss')) return;
    var st=document.createElement('style');
    st.id='gfV50DashboardInstantCss';
    st.textContent = [
      '@media(max-width:900px){',
      'html.gf-v50-instant *,html.gf-v50-instant *:before,html.gf-v50-instant *:after{transition:none!important;animation:none!important;scroll-behavior:auto!important;}',
      'body.gf-mobile-no-motion *,body.gf-mobile-no-motion *:before,body.gf-mobile-no-motion *:after{transition:none!important;animation:none!important;}',
      '#pageDashboard,#pageDashboard *, .gfSideItem,.gfSideSubItem,.bottomNav button{transition:none!important;animation:none!important;}',
      '.page,.screen,.adminPage,.modulePage,[id^="page"]{transition:none!important;animation:none!important;}',
      '}',
      '@media(max-width:900px) and (prefers-reduced-motion:no-preference){html{scroll-behavior:auto!important;}}'
    ].join('');
    (document.head||document.documentElement).appendChild(st);
  }
  function showOnlyDashboard(){
    ['dashboard','operacao','cadastros','qrs','ia','usuarios'].forEach(function(x){
      var page=document.getElementById('page'+cap(x));
      if(!page) return;
      var show=x==='dashboard';
      page.classList.toggle('hidden', !show);
      if(show) page.removeAttribute('aria-hidden'); else page.setAttribute('aria-hidden','true');
    });
  }
  function setActiveDashboard(){
    ['dashboard','operacao','cadastros','usuarios'].forEach(function(x){
      var tab=document.getElementById('tab'+cap(x));
      if(tab) tab.classList.toggle('active', x==='dashboard');
    });
    document.querySelectorAll('.gfSideItem,.gfSideSubItem,[data-page]').forEach(function(el){
      var id=String(el.id||'').toLowerCase();
      var dp=String(el.getAttribute('data-page')||'').toLowerCase();
      el.classList.toggle('active', dp==='dashboard' || id.indexOf('dashboard')>-1);
    });
  }
  function clearHeavyHidden(){
    try{var a=document.getElementById('assetsBody'); if(a) a.innerHTML='';}catch(e){}
    try{var i=document.getElementById('issuesBody'); if(i) i.innerHTML='';}catch(e){}
    try{['qrBlocksGrid','qrsGrid','qrList','qrSectorsBody'].forEach(function(id){var el=document.getElementById(id); if(el) el.innerHTML='';});}catch(e){}
  }
  function paintDashboardNow(){
    window.__gfCurrentPage='dashboard';
    try{localStorage.removeItem('cadastroModuloAtual');}catch(e){}
    try{window.__gfCadastroModuleV49='';}catch(e){}
    document.documentElement.classList.add('gf-v50-instant');
    document.body.classList.add('gf-mobile-no-motion');
    showOnlyDashboard();
    setActiveDashboard();
    try{ if(typeof window.applyRoleUI==='function') window.applyRoleUI(); }catch(e){}
    try{ document.dispatchEvent(new CustomEvent('gf:page-shown',{detail:{page:'dashboard',instant:true}})); }catch(e){}
    setTimeout(function(){document.documentElement.classList.remove('gf-v50-instant');},120);
  }
  function scheduleDashboardRefresh(){
    if(window.__gfV50DashRefreshScheduled) return;
    window.__gfV50DashRefreshScheduled=true;
    var run=function(){
      setTimeout(function(){
        window.__gfV50DashRefreshScheduled=false;
        if(String(window.__gfCurrentPage||'dashboard').toLowerCase()!=='dashboard') return;
        try{
          if(typeof window.loadDashboardV8==='function') window.loadDashboardV8();
          else if(typeof window.loadTickets==='function') window.loadTickets();
        }catch(e){console.warn('V50 dashboard refresh',e);}
      },30);
    };
    try{(window.requestIdleCallback||function(cb){return setTimeout(cb,80);})(run,{timeout:300});}
    catch(e){setTimeout(run,80);}
  }

  installCss();
  var oldShow=window.showPage;
  if(typeof oldShow==='function' && !oldShow.__gfV50DashboardInstant){
    window.showPage=function(p){
      p=norm(p);
      if(isMobile() && p==='dashboard'){
        paintDashboardNow();
        clearHeavyHidden();
        scheduleDashboardRefresh();
        return Promise.resolve(true);
      }
      return oldShow.apply(this,arguments);
    };
    window.showPage.__gfV50DashboardInstant=true;
    window.showPage.__gfOriginal=oldShow;
    try{showPage=window.showPage;}catch(e){}
  }

  // No celular, qualquer clique de navegação recebe resposta visual imediata.
  document.addEventListener('click',function(ev){
    var btn=ev.target && ev.target.closest && ev.target.closest('[data-page],[data-view],[data-module],#tabDashboard,.gfSideItem,.gfSideSubItem');
    if(!btn || !isMobile()) return;
    var p=String(btn.getAttribute('data-page')||btn.getAttribute('data-view')||btn.getAttribute('data-module')||'').toLowerCase();
    if(btn.id && btn.id.toLowerCase().indexOf('dashboard')>-1) p='dashboard';
    if(p==='dashboard') document.documentElement.classList.add('gf-v50-instant');
  },{capture:true,passive:true});

  try{document.body.classList.add('gf-mobile-no-motion');}catch(e){}
})();


(function(){
  if(document.getElementById('gfOcAssetsListRefCssV1'))return;
  var st=document.createElement('style');
  st.id='gfOcAssetsListRefCssV1';
  st.textContent=`
    body > #gfOcModal.gfOcAssetsMode.gfOcModal.show{
      width:min(760px,calc(100vw - 28px))!important;
      max-width:760px!important;
      height:auto!important;
      max-height:calc(100dvh - 26px)!important;
      border-radius:24px!important;
      background:#f3f8ff!important;
      box-shadow:0 28px 80px rgba(15,23,42,.28)!important;
      overflow:hidden!important;
    }
    body > #gfOcModal.gfOcAssetsMode .gfOcModalHead{
      min-height:82px!important;
      padding:18px 22px!important;
      background:#f3f8ff!important;
      border-bottom:0!important;
      box-shadow:none!important;
      display:flex!important;
      align-items:center!important;
      gap:14px!important;
    }
    body > #gfOcModal.gfOcAssetsMode .gfOcModalHead h3{
      margin:0!important;
      flex:1 1 auto!important;
      min-width:0!important;
      display:flex!important;
      align-items:center!important;
      gap:14px!important;
      font-size:22px!important;
      line-height:1.15!important;
      font-weight:1000!important;
      letter-spacing:-.025em!important;
      color:#06163f!important;
    }
    body > #gfOcModal.gfOcAssetsMode .gfOcAssetsHeadIcon{
      width:24px!important;
      min-width:24px!important;
      height:24px!important;
      display:inline-grid!important;
      place-items:center!important;
      color:#0b3678!important;
      font-size:25px!important;
      transform:rotate(-14deg)!important;
    }
    body > #gfOcModal.gfOcAssetsMode .gfOcClose{
      min-width:122px!important;
      height:54px!important;
      padding:0 18px!important;
      border-radius:18px!important;
      border:1px solid #dbe8f6!important;
      background:#fff!important;
      box-shadow:0 10px 24px rgba(15,23,42,.06)!important;
      color:#06163f!important;
      font-size:15px!important;
      font-weight:1000!important;
      display:inline-flex!important;
      align-items:center!important;
      justify-content:center!important;
      gap:9px!important;
    }
    body > #gfOcModal.gfOcAssetsMode .gfOcCloseX{font-size:26px!important;line-height:1!important;font-weight:800!important;}
    body > #gfOcModal.gfOcAssetsMode #gfOcModalBody{
      padding:0 22px 100px!important;
      background:#f3f8ff!important;
      max-height:calc(100dvh - 108px)!important;
      overflow:auto!important;
    }
    .gfOcAssetsListRef{display:grid!important;grid-template-columns:1fr!important;gap:16px!important;padding:0 0 10px!important;}
    .gfOcAssetListItem{
      position:relative!important;
      display:grid!important;
      grid-template-columns:72px minmax(0,1fr) 24px!important;
      gap:18px!important;
      align-items:center!important;
      min-height:178px!important;
      padding:22px 22px 22px 22px!important;
      border-radius:18px!important;
      background:#fff!important;
      border:1px solid #dbe8f6!important;
      border-left:4px solid #1976d2!important;
      box-shadow:0 12px 28px rgba(15,23,42,.065)!important;
      cursor:pointer!important;
      overflow:hidden!important;
    }
    .gfOcAssetListIcon{
      width:60px!important;
      height:60px!important;
      border-radius:16px!important;
      background:#eef6ff!important;
      display:grid!important;
      place-items:center!important;
      color:#0d72d9!important;
      font-size:30px!important;
      line-height:1!important;
      box-shadow:inset 0 0 0 1px rgba(219,232,246,.55)!important;
    }
    .gfOcAssetListMain{min-width:0!important;}
    .gfOcAssetListTop{display:flex!important;align-items:flex-start!important;justify-content:space-between!important;gap:12px!important;margin-bottom:8px!important;}
    .gfOcAssetListTop h4{
      margin:0!important;
      color:#06163f!important;
      font-size:24px!important;
      line-height:1.12!important;
      letter-spacing:-.02em!important;
      font-weight:1000!important;
      text-transform:uppercase!important;
    }
    .gfOcAssetDone{
      flex:0 0 auto!important;
      display:inline-flex!important;
      align-items:center!important;
      justify-content:center!important;
      min-height:36px!important;
      padding:0 16px!important;
      border-radius:999px!important;
      font-size:15px!important;
      font-weight:1000!important;
      white-space:nowrap!important;
      background:#fff7ed!important;
      color:#c2410c!important;
      border:1px solid #ffedd5!important;
    }
    .gfOcAssetDone.ok{background:#dcfce7!important;color:#15803d!important;border-color:#bbf7d0!important;}
    .gfOcAssetCount{color:#06163f!important;font-size:20px!important;line-height:1.2!important;font-weight:700!important;margin:2px 0 12px!important;}
    .gfOcAssetListMain p{
      margin:0!important;
      color:#536784!important;
      font-size:16px!important;
      font-weight:1000!important;
      line-height:1.45!important;
      text-transform:uppercase!important;
      letter-spacing:.01em!important;
    }
    .gfOcAssetArrow{
      color:#1976d2!important;
      font-size:44px!important;
      line-height:1!important;
      font-weight:400!important;
      justify-self:end!important;
    }
    @media(min-width:901px){
      body > #gfOcModal.gfOcAssetsMode.gfOcModal.show{width:min(920px,calc(100vw - 72px))!important;max-width:920px!important;}
      .gfOcAssetListItem{min-height:152px!important;grid-template-columns:66px minmax(0,1fr) 24px!important;padding:20px 22px!important;}
      .gfOcAssetListTop h4{font-size:22px!important;}
      .gfOcAssetCount{font-size:18px!important;}
      .gfOcAssetListMain p{font-size:14.5px!important;line-height:1.36!important;}
    }
    @media(max-width:720px){
      body > #gfOcModal.gfOcAssetsMode.gfOcModal.show{
        left:0!important;top:0!important;right:0!important;bottom:0!important;transform:none!important;
        width:100vw!important;max-width:none!important;height:100dvh!important;max-height:none!important;border-radius:0!important;
      }
      body > #gfOcModal.gfOcAssetsMode .gfOcModalHead{
        min-height:112px!important;
        padding:38px 18px 14px!important;
        align-items:center!important;
      }
      body > #gfOcModal.gfOcAssetsMode .gfOcModalHead h3{
        font-size:18px!important;
        line-height:1.25!important;
        gap:12px!important;
      }
      body > #gfOcModal.gfOcAssetsMode .gfOcAssetsHeadIcon{width:22px!important;min-width:22px!important;font-size:23px!important;}
      body > #gfOcModal.gfOcAssetsMode .gfOcClose{
        min-width:116px!important;
        height:50px!important;
        border-radius:18px!important;
        font-size:14px!important;
      }
      body > #gfOcModal.gfOcAssetsMode #gfOcModalBody{
        max-height:none!important;
        padding:10px 22px calc(110px + env(safe-area-inset-bottom,0px))!important;
      }
      .gfOcAssetsListRef{gap:16px!important;}
      .gfOcAssetListItem{
        grid-template-columns:58px minmax(0,1fr) 18px!important;
        gap:14px!important;
        min-height:166px!important;
        padding:20px 14px 20px 14px!important;
        border-radius:17px!important;
      }
      .gfOcAssetListIcon{width:52px!important;height:52px!important;border-radius:15px!important;font-size:27px!important;}
      .gfOcAssetListTop{align-items:flex-start!important;margin-bottom:8px!important;}
      .gfOcAssetListTop h4{font-size:22px!important;line-height:1.12!important;}
      .gfOcAssetDone{min-height:34px!important;padding:0 13px!important;font-size:13.5px!important;}
      .gfOcAssetCount{font-size:18px!important;margin-bottom:10px!important;}
      .gfOcAssetListMain p{font-size:15px!important;line-height:1.42!important;}
      .gfOcAssetArrow{font-size:38px!important;}
    }
    @media(max-width:430px){
      body > #gfOcModal.gfOcAssetsMode .gfOcModalHead{padding-left:16px!important;padding-right:14px!important;}
      body > #gfOcModal.gfOcAssetsMode .gfOcModalHead h3{font-size:17px!important;}
      body > #gfOcModal.gfOcAssetsMode #gfOcModalBody{padding-left:12px!important;padding-right:12px!important;}
      .gfOcAssetListItem{grid-template-columns:56px minmax(0,1fr) 16px!important;gap:12px!important;padding:18px 12px!important;}
      .gfOcAssetListTop{display:grid!important;grid-template-columns:1fr!important;gap:8px!important;}
      .gfOcAssetDone{justify-self:start!important;}
      .gfOcAssetListTop h4{font-size:21px!important;}
      .gfOcAssetListMain p{font-size:14px!important;}
    }
  `;
  document.head.appendChild(st);
})();


(function(){
  if(document.getElementById('gfOcDashCardsFinalCssV1'))return;
  var st=document.createElement('style');
  st.id='gfOcDashCardsFinalCssV1';
  st.textContent=`
    body > #gfOcModal.gfOcModal.show:not(.gfOcAssetsMode){
      width:min(1180px,calc(100vw - 72px))!important;
      max-width:1180px!important;
      height:min(88dvh,calc(100dvh - 66px))!important;
      max-height:calc(100dvh - 66px)!important;
      border-radius:24px!important;
      background:#eef6ff!important;
      overflow:hidden!important;
    }
    body > #gfOcModal:not(.gfOcAssetsMode) .gfOcModalHead{
      min-height:86px!important;
      padding:18px 22px!important;
      background:#f4f9ff!important;
      border-bottom:1px solid #dbe8f6!important;
      box-shadow:none!important;
      align-items:center!important;
    }
    body > #gfOcModal:not(.gfOcAssetsMode) .gfOcModalHead h3{
      margin:0!important;
      color:#06163f!important;
      font-size:28px!important;
      line-height:1.08!important;
      letter-spacing:-.035em!important;
      font-weight:1000!important;
      display:block!important;
    }
    body > #gfOcModal:not(.gfOcAssetsMode) .gfOcModalHead h3:before{
      content:'FILTRO DO DASHBOARD';
      display:block!important;
      margin:0 0 6px!important;
      color:#7282a0!important;
      font-size:12px!important;
      line-height:1!important;
      letter-spacing:.08em!important;
      font-weight:1000!important;
    }
    body > #gfOcModal:not(.gfOcAssetsMode) .gfOcClose{
      width:auto!important;
      min-width:112px!important;
      height:48px!important;
      border-radius:16px!important;
      border:1px solid #dbe8f6!important;
      background:#fff!important;
      box-shadow:0 10px 22px rgba(15,23,42,.06)!important;
      color:#06163f!important;
      font-size:0!important;
      padding:0 16px!important;
      display:inline-flex!important;
      align-items:center!important;
      justify-content:center!important;
      gap:8px!important;
    }
    body > #gfOcModal:not(.gfOcAssetsMode) .gfOcClose:before{content:'×';font-size:25px!important;line-height:1!important;font-weight:900!important;}
    body > #gfOcModal:not(.gfOcAssetsMode) .gfOcClose:after{content:'Fechar';font-size:14px!important;font-weight:1000!important;}
    body > #gfOcModal:not(.gfOcAssetsMode) #gfOcModalBody{
      background:#eaf4ff!important;
      padding:20px 22px calc(78px + env(safe-area-inset-bottom,0px))!important;
      max-height:none!important;
      overflow:auto!important;
    }
    .gfOcDashSummary{
      display:grid!important;
      grid-template-columns:56px minmax(0,1fr) auto!important;
      align-items:center!important;
      gap:16px!important;
      min-height:74px!important;
      margin:0 0 16px!important;
      padding:12px 18px!important;
      background:#fff!important;
      border:1px solid #dbe8f6!important;
      border-radius:20px!important;
      box-shadow:0 10px 24px rgba(15,23,42,.055)!important;
    }
    .gfOcDashSummaryIcon{width:46px!important;height:46px!important;border-radius:14px!important;background:#edf6ff!important;color:#0b73df!important;display:grid!important;place-items:center!important;font-size:23px!important;}
    .gfOcDashSummaryText{min-width:0!important}.gfOcDashSummaryText b{display:block!important;font-size:18px!important;line-height:1.15!important;color:#06163f!important;font-weight:1000!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important}.gfOcDashSummaryText small{display:block!important;margin-top:4px!important;color:#5f708d!important;font-size:13px!important;font-weight:800!important}.gfOcDashSummary strong{font-size:20px!important;color:#06163f!important;font-weight:1000!important;white-space:nowrap!important;}
    .gfOcDashMiniStats{display:none!important;}
    .gfOcDashTicketList{display:grid!important;grid-template-columns:1fr!important;gap:14px!important;padding:0!important;}
    .gfOcDashTicketCard{
      position:relative!important;
      display:block!important;
      min-height:138px!important;
      margin:0!important;
      padding:18px 18px 16px!important;
      border:1px solid #dbe8f6!important;
      border-left:5px solid #f59e0b!important;
      border-radius:18px!important;
      background:#fff!important;
      box-shadow:0 12px 26px rgba(15,23,42,.055)!important;
      cursor:pointer!important;
      overflow:hidden!important;
    }
    .gfOcDashTicketCard.open{border-left-color:#f59e0b!important;}
    .gfOcDashTicketCard.progress{border-left-color:#f59e0b!important;}
    .gfOcDashTicketCard.sla{border-left-color:#ef4444!important;}
    .gfOcDashTicketCard.done{border-left-color:#16c55b!important;}
    .gfOcDashTop{display:flex!important;align-items:flex-start!important;justify-content:space-between!important;gap:16px!important;margin:0 0 10px!important;}
    .gfOcDashMeta{display:flex!important;align-items:center!important;gap:10px!important;flex-wrap:wrap!important;min-width:0!important;}
    .gfOcDashNumber{font-size:22px!important;line-height:1!important;color:#08245a!important;font-weight:1000!important;letter-spacing:-.02em!important;}
    .gfOcDashSector{color:#14643a!important;text-transform:uppercase!important;font-size:13px!important;font-weight:1000!important;line-height:1.1!important;}
    .gfOcDashType{color:#0757bf!important;background:#edf6ff!important;border-radius:999px!important;padding:4px 9px!important;font-size:13px!important;font-weight:1000!important;line-height:1!important;}
    .gfOcDashRight{display:flex!important;align-items:center!important;gap:10px!important;white-space:nowrap!important;flex:0 0 auto!important;}
    .gfOcDashAge{color:#334155!important;font-size:12px!important;font-weight:1000!important;}
    .gfOcDashBadge{display:inline-flex!important;align-items:center!important;justify-content:center!important;min-height:28px!important;padding:0 11px!important;border-radius:999px!important;font-size:12px!important;font-weight:1000!important;border:1px solid transparent!important;}
    .gfOcDashBadge.new{background:#fee2e2!important;color:#b91c1c!important;border-color:#fecaca!important;}
    .gfOcDashBadge.progress{background:#fff7ed!important;color:#c2410c!important;border-color:#fed7aa!important;}
    .gfOcDashBadge.done{background:#dcfce7!important;color:#15803d!important;border-color:#bbf7d0!important;}
    .gfOcDashTitle{margin:0 0 6px!important;color:#08245a!important;font-size:22px!important;line-height:1.15!important;font-weight:1000!important;letter-spacing:-.02em!important;text-transform:uppercase!important;}
    .gfOcDashDesc{margin:0 0 13px!important;color:#25324a!important;font-size:13.5px!important;line-height:1.32!important;font-weight:850!important;display:-webkit-box!important;-webkit-line-clamp:2!important;-webkit-box-orient:vertical!important;overflow:hidden!important;}
    .gfOcDashBottom{display:grid!important;grid-template-columns:minmax(0,1fr) 180px!important;align-items:center!important;gap:12px!important;}
    .gfOcDashResp{min-height:28px!important;border:1px solid #dbe8f6!important;background:#f8fbff!important;border-radius:999px!important;padding:5px 10px!important;color:#334155!important;font-size:12px!important;font-weight:1000!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important;}
    .gfOcDashBtn{height:40px!important;border:1px solid #cfe0f5!important;border-radius:13px!important;background:#fff!important;color:#06163f!important;font-size:13px!important;font-weight:1000!important;cursor:pointer!important;box-shadow:none!important;}
    .gfOcDashBtn:hover{border-color:#93c5fd!important;background:#f8fbff!important;}
    @media(max-width:720px){
      body > #gfOcModal.gfOcModal.show:not(.gfOcAssetsMode){left:0!important;top:0!important;right:0!important;bottom:0!important;transform:none!important;width:100vw!important;max-width:none!important;height:100dvh!important;max-height:none!important;border-radius:0!important;}
      body > #gfOcModal:not(.gfOcAssetsMode) .gfOcModalHead{min-height:118px!important;padding:34px 16px 16px!important;}
      body > #gfOcModal:not(.gfOcAssetsMode) .gfOcModalHead h3{font-size:25px!important;line-height:1.08!important;max-width:calc(100vw - 118px)!important;}
      body > #gfOcModal:not(.gfOcAssetsMode) .gfOcModalHead h3:before{font-size:11px!important;margin-bottom:8px!important;}
      body > #gfOcModal:not(.gfOcAssetsMode) .gfOcClose{min-width:54px!important;width:54px!important;height:54px!important;border-radius:18px!important;padding:0!important;}
      body > #gfOcModal:not(.gfOcAssetsMode) .gfOcClose:after{display:none!important;}
      body > #gfOcModal:not(.gfOcAssetsMode) #gfOcModalBody{padding:14px 14px calc(92px + env(safe-area-inset-bottom,0px))!important;}
      .gfOcDashSummary{grid-template-columns:48px minmax(0,1fr) auto!important;gap:12px!important;min-height:66px!important;border-radius:18px!important;padding:10px 12px!important;margin-bottom:14px!important;}
      .gfOcDashSummaryIcon{width:42px!important;height:42px!important;border-radius:13px!important;font-size:21px!important;}
      .gfOcDashSummaryText b{font-size:15px!important;}.gfOcDashSummaryText small{font-size:12px!important;}.gfOcDashSummary strong{font-size:16px!important;}
      .gfOcDashTicketList{gap:12px!important;}
      .gfOcDashTicketCard{min-height:0!important;border-radius:18px!important;padding:15px 14px 14px!important;}
      .gfOcDashTop{gap:10px!important;margin-bottom:10px!important;}
      .gfOcDashMeta{gap:8px!important;}
      .gfOcDashNumber{font-size:24px!important;}
      .gfOcDashSector,.gfOcDashType{font-size:12px!important;}
      .gfOcDashRight{gap:8px!important;}
      .gfOcDashAge{font-size:12px!important;}
      .gfOcDashBadge{min-height:28px!important;font-size:12px!important;padding:0 10px!important;}
      .gfOcDashTitle{font-size:22px!important;line-height:1.14!important;margin-bottom:7px!important;}
      .gfOcDashDesc{font-size:15px!important;line-height:1.36!important;margin-bottom:14px!important;-webkit-line-clamp:3!important;}
      .gfOcDashBottom{grid-template-columns:1fr!important;gap:10px!important;}
      .gfOcDashResp{width:100%!important;min-height:30px!important;font-size:12.5px!important;}
      .gfOcDashBtn{width:100%!important;height:48px!important;border-radius:14px!important;font-size:15px!important;}
    }
    @media(min-width:721px){
      .gfOcDashTicketCard.done .gfOcDashBottom{grid-template-columns:minmax(0,1fr) 180px!important;}
    }
  `;
  document.head.appendChild(st);
})();

/* GF_FIX_OPERACAO_CENTRAL_DEFINITIVA_20260618
   Remove o fluxo antigo da tela Operacao/Consulta: ao entrar no módulo, monta sempre a Central nova
   e esconde a tabela/cards antigos somente quando a Central está ativa. Sem inserir tela paralela por cima. */
(function(){
  'use strict';
  if(window.__GF_FIX_OPERACAO_CENTRAL_DEFINITIVA_20260618__) return;
  window.__GF_FIX_OPERACAO_CENTRAL_DEFINITIVA_20260618__ = true;

  function normPage(p){
    p = String(p || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim();
    if(p === 'consulta' || p === 'operacao' || p === 'operation') return 'operacao';
    return p;
  }

  function openCentral(){
    var page = document.getElementById('pageOperacao');
    if(!page) return;
    page.classList.add('gfOpConsultaMode');
    try{sessionStorage.removeItem('gf_oc_keep_period_session')}catch(_e){}
    try{
      var st=localStorage.getItem('gf_op_consulta_v41');
      var j=st?JSON.parse(st):{}; j.range='TODAY'; j.from=''; j.to='';
      localStorage.setItem('gf_op_consulta_v41',JSON.stringify(j));
    }catch(_e){}
    try{
      if(typeof window.gfOpenOperationConsulta === 'function') window.gfOpenOperationConsulta();
      else if(typeof window.openOperationConsulta === 'function') window.openOperationConsulta();
      else if(typeof window.openConsultaOperacao === 'function') window.openConsultaOperacao();
    }catch(e){ console.warn('Falha ao abrir Central de Consulta definitiva:', e); }
  }

  var oldShow = window.showPage;
  if(typeof oldShow === 'function'){
    window.showPage = function(p){
      var target = normPage(p);
      if(target === 'operacao'){
        try{ var pg0=document.getElementById('pageOperacao'); if(pg0) pg0.classList.add('gfOpConsultaMode'); }catch(_e){}
      }
      var r = oldShow.apply(this, arguments);
      if(target === 'operacao'){
        try{ window.__gfCurrentPage = 'operacao'; }catch(e){}
        openCentral();
        setTimeout(openCentral, 40);
      }else{
        try{
          var pg = document.getElementById('pageOperacao');
          if(pg) pg.classList.remove('gfOpConsultaMode');
        }catch(e){}
      }
      return r;
    };
    try{ showPage = window.showPage; }catch(e){}
  }

  document.addEventListener('click', function(ev){
    var el = ev.target && ev.target.closest && ev.target.closest('[data-page],[data-view],[data-module],#tabOperacao,#navOperacao,#btnOperacao,.gfSideItem,.gfSideSubItem');
    if(!el) return;
    var p = normPage(el.getAttribute('data-page') || el.getAttribute('data-view') || el.getAttribute('data-module') || el.id || el.textContent || '');
    if(p === 'operacao' || /consulta|operacao|operação/i.test(String(el.textContent||el.id||''))){
      try{var pg=document.getElementById('pageOperacao'); if(pg) pg.classList.add('gfOpConsultaMode');}catch(_e){}
      openCentral();
      setTimeout(openCentral, 40);
    }
  }, true);

  document.addEventListener('DOMContentLoaded', function(){
    var pg = document.getElementById('pageOperacao');
    if(pg && !pg.classList.contains('hidden')) setTimeout(openCentral, 0);
  });
  setTimeout(function(){
    var pg = document.getElementById('pageOperacao');
    if(pg && !pg.classList.contains('hidden')) openCentral();
  }, 300);
})();

(function(){
  if(window.__GF_OC_KPI_RESULT_FORCE__)return;
  window.__GF_OC_KPI_RESULT_FORCE__=true;
  var st=document.createElement('style');
  st.textContent=`
    #gfOperationConsulta #gfOcKpiResult.gfOcKpiResult{display:none;background:#fff!important;border:1px solid #dbe7f6!important;border-radius:22px!important;box-shadow:0 12px 28px rgba(28,55,100,.075)!important;padding:16px!important;margin:0 0 16px!important;min-height:110px!important;height:auto!important;max-height:none!important;overflow:visible!important;color:#06163f!important;font-size:14px!important;line-height:1.35!important;}
    #gfOperationConsulta #gfOcKpiResult.gfOcKpiResult[style*="block"]{display:block!important;}
    #gfOperationConsulta #gfOcKpiResult *{visibility:visible!important;opacity:1!important;}
  `;
  document.head.appendChild(st);
})();


/* GF_OC_KPI_FLOAT_RETURN_FIX_20260618
   Mantém a lista suspensa do KPI viva ao abrir um chamado.
   Fluxo: card KPI -> lista suspensa -> Ver detalhes -> fechar chamado -> volta para a mesma lista.
*/
(function(){
  if(window.__gfOcKpiFloatReturnFix20260618) return;
  window.__gfOcKpiFloatReturnFix20260618=true;
  function restoreKpiFloat(){
    try{
      var ctx=window.__gfOcKpiReturnAfterTicket;
      if(!ctx || !ctx.active) return false;
      var bg=document.getElementById('gfOcKpiFloatBg');
      var panel=document.getElementById('gfOcKpiFloatPanel');
      if(!panel){ window.__gfOcKpiReturnAfterTicket=null; return false; }
      if(bg){ bg.style.removeProperty('display'); }
      panel.style.removeProperty('display');
      var body=panel.querySelector('.gfOcKpiFloatBody');
      setTimeout(function(){ try{ if(body) body.scrollTop=Number(ctx.scroll||0); }catch(e){} }, 30);
      setTimeout(function(){ try{ if(body) body.scrollTop=Number(ctx.scroll||0); }catch(e){} }, 160);
      window.__gfOcKpiReturnAfterTicket=null;
      return true;
    }catch(e){ return false; }
  }
  window.gfRestoreKpiFloatAfterTicket=restoreKpiFloat;
  var oldRestore=window.gfRestoreOperationConsultaContext;
  window.gfRestoreOperationConsultaContext=function(){
    var a=false,b=false;
    try{ if(typeof oldRestore==='function') a=!!oldRestore.apply(this, arguments); }catch(e){}
    try{ b=!!restoreKpiFloat(); }catch(e){}
    return a||b;
  };
  var oldClose=window.closeDrawer;
  window.closeDrawer=function(){
    var r;
    try{ if(typeof oldClose==='function') r=oldClose.apply(this, arguments); }
    finally{ setTimeout(function(){ try{ restoreKpiFloat(); }catch(e){} }, 40); }
    return r;
  };
  try{ closeDrawer=window.closeDrawer; }catch(e){}
  document.addEventListener('click', function(ev){
    try{
      var target=ev.target;
      if(!target || !target.closest) return;
      var btn=target.closest('#gfOcKpiFloatPanel [data-detail]');
      if(!btn) return;
      var raw=String(btn.getAttribute('data-detail')||'');
      if(raw.indexOf('__TICKET_')!==0) return;
      var panel=document.getElementById('gfOcKpiFloatPanel');
      var bg=document.getElementById('gfOcKpiFloatBg');
      var body=panel && panel.querySelector('.gfOcKpiFloatBody');
      window.__gfOcKpiReturnAfterTicket={active:true,scroll:body?Number(body.scrollTop||0):0,at:Date.now()};
      if(bg) bg.style.setProperty('display','none','important');
      if(panel) panel.style.setProperty('display','none','important');
    }catch(e){}
  }, true);

  // Se a lista foi fechada manualmente ou o usuário mexeu na consulta, não restaura sozinha.
  document.addEventListener('click', function(ev){
    try{
      var target=ev.target;
      if(!target || !target.closest) return;
      if(target.closest('#gfOcKpiFloatPanel [data-detail]')) return;
      if(target.closest('#gfOcKpiFloatPanel .gfOcKpiFloatClose') || target.closest('#gfOcKpiFloatPanel .gfOcKpiFloatBtn') || target.closest('#gfOcKpiFloatBg')){
        window.__gfOcKpiReturnAfterTicket=null;
      }
      if(target.closest('#gfOperationConsulta input, #gfOperationConsulta select, #gfOperationConsulta button:not(.gfOcKpi)')){
        window.__gfOcKpiReturnAfterTicket=null;
      }
    }catch(e){}
  }, true);
})();

/* GF_OC_TODAY_COST_FAST_FIX_20260618
   Central inicia em Hoje, não pisca tela antiga e soma custos vindos de chamados/equipamentos. */
(function(){
  if(document.getElementById('gfOcNoFlickerTodayFix'))return;
  var st=document.createElement('style'); st.id='gfOcNoFlickerTodayFix';
  st.textContent='#pageOperacao.gfOpConsultaMode>*:not(#gfOperationConsulta){display:none!important}#pageOperacao.gfOpConsultaMode{background:linear-gradient(180deg,#eef6ff 0,#f8fbff 42%,#eef6ff 100%)!important}';
  document.head.appendChild(st);
})();


;(function(){
  try{
    if(document.getElementById('gfOcCustomDateFixCss'))return;
    var st=document.createElement('style');
    st.id='gfOcCustomDateFixCss';
    st.textContent='#gfOperationConsulta.gfOcCustom .gfOcDateRow{display:grid!important;grid-template-columns:1fr 1fr!important;gap:10px!important;margin-top:12px!important}#gfOperationConsulta .gfOcDateRow label{display:grid!important;gap:6px!important;color:#64748b!important;font-weight:900!important;font-size:12px!important}#gfOperationConsulta .gfOcDateRow span{text-transform:uppercase!important;letter-spacing:.04em!important}#gfOperationConsulta .gfOcDate{height:48px!important;border:1px solid #cfe0f5!important;border-radius:14px!important;padding:0 14px!important;font-weight:900!important;color:#0b2454!important;background:#fff!important}';
    document.head.appendChild(st);
  }catch(e){}
})();



/* GF_OC_MODAL_NAV_SHIELD_FINAL_20260618
   Corrige vazamento de clique para filtros/Excel atrás do modal e mantém navegação interna estável.
   Regra: enquanto gfOcModal estiver aberto, só o modal recebe clique; a consulta atrás fica sem ponteiro.
*/
(function(){
  if(window.__gfOcModalNavShieldFinal20260618) return;
  window.__gfOcModalNavShieldFinal20260618=true;
  function blurActive(){
    try{ var a=document.activeElement; if(a && a.blur) a.blur(); }catch(e){}
    try{ document.querySelectorAll('#gfOperationConsulta select').forEach(function(s){ try{s.blur();}catch(_e){} }); }catch(e){}
  }
  function modalVisible(){
    var m=document.getElementById('gfOcModal');
    return !!(m && m.classList.contains('show') && getComputedStyle(m).display!=='none');
  }
  function kpiVisible(){
    var p=document.getElementById('gfOcKpiFloatPanel');
    return !!(p && p.parentNode && getComputedStyle(p).display!=='none');
  }
  function applyOpenState(){
    try{
      var on=modalVisible() || kpiVisible();
      document.documentElement.classList.toggle('gfOcHardModalOpen', on);
      document.body.classList.toggle('gfOcHardModalOpen', on);
      if(on) blurActive();
    }catch(e){}
  }
  var css=document.createElement('style');
  css.id='gfOcModalNavShieldFinalCss';
  css.textContent='html.gfOcHardModalOpen #gfOperationConsulta{pointer-events:none!important} html.gfOcHardModalOpen #gfOcModal,html.gfOcHardModalOpen #gfOcModal *,html.gfOcHardModalOpen #gfOcModalBg,html.gfOcHardModalOpen #gfOcKpiFloatPanel,html.gfOcHardModalOpen #gfOcKpiFloatPanel *,html.gfOcHardModalOpen #gfOcKpiFloatBg{pointer-events:auto!important} #gfOcModalBg{z-index:2147483000!important} #gfOcModal{z-index:2147483001!important} #gfOcKpiFloatBg{z-index:2147483002!important} #gfOcKpiFloatPanel{z-index:2147483003!important}';
  try{document.head.appendChild(css)}catch(e){}

  document.addEventListener('pointerdown', function(ev){
    try{
      applyOpenState();
      var t=ev.target;
      if(!t || !t.closest) return;
      if(modalVisible()){
        if(t.closest('#gfOcModal') || t.closest('#gfOcModalBg')) return;
        ev.preventDefault(); ev.stopPropagation(); if(ev.stopImmediatePropagation)ev.stopImmediatePropagation();
        blurActive();
        return false;
      }
      if(kpiVisible()){
        if(t.closest('#gfOcKpiFloatPanel') || t.closest('#gfOcKpiFloatBg')) return;
        ev.preventDefault(); ev.stopPropagation(); if(ev.stopImmediatePropagation)ev.stopImmediatePropagation();
        blurActive();
        return false;
      }
    }catch(e){}
  }, true);

  document.addEventListener('click', function(ev){
    try{
      applyOpenState();
      var t=ev.target;
      if(!t || !t.closest) return;
      if(modalVisible() && !(t.closest('#gfOcModal') || t.closest('#gfOcModalBg'))){
        ev.preventDefault(); ev.stopPropagation(); if(ev.stopImmediatePropagation)ev.stopImmediatePropagation();
        blurActive(); return false;
      }
      if(kpiVisible() && !(t.closest('#gfOcKpiFloatPanel') || t.closest('#gfOcKpiFloatBg'))){
        ev.preventDefault(); ev.stopPropagation(); if(ev.stopImmediatePropagation)ev.stopImmediatePropagation();
        blurActive(); return false;
      }
    }catch(e){}
  }, true);

  // Quando clicar em Ver detalhes dentro do modal da Central, não deixa o evento cair no select/Excel por trás.
  document.addEventListener('click', function(ev){
    try{
      var t=ev.target;
      if(!t || !t.closest) return;
      var btn=t.closest('#gfOcModal [data-detail], #gfOcModalBody [data-detail]');
      if(!btn) return;
      var raw=String(btn.getAttribute('data-detail')||'');
      if(raw.indexOf('__TICKET_')!==0) return;
      ev.preventDefault(); ev.stopPropagation(); if(ev.stopImmediatePropagation)ev.stopImmediatePropagation();
      blurActive();
      var id=raw.replace('__TICKET_','').replace(/[^0-9]/g,'');
      if(!id) return false;
      if(typeof window.openTicketFromDashboard==='function') window.openTicketFromDashboard(Number(id));
      else if(typeof window.openDrawer==='function') window.openDrawer(Number(id));
      return false;
    }catch(e){}
  }, true);

  // Reaplica estado após abrir/fechar drawer ou restaurar modal.
  var oldRestore=window.gfRestoreOperationConsultaContext;
  window.gfRestoreOperationConsultaContext=function(){
    blurActive();
    var r=false;
    try{ if(typeof oldRestore==='function') r=!!oldRestore.apply(this, arguments); }catch(e){}
    setTimeout(applyOpenState,20); setTimeout(applyOpenState,180);
    return r;
  };
  var oldClose=window.closeDrawer;
  if(typeof oldClose==='function'){
    window.closeDrawer=function(){
      blurActive();
      var r=oldClose.apply(this, arguments);
      setTimeout(function(){ try{ if(window.gfRestoreOperationConsultaContext) window.gfRestoreOperationConsultaContext(); }catch(e){} applyOpenState(); },40);
      return r;
    };
    try{ closeDrawer=window.closeDrawer; }catch(e){}
  }
  setInterval(applyOpenState,500);
})();


/* GF_OC_DETAIL_LAYER_FINAL_20260618
   Cura direta: ao abrir detalhe vindo da Central, o modal da Central sai da frente,
   o drawer abre correto, e ao fechar o detalhe a mesma tela da Central volta.
   Também impede o clique do botão "Ver detalhes" de cair nos filtros/exportações atrás. */
(function(){
  'use strict';
  if(window.__GF_OC_DETAIL_LAYER_FINAL_20260618__) return;
  window.__GF_OC_DETAIL_LAYER_FINAL_20260618__ = true;

  var returnCtx = null;

  function n(v){ v=String(v||'').replace(/[^0-9]/g,''); return v?Number(v):0; }
  function byId(id){ return document.getElementById(id); }
  function visible(el){ return !!(el && el.classList && el.classList.contains('show') && el.style.display !== 'none'); }

  function allTickets(){
    var out=[];
    ['tickets','allTickets','dashboardTickets','gfDashboardTickets','operationTickets'].forEach(function(k){
      try{ if(Array.isArray(window[k])) out=out.concat(window[k]); }catch(e){}
    });
    try{ if(window.gfOpAllTicketsById) Object.keys(window.gfOpAllTicketsById).forEach(function(k){out.push(window.gfOpAllTicketsById[k]);}); }catch(e){}
    try{ if(window.gfDashboardFilterRowsById) Object.keys(window.gfDashboardFilterRowsById).forEach(function(k){out.push(window.gfDashboardFilterRowsById[k]);}); }catch(e){}
    return out.filter(Boolean);
  }

  function resolveInternalId(raw, el){
    var id=n(raw);
    if(!id && el){
      id=n(el.getAttribute('data-kpi-ticket')||el.getAttribute('data-gf-open-ticket')||el.getAttribute('data-ticket-id')||el.getAttribute('data-gf-ticket-id')||el.getAttribute('data-detail'));
      if(!id){ var m=String(el.textContent||'').match(/#\s*(\d+)/); if(m) id=n(m[1]); }
    }
    if(!id) return 0;
    var list=allTickets();
    var byInternal=list.find(function(t){ return n(t && (t.id||t.ticket_id))===id; });
    if(byInternal) return n(byInternal.id||byInternal.ticket_id);
    var byNumber=list.find(function(t){ return n(t && t.ticket_number)===id; });
    if(byNumber) return n(byNumber.id||byNumber.ticket_id)||id;
    return id;
  }

  function saveAndHideCentralModal(){
    var modal=byId('gfOcModal'), bg=byId('gfOcModalBg'), body=byId('gfOcModalBody');
    returnCtx = {
      active: visible(modal) || (modal && modal.style.display && modal.style.display!=='none'),
      scroll: body ? Number(body.scrollTop||0) : 0,
      at: Date.now()
    };
    document.body.classList.add('gfOcTicketDetailMode');
    document.documentElement.classList.add('gfOcTicketDetailMode');
    if(modal){ modal.classList.remove('show'); modal.style.display='none'; modal.style.visibility='hidden'; modal.style.pointerEvents='none'; }
    if(bg){ bg.classList.remove('show'); bg.style.display='none'; bg.style.visibility='hidden'; bg.style.pointerEvents='none'; }
    try{ var a=document.activeElement; if(a&&a.blur)a.blur(); }catch(e){}
    try{ document.querySelectorAll('#gfOperationConsulta select').forEach(function(s){try{s.blur()}catch(e){}}); }catch(e){}
  }

  function restoreCentralModal(){
    if(!returnCtx || !returnCtx.active) return false;
    var modal=byId('gfOcModal'), bg=byId('gfOcModalBg'), body=byId('gfOcModalBody');
    document.body.classList.remove('gfOcTicketDetailMode');
    document.documentElement.classList.remove('gfOcTicketDetailMode');
    if(bg){ bg.style.display='block'; bg.style.visibility='visible'; bg.style.pointerEvents='auto'; bg.classList.add('show'); }
    if(modal){ modal.style.display='flex'; modal.style.visibility='visible'; modal.style.pointerEvents='auto'; modal.classList.add('show'); }
    var s=Number(returnCtx.scroll||0);
    returnCtx=null;
    setTimeout(function(){ try{ if(body) body.scrollTop=s; }catch(e){} },30);
    setTimeout(function(){ try{ if(body) body.scrollTop=s; }catch(e){} },150);
    return true;
  }

  function openTicket(id){
    id=resolveInternalId(id);
    if(!id) return false;
    saveAndHideCentralModal();
    try{
      window.gfOpAllTicketsById = window.gfOpAllTicketsById || {};
      allTickets().forEach(function(t){ var tid=n(t&&(t.id||t.ticket_id)); if(tid) window.gfOpAllTicketsById[tid]=t; });
    }catch(e){}
    try{
      if(typeof window.gfOpenTicketCanonical==='function'){ window.gfOpenTicketCanonical(id); return true; }
      if(typeof window.gfOpenTicketStable==='function'){ window.gfOpenTicketStable(id); return true; }
      if(typeof window.openTicketFromDashboard==='function'){ window.openTicketFromDashboard(id); return true; }
      if(typeof window.openDrawer==='function'){ window.openDrawer(id); return true; }
    }catch(e){ console.warn('Falha ao abrir chamado da consulta:', e); }
    restoreCentralModal();
    return false;
  }

  window.gfOpenTicketFromConsultaFinal = openTicket;
  window.gfRestoreOperationConsultaContextFinal = restoreCentralModal;

  document.addEventListener('click', function(ev){
    var target=ev.target;
    if(!target || !target.closest) return;
    var modal=target.closest('#gfOcModal');
    if(!modal) return;
    var btn=target.closest('[data-kpi-ticket],[data-gf-open-ticket],[data-ticket-id],[data-gf-ticket-id],[data-detail]');
    if(!btn) return;
    var raw=btn.getAttribute('data-kpi-ticket') || btn.getAttribute('data-gf-open-ticket') || btn.getAttribute('data-ticket-id') || btn.getAttribute('data-gf-ticket-id') || btn.getAttribute('data-detail') || '';
    raw=String(raw||'');
    if(raw.indexOf('__TICKET_')===0) raw=raw.replace('__TICKET_','');
    // Só intercepta quando for chamado numérico. Itens como INTERNET/REQUISIÇÃO continuam abrindo a subtela normal.
    if(!n(raw) && !String(btn.textContent||'').match(/#\s*\d+/)) return;
    ev.preventDefault(); ev.stopPropagation(); if(ev.stopImmediatePropagation) ev.stopImmediatePropagation();
    openTicket(resolveInternalId(raw, btn));
    return false;
  }, true);

  var oldClose=window.closeDrawer;
  window.closeDrawer=function(){
    var r;
    try{ if(typeof oldClose==='function') r=oldClose.apply(this, arguments); }
    finally{ setTimeout(restoreCentralModal, 40); }
    return r;
  };
  try{ closeDrawer=window.closeDrawer; }catch(e){}
})();

/* GF_OC_FINAL_LAYER_GUARD_20260618
   Ferida real: algumas subtelas da Central abrem o drawer do chamado, mas o modal anterior
   continua na frente. Este guardião não cria tela nova: ele só esconde temporariamente a
   camada da Central quando o drawer aparece e devolve a mesma camada quando o drawer fecha. */
(function(){
  'use strict';
  if(window.__GF_OC_FINAL_LAYER_GUARD_20260618__) return;
  window.__GF_OC_FINAL_LAYER_GUARD_20260618__ = true;

  var saved = null;
  function byId(id){ return document.getElementById(id); }
  function isShown(el){
    if(!el) return false;
    try{
      var cs=getComputedStyle(el);
      return el.classList.contains('show') && cs.display!=='none' && cs.visibility!=='hidden' && cs.opacity!=='0';
    }catch(e){ return !!(el.classList && el.classList.contains('show')); }
  }
  function drawerOpen(){ return isShown(byId('drawer')) || isShown(document.querySelector('.drawer.show')); }
  function centralOpen(){ return isShown(byId('gfOcModal')) || isShown(byId('gfOcKpiFloatPanel')); }

  function saveAndHide(){
    if(saved || !centralOpen()) return;
    var m=byId('gfOcModal'), mb=byId('gfOcModalBg'), k=byId('gfOcKpiFloatPanel'), kb=byId('gfOcKpiFloatBg');
    var body=byId('gfOcModalBody'), kbody=k && k.querySelector('.gfOcKpiFloatBody');
    saved={
      modal: isShown(m), modalScroll: body?Number(body.scrollTop||0):0,
      kpi: isShown(k), kpiScroll: kbody?Number(kbody.scrollTop||0):0
    };
    [m,mb,k,kb].forEach(function(el){
      if(!el) return;
      el.setAttribute('data-gf-hidden-for-ticket','1');
      el.classList.remove('show');
      el.style.setProperty('display','none','important');
      el.style.setProperty('visibility','hidden','important');
      el.style.setProperty('pointer-events','none','important');
    });
    document.documentElement.classList.add('gfOcTicketOnTop');
    document.body.classList.add('gfOcTicketOnTop');
  }

  function restore(){
    if(!saved) return false;
    if(drawerOpen()) return false;
    var s=saved; saved=null;
    var m=byId('gfOcModal'), mb=byId('gfOcModalBg'), k=byId('gfOcKpiFloatPanel'), kb=byId('gfOcKpiFloatBg');
    document.documentElement.classList.remove('gfOcTicketOnTop');
    document.body.classList.remove('gfOcTicketOnTop');
    function show(el,display){
      if(!el) return;
      el.removeAttribute('data-gf-hidden-for-ticket');
      el.style.removeProperty('display');
      el.style.removeProperty('visibility');
      el.style.removeProperty('pointer-events');
      el.style.display=display;
      el.classList.add('show');
    }
    if(s.modal){ show(mb,'block'); show(m,'flex'); }
    if(s.kpi){ show(kb,'block'); show(k,'flex'); }
    setTimeout(function(){
      try{ var body=byId('gfOcModalBody'); if(body) body.scrollTop=Number(s.modalScroll||0); }catch(e){}
      try{ var kp=byId('gfOcKpiFloatPanel'); var kbdy=kp&&kp.querySelector('.gfOcKpiFloatBody'); if(kbdy) kbdy.scrollTop=Number(s.kpiScroll||0); }catch(e){}
    },40);
    return true;
  }

  function enforce(){
    try{
      var bg=byId('drawerBg') || document.querySelector('.drawerBg');
      var dr=byId('drawer') || document.querySelector('.drawer');
      if(drawerOpen()){
        saveAndHide();
        if(bg){
          bg.style.setProperty('background','transparent','important');
          bg.style.setProperty('backdrop-filter','none','important');
          bg.style.setProperty('-webkit-backdrop-filter','none','important');
          bg.style.setProperty('pointer-events','none','important');
          bg.style.setProperty('z-index','2147483600','important');
        }
        if(dr){
          dr.style.setProperty('z-index','2147483601','important');
          dr.style.setProperty('pointer-events','auto','important');
          dr.style.setProperty('visibility','visible','important');
          dr.style.setProperty('opacity','1','important');
        }
      }else{
        restore();
      }
    }catch(e){}
  }

  var oldClose=window.closeDrawer;
  if(typeof oldClose==='function'){
    window.closeDrawer=function(){
      var r;
      try{ r=oldClose.apply(this, arguments); }
      finally{ setTimeout(enforce,20); setTimeout(restore,80); }
      return r;
    };
    try{ closeDrawer=window.closeDrawer; }catch(e){}
  }

  document.addEventListener('click', function(ev){
    try{
      var t=ev.target;
      if(!t || !t.closest) return;
      if(t.closest('#gfOcModal [data-detail], #gfOcKpiFloatPanel [data-detail], #gfOcModal [data-kpi-ticket], #gfOcKpiFloatPanel [data-kpi-ticket]')){
        setTimeout(enforce,0); setTimeout(enforce,80); setTimeout(enforce,220);
      }
    }catch(e){}
  }, true);

  try{ new MutationObserver(enforce).observe(document.body,{subtree:true,attributes:true,attributeFilter:['class','style']}); }catch(e){}
  setInterval(enforce,250);
})();

/* FIX FOTO: garante botão fechar e camada acima de todos os drawers/modais */
(function(){
  if(window.__gfPhotoViewerTopFix) return;
  window.__gfPhotoViewerTopFix = true;
  function byId(id){ return document.getElementById(id); }
  function ensureChrome(){
    var b = byId('gfImageViewer') || document.querySelector('.gfImageViewer');
    if(!b) return null;
    if(!b.id) b.id = 'gfImageViewer';
    b.classList.add('gfImageViewer');
    var stage = byId('gfImageViewerStage') || b.querySelector('.gfImageViewerStage');
    var im = byId('gfImageViewerImg') || b.querySelector('img');
    if(!stage){
      stage = document.createElement('div');
      stage.id = 'gfImageViewerStage';
      stage.className = 'gfImageViewerStage';
      while(b.firstChild) stage.appendChild(b.firstChild);
      b.appendChild(stage);
    }
    if(!im){
      im = document.createElement('img');
      im.id = 'gfImageViewerImg';
      im.alt = 'Foto do chamado';
      stage.appendChild(im);
    }else{
      if(!im.id) im.id = 'gfImageViewerImg';
      if(im.parentElement !== stage) stage.appendChild(im);
    }
    var close = byId('gfImageViewerClose') || b.querySelector('.gfImageViewerClose');
    if(!close){
      close = document.createElement('button');
      close.id = 'gfImageViewerClose';
      close.type = 'button';
      close.className = 'gfImageViewerClose';
      close.setAttribute('aria-label','Fechar foto');
      close.textContent = '×';
      b.appendChild(close);
    }
    close.onclick = function(ev){
      ev.preventDefault(); ev.stopPropagation();
      if(typeof window.closeGfImageViewer === 'function') window.closeGfImageViewer();
      else b.classList.remove('show');
    };
    b.style.zIndex = '2147483647';
    stage.style.zIndex = '2147483647';
    im.style.zIndex = '2147483647';
    close.style.zIndex = '2147483647';
    return b;
  }
  var oldOpen = window.openGfImageViewer;
  window.openGfImageViewer = function(src,title){
    var b = ensureChrome();
    document.body.classList.add('gf-photo-open');
    if(typeof oldOpen === 'function') oldOpen.apply(this, arguments);
    b = ensureChrome() || b;
    if(b){
      b.classList.add('show');
      b.setAttribute('aria-hidden','false');
      b.style.display = 'flex';
      b.style.zIndex = '2147483647';
      var im = byId('gfImageViewerImg') || b.querySelector('img');
      if(im && src) im.src = src;
      var tt = byId('gfImageViewerTitle') || b.querySelector('.gfImageViewerTitle');
      if(tt) tt.textContent = title || 'Foto do chamado';
    }
  };
  var oldClose = window.closeGfImageViewer;
  window.closeGfImageViewer = function(skipHistory){
    var b = ensureChrome();
    document.body.classList.remove('gf-photo-open');
    if(typeof oldClose === 'function') oldClose.apply(this, arguments);
    if(b){ b.classList.remove('show'); b.setAttribute('aria-hidden','true'); b.style.display='none'; }
  };
  document.addEventListener('click', function(ev){
    var b = byId('gfImageViewer') || document.querySelector('.gfImageViewer');
    if(!b || !b.classList.contains('show')) return;
    if(ev.target.closest && ev.target.closest('#gfImageViewerClose,.gfImageViewerClose')){
      ev.preventDefault(); ev.stopPropagation();
      window.closeGfImageViewer();
    }
  }, true);
  document.addEventListener('keydown', function(ev){
    var b = byId('gfImageViewer') || document.querySelector('.gfImageViewer');
    if(b && b.classList.contains('show') && ev.key === 'Escape'){
      ev.preventDefault(); ev.stopPropagation(); window.closeGfImageViewer();
    }
  }, true);
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ensureChrome); else ensureChrome();
})();






/* FOTO VIEWER - PADRÃO ÚNICO DEFINITIVO
   Mantém apenas 1 botão de fechar. Remove botões antigos/fantasmas.
*/
(function(){
  if(window.__gfPhotoViewerSingleCloseFinal) return;
  window.__gfPhotoViewerSingleCloseFinal = true;

  function viewer(){
    return document.getElementById('gfImageViewer') || document.querySelector('.gfImageViewer');
  }

  function removeOldButtons(){
    document.querySelectorAll(
      '#gfImageViewerCloseHitbox,.gfImageViewerCloseHitbox,#gfImageViewerClose,.gfImageViewerClose,[data-gf-photo-close],.gf-photo-close,.photo-close,.image-viewer-close'
    ).forEach(function(btn){
      if(btn && btn.id !== 'gfPhotoCloseSingle'){
        try{ btn.remove(); }catch(e){
          btn.style.display = 'none';
          btn.style.pointerEvents = 'none';
          btn.setAttribute('aria-hidden','true');
        }
      }
    });
  }

  function ensureSingleButton(){
    removeOldButtons();

    var btn = document.getElementById('gfPhotoCloseSingle');
    if(!btn){
      btn = document.createElement('button');
      btn.id = 'gfPhotoCloseSingle';
      btn.className = 'gf-photo-close-single';
      btn.type = 'button';
      btn.setAttribute('aria-label','Fechar foto');
      btn.innerHTML = '<span>×</span>';
      document.body.appendChild(btn);
    }

    btn.onclick = closePhoto;
    btn.onpointerdown = null;
    btn.onmousedown = null;
    btn.ontouchstart = null;

    return btn;
  }

  function showButton(){
    var btn = ensureSingleButton();
    btn.style.display = 'flex';
    btn.style.pointerEvents = 'auto';
  }

  function hideButton(){
    var btn = document.getElementById('gfPhotoCloseSingle');
    if(btn){
      btn.style.display = 'none';
      btn.style.pointerEvents = 'none';
    }
  }

  function closePhoto(ev){
    try{
      if(ev){
        ev.preventDefault();
        ev.stopPropagation();
        if(ev.stopImmediatePropagation) ev.stopImmediatePropagation();
      }
    }catch(e){}

    var v = viewer();

    try{ document.body.classList.remove('gf-photo-open','photo-open','image-open'); }catch(e){}
    try{ document.body.style.overflow = ''; }catch(e){}

    if(v){
      v.classList.remove('show','open','active');
      v.setAttribute('aria-hidden','true');
      v.style.display = 'none';
      v.style.pointerEvents = 'none';

      var img = document.getElementById('gfImageViewerImg') || v.querySelector('img');
      if(img){
        try{ img.style.transform = ''; }catch(e){}
      }
    }

    hideButton();
    removeOldButtons();

    return false;
  }

  window.gfPhotoCloseSingle = closePhoto;
  window.gfForceClosePhotoViewer = closePhoto;

  var oldOpen = window.openGfImageViewer;
  window.openGfImageViewer = function(){
    var r;
    try{
      if(typeof oldOpen === 'function') r = oldOpen.apply(this, arguments);
    }catch(e){}

    var v = viewer();
    if(v){
      v.classList.add('show');
      v.setAttribute('aria-hidden','false');
      v.style.display = 'flex';
      v.style.pointerEvents = 'auto';
      v.style.zIndex = '2147483646';
    }

    try{ document.body.classList.add('gf-photo-open'); }catch(e){}
    showButton();
    return r;
  };

  var oldClose = window.closeGfImageViewer;
  window.closeGfImageViewer = function(){
    try{
      if(typeof oldClose === 'function') oldClose.apply(this, arguments);
    }catch(e){}
    return closePhoto();
  };

  ['click'].forEach(function(type){
    document.addEventListener(type,function(ev){
      var t = ev.target;
      if(!t || !t.closest) return;
      if(t.closest('#gfPhotoCloseSingle,.gf-photo-close-single')){
        return closePhoto(ev);
      }
    }, {capture:true, passive:false});
  });

  document.addEventListener('keydown',function(ev){
    if(ev.key === 'Escape'){
      var v = viewer();
      if(v && (v.classList.contains('show') || v.style.display === 'flex' || v.style.display === 'block')){
        closePhoto(ev);
      }
    }
  }, true);

  function sync(){
    removeOldButtons();
    var v = viewer();
    var isOpen = v && (v.classList.contains('show') || v.style.display === 'flex' || v.style.display === 'block');
    if(isOpen) showButton();
    else hideButton();
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', sync);
  }else{
    sync();
  }

  setInterval(sync, 600);
})();

/* GF_FIX_CLIQUE_REAL_IPHONE_FINALIZAR_20260619E
   Cura limpa: não intercepta o site inteiro; só cancela o clique gerado após arrastar nos cards/KPIs. */
(function(){
  if(window.__GF_FIX_CLIQUE_REAL_IPHONE_FINALIZAR_20260619E__) return;
  window.__GF_FIX_CLIQUE_REAL_IPHONE_FINALIZAR_20260619E__ = true;

  var sx=0, sy=0, started=false, moved=false, blockUntil=0;
  var targets = '#pageDashboard .v8Kpi,[data-gf-dash-type],.gfDashTicketCard,.v9Ticket,.v9FilterItem,.gfTicketCard,.gfV216Card,.trackTicketClickable,.historyItem,tr.ticketClickable,[data-ticket-id],[data-gf-ticket-id],[data-gf-open-ticket]';
  function mobile(){ try{return !!(matchMedia('(hover:none),(pointer:coarse),(max-width:900px)').matches);}catch(e){return false;} }
  function point(ev){ var t=(ev.touches&&ev.touches[0])||(ev.changedTouches&&ev.changedTouches[0])||ev; return {x:Number(t.clientX||0), y:Number(t.clientY||0)}; }
  function isTouch(ev){ return ev && (ev.type.indexOf('touch')===0 || ev.pointerType==='touch'); }
  function inside(ev){ var t=ev&&ev.target; return !!(t&&t.closest&&t.closest(targets)); }
  function block(ev){ try{ ev.preventDefault(); ev.stopPropagation(); if(ev.stopImmediatePropagation) ev.stopImmediatePropagation(); }catch(e){} return false; }

  function down(ev){
    if(!mobile() || !isTouch(ev) || !inside(ev)) return;
    var p=point(ev); sx=p.x; sy=p.y; started=true; moved=false;
  }
  function move(ev){
    if(!started || !mobile() || !isTouch(ev)) return;
    var p=point(ev);
    if(Math.max(Math.abs(p.x-sx), Math.abs(p.y-sy))>18){ moved=true; blockUntil=Date.now()+260; }
  }
  function up(ev){
    if(!started || !mobile() || !isTouch(ev)) return;
    var p=point(ev);
    if(moved || Math.max(Math.abs(p.x-sx), Math.abs(p.y-sy))>18){ blockUntil=Date.now()+260; }
    setTimeout(function(){ started=false; moved=false; }, 80);
  }

  document.addEventListener('touchstart', down, {capture:true, passive:true});
  document.addEventListener('touchmove', move, {capture:true, passive:true});
  document.addEventListener('touchend', up, {capture:true, passive:true});
  document.addEventListener('pointerdown', down, {capture:true, passive:true});
  document.addEventListener('pointermove', move, {capture:true, passive:true});
  document.addEventListener('pointerup', up, {capture:true, passive:true});

  window.gfWasTouchScrollClick = function(){ return mobile() && Date.now()<blockUntil; };
  document.addEventListener('click', function(ev){
    if(!mobile() || !inside(ev)) return;
    if(Date.now()<blockUntil) return block(ev);
  }, true);

  function bringResolveFront(){
    var bg=document.getElementById('resolveBg') || document.querySelector('.resolveBg') || window.resolveBg;
    if(!bg) return;
    try{ if(bg.parentElement!==document.body) document.body.appendChild(bg); }catch(e){}
    if(!bg.classList.contains('show')) return;
    bg.style.setProperty('position','fixed','important');
    bg.style.setProperty('inset','0','important');
    bg.style.setProperty('display','flex','important');
    bg.style.setProperty('z-index','2147483200','important');
    bg.style.setProperty('pointer-events','auto','important');
    var modal=bg.querySelector('.resolveModal');
    if(modal){
      modal.style.setProperty('position','relative','important');
      modal.style.setProperty('z-index','2147483201','important');
      modal.style.setProperty('pointer-events','auto','important');
    }
    document.body.classList.add('resolveOpen');
  }

  function wrapResolve(){
    if(typeof window.openResolveModal==='function' && !window.openResolveModal.__gfFrontClean20260619E){
      var old=window.openResolveModal;
      window.openResolveModal=function(){
        var r=old.apply(this, arguments);
        bringResolveFront();
        setTimeout(bringResolveFront, 0);
        setTimeout(bringResolveFront, 80);
        return r;
      };
      window.openResolveModal.__gfFrontClean20260619E=true;
      try{ openResolveModal=window.openResolveModal; }catch(e){}
    }
  }
  wrapResolve();
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', wrapResolve, {once:true});
  setTimeout(wrapResolve,300);
  document.addEventListener('click', function(ev){
    var btn=ev.target&&ev.target.closest&&ev.target.closest('#btnFinishTicket,[data-gf-resolve-ticket]');
    if(btn){ setTimeout(bringResolveFront,0); setTimeout(bringResolveFront,80); }
  }, true);
})();



/* GF_FIX_TOQUE_E_FECHAR_FINALIZAR_20260619F
   Ajuste final: toque real continua no click normal; arrasto só bloqueia por pouco tempo.
   Fechamento do modal de finalizar é direto e não depende dos handlers antigos. */
(function(){
  if(window.__GF_FIX_TOQUE_E_FECHAR_FINALIZAR_20260619F__) return;
  window.__GF_FIX_TOQUE_E_FECHAR_FINALIZAR_20260619F__ = true;

  function isResolveBg(el){ return !!(el && (el.id === 'resolveBg' || (el.classList && el.classList.contains('resolveBg')))); }
  function bg(){ return document.getElementById('resolveBg') || document.querySelector('.resolveBg') || window.resolveBg || null; }
  function opened(){ var b=bg(); return !!(b && b.classList && b.classList.contains('show')); }

  function forceCloseResolve(ev){
    try{
      if(ev){ ev.preventDefault(); ev.stopPropagation(); if(ev.stopImmediatePropagation) ev.stopImmediatePropagation(); }
    }catch(e){}
    var b=bg();
    try{ if(typeof window.stopResolveCamera === 'function') window.stopResolveCamera(); }catch(e){}
    try{ if(typeof window.gfStopResolveCamera === 'function') window.gfStopResolveCamera(); }catch(e){}
    try{ window.pendingResolveTicketId = null; }catch(e){}
    if(b){
      b.classList.remove('show');
      b.style.removeProperty('display');
      b.style.removeProperty('pointer-events');
      b.style.removeProperty('z-index');
      b.style.removeProperty('position');
      b.style.removeProperty('inset');
      b.style.removeProperty('background');
    }
    try{ document.body.classList.remove('resolveOpen'); }catch(e){}
    try{ document.documentElement.classList.remove('gfResolveModalLocked'); }catch(e){}
    try{
      var d=document.getElementById('drawer');
      var db=document.getElementById('drawerBg');
      if(d && d.classList.contains('show') && db) db.classList.add('show');
    }catch(e){}
    return false;
  }

  window.gfForceCloseResolveModal20260619F = forceCloseResolve;
  var oldClose = window.closeResolveModal;
  window.closeResolveModal = function(){
    try{ if(typeof oldClose === 'function') oldClose.apply(this, arguments); }catch(e){}
    return forceCloseResolve();
  };
  try{ closeResolveModal = window.closeResolveModal; }catch(e){}

  function isCloseButton(t){
    if(!t || !t.closest) return false;
    var btn=t.closest('#resolveBg .resolveClose,#resolveBg [data-gf-close-resolve],#resolveBg [onclick*="closeResolveModal"],#resolveBg button,.resolveBg .resolveClose,.resolveBg [onclick*="closeResolveModal"],.resolveBg button');
    if(!btn) return false;
    var txt=String(btn.textContent||btn.value||btn.getAttribute('aria-label')||btn.title||'').replace(/\s+/g,' ').trim().toUpperCase();
    if(btn.matches('.resolveClose,[data-gf-close-resolve],[onclick*="closeResolveModal"]')) return true;
    return txt === '×' || txt === 'X' || txt.indexOf('CANCELAR') >= 0 || txt.indexOf('VOLTAR') >= 0 || txt.indexOf('FECHAR') >= 0;
  }

  document.addEventListener('click', function(ev){
    if(!opened()) return;
    if(isCloseButton(ev.target)) return forceCloseResolve(ev);
    var b=bg();
    if(b && ev.target === b) return forceCloseResolve(ev);
  }, true);

  document.addEventListener('keydown', function(ev){
    if(opened() && ev.key === 'Escape') return forceCloseResolve(ev);
  }, true);

  var oldOpen = window.openResolveModal;
  if(typeof oldOpen === 'function' && !oldOpen.__gfResolveCloseFix20260619F){
    window.openResolveModal = function(){
      var r=oldOpen.apply(this, arguments);
      setTimeout(function(){
        var b=bg();
        if(!b) return;
        try{ if(b.parentElement !== document.body) document.body.appendChild(b); }catch(e){}
        b.style.setProperty('z-index','2147483200','important');
        b.style.setProperty('pointer-events','auto','important');
        var m=b.querySelector('.resolveModal');
        if(m){
          m.style.setProperty('z-index','2147483201','important');
          m.style.setProperty('pointer-events','auto','important');
        }
        b.querySelectorAll('.resolveClose,[onclick*="closeResolveModal"]').forEach(function(x){ x.setAttribute('type','button'); x.setAttribute('data-gf-close-resolve','1'); });
      }, 0);
      return r;
    };
    window.openResolveModal.__gfResolveCloseFix20260619F = true;
    try{ openResolveModal = window.openResolveModal; }catch(e){}
  }
})();


/* GF_SAFE_TICKET_ACTION_IDS_20260620
   Correção definitiva de ação em cards agrupados:
   - Assumir/finalizar sempre usam o ID real do chamado exibido no card.
   - Não usa ticket_number para ação de escrita.
   - Não usa current como fallback quando o card é outro chamado.
   - Envia company_id/ticket_id no corpo só como auditoria defensiva; o servidor continua validando pela sessão. */
(function(){
  if(window.__GF_SAFE_TICKET_ACTION_IDS_20260620__) return;
  window.__GF_SAFE_TICKET_ACTION_IDS_20260620__ = true;

  function N(v){ var n=Number(String(v==null?'':v).replace(/^#/,'')); return Number.isFinite(n)&&n>0?n:0; }
  function arr(v){ return Array.isArray(v)?v:[]; }
  function api(){ return (typeof API!=='undefined' && API) ? API : window.location.origin; }
  function ticketId(t){ return N(t && (t.id || t.ticket_id)); }
  function allTickets(){
    var out=[];
    try{ out=out.concat(arr(window.tickets)); }catch(e){}
    try{ out=out.concat(arr(tickets)); }catch(e){}
    try{ out=out.concat(arr(window.dashboardAllTickets)); }catch(e){}
    try{ out=out.concat(arr(window.dashboardOpenTickets)); }catch(e){}
    try{ out=out.concat(arr(window.DB && window.DB.rows)); }catch(e){}
    var seen={}, clean=[];
    out.forEach(function(t){ var id=ticketId(t); if(id && !seen[id]){ seen[id]=1; clean.push(t); } });
    return clean;
  }
  function localTicket(id){ id=N(id); return allTickets().find(function(t){ return ticketId(t)===id; }) || null; }
  function upsert(t){
    if(!t) return null;
    try{ if(typeof window.upsertTicketLocal==='function') window.upsertTicketLocal(t); }catch(e){}
    try{
      if(!Array.isArray(window.tickets)) window.tickets=[];
      var id=ticketId(t), i=window.tickets.findIndex(function(x){return ticketId(x)===id;});
      if(i>=0) window.tickets[i]=Object.assign({},window.tickets[i],t); else window.tickets.unshift(t);
      try{ tickets=window.tickets; }catch(e){}
    }catch(e){}
    return t;
  }
  async function fetchExact(id){
    id=N(id); if(!id) return null;
    try{
      var r=await fetch(api()+'/api/admin/tickets/by-db-id/'+encodeURIComponent(id),{credentials:'include',cache:'no-store'});
      if(r.status===401){ location.href='/login'; return null; }
      if(!r.ok) return null;
      var j=await r.json().catch(function(){return null;});
      var t=j && (j.ticket || (Array.isArray(j.tickets)&&j.tickets[0]));
      return t ? upsert(t) : null;
    }catch(e){ return null; }
  }
  async function requireExactTicket(id, action){
    id=N(id);
    if(!id){ alert('Chamado inválido.'); return null; }
    var t=localTicket(id) || await fetchExact(id);
    if(!t || ticketId(t)!==id){ alert('Não consegui validar o chamado correto para '+(action||'essa ação')+'. Atualize a tela e tente novamente.'); return null; }
    return t;
  }
  function idFromButton(btn, attr){
    if(!btn) return 0;
    /* Em card agrupado a fonte de verdade precisa ser o ARTICLE do card visível.
       Nunca usar closest('[data-gf-ticket-id]'), porque o próprio botão também tem esse atributo
       e pode ficar com o id antigo do item anterior do carrossel. */
    var card=btn.closest && btn.closest('.gfDashTicketCard');
    var cardId=card ? N(card.getAttribute('data-ticket-id') || card.getAttribute('data-gf-ticket-id')) : 0;
    if(cardId) return cardId;
    if(card){
      var num=card.querySelector && card.querySelector('.gfDashTicketNum');
      var publicNo=N(num && num.textContent);
      if(publicNo){
        try{
          var lists=[];
          if(Array.isArray(window.tickets)) lists.push(window.tickets);
          if(typeof tickets!=='undefined' && Array.isArray(tickets)) lists.push(tickets);
          if(Array.isArray(window.allTickets)) lists.push(window.allTickets);
          for(var i=0;i<lists.length;i++){
            var found=lists[i].find(function(t){return Number(t&&t.ticket_number)===publicNo || Number(t&&t.number)===publicNo || Number(t&&t.id)===publicNo;});
            if(found) return N(found.id);
          }
        }catch(e){}
      }
    }
    return N(btn.getAttribute(attr) || btn.getAttribute('data-gf-ticket-id') || btn.getAttribute('data-ticket-id'));
  }

  var nativeSetStatus = window.setStatus || (typeof setStatus==='function' ? setStatus : null);
  if(typeof nativeSetStatus==='function'){
    window.setStatus = async function(id,status,solutionText,finalOutcome){
      id=N(id);
      var action=String(status||'').toUpperCase()==='DONE'?'finalizar':'assumir';
      var t=await requireExactTicket(id, action);
      if(!t) return false;
      try{ window.__gfActionTicketContext = {id:id, company_id:t.company_id||null, user_id:(window.currentUser&&window.currentUser.id)||null}; }catch(e){}
      return nativeSetStatus.call(this, id, status, solutionText||'', finalOutcome||'RESOLVED');
    };
    try{ setStatus = window.setStatus; }catch(e){}
  }

  var nativeOpenResolve = window.openResolveModal || (typeof openResolveModal==='function' ? openResolveModal : null);
  if(typeof nativeOpenResolve==='function'){
    window.openResolveModal = async function(id){
      id=N(id);
      var t=await requireExactTicket(id, 'finalizar');
      if(!t) return false;
      return nativeOpenResolve.call(this, id);
    };
    try{ openResolveModal = window.openResolveModal; }catch(e){}
  }

  /* Garante que os botões renderizados no dashboard carreguem o id real do chamado exibido. */
  var nativeActions = window.ticketCardActionsHtml;
  window.ticketCardActionsHtml = function(t, openFn){
    var id=ticketId(t), company=t&&t.company_id?t.company_id:'';
    if(!id && typeof nativeActions==='function') return nativeActions(t,openFn);
    var openCall=openFn||'openTicketFromDashboard';
    var html='<button class="btn btnLight" type="button" data-gf-open-ticket="'+id+'" data-gf-ticket-id="'+id+'" data-gf-company-id="'+company+'">Ver detalhes</button>';
    try{
      if(typeof canShowAssumeTicket==='function' && canShowAssumeTicket(t)) html+='<button class="btn btnWarn" type="button" data-gf-assume-ticket="'+id+'" data-gf-ticket-id="'+id+'" data-gf-company-id="'+company+'">Assumir chamado</button>';
      if(typeof canShowFinishTicket==='function' && canShowFinishTicket(t)) html+='<button class="btn btnDark" type="button" data-gf-resolve-ticket="'+id+'" data-gf-ticket-id="'+id+'" data-gf-company-id="'+company+'">Finalizar chamado</button>';
    }catch(e){ if(typeof nativeActions==='function') return nativeActions(t,openFn); }
    return html;
  };
  try{ ticketCardActionsHtml=window.ticketCardActionsHtml; }catch(e){}

  /* Captura única para impedir que onclick antigo ou card pai use outro ID. */
  document.addEventListener('click', function(ev){
    var target=ev.target;
    if(!target || !target.closest) return;
    var assume=target.closest('[data-gf-assume-ticket]');
    if(assume){
      var aid=idFromButton(assume,'data-gf-assume-ticket');
      ev.preventDefault(); ev.stopPropagation(); if(ev.stopImmediatePropagation) ev.stopImmediatePropagation();
      if(aid && window.setStatus) window.setStatus(aid,'IN_PROGRESS');
      return false;
    }
    var resolve=target.closest('[data-gf-resolve-ticket]');
    if(resolve){
      var rid=idFromButton(resolve,'data-gf-resolve-ticket');
      ev.preventDefault(); ev.stopPropagation(); if(ev.stopImmediatePropagation) ev.stopImmediatePropagation();
      if(rid && window.openResolveModal) window.openResolveModal(rid);
      return false;
    }
  }, true);

  /* Fetch defensivo: corpo sempre leva ticket_id e company_id quando for status. */
  var nativeFetch=window.fetch;
  if(nativeFetch && !nativeFetch.__gfSafeTicketActionFetch){
    var wrapped=function(input, init){
      try{
        var url=String(typeof input==='string'?input:(input&&input.url)||'');
        if(/\/api\/admin\/tickets\/\d+\/status/.test(url) && init && init.body && window.__gfActionTicketContext){
          var ctx=window.__gfActionTicketContext;
          if(typeof FormData!=='undefined' && init.body instanceof FormData){
            if(!init.body.get('ticket_id')) init.body.append('ticket_id', String(ctx.id||''));
            if(ctx.company_id && !init.body.get('company_id')) init.body.append('company_id', String(ctx.company_id));
          }else if(typeof init.body==='string' && /application\/json/i.test(String((init.headers&&init.headers['Content-Type'])||''))){
            var obj=JSON.parse(init.body||'{}');
            obj.ticket_id=ctx.id; if(ctx.company_id) obj.company_id=ctx.company_id;
            init=Object.assign({},init,{body:JSON.stringify(obj)});
          }
        }
      }catch(e){}
      return nativeFetch.apply(this, arguments.length===1?[input]:[input,init]);
    };
    wrapped.__gfSafeTicketActionFetch=true;
    window.fetch=wrapped;
  }
})();


/* GF_DASH_RELATED_VISIBLE_ID_FIX_20260620B
   Ação em card agrupado usa o chamado que está visível no card, não o id antigo do botão.
   Resolve caso: card mostra #198, mas confirmação tentava assumir #215. */
(function(){
  if(window.__GF_DASH_RELATED_VISIBLE_ID_FIX_20260620B__) return;
  window.__GF_DASH_RELATED_VISIBLE_ID_FIX_20260620B__=true;

  function N(v){ var n=Number(String(v==null?'':v).replace(/^#/,'')); return Number.isFinite(n)&&n>0?n:0; }
  function visibleIdFrom(el){
    var card=el && el.closest && el.closest('#v9LatestList .gfDashTicketCard, .gfDashTicketCard');
    if(!card) return 0;
    var id=N(card.getAttribute('data-ticket-id')||card.getAttribute('data-gf-ticket-id'));
    if(id) return id;
    var num=card.querySelector && card.querySelector('.gfDashTicketNum');
    var publicNo=N(num && num.textContent);
    if(publicNo){
      try{
        var lists=[];
        if(Array.isArray(window.tickets)) lists.push(window.tickets);
        if(typeof tickets!=='undefined' && Array.isArray(tickets)) lists.push(tickets);
        if(Array.isArray(window.allTickets)) lists.push(window.allTickets);
        for(var i=0;i<lists.length;i++){
          var found=lists[i].find(function(t){return Number(t&&t.ticket_number)===publicNo || Number(t&&t.number)===publicNo || Number(t&&t.id)===publicNo;});
          if(found) return N(found.id);
        }
      }catch(e){}
    }
    return 0;
  }
  function syncCardButtons(root){
    try{
      (root||document).querySelectorAll('#v9LatestList .gfDashTicketCard[data-ticket-id]').forEach(function(card){
        var id=N(card.getAttribute('data-ticket-id')||card.getAttribute('data-gf-ticket-id'));
        if(!id) return;
        card.querySelectorAll('[data-gf-assume-ticket]').forEach(function(b){ b.setAttribute('data-gf-assume-ticket',String(id)); b.setAttribute('data-gf-ticket-id',String(id)); });
        card.querySelectorAll('[data-gf-resolve-ticket]').forEach(function(b){ b.setAttribute('data-gf-resolve-ticket',String(id)); b.setAttribute('data-gf-ticket-id',String(id)); });
        card.querySelectorAll('[data-gf-open-ticket]').forEach(function(b){ b.setAttribute('data-gf-open-ticket',String(id)); b.setAttribute('data-gf-ticket-id',String(id)); });
      });
    }catch(e){}
  }

  document.addEventListener('click',function(ev){
    var target=ev.target;
    if(!target || !target.closest) return;
    var assume=target.closest('#v9LatestList [data-gf-assume-ticket], .gfDashTicketCard [data-gf-assume-ticket]');
    if(assume){
      var id=visibleIdFrom(assume) || N(assume.getAttribute('data-gf-assume-ticket'));
      ev.preventDefault(); ev.stopPropagation(); if(ev.stopImmediatePropagation) ev.stopImmediatePropagation();
      if(id && typeof window.setStatus==='function') window.setStatus(id,'IN_PROGRESS');
      return false;
    }
    var resolve=target.closest('#v9LatestList [data-gf-resolve-ticket], .gfDashTicketCard [data-gf-resolve-ticket]');
    if(resolve){
      var rid=visibleIdFrom(resolve) || N(resolve.getAttribute('data-gf-resolve-ticket'));
      ev.preventDefault(); ev.stopPropagation(); if(ev.stopImmediatePropagation) ev.stopImmediatePropagation();
      if(rid && typeof window.openResolveModal==='function') window.openResolveModal(rid);
      return false;
    }
  }, true);

  var mo=null;
  try{
    mo=new MutationObserver(function(){ syncCardButtons(document); });
    mo.observe(document.documentElement,{childList:true,subtree:true});
    setTimeout(function(){ syncCardButtons(document); },100);
    setTimeout(function(){ syncCardButtons(document); },800);
  }catch(e){}
})();


/* GF_ASSUMIR_NUMERO_VISIVEL_FIX_20260620C
   Corrige refresh/mobile: botão assume pelo ID interno, mas a confirmação e a ação usam o chamado visível no card. */
(function(){
  if(window.__GF_ASSUMIR_NUMERO_VISIVEL_FIX_20260620C__) return;
  window.__GF_ASSUMIR_NUMERO_VISIVEL_FIX_20260620C__ = true;
  function N(v){ var n=Number(String(v==null?'':v).replace(/[^0-9]/g,'')); return Number.isFinite(n)&&n>0?n:0; }
  function arr(v){ return Array.isArray(v)?v:[]; }
  function lists(){
    var out=[];
    try{ out=out.concat(arr(window.tickets)); }catch(e){}
    try{ if(typeof tickets!=='undefined') out=out.concat(arr(tickets)); }catch(e){}
    try{ out=out.concat(arr(window.allTickets)); }catch(e){}
    try{ out=out.concat(arr(window.dashboardAllTickets)); }catch(e){}
    try{ out=out.concat(arr(window.dashboardOpenTickets)); }catch(e){}
    try{ out=out.concat(arr(window.dashboardTickets)); }catch(e){}
    try{ out=out.concat(arr(window.gfDashboardTickets)); }catch(e){}
    try{ out=out.concat(arr(window.DB && window.DB.rows)); }catch(e){}
    try{ out=out.concat(arr(window.gfDashboardDB && window.gfDashboardDB.rows)); }catch(e){}
    try{ var g=window.gfDashRelatedGroups||{}; Object.keys(g).forEach(function(k){ out=out.concat(arr(g[k])); }); }catch(e){}
    var seen={}, clean=[];
    out.forEach(function(t){ var id=N(t&&(t.id||t.ticket_id)); if(id && !seen[id]){ seen[id]=1; clean.push(t); } });
    return clean;
  }
  function cardOf(el){ return el && el.closest && el.closest('#v9LatestList .gfDashTicketCard, .gfDashTicketCard, [data-ticket-id], [data-gf-ticket-id]'); }
  function publicFromCard(el){
    var card=cardOf(el); if(!card) return 0;
    var n=N(card.getAttribute('data-gf-public-ticket-number')||card.getAttribute('data-ticket-number'));
    if(n) return n;
    var num=card.querySelector && card.querySelector('.gfDashTicketNum');
    return N(num && num.textContent);
  }
  function internalFromPublic(pub){
    pub=N(pub); if(!pub) return 0;
    var rows=lists();
    var found=rows.find(function(t){ return N(t&&(t.ticket_number||t.number||t.public_number||t.protocol))===pub; });
    if(found) return N(found.id||found.ticket_id);
    found=rows.find(function(t){ return N(t&&(t.id||t.ticket_id))===pub; });
    return found?N(found.id||found.ticket_id):0;
  }
  function internalFromButton(btn){
    var card=cardOf(btn), pub=publicFromCard(btn), id=0;
    if(pub) id=internalFromPublic(pub);
    if(!id && card) id=N(card.getAttribute('data-ticket-id')||card.getAttribute('data-gf-ticket-id'));
    if(!id && btn) id=N(btn.getAttribute('data-gf-assume-ticket')||btn.getAttribute('data-gf-resolve-ticket')||btn.getAttribute('data-gf-open-ticket')||btn.getAttribute('data-gf-ticket-id'));
    return id;
  }
  function syncOne(card){
    if(!card) return;
    var pub=publicFromCard(card);
    var id=internalFromPublic(pub) || N(card.getAttribute('data-ticket-id')||card.getAttribute('data-gf-ticket-id'));
    if(id){ card.setAttribute('data-ticket-id',String(id)); card.setAttribute('data-gf-ticket-id',String(id)); }
    if(pub){ card.setAttribute('data-ticket-number',String(pub)); card.setAttribute('data-gf-public-ticket-number',String(pub)); }
    card.querySelectorAll('[data-gf-assume-ticket],[data-gf-resolve-ticket],[data-gf-open-ticket]').forEach(function(b){
      if(id){
        if(b.hasAttribute('data-gf-assume-ticket')) b.setAttribute('data-gf-assume-ticket',String(id));
        if(b.hasAttribute('data-gf-resolve-ticket')) b.setAttribute('data-gf-resolve-ticket',String(id));
        if(b.hasAttribute('data-gf-open-ticket')) b.setAttribute('data-gf-open-ticket',String(id));
        b.setAttribute('data-gf-ticket-id',String(id));
      }
      if(pub){ b.setAttribute('data-ticket-number',String(pub)); b.setAttribute('data-gf-public-ticket-number',String(pub)); }
    });
  }
  function syncAll(){ try{ document.querySelectorAll('#v9LatestList .gfDashTicketCard, .gfDashTicketCard').forEach(syncOne); }catch(e){} }
  var oldPublic=window.gfPublicTicketNumber;
  window.gfPublicTicketNumber=function(id){
    id=N(id);
    try{
      var rows=lists();
      var found=rows.find(function(t){ return N(t&&(t.id||t.ticket_id))===id; });
      if(found) return N(found.ticket_number||found.number||found.public_number||found.protocol)||id;
    }catch(e){}
    return (typeof oldPublic==='function' ? oldPublic(id) : id) || id;
  };
  window.gfConfirmAssumeBeforeStatus=async function(id,status){
    id=N(id); status=String(status||'').toUpperCase();
    if(status!=='IN_PROGRESS') return true;
    var display=window.__gfVisibleAssumePublicNumber || window.gfPublicTicketNumber(id) || id;
    if(window.__gfAssumeConfirmedTicketId===id) return true;
    var ok=await window.gfShowAssumeConfirmModal(id, display);
    if(!ok) return false;
    window.__gfAssumeConfirmedTicketId=id;
    setTimeout(function(){ if(window.__gfAssumeConfirmedTicketId===id) window.__gfAssumeConfirmedTicketId=0; },6000);
    return true;
  };
  document.addEventListener('click',function(ev){
    var target=ev.target;
    if(!target || !target.closest) return;
    var assume=target.closest('#v9LatestList [data-gf-assume-ticket], .gfDashTicketCard [data-gf-assume-ticket]');
    if(assume){
      syncOne(cardOf(assume));
      var pub=publicFromCard(assume);
      var id=internalFromButton(assume);
      if(id){
        ev.preventDefault(); ev.stopPropagation(); if(ev.stopImmediatePropagation) ev.stopImmediatePropagation();
        window.__gfVisibleAssumePublicNumber=pub||window.gfPublicTicketNumber(id)||id;
        Promise.resolve(window.setStatus(id,'IN_PROGRESS')).finally(function(){ setTimeout(function(){ window.__gfVisibleAssumePublicNumber=0; },500); });
        return false;
      }
    }
  },true);
  try{ new MutationObserver(function(){ syncAll(); }).observe(document.documentElement,{childList:true,subtree:true}); }catch(e){}
  setTimeout(syncAll,80); setTimeout(syncAll,600); setTimeout(syncAll,1600);
})();


/* GF_GROUP_NORMALIZE_20260620 */
(function(){
 if(window.__GF_GROUP_NORMALIZE_20260620) return;
 window.__GF_GROUP_NORMALIZE_20260620=true;
 window.gfNormalizeGroupKey=function(v){
   v=String(v||'').toUpperCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g,'')
    .replace(/[._\-]/g,' ')
    .replace(/\s+/g,' ')
    .trim();
   var base=v.split(' • ')[0].split(' | ')[0];
   if(base.includes('LIMBER')) return 'LIMBER';
   if(base.includes('MONITOR')) return 'MONITOR';
   return base;
 };
})();

/* GF_ISSUES_PROBLEM_FIRST_CLEAN_20260621
   Cadastro de problemas limpo: problema nasce como item principal; botão único Vincular abre
   equipamentos primeiro e serviços abaixo, na mesma lista. Sem accordion, sem seta, sem card dentro de card.
*/
(function(){
  'use strict';
  if(window.__GF_ISSUES_PROBLEM_FIRST_CLEAN_20260621__) return;
  window.__GF_ISSUES_PROBLEM_FIRST_CLEAN_20260621__ = true;

  var API_ROOT = (typeof API !== 'undefined' ? API : window.location.origin);
  function byId(id){ return document.getElementById(id); }
  function esc(v){ return String(v==null?'':v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]}); }
  function norm(v){ return String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().replace(/[^A-Z0-9]+/g,' ').trim(); }
  function key(v){ return norm(v).replace(/\s+/g,''); }
  async function json(url,opt){
    var r = await fetch(url,Object.assign({cache:'no-store',credentials:'include'},opt||{}));
    var j = await r.json().catch(function(){return {};});
    if(!r.ok && !j.error) j.error = 'Erro '+r.status;
    return j;
  }
  function currentIssues(){
    try{ if(Array.isArray(window.issues)) return window.issues; }catch(e){}
    try{ if(Array.isArray(issues)) return issues; }catch(e){}
    return [];
  }
  function isActive(i){ return Number(i && i.active == null ? 1 : i && i.active) !== 0; }
  function priorityOf(rows){
    if(rows.some(function(x){ return String(x.priority||'').toUpperCase()==='HIGH'; })) return 'HIGH';
    if(rows.some(function(x){ return String(x.priority||'').toUpperCase()==='LOW'; })) return 'LOW';
    return 'MEDIUM';
  }
  function priorityBadge(p){
    p=String(p||'MEDIUM').toUpperCase();
    var txt=p==='HIGH'?'Alta':(p==='LOW'?'Baixa':'Média');
    var cls=p==='HIGH'?'high':(p==='LOW'?'low':'medium');
    return '<span class="gfPriority '+cls+'">'+txt+'</span>';
  }
  function groupedProblems(){
    var mode = String(byId('issueFilterStatus') && byId('issueFilterStatus').value || 'ACTIVE').toUpperCase();
    if(['ACTIVE','INACTIVE','ALL'].indexOf(mode)<0) mode='ACTIVE';
    var q = norm(byId('issueFilterSearch') && byId('issueFilterSearch').value || '');
    var map = {};
    currentIssues().forEach(function(i){
      var name = String(i && i.name || '').trim();
      if(!name) return;
      var act = isActive(i);
      if(mode==='ACTIVE' && !act) return;
      if(mode==='INACTIVE' && act) return;
      var txt = norm([name,i.asset_name,i.priority].join(' '));
      if(q && txt.indexOf(q)<0) return;
      var k = key(name);
      if(!map[k]) map[k] = {name:name, key:k, rows:[]};
      map[k].rows.push(i);
    });
    return Object.keys(map).map(function(k){
      var g = map[k];
      g.rows.sort(function(a,b){ return Number(a.id||0)-Number(b.id||0); });
      g.id = g.rows[0] && g.rows[0].id;
      g.active = g.rows.some(isActive);
      g.priority = priorityOf(g.rows);
      var linked = {};
      g.rows.forEach(function(r){ var n=String(r.asset_name||'').trim(); if(n) linked[key(n)] = n; });
      g.linkCount = Object.keys(linked).length;
      return g;
    }).sort(function(a,b){ return a.name.localeCompare(b.name,'pt-BR'); });
  }
  function removeOldIssueScreenPieces(){
    ['issueFilterSector','issueFilterAsset','issueFilterKind','issueItemKind','issueAssetName','issuePriority'].forEach(function(id){
      var el=byId(id); if(el){ var wrap=el.closest && el.closest('label,.field,.formGroup'); (wrap||el).remove(); }
    });
    var form=document.querySelector('.cadProForm.issueForm');
    if(form){
      Array.prototype.slice.call(form.children).forEach(function(ch){
        if(ch.querySelector && (ch.querySelector('#issueName') || ch.id==='issueName')) return;
        if(ch.tagName==='BUTTON' || (ch.querySelector && ch.querySelector('button'))) return;
        ch.remove();
      });
    }
    var top=document.querySelector('.issueQuickFilters');
    if(top){
      Array.prototype.slice.call(top.querySelectorAll('select')).forEach(function(s){ if(s.id!=='issueFilterStatus') s.remove(); });
    }
    var grouped=document.querySelectorAll('#issuesBody details.cadBlockGroup,#issuesBody .cadBlockList,#issuesBody .gfIssueProblemBlock');
    grouped.forEach(function(n){ n.remove(); });
  }
  function ensureCleanIssueCss(){
    if(byId('gfIssueProblemFirstCss')) return;
    var st=document.createElement('style'); st.id='gfIssueProblemFirstCss';
    st.textContent = [
      '.gfIssueToolbar{display:flex;align-items:center;justify-content:space-between;gap:14px;margin:0 0 16px;padding:16px 18px;border:1px solid #d9e8fb;border-radius:18px;background:#f8fbff;box-shadow:0 8px 24px rgba(15,70,120,.06)}',
      '.gfIssueToolbar b{display:block;color:#071746;font-size:18px}.gfIssueToolbar small{display:block;color:#617089;margin-top:3px}',
      '.gfIssueProblemList{display:grid;grid-template-columns:repeat(auto-fill,minmax(360px,1fr));gap:14px}',
      '.gfIssueProblemCard{display:flex;align-items:center;gap:14px;padding:16px;border:1px solid #d9e8fb;border-radius:20px;background:#fff;box-shadow:0 10px 26px rgba(12,55,100,.07)}',
      '.gfIssueProblemCard.gfInactiveCard{opacity:.72;background:#f8fafc}',
      '.gfIssueProblemIcon{width:48px;height:48px;border-radius:16px;display:grid;place-items:center;background:#eafaf1;border:1px solid #bfead0;font-size:25px;flex:0 0 auto}',
      '.gfIssueProblemMain{min-width:0;flex:1}.gfIssueProblemMain h3{margin:0;color:#071746;font-size:20px;line-height:1.15;letter-spacing:.3px}.gfIssueProblemMain small{display:block;color:#5f6d86;font-weight:800;margin-top:5px}',
      '.gfIssueProblemMeta{display:flex;gap:8px;flex-wrap:wrap;margin-top:9px}.gfIssueProblemMeta span{border:1px solid #dbe9fb;border-radius:999px;padding:5px 9px;font-weight:900;font-size:12px;background:#f8fbff;color:#30425f}',
      '.gfIssueProblemActions{display:flex;gap:8px;align-items:center;justify-content:flex-end;flex-wrap:wrap}.gfIssueProblemActions .btn{white-space:nowrap}',
      '.gfIssueCreateGrid{display:grid;grid-template-columns:1fr .45fr .35fr;gap:14px}.gfIssueCreateGrid label{font-weight:900;color:#071746}.gfIssueCreateGrid input,.gfIssueCreateGrid select{width:100%;margin-top:7px}',
      '.gfIssueItemChecks .gfCheckGroupTitle{font-size:13px;font-weight:1000;color:#071746;margin:18px 0 8px;text-transform:uppercase;letter-spacing:.6px}.gfIssueItemChecks .gfCheckGroupTitle:first-child{margin-top:0}',
      '@media(max-width:760px){.gfIssueToolbar{align-items:stretch;flex-direction:column}.gfIssueProblemList{grid-template-columns:1fr}.gfIssueProblemCard{align-items:flex-start;flex-direction:column}.gfIssueProblemActions{width:100%;justify-content:stretch}.gfIssueProblemActions .btn{flex:1}.gfIssueCreateGrid{grid-template-columns:1fr}}'
    ].join('\n');
    document.head.appendChild(st);
  }
  function ensureToolbar(){
    var body=byId('issuesBody'); if(!body) return;
    var old=byId('gfIssueToolbar');
    if(!old){ old=document.createElement('div'); old.id='gfIssueToolbar'; old.className='gfIssueToolbar adminOnly'; body.parentNode.insertBefore(old,body); }
    old.innerHTML='<div><b>Problemas cadastrados</b><small>Crie o problema uma vez. Depois use Vincular para marcar equipamentos primeiro e serviços abaixo.</small></div><button class="btn btnDark" type="button" onclick="openIssueModal()">+ Novo problema</button>';
  }
  window.renderIssues = function(){
    ensureCleanIssueCss();
    removeOldIssueScreenPieces();
    ensureToolbar();
    var list = groupedProblems();
    var info=byId('issueFilterInfo'); if(info) info.innerText='Mostrando '+list.length+' problema(s) cadastrado(s)';
    var body=byId('issuesBody'); if(!body) return;
    if(!list.length){ body.innerHTML='<div class="cadQuickEmpty gfBlockEmpty">Nenhum problema encontrado.</div>'; return; }
    body.innerHTML='<div class="gfIssueProblemList">'+list.map(function(g){
      return '<div class="gfIssueProblemCard '+(!g.active?'gfInactiveCard':'')+'" data-problem="'+esc(g.name)+'">'+
        '<div class="gfIssueProblemIcon">⚠️</div>'+
        '<div class="gfIssueProblemMain"><h3>'+esc(g.name)+'</h3><small>'+(g.linkCount||0)+' vínculo'+((g.linkCount||0)===1?'':'s')+'</small><div class="gfIssueProblemMeta">'+priorityBadge(g.priority)+'<span>'+(g.active?'Ativo':'Inativo')+'</span></div></div>'+
        '<div class="gfIssueProblemActions">'+
          '<button class="btn btnDark adminOnly" onclick="openIssueSectorDrawer('+esc(g.id)+')">Vincular</button>'+
          '<button class="btn '+(g.active?'btnRed':'btnLight')+' adminOnly" onclick="gfToggleProblemGroup(\''+encodeURIComponent(g.name)+'\','+(g.active?'false':'true')+')">'+(g.active?'Inativar':'Ativar')+'</button>'+
        '</div></div>';
    }).join('')+'</div>';
  };
  try{ renderIssues = window.renderIssues; }catch(e){}

  window.gfToggleProblemGroup = async function(encodedName, active){
    if(typeof guardAction==='function' && !guardAction('admin')) return;
    var name=''; try{name=decodeURIComponent(String(encodedName||''));}catch(e){name=String(encodedName||'')}
    var rows=currentIssues().filter(function(i){ return key(i && i.name)===key(name); });
    if(!rows.length) return alert('Problema não encontrado.');
    var ok = active ? true : confirm('Inativar o problema "'+name+'"? Ele deixará de aparecer para abertura de chamados.');
    if(!ok) return;
    var btn=document.activeElement && document.activeElement.tagName==='BUTTON' ? document.activeElement : null, old=btn?btn.textContent:'';
    try{
      if(btn){ btn.disabled=true; btn.textContent=active?'Ativando...':'Inativando...'; }
      for(var i=0;i<rows.length;i++){
        var r=rows[i];
        await json(API_ROOT+'/api/admin/issues/'+encodeURIComponent(r.id),{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({asset_name:r.asset_name||'',name:r.name||name,priority:r.priority||'MEDIUM',active:!!active})});
      }
      try{ if(typeof gfInvalidateIssuesCacheV30==='function') gfInvalidateIssuesCacheV30(); }catch(e){}
      if(typeof loadIssues==='function') await loadIssues(true); else window.renderIssues();
      try{ if(typeof toastMsg==='function') toastMsg(active?'Problema ativado':'Problema inativado'); }catch(e){}
    }finally{ if(btn){btn.disabled=false;btn.textContent=old||active?'Ativar':'Inativar';} }
  };

  function ensureCreateModal(){
    var old=byId('gfIssueModal'); if(old) old.remove();
    var bd=byId('gfIssueBackdrop'); if(bd) bd.remove();
    document.body.insertAdjacentHTML('beforeend','<div id="gfIssueBackdrop" class="assetEditBackdrop gfIssueBackdropSafe"></div><div id="gfIssueModal" class="gfIssueModal gfIssueModalSafe" role="dialog" aria-modal="true"><div class="assetEditHead"><div><h2>Novo problema</h2><small>Cadastre o problema. Depois clique em Vincular para escolher equipamentos e serviços.</small></div><button class="assetEditClose" type="button" data-gf-close-issue>×</button></div><div class="assetEditBody"><div class="gfIssueCreateGrid"><label>Nome do problema<input id="gfIssueName" autocomplete="off" placeholder="Ex: SEM INTERNET"></label><label>Prioridade<select id="gfIssuePriority"><option value="HIGH">Alta</option><option value="MEDIUM" selected>Média</option><option value="LOW">Baixa</option></select></label><label>Status<select id="gfIssueActive"><option value="1" selected>Ativo</option><option value="0">Inativo</option></select></label></div></div><div class="assetEditFoot"><button class="btn btnLight" type="button" data-gf-close-issue>Cancelar</button><button class="btn btnDark" type="button" data-gf-save-issue>Cadastrar problema</button></div></div>');
    byId('gfIssueBackdrop').addEventListener('click',window.closeIssueModal);
    document.querySelectorAll('[data-gf-close-issue]').forEach(function(b){b.addEventListener('click',window.closeIssueModal)});
    document.querySelector('[data-gf-save-issue]').addEventListener('click',window.saveIssueModal);
  }
  async function firstActiveItemName(){
    try{
      if(!Array.isArray(window.assets)||!window.assets.length){ var aj=await json(API_ROOT+'/api/admin/assets'); window.assets=Array.isArray(aj.assets)?aj.assets:[]; }
      var eq=(window.assets||[]).find(function(a){return String(a.asset_kind||a.kind||'').toUpperCase()!=='SERVICE' && String(a.status||'ACTIVE').toUpperCase()==='ACTIVE'});
      if(eq && eq.name) return eq.name;
    }catch(e){}
    try{
      var sj=await json(API_ROOT+'/api/admin/service-groups');
      var sv=(Array.isArray(sj.services)?sj.services:[]).find(function(s){return Number(s.active==null?1:s.active)!==0});
      if(sv && sv.name) return sv.name;
    }catch(e){}
    return '';
  }
  window.openIssueModal = function(){
    if(typeof guardAction==='function' && !guardAction('admin')) return;
    ensureCleanIssueCss(); ensureCreateModal();
    byId('gfIssueName').value=''; byId('gfIssuePriority').value='MEDIUM'; byId('gfIssueActive').value='1';
    byId('gfIssueBackdrop').classList.add('show'); byId('gfIssueModal').classList.add('show');
    setTimeout(function(){ try{byId('gfIssueName').focus({preventScroll:true})}catch(e){} },80);
  };
  window.closeIssueModal=function(){ byId('gfIssueBackdrop')?.classList.remove('show'); byId('gfIssueModal')?.classList.remove('show'); };
  window.saveIssueModal=async function(){
    if(typeof guardAction==='function' && !guardAction('admin')) return;
    var name=String(byId('gfIssueName')&&byId('gfIssueName').value||'').trim();
    var priority=String(byId('gfIssuePriority')&&byId('gfIssuePriority').value||'MEDIUM').toUpperCase();
    var active=String(byId('gfIssueActive')&&byId('gfIssueActive').value||'1')==='1';
    if(!name){ alert('Informe o nome do problema.'); byId('gfIssueName')&&byId('gfIssueName').focus(); return; }
    var exists=currentIssues().some(function(i){return key(i&&i.name)===key(name)});
    if(exists) return alert('Esse problema já existe. Use o botão Vincular nele.');
    var btn=document.querySelector('[data-gf-save-issue]'), old=btn?btn.textContent:'';
    try{
      if(btn){btn.disabled=true;btn.textContent='Salvando...';}
      var body={name:name,priority:priority,active:active,asset_name:'',item_type:'PROBLEM'};
      var j=await json(API_ROOT+'/api/admin/issues',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
      if(!j.ok){
        var first=await firstActiveItemName();
        if(!first) return alert(j.error||'Erro ao cadastrar problema. Cadastre pelo menos um equipamento ou serviço antes.');
        body.asset_name=first; body.item_type='EQUIPMENT';
        j=await json(API_ROOT+'/api/admin/issues',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
        if(!j.ok) return alert(j.error||'Erro ao cadastrar problema');
      }
      window.closeIssueModal();
      try{ if(typeof gfInvalidateIssuesCacheV30==='function') gfInvalidateIssuesCacheV30(); }catch(e){}
      if(typeof loadIssues==='function') await loadIssues(true); else window.renderIssues();
      try{ if(typeof toastMsg==='function') toastMsg('Problema cadastrado. Agora use Vincular.'); }catch(e){}
    }finally{ if(btn){btn.disabled=false;btn.textContent=old||'Cadastrar problema';} }
  };

  var oldOpenLinks = window.openIssueSectorDrawer;
  window.openIssueSectorDrawer = async function(id){
    if(typeof oldOpenLinks === 'function'){
      await oldOpenLinks(id);
      var issue=currentIssues().find(function(x){return Number(x.id)===Number(id)})||{};
      var title=byId('gfIssueSectorTitle'), sub=byId('gfIssueSectorSub');
      if(title) title.textContent='Vincular: '+(issue.name||'Problema');
      if(sub) sub.textContent='Equipamentos aparecem primeiro. Serviços ficam abaixo, na mesma lista.';
      return;
    }
    alert('Editor de vínculos não encontrado. Atualize a página.');
  };

  document.addEventListener('DOMContentLoaded',function(){ setTimeout(function(){ if(byId('issuesBody')) window.renderIssues(); },300); });
})();


/* ======================================================================
   PATCH FINAL SERVIÇOS LIMPO - remove render antigo e impede "Carregando..."
   Regra: Serviços = buscar + cards simples + Vincular/Editar/Inativar.
   ====================================================================== */
(function(){
  'use strict';
  if(window.__gfServicosLimpoFinalV40) return;
  window.__gfServicosLimpoFinalV40 = true;

  var API_ROOT = (window.API || window.API_BASE || window.location.origin || '').replace(/\/$/, '');
  var cache = [];
  var oldOpenCadastroModule = window.openCadastroModule;
  var oldToggleCadastroForm = window.toggleCadastroForm;

  function byId(id){ return document.getElementById(id); }
  function page(){ return byId('pageCadastros'); }
  function isSvc(){ var p=page(); return !!(p && p.classList.contains('cadastro-show-servicos')); }
  function esc(v){ return String(v==null?'':v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];}); }
  function norm(v){ return String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim(); }
  function active(g){ return Number(g && g.active == null ? 1 : g.active) === 1 && !/INACTIVE|DISABLED/.test(String((g&&g.status)||'ACTIVE').toUpperCase()); }
  function dept(g){ return String((g && (g.asset_department || g.department)) || 'TI').toUpperCase().replace('MANUTENCAO','MANUTENÇÃO'); }
  function key(g){ return encodeURIComponent(String((g && (g.service_key || g.name || g.legacy_asset_name)) || '')); }

  function fetchJson(url,opt){
    return fetch(url, Object.assign({cache:'no-store'}, opt||{})).then(function(r){
      return r.json().catch(function(){ return {}; });
    });
  }

  function forceServiceKind(){
    var kind = byId('assetFilterKind');
    if(kind){ kind.innerHTML='<option value="SERVICE">Somente serviços</option>'; kind.value='SERVICE'; }
    var formKind = byId('assetKindSelect');
    if(formKind){ formKind.innerHTML='<option value="SERVICE">🧩 Serviço / categoria</option>'; formKind.value='SERVICE'; formKind.hidden=true; formKind.tabIndex=-1; }
  }

  function cleanChrome(){
    var p=page(); if(!p) return;
    p.classList.remove('cadastro-menu-open','cadastro-show-equipamentos','cadastro-show-problemas');
    p.classList.add('cadastro-module-open','cadastro-show-servicos');
    forceServiceKind();

    var panel = p.querySelector('[data-cadastro-module="equipamentos"]') || p.querySelector('.cadProAssetPanel') || p;
    ['.cadastroModuleStats','#assetQuickFilterBox','.cadAssetTitleActions','.cadProMicro','.cadAssetFormTitle'].forEach(function(sel){
      panel.querySelectorAll(sel).forEach(function(el){ if(el && el.parentNode) el.parentNode.removeChild(el); });
    });

    var moduleTitle = byId('cadAssetModuleTitle'); if(moduleTitle) moduleTitle.textContent='Serviços';
    var moduleSub = byId('cadAssetModuleSub'); if(moduleSub) moduleSub.textContent='Crie o serviço, vincule setores ou inative.';
    var badge = byId('cadAssetModuleBadge'); if(badge) badge.remove();
    var headBtn = panel.querySelector('.cadAssetHeadNewBtn'); if(headBtn) headBtn.remove();

    var heroTitle = byId('cadAssetHeroTitle'); if(heroTitle) heroTitle.textContent='Serviços';
    var heroSub = byId('cadAssetHeroSub'); if(heroSub) heroSub.textContent='Crie o serviço, vincule setores ou inative.';
    var heroIcon = byId('cadAssetHeroIcon'); if(heroIcon) heroIcon.textContent='🧩';
    var actions = panel.querySelector('.cadastroModuleHeroActions');
    if(actions) actions.innerHTML='<button class="btn btnDark" type="button" onclick="gfOpenNovoServico()">+ Novo serviço</button>';

    var body = byId('assetsBody');
    var cadBody = body && body.parentElement ? body.parentElement : (panel.querySelector('.cadProBody') || panel);
    var wrap = byId('gfServiceSimpleSearch');
    if(!wrap){
      wrap = document.createElement('div');
      wrap.id='gfServiceSimpleSearch';
      wrap.className='gfServiceSimpleSearch';
      if(body && body.parentNode) body.parentNode.insertBefore(wrap, body);
      else cadBody.appendChild(wrap);
    }
    var oldVal = (byId('assetSearch') && byId('assetSearch').value) || '';
    // remove outros assetSearch duplicados fora do wrap
    document.querySelectorAll('#assetSearch').forEach(function(input){
      if(!wrap.contains(input)) input.remove();
    });
    wrap.innerHTML='<input id="assetSearch" placeholder="Buscar serviço" autocomplete="off">';
    var inp=wrap.querySelector('#assetSearch');
    if(inp){ inp.value=oldVal; inp.oninput=function(){ renderClean(cache); }; }

    if(!body){
      body=document.createElement('div'); body.id='assetsBody'; cadBody.appendChild(body);
    }
  }

  function card(g){
    var isOn=active(g), k=key(g), name=esc(g && g.name || '-');
    return '<div class="gfCleanCard gfServiceOnlyCard '+(!isOn?'gfInactiveCard':'')+'" data-service-key="'+k+'" data-service-name="'+encodeURIComponent(g && g.name || '')+'">'
      + '<div class="gfCardAccent"></div>'
      + '<div class="gfCardIcon">🧩</div>'
      + '<div class="gfCardMain"><div class="gfCardTop"><h3>'+name+'</h3></div><div class="gfCardMeta"><span>'+esc(dept(g))+' • '+(isOn?'Ativo':'Inativo')+'</span></div></div>'
      + '<div class="gfCardActions">'
      + '<button class="btn btnDark" type="button" onclick="openServiceSectorDrawer(\''+k+'\')">Vincular</button>'
      + '<button class="btn btnLight adminOnly" type="button" onclick="gfEditServiceName(\''+k+'\',\''+encodeURIComponent(g && g.name || '')+'\')">Editar</button>'
      + '<button class="btn '+(isOn?'btnRed':'btnLight')+' adminOnly" type="button" onclick="gfToggleServiceActive(\''+k+'\','+(isOn?0:1)+')">'+(isOn?'Inativar':'Ativar')+'</button>'
      + '</div></div>';
  }

  function renderClean(list){
    cleanChrome();
    list = Array.isArray(list) ? list : cache;
    cache = list.slice();
    window.serviceGroupsCache = cache.slice();
    window.gfIssueServiceGroups = cache.slice();
    var q = norm(byId('assetSearch') && byId('assetSearch').value || '');
    var rows = cache.filter(function(g){
      if(q && norm([g.name,g.service_key,g.asset_department,g.department,(g.sectors||[]).map(function(s){return s.name;}).join(' ')].join(' ')).indexOf(q)<0) return false;
      return true;
    }).sort(function(a,b){ return String(a.name||'').localeCompare(String(b.name||''),'pt-BR'); });
    var body = byId('assetsBody');
    if(!body) return;
    body.innerHTML = rows.length ? '<div class="gfServiceListClean">'+rows.map(card).join('')+'</div>' : '<div class="cadQuickEmpty gfBlockEmpty">Nenhum serviço encontrado.</div>';
    if(body.dataset) body.dataset.gfHasStableContent='1';
  }

  async function loadClean(){
    if(!isSvc()) return;
    cleanChrome();
    var body=byId('assetsBody');
    if(body && !body.dataset.gfHasStableContent) body.innerHTML='<div class="cadQuickEmpty gfBlockEmpty">Carregando...</div>';
    try{
      var j = await fetchJson(API_ROOT + '/api/admin/service-groups');
      var list = Array.isArray(j.services) ? j.services : [];
      renderClean(list);
    }catch(e){
      renderClean(Array.isArray(window.serviceGroupsCache)?window.serviceGroupsCache:cache);
    }
  }

  window.gfOpenNovoServico = function(){
    cleanChrome();
    forceServiceKind();
    if(typeof oldToggleCadastroForm === 'function') oldToggleCadastroForm('asset');
    else if(typeof window.toggleCadastroForm === 'function') window.toggleCadastroForm('asset');
    setTimeout(forceServiceKind, 50);
  };

  window.openCadastroModule = function(m){
    if(m === 'servicos'){
      if(typeof oldOpenCadastroModule === 'function'){
        try{ oldOpenCadastroModule(m); }catch(e){}
      }
      cleanChrome();
      loadClean();
      return;
    }
    return typeof oldOpenCadastroModule === 'function' ? oldOpenCadastroModule(m) : undefined;
  };

  window.renderServices = renderClean;
  var oldRenderAssets = window.renderAssets;
  window.renderAssets = function(){ if(isSvc()) return renderClean(cache.length?cache:(Array.isArray(window.serviceGroupsCache)?window.serviceGroupsCache:[])); return typeof oldRenderAssets==='function'?oldRenderAssets():undefined; };
  var oldLoadAssets = window.loadAssets;
  window.loadAssets = function(){ if(isSvc()) return loadClean(); return typeof oldLoadAssets==='function'?oldLoadAssets.apply(this,arguments):undefined; };

  document.addEventListener('click', function(e){
    var t=e.target && e.target.closest && e.target.closest('button,a');
    if(!t) return;
    var txt=(t.textContent||'').trim().toLowerCase();
    if(txt==='serviços' || txt.indexOf('serviços')>=0 && t.closest('#pageCadastros,.sidebar,.mobileNav,.gfSideNav')){
      setTimeout(function(){ if(isSvc()) loadClean(); },80);
    }
  }, true);

  var tries=0;
  var timer=setInterval(function(){
    tries++;
    if(isSvc()){
      var body=byId('assetsBody');
      cleanChrome();
      if(body && /Carregando/i.test(body.textContent||'')) loadClean();
    }
    if(tries>20) clearInterval(timer);
  },300);

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', function(){ if(isSvc()) loadClean(); });
  else setTimeout(function(){ if(isSvc()) loadClean(); },50);
})();


/* ======================================================================
   PATCH DEFINITIVO SERVIÇOS - 22/06
   - remove título duplicado da tela de serviços
   - mantém uma renderização oficial
   - liga eventos por delegation, sem depender de onclick antigo
   - abre cadastro usando o formulário existente cadAssetMainForm
   ====================================================================== */
(function(){
  'use strict';
  if(window.__GF_SERVICOS_EVENTOS_DEFINITIVO_2206__) return;
  window.__GF_SERVICOS_EVENTOS_DEFINITIVO_2206__ = true;

  var API_ROOT = (window.API || window.API_BASE || window.location.origin || '').replace(/\/$/, '');
  var serviceCache = [];
  var oldCloseCadastroForm = window.closeCadastroForm;
  var modalHomes = {title:null, form:null};

  function byId(id){ return document.getElementById(id); }
  function page(){ return byId('pageCadastros'); }
  function isServicos(){ var p=page(); return !!(p && p.classList.contains('cadastro-show-servicos')); }
  function esc(v){ return String(v==null?'':v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];}); }
  function norm(v){ return String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().trim(); }
  function serviceKey(g){ return String(g && (g.service_key || g.name || g.legacy_asset_name) || ''); }
  function active(g){ return Number(g && g.active == null ? 1 : g.active) === 1 && !/INACTIVE|DISABLED/.test(String((g&&g.status)||'ACTIVE').toUpperCase()); }
  function dept(g){ return String((g && (g.asset_department || g.department)) || 'TI').toUpperCase().replace('MANUTENCAO','MANUTENÇÃO'); }
  function jfetch(url,opt){
    return fetch(url, Object.assign({cache:'no-store', credentials:'include'}, opt||{})).then(function(r){
      return r.json().catch(function(){ return {ok:false,error:'Resposta inválida'}; });
    });
  }

  function rememberHome(node, key){
    if(node && !modalHomes[key]) modalHomes[key] = {parent:node.parentNode, next:node.nextSibling};
  }
  function putBack(node, home){
    if(!node || !home || !home.parent) return;
    try{ home.parent.insertBefore(node, home.next && home.next.parentNode===home.parent ? home.next : null); }
    catch(e){ try{ home.parent.appendChild(node); }catch(_e){} }
  }
  function ensureModalRoot(){
    var root=byId('gfCadastroModalRoot');
    if(!root){
      root=document.createElement('div');
      root.id='gfCadastroModalRoot';
      root.innerHTML='<div id="gfCadastroModalBox" role="dialog" aria-modal="true"></div>';
      document.body.appendChild(root);
      root.addEventListener('mousedown',function(e){ if(e.target===root) window.closeCadastroForm(); });
    }
    if(!byId('gfCadastroModalBox')) root.innerHTML='<div id="gfCadastroModalBox" role="dialog" aria-modal="true"></div>';
    return root;
  }
  function lockAsService(){
    var p=page(); if(p){ p.classList.add('cadastro-module-open','cadastro-show-servicos'); p.classList.remove('cadastro-show-equipamentos','cadastro-show-problemas'); }
    var kind=byId('assetKindSelect');
    if(kind){ kind.innerHTML='<option value="SERVICE">🧩 Serviço / categoria</option>'; kind.value='SERVICE'; kind.hidden=true; kind.tabIndex=-1; kind.setAttribute('data-locked-kind','SERVICE'); }
    var filterKind=byId('assetFilterKind');
    if(filterKind){ filterKind.innerHTML='<option value="SERVICE">Somente serviços</option>'; filterKind.value='SERVICE'; }
    var apoio=byId('assetDeptApoio'), ti=byId('assetDeptTI');
    if(apoio && !apoio.checked && ti && ti.checked===false) apoio.checked=true;
  }

  function cleanServiceChrome(){
    if(!isServicos()) return;
    var p=page(); if(!p) return;
    lockAsService();

    // remove o cabeçalho antigo de Equipamentos/Serviços que duplicava "Serviços"
    p.querySelectorAll('.cadProHead.asset').forEach(function(el){ el.remove(); });
    p.querySelectorAll('.cadastroModuleStats,#assetQuickFilterBox,.cadAssetTitleActions,.cadProMicro,.cadAssetFormTitle').forEach(function(el){
      // não remove título do formulário quando ele estiver dentro do modal
      if(el.classList && el.classList.contains('cadAssetFormTitle')) return;
      el.remove();
    });

    var moduleTitle=byId('cadAssetModuleTitle'); if(moduleTitle) moduleTitle.textContent='Serviços';
    var moduleSub=byId('cadAssetModuleSub'); if(moduleSub) moduleSub.textContent='Crie o serviço, vincule setores ou inative.';
    var heroTitle=byId('cadAssetHeroTitle'); if(heroTitle) heroTitle.textContent='Serviços';
    var heroSub=byId('cadAssetHeroSub'); if(heroSub) heroSub.textContent='Crie o serviço, vincule setores ou inative.';
    var heroIcon=byId('cadAssetHeroIcon'); if(heroIcon) heroIcon.textContent='🧩';
    var badge=byId('cadAssetModuleBadge'); if(badge) badge.remove();

    var panel=p.querySelector('[data-cadastro-module="equipamentos"]') || p.querySelector('.cadProAssetPanel') || p;
    var actions=panel.querySelector('.cadastroModuleHeroActions');
    if(actions){ actions.innerHTML='<button class="btn btnDark" type="button" data-gf-service-action="new">+ Novo serviço</button>'; }

    var body=byId('assetsBody');
    if(!body){ body=document.createElement('div'); body.id='assetsBody'; panel.appendChild(body); }
    var wrap=byId('gfServiceSimpleSearch');
    if(!wrap){
      wrap=document.createElement('div'); wrap.id='gfServiceSimpleSearch'; wrap.className='gfServiceSimpleSearch';
      body.parentNode.insertBefore(wrap, body);
    }
    var current=(byId('assetSearch') && byId('assetSearch').value) || '';
    document.querySelectorAll('#assetSearch').forEach(function(i){ if(!wrap.contains(i)) i.remove(); });
    if(!wrap.querySelector('#assetSearch')) wrap.innerHTML='<input id="assetSearch" placeholder="Buscar serviço" autocomplete="off">';
    var input=wrap.querySelector('#assetSearch');
    if(input){ input.value=current; input.oninput=function(){ renderServicesClean(serviceCache); }; }
  }

  function card(g){
    var on=active(g), k=esc(serviceKey(g)), d=esc(dept(g)), n=esc(g && g.name || '-');
    return '<div class="gfCleanCard gfServiceOnlyCard '+(!on?'gfInactiveCard':'')+'" data-service-key="'+k+'">'
      + '<div class="gfCardAccent"></div><div class="gfCardIcon">🧩</div>'
      + '<div class="gfCardMain"><div class="gfCardTop"><h3>'+n+'</h3></div><div class="gfCardMeta"><span>'+d+' • '+(on?'Ativo':'Inativo')+'</span></div></div>'
      + '<div class="gfCardActions">'
      + '<button class="btn btnDark" type="button" data-gf-service-action="link" data-service-key="'+k+'">Vincular</button>'
      + '<button class="btn btnLight adminOnly" type="button" data-gf-service-action="edit" data-service-key="'+k+'" data-service-name="'+esc(g && g.name || '')+'">Editar</button>'
      + '<button class="btn '+(on?'btnRed':'btnLight')+' adminOnly" type="button" data-gf-service-action="toggle" data-service-key="'+k+'" data-active="'+(on?'0':'1')+'">'+(on?'Inativar':'Ativar')+'</button>'
      + '</div></div>';
  }

  function renderServicesClean(list){
    cleanServiceChrome();
    list=Array.isArray(list)?list:serviceCache;
    serviceCache=list.slice();
    window.serviceGroupsCache=serviceCache.slice();
    window.gfIssueServiceGroups=serviceCache.slice();
    var q=String((byId('assetSearch')&&byId('assetSearch').value)||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
    var rows=serviceCache.filter(function(g){
      if(!q) return true;
      return String([g.name,g.service_key,g.asset_department,g.department].join(' ')).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().indexOf(q)>=0;
    }).sort(function(a,b){ return String(a.name||'').localeCompare(String(b.name||''),'pt-BR'); });
    var body=byId('assetsBody'); if(!body) return;
    body.innerHTML=rows.length?'<div class="gfServiceListClean">'+rows.map(card).join('')+'</div>':'<div class="cadQuickEmpty gfBlockEmpty">Nenhum serviço encontrado.</div>';
    if(body.dataset) body.dataset.gfHasStableContent='1';
  }

  async function loadServicesClean(){
    if(!isServicos()) return;
    cleanServiceChrome();
    var body=byId('assetsBody'); if(body && !body.dataset.gfHasStableContent) body.innerHTML='<div class="cadQuickEmpty gfBlockEmpty">Carregando...</div>';
    try{
      var j=await jfetch(API_ROOT+'/api/admin/service-groups');
      renderServicesClean(Array.isArray(j.services)?j.services:[]);
    }catch(e){ renderServicesClean(Array.isArray(window.serviceGroupsCache)?window.serviceGroupsCache:serviceCache); }
  }

  window.gfOpenNovoServico=function(){
    lockAsService();
    var title=document.querySelector('.cadAssetFormTitle') || document.querySelector('#pageCadastros .cadAssetFormTitle');
    var form=byId('cadAssetMainForm');
    if(!form){ alert('Formulário de cadastro não encontrado. Atualize a página.'); return; }
    rememberHome(title,'title'); rememberHome(form,'form');
    var root=ensureModalRoot(), box=byId('gfCadastroModalBox');
    if(title){
      title.innerHTML='<span class="cadFormTitleText">Novo serviço</span><button class="btn btnLight cadFormCloseBtn" type="button" onclick="closeCadastroForm()">Fechar</button>';
      box.appendChild(title);
    }
    lockAsService();
    try{ if(byId('assetName')){ byId('assetName').value=''; byId('assetName').placeholder='Nome do serviço'; } }catch(e){}
    box.appendChild(form);
    root.className='show gf-service-modal';
    document.body.classList.add('gfCadastroModalOpen');
    var p=page(); if(p) p.classList.add('cadastro-asset-form-open');
    setTimeout(function(){ try{ (byId('assetName')||form.querySelector('input,select,textarea')).focus({preventScroll:true}); }catch(e){} },60);
  };

  window.closeCadastroForm=function(){
    var root=byId('gfCadastroModalRoot'), box=byId('gfCadastroModalBox');
    var form=byId('cadAssetMainForm'), title=document.querySelector('.cadAssetFormTitle');
    if(root && root.classList.contains('show')){
      putBack(title, modalHomes.title); putBack(form, modalHomes.form);
      if(box) box.innerHTML='';
      root.className=''; document.body.classList.remove('gfCadastroModalOpen');
      var p=page(); if(p) p.classList.remove('cadastro-asset-form-open');
      return;
    }
    if(typeof oldCloseCadastroForm==='function') return oldCloseCadastroForm.apply(this,arguments);
  };

  window.gfEditServiceName=function(rawKey,currentName){
    var key=''; try{ key=decodeURIComponent(String(rawKey||'')); }catch(e){ key=String(rawKey||''); }
    var name=currentName||'';
    if(!name){ var found=serviceCache.find(function(g){return norm(serviceKey(g))===norm(key)}); name=found&&found.name||key; }
    var novo=prompt('Novo nome do serviço:', String(name||''));
    if(novo===null) return;
    novo=String(novo||'').trim();
    if(!novo) return alert('Informe o nome do serviço.');
    jfetch(API_ROOT+'/api/admin/service-groups/'+encodeURIComponent(key)+'/name',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:novo})}).then(function(j){
      if(!j || j.ok===false) return alert((j&&j.error)||'Erro ao editar serviço');
      if(typeof toastMsg==='function') toastMsg('Serviço atualizado');
      loadServicesClean();
    }).catch(function(){ alert('Erro ao editar serviço'); });
  };

  window.gfToggleServiceActive=function(rawKey,active){
    var key=''; try{ key=decodeURIComponent(String(rawKey||'')); }catch(e){ key=String(rawKey||''); }
    var act=!!Number(active);
    if(!act && !confirm('Inativar este serviço?')) return;
    jfetch(API_ROOT+'/api/admin/service-groups/'+encodeURIComponent(key)+'/active',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({active:act})}).then(function(j){
      if(!j || j.ok===false) return alert((j&&j.error)||'Erro ao alterar serviço');
      if(typeof toastMsg==='function') toastMsg(act?'Serviço ativado':'Serviço inativado');
      loadServicesClean();
    }).catch(function(){ alert('Erro ao alterar serviço'); });
  };

  window.openServiceSectorDrawer = window.openServiceSectorDrawer || function(){ alert('Drawer de vínculo não encontrado.'); };

  document.addEventListener('click',function(e){
    var btn=e.target && e.target.closest && e.target.closest('[data-gf-service-action]');
    if(!btn) return;
    var action=btn.getAttribute('data-gf-service-action');
    if(!action) return;
    e.preventDefault(); e.stopPropagation();
    var k=btn.getAttribute('data-service-key')||'';
    if(action==='new') return window.gfOpenNovoServico();
    if(action==='link') return window.openServiceSectorDrawer(k);
    if(action==='edit') return window.gfEditServiceName(k, btn.getAttribute('data-service-name')||'');
    if(action==='toggle') return window.gfToggleServiceActive(k, btn.getAttribute('data-active'));
  }, true);

  var oldOpenCadastroModule=window.openCadastroModule;
  window.openCadastroModule=function(m){
    if(m==='servicos'){
      if(typeof oldOpenCadastroModule==='function'){ try{ oldOpenCadastroModule(m); }catch(e){} }
      cleanServiceChrome(); loadServicesClean(); return;
    }
    return typeof oldOpenCadastroModule==='function'?oldOpenCadastroModule.apply(this,arguments):undefined;
  };
  window.renderServices=renderServicesClean;
  var oldRenderAssets=window.renderAssets;
  window.renderAssets=function(){ if(isServicos()) return renderServicesClean(serviceCache.length?serviceCache:(Array.isArray(window.serviceGroupsCache)?window.serviceGroupsCache:[])); return typeof oldRenderAssets==='function'?oldRenderAssets.apply(this,arguments):undefined; };
  var oldLoadAssets=window.loadAssets;
  window.loadAssets=function(){ if(isServicos()) return loadServicesClean(); return typeof oldLoadAssets==='function'?oldLoadAssets.apply(this,arguments):undefined; };

  var obsTimer=null;
  function stabilize(){ if(!isServicos()) return; clearTimeout(obsTimer); obsTimer=setTimeout(function(){ cleanServiceChrome(); },50); }
  try{ new MutationObserver(stabilize).observe(document.body,{childList:true,subtree:true}); }catch(e){}
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',function(){ if(isServicos()) loadServicesClean(); });
  else setTimeout(function(){ if(isServicos()) loadServicesClean(); },80);
})();



/* ======================================================================
   PATCH FINAL REAL - SERVIÇOS BOTÕES FUNCIONANDO
   Liga o botão atual por onclick direto + captura global.
   Também cria fallback de cadastro se o formulário antigo não abrir.
   ====================================================================== */
(function(){
  'use strict';
  if(window.__GF_SERVICOS_BOTOES_REAL_FINAL__) return;
  window.__GF_SERVICOS_BOTOES_REAL_FINAL__ = true;

  var API_ROOT = (window.API || window.API_BASE || window.location.origin || '').replace(/\/$/, '');

  function byId(id){ return document.getElementById(id); }
  function page(){ return byId('pageCadastros'); }
  function isServicos(){
    var p = page();
    return !!(p && p.classList && p.classList.contains('cadastro-show-servicos'));
  }
  function esc(v){
    return String(v==null?'':v).replace(/[&<>"']/g,function(c){
      return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];
    });
  }
  function forceServiceKind(){
    var p=page();
    if(p){
      p.classList.add('cadastro-module-open','cadastro-show-servicos');
      p.classList.remove('cadastro-show-equipamentos','cadastro-show-problemas');
    }
    var kind=byId('assetKindSelect');
    if(kind){
      kind.innerHTML='<option value="SERVICE">🧩 Serviço / categoria</option>';
      kind.value='SERVICE';
      kind.hidden=true;
      kind.tabIndex=-1;
      kind.setAttribute('data-locked-kind','SERVICE');
    }
    var filterKind=byId('assetFilterKind');
    if(filterKind){
      filterKind.innerHTML='<option value="SERVICE">Somente serviços</option>';
      filterKind.value='SERVICE';
    }
    var apoio=byId('assetDeptApoio');
    var ti=byId('assetDeptTI');
    if(apoio && ti && !apoio.checked && !ti.checked) apoio.checked=true;
  }

  function ensureRoot(){
    var root=byId('gfCadastroModalRoot');
    if(!root){
      root=document.createElement('div');
      root.id='gfCadastroModalRoot';
      document.body.appendChild(root);
      root.addEventListener('mousedown',function(e){
        if(e.target===root && typeof window.closeCadastroForm==='function') window.closeCadastroForm();
      });
    }
    var box=byId('gfCadastroModalBox');
    if(!box){
      root.innerHTML='<div id="gfCadastroModalBox" role="dialog" aria-modal="true"></div>';
      box=byId('gfCadastroModalBox');
    }
    return {root:root,box:box};
  }

  var home = {title:null, form:null};
  function remember(node,key){
    if(node && !home[key]) home[key]={parent:node.parentNode,next:node.nextSibling};
  }
  function putBack(node,h){
    if(!node || !h || !h.parent) return;
    try{ h.parent.insertBefore(node, h.next && h.next.parentNode===h.parent ? h.next : null); }
    catch(e){ try{ h.parent.appendChild(node); }catch(_e){} }
  }

  var oldClose = window.closeCadastroForm;
  window.closeCadastroForm = function(){
    var root=byId('gfCadastroModalRoot'), box=byId('gfCadastroModalBox');
    var form=byId('cadAssetMainForm');
    var title=document.querySelector('#gfCadastroModalBox .cadAssetFormTitle') || document.querySelector('.cadAssetFormTitle');
    if(root && root.classList && root.classList.contains('show')){
      putBack(title, home.title);
      putBack(form, home.form);
      if(box) box.innerHTML='';
      root.className='';
      document.body.classList.remove('gfCadastroModalOpen');
      var p=page(); if(p) p.classList.remove('cadastro-asset-form-open');
      return;
    }
    if(typeof oldClose==='function') return oldClose.apply(this, arguments);
  };

  function openExistingServiceForm(){
    forceServiceKind();
    var form=byId('cadAssetMainForm');
    var title=document.querySelector('#pageCadastros .cadAssetFormTitle') || document.querySelector('.cadAssetFormTitle');

    if(!form) return false;

    remember(title,'title');
    remember(form,'form');

    var m=ensureRoot();
    if(title){
      title.innerHTML='<span class="cadFormTitleText">Novo serviço</span><button class="btn btnLight cadFormCloseBtn" type="button" onclick="closeCadastroForm()">Fechar</button>';
      m.box.appendChild(title);
    }

    forceServiceKind();

    var name=byId('assetName');
    if(name){ name.value=''; name.placeholder='Nome do serviço'; }

    var patrimonio=byId('assetPatrimonio');
    if(patrimonio) patrimonio.value='';

    m.box.appendChild(form);

    // garante que o botão do formulário salve como serviço
    var saveBtn=form.querySelector('button.btnDark, button');
    if(saveBtn){
      saveBtn.textContent='Cadastrar serviço';
      saveBtn.setAttribute('type','button');
      saveBtn.setAttribute('onclick','forceServiceKindFinalReal(); saveAsset();');
    }

    m.root.className='show gf-service-modal';
    document.body.classList.add('gfCadastroModalOpen');
    var p=page(); if(p) p.classList.add('cadastro-asset-form-open');

    setTimeout(function(){
      forceServiceKind();
      try{ (byId('assetName') || form.querySelector('input,select,textarea')).focus({preventScroll:true}); }catch(e){}
    },50);
    return true;
  }

  window.forceServiceKindFinalReal = forceServiceKind;

  async function fallbackSaveService(){
    var name=String((byId('gfFallbackServiceName')||{}).value||'').trim();
    var depEl=document.querySelector('input[name="gfFallbackServiceDeptRadio"]:checked');
    var dep=String((depEl&&depEl.value) || (byId('gfFallbackServiceDept')||{}).value || 'TI');
    var sector=String((byId('gfFallbackServiceSector')||{}).value||'');
    if(!name) return alert('Informe o nome do serviço.');
    try{
      var r=await fetch(API_ROOT+'/api/admin/assets',{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        credentials:'include',
        body:JSON.stringify({
          sector_id:sector,
          patrimonio:'',
          no_patrimonio:true,
          name:name,
          brand:'',
          model:'',
          asset_department:dep,
          asset_kind:'SERVICE',
          active:Number((byId('gfFallbackServiceStatus')||{}).value||1)
        })
      });
      var j=await r.json().catch(function(){return {};});
      if(!j.ok) return alert(j.error || 'Erro ao cadastrar serviço.');
      if(typeof toastMsg==='function') toastMsg('Serviço cadastrado');
      window.closeCadastroForm();
      if(typeof window.loadAssets==='function') window.loadAssets(true);
      else if(typeof window.loadServicesClean==='function') window.loadServicesClean();
    }catch(e){ alert('Erro ao cadastrar serviço.'); }
  }
  window.gfFallbackSaveService = fallbackSaveService;

  async function getServiceSectorsForCreate(){
    var sectors = Array.isArray(window.sectors) ? window.sectors : [];
    if(sectors.length) return sectors;
    try{
      var r=await fetch(API_ROOT+'/api/admin/sectors',{credentials:'include',cache:'no-store'});
      var j=await r.json().catch(function(){return {};});
      sectors = Array.isArray(j.sectors) ? j.sectors : [];
      window.sectors = sectors;
    }catch(e){}
    return sectors;
  }

  async function openStyledServiceCreateForm(){
    forceServiceKind();
    var m=ensureRoot();
    var sectors=await getServiceSectorsForCreate();
    var opts=sectors.map(function(s){
      return '<option value="'+esc(s.id)+'">'+esc(s.name || s.display_name || s.label || ('Setor '+s.id))+'</option>';
    }).join('');
    m.box.innerHTML =
      '<div class="gfServiceCreateModal">'+
        '<div class="gfServiceCreateHead">'+
          '<div><h2>Novo serviço</h2><small>CADASTRE O SERVIÇO. DEPOIS USE VINCULAR PARA ESCOLHER OS SETORES ONDE ELE APARECE.</small></div>'+
          '<button class="gfServiceCreateClose" type="button" onclick="closeCadastroForm()">×</button>'+
        '</div>'+
        '<div class="gfServiceCreateBody">'+
          '<div class="gfServiceCreateGrid">'+
            '<label class="gfServiceCreateField gfServiceCreateWide"><span>Nome do serviço</span><input id="gfFallbackServiceName" placeholder="Ex: INTERNET" autocomplete="off"></label>'+
            '<label class="gfServiceCreateField"><span>Setor inicial</span><select id="gfFallbackServiceSector">'+(opts || '<option value="">Sem setor</option>')+'</select></label>'+
            '<label class="gfServiceCreateField"><span>Status</span><select id="gfFallbackServiceStatus"><option value="1">Ativo</option><option value="0">Inativo</option></select></label>'+
          '</div>'+
          '<div class="gfServiceDeptTitle">Departamento</div>'+
          '<div class="gfServiceDeptCards">'+
            '<label class="gfServiceDeptCard active"><input type="radio" name="gfFallbackServiceDeptRadio" value="TI" checked><span class="dot"></span><b>💻 TI</b><small>Computador, rede, impressora</small></label>'+
            '<label class="gfServiceDeptCard"><input type="radio" name="gfFallbackServiceDeptRadio" value="MANUTENCAO"><span class="dot"></span><b>🛠️ Manutenção</b><small>Ar, elétrica, hidráulica, estrutura</small></label>'+
            '<label class="gfServiceDeptCard"><input type="radio" name="gfFallbackServiceDeptRadio" value="APOIO"><span class="dot"></span><b>🤝 Apoio</b><small>Serviços gerais e operacional</small></label>'+
          '</div>'+
        '</div>'+
        '<div class="gfServiceCreateActions">'+
          '<button class="btn btnLight" type="button" onclick="closeCadastroForm()">Cancelar</button>'+
          '<button class="btn btnDark" type="button" onclick="gfFallbackSaveService()">Cadastrar serviço</button>'+
        '</div>'+
      '</div>';
    m.root.className='show gf-service-modal gf-service-create-clean';
    document.body.classList.add('gfCadastroModalOpen');
    var p=page(); if(p) p.classList.add('cadastro-asset-form-open');
    m.box.querySelectorAll('.gfServiceDeptCard').forEach(function(card){
      card.addEventListener('click',function(){
        m.box.querySelectorAll('.gfServiceDeptCard').forEach(function(c){ c.classList.remove('active'); });
        card.classList.add('active');
      });
    });
    setTimeout(function(){ try{ byId('gfFallbackServiceName').focus({preventScroll:true}); }catch(e){} },50);
  }

  async function openFallbackServiceForm(){
    forceServiceKind();
    var m=ensureRoot();
    var sectors = Array.isArray(window.sectors) ? window.sectors : [];
    if(!sectors.length){
      try{
        var r=await fetch(API_ROOT+'/api/admin/sectors',{credentials:'include',cache:'no-store'});
        var j=await r.json();
        sectors = Array.isArray(j.sectors) ? j.sectors : [];
      }catch(e){}
    }
    var opts = sectors.map(function(s){ return '<option value="'+esc(s.id)+'">'+esc(s.name || s.display_name || s.label || ('Setor '+s.id))+'</option>'; }).join('');
    m.box.innerHTML =
      '<div class="cadProFormTitle cadAssetFormTitle"><span class="cadFormTitleText">Novo serviço</span><button class="btn btnLight cadFormCloseBtn" type="button" onclick="closeCadastroForm()">Fechar</button></div>'+
      '<div class="cadProForm assetForm gfFallbackServiceForm">'+
        '<input id="gfFallbackServiceName" placeholder="Nome do serviço"/>'+
        '<select id="gfFallbackServiceDept"><option value="TI">TI</option><option value="MANUTENCAO">Manutenção</option><option value="APOIO">Apoio</option></select>'+
        '<select id="gfFallbackServiceSector">'+(opts || '<option value="">Setor padrão</option>')+'</select>'+
        '<button class="btn btnDark" type="button" onclick="gfFallbackSaveService()">Cadastrar serviço</button>'+
      '</div>';
    m.root.className='show gf-service-modal';
    document.body.classList.add('gfCadastroModalOpen');
    var p=page(); if(p) p.classList.add('cadastro-asset-form-open');
    setTimeout(function(){ try{ byId('gfFallbackServiceName').focus({preventScroll:true}); }catch(e){} },50);
  }

  window.gfOpenNovoServico = function(){
    // Cadastro limpo de Serviço: não reutiliza o formulário antigo de equipamento.
    // Evita o modal gigante/duplicado e mantém o padrão visual dos Tipos de Problema.
    try{ openStyledServiceCreateForm(); }
    catch(e){
      console.warn('[Serviços] Falha ao abrir modal limpo, usando fallback.', e);
      openFallbackServiceForm();
    }
  };

  function bindCurrentButtons(){
    if(!isServicos()) return;
    document.querySelectorAll('button').forEach(function(btn){
      var txt=(btn.textContent||'').trim().toLowerCase();
      if(txt==='+ novo serviço' || txt==='novo serviço'){
        btn.setAttribute('type','button');
        btn.onclick=function(ev){
          if(ev){ ev.preventDefault(); ev.stopPropagation(); }
          window.gfOpenNovoServico();
          return false;
        };
      }
    });
  }

  document.addEventListener('pointerdown',function(e){
    var btn=e.target && e.target.closest && e.target.closest('button');
    if(!btn || !isServicos()) return;
    var txt=(btn.textContent||'').trim().toLowerCase();
    if(txt==='+ novo serviço' || txt==='novo serviço'){
      e.preventDefault(); e.stopPropagation();
      window.gfOpenNovoServico();
    }
  }, true);

  document.addEventListener('click',function(e){
    var btn=e.target && e.target.closest && e.target.closest('button');
    if(!btn || !isServicos()) return;
    var txt=(btn.textContent||'').trim().toLowerCase();
    if(txt==='+ novo serviço' || txt==='novo serviço'){
      e.preventDefault(); e.stopPropagation();
      window.gfOpenNovoServico();
      return;
    }

    var card=btn.closest && btn.closest('[data-service-key], .gfServiceOnlyCard, .gfCleanCard');
    var key=btn.getAttribute('data-service-key') || (card && card.getAttribute('data-service-key')) || '';
    if(txt==='vincular'){
      e.preventDefault(); e.stopPropagation();
      if(typeof window.openServiceSectorDrawer==='function') return window.openServiceSectorDrawer(key);
      return alert('Função de vínculo não encontrada.');
    }
    if(txt==='editar'){
      e.preventDefault(); e.stopPropagation();
      if(typeof window.gfEditServiceName==='function') return window.gfEditServiceName(key,'');
      return alert('Função de edição não encontrada.');
    }
    if(txt==='inativar' || txt==='ativar'){
      e.preventDefault(); e.stopPropagation();
      if(typeof window.gfToggleServiceActive==='function') return window.gfToggleServiceActive(key, txt==='ativar' ? 1 : 0);
      return alert('Função de status não encontrada.');
    }
  }, true);

  var tries=0;
  var timer=setInterval(function(){
    tries++;
    bindCurrentButtons();
    if(tries>30) clearInterval(timer);
  },300);
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', bindCurrentButtons);
  else setTimeout(bindCurrentButtons,60);
})();


/* ======================================================================
   PATCH EQUIPAMENTOS POR SETOR - 22/06
   - apenas 1 botão + Novo equipamento
   - setores fechados por padrão
   - equipamentos aparecem só ao abrir o setor
   - lista ocupa a largura útil, sem coluna vazia
   ====================================================================== */
(function(){
  'use strict';
  if(window.__GF_EQUIPAMENTOS_SETOR_FECHADO_2206__) return;
  window.__GF_EQUIPAMENTOS_SETOR_FECHADO_2206__ = true;

  var API_ROOT = (window.API || window.API_BASE || window.location.origin || '').replace(/\/$/, '');
  var equipmentCache = [];
  var openSectors = {};
  var oldOpenCadastroModule = window.openCadastroModule;
  var oldRenderAssets = window.renderAssets;
  var oldLoadAssets = window.loadAssets;

  function byId(id){ return document.getElementById(id); }
  function page(){ return byId('pageCadastros'); }
  function isEquip(){ var p=page(); return !!(p && p.classList.contains('cadastro-show-equipamentos')); }
  function esc(v){ return String(v==null?'':v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];}); }
  function norm(v){ return String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim(); }
  function active(a){ return Number(a && a.active == null ? 1 : a.active) === 1 && !/INACTIVE|DISABLED/.test(String((a&&a.status)||'ACTIVE').toUpperCase()); }
  function kindOf(a){ return String((a && (a.asset_kind || a.kind)) || 'EQUIPMENT').toUpperCase(); }
  function plainPat(a){
    var p=String((a && (a.patrimonio || a.asset_patrimonio || a.sp_identificacao || a.asset_sp_identificacao)) || '').trim();
    return p || 'Sem patrimônio';
  }
  function jfetch(url,opt){
    return fetch(url, Object.assign({cache:'no-store', credentials:'include'}, opt||{})).then(function(r){ return r.json().catch(function(){return {};}); });
  }
  function setEquipmentKind(){
    var kind=byId('assetKindSelect');
    if(kind){ kind.innerHTML='<option value="EQUIPMENT">🧰 Equipamento / patrimônio</option>'; kind.value='EQUIPMENT'; kind.hidden=true; kind.tabIndex=-1; }
    var fk=byId('assetFilterKind');
    if(fk){ fk.innerHTML='<option value="EQUIPMENT">Somente equipamentos</option>'; fk.value='EQUIPMENT'; }
  }
  function cleanEquipmentChrome(){
    if(!isEquip()) return;
    var p=page(); if(!p) return;
    p.classList.add('cadastro-module-open','cadastro-show-equipamentos');
    p.classList.remove('cadastro-show-servicos','cadastro-show-problemas');
    setEquipmentKind();

    var panel = p.querySelector('[data-cadastro-module="equipamentos"]') || p.querySelector('.cadProAssetPanel') || p;
    var title=byId('cadAssetModuleTitle'); if(title) title.textContent='Equipamentos';
    var sub=byId('cadAssetModuleSub'); if(sub) sub.textContent='Cadastre, edite, localize ou inative.';
    var icon=panel.querySelector('.cadProHeadIcon') || byId('cadAssetHeroIcon'); if(icon) icon.textContent='🧰';
    var badge=byId('cadAssetModuleBadge'); if(badge) badge.remove();

    // deixa somente o botão do cabeçalho. Remove botões duplicados na busca/hero antigo.
    var headerBtn=panel.querySelector('.cadAssetHeadNewBtn');
    if(headerBtn){ headerBtn.textContent='+ Novo equipamento'; headerBtn.setAttribute('type','button'); headerBtn.setAttribute('onclick','gfOpenNovoEquipamento()'); headerBtn.style.display='inline-flex'; }
    var heroActions=panel.querySelector('.cadastroModuleHeroActions');
    if(heroActions) heroActions.innerHTML='';
    p.querySelectorAll('button').forEach(function(btn){
      var txt=(btn.textContent||'').replace(/\s+/g,' ').trim().toLowerCase();
      if(txt.indexOf('novo equipamento')>=0 && btn!==headerBtn && !btn.closest('#gfCadastroModalRoot')) btn.remove();
    });

    var body=byId('assetsBody');
    if(!body){ body=document.createElement('div'); body.id='assetsBody'; (panel.querySelector('.cadProBody')||panel).appendChild(body); }
    var cadBody=body.parentElement || (panel.querySelector('.cadProBody')||panel);
    var wrap=byId('gfEquipmentSimpleSearch');
    if(!wrap){ wrap=document.createElement('div'); wrap.id='gfEquipmentSimpleSearch'; wrap.className='gfServiceSimpleSearch gfEquipmentSimpleSearch gfEquipmentFilterBar'; cadBody.insertBefore(wrap, body); }
    var current=(byId('assetSearch') && byId('assetSearch').value) || '';
    var currentType=(byId('assetQuickTypeFilter') && byId('assetQuickTypeFilter').value) || '';
    document.querySelectorAll('#assetSearch').forEach(function(i){ if(!wrap.contains(i)) i.remove(); });
    if(!wrap.querySelector('#assetSearch')){
      wrap.innerHTML='<div class="gfEquipmentSearchLine"><input id="assetSearch" placeholder="Buscar equipamento, patrimônio, responsável, marca, modelo ou setor" autocomplete="off" inputmode="search"><select id="assetQuickTypeFilter" aria-label="Filtrar por equipamento"><option value="">Todos equipamentos</option></select></div><div id="gfEquipmentTotalInfo" class="gfEquipmentTotalInfo">Carregando equipamentos...</div>';
    } else {
      if(!wrap.querySelector('#assetQuickTypeFilter')) wrap.querySelector('#assetSearch').insertAdjacentHTML('afterend','<select id="assetQuickTypeFilter" aria-label="Filtrar por equipamento"><option value="">Todos equipamentos</option></select>');
      if(!wrap.querySelector('#gfEquipmentTotalInfo')) wrap.insertAdjacentHTML('beforeend','<div id="gfEquipmentTotalInfo" class="gfEquipmentTotalInfo"></div>');
    }
    var inp=wrap.querySelector('#assetSearch');
    var sel=wrap.querySelector('#assetQuickTypeFilter');
    if(inp){ if(document.activeElement!==inp) inp.value=current; inp.oninput=function(){ renderEquipmentsBySector(equipmentCache); }; }
    if(sel){ if(document.activeElement!==sel) sel.value=currentType; sel.onchange=function(){ renderEquipmentsBySector(equipmentCache); }; }
  }
  function equipmentCard(a){
    var id=Number(a.id)||0, on=active(a), dep=String(a.asset_department||'TI').toUpperCase();
    var icon=dep==='MANUTENCAO'?'🛠️':(dep==='APOIO'?'🤝':'🧰');
    var meta=[plainPat(a), a.brand||a.asset_brand||'', a.model||a.asset_model||'', on?'Ativo':'Inativo'].filter(Boolean).join(' • ');
    return '<div class="gfCleanCard gfServiceSimpleCard gfEquipmentSimpleCard '+(!on?'gfInactiveCard':'')+'">'
      +'<div class="gfCardAccent"></div><div class="gfCardIcon">'+icon+'</div>'
      +'<div class="gfCadItemMain"><div class="gfCadItemTop"><h3>'+esc(a.name||'-')+'</h3></div><div class="gfCardMeta gfServiceOneLine"><span>'+esc(meta)+'</span></div></div>'
      +'<div class="gfCardActions"><button class="btn btnDark adminOnly" type="button" onclick="openAssetEditDrawer('+id+')">Editar</button><button class="btn btnLight" type="button" onclick="openAssetHistory('+id+')">Histórico</button><button class="btn '+(on?'btnDanger':'btnDark')+' adminOnly" type="button" onclick="toggleAsset('+id+',\''+(on?'INACTIVE':'ACTIVE')+'\')">'+(on?'Inativar':'Ativar')+'</button></div>'
      +'</div>';
  }
  function sectorKey(a){ return String(a.sector_id || a.origin_sector_id || a.sector_name || a.origin_sector_name || 'sem_setor'); }
  function sectorName(a){ return String(a.sector_name || a.origin_sector_name || 'Sem setor').trim() || 'Sem setor'; }
  function equipmentTypeKey(a){ return norm(a && a.name || ''); }
  function refreshEquipmentTypeFilter(allRows){
    var sel=byId('assetQuickTypeFilter'); if(!sel) return;
    var selected=sel.value || '';
    var map={};
    (allRows||[]).forEach(function(a){
      if(kindOf(a)==='SERVICE') return;
      var name=String(a.name||'').trim(); if(!name) return;
      var k=equipmentTypeKey(a);
      if(!map[k]) map[k]={name:name,total:0};
      map[k].total++;
    });
    var opts=Object.keys(map).sort(function(a,b){return map[a].name.localeCompare(map[b].name,'pt-BR');}).map(function(k){return '<option value="'+esc(k)+'">'+esc(map[k].name)+' ('+map[k].total+')</option>';}).join('');
    var html='<option value="">Todos equipamentos</option>'+opts;
    if(sel.__lastHtml!==html){ sel.innerHTML=html; sel.__lastHtml=html; }
    if([].slice.call(sel.options).some(function(o){return o.value===selected;})) sel.value=selected;
    else sel.value='';
  }
  function updateEquipmentTotalInfo(filtered,total){
    var el=byId('gfEquipmentTotalInfo'); if(!el) return;
    el.innerHTML='<b>'+filtered+'</b> de <b>'+total+'</b> equipamentos exibidos';
  }
  function renderEquipmentsBySector(list){
    if(!isEquip()) return;
    cleanEquipmentChrome();
    list=Array.isArray(list)?list:(Array.isArray(window.assets)?window.assets:equipmentCache);
    equipmentCache=list.slice();
    window.assets=equipmentCache.slice();
    var q=norm(byId('assetSearch') && byId('assetSearch').value || '');
    var selectedType=byId('assetQuickTypeFilter') && byId('assetQuickTypeFilter').value || '';
    var allEquipments=equipmentCache.filter(function(a){ return kindOf(a)!=='SERVICE'; });
    refreshEquipmentTypeFilter(allEquipments);
    selectedType=byId('assetQuickTypeFilter') && byId('assetQuickTypeFilter').value || selectedType;
    var rows=allEquipments.filter(function(a){
      if(selectedType && equipmentTypeKey(a)!==selectedType) return false;
      if(q && norm([a.name,a.patrimonio,a.asset_patrimonio,a.sp_identificacao,a.sp_responsavel,a.brand,a.asset_brand,a.model,a.asset_model,a.sector_name,a.origin_sector_name].join(' ')).indexOf(q)<0) return false;
      return true;
    });
    updateEquipmentTotalInfo(rows.length, allEquipments.length);
    rows.sort(function(a,b){
      var s=sectorName(a).localeCompare(sectorName(b),'pt-BR');
      return s || String(a.name||'').localeCompare(String(b.name||''),'pt-BR');
    });
    var groups={};
    rows.forEach(function(a){
      var k=sectorKey(a);
      if(!groups[k]) groups[k]={key:k,name:sectorName(a),items:[],active:0,total:0};
      groups[k].items.push(a); groups[k].total++; if(active(a)) groups[k].active++;
    });
    var blocks=Object.keys(groups).map(function(k){return groups[k];}).sort(function(a,b){return a.name.localeCompare(b.name,'pt-BR');});
    var body=byId('assetsBody'); if(!body) return;
    if(!blocks.length){ body.innerHTML='<div class="cadQuickEmpty gfBlockEmpty">Nenhum equipamento encontrado.</div>'; if(body.dataset) body.dataset.gfHasStableContent='1'; return; }
    body.innerHTML='<div class="gfEquipmentSectorList">'+blocks.map(function(g){
      var key=String(g.key).replace(/[^a-zA-Z0-9_-]/g,'_');
      var isOpen=!!openSectors[key];
      return '<section class="gfEquipmentSectorBlock '+(isOpen?'open':'')+'" data-sector-key="'+esc(key)+'">'
        +'<button class="gfEquipmentSectorHead" type="button" data-gf-equipment-sector="'+esc(key)+'">'
          +'<span class="gfEquipmentSectorIcon">📍</span>'
          +'<span class="gfEquipmentSectorText"><b>'+esc(g.name)+'</b><small>'+g.active+' ativos de '+g.total+' equipamentos</small></span>'
          +'<span class="gfEquipmentSectorCount">'+g.total+'</span><span class="gfEquipmentSectorArrow">⌄</span>'
        +'</button>'
        +'<div class="gfEquipmentSectorBody">'+g.items.map(equipmentCard).join('')+'</div>'
      +'</section>';
    }).join('')+'</div>';
    if(body.dataset) body.dataset.gfHasStableContent='1';
  }
  async function loadEquipmentsBySector(){
    if(!isEquip()) return;
    cleanEquipmentChrome();
    var body=byId('assetsBody'); if(body && !body.dataset.gfHasStableContent) body.innerHTML='<div class="cadQuickEmpty gfBlockEmpty">Carregando...</div>';
    try{
      var sid=byId('assetFilterSector') && byId('assetFilterSector').value || '';
      var j=await jfetch(API_ROOT+'/api/admin/assets'+(sid?'?sector_id='+encodeURIComponent(sid):''));
      renderEquipmentsBySector(Array.isArray(j.assets)?j.assets:[]);
    }catch(e){ renderEquipmentsBySector(Array.isArray(window.assets)?window.assets:equipmentCache); }
  }
  window.gfOpenNovoEquipamento=function(){
    cleanEquipmentChrome();
    setEquipmentKind();
    if(typeof window.toggleCadastroForm==='function') window.toggleCadastroForm('asset');
    setTimeout(setEquipmentKind,50);
  };
  document.addEventListener('click',function(e){
    var btn=e.target && e.target.closest && e.target.closest('[data-gf-equipment-sector]');
    if(!btn) return;
    var key=btn.getAttribute('data-gf-equipment-sector');
    openSectors[key]=!openSectors[key];
    var block=btn.closest('.gfEquipmentSectorBlock');
    if(block) block.classList.toggle('open', !!openSectors[key]);
  },true);
  window.renderEquipmentsBySector=renderEquipmentsBySector;
  window.renderAssets=function(){ if(isEquip()) return renderEquipmentsBySector(equipmentCache.length?equipmentCache:(Array.isArray(window.assets)?window.assets:[])); return typeof oldRenderAssets==='function'?oldRenderAssets.apply(this,arguments):undefined; };
  window.loadAssets=function(){ if(isEquip()) return loadEquipmentsBySector(); return typeof oldLoadAssets==='function'?oldLoadAssets.apply(this,arguments):undefined; };
  window.openCadastroModule=function(m){
    if(m==='equipamentos'){
      if(typeof oldOpenCadastroModule==='function'){ try{ oldOpenCadastroModule(m); }catch(e){} }
      openSectors={};
      cleanEquipmentChrome();
      loadEquipmentsBySector();
      return;
    }
    return typeof oldOpenCadastroModule==='function'?oldOpenCadastroModule.apply(this,arguments):undefined;
  };
  var tries=0, timer=setInterval(function(){
    tries++;
    if(isEquip()){
      cleanEquipmentChrome();
      var body=byId('assetsBody');
      if(body && (/Carregando/i.test(body.textContent||'') || body.querySelector('.gfEquipmentSimpleCard:not(.gfEquipmentSectorBody .gfEquipmentSimpleCard)'))) loadEquipmentsBySector();
    }
    if(tries>18) clearInterval(timer);
  },250);
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',function(){ if(isEquip()) loadEquipmentsBySector(); });
  else setTimeout(function(){ if(isEquip()) loadEquipmentsBySector(); },80);
})();


/* =========================================================
   GF_ROUTER_LIMPO_MODULOS_DIRETOS_20260622
   Abordagem nova: remove as correcoes antigas de Cadastros e
   deixa um roteador unico para PC e celular.
   ========================================================= */
(function(){
  'use strict';
  if(window.__GF_ROUTER_LIMPO_MODULOS_DIRETOS_20260622__) return;
  window.__GF_ROUTER_LIMPO_MODULOS_DIRETOS_20260622__ = true;

  var originalShowPage = typeof window.showPage === 'function' ? window.showPage.bind(window) : null;
  var API_ROOT = window.API || window.API_BASE || window.location.origin;
  var state = { module:'equipamentos', assets:null, services:null, issues:null, expanded:{} };

  function id(x){ return document.getElementById(x); }
  function qs(s){ return document.querySelector(s); }
  function qsa(s){ return Array.prototype.slice.call(document.querySelectorAll(s)); }
  function esc(v){ return String(v == null ? '' : v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];}); }
  function normText(v){ return String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim(); }
  function upper(v){ return String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().trim(); }
  function normModule(m){
    m = normText(m);
    if(['qr','qrcode','qrcodes','qrs'].indexOf(m)>=0) return 'qrs';
    if(['servico','servicos','serviços','services'].indexOf(m)>=0) return 'servicos';
    if(['problema','problemas','tipo','tipos','issues','tiposproblema','tipos de problema'].indexOf(m)>=0) return 'problemas';
    if(['equipamento','equipamentos','asset','assets','patrimonio','patrimonios','patrimônio','patrimônios'].indexOf(m)>=0) return 'equipamentos';
    return m || 'dashboard';
  }
  function pageCad(){ return id('pageCadastros'); }
  function apiGet(url){ return fetch(url,{cache:'no-store'}).then(function(r){ return r.json().catch(function(){ return {}; }); }); }
  function activeAsset(a){ var s=upper(a.status||a.asset_status||'ACTIVE'); return ['INACTIVE','NO_REPAIR','WRITTEN_OFF','DISABLED'].indexOf(s)<0; }
  function kindOf(a){ var k=upper(a.asset_kind||a.kind||a.type||'EQUIPMENT'); return k.indexOf('SERV')>=0?'SERVICE':'EQUIPMENT'; }
  function assetName(a){ return String(a.name||a.asset_name||'Sem nome').trim(); }
  function sectorName(a){ return String(a.sector_name||a.origin_sector_name||a.local||'SEM SETOR').trim() || 'SEM SETOR'; }
  function patrimonio(a){ return String(a.patrimonio||a.sp_identificacao||'Sem patrimônio'); }
  function serviceKey(s){ return String(s.service_key||s.name||''); }
  function serviceActive(s){ return Number(s.active == null ? 1 : s.active) === 1 && ['INACTIVE','DISABLED'].indexOf(upper(s.status||'ACTIVE'))<0; }

  function injectCss(){
    if(id('gfRouterLimpoCss')) return;
    var st=document.createElement('style');
    st.id='gfRouterLimpoCss';
    st.textContent = [
      '#tabCadastros,#gfCadastrosSub,.gfSideSub{display:none!important}',
      '.gfSideMenu{display:flex!important;flex-direction:column!important;gap:10px!important}',
      '.gfSideItem{cursor:pointer!important;touch-action:manipulation!important}',
      '.gfCadCleanPage{max-width:1480px!important;margin:0 auto!important;padding:24px!important;background:#fff!important;border:1px solid rgba(180,205,230,.7)!important;border-radius:28px!important;min-height:calc(100vh - 150px)!important}',
      '.gfCadCleanHead{display:flex!important;align-items:center!important;justify-content:space-between!important;gap:16px!important;border-bottom:1px solid #dbe7f5!important;padding-bottom:22px!important;margin-bottom:22px!important}',
      '.gfCadCleanTitle{display:flex!important;align-items:center!important;gap:16px!important}.gfCadCleanIcon{width:58px!important;height:58px!important;border-radius:18px!important;display:grid!important;place-items:center!important;background:#eafff2!important;border:1px solid #bcf0d0!important;font-size:26px!important}.gfCadCleanTitle h1{margin:0!important;font-size:30px!important;line-height:1.05!important}.gfCadCleanTitle p{margin:5px 0 0!important;color:#526781!important;font-weight:800!important}',
      '.gfCadCleanNew{border:0!important;border-radius:16px!important;background:#119c56!important;color:white!important;font-weight:1000!important;padding:14px 18px!important;box-shadow:0 10px 24px rgba(17,156,86,.18)!important;cursor:pointer!important}',
      '.gfCadCleanToolbar{display:grid!important;grid-template-columns:minmax(220px,1fr) 280px auto!important;gap:12px!important;align-items:center!important;margin-bottom:18px!important}.gfCadCleanToolbar input,.gfCadCleanToolbar select{height:52px!important;border:1px solid #d8e6f5!important;border-radius:15px!important;padding:0 14px!important;font-weight:900!important;color:#061747!important;background:#fff!important}.gfCadCleanToolbar strong{font-size:14px!important;color:#061747!important;line-height:1.2!important}',
      '.gfCadCleanBody{display:grid!important;gap:12px!important;max-width:820px!important}.gfCadGroup{border:1px solid #d8e6f5!important;border-radius:18px!important;background:#fff!important;overflow:hidden!important}.gfCadGroupHead{width:100%!important;border:0!important;background:#fff!important;display:grid!important;grid-template-columns:58px 1fr auto 28px!important;gap:14px!important;align-items:center!important;text-align:left!important;padding:14px 18px!important;cursor:pointer!important}.gfCadPin{width:46px!important;height:46px!important;border-radius:15px!important;background:#eafff2!important;border:1px solid #c8f2d9!important;display:grid!important;place-items:center!important}.gfCadGroupHead b{font-size:22px!important;color:#061747!important}.gfCadGroupHead small{display:block!important;color:#526781!important;font-weight:900!important;margin-top:3px!important}.gfCadGroupHead em{font-style:normal!important;background:#11ad69!important;color:white!important;min-width:42px!important;height:42px!important;border-radius:50%!important;display:grid!important;place-items:center!important;font-weight:1000!important}',
      '.gfCadItems{display:grid!important;gap:10px!important;padding:0 14px 14px 70px!important}.gfCadItems.standalone{padding:0!important}.gfCadItem{display:grid!important;grid-template-columns:56px 1fr auto!important;gap:14px!important;align-items:center!important;border:1px solid #dbe7f5!important;border-left:5px solid #11ad69!important;border-radius:17px!important;padding:14px!important;background:#fff!important}.gfCadItem.off{border-left-color:#99a6b8!important;opacity:.78!important}.gfCadItemIcon{width:46px!important;height:46px!important;border-radius:15px!important;background:#eafff2!important;border:1px solid #c8f2d9!important;display:grid!important;place-items:center!important;font-size:22px!important}.gfCadItem h3{margin:0!important;color:#061747!important;font-size:18px!important}.gfCadItem p{margin:5px 0 0!important;color:#526781!important;font-weight:850!important}.gfCadActions{display:flex!important;gap:8px!important;flex-wrap:wrap!important;justify-content:flex-end!important}.gfCadActions button{border:0!important;border-radius:13px!important;padding:10px 12px!important;font-weight:1000!important;cursor:pointer!important}.gfCadPrimary{background:#119c56!important;color:white!important}.gfCadLight{background:#fff!important;color:#061747!important;border:1px solid #dbe7f5!important}.gfCadDanger{background:#ef4444!important;color:white!important}.gfCadEmpty{padding:24px!important;border:1px dashed #cbd8e8!important;border-radius:18px!important;color:#526781!important;font-weight:900!important;background:#f8fbff!important}',
      '.gfCleanModalBg{position:fixed!important;inset:0!important;background:rgba(4,18,40,.42)!important;z-index:2147483500!important;display:none!important}.gfCleanModalBg.show{display:block!important}.gfCleanModal{position:fixed!important;right:20px!important;top:96px!important;width:min(520px,calc(100vw - 28px))!important;max-height:calc(100dvh - 120px)!important;overflow:auto!important;background:#fff!important;border-radius:24px!important;border:1px solid #dbe7f5!important;box-shadow:0 30px 80px rgba(0,0,0,.25)!important;z-index:2147483600!important;display:none!important;padding:18px!important}.gfCleanModal.show{display:block!important}.gfCleanModalHead{display:flex!important;justify-content:space-between!important;align-items:flex-start!important;gap:12px!important;border-bottom:1px solid #e3edf8!important;padding-bottom:12px!important;margin-bottom:12px!important}.gfCleanModalHead h2{margin:0!important;color:#061747!important}.gfCleanModalClose{border:0!important;background:#f2f6fb!important;border-radius:12px!important;width:42px!important;height:42px!important;font-size:24px!important;font-weight:1000!important}.gfCleanForm{display:grid!important;gap:12px!important}.gfCleanForm label{display:grid!important;gap:6px!important;font-weight:1000!important;color:#061747!important}.gfCleanForm input,.gfCleanForm select{height:48px!important;border:1px solid #d8e6f5!important;border-radius:14px!important;padding:0 12px!important;font-weight:900!important}.gfCleanModalFoot{display:flex!important;justify-content:flex-end!important;gap:10px!important;margin-top:16px!important}.gfCleanModalFoot button{border:0!important;border-radius:14px!important;padding:12px 16px!important;font-weight:1000!important}',
      '@media(max-width:900px){.gfCadCleanPage{width:100%!important;margin:0!important;border-radius:18px!important;padding:12px!important;min-height:calc(100dvh - 108px)!important}.gfCadCleanHead{align-items:flex-start!important}.gfCadCleanTitle h1{font-size:24px!important}.gfCadCleanIcon{width:50px!important;height:50px!important}.gfCadCleanNew{padding:12px!important;font-size:13px!important}.gfCadCleanToolbar{grid-template-columns:1fr!important}.gfCadCleanBody{max-width:none!important}.gfCadGroupHead{grid-template-columns:50px 1fr auto 22px!important;padding:12px!important}.gfCadGroupHead b{font-size:18px!important}.gfCadItems{padding:0 10px 10px 10px!important}.gfCadItem{grid-template-columns:46px 1fr!important}.gfCadActions{grid-column:1/-1!important;justify-content:flex-start!important}.gfCleanModal{left:0!important;right:0!important;top:0!important;bottom:0!important;width:100vw!important;max-height:100dvh!important;border-radius:0!important}}'
    ].join('\n');
    document.head.appendChild(st);
  }

  function cleanupLegacyMenu(){
    var old=id('tabCadastros'); if(old) old.remove();
    var sub=id('gfCadastrosSub'); if(sub) sub.remove();
    qsa('.gfSideSub').forEach(function(el){ el.remove(); });
    document.body.classList.remove('gf-cad-sub-open');
  }
  function setActive(menuId){
    qsa('.gfSideItem,.tab,#gfMobileBottomNav button').forEach(function(el){ el.classList.remove('active'); });
    var el=id(menuId); if(el) el.classList.add('active');
    var mobileMap={tabDashboard:'dashboard',tabOperacao:'operacao',navCadQrs:'qrs',navCadEquipamentos:'equipamentos',navCadServicos:'servicos',navCadProblemas:'problemas',navIaGuara:'ia',tabUsuarios:'usuarios'};
    qsa('#gfMobileBottomNav button').forEach(function(b){ b.classList.toggle('active', b.getAttribute('data-gf-route')===mobileMap[menuId]); });
  }
  function hideAll(){ qsa('.gfMainWrap > section[id^="page"], section[id^="page"]').forEach(function(s){ s.classList.add('hidden'); s.setAttribute('aria-hidden','true'); }); }
  function showPageEl(pageId){ hideAll(); var p=id(pageId); if(p){ p.classList.remove('hidden'); p.removeAttribute('aria-hidden'); p.style.display=''; } try{ window.scrollTo({top:0,left:0,behavior:'auto'}); }catch(e){ window.scrollTo(0,0); } }

  function ensureMenuButton(idBtn, icon, label, route){
    var menu=qs('.gfSideMenu'); if(!menu) return;
    var existing=id(idBtn); if(existing) existing.remove();
    var before=id('navIaGuara') || id('tabUsuarios');
    var btn=document.createElement('button');
    btn.className='tab gfSideItem'; btn.id=idBtn; btn.type='button'; btn.setAttribute('data-gf-route',route);
    btn.innerHTML='<span>'+icon+'</span><b>'+label+'</b>';
    btn.addEventListener('click', function(ev){ ev.preventDefault(); ev.stopPropagation(); if(ev.stopImmediatePropagation) ev.stopImmediatePropagation(); openRoute(route); return false; }, true);
    if(before && before.parentNode===menu) menu.insertBefore(btn,before); else menu.appendChild(btn);
  }
  function normalizeMenu(){
    injectCss(); cleanupLegacyMenu();
    ensureMenuButton('navCadQrs','▦','QR Codes e Setores','qrs');
    ensureMenuButton('navCadEquipamentos','🧰','Equipamentos / Patrimônios','equipamentos');
    ensureMenuButton('navCadServicos','🧩','Serviços','servicos');
    ensureMenuButton('navCadProblemas','⚠️','Tipos de problema','problemas');
    ['tabDashboard','tabOperacao','navIaGuara','tabUsuarios'].forEach(function(btnId){ var b=id(btnId); if(b && !b.dataset.gfCleanRouteBound){
      b.dataset.gfCleanRouteBound='1';
      b.addEventListener('click', function(ev){ var r=btnId==='tabDashboard'?'dashboard':btnId==='tabOperacao'?'operacao':btnId==='navIaGuara'?'ia':'usuarios'; ev.preventDefault(); ev.stopPropagation(); if(ev.stopImmediatePropagation) ev.stopImmediatePropagation(); openRoute(r); return false; }, true);
    }});
    buildMobileNav();
  }

  function buildMobileNav(){ var n=document.getElementById('gfMobileBottomNav'); if(n) n.remove(); return; }

  function openRoute(route){
    route = normModule(route);
    cleanupLegacyMenu();
    if(route==='equipamentos' || route==='servicos' || route==='problemas') return openCadastro(route);
    if(route==='qrs'){
      if(originalShowPage){ try{ originalShowPage('qrs'); }catch(e){ showPageEl('pageQrs'); } } else showPageEl('pageQrs');
      setActive('navCadQrs');
      return false;
    }
    var map={dashboard:['dashboard','tabDashboard'],operacao:['operacao','tabOperacao'],consulta:['operacao','tabOperacao'],ia:['ia','navIaGuara'],usuarios:['usuarios','tabUsuarios'],configuracoes:['usuarios','tabUsuarios']};
    var data=map[route] || map.dashboard;
    if(originalShowPage){ try{ originalShowPage(data[0]); }catch(e){ showPageEl('page'+data[0].charAt(0).toUpperCase()+data[0].slice(1)); } }
    else showPageEl('page'+data[0].charAt(0).toUpperCase()+data[0].slice(1));
    setActive(data[1]);
    return false;
  }

  function cadastroSkeleton(title, icon, sub, btn){
    return '<div class="gfCadCleanPage" data-module="'+esc(state.module)+'">'+
      '<div class="gfCadCleanHead"><div class="gfCadCleanTitle"><span class="gfCadCleanIcon">'+icon+'</span><div><h1>'+esc(title)+'</h1><p>'+esc(sub)+'</p></div></div><button class="gfCadCleanNew adminOnly" type="button" onclick="gfCadNovo()">'+esc(btn)+'</button></div>'+
      '<div class="gfCadCleanToolbar"><input id="gfCadSearch" placeholder="Buscar..." autocomplete="off"><select id="gfCadSelect"></select><strong id="gfCadCount">Carregando...</strong></div><div class="gfCadCleanBody" id="gfCadBody"><div class="gfCadEmpty">Carregando...</div></div></div>';
  }
  function openCadastro(module){
    module=normModule(module); if(['equipamentos','servicos','problemas'].indexOf(module)<0) module='equipamentos';
    state.module=module; try{ localStorage.setItem('gfCadastroModuloDireto',module); }catch(e){}
    showPageEl('pageCadastros');
    var p=pageCad(); if(!p) return false;
    p.className='';
    if(module==='servicos') p.innerHTML=cadastroSkeleton('Serviços','🧩','Cadastre, edite, vincule ou inative.','+ Novo serviço');
    else if(module==='problemas') p.innerHTML=cadastroSkeleton('Tipos de problema','⚠️','Problemas exibidos no QR.','+ Novo problema');
    else p.innerHTML=cadastroSkeleton('Equipamentos','🧰','Equipamentos agrupados por setor.','+ Novo equipamento');
    var s=id('gfCadSearch'), f=id('gfCadSelect');
    if(s) s.addEventListener('input', renderCadastro, {passive:true});
    if(f) f.addEventListener('change', renderCadastro, {passive:true});
    setActive(module==='servicos'?'navCadServicos':module==='problemas'?'navCadProblemas':'navCadEquipamentos');
    loadCadastro();
    return false;
  }
  async function loadCadastro(){
    try{
      if(state.module==='equipamentos' && !state.assets){ var ja=await apiGet(API_ROOT+'/api/admin/assets'); state.assets=Array.isArray(ja.assets)?ja.assets:[]; window.assets=state.assets; }
      if(state.module==='servicos' && !state.services){
        var js=await apiGet(API_ROOT+'/api/admin/service-groups');
        if(Array.isArray(js.services)) state.services=js.services;
        else { var ja2=await apiGet(API_ROOT+'/api/admin/assets'); state.services=(Array.isArray(ja2.assets)?ja2.assets:[]).filter(function(a){return kindOf(a)==='SERVICE';}); }
      }
      if(state.module==='problemas' && !state.issues){ var ji=await apiGet(API_ROOT+'/api/admin/issues'); state.issues=Array.isArray(ji.issues)?ji.issues:[]; }
      renderCadastro();
    }catch(e){ var b=id('gfCadBody'); if(b) b.innerHTML='<div class="gfCadEmpty">Erro ao carregar. Tente atualizar a página.</div>'; }
  }
  function query(){ return normText(id('gfCadSearch') ? id('gfCadSearch').value : ''); }
  function selected(){ return id('gfCadSelect') ? id('gfCadSelect').value : ''; }
  function count(t){ var c=id('gfCadCount'); if(c) c.textContent=t; }
  function fillSelect(opts, first){ var sel=id('gfCadSelect'); if(!sel) return ''; var old=sel.value; sel.innerHTML='<option value="">'+esc(first)+'</option>'+opts.map(function(o){return '<option value="'+esc(o)+'">'+esc(o)+'</option>';}).join(''); if(opts.indexOf(old)>=0) sel.value=old; return sel.value; }
  function renderCadastro(){ if(state.module==='servicos') return renderServicos(); if(state.module==='problemas') return renderProblemas(); return renderEquipamentos(); }
  function renderEquipamentos(){
    var all=(state.assets||[]).filter(function(a){ return kindOf(a)!=='SERVICE'; });
    var opts=Array.from(new Set(all.map(assetName).filter(Boolean))).sort(function(a,b){return a.localeCompare(b,'pt-BR');});
    var sel=fillSelect(opts,'Todos equipamentos'), q=query();
    var rows=all.filter(function(a){ if(sel && assetName(a)!==sel) return false; if(q && normText([assetName(a),patrimonio(a),a.sp_responsavel,a.brand,a.model,sectorName(a)].join(' ')).indexOf(q)<0) return false; return true; });
    count(rows.length+' de '+all.length+' equipamentos exibidos');
    var groups={}; rows.forEach(function(a){ var s=sectorName(a); (groups[s]=groups[s]||[]).push(a); });
    var html=Object.keys(groups).sort(function(a,b){return a.localeCompare(b,'pt-BR');}).map(function(sec){ var list=groups[sec].sort(function(a,b){return assetName(a).localeCompare(assetName(b),'pt-BR');}); var act=list.filter(activeAsset).length,total=list.length,key='eq_'+sec,open=!!state.expanded[key]; return '<div class="gfCadGroup"><button class="gfCadGroupHead" type="button" onclick="gfCadToggle(\''+esc(key)+'\')"><span class="gfCadPin">📍</span><span><b>'+esc(sec)+'</b><small>'+act+' ativos de '+total+' equipamentos</small></span><em>'+total+'</em><i>'+(open?'⌃':'⌄')+'</i></button>'+(open?'<div class="gfCadItems">'+list.map(assetCard).join('')+'</div>':'')+'</div>'; }).join('');
    var b=id('gfCadBody'); if(b) b.innerHTML=html || '<div class="gfCadEmpty">Nenhum equipamento encontrado.</div>';
  }
  function assetCard(a){ var on=activeAsset(a), n=Number(a.id)||0; return '<div class="gfCadItem '+(!on?'off':'')+'"><span class="gfCadItemIcon">🧰</span><div><h3>'+esc(assetName(a))+'</h3><p>'+esc(patrimonio(a))+' • '+esc(a.brand||'-')+' '+esc(a.model||'')+' • '+(on?'Ativo':'Inativo')+'</p></div><div class="gfCadActions"><button class="gfCadPrimary adminOnly" onclick="openAssetEditDrawer('+n+')">Editar</button><button class="gfCadLight" onclick="openAssetHistory('+n+')">Histórico</button><button class="'+(on?'gfCadDanger':'gfCadPrimary')+' adminOnly" onclick="toggleAsset('+n+',\''+(on?'INACTIVE':'ACTIVE')+'\')">'+(on?'Inativar':'Ativar')+'</button></div></div>'; }
  function renderServicos(){
    var all=state.services||[]; var opts=Array.from(new Set(all.map(function(s){return String(s.name||s.asset_name||'');}).filter(Boolean))).sort(function(a,b){return a.localeCompare(b,'pt-BR');}); var sel=fillSelect(opts,'Todos serviços'), q=query();
    var rows=all.filter(function(s){ var name=String(s.name||s.asset_name||''); if(sel && name!==sel) return false; var setores=(Array.isArray(s.sectors)?s.sectors:[]).map(function(x){return x.name}).join(' '); if(q && normText([name,s.service_key,s.asset_department,s.department,setores].join(' ')).indexOf(q)<0) return false; return true; });
    count(rows.length+' de '+all.length+' serviços exibidos'); var b=id('gfCadBody'); if(b) b.innerHTML=rows.length?'<div class="gfCadItems standalone">'+rows.sort(function(a,b){return String(a.name||a.asset_name||'').localeCompare(String(b.name||b.asset_name||''),'pt-BR');}).map(serviceCard).join('')+'</div>':'<div class="gfCadEmpty">Nenhum serviço encontrado.</div>';
  }
  function serviceCard(s){ var on=serviceActive(s), key=esc(serviceKey(s)), name=esc(s.name||s.asset_name||'-'); return '<div class="gfCadItem '+(!on?'off':'')+'"><span class="gfCadItemIcon">🧩</span><div><h3>'+name+'</h3><p>'+esc(upper(s.asset_department||s.department||'MANUTENCAO'))+' • '+(on?'Ativo':'Inativo')+'</p></div><div class="gfCadActions"><button class="gfCadPrimary adminOnly" onclick="openServiceSectorEditor(\''+key+'\')">Vincular</button><button class="gfCadLight adminOnly" onclick="editServiceName(\''+key+'\')">Editar</button><button class="'+(on?'gfCadDanger':'gfCadPrimary')+' adminOnly" onclick="toggleServiceGroupActive(\''+key+'\','+(on?'0':'1')+')">'+(on?'Inativar':'Ativar')+'</button></div></div>'; }
  function renderProblemas(){
    var all=state.issues||[]; var opts=Array.from(new Set(all.map(function(i){return String(i.asset_name||i.item_name||i.service_name||'GERAL');}).filter(Boolean))).sort(function(a,b){return a.localeCompare(b,'pt-BR');}); var sel=fillSelect(opts,'Todos itens'), q=query();
    var rows=all.filter(function(i){ var item=String(i.asset_name||i.item_name||i.service_name||'GERAL'); if(sel && item!==sel) return false; if(q && normText([i.name,i.issue_type,item,i.priority].join(' ')).indexOf(q)<0) return false; return true; }); count(rows.length+' de '+all.length+' problemas exibidos');
    var groups={}; rows.forEach(function(i){ var it=String(i.asset_name||i.item_name||i.service_name||'GERAL'); (groups[it]=groups[it]||[]).push(i); });
    var html=Object.keys(groups).sort(function(a,b){return a.localeCompare(b,'pt-BR');}).map(function(item){ var list=groups[item], key='is_'+item, open=!!state.expanded[key]; return '<div class="gfCadGroup"><button class="gfCadGroupHead" type="button" onclick="gfCadToggle(\''+esc(key)+'\')"><span class="gfCadPin">⚠️</span><span><b>'+esc(item)+'</b><small>'+list.length+' problema(s)</small></span><em>'+list.length+'</em><i>'+(open?'⌃':'⌄')+'</i></button>'+(open?'<div class="gfCadItems">'+list.map(issueCard).join('')+'</div>':'')+'</div>'; }).join(''); var b=id('gfCadBody'); if(b) b.innerHTML=html || '<div class="gfCadEmpty">Nenhum problema encontrado.</div>';
  }
  function issueCard(i){ var on=i.active !== false && Number(i.active == null ? 1 : i.active) === 1; return '<div class="gfCadItem '+(!on?'off':'')+'"><span class="gfCadItemIcon">⚠️</span><div><h3>'+esc(i.name||i.issue_type||'-')+'</h3><p>'+esc(i.priority||'MEDIUM')+' • '+(on?'Ativo':'Inativo')+'</p></div><div class="gfCadActions"><button class="gfCadLight adminOnly" onclick="if(window.editIssue) editIssue('+Number(i.id||0)+')">Editar</button></div></div>'; }
  window.gfCadToggle=function(key){ state.expanded[key]=!state.expanded[key]; renderCadastro(); };

  var sectorsCache=null;
  async function loadSectors(){ if(Array.isArray(sectorsCache)) return sectorsCache; try{ var j=await apiGet(API_ROOT+'/api/admin/sectors'); sectorsCache=Array.isArray(j.sectors)?j.sectors:[]; }catch(e){ sectorsCache=[]; } return sectorsCache; }
  function ensureModal(){ if(id('gfCleanCreateBg')) return; document.body.insertAdjacentHTML('beforeend','<div id="gfCleanCreateBg" class="gfCleanModalBg" onclick="gfCleanCloseCreate()"></div><aside id="gfCleanCreateModal" class="gfCleanModal"><div class="gfCleanModalHead"><div><h2 id="gfCleanCreateTitle">Novo cadastro</h2><small id="gfCleanCreateSub">Preencha e salve.</small></div><button type="button" class="gfCleanModalClose" onclick="gfCleanCloseCreate()">×</button></div><div class="gfCleanForm"><input type="hidden" id="gfCleanKind"><label id="gfCleanSectorLine">Setor<select id="gfCleanSector"></select></label><label>Nome<input id="gfCleanName" placeholder="Nome"></label><div id="gfCleanEquipFields" class="gfCleanForm"><label>Patrimônio / SP<input id="gfCleanPat" placeholder="Opcional"></label><label>Marca<input id="gfCleanBrand" placeholder="Opcional"></label><label>Modelo<input id="gfCleanModel" placeholder="Opcional"></label></div><label>Departamento<select id="gfCleanDept"><option value="TI">TI</option><option value="MANUTENCAO">Manutenção</option><option value="APOIO">Apoio</option></select></label></div><div class="gfCleanModalFoot"><button class="gfCadLight" type="button" onclick="gfCleanCloseCreate()">Cancelar</button><button class="gfCadPrimary" type="button" id="gfCleanSave" onclick="gfCleanSaveCreate()">Salvar</button></div></aside>'); }
  window.gfCadNovo=function(){
    if(state.module==='problemas'){ if(typeof window.toggleCadastroForm==='function') return window.toggleCadastroForm('issue'); alert('Cadastro de problema indisponível neste arquivo.'); return false; }
    ensureModal(); var svc=state.module==='servicos'; id('gfCleanKind').value=svc?'SERVICE':'EQUIPMENT'; id('gfCleanCreateTitle').textContent=svc?'Novo serviço':'Novo equipamento'; id('gfCleanCreateSub').textContent=svc?'Crie o serviço e depois vincule setores.':'Cadastre o equipamento dentro do setor.'; id('gfCleanSectorLine').style.display=svc?'none':'grid'; id('gfCleanEquipFields').style.display=svc?'none':'grid'; id('gfCleanDept').value=svc?'MANUTENCAO':'TI'; ['gfCleanName','gfCleanPat','gfCleanBrand','gfCleanModel'].forEach(function(x){var e=id(x); if(e)e.value='';}); id('gfCleanCreateBg').classList.add('show'); id('gfCleanCreateModal').classList.add('show'); if(!svc) loadSectors().then(function(list){ var sel=id('gfCleanSector'); if(sel) sel.innerHTML=list.map(function(s){return '<option value="'+esc(s.id)+'">'+esc(s.name||s.sector_name||('Setor '+s.id))+'</option>';}).join('') || '<option value="">Sem setor</option>'; }); setTimeout(function(){ var n=id('gfCleanName'); if(n)n.focus(); },50); return false;
  };
  window.gfCleanCloseCreate=function(){ var b=id('gfCleanCreateBg'), m=id('gfCleanCreateModal'); if(b)b.classList.remove('show'); if(m)m.classList.remove('show'); };
  window.gfCleanSaveCreate=async function(){
    var btn=id('gfCleanSave'); try{ var kind=id('gfCleanKind').value, name=String(id('gfCleanName').value||'').trim().toUpperCase(); if(!name){ alert('Informe o nome.'); return; } if(btn){btn.disabled=true;btn.textContent='Salvando...';} var body={name:name,asset_kind:kind,asset_department:id('gfCleanDept').value||'TI',status:'ACTIVE'}; if(kind==='EQUIPMENT'){ body.sector_id=id('gfCleanSector').value; body.patrimonio=String(id('gfCleanPat').value||'').trim(); body.brand=String(id('gfCleanBrand').value||'').trim(); body.model=String(id('gfCleanModel').value||'').trim(); if(!body.sector_id){alert('Selecione um setor.'); return;} } await fetch(API_ROOT+'/api/admin/assets',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}).then(function(r){return r.json().then(function(j){ if(!r.ok || j.ok===false) throw new Error(j.error||j.message||'Erro ao salvar'); return j;});}); gfCleanCloseCreate(); state.assets=null; state.services=null; openCadastro(kind==='SERVICE'?'servicos':'equipamentos'); }catch(e){ alert(e.message||'Erro ao salvar.'); } finally{ if(btn){btn.disabled=false;btn.textContent='Salvar';} };
  };

  window.openCadastroModule = openCadastro;
  window.gfOpenCadastroDireto = openRoute;
  window.gfOpenCadastroSideModule = openCadastro;
  window.gfOpenCadastrosSide = function(ev){ if(ev){ ev.preventDefault(); ev.stopPropagation(); if(ev.stopImmediatePropagation) ev.stopImmediatePropagation(); } return openCadastro('equipamentos'); };
  window.showPage = function(page){ return openRoute(page); };
  try{ showPage = window.showPage; }catch(e){}

  document.addEventListener('click', function(ev){
    var btn=ev.target && ev.target.closest && ev.target.closest('[data-gf-route],#navCadQrs,#navCadEquipamentos,#navCadServicos,#navCadProblemas');
    if(!btn) return;
    ev.preventDefault(); ev.stopPropagation(); if(ev.stopImmediatePropagation) ev.stopImmediatePropagation();
    var route=btn.getAttribute('data-gf-route') || (btn.id==='navCadQrs'?'qrs':btn.id==='navCadServicos'?'servicos':btn.id==='navCadProblemas'?'problemas':'equipamentos');
    openRoute(route); return false;
  }, true);

  function boot(){ normalizeMenu(); }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', boot, {once:true}); else boot();
  window.addEventListener('load', function(){ boot(); setTimeout(boot,160); }, {passive:true});
  window.addEventListener('pageshow', function(){ setTimeout(boot,0); }, {passive:true});
  window.addEventListener('resize', function(){ setTimeout(buildMobileNav,100); }, {passive:true});
})();

/* =========================================================
   GF_FIX_TIPOS_NAV_FINAL_20260622
   - Tipos de problema mostra somente problemas na lista
   - Equipamentos/serviços ficam somente dentro do problema expandido
   - Filtro Ativos/Inativos/Todos
   - Roteador reforçado para PC/celular não cair na Central antiga
   ========================================================= */
(function(){
  'use strict';
  if(window.__GF_FIX_TIPOS_NAV_FINAL_20260622__) return;
  window.__GF_FIX_TIPOS_NAV_FINAL_20260622__ = true;

  var API_ROOT = window.API || window.API_BASE || window.location.origin;
  var oldShowPage = typeof window.showPage === 'function' ? window.showPage.bind(window) : null;
  var cache = { issues:null, expanded:{}, module:null };

  function id(x){ return document.getElementById(x); }
  function qsa(s){ return Array.prototype.slice.call(document.querySelectorAll(s)); }
  function esc(v){ return String(v == null ? '' : v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];}); }
  function norm(v){ return String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim(); }
  function key(v){ return norm(v).replace(/[^a-z0-9]+/g,''); }
  function activeIssue(i){ return Number(i && i.active == null ? 1 : i.active) === 1; }
  function issueName(i){ return String((i && (i.name || i.issue_type || i.problem_name || i.problem)) || 'SEM NOME').trim() || 'SEM NOME'; }
  function issueItem(i){ return String((i && (i.asset_name || i.item_name || i.service_name)) || '').trim(); }
  function itemKind(item){
    var k = key(item);
    var svcs = [];
    try{ svcs = (window.gfIssueServiceGroups || window.serviceGroupsCache || []).map(function(s){ return [s.name,s.service_key,s.legacy_asset_name].map(key); }).flat(); }catch(e){ svcs=[]; }
    return svcs.indexOf(k) >= 0 ? 'service' : 'equipment';
  }
  function pageCad(){ return id('pageCadastros'); }
  function hideAll(){ qsa('.gfMainWrap > section[id^="page"], section[id^="page"]').forEach(function(s){ s.classList.add('hidden'); s.setAttribute('aria-hidden','true'); }); }
  function showPageEl(pid){
    hideAll();
    var p=id(pid); if(p){ p.classList.remove('hidden'); p.removeAttribute('aria-hidden'); p.style.display=''; }
    try{ var op=id('pageOperacao'); if(op) op.classList.remove('gfOpConsultaMode'); var oc=id('gfOperationConsulta'); if(oc) oc.remove(); }catch(e){}
    try{ window.scrollTo({top:0,left:0,behavior:'auto'}); }catch(e){ window.scrollTo(0,0); }
  }
  function setActive(btnId){
    qsa('.gfSideItem,.tab,#gfMobileBottomNav button').forEach(function(el){ el.classList.remove('active'); });
    var b=id(btnId); if(b) b.classList.add('active');
    var map={navCadProblemas:'problemas',navCadEquipamentos:'equipamentos',navCadServicos:'servicos',navCadQrs:'qrs',tabDashboard:'dashboard',tabOperacao:'operacao',navIaGuara:'ia',tabUsuarios:'usuarios'};
    qsa('#gfMobileBottomNav button').forEach(function(x){ x.classList.toggle('active', x.getAttribute('data-gf-route')===map[btnId]); });
  }
  function openNormal(route){
    var map={dashboard:['dashboard','tabDashboard'],operacao:['operacao','tabOperacao'],consulta:['operacao','tabOperacao'],ia:['ia','navIaGuara'],usuarios:['usuarios','tabUsuarios'],configuracoes:['usuarios','tabUsuarios']};
    var d=map[route] || map.dashboard;
    if(oldShowPage){ try{ oldShowPage(d[0]); }catch(e){ showPageEl('page'+d[0].charAt(0).toUpperCase()+d[0].slice(1)); } }
    else showPageEl('page'+d[0].charAt(0).toUpperCase()+d[0].slice(1));
    setActive(d[1]);
    return false;
  }
  function openRoute(route){
    route = norm(route);
    if(['problemas','tipos','tipo','issues','tiposproblema','tipos de problema'].indexOf(route)>=0) return openTipos();
    if(['equipamentos','patrimonios','patrimonio','assets'].indexOf(route)>=0){ if(window.openCadastroModule) return window.openCadastroModule('equipamentos'); }
    if(['servicos','servico','services'].indexOf(route)>=0){ if(window.openCadastroModule) return window.openCadastroModule('servicos'); }
    if(['qrs','qr','qrcode','qrcodes'].indexOf(route)>=0){ if(oldShowPage){ try{ oldShowPage('qrs'); }catch(e){ showPageEl('pageQrs'); } } else showPageEl('pageQrs'); setActive('navCadQrs'); return false; }
    return openNormal(route);
  }
  function skeleton(){
    return '<div class="gfCadCleanPage gfTiposOnlyPage" data-module="problemas">'+
      '<div class="gfCadCleanHead"><div class="gfCadCleanTitle"><span class="gfCadCleanIcon">⚠️</span><div><h1>Tipos de problema</h1><p>Lista de problemas. Equipamentos e serviços aparecem somente dentro do problema.</p></div></div><button class="gfCadCleanNew adminOnly" type="button" onclick="gfTipoNovoProblema()">+ Novo problema</button></div>'+
      '<div class="gfCadCleanToolbar gfTiposToolbar"><input id="gfTipoSearch" placeholder="Buscar problema..." autocomplete="off"><select id="gfTipoStatus"><option value="ACTIVE">Ativos</option><option value="INACTIVE">Inativos</option><option value="ALL">Todos</option></select><strong id="gfTipoCount">Carregando...</strong></div><div class="gfCadCleanBody" id="gfTipoBody"><div class="gfCadEmpty">Carregando...</div></div></div>';
  }
  async function getIssues(force){
    if(!force && Array.isArray(cache.issues)) return cache.issues;
    var j = await fetch(API_ROOT+'/api/admin/issues',{cache:'no-store'}).then(function(r){return r.json();});
    cache.issues = Array.isArray(j.issues) ? j.issues : [];
    try{ window.issues = cache.issues; }catch(e){}
    return cache.issues;
  }
  function groupIssues(list){
    var groups={};
    list.forEach(function(i){
      var nm=issueName(i);
      var k=key(nm) || 'semnome';
      if(!groups[k]) groups[k]={name:nm, rows:[], active:false, priority:i.priority||'MEDIUM'};
      groups[k].rows.push(i);
      groups[k].active = groups[k].active || activeIssue(i);
      if(String(i.priority||'').toUpperCase()==='HIGH') groups[k].priority='HIGH';
    });
    return Object.keys(groups).map(function(k){ groups[k].key=k; return groups[k]; }).sort(function(a,b){return a.name.localeCompare(b.name,'pt-BR');});
  }
  function renderTipos(){
    var all = Array.isArray(cache.issues) ? cache.issues : [];
    var q = norm(id('gfTipoSearch') && id('gfTipoSearch').value || '');
    var mode = (id('gfTipoStatus') && id('gfTipoStatus').value) || 'ACTIVE';
    var groups = groupIssues(all).filter(function(g){
      if(mode==='ACTIVE' && !g.active) return false;
      if(mode==='INACTIVE' && g.active) return false;
      if(q && norm(g.name).indexOf(q)<0) return false;
      return true;
    });
    var totalGroups = groupIssues(all).length;
    var c=id('gfTipoCount'); if(c) c.textContent = groups.length+' de '+totalGroups+' problema(s) exibidos';
    var body=id('gfTipoBody'); if(!body) return;
    body.innerHTML = groups.length ? groups.map(problemGroupHtml).join('') : '<div class="gfCadEmpty">Nenhum problema encontrado neste filtro.</div>';
  }
  function linkedLists(rows){
    var eq=[], sv=[];
    rows.forEach(function(r){
      // Vínculo real: só entra no total quando a linha do vínculo está ativa.
      // Assim evitamos mostrar no detalhe itens que aparecem no cadastro, mas não estão marcados/ativos.
      if(!activeIssue(r)) return;
      var item=issueItem(r); if(!item) return;
      var row={name:item,id:r.id,priority:r.priority,active:true};
      if(itemKind(item)==='service') sv.push(row); else eq.push(row);
    });
    function uniq(arr){ var seen={}; return arr.filter(function(x){ var k=key(x.name); if(!k||seen[k]) return false; seen[k]=1; return true; }).sort(function(a,b){return a.name.localeCompare(b.name,'pt-BR');}); }
    return {equipamentos:uniq(eq), servicos:uniq(sv)};
  }
  function problemGroupHtml(g){
    var open=!!cache.expanded[g.key], l=linkedLists(g.rows);
    var badge = l.equipamentos.length + l.servicos.length;
    return '<div class="gfCadGroup gfProblemOnlyGroup">'+
      '<button class="gfCadGroupHead" type="button" data-gf-problem-toggle="'+esc(g.key)+'"><span class="gfCadPin">⚠️</span><span><b>'+esc(g.name)+'</b><small>'+(g.active?'Ativo':'Inativo')+'</small></span><em>'+badge+'</em><i>'+(open?'⌃':'⌄')+'</i></button>'+
      (open?'<div class="gfProblemInside">'+insideHtml(g,l)+'</div>':'')+
    '</div>';
  }
  function countBox(title,total,label){
    return '<div class="gfProblemInsideBox gfProblemCountBox"><h3>'+title+'</h3><strong>'+Number(total||0)+'</strong><p>'+label+'</p></div>';
  }
  function insideHtml(g,l){
    var first = g.rows[0] || {};
    return '<div class="gfProblemCounts">'+
      countBox('Equipamentos vinculados',l.equipamentos.length,'equipamento(s) marcado(s) neste problema')+
      countBox('Serviços vinculados',l.servicos.length,'serviço(s) marcado(s) neste problema')+
      '</div>'+
      '<div class="gfProblemHint">Para ver a lista completa e conferir quais itens estão marcados, use o botão Vincular equipamentos/serviços.</div>'+
      '<div class="gfProblemActions"><button class="gfCadPrimary adminOnly" type="button" onclick="gfTipoVincular(\''+esc(g.name)+'\')">Vincular equipamentos/serviços</button><button class="gfCadLight adminOnly" type="button" onclick="gfTipoEditar('+Number(first.id||0)+')">Editar</button><button class="'+(g.active?'gfCadDanger':'gfCadPrimary')+' adminOnly" type="button" onclick="gfTipoToggle(\''+esc(g.name)+'\','+(g.active?0:1)+')">'+(g.active?'Inativar':'Ativar')+'</button></div>';
  }
  window.gfTipoNovoProblema=function(){
    if(typeof window.toggleCadastroForm==='function') return window.toggleCadastroForm('issue');
    alert('Use Vincular dentro de um problema ou atualize o backend para criar problema sem vínculo inicial.');
    return false;
  };
  window.gfTipoEditar=function(idIssue){
    if(idIssue && typeof window.editIssue==='function') return window.editIssue(idIssue);
    alert('Abra um vínculo do problema para editar.');
    return false;
  };
  window.gfTipoVincular=function(nome){
    if(typeof window.toggleCadastroForm==='function') return window.toggleCadastroForm('issue');
    alert('Tela de vínculo indisponível neste arquivo.');
    return false;
  };
  window.gfTipoToggle=async function(nome, ativo){
    var rows=(cache.issues||[]).filter(function(i){return key(issueName(i))===key(nome);});
    if(!rows.length) return;
    if(!confirm((ativo?'Ativar':'Inativar')+' todos os vínculos do problema "'+nome+'"?')) return;
    for(var i=0;i<rows.length;i++){
      var r=rows[i];
      try{ await fetch(API_ROOT+'/api/admin/issues/'+r.id,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({asset_name:r.asset_name,name:issueName(r),priority:r.priority||'MEDIUM',active:!!ativo})}); }catch(e){}
    }
    cache.issues=null; await getIssues(true); renderTipos();
  };
  async function openTipos(){
    cache.module='problemas';
    showPageEl('pageCadastros'); setActive('navCadProblemas');
    var p=pageCad(); if(!p) return false;
    p.className=''; p.innerHTML=skeleton();
    var s=id('gfTipoSearch'), st=id('gfTipoStatus');
    if(s) s.addEventListener('input', renderTipos);
    if(st) st.addEventListener('change', renderTipos);
    await getIssues(false); renderTipos();
    return false;
  }
  document.addEventListener('click', function(ev){
    var t=ev.target;
    var tog=t && t.closest && t.closest('[data-gf-problem-toggle]');
    if(tog){ ev.preventDefault(); ev.stopPropagation(); if(ev.stopImmediatePropagation) ev.stopImmediatePropagation(); cache.expanded[tog.getAttribute('data-gf-problem-toggle')]=!cache.expanded[tog.getAttribute('data-gf-problem-toggle')]; renderTipos(); return false; }
    var btn=t && t.closest && t.closest('[data-gf-route],#navCadProblemas,#navCadEquipamentos,#navCadServicos,#navCadQrs,#tabDashboard,#tabOperacao,#navIaGuara,#tabUsuarios,#gfMobileBottomNav button');
    if(!btn) return;
    var route=btn.getAttribute('data-gf-route') || (btn.id==='navCadProblemas'?'problemas':btn.id==='navCadEquipamentos'?'equipamentos':btn.id==='navCadServicos'?'servicos':btn.id==='navCadQrs'?'qrs':btn.id==='tabDashboard'?'dashboard':btn.id==='tabOperacao'?'operacao':btn.id==='navIaGuara'?'ia':'usuarios');
    ev.preventDefault(); ev.stopPropagation(); if(ev.stopImmediatePropagation) ev.stopImmediatePropagation();
    setTimeout(function(){ openRoute(route); },0);
    return false;
  }, true);
  window.showPage=function(page){ return openRoute(page); };
  try{ showPage=window.showPage; }catch(e){}
  function injectCss(){
    if(id('gfTipoOnlyCss')) return;
    var st=document.createElement('style'); st.id='gfTipoOnlyCss';
    st.textContent='.gfTiposOnlyPage .gfCadCleanBody{max-width:860px!important}.gfTiposToolbar{grid-template-columns:minmax(220px,1fr) 260px auto!important}.gfProblemInside{padding:0 16px 16px 76px!important;display:grid!important;gap:12px!important}.gfProblemInsideBox{border:1px solid #dbe7f5!important;border-radius:16px!important;background:#f8fbff!important;padding:12px!important}.gfProblemInsideBox h3{margin:0 0 8px!important;color:#061747!important;font-size:15px!important}.gfProblemInsideBox p{margin:0!important;color:#65748c!important;font-weight:850!important}.gfProblemChips{display:flex!important;flex-wrap:wrap!important;gap:8px!important}.gfProblemChips span{background:#fff!important;border:1px solid #dbe7f5!important;border-radius:999px!important;padding:8px 10px!important;font-weight:900!important;color:#061747!important}.gfProblemActions{display:flex!important;gap:10px!important;flex-wrap:wrap!important}.gfProblemActions button{border:0!important;border-radius:13px!important;padding:11px 14px!important;font-weight:1000!important;cursor:pointer!important}@media(max-width:900px){.gfTiposToolbar{grid-template-columns:1fr!important}.gfProblemInside{padding:0 10px 12px 10px!important}.gfProblemActions button{width:100%!important}}';
    document.head.appendChild(st);
  }
  injectCss();
  var stabilize=0;
  var int=setInterval(function(){
    stabilize++;
    try{
      var p=pageCad();
      if(cache.module==='problemas' && p && !p.querySelector('#gfTipoBody')) openTipos();
    }catch(e){}
    if(stabilize>20) clearInterval(int);
  },250);
})();

/* =========================================================
   GUARÁ FIX - SERVIÇO SIMPLES (sem campos de equipamento)
   Ajuste final: ao criar Serviço mostra somente Setor, Nome e Departamento.
   ========================================================= */
(function(){
  'use strict';
  if(window.__GF_SERVICO_MODAL_SIMPLES_FINAL__) return;
  window.__GF_SERVICO_MODAL_SIMPLES_FINAL__ = true;

  var oldToggleCadastroForm = window.toggleCadastroForm;
  var oldCloseCadastroForm = window.closeCadastroForm;

  function api(){ return window.API || window.API_BASE || window.location.origin; }
  function byId(id){ return document.getElementById(id); }
  function isServicos(){ var p=byId('pageCadastros'); return !!(p && p.classList.contains('cadastro-show-servicos')); }
  function esc(v){ return String(v == null ? '' : v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];}); }
  function setores(){ return Array.isArray(window.sectors) ? window.sectors : []; }
  async function ensureSectors(){
    if(setores().length) return setores();
    try{
      var r = await fetch(api() + '/api/admin/sectors', {cache:'no-store'});
      var j = await r.json().catch(function(){return {};});
      if(Array.isArray(j.sectors)) window.sectors = j.sectors;
    }catch(e){}
    return setores();
  }
  function sectorOptions(list){
    list = Array.isArray(list) ? list : [];
    return list.map(function(s){ return '<option value="'+esc(s.id)+'">'+esc(s.name || s.display_name || s.sector_name || 'Setor')+'</option>'; }).join('');
  }
  function closeServicoModal(){
    var root = byId('gfServicoSimplesRoot');
    if(root) root.remove();
    document.body.classList.remove('gfServicoSimplesOpen');
  }
  window.closeServicoSimplesModal = closeServicoModal;

  async function openServicoModal(){
    try{ if(typeof oldCloseCadastroForm === 'function') oldCloseCadastroForm(); }catch(e){}
    closeServicoModal();
    var list = await ensureSectors();
    var root = document.createElement('div');
    root.id = 'gfServicoSimplesRoot';
    root.className = 'gfServicoSimplesRoot show';
    root.innerHTML = ''+
      '<div class="gfServicoSimplesBox" role="dialog" aria-modal="true">'+
        '<div class="gfServicoSimplesHead">'+
          '<div><h2>Novo serviço</h2><small>Informe apenas o necessário para cadastrar o serviço.</small></div>'+
          '<button type="button" class="gfServicoSimplesClose" onclick="closeServicoSimplesModal()">×</button>'+
        '</div>'+
        '<div class="gfServicoSimplesBody">'+
          '<label>Setor<select id="gfServicoSetor">'+sectorOptions(list)+'</select></label>'+
          '<label>Nome do serviço<input id="gfServicoNome" autocomplete="off" placeholder="Ex: LIMPEZA OPERACIONAL, MARCENARIA, INTERNET"></label>'+
          '<label>Departamento<select id="gfServicoDepartamento">'+
            '<option value="MANUTENCAO">🛠️ Manutenção</option>'+
            '<option value="APOIO">🤝 Apoio</option>'+
            '<option value="TI">💻 TI</option>'+
          '</select></label>'+
        '</div>'+
        '<div class="gfServicoSimplesFoot">'+
          '<button type="button" class="btn btnLight" onclick="closeServicoSimplesModal()">Cancelar</button>'+
          '<button type="button" class="btn btnDark" id="gfServicoSalvarBtn" onclick="salvarServicoSimples()">Salvar</button>'+
        '</div>'+
      '</div>';
    root.addEventListener('mousedown', function(e){ if(e.target === root) closeServicoModal(); });
    document.body.appendChild(root);
    document.body.classList.add('gfServicoSimplesOpen');
    setTimeout(function(){ var n=byId('gfServicoNome'); if(n) n.focus(); },80);
  }

  window.salvarServicoSimples = async function(){
    var nome = String((byId('gfServicoNome')||{}).value || '').trim();
    var setor = String((byId('gfServicoSetor')||{}).value || '').trim();
    var dep = String((byId('gfServicoDepartamento')||{}).value || 'MANUTENCAO').trim();
    if(!nome) return alert('Informe o nome do serviço.');
    if(!setor) return alert('Selecione o setor.');
    var btn = byId('gfServicoSalvarBtn');
    if(btn){ btn.disabled = true; btn.textContent = 'Salvando...'; }
    try{
      var body = {
        sector_id: setor,
        name: nome,
        patrimonio: '',
        brand: '',
        model: '',
        asset_kind: 'SERVICE',
        asset_department: dep,
        status: 'ACTIVE'
      };
      var r = await fetch(api() + '/api/admin/assets', {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify(body)
      });
      var j = await r.json().catch(function(){return {};});
      if(!r.ok || j.ok === false) throw new Error(j.error || 'Erro ao cadastrar serviço.');
      closeServicoModal();
      try{ if(typeof window.loadAssets === 'function') await window.loadAssets(true); }
      catch(e){ try{ if(typeof window.renderAssets === 'function') window.renderAssets(); }catch(_){} }
      try{ if(typeof window.toast === 'function') window.toast('Serviço cadastrado.'); else if(typeof window.toastMsg === 'function') window.toastMsg('Serviço cadastrado.'); }catch(e){}
    }catch(err){
      alert(err.message || 'Erro ao cadastrar serviço.');
    }finally{
      if(btn){ btn.disabled = false; btn.textContent = 'Salvar'; }
    }
  };

  window.toggleCadastroForm = function(which){
    if(isServicos() && (which === 'asset' || which === 'service' || !which)) return openServicoModal();
    return typeof oldToggleCadastroForm === 'function' ? oldToggleCadastroForm(which) : null;
  };
  window.closeCadastroForm = function(){
    closeServicoModal();
    return typeof oldCloseCadastroForm === 'function' ? oldCloseCadastroForm() : null;
  };
})();

/* =========================================================
   GF_FINAL_CLEAN_NAV_TIPOS_20260622
   - Uma navegação única: PC sidebar direta / celular barra inferior
   - Remove submenu/menus duplicados de Cadastros
   - Tipos de problema: tela principal mostra só problemas
   - Equipamentos e serviços aparecem somente ao expandir o problema
   ========================================================= */
(function(){
  'use strict';
  if(window.__GF_FINAL_CLEAN_NAV_TIPOS_20260622__) return;
  window.__GF_FINAL_CLEAN_NAV_TIPOS_20260622__ = true;

  var API_ROOT = window.API || window.API_BASE || window.location.origin;
  var baseShowPage = (typeof window.showPage === 'function') ? window.showPage.bind(window) : null;
  var tipoCache = { loaded:false, issues:[], expanded:{} };

  function id(x){ return document.getElementById(x); }
  function qs(s){ return document.querySelector(s); }
  function qsa(s){ return Array.prototype.slice.call(document.querySelectorAll(s)); }
  function esc(v){ return String(v == null ? '' : v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];}); }
  function norm(v){ return String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim(); }
  function slug(v){ return norm(v).replace(/[^a-z0-9]+/g,''); }
  function activeRow(r){ return Number(r && r.active == null ? 1 : r.active) === 1; }
  function issueName(r){ return String((r && (r.name || r.issue_type || r.problem_name || r.problem)) || 'SEM NOME').trim().toUpperCase() || 'SEM NOME'; }
  function itemName(r){ return String((r && (r.asset_name || r.item_name || r.service_name || r.asset || r.service)) || '').trim(); }
  function isServiceRow(r){
    var k = String((r && (r.asset_kind || r.kind || r.type)) || '').toUpperCase();
    if(k === 'SERVICE' || k === 'SERVICO' || k === 'SERVIÇO') return true;
    if(r && (r.service_id || r.service_name || r.service_key)) return true;
    return false;
  }
  function routeNorm(route){
    route = norm(route).replace(/\s+/g,'');
    if(['consulta','operacao','central','pesquisa'].indexOf(route)>=0) return 'operacao';
    if(['qr','qrs','qrcode','qrcodes','qrcodesesetores'].indexOf(route)>=0) return 'qrs';
    if(['equipamento','equipamentos','patrimonio','patrimonios','assets'].indexOf(route)>=0) return 'equipamentos';
    if(['servico','servicos','serviços','services'].indexOf(route)>=0) return 'servicos';
    if(['tipo','tipos','problema','problemas','tiposdeproblema','issues'].indexOf(route)>=0) return 'problemas';
    if(['ia','iaanalytics','analytics'].indexOf(route)>=0) return 'ia';
    if(['config','configuracao','configuracoes','configurações','usuarios'].indexOf(route)>=0) return 'usuarios';
    return route || 'dashboard';
  }

  var NAV = [
    ['dashboard','📊','Dashboard','tabDashboard'],
    ['operacao','🔎','Consulta','tabOperacao'],
    ['qrs','▦','QR Codes e Setores','navCadQrs'],
    ['equipamentos','🧰','Equipamentos / Patrimônios','navCadEquipamentos'],
    ['servicos','🧩','Serviços','navCadServicos'],
    ['problemas','⚠️','Tipos de problema','navCadProblemas'],
    ['ia','🤖','IA Analytics','navIaGuara'],
    ['usuarios','⚙️','Configurações','tabUsuarios']
  ];

  function injectFinalCss(){
    var old=id('gfFinalCleanNavTiposCss'); if(old) old.remove();
    var st=document.createElement('style'); st.id='gfFinalCleanNavTiposCss';
    st.textContent = [
      '#tabCadastros,#gfCadastrosSub,.gfSideSub,.gfSideParent{display:none!important;visibility:hidden!important;opacity:0!important;pointer-events:none!important}',
      '.gfSideMenu{display:flex!important;flex-direction:column!important;gap:10px!important}',
      '.gfSideMenu .gfSideItem{width:100%!important}',
      '.gfTipoFinalPage{box-sizing:border-box!important;width:100%!important;max-width:1500px!important;margin:0 auto!important;background:#fff!important;border:1px solid #dbe7f5!important;border-radius:28px!important;padding:24px!important;box-shadow:0 18px 50px rgba(11,44,80,.07)!important}',
      '.gfTipoFinalHead{display:flex!important;align-items:center!important;justify-content:space-between!important;gap:16px!important;border-bottom:1px solid #dbe7f5!important;padding-bottom:18px!important;margin-bottom:18px!important}',
      '.gfTipoFinalTitle{display:flex!important;align-items:center!important;gap:14px!important}.gfTipoFinalIcon{width:58px!important;height:58px!important;border-radius:16px!important;background:#eafff3!important;border:1px solid #bcf0d5!important;display:grid!important;place-items:center!important;font-size:28px!important;flex:0 0 58px!important}',
      '.gfTipoFinalTitle h1{margin:0!important;font-size:30px!important;color:#061747!important;line-height:1.05!important}.gfTipoFinalTitle p{margin:6px 0 0!important;color:#52627a!important;font-weight:900!important}',
      '.gfTipoFinalNew{border:0!important;border-radius:16px!important;background:#16a05a!important;color:#fff!important;padding:15px 20px!important;font-weight:1000!important;box-shadow:0 14px 30px rgba(22,160,90,.22)!important;cursor:pointer!important}',
      '.gfTipoFinalToolbar{display:grid!important;grid-template-columns:minmax(240px,1fr) 240px auto!important;gap:12px!important;align-items:center!important;margin:0 0 16px!important}.gfTipoFinalToolbar input,.gfTipoFinalToolbar select{height:46px!important;border:1px solid #dbe7f5!important;border-radius:14px!important;padding:0 14px!important;font-weight:900!important;color:#061747!important;background:#fff!important;outline:none!important}.gfTipoFinalToolbar strong{font-weight:1000!important;color:#061747!important}',
      '.gfTipoFinalBody{display:grid!important;gap:12px!important;max-width:900px!important}.gfTipoGroup{border:1px solid #dbe7f5!important;border-radius:18px!important;background:#fff!important;overflow:hidden!important}.gfTipoGroupHead{width:100%!important;border:0!important;background:#fff!important;padding:14px 16px!important;display:grid!important;grid-template-columns:52px 1fr 54px 24px!important;align-items:center!important;gap:14px!important;text-align:left!important;cursor:pointer!important;color:#061747!important}.gfTipoGroupHead .ico{width:48px!important;height:48px!important;border-radius:14px!important;background:#eafff3!important;border:1px solid #bcf0d5!important;display:grid!important;place-items:center!important;font-size:22px!important}.gfTipoGroupHead b{display:block!important;font-size:23px!important;line-height:1.1!important;color:#061747!important}.gfTipoGroupHead small{display:block!important;margin-top:5px!important;color:#52627a!important;font-weight:900!important}.gfTipoGroupHead em{width:46px!important;height:46px!important;border-radius:50%!important;background:#13b66b!important;color:#fff!important;font-style:normal!important;display:grid!important;place-items:center!important;font-weight:1000!important;font-size:17px!important}.gfTipoInside{border-top:1px solid #e4edf8!important;background:#f8fbff!important;padding:14px 16px 16px 82px!important;display:grid!important;gap:12px!important}.gfTipoBox{background:#fff!important;border:1px solid #dbe7f5!important;border-radius:15px!important;padding:12px!important}.gfTipoBox h3{margin:0 0 10px!important;color:#061747!important;font-size:15px!important}.gfTipoBox p{margin:0!important;color:#64748b!important;font-weight:900!important}.gfTipoChips{display:flex!important;flex-wrap:wrap!important;gap:8px!important}.gfTipoChips span{background:#fff!important;border:1px solid #dbe7f5!important;border-radius:999px!important;padding:8px 11px!important;color:#061747!important;font-weight:900!important}.gfTipoActions{display:flex!important;gap:10px!important;flex-wrap:wrap!important}.gfTipoActions button{border:0!important;border-radius:13px!important;padding:11px 14px!important;font-weight:1000!important;cursor:pointer!important}.gfTipoPrimary{background:#16a05a!important;color:#fff!important}.gfTipoLight{background:#fff!important;color:#061747!important;border:1px solid #dbe7f5!important}.gfTipoDanger{background:#ef4444!important;color:#fff!important}',
      '@media(min-width:901px){#gfMobileBottomNav{display:none!important}.gfSideNav{display:block!important}}',
      '@media(max-width:900px){html,body{overflow-x:hidden!important}body.gf-sidebar-ready .gfSideNav,.gfSideNav{display:none!important}body.gf-sidebar-ready .gfMainWrap,.gfMainWrap,.wrap.gfMainWrap{margin-left:0!important;width:100%!important;max-width:100%!important;padding:10px 10px 100px!important;box-sizing:border-box!important}.gfTipoFinalPage{border-radius:20px!important;padding:14px!important}.gfTipoFinalHead{align-items:flex-start!important}.gfTipoFinalTitle h1{font-size:22px!important}.gfTipoFinalIcon{width:48px!important;height:48px!important;flex-basis:48px!important}.gfTipoFinalNew{padding:12px 13px!important;font-size:13px!important}.gfTipoFinalToolbar{grid-template-columns:1fr!important}.gfTipoFinalToolbar input,.gfTipoFinalToolbar select{width:100%!important}.gfTipoFinalBody{max-width:none!important}.gfTipoGroupHead{grid-template-columns:44px 1fr 44px 18px!important;padding:12px!important;gap:10px!important}.gfTipoGroupHead .ico{width:40px!important;height:40px!important}.gfTipoGroupHead b{font-size:18px!important}.gfTipoGroupHead em{width:40px!important;height:40px!important}.gfTipoInside{padding:12px!important}.gfTipoActions button{width:100%!important}#gfMobileBottomNav{position:fixed!important;left:8px!important;right:8px!important;bottom:8px!important;height:76px!important;padding:7px!important;border-radius:22px!important;background:rgba(255,255,255,.98)!important;border:1px solid #dbe7f5!important;box-shadow:0 18px 44px rgba(13,60,110,.25)!important;z-index:2147483600!important;display:none!important;gap:4px!important;overflow-x:auto!important;visibility:visible!important;opacity:1!important;pointer-events:auto!important}#gfMobileBottomNav button{min-width:64px!important;flex:1 0 64px!important;border:0!important;border-radius:16px!important;background:transparent!important;color:#52627a!important;font-size:11px!important;font-weight:1000!important;display:flex!important;flex-direction:column!important;align-items:center!important;justify-content:center!important;gap:2px!important;touch-action:manipulation!important}#gfMobileBottomNav button .ico{font-size:22px!important;line-height:1!important}#gfMobileBottomNav button.active{background:linear-gradient(135deg,#1976d2,#0f5ead)!important;color:#fff!important}}'
    ].join('\n');
    document.head.appendChild(st);
  }

  function normalizeSidebar(){
    injectFinalCss();
    document.body.classList.add('gf-sidebar-ready');
    document.body.classList.remove('gf-cad-sub-open');
    qsa('#tabCadastros,#gfCadastrosSub,.gfSideSub,.gfSideParent').forEach(function(el){ try{ el.remove(); }catch(e){} });
    var menu=qs('.gfSideMenu');
    if(menu){
      var html = NAV.map(function(n){ return '<button class="tab gfSideItem" id="'+n[3]+'" type="button" data-gf-final-route="'+n[0]+'"><span>'+n[1]+'</span><b>'+esc(n[2])+'</b></button>'; }).join('');
      if(menu.getAttribute('data-gf-final-menu') !== '1' || menu.children.length !== NAV.length){
        menu.innerHTML = html;
        menu.setAttribute('data-gf-final-menu','1');
      }
    }
    buildMobileNav();
  }

  function buildMobileNav(){ var n=document.getElementById('gfMobileBottomNav'); if(n) n.remove(); return; }

  function setActive(route){
    route=routeNorm(route);
    var idMap={dashboard:'tabDashboard',operacao:'tabOperacao',qrs:'navCadQrs',equipamentos:'navCadEquipamentos',servicos:'navCadServicos',problemas:'navCadProblemas',ia:'navIaGuara',usuarios:'tabUsuarios'};
    qsa('.gfSideItem,#gfMobileBottomNav button,.tab').forEach(function(el){ el.classList.remove('active'); });
    var b=id(idMap[route]); if(b) b.classList.add('active');
    qsa('#gfMobileBottomNav button').forEach(function(btn){ btn.classList.toggle('active', btn.getAttribute('data-gf-final-route')===route); });
  }

  function hideAllPages(){
    qsa('.gfMainWrap > section[id^="page"], section[id^="page"]').forEach(function(s){ s.classList.add('hidden'); s.setAttribute('aria-hidden','true'); });
  }
  function showPageEl(pid){
    hideAllPages();
    var p=id(pid); if(p){ p.classList.remove('hidden'); p.removeAttribute('aria-hidden'); p.style.display=''; }
    try{ window.scrollTo({top:0,left:0,behavior:'auto'}); }catch(e){ window.scrollTo(0,0); }
  }

  function groupIssues(rows){
    var map={};
    rows.forEach(function(r){
      var nm=issueName(r), k=slug(nm)||'semnome';
      if(!map[k]) map[k]={key:k,name:nm,rows:[],active:false};
      map[k].rows.push(r);
      if(activeRow(r)) map[k].active=true;
    });
    return Object.keys(map).map(function(k){return map[k];}).sort(function(a,b){return a.name.localeCompare(b.name,'pt-BR');});
  }
  function linkedFor(g){
    var eq=[], sv=[], seenEq={}, seenSv={};
    g.rows.forEach(function(r){
      var nm=itemName(r); if(!nm) return;
      var k=slug(nm); if(!k) return;
      if(isServiceRow(r)){ if(!seenSv[k]){ seenSv[k]=1; sv.push(nm); } }
      else { if(!seenEq[k]){ seenEq[k]=1; eq.push(nm); } }
    });
    eq.sort(function(a,b){return a.localeCompare(b,'pt-BR');});
    sv.sort(function(a,b){return a.localeCompare(b,'pt-BR');});
    return {eq:eq,sv:sv};
  }
  function chips(title, arr, empty){
    return '<div class="gfTipoBox"><h3>'+title+'</h3>'+(arr.length?'<div class="gfTipoChips">'+arr.map(function(x){return '<span>'+esc(x)+'</span>';}).join('')+'</div>':'<p>'+empty+'</p>')+'</div>';
  }
  function groupHtml(g){
    var l=linksFor(g), first=g.rows[0]||{}, total=l.total || 0;
    return '<div class="gfUtGroup" data-gf-problema-card="'+esc(g.key)+'">'+
      '<span class="ico">⚠️</span>'+
      '<span><b>'+esc(g.name)+'</b><small>'+(g.active?'Ativo':'Inativo')+'</small></span>'+
      '<div class="gfUtCounts"><span class="gfUtCountPill total">'+total+' vínculo'+(total===1?'':'s')+'</span><span class="gfUtCountPill">'+l.eq.length+' equipamento'+(l.eq.length===1?'':'s')+'</span><span class="gfUtCountPill">'+l.sv.length+' serviço'+(l.sv.length===1?'':'s')+'</span></div>'+
      '<div class="gfUtActions"><button class="gfUtPrimary" type="button" data-gf-ut-action="vincular" data-id="'+Number(first.id||0)+'" data-name="'+esc(g.name)+'">Vincular</button><button class="gfUtLight" type="button" data-gf-ut-action="editar" data-id="'+Number(first.id||0)+'">Editar</button><button class="'+(g.active?'gfUtDanger':'gfUtPrimary')+'" type="button" data-gf-ut-action="toggle" data-id="'+Number(first.id||0)+'" data-name="'+esc(g.name)+'" data-active="'+(g.active?0:1)+'">'+(g.active?'Inativar':'Ativar')+'</button></div>'+
    '</div>';
  }
  function renderTipos(){
    var allGroups=groupIssues(cache.issues||[]);
    var q=norm(id('gfUtSearch') && id('gfUtSearch').value || '');
    var status=(id('gfUtStatus') && id('gfUtStatus').value) || 'ACTIVE';
    var groups=allGroups.filter(function(g){
      if(status==='ACTIVE' && !g.active) return false;
      if(status==='INACTIVE' && g.active) return false;
      if(q && norm(g.name).indexOf(q)<0) return false;
      return true;
    });
    var c=id('gfUtCount'); if(c)c.textContent=groups.length+' de '+allGroups.length+' problema(s) exibidos';
    var b=id('gfUtBody'); if(b)b.innerHTML=groups.length?groups.map(groupHtml).join(''):'<div class="gfCadEmpty">Nenhum problema encontrado.</div>';
  }
  async function openTipos(){
    buildSidebar(); setActive('problemas'); cache.current='problemas';
    var p=showPageContainer('pageCadastros');
    if(!p) return false;
    p.innerHTML='<div class="gfUltimateTipos"><div class="gfUtHead"><div class="gfUtTitle"><span class="gfUtIcon">⚠️</span><div><h1>Tipos de problema</h1><p>Mostra somente os problemas. Equipamentos e serviços ficam dentro de cada problema.</p></div></div><button class="gfUtNew adminOnly" type="button" data-gf-ut-new="1">+ Novo problema</button></div><div class="gfUtToolbar"><input id="gfUtSearch" placeholder="Buscar problema..." autocomplete="off"><select id="gfUtStatus"><option value="ACTIVE">Ativos</option><option value="INACTIVE">Inativos</option><option value="ALL">Todos</option></select><strong id="gfUtCount">Carregando...</strong></div><div class="gfUtBody" id="gfUtBody"><div class="gfCadEmpty">Carregando...</div></div></div>';
    var s=id('gfUtSearch'), st=id('gfUtStatus');
    if(s) s.addEventListener('input', renderTipos);
    if(st) st.addEventListener('change', renderTipos);
    await fetchIssues(false); renderTipos();
    return false;
  }

  function ensureModal(){
    if(id('gfUtModalBg')) return;
    document.body.insertAdjacentHTML('beforeend','<div class="gfUtModalBg" id="gfUtModalBg"></div><div class="gfUtModal" id="gfUtModal"><button class="gfUtClose" type="button" data-gf-ut-close="1">×</button><h2>Novo problema</h2><p>Crie o problema. Depois abra ele para vincular equipamentos e serviços.</p><label>Nome do problema<input id="gfUtNewName" placeholder="Ex: LÂMPADA, INTERNET, DEFEITO"></label><label>Status<select id="gfUtNewStatus"><option value="1">Ativo</option><option value="0">Inativo</option></select></label><div class="gfUtModalFoot"><button class="gfUtLight" type="button" data-gf-ut-close="1">Cancelar</button><button class="gfUtPrimary" type="button" data-gf-ut-save="1">Salvar</button></div></div>');
  }
  function openModal(){ ensureModal(); id('gfUtModalBg').classList.add('show'); id('gfUtModal').classList.add('show'); setTimeout(function(){var n=id('gfUtNewName'); if(n)n.focus();},50); }
  function closeModal(){ var b=id('gfUtModalBg'), m=id('gfUtModal'); if(b)b.classList.remove('show'); if(m)m.classList.remove('show'); }
  async function saveNewProblem(){
    var name=String(id('gfUtNewName') && id('gfUtNewName').value || '').trim().toUpperCase();
    if(!name){ alert('Informe o nome do problema.'); return; }
    var active=String(id('gfUtNewStatus') && id('gfUtNewStatus').value || '1')==='1';
    var btn=qs('[data-gf-ut-save]'); if(btn){btn.disabled=true;btn.textContent='Salvando...';}
    try{
      var body={name:name,issue_type:name,asset_name:'GERAL',priority:'MEDIUM',active:active};
      var j=await fetch(API_ROOT+'/api/admin/issues',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}).then(function(r){return r.json().then(function(x){ if(!r.ok || x.ok===false) throw new Error(x.error||x.message||'Erro ao salvar'); return x;});});
      closeModal(); cache.issues=null; await fetchIssues(true); renderTipos(); toast('Problema cadastrado');
    }catch(e){ alert(e.message || 'Erro ao salvar problema.'); }
    finally{ if(btn){btn.disabled=false;btn.textContent='Salvar';} }
  }
  function openCadastroRoute(route){
    route=routeNorm(route);
    buildSidebar(); setActive(route); cache.current=route;
    if(route==='problemas') return openTipos();
    if(route==='equipamentos' || route==='servicos'){
      if(typeof window.openCadastroModule==='function'){ window.openCadastroModule(route); setActive(route); return false; }
      if(typeof window.gfOpenCadastroSideModule==='function'){ window.gfOpenCadastroSideModule(route); setActive(route); return false; }
    }
    if(route==='qrs'){
      if(originalShowPage){ try{ originalShowPage('qrs'); }catch(e){ showPageContainer('pageQrs'); } } else showPageContainer('pageQrs');
      setActive(route); return false;
    }
    var base={dashboard:'dashboard',operacao:'operacao',ia:'ia',usuarios:'usuarios'}[route] || 'dashboard';
    if(originalShowPage){ try{ originalShowPage(base); }catch(e){ showPageContainer('page'+base.charAt(0).toUpperCase()+base.slice(1)); } }
    else showPageContainer('page'+base.charAt(0).toUpperCase()+base.slice(1));
    setActive(route); return false;
  }

  window.gfUltimateOpenRoute = openCadastroRoute;
  window.gfOpenCadastroDireto = openCadastroRoute;
  window.gfOpenCadastroFinal = openCadastroRoute;
  window.showPage = function(page){ return openCadastroRoute(page); };
  try{ showPage = window.showPage; }catch(e){}

  function handleNavEvent(ev){
    var t=ev.target;
    if(!t || !t.closest) return;
    var close=t.closest('[data-gf-ut-close]'); if(close){ ev.preventDefault(); ev.stopPropagation(); ev.stopImmediatePropagation(); closeModal(); return false; }
    var save=t.closest('[data-gf-ut-save]'); if(save){ ev.preventDefault(); ev.stopPropagation(); ev.stopImmediatePropagation(); saveNewProblem(); return false; }
    var newb=t.closest('[data-gf-ut-new]'); if(newb){ ev.preventDefault(); ev.stopPropagation(); ev.stopImmediatePropagation(); openModal(); return false; }
    // Sem accordion em Tipos: botões ficam direto no card.
    var action=t.closest('[data-gf-ut-action]');
    if(action){
      ev.preventDefault(); ev.stopPropagation(); ev.stopImmediatePropagation();
      var a=action.getAttribute('data-gf-ut-action');
      if(a==='vincular'){ var iid=Number(action.getAttribute('data-id')||0); if(iid && typeof window.openIssueSectorDrawer==='function') return window.openIssueSectorDrawer(iid); if(typeof window.toggleCadastroForm==='function') return window.toggleCadastroForm('issue'); alert('Vinculação ainda não disponível neste arquivo.'); return false; }
      if(a==='editar'){ var iid=Number(action.getAttribute('data-id')||0); if(iid && typeof window.editIssue==='function') return window.editIssue(iid); return false; }
      if(a==='toggle'){ var iid=Number(action.getAttribute('data-id')||0); var ativo=Number(action.getAttribute('data-active')||0); if(iid && typeof window.toggleIssueActive==='function') return window.toggleIssueActive(iid,ativo); if(iid && typeof window.toggleIssue==='function') return window.toggleIssue(iid,ativo); alert('Ação de ativar/inativar não encontrada neste arquivo.'); return false; }
    }
    var btn=t.closest('[data-gf-ultimate-route],#tabDashboard,#tabOperacao,#navCadQrs,#navCadEquipamentos,#navCadServicos,#navCadProblemas,#navIaGuara,#tabUsuarios');
    if(btn){
      var route=btn.getAttribute('data-gf-ultimate-route') || (btn.id==='tabDashboard'?'dashboard':btn.id==='tabOperacao'?'operacao':btn.id==='navCadQrs'?'qrs':btn.id==='navCadEquipamentos'?'equipamentos':btn.id==='navCadServicos'?'servicos':btn.id==='navCadProblemas'?'problemas':btn.id==='navIaGuara'?'ia':'usuarios');
      ev.preventDefault(); ev.stopPropagation(); ev.stopImmediatePropagation();
      openCadastroRoute(route); return false;
    }
  }

  // WINDOW capture roda antes dos listeners antigos no document.
  window.addEventListener('click', handleNavEvent, true);
  // Navegação só por clique real; touchend removido para não abrir ao deslizar no celular.
  window.addEventListener('keydown', function(ev){
    if(ev.key !== 'Enter' && ev.key !== ' ') return;
    handleNavEvent(ev);
  }, true);


  // Proteção mobile: deslizar na barra de módulos não navega. Só clique/tap real abre.
  (function(){
    var sx=0, sy=0, moved=false;
    window.addEventListener('touchstart', function(ev){
      var t=ev.target && ev.target.closest && ev.target.closest('#gfUltimateMobileNav,[data-gf-ultimate-route]');
      if(!t) return;
      var p=ev.touches && ev.touches[0]; if(!p) return;
      sx=p.clientX; sy=p.clientY; moved=false;
    }, true);
    window.addEventListener('touchmove', function(ev){
      var t=ev.target && ev.target.closest && ev.target.closest('#gfUltimateMobileNav,[data-gf-ultimate-route]');
      if(!t) return;
      var p=ev.touches && ev.touches[0]; if(!p) return;
      if(Math.abs(p.clientX-sx)>10 || Math.abs(p.clientY-sy)>10) moved=true;
    }, true);
    window.addEventListener('touchend', function(ev){
      var t=ev.target && ev.target.closest && ev.target.closest('#gfUltimateMobileNav,[data-gf-ultimate-route]');
      if(!t) return;
      if(moved){ ev.stopImmediatePropagation(); ev.stopPropagation(); return; }
    }, true);
  })();

  function boot(){
    buildSidebar();
    // Se a tela antiga de Tipos aparecer, troca imediatamente para a tela final.
    var visibleText='';
    try{ var pc=id('pageCadastros'); visibleText=pc && !pc.classList.contains('hidden') ? pc.textContent : ''; }catch(e){}
    if(/Tipos de problema/i.test(visibleText) && /Todos itens|problemas exibidos no QR|AQUÁRIO|BALANÇA/i.test(visibleText)){
      openTipos();
    }
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', boot, {once:true}); else boot();
  window.addEventListener('load', function(){ boot(); setTimeout(boot,150); setTimeout(boot,800); }, {passive:true});
  window.addEventListener('pageshow', function(){ setTimeout(boot,0); }, {passive:true});
  window.addEventListener('resize', function(){ setTimeout(buildSidebar,100); }, {passive:true});
})();

/* =========================================================
   GUARÁ FIX FINAL — Tipos sem seta + navegação mobile clique real
   - Não mostra lista interna no card de problema
   - Botões ficam sempre visíveis
   - Mostra quantidade de vínculos: total / equipamentos / serviços
   - Mobile usa UMA barra nova, sem touchend para não abrir ao deslizar
   ========================================================= */
(function(){
  'use strict';
  var API_ROOT = window.location.origin;
  var NAV=[
    ['dashboard','📊','Painel'],['operacao','🔎','Consulta'],['qrs','▦','QR'],['equipamentos','🧰','Equip.'],['servicos','🧩','Serv.'],['problemas','⚠️','Tipos'],['ia','🤖','IA'],['usuarios','⚙️','Config.']
  ];
  var state={issues:null, route:null, touchMoved:false, sx:0, sy:0};
  function $(id){return document.getElementById(id)}
  function qsa(sel,root){return Array.prototype.slice.call((root||document).querySelectorAll(sel))}
  function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
  function norm(v){return String(v||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim()}
  function slug(v){return norm(v).replace(/[^a-z0-9]+/g,'').trim()}
  function routeNorm(r){
    r=slug(r);
    if(['dashboard','painel'].includes(r))return'dashboard';
    if(['consulta','operacao','central'].includes(r))return'operacao';
    if(['qr','qrs','qrcode','qrcodes','qrcodesesetores'].includes(r))return'qrs';
    if(['equipamento','equipamentos','patrimonio','patrimonios','assets'].includes(r))return'equipamentos';
    if(['servico','servicos','services'].includes(r))return'servicos';
    if(['tipo','tipos','problema','problemas','tiposdeproblema','issues'].includes(r))return'problemas';
    if(['ia','analytics','iaanalytics'].includes(r))return'ia';
    if(['config','configuracao','configuracoes','usuarios'].includes(r))return'usuarios';
    return r||'dashboard';
  }
  function issueName(r){return String((r&&(r.name||r.issue_type||r.problem_name||r.problem||r.issue_name))||'SEM NOME').trim().toUpperCase()||'SEM NOME'}
  function itemName(r){return String((r&&(r.asset_name||r.item_name||r.service_name||r.asset||r.service))||'').trim()}
  function isGenericItem(v){var s=slug(v); return !s || ['geral','semitem','semnome','nenhum','null','undefined'].includes(s)}
  function isActive(r){return Number(r && r.active==null ? 1 : r.active)===1}
  function isServiceRow(r){
    var k=String((r&&(r.asset_kind||r.kind||r.type||r.item_type))||'').toUpperCase();
    if(k==='SERVICE'||k==='SERVICO'||k==='SERVIÇO')return true;
    if(r && (r.service_id||r.service_key||r.service_name))return true;
    return false;
  }
  function toast(msg){try{ if(typeof window.toastMsg==='function') return window.toastMsg(msg); }catch(e){} alert(msg);}
  function ensureCss(){
    if($('gfFinalNoAccordionCss')) return;
    var st=document.createElement('style'); st.id='gfFinalNoAccordionCss';
    st.textContent=`
      #gfMobileBottomNav,#gfUltimateMobileNav{display:none!important;visibility:hidden!important;pointer-events:none!important}
      #tabCadastros,#gfCadastrosSub,.gfSideSub,.gfSideParent{display:none!important}
      .gfFinalTipos{box-sizing:border-box;width:100%;max-width:1500px;margin:0 auto;background:#fff;border:1px solid #dbe7f5;border-radius:28px;padding:24px;box-shadow:0 18px 50px rgba(11,44,80,.07)}
      .gfFinalHead{display:flex;align-items:center;justify-content:space-between;gap:16px;border-bottom:1px solid #dbe7f5;padding-bottom:18px;margin-bottom:18px}.gfFinalTitle{display:flex;align-items:center;gap:14px}.gfFinalIcon{width:58px;height:58px;border-radius:16px;background:#eafff3;border:1px solid #bcf0d5;display:grid;place-items:center;font-size:28px;flex:0 0 58px}.gfFinalTitle h1{margin:0;font-size:30px;color:#061747;line-height:1.05}.gfFinalTitle p{margin:6px 0 0;color:#52627a;font-weight:900}.gfFinalNew{border:0;border-radius:16px;background:#16a05a;color:#fff;padding:15px 20px;font-weight:1000;box-shadow:0 14px 30px rgba(22,160,90,.22);cursor:pointer}
      .gfFinalToolbar{display:grid;grid-template-columns:minmax(240px,1fr) 230px auto;gap:12px;align-items:center;margin-bottom:16px}.gfFinalToolbar input,.gfFinalToolbar select{height:46px;border:1px solid #dbe7f5;border-radius:14px;padding:0 14px;font-weight:900;color:#061747;background:#fff;outline:none}.gfFinalToolbar strong{font-weight:1000;color:#061747;white-space:nowrap}
      .gfFinalBody{display:grid;gap:12px;max-width:1120px}.gfFinalCard{border:1px solid #dbe7f5;border-radius:18px;background:#fff;display:grid;grid-template-columns:52px minmax(0,1fr) auto auto;align-items:center;gap:14px;padding:14px 16px;color:#061747}.gfFinalCardIcon{width:48px;height:48px;border-radius:14px;background:#eafff3;border:1px solid #bcf0d5;display:grid;place-items:center;font-size:22px}.gfFinalCardName b{display:block;font-size:23px;line-height:1.1;color:#061747}.gfFinalCardName small{display:block;margin-top:5px;color:#52627a;font-weight:900}.gfFinalCounts{display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end}.gfFinalPill{border-radius:999px;padding:8px 11px;background:#eef6ff;border:1px solid #dbeafe;color:#0b3a78;font-weight:1000;font-size:12px;white-space:nowrap}.gfFinalPill.total{background:#dcfce7;border-color:#bbf7d0;color:#15803d}.gfFinalActions{display:flex;gap:8px;flex-wrap:nowrap;justify-content:flex-end}.gfFinalActions button{border:0;border-radius:13px;padding:11px 14px;font-weight:1000;cursor:pointer;white-space:nowrap}.gfFinalPrimary{background:#16a05a;color:#fff}.gfFinalLight{background:#fff;color:#061747;border:1px solid #dbe7f5!important}.gfFinalDanger{background:#ef4444;color:#fff}.gfFinalEmpty{border:1px dashed #cbd8e8;border-radius:18px;padding:20px;text-align:center;color:#52627a;font-weight:1000;background:#fbfdff}
      .gfFinalModalBg{position:fixed;inset:0;background:rgba(2,13,30,.48);z-index:2147483640;display:none}.gfFinalModal{position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);width:min(520px,calc(100vw - 24px));background:#fff;border-radius:22px;z-index:2147483641;padding:22px;box-shadow:0 24px 70px rgba(0,0,0,.25);display:none}.gfFinalModal.show,.gfFinalModalBg.show{display:block}.gfFinalModal h2{margin:0 0 6px;color:#061747}.gfFinalModal p{margin:0 0 14px;color:#52627a;font-weight:800}.gfFinalModal label{display:grid;gap:7px;font-weight:1000;color:#061747;margin:12px 0}.gfFinalModal input,.gfFinalModal select{height:48px;border:1px solid #dbe7f5;border-radius:14px;padding:0 12px;font-weight:900}.gfFinalModalFoot{display:flex;justify-content:flex-end;gap:10px;margin-top:16px}.gfFinalClose{float:right;border:0;border-radius:12px;width:42px;height:42px;font-size:24px;font-weight:1000;cursor:pointer}
      #gfOneMobileNav{display:none}
      @media(max-width:900px){html,body{overflow-x:hidden!important}.gfSideNav{display:none!important}.gfMainWrap,.wrap.gfMainWrap{margin-left:0!important;width:100%!important;max-width:100%!important;padding:10px 10px 96px!important;box-sizing:border-box!important}.gfFinalTipos{border-radius:20px;padding:14px}.gfFinalHead{align-items:flex-start}.gfFinalTitle h1{font-size:22px}.gfFinalIcon{width:48px;height:48px;flex-basis:48px}.gfFinalNew{padding:12px 13px;font-size:13px}.gfFinalToolbar{grid-template-columns:1fr}.gfFinalBody{max-width:none}.gfFinalCard{grid-template-columns:44px minmax(0,1fr);padding:12px;gap:10px}.gfFinalCardIcon{width:40px;height:40px}.gfFinalCardName b{font-size:18px}.gfFinalCounts{grid-column:1/-1;justify-content:flex-start}.gfFinalActions{grid-column:1/-1;width:100%;display:grid;grid-template-columns:1fr 1fr 1fr}.gfFinalActions button{width:100%;padding:11px 8px;font-size:12px}#gfOneMobileNav{position:fixed!important;left:8px!important;right:8px!important;bottom:8px!important;height:76px!important;padding:7px!important;border-radius:22px!important;background:rgba(255,255,255,.98)!important;border:1px solid #dbe7f5!important;box-shadow:0 18px 44px rgba(13,60,110,.25)!important;z-index:2147483600!important;display:none!important;gap:4px!important;overflow-x:auto!important}#gfOneMobileNav button{min-width:64px;flex:1 0 64px;border:0;border-radius:16px;background:transparent;color:#52627a;font-size:11px;font-weight:1000;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;touch-action:pan-x;cursor:pointer}#gfOneMobileNav button .ico{font-size:22px;line-height:1}#gfOneMobileNav button.active{background:linear-gradient(135deg,#1976d2,#0f5ead);color:#fff}}
      @media(min-width:901px){#gfOneMobileNav{display:none!important}.gfSideNav{display:block!important}}
    `;
    document.head.appendChild(st);
  }
  function ensureNav(){
    ensureCss();
    qsa('#tabCadastros,#gfCadastrosSub,.gfSideSub,.gfSideParent').forEach(function(el){try{el.remove()}catch(e){}});
    var menu=document.querySelector('.gfSideMenu');
    if(menu && menu.getAttribute('data-gf-one-menu')!=='1'){
      var ids={dashboard:'tabDashboard',operacao:'tabOperacao',qrs:'navCadQrs',equipamentos:'navCadEquipamentos',servicos:'navCadServicos',problemas:'navCadProblemas',ia:'navIaGuara',usuarios:'tabUsuarios'};
      var labels={dashboard:'Dashboard',operacao:'Consulta',qrs:'QR Codes e Setores',equipamentos:'Equipamentos / Patrimônios',servicos:'Serviços',problemas:'Tipos de problema',ia:'IA Analytics',usuarios:'Configurações'};
      menu.innerHTML=NAV.map(function(n){return '<button class="tab gfSideItem" id="'+ids[n[0]]+'" type="button" data-gf-one-route="'+n[0]+'"><span>'+n[1]+'</span><b>'+esc(labels[n[0]])+'</b></button>';}).join('');
      menu.setAttribute('data-gf-one-menu','1');
    }
    var nav=$('gfOneMobileNav'); if(nav) nav.remove(); return;
    nav.innerHTML=NAV.map(function(n){return '<button type="button" data-gf-one-route="'+n[0]+'"><span class="ico">'+n[1]+'</span><span>'+esc(n[2])+'</span></button>';}).join('');
  }
  function setActive(route){
    route=routeNorm(route);
    qsa('[data-gf-one-route],.gfSideItem,.tab,#gfOneMobileNav button').forEach(function(el){el.classList.remove('active')});
    qsa('[data-gf-one-route="'+route+'"]').forEach(function(el){el.classList.add('active')});
  }
  function showContainer(pid){
    qsa('.gfMainWrap > section[id^="page"], section[id^="page"]').forEach(function(s){s.classList.add('hidden');s.setAttribute('aria-hidden','true')});
    var p=$(pid); if(p){p.classList.remove('hidden');p.removeAttribute('aria-hidden');p.style.display=''}
    try{window.scrollTo({top:0,left:0,behavior:'auto'})}catch(e){window.scrollTo(0,0)}
    return p;
  }
  async function loadIssues(force){
    if(!force && state.issues) return state.issues;
    try{
      var j=await fetch(API_ROOT+'/api/admin/issues',{cache:'no-store'}).then(function(r){return r.json()});
      state.issues=Array.isArray(j)?j:(j.issues||j.items||j.data||[]);
    }catch(e){ state.issues=[]; }
    return state.issues;
  }
  function groupIssues(rows){
    var map={};
    rows.forEach(function(r){
      var nm=issueName(r), k=slug(nm)||'semnome';
      if(!map[k]) map[k]={key:k,name:nm,rows:[],active:false};
      map[k].rows.push(r); if(isActive(r)) map[k].active=true;
    });
    return Object.keys(map).map(function(k){return map[k]}).sort(function(a,b){return a.name.localeCompare(b.name,'pt-BR')});
  }
  function linksFor(g){
    var eq=[], sv=[], se={}, ss={};
    g.rows.forEach(function(r){
      var nm=itemName(r); if(isGenericItem(nm)) return;
      var k=slug(nm); if(!k) return;
      if(isServiceRow(r)){ if(!ss[k]){ss[k]=1; sv.push(nm)} }
      else { if(!se[k]){se[k]=1; eq.push(nm)} }
    });
    eq.sort(function(a,b){return a.localeCompare(b,'pt-BR')}); sv.sort(function(a,b){return a.localeCompare(b,'pt-BR')});
    return {eq:eq,sv:sv,total:eq.length+sv.length};
  }
  function cardHtml(g){
    var l=linksFor(g), first=g.rows[0]||{};
    return '<div class="gfFinalCard">'+
      '<span class="gfFinalCardIcon">⚠️</span>'+
      '<span class="gfFinalCardName"><b>'+esc(g.name)+'</b><small>'+(g.active?'Ativo':'Inativo')+'</small></span>'+
      '<div class="gfFinalCounts"><span class="gfFinalPill total">'+l.total+' vínculo'+(l.total===1?'':'s')+'</span><span class="gfFinalPill">'+l.eq.length+' equipamento'+(l.eq.length===1?'':'s')+'</span><span class="gfFinalPill">'+l.sv.length+' serviço'+(l.sv.length===1?'':'s')+'</span></div>'+
      '<div class="gfFinalActions"><button class="gfFinalPrimary" type="button" data-gf-final-action="vincular" data-id="'+Number(first.id||0)+'" data-name="'+esc(g.name)+'">Vincular</button><button class="gfFinalLight" type="button" data-gf-final-action="editar" data-id="'+Number(first.id||0)+'">Editar</button><button class="'+(g.active?'gfFinalDanger':'gfFinalPrimary')+'" type="button" data-gf-final-action="toggle" data-id="'+Number(first.id||0)+'" data-active="'+(g.active?0:1)+'">'+(g.active?'Inativar':'Ativar')+'</button></div>'+
    '</div>';
  }
  function renderTipos(){
    var all=groupIssues(state.issues||[]);
    var q=norm($('gfFinalSearch')&&$('gfFinalSearch').value||'');
    var st=($('gfFinalStatus')&&$('gfFinalStatus').value)||'ACTIVE';
    var list=all.filter(function(g){ if(st==='ACTIVE'&&!g.active)return false; if(st==='INACTIVE'&&g.active)return false; if(q&&norm(g.name).indexOf(q)<0)return false; return true; });
    var c=$('gfFinalCount'); if(c)c.textContent=list.length+' de '+all.length+' problema(s) exibidos';
    var b=$('gfFinalBody'); if(b)b.innerHTML=list.length?list.map(cardHtml).join(''):'<div class="gfFinalEmpty">Nenhum problema encontrado.</div>';
  }
  async function openTipos(){
    ensureNav(); setActive('problemas'); state.route='problemas';
    var p=showContainer('pageCadastros'); if(!p) return false;
    p.innerHTML='<div class="gfFinalTipos"><div class="gfFinalHead"><div class="gfFinalTitle"><span class="gfFinalIcon">⚠️</span><div><h1>Tipos de problema</h1><p>Problemas na tela principal. Equipamentos e serviços aparecem só na tela de vínculo.</p></div></div><button class="gfFinalNew adminOnly" type="button" data-gf-final-new="1">+ Novo problema</button></div><div class="gfFinalToolbar"><input id="gfFinalSearch" placeholder="Buscar problema..." autocomplete="off"><select id="gfFinalStatus"><option value="ACTIVE">Ativos</option><option value="INACTIVE">Inativos</option><option value="ALL">Todos</option></select><strong id="gfFinalCount">Carregando...</strong></div><div class="gfFinalBody" id="gfFinalBody"><div class="gfFinalEmpty">Carregando...</div></div></div>';
    $('gfFinalSearch').addEventListener('input',renderTipos); $('gfFinalStatus').addEventListener('change',renderTipos);
    await loadIssues(false); renderTipos(); return false;
  }
  function ensureModal(){
    if($('gfFinalModalBg')) return;
    document.body.insertAdjacentHTML('beforeend','<div class="gfFinalModalBg" id="gfFinalModalBg"></div><div class="gfFinalModal" id="gfFinalModal"><button class="gfFinalClose" type="button" data-gf-final-close="1">×</button><h2>Novo problema</h2><p>Crie o problema. Depois use Vincular para marcar equipamentos e serviços.</p><label>Nome do problema<input id="gfFinalNewName" placeholder="Ex: LÂMPADA, INTERNET, DEFEITO"></label><label>Status<select id="gfFinalNewStatus"><option value="1">Ativo</option><option value="0">Inativo</option></select></label><div class="gfFinalModalFoot"><button class="gfFinalLight" type="button" data-gf-final-close="1">Cancelar</button><button class="gfFinalPrimary" type="button" data-gf-final-save="1">Salvar</button></div></div>');
  }
  function openModal(){ensureModal();$('gfFinalModalBg').classList.add('show');$('gfFinalModal').classList.add('show');setTimeout(function(){var n=$('gfFinalNewName'); if(n)n.focus()},50)}
  function closeModal(){var b=$('gfFinalModalBg'),m=$('gfFinalModal'); if(b)b.classList.remove('show'); if(m)m.classList.remove('show')}
  async function saveNew(){
    var name=String($('gfFinalNewName')&&$('gfFinalNewName').value||'').trim().toUpperCase(); if(!name){alert('Informe o nome do problema.');return}
    var active=String($('gfFinalNewStatus')&&$('gfFinalNewStatus').value||'1')==='1'; var btn=document.querySelector('[data-gf-final-save]'); if(btn){btn.disabled=true;btn.textContent='Salvando...'}
    try{ var body={name:name,issue_type:name,asset_name:'GERAL',priority:'MEDIUM',active:active}; var j=await fetch(API_ROOT+'/api/admin/issues',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}).then(function(r){return r.json().then(function(x){if(!r.ok||x.ok===false)throw new Error(x.error||x.message||'Erro ao salvar');return x})}); closeModal(); state.issues=null; await loadIssues(true); renderTipos(); toast('Problema cadastrado'); }catch(e){alert(e.message||'Erro ao salvar problema.')} finally{ if(btn){btn.disabled=false;btn.textContent='Salvar'} }
  }
  var previousShowPage=window.showPage;
  function openRoute(route){
    route=routeNorm(route); ensureNav(); setActive(route); state.route=route;
    if(route==='problemas') return openTipos();
    if(route==='equipamentos'||route==='servicos'){
      if(typeof window.openCadastroModule==='function'){window.openCadastroModule(route);setActive(route);return false}
      if(typeof window.gfOpenCadastroSideModule==='function'){window.gfOpenCadastroSideModule(route);setActive(route);return false}
    }
    if(route==='qrs'){
      if(previousShowPage) try{return previousShowPage('qrs')}catch(e){}
      showContainer('pageQrs'); return false;
    }
    var base={dashboard:'dashboard',operacao:'operacao',ia:'ia',usuarios:'usuarios'}[route]||'dashboard';
    if(previousShowPage) try{return previousShowPage(base)}catch(e){}
    showContainer('page'+base.charAt(0).toUpperCase()+base.slice(1)); return false;
  }
  window.gfFinalOpenRoute=openRoute; window.showPage=function(page){return openRoute(page)}; try{showPage=window.showPage}catch(e){}
  function handle(ev){
    var t=ev.target; if(!t||!t.closest)return;
    var close=t.closest('[data-gf-final-close]'); if(close){ev.preventDefault();ev.stopPropagation();ev.stopImmediatePropagation();closeModal();return false}
    var save=t.closest('[data-gf-final-save]'); if(save){ev.preventDefault();ev.stopPropagation();ev.stopImmediatePropagation();saveNew();return false}
    var nb=t.closest('[data-gf-final-new]'); if(nb){ev.preventDefault();ev.stopPropagation();ev.stopImmediatePropagation();openModal();return false}
    var act=t.closest('[data-gf-final-action]'); if(act){
      ev.preventDefault();ev.stopPropagation();ev.stopImmediatePropagation(); var a=act.getAttribute('data-gf-final-action'), idn=Number(act.getAttribute('data-id')||0);
      if(a==='vincular'){ if(idn&&typeof window.openIssueSectorDrawer==='function') return window.openIssueSectorDrawer(idn); if(idn&&typeof window.openIssueLinkDrawer==='function') return window.openIssueLinkDrawer(idn); alert('Tela de vínculo não encontrada neste arquivo.'); return false; }
      if(a==='editar'){ if(idn&&typeof window.editIssue==='function') return window.editIssue(idn); alert('Editor de problema não encontrado.'); return false; }
      if(a==='toggle'){ var active=Number(act.getAttribute('data-active')||0); if(idn&&typeof window.toggleIssueActive==='function') return window.toggleIssueActive(idn,active); if(idn&&typeof window.toggleIssue==='function') return window.toggleIssue(idn,active); alert('Ação de ativar/inativar não encontrada.'); return false; }
    }
    var btn=t.closest('[data-gf-one-route],#tabDashboard,#tabOperacao,#navCadQrs,#navCadEquipamentos,#navCadServicos,#navCadProblemas,#navIaGuara,#tabUsuarios');
    if(btn){ev.preventDefault();ev.stopPropagation();ev.stopImmediatePropagation(); var r=btn.getAttribute('data-gf-one-route') || (btn.id==='tabDashboard'?'dashboard':btn.id==='tabOperacao'?'operacao':btn.id==='navCadQrs'?'qrs':btn.id==='navCadEquipamentos'?'equipamentos':btn.id==='navCadServicos'?'servicos':btn.id==='navCadProblemas'?'problemas':btn.id==='navIaGuara'?'ia':'usuarios'); openRoute(r); return false;}
  }
  window.addEventListener('click',handle,true);
  // no touchend: swipe não navega. Tap vira click normal.
  window.addEventListener('touchstart',function(ev){var p=ev.touches&&ev.touches[0]; if(!p)return; state.sx=p.clientX; state.sy=p.clientY; state.touchMoved=false;},true);
  window.addEventListener('touchmove',function(ev){var p=ev.touches&&ev.touches[0]; if(!p)return; if(Math.abs(p.clientX-state.sx)>10||Math.abs(p.clientY-state.sy)>10) state.touchMoved=true;},true);
  window.addEventListener('touchend',function(ev){var t=ev.target&&ev.target.closest&&ev.target.closest('#gfOneMobileNav,[data-gf-one-route]'); if(t&&state.touchMoved){ev.stopImmediatePropagation();ev.stopPropagation();}},true);
  function boot(){ ensureNav(); try{ if((document.getElementById('pageCadastros')||{}).textContent && /Tipos de problema/i.test(document.getElementById('pageCadastros').textContent) && /problemas exibidos no QR|Todos itens|AQUÁRIO|BALANÇA|\s⌄|\s⌃/.test(document.getElementById('pageCadastros').textContent)) openTipos(); }catch(e){} }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot,{once:true}); else boot();
  window.addEventListener('load',function(){boot();setTimeout(boot,100);setTimeout(boot,700)},{passive:true});
  window.addEventListener('pageshow',function(){setTimeout(boot,0)},{passive:true});
  window.addEventListener('resize',function(){setTimeout(ensureNav,100)},{passive:true});
})();

/* =========================================================
   GF_PATCH_FINAL_REAL_20260622
   Corrige a ferida real restante:
   - PC e celular usam uma navegação única, sem submenu Cadastros.
   - Clique em módulo abre sempre o destino certo.
   - Swipe/deslize no celular não navega.
   - QR e Consulta não caem em navegação antiga.
   - Tipos de problema: lista só problemas, botões fora, sem seta/accordion.
   ========================================================= */
(function(){
  'use strict';
  if(window.__GF_PATCH_FINAL_REAL_20260622__) return;
  window.__GF_PATCH_FINAL_REAL_20260622__ = true;

  var API_ROOT = window.API || window.API_BASE || window.location.origin;
  var baseOpenCadastroModule = (typeof window.openCadastroModule === 'function') ? window.openCadastroModule.bind(window) : null;
  var state = { issues:null, sx:0, sy:0, moved:false, suppressUntil:0 };

  var NAV = [
    ['dashboard','📊','Dashboard','Painel','tabDashboard'],
    ['operacao','🔎','Consulta','Consulta','tabOperacao'],
    ['qrs','▦','QR Codes e Setores','QR','navCadQrs'],
    ['equipamentos','🧰','Equipamentos / Patrimônios','Equip.','navCadEquipamentos'],
    ['servicos','🧩','Serviços','Serv.','navCadServicos'],
    ['problemas','⚠️','Tipos de problema','Tipos','navCadProblemas'],
    ['ia','🤖','IA Analytics','IA','navIaGuara'],
    ['usuarios','⚙️','Configurações','Config.','tabUsuarios']
  ];

  function $(id){ return document.getElementById(id); }
  function qs(s){ return document.querySelector(s); }
  function qsa(s){ return Array.prototype.slice.call(document.querySelectorAll(s)); }
  function esc(v){ return String(v == null ? '' : v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];}); }
  function norm(v){ return String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim(); }
  function slug(v){ return norm(v).replace(/[^a-z0-9]+/g,''); }
  function routeOf(v){
    var r=norm(v);
    if(!r) return 'dashboard';
    if(r.indexOf('dashboard')>=0 || r.indexOf('painel')>=0) return 'dashboard';
    if(r.indexOf('consulta')>=0 || r.indexOf('operacao')>=0 || r.indexOf('pesquisa')>=0) return 'operacao';
    if(r.indexOf('qr')>=0) return 'qrs';
    if(r.indexOf('equip')>=0 || r.indexOf('patrim')>=0 || r.indexOf('asset')>=0) return 'equipamentos';
    if(r.indexOf('serv')>=0) return 'servicos';
    if(r.indexOf('proble')>=0 || r.indexOf('tipo')>=0 || r.indexOf('issue')>=0) return 'problemas';
    if(r.indexOf('ia')>=0 || r.indexOf('analytics')>=0) return 'ia';
    if(r.indexOf('config')>=0 || r.indexOf('usuario')>=0 || r.indexOf('user')>=0) return 'usuarios';
    return r;
  }
  function pageId(route){
    return {dashboard:'pageDashboard',operacao:'pageOperacao',qrs:'pageQrs',equipamentos:'pageCadastros',servicos:'pageCadastros',problemas:'pageCadastros',ia:'pageIa',usuarios:'pageUsuarios'}[route] || 'pageDashboard';
  }
  function injectCss(){
    var old=$('gfPatchFinalRealCss'); if(old) old.remove();
    var st=document.createElement('style'); st.id='gfPatchFinalRealCss';
    st.textContent = [
      '#tabCadastros,#gfCadastrosSub,.gfSideSub,.gfSideParent,#gfMobileBottomNav,#gfUltimateMobileNav{display:none!important;visibility:hidden!important;opacity:0!important;pointer-events:none!important}',
      '.gfSideMenu{display:flex!important;flex-direction:column!important;gap:10px!important}.gfSideMenu .gfSideItem{width:100%!important;cursor:pointer!important;touch-action:manipulation!important}',
      '.gfFinalProblemas{box-sizing:border-box!important;width:100%!important;max-width:1500px!important;margin:0 auto!important;background:#fff!important;border:1px solid #dbe7f5!important;border-radius:28px!important;padding:24px!important;box-shadow:0 18px 50px rgba(11,44,80,.07)!important}',
      '.gfFinalProbHead{display:flex!important;align-items:center!important;justify-content:space-between!important;gap:16px!important;border-bottom:1px solid #dbe7f5!important;padding-bottom:18px!important;margin-bottom:18px!important}.gfFinalProbTitle{display:flex!important;align-items:center!important;gap:14px!important}.gfFinalProbIcon{width:58px!important;height:58px!important;border-radius:16px!important;background:#eafff3!important;border:1px solid #bcf0d5!important;display:grid!important;place-items:center!important;font-size:28px!important;flex:0 0 58px!important}.gfFinalProbTitle h1{margin:0!important;font-size:30px!important;color:#061747!important;line-height:1.05!important}.gfFinalProbTitle p{margin:6px 0 0!important;color:#52627a!important;font-weight:900!important}.gfFinalProbNew{border:0!important;border-radius:16px!important;background:#16a05a!important;color:#fff!important;padding:15px 20px!important;font-weight:1000!important;box-shadow:0 14px 30px rgba(22,160,90,.22)!important;cursor:pointer!important}',
      '.gfFinalProbToolbar{display:grid!important;grid-template-columns:minmax(240px,1fr) 240px auto!important;gap:12px!important;align-items:center!important;margin:0 0 16px!important}.gfFinalProbToolbar input,.gfFinalProbToolbar select{height:46px!important;border:1px solid #dbe7f5!important;border-radius:14px!important;padding:0 14px!important;font-weight:900!important;color:#061747!important;background:#fff!important;outline:none!important}.gfFinalProbToolbar strong{font-weight:1000!important;color:#061747!important}',
      '.gfFinalProbBody{display:grid!important;gap:12px!important;max-width:1040px!important}.gfFinalProbCard{display:grid!important;grid-template-columns:52px minmax(220px,1fr) auto auto!important;align-items:center!important;gap:14px!important;border:1px solid #dbe7f5!important;border-radius:18px!important;background:#fff!important;padding:14px 16px!important}.gfFinalProbCard.off{opacity:.68;background:#f8fbff!important}.gfFinalProbCard .ico{width:48px!important;height:48px!important;border-radius:14px!important;background:#eafff3!important;border:1px solid #bcf0d5!important;display:grid!important;place-items:center!important;font-size:22px!important}.gfFinalProbCard b{display:block!important;font-size:22px!important;line-height:1.1!important;color:#061747!important}.gfFinalProbCard small{display:block!important;margin-top:5px!important;color:#52627a!important;font-weight:900!important}.gfFinalProbCounts{display:flex!important;gap:8px!important;flex-wrap:wrap!important;justify-content:flex-end!important}.gfFinalProbPill{border:1px solid #dbe7f5!important;background:#f8fbff!important;color:#061747!important;border-radius:999px!important;padding:8px 10px!important;font-size:12px!important;font-weight:1000!important;white-space:nowrap!important}.gfFinalProbPill.total{background:#13b66b!important;color:#fff!important;border-color:#13b66b!important}.gfFinalProbActions{display:flex!important;gap:8px!important;justify-content:flex-end!important;flex-wrap:wrap!important}.gfFinalProbActions button,.gfFinalProbBtn{border:0!important;border-radius:13px!important;padding:10px 12px!important;font-weight:1000!important;cursor:pointer!important}.gfFinalProbPrimary{background:#16a05a!important;color:#fff!important}.gfFinalProbLight{background:#fff!important;color:#061747!important;border:1px solid #dbe7f5!important}.gfFinalProbDanger{background:#ef4444!important;color:#fff!important}.gfFinalProbEmpty{padding:22px!important;border:1px dashed #cbd8e8!important;border-radius:18px!important;background:#f8fbff!important;color:#52627a!important;font-weight:900!important}',
      '.gfFinalProbModalBg{position:fixed!important;inset:0!important;background:rgba(4,18,40,.42)!important;z-index:2147483500!important;display:none!important}.gfFinalProbModalBg.show{display:block!important}.gfFinalProbModal{position:fixed!important;right:20px!important;top:96px!important;width:min(520px,calc(100vw - 28px))!important;max-height:calc(100dvh - 120px)!important;overflow:auto!important;background:#fff!important;border-radius:24px!important;border:1px solid #dbe7f5!important;box-shadow:0 30px 80px rgba(0,0,0,.25)!important;z-index:2147483600!important;display:none!important;padding:18px!important}.gfFinalProbModal.show{display:block!important}.gfFinalProbModal h2{margin:0 0 6px!important;color:#061747!important}.gfFinalProbModal p{margin:0 0 14px!important;color:#52627a!important;font-weight:800!important}.gfFinalProbModal label{display:grid!important;gap:7px!important;margin:12px 0!important;color:#061747!important;font-weight:1000!important}.gfFinalProbModal input,.gfFinalProbModal select{height:48px!important;border:1px solid #dbe7f5!important;border-radius:14px!important;padding:0 12px!important;font-weight:900!important}.gfFinalProbClose{position:absolute!important;right:14px!important;top:14px!important;width:40px!important;height:40px!important;border:0!important;border-radius:12px!important;background:#f1f5fb!important;font-size:22px!important;font-weight:1000!important}.gfFinalProbFoot{display:flex!important;gap:10px!important;justify-content:flex-end!important;margin-top:14px!important}',
      '@media(min-width:901px){#gfFinalMobileNav{display:none!important}.gfSideNav{display:block!important}}',
      '@media(max-width:900px){html,body{overflow-x:hidden!important}.gfSideNav{display:none!important}.gfMainWrap,.wrap.gfMainWrap{margin-left:0!important;width:100%!important;max-width:100%!important;padding:10px 10px 96px!important;box-sizing:border-box!important}.gfFinalProblemas{border-radius:20px!important;padding:14px!important}.gfFinalProbHead{align-items:flex-start!important}.gfFinalProbTitle h1{font-size:22px!important}.gfFinalProbIcon{width:48px!important;height:48px!important;flex-basis:48px!important}.gfFinalProbNew{padding:12px 13px!important;font-size:13px!important}.gfFinalProbToolbar{grid-template-columns:1fr!important}.gfFinalProbBody{max-width:none!important}.gfFinalProbCard{grid-template-columns:44px minmax(0,1fr)!important;padding:12px!important;gap:10px!important}.gfFinalProbCard .ico{width:40px!important;height:40px!important}.gfFinalProbCard b{font-size:18px!important}.gfFinalProbCounts{grid-column:1/-1!important;justify-content:flex-start!important}.gfFinalProbActions{grid-column:1/-1!important;display:grid!important;grid-template-columns:1fr 1fr 1fr!important;width:100%!important}.gfFinalProbActions button{width:100%!important;padding:11px 8px!important;font-size:12px!important}#gfFinalMobileNav{position:fixed!important;left:8px!important;right:8px!important;bottom:8px!important;height:76px!important;padding:7px!important;border-radius:22px!important;background:rgba(255,255,255,.98)!important;border:1px solid #dbe7f5!important;box-shadow:0 18px 44px rgba(13,60,110,.25)!important;z-index:2147483600!important;display:none!important;gap:4px!important;overflow-x:auto!important;visibility:visible!important;opacity:1!important;pointer-events:auto!important}#gfFinalMobileNav button{min-width:64px!important;flex:1 0 64px!important;border:0!important;border-radius:16px!important;background:transparent!important;color:#52627a!important;font-size:11px!important;font-weight:1000!important;display:flex!important;flex-direction:column!important;align-items:center!important;justify-content:center!important;gap:2px!important;touch-action:pan-x!important;cursor:pointer!important}#gfFinalMobileNav button .ico{font-size:22px!important;line-height:1!important}#gfFinalMobileNav button.active{background:linear-gradient(135deg,#1976d2,#0f5ead)!important;color:#fff!important}}'
    ].join('\n');
    document.head.appendChild(st);
  }

  function buildNav(){
    injectCss();
    qsa('#tabCadastros,#gfCadastrosSub,.gfSideSub,.gfSideParent,#gfMobileBottomNav,#gfUltimateMobileNav,#gfOneMobileNav').forEach(function(el){ try{ el.remove(); }catch(e){} });
    var menu=qs('.gfSideMenu');
    if(menu){
      var html=NAV.map(function(n){ return '<button class="tab gfSideItem" id="'+n[4]+'" type="button" data-gf-final-real-route="'+n[0]+'"><span>'+n[1]+'</span><b>'+esc(n[2])+'</b></button>'; }).join('');
      if(menu.getAttribute('data-gf-final-real')!=='1' || menu.innerHTML!==html){ menu.innerHTML=html; menu.setAttribute('data-gf-final-real','1'); }
    }
    var mob=$('gfFinalMobileNav'); if(mob) mob.remove();
  }
  function setActive(route){
    route=routeOf(route);
    qsa('[data-gf-final-real-route],.gfSideItem,.tab,#gfFinalMobileNav button').forEach(function(el){ el.classList.remove('active'); });
    qsa('[data-gf-final-real-route="'+route+'"]').forEach(function(el){ el.classList.add('active'); });
  }
  function hidePages(){ qsa('.gfMainWrap > section[id^="page"], section[id^="page"]').forEach(function(p){ p.classList.add('hidden'); p.setAttribute('aria-hidden','true'); }); }
  function showPageOnly(pid){
    hidePages();
    var p=$(pid); if(p){ p.classList.remove('hidden'); p.removeAttribute('aria-hidden'); p.style.display=''; }
    try{ window.scrollTo({top:0,left:0,behavior:'auto'}); }catch(e){ window.scrollTo(0,0); }
    return p;
  }
  function loadAfter(route){
    try{
      if(route==='dashboard' && typeof window.loadDashboardV8==='function') window.loadDashboardV8();
      if(route==='qrs' && typeof window.loadQrs==='function') window.loadQrs();
      if(route==='ia' && typeof window.initGfAi==='function') window.initGfAi();
      if(route==='usuarios' && typeof window.closeSettingsUsers==='function') window.closeSettingsUsers(false);
      if(route==='operacao'){
        var pg=$('pageOperacao'); if(pg) pg.classList.add('gfOpConsultaMode');
        setTimeout(function(){ try{ if(typeof window.gfOpenOperationConsulta==='function') window.gfOpenOperationConsulta(); else if(typeof window.openOperationConsulta==='function') window.openOperationConsulta(); }catch(e){} }, 20);
      }else{
        var op=$('pageOperacao'); if(op) op.classList.remove('gfOpConsultaMode');
      }
    }catch(e){ console.warn('loadAfter', route, e); }
  }

  function activeIssue(r){ return Number((r && r.active) == null ? 1 : r.active) === 1 && ['INACTIVE','DISABLED'].indexOf(String(r && r.status || '').toUpperCase())<0; }
  function issueName(r){ return String((r && (r.name || r.issue_type || r.problem_name || r.problem)) || 'SEM NOME').trim().toUpperCase() || 'SEM NOME'; }
  function itemName(r){ return String((r && (r.asset_name || r.asset || r.equipment_name || r.service_name || r.item_name || r.linked_name)) || '').trim().toUpperCase(); }
  function isService(r){ var k=String((r && (r.asset_kind || r.kind || r.item_kind || r.type)) || '').toUpperCase(); return k.indexOf('SERV')>=0 || !!(r && (r.service_id || r.service_key || r.service_name)); }
  async function getIssues(force){
    if(state.issues && !force) return state.issues;
    var j=await fetch(API_ROOT+'/api/admin/issues',{cache:'no-store',credentials:'include'}).then(function(r){ return r.json().catch(function(){return {};}); });
    state.issues=Array.isArray(j.issues)?j.issues:(Array.isArray(j)?j:[]);
    return state.issues;
  }
  function groupsFrom(rows){
    var map={};
    (rows||[]).forEach(function(r){
      var nm=issueName(r), k=slug(nm)||'semnome';
      if(!map[k]) map[k]={key:k,name:nm,rows:[],active:false};
      map[k].rows.push(r); if(activeIssue(r)) map[k].active=true;
    });
    return Object.keys(map).map(function(k){return map[k];}).sort(function(a,b){return a.name.localeCompare(b.name,'pt-BR');});
  }
  function countsFor(g){
    var eq={}, sv={};
    g.rows.forEach(function(r){ var nm=itemName(r); if(!nm || nm==='GERAL') return; var k=slug(nm); if(!k) return; if(isService(r)) sv[k]=nm; else eq[k]=nm; });
    return {eq:Object.keys(eq).length, sv:Object.keys(sv).length};
  }
  function problemCard(g){
    var c=countsFor(g), first=g.rows[0]||{}, total=c.eq+c.sv;
    return '<div class="gfFinalProbCard '+(g.active?'':'off')+'">'+
      '<span class="ico">⚠️</span><span><b>'+esc(g.name)+'</b><small>'+(g.active?'Ativo':'Inativo')+'</small></span>'+
      '<div class="gfFinalProbCounts"><span class="gfFinalProbPill total">'+total+' vínculo'+(total===1?'':'s')+'</span><span class="gfFinalProbPill">'+c.eq+' equipamento'+(c.eq===1?'':'s')+'</span><span class="gfFinalProbPill">'+c.sv+' serviço'+(c.sv===1?'':'s')+'</span></div>'+
      '<div class="gfFinalProbActions"><button class="gfFinalProbPrimary" type="button" data-gf-final-prob-action="vincular" data-id="'+Number(first.id||0)+'">Vincular</button><button class="gfFinalProbLight" type="button" data-gf-final-prob-action="editar" data-id="'+Number(first.id||0)+'">Editar</button><button class="'+(g.active?'gfFinalProbDanger':'gfFinalProbPrimary')+'" type="button" data-gf-final-prob-action="toggle" data-id="'+Number(first.id||0)+'" data-active="'+(g.active?0:1)+'">'+(g.active?'Inativar':'Ativar')+'</button></div>'+
    '</div>';
  }
  function renderProblems(){
    var all=groupsFrom(state.issues||[]), q=norm($('gfFinalProbSearch')&&$('gfFinalProbSearch').value||''), st=($('gfFinalProbStatus')&&$('gfFinalProbStatus').value)||'ACTIVE';
    var rows=all.filter(function(g){ if(st==='ACTIVE' && !g.active) return false; if(st==='INACTIVE' && g.active) return false; if(q && norm(g.name).indexOf(q)<0) return false; return true; });
    var c=$('gfFinalProbCount'); if(c) c.textContent=rows.length+' de '+all.length+' problema(s) exibidos';
    var b=$('gfFinalProbBody'); if(b) b.innerHTML=rows.length?rows.map(problemCard).join(''):'<div class="gfFinalProbEmpty">Nenhum problema encontrado.</div>';
  }
  async function openProblemas(){
    buildNav(); setActive('problemas'); window.__gfCurrentPage='problemas';
    var p=showPageOnly('pageCadastros'); if(!p) return false;
    p.innerHTML='<div class="gfFinalProblemas"><div class="gfFinalProbHead"><div class="gfFinalProbTitle"><span class="gfFinalProbIcon">⚠️</span><div><h1>Tipos de problema</h1><p>Problemas na tela principal. Equipamentos e serviços ficam na tela de vínculo.</p></div></div><button class="gfFinalProbNew adminOnly" type="button" data-gf-final-prob-new="1">+ Novo problema</button></div><div class="gfFinalProbToolbar"><input id="gfFinalProbSearch" placeholder="Buscar problema..." autocomplete="off"><select id="gfFinalProbStatus"><option value="ACTIVE">Ativos</option><option value="INACTIVE">Inativos</option><option value="ALL">Todos</option></select><strong id="gfFinalProbCount">Carregando...</strong></div><div class="gfFinalProbBody" id="gfFinalProbBody"><div class="gfFinalProbEmpty">Carregando...</div></div></div>';
    $('gfFinalProbSearch').addEventListener('input',renderProblems);
    $('gfFinalProbStatus').addEventListener('change',renderProblems);
    await getIssues(false); renderProblems();
    return false;
  }
  function ensureModal(){
    if($('gfFinalProbModalBg')) return;
    document.body.insertAdjacentHTML('beforeend','<div class="gfFinalProbModalBg" id="gfFinalProbModalBg"></div><div class="gfFinalProbModal" id="gfFinalProbModal"><button class="gfFinalProbClose" type="button" data-gf-final-prob-close="1">×</button><h2>Novo problema</h2><p>Crie o problema. Depois use Vincular para marcar equipamentos e serviços.</p><label>Nome do problema<input id="gfFinalProbName" placeholder="Ex: LÂMPADA, INTERNET, DEFEITO"></label><label>Status<select id="gfFinalProbActive"><option value="1">Ativo</option><option value="0">Inativo</option></select></label><div class="gfFinalProbFoot"><button class="gfFinalProbLight gfFinalProbBtn" type="button" data-gf-final-prob-close="1">Cancelar</button><button class="gfFinalProbPrimary gfFinalProbBtn" type="button" data-gf-final-prob-save="1">Salvar</button></div></div>');
  }
  function openModal(){ ensureModal(); $('gfFinalProbModalBg').classList.add('show'); $('gfFinalProbModal').classList.add('show'); setTimeout(function(){ var n=$('gfFinalProbName'); if(n) n.focus(); },60); }
  function closeModal(){ var b=$('gfFinalProbModalBg'), m=$('gfFinalProbModal'); if(b)b.classList.remove('show'); if(m)m.classList.remove('show'); }
  async function saveProblem(){
    var name=String($('gfFinalProbName')&&$('gfFinalProbName').value||'').trim().toUpperCase(); if(!name){ alert('Informe o nome do problema.'); return; }
    var active=String($('gfFinalProbActive')&&$('gfFinalProbActive').value||'1')==='1'; var btn=qs('[data-gf-final-prob-save]'); if(btn){btn.disabled=true;btn.textContent='Salvando...';}
    try{
      await fetch(API_ROOT+'/api/admin/issues',{method:'POST',headers:{'Content-Type':'application/json'},credentials:'include',body:JSON.stringify({name:name,issue_type:name,asset_name:'GERAL',priority:'MEDIUM',active:active})}).then(function(r){return r.json().then(function(j){ if(!r.ok || j.ok===false) throw new Error(j.error||j.message||'Erro ao salvar'); return j;});});
      closeModal(); state.issues=null; await getIssues(true); renderProblems(); if(typeof window.toastMsg==='function') window.toastMsg('Problema cadastrado');
    }catch(e){ alert(e.message||'Erro ao salvar problema.'); }
    finally{ if(btn){btn.disabled=false;btn.textContent='Salvar';} }
  }
  function openRoute(route){
    route=routeOf(route); buildNav(); setActive(route); window.__gfCurrentPage=route;
    if(route==='problemas') return openProblemas();
    if(route==='equipamentos' || route==='servicos'){
      showPageOnly('pageCadastros');
      if(baseOpenCadastroModule){ try{ baseOpenCadastroModule(route); setActive(route); return false; }catch(e){ console.warn('baseOpenCadastroModule',e); } }
      var p=$('pageCadastros'); if(p) p.innerHTML='<div class="gfFinalProblemas"><div class="gfFinalProbHead"><div class="gfFinalProbTitle"><span class="gfFinalProbIcon">'+(route==='servicos'?'🧩':'🧰')+'</span><div><h1>'+(route==='servicos'?'Serviços':'Equipamentos')+'</h1><p>Carregando módulo...</p></div></div></div><div class="gfFinalProbEmpty">Não foi possível carregar o módulo antigo deste arquivo.</div></div>';
      return false;
    }
    var p=showPageOnly(pageId(route)); loadAfter(route); return false;
  }

  window.gfOpenCadastroDireto = openRoute;
  window.gfOpenCadastroFinal = openRoute;
  window.gfFinalOpenRoute = openRoute;
  window.showPage = function(p){ return openRoute(p); };
  try{ showPage = window.showPage; }catch(e){}

  function handleClick(ev){
    var t=ev.target; if(!t || !t.closest) return;
    var close=t.closest('[data-gf-final-prob-close]'); if(close){ ev.preventDefault(); ev.stopPropagation(); ev.stopImmediatePropagation(); closeModal(); return false; }
    var save=t.closest('[data-gf-final-prob-save]'); if(save){ ev.preventDefault(); ev.stopPropagation(); ev.stopImmediatePropagation(); saveProblem(); return false; }
    var add=t.closest('[data-gf-final-prob-new]'); if(add){ ev.preventDefault(); ev.stopPropagation(); ev.stopImmediatePropagation(); openModal(); return false; }
    var act=t.closest('[data-gf-final-prob-action]');
    if(act){
      ev.preventDefault(); ev.stopPropagation(); ev.stopImmediatePropagation();
      var idn=Number(act.getAttribute('data-id')||0), a=act.getAttribute('data-gf-final-prob-action');
      if(a==='vincular'){ if(idn && typeof window.openIssueSectorDrawer==='function') return window.openIssueSectorDrawer(idn); if(idn && typeof window.openIssueLinkDrawer==='function') return window.openIssueLinkDrawer(idn); alert('Tela de vínculo não encontrada.'); return false; }
      if(a==='editar'){ if(idn && typeof window.editIssue==='function') return window.editIssue(idn); alert('Editor de problema não encontrado.'); return false; }
      if(a==='toggle'){ var active=Number(act.getAttribute('data-active')||0); if(idn && typeof window.toggleIssueActive==='function') return window.toggleIssueActive(idn,active); if(idn && typeof window.toggleIssue==='function') return window.toggleIssue(idn,active); alert('Ação de ativar/inativar não encontrada.'); return false; }
    }
    var btn=t.closest('[data-gf-final-real-route],[data-gf-one-route],[data-gf-final-route],[data-gf-ultimate-route],[data-gf-route],#tabDashboard,#tabOperacao,#navCadQrs,#navCadEquipamentos,#navCadServicos,#navCadProblemas,#navIaGuara,#tabUsuarios');
    if(btn){
      if(Date.now() < state.suppressUntil) { ev.preventDefault(); ev.stopPropagation(); ev.stopImmediatePropagation(); return false; }
      ev.preventDefault(); ev.stopPropagation(); ev.stopImmediatePropagation();
      var r=btn.getAttribute('data-gf-final-real-route')||btn.getAttribute('data-gf-one-route')||btn.getAttribute('data-gf-final-route')||btn.getAttribute('data-gf-ultimate-route')||btn.getAttribute('data-gf-route')||btn.id||btn.textContent;
      openRoute(r); return false;
    }
  }
  window.addEventListener('click', handleClick, true);
  window.addEventListener('touchstart', function(ev){ var p=ev.touches&&ev.touches[0]; if(!p)return; state.sx=p.clientX; state.sy=p.clientY; state.moved=false; }, true);
  window.addEventListener('touchmove', function(ev){ var p=ev.touches&&ev.touches[0]; if(!p)return; if(Math.abs(p.clientX-state.sx)>12 || Math.abs(p.clientY-state.sy)>12) state.moved=true; }, true);
  window.addEventListener('touchend', function(ev){ var t=ev.target&&ev.target.closest&&ev.target.closest('#gfFinalMobileNav,[data-gf-final-real-route],[data-gf-one-route],[data-gf-final-route],[data-gf-ultimate-route],[data-gf-route]'); if(t && state.moved){ state.suppressUntil=Date.now()+450; ev.stopPropagation(); if(ev.stopImmediatePropagation) ev.stopImmediatePropagation(); } }, true);

  function boot(){ buildNav(); try{ if($('pageCadastros') && /Tipos de problema/i.test($('pageCadastros').textContent||'') && /Todos itens|problemas exibidos no QR|⌄|⌃|AQUÁRIO|BALANÇA/i.test($('pageCadastros').textContent||'')) openProblemas(); }catch(e){} }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', boot, {once:true}); else boot();
  window.addEventListener('load', function(){ boot(); setTimeout(boot,160); setTimeout(boot,800); }, {passive:true});
  window.addEventListener('pageshow', function(){ setTimeout(boot,0); }, {passive:true});
  window.addEventListener('resize', function(){ setTimeout(buildNav,120); }, {passive:true});
  var tries=0, timer=setInterval(function(){ tries++; buildNav(); if(tries>12) clearInterval(timer); }, 350);
})();

/* ==========================================================
   GUARÁ FIX PC NAV 2026-06-22
   Ferida: depois do bloqueio de swipe/touch, o click do menu
   lateral do PC podia ser interceptado por listeners antigos.
   Esta camada usa pointerup/mousedown somente no PC e liga
   cada botão direto na rota final, sem submenu e sem swipe.
   ========================================================== */
(function(){
  if(window.__GF_PC_SIDE_NAV_FORCE_20260622__) return;
  window.__GF_PC_SIDE_NAV_FORCE_20260622__ = true;

  var ROUTES = {
    tabDashboard:'dashboard',
    tabOperacao:'operacao',
    navCadQrs:'qrs',
    navCadEquipamentos:'equipamentos',
    navCadServicos:'servicos',
    navCadProblemas:'problemas',
    navIaGuara:'ia',
    tabUsuarios:'usuarios'
  };
  var NAV = [
    ['tabDashboard','dashboard','📊','Dashboard'],
    ['tabOperacao','operacao','🔎','Consulta'],
    ['navCadQrs','qrs','▦','QR Codes e Setores'],
    ['navCadEquipamentos','equipamentos','🧰','Equipamentos / Patrimônios'],
    ['navCadServicos','servicos','🧩','Serviços'],
    ['navCadProblemas','problemas','⚠️','Tipos de problema'],
    ['navIaGuara','ia','🤖','IA Analytics'],
    ['tabUsuarios','usuarios','⚙️','Configurações']
  ];
  function id(x){ return document.getElementById(x); }
  function qs(x){ return document.querySelector(x); }
  function qsa(x){ return Array.prototype.slice.call(document.querySelectorAll(x)); }
  function esc(v){ return String(v==null?'':v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];}); }
  function norm(v){ return String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim(); }
  function routeFrom(el){
    if(!el) return '';
    var r = el.getAttribute && (el.getAttribute('data-gf-final-real-route') || el.getAttribute('data-gf-route') || el.getAttribute('data-route') || el.getAttribute('data-page'));
    if(r) return r;
    if(el.id && ROUTES[el.id]) return ROUTES[el.id];
    var t=norm(el.textContent||'');
    if(t.indexOf('dashboard')>=0 || t.indexOf('painel')>=0) return 'dashboard';
    if(t.indexOf('consulta')>=0 || t.indexOf('operacao')>=0 || t.indexOf('pesquisa')>=0) return 'operacao';
    if(t.indexOf('qr')>=0) return 'qrs';
    if(t.indexOf('equip')>=0 || t.indexOf('patrim')>=0) return 'equipamentos';
    if(t.indexOf('serv')>=0) return 'servicos';
    if(t.indexOf('proble')>=0 || t.indexOf('tipo')>=0) return 'problemas';
    if(t.indexOf('ia')>=0 || t.indexOf('analytics')>=0) return 'ia';
    if(t.indexOf('config')>=0 || t.indexOf('usuario')>=0) return 'usuarios';
    return '';
  }
  function open(r){
    r = routeFrom({getAttribute:function(){return r;}, textContent:r}) || r;
    try{ if(typeof window.gfFinalOpenRoute === 'function') { window.gfFinalOpenRoute(r); return false; } }catch(e){ console.warn('gfFinalOpenRoute falhou',e); }
    try{ if((r==='equipamentos'||r==='servicos'||r==='problemas'||r==='qrs') && typeof window.gfOpenCadastroDireto === 'function'){ window.gfOpenCadastroDireto(r); return false; } }catch(e){}
    try{ if(typeof window.openCadastroModule === 'function' && (r==='equipamentos'||r==='servicos'||r==='problemas'||r==='qrs')){ window.openCadastroModule(r); return false; } }catch(e){}
    try{ if(typeof window.showPage === 'function') { window.showPage(r); return false; } }catch(e){}
    return false;
  }
  function ensurePcMenu(){
    var menu=qs('.gfSideMenu');
    if(!menu) return;
    var html=NAV.map(function(n){return '<button class="tab gfSideItem" id="'+n[0]+'" type="button" data-gf-final-real-route="'+n[1]+'" onclick="return window.gfPcSideOpen && window.gfPcSideOpen(\''+n[1]+'\')"><span>'+n[2]+'</span><b>'+esc(n[3])+'</b></button>';}).join('');
    if(menu.getAttribute('data-gf-pc-nav-force')!=='1' || menu.innerHTML!==html){
      menu.innerHTML=html;
      menu.setAttribute('data-gf-pc-nav-force','1');
    }
    qsa('.gfSideItem').forEach(function(btn){
      var r=routeFrom(btn); if(!r) return;
      btn.setAttribute('data-gf-final-real-route', r);
      btn.onclick=function(ev){ if(ev){ev.preventDefault();ev.stopPropagation(); if(ev.stopImmediatePropagation) ev.stopImmediatePropagation();} return open(r); };
    });
  }
  window.gfPcSideOpen=function(r){ return open(r); };

  function pcEvent(ev){
    if(window.innerWidth <= 900) return;
    var btn = ev.target && ev.target.closest && ev.target.closest('.gfSideMenu .gfSideItem, #tabDashboard,#tabOperacao,#navCadQrs,#navCadEquipamentos,#navCadServicos,#navCadProblemas,#navIaGuara,#tabUsuarios');
    if(!btn) return;
    var r=routeFrom(btn); if(!r) return;
    ev.preventDefault(); ev.stopPropagation(); if(ev.stopImmediatePropagation) ev.stopImmediatePropagation();
    open(r); return false;
  }

  function boot(){ ensurePcMenu(); }
  document.addEventListener('pointerup', pcEvent, true);
  document.addEventListener('mousedown', function(ev){ if(window.innerWidth>900 && ev.button===0) pcEvent(ev); }, true);
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', boot, {once:true}); else boot();
  window.addEventListener('load', function(){ boot(); setTimeout(boot,150); setTimeout(boot,700); }, {passive:true});
  window.addEventListener('pageshow', function(){ setTimeout(boot,0); }, {passive:true});
})();

/* GF NAV CLEAN final sweep */
setInterval(function(){try{document.querySelectorAll('#gfMobileBottomNav,#gfUltimateMobileNav,#gfOneMobileNav,#gfFinalMobileNav,.gfSideOverlay,.gfSideNav').forEach(function(el){if(!el.hasAttribute('data-gf-stable-keep'))el.remove();});}catch(e){}},120);


/* GF route bugfix pesquisa->cadastros final */
(function(){
  'use strict';
  if(window.__gfRouteBugfixPesquisaCadastrosFinal) return;
  window.__gfRouteBugfixPesquisaCadastrosFinal = true;

  var oldFinal = window.gfFinalOpenRoute || window.gfOpenCadastroFinal || window.gfOpenCadastroDireto || null;
  var oldCadastro = window.openCadastroModule || null;
  var oldShow = window.showPage || null;
  var running = false;

  function qsa(s){ return Array.prototype.slice.call(document.querySelectorAll(s)); }
  function id(x){ return document.getElementById(x); }
  function norm(v){
    return String(v || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim();
  }
  function routeOf(r){
    r = norm(r);
    if(r.indexOf('oper') >= 0 || r.indexOf('consulta') >= 0 || r.indexOf('pesquisa') >= 0 || r === 'taboperacao') return 'operacao';
    if(r.indexOf('qr') >= 0 || r === 'pageqrs' || r === 'navcadqrs') return 'qrs';
    if(r.indexOf('equip') >= 0 || r.indexOf('patrim') >= 0 || r === 'navcadequipamentos') return 'equipamentos';
    if(r.indexOf('serv') >= 0 || r === 'navcadservicos') return 'servicos';
    if(r.indexOf('proble') >= 0 || r.indexOf('tipo') >= 0 || r === 'navcadproblemas') return 'problemas';
    if(r.indexOf('ia') >= 0 || r.indexOf('analytics') >= 0 || r === 'naviaguara') return 'ia';
    if(r.indexOf('usuario') >= 0 || r.indexOf('config') >= 0 || r === 'tabusuarios') return 'usuarios';
    return 'dashboard';
  }
  function pageId(route){
    return {
      dashboard:'pageDashboard',
      operacao:'pageOperacao',
      qrs:'pageQrs',
      equipamentos:'pageCadastros',
      servicos:'pageCadastros',
      problemas:'pageCadastros',
      ia:'pageIa',
      usuarios:'pageUsuarios'
    }[route] || 'pageDashboard';
  }
  function clearOperacaoIfNeeded(route){
    var op = id('pageOperacao');
    if(route !== 'operacao' && op){
      op.classList.remove('gfOpConsultaMode','show','active');
      op.style.removeProperty('z-index');
      op.style.removeProperty('position');
    }
  }
  function forcePage(route){
    var pid = pageId(route);
    clearOperacaoIfNeeded(route);
    qsa('.gfMainWrap > section[id^="page"], section[id^="page"]').forEach(function(sec){
      var isTarget = sec.id === pid;
      sec.classList.toggle('hidden', !isTarget);
      sec.setAttribute('aria-hidden', isTarget ? 'false' : 'true');
      sec.style.setProperty('display', isTarget ? '' : 'none', 'important');
      if(isTarget) sec.removeAttribute('aria-hidden');
    });
    var target = id(pid);
    if(target){
      target.classList.remove('hidden');
      target.removeAttribute('aria-hidden');
      target.style.setProperty('display', '', 'important');
    }
    try{ window.scrollTo({top:0,left:0,behavior:'auto'}); }catch(e){ window.scrollTo(0,0); }
  }
  function syncActive(route){
    qsa('[data-gf-stable-route],[data-gf-final-real-route],[data-gf-route],.gfSideItem,#gfStableMobileNav button,#gfStableSideNav button').forEach(function(btn){
      var r = btn.getAttribute('data-gf-stable-route') || btn.getAttribute('data-gf-final-real-route') || btn.getAttribute('data-gf-route') || btn.id || btn.textContent;
      btn.classList.toggle('active', routeOf(r) === route);
    });
  }
  function hardOpen(route){
    route = routeOf(route);
    if(running){
      forcePage(route);
      syncActive(route);
      return false;
    }
    running = true;
    window.__gfCurrentPage = route;
    forcePage(route);
    syncActive(route);

    try{
      if(route === 'equipamentos' || route === 'servicos' || route === 'problemas' || route === 'qrs'){
        if(route === 'equipamentos' || route === 'servicos'){
          if(typeof oldCadastro === 'function') oldCadastro(route);
          else if(typeof oldFinal === 'function') oldFinal(route);
        }else if(typeof oldFinal === 'function'){
          oldFinal(route);
        }
      }else if(typeof oldFinal === 'function'){
        oldFinal(route);
      }else if(typeof oldShow === 'function'){
        oldShow(route);
      }
    }catch(e){
      console.warn('gf hardOpen rota falhou:', route, e);
    }

    forcePage(route);
    syncActive(route);
    setTimeout(function(){ forcePage(route); syncActive(route); }, 30);
    setTimeout(function(){ forcePage(route); syncActive(route); }, 160);
    running = false;
    return false;
  }

  window.gfRouteHardOpen = hardOpen;
  window.gfFinalOpenRoute = hardOpen;
  window.gfOpenCadastroDireto = hardOpen;
  window.gfOpenCadastroFinal = hardOpen;
  window.gfPcSideOpen = hardOpen;
  window.showPage = hardOpen;
  try{ showPage = window.showPage; }catch(e){}

  document.addEventListener('click', function(ev){
    var btn = ev.target && ev.target.closest && ev.target.closest(
      '[data-gf-stable-route],[data-gf-final-real-route],[data-gf-route],#tabDashboard,#tabOperacao,#navCadQrs,#navCadEquipamentos,#navCadServicos,#navCadProblemas,#navIaGuara,#tabUsuarios'
    );
    if(!btn) return;
    var r = btn.getAttribute('data-gf-stable-route') || btn.getAttribute('data-gf-final-real-route') || btn.getAttribute('data-gf-route') || btn.id || btn.textContent;
    if(!r) return;
    ev.preventDefault();
    ev.stopPropagation();
    if(ev.stopImmediatePropagation) ev.stopImmediatePropagation();
    return hardOpen(r);
  }, true);
})();

