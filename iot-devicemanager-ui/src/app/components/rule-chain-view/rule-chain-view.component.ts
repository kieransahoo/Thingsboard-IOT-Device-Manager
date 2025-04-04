import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CookieService } from 'ngx-cookie-service';

@Component({
  selector: 'app-rule-chain-view',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, DatePipe],
  templateUrl: './rule-chain-view.component.html',
  styleUrls: ['./rule-chain-view.component.scss']
})
export class RuleChainViewComponent implements OnInit {
  ruleChain: any = null;
  isLoading = true;
  error = '';
  ruleChainId: string = '';

  constructor(
    private http: HttpClient,
    private route: ActivatedRoute,
    private router: Router,
    private cookieService: CookieService
  ) { }

  ngOnInit(): void {
    this.ruleChainId = this.route.snapshot.paramMap.get('id') || '';
    if (!this.ruleChainId) {
      this.error = 'No rule chain ID provided';
      this.isLoading = false;
      return;
    }
    this.loadRuleChain();
  }

  loadRuleChain(): void {
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

    const url = `http://localhost:8081/api/iot/rule-chains/${this.ruleChainId}`;

    this.http.get<any>(url, { headers }).subscribe({
      next: (response) => {
        this.ruleChain = response;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading rule chain:', err);
        this.error = 'Failed to load rule chain details. Please try again.';
        this.isLoading = false;
      }
    });
  }

  navigateToEdit(): void {
    this.router.navigate(['/rule-chains', this.ruleChainId, 'edit']);
  }

  goBack(): void {
    this.router.navigate(['/rule-chains']);
  }

  getBadgeClass(type: string): string {
    switch (type) {
      case 'CORE': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }
}