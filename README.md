# Gustavo Financial Hub — Redesign 3.0

## Line Art + Editorial Fintech + Minimalismo Premium

Esta versão aplica uma nova linguagem visual ao Gustavo Financial Hub sem alterar a lógica financeira, a arquitetura funcional, o storage ou o módulo do mapa.

### Design system

**Fonte**

`Inter, -apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif`

O PWA não depende de fonte externa para funcionar; Inter é apenas a primeira opção do stack caso esteja disponível no sistema.

**Pesos**

400 para texto, 500 para labels/ações/títulos secundários, 600 para títulos e números financeiros. Não foi introduzido peso 800 como parte da nova identidade.

**Cores principais**

- Canvas: `#F4F6F8`
- Superfície: `#FFFFFF`
- Navy: `#101828`
- Texto: `#172033`
- Secundário: `#667085`
- Linha: `#D9DEE7`
- Azul: `#2563EB`

**Line art**

Sistema SVG inline/local com stroke de aproximadamente `1.5px`, sem dependência externa. Home, wallet, chart, calendar, plane, map, target, bank, settings, plus, search, more e info usam a mesma lógica de traço, caps e joins.

**Spacing**

Ritmo base: 8 / 12 / 16 / 24 / 32 / 48 / 64px.

**Radius**

- Small/control: 10px
- Panel: 16px
- Hero: 24px
- Pill/status: 999px

**Sombras**

Minimizadas. A linguagem principal é borda/divisor/superfície; sombras permanecem apenas em elementos flutuantes existentes.

### Iconografia

A navegação desktop e mobile foi convertida de emojis para SVG line art inline. Ícones de ações importantes também usam a mesma linguagem. Emojis decorativos foram removidos da navegação e dos labels principais; emojis de categorias de gasto e conteúdo específico permanecem onde representam o conteúdo e não a navegação.

### Dashboard

A composição começa com um hero editorial leve, seguido pelo bloco de métricas em faixas com divisores. A área financeira deixa de depender de uma sequência de cards independentes. O destaque "Posso gastar" continua disponível, enquanto os números passam a usar hierarquia tipográfica maior e peso 600.

### Central

O hero financeiro passou a ser navy, tornando "Posso gastar" o elemento dominante. KPIs secundários usam uma faixa única e os conteúdos seguintes usam painéis leves, divisores e listas.

### Planejamento

A trajetória ganhou prioridade visual. O hero e os blocos de projeção usam superfícies claras com elementos lineares discretos, mantendo a separação entre onde estou, onde chego e cenários.

### Contas

Listas e compromissos foram tratados como conteúdo editorial: bordas horizontais finas, espaçamento vertical e ações discretas. Cards repetitivos foram reduzidos visualmente.

### Viagens

Os blocos-resumo foram convertidos em composição com divisores e superfícies claras. Cards de viagem continuam como superfícies agrupadas quando fazem sentido, com detalhes internos separados por linha.

### Mapa

`world-map-data.js` foi preservado integralmente. A interface do mapa recebeu somente tratamento visual: controles e busca adotam line art, sem alterar o SVG dos 195 países ou o comportamento de zoom/pan/seleção.

### Sidebar

Desktop usa sidebar navy dedicada, com marca G, ícones line art, tipografia 400/500 e estado ativo por pequena linha azul e fundo discreto. Não há grandes botões coloridos.

### Mobile

A sidebar permanece oculta em telas pequenas e a bottom navigation continua presente. Os cinco itens principais são Início, Central, Plano, Viagens e Mais. Ícones têm área de toque mínima planejada em aproximadamente 44×44px. O layout mantém `env(safe-area-inset-top)` e `env(safe-area-inset-bottom)`.

### PWA

Manifest e service worker foram preservados. `display: standalone`, instalação, cache e estratégia offline existentes não foram reescritos. O redesign não cria novo storage nem altera a chave de dados.

### Acessibilidade

