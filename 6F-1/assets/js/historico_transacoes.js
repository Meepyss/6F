// Histórico de Transações Dashboard
// Este arquivo será implementado nas próximas tarefas

class HistoricoTransacoesDashboard extends DashboardApp {
    constructor() {
        // Configuração do dashboard, seguindo o padrão dos outros dashboards
        const empresas = ['6F', '8F', 'PEQUETITA'];
        const naturezas = ['Venda', 'Compra', 'Serviço', 'Despesa'];
        const tipos = ['Todos', 'Recebido', 'Pago'];
        const config = {
            initialFilters: {
                dateRange: 'all',
                empresas: [],
                tipo: 'Todos',
                naturezas: [],
                includeInternal: false,
            },
            dom: {
                dateRangeStart: document.getElementById('date-range-start'),
                dateRangeEnd: document.getElementById('date-range-end'),
                applyDateRange: document.getElementById('apply-date-range'),
                clearDateFilter: document.getElementById('clear-date-filter'),
                clearFiltersBtn: document.getElementById('clear-filters-btn'),
                activeFiltersContainer: document.getElementById('active-filters-container'),
                empresaFilterContainer: document.getElementById('empresa-filter-container'),
                tipoFilterContainer: document.getElementById('tipo-filter-container'),
                naturezaFilterContainer: document.getElementById('natureza-filter-container'),
                internalToggle: document.getElementById('internal-toggle'),
            },
            filterPillDefinitions: [
                { type: 'dateRange', label: 'Período' },
                { type: 'empresas', label: 'Empresa' },
                { type: 'tipo', label: 'Tipo' },
                { type: 'naturezas', label: 'Natureza' },
                { type: 'includeInternal', label: 'Mov. Internas' },
            ],
            customSelects: [
                { type: 'Empresas', options: empresas, filterKey: 'empresas', containerId: 'empresa-filter-container' },
                { type: 'Natureza', options: naturezas, filterKey: 'naturezas', containerId: 'natureza-filter-container' },
            ],
            getFilteredData: (rawData, activeFilters) => {
                // Filtro de período
                let dateMatch = () => true;
                if (activeFilters.dateRange !== 'all') {
                    const [startDate, endDate] = activeFilters.dateRange.split('|');
                    dateMatch = (item) => {
                        const itemDate = new Date(item.data + 'T00:00:00');
                        let match = true;
                        if (startDate && startDate !== 'null') {
                            const filterStartDate = new Date(startDate + 'T00:00:00');
                            match = match && itemDate >= filterStartDate;
                        }
                        if (endDate && endDate !== 'null') {
                            const filterEndDate = new Date(endDate + 'T00:00:00');
                            match = match && itemDate <= filterEndDate;
                        }
                        return match;
                    };
                }
                // Filtro de empresa
                const empresaMatch = (item) => activeFilters.empresas.length === 0 || activeFilters.empresas.includes(item.empresa);
                // Filtro de tipo
                const tipoMatch = (item) => activeFilters.tipo === 'Todos' || item.tipo === activeFilters.tipo;
                // Filtro de natureza
                const naturezaMatch = (item) => activeFilters.naturezas.length === 0 || activeFilters.naturezas.includes(item.natureza);
                // Filtro de mov. internas
                const internalMatch = (item) => activeFilters.includeInternal || !item.isInternal;
                return rawData.filter(item => dateMatch(item) && empresaMatch(item) && tipoMatch(item) && naturezaMatch(item) && internalMatch(item));
            },
            setupEventListeners: (app) => {
                // Botão aplicar filtro de data
                app.config.dom.applyDateRange.addEventListener('click', () => {
                    const startDate = app.config.dom.dateRangeStart.value || null;
                    const endDate = app.config.dom.dateRangeEnd.value || null;
                    const dateRange = `${startDate}|${endDate}`;
                    app.applyFilter('dateRange', dateRange);
                });
                // Botão limpar filtro de data
                app.config.dom.clearDateFilter.addEventListener('click', () => {
                    app.config.dom.dateRangeStart.value = '';
                    app.config.dom.dateRangeEnd.value = '';
                    app.applyFilter('dateRange', 'all');
                });
                // Botão YTD
                const ytdBtn = document.getElementById('ytd-date-filter');
                if (ytdBtn) {
                    ytdBtn.addEventListener('click', () => {
                        const today = new Date();
                        const year = today.getFullYear();
                        const start = `${year}-01-01`;
                        const end = today.toISOString().split('T')[0];
                        app.config.dom.dateRangeStart.value = start;
                        app.config.dom.dateRangeEnd.value = end;
                        const dateRange = `${start}|${end}`;
                        app.applyFilter('dateRange', dateRange);
                    });
                }
                // Botão Ano Anterior
                const previousYearBtn = document.getElementById('previous-year-filter');
                if (previousYearBtn) {
                    previousYearBtn.addEventListener('click', () => {
                        const today = new Date();
                        const currentYear = today.getFullYear();
                        const previousYear = currentYear - 1;
                        
                        // Se já há um período selecionado, usar o mesmo intervalo do ano anterior
                        if (app.config.dom.dateRangeStart.value && app.config.dom.dateRangeEnd.value) {
                            const startDate = new Date(app.config.dom.dateRangeStart.value);
                            const endDate = new Date(app.config.dom.dateRangeEnd.value);
                            const startPreviousYear = new Date(startDate.getFullYear() - 1, startDate.getMonth(), startDate.getDate());
                            const endPreviousYear = new Date(endDate.getFullYear() - 1, endDate.getMonth(), endDate.getDate());
                            
                            app.config.dom.dateRangeStart.value = startPreviousYear.toISOString().split('T')[0];
                            app.config.dom.dateRangeEnd.value = endPreviousYear.toISOString().split('T')[0];
                        } else {
                            // Se não há período selecionado, usar YTD do ano anterior
                            const start = `${previousYear}-01-01`;
                            const end = `${previousYear}-12-31`;
                            app.config.dom.dateRangeStart.value = start;
                            app.config.dom.dateRangeEnd.value = end;
                        }
                        
                        const dateRange = `${app.config.dom.dateRangeStart.value}|${app.config.dom.dateRangeEnd.value}`;
                        app.applyFilter('dateRange', dateRange);
                    });
                }
                // Enter aplica filtro
                [app.config.dom.dateRangeStart, app.config.dom.dateRangeEnd].forEach(input => {
                    input.addEventListener('keypress', (e) => {
                        if (e.key === 'Enter') {
                            app.config.dom.applyDateRange.click();
                        }
                    });
                });
                // Limpar todos os filtros
                app.config.dom.clearFiltersBtn.addEventListener('click', () => {
                    app.config.dom.dateRangeStart.value = '';
                    app.config.dom.dateRangeEnd.value = '';
                    app.clearFilters();
                });
                // Dropdown empresa e multi-select natureza já são tratados pelo DashboardApp
                // Filtro de tipo (radio)
                app.config.dom.tipoFilterContainer.innerHTML = tipos.map(tipo => `
                    <label class="mr-2 text-xs"><input type="radio" name="tipo-transacao" value="${tipo}" ${tipo === 'Todos' ? 'checked' : ''}/> ${tipo}</label>
                `).join('');
                app.config.dom.tipoFilterContainer.querySelectorAll('input[type=radio]').forEach(input => {
                    input.addEventListener('change', (e) => {
                        app.applyFilter('tipo', e.target.value);
                    });
                });
                // Toggle mov. internas
                app.config.dom.internalToggle.addEventListener('change', e => { app.applyFilter('includeInternal', e.target.checked); });
            },
        };
        super(config);
        this.currentData = [];
        this.filteredData = [];
        this.currentPage = 1;
        this.itemsPerPage = 25;
        this.sortColumn = 'data';
        this.sortDirection = 'desc';
        this.init();
    }

