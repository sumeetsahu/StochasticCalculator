package com.retirement;

import com.retirement.ui.RetirementCalculator;
import com.retirement.util.LocaleConfig;

/**
 * Main entry point for the Retirement Corpus Stochastic Calculator application.
 */
public class Main {
    public static void main(String[] args) {
        // Parse command line arguments
        for (int i = 0; i < args.length; i++) {
            if (args[i].equals("--locale") && i + 1 < args.length) {
                // Set locale based on language tag argument
                LocaleConfig.setLocale(args[i + 1]);
                System.out.println("Setting locale to: " + args[i + 1]);
                i++; // Skip the next argument (the locale value)
            }
        }
        
        RetirementCalculator calculator = new RetirementCalculator();
        calculator.start();
    }
}
