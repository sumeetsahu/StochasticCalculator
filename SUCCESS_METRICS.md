# Understanding Success Metrics in the Retirement Corpus Stochastic Calculator

This document explains the different success metrics used in the Retirement Corpus Stochastic Calculator and why they might show different values.

## Two Key Success Metrics

The calculator uses two distinct success metrics:

1. **Overall Success Probability** (shown in the "RETIREMENT READINESS" section)
2. **Point Success Rate** (shown in the "YEAR-BY-YEAR TRACKING" table)

While these metrics are related, they measure different aspects of retirement success and are calculated using different methods.

## Overall Success Probability

### Definition
The **Overall Success Probability** represents the likelihood of your retirement corpus lasting throughout your entire retirement period, from retirement age to life expectancy, without ever being depleted.

### How It's Calculated
1. The calculator runs multiple simulations (typically 1,000+) of your entire retirement period
2. Each simulation tracks a single corpus from retirement to life expectancy
3. A simulation is counted as successful ONLY if the corpus never depletes at any point
4. The success probability is: `(Number of Successful Simulations / Total Simulations) × 100%`

### Key Characteristics
- **Path-dependent**: Considers the continuous evolution of the corpus
- **Binary outcome**: Each simulation is either a success (never runs out of money) or a failure (runs out at some point)
- **Holistic view**: Represents the overall likelihood of retirement success

### In the Code
The overall success probability is calculated using `MonteCarloEngine.simulateRetirementWithCorpus()`:

```java
boolean depleted = false;
for (int month = 1; month <= retirementMonths; month++) {
    // ... simulate monthly returns and expenses ...
    if (corpus <= 0) {
        depleted = true;
        break;
    }
}

if (!depleted) {
    successCount++;
}

return (double) successCount / numSimulations * 100.0;
```

## Point Success Rate

### Definition
The **Point Success Rate** represents the probability of having a positive corpus balance AT a specific age, calculated independently for each year in the tracking table.

### How It's Calculated
1. For each age in your retirement plan:
   - The calculator runs multiple simulations from your current age up to that specific age
   - Each simulation is counted as successful if the corpus is positive at that specific age
   - The point success rate is: `(Number of Simulations with Positive Corpus / Total Simulations) × 100%`

### Key Characteristics
- **Point-in-time analysis**: Only looks at the corpus value at a specific age
- **Independent calculations**: Each year's calculation is done separately
- **Does not account for previous depletion**: If the corpus recovers by a certain age after being depleted earlier, it's still counted as successful for that age

### In the Code
The point success rate is calculated in `CorpusTracker.runStochasticProjections()`:

```java
double[] corpusValues = monteCarloEngine.simulateCorpusValuesAtAge(currentCorpus, params, age);

int depleted = 0;
for (double value : corpusValues) {
    if (value <= 0) {
        depleted++;
    }
}
            
yearly.setDepletionRisk((double) depleted / numSimulations * 100);
yearly.setSuccessRate(100 - yearly.getDepletionRisk());
```

## Corpus Projection Methodology

The calculator uses a hybrid approach to generate year-by-year tracking data:

### Start Corpus and Contributions/Withdrawals
- **Start Corpus**: Includes both previous year's **median** end corpus AND the current year's contribution
- This provides a complete view of your total retirement assets at the beginning of each year
- Annual returns are calculated based on the previous year's end corpus (before current year's contribution)
- This ensures statistical consistency with our Monte Carlo simulations throughout the projection

### End Corpus Using Median (50th Percentile)
The End Corpus shown in year-by-year tracking is calculated as the **median (50th percentile)** from Monte Carlo simulations, not as a simple deterministic projection. This approach:

1. **Incorporates volatility** - Accounts for the impact of market volatility on your portfolio
2. **Represents the middle outcome** - Shows a value that half of simulations exceed and half fall below
3. **Statistical consistency** - Aligns with how the 5th and 95th percentiles are calculated
4. **More realistic** - Provides a more realistic projection than simple compound growth

### Contribution Handling in Simulations

To ensure consistency between the report presentation and simulation results, contributions are applied as follows:

- **Included in Start Corpus**: Annual contributions are included in the Start Corpus value for each year
- **Market Growth**: The full contribution amount is subject to market returns throughout the year
- **Withdrawal Handling**: Withdrawals are applied monthly to simulate regular retirement expenses

This approach matches how most people think about their retirement accounts - you start the year with your existing corpus plus your annual contribution, then apply returns and withdrawals.

### Statistical Integrity in Year-to-Year Projections

Our calculator maintains statistical integrity throughout the projection by:

1. **End-to-Start Continuity**: Each year's Start Corpus is based on the previous year's median End Corpus
2. **Path Dependence**: This approach preserves the statistical properties of the Monte Carlo simulation across years
3. **Realistic Compounding**: The effects of market volatility compound realistically over your entire retirement horizon

This ensures that the long-term projections properly reflect the compounding nature of investment returns and the statistical distribution of possible outcomes.

### Percentile Range (5th and 95th)
- The 5th percentile represents a "poor performance" scenario that only 5% of simulations fall below
- The 95th percentile represents an "excellent performance" scenario that only 5% of simulations exceed
- Together with the median (End Corpus), these provide a statistical range of potential outcomes

This methodology provides a statistically robust view of how your retirement corpus might evolve over time, capturing both the expected outcome (median) and the range of possibilities (5th and 95th percentiles).

## Why These Metrics Differ

The two metrics will often show different values, especially in later years of retirement, for these reasons:

1. **Accumulation of Risk**: 
   - The overall success probability accounts for the accumulated risk of depletion across all years
   - The point success rate only considers the risk at that specific point in time

2. **Recovery After Depletion**:
   - In the point success calculation, a corpus that was depleted but later recovered due to favorable returns would count as successful
   - In the overall success calculation, once a corpus is depleted, that simulation is permanently marked as unsuccessful

3. **Different Starting Points**:
   - The overall success probability is calculated from retirement age
   - The point success rate starts calculations from your current age

## Example

Consider a typical retirement plan spanning from age 65 to 95:

```
- Overall Success Probability: 75%
```

This means there's a 75% chance of your money lasting from age 65 all the way to 95 without ever running out.

The year-by-year tracking might show:

```
Age 65: 100% Point Success Rate
Age 75: 95% Point Success Rate
Age 85: 85% Point Success Rate
Age 95: 80% Point Success Rate
```

The 80% point success rate at age 95 is higher than the 75% overall success probability because:

1. The point success rate only checks if money remains at age 95
2. The overall success rate checks if money remained positive throughout ALL years from 65 to 95

## Which Metric Should You Focus On?

Both metrics are valuable for different purposes:

- **Overall Success Probability**: More conservative and comprehensive - best for assessing the overall viability of your retirement plan

- **Point Success Rate**: Shows how risk evolves over time - useful for understanding at what ages your plan becomes more vulnerable

For most planning purposes, the overall success probability is the more relevant metric as it represents the complete picture of retirement security.

## Technical Implementation Details

The underlying difference is in how simulations are managed:

1. **Overall Success Probability**: Uses continuous simulation paths where each simulation follows a single trajectory from start to finish.

2. **Point Success Rate**: Uses separate simulations for each age, which doesn't capture the correlation between outcomes in consecutive years.

This design choice allows the calculator to provide two complementary views of retirement risk, giving you a more comprehensive understanding of your retirement plan's strengths and potential vulnerabilities.
