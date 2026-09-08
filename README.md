# Gustavo Financial Hub v1.0

## Produto final desta etapa

O **Gustavo Financial Hub v1.0** é um painel financeiro pessoal local-first para acompanhar dinheiro recebido, gastos, compromissos, viagens, objetivos e planejamento, com linguagem simples e foco em decisões práticas.

### Definições financeiras oficiais

- **Receita:** dinheiro recebido ou previsto.
- **Despesa:** consumo efetivamente realizado.
- **Compromisso:** pagamento conhecido ou esperado ainda pendente.
- **Capital livre:** sobra após o planejamento financeiro atual; pode ser negativa.
- **Posso gastar:** parte segura do capital livre considerando compromissos próximos; na interface, nunca fica abaixo de €0.
- **Reserva:** dinheiro destinado a uma finalidade de segurança.
- **Fundo de viagens:** dinheiro destinado a viagens.
- **Investimento:** neste v1.0, é uma categoria de dinheiro destinado a investimento nas transações; não existe carteira/posição de mercado independente.
- **Patrimônio:** valor líquido dos recursos financeiros acompanhados pelo Hub, sem somar novamente classificações do mesmo dinheiro.

### Starting cash

`startingCash` representa o patrimônio financeiro inicial informado pelo usuário ao começar a utilizar o Hub dentro do universo financeiro acompanhado pela aplicação. Não representa saldo bancário em tempo real, capital livre atual ou renda mensal.

### Persistência e segurança dos dados

- O estado é persistido no mesmo `localStorage` com a chave `gfh_v1`.
- A aplicação não limpa o `localStorage` automaticamente.
- O backup JSON inclui as estruturas suportadas pelo Hub.
- Importações inválidas são rejeitadas sem substituir o estado atual.
- Backups antigos continuam sendo tratados com defaults defensivos quando campos mais novos estiverem ausentes.

### Limitações conhecidas

- Não conecta bancos, Open Banking ou contas reais.
- Não realiza pagamentos.
- Não consulta preços de mercado, hotéis ou passagens.
- Investimentos não possuem cotação ou carteira de mercado automática.
- Os gráficos usam Chart.js via CDN; o restante da aplicação continua utilizável localmente sem a biblioteca, mas os gráficos ficam indisponíveis sem internet.

# Gustavo Financial Hub — Fase 2

Aplicação web pessoal de finanças, feita para funcionar como um painel simples no navegador.

## Como executar

1. Baixe a pasta `gustavo-financial-hub`.
2. Abra `index.html` no navegador.
3. Pronto.

A aplicação usa `localStorage`, então os dados ficam salvos no navegador deste dispositivo.

## Arquivos

- `index.html` — estrutura e telas.
- `styles.css` — visual responsivo.
- `app.js` — lógica, cálculos, armazenamento e gráficos.

## Gráficos

O Chart.js é carregado pelo CDN jsDelivr. A aplicação continua abrindo normalmente sem a biblioteca, mas os gráficos não aparecem sem internet.

## Fase 1 + Fase 1.5

- Dashboard com visão mensal.
- Salário líquido inicial de €1.448, editável.
- Nóminas mensais em `salaryRecords`, com salário planejado x recebido, descontos, rendimentos extras, status e data.
- Orçamento mensal, despesas, dinheiro guardado e capital livre.
- Objetivos financeiros com progresso e estimativas.
- Simulador “E se...?” com cenários.
- EUR/BRL manual.
- Exportação/importação de backup em JSON.
- Responsividade para telas menores.

## Fase 2 — Minhas Viagens

O módulo de viagens agora funciona como um planejador financeiro de viagens.

### Fundo de viagens

- Mantém o fundo separado do capital livre.
- O aporte planejado de `Viagens` é tratado como dinheiro guardado, não como despesa comum.
- Uma viagem realizada pode ter uma única saída vinculada ao fundo (`source: travel-fund`).
- Editar a viagem atualiza essa mesma saída; excluir a viagem remove a saída vinculada.
- Assim, o pagamento da viagem não é contado duas vezes.

### Cada viagem

- Nome/destino.
- Tipo: Canárias, Europa, Brasil, Internacional ou Outro.
- Ilha/região.
- Datas e duração calculada.
- Orçamento detalhado: transporte, hospedagem, alimentação, transporte local, atividades e outros.
- Custo estimado automático.
- Custo real.
- Status: ideia, planejando, reservado, realizada ou cancelada.
- Observações.
- Edição e exclusão com confirmação.

