#!/usr/bin/env node
// build.mjs — gerador de site estático vanilla.
//
// Uso:
//   node build.mjs            # build único
//   node build.mjs --watch    # rebuild quando content/ ou templates/ mudam
//   node build.mjs --serve    # mais um servidor HTTP local na porta 4000

import { readFile, writeFile, readdir, mkdir, copyFile, rm, stat } from 'node:fs/promises';
import { existsSync, watch as fsWatch } from 'node:fs';
import { dirname, join, basename, extname } from 'node:path';
import { createServer } from 'node:http';
import { marked } from 'marked';

const ROOT = process.cwd();
const CONTENT = join(ROOT, 'content');
const TEMPLATES = join(ROOT, 'templates');

const SITE = {
  title: 'Fernando Moreira',
  description: 'Site pessoal — PhD em liveness detection, jogos de tabuleiro, comics, impressão 3D.',
  url: 'https://fernandofreitasmoreira.github.io',
  lang: 'pt-PT',
  author: 'Fernando Moreira',
  email: 'fernando.freitas.moreira@gmail.com',
  sections: {
    phd: { title: 'PhD', description: 'Investigação em liveness detection on-device. Universidade do Minho.' },
    livros: { title: 'Livros', description: 'Textos longos e ensaios em formato de livro, em torno da cidadania digital.', kind: 'books' },
    boardgames: { title: 'Jogos de tabuleiro', description: 'Críticas, sessões, listas e descobertas.' },
    comics: { title: 'Comics', description: 'Leituras, descobertas, recomendações.' },
    '3dprint': { title: 'Impressão 3D', description: 'Projectos, peças, aprendizagens, falhanços.' },
    outros: { title: 'Outros', description: 'Tudo o que não cabe nas outras secções: meta, ferramentas, ideias avulsas.' },
  },
};

// Páginas estáticas no topo de content/ (cada *.md à raiz que não seja index.md)
// É descoberto dinamicamente em discoverStaticPages() — esta lista é só para
// limpeza de outputs entre builds.
const STATIC_PAGES = ['about', 'privacidade', 'conversas'];

// Output dirs gerados pelo build (limpos antes de cada build, para evitar lixo)
const OUTPUT_DIRS = [...STATIC_PAGES, ...Object.keys(SITE.sections)];

// Sections that use post-style listing (excluding books which have their own pipeline)
const POST_SECTIONS = Object.fromEntries(
  Object.entries(SITE.sections).filter(([, s]) => s.kind !== 'books')
);

// ---------------------------------------------------------------------------
// Helpers

const args = process.argv.slice(2);
const WATCH = args.includes('--watch');
const SERVE = args.includes('--serve');

async function readText(path) {
  return readFile(path, 'utf8');
}

async function writeText(path, content) {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, content);
}

