---
title: "Bem-vindo ao novo sítio"
date: 2026-05-04
summary: "Migrei o site pessoal de al-folio para algo vanilla. Esta é a primeira nota."
---

Mudei o sítio. Antes tinha **al-folio** — uma framework Jekyll óptima, mas com Ruby + Node + Docker + dezenas de plugins, e nunca cheguei a publicar lá nada de jeito. Para um sítio pessoal, era *overkill*.

A nova versão é vanilla: HTML/CSS escritos à mão, um *build script* Node de ~300 linhas (única dependência: `marked` para Markdown), conteúdo em Markdown puro com *frontmatter* mínimo. Atom feed gerado automaticamente. Imagens co-localizadas com cada post para portabilidade.

## Porquê

Frameworks fazem sentido quando o custo de manutenção é alto e amortizável entre muitos utilizadores. Para um sítio pessoal, hoje, esse cálculo mudou. As dependências têm custo: rotação de versões, *breaking changes*, *vendor lock-in* implícito. O conteúdo, em standards abertos, fica fácil de migrar. Posso pegar nos `.md` daqui e atirar para qualquer outro CMS futuro.

## O que vem a seguir

Posts mais regulares sobre as quatro áreas: progresso da tese, jogos novos, comics que vou lendo, e a primeira impressão 3D que ficar minimamente apresentável.

Migrar do silêncio para escrever pequenos artigos, com regularidade — esse é o desafio.
