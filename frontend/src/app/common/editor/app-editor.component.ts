import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  forwardRef,
  inject,
  Input,
  OnInit,
  ViewEncapsulation,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ControlValueAccessor, FormControl, NG_VALUE_ACCESSOR } from '@angular/forms';
import {
  provideTuiEditor,
  TUI_ATTACH_FILES_LOADER,
  TUI_ATTACH_FILES_OPTIONS,
  TUI_IMAGE_LOADER,
  TuiEditorTool,
} from '@taiga-ui/editor';
import { APP_EDITOR_IMPORTS } from './app-editor.imports';
import { EDITOR_RU_PROVIDER } from './editor-i18n';
import { EditorUploadService, editorFileLoader, editorImageLoader } from './editor-upload.service';

@Component({
  selector: 'app-editor',
  standalone: true,
  imports: [APP_EDITOR_IMPORTS],
  template: `
    <tui-editor
      [formControl]="control"
      [tools]="tools"
      [placeholder]="placeholder"
      [readOnly]="readOnly"
    />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => AppEditorComponent),
      multi: true,
    },
    EditorUploadService,
    EDITOR_RU_PROVIDER,
    {
      provide: TUI_ATTACH_FILES_OPTIONS,
      useValue: {
        multiple: true,
        accept: '*/*',
      },
    },
    {
      provide: TUI_ATTACH_FILES_LOADER,
      deps: [EditorUploadService],
      useFactory: editorFileLoader,
    },
    {
      provide: TUI_IMAGE_LOADER,
      deps: [EditorUploadService],
      useFactory: editorImageLoader,
    },
    provideTuiEditor(
      {
        image: true,
        iframe: true,
        video: false,
        source: true,
        audio: false,
        details: true,
        detailsSummary: true,
        detailsContent: true,
      },
      async () =>
        import('@taiga-ui/editor').then(({ TuiMarkdown }) =>
          TuiMarkdown.configure({
            html: true,
            tightLists: true,
            tightListClass: 'tight',
            bulletListMarker: '-',
            linkify: true,
            breaks: true,
            transformPastedText: true,
            transformCopiedText: true,
          }),
        ),
    ),
  ],
})
export class AppEditorComponent implements ControlValueAccessor, OnInit {
  @Input() placeholder = '';
  @Input() readOnly = false;
  @Input() entityType = 'tasks';
  @Input() entityId: string | null = null;

  protected readonly control = new FormControl('');
  protected readonly tools = [
    TuiEditorTool.Attach,
    TuiEditorTool.Undo,
    TuiEditorTool.Size,
    TuiEditorTool.List,
    TuiEditorTool.Align,
    TuiEditorTool.Bold,
    TuiEditorTool.CellColor,
    TuiEditorTool.Clear,
    TuiEditorTool.Code,
    TuiEditorTool.Color,
    TuiEditorTool.Table,
    TuiEditorTool.Img,
    TuiEditorTool.Link,
    TuiEditorTool.Quote,
    TuiEditorTool.Details,
  ];

  private onTouched: () => void = () => {};
  private readonly destroyRef = inject(DestroyRef);
  private readonly uploadService = inject(EditorUploadService);

  ngOnInit(): void {
    this.uploadService.entityType = this.entityType;
    this.uploadService.entityId = this.entityId;
  }

  writeValue(value: string): void {
    this.control.setValue(value ?? '', { emitEvent: false });
  }

  registerOnChange(fn: (value: string) => void): void {
    this.control.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((v) => fn(v ?? ''));
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    isDisabled ? this.control.disable() : this.control.enable();
  }
}
