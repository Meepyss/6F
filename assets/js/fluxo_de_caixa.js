document.addEventListener('DOMContentLoaded', () => {
    let rawData = [];
    let startDate = new Date();
    let endDate = new Date();
    const initialBalance = 50000;

    const companyFilter = document.getElementById('company-filter');
    const internalToggle = document.getElementById('internal-toggle');
    const kpiContainer = document.getElementById('kpi-container');
    const alertsContainer = document.getElementById('alerts-container');
    const calendarBody = document.getElementById('financial-calendar-body');
    const chartCanvas = document.getElementById('cashflow-chart');
    const projectedBalanceCanvas = document.getElementById('projected-balance-chart');
    const projectionPeriodFilter = document.getElementById('projection-period-filter');
    let cashflowChartInstance = null;
    let projectedBalanceChartInstance = null;

    const formatCurrency = (value) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    const formatDate = (date) => date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });

    const generateMockData = () => {
        const companies = ['Alpha', 'Beta'];
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

    const getFilteredData = () => {
        const company = companyFilter.value;
        const includeInternal = internalToggle.checked;

        return rawData.filter(item => {
            const companyMatch = company === 'todos' || item.company === company;
            const internalMatch = includeInternal || !item.isInternal;
            return companyMatch && internalMatch;
        });
    };

    const renderKPIs = (filteredData) => {
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

        kpiContainer.innerHTML = kpis.map(kpi => `
            <div class="bg-white p-4 rounded-xl shadow-sm">
                <div class="flex items-center justify-between text-gray-400">
                    <span class="text-sm font-semibold">${kpi.label}</span>
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="${kpi.icon}"></path></svg>
                </div>
                <p class="text-2xl font-bold text-gray-800 mt-2">${kpi.value}</p>
            </div>
        `).join('');
    };

    const renderAlerts = () => {
        const overdueItems = rawData.filter(d => d.isOverdue);
        const overdueReceivables = overdueItems.filter(d => d.type === 'receber');
        const overduePayables = overdueItems.filter(d => d.type === 'pagar');

        const uniqueOverdueClients = new Set(overdueReceivables.map(d => d.company || 'Cliente Desconhecido')).size;
        const uniqueOverdueSuppliers = new Set(overduePayables.map(d => d.company || 'Fornecedor Desconhecido')).size;

        alertsContainer.innerHTML = `
            <h3 class="font-bold text-gray-800">Alertas Rápidos</h3>
            <div class="flex items-center justify-between p-2 rounded-lg bg-red-50 text-red-700">
                <span class="font-medium text-sm">Contas Vencidas</span>
                <span class="font-bold text-lg">${overdueItems.length}</span>
            </div>
            <div class="flex items-center justify-between p-2 rounded-lg bg-yellow-50 text-yellow-700">
                <span class="font-medium text-sm">Clientes em Atraso</span>
                <span class="font-bold text-lg">${uniqueOverdueClients}</span>
            </div>
             <div class="flex items-center justify-between p-2 rounded-lg bg-orange-50 text-orange-700">
                <span class="font-medium text-sm">Fornecedores em Atraso</span>
                <span class="font-bold text-lg">${uniqueOverdueSuppliers}</span>
            </div>
        `;
    };

    const renderChart = (filteredData) => {
        const today = new Date();
        today.setHours(23, 59, 59, 999);
        const pastData = filteredData.filter(item => new Date(item.date) < today);

        const dailyData = {};
        const chartEndDate = new Date(Math.min(endDate, today));

        if (startDate <= chartEndDate) {
            for (let d = new Date(startDate); d <= chartEndDate; d.setDate(d.getDate() + 1)) {
                const dateStr = d.toISOString().split('T')[0];
                dailyData[dateStr] = { previsto: 0, realizado: 0 };
            }
        }

        pastData.forEach(item => {
            const itemDate = new Date(item.date);
            if (itemDate >= startDate && itemDate <= chartEndDate) {
                const dateStr = itemDate.toISOString().split('T')[0];
                if (dailyData[dateStr]) {
                    const multiplier = item.type === 'receber' ? 1 : -1;
                    dailyData[dateStr].previsto += item.previstoValue * multiplier;
                    dailyData[dateStr].realizado += item.realizadoValue * multiplier;
                }
            }
        });

        const labels = Object.keys(dailyData);
        const previstoData = labels.map(date => dailyData[date].previsto);
        const realizadoData = labels.map(date => dailyData[date].realizado);
        const diferencaData = labels.map((date, index) => realizadoData[index] - previstoData[index]);

        if (cashflowChartInstance) {
            cashflowChartInstance.destroy();
        }

        cashflowChartInstance = new Chart(chartCanvas, {
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
                scales: {
                    x: { type: 'time', time: { unit: 'day', displayFormats: { day: 'dd/MM' } }, grid: { display: false }, stacked: false },
                    y: { grid: { color: '#e5e7eb' }, ticks: { callback: value => formatCurrency(value) }, stacked: false }
                },
                plugins: {
                    legend: { position: 'top', align: 'end' },
                    tooltip: { mode: 'index', intersect: false, callbacks: { label: c => `${c.dataset.label}: ${formatCurrency(c.raw)}` } }
                }
            }
        });
    };

    const renderProjectedBalanceChart = () => {
        const period = projectionPeriodFilter.querySelector('.active').dataset.period;
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const pastData = rawData.filter(item => new Date(item.date) < today);
        const futureData = rawData.filter(item => new Date(item.date) >= today);

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

        projectedBalanceChartInstance = new Chart(projectedBalanceCanvas, {
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
                    legend: { display: false },
                    tooltip: { mode: 'index', intersect: false, callbacks: { label: c => `${c.dataset.label}: ${formatCurrency(c.raw)}` } }
                }
            }
        });
    };

    const renderCalendar = (filteredData) => {
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

        calendarBody.innerHTML = '';
        const fragment = document.createDocumentFragment();

        Object.keys(dailyAggregates).forEach(dateStr => {
            const dayData = dailyAggregates[dateStr];
            const saldoDia = dayData.receber - dayData.pagar;
            saldoAcumulado += saldoDia;

            const tr = document.createElement('tr');
            tr.className = 'border-b border-gray-200';
            tr.innerHTML = `
                <td class="p-2">${formatDate(new Date(dateStr + 'T00:00:00'))}</td>
                <td class="p-2 text-right relative"><div class="data-bar bg-blue-500" style="width: ${((dayData.receber / maxReceber) * 100) || 0}%"></div><span class="value-text">${formatCurrency(dayData.receber)}</span></td>
                <td class="p-2 text-right relative"><div class="data-bar bg-red-500" style="width: ${((dayData.pagar / maxPagar) * 100) || 0}%"></div><span class="value-text">${formatCurrency(dayData.pagar)}</span></td>
                <td class="p-2 text-right font-medium ${saldoDia < 0 ? 'text-red-600' : 'text-green-600'}">${formatCurrency(saldoDia)}</td>
                <td class="p-2 text-right font-semibold text-gray-800">${formatCurrency(saldoAcumulado)}</td>
            `;
            fragment.appendChild(tr);
        });

        calendarBody.appendChild(fragment);
    };

    const updateDashboard = () => {
        const filteredData = getFilteredData();
        renderKPIs(filteredData);
        renderAlerts();
        renderChart(filteredData);
        renderProjectedBalanceChart();
        renderCalendar(filteredData);
    };

    const setupEventListeners = () => {
        companyFilter.addEventListener('change', updateDashboard);
        internalToggle.addEventListener('change', updateDashboard);
        projectionPeriodFilter.addEventListener('click', (e) => {
            if (e.target.tagName === 'BUTTON') {
                projectionPeriodFilter.querySelector('.active').classList.remove('active');
                e.target.classList.add('active');
                renderProjectedBalanceChart();
            }
        });
    };

    const init = () => {
        endDate = new Date();
        startDate = new Date();
        startDate.setDate(endDate.getDate() - 30);
        
        rawData = generateMockData();
        setupEventListeners();
        updateDashboard();
    };

    init();
});
