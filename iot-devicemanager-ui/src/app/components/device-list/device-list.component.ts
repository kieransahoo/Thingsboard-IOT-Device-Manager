// device-list.component.ts
import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { CookieService } from 'ngx-cookie-service';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

interface Device {
  id: {
    entityType: string;
    id: string;
  };
  name: string;
  type: string;
  createdTime: number;
  active: boolean;
  // Add other properties as needed
}

@Component({
  selector: 'app-device-list',
  standalone: true,
  imports: [CommonModule,RouterLink],
  templateUrl: './device-list.component.html',
  styleUrls: ['./device-list.component.scss']
})
export class DeviceListComponent implements OnInit {
  devices: Device[] = [];
  isLoading = true;
  error: string | null = null;
  currentPage = 0;
  pageSize = 10;

  constructor(private http: HttpClient, private cookieService: CookieService) {}

  ngOnInit(): void {
    this.fetchDevices();
  }

  fetchDevices(): void {
    this.isLoading = true;
    const token = this.cookieService.get('auth_token');

    if (!token) {
      this.error = 'Authentication required. Please login first.';
      this.isLoading = false;
      return;
    }

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json'
    });

    const url = `http://localhost:8081/api/iot/devices/${this.pageSize}/${this.currentPage}`;

    this.http.get<Device[]>(url, { headers }).subscribe(
      (response) => {
        this.devices = response;
        this.isLoading = false;
      },
      (err) => {
        this.handleError(err);
      }
    );
  }

  changePage(page: number): void {
    if (page >= 0) {
      this.currentPage = page;
      this.fetchDevices();
    }
  }

  nextPage(): void{
    this.currentPage++;
    this.fetchDevices();
  }

  previousPage(): void {
    if(this.currentPage > 0){
      this.currentPage--;
      this.fetchDevices();
    }
  }

  refreshPage(): void {
    this.fetchDevices();
  }

  private handleError(err: any): void {
    this.isLoading = false;
    if (err.status === 401) {
      this.error = 'Session expired. Please login again.';
    } else if (err.status === 403) {
      this.error = 'You don\'t have permission to view devices.';
    } else if (err.status === 404) {
      this.error = 'Devices API endpoint not found.';
    } else {
      this.error = 'Failed to load devices. Please try again later.';
    }
    console.error('API Error:', err);
  }
}