Focus visible foi mantido/reforçado com outline azul discreto. Botões receberam altura mínima de 44px onde aplicável. Ícones de ação sem texto permanecem com `aria-label`/`title` nos elementos relevantes. Inputs de formulário continuam ligados a labels; os únicos inputs sem label detectados são campos `type="hidden"` internos, que não são controles visuais.

### Performance

Nenhuma biblioteca adicional foi introduzida para o redesign. Os ícones são SVG inline, evitando requests adicionais. `app.js` e `world-map-data.js` permanecem inalterados.

### Testes

**Sintaxe**

- `node --check app.js` — OK
- `node --check service-worker.js` — OK
- `node --check world-map-data.js` — OK

**Estrutura**

- IDs no HTML: 344
- IDs únicos: 344
- Referências ao badge Online antigo: nenhuma
- `localStorage.clear()`: não encontrado
- `localStorage.removeItem()`: não encontrado
- `gfh_v1`: preservado no `app.js`

**Map data**

`world-map-data.js` contém 195 objetos com campo `name`.

**Viewports visuais**

A mesma composição HTML/CSS foi validada em fixture autocontida nos seis tamanhos pedidos:

- 375×667
- 390×844
- 412×915
- 768×1024
- 1366×768
- 1920×1080

Resultado: `scrollWidth - innerWidth = 0` nos seis tamanhos; sidebar e bottom navigation alternam conforme o breakpoint; o hero financeiro permanece navy.

**Touch targets**

Elementos interativos principais usam min-height/width de aproximadamente 44px quando aplicável.

### Regressão

O arquivo `app.js`, o arquivo `world-map-data.js`, o manifest e o service worker mantêm os mesmos hashes da versão de entrada do redesign 3.0:

- `app.js`: `80bfef05b36a0398a75fbe1ee907c1b2fb4514fab1e5f9bb46d35bb12cba8cd8`
- `world-map-data.js`: `e02159c8851498e2ba52f56b27adaaf3b16f75a82ef511d9c9baf7bce54ee8cd`
- `manifest.webmanifest`: `20e86d4bb79f1cfe5e4b69212fac97ac3c7b35f0cfef879d8028c8ed04674e30`
- `service-worker.js`: `7e886ef210ed641f69da8553958291b1cdb44a19d8ff23f029541a58e18c9dc2`

Como consequência, a lógica de cálculo de capital livre, "Posso gastar", patrimônio, salário, gastos, compromissos, viagens, objetivos, planejamento, projeções e simuladores não foi alterada.

### Limitações

A validação visual foi feita em uma fixture autocontida porque o ambiente bloqueou a abertura do site local diretamente pelo Chromium. Isso permite verificar o CSS, composição, breakpoints, overflow e hierarquia visual, mas não equivale a executar o PWA completo em um dispositivo físico.

Também não foi feita uma validação física de Dynamic Island/home indicator em hardware iPhone. As regras de safe area já existentes foram preservadas e o CSS continua usando `viewport-fit=cover` e `env(safe-area-inset-top/bottom)`.

Não foram alterados os gráficos Chart.js em `app.js`; portanto, a linguagem line-art foi aplicada à interface e containers sem reescrever a configuração funcional dos gráficos.

### Escopo preservado

Não foram criados novos módulos. Não houve migração de framework. Não houve alteração de `gfh_v1`. Não houve alteração dos cálculos, dados, mapa de 195 países ou mecanismo PWA.

## FASE 3.2 — Distribuição Automática do Salário

### Objetivo
A Fase 3.2 adiciona uma camada persistente de planejamento chamada `monthlyAllocations`: o usuário define destinos mensais para o salário e o Hub calcula, para cada mês, quanto será destinado e quanto fica livre. As regras são planejamento e **não geram transações reais automaticamente**.

