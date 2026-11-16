import{i as e,t}from"./localization-settings.eIsGklDn.js?dpl=dpl_B9LRsPjk87erR6E1pBxu2SfWD3HS";function n(e){let t=e.trim().replace(/\r\n?/g,`
`).split(/\n[ \t]*\n+/),n=[];for(let e of t){let t=/^(?:(\d+)\n)?(\d{2}:[0-5]\d:[0-5]\d),(\d{3}) --> (\d{2}:[0-5]\d:[0-5]\d),(\d{3})\n([\s\S]+)$/.exec(e);if(!t)return;let[,r,i,a,o,s,c]=t;if(i+a>=o+s)return;n.push(`${r?r+`
`:``}${i}.${a} --> ${o}.${s}\n${c}`)}return`WEBVTT

`+n.join(`

`)+`
`}async function r(e,t,r){try{let i=new URL(e.dataset.localizedCaptionVideo,document.baseURI),a=i.pathname.lastIndexOf(`.`);if(a<=i.pathname.lastIndexOf(`/`))return;i.pathname=i.pathname.slice(0,a)+`-${t}.srt`;let o=await fetch(i);if(!o.ok)return;let s=n(await o.text());if(!s||!e.isConnected)return;e.src=`data:text/vtt;charset=utf-8,`+encodeURIComponent(s),e.srclang=t,e.label=r}catch{}}var i=new WeakSet;function a(){let n=new URL(window.location.href),a=n.pathname.split(`/`)[1],o=t.has(a)?a:e(n),s=o&&t.get(o);if(o&&s)for(let e of document.querySelectorAll(`video > track[data-localized-caption-video]`))i.has(e)||(i.add(e),e.default=!0,e.track.mode=`showing`,r(e,o,s))}a(),document.addEventListener(`astro:page-load`,a);