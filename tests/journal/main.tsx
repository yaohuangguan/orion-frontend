import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { JournalSpace } from '../../pages/private/JournalSpace';
import { MemoryRouter, Routes, Route, Outlet } from 'react-router-dom';
import { SimpleEditor } from '../../components/private/SimpleEditor';
import { BlogContent } from '../../components/BlogContent';
import { ProjectShowcase } from '../../components/profile/ProjectShowcase';
import { LanguageProvider } from '../../i18n/LanguageContext';
import * as content from '../../components/journal/content';
import '../../styles/index.css';

Object.assign(window, { journalTest: content });
function Fixture() {
  const [preview, setPreview] = useState({ content: '', title: '' });
  const [key, setKey] = useState(0);
  const [editing, setEditing] = useState<any>(null);
  const [user, setUser] = useState('test-sam');
  return (
    <LanguageProvider>
      <MemoryRouter>
        <div style={{ padding: 16, display: 'flex', gap: 16 }}>
          <button
            onClick={() => {
              document.documentElement.classList.toggle('dark');
            }}
          >
            切换主题
          </button>
          <button onClick={() => setKey(key + 1)}>重新打开</button>
          <button
            onClick={() => {
              setUser('test-partner');
              setEditing(null);
            }}
          >
            切换账号
          </button>
          <button
            onClick={() => {
              setEditing({
                _id: 'saved-entry',
                name: preview.title,
                content: preview.content,
                author: 'Sam',
                tags: ['Test'],
                info: 'test',
                isPrivate: true
              });
              setKey(key + 1);
            }}
          >
            编辑保存内容
          </button>
        </div>
        {location.search.includes('cabin') ? (
          <Routes>
            <Route
              element={
                <Outlet
                  context={{
                    user: { _id: user, displayName: 'Sam', email: 'test@example.invalid' }
                  }}
                />
              }
            >
              <Route path="*" element={<JournalSpace />} />
            </Route>
          </Routes>
        ) : location.search.includes('store') ? (
          <ProjectShowcase />
        ) : (
          <main
            className="journal-space"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 360px), 1fr))',
              gap: 24,
              padding: 16
            }}
          >
            <div style={{ height: 'calc(100vh - 90px)', minHeight: 650 }}>
              <SimpleEditor
                key={`${user}-${key}`}
                user={{ _id: user, displayName: 'Sam', email: 'test@example.invalid' }}
                editingPost={editing}
                onPreviewChange={setPreview}
              />
            </div>
            <div>
              <h1 style={{ fontSize: 28, marginBottom: 20 }}>{preview.title || '日记预览'}</h1>
              <BlogContent content={preview.content} />
            </div>
          </main>
        )}
      </MemoryRouter>
    </LanguageProvider>
  );
}
createRoot(document.getElementById('root')!).render(<Fixture />);
