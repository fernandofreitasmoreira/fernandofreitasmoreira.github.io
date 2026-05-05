# fernandofreitasmoreira.github.io

Site pessoal — vanilla static, Markdown + um *build script* Node único.

Sem frameworks, sem dependências de runtime, sem *trackers*. Conteúdo em Markdown (CommonMark), feed em Atom, metadata Open Graph, *dark mode* automático via `prefers-color-scheme`.

Servido por GitHub Pages a partir do `main` (root), com `.nojekyll` a desactivar o processamento Jekyll.

---

## Estrutura

```
.
├── content/                  ← FONTE: tudo o que escreves
│   ├── index.md              ← homepage (intro)
│   ├── about.md              ← página /about/
│   ├── phd/                  ← secção 1 (posts curtos)
│   │   └── 2026-05-04-mapa-puzzle-vivo/
│   │       └── index.md      ← post (Markdown)
│   ├── livros/               ← secção 2 — TEXTOS LONGOS (estrutura especial)
│   │   └── es-mesmo-tu/
│   │       ├── _meta.md      ← metadados do livro + prefácio
│   │       ├── 00-introducao.md
│   │       ├── 01-...md      ← capítulos numerados (NN-slug.md)
│   │       └── ...
│   ├── boardgames/           ← secção 3 (vazia)
│   ├── comics/               ← secção 4 (vazia)
│   ├── 3dprint/              ← secção 5 (vazia)
│   └── outros/               ← secção 6 — catch-all (meta, ferramentas, etc.)
│       └── 2026-05-04-bem-vindo/
│           ├── index.md      ← post (Markdown)
│           └── *.webp        ← imagens co-localizadas
├── templates/                ← FONTE: HTML templates (5 ficheiros pequenos)
│   ├── base.html             ← wrapper de todas as páginas
│   ├── home.html             ← homepage
│   ├── list.html             ← índice de secção (lista de posts)
│   ├── post.html             ← post individual
│   └── page.html             ← página estática (about, etc.)
├── assets/                   ← FONTE: ficheiros estáticos servidos como estão
│   └── style.css
├── build.mjs                 ← build script (~330 linhas, só usa marked)
├── package.json              ← uma dep: marked
├── robots.txt
├── .nojekyll                 ← obrigatório para Pages servir como estático
│
├── index.html                ← GERADO pelo build
├── about/index.html          ← GERADO
├── phd/index.html            ← GERADO (lista de posts da secção)
├── phd/bem-vindo/index.html  ← GERADO (post)
├── feed.xml                  ← GERADO (Atom)
└── ...
```

**Convenção:** tudo em `content/`, `templates/`, `assets/` é **fonte** (escrito por ti, versionado). Tudo o resto (`index.html`, `about/`, `phd/`, `boardgames/`, `comics/`, `3dprint/`, `feed.xml`) é **gerado** pelo build a partir das fontes — substituído integralmente em cada execução de `node build.mjs`.

---

## Setup inicial (uma vez por máquina)

```bash
git clone https://github.com/fernandofreitasmoreira/fernandofreitasmoreira.github.io.git
cd fernandofreitasmoreira.github.io
npm install
```

Pré-requisitos: **Node.js ≥ 20** (para `node:fs/promises` e `--watch` nativo).

---

## Publicar (recipe universal)

Aplica-se a **qualquer** alteração — post novo, edição do about, retoque no CSS, novo template. Três comandos a partir da raiz do repo:

```bash
npm run build                           # 1. regenerar HTML a partir das fontes
git add -A                              # 2. apanhar fontes E ficheiros gerados
git commit -m "mensagem curta"          # 3a. registar
git push                                # 3b. publicar
```

GitHub Pages republica em **~30s**. Sem build no CI — o que está em `main` é exactamente o que é servido.

**Pegadinha única do workflow:** se te esqueceres do `npm run build`, o `git status` só mostra as fontes alteradas e o site no Pages fica desactualizado. Regra: **build sempre antes do commit**.

Para iterar com *live reload* enquanto escreves:

```bash
node build.mjs --watch --serve          # http://localhost:4000
```

O `--watch` reconstrói automaticamente quando mudas qualquer ficheiro em `content/` ou `templates/`. O `--serve` levanta um servidor HTTP local na porta 4000.

---

## Workflow diário — escrever um novo post

### 1. Escolher secção e *slug*

Secções existentes: `phd`, `boardgames`, `comics`, `3dprint`, `outros`. (A secção `livros` tem estrutura própria — ver mais abaixo.) O **slug** é a parte do URL — curto, *kebab-case*, sem acentos.

