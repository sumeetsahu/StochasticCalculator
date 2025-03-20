#!/bin/bash

# Custom Demo script for Retirement Corpus Stochastic Calculator
# This script uses 'expect' to automate the user's specific inputs

# Check if 'expect' is installed
if ! command -v expect &> /dev/null; then
    echo "Error: 'expect' is not installed. Please install it to run this demo."
    echo "On macOS: brew install expect"
    echo "On Ubuntu/Debian: apt-get install expect"
    exit 1
fi

# Default locale and parameters
LOCALE="en-IN"
CURRENCY_SYMBOL="₹"

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --locale)
      LOCALE="$2"
      shift 2
      ;;
    *)
      shift
      ;;
  esac
done

# Set currency symbol based on locale
case $LOCALE in
  "en-US")
    CURRENCY_SYMBOL="$"
    ;;
  "fr-FR" | "de-DE" | "es-ES" | "it-IT")
    CURRENCY_SYMBOL="€"
    ;;
  "en-GB")
    CURRENCY_SYMBOL="£"
    ;;
  "ja-JP")
    CURRENCY_SYMBOL="¥"
    ;;
  "hi-IN" | "en-IN")
    CURRENCY_SYMBOL="₹"
    ;;
  *)
    CURRENCY_SYMBOL="₹" # Default now matches en-IN
    ;;
esac

# Build the project if needed
if [ ! -f "./target/stochastic-calculator-1.0-SNAPSHOT-jar-with-dependencies.jar" ]; then
    echo "Building project..."
    mvn clean package || { echo "Build failed. Exiting."; exit 1; }
fi

# Create an expect script with the user's specific inputs
cat > custom_demo.exp << 'EOL'
#!/usr/bin/expect -f

# Set timeout - longer timeout for this complex scenario
set timeout 300

# Get the locale from environment variable
set locale "$env(LOCALE)"
set currency_symbol "$env(CURRENCY_SYMBOL)"

# Start the application with the specified locale
spawn java -jar ./target/stochastic-calculator-1.0-SNAPSHOT-jar-with-dependencies.jar --locale $locale

# Wait for main menu and select Advanced Mode
expect "Enter your choice: "
send "2\r"

# Enter the user's specific inputs
expect "Current age:"
send "40\r"

expect "Target retirement age:"
send "50\r"

expect "Life expectancy:"
send "100\r"

expect "Current retirement corpus:"
send "2000000\r"

expect "Annual expenses:"
send "120000\r"

expect "Annual contribution:"
send "500000\r"

expect "Additional retirement income"
send "0\r"

expect "Expected annual return"
send "10\r"

expect "Annual standard deviation"
send "15\r"

expect "Annual inflation rate"
send "8\r"

expect "Target success rate"
send "95\r"

expect "Number of simulations"
send "10000\r"

# Wait for the scenarios prompt after calculation completes
expect "Would you like to adopt one of the recommended scenarios?"
send "2\r"

# Wait for the year-by-year tracking question
expect "Would you like to see year-by-year corpus tracking?"
send "y\r"

# Wait for the save report question
expect "Would you like to save this report to a file?"
send "y\r"

# Return to main menu and exit
expect "Enter your choice: "
send "4\r"

expect eof
EOL

# Make the expect script executable
chmod +x custom_demo.exp

# Export variables for expect script
export LOCALE="$LOCALE"
export CURRENCY_SYMBOL="$CURRENCY_SYMBOL"

# Run the demo
echo "======================================================"
echo "  RUNNING CUSTOM SCENARIO DEMO"
echo "======================================================"
echo "  Locale: $LOCALE"
echo "  Current Age: 40"
echo "  Retirement Age: 50"
echo "  Life Expectancy: 100"
echo "  Initial Corpus: $CURRENCY_SYMBOL 2M"
echo "  Annual Expenses: $CURRENCY_SYMBOL 120K"
echo "  Annual Contribution: $CURRENCY_SYMBOL 500K"
echo "  Expected Return: 10%"
echo "  Standard Deviation: 15%"
echo "  Inflation Rate: 8%"
echo "  Target Success Rate: 95%"
echo "  Simulations: 10,000"
echo "======================================================"
./custom_demo.exp

# Clean up
rm -f custom_demo.exp

echo
echo "======================================================"
echo "  CUSTOM DEMO COMPLETED"
echo "======================================================"
