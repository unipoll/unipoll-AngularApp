import { Component, ElementRef, Inject, ViewChild, inject } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { DialogUpdateModel } from 'src/app/models/dialog.model';
import { ApiService } from 'src/app/services/api.service';
import { SnackBarService } from 'src/app/services/snackbar.service';
import { WorkspaceService } from 'src/app/services/workspace.service';
import { DialogCreateComponent } from '../dialog-create/dialog-create.component';
import { PolicyModel, SetPolicyRequest } from 'src/app/models/policy.model';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { ENTER, COMMA } from '@angular/cdk/keycodes';
import { Observable, startWith, map } from 'rxjs';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MemberModel } from 'src/app/models/member.model';

@Component({
  selector: 'app-dialog-set-policy',
  templateUrl: './dialog-set-policy.component.html',
  styleUrls: ['./dialog-set-policy.component.scss']
})
export class DialogSetPolicyComponent {
  separatorKeysCodes: number[] = [ENTER, COMMA];
  permissionCtrl = new FormControl('');
  filteredPermissions: Observable<string[]>;
  permissions: string[] = [];
  allPermission: string[] = ["get_workspace","get_workspace_members","get_groups","get_workspace_policies","get_workspace_policy"];
  policy: PolicyModel;

  @ViewChild('permissionInput') permissionInput!: ElementRef<HTMLInputElement>;

  announcer = inject(LiveAnnouncer);

  constructor(
    private _workspaceService: WorkspaceService,
    private _apiService: ApiService,
    private _dialog: MatDialogRef<DialogCreateComponent>,
    private _snackBarService: SnackBarService,
    @Inject(MAT_DIALOG_DATA) private data: any
  ) {
    // this.allPermission = this.data.allPermission;
    console.log("Data", this.data);
    console.log("All Permission", this.data);
    this.policy = this.data.policy;
    console.log("Policy Data", this.policy);
    this.permissions = this.data.policy.permissions.map((permission: string) => permission);
    this.allPermission = this.allPermission.filter((permission: string) => !this.permissions.includes(permission));

    this.filteredPermissions = this.permissionCtrl.valueChanges.pipe(
      startWith(''),
      map((permission: string | null) => (permission ? this.filter(permission) : this.allPermission.slice())),
    );
  }

  ngOnInit(): void {
    // this.form.patchValue(this.data);
    // this.form.setValue({
    //   permissions: this.data.permissions,
    // });
  }

  onFormSubmit() {
    let request_method = null;
    
    let request_data = {
      policy_id: this.policy.id,
      permissions: this.permissions
    };

    console.log("Resource Type", this.data.resource.type);
    if (this.data.resource.type == 'workspace') {
      console.log("request_data", request_data);
      request_method = this._apiService.setWorkspacePolicy(this.data.resource.id, request_data);
    } else if (this.data.resource_type == 'group') {
      request_method = this._apiService.setGroupPolicy(this.data.resource.id, request_data);
    }


    if (request_method) {
      console.log("Request: ", request_data);
      request_method.subscribe({
        next: (val: any) => {
          this._snackBarService.openSnackBar('Workspace updated successfully');
          this._dialog.close(true);
        },
        error: (err: any) => {
          console.error(err);
        },
      });
    }
    this._dialog.close(true);
  }

  // displayFn(permission: string): string {
  //   return permission.replaceAll('_', ' ');
  // }

  // When a chip is removed
  remove(permission: string): void {
    const index = this.permissions.indexOf(permission);

    if (index >= 0) {
      this.permissions.splice(index, 1);   // Remove chip
      this.allPermission.push(permission);    // Add back to the autocomplete list
      this.permissionCtrl.setValue(null);  // Clear the input value to reset the autocomplete
      this.announcer.announce(`Removed ${permission}`);
    }
  }

  // When item is selected from the list
  selected(event: MatAutocompleteSelectedEvent): void {
    this.permissions.push(event.option.value);
    let index = this.allPermission.indexOf(event.option.value);
    this.allPermission.splice(index, 1);  // Remove from autocomplete list
    console.log("Permission Input", this.permissionInput);
    this.permissionInput.nativeElement.value = '';
    this.permissionCtrl.setValue(null);
  }

  private filter(value: string): string[] {
    // console.log("Filter Value", value);
    const filterValue = value.toLowerCase().replaceAll(' ', '_');
    return this.allPermission.filter(permission => permission.toLowerCase().includes(filterValue));
  }

}