    generateMockData() {
        const empresas = ['6F', '8F', 'PEQUETITA'];
        const naturezas = ['Venda', 'Compra', 'Serviço', 'Despesa'];
        const clientes = ['Supermercado Sol', 'Hotel Palace', 'Indústria Metalúrgica', 'Comércio Varejista', 'Boutique Elegance', 'Restaurante Saboroso'];
        const documentos = ['NF-10001', 'NF-10002', 'NF-10003', 'NF-10004', 'NF-10005', 'NF-10006'];
        const tipos = ['Recebido', 'Pago'];
        const totalDias = 120;
        const hoje = new Date();
        const dataBase = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
        const mock = [];
        let id = 1;
        for (let i = 0; i < totalDias; i++) {
            const data = new Date(dataBase);
            data.setDate(dataBase.getDate() - i);
            // Gera de 2 a 5 transações por dia
            const transacoesNoDia = Math.floor(Math.random() * 4) + 2;
            for (let j = 0; j < transacoesNoDia; j++) {
                const tipo = tipos[Math.floor(Math.random() * tipos.length)];
                const empresa = empresas[Math.floor(Math.random() * empresas.length)];
                const natureza = naturezas[Math.floor(Math.random() * naturezas.length)];
                const cliente_fornecedor = clientes[Math.floor(Math.random() * clientes.length)];
                const documento = documentos[Math.floor(Math.random() * documentos.length)] + '-' + id;
                const valor = Math.floor(Math.random() * 9000) + 1000;
                const isInternal = Math.random() < 0.15;
                mock.push({
                    id: id.toString(),
                    tipo: tipo,
                    data: data.toISOString().split('T')[0],
                    valor: valor,
                    cliente_fornecedor: cliente_fornecedor,
                    documento: documento,
                    natureza: natureza,
                    empresa: empresa,
                    status: 'REALIZADO',
                    categoria: natureza,
                    isInternal: isInternal
                });
                id++;
            }
        }
        return mock;
    }

