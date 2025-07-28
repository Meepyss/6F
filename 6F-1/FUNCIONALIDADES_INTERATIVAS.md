# Funcionalidades Interativas do Painel Financeiro

## Páginas Disponíveis

### 1. Fluxo de Caixa (Página Principal)
- Visão geral do fluxo de caixa com gráficos comparativos
- Projeções futuras de recebimentos vs pagamentos
- Calendário financeiro com alertas
- Filtros por empresa, período e movimentações internas

### 2. Fluxo de Entradas
- Análise temporal de recebimentos com comparação ao ano anterior
- Distribuição por categoria de natureza
- Visualização de valores recebidos vs em aberto
- Filtros por status, empresa, natureza e período

### 3. Fluxo de Saídas (Contas a Pagar)
- Análise temporal de pagamentos vs ano anterior
- Distribuição por categoria de natureza
- Comparação entre contas pagas e em aberto
- Filtros por status, empresa, natureza e período

## Filtro Cruzado (Cross-Filter)

### Como Funciona
- **Clique simples**: Aplica filtro exclusivo (substitui filtros anteriores)
- **Ctrl + Clique**: Adiciona/remove filtro (permite múltiplas seleções)

### Funcionalidades por Dashboard

#### Fluxo de Saídas
1. **Gráfico de Valor por Natureza**
   - Clique nas barras para filtrar por grupo de natureza
   - Filtra automaticamente todos os outros componentes

2. **Gráfico Temporal (Comparativo Anual)**
   - Clique nas barras para filtrar por período específico
   - Mostra comparação com ano anterior

#### Fluxo de Entradas
1. **Gráfico Temporal (Comparativo Anual)**
   - Clique nas barras para filtrar por período específico
   - Mostra comparação com ano anterior

2. **Gráfico de Valores por Tipo de Receita**
   - Clique nas barras para filtrar por categoria de receita
   - Filtra automaticamente todos os outros componentes

#### Fluxo de Caixa
1. **Gráficos Interativos**
   - Navegação entre períodos (diário, semanal, mensal)
   - Filtros por empresa e inclusão de movimentações internas

## Drill-Through (Detalhamento)

### Como Usar
- **Clique direito** em qualquer gráfico para abrir o modal de detalhamento
- O modal mostra dados específicos baseados no contexto do clique

### Funcionalidades do Modal
1. **Dados Contextuais**: Mostra apenas dados relevantes ao elemento clicado
2. **Tabela Completa**: Exibe todos os campos disponíveis
3. **KPIs Específicos**: Calcula métricas para o subconjunto de dados
4. **Navegação Fácil**: Botão de fechar e clique fora para sair

## Indicadores Visuais

### Dicas de Interatividade
- **Cursor pointer**: Indica elementos clicáveis
- **Feedback visual**: Mudança de opacidade ao passar o mouse
- **Botões ativos**: Destaque visual para filtros aplicados

### Pills de Filtro
- **Filtros ativos**: Mostrados como pills coloridas
- **Remoção fácil**: Clique no "×" para remover filtro específico
- **Botão limpar**: Remove todos os filtros de uma vez

## Navegação
- **Fluxo de Caixa**: Página principal do sistema
- **Fluxo Entradas**: Análise de recebimentos e valores a receber
- **Fluxo Saídas**: Análise de pagamentos e contas a pagar
- Navegação integrada entre todas as páginas

## Compatibilidade
- Funciona em todos os navegadores modernos
- Design responsivo para dispositivos móveis
- Suporte a teclado (Ctrl+Click para múltipla seleção)
- Cores neutras seguindo o padrão do projeto [[memory:3921316]]

## Dicas de Uso
1. Use Ctrl+Click para comparar múltiplas categorias
2. Clique direito para ver detalhes sem aplicar filtros
3. Use o botão "Limpar Filtros" para resetar todas as seleções
4. Os filtros são aplicados em tempo real em todos os componentes
5. Navegue entre as páginas usando o menu superior