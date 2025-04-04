import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { CookieService } from 'ngx-cookie-service';
import { interval, Subscription } from 'rxjs';

interface Device {
  id: string;
  name: string;
  type: string;
  telemetry?: any;
  alarms?: any[];
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent implements OnInit, OnDestroy {
  devices: Device[] = [];
  private telemetrySubscriptions: { [deviceId: string]: Subscription } = {};
  private alarmSubscriptions: { [deviceId: string]: Subscription } = {};

  constructor(private http: HttpClient, private cookieService: CookieService) {}

  ngOnInit(): void {
    this.fetchDevices();
  }

  ngOnDestroy(): void {
    Object.values(this.telemetrySubscriptions).forEach((sub) => sub.unsubscribe());
    Object.values(this.alarmSubscriptions).forEach((sub) => sub.unsubscribe());
  }

  fetchDevices(): void {
    const token = this.cookieService.get('auth_token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    const apiUrl = 'http://localhost:8081/api/iot/devicelist'; // Use devicelist API

    this.http.get<any[]>(apiUrl, { headers }).subscribe(
      (data) => {
        this.devices = data.map((device) => ({
          id: device.id.id,
          name: device.name,
          type: device.type,
        }));
        this.fetchTelemetryAndAlarms();
      },
      (error) => {
        console.error('Error fetching devices:', error);
      }
    );
  }

  fetchTelemetryAndAlarms(): void {
    this.devices.forEach((device) => {
      this.telemetrySubscriptions[device.id] = interval(5000).subscribe(() => this.fetchTelemetry(device));
      this.alarmSubscriptions[device.id] = interval(10000).subscribe(() => this.fetchAlarms(device));
    });
  }

  fetchTelemetry(device: Device): void {
    const token = this.cookieService.get('auth_token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    const apiUrl = `http://localhost:8080/api/v1/${device.id}/telemetry`;

    this.http.get<any>(apiUrl, { headers }).subscribe(
      (telemetry) => {
        device.telemetry = telemetry;
      },
      (error) => {
        console.error(`Error fetching telemetry for ${device.name}:`, error);
      }
    );
  }

  fetchAlarms(device: Device): void {
    const token = this.cookieService.get('auth_token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    const apiUrl = `http://localhost:8081/api/iot/${device.id}/alarms`;

    this.http.get<any[]>(apiUrl, { headers }).subscribe(
      (alarms) => {
        device.alarms = alarms;
      },
      (error) => {
        console.error(`Error fetching alarms for ${device.name}:`, error);
      }
    );
  }
}