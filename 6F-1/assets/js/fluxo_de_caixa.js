document.addEventListener('DOMContentLoaded', () => {
    let startDate = new Date();
    let endDate = new Date();
    const initialBalance = 50000;
    let cashflowChartInstance = null;
    let projectedBalanceChartInstance = null;

    const formatCurrency = (value) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    const formatDate = (date) => date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });

    const generateMockData = () => {
        const companies = ['6F', '8F', 'PEQUETITA'];
        const data = [];
        const today = new Date(2025, 6, 4);

        // Generate historical data with overdue items
        for (let i = -60; i < 0; i++) {
            const current_date = new Date(today.getTime());
            current_date.setDate(today.getDate() + i);
            // Create overdue receivables
            if (Math.random() < 0.2) {
                const previsto = parseFloat((Math.random() * (15000 - 5000) + 5000).toFixed(2));
                data.push({
                    date: current_date.toISOString().split('T')[0],
                    type: "receber",
                    company: companies[i % companies.length],
                    isInternal: false,
                    previstoValue: previsto,
                    realizadoValue: 0,
                    isOverdue: true
                });
            }
            // Create overdue payables
            if (Math.random() < 0.2) {
                const previsto = parseFloat((Math.random() * (12000 - 3000) + 3000).toFixed(2));
                data.push({
                    date: current_date.toISOString().split('T')[0],
                    type: "pagar",
                    company: companies[i % companies.length],
                    isInternal: false,
                    previstoValue: previsto,
                    realizadoValue: 0,
                    isOverdue: true
                });
            }
            // Create realized transactions
            if (Math.random() < 0.7) {
                const previsto_receber = parseFloat((Math.random() * (20000 - 1000) + 1000).toFixed(2));
                const previsto_pagar = parseFloat((Math.random() * (18000 - 800) + 800).toFixed(2));
                data.push({
                    date: current_date.toISOString().split('T')[0],
                    type: "receber",
                    company: companies[i % companies.length],
                    isInternal: Math.random() < 0.1,
                    previstoValue: previsto_receber,
                    realizadoValue: parseFloat((previsto_receber * (Math.random() * (1.05 - 0.9) + 0.9)).toFixed(2)),
                    isOverdue: false
                });
                data.push({
                    date: current_date.toISOString().split('T')[0],
                    type: "pagar",
                    company: companies[i % companies.length],
                    isInternal: Math.random() < 0.1,
                    previstoValue: previsto_pagar,
                    realizadoValue: parseFloat((previsto_pagar * (Math.random() * (1.0 - 0.95) + 0.95)).toFixed(2)),
                    isOverdue: false
                });
            }
        }

        // Generate future (projected) data
        for (let i = 1; i < 91; i++) {
            const current_date = new Date(today.getTime());
            current_date.setDate(today.getDate() + i);
            if (Math.random() < 0.5) {
                data.push({
                    date: current_date.toISOString().split('T')[0],
                    type: "receber",
                    company: companies[i % companies.length],
                    isInternal: Math.random() < 0.1,
                    previstoValue: parseFloat((Math.random() * (30000 - 5000) + 5000).toFixed(2)),
                    realizadoValue: 0,
                    isOverdue: false
                });
            }
            if (Math.random() < 0.5) {
                data.push({
                    date: current_date.toISOString().split('T')[0],
                    type: "pagar",
                    company: companies[i % companies.length],
                    isInternal: Math.random() < 0.1,
                    previstoValue: parseFloat((Math.random() * (25000 - 4000) + 4000).toFixed(2)),
                    realizadoValue: 0,
                    isOverdue: false
                });
            }
        }
        return data.map(item => ({...item, date: new Date(item.date + 'T00:00:00')}));
    };

    const config = {
        initialFilters: {
            empresas: [],
            includeInternal: false
        },
        dom: {
            empresaFilterContainer: document.getElementById('empresa-filter-container'),
            internalToggle: document.getElementById('internal-toggle'),
            kpiContainer: document.getElementById('kpi-container'),
            alertsContainer: document.getElementById('alerts-container'),
            calendarBody: document.getElementById('financial-calendar-body'),
            chartCanvas: document.getElementById('cashflow-chart'),
            projectedBalanceCanvas: document.getElementById('projected-balance-chart'),
            projectionPeriodFilter: document.getElementById('projection-period-filter'),
            activeFiltersContainer: document.getElementById('active-filters-container'),
            clearFiltersBtn: document.getElementById('clear-filters-btn')
        },
        allEmpresas: ["6F", "8F", "PEQUETITA"],
        filterPillDefinitions: [
            { type: 'empresas', label: 'Empresa' }
        ],
        customSelects: [
            { type: 'Empresas', options: ["6F", "8F", "PEQUETITA"], filterKey: 'empresas', containerId: 'empresa-filter-container' }
        ],
        getFilteredData: (rawData, activeFilters) => {
            return rawData.filter(item => {
                const empresaMatch = activeFilters.empresas.length === 0 || activeFilters.empresas.includes(item.company);
                const internalMatch = activeFilters.includeInternal || !item.isInternal;
                return empresaMatch && internalMatch;
            });
        }
    };

    const renderKPIs = (filteredData, app) => {
        const totalReceber = filteredData.filter(d => d.type === 'receber').reduce((sum, d) => sum + d.previstoValue, 0);
        const totalPagar = filteredData.filter(d => d.type === 'pagar').reduce((sum, d) => sum + d.previstoValue, 0);
        const realizadoTotal = filteredData.reduce((sum, d) => sum + (d.type === 'receber' ? d.realizadoValue : -d.realizadoValue), 0);
        const previstoTotal = filteredData.reduce((sum, d) => sum + (d.type === 'receber' ? d.previstoValue : -d.previstoValue), 0);
        const desvio = previstoTotal !== 0 ? ((realizadoTotal - previstoTotal) / Math.abs(previstoTotal)) * 100 : 0;
        
        const pmr = 35 + (Math.random() - 0.5) * 5;
        const pmp = 40 + (Math.random() - 0.5) * 5;

        const saldoLiquido = initialBalance + realizadoTotal;
        
        const kpis = [
            { 
                label: 'Saldo Líquido', 
                value: formatCurrency(saldoLiquido), 
                icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 10v-1m0 0a2.5 2.5 0 100-5 2.5 2.5 0 000 5z',
                status: saldoLiquido >= 0 ? 'success' : 'error',
                tipo: saldoLiquido >= 0 ? 'monetary-positive' : 'monetary-negative'
            },
            { 
                label: 'A Receber', 
                value: formatCurrency(totalReceber), 
                icon: 'M12 4.5v15m7.5-7.5h-15',
                status: 'success',
                tipo: 'monetary-positive'
            },
            { 
                label: 'A Pagar', 
                value: formatCurrency(totalPagar), 
                icon: 'M19.5 12h-15',
                status: 'error',
                tipo: 'monetary-negative'
            },
            { 
                label: 'PMR', 
                value: `${pmr.toFixed(1)} dias`, 
                icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
                status: 'info'
            },
            { 
                label: 'PMP', 
                value: `${pmp.toFixed(1)} dias`, 
                icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
                status: 'info'
            },
            { 
                label: 'Desvio Realizado', 
                value: `${desvio.toFixed(2)}%`, 
                icon: 'M3 13.125C3 12.504 3.504 12 4.125 12h15.75c.621 0 1.125.504 1.125 1.125v6.75C21 20.496 20.496 21 19.875 21H4.125A1.125 1.125 0 013 19.875v-6.75zM12 3v9',
                status: desvio >= 0 ? 'success' : 'error'
            },
        ];

        app.config.dom.kpiContainer.innerHTML = kpis.map(kpi => {
            const valorClass = kpi.tipo === 'monetary-negative' ? 'currency-negative' : 
                              kpi.tipo === 'monetary-positive' ? 'currency-positive' : '';
            
            return `
                <div class="kpi-modern kpi-status-${kpi.status}">
                    <div class="kpi-header">
                        <p class="kpi-label">${kpi.label}</p>
                        <svg class="kpi-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="${kpi.icon}"></path>
                        </svg>
                    </div>
                    <p class="kpi-value ${valorClass}">${kpi.value}</p>
                </div>
            `;
        }).join('');
    };

    const renderAlerts = (filteredData, app) => {
        const overdueItems = filteredData.filter(d => d.isOverdue);
        const overdueReceivables = overdueItems.filter(d => d.type === 'receber');
        const overduePayables = overdueItems.filter(d => d.type === 'pagar');

        const uniqueOverdueClients = new Set(overdueReceivables.map(d => d.company || 'Cliente Desconhecido')).size;
        const uniqueOverdueSuppliers = new Set(overduePayables.map(d => d.company || 'Fornecedor Desconhecido')).size;

        // Calcular totais monetários
        const totalOverdueValue = overdueItems.reduce((sum, item) => sum + (item.previstoValue || 0), 0);
        const totalReceivablesValue = overdueReceivables.reduce((sum, item) => sum + (item.previstoValue || 0), 0);
        const totalPayablesValue = overduePayables.reduce((sum, item) => sum + (item.previstoValue || 0), 0);

        app.config.dom.alertsContainer.innerHTML = `
            <h3 class="font-semibold text-base text-gray-800 mb-2">Alertas</h3>
            <div class="space-y-2">
                <div class="flex flex-col p-3 rounded-lg bg-red-50 border border-red-200 cursor-pointer hover:bg-red-100 transition-colors" 
                     onclick="openAlertDrillthrough('todas', '${totalOverdueValue}', ${overdueItems.length})">
                    <div class="flex items-center justify-between mb-1">
                        <span class="font-medium text-xs text-red-800">Contas Vencidas</span>
                        <span class="font-bold text-sm text-red-900">${overdueItems.length}</span>
                    </div>
                    <div class="text-right">
                        <span class="font-bold text-lg text-red-900">${formatCurrency(totalOverdueValue)}</span>
                    </div>
                </div>
                
                <div class="flex flex-col p-3 rounded-lg bg-orange-50 border border-orange-200 cursor-pointer hover:bg-orange-100 transition-colors"
                     onclick="openAlertDrillthrough('receber', '${totalReceivablesValue}', ${overdueReceivables.length})">
                    <div class="flex items-center justify-between mb-1">
                        <span class="font-medium text-xs text-orange-800">A Receber Vencidas</span>
                        <span class="font-bold text-sm text-orange-900">${overdueReceivables.length}</span>
                    </div>
                    <div class="text-right">
                        <span class="font-bold text-lg text-orange-900">${formatCurrency(totalReceivablesValue)}</span>
                    </div>
                </div>
                
                <div class="flex flex-col p-3 rounded-lg bg-yellow-50 border border-yellow-200 cursor-pointer hover:bg-yellow-100 transition-colors"
                     onclick="openAlertDrillthrough('pagar', '${totalPayablesValue}', ${overduePayables.length})">
                    <div class="flex items-center justify-between mb-1">
                        <span class="font-medium text-xs text-yellow-800">A Pagar Vencidas</span>
                        <span class="font-bold text-sm text-yellow-900">${overduePayables.length}</span>
                    </div>
                    <div class="text-right">
                        <span class="font-bold text-lg text-yellow-900">${formatCurrency(totalPayablesValue)}</span>
                    </div>
                </div>
            </div>
        `;
    };

    // Função para fechar o modal
    const closeAlertModal = () => {
        console.log('closeAlertModal called'); // Debug log
        const modal = document.getElementById('alert-drillthrough-modal');
        console.log('Modal found:', !!modal); // Debug log
        
        if (modal && !modal.classList.contains('hidden')) {
            console.log('Closing modal...'); // Debug log
            modal.classList.add('hidden');
            
            // Limpar conteúdo do modal para melhor performance
            const tableBody = document.getElementById('alert-modal-table-body');
            const kpisContainer = document.getElementById('alert-modal-kpis');
            
            if (tableBody) tableBody.innerHTML = '';
            if (kpisContainer) kpisContainer.innerHTML = '';
        }
    };

    // Função global para fechar o modal (disponibilizar globalmente)
    window.closeAlertModal = closeAlertModal;

    // Função global para abrir o drill-through dos alertas
    window.openAlertDrillthrough = (alertType, totalValue, totalCount) => {
        const modal = document.getElementById('alert-drillthrough-modal');
        const title = document.getElementById('alert-modal-title');
        const subtitle = document.getElementById('alert-modal-subtitle');
        const kpisContainer = document.getElementById('alert-modal-kpis');
        const tableBody = document.getElementById('alert-modal-table-body');
        
        if (!modal || !title || !subtitle || !kpisContainer || !tableBody) return;

        // Obter dados filtrados com base no tipo de alerta
        const allData = generateMockData();
        const overdueItems = allData.filter(d => d.isOverdue);
        
        let filteredData = [];
        let titleText = '';
        let subtitleText = '';
        
        switch (alertType) {
            case 'todas':
                filteredData = overdueItems;
                titleText = 'Todas as Contas Vencidas';
                subtitleText = 'Detalhamento completo de contas a receber e a pagar em atraso';
                break;
            case 'receber':
                filteredData = overdueItems.filter(d => d.type === 'receber');
                titleText = 'Contas a Receber Vencidas';
                subtitleText = 'Detalhamento de valores em atraso de clientes';
                break;
            case 'pagar':
                filteredData = overdueItems.filter(d => d.type === 'pagar');
                titleText = 'Contas a Pagar Vencidas';
                subtitleText = 'Detalhamento de valores em atraso para fornecedores';
                break;
        }

        // Configurar título e subtítulo
        title.textContent = titleText;
        subtitle.textContent = subtitleText;

        // Calcular KPIs específicos
        const totalValueNum = parseFloat(totalValue);
        const avgValue = totalCount > 0 ? totalValueNum / totalCount : 0;
        const today = new Date();
        const avgDaysOverdue = filteredData.length > 0 ? 
            filteredData.reduce((sum, item) => {
                const itemDate = new Date(item.date);
                const diffTime = today - itemDate;
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                return sum + diffDays;
            }, 0) / filteredData.length : 0;

        // Renderizar KPIs do modal
        kpisContainer.innerHTML = `
            <div class="text-center">
                <p class="text-sm font-medium text-gray-600">Total de Contas</p>
                <p class="text-2xl font-bold text-gray-900">${totalCount}</p>
            </div>
            <div class="text-center">
                <p class="text-sm font-medium text-gray-600">Valor Total</p>
                <p class="text-2xl font-bold text-red-600">${formatCurrency(totalValueNum)}</p>
            </div>
            <div class="text-center">
                <p class="text-sm font-medium text-gray-600">Valor Médio</p>
                <p class="text-2xl font-bold text-gray-900">${formatCurrency(avgValue)}</p>
            </div>
        `;

        // Renderizar tabela
        tableBody.innerHTML = filteredData.map(item => {
            const itemDate = new Date(item.date);
            const diffTime = today - itemDate;
            const daysOverdue = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            const typeText = item.type === 'receber' ? 'A Receber' : 'A Pagar';
            const typeClass = item.type === 'receber' ? 'text-green-600' : 'text-red-600';
            
            return `
                <tr class="border-b border-gray-100 hover:bg-gray-50">
                    <td class="p-3">${formatDate(itemDate)}</td>
                    <td class="p-3">
                        <span class="px-2 py-1 rounded-full text-xs font-medium ${typeClass} bg-opacity-10 ${item.type === 'receber' ? 'bg-green-100' : 'bg-red-100'}">${typeText}</span>
                    </td>
                    <td class="p-3">${item.company}</td>
                    <td class="p-3 text-right font-semibold">${formatCurrency(item.previstoValue)}</td>
                    <td class="p-3 text-right">${formatCurrency(item.realizadoValue)}</td>
                    <td class="p-3 text-center">
                        <span class="px-2 py-1 rounded-full text-xs font-bold text-red-700 bg-red-100">${daysOverdue} dias</span>
                    </td>
                    <td class="p-3 text-center">
                        <span class="px-2 py-1 rounded-full text-xs font-medium text-red-700 bg-red-100">Vencido</span>
                    </td>
                </tr>
            `;
        }).join('');

        // Configurar event listeners e mostrar modal
        setupModalEventListeners();
        modal.classList.remove('hidden');
    };

    // Configurar event listeners para o modal (apenas uma vez)
    const setupModalEventListeners = () => {
        const closeBtn = document.getElementById('alert-modal-close-btn');
        const modal = document.getElementById('alert-drillthrough-modal');
        
        if (closeBtn && !closeBtn._listenerAdded) {
            closeBtn.addEventListener('click', (e) => {
                console.log('Close button clicked'); // Debug log
                e.preventDefault();
                e.stopPropagation();
                closeAlertModal();
            });
            closeBtn._listenerAdded = true;
        }
        
        if (modal && !modal._listenerAdded) {
            modal.addEventListener('click', (e) => {
                console.log('Modal clicked, target:', e.target.id); // Debug log
                if (e.target === modal) {
                    console.log('Clicking outside modal content'); // Debug log
                    closeAlertModal();
                }
            });
            modal._listenerAdded = true;
        }
        
        // Adicionar escape key listener
        if (!document._escapeListenerAdded) {
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') {
                    const modal = document.getElementById('alert-drillthrough-modal');
                    if (modal && !modal.classList.contains('hidden')) {
                        closeAlertModal();
                    }
                }
            });
            document._escapeListenerAdded = true;
        }
    };

    const renderChart = (filteredData, app) => {
        const ctx = app.config.dom.chartCanvas;
        if (!ctx) {
            console.error('Canvas element cashflow-chart not found');
            return;
        }

        const period = app.config.dom.projectionPeriodFilter.querySelector('.active')?.dataset?.period || 'weekly';
        const today = new Date();
        today.setHours(23, 59, 59, 999);
        const pastData = filteredData.filter(item => new Date(item.date) < today);

        const periodData = {};
        const chartEndDate = new Date(Math.min(endDate, today));

        // Função para gerar chave do período baseado no filtro selecionado
        const getPeriodKey = (date) => {
            if (period === 'daily') {
                return date.toISOString().split('T')[0];
            } else if (period === 'weekly') {
                const startOfWeek = new Date(date);
                startOfWeek.setDate(date.getDate() - date.getDay());
                return startOfWeek.toISOString().split('T')[0];
            } else { // monthly
                return new Date(date.getFullYear(), date.getMonth(), 1).toISOString().split('T')[0];
            }
        };

        // Inicializar estrutura de dados baseada no período
        if (startDate <= chartEndDate) {
            let currentDate = new Date(startDate);
            while (currentDate <= chartEndDate) {
                const periodKey = getPeriodKey(currentDate);
                if (!periodData[periodKey]) {
                    periodData[periodKey] = { previsto: 0, realizado: 0 };
                }
                
                // Avançar para o próximo período
                if (period === 'daily') {
                    currentDate.setDate(currentDate.getDate() + 1);
                } else if (period === 'weekly') {
                    currentDate.setDate(currentDate.getDate() + 7);
                } else { // monthly
                    currentDate.setMonth(currentDate.getMonth() + 1);
                }
            }
        }

        // Agrupar dados por período
        pastData.forEach(item => {
            const itemDate = new Date(item.date);
            if (itemDate >= startDate && itemDate <= chartEndDate) {
                const periodKey = getPeriodKey(itemDate);
                if (periodData[periodKey]) {
                    const multiplier = item.type === 'receber' ? 1 : -1;
                    periodData[periodKey].previsto += item.previstoValue * multiplier;
                    periodData[periodKey].realizado += item.realizadoValue * multiplier;
                }
            }
        });

        const labels = Object.keys(periodData).sort();
        const previstoData = labels.map(periodKey => periodData[periodKey].previsto);
        const realizadoData = labels.map(periodKey => periodData[periodKey].realizado);
        const diferencaData = labels.map((periodKey, index) => realizadoData[index] - previstoData[index]);

        if (cashflowChartInstance) {
            cashflowChartInstance.destroy();
            cashflowChartInstance = null;
        }

        // Configurar formatação de labels baseada no período
        let formatLabel = (label) => {
            try {
                const date = new Date(label + 'T00:00:00');
                return formatDate(date);
            } catch (e) {
                return label;
            }
        };

        const formattedLabels = labels.map(formatLabel);

        cashflowChartInstance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: formattedLabels,
                datasets: [
                    { 
                        label: 'Previsto', 
                        data: previstoData, 
                        backgroundColor: '#A4C4E0',
                        borderColor: '#003D75',
                        borderWidth: 1,
                        order: 2 
                    },
                    { 
                        label: 'Realizado', 
                        data: realizadoData, 
                        backgroundColor: '#003D75',
                        borderColor: '#003D75',
                        borderWidth: 1,
                        order: 1 
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    mode: 'index',
                    intersect: false,
                },
                scales: {
                    x: { 
                        grid: { display: false },
                        title: {
                            display: true,
                            text: 'Período'
                        }
                    },
                    y: { 
                        grid: { color: '#e5e7eb' }, 
                        ticks: { 
                            callback: value => formatCurrency(value) 
                        },
                        title: {
                            display: true,
                            text: 'Valores'
                        }
                    }
                },
                plugins: {
                    legend: { 
                        position: 'top', 
                        align: 'start', 
                        labels: { 
                            usePointStyle: true, 
                            padding: 15,
                            generateLabels: function(chart) {
                                const original = Chart.defaults.plugins.legend.labels.generateLabels;
                                const labels = original.call(this, chart);
                                return labels.reverse(); // Mostra Realizado primeiro
                            }
                        } 
                    },
                    tooltip: { 
                        mode: 'index', 
                        intersect: false,
                        backgroundColor: 'rgba(0, 61, 117, 0.9)',
                        titleColor: '#ffffff',
                        bodyColor: '#ffffff',
                        callbacks: { 
                            label: function(context) {
                                const label = context.dataset.label || '';
                                const value = formatCurrency(context.parsed.y);
                                return `${label}: ${value}`;
                            },
                            afterBody: function(tooltipItems) {
                                if (tooltipItems.length >= 2) {
                                    const realizado = tooltipItems.find(item => item.dataset.label === 'Realizado')?.parsed.y || 0;
                                    const previsto = tooltipItems.find(item => item.dataset.label === 'Previsto')?.parsed.y || 0;
                                    const diferenca = realizado - previsto;
                                    const percentual = previsto !== 0 ? ((diferenca / Math.abs(previsto)) * 100).toFixed(1) : '0.0';
                                    return [
                                        '',
                                        `Diferença: ${formatCurrency(diferenca)}`,
                                        `Variação: ${percentual}%`
                                    ];
                                }
                                return [];
                            }
                        } 
                    }
                }
            }
        });
    };

    const renderProjectedBalanceChart = (filteredData, app) => {
        const ctx = app.config.dom.projectedBalanceCanvas;
        if (!ctx) {
            console.error('Canvas element projected-balance-chart not found');
            return;
        }

        const period = app.config.dom.projectionPeriodFilter.querySelector('.active')?.dataset?.period || 'weekly';
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const pastData = app.rawData.filter(item => new Date(item.date) < today);
        const futureData = app.rawData.filter(item => new Date(item.date) >= today);

        const currentBalance = pastData.reduce((balance, item) => {
            return balance + (item.type === 'receber' ? item.realizadoValue : -item.realizadoValue);
        }, initialBalance);

        const projections = {};
        const projectionDays = period === 'monthly' ? 365 : (period === 'weekly' ? 180 : 60);
        const projectionEndDate = new Date(today);
        projectionEndDate.setDate(today.getDate() + projectionDays);

        futureData.forEach(item => {
            const itemDate = new Date(item.date);
            if (itemDate > projectionEndDate) return;

            let key;
            if (period === 'daily') {
                key = itemDate.toISOString().split('T')[0];
            } else if (period === 'weekly') {
                const startOfWeek = new Date(itemDate);
                startOfWeek.setDate(itemDate.getDate() - itemDate.getDay());
                key = startOfWeek.toISOString().split('T')[0];
            } else { // monthly
                key = new Date(itemDate.getFullYear(), itemDate.getMonth(), 1).toISOString().split('T')[0];
            }

            if (!projections[key]) {
                projections[key] = { receber: 0, pagar: 0 };
            }
            if (item.type === 'receber') {
                projections[key].receber += item.previstoValue;
            } else {
                projections[key].pagar -= item.previstoValue;
            }
        });

        const sortedKeys = Object.keys(projections).sort();
        const receberData = sortedKeys.map(key => projections[key].receber);
        const pagarData = sortedKeys.map(key => projections[key].pagar);

        let cumulativeBalance = currentBalance;
        const saldoAcumuladoData = sortedKeys.map(key => {
            cumulativeBalance += (projections[key].receber + projections[key].pagar);
            return cumulativeBalance;
        });

        if (projectedBalanceChartInstance) {
            projectedBalanceChartInstance.destroy();
            projectedBalanceChartInstance = null;
        }

        // Formatar labels
        const formattedLabels = sortedKeys.map(key => {
            try {
                const date = new Date(key + 'T00:00:00');
                return formatDate(date);
            } catch (e) {
                return key;
            }
        });

        projectedBalanceChartInstance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: formattedLabels,
                datasets: [
                    { 
                        label: 'Recebimentos Previstos', 
                        data: receberData, 
                        backgroundColor: '#059669',
                        borderColor: '#047857',
                        borderWidth: 1
                    },
                    { 
                        label: 'Pagamentos Previstos', 
                        data: pagarData, 
                        backgroundColor: '#dc2626',
                        borderColor: '#b91c1c',
                        borderWidth: 1
                    },
                    { 
                        label: 'Saldo Acumulado', 
                        data: saldoAcumuladoData, 
                        type: 'line', 
                        borderColor: '#003D75', 
                        backgroundColor: 'transparent', 
                        pointRadius: 3, 
                        pointBackgroundColor: '#003D75',
                        pointBorderColor: '#ffffff',
                        pointBorderWidth: 2,
                        tension: 0.1, 
                        yAxisID: 'y1',
                        borderWidth: 3
                    },
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    mode: 'index',
                    intersect: false,
                },
                scales: {
                    x: { 
                        stacked: true, 
                        grid: { display: false },
                        title: {
                            display: true,
                            text: 'Período'
                        }
                    },
                    y: { 
                        stacked: true, 
                        position: 'left', 
                        grid: { color: '#e5e7eb' }, 
                        ticks: { 
                            callback: value => formatCurrency(value) 
                        },
                        title: {
                            display: true,
                            text: 'Fluxo de Caixa'
                        }
                    },
                    y1: { 
                        type: 'linear',
                        position: 'right', 
                        grid: { display: false }, 
                        ticks: { 
                            callback: value => formatCurrency(value) 
                        },
                        title: {
                            display: true,
                            text: 'Saldo Acumulado'
                        }
                    }
                },
                plugins: {
                    legend: { 
                        position: 'top', 
                        align: 'start', 
                        labels: { 
                            usePointStyle: true, 
                            padding: 15 
                        } 
                    },
                    tooltip: { 
                        mode: 'index', 
                        intersect: false,
                        backgroundColor: 'rgba(0, 61, 117, 0.9)',
                        titleColor: '#ffffff',
                        bodyColor: '#ffffff',
                        callbacks: { 
                            label: function(context) {
                                const label = context.dataset.label || '';
                                const value = formatCurrency(context.parsed.y);
                                return `${label}: ${value}`;
                            },
                            afterBody: function(tooltipItems) {
                                const recebimentos = tooltipItems.find(item => item.dataset.label === 'Recebimentos Previstos')?.parsed.y || 0;
                                const pagamentos = Math.abs(tooltipItems.find(item => item.dataset.label === 'Pagamentos Previstos')?.parsed.y || 0);
                                const fluxoLiquido = recebimentos - pagamentos;
                                return [
                                    '',
                                    `Fluxo Líquido: ${formatCurrency(fluxoLiquido)}`
                                ];
                            }
                        } 
                    }
                }
            }
        });
    };

    const renderCalendar = (filteredData, app) => {
        const dailyAggregates = {};
        let saldoAcumulado = initialBalance;

        const maxReceber = Math.max(...filteredData.filter(d => d.type === 'receber').map(d => d.previstoValue), 0);
        const maxPagar = Math.max(...filteredData.filter(d => d.type === 'pagar').map(d => d.previstoValue), 0);

        for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
            const dateStr = d.toISOString().split('T')[0];
            dailyAggregates[dateStr] = { receber: 0, pagar: 0 };
        }

        filteredData.forEach(item => {
            const dateStr = new Date(item.date).toISOString().split('T')[0];
            if (dailyAggregates[dateStr]) {
                if (item.type === 'receber') dailyAggregates[dateStr].receber += item.previstoValue;
                else dailyAggregates[dateStr].pagar += item.previstoValue;
            }
        });

        app.config.dom.calendarBody.innerHTML = '';
        const fragment = document.createDocumentFragment();

        Object.keys(dailyAggregates).forEach(dateStr => {
            const dayData = dailyAggregates[dateStr];
            const saldoDia = dayData.receber - dayData.pagar;
            saldoAcumulado += saldoDia;

            const tr = document.createElement('tr');
            tr.className = 'border-b border-gray-100 hover:bg-gray-50 transition-colors';
            tr.innerHTML = `
                <td class="p-2 text-gray-600">${formatDate(new Date(dateStr + 'T00:00:00'))}</td>
                <td class="p-2 text-right text-gray-800 font-medium">${formatCurrency(dayData.receber)}</td>
                <td class="p-2 text-right text-gray-800 font-medium">${formatCurrency(dayData.pagar)}</td>
                <td class="p-2 text-right font-medium ${saldoDia < 0 ? 'text-gray-800' : 'text-gray-900'}">${formatCurrency(saldoDia)}</td>
                <td class="p-2 text-right font-semibold text-gray-900">${formatCurrency(saldoAcumulado)}</td>
            `;
            fragment.appendChild(tr);
        });

        app.config.dom.calendarBody.appendChild(fragment);
    };

    // Adicionar as funções de renderização ao config
    config.renderFunctions = [
        renderKPIs,
        renderAlerts,
        renderChart,
        renderProjectedBalanceChart,
        renderCalendar
    ];

    config.setupEventListeners = (app) => {


        if (app.config.dom.internalToggle) {
            app.config.dom.internalToggle.addEventListener('change', e => { 
                app.applyFilter('includeInternal', e.target.checked); 
            });
        }
        
        if (app.config.dom.clearFiltersBtn) {
            app.config.dom.clearFiltersBtn.addEventListener('click', app.clearFilters);
        }
        
        if (app.config.dom.projectionPeriodFilter) {
            app.config.dom.projectionPeriodFilter.addEventListener('click', (e) => {
                if (e.target.tagName === 'BUTTON' && e.target.classList.contains('filter-btn-period')) {
                    // Remove active class from all period buttons
                    app.config.dom.projectionPeriodFilter.querySelectorAll('.filter-btn-period').forEach(btn => {
                        btn.classList.remove('active');
                        btn.classList.add('text-gray-600');
                    });
                    
                    // Add active class to clicked button
                    e.target.classList.add('active');
                    e.target.classList.remove('text-gray-600');
                    
                    const filteredData = app.config.getFilteredData(app.rawData, app.activeFilters);
                    renderChart(filteredData, app);
                    renderProjectedBalanceChart(filteredData, app);
                }
            });
        }
    };

    const init = () => {
        endDate = new Date();
        startDate = new Date();
        startDate.setDate(endDate.getDate() - 30);
        
        const app = new DashboardApp(config);
        app.init(generateMockData());
    };

    init();
});
