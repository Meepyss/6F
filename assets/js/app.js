// Funções compartilhadas para os dashboards

/**
 * Classe genérica para criar um dashboard interativo.
 * Lida com a lógica de estado, filtros, e renderização de componentes compartilhados.
 */
class DashboardApp {
    constructor(config) {
        this.config = config;
        this.activeFilters = JSON.parse(JSON.stringify(config.initialFilters));
        this.rawData = [];
        this.currentPage = 1;
        this.rowsPerPage = 25;

        // Associa os métodos ao contexto da classe para que possam ser passados como callbacks.
        this.init = this.init.bind(this);
        this.updateDashboard = this.updateDashboard.bind(this);
        this.applyFilter = this.applyFilter.bind(this);
        this.removeFilter = this.removeFilter.bind(this);
        this.clearFilters = this.clearFilters.bind(this);
        this.handleCheckboxChange = this.handleCheckboxChange.bind(this);
        this.openDrillDownModal = this.openDrillDownModal.bind(this);
        this.closeDrillDownModal = this.closeDrillDownModal.bind(this);
    }

    // --- LÓGICA DE FILTROS ---
    applyFilter(type, value, isMultiSelect = false) {
        this.currentPage = 1;
        if (Array.isArray(this.activeFilters[type])) {
            const currentValues = this.activeFilters[type];
            if (isMultiSelect) {
                this.activeFilters[type] = currentValues.includes(value)
                    ? currentValues.filter(v => v !== value)
                    : [...currentValues, value];
            } else {
                this.activeFilters[type] = (currentValues.length === 1 && currentValues[0] === value)
                    ? []
                    : [value];
            }
        } else {
            this.activeFilters[type] = (this.activeFilters[type] === value)
                ? this.config.initialFilters[type]
                : value;
        }
        this.updateDashboard();
    }

    removeFilter(type, value) {
        this.currentPage = 1;
        if (Array.isArray(this.activeFilters[type])) {
            this.activeFilters[type] = this.activeFilters[type].filter(v => v !== value);
        } else {
            this.activeFilters[type] = this.config.initialFilters[type];
        }
        this.updateDashboard();
    }

    clearFilters() {
        this.activeFilters = JSON.parse(JSON.stringify(this.config.initialFilters));
        // Limpa campos de busca específicos se eles existirem no DOM
        if (this.config.dom.fornecedorSearch) this.config.dom.fornecedorSearch.value = '';
        if (this.config.dom.customerSearchFilter) this.config.dom.customerSearchFilter.value = '';
        
        // Limpa filtros de data
        const dataInicioFilter = document.getElementById('data-inicio-filter');
        const dataFimFilter = document.getElementById('data-fim-filter');
        if (dataInicioFilter) dataInicioFilter.value = this.config.initialFilters.dataInicio || '2025-01-01';
        if (dataFimFilter) dataFimFilter.value = this.config.initialFilters.dataFim || '2025-12-31';
        
        // Remove classes active dos botões de filtro
        document.querySelectorAll('.filter-btn-receitas, .filter-btn-despesas, .filter-btn-ambos')
            .forEach(btn => btn.classList.remove('active'));
        
        // Adiciona classe active ao botão "Ambos"
        const filtroAmbos = document.getElementById('filtro-ambos');
        if (filtroAmbos) filtroAmbos.classList.add('active');
        
        this.currentPage = 1;
        this.updateDashboard();
    }

    // --- RENDERIZAÇÃO DE COMPONENTES DE UI COMPARTILHADOS ---
    renderActiveFilterPills() {
        const container = this.config.dom.activeFiltersContainer;
        if (!container) return;
        container.innerHTML = '';
        const createPill = (type, value, label) => {
            const pill = document.createElement('div');
            pill.className = 'filter-pill bg-gray-200 text-gray-700 rounded-full px-3 py-1 text-sm font-medium';
            pill.innerHTML = `<span>${label}: ${value}</span><button class="ml-2 text-gray-500 hover:text-gray-800">&times;</button>`;
            pill.querySelector('button').onclick = () => this.removeFilter(type, value);
            container.appendChild(pill);
        };
        this.config.filterPillDefinitions.forEach(def => {
            if (Array.isArray(this.activeFilters[def.type])) {
                this.activeFilters[def.type].forEach(value => createPill(def.type, value, def.label));
            }
        });
    }

