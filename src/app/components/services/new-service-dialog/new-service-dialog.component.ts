import { MatDialogRef, MatSnackBar } from '@angular/material';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { Component, OnInit } from '@angular/core';
import { NexusService } from '../../../services/nexus.service';

@Component({
  selector: 'app-new-service-dialog',
  templateUrl: './new-service-dialog.component.html',
  styleUrls: ['./new-service-dialog.component.css']
})
export class NewServiceDialogComponent implements OnInit {
  form: FormGroup;
  creating: boolean = false;
  hide: boolean = true;

  constructor(
    public dialogRef: MatDialogRef<NewServiceDialogComponent>,
    private fb: FormBuilder,
    private nexus: NexusService,
    public snackBar: MatSnackBar
  ) { }

  ngOnInit() {
    this.form = this.fb.group({
      name: ['', Validators.required],
    });
  }

  addService() {
    this.creating = true;
    let v = this.form.value;
    this.nexus.userSetTags("web.nexus-dashboard", "services", {[v.name]: true}).then(res => {
      this.dialogRef.close(true);
    }).catch(err => {
      this.snackBar.open('Error setting new service: ' + err.message, 'OK');
      this.dialogRef.close(false);
    });
  }

  cancel(): void {
    this.dialogRef.close(false);
  }
}
