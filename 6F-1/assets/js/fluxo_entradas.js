document.addEventListener('DOMContentLoaded', () => {
    // Variáveis globais para controle de gráficos
    let evolucaoValoresChartInstance;
    let valoresCategoriaChartInstance;
    let paretoDevedoresChartInstance;
    let dadosOriginais = {};
    let filtroAtual = 'em-aberto';
    let filtrosAtivos = {
        natureza: [],
        tipoCobranca: [],
        empresa: [],
        dataInicio: '',
        dataFim: ''
    };

    // Função para converter data do formato YYYY-MM-DD para DD/MM/YYYY para exibição
    const formatarDataExibicao = (dataString) => {
        if (!dataString) return '';
        const data = new Date(dataString + 'T00:00:00');
        return data.toLocaleDateString('pt-BR');
    };

    // Função para converter data DD/MM/YYYY para objeto Date
    const parseDataBR = (dataString) => {
        if (!dataString) return null;
        const [dia, mes, ano] = dataString.split('/');
        return new Date(ano, mes - 1, dia);
    };

    // Função para verificar se uma data está dentro do range
    const dataEstaNoRange = (dataItem, dataInicio, dataFim) => {
        if (!dataInicio && !dataFim) return true;
        
        const dataItemObj = new Date(dataItem);
        const dataInicioObj = dataInicio ? new Date(dataInicio + 'T00:00:00') : null;
        const dataFimObj = dataFim ? new Date(dataFim + 'T23:59:59') : null;
        
        if (dataInicioObj && dataItemObj < dataInicioObj) return false;
        if (dataFimObj && dataItemObj > dataFimObj) return false;
        
        return true;
    };

    const formatarMoeda = (valor) => {
        return valor.toLocaleString('pt-BR', { 
            style: 'currency', 
            currency: 'BRL',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    };

    const calcularVariacao = (valorAtual, valorAnterior) => {
        if (valorAnterior === 0) return { percentual: 0, tipo: 'neutral' };
        const variacao = ((valorAtual - valorAnterior) / valorAnterior) * 100;
        return { percentual: variacao, tipo: variacao > 0 ? 'positive' : variacao < 0 ? 'negative' : 'neutral' };
    };

    const obterDadosCombinados = () => {
        const emAberto = dadosOriginais.emAberto || [];
        const recebidas = dadosOriginais.recebidas || [];
        
        const dadosCombinados = filtroAtual === 'em-aberto' ? emAberto :
                               filtroAtual === 'recebidas' ? recebidas :
                               [...emAberto, ...recebidas];
        
        return dadosCombinados;
    };

    const obterValoresUnicos = (campo) => {
        const dadosCombinados = obterDadosCombinados();
        return [...new Set(dadosCombinados.map(item => item[campo]))].sort();
    };

    const criarDropdownFiltro = (containerId, opcoes, campo) => {
        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = `
            <div class="custom-select relative">
                <button type="button" class="custom-select-button">
                    <span id="${containerId}-text">Todos</span>
                    <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                    </svg>
                </button>
                <div class="custom-select-options" id="${containerId}-options">
                    ${opcoes.map(opcao => `
                        <label class="flex items-center">
                            <input type="checkbox" class="mr-2" value="${opcao}" onchange="handleCheckboxChange(event, '${campo}')">
                            <span>${opcao}</span>
                        </label>
                    `).join('')}
                </div>
            </div>
        `;

        // Event listeners para o dropdown
        const button = container.querySelector('.custom-select-button');
        const options = container.querySelector('.custom-select-options');

        button.addEventListener('click', () => {
            options.classList.toggle('show');
        });

        document.addEventListener('click', (e) => {
            if (!container.contains(e.target)) {
                options.classList.remove('show');
            }
        });
    };

    const atualizarFiltro = (campo) => {
        const opcoes = obterValoresUnicos(campo);
        const containerId = campo === 'natureza' ? 'natureza-filter-container' :
                           campo === 'tipoCobranca' ? 'cobranca-filter-container' :
                           campo === 'empresa' ? 'company-filter-container' : '';
        
        if (containerId) {
            criarDropdownFiltro(containerId, opcoes, campo);
        }
    };

    const atualizarTextoDropdown = (container, campo) => {
        const textElement = document.getElementById(`${container.id}-text`);
        const selecionados = filtrosAtivos[campo];
        
        if (!textElement) return;
        
        if (selecionados.length === 0) {
            textElement.textContent = 'Todos';
        } else if (selecionados.length === 1) {
            textElement.textContent = selecionados[0];
        } else {
            textElement.textContent = `${selecionados.length} selecionados`;
        }
    };

    const obterDadosFiltrados = () => {
        let dados = obterDadosCombinados();
        
        // Aplicar filtros de checkbox
        if (filtrosAtivos.natureza.length > 0) {
            dados = dados.filter(item => filtrosAtivos.natureza.includes(item.natureza));
        }
        if (filtrosAtivos.tipoCobranca.length > 0) {
            dados = dados.filter(item => filtrosAtivos.tipoCobranca.includes(item.tipoCobranca));
        }
        if (filtrosAtivos.empresa.length > 0) {
            dados = dados.filter(item => filtrosAtivos.empresa.includes(item.empresa));
        }
        
        // Aplicar filtro de período por range de datas
        if (filtrosAtivos.dataInicio || filtrosAtivos.dataFim) {
            dados = dados.filter(item => {
                // Converter período YYYY-MM para uma data do primeiro dia do mês
                const [ano, mes] = item.periodo.split('-');
                const dataItem = `${ano}-${mes}-01`;
                return dataEstaNoRange(dataItem, filtrosAtivos.dataInicio, filtrosAtivos.dataFim);
            });
        }
        
        return dados;
    };

    const alternarFiltro = (novoFiltro) => {
        filtroAtual = novoFiltro;
        
        // Atualizar aparência dos botões
        document.querySelectorAll('.filter-btn-abertas, .filter-btn-vencidas, .filter-btn-todas-receber').forEach(btn => {
            btn.classList.remove('active');
        });
        
        const botaoClass = novoFiltro === 'em-aberto' ? 'filter-btn-abertas' :
                          novoFiltro === 'recebidas' ? 'filter-btn-vencidas' :
                          'filter-btn-todas-receber';
        
        document.querySelector(`.${botaoClass}`).classList.add('active');
        
        // Atualizar dropdowns com novos dados
        atualizarFiltro('natureza');
        atualizarFiltro('tipoCobranca');
        atualizarFiltro('empresa');
        
        // Atualizar visualizações
        atualizarVisualizacoes();
    };

    const criarGraficoEvolucao = () => {
        const ctx = document.getElementById('evolucao-valores-chart');
        if (!ctx) return;

        if (evolucaoValoresChartInstance) {
            evolucaoValoresChartInstance.destroy();
        }

        const dadosFiltrados = obterDadosFiltrados();
        
        // Agrupar por período - ano atual
        const dadosPorPeriodo2025 = {};
        dadosFiltrados.forEach(item => {
            const periodo = item.periodo;
            if (!dadosPorPeriodo2025[periodo]) {
                dadosPorPeriodo2025[periodo] = 0;
            }
            dadosPorPeriodo2025[periodo] += item.valor;
        });

        // Agrupar por período - ano anterior (2024)
        const dadosAnoAnterior = filtroAtual === 'em-aberto' ? dadosOriginais.anoAnterior.emAberto :
                                filtroAtual === 'recebidas' ? dadosOriginais.anoAnterior.recebidas :
                                [...dadosOriginais.anoAnterior.emAberto, ...dadosOriginais.anoAnterior.recebidas];

        const dadosPorPeriodo2024 = {};
        dadosAnoAnterior.forEach(item => {
            const periodo = item.periodo;
            if (!dadosPorPeriodo2024[periodo]) {
                dadosPorPeriodo2024[periodo] = 0;
            }
            dadosPorPeriodo2024[periodo] += item.valor;
        });

        // Preparar dados para o gráfico
        const periodosAtuais = Object.keys(dadosPorPeriodo2025).sort();
        const labels = periodosAtuais.map(p => {
            const [ano, mes] = p.split('-');
            const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
            return meses[parseInt(mes) - 1];
        });
        
        const valores2025 = periodosAtuais.map(periodo => dadosPorPeriodo2025[periodo] || 0);
        const valores2024 = periodosAtuais.map(periodo => {
            const periodoAnterior = periodo.replace('2025', '2024');
            return dadosPorPeriodo2024[periodoAnterior] || 0;
        });

        evolucaoValoresChartInstance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels,
                datasets: [
                    {
                        label: '2025 (Atual)',
                        data: valores2025,
                        backgroundColor: '#003D75',
                        borderColor: '#002a52',
                        borderWidth: 1,
                        borderRadius: 4,
                    },
                    {
                        label: '2024 (Anterior)',
                        data: valores2024,
                        backgroundColor: '#A4C4E0',
                        borderColor: '#8bb0d6',
                        borderWidth: 1,
                        borderRadius: 4,
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { 
                        position: 'top',
                        labels: { usePointStyle: true, padding: 15, font: { size: 11 } }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return context.dataset.label + ': ' + formatarMoeda(context.parsed.y);
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return formatarMoeda(value);
                            },
                            font: { size: 10 }
                        }
                    },
                    x: { ticks: { font: { size: 10 } } }
                }
            }
        });
    };

    const criarGraficoCategorias = () => {
        const ctx = document.getElementById('valores-categoria-chart');
        if (!ctx) return;

        if (valoresCategoriaChartInstance) {
            valoresCategoriaChartInstance.destroy();
        }

        const dadosFiltrados = obterDadosFiltrados();
        
        // Agrupar por natureza - ano atual
        const dadosPorNatureza2025 = {};
        dadosFiltrados.forEach(item => {
            const natureza = item.natureza;
            if (!dadosPorNatureza2025[natureza]) {
                dadosPorNatureza2025[natureza] = 0;
            }
            dadosPorNatureza2025[natureza] += item.valor;
        });

        // Agrupar por natureza - ano anterior
        const dadosAnoAnterior = filtroAtual === 'em-aberto' ? dadosOriginais.anoAnterior.emAberto :
                                filtroAtual === 'recebidas' ? dadosOriginais.anoAnterior.recebidas :
                                [...dadosOriginais.anoAnterior.emAberto, ...dadosOriginais.anoAnterior.recebidas];

        const dadosPorNatureza2024 = {};
        dadosAnoAnterior.forEach(item => {
            const natureza = item.natureza;
            if (!dadosPorNatureza2024[natureza]) {
                dadosPorNatureza2024[natureza] = 0;
            }
            dadosPorNatureza2024[natureza] += item.valor;
        });

        const labels = Object.keys(dadosPorNatureza2025);
        const valores2025 = labels.map(label => dadosPorNatureza2025[label]);
        const valores2024 = labels.map(label => dadosPorNatureza2024[label] || 0);

        valoresCategoriaChartInstance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels,
                datasets: [
                    {
                        label: '2025 (Atual)',
                        data: valores2025,
                        backgroundColor: '#003D75',
                        borderColor: '#002a52',
                        borderWidth: 1
                    },
                    {
                        label: '2024 (Anterior)',
                        data: valores2024,
                        backgroundColor: '#A4C4E0',
                        borderColor: '#8bb0d6',
                        borderWidth: 1
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { 
                        position: 'top',
                        labels: { usePointStyle: true, padding: 15, font: { size: 11 } }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return context.dataset.label + ': ' + formatarMoeda(context.parsed.y);
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return formatarMoeda(value);
                            },
                            font: { size: 10 }
                        }
                    },
                    x: { ticks: { font: { size: 10 } } }
                }
            }
        });
    };

    const criarGraficoPareto = () => {
        const ctx = document.getElementById('pareto-devedores-chart');
        if (!ctx) return;

        if (paretoDevedoresChartInstance) {
            paretoDevedoresChartInstance.destroy();
        }

        // Gerar dados dos devedores
        const dadosDevedores = gerarDadosDevedores();
        
        // Aplicar filtros se necessário (empresa)
        let dadosFiltrados = dadosDevedores;
        if (filtrosAtivos.empresa.length > 0) {
            dadosFiltrados = dadosDevedores.filter(item => filtrosAtivos.empresa.includes(item.empresa));
        }
        
        // Pegar apenas os top 10
        const top10 = dadosFiltrados.slice(0, 10);
        
        // Verificar se há dados suficientes
        if (top10.length === 0) {
            document.getElementById('pareto-total').textContent = 'R$ 0,00';
            document.getElementById('pareto-80-percent').textContent = '0 clientes';
            document.getElementById('pareto-maior').textContent = 'R$ 0,00';
            document.getElementById('pareto-tempo-medio').textContent = '0 dias';
            return;
        }
        
        // Calcular total e percentuais acumulados
        const totalVencido = top10.reduce((sum, item) => sum + item.valorVencido, 0);
        let acumulado = 0;
        const percentuaisAcumulados = top10.map(item => {
            acumulado += item.valorVencido;
            return (acumulado / totalVencido) * 100;
        });

        const labels = top10.map(item => {
            // Limitar nome para melhor visualização
            return item.cliente.length > 15 ? item.cliente.substring(0, 15) + '...' : item.cliente;
        });
        const valores = top10.map(item => item.valorVencido);

        // Calcular estatísticas para o resumo
        const totalTop10 = totalVencido;
        const maiorDevedor = top10[0];
        const tempoMedio = top10.reduce((sum, item) => sum + item.diasVencido, 0) / top10.length;
        let clientes80Percent = 0;
        let acumulado80 = 0;
        for (let i = 0; i < top10.length; i++) {
            acumulado80 += top10[i].valorVencido;
            clientes80Percent++;
            if ((acumulado80 / totalVencido) >= 0.8) break;
        }

        document.getElementById('pareto-total').textContent = formatarMoeda(totalTop10);
        document.getElementById('pareto-80-percent').textContent = `${clientes80Percent} clientes`;
        document.getElementById('pareto-maior').textContent = formatarMoeda(maiorDevedor.valorVencido);
        document.getElementById('pareto-tempo-medio').textContent = `${Math.round(tempoMedio)} dias`;

        paretoDevedoresChartInstance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels,
                datasets: [
                    {
                        label: 'Valor Vencido (R$)',
                        data: valores,
                        backgroundColor: '#003D75', // azul principal
                        borderColor: '#002a52', // azul escuro
                        borderWidth: 1,
                        yAxisID: 'y'
                    },
                    {
                        label: '% Acumulado',
                        data: percentuaisAcumulados,
                        type: 'line',
                        borderColor: '#dc2626', // vermelho dashboard
                        backgroundColor: 'rgba(220, 38, 38, 0.08)', // vermelho claro
                        borderWidth: 3,
                        pointRadius: 5,
                        pointBackgroundColor: '#dc2626', // vermelho dashboard
                        pointBorderColor: '#ffffff',
                        pointBorderWidth: 2,
                        tension: 0.1,
                        yAxisID: 'y1',
                        fill: false
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
                plugins: {
                    legend: { 
                        position: 'top',
                        labels: { 
                            usePointStyle: true, 
                            padding: 15,
                            font: { size: 11 },
                            color: '#003D75' // azul principal
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                if (context.dataset.label.includes('Valor')) {
                                    return `Valor Vencido: ${formatarMoeda(context.parsed.y)}`;
                                } else {
                                    return `% Acumulado: ${context.parsed.y.toFixed(1)}%`;
                                }
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        ticks: { 
                            color: '#003D75', // azul principal
                            font: { size: 9 },
                            maxRotation: 45
                        },
                        grid: { display: false }
                    },
                    y: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return formatarMoeda(value);
                            },
                            color: '#003D75', // azul principal
                            font: { size: 10 }
                        },
                        grid: { color: '#f3f4f6' }
                    },
                    y1: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        min: 0,
                        max: 100,
                        ticks: {
                            callback: function(value) {
                                return value.toFixed(0) + '%';
                            },
                            color: '#dc2626', // vermelho dashboard
                            font: { size: 10 }
                        },
                        grid: { display: false }
                    }
                }
            }
        });
    };

    const popularTabela = () => {
        const tableBody = document.getElementById('detailed-table-body');
        if (!tableBody) return;

        const dadosFiltrados = obterDadosFiltrados();
        
        // Agrupar dados por código e descrição (simulados)
        const dadosAgrupados = {};
        dadosFiltrados.forEach(item => {
            const codigo = item.natureza === 'Vendas' ? '001' :
                          item.natureza === 'Serviços' ? '002' :
                          item.natureza === 'Locação' ? '003' :
                          item.natureza === 'Financeiro' ? '004' : '005';
            
            const descricao = `Receita de ${item.natureza}`;
            
            if (!dadosAgrupados[codigo]) {
                dadosAgrupados[codigo] = {
                    codigo,
                    descricao,
                    valores: {}
                };
            }
            
            if (!dadosAgrupados[codigo].valores[item.periodo]) {
                dadosAgrupados[codigo].valores[item.periodo] = 0;
            }
            dadosAgrupados[codigo].valores[item.periodo] += item.valor;
        });

        const meses = ['2025-01', '2025-02', '2025-03', '2025-04', '2025-05', '2025-06'];
        
        tableBody.innerHTML = Object.values(dadosAgrupados).map(item => `
            <tr class="border-b border-gray-100 hover:bg-gray-50">
                <td class="p-2 text-center">${item.codigo}</td>
                <td class="p-2">${item.descricao}</td>
                ${meses.map(mes => `
                    <td class="p-2 text-right text-xs">${formatarMoeda(item.valores[mes] || 0)}</td>
                `).join('')}
            </tr>
        `).join('');
    };

    const popularPainelLateral = () => {
        const container = document.getElementById('transacoes-recentes-container');
        if (!container) return;

        const dadosFiltrados = obterDadosFiltrados()
            .filter(item => filtroAtual === 'todas' || (filtroAtual === 'recebidas' && item.status === 'Recebido'))
            .slice(0, 15);

        container.innerHTML = dadosFiltrados.map(item => `
            <div class="p-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer">
                <div class="flex justify-between items-start mb-1">
                    <span class="text-xs font-medium text-gray-800">${item.cliente || 'Cliente'}</span>
                    <span class="text-xs font-bold text-primary">${formatarMoeda(item.valor)}</span>
                </div>
                <div class="flex justify-between items-center">
                    <span class="text-xs text-gray-500">${item.documento || 'NF-' + Math.floor(Math.random() * 10000)}</span>
                    <span class="text-xs text-gray-400">${item.empresa}</span>
                </div>
            </div>
        `).join('');
    };

    const criarKPIs = () => {
        const kpiContainer = document.getElementById('kpi-container');
        if (!kpiContainer) return;

        const dadosFiltrados = obterDadosFiltrados();
        const dadosAnoAnterior = filtroAtual === 'em-aberto' ? dadosOriginais.anoAnterior.emAberto :
                                filtroAtual === 'recebidas' ? dadosOriginais.anoAnterior.recebidas :
                                [...dadosOriginais.anoAnterior.emAberto, ...dadosOriginais.anoAnterior.recebidas];

        const totalAtual = dadosFiltrados.reduce((sum, item) => sum + item.valor, 0);
        const totalAnterior = dadosAnoAnterior.reduce((sum, item) => sum + item.valor, 0);
        const quantidadeAtual = dadosFiltrados.length;
        const quantidadeAnterior = dadosAnoAnterior.length;
        const ticketMedioAtual = quantidadeAtual > 0 ? totalAtual / quantidadeAtual : 0;
        const ticketMedioAnterior = quantidadeAnterior > 0 ? totalAnterior / quantidadeAnterior : 0;

        const variacaoTotal = calcularVariacao(totalAtual, totalAnterior);
        const variacaoQuantidade = calcularVariacao(quantidadeAtual, quantidadeAnterior);
        const variacaoTicket = calcularVariacao(ticketMedioAtual, ticketMedioAnterior);

        const tituloFiltro = filtroAtual === 'em-aberto' ? 'Em Aberto' :
                            filtroAtual === 'recebidas' ? 'Recebidas' :
                            'Total Geral';

        const kpis = [
            {
                label: `Valor ${tituloFiltro}`,
                value: formatarMoeda(totalAtual),
                variacao: variacaoTotal,
                icon: 'M12 4.5v15m7.5-7.5h-15',
                status: 'success'
            },
            {
                label: `Quantidade ${tituloFiltro}`,
                value: quantidadeAtual.toLocaleString('pt-BR'),
                variacao: variacaoQuantidade,
                icon: 'M7 4V2C7 1.44772 7.44772 1 8 1H16C16.5523 1 17 1.44772 17 2V4H20C20.5523 4 21 4.44772 21 5S20.5523 6 20 6H19V19C19 20.1046 18.1046 21 17 21H7C5.89543 21 5 20.1046 5 19V6H4C3.44772 6 3 5.55228 3 5S3.44772 4 4 4H7Z',
                status: 'info'
            },
            {
                label: 'Ticket Médio',
                value: formatarMoeda(ticketMedioAtual),
                variacao: variacaoTicket,
                icon: 'M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z',
                status: 'primary'
            },
            {
                label: 'Total Registros',
                value: obterDadosCombinados().length.toLocaleString('pt-BR'),
                icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
                status: 'neutral'
            }
        ];

        kpiContainer.innerHTML = kpis.map(kpi => {
            const variacaoHtml = kpi.variacao ? `
                <div class="kpi-variation ${kpi.variacao.tipo}">
                    <svg class="kpi-variation-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                              d="${kpi.variacao.tipo === 'positive' ? 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6' : 
                                 kpi.variacao.tipo === 'negative' ? 'M13 17h8m0 0V9m0 8l-8-8-4 4-6-6' : 
                                 'M9 12l2 2 4-4'}">
                        </path>
                    </svg>
                    ${Math.abs(kpi.variacao.percentual).toFixed(1)}%
                </div>
            ` : '';

            return `
                <div class="kpi-modern kpi-status-${kpi.status}">
                    <div class="kpi-header">
                        <p class="kpi-label">${kpi.label}</p>
                        <svg class="kpi-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="${kpi.icon}"></path>
                        </svg>
                    </div>
                    <p class="kpi-value">${kpi.value}</p>
                    ${variacaoHtml}
                </div>
            `;
        }).join('');

        // Atualizar contador de registros
        const totalRegistros = document.getElementById('total-registros');
        if (totalRegistros) {
            totalRegistros.textContent = `${dadosFiltrados.length} registros encontrados`;
        }
    };

    const mostrarFiltrosAtivos = () => {
        const container = document.getElementById('active-filters-container');
        if (!container) return;

        const pills = [];

        // Pills para filtros de checkbox
        Object.entries(filtrosAtivos).forEach(([tipo, valores]) => {
            if (Array.isArray(valores) && valores.length > 0) {
                valores.forEach(valor => {
                    pills.push({
                        tipo,
                        valor,
                        label: valor,
                        classe: 'filter-pill'
                    });
                });
            }
        });

        // Pill para filtro de período
        if (filtrosAtivos.dataInicio || filtrosAtivos.dataFim) {
            const dataInicio = filtrosAtivos.dataInicio ? formatarDataExibicao(filtrosAtivos.dataInicio) : '';
            const dataFim = filtrosAtivos.dataFim ? formatarDataExibicao(filtrosAtivos.dataFim) : '';
            
            let label = '';
            if (dataInicio && dataFim) {
                label = `${dataInicio} a ${dataFim}`;
            } else if (dataInicio) {
                label = `A partir de ${dataInicio}`;
            } else if (dataFim) {
                label = `Até ${dataFim}`;
            }
            
            pills.push({
                tipo: 'periodo',
                valor: `${dataInicio} a ${dataFim}`,
                label: label,
                classe: 'filter-pill'
            });
        }

        container.innerHTML = pills.map(pill => `
            <div class="${pill.classe}">
                <span>${pill.label}</span>
                <button onclick="removerFiltro('${pill.tipo}', '${pill.valor}')">&times;</button>
            </div>
        `).join('');
    };

    const atualizarVisualizacoes = () => {
        criarKPIs();
        criarGraficoEvolucao();
        criarGraficoCategorias();
        criarGraficoPareto();
        popularTabela();
        popularPainelLateral();
        mostrarFiltrosAtivos();
    };

    const inicializar = () => {
        // Gerar dados mockados
        dadosOriginais = gerarDadosMockados();
        
        // Inicializar filtros de data com valores padrão
        const dataInicioInput = document.getElementById('data-inicio-filter');
        const dataFimInput = document.getElementById('data-fim-filter');
        if (dataInicioInput && dataInicioInput.value) {
            filtrosAtivos.dataInicio = dataInicioInput.value;
        }
        if (dataFimInput && dataFimInput.value) {
            filtrosAtivos.dataFim = dataFimInput.value;
        }
        
        // Configurar filtros de status
        document.getElementById('filtro-abertas')?.addEventListener('click', () => alternarFiltro('em-aberto'));
        document.getElementById('filtro-vencidas')?.addEventListener('click', () => alternarFiltro('recebidas'));
        document.getElementById('filtro-todas-receber')?.addEventListener('click', () => alternarFiltro('todas'));

        // Configurar filtros de data
        document.getElementById('data-inicio-filter')?.addEventListener('change', (e) => {
            filtrosAtivos.dataInicio = e.target.value;
            atualizarVisualizacoes();
        });
        
        document.getElementById('data-fim-filter')?.addEventListener('change', (e) => {
            filtrosAtivos.dataFim = e.target.value;
            atualizarVisualizacoes();
        });

        // Configurar botão limpar filtros
        document.getElementById('clear-filters-btn')?.addEventListener('click', () => {
            filtrosAtivos = { natureza: [], tipoCobranca: [], empresa: [], dataInicio: '', dataFim: '' };
            
            // Limpar checkboxes
            document.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = false);
            
            // Limpar campos de data
            const dataInicioInput = document.getElementById('data-inicio-filter');
            const dataFimInput = document.getElementById('data-fim-filter');
            if (dataInicioInput) dataInicioInput.value = '';
            if (dataFimInput) dataFimInput.value = '';
            
            // Atualizar textos dos dropdowns
            ['natureza-filter-container', 'cobranca-filter-container', 'company-filter-container'].forEach(id => {
                const container = document.getElementById(id);
                if (container) atualizarTextoDropdown(container, id.split('-')[0]);
            });
            
            atualizarVisualizacoes();
        });

        // Inicializar filtros
        atualizarFiltro('natureza');
        atualizarFiltro('tipoCobranca');
        atualizarFiltro('empresa');
        
        // Renderizar visualizações iniciais
        atualizarVisualizacoes();
    };

    // Funções globais para callbacks
    window.handleCheckboxChange = (event, filterKey) => {
        const value = event.target.value;
        const isChecked = event.target.checked;
        
        if (isChecked) {
            if (!filtrosAtivos[filterKey].includes(value)) {
                filtrosAtivos[filterKey].push(value);
            }
        } else {
            filtrosAtivos[filterKey] = filtrosAtivos[filterKey].filter(v => v !== value);
        }
        
        // Atualizar texto do dropdown
        const containerId = filterKey === 'natureza' ? 'natureza-filter-container' :
                           filterKey === 'tipoCobranca' ? 'cobranca-filter-container' :
                           filterKey === 'empresa' ? 'company-filter-container' : '';
        
        if (containerId) {
            const container = document.getElementById(containerId);
            if (container) atualizarTextoDropdown(container, filterKey);
        }
        
        atualizarVisualizacoes();
    };

    window.removerFiltro = (tipo, valor) => {
        if (tipo === 'periodo') {
            filtrosAtivos.dataInicio = '';
            filtrosAtivos.dataFim = '';
            const dataInicioInput = document.getElementById('data-inicio-filter');
            const dataFimInput = document.getElementById('data-fim-filter');
            if (dataInicioInput) dataInicioInput.value = '';
            if (dataFimInput) dataFimInput.value = '';
        } else if (Array.isArray(filtrosAtivos[tipo])) {
            filtrosAtivos[tipo] = filtrosAtivos[tipo].filter(v => v !== valor);
            
            // Desmarcar checkbox correspondente
            const checkbox = document.querySelector(`input[type="checkbox"][value="${valor}"]`);
            if (checkbox) checkbox.checked = false;
            
            // Atualizar texto do dropdown
            const containerId = tipo === 'natureza' ? 'natureza-filter-container' :
                               tipo === 'tipoCobranca' ? 'cobranca-filter-container' :
                               tipo === 'empresa' ? 'company-filter-container' : '';
            
            if (containerId) {
                const container = document.getElementById(containerId);
                if (container) atualizarTextoDropdown(container, tipo);
            }
        }
        
        atualizarVisualizacoes();
    };

    // Função para gerar dados mockados de devedores
    const gerarDadosDevedores = () => {
        const nomes = [
            'Construtora ABC Ltda', 'Metalúrgica XYZ S/A', 'Transportadora Brasil',
            'Indústria Nacional', 'Comércio São Paulo', 'Distribuidora Norte',
            'Fábrica de Móveis', 'Empresa de Logística', 'Atacadista Regional',
            'Indústria Química', 'Construtora Nordeste', 'Siderúrgica Sul',
            'Distribuidora Centro', 'Fábrica Têxtil', 'Empresa de Mineração'
        ];
        
        return nomes.map((nome, index) => ({
            cliente: nome,
            valorVencido: parseFloat((Math.random() * (150000 - 15000) + 15000).toFixed(2)),
            diasVencido: Math.floor(Math.random() * 120) + 1,
            empresa: ['6F', '8F', 'PEQUETITA'][index % 3]
        })).sort((a, b) => b.valorVencido - a.valorVencido).slice(0, 10);
    };

    const gerarDadosMockados = () => {
        const naturezas = ['Vendas', 'Serviços', 'Locação', 'Financeiro', 'Outros'];
        const tiposCobranca = ['Descontado', 'Cobrança Simples', 'Vinculado'];
        const empresas = ['6F', '8F', 'PEQUETITA'];
        const periodos2025 = ['2025-01', '2025-02', '2025-03', '2025-04', '2025-05', '2025-06'];
        const periodos2024 = ['2024-01', '2024-02', '2024-03', '2024-04', '2024-05', '2024-06'];

        const gerarTransacoes = (periodos, isAnoAnterior = false) => {
            const transacoes = [];
            periodos.forEach(periodo => {
                naturezas.forEach(natureza => {
                    empresas.forEach(empresa => {
                        const quantidade = Math.floor(Math.random() * 5) + 1;
                        for (let i = 0; i < quantidade; i++) {
                            transacoes.push({
                                periodo,
                                natureza,
                                tipoCobranca: tiposCobranca[Math.floor(Math.random() * tiposCobranca.length)],
                                empresa,
                                valor: parseFloat((Math.random() * 50000 + 5000).toFixed(2)),
                                status: isAnoAnterior ? 'Recebido' : (Math.random() > 0.3 ? 'Em Aberto' : 'Recebido')
                            });
                        }
                    });
                });
            });
            return transacoes;
        };

        const transacoes2025 = gerarTransacoes(periodos2025);
        const transacoes2024 = gerarTransacoes(periodos2024, true);

        return {
            emAberto: transacoes2025.filter(t => t.status === 'Em Aberto'),
            recebidas: transacoes2025.filter(t => t.status === 'Recebido'),
            anoAnterior: {
                emAberto: transacoes2024.filter(t => t.status === 'Em Aberto'),
                recebidas: transacoes2024.filter(t => t.status === 'Recebido')
            }
        };
    };

    // Inicializar quando o DOM estiver pronto
    inicializar();
});