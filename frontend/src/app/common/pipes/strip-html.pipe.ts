import { Pipe, PipeTransform } from '@angular/core';

const TRUNCATE_LENGTH = 120;

@Pipe({ name: 'stripHtml', standalone: true })
export class StripHtmlPipe implements PipeTransform {
  transform(value: string): string {
    if (!value) return '';
    const text = value
      .replace(/<(pre|code)[^>]*>[\s\S]*?<\/\1>/gi, '')
      .replace(/<[^>]*>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\s+/g, ' ')
      .trim();
    return text.length > TRUNCATE_LENGTH ? text.slice(0, TRUNCATE_LENGTH) + '…' : text;
  }
}
