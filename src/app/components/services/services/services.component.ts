import { UserCreateDialogComponent } from './../../users/user-create-dialog/user-create-dialog.component';
import { MatDialog } from '@angular/material';
import { Component, OnInit } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';

import { NexusService } from '../../../services/nexus.service';

import { environment } from '../../../../environments/environment';
import { Max, Min, isPrefix } from '../../../shared/functions';
import { NexusFacade } from '../../../services/nexus_facade';
import { NewServiceDialogComponent } from '../new-service-dialog/new-service-dialog.component';

declare var JSONEditor;
@Component({
  selector: 'app-services',
  templateUrl: './services.component.html',
  styleUrls: ['./services.component.css']
})
export class ServicesComponent implements OnInit {
  services: any = {};
  serviceshow: string[] = [];
  servicepaths: string[] = [];
  prefix = new FormControl('');
  subscriptions: any[] = [];
  editor: any;
  errors: any;

  constructor(
    private nexus: NexusService,
    private nxf: NexusFacade,
    public dialog: MatDialog
  ) { }

  ngOnDestroy() {
    for (let subscription of this.subscriptions) {
      subscription.unsubscribe();
    }
  }

  async ngOnInit() {
    this.servicepaths = [];
    this.serviceshow= [];
    this.prefix = new FormControl('');
    this.subscriptions= [];

    await this.listPulls();
    
    let services = await this.nxf.getServices();
    for (let i = 0; i < services.length; i++) {
      let servicepath = services[i];
      this.services[servicepath] = { pulls: 0 };
      this.servicepaths.push(servicepath);
      this.updateInfo(servicepath);
      this.updateSchema(servicepath);
    }

    this.serviceshow = this.servicepaths;

    this.subscriptions.push(this.prefix.valueChanges.debounceTime(300).subscribe(p => {
      this.serviceshow = [];
      for (let path of this.servicepaths) {
        if (isPrefix(p, path)) {
          this.serviceshow.push(path);
        }
      }
    }));
  }

  async listPulls() {
    for (let path in this.services) {
      this.services[path].pulls = 0;
    }
    await this.nexus.taskList('', 0, 0).then(tasks => {
      for (let task of tasks) {
        if (task.Method === '') {
          let path = task.Path.slice(0, -1);
          if (this.services[path]) {
            this.services[path]['pulls']++;
          }
        }
      }
    }).catch(e => console.log(e));
  }

  async updateInfo(servicepath: string) {
    await this.nexus.taskPush(servicepath + '.@info', null, 5).then(res => {
      this.services[servicepath]['info'] = res;
    }).catch(err => console.log('Service @info error:', err));
  }

  async updateSchema(servicepath: string) {
    await this.nexus.taskPush(servicepath + '.@schema', null, 5).then(res => {
      res = res.methods;
      this.services[servicepath]['schema'] = res;
      this.services[servicepath]['methodSelected'] = new FormControl('', [Validators.required]);
      this.services[servicepath]['schemastring'] = JSON.stringify(res, null, 2);
      this.services[servicepath]['methods'] = [];
      for (let method in res) {
        if (["@ping", "@info", "@schema"].indexOf(method) < 0) {
          this.services[servicepath]['methods'].push(method);
        }
      }
      this.subscriptions.push(this.services[servicepath]['methodSelected'].valueChanges.subscribe(v => {
        this.services[servicepath]['pushSchema'] = undefined;
        this.services[servicepath]['noSchema'] = false;
        this.services[servicepath]['methodschemastring'] = "";
        if (res[v]['input']) {
          this.services[servicepath]['pushSchema'] = res[v]['input'];
          this.services[servicepath]['methodschemastring'] = JSON.stringify(res[v]['input'], null, 2);
        } else {
          this.services[servicepath]['noSchema'] = true;
        }
        this.initEditor(res[v].input, v);
      }));
    }).catch(err => console.log('Service @schema error:', err));
  }

  pingService(path: string) {
    this.services[path]['ping'] = undefined;
    let max = 0, min = 15000, avg = 0, i = 0;
    let start = new Date();
    let ping = () => {
      if (i === 10) {
        this.services[path]['ping'] = {
          max: max,
          min: min,
          avg: avg / 10
        };
        this.updateInfo(path);
        return;
      }
      i++;
      this.nexus.taskPush(path + '.@ping', null, 5).then(() => {
        let end = new Date();
        let timediff = end.getTime() - start.getTime();
        max = Max(max, timediff);
        min = Min(min, timediff);
        avg += timediff;
        start = new Date();
        ping();
      }).catch(() => {
        this.services[path]['info'] = undefined;
      });
    }
    ping();
  }

  pushService(path: string, event: any) {
    this.services[path]['pushResult'] = undefined;
    this.services[path]['pushError'] = undefined;
    this.nexus.taskPush(path + '.' + this.services[path]['methodSelected'].value, event, 10).then(res => {
      this.services[path]['pushResult'] = JSON.stringify(res, null, 2);
    }).catch(err => {
      this.services[path]['pushError'] = JSON.stringify(err, null, 2);
    });
  }

  initEditor(schema, method: string) {
    let e = document.getElementById('editor_holder_' + method);
    if (this.editor) {
      this.editor.destroy();
    }
    
    if (schema) {
      this.editor = new JSONEditor(e, {
        schema: schema
      });
    }
  }
  push(path) {
    this.errors = null;
    this.errors = this.editor.validate();
    if (this.errors.length == 0) {
      var value = this.editor.getValue();
      this.pushService(path, value);
    }
  }

  newService(){
    let dialogRef = this.dialog.open(NewServiceDialogComponent, { width: '400px' });

    dialogRef.afterClosed().subscribe(result => {
      if (result){
        this.ngOnInit();
      }
    });
  }
}


