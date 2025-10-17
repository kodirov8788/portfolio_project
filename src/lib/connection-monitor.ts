import { NextRequest, NextResponse } from "next/server";

// Connection monitoring interfaces
export interface ConnectionMetrics {
  id: string;
  userId: string;
  origin: string;
  desktopAppId?: string;
  connectedAt: Date;
  lastActivity: Date;
  status: "connected" | "disconnected" | "error" | "timeout";
  connectionQuality: "excellent" | "good" | "fair" | "poor";
  latency: number; // milliseconds
  packetLoss: number; // percentage
  bandwidth: number; // bytes per second
  errorCount: number;
  retryCount: number;
  metadata?: {
    userAgent?: string;
    ipAddress?: string;
    sessionId?: string;
    version?: string;
  };
}

export interface HealthCheck {
  id: string;
  timestamp: Date;
  status: "healthy" | "degraded" | "unhealthy";
  responseTime: number;
  error?: string;
  metrics: {
    cpu?: number;
    memory?: number;
    connections?: number;
    errors?: number;
  };
}

export interface ConnectionAlert {
  id: string;
  type:
    | "connection_lost"
    | "high_latency"
    | "packet_loss"
    | "error_spike"
    | "timeout";
  severity: "low" | "medium" | "high" | "critical";
  message: string;
  timestamp: Date;
  connectionId: string;
  userId: string;
  resolved: boolean;
  resolvedAt?: Date;
  metadata?: Record<string, any>;
}

export interface ConnectionMonitorConfig {
  healthCheckInterval: number; // milliseconds
  connectionTimeout: number; // milliseconds
  latencyThreshold: number; // milliseconds
  packetLossThreshold: number; // percentage
  errorThreshold: number; // errors per minute
  alertRetentionDays: number;
  enableHealthChecks: boolean;
  enableAlerts: boolean;
  enableMetrics: boolean;
}

export const DEFAULT_MONITOR_CONFIG: ConnectionMonitorConfig = {
  healthCheckInterval: 30000, // 30 seconds
  connectionTimeout: 300000, // 5 minutes
  latencyThreshold: 1000, // 1 second
  packetLossThreshold: 5, // 5%
  errorThreshold: 10, // 10 errors per minute
  alertRetentionDays: 7,
  enableHealthChecks: true,
  enableAlerts: true,
  enableMetrics: true,
};

export class ConnectionMonitor {
  private config: ConnectionMonitorConfig;
  private connections: Map<string, ConnectionMetrics> = new Map();
  private healthChecks: HealthCheck[] = [];
  private alerts: ConnectionAlert[] = [];
  private healthCheckTimer: NodeJS.Timeout | null = null;

  constructor(config: Partial<ConnectionMonitorConfig> = {}) {
    this.config = { ...DEFAULT_MONITOR_CONFIG, ...config };

    if (this.config.enableHealthChecks) {
        this.startHealthChecks();
    }

    console.log("📊 Connection Monitor initialized");
  }

  // Register a new connection
  registerConnection(
    connectionId: string,
    userId: string,
    origin: string,
    metadata?: ConnectionMetrics["metadata"]
  ): ConnectionMetrics {
    const now = new Date();
    const connection: ConnectionMetrics = {
        id: connectionId,
        userId,
        origin,
        connectedAt: now,
        lastActivity: now,
        status: "connected",
        connectionQuality: "excellent",
        latency: 0,
        packetLoss: 0,
        bandwidth: 0,
        errorCount: 0,
        retryCount: 0,
        metadata,
    };

    this.connections.set(connectionId, connection);
    console.log(`📊 Connection registered: ${connectionId} for user ${userId}`);

    return connection;
  }

  // Update connection activity
  updateConnectionActivity(
    connectionId: string,
    metrics: Partial<
        Pick<
          ConnectionMetrics,
          "latency" | "packetLoss" | "bandwidth" | "errorCount"
        >
    >
  ): void {
    const connection = this.connections.get(connectionId);
    if (!connection) return;

    connection.lastActivity = new Date();

    if (metrics.latency !== undefined) {
        connection.latency = metrics.latency;
    }
    if (metrics.packetLoss !== undefined) {
        connection.packetLoss = metrics.packetLoss;
    }
    if (metrics.bandwidth !== undefined) {
        connection.bandwidth = metrics.bandwidth;
    }
    if (metrics.errorCount !== undefined) {
        connection.errorCount = metrics.errorCount;
    }

    // Update connection quality
    connection.connectionQuality = this.calculateConnectionQuality(connection);

    // Check for alerts
    this.checkConnectionAlerts(connection);
  }

