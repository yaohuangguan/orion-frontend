import React, { useState } from 'react';
import { Node, mergeAttributes, nodeInputRule } from '@tiptap/core';
import { NodeViewWrapper, ReactNodeViewRenderer, type NodeViewProps } from '@tiptap/react';
import Drawing from './Drawing';
import { parseStrokes, renderMath, safeEmbed, type Stroke } from './content';

function MathView({ node, updateAttributes, selected }: NodeViewProps) {
  const [editing, setEditing] = useState(false);
  const [source, setSource] = useState(node.attrs.latex);
  return (
    <NodeViewWrapper
      as="span"
      className={`journal-math ${selected ? 'is-selected' : ''}`}
      data-display={String(node.attrs.display)}
      contentEditable={false}
    >
      <button
        type="button"
        className="math-preview"
        title="编辑公式"
        aria-label="编辑公式"
        onClick={() => {
          setSource(node.attrs.latex);
          setEditing(true);
        }}
        dangerouslySetInnerHTML={{ __html: renderMath(node.attrs.latex, node.attrs.display) }}
      />
      {editing && (
        <span className="math-edit" role="group" aria-label="公式源码">
          <textarea
            autoFocus
            aria-label="LaTeX 公式"
            value={source}
            onChange={(e) => setSource(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') setEditing(false);
            }}
          />
          <button
            type="button"
            onClick={() => {
              updateAttributes({ latex: source });
              setEditing(false);
            }}
          >
            保存公式
          </button>
          <button type="button" onClick={() => setEditing(false)}>
            取消
          </button>
        </span>
      )}
    </NodeViewWrapper>
  );
}

export const JournalMath = Node.create({
  name: 'journalMath',
  group: 'inline',
  inline: true,
  atom: true,
  addAttributes() {
    return {
      latex: {
        default: '',
        parseHTML: (el) => el.getAttribute('data-latex'),
        renderHTML: (attrs) => ({ 'data-latex': attrs.latex })
      },
      display: {
        default: false,
        parseHTML: (el) => el.getAttribute('data-display') === 'true',
        renderHTML: (attrs) => ({ 'data-display': String(attrs.display) })
      }
    };
  },
  parseHTML() {
    return [{ tag: 'span[data-type="journal-math"]' }];
  },
  renderHTML({ node, HTMLAttributes }) {
    return [
      'span',
      mergeAttributes(HTMLAttributes, { 'data-type': 'journal-math' }),
      node.attrs.latex
    ];
  },
  addNodeView() {
    return ReactNodeViewRenderer(MathView);
  },
  addInputRules() {
    return [
      nodeInputRule({
        find: /\$\$([^$]+)\$\$$/,
        type: this.type,
        getAttributes: (match) => ({ latex: match[1], display: true })
      }),
      nodeInputRule({
        find: /(?<![\\$])\$([^$\n]+)\$$/,
        type: this.type,
        getAttributes: (match) => ({ latex: match[1], display: false })
      })
    ];
  }
});

function DrawingView({ node, updateAttributes, selected, editor }: NodeViewProps) {
  return (
    <NodeViewWrapper
      className={`journal-drawing-node ${selected ? 'is-selected' : ''}`}
      contentEditable={false}
    >
      <Drawing
        strokes={parseStrokes(node.attrs.strokes)}
        onChange={(strokes: Stroke[]) => updateAttributes({ strokes })}
        title="手写笔记"
      />
      <button
        type="button"
        className="drawing-continue"
        onClick={() =>
          editor
            .chain()
            .focus()
            .insertContentAt(editor.state.selection.to, { type: 'paragraph' })
            .run()
        }
      >
        继续写正文 ↓
      </button>
    </NodeViewWrapper>
  );
}

export const JournalDrawing = Node.create({
  name: 'journalDrawing',
  group: 'block',
  atom: true,
  draggable: true,
  addAttributes() {
    return {
      strokes: {
        default: [],
        parseHTML: (el) => parseStrokes(el.getAttribute('data-strokes')),
        renderHTML: (attrs) => ({ 'data-strokes': JSON.stringify(parseStrokes(attrs.strokes)) })
      }
    };
  },
  parseHTML() {
    return [{ tag: 'figure[data-type="journal-drawing"]' }];
  },
  renderHTML({ HTMLAttributes }) {
    return [
      'figure',
      mergeAttributes(HTMLAttributes, { 'data-type': 'journal-drawing' }),
      '手写笔记'
    ];
  },
  addNodeView() {
    return ReactNodeViewRenderer(DrawingView);
  }
});

export const JournalEmbed = Node.create({
  name: 'journalEmbed',
  group: 'block',
  atom: true,
  addAttributes() {
    return { src: { default: '', parseHTML: (el) => safeEmbed(el.getAttribute('src') || '') } };
  },
  parseHTML() {
    return [
      { tag: 'iframe', getAttrs: (el) => (safeEmbed(el.getAttribute('src') || '') ? {} : false) }
    ];
  },
  renderHTML({ HTMLAttributes }) {
    return [
      'iframe',
      {
        ...HTMLAttributes,
        src: safeEmbed(HTMLAttributes.src),
        title: '嵌入视频',
        sandbox: 'allow-scripts allow-same-origin allow-presentation',
        allowfullscreen: 'true',
        loading: 'lazy'
      }
    ];
  }
});

export const JournalVideo = Node.create({
  name: 'journalVideo',
  group: 'block',
  atom: true,
  draggable: true,
  addAttributes() {
    return { src: { default: '' } };
  },
  parseHTML() {
    return [
      {
        tag: 'video[src]',
        getAttrs: (el) => (/^https:\/\//i.test(el.getAttribute('src') || '') ? {} : false)
      }
    ];
  },
  renderHTML({ HTMLAttributes }) {
    return [
      'video',
      {
        src: /^https:\/\//i.test(HTMLAttributes.src) ? HTMLAttributes.src : '',
        controls: '',
        playsinline: '',
        preload: 'metadata'
      }
    ];
  }
});
