import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CookieService } from 'ngx-cookie-service';

@Component({
  selector: 'app-rule-chain-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, DatePipe],
  templateUrl: './rule-chain-list.component.html',
  styleUrls: ['./rule-chain-list.component.scss']
})
export class RuleChainListComponent implements OnInit {
  ruleChains: any[] = [];
  isLoading = true;
  currentPage = 1;
  pageSize = 10;
  totalItems = 0;
  error = '';

  constructor(
    private http: HttpClient,
    private router: Router,
    private cookieService: CookieService
  ) { }

  ngOnInit(): void {
    this.loadRuleChains();
  }

  loadRuleChains(): void {
    this.isLoading = true;
    this.error = '';
    
    const authToken = this.cookieService.get('auth_token');

    if (!authToken) {
      this.error = 'Authentication required. Please login first.';
      this.isLoading = false;
      return;
    }
    
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${authToken}`,
      'Accept': 'application/json'
    });

    const url = `http://localhost:8081/api/iot/rule-chains?pageSize=${this.pageSize}&page=${this.currentPage - 1}`;


    this.http.get<any[]>(url, { headers }).subscribe({
      next: (response) => {
        this.ruleChains = response;
        this.totalItems = response.length; // Adjust if your API returns total count differently
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading rule chains:', err);
        this.error = 'Failed to load rule chains. Please try again.';
        this.isLoading = false;
      }
    });
  }

  navigateToAdd(): void {
    this.router.navigate(['/rule-chains/add']);
  }

  viewDetails(ruleChainId: string): void {
    this.router.navigate(['/rule-chains', ruleChainId]);
  }

  onPageChange(newPage: number): void {
    this.currentPage = newPage;
    this.loadRuleChains();
  }

  getRuleChainTypeBadgeClass(type: string): string {
    switch (type) {
      case 'CORE': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  getRootStatusBadgeClass(isRoot: boolean): string {
    return isRoot ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800';
  }

  getMinValue(a: number, b: number): number {
    return Math.min(a, b);
  }
}