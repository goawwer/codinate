import { inject, Pipe, PipeTransform } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

@Pipe({ name: 'employeeRole', standalone: true })
export class EmployeeRolePipe implements PipeTransform {
  private readonly translate = inject(TranslateService);

  transform(role: string): string {
    const key = `employee_roles.${role}`;
    const translated = this.translate.instant(key);
    return translated !== key ? translated : role;
  }
}