### Arquivos alterados
- `app.js` — modelo de dados, cálculo, integração com orçamento/capital livre, CRUD e exceções mensais.
- `index.html` — interface da distribuição dentro de `Meu dinheiro`, resumo na Home e modal de edição.
- `styles.css` — apresentação line art/editorial compatível com o Redesign 3.0.
- `tests/allocation-regression.js` — testes automatizados da nova funcionalidade e salvaguardas estruturais.
- `README.md` — documentação desta fase.

### Estruturas persistentes
A nova informação continua dentro do objeto salvo em `gfh_v1`:

```js
monthlyAllocations: []
monthlyAllocationOverrides: {}
```

Cada regra usa, em resumo:

```js
{
  id,
  name,
  category,
  amount,
  type,
  active,
  priority,
  notes,
  linkedCommitmentId,
  createdAt,
  updatedAt
}
```

Os tipos suportados são `expense`, `saving`, `travel`, `investment` e `transfer`.

### Fórmulas
A renda usada pela distribuição segue a mesma hierarquia do Hub:

```text
salário real recebido/partial
          ↓
salário planejado
```

Para o mês `M`:

```text
activeTotal(M) = Σ valor efetivo das regras ativas
freeAfterDistribution(M) = income(M) − activeTotal(M)
deficit(M) = max(0, activeTotal(M) − income(M))
```

O valor efetivo de uma regra é o valor padrão, salvo quando existe uma exceção mensal em `monthlyAllocationOverrides[M][allocationId]`.

As regras também alimentam `getBudget(M)`. Dessa forma, o motor existente continua calculando `financeMonthFree()` / `actualCapitalFree()` e não nasce um segundo motor independente de Capital Livre.

### Salário real
`incomeUsedForMonth()` agora reconhece os estados `received` e `partial`. Quando há salário efetivamente recebido, ele é usado como base da distribuição; sem salário real, permanece o valor planejado.

### Fundo de Viagens
Uma regra `type: "travel"` direcionada para `Viagens` altera o mesmo orçamento mensal consumido pelo sistema de viagens já existente. Não existe segundo Fundo de Viagens. A projeção existente usa `getBudget(M).Viagens`, portanto o aporte planejado mensal é propagado para a projeção existente sem criar uma despesa de viagem fictícia.

### Histórico e movimentos reais
Criar, editar, pausar, reativar ou excluir uma regra não cria nem remove transações históricas. A ligação opcional com um compromisso existente ocorre somente após confirmação explícita e também não cria uma transação financeira.

### Exceções mensais
A regra base continua sendo recorrente. Um valor diferente em determinado mês é armazenado separadamente em `monthlyAllocationOverrides`, sem alterar o valor-base e sem reescrever meses anteriores.

### Duplicações
Ao criar uma distribuição do tipo `expense`, o Hub procura compromissos mensais/únicos semelhantes no mês selecionado. Quando encontra um possível duplicado, pede confirmação para usar o compromisso existente como base ou criar uma regra separada. Não há duplicação silenciosa.

### Migração opcional
O orçamento já existente pode ser convertido em regras de distribuição pela ação `Configurar a partir do orçamento`, mas somente depois de confirmação. Nenhuma migração automática apaga valores anteriores.

### Interface
A página `Meu dinheiro` recebeu uma área `Para onde vai meu salário?` com:

- salário usado no mês;
- total destinado;
- livre após distribuição;
- `Posso gastar` do motor existente;
- progresso de distribuição;
- alerta explícito de déficit;
- lista de regras ativas/pausadas;
- edição rápida do valor;
- navegação mensal;
- fluxo visual salário → destinos → livre;
- modal para adicionar/editar destino.

A Home recebeu apenas um resumo enxuto com salário, distribuído, livre e acesso à distribuição.

### Testes da Fase 3.2
`tests/allocation-regression.js` valida:

