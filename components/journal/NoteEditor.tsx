import React, { useEffect, useRef, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Highlight from '@tiptap/extension-highlight';
import Image from '@tiptap/extension-image';
import { TableKit } from '@tiptap/extension-table';
import TextAlign from '@tiptap/extension-text-align';
import { TextStyleKit } from '@tiptap/extension-text-style';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import {
  Smile,
  Video,
  Bold,
  Italic,
  Strikethrough,
  List,
  ListOrdered,
  Quote,
  Code2,
  Highlighter,
  Undo2,
  Redo2,
  Heading2,
  Heading3,
  ImagePlus,
  PenTool,
  Sigma,
  Link,
  Table,
  ListChecks,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { JournalMath, JournalDrawing, JournalEmbed, JournalVideo } from './extensions';
import { normalizeContent, renderMath, videoFromUrl } from './content';
import { uploadImage } from '../../services/media';
import { toast } from '../Toast';
import StickerPicker from './StickerPicker';
import './journal.css';
import 'katex/dist/katex.min.css';

const uploadKey = new PluginKey<DecorationSet>('journalUploads');
const UploadPlaceholders = Extension.create({
  name: 'journalUploadPlaceholders',
  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: uploadKey,
        state: {
          init: () => DecorationSet.empty,
          apply(tr, previous) {
            let decorations = previous.map(tr.mapping, tr.doc);
            const action = tr.getMeta(uploadKey);
            if (action?.add)
              decorations = decorations.add(
                tr.doc,
                action.add.map(
                  (item: { pos: number; id: string; preview: string }, index: number) => {
                    const widget = document.createElement('span');
                    widget.className = 'journal-upload-placeholder';
                    widget.contentEditable = 'false';
                    const image = document.createElement('img');
                    image.src = item.preview;
                    image.alt = '图片上传中…';
                    widget.append(image);
                    return Decoration.widget(item.pos, widget, { id: item.id, side: index + 1 });
                  }
                )
              );
            if (action?.remove)
              decorations = decorations.remove(
                decorations.find(undefined, undefined, (spec) => spec.id === action.remove)
              );
            return decorations;
          }
        },
        props: { decorations: (state) => uploadKey.getState(state) }
      })
    ];
  }
});