    calcularKPIs(data, periodoAnoAnterior = null) {
        // KPIs do período atual
        const totalRecebido = data.filter(d => d.tipo === 'Recebido').reduce((sum, d) => sum + d.valor, 0);
        const totalPago = data.filter(d => d.tipo === 'Pago').reduce((sum, d) => sum + d.valor, 0);
        const saldoLiquido = totalRecebido - totalPago;
        
        // Comparação com ano anterior (se disponível)
        let variacaoRecebidoAnoAnterior = 0, variacaoPagoAnoAnterior = 0, variacaoSaldoAnoAnterior = 0;
        
        if (periodoAnoAnterior && periodoAnoAnterior.length > 0) {
            const anoAnteriorRecebido = periodoAnoAnterior.filter(d => d.tipo === 'Recebido').reduce((sum, d) => sum + d.valor, 0);
            const anoAnteriorPago = periodoAnoAnterior.filter(d => d.tipo === 'Pago').reduce((sum, d) => sum + d.valor, 0);
            const anoAnteriorSaldo = anoAnteriorRecebido - anoAnteriorPago;
            variacaoRecebidoAnoAnterior = anoAnteriorRecebido ? ((totalRecebido - anoAnteriorRecebido) / anoAnteriorRecebido) * 100 : 0;
            variacaoPagoAnoAnterior = anoAnteriorPago ? ((totalPago - anoAnteriorPago) / anoAnteriorPago) * 100 : 0;
            variacaoSaldoAnoAnterior = anoAnteriorSaldo ? ((saldoLiquido - anoAnteriorSaldo) / anoAnteriorSaldo) * 100 : 0;
        }
        
        return {
            totalRecebido, totalPago, saldoLiquido,
            variacaoRecebidoAnoAnterior, variacaoPagoAnoAnterior, variacaoSaldoAnoAnterior
        };
    }

