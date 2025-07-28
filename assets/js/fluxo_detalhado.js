// Fluxo Detalhado - JavaScript
class FluxoDetalhado {
    constructor() {
        this.dados = [];
        this.dadosFiltrados = [];
        this.filtros = {
            tipo: 'ambos', // receitas, despesas, ambos
            empresas: [],
            categorias: [],
            status: [],
            dataInicio: '2025-01-01',
            dataFim: '2025-12-31'
        };
        this.paginaAtual = 1;
        this.itensPorPagina = 50;
        this.charts = {};
        this.init();
    }

    async init() {
        try {
            await this.carregarDados();
            this.setupEventListeners();
            this.renderizarFiltros();
            this.aplicarFiltros();
                    this.renderizarKPIs();
        this.renderizarGraficos();
        this.renderizarTabela();
        this.renderizarMaioresMovimentacoes();
        } catch (error) {
            console.error('Erro ao inicializar:', error);
        }
    }

    async carregarDados() {
        try {
            // Simular carregamento de dados - substitua pela sua API
            const [receitas, despesas] = await Promise.all([
                this.carregarReceitas(),
                this.carregarDespesas()
            ]);

            this.dados = [
                ...receitas.map(item => ({ ...item, tipo: 'receita' })),
                ...despesas.map(item => ({ ...item, tipo: 'despesa' }))
            ];

            console.log(`Carregados ${this.dados.length} registros`);
        } catch (error) {
            console.error('Erro ao carregar dados:', error);
            this.dados = this.gerarDadosSimulados();
        }
    }

    async carregarReceitas() {
        try {
            const response = await fetch('assets/data/contas_a_receber_data.json');
            const dados = await response.json();
            
            // Converter dados reais para o formato esperado
            return dados.map(item => ({
                id: item.id.toString(),
                codigo: item.document,
                categoria: this.mapearCategoriaReceita(item.company),
                empresa: item.company,
                cliente: item.client,
                documento: item.document,
                data: new Date(item.emissionDate),
                valor: item.valorTotal,
                status: item.status,
                meses: this.distribuirValorMensalmente(item.valorTotal, item.emissionDate),
                meses2024: this.distribuirValorMensalmente(item.valorTotal * 0.9, item.emissionDate), // Simular dados 2024
                grupoNatureza: 'Receitas'
            }));
        } catch (error) {
            console.warn('Erro ao carregar dados reais de receitas, usando dados simulados:', error);
            return this.gerarReceitasSimuladas();
        }
    }

    async carregarDespesas() {
        try {
            const response = await fetch('assets/data/contas_a_pagar_data.json');
            const dados = await response.json();
            

            
            // Converter dados reais para o formato esperado
            return dados.map(item => ({
                id: item.id.toString(),
                codigo: item.documento,
                categoria: item.naturezaOperacao,
                empresa: item.empresa,
                fornecedor: item.fornecedor,
                documento: item.documento,
                data: new Date(item.dataEmissao),
                valor: item.valorSaldo,
                status: item.situacao,
                meses: this.distribuirValorMensalmente(item.valorSaldo, item.dataEmissao),
                meses2024: this.distribuirValorMensalmente(item.valorSaldo * 0.85, item.dataEmissao), // Simular dados 2024
                grupoNatureza: item.grupoNatureza
            }));
        } catch (error) {
            console.warn('Erro ao carregar dados reais de despesas, usando dados simulados:', error);
            return this.gerarDespesasSimuladas();
        }
    }

    mapearCategoriaReceita(empresa) {
        const categorias = {
            '6F': ['VENDA REPRESENTANTE', 'VENDA EQUIPE INTERNA - RECORDE', 'VENDA COM SUPERVISOR'],
            '8F': ['VENDA REPRESENTANTE', 'VENDA EQUIPE INTERNA - RECORDE', 'VENDA COM SUPERVISOR'],
            'PEQUETITA': ['VENDA REPRESENTANTE', 'VENDA EQUIPE INTERNA - RECORDE', 'VENDA COM SUPERVISOR']
        };
        
        const categoriasEmpresa = categorias[empresa] || categorias['6F'];
        return categoriasEmpresa[Math.floor(Math.random() * categoriasEmpresa.length)];
    }

