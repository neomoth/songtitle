(()=>{const e=document.cookie.includes("accessToken");e||(document.getElementById("loginModal").style.display="flex"),console.log(e);const t=document.getElementById("songTitle"),o=document.getElementById("songArtist"),s=document.getElementById("progress"),n=document.getElementById("status"),l=document.getElementById("cover"),i=document.getElementById("progressBack");let a={hideOnPause:!1,useLocalhost:!1,doFadeOut:!1,doDropShadow:!1};document.getElementById("loginButton").addEventListener("click",(()=>{const e=`https://accounts.spotify.com/authorize?client_id=198a9772670340b198435b615c0f3e19&response_type=code&redirect_uri=${encodeURIComponent(a.useLocalHost?"http://localhost:7934/oauth":"https://song.moth.li/oauth")}&scope=${encodeURIComponent("user-read-currently-playing user-read-playback-state")}`;window.location.href=e}));let r={titleanim:null,artistanim:null};function c(e){if(null!=e){cancelAnimationFrame(e.id),e.element.style.transform="translateX(0)";for(let t of e.timeouts)clearTimeout(t);e=null}}function d(e,t,o){t.offsetWidth,e.offsetWidth,e.style.transform="translateX(0)";let s,n=0,l=0,i=!0;return(o={timeouts:[],id:null,element:e}).timeouts.push(setTimeout((()=>{i=!1}),1e3)),o.id=requestAnimationFrame((function a(r){n||(n=r),s||(s=r);const c=r-n;n=r,i||(l-=.1*c,e.getBoundingClientRect().right<=t.getBoundingClientRect().right&&!i&&(i=!0,o.timeouts.push(setTimeout((()=>{l=0,o.timeouts.push(setTimeout((()=>{i=!1,s=r}),1e3))}),1e3))),e.style.transform=`translateX(${l}px)`),o.id=requestAnimationFrame(a)})),o}function p(){fetch("/api/nowplaying").then((e=>e.json())).then((e=>{if(e.song&&e.artist){const i=e.progress/e.duration*100,p=t.innerText,u=o.innerText;if(a.hideOnPause&&(document.querySelector(".now-playing").style.cssText=e.playing?"":"display:none;"),t.innerText=e.song,o.innerText=e.artist,o.style.display="",n.src=e.playing?"/assets/play.svg":"/assets/pause.svg",console.log(e.cover),console.log(null!=e.cover),l.src=null!=e.cover?e.cover:"/assets/weestspin.gif",s.style.width=`${i}%`,document.getElementById("songTitle").classList.add("scrolling-text"),t.innerText!=p){c(r.titleanim),t.style.width="auto";const e=document.getElementById("songContainer");t.offsetWidth>e.offsetWidth&&(r.titleanim=d(t,e),a.doDropShadow&&(t.style.width=`${t.offsetWidth+5}px`),a.doFadeOut&&(t.style.width=`${t.offsetWidth+32}px`))}if(o.innerText!=u){c(r.artistanim),o.style.width="auto";const e=document.getElementById("artistContainer");o.offsetWidth>e.offsetWidth&&(r.artistanim=d(o,e),a.doDropShadow&&(o.style.width=`${o.offsetWidth+5}px`),a.doFadeOut&&(o.style.width=`${o.offsetWidth+32}px`))}}else progress.style.width="0",n.src="/assets/error.svg",t.innerText="No song currently playing.",t.classList.remove("scrolling-text"),l.src="/assets/weestspin.gif",a.hideOnPause&&(document.querySelector(".now-playing").style.display="none"),c(r.titleanim),c(r.artistanim),t.style.animation="",o.style.animation="",o.innerText="",o.style.display="none"})).catch((e=>{console.error("Failed fetching now playing:",e)}))}function u(){fetch("/api/refreshtoken").then((e=>e.json())).then((e=>{e.success?console.log("Refreshed token."):console.error("Failed to refresh token. Please log in again.")}))}setInterval((()=>{console.log("running fetch"),p(),console.log("ran fetch")}),5e3),p(),setInterval(u,18e5),u();const g=new URLSearchParams(window.location.search);if("false"==g.get("showcover")&&(document.getElementById("cover").style.display="none",document.querySelector(".now-playing .top").style.gap="0"),"false"==g.get("showplayback")&&(document.getElementById("status").style.display="none",document.getElementById("progress").style.display="none",document.querySelector(".progress-back").style.display="none"),"false"==g.get("showstatus")&&(document.getElementById("status").style.display="none",document.querySelector(".now-playing .bottom").style.gap="0"),"true"==g.get("hideonpause")&&(a.hideOnPause=!0),"true"==g.get("uselocalhost")&&(a.useLocalHost=!0),"true"==g.get("dofadeout")&&(console.log("penis"),a.doFadeOut=!0,document.querySelector(".now-playing .top").style.cssText+="mask-image:linear-gradient(90deg, #000 88%, transparent);"),"true"==g.get("dropshadow")&&(a.doDropShadow=!0,t.style.textShadow="2px 2px 4px black, -2px -2px 4px black, 2px -2px 4px black, -2px 2px 4px black",t.style.paddingLeft="3px",o.style.textShadow="2px 2px 4px black, -2px -2px 4px black, 2px -2px 4px black, -2px 2px 4px black",o.style.paddingLeft="3px",i.style.filter="drop-shadow(2px 2px 2px black)",n.style.filter="drop-shadow(2px 2px 2px white) invert(100%)",l.style.filter="drop-shadow(2px 2px 2px black)"),g.has("clearcookies")&&(document.cookie='accessToken=""',document.cookie='refreshToken=""',window.location.refresh()),g.has("cssprops")){const e=g.get("cssprops");for(let t of e.split(";")){console.log(t);let e=t.split(":")[0],o=t.split(":")[1];console.log(e),console.log(o),document.body.style.cssText+=`--${e}:${o};`}}})();