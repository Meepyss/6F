# Funcionalidades Interativas dos Dashboards

## Filtro Cruzado (Cross-Filter)

### Como Funciona
- **Clique simples**: Aplica filtro exclusivo (substitui filtros anteriores)
- **Ctrl + Clique**: Adiciona/remove filtro (permite múltiplas seleções)

### Dashboards Implementados

#### Contas a Pagar
1. **Gráfico de Valor por Natureza**
   - Clique nas barras para filtrar por grupo de natureza
   - Filtra automaticamente todos os outros componentes

2. **Gráfico Aging List**
   - Clique nas barras para filtrar por período de vencimento
   - Períodos: Vencido, Hoje, 7 dias, 15 dias, 30 dias, +30 dias

#### Contas a Receber
1. **Gráfico de Valor por Natureza**
   - Clique nas barras para filtrar por natureza da operação
   - Filtra automaticamente todos os outros componentes

2. **Gráfico de Maiores Devedores**
   - Clique nas barras para filtrar por cliente específico
   - Mostra apenas contas do cliente selecionado

## Drill-Through (Detalhamento)

### Como Usar
- **Clique direito** em qualquer gráfico para abrir o modal de detalhamento
- O modal mostra dados específicos baseados no contexto do clique

### Funcionalidades do Modal
1. **Dados Contextuais**: Mostra apenas dados relevantes ao elemento clicado
2. **Tabela Completa**: Exibe todos os campos disponíveis
3. **KPIs Específicos**: Calcula métricas para o subconjunto de dados
4. **Navegação Fácil**: Botão de fechar e clique fora para sair

### Exemplos de Uso

#### Contas a Pagar
- **Clique direito no gráfico de natureza**: Mostra todas as contas da natureza específica
- **Clique direito no aging**: Mostra contas do período específico (ex: apenas vencidas)

#### Contas a Receber
- **Clique direito no gráfico de natureza**: Mostra contas da natureza específica
- **Clique direito no pareto**: Mostra detalhes do cliente específico

## Indicadores Visuais

### Dicas de Interatividade
- **Hint visual**: Aparece no canto superior direito dos gráficos ao passar o mouse
- **Cursor pointer**: Indica elementos clicáveis
- **Opacity change**: Feedback visual ao passar o mouse

### Pills de Filtro
- **Filtros ativos**: Mostrados como pills coloridas
- **Remoção fácil**: Clique no "×" para remover filtro específico
- **Filtros especiais**: Aging filters têm cor diferenciada

## Compatibilidade
- Funciona em todos os navegadores modernos
- Responsivo para dispositivos móveis
- Suporte a teclado (Ctrl+Click para múltipla seleção)

## Dicas de Uso
1. Use Ctrl+Click para comparar múltiplas categorias
2. Clique direito para ver detalhes sem aplicar filtros
3. Use o botão "Limpar Filtros" para resetar todas as seleções
4. Os filtros são aplicados em tempo real em todos os componentes