localStorage.clear(); atlasSelected='east'; atlasRestart=true; startAtlasBeforeLifecycle12(); try{ if(typeof initializeRiver128==='function') initializeRiver128(); }catch(e){}
document.getAnimations().forEach(a=>a.finish()); document.querySelector('#modal .primary')?.click(); await new Promise(r=>setTimeout(r,150));
closeModal(); S.points=186000; S.day=96; for(const t of ['bus','emu']){if(!S.unlocked.includes(t))S.unlocked.push(t);S.limits[t]=Math.max(S.limits[t]||0,3);}
for(const c of S.cities)c.dormant=false;
const com=S.cities.find(c=>c.shape===2)||S.cities[2]; com.shape=2; com.size=1;
S.lines.length=0;S.vehicles.length=0;
const mk=(t,st,col)=>{draft={type:t,name:TYPES[t].name+(S.lines.length+1)+'线',color:col,stops:st,stopRemoval:null};try{commitDraft(true)}catch(e){}if(draft)cancelDraft(false);};
mk('bus',[0,1,2],'#c56544');mk('emu',[1,2],'#4f86a8');
for(const c of realCities())for(let i=0;i<6;i++)try{newPassenger(c)}catch(e){}
S.paused=true; clearSelection(); updateUI(); dispatchEvent(new Event('resize')); await new Promise(r=>setTimeout(r,250));
window.__com=com.id;
