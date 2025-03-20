/**
 * Handles user interactions and orchestrates the workflow for the retirement calculator.
 */
class UIController {
    /**
     * Constructor
     */
    constructor() {
        this.monteCarloEngine = new MonteCarloEngine();
        this.scenarioGenerator = new ScenarioGenerator();
        this.chartGenerator = new ChartGenerator();
        
        // Initialize UI
        this.initEventListeners();
        this.initTooltips();
        
        // Load any saved parameters from localStorage
        this.loadSavedParameters();
    }
    
    /**
     * Initialize event listeners
     */
    initEventListeners() {
        // Form submissions
        document.getElementById('basicModeForm').addEventListener('submit', this.handleBasicFormSubmit.bind(this));
        document.getElementById('advancedModeForm').addEventListener('submit', this.handleAdvancedFormSubmit.bind(this));
        
        // Tab change event to resize charts
        document.querySelectorAll('button[data-bs-toggle="tab"]').forEach(tab => {
            tab.addEventListener('shown.bs.tab', event => {
                // Resize any charts in the newly activated tab
                this.resizeChartsInTab(event.target.getAttribute('data-bs-target'));
            });
        });
        
        // Automatic form validation
        document.querySelectorAll('.needs-validation').forEach(form => {
            form.addEventListener('submit', event => {
                if (!form.checkValidity()) {
                    event.preventDefault();
                    event.stopPropagation();
                }
                form.classList.add('was-validated');
            }, false);
        });
        
        // Save parameters when form values change
        document.querySelectorAll('#basicModeForm input, #advancedModeForm input').forEach(input => {
            input.addEventListener('change', this.saveParametersToLocalStorage.bind(this));
        });
    }
    
    /**
     * Initialize tooltips
     */
    initTooltips() {
        // Enable Bootstrap tooltips
        const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
        tooltipTriggerList.map(function (tooltipTriggerEl) {
            return new bootstrap.Tooltip(tooltipTriggerEl);
        });
    }
    
    /**
     * Handle basic mode form submission
     * 
     * @param {Event} event - The submit event
     */
    handleBasicFormSubmit(event) {
        event.preventDefault();
        
        const form = event.target;
        if (!form.checkValidity()) {
            form.classList.add('was-validated');
            return;
        }
        
        // Show loading state
        this.showLoading('basic');
        
        // Get parameters from form
        const params = RetirementParameters.fromBasicForm(form);
        this.saveParametersToLocalStorage();
        
        // Create simulation status bar
        this.createSimulationStatus('basic');
        
        // Use setTimeout to allow the UI to update before starting calculations
        setTimeout(() => {
            // Calculate required corpus and success rate
            const requiredCorpus = this.monteCarloEngine.calculateRequiredCorpus(params, 
                progress => this.updateProgress('basic', progress, 'Calculating required corpus...'));
                
            // Update simulation status
            this.updateSimulationStatus('basic', 'Running success rate simulation...', 0.4);
                
            const successRate = this.monteCarloEngine.simulateRetirementWithCorpus(requiredCorpus, params,
                progress => this.updateProgress('basic', progress, 'Simulating with corpus...'));
                
            // Update simulation status
            this.updateSimulationStatus('basic', 'Generating final values...', 0.7);
                
            // Get corpus values for chart
            const corpusValues = this.monteCarloEngine.simulateRetirementAndReturnCorpusValues(requiredCorpus, params,
                progress => this.updateProgress('basic', progress, 'Generating final values...'));
            
            // Hide loading state and show results
            this.hideLoading('basic');
            
            // Update simulation status
            this.updateSimulationStatus('basic', 'Simulation complete!', 1.0);
            setTimeout(() => {
                this.hideSimulationStatus('basic');
                this.displayBasicResults(params, requiredCorpus, successRate, corpusValues);
            }, 1000);
        }, 50);  // Short delay for UI update
    }
    
    /**
     * Handle advanced mode form submission
     * 
     * @param {Event} event - The submit event
     */
    handleAdvancedFormSubmit(event) {
        event.preventDefault();
        
        const form = event.target;
        if (!form.checkValidity()) {
            form.classList.add('was-validated');
            return;
        }
        
        // Show loading state
        this.showLoading('advanced');
        
        // Get parameters from form
        const params = RetirementParameters.fromAdvancedForm(form);
        this.saveParametersToLocalStorage();
        
        // Create simulation status bar
        this.createSimulationStatus('advanced');
        
        // Use setTimeout to allow the UI to update before starting calculations
        setTimeout(() => {
            // Calculate projected corpus and success rate
            this.updateSimulationStatus('advanced', 'Calculating projected corpus...', 0.1);
            const projectedCorpus = this.monteCarloEngine.calculateProjectedCorpus(params);
            
            this.updateSimulationStatus('advanced', 'Simulating with projected corpus...', 0.2);
            const currentSuccessRate = this.monteCarloEngine.simulateRetirementWithCorpus(projectedCorpus, params,
                progress => this.updateProgress('advanced', progress, 'Simulating with projected corpus...'));
            
            // Calculate required corpus for target success rate
            const targetSuccessRate = params.targetSuccessRate;
            
            let requiredCorpus = 0;
            if (currentSuccessRate < targetSuccessRate) {
                this.updateSimulationStatus('advanced', 'Calculating required corpus...', 0.4);
                const tempParams = new RetirementParameters(
                    params.annualExpense,
                    params.getRetirementYears(),
                    params.expectedReturn,
                    params.standardDeviation,
                    params.inflation,
                    true,
                    params.numSimulations
                );
                
                tempParams.targetSuccessRate = targetSuccessRate;
                
                requiredCorpus = this.monteCarloEngine.calculateRequiredCorpus(tempParams,
                    progress => this.updateProgress('advanced', progress, 'Calculating required corpus...'));
            } else {
                requiredCorpus = projectedCorpus * 0.9;  // If already exceeding target, set required to 90% of projected
            }
            
            // Get corpus values for chart
            this.updateSimulationStatus('advanced', 'Generating corpus values...', 0.6);
            const corpusValues = this.monteCarloEngine.simulateRetirementAndReturnCorpusValues(projectedCorpus, params,
                progress => this.updateProgress('advanced', progress, 'Generating final values...'));
            
            // Generate scenarios
            this.updateSimulationStatus('advanced', 'Generating scenarios...', 0.8);
            const scenarios = this.scenarioGenerator.generateScenarios(params, targetSuccessRate,
                progress => this.updateProgress('advanced', progress, 'Generating scenarios...'));
            
            // Hide loading state and show results
            this.hideLoading('advanced');
            
            // Update simulation status
            this.updateSimulationStatus('advanced', 'Simulation complete!', 1.0);
            setTimeout(() => {
                this.hideSimulationStatus('advanced');
                this.displayAdvancedResults(params, projectedCorpus, requiredCorpus, currentSuccessRate, corpusValues, scenarios);
            }, 1000);
        }, 50);  // Short delay for UI update
    }
    
    /**
     * Display results for basic mode
     * 
     * @param {RetirementParameters} params - The parameters used
     * @param {number} requiredCorpus - The calculated required corpus
     * @param {number} successRate - The success rate
     * @param {Array<number>} corpusValues - Final corpus values for all simulations
     */
    displayBasicResults(params, requiredCorpus, successRate, corpusValues) {
        // Show results section
        const resultsSection = document.getElementById('basicResults');
        resultsSection.style.display = 'block';
        
        // Update text values
        document.getElementById('requiredCorpus').textContent = FormatUtil.formatNumber(requiredCorpus);
        document.getElementById('successRate').textContent = successRate.toFixed(1);
        
        // Create status indicator
        this.createStatusIndicator('basicStatusIndicator', successRate);
        
        // Create corpus distribution chart
        this.chartGenerator.createCorpusDistributionChart('basicResultChart', corpusValues, requiredCorpus, params);
        
        // Add report actions buttons if they don't exist
        if (!document.getElementById('basicReportActions')) {
            const actionsContainer = document.createElement('div');
            actionsContainer.id = 'basicReportActions';
            actionsContainer.className = 'mt-4 text-end';
            
            const printButton = document.createElement('button');
            printButton.className = 'btn btn-outline-secondary';
            printButton.innerHTML = '<i class="bi bi-printer"></i> Print Report';
            printButton.onclick = () => this.printReport('basic');
            
            actionsContainer.appendChild(printButton);
            
            resultsSection.appendChild(actionsContainer);
        }
    }
    
