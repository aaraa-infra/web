import fs from 'node:fs/promises';
import path from 'node:path';
import { getHomepageSeoTitle } from './company-info.js';

const ROOT=path.join(process.cwd(),'legacy-pages');
const decode=(v='')=>v.replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&lt;/g,'<').replace(/&gt;/g,'>');
function attr(tag,name){const m=tag.match(new RegExp(`${name}\\s*=\\s*["']([^"']*)["']`,'i'));return m?decode(m[1]):''}

function resolveRelative(sourcePath, href) {
  if (!href) return href;
  if (href.startsWith('/') || href.startsWith('http://') || href.startsWith('https://') || href.startsWith('//') || href.startsWith('data:') || href.startsWith('tel:') || href.startsWith('mailto:') || href.startsWith('javascript:')) {
    return href;
  }
  const cleanHref = href.replace(/\\/g, '/');
  let finalHref = cleanHref;
  if (cleanHref.startsWith('..css/')) {
    finalHref = '../css/' + cleanHref.substring(6);
  } else if (cleanHref.startsWith('..js/')) {
    finalHref = '../js/' + cleanHref.substring(5);
  } else if (cleanHref.startsWith('..image/')) {
    finalHref = '../image/' + cleanHref.substring(8);
  }
  const fileDir = path.dirname(sourcePath).replace(/\\/g, '/');
  const resolved = path.posix.resolve('/' + (fileDir === '.' ? '' : fileDir), finalHref);
  return resolved;
}