export function NoteEditor({
  initialContent = '',
  onChange,
  placeholder = '写下今天，留住此刻…',
  onBusyChange,
  disabled = false
}: {
  initialContent?: string;
  onChange: (html: string) => void;
  placeholder?: string;
  onBusyChange?: (busy: boolean) => void;
  disabled?: boolean;
}) {
  const callbacks = useRef({ onChange, onBusyChange });
  callbacks.current = { onChange, onBusyChange };
  const [uploading, setUploading] = useState(0);
  const pending = useRef(0);
  const [focus, setFocus] = useState(false);
  const [panel, setPanel] = useState<'math' | 'link' | 'video' | 'stickers' | null>(null);
  const [value, setValue] = useState('');
  const fileInput = useRef<HTMLInputElement>(null);
  const initial = useRef(initialContent);
  const lastEmitted = useRef(initialContent);
  const uploadRef = useRef<(files: File[], pos?: number) => void>(() => {});
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        link: { openOnClick: false, protocols: ['https', 'http', 'mailto'] }
      }),
      Placeholder.configure({ placeholder }),
      Highlight,
      Image.configure({ allowBase64: true }),
      UploadPlaceholders,
      TableKit,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      TextStyleKit,
      TaskList,
      TaskItem.configure({ nested: true }),
      JournalMath,
      JournalDrawing,
      JournalEmbed,
      JournalVideo
    ],
    content: normalizeContent(initial.current),
    shouldRerenderOnTransaction: true,
    editorProps: {
      attributes: {
        class: 'journal-prose',
        'aria-label': '日记正文',
        role: 'textbox',
        'aria-multiline': 'true',
        spellcheck: 'false'
      },
      handlePaste: (view, event) => {
        if (view.state.selection.$from.parent.type.spec.code) return false;
        const files = Array.from(event.clipboardData?.files || []).filter((f) =>
          f.type.startsWith('image/')
        );
        if (files.length) {
          event.preventDefault();
          uploadRef.current(files);
          return true;
        }
        const html = event.clipboardData?.getData('text/html');
        const text = event.clipboardData?.getData('text/plain');
        if (!html && !text) return false;
        event.preventDefault();
        editor?.commands.insertContent(normalizeContent(html || text!, html ? 'html' : 'markdown'));
        return true;
      },
      handleDrop: (view, event, _slice, moved) => {
        const files = Array.from(event.dataTransfer?.files || []).filter((f) =>
          f.type.startsWith('image/')
        );
        if (moved || !files.length) return false;
        event.preventDefault();
        uploadRef.current(
          files,
          view.posAtCoords({ left: event.clientX, top: event.clientY })?.pos
        );
        return true;
      },
      transformPastedHTML: (html) => normalizeContent(html, 'html')
    },
    onUpdate: ({ editor }) => {
      // Upload placeholders never enter persisted drafts or published HTML.
      lastEmitted.current = editor.getHTML();
      callbacks.current.onChange(lastEmitted.current);
    }
  });

  useEffect(() => {
    editor?.setEditable(!disabled);
  }, [editor, disabled]);
  useEffect(() => {
    if (!editor || initialContent === lastEmitted.current || pending.current) return;
    const html = normalizeContent(initialContent);
    if (html !== editor.getHTML()) editor.commands.setContent(html, { emitUpdate: false });
    lastEmitted.current = initialContent;
  }, [editor, initialContent]);
  useEffect(() => {
    const escape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setFocus(false);
        setPanel(null);
      }
    };
    window.addEventListener('keydown', escape);
    return () => window.removeEventListener('keydown', escape);
  }, []);

  uploadRef.current = async (files, position) => {
    if (!editor || disabled) return;
    const accepted = files.filter(
      (file) => file.size <= 10 * 1024 * 1024 && /image\/(png|jpeg|webp|gif|avif)/.test(file.type)
    );
    if (accepted.length !== files.length)
      toast.error('请选择 10 MB 以内的 PNG、JPEG、WebP、GIF 或 AVIF 图片。');
    if (!accepted.length) return;
    pending.current += accepted.length;
    setUploading(pending.current);
    callbacks.current.onBusyChange?.(true);
    const jobs = accepted.map((file) => ({
      file,
      id: crypto.randomUUID(),
      preview: URL.createObjectURL(file)
    }));
    editor.view.dispatch(
      editor.state.tr.setMeta(uploadKey, {
        add: jobs.map((job) => ({ ...job, pos: position ?? editor.state.selection.from }))
      })
    );
    await Promise.all(
      jobs.map(async (job) => {
        let src = '';
        try {
          src = await uploadImage(job.file, { folder: 'journal' });
          if (!/^https?:\/\//i.test(src)) throw new Error('Remote upload did not complete');
        } catch {
          toast.error(`「${job.file.name}」上传失败，请重试；正文已保留。`);
        } finally {
          if (!editor.isDestroyed) {
            const placeholder = uploadKey
              .getState(editor.state)
              ?.find(undefined, undefined, (spec) => spec.id === job.id)[0];
            editor.view.dispatch(editor.state.tr.setMeta(uploadKey, { remove: job.id }));
            if (placeholder && src && /^https?:\/\//i.test(src)) {
              editor.commands.insertContentAt(
                placeholder.from,
                { type: 'image', attrs: { src, alt: job.file.name } },
                { updateSelection: false }
              );
            }
          }
          URL.revokeObjectURL(job.preview);
          pending.current--;
          if (!editor.isDestroyed) {
            setUploading(pending.current);
            if (!pending.current) {
              lastEmitted.current = editor.getHTML();
              callbacks.current.onChange(lastEmitted.current);
              callbacks.current.onBusyChange?.(false);
            }
          }
        }
      })
    );
  };

  if (!editor) return <div role="status">编辑器准备中…</div>;
  const buttons = [
    {
      label: '二级标题',
      Icon: Heading2,
      active: editor.isActive('heading', { level: 2 }),
      run: () => editor.chain().focus().toggleHeading({ level: 2 }).run()
    },
    {
      label: '三级标题',
      Icon: Heading3,
      active: editor.isActive('heading', { level: 3 }),
      run: () => editor.chain().focus().toggleHeading({ level: 3 }).run()
    },
    {
      label: '加粗',
      Icon: Bold,
      active: editor.isActive('bold'),
      run: () => editor.chain().focus().toggleBold().run()
    },
    {
      label: '斜体',
      Icon: Italic,
      active: editor.isActive('italic'),
      run: () => editor.chain().focus().toggleItalic().run()
    },
    {
      label: '删除线',
      Icon: Strikethrough,
      active: editor.isActive('strike'),
      run: () => editor.chain().focus().toggleStrike().run()
    },
    {
      label: '高亮',
      Icon: Highlighter,
      active: editor.isActive('highlight'),
      run: () => editor.chain().focus().toggleHighlight().run()
    },
    {
      label: '无序列表',
      Icon: List,
      active: editor.isActive('bulletList'),
      run: () => editor.chain().focus().toggleBulletList().run()
    },
    {
      label: '有序列表',
      Icon: ListOrdered,
      active: editor.isActive('orderedList'),
      run: () => editor.chain().focus().toggleOrderedList().run()
    },
    {
      label: '待办清单',
      Icon: ListChecks,
      active: editor.isActive('taskList'),
      run: () => editor.chain().focus().toggleTaskList().run()
    },
    {
      label: '引用',
      Icon: Quote,
      active: editor.isActive('blockquote'),
      run: () => editor.chain().focus().toggleBlockquote().run()
    },
    {
      label: '代码块',
      Icon: Code2,
      active: editor.isActive('codeBlock'),
      run: () => editor.chain().focus().toggleCodeBlock().run()
    }
  ];
  const count = editor.getText().length;
  return (
    <div inert={disabled || undefined} className={`journal-editor ${focus ? 'journal-focus' : ''}`}>
      <div className="journal-tools" role="toolbar" aria-label="文字格式">
        <select
          aria-label="字体"
          value={editor.getAttributes('textStyle').fontFamily || ''}
          onChange={(e) =>
            e.target.value
              ? editor.chain().focus().setFontFamily(e.target.value).run()
              : editor.chain().focus().unsetFontFamily().run()
          }
        >
          <option value="">默认字体</option>
          <option value="sans-serif">黑体</option>
          <option value="serif">宋体</option>
          <option value="KaiTi, STKaiti, serif">楷体</option>
          <option value="monospace">等宽</option>
        </select>
        <select
          aria-label="字号"
          value={editor.getAttributes('textStyle').fontSize || ''}
          onChange={(e) =>
            e.target.value
              ? editor.chain().focus().setFontSize(e.target.value).run()
              : editor.chain().focus().unsetFontSize().run()
          }
        >
          <option value="">默认字号</option>
          {[12, 14, 16, 18, 20, 24, 28, 32, 40, 48].map((size) => (
            <option key={size} value={`${size}px`}>
              {size}
            </option>
          ))}
        </select>
        <label className="journal-color" title="文字颜色">
          A
          <input
            type="color"
            aria-label="文字颜色"
            defaultValue="#35443c"
            onChange={(e) => editor.chain().focus().setColor(e.target.value).run()}
          />
        </label>
        <button
          type="button"
          title="恢复默认字体、字号和颜色"
          aria-label="清除文字样式"
          onClick={() =>
            editor.chain().focus().unsetFontFamily().unsetFontSize().unsetColor().run()
          }
        >
          清
        </button>
        <span className="toolbar-divider" />
        {buttons.map(({ label, Icon, active, run }) => (
          <button
            type="button"
            key={label}
            title={label}
            aria-label={label}
            aria-pressed={active}
            disabled={disabled}
            onClick={run}
          >
            <Icon size={17} />
          </button>
        ))}
        <span className="toolbar-divider" />
        <button
          type="button"
          title="插入图片 · 也可粘贴或拖入"
          aria-label="插入图片"
          disabled={disabled}
          onClick={() => fileInput.current?.click()}
        >
          <ImagePlus size={18} />
        </button>
        <button
          type="button"
          title="插入手写画布"
          aria-label="插入手写画布"
          disabled={disabled}
          onClick={() =>
            editor
              .chain()
              .focus()
              .insertContent([{ type: 'journalDrawing' }, { type: 'paragraph' }])
              .run()
          }
        >
          <PenTool size={18} />
        </button>
        <button
          type="button"
          title="插入公式"
          aria-label="插入公式"
          disabled={disabled}
          onClick={() => {
            setValue('');
            setPanel(panel === 'math' ? null : 'math');
          }}
        >
          <Sigma size={18} />
        </button>
        <button
          type="button"
          title="链接"
          aria-label="链接"
          disabled={disabled}
          onClick={() => {
            setValue(editor.getAttributes('link').href || '');
            setPanel(panel === 'link' ? null : 'link');
          }}
        >
          <Link size={17} />
        </button>
        <button
          type="button"
          title="插入表格"
          aria-label="插入表格"
          disabled={disabled}
          onClick={() =>
            editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
          }
        >
          <Table size={17} />
        </button>
        <button
          type="button"
          title="表情包"
          aria-label="表情包"
          aria-pressed={panel === 'stickers'}
          onClick={() => setPanel(panel === 'stickers' ? null : 'stickers')}
        >
          <Smile size={18} />
        </button>
        <button
          type="button"
          title="插入视频"
          aria-label="插入视频"
          onClick={() => {
            setValue('');
            setPanel(panel === 'video' ? null : 'video');
          }}
        >
          <Video size={18} />
        </button>
        <span className="toolbar-divider" />
        <button
          type="button"
          title="撤销"
          aria-label="撤销文字"
          disabled={disabled || !editor.can().undo()}
          onClick={() => editor.chain().focus().undo().run()}
        >
          <Undo2 size={17} />
        </button>
        <button
          type="button"
          title="重做"
          aria-label="重做文字"
          disabled={disabled || !editor.can().redo()}
          onClick={() => editor.chain().focus().redo().run()}
        >
          <Redo2 size={17} />
        </button>
        <button
          type="button"
          title="专注书写 · Esc 退出"
          aria-label={focus ? '退出专注' : '专注书写'}
          aria-pressed={focus}
          onClick={() => setFocus(!focus)}
        >
          {focus ? <Minimize2 size={17} /> : <Maximize2 size={17} />}
        </button>
        <input
          hidden
          ref={fileInput}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif,image/avif"
          multiple
          onChange={(e) => {
            uploadRef.current(Array.from(e.target.files || []));
            e.target.value = '';
          }}
        />
      </div>
      {editor.isActive('table') && (
        <div className="journal-table-tools">
          <button type="button" onClick={() => editor.chain().focus().addRowAfter().run()}>
            ＋ 行
          </button>
          <button type="button" onClick={() => editor.chain().focus().addColumnAfter().run()}>
            ＋ 列
          </button>
          <button type="button" onClick={() => editor.chain().focus().deleteRow().run()}>
            删除行
          </button>
          <button type="button" onClick={() => editor.chain().focus().deleteColumn().run()}>
            删除列
          </button>
          <button type="button" onClick={() => editor.chain().focus().deleteTable().run()}>
            删除表格
          </button>
        </div>
      )}
      {panel === 'stickers' && (
        <StickerPicker
          close={() => setPanel(null)}
          upload={() => fileInput.current?.click()}
          insert={(text, name) => {
            if (name) editor.chain().focus().setImage({ src: text, alt: name }).run();
            else editor.chain().focus().insertContent(text).run();
          }}
        />
      )}
      {panel && panel !== 'stickers' && (
        <div className="journal-insert-panel">
          <label>
            {panel === 'math'
              ? 'LaTeX 公式'
              : panel === 'video'
                ? '视频链接 · YouTube / Bilibili / Vimeo / MP4 / WebM'
                : '链接地址'}
            <input
              autoFocus
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={
                panel === 'math'
                  ? String.raw`P(\text{mW}) = 10^{\frac{\text{dBm}}{10}}`
                  : 'https://…'
              }
            />
          </label>
          {panel === 'math' && value && (
            <div
              className="journal-prose"
              dangerouslySetInnerHTML={{ __html: renderMath(value, true) }}
            />
          )}
          <button
            type="button"
            disabled={disabled}
            onClick={() => {
              if (panel === 'math' && value.trim())
                editor
                  .chain()
                  .focus()
                  .insertContent({
                    type: 'journalMath',
                    attrs: { latex: value.replace(/^\$\$|\$\$$/g, '').trim(), display: true }
                  })
                  .run();
              else if (panel === 'video') {
                const video = videoFromUrl(value);
                if (!video) {
                  toast.error(
                    '请输入完整的 HTTPS 视频链接，支持 YouTube、Bilibili、Vimeo 或 MP4 / WebM / OGG 直链。'
                  );
                  return;
                }
                editor
                  .chain()
                  .focus()
                  .insertContent([video, { type: 'paragraph' }])
                  .run();
              } else if (panel === 'link') {
                if (!value) editor.chain().focus().extendMarkRange('link').unsetLink().run();
                else if (/^(https?:\/\/|mailto:)/i.test(value))
                  editor.chain().focus().extendMarkRange('link').setLink({ href: value }).run();
                else {
                  toast.error('请输入 https://、http:// 或 mailto: 链接');
                  return;
                }
              }
              setPanel(null);
            }}
          >
            插入
          </button>
          <button type="button" onClick={() => setPanel(null)}>
            取消
          </button>
        </div>
      )}
      <div className="journal-writing-scroll">
        <EditorContent editor={editor} />
      </div>
      <div className="journal-status" role="status">
        <span>
          {uploading
            ? `正在上传 ${uploading} 张图片…`
            : `${count} 字 · 约 ${Math.max(1, Math.ceil(count / 400))} 分钟阅读`}
        </span>
        <span>Markdown · 粘贴图片 · LaTeX · 手写</span>
      </div>
    </div>
  );
}
