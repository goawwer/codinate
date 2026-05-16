import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  effect,
  forwardRef,
  inject,
  Input,
  OnInit,
  signal,
  viewChild,
  ViewEncapsulation,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ControlValueAccessor, FormControl, NG_VALUE_ACCESSOR } from '@angular/forms';
import {
  provideTuiEditor,
  provideTuiEditorOptions,
  TUI_ATTACH_FILES_LOADER,
  TUI_ATTACH_FILES_OPTIONS,
  TUI_IMAGE_LOADER,
  TuiEditor,
  TuiEditorTool,
} from '@taiga-ui/editor';
import { APP_EDITOR_IMPORTS } from './app-editor.imports';
import { EDITOR_RU_PROVIDER } from './editor-i18n';
import { EditorUploadService, editorFileLoader, editorImageLoader } from './editor-upload.service';
import { User } from '../../features/user/types/model/user.model';

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
    >
      <app-mention-dropdown
        ngProjectAs="mention"
        [mentionSuggestions]="mentionQuery()"
        (selected)="insertMention($event)"
      />
    </tui-editor>
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
      async () => import('@taiga-ui/editor').then(({ TuiMention }) => TuiMention),
    ),
    provideTuiEditorOptions({
      spellcheck: true,
      translate: 'yes',
    }),
  ],
})
export class AppEditorComponent implements ControlValueAccessor, OnInit {
  @Input() placeholder = '';
  @Input() readOnly = false;
  @Input() entityType = 'tasks';
  @Input() entityId: string | null = null;

  protected readonly wysiwyg = viewChild(TuiEditor);
  protected readonly mentionQuery = signal('');
  protected readonly isMentionMode = signal(false);

  protected readonly control = new FormControl('');
  protected readonly tools = [
    TuiEditorTool.Attach,
    TuiEditorTool.Undo,
    TuiEditorTool.Size,
    TuiEditorTool.List,
    TuiEditorTool.Align,
    TuiEditorTool.Italic,
    TuiEditorTool.Strikethrough,
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

  constructor() {
    effect((onCleanup) => {
      const editorComponent = this.wysiwyg();
      if (!editorComponent) return;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let tiptap: any = null;

      const sync = () => {
        if (!tiptap) return;
        const { from } = tiptap.state.selection;
        const before = tiptap.state.doc.textBetween(Math.max(0, from - 100), from, '\n');
        const match = before.match(/(?:^|\s)@([a-zA-Z0-9_.-]*)$/);
        this.mentionQuery.set(match ? match[1] : '');
        this.isMentionMode.set(match !== null);
      };

      const setup = () => {
        if (tiptap) return;
        tiptap = editorComponent.editor?.getOriginTiptapEditor() ?? null;
        if (!tiptap) return;
        tiptap.on('update', sync);
        tiptap.on('selectionUpdate', sync);
      };

      setup();
      const sub = editorComponent.loaded.subscribe(setup);

      onCleanup(() => {
        sub.unsubscribe();
        tiptap?.off('update', sync);
        tiptap?.off('selectionUpdate', sync);
      });
    });
  }

  ngOnInit(): void {
    this.uploadService.entityType = this.entityType;
    this.uploadService.entityId = this.entityId;
  }

  protected insertMention(user: User): void {
    const tiptap = this.wysiwyg()?.editor?.getOriginTiptapEditor();
    if (!tiptap) return;

    const { from, to } = tiptap.state.selection;
    const before = tiptap.state.doc.textBetween(Math.max(0, from - 100), from, '\n');
    const match = before.match(/(?:^|\s)@([a-zA-Z0-9_.-]*)$/);

    if (!match) return;

    const mentionLength = match[1].length + 1;
    const html = `<span class="my-mention" data-type="mention" data-user="${user.id}">@${user.username}</span>&nbsp;`;

    tiptap
      .chain()
      .focus()
      .insertContentAt({ from: from - mentionLength, to }, html)
      .run();
    this.isMentionMode.set(false);
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
