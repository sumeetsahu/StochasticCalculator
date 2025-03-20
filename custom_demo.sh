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

# Start the application
spawn java -jar ./target/stochastic-calculator-1.0-SNAPSHOT-jar-with-dependencies.jar

# Wait for main menu and select Advanced Mode
expect "Enter your choice: "
send "2\r"

# Enter the user's specific inputs
expect "Current age:  \\\[40\\\]: "
send "40\r"

expect "Target retirement age:  \\\[65\\\]: "
send "50\r"

expect "Life expectancy:  \\\[90\\\]: "
send "100\r"

expect "Current retirement corpus: ($)  \\\[500000\\\]: "
send "2000000\r"

expect "Annual expenses: ($)  \\\[80000\\\]: "
send "120000\r"

expect "Annual contribution: ($)  \\\[30000\\\]: "
send "500000\r"

expect "Additional retirement income (e.g., pension, Social Security): ($)  \\\[20000\\\]: "
send "0\r"

expect "Expected annual return (%):  \\\[7\\\]: "
send "10\r"

expect "Annual standard deviation (%):  \\\[10\\\]: "
send "15\r"

expect "Annual inflation rate (%):  \\\[3\\\]: "
send "8\r"

expect "Target success rate (%):  \\\[85\\\]: "
send "95\r"

expect "Number of simulations (1000-10000):  \\\[5000\\\]: "
send "10000\r"

# Wait for the scenarios prompt after calculation completes
expect "Would you like to adopt one of the recommended scenarios?"
send "2\r"

# Wait for the year-by-year tracking question
expect "Would you like to see year-by-year corpus tracking? (y/n):  \\\[y\\\]: "
send "y\r"

# Wait for the save report question
expect "Would you like to save this report to a file? (y/n):  \\\[n\\\]: "
send "y\r"

# Return to main menu and exit
expect "Enter your choice: "
send "4\r"

expect eof
EOL

# Make the expect script executable
chmod +x custom_demo.exp

# Run the demo
echo "======================================================"
echo "  RUNNING CUSTOM SCENARIO DEMO"
echo "======================================================"
echo "  Current Age: 40"
echo "  Retirement Age: 50"
echo "  Life Expectancy: 100"
echo "  Initial Corpus: $ 2M"
echo "  Annual Expenses: $ 120K"
echo "  Annual Contribution: $500K"
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
