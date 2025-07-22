document.addEventListener('DOMContentLoaded', () => {
    let evolucaoValoresChartInstance;
    let valoresCategoriaChartInstance;
    let filtroAtual = 'em-aberto'; // 'em-aberto', 'pagas', 'todas'
    let filtrosAtivos = {
        natureza: [],
        naturezaOperacao: [],
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

    // Dados simulados expandidos com categorias e comparação ano anterior
    const dadosOriginais = {
        // Contas em aberto (a pagar) - 2025
        emAberto: [
            { codigo: '106', descricao: 'MATÉRIA PRIMA SANTOS', valor: 815673.74, vencimento: '2025-07-15', status: 'Em Aberto', grupoNatureza: 'Compras', naturezaOperacao: 'Matéria Prima', empresa: '6F', periodo: '2025-07', ano: 2025 },
            { codigo: '208', descricao: 'COMISSÕES GERAIS', valor: 238548.12, vencimento: '2025-07-20', status: 'Em Aberto', grupoNatureza: 'Despesas Comerciais', naturezaOperacao: 'Comissões', empresa: '8F', periodo: '2025-07', ano: 2025 },
            { codigo: '310', descricao: 'ENERGIA ELÉTRICA', valor: 89345.67, vencimento: '2025-07-10', status: 'Em Aberto', grupoNatureza: 'Despesas Ocupação', naturezaOperacao: 'Energia Elétrica', empresa: '6F', periodo: '2025-07', ano: 2025 },
            { codigo: '411', descricao: 'DÍVIDA E VENDAS', valor: 324786.88, vencimento: '2025-07-25', status: 'Em Aberto', grupoNatureza: 'Despesas Comerciais', naturezaOperacao: 'Vendas', empresa: '9F', periodo: '2025-07', ano: 2025 },
            { codigo: '512', descricao: 'SALÁRIOS E ORDENADOS', valor: 567891.23, vencimento: '2025-07-05', status: 'Em Aberto', grupoNatureza: 'Despesas com Pessoal', naturezaOperacao: 'Salários', empresa: '6F', periodo: '2025-07', ano: 2025 },
            { codigo: '613', descricao: 'FRETES E CARRETOS DIVERSOS', valor: 156739.94, vencimento: '2025-07-18', status: 'Em Aberto', grupoNatureza: 'Despesas Comerciais', naturezaOperacao: 'Fretes', empresa: '8F', periodo: '2025-07', ano: 2025 },
            { codigo: '714', descricao: 'PRÊMIOS PAGOS', valor: 89654.32, vencimento: '2025-07-12', status: 'Em Aberto', grupoNatureza: 'Despesas com Pessoal', naturezaOperacao: 'Prêmios', empresa: '9F', periodo: '2025-07', ano: 2025 },
            { codigo: '815', descricao: 'GASTOS DE FABRICAÇÃO', valor: 456123.78, vencimento: '2025-07-08', status: 'Em Aberto', grupoNatureza: 'Compras', naturezaOperacao: 'Material Fabricação', empresa: '6F', periodo: '2025-07', ano: 2025 },
            // Dados para agosto 2025
            { codigo: '116', descricao: 'MATÉRIA PRIMA FORTALEZA', valor: 654321.98, vencimento: '2025-08-15', status: 'Em Aberto', grupoNatureza: 'Compras', naturezaOperacao: 'Matéria Prima', empresa: '8F', periodo: '2025-08', ano: 2025 },
            { codigo: '217', descricao: 'TELECOMUNICAÇÕES', valor: 45678.90, vencimento: '2025-08-10', status: 'Em Aberto', grupoNatureza: 'Despesas Ocupação', naturezaOperacao: 'Telefone', empresa: '6F', periodo: '2025-08', ano: 2025 },
            { codigo: '318', descricao: 'ALUGUEL ESCRITÓRIO', valor: 123456.78, vencimento: '2025-08-05', status: 'Em Aberto', grupoNatureza: 'Despesas Ocupação', naturezaOperacao: 'Aluguel', empresa: '9F', periodo: '2025-08', ano: 2025 },
            { codigo: '419', descricao: 'IMPOSTOS FEDERAIS', valor: 789012.34, vencimento: '2025-08-20', status: 'Em Aberto', grupoNatureza: 'Impostos', naturezaOperacao: 'Impostos Federais', empresa: '6F', periodo: '2025-08', ano: 2025 }
        ],
        
        // Contas pagas - 2025
        pagas: [
            { codigo: '106', descricao: 'MATÉRIA PRIMA SANTOS', valor: 789234.56, dataPagamento: '2025-06-28', status: 'Pago', grupoNatureza: 'Compras', naturezaOperacao: 'Matéria Prima', empresa: '6F', periodo: '2025-06', ano: 2025 },
            { codigo: '208', descricao: 'COMISSÕES GERAIS', valor: 267891.23, dataPagamento: '2025-06-27', status: 'Pago', grupoNatureza: 'Despesas Comerciais', naturezaOperacao: 'Comissões', empresa: '8F', periodo: '2025-06', ano: 2025 },
            { codigo: '310', descricao: 'ENERGIA ELÉTRICA', valor: 87654.32, dataPagamento: '2025-06-26', status: 'Pago', grupoNatureza: 'Despesas Ocupação', naturezaOperacao: 'Energia Elétrica', empresa: '6F', periodo: '2025-06', ano: 2025 },
            { codigo: '411', descricao: 'DÍVIDA E VENDAS', valor: 298765.43, dataPagamento: '2025-06-25', status: 'Pago', grupoNatureza: 'Despesas Comerciais', naturezaOperacao: 'Vendas', empresa: '9F', periodo: '2025-06', ano: 2025 },
            { codigo: '512', descricao: 'SALÁRIOS E ORDENADOS', valor: 592345.67, dataPagamento: '2025-06-24', status: 'Pago', grupoNatureza: 'Despesas com Pessoal', naturezaOperacao: 'Salários', empresa: '6F', periodo: '2025-06', ano: 2025 },
            { codigo: '613', descricao: 'FRETES E CARRETOS DIVERSOS', valor: 163456.78, dataPagamento: '2025-06-23', status: 'Pago', grupoNatureza: 'Despesas Comerciais', naturezaOperacao: 'Fretes', empresa: '8F', periodo: '2025-06', ano: 2025 },
            { codigo: '714', descricao: 'PRÊMIOS PAGOS', valor: 96234.56, dataPagamento: '2025-06-22', status: 'Pago', grupoNatureza: 'Despesas com Pessoal', naturezaOperacao: 'Prêmios', empresa: '9F', periodo: '2025-06', ano: 2025 },
            { codigo: '815', descricao: 'GASTOS DE FABRICAÇÃO', valor: 489123.45, dataPagamento: '2025-06-21', status: 'Pago', grupoNatureza: 'Compras', naturezaOperacao: 'Material Fabricação', empresa: '6F', periodo: '2025-06', ano: 2025 },
            // Mais registros para outros períodos de 2025
            { codigo: '120', descricao: 'IMPOSTOS ESTADUAIS', valor: 234567.89, dataPagamento: '2025-05-28', status: 'Pago', grupoNatureza: 'Impostos', naturezaOperacao: 'Impostos Estaduais', empresa: '8F', periodo: '2025-05', ano: 2025 },
            { codigo: '221', descricao: 'MANUTENÇÃO EQUIPAMENTOS', valor: 345678.90, dataPagamento: '2025-05-25', status: 'Pago', grupoNatureza: 'Manutenção', naturezaOperacao: 'Manutenção Equipamentos', empresa: '6F', periodo: '2025-05', ano: 2025 },
            { codigo: '322', descricao: 'MATERIAL DE ESCRITÓRIO', valor: 56789.01, dataPagamento: '2025-05-20', status: 'Pago', grupoNatureza: 'Despesas Ocupação', naturezaOperacao: 'Material Escritório', empresa: '9F', periodo: '2025-05', ano: 2025 },
            { codigo: '423', descricao: 'ENCARGOS SOCIAIS', valor: 456789.12, dataPagamento: '2025-05-15', status: 'Pago', grupoNatureza: 'Despesas com Pessoal', naturezaOperacao: 'Encargos Sociais', empresa: '6F', periodo: '2025-05', ano: 2025 }
        ],

        // Dados do ano anterior (2024) para comparação
        anoAnterior: {
            pagas: [
                // Jun 2024
                { codigo: '106', descricao: 'MATÉRIA PRIMA SANTOS', valor: 720000.00, dataPagamento: '2024-06-28', status: 'Pago', grupoNatureza: 'Compras', naturezaOperacao: 'Matéria Prima', empresa: '6F', periodo: '2024-06', ano: 2024 },
                { codigo: '208', descricao: 'COMISSÕES GERAIS', valor: 245000.00, dataPagamento: '2024-06-27', status: 'Pago', grupoNatureza: 'Despesas Comerciais', naturezaOperacao: 'Comissões', empresa: '8F', periodo: '2024-06', ano: 2024 },
                { codigo: '310', descricao: 'ENERGIA ELÉTRICA', valor: 82000.00, dataPagamento: '2024-06-26', status: 'Pago', grupoNatureza: 'Despesas Ocupação', naturezaOperacao: 'Energia Elétrica', empresa: '6F', periodo: '2024-06', ano: 2024 },
                { codigo: '411', descricao: 'DÍVIDA E VENDAS', valor: 275000.00, dataPagamento: '2024-06-25', status: 'Pago', grupoNatureza: 'Despesas Comerciais', naturezaOperacao: 'Vendas', empresa: '9F', periodo: '2024-06', ano: 2024 },
                { codigo: '512', descricao: 'SALÁRIOS E ORDENADOS', valor: 540000.00, dataPagamento: '2024-06-24', status: 'Pago', grupoNatureza: 'Despesas com Pessoal', naturezaOperacao: 'Salários', empresa: '6F', periodo: '2024-06', ano: 2024 },
                { codigo: '613', descricao: 'FRETES E CARRETOS DIVERSOS', valor: 150000.00, dataPagamento: '2024-06-23', status: 'Pago', grupoNatureza: 'Despesas Comerciais', naturezaOperacao: 'Fretes', empresa: '8F', periodo: '2024-06', ano: 2024 },
                { codigo: '714', descricao: 'PRÊMIOS PAGOS', valor: 88000.00, dataPagamento: '2024-06-22', status: 'Pago', grupoNatureza: 'Despesas com Pessoal', naturezaOperacao: 'Prêmios', empresa: '9F', periodo: '2024-06', ano: 2024 },
                { codigo: '815', descricao: 'GASTOS DE FABRICAÇÃO', valor: 445000.00, dataPagamento: '2024-06-21', status: 'Pago', grupoNatureza: 'Compras', naturezaOperacao: 'Material Fabricação', empresa: '6F', periodo: '2024-06', ano: 2024 },
                
                // Mai 2024
                { codigo: '120', descricao: 'IMPOSTOS ESTADUAIS', valor: 210000.00, dataPagamento: '2024-05-28', status: 'Pago', grupoNatureza: 'Impostos', naturezaOperacao: 'Impostos Estaduais', empresa: '8F', periodo: '2024-05', ano: 2024 },
                { codigo: '221', descricao: 'MANUTENÇÃO EQUIPAMENTOS', valor: 320000.00, dataPagamento: '2024-05-25', status: 'Pago', grupoNatureza: 'Manutenção', naturezaOperacao: 'Manutenção Equipamentos', empresa: '6F', periodo: '2024-05', ano: 2024 },
                { codigo: '322', descricao: 'MATERIAL DE ESCRITÓRIO', valor: 52000.00, dataPagamento: '2024-05-20', status: 'Pago', grupoNatureza: 'Despesas Ocupação', naturezaOperacao: 'Material Escritório', empresa: '9F', periodo: '2024-05', ano: 2024 },
                { codigo: '423', descricao: 'ENCARGOS SOCIAIS', valor: 420000.00, dataPagamento: '2024-05-15', status: 'Pago', grupoNatureza: 'Despesas com Pessoal', naturezaOperacao: 'Encargos Sociais', empresa: '6F', periodo: '2024-05', ano: 2024 },

                // Dados adicionais para outros meses de 2024
                { codigo: '001', descricao: 'MATÉRIA PRIMA SANTOS', valor: 680000.00, dataPagamento: '2024-04-28', status: 'Pago', grupoNatureza: 'Compras', naturezaOperacao: 'Matéria Prima', empresa: '6F', periodo: '2024-04', ano: 2024 },
                { codigo: '002', descricao: 'COMISSÕES GERAIS', valor: 220000.00, dataPagamento: '2024-04-27', status: 'Pago', grupoNatureza: 'Despesas Comerciais', naturezaOperacao: 'Comissões', empresa: '8F', periodo: '2024-04', ano: 2024 },
                { codigo: '003', descricao: 'ENERGIA ELÉTRICA', valor: 78000.00, dataPagamento: '2024-03-26', status: 'Pago', grupoNatureza: 'Despesas Ocupação', naturezaOperacao: 'Energia Elétrica', empresa: '6F', periodo: '2024-03', ano: 2024 },
                { codigo: '004', descricao: 'SALÁRIOS E ORDENADOS', valor: 500000.00, dataPagamento: '2024-02-24', status: 'Pago', grupoNatureza: 'Despesas com Pessoal', naturezaOperacao: 'Salários', empresa: '6F', periodo: '2024-02', ano: 2024 },
                { codigo: '005', descricao: 'GASTOS DE FABRICAÇÃO', valor: 400000.00, dataPagamento: '2024-01-21', status: 'Pago', grupoNatureza: 'Compras', naturezaOperacao: 'Material Fabricação', empresa: '6F', periodo: '2024-01', ano: 2024 }
            ],
            emAberto: [
                // Jul 2024 (dados históricos como se fossem "em aberto" na época)
                { codigo: '506', descricao: 'MATÉRIA PRIMA SANTOS', valor: 750000.00, vencimento: '2024-07-15', status: 'Em Aberto', grupoNatureza: 'Compras', naturezaOperacao: 'Matéria Prima', empresa: '6F', periodo: '2024-07', ano: 2024 },
                { codigo: '507', descricao: 'COMISSÕES GERAIS', valor: 220000.00, vencimento: '2024-07-20', status: 'Em Aberto', grupoNatureza: 'Despesas Comerciais', naturezaOperacao: 'Comissões', empresa: '8F', periodo: '2024-07', ano: 2024 },
                { codigo: '508', descricao: 'ENERGIA ELÉTRICA', valor: 85000.00, vencimento: '2024-07-10', status: 'Em Aberto', grupoNatureza: 'Despesas Ocupação', naturezaOperacao: 'Energia Elétrica', empresa: '6F', periodo: '2024-07', ano: 2024 },
                { codigo: '509', descricao: 'SALÁRIOS E ORDENADOS', valor: 520000.00, vencimento: '2024-07-05', status: 'Em Aberto', grupoNatureza: 'Despesas com Pessoal', naturezaOperacao: 'Salários', empresa: '6F', periodo: '2024-07', ano: 2024 },
                
                // Ago 2024
                { codigo: '510', descricao: 'MATÉRIA PRIMA FORTALEZA', valor: 600000.00, vencimento: '2024-08-15', status: 'Em Aberto', grupoNatureza: 'Compras', naturezaOperacao: 'Matéria Prima', empresa: '8F', periodo: '2024-08', ano: 2024 },
                { codigo: '511', descricao: 'TELECOMUNICAÇÕES', valor: 42000.00, vencimento: '2024-08-10', status: 'Em Aberto', grupoNatureza: 'Despesas Ocupação', naturezaOperacao: 'Telefone', empresa: '6F', periodo: '2024-08', ano: 2024 },
                { codigo: '512', descricao: 'IMPOSTOS FEDERAIS', valor: 720000.00, vencimento: '2024-08-20', status: 'Em Aberto', grupoNatureza: 'Impostos', naturezaOperacao: 'Impostos Federais', empresa: '6F', periodo: '2024-08', ano: 2024 }
            ]
        }
    };

    // Dados para evolução mensal (por período) incluindo ano anterior
    const dadosEvolucaoPorPeriodo = {
        '2024-01': 1200000,
        '2024-02': 1800000,
        '2024-03': 2300000,
        '2024-04': 2850000,
        '2024-05': 3100000,
        '2024-06': 3200000,
        '2024-07': 2180000,
        '2024-08': 1650000,
        '2025-01': 3200000,
        '2025-02': 3523236,
        '2025-03': 4159838,
        '2025-04': 3432847,
        '2025-05': 4058127,
        '2025-06': 3568932,
        '2025-07': 2500000,
        '2025-08': 1800000
    };

    // Função para formatar valores monetários
    const formatarMoeda = (valor) => {
        if (!valor && valor !== 0) return 'R$ 0,00';
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(valor);
    };

    // Função para calcular variação percentual
    const calcularVariacao = (valorAtual, valorAnterior) => {
        if (!valorAnterior || valorAnterior === 0) return null;
        return ((valorAtual - valorAnterior) / valorAnterior * 100);
    };

    // Função para obter dados combinados (incluindo ano anterior)
    const obterDadosCombinados = () => {
        const dadosAtuais = filtroAtual === 'em-aberto' ? dadosOriginais.emAberto :
                           filtroAtual === 'pagas' ? dadosOriginais.pagas :
                           [...dadosOriginais.emAberto, ...dadosOriginais.pagas];
        
        const dadosAnoAnterior = filtroAtual === 'em-aberto' ? dadosOriginais.anoAnterior.emAberto :
                                filtroAtual === 'pagas' ? dadosOriginais.anoAnterior.pagas :
                                [...dadosOriginais.anoAnterior.emAberto, ...dadosOriginais.anoAnterior.pagas];

        return {
            atual: dadosAtuais,
            anterior: dadosAnoAnterior
        };
    };

    // Função para obter valores únicos para filtros
    const obterValoresUnicos = (campo) => {
        const todosOsDados = [...dadosOriginais.emAberto, ...dadosOriginais.pagas];
        return [...new Set(todosOsDados.map(item => item[campo]))].sort();
    };

    // Função para criar dropdowns de filtro
    const criarDropdownFiltro = (containerId, opcoes, campo) => {
        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = `
            <div class="custom-select-button text-xs border border-gray-300 rounded-md p-2 cursor-pointer">
                <span class="select-text">Todos</span>
                <svg class="w-4 h-4 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                </svg>
            </div>
            <div class="custom-select-options">
                ${opcoes.map(opcao => `
                    <label class="text-xs">
                        <input type="checkbox" value="${opcao}" data-campo="${campo}"> ${opcao}
                    </label>
                `).join('')}
            </div>
        `;

        // Event listeners
        const button = container.querySelector('.custom-select-button');
        const options = container.querySelector('.custom-select-options');
        const checkboxes = container.querySelectorAll('input[type="checkbox"]');

        button.addEventListener('click', () => {
            options.classList.toggle('show');
        });

        checkboxes.forEach(checkbox => {
            checkbox.addEventListener('change', () => {
                atualizarFiltro(campo);
                atualizarTextoDropdown(container, campo);
                atualizarVisualizacoes();
            });
        });

        // Fechar dropdown ao clicar fora
        document.addEventListener('click', (e) => {
            if (!container.contains(e.target)) {
                options.classList.remove('show');
            }
        });
    };

    // Função para atualizar filtro
    const atualizarFiltro = (campo) => {
        const checkboxes = document.querySelectorAll(`input[data-campo="${campo}"]:checked`);
        filtrosAtivos[campo] = Array.from(checkboxes).map(cb => cb.value);
    };

    // Função para atualizar texto do dropdown
    const atualizarTextoDropdown = (container, campo) => {
        const selectText = container.querySelector('.select-text');
        const selecionados = filtrosAtivos[campo];
        
        if (selecionados.length === 0) {
            selectText.textContent = 'Todos';
        } else if (selecionados.length === 1) {
            selectText.textContent = selecionados[0];
        } else {
            selectText.textContent = `${selecionados.length} selecionados`;
        }
    };

    // Função para obter dados filtrados (apenas ano atual)
    const obterDadosFiltrados = () => {
        let dados;
        
        // Filtro de status primeiro
        switch (filtroAtual) {
            case 'em-aberto':
                dados = [...dadosOriginais.emAberto];
                break;
            case 'pagas':
                dados = [...dadosOriginais.pagas];
                break;
            case 'todas':
                dados = [...dadosOriginais.emAberto, ...dadosOriginais.pagas];
                break;
            default:
                dados = [...dadosOriginais.emAberto];
        }

        // Aplicar outros filtros
        if (filtrosAtivos.natureza.length > 0) {
            dados = dados.filter(item => filtrosAtivos.natureza.includes(item.grupoNatureza));
        }
        
        if (filtrosAtivos.naturezaOperacao.length > 0) {
            dados = dados.filter(item => filtrosAtivos.naturezaOperacao.includes(item.naturezaOperacao));
        }
        
        if (filtrosAtivos.empresa.length > 0) {
            dados = dados.filter(item => filtrosAtivos.empresa.includes(item.empresa));
        }
        
        if (filtrosAtivos.dataInicio || filtrosAtivos.dataFim) {
            dados = dados.filter(item => {
                // Usar a data de vencimento ou pagamento para filtrar
                let dataItem;
                if (item.vencimento) {
                    dataItem = item.vencimento;
                } else if (item.dataPagamento) {
                    dataItem = item.dataPagamento;
                } else if (item.periodo) {
                    // Converter período YYYY-MM para uma data do primeiro dia do mês
                    const [ano, mes] = item.periodo.split('-');
                    dataItem = `${ano}-${mes}-01`;
                } else {
                    return true; // Se não há data, mantém o item
                }
                return dataEstaNoRange(dataItem, filtrosAtivos.dataInicio, filtrosAtivos.dataFim);
            });
        }

        return dados;
    };

    // Função para alternar filtro de status
    const alternarFiltro = (novoFiltro) => {
        filtroAtual = novoFiltro;
        
        // Resetar todos os botões para estado padrão
        document.querySelectorAll('[id^="filtro-"]').forEach(btn => {
            btn.classList.remove('active');
            btn.classList.add('text-gray-600');
            btn.style.backgroundColor = '';
            btn.style.color = '';
        });
        
        // Aplicar classe ativa para o botão selecionado
        const btnAtivo = document.getElementById(`filtro-${novoFiltro}`);
        if (btnAtivo) {
            btnAtivo.classList.remove('text-gray-600');
            btnAtivo.classList.add('active');
            // As cores são aplicadas via CSS usando a classe 'active'
        }

        atualizarVisualizacoes();
    };

    // Função para criar gráfico de evolução com comparação ano anterior
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
                                filtroAtual === 'pagas' ? dadosOriginais.anoAnterior.pagas :
                                [...dadosOriginais.anoAnterior.emAberto, ...dadosOriginais.anoAnterior.pagas];

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
                        display: true,
                        position: 'top'
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const valor = formatarMoeda(context.parsed.y);
                                const index = context.dataIndex;
                                const valorAtual = valores2025[index];
                                const valorAnterior = valores2024[index];
                                const variacao = calcularVariacao(valorAtual, valorAnterior);
                                
                                let tooltip = `${context.dataset.label}: ${valor}`;
                                if (variacao !== null && context.dataset.label.includes('2025')) {
                                    const sinal = variacao >= 0 ? '+' : '';
                                    tooltip += ` (${sinal}${variacao.toFixed(1)}% vs 2024)`;
                                }
                                return tooltip;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return 'R$ ' + (value / 1000000).toFixed(1) + 'M';
                            },
                            color: '#6b7280'
                        },
                        grid: { color: '#f3f4f6' }
                    },
                    x: {
                        ticks: { color: '#6b7280' },
                        grid: { display: false }
                    }
                }
            }
        });
    };

    // Função para criar gráfico de categorias com comparação
    const criarGraficoCategorias = () => {
        const ctx = document.getElementById('valores-categoria-chart');
        if (!ctx) return;

        if (valoresCategoriaChartInstance) {
            valoresCategoriaChartInstance.destroy();
        }

        const dadosFiltrados = obterDadosFiltrados();
        
        // Agrupar por grupo natureza - ano atual
        const dadosPorNatureza2025 = {};
        dadosFiltrados.forEach(item => {
            const natureza = item.grupoNatureza;
            if (!dadosPorNatureza2025[natureza]) {
                dadosPorNatureza2025[natureza] = 0;
            }
            dadosPorNatureza2025[natureza] += item.valor;
        });

        // Agrupar por grupo natureza - ano anterior
        const dadosAnoAnterior = filtroAtual === 'em-aberto' ? dadosOriginais.anoAnterior.emAberto :
                                filtroAtual === 'pagas' ? dadosOriginais.anoAnterior.pagas :
                                [...dadosOriginais.anoAnterior.emAberto, ...dadosOriginais.anoAnterior.pagas];

        const dadosPorNatureza2024 = {};
        dadosAnoAnterior.forEach(item => {
            const natureza = item.grupoNatureza;
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
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { 
                        display: true,
                        position: 'top'
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const valor = formatarMoeda(context.parsed.x);
                                const index = context.dataIndex;
                                const valorAtual = valores2025[index];
                                const valorAnterior = valores2024[index];
                                const variacao = calcularVariacao(valorAtual, valorAnterior);
                                
                                let tooltip = `${context.dataset.label}: ${valor}`;
                                if (variacao !== null && context.dataset.label.includes('2025')) {
                                    const sinal = variacao >= 0 ? '+' : '';
                                    tooltip += ` (${sinal}${variacao.toFixed(1)}% vs 2024)`;
                                }
                                return tooltip;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return 'R$ ' + (value / 1000000).toFixed(1) + 'M';
                            },
                            color: '#6b7280'
                        },
                        grid: { color: '#f3f4f6' }
                    },
                    y: {
                        ticks: { color: '#6b7280', font: { size: 10 } },
                        grid: { display: false }
                    }
                }
            }
        });
    };

    // Função para popular tabela (usa dados filtrados)
    const popularTabela = () => {
        const tbody = document.getElementById('detailed-table-body');
        if (!tbody) return;

        tbody.innerHTML = '';
        const dadosFiltrados = obterDadosFiltrados();

        dadosFiltrados.forEach(row => {
            const tr = document.createElement('tr');
            tr.className = 'border-b border-gray-100 hover:bg-gray-50 text-gray-700';
            
            let statusClass = 'bg-gray-100 text-gray-800';
            if (row.status === 'Pago') {
                statusClass = 'bg-green-100 text-green-800';
            } else if (row.status === 'Em Aberto') {
                statusClass = 'bg-red-100 text-red-800';
            }
            
            const dataFormatada = row.vencimento ? 
                new Date(row.vencimento).toLocaleDateString('pt-BR') :
                new Date(row.dataPagamento).toLocaleDateString('pt-BR');
            
            tr.innerHTML = `
                <td class="p-2 font-mono text-xs">${row.codigo}</td>
                <td class="p-2 text-xs font-medium">${row.descricao}</td>
                <td class="p-2 text-right text-xs font-mono">${formatarMoeda(row.valor)}</td>
                <td class="p-2 text-xs">${dataFormatada}</td>
                <td class="p-2 text-xs">${row.grupoNatureza}</td>
                <td class="p-2 text-xs">${row.empresa}</td>
                <td class="p-2 text-xs"><span class="px-2 py-1 ${statusClass} rounded-full text-xs">${row.status}</span></td>
            `;
            
            tbody.appendChild(tr);
        });

        // Atualizar cabeçalho da tabela
        const thead = tbody.parentElement.querySelector('thead tr');
        if (thead) {
            thead.innerHTML = `
                <th class="p-2 text-left font-medium w-16">Código</th>
                <th class="p-2 text-left font-medium min-w-[200px]">Descrição</th>
                <th class="p-2 text-right font-medium w-32">Valor</th>
                <th class="p-2 text-left font-medium w-24">Data</th>
                <th class="p-2 text-left font-medium w-32">Natureza</th>
                <th class="p-2 text-left font-medium w-20">Empresa</th>
                <th class="p-2 text-left font-medium w-24">Status</th>
            `;
        }
    };

    // Função para popular painel lateral (sempre mostra pagas)
    const popularPainelLateral = () => {
        const container = document.getElementById('transacoes-recentes-container');
        if (!container) return;

        container.innerHTML = '';

        dadosOriginais.pagas.slice(0, 5).forEach(transacao => {
            const item = document.createElement('div');
            item.className = 'p-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer';
            
            item.innerHTML = `
                <div class="flex justify-between items-start mb-1">
                    <span class="text-xs font-medium text-gray-800 line-clamp-1">${transacao.descricao}</span>
                    <span class="text-xs font-bold text-green-600">${formatarMoeda(transacao.valor)}</span>
                </div>
                <div class="text-xs text-gray-600 mb-1">${transacao.grupoNatureza} - ${transacao.empresa}</div>
                <div class="flex justify-between items-center">
                    <span class="text-xs text-gray-500">${new Date(transacao.dataPagamento).toLocaleDateString('pt-BR')}</span>
                    <span class="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">${transacao.status}</span>
                </div>
            `;
            
            container.appendChild(item);
        });
    };

    // Função para criar KPIs com comparação ano anterior
    const criarKPIs = () => {
        const container = document.getElementById('kpi-container');
        if (!container) return;

        const dadosFiltrados = obterDadosFiltrados();
        const totalValor2025 = dadosFiltrados.reduce((acc, item) => acc + item.valor, 0);
        const mediaValor2025 = dadosFiltrados.length > 0 ? totalValor2025 / dadosFiltrados.length : 0;
        const totalRegistros = dadosFiltrados.length;

        // Calcular dados do ano anterior para comparação
        const dadosAnoAnterior = filtroAtual === 'em-aberto' ? dadosOriginais.anoAnterior.emAberto :
                                filtroAtual === 'pagas' ? dadosOriginais.anoAnterior.pagas :
                                [...dadosOriginais.anoAnterior.emAberto, ...dadosOriginais.anoAnterior.pagas];
        const totalValor2024 = dadosAnoAnterior.reduce((acc, item) => acc + item.valor, 0);
        
        const variacaoTotal = calcularVariacao(totalValor2025, totalValor2024);

        const kpis = [
            {
                titulo: 'Total Saídas',
                valor: formatarMoeda(totalValor2025),
                variacao: variacaoTotal,
                icone: 'M19.5 12h-15',
                status: 'error', // Vermelho para saídas (pagamentos)
                tipo: 'monetary-negative'
            },
            {
                titulo: 'Registros',
                valor: totalRegistros.toString(),
                variacao: null,
                icone: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
                status: 'info'
            },
            {
                titulo: 'Valor Médio',
                valor: formatarMoeda(mediaValor2025),
                variacao: null,
                icone: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6',
                status: 'info'
            },
            {
                titulo: 'Status',
                valor: filtroAtual === 'em-aberto' ? 'Em Aberto' : 
                       filtroAtual === 'pagas' ? 'Pagas' : 'Todas',
                variacao: null,
                icone: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
                status: filtroAtual === 'pagas' ? 'success' : 
                        filtroAtual === 'em-aberto' ? 'warning' : 'info'
            }
        ];

        container.innerHTML = kpis.map(kpi => {
            let variacaoHtml = '';
            if (kpi.variacao !== null) {
                const sinal = kpi.variacao >= 0 ? '+' : '';
                const variacaoClass = kpi.variacao >= 0 ? 'positive' : 'negative';
                const iconeVariacao = kpi.variacao >= 0 ? 
                    '<svg class="kpi-variation-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path></svg>' :
                    '<svg class="kpi-variation-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6"></path></svg>';
                
                variacaoHtml = `
                    <div class="kpi-variation ${variacaoClass}">
                        ${iconeVariacao}
                        <span>${sinal}${kpi.variacao.toFixed(1)}% vs 2024</span>
                    </div>
                `;
            }
            
            const valorClass = kpi.tipo === 'monetary-negative' ? 'currency-negative' : 
                              kpi.tipo === 'monetary-positive' ? 'currency-positive' : '';
            
            return `
                <div class="kpi-modern kpi-status-${kpi.status}">
                    <div class="kpi-header">
                        <p class="kpi-label">${kpi.titulo}</p>
                        <svg class="kpi-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="${kpi.icone}"></path>
                        </svg>
                    </div>
                    <p class="kpi-value ${valorClass}">${kpi.valor}</p>
                    ${variacaoHtml}
                </div>
            `;
        }).join('');

        // Atualizar contador de registros
        const totalRegistrosEl = document.getElementById('total-registros');
        if (totalRegistrosEl) {
            totalRegistrosEl.textContent = `${totalRegistros} registros encontrados`;
        }
    };

    // Função para mostrar filtros ativos
    const mostrarFiltrosAtivos = () => {
        const container = document.getElementById('active-filters-container');
        if (!container) return;

        container.innerHTML = '';

        // Adicionar pills dos filtros ativos
        Object.keys(filtrosAtivos).forEach(campo => {
            // Verificar se é um array e se tem elementos
            if (Array.isArray(filtrosAtivos[campo]) && filtrosAtivos[campo].length > 0) {
                filtrosAtivos[campo].forEach(valor => {
                    const pill = document.createElement('div');
                    pill.className = 'filter-pill';
                    pill.innerHTML = `
                        ${valor}
                        <button onclick="removerFiltro('${campo}', '${valor}')">×</button>
                    `;
                    container.appendChild(pill);
                });
            }
        });

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
            
            const pill = document.createElement('div');
            pill.className = 'filter-pill';
            pill.innerHTML = `
                ${label}
                <button onclick="removerFiltro('periodo', '')">×</button>
            `;
            container.appendChild(pill);
        }
    };

    // Função para remover filtro específico
    window.removerFiltro = (campo, valor) => {
        if (campo === 'periodo') {
            filtrosAtivos.dataInicio = '';
            filtrosAtivos.dataFim = '';
            const dataInicioInput = document.getElementById('data-inicio-filter');
            const dataFimInput = document.getElementById('data-fim-filter');
            if (dataInicioInput) dataInicioInput.value = '';
            if (dataFimInput) dataFimInput.value = '';
        } else {
            const index = filtrosAtivos[campo].indexOf(valor);
            if (index > -1) {
                filtrosAtivos[campo].splice(index, 1);
            }
            
            // Desmarcar checkbox correspondente
            const checkbox = document.querySelector(`input[data-campo="${campo}"][value="${valor}"]`);
            if (checkbox) {
                checkbox.checked = false;
                const container = checkbox.closest('[id$="-container"]');
                if (container) {
                    atualizarTextoDropdown(container, campo);
                }
            }
        }
        
        atualizarVisualizacoes();
    };

    // Função para atualizar todas as visualizações
    const atualizarVisualizacoes = () => {
        criarKPIs();
        criarGraficoEvolucao();
        criarGraficoCategorias();
        popularTabela();
        popularPainelLateral();
        mostrarFiltrosAtivos();
    };

    // Função de inicialização
    const inicializar = () => {
        // Inicializar filtros de data com valores padrão
        const dataInicioInput = document.getElementById('data-inicio-filter');
        const dataFimInput = document.getElementById('data-fim-filter');
        if (dataInicioInput && dataInicioInput.value) {
            filtrosAtivos.dataInicio = dataInicioInput.value;
        }
        if (dataFimInput && dataFimInput.value) {
            filtrosAtivos.dataFim = dataFimInput.value;
        }
        
        // Criar dropdowns de filtro
        criarDropdownFiltro('natureza-filter-container', obterValoresUnicos('grupoNatureza'), 'natureza');
        criarDropdownFiltro('natureza-operacao-filter-container', obterValoresUnicos('naturezaOperacao'), 'naturezaOperacao');
        criarDropdownFiltro('empresa-filter-container', obterValoresUnicos('empresa'), 'empresa');

        // Event listeners para filtros de data
        const dataInicioFilter = document.getElementById('data-inicio-filter');
        const dataFimFilter = document.getElementById('data-fim-filter');
        
        if (dataInicioFilter) {
            dataInicioFilter.addEventListener('change', (e) => {
                filtrosAtivos.dataInicio = e.target.value;
                atualizarVisualizacoes();
            });
        }
        
        if (dataFimFilter) {
            dataFimFilter.addEventListener('change', (e) => {
                filtrosAtivos.dataFim = e.target.value;
                atualizarVisualizacoes();
            });
        }

        // Event listeners para os botões de filtro de status
        document.getElementById('filtro-em-aberto')?.addEventListener('click', () => alternarFiltro('em-aberto'));
        document.getElementById('filtro-pagas')?.addEventListener('click', () => alternarFiltro('pagas'));
        document.getElementById('filtro-todas')?.addEventListener('click', () => alternarFiltro('todas'));
        
        // Botão de limpar filtros
        document.getElementById('clear-filters-btn')?.addEventListener('click', () => {
            // Limpar todos os filtros
            filtrosAtivos = {
                natureza: [],
                naturezaOperacao: [],
                empresa: [],
                dataInicio: '',
                dataFim: ''
            };
            
            // Desmarcar todos os checkboxes
            document.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = false);
            
            // Resetar dropdowns
            document.querySelectorAll('.select-text').forEach(el => el.textContent = 'Todos');
            
            // Limpar campos de data
            const dataInicioInput = document.getElementById('data-inicio-filter');
            const dataFimInput = document.getElementById('data-fim-filter');
            if (dataInicioInput) dataInicioInput.value = '';
            if (dataFimInput) dataFimInput.value = '';
            
            // Voltar para filtro padrão com cor correta
            alternarFiltro('em-aberto');
        });
        
        // Inicializar
        atualizarVisualizacoes();
    };

    // Inicializar quando o DOM estiver carregado
    inicializar();
});