    /**
     * Display results for advanced mode
     * 
     * @param {RetirementParameters} params - The parameters used
     * @param {number} projectedCorpus - The projected corpus at retirement
     * @param {number} requiredCorpus - The required corpus for target success rate
     * @param {number} currentSuccessRate - The current success rate
     * @param {Array<number>} corpusValues - Final corpus values for all simulations
     * @param {Object} scenarios - The generated scenarios
     */
    displayAdvancedResults(params, projectedCorpus, requiredCorpus, currentSuccessRate, corpusValues, scenarios) {
        // Show results section
        const resultsSection = document.getElementById('advancedResults');
        resultsSection.style.display = 'block';
        
        // Update text values
        document.getElementById('projectedCorpus').textContent = FormatUtil.formatNumber(projectedCorpus);
        document.getElementById('currentSuccessRate').textContent = currentSuccessRate.toFixed(1);
        document.getElementById('advRequiredCorpus').textContent = FormatUtil.formatNumber(requiredCorpus);
        
        // Create status indicator
        this.createStatusIndicator('advancedStatusIndicator', currentSuccessRate);
        
        // Create corpus distribution chart
        this.chartGenerator.createCorpusDistributionChart('advancedResultChart', corpusValues, projectedCorpus, params);
        
        // Display scenarios
        this.displayScenarios(scenarios);
        
        // Add report actions buttons if they don't exist
        if (!document.getElementById('advancedReportActions')) {
            const actionsContainer = document.createElement('div');
            actionsContainer.id = 'advancedReportActions';
            actionsContainer.className = 'mt-4 text-end';
            
            const printButton = document.createElement('button');
            printButton.className = 'btn btn-outline-secondary';
            printButton.innerHTML = '<i class="bi bi-printer"></i> Print Report';
            printButton.onclick = () => this.printReport('advanced');
            
            actionsContainer.appendChild(printButton);
            
            resultsSection.appendChild(actionsContainer);
        }
    }
    
    /**
     * Display retirement scenarios
     * 
     * @param {Object} scenarios - Map of scenario names to descriptions
     */
    displayScenarios(scenarios) {
        const container = document.getElementById('scenariosContainer');
        container.innerHTML = '';
        
        // Create a card for each scenario
        for (const [name, description] of Object.entries(scenarios)) {
            const col = document.createElement('div');
            col.className = 'col-md-6 col-lg-4 mb-4';
            
            const card = document.createElement('div');
            card.className = 'card h-100 scenario-card';
            
            // Use a different style for the "No Change" scenario
            if (name === 'No Change') {
                card.className += ' border-primary';
            }
            
            const cardHeader = document.createElement('div');
            cardHeader.className = 'card-header bg-light';
            if (name === 'No Change') {
                cardHeader.className = 'card-header bg-light text-primary';
            }
            cardHeader.innerHTML = `<h5 class="mb-0">${name}</h5>`;
            
            const cardBody = document.createElement('div');
            cardBody.className = 'card-body';
            cardBody.innerHTML = description;
            
            const cardFooter = document.createElement('div');
            cardFooter.className = 'card-footer bg-white';
            
            const viewButton = document.createElement('button');
            viewButton.className = 'btn btn-sm btn-outline-primary';
            if (name === 'No Change') {
                viewButton.className = 'btn btn-sm btn-primary';
            }
            viewButton.textContent = 'View Year-by-Year Tracking';
            viewButton.dataset.scenarioName = name;
            viewButton.addEventListener('click', this.handleScenarioViewClick.bind(this));
            
            cardFooter.appendChild(viewButton);
            
            // Assemble card
            card.appendChild(cardHeader);
            card.appendChild(cardBody);
            card.appendChild(cardFooter);
            col.appendChild(card);
            
            // Add to container
            container.appendChild(col);
        }
    }
    
    /**
     * Handle click on View Year-by-Year Tracking button for a scenario
     * 
     * @param {Event} event - The click event
     */
    handleScenarioViewClick(event) {
        const scenarioName = event.target.dataset.scenarioName;
        
        // Get the current parameters from the advanced form
        const advancedForm = document.getElementById('advancedModeForm');
        const baseParams = RetirementParameters.fromAdvancedForm(advancedForm);
        
        // Create modified parameters based on the scenario selected
        let scenarioParams = this._createScenarioParameters(baseParams, scenarioName);
        
        // Show loading state
        this.showYearByYearTrackingModal(scenarioName);
        
        // Use setTimeout to allow the UI to update before starting calculations
        setTimeout(() => {
            // Generate year-by-year tracking
            const corpusTracker = new CorpusTracker();
            const projectedCorpus = this.monteCarloEngine.calculateProjectedCorpus(scenarioParams);
            
            const tracking = corpusTracker.generateYearlyTracking(
                scenarioParams, 
                scenarioParams.currentCorpus,
                progress => this.updateModalProgress(progress, 'Generating year-by-year tracking...')
            );
            
            // Update the modal content with tracking results
            this.displayYearByYearTracking(scenarioName, scenarioParams, tracking, projectedCorpus);
        }, 50);
    }
    
    /**
     * Show modal for year-by-year tracking
     * 
     * @param {string} scenarioName - Name of the scenario
     */
    showYearByYearTrackingModal(scenarioName) {
        // Create modal if it doesn't exist
        let modal = document.getElementById('trackingModal');
        if (!modal) {
            modal = document.createElement('div');
            modal.className = 'modal fade';
            modal.id = 'trackingModal';
            modal.tabIndex = '-1';
            modal.setAttribute('aria-labelledby', 'trackingModalLabel');
            modal.setAttribute('aria-hidden', 'true');
            
            const modalDialog = document.createElement('div');
            modalDialog.className = 'modal-dialog modal-lg';
            
            const modalContent = document.createElement('div');
            modalContent.className = 'modal-content';
            
            const modalHeader = document.createElement('div');
            modalHeader.className = 'modal-header';
            modalHeader.innerHTML = `
                <h5 class="modal-title" id="trackingModalLabel">Year-by-Year Tracking</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            `;
            
            const modalBody = document.createElement('div');
            modalBody.className = 'modal-body';
            modalBody.id = 'trackingModalBody';
            
            const progressContainer = document.createElement('div');
            progressContainer.className = 'progress-container mb-4';
            progressContainer.id = 'modalProgressContainer';
            
            const progressBar = document.createElement('div');
            progressBar.className = 'progress';
            
            const progressBarInner = document.createElement('div');
            progressBarInner.id = 'modalProgressBar';
            progressBarInner.className = 'progress-bar progress-bar-striped progress-bar-animated';
            progressBarInner.role = 'progressbar';
            progressBarInner.setAttribute('aria-valuenow', '0');
            progressBarInner.setAttribute('aria-valuemin', '0');
            progressBarInner.setAttribute('aria-valuemax', '100');
            progressBarInner.style.width = '0%';
            
            const progressText = document.createElement('div');
            progressText.id = 'modalProgressText';
            progressText.className = 'text-center text-muted mt-2';
            progressText.textContent = 'Calculating...';
            
            progressBar.appendChild(progressBarInner);
            progressContainer.appendChild(progressBar);
            progressContainer.appendChild(progressText);
            
            const trackingContent = document.createElement('div');
            trackingContent.id = 'trackingContent';
            trackingContent.style.display = 'none';
            
            modalBody.appendChild(progressContainer);
            modalBody.appendChild(trackingContent);
            
            const modalFooter = document.createElement('div');
            modalFooter.className = 'modal-footer';
            modalFooter.innerHTML = `
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
            `;
            
            modalContent.appendChild(modalHeader);
            modalContent.appendChild(modalBody);
            modalContent.appendChild(modalFooter);
            modalDialog.appendChild(modalContent);
            modal.appendChild(modalDialog);
            
            document.body.appendChild(modal);
        }
        
        // Update modal title
        const modalTitle = document.getElementById('trackingModalLabel');
        modalTitle.textContent = `Year-by-Year Tracking: ${scenarioName}`;
        
        // Reset progress and content
        document.getElementById('modalProgressBar').style.width = '0%';
        document.getElementById('modalProgressText').textContent = 'Initializing...';
        
        const trackingContent = document.getElementById('trackingContent');
        trackingContent.style.display = 'none';
        trackingContent.innerHTML = '';
        
        document.getElementById('modalProgressContainer').style.display = 'block';
        
        // Show modal
        const bsModal = new bootstrap.Modal(modal);
        bsModal.show();
    }
    
    /**
     * Update progress in the modal
     * 
     * @param {number} progress - Progress from 0 to 1
     * @param {string} message - Progress message
     */
    updateModalProgress(progress, message) {
        const progressBar = document.getElementById('modalProgressBar');
        const progressText = document.getElementById('modalProgressText');
        
        if (progressBar && progressText) {
            const percentage = Math.round(progress * 100);
            progressBar.style.width = `${percentage}%`;
            progressBar.setAttribute('aria-valuenow', percentage);
            progressText.textContent = message || 'Calculating...';
        }
    }
    
