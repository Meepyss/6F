// Configuração do Dashboard DRE Detalhado
const dreConfig = {
    initialFilters: {
        tipo: 'ambos',
        empresa: [],
        categoria: [],
        status: [],
        dataInicio: '2025-01-01',
        dataFim: '2025-12-31'
    },
    
    dom: {
        totalRegistros: document.getElementById('total-registros'),
        activeFiltersContainer: document.getElementById('active-filters-container'),
        dreTableBody: document.getElementById('dre-table-body'),
        dataInicioFilter: document.getElementById('data-inicio-filter'),
        dataFimFilter: document.getElementById('data-fim-filter'),
        empresaFilterContainer: document.getElementById('empresa-filter-container'),
        categoriaFilterContainer: document.getElementById('categoria-filter-container'),
        statusFilterContainer: document.getElementById('status-filter-container')
    },
    
    customSelects: [
        {
            type: 'Empresas',
            filterKey: 'empresa',
            containerId: 'empresa-filter-container',
            options: []
        },
        {
            type: 'Categorias',
            filterKey: 'categoria',
            containerId: 'categoria-filter-container',
            options: []
        },
        {
            type: 'Status',
            filterKey: 'status',
            containerId: 'status-filter-container',
            options: ['Pago', 'Em Aberto', 'Vencido']
        }
    ],
    
    filterPillDefinitions: [
        { type: 'empresa', label: 'Empresa' },
        { type: 'categoria', label: 'Categoria' },
        { type: 'status', label: 'Status' }
    ],
    
    renderFunctions: [
        renderDRETable,
        updateTotalRegistros
    ],
    
    setupEventListeners: function(app) {
        // Filtros de tipo (Receitas/Despesas/Ambos)
        document.getElementById('filtro-receitas').onclick = () => {
            updateTipoFilter('receitas', app);
        };
        document.getElementById('filtro-despesas').onclick = () => {
            updateTipoFilter('despesas', app);
        };
        document.getElementById('filtro-ambos').onclick = () => {
            updateTipoFilter('ambos', app);
        };
        
        // Botão limpar filtros
        document.getElementById('clear-filters-btn').onclick = () => app.clearFilters();
        
        // Filtros de data
        app.config.dom.dataInicioFilter.onchange = () => {
            app.activeFilters.dataInicio = app.config.dom.dataInicioFilter.value;
            app.updateDashboard();
        };
        
        app.config.dom.dataFimFilter.onchange = () => {
            app.activeFilters.dataFim = app.config.dom.dataFimFilter.value;
            app.updateDashboard();
        };
    },
    
    getFilteredData: function(rawData, filters) {
        let filteredData = [...rawData];
        
        // Filtro por tipo
        if (filters.tipo !== 'ambos') {
            const tipoMap = {
                'receitas': 'receita',
                'despesas': 'despesa'
            };
            filteredData = filteredData.filter(item => item.tipo === tipoMap[filters.tipo]);
        }
        
        // Filtro por empresa
        if (filters.empresa.length > 0) {
            filteredData = filteredData.filter(item => 
                filters.empresa.includes(item.empresa)
            );
        }
        
        // Filtro por categoria
        if (filters.categoria.length > 0) {
            filteredData = filteredData.filter(item => 
                filters.categoria.includes(item.categoria)
            );
        }
        
        // Filtro por status
        if (filters.status.length > 0) {
            filteredData = filteredData.filter(item => 
                filters.status.includes(item.status)
            );
        }
        
        // Filtro por data
        if (filters.dataInicio) {
            filteredData = filteredData.filter(item => 
                new Date(item.data) >= new Date(filters.dataInicio)
            );
        }
        
        if (filters.dataFim) {
            filteredData = filteredData.filter(item => 
                new Date(item.data) <= new Date(filters.dataFim)
            );
        }
        
        return filteredData;
    }
};

// Função para atualizar filtro de tipo
function updateTipoFilter(tipo, app) {
    // Remove classe active de todos os botões
    document.querySelectorAll('.filter-btn-receitas, .filter-btn-despesas, .filter-btn-ambos')
        .forEach(btn => btn.classList.remove('active'));
    
    // Adiciona classe active ao botão clicado
    document.getElementById(`filtro-${tipo}`).classList.add('active');
    
    // Atualiza o filtro
    app.activeFilters.tipo = tipo;
    app.updateDashboard();
}

// Função para renderizar a tabela DRE
function renderDRETable(data, app) {
    const tbody = app.config.dom.dreTableBody;
    
    // Agrupar dados por categoria e mês
    const dreData = processDataForDRE(data);
    
    // Renderizar DRE
    tbody.innerHTML = generateDRERows(dreData);
    
    // Adicionar event listeners para drill-down
    addDrillDownListeners();
}

