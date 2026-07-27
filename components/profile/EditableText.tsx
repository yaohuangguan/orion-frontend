import React from 'react';
import { ResumeData, Language } from '../../types';
import { safeKey, renderRichText } from './utils';

interface EditableTextProps {
  path: string;
  label: string;
  value: string;
  isTextArea?: boolean;
  listIndex?: number;
  listField?: string;
  className?: string;
  as?: 'span' | 'h1' | 'h2' | 'h3' | 'p' | 'div' | 'li';
  isVip: boolean;
  isPrint: boolean;
  resume: ResumeData | null;
  setActiveInlineEdit: (edit: {
    path: string;
    label: string;
    value: string;
    isTextArea?: boolean;
    listIndex?: number;
    listField?: string;
  }) => void;
  setInlineEditAnchor: (anchor: HTMLElement | null) => void;
  children?: React.ReactNode;
}

export const EditableText: React.FC<EditableTextProps> = ({
  path,
  label,
  value,
  isTextArea = false,
  listIndex,
  listField,
  className = '',
  as = 'span',
  isVip,
  isPrint,
  resume,
  setActiveInlineEdit,
  setInlineEditAnchor,
  children
}) => {
  const isEditable = isVip && !isPrint;

  const customStyle = resume?.styleSettings?.customStyles?.[safeKey(path)];
  const inlineStyle: React.CSSProperties = {
    fontSize: customStyle?.fontSize || undefined,
    fontWeight: customStyle?.fontWeight || undefined,
    color: customStyle?.color || undefined,
  };

  const handleElementClick = (e: React.MouseEvent<HTMLElement>) => {
    if (!isEditable) return;
    e.stopPropagation();
    setActiveInlineEdit({
      path,
      label,
      value: value || '',
      isTextArea,
      listIndex,
      listField
    });
    setInlineEditAnchor(e.currentTarget);
  };

  const Tag = as;
  const displayValue = value || (isEditable ? `[点击填写 ${label}]` : '');

  return (
    <Tag
      onClick={handleElementClick}
      className={`${className} ${isEditable
          ? 'cursor-pointer hover:bg-slate-100 hover:ring-2 hover:ring-amber-500/50 hover:ring-offset-1 rounded transition-all inline-block duration-150'
          : ''
        } ${isEditable && !value ? 'text-slate-400 border border-dashed border-slate-300 px-1 bg-slate-50' : ''}`}
      style={inlineStyle}
      title={isEditable ? `点击编辑 / Click to edit style & text` : undefined}
    >
      {value ? (children ? children : renderRichText(value)) : displayValue}
    </Tag>
  );
};
