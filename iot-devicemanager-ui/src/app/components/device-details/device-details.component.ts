import { CommonModule, DatePipe } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CookieService } from 'ngx-cookie-service';
import { interval, Subscription, forkJoin } from 'rxjs';

interface Alarm {
  id?: string;
  tenantId?: { id?: string };
  type?: string;
  originator?: { id?: string; entityType?: string };
  severity?: string;
  status?: string;
  startTs?: number;
  endTs?: number;
  ackTs?: number;
  clearTs?: number;
  details?: any;
  propagate?: boolean;
  propagateToOwner?: boolean;
  propagateToTenant?: boolean;
  propagateRelationTypes?: string[];
}

interface DeviceInfo {
  id?: { id?: string; entityType?: string };
  createdTime?: number;
  tenantId?: { id?: string };
  customerId?: { id?: string };
  name?: string;
  type?: string;
  label?: string;
  additionalInfo?: {
    description?: string;
    [key: string]: any;
  };
  deviceProfileId?: { id?: string };
  deviceProfileName?: string;
  active?: boolean;
}

@Component({
  selector: 'app-device-details',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, DatePipe],
  templateUrl: './device-details.component.html',
  styleUrls: ['./device-details.component.scss']
})
export class DeviceDetailsComponent implements OnInit, OnDestroy {
  device: DeviceInfo | null = null;
  alarms: Alarm[] = [];
  isLoading = true;
  error: string | null = null;
  private apiUrl = 'http://localhost:8081/api/iot';
  private telemetryUrl = 'http://localhost:8080/api/v1';
  private telemetrySubscription: Subscription | undefined;
  isConnected = false;
  telemetryData: any = null;
  deviceProfileType: 'TEMPERATURE_SENSOR' | 'POWER_METER' | 'UNKNOWN' = 'UNKNOWN';

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient,
    private cookieService: CookieService
  ) {}

  ngOnInit(): void {
    const deviceId = this.route.snapshot.paramMap.get('id');
    if (deviceId) {
      this.loadDeviceDetails(deviceId);
      this.checkConnectionStatus(deviceId);
    } else {
      this.handleError('Device ID not found');
    }
  }

  ngOnDestroy(): void {
    this.cleanupTelemetrySubscription();
  }

  private checkConnectionStatus(deviceId: string): void {
    this.isConnected = this.cookieService.get(`device_${deviceId}_connected`) === 'true';
    if (this.isConnected) {
      this.startTelemetrySubscription(deviceId);
    }
  }

  private loadDeviceDetails(deviceId: string): void {
    const token = this.cookieService.get('auth_token');
    if (!token) {
      this.handleError('Authentication required');
      return;
    }

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json'
    });

    this.isLoading = true;
    this.error = null;

    forkJoin([
      this.http.get<DeviceInfo>(`${this.apiUrl}/${deviceId}/info`, { headers }),
      this.http.get<Alarm[]>(`${this.apiUrl}/${deviceId}/alarms`, { headers })
    ]).subscribe({
      next: ([deviceInfo, alarms]) => {
        this.device = deviceInfo;
        this.alarms = alarms;
        this.determineDeviceProfile(deviceInfo);
        this.isLoading = false;
      },
      error: (err) => {
        this.handleError(err.message || 'Failed to load device details');
      }
    });
  }

  private determineDeviceProfile(deviceInfo: DeviceInfo): void {
    if (deviceInfo.deviceProfileName?.toLowerCase().includes('temperature')) {
      this.deviceProfileType = 'TEMPERATURE_SENSOR';
    } else if (deviceInfo.deviceProfileName?.toLowerCase().includes('power')) {
      this.deviceProfileType = 'POWER_METER';
    } else {
      this.deviceProfileType = 'UNKNOWN';
    }
  }

  private startTelemetrySubscription(deviceId: string): void {
    this.generateSimulatedTelemetry();
    this.telemetrySubscription = interval(3000).subscribe(() => {
      this.generateSimulatedTelemetry();
      this.sendTelemetryData(deviceId);
    });
  }

  private generateSimulatedTelemetry(): void {
    switch (this.deviceProfileType) {
      case 'TEMPERATURE_SENSOR':
        this.telemetryData = {
          temperature: Math.floor(Math.random() * 10 + 20),
          humidity: Math.floor(Math.random() * 15 + 30)
        };
        break;
      case 'POWER_METER':
        this.telemetryData = {
          power: Math.floor(Math.random() * 5000),
          voltage: Math.floor(Math.random() * 240)
        };
        break;
      default:
        this.telemetryData = {
          temperature: Math.floor(Math.random() * 10 + 20),
          humidity: Math.floor(Math.random() * 15 + 30),
          power: Math.floor(Math.random() * 5000),
          voltage: Math.floor(Math.random() * 240)
        };
    }
  }

  connectDevice(): void {
    const deviceId = this.device?.id?.id;
    if (deviceId) {
      this.isConnected = true;
      this.cookieService.set(`device_${deviceId}_connected`, 'true');
      this.startTelemetrySubscription(deviceId);
    }
  }

  disconnectDevice(): void {
    const deviceId = this.device?.id?.id;
    if (deviceId) {
      this.isConnected = false;
      this.cookieService.set(`device_${deviceId}_connected`, 'false');
      this.cleanupTelemetrySubscription();
      this.telemetryData = null;
    }
  }

  private cleanupTelemetrySubscription(): void {
    if (this.telemetrySubscription) {
      this.telemetrySubscription.unsubscribe();
      this.telemetrySubscription = undefined;
    }
  }

  private sendTelemetryData(deviceId: string): void {
  // ThingsBoard expects telemetry data in a specific format
  const payload = {
    ts: Date.now(),  // Current timestamp
    values: this.telemetryData  // Our telemetry values
  };

  const headers = new HttpHeaders({
    'Content-Type': 'application/json',
    // Add authorization if required by your ThingsBoard setup
    'X-Authorization': `Bearer ${this.cookieService.get('auth_token')}`
  });

  // Construct the proper ThingsBoard telemetry endpoint URL
  const url = `${this.telemetryUrl}/${deviceId}/telemetry`;

  this.http.post(url, payload, { headers }).subscribe({
    next: () => console.log('Telemetry sent successfully to ThingsBoard'),
    error: (err) => {
      console.error('Telemetry submission error:', err);
      // Optionally add retry logic here
    }
  });
  }

  private handleError(message: string): void {
    this.error = message;
    this.isLoading = false;
  }

  getAlarmSeverityClass(severity?: string): string {
    switch (severity) {
      case 'CRITICAL': return 'bg-red-50 border-red-200 text-red-800';
      case 'WARNING': return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      default: return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  }

  getAlarmSeverityIcon(severity?: string): string {
    switch (severity) {
      case 'CRITICAL': return '❗';
      case 'WARNING': return '⚠️';
      default: return 'ℹ️';
    }
  }

  getTelemetryKeys(): string[] {
    return Object.keys(this.telemetryData || {});
  }
}