package com.retirement.engine;

import com.retirement.model.RetirementParameters;
import org.junit.Test;

import static org.junit.Assert.*;

/**
 * Tests for the MonteCarloEngine class.
 */
public class MonteCarloEngineTest {
    
    @Test
    public void testCalculateSuccessRateBasicMode() {
        // Create a parameters object for basic mode
        RetirementParameters params = new RetirementParameters(
            60000, 30, 0.07, 0.10, 0.03, true, 1000
        );
        
        MonteCarloEngine engine = new MonteCarloEngine();
        double requiredCorpus = engine.calculateRequiredCorpus(params);
        double successRate = engine.simulateRetirementWithCorpus(requiredCorpus, params);
        
        // Success rate should be close to 85% (default target)
        assertTrue("Success rate should be near 85%", Math.abs(successRate - 85.0) < 5.0);
        
        // Required corpus should be reasonable (around 25x annual expenses)
        double corpusMultiple = requiredCorpus / params.getAnnualExpense();
        assertTrue("Corpus multiple should be reasonable", corpusMultiple > 20 && corpusMultiple < 30);
    }
    
    @Test
    public void testCalculateSuccessRateAdvancedMode() {
        // Create a parameters object for advanced mode
        RetirementParameters params = new RetirementParameters(
            40, 65, 90, 500000, 80000, 30000, 20000,
            0.07, 0.10, 0.03, 85.0, 1000
        );
        
        MonteCarloEngine engine = new MonteCarloEngine();
        double projectedCorpus = engine.calculateProjectedCorpus(params);
        double successRate = engine.simulateRetirementWithCorpus(projectedCorpus, params);
        
        // Projected corpus should be reasonable for these inputs
        assertTrue("Projected corpus should be positive", projectedCorpus > 0);
        
        // Success rate should be a valid percentage
        assertTrue("Success rate should be between 0 and 100", successRate >= 0 && successRate <= 100);
    }
    
    @Test
    public void testGenerateRandomReturn() {
        MonteCarloEngine engine = new MonteCarloEngine();
        
        // Test 1000 random returns to ensure they're reasonably distributed
        int positiveReturns = 0;
        int negativeReturns = 0;
        
        for (int i = 0; i < 1000; i++) {
            double monthlyReturn = engine.generateRandomReturn(0.07, 0.10);
            
            if (monthlyReturn > 0) {
                positiveReturns++;
            } else {
                negativeReturns++;
            }
            
            // Return should be within reasonable bounds
            assertTrue("Random return should be within reasonable bounds", 
                      monthlyReturn > -0.2 && monthlyReturn < 0.2);
        }
        
        // For expected return of 7%, should have more positive than negative returns
        assertTrue("Should have more positive than negative returns", positiveReturns > negativeReturns);
    }
    
    @Test
    public void testCalculateProjectedCorpus() {
        RetirementParameters params = new RetirementParameters(
            40, 65, 90, 500000, 80000, 30000, 20000,
            0.07, 0.10, 0.03, 85.0, 1000
        );
        
        MonteCarloEngine engine = new MonteCarloEngine();
        double projectedCorpus = engine.calculateProjectedCorpus(params);
        
        // Projected corpus should be greater than initial corpus
        assertTrue("Projected corpus should exceed initial corpus", projectedCorpus > params.getCurrentCorpus());
        
        // With 25 years of contributions and growth, corpus should increase significantly
        double minimumExpectedCorpus = params.getCurrentCorpus() * 2;
        assertTrue("Projected corpus should increase significantly", projectedCorpus > minimumExpectedCorpus);
    }
    
    @Test
    public void testCalculatePercentile() {
        MonteCarloEngine engine = new MonteCarloEngine();
        
        // Test with a sorted array
        double[] values = {1.0, 2.0, 3.0, 4.0, 5.0, 6.0, 7.0, 8.0, 9.0, 10.0};
        
        // Test exact indices
        assertEquals(1.0, engine.calculatePercentile(values, 0), 0.001);
        assertEquals(10.0, engine.calculatePercentile(values, 100), 0.001);
        assertEquals(5.5, engine.calculatePercentile(values, 50), 0.001);
        
        // Test interpolation
        assertEquals(2.5, engine.calculatePercentile(values, 16.67), 0.001);
        assertEquals(7.5, engine.calculatePercentile(values, 72.22), 0.001);
        
        // Test with empty array
        double[] emptyArray = {};
        assertEquals(0.0, engine.calculatePercentile(emptyArray, 50), 0.001);
        
        // Test with null array
        assertEquals(0.0, engine.calculatePercentile(null, 50), 0.001);
        
        // Test with unsorted array
        double[] unsortedValues = {5.0, 3.0, 9.0, 1.0, 7.0, 2.0, 6.0, 8.0, 4.0, 10.0};
        assertEquals(5.5, engine.calculatePercentile(unsortedValues, 50), 0.001);
    }
}
