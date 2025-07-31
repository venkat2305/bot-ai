interface CircuitBreakerOptions {
  failureThreshold: number;
  timeout: number;
  monitoringPeriod: number;
}

type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

interface CircuitBreakerStats {
  failures: number;
  successes: number;
  requests: number;
  lastFailureTime: number | null;
  lastSuccessTime: number | null;
}

export class CircuitBreaker {
  private state: CircuitState = 'CLOSED';
  private stats: CircuitBreakerStats = {
    failures: 0,
    successes: 0,
    requests: 0,
    lastFailureTime: null,
    lastSuccessTime: null
  };

  constructor(
    private options: CircuitBreakerOptions = {
      failureThreshold: 5,
      timeout: 60000, // 1 minute
      monitoringPeriod: 300000 // 5 minutes
    }
  ) {}

  async execute<T>(operation: () => Promise<T>, fallback?: () => Promise<T>): Promise<T> {
    // Check if circuit should be reset to HALF_OPEN
    this.checkForStateTransition();

    if (this.state === 'OPEN') {
      if (fallback) {
        console.log('Circuit breaker OPEN, executing fallback');
        return await fallback();
      }
      throw new Error('Circuit breaker is OPEN - service unavailable');
    }

    // Increment request counter
    this.stats.requests++;

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    this.stats.successes++;
    this.stats.lastSuccessTime = Date.now();

    if (this.state === 'HALF_OPEN') {
      console.log('Circuit breaker: Operation succeeded in HALF_OPEN state, transitioning to CLOSED');
      this.state = 'CLOSED';
      this.resetStats();
    }
  }

  private onFailure(): void {
    this.stats.failures++;
    this.stats.lastFailureTime = Date.now();

    if (this.state === 'CLOSED' && this.stats.failures >= this.options.failureThreshold) {
      console.log(`Circuit breaker: Failure threshold (${this.options.failureThreshold}) reached, transitioning to OPEN`);
      this.state = 'OPEN';
    } else if (this.state === 'HALF_OPEN') {
      console.log('Circuit breaker: Operation failed in HALF_OPEN state, transitioning back to OPEN');
      this.state = 'OPEN';
    }
  }

  private checkForStateTransition(): void {
    if (this.state === 'OPEN' && this.stats.lastFailureTime) {
      const timeSinceLastFailure = Date.now() - this.stats.lastFailureTime;
      
      if (timeSinceLastFailure >= this.options.timeout) {
        console.log('Circuit breaker: Timeout period elapsed, transitioning to HALF_OPEN');
        this.state = 'HALF_OPEN';
      }
    }

    // Reset stats if monitoring period has elapsed
    if (this.stats.lastFailureTime && 
        Date.now() - this.stats.lastFailureTime >= this.options.monitoringPeriod) {
      this.resetStats();
    }
  }

  private resetStats(): void {
    this.stats = {
      failures: 0,
      successes: 0,
      requests: 0,
      lastFailureTime: null,
      lastSuccessTime: null
    };
  }

  // Public methods for monitoring
  getState(): CircuitState {
    return this.state;
  }

  getStats(): CircuitBreakerStats & { state: CircuitState } {
    return { ...this.stats, state: this.state };
  }

  // Force reset (useful for testing or manual intervention)
  reset(): void {
    this.state = 'CLOSED';
    this.resetStats();
    console.log('Circuit breaker manually reset to CLOSED state');
  }
}

// Singleton instances for different services
export const razorpayCircuitBreaker = new CircuitBreaker({
  failureThreshold: 5,
  timeout: 60000, // 1 minute
  monitoringPeriod: 300000 // 5 minutes
});

// MongoDB circuit breaker for database operations
export const mongoCircuitBreaker = new CircuitBreaker({
  failureThreshold: 3,
  timeout: 30000, // 30 seconds
  monitoringPeriod: 180000 // 3 minutes
}); 