    renderKPIs(data, app) {
        const container = document.getElementById('kpi-container');
        if (!container) return;
        // Descobrir intervalo de datas atual
        if (!data.length) {
            container.innerHTML = '<div class="kpi-card col-span-3 text-center text-gray-400">Nenhuma transação encontrada para o período selecionado.</div>';
            return;
        }
        const datas = data.map(d => d.data).sort();
        const dataInicio = datas[0];
        const dataFim = datas[datas.length - 1];
        
        // Período do ano anterior (mesmo intervalo de datas)
        const dataInicioAnoAnterior = new Date(new Date(dataInicio).getTime() - 365 * 24 * 60 * 60 * 1000);
        const dataFimAnoAnterior = new Date(new Date(dataFim).getTime() - 365 * 24 * 60 * 60 * 1000);
        const periodoAnoAnterior = app.rawData.filter(d => d.data >= dataInicioAnoAnterior.toISOString().split('T')[0] && d.data <= dataFimAnoAnterior.toISOString().split('T')[0]);
        
        // Calcular KPIs
        const kpis = this.calcularKPIs(data, periodoAnoAnterior);
        
        // Ícones SVG inline
        const icons = [
            '<svg class="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 10v-1m0 0a2.5 2.5 0 100-5 2.5 2.5 0 000 5z"/></svg>',
            '<svg class="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19.5 12h-15"/></svg>',
            '<svg class="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.5v15m7.5-7.5h-15"/></svg>'
        ];
        
        // Renderizar KPIs com comparação do ano anterior
        container.innerHTML = `
            <div class="kpi-card flex flex-col gap-1">
                <div class="flex items-center gap-2">${icons[0]} <span class="font-semibold text-gray-700">Total Recebido</span></div>
                <div class="text-2xl font-bold text-green-600">${kpis.totalRecebido.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</div>
                <div class="text-xs text-gray-500">${kpis.variacaoRecebidoAnoAnterior >= 0 ? '+' : ''}${kpis.variacaoRecebidoAnoAnterior.toFixed(1)}% vs ano anterior</div>
            </div>
            <div class="kpi-card flex flex-col gap-1">
                <div class="flex items-center gap-2">${icons[1]} <span class="font-semibold text-gray-700">Total Pago</span></div>
                <div class="text-2xl font-bold text-red-600">${kpis.totalPago.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</div>
                <div class="text-xs text-gray-500">${kpis.variacaoPagoAnoAnterior >= 0 ? '+' : ''}${kpis.variacaoPagoAnoAnterior.toFixed(1)}% vs ano anterior</div>
            </div>
            <div class="kpi-card flex flex-col gap-1">
                <div class="flex items-center gap-2">${icons[2]} <span class="font-semibold text-gray-700">Saldo Líquido</span></div>
                <div class="text-2xl font-bold ${kpis.saldoLiquido >= 0 ? 'text-green-600' : 'text-red-600'}">${kpis.saldoLiquido.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</div>
                <div class="text-xs text-gray-500">${kpis.variacaoSaldoAnoAnterior >= 0 ? '+' : ''}${kpis.variacaoSaldoAnoAnterior.toFixed(1)}% vs ano anterior</div>
            </div>
        `;
    }

    init() {
        // Gerar dados simulados variados
        this.rawData = this.generateMockData();
        this.updateDashboard = this.updateDashboard.bind(this);
        this.renderKPIs = this.renderKPIs.bind(this);
        this.renderMainTable = this.renderMainTable.bind(this);
        this.renderEvolucaoTemporalChart = this.renderEvolucaoTemporalChart.bind(this);
        this.renderDistribuicaoNaturezaChart = this.renderDistribuicaoNaturezaChart.bind(this);
        this.config.renderFunctions = [this.renderKPIs, this.renderEvolucaoTemporalChart, this.renderDistribuicaoNaturezaChart, this.renderMainTable];
        // Chama a inicialização da base para renderizar os dropdowns
        super.init(this.rawData);
        console.log('Histórico de Transações Dashboard inicializado');
    }