1. €1.448 de renda e €1.000 distribuídos → €448 livres.
2. Brasil €200 → €150 → €950 distribuídos / €498 livres.
3. Pausar Viagens €250 → €750 distribuídos / €698 livres.
4. €1.600 distribuídos sobre €1.448 → déficit explícito de €152.
5. Salário real €1.600 substitui o planejado €1.448.
6. Salário real €1.300 recalcula a margem.
7. Viagens €250 alimenta o orçamento de Viagens existente.
8. Nenhuma transação real é criada pelas regras.
9. Exceção de dezembro não altera a regra-base.
10. Exclusão da regra não altera histórico de transações.
11. O mesmo motor `financeMonthFree()` reage à mudança da distribuição.
12. Não existe `localStorage.clear()` no código financeiro.
13. O estado financeiro continua salvo sob `gfh_v1`.
14. `world-map-data.js` é verificado byte-for-byte contra a versão-base.

Resultado da suíte nova:

```text
ALLOCATION_TESTS_PASSED
STORAGE_REGRESSION_PASSED
MAP_INTEGRITY_PASSED
```

### Regressão estrutural
Também foram executados:

```text
node --check app.js
node --check service-worker.js
node --check world-map-data.js
```

Todos passaram. O HTML possui IDs únicos.

`manifest.webmanifest` e `service-worker.js` permanecem byte-for-byte idênticos à versão Redesign 3.0 de entrada. `world-map-data.js` permanece byte-for-byte idêntico.

A página ainda possui o armazenamento separado já existente da interface de instalação PWA (`gfh_pwa_install_dismissed`); isso não é uma base financeira nova e não foi criado para a Fase 3.2. O estado financeiro continua exclusivamente em `gfh_v1`.

### Validação visual / dispositivos
A estrutura responsiva foi mantida para safe area e bottom navigation do Redesign 3.0, com os novos componentes adaptando-se a telas pequenas. O ambiente disponível não permitiu concluir uma navegação visual automatizada confiável em Chromium: a tentativa headless ficou travada mesmo com o app servido via HTTP local. Por isso, não foi declarado um teste visual completo em dispositivo real.

### Limitações
- A função de "aplicar ao próximo mês" é implícita: a regra-base já se aplica automaticamente aos meses seguintes; não foi criado um botão redundante.
- A detecção de duplicidade é intencionalmente conservadora e é focada em compromissos de despesas, pois transferências/poupanças não devem ser classificadas automaticamente como despesas.
- A distribuição mostra `Livre após distribuição` separadamente de `Posso gastar`. `Posso gastar` continua considerando o restante do motor financeiro existente, evitando substituir o conceito central por uma fórmula paralela.

## FASE 3.2 — Patch: Planejamento mensal editável + mês automático + refinamento dos ícones


### Objetivo
Refinamento incremental sobre a v3.2 para tornar o Planejamento mensal o editor principal da distribuição do salário, inicializar o mês pela data atual do dispositivo e consolidar a iconografia line-art.

### Arquivos modificados
- `index.html` — editor de distribuição movido/consolidado em Planejamento, campos de edição mensal/override e refinamento da iconografia SVG.
- `app.js` — reutilização de `monthlyAllocations`/`monthlyAllocationOverrides`, mês selecionado atual na abertura, navegação mensal, consolidação do orçamento quando existem regras de distribuição, integração com o motor existente de Capital Livre e remoção de emojis funcionais de estados/trilhas principais.
- `styles.css` — ajustes pontuais para o editor mensal, override, ações e ícones line-art.
- `tests/allocation-regression.js` — cenários de edição, pausa, override, mês automático/navegação, integração com Travel Fund, storage, mapa, touch/safe-area e critérios exatos de aceitação.
- `README.md` — este relatório.

### Estruturas reutilizadas
Nenhum novo `localStorage` foi criado. O armazenamento continua sendo `gfh_v1`. As estruturas `monthlyAllocations` e `monthlyAllocationOverrides` existentes foram reutilizadas e ampliadas apenas na interface/editor.