### Viabilidade

Para viagens futuras, o Hub considera o saldo atual do fundo, aportes mensais planejados e outras viagens futuras anteriores à data analisada.

O resultado é apresentado de forma simples:

- 🟢 Viagem viável
- 🟡 Cabe, mas fica apertada / atenção ao limite anual
- 🔴 Ainda não financiada

### Visão anual

- Orçamento anual configurável por ano.
- Número de viagens desejadas por ano.
- Planejado, gasto real e valor ainda disponível para comprometer.
- Calendário anual.
- Filtros por status e tipo.
- Gráficos de custos por categoria e gastos reais por mês.
- Acompanhamento das Ilhas Canárias visitadas.

### Compatibilidade

O carregamento do estado mantém dados existentes. Viagens antigas da Fase 1 são normalizadas para a nova estrutura sem apagar seus campos; quando uma viagem antiga tinha apenas um orçamento total, ele é preservado como `other` no detalhamento.

Backups antigos continuam funcionando mesmo sem `travelSettings` ou viagens no novo formato. As viagens e suas configurações entram automaticamente no backup JSON.

## Fase 2 — Minhas Viagens + Meu Mapa do Mundo

A versão atual inclui um planejador financeiro de viagens e um mapa-múndi offline. O mapa usa dados vetoriais locais por país em `world-map-data.js`, por isso marcar países visitados não depende de API ou backend.

### Mapa do mundo
- 195 países de referência, identificados por ISO 3166-1 alpha-2.
- Países visitados ficam em verde e continuam marcados após recarregar a página.
- Clique no país para registrar primeira/última visita, quantidade de viagens e observações.
- A busca permite encontrar rapidamente um país.
- Viagens marcadas como realizadas podem sugerir marcar o país no mapa; o usuário sempre confirma.
- Ilhas Canárias continuam separadas e não aumentam o contador de países.

### Dados
- `visitedCountries` é salvo dentro do mesmo `gfh_v1` no `localStorage`.
- Backups JSON passam a incluir `visitedCountries`; backups antigos continuam válidos.
- `trips` agora pode guardar `countryCode` para conectar viagens e países.

## Fase 3.1 — Auditoria e refinamento da Central Financeira
- Capital livre agora pode ficar negativo internamente, evitando mascarar uma margem comprometida.
- A projeção de fim de mês considera o planejamento do mês e déficits projetados de compromissos de viagens futuros.
- A diferença entre `Capital livre` (sobra após o planejamento) e `Posso gastar` (margem segura considerando compromissos próximos) fica explícita na interface.
- Limite diário nunca aparece como positivo quando a margem está negativa.
- Saúde financeira é limitada a uma classificação crítica quando a margem é negativa.
- Próximos 3 meses distinguem `Projetado` de `Real` conforme o status da nómina.
- A Central continua consumindo `gfh_v1` e reutilizando `salaryRecords`, `salaryPlan`, transações, objetivos e viagens.
- `world-map-data.js` foi preservado sem alteração funcional.

## Fase 4 — Contas & Compromissos
A versão atual inclui um módulo local-first para compromissos únicos e recorrentes (semanal, quinzenal, mensal e anual), parcelas, valores variáveis, pagamentos e histórico. Pagamentos confirmados criam uma única transação vinculada dentro de `gfh_v1`; ocorrências futuras são calculadas dinamicamente e não são pré-gravadas em massa. A Central Financeira usa os compromissos ainda não pagos para calcular a margem segura, sem duplicar valores já incluídos no orçamento. Compromissos marcados como pagos não aparecem duas vezes na timeline financeira.

## Fase 4.1 — Auditoria final dos compromissos e projeções

- Corrigida a projeção de fim do mês para não somar `free` duas vezes.
- `includedInBudget` agora cobre somente o valor efetivamente suportado pelo orçamento da categoria, com excesso permanecendo como compromisso adicional.
- Compromissos pagos/cancelados não entram como pendência futura.
- Dashboard e Central continuam usando `financeMonthFree()` como fonte única de Capital livre.
- O mapa (`world-map-data.js`) não foi alterado.

## Fase 5 — Planejamento Financeiro
A aplicação agora possui uma área `🎯 Planejamento` que consolida projeções de 3, 6 e 12 meses, trajetória patrimonial, atingibilidade de objetivos, impacto de viagens/compromissos e cenários simulados sem alterar os dados reais. O projeto continua usando `gfh_v1` e não adiciona um segundo armazenamento.