// Função para processar dados para DRE
function processDataForDRE(data) {
    const meses = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
    const dreStructure = {
        receitas: {},
        despesas: {},
        totais: {}
    };
    
    // Inicializar estrutura
    meses.forEach(mes => {
        dreStructure.receitas[mes] = 0;
        dreStructure.despesas[mes] = 0;
        dreStructure.totais[mes] = 0;
    });
    
    // Processar dados
    data.forEach(item => {
        const dataObj = new Date(item.data);
        const mes = meses[dataObj.getMonth()];
        const valor = parseFloat(item.valor) || 0;
        
        if (item.tipo === 'receita') {
            dreStructure.receitas[mes] += valor;
            dreStructure.totais[mes] += valor;
        } else {
            dreStructure.despesas[mes] -= valor;
            dreStructure.totais[mes] -= valor;
        }
    });
    
    // Agrupar por categoria
    const categorias = {};
    data.forEach(item => {
        const categoria = item.categoria;
        const subcategoria = item.descricao;
        const dataObj = new Date(item.data);
        const mes = meses[dataObj.getMonth()];
        const valor = parseFloat(item.valor) || 0;
        
        if (!categorias[categoria]) {
            categorias[categoria] = {
                tipo: item.tipo,
                subcategorias: {},
                totais: {}
            };
            meses.forEach(m => {
                categorias[categoria].totais[m] = 0;
            });
        }
        
        if (!categorias[categoria].subcategorias[subcategoria]) {
            categorias[categoria].subcategorias[subcategoria] = {};
            meses.forEach(m => {
                categorias[categoria].subcategorias[subcategoria][m] = 0;
            });
        }
        
        if (item.tipo === 'receita') {
            categorias[categoria].subcategorias[subcategoria][mes] += valor;
            categorias[categoria].totais[mes] += valor;
        } else {
            categorias[categoria].subcategorias[subcategoria][mes] -= valor;
            categorias[categoria].totais[mes] -= valor;
        }
    });
    
    return {
        estrutura: dreStructure,
        categorias: categorias,
        meses: meses
    };
}

// Função para gerar linhas da DRE
function generateDRERows(dreData) {
    const { estrutura, categorias, meses } = dreData;
    let html = '';
    
    // Cabeçalho da DRE
    html += generateDREHeader(estrutura, meses);
    
    // Receitas
    html += generateDRESection('RECEITAS', estrutura.receitas, meses, 'receita');
    
    // Despesas por categoria
    html += generateDRECategories(categorias, meses);
    
    // Resultado líquido
    html += generateDREResult(estrutura.totais, meses);
    
    return html;
}

// Função para gerar cabeçalho da DRE
function generateDREHeader(estrutura, meses) {
    const totalReceitas = meses.reduce((sum, mes) => sum + estrutura.receitas[mes], 0);
    const totalDespesas = meses.reduce((sum, mes) => sum + Math.abs(estrutura.despesas[mes]), 0);
    const resultado = totalReceitas - totalDespesas;
    
    return `
        <tr class="dre-header">
            <td></td>
            <td>ANÁLISE DE FLUXO DE CAIXA</td>
            ${meses.map(mes => `<td class="text-right">${formatCurrency(estrutura.receitas[mes])}</td>`).join('')}
            <td class="text-right font-bold">${formatCurrency(totalReceitas)}</td>
            <td class="text-right">100%</td>
        </tr>
    `;
}

// Função para gerar seção de receitas
function generateDRESection(titulo, dados, meses, tipo) {
    const total = meses.reduce((sum, mes) => sum + dados[mes], 0);
    const cssClass = tipo === 'receita' ? 'valor-positivo' : 'valor-negativo';
    
    return `
        <tr class="dre-subheader">
            <td></td>
            <td>→ ${titulo}</td>
            ${meses.map(mes => `<td class="text-right ${cssClass}">${formatCurrency(dados[mes])}</td>`).join('')}
            <td class="text-right font-bold ${cssClass}">${formatCurrency(total)}</td>
            <td class="text-right">${tipo === 'receita' ? '100%' : '-'}</td>
        </tr>
    `;
}

