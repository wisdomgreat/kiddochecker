
import { supabase } from "@/integrations/supabase/client";

export interface HealthCheckResult {
  service: string;
  status: 'healthy' | 'unhealthy' | 'warning';
  message: string;
  timestamp: Date;
  responseTime?: number;
}

export class HealthChecker {
  static async checkDatabase(): Promise<HealthCheckResult> {
    const startTime = Date.now();
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('count')
        .limit(1);
      
      const responseTime = Date.now() - startTime;
      
      if (error) {
        return {
          service: 'Database',
          status: 'unhealthy',
          message: `Database connection failed: ${error.message}`,
          timestamp: new Date(),
          responseTime
        };
      }
      
      return {
        service: 'Database',
        status: responseTime > 2000 ? 'warning' : 'healthy',
        message: responseTime > 2000 ? 'Slow response time' : 'Connected successfully',
        timestamp: new Date(),
        responseTime
      };
    } catch (error: any) {
      return {
        service: 'Database',
        status: 'unhealthy',
        message: `Database error: ${error.message}`,
        timestamp: new Date(),
        responseTime: Date.now() - startTime
      };
    }
  }

  static async checkAuthentication(): Promise<HealthCheckResult> {
    const startTime = Date.now();
    try {
      const { data, error } = await supabase.auth.getSession();
      const responseTime = Date.now() - startTime;
      
      if (error) {
        return {
          service: 'Authentication',
          status: 'unhealthy',
          message: `Auth service error: ${error.message}`,
          timestamp: new Date(),
          responseTime
        };
      }
      
      return {
        service: 'Authentication',
        status: 'healthy',
        message: 'Auth service operational',
        timestamp: new Date(),
        responseTime
      };
    } catch (error: any) {
      return {
        service: 'Authentication',
        status: 'unhealthy',
        message: `Auth service error: ${error.message}`,
        timestamp: new Date(),
        responseTime: Date.now() - startTime
      };
    }
  }

  static async checkStorage(): Promise<HealthCheckResult> {
    const startTime = Date.now();
    try {
      const { data, error } = await supabase.storage.listBuckets();
      const responseTime = Date.now() - startTime;
      
      if (error) {
        return {
          service: 'Storage',
          status: 'unhealthy',
          message: `Storage service error: ${error.message}`,
          timestamp: new Date(),
          responseTime
        };
      }
      
      return {
        service: 'Storage',
        status: 'healthy',
        message: 'Storage service operational',
        timestamp: new Date(),
        responseTime
      };
    } catch (error: any) {
      return {
        service: 'Storage',
        status: 'unhealthy',
        message: `Storage service error: ${error.message}`,
        timestamp: new Date(),
        responseTime: Date.now() - startTime
      };
    }
  }

  static async runFullHealthCheck(): Promise<HealthCheckResult[]> {
    console.log('Running full health check...');
    
    const checks = await Promise.all([
      this.checkDatabase(),
      this.checkAuthentication(),
      this.checkStorage()
    ]);
    
    console.log('Health check results:', checks);
    return checks;
  }

  static getOverallHealth(results: HealthCheckResult[]): 'healthy' | 'unhealthy' | 'warning' {
    if (results.some(r => r.status === 'unhealthy')) return 'unhealthy';
    if (results.some(r => r.status === 'warning')) return 'warning';
    return 'healthy';
  }
}

export default HealthChecker;