### Fórmulas e integração
A distribuição ativa de um mês é a soma dos `effectiveAmount` das regras ativas, respeitando override mensal. Quando existem regras de distribuição, elas passam a ser a camada de orçamento planejado por categoria; uma regra pausada resulta em zero para sua categoria controlada, evitando que um valor legado reapareça silenciosamente. `financeMonthFree()` continua sendo o único motor conceitual de Capital Livre e o resumo do Planejamento reutiliza esse resultado. Nenhuma regra automática cria uma transação real.

Para salário, a precedência permanece: registro real recebido/partial em `salaryRecords` → salário planejado → `profile.netMonthly`.

Destinações `travel` continuam alimentando `Viagens` dentro do orçamento e, portanto, a projeção do Fundo de Viagens já existente. Não foi criado um segundo travel fund.

### Mês automático
`financeSelectedMonth` e `allocationSelectedMonth` são inicializados por `monthKey()` usando `new Date()`. A navegação manual usa `addMonthsKey()` e não é sobrescrita a cada renderização. Os dados históricos permanecem intactos.

### Iconografia
A interface usa o sistema SVG inline existente, com stroke fino. O avião foi simplificado para um desenho editorial leve (`i-plane`). Emojis funcionais foram removidos de ações, categorias e estados principais; bandeiras e ícones armazenados pelo usuário continuam sendo conteúdo, não componentes de navegação.

### Testes executados
- `node --check app.js` — PASS
- `node --check service-worker.js` — PASS
- `node --check world-map-data.js` — PASS
- `node tests/allocation-regression.js` — PASS
- Cenários exatos de edição e pausa — PASS
- Mês atual + navegação mensal — PASS
- Override mensal sem alterar regra-base — PASS
- Salário real maior/menor que o planejado — PASS
- Travel Fund sem duplicação — PASS
- Regras não criam transações — PASS
- Excluir regra não apaga histórico — PASS
- `gfh_v1` preservado e sem `localStorage.clear()` — PASS
- Touch target ≥44px e safe-area top/bottom — PASS
- IDs HTML únicos e referências SVG resolvidas — PASS
- Mapa byte-for-byte — PASS

### Integridade preservada
`world-map-data.js` SHA-256 permanece:
`e02159c8851498e2ba52f56b27adaaf3b16f75a82ef511d9c9baf7bce54ee8cd`

`manifest.webmanifest` e `service-worker.js` também permanecem byte-for-byte iguais à v3.2 de entrada.

### Validação visual
A tentativa de validação com Chromium headless no ambiente de execução apresentou timeout do processo. Por isso, não é declarada validação física em iPhone nem benchmark visual automatizado completo. Os checks estruturais de responsive/safe-area/touch e o conteúdo dos viewports permanecem em regressão estática.


## Patch — Orçamento mensal editável + bandeiras minimalistas

`Meu dinheiro → Orçamento` agora permite editar o valor planejado diretamente na linha, com Enter, Escape ou blur. Categorias independentes usam `months[YYYY-MM].budget`; categorias ligadas a `monthlyAllocations` usam `monthlyAllocationOverrides` para o mês selecionado, mantendo uma única fonte de verdade. Edições não criam transações nem alteram histórico.

O orçamento usa `budgetSelectedMonth`, inicializado por `monthKey()` na abertura e navegável por mês sem reset durante os renders. Viagens exibem bandeiras pequenas derivadas dos códigos/estruturas de país existentes, com suporte compacto para múltiplos países e sem alterar `world-map-data.js`.

# PATCH FINAL — Auditoria de coesão

## Escopo
Auditoria e correção incremental aplicada sobre a versão de Orçamento editável + bandeiras, sem criação de novo motor financeiro, novo armazenamento ou novo módulo.

## Coesão financeira
A cadeia final é:

`salaryRecords / salaryPlan / profile.netMonthly → monthlyAllocations + monthlyAllocationOverrides → getBudget() → financeMonthFree() / financeAvailableToSpend()`.

O salário real recebido em `salaryRecords` continua tendo prioridade sobre o planejado. O orçamento por categoria continua sendo apresentado por `getBudget()` e suas categorias configuráveis são armazenadas em `state.budgetCategories` dentro de `gfh_v1`.