Exemplo: vamos escrever sobre Spirit Island, em `boardgames/`, *slug* `resenha-spirit-island`.

### 2. Criar a pasta do post

A pasta inclui a data no início para ordenar bem em disco:

```bash
mkdir -p content/boardgames/2026-05-08-resenha-spirit-island
cd content/boardgames/2026-05-08-resenha-spirit-island
```

(Nota: o *build* tira a parte da data ao gerar a URL — fica `/boardgames/resenha-spirit-island/`.)

### 3. Criar `index.md`

```markdown
---
title: "Resenha — Spirit Island"
date: 2026-05-08
summary: "Co-op asymmetric onde defendes uma ilha contra colonizadores. Preciso?"
---

Texto do post em Markdown normal. Podes usar **bold**, *itálico*, `código`, listas, etc.

![Setup do jogo a 3 jogadores](setup-3-jogadores.webp)

> Citações em blockquote.

```code
blocos de código com syntax destacada
```

Embedar vídeo do YouTube:

<iframe src="https://www.youtube-nocookie.com/embed/VIDEO_ID"
        title="Título descritivo do vídeo"
        loading="lazy"
        allowfullscreen></iframe>
```

**Frontmatter obrigatório:**
- `title` — título do post (texto)
- `date` — `YYYY-MM-DD`

**Frontmatter opcional:**
- `summary` — resumo curto (aparece em listagens, feeds, OG)
- `draft: true` — exclui do build (útil para *work in progress*)

### 4. Optimizar e adicionar imagens

Foto vinda do telemóvel é tipicamente 4-8 MB em JPG. Convertida para WebP a qualidade 80, fica 200-500 KB com a mesma qualidade visual:

```bash
# Uma imagem
cwebp -q 80 IMG_1234.JPG -o capa.webp

# Em batch (todos os JPG/PNG da pasta)
for f in *.{jpg,JPG,png,PNG}; do
  cwebp -q 80 "$f" -o "${f%.*}.webp"
done

# Apagar os originais depois (não vão para o repo)
rm *.JPG *.PNG
```

