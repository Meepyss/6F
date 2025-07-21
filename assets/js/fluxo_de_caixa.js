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

        const kpis = [
            { label: 'Saldo Líquido Atual', value: formatCurrency(initialBalance + realizadoTotal), icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 10v-1m0 0a2.5 2.5 0 100-5 2.5 2.5 0 000 5z' },
            { label: 'Total a Receber', value: formatCurrency(totalReceber), icon: 'M12 4.5v15m7.5-7.5h-15' },
            { label: 'Total a Pagar', value: formatCurrency(totalPagar), icon: 'M19.5 12h-15' },
            { label: 'PMR', value: `${pmr.toFixed(1)} dias`, icon: 'M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0h18' },
            { label: 'PMP', value: `${pmp.toFixed(1)} dias`, icon: 'M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0h18' },
            { label: 'Desvio (Prev. x Real.)', value: `${desvio.toFixed(2)}%`, icon: 'M3 13.125C3 12.504 3.504 12 4.125 12h15.75c.621 0 1.125.504 1.125 1.125v6.75C21 20.496 20.496 21 19.875 21H4.125A1.125 1.125 0 013 19.875v-6.75zM12 3v9' },
        ];

        app.config.dom.kpiContainer.innerHTML = kpis.map(kpi => `
            <div class="bg-white rounded-lg shadow-sm border p-3">
                <div class="flex items-center justify-between text-gray-400 mb-1">
                    <span class="text-xs font-medium text-gray-600">${kpi.label}</span>
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="${kpi.icon}"></path></svg>
                </div>
                <p class="text-lg font-bold text-gray-800">${kpi.value}</p>
            </div>
        `).join('');
    };

    const renderAlerts = (filteredData, app) => {
        const overdueItems = filteredData.filter(d => d.isOverdue);
        const overdueReceivables = overdueItems.filter(d => d.type === 'receber');
        const overduePayables = overdueItems.filter(d => d.type === 'pagar');

        const uniqueOverdueClients = new Set(overdueReceivables.map(d => d.company || 'Cliente Desconhecido')).size;
        const uniqueOverdueSuppliers = new Set(overduePayables.map(d => d.company || 'Fornecedor Desconhecido')).size;

        app.config.dom.alertsContainer.innerHTML = `
            <h3 class="font-semibold text-base text-gray-800 mb-2">Alertas</h3>
            <div class="space-y-2">
                <div class="flex items-center justify-between p-2 rounded-lg bg-red-50 text-red-700">
                    <span class="font-medium text-xs">Contas Vencidas</span>
                    <span class="font-bold text-sm">${overdueItems.length}</span>
                </div>
                <div class="flex items-center justify-between p-2 rounded-lg bg-yellow-50 text-yellow-700">
                    <span class="font-medium text-xs">Clientes em Atraso</span>
                    <span class="font-bold text-sm">${uniqueOverdueClients}</span>
                </div>
                <div class="flex items-center justify-between p-2 rounded-lg bg-orange-50 text-orange-700">
                    <span class="font-medium text-xs">Fornecedores em Atraso</span>
                    <span class="font-bold text-sm">${uniqueOverdueSuppliers}</span>
                </div>
            </div>
        `;
    };

    const renderChart = (filteredData, app) => {
        const period = app.config.dom.projectionPeriodFilter.querySelector('.active').dataset.period;
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
        }

        // Configurar unidade de tempo baseada no período
        let timeUnit = 'day';
        let displayFormat = 'dd/MM';
        if (period === 'weekly') {
            timeUnit = 'week';
            displayFormat = 'dd/MM';
        } else if (period === 'monthly') {
            timeUnit = 'month';
            displayFormat = 'MMM/yy';
        }

        cashflowChartInstance = new Chart(app.config.dom.chartCanvas, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    { label: 'Realizado', data: realizadoData, backgroundColor: '#1d4ed8', order: 2 },
                    { label: 'Previsto', data: previstoData, backgroundColor: '#60a5fa', order: 2 },
                    { label: 'Diferença', data: diferencaData, borderColor: '#f97316', type: 'line', fill: false, tension: 0.4, pointRadius: 2, order: 1 },
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: { type: 'time', time: { unit: timeUnit, displayFormats: { [timeUnit]: displayFormat } }, grid: { display: false }, stacked: false },
                    y: { grid: { color: '#e5e7eb' }, ticks: { callback: value => formatCurrency(value) }, stacked: false }
                },
                plugins: {
                    legend: { position: 'top', align: 'end', labels: { usePointStyle: true, padding: 10 } },
                    tooltip: { mode: 'index', intersect: false, callbacks: { label: c => `${c.dataset.label}: ${formatCurrency(c.raw)}` } }
                }
            }
        });
    };

    const renderProjectedBalanceChart = (filteredData, app) => {
        const period = app.config.dom.projectionPeriodFilter.querySelector('.active').dataset.period;
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
        const labels = sortedKeys;
        const receberData = sortedKeys.map(key => projections[key].receber);
        const pagarData = sortedKeys.map(key => projections[key].pagar);

        let cumulativeBalance = currentBalance;
        const saldoAcumuladoData = sortedKeys.map(key => {
            cumulativeBalance += (projections[key].receber + projections[key].pagar);
            return cumulativeBalance;
        });

        if (projectedBalanceChartInstance) {
            projectedBalanceChartInstance.destroy();
        }

        let timeUnit = 'day';
        if (period === 'weekly') timeUnit = 'week';
        if (period === 'monthly') timeUnit = 'month';

        projectedBalanceChartInstance = new Chart(app.config.dom.projectedBalanceCanvas, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    { label: 'A Receber (Previsto)', data: receberData, backgroundColor: '#22c55e' },
                    { label: 'A Pagar (Previsto)', data: pagarData, backgroundColor: '#ef4444' },
                    { label: 'Saldo Acumulado Projetado', data: saldoAcumuladoData, type: 'line', borderColor: '#3b82f6', backgroundColor: 'transparent', pointRadius: 1, tension: 0.1, yAxisID: 'y-saldo' },
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: { type: 'time', time: { unit: timeUnit, displayFormats: { [timeUnit]: 'dd/MM/yy' } }, stacked: true, grid: { display: false } },
                    y: { stacked: true, position: 'left', grid: { color: '#e5e7eb' }, ticks: { callback: value => formatCurrency(value) } },
                    'y-saldo': { position: 'right', grid: { display: false }, ticks: { callback: value => formatCurrency(value) } }
                },
                plugins: {
                    legend: { position: 'top', align: 'end', labels: { usePointStyle: true, padding: 10 } },
                    tooltip: { mode: 'index', intersect: false, callbacks: { label: c => `${c.dataset.label}: ${formatCurrency(c.raw)}` } }
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
            tr.className = 'border-b border-gray-100 hover:bg-blue-50 transition-colors';
            tr.innerHTML = `
                <td class="p-2 text-gray-600">${formatDate(new Date(dateStr + 'T00:00:00'))}</td>
                <td class="p-2 text-right text-green-600 font-medium">${formatCurrency(dayData.receber)}</td>
                <td class="p-2 text-right text-red-600 font-medium">${formatCurrency(dayData.pagar)}</td>
                <td class="p-2 text-right font-medium ${saldoDia < 0 ? 'text-red-600' : 'text-green-600'}">${formatCurrency(saldoDia)}</td>
                <td class="p-2 text-right font-semibold text-gray-800">${formatCurrency(saldoAcumulado)}</td>
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
        app.config.dom.internalToggle.addEventListener('change', e => { 
            app.applyFilter('includeInternal', e.target.checked); 
        });
        app.config.dom.clearFiltersBtn.addEventListener('click', app.clearFilters);
        app.config.dom.projectionPeriodFilter.addEventListener('click', (e) => {
            if (e.target.tagName === 'BUTTON') {
                app.config.dom.projectionPeriodFilter.querySelector('.active').classList.remove('active');
                e.target.classList.add('active');
                const filteredData = app.config.getFilteredData(app.rawData, app.activeFilters);
                renderChart(filteredData, app);
                renderProjectedBalanceChart(filteredData, app);
            }
        });
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
