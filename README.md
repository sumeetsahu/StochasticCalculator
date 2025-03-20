# Retirement Corpus Stochastic Calculator

A comprehensive retirement planning tool that uses Monte Carlo simulations to model uncertainty in investment returns, helping users make informed decisions about retirement savings, contributions, and expenses.

## Features

### Basic Mode - Corpus Calculation
- Calculate the corpus needed for a simple retirement scenario
- Show corpus requirements with different success probabilities

### Advanced Mode - Personalized Planning
- Evaluate current retirement savings trajectory
- Present clear assessment of retirement readiness
- Provide actionable recommendations for improving retirement outcomes

### Comprehensive Scenario Analysis
- Generate multiple scenarios examining different variables
- Provide comparative analysis across scenarios
- Recommend the most viable path based on user preferences

### Year-by-Year Corpus Tracking
- Generate detailed year-by-year projections
- Show statistical ranges and depletion risks
- Highlight high-risk periods

## Documentation

- [Success Metrics Explanation](SUCCESS_METRICS.md) - Detailed explanation of the different success metrics used in the calculator and why they might differ

## How to Use

1. Compile the project using Maven:
   ```
   mvn clean package
   ```

2. Run the application:
   ```
   java -jar target/stochastic-calculator-1.0-SNAPSHOT-jar-with-dependencies.jar
   ```
   
   Or use the provided script:
   ```
   ./run.sh
   ```

3. Follow the prompts to input your retirement planning parameters.

4. For demo purposes, you can run the automated demos:
   ```
   ./custom_demo.sh        # Demo with interactive input (requires 'expect' utility)
   
   ```

## Requirements

- Java 11 or higher
- Maven 3.6 or higher