    createCustomSelect(type, options, filterKey, container) {
        const placeholder = `Todos os ${type}`;
        container.innerHTML = `
            <button id="${type}-select-btn" class="custom-select-button">
                <span>${placeholder}</span>
                <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd"></path></svg>
            </button>
            <div id="${type}-select-options" class="custom-select-options">
                ${options.map(o => `<label><input type="checkbox" value="${o}"> ${o}</label>`).join('')}
            </div>`;
        
        const btn = container.querySelector('button');
        const optionsDiv = container.querySelector('.custom-select-options');

        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            optionsDiv.classList.toggle('show');
        });

        optionsDiv.querySelectorAll('input').forEach(input => {
            input.onchange = (e) => this.handleCheckboxChange(e, filterKey);
        });

        // Fechar dropdown ao clicar fora
        document.addEventListener('click', (e) => {
            if (!container.contains(e.target)) {
                optionsDiv.classList.remove('show');
            }
        });
    }

    updateCustomSelect(type, filterKey) {
        const containerKey = this.config.customSelects.find(s => s.filterKey === filterKey)?.containerId;
        const container = containerKey ? document.getElementById(containerKey) : null;
        if (!container) return;

        const selectedCount = this.activeFilters[filterKey].length;
        const btnText = container.querySelector('span');
        const optionsDiv = container.querySelector('.custom-select-options');

        if (selectedCount === 0) btnText.textContent = `Todos os ${type}`;
        else if (selectedCount === 1) btnText.textContent = this.activeFilters[filterKey][0];
        else btnText.textContent = `${selectedCount} selecionados`;

        optionsDiv.querySelectorAll('input').forEach(c => c.checked = this.activeFilters[filterKey].includes(c.value));
    }

    handleCheckboxChange(event, filterKey) {
        this.currentPage = 1;
        const { value, checked } = event.target;
        const currentValues = this.activeFilters[filterKey];
        if (checked) {
            this.activeFilters[filterKey] = [...currentValues, value];
        } else {
            this.activeFilters[filterKey] = currentValues.filter(v => v !== value);
        }
        this.updateDashboard();
    }

    renderPagination(totalRows) {
        const container = this.config.dom.paginationControls;
        if (!container) return;

        const totalPages = Math.ceil(totalRows / this.rowsPerPage);
        if (totalPages <= 1) {
            container.innerHTML = '';
            return;
        }

        container.innerHTML = `
            <button id="prev-page" class="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed">&lt; Anterior</button>
            <span class="text-gray-700">Página ${this.currentPage} de ${totalPages}</span>
            <button id="next-page" class="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed">Próximo &gt;</button>
        `;
        const prevBtn = document.getElementById('prev-page');
        const nextBtn = document.getElementById('next-page');
        prevBtn.disabled = this.currentPage === 1;
        nextBtn.disabled = this.currentPage === totalPages;
        prevBtn.onclick = () => { if(this.currentPage > 1) { this.currentPage--; this.updateDashboard(); } };
        nextBtn.onclick = () => { if(this.currentPage < totalPages) { this.currentPage++; this.updateDashboard(); } };
    }

    // --- LÓGICA DO MODAL ---
    openDrillDownModal(title, data) {
        this.config.dom.drilldownModalTitle.textContent = title;
        // Ensure the generic renderTable is called with the correct context and target element
        this.config.renderTable(data, this, this.config.dom.drilldownModalTableBody);
        this.config.dom.drilldownModal.classList.remove('hidden');
    }

    closeDrillDownModal() {
        this.config.dom.drilldownModal.classList.add('hidden');
    }

    // --- CONTROLE PRINCIPAL ---
    updateDashboard() {
        const filteredData = this.config.getFilteredData(this.rawData, this.activeFilters);
        
        this.config.renderFunctions.forEach(renderFunc => {
            renderFunc(filteredData, this);
        });

        this.renderActiveFilterPills();
        this.renderPagination(filteredData.length);
        
        if (this.config.customSelects) {
            this.config.customSelects.forEach(select => {
                this.updateCustomSelect(select.type, select.filterKey);
            });
        }
    }

    init(data) {
        this.rawData = data;
        
        if (this.config.dom.empresaFilter && this.config.allEmpresas) {
            this.config.dom.empresaFilter.innerHTML = '<option value="all">Todas</option>' + this.config.allEmpresas.map(e => `<option value="${e}">${e}</option>`).join('');
        }
        if (this.config.customSelects) {
            this.config.customSelects.forEach(select => {
                const container = document.getElementById(select.containerId);
                if (container) {
                    this.createCustomSelect(select.type, select.options, select.filterKey, container);
                }
            });
        }

        this.config.setupEventListeners(this);
        
        this.updateDashboard();
    }
}
