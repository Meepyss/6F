document.addEventListener('DOMContentLoaded', () => {
    let paretoChartInstance;

    const createOrUpdateChart = (instance, chartDomElement, type, data, options) => {
        if (instance) {
            instance.destroy();
        }
        if (chartDomElement) {
            return new Chart(chartDomElement, { type, data, options });
        }
    };

    const generateMockData = () => {
        const clientes = ["Supermercado Sol", "Hotel Palace", "Indústria Metalúrgica", "Comércio Varejista", "Boutique Elegance", "Restaurante Saboroso", "Construtora Build", "Hospital Saúde+", "Escola Aprender", "Tecnologia Avançada", "Agro Business", "Clínica Bem-Estar", "Rede de Farmácias", "Distribuidora de Alimentos", "Engenharia & Projetos"];
        const tipos_cobranca = ["Descontado", "Cobrança Simples", "Vinculado"];
        const empresas = ["6F", "8F", "PEQUETITA"];
        const data = [];
        const today = new Date(2025, 6, 4);

        // Create Major Debtors
        for (let i = 0; i < 5; i++) {
            const valor_original = parseFloat((Math.random() * (250000 - 80000) + 80000).toFixed(2));
            const vencimento = new Date(today.getTime());
            vencimento.setDate(today.getDate() - (Math.floor(Math.random() * 60) + 30)); // 30-90 days overdue
            data.push({
                id: i + 1,
                client: `Grande Devedor ${i + 1}`,
                document: `NF-GD-${i + 1}`,
                company: empresas[i % empresas.length],
                tipoCobranca: tipos_cobranca[i % tipos_cobranca.length],
                emissionDate: new Date(vencimento.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                dueDate: vencimento.toISOString().split('T')[0],
                valorOriginal: valor_original,
                valorEmAberto: valor_original,
                status: 'Vencido',
                daysOverdue: Math.floor((today - vencimento) / (1000 * 60 * 60 * 24)),
                isInternal: false,
                compensatedBy: []
            });
        }

        // Create other varied data
        for (let i = 6; i <= 1200; i++) {
            const client_base = clientes[i % clientes.length];
            const client = `${client_base} - ${Math.floor(Math.random() * (999 - 100 + 1)) + 100}`;
            const status = ["Aberto", "Vencido", "Compensado", "Pago Parcial"][i % 4];
            const emissao_delta = Math.floor(Math.random() * (0 - -120 + 1)) + -120;
            const emissao = new Date(today.getTime());
            emissao.setDate(today.getDate() + emissao_delta);
            const vencimento_delta = Math.floor(Math.random() * (75 - 15 + 1)) + 15;
            const vencimento = new Date(emissao.getTime());
            vencimento.setDate(emissao.getDate() + vencimento_delta);
            const days_overdue = Math.floor((today - vencimento) / (1000 * 60 * 60 * 24));

            const valor_original = parseFloat((Math.random() * (40000 - 500) + 500).toFixed(2));
            let valor_em_aberto = 0;
            if (status === "Aberto" || status === "Vencido") {
                valor_em_aberto = valor_original;
            } else if (status === "Pago Parcial") {
                valor_em_aberto = parseFloat((Math.random() * (valor_original - 100) + 100).toFixed(2));
            }

            data.push({
                id: i,
                client: client,
                document: `NF-${Math.floor(Math.random() * (99999 - 20000 + 1)) + 20000}`,
                company: empresas[i % empresas.length],
                tipoCobranca: tipos_cobranca[i % tipos_cobranca.length],
                emissionDate: emissao.toISOString().split('T')[0],
                dueDate: vencimento.toISOString().split('T')[0],
                valorOriginal: valor_original,
                valorEmAberto: valor_em_aberto,
                status: status,
                daysOverdue: days_overdue,
                isInternal: Math.random() < 0.1,
                compensatedBy: status === "Compensado" ? [`AD-${Math.floor(Math.random() * (999 - 100 + 1)) + 100}`] : []
            });
        }
        console.log('Generated Mock Data for Contas a Receber:', data);
        return data;
    };

    const openClientStatementModal = (clientName, app) => {
        const clientData = app.rawData.filter(d => d.client === clientName && d.status === 'Vencido');
        const modal = app.config.dom.drilldownModal;
        const modalTitle = app.config.dom.drilldownModalTitle;
        const modalKpiContainer = app.config.dom.modalKpiContainer;
        const modalTableBody = app.config.dom.drilldownModalTableBody;

        if (!clientData.length) return;

        modalTitle.textContent = clientName;

        const totalVencido = clientData.reduce((sum, d) => sum + d.valorEmAberto, 0);
        const faturasVencidas = clientData.length;
        const maxDiasAtraso = Math.max(...clientData.map(d => d.daysOverdue));

        const kpis = [
            { label: 'Valor Total Vencido', value: totalVencido.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'}), color: 'text-red-600' },
            { label: 'Faturas Vencidas', value: faturasVencidas, color: 'text-orange-600' },
            { label: 'Maior Atraso (dias)', value: maxDiasAtraso, color: 'text-yellow-600' }
        ];
        modalKpiContainer.innerHTML = kpis.map(kpi => `<div class="kpi-card !p-4"><p class="text-sm text-gray-500">${kpi.label}</p><p class="text-xl font-bold ${kpi.color}">${kpi.value}</p></div>`).join('');

        modalTableBody.innerHTML = clientData.map(d => `
            <tr class="border-b border-gray-200">
                <td class="p-3">${d.document}</td>
                <td class="p-3">${new Date(d.dueDate + 'T00:00:00').toLocaleDateString('pt-BR')}</td>
                <td class="p-3 text-right">${d.daysOverdue}</td>
                <td class="p-3 text-right font-semibold">${d.valorEmAberto.toLocaleString('pt-BR', {style:'currency', currency:'BRL'})}</td>
            </tr>
        `).join('');

        modal.classList.remove('hidden', 'opacity-0');
        modal.querySelector('.modal-container').classList.add('scale-100');
    };

    const config = {
        initialFilters: {
            companies: [],
            customers: [],
            statuses: [],
            includeInternal: false,
            agingRange: 'all',
            cobranca: 'all',
        },
        dom: {
            customRangeMin: document.getElementById('custom-range-min'),
            customRangeMax: document.getElementById('custom-range-max'),
            applyCustomRange: document.getElementById('apply-custom-range'),
            clearAgingFilter: document.getElementById('clear-aging-filter'),
            companyFilterContainer: document.getElementById('company-filter-container'),
            statusFilterContainer: document.getElementById('status-filter-container'),
            cobrancaFilter: document.getElementById('cobranca-filter'),
            internalToggle: document.getElementById('internal-toggle'),
            clearFiltersBtn: document.getElementById('clear-filters-btn'),
            activeFiltersContainer: document.getElementById('active-filters-container'),
            kpiContainer: document.getElementById('kpi-container'),
            paretoChartCanvas: document.getElementById('pareto-chart-canvas'),
            paretoChartTitle: document.getElementById('pareto-chart-title'),
            detailedTableBody: document.getElementById('detailed-table-body'),
            paginationControls: document.getElementById('pagination-controls'),
            drilldownModal: document.getElementById('client-statement-modal'),
            drilldownModalTitle: document.getElementById('modal-client-name'),
            modalKpiContainer: document.getElementById('modal-kpi-container'),
            drilldownModalCloseBtn: document.getElementById('modal-close-btn'),
            drilldownModalTableBody: document.getElementById('statement-table-body'),
        },
        allCompanies: ["8F", "6F", "PEQUETITA"],
        allStatuses: ["Aberto", "Vencido", "Compensado", "Pago Parcial", "Acordo", "Adiantamento"],
        filterPillDefinitions: [
            { type: 'companies', label: 'Empresa' },
            { type: 'customers', label: 'Cliente' },
            { type: 'statuses', label: 'Status' },
        ],
        customSelects: [
            { type: 'Empresas', options: ["8F", "6F", "PEQUETITA"], filterKey: 'companies', containerId: 'companyFilterContainer' },
            { type: 'Status', options: ["Aberto", "Vencido", "Compensado", "Pago Parcial", "Acordo", "Adiantamento"], filterKey: 'statuses', containerId: 'statusFilterContainer' },
        ],
        getFilteredData: (rawData, activeFilters) => {
            return rawData.filter(item => {
                const companyMatch = activeFilters.companies.length === 0 || activeFilters.companies.includes(item.company);
                const customerMatch = activeFilters.customers.length === 0 || activeFilters.customers.includes(item.client);
                const statusMatch = activeFilters.statuses.length === 0 || activeFilters.statuses.includes(item.status);
                const internalMatch = activeFilters.includeInternal || !item.isInternal;
                const cobrancaMatch = activeFilters.cobranca === 'all' || item.tipoCobranca === activeFilters.cobranca;
                let agingMatch = true;
                if (activeFilters.agingRange !== 'all' && item.status === 'Vencido' && item.daysOverdue > 0) {
                    const [min, max] = activeFilters.agingRange.split('-');
                    const minDays = parseInt(min) || 0;
                    const maxDays = max === 'Infinity' ? Infinity : parseInt(max);
                    agingMatch = item.daysOverdue >= minDays && item.daysOverdue <= maxDays;
                }
                return companyMatch && customerMatch && statusMatch && internalMatch && agingMatch && cobrancaMatch;
            });
        },
        renderTable: (data, app, tableBody) => {
            const pageData = data.slice((app.currentPage - 1) * app.rowsPerPage, app.currentPage * app.rowsPerPage);
            tableBody.innerHTML = '';
            if (pageData.length === 0) {
                const row = tableBody.insertRow();
                const cell = row.insertCell();
                cell.colSpan = 9;
                cell.className = 'p-8 text-center text-gray-500';
                cell.textContent = 'Nenhum registro encontrado.';
                return;
            }
            pageData.forEach(item => {
                const row = tableBody.insertRow();
                row.className = 'border-b border-gray-200 hover:bg-gray-50';
                row.insertCell().outerHTML = `<td class="p-3 font-medium cursor-pointer hover:text-blue-600" onclick="app.applyFilter('customers', '${item.client}', event.ctrlKey)">${item.client}</td>`;
                row.insertCell().outerHTML = `<td class="p-3">${item.document}</td>`;
                row.insertCell().outerHTML = `<td class="p-3 cursor-pointer hover:text-blue-600" onclick="app.applyFilter('companies', '${item.company}', event.ctrlKey)">${item.company}</td>`;
                row.insertCell().outerHTML = `<td class="p-3">${item.tipoCobranca}</td>`;
                row.insertCell().outerHTML = `<td class="p-3">${new Date(item.emissionDate + 'T00:00:00').toLocaleDateString('pt-BR')}</td>`;
                row.insertCell().outerHTML = `<td class="p-3">${item.dueDate ? new Date(item.dueDate + 'T00:00:00').toLocaleDateString('pt-BR') : 'N/A'}</td>`;
                row.insertCell().outerHTML = `<td class="p-3 text-right">${item.valorOriginal.toLocaleString('pt-BR', {style:'currency', currency:'BRL'})}</td>`;
                row.insertCell().outerHTML = `<td class="p-3 text-right font-semibold">${item.valorEmAberto.toLocaleString('pt-BR', {style:'currency', currency:'BRL'})}</td>`;
                const statusClass = item.status === 'Vencido' ? 'bg-red-100 text-red-800' : item.status === 'Pago Parcial' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800';
                row.insertCell().outerHTML = `<td class="p-3"><span class="px-2 py-1 text-xs rounded-full cursor-pointer ${statusClass}" onclick="app.applyFilter('statuses', '${item.status}', event.ctrlKey)">${item.status}</span></td>`;
            });
        },
        renderFunctions: [
            function renderKPIs(data, app) {
                const totalReceber = data.filter(d => d.status !== 'Adiantamento').reduce((sum, d) => sum + d.valorEmAberto, 0);
                const totalVencido = data.filter(d => d.status === 'Vencido').reduce((sum, d) => sum + d.valorEmAberto, 0);
                const weightedSum = data.filter(d => d.daysOverdue > 0).reduce((sum, d) => sum + (d.valorEmAberto * d.daysOverdue), 0);
                const pmr = totalVencido > 0 ? weightedSum / totalVencido : 0;
                const inadimplencia = totalReceber > 0 ? (totalVencido / totalReceber) * 100 : 0;
                const kpis = [
                    { label: 'Valor Total a Receber', value: totalReceber.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'}), color: 'text-blue-600' },
                    { label: 'Valor Total Vencido', value: totalVencido.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'}), color: 'text-red-600' },
                    { label: 'PMR (dias)', value: pmr.toFixed(1), color: 'text-orange-600' },
                    { label: '% de Inadimplência', value: `${inadimplencia.toFixed(2)}%`, color: 'text-red-700' }
                ];
                app.config.dom.kpiContainer.innerHTML = kpis.map(kpi => `<div class="kpi-card"><p class="text-sm text-gray-500">${kpi.label}</p><p class="text-2xl font-bold ${kpi.color}">${kpi.value}</p></div>`).join('');
            },
            function renderParetoChart(data, app) {
                const allOverdue = data.filter(d => d.status === 'Vencido');
                const totalOverdueAmount = allOverdue.reduce((sum, d) => sum + d.valorEmAberto, 0);

                const devedores = allOverdue.reduce((acc, d) => {
                    if (!acc[d.client]) acc[d.client] = 0;
                    acc[d.client] += d.valorEmAberto;
                    return acc;
                }, {});

                const sortedDevedores = Object.entries(devedores).sort(([,a],[,b]) => b - a).slice(0, 10);
                
                let cumulative = 0;
                const cumulativePercentage = sortedDevedores.map(([, value]) => {
                    cumulative += value;
                    return (cumulative / totalOverdueAmount) * 100;
                });

                // Update chart title dynamically
                const top10Total = sortedDevedores.reduce((sum, [, value]) => sum + value, 0);
                const top10Percentage = totalOverdueAmount > 0 ? (top10Total / totalOverdueAmount) * 100 : 0;
                if (app.config.dom.paretoChartTitle) {
                    app.config.dom.paretoChartTitle.textContent = `Top 10 Devedores Representam ${top10Percentage.toFixed(0)}% do Valor Total Vencido`;
                }


                const chartData = {
                    labels: sortedDevedores.map(([client]) => client),
                    datasets: [
                        {
                            label: 'Valor Vencido',
                            data: sortedDevedores.map(([,valor]) => valor),
                            backgroundColor: 'rgba(59, 130, 246, 1)',
                            yAxisID: 'y',
                            order: 2 // Render bars first
                        },
                        {
                            label: '% Acumulado',
                            data: cumulativePercentage,
                            type: 'line',
                            borderColor: 'rgba(239, 68, 68, 1)',
                            backgroundColor: 'transparent',
                            pointBackgroundColor: 'rgba(239, 68, 68, 1)',
                            pointRadius: 5,
                            yAxisID: 'y1',
                            order: 1 // Render line on top
                        }
                    ]
                };

                const options = {
                    responsive: true,
                    maintainAspectRatio: false,
                    onClick: (event, elements) => {
                        if (elements.length > 0) {
                            const clientName = chartData.labels[elements[0].index];
                            openClientStatementModal(clientName, app);
                        }
                    },
                    scales: {
                        y: {
                            type: 'linear',
                            display: true,
                            position: 'left',
                            beginAtZero: true,
                            title: { display: true, text: 'Valor Vencido (R$)' },
                            ticks: { callback: value => value.toLocaleString('pt-BR', {style:'currency', currency:'BRL'}) }
                        },
                        y1: {
                            type: 'linear',
                            display: true,
                            position: 'right',
                            min: 0,
                            max: 100,
                            title: { display: true, text: '% Acumulado' },
                            ticks: { callback: value => `${value.toFixed(0)}%` },
                            grid: { drawOnChartArea: false }
                        }
                    },
                    plugins: {
                        datalabels: {
                            display: (context) => {
                                return context.dataset.type === 'line';
                            },
                            anchor: 'end',
                            align: 'end',
                            color: '#c026d3',
                            font: {
                                weight: 'bold'
                            },
                            formatter: (value) => {
                                return `${value.toFixed(0)}%`;
                            }
                        },
                        tooltip: {
                            mode: 'index',
                            intersect: false,
                            callbacks: {
                                label: function(context) {
                                    let label = context.dataset.label || '';
                                    if (label) {
                                        label += ': ';
                                    }
                                    if (context.dataset.yAxisID === 'y1') {
                                        label += `${context.parsed.y.toFixed(2)}%`;
                                    } else {
                                        label += new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(context.parsed.y);
                                    }
                                    return label;
                                }
                            }
                        }
                    }
                };

                paretoChartInstance = createOrUpdateChart(paretoChartInstance, app.config.dom.paretoChartCanvas, 'bar', chartData, options);
            },
            function renderMainTable(data, app) {
                app.config.renderTable(data, app, app.config.dom.detailedTableBody);
            }
        ],
        setupEventListeners: (app) => {
            // Custom range apply button
            app.config.dom.applyCustomRange.addEventListener('click', () => {
                const minValue = parseInt(app.config.dom.customRangeMin.value) || 0;
                const maxValue = app.config.dom.customRangeMax.value ? parseInt(app.config.dom.customRangeMax.value) : 'Infinity';
                const customRange = `${minValue}-${maxValue}`;
                app.applyFilter('agingRange', customRange);
            });
            
            // Clear aging filter button
            app.config.dom.clearAgingFilter.addEventListener('click', () => {
                app.config.dom.customRangeMin.value = '';
                app.config.dom.customRangeMax.value = '';
                app.applyFilter('agingRange', 'all');
            });
            
            // Allow Enter key to apply custom range
            [app.config.dom.customRangeMin, app.config.dom.customRangeMax].forEach(input => {
                input.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') {
                        app.config.dom.applyCustomRange.click();
                    }
                });
            });
            
            app.config.dom.cobrancaFilter.addEventListener('change', e => { app.applyFilter('cobranca', e.target.value); });
            app.config.dom.internalToggle.addEventListener('change', e => { app.applyFilter('includeInternal', e.target.checked); });
            app.config.dom.clearFiltersBtn.addEventListener('click', () => {
                app.config.dom.customRangeMin.value = '';
                app.config.dom.customRangeMax.value = '';
                app.clearFilters();
            });
            app.config.dom.drilldownModalCloseBtn.addEventListener('click', () => {
                const modal = app.config.dom.drilldownModal;
                modal.classList.add('opacity-0');
                modal.querySelector('.modal-container').classList.remove('scale-100');
                setTimeout(() => modal.classList.add('hidden'), 300);
            });
        }
    };

    const app = new DashboardApp(config);
    app.init(generateMockData());
});