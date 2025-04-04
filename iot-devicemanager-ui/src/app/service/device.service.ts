import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

interface DeviceDetails {
  id: { id: string };
  name: string;
  type: string;
  active: boolean;
  createdTime: number;
  additionalInfo?: {
    description?: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class DeviceService {
  private apiUrl = 'http://localhost:8081/api/iot';

  constructor(private http: HttpClient) {}

  getDeviceDetails(deviceId: string, token: string): Observable<DeviceDetails> {
    const cleanToken = token.startsWith('Bearer ') ? token.split(' ')[1] : token;
    
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${cleanToken}`,
      'Content-Type': 'application/json'
    });

    return this.http.get<DeviceDetails>(`${this.apiUrl}/${deviceId}`, { headers });
  }
}
