document.addEventListener('DOMContentLoaded', () => {
    let agingChartInstance;
    let valorPorNaturezaChartInstance;

    const createOrUpdateChart = (instance, chartDomElement, type, data, options) => {
        if (instance) {
            instance.destroy();
        }

        // Remover todos os event listeners do canvas antes de recriar
        if (chartDomElement._contextMenuHandler) {
            chartDomElement.removeEventListener('contextmenu', chartDomElement._contextMenuHandler);
            delete chartDomElement._contextMenuHandler;
        }

        return new Chart(chartDomElement, { type, data, options });
    };

    const getMedian = (arr) => {
        const mid = Math.floor(arr.length / 2);
        const nums = [...arr].sort((a, b) => a - b);
        return arr.length % 2 !== 0 ? nums[mid] : (nums[mid - 1] + nums[mid]) / 2;
    };

    const generateMockData = () => {
        const data = [];
        const today = new Date(2025, 6, 4);

        const gruposNatureza = ["Impostos", "Compras", "Despesas com Pessoal", "Remuneração da Diretoria", "Despesas Comerciais", "Despesas Ocupação", "Outras Despesas", "Manutenção"];
        const naturezasOperacao = ["Matéria Prima", "Serviços Terceiros", "Energia Elétrica", "Telefone", "Aluguel", "Salários", "Encargos Sociais", "Impostos Federais", "Impostos Estaduais", "Impostos Municipais", "Manutenção Equipamentos", "Material de Escritório"];


        // Archetypes
        const archetypes = {
            good: { count: 500, pmpRange: [5, 15], overdueRange: [500, 5000], totalValueRange: [10000, 50000] },
            bigSlow: { count: 200, pmpRange: [30, 60], overdueRange: [10000, 30000], totalValueRange: [100000, 500000] },
            problematic: { count: 150, pmpRange: [45, 90], overdueRange: [25000, 100000], totalValueRange: [50000, 200000] },
            infrequent: { count: 350, pmpRange: [10, 40], overdueRange: [100, 2000], totalValueRange: [1000, 10000] }
        };

        let id = 1;
        for (const type in archetypes) {
            const config = archetypes[type];
            for (let i = 0; i < config.count; i++) {
                const fornecedor = `${type.charAt(0).toUpperCase() + type.slice(1)} Supplier ${i + 1}`;
                const valorSaldo = parseFloat((Math.random() * (config.totalValueRange[1] - config.totalValueRange[0]) + config.totalValueRange[0]).toFixed(2));

                // Modified logic to create varied due dates
                const diasParaVencer = Math.floor(Math.random() * 120) - 30; // Range from -30 to +90 days

                data.push({
                    id: id++,
                    fornecedor: fornecedor,
                    documento: `DOC-${id}`,
                    prefixo: "PAG",
                    dataEmissao: new Date(today.getTime() - (diasParaVencer + 30) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                    dataVencimento: new Date(today.getTime() + diasParaVencer * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                    valorSaldo: valorSaldo,
                    grupoNatureza: gruposNatureza[id % gruposNatureza.length],
                    naturezaOperacao: naturezasOperacao[id % naturezasOperacao.length],

                    empresa: ["6F", "8F", "PEQUETITA"][id % 3],
                    diasParaVencer: diasParaVencer,
                    isInternal: false
                });
            }
        }
        return data;
    };

    const config = {
        initialFilters: {
            gruposNatureza: [],
            naturezasOperacao: [],
            fornecedores: [],
            empresas: [],
            includeInternal: false
        },
        dom: {
            naturezaFilterContainer: document.getElementById('natureza-filter-container'),
            naturezaOperacaoFilterContainer: document.getElementById('natureza-operacao-filter-container'),

            empresaFilterContainer: document.getElementById('empresa-filter-container'),
            internalToggle: document.getElementById('internal-toggle'),
            kpiContainer: document.getElementById('kpi-container'),
            agingChart: document.getElementById('aging-chart'),
            valorPorNaturezaChart: document.getElementById('valor-por-natureza-chart'),
            detailedTableBody: document.getElementById('detailed-table-body'),
            activeFiltersContainer: document.getElementById('active-filters-container'),
            clearFiltersBtn: document.getElementById('clear-filters-btn'),
            drilldownModal: document.getElementById('drilldown-modal'),
            drilldownModalTitle: document.getElementById('drilldown-modal-title'),
            drilldownModalCloseBtn: document.getElementById('drilldown-modal-close-btn'),
            drilldownModalTableBody: document.getElementById('drilldown-modal-table-body'),
            paginationControls: document.getElementById('pagination-controls'),
        },
        allEmpresas: ["8F", "6F", "PEQUETITA"],
        allNaturezas: ["Impostos", "Compras", "Despesas com Pessoal", "Remuneração da Diretoria", "Despesas Comerciais", "Despesas Ocupação", "Outras Despesas", "Manutenção"],
        allNaturezasOperacao: ["Matéria Prima", "Serviços Terceiros", "Energia Elétrica", "Telefone", "Aluguel", "Salários", "Encargos Sociais", "Impostos Federais", "Impostos Estaduais", "Impostos Municipais", "Manutenção Equipamentos", "Material de Escritório"],

        filterPillDefinitions: [
            { type: 'fornecedores', label: 'Fornecedor' },
            { type: 'gruposNatureza', label: 'Grupo Natureza' },
            { type: 'naturezasOperacao', label: 'Natureza Operação' },

            { type: 'empresas', label: 'Empresa' },
        ],
        customSelects: [
            { type: 'Grupos Natureza', options: ["Impostos", "Compras", "Despesas com Pessoal", "Remuneração da Diretoria", "Despesas Comerciais", "Despesas Ocupação", "Outras Despesas", "Manutenção"], filterKey: 'gruposNatureza', containerId: 'natureza-filter-container' },
            { type: 'Naturezas Operação', options: ["Matéria Prima", "Serviços Terceiros", "Energia Elétrica", "Telefone", "Aluguel", "Salários", "Encargos Sociais", "Impostos Federais", "Impostos Estaduais", "Impostos Municipais", "Manutenção Equipamentos", "Material de Escritório"], filterKey: 'naturezasOperacao', containerId: 'natureza-operacao-filter-container' },

            { type: 'Empresas', options: ["8F", "6F", "PEQUETITA"], filterKey: 'empresas', containerId: 'empresa-filter-container' },
        ],
        getFilteredData: (rawData, activeFilters) => {
            return rawData.filter(item => {
                const naturezaMatch = activeFilters.gruposNatureza.length === 0 || activeFilters.gruposNatureza.includes(item.grupoNatureza);
                const naturezaOperacaoMatch = activeFilters.naturezasOperacao.length === 0 || activeFilters.naturezasOperacao.includes(item.naturezaOperacao);

                const fornecedorMatch = activeFilters.fornecedores.length === 0 || activeFilters.fornecedores.includes(item.fornecedor);
                const empresaMatch = activeFilters.empresas.length === 0 || activeFilters.empresas.includes(item.empresa);
                const internalMatch = activeFilters.includeInternal || !item.isInternal;
                return naturezaMatch && naturezaOperacaoMatch && empresaMatch && fornecedorMatch && internalMatch;
            });
        },
        renderTable: (data, app, tableBody) => {
            const pageData = data.slice((app.currentPage - 1) * app.rowsPerPage, app.currentPage * app.rowsPerPage);
            tableBody.innerHTML = '';
            if (pageData.length === 0) {
                const row = tableBody.insertRow();
                const cell = row.insertCell();
                cell.colSpan = 7;
                cell.className = 'p-6 text-center text-gray-500 text-sm';
                cell.textContent = 'Nenhum dado encontrado para os filtros selecionados.';
                return;
            }
            pageData.forEach(d => {
                const row = tableBody.insertRow();
                row.className = 'border-b border-gray-100 hover:bg-blue-50 transition-colors';

                // Fornecedor (truncado se muito longo)
                const fornecedorTruncated = d.fornecedor.length > 25 ? d.fornecedor.substring(0, 25) + '...' : d.fornecedor;
                row.insertCell().outerHTML = `<td class="p-2 cursor-pointer hover:text-blue-600 font-medium" onclick="app.applyFilter('fornecedores', '${d.fornecedor}', event.ctrlKey)" title="${d.fornecedor}">${fornecedorTruncated}</td>`;

                row.insertCell().outerHTML = `<td class="p-2 text-gray-600">${d.documento}</td>`;
                row.insertCell().outerHTML = `<td class="p-2 text-gray-600">${new Date(d.dataEmissao + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}</td>`;

                // Vencimento com cor baseada no status
                const vencimentoClass = d.diasParaVencer < 0 ? 'text-red-600 font-medium' : d.diasParaVencer <= 7 ? 'text-orange-600 font-medium' : 'text-gray-600';
                row.insertCell().outerHTML = `<td class="p-2 ${vencimentoClass}">${new Date(d.dataVencimento + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}</td>`;

                row.insertCell().outerHTML = `<td class="p-2 text-right font-medium text-gray-800">${d.valorSaldo.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>`;

                // Natureza (truncada)
                const naturezaTruncated = d.grupoNatureza.length > 15 ? d.grupoNatureza.substring(0, 15) + '...' : d.grupoNatureza;
                row.insertCell().outerHTML = `<td class="p-2 cursor-pointer hover:text-blue-600 text-gray-600" onclick="app.applyFilter('gruposNatureza', '${d.grupoNatureza}', event.ctrlKey)" title="${d.grupoNatureza}">${naturezaTruncated}</td>`;

                row.insertCell().outerHTML = `<td class="p-2 cursor-pointer hover:text-blue-600 text-gray-600" onclick="app.applyFilter('empresas', '${d.empresa}', event.ctrlKey)">${d.empresa}</td>`;
            });
        },
        renderFunctions: [
            function renderKPIs(data, app) {
                const totalPagar = data.reduce((sum, d) => sum + d.valorSaldo, 0);
                const totalVencido = data.filter(d => d.diasParaVencer < 0).reduce((sum, d) => sum + d.valorSaldo, 0);
                const percVencido = totalPagar > 0 ? (totalVencido / totalPagar) * 100 : 0;
                const pmpData = data.filter(d => d.diasParaVencer < 0);
                const diasPonderados = pmpData.reduce((sum, d) => sum + (d.valorSaldo * Math.abs(d.diasParaVencer)), 0);
                const pmp = totalVencido > 0 ? diasPonderados / totalVencido : 0;
                const kpis = [
                    { label: 'Valor Total a Pagar', value: totalPagar.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), color: 'text-blue-600' },
                    { label: 'Valor Total Vencido', value: totalVencido.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), color: 'text-red-600' },
                    { label: 'PMP (dias)', value: pmp.toFixed(1), color: 'text-orange-500' },
                    { label: '% de Contas Vencidas', value: `${percVencido.toFixed(1)}%`, color: 'text-red-600' },
                ];
                app.config.dom.kpiContainer.innerHTML = kpis.map(kpi => `
                    <div class="bg-white rounded-lg shadow-sm border p-3">
                        <p class="text-xs text-gray-500 mb-1">${kpi.label}</p>
                        <p class="text-lg font-bold ${kpi.color}">${kpi.value}</p>
                    </div>
                `).join('');
            },
            function renderValorPorNaturezaChart(data, app) {
                // Agrupar dados por natureza
                const naturezaData = {};
                data.forEach(d => {
                    if (!naturezaData[d.grupoNatureza]) {
                        naturezaData[d.grupoNatureza] = 0;
                    }
                    naturezaData[d.grupoNatureza] += d.valorSaldo;
                });

                // Ordenar por valor (maior para menor)
                const sortedNaturezas = Object.entries(naturezaData)
                    .sort(([, a], [, b]) => b - a);

                const labels = sortedNaturezas.map(([natureza]) => natureza);
                const values = sortedNaturezas.map(([, valor]) => valor);

                // Cores gradientes do maior para o menor
                const colors = [
                    'rgba(239, 68, 68, 0.8)',    // Vermelho (maior)
                    'rgba(245, 158, 11, 0.8)',   // Amarelo
                    'rgba(59, 130, 246, 0.8)',   // Azul
                    'rgba(16, 185, 129, 0.8)',   // Verde
                    'rgba(139, 92, 246, 0.8)',   // Roxo
                    'rgba(236, 72, 153, 0.8)',   // Rosa
                    'rgba(34, 197, 94, 0.8)',    // Verde claro
                    'rgba(251, 146, 60, 0.8)'    // Laranja
                ];

                const chartData = {
                    labels: labels,
                    datasets: [{
                        label: 'Valor Total',
                        data: values,
                        backgroundColor: colors.slice(0, labels.length),
                        borderColor: colors.slice(0, labels.length).map(color => color.replace('0.8', '1')),
                        borderWidth: 1
                    }]
                };

                const options = {
                    indexAxis: 'y', // Barras horizontais
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: false // Não mostrar legenda para gráfico simples
                        },
                        tooltip: {
                            callbacks: {
                                label: function (context) {
                                    return `${context.parsed.x.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`;
                                }
                            }
                        }
                    },
                    scales: {
                        x: {
                            display: true,
                            title: {
                                display: true,
                                text: 'Valor (R$)'
                            },
                            beginAtZero: true,
                            ticks: {
                                callback: value => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                            }
                        },
                        y: {
                            display: true,
                            title: {
                                display: true,
                                text: 'Natureza'
                            }
                        }
                    },
                    onClick: (event, elements) => {
                        if (elements.length > 0) {
                            const index = elements[0].index;
                            const natureza = labels[index];
                            // Filtro cruzado: aplicar filtro ao clicar
                            app.applyFilter('gruposNatureza', natureza, event.ctrlKey);
                        }
                    },
                    onHover: (event, elements) => {
                        event.native.target.style.cursor = elements.length > 0 ? 'pointer' : 'default';
                    }
                };

                // Criar nova função handler para drill-through
                app.config.dom.valorPorNaturezaChart._contextMenuHandler = function (e) {
                    e.preventDefault();
                    const rect = this.getBoundingClientRect();
                    const x = e.clientX - rect.left;
                    const y = e.clientY - rect.top;
                    const points = valorPorNaturezaChartInstance.getElementsAtEventForMode(e, 'nearest', { intersect: true }, true);

                    if (points.length > 0) {
                        const index = points[0].index;
                        const natureza = labels[index];
                        const drillData = data.filter(d => d.grupoNatureza === natureza);
                        app.openDrillDownModal(`Drill Through - ${natureza}`, drillData);
                    } else {
                        // Se não clicou em uma barra específica, mostrar todos os dados filtrados
                        app.openDrillDownModal('Drill Through - Todas as Contas por Natureza', data);
                    }
                };

                // Adicionar evento de clique direito para drill-through
                app.config.dom.valorPorNaturezaChart.addEventListener('contextmenu', app.config.dom.valorPorNaturezaChart._contextMenuHandler);

                valorPorNaturezaChartInstance = createOrUpdateChart(valorPorNaturezaChartInstance, app.config.dom.valorPorNaturezaChart, 'bar', chartData, options);
            },
            function renderAgingChart(data, app) {
                const buckets = { vencido: 0, hoje: 0, dias7: 0, dias15: 0, dias30: 0, mais30: 0 };
                data.forEach(d => {
                    if (d.diasParaVencer < 0) buckets.vencido += d.valorSaldo;
                    else if (d.diasParaVencer === 0) buckets.hoje += d.valorSaldo;
                    else if (d.diasParaVencer <= 7) buckets.dias7 += d.valorSaldo;
                    else if (d.diasParaVencer <= 15) buckets.dias15 += d.valorSaldo;
                    else if (d.diasParaVencer <= 30) buckets.dias30 += d.valorSaldo;
                    else buckets.mais30 += d.valorSaldo;
                });
                const chartData = { labels: ["Vencido", "Vence Hoje", "Vence em 7d", "Vence em 15d", "Vence em 30d", "Vence em +30d"], datasets: [{ label: 'Valor a Pagar', data: Object.values(buckets), backgroundColor: ['rgba(239, 68, 68, 1)', 'rgba(249, 115, 22, 1)', 'rgba(59, 130, 246, 1)', 'rgba(59, 130, 246, 1)', 'rgba(59, 130, 246, 1)', 'rgba(59, 130, 246, 1)'], }] };
                const options = {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                callback: value => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                            }
                        }
                    },
                    onClick: (event, elements) => {
                        if (elements.length > 0) {
                            const index = elements[0].index;
                            // Filtro cruzado baseado no período de vencimento
                            const filterData = {
                                0: { type: 'vencido', filter: d => d.diasParaVencer < 0 },
                                1: { type: 'hoje', filter: d => d.diasParaVencer === 0 },
                                2: { type: '7dias', filter: d => d.diasParaVencer > 0 && d.diasParaVencer <= 7 },
                                3: { type: '15dias', filter: d => d.diasParaVencer > 7 && d.diasParaVencer <= 15 },
                                4: { type: '30dias', filter: d => d.diasParaVencer > 15 && d.diasParaVencer <= 30 },
                                5: { type: 'mais30', filter: d => d.diasParaVencer > 30 }
                            };

                            // Aplicar filtro customizado baseado no aging
                            app.applyAgingFilter(filterData[index].type);
                        }
                    },
                    onHover: (event, elements) => {
                        event.native.target.style.cursor = elements.length > 0 ? 'pointer' : 'default';
                    }
                };

                // Criar nova função handler para drill-through
                app.config.dom.agingChart._contextMenuHandler = function (e) {
                    e.preventDefault();
                    const rect = this.getBoundingClientRect();
                    const x = e.clientX - rect.left;
                    const y = e.clientY - rect.top;
                    const points = agingChartInstance.getElementsAtEventForMode(e, 'nearest', { intersect: true }, true);

                    if (points.length > 0) {
                        const index = points[0].index;
                        const filterData = {
                            0: { type: 'vencido', filter: d => d.diasParaVencer < 0, label: 'Vencido' },
                            1: { type: 'hoje', filter: d => d.diasParaVencer === 0, label: 'Vence Hoje' },
                            2: { type: '7dias', filter: d => d.diasParaVencer > 0 && d.diasParaVencer <= 7, label: 'Vence em 7 dias' },
                            3: { type: '15dias', filter: d => d.diasParaVencer > 7 && d.diasParaVencer <= 15, label: 'Vence em 15 dias' },
                            4: { type: '30dias', filter: d => d.diasParaVencer > 15 && d.diasParaVencer <= 30, label: 'Vence em 30 dias' },
                            5: { type: 'mais30', filter: d => d.diasParaVencer > 30, label: 'Vence em +30 dias' }
                        };

                        const selectedFilter = filterData[index];
                        const drillData = data.filter(selectedFilter.filter);
                        app.openDrillDownModal(`Drill Through - ${selectedFilter.label}`, drillData);
                    } else {
                        // Se não clicou em uma barra específica, mostrar todos os dados filtrados
                        app.openDrillDownModal('Drill Through - Aging List Completo', data);
                    }
                };

                // Adicionar evento de clique direito para drill-through
                app.config.dom.agingChart.addEventListener('contextmenu', app.config.dom.agingChart._contextMenuHandler);

                agingChartInstance = createOrUpdateChart(agingChartInstance, app.config.dom.agingChart, 'bar', chartData, options);
            },
            function renderMainTable(data, app) {
                app.config.renderTable(data, app, app.config.dom.detailedTableBody);
            }
        ],
        setupEventListeners: (app) => {
            app.config.dom.internalToggle.addEventListener('change', e => { app.applyFilter('includeInternal', e.target.checked); });
            app.config.dom.clearFiltersBtn.addEventListener('click', app.clearFilters);
            app.config.dom.drilldownModalCloseBtn.addEventListener('click', app.closeDrillDownModal);
            app.config.dom.drilldownModal.addEventListener('click', e => { if (e.target === app.config.dom.drilldownModal) app.closeDrillDownModal(); });
        }
    };

    const app = new DashboardApp(config);

    // Adicionar método para filtro de aging
    app.applyAgingFilter = function (agingType) {
        // Limpar filtros existentes relacionados ao aging
        this.activeFilters.agingFilter = agingType;
        this.currentPage = 1;
        this.updateDashboard();
    };

    // Sobrescrever getFilteredData para incluir filtro de aging
    const originalGetFilteredData = config.getFilteredData;
    config.getFilteredData = (rawData, activeFilters) => {
        let data = originalGetFilteredData(rawData, activeFilters);

        // Aplicar filtro de aging se existir
        if (activeFilters.agingFilter) {
            switch (activeFilters.agingFilter) {
                case 'vencido':
                    data = data.filter(d => d.diasParaVencer < 0);
                    break;
                case 'hoje':
                    data = data.filter(d => d.diasParaVencer === 0);
                    break;
                case '7dias':
                    data = data.filter(d => d.diasParaVencer > 0 && d.diasParaVencer <= 7);
                    break;
                case '15dias':
                    data = data.filter(d => d.diasParaVencer > 7 && d.diasParaVencer <= 15);
                    break;
                case '30dias':
                    data = data.filter(d => d.diasParaVencer > 15 && d.diasParaVencer <= 30);
                    break;
                case 'mais30':
                    data = data.filter(d => d.diasParaVencer > 30);
                    break;
            }
        }

        return data;
    };



    // Adicionar indicador visual de filtro ativo de aging
    const originalRenderActiveFilterPills = app.renderActiveFilterPills;
    app.renderActiveFilterPills = function () {
        originalRenderActiveFilterPills.call(this);

        // Adicionar pill para filtro de aging se ativo
        if (this.activeFilters.agingFilter) {
            const container = this.config.dom.activeFiltersContainer;
            const pill = document.createElement('div');
            pill.className = 'filter-pill bg-blue-200 text-blue-700 rounded-full px-3 py-1 text-sm font-medium';

            const agingLabels = {
                'vencido': 'Vencido',
                'hoje': 'Vence Hoje',
                '7dias': 'Vence em 7 dias',
                '15dias': 'Vence em 15 dias',
                '30dias': 'Vence em 30 dias',
                'mais30': 'Vence em +30 dias'
            };

            pill.innerHTML = `<span>Período: ${agingLabels[this.activeFilters.agingFilter]}</span><button class="ml-2 text-blue-500 hover:text-blue-800">&times;</button>`;
            pill.querySelector('button').onclick = () => {
                delete this.activeFilters.agingFilter;
                this.updateDashboard();
            };
            container.appendChild(pill);
        }
    };

    // Limpar filtro de aging ao limpar todos os filtros
    const originalClearFilters = app.clearFilters;
    app.clearFilters = function () {
        originalClearFilters.call(this);
        delete this.activeFilters.agingFilter;
        this.updateDashboard();
    };

    // Adicionar tooltips informativos para os gráficos
    const addChartTooltips = () => {
        const valorChart = document.getElementById('valor-por-natureza-chart');
        const agingChart = document.getElementById('aging-chart');

        if (valorChart) {
            valorChart.title = 'Clique esquerdo: Filtrar por natureza | Clique direito: Ver detalhes';
        }

        if (agingChart) {
            agingChart.title = 'Clique esquerdo: Filtrar por período | Clique direito: Ver detalhes';
        }
    };

    // Adicionar indicadores visuais de interatividade
    const addInteractivityIndicators = () => {
        const charts = document.querySelectorAll('canvas');
        charts.forEach(chart => {
            chart.style.cursor = 'pointer';
            chart.addEventListener('mouseenter', function () {
                this.style.opacity = '0.9';
            });
            chart.addEventListener('mouseleave', function () {
                this.style.opacity = '1';
            });
        });
    };

    // Executar após inicialização
    setTimeout(() => {
        addChartTooltips();
        addInteractivityIndicators();
    }, 100);

    app.init(generateMockData());
});