## Fase 5.1 — Auditoria do motor patrimonial e projeções

- `calculateNetWorth()` passou a representar patrimônio como caixa inicial + receitas efetivamente recebidas − despesas de consumo efetivamente pagas.
- Transferências internas para reservas, metas, fundo de viagens e investimentos não são tratadas como perda patrimonial; elas mudam a composição do dinheiro.
- Compromissos futuros e viagens futuras afetam projeções de caixa/capacidade, mas não reduzem o patrimônio atual antes de serem pagos.
- O motor de projeção de patrimônio é compartilhado pela projeção-base e pelos cenários de planejamento.
- Cenários de guardar/investir não reduzem patrimônio apenas por mover dinheiro entre categorias.
- Capacidade de poupança dos objetivos é confrontada com a capacidade financeira projetada do Hub.
- Definições: `capital livre` é a sobra para uso sem comprometer o plano atual; `patrimônio` é o valor líquido dos recursos financeiros pertencentes ao usuário representados pelo Hub.

## Fase 5.1.1 — Patch final do motor patrimonial e simulações
- `startingCash` representa o patrimônio financeiro inicial informado por Gustavo ao começar a usar o Hub, dentro do universo financeiro acompanhado pela aplicação. Não representa capital livre atual, saldo bancário em tempo real ou renda mensal.
- O Hub atualmente **não possui uma carteira/saldo de investimentos independente**. `Investimentos` é tratado como categoria de dinheiro destinado a investimento dentro das transações; não há cotação, posição de mercado ou rentabilidade automática.
- `calculateNetWorth()` continua usando uma definição agregada de patrimônio: `startingCash + receitas efetivamente recebidas - despesas de consumo efetivamente pagas`. Transferências para reservas, fundo de viagens, metas e investimentos não são adicionadas novamente.
- Nas simulações de Planejamento, `Guardar por mês` e `Investir por mês` reduzem a liquidez livre simulada e aumentam a composição destinada, mas não reduzem o patrimônio total quando representam apenas transferências internas sem consumo ou retorno.
- Simulações não alteram o estado persistido nem `gfh_v1`.

## v1.0 — Checklist de fechamento

- Dashboard consolidado.
- Central Financeira com Capital livre e Posso gastar.
- Salário e nóminas mensais.
- Contas & Compromissos.
- Viagens, fundo de viagens e viabilidade.
- Mapa-múndi vetorial com 195 países, zoom e pan.
- Objetivos e Planejamento de 3/6/12 meses.
- Patrimônio sem dupla contagem entre classificações internas.
- Simulações sem alteração do estado real.
- Backup/restore defensivo.
- Responsividade e acessibilidade básicas incorporadas.


## PWA / Mobile

**Gustavo Financial Hub v1.0 — Web + Mobile/PWA**

O projeto pode ser instalado como aplicativo progressivo. O núcleo financeiro continua no mesmo `gfh_v1` e não há sincronização em nuvem.

### Como executar no computador

Para testar o PWA localmente, sirva a pasta por HTTP, por exemplo:

```bash
python -m http.server
```

Depois acesse `http://localhost:8000`. O service worker e a instalação PWA exigem um contexto seguro (localhost ou HTTPS).

### Como instalar

No Android/desktop Chromium/Edge, quando o navegador disponibilizar a instalação, use o botão **📱 Instalar** ou a opção de instalação do próprio navegador.

No iPhone/iPad, use **Compartilhar → Adicionar à Tela de Início** quando disponível. O fluxo e o suporte podem variar conforme a versão do iOS/navegador.

### Offline

O service worker armazena os assets do aplicativo e também pode armazenar em cache o Chart.js depois que ele for carregado online. Os dados financeiros continuam no `localStorage`; o cache HTTP não é a fonte de verdade dos dados.

O primeiro carregamento deve ser feito online para garantir que todos os recursos necessários tenham sido armazenados.

### Privacidade

Os dados financeiros permanecem localmente no dispositivo, salvo ação explícita de exportar/compartilhar um backup. Não há analytics, tracking ou envio dos dados para um servidor próprio.

### Backup

Mantenha backups JSON atualizados, especialmente antes de trocar de dispositivo, limpar dados do navegador ou desinstalar o PWA.