    renderMainTable(data, app) {
        // Renderiza a tabela detalhada com todos os campos relevantes
        const tableBody = document.getElementById('detailed-table-body');
        tableBody.innerHTML = '';
        if (data.length === 0) {
            const row = tableBody.insertRow();
            const cell = row.insertCell();
            cell.colSpan = 7;
            cell.className = 'p-6 text-center text-gray-500 text-sm';
            cell.textContent = 'Nenhuma transação encontrada.';
            return;
        }
        data.forEach(item => {
            const row = tableBody.insertRow();
            row.className = 'border-b border-gray-100 hover:bg-blue-50 transition-colors';
            row.insertCell().outerHTML = `<td class="p-2">${item.data}</td>`;
            row.insertCell().outerHTML = `<td class="p-2">${item.tipo}</td>`;
            row.insertCell().outerHTML = `<td class="p-2">${item.cliente_fornecedor}</td>`;
            row.insertCell().outerHTML = `<td class="p-2">${item.documento}</td>`;
            row.insertCell().outerHTML = `<td class="p-2 text-right">${item.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>`;
            row.insertCell().outerHTML = `<td class="p-2">${item.natureza}</td>`;
            row.insertCell().outerHTML = `<td class="p-2">${item.empresa}</td>`;
        });
    }

