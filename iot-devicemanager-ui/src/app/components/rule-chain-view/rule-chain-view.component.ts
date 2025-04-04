import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CookieService } from 'ngx-cookie-service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { RuleNodeModalComponent } from '../rule-node-modal/rule-node-modal.component';

@Component({
  selector: 'app-rule-chain-view',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe],
  templateUrl: './rule-chain-view.component.html',
  styleUrls: ['./rule-chain-view.component.scss']
})
export class RuleChainViewComponent implements OnInit {
  ruleChain: any = null;
  isLoading = true;
  error = '';
  ruleChainId: string = '';
  selectedNode: any = null;
  svgConnections: any[] = [];

  constructor(
    private http: HttpClient,
    private route: ActivatedRoute,
    private router: Router,
    private cookieService: CookieService,
    private modalService: NgbModal
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

    const url = `http://localhost:8080/api/ruleChain/${this.ruleChainId}/metadata`;

    this.http.get<any>(url, { headers }).subscribe({
      next: (response) => {
        this.ruleChain = response;
        this.processConnections();
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading rule chain:', err);
        this.error = 'Failed to load rule chain details. Please try again.';
        this.isLoading = false;
      }
    });
  }

  processConnections(): void {
    if (!this.ruleChain?.connections || !this.ruleChain?.nodes) return;
    
    this.svgConnections = this.ruleChain.connections.map((conn: any) => {
      const fromNode = this.ruleChain.nodes[conn.fromIndex];
      const toNode = this.ruleChain.nodes[conn.toIndex];
      
      return {
        fromX: fromNode.additionalInfo?.layoutX || 0,
        fromY: fromNode.additionalInfo?.layoutY || 0,
        toX: toNode.additionalInfo?.layoutX || 0,
        toY: toNode.additionalInfo?.layoutY || 0,
        type: conn.type
      };
    });
  }

  openNodeDetails(node: any): void {
    this.selectedNode = node;
    const modalRef = this.modalService.open(RuleNodeModalComponent, { size: 'lg' });
    modalRef.componentInstance.node = node;
  }

  getNodeTypeClass(type: string): string {
    const typeMap: {[key: string]: string} = {
      'org.thingsboard.rule.engine.debug.TbMsgGeneratorNode': 'bg-purple-100 text-purple-800',
      'org.thingsboard.rule.engine.telemetry.TbMsgTimeseriesNode': 'bg-green-100 text-green-800',
      'default': 'bg-gray-100 text-gray-800'
    };
    return typeMap[type] || typeMap['default'];
  }

  navigateToEdit(): void {
    this.router.navigate(['/rule-chains', this.ruleChainId, 'edit']);
  }

  goBack(): void {
    this.router.navigate(['/rule-chains']);
  }
}