Quando uma categoria está ligada a uma regra de `monthlyAllocations`, sua edição mensal escreve em `monthlyAllocationOverrides` e não cria uma segunda fonte paralela. Categorias independentes continuam usando `months[YYYY-MM].budget`.

## Categorias
Categorias possuem identificador estável, nome, tipo, ícone, estado ativo e aliases. Renomear adiciona o nome anterior aos aliases para que transações históricas continuem sendo reconhecidas; o texto armazenado em transações históricas não é reescrito. Categorias com histórico são arquivadas/desativadas em vez de terem seus lançamentos eliminados.

Excluir/desativar uma categoria remove-a do planejamento futuro, mas preserva transações e backups. Reativação recupera a categoria sem apagar dados.

## Fundo de viagens
O tipo semântico `travel` é usado como fonte do aporte planejado. O nome visível da categoria pode ser alterado sem quebrar o vínculo, porque a categoria padrão de viagens carrega um `role: 'travel'` estável.

`plannedTravelContributionForMonth()` lê o orçamento da categoria de viagens e desconta aportes reais já registrados no mesmo mês. Para uma viagem em uma data específica, `plannedTravelContributionsBefore(date)` considera os meses anteriores ao mês da viagem; a projeção de fim de mês usa `plannedTravelContributionsThroughMonth(key)` quando apropriado.

Assim, para um fundo de €500 e aporte planejado de €250/mês, uma viagem em novembro pode considerar os aportes de setembro e outubro antes do evento, enquanto a projeção de fechamento de novembro pode considerar também novembro. Nenhum aporte planejado gera uma transação histórica falsa.

## Bandeiras
As bandeiras continuam derivadas dos dados reais dos países já existentes. `tripCountryCodes()` resolve país/código/nome para os códigos suportados e `countryFlagVisual()` prioriza o campo `flag` existente no `world-map-data.js`, usando a representação Unicode correspondente como fallback. `tripFlagsMarkup()` exibe até três bandeiras de forma compacta e `+N` para excedentes.

A solução não cria uma tabela manual parcial de países e não altera `world-map-data.js`.

## Iconografia
A interface funcional foi auditada para remover emojis usados como ícones de ações, estados e navegação. O sistema SVG inline existente é reutilizado. O `i-plane` foi refinado para um desenho de aeronave de line-art mais reconhecível. Emojis que permanecem no código são dados de migração/conteúdo de país, não novos ícones funcionais.

## Mês e persistência
`monthKey(new Date())` continua sendo a origem do mês inicial durante a abertura da aplicação. A seleção manual de mês não é redefinida em cada renderização. Não há armazenamento secundário financeiro e não há `localStorage.clear()`.

## Backup / Restore
A importação continua aceitando backups legados e aplica defaults quando `budgetCategories` não existe. Categorias e seus metadados fazem parte do mesmo objeto de estado exportado; transações, salário, viagens, alocações, overrides e demais estruturas existentes permanecem no backup.

## Versão visível
A interface exibe apenas `Gustavo Financial Hub`. Nenhum número de versão é mostrado no título ou na navegação. Informações técnicas de versão continuam restritas a documentação/testes quando existentes.

## Integridade do mapa
`world-map-data.js` não foi modificado.

SHA-256 verificado:
`e02159c8851498e2ba52f56b27adaaf3b16f75a82ef511d9c9baf7bce54ee8cd`

## Testes finais
Executados:

- `node --check app.js` — PASS
- `node --check service-worker.js` — PASS
- `node --check world-map-data.js` — PASS
- `node tests/allocation-regression.js` — PASS
- `node tests/budget-editing-flags-regression.js` — PASS
- `node tests/final-cohesion-regression.js` — PASS
- edição de orçamento — PASS
- isolamento mensal — PASS
- histórico preservado — PASS
- adicionar/renomear/arquivar/reativar categoria — PASS
- vínculo orçamento ↔ monthly allocation — PASS
- projeção do travel fund com aporte mensal — PASS
- não duplicação do travel fund — PASS
- bandeiras single/multiple/missing country — PASS
- storage `gfh_v1` — PASS
- ausência de `localStorage.clear()` — PASS
- integridade byte-for-byte do mapa — PASS