    renderEvolucaoTemporalChart(data, app) {
        const canvas = document.getElementById('evolucao-temporal-chart');
        if (!canvas) return;

        // Destruir gráfico existente se houver
        if (this.evolucaoTemporalChart) {
            this.evolucaoTemporalChart.destroy();
        }

        if (!data || data.length === 0) {
            canvas.style.display = 'none';
            return;
        }

        canvas.style.display = 'block';

        // Agrupar dados por data
        const dadosPorData = {};
        data.forEach(item => {
            const data = item.data;
            if (!dadosPorData[data]) {
                dadosPorData[data] = { recebido: 0, pago: 0 };
            }
            if (item.tipo === 'Recebido') {
                dadosPorData[data].recebido += item.valor;
            } else if (item.tipo === 'Pago') {
                dadosPorData[data].pago += item.valor;
            }
        });

        // Ordenar datas e preparar dados para o gráfico
        const datas = Object.keys(dadosPorData).sort();
        const dadosRecebido = datas.map(data => dadosPorData[data].recebido);
        const dadosPago = datas.map(data => dadosPorData[data].pago);

        // Configuração do gráfico
        const ctx = canvas.getContext('2d');
        this.evolucaoTemporalChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: datas.map(data => {
                    const [ano, mes, dia] = data.split('-');
                    return `${dia}/${mes}`;
                }),
                datasets: [
                    {
                        label: 'Recebimentos',
                        data: dadosRecebido,
                        backgroundColor: 'rgba(16, 185, 129, 0.8)',
                        borderColor: '#10b981',
                        borderWidth: 1,
                        borderRadius: 4,
                        borderSkipped: false
                    },
                    {
                        label: 'Pagamentos',
                        data: dadosPago,
                        backgroundColor: 'rgba(239, 68, 68, 0.8)',
                        borderColor: '#ef4444',
                        borderWidth: 1,
                        borderRadius: 4,
                        borderSkipped: false
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    intersect: false,
                    mode: 'index'
                },
                plugins: {
                    legend: {
                        position: 'top',
                        labels: {
                            usePointStyle: true,
                            padding: 20,
                            font: {
                                size: 12
                            }
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleColor: '#ffffff',
                        bodyColor: '#ffffff',
                        borderColor: '#374151',
                        borderWidth: 1,
                        cornerRadius: 8,
                        displayColors: true,
                        callbacks: {
                            label: function(context) {
                                const label = context.dataset.label || '';
                                const value = context.parsed.y;
                                return `${label}: ${value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        display: true,
                        title: {
                            display: true,
                            text: 'Data',
                            font: {
                                size: 12
                            }
                        },
                        grid: {
                            display: false
                        },
                        ticks: {
                            maxTicksLimit: 10,
                            font: {
                                size: 10
                            }
                        }
                    },
                    y: {
                        display: true,
                        title: {
                            display: true,
                            text: 'Valor (R$)',
                            font: {
                                size: 12
                            }
                        },
                        grid: {
                            color: 'rgba(0, 0, 0, 0.1)'
                        },
                        ticks: {
                            callback: function(value) {
                                return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
                            },
                            font: {
                                size: 10
                            }
                        }
                    }
                },
                onClick: (event, elements) => {
                    if (elements.length > 0) {
                        const element = elements[0];
                        const dataIndex = element.index;
                        const dataLabel = datas[dataIndex];
                        
                        // Filtrar por data específica
                        const dateRange = `${dataLabel}|${dataLabel}`;
                        app.applyFilter('dateRange', dateRange);
                        
                        // Atualizar inputs de data
                        app.config.dom.dateRangeStart.value = dataLabel;
                        app.config.dom.dateRangeEnd.value = dataLabel;
                    }
                }
            }
        });
    }

    renderDistribuicaoNaturezaChart(data, app) {
        const canvas = document.getElementById('distribuicao-natureza-chart');
        if (!canvas) return;

        // Destruir gráfico existente se houver
        if (this.distribuicaoNaturezaChart) {
            this.distribuicaoNaturezaChart.destroy();
        }

        if (!data || data.length === 0) {
            canvas.style.display = 'none';
            return;
        }

        canvas.style.display = 'block';

        // Agrupar dados por natureza
        const dadosPorNatureza = {};
        data.forEach(item => {
            const natureza = item.natureza;
            if (!dadosPorNatureza[natureza]) {
                dadosPorNatureza[natureza] = { recebido: 0, pago: 0 };
            }
            if (item.tipo === 'Recebido') {
                dadosPorNatureza[natureza].recebido += item.valor;
            } else if (item.tipo === 'Pago') {
                dadosPorNatureza[natureza].pago += item.valor;
            }
        });

        // Preparar dados para o gráfico de barras horizontais
        const naturezas = Object.keys(dadosPorNatureza);
        const recebimentos = naturezas.map(natureza => dadosPorNatureza[natureza].recebido);
        const pagamentos = naturezas.map(natureza => dadosPorNatureza[natureza].pago);

        // Configuração do gráfico
        const ctx = canvas.getContext('2d');
        this.distribuicaoNaturezaChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: naturezas,
                datasets: [
                    {
                        label: 'Recebimentos',
                        data: recebimentos,
                        backgroundColor: 'rgba(16, 185, 129, 0.8)',
                        borderColor: '#10b981',
                        borderWidth: 1,
                        borderRadius: 4,
                        borderSkipped: false
                    },
                    {
                        label: 'Pagamentos',
                        data: pagamentos,
                        backgroundColor: 'rgba(239, 68, 68, 0.8)',
                        borderColor: '#ef4444',
                        borderWidth: 1,
                        borderRadius: 4,
                        borderSkipped: false
                    }
                ]
            },
            options: {
                indexAxis: 'y', // Barras horizontais
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                        labels: {
                            usePointStyle: true,
                            padding: 15,
                            font: {
                                size: 12
                            }
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleColor: '#ffffff',
                        bodyColor: '#ffffff',
                        borderColor: '#374151',
                        borderWidth: 1,
                        cornerRadius: 8,
                        callbacks: {
                            label: function(context) {
                                const label = context.dataset.label || '';
                                const value = context.parsed.x;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = ((value / total) * 100).toFixed(1);
                                return `${label}: ${value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} (${percentage}%)`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        display: true,
                        title: {
                            display: true,
                            text: 'Valor (R$)',
                            font: {
                                size: 12
                            }
                        },
                        grid: {
                            color: 'rgba(0, 0, 0, 0.1)'
                        },
                        ticks: {
                            callback: function(value) {
                                return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
                            },
                            font: {
                                size: 10
                            }
                        }
                    },
                    y: {
                        display: true,
                        title: {
                            display: true,
                            text: 'Natureza',
                            font: {
                                size: 12
                            }
                        },
                        grid: {
                            display: false
                        },
                        ticks: {
                            font: {
                                size: 11
                            }
                        }
                    }
                },
                onClick: (event, elements) => {
                    if (elements.length > 0) {
                        const element = elements[0];
                        const natureza = naturezas[element.index];
                        
                        // Filtrar por natureza
                        app.applyFilter('naturezas', [natureza]);
                    }
                }
            }
        });
    }
}

// Inicializar quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', () => {
    new HistoricoTransacoesDashboard();
});