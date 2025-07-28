// Configuração Power BI Compatible - Estrutura simples
const dreConfig = {
    dom: {
        dreTableBody: document.getElementById('dre-table-body'),
        totalRegistros: document.getElementById('total-registros'),
        activeFiltersContainer: document.getElementById('active-filters-container')
    },
    initialFilters: {
        empresa: [],
        categoria: [],
        status: [],
        tipoMovimento: 'ambos',
        dataInicio: '2025-01-01',
        dataFim: '2025-12-31'
    },
    filterPillDefinitions: [
        { type: 'empresa', label: 'Empresa' },
        { type: 'categoria', label: 'Categoria' },
        { type: 'status', label: 'Status' }
    ],
    customSelects: [
        { type: 'empresa', options: [], containerId: 'empresa-filter-container', filterKey: 'empresa' },
        { type: 'categoria', options: [], containerId: 'categoria-filter-container', filterKey: 'categoria' },
        { type: 'status', options: ['Em Aberto', 'Vencido', 'Compensado', 'Pago Parcial', 'Em Carteira', 'Descontado', 'Remessa Simples', 'Vinculado'], containerId: 'status-filter-container', filterKey: 'status' }
    ],
    
    // Função necessária para compatibilidade com app.js
    setupEventListeners: function(app) {
        // Event listeners básicos para Power BI
        const clearFiltersBtn = document.getElementById('clear-filters-btn');
        if (clearFiltersBtn) {
            clearFiltersBtn.onclick = () => app.clearFilters();
        }
        
        // Filtros de tipo (Receitas/Despesas/Ambos)
        const filtroReceitas = document.getElementById('filtro-receitas');
        const filtroDespesas = document.getElementById('filtro-despesas');
        const filtroAmbos = document.getElementById('filtro-ambos');
        
        if (filtroReceitas) {
            filtroReceitas.onclick = () => updateTipoFilter('receitas', app);
        }
        if (filtroDespesas) {
            filtroDespesas.onclick = () => updateTipoFilter('despesas', app);
        }
        if (filtroAmbos) {
            filtroAmbos.onclick = () => updateTipoFilter('ambos', app);
        }

        // Filtros de data
        const dataInicioFilter = document.getElementById('data-inicio-filter');
        const dataFimFilter = document.getElementById('data-fim-filter');
        
        if (dataInicioFilter) {
            dataInicioFilter.addEventListener('change', () => {
                app.activeFilters.dataInicio = dataInicioFilter.value;
                app.updateDashboard();
            });
        }
        
        if (dataFimFilter) {
            dataFimFilter.addEventListener('change', () => {
                app.activeFilters.dataFim = dataFimFilter.value;
                app.updateDashboard();
            });
        }
    },
    
    // Função para filtrar dados (simples como Power BI)
    getFilteredData: function(rawData, filters) {
        let filteredData = [...rawData];
        
        // Filtro por empresa
        if (filters.empresa && filters.empresa.length > 0) {
            filteredData = filteredData.filter(item => 
                filters.empresa.includes(item.empresa)
            );
        }
        
        // Filtro por categoria
        if (filters.categoria && filters.categoria.length > 0) {
            filteredData = filteredData.filter(item => 
                filters.categoria.includes(item.categoria)
            );
        }
        
        // Filtro por status
        if (filters.status && filters.status.length > 0) {
            filteredData = filteredData.filter(item => 
                filters.status.includes(item.status)
            );
        }

        // Filtro por tipo de movimento
        if (filters.tipoMovimento && filters.tipoMovimento !== 'ambos') {
            filteredData = filteredData.filter(item => 
                item.tipo === filters.tipoMovimento
            );
        }

        // Filtro por período
        if (filters.dataInicio && filters.dataFim) {
            const dataInicio = new Date(filters.dataInicio);
            const dataFim = new Date(filters.dataFim);
            
            filteredData = filteredData.filter(item => {
                const itemData = new Date(item.data);
                return itemData >= dataInicio && itemData <= dataFim;
            });
        }
        
        return filteredData;
    },
    
    // Funções de renderização
    renderFunctions: [
        renderDRETable,
        updateTotalRegistros
    ]
};

