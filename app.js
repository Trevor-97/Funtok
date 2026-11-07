const feed=document.querySelector("#feed");
const input=document.querySelector("#videoInput");
const toast=document.querySelector("#toast");
let activeCard=null;
function notify(message){toast.textContent=message;toast.classList.add("show");setTimeout(()=>toast.classList.remove("show"),1900)}
function bindCard(card){
  card.querySelector(".like")?.addEventListener("click",e=>{const b=e.currentTarget;b.classList.toggle("liked");b.firstChild.textContent=b.classList.contains("liked")?"♥":"♡";const n=b.querySelector("small");let v=parseInt(n.textContent.replace(/[^\d]/g,""))||0;n.textContent=(v+(b.classList.contains("liked")?1:-1)).toLocaleString()});
  card.querySelector(".follow")?.addEventListener("click",e=>{const b=e.currentTarget;b.classList.toggle("following");b.textContent=b.classList.contains("following")?"Following":"Follow"});
  card.querySelector(".comments")?.addEventListener("click",()=>{activeCard=card;document.querySelector("#commentsModal").classList.add("open")});
  card.querySelector(".share")?.addEventListener("click",async()=>{try{await navigator.clipboard.writeText(location.href);notify("FunTok link copied!")}catch{notify("Share this page with a friend!")}})
}
document.querySelectorAll(".video-card").forEach(bindCard);
document.querySelector("#uploadBtn").addEventListener("click",()=>input.click());
input.addEventListener("change",()=>{
 const file=input.files?.[0];if(!file)return;
 if(!file.type.startsWith("video/")){notify("Please choose a video file.");return}
 const url=URL.createObjectURL(file),card=document.createElement("article");card.className="video-card";
 card.innerHTML=`<video class="uploaded-video" src="${url}" controls playsinline loop autoplay muted></video><div class="video-shade"></div><div class="video-info"><div class="creator"><span class="avatar">Y</span><b>@you</b><button class="follow">Edit profile</button></div><p>${file.name.replace(/[&<>"]/g,"")} · My new FunTok video 🎬</p><span class="sound">♫ original sound — you</span></div><div class="actions"><button class="action like">♡<small>0</small></button><button class="action comments">▢<small>0</small></button><button class="action share">➤<small>Share</small></button><span class="record">♫</span></div>`;
 feed.prepend(card);bindCard(card);card.scrollIntoView({behavior:"smooth"});notify("Your video was added to this preview.");input.value="";
});
document.querySelectorAll(".modal .close").forEach(b=>b.addEventListener("click",()=>b.closest(".modal").classList.remove("open")));
document.querySelectorAll(".modal").forEach(m=>m.addEventListener("click",e=>{if(e.target===m)m.classList.remove("open")}));
document.querySelector("#commentForm").addEventListener("submit",e=>{e.preventDefault();const field=document.querySelector("#commentInput"),value=field.value.trim();if(!value)return;const list=document.querySelector("#commentList");if(list.querySelector(".muted"))list.innerHTML="";const p=document.createElement("p");p.textContent="You: "+value;list.append(p);field.value=""});
document.querySelector("#searchBtn").addEventListener("click",()=>document.querySelector("#searchModal").classList.add("open"));
document.querySelector("#searchInput").addEventListener("keydown",e=>{if(e.key==="Enter"){const term=e.target.value.toLowerCase();let count=0;document.querySelectorAll(".video-card").forEach(c=>{const match=c.innerText.toLowerCase().includes(term);c.style.display=match?"":"none";if(match)count++});document.querySelector("#searchModal").classList.remove("open");notify(`${count} matching video(s)`)}});
document.querySelectorAll(".tab").forEach(t=>t.addEventListener("click",()=>{document.querySelectorAll(".tab").forEach(x=>x.classList.remove("active"));t.classList.add("active");if(t.dataset.feed==="following"){notify("Follow creators to build your Following feed.")}else{document.querySelectorAll(".video-card").forEach(c=>c.style.display="")}}));
document.querySelectorAll(".nav-item").forEach(b=>b.addEventListener("click",()=>{document.querySelectorAll(".nav-item").forEach(x=>x.classList.remove("selected"));b.classList.add("selected");if(b.dataset.nav!=="home")notify(`${b.dataset.nav[0].toUpperCase()+b.dataset.nav.slice(1)} is a demo section.`)}));
if("serviceWorker" in navigator && location.protocol.startsWith("http"))navigator.serviceWorker.register("./sw.js").catch(()=>{});
