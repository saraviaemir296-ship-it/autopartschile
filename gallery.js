(function(){
function initVehGallery(){
var imgs=document.querySelectorAll('.veh-gallery-img,.veh-gallery-thumbs img');
if(!imgs.length)return;
var overlay=document.createElement('div');
overlay.className='veh-lightbox';
overlay.innerHTML='<span class="veh-lightbox-close">&times;</span><img src="" alt="">';
document.body.appendChild(overlay);
var lbImg=overlay.querySelector('img');
function close(){overlay.classList.remove('active');}
overlay.addEventListener('click',close);
imgs.forEach(function(img){
img.addEventListener('click',function(){
lbImg.src=img.getAttribute('src');
lbImg.alt=img.getAttribute('alt')||'';
overlay.classList.add('active');
});
});
}
if(document.readyState==='loading'){document.addEventListener('DOMContentLoaded',initVehGallery);}else{initVehGallery();}
})();
