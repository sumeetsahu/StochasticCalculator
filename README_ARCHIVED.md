# Retirement Corpus Stochastic Calculator - Web Edition

This is a web-based version of the Retirement Corpus Stochastic Calculator, a comprehensive retirement planning tool that uses Monte Carlo simulations to model uncertainty in investment returns.

## Features

### Basic Mode - Corpus Calculation
- Calculate the corpus needed for a simple retirement scenario
- Show corpus requirements with different success probabilities
- Interactive visualization of simulation results

### Advanced Mode - Personalized Planning
- Evaluate current retirement savings trajectory
- Present clear assessment of retirement readiness
- Provide actionable recommendations for improving retirement outcomes
- Generate multiple scenarios examining different variables

## Implementation Details

This web version is implemented entirely in client-side JavaScript, allowing it to run on any modern web browser without requiring a server. All calculations are performed in the browser, ensuring your financial data never leaves your computer.

### Technical Stack
- Pure JavaScript (ES6+)
- Chart.js for data visualization
- Bootstrap 5 for UI components
- MersenneTwister for high-quality random number generation

### Performance Considerations
- For large simulations (10,000+), calculations might take a few seconds depending on your device
- Local storage is used to remember your inputs between sessions
- No data is sent to any server - all processing happens in your browser

## Hosting on GitHub Pages

To host this calculator on GitHub Pages:

1. Push the `/web` directory to a GitHub repository
2. Enable GitHub Pages in the repository settings
3. Choose the option to serve from the root of the repository

Alternatively, you can use any static web hosting service like Netlify, Vercel, or Firebase Hosting.

## Relationship to Java Version

This web application is a port of the original Java-based Retirement Corpus Stochastic Calculator. Both versions use the same mathematical models and simulation techniques, but this web version offers:

- Accessibility from any device with a modern web browser
- Interactive visualizations
- No installation required

For more complex simulations or batch processing, the original Java version might still be preferred.

## License

This project is available under the same license as the original Java version.

## Credits

- Original Java implementation by Sumeet Sahu
- Web version adapted from the Java codebase