function resolveBodyUrls(bodyHtml, sourcePath) {
  return bodyHtml.replace(/\b(src|href)\s*=\s*(["'])([^>]*?)\2/gi, (match, attrName, quote, value) => {
    if (value.startsWith('/') || value.startsWith('http://') || value.startsWith('https://') || value.startsWith('//') || value.startsWith('#') || value.startsWith('mailto:') || value.startsWith('tel:') || value.startsWith('javascript:')) {
      return match;
    }
    const resolved = resolveRelative(sourcePath, value);
    return `${attrName}=${quote}${resolved}${quote}`;
  });
}

function sanitizeSafeExternalLinks(bodyHtml) {
  if (!bodyHtml) return bodyHtml;
  return bodyHtml.replace(/<a\b([^>]*\btarget=["']_blank["'][^>]*)>/gi, (match, attrs) => {
    if (/\brel\s*=/i.test(attrs)) {
      return match.replace(/\brel=(["'])([^"']*)\1/gi, (relMatch, q, relVal) => {
        let values = relVal.split(/\s+/).filter(Boolean);
        if (!values.includes('noopener')) values.push('noopener');
        if (!values.includes('noreferrer')) values.push('noreferrer');
        return `rel=${q}${values.join(' ')}${q}`;
      });
    }
    return `<a ${attrs} rel="noopener noreferrer">`;
  });
}

export function optimizeSeoTitle(title = '') {
  if (!title) return title;
  let t = title.trim();

  // 1. Clean excessively long verbose brand tags
  t = t.replace(/\s*–\s*AARAA Infrastructure\s*\|\s*Leading Construction Experts in Chennai/gi, ' | AARAA Infrastructure');
  t = t.replace(/\s*\|\s*Leading Construction Experts in Chennai/gi, ' | AARAA Infrastructure');
  t = t.replace(/\s*\|\s*AARAA Infrastructure Pvt\.?\s*Ltd\.?/gi, ' | AARAA Infrastructure');
  t = t.replace(/\s*-\s*AARAA Infrastructure Pvt\.?\s*Ltd\.?/gi, ' | AARAA Infrastructure');
  t = t.replace(/\s*\|\s*Aaraa Infrastructure Pvt\.?\s*Ltd\.?/gi, ' | AARAA Infrastructure');

  // 2. If title starts with brand name, remove trailing brand suffix to avoid stutter
  if (/^Aaraa\s+Infrastructure/i.test(t)) {
    t = t.replace(/\s*\|\s*AARAA\s*Infrastructure.*$/i, '');
    t = t.replace(/\s*\|\s*Aaraa\s*Infrastructure.*$/i, '');
    t = t.replace(/\s*\|\s*AARAA.*$/i, '');
  }

  // 3. If over 60 characters, gracefully compact brand suffix
  if (t.length > 60) {
    t = t.replace(/\s*\|\s*AARAA Infrastructure/gi, ' | AARAA');
    t = t.replace(/\s*\|\s*Aaraa Infrastructure/gi, ' | AARAA');
    t = t.replace(/\s*-\s*AARAA Infrastructure/gi, ' | AARAA');
  }

  // 4. Remove entity suffixes if still over 60
  if (t.length > 60) {
    t = t.replace(/\s+Pvt\.?\s+Ltd\.?/gi, '');
  }

  return t.trim();
}

function rewriteLegacyInternalLinks(bodyHtml) {
  if (!bodyHtml) return bodyHtml;
  return bodyHtml
    .replace(/\bhref=(["'])\/index(?:\.html)?\/?\1/gi, 'href=$1/$1')
    .replace(/\bhref=(["'])\/400-mld-swro-desalination-project-perur-chennai(?:\.html)?\/?\1/gi, 'href=$1/blog/400-mld-swro-desalination-project-perur-chennai$1')
    .replace(/\bhref=(["'])\/blog\/reliance-civil-interior-works-pallikaranai-chennai(?:\.html)?\/?\1/gi, 'href=$1/blog/reliance-civil-interior-mep-fitout-chennai$1')
    .replace(/\bhref=(["'])\/forms\/subcontractor\/?\1/gi, 'href=$1/subcontractor-empanelment$1')
    .replace(/\bhref=(["'])\/forms\/partnership\/?\1/gi, 'href=$1/strategic-partnerships$1')
    .replace(/\bhref=(["'])\/forms\/vendor\/?\1/gi, 'href=$1/vendor-registration$1')
    .replace(/\bhref=(["'])\/forms\/joint-venture\/?\1/gi, 'href=$1/joint-ventures$1')
    .replace(/\bhref=(["'])\/forms\/careers\/?\1/gi, 'href=$1/careers$1')
    .replace(/\bhref=(["'])\/forms\/quick-enquiry\/?\1/gi, 'href=$1/contact-us$1');
}

let imageMetadataMap = null;
async function getImageMetadataMap() {
  if (imageMetadataMap) return imageMetadataMap;
  try {
    const raw = await fs.readFile(path.join(process.cwd(), 'lib/image-metadata-map.json'), 'utf8');
    imageMetadataMap = JSON.parse(raw);
  } catch (e) {
    imageMetadataMap = {};
  }
  return imageMetadataMap;
}

function enrichImages(bodyHtml, sourcePath, imgMap = {}) {
  if (!bodyHtml) return bodyHtml;
  let imgIndex = 0;
  return bodyHtml.replace(/<img\b([^>]*?)>/gi, (match, attrs) => {
    imgIndex++;
    let newAttrs = attrs;

    const srcMatch = newAttrs.match(/src=(["'])(.*?)\1/i);
    if (!srcMatch) return match;
    const rawSrc = srcMatch[2];
    let cleanSrc = rawSrc.split('?')[0].split('#')[0];
    if (cleanSrc.startsWith('http://') || cleanSrc.startsWith('https://')) {
      try {
        cleanSrc = new URL(cleanSrc).pathname;
      } catch (e) {}
    }
    cleanSrc = cleanSrc.replace(/\\/g, '/');

    const hasWidth = /\bwidth\s*=/i.test(newAttrs);
    const hasHeight = /\bheight\s*=/i.test(newAttrs);
    if (!hasWidth || !hasHeight) {
      let meta = imgMap[cleanSrc] || imgMap['/' + cleanSrc] || imgMap[cleanSrc.replace(/^\//, '')];
      if (!meta && cleanSrc.startsWith('/image-watermarked/')) {
        meta = imgMap[cleanSrc.replace('/image-watermarked/', '/image/')];
      }
      if (!meta) {
        const wMatch = rawSrc.match(/[?&]w=(\d+)/i);
        const hMatch = rawSrc.match(/[?&]h=(\d+)/i);
        if (wMatch && hMatch) {
          meta = { width: parseInt(wMatch[1], 10), height: parseInt(hMatch[1], 10) };
        }
      }
      if (meta && meta.width && meta.height) {
        if (!hasWidth) newAttrs += ` width="${meta.width}"`;
        if (!hasHeight) newAttrs += ` height="${meta.height}"`;
      }
    }

    const altMatch = newAttrs.match(/alt=(["'])(.*?)\1/i);
    if (!altMatch) {
      const cleanName = path.basename(cleanSrc, path.extname(cleanSrc)).replace(/[-_]+/g, ' ');
      newAttrs += ` alt="${cleanName}"`;
    } else if (altMatch[2].trim() === '#') {
      const cleanName = path.basename(cleanSrc, path.extname(cleanSrc)).replace(/[-_]+/g, ' ');
      newAttrs = newAttrs.replace(/alt=(["'])#\1/i, `alt="${cleanName}"`);
    }

    const isHero = imgIndex === 1 || /\bclass=(["'])[^"']*(?:hero|banner|page-title)[^"']*\1/i.test(newAttrs);
    if (isHero) {
      newAttrs = newAttrs.replace(/\s*loading=(["'])lazy\1/gi, '');
      if (!/\bfetchpriority\s*=/i.test(newAttrs)) {
        newAttrs += ' fetchpriority="high"';
      }
      if (!/\bloading\s*=/i.test(newAttrs)) {
        newAttrs += ' loading="eager"';
      }
    } else {
      if (!/\bloading\s*=/i.test(newAttrs)) {
        newAttrs += ' loading="lazy"';
      }
      if (!/\bdecoding\s*=/i.test(newAttrs)) {
        newAttrs += ' decoding="async"';
      }
    }

    return `<img ${newAttrs.replace(/\s+/g, ' ').trim()}>`;
  });
}

function candidates(parts=[]){const raw=parts.map(decodeURIComponent).join('/');if(raw.includes('..')||raw.includes('\\')||raw.includes('\0'))return[];if(!raw)return['index.html'];const s=raw.replace(/^\/+|\/+$/g,'');return s.endsWith('.html')?[s]:[`${s}.html`,`${s}/index.html`]}

export async function loadLegacyPage(parts=[]){
  const imgMap = await getImageMetadataMap();
  for(const rel of candidates(parts)){
    const file=path.resolve(ROOT,rel);
    if(!file.startsWith(path.resolve(ROOT)+path.sep))continue;
    try{
      const raw=await fs.readFile(file,'utf8');
      return parse(raw.replace(/\r\n/g,'\n').replace(/\r/g,'\n'),rel, imgMap);
    }catch(e){
      if(e?.code!=='ENOENT')throw e;
    }
  }
  return null;
}

function parse(html,sourcePath, imgMap = {}){
  const head=html.match(/<head[^>]*>([\s\S]*?)<\/head>/i)?.[1]||'';
  let body=html.match(/<body[^>]*>([\s\S]*?)<\/body>/i)?.[1]||html;
  const bodyAttrs=html.match(/<body([^>]*)>/i)?.[1]||'';
  
  const preloadLinks=[...head.matchAll(/<link\b[^>]*rel=["'](?:preload|preconnect|dns-prefetch)["'][^>]*>/gi)]
    .map(x=>{
      const tag=x[0];
      const rel=attr(tag,'rel');
      const href=attr(tag,'href');
      const as=attr(tag,'as')||undefined;
      const type=attr(tag,'type')||undefined;
      const media=attr(tag,'media')||undefined;
      const crossOrigin=tag.includes('crossorigin')?(attr(tag,'crossorigin')||''):undefined;
      const fetchPriority=attr(tag,'fetchpriority')||undefined;
      return{
        rel,
        href:resolveRelative(sourcePath,href),
        as,
        type,
        media,
        crossOrigin,
        fetchPriority
      };
    })
    .filter(x=>x.href);

  const stylesheets=[...head.matchAll(/<link\b[^>]*rel=["'][^"']*stylesheet[^"']*["'][^>]*>/gi)]
    .map(x=>({href:resolveRelative(sourcePath, attr(x[0],'href')),media:attr(x[0],'media')||undefined}))
    .filter(x=>x.href);
    
  const inlineStyles=[...head.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gi)].map(x=>x[1]);
  
  const scripts=[];
  const collect=m=>m.replace(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi,(_,a,code)=>{
    const tag=`<script ${a}>`;
    const rawSrc=attr(tag,'src');
    scripts.push({
      src:rawSrc ? resolveRelative(sourcePath, rawSrc) : null,
      type:attr(tag,'type')||null,
      async:/\basync\b/i.test(a),
      defer:/\bdefer\b/i.test(a),
      code:code||''
    });
    return''
  });
  
  collect(head);
  body=collect(body);
  body=resolveBodyUrls(body, sourcePath);
  body=sanitizeSafeExternalLinks(body);
  body=rewriteLegacyInternalLinks(body);
  body=enrichImages(body, sourcePath, imgMap);
  
  const isHomepage = sourcePath === 'index.html' || sourcePath === '' || sourcePath === 'index';
  const rawTitle = isHomepage
    ? getHomepageSeoTitle()
    : decode(head.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.trim() || 'AARAA Infrastructure');
  const title = isHomepage ? rawTitle : optimizeSeoTitle(rawTitle);
  const mt=head.match(/<meta\b[^>]*name=["']description["'][^>]*>/i)?.[0]||'';
  const ct=head.match(/<link\b[^>]*rel=["']canonical["'][^>]*>/i)?.[0]||'';
  return {
    sourcePath,
    title,
    description:attr(mt,'content'),
    canonical:attr(ct,'href'),
    bodyClass:attr(`<body ${bodyAttrs}>`,'class'),
    body,
    preloadLinks,
    stylesheets,
    inlineStyles,
    scripts
  };
}