// Função para gerar categorias da DRE
function generateDRECategories(categorias, meses) {
    let html = '';
    
    Object.entries(categorias).forEach(([categoria, dados]) => {
        const total = meses.reduce((sum, mes) => sum + dados.totais[mes], 0);
        const cssClass = dados.tipo === 'receita' ? 'valor-positivo' : 'valor-negativo';
        const hasSubcategorias = Object.keys(dados.subcategorias).length > 1;
        
        // Linha da categoria principal
        html += `
            <tr class="dre-categoria" data-categoria="${categoria}">
                <td class="text-center">
                    ${hasSubcategorias ? '<span class="drill-toggle" data-categoria="' + categoria + '">▶</span>' : ''}
                </td>
                <td>${categoria}</td>
                ${meses.map(mes => `<td class="text-right ${cssClass}">${formatCurrency(dados.totais[mes])}</td>`).join('')}
                <td class="text-right font-bold ${cssClass}">${formatCurrency(total)}</td>
                <td class="text-right percentual">${formatPercentual(total)}</td>
            </tr>
        `;
        
        // Subcategorias (inicialmente ocultas)
        if (hasSubcategorias) {
            Object.entries(dados.subcategorias).forEach(([subcategoria, subdados]) => {
                const subTotal = meses.reduce((sum, mes) => sum + subdados[mes], 0);
                const subCssClass = dados.tipo === 'receita' ? 'valor-positivo' : 'valor-negativo';
                
                html += `
                    <tr class="drill-content dre-subcategoria" data-parent="${categoria}">
                        <td></td>
                        <td>${subcategoria}</td>
                        ${meses.map(mes => `<td class="text-right ${subCssClass}">${formatCurrency(subdados[mes])}</td>`).join('')}
                        <td class="text-right ${subCssClass}">${formatCurrency(subTotal)}</td>
                        <td class="text-right percentual">${formatPercentual(subTotal)}</td>
                    </tr>
                `;
            });
        }
    });
    
    return html;
}

// Função para gerar resultado líquido
function generateDREResult(totais, meses) {
    const total = meses.reduce((sum, mes) => sum + totais[mes], 0);
    const cssClass = total >= 0 ? 'valor-positivo' : 'valor-negativo';
    
    return `
        <tr class="dre-total">
            <td></td>
            <td>SALDO LÍQUIDO</td>
            ${meses.map(mes => `<td class="text-right font-bold ${cssClass}">${formatCurrency(totais[mes])}</td>`).join('')}
            <td class="text-right font-bold ${cssClass}">${formatCurrency(total)}</td>
            <td class="text-right">${formatPercentual(total)}</td>
        </tr>
    `;
}

// Função para adicionar event listeners de drill-down
function addDrillDownListeners() {
    document.querySelectorAll('.drill-toggle').forEach(toggle => {
        toggle.addEventListener('click', function() {
            const categoria = this.getAttribute('data-categoria');
            const subcategorias = document.querySelectorAll(`.drill-content[data-parent="${categoria}"]`);
            
            if (this.classList.contains('expanded')) {
                // Recolher
                this.classList.remove('expanded');
                this.textContent = '▶';
                subcategorias.forEach(row => row.classList.remove('show'));
            } else {
                // Expandir
                this.classList.add('expanded');
                this.textContent = '▼';
                subcategorias.forEach(row => row.classList.add('show'));
            }
        });
    });
}

// Função para atualizar total de registros
function updateTotalRegistros(data, app) {
    if (app.config.dom.totalRegistros) {
        app.config.dom.totalRegistros.textContent = `${data.length} registros encontrados`;
    }
}

// Função para formatar moeda
function formatCurrency(value) {
    if (value === 0) return '0';
    return new Intl.NumberFormat('pt-BR', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(Math.abs(value));
}

// Função para formatar percentual
function formatPercentual(value) {
    if (value === 0) return '0%';
    return new Intl.NumberFormat('pt-BR', {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1
    }).format(Math.abs(value)) + '%';
}

// Função para carregar e combinar dados
async function loadCombinedData() {
    try {
        const [receitasData, despesasData] = await Promise.all([
            fetch('assets/data/contas_a_receber_data.json').then(res => res.json()),
            fetch('assets/data/contas_a_pagar_data.json').then(res => res.json())
        ]);
        
        // Processar dados de receitas
        const receitas = receitasData.map(item => ({
            ...item,
            tipo: 'receita',
            categoria: item.tipoCobranca || 'Receita',
            empresa: item.company || 'N/A',
            status: item.status || 'Em Aberto',
            data: item.emissionDate || item.dueDate,
            descricao: item.client || item.tipoCobranca,
            valor: item.valorTotal || 0
        }));
        
        // Processar dados de despesas
        const despesas = despesasData.map(item => ({
            ...item,
            tipo: 'despesa',
            categoria: item.grupoNatureza || 'Despesa',
            empresa: item.empresa || 'N/A',
            status: item.situacao || 'Em Aberto',
            data: item.dataEmissao || item.dataVencimento,
            descricao: item.fornecedor || item.grupoNatureza,
            valor: item.valorSaldo || 0
        }));
        
        // Combinar dados
        const combinedData = [...receitas, ...despesas];
        
        // Extrair opções únicas para filtros
        const empresas = [...new Set(combinedData.map(item => item.empresa))].filter(Boolean);
        const categorias = [...new Set(combinedData.map(item => item.categoria))].filter(Boolean);
        
        // Atualizar configuração
        dreConfig.customSelects[0].options = empresas;
        dreConfig.customSelects[1].options = categorias;
        
        return combinedData;
    } catch (error) {
        console.error('Erro ao carregar dados:', error);
        return [];
    }
}

// Inicialização
document.addEventListener('DOMContentLoaded', async () => {
    const data = await loadCombinedData();
    const app = new DashboardApp(dreConfig);
    app.init(data);
}); 