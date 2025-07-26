import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'capitalize'
})
export class CapitalizePipe implements PipeTransform {

  transform(value: string): string {
    if (!value) return '';
    return value.replace(/\w\S*/g, (txt) =>
      txt.charAt(0).toUpperCase() + txt.substring(1).toLowerCase()
    );
  }
}