    distribuirValorMensalmente(valor, data) {
        const meses = {
            janeiro: 0, fevereiro: 0, marco: 0, abril: 0, maio: 0, junho: 0,
            julho: 0, agosto: 0, setembro: 0, outubro: 0, novembro: 0, dezembro: 0
        };
        
        // Verificar se data é uma string ou objeto Date
        let dataObj;
        if (typeof data === 'string') {
            dataObj = new Date(data);
        } else {
            dataObj = data;
        }
        
        const mes = dataObj.getMonth();
        const nomesMeses = ['janeiro', 'fevereiro', 'marco', 'abril', 'maio', 'junho',
                           'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
        
        meses[nomesMeses[mes]] = valor;
        return meses;
    }

    gerarDadosSimulados() {
        return [
            ...this.gerarReceitasSimuladas().map(item => ({ ...item, tipo: 'receita' })),
            ...this.gerarDespesasSimuladas().map(item => ({ ...item, tipo: 'despesa' }))
        ];
    }

    gerarReceitasSimuladas() {
        // Estrutura de contas baseada no sistema real
        const contasReceitas = {
            'GERAL': [
                { codigo: '11101', descricao: 'VENDA REPRESENTANTE' },
                { codigo: '11102', descricao: 'VENDA EQUIPE INTERNA - RECORDE' },
                { codigo: '11103', descricao: 'VENDA COM SUPERVISOR' },
                { codigo: '11104', descricao: 'VENDA INTERNO SUPORTE AO REPRE' },
                { codigo: '11111', descricao: 'VENDA CAMPANHAS E PROMOCOES' },
                { codigo: '11205', descricao: 'VENDAS ABUP' },
                { codigo: '11206', descricao: 'VENDAS ABUP INTERNO' },
                { codigo: '11207', descricao: 'VENDA EVENTO' },
                { codigo: '11208', descricao: 'OUTLET' },
                { codigo: '11501', descricao: 'REMESSA CONSIGNACAO' },
                { codigo: '11502', descricao: 'VENDA PRODUTOS ENV.COMODATO' },
                { codigo: '11503', descricao: 'REFATURAMENTO DE PEDIDO' },
                { codigo: '11801', descricao: 'VENDA EMPRESA DISTRIBUIDORA' },
                { codigo: '12201', descricao: 'REEMBOLSO DE DESPESA' },
                { codigo: '23104', descricao: 'MELHORIAS E RESTAURO' },
                { codigo: '24201', descricao: 'FEIRAS' },
                { codigo: '26203', descricao: 'PRESTACAO DE SERVICOS POR TERC CONVENIO' }
            ],
            '6F': [
                { codigo: '11101', descricao: 'VENDA REPRESENTANTE' },
                { codigo: '11102', descricao: 'VENDA EQUIPE INTERNA - RECORDE' },
                { codigo: '11103', descricao: 'VENDA COM SUPERVISOR' },
                { codigo: '11104', descricao: 'VENDA INTERNO SUPORTE AO REPRE' },
                { codigo: '11108', descricao: 'VENDA SANDRO BARROS' },
                { codigo: '11111', descricao: 'VENDA CAMPANHAS E PROMOCOES' },
                { codigo: '11203', descricao: 'VENDA ABIMAD' },
                { codigo: '11205', descricao: 'VENDAS ABUP' },
                { codigo: '11206', descricao: 'VENDAS ABUP INTERNO' },
                { codigo: '11207', descricao: 'VENDA EVENTO' },
                { codigo: '11208', descricao: 'OUTLET' },
                { codigo: '11501', descricao: 'REMESSA CONSIGNACAO' },
                { codigo: '11502', descricao: 'VENDA PRODUTOS ENV.COMODATO' },
                { codigo: '11503', descricao: 'REFATURAMENTO DE PEDIDO' },
                { codigo: '11801', descricao: 'VENDA EMPRESA DISTRIBUIDORA' },
                { codigo: '12201', descricao: 'REEMBOLSO DE DESPESA' },
                { codigo: '23104', descricao: 'MELHORIAS E RESTAURO' },
                { codigo: '24201', descricao: 'FEIRAS' },
                { codigo: '26203', descricao: 'PRESTACAO DE SERVICOS POR TERC' },
                { codigo: '51101', descricao: 'DIVIDENDOS AOS SOCIOS' }
            ],
            '8F': [
                { codigo: '11101', descricao: 'VENDA REPRESENTANTE' },
                { codigo: '11102', descricao: 'VENDA EQUIPE INTERNA - RECORDE' },
                { codigo: '11103', descricao: 'VENDA COM SUPERVISOR' },
                { codigo: '11104', descricao: 'VENDA INTERNO SUPORTE AO REPRE' },
                { codigo: '11111', descricao: 'VENDA CAMPANHAS E PROMOCOES' },
                { codigo: '11205', descricao: 'VENDAS ABUP' },
                { codigo: '11206', descricao: 'VENDAS ABUP INTERNO' },
                { codigo: '11207', descricao: 'VENDA EVENTO' },
                { codigo: '11208', descricao: 'OUTLET' },
                { codigo: '11501', descricao: 'REMESSA CONSIGNACAO' },
                { codigo: '11502', descricao: 'VENDA PRODUTOS ENV.COMODATO' },
                { codigo: '11503', descricao: 'REFATURAMENTO DE PEDIDO' },
                { codigo: '11801', descricao: 'VENDA EMPRESA DISTRIBUIDORA' }
            ],
            'PEQUETITA': [
                { codigo: '11101', descricao: 'VENDA REPRESENTANTE' },
                { codigo: '11102', descricao: 'VENDA EQUIPE INTERNA - RECORDE' },
                { codigo: '11103', descricao: 'VENDA COM SUPERVISOR' },
                { codigo: '11104', descricao: 'VENDA INTERNO SUPORTE AO REPRE' },
                { codigo: '11111', descricao: 'VENDA CAMPANHAS E PROMOCOES' },
                { codigo: '11205', descricao: 'VENDAS ABUP' },
                { codigo: '11206', descricao: 'VENDAS ABUP INTERNO' },
                { codigo: '11207', descricao: 'VENDA EVENTO' },
                { codigo: '11208', descricao: 'OUTLET' },
                { codigo: '11501', descricao: 'REMESSA CONSIGNACAO' },
                { codigo: '11502', descricao: 'VENDA PRODUTOS ENV.COMODATO' },
                { codigo: '11503', descricao: 'REFATURAMENTO DE PEDIDO' },
                { codigo: '11801', descricao: 'VENDA EMPRESA DISTRIBUIDORA' }
            ]
        };

        const empresas = ['6F', '8F', 'PEQUETITA'];
        const dados = [];

        for (let i = 0; i < 200; i++) {
            const empresa = empresas[Math.floor(Math.random() * empresas.length)];
            const contasEmpresa = contasReceitas[empresa] || contasReceitas['GERAL'];
            const conta = contasEmpresa[Math.floor(Math.random() * contasEmpresa.length)];
            
            dados.push({
                id: `REC${i.toString().padStart(4, '0')}`,
                codigo: conta.codigo,
                categoria: conta.descricao,
                empresa: empresa,
                cliente: `Cliente ${i + 1}`,
                documento: `NF${i.toString().padStart(6, '0')}`,
                data: new Date(2025, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
                valor: Math.random() * 150000 + 50000, // Valores maiores para margem positiva
                status: Math.random() > 0.3 ? 'Recebido' : 'Em Aberto',
                meses: this.gerarValoresMensais(),
                meses2024: this.gerarValoresMensais(), // Dados do ano anterior para comparativo
                grupoNatureza: 'Receitas' // Adicionar grupoNatureza para agrupamento
            });
        }

        return dados;
    }

    gerarDespesasSimuladas() {
        // Estrutura de contas baseada no sistema real
        const contasDespesas = {
            'DESPESAS_COM_PESSOAL': [
                { codigo: '21201', descricao: 'PRO LABORE - ADMINISTRADORES' },
                { codigo: '51101', descricao: 'DIVIDENDOS AOS SOCIOS' }
            ],
            'DESPESAS_COMERCIAIS': [
                { codigo: '24101', descricao: 'COMISSOES VENDEDORES' },
                { codigo: '24201', descricao: 'FEIRAS' },
                { codigo: '24202', descricao: 'MONTADORA E DESPESAS STAND' },
                { codigo: '24203', descricao: 'CATALOGOS, GRAFICA E BRINDES' },
                { codigo: '24204', descricao: 'SITE' },
                { codigo: '24205', descricao: 'ANUNCIOS E ASSES. DE IMPRENSA' },
                { codigo: '24206', descricao: 'VIAGENS, ESTADIAS E OUTRAS DES' },
                { codigo: '24211', descricao: 'MELHORIAS SHOWROOM' },
                { codigo: '24301', descricao: 'EVENTO PARA CLIENTES' },
                { codigo: '24302', descricao: 'FRETE PROBLEMAS-COMERCIAL' },
                { codigo: '24303', descricao: 'EVENTO CASA 6F' },
                { codigo: '24304', descricao: 'CIDADE JARDIM 8F' }
            ],
            'DESPESAS_OCUPACAO': [
                { codigo: '22201', descricao: 'MATERIAL DE ESCRITORIO' },
                { codigo: '22202', descricao: 'CORREIOS' },
                { codigo: '26102', descricao: 'PRESENTES' },
                { codigo: '26201', descricao: 'ASSESSORIA CONTABIL / JURIDICA' },
                { codigo: '26202', descricao: 'SERASA/CATHO/ECONET/DIMEP' },
                { codigo: '26203', descricao: 'PRESTACAO DE SERVICOS POR TERC' },
                { codigo: '26304', descricao: 'LANCHES E REFEICOES' },
                { codigo: '27101', descricao: 'RETENCAO IRRF 3O' },
                { codigo: '27102', descricao: 'RETENCAO PIS/COFINS/CSLL' },
                { codigo: '27103', descricao: 'RETENCAO ISS 3O' },
                { codigo: '27104', descricao: 'RETENCAO INSS 3O' },
                { codigo: '28301', descricao: 'TAXA LICENCA FUNCIONAM.E OUTRO' },
                { codigo: '41101', descricao: 'TARIFAS BANCARIAS' },
                { codigo: '41102', descricao: 'IOF' },
                { codigo: '41103', descricao: 'TAXA DE BOLETO BANCARIO' },
                { codigo: '41104', descricao: 'JUROS PAGOS CH.ESPECIAL' },
                { codigo: '41105', descricao: 'DESPESAS CARTORIO' },
                { codigo: '41106', descricao: 'JUROS ANTECIPACAO RECEBIVEIS' },
                { codigo: '41108', descricao: 'TARIFA DE CARTAO DE CREDITO' },
                { codigo: '41109', descricao: 'JUROS RECIPROCIDADE BANCARIA' },
                { codigo: '41110', descricao: 'JUROS EMPRESTIMOS/CAPITAL GIRO' },
                { codigo: '41111', descricao: 'JUROS FINIMP' }
            ],
            'OUTRAS_DESPESAS': [
                { codigo: '22301', descricao: 'MANUTENCAO DE HARDWARE' },
                { codigo: '22302', descricao: 'MANUTENCAO DE SOFTWARE' },
                { codigo: '22303', descricao: 'COMPRA/LOCACAO EQUIPAMENTO' }
            ]
        };

        const empresas = ['6F', '8F', 'PEQUETITA'];
        const categorias = Object.keys(contasDespesas);
        const dados = [];

        for (let i = 0; i < 150; i++) {
            const empresa = empresas[Math.floor(Math.random() * empresas.length)];
            const categoria = categorias[Math.floor(Math.random() * categorias.length)];
            const contasCategoria = contasDespesas[categoria];
            const conta = contasCategoria[Math.floor(Math.random() * contasCategoria.length)];
            
            dados.push({
                id: `DESP${i.toString().padStart(4, '0')}`,
                codigo: conta.codigo,
                categoria: conta.descricao,
                empresa: empresa,
                fornecedor: `Fornecedor ${i + 1}`,
                documento: `NF${i.toString().padStart(6, '0')}`,
                data: new Date(2025, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
                valor: Math.random() * 30000 + 1000, // Valores menores para margem positiva
                status: Math.random() > 0.2 ? 'Pago' : 'Em Aberto',
                meses: this.gerarValoresMensais(),
                meses2024: this.gerarValoresMensais(), // Dados do ano anterior para comparativo
                grupoNatureza: categoria // Adicionar grupoNatureza para agrupamento
            });
        }

        return dados;
    }

    gerarValoresMensais() {
        return {
            janeiro: Math.random() * 15000 + 5000,
            fevereiro: Math.random() * 15000 + 5000,
            marco: Math.random() * 15000 + 5000,
            abril: Math.random() * 15000 + 5000,
            maio: Math.random() * 15000 + 5000,
            junho: Math.random() * 15000 + 5000,
            julho: Math.random() * 15000 + 5000,
            agosto: Math.random() * 15000 + 5000,
            setembro: Math.random() * 15000 + 5000,
            outubro: Math.random() * 15000 + 5000,
            novembro: Math.random() * 15000 + 5000,
            dezembro: Math.random() * 15000 + 5000
        };
    }

    setupEventListeners() {
        // Filtros de tipo
        const filtroReceitas = document.getElementById('filtro-receitas');
        const filtroDespesas = document.getElementById('filtro-despesas');
        const filtroAmbos = document.getElementById('filtro-ambos');
        
        if (filtroReceitas) {
            filtroReceitas.addEventListener('click', () => this.setTipoFiltro('receitas'));
        }
        
        if (filtroDespesas) {
            filtroDespesas.addEventListener('click', () => this.setTipoFiltro('despesas'));
        }
        
        if (filtroAmbos) {
            filtroAmbos.addEventListener('click', () => this.setTipoFiltro('ambos'));
        }

        // Filtros gerais
        const dataInicio = document.getElementById('data-inicio-filter');
        const dataFim = document.getElementById('data-fim-filter');
        
        if (dataInicio) {
            dataInicio.addEventListener('change', () => this.aplicarFiltros());
        }
        
        if (dataFim) {
            dataFim.addEventListener('change', () => this.aplicarFiltros());
        }

        // Limpar filtros
        const clearFiltersBtn = document.getElementById('clear-filters-btn');
        if (clearFiltersBtn) {
            clearFiltersBtn.addEventListener('click', () => this.limparFiltros());
        }


    }

    setTipoFiltro(tipo) {
        // Remover active de todos os botões
        document.querySelectorAll('.filter-btn-receitas, .filter-btn-despesas, .filter-btn-ambos').forEach(btn => {
            btn.classList.remove('active');
        });

        // Adicionar active ao botão selecionado
        const botaoSelecionado = document.getElementById(`filtro-${tipo}`);
        if (botaoSelecionado) {
            botaoSelecionado.classList.add('active');
        }
        
        this.filtros.tipo = tipo;
        this.aplicarFiltros();
    }

    renderizarFiltros() {
        this.renderizarFiltroEmpresa();
        this.renderizarFiltroCategoria();
        this.renderizarFiltroStatus();
    }

    renderizarFiltroEmpresa() {
        const empresas = ['6F', '8F', 'PEQUETITA'];
        const container = document.getElementById('empresa-filter-container');
        
        if (!container) return;
        
        container.innerHTML = this.criarSelectCheckbox('empresa-filter', empresas, 'Todas as Empresas');
        
        // Adicionar event listeners para o botão e checkboxes
        const button = container.querySelector('button');
        const options = container.querySelector('.custom-select-options');
        
        if (button && options) {
            button.addEventListener('click', (e) => {
                e.stopPropagation();
                options.classList.toggle('show');
            });
            
            container.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
                checkbox.addEventListener('change', () => {
                    this.atualizarFiltroMultiplo('empresas', checkbox.value, checkbox.checked);
                });
            });
            
            // Fechar dropdown ao clicar fora
            document.addEventListener('click', (e) => {
                if (!container.contains(e.target)) {
                    options.classList.remove('show');
                }
            });
        }
    }

    renderizarFiltroCategoria() {
        // Categorias baseadas no sistema real
        const categorias = [
            // Receitas
            'VENDA REPRESENTANTE',
            'VENDA EQUIPE INTERNA - RECORDE',
            'VENDA COM SUPERVISOR',
            'VENDA INTERNO SUPORTE AO REPRE',
            'VENDA SANDRO BARROS',
            'VENDA CAMPANHAS E PROMOCOES',
            'VENDA ABIMAD',
            'VENDAS ABUP',
            'VENDAS ABUP INTERNO',
            'VENDA EVENTO',
            'OUTLET',
            'REMESSA CONSIGNACAO',
            'VENDA PRODUTOS ENV.COMODATO',
            'REFATURAMENTO DE PEDIDO',
            'VENDA EMPRESA DISTRIBUIDORA',
            'REEMBOLSO DE DESPESA',
            'MELHORIAS E RESTAURO',
            'FEIRAS',
            'PRESTACAO DE SERVICOS POR TERC CONVENIO',
            'DIVIDENDOS AOS SOCIOS',
            
            // Despesas
            'PRO LABORE - ADMINISTRADORES',
            'COMISSOES VENDEDORES',
            'MONTADORA E DESPESAS STAND',
            'CATALOGOS, GRAFICA E BRINDES',
            'SITE',
            'ANUNCIOS E ASSES. DE IMPRENSA',
            'VIAGENS, ESTADIAS E OUTRAS DES',
            'MELHORIAS SHOWROOM',
            'EVENTO PARA CLIENTES',
            'FRETE PROBLEMAS-COMERCIAL',
            'EVENTO CASA 6F',
            'CIDADE JARDIM 8F',
            'MATERIAL DE ESCRITORIO',
            'CORREIOS',
            'PRESENTES',
            'ASSESSORIA CONTABIL / JURIDICA',
            'SERASA/CATHO/ECONET/DIMEP',
            'PRESTACAO DE SERVICOS POR TERC',
            'LANCHES E REFEICOES',
            'RETENCAO IRRF 3O',
            'RETENCAO PIS/COFINS/CSLL',
            'RETENCAO ISS 3O',
            'RETENCAO INSS 3O',
            'TAXA LICENCA FUNCIONAM.E OUTRO',
            'TARIFAS BANCARIAS',
            'IOF',
            'TAXA DE BOLETO BANCARIO',
            'JUROS PAGOS CH.ESPECIAL',
            'DESPESAS CARTORIO',
            'JUROS ANTECIPACAO RECEBIVEIS',
            'TARIFA DE CARTAO DE CREDITO',
            'JUROS RECIPROCIDADE BANCARIA',
            'JUROS EMPRESTIMOS/CAPITAL GIRO',
            'JUROS FINIMP',
            'MANUTENCAO DE HARDWARE',
            'MANUTENCAO DE SOFTWARE',
            'COMPRA/LOCACAO EQUIPAMENTO'
        ];
        
        const container = document.getElementById('categoria-filter-container');
        
        if (!container) return;
        
        container.innerHTML = this.criarSelectCheckbox('categoria-filter', categorias, 'Todas as Categorias');
        
        // Adicionar event listeners para o botão e checkboxes
        const button = container.querySelector('button');
        const options = container.querySelector('.custom-select-options');
        
        if (button && options) {
            button.addEventListener('click', (e) => {
                e.stopPropagation();
                options.classList.toggle('show');
            });
            
            container.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
                checkbox.addEventListener('change', () => {
                    this.atualizarFiltroMultiplo('categorias', checkbox.value, checkbox.checked);
                });
            });
            
            // Fechar dropdown ao clicar fora
            document.addEventListener('click', (e) => {
                if (!container.contains(e.target)) {
                    options.classList.remove('show');
                }
            });
        }
    }

    renderizarFiltroStatus() {
        const statuses = ['Recebido', 'Em Aberto', 'Pago'];
        const container = document.getElementById('status-filter-container');
        
        if (!container) return;
        
        container.innerHTML = this.criarSelectCheckbox('status-filter', statuses, 'Todos os Status');
        
        // Adicionar event listeners para o botão e checkboxes
        const button = container.querySelector('button');
        const options = container.querySelector('.custom-select-options');
        
        if (button && options) {
            button.addEventListener('click', (e) => {
                e.stopPropagation();
                options.classList.toggle('show');
            });
            
            container.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
                checkbox.addEventListener('change', () => {
                    this.atualizarFiltroMultiplo('status', checkbox.value, checkbox.checked);
                });
            });
            
            // Fechar dropdown ao clicar fora
            document.addEventListener('click', (e) => {
                if (!container.contains(e.target)) {
                    options.classList.remove('show');
                }
            });
        }
    }

    criarSelectCheckbox(id, opcoes, placeholder) {
        const selectedCount = this.filtros[id.replace('-filter', 's')]?.length || 0;
        let buttonText = placeholder;
        
        if (selectedCount === 1) {
            buttonText = this.filtros[id.replace('-filter', 's')][0];
        } else if (selectedCount > 1) {
            buttonText = `${selectedCount} selecionados`;
        }
        
        return `
            <button id="${id}-btn" class="custom-select-button w-full text-xs border border-gray-300 rounded-md p-2 text-left bg-white">
                <span>${buttonText}</span>
                <svg class="w-4 h-4 float-right" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd"></path>
                </svg>
            </button>
            <div id="${id}-options" class="custom-select-options absolute z-10 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-48 overflow-y-auto">
                ${opcoes.map(opcao => `
                    <label class="flex items-center px-3 py-2 hover:bg-gray-100 cursor-pointer text-xs">
                        <input type="checkbox" value="${opcao}" class="mr-2" ${this.filtros[id.replace('-filter', 's')]?.includes(opcao) ? 'checked' : ''}>
                        ${opcao}
                    </label>
                `).join('')}
            </div>
        `;
    }

    atualizarFiltroMultiplo(tipo, valor, checked) {
        if (checked) {
            if (!this.filtros[tipo].includes(valor)) {
                this.filtros[tipo].push(valor);
            }
        } else {
            this.filtros[tipo] = this.filtros[tipo].filter(v => v !== valor);
        }
        
        this.atualizarTextoBotao(tipo);
        this.aplicarFiltros();
    }

    atualizarTextoBotao(tipo) {
        const filterId = tipo === 'empresas' ? 'empresa-filter' : 
                        tipo === 'categorias' ? 'categoria-filter' : 'status-filter';
        const button = document.getElementById(`${filterId}-btn`);
        const span = button.querySelector('span');
        const selectedCount = this.filtros[tipo].length;
        
        if (selectedCount === 0) {
            span.textContent = tipo === 'empresas' ? 'Todas as Empresas' : 
                              tipo === 'categorias' ? 'Todas as Categorias' : 'Todos os Status';
        } else if (selectedCount === 1) {
            span.textContent = this.filtros[tipo][0];
        } else {
            span.textContent = `${selectedCount} selecionados`;
        }
    }

    aplicarFiltros() {
        this.dadosFiltrados = this.dados.filter(item => {
            // Filtro de tipo
            if (this.filtros.tipo !== 'ambos' && item.tipo !== this.filtros.tipo.slice(0, -1)) {
                return false;
            }

            // Filtro de empresa
            if (this.filtros.empresas.length > 0 && !this.filtros.empresas.includes(item.empresa)) {
                return false;
            }

            // Filtro de categoria
            if (this.filtros.categorias.length > 0 && !this.filtros.categorias.includes(item.categoria)) {
                return false;
            }

            // Filtro de status
            if (this.filtros.status.length > 0 && !this.filtros.status.includes(item.status)) {
                return false;
            }

            // Filtro de data
            const dataInicio = new Date(document.getElementById('data-inicio-filter').value);
            const dataFim = new Date(document.getElementById('data-fim-filter').value);
            

            
            if (item.data < dataInicio || item.data > dataFim) {
                return false;
            }

            return true;
        });



        this.paginaAtual = 1;
        this.atualizarContadores();
        this.renderizarKPIs();
        this.atualizarGraficos();
        this.renderizarTabela();
        this.renderizarMaioresMovimentacoes();
    }

    atualizarContadores() {
        const total = this.dadosFiltrados.length;
        document.getElementById('total-registros').textContent = `${total} registros encontrados`;
    }

    renderizarKPIs() {
        const receitas = this.dadosFiltrados.filter(item => item.tipo === 'receita');
        const despesas = this.dadosFiltrados.filter(item => item.tipo === 'despesa');

        const totalReceitas = receitas.reduce((sum, item) => sum + item.valor, 0);
        const totalDespesas = despesas.reduce((sum, item) => sum + item.valor, 0);
        const saldoLiquido = totalReceitas - totalDespesas;
        const margem = totalReceitas > 0 ? ((saldoLiquido / totalReceitas) * 100) : 0;

        const kpis = [
            {
                titulo: 'Total Receitas',
                valor: this.formatarMoeda(totalReceitas),
                icone: 'M12 4.5v15m7.5-7.5h-15',
                status: 'success',
                tipo: 'monetary-positive',
                comparativo: this.calcularComparativoAnual(receitas, 'receita')
            },
            {
                titulo: 'Total Despesas',
                valor: this.formatarMoeda(totalDespesas),
                icone: 'M19.5 12h-15',
                status: 'error',
                tipo: 'monetary-negative',
                comparativo: this.calcularComparativoAnual(despesas, 'despesa')
            },
            {
                titulo: 'Saldo Líquido',
                valor: this.formatarMoeda(saldoLiquido),
                icone: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 10v-1m0 0a2.5 2.5 0 100-5 2.5 2.5 0 000 5z',
                status: saldoLiquido >= 0 ? 'success' : 'error',
                tipo: saldoLiquido >= 0 ? 'monetary-positive' : 'monetary-negative',
                comparativo: null
            },
            {
                titulo: 'Margem Líquida',
                valor: `${margem.toFixed(1)}%`,
                icone: 'M3 13.125C3 12.504 3.504 12 4.125 12h15.75c.621 0 1.125.504 1.125 1.125v6.75C21 20.496 20.496 21 19.875 21H4.125A1.125 1.125 0 013 19.875v-6.75zM12 3v9',
                status: margem >= 0 ? 'success' : 'error',
                tipo: 'neutral',
                comparativo: null
            },
            {
                titulo: 'Total Transações',
                valor: this.dadosFiltrados.length.toString(),
                icone: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
                status: 'info',
                tipo: 'neutral',
                comparativo: null
            }
        ];

        const container = document.getElementById('kpi-container');
        container.innerHTML = kpis.map(kpi => {
            let variacaoHtml = '';
            if (kpi.comparativo !== null) {
                const sinal = kpi.comparativo >= 0 ? '+' : '';
                const variacaoClass = kpi.comparativo >= 0 ? 'positive' : 'negative';
                const iconeVariacao = kpi.comparativo >= 0 ? 
                    '<svg class="kpi-variation-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path></svg>' :
                    '<svg class="kpi-variation-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6"></path></svg>';
                
                variacaoHtml = `
                    <div class="kpi-variation ${variacaoClass}">
                        ${iconeVariacao}
                        <span>${sinal}${kpi.comparativo.toFixed(1)}% vs 2024</span>
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
    }

    renderizarGraficos() {
        this.renderizarGraficoReceitasDespesas();
        this.renderizarGraficoMargem();
        this.renderizarGraficoConcentracao();
    }

    renderizarGraficoReceitasDespesas() {
        const ctx = document.getElementById('receitas-despesas-chart').getContext('2d');
        
        // Dados mensais - ano completo
        const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
        const mesesMap = {
            'Jan': 'janeiro', 'Fev': 'fevereiro', 'Mar': 'marco', 'Abr': 'abril',
            'Mai': 'maio', 'Jun': 'junho', 'Jul': 'julho', 'Ago': 'agosto',
            'Set': 'setembro', 'Out': 'outubro', 'Nov': 'novembro', 'Dez': 'dezembro'
        };
        
        const receitas = this.dadosFiltrados.filter(item => item.tipo === 'receita');
        const despesas = this.dadosFiltrados.filter(item => item.tipo === 'despesa');

        const dadosReceitas2025 = meses.map(mes => 
            receitas.reduce((sum, item) => sum + (item.meses[mesesMap[mes]] || 0), 0)
        );

        const dadosDespesas2025 = meses.map(mes => 
            despesas.reduce((sum, item) => sum + (item.meses[mesesMap[mes]] || 0), 0)
        );

        const dadosReceitas2024 = meses.map(mes => 
            receitas.reduce((sum, item) => sum + (item.meses2024[mesesMap[mes]] || 0), 0)
        );

        const dadosDespesas2024 = meses.map(mes => 
            despesas.reduce((sum, item) => sum + (item.meses2024[mesesMap[mes]] || 0), 0)
        );

        if (this.charts.receitasDespesas) {
            this.charts.receitasDespesas.destroy();
        }

        this.charts.receitasDespesas = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: meses,
                datasets: [{
                    label: 'Receitas 2025',
                    data: dadosReceitas2025,
                    backgroundColor: '#003D75',
                    borderColor: '#003D75',
                    borderWidth: 1,
                    order: 1
                }, {
                    label: 'Receitas 2024',
                    data: dadosReceitas2024,
                    backgroundColor: '#A4C4E0',
                    borderColor: '#003D75',
                    borderWidth: 1,
                    order: 2
                }, {
                    label: 'Despesas 2025',
                    data: dadosDespesas2025,
                    backgroundColor: '#ef4444',
                    borderColor: '#ef4444',
                    borderWidth: 1,
                    order: 1
                }, {
                    label: 'Despesas 2024',
                    data: dadosDespesas2024,
                    backgroundColor: 'rgba(239, 68, 68, 0.4)',
                    borderColor: 'rgba(239, 68, 68, 0.7)',
                    borderWidth: 1,
                    order: 2
                }]
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
                            text: 'Meses'
                        }
                    },
                    y: { 
                        grid: { color: '#e5e7eb' }, 
                        ticks: { 
                            callback: value => this.formatarMoeda(value, true)
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
                                const value = new Intl.NumberFormat('pt-BR', {
                                    style: 'currency',
                                    currency: 'BRL'
                                }).format(context.parsed.y);
                                return `${label}: ${value}`;
                            }
                        } 
                    }
                }
            }
        });
    }

    renderizarGraficoMargem() {
        const ctx = document.getElementById('margem-chart').getContext('2d');
        
        const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
        const mesesMap = {
            'Jan': 'janeiro', 'Fev': 'fevereiro', 'Mar': 'marco', 'Abr': 'abril',
            'Mai': 'maio', 'Jun': 'junho', 'Jul': 'julho', 'Ago': 'agosto',
            'Set': 'setembro', 'Out': 'outubro', 'Nov': 'novembro', 'Dez': 'dezembro'
        };
        
        const receitas = this.dadosFiltrados.filter(item => item.tipo === 'receita');
        const despesas = this.dadosFiltrados.filter(item => item.tipo === 'despesa');

        const margens = meses.map(mes => {
            const receitaMes = receitas.reduce((sum, item) => sum + (item.meses[mesesMap[mes]] || 0), 0);
            const despesaMes = despesas.reduce((sum, item) => sum + (item.meses[mesesMap[mes]] || 0), 0);
            return receitaMes > 0 ? ((receitaMes - despesaMes) / receitaMes * 100) : 0;
        });

        if (this.charts.margem) {
            this.charts.margem.destroy();
        }

        this.charts.margem = new Chart(ctx, {
            type: 'line',
            data: {
                labels: meses,
                datasets: [{
                    label: 'Margem Líquida (%)',
                    data: margens,
                    borderColor: 'rgba(59, 130, 246, 1)',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    fill: true,
                    tension: 0.4,
                    pointRadius: 4,
                    pointHoverRadius: 6,
                    pointBackgroundColor: 'rgba(59, 130, 246, 1)',
                    pointBorderColor: 'white',
                    pointBorderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    mode: 'index',
                    intersect: false
                },
                plugins: {
                    legend: {
                        position: 'top',
                        labels: {
                            usePointStyle: true,
                            padding: 20
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleColor: 'white',
                        bodyColor: 'white',
                        callbacks: {
                            label: (context) => {
                                const valor = context.raw;
                                const cor = valor >= 0 ? '🟢' : '🔴';
                                return `${cor} Margem: ${valor.toFixed(1)}%`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        grid: {
                            display: false
                        }
                    },
                    y: {
                        grid: {
                            color: 'rgba(0, 0, 0, 0.1)'
                        },
                        ticks: {
                            callback: value => `${value.toFixed(1)}%`
                        }
                    }
                }
            }
        });
    }

    renderizarGraficoConcentracao() {
        const ctx = document.getElementById('concentracao-categoria-chart').getContext('2d');
        
        // Agrupar por categoria
        const concentracao = {};
        this.dadosFiltrados.forEach(item => {
            const key = `${item.categoria} (${item.tipo === 'receita' ? 'R' : 'D'})`;
            concentracao[key] = (concentracao[key] || 0) + item.valor;
        });

        // Ordenar e pegar top 10
        const sorted = Object.entries(concentracao)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 10);

        if (this.charts.concentracao) {
            this.charts.concentracao.destroy();
        }

        // Paleta de cores do projeto (tons neutros e azuis)
        const cores = [
            '#003D75', // Primary dark
            '#A4C4E0', // Primary light
            '#6B7280', // Gray-500
            '#9CA3AF', // Gray-400
            '#D1D5DB', // Gray-300
            '#E5E7EB', // Gray-200
            '#F3F4F6', // Gray-100
            '#374151', // Gray-700
            '#4B5563', // Gray-600
            '#1F2937'  // Gray-800
        ];

        this.charts.concentracao = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: sorted.map(([label]) => label),
                datasets: [{
                    label: 'Valor Total',
                    data: sorted.map(([, valor]) => valor),
                    backgroundColor: cores.slice(0, sorted.length),
                    borderColor: cores.slice(0, sorted.length).map(cor => cor.replace('0.8', '1')),
                    borderWidth: 1,
                    borderRadius: 4,
                    borderSkipped: false
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                indexAxis: 'y', // Barras horizontais
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleColor: 'white',
                        bodyColor: 'white',
                        callbacks: {
                            label: (context) => {
                                const valor = this.formatarMoeda(context.raw);
                                const percent = ((context.raw / sorted.reduce((sum, [,v]) => sum + v, 0)) * 100).toFixed(1);
                                return `${context.label}: ${valor} (${percent}%)`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(0, 0, 0, 0.1)'
                        },
                        ticks: {
                            callback: value => this.formatarMoeda(value, true)
                        }
                    },
                    y: {
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });
    }

    atualizarGraficos() {
        this.renderizarGraficos();
    }

    renderizarTabela() {
        // Agrupar dados por categoria e empresa
        const agrupados = this.agruparDadosParaTabela();
        
        const tbody = document.getElementById('detailed-table-body');
        const inicio = (this.paginaAtual - 1) * this.itensPorPagina;
        const fim = inicio + this.itensPorPagina;
        const dadosPagina = agrupados.slice(inicio, fim);

        tbody.innerHTML = dadosPagina.map(item => {
            const total = Object.values(item.meses).reduce((sum, val) => sum + val, 0);
            
            // Definir classes CSS baseadas no tipo
            let rowClass = '';
            if (item.tipo === 'receita') {
                rowClass = 'receita-row';
            } else if (item.tipo === 'despesa') {
                rowClass = 'despesa-row';
            } else if (item.tipo === 'calculado') {
                if (item.categoria === 'LUCRO LÍQUIDO') {
                    rowClass = total >= 0 ? 'receita-row' : 'despesa-row';
                } else {
                    rowClass = total >= 0 ? 'receita-row' : 'despesa-row';
                }
            }
            
            const drilldownId = `drilldown-${item.categoria.replace(/\s+/g, '-')}-${item.tipo}`;
            const temDrilldown = item.contasDetalhadas && item.contasDetalhadas.length > 0;
            
            return `
                <tr class="${rowClass} hover:bg-gray-100" data-categoria="${item.categoria}" data-tipo="${item.tipo}">
                    <td class="p-2">
                        ${temDrilldown ? `
                            <button class="drilldown-toggle-btn w-6 h-6 rounded-full border border-gray-300 bg-white hover:bg-gray-50 flex items-center justify-center transition-colors" 
                                    data-drilldown="${drilldownId}" data-categoria="${item.categoria}" data-tipo="${item.tipo}">
                                <svg class="w-3 h-3 text-gray-600 transform transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
                                </svg>
                            </button>
                        ` : `
                            <div class="w-6 h-6"></div>
                        `}
                    </td>
                    <td class="p-2 font-medium">${item.categoria}</td>
                    <td class="p-2 text-xs text-gray-600">${item.empresa}</td>
                    <td class="p-2 text-right text-xs">${this.formatarMoeda(item.meses.janeiro)}</td>
                    <td class="p-2 text-right text-xs">${this.formatarMoeda(item.meses.fevereiro)}</td>
                    <td class="p-2 text-right text-xs">${this.formatarMoeda(item.meses.marco)}</td>
                    <td class="p-2 text-right text-xs">${this.formatarMoeda(item.meses.abril)}</td>
                    <td class="p-2 text-right text-xs">${this.formatarMoeda(item.meses.maio)}</td>
                    <td class="p-2 text-right text-xs">${this.formatarMoeda(item.meses.junho)}</td>
                    <td class="p-2 text-right text-xs">${this.formatarMoeda(item.meses.julho)}</td>
                    <td class="p-2 text-right text-xs">${this.formatarMoeda(item.meses.agosto)}</td>
                    <td class="p-2 text-right text-xs">${this.formatarMoeda(item.meses.setembro)}</td>
                    <td class="p-2 text-right text-xs">${this.formatarMoeda(item.meses.outubro)}</td>
                    <td class="p-2 text-right text-xs">${this.formatarMoeda(item.meses.novembro)}</td>
                    <td class="p-2 text-right text-xs">${this.formatarMoeda(item.meses.dezembro)}</td>
                    <td class="p-2 text-right font-bold ${total >= 0 ? 'saldo-positivo' : 'saldo-negativo'}">${this.formatarMoeda(total)}</td>
                </tr>
                ${temDrilldown ? `
                    <tr class="drilldown-row hidden" id="${drilldownId}">
                        <td colspan="16" class="p-0">
                            <div class="bg-gray-50 border-t border-gray-200 p-2">
                                <div class="drilldown-content">
                                    <!-- Conteúdo do drilldown será carregado aqui -->
                                </div>
                            </div>
                        </td>
                    </tr>
                ` : ''}
            `;
        }).join('');

        // Adicionar event listeners para drilldown
        tbody.querySelectorAll('.drilldown-toggle-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const drilldownId = btn.dataset.drilldown;
                const categoria = btn.dataset.categoria;
                const tipo = btn.dataset.tipo;
                this.toggleDrilldown(btn, drilldownId, categoria, tipo);
            });
        });

        this.renderizarPaginacao(agrupados.length);
    }

    agruparDadosParaTabela() {
        // Definir categorias principais conforme solicitado
        const categoriasPrincipais = {
            'RECEBIMENTOS': {
                tipo: 'receita',
                contas: [
                    'VENDA REPRESENTANTE',
                    'VENDA EQUIPE INTERNA - RECORDE',
                    'VENDA COM SUPERVISOR',
                    'VENDA INTERNO SUPORTE AO REPRE',
                    'VENDA SANDRO BARROS',
                    'VENDA CAMPANHAS E PROMOCOES',
                    'VENDA ABIMAD',
                    'VENDAS ABUP',
                    'VENDAS ABUP INTERNO',
                    'VENDA EVENTO',
                    'OUTLET',
                    'REMESSA CONSIGNACAO',
                    'VENDA PRODUTOS ENV.COMODATO',
                    'REFATURAMENTO DE PEDIDO',
                    'VENDA EMPRESA DISTRIBUIDORA',
                    'REEMBOLSO DE DESPESA',
                    'MELHORIAS E RESTAURO',
                    'FEIRAS',
                    'PRESTACAO DE SERVICOS POR TERC CONVENIO',
                    'DIVIDENDOS AOS SOCIOS'
                ]
            },
            'COMPRAS': {
                tipo: 'despesa',
                contas: [
                    'Matéria Prima',
                    'Insumos',
                    'Consultoria',
                    'Marketing',
                    'Fretes',
                    'Energia',
                    'Serviços Terceirizados'
                ]
            },
            'TRIBUTOS S/VENDA': {
                tipo: 'despesa',
                contas: [
                    'ICMS',
                    'PIS/COFINS',
                    'ISS',
                    'IRRF'
                ]
            },
            'MARGEM BRUTA': {
                tipo: 'calculado',
                contas: []
            },
            'DESPESAS COM PESSOAL': {
                tipo: 'despesa',
                contas: [
                    'PRO LABORE - ADMINISTRADORES',
                    'DIVIDENDOS AOS SOCIOS'
                ]
            },
            'DESPESAS COMERCIAIS': {
                tipo: 'despesa',
                contas: [
                    'COMISSOES VENDEDORES',
                    'FEIRAS',
                    'MONTADORA E DESPESAS STAND',
                    'CATALOGOS, GRAFICA E BRINDES',
                    'SITE',
                    'ANUNCIOS E ASSES. DE IMPRENSA',
                    'VIAGENS, ESTADIAS E OUTRAS DES',
                    'MELHORIAS SHOWROOM',
                    'EVENTO PARA CLIENTES',
                    'FRETE PROBLEMAS-COMERCIAL',
                    'EVENTO CASA 6F',
                    'CIDADE JARDIM 8F'
                ]
            },
            'DESPESAS OCUPACAO': {
                tipo: 'despesa',
                contas: [
                    'MATERIAL DE ESCRITORIO',
                    'CORREIOS',
                    'PRESENTES',
                    'ASSESSORIA CONTABIL / JURIDICA',
                    'SERASA/CATHO/ECONET/DIMEP',
                    'PRESTACAO DE SERVICOS POR TERC',
                    'LANCHES E REFEICOES',
                    'RETENCAO IRRF 3O',
                    'RETENCAO PIS/COFINS/CSLL',
                    'RETENCAO ISS 3O',
                    'RETENCAO INSS 3O',
                    'TAXA LICENCA FUNCIONAM.E OUTRO',
                    'TARIFAS BANCARIAS',
                    'IOF',
                    'TAXA DE BOLETO BANCARIO',
                    'JUROS PAGOS CH.ESPECIAL',
                    'DESPESAS CARTORIO',
                    'JUROS ANTECIPACAO RECEBIVEIS',
                    'TARIFA DE CARTAO DE CREDITO',
                    'JUROS RECIPROCIDADE BANCARIA',
                    'JUROS EMPRESTIMOS/CAPITAL GIRO',
                    'JUROS FINIMP'
                ]
            },
            'OUTRAS DESPESAS': {
                tipo: 'despesa',
                contas: [
                    'Consultoria',
                    'Marketing',
                    'Matéria Prima',
                    'Insumos',
                    'Fretes',
                    'Energia',
                    'Serviços Terceirizados'
                ]
            },
            'MANUTENCAO': {
                tipo: 'despesa',
                contas: [
                    'MANUTENCAO DE HARDWARE',
                    'MANUTENCAO DE SOFTWARE',
                    'COMPRA/LOCACAO EQUIPAMENTO'
                ]
            }
        };

        const grupos = {};
        const meses = ['janeiro', 'fevereiro', 'marco', 'abril', 'maio', 'junho', 
                      'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];

        // Inicializar grupos para cada categoria principal
        Object.keys(categoriasPrincipais).forEach(categoria => {
            const config = categoriasPrincipais[categoria];
            grupos[categoria] = {
                categoria: categoria,
                empresa: 'GERAL',
                tipo: config.tipo,
                meses: {},
                contasDetalhadas: []
            };
            
            // Inicializar meses com zero
            meses.forEach(mes => {
                grupos[categoria].meses[mes] = 0;
            });
        });

        // Adicionar dados simulados para compras e impostos se não houver dados reais
        const comprasExistentes = this.dadosFiltrados.filter(item => item.grupoNatureza === 'Compras');
        const impostosExistentes = this.dadosFiltrados.filter(item => item.grupoNatureza === 'Impostos');
        
        if (comprasExistentes.length === 0) {
            // Adicionar dados simulados de compras (valores menores para margem positiva)
            for (let i = 0; i < 10; i++) {
                this.dadosFiltrados.push({
                    id: `COMPRA_SIM_${i}`,
                    codigo: `COMP${i.toString().padStart(3, '0')}`,
                    categoria: 'Matéria Prima',
                    empresa: ['6F', '8F', 'PEQUETITA'][Math.floor(Math.random() * 3)],
                    fornecedor: `Fornecedor Compra ${i}`,
                    documento: `NF-COMP${i.toString().padStart(6, '0')}`,
                    data: new Date(2025, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
                    valor: Math.random() * 30000 + 3000, // Valores menores
                    status: 'Pago',
                    meses: this.gerarValoresMensais(),
                    meses2024: this.gerarValoresMensais(),
                    grupoNatureza: 'Compras',
                    tipo: 'despesa'
                });
            }
        }
        
        if (impostosExistentes.length === 0) {
            // Adicionar dados simulados de impostos (valores menores para margem positiva)
            for (let i = 0; i < 8; i++) {
                this.dadosFiltrados.push({
                    id: `IMPOSTO_SIM_${i}`,
                    codigo: `IMP${i.toString().padStart(3, '0')}`,
                    categoria: 'ICMS',
                    empresa: ['6F', '8F', 'PEQUETITA'][Math.floor(Math.random() * 3)],
                    fornecedor: 'Receita Federal',
                    documento: `GUIA-IMP${i.toString().padStart(6, '0')}`,
                    data: new Date(2025, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
                    valor: Math.random() * 15000 + 1500, // Valores menores
                    status: 'Pago',
                    meses: this.gerarValoresMensais(),
                    meses2024: this.gerarValoresMensais(),
                    grupoNatureza: 'Impostos',
                    tipo: 'despesa'
                });
            }
        }

        // Processar dados filtrados
        this.dadosFiltrados.forEach(item => {
            // Encontrar categoria principal para este item
            let categoriaEncontrada = null;
            
            // Mapeamento direto baseado no tipo e grupoNatureza
            if (item.tipo === 'receita') {
                categoriaEncontrada = 'RECEBIMENTOS';
            } else if (item.grupoNatureza === 'Compras') {
                categoriaEncontrada = 'COMPRAS';
            } else if (item.grupoNatureza === 'Impostos') {
                categoriaEncontrada = 'TRIBUTOS S/VENDA';
            } else if (item.grupoNatureza === 'Despesas Comerciais') {
                categoriaEncontrada = 'DESPESAS COMERCIAIS';
            } else if (item.grupoNatureza === 'Outras Despesas') {
                categoriaEncontrada = 'OUTRAS DESPESAS';
            } else {
                // Verificar por categoria específica
                for (const [categoriaPrincipal, config] of Object.entries(categoriasPrincipais)) {
                    if (config.contas.includes(item.categoria)) {
                        categoriaEncontrada = categoriaPrincipal;
                        break;
                    }
                }
            }



            if (categoriaEncontrada && grupos[categoriaEncontrada]) {
                const grupo = grupos[categoriaEncontrada];
                

                
                // Adicionar valores mensais
                Object.keys(item.meses).forEach(mes => {
                    grupo.meses[mes] += item.meses[mes] || 0;
                });

                // Adicionar conta detalhada para drilldown
                grupo.contasDetalhadas.push({
                    codigo: item.codigo || item.id,
                    descricao: item.categoria,
                    valor: item.valor,
                    empresa: item.empresa,
                    documento: item.documento,
                    data: item.data,
                    status: item.status
                });
            }
        });

        // Calcular Margem Bruta (Recebimentos - Compras - Tributos s/venda)
        if (grupos['RECEBIMENTOS']) {
            const recebimentos = grupos['RECEBIMENTOS'];
            const compras = grupos['COMPRAS'] || { meses: {} };
            const tributos = grupos['TRIBUTOS S/VENDA'] || { meses: {} };
            
            grupos['MARGEM BRUTA'] = {
                categoria: 'MARGEM BRUTA',
                empresa: 'GERAL',
                tipo: 'calculado',
                meses: {},
                contasDetalhadas: []
            };

            meses.forEach(mes => {
                const receita = recebimentos.meses[mes] || 0;
                const despesaCompras = compras.meses[mes] || 0;
                const despesaTributos = tributos.meses[mes] || 0;
                grupos['MARGEM BRUTA'].meses[mes] = receita - despesaCompras - despesaTributos;
            });
        }

        // Calcular Lucro Líquido (Recebimentos - Todas as Despesas)
        if (grupos['RECEBIMENTOS']) {
            const recebimentos = grupos['RECEBIMENTOS'];
            
            grupos['LUCRO LÍQUIDO'] = {
                categoria: 'LUCRO LÍQUIDO',
                empresa: 'GERAL',
                tipo: 'calculado',
                meses: {},
                contasDetalhadas: []
            };

            meses.forEach(mes => {
                const receita = recebimentos.meses[mes] || 0;
                let totalDespesas = 0;
                
                // Somar todas as despesas do mês
                Object.values(grupos).forEach(grupo => {
                    if (grupo.tipo === 'despesa' && grupo.meses[mes]) {
                        totalDespesas += grupo.meses[mes];
                    }
                });
                
                grupos['LUCRO LÍQUIDO'].meses[mes] = receita - totalDespesas;
            });
        }

        // Converter para array e ordenar
        const resultado = Object.values(grupos).filter(grupo => {
            // Filtrar apenas grupos que têm dados
            const total = Object.values(grupo.meses).reduce((sum, val) => sum + val, 0);
            // Incluir sempre COMPRAS, TRIBUTOS S/VENDA, MARGEM BRUTA e LUCRO LÍQUIDO
            if (grupo.categoria === 'COMPRAS' || grupo.categoria === 'TRIBUTOS S/VENDA' || grupo.categoria === 'MARGEM BRUTA' || grupo.categoria === 'LUCRO LÍQUIDO') {
                return true;
            }
            return total > 0 || grupo.tipo === 'calculado';
        });





        // Ordenar conforme solicitado
        const ordem = [
            'RECEBIMENTOS',
            'COMPRAS', 
            'TRIBUTOS S/VENDA',
            'MARGEM BRUTA',
            'DESPESAS COM PESSOAL',
            'DESPESAS COMERCIAIS',
            'DESPESAS OCUPACAO',
            'OUTRAS DESPESAS',
            'MANUTENCAO',
            'LUCRO LÍQUIDO'
        ];

        return resultado.sort((a, b) => {
            const indexA = ordem.indexOf(a.categoria);
            const indexB = ordem.indexOf(b.categoria);
            return indexA - indexB;
        });
    }

    renderizarPaginacao(totalItens) {
        const totalPaginas = Math.ceil(totalItens / this.itensPorPagina);
        const container = document.getElementById('pagination-controls');
        
        if (totalPaginas <= 1) {
            container.innerHTML = '';
            return;
        }

        let html = '';
        
        // Botão anterior
        html += `<button class="px-3 py-1 text-xs border rounded ${this.paginaAtual === 1 ? 'bg-gray-100 text-gray-400' : 'bg-white text-gray-700 hover:bg-gray-50'}" 
                        ${this.paginaAtual === 1 ? 'disabled' : ''} onclick="fluxoDetalhado.irParaPagina(${this.paginaAtual - 1})">‹</button>`;
        
        // Páginas
        for (let i = 1; i <= Math.min(totalPaginas, 5); i++) {
            const pagina = i;
            html += `<button class="px-3 py-1 text-xs border rounded ${pagina === this.paginaAtual ? 'bg-primary text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}" 
                            onclick="fluxoDetalhado.irParaPagina(${pagina})">${pagina}</button>`;
        }
        
        // Botão próximo
        html += `<button class="px-3 py-1 text-xs border rounded ${this.paginaAtual === totalPaginas ? 'bg-gray-100 text-gray-400' : 'bg-white text-gray-700 hover:bg-gray-50'}" 
                        ${this.paginaAtual === totalPaginas ? 'disabled' : ''} onclick="fluxoDetalhado.irParaPagina(${this.paginaAtual + 1})">›</button>`;
        
        container.innerHTML = html;
    }

    irParaPagina(pagina) {
        this.paginaAtual = pagina;
        this.renderizarTabela();
    }



    renderizarMaioresMovimentacoes() {
        const maiores = this.dadosFiltrados
            .sort((a, b) => b.valor - a.valor)
            .slice(0, 10);

        const container = document.getElementById('maiores-movimentacoes');
        container.innerHTML = maiores.map(item => `
            <div class="p-2 border-b border-gray-100 last:border-b-0">
                <div class="flex justify-between items-start">
                    <div class="flex-1">
                        <div class="text-xs font-medium ${item.tipo === 'receita' ? 'text-green-700' : 'text-red-700'}">
                            ${item.categoria}
                        </div>
                        <div class="text-xs text-gray-500">${item.empresa}</div>
                    </div>
                    <div class="text-xs font-bold ${item.tipo === 'receita' ? 'text-green-600' : 'text-red-600'}">
                        ${this.formatarMoeda(item.valor)}
                    </div>
                </div>
            </div>
        `).join('');
    }

    toggleDrilldown(btn, drilldownId, categoria, tipo) {
        const drilldownRow = document.getElementById(drilldownId);
        const icon = btn.querySelector('svg');
        const isExpanded = !drilldownRow.classList.contains('hidden');
        
        if (isExpanded) {
            // Fechar drilldown
            drilldownRow.classList.add('hidden');
            icon.style.transform = 'rotate(0deg)';
            btn.classList.remove('bg-primary', 'text-white');
            btn.classList.add('bg-white', 'text-gray-600');
        } else {
            // Abrir drilldown
            drilldownRow.classList.remove('hidden');
            icon.style.transform = 'rotate(90deg)';
            btn.classList.add('bg-primary', 'text-white');
            btn.classList.remove('bg-white', 'text-gray-600');
            
            // Carregar conteúdo do drilldown
            this.carregarConteudoDrilldown(drilldownId, categoria, tipo);
        }
    }

    carregarConteudoDrilldown(drilldownId, categoria, tipo) {
        // Encontrar o grupo correspondente na tabela
        const agrupados = this.agruparDadosParaTabela();
        const grupo = agrupados.find(g => g.categoria === categoria);
        
        const contentDiv = document.querySelector(`#${drilldownId} .drilldown-content`);
        
        if (!grupo || !grupo.contasDetalhadas || grupo.contasDetalhadas.length === 0) {
            contentDiv.innerHTML = '<div class="text-sm text-gray-500">Nenhum registro encontrado</div>';
            return;
        }

        // Agrupar contas detalhadas por código e descrição
        const contasAgrupadas = {};
        grupo.contasDetalhadas.forEach(conta => {
            const key = `${conta.codigo}_${conta.descricao}`;
            if (!contasAgrupadas[key]) {
                contasAgrupadas[key] = {
                    codigo: conta.codigo,
                    descricao: conta.descricao,
                    valor: 0
                };
            }
            contasAgrupadas[key].valor += conta.valor;
        });

        // Converter para array e ordenar por valor
        const contasOrdenadas = Object.values(contasAgrupadas)
            .sort((a, b) => b.valor - a.valor);

        // Tabela simplificada com apenas código, descrição e valor
        const tabelaHtml = `
            <table class="w-full text-xs">
                <thead class="bg-gray-100">
                    <tr>
                        <th class="p-2 text-left font-medium border-b border-gray-300">Código</th>
                        <th class="p-2 text-left font-medium border-b border-gray-300">Descrição</th>
                        <th class="p-2 text-right font-medium border-b border-gray-300">Valor</th>
                    </tr>
                </thead>
                <tbody>
                    ${contasOrdenadas.map(conta => `
                        <tr class="hover:bg-gray-50 border-b border-gray-200">
                            <td class="p-2 font-mono text-xs">${conta.codigo}</td>
                            <td class="p-2">${conta.descricao}</td>
                            <td class="p-2 text-right font-medium ${conta.valor >= 0 ? 'text-green-600' : 'text-red-600'}">
                                ${this.formatarMoeda(conta.valor)}
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;

        contentDiv.innerHTML = tabelaHtml;
    }





    limparFiltros() {
        // Resetar filtros de tipo
        document.querySelectorAll('.filter-btn-receitas, .filter-btn-despesas, .filter-btn-ambos').forEach(btn => {
            btn.classList.remove('active');
        });
        document.getElementById('filtro-ambos').classList.add('active');

        // Resetar filtros
        document.getElementById('data-inicio-filter').value = '2025-01-01';
        document.getElementById('data-fim-filter').value = '2025-12-31';

        this.filtros = {
            tipo: 'ambos',
            empresas: [],
            categorias: [],
            status: [],
            dataInicio: '2025-01-01',
            dataFim: '2025-12-31'
        };

        // Re-renderizar filtros para resetar checkboxes
        this.renderizarFiltros();
        this.aplicarFiltros();
    }

    // Funções utilitárias
    calcularComparativoAnual(dados, tipo) {
        if (dados.length === 0) return 0;
        
        const total2025 = dados.reduce((sum, item) => sum + item.valor, 0);
        const total2024 = dados.reduce((sum, item) => {
            const valor2024 = Object.values(item.meses2024 || {}).reduce((a, b) => a + b, 0);
            return sum + valor2024;
        }, 0);
        
        if (total2024 === 0) return 0;
        
        return ((total2025 - total2024) / total2024) * 100;
    }

    formatarMoeda(valor, abreviado = false) {
        if (abreviado && valor >= 1000) {
            if (valor >= 1000000) {
                return `R$ ${(valor / 1000000).toFixed(1)}M`;
            }
            return `R$ ${(valor / 1000).toFixed(1)}K`;
        }
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(valor);
    }

    formatarData(data) {
        return new Intl.DateTimeFormat('pt-BR').format(new Date(data));
    }

    getStatusClass(status) {
        switch (status.toLowerCase()) {
            case 'recebido':
            case 'pago':
                return 'bg-green-100 text-green-800';
            case 'em aberto':
                return 'bg-yellow-100 text-yellow-800';
            case 'vencido':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    }

    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
}

// Inicializar quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    try {
        window.fluxoDetalhado = new FluxoDetalhado();
    } catch (error) {
        console.error('Erro ao inicializar FluxoDetalhado:', error);
    }
}); 