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
    
    // Usar dados estruturados em vez de processar dados dinâmicos
    const html = generateDRERows();
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

// Dados estruturados com drill-down (baseados nos dados fornecidos)
const dadosEstruturados = [
    {
        nome: "SALDO INICIAL",
        tipo: "header",
        valores: [0, 339393, 77088, 179292, -70917, -1021785, -1685326, -2481708, -3269076, -4592950, -5910394, -7234583]
    },
    {
        nome: "RECEBIMENTOS 6F", 
        tipo: "receita",
        valores: [935369, 1242684, 598176, 348475, 217962, 134695, 90530, 93018, 11115, 11115, 2333, 0]
    },
    {
        nome: "RECEBIMENTOS 8F",
        tipo: "receita", 
        valores: [1001331, 488901, 497896, 381987, 227776, 147711, 82798, 61207, 23837, 23837, 0, 0]
    },
    {
        nome: "RECEBIMENTOS PEQUETITA",
        tipo: "receita",
        valores: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    },
    {
        nome: "TRIBUTOS SOBRE VENDAS",
        tipo: "grupo_despesa",
        expansivel: true,
        valores: [-58504, -93921, -262000, -262000, -262000, -262000, -262000, -262000, -262000, -262000, -262000, -262000],
        filhos: [
            { nome: "28101 ICMS COMUM", valores: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
            { nome: "28103 PIS", valores: [0, -1950, -17000, -17000, -17000, -17000, -17000, -17000, -17000, -17000, -17000, -17000] },
            { nome: "28104 COFINS", valores: [0, -8999, -74000, -74000, -74000, -74000, -74000, -74000, -74000, -74000, -74000, -74000] },
            { nome: "28105 IPI", valores: [0, 0, -90000, -90000, -90000, -90000, -90000, -90000, -90000, -90000, -90000, -90000] },
            { nome: "28107 SIMPLES", valores: [0, 0, -25000, -25000, -25000, -25000, -25000, -25000, -25000, -25000, -25000, -25000] },
            { nome: "28108 ICMS SUBST.", valores: [-57531, -25635, -50000, -50000, -50000, -50000, -50000, -50000, -50000, -50000, -50000, -50000] },
            { nome: "28110 GNRE", valores: [-973, -57337, -6000, -6000, -6000, -6000, -6000, -6000, -6000, -6000, -6000, -6000] }
        ]
    },
    {
        nome: "RECEBIMENTOS LÍQUIDOS DE IMPOSTOS",
        tipo: "header",
        valores: [1878197, 1637664, 834071, 468461, 183739, 20406, -88671, -107774, -227048, -227047, -259667, -262000]
    },
    {
        nome: "COMPRAS",
        tipo: "despesa",
        valores: [-1319293, -1148216, -38715, -24110, -21500, -23540, -31940, -16500, -18540, -15300, -28140, -14940]
    },
    {
        nome: "MARGEM BRUTA",
        tipo: "header",
        valores: [558904, 489447, 795356, 444352, 162239, -3134, -120611, -124274, -245588, -242347, -287807, -276940]
    },
    {
        nome: "DESPESAS COM PESSOAL",
        tipo: "grupo_despesa",
        expansivel: true,
        valores: [-213407, -259161, -183913, -183320, -183320, -183320, -183320, -183320, -183320, -183320, -186820, -298946],
        filhos: [
            { nome: "21101 SALARIOS", valores: [-56211, -38140, -54319, -54319, -54319, -54319, -54319, -54319, -54319, -54319, -54319, -57857] },
            { nome: "21102 VALE / ADIANTAMENTO", valores: [-23787, -29182, -27000, -27000, -27000, -27000, -27000, -27000, -27000, -27000, -27000, -27000] },
            { nome: "21103 EMPRESTIMO A FUNCIONARIOS", valores: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
            { nome: "21104 13O SALARIO", valores: [0, -77766, 0, 0, 0, 0, 0, 0, 0, 0, -3500, -76200] },
            { nome: "21105 FERIAS", valores: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
            { nome: "21106 RESCISAO", valores: [0, -1064, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
            { nome: "21107 GRATIFICACOES", valores: [0, -12000, -12000, -12000, -12000, -12000, -12000, -12000, -12000, -12000, -12000, -12000] },
            { nome: "21151 REMUNERACAO PJ", valores: [-10500, -18500, -7000, -7000, -7000, -7000, -7000, -7000, -7000, -7000, -7000, -7000] },
            { nome: "21301 VALE TRANSPORTE", valores: [-16516, -9636, -9212, -9212, -9212, -9212, -9212, -9212, -9212, -9212, -9212, -4000] },
            { nome: "21302 VALE REFEICAO", valores: [-36402, -21000, -21000, -21000, -21000, -21000, -21000, -21000, -21000, -21000, -21000, -21000] },
            { nome: "21303 CONVENIO MEDICO", valores: [-10323, -12459, -11923, -11329, -11329, -11329, -11329, -11329, -11329, -11329, -11329, -11329] },
            { nome: "21401 FGTS", valores: [-9966, -6548, -7500, -7500, -7500, -7500, -7500, -7500, -7500, -7500, -7500, -15000] },
            { nome: "21402 GPS ( INSS )", valores: [-38818, -31961, -33600, -33600, -33600, -33600, -33600, -33600, -33600, -33600, -33600, -67200] }
        ]
    },
    {
        nome: "REMUNERAÇÃO DA DIRETORIA",
        tipo: "grupo_despesa",
        expansivel: true,
        valores: [-31955, -42877, -49945, -49945, -49945, -49945, -49945, -49945, -49449, -49449, -49449, -49449],
        filhos: [
            { nome: "21201 PRO LABORE - ADMINISTRADORES", valores: [-2225, -2225, -2225, -2225, -2225, -2225, -2225, -2225, -2225, -2225, -2225, -2225] },
            { nome: "51101 DIVIDENDOS AOS SOCIOS", valores: [-29730, -40652, -47720, -47720, -47720, -47720, -47720, -47720, -47224, -47224, -47224, -47224] }
        ]
    },
    {
        nome: "DESPESAS COMERCIAIS",
        tipo: "grupo_despesa", 
        expansivel: true,
        valores: [-133486, -77950, -82690, -81852, -81828, -73828, -82721, -81828, -89828, -81828, -81828, -81828],
        filhos: [
            { nome: "24101 COMISSOES VENDEDORES", valores: [-59448, -14982, -71628, -71628, -71628, -63628, -71628, -71628, -79628, -71628, -71628, -71628] },
            { nome: "24201 FEIRAS", valores: [-25955, -32308, -838, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
            { nome: "24202 MONTADORA E DESPESAS STAND", valores: [-36978, -20000, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
            { nome: "24204 SITE", valores: [-12, -112, -100, -100, -100, -100, -993, -100, -100, -100, -100, -100] },
            { nome: "24205 ANUNCIOS E ASSES. DE IMPRENSA", valores: [-10100, -9700, -10100, -10100, -10100, -10100, -10100, -10100, -10100, -10100, -10100, -10100] }
        ]
    },
    {
        nome: "OUTRAS DESPESAS",
        tipo: "grupo_despesa",
        expansivel: true,
        valores: [-123834, -124229, -131156, -130766, -149917, -130301, -133289, -104023, -159031, -147303, -120498, -128247],
        filhos: [
            { nome: "22201 MATERIAL DE ESCRITORIO", valores: [-264, -1075, -1586, -1465, -1000, -1000, -1000, -1000, -1000, -1000, -1000, -1000] },
            { nome: "26201 ASSESSORIA CONTABIL / JURIDICA", valores: [-10280, -8767, -8260, -8260, -8260, -8260, -8260, -8260, -8260, -8260, -8260, -13520] },
            { nome: "41106 JUROS ANTECIPACAO RECEBIVEIS", valores: [-45582, -64141, -76335, -76335, -76335, -76335, -76335, -76227, -76118, -76007, -75894, -69780] },
            { nome: "41110 JUROS EMPRESTIMOS/CAPITAL GIRO", valores: [-8323, -17305, -17305, -17305, -17305, -17305, -17305, -17305, -17305, -17305, -17305, -17305] }
        ]
    }
];

// Função para gerar linhas com drill-down
function generateDRERows() {
    let html = '';
    
    dadosEstruturados.forEach((item, index) => {
        const total = item.valores.reduce((sum, val) => sum + val, 0);
        
        if (item.expansivel) {
            // Linha expansível (grupo)
            html += `
                <tr class="dre-categoria" data-toggle="${index}" style="cursor: pointer;">
                    <td><span class="drill-toggle">▶</span></td>
                    <td><strong>${item.nome}</strong></td>
                    ${item.valores.map(val => `<td class="${val < 0 ? 'valor-negativo' : (val > 0 ? 'valor-positivo' : '')}">${formatCurrency(val)}</td>`).join('')}
                    <td class="${total < 0 ? 'valor-negativo' : (total > 0 ? 'valor-positivo' : '')}">${formatCurrency(total)}</td>
                    <td class="percentual"></td>
                </tr>`;
            
            // Linhas filhas (ocultas por padrão)
            item.filhos.forEach(filho => {
                const totalFilho = filho.valores.reduce((sum, val) => sum + val, 0);
                html += `
                    <tr class="dre-subcategoria" data-parent="${index}" style="display: none;">
                        <td></td>
                        <td style="padding-left: 2rem; font-style: italic;">${filho.nome}</td>
                        ${filho.valores.map(val => `<td class="${val < 0 ? 'valor-negativo' : (val > 0 ? 'valor-positivo' : '')}">${formatCurrency(val)}</td>`).join('')}
                        <td class="${totalFilho < 0 ? 'valor-negativo' : (totalFilho > 0 ? 'valor-positivo' : '')}">${formatCurrency(totalFilho)}</td>
                        <td></td>
                    </tr>`;
            });
        } else {
            // Linha normal
            const classe = item.tipo === 'header' ? 'dre-section-header' : 
                         item.tipo === 'receita' ? 'dre-categoria' :
                         item.tipo === 'despesa' ? 'dre-categoria' : 'dre-categoria';
            
            html += `
                <tr class="${classe}">
                    <td></td>
                    <td>${item.nome}</td>
                    ${item.valores.map(val => `<td class="${val < 0 ? 'valor-negativo' : (val > 0 ? 'valor-positivo' : '')}">${formatCurrency(val)}</td>`).join('')}
                    <td class="${total < 0 ? 'valor-negativo' : (total > 0 ? 'valor-positivo' : '')}">${formatCurrency(total)}</td>
                    <td class="percentual"></td>
                </tr>`;
        }
    });
    
    return html;
}

// Controles simples de drill-down (Power BI básico)
function addDrillDownListeners() {
    // Adicionar listeners para linhas expansíveis
    document.querySelectorAll('[data-toggle]').forEach(row => {
        row.addEventListener('click', function() {
            const groupIndex = this.getAttribute('data-toggle');
            const childRows = document.querySelectorAll(`[data-parent="${groupIndex}"]`);
            const toggle = this.querySelector('.drill-toggle');
            
            if (this.classList.contains('expanded')) {
                // Recolher
                this.classList.remove('expanded');
                toggle.textContent = '▶';
                childRows.forEach(childRow => {
                    childRow.style.display = 'none';
                });
            } else {
                // Expandir
                this.classList.add('expanded');
                toggle.textContent = '▼';
                childRows.forEach(childRow => {
                    childRow.style.display = 'table-row';
                });
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