// Função para atualizar filtro de tipo
function updateTipoFilter(tipo, app) {
    // Remove classe active de todos os botões
    document.querySelectorAll('.filter-btn-receitas, .filter-btn-despesas, .filter-btn-ambos')
        .forEach(btn => btn.classList.remove('active'));
    
    // Adiciona classe active ao botão clicado
    const targetBtn = document.getElementById(`filtro-${tipo}`);
    if (targetBtn) {
        targetBtn.classList.add('active');
    }
    
    // Atualiza o filtro
    app.activeFilters.tipoMovimento = tipo;
    app.updateDashboard();
}

// Função para renderizar a tabela DRE - Power BI Compatible
function renderDRETable(data, app) {
    const tbody = app.config.dom.dreTableBody;
    if (!tbody) {
        console.error('Elemento tbody não encontrado!');
        return;
    }
    
    // Processar dados de forma simples (como DAX no Power BI)
    const dreData = processDataForDRE(data);
    
    // Gerar HTML simples
    const html = generateDRERows(dreData);
    tbody.innerHTML = html;
    
    // Adicionar controles básicos
    addDrillDownListeners();
}

// Função simplificada para processar dados (simula DAX)
function processDataForDRE(data) {
    const meses = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
    
    // Estrutura simples como no Power BI
    const estrutura = {
        receitas: {},
        despesas: {},
        totais: {}
    };
    
    // Inicializar todos os meses com zero
    meses.forEach(mes => {
        estrutura.receitas[mes] = 0;
        estrutura.despesas[mes] = 0;
        estrutura.totais[mes] = 0;
    });
    
    // Categorias simples
    const categorias = {};
    
    // Processar cada item de dados
    data.forEach(item => {
        if (!item.data) return; // Pular itens sem data
        
        const dataObj = new Date(item.data);
        if (isNaN(dataObj.getTime())) return; // Pular datas inválidas
        
        const mes = meses[dataObj.getMonth()];
        const valor = parseFloat(item.valor) || 0;
        
        // Somar por tipo
        if (item.tipo === 'receita') {
            estrutura.receitas[mes] += valor;
            estrutura.totais[mes] += valor;
        } else {
            estrutura.despesas[mes] += valor;
            estrutura.totais[mes] -= valor;
        }
        
        // Agrupar por categoria
        const categoria = item.categoria;
        if (!categorias[categoria]) {
            categorias[categoria] = {
                tipo: item.tipo,
                totais: {}
            };
            meses.forEach(m => {
                categorias[categoria].totais[m] = 0;
            });
        }
        
        categorias[categoria].totais[mes] += valor;
    });
    
    return {
        estrutura: estrutura,
        categorias: categorias,
        meses: meses
    };
}

