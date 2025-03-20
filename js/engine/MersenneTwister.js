/**
 * A simple wrapper for the Mersenne Twister random number generator.
 * This provides a consistent interface with the Java implementation.
 */
class MersenneTwister {
    /**
     * Constructor
     * @param {number} seed - Optional seed for the random number generator
     */
    constructor(seed) {
        // Initialize a Mersenne Twister instance
        // If this is loaded via CDN, it will use the global MersenneTwister constructor
        // We use the window.MersenneTwister if available (from the CDN), otherwise use our implementation
        if (typeof window !== 'undefined' && window.MersenneTwister) {
            this.mt = new window.MersenneTwister(seed);
        } else {
            // Simple fallback using Math.random if MersenneTwister is not available
            console.warn('Using Math.random fallback instead of MersenneTwister');
            this.mt = null;
        }
    }
    
    /**
     * Get a random number between 0 and 1
     * @returns {number} Random number in range [0, 1)
     */
    random() {
        if (this.mt) {
            return this.mt.random();
        } else {
            return Math.random();
        }
    }
    
    /**
     * Get a random integer in the range [min, max]
     * @param {number} min - Minimum value (inclusive)
     * @param {number} max - Maximum value (inclusive)
     * @returns {number} Random integer
     */
    nextInt(min, max) {
        min = Math.ceil(min);
        max = Math.floor(max);
        return Math.floor(this.random() * (max - min + 1)) + min;
    }
    
    /**
     * Get the next random Gaussian (normal) distributed number
     * with mean 0.0 and standard deviation 1.0.
     * @returns {number} Random number from standard normal distribution
     */
    nextGaussian() {
        // Box-Muller transform for generating Gaussian random numbers
        const u1 = this.random();
        const u2 = this.random();
        
        const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
        return z0;
    }
}
