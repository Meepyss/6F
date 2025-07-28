// Fluxo Detalhado - JavaScript Corrigido
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
        this.init();
    }

    async init() {
        try {
            await this.carregarDados();
            this.setupEventListeners();
            this.renderizarFiltros();
            this.aplicarFiltros();
            this.renderizarTabela();
        } catch (error) {
            console.error('Erro ao inicializar:', error);
        }
    }

    async carregarDados() {
        try {
            const [receitas, despesas] = await Promise.all([
                this.carregarReceitas(),
                this.carregarDespesas()
            ]);

            this.dados = [
                ...receitas.map(item => ({ ...item, tipo: 'receita' })),
                ...despesas.map(item => ({ ...item, tipo: 'despesa' }))
            ];

            console.log(`Carregados ${this.dados.length} registros (${receitas.length} receitas, ${despesas.length} despesas)`);
        } catch (error) {
            console.error('Erro ao carregar dados:', error);
            this.dados = this.gerarDadosSimulados();
        }
        
        // Validar dados carregados
        if (!this.dados || this.dados.length === 0) {
            console.warn('Nenhum dado carregado, usando dados simulados');
            this.dados = this.gerarDadosSimulados();
        }
    }

    async carregarReceitas() {
        try {
            const response = await fetch('assets/data/contas_a_receber_data.json');
            const dados = await response.json();
            
            return dados.map(item => ({
                id: item.id.toString(),
                codigo: item.document,
                categoria: this.mapearCategoriaReceita(item.company),
                empresa: item.company,
                cliente: item.client,
                documento: item.document,
                data: new Date(item.emissionDate),
                valor: item.valorTotal,
                status: this.mapearStatusReceita(item.status),
                meses: this.distribuirValorMensalmente(item.valorTotal, item.emissionDate),
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
            
            return dados.map(item => ({
                id: item.id.toString(),
                codigo: item.documento,
                categoria: this.mapearCategoriaDespesa(item.naturezaOperacao, item.grupoNatureza),
                empresa: item.empresa,
                fornecedor: item.fornecedor,
                documento: item.documento,
                data: new Date(item.dataEmissao),
                valor: item.valorSaldo,
                status: this.mapearStatusDespesa(item.situacao),
                meses: this.distribuirValorMensalmente(item.valorSaldo, item.dataEmissao),
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

    mapearCategoriaDespesa(naturezaOperacao, grupoNatureza) {
        // Mapeamento mais preciso das categorias de despesas
        const mapeamentoCategorias = {
            'PRO LABORE - ADMINISTRADORES': 'PRO LABORE - ADMINISTRADORES',
            'DIVIDENDOS AOS SOCIOS': 'DIVIDENDOS AOS SOCIOS',
            'COMISSOES VENDEDORES': 'COMISSOES VENDEDORES',
            'FEIRAS': 'FEIRAS',
            'MONTADORA E DESPESAS STAND': 'MONTADORA E DESPESAS STAND',
            'CATALOGOS, GRAFICA E BRINDES': 'CATALOGOS, GRAFICA E BRINDES',
            'MATERIAL DE ESCRITORIO': 'MATERIAL DE ESCRITORIO',
            'ASSESSORIA CONTABIL / JURIDICA': 'ASSESSORIA CONTABIL / JURIDICA',
            'PRESTACAO DE SERVICOS POR TERC': 'PRESTACAO DE SERVICOS POR TERC',
            'TARIFAS BANCARIAS': 'TARIFAS BANCARIAS'
        };

        // Se a natureza da operação já está mapeada, use-a
        if (mapeamentoCategorias[naturezaOperacao]) {
            return mapeamentoCategorias[naturezaOperacao];
        }

        // Mapeamento baseado no grupo de natureza
        const mapeamentoGrupo = {
            'Despesas Com Pessoal': 'PRO LABORE - ADMINISTRADORES',
            'Despesas Comerciais': 'COMISSOES VENDEDORES',
            'Despesas de Ocupação': 'MATERIAL DE ESCRITORIO',
            'Impostos': 'TARIFAS BANCARIAS',
            'Compras': 'MATERIAL DE ESCRITORIO',
            'Outras Despesas': 'PRESTACAO DE SERVICOS POR TERC',
            'DESPESAS_COM_PESSOAL': 'PRO LABORE - ADMINISTRADORES',
            'DESPESAS_COMERCIAS': 'COMISSOES VENDEDORES',
            'DESPESAS_OCUPACAO': 'MATERIAL DE ESCRITORIO'
        };

        return mapeamentoGrupo[grupoNatureza] || 'PRESTACAO DE SERVICOS POR TERC';
    }

    mapearStatusReceita(status) {
        const mapeamento = {
            'Aberto': 'Em Aberto',
            'Compensado': 'Recebido',
            'Pago Parcial': 'Em Aberto',
            'Vencido': 'Em Aberto'
        };
        return mapeamento[status] || status;
    }

    mapearStatusDespesa(situacao) {
        const mapeamento = {
            'Em Carteira': 'Em Aberto',
            'Descontado': 'Pago',
            'Remessa Simples': 'Pago',
            'Vinculado': 'Em Aberto'
        };
        return mapeamento[situacao] || situacao;
    }

    distribuirValorMensalmente(valor, data) {
        const meses = {
            janeiro: 0, fevereiro: 0, marco: 0, abril: 0, maio: 0, junho: 0,
            julho: 0, agosto: 0, setembro: 0, outubro: 0, novembro: 0, dezembro: 0
        };
        
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
        const contasReceitas = {
            '6F': [
                { codigo: '11101', descricao: 'VENDA REPRESENTANTE' },
                { codigo: '11102', descricao: 'VENDA EQUIPE INTERNA - RECORDE' },
                { codigo: '11103', descricao: 'VENDA COM SUPERVISOR' },
                { codigo: '11104', descricao: 'VENDA INTERNO SUPORTE AO REPRE' },
                { codigo: '11111', descricao: 'VENDA CAMPANHAS E PROMOCOES' },
                { codigo: '11205', descricao: 'VENDAS ABUP' },
                { codigo: '11206', descricao: 'VENDAS ABUP INTERNO' },
                { codigo: '11207', descricao: 'VENDA EVENTO' },
                { codigo: '11208', descricao: 'OUTLET' }
            ],
            '8F': [
                { codigo: '11101', descricao: 'VENDA REPRESENTANTE' },
                { codigo: '11102', descricao: 'VENDA EQUIPE INTERNA - RECORDE' },
                { codigo: '11103', descricao: 'VENDA COM SUPERVISOR' },
                { codigo: '11111', descricao: 'VENDA CAMPANHAS E PROMOCOES' },
                { codigo: '11205', descricao: 'VENDAS ABUP' },
                { codigo: '11206', descricao: 'VENDAS ABUP INTERNO' }
            ],
            'PEQUETITA': [
                { codigo: '11101', descricao: 'VENDA REPRESENTANTE' },
                { codigo: '11102', descricao: 'VENDA EQUIPE INTERNA - RECORDE' },
                { codigo: '11103', descricao: 'VENDA COM SUPERVISOR' },
                { codigo: '11111', descricao: 'VENDA CAMPANHAS E PROMOCOES' }
            ]
        };

        const empresas = ['6F', '8F', 'PEQUETITA'];
        const dados = [];

        for (let i = 0; i < 200; i++) {
            const empresa = empresas[Math.floor(Math.random() * empresas.length)];
            const contasEmpresa = contasReceitas[empresa];
            const conta = contasEmpresa[Math.floor(Math.random() * contasEmpresa.length)];
            
            dados.push({
                id: `REC${i.toString().padStart(4, '0')}`,
                codigo: conta.codigo,
                categoria: conta.descricao,
                empresa: empresa,
                cliente: `Cliente ${i + 1}`,
                documento: `NF${i.toString().padStart(6, '0')}`,
                data: new Date(2025, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
                valor: Math.random() * 150000 + 50000,
                status: Math.random() > 0.3 ? 'Recebido' : 'Em Aberto',
                meses: this.gerarValoresMensais(),
                grupoNatureza: 'Receitas'
            });
        }

        return dados;
    }

    gerarDespesasSimuladas() {
        const contasDespesas = {
            'DESPESAS_COM_PESSOAL': [
                { codigo: '21201', descricao: 'PRO LABORE - ADMINISTRADORES' },
                { codigo: '51101', descricao: 'DIVIDENDOS AOS SOCIOS' }
            ],
            'DESPESAS_COMERCIAS': [
                { codigo: '24101', descricao: 'COMISSOES VENDEDORES' },
                { codigo: '24201', descricao: 'FEIRAS' },
                { codigo: '24202', descricao: 'MONTADORA E DESPESAS STAND' },
                { codigo: '24203', descricao: 'CATALOGOS, GRAFICA E BRINDES' }
            ],
            'DESPESAS_OCUPACAO': [
                { codigo: '22201', descricao: 'MATERIAL DE ESCRITORIO' },
                { codigo: '26201', descricao: 'ASSESSORIA CONTABIL / JURIDICA' },
                { codigo: '26203', descricao: 'PRESTACAO DE SERVICOS POR TERC' },
                { codigo: '41101', descricao: 'TARIFAS BANCARIAS' }
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
                valor: Math.random() * 30000 + 1000,
                status: Math.random() > 0.2 ? 'Pago' : 'Em Aberto',
                meses: this.gerarValoresMensais(),
                grupoNatureza: categoria
            });
        }

        return dados;
    }

    gerarValoresMensais() {
        const valores = {
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
        
        return valores;
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

        // Verificar se todos os elementos necessários existem
        const elementosNecessarios = [
            'empresa-filter-container',
            'categoria-filter-container', 
            'status-filter-container',
            'detailed-table-body',
            'pagination-controls',
            'total-registros',
            'active-filters-container'
        ];

        const elementosFaltando = elementosNecessarios.filter(id => !document.getElementById(id));
        if (elementosFaltando.length > 0) {
            console.warn('Elementos DOM não encontrados:', elementosFaltando);
        }
    }

    setTipoFiltro(tipo) {
        document.querySelectorAll('.filter-btn-receitas, .filter-btn-despesas, .filter-btn-ambos').forEach(btn => {
            btn.classList.remove('active');
        });

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
            
            document.addEventListener('click', (e) => {
                if (!container.contains(e.target)) {
                    options.classList.remove('show');
                }
            });
        }
    }

    renderizarFiltroCategoria() {
        const categorias = [
            'VENDA REPRESENTANTE',
            'VENDA EQUIPE INTERNA - RECORDE',
            'VENDA COM SUPERVISOR',
            'VENDA INTERNO SUPORTE AO REPRE',
            'VENDA CAMPANHAS E PROMOCOES',
            'VENDAS ABUP',
            'VENDAS ABUP INTERNO',
            'VENDA EVENTO',
            'OUTLET',
            'PRO LABORE - ADMINISTRADORES',
            'DIVIDENDOS AOS SOCIOS',
            'COMISSOES VENDEDORES',
            'FEIRAS',
            'MONTADORA E DESPESAS STAND',
            'CATALOGOS, GRAFICA E BRINDES',
            'MATERIAL DE ESCRITORIO',
            'ASSESSORIA CONTABIL / JURIDICA',
            'PRESTACAO DE SERVICOS POR TERC',
            'TARIFAS BANCARIAS'
        ];
        
        const container = document.getElementById('categoria-filter-container');
        
        if (!container) return;
        
        container.innerHTML = this.criarSelectCheckbox('categoria-filter', categorias, 'Todas as Categorias');
        
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
        if (!button) return;
        
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
        this.renderizarFiltrosAtivos();
        this.renderizarTabela();
    }

    atualizarContadores() {
        const total = this.dadosFiltrados.length;
        const element = document.getElementById('total-registros');
        if (element) {
            element.textContent = `${total} registros encontrados`;
        }
    }

    renderizarFiltrosAtivos() {
        const container = document.getElementById('active-filters-container');
        if (!container) return;
        
        container.innerHTML = '';
        
        // Filtro de tipo
        if (this.filtros.tipo !== 'ambos') {
            this.criarFiltroAtivo('tipo', this.filtros.tipo, this.filtros.tipo === 'receitas' ? 'Receitas' : 'Despesas');
        }
        
        // Filtros de empresa
        this.filtros.empresas.forEach(empresa => {
            this.criarFiltroAtivo('empresas', empresa, empresa);
        });
        
        // Filtros de categoria
        this.filtros.categorias.forEach(categoria => {
            this.criarFiltroAtivo('categorias', categoria, categoria);
        });
        
        // Filtros de status
        this.filtros.status.forEach(status => {
            this.criarFiltroAtivo('status', status, status);
        });
    }

    criarFiltroAtivo(tipo, valor, label) {
        const container = document.getElementById('active-filters-container');
        if (!container) return;
        
        const pill = document.createElement('div');
        pill.className = 'filter-pill bg-gray-200 text-gray-700 rounded-full px-3 py-1 text-sm font-medium flex items-center gap-2';
        pill.innerHTML = `
            <span>${label}</span>
            <button class="text-gray-500 hover:text-gray-800 text-lg leading-none" onclick="fluxoDetalhado.removerFiltroAtivo('${tipo}', '${valor}')">&times;</button>
        `;
        container.appendChild(pill);
    }

    removerFiltroAtivo(tipo, valor) {
        if (tipo === 'tipo') {
            this.filtros.tipo = 'ambos';
            document.querySelectorAll('.filter-btn-receitas, .filter-btn-despesas, .filter-btn-ambos').forEach(btn => {
                btn.classList.remove('active');
            });
            document.getElementById('filtro-ambos').classList.add('active');
        } else {
            this.filtros[tipo] = this.filtros[tipo].filter(v => v !== valor);
            this.atualizarTextoBotao(tipo);
        }
        
        this.aplicarFiltros();
    }

    renderizarTabela() {
        const agrupados = this.agruparDadosParaTabela();
        const tbody = document.getElementById('detailed-table-body');
        
        if (!tbody) {
            console.error('Elemento tbody não encontrado');
            return;
        }
        
        const inicio = (this.paginaAtual - 1) * this.itensPorPagina;
        const fim = inicio + this.itensPorPagina;
        const dadosPagina = agrupados.slice(inicio, fim);

        tbody.innerHTML = dadosPagina.map(item => {
            const total = Object.values(item.meses).reduce((sum, val) => sum + val, 0);
            
            let rowClass = '';
            if (item.tipo === 'receita') {
                rowClass = 'receita-row';
            } else if (item.tipo === 'despesa') {
                rowClass = 'despesa-row';
            } else if (item.tipo === 'calculado') {
                rowClass = total >= 0 ? 'receita-row' : 'despesa-row';
            }
            
            return `
                <tr class="${rowClass} hover:bg-gray-100" data-categoria="${item.categoria}" data-tipo="${item.tipo}">
                    <td class="p-2">
                        <button class="drilldown-toggle-btn w-6 h-6 flex items-center justify-center text-gray-500 hover:text-primary transition-colors" 
                                onclick="fluxoDetalhado.toggleDrilldown('${item.categoria}')" 
                                title="Expandir detalhes">
                            <svg class="w-4 h-4 transform transition-transform" fill="currentColor" viewBox="0 0 20 20">
                                <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd"></path>
                            </svg>
                        </button>
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
                <tr id="drilldown-${item.categoria.replace(/\s+/g, '-')}" class="drilldown-row hidden">
                    <td colspan="16" class="p-0">
                        <div class="drilldown-content bg-gray-50 border-t border-gray-200 p-4">
                            ${this.renderizarDrilldownContent(item)}
                        </div>
                    </td>
                </tr>
            `;
        }).join('');

        this.renderizarPaginacao(agrupados.length);
    }

    agruparDadosParaTabela() {
        const categoriasPrincipais = {
            'RECEBIMENTOS': {
                tipo: 'receita',
                contas: [
                    'VENDA REPRESENTANTE',
                    'VENDA EQUIPE INTERNA - RECORDE',
                    'VENDA COM SUPERVISOR',
                    'VENDA INTERNO SUPORTE AO REPRE',
                    'VENDA CAMPANHAS E PROMOCOES',
                    'VENDAS ABUP',
                    'VENDAS ABUP INTERNO',
                    'VENDA EVENTO',
                    'OUTLET'
                ]
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
                    'CATALOGOS, GRAFICA E BRINDES'
                ]
            },
            'DESPESAS OCUPACAO': {
                tipo: 'despesa',
                contas: [
                    'MATERIAL DE ESCRITORIO',
                    'ASSESSORIA CONTABIL / JURIDICA',
                    'PRESTACAO DE SERVICOS POR TERC',
                    'TARIFAS BANCARIAS'
                ]
            }
        };

        const grupos = {};
        const meses = ['janeiro', 'fevereiro', 'marco', 'abril', 'maio', 'junho', 
                      'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];

        // Inicializar grupos
        Object.keys(categoriasPrincipais).forEach(categoria => {
            const config = categoriasPrincipais[categoria];
            grupos[categoria] = {
                categoria: categoria,
                empresa: 'GERAL',
                tipo: config.tipo,
                meses: {}
            };
            
            meses.forEach(mes => {
                grupos[categoria].meses[mes] = 0;
            });
        });

        // Processar dados filtrados
        this.dadosFiltrados.forEach(item => {
            let categoriaEncontrada = null;
            
            if (item.tipo === 'receita') {
                categoriaEncontrada = 'RECEBIMENTOS';
            } else if (item.tipo === 'despesa') {
                // Mapeamento mais preciso para despesas
                if (item.categoria === 'PRO LABORE - ADMINISTRADORES' || 
                    item.categoria === 'DIVIDENDOS AOS SOCIOS') {
                    categoriaEncontrada = 'DESPESAS COM PESSOAL';
                } else if (item.categoria === 'COMISSOES VENDEDORES' || 
                           item.categoria === 'FEIRAS' || 
                           item.categoria === 'MONTADORA E DESPESAS STAND' || 
                           item.categoria === 'CATALOGOS, GRAFICA E BRINDES') {
                    categoriaEncontrada = 'DESPESAS COMERCIAIS';
                } else {
                    categoriaEncontrada = 'DESPESAS OCUPACAO';
                }
            }

            if (categoriaEncontrada && grupos[categoriaEncontrada]) {
                const grupo = grupos[categoriaEncontrada];
                
                Object.keys(item.meses).forEach(mes => {
                    grupo.meses[mes] += item.meses[mes] || 0;
                });
            }
        });

        // Calcular Lucro Líquido
        if (grupos['RECEBIMENTOS']) {
            const recebimentos = grupos['RECEBIMENTOS'];
            
            grupos['LUCRO LÍQUIDO'] = {
                categoria: 'LUCRO LÍQUIDO',
                empresa: 'GERAL',
                tipo: 'calculado',
                meses: {}
            };

            meses.forEach(mes => {
                const receita = recebimentos.meses[mes] || 0;
                let totalDespesas = 0;
                
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
            const total = Object.values(grupo.meses).reduce((sum, val) => sum + val, 0);
            return total > 0 || grupo.tipo === 'calculado';
        });

        const ordem = [
            'RECEBIMENTOS',
            'DESPESAS COM PESSOAL',
            'DESPESAS COMERCIAIS',
            'DESPESAS OCUPACAO',
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
        
        if (!container) return;
        
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

    limparFiltros() {
        document.querySelectorAll('.filter-btn-receitas, .filter-btn-despesas, .filter-btn-ambos').forEach(btn => {
            btn.classList.remove('active');
        });
        document.getElementById('filtro-ambos').classList.add('active');

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

        this.renderizarFiltros();
        this.aplicarFiltros();
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

    toggleDrilldown(categoria) {
        const drilldownId = `drilldown-${categoria.replace(/\s+/g, '-')}`;
        const drilldownRow = document.getElementById(drilldownId);
        const toggleBtn = document.querySelector(`[onclick="fluxoDetalhado.toggleDrilldown('${categoria}')"]`);
        
        if (!drilldownRow || !toggleBtn) return;
        
        const isExpanded = !drilldownRow.classList.contains('hidden');
        
        if (isExpanded) {
            // Fechar drilldown
            drilldownRow.classList.add('hidden');
            toggleBtn.querySelector('svg').classList.remove('rotate-90');
            toggleBtn.title = 'Expandir detalhes';
        } else {
            // Abrir drilldown
            drilldownRow.classList.remove('hidden');
            toggleBtn.querySelector('svg').classList.add('rotate-90');
            toggleBtn.title = 'Recolher detalhes';
        }
    }

    renderizarDrilldownContent(item) {
        const detalhes = this.obterDetalhesCategoria(item.categoria);
        
        if (!detalhes || detalhes.length === 0) {
            return `
                <div class="text-center text-gray-500 py-4">
                    <p>Nenhum detalhe disponível para esta categoria.</p>
                </div>
            `;
        }

        return `
            <div class="space-y-4">
                <div class="flex items-center justify-between mb-3">
                    <h4 class="text-sm font-semibold text-gray-700">Detalhes de ${item.categoria}</h4>
                    <span class="text-xs text-gray-500">${detalhes.length} registros</span>
                </div>
                
                <div class="overflow-x-auto">
                    <table class="w-full text-xs">
                        <thead class="bg-gray-100">
                            <tr>
                                <th class="p-2 text-left font-medium">Código</th>
                                <th class="p-2 text-left font-medium">Descrição</th>
                                <th class="p-2 text-right font-medium">Jan</th>
                                <th class="p-2 text-right font-medium">Fev</th>
                                <th class="p-2 text-right font-medium">Mar</th>
                                <th class="p-2 text-right font-medium">Abr</th>
                                <th class="p-2 text-right font-medium">Mai</th>
                                <th class="p-2 text-right font-medium">Jun</th>
                                <th class="p-2 text-right font-medium">Jul</th>
                                <th class="p-2 text-right font-medium">Ago</th>
                                <th class="p-2 text-right font-medium">Set</th>
                                <th class="p-2 text-right font-medium">Out</th>
                                <th class="p-2 text-right font-medium">Nov</th>
                                <th class="p-2 text-right font-medium">Dez</th>
                                <th class="p-2 text-right font-medium">Total</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-gray-200">
                            ${detalhes.map(detalhe => {
                                const total = Object.values(detalhe.meses).reduce((sum, val) => sum + val, 0);
                                return `
                                    <tr class="hover:bg-gray-50">
                                        <td class="p-2 font-medium">${detalhe.codigo}</td>
                                        <td class="p-2 text-gray-600">${detalhe.categoria}</td>
                                        <td class="p-2 text-right text-xs">${this.formatarMoeda(detalhe.meses.janeiro)}</td>
                                        <td class="p-2 text-right text-xs">${this.formatarMoeda(detalhe.meses.fevereiro)}</td>
                                        <td class="p-2 text-right text-xs">${this.formatarMoeda(detalhe.meses.marco)}</td>
                                        <td class="p-2 text-right text-xs">${this.formatarMoeda(detalhe.meses.abril)}</td>
                                        <td class="p-2 text-right text-xs">${this.formatarMoeda(detalhe.meses.maio)}</td>
                                        <td class="p-2 text-right text-xs">${this.formatarMoeda(detalhe.meses.junho)}</td>
                                        <td class="p-2 text-right text-xs">${this.formatarMoeda(detalhe.meses.julho)}</td>
                                        <td class="p-2 text-right text-xs">${this.formatarMoeda(detalhe.meses.agosto)}</td>
                                        <td class="p-2 text-right text-xs">${this.formatarMoeda(detalhe.meses.setembro)}</td>
                                        <td class="p-2 text-right text-xs">${this.formatarMoeda(detalhe.meses.outubro)}</td>
                                        <td class="p-2 text-right text-xs">${this.formatarMoeda(detalhe.meses.novembro)}</td>
                                        <td class="p-2 text-right text-xs">${this.formatarMoeda(detalhe.meses.dezembro)}</td>
                                        <td class="p-2 text-right font-medium ${total >= 0 ? 'text-green-600' : 'text-red-600'}">
                                            ${this.formatarMoeda(total)}
                                        </td>
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }

    obterDetalhesCategoria(categoria) {
        const categoriasPrincipais = {
            'RECEBIMENTOS': [
                'VENDA REPRESENTANTE',
                'VENDA EQUIPE INTERNA - RECORDE',
                'VENDA COM SUPERVISOR',
                'VENDA INTERNO SUPORTE AO REPRE',
                'VENDA CAMPANHAS E PROMOCOES',
                'VENDAS ABUP',
                'VENDAS ABUP INTERNO',
                'VENDA EVENTO',
                'OUTLET'
            ],
            'DESPESAS COM PESSOAL': [
                'PRO LABORE - ADMINISTRADORES',
                'DIVIDENDOS AOS SOCIOS'
            ],
            'DESPESAS COMERCIAIS': [
                'COMISSOES VENDEDORES',
                'FEIRAS',
                'MONTADORA E DESPESAS STAND',
                'CATALOGOS, GRAFICA E BRINDES'
            ],
            'DESPESAS OCUPACAO': [
                'MATERIAL DE ESCRITORIO',
                'ASSESSORIA CONTABIL / JURIDICA',
                'PRESTACAO DE SERVICOS POR TERC',
                'TARIFAS BANCARIAS'
            ]
        };

        const categoriasRelacionadas = categoriasPrincipais[categoria] || [];
        
        return this.dadosFiltrados.filter(item => {
            if (categoria === 'RECEBIMENTOS') {
                return item.tipo === 'receita' && categoriasRelacionadas.includes(item.categoria);
            } else if (categoria === 'LUCRO LÍQUIDO') {
                return false; // Lucro líquido não tem detalhes diretos
            } else {
                return item.tipo === 'despesa' && categoriasRelacionadas.includes(item.categoria);
            }
        }).map(item => ({
            codigo: item.codigo,
            categoria: item.categoria,
            valor: item.valor,
            meses: item.meses
        })).sort((a, b) => b.valor - a.valor); // Ordenar por valor decrescente
    }
}

// Inicializar quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM carregado, inicializando FluxoDetalhado...');
    try {
        window.fluxoDetalhado = new FluxoDetalhado();
        console.log('FluxoDetalhado inicializado com sucesso');
    } catch (error) {
        console.error('Erro ao inicializar FluxoDetalhado:', error);
    }
}); 