Instalar `cwebp` no macOS: `brew install webp`. Alternativa via browser: [Squoosh.app](https://squoosh.app/).

Em Markdown referencia normalmente, com caminho relativo:

```markdown
![Texto alternativo descritivo](capa.webp)
```

Para imagens importantes, vale a pena escrever em HTML directo para incluir `width`, `height` e `loading="lazy"` (evitam *layout shift* e aceleram a página):

```html
<img src="capa.webp"
     alt="Texto alternativo descritivo"
     width="1200" height="800"
     loading="lazy">
```

### 5. Publicar

Segue o [recipe universal](#publicar-recipe-universal) acima. Para este post seria:

```bash
npm run build
git add -A
git commit -m "boardgames: resenha Spirit Island"
git push
```

---

## Adicionar uma nova categoria/secção

Exemplo: adicionar uma secção `livros`.

### 1. Editar `build.mjs`

No objecto `SITE.sections`, adicionar a chave:

```js
sections: {
  phd: { title: 'PhD', description: '...' },
  boardgames: { title: 'Jogos de tabuleiro', description: '...' },
  comics: { title: 'Comics', description: '...' },
  '3dprint': { title: 'Impressão 3D', description: '...' },
  outros: { title: 'Outros', description: '...' },
  livros: { title: 'Livros', description: 'Leituras, descobertas, listas.' },  // ← nova
},
```

A ordem das *keys* aqui é a ordem em que aparecem na navegação e na home.

### 2. Criar a pasta da secção

```bash
mkdir -p content/livros
touch content/livros/.gitkeep
```

(O `.gitkeep` força o git a registar a pasta vazia. Apaga-o quando criares o primeiro post.)

### 3. Publicar

Segue o [recipe universal](#publicar-recipe-universal):

```bash
npm run build
git add -A
git commit -m "site: nova secção livros"
git push
```

A nova secção aparece automaticamente na navegação e na lista da home.

---

## Adicionar um livro (textos longos)

A secção `livros/` tem estrutura especial: cada livro é uma **pasta** com um `_meta.md` e capítulos numerados.

### 1. Criar a pasta do livro

```bash
mkdir -p content/livros/titulo-do-livro
```

O nome da pasta é o *slug* do livro (kebab-case, sem acentos).

### 2. Escrever `_meta.md` (metadata + prefácio)

```markdown
---
title: "Título do Livro"
subtitle: "Subtítulo opcional"
author: "Fernando F. Moreira"
year: "2026"
version: "v0.6 — em revisão"
version_note: "nota curta sobre o estado da versão"
summary: "Sinopse de 1-2 frases."
---

## Sobre este livro

Conteúdo Markdown do prefácio. Aparece na capa do livro entre os metadados e o sumário.
```

### 3. Escrever capítulos como ficheiros `NN-slug.md`

Os capítulos são ordenados pelo número no início do nome do ficheiro. O `NN-` é tirado da URL (URL fica `/livros/titulo-do-livro/slug/`).

```markdown
---
title: "Título do Capítulo"
kind: capitulo
---

> *"Epígrafe original."*
>
> *Tradução em itálico.*

Autor, fonte (ano)

Texto do capítulo em Markdown normal...

<aside class="chapter-takeaway">

**O que fica deste capítulo**

- ponto 1
- ponto 2

</aside>

<p class="chapter-transition">No próximo capítulo, vamos ver...</p>
```

**`kind` aceita:** `introducao`, `capitulo` (default — número derivado do prefixo do ficheiro), `conclusao`, `apendice`.

### 4. Convenções

- **Epígrafe** — primeiro `blockquote` do capítulo + parágrafo seguinte como atribuição. CSS aplica estilo automaticamente.
- **Caixa "O que fica"** — usa `<aside class="chapter-takeaway">` com linhas em branco antes e depois.
- **Transição inter-capítulo** — usa `<p class="chapter-transition">` para o último parágrafo de transição.

### 5. Publicar

Aplica o [recipe universal](#publicar-recipe-universal). A capa do livro fica em `/livros/<slug>/`, cada capítulo em `/livros/<slug>/<chapter-slug>/`. A navegação prev/next gera-se automaticamente.

---

## Editar páginas estáticas (home, about)

- **Home:** edita `content/index.md`. O conteúdo aparece dentro da secção *intro* da homepage. As listas de secções e posts recentes são geradas automaticamente.
- **About:** edita `content/about.md`. Substitui o email *placeholder* pelo teu real.

---

## Customização

### Cores e tipografia

Edita `assets/style.css`. Os tokens estão concentrados nas variáveis CSS no topo do ficheiro:

```css
:root {
  --bg: #faf8f3;
  --text: #1c1c1c;
  --accent: #1f5e8c;
  /* ... */
}

@media (prefers-color-scheme: dark) {
  :root { /* dark mode equivalents */ }
}
```

### Layout

- **Largura máxima de leitura:** `--max-width: 720px` (recomenda-se não passar de 800px para conforto).
- **Tipografia do corpo dos posts:** `--serif` (Iowan Old Style → Palatino → Georgia). Edita em `--serif` para mudar a *cascade*.
- **Tipografia da UI:** `--sans` (system fonts).

### Templates

Os 5 *templates* em `templates/` são HTML puro com placeholders `{{nome}}`. Edita à vontade. As variáveis disponíveis estão documentadas no início de cada função `build*` em `build.mjs`.

---

## Troubleshooting

**O post não apareceu depois do push.**
- Verifica que correste `npm run build` antes do commit. O HTML gerado tem de estar em *staging*.
- Verifica que o `frontmatter` tem `title` e `date`.
- Se tem `draft: true`, é excluído de propósito.

**Imagens não aparecem.**
- Verifica que o caminho na referência é relativo (`capa.webp`, não `/capa.webp` nem `/assets/capa.webp`).
- Verifica que a imagem está na mesma pasta que o `index.md` do post.
- Verifica que correste o build (as imagens são copiadas no build).

**O site no Pages não actualiza.**
- Espera ~30s após o push.
- Verifica os *runs* em `https://github.com/fernandofreitasmoreira/fernandofreitasmoreira.github.io/actions`.
- Confirma que o `.nojekyll` na raiz não foi removido por engano.

**O dark mode não está a funcionar.**
- O dark mode é automático via `prefers-color-scheme`. Configura-se ao nível do sistema operativo (macOS: System Settings → Appearance).

---

## Princípios de design

1. **Standards abertos** — Markdown (CommonMark), Atom, Open Graph, JSON-LD futuro. Conteúdo migrável para qualquer outro CMS sem perdas.
2. **Sem dependências de runtime** — uma única dep (`marked`), só usada no build. O site servido é HTML/CSS estático.
3. **Sem build no CI** — o que está em `main` é o que é servido. `node build.mjs` corre localmente antes do push.
4. **Imagens com o post** — co-localização garante portabilidade e referências relativas estáveis.
5. **Privacy-first** — sem *trackers*, sem cookies; YouTube via `youtube-nocookie.com`.
6. **Conteúdo > apresentação** — CSS único, simples, prioridade à legibilidade.