// Função simplificada para gerar linhas (simula visual do Power BI)
function generateDRERows(dreData) {
    const { estrutura, categorias, meses } = dreData;
    let html = '';
    
    // Totais simples
    const totalReceitas = meses.reduce((sum, mes) => sum + estrutura.receitas[mes], 0);
    const totalDespesas = meses.reduce((sum, mes) => sum + estrutura.despesas[mes], 0);
    
    // Seção Receitas
    if (totalReceitas > 0) {
        html += `
            <tr class="dre-section-header">
                <td></td>
                <td>RECEITAS</td>
                ${meses.map(mes => `<td>${formatCurrency(estrutura.receitas[mes])}</td>`).join('')}
                <td>${formatCurrency(totalReceitas)}</td>
                <td>100%</td>
            </tr>`;
        
        // Categorias de receitas
        Object.entries(categorias).forEach(([categoria, dados]) => {
            if (dados.tipo === 'receita') {
                const total = meses.reduce((sum, mes) => sum + dados.totais[mes], 0);
                const percentual = totalReceitas > 0 ? (total / totalReceitas * 100) : 0;
                
                html += `
                    <tr class="dre-categoria">
                        <td></td>
                        <td>${categoria}</td>
                        ${meses.map(mes => `<td class="valor-positivo">${formatCurrency(dados.totais[mes])}</td>`).join('')}
                        <td class="valor-positivo">${formatCurrency(total)}</td>
                        <td class="percentual">${formatPercentual(percentual)}</td>
                    </tr>`;
            }
        });
    }
    
    // Seção Despesas
    if (totalDespesas > 0) {
        html += `
            <tr class="dre-section-header">
                <td></td>
                <td>DESPESAS</td>
                ${meses.map(mes => `<td>${formatCurrency(estrutura.despesas[mes])}</td>`).join('')}
                <td>${formatCurrency(totalDespesas)}</td>
                <td>${formatPercentual(totalDespesas / (totalReceitas) * 100)}</td>
            </tr>`;
        
        // Categorias de despesas
        Object.entries(categorias).forEach(([categoria, dados]) => {
            if (dados.tipo === 'despesa') {
                const total = meses.reduce((sum, mes) => sum + dados.totais[mes], 0);
                const percentual = totalDespesas > 0 ? (total / totalDespesas * 100) : 0;
                
                html += `
                    <tr class="dre-categoria">
                        <td></td>
                        <td>${categoria}</td>
                        ${meses.map(mes => `<td class="valor-negativo">${formatCurrency(dados.totais[mes])}</td>`).join('')}
                        <td class="valor-negativo">${formatCurrency(total)}</td>
                        <td class="percentual">${formatPercentual(percentual)}</td>
                    </tr>`;
            }
        });
    }
    
    // Resultado final
    const totalLiquido = totalReceitas - totalDespesas;
    const cssClass = totalLiquido >= 0 ? 'valor-positivo' : 'valor-negativo';
    
    html += `
        <tr class="dre-total">
            <td></td>
            <td>RESULTADO LÍQUIDO</td>
            ${meses.map(mes => {
                const valorMes = estrutura.receitas[mes] - estrutura.despesas[mes];
                const mesCssClass = valorMes >= 0 ? 'valor-positivo' : 'valor-negativo';
                return `<td class="${mesCssClass}">${formatCurrency(valorMes)}</td>`;
            }).join('')}
            <td class="${cssClass}">${formatCurrency(totalLiquido)}</td>
            <td class="percentual">${totalReceitas > 0 ? formatPercentual(Math.abs(totalLiquido) / totalReceitas * 100) : '0%'}</td>
        </tr>`;
    
    return html;
}

// Controles simples de drill-down (Power BI básico)
function addDrillDownListeners() {
    document.querySelectorAll('.drill-toggle').forEach(toggle => {
        toggle.addEventListener('click', function() {
            const categoria = this.getAttribute('data-categoria');
            const subcategorias = document.querySelectorAll(`.drill-content[data-parent="${categoria}"]`);
            
            if (this.classList.contains('expanded')) {
                this.classList.remove('expanded');
                this.textContent = '▶';
                subcategorias.forEach(row => row.classList.remove('show'));
            } else {
                this.classList.add('expanded');
                this.textContent = '▼';
                subcategorias.forEach(row => row.classList.add('show'));
            }
        });
    });
}

// Formatação simples para Power BI
function formatCurrency(value) {
    if (value === 0) return '0';
    return new Intl.NumberFormat('pt-BR', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(Math.abs(value));
}

function formatPercentual(value) {
    if (value === 0) return '0%';
    return new Intl.NumberFormat('pt-BR', {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1
    }).format(value) + '%';
}

// Função para atualizar total de registros
function updateTotalRegistros(data, app) {
    if (app.config.dom.totalRegistros) {
        app.config.dom.totalRegistros.textContent = `${data.length} registros encontrados`;
    }
}

// Função para carregar e combinar dados
async function loadCombinedData() {
    try {
        const [receitasData, despesasData] = await Promise.all([
            fetch('assets/data/contas_a_receber_data.json?v=' + Date.now()).then(res => res.json()),
            fetch('assets/data/contas_a_pagar_data.json?v=' + Date.now()).then(res => res.json())
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
    try {
        const data = await loadCombinedData();
        console.log('Dados carregados:', data.length, 'registros');
        
        if (data.length === 0) {
            console.warn('Nenhum dado foi carregado');
            document.getElementById('dre-table-body').innerHTML = '<tr><td colspan="15" class="text-center py-8 text-gray-500">Nenhum dado encontrado</td></tr>';
            return;
        }
        
        const app = new DashboardApp(dreConfig);
        app.init(data);
    } catch (error) {
        console.error('Erro na inicialização:', error);
        document.getElementById('dre-table-body').innerHTML = '<tr><td colspan="15" class="text-center py-8 text-red-500">Erro ao carregar dados</td></tr>';
    }
}); 