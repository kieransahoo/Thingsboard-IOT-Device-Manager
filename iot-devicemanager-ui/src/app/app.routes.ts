import { Routes } from '@angular/router';
import { DeviceListComponent } from './components/device-list/device-list.component';
import { HomeComponent } from './components/home/home.component';
import { LoginComponent } from './components/login/login.component';
import { SignupComponent } from './components/signup/signup.component';
import { DeviceDetailsComponent } from './components/device-details/device-details.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { RuleChainListComponent } from './components/rule-chain-list/rule-chain-list.component';
import { RuleChainViewComponent } from './components/rule-chain-view/rule-chain-view.component';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'devices', component: DeviceListComponent },
  { path: 'login', component: LoginComponent },
  { path: 'signup', component: SignupComponent},
  {path: 'devices/:id',component: DeviceDetailsComponent},
  { path: 'dashboard', component: DashboardComponent },
  { path: 'rule-chains', component: RuleChainListComponent },
  { path: 'rule-chains/:id', component: RuleChainViewComponent },
];
  
