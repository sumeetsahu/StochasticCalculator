#!/bin/bash

# Run script for Retirement Corpus Stochastic Calculator

# Check if Maven is installed
if ! command -v mvn &> /dev/null; then
    echo "Maven is not installed. Please install Maven to build the application."
    exit 1
fi

# Build the project if JAR doesn't exist or if force rebuild is requested
if [ "$1" == "--build" ] || [ ! -f "./target/stochastic-calculator-1.0-SNAPSHOT-jar-with-dependencies.jar" ]; then
    echo "Building project..."
    mvn clean package
    
    # Check if build was successful
    if [ $? -ne 0 ]; then
        echo "Build failed. Please check the error messages above."
        exit 1
    fi
    
    echo "Build successful."
fi

# Run the application
echo "Starting Retirement Corpus Stochastic Calculator..."
java -jar ./target/stochastic-calculator-1.0-SNAPSHOT-jar-with-dependencies.jar
