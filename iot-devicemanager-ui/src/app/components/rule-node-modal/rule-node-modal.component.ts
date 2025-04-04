import { CommonModule, JsonPipe } from '@angular/common';
import { Component, Input } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-rule-node-modal',
  standalone: true,
  imports: [CommonModule, JsonPipe],
  template: `
    <div class="modal-header">
      <h4 class="modal-title">{{node.name}}</h4>
      <button type="button" class="btn-close" aria-label="Close" (click)="activeModal.dismiss()"></button>
    </div>
    <div class="modal-body">
      <div class="mb-3">
        <h5>Type</h5>
        <p>{{node.type}}</p>
      </div>
      
      <div class="mb-3" *ngIf="node.configuration">
        <h5>Configuration</h5>
        <pre class="p-2 bg-light rounded">{{node.configuration | json}}</pre>
      </div>
      
      <div *ngIf="node.configuration?.jsScript">
        <h5>JavaScript</h5>
        <pre class="p-2 bg-light rounded">{{node.configuration.jsScript}}</pre>
      </div>
      
      <div *ngIf="node.configuration?.tbelScript">
        <h5>TBEL Script</h5>
        <pre class="p-2 bg-light rounded">{{node.configuration.tbelScript}}</pre>
      </div>
    </div>
    <div class="modal-footer">
      <button type="button" class="btn btn-secondary" (click)="activeModal.close()">Close</button>
    </div>
  `,
  styles: [`
    pre {
      max-height: 300px;
      overflow-y: auto;
    }
  `]
})
export class RuleNodeModalComponent {
  @Input() node: any;

  constructor(public activeModal: NgbActiveModal) {}
}