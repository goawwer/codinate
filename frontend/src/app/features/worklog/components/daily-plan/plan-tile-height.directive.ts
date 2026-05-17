import { AfterViewInit, Directive, ElementRef, inject, NgZone, OnDestroy } from '@angular/core';

@Directive({
  selector: 'tui-tile[planTileHeight]',
  standalone: true,
})
export class PlanTileHeightDirective implements AfterViewInit, OnDestroy {
  private readonly el = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly zone = inject(NgZone);
  private tile?: HTMLElement;
  private content?: HTMLElement;

  private observer?: ResizeObserver;
  private frameId: number | null = null;
  private lastRows = 0;

  ngAfterViewInit(): void {
    this.tile = this.el.nativeElement;
    this.content = this.tile.querySelector<HTMLElement>('.plan-card') ?? this.tile;

    this.zone.runOutsideAngular(() => {
      this.observer = new ResizeObserver(() => this.scheduleUpdate());

      this.observer.observe(this.content!);

      // tui-elastic-container animates via CSS height — its rendered size
      // changes each frame, so observing it drives smooth row updates.
      this.tile!.querySelectorAll('tui-elastic-container').forEach((el) => {
        this.observer!.observe(el);
      });

      this.scheduleUpdate();
    });
  }

  recalculate(): void {
    this.scheduleUpdate();
    window.setTimeout(() => this.scheduleUpdate(), 250);
  }

  private scheduleUpdate(): void {
    if (!this.tile || !this.content) return;

    if (this.frameId !== null) cancelAnimationFrame(this.frameId);

    this.frameId = requestAnimationFrame(() => {
      this.frameId = null;
      this.updateHeight(this.tile!, this.content!);
    });
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
    if (this.frameId !== null) cancelAnimationFrame(this.frameId);
  }

  private updateHeight(tile: HTMLElement, content: HTMLElement): void {
    const parent = tile.parentElement;
    if (!parent) return;

    const styles = getComputedStyle(parent);
    const rowSize = this.toPx(styles.getPropertyValue('--plan-row-size').trim() || '8px');
    const gap = this.toPx(styles.rowGap || '0px');

    if (rowSize <= 0) return;

    const height = this.naturalHeight(content);
    const rows = Math.max(1, Math.ceil((height + gap + 2) / (rowSize + gap)));

    if (rows === this.lastRows) return;

    this.lastRows = rows;
    tile.style.setProperty('--tui-height', String(rows));
  }

  private naturalHeight(content: HTMLElement): number {
    const cs = getComputedStyle(content);
    const paddingTop = parseFloat(cs.paddingTop) || 0;
    const paddingBottom = parseFloat(cs.paddingBottom) || 0;
    const rowGap = parseFloat(cs.rowGap) || 0;

    const children = Array.from(content.children) as HTMLElement[];
    const childrenHeight = children.reduce((sum, child) => sum + child.offsetHeight, 0);
    const gapsHeight = rowGap * Math.max(0, children.length - 1);

    return paddingTop + paddingBottom + childrenHeight + gapsHeight;
  }

  private toPx(value: string): number {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
}