  // Disconnect a connection
  disconnectConnection(
    connectionId: string,
    reason:
        | "user_disconnect"
        | "timeout"
        | "error"
        | "server_shutdown" = "user_disconnect"
  ): void {
    const connection = this.connections.get(connectionId);
    if (!connection) return;

    connection.status =
        reason === "timeout"
          ? "timeout"
          : reason === "error"
          ? "error"
          : "disconnected";

    console.log(`📊 Connection disconnected: ${connectionId} (${reason})`);

    // Create alert if needed
    if (reason === "error" || reason === "timeout") {
        this.createAlert({
          type: reason === "timeout" ? "timeout" : "connection_lost",
          severity: "medium",
          message: `Connection ${reason}: ${connectionId}`,
          connectionId,
          userId: connection.userId,
        });
    }

    this.connections.delete(connectionId);
  }

  // Perform health check
  private async performHealthCheck(): Promise<HealthCheck> {
    const startTime = Date.now();
    const healthCheckId = `health_${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 4)}`;

    try {
        // Simulate health check (in real implementation, this would check actual services)
        const responseTime = Date.now() - startTime;

        // Calculate system metrics
        const activeConnections = this.connections.size;
        const recentErrors = this.getRecentErrorCount();

        let status: HealthCheck["status"] = "healthy";
        if (responseTime > this.config.latencyThreshold) {
          status = "degraded";
        }
        if (recentErrors > this.config.errorThreshold) {
          status = "unhealthy";
        }

        const healthCheck: HealthCheck = {
          id: healthCheckId,
          timestamp: new Date(),
          status,
          responseTime,
          metrics: {
            connections: activeConnections,
            errors: recentErrors,
          },
        };

        this.healthChecks.push(healthCheck);

        // Keep only recent health checks
        const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours
        this.healthChecks = this.healthChecks.filter(
          (hc) => hc.timestamp > cutoff
        );

        console.log(`📊 Health check completed: ${status} (${responseTime}ms)`);

        return healthCheck;
    } catch (error) {
        const healthCheck: HealthCheck = {
          id: healthCheckId,
          timestamp: new Date(),
          status: "unhealthy",
          responseTime: Date.now() - startTime,
          error: error instanceof Error ? error.message : "Unknown error",
          metrics: {
            connections: this.connections.size,
            errors: this.getRecentErrorCount(),
          },
        };

        this.healthChecks.push(healthCheck);
        console.error("📊 Health check failed:", error);

        return healthCheck;
    }
  }

  // Check for connection alerts
  private checkConnectionAlerts(connection: ConnectionMetrics): void {
    if (!this.config.enableAlerts) return;

    // High latency alert
    if (connection.latency > this.config.latencyThreshold) {
        this.createAlert({
          type: "high_latency",
          severity: "medium",
          message: `High latency detected: ${connection.latency}ms`,
          connectionId: connection.id,
          userId: connection.userId,
        });
    }

    // Packet loss alert
    if (connection.packetLoss > this.config.packetLossThreshold) {
        this.createAlert({
          type: "packet_loss",
          severity: "high",
          message: `High packet loss detected: ${connection.packetLoss}%`,
          connectionId: connection.id,
          userId: connection.userId,
        });
    }

    // Error spike alert
    if (connection.errorCount > this.config.errorThreshold) {
        this.createAlert({
          type: "error_spike",
          severity: "high",
          message: `High error count: ${connection.errorCount}`,
          connectionId: connection.id,
          userId: connection.userId,
        });
    }
  }

  // Create an alert
  createAlert(
    alertData: Omit<ConnectionAlert, "id" | "timestamp" | "resolved">
  ): void {
    const alert: ConnectionAlert = {
        id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        timestamp: new Date(),
        resolved: false,
        ...alertData,
    };

    this.alerts.push(alert);
    console.warn(`🚨 Alert created: ${alert.type} - ${alert.message}`);

    // Keep only recent alerts
    const cutoff = new Date(
        Date.now() - this.config.alertRetentionDays * 24 * 60 * 60 * 1000
    );
    this.alerts = this.alerts.filter((a) => a.timestamp > cutoff);
  }

  // Resolve an alert
  resolveAlert(alertId: string): boolean {
    const alert = this.alerts.find((a) => a.id === alertId);
    if (!alert || alert.resolved) return false;

    alert.resolved = true;
    alert.resolvedAt = new Date();
    console.log(`✅ Alert resolved: ${alertId}`);

    return true;
  }

