/* One large invitation per opening, persisted before showing it. */
function firstCasinoNotice165(){
 if(!isOcean16()||atlasMenuOpen||modalOpen||draft||bridgeDraft||gesture||pointers.size||interruptionPending()||!canResumeInterface()||S.lives<=0||runtimeFault13)return false;
 const s=casinoState16();if(s.session){renderCasino16();return true;}
 if(!casinoDue16()||s.noticeCycle166===s.nextOpen)return false;
 s.noticeCycle166=s.nextOpen;s.firstNoticeSeen165=true;save();
 openModal(`<section class="casino-first165"><div class="modal-head"><h2>拉斯维加斯 · 赌城开放</h2><button class="close" onclick="closeModal()" aria-label="关闭提示">×</button></div><div class="casino-first-icon165">🎰</div><h2>赌城今天开放了</h2><p>每10天开放一次。入场金额和每次下注由你决定，每场最多拉10次。</p><p>进入后，通过「带钱离场」领取余额并返回地图。</p><div class="ux-actions"><button class="primary" onclick="showCasino16()">前往赌城</button><button onclick="skipCasino16()">本次不参加</button></div></section>`);return true;
}
const casinoUIBefore165=updateUI;
updateUI=function(...a){const r=casinoUIBefore165(...a);casinoNotice16.hidden=true;firstCasinoNotice165();return r;};
// Once funds have been brought in, only the explicit cashout path may replace the sheet.
const casinoModalBefore166=openModal;
openModal=function(html,...args){if(S?.casino16?.session&&!String(html).includes('slot-machine16')&&!runtimeFault13)return;return casinoModalBefore166(html,...args);};
