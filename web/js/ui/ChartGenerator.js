/**
 * Generates charts for visualizing retirement simulation results.
 */
class ChartGenerator {
    /**
     * Create a chart showing the distribution of final corpus values
     * 
     * @param {string} canvasId - ID of the canvas element
     * @param {Array<number>} corpusValues - Array of final corpus values
     * @param {number} initialCorpus - Initial corpus value
     * @param {RetirementParameters} params - Retirement parameters
     */
    createCorpusDistributionChart(canvasId, corpusValues, initialCorpus, params) {
        const ctx = document.getElementById(canvasId).getContext('2d');
        
        // Calculate percentiles
        const monteCarloEngine = new MonteCarloEngine();
        const percentiles = [10, 25, 50, 75, 90].map(p => 
            monteCarloEngine.calculatePercentile(corpusValues, p));
        
        // Count simulations with corpus below zero
        const failedSims = corpusValues.filter(val => val <= 0).length;
        const successRate = 100 - (failedSims / corpusValues.length * 100);
        
        // Create bins for histogram
        const nonZeroValues = corpusValues.filter(val => val > 0);
        const maxValue = Math.max(...nonZeroValues);
        const minValue = Math.min(0, ...nonZeroValues);
        
        // Create histogram data
        const numBins = 20;
        const binWidth = (maxValue - minValue) / numBins;
        const bins = Array(numBins).fill(0);
        const binLabels = Array(numBins).fill(0);
        
        // Fill bins
        nonZeroValues.forEach(value => {
            const binIndex = Math.min(numBins - 1, Math.floor((value - minValue) / binWidth));
            bins[binIndex]++;
        });
        
        // Create bin labels
        for (let i = 0; i < numBins; i++) {
            const binStart = minValue + i * binWidth;
            const binEnd = binStart + binWidth;
            binLabels[i] = FormatUtil.formatCurrency(binStart) + ' - ' + FormatUtil.formatCurrency(binEnd);
        }
        
        // Convert counts to percentages
        const binPercentages = bins.map(count => (count / corpusValues.length) * 100);
        
        // Create chart
        const chart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: binLabels,
                datasets: [{
                    label: 'Percentage of Simulations',
                    data: binPercentages,
                    backgroundColor: 'rgba(54, 162, 235, 0.5)',
                    borderColor: 'rgb(54, 162, 235)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Distribution of Final Corpus Values'
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `${context.raw.toFixed(1)}% of simulations`;
                            }
                        }
                    },
                    legend: {
                        display: false
                    }
                },
                scales: {
                    x: {
                        display: false
                    },
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Percentage of Simulations'
                        }
                    }
                }
            }
        });
        
        // Add percentile information below chart
        const chartContainer = document.getElementById(canvasId).parentNode;
        
        const percentileContainer = document.createElement('div');
        percentileContainer.className = 'mt-3 card bg-light';
        
        const percentileHeader = document.createElement('div');
        percentileHeader.className = 'card-header bg-light';
        percentileHeader.innerHTML = '<h6 class="mb-0">Final Corpus Percentiles</h6>';
        
        const percentileBody = document.createElement('div');
        percentileBody.className = 'card-body';
        
        // Create table for percentiles
        const table = document.createElement('table');
        table.className = 'table table-sm mb-0';
        
        // Create table header
        const thead = document.createElement('thead');
        thead.innerHTML = `
            <tr>
                <th scope="col">Percentile</th>
                <th scope="col">Value</th>
                <th scope="col">Description</th>
            </tr>
        `;
        
        // Create table body
        const tbody = document.createElement('tbody');
        
        // Add rows for each percentile
        const percentileDescriptions = [
            '10% of simulations ended with this corpus value or less',
            '25% of simulations ended with this corpus value or less',
            'Median outcome (50% ended with more, 50% with less)',
            '75% of simulations ended with this corpus value or less',
            '90% of simulations ended with this corpus value or less'
        ];
        
        [10, 25, 50, 75, 90].forEach((p, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${p}th</td>
                <td>${FormatUtil.formatCurrency(percentiles[index])}</td>
                <td><small class="text-muted">${percentileDescriptions[index]}</small></td>
            `;
            tbody.appendChild(row);
        });
        
        // Assemble table
        table.appendChild(thead);
        table.appendChild(tbody);
        percentileBody.appendChild(table);
        
        // Add success rate message
        const successMessage = document.createElement('div');
        successMessage.className = 'alert alert-info mt-3 mb-0';
        successMessage.innerHTML = `
            <strong>Success Rate: ${successRate.toFixed(1)}%</strong><br>
            <small>This percentage of simulations ended without depleting the corpus over 
            the ${params.currentAge > 0 ? params.getRetirementYears() : params.retirementPeriod}-year 
            retirement period.</small>
        `;
        
        // Assemble percentile container
        percentileContainer.appendChild(percentileHeader);
        percentileContainer.appendChild(percentileBody);
        percentileContainer.appendChild(successMessage);
        
        // Insert after chart
        chartContainer.insertAdjacentElement('afterend', percentileContainer);
        
        return chart;
    }
    
    /**
     * Create a chart showing the projected corpus over time
     * 
     * @param {string} canvasId - ID of the canvas element
     * @param {Array<Array<number>>} yearlyCorpusValues - Array of yearly corpus values
     * @param {RetirementParameters} params - Retirement parameters
     */
    createCorpusTrajectoryChart(canvasId, yearlyCorpusValues, params) {
        const ctx = document.getElementById(canvasId).getContext('2d');
        
        const monteCarloEngine = new MonteCarloEngine();
        const years = yearlyCorpusValues.length;
        
        // Calculate percentiles for each year
        const percentiles = [10, 25, 50, 75, 90];
        const percentileValues = [];
        
        percentiles.forEach(p => {
            const values = [];
            for (let year = 0; year < years; year++) {
                values.push(monteCarloEngine.calculatePercentile(yearlyCorpusValues[year], p));
            }
            percentileValues.push(values);
        });
        
        // Create labels for x-axis
        const labels = [];
        const startAge = params.currentAge > 0 ? params.currentAge : 
            (params.retirementAge ? params.retirementAge : 65);
            
        for (let year = 0; year < years; year++) {
            labels.push(startAge + year);
        }
        
        // Create dataset colors (from lighter to darker)
        const colors = [
            'rgba(54, 162, 235, 0.2)',
            'rgba(54, 162, 235, 0.3)',
            'rgba(54, 162, 235, 0.5)',
            'rgba(54, 162, 235, 0.3)',
            'rgba(54, 162, 235, 0.2)'
        ];
        
        // Create datasets
        const datasets = [];
        
        // Add percentile datasets
        percentiles.forEach((p, i) => {
            datasets.push({
                label: `${p}th Percentile`,
                data: percentileValues[i],
                borderColor: 'rgba(54, 162, 235, 1)',
                backgroundColor: colors[i],
                borderWidth: i === 2 ? 2 : 1, // Make median line thicker
                fill: false,
                tension: 0.1
            });
        });
        
        // Create chart
        const chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: datasets
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Projected Corpus Over Time'
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `${context.dataset.label}: ${FormatUtil.formatCurrency(context.raw)}`;
                            }
                        }
                    },
                    legend: {
                        display: true
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
                                return FormatUtil.formatCurrencyShort(value);
                            }
                        }
                    }
                }
            }
        });
        
        return chart;
    }
}