  // Get connection statistics
  getConnectionStats(): {
    totalConnections: number;
    activeConnections: number;
    averageLatency: number;
    averagePacketLoss: number;
    totalErrors: number;
    connectionQualityDistribution: Record<string, number>;
    recentAlerts: number;
  } {
    const connections = Array.from(this.connections.values());
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    const activeConnections = connections.filter(
        (c) => c.status === "connected"
    ).length;
    const averageLatency =
        connections.reduce((sum, c) => sum + c.latency, 0) / connections.length ||
        0;
    const averagePacketLoss =
        connections.reduce((sum, c) => sum + c.packetLoss, 0) /
          connections.length || 0;
    const totalErrors = connections.reduce((sum, c) => sum + c.errorCount, 0);
    const recentAlerts = this.alerts.filter(
        (a) => a.timestamp > oneHourAgo && !a.resolved
    ).length;

    const qualityDistribution: Record<string, number> = {};
    connections.forEach((c) => {
        qualityDistribution[c.connectionQuality] =
          (qualityDistribution[c.connectionQuality] || 0) + 1;
    });

    return {
        totalConnections: connections.length,
        activeConnections,
        averageLatency,
        averagePacketLoss,
        totalErrors,
        connectionQualityDistribution: qualityDistribution,
        recentAlerts,
    };
  }

  // Get health check history
  getHealthCheckHistory(hours: number = 24): HealthCheck[] {
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
    return this.healthChecks.filter((hc) => hc.timestamp > cutoff);
  }

  // Get active alerts
  getActiveAlerts(): ConnectionAlert[] {
    return this.alerts.filter((a) => !a.resolved);
  }

  // Get connection by ID
  getConnection(connectionId: string): ConnectionMetrics | undefined {
    return this.connections.get(connectionId);
  }

  // Get user connections
  getUserConnections(userId: string): ConnectionMetrics[] {
    return Array.from(this.connections.values())
        .filter((c) => c.userId === userId)
        .sort((a, b) => b.lastActivity.getTime() - a.lastActivity.getTime());
  }

  // Calculate connection quality
  private calculateConnectionQuality(
    connection: ConnectionMetrics
  ): ConnectionMetrics["connectionQuality"] {
    if (connection.latency < 100 && connection.packetLoss < 1) {
        return "excellent";
    }
    if (connection.latency < 500 && connection.packetLoss < 3) {
        return "good";
    }
    if (connection.latency < 1000 && connection.packetLoss < 5) {
        return "fair";
    }
    return "poor";
  }

  // Get recent error count
  private getRecentErrorCount(): number {
    const now = new Date();
    const oneMinuteAgo = new Date(now.getTime() - 60 * 1000);

    return this.alerts.filter(
        (a) =>
          a.timestamp > oneMinuteAgo &&
          (a.type === "error_spike" || a.type === "connection_lost")
    ).length;
  }

  // Start health checks
  private startHealthChecks(): void {
    this.healthCheckTimer = setInterval(() => {
        this.performHealthCheck();
    }, this.config.healthCheckInterval);
  }

  // Stop health checks
  private stopHealthChecks(): void {
    if (this.healthCheckTimer) {
        clearInterval(this.healthCheckTimer);
        this.healthCheckTimer = null;
    }
  }

  // Update configuration
  updateConfig(newConfig: Partial<ConnectionMonitorConfig>): void {
    this.config = { ...this.config, ...newConfig };

    // Restart health checks if interval changed
    if (newConfig.healthCheckInterval) {
        this.stopHealthChecks();
        if (this.config.enableHealthChecks) {
          this.startHealthChecks();
        }
    }

    console.log("📊 Connection monitor configuration updated");
  }

  // Get current configuration
  getConfig(): ConnectionMonitorConfig {
    return { ...this.config };
  }

  // Cleanup resources
  cleanup(): void {
    this.stopHealthChecks();
    this.connections.clear();
    this.healthChecks.length = 0;
    this.alerts.length = 0;
    console.log("🧹 Connection monitor cleaned up");
  }
}

// Global connection monitor instance
export const connectionMonitor = new ConnectionMonitor();

// Middleware function for connection monitoring
export function withConnectionMonitoring(
  handler: (request: NextRequest) => Promise<NextResponse>,
  options: {
    trackMetrics?: boolean;
    requireConnection?: boolean;
  } = {}
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const startTime = Date.now();
    const connectionId = request.headers.get("x-connection-id");
    const userId = request.headers.get("x-user-id");

    try {
        const response = await handler(request);
        const responseTime = Date.now() - startTime;

        // Track metrics if enabled
        if (options.trackMetrics && connectionId && userId) {
          connectionMonitor.updateConnectionActivity(connectionId, {
            latency: responseTime,
          });
        }

        // Add monitoring headers
        response.headers.set("X-Response-Time", responseTime.toString());
        response.headers.set("X-Connection-Monitored", "true");

        return response;
    } catch (error) {
        const responseTime = Date.now() - startTime;

        // Track error metrics
        if (options.trackMetrics && connectionId && userId) {
          const connection = connectionMonitor.getConnection(connectionId);
          if (connection) {
            connectionMonitor.updateConnectionActivity(connectionId, {
              errorCount: connection.errorCount + 1,
            });
          }
        }

        throw error;
    }
  };
}
