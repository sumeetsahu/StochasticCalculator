package com.retirement.util;

/**
 * Utility class for tracking progress of long-running operations.
 */
public class ProgressTracker {
    private final int totalSteps;
    private int currentStep;
    private long startTime;
    private String operationName;
    private boolean showRemainingTime;
    
    /**
     * Create a new progress tracker.
     * 
     * @param totalSteps The total number of steps in the operation
     * @param operationName The name of the operation (for display)
     * @param showRemainingTime Whether to show the estimated remaining time
     */
    public ProgressTracker(int totalSteps, String operationName, boolean showRemainingTime) {
        this.totalSteps = totalSteps;
        this.currentStep = 0;
        this.operationName = operationName;
        this.showRemainingTime = showRemainingTime;
        this.startTime = System.currentTimeMillis();
    }
    
    /**
     * Update the progress tracker with the current step.
     * 
     * @param step The current step
     */
    public void update(int step) {
        this.currentStep = step;
        
        // Only display progress when step is a multiple of some threshold to avoid console spam
        int updateFrequency = Math.max(1, totalSteps / 20); // Update about 20 times during the process
        
        if (step % updateFrequency == 0 || step == totalSteps) {
            printProgress();
        }
    }
    
    /**
     * Increment the progress tracker by one step.
     */
    public void increment() {
        update(currentStep + 1);
    }
    
    /**
     * Print the current progress.
     */
    private void printProgress() {
        int percentage = (int)((double)currentStep / totalSteps * 100);
        
        StringBuilder progress = new StringBuilder();
        progress.append("\r"); // Carriage return to reuse the same line
        
        // Create progress bar [=====>    ] format
        progress.append("[");
        int progressBarWidth = 20;
        int progressChars = (int)((double)currentStep / totalSteps * progressBarWidth);
        
        for (int i = 0; i < progressBarWidth; i++) {
            if (i < progressChars) {
                progress.append("=");
            } else if (i == progressChars) {
                progress.append(">");
            } else {
                progress.append(" ");
            }
        }
        
        progress.append("] ");
        progress.append(String.format("%3d%%", percentage));
        
        // Add operation name
        progress.append(" - ").append(operationName);
        
        // Add estimated time remaining if requested
        if (showRemainingTime && currentStep > 0) {
            long elapsedTime = System.currentTimeMillis() - startTime;
            long estimatedTotalTime = (long)(elapsedTime * ((double)totalSteps / currentStep));
            long remainingTime = estimatedTotalTime - elapsedTime;
            
            // Convert to seconds
            remainingTime /= 1000;
            
            if (remainingTime > 0) {
                if (remainingTime < 60) {
                    progress.append(String.format(" (Est. %ds remaining)", remainingTime));
                } else if (remainingTime < 3600) {
                    progress.append(String.format(" (Est. %dm %ds remaining)", 
                                                 remainingTime / 60, remainingTime % 60));
                } else {
                    progress.append(String.format(" (Est. %dh %dm remaining)", 
                                                 remainingTime / 3600, (remainingTime % 3600) / 60));
                }
            }
        }
        
        // Print the progress bar (System.out to avoid buffering with println)
        System.out.print(progress.toString());
        
        // If we're at 100%, add a newline
        if (currentStep == totalSteps) {
            System.out.println();
        }
    }
    
    /**
     * Complete the progress tracking and print 100%.
     */
    public void complete() {
        update(totalSteps);
    }
    
    /**
     * Reset the progress tracker.
     */
    public void reset() {
        this.currentStep = 0;
        this.startTime = System.currentTimeMillis();
    }
}