    /**
     * Display year-by-year tracking results in the modal
     * 
     * @param {string} scenarioName - Name of the scenario
     * @param {RetirementParameters} params - The scenario parameters
     * @param {Array<Object>} tracking - Year-by-year tracking data
     * @param {number} projectedCorpus - Projected corpus at retirement
     */
    displayYearByYearTracking(scenarioName, params, tracking, projectedCorpus) {
        // Hide progress and show content
        document.getElementById('modalProgressContainer').style.display = 'none';
        
        const trackingContent = document.getElementById('trackingContent');
        trackingContent.style.display = 'block';
        
        // Create canvas for chart
        const chartContainer = document.createElement('div');
        chartContainer.className = 'mb-4';
        
        const canvas = document.createElement('canvas');
        canvas.id = 'trackingChart';
        canvas.height = 300;
        chartContainer.appendChild(canvas);
        
        // Create table for tracking data
        const tableContainer = document.createElement('div');
        tableContainer.className = 'table-responsive';
        
        const table = document.createElement('table');
        table.className = 'table table-sm table-striped table-hover';
        
        // Create table header
        const thead = document.createElement('thead');
        thead.innerHTML = `
            <tr>
                <th>Year</th>
                <th>Age</th>
                <th>Median Corpus</th>
                <th>25th Percentile</th>
                <th>75th Percentile</th>
                <th>Annual Expense</th>
                <th>Depletion Risk</th>
            </tr>
        `;
        
        // Create table body
        const tbody = document.createElement('tbody');
        
        // Add rows for each year
        tracking.forEach(yearData => {
            const row = document.createElement('tr');
            
            // Highlight retirement year
            const isRetirementYear = params.currentAge + yearData.year === params.retirementAge;
            if (isRetirementYear) {
                row.className = 'table-primary';
            }
            
            row.innerHTML = `
                <td>${yearData.year + 1}</td>
                <td>${yearData.age}</td>
                <td>${FormatUtil.formatNumber(yearData.medianValue)}</td>
                <td>${FormatUtil.formatNumber(yearData.percentiles[25])}</td>
                <td>${FormatUtil.formatNumber(yearData.percentiles[75])}</td>
                <td>${FormatUtil.formatNumber(yearData.adjustedAnnualExpense)}</td>
                <td>${yearData.depletionRate.toFixed(1)}%</td>
            `;
            
            tbody.appendChild(row);
        });
        
        // Assemble table
        table.appendChild(thead);
        table.appendChild(tbody);
        tableContainer.appendChild(table);
        
        // Summary section
        const summaryContainer = document.createElement('div');
        summaryContainer.className = 'card mt-4';
        
        const summaryHeader = document.createElement('div');
        summaryHeader.className = 'card-header bg-light';
        summaryHeader.innerHTML = '<h6 class="mb-0">Scenario Summary</h6>';
        
        const summaryBody = document.createElement('div');
        summaryBody.className = 'card-body';
        
        // Create summary content
        const formatter = new Intl.NumberFormat('en-US', {
            style: 'decimal',
            maximumFractionDigits: 0
        });
        
        summaryBody.innerHTML = `
            <p><strong>Scenario:</strong> ${scenarioName}</p>
            <p><strong>Current Age:</strong> ${params.currentAge}</p>
            <p><strong>Retirement Age:</strong> ${params.retirementAge}</p>
            <p><strong>Projected Corpus at Retirement:</strong> ${formatter.format(projectedCorpus)}</p>
            <p><strong>Annual Contribution:</strong> ${formatter.format(params.annualContribution)}</p>
            <p><strong>Annual Expenses in Retirement:</strong> ${formatter.format(params.annualExpense)}</p>
            <p><strong>Investment Return:</strong> ${(params.expectedReturn * 100).toFixed(1)}% ± ${(params.standardDeviation * 100).toFixed(1)}%</p>
        `;
        
        // Assemble summary
        summaryContainer.appendChild(summaryHeader);
        summaryContainer.appendChild(summaryBody);
        
        // Add all elements to content container
        trackingContent.appendChild(chartContainer);
        trackingContent.appendChild(summaryContainer);
        trackingContent.appendChild(tableContainer);
        
        // Create chart
        const corpusTracker = new CorpusTracker();
        const chartData = corpusTracker.getChartData(tracking);
        
        const ctx = document.getElementById('trackingChart').getContext('2d');
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: chartData.labels,
                datasets: [
                    {
                        label: '10th Percentile',
                        data: chartData.percentile10Values,
                        borderColor: 'rgba(220, 53, 69, 0.5)',
                        backgroundColor: 'rgba(220, 53, 69, 0.1)',
                        borderWidth: 1,
                        fill: '+1'
                    },
                    {
                        label: '25th Percentile',
                        data: chartData.percentile25Values,
                        borderColor: 'rgba(255, 193, 7, 0.5)',
                        backgroundColor: 'rgba(255, 193, 7, 0.1)',
                        borderWidth: 1,
                        fill: '+1'
                    },
                    {
                        label: 'Median (50th)',
                        data: chartData.medianValues,
                        borderColor: 'rgba(13, 110, 253, 1)',
                        backgroundColor: 'rgba(13, 110, 253, 0.1)',
                        borderWidth: 2,
                        fill: '+1'
                    },
                    {
                        label: '75th Percentile',
                        data: chartData.percentile75Values,
                        borderColor: 'rgba(25, 135, 84, 0.5)',
                        backgroundColor: 'rgba(25, 135, 84, 0.1)',
                        borderWidth: 1,
                        fill: '+1'
                    },
                    {
                        label: '90th Percentile',
                        data: chartData.percentile90Values,
                        borderColor: 'rgba(13, 202, 240, 0.5)',
                        backgroundColor: 'rgba(13, 202, 240, 0.1)',
                        borderWidth: 1,
                        fill: false
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Projected Corpus by Age'
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `${context.dataset.label}: ${FormatUtil.formatNumber(context.raw)}`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: 'Age'
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'Corpus Value'
                        },
                        ticks: {
                            callback: function(value) {
                                return FormatUtil.formatNumberShort(value);
                            }
                        }
                    }
                }
            }
        });
        
        // Create an additional chart for inflation-adjusted expenses
        const expensesChartContainer = document.createElement('div');
        expensesChartContainer.className = 'mt-4';
        expensesChartContainer.innerHTML = '<h4 class="mb-3">Annual Expenses with Inflation</h4>';
        const expensesCanvas = document.createElement('canvas');
        expensesCanvas.id = 'expensesChart';
        expensesChartContainer.appendChild(expensesCanvas);
        
        // Add the chart container to the modal
        trackingContent.appendChild(expensesChartContainer);
        
        // Create expenses chart
        const expensesCtx = expensesCanvas.getContext('2d');
        new Chart(expensesCtx, {
            type: 'line',
            data: {
                labels: chartData.labels,
                datasets: [
                    {
                        label: 'Inflation-Adjusted Annual Expenses',
                        data: chartData.annualExpenses,
                        borderColor: 'rgba(255, 99, 132, 1)',
                        backgroundColor: 'rgba(255, 99, 132, 0.2)',
                        borderWidth: 2,
                        fill: true
                    }
                ]
            },
            options: {
                responsive: true,
                plugins: {
                    title: {
                        display: true,
                        text: 'Annual Expenses Adjusted for Inflation'
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `${context.dataset.label}: ${FormatUtil.formatNumber(context.raw)}`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: 'Age'
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'Amount'
                        },
                        ticks: {
                            callback: function(value) {
                                return FormatUtil.formatNumberShort(value);
                            }
                        }
                    }
                }
            }
        });
        
        // Add report actions buttons
        const actionsContainer = document.createElement('div');
        actionsContainer.className = 'mt-4 text-end';
        
        const printButton = document.createElement('button');
        printButton.className = 'btn btn-outline-secondary';
        printButton.innerHTML = '<i class="bi bi-printer"></i> Print Report';
        printButton.onclick = () => this.printTrackingReport(scenarioName);
        
        actionsContainer.appendChild(printButton);
        
        trackingContent.appendChild(actionsContainer);
    }
    
    /**
     * Create a status indicator showing success rate
     * 
     * @param {string} elementId - The ID of the container element
     * @param {number} successRate - The success rate (0-100)
     */
    createStatusIndicator(elementId, successRate) {
        const container = document.getElementById(elementId);
        container.innerHTML = '';
        
        const statusDiv = document.createElement('div');
        statusDiv.className = 'status-indicator';
        
        // Determine color based on success rate
        let statusColor;
        let statusText;
        
        if (successRate >= 90) {
            statusColor = 'success';
            statusText = 'Excellent';
        } else if (successRate >= 80) {
            statusColor = 'info';
            statusText = 'Good';
        } else if (successRate >= 70) {
            statusColor = 'primary';
            statusText = 'Moderate';
        } else if (successRate >= 50) {
            statusColor = 'warning';
            statusText = 'Caution';
        } else {
            statusColor = 'danger';
            statusText = 'At Risk';
        }
        
        // Create the success segment
        const successSegment = document.createElement('div');
        successSegment.className = `status-segment bg-${statusColor}`;
        successSegment.style.width = `${successRate}%`;
        
        // Create the failure segment
        const failureSegment = document.createElement('div');
        failureSegment.className = 'status-segment bg-secondary';
        failureSegment.style.width = `${100 - successRate}%`;
        
        // Add segments to indicator
        statusDiv.appendChild(successSegment);
        statusDiv.appendChild(failureSegment);
        
        // Add status text
        const statusTextDiv = document.createElement('div');
        statusTextDiv.className = `mt-2 text-${statusColor} text-center`;
        statusTextDiv.innerHTML = `<strong>${statusText}</strong> (${successRate.toFixed(1)}% Success Rate)`;
        
        // Add to container
        container.appendChild(statusDiv);
        container.appendChild(statusTextDiv);
    }
    
    /**
     * Display retirement scenarios
     * 
     * @param {Object} scenarios - Map of scenario names to descriptions
     */
    displayScenarios(scenarios) {
        const container = document.getElementById('scenariosContainer');
        container.innerHTML = '';
        
        // Create a card for each scenario
        for (const [name, description] of Object.entries(scenarios)) {
            const col = document.createElement('div');
            col.className = 'col-md-6 col-lg-4 mb-4';
            
            const card = document.createElement('div');
            card.className = 'card h-100 scenario-card';
            
            // Use a different style for the "No Change" scenario
            if (name === 'No Change') {
                card.className += ' border-primary';
            }
            
            const cardHeader = document.createElement('div');
            cardHeader.className = 'card-header bg-light';
            if (name === 'No Change') {
                cardHeader.className = 'card-header bg-light text-primary';
            }
            cardHeader.innerHTML = `<h5 class="mb-0">${name}</h5>`;
            
            const cardBody = document.createElement('div');
            cardBody.className = 'card-body';
            cardBody.innerHTML = description;
            
            const cardFooter = document.createElement('div');
            cardFooter.className = 'card-footer bg-white';
            
            const viewButton = document.createElement('button');
            viewButton.className = 'btn btn-sm btn-outline-primary';
            if (name === 'No Change') {
                viewButton.className = 'btn btn-sm btn-primary';
            }
            viewButton.textContent = 'View Year-by-Year Tracking';
            viewButton.dataset.scenarioName = name;
            viewButton.addEventListener('click', this.handleScenarioViewClick.bind(this));
            
            cardFooter.appendChild(viewButton);
            
            // Assemble card
            card.appendChild(cardHeader);
            card.appendChild(cardBody);
            card.appendChild(cardFooter);
            col.appendChild(card);
            
            // Add to container
            container.appendChild(col);
        }
    }
    
    /**
     * Handle click on View Year-by-Year Tracking button for a scenario
     * 
     * @param {Event} event - The click event
     */
    handleScenarioViewClick(event) {
        const scenarioName = event.target.dataset.scenarioName;
        
        // Get the current parameters from the advanced form
        const advancedForm = document.getElementById('advancedModeForm');
        const baseParams = RetirementParameters.fromAdvancedForm(advancedForm);
        
        // Create modified parameters based on the scenario selected
        let scenarioParams = this._createScenarioParameters(baseParams, scenarioName);
        
        // Show loading state
        this.showYearByYearTrackingModal(scenarioName);
        
        // Use setTimeout to allow the UI to update before starting calculations
        setTimeout(() => {
            // Generate year-by-year tracking
            const corpusTracker = new CorpusTracker();
            const projectedCorpus = this.monteCarloEngine.calculateProjectedCorpus(scenarioParams);
            
            const tracking = corpusTracker.generateYearlyTracking(
                scenarioParams, 
                scenarioParams.currentCorpus,
                progress => this.updateModalProgress(progress, 'Generating year-by-year tracking...')
            );
            
            // Update the modal content with tracking results
            this.displayYearByYearTracking(scenarioName, scenarioParams, tracking, projectedCorpus);
        }, 50);
    }
    
    /**
     * Show modal for year-by-year tracking
     * 
     * @param {string} scenarioName - Name of the scenario
     */
    showYearByYearTrackingModal(scenarioName) {
        // Create modal if it doesn't exist
        let modal = document.getElementById('trackingModal');
        if (!modal) {
            modal = document.createElement('div');
            modal.className = 'modal fade';
            modal.id = 'trackingModal';
            modal.tabIndex = '-1';
            modal.setAttribute('aria-labelledby', 'trackingModalLabel');
            modal.setAttribute('aria-hidden', 'true');
            
            const modalDialog = document.createElement('div');
            modalDialog.className = 'modal-dialog modal-lg';
            
            const modalContent = document.createElement('div');
            modalContent.className = 'modal-content';
            
            const modalHeader = document.createElement('div');
            modalHeader.className = 'modal-header';
            modalHeader.innerHTML = `
                <h5 class="modal-title" id="trackingModalLabel">Year-by-Year Tracking</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            `;
            
            const modalBody = document.createElement('div');
            modalBody.className = 'modal-body';
            modalBody.id = 'trackingModalBody';
            
            const progressContainer = document.createElement('div');
            progressContainer.className = 'progress-container mb-4';
            progressContainer.id = 'modalProgressContainer';
            
            const progressBar = document.createElement('div');
            progressBar.className = 'progress';
            
            const progressBarInner = document.createElement('div');
            progressBarInner.id = 'modalProgressBar';
            progressBarInner.className = 'progress-bar progress-bar-striped progress-bar-animated';
            progressBarInner.role = 'progressbar';
            progressBarInner.setAttribute('aria-valuenow', '0');
            progressBarInner.setAttribute('aria-valuemin', '0');
            progressBarInner.setAttribute('aria-valuemax', '100');
            progressBarInner.style.width = '0%';
            
            const progressText = document.createElement('div');
            progressText.id = 'modalProgressText';
            progressText.className = 'text-center text-muted mt-2';
            progressText.textContent = 'Calculating...';
            
            progressBar.appendChild(progressBarInner);
            progressContainer.appendChild(progressBar);
            progressContainer.appendChild(progressText);
            
            const trackingContent = document.createElement('div');
            trackingContent.id = 'trackingContent';
            trackingContent.style.display = 'none';
            
            modalBody.appendChild(progressContainer);
            modalBody.appendChild(trackingContent);
            
            const modalFooter = document.createElement('div');
            modalFooter.className = 'modal-footer';
            modalFooter.innerHTML = `
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
            `;
            
            modalContent.appendChild(modalHeader);
            modalContent.appendChild(modalBody);
            modalContent.appendChild(modalFooter);
            modalDialog.appendChild(modalContent);
            modal.appendChild(modalDialog);
            
            document.body.appendChild(modal);
        }
        
        // Update modal title
        const modalTitle = document.getElementById('trackingModalLabel');
        modalTitle.textContent = `Year-by-Year Tracking: ${scenarioName}`;
        
        // Reset progress and content
        document.getElementById('modalProgressBar').style.width = '0%';
        document.getElementById('modalProgressText').textContent = 'Initializing...';
        
        const trackingContent = document.getElementById('trackingContent');
        trackingContent.style.display = 'none';
        trackingContent.innerHTML = '';
        
        document.getElementById('modalProgressContainer').style.display = 'block';
        
        // Show modal
        const bsModal = new bootstrap.Modal(modal);
        bsModal.show();
    }
    
    /**
     * Update progress in the modal
     * 
     * @param {number} progress - Progress from 0 to 1
     * @param {string} message - Progress message
     */
    updateModalProgress(progress, message) {
        const progressBar = document.getElementById('modalProgressBar');
        const progressText = document.getElementById('modalProgressText');
        
        if (progressBar && progressText) {
            const percentage = Math.round(progress * 100);
            progressBar.style.width = `${percentage}%`;
            progressBar.setAttribute('aria-valuenow', percentage);
            progressText.textContent = message || 'Calculating...';
        }
    }
    
    /**
     * Display year-by-year tracking results in the modal
     * 
     * @param {string} scenarioName - Name of the scenario
     * @param {RetirementParameters} params - The scenario parameters
     * @param {Array<Object>} tracking - Year-by-year tracking data
     * @param {number} projectedCorpus - Projected corpus at retirement
     */
    displayYearByYearTracking(scenarioName, params, tracking, projectedCorpus) {
        // Hide progress and show content
        document.getElementById('modalProgressContainer').style.display = 'none';
        
        const trackingContent = document.getElementById('trackingContent');
        trackingContent.style.display = 'block';
        
        // Create canvas for chart
        const chartContainer = document.createElement('div');
        chartContainer.className = 'mb-4';
        
        const canvas = document.createElement('canvas');
        canvas.id = 'trackingChart';
        canvas.height = 300;
        chartContainer.appendChild(canvas);
        
        // Create table for tracking data
        const tableContainer = document.createElement('div');
        tableContainer.className = 'table-responsive';
        
        const table = document.createElement('table');
        table.className = 'table table-sm table-striped table-hover';
        
        // Create table header
        const thead = document.createElement('thead');
        thead.innerHTML = `
            <tr>
                <th>Year</th>
                <th>Age</th>
                <th>Median Corpus</th>
                <th>25th Percentile</th>
                <th>75th Percentile</th>
                <th>Annual Expense</th>
                <th>Depletion Risk</th>
            </tr>
        `;
        
        // Create table body
        const tbody = document.createElement('tbody');
        
        // Add rows for each year
        tracking.forEach(yearData => {
            const row = document.createElement('tr');
            
            // Highlight retirement year
            const isRetirementYear = params.currentAge + yearData.year === params.retirementAge;
            if (isRetirementYear) {
                row.className = 'table-primary';
            }
            
            row.innerHTML = `
                <td>${yearData.year + 1}</td>
                <td>${yearData.age}</td>
                <td>${FormatUtil.formatNumber(yearData.medianValue)}</td>
                <td>${FormatUtil.formatNumber(yearData.percentiles[25])}</td>
                <td>${FormatUtil.formatNumber(yearData.percentiles[75])}</td>
                <td>${FormatUtil.formatNumber(yearData.adjustedAnnualExpense)}</td>
                <td>${yearData.depletionRate.toFixed(1)}%</td>
            `;
            
            tbody.appendChild(row);
        });
        
        // Assemble table
        table.appendChild(thead);
        table.appendChild(tbody);
        tableContainer.appendChild(table);
        
        // Summary section
        const summaryContainer = document.createElement('div');
        summaryContainer.className = 'card mt-4';
        
        const summaryHeader = document.createElement('div');
        summaryHeader.className = 'card-header bg-light';
        summaryHeader.innerHTML = '<h6 class="mb-0">Scenario Summary</h6>';
        
        const summaryBody = document.createElement('div');
        summaryBody.className = 'card-body';
        
        // Create summary content
        const formatter = new Intl.NumberFormat('en-US', {
            style: 'decimal',
            maximumFractionDigits: 0
        });
        
        summaryBody.innerHTML = `
            <p><strong>Scenario:</strong> ${scenarioName}</p>
            <p><strong>Current Age:</strong> ${params.currentAge}</p>
            <p><strong>Retirement Age:</strong> ${params.retirementAge}</p>
            <p><strong>Projected Corpus at Retirement:</strong> ${formatter.format(projectedCorpus)}</p>
            <p><strong>Annual Contribution:</strong> ${formatter.format(params.annualContribution)}</p>
            <p><strong>Annual Expenses in Retirement:</strong> ${formatter.format(params.annualExpense)}</p>
            <p><strong>Investment Return:</strong> ${(params.expectedReturn * 100).toFixed(1)}% ± ${(params.standardDeviation * 100).toFixed(1)}%</p>
        `;
        
        // Assemble summary
        summaryContainer.appendChild(summaryHeader);
        summaryContainer.appendChild(summaryBody);
        
        // Add all elements to content container
        trackingContent.appendChild(chartContainer);
        trackingContent.appendChild(summaryContainer);
        trackingContent.appendChild(tableContainer);
        
        // Create chart
        const corpusTracker = new CorpusTracker();
        const chartData = corpusTracker.getChartData(tracking);
        
        const ctx = document.getElementById('trackingChart').getContext('2d');
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: chartData.labels,
                datasets: [
                    {
                        label: '10th Percentile',
                        data: chartData.percentile10Values,
                        borderColor: 'rgba(220, 53, 69, 0.5)',
                        backgroundColor: 'rgba(220, 53, 69, 0.1)',
                        borderWidth: 1,
                        fill: '+1'
                    },
                    {
                        label: '25th Percentile',
                        data: chartData.percentile25Values,
                        borderColor: 'rgba(255, 193, 7, 0.5)',
                        backgroundColor: 'rgba(255, 193, 7, 0.1)',
                        borderWidth: 1,
                        fill: '+1'
                    },
                    {
                        label: 'Median (50th)',
                        data: chartData.medianValues,
                        borderColor: 'rgba(13, 110, 253, 1)',
                        backgroundColor: 'rgba(13, 110, 253, 0.1)',
                        borderWidth: 2,
                        fill: '+1'
                    },
                    {
                        label: '75th Percentile',
                        data: chartData.percentile75Values,
                        borderColor: 'rgba(25, 135, 84, 0.5)',
                        backgroundColor: 'rgba(25, 135, 84, 0.1)',
                        borderWidth: 1,
                        fill: '+1'
                    },
                    {
                        label: '90th Percentile',
                        data: chartData.percentile90Values,
                        borderColor: 'rgba(13, 202, 240, 0.5)',
                        backgroundColor: 'rgba(13, 202, 240, 0.1)',
                        borderWidth: 1,
                        fill: false
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Projected Corpus by Age'
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `${context.dataset.label}: ${FormatUtil.formatNumber(context.raw)}`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: 'Age'
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'Corpus Value'
                        },
                        ticks: {
                            callback: function(value) {
                                return FormatUtil.formatNumberShort(value);
                            }
                        }
                    }
                }
            }
        });
        
        // Create an additional chart for inflation-adjusted expenses
        const expensesChartContainer = document.createElement('div');
        expensesChartContainer.className = 'mt-4';
        expensesChartContainer.innerHTML = '<h4 class="mb-3">Annual Expenses with Inflation</h4>';
        const expensesCanvas = document.createElement('canvas');
        expensesCanvas.id = 'expensesChart';
        expensesChartContainer.appendChild(expensesCanvas);
        
        // Add the chart container to the modal
        trackingContent.appendChild(expensesChartContainer);
        
        // Create expenses chart
        const expensesCtx = expensesCanvas.getContext('2d');
        new Chart(expensesCtx, {
            type: 'line',
            data: {
                labels: chartData.labels,
                datasets: [
                    {
                        label: 'Inflation-Adjusted Annual Expenses',
                        data: chartData.annualExpenses,
                        borderColor: 'rgba(255, 99, 132, 1)',
                        backgroundColor: 'rgba(255, 99, 132, 0.2)',
                        borderWidth: 2,
                        fill: true
                    }
                ]
            },
            options: {
                responsive: true,
                plugins: {
                    title: {
                        display: true,
                        text: 'Annual Expenses Adjusted for Inflation'
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `${context.dataset.label}: ${FormatUtil.formatNumber(context.raw)}`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: 'Age'
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'Amount'
                        },
                        ticks: {
                            callback: function(value) {
                                return FormatUtil.formatNumberShort(value);
                            }
                        }
                    }
                }
            }
        });
        
        // Add report actions buttons
        const actionsContainer = document.createElement('div');
        actionsContainer.className = 'mt-4 text-end';
        
        const printButton = document.createElement('button');
        printButton.className = 'btn btn-outline-secondary';
        printButton.innerHTML = '<i class="bi bi-printer"></i> Print Report';
        printButton.onclick = () => this.printTrackingReport(scenarioName);
        
        actionsContainer.appendChild(printButton);
        
        trackingContent.appendChild(actionsContainer);
    }
    
    /**
     * Create scenario parameters based on scenario name
     * 
     * @param {RetirementParameters} baseParams - The base parameters
     * @param {string} scenarioName - The name of the scenario
     * @returns {RetirementParameters} Modified parameters for the scenario
     * @private
     */
    _createScenarioParameters(baseParams, scenarioName) {
        // Clone base parameters
        const params = new RetirementParameters(
            baseParams.annualExpense,
            baseParams.retirementPeriod,
            baseParams.expectedReturn,
            baseParams.standardDeviation,
            baseParams.inflation,
            baseParams.adjustForInflation,
            baseParams.numSimulations
        );
        
        params.setAdvancedParameters(
            baseParams.currentAge,
            baseParams.retirementAge,
            baseParams.lifeExpectancy,
            baseParams.currentCorpus,
            baseParams.annualContribution,
            baseParams.additionalRetirementIncome,
            baseParams.targetSuccessRate
        );
        
        // Modify parameters based on scenario
        switch (scenarioName) {
            case 'No Change':
                // No changes needed - use parameters as-is
                break;
                
            case 'Delay Retirement':
                params.setAdvancedParameters(
                    baseParams.currentAge,
                    baseParams.retirementAge + 2,  // Delay by 2 years
                    baseParams.lifeExpectancy,
                    baseParams.currentCorpus,
                    baseParams.annualContribution,
                    baseParams.additionalRetirementIncome,
                    baseParams.targetSuccessRate
                );
                break;
                
            case 'Increase Contributions':
                params.setAdvancedParameters(
                    baseParams.currentAge,
                    baseParams.retirementAge,
                    baseParams.lifeExpectancy,
                    baseParams.currentCorpus,
                    baseParams.annualContribution * 1.2,  // Increase by 20%
                    baseParams.additionalRetirementIncome,
                    baseParams.targetSuccessRate
                );
                break;
                
            case 'Reduce Expenses':
                params.annualExpense = baseParams.annualExpense * 0.9;  // Reduce by 10%
                break;
                
            case 'Additional Income':
                params.setAdvancedParameters(
                    baseParams.currentAge,
                    baseParams.retirementAge,
                    baseParams.lifeExpectancy,
                    baseParams.currentCorpus,
                    baseParams.annualContribution,
                    baseParams.additionalRetirementIncome + baseParams.annualExpense * 0.1,  // Add 10% of expenses
                    baseParams.targetSuccessRate
                );
                break;
                
            case 'Optimize Investments':
                params.expectedReturn = baseParams.expectedReturn + 0.005;  // 0.5% improvement
                params.standardDeviation = baseParams.standardDeviation - 0.005;  // 0.5% reduction
                break;
        }
        
        return params;
    }
    
    /**
     * Show loading state
     * 
     * @param {string} mode - 'basic' or 'advanced'
     */
    showLoading(mode) {
        const resultsSection = document.getElementById(`${mode}Results`);
        resultsSection.style.display = 'block';
        
        // Create progress container if it doesn't exist
        let progressContainer = document.getElementById(`${mode}ProgressContainer`);
        if (!progressContainer) {
            progressContainer = document.createElement('div');
            progressContainer.id = `${mode}ProgressContainer`;
            progressContainer.className = 'progress-container';
            
            const progressBar = document.createElement('div');
            progressBar.className = 'progress';
            
            const progressBarInner = document.createElement('div');
            progressBarInner.id = `${mode}ProgressBar`;
            progressBarInner.className = 'progress-bar progress-bar-striped progress-bar-animated';
            progressBarInner.role = 'progressbar';
            progressBarInner.setAttribute('aria-valuenow', '0');
            progressBarInner.setAttribute('aria-valuemin', '0');
            progressBarInner.setAttribute('aria-valuemax', '100');
            progressBarInner.style.width = '0%';
            
            const progressText = document.createElement('div');
            progressText.id = `${mode}ProgressText`;
            progressText.className = 'text-center text-muted mt-2';
            progressText.textContent = 'Calculating...';
            
            progressBar.appendChild(progressBarInner);
            progressContainer.appendChild(progressBar);
            progressContainer.appendChild(progressText);
            
            resultsSection.appendChild(progressContainer);
        }
        
        // Hide any existing results
        const elements = resultsSection.querySelectorAll(':scope > *:not(#' + progressContainer.id + ')');
        elements.forEach(el => {
            el.style.display = 'none';
        });
    }
    
    /**
     * Update progress bar
     * 
     * @param {string} mode - 'basic' or 'advanced'
     * @param {number} progress - Progress from 0 to 1
     * @param {string} message - Progress message
     */
    updateProgress(mode, progress, message) {
        const progressBar = document.getElementById(`${mode}ProgressBar`);
        const progressText = document.getElementById(`${mode}ProgressText`);
        
        if (progressBar && progressText) {
            const percentage = Math.round(progress * 100);
            progressBar.style.width = `${percentage}%`;
            progressBar.setAttribute('aria-valuenow', percentage);
            progressText.textContent = message || 'Calculating...';
        }
    }
    
    /**
     * Hide loading state
     * 
     * @param {string} mode - 'basic' or 'advanced'
     */
    hideLoading(mode) {
        const progressContainer = document.getElementById(`${mode}ProgressContainer`);
        if (progressContainer) {
            progressContainer.style.display = 'none';
        }
        
        // Show all elements in the results section
        const resultsSection = document.getElementById(`${mode}Results`);
        const elements = resultsSection.querySelectorAll(':scope > *:not(#' + `${mode}ProgressContainer` + ')');
        elements.forEach(el => {
            el.style.display = '';
        });
    }
    
    /**
     * Resize charts in a tab
     * 
     * @param {string} tabSelector - Tab selector
     */
    resizeChartsInTab(tabSelector) {
        const tab = document.querySelector(tabSelector);
        if (tab) {
            const canvases = tab.querySelectorAll('canvas');
            canvases.forEach(canvas => {
                const chart = Chart.getChart(canvas);
                if (chart) {
                    chart.resize();
                }
            });
        }
    }
    
    /**
     * Save parameters to localStorage
     */
    saveParametersToLocalStorage() {
        // Basic mode parameters
        const basicForm = document.getElementById('basicModeForm');
        const advancedForm = document.getElementById('advancedModeForm');
        
        if (basicForm && advancedForm) {
            const savedParams = {
                basic: {
                    annualExpense: basicForm.querySelector('#annualExpense').value,
                    retirementPeriod: basicForm.querySelector('#retirementPeriod').value,
                    expectedReturn: basicForm.querySelector('#expectedReturn').value,
                    stdDev: basicForm.querySelector('#stdDev').value,
                    inflation: basicForm.querySelector('#inflation').value,
                    adjustForInflation: basicForm.querySelector('#adjustForInflation').checked,
                    numSimulations: basicForm.querySelector('#numSimulations').value
                },
                advanced: {
                    currentAge: advancedForm.querySelector('#currentAge').value,
                    retirementAge: advancedForm.querySelector('#retirementAge').value,
                    lifeExpectancy: advancedForm.querySelector('#lifeExpectancy').value,
                    currentCorpus: advancedForm.querySelector('#currentCorpus').value,
                    annualExpense: advancedForm.querySelector('#advAnnualExpense').value,
                    annualContribution: advancedForm.querySelector('#annualContribution').value,
                    additionalIncome: advancedForm.querySelector('#additionalIncome').value,
                    expectedReturn: advancedForm.querySelector('#advExpectedReturn').value,
                    stdDev: advancedForm.querySelector('#advStdDev').value,
                    inflation: advancedForm.querySelector('#advInflation').value,
                    targetSuccessRate: advancedForm.querySelector('#targetSuccessRate').value,
                    numSimulations: advancedForm.querySelector('#advNumSimulations').value
                }
            };
            
            try {
                localStorage.setItem('stochasticCalculatorParams', JSON.stringify(savedParams));
            } catch (e) {
                console.error('Error saving parameters to localStorage:', e);
            }
        }
    }
    
    /**
     * Load saved parameters from localStorage
     */
    loadSavedParameters() {
        try {
            const savedParams = JSON.parse(localStorage.getItem('stochasticCalculatorParams'));
            if (!savedParams) return;
            
            // Load basic mode parameters
            if (savedParams.basic) {
                const basicForm = document.getElementById('basicModeForm');
                if (basicForm) {
                    basicForm.querySelector('#annualExpense').value = savedParams.basic.annualExpense || 60000;
                    basicForm.querySelector('#retirementPeriod').value = savedParams.basic.retirementPeriod || 30;
                    basicForm.querySelector('#expectedReturn').value = savedParams.basic.expectedReturn || 7;
                    basicForm.querySelector('#stdDev').value = savedParams.basic.stdDev || 10;
                    basicForm.querySelector('#inflation').value = savedParams.basic.inflation || 3;
                    basicForm.querySelector('#adjustForInflation').checked = 
                        savedParams.basic.adjustForInflation !== undefined ? 
                        savedParams.basic.adjustForInflation : true;
                    basicForm.querySelector('#numSimulations').value = savedParams.basic.numSimulations || 5000;
                }
            }
            
            // Load advanced mode parameters
            if (savedParams.advanced) {
                const advancedForm = document.getElementById('advancedModeForm');
                if (advancedForm) {
                    advancedForm.querySelector('#currentAge').value = savedParams.advanced.currentAge || 40;
                    advancedForm.querySelector('#retirementAge').value = savedParams.advanced.retirementAge || 65;
                    advancedForm.querySelector('#lifeExpectancy').value = savedParams.advanced.lifeExpectancy || 90;
                    advancedForm.querySelector('#currentCorpus').value = savedParams.advanced.currentCorpus || 500000;
                    advancedForm.querySelector('#advAnnualExpense').value = savedParams.advanced.annualExpense || 80000;
                    advancedForm.querySelector('#annualContribution').value = savedParams.advanced.annualContribution || 30000;
                    advancedForm.querySelector('#additionalIncome').value = savedParams.advanced.additionalIncome || 20000;
                    advancedForm.querySelector('#advExpectedReturn').value = savedParams.advanced.expectedReturn || 7;
                    advancedForm.querySelector('#advStdDev').value = savedParams.advanced.stdDev || 10;
                    advancedForm.querySelector('#advInflation').value = savedParams.advanced.inflation || 3;
                    advancedForm.querySelector('#targetSuccessRate').value = savedParams.advanced.targetSuccessRate || 85;
                    advancedForm.querySelector('#advNumSimulations').value = savedParams.advanced.numSimulations || 5000;
                }
            }
        } catch (e) {
            console.error('Error loading parameters from localStorage:', e);
        }
    }
    
    /**
     * Print report
     * 
     * @param {string} mode - 'basic' or 'advanced'
     */
    printReport(mode) {
        // Get form data
        const form = document.getElementById(mode === 'basic' ? 'basicModeForm' : 'advancedModeForm');
        const params = mode === 'basic' ? 
            RetirementParameters.fromBasicForm(form) : 
            RetirementParameters.fromAdvancedForm(form);
            
        // Prepare content for printing
        const contentId = mode === 'basic' ? 'basicResults' : 'advancedResults';
        const content = document.getElementById(contentId).cloneNode(true);
        
        // Remove action buttons for printing
        const actionsContainer = content.querySelector(`#${mode}ReportActions`);
        if (actionsContainer) {
            actionsContainer.remove();
        }
        
        // Format parameters for display
        const inputParamsHtml = this._formatInputParametersHtml(params, mode);
        
        // Capture chart images
        const chartPromises = [];
        const chartContainers = content.querySelectorAll('canvas');
        
        chartContainers.forEach((canvas, index) => {
            const promise = new Promise(resolve => {
                // Skip if the canvas is not a real chart
                if (!canvas.id) {
                    resolve(null);
                    return;
                }
                
                // Get the chart instance
                const chart = Chart.getChart(canvas.id);
                if (!chart) {
                    resolve(null);
                    return;
                }
                
                // Convert chart to image
                const image = new Image();
                image.src = chart.toBase64Image();
                image.className = 'img-fluid';
                image.style.maxWidth = '100%';
                
                // Create a container for the image
                const container = document.createElement('div');
                container.className = 'chart-image-container mb-4';
                container.appendChild(image);
                
                resolve({ id: canvas.id, container });
            });
            
            chartPromises.push(promise);
        });
        
        // Wait for all chart images to be created
        Promise.all(chartPromises).then(results => {
            // Create and style print window
            const printWindow = window.open('', '_blank');
            printWindow.document.write(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Retirement Calculator Report</title>
                    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0-alpha1/dist/css/bootstrap.min.css" rel="stylesheet">
                    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.3/font/bootstrap-icons.css">
                    <style>
                        body { padding: 20px; }
                        @media print {
                            .no-print { display: none; }
                            .page-break { page-break-before: always; }
                        }
                        .table-params th {
                            width: 40%;
                        }
                        .chart-image-container {
                            text-align: center;
                            margin-bottom: 1rem;
                        }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <h2 class="mb-4">Retirement Corpus Stochastic Calculator Report</h2>
                        <h4 class="text-muted mb-4">${mode === 'basic' ? 'Basic Mode' : 'Advanced Mode'} - ${new Date().toLocaleDateString()}</h4>
                        
                        <h5 class="mt-5 mb-3">Input Parameters</h5>
                        ${inputParamsHtml}
                        
                        <h5 class="mt-5 mb-3 page-break">Simulation Results</h5>
                        <div id="reportContent" class="mt-4"></div>
                        
                        <div id="chartImages" class="mt-5"></div>
                        
                        <div class="mt-5 text-center no-print">
                            <button class="btn btn-primary" onclick="window.print()">Print Report</button>
                            <button class="btn btn-secondary ms-2" onclick="window.close()">Close</button>
                        </div>
                    </div>
                </body>
                </html>
            `);
            
            // Replace canvas elements with images in the content
            results.forEach(result => {
                if (!result) return;
                
                const canvas = content.querySelector(`#${result.id}`);
                if (canvas && canvas.parentNode) {
                    // Insert the image in the main content if the canvas exists
                    canvas.parentNode.appendChild(result.container);
                    canvas.remove();
                } else {
                    // Otherwise add to the chartImages section
                    printWindow.document.getElementById('chartImages').appendChild(result.container);
                }
            });
            
            // Add content to print window
            printWindow.document.getElementById('reportContent').appendChild(content);
            
            // Close the document and focus
            printWindow.document.close();
            printWindow.focus();
        });
    }
    
    /**
     * Print year-by-year tracking report
     * 
     * @param {string} scenarioName - Name of the scenario
     */
    printTrackingReport(scenarioName) {
        // Get the current parameters from the advanced form
        const advancedForm = document.getElementById('advancedModeForm');
        const baseParams = RetirementParameters.fromAdvancedForm(advancedForm);
        
        // Create modified parameters based on the scenario selected
        const scenarioParams = this._createScenarioParameters(baseParams, scenarioName);
        
        // Clone the tracking content
        const content = document.getElementById('trackingContent').cloneNode(true);
        
        // Remove action buttons
        const actionsContainer = content.querySelector('.text-end');
        if (actionsContainer) {
            actionsContainer.remove();
        }
        
        // Format parameters for display
        const inputParamsHtml = this._formatScenarioParametersHtml(scenarioParams, scenarioName);
        
        // Capture chart images
        const chartCanvases = content.querySelectorAll('canvas');
        const chartPromises = [];
        
        chartCanvases.forEach((canvas, index) => {
            const promise = new Promise(resolve => {
                // Skip if the canvas is not a real chart
                if (!canvas.id) {
                    resolve(null);
                    return;
                }
                
                // Get the chart instance
                const chart = Chart.getChart(canvas.id);
                if (!chart) {
                    resolve(null);
                    return;
                }
                
                // Convert chart to image
                const image = new Image();
                image.src = chart.toBase64Image();
                image.className = 'img-fluid';
                image.style.maxWidth = '100%';
                
                // Create a container for the image
                const container = document.createElement('div');
                container.className = 'chart-image-container mb-4';
                container.appendChild(image);
                
                resolve({ id: canvas.id, container });
            });
            
            chartPromises.push(promise);
        });
        
        // Wait for all chart images to be created
        Promise.all(chartPromises).then(results => {
            // Create and style print window
            const printWindow = window.open('', '_blank');
            printWindow.document.write(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Year-by-Year Tracking Report</title>
                    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0-alpha1/dist/css/bootstrap.min.css" rel="stylesheet">
                    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.3/font/bootstrap-icons.css">
                    <style>
                        body { padding: 20px; }
                        @media print {
                            .no-print { display: none; }
                            .page-break { page-break-before: always; }
                        }
                        .table-params th {
                            width: 40%;
                        }
                        .chart-image-container {
                            text-align: center;
                            margin-bottom: 1rem;
                        }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <h2 class="mb-4">Year-by-Year Corpus Tracking</h2>
                        <h4 class="text-muted mb-4">Scenario: ${scenarioName} - ${new Date().toLocaleDateString()}</h4>
                        
                        <h5 class="mt-5 mb-3">Scenario Parameters</h5>
                        ${inputParamsHtml}
                        
                        <h5 class="mt-5 mb-3 page-break">Tracking Results</h5>
                        <div id="reportContent" class="mt-4"></div>
                        
                        <div id="chartImages" class="mt-5"></div>
                        
                        <div class="mt-5 text-center no-print">
                            <button class="btn btn-primary" onclick="window.print()">Print Report</button>
                            <button class="btn btn-secondary ms-2" onclick="window.close()">Close</button>
                        </div>
                    </div>
                </body>
                </html>
            `);
            
            // Replace canvas elements with images in the content
            results.forEach(result => {
                if (!result) return;
                
                const canvas = content.querySelector(`#${result.id}`);
                if (canvas && canvas.parentNode) {
                    // Replace canvas with image
                    canvas.parentNode.replaceChild(result.container, canvas);
                } else {
                    // Otherwise add to the chartImages section
                    printWindow.document.getElementById('chartImages').appendChild(result.container);
                }
            });
            
            // Add content to print window
            printWindow.document.getElementById('reportContent').appendChild(content);
            
            // Close the document and focus
            printWindow.document.close();
            printWindow.focus();
        });
    }
    
    /**
     * Create simulation status bar
     * 
     * @param {string} mode - 'basic' or 'advanced'
     */
    createSimulationStatus(mode) {
        const resultSection = document.getElementById(`${mode}Results`);
        
        // Create status container if it doesn't exist
        let statusContainer = document.getElementById(`${mode}SimulationStatus`);
        if (!statusContainer) {
            statusContainer = document.createElement('div');
            statusContainer.id = `${mode}SimulationStatus`;
            statusContainer.className = 'alert alert-info mt-3';
            
            const statusContent = document.createElement('div');
            statusContent.className = 'd-flex align-items-center';
            
            const spinner = document.createElement('div');
            spinner.className = 'spinner-border spinner-border-sm me-2';
            spinner.setAttribute('role', 'status');
            
            const statusText = document.createElement('div');
            statusText.id = `${mode}SimulationStatusText`;
            statusText.className = 'me-auto';
            statusText.textContent = 'Initializing simulation...';
            
            const statusProgress = document.createElement('div');
            statusProgress.className = 'progress ms-2';
            statusProgress.style.width = '100px';
            statusProgress.style.height = '10px';
            
            const statusProgressBar = document.createElement('div');
            statusProgressBar.id = `${mode}SimulationStatusProgress`;
            statusProgressBar.className = 'progress-bar';
            statusProgressBar.setAttribute('role', 'progressbar');
            statusProgressBar.setAttribute('aria-valuenow', '0');
            statusProgressBar.setAttribute('aria-valuemin', '0');
            statusProgressBar.setAttribute('aria-valuemax', '100');
            statusProgressBar.style.width = '0%';
            
            statusProgress.appendChild(statusProgressBar);
            statusContent.appendChild(spinner);
            statusContent.appendChild(statusText);
            statusContent.appendChild(statusProgress);
            statusContainer.appendChild(statusContent);
            
            resultSection.appendChild(statusContainer);
        }
        
        statusContainer.style.display = 'block';
        document.getElementById(`${mode}SimulationStatusText`).textContent = 'Initializing simulation...';
        document.getElementById(`${mode}SimulationStatusProgress`).style.width = '0%';
    }
    
    /**
     * Update simulation status
     * 
     * @param {string} mode - 'basic' or 'advanced'
     * @param {string} message - Status message
     * @param {number} progress - Progress from 0 to 1
     */
    updateSimulationStatus(mode, message, progress) {
        const statusText = document.getElementById(`${mode}SimulationStatusText`);
        const statusProgressBar = document.getElementById(`${mode}SimulationStatusProgress`);
        
        if (statusText && statusProgressBar) {
            statusText.textContent = message;
            statusProgressBar.style.width = `${progress * 100}%`;
            statusProgressBar.setAttribute('aria-valuenow', Math.round(progress * 100));
        }
    }
    
    /**
     * Hide simulation status
     * 
     * @param {string} mode - 'basic' or 'advanced'
     */
    hideSimulationStatus(mode) {
        const statusContainer = document.getElementById(`${mode}SimulationStatus`);
        if (statusContainer) {
            statusContainer.style.display = 'none';
        }
    }
    
    /**
     * Format input parameters as HTML
     * 
     * @param {RetirementParameters} params - The parameters
     * @param {string} mode - 'basic' or 'advanced'
     * @returns {string} HTML string with formatted parameters
     * @private
     */
    _formatInputParametersHtml(params, mode) {
        const formatter = new Intl.NumberFormat('en-US', {
            style: 'decimal',
            maximumFractionDigits: 0
        });
        
        let html = '<div class="table-responsive"><table class="table table-bordered table-params">';
        
        if (mode === 'basic') {
            html += `
                <tbody>
                    <tr>
                        <th scope="row">Annual Expenses</th>
                        <td>${formatter.format(params.annualExpense)}</td>
                    </tr>
                    <tr>
                        <th scope="row">Retirement Period</th>
                        <td>${params.retirementPeriod} years</td>
                    </tr>
                    <tr>
                        <th scope="row">Expected Annual Return</th>
                        <td>${(params.expectedReturn * 100).toFixed(1)}%</td>
                    </tr>
                    <tr>
                        <th scope="row">Annual Standard Deviation</th>
                        <td>${(params.standardDeviation * 100).toFixed(1)}%</td>
                    </tr>
                    <tr>
                        <th scope="row">Annual Inflation Rate</th>
                        <td>${(params.inflation * 100).toFixed(1)}%</td>
                    </tr>
                    <tr>
                        <th scope="row">Adjust for Inflation</th>
                        <td>${params.adjustForInflation ? 'Yes' : 'No'}</td>
                    </tr>
                    <tr>
                        <th scope="row">Number of Simulations</th>
                        <td>${params.numSimulations.toLocaleString()}</td>
                    </tr>
                </tbody>
            `;
        } else {
            html += `
                <tbody>
                    <tr>
                        <th scope="row">Current Age</th>
                        <td>${params.currentAge}</td>
                    </tr>
                    <tr>
                        <th scope="row">Retirement Age</th>
                        <td>${params.retirementAge}</td>
                    </tr>
                    <tr>
                        <th scope="row">Life Expectancy</th>
                        <td>${params.lifeExpectancy}</td>
                    </tr>
                    <tr>
                        <th scope="row">Current Retirement Corpus</th>
                        <td>${formatter.format(params.currentCorpus)}</td>
                    </tr>
                    <tr>
                        <th scope="row">Annual Contribution</th>
                        <td>${formatter.format(params.annualContribution)}</td>
                    </tr>
                    <tr>
                        <th scope="row">Annual Expenses in Retirement</th>
                        <td>${formatter.format(params.annualExpense)}</td>
                    </tr>
                    <tr>
                        <th scope="row">Additional Retirement Income</th>
                        <td>${formatter.format(params.additionalRetirementIncome)}</td>
                    </tr>
                    <tr>
                        <th scope="row">Expected Annual Return</th>
                        <td>${(params.expectedReturn * 100).toFixed(1)}%</td>
                    </tr>
                    <tr>
                        <th scope="row">Annual Standard Deviation</th>
                        <td>${(params.standardDeviation * 100).toFixed(1)}%</td>
                    </tr>
                    <tr>
                        <th scope="row">Annual Inflation Rate</th>
                        <td>${(params.inflation * 100).toFixed(1)}%</td>
                    </tr>
                    <tr>
                        <th scope="row">Target Success Rate</th>
                        <td>${params.targetSuccessRate}%</td>
                    </tr>
                    <tr>
                        <th scope="row">Number of Simulations</th>
                        <td>${params.numSimulations.toLocaleString()}</td>
                    </tr>
                </tbody>
            `;
        }
        
        html += '</table></div>';
        return html;
    }
    
    /**
     * Format scenario parameters as HTML
     * 
     * @param {RetirementParameters} params - The parameters
     * @param {string} scenarioName - Name of the scenario
     * @returns {string} HTML string with formatted parameters
     * @private
     */
    _formatScenarioParametersHtml(params, scenarioName) {
        const formatter = new Intl.NumberFormat('en-US', {
            style: 'decimal',
            maximumFractionDigits: 0
        });
        
        // Calculate projected corpus
        const projectedCorpus = this.monteCarloEngine.calculateProjectedCorpus(params);
        
        let html = `<div class="alert alert-info mb-4">
            <strong>Scenario: ${scenarioName}</strong> - This scenario shows how your retirement plan changes with specific modifications.
        </div>`;
        
        html += '<div class="table-responsive"><table class="table table-bordered table-params">';
        html += `
            <tbody>
                <tr>
                    <th scope="row">Current Age</th>
                    <td>${params.currentAge}</td>
                </tr>
                <tr>
                    <th scope="row">Retirement Age</th>
                    <td>${params.retirementAge}</td>
                </tr>
                <tr>
                    <th scope="row">Life Expectancy</th>
                    <td>${params.lifeExpectancy}</td>
                </tr>
                <tr>
                    <th scope="row">Years to Retirement</th>
                    <td>${params.getYearsToRetirement()}</td>
                </tr>
                <tr>
                    <th scope="row">Years in Retirement</th>
                    <td>${params.getRetirementYears()}</td>
                </tr>
                <tr>
                    <th scope="row">Current Retirement Corpus</th>
                    <td>${formatter.format(params.currentCorpus)}</td>
                </tr>
                <tr>
                    <th scope="row">Projected Corpus at Retirement</th>
                    <td>${formatter.format(projectedCorpus)}</td>
                </tr>
                <tr>
                    <th scope="row">Annual Contribution</th>
                    <td>${formatter.format(params.annualContribution)}</td>
                </tr>
                <tr>
                    <th scope="row">Annual Expenses in Retirement</th>
                    <td>${formatter.format(params.annualExpense)}</td>
                </tr>
                <tr>
                    <th scope="row">Additional Retirement Income</th>
                    <td>${formatter.format(params.additionalRetirementIncome)}</td>
                </tr>
                <tr>
                    <th scope="row">Expected Annual Return</th>
                    <td>${(params.expectedReturn * 100).toFixed(1)}% ± ${(params.standardDeviation * 100).toFixed(1)}%</td>
                </tr>
            </tbody>
        `;
        
        html += '</table></div>';
        return html;
    }
}