function parseFrontmatter(md) {
  const m = md.match(/^---\r?\n([\s\S]+?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!m) return { meta: {}, body: md };
  const meta = {};
  for (const raw of m[1].split(/\r?\n/)) {
    const mm = raw.match(/^(\w[\w-]*):\s*(.*)$/);
    if (!mm) continue;
    let v = mm[2].trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    meta[mm[1]] = v;
  }
  return { meta, body: m[2] };
}

function renderMd(md) {
  return marked.parse(md, { gfm: true, breaks: false });
}

function fillTemplate(tpl, vars) {
  return tpl.replace(/\{\{(\w+)\}\}/g, (_, key) => (vars[key] !== undefined ? vars[key] : ''));
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

function formatDate(iso, lang = SITE.lang) {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(lang, { year: 'numeric', month: 'long', day: 'numeric' });
}

async function copyDir(src, dst, skip = new Set()) {
  await mkdir(dst, { recursive: true });
  for (const entry of await readdir(src, { withFileTypes: true })) {
    if (skip.has(entry.name)) continue;
    const s = join(src, entry.name);
    const d = join(dst, entry.name);
    if (entry.isDirectory()) await copyDir(s, d, skip);
    else if (entry.isFile()) await copyFile(s, d);
  }
}

// ---------------------------------------------------------------------------
// Discover content

async function discoverPosts() {
  const posts = [];
  for (const section of Object.keys(POST_SECTIONS)) {
    const sdir = join(CONTENT, section);
    if (!existsSync(sdir)) continue;
    for (const entry of await readdir(sdir, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      const indexPath = join(sdir, entry.name, 'index.md');
      if (!existsSync(indexPath)) continue;
      const raw = await readText(indexPath);
      const { meta, body } = parseFrontmatter(raw);
      if (meta.draft === 'true') continue;
      const slug = entry.name.replace(/^\d{4}-\d{2}-\d{2}-/, '');
      posts.push({
        section,
        slug,
        srcDir: join(sdir, entry.name),
        title: meta.title || entry.name,
        date: meta.date || '',
        summary: meta.summary || '',
        body,
      });
    }
  }
  posts.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  return posts;
}

// Books: content/livros/<book>/_meta.md + chapter files NN-slug.md
async function discoverBooks() {
  const books = [];
  const livrosDir = join(CONTENT, 'livros');
  if (!existsSync(livrosDir)) return books;
  for (const entry of await readdir(livrosDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const bookDir = join(livrosDir, entry.name);
    const metaPath = join(bookDir, '_meta.md');
    if (!existsSync(metaPath)) continue;
    const { meta, body: preface } = parseFrontmatter(await readText(metaPath));
    if (meta.draft === 'true') continue;
    const chapters = [];
    for (const file of await readdir(bookDir)) {
      if (!file.endsWith('.md') || file === '_meta.md') continue;
      const raw = await readText(join(bookDir, file));
      const { meta: cmeta, body: cbody } = parseFrontmatter(raw);
      if (cmeta.draft === 'true') continue;
      const slugFile = file.replace(/\.md$/, '');           // 01-titulo
      const slug = slugFile.replace(/^\d+-/, '');            // titulo (URL)
      const order = parseInt(slugFile.match(/^(\d+)/)?.[1] || '999', 10);
      chapters.push({
        slugFile,
        slug,
        order,
        kind: cmeta.kind || 'capitulo',     // introducao | capitulo | conclusao | apendice
        number: cmeta.number || '',         // override do label
        title: cmeta.title || slug,
        subtitle: cmeta.subtitle || '',
        summary: cmeta.summary || '',
        body: cbody,
      });
    }
    chapters.sort((a, b) => a.order - b.order);
    books.push({
      slug: entry.name,
      title: meta.title || entry.name,
      subtitle: meta.subtitle || '',
      author: meta.author || SITE.author,
      year: meta.year || '',
      version: meta.version || '',
      version_note: meta.version_note || '',
      summary: meta.summary || '',
      preface,
      chapters,
    });
  }
  return books;
}

// ---------------------------------------------------------------------------
// Render fragments

function renderNav() {
  return Object.entries(SITE.sections)
    .map(([slug, s]) => `<a href="/${slug}/">${s.title}</a>`)
    .join('\n      ');
}

function renderPostCard(p) {
  const dateStr = formatDate(p.date);
  return `<article class="card">
  <a href="/${p.section}/${p.slug}/">
    <h3>${escapeHtml(p.title)}</h3>
    <p class="meta"><time datetime="${p.date}">${dateStr}</time> · ${SITE.sections[p.section].title}</p>
    ${p.summary ? `<p>${escapeHtml(p.summary)}</p>` : ''}
  </a>
</article>`;
}

// Bloco de convite a responder por email — colocado no fim de cada post
// e capítulo de livro. O subject é pré-preenchido para facilitar a
// triagem quando os emails chegam.
function renderResponseBlock(contextLabel) {
  const subject = encodeURIComponent(`Sobre: ${contextLabel}`);
  return `<aside class="post-response">
<p>Tens algo a dizer sobre este texto? <a href="mailto:${SITE.email}?subject=${subject}">Escreve-me</a>. As melhores trocas — com permissão tua — aparecerão em <a href="/conversas/">/conversas/</a>.</p>
</aside>`;
}

function wrapInBase(templates, vars) {
  return fillTemplate(templates.base, {
    lang: SITE.lang,
    site_title: SITE.title,
    year: new Date().getFullYear(),
    nav: renderNav(),
    canonical: vars.canonical || SITE.url,
    description: vars.description || SITE.description,
    title: vars.title,
    content: vars.content,
  });
}

// ---------------------------------------------------------------------------
// Build steps

async function cleanOutputs() {
  for (const dir of OUTPUT_DIRS) {
    const path = join(ROOT, dir);
    if (existsSync(path)) await rm(path, { recursive: true, force: true });
  }
  for (const f of ['index.html', 'feed.xml']) {
    const path = join(ROOT, f);
    if (existsSync(path)) await rm(path, { force: true });
  }
}

async function buildHome(templates, posts) {
  const indexMd = join(CONTENT, 'index.md');
  const intro = existsSync(indexMd)
    ? renderMd(parseFrontmatter(await readText(indexMd)).body)
    : `<h1>${escapeHtml(SITE.title)}</h1><p>${escapeHtml(SITE.description)}</p>`;
  const recent = posts.length
    ? posts.slice(0, 6).map(renderPostCard).join('\n')
    : '<p class="empty">Ainda sem posts publicados.</p>';
  const sections = Object.entries(SITE.sections)
    .map(([slug, s]) =>
      `<li><a href="/${slug}/"><strong>${s.title}</strong> — ${escapeHtml(s.description)}</a></li>`
    )
    .join('\n    ');
  const home = fillTemplate(templates.home, { intro, recent, sections });
  const html = wrapInBase(templates, {
    title: SITE.title,
    canonical: SITE.url + '/',
    content: home,
  });
  await writeText(join(ROOT, 'index.html'), html);
  console.log('  ✓ /');
}

async function buildStaticPages(templates) {
  for (const slug of STATIC_PAGES) {
    const md = join(CONTENT, `${slug}.md`);
    if (!existsSync(md)) continue;
    const { meta, body } = parseFrontmatter(await readText(md));
    const inner = fillTemplate(templates.page, {
      title: escapeHtml(meta.title || slug),
      content: renderMd(body),
    });
    const html = wrapInBase(templates, {
      title: `${meta.title || slug} · ${SITE.title}`,
      description: meta.summary || SITE.description,
      canonical: `${SITE.url}/${slug}/`,
      content: inner,
    });
    await writeText(join(ROOT, slug, 'index.html'), html);
    console.log(`  ✓ /${slug}/`);
  }
}

async function buildSections(templates, allPosts) {
  for (const [slug, s] of Object.entries(POST_SECTIONS)) {
    const posts = allPosts.filter((p) => p.section === slug);
    const list = posts.length
      ? posts.map(renderPostCard).join('\n')
      : '<p class="empty">Ainda sem posts nesta secção.</p>';
    const inner = fillTemplate(templates.list, {
      section_title: escapeHtml(s.title),
      section_description: escapeHtml(s.description),
      posts: list,
    });
    const html = wrapInBase(templates, {
      title: `${s.title} · ${SITE.title}`,
      description: s.description,
      canonical: `${SITE.url}/${slug}/`,
      content: inner,
    });
    await writeText(join(ROOT, slug, 'index.html'), html);
    console.log(`  ✓ /${slug}/`);
  }
}

// ---------------------------------------------------------------------------
// Books

function chapterKindLabel(ch) {
  if (ch.number) return ch.number;
  if (ch.kind === 'introducao') return 'Introdução';
  if (ch.kind === 'conclusao') return 'Conclusão';
  if (ch.kind === 'apendice') return 'Apêndice';
  // numbered chapter — use the order from filename
  return `Capítulo ${ch.order}`;
}

async function buildLivrosIndex(templates, books) {
  const list = books.length
    ? books.map((b) => `<article class="book-card">
  <a href="/livros/${b.slug}/">
    <p class="book-card-meta">${escapeHtml(b.author)}${b.year ? ' · ' + escapeHtml(b.year) : ''}${b.version ? ' · ' + escapeHtml(b.version) : ''}</p>
    <h3>${escapeHtml(b.title)}</h3>
    ${b.subtitle ? `<p class="book-card-subtitle">${escapeHtml(b.subtitle)}</p>` : ''}
    ${b.summary ? `<p>${escapeHtml(b.summary)}</p>` : ''}
  </a>
</article>`).join('\n')
    : '<p class="empty">Ainda sem livros publicados.</p>';
  const inner = fillTemplate(templates.livrosIndex, {
    section_title: 'Livros',
    section_description: SITE.sections.livros.description,
    books: list,
  });
  const html = wrapInBase(templates, {
    title: `Livros · ${SITE.title}`,
    description: SITE.sections.livros.description,
    canonical: `${SITE.url}/livros/`,
    content: inner,
  });
  await writeText(join(ROOT, 'livros', 'index.html'), html);
  console.log('  ✓ /livros/');
}

async function buildBookCover(templates, book) {
  const tocItems = book.chapters.map((ch) => {
    const label = chapterKindLabel(ch);
    return `<li class="toc-item toc-${ch.kind}">
  <a href="/livros/${book.slug}/${ch.slug}/">
    <span class="toc-kind">${escapeHtml(label)}</span>
    <span class="toc-title">${escapeHtml(ch.title)}</span>
  </a>
</li>`;
  }).join('\n');

  const versionBanner = book.version
    ? `<aside class="version-banner" role="note">
  <strong>${escapeHtml(book.version)}</strong>${book.version_note ? ' — ' + escapeHtml(book.version_note) : ''}
</aside>`
    : '';

  const inner = fillTemplate(templates.bookCover, {
    title: escapeHtml(book.title),
    subtitle_block: book.subtitle ? `<p class="book-subtitle">${escapeHtml(book.subtitle)}</p>` : '',
    author: escapeHtml(book.author),
    year: book.year ? escapeHtml(book.year) : '',
    year_block: book.year ? ` · ${escapeHtml(book.year)}` : '',
    version_banner: versionBanner,
    summary: book.summary ? `<p class="book-summary-text">${escapeHtml(book.summary)}</p>` : '',
    preface: renderMd(book.preface || ''),
    chapters_list: tocItems,
  });
  const html = wrapInBase(templates, {
    title: `${book.title} · ${SITE.title}`,
    description: book.summary || book.subtitle || SITE.description,
    canonical: `${SITE.url}/livros/${book.slug}/`,
    content: inner,
  });
  await writeText(join(ROOT, 'livros', book.slug, 'index.html'), html);
  console.log(`  ✓ /livros/${book.slug}/`);
}

async function buildBookChapter(templates, book, chapter, prev, next) {
  const prevBlock = prev
    ? `<a href="/livros/${book.slug}/${prev.slug}/" class="chapter-prev"><span class="nav-label">Anterior</span><span class="nav-title">${escapeHtml(prev.title)}</span></a>`
    : `<a href="/livros/${book.slug}/" class="chapter-prev"><span class="nav-label">Voltar</span><span class="nav-title">Capa do livro</span></a>`;
  const nextBlock = next
    ? `<a href="/livros/${book.slug}/${next.slug}/" class="chapter-next"><span class="nav-label">Próximo</span><span class="nav-title">${escapeHtml(next.title)}</span></a>`
    : `<a href="/livros/${book.slug}/" class="chapter-next"><span class="nav-label">Concluído</span><span class="nav-title">Voltar à capa</span></a>`;

  const inner = fillTemplate(templates.bookChapter, {
    book_slug: book.slug,
    book_title: escapeHtml(book.title),
    chapter_kind: escapeHtml(chapterKindLabel(chapter)),
    title: escapeHtml(chapter.title),
    subtitle_block: chapter.subtitle ? `<p class="chapter-subtitle">${escapeHtml(chapter.subtitle)}</p>` : '',
    content: renderMd(chapter.body),
    prev: prevBlock,
    next: nextBlock,
    response_block: renderResponseBlock(`${book.title} — ${chapter.title}`),
  });
  const html = wrapInBase(templates, {
    title: `${chapter.title} · ${book.title} · ${SITE.title}`,
    description: chapter.summary || chapter.subtitle || book.summary,
    canonical: `${SITE.url}/livros/${book.slug}/${chapter.slug}/`,
    content: inner,
  });
  await writeText(join(ROOT, 'livros', book.slug, chapter.slug, 'index.html'), html);
  console.log(`  ✓ /livros/${book.slug}/${chapter.slug}/`);
}

async function buildBooks(templates, books) {
  await buildLivrosIndex(templates, books);
  for (const book of books) {
    await buildBookCover(templates, book);
    for (let i = 0; i < book.chapters.length; i++) {
      const ch = book.chapters[i];
      const prev = i > 0 ? book.chapters[i - 1] : null;
      const next = i < book.chapters.length - 1 ? book.chapters[i + 1] : null;
      await buildBookChapter(templates, book, ch, prev, next);
    }
  }
}

async function buildPosts(templates, posts) {
  for (const p of posts) {
    const inner = fillTemplate(templates.post, {
      title: escapeHtml(p.title),
      date: formatDate(p.date),
      date_iso: p.date,
      section: SITE.sections[p.section].title,
      section_slug: p.section,
      summary_block: p.summary ? `<p class="post-summary">${escapeHtml(p.summary)}</p>` : '',
      content: renderMd(p.body),
      response_block: renderResponseBlock(p.title),
    });
    const html = wrapInBase(templates, {
      title: `${p.title} · ${SITE.title}`,
      description: p.summary || SITE.description,
      canonical: `${SITE.url}/${p.section}/${p.slug}/`,
      content: inner,
    });
    const outDir = join(ROOT, p.section, p.slug);
    await writeText(join(outDir, 'index.html'), html);
    // copy adjacent assets (imagens, ficheiros)
    for (const entry of await readdir(p.srcDir, { withFileTypes: true })) {
      if (entry.name === 'index.md' || entry.name.startsWith('.')) continue;
      if (entry.isFile()) {
        await copyFile(join(p.srcDir, entry.name), join(outDir, entry.name));
      }
    }
    console.log(`  ✓ /${p.section}/${p.slug}/`);
  }
}

async function buildFeed(posts) {
  const updated = new Date().toISOString();
  const entries = posts.slice(0, 20).map((p) => {
    const iso = new Date(p.date).toISOString();
    return `  <entry>
    <title>${escapeHtml(p.title)}</title>
    <link rel="alternate" type="text/html" href="${SITE.url}/${p.section}/${p.slug}/"/>
    <id>${SITE.url}/${p.section}/${p.slug}/</id>
    <updated>${iso}</updated>
    <published>${iso}</published>
    <category term="${p.section}"/>
    <summary>${escapeHtml(p.summary || '')}</summary>
    <author><name>${escapeHtml(SITE.author)}</name></author>
  </entry>`;
  }).join('\n');
  const xml = `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom" xml:lang="${SITE.lang}">
  <title>${escapeHtml(SITE.title)}</title>
  <subtitle>${escapeHtml(SITE.description)}</subtitle>
  <link rel="self" type="application/atom+xml" href="${SITE.url}/feed.xml"/>
  <link rel="alternate" type="text/html" href="${SITE.url}/"/>
  <updated>${updated}</updated>
  <id>${SITE.url}/</id>
  <author><name>${escapeHtml(SITE.author)}</name></author>
${entries}
</feed>
`;
  await writeText(join(ROOT, 'feed.xml'), xml);
  console.log('  ✓ /feed.xml');
}

// ---------------------------------------------------------------------------
// Build orchestrator

async function build() {
  const t0 = Date.now();
  console.log('build →');
  const templates = {
    base: await readText(join(TEMPLATES, 'base.html')),
    home: await readText(join(TEMPLATES, 'home.html')),
    list: await readText(join(TEMPLATES, 'list.html')),
    post: await readText(join(TEMPLATES, 'post.html')),
    page: await readText(join(TEMPLATES, 'page.html')),
    livrosIndex: await readText(join(TEMPLATES, 'livros-index.html')),
    bookCover: await readText(join(TEMPLATES, 'book-cover.html')),
    bookChapter: await readText(join(TEMPLATES, 'book-chapter.html')),
  };
  await cleanOutputs();
  const posts = await discoverPosts();
  const books = await discoverBooks();
  console.log(`  ${posts.length} post(s) · ${books.length} livro(s) (${books.reduce((n, b) => n + b.chapters.length, 0)} cap.)`);
  await buildHome(templates, posts);
  await buildStaticPages(templates);
  await buildSections(templates, posts);
  await buildPosts(templates, posts);
  await buildBooks(templates, books);
  await buildFeed(posts);
  console.log(`done em ${Date.now() - t0}ms.\n`);
}

// ---------------------------------------------------------------------------
// Watch / serve modes

function watchAndRebuild() {
  let pending = false;
  const trigger = () => {
    if (pending) return;
    pending = true;
    setTimeout(async () => {
      pending = false;
      try { await build(); } catch (e) { console.error('Erro no build:', e); }
    }, 100);
  };
  for (const dir of [CONTENT, TEMPLATES]) {
    if (!existsSync(dir)) continue;
    fsWatch(dir, { recursive: true }, trigger);
    console.log(`watching ${dir}`);
  }
}

function serve(port = 4000) {
  const MIME = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.webp': 'image/webp',
    '.avif': 'image/avif',
    '.xml': 'application/xml; charset=utf-8',
    '.txt': 'text/plain; charset=utf-8',
    '.ico': 'image/x-icon',
    '.woff2': 'font/woff2',
  };
  createServer(async (req, res) => {
    let p = decodeURIComponent(req.url.split('?')[0]);
    if (p.endsWith('/')) p += 'index.html';
    const path = join(ROOT, p);
    try {
      const data = await readFile(path);
      res.writeHead(200, { 'Content-Type': MIME[extname(path)] || 'application/octet-stream' });
      res.end(data);
    } catch {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('404 Not Found');
    }
  }).listen(port);
  console.log(`serve → http://localhost:${port}/`);
}

// ---------------------------------------------------------------------------

await build();
if (WATCH) watchAndRebuild();
if (SERVE) serve();