## Limitação de validação visual
A aplicação pode ser servida localmente normalmente, mas a tentativa automatizada de navegação/renderização headless do Chromium no ambiente apresentou timeout. Por isso, não foi declarado teste visual físico de Safari/iPhone ou Dynamic Island como concluído. Os requisitos de estrutura, safe-area, touch targets e responsive existentes foram preservados e verificados estaticamente.


## Final polish — visual cohesion audit

This patch keeps the existing financial architecture and local storage contract (`gfh_v1`). No new financial engine or database was introduced.

### Local flags
Travel and country UI now use `countryFlagMarkup(countryCode)`, which resolves ISO-2 codes against the existing `WORLD_MAP_COUNTRIES` data and positions a local `icons/flags-atlas.png` asset. The atlas is generated at build time from the existing country flag data and is bundled with the PWA; the runtime therefore does not depend on emoji fonts, an external flag CDN, or an icon library. All 195 countries in `world-map-data.js` have an atlas entry.

### Finance / planning cleanup
The oversized decorative pseudo-elements in the Central Financeira hero and Planejamento hero are suppressed. Financial values remain the dominant visual element and supporting icons are kept small.

### PWA icon
`icons/icon.svg`, `icons/icon-192.png` and `icons/icon-512.png` now share a finance/growth symbol with no letter or text. The manifest name/short name remain `Gustavo Financial Hub` / `Gustavo Hub`. The service-worker cache was incremented internally so installed PWAs receive the new local assets.

### Preserved
`world-map-data.js` is byte-for-byte unchanged. Existing salary, allocation, budget, travel-fund, trip, goals, commitments, backup/restore and safe-area logic was not redesigned. The approved `i-plane` SVG remains unchanged.

## Patch final — correção visual e coesão

Este patch corrige a origem do problema dos SVGs grandes/preenchidos: os ícones gerados por `iconSvg()` agora possuem viewport SVG explícita de 24×24 e apresentação line-art; os símbolos locais também recebem `fill: none`/`stroke: currentColor`, sem alterar a geometria do avião aprovado. Os SVGs estáticos da interface também passaram a declarar viewport e apresentação de forma explícita.

A busca de países foi reposicionada para renderizar as sugestões imediatamente abaixo do campo de pesquisa e antes do mapa. A navegação mensal do orçamento continua isolada por mês, e o histórico de lançamentos mostrado em “Meu dinheiro” passa a acompanhar o mês selecionado. A exclusão de categorias diferencia apagamento seguro de arquivamento para preservar histórico.

`world-map-data.js` permaneceu byte-for-byte idêntico. O atlas local de bandeiras e o ícone do aplicativo/PWA foram preservados. O `i-plane` aprovado permaneceu com a mesma geometria.

## Patch pontual — Ícones gigantes + mapa clicável

Correções finais aplicadas sobre a auditoria de coesão:
- `status-line-icon` agora tem dimensões máximas explícitas de 18×18px, inclusive no modal de país.
- `.country-modal-status .result-card strong` usa layout inline-flex para manter o ícone ao lado do texto sem reservar altura artificial.
- Áreas `world-country-hit` continuam invisíveis e clicáveis para micro-países.
- O mapa mantém clique direto no país e separa clique de arrasto: captura de ponteiro só inicia depois do limite de 5px.
- Busca e seleção convergem para o mesmo fluxo `focusCountry()` → `openCountryModal()`.
- Bandeiras locais e o `i-plane` aprovado foram preservados.
- `world-map-data.js` permaneceu byte-for-byte idêntico.
